import { Task } from "@/types/task";

export type TaskNode = {
    id: string; // Task ID (or virtual ID for implied roots)
    name: string; // Full path name
    displayName: string; // Just the last segment
    task?: Task; // The actual task object if it exists
    children: TaskNode[];
};

/**
 * Gets the root segment of a path.
 * e.g., "Code/UI/Button" -> "Code"
 */
export function getRootName(path: string): string {
    return path.split('/')[0].trim();
}

/**
 * Gets the last segment of a path for display.
 * e.g., "Code/UI/Button" -> "Button"
 */
export function getDisplayName(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1].trim();
}

/**
 * Recursively builds a hierarchical tree from a flat list of tasks based on their path names.
 */
export function buildTaskTree(tasks: Task[]): TaskNode[] {
    const rootNodes: TaskNode[] = [];
    
    // Create a map of all paths to their actual tasks for quick lookup
    const taskMap = new Map<string, Task>();
    tasks.forEach(t => taskMap.set(t.name.toLowerCase(), t));

    // Gather all unique paths that should exist in the tree, including implicit parent folders
    const allPaths = new Set<string>();
    tasks.forEach(task => {
        const parts = task.name.split('/');
        let currentPath = "";
        parts.forEach(part => {
            currentPath = currentPath ? `${currentPath}/${part.trim()}` : part.trim();
            allPaths.add(currentPath);
        });
    });

    // Create a map to hold all nodes by their lowercase path
    const nodeMap = new Map<string, TaskNode>();

    // Sort paths by length so we process parents before children
    const sortedPaths = Array.from(allPaths).sort((a, b) => a.split('/').length - b.split('/').length);

    sortedPaths.forEach(path => {
        const lowerPath = path.toLowerCase();
        const parts = path.split('/');
        const displayName = parts[parts.length - 1];
        
        const node: TaskNode = {
            id: taskMap.has(lowerPath) ? taskMap.get(lowerPath)!.id : `virt-${lowerPath}`,
            name: path,
            displayName: displayName,
            task: taskMap.get(lowerPath),
            children: []
        };
        
        nodeMap.set(lowerPath, node);

        if (parts.length === 1) {
            // It's a root node
            rootNodes.push(node);
        } else {
            // It's a child node, find its parent
            const parentPath = parts.slice(0, -1).join('/').toLowerCase();
            const parentNode = nodeMap.get(parentPath);
            if (parentNode) {
                parentNode.children.push(node);
            } else {
                // Fallback if parent somehow wasn't created (shouldn't happen with our sorted paths logic)
                rootNodes.push(node);
            }
        }
    });

    // Helper to deeply sort the tree alphabetically by display name
    const sortTree = (nodes: TaskNode[]) => {
        nodes.sort((a, b) => a.displayName.localeCompare(b.displayName));
        nodes.forEach(node => sortTree(node.children));
    };
    
    sortTree(rootNodes);

    return rootNodes;
}

/**
 * Gets all actual task objects that are descendants of a given node recursively.
 */
export function getDescendantTasks(node: TaskNode): Task[] {
    const descendants: Task[] = [];
    const traverse = (n: TaskNode) => {
        if (n.task) descendants.push(n.task);
        n.children.forEach(traverse);
    };
    node.children.forEach(traverse);
    return descendants;
}
