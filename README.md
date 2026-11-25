# Razov DB: database products site

The site of **Razov DB**, the database line of RAZOV.tech solutions, published with GitHub Pages at
<https://hasanradi93.github.io/razov-db/>. It presents the three database products:

- **DataPilot AI**: ask your company's database questions in plain words.
- **SQLNext**: convert MySQL databases to newer versions, with every change explained.
- **SchemaZone**: see a `.sql` file as an interactive ER diagram, in your browser.

The root <https://hasanradi93.github.io/> is the RAZOV.tech solutions hub (repo `hasanradi93.github.io`) with two
doors: Razov Bots (`/razov-bots/`, its own repo) and this site.

## What is in the repo

Plain static files with no framework, build step or npm:

| Path | Purpose |
| --- | --- |
| `index.html` | The one-page site |
| `404.html` | Not-found page for any path under `/razov-db/` (uses `/razov-db/...` paths on purpose) |
| `assets/css/base.css` | Design tokens (dark and light), layout, header, buttons, footer |
| `assets/css/sections.css` | Hero, products, sketches, how-to, pricing, contact |
| `assets/js/site.js` | Theme toggle, mobile menu, reveals, tabs, copy buttons, store link |
| `assets/js/hero-network.js` | The animated database network on the hero canvas |
| `assets/img/` | The star mark (`logo-mark.svg`), the apple-touch icon and the social image (`og-image.png`) |
| `assets/fonts/` | Anybody and Readex Pro, the razov.tech brand fonts (SIL OFL, see `OFL.txt`) |
| `favicon.svg` | The star mark on a rounded square, in the DB violet |
| `legal.html` | Terms, privacy and refunds for the company (linked in every footer) |
| `datapilot/` | DataPilot AI product page, published from the DataPilot repo; do not edit by hand |
| `schemazone/` | The built SchemaZone app; do not edit by hand |

Links inside `index.html` and `legal.html` are relative (`schemazone/`, `datapilot/`, `legal.html`), so the
site works under `/razov-db/` and in a local preview. `robots.txt` lives in the root repo only, because
crawlers read it from the domain root.

## Updating SchemaZone

The source is in the private repo `hasanradi93/schemazone`. Its `npm run build:site` builds for
`/razov-db/schemazone/`. To publish a new version:

```sh
cd ../SchemaZone && npm test && npm run build:site
rm -rf ../razov-db/schemazone && mkdir ../razov-db/schemazone && cp -r dist/* ../razov-db/schemazone/
```

Then commit and push this repo.

## Preview locally

```sh
python -m http.server 8077
```

Then open <http://localhost:8077/>. SchemaZone loads its files from `/razov-db/schemazone/`, so it
only works on the live site, or when this folder is served under a `razov-db/` path.

## Switching things on later

- **Store:** set `STORE_URL` at the top of `assets/js/site.js` to
  `https://hasanradi93.github.io/razov-db/datapilot/#pricing` once Paddle checkout works there. It must
  start with `https://`. The store button appears and the paid DataPilot plans change from
  "Contact us to buy" to "Buy".
- **SQLNext product page:** publish it into `sqlnext/` here, then add `'/razov-db/sqlnext/'` to
  `LIVE_PENDING_LINKS` in `assets/js/site.js`. Every element with
  `data-link-pending="/razov-db/sqlnext/"` turns into a real link.

## Notes for editors

- The header carries the razov.tech brand, shared with Razov Bots: the eight-point star (in the DB
  violet), `razov.tech`, the branch arrow and the leaf `db`. `razov.tech` links to the hub
  <https://hasanradi93.github.io/> until the razov.tech domain is live; then it becomes
  `https://razov.tech`. The star is the `#star` symbol at the top of each page.
- Colours, fonts and spacing are CSS custom properties at the top of
  `assets/css/base.css`, with a dark set (default) and a light set.
- Sections inside `<main>` use `content-visibility: auto` so the first paint
  stays fast. Same-page links render everything first, so jumps stay exact.
- Product visuals are illustrative SVG/CSS sketches, not screenshots.
- Animations stop when `prefers-reduced-motion: reduce` is set.
