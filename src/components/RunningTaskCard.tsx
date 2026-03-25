"use client";

import { Task } from "@/types/task";
import { Square, RotateCcw, Play } from "lucide-react";
import TimerDisplay from "./TimerDisplay";
import { formatHms } from "@/lib/timeUtils";

/**
 * Props for the RunningTaskCard component.
 */
interface RunningTaskCardProps {
    /** The currently active task object. */
    task: Task;
    /** Elapsed time in milliseconds for the current session. */
    elapsed: number;
    /** Callback triggered to stop the active timer. */
    onStop: () => void;
    /** Callback triggered to start/resume the timer. */
    onStart: (id: string) => void;
    /** Callback triggered to reset today's time for this task. */
    onReset: (id: string) => void;
    /** Whether the timer is currently running. */
    isRunning: boolean;
}


/**
 * Hero card displayed at the top of the dashboard when a task is active.
 * Shows the task name, a live breathing indicator, and the active timer.
 */
export default function RunningTaskCard({
    task,
    elapsed,
    onStop,
    onStart,
    onReset,
    isRunning,
}: RunningTaskCardProps) {
    const budget = task.dailyBudgetMs;
    const isOverBudget = !!budget && elapsed >= budget;

    return (
        <div className="flex flex-col items-center justify-center py-4 gap-6 transition-all group animate-fade-in">
            <div className="text-center relative z-10">
                <div className="flex items-center gap-2 justify-center mb-2 animate-breathe">
                    <div className={`w-1 h-1 rounded-full animate-pulse ${isRunning ? 'bg-notion-primary' : 'bg-notion-text-light opacity-50'}`} />
                    <span className="text-notion-text-light text-[9px] font-bold uppercase tracking-[0.2em]">
                        {isRunning ? 'Active Task' : 'Paused Task'}
                    </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-notion-text leading-tight">
                    {task.name}
                </h2>
            </div>

            <div className="flex flex-col items-center gap-6 relative z-10 w-full">
                <div className="relative flex flex-col items-center gap-1">
                    <TimerDisplay
                        elapsed={elapsed}
                        className={`text-4xl font-bold tracking-tighter tabular-nums transition-colors duration-500 ${
                            isOverBudget ? "text-red-500" : "text-notion-text"
                        }`}
                        style={{ textShadow: isOverBudget ? "0 0 20px rgba(239,68,68,0.25)" : "0 0 20px rgba(251,191,36,0.15)" }}
                    />
                    {budget && (
                        <div 
                            className={`text-[11px] font-mono font-semibold tabular-nums transition-colors duration-500 p-1 px-2 rounded-lg ${
                                isOverBudget ? "text-red-400 bg-red-50/50" : "text-notion-text-light bg-black/5"
                            }`}
                            title="Daily budget progress (Today's total / Budget)"
                        >
                            {formatHms(elapsed)} / {formatHms(budget)}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {isRunning ? (
                        <button
                            onClick={onStop}
                            className="btn-primary px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 bg-notion-text hover:bg-black group/btn"
                        >
                            <Square size={14} fill="currentColor" className="group-hover/btn:rotate-90 transition-transform duration-500" />
                            <span className="uppercase text-[10px] font-bold tracking-[0.2em] text-white">Pause</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => onStart(task.id)}
                            className="btn-primary px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 bg-notion-primary hover:bg-amber-500 group/btn border-none"
                        >
                            <Play size={14} fill="currentColor" className="group-hover/btn:translate-x-0.5 transition-transform" />
                            <span className="uppercase text-[10px] font-bold tracking-[0.2em] text-white">Resume</span>
                        </button>
                    )
                    }

                    <button
                        onClick={() => {
                            if (confirm(`Reset today's progress for "${task.name}"?`)) {
                                onReset(task.id);
                            }
                        }}
                        className="btn-secondary px-6 py-2 rounded-xl border border-notion-border shadow-sm hover:shadow-md hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all active:scale-95 group/reset"
                        title="Reset Today's Time"
                    >
                        <RotateCcw size={14} className="group-hover/reset:rotate-[-120deg] transition-transform duration-500" />
                        <span className="uppercase text-[10px] font-bold tracking-[0.2em]">Reset</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
