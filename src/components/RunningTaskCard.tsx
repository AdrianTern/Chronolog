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
        <div className="flex flex-col items-center justify-center py-4 gap-6 transition-all group animate-fade-in">
            <div className="text-center relative z-10">
                <div className="flex items-center gap-2 justify-center mb-2 animate-breathe">
                    <div className="w-1 h-1 rounded-full bg-notion-primary animate-pulse" />
                    <span className="text-notion-text-light text-[9px] font-bold uppercase tracking-[0.2em]">
                        Active Task
                    </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-notion-text leading-tight">
                    {task.name}
                </h2>
            </div>

            <div className="flex flex-col items-center gap-6 relative z-10 w-full">
                <div className="relative">
                    <TimerDisplay
                        elapsed={elapsed}
                        className="text-4xl font-bold tracking-tighter text-notion-text tabular-nums"
                        style={{ textShadow: "0 0 20px rgba(251,191,36,0.15)" }}
                    />
                </div>

                <button
                    onClick={onStop}
                    className="btn-primary px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 bg-notion-text hover:bg-black group/btn"
                >
                    <Square size={14} fill="currentColor" className="group-hover/btn:rotate-90 transition-transform duration-500" />
                    <span className="uppercase text-[10px] font-bold tracking-[0.2em] text-white">Pause</span>
                </button>
            </div>
        </div>
    );
}
