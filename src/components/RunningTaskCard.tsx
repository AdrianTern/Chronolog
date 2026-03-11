"use client";

import { Task } from "@/types/task";
import { Square } from "lucide-react";
import TimerDisplay from "./TimerDisplay";

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
}

/**
 * Hero card displayed at the top of the dashboard when a task is active.
 * Shows the task name, a live breathing indicator, and the active timer.
 */
export default function RunningTaskCard({
    task,
    elapsed,
    onStop,
}: RunningTaskCardProps) {
    return (
        <div className="card-premium flex flex-col md:flex-row items-center justify-between gap-10 transition-all relative overflow-hidden group">
            <div className="flex-1 text-center md:text-left relative z-10">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-4 animate-breathe">
                    <div className="w-1.5 h-1.5 rounded-full bg-notion-primary" />
                    <span className="text-notion-text-light text-[10px] font-bold uppercase tracking-[0.2em]">
                        Current Activity
                    </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-notion-text leading-tight">
                    {task.name}
                </h2>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                <div className="relative">
                    <TimerDisplay elapsed={elapsed} className="text-6xl font-bold tracking-tighter text-notion-text tabular-nums" />
                </div>

                <button
                    onClick={onStop}
                    className="btn-primary"
                >
                    <Square size={18} fill="currentColor" className="group-hover:rotate-90 transition-transform duration-500" />
                    <span className="uppercase text-[11px] font-bold tracking-widest text-white">Stop</span>
                </button>
            </div>
        </div>
    );
}
