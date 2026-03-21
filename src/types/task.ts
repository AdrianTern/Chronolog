export type Session = {
  id: string;
  startTime: number;
  endTime: number | null;
};

export type Task = {
  id: string;
  name: string;
  createdAt: number;
  sessions: Session[];
  isFavorite?: boolean;
  /** Per-task daily time budget in ms. When today's total exceeds this, an overtime alert fires. */
  dailyBudgetMs?: number | null;
};

export type AppData = {
  tasks: Task[];
};

export type NotificationSettings = {
    enabled: boolean;
    breakReminder: {
        enabled: boolean;
        thresholdMs: number;
    };
    overtimeAlert: {
        enabled: boolean;
    };
    idleWarning: {
        enabled: boolean;
        thresholdMs: number;
    };
    dailyGoalMilestones: {
        enabled: boolean;
    };
};
