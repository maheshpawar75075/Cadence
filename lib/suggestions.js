/* Actionable suggestions from local habit history — not generic slogans. */
(function (global) {
  "use strict";
  const FL = global.FL = global.FL || {};
  const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function applyReminderSuggestion(habit) {
    if (!habit) return null;
    const name = (habit.name || "").toLowerCase();
    if (name.includes("water")) {
      return {
        id: "remind-water",
        habitId: habit.id,
        label: `Move ${habit.name} to 10am and 2pm reminders`,
        patch: { reminders: ["10:00", "14:00"] },
      };
    }
    if (habit.reminders && habit.reminders.length) return null;
    return {
      id: "remind-once",
      habitId: habit.id,
      label: `Add a 9:00am reminder for ${habit.name}`,
      patch: { reminders: ["09:00"] },
    };
  }

  function generateActionSuggestions(habits, completions) {
    habits = habits || [];
    completions = completions || {};
    const today = new Date();
    const actions = [];
    const next = FL.nextIncompleteHabit && FL.nextIncompleteHabit(habits, completions, today);
    if (next) {
      actions.push({
        id: "next-habit",
        type: "next",
        habitId: next.id,
        label: `Do this next: ${next.name}`,
        detail: next.minimum ? `Minimum version: ${next.minimum}` : "Check it off when done.",
      });
    } else if (habits.length) {
      actions.push({
        id: "plan-tomorrow",
        type: "plan",
        label: "Plan tomorrow’s top habit",
        detail: "Pick one non-negotiable for the morning so tomorrow starts decided.",
      });
    }

    habits.forEach((h) => {
      const stats = FL.habitMissStats ? FL.habitMissStats(h, completions, 28) : null;
      if (stats && stats.worstRatio >= 0.5 && stats.totalByWeekday[stats.worstDay] >= 2) {
        const dayName = WEEKDAY[stats.worstDay];
        actions.push({
          id: "miss-" + h.id,
          type: "adjust",
          habitId: h.id,
          label: `You miss ${h.name} most on ${dayName}s — reduce the target?`,
          detail: h.type === "numeric"
            ? `Consider dropping the target from ${h.target} ${h.unit || ""} or enabling a minimum version.`
            : (h.minimum ? `Use “${h.minimum}” on ${dayName}s.` : "Add a 5-minute minimum version for hard days."),
        });
      }
      const remind = applyReminderSuggestion(h);
      if (remind && actions.length < 6) {
        actions.push({
          id: remind.id + h.id,
          type: "schedule",
          habitId: h.id,
          label: remind.label,
          patch: remind.patch,
        });
      }
    });

    const unique = [];
    const seen = new Set();
    actions.forEach((a) => {
      if (seen.has(a.label)) return;
      seen.add(a.label);
      unique.push(a);
    });
    return unique.slice(0, 4);
  }

  function generateAIInsights(completions, habits) {
    const actions = generateActionSuggestions(habits, completions);
    if (!actions.length) {
      return [{
        type: "empty",
        icon: "•",
        text: "Add 3–5 habits in onboarding, then suggestions will cite your actual check-ins.",
        action: null,
      }];
    }
    return actions.map((a) => ({
      type: a.type,
      icon: "→",
      text: a.label + (a.detail ? " " + a.detail : ""),
      action: a,
    }));
  }

  function primaryInsight(habits, completions) {
    const list = generateActionSuggestions(habits, completions);
    return list[0] || null;
  }

  Object.assign(FL, { generateActionSuggestions, generateAIInsights, primaryInsight });
})(typeof window !== "undefined" ? window : globalThis);
