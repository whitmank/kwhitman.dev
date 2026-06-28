<!-- Authored by Karter with Claude Opus 4.8 -->

# kwhitman.dev — devlog spec

A devlog/blog about what can be built using only language models and agent
harnesses. The build tool is itself an exhibit of that thesis: a small,
hand-authored generator a reader can open and understand.

Guiding value: **extreme simplicity.** When a feature is in question, leave it
out. The product should be simple, directly functional, and easy to operate.

## Architecture

A static site. There is no runtime server. Markdown is converted to HTML once,
at build time, by a hand-rolled Node script. A static host serves the resulting
flat files. Content changes only when a post is written, so nothing needs to run
between publishes.

```
write user/**/*.md  →  node build.js  →  dist/ (flat HTML)  →  Cloudflare Pages
```

## Scope (v1)

A persistent left sidebar (built in `layout()`) carries the `kwhitman.dev` title
and the nav links (`/blog`, `/projects`) on every page.

In:
- `/` — redirects to `/blog` for now (meta refresh).
- `/blog` — every post listed newest-first (title + date), each a link.
- `/projects` — every project listed (title), each a link; project bodies are
  placeholder ("coming soon") for now.
- One HTML page per post at `/posts/<slug>.html` and per project at
  `/projects/<slug>.html`.

Deliberately out (revisit only if a real need appears): RSS, tags/categories,
draft flag, search, pagination, comments.

## Project layout

```
kwhitman.dev/
├── user/                      # all hand-authored content
│   ├── posts/                 # one markdown file per post
│   │   └── hello-world.md
│   └── projects/              # one markdown file per project
│       └── audio-comments.md
├── style.css                  # site styles — edit here as the site grows
├── build.js                   # the generator (the exhibit)
├── package.json
└── dist/                      # build output — gitignored, served by host
    ├── index.html             # home (redirects to /blog)
    ├── style.css              # copied from project root
    ├── blog/
    │   └── index.html         # the posts list, served at /blog
    ├── posts/
    │   └── hello-world.html
    └── projects/
        ├── index.html         # the projects list, served at /projects
        └── audio-comments.html
```

## Entry format

Content is organized into **collections** — folders under `user/`, one per
content type (`posts`, `projects`, …). Each collection is one row in the
`COLLECTIONS` array in `build.js`; adding a content type means adding a row, no
other code changes.

Within a collection, the filename is the URL slug: `user/posts/hello-world.md` →
`/posts/hello-world.html`. `title` is required; `date` (in frontmatter, keeps
URLs clean) is optional — it drives newest-first sort and the displayed date, and
undated entries (current projects) sort last with no date shown.

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

Algorithm — for each collection in `COLLECTIONS`:
1. Read every `.md` in `user/<src>/` (`loadCollection`).
2. For each: split frontmatter/body with gray-matter, render body with
   markdown-it, slug = filename without `.md`, sort entries by `date` descending
   (undated last).
3. Wrap each entry in the entry template, write `dist/<pageDir>/<slug>.html`;
   render the collection's index and write `dist/<indexDir>/index.html`.
4. Write `dist/index.html` (home redirect) and copy `style.css` to
   `dist/style.css`.

Templates are inline template-literal functions in `build.js` (`layout`,
`renderEntry`, `renderIndex`) — no template-engine dependency. `layout` provides
the shared shell (site-title header, `<main>`, footer) and links the stylesheet
in `<head>` (`<link rel="stylesheet" href="/style.css">`). The markup uses
class names (`.posts-list`, `.post-preview`, `.post-header`, `.post-content`,
`.post-footer`, `.site-title`) that the stylesheet targets.

All styling lives in the editable `style.css` — a clean blog look ported from
the earlier `kwhitman.xyz` site: 700px column, system fonts, `#333` text,
`#0066cc` link accents, bordered footer. The interactive sort-toggle from that
site was intentionally left out to keep v1 minimal (static newest-first order).

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

1. Create `user/posts/<slug>.md` with `title` + `date` frontmatter (a project is
   the same under `user/projects/`, where `date` is optional).
2. Commit and push — Cloudflare rebuilds and deploys.
   (Or `npm run build` and preview locally first.)
