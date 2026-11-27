# Calendar & 13 Virtues

A mobile-friendly, single-page web app with three tabs:

1. **Calendar** - simple interactive month view; tap a day to mark it.
2. **13 Virtues** - Benjamin Franklin's weekly tracker: 13 virtues x 7 days, with one focus virtue per week that rotates through a 13-week cycle. Tap a cell to add or remove a dot.
3. **The Monk** - seven lessons and practical techniques inspired by *The Monk Who Sold His Ferrari* (own-word summaries).

It is plain HTML, CSS and JavaScript: no build step, no dependencies, no external requests. It can be installed on a phone's home screen (PWA) and works offline.

## Your data

Everything is stored in the browser (`localStorage`) on the device you use. It is **not** synced between devices. Use **Backup your data** at the bottom of the page to export or import a JSON file (for example, to move data from your phone to a computer).

## Run locally

Open `index.html` in a browser, or serve the folder (needed to test the service worker):

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Deploy on GitHub Pages

1. Create a repository on GitHub (for example `calendar-virtues`) and push this folder to the `main` branch.
2. In the repository go to **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select branch `main` and folder `/ (root)`, then **Save**.
4. After a minute the site is available at `https://<your-user>.github.io/<repo>/`.

All paths are relative, so it works under the repository sub-path.

### Install on your phone

- **Android (Chrome):** open the URL, menu (three dots) > **Install app** / **Add to Home screen**.
- **iPhone (Safari):** open the URL, Share button > **Add to Home Screen**.

### Updating after a deploy

The service worker uses network-first, so a normal reload picks up new files. If you change the list of cached files in `sw.js`, bump `CACHE` (for example to `calvirtues-v2`).

## Project layout

| Path | Purpose |
|---|---|
| `index.html` | Page shell, tabs and sections |
| `css/styles.css` | Mobile-first styles with light/dark theme |
| `js/app.js` | Shared state, validation, tabs, export/import |
| `js/calendar.js` | Month calendar |
| `js/virtues.js` | Franklin's 13 virtues tracker |
| `js/monk.js` | Lessons from the book |
| `manifest.webmanifest`, `sw.js` | PWA install and offline support |
| `icons/` | App icons |
| `tools/make-icons.ps1` | Regenerates the PNG icons (Windows PowerShell) |

## Security notes

- A strict Content-Security-Policy (`self` only) is set in `index.html`; there are no CDNs or third-party scripts.
- All text is rendered with `textContent`, never `innerHTML`.
- Imported backups are size-limited and validated/normalized before use.
