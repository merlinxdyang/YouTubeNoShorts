/* ═══════════════════════════════════════
   YouTubeNoShorts — Background Service Worker
   点击图标切换开/关 + Badge 显示状态
   ═══════════════════════════════════════ */

/* 初始化：设置默认状态 */
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get("enabled", (result) => {
        const isEnabled = result.enabled !== false;
        chrome.storage.local.set({ enabled: isEnabled });
        updateBadge(isEnabled);
        updateRules(isEnabled);
    });
});

/* 启动时同步 badge */
chrome.storage.local.get("enabled", (result) => {
    const isEnabled = result.enabled !== false;
    updateBadge(isEnabled);
    updateRules(isEnabled);
});

/* 点击图标：切换开关 */
chrome.action.onClicked.addListener((tab) => {
    chrome.storage.local.get("enabled", (result) => {
        const newState = !(result.enabled !== false);
        chrome.storage.local.set({ enabled: newState }, () => {
            updateBadge(newState);
            updateRules(newState);

            /* 通知所有 YouTube 标签页 */
            chrome.tabs.query({ url: ["*://youtube.com/*", "*://*.youtube.com/*"] }, (tabs) => {
                for (const t of tabs) {
                    chrome.tabs.sendMessage(t.id, { type: "toggle", enabled: newState }).catch(() => { });
                }
                /* 刷新当前标签页让变更立即生效 */
                if (tab && tab.id) {
                    chrome.tabs.reload(tab.id);
                }
            });
        });
    });
});

/* 更新 Badge 显示 */
function updateBadge(isEnabled) {
    if (isEnabled) {
        chrome.action.setBadgeText({ text: "ON" });
        chrome.action.setBadgeBackgroundColor({ color: "#E53935" });
        chrome.action.setTitle({ title: "YouTubeNoShorts — ON (click to disable)" });
    } else {
        chrome.action.setBadgeText({ text: "OFF" });
        chrome.action.setBadgeBackgroundColor({ color: "#9E9E9E" });
        chrome.action.setTitle({ title: "YouTubeNoShorts — OFF (click to enable)" });
    }
}

/* 动态开关 declarativeNetRequest 规则 */
function updateRules(isEnabled) {
    const allRuleIds = [1, 2, 3, 4, 5, 6, 7];

    if (isEnabled) {
        chrome.declarativeNetRequest.updateEnabledRulesets({
            enableRulesetIds: ["shorts_rules"],
        }).catch(() => { });
    } else {
        chrome.declarativeNetRequest.updateEnabledRulesets({
            disableRulesetIds: ["shorts_rules"],
        }).catch(() => { });
    }
}
