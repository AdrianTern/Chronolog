"use client";

import { useTasks } from "@/hooks/useTasks";
import { useTimer } from "@/hooks/useTimer";
import { formatDuration } from "@/lib/timeUtils";
import DailyGoalProgress from "@/components/DailyGoalProgress";
import RunningTaskCard from "@/components/RunningTaskCard";
import AddTaskInput from "@/components/AddTaskInput";
import Link from "next/link";
import { BarChart2, Settings, List, Home, X, Star, Play, ExternalLink } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { calculateDailyTotal } from "@/lib/timeUtils";
import SettingsDrawer from "@/components/SettingsDrawer";
import Image from "next/image";

export default function ExtensionPopup() {
  const {
    tasks,
    isHydrating,
    addTask,
    deleteTask,
    renameTask,
    toggleFavoriteTask,
    setTaskDailyBudget,
    resetTaskDailyTime,
    refreshTasks
  } = useTasks();

  const { activeTask, lastTask, elapsed, startTimer, stopTimer } = useTimer(
    tasks,
    refreshTasks
  );

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showBacklog, setShowBacklog] = useState(false);
  const backlogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (showBacklog && backlogRef.current) {
      // Slight delay ensures the DOM is fully expanded before scrolling
      setTimeout(() => {
        backlogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [showBacklog]);

  if (isHydrating) {
    return (
      <div className="w-[400px] h-[600px] bg-notion-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-notion-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  const heroTask = activeTask || lastTask;
  const heroElapsed = activeTask ? elapsed : (heroTask ? calculateDailyTotal(heroTask) : 0);

  // Derived collections
  const favoriteTasks = tasks.filter(t => t.isFavorite);
  const recentTasks = tasks
    .filter(t => t.sessions.length > 0 && t.id !== activeTask?.id)
    .sort((a, b) => {
      const lastA = a.sessions[a.sessions.length - 1].endTime || Date.now();
      const lastB = b.sessions[b.sessions.length - 1].endTime || Date.now();
      return lastB - lastA;
    })
    .slice(0, 4);

  const handleOpenInsights = () => {
    const url = "http://localhost:3000/reports";
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  const handleOpenHome = () => {
    const url = "http://localhost:3000";
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="w-[400px] h-[600px] bg-notion-bg overflow-hidden flex flex-col relative border border-notion-border shadow-2xl">
      {/* Dynamic Background Orbs (Mini Version) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-400/10 blur-[60px] animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-amber-400/10 blur-[60px] animate-pulse" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 logo-glass flex items-center justify-center p-1.5 border border-notion-border rounded-lg shadow-sm">
            <Image src="/logo.png" alt="Logo" width={20} height={20} />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-notion-text">Chronolog</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenHome}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors text-notion-text-light hover:text-notion-text"
            title="Open Dashboard"
          >
            <ExternalLink size={16} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors text-notion-text-light hover:text-notion-text"
            title="Notification Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-4 relative z-10 custom-scrollbar">
        {/* Task Entry */}
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
          <AddTaskInput
            onAdd={addTask}
            onResume={startTimer}
            tasks={tasks}
            activeTaskId={activeTask?.id || null}
            compact={true}
          />
        </section>

        {/* Hero Section */}
        <section className="glass-card !p-6 !rounded-2xl">
          {heroTask ? (
            <RunningTaskCard
              key={heroTask.id}
              task={heroTask}
              elapsed={heroElapsed}
              onStop={stopTimer}
              onStart={startTimer}
              onReset={resetTaskDailyTime}
              isRunning={!!activeTask}
              onBudgetChange={setTaskDailyBudget}
            />
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 glass-surface border border-notion-border rounded-2xl flex items-center justify-center mx-auto text-notion-text-light opacity-40">
                <Home size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-notion-text">Ready to start?</p>
                <p className="text-[10px] text-notion-secondary-text uppercase tracking-wider">Select a task from your backlog</p>
              </div>
            </div>
          )}
        </section>
        {/* Minimal Goal Progress */}
        <section className="px-2">
          <DailyGoalProgress
            tasks={tasks}
            activeTaskId={activeTask?.id || null}
            elapsed={elapsed}
            minimal={true}
          />
        </section>
        {/* Quick Access Sections */}
        <div className="space-y-6">
          {favoriteTasks.length > 0 && (
            <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Star size={12} className="text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-bold text-notion-text-light uppercase tracking-wider">Favorites</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {favoriteTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => startTimer(task.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${activeTask?.id === task.id
                        ? 'bg-notion-primary text-white border-notion-primary shadow-sm shadow-amber-200'
                        : 'bg-white text-notion-text border-notion-border hover:border-notion-primary/30 hover:bg-black/5'
                      }`}
                  >
                    {task.name}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Navigation / Actions Row */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleOpenInsights}
            className="btn-secondary !justify-center !py-3 !rounded-xl group"
          >
            <BarChart2 size={16} className="text-notion-text-light group-hover:text-notion-primary transition-colors" />
            <span className="text-xs font-bold">Insights</span>
          </button>
          <button
            onClick={() => setShowBacklog(!showBacklog)}
            className={`btn-secondary !justify-center !py-3 !rounded-xl group transition-all ${showBacklog ? 'bg-notion-primary/5 border-notion-primary/20' : ''}`}
          >
            {showBacklog ? <X size={16} className="text-notion-primary" /> : <List size={16} className="text-notion-text-light group-hover:text-notion-primary" />}
            <span className={`text-xs font-bold ${showBacklog ? 'text-notion-primary' : ''}`}>
              {showBacklog ? 'Close List' : 'Backlog'}
            </span>
          </button>
        </div>

        {/* Backlog Tasks (Expandable) */}
        {showBacklog && (
          <section ref={backlogRef} className="pt-2 animate-slide-up">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-bold text-notion-text-light uppercase tracking-wider">All Tasks</span>
              <span className="text-[9px] font-bold text-notion-secondary-text opacity-50 tracking-widest">{tasks.length} TOTAL</span>
            </div>
            <div className="flex flex-col gap-1">
              {tasks.map(task => {
                const isActive = task.id === activeTask?.id;
                // For the active task, sum completed sessions today + live elapsed
                const completedDailyMs = task.sessions
                  .filter(s => s.endTime !== null)
                  .reduce((acc, s) => {
                    const startOfToday = new Date().setHours(0, 0, 0, 0);
                    const start = Math.max(s.startTime, startOfToday);
                    const end = s.endTime!;
                    return end > startOfToday ? acc + Math.max(0, end - start) : acc;
                  }, 0);
                const displayMs = isActive ? completedDailyMs + elapsed : calculateDailyTotal(task);
                return (
                  <button
                    key={task.id}
                    onClick={() => startTimer(task.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${
                      isActive
                        ? 'bg-notion-primary/5 border border-notion-primary/20'
                        : 'hover:bg-black/5 border border-transparent hover:border-notion-border'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-notion-primary animate-pulse' : 'bg-notion-border'}`} />
                      <span className={`text-[12px] font-semibold truncate ${isActive ? 'text-notion-primary' : 'text-notion-text'}`}>
                        {task.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {displayMs > 0 && (
                        <span className={`text-[10px] font-mono tabular-nums ${isActive ? 'text-notion-primary' : 'text-notion-text-light'}`}>
                          {formatDuration(displayMs)}
                        </span>
                      )}
                      <Play
                        size={10}
                        className={`transition-opacity ${isActive ? 'text-notion-primary opacity-100' : 'text-notion-text-light opacity-0 group-hover:opacity-60'}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
