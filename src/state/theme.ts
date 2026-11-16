import { useEffect } from "react";
import type { Theme } from "./settings";

/** Resolve "system" against the OS preference and apply it to <html data-theme>. */
export function applyTheme(theme: Theme): void {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const resolved = dark ? "dark" : "light";
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#0b1016" : "#f6f8fa");
  try {
    localStorage.setItem("hs-theme", theme); // read by the inline script in index.html before first paint
  } catch {
    /* storage may be unavailable (private mode); the theme still applies for this session */
  }
}

export function useApplyTheme(theme: Theme): void {
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);
}
