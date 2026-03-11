"use client";

import { WeeklyTaskReport } from "@/lib/reportUtils";
import { formatTimeShort } from "@/lib/timeUtils";
import { Radio } from "lucide-react";

/**
 * Props for the WeeklyReportTable component.
 */
interface WeeklyReportTableProps {
    /** Array of task report data points. */
    report: WeeklyTaskReport[];
    /** Array of total milliseconds logged for each day of the week. */
    totalsByDay: number[];
    /** Total milliseconds logged across all tasks and days for the week. */
    grandTotal: number;
}

/**
 * Data table displaying task names and their daily logged time.
 * Includes a footer row for daily volume totals.
 */
export default function WeeklyReportTable({
    report,
    totalsByDay,
    grandTotal,
}: WeeklyReportTableProps) {
    const days = report[0]?.days || [];

    return (
        <div className="overflow-x-auto border border-notion-border rounded-lg shadow-sm overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-notion-border bg-notion-sidebar">
                        <th className="p-4 font-semibold uppercase tracking-wider text-[10px] text-notion-text-light">Task</th>
                        {days.map((day) => (
                            <th key={day.dayName} className="p-4 font-semibold text-notion-text min-w-[100px]">
                                <div className="text-[10px] uppercase text-notion-text-light tracking-wider mb-0.5">
                                    {day.dayName}
                                </div>
                                <div className="text-xs">{day.formattedDate}</div>
                            </th>
                        ))}
                        <th className="p-4 font-semibold text-notion-text text-right">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-notion-border/50">
                    {report.map((taskReport) => (
                        <tr key={taskReport.taskId} className="hover:bg-notion-hover transition-colors group border-b border-notion-border/50">
                            <td className="p-4 font-medium text-notion-text max-w-[200px] truncate">
                                <div className="flex items-center gap-2">
                                    {taskReport.taskName}
                                    {taskReport.isActive && (
                                        <Radio size={12} className="text-notion-primary animate-pulse shrink-0" />
                                    )}
                                </div>
                            </td>
                            {taskReport.days.map((day, idx) => (
                                <td key={idx} className="p-4 text-notion-text-light font-mono text-xs tabular-nums">
                                    {day.totalMs > 0 ? (
                                        <span className="font-semibold text-notion-text">
                                            {formatTimeShort(day.totalMs)}
                                        </span>
                                    ) : (
                                        <span className="opacity-20">—</span>
                                    )}
                                </td>
                            ))}
                            <td className="p-4 text-right font-bold text-notion-text font-mono text-xs tabular-nums">
                                {formatTimeShort(taskReport.totalMs)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-notion-sidebar border-t border-notion-border">
                    <tr className="font-semibold">
                        <td className="p-4 uppercase tracking-wider text-[10px] text-notion-text-light font-bold">Daily Volume</td>
                        {totalsByDay.map((total, idx) => (
                            <td key={idx} className="p-4 font-mono text-xs text-notion-text">
                                {total > 0 ? formatTimeShort(total) : "00:00"}
                            </td>
                        ))}
                        <td className="p-4 text-right font-mono text-sm font-bold text-notion-text border-l border-notion-border">
                            {formatTimeShort(grandTotal)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
