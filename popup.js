const FL = window.FL || {};
const { CATEGORIES, CATEGORY_ORDER, DAY_NAMES, dateKey, getWeekDates, isSameDay, getValue, setValue, isHabitDone, habitStreak, dayScore, weeklySummary, loadHabits, saveHabits, loadCompletions, saveCompletions, charts, mascot } = FL;

const today = new Date();
let habits = [];
let completions = {};
let activeCategory = "all";
let currentTheme = localStorage.getItem("cadence_theme") || "light";
let proSettings = null;

const el = (id) => document.getElementById(id);

function applyTheme(theme) {
  currentTheme = ["dark", "light", "system"].includes(theme) ? theme : "system";
  localStorage.setItem("cadence_theme", currentTheme);

  // Resolve "system" to actual mode for DOM attributes
  const prefersDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedMode = currentTheme === "system"
    ? (prefersDark ? "dark" : "light")
    : currentTheme;

  if (proSettings && proSettings.themeSettings) {
    proSettings.themeSettings.themeMode = currentTheme;
    FL.applyThemeEngine(proSettings.themeSettings);
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

function showSaving() {
  const ind = el("saveIndicator");
  ind.textContent = "saving…";
  ind.classList.add("show");
}
function showSaved() {
  const ind = el("saveIndicator");
  ind.textContent = "saved ✓";
  setTimeout(() => ind.classList.remove("show"), 900);
}

async function persist() {
  showSaving();
  await saveCompletions(completions);
  showSaved();
}

function renderHeroRing(pct) {
  const svg = el("heroRing");
  const size = 76, cx = size / 2, cy = size / 2, r = 31;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;
  svg.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="7"/>
    <circle id="heroRingProgress" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#fff" stroke-width="7"
      stroke-dasharray="${circumference} ${circumference}" stroke-dashoffset="${circumference}" stroke-linecap="round"
      transform="rotate(-90 ${cx} ${cy})"/>
  `;
  el("heroPct").textContent = `${pct}%`;
  const progress = el("heroRingProgress");
  requestAnimationFrame(() => {
    progress.style.transition = "stroke-dashoffset 0.8s cubic-bezier(.2,.8,.25,1)";
    progress.style.strokeDashoffset = String(circumference - dash);
  });
}

function renderStreakTag(streak) {
  if (streak <= 0) return "";
  if (streak <= 3) return `<div class="streak-tag flame-low">🔥 ${streak}d</div>`;
  if (streak <= 7) return `<div class="streak-tag flame-mid">🔥✨ ${streak}d</div>`;
  if (streak <= 14) return `<div class="streak-tag flame-high">⚡🔥 ${streak}d</div>`;
  return `<div class="streak-tag flame-epic">💥🔥 ${streak}d</div>`;
}

function renderSmartInsight(score, bestStreak) {
  const banner = el("smartInsight");
  if (!banner) return;
  const total = score.total;
  const done = score.done;
  const pct = score.pct;

  let icon = "💡", text = "";
  if (total === 0) {
    icon = "🚀";
    text = "Use the input below to add your first habit!";
  } else if (pct === 100) {
    icon = "🎉";
    text = `All ${total} habits completed! ${bestStreak > 1 ? `${bestStreak}-day streak active!` : "Awesome work today!"}`;
  } else if (pct >= 50) {
    icon = "⚡";
    text = `Over halfway there! Only ${total - done} habit${total - done > 1 ? "s" : ""} left to hit 100%.`;
  } else if (done > 0) {
    icon = "🔥";
    text = `Great start! ${done} of ${total} done. Keep the momentum going!`;
  } else {
    icon = "⚔️";
    text = `Ready to conquer today? Check off your first habit!`;
  }

  banner.innerHTML = `<span style="font-size:14px;">${icon}</span> <span>${text}</span>`;
}

function detectCategory(name) {
  const n = name.toLowerCase();
  if (/water|gym|workout|move|walk|run|exercise|health|fitness|pushup|sport/i.test(n)) return "health";
  if (/food|eat|meal|snack|drink|diet|sugar|nutrition/i.test(n)) return "diet";
  if (/sleep|meditate|read|mind|journal|reflect|breathe|calm/i.test(n)) return "mind";
  if (/work|code|email|office|task|project|study|learn|focus|client/i.test(n)) return "work";
  return "personal";
}

function initQuickAdd() {
  const form = el("quickAddForm");
  const input = el("quickAddInput");
  if (!form || !input) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    const newHabit = {
      id: "h_" + Math.random().toString(36).slice(2, 9),
      name: val,
      category: detectCategory(val),
      type: "check",
      createdAt: Date.now(),
    };
    habits.push(newHabit);
    await saveHabits(habits);
    input.value = "";
    render();
    if (mascot && mascot.cheer) {
      mascot.cheer({ message: `Added "${val}" to your list! ⚔️` });
    }
  });
}

function initCategoryPills() {
  const container = el("categoryPills");
  if (!container) return;
  container.querySelectorAll(".cat-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".cat-pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.cat || "all";
      renderTodayList(dayScore(habits, completions, today));
    });
  });
}

/* ---------------------------------------------------------------------
 * Ambient background — cinematic plasma mesh & stardust bokeh particles
 * ------------------------------------------------------------------- */
function initAmbientFx() {
  const canvas = el("fxCanvas");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    w = document.body.scrollWidth || 500;
    h = Math.max(document.body.scrollHeight, window.innerHeight || 720);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  let mouseX = w / 2, mouseY = 150;
  window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  const colors = ["#6C5CE7", "#00B894", "#0984E3", "#E84393", "#F0932B"];
  const orbs = Array.from({ length: 6 }, (_, i) => ({
    x: Math.random() * w,
    y: Math.random() * (h * 0.7),
    r: 90 + Math.random() * 90,
    color: colors[i % colors.length],
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.25,
    phase: Math.random() * Math.PI * 2,
    baseR: 90 + Math.random() * 90,
  }));

  const particles = Array.from({ length: 28 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 1 + Math.random() * 2.5,
    vy: 0.15 + Math.random() * 0.35,
    vx: (Math.random() - 0.5) * 0.15,
    alpha: 0.2 + Math.random() * 0.6,
    twinkle: Math.random() * Math.PI * 2,
  }));

  let t = 0;
  function tick() {
    t += 0.015;
    ctx.clearRect(0, 0, w, h);

    // 1. Plasma Mesh Orbs
    orbs.forEach((o) => {
      const dx = mouseX - o.x;
      const dy = mouseY - o.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 220 && dist > 0) {
        o.x += (dx / dist) * 0.4;
        o.y += (dy / dist) * 0.4;
      }

      o.x += o.vx + Math.sin(t * 0.8 + o.phase) * 0.4;
      o.y += o.vy + Math.cos(t * 0.6 + o.phase) * 0.3;

      if (o.x < -o.r) o.x = w + o.r;
      if (o.x > w + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = h + o.r;
      if (o.y > h + o.r) o.y = -o.r;

      const pulse = 1 + Math.sin(t * 1.2 + o.phase) * 0.12;
      const radius = o.baseR * pulse;

      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, radius);
      grad.addColorStop(0, o.color + "38");
      grad.addColorStop(0.5, o.color + "1A");
      grad.addColorStop(1, o.color + "00");

      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(o.x, o.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Floating Stardust Bokeh
    particles.forEach((p) => {
      p.y -= p.vy;
      p.x += p.vx + Math.sin(t + p.twinkle) * 0.2;

      if (p.y < -10) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

      const alpha = p.alpha * (0.6 + 0.4 * Math.sin(t * 2 + p.twinkle));
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(tick);
  }
  tick();
}

function initHeroFx() {
  const canvas = el("heroFx");
  if (!canvas || !canvas.getContext) return;
  const parent = canvas.parentElement || document.body;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
  function resize() {
    const rect = parent.getBoundingClientRect();
    w = canvas.width = (rect.width || 460) * dpr;
    h = canvas.height = (rect.height || 140) * dpr;
    canvas.style.width = (rect.width || 460) + "px";
    canvas.style.height = (rect.height || 140) + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);
  const rectW = parent.clientWidth || 460, rectH = parent.clientHeight || 140;
  const sparks = Array.from({ length: 22 }, () => ({
    x: Math.random() * rectW, y: Math.random() * rectH,
    r: 0.6 + Math.random() * 1.6,
    vy: 0.08 + Math.random() * 0.18,
    tw: Math.random() * Math.PI * 2,
  }));
  let t = 0;
  function tick() {
    t += 0.05;
    const rw = parent.clientWidth || 460, rh = parent.clientHeight || 140;
    ctx.clearRect(0, 0, rw, rh);
    sparks.forEach((s) => {
      s.y -= s.vy;
      if (s.y < -4) { s.y = rh + 4; s.x = Math.random() * rw; }
      const alpha = 0.25 + 0.35 * Math.abs(Math.sin(t + s.tw));
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  tick();
}

let confettiPlayedForToday = false;
function playConfetti() {
  const canvas = el("confettiCanvas");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const colors = ["#6C5CE7", "#00B894", "#F0932B", "#0984E3", "#E84393"];
  const pieces = Array.from({ length: 90 }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 60,
    y: 90,
    vx: (Math.random() - 0.5) * 6,
    vy: -Math.random() * 6 - 3,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.3,
    size: 4 + Math.random() * 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 0,
  }));
  let frame = 0;
  function tick() {
    frame++;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    let alive = false;
    pieces.forEach((p) => {
      p.vy += 0.13;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
      if (p.life < 130) alive = true;
      const alpha = Math.max(0, 1 - p.life / 130);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (alive && frame < 160) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
  tick();
}

function checkSvg() {
  return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><path d="M20 6 9 17l-5-5"/></svg>`;
}

function celebrateCompletion(habit, wasDone) {
  const nowDone = isHabitDone(habit, getValue(completions, dateKey(today), habit.id));
  if (!wasDone && nowDone) cheerForProgress();
}

function cheerForProgress() {
  const score = dayScore(habits, completions, today);
  mascot.cheer(score.total > 0 && score.pct === 100 ? { epic: true } : undefined);
}

function renderTodayList(score) {
  const list = el("todayList");
  list.innerHTML = "";
  if (habits.length === 0) {
    list.innerHTML = `<div class="empty-note">No habits added yet. Use the quick add input above to start!</div>`;
    return;
  }
  const dateStr = dateKey(today);
  const filtered = activeCategory === "all" ? habits : habits.filter((h) => h.category === activeCategory);

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-note">No habits in this category for today.</div>`;
    return;
  }

  filtered.forEach((h, idx) => {
    const cat = CATEGORIES[h.category] || CATEGORIES.personal;
    const v = getValue(completions, dateStr, h.id);
    const done = isHabitDone(h, v);
    const streak = habitStreak(h, completions);
    const item = document.createElement("div");
    item.className = "today-item" + (done ? " done" : "");
    item.style.setProperty("--cat-color", cat.color);
    item.style.setProperty("--cat-soft", cat.soft);

    let rightControl;
    if (h.type === "numeric") {
      const val = Number(v) || 0;
      rightControl = `<div class="numeric-controls">
        <button data-act="dec" data-id="${h.id}">–</button>
        <span class="val">${val}/${h.target}</span>
        <button data-act="inc" data-id="${h.id}">+</button>
      </div>`;
    } else {
      rightControl = renderStreakTag(streak);
    }

    item.innerHTML = `
      <span class="cat-dot"></span>
      <div class="check-circle">${done ? checkSvg() : ""}</div>
      <div style="flex:1;min-width:0;">
        <div class="habit-name">${FL.esc(h.name)}</div>
        <div class="habit-meta">${cat.icon} ${cat.name}${h.cue ? ` · ⚓ ${FL.esc(h.cue)}` : ""}${h.minimum ? ` · min: ${FL.esc(h.minimum)}` : ""}</div>
      </div>
      ${!done && h.minimum ? `<button class="min-quick-btn" data-min="${h.id}" title="Execute 2-min minimum to protect streak">⚡ Min</button>` : ""}
      ${rightControl}
    `;
    item.style.animationDelay = `${0.05 + idx * 0.04}s`;

    const minBtn = item.querySelector("[data-min]");
    if (minBtn) {
      minBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        setValue(completions, dateStr, h.id, { minimum: true, completedAt: Date.now() });
        celebrateCompletion(h, false);
        persist();
        render();
      });
    }

    if (h.type === "numeric") {
      const circle = item.querySelector(".check-circle");
      if (circle) {
        circle.style.cursor = "pointer";
        circle.addEventListener("click", (e) => {
          e.stopPropagation();
          const cur = Number(getValue(completions, dateStr, h.id)) || 0;
          const wasDone = isHabitDone(h, cur);
          const next = wasDone ? 0 : (h.target || 1);
          setValue(completions, dateStr, h.id, next);
          celebrateCompletion(h, wasDone);
          persist();
          render();
        });
      }

      item.querySelectorAll(".numeric-controls button").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const cur = Number(getValue(completions, dateStr, h.id)) || 0;
          const step = h.target && h.target <= 10 ? 1 : Math.max(1, Math.round(h.target / 8));
          const wasDone = isHabitDone(h, cur);
          const next = btn.dataset.act === "inc" ? cur + step : Math.max(0, cur - step);
          setValue(completions, dateStr, h.id, next);
          celebrateCompletion(h, wasDone);
          persist();
          render();
        });
      });
    } else {
      item.addEventListener("click", () => {
        if (!done) {
          setValue(completions, dateStr, h.id, true);
          cheerForProgress();
        } else {
          setValue(completions, dateStr, h.id, false);
        }
        persist();
        render();
      });
    }
    list.appendChild(item);
  });
}

function renderProgressStrip() {
  const score = dayScore(habits, completions, today);
  const weekDates = getWeekDates(0);
  const weekSum = weeklySummary(habits, completions, weekDates);

  el("popupDailyPct").textContent = `${score.pct}%`;
  el("popupWeeklyPct").textContent = `${weekSum.pct}%`;

  el("popupDailyGauge").innerHTML = charts.radialGauge(score.pct, {
    size: 72, stroke: 7, color1: "#6C5CE7", color2: "#8E7CF6",
  });

  const dailyCats = CATEGORY_ORDER.map((c) => {
    const cat = score.byCategory[c];
    if (!cat || cat.total <= 0) return null;
    return { c, pct: Math.round((cat.done / cat.total) * 100) };
  }).filter(Boolean).slice(0, 4);

  el("popupDailyBars").innerHTML = dailyCats.length
    ? dailyCats.map(({ c, pct }) => `<div class="popup-bar-row">
        <span class="icon">${CATEGORIES[c].icon}</span>
        <div class="track"><div class="fill" style="width:${pct}%;background:${CATEGORIES[c].color}"></div></div>
        <span>${pct}%</span>
      </div>`).join("")
    : `<div style="font-size:10px;color:var(--ink-soft);text-align:center">No habits yet</div>`;

  const dayData = weekSum.days.map((d, i) => ({
    label: DAY_NAMES[i].slice(0, 1),
    pct: d.pct,
    byCategory: d.byCategory,
    isToday: isSameDay(weekDates[i], today),
  }));
  el("popupWeekChart").innerHTML = charts.weekMiniChart(dayData, { width: 200, height: 72, uidSeed: 9 });
}

function render() {
  const score = dayScore(habits, completions, today);
  el("todayChip").textContent = today.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  el("heroDone").textContent = `${score.done}/${score.total}`;
  let bestStreak = 0;
  habits.forEach((h) => { bestStreak = Math.max(bestStreak, habitStreak(h, completions)); });
  el("heroStreak").textContent = bestStreak;
  renderHeroRing(score.pct);
  renderSmartInsight(score, bestStreak);
  renderProgressStrip();
  renderTodayList(score);

  if (mascot && mascot.updateProgress) {
    mascot.updateProgress(completions, habits);
  }

  if (score.total > 0 && score.pct === 100 && !confettiPlayedForToday) {
    confettiPlayedForToday = true;
    playConfetti();
  } else if (score.pct < 100) {
    confettiPlayedForToday = false;
  }
}

let pomoMode = "focus"; // "focus", "short_break", "long_break"
let pomoTimeLeft = 25 * 60;
let pomoTimerId = null;
let pomoRunning = false;
let activeSoundscape = "off";

function getPomoDuration(mode) {
  if (mode === "short_break") return 5 * 60;
  if (mode === "long_break") return 15 * 60;
  return 25 * 60;
}

function openPomoModal() {
  let modal = el("pomoModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "pomoModal";
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(11, 8, 19, 0.75); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; padding: 16px;
    `;
    document.body.appendChild(modal);
  }

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  modal.innerHTML = `
    <div style="
      background: var(--card, #151124); border: 1.5px solid var(--line, #27213C);
      border-radius: 24px; width: 100%; max-width: 360px; padding: 22px;
      box-shadow: 0 24px 50px rgba(0,0,0,0.6); font-family: 'Inter', sans-serif; color: var(--ink, #fff); text-align: center;
    ">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
        <h3 style="margin:0; font-family:'Poppins',sans-serif; font-size:16px; display:flex; align-items:center; gap:6px;">
          <span>⏱️ Focus Timer</span>
          <span style="font-size:10px; background:linear-gradient(135deg,#6C5CE7,#E84393); color:#fff; padding:2px 7px; border-radius:10px;">PRO</span>
        </h3>
        <button id="closePomoModal" style="background:none; border:none; color:var(--ink-soft,#8a8fa3); font-size:18px; cursor:pointer;">✕</button>
      </div>

      <!-- Mode Selector Pills -->
      <div style="display:flex; gap:6px; background:rgba(255,255,255,0.04); padding:4px; border-radius:12px; margin-bottom:14px;">
        <button class="pomo-mode-tab ${pomoMode === "focus" ? "active" : ""}" data-mode="focus" style="flex:1; border:none; border-radius:8px; padding:6px; font-size:11px; font-weight:700; cursor:pointer; background:${pomoMode === "focus" ? "#6C5CE7" : "transparent"}; color:#fff;">Focus (25m)</button>
        <button class="pomo-mode-tab ${pomoMode === "short_break" ? "active" : ""}" data-mode="short_break" style="flex:1; border:none; border-radius:8px; padding:6px; font-size:11px; font-weight:700; cursor:pointer; background:${pomoMode === "short_break" ? "#00B894" : "transparent"}; color:#fff;">Rest (5m)</button>
        <button class="pomo-mode-tab ${pomoMode === "long_break" ? "active" : ""}" data-mode="long_break" style="flex:1; border:none; border-radius:8px; padding:6px; font-size:11px; font-weight:700; cursor:pointer; background:${pomoMode === "long_break" ? "#0984E3" : "transparent"}; color:#fff;">Break (15m)</button>
      </div>

      <div id="pomoDisplay" style="font-family:'Poppins',sans-serif; font-size:46px; font-weight:800; color:var(--violet,#6C5CE7); margin:10px 0; letter-spacing:-0.02em;">
        ${formatTime(pomoTimeLeft)}
      </div>

      <div style="display:flex; justify-content:center; gap:10px; margin-bottom:18px;">
        <button id="startPomoBtn" style="background:linear-gradient(135deg,#6C5CE7,#8E7CF6); color:#fff; border:none; border-radius:14px; padding:10px 22px; font-size:13px; font-weight:700; cursor:pointer; box-shadow:0 6px 16px rgba(108,92,231,0.35);">
          ${pomoRunning ? "Pause" : "Start Sprint"}
        </button>
        <button id="resetPomoBtn" style="background:var(--line,#27213C); color:var(--ink,#fff); border:none; border-radius:14px; padding:10px 16px; font-size:13px; font-weight:600; cursor:pointer;">Reset</button>
      </div>

      <div style="text-align:left; background:rgba(255,255,255,0.03); border:1px solid var(--line,#27213C); border-radius:14px; padding:12px; font-size:11.5px;">
        <div style="font-weight:700; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between;">
          <span>🎧 Deep Ambient Soundscape</span>
          <select id="soundscapeSelect" style="background:var(--card,#151124); color:var(--ink,#fff); border:1px solid var(--line,#27213C); border-radius:8px; padding:4px 8px; font-size:11px; outline:none;">
            <option value="off" ${activeSoundscape === "off" ? "selected" : ""}>🔇 Off</option>
            <option value="lofi_rain" ${activeSoundscape === "lofi_rain" ? "selected" : ""}>🌧️ Tokyo Rain</option>
            <option value="zen_bowls" ${activeSoundscape === "zen_bowls" ? "selected" : ""}>🧘 Zen Bowls (432Hz)</option>
            <option value="cosmic_drift" ${activeSoundscape === "cosmic_drift" ? "selected" : ""}>🌌 Cosmic Drift</option>
            <option value="cyber_cafe" ${activeSoundscape === "cyber_cafe" ? "selected" : ""}>☕ Cyber Cafe Lo-Fi</option>
          </select>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
          <span>🛡️ Focus Lock Mode</span>
          <span style="color:#00B894; font-weight:700; font-size:10.5px;">ACTIVE</span>
        </div>
      </div>
    </div>
  `;

  modal.querySelector("#closePomoModal").addEventListener("click", () => modal.remove());

  const startBtn = modal.querySelector("#startPomoBtn");
  const display = modal.querySelector("#pomoDisplay");

  // Mode switching
  modal.querySelectorAll(".pomo-mode-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      clearInterval(pomoTimerId);
      pomoRunning = false;
      pomoMode = btn.dataset.mode;
      pomoTimeLeft = getPomoDuration(pomoMode);
      openPomoModal();
    });
  });

  startBtn.addEventListener("click", () => {
    pomoRunning = !pomoRunning;
    startBtn.textContent = pomoRunning ? "Pause" : "Start Sprint";
    if (pomoRunning) {
      pomoTimerId = setInterval(() => {
        if (pomoTimeLeft > 0) {
          pomoTimeLeft--;
          if (display) display.textContent = formatTime(pomoTimeLeft);
        } else {
          clearInterval(pomoTimerId);
          pomoRunning = false;
          if (display) display.textContent = "00:00";
          if (FL && FL.playAmbientSoundscape) FL.stopAmbientSoundscape();
          if (mascot && mascot.cheer) {
            mascot.cheer({ epic: true, message: "Focus Sprint Complete! 🏆 Take a breather." });
          }
        }
      }, 1000);
    } else {
      clearInterval(pomoTimerId);
    }
  });

  modal.querySelector("#resetPomoBtn").addEventListener("click", () => {
    clearInterval(pomoTimerId);
    pomoRunning = false;
    pomoTimeLeft = getPomoDuration(pomoMode);
    if (display) display.textContent = formatTime(pomoTimeLeft);
    if (startBtn) startBtn.textContent = "Start Sprint";
  });

  modal.querySelector("#soundscapeSelect").addEventListener("change", (e) => {
    activeSoundscape = e.target.value;
    if (activeSoundscape === "off") {
      if (FL && FL.stopAmbientSoundscape) FL.stopAmbientSoundscape();
    } else {
      if (FL && FL.playAmbientSoundscape) FL.playAmbientSoundscape(activeSoundscape, 0.45);
    }
  });
}

function openRitualModal() {
  let modal = el("ritualModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "ritualModal";
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(11, 8, 19, 0.75); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; padding: 16px;
    `;
    document.body.appendChild(modal);
  }

  const isEvening = new Date().getHours() >= 18;

  modal.innerHTML = `
    <div style="
      background: var(--card, #151124); border: 1.5px solid var(--line, #27213C);
      border-radius: 20px; width: 100%; max-width: 380px; padding: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5); font-family: 'Inter', sans-serif; color: var(--ink, #fff);
    ">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
        <h3 style="margin:0; font-family:'Poppins',sans-serif; font-size:16px;">${isEvening ? "🌙 Evening Reflection & Gratitude" : "🌅 Morning Ritual & Focus"}</h3>
        <button id="closeRitualModal" style="background:none; border:none; color:var(--ink-soft,#8a8fa3); font-size:18px; cursor:pointer;">✕</button>
      </div>

      ${isEvening ? `
        <p style="font-size:11.5px; color:var(--ink-soft,#8a8fa3); margin:0 0 12px;">What is 1 thing that went well or that you feel grateful for today?</p>
        <textarea id="gratitudeInput" style="width:100%; height:70px; background:rgba(255,255,255,0.04); border:1.5px solid var(--line,#27213C); border-radius:12px; padding:10px; font-family:'Inter',sans-serif; font-size:12px; color:var(--ink,#fff); outline:none; resize:none; margin-bottom:12px;" placeholder="Today I am grateful for..."></textarea>
        <button id="saveGratitudeBtn" style="width:100%; background:linear-gradient(135deg,#6C5CE7,#00B894); color:#fff; border:none; border-radius:12px; padding:10px; font-weight:700; cursor:pointer;">Save Gratitude & Complete Day ✨</button>
      ` : `
        <p style="font-size:11.5px; color:var(--ink-soft,#8a8fa3); margin:0 0 12px;">Set your intent: Which top 3 habits are your non-negotiables for today?</p>
        <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:14px;">
          ${habits.slice(0, 3).map((h) => `<div style="font-size:12px; font-weight:600; padding:8px 10px; background:rgba(108,92,231,0.1); border-radius:10px;">🎯 ${FL.esc(h.name)}</div>`).join("")}
        </div>
        <button id="confirmMorningBtn" style="width:100%; background:linear-gradient(135deg,#6C5CE7,#8E7CF6); color:#fff; border:none; border-radius:12px; padding:10px; font-weight:700; cursor:pointer;">Lock In Priorities 🚀</button>
      `}
    </div>
  `;

  modal.querySelector("#closeRitualModal").addEventListener("click", () => modal.remove());

  const saveG = modal.querySelector("#saveGratitudeBtn");
  if (saveG) {
    saveG.addEventListener("click", async () => {
      const txt = modal.querySelector("#gratitudeInput").value.trim();
      if (txt && FL.saveGratitudeNotes) {
        const notes = await FL.loadGratitudeNotes();
        notes[dateKey(today)] = txt;
        await FL.saveGratitudeNotes(notes);
      }
      modal.remove();
      if (mascot && mascot.cheer) mascot.cheer({ epic: true, message: "Evening reflection saved! 🌙" });
    });
  }

  const confirmM = modal.querySelector("#confirmMorningBtn");
  if (confirmM) {
    confirmM.addEventListener("click", () => {
      modal.remove();
      if (mascot && mascot.cheer) mascot.cheer({ message: "Priorities locked! Let's conquer today! ⚔️" });
    });
  }
}

async function openNotesModal() {
  let modal = document.getElementById("cadenceNotesModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "cadenceNotesModal";
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.65);
      backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center;
      z-index: 99999; padding: 16px;
    `;
    document.body.appendChild(modal);
  }

  const dKey = dateKey(today);
  const dailyNotes = FL.loadDailyNotes ? await FL.loadDailyNotes() : {};
  const currentNote = (dailyNotes && dailyNotes[dKey]) ? dailyNotes[dKey] : "";

  modal.innerHTML = `
    <div style="
      background: var(--card, #151124); border: 1.5px solid var(--line, #27213C);
      border-radius: 20px; width: 100%; max-width: 380px; padding: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5); font-family: 'Inter', sans-serif; color: var(--ink, #fff);
    ">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
        <h3 style="margin:0; font-family:'Poppins',sans-serif; font-size:16px;">📝 Daily Notes &amp; Thoughts</h3>
        <button id="closeNotesModal" style="background:none; border:none; color:var(--ink-soft,#8a8fa3); font-size:18px; cursor:pointer;">✕</button>
      </div>
      <p style="font-size:11.5px; color:var(--ink-soft,#8a8fa3); margin:0 0 10px;">Jot down key tasks, breakthroughs, or focus reminders for today. These will be included in your Weekly Report.</p>
      <textarea id="popupNoteInput" style="width:100%; height:130px; background:rgba(255,255,255,0.04); border:1.5px solid var(--line,#27213C); border-radius:12px; padding:10px; font-family:'Inter',sans-serif; font-size:12.5px; color:var(--ink,#fff); outline:none; resize:none; margin-bottom:12px; line-height:1.4;" placeholder="• Top outcome for today...\n• Key meeting note...\n• Focus reminder...">${FL.esc(currentNote)}</textarea>
      <button id="savePopupNoteBtn" style="width:100%; background:linear-gradient(135deg,#6C5CE7,#8E7CF6); color:#fff; border:none; border-radius:12px; padding:10px; font-weight:700; cursor:pointer;">Save Today's Note 💾</button>
    </div>
  `;

  modal.querySelector("#closeNotesModal").addEventListener("click", () => modal.remove());
  modal.querySelector("#savePopupNoteBtn").addEventListener("click", async () => {
    const val = modal.querySelector("#popupNoteInput").value.trim();
    dailyNotes[dKey] = val;
    if (FL.saveDailyNotes) {
      await FL.saveDailyNotes(dailyNotes);
    } else {
      await chrome.storage.local.set({ fl_notes_daily: dailyNotes });
    }
    modal.remove();
    if (mascot && mascot.cheer) mascot.cheer({ message: "Daily note saved! 📝" });
  });
}

el("openDashboard").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
});

(async function init() {
  // 1. Load data FIRST so habits and completions are ready before any render
  proSettings = await FL.loadProSettings();
  settings = await loadSettings();
  habits = await loadHabits();
  completions = await loadCompletions();

  const isIframe = typeof window !== "undefined" && window.self !== window.top;
  if (!isIframe && FL.saasGate) {
    const isEntitled = await FL.saasGate.protectPage({
      onEntitled: () => {
        render();
      }
    });
    if (!isEntitled) return;
  }

  const initialMode = (proSettings && proSettings.themeSettings && proSettings.themeSettings.themeMode) || "system";
  applyTheme(initialMode);

  if (el("themeToggleBtn")) {
    el("themeToggleBtn").addEventListener("click", async () => {
      const nextTheme = currentTheme === "system" ? "dark" : currentTheme === "dark" ? "light" : "system";
      applyTheme(nextTheme);
      if (proSettings) {
        if (!proSettings.themeSettings) proSettings.themeSettings = { ...FL.DEFAULT_THEME_SETTINGS };
        proSettings.themeSettings.themeMode = nextTheme;
        await FL.saveProSettings(proSettings);
      }
    });
  }

  mascot.init("popup");
  initAmbientFx();
  initHeroFx();
  initQuickAdd();
  initCategoryPills();

  if (el("proStatusPill")) {
    el("proStatusPill").addEventListener("click", () => {
      if (FL.saasUI) {
        FL.saasUI.showManagementModal();
      } else {
        chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html#pro") });
      }
    });
  }

  // Dynamic Streak Shield display
  try {
    const proSettings = typeof loadProSettings === "function" ? await loadProSettings() : null;
    const shields = (proSettings && typeof proSettings.streakFreezes === "number") ? proSettings.streakFreezes : 2;
    if (el("streakShieldCount")) el("streakShieldCount").textContent = shields;
  } catch (_) {}

  if (el("pomoTimerBtn")) el("pomoTimerBtn").addEventListener("click", openPomoModal);
  if (el("ritualModeBtn")) el("ritualModeBtn").addEventListener("click", openRitualModal);
  if (el("popupNotesBtn")) el("popupNotesBtn").addEventListener("click", openNotesModal);
  const popCadence = el("popupCadenceBtn");
  if (popCadence) {
    const isBound = (popCadence.dataset && popCadence.dataset.cadenceBound) || (popCadence.getAttribute && popCadence.getAttribute("data-cadence-bound") === "true");
    if (!isBound) {
      if (popCadence.dataset) popCadence.dataset.cadenceBound = "true";
      if (popCadence.setAttribute) popCadence.setAttribute("data-cadence-bound", "true");
      popCadence.addEventListener("click", () => {
        try {
          if (window.parent && window.parent !== window && window.parent.CadenceAgent) {
            if (typeof window.parent.closeTrackerModal === "function") {
              window.parent.closeTrackerModal();
            }
            window.parent.CadenceAgent.open();
            return;
          }
        } catch (e) {}

        if (window.CadenceAgent) {
          window.CadenceAgent.open();
        }
      });
    }
  }

  // Daily Motivational Quote setup
  if (el("dailyQuoteText") && FL.getDailyQuote) {
    const q = FL.getDailyQuote();
    el("dailyQuoteText").textContent = `"${q.quote}" — ${q.author}`;
  }

  if (el("dailyQuoteBanner")) {
    el("dailyQuoteBanner").style.cursor = "pointer";
    el("dailyQuoteBanner").title = "Click to get a fresh motivational quote ✨";
    el("dailyQuoteBanner").addEventListener("click", () => {
      if (FL.getRandomQuote && el("dailyQuoteText")) {
        const nq = FL.getRandomQuote();
        const qt = el("dailyQuoteText");
        qt.style.opacity = "0";
        qt.style.transition = "opacity 0.2s ease";
        setTimeout(() => {
          qt.textContent = `"${nq.quote}" — ${nq.author}`;
          qt.style.opacity = "1";
        }, 200);
      }
    });
  }

  // Live cross-tab / extension synchronization
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(async (changes, area) => {
      if (area === "local") {
        let needsRefresh = false;
        if (changes.fl_habits) {
          habits = changes.fl_habits.newValue || [];
          needsRefresh = true;
        }
        if (changes.fl_completions) {
          completions = changes.fl_completions.newValue || {};
          needsRefresh = true;
        }
        if (changes.fl_pro_settings && changes.fl_pro_settings.newValue) {
          proSettings = changes.fl_pro_settings.newValue;
          if (proSettings && proSettings.themeSettings) {
            applyTheme(proSettings.themeSettings.themeMode || "system");
          }
          needsRefresh = true;
        }
        if (needsRefresh) {
          render();
        }
      }
    });
  }

  render();
})();
