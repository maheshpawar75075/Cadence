/* Instant Frame-0 Wallpaper & Theme Bootstrapper */
(function() {
  "use strict";
  try {
    var raw = localStorage.getItem("fl_pro_settings");
    var p = raw ? JSON.parse(raw) : null;
    var ts = p && p.themeSettings ? p.themeSettings : null;
    var wpId = (ts && ts.wallpaperId) ? ts.wallpaperId : "dolomites_sunbeams_8k";
    var customUrl = ts && ts.customWallpaperUrl ? ts.customWallpaperUrl : "";
    var wpMap = {
      "dolomites_sunbeams_8k": "Wallpaper/pexels-eberhardgross-12365962.jpg",
      "alpine_lake_panorama_12k": "Wallpaper/jerry-kavan-F2UvQ-iIqqA-unsplash.jpg",
      "golden_meadow_brook_12k": "Wallpaper/pexels-mattia-d-andrea-1351715572-25696415.jpg",
      "vestrahorn_twilight_6k": "Wallpaper/pexels-eberhardgross-20459771.jpg",
      "balos_lagoon_boat_8k": "Wallpaper/joshua-kettle-sKOBxEb6E-E-unsplash.jpg",
      "geiranger_fjord_6k": "Wallpaper/pexels-enrique72-6415692.jpg",
      "winnats_pass_sunrise_6k": "Wallpaper/grant-ritchie-x1w_Q78xNEY-unsplash.jpg",
      "yosemite_half_dome_6k": "Wallpaper/pexels-laczadesign-17140515.jpg",
      "yosemite_valley_vista_8k": "Wallpaper/pexels-stephen-leonardi-587681991-28610386.jpg",
      "yosemite_autumn_lake_4k": "Wallpaper/jeremy-bishop-d3fZSXlJ3Ok-unsplash.jpg",
      "na_pali_coast_6k": "Wallpaper/braden-jarvis-prSogOoFmkw-unsplash.jpg",
      "hawaiian_sunset_peaks_8k": "Wallpaper/pexels-jess-vide-5007767.jpg",
      "palm_infinity_reflection_8k": "Wallpaper/dan-freeman-wAn4RfmXtxU-unsplash.jpg",
      "white_sand_shoreline_4k": "Wallpaper/nattu-adnan-Ai2TRdvI6gM-unsplash.jpg",
      "keyhole_arch_sunset_8k": "Wallpaper/joshua-sortino-xZqr8WtYEJ0-unsplash.jpg",
      "cinque_terre_twilight": "Wallpaper/anders-jilden-cYrMQA7a3Wc-unsplash.jpg",
      "alpine_pass_trails": "Wallpaper/alexander-slattery-LI748t0BK8w-unsplash.jpg",
      "alaskan_ice_fjord_6k": "Wallpaper/john-cobb-IE_sifhay7o-unsplash.jpg",
      "alpine_sunburst_range_8k": "Wallpaper/pexels-jplenio-5735485.jpg",
      "zion_canyon_falls_6k": "Wallpaper/wil-stewart-pHANr-CpbYM-unsplash.jpg",
      "tatras_purple_dusk": "Wallpaper/stefan-stefancik--g7axSVst6Y-unsplash.jpg",
      "pinnacle_wanderer": "Wallpaper/urban-vintage-78A265wPiO4-unsplash.jpg",
      "autumn_mountain_valley_6k": "Wallpaper/pexels-ioannis-ioannidis-1565556-20054034.jpg",
      "cypress_mountain_ridge_6k": "Wallpaper/pexels-urtimud-89-76108288-9161906.jpg",
      "cloud_sea_summit_6k": "Wallpaper/pexels-trungnguyenphotog-5155161.jpg",
      "sunset_prairie_silhouettes_8k": "Wallpaper/pexels-imadclicks-16088698.jpg",
      "lavender_lake_twilight_6k": "Wallpaper/pexels-rinoadamo-35281884.jpg",
      "emerald_lake_canopy": "Wallpaper/andreas-gucklhorn-mawU2PoJWfU-unsplash.jpg",
      "midnight_foliage_6k": "Wallpaper/djordje-gajic-XpmBYWxDMdg-unsplash.jpg",
      "taiga_expedition_8k": "Wallpaper/mikhail-pushkarev-XrSWzMOfe-k-unsplash.jpg",
      "river_bend_wetlands_8k": "Wallpaper/pexels-john-callery-3749962-5620997.jpg",
      "solitary_meadow_oak_8k": "Wallpaper/pexels-damir-31447507.jpg",
      "poly_matrix_emerald_8k": "Wallpaper/logan-voss-mAlnGB7D6wU-unsplash.jpg",
      "wooden_labyrinth_8k": "Wallpaper/nigel-hoare-lKW9bwqGwTw-unsplash.jpg"
    };
    if (wpId !== "custom" && wpId !== "none" && !wpMap[wpId]) {
      wpId = "dolomites_sunbeams_8k";
    }
    var url = (wpId === "custom" && customUrl) ? customUrl : (wpMap[wpId] || "Wallpaper/pexels-eberhardgross-12365962.jpg");
    var mode = ts && ts.themeMode ? ts.themeMode : "system";
    var isDark = mode === "dark" || (mode === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    if (wpId === "none") {
      document.documentElement.style.setProperty("--boot-wallpaper", "none");
      document.documentElement.classList.add("no-boot-wallpaper");
    } else {
      document.documentElement.style.setProperty("--boot-wallpaper", "url('" + url + "')");
      document.documentElement.classList.remove("no-boot-wallpaper");
      var fit = ts && ts.wallpaperFit ? ts.wallpaperFit : "cover";
      document.documentElement.style.setProperty("--boot-wallpaper-fit", fit === "center" ? "auto" : fit);
    }
  } catch (e) {}
})();
