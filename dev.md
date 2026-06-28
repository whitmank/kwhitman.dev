<!-- Authored by Karter with Claude Opus 4.8 -->

# Running & publishing

## First time only

```sh
npm install        # install build deps (markdown-it, gray-matter)
```

## Develop locally

```sh
npm run dev        # build, serve at http://localhost:3000, rebuild + reload on change
```

`npm run dev` runs `dev.js` — a zero-dependency dev server (tooling, not part of
the site). It builds `dist/`, serves it, and watches `user/`, `style.css`, and
`build.js`; any change rebuilds and the browser reloads itself. Just edit and
save. Port 3000 is the default; override with `PORT=4321 npm run dev` if it's
taken.

For a one-off build without the watcher:

```sh
npm run build      # render user/**/*.md into dist/
npx serve dist     # serve dist/ (no rebuild, no live-reload)
```

## Write a post

1. Copy `user/post-template.md` into `user/blog/` and rename it to your slug
   (e.g. `user/blog/my-post.md` → served at `/blog/my-post.html`).
2. Edit the frontmatter (`title`, `date`) and body.
3. With `npm run dev` running, just save — it rebuilds and the browser reloads.

## Publish to live

One command builds, commits, and pushes:

```sh
./publish.sh "Add my-post"      # or: npm run publish -- "Add my-post"
```

Omit the message for a dated default (`Publish 2026-06-25 14:30`). The script
builds first (so a broken build stops before anything is pushed), and does
nothing if there are no changes.

Cloudflare Pages rebuilds on every push to `main` (build command `npm run build`,
output `dist/`) and deploys to kwhitman.dev. No manual upload needed.

> Note: run it as `./publish.sh` or `npm run publish` — **not** `npm publish`,
> which is the unrelated npm-registry command.
