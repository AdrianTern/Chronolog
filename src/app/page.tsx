"use client";

import { useTasks } from "@/hooks/useTasks";
import { useTimer } from "@/hooks/useTimer";
import AddTaskInput from "@/components/AddTaskInput";
import TaskList from "@/components/TaskList";
import RunningTaskCard from "@/components/RunningTaskCard";
import Link from "next/link";
import { BarChart2, Bell, BellOff, Hourglass, Star, Reply } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { calculateDailyTotal, formatTimeShort } from "@/lib/timeUtils";
import { getDisplayName } from "@/lib/taskHierarchy";
import * as notifications from "@/lib/notifications";

import Image from "next/image";

export default function Dashboard() {
  const { tasks, addTask, deleteTask, renameTask, toggleFavoriteTask, refreshTasks } = useTasks();
  const { activeTask, lastTask, elapsed, startTimer, stopTimer } = useTimer(
    tasks,
    refreshTasks
  );

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [isNotifEnabled, setIsNotifEnabled] = useState(true);

  useEffect(() => {
    const initNotifications = async () => {
      const permission = notifications.getNotificationPermission();
      setNotifPermission(permission);
      setIsNotifEnabled(notifications.areNotificationsEnabled());

      // Only request permission automatically on desktop — not applicable on mobile/tablet
      const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
      if (permission === "default" && isDesktop) {
        const result = await notifications.requestNotificationPermission();
        setNotifPermission(result);
        if (result === "granted") {
          notifications.setNotificationsEnabled(true);
          setIsNotifEnabled(true);
        } else {
          notifications.setNotificationsEnabled(false);
          setIsNotifEnabled(false);
        }
      }
    };

    initNotifications();
  }, []);

  const handleToggleNotifications = async () => {
    if (isNotifEnabled) {
      // Disable case: Silence and update storage
      notifications.setNotificationsEnabled(false);
      setIsNotifEnabled(false);
    } else {
      // Enable case: Trigger browser prompt and update storage if granted
      const result = await notifications.requestNotificationPermission();
      setNotifPermission(result);

      if (result === "granted") {
        notifications.setNotificationsEnabled(true);
        setIsNotifEnabled(true);
      }
    }
  };

  const handleAddTask = (name: string) => {
    const newTask = addTask(name);
    if (newTask) {
      startTimer(newTask.id);
    }
  };

  const showNotificationsActive = notifPermission === "granted" && isNotifEnabled;

  return (
    <main className="container-tight py-16 animate-slide-up">
      <header className="flex items-center justify-between mb-24">
        <div className="flex items-center gap-4">
          <div className="logo-glass w-14 h-14 flex items-center justify-center overflow-hidden p-3 border border-notion-border rounded-xl">
            <Image src="/logo.png" alt="Chronolog Logo" width={32} height={32} priority />
          </div>
          <div>
            <h1 className="leading-none mb-1">Chronolog</h1>
            <span className="text-sm font-medium text-notion-secondary-text">Precision Time Tracking</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleNotifications}
            className="btn-icon hidden lg:inline-flex"
            title={showNotificationsActive ? "Notifications Enabled" : "Notifications Disabled"}
          >
            {showNotificationsActive ? (
              <Bell size={18} className="text-notion-text" />
            ) : (
              <BellOff size={18} className="text-notion-text-light" />
            )}
          </button>

          <Link href="/reports" className="btn-secondary">
            <BarChart2 size={16} className="text-notion-text" />
            <span>Insights</span>
          </Link>
        </div>
      </header>

      <div className="space-y-24">

        <section className="card-premium space-y-6">
          {activeTask && (
            <>
              <div>
                <span className="section-label">Active Now</span>
                <RunningTaskCard
                  task={activeTask}
                  elapsed={elapsed}
                  onStop={stopTimer}
                />
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
              const isRecentTaskRelevant = lastTask && lastTask.id !== activeTask?.id;
              const hasFavorites = tasks.some(t => t.isFavorite && t.id !== lastTask?.id && t.id !== activeTask?.id);

              if (isRecentTaskRelevant || hasFavorites) {
                return (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full animate-slide-up">
                    {/* Recent Task First */}
                    {isRecentTaskRelevant && (
                      <button
                        onClick={() => startTimer(lastTask.id)}
                        className="flex items-center gap-2 px-4 py-2.5 glass-surface border border-notion-border rounded-xl shadow-sm hover:shadow-md hover:bg-white/80 transition-premium group/fav active:scale-95"
                        title={lastTask.name}
                      >
                        <Reply size={14} className="text-notion-secondary-text shrink-0" />
                        <span className="text-sm font-semibold text-notion-text max-w-[150px] truncate">{getDisplayName(lastTask.name)}</span>
                        <div className="w-[1px] h-3 bg-notion-border mx-1"></div>
                        <Hourglass size={14} className="text-notion-primary opacity-50 transition-all duration-500 group-hover/fav:rotate-180 group-hover/fav:opacity-100" />
                      </button>
                    )}

                    {/* Favorites next */}
                    {tasks.filter(t => t.isFavorite && t.id !== lastTask?.id && t.id !== activeTask?.id).map(task => (
                      <button
                        key={task.id}
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
          />
        </section>
      </div>
    </main>
  );
}
