import { formatDuration } from "@/lib/timeUtils";

/**
 * Props for the TimerDisplay component.
 */
interface TimerDisplayProps {
    /** Elapsed time in milliseconds to display. */
    elapsed: number;
    /** Optional additional CSS classes for styling. */
    className?: string;
}

/**
 * Pure presentation component that formats and displays a duration.
 * Uses a monospace font and tabular numerals for stable layout during ticking.
 */
export default function TimerDisplay({ elapsed, className = "" }: TimerDisplayProps) {
    return (
        <div className={`font-mono text-2xl tabular-nums ${className}`}>
            {formatDuration(elapsed)}
        </div>
    );
}
