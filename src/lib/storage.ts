import { AppData, Task, NotificationSettings } from "@/types/task";

const STORAGE_KEY = "time-tracker-data";

const isBrowser = typeof window !== "undefined";

/**
 * Asynchronous storage operations supporting both Web (localStorage) and Extension (chrome.storage).
 */

const getStorageItem = async (key: string): Promise<string | null> => {
    if (!isBrowser) return null;
    
    // Check for Chrome Extension environment
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                resolve((result[key] as string) || null);
            });
        });
    }

    // Fallback to localStorage
    return Promise.resolve(localStorage.getItem(key));
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
    if (!isBrowser) return;

    // Check for Chrome Extension environment
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, () => resolve());
        });
    }

// Fallback to localStorage
    localStorage.setItem(key, value);
    
    // Seamless Mirror Sync: Broadcast to the extension if available
    broadcastToExtension(key, value);
    
    return Promise.resolve();
};

/**
 * Pushes data to the Content Script (if the Chrome Extension is injected).
 */
const broadcastToExtension = (key: string, value: string) => {
    if (!isBrowser) return;
    try {
        window.postMessage({ type: "CHRONOLOG_SYNC_OUT", key, value }, "*");
    } catch (e) {
        // Silently fail if postMessage throws
    }
};

const removeStorageItem = async (key: string): Promise<void> => {
    if (!isBrowser) return;

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        return new Promise((resolve) => {
            chrome.storage.local.remove([key], () => resolve());
        });
    }

    localStorage.removeItem(key);
    
    // Broadcast removal to the extension
    try {
        window.postMessage({ type: "CHRONOLOG_SYNC_OUT", key, value: null }, "*");
    } catch (e) {}
    
    return Promise.resolve();
}

export const loadTasks = async (): Promise<Task[]> => {
    const data = await getStorageItem(STORAGE_KEY);
    if (!data) return [];
    try {
        const parsed = JSON.parse(data) as AppData;
        return parsed.tasks || [];
    } catch (e) {
        console.error("Failed to parse storage data", e);
        return [];
    }
};

export const saveTasks = async (tasks: Task[]): Promise<void> => {
    const data: AppData = { tasks };
    await setStorageItem(STORAGE_KEY, JSON.stringify(data));
};

export const getFirstAccessDate = async (): Promise<number> => {
    if (!isBrowser) return Date.now();
    const key = "chronolog-first-access";
    const existing = await getStorageItem(key);
    if (existing) return parseInt(existing);

    const now = Date.now();
    await setStorageItem(key, now.toString());
    return now;
};

export const addTask = async (task: Task): Promise<void> => {
    const tasks = await loadTasks();
    await saveTasks([...tasks, task]);
};

export const updateTask = async (updatedTask: Task): Promise<void> => {
    const tasks = await loadTasks();
    await saveTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
};

export const deleteTask = async (taskId: string): Promise<void> => {
    const tasks = await loadTasks();
    await saveTasks(tasks.filter((t) => t.id !== taskId));
};

export const getPendingAutoPause = async (): Promise<{ taskId: string; sessionId: string; pauseAt: number } | null> => {
    if (!isBrowser) return null;
    const data = await getStorageItem("chronolog-pending-autopause");
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
};

export const setPendingAutoPause = async (data: { taskId: string; sessionId: string; pauseAt: number }): Promise<void> => {
    if (!isBrowser) return;
    await setStorageItem("chronolog-pending-autopause", JSON.stringify(data));
};

export const clearPendingAutoPause = async (): Promise<void> => {
    if (!isBrowser) return;
    await removeStorageItem("chronolog-pending-autopause");
};

/** Get the global reminder interval in ms. null = disabled. */
export const getGlobalReminderInterval = async (): Promise<number | null> => {
    if (!isBrowser) return null;
    const raw = await getStorageItem("chronolog-global-reminder");
    if (raw === null) return null;
    const parsed = parseInt(raw);
    return isNaN(parsed) || parsed === 0 ? null : parsed;
};

/** Set the global reminder interval in ms. Pass null to disable. */
export const setGlobalReminderInterval = async (ms: number | null): Promise<void> => {
    if (!isBrowser) return;
    if (ms === null) {
        await removeStorageItem("chronolog-global-reminder");
    } else {
        await setStorageItem("chronolog-global-reminder", ms.toString());
    }
};

/** Get the daily goal in ms. Defaults to 8h (28,800,000 ms) if not set. */
export const getDailyGoal = async (): Promise<number> => {
    if (!isBrowser) return 8 * 3600000;
    const raw = await getStorageItem("chronolog-daily-goal");
    if (raw === null) return 8 * 3600000;
    const parsed = parseInt(raw);
    const goal = isNaN(parsed) || parsed <= 0 ? 8 * 3600000 : parsed;
    return Math.min(24 * 3600000, goal);
};

/** Set the daily goal in ms. */
export const setDailyGoal = async (ms: number): Promise<void> => {
    if (!isBrowser) return;
    await setStorageItem("chronolog-daily-goal", ms.toString());
};

/** Check if daily goal is enabled. Defaults to false. */
export const isDailyGoalEnabled = async (): Promise<boolean> => {
    if (!isBrowser) return false;
    return await getStorageItem("chronolog-daily-goal-enabled") === "true";
};

/** Set if daily goal is enabled. */
export const setDailyGoalEnabled = async (enabled: boolean): Promise<void> => {
    if (!isBrowser) return;
    await setStorageItem("chronolog-daily-goal-enabled", enabled.toString());
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    enabled: true,
    breakReminder: {
        enabled: false,
        thresholdMs: 3600000, // 1h
    },
    overtimeAlert: {
        enabled: true,
    },
    idleWarning: {
        enabled: true,
        thresholdMs: 14400000, // 4h
    },
    dailyGoalMilestones: {
        enabled: true,
    },
};

/** Get global notification settings. */
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
    if (!isBrowser) return DEFAULT_NOTIFICATION_SETTINGS;
    const raw = await getStorageItem("chronolog-notification-settings");
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    try {
        return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_NOTIFICATION_SETTINGS;
    }
};

/** Save global notification settings. */
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
    if (!isBrowser) return;
    await setStorageItem("chronolog-notification-settings", JSON.stringify(settings));
};

