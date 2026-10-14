// Stand-in for Firestore + Firebase Hosting, for end-to-end tests only.
// Serves the dashboard, a fake Firebase SDK at the reserved /__/firebase/ URLs, and a tiny JSON document store.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, "../../portfolio");
const data = {};          // { collection: { id: doc } }
const listeners = new Set();
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".webp": "image/webp", ".json": "application/json" };

function apply(ops) {
  for (const { col, id, doc, merge } of ops) {
    data[col] ??= {};
    data[col][id] = merge ? { ...(data[col][id] || {}), ...doc } : { ...doc };
  }
  for (const res of listeners) res.write(`data: ${JSON.stringify(ops.map(o => o.col))}\n\n`);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const body = async () => { let b = ""; for await (const c of req) b += c; return b ? JSON.parse(b) : null; };
  try {
    if (url.pathname === "/db/events") {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
      res.write(": ok\n\n"); listeners.add(res); req.on("close", () => listeners.delete(res)); return;
    }
    if (url.pathname === "/db/batch" && req.method === "POST") { apply(await body()); res.end("{}"); return; }
    if (url.pathname.startsWith("/db/col/")) {
      const col = decodeURIComponent(url.pathname.slice(8));
      res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(data[col] || {})); return;
    }
    if (url.pathname === "/db/dump") { res.end(JSON.stringify(data)); return; }
    if (url.pathname.startsWith("/__/firebase/")) {
      res.writeHead(200, { "content-type": "text/javascript" });
      res.end(url.pathname.endsWith("firebase-app-compat.js") ? await readFile(join(here, "fake-firebase.js")) : "");
      return;
    }
    let p = url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname;
    const file = await readFile(join(site, p));
    res.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); res.end(file);
  } catch (e) { res.writeHead(404); res.end(String(e.message)); }
});

export function start(port = 0) {
  return new Promise(r => server.listen(port, "127.0.0.1", () => r({ url: `http://127.0.0.1:${server.address().port}`, close: () => { listeners.forEach(l => l.end()); server.close(); }, data })));
}
