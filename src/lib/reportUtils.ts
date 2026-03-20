import { Task, Session } from "@/types/task";
import {
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    format
} from "date-fns";
import { calculateSessionDuration, calculateDailyTotal } from "./timeUtils";
import { TaskNode, buildTaskTree } from "./taskHierarchy";

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

export type WeeklyTaskReportNode = {
    id: string;
    name: string;
    displayName: string;
    hasRealTask: boolean;
    isActive: boolean;
    days: DayReport[];
    totalMs: number;
    children: WeeklyTaskReportNode[];
};

export const generateWeeklyReportTree = (
    tasks: Task[], 
    weekDate: Date = new Date(),
    includeZero: boolean = false
): WeeklyTaskReportNode[] => {
    const daysInterval = getWeekDays(weekDate);
    const rootNodes = buildTaskTree(tasks);

    // Helper to calculate raw task days (if task exists)
    const getRawBaseDays = (task?: Task): DayReport[] => {
        if (!task) return daysInterval.map(d => ({ date: d, dayName: format(d, "EEE"), formattedDate: format(d, "MMM dd"), totalMs: 0 }));
        return daysInterval.map(day => ({
            date: day,
            dayName: format(day, "EEE"),
            formattedDate: format(day, "MMM dd"),
            totalMs: calculateDailyTotal(task, day)
        }));
    };

    const processNode = (node: TaskNode): WeeklyTaskReportNode => {
        const children = node.children.map(processNode);
        
        const baseDays = getRawBaseDays(node.task);
        
        // Sum inclusive days: base + all children
        const inclusiveDays: DayReport[] = baseDays.map((baseDay, idx) => {
            const childrenTotalMs = children.reduce((acc, child) => acc + child.days[idx].totalMs, 0);
            return {
                ...baseDay,
                totalMs: baseDay.totalMs + childrenTotalMs
            };
        });

        const totalMs = inclusiveDays.reduce((acc, d) => acc + d.totalMs, 0);
        
        const isSelfActive = node.task ? node.task.sessions.some(s => s.endTime === null) : false;
        const isActive = isSelfActive || children.some(c => c.isActive);

        return {
            id: node.id,
            name: node.name,
            displayName: node.displayName,
            hasRealTask: !!node.task,
            isActive,
            days: inclusiveDays,
            totalMs,
            children
        };
    };

    let reportTree = rootNodes.map(processNode);

    if (!includeZero) {
        const pruneTree = (nodes: WeeklyTaskReportNode[]): WeeklyTaskReportNode[] => {
            return nodes.map(n => {
                n.children = pruneTree(n.children);
                return n;
            }).filter(n => n.totalMs > 0 || n.isActive);
        };
        reportTree = pruneTree(reportTree);
    }

    return reportTree;
};
