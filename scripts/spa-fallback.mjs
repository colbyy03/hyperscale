// GitHub Pages has no SPA rewrites: serving index.html as 404.html makes deep links
// like /hyperscale/learn/induction load the app, which then routes client-side.
import { copyFileSync, existsSync } from "node:fs";

if (!existsSync("dist/index.html")) {
  console.error("dist/index.html not found; run vite build first");
  process.exit(1);
}
copyFileSync("dist/index.html", "dist/404.html");
console.log("wrote dist/404.html");
