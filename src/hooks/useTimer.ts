import { useState, useEffect, useCallback, useRef } from "react";
import { Task, Session } from "@/types/task";
import * as storage from "@/lib/storage";
import * as notifications from "@/lib/notifications";

/**
 * Custom hook to manage the active timer state.
 * Synchronizes with local storage and handles calculations, including midnight rollovers.
 */
export const useTimer = (tasks: Task[], refreshTasks: () => void) => {
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync with storage on mount and when tasks change
    useEffect(() => {
        // Handle retroactive auto-pause before initializing state
        const pendingPause = storage.getPendingAutoPause();
        if (pendingPause) {
            const now = Date.now();
            if (now > pendingPause.pauseAt) {
                // Retroactively close the session at the 15m mark
                const allTasks = storage.loadTasks();
                const tIdx = allTasks.findIndex(t => t.id === pendingPause.taskId);
                if (tIdx !== -1) {
                    const sIdx = allTasks[tIdx].sessions.findIndex(s => s.id === pendingPause.sessionId);
                    if (sIdx !== -1 && allTasks[tIdx].sessions[sIdx].endTime === null) {
                        allTasks[tIdx].sessions[sIdx].endTime = pendingPause.pauseAt;
                        storage.saveTasks(allTasks);
                        refreshTasks();
                    }
                }
            }
            storage.clearPendingAutoPause();
        }

        const runningTask = tasks.find((t) =>
            t.sessions.some((s) => s.endTime === null)
        );
        if (runningTask) {
            const runningSession = runningTask.sessions.find((s) => s.endTime === null)!;
            setActiveTaskId(runningTask.id);
            setActiveSessionId(runningSession.id);
        } else {
            setActiveTaskId(null);
            setActiveSessionId(null);
            setElapsed(0);
        }
    }, [tasks, refreshTasks]);

    // Tick every second
    useEffect(() => {
        if (activeTaskId && activeSessionId) {
            const task = tasks.find((t) => t.id === activeTaskId);
            const session = task?.sessions.find((s) => s.id === activeSessionId);

            if (task && session) {
                // Cache the start of today and previous total to avoid recalculating every second,
                // significantly improving tick performance.
                let cachedStartOfToday = new Date().setHours(0, 0, 0, 0);
                let cachedPreviousTotal = task.sessions
                    .filter((s) =>
                        s.id !== session.id &&
                        s.endTime !== null &&
                        s.endTime > cachedStartOfToday
                    )
                    .reduce((total, s) => {
                        const sessionStart = Math.max(s.startTime, cachedStartOfToday);
                        return total + (s.endTime! - sessionStart);
                    }, 0);

                const updateElapsed = () => {
                    const currentStartOfToday = new Date().setHours(0, 0, 0, 0);
                    
                    // Recalculate if we crossed midnight while the timer is running
                    if (currentStartOfToday !== cachedStartOfToday) {
                        cachedStartOfToday = currentStartOfToday;
                        cachedPreviousTotal = task.sessions
                            .filter((s) =>
                                s.id !== session.id &&
                                s.endTime !== null &&
                                s.endTime > cachedStartOfToday
                            )
                            .reduce((total, s) => {
                                const sessionStart = Math.max(s.startTime, cachedStartOfToday);
                                return total + (s.endTime! - sessionStart);
                            }, 0);
                    }

                    const currentSessionStart = Math.max(session.startTime, cachedStartOfToday);
                    const currentSessionElapsed = Date.now() > currentSessionStart ? Date.now() - currentSessionStart : 0;

                    setElapsed(cachedPreviousTotal + currentSessionElapsed);
                };
                
                updateElapsed();
                timerRef.current = setInterval(updateElapsed, 1000);
            }
        } else {
            setElapsed(0);
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeTaskId, activeSessionId, tasks]);

    // Handle tab close / refresh: Alert user and set auto-pause deadline
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (activeTaskId && activeSessionId) {
                const activeTask = tasks.find(t => t.id === activeTaskId);
                
                // 1. Send immediate notification
                notifications.sendNotification("Chronolog: Ongoing Activity", {
                    body: `Task '${activeTask?.name || "unnamed"}' is still running. It will auto-pause in 15 minutes if you don't return.`,
                    tag: "active-task-alert",
                    requireInteraction: true,
                });

                // 2. Set the 15-minute deadline in storage
                storage.setPendingAutoPause({
                    taskId: activeTaskId,
                    sessionId: activeSessionId,
                    pauseAt: Date.now() + 15 * 60 * 1000 // 15 minutes from now
                });
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [activeTaskId, activeSessionId, tasks]);

    const stopTimer = useCallback(() => {
        if (!activeTaskId || !activeSessionId) return;

        const allTasks = storage.loadTasks();
        const taskIdx = allTasks.findIndex((t) => t.id === activeTaskId);
        if (taskIdx === -1) return;

        const sessionIdx = allTasks[taskIdx].sessions.findIndex(
            (s) => s.id === activeSessionId
        );
        if (sessionIdx === -1) return;

        allTasks[taskIdx].sessions[sessionIdx].endTime = Date.now();
        storage.saveTasks(allTasks);

        setActiveTaskId(null);
        setActiveSessionId(null);
        setElapsed(0);
        refreshTasks();
    }, [activeTaskId, activeSessionId, refreshTasks]);

    const startTimer = useCallback((taskId: string) => {
        // 1. Stop current if any
        if (activeTaskId) {
            stopTimer();
        }

        // 2. Start new
        const allTasks = storage.loadTasks();
        const taskIdx = allTasks.findIndex((t) => t.id === taskId);
        if (taskIdx === -1) return;

        const newSession: Session = {
            id: crypto.randomUUID(),
            startTime: Date.now(),
            endTime: null,
        };

        allTasks[taskIdx].sessions.push(newSession);
        storage.saveTasks(allTasks);

        setActiveTaskId(taskId);
        setActiveSessionId(newSession.id);
        refreshTasks();
    }, [activeTaskId, stopTimer, refreshTasks]);

    const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

    return {
        activeTask,
        elapsed,
        startTimer,
        stopTimer,
        isRunning: !!activeTaskId,
    };
};
