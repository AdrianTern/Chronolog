"use client";

import { Task } from "@/types/task";
import { calculateTaskTotal, formatTimeShort, calculateDailyTotal, calculateWeeklyTotal } from "@/lib/timeUtils";
import { Play, Trash2, Edit2, Check, X, Clock, Calendar, BarChart3 } from "lucide-react";
import { useState } from "react";

/**
 * Props for the TaskItem component.
 */
interface TaskItemProps {
    /** The task data object. */
    task: Task;
    /** Callback triggered when the start button is clicked. */
    onStart: (id: string) => void;
    /** Callback triggered when the delete button is clicked. */
    onDelete: (id: string) => void;
    /** Callback triggered when a task is renamed. */
    onRename: (id: string, name: string) => void;
    /** Whether the task is currently being tracked (active). */
    isActive: boolean;
}

/**
 * Individual task item component displaying task name, stats, and controls.
 * Supports renaming and starting/stopping tracking.
 */
export default function TaskItem({
    task,
    onStart,
    onDelete,
    onRename,
    isActive,
}: TaskItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(task.name);

    const totalTime = calculateTaskTotal(task);
    const dailyTime = calculateDailyTotal(task);
    const weeklyTime = calculateWeeklyTotal(task);

    const handleRename = () => {
        if (newName.trim() && newName !== task.name) {
            onRename(task.id, newName.trim());
        }
        setIsEditing(false);
    };

    return (
        <div className="glass-card flex items-center justify-between group transition-premium hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex-1 mr-8">
                {isEditing ? (
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            autoFocus
                            className="flex-1 px-4 py-2 glass-inset rounded-xl focus:outline-none focus:ring-1 focus:ring-black/20 text-sm font-medium"
                            onKeyDown={(e) => e.key === "Enter" && handleRename()}
                        />
                        <button onClick={handleRename} className="p-2 text-notion-text hover:bg-notion-hover rounded-md transition-colors">
                            <Check size={18} />
                        </button>
                        <button onClick={() => setIsEditing(false)} className="p-2 text-notion-text-light hover:bg-notion-hover rounded-md transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-lg font-bold text-notion-text mb-2 leading-tight">
                            {task.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <div className="flex items-center gap-1.5" title="Today">
                                <Clock size={12} className="text-notion-text-light" />
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-notion-text-light">
                                    {formatTimeShort(dailyTime)} Today
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5" title="This Week">
                                <Calendar size={12} className="text-notion-text-light" />
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-notion-text-light">
                                    {formatTimeShort(weeklyTime)} Week
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5" title="All Time">
                                <BarChart3 size={12} className="text-notion-text-light" />
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-notion-text-light">
                                    {formatTimeShort(totalTime)} Total
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                {!isActive && (
                    <button
                        onClick={() => onStart(task.id)}
                        className="p-2 text-notion-text hover:bg-notion-hover rounded-md flex items-center gap-0 hover:gap-2 overflow-hidden transition-all duration-300 group/play"
                        title="Start Timer"
                    >
                        <Play size={14} fill="currentColor" className="shrink-0" />
                        <span className="max-w-0 overflow-hidden whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-all duration-300 group-hover/play:max-w-[40px]">
                            Start
                        </span>
                    </button>
                )}

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 text-notion-text-light hover:text-notion-text hover:bg-notion-hover rounded-md transition-all"
                        title="Rename"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(task.id)}
                        className="p-2 text-notion-text-light hover:text-notion-text hover:bg-notion-hover rounded-md transition-all"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {isActive && (
                    <div className="flex items-center gap-2 px-3 py-1.5 border border-notion-border text-notion-text rounded-md text-[10px] font-bold uppercase tracking-wider bg-notion-sidebar animate-breathe">
                        <div className="w-1.5 h-1.5 rounded-full bg-notion-primary" />
                        <span>Live</span>
                    </div>
                )}
            </div>
        </div>
    );
}
