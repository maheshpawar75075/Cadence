/* Star Knight — cinematic image-based cheer mascot */
(function (global) {
  "use strict";

  const GREETING_LINES = [
    "Focus locked. Let's execute.",
    "Ready to build momentum today?",
    "Discipline equals freedom.",
    "Consistency is competitive advantage.",
    "Small daily habits, monumental results.",
    "Time to execute with precision.",
  ];

  const CHEER_LINES = [
    "Executed!",
    "Peak focus!",
    "Milestone achieved!",
    "Unstoppable rhythm!",
    "Flawless execution!",
    "Forward momentum!",
    "Target locked!",
    "Excellence!",
    "Great work!",
  ];

  const CLICK_LINES = [
    "Guarding your cadence. ⚡",
    "Every habit compounds over time.",
    "Maintain the daily momentum.",
    "Relentless focus on execution.",
    "Precision and discipline every day.",
    "Peak performance in progress.",
    "Mastery is a daily pursuit.",
  ];

  const EPIC_LINES = [
    "100% PERFECT DAY!",
    "ALL TARGETS COMPLETED!",
    "PEAK PERFORMANCE ACHIEVED!",
    "FLAWLESS DAY EXECUTION!",
  ];

  const CHEER_MS = 1800;
  const EPIC_MS = 2400;

  let cheerTimer = null;
  let bubbleTimer = null;
  let fxFrame = null;
  let particles = [];

  function asset(path) {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL(path);
    }
    return path;
  }

  const AURAS = [
    { id: "violet", name: "Cosmic Violet", minStreak: 0 },
    { id: "gold", name: "Solar Gold", minStreak: 3 },
    { id: "emerald", name: "Emerald Pulse", minStreak: 7 },
    { id: "cyber", name: "Cyber Neon", minStreak: 14 },
    { id: "crimson", name: "Hyper Crimson", minStreak: 30 },
  ];

  let currentAuraIndex = 0;
  let lastLevel = null;
  let currentStreak = 0;

  function getTimeOfDayClass() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "mascot-stage--dawn";
    if (hour >= 11 && hour < 17) return "mascot-stage--day";
    if (hour >= 17 && hour < 20) return "mascot-stage--sunset";
    return "mascot-stage--night";
  }

  function mascotHtml(variant) {
    const idle = asset("assets/knight-idle.png");
    const cheer = asset("assets/knight-cheer.png");
    const todClass = getTimeOfDayClass();
    return `
      <div id="cadenceMascot" class="mascot mascot--${variant} aura-violet" aria-hidden="true">
        <canvas class="mascot-fx" id="mascotFx"></canvas>
        <div class="mascot-bubble" id="mascotBubble" title="Click to hear from Star Knight"></div>
        <div class="mascot-stage ${todClass}" id="mascotStage" title="Click to interact with Star Knight">
          <div class="mascot-backdrop"></div>
          <div class="mascot-glow-ring"></div>
          <div class="mascot-ground-shine"></div>
          <div class="mascot-rig">
            <div class="mascot-frame">
              <img class="mascot-img mascot-img--idle" src="${idle}" alt="" draggable="false"/>
              <img class="mascot-img mascot-img--cheer" src="${cheer}" alt="" draggable="false"/>
              <div class="mascot-shimmer"></div>
              <div class="mascot-vignette"></div>
              <div class="mascot-film-grain"></div>
            </div>
          </div>
          <div class="mascot-level-badge" id="mascotLevelBadge" title="Click to switch Elemental Aura">
            <span class="mascot-lvl-txt" id="mascotLvlTxt">Lvl 1 Novice</span>
            <div class="mascot-xp-bar"><div class="mascot-xp-fill" id="mascotXpFill"></div></div>
          </div>
        </div>
      </div>`;
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pickLine(epic) {
    const pool = epic ? EPIC_LINES : CHEER_LINES;
    return pickRandom(pool);
  }

  function ensureFxCanvas(root) {
    const canvas = root.querySelector("#mascotFx");
    if (!canvas || !canvas.getContext) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = root.getBoundingClientRect();
    const padW = 120, padH = 80;
    canvas.width = (rect.width + padW) * dpr;
    canvas.height = (rect.height + padH) * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: rect.width + padW, h: rect.height + padH, cx: rect.width / 2 + padW / 2, cy: rect.height * 0.45 + padH / 2 };
  }

  function drawStar(ctx, x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = rot + (i * Math.PI * 2) / 5 - Math.PI / 2;
      const b = rot + ((i + 0.5) * Math.PI * 2) / 5 - Math.PI / 2;
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.lineTo(x + Math.cos(b) * (r * 0.42), y + Math.sin(b) * (r * 0.42));
    }
    ctx.closePath();
    ctx.fill();
  }

  function spawnBurst(root, epic) {
    const fx = ensureFxCanvas(root);
    if (!fx) return;
    const { ctx, w, h, cx, cy } = fx;
    const count = epic ? 56 : 32;
    const colors = ["#C4B5FD", "#A78BFA", "#FFD166", "#fff", "#8B5CF6", "#E879F9", "#FDE68A"];

    particles = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = epic ? 2.5 + Math.random() * 5 : 1.8 + Math.random() * 3.5;
      particles.push({
        x: cx + (Math.random() - 0.5) * 20,
        y: cy + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (epic ? 3 : 2),
        life: 0,
        maxLife: 50 + Math.random() * 40,
        size: epic ? 3 + Math.random() * 6 : 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        kind: Math.random() > 0.5 ? "star" : "circle",
        gravity: 0.05 + Math.random() * 0.04,
      });
    }

    if (epic) {
      particles.push({ x: cx, y: cy, vx: 0, vy: 0, life: 0, maxLife: 30, size: 10, rot: 0, vr: 0, color: "rgba(255,209,102,0.55)", kind: "ring", gravity: 0 });
      particles.push({ x: cx, y: cy, vx: 0, vy: 0, life: 0, maxLife: 22, size: 6, rot: 0, vr: 0, color: "rgba(167,139,250,0.45)", kind: "ring", gravity: 0 });
    }

    spawnDomSparkles(root, epic ? 14 : 8);

    if (fxFrame) cancelAnimationFrame(fxFrame);
    tickFx(ctx, w, h);
  }

  function spawnDomSparkles(root, count) {
    const stage = root.querySelector(".mascot-stage");
    if (!stage) return;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "mascot-sparkle";
      s.style.left = `${20 + Math.random() * 60}%`;
      s.style.top = `${15 + Math.random() * 50}%`;
      s.style.setProperty("--sx", `${(Math.random() - 0.5) * 40}px`);
      s.style.setProperty("--sy", `${-16 - Math.random() * 40}px`);
      s.style.animationDelay = `${Math.random() * 0.2}s`;
      stage.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
    }
  }

  function tickFx(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    let alive = false;

    particles.forEach((p) => {
      p.life++;
      if (p.life > p.maxLife) return;
      alive = true;

      if (p.kind === "ring") {
        const prog = p.life / p.maxLife;
        const radius = 8 + prog * (p.size === 10 ? 60 : 40);
        ctx.beginPath();
        ctx.strokeStyle = p.color.replace(/[\d.]+\)$/, `${(1 - prog) * 0.6})`);
        ctx.lineWidth = 2.5 * (1 - prog * 0.4);
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        return;
      }

      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.rot += p.vr;

      ctx.globalAlpha = 1 - p.life / p.maxLife;
      ctx.fillStyle = p.color;
      if (p.kind === "star") drawStar(ctx, p.x, p.y, p.size, p.rot);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
    });

    ctx.globalAlpha = 1;
    if (alive) fxFrame = requestAnimationFrame(() => tickFx(ctx, w, h));
    else ctx.clearRect(0, 0, w, h);
  }

  function resetPose(root) {
    root.querySelectorAll(".mascot-img").forEach((img) => {
      img.style.animation = "";
      img.style.opacity = "";
      img.style.transform = "";
      img.style.filter = "";
    });
  }

  function cycleAura(root) {
    const unlocked = AURAS.filter((a) => currentStreak >= a.minStreak);
    currentAuraIndex = (currentAuraIndex + 1) % unlocked.length;
    const chosen = unlocked[currentAuraIndex];

    AURAS.forEach((a) => root.classList.remove(`aura-${a.id}`));
    root.classList.add(`aura-${chosen.id}`);

    cheer({ message: `${chosen.name} Aura! ✨` });
  }

  /* Web Audio API Synthesizer */
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) audioCtx = new AudioCtxClass();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function playSound(type, soundpack = "synth") {
    if (soundpack === "off") return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "check") {
        osc.type = soundpack === "retro" ? "square" : "sine";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "epic") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.4);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.start(now);
        osc.stop(now + 0.55);
      } else if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (err) {}
  }

  let activeCharacter = "knight";

  function showCharacterModal() {
    let modal = document.getElementById("mascotCharModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "mascotCharModal";
      modal.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(11, 8, 19, 0.75); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center; padding: 16px;
      `;
      document.body.appendChild(modal);
    }

    const FLObj = global.FL || (typeof window !== "undefined" ? window.FL : null);
    const companions = (FLObj && FLObj.PRO_COMPANIONS) || [
      { id: "knight", name: "Star Knight", icon: "⚔️", title: "Cosmic Vanguard", isPro: false },
      { id: "shinobi", name: "Cyber Shinobi", icon: "🥷", title: "Neo-Tokyo Shadow", isPro: true },
      { id: "priestess", name: "Sakura Miko", icon: "🌸", title: "Shrine Guardian", isPro: true },
      { id: "phoenix", name: "Solar Phoenix", icon: "🦅", title: "Flame of Rebirth", isPro: true },
      { id: "mecha", name: "Aegis Mecha", icon: "🤖", title: "Quantum Sentinel", isPro: true },
    ];

    modal.innerHTML = `
      <div style="
        background: var(--card, #151124); border: 1.5px solid var(--line, #27213C);
        border-radius: 20px; width: 100%; max-width: 380px; padding: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5); font-family: 'Inter', sans-serif; color: var(--ink, #fff);
      ">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
          <h3 style="margin:0; font-family:'Poppins',sans-serif; font-size:16px; display:flex; align-items:center; gap:8px;">
            <span>⚔️ Companion Universe</span>
            <span style="font-size:10px; background:linear-gradient(135deg,#6C5CE7,#E84393); color:#fff; padding:2px 7px; border-radius:10px;">PRO</span>
          </h3>
          <button id="closeCharModal" style="background:none; border:none; color:var(--ink-soft,#8a8fa3); font-size:18px; cursor:pointer;">✕</button>
        </div>
        <p style="font-size:11.5px; color:var(--ink-soft,#8a8fa3); margin:0 0 16px;">Choose your active AI companion avatar to guide your habit journey:</p>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${companions.map((c) => `
            <div class="char-opt-card" data-char="${c.id}" style="
              display:flex; align-items:center; gap:12px; padding:10px 12px;
              border-radius:14px; border:1.5px solid ${activeCharacter === c.id ? "#6C5CE7" : "var(--line, #27213C)"};
              background: ${activeCharacter === c.id ? "rgba(108,92,231,0.15)" : "rgba(255,255,255,0.03)"};
              cursor:pointer; transition:all 0.2s ease;
            ">
              <span style="font-size:26px;">${c.icon}</span>
              <div style="flex:1;">
                <div style="font-size:13px; font-weight:700; display:flex; align-items:center; gap:6px;">
                  <span>${c.name}</span>
                  ${c.isPro ? `<span style="font-size:9px; background:#6C5CE7; color:#fff; padding:1px 5px; border-radius:6px;">PRO</span>` : ""}
                </div>
                <div style="font-size:10.5px; color:var(--ink-soft,#8a8fa3);">${c.title || c.desc || ""}</div>
              </div>
              ${activeCharacter === c.id ? `<span style="color:#00B894; font-weight:700; font-size:13px;">✓ Active</span>` : `<button style="background:var(--line,#27213C); border:none; color:#fff; font-size:11px; padding:4px 10px; border-radius:8px; cursor:pointer;">Equip</button>`}
            </div>
          `).join("")}
        </div>
      </div>
    `;

    modal.querySelector("#closeCharModal").addEventListener("click", () => modal.remove());
    modal.querySelectorAll(".char-opt-card").forEach((card) => {
      card.addEventListener("click", async () => {
        activeCharacter = card.dataset.char;
        playSound("click");
        const FLInst = global.FL || (typeof window !== "undefined" ? window.FL : null);
        if (FLInst && FLInst.loadProSettings && FLInst.saveProSettings) {
          const pro = await FLInst.loadProSettings();
          if (pro) {
            pro.activeCompanion = activeCharacter;
            await FLInst.saveProSettings(pro);
          }
        }
        modal.remove();
        const charName = card.querySelector("div div span") ? card.querySelector("div div span").textContent : "Companion";
        cheer({ message: `Equipped ${charName}! ⚔️` });
      });
    });
  }

  function attachInteractivity(root) {
    const stage = root.querySelector(".mascot-stage");
    if (!stage) return;

    stage.addEventListener("mousemove", (e) => {
      const rect = stage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      stage.style.transform = `perspective(800px) rotateY(${x * 20}deg) rotateX(${-y * 20}deg) scale3d(1.04, 1.04, 1.04)`;
    });

    stage.addEventListener("mouseleave", () => {
      stage.style.transform = "";
    });

    stage.addEventListener("click", () => {
      playSound("click");
      cheer({ message: pickLine(false) });
    });

    const bubble = root.querySelector("#mascotBubble");
    if (bubble) {
      bubble.addEventListener("click", (e) => {
        e.stopPropagation();
        playSound("click");
        cheer({ message: pickLine(false) });
      });
    }

    const badge = root.querySelector("#mascotLevelBadge");
    if (badge) {
      badge.addEventListener("click", (e) => {
        e.stopPropagation();
        playSound("click");
        showCharacterModal();
      });
    }
  }

  function updateProgress(completions, habits) {
    const root = document.getElementById("cadenceMascot");
    if (!root || !global.FL || !global.FL.calculateXP) return;

    const xp = global.FL.calculateXP(completions, habits);
    const lvlInfo = global.FL.getMascotLevel(xp);
    if (global.FL.longestStreakAcrossHabits) {
      currentStreak = global.FL.longestStreakAcrossHabits(habits, completions);
    }

    const txt = root.querySelector("#mascotLvlTxt");
    const fill = root.querySelector("#mascotXpFill");

    if (txt) txt.textContent = `Lvl ${lvlInfo.level} ${lvlInfo.title}`;
    if (fill) fill.style.width = `${lvlInfo.progressPct}%`;

    if (lastLevel !== null && lvlInfo.level > lastLevel) {
      cheer({
        epic: true,
        message: `LEVEL UP! Now Lvl ${lvlInfo.level} ${lvlInfo.title}! ✨`,
      });
    }
    lastLevel = lvlInfo.level;
  }

  function init(variant) {
    if (document.getElementById("cadenceMascot")) return;
    const mount = variant === "popup"
      ? document.getElementById("heroMascotMount") || document.body
      : document.body;
    const wrap = document.createElement("div");
    wrap.innerHTML = mascotHtml(variant || "popup");
    const root = wrap.firstElementChild;
    mount.appendChild(root);

    const FLInst = global.FL || (typeof window !== "undefined" ? window.FL : null);
    if (FLInst && FLInst.loadProSettings) {
      FLInst.loadProSettings().then((pro) => {
        if (pro && pro.activeCompanion) activeCharacter = pro.activeCompanion;
      });
    }

    attachInteractivity(root);

    setTimeout(() => {
      cheer({ message: pickLine(false) });
    }, 600);
  }

  function cheer(opts) {
    opts = opts || {};
    const root = document.getElementById("cadenceMascot");
    if (!root) return;

    const bubble = root.querySelector("#mascotBubble");
    const epic = !!opts.epic;
    const msg = opts.message || pickLine(epic);
    const duration = epic ? EPIC_MS : CHEER_MS;

    if (bubble) bubble.textContent = msg;

    playSound(epic ? "epic" : "check");
    resetPose(root);
    root.classList.remove("cheering", "show-bubble", "epic");
    void root.offsetWidth;
    root.classList.add("cheering", "show-bubble");
    if (epic) root.classList.add("epic");

    spawnBurst(root, epic);

    clearTimeout(cheerTimer);
    clearTimeout(bubbleTimer);
    cheerTimer = setTimeout(() => {
      root.classList.remove("cheering", "epic");
      resetPose(root);
    }, duration);
    bubbleTimer = setTimeout(() => root.classList.remove("show-bubble"), epic ? 3400 : 3000);
  }

  global.FL = global.FL || {};
  global.FL.mascot = { init, cheer, updateProgress, showCharacterModal, playSound };
})(typeof window !== "undefined" ? window : globalThis);
