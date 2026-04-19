# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static marketing site for BitQubic, served from the `bitqu.github.io` GitHub Pages repo. No build step, no package manager, no tests — plain HTML/CSS/JS deployed as-is. Every `.html` file at the repo root is a published page.

## Local preview

No build. Serve the directory over HTTP (relative asset paths and `file://` canvas/ResizeObserver behavior both need a real server):

```
python3 -m http.server 8000
# then open http://localhost:8000/
```

Cache-bust edits to `assets/shared.css`, `assets/shared.js`, or `assets/swarm.js` by bumping the `?v=` query string in every HTML file's `<link>`/`<script>` tags (grep for `?v=`).

## Architecture

**Shared chrome is injected at runtime, not duplicated per page.** Every page contains empty mount divs (`#nav-mount`, `#foot-mount`, `#ticker-mount`, `#tweaks-mount`) and loads `assets/shared.js`, which renders the nav, footer, logo ticker, and tweaks panel on `DOMContentLoaded`. To change navigation links, the footer, or the ticker, edit `assets/shared.js` — do not edit individual HTML files.

**Theme / accent / hero variant are runtime-switchable.** `assets/shared.js` persists settings (`theme`, `accent`, `hero`) in `localStorage` under key `bitqubic.settings.v1` and applies them as `data-theme` / `data-accent` / `data-hero` attributes on `<html>`. `assets/shared.css` drives all visual variation off those attributes via CSS custom properties — add a new accent or theme by extending the `[data-accent="…"]` / `[data-theme="…"]` blocks, not by writing new classes.

**Hero variants live side-by-side in `index.html`.** Both `<header class="hero" data-variant="swarm">` and `data-variant="editorial">` are present; inline script hides all but the one matching `data-hero`. If you add a variant, add a matching `<header>` and extend `footLabels` / `runLabels` / `views` maps in the page-level `<script>`.

**`TWEAK_DEFAULTS` is a host-rewrite target.** The `/*EDITMODE-BEGIN*/…/*EDITMODE-END*/` markers in each page's `<head>` delimit a JSON object an external editor host rewrites in place; preserve the exact comment markers and the object shape when editing. The same file also implements a `postMessage` edit-mode protocol (`__activate_edit_mode` / `__deactivate_edit_mode` / `__edit_mode_available`) — don't remove those listeners.

**Visualizations are canvas-based and self-initializing.** `assets/swarm.js` exposes `BQSwarm.init(canvas, opts)`; pages call it inside a `window.addEventListener('load', …)` block per canvas. Swarm uses a seeded RNG for deterministic-looking runs — keep the seed stable when editing so the visuals don't drift between reloads.

## Adding a new page

1. Copy an existing page (e.g. `platform.html`) to preserve the mount-div scaffold, font preloads, `TWEAK_DEFAULTS` block, and `shared.js` load.
2. Add the page to the `links` array in `assets/shared.js` so it appears in the nav.
3. Set `<body data-has-hero="true">` only if the page has a hero — this controls whether the tweaks panel shows the Hero toggle.
