// Dev server: auto-rebuild + live reload. Tooling, not part of the site.
// Authored by Karter with Claude Opus 4.8.
//
// Serves dist/ over HTTP, watches user/, style.css, and build.js, rebuilds on
// any change, and pushes a reload to the browser over Server-Sent Events. No
// dependencies — Node's http/fs only. Run with `npm run dev`.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const PORT = process.env.PORT || 3000;
const WATCH = ['user', 'style.css', 'build.js']; // sources that trigger a rebuild

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

// Injected into every HTML page: an SSE client that reloads on a rebuild.
const LIVE_RELOAD = `<script>
(function () {
  new EventSource('/__livereload').onmessage = function () { location.reload(); };
})();
</script>`;

let clients = []; // open SSE responses to notify on rebuild

function build() {
  try {
    execFileSync('node', ['build.js'], { cwd: ROOT, stdio: 'inherit' });
    return true;
  } catch (e) {
    console.error('Build failed:', e.message);
    return false;
  }
}

// Debounce bursts of fs events (one save often fires several).
let timer = null;
function scheduleRebuild() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (build()) for (const res of clients) res.write('data: reload\n\n');
  }, 100);
}

function serveFile(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  let filePath = path.join(DIST, urlPath);
  // Extensionless URLs (e.g. /blog/foo) fall back to the .html file.
  if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) filePath += '.html';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404</h1>');
      return;
    }
    const ext = path.extname(filePath);
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' };
    // Inject the live-reload client into HTML right before </body>.
    const out = ext === '.html'
      ? data.toString().replace('</body>', LIVE_RELOAD + '\n</body>')
      : data;
    res.writeHead(200, headers);
    res.end(out);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === '/__livereload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('\n');
    clients.push(res);
    req.on('close', () => { clients = clients.filter(c => c !== res); });
    return;
  }
  serveFile(req, res);
});

build(); // first build before serving
for (const target of WATCH) {
  fs.watch(path.join(ROOT, target), { recursive: true }, scheduleRebuild);
}
server.listen(PORT, () => {
  console.log(`Dev server on http://localhost:${PORT} — watching ${WATCH.join(', ')}`);
});
