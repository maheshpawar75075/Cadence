(function (global) {
  "use strict";
  const FL = global.FL = global.FL || {};

  const storageGet = FL.storageGet;
  const storageSet = FL.storageSet;
  const KEYS = FL.KEYS;

  /* ---------------------------------------------------------------------
   * Mascot XP & Level Progression System
   * ------------------------------------------------------------------- */
  const MASCOT_LEVELS = [
    { level: 1, title: "Novice", minXp: 0 },
    { level: 2, title: "Squire", minXp: 60 },
    { level: 3, title: "Guardian", minXp: 150 },
    { level: 4, title: "Star Knight", minXp: 280 },
    { level: 5, title: "Cosmic Paladin", minXp: 450 },
    { level: 6, title: "Astral Hero", minXp: 650 },
    { level: 7, title: "Solar Champion", minXp: 900 },
    { level: 8, title: "Mythic Vanguard", minXp: 1200 },
    { level: 9, title: "Celestial Lord", minXp: 1600 },
    { level: 10, title: "Supreme Legend", minXp: 2100 },
  ];

  function calculateXP(completions, habits) {
    let totalXp = 0;
    const dates = Object.keys(completions || {});
    dates.forEach((dateStr) => {
      const dayCompletions = completions[dateStr] || {};
      let completedCount = 0;
      habits.forEach((h) => {
        if (isHabitDone(h, dayCompletions[h.id])) completedCount++;
      });
      totalXp += completedCount * 10;
      if (habits.length > 0 && completedCount === habits.length) {
        totalXp += 25;
      }
    });

    const streak = longestStreakAcrossHabits(habits, completions);
    totalXp += streak * 15;
    return totalXp;
  }

  function getMascotLevel(xp) {
    let levelObj = MASCOT_LEVELS[0];
    let nextObj = MASCOT_LEVELS[1];

    for (let i = 0; i < MASCOT_LEVELS.length; i++) {
      if (xp >= MASCOT_LEVELS[i].minXp) {
        levelObj = MASCOT_LEVELS[i];
        nextObj = MASCOT_LEVELS[i + 1] || null;
      }
    }

    const levelMin = levelObj.minXp;
    const levelNext = nextObj ? nextObj.minXp : levelMin + 500;
    const xpInLevel = Math.max(0, xp - levelMin);
    const levelRange = Math.max(1, levelNext - levelMin);
    const progressPct = nextObj ? Math.min(100, Math.round((xpInLevel / levelRange) * 100)) : 100;

    return {
      level: levelObj.level,
      title: levelObj.title,
      totalXp: xp,
      xpInLevel,
      levelRange,
      progressPct,
      nextTitle: nextObj ? nextObj.title : "MAX",
      nextMinXp: levelNext,
    };
  }

  /* ---------------------------------------------------------------------
   * Pro Subscription, 4K Ultra HD High-Definition Wallpapers
   * ------------------------------------------------------------------- */
  const WALLPAPERS = [
    {
      id: "none",
      name: "No Wallpaper",
      category: "Cadence Essentials",
      accent: "#64748B",
      themeId: "crystal_light",
      badge: "Clean",
      mood: "Minimal & Native",
      description: "Remove the image background for a clean, familiar Chrome-style new tab experience.",
    },
    {
      id: "dolomites_sunbeams_8k",
      name: "Dolomite Lightbeams 8K",
      file: "Wallpaper/pexels-eberhardgross-12365962.jpg",
      thumb: "assets/thumbs/thumb-pexels-eberhardgross-12365962.jpg",
      category: "Mountain & Wilderness",
      accent: "#6366F1",
      themeId: "slate_executive",
      badge: "8K Ultra HD",
      mood: "Ethereal & Inspiring",
      description: "Angelic rays of dawn light pouring through alpine valleys onto a crystal mirror lake.",
    },
    {
      id: "alpine_lake_panorama_12k",
      name: "Alpine Summit Panorama 12K",
      file: "Wallpaper/jerry-kavan-F2UvQ-iIqqA-unsplash.jpg",
      thumb: "assets/thumbs/thumb-jerry-kavan-F2UvQ-iIqqA-unsplash.jpg",
      category: "Mountain & Wilderness",
      accent: "#10B981",
      themeId: "slate_executive",
      badge: "12K Ultra HD",
      mood: "Vast & Infinite",
      description: "Ultra-high-definition 12K panoramic view of an alpine glacial lake nestled between dramatic mountain summits.",
    },
    {
      id: "golden_meadow_brook_12k",
      name: "Golden Meadow Brook 12K",
      file: "Wallpaper/pexels-mattia-d-andrea-1351715572-25696415.jpg",
      thumb: "assets/thumbs/thumb-pexels-mattia-d-andrea-1351715572-25696415.jpg",
      category: "Sunset & Golden Hour",
      accent: "#EAB308",
      themeId: "tokyo_sunset",
      badge: "12K Ultra HD",
      mood: "Luminous & Hopeful",
      description: "A narrow freshwater creek running through emerald grass directly into a blinding golden sunset.",
    },
    {
      id: "vestrahorn_twilight_6k",
      name: "Vestrahorn Reflections 6K",
      file: "Wallpaper/pexels-eberhardgross-20459771.jpg",
      thumb: "assets/thumbs/thumb-pexels-eberhardgross-20459771.jpg",
      category: "Mountain & Wilderness",
      accent: "#EC4899",
      themeId: "sakura_bloom",
      badge: "6K Ultra HD",
      mood: "Sublime & Dramatic",
      description: "Jagged peaks of Vestrahorn glowing under pastel sunset clouds reflected in icy tidal flats.",
    },
    {
      id: "balos_lagoon_boat_8k",
      name: "Balos Lagoon Boat 8K",
      file: "Wallpaper/joshua-kettle-sKOBxEb6E-E-unsplash.jpg",
      thumb: "assets/thumbs/thumb-joshua-kettle-sKOBxEb6E-E-unsplash.jpg",
      category: "Ocean & Seascape",
      accent: "#06B6D4",
      themeId: "crystal_light",
      badge: "8K Ultra HD",
      mood: "Serene & Idyllic",
      description: "Crystal-clear turquoise waters and a solitary white dinghy resting in a sunlit Greek island bay.",
    },
    {
      id: "geiranger_fjord_6k",
      name: "Geiranger Fjord 6K",
      file: "Wallpaper/pexels-enrique72-6415692.jpg",
      thumb: "assets/thumbs/thumb-pexels-enrique72-6415692.jpg",
      category: "Mountain & Wilderness",
      accent: "#14B8A6",
      themeId: "crystal_light",
      badge: "6K Ultra HD",
      mood: "Grand & Invigorating",
      description: "Deep turquoise fjord waters flanked by soaring mossy cliffs and snow-dusted summits.",
    },
    {
      id: "winnats_pass_sunrise_6k",
      name: "Winnats Pass Sunrise 6K",
      file: "Wallpaper/grant-ritchie-x1w_Q78xNEY-unsplash.jpg",
      thumb: "assets/thumbs/thumb-grant-ritchie-x1w_Q78xNEY-unsplash.jpg",
      category: "Mountain & Wilderness",
      accent: "#F59E0B",
      themeId: "tokyo_sunset",
      badge: "6K Ultra HD",
      mood: "Invigorating & Radiant",
      description: "Brilliant sunburst cresting over green limestone valley pass and morning highway.",
    },
    {
      id: "yosemite_half_dome_6k",
      name: "Yosemite River Mirror 6K",
      file: "Wallpaper/pexels-laczadesign-17140515.jpg",
      thumb: "assets/thumbs/thumb-pexels-laczadesign-17140515.jpg",
      category: "Mountain & Wilderness",
      accent: "#0284C7",
      themeId: "crystal_light",
      badge: "6K Ultra HD",
      mood: "Iconic & Peaceful",
      description: "Clear river stones beneath glassy reflections of Yosemite's world-famous granite domes.",
    },
    {
      id: "yosemite_valley_vista_8k",
      name: "Yosemite Valley Vista 8K",
      file: "Wallpaper/pexels-stephen-leonardi-587681991-28610386.jpg",
      thumb: "assets/thumbs/thumb-pexels-stephen-leonardi-587681991-28610386.jpg",
      category: "Mountain & Wilderness",
      accent: "#6366F1",
      themeId: "slate_executive",
      badge: "8K Ultra HD",
      mood: "Timeless & Grand",
      description: "Classic vista of Yosemite Valley, El Capitan, and Bridalveil Fall beneath streaked cirrus clouds.",
    },
    {
      id: "yosemite_autumn_lake_4k",
      name: "Yosemite Autumn Lake 4K",
      file: "Wallpaper/jeremy-bishop-d3fZSXlJ3Ok-unsplash.jpg",
      thumb: "assets/thumbs/thumb-jeremy-bishop-d3fZSXlJ3Ok-unsplash.jpg",
      category: "Mountain & Wilderness",
      accent: "#D97706",
      themeId: "tokyo_sunset",
      badge: "4K Ultra HD",
      mood: "Reflective & Peaceful",
      description: "Golden autumn tree canopy and distant waterfall reflected in a crystal mountain lake.",
    },
    {
      id: "na_pali_coast_6k",
      name: "Na Pali Coastline 6K",
      file: "Wallpaper/braden-jarvis-prSogOoFmkw-unsplash.jpg",
      thumb: "assets/thumbs/thumb-braden-jarvis-prSogOoFmkw-unsplash.jpg",
      category: "Ocean & Seascape",
      accent: "#06B6D4",
      themeId: "crystal_light",
      badge: "6K Ultra HD",
      mood: "Majestic & Free",
      description: "Dramatic emerald green ocean ridges and white sand beaches of Kauai rising out of the Pacific.",
    },
    {
      id: "hawaiian_sunset_peaks_8k",
      name: "Hawaiian Sunset Ridges 8K",
      file: "Wallpaper/pexels-jess-vide-5007767.jpg",
      thumb: "assets/thumbs/thumb-pexels-jess-vide-5007767.jpg",
      category: "Ocean & Seascape",
      accent: "#F59E0B",
      themeId: "tokyo_sunset",
      badge: "8K Ultra HD",
      mood: "Lush & Epic",
      description: "Towering emerald volcanic ridges kissed by late afternoon golden sun above a tropical sandy cove.",
    },
    {
      id: "palm_infinity_reflection_8k",
      name: "Palm Infinity Pool 8K",
      file: "Wallpaper/dan-freeman-wAn4RfmXtxU-unsplash.jpg",
      thumb: "assets/thumbs/thumb-dan-freeman-wAn4RfmXtxU-unsplash.jpg",
      category: "Ocean & Seascape",
      accent: "#0284C7",
      themeId: "crystal_light",
      badge: "8K Ultra HD",
      mood: "Pure Oasis",
      description: "Tropical coconut palms and skies reflected in a mirror-still infinity pool.",
    },
    {
      id: "white_sand_shoreline_4k",
      name: "White Sand Shoreline 4K",
      file: "Wallpaper/nattu-adnan-Ai2TRdvI6gM-unsplash.jpg",
      thumb: "assets/thumbs/thumb-nattu-adnan-Ai2TRdvI6gM-unsplash.jpg",
      category: "Ocean & Seascape",
      accent: "#0EA5E9",
      themeId: "crystal_light",
      badge: "4K Ultra HD",
      mood: "Clean & Refreshing",
      description: "Pristine white coral sands bordered by gentle foaming turquoise surf seen directly from above.",
    },
    {
      id: "keyhole_arch_sunset_8k",
      name: "Keyhole Arch Sunset 8K",
      file: "Wallpaper/joshua-sortino-xZqr8WtYEJ0-unsplash.jpg",
      thumb: "assets/thumbs/thumb-joshua-sortino-xZqr8WtYEJ0-unsplash.jpg",
      category: "Ocean & Seascape",
      accent: "#F97316",
      themeId: "tokyo_sunset",
      badge: "8K Ultra HD",
      mood: "Mystical & Golden",
      description: "Golden hour sun rays blasting through the natural rock portal of Pfeiffer Beach into crashing Pacific waves.",
    },
    {
      id: "cinque_terre_twilight",
      name: "Cinque Terre Twilight",
      file: "Wallpaper/anders-jilden-cYrMQA7a3Wc-unsplash.jpg",
      thumb: "assets/thumbs/thumb-anders-jilden-cYrMQA7a3Wc-unsplash.jpg",
      category: "Ocean & Seascape",
      accent: "#F97316",
      themeId: "tokyo_sunset",
      badge: "Ultra HD",
      mood: "Romantic & Warm",
      description: "Warm glowing coastal village perched on steep Mediterranean cliffs beneath a dramatic twilight sky.",
    },
    {
      id: "alpine_pass_trails",
      name: "Alpine Pass Trails 6K",
      file: "Wallpaper/alexander-slattery-LI748t0BK8w-unsplash.jpg",
      thumb: "assets/thumbs/thumb-alexander-slattery-LI748t0BK8w-unsplash.jpg",
      category: "Mountain & Wilderness",
      accent: "#38BDF8",
      themeId: "slate_executive",
      badge: "6K Ultra HD",
      mood: "Luminous & Cinematic",
      description: "A snow-covered alpine road winding through dark pines with long-exposure vehicle light ribbons at blue hour.",
    },
    {
      id: "alaskan_ice_fjord_6k",
      name: "Alaskan Ice Fjord 6K",
      file: "Wallpaper/john-cobb-IE_sifhay7o-unsplash.jpg",
      thumb: "assets/thumbs/thumb-john-cobb-IE_sifhay7o-unsplash.jpg",
      category: "Mountain & Wilderness",
      accent: "#38BDF8",
      themeId: "slate_executive",
      badge: "6K Ultra HD",
      mood: "Pristine & Untamed",
      description: "Drifting sea ice in deep blue fjord waters framed by granite sea cliffs and jagged snowcaps.",
    },
    {
      id: "alpine_sunburst_range_8k",
      name: "Alpine Sunburst Range 8K",
      file: "Wallpaper/pexels-jplenio-5735485.jpg",
      thumb: "assets/thumbs/thumb-pexels-jplenio-5735485.jpg",
      category: "Mountain & Wilderness",
      accent: "#0284C7",
      themeId: "crystal_light",
      badge: "8K Ultra HD",
      mood: "Bright & High Energy",
      description: "Rugged limestone peaks and rolling grassy pastures mirrored in a quiet alpine tarn under full sun.",
    },
    {
      id: "zion_canyon_falls_6k",
      name: "Zion Canyon Falls 6K",
      file: "Wallpaper/wil-stewart-pHANr-CpbYM-unsplash.jpg",
      thumb: "assets/thumbs/thumb-wil-stewart-pHANr-CpbYM-unsplash.jpg",
      category: "Mountain & Wilderness",
      accent: "#EA580C",
      themeId: "tokyo_sunset",
      badge: "6K Ultra HD",
      mood: "Breathtaking & Vivid",
      description: "Towering red Navajo sandstone cliffs with a delicate waterfall cascading into lush greenery.",
    },
    {
      id: "tatras_purple_dusk",
      name: "Tatras Purple Dusk",
      file: "Wallpaper/stefan-stefancik--g7axSVst6Y-unsplash.jpg",
      thumb: "assets/thumbs/thumb-stefan-stefancik--g7axSVst6Y-unsplash.jpg",
      category: "Mountain & Wilderness",
      accent: "#A855F7",
      themeId: "obsidian_minimal",
      badge: "Ultra HD",
      mood: "Quiet & Dramatic",
      description: "Rugged granite ridges of the High Tatras illuminated by vibrant purple and rose twilight.",
    },
    {
      id: "pinnacle_wanderer",
      name: "Pinnacle Wanderer",
      file: "Wallpaper/urban-vintage-78A265wPiO4-unsplash.jpg",
      thumb: "assets/thumbs/thumb-urban-vintage-78A265wPiO4-unsplash.jpg",
      category: "Mountain & Wilderness",
      accent: "#EAB308",
      themeId: "tokyo_sunset",
      badge: "Ultra HD",
      mood: "Triumphant & Free",
      description: "A solitary adventurer atop a sheer rock spire surveying sunlit mountain valleys.",
    },
    {
      id: "autumn_mountain_valley_6k",
      name: "Autumn Amber Ridge 6K",
      file: "Wallpaper/pexels-ioannis-ioannidis-1565556-20054034.jpg",
      thumb: "assets/thumbs/thumb-pexels-ioannis-ioannidis-1565556-20054034.jpg",
      category: "Mountain & Wilderness",
      accent: "#D97706",
      themeId: "tokyo_sunset",
      badge: "6K Ultra HD",
      mood: "Warm & Cozy",
      description: "Golden yellow autumn leaves in a peaceful mountain valley beneath purple dusk clouds.",
    },
    {
      id: "cypress_mountain_ridge_6k",
      name: "Cypress Mountain Ridge 6K",
      file: "Wallpaper/pexels-urtimud-89-76108288-9161906.jpg",
      thumb: "assets/thumbs/thumb-pexels-urtimud-89-76108288-9161906.jpg",
      category: "Mountain & Wilderness",
      accent: "#D97706",
      themeId: "tokyo_sunset",
      badge: "6K Ultra HD",
      mood: "Warm & Earthy",
      description: "Golden evening light catching the tips of tall cypress trees on a forested Mediterranean mountain.",
    },
    {
      id: "cloud_sea_summit_6k",
      name: "Cloud Sea Summit 6K",
      file: "Wallpaper/pexels-trungnguyenphotog-5155161.jpg",
      thumb: "assets/thumbs/thumb-pexels-trungnguyenphotog-5155161.jpg",
      category: "Sunset & Golden Hour",
      accent: "#F59E0B",
      themeId: "tokyo_sunset",
      badge: "6K Ultra HD",
      mood: "Epic & Awe-Inspiring",
      description: "A solitary observer standing on grassy highlands above dense fog with a fiery funnel cloud at sunset.",
    },
    {
      id: "sunset_prairie_silhouettes_8k",
      name: "Sunset Prairie Glow 8K",
      file: "Wallpaper/pexels-imadclicks-16088698.jpg",
      thumb: "assets/thumbs/thumb-pexels-imadclicks-16088698.jpg",
      category: "Sunset & Golden Hour",
      accent: "#F97316",
      themeId: "tokyo_sunset",
      badge: "8K Ultra HD",
      mood: "Vibrant & Warm",
      description: "A countryside meadow of yellow wildflowers and silhouetted trees glowing under an orange and purple evening sky.",
    },
    {
      id: "lavender_lake_twilight_6k",
      name: "Lavender Lake Twilight 6K",
      file: "Wallpaper/pexels-rinoadamo-35281884.jpg",
      thumb: "assets/thumbs/thumb-pexels-rinoadamo-35281884.jpg",
      category: "Sunset & Golden Hour",
      accent: "#8B5CF6",
      themeId: "obsidian_minimal",
      badge: "6K Ultra HD",
      mood: "Dreamy & Serene",
      description: "Delicate tree branches mirrored in glass-like lake waters under a soothing lavender evening sky.",
    },
    {
      id: "emerald_lake_canopy",
      name: "Emerald Lake Canopy",
      file: "Wallpaper/andreas-gucklhorn-mawU2PoJWfU-unsplash.jpg",
      thumb: "assets/thumbs/thumb-andreas-gucklhorn-mawU2PoJWfU-unsplash.jpg",
      category: "Forest & Nature",
      accent: "#10B981",
      themeId: "emerald_zen",
      badge: "Ultra HD",
      mood: "Calm & Grounded",
      description: "Top-down aerial view of a dense evergreen forest meeting crystal turquoise glacial waters.",
    },
    {
      id: "midnight_foliage_6k",
      name: "Midnight Botanical 6K",
      file: "Wallpaper/djordje-gajic-XpmBYWxDMdg-unsplash.jpg",
      thumb: "assets/thumbs/thumb-djordje-gajic-XpmBYWxDMdg-unsplash.jpg",
      category: "Forest & Nature",
      accent: "#059669",
      themeId: "emerald_zen",
      badge: "6K Ultra HD",
      mood: "Deep Focus & Quiet",
      description: "Rich dark green textured leaves with organic patterns, perfect for a high-contrast distraction-free workspace.",
    },
    {
      id: "taiga_expedition_8k",
      name: "Taiga Expedition 8K",
      file: "Wallpaper/mikhail-pushkarev-XrSWzMOfe-k-unsplash.jpg",
      thumb: "assets/thumbs/thumb-mikhail-pushkarev-XrSWzMOfe-k-unsplash.jpg",
      category: "Forest & Nature",
      accent: "#15803D",
      themeId: "emerald_zen",
      badge: "8K Ultra HD",
      mood: "Adventurous & Rugged",
      description: "An expedition vehicle poised on a misty trail deep inside a silent evergreen forest.",
    },
    {
      id: "river_bend_wetlands_8k",
      name: "River Bend Wetlands 8K",
      file: "Wallpaper/pexels-john-callery-3749962-5620997.jpg",
      thumb: "assets/thumbs/thumb-pexels-john-callery-3749962-5620997.jpg",
      category: "Forest & Nature",
      accent: "#10B981",
      themeId: "emerald_zen",
      badge: "8K Ultra HD",
      mood: "Fresh & Restful",
      description: "A winding calm river through vibrant green reed grasses and distant towering pines.",
    },
    {
      id: "solitary_meadow_oak_8k",
      name: "Prairie Oak Horizon 8K",
      file: "Wallpaper/pexels-damir-31447507.jpg",
      thumb: "assets/thumbs/thumb-pexels-damir-31447507.jpg",
      category: "Forest & Nature",
      accent: "#38BDF8",
      themeId: "crystal_light",
      badge: "8K Ultra HD",
      mood: "Open & Contemplative",
      description: "A lone oak tree standing proud in a wide golden field stretching to distant rolling hills.",
    },
    {
      id: "poly_matrix_emerald_8k",
      name: "Prismatic Wireframe 8K",
      file: "Wallpaper/logan-voss-mAlnGB7D6wU-unsplash.jpg",
      thumb: "assets/thumbs/thumb-logan-voss-mAlnGB7D6wU-unsplash.jpg",
      category: "Architecture & Abstract",
      accent: "#22C55E",
      themeId: "emerald_zen",
      badge: "8K Ultra HD",
      mood: "Futuristic & Crisp",
      description: "Intricate geometric wireframe tessellation with reflective emerald and violet glass surfaces.",
    },
    {
      id: "wooden_labyrinth_8k",
      name: "Architectural Blocks 8K",
      file: "Wallpaper/nigel-hoare-lKW9bwqGwTw-unsplash.jpg",
      thumb: "assets/thumbs/thumb-nigel-hoare-lKW9bwqGwTw-unsplash.jpg",
      category: "Architecture & Abstract",
      accent: "#D97706",
      themeId: "tokyo_sunset",
      badge: "8K Ultra HD",
      mood: "Creative & Structured",
      description: "A dense, intricate maze of wooden arches, stairways, and geometric perspective blocks.",
    },
    {
      id: "custom",
      name: "Custom 4K Wallpaper",
      file: "",
      category: "Custom",
      accent: "#4F46E5",
      themeId: "crystal_light",
      badge: "Your Upload",
      mood: "Personalized",
      description: "Upload any 4K image file or paste an image URL for instant background application.",
    },
  ];

  const THEME_PALETTES = [
    {
      id: "crystal_light",
      name: "Nordic Light",
      tag: "Pure Studio",
      primary: "#4F46E5",
      primaryLight: "#6366F1",
      accent: "#059669",
      bg: "#F8FAFC",
      cardBg: "rgba(255, 255, 255, 0.95)",
      cardSolid: "#FFFFFF",
      line: "#E2E8F0",
      ink: "#0F172A",
      inkSoft: "#64748B",
      glow: "rgba(79, 70, 229, 0.15)",
    },
    {
      id: "slate_executive",
      name: "Slate Executive",
      tag: "Cool Titanium",
      primary: "#2563EB",
      primaryLight: "#3B82F6",
      accent: "#0284C7",
      bg: "#F1F5F9",
      cardBg: "rgba(255, 255, 255, 0.95)",
      cardSolid: "#FFFFFF",
      line: "#CBD5E1",
      ink: "#0F172A",
      inkSoft: "#475569",
      glow: "rgba(37, 99, 235, 0.15)",
    },
    {
      id: "sakura_bloom",
      name: "Sakura Bloom",
      tag: "Rose Ceramic",
      primary: "#D946EF",
      primaryLight: "#EC4899",
      accent: "#E11D48",
      bg: "#FDF2F8",
      cardBg: "rgba(255, 255, 255, 0.95)",
      cardSolid: "#FFFFFF",
      line: "#FBCFE8",
      ink: "#4A044E",
      inkSoft: "#9D174D",
      glow: "rgba(217, 70, 239, 0.15)",
    },
    {
      id: "emerald_zen",
      name: "Emerald Studio",
      tag: "Botanical Clean",
      primary: "#059669",
      primaryLight: "#10B981",
      accent: "#0D9488",
      bg: "#F0FDF4",
      cardBg: "rgba(255, 255, 255, 0.95)",
      cardSolid: "#FFFFFF",
      line: "#BBF7D0",
      ink: "#064E3B",
      inkSoft: "#047857",
      glow: "rgba(5, 150, 105, 0.15)",
    },
    {
      id: "tokyo_sunset",
      name: "Tokyo Sunset",
      tag: "Amber Honey",
      primary: "#D97706",
      primaryLight: "#F59E0B",
      accent: "#EA580C",
      bg: "#FFFBEB",
      cardBg: "rgba(255, 255, 255, 0.95)",
      cardSolid: "#FFFFFF",
      line: "#FDE68A",
      ink: "#78350F",
      inkSoft: "#B45309",
      glow: "rgba(217, 119, 6, 0.15)",
    },
    {
      id: "obsidian_minimal",
      name: "Minimal Zinc",
      tag: "Clean Monochrome",
      primary: "#18181B",
      primaryLight: "#3F3F46",
      accent: "#4F46E5",
      bg: "#FAFAFA",
      cardBg: "rgba(255, 255, 255, 0.98)",
      cardSolid: "#FFFFFF",
      line: "#E4E4E7",
      ink: "#09090B",
      inkSoft: "#71717A",
      glow: "rgba(24, 24, 27, 0.12)",
    },
  ];

  const PRO_COMPANIONS = [
    {
      id: "knight",
      name: "Star Knight",
      title: "Cosmic Vanguard",
      icon: "⚔️",
      element: "Cosmic Astral",
      catchphrase: "Consistency is our sharpest blade!",
      isPro: false,
      perk: "+10% Streak Recovery Speed",
      quotePool: [
        "Every checkmark brings us closer to celestial glory!",
        "A hero's greatest power is showing up every single day.",
        "Stay vigilant, champion! The stars favor the disciplined.",
        "Defend your daily routine like a sacred realm!",
      ],
    },
    {
      id: "shinobi",
      name: "Cyber Shinobi",
      title: "Neo-Tokyo Shadow",
      icon: "🥷",
      element: "Neon Lightning",
      catchphrase: "Silent focus. Lethal execution.",
      isPro: true,
      perk: "+15% Focus Timer XP Bonus",
      quotePool: [
        "In the neon rain, only absolute discipline cuts through the noise.",
        "Move swiftly. Log accurately. Master your daily craft.",
        "Distraction is the enemy of greatness.",
        "Zero hesitation. Complete the mission.",
      ],
    },
    {
      id: "priestess",
      name: "Sakura Miko",
      title: "Shrine Guardian",
      icon: "🌸",
      element: "Zen Blossom",
      catchphrase: "Peace in every breath, strength in every habit.",
      isPro: true,
      perk: "+1 Weekly Streak Freeze Protection",
      quotePool: [
        "May your day blossom with mindfulness and tranquility.",
        "Even the oldest cherry tree grows one petal at a time.",
        "Breathe deeply. You have accomplished so much already.",
        "Quiet discipline creates monumental change.",
      ],
    },
    {
      id: "phoenix",
      name: "Solar Phoenix",
      title: "Flame of Rebirth",
      icon: "🦅",
      element: "Solar Flame",
      catchphrase: "Rise higher with every completed challenge!",
      isPro: true,
      perk: "Double XP on Perfect Habit Days",
      quotePool: [
        "From every stumble, we rise stronger than ever!",
        "Let the fire of determination ignite your daily routine!",
        "Burn bright, warrior of consistency!",
        "No obstacle can extinguish a resolute spirit.",
      ],
    },
    {
      id: "mecha",
      name: "Aegis Mecha",
      title: "Quantum Sentinel",
      icon: "🤖",
      element: "Quantum Core",
      catchphrase: "Systems nominal. Habit optimization at 100%.",
      isPro: true,
      perk: "Automated Deep AI Pattern Telemetry",
      quotePool: [
        "Habit efficiency matrix calibrated: peak performance detected!",
        "Daily routine synchronized with quantum accuracy.",
        "Calculating optimal productivity trajectory... Executing now.",
        "Algorithmic precision achieved!",
      ],
    },
  ];

  const DYNAMIC_TIMESHIFT_WALLPAPERS = {
    dawn: "winnats_pass_sunrise_6k",
    day: "geiranger_fjord_6k",
    sunset: "cinque_terre_twilight",
    night: "dolomites_sunbeams_8k",
  };

  function getDynamicWallpaperForHour(hour = new Date().getHours()) {
    if (hour >= 5 && hour < 11) return DYNAMIC_TIMESHIFT_WALLPAPERS.dawn;
    if (hour >= 11 && hour < 17) return DYNAMIC_TIMESHIFT_WALLPAPERS.day;
    if (hour >= 17 && hour < 21) return DYNAMIC_TIMESHIFT_WALLPAPERS.sunset;
    return DYNAMIC_TIMESHIFT_WALLPAPERS.night;
  }

  const DEFAULT_THEME_SETTINGS = {
    wallpaperId: "dolomites_sunbeams_8k", // Bundled 8K Ultra HD Dolomite Lightbeams (instant local load)
    customWallpaperUrl: "",
    customWallpapers: [], // User custom uploaded wallpapers collection [{ id, url, name, timestamp }]
    wallpaperFit: "cover", // "cover" | "contain" | "center"
    paletteId: "crystal_light", // Clean Nordic Light by default
    particleType: "none", // NO particle animation on top of wallpaper
    blurPx: 0,
    dimOpacity: 0, // 0 dimming for crisp 8K Ultra HD
    saturationPct: 100,
    brightnessPct: 100, // 50% - 150% brightness adjustment
    contrastPct: 100, // 70% - 150% contrast adjustment
    glassCard: true,
    themeMode: "system", // Follows browser/OS dark-light preference by default
    dynamicTimeShift: false, // Auto changes wallpaper based on dawn / day / sunset / night
    parallax3D: false, // Parallax mouse animation permanently disabled
  };

  const DEFAULT_PRO_SETTINGS = {
    isPro: true,
    planType: "lifetime_ultra",
    activeCompanion: "knight",
    soundpack: "synth",
    streakShields: 3,
    xpMultiplier: 1.5,
    focusSessionsCompleted: 14,
    focusSession: {
      duration: 25,
      remainingSeconds: 25 * 60,
      running: false,
      startedAt: null,
      intention: "",
    },
    wallpaperRotation: {
      enabled: false,
      cadence: "daily",
      lastRotatedAt: null,
    },
    themeSettings: DEFAULT_THEME_SETTINGS,
  };

  const MASCOT_CHARACTERS = PRO_COMPANIONS.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    desc: c.title,
    isPro: c.isPro,
  }));

  async function loadProSettings() {
    const s = await storageGet(KEYS.pro || "fl_pro_settings", DEFAULT_PRO_SETTINGS);
    const existingTheme = s && s.themeSettings ? s.themeSettings : {};
    let resolvedWp = existingTheme.wallpaperId || DEFAULT_THEME_SETTINGS.wallpaperId;
    // Migrate any legacy or removed wallpapers to instant 8K Ultra HD bundled asset
    const validWpIds = new Set(WALLPAPERS.map(w => w.id));
    if (!validWpIds.has(resolvedWp) && resolvedWp !== "custom" && resolvedWp !== "none") {
      resolvedWp = "dolomites_sunbeams_8k";
    }

    const sanitizedTheme = {
      ...DEFAULT_THEME_SETTINGS,
      ...existingTheme,
      wallpaperId: resolvedWp,
      customWallpaperUrl: existingTheme.customWallpaperUrl || "",
      customWallpapers: Array.isArray(existingTheme.customWallpapers) ? existingTheme.customWallpapers : [],
      wallpaperFit: ["cover", "contain", "center"].includes(existingTheme.wallpaperFit) ? existingTheme.wallpaperFit : "cover",
      particleType: "none",
      dimOpacity: typeof existingTheme.dimOpacity === "number" ? existingTheme.dimOpacity : DEFAULT_THEME_SETTINGS.dimOpacity,
      blurPx: typeof existingTheme.blurPx === "number" ? existingTheme.blurPx : DEFAULT_THEME_SETTINGS.blurPx,
      saturationPct: typeof existingTheme.saturationPct === "number" ? existingTheme.saturationPct : DEFAULT_THEME_SETTINGS.saturationPct,
      brightnessPct: typeof existingTheme.brightnessPct === "number" ? existingTheme.brightnessPct : 100,
      contrastPct: typeof existingTheme.contrastPct === "number" ? existingTheme.contrastPct : 100,
      dynamicTimeShift: typeof existingTheme.dynamicTimeShift === "boolean" ? existingTheme.dynamicTimeShift : DEFAULT_THEME_SETTINGS.dynamicTimeShift,
      parallax3D: false, // Permanently disabled mouse hover movement
      themeMode: ["dark", "light", "system"].includes(existingTheme.themeMode)
        ? existingTheme.themeMode
        : "system",
      paletteId: existingTheme.paletteId || DEFAULT_THEME_SETTINGS.paletteId,
    };
    const merged = {
      ...DEFAULT_PRO_SETTINGS,
      ...s,
      focusSession: { ...DEFAULT_PRO_SETTINGS.focusSession, ...(s && s.focusSession ? s.focusSession : {}) },
      wallpaperRotation: { ...DEFAULT_PRO_SETTINGS.wallpaperRotation, ...(s && s.wallpaperRotation ? s.wallpaperRotation : {}) },
      themeSettings: sanitizedTheme,
    };
    return merged;
  }

  function saveProSettings(pro) {
    return storageSet(KEYS.pro || "fl_pro_settings", pro);
  }

  const EXPORTS = {
    MASCOT_LEVELS, calculateXP, getMascotLevel,
    WALLPAPERS, THEME_PALETTES, PRO_COMPANIONS, DEFAULT_THEME_SETTINGS,
    DYNAMIC_TIMESHIFT_WALLPAPERS, getDynamicWallpaperForHour,
    DEFAULT_PRO_SETTINGS, MASCOT_CHARACTERS, loadProSettings, saveProSettings
  };

  Object.assign(FL, EXPORTS);
})(typeof window !== "undefined" ? window : globalThis);
