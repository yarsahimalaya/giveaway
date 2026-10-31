# Winner Picker

A slot-machine style winner picker for comment giveaways. Upload the comment export CSV, set the rules, and spin.

## Run it

```sh
cd picker
npm install
npm run dev        # http://localhost:5173
```

`npm run build` writes a static site to `dist/`. It runs entirely in the browser (nothing is uploaded anywhere), so `dist/` can be opened via `npm run preview` or hosted on any static host.

## Host it on Cloudflare Pages

Connect the repo in Cloudflare Pages with these build settings:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Root directory | `picker` |
| Build command | `npm run build` |
| Build output directory | `dist` |

The Node version comes from `.node-version`. No Functions, environment variables or redirects are needed.

## How it works

1. **Upload**: drop one or more CSVs (e.g. the Facebook and Instagram exports), or paste a plain list of names. Columns are matched automatically. `commenter_name`, `profile_link`, `comment`, `source`, `post_url` and `type` from the exports in this repo are all recognised, and you can remap any column. Only a name column is required.
2. **Rules**
   - *Entries*: one entry per person (duplicates merged by profile link, or by name when there's no link), or every comment counts as a ticket.
   - *Filters*: platforms, posts, comment vs. reply, skip empty/sticker-only comments, required keywords (any/all), minimum @mentions.
   - *Exclude people*: one name or profile link per line (staff, page admins, past winners).
   - *Draw settings*: giveaway title, number of winners, reveal one by one or all at once, spin length, whether one person can win twice, sound.
3. **Draw**: press **Spin** (or `Space`). Each winner gets a full-screen reveal with **Check profile** and **Disqualify & redraw**. The winners list can be copied or downloaded as CSV. `F` toggles presentation (full-screen) mode for screen recording or streaming.

Winners are chosen up front with `crypto.getRandomValues` (uniform, no modulo bias), and the reel animation then lands on them. Everything is saved in the browser's localStorage, so a refresh mid-giveaway keeps the data, rules and winners. **Start over** clears it.
