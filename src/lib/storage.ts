import { AppData, Task } from "@/types/task";

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
