"use client";

import { Download } from "lucide-react";

/**
 * Props for the ExportButton component.
 */
interface ExportButtonProps {
    /** Callback triggered when the button is clicked. */
    onClick: () => void;
    /** Whether the button is disabled. */
    disabled: boolean;
}

/**
 * Styled button used to trigger the CSV export of the weekly report.
 */
export default function ExportButton({ onClick, disabled }: ExportButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="btn-primary"
        >
            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
            <span>Export</span>
        </button>
    );
}
