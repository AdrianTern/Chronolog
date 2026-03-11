import { Task } from "@/types/task";
import TaskItem from "./TaskItem";

/**
 * Props for the TaskList component.
 */
interface TaskListProps {
    /** Array of all task objects. */
    tasks: Task[];
    /** The ID of the currently active task, if any. */
    activeTaskId: string | null;
    /** Callback triggered to start a task's timer. */
    onStart: (id: string) => void;
    /** Callback triggered to delete a task. */
    onDelete: (id: string) => void;
    /** Callback triggered to rename a task. */
    onRename: (id: string, name: string) => void;
}

/**
 * Renders a list of TaskItem components, sorted by creation date.
 * Handles the empty state when no tasks are present.
 */
export default function TaskList({
    tasks,
    activeTaskId,
    onStart,
    onDelete,
    onRename,
}: TaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 px-4 border border-notion-border bg-notion-sidebar rounded-lg">
                <p className="text-notion-text-light text-sm font-medium">No tasks yet. Create one above to get started.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {tasks
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((task, idx) => (
                    <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                        <TaskItem
                            task={task}
                            isActive={task.id === activeTaskId}
                            onStart={onStart}
                            onDelete={onDelete}
                            onRename={onRename}
                        />
                    </div>
                ))}
        </div>
    );
}
