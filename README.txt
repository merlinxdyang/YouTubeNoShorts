YouTubeNoShorts v2.0 (Manifest V3)
====================================

What it does (5 layers of blocking)
------------------------------------
1. ROUTE REDIRECT
   - /shorts/* → YouTube home
   - /feed/shorts → YouTube home
   - /@channel/shorts → channel home (smart redirect)

2. NETWORK BLOCKING (declarativeNetRequest)
   - Blocks /shorts/ sub-resources
   - Blocks /youtubei/v1/reel/* API
   - Blocks /youtubei/v1/shorts/* API
   - Blocks FEshorts browse requests
   - Blocks shorts_shelf data
   - Blocks reel_watch_sequence

3. UI HIDING (CSS injection)
   - Shorts renderer components (ytd-reel-shelf-renderer, etc.)
   - overlay-style="SHORTS" thumbnails (:has() selector)
   - Shorts links and navigation entries
   - Channel page "Shorts" tab
   - Shorts Remix button
   - Supports 10+ languages

4. CLICK INTERCEPTION
   - Left click, middle click (auxclick), right-click menu
   - window.open hijacking

5. FETCH INTERCEPTION
   - Intercepts fetch() calls to Shorts API endpoints
   - Returns empty responses to prevent data loading

Install on Google Chrome
-------------------------
1) Open chrome://extensions
2) Turn on "Developer mode"
3) Click "Load unpacked"
4) Select this folder: YouTubeNoShorts/

Install on Microsoft Edge
--------------------------
1) Open edge://extensions
2) Turn on "Developer mode"
3) Click "Load unpacked"
4) Select this folder: YouTubeNoShorts/

Quick verification
-------------------
1) Open https://www.youtube.com/shorts/... → should redirect to home
2) Open https://www.youtube.com/@channel/shorts → should redirect to channel home
3) Search videos → no Shorts cards should appear
4) Check left sidebar → no "Shorts" entry visible
5) Open any channel → no "Shorts" tab visible
6) Click any Shorts link → should be blocked

Notes
------
- Chromium extension APIs are shared between Chrome and Edge,
  so this MV3 extension works on both browsers without modification.
- YouTube may change markup over time; this extension blocks Shorts
  using 5 independent layers for maximum coverage.
- The extension runs in all frames (including embedded iframes).
