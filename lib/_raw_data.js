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
    { id: "h_focus",   name: "Office task",                       category: "work",     type: "check",   createdAt: Date.now() },
    { id: "h_inbox",   name: "Personal growth task",              category: "work",     type: "check",   createdAt: Date.now() },
    { id: "h_water",   name: "Water intake",                      category: "health",   type: "numeric", target: 8, unit: "glasses", createdAt: Date.now() },
    { id: "h_move",    name: "Move / exercise",                   category: "health",   type: "check",   createdAt: Date.now() },
    { id: "h_clean",   name: "Clean living (No alcohol & smoke)", category: "health",   type: "check",   createdAt: Date.now() },
    { id: "h_screen",  name: "Mindful screen time (<2h)",         category: "health",   type: "check",   createdAt: Date.now() },
    { id: "h_social",  name: "Social media detox",                category: "mind",     type: "check",   createdAt: Date.now() },
    { id: "h_meals",   name: "Balanced meals",                    category: "diet",     type: "numeric", target: 3, unit: "meals", createdAt: Date.now() },
    { id: "h_sugar",   name: "No sugary snacks",                  category: "diet",     type: "check",   createdAt: Date.now() },
    { id: "h_sleep",   name: "Sleep 7+ hours",                    category: "mind",     type: "check",   createdAt: Date.now() },
    { id: "h_journal", name: "Journal / reflect",                 category: "personal", type: "check",   createdAt: Date.now() },
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
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([key], (res) => resolve(res && res[key] !== undefined ? res[key] : fallback));
      } else {
        try {
          const item = localStorage.getItem(key);
          resolve(item !== null ? JSON.parse(item) : fallback);
        } catch (e) {
          resolve(fallback);
        }
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
        if (newPro && newPro.themeSettings && typeof applyThemeEngine === "function") {
          applyThemeEngine(newPro.themeSettings);
        }
      }
    });
  }

  const HABIT_NAME_MIGRATIONS = {
    h_focus: "Office task",
    h_inbox: "Personal growth task",
  };

  async function loadHabits() {
    const h = await storageGet(KEYS.habits, null);
    if (h && h.length) {
      let changed = false;
      h.forEach((habit) => {
        const nextName = HABIT_NAME_MIGRATIONS[habit.id];
        if (nextName && habit.name !== nextName) {
          habit.name = nextName;
          changed = true;
        }
      });
      if (changed) await storageSet(KEYS.habits, h);
      return h;
    }
    // Start new people with an intentionally blank, guided workspace. Existing
    // installs retain their data above; we no longer add a large preset list.
    await storageSet(KEYS.habits, []);
    return [];
  }
  function saveHabits(habits) { return storageSet(KEYS.habits, habits); }

  async function loadCompletions() { return await storageGet(KEYS.completions, {}); }
  function saveCompletions(completions) { return storageSet(KEYS.completions, completions); }

  async function loadSettings() { return await storageGet(KEYS.settings, { name: "", onboardingComplete: false }); }
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
  function isHabitDone(habit, value) {
    if (value === undefined) return false;
    if (habit.type === "numeric") return Number(value) >= Number(habit.target || 1);
    return !!value;
  }
  function isHabitSkipped(value) {
    return !!(value && typeof value === "object" && value.skipped === true);
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

  async function addHabit(habitData) {
    const habits = await loadHabits();
    const newHabit = {
      id: habitData.id || `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: habitData.name || "Untitled Habit",
      category: habitData.category || "personal",
      type: habitData.type || "check",
      target: habitData.target,
      unit: habitData.unit,
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

  const DEFAULT_BLOCKLIST = ["twitter.com", "x.com", "instagram.com", "reddit.com", "tiktok.com", "facebook.com", "youtube.com"];
