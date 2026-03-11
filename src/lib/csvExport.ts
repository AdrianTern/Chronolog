import { WeeklyTaskReport } from "@/lib/reportUtils";
import { formatTimeShort } from "./timeUtils";
import { format, startOfWeek } from "date-fns";

export const exportWeeklyReportToCSV = (
    report: WeeklyTaskReport[],
    weekDate: Date,
    weekNumber: number
) => {
    const days = report[0]?.days.map((d) => d.dayName) || [];
    const headers = ["Task", ...days, "Total"];

    // Header row
    let csvContent = headers.join(",") + "\n";

    // Data rows
    const dayTotalsMs = Array(days.length).fill(0);
    report.forEach((taskReport) => {
        const row = [
            `"${taskReport.taskName.replace(/"/g, '""')}"`, // Escape quotes
            ...taskReport.days.map((day, idx) => {
                dayTotalsMs[idx] += day.totalMs;
                return formatTimeShort(day.totalMs);
            }),
            formatTimeShort(taskReport.totalMs)
        ];
        csvContent += row.join(",") + "\n";
    });

    // Daily Volume row
    const grandTotalMs = dayTotalsMs.reduce((acc, val) => acc + val, 0);
    const volumeRow = [
        "Daily Volume",
        ...dayTotalsMs.map((total) => (total > 0 ? formatTimeShort(total) : "00:00")),
        formatTimeShort(grandTotalMs)
    ];
    csvContent += volumeRow.join(",") + "\n";

    const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
    const fileName = `timereport-week${weekNumber}-${format(weekStart, "yyyy-MM-dd")}.csv`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
