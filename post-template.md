---
title: Your Post Title
date: 2026-06-25
---

Write your post body here in standard **markdown**.

The block at the very top, between the `---` lines, is the frontmatter. The
build (`build.js`, via `gray-matter`) parses two fields:

- `title` — shown as the post's heading and in the index list. Required.
- `date` — `YYYY-MM-DD`. Drives the newest-first ordering on the index. Required.

The frontmatter must be the first thing in the file, with `---` on its own line
above and below. Don't put anything before it.

## Notes on the rest

- The **filename** becomes the URL slug: `posts/my-first-post.md` is served at
  `/posts/my-first-post.html`. Keep filenames lowercase with hyphens.
- The body is plain markdown: headings, **bold**, _italic_, `inline code`,
  [links](https://example.com), lists, blockquotes, and fenced code blocks all
  work.

```js
// fenced code blocks render with the monospace / code styling
console.log("hello");
```

To publish: copy this file into `posts/`, rename it, edit the frontmatter and
body, then `npm run build` (or just commit and push — Cloudflare rebuilds).

<!-- Reference template, not a published post. Authored by Karter with Claude Opus 4.8 -->
