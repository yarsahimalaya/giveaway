# Giveaway Picker

A static Next.js site that picks random winners from uploaded comment CSVs. CSVs are parsed in the browser and never leave it.

## Develop

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to out/
npm run lint     # type-check
```

## Deploy (Cloudflare Pages)

- Root directory: `site`
- Build command: `npm run build`
- Build output directory: `out`

## CSV format

Required columns: `commenter_name`, `profile_link`. Optional: `comment`, `source`, `post_url`, `type` (`comment` / `reply`). See `../oct-2026-giveaway/comments.csv`.

## Drawing

- Winners are drawn with `crypto.getRandomValues` (no `Math.random`).
- "One entry per person" dedupes by `profile_link`, so repeat commenters don't get extra odds.
- Replies are excluded by default.
