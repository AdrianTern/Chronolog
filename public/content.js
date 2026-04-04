// content.js - Injected into the Web App context to bridge Extension storage
// run_at: document_start — executes before the page JS runs.

const STORAGE_KEYS = [
    "time-tracker-data",
    "chronolog-notification-settings",
    "chronolog-daily-goal",
    "chronolog-daily-goal-enabled",
    "chronolog-first-access",
    "chronolog-global-reminder",
    "chronolog-pending-autopause",
];

// =============================================================================
// 0. BOOT SYNC — runs once on every page load, before React hydrates.
//    Pulls the latest state from chrome.storage.local into localStorage so
//    the website always opens with the most up-to-date data from the extension.
// =============================================================================
// Flag the page that the extension is active so the web app can disable its own
// redundant notification timers to prevent double-firing.
sessionStorage.setItem("chronolog-extension-active", "true");

chrome.storage.local.get(null, (allItems) => {
    let appliedChanges = false;

    for (const key of Object.keys(allItems)) {
        // Only process known chronolog keys
        if (!STORAGE_KEYS.includes(key) && !key.startsWith("chronolog")) {
            continue;
        }

        const extValue = allItems[key];
        if (extValue === undefined || extValue === null) continue;

        const localValue = localStorage.getItem(key);
        if (localValue !== extValue) {
            localStorage.setItem(key, extValue);
            appliedChanges = true;
        }
    }

    // Fire a storage event so React's useTasks hook re-hydrates with fresh data.
    if (appliedChanges) {
        window.dispatchEvent(new Event("storage"));
    }
});

// =============================================================================
// 1. OUTBOUND — Web App → Extension
//    When the website saves data (via window.postMessage), we mirror it into
//    chrome.storage.local so the extension always has the latest state.
// =============================================================================
window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || event.data.type !== "CHRONOLOG_SYNC_OUT") {
        return;
    }

    const { key, value } = event.data;

    if (value === null || value === undefined) {
        chrome.storage.local.remove([key]);
    } else {
        chrome.storage.local.set({ [key]: value });
    }
});

// =============================================================================
// 2. INBOUND — Extension → Web App (real-time, while page is open)
//    When the extension popup changes something, immediately mirror it into
//    localStorage and trigger a React re-render.
// =============================================================================
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;

    let appliedChanges = false;

    for (const [key, change] of Object.entries(changes)) {
        if (!STORAGE_KEYS.includes(key) && !key.startsWith("chronolog")) {
            continue;
        }

        const newValue = change.newValue;
        const currentLocal = localStorage.getItem(key);

        if (newValue === undefined || newValue === null) {
            if (currentLocal !== null) {
                localStorage.removeItem(key);
                appliedChanges = true;
            }
        } else if (currentLocal !== newValue) {
            localStorage.setItem(key, newValue);
            appliedChanges = true;
        }
    }

    if (appliedChanges) {
        window.dispatchEvent(new Event("storage"));
    }
});
