(function (global) {
  "use strict";
  const FL = global.FL = global.FL || {};

  const THEME_PALETTES = FL.THEME_PALETTES;
  const WALLPAPERS = FL.WALLPAPERS;

  /* ---------------------------------------------------------------------
   * Theme & Wallpaper DOM Applicator
   * ------------------------------------------------------------------- */
  let activeParticleEngine = null;

  function applyThemeEngine(themeSettings) {
    if (!themeSettings || typeof document === "undefined") return;
    const {
      wallpaperId = "dolomites_sunbeams_8k",
      customWallpaperUrl = "",
      wallpaperFit = "cover",
      paletteId = "crystal_light",
      particleType = "none",
      blurPx = 0,
      dimOpacity = 0,
      saturationPct = 100,
      brightnessPct = 100,
      contrastPct = 100,
      themeMode = "system",
      dynamicTimeShift = false,
      parallax3D = false,
    } = themeSettings;

    // Resolve "system" to actual dark/light via browser preference
    const prefersDark = window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolvedMode = themeMode === "system"
      ? (prefersDark ? "dark" : "light")
      : themeMode;

    // 1. Resolve Palette
    const palette = THEME_PALETTES.find((p) => p.id === paletteId) || THEME_PALETTES[0];
    const root = document.documentElement;

    root.style.setProperty("--violet", palette.primary);
    root.style.setProperty("--violet-light", palette.primaryLight);
    root.style.setProperty("--teal", palette.accent);
    root.style.setProperty("--glow-accent", palette.glow);

    if (resolvedMode === "dark") {
      document.body.setAttribute("data-theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
      root.style.setProperty("--bg", "#101226");
      root.style.setProperty("--card", "rgba(30, 36, 74, 0.78)");
      root.style.setProperty("--card-solid", "#1A1E3C");
      root.style.setProperty("--line", "rgba(255, 255, 255, 0.14)");
      root.style.setProperty("--ink", "#FFFFFF");
      root.style.setProperty("--ink-soft", "#A0AEC0");
    } else {
      document.body.removeAttribute("data-theme");
      document.documentElement.removeAttribute("data-theme");
      root.style.setProperty("--bg", palette.bg);
      root.style.setProperty("--card", palette.cardBg);
      root.style.setProperty("--card-solid", palette.cardSolid);
      root.style.setProperty("--line", palette.line);
      root.style.setProperty("--ink", palette.ink);
      root.style.setProperty("--ink-soft", palette.inkSoft);
    }

    // Re-apply automatically when OS theme changes (only when mode is "system")
    if (window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      // Remove any previously bound system listener to avoid duplicates
      if (applyThemeEngine._systemListener) {
        mq.removeEventListener("change", applyThemeEngine._systemListener);
        applyThemeEngine._systemListener = null;
      }
      if (themeMode === "system") {
        applyThemeEngine._systemListener = () => applyThemeEngine(themeSettings);
        mq.addEventListener("change", applyThemeEngine._systemListener);
      }
    }

    // 2. Resolve Wallpaper (with dynamic time-of-day shift support)
    const allWps = (FL && FL.WALLPAPERS) || [];
    let resolvedWallpaperId = wallpaperId;
    if (dynamicTimeShift && FL.getDynamicWallpaperForHour && wallpaperId !== "custom") {
      resolvedWallpaperId = FL.getDynamicWallpaperForHour();
    }

    const defaultBundledFile = (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL)
      ? chrome.runtime.getURL("Wallpaper/pexels-eberhardgross-12365962.jpg")
      : "Wallpaper/pexels-eberhardgross-12365962.jpg";

    let wallpaperUrl = "";
    if (resolvedWallpaperId === "custom" && customWallpaperUrl) {
      wallpaperUrl = customWallpaperUrl;
    } else if (resolvedWallpaperId !== "none") {
      const wp = allWps.find((w) => w.id === resolvedWallpaperId)
        || allWps.find((w) => w.id === "dolomites_sunbeams_8k")
        || allWps[1];

      if (wp) {
        if (wp.file) {
          if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
            wallpaperUrl = chrome.runtime.getURL(wp.file);
          } else {
            wallpaperUrl = wp.file;
          }
        } else if (wp.url) {
          wallpaperUrl = wp.url;
        }
      }
      if (!wallpaperUrl) {
        wallpaperUrl = defaultBundledFile;
      }
    }

    let container = document.getElementById("cadenceWallpaperContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "cadenceWallpaperContainer";
      container.style.position = "fixed";
      container.style.inset = "0";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.overflow = "hidden";
      container.style.zIndex = "0";
      container.style.pointerEvents = "none";
      if (document.body.firstChild) {
        document.body.insertBefore(container, document.body.firstChild);
      } else {
        document.body.appendChild(container);
      }
    } else {
      container.style.zIndex = "0";
      container.style.pointerEvents = "none";
    }

    // Atmospheric studio background on container so screen is never flat pitch black
    container.style.background = resolvedMode === "dark"
      ? "radial-gradient(circle at 50% 30%, #1e1548 0%, #0c081e 50%, #05030e 100%)"
      : "radial-gradient(circle at 50% 30%, #E2E8F0 0%, #F1F5F9 50%, #FFFFFF 100%)";

    let bgLayer = document.getElementById("cadenceWallpaperLayer");
    if (!bgLayer) {
      bgLayer = document.createElement("div");
      bgLayer.id = "cadenceWallpaperLayer";
      bgLayer.style.position = "absolute";
      bgLayer.style.top = "0";
      bgLayer.style.left = "0";
      bgLayer.style.width = "100%";
      bgLayer.style.height = "100%";
      bgLayer.style.transform = "none";
      bgLayer.style.backgroundSize = "cover";
      bgLayer.style.backgroundPosition = "center center";
      bgLayer.style.backgroundRepeat = "no-repeat";
      bgLayer.style.pointerEvents = "none";
      bgLayer.style.transition = "opacity 0.4s ease-in-out, filter 0.3s ease";
      bgLayer.style.willChange = "opacity, filter";
      container.appendChild(bgLayer);
    } else {
      bgLayer.style.top = "0";
      bgLayer.style.left = "0";
      bgLayer.style.width = "100%";
      bgLayer.style.height = "100%";
      bgLayer.style.transform = "none";
    }

    let dimLayer = document.getElementById("cadenceDimLayer");
    if (!dimLayer) {
      dimLayer = document.createElement("div");
      dimLayer.id = "cadenceDimLayer";
      dimLayer.style.position = "absolute";
      dimLayer.style.inset = "0";
      dimLayer.style.width = "100%";
      dimLayer.style.height = "100%";
      dimLayer.style.pointerEvents = "none";
      dimLayer.style.transition = "opacity 0.3s ease, background-color 0.3s ease";
      container.appendChild(dimLayer);
    }

    // Always remove any legacy particle canvas
    const oldCanvas = document.getElementById("cadenceParticleCanvas");
    if (oldCanvas) oldCanvas.remove();

    if (wallpaperUrl) {
      // Robust Image Loading: apply background immediately and support fallbacks safely
      const applyBg = (url) => {
        if (typeof document !== "undefined" && document.documentElement) {
          document.documentElement.style.setProperty("--boot-wallpaper", `url("${url}")`);
          document.documentElement.classList.remove("no-boot-wallpaper");
        }
        bgLayer.style.setProperty("background-image", `url("${url}")`, "important");

        // Set sizing & position based on wallpaperFit
        if (wallpaperFit === "contain") {
          bgLayer.style.backgroundSize = "contain";
          bgLayer.style.backgroundPosition = "center center";
          bgLayer.style.backgroundRepeat = "no-repeat";
          // Ambient blurred backdrop behind contained image
          container.style.backgroundImage = `url("${url}")`;
          container.style.backgroundSize = "cover";
          container.style.backgroundPosition = "center center";
        } else if (wallpaperFit === "center") {
          bgLayer.style.backgroundSize = "auto";
          bgLayer.style.backgroundPosition = "center center";
          bgLayer.style.backgroundRepeat = "no-repeat";
          container.style.backgroundImage = "none";
        } else {
          // Default: Cover (Fill Screen)
          bgLayer.style.backgroundSize = "cover";
          bgLayer.style.backgroundPosition = "center center";
          bgLayer.style.backgroundRepeat = "no-repeat";
          container.style.backgroundImage = "none";
        }

        const filterParts = [];
        if (blurPx > 0) filterParts.push(`blur(${blurPx}px)`);
        if (saturationPct !== 100) filterParts.push(`saturate(${saturationPct}%)`);
        if (typeof brightnessPct === "number" && brightnessPct !== 100) filterParts.push(`brightness(${brightnessPct}%)`);
        if (typeof contrastPct === "number" && contrastPct !== 100) filterParts.push(`contrast(${contrastPct}%)`);
        bgLayer.style.filter = filterParts.length > 0 ? filterParts.join(" ") : "none";
        bgLayer.style.setProperty("opacity", "1", "important");
      };

      // Apply background immediately so browser begins native GPU rendering instantly
      applyBg(wallpaperUrl);

      // If remote, set a non-blocking background error check with referrerPolicy
      if (wallpaperUrl.startsWith("http://") || wallpaperUrl.startsWith("https://")) {
        const testImg = new Image();
        testImg.referrerPolicy = "no-referrer";
        testImg.onerror = () => {
          console.warn("Cadence: Remote wallpaper failed to load; using bundled Ultra HD fallback:", wallpaperUrl);
          const currentVar = document.documentElement ? document.documentElement.style.getPropertyValue("--boot-wallpaper") : "";
          if (currentVar && currentVar.includes(wallpaperUrl)) {
            applyBg(defaultBundledFile);
          }
        };
        testImg.src = wallpaperUrl;
      }

      if (dimOpacity > 0) {
        const dimAlpha = (dimOpacity / 100).toFixed(2);
        dimLayer.style.backgroundColor = palette.bg;
        dimLayer.style.opacity = dimAlpha;
      } else {
        dimLayer.style.opacity = "0";
      }
      document.body.classList.add("has-wallpaper");
      document.documentElement.classList.add("has-wallpaper");

      // Hover/Mousemove animation permanently disabled for solid, stable wallpapers
      if (window._cadenceParallaxHandler) {
        window.removeEventListener("mousemove", window._cadenceParallaxHandler);
        window._cadenceParallaxHandler = null;
      }
      bgLayer.style.transform = "none";
    } else {
      if (typeof document !== "undefined" && document.documentElement) {
        document.documentElement.style.setProperty("--boot-wallpaper", "none");
        document.documentElement.classList.add("no-boot-wallpaper");
      }
      bgLayer.style.setProperty("background-image", "none", "important");
      bgLayer.style.setProperty("opacity", "0", "important");
      dimLayer.style.opacity = "0";
      document.body.classList.remove("has-wallpaper");
      document.documentElement.classList.remove("has-wallpaper");
      if (window._cadenceParallaxHandler) {
        window.removeEventListener("mousemove", window._cadenceParallaxHandler);
        window._cadenceParallaxHandler = null;
      }
      bgLayer.style.transform = "none";
    }

    // Ensure particle engine is halted
    initParticleEngine("none");
  }

  /* ---------------------------------------------------------------------
   * Particle Engine (Disabled for Pure 4K Wallpaper Clarity)
   * ------------------------------------------------------------------- */
  function initParticleEngine(type) {
    if (activeParticleEngine) {
      cancelAnimationFrame(activeParticleEngine.reqId);
      activeParticleEngine = null;
    }
    const canvas = document.getElementById("cadenceParticleCanvas");
    if (canvas) {
      canvas.remove();
    }
  }

  const EXPORTS = { applyThemeEngine, initParticleEngine };

  Object.assign(FL, EXPORTS);
})(typeof window !== "undefined" ? window : globalThis);
