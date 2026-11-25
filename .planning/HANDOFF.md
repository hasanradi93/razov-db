# RAZOV DB site: handoff

Updated: 2026-11-25 (session e9b8e228-a8c9-4941-8e10-76d7177fe510)

## Where things are

- **Repo:** public `hasanradi93/razov-db`, branch `main`. GitHub Pages serves the root of `main`.
- **Live:** https://hasanradi93.github.io/razov-db/
- **History:** this repo started as a copy of the user-site repo `hasanradi93.github.io`, which held the
  database site until 2026-11-25. That repo is now the small RAZOV hub.
- **Folders inside:**
  - `schemazone/` is a build of the private repo `hasanradi93/schemazone` (base `/razov-db/schemazone/`).
  - `datapilot/` is published by the DataPilot session (`datapilot-ai-e5`) from the DataPilot repo, as
    one commit that touches only that folder.
  - `sqlnext/` will come later, when the owner publishes SQLNext.

## Owner decision, 2026-11-25 ~11:50 (relayed by datapilot-ai-e5)

The owner said: "there the agents site on https://hasanradi93.github.io/ so dont' kill it, keep the new
Sites of DBs Apps seperated udner on name site after https://hasanradi93.github.io/". The owner then
chose these options:
1. The database site moves to `/razov-db/` (this repo).
2. All three app pages live inside it: `/razov-db/datapilot/`, `/razov-db/schemazone/`, and later
   `/razov-db/sqlnext/`.
3. The root becomes a small RAZOV hub with two doors: Razov Bots (`/razov-bots/`, never touched from
   here) and Razov DB. The old `/schemazone/` and `/legal.html` become forwarders.

## Steps

| # | Step | State |
|---|---|---|
| 1 | SchemaZone rebuilt with base `/razov-db/schemazone/` (128 tests pass) | done |
| 2 | Site links made relative; `404.html` uses `/razov-db/...`; canonical, og and JSON-LD URLs moved | done |
| 3 | `sitemap.xml` lists `/razov-db/`, `datapilot/`, `schemazone/`, `legal.html`; `robots.txt` removed (root only) | done |
| 4 | Create the public repo, push, turn Pages on, tell datapilot-ai-e5 | done 2026-11-25 (e57855d) |
| 5 | DataPilot page in `datapilot/` (datapilot-ai-e5) | done: bd8d3c4; the old `/datapilot/` forwards here |
| 6 | Root hub and forwarders (repo `hasanradi93.github.io`, 542f8f9) | done 2026-11-25 |

Live check, 2026-11-25:
- These return 200: `/razov-db/`, `datapilot/`, `schemazone/`, `legal.html` and `sitemap.xml`.
- A missing path under `/razov-db/` returns this repo's 404 page.
- In Chrome, the old `/schemazone/` lands on `/razov-db/schemazone/` with the hash kept, and the PostgreSQL sample
  opens (7 tables, 7 relations).
- The old `/legal.html#refunds` lands on `/razov-db/legal.html#refunds`.
- The old Pages builds API shows "errored" for the first two pushes. The Actions run `pages-build-deployment`
  succeeded, and that run is the one that serves the site.

## Switches for later

- **Paddle store live:** set `STORE_URL` in `assets/js/site.js` to
  `https://hasanradi93.github.io/razov-db/datapilot/#pricing`. It must start with `https://`, and must be
  set only once checkout works, because it also shows "Buy" and an online-store banner.
- **SQLNext page live:** publish it into `sqlnext/` once the owner approves, then add `'/razov-db/sqlnext/'` to
  `LIVE_PENDING_LINKS` in `assets/js/site.js`. Its installers will be on the public repo
  `hasanradi93/sqlnext-releases`, because a public `sqlnext` repo cannot exist next to the private `SQLNext`.
- **SQLNext wording:** 1.0 converts MySQL to newer MySQL only. Fixed on 2026-11-25 here and in the hub.
- **New SchemaZone version:** see README, "Updating SchemaZone".

## Open points for the owner

- Lighthouse Performance was not measured. Run PageSpeed Insights on the live URL.
- Hero numbers ("3 products, 4 SQL dialects, 2 languages, $0 to start") come from the product facts.
  Change them if wanted.
- `legal.html` was written from the products' facts and DataPilot's own policies. Review it before the
  Paddle application. The Paddle domain to submit is now `https://hasanradi93.github.io/razov-db/`.
