"use client";

import { useMemo, useState, useEffect } from "react";
import { Task } from "@/types/task";
import { generateWeeklyReport, WeeklyTaskReport } from "@/lib/reportUtils";
import { addWeeks, subWeeks, endOfWeek, getISOWeek, startOfWeek } from "date-fns";
import * as storage from "@/lib/storage";

export const useWeeklyReport = (tasks: Task[]) => {
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [ticker, setTicker] = useState(0);

    const firstAccessDate = useMemo(() => storage.getFirstAccessDate(), []);
    const firstWeekStart = startOfWeek(new Date(firstAccessDate), { weekStartsOn: 1 });

    const report = useMemo(() => {
        return generateWeeklyReport(tasks, currentWeek);
    }, [tasks, currentWeek, ticker]);

    const isFutureWeek = useMemo(() => {
        const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
        return weekEnd > new Date();
    }, [currentWeek]);

    const isFirstWeek = useMemo(() => {
        const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
        return weekStart <= firstWeekStart;
    }, [currentWeek, firstWeekStart]);

    const weekNumber = getISOWeek(currentWeek);

    // Update report in real-time if there's an active task.
    // The ticker state forces the useMemo for 'report' to recalculate 
    // without needing deep comparisons of the tasks structure every frame.
    useEffect(() => {
        const hasActiveTask = tasks.some(t => t.sessions.some(s => s.endTime === null));
        if (!hasActiveTask) return;

        const interval = setInterval(() => {
            setTicker(t => t + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [tasks]);

    const nextWeek = () => {
        if (!isFutureWeek) {
            setCurrentWeek(prev => addWeeks(prev, 1));
        }
    };
    const prevWeek = () => {
        if (!isFirstWeek) {
            setCurrentWeek(prev => subWeeks(prev, 1));
        }
    };
    const resetToToday = () => setCurrentWeek(new Date());

    const totalsByDay = useMemo(() => {
        if (report.length === 0) return Array(7).fill(0);

        const dayTotals = Array(7).fill(0);
        report.forEach(taskReport => {
            taskReport.days.forEach((day, idx) => {
                dayTotals[idx] += day.totalMs;
            });
        });
        return dayTotals;
    }, [report]);

    const grandTotal = totalsByDay.reduce((acc, val) => acc + val, 0);

    return {
        report,
        currentWeek,
        nextWeek,
        prevWeek,
        resetToToday,
        totalsByDay,
        grandTotal,
        isFutureWeek,
        isFirstWeek,
        weekNumber
    };
};
