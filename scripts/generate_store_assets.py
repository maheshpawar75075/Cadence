#!/usr/bin/env python3
import os
import base64
import subprocess

ROOT_DIR = "/Users/maheshpawar/field-ledger-pro 3"
ASSETS_DIR = os.path.join(ROOT_DIR, "STORE_ASSETS")
os.makedirs(ASSETS_DIR, exist_ok=True)

def encode_b64(path):
    if not os.path.exists(path):
        return ""
    mime = "image/png" if path.endswith(".png") else "image/jpeg"
    with open(path, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode("utf-8")

wp_dan = encode_b64(os.path.join(ROOT_DIR, "Wallpaper", "dan-freeman-wAn4RfmXtxU-unsplash.jpg"))
wp_forest = encode_b64(os.path.join(ROOT_DIR, "Wallpaper", "anders-jilden-cYrMQA7a3Wc-unsplash.jpg"))
wp_stars = encode_b64(os.path.join(ROOT_DIR, "Wallpaper", "joshua-sortino-xZqr8WtYEJ0-unsplash.jpg"))
knight_idle = encode_b64(os.path.join(ROOT_DIR, "assets", "knight-idle.png"))
knight_cheer = encode_b64(os.path.join(ROOT_DIR, "assets", "knight-cheer.png"))

def build_icon_svg():
    # 512x512 vector icon for super-sampled master rendering
    return """<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="45%" stop-color="#1E1B4B"/>
      <stop offset="100%" stop-color="#31104B"/>
    </linearGradient>
    <linearGradient id="glowRing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="50%" stop-color="#A855F7"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#818CF8"/>
      <stop offset="100%" stop-color="#C084FC"/>
    </linearGradient>
    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Squircle Base with premium dark gradient -->
  <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#bgGrad)" stroke="#38BDF8" stroke-width="2.5" stroke-opacity="0.35" filter="url(#softShadow)"/>

  <!-- Ambient light orb behind icon -->
  <circle cx="256" cy="256" r="140" fill="#6366F1" opacity="0.25" filter="url(#neonGlow)"/>
  <circle cx="290" cy="220" r="100" fill="#EC4899" opacity="0.18" filter="url(#neonGlow)"/>

  <!-- Geometric Cadence "C" Emblem intertwined with Habit Cadence Pulse -->
  <g filter="url(#neonGlow)">
    <!-- Arc of C -->
    <path d="M 340 160 A 130 130 0 1 0 340 352" fill="none" stroke="url(#glowRing)" stroke-width="44" stroke-linecap="round"/>
    
    <!-- Heartbeat/Habit Velocity Pulse Wave crossing through -->
    <path d="M 170 256 L 220 256 L 250 195 L 290 315 L 325 256 L 375 256" fill="none" stroke="url(#accentGrad)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
    
    <!-- Peak achievement spark/star -->
    <circle cx="250" cy="195" r="14" fill="#FFFFFF"/>
    <circle cx="250" cy="195" r="26" fill="#38BDF8" opacity="0.5"/>
    <circle cx="375" cy="256" r="10" fill="#FFFFFF"/>
  </g>

  <!-- Glass specular rim highlight -->
  <path d="M 50 130 C 50 70 80 40 140 40 L 372 40 C 432 40 462 70 462 130" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-opacity="0.25"/>
</svg>"""

def build_screenshot_1_svg():
    # 1280x800 Main Workspace Showcase
    return f"""<svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="cardBlur">
      <feGaussianBlur stdDeviation="8" result="blur"/>
    </filter>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" stop-opacity="0.78"/>
      <stop offset="100%" stop-color="#1E1B4B" stop-opacity="0.84"/>
    </linearGradient>
    <linearGradient id="purpleAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="100%" stop-color="#A855F7"/>
    </linearGradient>
    <linearGradient id="greenAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <filter id="shadowHeavy" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="18" stdDeviation="28" flood-color="#000000" flood-opacity="0.75"/>
    </filter>
  </defs>

  <!-- 4K Nature Wallpaper Background -->
  <image href="{wp_dan}" x="0" y="0" width="1280" height="800" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1280" height="800" fill="#000000" opacity="0.32"/>

  <!-- TOP STATUS BAR -->
  <rect x="40" y="28" width="1200" height="60" rx="20" fill="url(#cardBg)" stroke="#FFFFFF" stroke-opacity="0.14" filter="url(#shadowHeavy)"/>
  
  <!-- Logo & Title -->
  <g transform="translate(64, 42)">
    <circle cx="16" cy="16" r="16" fill="url(#purpleAccent)"/>
    <text x="16" y="22" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle">C</text>
    <text x="44" y="22" font-family="-apple-system, system-ui, sans-serif" font-size="19" font-weight="800" fill="#FFFFFF" letter-spacing="0.5">CADENCE</text>
    <rect x="145" y="6" width="46" height="20" rx="6" fill="#6366F1" fill-opacity="0.3"/>
    <text x="168" y="20" font-family="-apple-system, system-ui, sans-serif" font-size="11" font-weight="700" fill="#818CF8" text-anchor="middle">PRO</text>
  </g>

  <!-- Time & Greeting -->
  <g transform="translate(640, 58)" text-anchor="middle">
    <text y="0" font-family="-apple-system, system-ui, sans-serif" font-size="28" font-weight="700" fill="#FFFFFF" letter-spacing="1">09:42 AM</text>
    <text y="20" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="500" fill="#94A3B8">Wednesday, Oct 25 • Deep Focus Mode</text>
  </g>

  <!-- Soundscape & Streak Badges -->
  <g transform="translate(1010, 42)">
    <rect x="0" y="0" width="112" height="32" rx="16" fill="#0F172A" stroke="#38BDF8" stroke-opacity="0.3" stroke-width="1"/>
    <circle cx="16" cy="16" r="6" fill="#38BDF8"/>
    <text x="30" y="21" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="600" fill="#E2E8F0">Rain &amp; Zen</text>

    <rect x="124" y="0" width="94" height="32" rx="16" fill="#0F172A" stroke="#F59E0B" stroke-opacity="0.4" stroke-width="1"/>
    <text x="136" y="21" font-size="14">🔥</text>
    <text x="156" y="21" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="700" fill="#FCD34D">14 Days</text>
  </g>

  <!-- MAIN DASHBOARD CONTENT AREA -->

  <!-- Left Column: DAILY HABITS (Width: 440) -->
  <g transform="translate(40, 114)" filter="url(#shadowHeavy)">
    <rect width="420" height="580" rx="24" fill="url(#cardBg)" stroke="#FFFFFF" stroke-opacity="0.12"/>
    
    <!-- Header -->
    <text x="28" y="44" font-family="-apple-system, system-ui, sans-serif" font-size="20" font-weight="800" fill="#FFFFFF">Daily Habits</text>
    <text x="28" y="68" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="500" fill="#94A3B8">4 of 5 Completed Today (80%)</text>
    
    <!-- Progress bar -->
    <rect x="28" y="86" width="364" height="8" rx="4" fill="#334155"/>
    <rect x="28" y="86" width="291" height="8" rx="4" fill="url(#greenAccent)"/>

    <!-- Habit 1: Meditation -->
    <g transform="translate(28, 118)">
      <rect width="364" height="68" rx="16" fill="#1E293B" fill-opacity="0.6" stroke="#10B981" stroke-width="1.5" stroke-opacity="0.4"/>
      <circle cx="34" cy="34" r="16" fill="#10B981"/>
      <path d="M 28 34 L 32 38 L 41 29" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="64" y="32" font-family="-apple-system, system-ui, sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">Morning Meditation</text>
      <text x="64" y="50" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="500" fill="#10B981">Completed • 20 mins</text>
      <text x="336" y="40" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="700" fill="#F59E0B">🔥 21d</text>
    </g>

    <!-- Habit 2: Deep Work Sprint -->
    <g transform="translate(28, 202)">
      <rect width="364" height="68" rx="16" fill="#1E293B" fill-opacity="0.6" stroke="#6366F1" stroke-width="1.5" stroke-opacity="0.4"/>
      <circle cx="34" cy="34" r="16" fill="#6366F1"/>
      <path d="M 28 34 L 32 38 L 41 29" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="64" y="32" font-family="-apple-system, system-ui, sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">Deep Work Session</text>
      <text x="64" y="50" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="500" fill="#818CF8">Completed • 90 mins</text>
      <text x="336" y="40" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="700" fill="#F59E0B">🔥 14d</text>
    </g>

    <!-- Habit 3: Read 25 Pages -->
    <g transform="translate(28, 286)">
      <rect width="364" height="68" rx="16" fill="#1E293B" fill-opacity="0.6" stroke="#10B981" stroke-width="1.5" stroke-opacity="0.4"/>
      <circle cx="34" cy="34" r="16" fill="#10B981"/>
      <path d="M 28 34 L 32 38 L 41 29" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="64" y="32" font-family="-apple-system, system-ui, sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">Read 25 Pages</text>
      <text x="64" y="50" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="500" fill="#10B981">Completed • Atomic Habits</text>
      <text x="336" y="40" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="700" fill="#F59E0B">🔥 9d</text>
    </g>

    <!-- Habit 4: Hydration Goal -->
    <g transform="translate(28, 370)">
      <rect width="364" height="68" rx="16" fill="#1E293B" fill-opacity="0.6" stroke="#10B981" stroke-width="1.5" stroke-opacity="0.4"/>
      <circle cx="34" cy="34" r="16" fill="#10B981"/>
      <path d="M 28 34 L 32 38 L 41 29" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="64" y="32" font-family="-apple-system, system-ui, sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">Daily Hydration 3L</text>
      <text x="64" y="50" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="500" fill="#10B981">Completed • 3.2L logged</text>
      <text x="336" y="40" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="700" fill="#F59E0B">🔥 18d</text>
    </g>

    <!-- Habit 5: Evening Reflection (Pending) -->
    <g transform="translate(28, 454)">
      <rect width="364" height="68" rx="16" fill="#1E293B" fill-opacity="0.3" stroke="#475569" stroke-width="1"/>
      <circle cx="34" cy="34" r="16" fill="none" stroke="#64748B" stroke-width="2"/>
      <text x="64" y="32" font-family="-apple-system, system-ui, sans-serif" font-size="15" font-weight="600" fill="#E2E8F0">Daily Journal &amp; Review</text>
      <text x="64" y="50" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="500" fill="#94A3B8">Scheduled for 09:00 PM</text>
      <text x="340" y="40" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="600" fill="#64748B">⏳</text>
    </g>
  </g>

  <!-- Center Column: FOCUS SPRINT & POMODORO (Width: 440) -->
  <g transform="translate(480, 114)" filter="url(#shadowHeavy)">
    <rect width="440" height="380" rx="24" fill="url(#cardBg)" stroke="#FFFFFF" stroke-opacity="0.12"/>
    
    <text x="32" y="44" font-family="-apple-system, system-ui, sans-serif" font-size="20" font-weight="800" fill="#FFFFFF">Focus Sprint Timer</text>
    <text x="32" y="68" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="500" fill="#94A3B8">Sprint 3 of 4 • Target: Deep Code Review</text>

    <!-- Radial Progress / Timer -->
    <g transform="translate(220, 200)">
      <circle cx="0" cy="0" r="95" fill="none" stroke="#334155" stroke-width="14"/>
      <circle cx="0" cy="0" r="95" fill="none" stroke="url(#purpleAccent)" stroke-width="14" stroke-dasharray="596" stroke-dashoffset="140" stroke-linecap="round" transform="rotate(-90)"/>
      <text y="-8" font-family="-apple-system, system-ui, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">18:42</text>
      <text y="24" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="700" fill="#818CF8" text-anchor="middle">SPRINTING</text>
    </g>

    <!-- Controls -->
    <g transform="translate(140, 316)">
      <rect x="0" y="0" width="70" height="38" rx="12" fill="#334155" fill-opacity="0.7"/>
      <text x="35" y="24" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="600" fill="#E2E8F0" text-anchor="middle">Reset</text>

      <rect x="86" y="0" width="74" height="38" rx="12" fill="url(#purpleAccent)"/>
      <text x="123" y="24" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="700" fill="#FFFFFF" text-anchor="middle">Pause</text>
    </g>
  </g>

  <!-- Focus Guard Card below Timer (Height: 180) -->
  <g transform="translate(480, 514)" filter="url(#shadowHeavy)">
    <rect width="440" height="180" rx="24" fill="url(#cardBg)" stroke="#10B981" stroke-opacity="0.3"/>
    <circle cx="48" cy="48" r="22" fill="#10B981" fill-opacity="0.2"/>
    <text x="48" y="56" font-size="20" text-anchor="middle">🛡️</text>
    
    <text x="86" y="44" font-family="-apple-system, system-ui, sans-serif" font-size="17" font-weight="800" fill="#FFFFFF">Focus Guard Active</text>
    <text x="86" y="64" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="600" fill="#34D399">18 Distracting Sites Blocked</text>

    <text x="32" y="100" font-family="-apple-system, system-ui, sans-serif" font-size="12.5" font-weight="500" fill="#CBD5E1">Automatically blocks social media &amp; distracting websites during sprints.</text>
    <text x="32" y="118" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="500" fill="#94A3B8">Redirects to your zen breathing screen to preserve deep work velocity.</text>
    
    <rect x="32" y="132" width="110" height="26" rx="8" fill="#1E293B"/>
    <text x="87" y="149" font-family="-apple-system, system-ui, sans-serif" font-size="11" font-weight="700" fill="#94A3B8" text-anchor="middle">youtube.com ✕</text>

    <rect x="150" y="132" width="105" height="26" rx="8" fill="#1E293B"/>
    <text x="202" y="149" font-family="-apple-system, system-ui, sans-serif" font-size="11" font-weight="700" fill="#94A3B8" text-anchor="middle">reddit.com ✕</text>

    <rect x="263" y="132" width="95" height="26" rx="8" fill="#1E293B"/>
    <text x="310" y="149" font-family="-apple-system, system-ui, sans-serif" font-size="11" font-weight="700" fill="#94A3B8" text-anchor="middle">x.com ✕</text>
  </g>

  <!-- Right Column: MASCOT COMPANION & SOUNDSCAPES (Width: 300) -->
  <g transform="translate(940, 114)" filter="url(#shadowHeavy)">
    <rect width="300" height="340" rx="24" fill="url(#cardBg)" stroke="#FFFFFF" stroke-opacity="0.12"/>
    
    <text x="24" y="40" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="800" fill="#FFFFFF">Mascot Companion</text>
    <text x="24" y="60" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="600" fill="#F59E0B">Sir Percival • Level 8</text>

    <!-- Mascot Graphic -->
    <g transform="translate(95, 80)">
      <circle cx="55" cy="65" r="60" fill="url(#purpleAccent)" opacity="0.2"/>
      <image href="{knight_cheer}" x="0" y="0" width="110" height="130" preserveAspectRatio="xMidYMid meet"/>
    </g>

    <!-- Mascot Level / XP -->
    <text x="24" y="248" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="600" fill="#E2E8F0">Level XP: 1,840 / 2,000</text>
    <rect x="24" y="260" width="252" height="8" rx="4" fill="#334155"/>
    <rect x="24" y="260" width="225" height="8" rx="4" fill="url(#goldAccent)"/>

    <text x="150" y="302" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-style="italic" fill="#38BDF8" text-anchor="middle">"You're unstoppable today, master!"</text>
  </g>

  <!-- Ambient Soundscapes Card (Height: 220) -->
  <g transform="translate(940, 474)" filter="url(#shadowHeavy)">
    <rect width="300" height="220" rx="24" fill="url(#cardBg)" stroke="#FFFFFF" stroke-opacity="0.12"/>
    
    <text x="24" y="38" font-family="-apple-system, system-ui, sans-serif" font-size="17" font-weight="800" fill="#FFFFFF">Ambient Audio</text>
    <text x="24" y="58" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="500" fill="#94A3B8">Spatial soundscapes for focus</text>

    <g transform="translate(24, 76)">
      <rect width="252" height="38" rx="10" fill="#6366F1" fill-opacity="0.25" stroke="#6366F1" stroke-width="1"/>
      <text x="14" y="24" font-size="14">🌧️</text>
      <text x="36" y="24" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">Rain on Cedar Roof</text>
      <text x="228" y="24" font-size="12" fill="#38BDF8">▶</text>
    </g>

    <g transform="translate(24, 122)">
      <rect width="252" height="38" rx="10" fill="#1E293B" fill-opacity="0.5"/>
      <text x="14" y="24" font-size="14">🔔</text>
      <text x="36" y="24" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="600" fill="#94A3B8">Tibetan Singing Bowl</text>
    </g>

    <g transform="translate(24, 168)">
      <rect width="252" height="38" rx="10" fill="#1E293B" fill-opacity="0.5"/>
      <text x="14" y="24" font-size="14">☕</text>
      <text x="36" y="24" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="600" fill="#94A3B8">Cozy Rainy Cafe</text>
    </g>
  </g>

  <!-- Bottom Brand Watermark -->
  <g transform="translate(640, 755)" text-anchor="middle">
    <text y="0" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="600" fill="#F8FAFC" opacity="0.85" letter-spacing="0.5">Cadence — Habit &amp; Performance Tracker • Built for Maximum Focus</text>
  </g>
</svg>"""

def build_promo_svg():
    # 440x280 Promo Banner Tile
    return f"""<svg width="440" height="280" viewBox="0 0 440 280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="promoBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F19"/>
      <stop offset="50%" stop-color="#1E1B4B"/>
      <stop offset="100%" stop-color="#31104B"/>
    </linearGradient>
    <linearGradient id="neonGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="50%" stop-color="#A855F7"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
    <filter id="pGlow">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background with dark glow -->
  <rect width="440" height="280" fill="url(#promoBg)"/>
  <circle cx="80" cy="70" r="110" fill="#6366F1" opacity="0.28" filter="url(#pGlow)"/>
  <circle cx="380" cy="220" r="100" fill="#EC4899" opacity="0.22" filter="url(#pGlow)"/>

  <!-- Logo Mark Left -->
  <g transform="translate(48, 64)" filter="url(#pGlow)">
    <rect width="76" height="76" rx="20" fill="#0F172A" stroke="#818CF8" stroke-width="2"/>
    <path d="M 52 28 A 20 20 0 1 0 52 56" fill="none" stroke="url(#neonGlowGrad)" stroke-width="8" stroke-linecap="round"/>
    <path d="M 28 42 L 36 42 L 42 32 L 48 50 L 54 42 L 60 42" fill="none" stroke="#38BDF8" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Text Header -->
  <g transform="translate(142, 88)">
    <text y="0" font-family="-apple-system, system-ui, sans-serif" font-size="30" font-weight="900" fill="#FFFFFF" letter-spacing="1">CADENCE</text>
    <text y="24" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="700" fill="#818CF8" letter-spacing="1.5">HABIT &amp; PERFORMANCE TRACKER</text>
  </g>

  <!-- Feature Pills -->
  <g transform="translate(36, 172)">
    <rect x="0" y="0" width="112" height="28" rx="14" fill="#1E293B" stroke="#6366F1" stroke-opacity="0.4"/>
    <text x="56" y="18" font-family="-apple-system, system-ui, sans-serif" font-size="11" font-weight="700" fill="#E0E7FF" text-anchor="middle">🎯 Habit Streaks</text>

    <rect x="122" y="0" width="118" height="28" rx="14" fill="#1E293B" stroke="#A855F7" stroke-opacity="0.4"/>
    <text x="181" y="18" font-family="-apple-system, system-ui, sans-serif" font-size="11" font-weight="700" fill="#F3E8FF" text-anchor="middle">⏱️ Focus Sprints</text>

    <rect x="250" y="0" width="118" height="28" rx="14" fill="#1E293B" stroke="#EC4899" stroke-opacity="0.4"/>
    <text x="309" y="18" font-family="-apple-system, system-ui, sans-serif" font-size="11" font-weight="700" fill="#FCE7F3" text-anchor="middle">🌧️ Soundscapes</text>
  </g>

  <!-- Bottom Bar -->
  <g transform="translate(36, 222)">
    <rect x="0" y="0" width="368" height="34" rx="10" fill="#6366F1" fill-opacity="0.25" stroke="#818CF8" stroke-width="1"/>
    <text x="184" y="22" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">✨ Transform Every New Tab Into Deep Focus</text>
  </g>
</svg>"""

def main():
    print("Generating Master High-Definition Graphic Assets...")
    
    # 1. Icon (Render at 512x512, then downsample to exact 128x128 for crisp antialiasing)
    icon_svg = os.path.join(ASSETS_DIR, "icon_master.svg")
    icon_512 = os.path.join(ASSETS_DIR, "icon_512.png")
    icon_128 = os.path.join(ASSETS_DIR, "1_Store_Icon_128x128.png")
    with open(icon_svg, "w") as f:
        f.write(build_icon_svg())
    subprocess.run(["sips", "-s", "format", "png", icon_svg, "--out", icon_512], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(["sips", "-z", "128", "128", icon_512, "--out", icon_128], check=True, stdout=subprocess.DEVNULL)
    print("✓ Created 1_Store_Icon_128x128.png (Crisp anti-aliased)")

    # 2. Main Screenshot (1280x800)
    screen_svg = os.path.join(ASSETS_DIR, "screenshot_master.svg")
    screen_png = os.path.join(ASSETS_DIR, "2_Screenshot_1280x800.png")
    with open(screen_svg, "w") as f:
        f.write(build_screenshot_1_svg())
    subprocess.run(["sips", "-s", "format", "png", screen_svg, "--out", screen_png], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(["sips", "-z", "800", "1280", screen_png, "--out", screen_png], check=True, stdout=subprocess.DEVNULL)
    print("✓ Created 2_Screenshot_1280x800.png (1280x800 HD)")

    # 3. Promo Tile (440x280)
    promo_svg = os.path.join(ASSETS_DIR, "promo_master.svg")
    promo_png = os.path.join(ASSETS_DIR, "3_Promo_Tile_440x280.png")
    with open(promo_svg, "w") as f:
        f.write(build_promo_svg())
    subprocess.run(["sips", "-s", "format", "png", promo_svg, "--out", promo_png], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(["sips", "-z", "280", "440", promo_png, "--out", promo_png], check=True, stdout=subprocess.DEVNULL)
    print("✓ Created 3_Promo_Tile_440x280.png (440x280 HD)")

    # Also sync into icons/ folder for extension packaging
    subprocess.run(["sips", "-z", "128", "128", icon_512, "--out", os.path.join(ROOT_DIR, "icons", "icon128.png")], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(["sips", "-z", "48", "48", icon_512, "--out", os.path.join(ROOT_DIR, "icons", "icon48.png")], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(["sips", "-z", "32", "32", icon_512, "--out", os.path.join(ROOT_DIR, "icons", "icon32.png")], check=True, stdout=subprocess.DEVNULL)
    subprocess.run(["sips", "-z", "16", "16", icon_512, "--out", os.path.join(ROOT_DIR, "icons", "icon16.png")], check=True, stdout=subprocess.DEVNULL)

    # Also sync into artifacts directory for instant inline review
    artifact_dir = "/Users/maheshpawar/.gemini/antigravity/brain/b4a655d0-1bf5-432a-adac-b5ca75545ecc"
    subprocess.run(["cp", icon_128, os.path.join(artifact_dir, "icon128.png")], check=True)
    subprocess.run(["cp", screen_png, os.path.join(artifact_dir, "cws_screenshot_1280x800.png")], check=True)
    subprocess.run(["cp", promo_png, os.path.join(artifact_dir, "cws_promo_440x280.png")], check=True)
    print("✓ Synced to artifacts directory.")

if __name__ == "__main__":
    main()
