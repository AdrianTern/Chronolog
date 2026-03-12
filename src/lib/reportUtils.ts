import { Task, Session } from "@/types/task";
import {
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    format
} from "date-fns";
import { calculateSessionDuration, calculateDailyTotal } from "./timeUtils";

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


    return tasks.map(task => {
        const taskDays: DayReport[] = days.map((day) => {
            // Use the centralized daily total utility to ensure perfect consistency with task cards.
            // This correctly handles midnight rollovers and active sessions.
            const totalMs = calculateDailyTotal(task, day);

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
