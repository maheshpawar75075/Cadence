// ============================================================================
// Focus Shield Controller (Focus Guard Website Blocker)
// ============================================================================
(async function() {
  "use strict";

  const urlParams = new URLSearchParams(window.location.search);
  const originalUrl = urlParams.get("url") || "";

  const quotes = [
    "Discipline equals freedom. Relentless execution beats passive distraction.",
    "Your future self will thank you for guarding this exact moment.",
    "Small daily disciplines compound into monumental lifetime victories.",
    "Energy flows where attention goes. Protect your focus with fierce clarity."
  ];
  const quoteEl = document.getElementById("shieldQuote");
  if (quoteEl) quoteEl.textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;

  // Live timer hook
  async function updateTimer() {
    try {
      const stored = await chrome.storage.local.get(["fl_pro_settings"]);
      const pro = stored.fl_pro_settings || {};
      const session = pro.focusSession || {};

      if (!session.running) {
        const timerEl = document.getElementById("shieldTimer");
        const intentionEl = document.getElementById("shieldIntention");
        if (timerEl) timerEl.textContent = "Completed";
        if (intentionEl) intentionEl.textContent = "Focus sprint has ended. You may proceed.";
        if (originalUrl) {
          window.location.href = originalUrl;
        }
        return;
      }

      const elapsed = session.startedAt ? Math.floor((Date.now() - session.startedAt) / 1000) : 0;
      const remaining = Math.max(0, (session.remainingSeconds || 1500) - elapsed);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      const timerEl = document.getElementById("shieldTimer");
      const intentionEl = document.getElementById("shieldIntention");
      if (timerEl) timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      if (intentionEl && session.intention) {
        intentionEl.textContent = `🎯 Focus Goal: "${session.intention}"`;
      }
    } catch (e) {}
  }

  setInterval(updateTimer, 1000);
  updateTimer();

  const returnBtn = document.getElementById("returnBtn");
  if (returnBtn) {
    returnBtn.addEventListener("click", () => {
      window.location.href = chrome.runtime.getURL("newtab.html");
    });
  }

  // 60-Second Breathing Reset
  let breatheInterval = null;
  let breatheSeconds = 60;
  const breatheBtn = document.getElementById("breatheBtn");
  const breatheModal = document.getElementById("breatheModal");
  const breatheCircle = document.getElementById("breatheCircle");
  const breatheText = document.getElementById("breatheText");
  const breatheTimer = document.getElementById("breatheTimer");
  const closeBreatheBtn = document.getElementById("closeBreatheBtn");

  if (breatheBtn && breatheModal) {
    breatheBtn.addEventListener("click", () => {
      breatheModal.classList.add("active");
      breatheSeconds = 60;
      let phase = 0;
      let phaseTimer = 0;

      breatheInterval = setInterval(() => {
        breatheSeconds--;
        if (breatheTimer) breatheTimer.textContent = `${breatheSeconds}s`;
        phaseTimer++;
        if (phaseTimer >= 4) {
          phaseTimer = 0;
          phase = (phase + 1) % 4;
        }

        if (breatheText && breatheCircle) {
          if (phase === 0) {
            breatheText.textContent = "Inhale...";
            breatheCircle.style.transform = "scale(1.35)";
          } else if (phase === 1) {
            breatheText.textContent = "Hold...";
          } else if (phase === 2) {
            breatheText.textContent = "Exhale slowly...";
            breatheCircle.style.transform = "scale(0.85)";
          } else {
            breatheText.textContent = "Rest...";
          }
        }

        if (breatheSeconds <= 0) {
          clearInterval(breatheInterval);
          breatheModal.classList.remove("active");
        }
      }, 1000);
    });
  }

  if (closeBreatheBtn && breatheModal) {
    closeBreatheBtn.addEventListener("click", () => {
      if (breatheInterval) clearInterval(breatheInterval);
      breatheModal.classList.remove("active");
    });
  }

  // Mindful Pause & Emergency Exemption Flow
  const emergencyOverrideBtn = document.getElementById("emergencyOverrideBtn");
  const intentionModal = document.getElementById("intentionModal");
  const confirmOverrideBtn = document.getElementById("confirmOverrideBtn");
  const cancelOverrideBtn = document.getElementById("cancelOverrideBtn");
  const countdownEl = document.getElementById("intentionCountdown");
  let pauseTimer = null;

  if (emergencyOverrideBtn && intentionModal && confirmOverrideBtn && countdownEl) {
    emergencyOverrideBtn.addEventListener("click", () => {
      intentionModal.classList.add("active");
      let secondsLeft = 10;
      confirmOverrideBtn.disabled = true;
      confirmOverrideBtn.textContent = `Wait ${secondsLeft}s to proceed...`;
      countdownEl.textContent = secondsLeft;

      if (pauseTimer) clearInterval(pauseTimer);
      pauseTimer = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
          countdownEl.textContent = secondsLeft;
          confirmOverrideBtn.textContent = `Wait ${secondsLeft}s to proceed...`;
        } else {
          clearInterval(pauseTimer);
          countdownEl.textContent = "✓";
          confirmOverrideBtn.disabled = false;
          confirmOverrideBtn.textContent = "Proceed with 2m Exemption";
        }
      }, 1000);
    });
  }

  if (cancelOverrideBtn && intentionModal) {
    cancelOverrideBtn.addEventListener("click", () => {
      if (pauseTimer) clearInterval(pauseTimer);
      intentionModal.classList.remove("active");
    });
  }

  if (confirmOverrideBtn) {
    confirmOverrideBtn.addEventListener("click", async () => {
      try {
        const hostname = originalUrl ? new URL(originalUrl).hostname : "";
        if (hostname) {
          const res = await chrome.storage.local.get(["fl_exemptions"]);
          const exemptions = res.fl_exemptions || {};
          exemptions[hostname] = Date.now() + (2 * 60 * 1000); // 2 minutes
          await chrome.storage.local.set({ fl_exemptions: exemptions });
          if (originalUrl) window.location.href = originalUrl;
        }
      } catch (e) {
        if (originalUrl) window.location.href = originalUrl;
      }
    });
  }
})();
