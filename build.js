// Programming with Natural Language — static site generator
// Authored by Karter with Claude Opus 4.8
//
// The site mirrors the user/ folder like a file browser. Every subfolder of
// user/ is a collection served at /<folder> (its index) and /<folder>/<slug>.html
// (one page per markdown file). Routes, headings, and the sidebar tree are all
// derived from folder names — nothing is hardcoded. The whole site is built here.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

const ROOT = __dirname;
const USER_DIR = path.join(ROOT, 'user'); // all hand-authored content lives here
const DIST = path.join(ROOT, 'dist');
const SITE_TITLE = 'kwhitman.dev';

// Per-build version, appended to the stylesheet URL to bust browser caching.
const BUILD = Date.now();

// The collections, discovered from user/'s subfolders in build() before any
// page renders so the sidebar (shown on every page) can list them all. Each is
// { name, href, heading, entries }.
let collections = [];

// Folder name → display heading: "natural-language" → "Natural Language".
function titleCase(name) {
  return name
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

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
  const sections = collections.map(c => {
    const items = c.entries.map(e => ({
      label: e.title,
      href: `/${c.name}/${e.slug}.html`,
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

// Home page: just a big hello. Navigation lives in the sidebar.
function renderHome() {
  const body = `<section class="home">
<h1 class="home-hello">hello</h1>
</section>`;
  return layout({ title: SITE_TITLE, body });
}

// Listing page for any collection: every entry, newest first. Dates are shown
// when present.
function renderIndex(collection) {
  const items = collection.entries.map(e => {
    const time = e.date
      ? `<time datetime="${isoDate(e.date)}">${isoDate(e.date)}</time>`
      : '';
    return `<div class="post-preview">
<a href="/${collection.name}/${e.slug}.html">
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

// Read user/<name>/*.md into entries, newest first. Date is optional; undated
// entries keep their file order after any dated ones.
function loadCollection(name) {
  const dir = path.join(USER_DIR, name);
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

// Every subfolder of user/ is a collection, in alphabetical (file-browser)
// order. Loose files at user/'s top level (e.g. post-template.md) are ignored —
// only folders become sections. Hidden dot-folders are skipped.
function discoverCollections() {
  if (!fs.existsSync(USER_DIR)) return [];
  return fs.readdirSync(USER_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name)
    .sort()
    .map(name => ({
      name,
      href: `/${name}`,
      heading: titleCase(name),
      entries: loadCollection(name),
    }));
}

function build() {
  // Start from a clean dist/ every time.
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  // Discover collections first so the sidebar can list all of them on any page.
  collections = discoverCollections();

  let total = 0;
  for (const c of collections) {
    fs.mkdirSync(path.join(DIST, c.name), { recursive: true });
    for (const entry of c.entries) {
      fs.writeFileSync(
        path.join(DIST, c.name, `${entry.slug}.html`),
        renderEntry(entry, c),
      );
    }
    fs.writeFileSync(
      path.join(DIST, c.name, 'index.html'),
      renderIndex(c),
    );
    total += c.entries.length;
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

  console.log(`Built ${total} entr${total === 1 ? 'y' : 'ies'} across ${collections.length} collection(s) → dist/`);
}

build();
