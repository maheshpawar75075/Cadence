/* ================================================================
   Cadence New Tab — newtab.js
   Authentic Google Experience & Executive Productivity Engine
   ================================================================ */

(function () {
  "use strict";

  const FL = typeof window !== "undefined" && window.FL ? window.FL : {};
  const STORAGE_KEY_SHORTCUTS = "cadence_custom_shortcuts";

  const INITIAL_SHORTCUTS = [
    { label: "YouTube", url: "https://www.youtube.com" },
    { label: "Gmail", url: "https://mail.google.com" },
    { label: "Google Drive", url: "https://drive.google.com" },
    { label: "GitHub", url: "https://github.com" },
  ];

  let currentShortcuts = [...INITIAL_SHORTCUTS];
  let currentPro = null;

  /* ===================================================================
   * Official Google Apps Vector SVGs (High-Fidelity)
   * =================================================================== */
  const GOOGLE_APP_ICONS = {
    search: `<svg viewBox="0 0 24 24" width="36" height="36"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>`,
    docs: `<svg viewBox="0 0 48 48" width="36" height="36"><path fill="#4285F4" d="M30 4H12C9.79 4 8 5.79 8 8v32c0 2.21 1.79 4 4 4h24c2.21 0 4-1.79 4-4V16L30 4z"/><path fill="#A1C2FA" d="M30 4v12h12L30 4z"/><path fill="#fff" d="M16 22h16v2.5H16zm0 6h16v2.5H16zm0 6h10v2.5H16z"/></svg>`,
    sheets: `<svg viewBox="0 0 48 48" width="36" height="36"><path fill="#0F9D58" d="M30 4H12C9.79 4 8 5.79 8 8v32c0 2.21 1.79 4 4 4h24c2.21 0 4-1.79 4-4V16L30 4z"/><path fill="#87CEAC" d="M30 4v12h12L30 4z"/><path fill="#fff" d="M16 22h16v14H16zm2 2v3h5v-3zm7 0v3h5v-3zm-7 5v3h5v-3zm7 0v3h5v-3zm-7 5v2h5v-2zm7 0v2h5v-2z"/></svg>`,
    slides: `<svg viewBox="0 0 48 48" width="36" height="36"><path fill="#F4B400" d="M30 4H12C9.79 4 8 5.79 8 8v32c0 2.21 1.79 4 4 4h24c2.21 0 4-1.79 4-4V16L30 4z"/><path fill="#FCD770" d="M30 4v12h12L30 4z"/><path fill="#fff" d="M16 22h16v12H16zm2 2v8h12v-8z"/></svg>`,
    drive: `<svg viewBox="0 0 48 48" width="36" height="36"><path fill="#FFC107" d="M17 6L7 23.5l8.5 14.5L25.5 20.5z"/><path fill="#4CAF50" d="M31 6H17l8.5 14.5L39.5 20.5z"/><path fill="#2196F3" d="M39.5 20.5l-8.5 14.5H15.5l8.5-14.5z"/></svg>`,
    gmail: `<svg viewBox="0 0 48 48" width="36" height="36"><path fill="#4285F4" d="M42 10.5V38a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V10.5l18 12.5 18-12.5z"/><path fill="#34A853" d="M6 10.5L24 23 42 10.5 42 10a4 4 0 0 0-4-4H10a4 4 0 0 0-4 4v.5z"/><path fill="#EA4335" d="M6 10.5V38a4 4 0 0 0 4 4h2V18.5L6 10.5z"/><path fill="#FBBC05" d="M42 10.5V38a4 4 0 0 1-4 4h-2V18.5l6-8z"/><path fill="#EA4335" d="M24 23L6 10.5 10 6l14 10 14-10 4 4.5z"/></svg>`,
    calendar: `<svg viewBox="0 0 48 48" width="36" height="36"><rect width="36" height="36" x="6" y="6" fill="#fff" rx="8"/><path fill="#4285F4" d="M34 6H14a8 8 0 0 0-8 8v6h36v-6a8 8 0 0 0-8-8z"/><circle cx="16" cy="13" r="2" fill="#fff"/><circle cx="32" cy="13" r="2" fill="#fff"/><text x="24" y="34" font-family="'Google Sans', 'Roboto', sans-serif" font-size="14" font-weight="700" fill="#4285F4" text-anchor="middle">31</text></svg>`,
    meet: `<svg viewBox="0 0 48 48" width="36" height="36"><rect width="24" height="20" x="6" y="14" fill="#00832d" rx="4"/><path fill="#0066da" d="M6 18a4 4 0 0 1 4-4h8v20h-8a4 4 0 0 1-4-4V18z"/><path fill="#e53935" d="M30 18l12-8v28l-12-8v-12z"/><path fill="#ffba00" d="M18 14h8a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4h-8V14z"/><path fill="#00ac47" d="M30 20l6-4v16l-6-4v-8z"/></svg>`,
    chat: `<svg viewBox="0 0 48 48" width="36" height="36"><path fill="#00832D" d="M8 12a4 4 0 0 1 4-4h18a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H14l-6 6z"/><path fill="#00AC47" d="M18 20h18a4 4 0 0 1 4 4v10l-6-4H18a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4z"/></svg>`,
    maps: `<svg viewBox="0 0 48 48" width="36" height="36"><path fill="#4285F4" d="M24 4C14.06 4 6 12.06 6 22c0 13.5 18 22 18 22s18-8.5 18-22c0-9.94-8.06-18-18-18z"/><path fill="#EA4335" d="M24 4c-9.94 0-18 8.06-18 18 0 5.48 2.5 10.37 6.42 13.62L24 22V4z"/><path fill="#FBBC05" d="M12.42 35.62C15.54 38.2 19.5 40.5 24 44c4.5-3.5 8.46-5.8 11.58-8.38L24 22l-11.58 13.62z"/><path fill="#34A853" d="M35.58 35.62C39.5 32.37 42 27.48 42 22c0-9.94-8.06-18-18-18v18l11.58 13.62z"/><circle cx="24" cy="22" r="7" fill="#fff"/></svg>`,
    youtube: `<svg viewBox="0 0 48 48" width="36" height="36"><path fill="#FF0000" d="M43.2 13.8c-.5-1.9-2-3.4-3.9-3.9C35.8 9 24 9 24 9s-11.8 0-15.3.9c-1.9.5-3.4 2-3.9 3.9C4 17.3 4 24 4 24s0 6.7.8 10.2c.5 1.9 2 3.4 3.9 3.9 3.5.9 15.3.9 15.3.9s11.8 0 15.3-.9c1.9-.5 3.4-2 3.9-3.9.8-3.5.8-10.2.8-10.2s0-6.7-.8-10.2z"/><path fill="#fff" d="M20 30l10.4-6L20 18z"/></svg>`,
    keep: `<svg viewBox="0 0 48 48" width="36" height="36"><path fill="#FFBB00" d="M12 6h24a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z"/><path fill="#fff" d="M24 12c-4.42 0-8 3.58-8 8 0 2.76 1.4 5.2 3.52 6.64V29a1.5 1.5 0 0 0 1.5 1.5h5.96A1.5 1.5 0 0 0 28.5 29v-2.36A7.98 7.98 0 0 0 32 20c0-4.42-3.58-8-8-8zm-2 20h4v2h-4z"/></svg>`,
    forms: `<svg viewBox="0 0 48 48" width="36" height="36"><path fill="#7248B9" d="M30 4H12C9.79 4 8 5.79 8 8v32c0 2.21 1.79 4 4 4h24c2.21 0 4-1.79 4-4V16L30 4z"/><path fill="#A583DD" d="M30 4v12h12L30 4z"/><path fill="#fff" d="M16 22h2v2h-2zm4 0h12v2H20zm-4 6h2v2h-2zm4 0h12v2H20zm-4 6h2v2h-2zm4 0h12v2H20z"/></svg>`,
    photos: `<svg viewBox="0 0 48 48" width="36" height="36"><path fill="#EA4335" d="M24 6c0 4.97-4.03 9-9 9H6c0-4.97 4.03-9 9-9h9z"/><path fill="#4285F4" d="M42 24c-4.97 0-9-4.03-9-9V6c4.97 0 9 4.03 9 9v9z"/><path fill="#34A853" d="M24 42c0-4.97 4.03-9 9-9h9c0 4.97-4.03 9-9 9h-9z"/><path fill="#FBBC05" d="M6 24c4.97 0 9 4.03 9 9v9c-4.97 0-9-4.03-9-9v-9z"/></svg>`,
    translate: `<svg viewBox="0 0 48 48" width="36" height="36"><rect width="36" height="36" x="6" y="6" fill="#4285F4" rx="8"/><path fill="#fff" d="M14 16h10v2h-4v8h-2v-8h-4zm15.5 0h2.5l5 14h-2.5l-1.2-3.5h-5.1L27 30h-2.5zm1.2 2.5l-1.8 5.5h3.6z"/><path fill="#A1C2FA" d="M14 26c2.5 0 4.5-1.5 5.5-3.5h-2.2c-.6 1-1.8 1.5-3.3 1.5-2.2 0-3.8-1.5-4-3.5h10v-1.5H10c0 4 3.5 7 8 7z"/></svg>`,
    contacts: `<svg viewBox="0 0 48 48" width="36" height="36"><rect width="36" height="36" x="6" y="6" fill="#1A73E8" rx="8"/><circle cx="24" cy="18" r="5" fill="#fff"/><path fill="#fff" d="M14 34c0-4 4.5-6.5 10-6.5s10 2.5 10 6.5v2H14z"/></svg>`,
    gemini: `<svg viewBox="0 0 48 48" width="36" height="36"><defs><linearGradient id="geminiGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1BA1E3"/><stop offset="50%" stop-color="#5B6CF9"/><stop offset="100%" stop-color="#C75BFF"/></linearGradient></defs><path fill="url(#geminiGrad)" d="M24 4C24 15.05 15.05 24 4 24c11.05 0 20 8.95 20 20 0-11.05 8.95-20 20-20-11.05 0-20-8.95-20-20z"/></svg>`,
    webstore: `<svg viewBox="0 0 48 48" width="36" height="36"><rect width="36" height="36" x="6" y="6" fill="#fff" rx="8"/><path fill="#4285F4" d="M24 10l12 7v14l-12 7-12-7V17z"/><path fill="#34A853" d="M24 10l12 7-12 7-12-7z"/><path fill="#FBBC05" d="M12 17l12 7v14l-12-7z"/><path fill="#EA4335" d="M36 17v14l-12 7V24z"/></svg>`,
    play: `<svg viewBox="0 0 48 48" width="36" height="36"><path fill="#4CAF50" d="M8 6.5l19 17.5L8 41.5z"/><path fill="#FF9800" d="M27 24l-5.5-5.5L34 10.5 27 24z"/><path fill="#2196F3" d="M8 6.5l13.5 12L27 24 8 6.5z"/><path fill="#E91E63" d="M27 24l7 13.5-12.5-8L27 24z"/><path fill="#FFC107" d="M34 10.5l4 2.5a4 4 0 0 1 0 7l-4 4-7-7 7-6.5z"/></svg>`,
    news: `<svg viewBox="0 0 48 48" width="36" height="36"><rect width="36" height="36" x="6" y="6" fill="#fff" rx="8"/><path fill="#4285F4" d="M12 14h24v4H12zm0 8h14v12H12zm18 0h6v4h-6zm0 8h6v4h-6z"/></svg>`,
    earth: `<svg viewBox="0 0 48 48" width="36" height="36"><circle cx="24" cy="24" r="18" fill="#1A73E8"/><path fill="#34A853" d="M18 10c2 3 6 4 9 2s6 4 5 7c-2 6-6 4-7 8s-4 6-9 6c-3 0-5-3-7-6 1-4 4-8 5-11s1-4 4-6z"/></svg>`,
    classroom: `<svg viewBox="0 0 48 48" width="36" height="36"><rect width="36" height="28" x="6" y="10" fill="#137333" rx="4"/><rect width="32" height="24" x="8" y="12" fill="#fff" rx="2"/><circle cx="24" cy="20" r="4" fill="#F9AB00"/><path fill="#137333" d="M16 30c0-3.3 3.6-5 8-5s8 1.7 8 5H16z"/></svg>`,
    flights: `<svg viewBox="0 0 48 48" width="36" height="36"><circle cx="24" cy="24" r="18" fill="#1A73E8"/><path fill="#fff" d="M34 22l-8-6v-6a2 2 0 1 0-4 0v6l-8 6v3l8-2v5l-3 2.5v2.5l5-1.5 5 1.5V32.5L26 30v-5l8 2v-3z"/></svg>`,
    finance: `<svg viewBox="0 0 48 48" width="36" height="36"><rect width="36" height="36" x="6" y="6" fill="#1A73E8" rx="8"/><path fill="#fff" d="M14 32l6-8 5 5 9-11v4h2v-8h-8v2h4.5l-7.5 9-5-5-8 10.5z"/></svg>`,
    one: `<svg viewBox="0 0 48 48" width="36" height="36"><circle cx="24" cy="24" r="18" fill="#fff"/><path fill="#4285F4" d="M22 12h5v24h-5z"/><path fill="#EA4335" d="M27 12l-6 6v5l6-6z"/><path fill="#34A853" d="M22 36l6-6v-5l-6 6z"/><path fill="#FBBC05" d="M21 18l6 6-6 6z"/></svg>`,
  };

  const GOOGLE_APPS = [
    { name: "Search",      key: "search",    url: "https://www.google.com" },
    { name: "Maps",        key: "maps",      url: "https://maps.google.com" },
    { name: "YouTube",     key: "youtube",   url: "https://www.youtube.com" },
    { name: "Play",        key: "play",      url: "https://play.google.com" },
    { name: "News",        key: "news",      url: "https://news.google.com" },
    { name: "Gmail",       key: "gmail",     url: "https://mail.google.com" },
    { name: "Meet",        key: "meet",      url: "https://meet.google.com" },
    { name: "Chat",        key: "chat",      url: "https://chat.google.com" },
    { name: "Contacts",    key: "contacts",  url: "https://contacts.google.com" },
    { name: "Drive",       key: "drive",     url: "https://drive.google.com" },
    { name: "Calendar",    key: "calendar",  url: "https://calendar.google.com" },
    { name: "Translate",   key: "translate", url: "https://translate.google.com" },
    { name: "Photos",      key: "photos",    url: "https://photos.google.com" },
    { name: "Gemini",      key: "gemini",    url: "https://gemini.google.com" },
    { name: "Chrome Store",key: "webstore",  url: "https://chromewebstore.google.com" },
    { name: "Docs",        key: "docs",      url: "https://docs.google.com" },
    { name: "Sheets",      key: "sheets",    url: "https://sheets.google.com" },
    { name: "Slides",      key: "slides",    url: "https://slides.google.com" },
    { name: "Keep",        key: "keep",      url: "https://keep.google.com" },
    { name: "Forms",       key: "forms",     url: "https://forms.google.com" },
    { name: "Earth",       key: "earth",     url: "https://earth.google.com" },
    { name: "Classroom",   key: "classroom", url: "https://classroom.google.com" },
    { name: "Flights",     key: "flights",   url: "https://www.google.com/travel/flights" },
    { name: "Finance",     key: "finance",   url: "https://www.google.com/finance" },
    { name: "Google One",  key: "one",       url: "https://one.google.com" },
  ];

  // DOM References
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const voiceSearchBtn = document.getElementById("voiceSearchBtn");
  const shortcutsWrap = document.getElementById("ntpShortcuts");
  const clockEl = document.getElementById("ntpClock");
  const customizeBtn = document.getElementById("customizeBtn");
  const wpPanel = document.getElementById("wpPanel");
  const wpPanelOverlay = document.getElementById("wpPanelOverlay");
  const closePanelBtn = document.getElementById("closePanelBtn");
  const wpPickerGrid = document.getElementById("wpPickerGrid");
  const ntpBlurSlider = document.getElementById("ntpBlurSlider");
  const ntpDimSlider = document.getElementById("ntpDimSlider");
  const ntpSatSlider = document.getElementById("ntpSatSlider");
  const ntpBrightnessSlider = document.getElementById("ntpBrightnessSlider");
  const ntpContrastSlider = document.getElementById("ntpContrastSlider");
  const ntpBlurVal = document.getElementById("ntpBlurVal");
  const ntpDimVal = document.getElementById("ntpDimVal");
  const ntpSatVal = document.getElementById("ntpSatVal");
  const ntpBrightnessVal = document.getElementById("ntpBrightnessVal");
  const ntpContrastVal = document.getElementById("ntpContrastVal");
  const ntpResetFxBtn = document.getElementById("ntpResetFxBtn");
  const ntpCustomFile = document.getElementById("ntpCustomFile");
  const ntpUploadBtn = document.getElementById("ntpUploadBtn");
  const ntpCustomUrlInput = document.getElementById("ntpCustomUrlInput");
  const ntpCustomUrlBtn = document.getElementById("ntpCustomUrlBtn");

  // Apps & Account dropdown DOM references
  const appsMenuBtn = document.getElementById("appsMenuBtn");
  const appsMenuDropdown = document.getElementById("appsMenuDropdown");
  const googleAppsGrid = document.getElementById("googleAppsGrid");
  const accountMenuBtn = document.getElementById("accountMenuBtn");
  const accountMenuDropdown = document.getElementById("accountMenuDropdown");

  // Shortcut modal DOM references
  const shortcutModalOverlay = document.getElementById("shortcutModalOverlay");
  const shortcutForm = document.getElementById("shortcutForm");
  const shortcutNameInput = document.getElementById("shortcutNameInput");
  const shortcutUrlInput = document.getElementById("shortcutUrlInput");
  const shortcutModalTitle = document.getElementById("shortcutModalTitle");
  const cancelShortcutBtn = document.getElementById("cancelShortcutBtn");


  /* ---------------------------------------------------------------------
   * Search Engine + Google Suggest Autocomplete
   * ------------------------------------------------------------------- */
  const suggestionsEl = document.getElementById("ntpSuggestions");
  let activeSuggIdx = -1;
  let currentSuggestions = [];
  let suggestDebounce = null;

  // Search icon SVG reused in each suggestion row
  const SUGG_ICON_SVG = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>`;

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );
  }

  function boldPrefix(suggestion, query) {
    // Bold the part that ISN'T the user's typed query (what Google is completing)
    const escaped = escapeHtml(suggestion);
    const escapedQ = escapeHtml(query);
    if (escaped.toLowerCase().startsWith(escapedQ.toLowerCase())) {
      return escapedQ + "<mark>" + escaped.slice(escapedQ.length) + "</mark>";
    }
    return escaped;
  }

  function showSuggestions(items, query) {
    if (!suggestionsEl) return;
    if (!items || items.length === 0) {
      hideSuggestions();
      return;
    }
    currentSuggestions = items;
    activeSuggIdx = -1;
    suggestionsEl.innerHTML = items.map((item, i) => `
      <div class="ntp-sugg-item" role="option" data-idx="${i}" data-val="${escapeHtml(item)}">
        <span class="ntp-sugg-icon">${SUGG_ICON_SVG}</span>
        <span class="ntp-sugg-text">${boldPrefix(item, query)}</span>
        <span class="ntp-sugg-fill" title="Fill search box">↵</span>
      </div>
    `).join("");
    suggestionsEl.classList.add("open");

    // Click on a suggestion item
    suggestionsEl.querySelectorAll(".ntp-sugg-item").forEach((row) => {
      row.addEventListener("mousedown", (e) => {
        e.preventDefault(); // prevent input losing focus
        const val = row.dataset.val;
        navigateToSearch(val);
      });
    });
  }

  function hideSuggestions() {
    if (!suggestionsEl) return;
    suggestionsEl.classList.remove("open");
    suggestionsEl.innerHTML = "";
    currentSuggestions = [];
    activeSuggIdx = -1;
  }

  function setActiveRow(idx) {
    const rows = suggestionsEl.querySelectorAll(".ntp-sugg-item");
    rows.forEach((r) => r.classList.remove("active"));
    if (idx >= 0 && idx < rows.length) {
      rows[idx].classList.add("active");
      rows[idx].scrollIntoView({ block: "nearest" });
    }
  }

  function navigateToSearch(query) {
    hideSuggestions();
    if (!query) return;
    const isUrl = /^(https?:\/\/|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\S*)$/.test(query);
    if (isUrl) {
      const dest = query.startsWith("http://") || query.startsWith("https://") ? query : `https://${query}`;
      window.location.href = dest;
    } else {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
  }

  async function fetchSuggestions(query) {
    if (!query || query.trim().length === 0) { hideSuggestions(); return; }
    const trimmed = query.trim();
    // Skip suggestion fetch for URL-like input
    if (/^(https?:\/\/|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})(\S*)$/.test(trimmed)) { hideSuggestions(); return; }

    // 1. Primary: Use background service worker proxy (bypasses CSP/CORS, returns authentic Chrome suggestions)
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        chrome.runtime.sendMessage({ action: "get_google_suggestions", query: trimmed }, (response) => {
          if (chrome.runtime.lastError || !response || !response.success || !Array.isArray(response.suggestions)) {
            fallbackFetchSuggestions(trimmed);
            return;
          }
          const list = response.suggestions.slice(0, 8);
          if (list.length > 0) {
            showSuggestions(list, trimmed);
          } else {
            fallbackFetchSuggestions(trimmed);
          }
        });
        return;
      } catch (e) {
        // Fallback below
      }
    }

    fallbackFetchSuggestions(trimmed);
  }

  async function fallbackFetchSuggestions(trimmed) {
    try {
      const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const suggestions = (data[1] || []).slice(0, 8);
      showSuggestions(suggestions, trimmed);
    } catch (_) {
      // Network error or extension CSP — silently fail, search still works
    }
  }

  if (searchForm && searchInput) {
    // Input handler — debounce fetching suggestions by 120ms for instant native feel
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim();
      clearTimeout(suggestDebounce);
      if (!q) { hideSuggestions(); return; }
      suggestDebounce = setTimeout(() => fetchSuggestions(q), 120);
    });

    // Keyboard navigation inside the suggestions list
    searchInput.addEventListener("keydown", (e) => {
      const rows = suggestionsEl ? suggestionsEl.querySelectorAll(".ntp-sugg-item") : [];
      const isOpen = suggestionsEl && suggestionsEl.classList.contains("open");

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!isOpen) return;
        activeSuggIdx = Math.min(activeSuggIdx + 1, rows.length - 1);
        setActiveRow(activeSuggIdx);
        if (currentSuggestions[activeSuggIdx]) {
          searchInput.value = currentSuggestions[activeSuggIdx];
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) return;
        activeSuggIdx = Math.max(activeSuggIdx - 1, -1);
        setActiveRow(activeSuggIdx);
        if (activeSuggIdx === -1) {
          // Restore original typed query when arrowing back to top
          searchInput.value = searchInput.dataset.originalQuery || "";
        } else if (currentSuggestions[activeSuggIdx]) {
          searchInput.value = currentSuggestions[activeSuggIdx];
        }
      } else if (e.key === "Escape") {
        hideSuggestions();
        searchInput.value = searchInput.dataset.originalQuery || searchInput.value;
      } else {
        // Track what the user is actually typing so we can restore it on ArrowUp
        searchInput.dataset.originalQuery = searchInput.value;
      }
    });

    searchInput.addEventListener("focus", () => {
      const q = searchInput.value.trim();
      if (q.length >= 1) fetchSuggestions(q);
    });

    // Submit: use the active suggestion if one is highlighted, else what's in the input
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = searchInput.value.trim();
      hideSuggestions();
      navigateToSearch(q);
    });
  }

  // Close suggestions on click outside
  document.addEventListener("click", (e) => {
    if (
      suggestionsEl &&
      !suggestionsEl.contains(e.target) &&
      e.target !== searchInput
    ) {
      hideSuggestions();
    }
  });

  // Voice Search (Speech Recognition)
  if (voiceSearchBtn && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      voiceSearchBtn.classList.add("recording");
    };
    recognition.onend = () => {
      voiceSearchBtn.classList.remove("recording");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript && searchInput) {
        searchInput.value = transcript;
        searchForm.dispatchEvent(new Event("submit"));
      }
    };

    voiceSearchBtn.addEventListener("click", () => {
      try {
        recognition.start();
      } catch (err) {
        recognition.stop();
      }
    });
  }

  // Trigger Cadence Talking AI Agent
  const aiModeTriggerBtn = document.getElementById("aiModeTriggerBtn");
  if (aiModeTriggerBtn) {
    aiModeTriggerBtn.addEventListener("click", () => {
      if (window.CadenceAgent) {
        window.CadenceAgent.open();
      }
    });
  }

  /* =====================================================================
   * 9-DOT GOOGLE APPS LAUNCHER (Official SVG Icons)
   * ===================================================================== */
  function renderGoogleApps() {
    if (!googleAppsGrid) return;
    googleAppsGrid.innerHTML = GOOGLE_APPS.map((app) => {
      const isInternal = app.url.endsWith(".html");
      const target = isInternal ? "_self" : "_blank";
      const svgIcon = GOOGLE_APP_ICONS[app.key] || `<div class="app-default-icon">${app.name.charAt(0)}</div>`;
      return `
        <a href="${app.url}" class="app-tile" target="${target}" rel="noreferrer" title="${app.name}">
          <div class="app-tile-icon">${svgIcon}</div>
          <span class="app-tile-name">${app.name}</span>
        </a>
      `;
    }).join("");
  }

  /* =====================================================================
   * DROPDOWN TOGGLE HELPERS
   * ===================================================================== */
  function closeAllDropdowns() {
    if (appsMenuDropdown) {
      appsMenuDropdown.classList.remove("open");
      appsMenuDropdown.setAttribute("aria-hidden", "true");
    }
    if (appsMenuBtn) appsMenuBtn.setAttribute("aria-expanded", "false");
    if (accountMenuDropdown) {
      accountMenuDropdown.classList.remove("open");
      accountMenuDropdown.setAttribute("aria-hidden", "true");
    }
    if (accountMenuBtn) accountMenuBtn.setAttribute("aria-expanded", "false");
    closeAllShortcutMenus();
  }

  function toggleDropdown(dropdown, btn) {
    if (!dropdown || !btn) return;
    const isOpen = dropdown.classList.contains("open");
    closeAllDropdowns();
    if (!isOpen) {
      dropdown.classList.add("open");
      dropdown.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");
    }
  }

  if (appsMenuBtn && appsMenuDropdown) {
    appsMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown(appsMenuDropdown, appsMenuBtn);
    });
  }

  if (accountMenuBtn && accountMenuDropdown) {
    accountMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown(accountMenuDropdown, accountMenuBtn);
    });
  }

  /* =====================================================================
   * SHORTCUT STORAGE & MANAGEMENT
   * ===================================================================== */
  function isLegacyShortcuts(list) {
    if (!Array.isArray(list) || list.length === 0) return true;
    const urls = list.map((s) => (s && s.url) || "");
    const labels = list.map((s) => (s && s.label) || "");
    return urls.includes("dashboard.html") || labels.includes("Cadence") || labels.includes("Cadence Pro");
  }

  async function loadShortcuts() {
    try {
      const item = localStorage.getItem(STORAGE_KEY_SHORTCUTS);
      if (item) {
        let parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed = parsed.filter(s => s && s.url !== "dashboard.html" && s.label !== "Cadence" && s.label !== "Cadence Pro");
          if (parsed.length === 0 || isLegacyShortcuts(parsed)) {
            await saveShortcuts(INITIAL_SHORTCUTS);
            return INITIAL_SHORTCUTS;
          }
          await saveShortcuts(parsed);
          return parsed;
        }
      }
    } catch (e) {}

    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([STORAGE_KEY_SHORTCUTS], async (res) => {
          if (res && Array.isArray(res[STORAGE_KEY_SHORTCUTS])) {
            let list = res[STORAGE_KEY_SHORTCUTS].filter(s => s && s.url !== "dashboard.html" && s.label !== "Cadence" && s.label !== "Cadence Pro");
            if (list.length === 0 || isLegacyShortcuts(list)) {
              await saveShortcuts(INITIAL_SHORTCUTS);
              resolve(INITIAL_SHORTCUTS);
            } else {
              try { localStorage.setItem(STORAGE_KEY_SHORTCUTS, JSON.stringify(list)); } catch (e) {}
              resolve(list);
            }
          } else {
            await saveShortcuts(INITIAL_SHORTCUTS);
            resolve(INITIAL_SHORTCUTS);
          }
        });
      } else {
        saveShortcuts(INITIAL_SHORTCUTS);
        resolve(INITIAL_SHORTCUTS);
      }
    });
  }

  /* =====================================================================
   * GOOGLE ACCOUNT INFO SYNC (Authentic Google Chrome Account)
   * ===================================================================== */
  function initGoogleAccountSync() {
    try {
      const emailEl = document.getElementById("googleAccEmail");
      const nameEl = document.getElementById("googleAccName");
      const avatarBtnEl = document.querySelector(".ntp-avatar");
      const avatarLargeEl = document.getElementById("googleAccAvatar");

      if (typeof chrome !== "undefined" && chrome.identity && chrome.identity.getProfileUserInfo) {
        chrome.identity.getProfileUserInfo({ accountStatus: "ANY" }, (userInfo) => {
          if (userInfo && userInfo.email) {
            if (emailEl) emailEl.textContent = userInfo.email;
            const letter = userInfo.email.charAt(0).toUpperCase();
            if (avatarBtnEl) avatarBtnEl.textContent = letter;
            if (avatarLargeEl) avatarLargeEl.textContent = letter;
          }
        });
      }
    } catch (e) {}
  }

  async function saveShortcuts(shortcuts) {
    currentShortcuts = shortcuts;
    return new Promise((resolve) => {
      try {
        localStorage.setItem(STORAGE_KEY_SHORTCUTS, JSON.stringify(shortcuts));
      } catch (e) {}
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [STORAGE_KEY_SHORTCUTS]: shortcuts }, resolve);
      } else {
        resolve();
      }
    });
  }

  let editingShortcutIndex = -1;

  function openShortcutModal(index = -1) {
    if (!shortcutModalOverlay) return;
    closeAllDropdowns();
    editingShortcutIndex = index;
    if (index >= 0 && index < currentShortcuts.length) {
      if (shortcutModalTitle) shortcutModalTitle.textContent = "Edit shortcut";
      if (shortcutNameInput) shortcutNameInput.value = currentShortcuts[index].label;
      if (shortcutUrlInput) shortcutUrlInput.value = currentShortcuts[index].url;
    } else {
      if (shortcutModalTitle) shortcutModalTitle.textContent = "Add shortcut";
      if (shortcutNameInput) shortcutNameInput.value = "";
      if (shortcutUrlInput) shortcutUrlInput.value = "";
    }
    shortcutModalOverlay.classList.add("open");
    setTimeout(() => {
      if (shortcutNameInput) shortcutNameInput.focus();
    }, 50);
  }

  function closeShortcutModal() {
    if (!shortcutModalOverlay) return;
    shortcutModalOverlay.classList.remove("open");
    editingShortcutIndex = -1;
  }

  if (cancelShortcutBtn) cancelShortcutBtn.addEventListener("click", closeShortcutModal);

  if (shortcutModalOverlay) {
    shortcutModalOverlay.addEventListener("click", (e) => {
      if (e.target === shortcutModalOverlay) closeShortcutModal();
    });
  }

  if (shortcutForm) {
    shortcutForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = (shortcutNameInput && shortcutNameInput.value.trim()) || "";
      let url = (shortcutUrlInput && shortcutUrlInput.value.trim()) || "";
      if (!name || !url) return;

      if (!url.startsWith("http://") && !url.startsWith("https://") && !url.endsWith(".html")) {
        url = "https://" + url;
      }

      if (editingShortcutIndex >= 0 && editingShortcutIndex < currentShortcuts.length) {
        currentShortcuts[editingShortcutIndex] = { label: name, url: url };
      } else {
        currentShortcuts.push({ label: name, url: url });
      }

      await saveShortcuts(currentShortcuts);
      renderShortcuts();
      closeShortcutModal();
    });
  }

  function closeAllShortcutMenus() {
    document.querySelectorAll(".shortcut-action-menu").forEach((m) => m.classList.remove("open"));
  }

  /* ---------------------------------------------------------------------
   * Chrome-Style Shortcuts Grid Rendering
   * ------------------------------------------------------------------- */
  function renderShortcuts() {
    if (!shortcutsWrap) return;

    const shortcutItems = currentShortcuts.map((s, i) => {
      const isInternal = s.url.endsWith(".html");
      const target = isInternal ? "_self" : "_blank";
      const faviconUrl = isInternal
        ? ""
        : `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(s.url)}&sz=64`;

      const firstChar = s.label.charAt(0).toUpperCase();

      return `
        <div class="ntp-shortcut-item" data-idx="${i}">
          <a href="${s.url}" class="ntp-shortcut" target="${target}" rel="noreferrer" title="${s.label}">
            <div class="shortcut-icon-card">
              ${isInternal
                ? `<span class="shortcut-custom-icon">⚡</span>`
                : `<img src="${faviconUrl}" class="shortcut-favicon" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                   <div class="shortcut-fallback-avatar" style="display:none;">${firstChar}</div>`
              }
            </div>
            <span class="shortcut-label">${s.label}</span>
          </a>
          <button type="button" class="shortcut-menu-btn" data-idx="${i}" title="More options" aria-label="Shortcut menu">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
            </svg>
          </button>
          <div class="shortcut-action-menu" id="scMenu_${i}">
            <button type="button" class="sc-action-item edit-sc-btn" data-idx="${i}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Edit shortcut</span>
            </button>
            <button type="button" class="sc-action-item remove-sc-btn" data-idx="${i}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span>Remove</span>
            </button>
          </div>
        </div>
      `;
    }).join("");

    // Authentic Chrome "+ Add Shortcut" card
    const addShortcutCard = `
      <div class="ntp-shortcut-item add-shortcut-item">
        <button type="button" class="ntp-shortcut add-shortcut-btn" id="addShortcutCardBtn" title="Add shortcut">
          <div class="shortcut-icon-card add-icon-card">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span class="shortcut-label">Add shortcut</span>
        </button>
      </div>
    `;

    shortcutsWrap.innerHTML = shortcutItems + addShortcutCard;

    // Attach Add Shortcut listener
    const addBtn = document.getElementById("addShortcutCardBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => openShortcutModal(-1));
    }

    // Attach 3-dot context menu listeners
    shortcutsWrap.querySelectorAll(".shortcut-menu-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const idx = parseInt(btn.dataset.idx, 10);
        const menu = document.getElementById(`scMenu_${idx}`);
        const wasOpen = menu && menu.classList.contains("open");
        closeAllShortcutMenus();
        if (menu && !wasOpen) {
          menu.classList.add("open");
        }
      });
    });

    // Edit shortcut
    shortcutsWrap.querySelectorAll(".edit-sc-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        closeAllShortcutMenus();
        openShortcutModal(idx);
      });
    });

    // Remove shortcut
    shortcutsWrap.querySelectorAll(".remove-sc-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        closeAllShortcutMenus();
        if (idx >= 0 && idx < currentShortcuts.length) {
          currentShortcuts.splice(idx, 1);
          await saveShortcuts(currentShortcuts);
          renderShortcuts();
        }
      });
    });
  }

  /* =====================================================================
   * OUTSIDE-CLICK DISMISSAL
   * ===================================================================== */
  document.addEventListener("click", (e) => {
    if (
      appsMenuDropdown &&
      appsMenuDropdown.classList.contains("open") &&
      !appsMenuDropdown.contains(e.target) &&
      !appsMenuBtn.contains(e.target)
    ) {
      appsMenuDropdown.classList.remove("open");
      appsMenuDropdown.setAttribute("aria-hidden", "true");
      if (appsMenuBtn) appsMenuBtn.setAttribute("aria-expanded", "false");
    }

    if (
      accountMenuDropdown &&
      accountMenuDropdown.classList.contains("open") &&
      !accountMenuDropdown.contains(e.target) &&
      !accountMenuBtn.contains(e.target)
    ) {
      accountMenuDropdown.classList.remove("open");
      accountMenuDropdown.setAttribute("aria-hidden", "true");
      if (accountMenuBtn) accountMenuBtn.setAttribute("aria-expanded", "false");
    }

    closeAllShortcutMenus();
  });

  /* ---------------------------------------------------------------------
   * Wallpaper Picker Grid (4K Studio)
   * ------------------------------------------------------------------- */
  let activeDrawerCat = "all";

  function setupDrawerCategoryFilters() {
    const filterRow = document.getElementById("ntpWpCategoryFilters");
    if (!filterRow) return;

    filterRow.querySelectorAll(".wp-cat-pill").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.cat === activeDrawerCat);
      if (!btn._hasDrawerCatListener) {
        btn._hasDrawerCatListener = true;
        btn.addEventListener("click", () => {
          activeDrawerCat = btn.dataset.cat;
          filterRow.querySelectorAll(".wp-cat-pill").forEach((b) => b.classList.toggle("active", b === btn));
          renderWallpaperGrid();
        });
      }
    });
  }

  function ensureActiveThemeSettings() {
    if (!currentPro) {
      currentPro = (window.FL && window.FL.DEFAULT_PRO_SETTINGS)
        ? JSON.parse(JSON.stringify(window.FL.DEFAULT_PRO_SETTINGS))
        : { themeSettings: { ...((window.FL && window.FL.DEFAULT_THEME_SETTINGS) || {}) } };
    }
    if (!currentPro.themeSettings) {
      currentPro.themeSettings = (window.FL && window.FL.DEFAULT_THEME_SETTINGS)
        ? JSON.parse(JSON.stringify(window.FL.DEFAULT_THEME_SETTINGS))
        : {};
    }
    return currentPro.themeSettings;
  }

  async function persistThemeSettings() {
    ensureActiveThemeSettings();
    if (window.FL && typeof FL.saveProSettings === "function") {
      await FL.saveProSettings(currentPro);
    }
    try {
      localStorage.setItem("fl_pro_settings", JSON.stringify(currentPro));
    } catch (e) {}
  }

  function renderCustomUploadsGallery() {
    const wrap = document.getElementById("ntpUserUploadsWrap");
    const gallery = document.getElementById("ntpUserGallery");
    if (!wrap || !gallery) return;

    const ts = ensureActiveThemeSettings();
    const customList = Array.isArray(ts.customWallpapers) ? ts.customWallpapers : [];

    if (customList.length === 0) {
      wrap.style.display = "none";
      gallery.innerHTML = "";
      return;
    }

    wrap.style.display = "block";
    gallery.innerHTML = customList.map((item) => {
      const isActive = ts.wallpaperId === "custom" && ts.customWallpaperUrl === item.url;
      return `
        <div class="wp-user-card ${isActive ? "active" : ""}" data-customid="${item.id}" title="${item.name || 'Custom Wallpaper'}">
          <img src="${item.url}" alt="${item.name || 'Custom Wallpaper'}" />
          <button type="button" class="wp-user-card-del" data-delid="${item.id}" title="Delete wallpaper">✕</button>
        </div>
      `;
    }).join("");

    gallery.querySelectorAll(".wp-user-card").forEach((card) => {
      card.addEventListener("click", async (e) => {
        if (e.target.classList.contains("wp-user-card-del")) return;
        const customId = card.dataset.customid;
        const item = customList.find(c => c.id === customId);
        if (!item) return;

        const s = ensureActiveThemeSettings();
        s.wallpaperId = "custom";
        s.customWallpaperUrl = item.url;
        s.wallpaperUrl = item.url;
        s.dynamicTimeShift = false;

        FL.applyThemeEngine(s);
        await persistThemeSettings();
        renderWallpaperGrid();
        renderCustomUploadsGallery();
        syncControlUI(s);
      });
    });

    gallery.querySelectorAll(".wp-user-card-del").forEach((delBtn) => {
      delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const delId = delBtn.dataset.delid;
        const s = ensureActiveThemeSettings();
        const removed = s.customWallpapers.find(c => c.id === delId);
        s.customWallpapers = s.customWallpapers.filter(c => c.id !== delId);

        if (s.wallpaperId === "custom" && removed && s.customWallpaperUrl === removed.url) {
          if (s.customWallpapers.length > 0) {
            s.customWallpaperUrl = s.customWallpapers[0].url;
            s.wallpaperUrl = s.customWallpapers[0].url;
          } else {
            s.wallpaperId = "dolomites_sunbeams_8k";
            s.customWallpaperUrl = "";
            s.wallpaperUrl = "";
          }
          FL.applyThemeEngine(s);
        }

        await persistThemeSettings();
        renderWallpaperGrid();
        renderCustomUploadsGallery();
        syncControlUI(s);
      });
    });

    const clearAllBtn = document.getElementById("ntpClearUploadsBtn");
    if (clearAllBtn && !clearAllBtn._hasClearListener) {
      clearAllBtn._hasClearListener = true;
      clearAllBtn.addEventListener("click", async () => {
        if (!confirm("Remove all uploaded wallpapers?")) return;
        const s = ensureActiveThemeSettings();
        s.customWallpapers = [];
        if (s.wallpaperId === "custom") {
          s.wallpaperId = "dolomites_sunbeams_8k";
          s.customWallpaperUrl = "";
          s.wallpaperUrl = "";
          FL.applyThemeEngine(s);
        }
        await persistThemeSettings();
        renderWallpaperGrid();
        renderCustomUploadsGallery();
        syncControlUI(s);
      });
    }
  }

  function initFitControls() {
    const fitGroup = document.getElementById("ntpFitGroup");
    if (!fitGroup) return;
    const s = ensureActiveThemeSettings();
    const currentFit = s.wallpaperFit || "cover";
    fitGroup.querySelectorAll(".wp-fit-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.fit === currentFit);
      if (!btn._hasFitListener) {
        btn._hasFitListener = true;
        btn.addEventListener("click", async () => {
          const fit = btn.dataset.fit;
          fitGroup.querySelectorAll(".wp-fit-btn").forEach(b => b.classList.toggle("active", b === btn));
          const settings = ensureActiveThemeSettings();
          settings.wallpaperFit = fit;
          FL.applyThemeEngine(settings);
          await persistThemeSettings();
        });
      }
    });
  }

  function renderPaletteChips() {
    const container = document.getElementById("ntpPaletteChips");
    if (!container || !window.FL || !FL.THEME_PALETTES) return;
    const s = ensureActiveThemeSettings();
    container.innerHTML = FL.THEME_PALETTES.map(p => {
      const isActive = (s.paletteId || "crystal_light") === p.id;
      return `
        <button type="button" class="wp-palette-chip ${isActive ? "active" : ""}" data-pid="${p.id}" title="${p.name}">
          <span class="wp-palette-swatch" style="background:${p.primary};"></span>
          <span>${p.name}</span>
        </button>
      `;
    }).join("");

    container.querySelectorAll(".wp-palette-chip").forEach(btn => {
      btn.addEventListener("click", async () => {
        const pid = btn.dataset.pid;
        const settings = ensureActiveThemeSettings();
        settings.paletteId = pid;
        FL.applyThemeEngine(settings);
        await persistThemeSettings();
        renderPaletteChips();
      });
    });
  }

  function renderWallpaperGrid() {
    if (!wpPickerGrid || !window.FL) return;
    setupDrawerCategoryFilters();

    const allWps = FL.WALLPAPERS || [];
    const ts = ensureActiveThemeSettings();
    const customList = Array.isArray(ts.customWallpapers) ? ts.customWallpapers : [];

    let wallpapers = [];
    if (activeDrawerCat === "My Uploads") {
      if (customList.length === 0) {
        wpPickerGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 24px 12px; text-align: center; color: var(--ink-soft); font-size: 13px;">
            <div style="font-size: 28px; margin-bottom: 6px;">📁</div>
            <div style="font-weight: 600; color: var(--ink); margin-bottom: 4px;">No custom wallpapers uploaded yet</div>
            <div>Use the upload box below to drag &amp; drop your own 4K photos!</div>
          </div>
        `;
        return;
      }
      wallpapers = customList.map(c => ({
        id: "custom",
        customUrl: c.url,
        name: c.name || "My Upload",
        thumb: c.url,
        badge: "Your Upload"
      }));
    } else {
      wallpapers = allWps.filter((wp) => {
        if (activeDrawerCat === "all") return true;
        if (wp.id === "none") return true;
        if (wp.id === "custom") return false;
        const cat = activeDrawerCat.toLowerCase();
        if (cat.includes("8k")) {
          return (wp.badge && wp.badge.toLowerCase().includes("8k")) || (wp.name && wp.name.toLowerCase().includes("8k"));
        }
        return (wp.category || "").toLowerCase().includes(cat);
      });
    }

    wpPickerGrid.innerHTML = wallpapers.map((wp) => {
      const isCustomCard = wp.id === "custom";
      const isActive = isCustomCard
        ? (ts.wallpaperId === "custom" && (!wp.customUrl || ts.customWallpaperUrl === wp.customUrl))
        : (ts.wallpaperId === wp.id);

      let thumbUrl = wp.thumb || wp.file || wp.url;
      if (isCustomCard) {
        thumbUrl = wp.customUrl || ts.customWallpaperUrl || "";
      } else if (thumbUrl && !thumbUrl.startsWith("http") && !thumbUrl.startsWith("data:")) {
        thumbUrl = (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL)
          ? chrome.runtime.getURL(thumbUrl)
          : thumbUrl;
      }

      const thumbContent = wp.id === "none"
        ? `<div class="wp-no-wallpaper-preview"><span>◌</span><small>Default Chrome</small></div>`
        : (thumbUrl ? `<img src="${thumbUrl}" alt="${wp.name}" loading="lazy" onerror="this.onerror=null;this.src='Wallpaper/pexels-eberhardgross-12365962.jpg';" />` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:11px;color:#5f6368;font-weight:600;">📁 Upload</div>`);
      const badgeHtml = wp.badge ? `<span class="wp-thumb-badge ${wp.badge.includes('8K') ? 'badge-8k' : ''}">${wp.badge}</span>` : "";
      return `
        <div class="wp-thumb-card ${isActive ? "active" : ""}" data-wpid="${wp.id}" data-customurl="${wp.customUrl || ""}" title="${wp.name}">
          ${thumbContent}
          ${badgeHtml}
          <div class="wp-thumb-label">${wp.name}</div>
          <div class="wp-thumb-check">✓</div>
        </div>
      `;
    }).join("");

    wpPickerGrid.querySelectorAll(".wp-thumb-card").forEach((card) => {
      card.addEventListener("click", async () => {
        const wpId = card.dataset.wpid;
        const customUrl = card.dataset.customurl;
        const targetWp = allWps.find((w) => w.id === wpId);
        const settings = ensureActiveThemeSettings();
        
        settings.wallpaperId = wpId;
        settings.dynamicTimeShift = false;
        if (wpId === "custom") {
          settings.customWallpaperUrl = customUrl || settings.customWallpaperUrl || "";
          settings.wallpaperUrl = settings.customWallpaperUrl;
        } else if (targetWp) {
          if (targetWp.file) {
            settings.wallpaperUrl = targetWp.file;
          } else if (targetWp.url) {
            settings.wallpaperUrl = targetWp.url;
          } else {
            settings.wallpaperUrl = "";
          }
          if (targetWp.themeId) {
            settings.paletteId = targetWp.themeId;
          }
        } else if (wpId === "none") {
          settings.wallpaperUrl = "";
        }

        FL.applyThemeEngine(settings);
        await persistThemeSettings();
        renderWallpaperGrid();
        renderCustomUploadsGallery();
        syncControlUI(settings);
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Theme Drawer Controls
   * ------------------------------------------------------------------- */
  function openPanel() {
    if (!wpPanel) return;
    wpPanel.classList.add("open");
    if (wpPanelOverlay) wpPanelOverlay.classList.add("open");
    wpPanel.setAttribute("aria-hidden", "false");
    renderWallpaperGrid();
    renderCustomUploadsGallery();
    initFitControls();
    renderPaletteChips();
    syncControlUI(ensureActiveThemeSettings());
  }

  function closePanel() {
    if (!wpPanel) return;
    wpPanel.classList.remove("open");
    if (wpPanelOverlay) wpPanelOverlay.classList.remove("open");
    wpPanel.setAttribute("aria-hidden", "true");
  }

  if (customizeBtn) customizeBtn.addEventListener("click", openPanel);
  if (closePanelBtn) closePanelBtn.addEventListener("click", closePanel);
  if (wpPanelOverlay) wpPanelOverlay.addEventListener("click", closePanel);

  /* ---------------------------------------------------------------------
   * Cadence Performance Tracker Floating Modal
   * ------------------------------------------------------------------- */
  const dockTrackerBtn = document.getElementById("dockTrackerBtn");
  const trackerOverlay = document.getElementById("cadenceTrackerOverlay");
  const trackerBackdrop = document.getElementById("cadenceTrackerBackdrop");
  const closeTrackerModalBtn = document.getElementById("closeTrackerModalBtn");
  const trackerIframe = document.getElementById("cadenceTrackerIframe");

  function openTrackerModal() {
    if (!trackerOverlay) return;
    closeAllDropdowns();
    closePanel();
    trackerOverlay.classList.add("open");
    trackerOverlay.setAttribute("aria-hidden", "false");
    // Reload iframe to ensure real-time storage state
    if (trackerIframe && trackerIframe.contentWindow) {
      try {
        trackerIframe.contentWindow.location.reload();
      } catch (e) {}
    }
  }

  function closeTrackerModal() {
    if (!trackerOverlay) return;
    trackerOverlay.classList.remove("open");
    trackerOverlay.setAttribute("aria-hidden", "true");
  }

  function toggleTrackerModal() {
    if (trackerOverlay && trackerOverlay.classList.contains("open")) {
      closeTrackerModal();
    } else {
      openTrackerModal();
    }
  }

  if (dockTrackerBtn) {
    dockTrackerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleTrackerModal();
    });
  }

  const dockAiBtn = document.getElementById("dockAiBtn");
  if (dockAiBtn) {
    const isBound = (dockAiBtn.dataset && dockAiBtn.dataset.cadenceBound) || (dockAiBtn.getAttribute && dockAiBtn.getAttribute("data-cadence-bound") === "true");
    if (!isBound) {
      if (dockAiBtn.dataset) dockAiBtn.dataset.cadenceBound = "true";
      if (dockAiBtn.setAttribute) dockAiBtn.setAttribute("data-cadence-bound", "true");
      dockAiBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.CadenceAgent) {
          window.CadenceAgent.toggle();
        }
      });
    }
  }

  window.closeTrackerModal = closeTrackerModal;
  if (closeTrackerModalBtn) closeTrackerModalBtn.addEventListener("click", closeTrackerModal);
  if (trackerBackdrop) trackerBackdrop.addEventListener("click", closeTrackerModal);

  /* ---------------------------------------------------------------------
   * Global Escape Key
   * ------------------------------------------------------------------- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllDropdowns();
      closePanel();
      closeShortcutModal();
      closeTrackerModal();
    }
  });

  /* ---------------------------------------------------------------------
   * Sliders & Custom Wallpaper Controls
   * ------------------------------------------------------------------- */
  const ATMOSPHERE_PRESETS = {
    natural: { blurPx: 0, dimOpacity: 0, brightnessPct: 100, contrastPct: 100, saturationPct: 100 },
    cinematic: { blurPx: 0, dimOpacity: 25, brightnessPct: 95, contrastPct: 125, saturationPct: 115 },
    noir: { blurPx: 0, dimOpacity: 20, brightnessPct: 95, contrastPct: 135, saturationPct: 0 },
    warm: { blurPx: 0, dimOpacity: 10, brightnessPct: 105, contrastPct: 105, saturationPct: 130 },
    nordic: { blurPx: 8, dimOpacity: 15, brightnessPct: 100, contrastPct: 95, saturationPct: 90 },
    soft: { blurPx: 12, dimOpacity: 30, brightnessPct: 95, contrastPct: 90, saturationPct: 100 }
  };

  function optimizeWallpaperFile(file, maxWidth = 3840, maxHeight = 2160, quality = 0.90) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        return reject(new Error("Please upload a valid image file (JPG, PNG, WebP)."));
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read image file."));
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
            name: file.name ? file.name.replace(/\.[^/.]+$/, "") : "Custom Wallpaper",
            width,
            height
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleCustomWallpaperUpload(file) {
    if (!file) return;
    const dropzone = document.getElementById("ntpDropzone");
    const titleEl = dropzone ? dropzone.querySelector(".wp-dropzone-title") : null;
    const origTitle = titleEl ? titleEl.textContent : "";
    try {
      if (dropzone) dropzone.classList.add("dragover");
      if (titleEl) titleEl.textContent = "Optimizing Ultra HD image...";

      const { dataUrl, name } = await optimizeWallpaperFile(file);
      const s = ensureActiveThemeSettings();
      const customItem = {
        id: "custom_" + Date.now(),
        url: dataUrl,
        name: name || "My 4K Wallpaper",
        timestamp: Date.now()
      };

      let list = Array.isArray(s.customWallpapers) ? [...s.customWallpapers] : [];
      list = list.filter(item => item.url !== dataUrl);
      list.unshift(customItem);
      if (list.length > 8) list = list.slice(0, 8);
      s.customWallpapers = list;

      s.wallpaperId = "custom";
      s.customWallpaperUrl = dataUrl;
      s.wallpaperUrl = dataUrl;
      s.dynamicTimeShift = false;

      FL.applyThemeEngine(s);
      await persistThemeSettings();
      renderWallpaperGrid();
      renderCustomUploadsGallery();
      syncControlUI(s);

      if (window.mascot && typeof mascot.cheer === "function") {
        mascot.cheer({ message: "Applied your custom 4K wallpaper! 🎨✨" });
      }
    } catch (err) {
      console.error("Custom wallpaper upload error:", err);
      alert(err.message || "Failed to process image.");
    } finally {
      if (dropzone) dropzone.classList.remove("dragover");
      if (titleEl) titleEl.textContent = origTitle || "Drag & drop your wallpaper here";
    }
  }

  async function handleCustomWallpaperUrl(rawUrl) {
    const url = (rawUrl || "").trim();
    if (!url) return;
    const s = ensureActiveThemeSettings();
    const customItem = {
      id: "custom_" + Date.now(),
      url: url,
      name: "Custom Web Wallpaper",
      timestamp: Date.now()
    };

    let list = Array.isArray(s.customWallpapers) ? [...s.customWallpapers] : [];
    list = list.filter(item => item.url !== url);
    list.unshift(customItem);
    if (list.length > 8) list = list.slice(0, 8);
    s.customWallpapers = list;

    s.wallpaperId = "custom";
    s.customWallpaperUrl = url;
    s.wallpaperUrl = url;
    s.dynamicTimeShift = false;

    FL.applyThemeEngine(s);
    await persistThemeSettings();
    renderWallpaperGrid();
    renderCustomUploadsGallery();
    syncControlUI(s);

    if (window.mascot && typeof mascot.cheer === "function") {
      mascot.cheer({ message: "Applied custom wallpaper from URL! 🌐✨" });
    }
  }

  function syncControlUI(ts) {
    if (!ts) ts = ensureActiveThemeSettings();
    if (ntpBlurSlider) {
      ntpBlurSlider.value = ts.blurPx || 0;
      if (ntpBlurVal) ntpBlurVal.textContent = `${ts.blurPx || 0}px`;
    }
    if (ntpDimSlider) {
      ntpDimSlider.value = ts.dimOpacity || 0;
      if (ntpDimVal) ntpDimVal.textContent = `${ts.dimOpacity || 0}%`;
    }
    if (ntpBrightnessSlider) {
      const bVal = typeof ts.brightnessPct === "number" ? ts.brightnessPct : 100;
      ntpBrightnessSlider.value = bVal;
      if (ntpBrightnessVal) ntpBrightnessVal.textContent = `${bVal}%`;
    }
    if (ntpContrastSlider) {
      const cVal = typeof ts.contrastPct === "number" ? ts.contrastPct : 100;
      ntpContrastSlider.value = cVal;
      if (ntpContrastVal) ntpContrastVal.textContent = `${cVal}%`;
    }
    if (ntpSatSlider) {
      ntpSatSlider.value = ts.saturationPct || 100;
      if (ntpSatVal) ntpSatVal.textContent = `${ts.saturationPct || 100}%`;
    }
    initFitControls();
  }

  let controlsInitialized = false;
  function initControls() {
    const ts = ensureActiveThemeSettings();
    syncControlUI(ts);
    if (controlsInitialized) return;
    controlsInitialized = true;

    if (ntpBlurSlider) {
      ntpBlurSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (ntpBlurVal) ntpBlurVal.textContent = `${val}px`;
        const s = ensureActiveThemeSettings();
        s.blurPx = val;
        FL.applyThemeEngine(s);
      });
      ntpBlurSlider.addEventListener("change", persistThemeSettings);
    }

    if (ntpDimSlider) {
      ntpDimSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (ntpDimVal) ntpDimVal.textContent = `${val}%`;
        const s = ensureActiveThemeSettings();
        s.dimOpacity = val;
        FL.applyThemeEngine(s);
      });
      ntpDimSlider.addEventListener("change", persistThemeSettings);
    }

    if (ntpBrightnessSlider) {
      ntpBrightnessSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (ntpBrightnessVal) ntpBrightnessVal.textContent = `${val}%`;
        const s = ensureActiveThemeSettings();
        s.brightnessPct = val;
        FL.applyThemeEngine(s);
      });
      ntpBrightnessSlider.addEventListener("change", persistThemeSettings);
    }

    if (ntpContrastSlider) {
      ntpContrastSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (ntpContrastVal) ntpContrastVal.textContent = `${val}%`;
        const s = ensureActiveThemeSettings();
        s.contrastPct = val;
        FL.applyThemeEngine(s);
      });
      ntpContrastSlider.addEventListener("change", persistThemeSettings);
    }

    if (ntpSatSlider) {
      ntpSatSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (ntpSatVal) ntpSatVal.textContent = `${val}%`;
        const s = ensureActiveThemeSettings();
        s.saturationPct = val;
        FL.applyThemeEngine(s);
      });
      ntpSatSlider.addEventListener("change", persistThemeSettings);
    }

    if (ntpResetFxBtn) {
      ntpResetFxBtn.addEventListener("click", async () => {
        const s = ensureActiveThemeSettings();
        s.blurPx = 0;
        s.dimOpacity = 0;
        s.brightnessPct = 100;
        s.contrastPct = 100;
        s.saturationPct = 100;
        FL.applyThemeEngine(s);
        await persistThemeSettings();
        syncControlUI(s);
      });
    }

    // One-Click Presets
    const presetChips = document.getElementById("ntpPresetChips");
    if (presetChips) {
      presetChips.querySelectorAll(".wp-preset-chip").forEach(btn => {
        btn.addEventListener("click", async () => {
          const key = btn.dataset.preset;
          const preset = ATMOSPHERE_PRESETS[key];
          if (!preset) return;
          presetChips.querySelectorAll(".wp-preset-chip").forEach(b => b.classList.toggle("active", b === btn));
          const s = ensureActiveThemeSettings();
          Object.assign(s, preset);
          FL.applyThemeEngine(s);
          await persistThemeSettings();
          syncControlUI(s);
        });
      });
    }

    // Drag and Drop & Upload File Handlers
    const dropzone = document.getElementById("ntpDropzone");
    if (dropzone) {
      dropzone.addEventListener("click", (e) => {
        if (e.target !== ntpUploadBtn && ntpCustomFile) {
          ntpCustomFile.click();
        }
      });

      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add("dragover");
      });

      dropzone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("dragover");
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove("dragover");
        const files = e.dataTransfer.files;
        if (files && files[0]) {
          handleCustomWallpaperUpload(files[0]);
        }
      });
    }

    if (ntpUploadBtn && ntpCustomFile) {
      ntpUploadBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        ntpCustomFile.click();
      });
      ntpCustomFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          handleCustomWallpaperUpload(file);
        }
        e.target.value = "";
      });
    }

    if (ntpCustomUrlBtn && ntpCustomUrlInput) {
      ntpCustomUrlBtn.addEventListener("click", async () => {
        const url = ntpCustomUrlInput.value.trim();
        if (url) {
          await handleCustomWallpaperUrl(url);
          ntpCustomUrlInput.value = "";
        }
      });
      ntpCustomUrlInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const url = ntpCustomUrlInput.value.trim();
          if (url) {
            await handleCustomWallpaperUrl(url);
            ntpCustomUrlInput.value = "";
          }
        }
      });
    }

    const dynamicShiftToggle = document.getElementById("ntpDynamicTimeShiftToggle");
    if (dynamicShiftToggle) {
      dynamicShiftToggle.checked = !!ts.dynamicTimeShift;
      dynamicShiftToggle.addEventListener("change", async (e) => {
        const s = ensureActiveThemeSettings();
        s.dynamicTimeShift = e.target.checked;
        FL.applyThemeEngine(s);
        await persistThemeSettings();
        renderWallpaperGrid();
      });
    }

    const parallaxToggle = document.getElementById("ntpParallaxToggle");
    if (parallaxToggle) {
      parallaxToggle.checked = false;
      parallaxToggle.disabled = true;
    }
  }

  /* ---------------------------------------------------------------------
   * Ambient Soundscapes Player Controller
   * ------------------------------------------------------------------- */
  let activeSoundTrack = "rain";
  let isSoundPlaying = false;

  function initSoundscapeController() {
    const wrap = document.getElementById("ntpSoundscapeWrap");
    const toggleBtn = document.getElementById("ntpSoundscapeToggleBtn");
    const menu = document.getElementById("ntpSoundscapeMenu");
    const trackBtns = document.querySelectorAll(".sound-track-btn");
    const volSlider = document.getElementById("ntpSoundVolume");
    if (!toggleBtn || !menu || !window.FL) return;

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("open");
      menu.setAttribute("aria-hidden", String(!menu.classList.contains("open")));
    });

    document.addEventListener("click", (e) => {
      if (menu.classList.contains("open") && !wrap.contains(e.target)) {
        menu.classList.remove("open");
        menu.setAttribute("aria-hidden", "true");
      }
    });

    const soundLabel = document.getElementById("ntpSoundLabel");
    const trackLabels = {
      rain: "🌧️ Rain",
      zen: "🥣 Zen",
      cyberpunk: "⚡ Cyberpunk",
      space: "🌌 Space",
      forest: "🌲 Forest",
      brown: "🌊 Ocean",
    };

    trackBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const track = btn.dataset.track;
        if (activeSoundTrack === track && isSoundPlaying) {
          // Stop soundscape
          FL.stopAmbientSoundscape();
          isSoundPlaying = false;
          toggleBtn.classList.remove("playing");
          trackBtns.forEach((b) => b.classList.remove("active"));
          if (soundLabel) soundLabel.textContent = "Focus Audio";
        } else {
          // Play selected soundscape
          activeSoundTrack = track;
          const vol = volSlider ? parseFloat(volSlider.value) : 0.5;
          const soundTypeMap = {
            rain: "lofi_rain",
            zen: "zen_bowls",
            cyberpunk: "cyber_cafe",
            space: "cosmic_drift",
            forest: "forest",
            brown: "brown",
          };
          FL.playAmbientSoundscape(soundTypeMap[track] || "lofi_rain", vol);
          isSoundPlaying = true;
          toggleBtn.classList.add("playing");
          trackBtns.forEach((b) => b.classList.toggle("active", b === btn));
          if (soundLabel) soundLabel.textContent = trackLabels[track] || "Focus Audio";
        }
      });
    });

    if (volSlider) {
      volSlider.addEventListener("input", (e) => {
        const vol = parseFloat(e.target.value);
        if (FL.setAmbientVolume) FL.setAmbientVolume(vol);
      });
    }
  }



  /* ---------------------------------------------------------------------
   * Live Cross-Tab Sync
   * ------------------------------------------------------------------- */
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local") {
        const proKey = (window.FL && window.FL.KEYS && window.FL.KEYS.pro) || "fl_pro_settings";
        const proChange = changes[proKey] || changes.fl_pro_settings || changes.cadenceProSettings;
        if (proChange && proChange.newValue) {
          currentPro = proChange.newValue;
          if (currentPro && currentPro.themeSettings) {
            FL.applyThemeEngine(currentPro.themeSettings);
            syncControlUI(currentPro.themeSettings);
            syncThemeToggleUI(currentPro.themeSettings.themeMode);
            renderWallpaperGrid();
          }
        }
        if (changes[STORAGE_KEY_SHORTCUTS] && changes[STORAGE_KEY_SHORTCUTS].newValue) {
          currentShortcuts = changes[STORAGE_KEY_SHORTCUTS].newValue;
          renderShortcuts();
        }
      }
    });
  }

  function syncThemeToggleUI(mode) {
    const themeBtn = document.getElementById("ntpThemeToggleBtn");
    if (themeBtn) {
      const isDark = mode === "dark" || (mode === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
      if (isDark) {
        themeBtn.textContent = "☀️";
        themeBtn.title = "Dark theme active — click for Light theme";
        themeBtn.setAttribute("aria-label", "Switch to Light Theme");
      } else {
        themeBtn.textContent = "🌙";
        themeBtn.title = "Light theme active — click for Dark theme";
        themeBtn.setAttribute("aria-label", "Switch to Dark Theme");
      }
    }
  }

  /* ---------------------------------------------------------------------
   * Initialization
   * ------------------------------------------------------------------- */
  async function init() {
    // 0. Immediate synchronous paint of visual elements
    renderGoogleApps();
    startNtpClock();

    // 0b. Immediate theme activation from memory/cache before any async I/O
    let initialTs = (window.FL && FL.DEFAULT_THEME_SETTINGS) ? { ...FL.DEFAULT_THEME_SETTINGS } : {};
    try {
      const cached = localStorage.getItem("fl_pro_settings");
      const parsed = cached ? JSON.parse(cached) : null;
      if (parsed && parsed.themeSettings) initialTs = parsed.themeSettings;
      const validIds = new Set(((window.FL && FL.WALLPAPERS) || []).map(w => w.id));
      if (validIds.size > 0 && !validIds.has(initialTs.wallpaperId) && initialTs.wallpaperId !== "custom" && initialTs.wallpaperId !== "none") {
        initialTs.wallpaperId = "dolomites_sunbeams_8k";
        initialTs.wallpaperUrl = "";
        initialTs.customWallpaperUrl = "";
      }
    } catch (e) {}

    if (window.FL && typeof FL.applyThemeEngine === "function") {
      FL.applyThemeEngine(initialTs);
      syncControlUI(initialTs);
      syncThemeToggleUI(initialTs.themeMode);
    }

    // 1. Parallel loading of shortcuts, pro settings, momentum & habits
    const [shortcuts, pro] = await Promise.all([
      loadShortcuts(),
      (window.FL && FL.loadProSettings) ? FL.loadProSettings() : Promise.resolve(null),
    ]);

    currentShortcuts = shortcuts || INITIAL_SHORTCUTS;
    renderShortcuts();

    currentPro = pro || (window.FL && window.FL.DEFAULT_PRO_SETTINGS ? JSON.parse(JSON.stringify(window.FL.DEFAULT_PRO_SETTINGS)) : { themeSettings: initialTs });
    if (!currentPro.themeSettings) {
      currentPro.themeSettings = initialTs;
    }
    const allValidWps = (window.FL && FL.WALLPAPERS) || [];
    const validWpSet = new Set(allValidWps.map(w => w.id));
    if (validWpSet.size > 0 && !validWpSet.has(currentPro.themeSettings.wallpaperId) && currentPro.themeSettings.wallpaperId !== "custom" && currentPro.themeSettings.wallpaperId !== "none") {
      currentPro.themeSettings.wallpaperId = "dolomites_sunbeams_8k";
      currentPro.themeSettings.wallpaperUrl = "";
      currentPro.themeSettings.customWallpaperUrl = "";
      await persistThemeSettings();
    }

    if (window.FL && currentPro) {
      const rotation = currentPro.wallpaperRotation;
      if (rotation && rotation.enabled) {
        const cadenceMs = rotation.cadence === "weekly" ? 7 * 86400000 : 86400000;
        const last = rotation.lastRotatedAt || 0;
        if (Date.now() - last >= cadenceMs) {
          const wallpapers = (FL.WALLPAPERS || []).filter((wp) => wp.id !== "custom" && wp.id !== "none");
          const activeIndex = wallpapers.findIndex((wp) => wp.id === currentPro.themeSettings.wallpaperId);
          const next = wallpapers[(activeIndex + 1 + wallpapers.length) % wallpapers.length];
          if (next) {
            currentPro.themeSettings.wallpaperId = next.id;
            if (next.themeId) currentPro.themeSettings.paletteId = next.themeId;
            rotation.lastRotatedAt = Date.now();
            await persistThemeSettings();
          }
        }
      }
      const ts = (currentPro && currentPro.themeSettings) || initialTs;
      if (JSON.stringify(ts) !== JSON.stringify(initialTs)) {
        FL.applyThemeEngine(ts);
        syncControlUI(ts);
        syncThemeToggleUI(ts.themeMode);
      }
      initControls();
      initSoundscapeController();

      // Setup Dedicated Dark/Light Theme Button — toggles between dark and light
      const themeBtn = document.getElementById("ntpThemeToggleBtn");
      if (themeBtn && !themeBtn._bound) {
        themeBtn._bound = true;
        themeBtn.addEventListener("click", async () => {
          const s = ensureActiveThemeSettings();
          const current = s.themeMode || "system";
          const isDark = current === "dark" || (current === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
          const nextMode = isDark ? "light" : "dark";
          s.themeMode = nextMode;
          FL.applyThemeEngine(s);
          syncThemeToggleUI(nextMode);
          await persistThemeSettings();
        });
      }
    }

    // Initialize authentic Google Account sync
    initGoogleAccountSync();

    // Initialize first-run full-screen 4K wallpaper guide
    initFullscreenTip();

    // Initialize Zen Mode, Scratchpad, Recap Badge, and Hotkeys
    const zenEngine = initZenMode();
    const scratchpadEngine = initScratchpad();
    const recapEngine = initRecapBadge();
    initKeyboardHotkeys(zenEngine, scratchpadEngine, recapEngine);

    // Initialize Cadence Ambient Micro-Coach Bar
    initCadenceAmbientBar();
  }

  /* =====================================================================
   * CADENCE AMBIENT MICRO-COACH BAR
   * ===================================================================== */
  async function initCadenceAmbientBar() {
    const ambientBar = document.getElementById("cadenceAmbientBar");
    const ambientText = document.getElementById("cadenceAmbientText");
    const ambientActionBtn = document.getElementById("ambientActionBtn");
    const ambientTalkBtn = document.getElementById("ambientTalkBtn");
    const ambientClickArea = document.getElementById("cadenceAmbientClickArea");
    const pulseOrb = document.getElementById("ambientPulseOrb");

    if (!ambientBar || !ambientText || !ambientActionBtn) return;

    if (ambientTalkBtn) {
      ambientTalkBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.CadenceAgent) window.CadenceAgent.toggle();
      });
    }

    if (ambientClickArea) {
      ambientClickArea.addEventListener("click", () => {
        if (window.CadenceAgent) window.CadenceAgent.open();
      });
    }

    async function refreshAmbientBar() {
      try {
        const stored = await chrome.storage.local.get(["fl_habits", "fl_completions", "fl_pro_settings"]);
        const habits = stored.fl_habits || [];
        const completions = stored.fl_completions || {};
        const pro = stored.fl_pro_settings || {};
        const todayKey = new Date().toISOString().slice(0, 10);
        const todayDone = completions[todayKey] || {};

        // 1. Check if Focus Sprint is active
        if (pro.focusSession && pro.focusSession.running) {
          const elapsed = pro.focusSession.startedAt ? Math.floor((Date.now() - pro.focusSession.startedAt) / 1000) : 0;
          const rem = Math.max(0, (pro.focusSession.remainingSeconds || 1500) - elapsed);
          const mins = Math.floor(rem / 60);
          ambientText.innerHTML = `🛡️ <strong>Focus Sprint Active:</strong> ${mins}m left · Focus Shielding ON`;
          ambientActionBtn.textContent = "Pause Sprint";
          ambientActionBtn.onclick = async (e) => {
            e.stopPropagation();
            pro.focusSession.running = false;
            await chrome.storage.local.set({ fl_pro_settings: pro });
            refreshAmbientBar();
          };
          if (pulseOrb) pulseOrb.style.background = "#FF7675";
          return;
        }

        if (pulseOrb) pulseOrb.style.background = "#55EFC4";

        if (!habits.length) {
          ambientText.innerHTML = `⚡ <strong>Ready to conquer today?</strong> Click to setup your daily habits.`;
          ambientActionBtn.textContent = "+ Set Habit";
          ambientActionBtn.onclick = (e) => {
            e.stopPropagation();
            if (window.CadenceAgent) window.CadenceAgent.open();
          };
          return;
        }

        const pending = habits.filter(h => {
          const val = todayDone[h.id];
          return window.FL && FL.isHabitDone ? !FL.isHabitDone(h, val) : !val;
        });

        const doneCount = habits.length - pending.length;
        const streak = window.FL && FL.longestStreakAcrossHabits ? FL.longestStreakAcrossHabits(habits, completions) : 0;

        if (pending.length === 0) {
          ambientText.innerHTML = `🏆 <strong>100% Conquered Today!</strong> All ${habits.length} habits done · ${streak}d streak 🔥`;
          ambientActionBtn.textContent = "⚡ Deep Work";
          ambientActionBtn.onclick = (e) => {
            e.stopPropagation();
            if (window.CadenceAgent) {
              window.CadenceAgent.open();
              window.CadenceAgent.handleUserInput("start sprint 25");
            }
          };
        } else {
          const nextHabit = pending[0];
          ambientText.innerHTML = `⚡ Next: <strong>${nextHabit.name}</strong> · ${doneCount}/${habits.length} done (${streak}d streak)`;
          ambientActionBtn.textContent = nextHabit.type === "numeric" ? "+1 Log" : "✓ Done";
          ambientActionBtn.classList.remove("completed");
          ambientActionBtn.disabled = false;
          ambientActionBtn.onclick = async (e) => {
            e.stopPropagation();
            ambientActionBtn.disabled = true;
            ambientActionBtn.classList.add("completed");
            ambientActionBtn.textContent = "✓ Saved";
            if (window.CadenceAgent && window.CadenceAgent.playChime) window.CadenceAgent.playChime("action");
            const val = nextHabit.type === "numeric" ? (nextHabit.target || 1) : true;
            if (window.FL && FL.setCompletion) {
              await FL.setCompletion(todayKey, nextHabit.id, val);
            } else {
              todayDone[nextHabit.id] = val;
              completions[todayKey] = todayDone;
              await chrome.storage.local.set({ fl_completions: completions });
            }
            setTimeout(refreshAmbientBar, 500);
          };
        }
      } catch (err) {
        console.warn("Ambient bar refresh error:", err);
      }
    }

    refreshAmbientBar();
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && (changes.fl_habits || changes.fl_completions || changes.fl_pro_settings)) {
        refreshAmbientBar();
      }
    });
  }

  /* =====================================================================
   * CADENCE ZEN MODE
   * ===================================================================== */
  function initZenMode() {
    const zenBtn = document.getElementById("dockZenBtn");
    const zenTime = document.getElementById("zenTime");
    const zenDate = document.getElementById("zenDate");
    const wpContainer = document.getElementById("cadenceWallpaperContainer");

    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    function updateZenClock() {
      const now = new Date();
      let h = now.getHours();
      const m = now.getMinutes();
      h = h % 12 || 12;
      if (zenTime) zenTime.textContent = `${h}:${String(m).padStart(2, "0")}`;
      if (zenDate) zenDate.textContent = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;
    }

    function toggleZen() {
      const isZen = document.body.classList.toggle("zen-active");
      if (isZen) {
        updateZenClock();
      }
    }

    if (zenBtn) zenBtn.addEventListener("click", toggleZen);
    if (wpContainer) {
      wpContainer.addEventListener("dblclick", (e) => {
        if (e.target.tagName !== "INPUT" && e.target.tagName !== "BUTTON" && e.target.tagName !== "TEXTAREA") {
          toggleZen();
        }
      });
    }

    updateZenClock();
    setInterval(updateZenClock, 1000);
    return { toggleZen };
  }

  /* =====================================================================
   * CADENCE SCRATCHPAD
   * ===================================================================== */
  /* =====================================================================
   * CADENCE REFINED NOTES & SCRATCHPAD ENGINE
   * - Daily Rollover (Today) vs Pinned Brain Dump
   * - Interactive Checklists & Format Toolbar (- [ ], timestamp, copy)
   * - Scheduled Note Reminders with Chrome Alarms & Notifications
   * - Past Daily Notes History & Live Word/Checklist Progress
   * ===================================================================== */
  function initScratchpad() {
    const notesBtn = document.getElementById("dockNotesBtn");
    const panel = document.getElementById("cadenceScratchpadPanel");
    const closeBtn = document.getElementById("closeScratchpadBtn");
    const input = document.getElementById("scratchpadInput");
    const preview = document.getElementById("scratchpadPreview");
    const savedIndicator = document.getElementById("scratchpadSaved");

    // Tabs
    const tabToday = document.getElementById("scratchpadTabToday");
    const tabPinned = document.getElementById("scratchpadTabPinned");
    const todayDateBadge = document.getElementById("scratchpadTodayDateBadge");

    // Toolbar buttons
    const toolCheckbox = document.getElementById("noteToolCheckbox");
    const toolTimestamp = document.getElementById("noteToolTimestamp");
    const toolViewToggle = document.getElementById("noteToolViewToggle");
    const viewToggleIcon = document.getElementById("noteViewToggleIcon");
    const viewToggleLabel = document.getElementById("noteViewToggleLabel");
    const toolCopy = document.getElementById("noteToolCopy");
    const copyIcon = document.getElementById("noteCopyIcon");
    const copyLabel = document.getElementById("noteCopyLabel");
    const toolReminder = document.getElementById("noteToolReminder");
    const reminderBadge = document.getElementById("noteReminderBadge");
    const expandBtn = document.getElementById("scratchpadExpandBtn");
    const historyBtn = document.getElementById("scratchpadHistoryBtn");
    const clearBtn = document.getElementById("scratchpadClearBtn");

    // Popovers
    const reminderPopover = document.getElementById("noteReminderPopover");
    const closeReminderBtn = document.getElementById("closeNoteReminderBtn");
    const reminderTextInput = document.getElementById("reminderTextInput");
    const reminderCustomTime = document.getElementById("reminderCustomTime");
    const scheduleCustomReminderBtn = document.getElementById("scheduleCustomReminderBtn");
    const activeRemindersList = document.getElementById("noteActiveRemindersList");

    const historyPopover = document.getElementById("noteHistoryPopover");
    const closeHistoryBtn = document.getElementById("closeNoteHistoryBtn");
    const historyList = document.getElementById("noteHistoryList");

    // Stats & Clock
    const statsEl = document.getElementById("scratchpadStats");
    const checklistProgressEl = document.getElementById("scratchpadChecklistProgress");
    const scratchpadClock = document.getElementById("scratchpadClock");

    if (!panel || !input) return { toggleScratchpad: () => {} };

    // State
    let activeTab = "today"; // "today" | "pinned"
    let isPreviewMode = false;
    let dailyNotes = {};
    let pinnedNote = "";
    let saveTimeout = null;

    // Helper: Dynamic YYYY-MM-DD
    function getTodayKey() {
      const d = new Date();
      return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
      ].join("-");
    }

    let todayKey = getTodayKey();

    // Generate formatted default header for fresh daily notes
    function getAutoDateHeader() {
      const d = new Date();
      const dateStr = d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
      const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `# 📅 ${dateStr} · ${timeStr}\n\n- [ ] `;
    }

    // Live Date & Time Synchronizer (clock, tab badge, midnight rollover, reminder countdowns)
    function syncLiveDateTime() {
      const d = new Date();
      const currentTodayKey = getTodayKey();

      // 1. Update live clock in footer
      if (scratchpadClock) {
        scratchpadClock.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }

      // 2. Update date badge on Today tab
      if (todayDateBadge) {
        todayDateBadge.textContent = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      }

      // 3. Midnight rollover: if calendar day has changed, roll over automatically
      if (currentTodayKey !== todayKey) {
        saveImmediate();
        todayKey = currentTodayKey;
        if (activeTab === "today") {
          loadActiveContent();
        }
      }

      // 4. Update reminder list if open
      if (reminderPopover && reminderPopover.style.display !== "none") {
        loadAndRenderReminders();
      }
    }

    // Audio chime feedback
    function playNoteFeedback(freq = 520) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch (_) {}
    }

    // Restore expanded view preference
    try {
      if (localStorage.getItem("fl_notes_expanded") === "true") {
        panel.classList.add("expanded");
        if (expandBtn) expandBtn.textContent = "⤡";
      }
    } catch (_) {}

    // Load initial storage data
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(
        ["fl_notes_daily", "fl_notes_pinned", "fl_notes_active_tab", "fl_scratchpad", "fl_note_reminders"],
        (res) => {
          if (!res) res = {};
          dailyNotes = res.fl_notes_daily || {};
          pinnedNote = res.fl_notes_pinned || "";

          // Graceful backwards compatibility migration
          if (!pinnedNote && !dailyNotes[todayKey] && res.fl_scratchpad) {
            pinnedNote = res.fl_scratchpad;
          }

          if (res.fl_notes_active_tab === "pinned") {
            activeTab = "pinned";
          } else {
            activeTab = "today";
          }

          updateTabUI();
          loadActiveContent();
          updateRemindersBadge(res.fl_note_reminders || []);
          syncLiveDateTime();
        }
      );
    }

    // Auto-update date and time on interval & focus
    setInterval(syncLiveDateTime, 10000);
    window.addEventListener("focus", syncLiveDateTime);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") syncLiveDateTime();
    });

    // Update Tab UI indicators
    function updateTabUI() {
      if (tabToday) {
        tabToday.classList.toggle("active", activeTab === "today");
        tabToday.setAttribute("aria-selected", activeTab === "today");
      }
      if (tabPinned) {
        tabPinned.classList.toggle("active", activeTab === "pinned");
        tabPinned.setAttribute("aria-selected", activeTab === "pinned");
      }
    }

    // Load content for active tab into textarea
    function loadActiveContent() {
      if (activeTab === "today") {
        // Automatically prefill today's note with live date & time if completely empty
        if (!dailyNotes[todayKey] || !dailyNotes[todayKey].trim()) {
          dailyNotes[todayKey] = getAutoDateHeader();
          saveImmediate();
        }
        input.value = dailyNotes[todayKey] || "";
        input.placeholder = "Today's scratchpad & sprint priorities... (- [ ] for checklists, Esc or N to toggle)";
      } else {
        input.value = pinnedNote || "";
        input.placeholder = "Persistent brain dump, guidelines, reference notes... (- [ ] for checklists)";
      }
      updateStats();
      if (isPreviewMode) renderChecklistPreview();
    }

    // Switch tab handler
    function switchTab(newTab) {
      if (activeTab === newTab) return;
      // Save current note before switching
      saveImmediate();
      activeTab = newTab;
      updateTabUI();
      loadActiveContent();

      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ fl_notes_active_tab: activeTab });
      }
      input.focus();
    }

    if (tabToday) tabToday.addEventListener("click", () => switchTab("today"));
    if (tabPinned) tabPinned.addEventListener("click", () => switchTab("pinned"));

    // Save logic
    function saveCurrentTabNote(callback) {
      if (activeTab === "today") {
        dailyNotes[todayKey] = input.value;
      } else {
        pinnedNote = input.value;
      }

      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(
          {
            fl_notes_daily: dailyNotes,
            fl_notes_pinned: pinnedNote,
            fl_scratchpad: activeTab === "pinned" ? pinnedNote : (dailyNotes[todayKey] || "")
          },
          () => {
            if (savedIndicator) {
              savedIndicator.classList.add("visible");
              setTimeout(() => savedIndicator.classList.remove("visible"), 1100);
            }
            if (typeof callback === "function") callback();
          }
        );
      }
    }

    function saveImmediate() {
      clearTimeout(saveTimeout);
      saveCurrentTabNote();
    }

    input.addEventListener("input", () => {
      updateStats();
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => saveCurrentTabNote(), 350);
    });

    // Update Stats (word count & checklist completion)
    function updateStats() {
      const text = input.value || "";
      const trimmed = text.trim();
      const words = trimmed ? trimmed.split(/\s+/).length : 0;

      if (statsEl) {
        statsEl.textContent = `${words} word${words === 1 ? "" : "s"}`;
      }

      // Checklist stats
      const matches = text.match(/^(\s*)-\s*\[([ xX])\]/gm) || [];
      if (matches.length > 0 && checklistProgressEl) {
        const checked = (text.match(/^(\s*)-\s*\[[xX]\]/gm) || []).length;
        checklistProgressEl.style.display = "inline-flex";
        checklistProgressEl.textContent = `${checked}/${matches.length}`;
        checklistProgressEl.style.borderColor = checked === matches.length ? "#10b981" : "rgba(16, 185, 129, 0.25)";
      } else if (checklistProgressEl) {
        checklistProgressEl.style.display = "none";
      }
    }

    // TOOLBAR: Checkbox Inserter (- [ ])
    if (toolCheckbox) {
      toolCheckbox.addEventListener("click", () => {
        if (isPreviewMode) togglePreviewMode(false);
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const val = input.value;

        // Find current line bounds
        const lineStart = val.lastIndexOf("\n", start - 1) + 1;
        let lineEnd = val.indexOf("\n", end);
        if (lineEnd === -1) lineEnd = val.length;

        const currentLine = val.substring(lineStart, lineEnd);
        let newLine = "";

        if (/^(\s*)-\s*\[\s*\]\s*/.test(currentLine)) {
          // Toggle [ ] to [x]
          newLine = currentLine.replace(/^(\s*)-\s*\[\s*\]\s*/, "$1- [x] ");
        } else if (/^(\s*)-\s*\[[xX]\]\s*/.test(currentLine)) {
          // Remove checkbox
          newLine = currentLine.replace(/^(\s*)-\s*\[[xX]\]\s*/, "$1");
        } else {
          // Add checkbox
          newLine = "- [ ] " + currentLine.trimStart();
        }

        input.value = val.substring(0, lineStart) + newLine + val.substring(lineEnd);
        const newCursorPos = lineStart + newLine.length;
        input.setSelectionRange(newCursorPos, newCursorPos);
        input.focus();
        input.dispatchEvent(new Event("input"));
        playNoteFeedback(440);
      });
    }

    // TOOLBAR: Timestamp Inserter
    if (toolTimestamp) {
      toolTimestamp.addEventListener("click", (e) => {
        if (isPreviewMode) togglePreviewMode(false);
        const d = new Date();
        const stamp = e.shiftKey
          ? `[${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}] `
          : `[${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}] `;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const val = input.value;

        input.value = val.substring(0, start) + stamp + val.substring(end);
        const newPos = start + stamp.length;
        input.setSelectionRange(newPos, newPos);
        input.focus();
        input.dispatchEvent(new Event("input"));
        playNoteFeedback(500);
      });
    }

    // TOOLBAR: Interactive Checklist Preview Toggle
    function togglePreviewMode(targetState) {
      isPreviewMode = typeof targetState === "boolean" ? targetState : !isPreviewMode;
      if (isPreviewMode) {
        saveImmediate();
        renderChecklistPreview();
        input.style.display = "none";
        if (preview) {
          preview.style.display = "block";
          preview.setAttribute("aria-hidden", "false");
        }
        if (toolViewToggle) {
          toolViewToggle.classList.add("active");
          toolViewToggle.setAttribute("title", "Switch to Edit mode");
        }
      } else {
        if (preview) {
          preview.style.display = "none";
          preview.setAttribute("aria-hidden", "true");
        }
        input.style.display = "block";
        input.focus();
        if (toolViewToggle) {
          toolViewToggle.classList.remove("active");
          toolViewToggle.setAttribute("title", "Toggle interactive checklist");
        }
      }
    }

    if (toolViewToggle) {
      toolViewToggle.addEventListener("click", () => togglePreviewMode());
    }

    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    // Render interactive checklist items in preview
    function renderChecklistPreview() {
      if (!preview) return;
      const text = input.value || "";
      if (!text.trim()) {
        preview.innerHTML = `<div class="reminder-empty-state" style="padding: 24px; text-align: center;">Note is empty. Click <b>Edit</b> to start typing!</div>`;
        return;
      }

      const lines = text.split("\n");
      preview.innerHTML = "";

      lines.forEach((line, index) => {
        const checkMatch = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
        if (checkMatch) {
          const isChecked = checkMatch[2].toLowerCase() === "x";
          const itemText = checkMatch[3];

          const lineDiv = document.createElement("div");
          lineDiv.className = "checklist-line";

          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.className = "checklist-checkbox";
          cb.checked = isChecked;

          const span = document.createElement("span");
          span.className = `checklist-text ${isChecked ? "completed" : ""}`;
          span.innerHTML = escapeHtml(itemText) || "&nbsp;";

          // Toggle task line directly in textarea and re-render
          const toggleAction = () => {
            const nextChecked = !cb.checked;
            cb.checked = nextChecked;
            lines[index] = `${checkMatch[1]}- [${nextChecked ? "x" : " "}] ${itemText}`;
            input.value = lines.join("\n");
            span.classList.toggle("completed", nextChecked);
            updateStats();
            saveImmediate();
            playNoteFeedback(nextChecked ? 660 : 380);
          };

          cb.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleAction();
          });
          lineDiv.addEventListener("click", toggleAction);

          lineDiv.appendChild(cb);
          lineDiv.appendChild(span);
          preview.appendChild(lineDiv);
        } else if (line.startsWith("# ")) {
          const h = document.createElement("div");
          h.className = "preview-header-line";
          h.textContent = line.replace(/^#+\s*/, "");
          preview.appendChild(h);
        } else {
          const p = document.createElement("div");
          p.className = "preview-regular-line";
          p.innerHTML = escapeHtml(line) || "&nbsp;";
          preview.appendChild(p);
        }
      });
    }

    // TOOLBAR: Copy Note to Clipboard
    if (toolCopy) {
      toolCopy.addEventListener("click", async () => {
        const textToCopy = input.value || "";
        try {
          await navigator.clipboard.writeText(textToCopy);
          toolCopy.classList.add("active");
          toolCopy.style.color = "#10b981";
          playNoteFeedback(580);
          setTimeout(() => {
            toolCopy.classList.remove("active");
            toolCopy.style.color = "";
          }, 1200);
        } catch (_) {}
      });
    }

    // EXPAND / COMFORT VIEW TOGGLE
    if (expandBtn) {
      expandBtn.addEventListener("click", () => {
        const isExp = panel.classList.toggle("expanded");
        expandBtn.textContent = isExp ? "⤡" : "⤢";
        try {
          localStorage.setItem("fl_notes_expanded", String(isExp));
        } catch (_) {}
      });
    }

    // CLEAR NOTE BUTTON
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (!input.value.trim()) return;
        const confirmClear = confirm(`Clear this ${activeTab === "today" ? "Today" : "Pinned"} note?`);
        if (confirmClear) {
          input.value = "";
          updateStats();
          saveImmediate();
          if (isPreviewMode) renderChecklistPreview();
        }
      });
    }

    // =========================================================================
    // NOTE REMINDERS SUB-SYSTEM
    // =========================================================================
    function updateRemindersBadge(reminders = []) {
      const activeCount = (reminders || []).filter((r) => r.due > Date.now()).length;
      if (reminderBadge) {
        if (activeCount > 0) {
          reminderBadge.style.display = "inline-flex";
          reminderBadge.textContent = String(activeCount);
        } else {
          reminderBadge.style.display = "none";
        }
      }
    }

    async function loadAndRenderReminders() {
      if (!chrome || !chrome.storage || !chrome.storage.local) return;
      const stored = await chrome.storage.local.get(["fl_note_reminders"]);
      const reminders = (stored.fl_note_reminders || []).filter((r) => r.due > Date.now());
      updateRemindersBadge(reminders);

      if (!activeRemindersList) return;
      activeRemindersList.innerHTML = "";

      if (reminders.length === 0) {
        activeRemindersList.innerHTML = `<div class="reminder-empty-state">No scheduled reminders</div>`;
        return;
      }

      reminders.sort((a, b) => a.due - b.due);
      reminders.forEach((rem) => {
        const item = document.createElement("div");
        item.className = "reminder-active-item";

        const dueTime = new Date(rem.due);
        const isToday = dueTime.toDateString() === new Date().toDateString();
        const formattedTime = isToday
          ? dueTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : dueTime.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + dueTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        const infoDiv = document.createElement("div");
        infoDiv.className = "reminder-item-info";
        infoDiv.innerHTML = `<span class="reminder-item-time">${formattedTime}</span> <span class="reminder-item-text" title="${escapeHtml(rem.text)}">${escapeHtml(rem.text)}</span>`;

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "reminder-item-del";
        delBtn.title = "Cancel reminder";
        delBtn.textContent = "✕";
        delBtn.addEventListener("click", () => cancelReminder(rem.id));

        item.appendChild(infoDiv);
        item.appendChild(delBtn);
        activeRemindersList.appendChild(item);
      });
    }

    async function scheduleReminder(targetWhen, reminderText) {
      if (!targetWhen || targetWhen <= Date.now()) {
        alert("Please select a future time for the reminder.");
        return;
      }

      const text = (reminderText || "").trim() || "Note priority reminder";
      const remId = "rem_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
      const newRem = {
        id: remId,
        text,
        due: targetWhen,
        created: Date.now(),
        tab: activeTab
      };

      if (chrome && chrome.storage && chrome.storage.local) {
        const stored = await chrome.storage.local.get(["fl_note_reminders"]);
        const list = stored.fl_note_reminders || [];
        list.push(newRem);
        await chrome.storage.local.set({ fl_note_reminders: list });

        if (chrome.alarms) {
          chrome.alarms.create("cadence_note_rem_" + remId, { when: targetWhen });
        }

        playNoteFeedback(620);
        await loadAndRenderReminders();

        // Close popover after set
        if (reminderPopover) reminderPopover.style.display = "none";
        if (toolReminder) toolReminder.classList.remove("active");
      }
    }

    async function cancelReminder(remId) {
      if (!chrome || !chrome.storage || !chrome.storage.local) return;
      const stored = await chrome.storage.local.get(["fl_note_reminders"]);
      const list = (stored.fl_note_reminders || []).filter((r) => r.id !== remId);
      await chrome.storage.local.set({ fl_note_reminders: list });

      if (chrome.alarms) {
        chrome.alarms.clear("cadence_note_rem_" + remId);
      }
      loadAndRenderReminders();
    }

    // Toggle Reminder Popover
    if (toolReminder) {
      toolReminder.addEventListener("click", () => {
        if (!reminderPopover) return;
        const isHidden = reminderPopover.style.display === "none";
        if (isHidden) {
          reminderPopover.style.display = "flex";
          reminderPopover.setAttribute("aria-hidden", "false");
          toolReminder.classList.add("active");

          // Prepopulate topic from selected text, first checklist item, or note title
          if (reminderTextInput) {
            const selectedText = input.value.substring(input.selectionStart, input.selectionEnd).trim();
            if (selectedText && selectedText.length <= 100) {
              reminderTextInput.value = selectedText;
            } else {
              // Find first unchecked task
              const unchecked = (input.value || "").match(/^(\s*)-\s*\[\s*\]\s*(.*)$/m);
              if (unchecked && unchecked[2]) {
                reminderTextInput.value = unchecked[2].trim();
              } else {
                const firstLine = (input.value || "").split("\n").find((l) => l.trim().length > 0);
                reminderTextInput.value = firstLine ? firstLine.replace(/^#+\s*/, "").trim().substring(0, 80) : "";
              }
            }
            setTimeout(() => reminderTextInput.focus(), 100);
          }
          loadAndRenderReminders();
        } else {
          reminderPopover.style.display = "none";
          reminderPopover.setAttribute("aria-hidden", "true");
          toolReminder.classList.remove("active");
        }
      });
    }

    if (closeReminderBtn) {
      closeReminderBtn.addEventListener("click", () => {
        if (reminderPopover) reminderPopover.style.display = "none";
        if (toolReminder) toolReminder.classList.remove("active");
      });
    }

    // Preset buttons (+15m, +30m, +1h, +3h, tomorrow-9am)
    const presetBtns = panel.querySelectorAll(".reminder-preset-btn");
    presetBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = reminderTextInput ? reminderTextInput.value : "";
        const minutes = Number(btn.getAttribute("data-minutes"));
        const preset = btn.getAttribute("data-preset");

        let targetWhen = 0;
        if (minutes) {
          targetWhen = Date.now() + minutes * 60 * 1000;
        } else if (preset === "tomorrow-9am") {
          const tm = new Date();
          tm.setDate(tm.getDate() + 1);
          tm.setHours(9, 0, 0, 0);
          targetWhen = tm.getTime();
        }

        scheduleReminder(targetWhen, text);
      });
    });

    // Custom time reminder
    if (scheduleCustomReminderBtn && reminderCustomTime) {
      scheduleCustomReminderBtn.addEventListener("click", () => {
        const val = reminderCustomTime.value; // "HH:MM"
        if (!val) {
          alert("Please enter a valid time (e.g. 14:30)");
          return;
        }
        const [h, m] = val.split(":").map(Number);
        const target = new Date();
        target.setHours(h, m, 0, 0);
        if (target.getTime() <= Date.now()) {
          // Time is earlier today, set for tomorrow
          target.setDate(target.getDate() + 1);
        }
        const text = reminderTextInput ? reminderTextInput.value : "";
        scheduleReminder(target.getTime(), text);
      });
    }

    // Listen to storage changes for reminders (e.g. triggered in background)
    if (chrome && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes.fl_note_reminders) {
          updateRemindersBadge(changes.fl_note_reminders.newValue || []);
          if (reminderPopover && reminderPopover.style.display !== "none") {
            loadAndRenderReminders();
          }
        }
      });
    }

    // =========================================================================
    // PAST DAILY NOTES HISTORY
    // =========================================================================
    if (historyBtn && historyPopover) {
      historyBtn.addEventListener("click", async () => {
        const isHidden = historyPopover.style.display === "none";
        if (isHidden) {
          historyPopover.style.display = "flex";
          historyPopover.setAttribute("aria-hidden", "false");
          renderPastDailyHistory();
        } else {
          historyPopover.style.display = "none";
          historyPopover.setAttribute("aria-hidden", "true");
        }
      });
    }

    if (closeHistoryBtn) {
      closeHistoryBtn.addEventListener("click", () => {
        if (historyPopover) historyPopover.style.display = "none";
      });
    }

    async function renderPastDailyHistory() {
      if (!historyList) return;
      if (!chrome || !chrome.storage || !chrome.storage.local) return;
      const stored = await chrome.storage.local.get(["fl_notes_daily"]);
      const allDaily = stored.fl_notes_daily || {};
      const dates = Object.keys(allDaily)
        .filter((d) => d !== todayKey && (allDaily[d] || "").trim().length > 0)
        .sort()
        .reverse();

      historyList.innerHTML = "";
      if (dates.length === 0) {
        historyList.innerHTML = `<div class="history-empty-state">No previous daily notes yet. Today's notes will appear here tomorrow!</div>`;
        return;
      }

      dates.forEach((dateStr) => {
        const item = document.createElement("div");
        item.className = "history-item";

        const text = allDaily[dateStr] || "";
        const snippet = text.replace(/\n+/g, " ").substring(0, 75);

        const d = new Date(dateStr + "T00:00:00");
        const formattedDate = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

        item.innerHTML = `
          <div class="history-item-header">
            <span class="history-item-date">${formattedDate}</span>
            <span class="reminder-item-del" style="color: #a78bfa; font-size: 10px;" title="Copy uncompleted tasks to Today">+ Copy tasks</span>
          </div>
          <div class="history-item-snippet">${escapeHtml(snippet)}</div>
        `;

        item.addEventListener("click", () => {
          // Extract uncompleted items from that day and append to today
          const uncompleted = (text.match(/^(\s*)-\s*\[\s*\]\s*.*$/gm) || []).join("\n");
          if (uncompleted) {
            switchTab("today");
            input.value = (input.value ? input.value + "\n\n" : "") + `# From ${formattedDate}:\n` + uncompleted;
            updateStats();
            saveImmediate();
            historyPopover.style.display = "none";
            playNoteFeedback(560);
          } else {
            // Or view full note
            switchTab("today");
            input.value = (input.value ? input.value + "\n\n" : "") + text;
            updateStats();
            saveImmediate();
            historyPopover.style.display = "none";
          }
        });

        historyList.appendChild(item);
      });
    }

    // Toggle Scratchpad Visibility
    function toggleScratchpad() {
      const active = panel.classList.toggle("active");
      if (active) {
        panel.setAttribute("aria-hidden", "false");
        syncLiveDateTime();
        setTimeout(() => {
          if (!isPreviewMode) input.focus();
        }, 150);
        // Refresh reminders badge
        if (chrome && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(["fl_note_reminders"], (res) => {
            updateRemindersBadge(res ? res.fl_note_reminders || [] : []);
          });
        }
      } else {
        panel.setAttribute("aria-hidden", "true");
        saveImmediate();
        if (reminderPopover) reminderPopover.style.display = "none";
        if (historyPopover) historyPopover.style.display = "none";
      }
    }

    if (notesBtn) notesBtn.addEventListener("click", toggleScratchpad);
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        panel.classList.remove("active");
        panel.setAttribute("aria-hidden", "true");
        saveImmediate();
      });
    }

    return { toggleScratchpad };
  }

  /* =====================================================================
   * CADENCE RECAP BADGE MODAL
   * ===================================================================== */
  function initRecapBadge() {
    const overlay = document.getElementById("cadenceRecapModalOverlay");
    const closeBtn = document.getElementById("closeRecapModalBtn");
    const copyBtn = document.getElementById("copyRecapTextBtn");
    const streakEl = document.getElementById("recapStreakNum");
    const scoreEl = document.getElementById("recapDailyScore");
    const focusEl = document.getElementById("recapFocusSprints");

    async function refreshRecapData() {
      if (!chrome || !chrome.storage || !chrome.storage.local) return;
      const stored = await chrome.storage.local.get(["fl_habits", "fl_completions", "fl_pro_settings"]);
      const habits = stored.fl_habits || [];
      const completions = stored.fl_completions || {};
      const pro = stored.fl_pro_settings || {};
      const today = new Date().toISOString().slice(0, 10);
      const todayDone = completions[today] || {};

      const doneCount = habits.filter(h => !!todayDone[h.id]).length;
      const total = habits.length || 1;
      const pct = Math.round((doneCount / total) * 100);

      let bestStreak = 7;
      if (window.FL && window.FL.longestStreakAcrossHabits) {
        bestStreak = window.FL.longestStreakAcrossHabits(habits, completions);
      }
      if (streakEl) streakEl.textContent = bestStreak || 1;
      if (scoreEl) scoreEl.textContent = `${pct}%`;
      if (focusEl) focusEl.textContent = pro.focusSessionsCompleted || 14;
    }

    function openRecap() {
      if (overlay) {
        refreshRecapData();
        overlay.classList.add("active");
      }
    }

    function closeRecap() {
      if (overlay) overlay.classList.remove("active");
    }

    if (closeBtn) closeBtn.addEventListener("click", closeRecap);
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeRecap();
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const text = `🏆 Cadence Performance Badge:\n🔥 Active Streak: ${streakEl ? streakEl.textContent : 7} Days\n🎯 Execution Score: ${scoreEl ? scoreEl.textContent : "100%"}\n⏱️ Deep Work Sprints: ${focusEl ? focusEl.textContent : 14}\n\nBuilt with Cadence Pro Habit & Performance Tracker.`;
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = "✅ Copied to Clipboard!";
          setTimeout(() => copyBtn.textContent = "📋 Copy Achievement Summary", 2000);
        });
      });
    }

    return { openRecap, closeRecap };
  }

  /* =====================================================================
   * CADENCE KEYBOARD SHORTCUTS ENGINE
   * ===================================================================== */
  function initKeyboardHotkeys(zenEngine, scratchpadEngine, recapEngine) {
    const helpOverlay = document.getElementById("shortcutsHelpOverlay");
    const closeHelpBtn = document.getElementById("closeShortcutsHelpBtn");
    const confirmHelpBtn = document.getElementById("confirmShortcutsHelpBtn");

    function toggleHelp(open) {
      if (helpOverlay) {
        if (open === undefined) helpOverlay.classList.toggle("active");
        else if (open) helpOverlay.classList.add("active");
        else helpOverlay.classList.remove("active");
      }
    }

    if (closeHelpBtn) closeHelpBtn.addEventListener("click", () => toggleHelp(false));
    if (confirmHelpBtn) confirmHelpBtn.addEventListener("click", () => toggleHelp(false));
    if (helpOverlay) {
      helpOverlay.addEventListener("click", (e) => {
        if (e.target === helpOverlay) toggleHelp(false);
      });
    }

    window.addEventListener("keydown", async (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      const isInput = tag === "input" || tag === "textarea" || e.target.isContentEditable;

      // Escape always closes panels
      if (e.key === "Escape") {
        if (document.body.classList.contains("zen-active")) {
          zenEngine.toggleZen();
          return;
        }
        toggleHelp(false);
        const scratchpad = document.getElementById("cadenceScratchpadPanel");
        if (scratchpad && scratchpad.classList.contains("active")) {
          scratchpad.classList.remove("active");
        }
        return;
      }

      if (isInput) return; // Don't trigger hotkeys while typing in search or notes

      // Z: Zen Mode
      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        zenEngine.toggleZen();
      }
      // N: Notes Scratchpad
      else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        scratchpadEngine.toggleScratchpad();
      }
      // C: Cadence AI
      else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        if (window.CadenceAgent) window.CadenceAgent.toggle();
      }
      // T: Tracker Modal
      else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        const trackerBtn = document.getElementById("dockTrackerBtn");
        if (trackerBtn) trackerBtn.click();
      }
      // ?: Help guide
      else if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        toggleHelp();
      }
      // Space: Start/pause sprint
      else if (e.code === "Space") {
        e.preventDefault();
        try {
          const stored = await chrome.storage.local.get(["fl_pro_settings"]);
          const pro = stored.fl_pro_settings || {};
          const session = pro.focusSession || { duration: 25, remainingSeconds: 1500, running: false };
          session.running = !session.running;
          if (session.running) session.startedAt = Date.now();
          pro.focusSession = session;
          await chrome.storage.local.set({ fl_pro_settings: pro });
        } catch (err) {}
      }
      // 1 to 9: Check off habit #1 to #9
      else if (/^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        try {
          const stored = await chrome.storage.local.get(["fl_habits", "fl_completions"]);
          const habits = stored.fl_habits || [];
          if (index < habits.length) {
            const h = habits[index];
            const today = new Date().toISOString().slice(0, 10);
            const completions = stored.fl_completions || {};
            if (!completions[today]) completions[today] = {};
            const isCurrentlyDone = !!completions[today][h.id];
            completions[today][h.id] = isCurrentlyDone ? false : (h.type === "numeric" ? (h.target || 1) : true);
            await chrome.storage.local.set({ fl_completions: completions });
            if (window.CadenceAgent && window.CadenceAgent.playChime) {
              window.CadenceAgent.playChime("action");
            }
          }
        } catch (err) {}
      }
    });
  }

  /* ---------------------------------------------------------------------
   * Today's Momentum — pulls real habit/completion data so the new tab
   * shows live progress without opening the dashboard.
   * ------------------------------------------------------------------- */
  /* =====================================================================
   * GOOGLE LENS BUTTON
   * ===================================================================== */
  const lensSearchBtn = document.getElementById("lensSearchBtn");
  if (lensSearchBtn) {
    lensSearchBtn.addEventListener("click", () => {
      window.open("https://lens.google.com/", "_blank", "noopener,noreferrer");
    });
  }

  /* =====================================================================
   * LIVE NTP CLOCK — Dynamic greeting, precise time, and formatted date
   * ===================================================================== */
  function startNtpClock() {
    const clockEl = document.getElementById("ntpClock");
    if (!clockEl) return;

    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function tick() {
      const now = new Date();
      const rawH = now.getHours();
      let h = rawH;
      const m = now.getMinutes();
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;

      let greeting = "Welcome";
      if (rawH >= 5 && rawH < 12) greeting = "Good morning";
      else if (rawH >= 12 && rawH < 17) greeting = "Good afternoon";
      else if (rawH >= 17 && rawH < 22) greeting = "Good evening";
      else greeting = "Deep Focus";

      const dayName = DAYS[now.getDay()];
      const monthName = MONTHS[now.getMonth()];
      const dateNum = now.getDate();

      clockEl.innerHTML = `
        <div class="clock-big-time">${h}:${String(m).padStart(2, "0")}</div>
        <div class="clock-sub-greeting">${greeting} · ${dayName}, ${monthName} ${dateNum}</div>
      `;
    }

    tick();
    setInterval(tick, 1000);
  }

  /* =====================================================================
   * FIRST-RUN 100% FULL-SCREEN 4K WALLPAPER SETUP TIP
   * Automatically guides new users to achieve edge-to-edge wallpaper.
   * Auto-dismisses upon user action or when footer disappears.
   * ===================================================================== */
  function initFullscreenTip() {
    const STORAGE_KEY = "cadence_fullscreen_tip_dismissed";
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch (e) {}

    const tipEl = document.getElementById("cadenceFullscreenTip");
    if (!tipEl) return;

    const initialH = window.innerHeight;

    // Show after slight delay so page transitions settle smoothly
    const timer = setTimeout(() => {
      tipEl.classList.add("visible");
    }, 1200);

    const dismiss = () => {
      clearTimeout(timer);
      tipEl.classList.remove("visible");
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch (e) {}
      setTimeout(() => {
        if (tipEl.parentNode) tipEl.parentNode.removeChild(tipEl);
      }, 450);
      window.removeEventListener("resize", onResize);
    };

    const onResize = () => {
      // If height increased significantly (>25px), user likely hid the native footer
      if (window.innerHeight - initialH > 25) {
        dismiss();
      }
    };

    window.addEventListener("resize", onResize);

    const doneBtn = document.getElementById("dismissFullscreenTipBtn");
    const closeBtn = document.getElementById("closeFullscreenTipBtn");
    if (doneBtn) doneBtn.addEventListener("click", dismiss);
    if (closeBtn) closeBtn.addEventListener("click", dismiss);
  }

  function boot() {
    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
