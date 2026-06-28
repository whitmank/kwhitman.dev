// Programming with Natural Language — static site generator
// Authored by Karter with Claude Opus 4.8
//
// Reads posts/*.md, renders each to dist/posts/<slug>.html, and writes an
// index listing every post newest-first. The whole site is built by this file.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

const ROOT = __dirname;
const USER_DIR = path.join(ROOT, 'user'); // all hand-authored content lives here
const DIST = path.join(ROOT, 'dist');
const SITE_TITLE = 'kwhitman.dev';

// Content collections. Each is a folder of markdown under user/<src>/, rendered
// to one page per entry plus an index listing. Add a content type by adding a
// row here — no other code changes. Fields:
//   src      — folder under user/ to read *.md from
//   pageDir  — dist/<pageDir>/<slug>.html for each entry page
//   indexDir — dist/<indexDir>/index.html for the listing page
//   href     — URL of that listing (also the sidebar nav link)
//   heading  — listing heading and sidebar nav label
const COLLECTIONS = [
  { src: 'posts',    pageDir: 'posts',    indexDir: 'blog',     href: '/blog',     heading: 'Posts' },
  { src: 'projects', pageDir: 'projects', indexDir: 'projects', href: '/projects', heading: 'Projects' },
];

// Per-build version, appended to the stylesheet URL to bust browser caching.
const BUILD = Date.now();

// slug -> entries[], populated in build() before any page renders so the
// sidebar (shown on every page) can list every collection.
const entriesBySrc = {};

// Escape text destined for HTML.
function esc(s) {
  return String(s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Terminal `tree`-style list of links for the sidebar. Each item is
// { label, href }. Connector lines are drawn in CSS (see .tree in style.css)
// so the vertical stays continuous at any spacing.
function renderTree(items) {
  const rows = items.map(({ label, href }) =>
    `<li><a href="${esc(href)}" title="${esc(label)}">${esc(label)}</a></li>`
  ).join('\n');
  return `<ul class="tree">
${rows}
</ul>`;
}

// The left sidebar: site title + each collection's directory, expanded into a
// tree of its contents. Identical on every page.
function renderSidebar() {
  const sections = COLLECTIONS.map(c => {
    const items = (entriesBySrc[c.src] || []).map(e => ({
      label: e.title,
      href: `/${c.pageDir}/${e.slug}.html`,
    }));
    return `<a href="${esc(c.href)}" class="nav-link">${esc(c.href)}</a>
${renderTree(items)}`;
  }).join('\n');
  return `<aside class="sidebar">
<a href="/" class="site-title">${esc(SITE_TITLE)}</a>
<nav>
${sections}
</nav>
</aside>`;
}

// gray-matter parses YAML dates into Date objects; strings are accepted too.
function isoDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Shared page shell: site-title header, main content, footer.
// All styling lives in /style.css.
function layout({ title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="/style.css?v=${BUILD}">
</head>
<body>
<div class="layout">
<button class="sidebar-tab" type="button" aria-label="Open navigation"><span class="chev">›</span></button>
${renderSidebar()}
<main>
${body}
</main>
</div>
<script>
(function () {
  var layout = document.querySelector('.layout');
  var sidebar = document.querySelector('.sidebar');
  var tab = document.querySelector('.sidebar-tab');
  if (!layout || !sidebar || !tab) return;
  tab.addEventListener('click', function (e) {
    e.stopPropagation();
    layout.classList.toggle('open');
  });
  document.addEventListener('click', function (e) {
    if (!sidebar.contains(e.target)) layout.classList.remove('open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') layout.classList.remove('open');
  });
})();
</script>
</body>
</html>
`;
}

// One entry page for any collection. The date is optional — undated content
// (e.g. projects) simply omits the <time> line.
function renderEntry(entry, collection) {
  const time = entry.date
    ? `<time datetime="${isoDate(entry.date)}">${isoDate(entry.date)}</time>`
    : '';
  const body = `<article class="post">
<header class="post-header">
<h1>${esc(entry.title)}</h1>
${time}
</header>
<div class="post-content">
${entry.html}
</div>
<footer class="post-footer">
<a href="${esc(collection.href)}">← Back to ${esc(collection.heading.toLowerCase())}</a>
</footer>
</article>`;
  return layout({ title: `${entry.title} — ${SITE_TITLE}`, body });
}

// Home page: redirect to /blog for now (keeps the / route alive).
function renderHome() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=/blog">
<link rel="canonical" href="/blog">
<title>${esc(SITE_TITLE)}</title>
</head>
<body>
<p>Redirecting to <a href="/blog">/blog</a>…</p>
</body>
</html>
`;
}

// Listing page for any collection: every entry, newest first. Dates are shown
// when present.
function renderIndex(collection, entries) {
  const items = entries.map(e => {
    const time = e.date
      ? `<time datetime="${isoDate(e.date)}">${isoDate(e.date)}</time>`
      : '';
    return `<div class="post-preview">
<a href="/${collection.pageDir}/${e.slug}.html">
<h2>${esc(e.title)}</h2>
${time}
</a>
</div>`;
  }).join('\n');
  const body = `<section class="posts-list">
<h1>${esc(collection.heading)}</h1>
<div class="posts-container">
${items}
</div>
</section>`;
  return layout({ title: `${collection.heading} — ${SITE_TITLE}`, body });
}

// Read user/<src>/*.md into entries, newest first. Date is optional; undated
// entries keep their file order after any dated ones.
function loadCollection(src) {
  const dir = path.join(USER_DIR, src);
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(f => f.endsWith('.md'))
    : [];

  const entries = files.map(file => {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    const { data, content } = matter(raw);
    return {
      slug: file.replace(/\.md$/, ''),
      title: data.title || file,
      date: data.date || null,
      html: md.render(content),
    };
  });

  // Newest first; undated entries (date null → 0) fall to the end.
  entries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  return entries;
}

function build() {
  // Start from a clean dist/ every time.
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // Load every collection first so the sidebar can list all of them on any page.
  for (const c of COLLECTIONS) entriesBySrc[c.src] = loadCollection(c.src);

  let total = 0;
  for (const c of COLLECTIONS) {
    const entries = entriesBySrc[c.src];
    fs.mkdirSync(path.join(DIST, c.pageDir), { recursive: true });
    fs.mkdirSync(path.join(DIST, c.indexDir), { recursive: true });
    for (const entry of entries) {
      fs.writeFileSync(
        path.join(DIST, c.pageDir, `${entry.slug}.html`),
        renderEntry(entry, c),
      );
    }
    fs.writeFileSync(
      path.join(DIST, c.indexDir, 'index.html'),
      renderIndex(c, entries),
    );
    total += entries.length;
  }

  fs.writeFileSync(path.join(DIST, 'index.html'), renderHome());
  fs.copyFileSync(path.join(ROOT, 'style.css'), path.join(DIST, 'style.css'));

  // Tell `npx serve` to send no-cache headers so local previews are never
  // stale. (Cloudflare ignores this file; it manages caching at the edge.)
  fs.writeFileSync(
    path.join(DIST, 'serve.json'),
    JSON.stringify({
      headers: [
        { source: '**', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
      ],
    }, null, 2),
  );

  console.log(`Built ${total} entr${total === 1 ? 'y' : 'ies'} across ${COLLECTIONS.length} collection(s) → dist/`);
}

build();
