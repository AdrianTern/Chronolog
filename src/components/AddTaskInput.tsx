"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

/**
 * Props for the AddTaskInput component.
 */
interface AddTaskInputProps {
    /** Callback triggered when a new task is added. */
    onAdd: (name: string) => void;
}

/**
 * Form component with a text input and submit button to create new tasks.
 * Includes a rotation animation on the plus icon when hovered.
 */
export default function AddTaskInput({ onAdd }: AddTaskInputProps) {
    const [name, setName] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAdd(name.trim());
            setName("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-4 group">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What are you working on next?"
                className="flex-1 px-4 py-3 rounded-lg glass-inset border border-notion-border focus:border-notion-primary focus:outline-none transition-all text-sm font-medium placeholder:text-notion-text-light"
            />
            <button
                type="submit"
                disabled={!name.trim()}
                className="btn-primary disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95 group/btn"
            >
                <Plus size={20} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline">Add Task</span>
            </button>
        </form>
    );
}
