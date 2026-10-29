/* ==========================================================================
   Cadence — Background Service Worker
   - Smart Habit Reminders & Notifications
   - Chrome Omnibox Quick Commands (`cd done`, `cd add`, `cd sprint`, etc.)
   - Focus Guard Website Blocker during Active Deep Work Sprints
   - Google Suggestions Proxy for Omnibox Autocomplete
   ========================================================================== */

chrome.runtime.onInstalled.addListener(() => {
  refreshReminders();
  setupOmniboxDefault();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.fl_habits || changes.fl_settings)) refreshReminders();
});

/* --------------------------------------------------------------------------
   1. HABIT REMINDERS & ALARMS
   -------------------------------------------------------------------------- */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.indexOf("cadence_habit_") === 0) {
    const parts = alarm.name.split("_");
    const habitId = parts[2];
    const stored = await chrome.storage.local.get(["fl_habits", "fl_settings"]);
    const habits = stored.fl_habits || [];
    const settings = stored.fl_settings || {};
    if (settings.reminderStyle === "off") return;
    const habit = habits.find((h) => h.id === habitId);
    const title = habit ? habit.name : "Cadence";
    const message = habit && habit.minimum
      ? `${habit.name} — or at least: ${habit.minimum}`
      : "Time for today’s habit.";
    if (settings.reminderStyle === "badge") {
      chrome.action.setBadgeText({ text: "1" });
      chrome.action.setBadgeBackgroundColor({ color: "#6C5CE7" });
      return;
    }
    chrome.notifications.create(alarm.name + "_" + Date.now(), {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title,
      message,
      priority: 1,
    });
    return;
  }

  // 1b. Note Reminders
  if (alarm.name.indexOf("cadence_note_rem_") === 0) {
    const remId = alarm.name.replace("cadence_note_rem_", "");
    const stored = await chrome.storage.local.get(["fl_note_reminders"]);
    const reminders = stored.fl_note_reminders || [];
    const item = reminders.find((r) => r.id === remId);
    const noteText = item && item.text ? item.text : "You have a scheduled note reminder.";
    
    chrome.notifications.create("cadence_note_notif_" + Date.now(), {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Cadence Note Reminder 📝",
      message: noteText,
      priority: 2,
      requireInteraction: true
    });

    // Remove or archive triggered reminder from active list
    const remaining = reminders.filter((r) => r.id !== remId);
    await chrome.storage.local.set({ fl_note_reminders: remaining });
    return;
  }
});

// Focus or open newtab when notification is clicked
if (chrome.notifications && chrome.notifications.onClicked) {
  chrome.notifications.onClicked.addListener((notifId) => {
    if (notifId && (notifId.startsWith("cadence_note_notif_") || notifId.startsWith("cadence_habit_"))) {
      if (chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: chrome.runtime.getURL("newtab.html") });
      }
    }
  });
}

async function refreshReminders() {
  const stored = await chrome.storage.local.get(["fl_habits", "fl_settings"]);
  const habits = stored.fl_habits || [];
  const style = (stored.fl_settings && stored.fl_settings.reminderStyle) || "notification";
  const existing = await chrome.alarms.getAll();
  await Promise.all(
    (existing || [])
      .filter((a) => a.name && a.name.indexOf("cadence_habit_") === 0)
      .map((a) => chrome.alarms.clear(a.name))
  );
  if (style === "off" || style === "badge") return;
  habits.forEach((habit) => {
    (habit.reminders || []).forEach((hm, idx) => {
      const parts = String(hm).split(":");
      const hour = Number(parts[0]);
      const minute = Number(parts[1] || 0);
      if (!Number.isFinite(hour)) return;
      const now = new Date();
      const when = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
      if (when.getTime() <= now.getTime()) when.setDate(when.getDate() + 1);
      chrome.alarms.create(`cadence_habit_${habit.id}_${idx}`, {
        when: when.getTime(),
        periodInMinutes: 24 * 60,
      });
    });
  });
}

/* --------------------------------------------------------------------------
   2. FOCUS GUARD WEBSITE BLOCKER
   Shields distracting sites during active deep work sprints.
   -------------------------------------------------------------------------- */
const DEFAULT_DISTRACTING_DOMAINS = [
  "youtube.com",
  "www.youtube.com",
  "twitter.com",
  "x.com",
  "reddit.com",
  "www.reddit.com",
  "instagram.com",
  "www.instagram.com",
  "facebook.com",
  "www.facebook.com",
  "tiktok.com",
  "www.tiktok.com",
  "netflix.com",
  "www.netflix.com",
  "twitch.tv",
  "www.twitch.tv",
  "pinterest.com",
  "news.ycombinator.com"
];

function isUrlDistracting(urlStr, customBlocked = []) {
  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();
    const allBlocked = [...DEFAULT_DISTRACTING_DOMAINS, ...customBlocked.map(s => s.toLowerCase().trim()).filter(Boolean)];
    return allBlocked.some(domain => host === domain || host.endsWith("." + domain));
  } catch (e) {
    return false;
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only check when URL is loaded or changing
  if (!changeInfo.url && !tab.url) return;
  const targetUrl = changeInfo.url || tab.url;
  if (!targetUrl || targetUrl.startsWith("chrome://") || targetUrl.startsWith("chrome-extension://")) return;

  try {
    const stored = await chrome.storage.local.get(["fl_pro_settings", "fl_settings", "fl_exemptions"]);
    const pro = stored.fl_pro_settings || {};
    const session = pro.focusSession || {};

    if (!session.running) return;

    // Check if session has timed out
    const elapsed = session.startedAt ? Math.floor((Date.now() - session.startedAt) / 1000) : 0;
    const remaining = (session.remainingSeconds || 1500) - elapsed;
    if (remaining <= 0) return;

    const customBlocked = (stored.fl_settings && stored.fl_settings.blockedSites) || [];
    if (isUrlDistracting(targetUrl, customBlocked)) {
      // Check emergency exemption
      const exemptions = stored.fl_exemptions || {};
      const host = new URL(targetUrl).hostname.toLowerCase();
      if (exemptions[host] && exemptions[host] > Date.now()) {
        return; // Exemption currently active
      }

      // Redirect to Focus Shield
      const blockedPageUrl = chrome.runtime.getURL("blocked.html?url=" + encodeURIComponent(targetUrl));
      chrome.tabs.update(tabId, { url: blockedPageUrl });
    }
  } catch (err) {
    console.warn("Focus guard error:", err);
  }
});

/* --------------------------------------------------------------------------
   3. CHROME OMNIBOX QUICK COMMANDS (`cd`)
   -------------------------------------------------------------------------- */
function setupOmniboxDefault() {
  if (chrome.omnibox && chrome.omnibox.setDefaultSuggestion) {
    chrome.omnibox.setDefaultSuggestion({
      description: "Cadence: <match>done [habit]</match> · <match>add [habit]</match> · <match>sprint [min]</match> · <match>briefing</match>"
    });
  }
}

if (chrome.omnibox) {
  chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
    const q = (text || "").trim().toLowerCase();
    const stored = await chrome.storage.local.get(["fl_habits", "fl_completions"]);
    const habits = stored.fl_habits || [];
    const today = new Date().toISOString().slice(0, 10);
    const todayCompletions = (stored.fl_completions && stored.fl_completions[today]) || {};

    const suggestions = [];

    if (!q) {
      suggestions.push(
        { content: "briefing", description: "Cadence: <match>briefing</match> — View today's score & streak summary" },
        { content: "sprint 25", description: "Cadence: <match>sprint 25</match> — Launch 25-minute Deep Work sprint" },
        { content: "sound rain", description: "Cadence: <match>sound rain</match> — Play ambient rain soundscape" }
      );
    } else if (q.startsWith("done ") || q.startsWith("check ")) {
      const habitQuery = q.replace(/^(done|check)\s+/, "");
      habits.forEach(h => {
        if (!habitQuery || h.name.toLowerCase().includes(habitQuery)) {
          const isDone = !!todayCompletions[h.id];
          suggestions.push({
            content: `done ${h.name}`,
            description: `Cadence: Mark <match>${h.name}</match> as completed ${isDone ? "(already completed today)" : "⚡"}`
          });
        }
      });
    } else if (q.startsWith("add ")) {
      suggestions.push({
        content: q,
        description: `Cadence: Create new habit <match>"${q.replace(/^add\s+/, "")}"</match>`
      });
    } else if (q.startsWith("sprint") || q.startsWith("focus")) {
      suggestions.push(
        { content: "sprint 25", description: "Cadence: Start <match>25-minute</match> Pomodoro focus sprint" },
        { content: "sprint 50", description: "Cadence: Start <match>50-minute</match> Deep Work focus sprint" },
        { content: "sprint pause", description: "Cadence: <match>Pause</match> active focus sprint" }
      );
    } else if (q.startsWith("sound")) {
      suggestions.push(
        { content: "sound rain", description: "Cadence: Play <match>Rain</match> soundscape" },
        { content: "sound zen", description: "Cadence: Play <match>Zen Bowls (432Hz)</match>" },
        { content: "sound cosmic", description: "Cadence: Play <match>Cosmic Drift</match>" },
        { content: "sound stop", description: "Cadence: <match>Stop</match> ambient audio" }
      );
    } else {
      // General fuzzy match
      const matchingHabits = habits.filter(h => h.name.toLowerCase().includes(q));
      matchingHabits.forEach(h => {
        suggestions.push({
          content: `done ${h.name}`,
          description: `Cadence: Complete habit <match>${h.name}</match>`
        });
      });
      suggestions.push(
        { content: `add ${q}`, description: `Cadence: Add new habit <match>"${q}"</match>` },
        { content: "briefing", description: "Cadence: View daily performance briefing" }
      );
    }

    suggest(suggestions.slice(0, 5));
  });

  chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
    const raw = (text || "").trim();
    const q = raw.toLowerCase();

    const stored = await chrome.storage.local.get(["fl_habits", "fl_completions", "fl_pro_settings", "fl_settings", "cadence_saas_entitlement"]);
    const habits = stored.fl_habits || [];
    const completions = stored.fl_completions || {};
    const pro = stored.fl_pro_settings || {};
    const entitlement = stored.cadence_saas_entitlement || {};
    const isEntitled = Boolean(pro.isPro || entitlement.entitled === true);

    if (!isEntitled) {
      chrome.notifications.create("cd_sub_req_" + Date.now(), {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Cadence Pro Subscription Required",
        message: "Subscribe to Cadence Pro (₹69/mo or ₹799/yr) to unlock commands & focus features.",
        priority: 2
      });
      chrome.tabs.create({ url: chrome.runtime.getURL("newtab.html") });
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    if (!completions[today]) completions[today] = {};

    let notifyTitle = "Cadence";
    let notifyMessage = "";

    // 1. Mark Done, Increment, or Micro-Habit
    if (q.startsWith("done ") || q.startsWith("check ") || q.startsWith("mini ")) {
      const isMini = q.startsWith("mini ");
      const habitQuery = raw.replace(/^(done|check|mini)\s+/i, "").trim().toLowerCase();
      const numMatch = habitQuery.match(/\s+(\d+)$/);
      let targetHabitName = habitQuery;
      let count = null;
      if (numMatch) {
        count = parseInt(numMatch[1], 10);
        targetHabitName = habitQuery.replace(/\s+\d+$/, "").trim();
      }

      const matched = habits.find(h => h.name.toLowerCase().includes(targetHabitName));
      if (matched) {
        if (isMini) {
          completions[today][matched.id] = { minimum: true, timestamp: Date.now() };
          notifyTitle = "2-Min Micro-Habit Executed! 🛡️";
          notifyMessage = `Logged minimum for "${matched.name}". Streak preserved!`;
        } else if (matched.type === "numeric") {
          const currentVal = typeof completions[today][matched.id] === "number" ? completions[today][matched.id] : 0;
          const newVal = count !== null ? count : (currentVal + 1);
          completions[today][matched.id] = newVal;
          notifyTitle = "Target Logged! ⚡";
          notifyMessage = `Updated "${matched.name}" to ${newVal}/${matched.target || 1} ${matched.unit || ""}.`;
        } else {
          completions[today][matched.id] = true;
          notifyTitle = "Target Executed! ⚡";
          notifyMessage = `Marked "${matched.name}" as completed for today. Forward momentum maintained!`;
        }
        await chrome.storage.local.set({ fl_completions: completions });
      } else {
        notifyTitle = "Habit Not Found";
        notifyMessage = `Could not find habit matching "${targetHabitName}".`;
      }
    }
    // 1b. Top Priority Target Check
    else if (q === "top" || q === "next") {
      const pending = habits.filter(h => !completions[today] || !completions[today][h.id]);
      if (pending.length) {
        notifyTitle = "Next Focus Target ⚡";
        notifyMessage = `Top Priority: "${pending[0].name}" (${pending[0].category || "personal"}). Time to execute!`;
      } else {
        notifyTitle = "All Habits Conquered! 🏆";
        notifyMessage = "100% completed today. Relentless execution beats passive intention!";
      }
    }
    // 2. Add Habit
    else if (q.startsWith("add ")) {
      const newName = raw.replace(/^add\s+/i, "").trim();
      if (newName) {
        const newHabit = {
          id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: newName.charAt(0).toUpperCase() + newName.slice(1),
          category: "personal",
          type: "check",
          createdAt: Date.now()
        };
        habits.push(newHabit);
        await chrome.storage.local.set({ fl_habits: habits });
        notifyTitle = "Habit Created! 🎯";
        notifyMessage = `Added "${newHabit.name}" to your daily tracker.`;
      }
    }
    // 3. Start or Pause Sprint
    else if (q.startsWith("sprint") || q.startsWith("focus")) {
      const numMatch = q.match(/(\d+)/);
      const mins = numMatch ? parseInt(numMatch[1], 10) : 25;
      if (q.includes("pause") || q.includes("stop")) {
        if (!pro.focusSession) pro.focusSession = {};
        pro.focusSession.running = false;
        await chrome.storage.local.set({ fl_pro_settings: pro });
        notifyTitle = "Focus Sprint Paused";
        notifyMessage = "Your active sprint is paused. Re-enter 'cd sprint' to resume.";
      } else {
        pro.focusSession = {
          duration: mins,
          remainingSeconds: mins * 60,
          running: true,
          startedAt: Date.now(),
          intention: "Omnibox Focus Sprint"
        };
        await chrome.storage.local.set({ fl_pro_settings: pro });
        notifyTitle = `⚡ ${mins}m Deep Work Sprint Activated`;
        notifyMessage = `Focus Guard is guarding your session. Let's conquer this block!`;
      }
    }
    // 4. Daily Briefing
    else if (q.includes("briefing") || q.includes("status")) {
      const doneCount = habits.filter(h => completions[today] && completions[today][h.id]).length;
      const total = habits.length || 1;
      const pct = Math.round((doneCount / total) * 100);
      notifyTitle = `Cadence Briefing · ${pct}% Today`;
      notifyMessage = `${doneCount} of ${habits.length} habits completed today. Keep the streak alive! 🛡️`;
    }
    // 4b. Ambient Soundscapes Control
    else if (q.startsWith("sound") || q.startsWith("audio") || q.startsWith("play ")) {
      if (q.includes("stop") || q.includes("mute") || q.includes("pause") || q.includes("off")) {
        await chrome.storage.local.set({ fl_active_soundscape: { track: "none", playing: false, timestamp: Date.now() } });
        notifyTitle = "Ambient Soundscape Stopped 🔇";
        notifyMessage = "Audio playback has been stopped.";
      } else {
        let soundTrack = "rain";
        let trackName = "Rain";
        if (q.includes("zen") || q.includes("bowl")) { soundTrack = "zen"; trackName = "Zen Bowls (432Hz)"; }
        else if (q.includes("cosmic") || q.includes("space")) { soundTrack = "cosmic"; trackName = "Cosmic Drift"; }
        else if (q.includes("cyber") || q.includes("synth")) { soundTrack = "cyber"; trackName = "Cyberpunk Synth"; }
        else if (q.includes("forest") || q.includes("pine")) { soundTrack = "forest"; trackName = "Pine Forest"; }
        else if (q.includes("ocean") || q.includes("wave")) { soundTrack = "waves"; trackName = "Ocean Waves"; }
        else if (q.includes("gamma") || q.includes("40hz")) { soundTrack = "gamma"; trackName = "40Hz Gamma Focus"; }
        else if (q.includes("alpha") || q.includes("10hz")) { soundTrack = "alpha"; trackName = "10Hz Alpha Calm"; }

        await chrome.storage.local.set({
          fl_active_soundscape: { track: soundTrack, playing: true, timestamp: Date.now() }
        });
        notifyTitle = `🎵 Soundscape Playing: ${trackName}`;
        notifyMessage = "Immersion locked. Ambient acoustic flow engaged.";
      }
    }
    // 5. Default Open
    else {
      chrome.tabs.create({ url: chrome.runtime.getURL("newtab.html") });
      return;
    }

    // Deliver confirmation notification
    chrome.notifications.create("cd_omni_" + Date.now(), {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: notifyTitle,
      message: notifyMessage,
      priority: 2
    });
  });
}

}
