/**
 * Utility to manage browser desktop notifications.
 */

const isBrowser = typeof window !== "undefined";
const STORAGE_KEY = "chronolog-notifications-enabled";

/**
 * Checks if notifications are enabled at the application level.
 */
export const areNotificationsEnabled = (): boolean => {
    if (!isBrowser) return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null || stored === "true"; // Enabled by default
};

/**
 * Sets the application-level notification preference.
 */
export const setNotificationsEnabled = (enabled: boolean) => {
    if (!isBrowser) return;
    localStorage.setItem(STORAGE_KEY, enabled.toString());
};

/**
 * Checks if the browser supports notifications.
 */
export const isNotificationSupported = (): boolean => {
    return isBrowser && "Notification" in window;
};

/**
 * Gets the current notification permission status.
 */
export const getNotificationPermission = (): NotificationPermission => {
    if (!isNotificationSupported()) return "denied";
    return Notification.permission;
};

/**
 * Requests permission to show desktop notifications.
 * Must be triggered by a user gesture.
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!isNotificationSupported()) return "denied";

    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (error) {
        console.error("Failed to request notification permission", error);
        return "denied";
    }
};

let hasWarnedDefaultPermission = false;

/**
 * Sends a desktop notification.
 */
export const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!isNotificationSupported() || !areNotificationsEnabled()) {
        return;
    }

    // Prevent double-firing: If the extension content script is active, 
    // it means the background service worker handles all notifications.
    if (isBrowser && sessionStorage.getItem("chronolog-extension-active") === "true") {
        return;
    }

    if (Notification.permission === "default") {
        if (!hasWarnedDefaultPermission) {
            console.warn("Chronolog: Notifications are enabled but browser permission is 'default'. Please toggle notifications in Settings to prompt the permission dialog.");
            hasWarnedDefaultPermission = true;
        }
        return;
    }

    if (Notification.permission !== "granted") {
        return;
    }

    try {
        new Notification(title, {
            icon: "/favicon.ico",
            ...options,
        });
    } catch (error) {
        console.error("Failed to send notification", error);
    }
};
