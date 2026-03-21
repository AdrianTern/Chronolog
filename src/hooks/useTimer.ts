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
    // Tracks whether the daily-budget alert has already been sent for the current task/day
    const budgetAlertSentRef = useRef<{ taskId: string; date: string } | null>(null);
    const lastBreakReminderRef = useRef<number>(0);
    const idleWarningSentRef = useRef<boolean>(false);
    const lastSessionIdRef = useRef<string | null>(null);

    // Sync with storage on mount and when tasks change
    useEffect(() => {
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
                
                // Helper to get rollup total for today (this task + all descendants)
                const getRollupPreviousTotal = (t: Task, sId: string, startOfToday: number) => {
                    // 1. This task's previous sessions today
                    let total = t.sessions
                        .filter((s) =>
                            s.id !== sId &&
                            s.endTime !== null &&
                            s.endTime > startOfToday
                        )
                        .reduce((acc, s) => {
                            const sessionStart = Math.max(s.startTime, startOfToday);
                            return acc + (s.endTime! - sessionStart);
                        }, 0);

                    // 2. All descendants' daily totals
                    const prefix = t.name + "/";
                    const descendants = tasks.filter(other => other.name.startsWith(prefix));
                    
                    descendants.forEach(d => {
                        total += d.sessions.reduce((acc, s) => {
                            const sessionStart = Math.max(s.startTime, startOfToday);
                            const sessionEnd = s.endTime || Date.now();
                            if (sessionEnd <= startOfToday) return acc;
                            
                            const intersectionStart = sessionStart;
                            const intersectionEnd = Math.min(sessionEnd, Date.now()); // If it's the active session of a child (unlikely but safe)
                            
                            // Note: We use calculateDailyTotal logic here manually for efficiency
                            const dailyStart = Math.max(s.startTime, startOfToday);
                            const dailyEnd = s.endTime || Date.now();
                            return acc + (dailyEnd > dailyStart ? dailyEnd - dailyStart : 0);
                        }, 0);
                    });

                    return total;
                };

                let cachedPreviousTotal = getRollupPreviousTotal(task, session.id, cachedStartOfToday);

                // Reset notification refs if session changed
                if (lastSessionIdRef.current !== session.id) {
                    lastSessionIdRef.current = session.id;
                    lastBreakReminderRef.current = 0;
                    idleWarningSentRef.current = false;
                }

                const updateElapsed = () => {
                    const currentStartOfToday = new Date().setHours(0, 0, 0, 0);
                    
                    // Recalculate if we crossed midnight while the timer is running
                    if (currentStartOfToday !== cachedStartOfToday) {
                        cachedStartOfToday = currentStartOfToday;
                        cachedPreviousTotal = getRollupPreviousTotal(task, session.id, cachedStartOfToday);
                    }

                    const currentSessionStart = Math.max(session.startTime, cachedStartOfToday);
                    const currentSessionElapsed = Date.now() > currentSessionStart ? Date.now() - currentSessionStart : 0;
                    const newElapsed = cachedPreviousTotal + currentSessionElapsed;

                    setElapsed(newElapsed);

                    // --- Daily budget / overtime alert ---
                    const budget = task.dailyBudgetMs;
                    if (budget && budget > 0) {
                        const today = new Date().toDateString();
                        const alreadySent =
                            budgetAlertSentRef.current?.taskId === task.id &&
                            budgetAlertSentRef.current?.date === today;

                        if (!alreadySent && newElapsed >= budget) {
                            budgetAlertSentRef.current = { taskId: task.id, date: today };
                            const budgetLabel = budget >= 3600000
                                ? `${budget / 3600000}h`
                                : `${budget / 60000}m`;
                            notifications.sendNotification(`⚠️ Budget Exceeded: ${task.name}`, {
                                body: `You've exceeded your ${budgetLabel} budget for '${task.name}' today.`,
                                tag: `budget-${task.id}`,
                            });
                        }
                    }

                    // --- Notifications Logic ---
                    const settings = storage.getNotificationSettings();
                    if (settings.enabled) {
                        // 1. Break Reminders
                        if (settings.breakReminder.enabled) {
                            const bThreshold = settings.breakReminder.thresholdMs;
                            const currentBInterval = Math.floor(newElapsed / bThreshold);
                            const lastBInterval = Math.floor(lastBreakReminderRef.current / bThreshold);

                            if (currentBInterval > lastBInterval && currentBInterval > 0) {
                                lastBreakReminderRef.current = newElapsed;
                                const hrs = currentBInterval * (bThreshold / 3600000);
                                notifications.sendNotification(`☕ Take a break: ${task.name}`, {
                                    body: `You've been on '${task.name}' for ${hrs} ${hrs === 1 ? 'hour' : 'hours'}. Time for a quick break?`,
                                    tag: `break-${task.id}`,
                                });
                            }
                        }

                        // 2. Idle / Forgotten Timer Warning
                        if (settings.idleWarning.enabled) {
                            const iThreshold = settings.idleWarning.thresholdMs;
                            if (newElapsed >= iThreshold && !idleWarningSentRef.current) {
                                idleWarningSentRef.current = true;
                                const hrs = iThreshold / 3600000;
                                notifications.sendNotification(`🕒 Idle Warning: ${task.name}`, {
                                    body: `Your timer for '${task.name}' has been running for ${hrs} hours — is it still active?`,
                                    tag: `idle-${task.id}`,
                                    requireInteraction: true,
                                });
                            }
                        }
                    }
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
    
    // Determine the last task: 
    // 1. If only one task in backlog, use that (unless it's already active)
    // 2. Otherwise, find the task with the most recently completed session
    let lastTask: Task | null = null;
    
    if (tasks.length === 1) {
        if (tasks[0].id !== activeTaskId) {
            lastTask = tasks[0];
        }
    } else if (tasks.length > 1) {
        let latestEndTime = -1;
        
        for (const task of tasks) {
            if (task.id === activeTaskId) continue;
            
            for (const session of task.sessions) {
                if (session.endTime && session.endTime > latestEndTime) {
                    latestEndTime = session.endTime;
                    lastTask = task;
                }
            }
        }
    }

    return {
        activeTask,
        lastTask,
        elapsed,
        startTimer,
        stopTimer,
        isRunning: !!activeTaskId,
    };
};
