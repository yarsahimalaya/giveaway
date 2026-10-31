# October 2026 Giveaway

Comments collected on 2026-10-30 and updated on 2026-10-31 from these posts:

- Facebook reel: https://www.facebook.com/reel/1092029317083801 (71 comments)
- Facebook reel: https://www.facebook.com/reel/1421097699635120 (8 comments)
- Instagram post: https://www.instagram.com/p/DewaqW3TSkc/ (24 comments incl. replies; the post shows 26, but 2 can't be loaded)
- Instagram post: https://www.instagram.com/p/Deao2KATtLf/ (164 comments incl. replies)
- Instagram post: https://www.instagram.com/p/DfH1r6jzCnU/ (1 comment)
- Instagram post: https://www.instagram.com/p/DfFdS5SFRyG/ (2 comments)

## comments.csv

| Column | Description |
| --- | --- |
| `commenter_name` | Display name (Instagram username when no name is set) |
| `profile_link` | Link to the commenter's profile |
| `comment` | Comment text (`[GIF/sticker]` for non-text comments) |
| `source` | `Facebook` or `Instagram` |
| `post_url` | The post the comment was left on |
| `type` | `comment` or `reply` |

Notes:
- People can appear more than once (multiple comments, or the same person on several posts). Dedupe by `profile_link` for one entry per person.
- Facebook and Instagram profiles of the same person are not linked.

## unique_commenters.csv

One row per commenter, deduplicated by `profile_link` (187 people from 270 comments).
Same columns as `comments.csv`, holding each person's first comment, plus:

| Column | Description |
| --- | --- |
| `comment_count` | Total comments/replies by this profile across all posts |
