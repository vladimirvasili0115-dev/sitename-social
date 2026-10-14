import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Lists every picture put into public/custom (made once at build time), so the game knows which own pictures exist.
export const dynamic = "force-static";

function walk(dir: string, root: string, out: string[]) {
  let names: string[] = [];
  try { names = readdirSync(dir); } catch { return out; }
  for (const name of names) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, root, out);
    else if (/\.(png|webp|jpe?g|gif)$/i.test(name)) out.push(relative(root, path).split("\\").join("/"));
  }
  return out;
}

export function GET() {
  const root = join(process.cwd(), "public", "custom");
  return Response.json(walk(root, root, []));
}
