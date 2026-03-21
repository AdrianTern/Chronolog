import { Task } from "@/types/task";
import { buildTaskTree } from "@/lib/taskHierarchy";
import TaskGroup from "./TaskGroup";

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
    /** Callback triggered to toggle favorite status on a task. */
    onToggleFavorite: (id: string) => void;
    /** Callback triggered to set a per-task daily budget. */
    onSetBudget: (id: string, budgetMs: number | null) => void;
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
    onToggleFavorite,
    onSetBudget,
}: TaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 px-4 border border-notion-border bg-notion-sidebar rounded-lg">
                <p className="text-notion-text-light text-sm font-medium">No tasks yet. Create one above to get started.</p>
            </div>
        );
    }

    // Build the hierarchical tree and get the root nodes
    const rootNodes = buildTaskTree(tasks);

    // Sort roots: active > alphabetical.
    const sortedRoots = rootNodes.slice().sort((a, b) => {
        // Helper to check if a node or its children contain the active task
        const isActiveNode = (n: typeof rootNodes[0]) => 
            n.id === activeTaskId || n.children.some(c => c.id === activeTaskId);

        const aActive = isActiveNode(a) ? 0 : 1;
        const bActive = isActiveNode(b) ? 0 : 1;
        
        if (aActive !== bActive) return aActive - bActive;
        
        return 0; // Maintain existing buildTaskTree sort order (alphabetical)
    });

    return (
        <div className="flex flex-col gap-3">
            {sortedRoots.map((rootNode, idx) => (
                <div key={rootNode.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <TaskGroup
                        node={rootNode}
                        activeTaskId={activeTaskId}
                        onStart={onStart}
                        onDelete={onDelete}
                        onRename={onRename}
                        onToggleFavorite={onToggleFavorite}
                        onSetBudget={onSetBudget}
                    />
                </div>
            ))}
        </div>
    );
}
