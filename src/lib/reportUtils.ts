import { Task, Session } from "@/types/task";
import {
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    format
} from "date-fns";
import { calculateSessionDuration } from "./timeUtils";

export type DayReport = {
    date: Date;
    dayName: string;
    formattedDate: string;
    totalMs: number;
};

export type WeeklyTaskReport = {
    taskId: string;
    taskName: string;
    days: DayReport[];
    totalMs: number;
    isActive: boolean;
};

export const getWeekDays = (date: Date = new Date()) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(date, { weekStartsOn: 1 });

    return eachDayOfInterval({ start, end });
};

export const generateWeeklyReport = (tasks: Task[], weekDate: Date = new Date()): WeeklyTaskReport[] => {
    const days = getWeekDays(weekDate);

    // Pre-calculate start and end timestamps for each day to avoid creating Date objects in the inner loop
    const dayBoundaries = days.map(day => {
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        const end = new Date(day);
        end.setHours(23, 59, 59, 999);
        return { start: start.getTime(), end: end.getTime() };
    });

    return tasks.map(task => {
        const taskDays: DayReport[] = days.map((day, idx) => {
            const boundary = dayBoundaries[idx];
            
            // Filter sessions that fall within the pre-calculated day boundaries.
            // This is significantly faster than using date-fns isSameDay on every session.
            const daySessions = task.sessions.filter(s =>
                s.startTime >= boundary.start && s.startTime <= boundary.end
            );

            const totalMs = daySessions.reduce((acc, s) => acc + calculateSessionDuration(s), 0);

            return {
                date: day,
                dayName: format(day, "EEE"),
                formattedDate: format(day, "MMM dd"),
                totalMs
            };
        });

        const totalMs = taskDays.reduce((acc, d) => acc + d.totalMs, 0);

        return {
            taskId: task.id,
            taskName: task.name,
            days: taskDays,
            totalMs,
            isActive: task.sessions.some(s => s.endTime === null)
        };
    }).filter(report => report.totalMs > 0);
};
