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

The site mirrors the `user/` folder like a file browser: every subfolder of
`user/` is a **collection** rendered at a route named after it. A persistent left
sidebar (built in `layout()`) carries the `kwhitman.dev` title and one nav link
per collection (`/blog`, `/projects`, …) on every page.

In:
- `/` — file-browser root: lists the top-level `user/` folders, each a link.
- `/<folder>` — every entry in that collection listed newest-first (title +
  optional date), each a link. Today: `/blog` (posts) and `/projects`.
- One HTML page per markdown file at `/<folder>/<slug>.html`. Project bodies are
  placeholder ("coming soon") for now.

Deliberately out (revisit only if a real need appears): RSS, tags/categories,
draft flag, search, pagination, comments.

## Project layout

```
kwhitman.dev/
├── user/                      # all hand-authored content; each folder = a route
│   ├── post-template.md       # loose top-level file → ignored, never rendered
│   ├── blog/                  # one markdown file per post → served at /blog
│   │   └── hello-world.md
│   └── projects/              # one markdown file per project → served at /projects
│       └── audio-comments.md
├── style.css                  # site styles — edit here as the site grows
├── build.js                   # the generator (the exhibit)
├── package.json
└── dist/                      # build output — gitignored, served by host
    ├── index.html             # file-browser root, listing the user/ folders
    ├── style.css              # copied from project root
    ├── blog/
    │   ├── index.html         # the posts list, served at /blog
    │   └── hello-world.html
    └── projects/
        ├── index.html         # the projects list, served at /projects
        └── audio-comments.html
```

## Entry format

Content is organized into **collections** — the subfolders of `user/`, one per
content type (`blog`, `projects`, …). Collections are discovered at build time;
adding a content type means adding a folder under `user/`, no code changes. The
folder name becomes the route (`/<folder>`) and the heading (title-cased).

Within a collection, the filename is the URL slug: `user/blog/hello-world.md` →
`/blog/hello-world.html`. `title` is required; `date` (in frontmatter, keeps
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

Algorithm:
1. `discoverCollections()` — list the subfolders of `user/`, alphabetically.
   Loose top-level files (e.g. `post-template.md`) and dot-folders are skipped.
2. For each collection, `loadCollection` reads every `.md` in `user/<name>/`:
   split frontmatter/body with gray-matter, render body with markdown-it,
   slug = filename without `.md`, sort entries by `date` descending (undated last).
3. Wrap each entry in the entry template, write `dist/<name>/<slug>.html`;
   render the collection's index and write `dist/<name>/index.html`.
4. Write `dist/index.html` (file-browser root) and copy `style.css` to
   `dist/style.css`.

Templates are inline template-literal functions in `build.js` (`layout`,
`renderHome`, `renderEntry`, `renderIndex`) — no template-engine dependency. `layout` provides
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

1. Create `user/blog/<slug>.md` with `title` + `date` frontmatter (a project is
   the same under `user/projects/`, where `date` is optional).
2. Commit and push — Cloudflare rebuilds and deploys.
   (Or `npm run build` and preview locally first.)
