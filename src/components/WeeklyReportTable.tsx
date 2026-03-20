"use client";

import { WeeklyTaskReportNode } from "@/lib/reportUtils";
import { formatTimeShort } from "@/lib/timeUtils";
import { Radio } from "lucide-react";

/**
 * Props for the WeeklyReportTable component.
 */
interface WeeklyReportTableProps {
    /** Hierarchical tree of task report data points. */
    reportTree: WeeklyTaskReportNode[];
    /** Array of total milliseconds logged for each day of the week. */
    totalsByDay: number[];
    /** Total milliseconds logged across all tasks and days for the week. */
    grandTotal: number;
    /** Whether to hide all nested subtasks and only show root nodes */
    hideSubtasks?: boolean;
}

/**
 * Data table displaying task names and their daily logged time.
 * Includes a footer row for daily volume totals.
 */
export default function WeeklyReportTable({
    reportTree,
    totalsByDay,
    grandTotal,
    hideSubtasks = false,
}: WeeklyReportTableProps) {
    const days = reportTree[0]?.days || [];

    const renderNode = (node: WeeklyTaskReportNode, depth: number): React.ReactNode[] => {
        const rows: React.ReactNode[] = [];
        
        // Add current node's row
        rows.push(
            <tr key={node.id} className={`hover:bg-notion-hover transition-colors group border-b border-notion-border/50 ${depth === 0 ? 'bg-white' : 'bg-gray-50/20'}`}>
                <td className="py-2.5 px-4 align-middle">
                    <div 
                        className="flex items-center gap-2" 
                        style={{ paddingLeft: `${depth * 1.5}rem` }}
                    >
                        {depth > 0 && <div className="w-3 h-[1px] bg-notion-border shrink-0" />}
                        <span className={`truncate w-full max-w-[350px] ${depth === 0 ? 'font-semibold text-notion-text text-sm' : 'font-medium text-notion-text-light text-xs'}`}>
                            {node.displayName}
                        </span>
                        {node.isActive && (
                            <Radio size={12} className="text-notion-primary animate-pulse shrink-0" />
                        )}
                    </div>
                </td>
                {node.days.map((day, idx) => (
                    <td key={idx} className={`py-2.5 px-2 sm:px-4 font-mono tabular-nums text-center ${depth === 0 ? 'text-xs text-notion-text-light' : 'text-[11px] text-notion-text-light'}`}>
                        {day.totalMs > 0 ? (
                            <span className={`${depth === 0 ? 'font-semibold text-notion-text' : 'font-medium text-notion-text-light/70'}`}>
                                {formatTimeShort(day.totalMs)}
                            </span>
                        ) : (
                            <span className="opacity-20">—</span>
                        )}
                    </td>
                ))}
                <td className={`py-2.5 px-4 text-center font-mono tabular-nums ${depth === 0 ? 'font-bold text-notion-text text-xs' : 'font-medium text-notion-text-light/70 text-[11px]'}`}>
                    {formatTimeShort(node.totalMs)}
                </td>
            </tr>
        );

        // Add children rows if not hiding subtasks
        if (!hideSubtasks && node.children.length > 0) {
            node.children.forEach(child => {
                rows.push(...renderNode(child, depth + 1));
            });
        }

        return rows;
    };

    return (
        <div className="overflow-x-auto border border-notion-border rounded-lg shadow-sm overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-notion-border bg-notion-sidebar text-notion-text-light">
                        <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[10px] w-1/3 min-w-[200px]">Task</th>
                        {days.map((day) => (
                            <th key={day.dayName} className="py-3 px-2 sm:px-4 font-semibold text-notion-text w-[8%] min-w-[70px] text-center">
                                <div className="text-[10px] uppercase text-notion-text-light tracking-wider mb-0.5">
                                    {day.dayName}
                                </div>
                                <div className="text-xs">{day.formattedDate}</div>
                            </th>
                        ))}
                        <th className="py-3 px-4 font-semibold text-notion-text text-center">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-notion-border/50">
                    {reportTree.map(rootNode => renderNode(rootNode, 0))}
                </tbody>
                <tfoot className="bg-notion-sidebar border-t border-notion-border">
                    <tr className="font-semibold">
                        <td className="py-3 px-4 uppercase tracking-wider text-[10px] text-notion-text-light font-bold">Daily Volume</td>
                        {totalsByDay.map((total, idx) => (
                            <td key={idx} className="py-3 px-4 font-mono text-xs text-notion-text text-center">
                                {total > 0 ? formatTimeShort(total) : "00:00"}
                            </td>
                        ))}
                        <td className="py-3 px-4 text-center font-mono text-sm font-bold text-notion-text border-l border-notion-border">
                            {formatTimeShort(grandTotal)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
