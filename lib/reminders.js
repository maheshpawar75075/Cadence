(function (global) {
  "use strict";
  const FL = global.FL = global.FL || {};

  function parseHm(hm) {
    const parts = String(hm || "").split(":");
    const h = Number(parts[0]);
    const m = Number(parts[1] || 0);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return { h, m };
  }

  function nextAlarmWhen(hm, from) {
    const parsed = parseHm(hm);
    if (!parsed) return null;
    const d = from ? new Date(from) : new Date();
    const when = new Date(d.getFullYear(), d.getMonth(), d.getDate(), parsed.h, parsed.m, 0, 0);
    if (when.getTime() <= d.getTime()) when.setDate(when.getDate() + 1);
    return when.getTime();
  }

  async function syncHabitReminders(habits, reminderStyle) {
    if (typeof chrome === "undefined" || !chrome.alarms) return;
    const existing = await chrome.alarms.getAll();
    await Promise.all(
      (existing || [])
        .filter((a) => a.name && a.name.indexOf("cadence_habit_") === 0)
        .map((a) => chrome.alarms.clear(a.name))
    );
    if (reminderStyle === "off" || reminderStyle === "badge") return;
    (habits || []).forEach((habit) => {
      (habit.reminders || []).forEach((hm, idx) => {
        const when = nextAlarmWhen(hm);
        if (!when) return;
        chrome.alarms.create(`cadence_habit_${habit.id}_${idx}`, { when, periodInMinutes: 24 * 60 });
      });
    });
  }

  Object.assign(FL, { parseHm, nextAlarmWhen, syncHabitReminders });
})(typeof window !== "undefined" ? window : globalThis);
