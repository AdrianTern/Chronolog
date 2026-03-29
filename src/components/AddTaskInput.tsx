"use client";

import { useState, useRef, useEffect } from "react";
import { Hourglass, Star } from "lucide-react";
import { Task } from "@/types/task";

interface AddTaskInputProps {
    /** Callback triggered when a new task name is entered. */
    onAdd: (name: string) => void;
    /** Callback triggered when an existing task is selected to resume. */
    onResume: (taskId: string) => void;
    /** All tasks in the backlog for suggestions. */
    tasks: Task[];
    /** ID of the currently active task so it is excluded from suggestions. */
    activeTaskId: string | null;
    /** Whether to use a compact style suitable for the 400px extension popup. */
    compact?: boolean;
}

export default function AddTaskInput({ onAdd, onResume, tasks, activeTaskId, compact = false }: AddTaskInputProps) {
    const [name, setName] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Active task is included in suggestions but sorted first if it exists,
    // then favorite tasks, then alphabetical.
    const sortedTasks = tasks
        .slice()
        .sort((a, b) => {
            const aActive = a.id === activeTaskId ? 0 : 1;
            const bActive = b.id === activeTaskId ? 0 : 1;
            if (aActive !== bActive) return aActive - bActive;

            const aFav = a.isFavorite ? 0 : 1;
            const bFav = b.isFavorite ? 0 : 1;
            if (aFav !== bFav) return aFav - bFav;

            return a.name.localeCompare(b.name);
        });

    // Determine if input ends with / to adapt context
    const isSubtaskMode = name.endsWith("/");

    // Filter by prefix
    const suggestions = name.trim()
        ? sortedTasks.filter((t) =>
            t.name.toLowerCase().startsWith(name.trim().toLowerCase())
        )
        : sortedTasks;

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        setHighlighted(-1);
        setShowSuggestions(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((prev) => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((prev) => Math.max(prev - 1, -1));
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        } else if (e.key === "Enter" && highlighted >= 0) {
            e.preventDefault();
            selectSuggestion(suggestions[highlighted]);
        }
    };

    const selectSuggestion = (task: Task) => {
        // Only append slash if it's the active task. Otherwise, assume they want to resume it.
        if (task.id === activeTaskId) {
            // Append slash for subtask entry, keep focus
            setName(task.name + "/");
            setHighlighted(-1);
            inputRef.current?.focus();
        } else {
            setShowSuggestions(false);
            setHighlighted(-1);
            setName("");
            onResume(task.id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) return;

        // Check if the name exactly matches an existing (non-active) backlog task
        const match = tasks.find(
            (t) => t.id !== activeTaskId && t.name.toLowerCase() === trimmed.toLowerCase()
        );

        if (match) {
            onResume(match.id);
        } else {
            onAdd(trimmed);
        }

        setName("");
        setShowSuggestions(false);
    };

    return (
        <div ref={containerRef} className={`relative w-full z-50 transition-all duration-300 ${showSuggestions && suggestions.length > 0 ? "shadow-2xl" : ""}`}>
            <form onSubmit={handleSubmit} className="relative w-full flex items-center">
                <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder={compact
                        ? (activeTaskId ? "Switch task..." : "Start a task...")
                        : (activeTaskId ? "Start or switch to another task..." : "What are you working on next?")
                    }
                    className={`w-full pl-4 pr-[90px] bg-white/80 backdrop-blur-3xl border border-notion-border transition-all font-semibold placeholder:text-notion-text-light/60 text-notion-text focus:outline-none focus:ring-2 focus:ring-notion-primary/10
                        ${compact ? "py-2.5 text-sm" : "py-4 text-base"}
                        ${showSuggestions && suggestions.length > 0 ? "rounded-t-2xl border-b-notion-border/30" : "rounded-2xl shadow-lg"}
                    `}
                    autoComplete="off"
                />
                
                <button
                    type="submit"
                    disabled={!name.trim()}
                    className="absolute right-2 px-4 py-2 bg-notion-primary text-white text-[11px] font-bold uppercase tracking-widest rounded-xl flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-0 disabled:scale-90"
                >
                    <Hourglass
                        size={12}
                        className={`transition-transform duration-500 ${name.trim() ? "animate-[spin_4s_linear_infinite]" : ""}`}
                    />
                    <span className="hidden sm:inline">Start</span>
                </button>
            </form>

            {/* Seamless Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 top-full border border-t-0 border-notion-border bg-white/90 backdrop-blur-3xl rounded-b-2xl shadow-2xl max-h-[300px] overflow-y-auto z-50 animate-fade-in origin-top">
                    {suggestions.map((task, idx) => (
                        <li key={task.id} className="border-b border-notion-border/30 last:border-b-0 animate-slide-up" style={{ animationFillMode: 'both', animationDelay: `${idx * 20}ms` }}>
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault(); // prevent blur on input
                                    selectSuggestion(task);
                                }}
                                className={`w-full text-left px-5 py-3.5 text-[13px] font-semibold transition-colors flex items-center justify-between group/item ${
                                    idx === highlighted
                                        ? "bg-black/5 text-notion-text"
                                        : "text-notion-text hover:bg-white/60"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={idx === highlighted ? "translate-x-1 transition-transform" : "transition-transform group-hover/item:translate-x-1"}>
                                        {task.name}
                                    </span>
                                    {task.isFavorite && <Star size={12} className="ml-1 fill-amber-400 text-amber-400 shrink-0" />}
                                    {task.id === activeTaskId && (
                                        <span className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-notion-primary/10 text-notion-primary border border-notion-primary/20">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-wider transition-opacity ${idx === highlighted ? 'opacity-100 text-notion-text-light' : 'opacity-0 group-hover/item:opacity-100 text-notion-text-light/50'}`}>
                                    {task.id === activeTaskId ? "Add Subtask ↵" : "Resume ↵"}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
