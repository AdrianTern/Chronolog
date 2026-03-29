"use client";

import React, { useState, useEffect } from "react";
import * as storage from "@/lib/storage";
import { NotificationSettings } from "@/types/task";
import { X, Bell, Coffee, AlertTriangle, Target, Monitor, Info } from "lucide-react";
import { requestNotificationPermission, getNotificationPermission } from "@/lib/notifications";

interface SettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
    const [settings, setSettings] = useState<NotificationSettings | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");
    const [dailyGoal, setDailyGoal] = useState<number>(8); // Hours
    const [isDailyGoalEnabled, setIsDailyGoalEnabled] = useState<boolean>(true);

    useEffect(() => {
        if (isOpen) {
            storage.getNotificationSettings().then(setSettings);
            setPermissionStatus(getNotificationPermission());
            
            // Load Daily Goal settings
            storage.getDailyGoal().then(ms => {
                setDailyGoal(ms / 3600000);
            });
            storage.isDailyGoalEnabled().then(enabled => {
                setIsDailyGoalEnabled(enabled);
            });
        }
    }, [isOpen]);

    const handleToggleEnabled = async () => {
        if (!settings) return;
        
        const newEnabled = !settings.enabled;
        
        if (newEnabled && permissionStatus !== "granted") {
            const result = await requestNotificationPermission();
            setPermissionStatus(result);
            if (result !== "granted") return;
        }

        const newSettings = { ...settings, enabled: newEnabled };
        setSettings(newSettings);
        await storage.saveNotificationSettings(newSettings);
    };

    const updateSetting = async (updater: (prev: NotificationSettings) => NotificationSettings) => {
        if (!settings) return;
        const newSettings = updater(settings);
        setSettings(newSettings);
        await storage.saveNotificationSettings(newSettings);
    };

    if (!isOpen || !settings) return null;

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[100] animate-fade-in"
                onClick={onClose}
            />
            
            {/* Drawer */}
            <div className="fixed top-0 left-0 bottom-0 w-[400px] max-w-[90vw] bg-white shadow-[20px_0_50px_rgba(0,0,0,0.1)] border-r border-notion-border z-[101] flex flex-col overflow-hidden animate-slide-in-left">
                {/* Header */}
                <div className="p-6 border-b border-notion-border flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-notion-primary/10 rounded-xl text-notion-primary">
                            <Bell size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-notion-text tracking-tight">Notification Settings</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 rounded-full transition-colors text-notion-text-light"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Master Switch */}
                    <div className="flex items-center justify-between p-4 bg-notion-primary/5 rounded-2xl border border-notion-primary/10">
                        <div className="space-y-0.5">
                            <h3 className="text-sm font-bold text-notion-text">Enable Notifications</h3>
                            <p className="text-[11px] text-notion-secondary-text">Global toggle for all alerts</p>
                        </div>
                        <button 
                            onClick={handleToggleEnabled}
                            className={`w-11 h-6 rounded-full transition-colors relative ${settings.enabled ? 'bg-notion-primary' : 'bg-gray-200'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${settings.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {permissionStatus === "denied" && (
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex gap-3 text-red-600">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold">Browser Notifications Blocked</p>
                                <p className="text-[10px] leading-relaxed opacity-80">Please check your browser settings to allow Chronolog to send notifications.</p>
                            </div>
                        </div>
                    )}

                    <div className={`space-y-8 transition-opacity duration-300 ${settings.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        {/* Break Reminder */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Coffee size={16} className="text-notion-text-light" />
                                    <h4 className="text-[13px] font-bold text-notion-text">Task Duration Reminder</h4>
                                </div>
                                <button 
                                    onClick={() => updateSetting(s => ({ ...s, breakReminder: { ...s.breakReminder, enabled: !s.breakReminder.enabled } }))}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.breakReminder.enabled ? 'bg-notion-primary' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${settings.breakReminder.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <p className="text-[11px] text-notion-secondary-text leading-relaxed">
                                Get a reminder to take a break after tracking a single task for a specific duration.
                            </p>
                            {settings.breakReminder.enabled && (
                                <div className="flex items-center gap-2 px-3 py-2 glass-surface border border-notion-border rounded-xl">
                                    <span className="text-[10px] font-bold text-notion-text-light uppercase">Remind every:</span>
                                    <input 
                                        type="number"
                                        min="0.5"
                                        step="0.5"
                                        value={settings.breakReminder.thresholdMs / 3600000}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            updateSetting(s => ({ ...s, breakReminder: { ...s.breakReminder, thresholdMs: Math.round(val * 3600000) } }));
                                        }}
                                        className="w-12 bg-transparent text-sm font-bold text-notion-text focus:outline-none"
                                    />
                                    <span className="text-[10px] font-bold text-notion-text-light uppercase tracking-wider">Hours</span>
                                </div>
                            )}
                        </div>

                        {/* Overtime Alert */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-notion-text-light" />
                                    <h4 className="text-[13px] font-bold text-notion-text">Overtime Alerts</h4>
                                </div>
                                <button 
                                    onClick={() => updateSetting(s => ({ ...s, overtimeAlert: { ...s.overtimeAlert, enabled: !s.overtimeAlert.enabled } }))}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.overtimeAlert.enabled ? 'bg-notion-primary' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${settings.overtimeAlert.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <p className="text-[11px] text-notion-secondary-text leading-relaxed">
                                Receive a notification when today's total time for a task exceeds its configured daily budget.
                            </p>
                        </div>

                        {/* Idle Warning */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Monitor size={16} className="text-notion-text-light" />
                                    <h4 className="text-[13px] font-bold text-notion-text">Forgotten Timer Warning</h4>
                                </div>
                                <button 
                                    onClick={() => updateSetting(s => ({ ...s, idleWarning: { ...s.idleWarning, enabled: !s.idleWarning.enabled } }))}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.idleWarning.enabled ? 'bg-notion-primary' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${settings.idleWarning.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <p className="text-[11px] text-notion-secondary-text leading-relaxed">
                                Be notified if a timer runs for an unusually long time without interaction.
                            </p>
                            {settings.idleWarning.enabled && (
                                <div className="flex items-center gap-2 px-3 py-2 glass-surface border border-notion-border rounded-xl">
                                    <span className="text-[10px] font-bold text-notion-text-light uppercase">Notify after:</span>
                                    <input 
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={settings.idleWarning.thresholdMs / 3600000}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            updateSetting(s => ({ ...s, idleWarning: { ...s.idleWarning, thresholdMs: Math.round(val * 3600000) } }));
                                        }}
                                        className="w-12 bg-transparent text-sm font-bold text-notion-text focus:outline-none"
                                    />
                                    <span className="text-[10px] font-bold text-notion-text-light uppercase tracking-wider">Hours</span>
                                </div>
                            )}
                        </div>

                        {/* Daily Goal Milestones */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Target size={16} className="text-notion-text-light" />
                                    <h4 className="text-[13px] font-bold text-notion-text">Daily Goal Milestones</h4>
                                </div>
                                <button 
                                    onClick={() => updateSetting(s => ({ ...s, dailyGoalMilestones: { ...s.dailyGoalMilestones, enabled: !s.dailyGoalMilestones.enabled } }))}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${settings.dailyGoalMilestones.enabled ? 'bg-notion-primary' : 'bg-gray-200'}`}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${settings.dailyGoalMilestones.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <p className="text-[11px] text-notion-secondary-text leading-relaxed">
                                Get notified when you reach 25%, 50%, 75%, and 100% of your daily time goal.
                            </p>
                        </div>

                    </div>
                </div>


                {/* Footer Tip */}
                <div className="p-4 bg-black/5 flex gap-3 text-notion-secondary-text border-t border-notion-border">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <p className="text-[10px] leading-relaxed">
                        Notifications only work when your browser is open. Make sure to keep this tab active or pinned!
                    </p>
                </div>
            </div>
        </>
    );
}
