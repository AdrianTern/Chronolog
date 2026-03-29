// Chronolog Native Extension Service Worker
// Uses Manifest V3 background worker to independently check alarms and send notifications
// Runs periodically (every 1 min) when the extension is closed

const STORAGE_KEY = "time-tracker-data";
const SETTINGS_KEY = "chronolog-notification-settings";
const DAILY_GOAL_KEY = "chronolog-daily-goal";
const DAILY_GOAL_ENABLED_KEY = "chronolog-daily-goal-enabled";

// In-memory state for debounce/tracking
let lastSentBudget = {};
let lastBreakInterval = {};
let idleSent = {};
let milestonesSent = {};

// Default settings if undefined
const DEFAULT_SETTINGS = {
    enabled: true,
    breakReminder: { enabled: false, thresholdMs: 3600000 },
    overtimeAlert: { enabled: true },
    idleWarning: { enabled: true, thresholdMs: 14400000 },
    dailyGoalMilestones: { enabled: true },
};

function getLocalData(keys) {
    return new Promise(resolve => {
        chrome.storage.local.get(keys, resolve);
    });
}

// Calculate the total time across the task and its subtasks for today
function calculateDailyRollup(task, allTasks, currentStartOfToday) {
    let total = 0;
    
    // This task's sessions
    total += task.sessions.reduce((acc, s) => {
        const sessionStart = Math.max(s.startTime, currentStartOfToday);
        const sessionEnd = s.endTime || Date.now();
        if (sessionEnd <= currentStartOfToday) return acc;
        return acc + (sessionEnd > sessionStart ? sessionEnd - sessionStart : 0);
    }, 0);

    // Subtasks' sessions
    const prefix = task.name + "/";
    const descendants = allTasks.filter(other => other.name.startsWith(prefix));
    
    descendants.forEach(d => {
        total += d.sessions.reduce((acc, s) => {
            const sessionStart = Math.max(s.startTime, currentStartOfToday);
            const sessionEnd = s.endTime || Date.now();
            if (sessionEnd <= currentStartOfToday) return acc;
            return acc + (sessionEnd > sessionStart ? sessionEnd - sessionStart : 0);
        }, 0);
    });

    return total;
}

async function checkTimers() {
    const data = await getLocalData([STORAGE_KEY, SETTINGS_KEY, DAILY_GOAL_KEY, DAILY_GOAL_ENABLED_KEY]);
    
    let appData;
    try {
        appData = JSON.parse(data[STORAGE_KEY] || '{"tasks":[]}');
    } catch {
        return;
    }
    const tasks = appData.tasks || [];
    
    let settings = DEFAULT_SETTINGS;
    try {
        settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data[SETTINGS_KEY] || '{}') };
    } catch {}

    const isGoalEnabled = data[DAILY_GOAL_ENABLED_KEY] === "true";
    const goalMs = parseInt(data[DAILY_GOAL_KEY]) || (8 * 3600000);

    if (!settings.enabled) return;

    const currentStartOfToday = new Date().setHours(0, 0, 0, 0);
    const todayStr = new Date().toDateString();

    let totalDailyMsAllTasks = 0;

    // Reset daily trackers if necessary
    if (milestonesSent.date !== todayStr) {
        milestonesSent = { date: todayStr, sent: new Set() };
        lastSentBudget = {};
    }

    // Find running tasks
    const runningTasks = tasks.filter(t => t.sessions.some(s => s.endTime === null));

    for (const task of tasks) {
        // Compute daily total for all tasks for the Goal Milestone tracking
        totalDailyMsAllTasks += calculateDailyRollup(task, tasks, currentStartOfToday);
    }

    for (const task of runningTasks) {
        const activeSession = task.sessions.find(s => s.endTime === null);
        const elapsed = calculateDailyRollup(task, tasks, currentStartOfToday);
        const sessionElapsed = Date.now() - activeSession.startTime;

        // 1. Budget Alert
        if (settings.overtimeAlert.enabled && task.dailyBudgetMs && elapsed > task.dailyBudgetMs) {
            if (lastSentBudget[task.id] !== todayStr) {
                lastSentBudget[task.id] = todayStr;
                chrome.notifications.create(`budget-${task.id}`, {
                    type: "basic",
                    iconUrl: "favicon.ico",
                    title: `⚠️ Budget Exceeded: ${task.name}`,
                    message: `You've exceeded your configured budget for '${task.name}' today.`
                });
            }
        }

        // 2. Break Reminder
        if (settings.breakReminder.enabled) {
            const bThreshold = settings.breakReminder.thresholdMs;
            const currentBInterval = Math.floor(elapsed / bThreshold);
            if (currentBInterval > 0 && lastBreakInterval[task.id] !== currentBInterval) {
                lastBreakInterval[task.id] = currentBInterval;
                chrome.notifications.create(`break-${task.id}-${currentBInterval}`, {
                    type: "basic",
                    iconUrl: "favicon.ico",
                    title: `☕ Take a break: ${task.name}`,
                    message: `You've been tracking time for '${task.name}' for a while. Time for a quick break?`
                });
            }
        }

        // 3. Idle Warning
        if (settings.idleWarning.enabled) {
            const iThreshold = settings.idleWarning.thresholdMs;
            if (sessionElapsed >= iThreshold && !idleSent[task.id]) {
                idleSent[task.id] = true;
                chrome.notifications.create(`idle-${task.id}`, {
                    type: "basic",
                    iconUrl: "favicon.ico",
                    title: `🕒 Idle Warning: ${task.name}`,
                    message: `Your timer for '${task.name}' has been running for over ${iThreshold / 3600000} hours. Did you forget to stop it?`,
                    requireInteraction: true
                });
            }
        }
    }

    // Goal Milestones
    if (isGoalEnabled && settings.dailyGoalMilestones.enabled && goalMs > 0) {
        const milestones = [25, 50, 75, 100];
        const currentPercent = (totalDailyMsAllTasks / goalMs) * 100;

        for (const m of milestones) {
            if (currentPercent >= m && !milestonesSent.sent.has(m)) {
                milestonesSent.sent.add(m);
                chrome.notifications.create(`goal-${m}`, {
                    type: "basic",
                    iconUrl: "favicon.ico",
                    title: m === 100 ? "🏆 Goal Achieved!" : "📈 Daily Goal Progress",
                    message: m === 100 
                        ? "Fantastic! You've reached 100% of your daily time goal." 
                        : `You've reached ${m}% of your daily goal. Keep it up!`
                });
            }
        }
    }
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "chronolog-tick") {
        checkTimers();
    }
});



// Run immediately on boot to set initial state
chrome.runtime.onInstalled.addListener(() => {
    // Check every 1 minute
    chrome.alarms.create("chronolog-tick", { periodInMinutes: 1 });
});

checkTimers();
