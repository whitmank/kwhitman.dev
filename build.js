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
const POSTS_DIR = path.join(ROOT, 'posts');
const DIST = path.join(ROOT, 'dist');
const SITE_TITLE = 'kwhitman.dev';

// Projects, in display order. Single source for the sidebar tree and /projects.
const PROJECTS = ['audio-comments', 'text-globe'];

// Per-build version, appended to the stylesheet URL to bust browser caching.
const BUILD = Date.now();

// Populated in build(); the sidebar tree under /blog reads from it.
let allPosts = [];

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

// The left sidebar: site title + the /blog and /projects directories, each
// expanded into a tree of its contents. Identical on every page.
function renderSidebar() {
  const postItems = allPosts.map(p => ({
    label: p.title,
    href: `/posts/${p.slug}.html`,
  }));
  const projectItems = PROJECTS.map(name => ({
    label: name,
    href: `/projects/${name}.html`,
  }));
  return `<aside class="sidebar">
<a href="/" class="site-title">${esc(SITE_TITLE)}</a>
<nav>
<a href="/blog" class="nav-link">/blog</a>
${renderTree(postItems)}
<a href="/projects" class="nav-link">/projects</a>
${renderTree(projectItems)}
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

function renderPost(post) {
  const body = `<article class="post">
<header class="post-header">
<h1>${esc(post.title)}</h1>
<time datetime="${isoDate(post.date)}">${isoDate(post.date)}</time>
</header>
<div class="post-content">
${post.html}
</div>
<footer class="post-footer">
<a href="/blog">← Back to posts</a>
</footer>
</article>`;
  return layout({ title: `${post.title} — ${SITE_TITLE}`, body });
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

// Projects index at /projects: lists the projects, each linking to its page.
function renderProjects() {
  const items = PROJECTS.map(name =>
    `<div class="post-preview">
<a href="/projects/${name}.html">
<h2>${esc(name)}</h2>
</a>
</div>`
  ).join('\n');
  const body = `<section class="posts-list">
<h1>Projects</h1>
<div class="posts-container">
${items}
</div>
</section>`;
  return layout({ title: `Projects — ${SITE_TITLE}`, body });
}

// Individual project page (placeholder content for now).
function renderProject(name) {
  const body = `<article class="post">
<header class="post-header">
<h1>${esc(name)}</h1>
</header>
<div class="post-content">
<p>coming soon</p>
</div>
</article>`;
  return layout({ title: `${name} — ${SITE_TITLE}`, body });
}

// Blog index at /blog: every post, newest first.
function renderBlog(posts) {
  const items = posts.map(p =>
    `<div class="post-preview">
<a href="/posts/${p.slug}.html">
<h2>${esc(p.title)}</h2>
<time datetime="${isoDate(p.date)}">${isoDate(p.date)}</time>
</a>
</div>`
  ).join('\n');
  const body = `<section class="posts-list">
<h1>Posts</h1>
<div class="posts-container">
${items}
</div>
</section>`;
  return layout({ title: `Blog — ${SITE_TITLE}`, body });
}

function build() {
  // Start from a clean dist/ every time.
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST, 'posts'), { recursive: true });
  fs.mkdirSync(path.join(DIST, 'blog'), { recursive: true });
  fs.mkdirSync(path.join(DIST, 'projects'), { recursive: true });

  const files = fs.existsSync(POSTS_DIR)
    ? fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))
    : [];

  const posts = files.map(file => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    return {
      slug: file.replace(/\.md$/, ''),
      title: data.title || file,
      date: data.date || new Date(),
      html: md.render(content),
    };
  });

  // Newest first.
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Make posts available to the sidebar before rendering any page.
  allPosts = posts;

  for (const post of posts) {
    fs.writeFileSync(
      path.join(DIST, 'posts', `${post.slug}.html`),
      renderPost(post),
    );
  }
  for (const name of PROJECTS) {
    fs.writeFileSync(
      path.join(DIST, 'projects', `${name}.html`),
      renderProject(name),
    );
  }
  fs.writeFileSync(path.join(DIST, 'index.html'), renderHome());
  fs.writeFileSync(path.join(DIST, 'blog', 'index.html'), renderBlog(posts));
  fs.writeFileSync(path.join(DIST, 'projects', 'index.html'), renderProjects());
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

  console.log(`Built ${posts.length} post(s), ${PROJECTS.length} project(s) → dist/`);
}

build();
