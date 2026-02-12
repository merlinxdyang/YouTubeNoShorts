/* ═══════════════════════════════════════
   YouTubeNoShorts — Background Service Worker
   点击图标切换 ON/OFF + Badge 显示状态
   ——————————————————————————————
   切换机制：改变 storage + 刷新标签页
   content.js 启动时读 storage 决定是否执行
   OFF 时 content.js 完全不运行 = 像没装插件
   ═══════════════════════════════════════ */

/* 初始化 */
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get("enabled", (result) => {
        const on = result.enabled !== false;
        chrome.storage.local.set({ enabled: on });
        updateBadge(on);
        updateRules(on);
    });
});

/* 启动时同步 badge */
chrome.storage.local.get("enabled", (result) => {
    const on = result.enabled !== false;
    updateBadge(on);
    updateRules(on);
});

/* 点击图标 → 切换 */
chrome.action.onClicked.addListener((tab) => {
    chrome.storage.local.get("enabled", (result) => {
        const newState = !(result.enabled !== false);
        chrome.storage.local.set({ enabled: newState }, () => {
            updateBadge(newState);
            updateRules(newState);

            /* 刷新当前标签页让变更生效 */
            if (tab?.id) {
                chrome.tabs.reload(tab.id);
            }
        });
    });
});

/* Badge */
function updateBadge(on) {
    chrome.action.setBadgeText({ text: on ? "ON" : "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: on ? "#E53935" : "#9E9E9E" });
    chrome.action.setTitle({
        title: on
            ? "YouTubeNoShorts — ON (click to disable)"
            : "YouTubeNoShorts — OFF (click to enable)",
    });
}

/* 动态开关网络拦截规则 */
function updateRules(on) {
    if (on) {
        chrome.declarativeNetRequest.updateEnabledRulesets({
            enableRulesetIds: ["shorts_rules"],
        }).catch(() => { });
    } else {
        chrome.declarativeNetRequest.updateEnabledRulesets({
            disableRulesetIds: ["shorts_rules"],
        }).catch(() => { });
    }
}
