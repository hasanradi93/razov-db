---
name: paths-and-repos
description: Which repository serves which path under hasanradi93.github.io since the move to /razov-db/
---

- `/` is the small RAZOV hub, repo `hasanradi93.github.io`. It has two doors: Razov Bots and Razov DB.
- `/razov-bots/` is the owner's agents site, repo `razov-bots`. Never touch it from the database sessions.
- `/razov-db/` is this repo (`razov-db`), the database products site, with these folders:
  - `datapilot/` is published by the DataPilot session.
  - `schemazone/` is a build of the private `hasanradi93/schemazone`.
  - `sqlnext/` comes later.
- `/datapilot/` (repo `datapilot`) becomes a forwarder to `/razov-db/datapilot/`. Its GitHub Releases stay
  the download source.
- `/schemazone/` and `/legal.html` at the root are forwarders to the new addresses.

**Why:** the owner decided on 2026-11-25 that the root belongs to all of RAZOV, with the agents site
kept separate. The database apps live under one name, `/razov-db/`.

**How to apply:**
- Link inside this site with relative paths. Only `404.html` uses `/razov-db/...`.
- Never create a public repo named `schemazone` or `sqlnext`. It would take over `/schemazone/` or
  `/sqlnext/` at the root.
- Commit only your own folders. `datapilot/` belongs to the DataPilot session.
