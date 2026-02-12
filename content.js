(() => {
  /* ═══════════════════════════════════════
     启动检查 — OFF 状态下完全不执行任何代码
     ═══════════════════════════════════════ */

  chrome.storage?.local?.get("enabled", (result) => {
    /* 默认开启；如果 OFF 则什么都不做，像没装插件一样 */
    if (result.enabled === false) return;
    init();
  });

  function init() {
    const HOME = "https://www.youtube.com/";
    const STYLE_ID = "yt-no-shorts-style";
    const HIDE_CLASS = "yt-no-shorts-hidden";

    const SHORTS_TEXTS = [
      "shorts", "短片", "短视频", "ショート", "쇼츠",
      "curtas", "cortos", "courts", "kurzvideos", "cortometraggi",
    ];

    /* ═══════════════════════════════════════
       CSS 注入 — 性能优化版
       ——————————————————————————————
       只用精准选择器，避免过多 :has() 开销。
       优先使用属性选择器和标签名。
       ═══════════════════════════════════════ */

    const CSS_RULES = `
      /* ── 隐藏工具 class ── */
      .${HIDE_CLASS} { display: none !important; }

      /* ── Shorts 专用渲染器 ── */
      ytd-reel-shelf-renderer,
      ytd-reel-video-renderer,
      ytd-reel-item-renderer,
      ytd-shorts,
      ytd-shorts-module-renderer,
      ytd-structured-description-shorts-shelf-renderer,
      ytm-reel-shelf-renderer,
      ytm-shorts-lockup-view-model,
      ytm-shorts-lockup-view-model-v2 {
        display: none !important;
      }

      /* ── 带属性标记的 Shorts shelf ── */
      ytd-rich-shelf-renderer[is-shorts],
      ytd-rich-shelf-renderer[is-reel] {
        display: none !important;
      }

      /* ── Shorts overlay 标记 → 隐藏父卡片 ── */
      ytd-rich-item-renderer:has(> ytd-rich-grid-media > div > ytd-thumbnail > a[href*="/shorts/"]),
      ytd-video-renderer:has(a[href*="/shorts/"]),
      ytd-grid-video-renderer:has(a[href*="/shorts/"]),
      ytd-compact-video-renderer:has(a[href*="/shorts/"]) {
        display: none !important;
      }

      /* ── Shorts Remix 按钮 ── */
      ytd-button-renderer[button-renderer="SHORTS_REMIX"] {
        display: none !important;
      }

      /* ── Shorts shelf 区块容器 ── */
      ytd-item-section-renderer:has(.ytGridShelfViewModelHost) {
        display: none !important;
      }

      /* ── 频道页 Shorts Tab ── */
      yt-tab-shape[tab-title="Shorts"],
      yt-tab-shape[tab-title="shorts"] {
        display: none !important;
      }
    `;

    /* ═══════════════════════════════════════
       注入 CSS
       ═══════════════════════════════════════ */

    function injectStyle() {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = CSS_RULES;
      (document.documentElement || document.head || document.body).appendChild(style);
    }

    /* ═══════════════════════════════════════
       JS 补充：处理 CSS 无法覆盖的文本匹配
       ═══════════════════════════════════════ */

    function hideByClass(el) {
      if (!el || el.classList.contains(HIDE_CLASS)) return;
      el.classList.add(HIDE_CLASS);
    }

    function cleanupTextBased() {
      /* 1. 搜索筛选 chip */
      document.querySelectorAll("yt-chip-cloud-chip-renderer").forEach((chip) => {
        const text = (chip.textContent || "").trim().toLowerCase();
        if (SHORTS_TEXTS.some((label) => text === label)) {
          hideByClass(chip);
        }
      });

      /* 2. Shorts 区块标题容器（包含 h2 "Shorts"） */
      document.querySelectorAll("ytd-item-section-renderer").forEach((section) => {
        if (section.classList.contains(HIDE_CLASS)) return;
        const header = section.querySelector("h2");
        if (header) {
          const headerText = (header.textContent || "").trim().toLowerCase();
          if (SHORTS_TEXTS.some((label) => headerText === label)) {
            hideByClass(section);
          }
        }
      });

      /* 3. 侧边栏 Shorts 入口 — 仅拦截链接，不隐藏 */
      document.querySelectorAll('ytd-guide-entry-renderer a[href="/feed/shorts"], ytd-mini-guide-entry-renderer a[href="/feed/shorts"]').forEach((link) => {
        link.addEventListener("click", blockShortsNav, true);
        /* 把链接指向首页，防止右键新标签打开 */
        link.setAttribute("href", "/");
      });
    }

    /* ═══════════════════════════════════════
       路由重定向
       ═══════════════════════════════════════ */

    function isShortsPath(pathname) {
      return /\/shorts(\/|$|\?)/.test(pathname) || pathname.startsWith("/feed/shorts");
    }

    function isShortsUrl(url) {
      try {
        const u = new URL(url, location.origin);
        if (u.hostname !== "youtube.com" && !u.hostname.endsWith(".youtube.com")) return false;
        if (isShortsPath(u.pathname)) return true;
        return u.searchParams.get("feature") === "shorts";
      } catch {
        return false;
      }
    }

    function redirectIfOnShorts() {
      if (!isShortsUrl(location.href)) return false;
      const pathname = location.pathname;
      const channelMatch = pathname.match(
        /^(\/@[^/]+|\/channel\/[^/]+|\/c\/[^/]+|\/user\/[^/]+)\/shorts/
      );
      const target = channelMatch ? location.origin + channelMatch[1] : HOME;
      if (location.href !== target) location.replace(target);
      return true;
    }

    /* ═══════════════════════════════════════
       点击拦截
       ═══════════════════════════════════════ */

    function blockShortsNav(event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    function interceptClick(event) {
      const anchor = event.target?.closest?.("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || !isShortsUrl(href)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      try {
        const u = new URL(href, location.origin);
        const m = u.pathname.match(
          /^(\/@[^/]+|\/channel\/[^/]+|\/c\/[^/]+|\/user\/[^/]+)\/shorts/
        );
        location.assign(m ? u.origin + m[1] : HOME);
      } catch {
        location.assign(HOME);
      }
    }

    /* ═══════════════════════════════════════
       History 钩子 — SPA 导航
       ═══════════════════════════════════════ */

    function hookHistory() {
      const origPush = history.pushState;
      const origReplace = history.replaceState;

      history.pushState = function () {
        const ret = origPush.apply(this, arguments);
        onNavigate();
        return ret;
      };
      history.replaceState = function () {
        const ret = origReplace.apply(this, arguments);
        onNavigate();
        return ret;
      };

      ["popstate", "yt-navigate-finish"].forEach((e) => {
        window.addEventListener(e, onNavigate, true);
      });
    }

    function onNavigate() {
      if (redirectIfOnShorts()) return;
      scheduleCleanup();
    }

    /* ═══════════════════════════════════════
       清理调度 — 防抖
       ═══════════════════════════════════════ */

    let cleanTimer = null;
    function scheduleCleanup() {
      if (cleanTimer) clearTimeout(cleanTimer);
      cleanTimer = setTimeout(() => {
        cleanTimer = null;
        cleanupTextBased();
      }, 300);
    }

    /* ═══════════════════════════════════════
       MutationObserver — 低频触发
       ═══════════════════════════════════════ */

    let mutCount = 0;
    const observer = new MutationObserver(() => {
      mutCount++;
      if (mutCount % 15 === 0) {
        scheduleCleanup();
      }
    });

    /* ═══════════════════════════════════════
       启动
       ═══════════════════════════════════════ */

    injectStyle();
    if (redirectIfOnShorts()) return;

    hookHistory();
    document.addEventListener("click", interceptClick, true);
    document.addEventListener("auxclick", interceptClick, true);

    scheduleCleanup();

    observer.observe(document.documentElement || document, {
      childList: true,
      subtree: true,
    });

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", scheduleCleanup, { once: true });
    }
  }
})();
