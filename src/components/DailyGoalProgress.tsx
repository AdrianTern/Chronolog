"use client";

import React, { useState, useEffect, useRef } from "react";
import { Task } from "@/types/task";
import { calculateDailyTotal, formatHms } from "@/lib/timeUtils";
import { sendNotification } from "@/lib/notifications";
import * as storage from "@/lib/storage";
import { Target, Settings2 } from "lucide-react";

interface DailyGoalProgressProps {
    tasks: Task[];
    activeTaskId: string | null;
    elapsed: number; // For the active task
}

export default function DailyGoalProgress({ tasks, activeTaskId, elapsed }: DailyGoalProgressProps) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [goalHours, setGoalHours] = useState(8);
    const [totalDailyMs, setTotalDailyMs] = useState(0);

    const milestonesSentRef = useRef<Set<number>>(new Set());
    const lastMilestoneResetDate = useRef<string>(new Date().toDateString());

    // Load settings on mount
    useEffect(() => {
        setIsEnabled(storage.isDailyGoalEnabled());
        const goalMs = storage.getDailyGoal();
        setGoalHours(goalMs / 3600000);
    }, []);

    // Calculate total daily time
    useEffect(() => {
        // Sum up all tasks' daily totals
        // Our calculateDailyTotal already includes the active session if we pass Date.now() effectively
        // However, useTimer provides 'elapsed' for the active task which is more real-time.
        // Let's sum all OTHER tasks' daily totals and add the active task's 'elapsed'.
        
        const otherTasksTotal = tasks
            .filter(t => t.id !== activeTaskId)
            .reduce((acc, t) => acc + calculateDailyTotal(t), 0);
        
        
        setTotalDailyMs(otherTasksTotal + (activeTaskId ? elapsed : 0));

        // --- Milestone Notifications ---
        const settings = storage.getNotificationSettings();
        if (settings.enabled && settings.dailyGoalMilestones.enabled && isEnabled) {
            const today = new Date().toDateString();
            if (lastMilestoneResetDate.current !== today) {
                lastMilestoneResetDate.current = today;
                milestonesSentRef.current.clear();
            }

            const goalMs = goalHours * 3600000;
            if (goalMs > 0) {
                const milestones = [25, 50, 75, 100];
                const currentPercent = (totalDailyMs / goalMs) * 100;

                milestones.forEach(m => {
                    if (currentPercent >= m && !milestonesSentRef.current.has(m)) {
                        milestonesSentRef.current.add(m);
                        sendNotification(m === 100 ? "🏆 Goal Achieved!" : "📈 Daily Goal Progress", {
                            body: m === 100 
                                ? "Fantastic! You've reached 100% of your daily time goal." 
                                : `You've reached ${m}% of your daily goal. Keep it up!`,
                            tag: `goal-milestone-${m}`,
                        });
                    }
                });
            }
        }
    }, [tasks, activeTaskId, elapsed, isEnabled, goalHours]);

    const handleToggle = () => {
        const newEnabled = !isEnabled;
        setIsEnabled(newEnabled);
        storage.setDailyGoalEnabled(newEnabled);
    };

    const handleGoalChange = (valValue: string) => {
        let hours = parseFloat(valValue);
        if (isNaN(hours)) hours = 0;
        const clampedHours = Math.min(24, Math.max(0, hours));
        setGoalHours(clampedHours);
        storage.setDailyGoal(Math.round(clampedHours * 3600000));
    };

    if (!isEnabled && !storage.isDailyGoalEnabled()) {
        return (
            <section className="card-premium py-4 flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                    <div className="p-2 glass-surface rounded-lg border border-notion-border text-notion-text-light">
                        <Target size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-notion-text">Daily Goal Progress</h3>
                        <p className="text-xs text-notion-secondary-text">Set a target for your day</p>
                    </div>
                </div>
                <button 
                    onClick={handleToggle}
                    className="btn-secondary text-[11px] py-1.5 px-3"
                >
                    Enable
                </button>
            </section>
        );
    }

    const goalMs = goalHours * 3600000;
    const progress = goalMs > 0 ? Math.min(100, (totalDailyMs / goalMs) * 100) : 0;
    const isGoalMet = totalDailyMs >= goalMs && goalMs > 0;

    return (
        <section className="card-premium space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border border-notion-border transition-colors ${isGoalMet ? 'bg-green-50 text-green-600 border-green-100' : 'glass-surface text-notion-text-light'}`}>
                        <Target size={18} className={isGoalMet ? 'animate-bounce' : ''} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-notion-text">Daily Goal Progress</h3>
                        <p className="text-xs text-notion-secondary-text">
                            {isGoalMet ? "Goal reached! Amazing work." : "Keep pushing toward your target."}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-2 py-1 glass-surface border border-notion-border rounded-lg">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-notion-text-light">Goal:</span>
                        <input 
                            type="number"
                            value={goalHours}
                            onChange={(e) => handleGoalChange(e.target.value)}
                            className="w-12 bg-transparent text-sm font-bold text-notion-text focus:outline-none"
                            step="0.5"
                            min="0"
                            max="24"
                        />
                        <span className="text-[10px] font-bold text-notion-text-light">h</span>
                    </div>
                    
                    <button 
                        onClick={handleToggle}
                        className="p-1.5 text-notion-text-light hover:text-notion-text hover:bg-black/5 rounded-md transition-colors"
                        title="Disable Daily Goal"
                    >
                        <Settings2 size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-end justify-between font-mono text-xs tabular-nums">
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-lg font-bold ${isGoalMet ? 'text-green-600' : 'text-notion-text'}`}>
                            {formatHms(totalDailyMs)}
                        </span>
                        <span className="text-notion-text-light">/ {formatHms(goalMs)}</span>
                    </div>
                    <span className={`font-bold ${isGoalMet ? 'text-green-600' : 'text-notion-text-light'}`}>
                        {Math.round(progress)}%
                    </span>
                </div>

                <div className="h-2.5 w-full bg-black/5 rounded-full overflow-hidden border border-notion-border/50 p-[1px]">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                            isGoalMet 
                                ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' 
                                : 'bg-gradient-to-r from-notion-primary to-notion-primary/80'
                        }`}
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    </div>
                </div>
            </div>
        </section>
    );
}
