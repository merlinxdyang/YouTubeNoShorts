(() => {
  /* ═══════════════════════════════════════
     状态管理 — 支持从 background.js 开关
     ═══════════════════════════════════════ */
  let enabled = true;

  /* 监听来自 background.js 的开关消息 */
  chrome.runtime?.onMessage?.addListener((msg) => {
    if (msg.type === "toggle") {
      enabled = msg.enabled;
      if (enabled) {
        cleanup();
      } else {
        restoreAll();
      }
    }
    if (msg.type === "query") {
      /* background 查询当前状态 */
    }
  });

  /* 启动时读取存储的状态 */
  chrome.storage?.local?.get("enabled", (result) => {
    enabled = result.enabled !== false; /* 默认开启 */
    if (enabled) {
      cleanup();
    }
  });

  /* ═══════════════════════════════════════
     常量定义
     ═══════════════════════════════════════ */

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
    "curtas",
    "cortos",
    "courts",
    "kurzvideos",
    "cortometraggi",
  ];

  /* ─── Shorts 渲染器组件选择器 ─── */
  const SHORTS_RENDERER_SELECTOR = [
    "ytd-reel-shelf-renderer",
    "ytd-reel-video-renderer",
    "ytd-reel-item-renderer",
    "ytd-shorts",
    "ytd-shorts-module-renderer",
    "ytd-rich-shelf-renderer[is-shorts]",
    "ytd-rich-shelf-renderer[is-reel]",
    "ytd-structured-description-shorts-shelf-renderer",
    "ytm-reel-shelf-renderer",
    "ytm-shorts-lockup-view-model",
    "ytm-shorts-lockup-view-model-v2",
  ].join(", ");

  /* ─── Shorts 链接选择器 ─── */
  const SHORTS_LINK_SELECTOR =
    'a[href*="/shorts/"], a[href*="/shorts?"], a[href*="feed/shorts"]';

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
    "yt-tab-shape",
    "tp-yt-paper-tab",
    "yt-chip-cloud-chip-renderer",
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
    /* 仅匹配 /shorts/ 或 /shorts?... 或 /feed/shorts */
    return /\/shorts(\/|$|\?)/.test(pathname) || pathname.startsWith("/feed/shorts");
  }

  function isShortsUrl(url) {
    const u = normalizeUrl(url);
    if (!u) return false;
    if (!isYoutubeHost(u.hostname)) return false;
    if (isShortsPath(u.pathname)) return true;
    return u.searchParams.get("feature") === "shorts";
  }

  /* ═══════════════════════════════════════
     CSS 注入
     ═══════════════════════════════════════ */

  function injectBlockingStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      /* ── Shorts 渲染器 ── */
      ${SHORTS_RENDERER_SELECTOR} {
        display: none !important;
      }

      /* ── Shorts 链接 ── */
      ${SHORTS_LINK_SELECTOR} {
        display: none !important;
      }

      /* ── 包含 Shorts overlay 标记的视频卡片 ── */
      ytd-rich-item-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),
      ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),
      ytd-grid-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),
      ytd-compact-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]) {
        display: none !important;
      }

      /* ── Shorts Remix 按钮 ── */
      ytd-button-renderer[button-renderer="SHORTS_REMIX"] {
        display: none !important;
      }

      /* ── 搜索结果中的 Shorts ── */
      ytd-search ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]) {
        display: none !important;
      }
    `;
    (document.documentElement || document.head || document.body).appendChild(style);
  }

  function removeBlockingStyle() {
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
  }

  /* ═══════════════════════════════════════
     DOM 操作
     ═══════════════════════════════════════ */

  function hideElement(el) {
    if (!el || el.getAttribute(NUKED_ATTR) === "1") return;
    el.setAttribute(NUKED_ATTR, "1");
    el.style.setProperty("display", "none", "important");
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
    document.querySelectorAll('a[href*="/shorts"]').forEach((anchor) => {
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
      .querySelectorAll(
        'ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]'
      )
      .forEach((overlay) => {
        hideElement(closestShortsContainer(overlay));
      });
  }

  /* ─── 清除导航栏和频道页的 Shorts Tab ─── */
  function nukeShortsTabsByLabel() {
    document.querySelectorAll(SHORTS_TAB_SELECTOR).forEach((node) => {
      const text = (node.textContent || "").trim().toLowerCase();
      if (!text) return;
      if (SHORTS_TEXTS.some((label) => text.includes(label))) {
        hideElement(node);
      }
    });
    document
      .querySelectorAll('yt-tab-shape[tab-title="Shorts"]')
      .forEach(hideElement);
  }

  /* ─── 恢复所有被隐藏的元素 ─── */
  function restoreAll() {
    removeBlockingStyle();
    document.querySelectorAll(`[${NUKED_ATTR}]`).forEach((el) => {
      el.removeAttribute(NUKED_ATTR);
      el.style.removeProperty("display");
    });
  }

  /* ═══════════════════════════════════════
     路由重定向
     ═══════════════════════════════════════ */

  function getSmartRedirectUrl() {
    const pathname = location.pathname;

    /* /@channel/shorts → /@channel */
    const channelShortsMatch = pathname.match(
      /^(\/@[^/]+|\/channel\/[^/]+|\/c\/[^/]+|\/user\/[^/]+)\/shorts/
    );
    if (channelShortsMatch) {
      return location.origin + channelShortsMatch[1];
    }

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
    if (!enabled) return;

    const anchor =
      event.target && event.target.closest
        ? event.target.closest("a[href]")
        : null;
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href || !isShortsUrl(href)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const u = normalizeUrl(href);
    if (u) {
      const channelMatch = u.pathname.match(
        /^(\/@[^/]+|\/channel\/[^/]+|\/c\/[^/]+|\/user\/[^/]+)\/shorts/
      );
      if (channelMatch) {
        location.assign(u.origin + channelMatch[1]);
        return;
      }
    }
    location.assign(HOME);
  }

  /* ═══════════════════════════════════════
     History 钩子 — SPA 导航检测
     ═══════════════════════════════════════ */

  function hookHistory() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    function onRouteChange() {
      if (!enabled) return;
      scheduleCleanup();
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

    /* 仅监听关键导航事件，移除过于频繁的 yt-action */
    ["popstate", "yt-navigate-finish", "yt-page-data-updated"].forEach(
      (eventName) => {
        window.addEventListener(eventName, onRouteChange, true);
      }
    );
  }

  /* ═══════════════════════════════════════
     主清理调度 — 防抖机制防止死循环
     ═══════════════════════════════════════ */

  let cleanupTimer = null;
  let isRunning = false;

  function scheduleCleanup() {
    if (cleanupTimer) return;
    cleanupTimer = setTimeout(() => {
      cleanupTimer = null;
      cleanup();
    }, 50);
  }

  function cleanup() {
    if (!enabled || isRunning) return;
    isRunning = true;

    /* 暂停 observer 避免修改 DOM 时触发自身 → 死循环 */
    observer.disconnect();

    try {
      injectBlockingStyle();
      if (redirectIfOnShorts()) return;
      nukeShortsRenderers();
      nukeShortsOverlays();
      nukeShortsLinks();
      nukeShortsTabsByLabel();
    } finally {
      isRunning = false;
      /* 重新连接 observer */
      startObserver();
    }
  }

  /* ═══════════════════════════════════════
     MutationObserver — DOM 变化检测
     ═══════════════════════════════════════ */

  const observer = new MutationObserver(() => {
    if (!enabled) return;
    scheduleCleanup();
  });

  function startObserver() {
    const root = document.documentElement || document;
    observer.observe(root, { childList: true, subtree: true });
  }

  /* ═══════════════════════════════════════
     初始化
     ═══════════════════════════════════════ */

  hookHistory();

  /* 点击拦截 */
  document.addEventListener("click", interceptNavigationEvent, true);
  document.addEventListener("auxclick", interceptNavigationEvent, true);

  /* 首次清理 */
  if (enabled) {
    cleanup();
  }

  /* 定时清理（兜底，间隔拉长避免性能问题） */
  setInterval(() => {
    if (enabled) scheduleCleanup();
  }, 2000);

  /* DOMContentLoaded 后再清理一次 */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (enabled) cleanup();
    }, { once: true });
  }
})();
