# Chronolog: Minimalist Time Tracking

Chronolog is a premium, web-based time-tracking application designed for precision and focus. Inspired by the clean, distraction-free aesthetic of Notion, Chronolog allows users to effortlessly track their active tasks, view real-time elapsed durations, and generate insightful weekly volume reports.

## ✨ Features

- **Real-Time Tracking**: Start, stop, and track tasks with down-to-the-second accuracy.
- **Dynamic Dashboard**: An active "Hero Card" displays the currently running task with a live, ticking timer and a subtle breathing status indicator.
- **Subtasks & Hierarchy**: Organize tasks using a slash syntax (e.g., `Client/Design`). Reports automatically calculate rollups and let you drill down into hierarchical subtasks.
- **Favorites & Quick Access**: Star your most important tasks to pin them to the top of your backlog and task switcher for immediate access.
- **Chrome Extension Sync**: A compact extension popup allows you to track time from anywhere. Changes made in the extension sync bi-directionally with the web app in real-time.
- **Daily Goals & Budgets**: Set a global daily time goal, or assign specific budgets to individual tasks to ensure you don't overwork.
- **Advanced Notifications**: A robust background notification system alerts you when you hit daily goal milestones (25%, 50%, 75%, 100%), warns you about idle forgotten timers, suggests breaks, and alerts you when you exceed task budgets.
- **Live Weekly Insights**: A dedicated reports page that calculates daily and weekly volume per task, dynamically updating in real-time as timers tick.
- **CSV Export**: Instantly export your weekly timesheets to a properly formatted CSV file for external billing or analysis.
- **Notion-Inspired Aesthetics**: A strict monochrome color palette, refined typography, and subtle micro-animations (like hover reveals and breathing indicators) for a premium feel.
- **Local Persistence**: All data is securely stored in your browser's local storage.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router exported as Static HTML for Extension)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Utility**: [date-fns](https://date-fns.org/)

## 📐 Architecture & Design Patterns

Chronolog was built with maintainability and clean code principles in mind, utilizing several modern React design patterns:

### 1. Unified Storage Sync Bridge
The project operates seamlessly as both a Web App and a Chrome Extension. A custom `Content Script Bridge` leverages `window.postMessage` and `chrome.storage.onChanged` to ensure both platforms reflect the exact same state in real-time without double-hydration issues.

### 2. Custom Hooks Pattern
Stateful logic is extracted from components into dedicated custom hooks in the `src/hooks/` directory.
- `useTasks.ts`: Manages the core CRUD operations for tasks and syncs with local storage.
- `useTimer.ts`: Handles the complex logic of the active ticker, calculating time deltas, and gracefully handling midnight rollovers.
- `useWeeklyReport.ts`: Subscribes to the task state and derives the heavily calculated weekly report data structure, ensuring the UI remains snappy.

### 3. Native Background Service Worker
A dedicated Manifest V3 service worker (`background.js`) runs independently of the UI. It uses continuous alarms to manage notification state (like idle warnings and break reminders) so that users receive accurate notifications even if the extension popup and web app tab are both completely closed.

### 4. Presentational & Container Components
- **Containers** (`app/page.tsx`, `extension/page.tsx`): These pages act as the brain. They instantiate the custom hooks, hold the state, and pass data down.
- **Presentational** (`components/TaskItem.tsx`, `components/TimerDisplay.tsx`): These components are pure and dumb. They only care about rendering the props they receive and emitting events (like `onStart` or `onStop`) back up to the container.

### 5. Utility Module Pattern
Complex, non-React specific logic is isolated into pure functions inside `src/lib/`.
- `timeUtils.ts`: Handles all duration formatting and aggregation (daily/weekly totals).
- `taskHierarchy.ts`: Manages the string-based hierarchy calculations for subtasks without mutating data structure depth.

## 📂 Project Structure

```text
chronolog/
├── public/                   # Chrome Extension static assets & native scripts
│   ├── manifest.json         # Chrome MV3 Extension Manifest
│   ├── background.js         # Headless Service Worker for notifications
│   └── content.js            # Content script for bridging storage
├── scripts/                  # Custom build utilities
│   └── fix-extension-paths.js # Post-build Next.js sanitizer for extensions
├── src/
│   ├── app/                  # Next.js app router pages & layouts
│   │   ├── extension/        # Dedicated Chrome Extension UI popup
│   │   ├── reports/          # Insights Page
│   │   ├── globals.css       # Core Tailwind configuration and custom CSS variables
│   │   ├── layout.tsx        # Global HTML shell and metadata
│   │   └── page.tsx          # Main Tracker Dashboard
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

## 🧩 Google Chrome Extension Installation

Chronolog includes native support for working as a background-running Google Chrome extension, bringing time tracking directly into your browser's toolbar with cross-tab syncing and offline push notifications.

To install the extension locally:

1. **Build the extension package**:
   ```bash
   npm run ext:build
   ```
   *This command runs Next.js static export and then executes a custom post-build script (`scripts/fix-extension-paths.js`) to sanitize routing paths for Manifest V3 compatibility.*

2. **Load into Chrome**:
   - Open Google Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** using the toggle in the top right corner.
   - Click the **Load unpacked** button.
   - Select the `out` directory located inside your `chronolog` project folder.

3. **Pin & Use**:
   - Click the puzzle piece icon 🧩 in Chrome's top right toolbar.
   - Pin the Chronolog icon.
   - Click the icon at any time to drop down the sleek 400x600 tracking dashboard. Your data will instantly sync with your `localhost` web views!
