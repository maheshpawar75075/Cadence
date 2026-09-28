(function (global) {
  "use strict";
  const FL = global.FL = global.FL || {};

  /* ---------------------------------------------------------------------
   * Categories
   * ------------------------------------------------------------------- */
  const CATEGORIES = {
    work:    { name: "Work & Focus",      color: "#6C5CE7", soft: "#EEEBFC", icon: "💼" },
    health:  { name: "Health & Fitness",  color: "#00B894", soft: "#E1F7F1", icon: "💪" },
    diet:    { name: "Diet & Nutrition",  color: "#F0932B", soft: "#FDECD9", icon: "🥗" },
    mind:    { name: "Mind & Sleep",      color: "#0984E3", soft: "#E3F1FD", icon: "🧘" },
    personal:{ name: "Personal",          color: "#E84393", soft: "#FCE3EE", icon: "✨" },
  };
  const CATEGORY_ORDER = ["work", "health", "diet", "mind", "personal"];

  const DEFAULT_HABITS = [
    {
      id: "h_focus",
      name: "Deep Work / Priority Block",
      category: "work",
      type: "check",
      timeOfDay: "morning",
      estimatedMinutes: 90,
      cue: "After morning workstation setup",
      reminders: ["09:30"],
      minimum: "Complete 1 focused task",
      notes: "Single-task with zero distractions",
      subtasks: [
        { id: "st_f1", text: "Define single target outcome" },
        { id: "st_f2", text: "Silence notifications & phone" },
        { id: "st_f3", text: "Execute 90m deep work sprint" },
        { id: "st_f4", text: "Log key milestone completed" }
      ]
    },
    {
      id: "h_water",
      name: "Drink 8 Glasses of Water",
      category: "health",
      type: "numeric",
      target: 8,
      unit: "glasses",
      timeOfDay: "anytime",
      estimatedMinutes: 5,
      cue: "After morning coffee / entering desk",
      reminders: ["10:00", "14:00", "18:00"],
      minimum: "Drink 2 glasses now"
    },
    {
      id: "h_move",
      name: "Daily Movement / Exercise",
      category: "health",
      type: "check",
      timeOfDay: "morning",
      estimatedMinutes: 30,
      cue: "Before opening laptop for deep work",
      reminders: ["07:30"],
      minimum: "10-minute stretch or brisk walk",
      subtasks: [
        { id: "st_m1", text: "5-minute warmup & stretch" },
        { id: "st_m2", text: "20-minute workout or cardio" },
        { id: "st_m3", text: "Cool down & hydration" }
      ]
    },
    {
      id: "h_meals",
      name: "Healthy Balanced Meals",
      category: "diet",
      type: "numeric",
      target: 3,
      unit: "meals",
      timeOfDay: "anytime",
      estimatedMinutes: 45,
      cue: "At designated lunch & dinner times",
      reminders: ["12:30", "19:30"],
      minimum: "1 clean whole-food meal"
    },
    {
      id: "h_mind",
      name: "Mindfulness & Mental Reset",
      category: "mind",
      type: "check",
      timeOfDay: "afternoon",
      estimatedMinutes: 10,
      cue: "After lunch before resuming focus",
      reminders: ["13:00"],
      minimum: "2-minute deep breathing",
      subtasks: [
        { id: "st_mind1", text: "Step away from screens" },
        { id: "st_mind2", text: "Box breathing / meditation" },
        { id: "st_mind3", text: "Mental clarity intention" }
      ]
    },
    {
      id: "h_read",
      name: "Read 10 Pages / Learn",
      category: "personal",
      type: "check",
      timeOfDay: "evening",
      estimatedMinutes: 20,
      cue: "After evening meal / before bedtime",
      reminders: ["20:30"],
      minimum: "Read 2 pages or 1 article"
    },
    {
      id: "h_plan",
      name: "Daily Review & Tomorrow Plan",
      category: "work",
      type: "check",
      timeOfDay: "evening",
      estimatedMinutes: 15,
      cue: "At the start of the morning workday",
      reminders: ["17:30"],
      minimum: "Write top 1 goal for tomorrow",
      subtasks: [
        { id: "st_p1", text: "Review today's completions" },
        { id: "st_p2", text: "Choose top 3 priorities for tomorrow" },
        { id: "st_p3", text: "Clear workspace surface" }
      ]
    },
    {
      id: "h_sleep",
      name: "Sleep 7+ Hours & Screen Wind-Down",
      category: "mind",
      type: "check",
      timeOfDay: "evening",
      estimatedMinutes: 480,
      cue: "When bedroom lights dim at 10:30 PM",
      reminders: ["22:30"],
      minimum: "Turn off screens 30m before bed"
    },
  ];

  /* Ready-Made Day-to-Day Task Packs */
  const READY_MADE_TASK_PACKS = [
    {
      id: "morning_kickstart",
      name: "Morning Kickstart Routine",
      tagline: "Start your day with high energy & clarity",
      icon: "🌅",
      color: "#F0932B",
      tasks: [
        { name: "Hydrate with 2 glasses of water", category: "health", type: "numeric", target: 2, unit: "glasses", timeOfDay: "morning", estimatedMinutes: 5, minimum: "1 glass" },
        { name: "10-minute morning stretch / walk", category: "health", type: "check", timeOfDay: "morning", estimatedMinutes: 10, minimum: "3-minute stretch" },
        { name: "Review daily priorities & agenda", category: "work", type: "check", timeOfDay: "morning", estimatedMinutes: 10, minimum: "Pick 1 priority" },
        { name: "Nourishing balanced breakfast", category: "diet", type: "check", timeOfDay: "morning", estimatedMinutes: 20, minimum: "Healthy snack" },
      ],
    },
    {
      id: "deep_work_focus",
      name: "Deep Work & Focus Sprint",
      tagline: "Execute high-impact tasks without distraction",
      icon: "💼",
      color: "#6C5CE7",
      tasks: [
        {
          name: "90-minute deep work block", category: "work", type: "check", timeOfDay: "morning", estimatedMinutes: 90, minimum: "25-min sprint",
          subtasks: [{ id: "dw_1", text: "Lock in focus objective" }, { id: "dw_2", text: "Full screen timer sprint" }, { id: "dw_3", text: "Review progress" }]
        },
        { name: "Triage inbox & critical messages", category: "work", type: "check", timeOfDay: "afternoon", estimatedMinutes: 20, minimum: "Scan top 3 emails" },
        { name: "Stand & posture stretch break", category: "health", type: "check", timeOfDay: "afternoon", estimatedMinutes: 5, minimum: "30-sec posture reset" },
        { name: "End-of-day shutdown routine", category: "work", type: "check", timeOfDay: "evening", estimatedMinutes: 15, minimum: "Clean desk & note tomorrow's #1 task" },
      ],
    },
    {
      id: "vitality_health",
      name: "Vitality & Fitness Protocol",
      tagline: "Build unbreakable physical stamina and clean eating",
      icon: "💪",
      color: "#00B894",
      tasks: [
        { name: "Drink 8 glasses of water", category: "health", type: "numeric", target: 8, unit: "glasses", timeOfDay: "anytime", estimatedMinutes: 5, minimum: "4 glasses" },
        { name: "30-minute cardio or strength workout", category: "health", type: "check", timeOfDay: "morning", estimatedMinutes: 30, minimum: "15-minute brisk walk" },
        { name: "Eat 3 balanced whole-food meals", category: "diet", type: "numeric", target: 3, unit: "meals", timeOfDay: "anytime", estimatedMinutes: 45, minimum: "1 whole meal" },
        { name: "No sugary snacks or junk food", category: "diet", type: "check", timeOfDay: "anytime", estimatedMinutes: 0, minimum: "Swap sweet treat for fruit" },
      ],
    },
    {
      id: "mindfulness_peace",
      name: "Mindfulness & Stress Relief",
      tagline: "Cultivate inner calm, focus & emotional resilience",
      icon: "🧘",
      color: "#0984E3",
      tasks: [
        { name: "10-minute meditation or breathwork", category: "mind", type: "check", timeOfDay: "morning", estimatedMinutes: 10, minimum: "2-minute box breathing" },
        { name: "Midday fresh air walk & reset", category: "health", type: "check", timeOfDay: "afternoon", estimatedMinutes: 15, minimum: "Step outside for 5 mins" },
        { name: "Digital detox after 9:00 PM", category: "mind", type: "check", timeOfDay: "evening", estimatedMinutes: 0, minimum: "Silence non-urgent notifications" },
        { name: "Gratitude & daily reflection", category: "personal", type: "check", timeOfDay: "evening", estimatedMinutes: 10, minimum: "Write 1 thing you are grateful for" },
      ],
    },
    {
      id: "evening_winddown",
      name: "Evening Wind-Down & Sleep",
      tagline: "Unwind effectively for 7-8 hours of deep restorative sleep",
      icon: "🌙",
      color: "#E84393",
      tasks: [
        { name: "Screen curfew 30 mins before sleep", category: "mind", type: "check", timeOfDay: "evening", estimatedMinutes: 30, minimum: "Dim phone & switch to night mode" },
        { name: "Set out tomorrow's clothing & workspace", category: "personal", type: "check", timeOfDay: "evening", estimatedMinutes: 10, minimum: "Clear tomorrow's desk" },
        { name: "Read 10 pages of a good book", category: "mind", type: "check", timeOfDay: "evening", estimatedMinutes: 20, minimum: "Read 2 pages" },
        { name: "Sleep 7+ hours in dark cool room", category: "mind", type: "check", timeOfDay: "evening", estimatedMinutes: 480, minimum: "Be in bed on time" },
      ],
    },
    {
      id: "student_mastery",
      name: "Student & Study Mastery",
      tagline: "Optimize learning retention, exam prep & study blocks",
      icon: "🎓",
      color: "#6366F1",
      tasks: [
        {
          name: "2x 25-minute Pomodoro study sprints", category: "work", type: "check", timeOfDay: "afternoon", estimatedMinutes: 50, minimum: "1x 25-minute sprint",
          subtasks: [{ id: "st_pomo1", text: "Sprint 1: Core reading / problems" }, { id: "st_pomo2", text: "5-min rest & stretch" }, { id: "st_pomo3", text: "Sprint 2: Practice questions" }]
        },
        { name: "Read 15 pages of textbook or notes", category: "mind", type: "check", timeOfDay: "morning", estimatedMinutes: 30, minimum: "Review 5 pages" },
        { name: "Flashcards or active recall review", category: "personal", type: "check", timeOfDay: "evening", estimatedMinutes: 15, minimum: "Review 5 concepts" },
        { name: "Clean & organized study space", category: "personal", type: "check", timeOfDay: "evening", estimatedMinutes: 5, minimum: "Clear desk surface" },
      ],
    },
  ];

  /* ---------------------------------------------------------------------
   * Date helpers
   * ------------------------------------------------------------------- */
  const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
  const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  function pad2(n) { return String(n).padStart(2, "0"); }
  function dateKey(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
  function parseDateKey(key) { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); }
  function addDays(d, n) { const nd = new Date(d); nd.setDate(nd.getDate() + n); return nd; }
  function startOfWeek(d) { const wd = d.getDay(); const diff = wd === 0 ? -6 : 1 - wd; return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), diff); }
  function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function weekdayMon0(d) { const w = d.getDay(); return w === 0 ? 6 : w - 1; }

  function getWeekDates(offsetWeeks) {
    const base = addDays(startOfWeek(new Date()), offsetWeeks * 7);
    return Array.from({ length: 7 }, (_, i) => addDays(base, i));
  }

  function formatRange(dates) {
    const a = dates[0], b = dates[dates.length - 1];
    const sameMonth = a.getMonth() === b.getMonth();
    const left = `${MONTH_NAMES[a.getMonth()].slice(0, 3)} ${a.getDate()}`;
    const right = sameMonth ? `${b.getDate()}` : `${MONTH_NAMES[b.getMonth()].slice(0, 3)} ${b.getDate()}`;
    return `${left} – ${right}, ${b.getFullYear()}`;
  }

  /* ---------------------------------------------------------------------
   * Storage
   * ------------------------------------------------------------------- */
  const KEYS = { habits: "fl_habits", completions: "fl_completions", settings: "fl_settings", pro: "fl_pro_settings" };

  function storageGet(key, fallback) {
    // Fast path: synchronous localStorage cache gives 0ms response
    try {
      const cached = localStorage.getItem(key);
      if (cached !== null) {
        return Promise.resolve(JSON.parse(cached));
      }
    } catch (e) {}

    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([key], (res) => {
          const val = (res && res[key] !== undefined) ? res[key] : fallback;
          try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
          resolve(val);
        });
      } else {
        resolve(fallback);
      }
    });
  }

  function storageSet(key, value) {
    return new Promise((resolve) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {}
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [key]: value }, resolve);
      } else {
        resolve();
      }
    });
  }

  // Real-time synchronization across extension views/tabs
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[KEYS.pro]) {
        const newPro = changes[KEYS.pro].newValue;
        if (newPro && newPro.themeSettings && typeof FL.applyThemeEngine === "function") {
          FL.applyThemeEngine(newPro.themeSettings);
        }
      }
    });
  }

  const HABIT_NAME_MIGRATIONS = {
    h_focus: "Office task",
    h_inbox: "Personal growth task",
  };

  function createDefaultHabitsList() {
    return DEFAULT_HABITS.map((h, i) => ({
      ...h,
      id: h.id || `h_def_${i}_${Date.now()}`,
      createdAt: Date.now(),
    }));
  }

  async function loadDefaultHabits() {
    const list = createDefaultHabitsList();
    await storageSet(KEYS.habits, list);
    return list;
  }

  async function loadHabits() {
    const h = await storageGet(KEYS.habits, null);
    if (Array.isArray(h) && h.length > 0) {
      return h;
    }
    // Initialize with ready-made universal day-to-day tasks
    const initial = createDefaultHabitsList();
    await storageSet(KEYS.habits, initial);
    return initial;
  }
  function saveHabits(habits) { return storageSet(KEYS.habits, habits); }

  async function loadCompletions() { return await storageGet(KEYS.completions, {}); }
  function saveCompletions(completions) { return storageSet(KEYS.completions, completions); }

  async function loadSettings() {
    return await storageGet(KEYS.settings, {
      name: "", onboardingComplete: false, reminderStyle: "notification", weeklyReview: {},
    });
  }
  function saveSettings(settings) { return storageSet(KEYS.settings, settings); }

  /* ---------------------------------------------------------------------
   * Completion value helpers
   * completions = { "YYYY-MM-DD": { habitId: true|false|number } }
   * ------------------------------------------------------------------- */
  function getValue(completions, dateStr, habitId) {
    const day = completions[dateStr];
    if (!day) return undefined;
    return day[habitId];
  }
  function setValue(completions, dateStr, habitId, value) {
    if (!completions[dateStr]) completions[dateStr] = {};
    if (value === undefined || value === false || value === 0) {
      delete completions[dateStr][habitId];
      if (Object.keys(completions[dateStr]).length === 0) delete completions[dateStr];
    } else {
      completions[dateStr][habitId] = value;
    }
  }
  function isHabitSkipped(value) {
    return !!(value && typeof value === "object" && value.skipped === true);
  }
  function isMinimumDone(value) {
    return !!(value && typeof value === "object" && value.minimum === true);
  }
  function isHabitDone(habit, value) {
    if (value === undefined || isHabitSkipped(value)) return false;
    if (isMinimumDone(value)) return true;
    if (habit.type === "numeric") return Number(value) >= Number(habit.target || 1);
    return !!value;
  }
  function habitActiveOn(habit, d) {
    // habit counts on a day if it existed by then (createdAt <= end of day)
    if (!habit.createdAt) return true;
    const exists = habit.createdAt <= new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
    if (!exists) return false;
    // 0 = Sunday through 6 = Saturday. Missing schedules remain daily for
    // backwards compatibility with existing habits.
    return !Array.isArray(habit.days) || habit.days.length === 0 || habit.days.includes(d.getDay());
  }

  function dayScore(habits, completions, d) {
    const dateStr = dateKey(d);
    const active = habits.filter((h) => habitActiveOn(h, d) && !isHabitSkipped(getValue(completions, dateStr, h.id)));
    let done = 0;
    const byCategory = {};
    CATEGORY_ORDER.forEach((c) => (byCategory[c] = { done: 0, total: 0 }));
    active.forEach((h) => {
      const cat = byCategory[h.category] || (byCategory[h.category] = { done: 0, total: 0 });
      cat.total++;
      const v = getValue(completions, dateStr, h.id);
      if (isHabitDone(h, v)) { done++; cat.done++; }
    });
    const total = active.length;
    return { dateStr, done, total, pct: total ? Math.round((done / total) * 100) : 0, byCategory };
  }

  function habitStreak(habit, completions, upto) {
    let streak = 0;
    let cursor = upto ? new Date(upto) : new Date();
    while (true) {
      if (!habitActiveOn(habit, cursor)) { cursor = addDays(cursor, -1); continue; }
      const v = getValue(completions, dateKey(cursor), habit.id);
      if (isHabitSkipped(v)) { cursor = addDays(cursor, -1); continue; }
      if (isHabitDone(habit, v)) { streak++; cursor = addDays(cursor, -1); }
      else break;
    }
    return streak;
  }

  function longestStreakAcrossHabits(habits, completions) {
    let max = 0;
    habits.forEach((h) => { max = Math.max(max, habitStreak(h, completions)); });
    return max;
  }

  function weeklySummary(habits, completions, weekDates) {
    const days = weekDates.map((d) => dayScore(habits, completions, d));
    const totalDone = days.reduce((s, d) => s + d.done, 0);
    const totalPossible = days.reduce((s, d) => s + d.total, 0);
    const byCategory = {};
    CATEGORY_ORDER.forEach((c) => (byCategory[c] = { done: 0, total: 0 }));
    days.forEach((d) => {
      CATEGORY_ORDER.forEach((c) => {
        byCategory[c].done += d.byCategory[c].done;
        byCategory[c].total += d.byCategory[c].total;
      });
    });
    const perfectDays = days.filter((d) => d.total > 0 && d.done === d.total).length;
    return {
      days,
      totalDone,
      totalPossible,
      pct: totalPossible ? Math.round((totalDone / totalPossible) * 100) : 0,
      byCategory,
      perfectDays,
    };
  }


  function habitDayProgress(habit, completions, d) {
    const v = getValue(completions, dateKey(d), habit.id);
    if (habit.type === "numeric") {
      const target = Number(habit.target) || 1;
      return Math.min(100, Math.round(((Number(v) || 0) / target) * 100));
    }
    return isHabitDone(habit, v) ? 100 : 0;
  }


  const HABIT_STARTERS = [
    { key: "water", name: "Water intake", category: "health", type: "numeric", target: 8, unit: "glasses", reminders: ["10:00", "14:00"], minimum: "Drink one glass now" },
    { key: "move", name: "Move / exercise", category: "health", type: "check", reminders: ["07:30"], minimum: "Exercise for 5 min" },
    { key: "sleep", name: "Sleep 7+ hours", category: "mind", type: "check", reminders: ["22:00"] },
    { key: "journal", name: "Journal / reflect", category: "personal", type: "check", reminders: ["21:00"] },
    { key: "focus", name: "Deep work block", category: "work", type: "check", reminders: ["09:30"] },
    { key: "meals", name: "Balanced meals", category: "diet", type: "numeric", target: 3, unit: "meals" },
    { key: "read", name: "Read 10 pages", category: "mind", type: "check", minimum: "Read 2 pages" },
  ];

  function nextIncompleteHabit(habits, completions, d) {
    const dateStr = dateKey(d);
    return (habits || []).find((h) => {
      if (!habitActiveOn(h, d)) return false;
      const v = getValue(completions, dateStr, h.id);
      return !isHabitSkipped(v) && !isHabitDone(h, v);
    }) || null;
  }

  function habitMissStats(habit, completions, lookbackDays) {
    const days = lookbackDays || 28;
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const totals = [0, 0, 0, 0, 0, 0, 0];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = addDays(today, -i);
      if (!habitActiveOn(habit, d)) continue;
      const w = d.getDay();
      totals[w]++;
      const v = getValue(completions, dateKey(d), habit.id);
      if (!isHabitDone(habit, v) && !isHabitSkipped(v)) counts[w]++;
    }
    let worstDay = 0, worstRatio = -1;
    for (let w = 0; w < 7; w++) {
      if (!totals[w]) continue;
      const ratio = counts[w] / totals[w];
      if (ratio > worstRatio) { worstRatio = ratio; worstDay = w; }
    }
    return { missByWeekday: counts, totalByWeekday: totals, worstDay, worstRatio };
  }

  async function loadWeeklyReviews() { return await storageGet("fl_weekly_reviews", {}); }
  async function saveWeeklyReviews(data) { return await storageSet("fl_weekly_reviews", data); }

  function exportCSV(completions, habits) {
    const dates = Object.keys(completions || {}).sort();
    let csv = "Date,Habit ID,Habit Name,Category,Type,Status,Value\n";
    dates.forEach((dateStr) => {
      const dayData = completions[dateStr] || {};
      habits.forEach((h) => {
        const val = dayData[h.id];
        const done = isHabitDone(h, val);
        const displayVal = h.type === "numeric" ? (val || 0) : (done ? "1" : "0");
        csv += `"${dateStr}","${h.id}","${h.name.replace(/"/g, '""')}","${h.category}","${h.type}","${done ? "Completed" : "Pending"}","${displayVal}"\n`;
      });
    });
    return csv;
  }

  /* ---------------------------------------------------------------------
   * Day-to-Day Pro Feature Utilities: Quotes, iCal & Gratitude
   * ------------------------------------------------------------------- */
  const RITUAL_QUOTES = [
    { quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { quote: "Small disciplines repeated with consistency every day lead to great achievements.", author: "John C. Maxwell" },
    { quote: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
    { quote: "Mastering others is strength. Mastering yourself is true power.", author: "Lao Tzu" },
    { quote: "First make your habits, then your habits make you.", author: "John Dryden" },
    { quote: "We suffer more often in imagination than in reality.", author: "Seneca" },
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { quote: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius" },
    { quote: "Energy flows where attention goes.", author: "Tony Robbins" },
    { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { quote: "Discipline equals freedom.", author: "Jocko Willink" },
    { quote: "The future depends on what you do today.", author: "Mahatma Gandhi" },
    { quote: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
    { quote: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { quote: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
    { quote: "Quality is not an act, it is a habit.", author: "Will Durant" },
    { quote: "Great acts are made up of small deeds.", author: "Lao Tzu" },
    { quote: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { quote: "Be not afraid of going slowly, be afraid only of standing still.", author: "Chinese Proverb" },
    { quote: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
    { quote: "Everything is hard before it is easy.", author: "Goethe" },
    { quote: "Habit is the intersection of knowledge, skill, and desire.", author: "Stephen Covey" },
    { quote: "Do not wait; the time will never be 'just right.'", author: "Napoleon Hill" },
    { quote: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { quote: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { quote: "Focus is a muscle. The more you practice, the stronger it becomes.", author: "Robin Sharma" },
    { quote: "You will never change your life until you change something you do daily.", author: "Mike Murdock" },
    { quote: "Motivation gets you going, but discipline keeps you growing.", author: "John C. Maxwell" },
    { quote: "No citizen has a right to be an amateur in the matter of physical and mental training.", author: "Socrates" },
    { quote: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Bruce Lee" },
    { quote: "Your habits shape your identity, and your identity shapes your habits.", author: "James Clear" },
    { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { quote: "Don't count the days, make the days count.", author: "Muhammad Ali" },
    { quote: "Continuous effort—not strength or intelligence—is the key to unlocking our potential.", author: "Winston Churchill" },
    { quote: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
    { quote: "What we achieve inwardly will change outer reality.", author: "Plutarch" },
    { quote: "Success is nothing more than a few simple disciplines, practiced every day.", author: "Jim Rohn" },
    { quote: "Begin at once to live, and count each separate day as a separate life.", author: "Seneca" },
    { quote: "Consistency is the DNA of mastery.", author: "Robin Sharma" },
    { quote: "Every action you take is a vote for the person you wish to become.", author: "James Clear" },
    { quote: "When you have a dream, you've got to grab it and never let go.", author: "Carol Burnett" },
    { quote: "Self-control is strength. Right thought is mastery. Calmness is power.", author: "James Allen" },
    { quote: "Difficulties strengthen the mind, as labor does the body.", author: "Seneca" },
    { quote: "Do one thing every day that scares you.", author: "Eleanor Roosevelt" },
    { quote: "If you are going through hell, keep going.", author: "Winston Churchill" },
    { quote: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
    { quote: "Doubt kills more dreams than failure ever will.", author: "Suzy Kassem" },
    { quote: "The mind is everything. What you think you become.", author: "Buddha" },
    { quote: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  ];

  function getDailyQuote(customDate = new Date()) {
    const d = new Date(customDate);
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const index = Math.abs((dayOfYear * 13 + d.getFullYear()) % RITUAL_QUOTES.length);
    return RITUAL_QUOTES[index] || RITUAL_QUOTES[0];
  }

  function getRandomQuote() {
    const idx = Math.floor(Math.random() * RITUAL_QUOTES.length);
    return RITUAL_QUOTES[idx];
  }

  function generateICalFile(habits) {
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Cadence Habits//EN\n";
    habits.forEach((h) => {
      ics += "BEGIN:VEVENT\n";
      ics += `SUMMARY:Cadence Habit: ${h.name.replace(/,/g, "\\,")}\n`;
      ics += `DESCRIPTION:Category: ${h.category}. Daily routine tracked by Cadence.\n`;
      ics += "RRULE:FREQ=DAILY\n";
      ics += "END:VEVENT\n";
    });
    ics += "END:VCALENDAR";
    return ics;
  }

  async function loadGratitudeNotes() { return await storageGet("fl_gratitude_notes", {}); }
  async function saveGratitudeNotes(notes) { return await storageSet("fl_gratitude_notes", notes); }
  async function getHabits() { return await loadHabits(); }
  async function getCompletions() { return await loadCompletions(); }
  function todayKey() { return dateKey(new Date()); }

  async function setCompletion(dKey, habitId, value) {
    const completions = await loadCompletions();
    setValue(completions, dKey || todayKey(), habitId, value);
    await saveCompletions(completions);
    return completions;
  }

  async function setMinimumDone(dKey, habitId) {
    const completions = await loadCompletions();
    setValue(completions, dKey || todayKey(), habitId, { minimum: true, timestamp: Date.now() });
    await saveCompletions(completions);
    return completions;
  }

  function detectSlump(habits, completions, daysBack = 3) {
    if (!habits || !habits.length) return { inSlump: false, avgPct: 100, daysChecked: 0 };
    const today = new Date();
    let totalPct = 0;
    let daysChecked = 0;
    const lowDays = [];

    for (let i = 1; i <= daysBack; i++) {
      const pastDate = addDays(today, -i);
      const score = dayScore(habits, completions, pastDate);
      if (score.total > 0) {
        daysChecked++;
        totalPct += score.pct;
        if (score.pct < 50) lowDays.push({ date: dateKey(pastDate), pct: score.pct });
      }
    }

    const avgPct = daysChecked > 0 ? Math.round(totalPct / daysChecked) : 100;
    const inSlump = daysChecked >= 2 && avgPct < 45;
    return {
      inSlump,
      avgPct,
      daysChecked,
      lowDaysCount: lowDays.length,
      protocol: inSlump ? "minimum_viable_recovery" : "momentum_nominal"
    };
  }

  async function addHabit(habitData) {
    const habits = await loadHabits();
    const newHabit = {
      id: habitData.id || `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: habitData.name || "Untitled Habit",
      category: habitData.category || "personal",
      type: habitData.type || "check",
      target: habitData.target,
      unit: habitData.unit,
      days: habitData.days,
      reminders: habitData.reminders || [],
      notes: habitData.notes || "",
      minimum: habitData.minimum || "",
      createdAt: habitData.createdAt || Date.now(),
    };
    habits.push(newHabit);
    await saveHabits(habits);
    return habits;
  }

  async function deleteHabit(habitId) {
    const habits = await loadHabits();
    const filtered = habits.filter((h) => h.id !== habitId);
    await saveHabits(filtered);
    return filtered;
  }

  async function updateHabit(habitId, patch) {
    const habits = await loadHabits();
    const habit = habits.find((h) => h.id === habitId);
    if (habit) {
      Object.assign(habit, patch);
      await saveHabits(habits);
    }
    return habits;
  }

  async function addReadyMadePack(packId) {
    const pack = READY_MADE_TASK_PACKS.find((p) => p.id === packId);
    if (!pack) return await loadHabits();
    const existing = await loadHabits();
    const addedHabits = [];

    pack.tasks.forEach((t) => {
      const alreadyExists = existing.some((h) => h.name.toLowerCase() === t.name.toLowerCase());
      if (!alreadyExists) {
        const newHabit = {
          id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: t.name,
          category: t.category || "personal",
          type: t.type || "check",
          target: t.target,
          unit: t.unit,
          minimum: t.minimum || "",
          reminders: t.reminders || [],
          days: [0, 1, 2, 3, 4, 5, 6],
          createdAt: Date.now(),
        };
        existing.push(newHabit);
        addedHabits.push(newHabit);
      }
    });

    if (addedHabits.length > 0) {
      await saveHabits(existing);
    }
    return { allHabits: existing, addedCount: addedHabits.length, packName: pack.name };
  }

  /* ---------------------------------------------------------------------
   * Advanced Habit Telemetry & Sub-Tasks
   * ------------------------------------------------------------------- */
  function getCurrentTimeSlot(d = new Date()) {
    const hour = d.getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 22) return "evening";
    return "evening"; // late night defaults to evening wind-down
  }

  function getHabitsByTimeOfDay(habits, timeSlot) {
    if (!timeSlot || timeSlot === "all") return habits || [];
    return (habits || []).filter((h) => {
      const slot = h.timeOfDay || "anytime";
      return slot === timeSlot || slot === "anytime";
    });
  }

  function getSubtaskStatus(completions, dateStr, habitId, subtaskId) {
    const day = completions[dateStr];
    if (!day || !day._subtasks || !day._subtasks[habitId]) return false;
    return !!day._subtasks[habitId][subtaskId];
  }

  async function toggleSubtask(dateStr, habitId, subtaskId) {
    const completions = await loadCompletions();
    const dKey = dateStr || todayKey();
    if (!completions[dKey]) completions[dKey] = {};
    if (!completions[dKey]._subtasks) completions[dKey]._subtasks = {};
    if (!completions[dKey]._subtasks[habitId]) completions[dKey]._subtasks[habitId] = {};

    const current = !!completions[dKey]._subtasks[habitId][subtaskId];
    completions[dKey]._subtasks[habitId][subtaskId] = !current;

    // Check if all subtasks for habit are done
    const habits = await loadHabits();
    const habit = habits.find((h) => h.id === habitId);
    if (habit && Array.isArray(habit.subtasks) && habit.subtasks.length > 0) {
      const allDone = habit.subtasks.every((st) => completions[dKey]._subtasks[habitId][st.id]);
      if (allDone) {
        setValue(completions, dKey, habitId, habit.type === "numeric" ? (habit.target || 1) : true);
      }
    }

    await saveCompletions(completions);
    return completions;
  }

  /* ---------------------------------------------------------------------
   * Natural Language AI Custom Routine Generator
   * ------------------------------------------------------------------- */
  function generateCustomRoutineFromPrompt(prompt = "") {
    const p = prompt.toLowerCase();
    let name = "Custom Performance Routine";
    let icon = "⚡";
    let tasks = [];

    if (/code|developer|software|programming|engineer/i.test(p)) {
      name = "Software Engineer & Deep Focus Routine";
      icon = "💻";
      tasks = [
        { name: "Deep Code Sprint (90 mins)", category: "work", type: "check", timeOfDay: "morning", estimatedMinutes: 90, minimum: "25-min Pomodoro", subtasks: [{ id: "c1", text: "Lock in feature task" }, { id: "c2", text: "Zero tab distraction sprint" }, { id: "c3", text: "Push git commit" }] },
        { name: "Code Review & PR Triage", category: "work", type: "check", timeOfDay: "afternoon", estimatedMinutes: 30, minimum: "Review 1 PR" },
        { name: "Posture & Wrist Ergonomic Stretch", category: "health", type: "check", timeOfDay: "afternoon", estimatedMinutes: 5, minimum: "1-min stretch" },
        { name: "Tech System Design / Docs Reading", category: "personal", type: "check", timeOfDay: "evening", estimatedMinutes: 20, minimum: "Read 1 article" }
      ];
    } else if (/fat loss|weight loss|shred|lean/i.test(p)) {
      name = "Lean Physique & Fat Loss Protocol";
      icon = "🔥";
      tasks = [
        { name: "Fasted morning hydration (500ml)", category: "health", type: "numeric", target: 2, unit: "glasses", timeOfDay: "morning", estimatedMinutes: 2 },
        { name: "45-minute HIIT or Strength Training", category: "health", type: "check", timeOfDay: "morning", estimatedMinutes: 45, minimum: "15-min walk" },
        { name: "Strict Caloric Deficit & High Protein", category: "diet", type: "numeric", target: 3, unit: "meals", timeOfDay: "anytime", estimatedMinutes: 40 },
        { name: "10,000 Daily Step Count", category: "health", type: "numeric", target: 10000, unit: "steps", timeOfDay: "evening", estimatedMinutes: 60 }
      ];
    } else if (/student|exam|study|college|school|academic/i.test(p)) {
      name = "Academic & Exam Mastery Protocol";
      icon = "🎓";
      tasks = [
        { name: "Active Recall & Flashcard Sprint", category: "work", type: "check", timeOfDay: "morning", estimatedMinutes: 30, minimum: "10 cards" },
        { name: "2x 50-minute Pomodoro Study Block", category: "work", type: "check", timeOfDay: "afternoon", estimatedMinutes: 100, minimum: "25-min sprint" },
        { name: "Summarize today's lecture notes", category: "personal", type: "check", timeOfDay: "evening", estimatedMinutes: 20, minimum: "1-page summary" },
        { name: "8 Hours Sleep for Memory Consolidation", category: "mind", type: "check", timeOfDay: "evening", estimatedMinutes: 480, minimum: "Be in bed by 11 PM" }
      ];
    } else if (/mindful|stress|calm|zen|peace|anxiety/i.test(p)) {
      name = "Inner Peace & Stress Resilience Protocol";
      icon = "🧘";
      tasks = [
        { name: "15-minute Morning Vipassana Meditation", category: "mind", type: "check", timeOfDay: "morning", estimatedMinutes: 15, minimum: "3-minute breathwork" },
        { name: "Nature walk without smartphone", category: "health", type: "check", timeOfDay: "afternoon", estimatedMinutes: 20, minimum: "5-min balcony reset" },
        { name: "Digital detox & phone switch-off at 9 PM", category: "mind", type: "check", timeOfDay: "evening", estimatedMinutes: 0, minimum: "Put phone on airplane mode" },
        { name: "Evening Gratitude & Stoic Journal", category: "personal", type: "check", timeOfDay: "evening", estimatedMinutes: 10, minimum: "3 gratitude points" }
      ];
    } else {
      name = "High-Leverage Daily Mastery Pack";
      icon = "⚡";
      tasks = [
        { name: "Top 1 Non-Negotiable Priority Sprint", category: "work", type: "check", timeOfDay: "morning", estimatedMinutes: 60, minimum: "20-min start" },
        { name: "Hydrate 8 glasses of pure water", category: "health", type: "numeric", target: 8, unit: "glasses", timeOfDay: "anytime", estimatedMinutes: 5 },
        { name: "30-minute Movement or Cardio", category: "health", type: "check", timeOfDay: "morning", estimatedMinutes: 30, minimum: "10-min walk" },
        { name: "Daily Reflection & Tomorrow's Agenda", category: "work", type: "check", timeOfDay: "evening", estimatedMinutes: 15, minimum: "Write top priority" }
      ];
    }

    return { name, icon, tasks };
  }

  async function applyCustomRoutinePrompt(prompt) {
    const routine = generateCustomRoutineFromPrompt(prompt);
    const existing = await loadHabits();
    const added = [];

    routine.tasks.forEach((t) => {
      const alreadyExists = existing.some((h) => h.name.toLowerCase() === t.name.toLowerCase());
      if (!alreadyExists) {
        const newHabit = {
          id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: t.name,
          category: t.category || "personal",
          type: t.type || "check",
          target: t.target,
          unit: t.unit,
          timeOfDay: t.timeOfDay || "anytime",
          estimatedMinutes: t.estimatedMinutes || 15,
          minimum: t.minimum || "",
          subtasks: t.subtasks || [],
          days: [0, 1, 2, 3, 4, 5, 6],
          createdAt: Date.now(),
        };
        existing.push(newHabit);
        added.push(newHabit);
      }
    });

    if (added.length > 0) {
      await saveHabits(existing);
    }
    return { routineName: routine.name, icon: routine.icon, addedCount: added.length, allHabits: existing, tasks: routine.tasks };
  }

  const DEFAULT_BLOCKLIST = ["twitter.com", "x.com", "instagram.com", "reddit.com", "tiktok.com", "facebook.com", "youtube.com"];

  const EXPORTS = {
    KEYS, CATEGORIES, CATEGORY_ORDER, DEFAULT_HABITS, HABIT_STARTERS, READY_MADE_TASK_PACKS,
    DAY_LETTERS, DAY_NAMES, MONTH_NAMES,
    dateKey, parseDateKey, addDays, startOfWeek, isSameDay, daysInMonth, weekdayMon0,
    getWeekDates, formatRange,
    storageGet, storageSet,
    loadHabits, saveHabits, loadCompletions, saveCompletions, loadSettings, saveSettings,
    getValue, setValue, isHabitDone, isHabitSkipped, isMinimumDone, habitActiveOn,
    dayScore, habitStreak, longestStreakAcrossHabits, weeklySummary, habitDayProgress,
    nextIncompleteHabit, habitMissStats, loadWeeklyReviews, saveWeeklyReviews,
    exportCSV, RITUAL_QUOTES, getDailyQuote, getRandomQuote, generateICalFile,
    loadGratitudeNotes, saveGratitudeNotes, getHabits, getCompletions, todayKey,
    setCompletion, setMinimumDone, detectSlump, addHabit, deleteHabit, updateHabit, addReadyMadePack, loadDefaultHabits,
    createDefaultHabitsList, getCurrentTimeSlot, getHabitsByTimeOfDay, getSubtaskStatus,
    toggleSubtask, generateCustomRoutineFromPrompt, applyCustomRoutinePrompt, DEFAULT_BLOCKLIST
  };

  Object.assign(FL, EXPORTS);
})(typeof window !== "undefined" ? window : globalThis);

