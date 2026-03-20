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
};

export type AppData = {
  tasks: Task[];
};
