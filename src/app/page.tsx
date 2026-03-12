"use client";

import { useTasks } from "@/hooks/useTasks";
import { useTimer } from "@/hooks/useTimer";
import AddTaskInput from "@/components/AddTaskInput";
import TaskList from "@/components/TaskList";
import RunningTaskCard from "@/components/RunningTaskCard";
import Link from "next/link";
import { BarChart2, Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import * as notifications from "@/lib/notifications";

import Image from "next/image";

export default function Dashboard() {
  const { tasks, addTask, deleteTask, renameTask, refreshTasks } = useTasks();
  const { activeTask, elapsed, startTimer, stopTimer } = useTimer(
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
    <main className="py-16 animate-slide-up">
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
            <span className="section-label">{activeTask ? "Switch Task" : "New Task"}</span>
            <AddTaskInput onAdd={handleAddTask} />
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
          />
        </section>
      </div>
    </main>
  );
}
