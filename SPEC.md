<!-- Authored by Karter with Claude Opus 4.8 -->

# Programming with Natural Language — devlog spec

A devlog/blog whose subject is what can be built using only language models and
agent harnesses. The build tool is itself an exhibit of that thesis: a small,
hand-authored generator a reader can open and understand.

Guiding value: **extreme simplicity.** When a feature is in question, leave it
out. The product should be simple, directly functional, and easy to operate.

## Architecture

A static site. There is no runtime server. Markdown is converted to HTML once,
at build time, by a hand-rolled Node script. A static host serves the resulting
flat files. Content changes only when a post is written, so nothing needs to run
between publishes.

```
write posts/*.md  →  node build.js  →  dist/ (flat HTML)  →  Cloudflare Pages
```

## Scope (v1)

In:
- `index.html` — every post listed newest-first (title + date), each a link.
- One HTML page per post.

Deliberately out (revisit only if a real need appears): RSS, tags/categories,
draft flag, search, pagination, comments.

## Project layout

```
kwhitman.dev/
├── posts/                     # source markdown, one file per post
│   └── hello-world.md
├── style.css                  # site styles — edit here as the site grows
├── build.js                   # the generator (the exhibit)
├── package.json
└── dist/                      # build output — gitignored, served by host
    ├── index.html
    ├── style.css              # copied from project root
    └── posts/
        └── hello-world.html
```

## Post format

Filename is the URL slug: `posts/hello-world.md` → `/posts/hello-world.html`.
Date lives in frontmatter (keeps URLs clean), and drives sort order.

```markdown
---
title: Hello World
date: 2026-06-25
---

Body in **markdown**.
```

## The generator (`build.js`)

Dependencies — two, both small and standard:
- `markdown-it` — markdown → HTML
- `gray-matter` — parse frontmatter

Algorithm:
1. Read every `.md` in `posts/`.
2. For each: split frontmatter/body with gray-matter, render body with
   markdown-it, slug = filename without `.md`, wrap in the post template, write
   `dist/posts/<slug>.html`.
3. Sort posts by `date` descending; render the index listing them; write
   `dist/index.html`.
4. Copy `style.css` to `dist/style.css`.

Templates are inline template-literal functions in `build.js` (`renderPost`,
`renderIndex`) — no template-engine dependency. Each template links the
stylesheet in its `<head>` (`<link rel="stylesheet" href="/style.css">`), so all
styling lives in the editable `style.css` file. It starts near-zero and can grow:

```css
body { max-width: 40rem; margin: 2rem auto; padding: 0 1rem;
       font-family: system-ui, sans-serif; line-height: 1.5; }
```

## Commands

- `npm install` — once.
- `npm run build` — runs `node build.js`, regenerates `dist/`.
- Preview locally: `npx serve dist` (or any static file server).

## Deploy — Cloudflare Pages

Connect the git repo; in the dashboard set:
- Build command: `npm run build`
- Output directory: `dist`

Push to deploy. Custom domain: `kwhitman.dev`. The build emits a portable `dist/`
folder, so the host is replaceable without touching the generator.

## Writing a new post

1. Create `posts/<slug>.md` with `title` + `date` frontmatter.
2. Commit and push — Cloudflare rebuilds and deploys.
   (Or `npm run build` and preview locally first.)
