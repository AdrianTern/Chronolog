"use client";

import { useTasks } from "@/hooks/useTasks";
import { useWeeklyReport } from "@/hooks/useWeeklyReport";
import { exportWeeklyReportToCSV } from "@/lib/csvExport";
import WeeklyReportTable from "@/components/WeeklyReportTable";
import ExportButton from "@/components/ExportButton";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Home, Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

export default function ReportsPage() {
    const { tasks } = useTasks();
    const {
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
    } = useWeeklyReport(tasks);

    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

    const handleExport = () => {
        exportWeeklyReportToCSV(report, currentWeek, weekNumber);
    };

    return (
        <main className="max-w-6xl mx-auto px-6 py-16">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                <div className="flex items-center gap-6">
                    <Link
                        href="/"
                        className="glass p-3 rounded-lg hover:bg-notion-hover transition-all"
                    >
                        <Home size={24} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-notion-text">Insights</h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-notion-text-light font-bold">Performance Analytics</p>
                    </div>
                </div>

                <div className="flex items-center glass glass-surface rounded-2xl shadow-xl p-1.5 min-w-[360px] justify-between">
                    <button
                        onClick={prevWeek}
                        disabled={isFirstWeek}
                        className="p-2.5 hover:glass-hover rounded-xl transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="px-6 flex items-center gap-3 select-none">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-notion-text-light leading-none mb-1">
                                Week {weekNumber}
                            </span>
                            <span className="text-sm font-semibold tabular-nums tracking-tight text-notion-text leading-none">
                                {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={nextWeek}
                        disabled={isFutureWeek}
                        className="p-2.5 hover:glass-hover rounded-xl transition-all active:scale-90 disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <ExportButton onClick={handleExport} disabled={report.length === 0} />
            </header>

            {report.length > 0 ? (
                <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <WeeklyReportTable
                        report={report}
                        totalsByDay={totalsByDay}
                        grandTotal={grandTotal}
                    />
                </section>
            ) : (
                <section className="text-center py-32 glass glass-surface rounded-[32px] border-none shadow-2xl">
                    <div className="max-w-sm mx-auto">
                        <div className="bg-notion-sidebar w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 border border-notion-border">
                            <Calendar size={28} className="text-notion-text-light opacity-30" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">No activity found</h3>
                        <p className="text-sm text-gray-400 font-medium px-4">
                            Your time logs for this period are empty. Start a timer to see the magic happen.
                        </p>
                    </div>
                </section>
            )}

            <footer className="mt-32 pt-12 border-t border-notion-border text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.4em] font-semibold">
                    Chronolog &bull; Excellence In Precision
                </p>
            </footer>
        </main>
    );
}
