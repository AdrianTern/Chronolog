# Chronolog: Minimalist Time Tracking

Chronolog is a premium, web-based time-tracking application designed for precision and focus. Inspired by the clean, distraction-free aesthetic of Notion, Chronolog allows users to effortlessly track their active tasks, view real-time elapsed durations, and generate insightful weekly volume reports.

## ✨ Features

- **Real-Time Tracking**: Start, stop, and track tasks with down-to-the-second accuracy.
- **Dynamic Dashboard**: An active "Hero Card" displays the currently running task with a live, ticking timer and a subtle breathing status indicator.
- **Live Weekly Insights**: A dedicated reports page that calculates daily and weekly volume per task, dynamically updating in real-time as timers tick.
- **CSV Export**: Instantly export your weekly timesheets to a properly formatted CSV file for external billing or analysis.
- **Notion-Inspired Aesthetics**: A strict monochrome color palette, refined typography using native OS font stacks, and subtle micro-animations (like hover reveals and breathing indicators) for a premium feel.
- **Local Persistence**: All data is securely stored in your browser's local storage; no login required.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Utility**: [date-fns](https://date-fns.org/)

## 📐 Architecture & Design Patterns

Chronolog was built with maintainability and clean code principles in mind, utilizing several modern React design patterns:

### 1. Custom Hooks Pattern
Stateful logic is extracted from components into dedicated custom hooks in the `src/hooks/` directory. This separates the "what" (UI) from the "how" (Logic).
- `useTasks.ts`: Manages the core CRUD operations for tasks and syncs with local storage.
- `useTimer.ts`: Handles the complex logic of the active ticker, calculating time deltas, and gracefully handling midnight rollovers.
- `useWeeklyReport.ts`: Subscribes to the task state and derives the heavily calculated weekly report data structure, ensuring the UI remains snappy.

### 2. Presentational & Container Components
- **Containers** (`app/page.tsx`, `app/reports/page.tsx`): These pages act as the brain. They instantiate the custom hooks, hold the state, and pass data down.
- **Presentational** (`components/TaskItem.tsx`, `components/TimerDisplay.tsx`): These components are pure and dumb. They only care about rendering the props they receive and emitting events (like `onStart` or `onStop`) back up to the container.

### 3. Utility Module Pattern
Complex, non-React specific logic is isolated into pure functions inside `src/lib/`.
- `timeUtils.ts`: Handles all duration formatting and aggregation (daily/weekly totals).
- `reportUtils.ts`: Contains the optimized algorithm for bucketing sessions into specific days of the week using pre-calculated timestamp boundaries.

### 4. Storage Abstraction
Browser storage interactions are abstracted behind the `src/lib/storage.ts` module. By not calling `localStorage.getItem` directly inside components, the persistence layer can be easily swapped out for IndexedDB or a remote backend in the future without touching the UI code.

## 📂 Project Structure

```text
chronolog/
├── src/
│   ├── app/                  # Next.js app router pages & layouts
│   │   ├── globals.css       # Core Tailwind configuration and custom CSS variables
│   │   ├── layout.tsx        # Global HTML shell and metadata
│   │   ├── page.tsx          # Main Tracker Dashboard
│   │   └── reports/          # Insights Page
│   ├── components/           # Reusable Presentational React Components
│   ├── hooks/                # Custom React Hooks for state/logic separation
│   ├── lib/                  # Pure utility functions and storage abstraction
│   └── types/                # TypeScript interface definitions (Task, Session)
```

## 🚀 Getting Started

First, install the underlying dependencies:
```bash
npm install
```

Then, run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. Start your first task and watch the timer go!
