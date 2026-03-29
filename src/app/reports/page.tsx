"use client";

import { useTasks } from "@/hooks/useTasks";
import { useWeeklyReport } from "@/hooks/useWeeklyReport";
import { exportWeeklyReportToCSV } from "@/lib/csvExport";
import WeeklyReportTable from "@/components/WeeklyReportTable";
import ExportButton from "@/components/ExportButton";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Home, Calendar, Filter, Search, X, Star } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { useState, useMemo, useRef, useEffect } from "react";
import { WeeklyTaskReportNode } from "@/lib/reportUtils";
import { Task } from "@/types/task";

const SleekToggle = ({ label, checked, onChange, id }: { label: string, checked: boolean, onChange: (v: boolean) => void, id: string }) => (
    <div className="flex items-center gap-3">
        <button 
            id={id}
            role="switch" 
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none active:scale-95 ${checked ? 'bg-amber-400' : 'bg-notion-border'}`}
        >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
        <label htmlFor={id} className="text-xs font-semibold text-notion-text cursor-pointer select-none hover:opacity-80 transition-opacity" onClick={() => onChange(!checked)}>
            {label}
        </label>
    </div>
);

const TaskMultiSearch = ({ tags, setTags, availableTasks }: { tags: string[], setTags: (tags: string[]) => void, availableTasks: Task[] }) => {
    const [inputValue, setInputValue] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);

    const suggestions = useMemo(() => {
        const query = inputValue.toLowerCase().trim();
        const filtered = availableTasks.filter(t => !tags.includes(t.name.toLowerCase()));

        if (!query) {
            return [...filtered].sort((a, b) => {
                if (a.isFavorite && !b.isFavorite) return -1;
                if (!a.isFavorite && b.isFavorite) return 1;
                return a.name.localeCompare(b.name);
            }).slice(0, 12);
        }

        return filtered
            .filter(t => t.name.toLowerCase().includes(query))
            .slice(0, 8);
    }, [availableTasks, inputValue, tags]);

    useEffect(() => {
        setHighlighted(-1);
    }, [inputValue]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const addTag = (val: string) => {
        const trimmed = val.trim().toLowerCase();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
        }
        setInputValue("");
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            setTags(tags.slice(0, -1));
            return;
        }

        if (!isOpen && e.key !== 'Escape') {
            setIsOpen(true);
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlighted >= 0 && suggestions[highlighted]) {
                addTag(suggestions[highlighted].name);
            } else if (inputValue.trim()) {
                addTag(inputValue);
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    return (
        <div ref={containerRef} className={`flex-1 relative flex items-center flex-wrap gap-2 transition-all shadow-sm z-30 border border-notion-border px-3 py-1.5 min-h-[38px] ${isOpen && suggestions.length > 0 ? 'bg-white/80 rounded-t-lg border-b-transparent backdrop-blur-xl' : 'bg-white/50 rounded-lg'}`}>
            <Search size={14} className="text-notion-text-light shrink-0 mr-1" />
            {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-white border border-notion-border rounded-md px-2 py-0.5 text-xs font-medium text-notion-text shadow-sm animate-in zoom-in-95 duration-200">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:bg-gray-100 rounded-full p-0.5 text-notion-text-light hover:text-notion-text transition-colors">
                        <X size={10} />
                    </button>
                </span>
            ))}
            <input 
                type="text" 
                value={inputValue}
                onChange={e => {
                    setInputValue(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? "Search tasks... (press Enter)" : ""}
                className="flex-1 min-w-[150px] bg-transparent outline-none text-sm text-notion-text placeholder:text-notion-text-light/50"
            />

            {/* Suggestions Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <ul className="absolute left-[-1px] right-[-1px] top-[100%] border border-t-0 border-notion-border bg-white/90 backdrop-blur-3xl rounded-b-lg shadow-2xl max-h-[250px] overflow-y-auto animate-fade-in origin-top">
                    {suggestions.map((task, idx) => (
                        <li key={task.id} className="border-b border-notion-border/30 last:border-b-0 animate-slide-up" style={{ animationFillMode: 'both', animationDelay: `${idx * 20}ms` }}>
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    addTag(task.name);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between group/item ${
                                    idx === highlighted
                                        ? "bg-black/5 text-notion-text"
                                        : "text-notion-text hover:bg-white/60"
                                }`}
                            >
                                <span className={idx === highlighted ? "translate-x-1 transition-transform flex items-center gap-2" : "transition-transform group-hover/item:translate-x-1 flex items-center gap-2"}>
                                    {task.isFavorite && <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />}
                                    {task.name}
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-wider transition-opacity ${idx === highlighted ? 'opacity-100 text-notion-text-light' : 'opacity-0 group-hover/item:opacity-100 text-notion-text-light/50'}`}>
                                    Filter ↵
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default function ReportsPage() {
    const { tasks, isHydrating } = useTasks();
    const [hideSubtasks, setHideSubtasks] = useState(false);
    const [searchTags, setSearchTags] = useState<string[]>([]);

    const {
        report,
        reportTree,
        currentWeek,
        nextWeek,
        prevWeek,
        resetToToday,
        totalsByDay,
        grandTotal,
        isFutureWeek,
        isFirstWeek,
        weekNumber
    } = useWeeklyReport(tasks, false);

    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

    const filteredTree = useMemo(() => {
        if (searchTags.length === 0) return reportTree;

        const filterNode = (node: WeeklyTaskReportNode): WeeklyTaskReportNode | null => {
            const nodeNameString = (node.name + " " + node.displayName).toLowerCase();
            
            // Matches if ANY of the search tags are found in its name
            const matchesSelf = searchTags.some(tag => nodeNameString.includes(tag));
            
            // Recursively evaluate children
            const filteredChildren = node.children.map(filterNode).filter(Boolean) as WeeklyTaskReportNode[];

            // Keep node if it matches directly OR if any child matches
            if (matchesSelf || filteredChildren.length > 0) {
                return {
                    ...node,
                    // If the parent matches directly, we keep ALL its original children!
                    // If it only matches because a child matched, we only keep the matching children.
                    children: matchesSelf ? node.children : filteredChildren
                };
            }
            return null;
        };

        return reportTree.map(filterNode).filter(Boolean) as WeeklyTaskReportNode[];
    }, [reportTree, searchTags]);

    const filteredTotalsByDay = useMemo(() => {
        if (filteredTree.length === 0) return Array(7).fill(0);
        const dayTotals = Array(7).fill(0);
        filteredTree.forEach(rootNode => {
            rootNode.days.forEach((day, idx) => {
                dayTotals[idx] += day.totalMs;
            });
        });
        return dayTotals;
    }, [filteredTree]);

    const filteredGrandTotal = filteredTotalsByDay.reduce((acc, val) => acc + val, 0);

    const handleExport = () => {
        exportWeeklyReportToCSV(report, currentWeek, weekNumber);
    };

    if (isHydrating) {
        // Return a sleek empty state or null while hydrating from storage
        return <div className="min-h-screen bg-notion-bg animate-pulse flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-notion-primary border-t-transparent animate-spin"></div></div>;
    }

    return (
        <main className="max-w-full mx-auto px-8 xl:px-16 py-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
                <div className="flex items-center gap-6">
                    <Link
                        href="/"
                        className="glass p-3 rounded-lg hover:bg-notion-hover transition-all"
                    >
                        <Home size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-notion-text">Insights</h1>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-notion-text-light font-bold">Performance Analytics</p>
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

            <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 glass glass-surface rounded-2xl py-3 px-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-40">
                <div className="flex-1 w-full flex items-center gap-3 relative">
                    <TaskMultiSearch tags={searchTags} setTags={setSearchTags} availableTasks={tasks} />
                </div>

                <div className="flex items-center gap-6 shrink-0 lg:border-l lg:border-notion-border/50 lg:pl-6">
                    <SleekToggle 
                        id="toggle-subtasks"
                        label="Hide subtasks" 
                        checked={hideSubtasks} 
                        onChange={setHideSubtasks} 
                    />
                </div>
            </div>

            {filteredTree.length > 0 ? (
                <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <WeeklyReportTable
                        reportTree={filteredTree}
                        totalsByDay={filteredTotalsByDay}
                        grandTotal={filteredGrandTotal}
                        hideSubtasks={hideSubtasks}
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

            <footer className="mt-12 pt-8 border-t border-notion-border text-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.4em] font-semibold">
                    Chronolog &bull; Excellence In Precision
                </p>
            </footer>
        </main>
    );
}
