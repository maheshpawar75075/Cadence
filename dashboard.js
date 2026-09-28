const FL = window.FL || {};
const {
  CATEGORIES, CATEGORY_ORDER, DAY_NAMES, MONTH_NAMES,
  dateKey, addDays, isSameDay, daysInMonth,
  getWeekDates, formatRange,
  loadHabits, saveHabits, loadCompletions, saveCompletions, loadSettings, saveSettings,
  loadProSettings, saveProSettings, WALLPAPERS, THEME_PALETTES, PRO_COMPANIONS, DEFAULT_THEME_SETTINGS,
  applyThemeEngine, playAmbientSoundscape, stopAmbientSoundscape, setAmbientVolume, initParticleEngine,
  getValue, setValue, isHabitDone, isHabitSkipped, habitActiveOn,
  dayScore, habitStreak, longestStreakAcrossHabits, weeklySummary, habitDayProgress,
  charts, esc, mascot, exportCSV, generateICalFile,
} = FL;

const el = (id) => document.getElementById(id);
const today = new Date();

function celebrateHabitComplete(habit, wasDone) {
  const dateStr = dateKey(today);
  const nowDone = isHabitDone(habit, getValue(state.completions, dateStr, habit.id));
  if (!wasDone && nowDone) cheerForProgress();
}

function cheerForProgress() {
  const score = dayScore(state.habits, state.completions, today);
  mascot.cheer(score.total > 0 && score.pct === 100 ? { epic: true } : undefined);
}

let state = {
  habits: [],
  completions: {},
  settings: {},
  proSettings: null,
  activeSoundscape: null,
  soundVolume: 0.5,
  section: "overview",
  heatMonth: today.getMonth(),
  heatYear: today.getFullYear(),
  reportWeekOffset: 0,
  editingHabitId: null,
  modalCategory: "work",
  modalType: "check",
  modalDays: [0, 1, 2, 3, 4, 5, 6],
  activeWpCategory: "all",
  dashTimeFilter: "all",
};
let focusTimerId = null;

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */
function switchSection(section) {
  state.section = section;
  document.querySelectorAll(".nav-item").forEach((btn) => btn.classList.toggle("active", btn.dataset.section === section));
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  el(`view-${section}`).classList.add("active");
  const titles = { overview: "Overview", habits: "Manage Habits", pro: "Pro Plan Suite", reports: "Weekly Reports", settings: "Settings" };
  el("sectionTitle").textContent = titles[section] || "Overview";
  if (section === "overview") renderOverview();
  if (section === "habits") renderHabitsManage();
  if (section === "pro") renderProSuite();
  if (section === "reports") renderReport();
}

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => switchSection(btn.dataset.section));
});

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */
function renderOverview() {
  const score = dayScore(state.habits, state.completions, today);
  el("statToday").textContent = `${score.pct}%`;
  el("statTodaySub").textContent = `${score.done} of ${score.total} done`;

  const weekDates = getWeekDates(0);
  const weekSum = weeklySummary(state.habits, state.completions, weekDates);
  el("statWeek").textContent = `${weekSum.pct}%`;
  el("statWeekSub").textContent = `${weekSum.totalDone} of ${weekSum.totalPossible} this week`;

  el("statStreak").textContent = longestStreakAcrossHabits(state.habits, state.completions);
  el("statPerfect").textContent = `${weekSum.perfectDays}/7`;
  el("sideStreak").textContent = longestStreakAcrossHabits(state.habits, state.completions);

  el("greeting").textContent = state.settings.name ? `Welcome back, ${state.settings.name}` : "Welcome back";

  if (mascot && mascot.updateProgress) {
    mascot.updateProgress(state.completions, state.habits);
  }

  renderAIInsights();
  renderProgressHub(score, weekDates, weekSum);
  renderWeekChart(weekDates, weekSum);
  renderDonut(weekSum);
  renderTrend();
  renderHeatmap();
  renderInsight(weekSum);
  renderHabitTable(score);
}

function renderAIInsights() {
  const container = el("aiInsightsContainer");
  const FLObj = window.FL || FL;
  if (!container || !FLObj || !FLObj.generateAIInsights) return;
  const insights = FLObj.generateAIInsights(state.completions, state.habits);

  container.innerHTML = insights.map((ins) => `
    <div style="display:flex; align-items:center; gap:10px; padding:10px 14px; background:rgba(108,92,231,0.06); border:1px solid rgba(108,92,231,0.15); border-radius:12px; font-size:12px; color:var(--ink);">
      <span style="font-size:16px; flex-shrink:0;">${ins.icon}</span>
      <span style="line-height:1.4; font-weight:500;">${ins.text}</span>
    </div>
  `).join("");
}

function categoryBarItems(byCategory) {
  return CATEGORY_ORDER.map((c) => {
    const cat = byCategory[c];
    if (!cat || cat.total <= 0) return null;
    return {
      label: CATEGORIES[c].name,
      icon: CATEGORIES[c].icon,
      color: CATEGORIES[c].color,
      colorLight: CATEGORIES[c].soft,
      done: cat.done,
      total: cat.total,
      pct: Math.round((cat.done / cat.total) * 100),
    };
  }).filter(Boolean);
}

function renderProgressHub(todayScore, weekDates, weekSum) {
  el("dailyProgressSub").textContent = `${todayScore.done} of ${todayScore.total} habits done today`;
  el("weeklyProgressSub").textContent = `${weekSum.totalDone} of ${weekSum.totalPossible} habits this week · ${weekSum.perfectDays} perfect days`;

  el("dailyGauge").innerHTML = charts.radialGauge(todayScore.pct, {
    size: 108, label: "today", color1: "#6C5CE7", color2: "#8E7CF6",
  });
  el("weeklyGauge").innerHTML = charts.radialGauge(weekSum.pct, {
    size: 108, label: "week avg", color1: "#00B894", color2: "#55D6B0", glow: "#00B894",
  });

  el("dailyCategoryBars").innerHTML = charts.categoryBars(categoryBarItems(todayScore.byCategory));
  el("weeklyCategoryBars").innerHTML = charts.categoryBars(categoryBarItems(weekSum.byCategory));

  const dayData = weekSum.days.map((d, i) => ({
    label: DAY_NAMES[i].slice(0, 3),
    pct: d.pct,
    byCategory: d.byCategory,
    isToday: isSameDay(weekDates[i], today),
  }));
  el("weeklyMiniChart").innerHTML = charts.weekMiniChart(dayData, { width: 340, height: 110, uidSeed: 3 });

  const dateStr = dateKey(today);
  const habitBars = el("dailyHabitBars");
  if (state.habits.length === 0) {
    habitBars.innerHTML = `<div class="fl-cat-empty">Add habits to track daily progress.</div>`;
    return;
  }
  const sorted = state.habits.filter((h) => habitActiveOn(h, today)).sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
  habitBars.innerHTML = sorted.length ? sorted.map((h) => {
    const cat = CATEGORIES[h.category] || CATEGORIES.personal;
    const pct = habitDayProgress(h, state.completions, today);
    const v = getValue(state.completions, dateStr, h.id);
    const sub = h.type === "numeric" ? `${Number(v) || 0}/${h.target}` : (pct >= 100 ? "Done" : "Pending");
    return `<div class="habit-progress-item">
      <div class="habit-progress-head">
        <span class="dot" style="background:${cat.color}"></span>
        <span class="name">${esc(h.name)}</span>
        <span class="pct">${pct}% · ${sub}</span>
      </div>
      <div class="habit-progress-track">
        <div class="habit-progress-fill" style="width:${pct}%;background:linear-gradient(90deg,${cat.color},${cat.color}99)"></div>
      </div>
    </div>`;
  }).join("") : `<div class="fl-cat-empty">Nothing scheduled for today. Enjoy the space.</div>`;
}

function renderWeekChart(weekDates, weekSum) {
  const dayData = weekSum.days.map((d, i) => ({
    label: DAY_NAMES[i].slice(0, 3),
    pct: d.pct,
    byCategory: d.byCategory,
    isToday: isSameDay(weekDates[i], today),
  }));
  el("weekChart").innerHTML = charts.stackedBarChart(dayData, { width: 620, height: 220, uidSeed: 1 });

  const legend = el("weekLegend");
  legend.innerHTML = CATEGORY_ORDER
    .filter((c) => weekSum.byCategory[c].total > 0)
    .map((c) => `<div class="legend-item"><span class="legend-dot" style="background:${CATEGORIES[c].color}"></span>${CATEGORIES[c].icon} ${CATEGORIES[c].name.split(" ")[0]}</div>`)
    .join("");
}

function renderDonut(weekSum) {
  const segments = CATEGORY_ORDER.map((c) => ({
    label: CATEGORIES[c].name,
    value: weekSum.byCategory[c].done,
    doneRaw: weekSum.byCategory[c].done,
    color: CATEGORIES[c].color,
  })).filter((s) => s.value > 0);

  const holder = el("donutChart");
  if (segments.length === 0) {
    holder.innerHTML = `<div class="muted">No completions logged yet this week.</div>`;
    return;
  }
  const svg = charts.donutChart(segments, { size: 168, centerBig: `${weekSum.totalDone}`, centerSmall: "completed" });
  const legendRows = segments
    .map((s) => `<div class="donut-legend-row"><span class="legend-dot" style="background:${s.color}"></span>${s.label}<span class="pct">${Math.round((s.value / weekSum.totalDone) * 100)}%</span></div>`)
    .join("");
  holder.innerHTML = `${svg}<div class="donut-legend">${legendRows}</div>`;
}

function renderTrend() {
  const points = [];
  for (let i = 29; i >= 0; i--) {
    const d = addDays(today, -i);
    const s = dayScore(state.habits, state.completions, d);
    points.push({ label: `${d.getDate()}`, value: s.pct });
  }
  el("trendChart").innerHTML = charts.lineChart(points, { width: 620, height: 170 });
}

function renderHeatmap() {
  el("heatmapTitle").textContent = `${MONTH_NAMES[state.heatMonth]} ${state.heatYear} Heatmap`;
  const total = daysInMonth(state.heatYear, state.heatMonth);
  const pctFn = (d) => {
    const date = new Date(state.heatYear, state.heatMonth, d);
    if (date > today) return null;
    const s = dayScore(state.habits, state.completions, date);
    return s.total ? s.pct : null;
  };
  el("heatmapChart").innerHTML = charts.monthHeatmap(state.heatYear, state.heatMonth, pctFn, { cell: 16, gap: 4 });
}
el("heatPrev").addEventListener("click", () => {
  state.heatMonth--; if (state.heatMonth < 0) { state.heatMonth = 11; state.heatYear--; }
  renderHeatmap();
});
el("heatNext").addEventListener("click", () => {
  state.heatMonth++; if (state.heatMonth > 11) { state.heatMonth = 0; state.heatYear++; }
  renderHeatmap();
});

function renderInsight(weekSum) {
  if (state.habits.length === 0) {
    el("insightText").textContent = "Add a few habits to see personalized insights here.";
    return;
  }
  const cats = CATEGORY_ORDER.map((c) => ({ c, ...weekSum.byCategory[c] })).filter((x) => x.total > 0)
    .map((x) => ({ ...x, pct: Math.round((x.done / x.total) * 100) }));
  if (cats.length === 0) {
    el("insightText").textContent = "No progress logged yet this week — check off a habit to get started!";
    return;
  }
  const best = cats.reduce((a, b) => (b.pct > a.pct ? b : a));
  const worst = cats.reduce((a, b) => (b.pct < a.pct ? b : a));
  let msg = `You're strongest in <b>${CATEGORIES[best.c].name}</b> this week at <b>${best.pct}%</b>.`;
  if (worst.c !== best.c && worst.pct < 60) {
    msg += ` <b>${CATEGORIES[worst.c].name}</b> is lagging at ${worst.pct}% — a small nudge there would round out your week nicely.`;
  } else if (weekSum.pct >= 80) {
    msg += ` Overall you're at ${weekSum.pct}% — excellent consistency, keep the streak alive!`;
  } else {
    msg += ` Overall you're at ${weekSum.pct}% for the week so far.`;
  }
  el("insightText").innerHTML = msg;
}

function renderHabitTable(score) {
  const wrap = el("habitTable");
  if (state.habits.length === 0) {
    wrap.innerHTML = `<div class="muted">No habits yet — head to the Habits tab to add your first one.</div>`;
    return;
  }
  const dateStr = dateKey(today);
  const sorted = state.habits.filter((h) => habitActiveOn(h, today)).sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
  if (!sorted.length) {
    wrap.innerHTML = `<div class="muted">Nothing is scheduled for today. Use Manage Habits to adjust your routine.</div>`;
    return;
  }
  wrap.innerHTML = sorted.map((h) => {
    const cat = CATEGORIES[h.category] || CATEGORIES.personal;
    const v = getValue(state.completions, dateStr, h.id);
    const done = isHabitDone(h, v);
    const skipped = isHabitSkipped && isHabitSkipped(v);
    const streak = habitStreak(h, state.completions);
    const spark = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const s = dayScore([h], state.completions, d);
      spark.push(s.total ? s.done / s.total : 0);
    }
    const control = h.type === "numeric"
      ? `<div class="row-numeric" data-id="${h.id}">
          <button data-act="dec">–</button>
          <span class="val">${Number(v) || 0}/${h.target}${h.unit ? " " + esc(h.unit) : ""}</span>
          <button data-act="inc">+</button>
        </div>`
      : `<button class="row-toggle ${done ? "done" : ""}" data-id="${h.id}" aria-label="${done ? "Mark incomplete" : "Mark complete"}" style="--cat-color:${cat.color}">${done ? "✓" : ""}</button>`;
    return `<div class="habit-row">
      <span class="cat-dot" style="background:${cat.color}"></span>
      <div class="hinfo">
        <div class="hname">${esc(h.name)}</div>
        <div class="hcat">${cat.icon} ${cat.name}${h.cue ? ` · ⚓ ${esc(h.cue)}` : ""}${h.minimum ? ` · minimum: ${esc(h.minimum)}` : ""}${skipped ? " · skipped today" : ""}</div>
      </div>
      <div class="hstreak">${streak > 0 ? `🔥 ${streak}d` : ""}</div>
      <div class="hsparkline">${charts.sparkline(spark, { width: 90, height: 24, color: cat.color })}</div>
      <div class="hcontrol">
        ${!done && h.minimum ? `<button class="min-action-btn" data-min-id="${h.id}" title="Complete 2-minute minimum (${esc(h.minimum)})">⚡ Min</button>` : ""}
        ${control}
        <button class="skip-action ${skipped ? "active" : ""}" data-skip="${h.id}" title="Skip today">${skipped ? "Skipped" : "Skip"}</button>
      </div>
    </div>`;
  }).join("");

  wrap.querySelectorAll(".min-action-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const h = state.habits.find((x) => x.id === btn.dataset.minId);
      if (!h) return;
      setValue(state.completions, dateStr, h.id, { minimum: true, completedAt: Date.now() });
      cheerForProgress();
      await saveCompletions(state.completions);
      renderOverview();
    });
  });

  wrap.querySelectorAll(".row-toggle").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const h = state.habits.find((x) => x.id === btn.dataset.id);
      const cur = getValue(state.completions, dateStr, h.id);
      const wasDone = isHabitDone(h, cur);
      setValue(state.completions, dateStr, h.id, !wasDone);
      if (!wasDone) cheerForProgress();
      await saveCompletions(state.completions);
      renderOverview();
    });
  });
  wrap.querySelectorAll(".row-numeric").forEach((ctrl) => {
    const id = ctrl.dataset.id;
    const h = state.habits.find((x) => x.id === id);
    ctrl.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const cur = Number(getValue(state.completions, dateStr, id)) || 0;
        const wasDone = isHabitDone(h, cur);
        const step = h.target && h.target <= 10 ? 1 : Math.max(1, Math.round(h.target / 8));
        const next = btn.dataset.act === "inc" ? cur + step : Math.max(0, cur - step);
        setValue(state.completions, dateStr, id, next);
        celebrateHabitComplete(h, wasDone);
        await saveCompletions(state.completions);
        renderOverview();
      });
    });
  });
  wrap.querySelectorAll("[data-skip]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.skip;
      const current = getValue(state.completions, dateStr, id);
      setValue(state.completions, dateStr, id, isHabitSkipped && isHabitSkipped(current) ? undefined : { skipped: true });
      await saveCompletions(state.completions);
      renderOverview();
    });
  });
}

/* ------------------------------------------------------------------ */
/* Habits management                                                   */
/* ------------------------------------------------------------------ */
function renderReadyMadePacks() {
  const packsGrid = el("readyMadePacksGrid");
  const packs = FL.READY_MADE_TASK_PACKS || [];
  if (!packsGrid || !packs.length) return;

  packsGrid.innerHTML = packs.map((pack) => {
    const taskCount = pack.tasks.length;
    const taskPills = pack.tasks.slice(0, 3).map((t) => `<span class="rm-task-mini-pill">• ${esc(t.name)}</span>`).join("");
    const moreCount = taskCount > 3 ? `<span class="rm-task-mini-pill">+${taskCount - 3} more</span>` : "";

    return `
      <div class="ready-made-pack-card" data-pack="${pack.id}">
        <div class="rm-pack-head">
          <div class="rm-pack-icon">${pack.icon}</div>
          <div>
            <div class="rm-pack-title">${esc(pack.name)}</div>
            <div class="rm-pack-desc">${esc(pack.tagline)}</div>
          </div>
        </div>
        <div class="rm-task-pill-list">
          ${taskPills}
          ${moreCount}
        </div>
        <button type="button" class="rm-pack-add-btn" data-pack-id="${pack.id}">
          + Add Pack (${taskCount} tasks)
        </button>
      </div>
    `;
  }).join("");

  packsGrid.querySelectorAll(".rm-pack-add-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const packId = btn.dataset.packId;
      if (FL.addReadyMadePack) {
        const res = await FL.addReadyMadePack(packId);
        state.habits = res.allHabits || (await loadHabits());
        if (mascot && mascot.cheer) {
          mascot.cheer({ message: `Added ${res.packName || "routine pack"}! ✨` });
        }
        renderHabitsManage();
        renderOverview();
      }
    });
  });
}

function renderHabitsManage() {
  renderReadyMadePacks();

  const restoreBtn = el("restoreDefaultsBtn");
  if (restoreBtn && !restoreBtn._hasListener) {
    restoreBtn._hasListener = true;
    restoreBtn.addEventListener("click", async () => {
      if (!confirm("Load the 8 universal default daily habits into your checklist?")) return;
      if (FL.loadDefaultHabits) {
        state.habits = await FL.loadDefaultHabits();
        if (mascot && mascot.cheer) {
          mascot.cheer({ message: "Loaded essential habits! ⚡" });
        }
        renderHabitsManage();
        renderOverview();
      }
    });
  }

  // Update time slot indicator
  const currentSlot = FL.getCurrentTimeSlot ? FL.getCurrentTimeSlot() : "morning";
  const slotLabels = { morning: "🌅 Morning", afternoon: "☀️ Afternoon", evening: "🌆 Evening" };
  if (el("dashActiveTimeSlotText")) {
    el("dashActiveTimeSlotText").textContent = `${slotLabels[currentSlot] || "🌅 Morning"} Focus Window Active`;
  }

  // Wire time filter pills
  const pillGroup = el("dashTimeFilterPillGroup");
  if (pillGroup) {
    pillGroup.querySelectorAll(".dash-time-pill").forEach((pill) => {
      pill.classList.toggle("active", pill.dataset.slot === state.dashTimeFilter);
      if (!pill._hasSlotListener) {
        pill._hasSlotListener = true;
        pill.addEventListener("click", () => {
          state.dashTimeFilter = pill.dataset.slot;
          renderHabitsManage();
        });
      }
    });
  }

  const wrap = el("habitsList");
  if (state.habits.length === 0) {
    wrap.innerHTML = `<div class="muted" style="padding:16px;">No habits yet. Click any ready-made pack above or "+ Custom Habit" to add your first one.</div>`;
    return;
  }

  // Filter by time-of-day
  let filtered = [...state.habits];
  if (state.dashTimeFilter !== "all" && FL.getHabitsByTimeOfDay) {
    filtered = FL.getHabitsByTimeOfDay(filtered, state.dashTimeFilter);
  }
  const sorted = filtered.sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

  const todayStr = dateKey(today);
  wrap.innerHTML = sorted.map((h) => {
    const cat = CATEGORIES[h.category] || CATEGORIES.personal;
    const streak = habitStreak(h, state.completions);
    const meta = h.type === "numeric" ? `Numeric · target ${h.target} ${h.unit || ""}` : "Checkbox habit";
    const timeSlot = h.timeOfDay || "anytime";
    const timeBadge = { morning: "🌅 AM", afternoon: "☀️ PM", evening: "🌆 EVE", anytime: "⏰ Any" }[timeSlot] || "⏰ Any";
    const estMin = h.estimatedMinutes ? `· ~${h.estimatedMinutes}min` : "";

    // Render subtasks
    let subtasksHtml = "";
    if (h.subtasks && h.subtasks.length > 0) {
      const subtaskItems = h.subtasks.map((st) => {
        const isDone = FL.getSubtaskStatus ? FL.getSubtaskStatus(state.completions, todayStr, h.id, st.id) : false;
        return `<div class="dash-subtask-item ${isDone ? 'done' : ''}" data-habit="${h.id}" data-subtask="${st.id}">
          <div class="dash-subtask-check">${isDone ? '✓' : ''}</div>
          <span>${esc(st.name)}</span>
        </div>`;
      }).join("");
      subtasksHtml = `<div class="dash-subtasks-container">${subtaskItems}</div>`;
    }

    return `<div class="manage-card">
      <div class="cat-badge" style="background:${cat.soft};color:${cat.color}">${cat.icon}</div>
      <div style="flex:1">
        <div class="m-name">${esc(h.name)} <span class="habit-time-badge">${timeBadge}</span> <span style="font-size:11px;color:var(--ink-soft)">${estMin}</span></div>
        <div class="m-meta">${cat.name} · ${meta} ${streak > 0 ? `· 🔥 ${streak}d streak` : ""}</div>
        ${subtasksHtml}
      </div>
      <div class="m-actions">
        <button class="icon-action" data-edit="${h.id}" title="Edit">✏️</button>
        <button class="icon-action danger" data-del="${h.id}" title="Delete">🗑️</button>
      </div>
    </div>`;
  }).join("");

  // Wire subtask toggles
  wrap.querySelectorAll(".dash-subtask-item").forEach((item) => {
    item.addEventListener("click", async () => {
      const habitId = item.dataset.habit;
      const subtaskId = item.dataset.subtask;
      if (FL.toggleSubtask) {
        state.completions = await FL.toggleSubtask(todayStr, habitId, subtaskId);
        renderHabitsManage();
        renderOverview();
      }
    });
  });

  wrap.querySelectorAll("[data-edit]").forEach((btn) => btn.addEventListener("click", () => openHabitModal(btn.dataset.edit)));
  wrap.querySelectorAll("[data-del]").forEach((btn) => btn.addEventListener("click", async () => {
    if (!confirm("Delete this habit? Its logged history will be kept but hidden.")) return;
    state.habits = state.habits.filter((h) => h.id !== btn.dataset.del);
    await saveHabits(state.habits);
    renderHabitsManage();
    renderOverview();
  }));
}

el("addHabitBtn").addEventListener("click", () => openHabitModal(null));

// Focus Flow Sprint — 1-click launcher with ambient audio sync
if (el("startFocusSprintBtn")) {
  el("startFocusSprintBtn").addEventListener("click", async () => {
    const todayStr = dateKey(today);
    const todayDone = state.completions[todayStr] || {};
    const nextHabit = state.habits.find((h) => {
      const v = todayDone[h.id];
      return FL.isHabitDone ? !FL.isHabitDone(h, v) : !v;
    });
    if (!nextHabit) {
      if (mascot && mascot.cheer) mascot.cheer({ epic: true, message: "All habits done today! 🏆" });
      return;
    }
    // Auto-set focus intention
    if (el("focusIntentionInput")) {
      el("focusIntentionInput").value = nextHabit.name;
    }
    // Start ambient soundscape
    if (!state.activeSoundscape && playAmbientSoundscape) {
      playAmbientSoundscape("rain", state.soundVolume);
      state.activeSoundscape = "rain";
    }
    // Switch to Pro section to show focus timer
    switchSection("pro");
    // Auto-start the timer if not running
    setTimeout(() => {
      if (el("focusStartBtn")) el("focusStartBtn").click();
    }, 300);
    if (mascot && mascot.cheer) {
      mascot.cheer({ message: `🚀 Sprint started: ${nextHabit.name}!` });
    }
  });
}

function renderCategoryGrid(selected) {
  el("mCategoryGrid").innerHTML = CATEGORY_ORDER.map((c) => {
    const cat = CATEGORIES[c];
    return `<button type="button" class="category-pick ${c === selected ? "active" : ""}" data-cat="${c}" style="--cat-color:${cat.color};--cat-soft:${cat.soft}">
      <span class="cp-icon">${cat.icon}</span>${cat.name.split(" ")[0]}
    </button>`;
  }).join("");
  el("mCategoryGrid").querySelectorAll(".category-pick").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.modalCategory = btn.dataset.cat;
      el("mCategoryGrid").querySelectorAll(".category-pick").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });
}

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function renderDayPicker() {
  const holder = el("mDays");
  holder.innerHTML = SHORT_DAYS.map((label, day) => `<button type="button" class="day-pick ${state.modalDays.includes(day) ? "active" : ""}" data-day="${day}" aria-pressed="${state.modalDays.includes(day)}">${label}</button>`).join("");
  holder.querySelectorAll(".day-pick").forEach((btn) => btn.addEventListener("click", () => {
    const day = Number(btn.dataset.day);
    state.modalDays = state.modalDays.includes(day) ? state.modalDays.filter((d) => d !== day) : [...state.modalDays, day].sort();
    if (!state.modalDays.length) state.modalDays = [0, 1, 2, 3, 4, 5, 6];
    renderDayPicker();
  }));
}

function openHabitModal(habitId) {
  state.editingHabitId = habitId;
  const habit = habitId ? state.habits.find((h) => h.id === habitId) : null;
  el("modalTitle").textContent = habit ? "Edit Habit" : "Add Habit";
  el("mName").value = habit ? habit.name : "";
  state.modalCategory = habit ? habit.category : "work";
  state.modalType = habit ? habit.type : "check";
  state.modalDays = habit && Array.isArray(habit.days) && habit.days.length ? [...habit.days] : [0, 1, 2, 3, 4, 5, 6];
  renderCategoryGrid(state.modalCategory);
  document.querySelectorAll(".type-btn").forEach((b) => b.classList.toggle("active", b.dataset.type === state.modalType));
  el("numericFields").classList.toggle("hidden", state.modalType !== "numeric");
  el("mTarget").value = habit && habit.target ? habit.target : 8;
  el("mUnit").value = habit && habit.unit ? habit.unit : "";
  el("mMinimumEnabled").checked = !!(habit && habit.minimum);
  el("mMinimum").value = habit && habit.minimum ? habit.minimum : "";
  el("mMinimum").disabled = !el("mMinimumEnabled").checked;
  renderDayPicker();
  el("habitModal").classList.remove("hidden");
}
el("mMinimumEnabled").addEventListener("change", (e) => {
  el("mMinimum").disabled = !e.target.checked;
  if (e.target.checked) el("mMinimum").focus();
});
document.querySelectorAll(".type-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.modalType = btn.dataset.type;
    document.querySelectorAll(".type-btn").forEach((b) => b.classList.toggle("active", b === btn));
    el("numericFields").classList.toggle("hidden", state.modalType !== "numeric");
  });
});
el("mCancel").addEventListener("click", () => el("habitModal").classList.add("hidden"));
el("habitModal").addEventListener("click", (e) => { if (e.target.id === "habitModal") el("habitModal").classList.add("hidden"); });

el("mSave").addEventListener("click", async () => {
  const name = el("mName").value.trim();
  if (!name) { el("mName").focus(); return; }
  const payload = {
    name,
    category: state.modalCategory,
    type: state.modalType,
    days: state.modalDays,
    minimum: el("mMinimumEnabled").checked ? el("mMinimum").value.trim() : "",
  };
  if (state.modalType === "numeric") {
    payload.target = Math.max(1, Number(el("mTarget").value) || 1);
    payload.unit = el("mUnit").value.trim() || "times";
  }
  if (state.editingHabitId) {
    const h = state.habits.find((x) => x.id === state.editingHabitId);
    Object.assign(h, payload);
  } else {
    state.habits.push({ id: `h_${Date.now()}`, createdAt: Date.now(), ...payload });
  }
  await saveHabits(state.habits);
  el("habitModal").classList.add("hidden");
  renderHabitsManage();
});

/* ------------------------------------------------------------------ */
/* Reports                                                              */
/* ------------------------------------------------------------------ */
function renderReport() {
  const weekDates = getWeekDates(state.reportWeekOffset);
  el("reportRange").textContent = formatRange(weekDates);
  const weekSum = weeklySummary(state.habits, state.completions, weekDates);

  const rows = [...state.habits].sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)).map((h) => {
    const cat = CATEGORIES[h.category] || CATEGORIES.personal;
    let doneDays = 0, sumVal = 0;
    weekDates.forEach((d) => {
      if (!habitActiveOn(h, d)) return;
      const v = getValue(state.completions, dateKey(d), h.id);
      if (isHabitDone(h, v)) doneDays++;
      if (h.type === "numeric") sumVal += Number(v) || 0;
    });
    const activeDays = weekDates.filter((d) => habitActiveOn(h, d)).length || 7;
    const pct = Math.round((doneDays / activeDays) * 100);
    const status = pct >= 80 ? { c: "status-good", l: "On track" } : pct >= 40 ? { c: "status-warn", l: "Needs focus" } : { c: "status-bad", l: "Behind" };
    return { h, cat, doneDays, activeDays, pct, sumVal, status };
  });

  const leftBehind = rows.filter((r) => r.pct < 60);

  const dayData = weekSum.days.map((d, i) => ({ label: DAY_NAMES[i].slice(0, 3), pct: d.pct, byCategory: d.byCategory, isToday: false }));
  const weekChartSvg = charts.stackedBarChart(dayData, { width: 680, height: 190, uidSeed: 2 });

  const catSegments = CATEGORY_ORDER.map((c) => ({ label: CATEGORIES[c].name, value: weekSum.byCategory[c].done, color: CATEGORIES[c].color })).filter((s) => s.value > 0);
  const donutSvg = catSegments.length
    ? charts.donutChart(catSegments, { size: 140, centerBig: `${weekSum.pct}%`, centerSmall: "overall" })
    : `<div class="muted">No data logged this week.</div>`;

  const catLegend = catSegments.map((s) => `<div class="donut-legend-row"><span class="legend-dot" style="background:${s.color}"></span>${s.label}<span class="pct">${s.value}</span></div>`).join("");

  const generatedOn = new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const who = state.settings.name ? `${state.settings.name}'s` : "Your";

  el("reportPrintArea").innerHTML = `
    <div class="report-header">
      <div>
        <h1>${esc(who)} Weekly Progress Report</h1>
        <div class="r-sub">${formatRange(weekDates)} &nbsp;·&nbsp; Generated ${generatedOn}</div>
      </div>
      <div class="report-badge">Cadence</div>
    </div>

    <div class="report-stat-grid">
      <div class="report-stat"><div class="rv">${weekSum.pct}%</div><div class="rl">Overall completion</div></div>
      <div class="report-stat"><div class="rv">${weekSum.totalDone}/${weekSum.totalPossible}</div><div class="rl">Habits completed</div></div>
      <div class="report-stat"><div class="rv">${weekSum.perfectDays}/7</div><div class="rl">Perfect days</div></div>
      <div class="report-stat"><div class="rv">${longestStreakAcrossHabits(state.habits, state.completions)}</div><div class="rl">Best current streak</div></div>
    </div>

    <div class="report-section-title">Daily Completion</div>
    ${weekChartSvg}

    <div class="report-section-title">Category Breakdown</div>
    <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
      ${donutSvg}
      <div class="donut-legend">${catLegend || ""}</div>
    </div>

    <div class="report-section-title">Habit-by-Habit Detail</div>
    <table class="report-table">
      <thead><tr><th>Habit</th><th>Category</th><th>Progress</th><th>Completion</th><th>Status</th></tr></thead>
      <tbody>
        ${rows.map((r) => `<tr>
          <td>${esc(r.h.name)}</td>
          <td>${r.cat.icon} ${r.cat.name}</td>
          <td>${r.h.type === "numeric" ? `${r.sumVal} ${esc(r.h.unit || "")} logged` : `${r.doneDays}/${r.activeDays} days`}</td>
          <td>${r.pct}%</td>
          <td><span class="status-pill ${r.status.c}">${r.status.l}</span></td>
        </tr>`).join("")}
      </tbody>
    </table>

    <div class="report-section-title">What's Left Behind</div>
    ${leftBehind.length === 0
      ? `<p class="muted">Nothing left behind — every habit is tracking above 60% this week. Great work!</p>`
      : `<div class="left-behind-list">${leftBehind.map((r) => `<div class="left-behind-item">⚠️ <b>${esc(r.h.name)}</b>&nbsp; — only ${r.pct}% complete this week (${r.doneDays}/${r.activeDays} days). Consider a smaller daily target or a reminder.</div>`).join("")}</div>`
    }

    <div class="report-footer">Generated by Cadence — your personal habit, health &amp; productivity tracker.</div>
  `;
}

el("reportPrev").addEventListener("click", () => { state.reportWeekOffset--; renderReport(); });
el("reportNext").addEventListener("click", () => { state.reportWeekOffset = Math.min(0, state.reportWeekOffset + 1); renderReport(); });
el("downloadReportBtn").addEventListener("click", () => {
  renderReport();
  window.print();
});

/* ------------------------------------------------------------------ */
/* Settings                                                             */
/* ------------------------------------------------------------------ */
el("settingsName").addEventListener("change", async (e) => {
  state.settings.name = e.target.value.trim();
  await saveSettings(state.settings);
});

el("exportBtn").addEventListener("click", () => {
  const data = { habits: state.habits, completions: state.completions, settings: state.settings, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cadence-backup-${dateKey(today)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

/* ------------------------------------------------------------------ */
/* Pro Plan Suite & Theme Studio                                      */
/* ------------------------------------------------------------------ */
/* Pro Plan Suite & Stripe Payment Gateway                            */
/* ------------------------------------------------------------------ */
state.stripeRegion = (FL.detectUserRegion && FL.detectUserRegion()) || "IN";
state.selectedStripePlan = "monthly";
state.appliedCoupon = null;

function renderStripePricingSection() {
  const grid = el("stripePricingGrid");
  if (!grid || !FL.STRIPE_PLANS) return;

  const reg = state.stripeRegion || "IN";
  const plansObj = FL.STRIPE_PLANS[reg] || FL.STRIPE_PLANS.GLOBAL;

  // Sync region toggle buttons
  const btnIN = el("regionBtnIN");
  const btnGLOBAL = el("regionBtnGLOBAL");
  if (btnIN) btnIN.classList.toggle("active", reg === "IN");
  if (btnGLOBAL) btnGLOBAL.classList.toggle("active", reg === "GLOBAL");

  const plansList = [
    { key: "monthly", data: plansObj.monthly, highlight: false, btnClass: "primary" },
    { key: "annual", data: plansObj.annual, highlight: true, btnClass: "highlight" }
  ];

  grid.innerHTML = plansList.map((p) => {
    const d = p.data;
    const isPopular = p.key === "annual";
    return `
      <div class="stripe-plan-card ${p.highlight ? "highlight" : ""}" data-plan="${p.key}">
        ${d.badge ? `<div class="plan-ribbon">${d.badge}</div>` : ""}
        <div class="plan-header">
          <span class="plan-tag">${d.tag || "PRO"}</span>
          <h4 class="plan-name">${d.name}</h4>
          <p class="plan-subtitle">${d.subtitle}</p>
        </div>

        <div class="plan-price-wrap">
          <span class="plan-currency">${plansObj.symbol}</span>
          <span class="plan-amount">${d.price}</span>
          <span class="plan-period">${d.billingPeriod}</span>
          ${d.equivalentMonthly ? `<span class="plan-equiv-badge">${d.equivalentMonthly}</span>` : ""}
        </div>

        <ul class="plan-features-list">
          ${d.features.map(f => `<li><span class="feat-check">✓</span><span>${f}</span></li>`).join("")}
        </ul>

        <button type="button" class="btn-stripe-plan ${p.btnClass}" data-plan-key="${p.key}">
          ${d.autoPay ? `⚡ Auto-Pay ${d.displayPrice}` : `👑 Get Lifetime ${d.displayPrice}`}
        </button>
      </div>
    `;
  }).join("");

  grid.querySelectorAll(".btn-stripe-plan").forEach((btn) => {
    btn.addEventListener("click", () => {
      const planKey = btn.dataset.planKey;
      openStripeCheckoutModal(planKey, reg);
    });
  });
}

function openStripeCheckoutModal(planKey, region) {
  const modal = el("stripeCheckoutModal");
  if (!modal || !FL.STRIPE_PLANS) return;

  state.selectedStripePlan = planKey;
  state.appliedCoupon = null;

  const reg = region || state.stripeRegion || "IN";
  const plansObj = FL.STRIPE_PLANS[reg] || FL.STRIPE_PLANS.GLOBAL;
  const planData = plansObj[planKey] || plansObj.monthly;

  // Populate Modal Fields
  if (el("stripeModalPlanName")) el("stripeModalPlanName").textContent = planData.name;
  if (el("stripeModalPlanSubtitle")) el("stripeModalPlanSubtitle").textContent = planData.subtitle;
  if (el("stripeModalCurrency")) el("stripeModalCurrency").textContent = plansObj.symbol;
  if (el("stripeModalPrice")) el("stripeModalPrice").textContent = planData.price;
  if (el("stripeModalPeriod")) el("stripeModalPeriod").textContent = planData.billingPeriod;

  // Features list
  if (el("stripeModalFeaturesList")) {
    el("stripeModalFeaturesList").innerHTML = planData.features.slice(0, 4).map(f => `<div>✓ ${f}</div>`).join("");
  }

  // Payments intentionally stay outside the extension. A production hosted
  // checkout URL must be configured before this CTA becomes available.
  const hostedLink = el("stripeHostedCheckoutLink");
  if (hostedLink) {
    const url = planData.stripePaymentLink || "";
    const configured = /^https:\/\/buy\.stripe\.com\//.test(url) && !url.includes("/test_");
    hostedLink.href = configured ? url : "#";
    hostedLink.setAttribute("aria-disabled", String(!configured));
    hostedLink.classList.toggle("is-disabled", !configured);
    hostedLink.title = configured ? "Open secure hosted checkout" : "A production checkout link has not been configured yet";
    hostedLink.onclick = configured ? null : (event) => event.preventDefault();
    const note = modal.querySelector(".checkout-note");
    if (note) note.textContent = configured
      ? "Payment details are collected only on the provider’s hosted checkout page."
      : "Checkout is not configured yet. Add a production Stripe Payment Link before accepting payments.";
  }

  // Reset Coupon and Breakdown
  if (el("stripeCouponInput")) el("stripeCouponInput").value = "";
  if (el("couponFeedback")) {
    el("couponFeedback").textContent = "";
    el("couponFeedback").className = "coupon-feedback";
  }
  updateOrderBreakdown(planData.price, plansObj.symbol);

  modal.classList.remove("hidden");
}

function updateOrderBreakdown(basePrice, currencySymbol) {
  let discountAmt = 0;
  let finalPrice = basePrice;

  if (state.appliedCoupon) {
    discountAmt = state.appliedCoupon.discountAmount;
    finalPrice = state.appliedCoupon.finalPrice;
    if (el("breakdownDiscountRow")) el("breakdownDiscountRow").style.display = "flex";
    if (el("breakdownDiscount")) el("breakdownDiscount").textContent = `−${currencySymbol}${discountAmt.toFixed(2)}`;
  } else {
    if (el("breakdownDiscountRow")) el("breakdownDiscountRow").style.display = "none";
  }

  if (el("breakdownSubtotal")) el("breakdownSubtotal").textContent = `${currencySymbol}${basePrice.toFixed(2)}`;
  if (el("breakdownTotal")) el("breakdownTotal").textContent = `${currencySymbol}${finalPrice.toFixed(2)}`;
  if (el("payBtnText")) el("payBtnText").textContent = `Pay ${currencySymbol}${finalPrice.toFixed(2)} & Activate Pro`;
}

function detectCardBrand(num) {
  const clean = num.replace(/\D/g, "");
  if (/^4/.test(clean)) return { brand: "Visa", icon: "💳 (Visa)" };
  if (/^(5[1-5]|2[2-7])/.test(clean)) return { brand: "Mastercard", icon: "💳 (MC)" };
  if (/^3[47]/.test(clean)) return { brand: "Amex", icon: "💳 (Amex)" };
  if (/^(60|65|81|82)/.test(clean)) return { brand: "RuPay", icon: "💳 (RuPay)" };
  if (/^6/.test(clean)) return { brand: "Discover", icon: "💳 (Discover)" };
  return { brand: "Unknown", icon: "💳" };
}

function getFocusSession() {
  const p = state.proSettings;
  if (!p.focusSession) p.focusSession = { duration: 25, remainingSeconds: 1500, running: false, startedAt: null, intention: "" };
  return p.focusSession;
}

function focusRemaining(session) {
  if (!session.running || !session.startedAt) return Math.max(0, session.remainingSeconds);
  return Math.max(0, session.remainingSeconds - Math.floor((Date.now() - session.startedAt) / 1000));
}

function renderFocusSprint() {
  if (!state.proSettings || !el("focusTime")) return;
  const session = getFocusSession();
  const remaining = focusRemaining(session);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  el("focusTime").textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  el("focusState").textContent = session.running ? (session.intention || "Deep work in progress") : (remaining === 0 ? "Sprint complete — great work." : "Ready when you are");
  el("focusStartBtn").textContent = session.running ? "Pause sprint" : (remaining === 0 ? "Start another" : "Start sprint");
  if (document.activeElement !== el("focusIntentionInput")) {
    el("focusIntentionInput").value = session.intention || "";
  }
  document.querySelectorAll(".focus-preset").forEach((btn) => btn.classList.toggle("active", Number(btn.dataset.minutes) === Number(session.duration)));
  if (session.running && remaining === 0) completeFocusSprint();
}

async function persistFocusSession() {
  await saveProSettings(state.proSettings);
}

async function completeFocusSprint() {
  const session = getFocusSession();
  if (!session.running || focusRemaining(session) > 0) return;
  session.running = false;
  session.startedAt = null;
  session.remainingSeconds = 0;
  state.proSettings.focusSessionsCompleted = (state.proSettings.focusSessionsCompleted || 0) + 1;
  await persistFocusSession();
  if (focusTimerId) { clearInterval(focusTimerId); focusTimerId = null; }
  renderFocusSprint();
  renderProSuite();
  if (mascot && mascot.cheer) mascot.cheer({ epic: true, message: "⚡ Focus sprint complete — momentum secured!" });
}

function startFocusTicker() {
  if (focusTimerId) return;
  focusTimerId = setInterval(() => renderFocusSprint(), 1000);
}

function renderProSuite() {
  if (!state.proSettings) return;
  const p = state.proSettings;
  const ts = p.themeSettings || DEFAULT_THEME_SETTINGS;

  // 1. Hero banner stats & Status
  if (el("proStreakShieldsVal")) el("proStreakShieldsVal").textContent = `🛡️ ${p.streakShields || 3}`;
  if (el("proMultiplierVal")) el("proMultiplierVal").textContent = `⚡ ${p.xpMultiplier || 1.5}x`;
  if (el("proFocusCountVal")) el("proFocusCountVal").textContent = `⏱️ ${p.focusSessionsCompleted || 14}`;

  const currentWp = WALLPAPERS.find((w) => w.id === ts.wallpaperId) || WALLPAPERS[0];
  const currentPal = THEME_PALETTES.find((pal) => pal.id === ts.paletteId) || THEME_PALETTES[0];
  const currentComp = PRO_COMPANIONS.find((c) => c.id === p.activeCompanion) || PRO_COMPANIONS[0];

  if (el("proHeroActiveThemeChip")) {
    el("proHeroActiveThemeChip").textContent = `🎨 ${currentWp.name} • ${currentPal.name}`;
  }
  if (el("proHeroCompanionBadge")) {
    el("proHeroCompanionBadge").textContent = `${currentComp.icon} ${currentComp.name}`;
  }

  // Active status tag & manage button
  if (el("proTierPill")) {
    if (p.isPro) {
      el("proTierPill").textContent = p.planType === "lifetime_ultra" ? "Executive Lifetime VIP" : "Pro Active Subscriber";
      el("proTierPill").style.background = "linear-gradient(135deg, #00B894, #0984E3)";
    } else {
      el("proTierPill").textContent = "Free Plan — Upgrade Below";
      el("proTierPill").style.background = "var(--line)";
    }
  }

  if (el("proManageSubBtn")) {
    el("proManageSubBtn").style.display = p.isPro ? "inline-block" : "none";
  }

  // 2. Render Stripe Pricing Section
  renderStripePricingSection();

  // 3. Render Color Theme Palettes
  const palGrid = el("proPaletteGrid");
  if (palGrid) {
    palGrid.innerHTML = THEME_PALETTES.map((pal) => {
      const isActive = ts.paletteId === pal.id;
      return `
        <div class="pro-palette-card ${isActive ? "active" : ""}" data-palette="${pal.id}">
          <div class="palette-head">
            <span class="palette-title">${pal.name}</span>
            <span class="palette-check">✓</span>
          </div>
          <div class="palette-swatches">
            <div class="swatch" style="background:${pal.primary}"></div>
            <div class="swatch" style="background:${pal.primaryLight}"></div>
            <div class="swatch" style="background:${pal.accent}"></div>
            <div class="swatch" style="background:${pal.cardSolid}"></div>
          </div>
        </div>
      `;
    }).join("");

    palGrid.querySelectorAll(".pro-palette-card").forEach((card) => {
      card.addEventListener("click", async () => {
        const palId = card.dataset.palette;
        ts.paletteId = palId;
        applyThemeEngine(ts);
        await saveProSettings(state.proSettings);
        renderProSuite();
      });
    });
  }

  // 4. Render 4K Ultra HD Wallpapers with Category Filters
  const filterWrap = el("proWpCategoryFilters");
  if (filterWrap) {
    filterWrap.querySelectorAll(".wp-cat-pill").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.cat === state.activeWpCategory);
      if (!btn._hasCatListener) {
        btn._hasCatListener = true;
        btn.addEventListener("click", () => {
          state.activeWpCategory = btn.dataset.cat;
          renderProSuite();
        });
      }
    });
  }

  const wpGrid = el("proWallpaperGrid");
  const customList = Array.isArray(ts.customWallpapers) ? ts.customWallpapers : [];

  // Render User Uploads Gallery in Custom Panel
  const userUploadsWrap = el("proUserUploadsWrap");
  const userGallery = el("proUserGallery");
  if (userUploadsWrap && userGallery) {
    if (customList.length === 0) {
      userUploadsWrap.style.display = "none";
      userGallery.innerHTML = "";
    } else {
      userUploadsWrap.style.display = "block";
      userGallery.innerHTML = customList.map((item) => {
        const isActive = ts.wallpaperId === "custom" && ts.customWallpaperUrl === item.url;
        return `
          <div class="wp-user-card ${isActive ? "active" : ""}" data-customid="${item.id}" title="${item.name || 'Custom Wallpaper'}">
            <img src="${item.url}" alt="${item.name || 'Custom Wallpaper'}" />
            <button type="button" class="wp-user-card-del" data-delid="${item.id}" title="Delete wallpaper">✕</button>
          </div>
        `;
      }).join("");

      userGallery.querySelectorAll(".wp-user-card").forEach((card) => {
        card.addEventListener("click", async (e) => {
          if (e.target.classList.contains("wp-user-card-del")) return;
          const customId = card.dataset.customid;
          const item = customList.find(c => c.id === customId);
          if (!item) return;

          ts.wallpaperId = "custom";
          ts.customWallpaperUrl = item.url;
          ts.wallpaperUrl = item.url;
          ts.dynamicTimeShift = false;
          applyThemeEngine(ts);
          await saveProSettings(state.proSettings);
          renderProSuite();
        });
      });

      userGallery.querySelectorAll(".wp-user-card-del").forEach((delBtn) => {
        delBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const delId = delBtn.dataset.delid;
          const removed = ts.customWallpapers.find(c => c.id === delId);
          ts.customWallpapers = ts.customWallpapers.filter(c => c.id !== delId);

          if (ts.wallpaperId === "custom" && removed && ts.customWallpaperUrl === removed.url) {
            if (ts.customWallpapers.length > 0) {
              ts.customWallpaperUrl = ts.customWallpapers[0].url;
              ts.wallpaperUrl = ts.customWallpapers[0].url;
            } else {
              ts.wallpaperId = "dolomites_sunbeams_8k";
              ts.customWallpaperUrl = "";
              ts.wallpaperUrl = "";
            }
            applyThemeEngine(ts);
          }

          await saveProSettings(state.proSettings);
          renderProSuite();
        });
      });
    }
  }

  // Clear all custom uploads
  const clearUploadsBtn = el("proClearUploadsBtn");
  if (clearUploadsBtn && !clearUploadsBtn._hasClearListener) {
    clearUploadsBtn._hasClearListener = true;
    clearUploadsBtn.addEventListener("click", async () => {
      if (!confirm("Remove all uploaded wallpapers?")) return;
      ts.customWallpapers = [];
      if (ts.wallpaperId === "custom") {
        ts.wallpaperId = "dolomites_sunbeams_8k";
        ts.customWallpaperUrl = "";
        ts.wallpaperUrl = "";
        applyThemeEngine(ts);
      }
      await saveProSettings(state.proSettings);
      renderProSuite();
    });
  }

  // Sync wallpaper fit buttons
  const fitGroup = el("proFitGroup");
  if (fitGroup) {
    const currentFit = ts.wallpaperFit || "cover";
    fitGroup.querySelectorAll(".wp-fit-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.fit === currentFit);
    });
  }

  if (wpGrid) {
    const allWps = WALLPAPERS || [];
    let filteredWps = [];

    if (state.activeWpCategory === "My Uploads") {
      if (customList.length === 0) {
        wpGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 32px 16px; text-align: center; color: var(--ink-soft); font-size: 13px;">
            <div style="font-size: 32px; margin-bottom: 8px;">📁</div>
            <div style="font-weight: 700; color: var(--ink); margin-bottom: 4px;">No custom wallpapers uploaded yet</div>
            <div>Drag &amp; drop an image above or paste a URL to add your own 4K backgrounds!</div>
          </div>
        `;
      } else {
        filteredWps = customList.map(c => ({
          id: "custom",
          customUrl: c.url,
          name: c.name || "My Upload",
          thumb: c.url,
          badge: "Your Upload",
          description: "Personal uploaded wallpaper"
        }));
      }
    } else {
      filteredWps = allWps.filter((wp) => {
        if (state.activeWpCategory === "all") return true;
        if (wp.id === "none") return true;
        if (wp.id === "custom") return false;
        const cat = state.activeWpCategory.toLowerCase();
        if (cat.includes("8k")) {
          return (wp.badge && wp.badge.toLowerCase().includes("8k")) || (wp.name && wp.name.toLowerCase().includes("8k"));
        }
        return (wp.category || "").toLowerCase().includes(cat);
      });
    }

    if (state.activeWpCategory !== "My Uploads" || customList.length > 0) {
      wpGrid.innerHTML = filteredWps.map((wp) => {
        const isCustomCard = wp.id === "custom";
        const isActive = isCustomCard
          ? (ts.wallpaperId === "custom" && (!wp.customUrl || ts.customWallpaperUrl === wp.customUrl))
          : (ts.wallpaperId === wp.id);

        let thumbSrc = wp.thumb || wp.file || wp.url;
        if (isCustomCard) {
          thumbSrc = wp.customUrl || ts.customWallpaperUrl || "";
        } else if (thumbSrc && !thumbSrc.startsWith("http") && !thumbSrc.startsWith("data:") && typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
          thumbSrc = chrome.runtime.getURL(thumbSrc);
        }

        const thumbContent = wp.id === "none"
          ? `<div class="wp-no-wallpaper-preview"><span>◌</span><small>Default Chrome</small></div>`
          : (thumbSrc ? `<img class="wp-thumb-img" src="${thumbSrc}" alt="${wp.name}"/>` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--ink-soft);font-size:12px;font-weight:600;">📁 Upload / URL</div>`);
        return `
          <div class="pro-wp-card ${isActive ? "active" : ""}" data-wallpaper="${wp.id}" data-customurl="${wp.customUrl || ""}">
            <div class="wp-thumb-wrap">
              ${thumbContent}
              <span class="wp-badge">${wp.badge}</span>
              <span class="wp-active-check">✓</span>
            </div>
            <div class="wp-info">
              <div class="wp-title">${wp.name}</div>
              <div class="wp-desc">${wp.description || ""}</div>
            </div>
          </div>
        `;
      }).join("");

      wpGrid.querySelectorAll(".pro-wp-card").forEach((card) => {
        card.addEventListener("click", async () => {
          const wpId = card.dataset.wallpaper;
          const customUrl = card.dataset.customurl;
          ts.wallpaperId = wpId;
          if (wpId === "custom") {
            ts.customWallpaperUrl = customUrl || ts.customWallpaperUrl || "";
            ts.wallpaperUrl = ts.customWallpaperUrl;
          } else {
            ts.customWallpaperUrl = "";
            const targetWp = WALLPAPERS.find((w) => w.id === wpId);
            if (targetWp && targetWp.themeId) {
              ts.paletteId = targetWp.themeId;
            }
          }
          applyThemeEngine(ts);
          await saveProSettings(state.proSettings);
          if (mascot && mascot.cheer) {
            mascot.cheer({ message: `Applied wallpaper! 🎨` });
          }
          renderProSuite();
        });
      });
    }
  }

  // 5. Sliders
  if (el("wpBlurSlider")) {
    el("wpBlurSlider").value = ts.blurPx || 0;
    el("blurValLabel").textContent = `${ts.blurPx || 0}px`;
  }
  if (el("wpDimSlider")) {
    el("wpDimSlider").value = ts.dimOpacity || 0;
    el("dimValLabel").textContent = `${ts.dimOpacity || 0}%`;
  }
  if (el("wpBrightnessSlider")) {
    const bVal = typeof ts.brightnessPct === "number" ? ts.brightnessPct : 100;
    el("wpBrightnessSlider").value = bVal;
    el("brightnessValLabel").textContent = `${bVal}%`;
  }
  if (el("wpContrastSlider")) {
    const cVal = typeof ts.contrastPct === "number" ? ts.contrastPct : 100;
    el("wpContrastSlider").value = cVal;
    el("contrastValLabel").textContent = `${cVal}%`;
  }
  if (el("wpSatSlider")) {
    el("wpSatSlider").value = ts.saturationPct || 100;
    el("satValLabel").textContent = `${ts.saturationPct || 100}%`;
  }

  const rotation = p.wallpaperRotation || { enabled: false, cadence: "daily" };
  if (el("wallpaperRotationToggle")) el("wallpaperRotationToggle").checked = !!rotation.enabled;
  if (el("wallpaperCadence")) el("wallpaperCadence").value = rotation.cadence || "daily";
  if (el("wallpaperRotationText")) el("wallpaperRotationText").textContent = rotation.enabled ? "On" : "Off";

  // Sync atmosphere engine toggles
  if (el("proDynamicShiftToggle")) {
    el("proDynamicShiftToggle").checked = !!ts.dynamicTimeShift;
  }
  if (el("proParallaxToggle")) {
    el("proParallaxToggle").checked = false;
    el("proParallaxToggle").disabled = true;
  }

  // 6. Companion Roster
  const compGrid = el("proCompanionGrid");
  if (compGrid) {
    compGrid.innerHTML = PRO_COMPANIONS.map((c) => {
      const isActive = p.activeCompanion === c.id;
      return `
        <div class="pro-comp-card ${isActive ? "active" : ""}" data-companion="${c.id}">
          <div class="comp-avatar-circle">${c.icon}</div>
          <div class="comp-name">${c.name}</div>
          <div class="comp-title">${c.title}</div>
          <div class="comp-perk-pill">${c.perk}</div>
        </div>
      `;
    }).join("");

    compGrid.querySelectorAll(".pro-comp-card").forEach((card) => {
      card.addEventListener("click", async () => {
        const compId = card.dataset.companion;
        p.activeCompanion = compId;
        await saveProSettings(state.proSettings);
        renderProSuite();
        if (mascot && mascot.cheer) {
          const comp = PRO_COMPANIONS.find((c) => c.id === compId);
          mascot.cheer({ message: `${comp.icon} ${comp.name} equipped!` });
        }
      });
    });
  }

  // Update Companion box
  if (el("compActiveIcon")) el("compActiveIcon").textContent = currentComp.icon;
  if (el("compActiveName")) el("compActiveName").textContent = currentComp.name;
  if (el("compActivePerk")) el("compActivePerk").textContent = currentComp.perk;
  if (el("compActiveQuote")) el("compActiveQuote").textContent = `"${currentComp.quotePool[0]}"`;
  renderFocusSprint();
}

/* Wire Pro Plan & Stripe Listeners */
function initProPlanListeners() {
  // Regional Toggle buttons
  if (el("regionBtnIN")) {
    el("regionBtnIN").addEventListener("click", () => {
      state.stripeRegion = "IN";
      renderStripePricingSection();
    });
  }
  if (el("regionBtnGLOBAL")) {
    el("regionBtnGLOBAL").addEventListener("click", () => {
      state.stripeRegion = "GLOBAL";
      renderStripePricingSection();
    });
  }

  // Close Stripe Checkout Modal
  if (el("closeStripeModalBtn")) {
    el("closeStripeModalBtn").addEventListener("click", () => {
      el("stripeCheckoutModal").classList.add("hidden");
    });
  }
  if (el("stripeCheckoutModal")) {
    el("stripeCheckoutModal").addEventListener("click", (e) => {
      if (e.target.id === "stripeCheckoutModal") {
        el("stripeCheckoutModal").classList.add("hidden");
      }
    });
  }

  // Apply Coupon Code
  if (el("applyCouponBtn")) {
    el("applyCouponBtn").addEventListener("click", () => {
      const code = (el("stripeCouponInput").value || "").trim();
      const reg = state.stripeRegion || "IN";
      const plansObj = FL.STRIPE_PLANS[reg] || FL.STRIPE_PLANS.GLOBAL;
      const planData = plansObj[state.selectedStripePlan] || plansObj.monthly;
      const feedback = el("couponFeedback");

      const res = FL.applyCoupon(code, planData.price);
      if (res.valid) {
        state.appliedCoupon = res;
        feedback.textContent = `✓ ${res.description} applied (−${res.discountPct}%)`;
        feedback.className = "coupon-feedback success";
        updateOrderBreakdown(planData.price, plansObj.symbol);
      } else {
        state.appliedCoupon = null;
        feedback.textContent = `⚠️ Invalid promo code. Try CADENCEVIP or LAUNCH2026`;
        feedback.className = "coupon-feedback error";
        updateOrderBreakdown(planData.price, plansObj.symbol);
      }
    });
  }

  // Copy License Key in Celebration Modal
  if (el("copyCelebrationKeyBtn")) {
    el("copyCelebrationKeyBtn").addEventListener("click", () => {
      const key = el("celebrationLicenseKey").textContent;
      navigator.clipboard.writeText(key).then(() => {
        el("copyCelebrationKeyBtn").textContent = "✓ Copied!";
        setTimeout(() => el("copyCelebrationKeyBtn").textContent = "📋 Copy", 2000);
      });
    });
  }

  // Close Celebration Modal
  if (el("closeCelebrationBtn")) {
    el("closeCelebrationBtn").addEventListener("click", () => {
      if (el("stripeCelebrationModal")) {
        el("stripeCelebrationModal").classList.add("hidden");
      }
    });
  }

  // Download Stripe Receipt
  if (el("downloadReceiptBtn")) {
    el("downloadReceiptBtn").addEventListener("click", () => {
      const p = state.proSettings;
      const receiptTxt =
`========================================================================
             CADENCE PRO TECHNOLOGIES INC. — STRIPE TAX INVOICE
========================================================================
Transaction ID   : ch_${Date.now().toString(36)}_stripe
Customer Portal  : ${FL.STRIPE_CONFIG.customerPortalUrl}
Date & Time      : ${new Date().toLocaleString()}
Plan Subscribed  : ${p.planType.toUpperCase()}
Amount Charged   : ${p.billingCurrency === "INR" ? "₹" : "$"}${p.billingPrice || "99.00"}
Payment Status   : PAID (Confirmed via Stripe 256-Bit Gateway)
Payment Method   : Card / Auto-Debit (RBI e-Mandate Compliant)
License Key      : ${p.licenseKey || "CDNC-PRO-ACTIVE"}
Customer Support : ${FL.STRIPE_CONFIG.supportEmail}
========================================================================
Thank you for investing in your daily execution and high-performance habits!`;

      const blob = new Blob([receiptTxt], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Cadence-Stripe-Receipt-${dateKey(today)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Activate License Key Button
  if (el("activateLicenseBtn")) {
    el("activateLicenseBtn").addEventListener("click", async () => {
      const input = el("licenseKeyInput");
      const feedback = el("licenseFeedback");
      const key = (input.value || "").trim().toUpperCase();

      if (FL.verifyLicenseKey(key)) {
        const pro = await FL.activateProSubscription({ licenseKey: key });
        state.proSettings = pro;
        feedback.textContent = "✓ License Key Activated! All Pro perks unlocked.";
        feedback.className = "license-feedback success";
        input.value = "";
        renderProSuite();
        if (mascot && mascot.cheer) {
          mascot.cheer({ epic: true, message: "⚡ Pro License Key Verified!" });
        }
      } else {
        feedback.textContent = "⚠️ Invalid License Key format. Example: CDNC-PRO-IN99-8821-X9A2";
        feedback.className = "license-feedback error";
      }
    });
  }

  // Open Stripe Customer Portal
  const openPortal = () => {
    const url = FL.STRIPE_CONFIG.customerPortalUrl || "https://billing.stripe.com";
    window.open(url, "_blank");
  };
  if (el("openCustomerPortalBtn")) el("openCustomerPortalBtn").addEventListener("click", openPortal);
  if (el("proManageSubBtn")) el("proManageSubBtn").addEventListener("click", openPortal);

  // Atmospheric presets config
  const DASHBOARD_PRESETS = {
    natural: { blurPx: 0, dimOpacity: 0, brightnessPct: 100, contrastPct: 100, saturationPct: 100 },
    cinematic: { blurPx: 0, dimOpacity: 25, brightnessPct: 95, contrastPct: 125, saturationPct: 115 },
    noir: { blurPx: 0, dimOpacity: 20, brightnessPct: 95, contrastPct: 135, saturationPct: 0 },
    warm: { blurPx: 0, dimOpacity: 10, brightnessPct: 105, contrastPct: 105, saturationPct: 130 },
    nordic: { blurPx: 8, dimOpacity: 15, brightnessPct: 100, contrastPct: 95, saturationPct: 90 },
    soft: { blurPx: 12, dimOpacity: 30, brightnessPct: 95, contrastPct: 90, saturationPct: 100 }
  };

  function optimizeDashboardWallpaper(file, maxWidth = 3840, maxHeight = 2160, quality = 0.90) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        return reject(new Error("Please upload a valid image file."));
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read image."));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Failed to load image."));
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          let dataUrl = canvas.toDataURL("image/webp", quality);
          if (!dataUrl || dataUrl.indexOf("data:image/webp") !== 0) {
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }
          resolve({
            dataUrl,
            name: file.name ? file.name.replace(/\.[^/.]+$/, "") : "Custom Wallpaper"
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleDashboardCustomUpload(file) {
    if (!file) return;
    try {
      const { dataUrl, name } = await optimizeDashboardWallpaper(file);
      const ts = state.proSettings.themeSettings;
      const customItem = {
        id: "custom_" + Date.now(),
        url: dataUrl,
        name: name || "Custom Wallpaper",
        timestamp: Date.now()
      };
      let list = Array.isArray(ts.customWallpapers) ? [...ts.customWallpapers] : [];
      list = list.filter(item => item.url !== dataUrl);
      list.unshift(customItem);
      if (list.length > 8) list = list.slice(0, 8);
      ts.customWallpapers = list;

      ts.wallpaperId = "custom";
      ts.customWallpaperUrl = dataUrl;
      ts.wallpaperUrl = dataUrl;
      ts.dynamicTimeShift = false;
      applyThemeEngine(ts);
      await saveProSettings(state.proSettings);
      if (mascot && mascot.cheer) {
        mascot.cheer({ message: "Applied custom 4K wallpaper! 🎨" });
      }
      renderProSuite();
    } catch (err) {
      console.error("Custom wallpaper upload error:", err);
      alert(err.message || "Could not process image.");
    }
  }

  // Custom Wallpaper drag and drop zone
  const proDropzone = el("proDropzone");
  const customWpFile = el("customWpFile");
  const uploadWpBtn = el("uploadWpBtn");

  if (uploadWpBtn && customWpFile) {
    uploadWpBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      customWpFile.click();
    });
  }

  if (proDropzone && customWpFile) {
    proDropzone.addEventListener("click", () => customWpFile.click());
    proDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      proDropzone.style.borderColor = "var(--violet)";
      proDropzone.style.background = "rgba(99, 102, 241, 0.12)";
    });
    proDropzone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      proDropzone.style.borderColor = "";
      proDropzone.style.background = "";
    });
    proDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      proDropzone.style.borderColor = "";
      proDropzone.style.background = "";
      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleDashboardCustomUpload(files[0]);
      }
    });

    customWpFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        handleDashboardCustomUpload(file);
      }
      e.target.value = "";
    });
  }

  // Custom Wallpaper URL
  if (el("applyCustomWpUrlBtn")) {
    const handleUrlApply = async () => {
      const url = el("customWpUrlInput").value.trim();
      if (!url) return;
      const ts = state.proSettings.themeSettings;
      const customItem = {
        id: "custom_" + Date.now(),
        url: url,
        name: "Custom Web Wallpaper",
        timestamp: Date.now()
      };
      let list = Array.isArray(ts.customWallpapers) ? [...ts.customWallpapers] : [];
      list = list.filter(item => item.url !== url);
      list.unshift(customItem);
      if (list.length > 8) list = list.slice(0, 8);
      ts.customWallpapers = list;

      ts.wallpaperId = "custom";
      ts.customWallpaperUrl = url;
      ts.wallpaperUrl = url;
      ts.dynamicTimeShift = false;
      applyThemeEngine(ts);
      await saveProSettings(state.proSettings);
      el("customWpUrlInput").value = "";
      renderProSuite();
    };

    el("applyCustomWpUrlBtn").addEventListener("click", handleUrlApply);
    if (el("customWpUrlInput")) {
      el("customWpUrlInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleUrlApply();
        }
      });
    }
  }

  // Wallpaper Fit Buttons in Dashboard
  const proFitGroup = el("proFitGroup");
  if (proFitGroup && !proFitGroup._hasFitListener) {
    proFitGroup._hasFitListener = true;
    proFitGroup.querySelectorAll(".wp-fit-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const fit = btn.dataset.fit;
        proFitGroup.querySelectorAll(".wp-fit-btn").forEach(b => b.classList.toggle("active", b === btn));
        state.proSettings.themeSettings.wallpaperFit = fit;
        applyThemeEngine(state.proSettings.themeSettings);
        await saveProSettings(state.proSettings);
      });
    });
  }

  // Sliders
  if (el("wpBlurSlider")) {
    el("wpBlurSlider").addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      el("blurValLabel").textContent = `${val}px`;
      state.proSettings.themeSettings.blurPx = val;
      applyThemeEngine(state.proSettings.themeSettings);
    });
    el("wpBlurSlider").addEventListener("change", () => saveProSettings(state.proSettings));
  }

  if (el("wpDimSlider")) {
    el("wpDimSlider").addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      el("dimValLabel").textContent = `${val}%`;
      state.proSettings.themeSettings.dimOpacity = val;
      applyThemeEngine(state.proSettings.themeSettings);
    });
    el("wpDimSlider").addEventListener("change", () => saveProSettings(state.proSettings));
  }

  if (el("wpBrightnessSlider")) {
    el("wpBrightnessSlider").addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      el("brightnessValLabel").textContent = `${val}%`;
      state.proSettings.themeSettings.brightnessPct = val;
      applyThemeEngine(state.proSettings.themeSettings);
    });
    el("wpBrightnessSlider").addEventListener("change", () => saveProSettings(state.proSettings));
  }

  if (el("wpContrastSlider")) {
    el("wpContrastSlider").addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      el("contrastValLabel").textContent = `${val}%`;
      state.proSettings.themeSettings.contrastPct = val;
      applyThemeEngine(state.proSettings.themeSettings);
    });
    el("wpContrastSlider").addEventListener("change", () => saveProSettings(state.proSettings));
  }

  if (el("wpSatSlider")) {
    el("wpSatSlider").addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      el("satValLabel").textContent = `${val}%`;
      state.proSettings.themeSettings.saturationPct = val;
      applyThemeEngine(state.proSettings.themeSettings);
    });
    el("wpSatSlider").addEventListener("change", () => saveProSettings(state.proSettings));
  }

  // Dashboard One-Click Presets
  const proPresetChips = el("proPresetChips");
  if (proPresetChips && !proPresetChips._hasPresetListener) {
    proPresetChips._hasPresetListener = true;
    proPresetChips.querySelectorAll(".wp-preset-chip").forEach(btn => {
      btn.addEventListener("click", async () => {
        const key = btn.dataset.preset;
        const preset = DASHBOARD_PRESETS[key];
        if (!preset) return;
        proPresetChips.querySelectorAll(".wp-preset-chip").forEach(b => b.classList.toggle("active", b === btn));
        const ts = state.proSettings.themeSettings;
        Object.assign(ts, preset);
        applyThemeEngine(ts);
        await saveProSettings(state.proSettings);
        renderProSuite();
      });
    });
  }

  // Reset Filters
  if (el("resetFiltersBtn")) {
    el("resetFiltersBtn").addEventListener("click", async () => {
      const ts = state.proSettings.themeSettings;
      ts.blurPx = 0;
      ts.dimOpacity = 0;
      ts.brightnessPct = 100;
      ts.contrastPct = 100;
      ts.saturationPct = 100;
      ts.particleType = "none";
      applyThemeEngine(ts);
      await saveProSettings(state.proSettings);
      renderProSuite();
    });
  }

  if (el("wallpaperRotationToggle")) {
    el("wallpaperRotationToggle").addEventListener("change", async (e) => {
      const rotation = state.proSettings.wallpaperRotation || (state.proSettings.wallpaperRotation = {});
      rotation.enabled = e.target.checked;
      rotation.cadence = el("wallpaperCadence").value;
      if (!rotation.lastRotatedAt) rotation.lastRotatedAt = Date.now();
      await saveProSettings(state.proSettings);
      if (el("wallpaperRotationText")) el("wallpaperRotationText").textContent = rotation.enabled ? "On" : "Off";
    });
  }
  if (el("wallpaperCadence")) {
    el("wallpaperCadence").addEventListener("change", async (e) => {
      const rotation = state.proSettings.wallpaperRotation || (state.proSettings.wallpaperRotation = {});
      rotation.cadence = e.target.value;
      await saveProSettings(state.proSettings);
    });
  }

  // Dynamic Time Shift Toggle
  if (el("proDynamicShiftToggle")) {
    el("proDynamicShiftToggle").addEventListener("change", async (e) => {
      const ts = state.proSettings.themeSettings;
      ts.dynamicTimeShift = e.target.checked;
      applyThemeEngine(ts);
      await saveProSettings(state.proSettings);
    });
  }

  // 3D Parallax Depth Toggle (permanently disabled)
  if (el("proParallaxToggle")) {
    el("proParallaxToggle").addEventListener("change", async () => {
      const ts = state.proSettings.themeSettings;
      ts.parallax3D = false;
      applyThemeEngine(ts);
      await saveProSettings(state.proSettings);
    });
  }

  if (el("focusStartBtn")) {
    el("focusStartBtn").addEventListener("click", async () => {
      const session = getFocusSession();
      if (session.running) {
        session.remainingSeconds = focusRemaining(session);
        session.running = false;
        session.startedAt = null;
        if (focusTimerId) { clearInterval(focusTimerId); focusTimerId = null; }
      } else {
        if (focusRemaining(session) === 0) session.remainingSeconds = session.duration * 60;
        session.intention = el("focusIntentionInput").value.trim();
        session.running = true;
        session.startedAt = Date.now();
        startFocusTicker();
      }
      await persistFocusSession();
      renderFocusSprint();
    });
  }
  if (el("focusResetBtn")) {
    el("focusResetBtn").addEventListener("click", async () => {
      const session = getFocusSession();
      session.running = false; session.startedAt = null; session.remainingSeconds = session.duration * 60;
      if (focusTimerId) { clearInterval(focusTimerId); focusTimerId = null; }
      await persistFocusSession(); renderFocusSprint();
    });
  }
  document.querySelectorAll(".focus-preset").forEach((btn) => btn.addEventListener("click", async () => {
    const session = getFocusSession();
    if (session.running) return;
    session.duration = Number(btn.dataset.minutes); session.remainingSeconds = session.duration * 60;
    await persistFocusSession(); renderFocusSprint();
  }));
  if (el("focusIntentionInput")) el("focusIntentionInput").addEventListener("change", async (e) => {
    getFocusSession().intention = e.target.value.trim(); await persistFocusSession();
  });

  // Speak / Cheer button
  if (el("compSpeakBtn")) {
    el("compSpeakBtn").addEventListener("click", () => {
      const p = state.proSettings;
      const comp = PRO_COMPANIONS.find((c) => c.id === p.activeCompanion) || PRO_COMPANIONS[0];
      const randomQuote = comp.quotePool[Math.floor(Math.random() * comp.quotePool.length)];
      if (el("compActiveQuote")) el("compActiveQuote").textContent = `"${randomQuote}"`;
      if (mascot && mascot.cheer) {
        mascot.cheer({ epic: true, message: `${comp.icon} "${randomQuote}"` });
      }
    });
  }

  // Ambient Soundscapes
  const sGrid = el("soundscapeGrid");
  if (sGrid) {
    sGrid.querySelectorAll(".sound-card").forEach((card) => {
      const sType = card.dataset.sound;
      const btn = card.querySelector(".sound-toggle-btn");
      if (btn) {
        btn.addEventListener("click", () => {
          if (state.activeSoundscape === sType) {
            stopAmbientSoundscape();
            state.activeSoundscape = null;
            card.classList.remove("playing");
            btn.textContent = "▶ Play";
          } else {
            // Stop any playing
            sGrid.querySelectorAll(".sound-card").forEach((c) => {
              c.classList.remove("playing");
              const b = c.querySelector(".sound-toggle-btn");
              if (b) b.textContent = "▶ Play";
            });
            playAmbientSoundscape(sType, state.soundVolume);
            state.activeSoundscape = sType;
            card.classList.add("playing");
            btn.textContent = "⏸ Pause";
          }
        });
      }
    });
  }

  if (el("soundVolumeSlider")) {
    el("soundVolumeSlider").addEventListener("input", (e) => {
      state.soundVolume = parseFloat(e.target.value);
      setAmbientVolume(state.soundVolume);
    });
  }

  // Claim Weekly Shield
  if (el("claimShieldBtn")) {
    el("claimShieldBtn").addEventListener("click", async () => {
      state.proSettings.streakShields = (state.proSettings.streakShields || 0) + 1;
      await saveProSettings(state.proSettings);
      renderProSuite();
      if (mascot && mascot.cheer) {
        mascot.cheer({ epic: true, message: "🛡️ Bonus Streak Shield claimed!" });
      }
      alert("🛡️ Free Weekly Streak Shield added to your account!");
    });
  }

  // Pro Power Tools
  if (el("proExportCsvBtn")) {
    el("proExportCsvBtn").addEventListener("click", () => {
      const csv = exportCSV(state.completions, state.habits);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cadence-pro-export-${dateKey(today)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (el("proExportIcalBtn")) {
    el("proExportIcalBtn").addEventListener("click", () => {
      const ics = generateICalFile(state.habits);
      const blob = new Blob([ics], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cadence-pro-schedule-${dateKey(today)}.ics`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (el("proOpenReportBtn")) {
    el("proOpenReportBtn").addEventListener("click", () => switchSection("reports"));
  }
}

if (el("exportCsvBtn")) {
  el("exportCsvBtn").addEventListener("click", () => {
    const FLObj = window.FL || FL;
    if (!FLObj || !FLObj.exportCSV) return;
    const csv = FLObj.exportCSV(state.completions, state.habits);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cadence-analytics-${dateKey(today)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

if (el("exportIcalBtn")) {
  el("exportIcalBtn").addEventListener("click", () => {
    const FLObj = window.FL || FL;
    if (!FLObj || !FLObj.generateICalFile) return;
    const ics = FLObj.generateICalFile(state.habits);
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cadence-schedule-${dateKey(today)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

el("importInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.habits) { state.habits = data.habits; await saveHabits(state.habits); }
      if (data.completions) { state.completions = data.completions; await saveCompletions(state.completions); }
      if (data.settings) { state.settings = data.settings; await saveSettings(state.settings); }
      alert("Backup restored successfully.");
      switchSection(state.section);
    } catch (err) {
      alert("That file couldn't be read as a valid Cadence backup.");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

el("resetBtn").addEventListener("click", async () => {
  if (!confirm("This will permanently delete all habits and logged progress. Continue?")) return;
  state.habits = [];
  state.completions = {};
  await saveHabits(state.habits);
  await saveCompletions(state.completions);
  switchSection(state.section);
});

let currentTheme = localStorage.getItem("cadence_theme") || "system";
function applyTheme(theme) {
  currentTheme = ["dark", "light", "system"].includes(theme) ? theme : "system";
  localStorage.setItem("cadence_theme", currentTheme);

  // Resolve "system" to actual mode for DOM attributes
  const prefersDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedMode = currentTheme === "system"
    ? (prefersDark ? "dark" : "light")
    : currentTheme;

  if (state.proSettings && state.proSettings.themeSettings) {
    state.proSettings.themeSettings.themeMode = currentTheme;
    applyThemeEngine(state.proSettings.themeSettings);
  } else {
    if (resolvedMode === "dark") {
      document.body.setAttribute("data-theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.body.removeAttribute("data-theme");
      document.documentElement.removeAttribute("data-theme");
    }
  }

  const btn = el("themeToggleBtn");
  if (btn) {
    btn.style.display = "flex";
    if (currentTheme === "dark") {
      btn.textContent = "☀️";
      btn.title = "Dark mode — click for Light";
    } else if (currentTheme === "light") {
      btn.textContent = "🌙";
      btn.title = "Light mode — click for System default";
    } else {
      btn.textContent = "🖥️";
      btn.title = "System default — click for Dark";
    }
  }
}

if (el("themeToggleBtn")) {
  el("themeToggleBtn").addEventListener("click", async () => {
    const nextTheme = currentTheme === "system" ? "dark" : currentTheme === "dark" ? "light" : "system";
    applyTheme(nextTheme);
    if (state.proSettings) {
      if (!state.proSettings.themeSettings) state.proSettings.themeSettings = { ...DEFAULT_THEME_SETTINGS };
      state.proSettings.themeSettings.themeMode = nextTheme;
      await saveProSettings(state.proSettings);
    }
  });
}

/* ------------------------------------------------------------------ */
/* Init                                                                 */
/* ------------------------------------------------------------------ */
(async function init() {
  state.proSettings = await loadProSettings();
  if (state.proSettings && state.proSettings.focusSession && state.proSettings.focusSession.running) {
    startFocusTicker();
  }
  const initialMode = (state.proSettings && state.proSettings.themeSettings && state.proSettings.themeSettings.themeMode) || currentTheme || "light";
  applyTheme(initialMode);

  mascot.init("dashboard");
  state.habits = await loadHabits();
  state.completions = await loadCompletions();
  state.settings = await loadSettings();
  el("settingsName").value = state.settings.name || "";

  // Daily Quote setup on Dashboard Overview
  if (el("dashQuoteText") && FL.getDailyQuote) {
    const q = FL.getDailyQuote();
    el("dashQuoteText").textContent = `"${q.quote}" — ${q.author}`;
  }

  const refreshQuote = () => {
    if (FL.getRandomQuote && el("dashQuoteText")) {
      const nq = FL.getRandomQuote();
      const qt = el("dashQuoteText");
      qt.style.opacity = "0";
      qt.style.transition = "opacity 0.2s ease";
      setTimeout(() => {
        qt.textContent = `"${nq.quote}" — ${nq.author}`;
        qt.style.opacity = "1";
      }, 200);
    }
  };

  if (el("dashRefreshQuoteBtn")) {
    el("dashRefreshQuoteBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      refreshQuote();
    });
  }
  if (el("dashDailyQuoteCard")) {
    el("dashDailyQuoteCard").addEventListener("click", refreshQuote);
  }

  const proBadge = document.querySelector(".pro-status-badge");
  if (proBadge) {
    proBadge.addEventListener("click", () => switchSection("pro"));
  }

  // Cadence AI Chatbot triggers
  const openCadence = (e) => {
    if (e) e.preventDefault();
    if (window.CadenceAgent) {
      window.CadenceAgent.open();
    }
  };
  const dashCadenceAiBtn = el("dashCadenceAiBtn");
  if (dashCadenceAiBtn) {
    const isBound = (dashCadenceAiBtn.dataset && dashCadenceAiBtn.dataset.cadenceBound) || (dashCadenceAiBtn.getAttribute && dashCadenceAiBtn.getAttribute("data-cadence-bound") === "true");
    if (!isBound) {
      if (dashCadenceAiBtn.dataset) dashCadenceAiBtn.dataset.cadenceBound = "true";
      if (dashCadenceAiBtn.setAttribute) dashCadenceAiBtn.setAttribute("data-cadence-bound", "true");
      dashCadenceAiBtn.addEventListener("click", openCadence);
    }
  }
  const dashTalkCadenceBtn = el("dashTalkCadenceBtn");
  if (dashTalkCadenceBtn) {
    const isBound = (dashTalkCadenceBtn.dataset && dashTalkCadenceBtn.dataset.cadenceBound) || (dashTalkCadenceBtn.getAttribute && dashTalkCadenceBtn.getAttribute("data-cadence-bound") === "true");
    if (!isBound) {
      if (dashTalkCadenceBtn.dataset) dashTalkCadenceBtn.dataset.cadenceBound = "true";
      if (dashTalkCadenceBtn.setAttribute) dashTalkCadenceBtn.setAttribute("data-cadence-bound", "true");
      dashTalkCadenceBtn.addEventListener("click", openCadence);
    }
  }

  initProPlanListeners();

  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#pro") switchSection("pro");
  });

  // Live cross-tab / extension synchronization
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(async (changes, area) => {
      if (area === "local") {
        let needsRefresh = false;
        if (changes.fl_habits) {
          state.habits = changes.fl_habits.newValue || [];
          needsRefresh = true;
        }
        if (changes.fl_completions) {
          state.completions = changes.fl_completions.newValue || {};
          needsRefresh = true;
        }
        if (changes.fl_pro_settings && changes.fl_pro_settings.newValue) {
          state.proSettings = changes.fl_pro_settings.newValue;
          if (state.proSettings && state.proSettings.themeSettings) {
            applyThemeEngine(state.proSettings.themeSettings);
          }
          needsRefresh = true;
        }
        if (needsRefresh) {
          if (state.section === "overview") renderOverview();
          else if (state.section === "habits") renderHabitsManage();
          else if (state.section === "pro") renderProSuite();
          else if (state.section === "reports") renderReport();
        }
      }
    });
  }

  if (window.location.hash === "#pro") {
    switchSection("pro");
  } else {
    switchSection("overview");
  }
})();
