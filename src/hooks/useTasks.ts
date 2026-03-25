import { useState, useEffect, useCallback } from "react";
import { Task } from "@/types/task";
import * as storage from "@/lib/storage";

export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        setTasks(storage.loadTasks());
    }, []);

    const refreshTasks = useCallback(() => {
        setTasks(storage.loadTasks());
    }, []);

    const addTask = useCallback((name: string) => {
        const newTask: Task = {
            id: crypto.randomUUID(),
            name,
            createdAt: Date.now(),
            sessions: [],
        };
        storage.addTask(newTask);
        refreshTasks();
        return newTask;
    }, [refreshTasks]);

    const updateTask = useCallback((task: Task) => {
        storage.updateTask(task);
        refreshTasks();
    }, [refreshTasks]);

    const deleteTask = useCallback((taskId: string) => {
        storage.deleteTask(taskId);
        refreshTasks();
    }, [refreshTasks]);

    const renameTask = useCallback((taskId: string, newName: string) => {
        const allTasks = storage.loadTasks();
        const task = allTasks.find((t) => t.id === taskId);
        if (task) {
            task.name = newName;
            storage.updateTask(task);
            refreshTasks();
        }
    }, [refreshTasks]);

    const toggleFavoriteTask = useCallback((taskId: string) => {
        const allTasks = storage.loadTasks();
        const task = allTasks.find((t) => t.id === taskId);
        if (task) {
            task.isFavorite = !task.isFavorite;
            storage.updateTask(task);
            refreshTasks();
        }
    }, [refreshTasks]);

    const setTaskDailyBudget = useCallback((taskId: string, budgetMs: number | null) => {
        const allTasks = storage.loadTasks();
        const task = allTasks.find((t) => t.id === taskId);
        if (task) {
            task.dailyBudgetMs = budgetMs;
            storage.updateTask(task);
            refreshTasks();
        }
    }, [refreshTasks]);

    const resetTaskDailyTime = useCallback((taskId: string) => {
        const allTasks = storage.loadTasks();
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

        storage.saveTasks(allTasks);
        refreshTasks();
    }, [refreshTasks]);

    return {
        tasks,
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
