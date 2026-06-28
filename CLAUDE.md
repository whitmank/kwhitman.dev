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

## Content lives in `user/`

All hand-authored content is markdown under `user/`, one folder per
**collection**: `user/posts/`, `user/projects/`, and any future type. A
collection is one row in the `COLLECTIONS` array in `build.js` (`src`, `pageDir`,
`indexDir`, `href`, `heading`) — add a content type by adding a row, no other
code changes.

## How it's built

`build.js` loads each collection (`loadCollection` reads `user/<src>/*.md`), then
renders every entry and a per-collection index, writing to `dist/` (gitignored,
along with `node_modules/`). Templates are inline template-literal functions:
`layout` (shared shell + sidebar), `renderHome`, `renderEntry` (one page),
`renderIndex` (one listing). Styling is copied via `style.css → dist/style.css`.

Routes:
- `/` → redirects to `/blog` (meta refresh in `renderHome`).
- `/blog` → post list, newest first (the `posts` collection's index).
- `/posts/<slug>.html` → one page per post.
- `/projects` → project list (the `projects` collection's index).
- `/projects/<slug>.html` → one page per project.

## Entries (posts & projects)

`user/<collection>/<slug>.md`; the **filename is the URL slug**. Frontmatter
needs `title`; `date` (`YYYY-MM-DD`) is optional and drives newest-first sort and
the displayed date. Undated entries (current projects) omit the date and sort
last. See `user/post-template.md` for the canonical format.

## Layout

Persistent left sidebar (site title + `/blog`, `/projects` nav) with a gray
`border-right` divider; main content on the right. At ≤768px the sidebar
collapses to a thin left strip with a chevron that slides out on hover/focus
(see the media query in `style.css`).

## Commands

- `npm install` (first time), `npm run build`, preview with `npx serve dist`.
- **No live reload** — after editing, rebuild and refresh. A common confusion is
  a stale `dist/`; rebuild before trusting what the browser shows.
- Publish: `./publish.sh "msg"` (or `npm run publish -- "msg"`) builds, commits,
  and pushes. Karter also has a `publish` shell function scoped to this dir.

## Conventions

- Attribute new files: "Authored by Karter with <model>" (user first).
- Reference docs live at the root: `SPEC.md` (design/decisions) and `dev.md`
  (commands). `user/post-template.md` (post/project format) sits in `user/` for
  convenience; it's at the top level, outside any collection folder, so the build
  never renders it.
