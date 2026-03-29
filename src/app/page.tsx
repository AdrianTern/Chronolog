"use client";

import { useTasks } from "@/hooks/useTasks";
import { useTimer } from "@/hooks/useTimer";
import AddTaskInput from "@/components/AddTaskInput";
import TaskList from "@/components/TaskList";
import DailyGoalProgress from "@/components/DailyGoalProgress";
import RunningTaskCard from "@/components/RunningTaskCard";
import Link from "next/link";
import { ClipboardClock, BarChart2, Hourglass, Star, Reply, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { calculateDailyTotal, formatTimeShort } from "@/lib/timeUtils";
import { getDisplayName } from "@/lib/taskHierarchy";
import * as storage from "@/lib/storage";
import SettingsDrawer from "@/components/SettingsDrawer";

import Image from "next/image";

export default function Dashboard() {
  const { tasks, isHydrating, addTask, deleteTask, renameTask, toggleFavoriteTask, setTaskDailyBudget, resetTaskDailyTime, refreshTasks } = useTasks();
  const { activeTask, lastTask, elapsed, startTimer, stopTimer } = useTimer(
    tasks,
    refreshTasks
  );

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (isHydrating) {
    return null;
  }

  const heroTask = activeTask || lastTask;
  const heroElapsed = activeTask ? elapsed : (heroTask ? calculateDailyTotal(heroTask) : 0);

  const handleAddTask = async (name: string) => {
    const newTask = await addTask(name);
    if (newTask) {
      startTimer(newTask.id);
    }
  };

  return (
    <>
      <main className="container-tight py-16 animate-slide-up">
        <header className="flex items-center justify-between mb-24">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="btn-icon mr-2"
              title="Open Settings"
            >
              <Menu size={18} />
            </button>
            <div className="logo-glass w-14 h-14 flex items-center justify-center overflow-hidden p-3 border border-notion-border rounded-xl">
              <Image src="/logo.png" alt="Chronolog Logo" width={32} height={32} priority />
            </div>
            <div>
              <h1 className="leading-none mb-1">Chronolog</h1>
              <span className="text-sm font-medium text-notion-secondary-text">Precision Time Tracking</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/reports" className="btn-secondary">
              <BarChart2 size={16} className="text-notion-text" />
              <span>Insights</span>
            </Link>
          </div>
        </header>

        <div className="space-y-24">

          <section className="card-premium space-y-6">
            {heroTask && (
              <>
                <div className="relative">
                  <span className="section-label">{activeTask ? 'Active Now' : 'Paused'}</span>
                  <div className="relative pt-2">
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
                  </div>
                </div>
                <hr className="border-notion-border" />
              </>
            )}
            <div>
              <AddTaskInput
                onAdd={handleAddTask}
                onResume={startTimer}
                tasks={tasks}
                activeTaskId={activeTask?.id || null}
              />

              {(() => {
                // Determine what to show in the "Quick Resume" area below the input
                // 1. If a task is RUNNING: Show the 'lastTask' (Previous) + other Favorites
                // 2. If NO task is running: Hero is 'lastTask'. Show only other Favorites.
                
                const showRecentButton = lastTask && lastTask.id !== activeTask?.id && !!activeTask;
                const heroId = heroTask?.id;
                const recentId = showRecentButton ? lastTask?.id : null;
                
                const favoritesToDisplay = tasks.filter(t => 
                  t.isFavorite && 
                  t.id !== heroId && 
                  t.id !== recentId
                );

                if (showRecentButton || favoritesToDisplay.length > 0) {
                  return (
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full animate-slide-up">
                      {/* Recent/Previous Task Button */}
                      {showRecentButton && (
                        <button
                          key={`recent-${lastTask.id}`}
                          onClick={() => startTimer(lastTask.id)}
                          className="flex items-center gap-2 px-4 py-2.5 glass-surface border border-notion-border rounded-xl shadow-sm hover:shadow-md hover:bg-white/80 transition-premium group/fav active:scale-95"
                          title={`Resume ${lastTask.name}`}
                        >
                          <Reply size={14} className="text-notion-secondary-text shrink-0" />
                          <span className="text-sm font-semibold text-notion-text max-w-[150px] truncate">{getDisplayName(lastTask.name)}</span>
                          <div className="w-[1px] h-3 bg-notion-border mx-1"></div>
                          <Hourglass size={14} className="text-notion-primary opacity-50 transition-all duration-500 group-hover/fav:rotate-180 group-hover/fav:opacity-100" />
                        </button>
                      )}

                      {/* Favorites chips */}
                      {favoritesToDisplay.map(task => (
                        <button
                          key={`fav-${task.id}`}
                          onClick={() => startTimer(task.id)}
                          className="flex items-center gap-2 px-4 py-2.5 glass-surface border border-notion-border rounded-xl shadow-sm hover:shadow-md hover:bg-white/80 transition-premium group/fav active:scale-95"
                          title={task.name}
                        >
                          <Star size={14} className="fill-amber-400 text-amber-400 shrink-0" />
                          <span className="text-sm font-semibold text-notion-text max-w-[150px] truncate">{getDisplayName(task.name)}</span>
                          <div className="w-[1px] h-3 bg-notion-border mx-1"></div>
                          <Hourglass size={14} className="text-notion-primary opacity-50 transition-all duration-500 group-hover/fav:rotate-180 group-hover/fav:opacity-100" />
                        </button>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </section>

          <DailyGoalProgress
            tasks={tasks}
            activeTaskId={activeTask?.id || null}
            elapsed={elapsed}
          />

          <section>
            <div className="flex items-center justify-between mb-6">
              <span className="section-label mb-0">Backlog</span>
              <span className="text-[10px] font-semibold text-notion-secondary-text tracking-wider">{tasks.length} {tasks.length === 1 ? 'TASK' : 'TASKS'}</span>
            </div>
            <TaskList
              tasks={tasks}
              activeTaskId={activeTask?.id || null}
              onStart={startTimer}
              onDelete={deleteTask}
              onRename={renameTask}
              onToggleFavorite={toggleFavoriteTask}
              onSetBudget={setTaskDailyBudget}
              onResetToday={resetTaskDailyTime}
            />
          </section>

        </div>
      </main>
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <footer className="mt-20 py-10 text-center">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-notion-text-light opacity-40">
          Crafted with Precision • 2026
        </p>
      </footer>
    </>
  );
}
