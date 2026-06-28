<!-- Authored by Karter with Claude Opus 4.8 -->

# kwhitman.dev — notes for future agents

A personal devlog about what can be built using only language models and agent
harnesses. The build tool is itself an exhibit of that thesis — keep it small
and legible enough that a reader can open `build.js` and understand the whole
site.

## Guiding value: extreme simplicity

Karter's explicit goal is to resist over-engineering here. Default to the
smallest thing that works. Do **not** add tooling, dependencies, frameworks, or
features unless there's a real, demonstrated need. When in doubt, leave it out
and ask.

## Stack

- Hand-rolled static-site generator: `build.js` (Node, CommonJS).
- Two deps only: `markdown-it` (render) + `gray-matter` (frontmatter).
- All styling in `style.css` (plain CSS, no framework). The only client-side
  JavaScript is a ~15-line inline script in `layout()` that toggles the
  collapsed-sidebar drawer (open/close on click/Escape/resize); nothing else.
- Host: Cloudflare Pages (build `npm run build`, output `dist/`), auto-deploys on
  push to `main`. Repo: `github.com/whitmank/kwhitman.dev`. Domain: kwhitman.dev.

## The site mirrors `user/` (file-browser metaphor)

The site is a rendering of the `user/` folder. **Nothing about routing is
hardcoded** — `build.js` discovers every *subfolder* of `user/` and turns it into
a **collection** served at `/<folder>`. Today that's `user/blog/` → `/blog` and
`user/projects/` → `/projects`; drop in `user/notes/` and `/notes` appears with
no code change. Collections are listed alphabetically (file-browser order).

Loose files at the top level of `user/` (e.g. `post-template.md`) are **ignored**
— only folders become sections, which is how the template hides while living in
`user/`.

## How it's built

`build.js` calls `discoverCollections()` (folders of `user/`, alphabetical),
loads each via `loadCollection` (`user/<name>/*.md`), then renders every entry
and a per-collection index to `dist/` (gitignored, with `node_modules/`).
Templates are inline template-literal functions: `layout` (shared shell +
sidebar), `renderHome`, `renderEntry` (one page), `renderIndex` (one listing).
`titleCase` turns a folder name into its heading. Styling is copied via
`style.css → dist/style.css`.

Routes (all derived from folder names):
- `/` → file-browser root: lists the top-level `user/` folders.
- `/<folder>` → that collection's index, newest first.
- `/<folder>/<slug>.html` → one page per markdown file.

## Entries

`user/<folder>/<slug>.md`; the **filename is the URL slug**. Frontmatter needs
`title`; `date` (`YYYY-MM-DD`) is optional and drives newest-first sort and the
displayed date. Undated entries (current projects) omit the date and sort last.
See `user/post-template.md` for the canonical format.

## Layout

Persistent left sidebar (site title + `/blog`, `/projects` nav) with a gray
`border-right` divider; main content on the right. At ≤768px the sidebar
collapses to a thin left strip with a chevron that slides out on hover/focus
(see the media query in `style.css`).

## Commands

- `npm install` (first time), then `npm run dev` for local work.
- `npm run dev` runs `dev.js` — a zero-dep dev server (tooling, kept apart from
  the site): builds `dist/`, serves it at `http://localhost:3000`, and watches
  `user/`, `style.css`, and `build.js`, rebuilding and live-reloading the browser
  on any change. `PORT=4321 npm run dev` if 3000 is taken.
- `npm run build` is the one-off render (what Cloudflare runs); `npx serve dist`
  serves without rebuild or reload. When previewing a plain `serve`, watch for a
  stale `dist/` — rebuild before trusting what the browser shows.
- Publish: `./publish.sh "msg"` (or `npm run publish -- "msg"`) builds, commits,
  and pushes. Karter also has a `publish` shell function scoped to this dir.

## Conventions

- Attribute new files: "Authored by Karter with <model>" (user first).
- Reference docs live at the root: `SPEC.md` (design/decisions) and `dev.md`
  (commands). `user/post-template.md` (post/project format) sits in `user/` for
  convenience; it's at the top level, outside any collection folder, so the build
  never renders it.
