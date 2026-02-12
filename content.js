(() => {
  const HOME = "https://www.youtube.com/";
  const STYLE_ID = "yt-no-shorts-style";
  const NUKED_ATTR = "data-shorts-nuked";

  /* ─── Shorts 多语言文本标签 ─── */
  const SHORTS_TEXTS = [
    "shorts",
    "短片",
    "短视频",
    "ショート",
    "쇼츠",
    "curtas",        // 葡萄牙语
    "cortos",        // 西班牙语
    "courts",        // 法语
    "kurzvideos",    // 德语
    "cortometraggi", // 意大利语
  ];

  /* ─── Shorts 渲染器组件选择器 ─── */
  const SHORTS_RENDERER_SELECTOR = [
    "ytd-reel-shelf-renderer",
    "ytd-reel-video-renderer",
    "ytd-reel-item-renderer",
    "ytd-shorts",
    "ytd-shorts-module-renderer",
    "ytd-rich-shelf-renderer[is-shorts]",
    'ytd-rich-shelf-renderer[is-reel]',
    "ytd-structured-description-shorts-shelf-renderer",
    "ytm-reel-shelf-renderer",
    "ytm-shorts-lockup-view-model",
    "ytm-shorts-lockup-view-model-v2",
    /* Shorts overlay 标记 — 最可靠的 Shorts 标识 */
    'ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]',
  ].join(", ");

  /* ─── Shorts 链接选择器 ─── */
  const SHORTS_LINK_SELECTOR = 'a[href*="/shorts/"], a[href*="/shorts?"], a[href*="feed/shorts"]';

  /* ─── Shorts 容器选择器（向上查找最近容器进行隐藏） ─── */
  const SHORTS_CONTAINER_SELECTOR = [
    "ytd-guide-entry-renderer",
    "ytd-mini-guide-entry-renderer",
    "ytd-rich-item-renderer",
    "ytd-rich-section-renderer",
    "ytd-grid-video-renderer",
    "ytd-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-reel-item-renderer",
    "ytd-reel-video-renderer",
    "ytd-rich-shelf-renderer",
    "ytd-item-section-renderer",
    "ytd-shelf-renderer",
    "ytm-item-section-renderer",
    "ytm-video-with-context-renderer",
    "ytm-compact-video-renderer",
    "ytm-rich-item-renderer",
    "ytm-shorts-lockup-view-model",
    "ytm-shorts-lockup-view-model-v2",
    "tp-yt-paper-item",
  ];

  /* ─── 频道页/导航 Tab 选择器 ─── */
  const SHORTS_TAB_SELECTOR = [
    "ytd-guide-entry-renderer",
    "ytd-mini-guide-entry-renderer",
    "tp-yt-paper-item",
    "ytm-pivot-bar-item-renderer",
    /* 频道页 Tab */
    "yt-tab-shape",
    "tp-yt-paper-tab",
    "yt-chip-cloud-chip-renderer",
    /* YouTube 新版 Tab 组件 */
    "yt-tab-group-shape yt-tab-shape",
  ].join(", ");

  /* ═══════════════════════════════════════
     工具函数
     ═══════════════════════════════════════ */

  function normalizeUrl(url) {
    try {
      return new URL(url, location.origin);
    } catch {
      return null;
    }
  }

  function isYoutubeHost(hostname) {
    return hostname === "youtube.com" || hostname.endsWith(".youtube.com");
  }

  function isShortsPath(pathname) {
    return /(^|\/)shorts(\/|$|\?)/.test(pathname) || pathname.startsWith("/feed/shorts");
  }

  function isShortsUrl(url) {
    const u = normalizeUrl(url);
    if (!u) return false;
    if (!isYoutubeHost(u.hostname)) return false;
    if (isShortsPath(u.pathname)) return true;
    return u.searchParams.get("feature") === "shorts";
  }

  /* ═══════════════════════════════════════
     CSS 注入：立即隐藏所有已知 Shorts 元素
     ═══════════════════════════════════════ */

  function injectBlockingStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* ── Shorts 渲染器 ── */
      ${SHORTS_RENDERER_SELECTOR} {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
        pointer-events: none !important;
      }

      /* ── Shorts 链接 ── */
      ${SHORTS_LINK_SELECTOR} {
        display: none !important;
        visibility: hidden !important;
      }

      /* ── 包含 Shorts overlay 标记的视频卡片 ── */
      ytd-rich-item-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),
      ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),
      ytd-grid-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),
      ytd-compact-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),
      ytd-item-section-renderer:not(:has(ytd-grid-renderer)):has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]) {
        display: none !important;
        visibility: hidden !important;
      }

      /* ── Shorts Remix 按钮 ── */
      ytd-button-renderer[button-renderer="SHORTS_REMIX"],
      button[aria-label*="Remix"],
      .ytd-shorts-remix-button {
        display: none !important;
      }

      /* ── 搜索结果中的 Shorts badge ── */
      ytd-search ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]) {
        display: none !important;
      }
    `;
    (document.documentElement || document.head || document.body).appendChild(style);
  }

  /* ═══════════════════════════════════════
     DOM 操作
     ═══════════════════════════════════════ */

  function hideElement(el) {
    if (!el || el.getAttribute(NUKED_ATTR) === "1") return;
    el.style.setProperty("display", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("height", "0", "important");
    el.style.setProperty("overflow", "hidden", "important");
    el.setAttribute(NUKED_ATTR, "1");
  }

  function closestShortsContainer(node) {
    for (const selector of SHORTS_CONTAINER_SELECTOR) {
      const container = node.closest(selector);
      if (container) return container;
    }
    return node;
  }

  /* ─── 清除 Shorts 链接 ─── */
  function nukeShortsLinks() {
    document.querySelectorAll('a[href*="shorts"]').forEach(anchor => {
      const href = anchor.getAttribute("href");
      if (!href || !isShortsUrl(href)) return;
      hideElement(closestShortsContainer(anchor));
    });
  }

  /* ─── 清除 Shorts 渲染器组件 ─── */
  function nukeShortsRenderers() {
    document.querySelectorAll(SHORTS_RENDERER_SELECTOR).forEach(hideElement);
  }

  /* ─── 清除 Shorts overlay 标记的视频 ─── */
  function nukeShortsOverlays() {
    document
      .querySelectorAll('ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]')
      .forEach(overlay => {
        hideElement(closestShortsContainer(overlay));
      });
  }

  /* ─── 清除导航栏和频道页的 Shorts Tab ─── */
  function nukeShortsTabsByLabel() {
    document.querySelectorAll(SHORTS_TAB_SELECTOR).forEach(node => {
      const text = (node.textContent || "").trim().toLowerCase();
      if (!text) return;
      if (SHORTS_TEXTS.some(label => text.includes(label))) {
        hideElement(node);
      }
    });

    /* 频道页 Shorts tab — 使用 tab-title 属性精确匹配 */
    document.querySelectorAll('yt-tab-shape[tab-title="Shorts"]').forEach(hideElement);
    document.querySelectorAll('yt-tab-shape[tab-title="shorts"]').forEach(hideElement);
  }

  /* ═══════════════════════════════════════
     路由重定向
     ═══════════════════════════════════════ */

  function getSmartRedirectUrl() {
    const pathname = location.pathname;

    /* /@channel/shorts → /@channel */
    const channelShortsMatch = pathname.match(/^(\/@[^/]+|\/channel\/[^/]+|\/c\/[^/]+|\/user\/[^/]+)\/shorts/);
    if (channelShortsMatch) {
      return location.origin + channelShortsMatch[1];
    }

    /* /feed/shorts → 首页 */
    /* /shorts/xxxID → 首页 */
    return HOME;
  }

  function redirectIfOnShorts() {
    if (!isShortsUrl(location.href)) return false;
    const target = getSmartRedirectUrl();
    if (location.href !== target) {
      location.replace(target);
    }
    return true;
  }

  /* ═══════════════════════════════════════
     点击拦截
     ═══════════════════════════════════════ */

  function interceptNavigationEvent(event) {
    const anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href || !isShortsUrl(href)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    /* 智能重定向：如果是频道 Shorts 链接，跳到频道主页 */
    const u = normalizeUrl(href);
    if (u) {
      const channelMatch = u.pathname.match(/^(\/@[^/]+|\/channel\/[^/]+|\/c\/[^/]+|\/user\/[^/]+)\/shorts/);
      if (channelMatch) {
        location.assign(u.origin + channelMatch[1]);
        return;
      }
    }
    location.assign(HOME);
  }

  /* ═══════════════════════════════════════
     window.open / History 钩子
     ═══════════════════════════════════════ */

  function hookWindowOpen() {
    const originalOpen = window.open;
    if (typeof originalOpen !== "function") return;

    window.open = function patchedOpen(url) {
      if (typeof url === "string" && isShortsUrl(url)) {
        return originalOpen.call(window, HOME, "_self");
      }
      return originalOpen.apply(this, arguments);
    };
  }

  function hookHistory() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    function onRouteChange() {
      cleanup();
    }

    history.pushState = function patchedPushState() {
      const ret = originalPushState.apply(this, arguments);
      onRouteChange();
      return ret;
    };

    history.replaceState = function patchedReplaceState() {
      const ret = originalReplaceState.apply(this, arguments);
      onRouteChange();
      return ret;
    };

    [
      "popstate",
      "yt-navigate-start",
      "yt-navigate-finish",
      "yt-page-data-updated",
      "yt-page-data-fetched",
      "yt-action",
      "spfdone",
    ].forEach(eventName => {
      window.addEventListener(eventName, onRouteChange, true);
    });
  }

  /* ═══════════════════════════════════════
     XHR / Fetch 拦截 — 过滤响应中的 Shorts 数据
     ═══════════════════════════════════════ */

  function hookFetch() {
    const originalFetch = window.fetch;
    if (typeof originalFetch !== "function") return;

    window.fetch = function patchedFetch(input) {
      const url = typeof input === "string" ? input : (input && input.url) || "";
      /* 拦截 Shorts 相关 API */
      if (
        typeof url === "string" &&
        (url.includes("/youtubei/v1/reel/") ||
          url.includes("/youtubei/v1/shorts/") ||
          (url.includes("/youtubei/v1/browse") && url.includes("FEshorts")))
      ) {
        return Promise.resolve(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      return originalFetch.apply(this, arguments);
    };
  }

  /* ═══════════════════════════════════════
     主清理调度
     ═══════════════════════════════════════ */

  let scheduled = false;
  function cleanup() {
    if (scheduled) return;
    scheduled = true;

    requestAnimationFrame(() => {
      scheduled = false;
      injectBlockingStyle();
      if (redirectIfOnShorts()) return;
      nukeShortsRenderers();
      nukeShortsOverlays();
      nukeShortsLinks();
      nukeShortsTabsByLabel();
    });
  }

  /* ═══════════════════════════════════════
     初始化
     ═══════════════════════════════════════ */

  /* 注入钩子 */
  hookHistory();
  hookWindowOpen();
  hookFetch();

  /* 点击拦截 */
  document.addEventListener("click", interceptNavigationEvent, true);
  document.addEventListener("auxclick", interceptNavigationEvent, true);  /* 中键点击 */
  document.addEventListener("contextmenu", interceptNavigationEvent, true); /* 右键菜单 */

  /* 首次清理 */
  cleanup();

  /* MutationObserver — DOM 变化时触发清理 */
  const observer = new MutationObserver(cleanup);
  observer.observe(document.documentElement || document, {
    childList: true,
    subtree: true,
  });

  /* 定时清理（兜底） */
  setInterval(cleanup, 1200);

  /* DOMContentLoaded 后再清理一次以确保完整 */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cleanup, { once: true });
  }
})();
