import { useState, useEffect, useCallback } from "react";
import { Task } from "@/types/task";
import * as storage from "@/lib/storage";

export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isHydrating, setIsHydrating] = useState(true);

    const refreshTasks = useCallback(async () => {
        const loadedTasks = await storage.loadTasks();
        setTasks(loadedTasks);
    }, []);

    useEffect(() => {
        const initialize = async () => {
            await refreshTasks();
            setIsHydrating(false);
        };
        initialize();

        // --- Mirror Sync Listeners ---

        // Listen for Storage Events (Between multiple Web Tabs, or injected from content.js)
        const handleStorage = (e: StorageEvent | Event) => {
            // e could be a StorageEvent (from other tabs) or a custom Event (from content.js)
            // If it's a native StorageEvent, check the key to prevent over-rendering
            if (e instanceof StorageEvent) {
                if (e.key && !e.key.includes("chronolog") && e.key !== "time-tracker-data") {
                    return; // Ignore irrelevant keys
                }
            }
            refreshTasks();
        };
        
        window.addEventListener("storage", handleStorage);

        // Listen for chrome.storage changes (When running inside the Extension Popup)
        if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
            const handleExtStorage = (changes: any, area: string) => {
                if (area === "local") {
                    refreshTasks();
                }
            };
            chrome.storage.onChanged.addListener(handleExtStorage);
            
            return () => {
                window.removeEventListener("storage", handleStorage);
                chrome.storage.onChanged.removeListener(handleExtStorage);
            };
        }

        return () => {
            window.removeEventListener("storage", handleStorage);
        };
    }, [refreshTasks]);

    const addTask = useCallback(async (name: string) => {
        const newTask: Task = {
            id: crypto.randomUUID(),
            name,
            createdAt: Date.now(),
            sessions: [],
        };
        await storage.addTask(newTask);
        await refreshTasks();
        return newTask;
    }, [refreshTasks]);

    const updateTask = useCallback(async (task: Task) => {
        await storage.updateTask(task);
        await refreshTasks();
    }, [refreshTasks]);

    const deleteTask = useCallback(async (taskId: string) => {
        await storage.deleteTask(taskId);
        await refreshTasks();
    }, [refreshTasks]);

    const renameTask = useCallback(async (taskId: string, newName: string) => {
        const allTasks = await storage.loadTasks();
        const task = allTasks.find((t) => t.id === taskId);
        if (task) {
            task.name = newName;
            await storage.updateTask(task);
            await refreshTasks();
        }
    }, [refreshTasks]);

    const toggleFavoriteTask = useCallback(async (taskId: string) => {
        const allTasks = await storage.loadTasks();
        const task = allTasks.find((t) => t.id === taskId);
        if (task) {
            task.isFavorite = !task.isFavorite;
            await storage.updateTask(task);
            await refreshTasks();
        }
    }, [refreshTasks]);

    const setTaskDailyBudget = useCallback(async (taskId: string, budgetMs: number | null) => {
        const allTasks = await storage.loadTasks();
        const task = allTasks.find((t) => t.id === taskId);
        if (task) {
            task.dailyBudgetMs = budgetMs;
            await storage.updateTask(task);
            await refreshTasks();
        }
    }, [refreshTasks]);

    const resetTaskDailyTime = useCallback(async (taskId: string) => {
        const allTasks = await storage.loadTasks();
        const task = allTasks.find((t) => t.id === taskId);
        if (!task) return;

        const startOfToday = new Date().setHours(0, 0, 0, 0);

        // --- Recursive Logic ---
        // Find all tasks that are descendants of this one (based on name prefix)
        const prefix = task.name + "/";
        const targets = allTasks.filter(t => t.id === taskId || t.name.startsWith(prefix));

        targets.forEach(t => {
            // 1. Remove sessions that started today
            // 2. Truncate sessions that started before today but ended (or are active) today
            t.sessions = t.sessions
                .filter((s) => s.startTime < startOfToday)
                .map((s) => {
                    if (s.endTime === null || s.endTime > startOfToday) {
                        return { ...s, endTime: startOfToday - 1 };
                    }
                    return s;
                });
        });

        await storage.saveTasks(allTasks);
        await refreshTasks();
    }, [refreshTasks]);

    return {
        tasks,
        isHydrating,
        addTask,
        updateTask,
        deleteTask,
        renameTask,
        toggleFavoriteTask,
        setTaskDailyBudget,
        resetTaskDailyTime,
        refreshTasks,
    };
};
