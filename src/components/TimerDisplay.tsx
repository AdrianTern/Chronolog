import { formatDuration } from "@/lib/timeUtils";
import React from "react";

interface TimerDisplayProps {
    elapsed: number;
    className?: string;
    style?: React.CSSProperties;
}

export default function TimerDisplay({ elapsed, className = "", style }: TimerDisplayProps) {
    return (
        <div className={`font-mono text-2xl tabular-nums ${className}`} style={style}>
            {formatDuration(elapsed)}
        </div>
    );
}
