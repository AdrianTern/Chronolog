"use client";

import { useTasks } from "@/hooks/useTasks";
import { useTimer } from "@/hooks/useTimer";
import AddTaskInput from "@/components/AddTaskInput";
import TaskList from "@/components/TaskList";
import RunningTaskCard from "@/components/RunningTaskCard";
import Link from "next/link";
import { BarChart2, Clock } from "lucide-react";

export default function Dashboard() {
  const { tasks, addTask, deleteTask, renameTask, refreshTasks } = useTasks();
  const { activeTask, elapsed, startTimer, stopTimer } = useTimer(
    tasks,
    refreshTasks
  );

  const handleAddTask = (name: string) => {
    const newTask = addTask(name);
    if (newTask) {
      startTimer(newTask.id);
    }
  };

  return (
    <main className="py-16 animate-slide-up">
      <header className="flex items-center justify-between mb-24">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-notion-border flex items-center justify-center">
            <Clock size={28} className="text-notion-text" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="leading-none mb-1">Chronolog</h1>
            <span className="text-sm font-medium text-notion-secondary-text">Precision Time Tracking</span>
          </div>
        </div>

        <Link
          href="/reports"
          className="btn-secondary"
        >
          <BarChart2 size={18} className="text-notion-text" />
          <span>Insights</span>
        </Link>
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
