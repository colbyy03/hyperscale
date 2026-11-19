/**
 * Stride explorer: a 3×4 int32 array and its one flat memory buffer. Pick an operation and see the
 * new shape and strides, which buffer cells the result reads, and whether NumPy had to copy.
 * Values were checked against NumPy 2.4 (strides, offsets, contiguity, shares_memory).
 */
import clsx from "clsx";
import { useState } from "react";

const ITEM = 4; // int32
const BASE = Array.from({ length: 12 }, (_, i) => i);

interface Op {
  code: string;
  shape: number[];
  /** Strides in bytes, or null when NumPy returns a copy. */
  strides: number[] | null;
  offset: number; // bytes
  values?: number[]; // the copy's contents, in its own new buffer
  note: string;
  c: boolean;
  f: boolean;
}

const OPS: Op[] = [
  { code: "a", shape: [3, 4], strides: [16, 4], offset: 0, c: true, f: false, note: "The original: rows are 16 bytes apart (4 elements × 4 bytes), neighbours in a row 4 bytes apart." },
  { code: "a.T", shape: [4, 3], strides: [4, 16], offset: 0, c: false, f: true, note: "Transpose copies nothing: it swaps the strides. The same buffer is now read column by column." },
  { code: "a[:, ::2]", shape: [3, 2], strides: [16, 8], offset: 0, c: false, f: false, note: "A step of 2 doubles the column stride. Still a view: it skips cells instead of copying them." },
  { code: "a[1:, 1:3]", shape: [2, 2], strides: [16, 4], offset: 20, c: false, f: false, note: "A slice moves the starting point (20 bytes = row 1, column 1) and keeps the strides." },
  { code: "a.reshape(4, 3)", shape: [4, 3], strides: [12, 4], offset: 0, c: true, f: false, note: "Reshaping contiguous data is just new strides over the same bytes." },
  { code: "a.ravel()", shape: [12], strides: [4], offset: 0, c: true, f: true, note: "Already contiguous, so ravel returns a view." },
  { code: "a.T.ravel()", shape: [12], strides: null, offset: 0, values: [0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11], c: true, f: true, note: "No single stride can walk the buffer in this order, so NumPy copies into a new buffer." },
  { code: "a[[0, 2]]", shape: [2, 4], strides: null, offset: 0, values: [0, 1, 2, 3, 8, 9, 10, 11], c: true, f: false, note: "Fancy indexing (a list of indices) always copies, even when a slice could have described it." },
];

function cellsOf(op: Op): number[][] {
  const [r, c = 1] = op.shape.length === 1 ? [op.shape[0]!, 1] : op.shape;
  const grid: number[][] = [];
  for (let i = 0; i < r!; i++) {
    const row: number[] = [];
    for (let j = 0; j < c; j++) {
      if (op.strides) {
        const s0 = op.strides[0]!;
        const s1 = op.strides[1] ?? 0;
        row.push((op.offset + i * s0 + j * s1) / ITEM);
      } else {
        row.push(op.values![i * c + j]!);
      }
    }
    grid.push(row);
  }
  return op.shape.length === 1 ? [grid.map((row) => row[0]!)] : grid;
}

export default function StrideExplorer() {
  const [k, setK] = useState(0);
  const op = OPS[k]!;
  const grid = cellsOf(op);
  const used = new Set(grid.flat());
  const isCopy = op.strides === null;

  return (
    <div className="rounded-2xl border border-line bg-surface p-4" data-testid="viz-strides">
      <div className="mb-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Operation">
        {OPS.map((o, i) => (
          <button
            key={o.code}
            role="radio"
            aria-checked={i === k}
            onClick={() => setK(i)}
            className={clsx("rounded-lg border px-2 py-1 font-mono text-xs transition-colors", i === k ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:border-line-strong")}
          >
            {o.code}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div>
          <div className="mb-1 text-xs text-faint">
            <span className="font-mono text-ink">{op.code}</span> · shape ({op.shape.join(", ")}{op.shape.length === 1 ? "," : ""})
          </div>
          <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${grid[0]!.length}, minmax(0, 2.25rem))` }}>
            {grid.flat().map((v, i) => (
              <div key={i} className={clsx("flex h-9 items-center justify-center rounded-md border font-mono text-sm tabular-nums", isCopy ? "border-heat/50 bg-heat-soft" : "border-accent/50 bg-accent-soft")}>
                {v}
              </div>
            ))}
          </div>
        </div>
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] content-start gap-x-3 gap-y-1 text-sm">
          <dt className="text-faint">strides</dt>
          <dd className="font-mono tabular-nums" data-testid="strides-value">
            {op.strides ? `(${op.strides.join(", ")})` : "new buffer"}
          </dd>
          <dt className="text-faint">offset</dt>
          <dd className="font-mono tabular-nums">{op.strides ? `${op.offset} bytes` : "–"}</dd>
          <dt className="text-faint">result</dt>
          <dd className={clsx("font-medium", isCopy ? "text-heat" : "text-accent")}>{isCopy ? "copy" : "view (shares memory)"}</dd>
          <dt className="text-faint">contiguous</dt>
          <dd className="text-muted">{op.c && op.f ? "C and F" : op.c ? "C (row-major)" : op.f ? "F (column-major)" : "neither"}</dd>
        </dl>
      </div>

      <div className="mt-4">
        <div className="mb-1 text-xs text-faint">The original buffer: 12 int32 values, 4 bytes each, laid out one after another</div>
        <div className="grid grid-cols-12 gap-0.5">
          {BASE.map((v) => (
            <div key={v} className={clsx("flex h-8 flex-col items-center justify-center rounded border font-mono text-[11px] tabular-nums", !isCopy && used.has(v) ? "border-accent bg-accent-soft text-ink" : "border-line text-faint")}>
              {v}
              <span className="text-[8px] text-faint">{v * ITEM}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-muted">{op.note}</p>
    </div>
  );
}
