import { Session, Task } from "@/types/task";
import { format, intervalToDuration } from "date-fns";

/**
 * Formatting and calculation utilities for time and durations.
 * Edge cases handled include: tasks crossing the midnight boundary.
 */
export const formatDuration = (ms: number): string => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const calculateSessionDuration = (session: Session): number => {
    const end = session.endTime || Date.now();
    return Math.max(0, end - session.startTime);
};

export const calculateTaskTotal = (task: Task): number => {
    return task.sessions.reduce(
        (total, session) => total + calculateSessionDuration(session),
        0
    );
};

export const calculateDailyTotal = (task: Task, date: Date = new Date()): number => {
    const startOfToday = new Date(date);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(date);
    endOfToday.setHours(23, 59, 59, 999);

    return task.sessions.reduce((total, session) => {
        const start = Math.max(session.startTime, startOfToday.getTime());
        const end = Math.min(session.endTime || Date.now(), endOfToday.getTime());
        return total + (end > start ? end - start : 0);
    }, 0);
};

export const calculateWeeklyTotal = (task: Task, date: Date = new Date()): number => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const startOfWeek = new Date(date);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return task.sessions.reduce((total, session) => {
        const start = Math.max(session.startTime, startOfWeek.getTime());
        const end = Math.min(session.endTime || Date.now(), endOfWeek.getTime());
        return total + (end > start ? end - start : 0);
    }, 0);
};

export const formatTimeShort = (ms: number): string => {
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}`;
};
