# Calendar

A single-page static web app (plain HTML, CSS and JavaScript: no build step, no dependencies, no CDNs) that works on a phone, can be published on GitHub Pages and installed as a PWA with offline support. The interface is in English.

## Tabs

- **Calendar**: monthly view (Monday to Sunday). Tap a day to mark or unmark it. A dot under a day means it has virtue points.
- **13 Virtues**: Benjamin Franklin's 13 virtues, tracked week by week. Each cell holds 0 to 5 points (each tap adds one, after 5 it goes back to 0). A 13-week cycle puts one virtue in focus per week; set the start of the cycle in *Cycle settings*.
- **The Monk**: 21-day cycles inspired by *The Monk Who Sold His Ferrari*. Each cycle has one lesson with three "Try this" techniques. After lesson 7 the lessons start again at lesson 1. The lesson texts are short summaries written in my own words, not text from the book.

## Project structure

```
index.html              page, CSP and tab markup
css/styles.css          styles (light/dark, safe-area aware)
js/app.js               shared state, validation (sanitize), tabs, backup, service worker
js/calendar.js          Calendar tab
js/virtues.js           13 Virtues tab
js/monk.js              The Monk tab
manifest.webmanifest    PWA manifest
sw.js                   service worker (network-first, cache fallback)
icons/                  icon.svg + PNG icons
tools/make-icons.ps1    regenerates the PNG icons with System.Drawing
```

## Data and privacy

- Everything is stored in `localStorage` under the key `calvirtues.v1` (format version 1). Nothing leaves the device.
- Shape of the data:
  - `marks`: `{ "YYYY-MM-DD": true }`
  - `virtues`: `{ "YYYY-MM-DD": { "<virtue 0-12>": 1..5 } }` (the legacy format, an array of indexes, is still accepted and counts as 1 point each)
  - `cycleStart`: Monday that starts the 13-week virtue cycle
  - `monkStart`: `"YYYY-MM-DD"`, start of the first Monk cycle (defaults to the first visit and is saved immediately)
  - `monkDays`: `{ "YYYY-MM-DD": true }`
- **Backup your data** (bottom of the page) exports and imports a JSON file. Import accepts at most 1 MB and 20000 keys, validates and normalizes every field (real dates between 1900 and 2200, types, ranges), asks for confirmation before replacing your data and rejects invalid files.

## Security notes

- Strict Content-Security-Policy in a `<meta>` tag (only `'self'`).
- All text is rendered with `textContent`; `innerHTML` is never used.
- All paths are relative, so the app works under `https://<user>.github.io/<repo>/`.

## Run locally

Any static server works. With Node (no install needed):

```
node -e "require('http').createServer((q,s)=>{const f=require('path').join(process.cwd(),q.url.split('?')[0]==='/'?'index.html':decodeURIComponent(q.url.split('?')[0]));require('fs').readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end('Not found')}const t={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'}[require('path').extname(f)]||'application/octet-stream';s.writeHead(200,{'Content-Type':t,'Cache-Control':'no-store'});s.end(d)})}).listen(8000,'127.0.0.1')"
```

Then open http://127.0.0.1:8000/.

## Publish on GitHub Pages

1. Push the project to a GitHub repository (files at the repository root).
2. In the repository go to **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **main** and folder **/ (root)**, then **Save**.
5. After a minute the site is live at `https://<user>.github.io/<repo>/`. Open it on your phone and use "Add to Home Screen" / "Install app".

## Updating the offline cache

When the list of files changes (a file is added, renamed or removed), update the `FILES` list in `sw.js` **and** bump `CACHE_NAME` (`calvirtues-v1` to `calvirtues-v2`, and so on) so installed copies refresh.

## Regenerating icons

```
powershell -NoProfile -File tools\make-icons.ps1
```
