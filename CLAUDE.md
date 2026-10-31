# Giveaway repo

Comment exports from Himali Green giveaways, plus a static site that draws winners from them.

## Layout

- `<month>-<year>-giveaway/` — one folder per giveaway, e.g. `oct-2026-giveaway/`, holding `comments.csv` and a `README.md` listing the source posts and counts.
- `picker/` — Vite + React winner picker, hosted on Cloudflare Pages.

## Comment CSVs

- Columns: `commenter_name, profile_link, comment, source, post_url, type`.
- `source` is `Facebook` or `Instagram`; `type` is `comment` or `reply`.
- UTF-8 with BOM (so Excel shows Nepali names and emoji), all fields quoted.
- Facebook profile links: `https://www.facebook.com/<slug>` or `https://www.facebook.com/profile.php?id=<id>`. Instagram: `https://www.instagram.com/<username>/`.
- When collecting, load every comment (switch Facebook to "All comments", expand replies) and check the row count against the count the post shows.

## Site requirements (`picker/`)

- Must be **entirely static**, built to `picker/dist/`. Nothing that needs a server, since that breaks Cloudflare Pages static hosting.
- Cloudflare Pages settings: root `picker`, build `npm run build`, output `dist`.
- The user uploads one or more CSV files; parsing happens client-side only (CSV data contains people's names and profiles — never send it anywhere).
- The user chooses X, the number of winners, and the site picks X distinct winners at random.
- Randomness uses `crypto.getRandomValues` with an unbiased partial Fisher–Yates shuffle (`site/lib/entries.ts`), never `Math.random`.
- Options: one entry per person (dedupe by `profile_link`, on by default) and include replies (off by default).
- Required CSV columns are `commenter_name` and `profile_link`; other columns are optional.
- Type-check with `npm run lint` and make sure `npm run build` succeeds before committing.
