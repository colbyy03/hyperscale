/**
 * App-side client for the Python worker. One shared worker; requests are serialized.
 * A request that runs past its timeout (an infinite loop, say) terminates the worker;
 * the next request starts a fresh one (warm restart from the browser cache).
 */
import { useSyncExternalStore } from "react";
import type { GradeResult, RunResult, WorkerRequest, WorkerResponse } from "./protocol";

export class PythonTimeoutError extends Error {
  constructor(seconds: number) {
    super(`Your code ran for more than ${seconds} s and was stopped. Look for an infinite loop or a very slow Python-level loop.`);
    this.name = "PythonTimeoutError";
  }
}

/** Omit that distributes over a union (plain Omit collapses a union to its common keys). */
type RequestBody = WorkerRequest extends infer R ? (R extends unknown ? Omit<R, "id"> : never) : never;

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void; timer?: ReturnType<typeof setTimeout> };

type Status = { phase: "idle" | "starting" | "ready" | "busy"; message: string };

const INIT_TIMEOUT_MS = 180_000;

class PythonRuntime {
  /** "grader" loads NumPy and pytest for exercises; "sim" starts bare for the simulator. */
  constructor(private readonly mode: "grader" | "sim" = "grader") {}
  private worker: Worker | null = null;
  private pending = new Map<number, Pending>();
  private nextId = 1;
  private queue: Promise<unknown> = Promise.resolve();
  private status: Status = { phase: "idle", message: "Python not started" };
  private listeners = new Set<() => void>();
  private initPromise: Promise<void> | null = null;

  getStatus = (): Status => this.status;
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  private setStatus(s: Status) {
    this.status = s;
    this.listeners.forEach((l) => l());
  }

  private spawn(): Worker {
    const w = new Worker(new URL("./python.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if ("status" in msg) {
        this.setStatus({ phase: msg.status === "Python ready" ? "ready" : "starting", message: msg.status });
        return;
      }
      const p = this.pending.get(msg.id);
      if (!p) return;
      clearTimeout(p.timer);
      this.pending.delete(msg.id);
      if (msg.ok) p.resolve(msg.result);
      else p.reject(new Error(msg.error));
    };
    w.onerror = (e) => {
      for (const [id, p] of this.pending) {
        clearTimeout(p.timer);
        p.reject(new Error(e.message || "Python worker crashed"));
        this.pending.delete(id);
      }
      this.reset();
    };
    this.worker = w;
    return w;
  }

  private reset() {
    this.worker?.terminate();
    this.worker = null;
    this.initPromise = null;
    this.setStatus({ phase: "idle", message: "Python restarted" });
  }

  private send<T>(req: RequestBody, timeoutMs: number): Promise<T> {
    const worker = this.worker ?? this.spawn();
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        this.reset();
        reject(new PythonTimeoutError(Math.round(timeoutMs / 1000)));
      }, timeoutMs);
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
      worker.postMessage({ ...req, id } as WorkerRequest);
    });
  }

  /** Start Python in the background (call when a lesson with code opens). */
  warm(): Promise<void> {
    this.initPromise ??= this.send<boolean>({ type: "init", mode: this.mode }, INIT_TIMEOUT_MS).then(
      () => undefined,
      (e: Error) => {
        this.initPromise = null;
        throw e;
      },
    );
    if (this.status.phase === "idle") this.setStatus({ phase: "starting", message: "Starting Python…" });
    return this.initPromise;
  }

  private serialize<T>(task: () => Promise<T>): Promise<T> {
    const next = this.queue.then(task, task);
    this.queue = next.catch(() => undefined);
    return next;
  }

  run(code: string, packages: string[] = [], timeoutMs = 10_000): Promise<RunResult> {
    return this.serialize(async () => {
      await this.warm();
      // Package downloads get a generous timeout of their own; the run itself gets the tight one.
      await this.send<void>({ type: "load", packages, code }, INIT_TIMEOUT_MS);
      this.setStatus({ phase: "busy", message: "Running…" });
      try {
        return await this.send<RunResult>({ type: "run", code, packages }, timeoutMs);
      } finally {
        if (this.worker) this.setStatus({ phase: "ready", message: "Python ready" });
      }
    });
  }

  grade(solution: string, tests: string, packages: string[] = [], timeoutMs = 10_000): Promise<GradeResult> {
    return this.serialize(async () => {
      await this.warm();
      await this.send<void>({ type: "load", packages: ["pytest", ...packages], code: `${solution}\n${tests}` }, INIT_TIMEOUT_MS);
      this.setStatus({ phase: "busy", message: "Checking…" });
      try {
        return await this.send<GradeResult>({ type: "grade", solution, tests, packages }, timeoutMs + 5_000);
      } finally {
        if (this.worker) this.setStatus({ phase: "ready", message: "Python ready" });
      }
    });
  }

  /** One JSON request to the simulator bridge (hyperscale_sim.bridge.handle). */
  sim<T>(request: Record<string, unknown>, timeoutMs = 60_000): Promise<T> {
    return this.serialize(async () => {
      await this.warm();
      const text = await this.send<string>({ type: "sim", request: JSON.stringify(request) }, timeoutMs);
      return JSON.parse(text) as T;
    });
  }
}

export const python = new PythonRuntime("grader");
/** A separate worker for the Control Room, so a long simulation never blocks grading (or vice versa). */
export const simPython = new PythonRuntime("sim");

export type { Status as PythonStatus, PythonRuntime };

export function usePythonStatus(runtime: PythonRuntime = python): Status {
  return useSyncExternalStore(runtime.subscribe, runtime.getStatus, runtime.getStatus);
}
