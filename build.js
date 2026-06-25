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
const SITE_TITLE = 'Programming with Natural Language';

// Escape text destined for HTML.
function esc(s) {
  return String(s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// gray-matter parses YAML dates into Date objects; strings are accepted too.
function isoDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Shared page shell. All styling lives in /style.css.
function layout({ title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
${body}
</body>
</html>
`;
}

function renderPost(post) {
  const body = `<article>
<h1>${esc(post.title)}</h1>
<time datetime="${isoDate(post.date)}">${isoDate(post.date)}</time>
${post.html}
</article>
<p><a href="/">← all posts</a></p>`;
  return layout({ title: `${post.title} — ${SITE_TITLE}`, body });
}

function renderIndex(posts) {
  const items = posts.map(p =>
    `<li><a href="/posts/${p.slug}.html">${esc(p.title)}</a> ` +
    `<time datetime="${isoDate(p.date)}">${isoDate(p.date)}</time></li>`
  ).join('\n');
  const body = `<h1>${esc(SITE_TITLE)}</h1>
<ul>
${items}
</ul>`;
  return layout({ title: SITE_TITLE, body });
}

function build() {
  // Start from a clean dist/ every time.
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST, 'posts'), { recursive: true });

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

  for (const post of posts) {
    fs.writeFileSync(
      path.join(DIST, 'posts', `${post.slug}.html`),
      renderPost(post),
    );
  }
  fs.writeFileSync(path.join(DIST, 'index.html'), renderIndex(posts));
  fs.copyFileSync(path.join(ROOT, 'style.css'), path.join(DIST, 'style.css'));

  console.log(`Built ${posts.length} post(s) → dist/`);
}

build();
