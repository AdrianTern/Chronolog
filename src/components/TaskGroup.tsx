import { Task } from "@/types/task";
import { TaskNode, getDescendantTasks } from "@/lib/taskHierarchy";
import { useState } from "react";
import { ChevronDown, ChevronRight, Layers } from "lucide-react";
import TaskItem from "./TaskItem";

interface TaskGroupProps {
    node: TaskNode;
    activeTaskId: string | null;
    onStart: (id: string) => void;
    onDelete: (id: string) => void;
    onRename: (id: string, name: string) => void;
    onToggleFavorite: (id: string) => void;
    onSetBudget: (id: string, budgetMs: number | null) => void;
    onResetToday: (id: string) => void;
}

export default function TaskGroup({
    node,
    activeTaskId,
    onStart,
    onDelete,
    onRename,
    onToggleFavorite,
    onSetBudget,
    onResetToday
}: TaskGroupProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Sort children alphabetically
    const sortedChildren = [...node.children].sort((a, b) => a.displayName.localeCompare(b.displayName));
    const hasChildren = sortedChildren.length > 0;
    
    // Calculate total descendants for counts
    const allDescendants = getDescendantTasks(node);
    
    // Check if any descendant is currently active
    const isAnyDescendantActive = allDescendants.some(t => t.id === activeTaskId);

    // If it's a root node without a real task AND no children (shouldn't happen with our logic, but just in case)
    if (!node.task && !hasChildren) return null;

    return (
        <div className="flex flex-col mb-3">
            {/* Render the parent task if it has a real task object, otherwise render a virtual root header */}
            {node.task ? (
                <div className="relative group/stack">
                    <TaskItem
                        task={node.task}
                        isActive={node.task.id === activeTaskId}
                        onStart={onStart}
                        onDelete={onDelete}
                        onRename={onRename}
                        onToggleFavorite={onToggleFavorite}
                        onSetBudget={onSetBudget}
                        onResetToday={onResetToday}
                        indent={0}
                        descendantTasks={allDescendants}
                        hasActiveDescendant={isAnyDescendantActive}
                        onClick={hasChildren ? () => setIsExpanded(!isExpanded) : undefined}
                    />
                    
                    {/* Visual Stack Indicator & Expand Button */}
                    {hasChildren && (
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/stack:opacity-100 transition-opacity">
                             <button 
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-1 rounded bg-white border border-notion-border shadow-sm text-notion-text-light hover:text-notion-text transition-colors"
                             >
                                 {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                             </button>
                        </div>
                    )}
                    
                    {/* Badge indicating subtasks exist */}
                    {hasChildren && !isExpanded && (
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 px-1.5 py-0.5 rounded-full bg-notion-border text-notion-secondary-text text-[9px] font-bold flex items-center gap-1 cursor-pointer shadow-sm hover:scale-110 transition-transform" onClick={() => setIsExpanded(true)}>
                            <Layers size={10} />
                            {allDescendants.length}
                        </div>
                    )}
                </div>
            ) : (
                 /* Virtual Root (folder without a base task) */
                 <div 
                    className={`flex items-center gap-2 px-4 py-3 bg-white/40 border rounded-xl mb-1 cursor-pointer transition-colors ${
                        isAnyDescendantActive 
                            ? 'border-notion-primary/40 shadow-[0_0_15px_rgba(251,191,36,0.15)] bg-notion-primary/5' 
                            : 'border-notion-border hover:bg-white/60'
                    }`}
                    onClick={() => setIsExpanded(!isExpanded)}
                 >
                     <div className="text-notion-text-light">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                     </div>
                     <span className="font-bold text-notion-text">{node.displayName}</span>
                     <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-notion-border text-notion-secondary-text">
                        {allDescendants.length}
                     </span>
                 </div>
            )}

            {/* Render Children (Subtasks) */}
            {hasChildren && isExpanded && (
                <div className="ml-6 mt-2 flex flex-col gap-2 border-l border-notion-border/50 pl-4 py-1 relative">
                    {/* Helper to check if child or its descendants are active */}
                    {(() => {
                        const isNodeActive = (n: TaskNode): boolean =>
                            n.id === activeTaskId || n.children.some(isNodeActive);
                        
                        // Sort children: Active descendants first, then alphabetical
                        const sorted = [...sortedChildren].sort((a, b) => {
                             const aActive = isNodeActive(a) ? 0 : 1;
                             const bActive = isNodeActive(b) ? 0 : 1;
                             if (aActive !== bActive) return aActive - bActive;

                             return a.displayName.localeCompare(b.displayName);
                        });

                        return sorted.map((child, idx) => (
                            <div key={child.id} className="animate-fade-in relative" style={{ animationDelay: `${idx * 0.05}s` }}>
                                {/* Line connecting to parent */}
                                <div className="absolute left-[-16px] top-[24px] w-3 h-px bg-notion-border/50" />
                                
                                {/* If child has its own children, render another TaskGroup recursively */}
                                {child.children.length > 0 ? (
                                    <TaskGroup
                                        node={child}
                                        activeTaskId={activeTaskId}
                                        onStart={onStart}
                                        onDelete={onDelete}
                                        onRename={onRename}
                                        onToggleFavorite={onToggleFavorite}
                                        onSetBudget={onSetBudget}
                                        onResetToday={onResetToday}
                                    />
                                ) : (
                                    /* Terminal node */
                                    child.task && (
                                        <TaskItem
                                            task={child.task}
                                            isActive={child.task.id === activeTaskId}
                                            onStart={onStart}
                                            onDelete={onDelete}
                                            onRename={onRename}
                                            onToggleFavorite={onToggleFavorite}
                                            onSetBudget={onSetBudget}
                                            onResetToday={onResetToday}
                                            indent={1}
                                        />
                                    )
                                )}
                            </div>
                        ));
                    })()}
                </div>
            )}
        </div>
    );
}
