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

      // Request permission automatically on first access
      if (permission === "default") {
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
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-notion-border flex items-center justify-center overflow-hidden p-3 text-notion-text">
            <Image src="/logo.png" alt="Chronolog Logo" width={32} height={32} priority />
          </div>
          <div>
            <h1 className="leading-none mb-1">Chronolog</h1>
            <span className="text-sm font-medium text-notion-secondary-text">Precision Time Tracking</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleNotifications}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-notion-hover transition-colors text-notion-secondary-text"
            title={showNotificationsActive ? "Notifications Enabled" : "Notifications Disabled"}
          >
            {showNotificationsActive ? (
              <Bell size={20} className="text-notion-text" />
            ) : (
              <BellOff size={20} />
            )}
          </button>

          <Link
            href="/reports"
            className="btn-secondary"
          >
            <BarChart2 size={18} className="text-notion-text" />
            <span>Insights</span>
          </Link>
        </div>
      </header>

      <div className="space-y-24">
        {activeTask && (
          <section>
            <span className="section-label">Active Now</span>
            <RunningTaskCard
              task={activeTask}
              elapsed={elapsed}
              onStop={stopTimer}
            />
          </section>
        )}

        <section>
          <span className="section-label">New Task</span>
          <AddTaskInput onAdd={handleAddTask} />
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
