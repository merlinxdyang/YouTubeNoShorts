(() => {
  /* ═══════════════════════════════════════
     状态管理 — 支持从 background.js 开关
     ═══════════════════════════════════════ */
  let enabled = true;

  chrome.runtime?.onMessage?.addListener((msg) => {
    if (msg.type === "toggle") {
      enabled = msg.enabled;
      if (enabled) {
        activate();
      } else {
        deactivate();
      }
    }
  });

  chrome.storage?.local?.get("enabled", (result) => {
    enabled = result.enabled !== false;
    if (enabled) activate();
  });

  /* ═══════════════════════════════════════
     常量
     ═══════════════════════════════════════ */

  const HOME = "https://www.youtube.com/";
  const STYLE_ID = "yt-no-shorts-style";

  const SHORTS_TEXTS = [
    "shorts", "短片", "短视频", "ショート", "쇼츠",
    "curtas", "cortos", "courts", "kurzvideos", "cortometraggi",
  ];

  /* ═══════════════════════════════════════
     核心策略：纯 CSS 隐藏
     ——————————————————————————————
     所有 Shorts 元素都通过 <style> 标签隐藏，
     不使用 JS 内联样式修改 DOM，
     这样不会触发 MutationObserver 也不会引起闪烁。
     ═══════════════════════════════════════ */

  const CSS_RULES = `
    /* ── Shorts 专用渲染器（直接匹配标签名） ── */
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

    /* ── 带 Shorts 属性标记的 shelf ── */
    ytd-rich-shelf-renderer[is-shorts],
    ytd-rich-shelf-renderer[is-reel] {
      display: none !important;
    }

    /* ── 通过 overlay-style 属性匹配 Shorts 缩略图并隐藏父卡片 ── */
    ytd-rich-item-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),
    ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),
    ytd-grid-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]),
    ytd-compact-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]) {
      display: none !important;
    }

    /* ── 通过 Shorts 链接匹配并隐藏父卡片 ── */
    ytd-rich-item-renderer:has(a[href*="/shorts/"]),
    ytd-video-renderer:has(a[href*="/shorts/"]),
    ytd-grid-video-renderer:has(a[href*="/shorts/"]),
    ytd-compact-video-renderer:has(a[href*="/shorts/"]) {
      display: none !important;
    }

    /* ── 搜索结果中的 Shorts 卡片 ── */
    ytd-search ytd-video-renderer:has(a[href*="/shorts/"]),
    ytd-search ytd-video-renderer:has(ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"]) {
      display: none !important;
    }

    /* ── Shorts Remix 按钮 ── */
    ytd-button-renderer[button-renderer="SHORTS_REMIX"] {
      display: none !important;
    }

    /* ── 侧边栏 Shorts 入口（通过链接匹配） ── */
    ytd-guide-entry-renderer:has(a[href="/feed/shorts"]),
    ytd-mini-guide-entry-renderer:has(a[href="/feed/shorts"]) {
      display: none !important;
    }

    /* ── 频道页 Shorts Tab ── */
    yt-tab-shape[tab-title="Shorts"],
    yt-tab-shape[tab-title="shorts"] {
      display: none !important;
    }

    /* ── Shorts shelf 区块容器（搜索/首页中的 Shorts 推荐栏目） ── */
    ytd-item-section-renderer:has(.ytGridShelfViewModelHost),
    ytd-item-section-renderer:has(ytd-reel-shelf-renderer),
    ytd-item-section-renderer:has(yt-shelf-header-layout) {
      display: none !important;
    }
  `;

  /* ═══════════════════════════════════════
     CSS 注入/移除
     ═══════════════════════════════════════ */

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS_RULES;
    (document.documentElement || document.head || document.body).appendChild(style);
  }

  function removeStyle() {
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
  }

  /* ═══════════════════════════════════════
     JS 补充清理：仅处理 CSS 无法匹配的内容
     ——————————————————————————————
     只处理需要文本匹配的导航标签，
     使用 data 属性标记替代内联样式，
     通过 CSS class 隐藏而非直接修改 style。
     ═══════════════════════════════════════ */

  const HIDE_CLASS = "yt-no-shorts-hidden";

  /* 确保隐藏 class 的样式存在 */
  function ensureHideClass() {
    const id = "yt-no-shorts-hide-class";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `.${HIDE_CLASS} { display: none !important; }`;
    (document.documentElement || document.head || document.body).appendChild(s);
  }

  function hideByClass(el) {
    if (!el || el.classList.contains(HIDE_CLASS)) return;
    el.classList.add(HIDE_CLASS);
  }

  /* 通过文本内容匹配 Shorts 标签并隐藏 */
  function hideShortsTabs() {
    /* ── 1. 侧边栏导航标签 ── */
    const navSelectors = [
      "ytd-guide-entry-renderer",
      "ytd-mini-guide-entry-renderer",
      "tp-yt-paper-item",
      "ytm-pivot-bar-item-renderer",
    ];

    navSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((node) => {
        const text = (node.textContent || "").trim().toLowerCase();
        if (text && SHORTS_TEXTS.some((label) => text === label || text.includes(label))) {
          const link = node.querySelector("a");
          if (!link || (link.href && link.href.includes("shorts"))) {
            hideByClass(node);
          }
        }
      });
    });

    /* ── 2. 搜索筛选 chip（"Shorts" 按钮） ── */
    document.querySelectorAll("yt-chip-cloud-chip-renderer").forEach((chip) => {
      const text = (chip.textContent || "").trim().toLowerCase();
      if (SHORTS_TEXTS.some((label) => text === label)) {
        hideByClass(chip);
      }
    });

    /* ── 3. Shorts 区块标题和容器 ── */
    document.querySelectorAll("ytd-item-section-renderer").forEach((section) => {
      /* 检查是否包含 Shorts shelf */
      if (
        section.querySelector(".ytGridShelfViewModelHost") ||
        section.querySelector("ytd-reel-shelf-renderer") ||
        section.querySelector("yt-shelf-header-layout")
      ) {
        /* 检查标题文本是否为 Shorts */
        const header = section.querySelector("h2, .yt-shelf-header-layout__title");
        const headerText = (header?.textContent || "").trim().toLowerCase();
        if (SHORTS_TEXTS.some((label) => headerText === label || headerText.includes(label))) {
          hideByClass(section);
        }
      }
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
    if (location.href !== target) {
      location.replace(target);
    }
    return true;
  }

  /* ═══════════════════════════════════════
     点击拦截
     ═══════════════════════════════════════ */

  function interceptClick(event) {
    if (!enabled) return;
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
    if (!enabled) return;
    if (redirectIfOnShorts()) return;
    /* 导航后延迟执行一次标签清理 */
    scheduleTabCleanup();
  }

  /* ═══════════════════════════════════════
     标签清理调度 — 大幅防抖避免闪烁
     ═══════════════════════════════════════ */

  let tabTimer = null;
  function scheduleTabCleanup() {
    if (tabTimer) clearTimeout(tabTimer);
    tabTimer = setTimeout(() => {
      tabTimer = null;
      if (enabled) hideShortsTabs();
    }, 500);
  }

  /* ═══════════════════════════════════════
     MutationObserver — 仅用于标签清理
     ——————————————————————————————
     不再通过 observer 修改内联样式。
     CSS 选择器自动处理大部分隐藏工作。
     Observer 仅负责文本匹配的导航标签。
     ═══════════════════════════════════════ */

  let mutationCount = 0;
  const observer = new MutationObserver(() => {
    if (!enabled) return;
    mutationCount++;
    /* 每 10 次 DOM 变化才触发一次检查，大幅降低频率 */
    if (mutationCount % 10 === 0) {
      scheduleTabCleanup();
    }
  });

  /* ═══════════════════════════════════════
     激活/停用
     ═══════════════════════════════════════ */

  function activate() {
    injectStyle();
    ensureHideClass();
    if (redirectIfOnShorts()) return;
    /* 延迟执行标签清理，等 DOM 就绪 */
    scheduleTabCleanup();
    observer.observe(document.documentElement || document, {
      childList: true,
      subtree: true,
    });
  }

  function deactivate() {
    removeStyle();
    observer.disconnect();
    /* 移除所有通过 class 隐藏的标记 */
    document.querySelectorAll(`.${HIDE_CLASS}`).forEach((el) => {
      el.classList.remove(HIDE_CLASS);
    });
    const hideClassStyle = document.getElementById("yt-no-shorts-hide-class");
    if (hideClassStyle) hideClassStyle.remove();
  }

  /* ═══════════════════════════════════════
     初始化
     ═══════════════════════════════════════ */

  hookHistory();
  document.addEventListener("click", interceptClick, true);
  document.addEventListener("auxclick", interceptClick, true);

  /* 首次激活 */
  if (enabled) activate();

  /* DOMContentLoaded 后再检查一次标签 */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (enabled) scheduleTabCleanup();
    }, { once: true });
  }
})();
