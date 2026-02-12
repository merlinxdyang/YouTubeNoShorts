# YouTubeNoShorts

> Completely block YouTube Shorts on Chrome and Edge — 5 layers of blocking for maximum coverage.

## Features

🚫 **Route Redirect** — `/shorts/*` → Home, `/@channel/shorts` → Channel Home  
🌐 **Network Blocking** — 7 declarativeNetRequest rules block Shorts APIs  
🎨 **CSS Injection** — Hide Shorts cards via `overlay-style="SHORTS"` + `:has()` selectors  
🖱️ **Click Interception** — Left/middle/right click + `window.open` hijack  
📡 **Fetch Interception** — Intercept `fetch()` calls to Shorts API endpoints  

## Install

### Chrome
1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select the `YouTubeNoShorts` folder

### Edge
1. Open `edge://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select the same `YouTubeNoShorts` folder

## How it works

| Layer | Method | What it blocks |
|-------|--------|----------------|
| 1 | Route redirect | Direct navigation to `/shorts/*` |
| 2 | Network rules | Shorts API responses (`reel`, `shorts`, `FEshorts`) |
| 3 | CSS injection | Shorts UI components, thumbnails, tabs, sidebar entries |
| 4 | Click intercept | Clicks on Shorts links (left/middle/right) |
| 5 | Fetch intercept | JS-level API calls for Shorts data |

## Supported Languages

Shorts labels are detected in: English, 中文, 日本語, 한국어, Português, Español, Français, Deutsch, Italiano.

## License

MIT
