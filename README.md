# bitqu.github.io

Marketing site for **BitQubic** — cloud native infrastructure for platform engineering, cloud modernization, and Kubernetes orchestration. Published at [bitqu.github.io](https://bitqu.github.io) via GitHub Pages.

## Stack

Static HTML/CSS/JS. No build step, no dependencies. Every `.html` file at the repo root is a published page; assets live under `assets/`.

## Local preview

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000/.

## Project layout

| Path | Purpose |
| --- | --- |
| `index.html`, `platform.html`, `platform-engineering.html`, `cloud-modernization.html`, `kubernetes-orchestration.html`, `contact.html` | Published pages |
| `assets/shared.css` | Design tokens, theme/accent variants, component styles |
| `assets/shared.js` | Nav, footer, ticker, and tweaks-panel injection; theme persistence |
| `assets/topology.js` | Canvas-based cloud topology visualization |

## Editing

- **Navigation, footer, ticker** — edit `assets/shared.js`; they are injected into mount divs at runtime, not duplicated per page.
- **Theme, accent, hero variant** — driven by `data-theme` / `data-accent` / `data-hero` attributes on `<html>`, persisted in `localStorage` (`bitqubic.settings.v1`). Extend the corresponding blocks in `assets/shared.css` to add new variants.
- **Asset cache busting** — bump the `?v=` query string on `<link>` / `<script>` tags in every HTML file after editing files in `assets/`.

See [PROJECT_NOTES.md](PROJECT_NOTES.md) for deeper architectural notes.

## Deployment

Pushes to `main` are served directly by GitHub Pages. There is no CI build.
