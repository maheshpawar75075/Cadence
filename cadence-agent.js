/* ==========================================================================
   Cadence AI — Talking Personal AI Chatbot & Performance Coach Engine
   ========================================================================== */

(function (global) {
  "use strict";

  const AGENT_NAME = "Cadence";
  const GREETING = "Hello! I am Cadence, your executive performance companion. What are we conquering today?";

  const MOTIVATIONAL_WISDOM = [
    "Discipline equals freedom. Every habit you execute today compounds into tomorrow's victory.",
    "We don't rise to the level of our goals, we fall to the level of our systems. Let's conquer the next habit.",
    "Consistency is your competitive advantage. Keep the streak alive and guard your focus.",
    "Small daily improvements over time lead to monumental, life-changing results.",
    "Focus locked. Relentless execution beats passive intention every single day.",
    "The secret of getting ahead is simply getting started. Execute the next step.",
    "What you do every single day matters far more than what you do once in a while.",
    "Energy flows where attention goes. Protect your focus with fierce discipline."
  ];

  class CadenceAIAgent {
    constructor() {
      this.isOpen = false;
      this.isListening = false;
      this.isSpeaking = false;
      this.voiceMuted = false;
      this.recognition = null;
      this.synth = typeof window !== "undefined" ? window.speechSynthesis : null;
      this.activeUtterance = null;
      this.audioCtx = null;
      this.selectedVoice = null;
      this.history = [];
      this.dom = {};
      this.aiModel = null;
      this.handsFreeMode = false;
      this.lastListedHabits = [];
      this.lastAction = null;

      this.initVoiceEngine();
      this.initSpeechRecognition();
      this.initChromeAI();
    }

    async initChromeAI() {
      try {
        if (typeof window !== "undefined" && window.ai && window.ai.languageModel) {
          const caps = await window.ai.languageModel.capabilities();
          if (caps && caps.available !== "no") {
            this.aiModel = await window.ai.languageModel.create({
              systemPrompt: "You are Cadence, an elite executive performance coach and habit mentor. You provide sharp, concise, actionable advice grounded in behavioral psychology and Atomic Habits. Keep responses concise, direct, inspiring, and under 3-4 sentences when possible."
            });
            console.log("Cadence: Chrome Built-in AI (Prompt API) loaded!");
          }
        }
      } catch (err) {
        console.log("Cadence: Chrome AI not available:", err.message);
      }
    }

    getProactiveGreeting(habits = [], completions = {}) {
      const hour = new Date().getHours();
      const todayKey = new Date().toISOString().slice(0, 10);
      const todayDone = completions[todayKey] || {};
      const doneCount = habits.filter(h => !!todayDone[h.id]).length;
      const total = habits.length;

      if (hour >= 4 && hour < 12) {
        return total > 0
          ? `Good morning! You have **${total - doneCount} habits** queued for today. Ready to execute your morning priority block? ⚡`
          : "Good morning! Ready to conquer your daily habits and lock in peak performance?";
      } else if (hour >= 12 && hour < 17) {
        return total > 0
          ? `Good afternoon! You're currently at **${doneCount}/${total} habits** completed. Let's keep your streak thriving!`
          : "Good afternoon! Focus locked. What are we executing next?";
      } else {
        return total > 0
          ? `Good evening! You've logged **${doneCount}/${total} habits** today. Time to wind down and prepare for tomorrow's victory. 🛡️`
          : "Good evening! Stand down, reflect, and lock in tomorrow's wins.";
      }
    }

    /* Web Audio synthesizer chime for immediate audio feedback */
    getAudioContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    }

    playChime(type = "listen") {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "listen") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.start(now);
          osc.stop(now + 0.18);
        } else if (type === "speak") {
          osc.type = "triangle";
          osc.frequency.setValueAtTime(587.33, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
        } else if (type === "action") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
          osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.start(now);
          osc.stop(now + 0.28);
        }
      } catch (e) {}
    }

    initVoiceEngine() {
      if (!this.synth) return;

      const pickVoice = () => {
        const voices = this.synth.getVoices();
        if (!voices || voices.length === 0) return;

        // Prioritize natural English voices
        this.selectedVoice = voices.find(v => 
          (v.name.includes("Google UK English Female") || 
           v.name.includes("Google US English") || 
           v.name.includes("Natural") || 
           v.name.includes("Daniel") || 
           v.name.includes("Samantha") || 
           v.name.includes("Alex") || 
           v.name.includes("Serena") ||
           v.name.includes("Victoria") ||
           v.name.includes("Karen")) && v.lang.startsWith("en")
        ) || voices.find(v => v.lang.startsWith("en")) || voices[0];
      };

      pickVoice();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = pickVoice;
      }
    }

    initSpeechRecognition() {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn("Speech Recognition API is not supported in this browser.");
        return;
      }
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = "en-US";

        this.recognition.onstart = () => {
          this.isListening = true;
          this.playChime("listen");
          this.setState("listening");
          this.updateStatus("Listening... speak now");
          if (this.dom.micBtn) this.dom.micBtn.classList.add("active");
        };

        this.recognition.onresult = (e) => {
          let interimText = "";
          let finalText = "";
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            if (e.results[i].isFinal) {
              finalText += e.results[i][0].transcript;
            } else {
              interimText += e.results[i][0].transcript;
            }
          }

          if (interimText && this.dom.textInput) {
            this.dom.textInput.placeholder = `"${interimText}..."`;
            this.updateStatus(`Hearing: "${interimText}..."`);
          }

          if (finalText && finalText.trim()) {
            if (this.dom.textInput) this.dom.textInput.placeholder = "Ask Cadence anything or give a command...";
            this.handleUserInput(finalText.trim());
          }
        };

        this.recognition.onerror = (e) => {
          console.warn("Speech recognition error:", e.error);
          this.isListening = false;
          if (this.dom.micBtn) this.dom.micBtn.classList.remove("active");
          this.setState("idle");

          if (e.error === "not-allowed" || e.error === "permission-denied") {
            this.updateStatus("⚠️ Microphone access blocked. Please enable mic permissions.");
            this.appendMessage("assistant", "⚠️ Microphone permission is required to talk. Please click the camera/microphone icon in Chrome's address bar to allow access, or type your command below.");
          } else if (e.error === "no-speech") {
            this.updateStatus("No speech detected. Click mic to try again.");
          } else {
            this.updateStatus("Click mic or orb to talk");
          }
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.dom.micBtn) this.dom.micBtn.classList.remove("active");
          if (!this.isSpeaking) {
            this.setState("idle");
            this.updateStatus("Click mic or orb to talk");
          }
        };
      } catch (err) {
        console.warn("Could not initialize Speech Recognition:", err);
      }
    }

    mount(container = document.body) {
      let overlay = document.getElementById("cadenceAgentOverlay");
      let launcher = document.getElementById("cadenceAgentLauncher");

      // 1. Hook up all trigger buttons across pages cleanly without duplicate listeners
      const dockAiBtn = document.getElementById("dockAiBtn");
      const popupCadenceBtn = document.getElementById("popupCadenceBtn");
      const dashCadenceAiBtn = document.getElementById("dashCadenceAiBtn");
      const dashTalkCadenceBtn = document.getElementById("dashTalkCadenceBtn");

      const bindTrigger = (btn, action = "toggle") => {
        if (!btn) return;
        const isBound = (btn.dataset && btn.dataset.cadenceBound) || (btn.getAttribute && btn.getAttribute("data-cadence-bound") === "true");
        if (isBound) return;
        if (btn.dataset) btn.dataset.cadenceBound = "true";
        if (btn.setAttribute) btn.setAttribute("data-cadence-bound", "true");
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (action === "open") this.open();
          else this.toggle();
        });
      };

      if (dockAiBtn) bindTrigger(dockAiBtn, "toggle");
      if (popupCadenceBtn) bindTrigger(popupCadenceBtn, "open");
      if (dashCadenceAiBtn) bindTrigger(dashCadenceAiBtn, "open");
      if (dashTalkCadenceBtn) bindTrigger(dashTalkCadenceBtn, "open");

      // Floating launcher pill only if neither dockAiBtn nor popupCadenceBtn is present
      if (!dockAiBtn && !popupCadenceBtn) {
        if (!launcher) {
          launcher = document.createElement("div");
          launcher.id = "cadenceAgentLauncher";
          launcher.className = "cadence-agent-launcher";
          launcher.title = "Talk with Cadence AI Assistant";
          launcher.innerHTML = `
            <div class="cadence-launcher-orb">
              <div class="cadence-launcher-orb-core"></div>
            </div>
            <div class="cadence-launcher-text">
              <span>Cadence AI</span>
              <span class="cadence-live-pill">TALK</span>
            </div>
          `;
          launcher.addEventListener("click", (e) => {
            e.preventDefault();
            this.toggle();
          });
          container.appendChild(launcher);
        }
      }

      // 2. Main Chat & Visualizer Modal Overlay
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "cadenceAgentOverlay";
        overlay.className = "cadence-modal-overlay";
        overlay.innerHTML = `
        <div class="cadence-agent-window" id="cadenceAgentWindow" data-state="idle">
          <!-- Window Header -->
          <div class="cadence-window-header">
            <div class="cadence-header-title-group">
              <div class="cadence-header-avatar" aria-hidden="true"><span>✦</span></div>
              <div>
                <div class="cadence-header-name">
                  <span>Cadence</span>
                  <span class="cadence-header-tag"><i></i> Online</span>
                </div>
                <div class="cadence-header-sub">Your focus and habit partner</div>
              </div>
            </div>
            <div class="cadence-header-actions">
              <button class="cadence-icon-btn cadence-handsfree-btn" id="cadenceHandsFreeBtn" title="Toggle Hands-Free Flow Conversation">🎙️ Flow</button>
              <button class="cadence-icon-btn" id="cadenceClearChatBtn" title="Clear Conversation">🗑️</button>
              <button class="cadence-icon-btn" id="cadenceTestVoiceBtn" title="Test Voice Output">🗣️</button>
              <button class="cadence-icon-btn" id="cadenceMuteBtn" title="Toggle Voice Response">🔊</button>
              <button class="cadence-icon-btn" id="cadenceCloseBtn" title="Close (Esc)">✕</button>
            </div>
          </div>

          <!-- Living Visualizer Orb Stage -->
          <div class="cadence-orb-stage">
            <div class="cadence-visualizer-orb" id="cadenceVisualizerOrb" title="Click to Speak / Stop">
              <div class="cadence-ring-outer"></div>
              <div class="cadence-ring-pulse"></div>
              <div class="cadence-orb-body"></div>
            </div>
            <div class="cadence-audio-bars">
              <div class="cadence-bar"></div>
              <div class="cadence-bar"></div>
              <div class="cadence-bar"></div>
              <div class="cadence-bar"></div>
              <div class="cadence-bar"></div>
              <div class="cadence-bar"></div>
              <div class="cadence-bar"></div>
            </div>
            <div class="cadence-status-text" id="cadenceStatusText">Click mic or orb to talk</div>
          </div>

          <!-- Conversation Message Stream -->
          <div class="cadence-chat-history" id="cadenceChatHistory"></div>

          <!-- Quick Action Chips -->
          <div class="cadence-chips-row" id="cadenceChipsRow">
            <div class="cadence-chip" data-query="ready made tasks">✨ Ready-made tasks</div>
            <div class="cadence-chip" data-query="add morning routine pack">🌅 Morning pack</div>
            <div class="cadence-chip" data-query="change 4k wallpaper">🎨 4K Wallpapers</div>
            <div class="cadence-chip" data-query="daily briefing">Daily briefing</div>
            <div class="cadence-chip" data-query="what habits are left today">Today's habits</div>
            <div class="cadence-chip" data-query="how is my streak doing">Streak status</div>
            <div class="cadence-chip" data-query="give me motivational coaching">Motivate me</div>
            <div class="cadence-chip" data-query="pomodoro focus tips">Focus tips</div>
          </div>

          <!-- Input Bar -->
          <form class="cadence-input-bar" id="cadenceInputForm">
            <button type="button" class="cadence-mic-btn" id="cadenceMicBtn" title="Hold or click to speak">
              🎙️
            </button>
            <div class="cadence-input-wrap">
              <input type="text" class="cadence-text-input" id="cadenceTextInput" placeholder="Ask Cadence anything or give a command..." autocomplete="off"/>
              <button type="submit" class="cadence-send-btn" title="Send message">➔</button>
            </div>
          </form>
        </div>
      `;
        container.appendChild(overlay);
      }

      // Cache DOM references
      this.dom = {
        overlay,
        window: overlay.querySelector("#cadenceAgentWindow"),
        launcher,
        chatHistory: overlay.querySelector("#cadenceChatHistory"),
        statusText: overlay.querySelector("#cadenceStatusText"),
        visualizerOrb: overlay.querySelector("#cadenceVisualizerOrb"),
        micBtn: overlay.querySelector("#cadenceMicBtn"),
        testVoiceBtn: overlay.querySelector("#cadenceTestVoiceBtn"),
        clearChatBtn: overlay.querySelector("#cadenceClearChatBtn"),
        handsFreeBtn: overlay.querySelector("#cadenceHandsFreeBtn"),
        muteBtn: overlay.querySelector("#cadenceMuteBtn"),
        closeBtn: overlay.querySelector("#cadenceCloseBtn"),
        inputForm: overlay.querySelector("#cadenceInputForm"),
        textInput: overlay.querySelector("#cadenceTextInput"),
        chipsRow: overlay.querySelector("#cadenceChipsRow")
      };

      this.bindEvents();

      // Initial friendly greeting in chat if empty
      if (this.dom.chatHistory && !this.dom.chatHistory.children.length) {
        this.appendMessage("assistant", GREETING);
      }
    }

    bindEvents() {
      if (this._eventsBound) return;
      this._eventsBound = true;

      // Close overlay
      if (this.dom.closeBtn) {
        this.dom.closeBtn.addEventListener("click", () => this.close());
      }
      if (this.dom.overlay) {
        this.dom.overlay.addEventListener("click", (e) => {
          if (e.target === this.dom.overlay) this.close();
        });
      }

      // Escape key to close
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.isOpen) {
          this.close();
        }
      });

      // Hands-Free continuous conversation toggle
      if (this.dom.handsFreeBtn) {
        this.dom.handsFreeBtn.addEventListener("click", () => {
          this.handsFreeMode = !this.handsFreeMode;
          this.dom.handsFreeBtn.classList.toggle("active", this.handsFreeMode);
          this.dom.handsFreeBtn.textContent = this.handsFreeMode ? "🎙️ Flow ON" : "🎙️ Flow";
          this.playChime("action");
          if (this.handsFreeMode) {
            this.updateStatus("Hands-free flow ON. Cadence will listen after speaking.");
            if (!this.isSpeaking && !this.isListening) {
              this.startListening();
            }
          } else {
            this.updateStatus("Hands-free flow OFF.");
            if (this.isListening) this.stopListening();
          }
        });
      }

      // Clear chat
      if (this.dom.clearChatBtn) {
        this.dom.clearChatBtn.addEventListener("click", () => {
          if (this.dom.chatHistory) {
            this.dom.chatHistory.innerHTML = "";
            this.history = [];
            this.appendMessage("assistant", GREETING);
          }
        });
      }

      // Orb click triggers speech toggle or listening
      if (this.dom.visualizerOrb) {
        this.dom.visualizerOrb.addEventListener("click", () => {
          if (this.isSpeaking) {
            this.stopSpeaking();
          } else if (this.isListening) {
            this.stopListening();
          } else {
            this.startListening();
          }
        });
      }

      // Microphone button
      if (this.dom.micBtn) {
        this.dom.micBtn.addEventListener("click", () => {
          if (this.isListening) {
            this.stopListening();
          } else {
            this.startListening();
          }
        });
      }

      // Test voice button
      if (this.dom.testVoiceBtn) {
        this.dom.testVoiceBtn.addEventListener("click", () => {
          this.speak("Hello! I am Cadence. My executive voice engine is calibrated, responsive, and ready.");
        });
      }

      // Mute/unmute voice audio
      if (this.dom.muteBtn) {
        this.dom.muteBtn.addEventListener("click", () => {
          this.voiceMuted = !this.voiceMuted;
          this.dom.muteBtn.textContent = this.voiceMuted ? "🔇" : "🔊";
          this.dom.muteBtn.title = this.voiceMuted ? "Unmute Voice Response" : "Mute Voice Response";
          if (this.voiceMuted && this.isSpeaking) {
            this.stopSpeaking();
          }
        });
      }

      // Text input submit
      if (this.dom.inputForm) {
        this.dom.inputForm.addEventListener("submit", (e) => {
          e.preventDefault();
          if (!this.dom.textInput) return;
          const text = this.dom.textInput.value.trim();
          if (!text) return;
          this.dom.textInput.value = "";
          this.handleUserInput(text);
        });
      }

      // Quick action suggestion chips
      if (this.dom.chipsRow) {
        this.dom.chipsRow.addEventListener("click", (e) => {
          const chip = e.target.closest(".cadence-chip");
          if (chip && chip.dataset.query) {
            this.handleUserInput(chip.dataset.query);
          }
        });
      }
    }

    open() {
      if (!this.dom || !this.dom.overlay) this.mount();
      if (!this.dom || !this.dom.overlay) return;
      this.isOpen = true;
      this.dom.overlay.classList.add("active");
      if (this.dom.textInput) {
        setTimeout(() => this.dom.textInput.focus(), 250);
      }
      this.updateStatus("Ready. Click mic or orb to talk.");
      // Warm up voice engine
      if (this.synth) {
        try {
          if (this.synth.paused) {
            this.synth.resume();
          }
        } catch (e) {}
        this.initVoiceEngine();
      }
    }

    close() {
      this.isOpen = false;
      if (this.dom && this.dom.overlay) {
        this.dom.overlay.classList.remove("active");
      }
      this.stopSpeaking();
      this.stopListening();
    }

    toggle() {
      if (this.isOpen) this.close();
      else this.open();
    }

    setState(state) {
      if (this.dom.window) {
        this.dom.window.setAttribute("data-state", state);
      }
    }

    updateStatus(text) {
      if (this.dom.statusText) {
        this.dom.statusText.textContent = text;
      }
    }

    startListening() {
      if (this.isSpeaking) this.stopSpeaking();
      if (!this.recognition) {
        this.updateStatus("Speech recognition unavailable. Please type your message.");
        return;
      }
      try {
        this.recognition.start();
      } catch (err) {
        try {
          this.recognition.stop();
          setTimeout(() => this.recognition.start(), 150);
        } catch (e) {
          console.warn("Could not start recognition:", e);
        }
      }
    }

    stopListening() {
      if (this.recognition && this.isListening) {
        try {
          this.recognition.stop();
        } catch (e) {}
      }
      this.isListening = false;
      if (this.dom.micBtn) this.dom.micBtn.classList.remove("active");
    }

    speak(text) {
      if (this.voiceMuted || !this.synth) {
        this.setState("idle");
        this.updateStatus("Click mic or orb to talk");
        return;
      }

      // Resume synthesis in case Chrome put it in paused/sleeping state
      try {
        if (this.synth.speaking || this.synth.pending) {
          this.synth.cancel();
        }
        if (this.synth.paused) {
          this.synth.resume();
        }
      } catch (e) {}

      // Clean markdown tags, emojis, and symbols for crisp speech
      const cleanText = (text || "")
        .replace(/[*_#`~>]/g, "")
        .replace(/[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
        .replace(/•/g, "")
        .trim();

      if (!cleanText) {
        this.setState("idle");
        this.updateStatus("Click mic or orb to talk");
        return;
      }

      this.isSpeaking = true;
      this.setState("speaking");
      this.updateStatus("Cadence is speaking...");
      this.playChime("speak");

      const utterance = new SpeechSynthesisUtterance(cleanText);
      this.activeUtterance = utterance; // Prevent garbage collection in Chrome

      // Ensure voice is populated
      if (!this.selectedVoice) {
        this.initVoiceEngine();
      }
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      utterance.rate = 1.02;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        this.isSpeaking = false;
        this.activeUtterance = null;
        this.setState("idle");
        this.updateStatus("Click mic or orb to talk");

        if (this.handsFreeMode && this.isOpen) {
          setTimeout(() => {
            if (!this.isSpeaking && !this.isListening && this.isOpen) {
              this.updateStatus("🎙️ Hands-free: Listening...");
              this.startListening();
            }
          }, 450);
        }
      };

      utterance.onerror = (err) => {
        console.warn("Speech synthesis error:", err);
        this.isSpeaking = false;
        this.activeUtterance = null;
        this.setState("idle");
        this.updateStatus("Click mic or orb to talk");
      };

      try {
        this.synth.speak(utterance);
      } catch (err) {
        console.warn("Failed to speak utterance:", err);
        this.isSpeaking = false;
        this.setState("idle");
      }
    }

    stopSpeaking() {
      if (this.synth) {
        try {
          this.synth.cancel();
        } catch (e) {}
      }
      this.activeUtterance = null;
      this.isSpeaking = false;
      this.setState("idle");
      this.updateStatus("Click mic or orb to talk");
    }

    renderActionCard(card) {
      if (!card || !card.type) return null;
      const wrap = document.createElement("div");
      wrap.className = `cadence-action-card card-${card.type}`;
      const FL = global.FL;

      if (card.type === "habits" && Array.isArray(card.habits)) {
        wrap.innerHTML = `<div class="cadence-card-header">⚡ Pending Habits (${card.habits.length})</div>`;
        const list = document.createElement("div");
        list.className = "cadence-card-items";
        card.habits.forEach(h => {
          const item = document.createElement("div");
          item.className = "cadence-card-item";
          const cat = (FL && FL.CATEGORIES && FL.CATEGORIES[h.category]) || { icon: "🎯", color: "#6C5CE7" };
          item.innerHTML = `
            <div class="cadence-card-item-info">
              <span class="cadence-item-name">${h.name}</span>
              <span class="cadence-item-sub">${cat.icon || "🎯"} ${h.category || "personal"} ${h.type === "numeric" ? `· target ${h.target || 1}` : ""}</span>
            </div>
            <button class="cadence-card-btn" data-habit-id="${h.id}">
              ${h.type === "numeric" ? "+1 Log" : "✓ Mark Done"}
            </button>
          `;
          const btn = item.querySelector("button");
          btn.addEventListener("click", async () => {
            btn.disabled = true;
            btn.textContent = "✓ Done";
            btn.classList.add("completed");
            this.playChime("action");
            const todayKey = FL.todayKey ? FL.todayKey() : new Date().toISOString().slice(0, 10);
            if (FL.setCompletion) {
              await FL.setCompletion(todayKey, h.id, h.type === "numeric" ? (h.target || 1) : true);
            }
            if (FL.mascot && FL.mascot.cheer) {
              FL.mascot.cheer({ message: `Completed ${h.name}! ⚡` });
            }
            this.lastAction = { type: "complete", habitId: h.id, habitName: h.name, dateKey: todayKey };
          });
          list.appendChild(item);
        });
        wrap.appendChild(list);
      } else if (card.type === "sprint") {
        wrap.innerHTML = `
          <div class="cadence-card-header">🛡️ Deep Work Sprint Launcher</div>
          <div class="cadence-card-buttons">
            <button class="cadence-card-btn sprint-btn" data-mins="25">⚡ 25m Focus Sprint</button>
            <button class="cadence-card-btn sprint-btn" data-mins="50">⚡ 50m Deep Work</button>
            <button class="cadence-card-btn sprint-btn" data-mins="15">⚡ 15m Fast Reset</button>
          </div>
        `;
        wrap.querySelectorAll(".sprint-btn").forEach(btn => {
          btn.addEventListener("click", async () => {
            const mins = parseInt(btn.dataset.mins, 10) || 25;
            btn.disabled = true;
            btn.textContent = `Active (${mins}m) 🛡️`;
            this.playChime("action");
            if (FL && FL.loadProSettings && FL.saveProSettings) {
              const pro = await FL.loadProSettings();
              pro.focusSession = {
                duration: mins,
                remainingSeconds: mins * 60,
                running: true,
                startedAt: Date.now(),
                intention: "Cadence AI Focus Session"
              };
              await FL.saveProSettings(pro);
            }
            this.speak(`${mins} minute deep work sprint activated.`);
          });
        });
      } else if (card.type === "sound") {
        wrap.innerHTML = `
          <div class="cadence-card-header">🎵 Soundscapes & Binaural Beats</div>
          <div class="cadence-card-buttons sound-grid">
            <button class="cadence-card-btn sound-btn" data-sound="lofi_rain">🌧️ Rain</button>
            <button class="cadence-card-btn sound-btn" data-sound="zen_bowls">🧘 Zen (432Hz)</button>
            <button class="cadence-card-btn sound-btn" data-sound="binaural_gamma">🧠 40Hz Gamma</button>
            <button class="cadence-card-btn sound-btn" data-sound="brown">🌊 Ocean Waves</button>
            <button class="cadence-card-btn sound-btn layer-btn" data-sound="layer">✨ Layer: Rain + 40Hz Gamma</button>
            <button class="cadence-card-btn sound-btn stop-sound-btn" data-sound="stop">⏹ Stop Audio</button>
          </div>
        `;
        wrap.querySelectorAll(".sound-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const sound = btn.dataset.sound;
            this.playChime("action");
            if (sound === "stop") {
              if (FL && FL.stopAmbientSoundscape) FL.stopAmbientSoundscape();
              this.updateStatus("Audio stopped");
            } else if (sound === "layer") {
              if (FL && FL.playLayeredSoundscapes) {
                FL.playLayeredSoundscapes("lofi_rain", "binaural_gamma", { masterVol: 0.65, ambientVol: 0.5, binauralVol: 0.35 });
                this.updateStatus("Layered: Rain + 40Hz Gamma active");
              }
            } else {
              if (FL && FL.playAmbientSoundscape) {
                FL.playAmbientSoundscape(sound, 0.55);
                this.updateStatus(`${sound} playing`);
              }
            }
          });
        });
      } else if (card.type === "micro" && Array.isArray(card.habits)) {
        wrap.innerHTML = `<div class="cadence-card-header">🛡️ 2-Minute Minimum Viable Habiting</div>`;
        const list = document.createElement("div");
        list.className = "cadence-card-items";
        card.habits.forEach(h => {
          const item = document.createElement("div");
          item.className = "cadence-card-item";
          const minText = h.minimum || "2-minute minimum viable version";
          item.innerHTML = `
            <div class="cadence-card-item-info">
              <span class="cadence-item-name">${h.name}</span>
              <span class="cadence-item-sub">⚡ Minimum: "${minText}"</span>
            </div>
            <button class="cadence-card-btn micro-btn" data-habit-id="${h.id}">
              ✓ Log 2-Min
            </button>
          `;
          const btn = item.querySelector("button");
          btn.addEventListener("click", async () => {
            btn.disabled = true;
            btn.textContent = "✓ Saved";
            btn.classList.add("completed");
            this.playChime("action");
            const todayKey = FL.todayKey ? FL.todayKey() : new Date().toISOString().slice(0, 10);
            if (FL.setMinimumDone) {
              await FL.setMinimumDone(todayKey, h.id);
            } else if (FL.setCompletion) {
              await FL.setCompletion(todayKey, h.id, { minimum: true });
            }
            if (FL.mascot && FL.mascot.cheer) {
              FL.mascot.cheer({ message: `Logged minimum for ${h.name}! Streak protected! 🛡️` });
            }
            this.lastAction = { type: "complete", habitId: h.id, habitName: h.name, dateKey: todayKey };
          });
          list.appendChild(item);
        });
        wrap.appendChild(list);
      } else if (card.type === "undo" && card.habitName) {
        wrap.innerHTML = `
          <div class="cadence-card-header">↩ Action Logged</div>
          <div class="cadence-card-buttons">
            <button class="cadence-card-btn undo-btn">↩ Revert "${card.habitName}"</button>
          </div>
        `;
        const btn = wrap.querySelector(".undo-btn");
        btn.addEventListener("click", async () => {
          btn.disabled = true;
          btn.textContent = "Reverted ↩";
          this.playChime("action");
          if (this.lastAction && this.lastAction.habitId) {
            const todayKey = this.lastAction.dateKey || (FL.todayKey ? FL.todayKey() : new Date().toISOString().slice(0, 10));
            const completions = FL.getCompletions ? await FL.getCompletions() : {};
            if (completions[todayKey]) {
              delete completions[todayKey][this.lastAction.habitId];
              if (FL.saveCompletions) await FL.saveCompletions(completions);
            }
            this.appendMessage("assistant", `↩ Reverted completion for **${this.lastAction.habitName}**.`);
            this.lastAction = null;
          }
        });
      }

      return wrap;
    }

    appendMessage(role, text, cardData = null) {
      if (!this.dom || !this.dom.chatHistory) return;
      const msg = document.createElement("div");
      msg.className = `cadence-msg ${role}`;
      
      // Escape HTML and format basic markdown
      const escaped = String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      
      const formatted = escaped
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\n/g, "<br>");

      msg.innerHTML = formatted;

      if (cardData && role === "assistant") {
        const cardEl = this.renderActionCard(cardData);
        if (cardEl) msg.appendChild(cardEl);
      }

      this.dom.chatHistory.appendChild(msg);
      this.dom.chatHistory.scrollTop = this.dom.chatHistory.scrollHeight;
    }

    async handleUserInput(input) {
      if (!input || !input.trim()) return;
      this.stopListening();
      const userText = input.trim();
      this.appendMessage("user", userText);
      this.history.push({ role: "user", text: userText, timestamp: Date.now() });
      if (this.history.length > 12) this.history.shift();

      this.setState("thinking");
      this.updateStatus("Cadence is thinking...");

      setTimeout(async () => {
        try {
          const res = await this.generateResponse(userText);
          const responseText = typeof res === "object" ? res.text : res;
          const cardData = typeof res === "object" ? res.card : null;

          this.history.push({ role: "assistant", text: responseText, timestamp: Date.now() });
          if (this.history.length > 12) this.history.shift();

          this.appendMessage("assistant", responseText, cardData);
          this.speak(responseText);
        } catch (err) {
          console.error("Cadence response generation error:", err);
          const fallback = "I encountered an issue processing that command. Please try again or ask for your daily briefing.";
          this.appendMessage("assistant", fallback);
          this.speak(fallback);
        }
      }, 200);
    }

    async generateResponse(query) {
      const q = query.toLowerCase().trim();
      const FL = global.FL;

      let habits = [];
      let completions = {};
      let todayKey = new Date().toISOString().slice(0, 10);

      if (FL) {
        try {
          habits = FL.getHabits ? await FL.getHabits() : (FL.loadHabits ? await FL.loadHabits() : []);
          completions = FL.getCompletions ? await FL.getCompletions() : (FL.loadCompletions ? await FL.loadCompletions() : {});
          todayKey = FL.todayKey ? FL.todayKey() : (FL.dateKey ? FL.dateKey(new Date()) : new Date().toISOString().slice(0, 10));
        } catch (e) {
          console.warn("Error fetching data layer in CadenceAgent:", e);
        }
      }

      const todayDone = completions[todayKey] || {};

      // 0a. Undo / Revert Last Action
      if (q === "undo" || q === "revert" || q.includes("undo that") || q.includes("undo last") || q.includes("revert that")) {
        if (this.lastAction && this.lastAction.habitId) {
          const undoKey = this.lastAction.dateKey || todayKey;
          if (completions[undoKey]) {
            delete completions[undoKey][this.lastAction.habitId];
            if (FL && FL.saveCompletions) await FL.saveCompletions(completions);
          }
          const undoneName = this.lastAction.habitName;
          this.lastAction = null;
          this.playChime("action");
          return `↩ Reverted! **"${undoneName}"** has been marked incomplete again.`;
        } else {
          return "No recent habit completion to undo.";
        }
      }

      // 0b. Low Energy / Fatigue / 2-Minute Micro-Habits Fallback
      if (q.includes("tired") || q.includes("exhaust") || q.includes("no time") || q.includes("overwhelm") || q.includes("slump") || q.includes("can't do it") || q.includes("cant do it") || q.includes("low energy") || q.includes("micro habit")) {
        const pending = habits.filter(h => {
          const v = todayDone[h.id];
          return FL && FL.isHabitDone ? !FL.isHabitDone(h, v) : !v;
        });
        if (pending.length === 0) {
          return "You've already conquered all scheduled habits today! Time to stand down and restore your energy for tomorrow. 🛡️";
        }
        return {
          text: `🛡️ **Cadence "Never Miss Twice" Protocol:**\n\nDiscipline is not about heroics; it is about preserving identity. When energy is low, do not break the chain—shrink friction to 120 seconds. Execute the **2-Minute Minimum Viable Habit** for any pending habit below:`,
          card: { type: "micro", habits: pending }
        };
      }

      // 0c. Context-Aware Ordinal Habit Completions ("mark the first one", "mark the second one")
      if (q.includes("first one") || q.includes("second one") || q.includes("third one") || q.includes("1st one") || q.includes("2nd one")) {
        let index = -1;
        if (q.includes("first") || q.includes("1st")) index = 0;
        else if (q.includes("second") || q.includes("2nd")) index = 1;
        else if (q.includes("third") || q.includes("3rd")) index = 2;

        if (this.lastListedHabits && this.lastListedHabits[index]) {
          const matchedHabit = this.lastListedHabits[index];
          const val = matchedHabit.type === "numeric" ? (matchedHabit.target || 1) : true;
          if (FL && FL.setCompletion) {
            await FL.setCompletion(todayKey, matchedHabit.id, val);
          }
          this.playChime("action");
          this.lastAction = { type: "complete", habitId: matchedHabit.id, habitName: matchedHabit.name, dateKey: todayKey };
          return {
            text: `Target executed! I marked **${matchedHabit.name}** done for today. ⚡`,
            card: { type: "undo", habitName: matchedHabit.name }
          };
        }
      }

      // 1. Add / Create Habit Command
      if (q.startsWith("add habit") || q.startsWith("create habit") || q.startsWith("new habit") || q.includes("add a habit")) {
        let habitName = q
          .replace(/^add habit/i, "")
          .replace(/^create habit/i, "")
          .replace(/^new habit/i, "")
          .replace(/^add a habit/i, "")
          .replace(/^to /i, "")
          .trim();

        if (habitName) {
          let category = "personal";
          if (/work|code|study|email|office|task|focus|project/i.test(habitName)) category = "work";
          else if (/water|exercise|gym|run|walk|health|fitness|pushup/i.test(habitName)) category = "health";
          else if (/diet|food|eat|meal|nutrition|sugar/i.test(habitName)) category = "diet";
          else if (/meditate|sleep|read|mind|journal|calm|breathe/i.test(habitName)) category = "mind";

          let isNumeric = false;
          let target = 1;
          let unit = "";
          const numMatch = habitName.match(/(\d+)\s*(glasses|meals|times|pages|minutes|mins|hours|hrs|reps)?/i);
          if (numMatch) {
            isNumeric = true;
            target = parseInt(numMatch[1], 10);
            unit = numMatch[2] || "times";
          }

          const newHabitObj = {
            id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: habitName.charAt(0).toUpperCase() + habitName.slice(1),
            category: category,
            type: isNumeric ? "numeric" : "check",
            target: isNumeric ? target : undefined,
            unit: isNumeric ? unit : undefined,
            createdAt: Date.now(),
          };

          if (FL && FL.addHabit) {
            await FL.addHabit(newHabitObj);
          } else if (FL && FL.saveHabits) {
            habits.push(newHabitObj);
            await FL.saveHabits(habits);
          }

          this.playChime("action");
          if (FL && FL.mascot && FL.mascot.cheer) {
            FL.mascot.cheer({ message: `Added "${newHabitObj.name}"! ⚔️` });
          }

          return `Target created! I have added **"${newHabitObj.name}"** to your **${category}** habits checklist. Let's make it a daily non-negotiable! 🎯`;
        }
      }

      // 2. Delete / Remove Habit Command
      if (q.startsWith("delete habit") || q.startsWith("remove habit")) {
        const targetSearch = q.replace(/^delete habit/i, "").replace(/^remove habit/i, "").trim();
        const matched = habits.find(h => h.name.toLowerCase().includes(targetSearch) || h.id.toLowerCase() === targetSearch);
        if (matched) {
          if (FL && FL.deleteHabit) {
            await FL.deleteHabit(matched.id);
          } else if (FL && FL.saveHabits) {
            const filtered = habits.filter(h => h.id !== matched.id);
            await FL.saveHabits(filtered);
          }
          return `Removed! Habit **"${matched.name}"** has been removed from your active list.`;
        } else {
          return `I couldn't find a habit matching "${targetSearch}". Say "list my habits" to view your active list.`;
        }
      }

      // 3. Check or Complete Habit Command (including numeric counts)
      if (q.includes("mark") || q.includes("complete") || q.includes("done") || q.includes("check off") || q.includes("drank") || q.includes("finished") || q.includes("did my")) {
        const matchedHabit = habits.find(h => {
          const nameLower = h.name.toLowerCase();
          return q.includes(nameLower) ||
                 (nameLower.includes("water") && q.includes("water")) ||
                 (nameLower.includes("move") && (q.includes("exercise") || q.includes("workout") || q.includes("gym"))) ||
                 (nameLower.includes("sleep") && q.includes("sleep")) ||
                 (nameLower.includes("social") && q.includes("social")) ||
                 (nameLower.includes("journal") && q.includes("journal")) ||
                 (nameLower.includes("meal") && q.includes("meal"));
        });

        if (matchedHabit) {
          let val = matchedHabit.type === "numeric" ? matchedHabit.target : true;
          const numMatch = q.match(/(\d+)/);
          if (numMatch && matchedHabit.type === "numeric") {
            val = parseInt(numMatch[1], 10);
          }

          if (FL && FL.setCompletion) {
            await FL.setCompletion(todayKey, matchedHabit.id, val);
          } else if (FL && FL.setValue && FL.saveCompletions) {
            FL.setValue(completions, todayKey, matchedHabit.id, val);
            await FL.saveCompletions(completions);
          }

          this.playChime("action");
          if (FL && FL.mascot && FL.mascot.cheer) {
            FL.mascot.cheer({ message: `Completed ${matchedHabit.name}! ⚡` });
          }

          this.lastAction = { type: "complete", habitId: matchedHabit.id, habitName: matchedHabit.name, dateKey: todayKey };
          return {
            text: `Target locked & executed! I have marked **${matchedHabit.name}** as completed for today. Forward momentum maintained! ⚡`,
            card: { type: "undo", habitName: matchedHabit.name }
          };
        }
      }

      // 4. Remaining Habits / Status Check
      if (q.includes("remaining") || q.includes("left") || q.includes("what habit") || q.includes("pending") || q.includes("todo") || q.includes("what is next")) {
        if (!habits.length) {
          return "You don't have any active habits set up yet. Head over to the habits tab or say 'add habit [name]' to create one!";
        }
        const pending = habits.filter(h => {
          const v = todayDone[h.id];
          return FL && FL.isHabitDone ? !FL.isHabitDone(h, v) : !v;
        });
        const doneCount = habits.length - pending.length;
        const pct = Math.round((doneCount / habits.length) * 100);

        if (pending.length === 0) {
          return `Incredible work! You have completed 100% of your habits today (${doneCount} of ${habits.length}). Peak performance unlocked! 🏆`;
        }

        this.lastListedHabits = pending;
        const pendingList = pending.map((h, idx) => `${idx + 1}. **${h.name}** (${h.category})`).join("\n");
        return {
          text: `You are at **${pct}%** daily completion (${doneCount} of ${habits.length} habits done).\n\nHere are your **${pending.length} remaining habits**:\n${pendingList}\n\nYou can click any habit card below or say *"mark the first one"*!`,
          card: { type: "habits", habits: pending }
        };
      }

      // 5. List All Habits
      if (q.includes("list") || q.includes("all habit") || q.includes("show habits")) {
        if (!habits.length) {
          return "You don't have any active habits yet. Say 'add habit [name]' to create your first one!";
        }
        const listStr = habits.map(h => {
          const isDone = FL && FL.isHabitDone ? FL.isHabitDone(h, todayDone[h.id]) : !!todayDone[h.id];
          return `• ${isDone ? "✅" : "⏳"} **${h.name}** (${h.category}${h.type === "numeric" ? ` · target ${h.target}` : ""})`;
        }).join("\n");
        return `Here is your full habits roster:\n\n${listStr}\n\nSay "mark [name] done" to check any off!`;
      }

      // 6. Level & XP Progression
      if (q.includes("level") || q.includes("xp") || q.includes("rank") || q.includes("progression")) {
        if (FL && FL.calculateXP && FL.getMascotLevel) {
          const totalXp = FL.calculateXP(completions, habits);
          const lvl = FL.getMascotLevel(totalXp);
          return `⭐ **Mascot Rank:** Level ${lvl.level} — ${lvl.title}\n` +
                 `✨ **Total XP:** ${lvl.totalXp} XP (${lvl.xpInLevel}/${lvl.levelRange} XP to ${lvl.nextTitle})\n` +
                 `📈 **Level Progress:** ${lvl.progressPct}%\n\n` +
                 `Every habit completion awards +10 XP, and perfect 100% days award a bonus +25 XP! Keep conquering! ⚔️`;
        }
      }

      // 7. Daily Executive Briefing
      if (q.includes("briefing") || q.includes("summary") || q.includes("overview") || q.includes("morning briefing") || q.includes("good morning") || q.includes("how am i doing")) {
        const doneCount = habits.filter(h => FL && FL.isHabitDone ? FL.isHabitDone(h, todayDone[h.id]) : !!todayDone[h.id]).length;
        const total = habits.length || 1;
        const pct = Math.round((doneCount / total) * 100);
        let bestStreak = 0;
        if (FL && FL.longestStreakAcrossHabits) {
          bestStreak = FL.longestStreakAcrossHabits(habits, completions);
        }

        let slumpAlert = "";
        if (FL && FL.detectSlump) {
          const slump = FL.detectSlump(habits, completions, 3);
          if (slump && slump.inSlump) {
            slumpAlert = `\n\n🛡️ **Slump Recovery Protocol Active:** Completion has dipped over recent days (${slump.avgPct}% avg). Focus on the **2-Minute Minimum Rule** today to lock in your identity without burnout!`;
          }
        }

        const randomQuote = MOTIVATIONAL_WISDOM[Math.floor(Math.random() * MOTIVATIONAL_WISDOM.length)];
        return `**Cadence Executive Briefing:**\n\n` +
               `🎯 **Daily Score:** ${doneCount} of ${habits.length} habits completed (${pct}%)\n` +
               `🔥 **Active Streak:** ${bestStreak} consecutive days\n` +
               `🛡️ **Protection:** Cadence Pro Streak Shield active` +
               slumpAlert + `\n\n` +
               `💡 **Mindset Anchor:** "${randomQuote}"`;
      }

      // 8. Streak Status
      if (q.includes("streak") || q.includes("shield")) {
        let bestStreak = 0;
        if (FL && FL.longestStreakAcrossHabits) {
          bestStreak = FL.longestStreakAcrossHabits(habits, completions);
        }
        return `Your current best streak is **${bestStreak} consecutive days**! Every consecutive day compounds into unstoppable momentum. Streak freeze shields are active to protect your streak. 🛡️🔥`;
      }

      // 9. Focus Sprint Start & Deep Work Voice Activation
      if (q.startsWith("start sprint") || q.startsWith("start focus") || q.startsWith("focus for") || q.startsWith("launch sprint") || q.includes("start deep work") || q.includes("start a sprint")) {
        let mins = 25;
        const match = q.match(/(\d+)/);
        if (match) mins = parseInt(match[1], 10);
        if (FL && FL.loadProSettings && FL.saveProSettings) {
          const pro = await FL.loadProSettings();
          pro.focusSession = {
            duration: mins,
            remainingSeconds: mins * 60,
            running: true,
            startedAt: Date.now(),
            intention: "Voice Activated Deep Work"
          };
          await FL.saveProSettings(pro);
          this.playChime("action");
          return `⚡ **${mins}-Minute Deep Work Sprint Activated!** Focus Guard is now shielding you against distracting websites. Time to execute with relentless clarity! 🛡️`;
        }
      }

      if (q.includes("pause sprint") || q.includes("stop sprint") || q.includes("pause focus")) {
        if (FL && FL.loadProSettings && FL.saveProSettings) {
          const pro = await FL.loadProSettings();
          if (pro.focusSession) {
            pro.focusSession.running = false;
            await FL.saveProSettings(pro);
            this.playChime("action");
            return `⏸️ **Focus Sprint Paused.** Shield deactivated. Say *"start sprint"* anytime to re-engage.`;
          }
        }
      }

      // 9b. Focus / Pomodoro Tips
      if (q.includes("focus") || q.includes("pomo") || q.includes("timer") || q.includes("deep work") || q.includes("sprint")) {
        return {
          text: `⏱️ **Cadence Deep Work Protocol:**\n` +
                `1. **Single-Tasking:** Silence notifications & eliminate background distractions.\n` +
                `2. **Focus Guard:** Distracting domains are automatically shielded.\n` +
                `3. **Soundscapes:** Layer Rain with 40Hz Gamma focus frequency to lock in cognitive flow.\n\n` +
                `Launch a focus session directly below:`,
          card: { type: "sprint" }
        };
      }

      // 10. Subscription & License
      if (q.startsWith("activate key") || q.startsWith("activate license") || q.includes("license key") || q.includes("cdnc-")) {
        return `Cadence Pro subscriptions are managed automatically via your account. Click the **⚡ PRO** button in your top bar or open the Subscription Manager from your dashboard to view your active status.`;
      }

      // 11. SaaS Pricing & Plans
      if (/\b(pro|pricing|cost|price|plans?|upgrade|subscription)\b/i.test(q) || q.includes("how much") || q.includes("razorpay") || q.includes("stripe")) {
        return `⚡ **Cadence Pro Pricing & Plans:**\n\n` +
               `• **Monthly Plan:** **₹69 / month** (Recurring monthly billing · Full access · Cancel anytime)\n` +
               `• **Yearly Plan:** **₹799 / year** (~₹66/month · **Save ₹29/year vs monthly** · Uninterrupted access)\n\n` +
               `Includes all 34 4K environments, all AI companions, 432Hz spatial soundscapes, unlimited AI coach queries, and streak freeze shields! Click the ⚡ PRO button in your top bar or open Dashboard to manage your subscription. 🛡️`;
      }

      // 11. Ready-Made Day-to-Day Tasks & Routine Packs
      if (q.includes("ready made") || q.includes("routine pack") || q.includes("starter pack") || q.includes("default task") || q.includes("suggest task") || q.includes("morning pack") || q.includes("morning routine") || q.includes("health pack") || q.includes("focus pack") || q.includes("deep work pack") || q.includes("evening pack") || q.includes("student pack") || q.includes("mindfulness pack")) {
        const packs = FL && FL.READY_MADE_TASK_PACKS ? FL.READY_MADE_TASK_PACKS : [];

        // Check if specific pack requested to add
        let targetPack = null;
        if (q.includes("morning")) targetPack = packs.find(p => p.id === "morning_kickstart");
        else if (q.includes("work") || q.includes("focus") || q.includes("deep")) targetPack = packs.find(p => p.id === "deep_work_focus");
        else if (q.includes("health") || q.includes("vitality") || q.includes("fit")) targetPack = packs.find(p => p.id === "vitality_health");
        else if (q.includes("mind") || q.includes("peace") || q.includes("calm")) targetPack = packs.find(p => p.id === "mindfulness_peace");
        else if (q.includes("evening") || q.includes("sleep") || q.includes("night") || q.includes("wind")) targetPack = packs.find(p => p.id === "evening_winddown");
        else if (q.includes("student") || q.includes("study")) targetPack = packs.find(p => p.id === "student_mastery");

        if (targetPack && (q.includes("add") || q.includes("load") || q.includes("apply") || q.includes("set") || q.includes("start"))) {
          if (FL && FL.addReadyMadePack) {
            const res = await FL.addReadyMadePack(targetPack.id);
            this.playChime("action");
            if (FL.mascot && FL.mascot.cheer) {
              FL.mascot.cheer({ message: `Added ${targetPack.name}! ✨` });
            }
            const taskBullets = targetPack.tasks.map(t => `• **${t.name}** (${t.category})`).join("\n");
            return `🚀 **Routine Pack Loaded!** I have added the **${targetPack.name}** (${targetPack.tasks.length} tasks) to your checklist:\n\n${taskBullets}\n\nLet's crush this routine today! ⚡`;
          }
        }

        if (q.includes("default") && (q.includes("load") || q.includes("restore") || q.includes("reset"))) {
          if (FL && FL.loadDefaultHabits) {
            const defaults = await FL.loadDefaultHabits();
            this.playChime("action");
            if (FL.mascot && FL.mascot.cheer) {
              FL.mascot.cheer({ message: "Loaded essential habits! ⚡" });
            }
            return `⚡ **Universal Habits Restored!** Loaded ${defaults.length} essential daily habits into your checklist (Hydration, Deep Work, Exercise, Balanced Meals, Mindfulness, Reading, Daily Plan, Restful Sleep).`;
          }
        }

        // Otherwise list all available ready-made packs
        const packList = packs.map(p => `• **${p.icon} ${p.name}:** ${p.tagline}`).join("\n");
        return `✨ **Ready-Made Day-to-Day Task Packs:**\n\n${packList}\n\nSay *"add morning pack"*, *"add deep work pack"*, or *"add health pack"* to load any routine instantly!`;
      }

      // 11b. AI Routine Generator — Natural Language
      if (q.includes("generate routine") || q.includes("create routine") || q.includes("create a routine") || q.includes("generate a routine") || q.includes("build routine") || q.includes("make routine") || q.includes("design routine")) {
        const promptClean = q
          .replace(/generate|create|build|make|design|a\s+routine\s+for/gi, "")
          .replace(/routine/gi, "")
          .trim();
        if (promptClean && FL && FL.applyCustomRoutinePrompt) {
          const result = await FL.applyCustomRoutinePrompt(promptClean);
          this.playChime("action");
          if (FL.mascot && FL.mascot.cheer) {
            FL.mascot.cheer({ message: `Custom routine created! ✨` });
          }
          const taskList = result.tasks ? result.tasks.map(t => `• **${t.name}** (${t.category})`).join("\n") : "Custom tasks generated";
          return `🧠 **AI Routine Generated!** Based on your prompt *"${promptClean}"*, I have created a custom routine:\n\n${taskList}\n\nAll tasks have been added to your habits checklist. Let's get after it! ⚡`;
        }
        return `Tell me what kind of routine you want! For example: *"generate routine for software engineer morning"*, *"create routine for fitness"*, or *"build routine for student exam prep"*.`;
      }

      // 11c. Ambient Soundscape Voice Controls & Layering
      if (q.includes("layer") && (q.includes("rain") || q.includes("gamma") || q.includes("sound") || q.includes("audio"))) {
        if (FL && FL.playLayeredSoundscapes) {
          FL.playLayeredSoundscapes("lofi_rain", "binaural_gamma", { masterVol: 0.65, ambientVol: 0.5, binauralVol: 0.35 });
          this.playChime("action");
          return {
            text: `🎵 **Layered Soundscape Activated!** Playing **Lofi Rain + 40Hz Gamma Focus Frequency** in simultaneous acoustic resonance. Cognitive flow state engaged. 🛡️`,
            card: { type: "sound" }
          };
        }
      }

      if (q.includes("play rain") || q.includes("play zen") || q.includes("play cosmic") || q.includes("play cyberpunk") || q.includes("play forest") || q.includes("play ocean") || q.includes("play brown") || q.includes("play gamma") || q.includes("play alpha") || q.includes("play sound") || q.includes("play music") || q.includes("play audio") || q.includes("start sound") || q.includes("ambient") || q.includes("soundscape")) {
        let soundType = "lofi_rain";
        if (q.includes("zen") || q.includes("bowl")) soundType = "zen_bowls";
        else if (q.includes("gamma") || q.includes("40hz") || q.includes("deep focus")) soundType = "binaural_gamma";
        else if (q.includes("alpha") || q.includes("10hz") || q.includes("calm flow")) soundType = "binaural_alpha";
        else if (q.includes("cosmic") || q.includes("drift") || q.includes("space")) soundType = "cosmic_drift";
        else if (q.includes("cyberpunk") || q.includes("cyber") || q.includes("synth")) soundType = "cyber_cafe";
        else if (q.includes("forest") || q.includes("breeze") || q.includes("pine")) soundType = "forest";
        else if (q.includes("ocean") || q.includes("brown") || q.includes("wave")) soundType = "brown";

        if (FL && FL.playAmbientSoundscape) {
          FL.playAmbientSoundscape(soundType, 0.5);
          this.playChime("action");
          const names = {
            lofi_rain: "Rain",
            zen_bowls: "Zen Bowls (432Hz)",
            cosmic_drift: "Cosmic Drift",
            cyber_cafe: "Cyberpunk Synth",
            forest: "Pine Forest",
            brown: "Deep Ocean Waves",
            binaural_gamma: "40Hz Gamma Focus Beats",
            binaural_alpha: "10Hz Alpha Flow Beats"
          };
          return {
            text: `🎵 **${names[soundType] || soundType} activated!** Pure Web Audio synthesized offline. Choose or layer other soundscapes below:`,
            card: { type: "sound" }
          };
        }
        return `Ambient soundscapes are available in Pro mode. Head to Dashboard > Pro Suite to enable them.`;
      }

      if (q.includes("stop sound") || q.includes("stop music") || q.includes("stop audio") || q.includes("pause sound") || q.includes("mute sound") || q.includes("silence")) {
        if (FL && FL.stopAmbientSoundscape) {
          FL.stopAmbientSoundscape();
          this.playChime("action");
          return `🔇 **Soundscape stopped.** Ambient audio paused. Say *"play rain"* or choose below:`;
        }
      }

      // 11d. Dynamic Wallpaper & Parallax Voice Controls
      if (q.includes("time shift") || q.includes("dynamic shift") || q.includes("auto wallpaper") || q.includes("day night")) {
        const enable = !q.includes("disable") && !q.includes("off") && !q.includes("stop");
        if (FL && FL.loadProSettings && FL.saveProSettings && FL.applyThemeEngine) {
          try {
            const pro = await FL.loadProSettings();
            pro.themeSettings.dynamicTimeShift = enable;
            FL.applyThemeEngine(pro.themeSettings);
            await FL.saveProSettings(pro);
            this.playChime("action");
            return enable
              ? `🌅 **Dynamic Time Shift enabled!** Your wallpaper will now automatically transition through dawn, day, sunset, and midnight atmospheres.`
              : `Dynamic Time Shift has been disabled. Your wallpaper is now fixed.`;
          } catch (e) {}
        }
      }

      if (q.includes("parallax") || q.includes("3d depth") || q.includes("3d effect") || q.includes("mouse depth")) {
        return `✨ Wallpaper hover animation has been permanently disabled for an entirely stable, distraction-free new tab experience.`;
      }

      // 12. Ultra HD Wallpaper & Background Changing (Pro Mode)
      if (q.includes("wallpaper") || q.includes("background") || (q.includes("theme") && (q.includes("change") || q.includes("set") || q.includes("4k") || q.includes("8k")))) {
        const wallpapers = (FL && FL.WALLPAPERS ? FL.WALLPAPERS : []).filter(w => w.id !== "none" && w.id !== "custom");

        if (q.includes("show") || q.includes("list") || q.includes("what wallpapers") || q.includes("options")) {
          const sampleList = wallpapers.map(w => `• **${w.name}** [${w.badge}] (${w.category} · ${w.mood})`).join("\n");
          return `🎨 **High-Definition 4K, 8K & 12K Ultra HD Environments (Cadence Pro):**\n\n${sampleList}\n\nSay *"change wallpaper to dolomites"*, *"set wallpaper to vestrahorn"*, *"set wallpaper to geiranger"*, or *"random wallpaper"* to change your Chrome background instantly!`;
        }

        let targetWp = null;
        if (q.includes("random") || q.includes("next") || q.includes("surprise")) {
          targetWp = wallpapers[Math.floor(Math.random() * wallpapers.length)];
        } else {
          // Find matching wallpaper name or keyword
          const cleanQuery = q.replace(/change|set|switch|wallpaper|background|to|the|4k|8k|12k|browser/gi, "").trim();
          if (cleanQuery) {
            targetWp = wallpapers.find(w => 
              w.name.toLowerCase().includes(cleanQuery) || 
              w.id.toLowerCase().includes(cleanQuery) ||
              w.category.toLowerCase().includes(cleanQuery) ||
              w.mood.toLowerCase().includes(cleanQuery)
            );
          }
        }

        // Direct matching for new Ultra HD environments
        if (!targetWp && (q.includes("dolomite") || q.includes("lightbeam") || q.includes("sunbeam"))) targetWp = wallpapers.find(w => w.id === "dolomites_sunbeams_8k");
        if (!targetWp && (q.includes("alps") || q.includes("summit") || (q.includes("panorama") && q.includes("12k")))) targetWp = wallpapers.find(w => w.id === "alpine_lake_panorama_12k");
        if (!targetWp && (q.includes("brook") || q.includes("stream") || (q.includes("meadow") && q.includes("12k")))) targetWp = wallpapers.find(w => w.id === "golden_meadow_brook_12k");
        if (!targetWp && (q.includes("vestrahorn") || q.includes("iceland"))) targetWp = wallpapers.find(w => w.id === "vestrahorn_twilight_6k");
        if (!targetWp && (q.includes("balos") || q.includes("lagoon") || q.includes("boat"))) targetWp = wallpapers.find(w => w.id === "balos_lagoon_boat_8k");
        if (!targetWp && (q.includes("geiranger") || q.includes("fjord"))) targetWp = wallpapers.find(w => w.id === "geiranger_fjord_6k");
        if (!targetWp && (q.includes("winnats") || q.includes("pass sunrise"))) targetWp = wallpapers.find(w => w.id === "winnats_pass_sunrise_6k");
        if (!targetWp && (q.includes("half dome") || q.includes("river mirror"))) targetWp = wallpapers.find(w => w.id === "yosemite_half_dome_6k");
        if (!targetWp && (q.includes("el capitan") || q.includes("bridalveil") || q.includes("yosemite valley"))) targetWp = wallpapers.find(w => w.id === "yosemite_valley_vista_8k");
        if (!targetWp && (q.includes("autumn lake") || q.includes("fall lake"))) targetWp = wallpapers.find(w => w.id === "yosemite_autumn_lake_4k");
        if (!targetWp && (q.includes("na pali") || q.includes("kauai"))) targetWp = wallpapers.find(w => w.id === "na_pali_coast_6k");
        if (!targetWp && (q.includes("hawaii") || q.includes("hawaiian"))) targetWp = wallpapers.find(w => w.id === "hawaiian_sunset_peaks_8k");
        if (!targetWp && (q.includes("infinity") || q.includes("palm"))) targetWp = wallpapers.find(w => w.id === "palm_infinity_reflection_8k");
        if (!targetWp && (q.includes("white sand") || q.includes("shoreline"))) targetWp = wallpapers.find(w => w.id === "white_sand_shoreline_4k");
        if (!targetWp && (q.includes("keyhole") || q.includes("pfeiffer") || q.includes("big sur"))) targetWp = wallpapers.find(w => w.id === "keyhole_arch_sunset_8k");
        if (!targetWp && (q.includes("cinque terre") || q.includes("vernazza"))) targetWp = wallpapers.find(w => w.id === "cinque_terre_twilight");
        if (!targetWp && (q.includes("trails") || q.includes("night road"))) targetWp = wallpapers.find(w => w.id === "alpine_pass_trails");
        if (!targetWp && (q.includes("alaska") || q.includes("ice fjord"))) targetWp = wallpapers.find(w => w.id === "alaskan_ice_fjord_6k");
        if (!targetWp && (q.includes("sunburst") || q.includes("tarn"))) targetWp = wallpapers.find(w => w.id === "alpine_sunburst_range_8k");
        if (!targetWp && (q.includes("zion") || q.includes("canyon"))) targetWp = wallpapers.find(w => w.id === "zion_canyon_falls_6k");
        if (!targetWp && (q.includes("tatras") || q.includes("dusk"))) targetWp = wallpapers.find(w => w.id === "tatras_purple_dusk");
        if (!targetWp && (q.includes("pinnacle") || q.includes("wanderer"))) targetWp = wallpapers.find(w => w.id === "pinnacle_wanderer");
        if (!targetWp && (q.includes("cypress") || q.includes("ridge"))) targetWp = wallpapers.find(w => w.id === "cypress_mountain_ridge_6k");
        if (!targetWp && (q.includes("cloud sea") || q.includes("sea of clouds"))) targetWp = wallpapers.find(w => w.id === "cloud_sea_summit_6k");
        if (!targetWp && (q.includes("prairie") || q.includes("silhouettes"))) targetWp = wallpapers.find(w => w.id === "sunset_prairie_silhouettes_8k");
        if (!targetWp && (q.includes("lavender") || (q.includes("twilight") && q.includes("lake")))) targetWp = wallpapers.find(w => w.id === "lavender_lake_twilight_6k");
        if (!targetWp && (q.includes("canopy") || (q.includes("emerald") && q.includes("lake")))) targetWp = wallpapers.find(w => w.id === "emerald_lake_canopy");
        if (!targetWp && (q.includes("foliage") || q.includes("botanical"))) targetWp = wallpapers.find(w => w.id === "midnight_foliage_6k");
        if (!targetWp && (q.includes("taiga") || q.includes("expedition"))) targetWp = wallpapers.find(w => w.id === "taiga_expedition_8k");
        if (!targetWp && (q.includes("wetlands") || q.includes("river bend"))) targetWp = wallpapers.find(w => w.id === "river_bend_wetlands_8k");
        if (!targetWp && (q.includes("oak") || q.includes("solitary"))) targetWp = wallpapers.find(w => w.id === "solitary_meadow_oak_8k");
        if (!targetWp && (q.includes("wireframe") || q.includes("prismatic") || q.includes("matrix"))) targetWp = wallpapers.find(w => w.id === "poly_matrix_emerald_8k");
        if (!targetWp && (q.includes("wooden") || q.includes("labyrinth") || q.includes("blocks"))) targetWp = wallpapers.find(w => w.id === "wooden_labyrinth_8k");

        if (!targetWp && (q.includes("8k") || q.includes("12k"))) {
          const wpsUltra = wallpapers.filter(w => (w.badge && (w.badge.includes("8K") || w.badge.includes("12K"))) || w.id.includes("8k") || w.id.includes("12k"));
          if (wpsUltra.length > 0) targetWp = wpsUltra[Math.floor(Math.random() * wpsUltra.length)];
        }

        if (!targetWp && wallpapers.length > 0) {
          targetWp = wallpapers[Math.floor(Math.random() * wallpapers.length)];
        }

        if (targetWp && FL) {
          try {
            const pro = FL.loadProSettings ? await FL.loadProSettings() : null;
            if (pro) {
              pro.themeSettings.wallpaperId = targetWp.id;
              pro.themeSettings.customWallpaperUrl = "";
              if (targetWp.themeId) {
                pro.themeSettings.paletteId = targetWp.themeId;
              }
              if (FL.applyThemeEngine) {
                FL.applyThemeEngine(pro.themeSettings);
              }
              if (FL.saveProSettings) {
                await FL.saveProSettings(pro);
              }
              this.playChime("action");
              if (FL.mascot && FL.mascot.cheer) {
                FL.mascot.cheer({ message: `Applied ${targetWp.name}! 🎨` });
              }
              return `🎨 **4K Background Updated!** I have applied **${targetWp.name}** (${targetWp.category} · ${targetWp.mood}). Your Chrome workspace is looking sharp! 🌟`;
            }
          } catch (err) {
            console.warn("Could not set wallpaper:", err);
          }
        }
      }


      // 14. Motivational Coaching / Wisdom
      if (q.includes("motivat") || q.includes("quote") || q.includes("inspire") || q.includes("advice") || q.includes("mindset") || q.includes("stoic")) {
        const randomQuote = MOTIVATIONAL_WISDOM[Math.floor(Math.random() * MOTIVATIONAL_WISDOM.length)];
        return `Here is your mindset anchor for today:\n\n*"${randomQuote}"*`;
      }

      // 15. Greetings & Quick Conversation
      if (/^(hi|hello|hey|howdy|greetings|good morning|good evening|good afternoon)\b/i.test(q) && !q.includes("briefing")) {
        return `Hello! I am **Cadence**, your executive habit mentor and performance partner. How can I assist you today? You can ask for your **daily briefing**, say *"what habits are left?"*, or explore **ready-made task packs**! ⚡`;
      }

      // 16. Dashboard Navigation
      if (q.includes("open dashboard") || q.includes("show dashboard") || q.includes("go to dashboard")) {
        if (typeof window !== "undefined") {
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 600);
          return `Opening your **Cadence Executive Dashboard** now... 🚀`;
        }
      }

      // 17. Identity / Who are you
      if (q.includes("who are you") || q.includes("your name") || q.includes("cadence") || q.includes("what can you do") || q.includes("help")) {
        return `I am **Cadence**, your executive personal AI companion and habit mentor. Here is what I can do for you:\n\n` +
               `• **Ready-Made Tasks:** Say *"ready made tasks"* or *"add morning routine pack"*\n` +
               `• **AI Routine Generator:** Say *"generate routine for software engineer"* or *"create fitness routine"*\n` +
               `• **Ultra HD Wallpapers:** Say *"change wallpaper to dolomites"* or *"random wallpaper"*\n` +
               `• **Ambient Soundscapes:** Say *"play rain sound"*, *"play zen bowls"*, or *"stop sound"*\n` +
               `• **Dynamic Atmosphere:** Say *"enable time shift"*\n` +
               `• **Check Habits:** Say *"mark water done"* or *"completed workout"*\n` +
               `• **Add Custom Habits:** Say *"add habit meditate for 10 mins"*\n` +
               `• **Status & Briefing:** Say *"what habits are left today?"* or *"daily briefing"*\n` +
               `• **Pricing & Pro:** Say *"how much is pro?"* or *"upgrade to pro"*\n` +
               `• **Analytics & Streaks:** Say *"what is my streak?"* or *"what is my level?"*\n` +
               `• **Focus & Mindset:** Say *"give me motivation"* or *"focus tips"*`;
      }

      // 18. Chrome Built-in AI (Prompt API) / Gemini / Goal Breakdown Fallback
      if (this.aiModel) {
        try {
          const prompt = `User says: "${query}". You are Cadence, an elite performance coach. Habits count: ${habits.length}, completed today: ${todayDone ? Object.keys(todayDone).length : 0}. Give a punchy, sharp, highly actionable response in 2-3 sentences.`;
          const reply = await this.aiModel.prompt(prompt);
          if (reply && reply.trim()) return reply.trim();
        } catch (e) {
          console.warn("Chrome AI prompt error:", e);
        }
      }

      // Check for user-provided Gemini API Key in settings
      let aiApiKey = "";
      try {
        const storedSettings = await chrome.storage.local.get(["fl_settings"]);
        aiApiKey = (storedSettings.fl_settings && storedSettings.fl_settings.aiApiKey) || "";
      } catch (e) {}

      if (aiApiKey) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiApiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `You are Cadence, an executive habit and performance mentor. The user has ${habits.length} habits. User query: "${query}". Respond with concise, motivating, actionable advice in 2-3 sentences.` }]
              }]
            })
          });
          const data = await res.json();
          const reply = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
          if (reply) return reply.trim();
        } catch (err) {
          console.warn("Gemini API call error:", err);
        }
      }

      // Smart Goal Decomposition and Habit Stacking Framework
      if (q.includes("goal") || q.includes("how to start") || q.includes("how do i") || q.includes("plan for") || q.includes("want to") || q.includes("achieve")) {
        return `🎯 **Cadence Atomic Framework for Your Goal:**\n\n` +
               `1. **Make it Obvious (Anchor Cue):** Stack it immediately after an existing daily anchor (e.g., *"After morning coffee, I will..."*).\n` +
               `2. **2-Minute Rule:** Shrink initial friction to under 120 seconds. Master showing up before optimizing.\n` +
               `3. **Never Miss Twice:** Even on low-energy days, execute the minimum viable habit to preserve streak identity.\n\n` +
               `Say *"create routine for [your goal]"* and I will automatically build and load these daily habits for you! ⚡`;
      }

      // General Executive Fallback
      return `Understood. I am standing by to assist your habit tracking and daily productivity. You can ask for your **daily briefing**, say *"start sprint 25"*, explore **ready-made task packs**, change to an **8K wallpaper**, or request **motivational coaching**!`;
    }
  }

  // Global instance
  const agentInstance = new CadenceAIAgent();
  global.CadenceAgent = agentInstance;

  // Auto mount on DOM ready
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => agentInstance.mount());
    } else {
      agentInstance.mount();
    }
  }

})(typeof window !== "undefined" ? window : globalThis);
