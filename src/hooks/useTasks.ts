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

    return {
        tasks,
        addTask,
        updateTask,
        deleteTask,
        renameTask,
        refreshTasks,
    };
};
