import { Task } from "@/types/task";
import { calculateTaskTotal, formatTimeShort, calculateDailyTotal, calculateWeeklyTotal } from "@/lib/timeUtils";
import { ClipboardClock, Hourglass, Trash2, Edit2, Check, X, Clock, Calendar, BarChart3, Radio, Star } from "lucide-react";
import { useState } from "react";
import { getDisplayName } from "@/lib/taskHierarchy";

/** Convert a dailyBudgetMs value to a human-readable label like "2h budget" */
const formatBudgetLabel = (ms: number | null | undefined): string => {
    if (!ms) return "";
    if (ms >= 3600000 && ms % 3600000 === 0) return `${ms / 3600000}h budget`;
    const totalMins = Math.round(ms / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return h > 0 ? `${h}h${m > 0 ? `${m}m` : ""} budget` : `${m}m budget`;
};

/**
 * Props for the TaskItem component.
 */
interface TaskItemProps {
    /** The task object to display. */
    task: Task;
    /** Whether this task's timer is currently active. */
    isActive: boolean;
    /** Visual indentation level for subtasks (0 = root) */
    indent?: number;
    /** Descendant tasks used to roll up time calculations to the parent */
    descendantTasks?: Task[];
    /** Whether any of the descendants are currently active */
    hasActiveDescendant?: boolean;
    /** Click handler for the card body (used for expanding subtasks) */
    onClick?: () => void;
    onStart: (id: string) => void;
    /** Callback triggered when the delete button is clicked. */
    onDelete: (id: string) => void;
    /** Callback triggered when a task is renamed. */
    onRename: (id: string, name: string) => void;
    /** Callback triggered to toggle favorite status. */
    onToggleFavorite: (id: string) => void;
    /** Callback triggered to set a per-task daily budget in ms. null = clear. */
    onSetBudget: (id: string, budgetMs: number | null) => void;
}

/**
 * Individual task item component displaying task name, stats, and controls.
 * Supports renaming and starting/stopping tracking.
 */
export default function TaskItem({
    task,
    isActive,
    indent = 0,
    descendantTasks,
    hasActiveDescendant,
    onClick,
    onStart,
    onDelete,
    onRename,
    onToggleFavorite,
    onSetBudget,
}: TaskItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(task.name);
    // Budget stored as hours string for easy text input (e.g. "2" or "1.5")
    const [pendingBudgetHours, setPendingBudgetHours] = useState<string>(
        task.dailyBudgetMs ? String(task.dailyBudgetMs / 3600000) : ""
    );

    const displayName = getDisplayName(task.name);

    let totalTime = calculateTaskTotal(task);
    let dailyTime = calculateDailyTotal(task);
    let weeklyTime = calculateWeeklyTotal(task);

    if (descendantTasks && descendantTasks.length > 0) {
        totalTime += descendantTasks.reduce((acc, t) => acc + calculateTaskTotal(t), 0);
        dailyTime += descendantTasks.reduce((acc, t) => acc + calculateDailyTotal(t), 0);
        weeklyTime += descendantTasks.reduce((acc, t) => acc + calculateWeeklyTotal(t), 0);
    }

    const handleRename = () => {
        if (newName.trim() && newName !== task.name) {
            onRename(task.id, newName.trim());
        }
        // Apply the pending budget change
        const budgetMs = pendingBudgetHours.trim()
            ? Math.round(parseFloat(pendingBudgetHours) * 3600000)
            : null;
        onSetBudget(task.id, budgetMs && budgetMs > 0 ? budgetMs : null);
        setIsEditing(false);
    };

    const hasBudget = !!task.dailyBudgetMs;

    return (
        <div
            className={`glass-card flex items-center justify-between group transition-premium ${onClick ? 'cursor-pointer' : ''} ${hasActiveDescendant ? 'ring-1 ring-notion-primary/50 animate-pulse-glow bg-notion-primary/5' : ''}`}
            onClick={(e) => {
                if ((e.target as HTMLElement).closest('button, input')) return;
                onClick?.();
            }}
        >
            <div className="flex-1 mr-8">
                {isEditing ? (
                    <div className="flex items-center gap-4 flex-wrap">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            autoFocus
                            className="flex-1 min-w-[160px] px-4 py-2 glass-inset focus:outline-none focus:ring-2 focus:ring-black/10 rounded-xl text-sm font-medium text-notion-text"
                            onKeyDown={(e) => e.key === "Enter" && handleRename()}
                        />
                        <div className="flex items-center gap-1.5" title="Daily time budget (hours)">
                            <ClipboardClock size={13} className="text-notion-text-light" />
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="Budget (hrs)"
                                value={pendingBudgetHours}
                                onChange={(e) => setPendingBudgetHours(e.target.value)}
                                className="w-28 text-xs bg-white/70 border border-notion-border rounded-lg px-2 py-1.5 text-notion-text focus:outline-none focus:ring-2 focus:ring-black/10"
                            />
                        </div>
                        <button onClick={handleRename} className="p-2 text-notion-text hover:bg-white/60 rounded-md transition-colors">
                            <Check size={18} />
                        </button>
                        <button onClick={() => setIsEditing(false)} className="p-2 text-notion-text-light hover:bg-white/60 rounded-md transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                ) : (
                    <div>
                        <h3
                            className="text-lg font-bold text-notion-text mb-2 leading-tight flex items-center gap-2"
                            title={task.name}
                        >
                            {task.isFavorite && <Star size={16} className="fill-amber-400 text-amber-400 shrink-0" />}
                            <span className="truncate">{displayName}</span>
                            {hasBudget && (
                                <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-50 border border-orange-200 text-orange-500 shrink-0"
                                    title={`Daily budget: ${formatBudgetLabel(task.dailyBudgetMs)}`}
                                >
                                    <ClipboardClock size={9} />
                                    {formatBudgetLabel(task.dailyBudgetMs)}
                                </span>
                            )}
                            {hasActiveDescendant && (
                                <div className="ml-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-notion-primary/10 text-notion-primary border border-notion-primary/20 animate-breathe shadow-sm">
                                    <Radio size={10} className="animate-pulse" />
                                    Live
                                </div>
                            )}
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
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {!isActive && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onStart(task.id);
                            }}
                            className="p-2 text-notion-text-light hover:text-notion-text hover:bg-white/60 rounded-md flex items-center gap-0 hover:gap-2 overflow-hidden transition-all duration-300 group/play"
                            title="Resume Task"
                        >
                            <Hourglass size={14} className="shrink-0 transition-transform duration-500 group-hover/play:rotate-180" />
                            <span className="max-w-0 overflow-hidden whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-all duration-300 group-hover/play:max-w-[50px]">
                                Resume
                            </span>
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(task.id);
                        }}
                        className={`p-2 rounded-md transition-all ${task.isFavorite ? 'text-amber-400 hover:bg-amber-400/10' : 'text-notion-text-light hover:text-amber-400 hover:bg-amber-400/10'}`}
                        title={task.isFavorite ? "Unfavorite" : "Favorite"}
                    >
                        <Star size={14} className={task.isFavorite ? 'fill-amber-400' : ''} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }}
                        className="p-2 text-notion-text-light hover:text-notion-text hover:bg-white/60 rounded-md transition-all"
                        title="Rename"
                    >
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(task.id);
                        }}
                        className="p-2 text-notion-text-light hover:text-notion-text hover:bg-white/60 rounded-md transition-all"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {isActive && (
                    <div className="flex items-center gap-2 px-3 py-1.5 border border-notion-border text-notion-text rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/60 backdrop-blur animate-breathe">
                        <div className="w-1.5 h-1.5 rounded-full bg-notion-primary animate-pulse" />
                        <span>Live</span>
                    </div>
                )}
            </div>
        </div>
    );
}
