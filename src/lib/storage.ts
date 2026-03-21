import { AppData, Task, NotificationSettings } from "@/types/task";

const STORAGE_KEY = "time-tracker-data";

const isBrowser = typeof window !== "undefined";

/**
 * Synchronous local storage operations.
 * Important: This uses localStorage which is synchronous and can block the main thread.
 * For very large datasets spanning thousands of tasks, consider migrating to IndexedDB.
 */
export const loadTasks = (): Task[] => {
    if (!isBrowser) return [];
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
        const parsed = JSON.parse(data) as AppData;
        return parsed.tasks || [];
    } catch (e) {
        console.error("Failed to parse storage data", e);
        return [];
    }
};

export const saveTasks = (tasks: Task[]) => {
    if (!isBrowser) return;
    const data: AppData = { tasks };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getFirstAccessDate = (): number => {
    if (!isBrowser) return Date.now();
    const key = "chronolog-first-access";
    const existing = localStorage.getItem(key);
    if (existing) return parseInt(existing);

    const now = Date.now();
    localStorage.setItem(key, now.toString());
    return now;
};

export const addTask = (task: Task) => {
    const tasks = loadTasks();
    saveTasks([...tasks, task]);
};

export const updateTask = (updatedTask: Task) => {
    const tasks = loadTasks();
    saveTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
};

export const deleteTask = (taskId: string) => {
    const tasks = loadTasks();
    saveTasks(tasks.filter((t) => t.id !== taskId));
};

export const getPendingAutoPause = (): { taskId: string; sessionId: string; pauseAt: number } | null => {
    if (!isBrowser) return null;
    const data = localStorage.getItem("chronolog-pending-autopause");
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
};

export const setPendingAutoPause = (data: { taskId: string; sessionId: string; pauseAt: number }) => {
    if (!isBrowser) return;
    localStorage.setItem("chronolog-pending-autopause", JSON.stringify(data));
};

export const clearPendingAutoPause = () => {
    if (!isBrowser) return;
    localStorage.removeItem("chronolog-pending-autopause");
};

/** Get the global reminder interval in ms. null = disabled. */
export const getGlobalReminderInterval = (): number | null => {
    if (!isBrowser) return null;
    const raw = localStorage.getItem("chronolog-global-reminder");
    if (raw === null) return null;
    const parsed = parseInt(raw);
    return isNaN(parsed) || parsed === 0 ? null : parsed;
};

/** Set the global reminder interval in ms. Pass null to disable. */
export const setGlobalReminderInterval = (ms: number | null) => {
    if (!isBrowser) return;
    if (ms === null) {
        localStorage.removeItem("chronolog-global-reminder");
    } else {
        localStorage.setItem("chronolog-global-reminder", ms.toString());
    }
};

/** Get the daily goal in ms. Defaults to 8h (28,800,000 ms) if not set. */
export const getDailyGoal = (): number => {
    if (!isBrowser) return 8 * 3600000;
    const raw = localStorage.getItem("chronolog-daily-goal");
    if (raw === null) return 8 * 3600000;
    const parsed = parseInt(raw);
    const goal = isNaN(parsed) || parsed <= 0 ? 8 * 3600000 : parsed;
    return Math.min(24 * 3600000, goal);
};

/** Set the daily goal in ms. */
export const setDailyGoal = (ms: number) => {
    if (!isBrowser) return;
    localStorage.setItem("chronolog-daily-goal", ms.toString());
};

/** Check if daily goal is enabled. Defaults to false. */
export const isDailyGoalEnabled = (): boolean => {
    if (!isBrowser) return false;
    return localStorage.getItem("chronolog-daily-goal-enabled") === "true";
};

/** Set if daily goal is enabled. */
export const setDailyGoalEnabled = (enabled: boolean) => {
    if (!isBrowser) return;
    localStorage.setItem("chronolog-daily-goal-enabled", enabled.toString());
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
export const getNotificationSettings = (): NotificationSettings => {
    if (!isBrowser) return DEFAULT_NOTIFICATION_SETTINGS;
    const raw = localStorage.getItem("chronolog-notification-settings");
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    try {
        return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_NOTIFICATION_SETTINGS;
    }
};

/** Save global notification settings. */
export const saveNotificationSettings = (settings: NotificationSettings) => {
    if (!isBrowser) return;
    localStorage.setItem("chronolog-notification-settings", JSON.stringify(settings));
};

