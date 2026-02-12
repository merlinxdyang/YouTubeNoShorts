(() => {
  /* ═══════════════════════════════════════
     启动检查 — OFF 状态下完全不执行任何代码
     ═══════════════════════════════════════ */

  chrome.storage?.local?.get("enabled", (result) => {
    if (result.enabled === false) return;
    init();
  });

  function init() {
    const HOME = "https://www.youtube.com/";
    const SHORTS_ATTR = "data-shorts-blocked";

    /* ═══════════════════════════════════════
       超轻量 CSS — 零 :has() 开销
       ——————————————————————————————
       所有隐藏都通过简单的属性选择器完成。
       JS 只负责标记元素，CSS 负责隐藏。
       ═══════════════════════════════════════ */

    const CSS = `
      /* 被 JS 标记的 Shorts 容器 */
      [${SHORTS_ATTR}] { display: none !important; }

      /* Shorts 专用标签 — 直接隐藏 */
      ytd-reel-shelf-renderer,
      ytd-reel-video-renderer,
      ytd-reel-item-renderer,
      ytd-shorts,
      ytm-reel-shelf-renderer,
      ytm-shorts-lockup-view-model,
      ytm-shorts-lockup-view-model-v2,
      ytd-rich-shelf-renderer[is-shorts],
      ytd-rich-shelf-renderer[is-reel] { display: none !important; }

      /* Shorts Tab */
      yt-tab-shape[tab-title="Shorts"],
      yt-tab-shape[tab-title="shorts"] { display: none !important; }
    `;

    /* 注入 CSS */
    if (!document.getElementById("yt-no-shorts")) {
      const s = document.createElement("style");
      s.id = "yt-no-shorts";
      s.textContent = CSS;
      (document.head || document.documentElement).appendChild(s);
    }

    /* ═══════════════════════════════════════
       核心逻辑：标记 Shorts 容器
       ——————————————————————————————
       MutationObserver 只做一件事：
       找到包含 /shorts/ 链接的视频卡片，
       给它加上 data 属性，让 CSS 隐藏。
       ═══════════════════════════════════════ */

    function markShortsContainers() {
      /* 只查找还没被标记的 Shorts 链接 */
      const links = document.querySelectorAll(`a[href*="/shorts/"]:not([${SHORTS_ATTR}])`);

      links.forEach((link) => {
        /* 标记链接本身，防止重复处理 */
        link.setAttribute(SHORTS_ATTR, "");

        /* 向上找到视频卡片容器并标记 */
        const container = link.closest(
          "ytd-video-renderer, ytd-grid-video-renderer, ytd-rich-item-renderer, " +
          "ytd-compact-video-renderer, ytd-movie-renderer"
        );

        if (container && !container.hasAttribute(SHORTS_ATTR)) {
          container.setAttribute(SHORTS_ATTR, "");
        }
      });

      /* 标记包含 Shorts 字样的 section */
      document.querySelectorAll("ytd-item-section-renderer:not([" + SHORTS_ATTR + "])").forEach((section) => {
        const h2 = section.querySelector("h2");
        if (h2 && /shorts|短片|短视频/i.test(h2.textContent)) {
          section.setAttribute(SHORTS_ATTR, "");
        }
      });

      /* 标记搜索筛选 chip */
      document.querySelectorAll("yt-chip-cloud-chip-renderer:not([" + SHORTS_ATTR + "])").forEach((chip) => {
        if (/^shorts$/i.test(chip.textContent?.trim())) {
          chip.setAttribute(SHORTS_ATTR, "");
        }
      });
    }

    /* ═══════════════════════════════════════
       路由拦截
       ═══════════════════════════════════════ */

    function isShortsUrl(url) {
      try {
        const u = new URL(url, location.origin);
        return /\/shorts(\/|$|\?)/.test(u.pathname) ||
          u.pathname.startsWith("/feed/shorts") ||
          u.searchParams.get("feature") === "shorts";
      } catch {
        return false;
      }
    }

    function redirectIfShorts() {
      if (!isShortsUrl(location.href)) return false;
      const match = location.pathname.match(/^(\/@[^/]+|\/channel\/[^/]+|\/c\/[^/]+|\/user\/[^/]+)\/shorts/);
      location.replace(match ? location.origin + match[1] : HOME);
      return true;
    }

    /* ═══════════════════════════════════════
       点击拦截
       ═══════════════════════════════════════ */

    document.addEventListener("click", (e) => {
      const a = e.target?.closest?.("a[href]");
      if (!a) return;

      const href = a.getAttribute("href");
      if (!href || !isShortsUrl(href)) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      /* 频道 Shorts 页面 → 跳到频道主页 */
      try {
        const u = new URL(href, location.origin);
        const m = u.pathname.match(/^(\/@[^/]+|\/channel\/[^/]+|\/c\/[^/]+|\/user\/[^/]+)\/shorts/);
        location.assign(m ? u.origin + m[1] : HOME);
      } catch {
        location.assign(HOME);
      }
    }, true);

    /* ═══════════════════════════════════════
       SPA 导航监听
       ═══════════════════════════════════════ */

    const origPush = history.pushState;
    const origReplace = history.replaceState;

    history.pushState = function () {
      const r = origPush.apply(this, arguments);
      onNav();
      return r;
    };
    history.replaceState = function () {
      const r = origReplace.apply(this, arguments);
      onNav();
      return r;
    };

    window.addEventListener("popstate", onNav);
    window.addEventListener("yt-navigate-finish", onNav);

    function onNav() {
      if (!redirectIfShorts()) {
        /* 延迟标记，等 DOM 更新 */
        setTimeout(markShortsContainers, 100);
      }
    }

    /* ═══════════════════════════════════════
       MutationObserver — 极简版
       ——————————————————————————————
       只监听新增的链接和容器，立即标记。
       不做任何 DOM 查询，只处理新增节点。
       ═══════════════════════════════════════ */

    let pending = false;
    const observer = new MutationObserver((mutations) => {
      if (pending) return;

      /* 检查是否有添加节点 */
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          pending = true;
          /* requestIdleCallback 在浏览器空闲时执行，不阻塞渲染 */
          (window.requestIdleCallback || setTimeout)(() => {
            pending = false;
            markShortsContainers();
          });
          break;
        }
      }
    });

    /* ═══════════════════════════════════════
       启动
       ═══════════════════════════════════════ */

    if (redirectIfShorts()) return;

    /* 首次标记 */
    markShortsContainers();

    /* 开始监听 */
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    /* DOM 加载完成后再标记一次 */
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", markShortsContainers, { once: true });
    }
  }
})();
