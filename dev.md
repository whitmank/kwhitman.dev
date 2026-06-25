<!-- Authored by Karter with Claude Opus 4.8 -->

# Running & publishing

## First time only

```sh
npm install        # install build deps (markdown-it, gray-matter)
```

## Develop locally

```sh
npm run build      # render posts/*.md into dist/
npx serve dist     # serve dist/ at http://localhost:3000
```

There's no live-reload. After editing a post or the styles, re-run
`npm run build` and refresh the browser. (Leave `npx serve dist` running in its
own terminal.)

## Write a post

1. Copy `post-template.md` into `posts/` and rename it to your slug
   (e.g. `posts/my-post.md` → served at `/posts/my-post.html`).
2. Edit the frontmatter (`title`, `date`) and body.
3. `npm run build` and refresh to preview.

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
