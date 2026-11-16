/** Service-worker registration with an in-app "update available" prompt (no browser dialogs). */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

type UpdateFn = (reload?: boolean) => Promise<void>;

let updateSW: UpdateFn | undefined;
const listeners = new Set<(ready: boolean) => void>();

export async function registerServiceWorker(): Promise<void> {
  if (import.meta.env.DEV || !("serviceWorker" in navigator)) return;
  const { registerSW } = await import("virtual:pwa-register");
  updateSW = registerSW({
    onNeedRefresh() {
      listeners.forEach((l) => l(true));
    },
  });
}

export function UpdatePrompt() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    listeners.add(setReady);
    return () => {
      listeners.delete(setReady);
    };
  }, []);
  if (!ready) return null;
  return (
    <div className="fixed right-4 bottom-20 z-40 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-sm shadow-card md:bottom-6">
      <span>A new version of Hyperscale is ready.</span>
      <Button variant="primary" onClick={() => void updateSW?.(true)}>
        Reload
      </Button>
      <Button variant="ghost" onClick={() => setReady(false)}>
        Later
      </Button>
    </div>
  );
}
