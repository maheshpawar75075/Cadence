#!/usr/bin/env python3
"""
Cadence Pro — Automated Product Video Generator
Generates a 1080p 60fps/30fps marketing product showcase video complete with:
- 7 cinematic scenes showcasing 4K new-tab, habit tracking, focus sprints,
  soundscapes, mascot companion, analytics, and SaaS pricing.
- Synthesized high-fidelity ambient soundtrack with zen singing bowl chimes.
- Seamless rendering using sips and ffmpeg.
"""

import os
import sys
import base64
import math
import struct
import wave
import subprocess
import shutil

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMP_DIR = os.path.join(ROOT_DIR, "dist", "video_build")
OUTPUT_VIDEO = os.path.join(ROOT_DIR, "cadence_product_video.mp4")

os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(os.path.join(ROOT_DIR, "dist"), exist_ok=True)

def encode_b64(rel_path):
    full_path = os.path.join(ROOT_DIR, rel_path)
    if not os.path.exists(full_path):
        print(f"Warning: File not found {full_path}")
        return ""
    mime = "image/png" if rel_path.endswith(".png") else "image/jpeg"
    with open(full_path, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode("utf-8")

print("Encoding project assets into base64...")
b64_icon = encode_b64("icons/icon128.png")
b64_knight_idle = encode_b64("assets/knight-idle.png")
b64_knight_cheer = encode_b64("assets/knight-cheer.png")
b64_wp_lake = encode_b64("Wallpaper/pexels-jess-vide-5007767.jpg")
b64_wp_forest = encode_b64("Wallpaper/anders-jilden-cYrMQA7a3Wc-unsplash.jpg")
b64_wp_wave = encode_b64("Wallpaper/jeremy-bishop-d3fZSXlJ3Ok-unsplash.jpg")
b64_wp_sunset = encode_b64("Wallpaper/wil-stewart-pHANr-CpbYM-unsplash.jpg")
b64_wp_stars = encode_b64("Wallpaper/joshua-sortino-xZqr8WtYEJ0-unsplash.jpg")

# Common SVG elements
FONT_FAMILY = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif"

def scene_1_svg():
    return f'''<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="s1_bg" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="45%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
    <linearGradient id="s1_card" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(99, 102, 241, 0.25)" />
      <stop offset="100%" stop-color="rgba(30, 27, 75, 0.4)" />
    </linearGradient>
    <linearGradient id="s1_title" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="60%" stop-color="#e0e7ff" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
  </defs>

  <rect width="1920" height="1080" fill="url(#s1_bg)" />

  <!-- Ambient light blobs -->
  <circle cx="960" cy="400" r="320" fill="#4338ca" opacity="0.25" filter="blur(60px)" />
  <circle cx="500" cy="650" r="260" fill="#06b6d4" opacity="0.12" filter="blur(80px)" />
  <circle cx="1420" cy="650" r="260" fill="#8b5cf6" opacity="0.15" filter="blur(80px)" />

  <!-- App Icon Card -->
  <rect x="870" y="240" width="180" height="180" rx="42" fill="url(#s1_card)" stroke="rgba(255,255,255,0.22)" stroke-width="2" />
  <image href="{b64_icon}" x="898" y="268" width="124" height="124" />

  <!-- Title & Subtitle -->
  <text x="960" y="500" font-family="{FONT_FAMILY}" font-size="76" font-weight="900" fill="url(#s1_title)" text-anchor="middle" letter-spacing="4">CADENCE</text>
  <text x="960" y="555" font-family="{FONT_FAMILY}" font-size="28" font-weight="600" fill="#94a3b8" text-anchor="middle" letter-spacing="3">HABIT &amp; PERFORMANCE TRACKER</text>

  <!-- Tagline Badge -->
  <rect x="620" y="615" width="680" height="54" rx="27" fill="rgba(99,102,241,0.18)" stroke="rgba(129,140,248,0.45)" stroke-width="1.5" />
  <text x="960" y="650" font-family="{FONT_FAMILY}" font-size="20" font-weight="600" fill="#c7d2fe" text-anchor="middle">✦ TRANSFORM EVERY NEW TAB INTO YOUR CALM WORKSPACE</text>

  <!-- Feature Pills Grid -->
  <g transform="translate(480, 725)">
    <rect x="0" y="0" width="180" height="42" rx="21" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" />
    <text x="90" y="27" font-family="{FONT_FAMILY}" font-size="16" font-weight="500" fill="#cbd5e1" text-anchor="middle">🏔️ 4K Wallpapers</text>

    <rect x="200" y="0" width="180" height="42" rx="21" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" />
    <text x="290" y="27" font-family="{FONT_FAMILY}" font-size="16" font-weight="500" fill="#cbd5e1" text-anchor="middle">🔥 Habit Streaks</text>

    <rect x="400" y="0" width="180" height="42" rx="21" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" />
    <text x="490" y="27" font-family="{FONT_FAMILY}" font-size="16" font-weight="500" fill="#cbd5e1" text-anchor="middle">⚡ Focus Sprints</text>

    <rect x="600" y="0" width="180" height="42" rx="21" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" />
    <text x="690" y="27" font-family="{FONT_FAMILY}" font-size="16" font-weight="500" fill="#cbd5e1" text-anchor="middle">🌧️ Soundscapes</text>

    <rect x="800" y="0" width="180" height="42" rx="21" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" />
    <text x="890" y="27" font-family="{FONT_FAMILY}" font-size="16" font-weight="500" fill="#cbd5e1" text-anchor="middle">🛡️ Focus Guard</text>
  </g>

  <text x="960" y="870" font-family="{FONT_FAMILY}" font-size="18" font-weight="500" fill="#64748b" text-anchor="middle">CHROME EXTENSION MANIFEST V3 • ZERO ADS • 100% PRIVATE</text>
</svg>'''

def scene_2_svg():
    return f'''<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="s2_overlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(10,15,30,0.55)" />
      <stop offset="40%" stop-color="rgba(10,15,30,0.25)" />
      <stop offset="100%" stop-color="rgba(5,10,20,0.75)" />
    </linearGradient>
    <linearGradient id="s2_card" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.14)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0.04)" />
    </linearGradient>
  </defs>

  <!-- 4K Wallpaper Backdrop -->
  <image href="{b64_wp_lake}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice" />
  <rect width="1920" height="1080" fill="url(#s2_overlay)" />

  <!-- Browser Header Mockup -->
  <rect x="260" y="60" width="1400" height="52" rx="14" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255,255,255,0.1)" />
  <circle cx="295" cy="86" r="6" fill="#ef4444" />
  <circle cx="315" cy="86" r="6" fill="#f59e0b" />
  <circle cx="335" cy="86" r="6" fill="#10b981" />
  <rect x="360" y="70" width="220" height="32" rx="8" fill="rgba(255,255,255,0.12)" />
  <image href="{b64_icon}" x="372" y="76" width="20" height="20" />
  <text x="402" y="92" font-family="{FONT_FAMILY}" font-size="14" font-weight="600" fill="#ffffff">Cadence — New Tab</text>
  
  <rect x="620" y="70" width="700" height="32" rx="8" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.08)" />
  <text x="970" y="91" font-family="{FONT_FAMILY}" font-size="13" fill="#94a3b8" text-anchor="middle">🔒 chrome://newtab • Cadence Pro Workspace</text>

  <!-- Center Stage: Hero Clock & Date -->
  <text x="960" y="320" font-family="{FONT_FAMILY}" font-size="124" font-weight="200" fill="#ffffff" text-anchor="middle" letter-spacing="-2">09:41</text>
  <text x="960" y="380" font-family="{FONT_FAMILY}" font-size="28" font-weight="500" fill="#e2e8f0" text-anchor="middle">Tuesday, October 13 • Deep Work Morning</text>

  <!-- Daily Focus Mantra Card -->
  <rect x="660" y="420" width="600" height="50" rx="25" fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.15)" />
  <text x="960" y="452" font-family="{FONT_FAMILY}" font-size="18" font-weight="500" fill="#a5f3fc" text-anchor="middle">“What you do every day matters more than what you do once in a while.”</text>

  <!-- Omnibox Search Bar with Quick Launch -->
  <rect x="560" y="510" width="800" height="64" rx="32" fill="rgba(15,23,42,0.75)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
  <text x="610" y="549" font-family="{FONT_FAMILY}" font-size="20" fill="#94a3b8">Search bookmarks, apps, or web...</text>
  <rect x="1220" y="524" width="110" height="36" rx="18" fill="rgba(99,102,241,0.3)" stroke="rgba(129,140,248,0.5)" />
  <text x="1275" y="547" font-family="{FONT_FAMILY}" font-size="14" font-weight="600" fill="#c7d2fe" text-anchor="middle">cd + Tab</text>

  <!-- Quick Shortcut Tiles -->
  <g transform="translate(680, 610)">
    <rect x="0" y="0" width="120" height="90" rx="18" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.12)" />
    <text x="60" y="45" font-size="28" text-anchor="middle">🐙</text>
    <text x="60" y="72" font-family="{FONT_FAMILY}" font-size="13" fill="#cbd5e1" text-anchor="middle">GitHub</text>

    <rect x="145" y="0" width="120" height="90" rx="18" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.12)" />
    <text x="205" y="45" font-size="28" text-anchor="middle">📝</text>
    <text x="205" y="72" font-family="{FONT_FAMILY}" font-size="13" fill="#cbd5e1" text-anchor="middle">Notion</text>

    <rect x="290" y="0" width="120" height="90" rx="18" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.12)" />
    <text x="350" y="45" font-size="28" text-anchor="middle">⚡</text>
    <text x="350" y="72" font-family="{FONT_FAMILY}" font-size="13" fill="#cbd5e1" text-anchor="middle">Linear</text>

    <rect x="435" y="0" width="120" height="90" rx="18" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.12)" />
    <text x="495" y="45" font-size="28" text-anchor="middle">📬</text>
    <text x="495" y="72" font-family="{FONT_FAMILY}" font-size="13" fill="#cbd5e1" text-anchor="middle">Gmail</text>
  </g>

  <!-- Bottom Mascot Widget Preview -->
  <rect x="1560" y="860" width="280" height="150" rx="24" fill="rgba(15,23,42,0.8)" stroke="rgba(255,255,255,0.15)" />
  <image href="{b64_knight_idle}" x="1580" y="880" width="100" height="100" />
  <text x="1700" y="920" font-family="{FONT_FAMILY}" font-size="18" font-weight="700" fill="#ffffff">Guardian Knight</text>
  <text x="1700" y="946" font-family="{FONT_FAMILY}" font-size="14" fill="#a5b4fc">Lvl 14 • 4,850 XP</text>
  <text x="1700" y="972" font-family="{FONT_FAMILY}" font-size="12" fill="#10b981">● Ready for Sprint</text>

  <!-- Bottom Showcase Label -->
  <rect x="360" y="970" width="1200" height="56" rx="28" fill="rgba(2,6,23,0.85)" stroke="rgba(99,102,241,0.5)" />
  <text x="960" y="1005" font-family="{FONT_FAMILY}" font-size="20" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="1">SCENE 1: 4K CURATED NATURE WALLPAPERS &amp; MINIMALIST HIGH-FOCUS NEW TAB</text>
</svg>'''

def scene_3_svg():
    return f'''<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="s3_overlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(15,23,42,0.7)" />
      <stop offset="100%" stop-color="rgba(2,6,23,0.88)" />
    </linearGradient>
    <linearGradient id="s3_bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
  </defs>

  <!-- Forest Background -->
  <image href="{b64_wp_forest}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice" />
  <rect width="1920" height="1080" fill="url(#s3_overlay)" />

  <!-- Section Title -->
  <text x="960" y="140" font-family="{FONT_FAMILY}" font-size="44" font-weight="800" fill="#ffffff" text-anchor="middle">HABIT &amp; ROUTINE TRACKING</text>
  <text x="960" y="185" font-family="{FONT_FAMILY}" font-size="20" font-weight="500" fill="#94a3b8" text-anchor="middle">Build compounding consistency with visual streaks, completion metrics &amp; XP</text>

  <!-- Main Card Container -->
  <rect x="360" y="230" width="1200" height="690" rx="28" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.16)" stroke-width="1.5" />

  <!-- Progress Bar Top -->
  <rect x="420" y="275" width="1080" height="14" rx="7" fill="rgba(255,255,255,0.1)" />
  <rect x="420" y="275" width="810" height="14" rx="7" fill="url(#s3_bar)" />
  <text x="420" y="325" font-family="{FONT_FAMILY}" font-size="20" font-weight="700" fill="#ffffff">Daily Progress: 3 of 4 Rituals Completed (75%)</text>
  <text x="1450" y="325" font-family="{FONT_FAMILY}" font-size="18" font-weight="700" fill="#10b981" text-anchor="end">+150 XP EARNED</text>

  <!-- Habit Item 1 -->
  <g transform="translate(420, 360)">
    <rect x="0" y="0" width="1080" height="95" rx="18" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.4)" stroke-width="1.5" />
    <circle cx="50" cy="47" r="22" fill="#10b981" />
    <path d="M42 47 L47 53 L58 41" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round" />
    <text x="95" y="42" font-family="{FONT_FAMILY}" font-size="22" font-weight="700" fill="#ffffff">Morning Deep Work Sprint (90 Min)</text>
    <text x="95" y="68" font-family="{FONT_FAMILY}" font-size="15" fill="#a7f3d0">Completed at 08:30 AM • No distractions</text>
    <rect x="910" y="28" width="140" height="40" rx="20" fill="rgba(249,115,22,0.2)" stroke="rgba(249,115,22,0.5)" />
    <text x="980" y="53" font-family="{FONT_FAMILY}" font-size="16" font-weight="700" fill="#fdba74" text-anchor="middle">🔥 28 DAYS</text>
  </g>

  <!-- Habit Item 2 -->
  <g transform="translate(420, 475)">
    <rect x="0" y="0" width="1080" height="95" rx="18" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.4)" stroke-width="1.5" />
    <circle cx="50" cy="47" r="22" fill="#10b981" />
    <path d="M42 47 L47 53 L58 41" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round" />
    <text x="95" y="42" font-family="{FONT_FAMILY}" font-size="22" font-weight="700" fill="#ffffff">Mindful Meditation &amp; Breathwork</text>
    <text x="95" y="68" font-family="{FONT_FAMILY}" font-size="15" fill="#a7f3d0">Completed at 07:15 AM • 15 minutes logged</text>
    <rect x="910" y="28" width="140" height="40" rx="20" fill="rgba(249,115,22,0.2)" stroke="rgba(249,115,22,0.5)" />
    <text x="980" y="53" font-family="{FONT_FAMILY}" font-size="16" font-weight="700" fill="#fdba74" text-anchor="middle">🔥 19 DAYS</text>
  </g>

  <!-- Habit Item 3 -->
  <g transform="translate(420, 590)">
    <rect x="0" y="0" width="1080" height="95" rx="18" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.4)" stroke-width="1.5" />
    <circle cx="50" cy="47" r="22" fill="#10b981" />
    <path d="M42 47 L47 53 L58 41" stroke="#ffffff" stroke-width="3.5" fill="none" stroke-linecap="round" />
    <text x="95" y="42" font-family="{FONT_FAMILY}" font-size="22" font-weight="700" fill="#ffffff">Review Pull Requests &amp; Architecture</text>
    <text x="95" y="68" font-family="{FONT_FAMILY}" font-size="15" fill="#a7f3d0">Completed at 10:45 AM • 4 reviews completed</text>
    <rect x="910" y="28" width="140" height="40" rx="20" fill="rgba(249,115,22,0.2)" stroke="rgba(249,115,22,0.5)" />
    <text x="980" y="53" font-family="{FONT_FAMILY}" font-size="16" font-weight="700" fill="#fdba74" text-anchor="middle">🔥 14 DAYS</text>
  </g>

  <!-- Habit Item 4 (Pending) -->
  <g transform="translate(420, 705)">
    <rect x="0" y="0" width="1080" height="95" rx="18" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" />
    <circle cx="50" cy="47" r="22" fill="none" stroke="#64748b" stroke-width="2.5" />
    <text x="95" y="42" font-family="{FONT_FAMILY}" font-size="22" font-weight="700" fill="#cbd5e1">10,000 Steps / Evening Walk</text>
    <text x="95" y="68" font-family="{FONT_FAMILY}" font-size="15" fill="#64748b">Scheduled for 06:30 PM • 6,420 / 10,000 steps</text>
    <rect x="910" y="28" width="140" height="40" rx="20" fill="rgba(100,116,139,0.2)" stroke="rgba(100,116,139,0.4)" />
    <text x="980" y="53" font-family="{FONT_FAMILY}" font-size="16" font-weight="700" fill="#94a3b8" text-anchor="middle">🔥 9 DAYS</text>
  </g>

  <!-- Streak Celebration Banner -->
  <rect x="520" y="825" width="880" height="56" rx="28" fill="rgba(234,88,12,0.18)" stroke="rgba(251,146,60,0.5)" />
  <text x="960" y="860" font-family="{FONT_FAMILY}" font-size="20" font-weight="700" fill="#fed7aa" text-anchor="middle">🏆 28-DAY STREAK UNLOCKED! You are in the top 3% of disciplined builders.</text>

  <!-- Bottom Showcase Label -->
  <rect x="360" y="970" width="1200" height="56" rx="28" fill="rgba(2,6,23,0.85)" stroke="rgba(16,185,129,0.5)" />
  <text x="960" y="1005" font-family="{FONT_FAMILY}" font-size="20" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="1">SCENE 2: EFFORTLESS HABIT LOGGING &amp; UNBREAKABLE STREAK MECHANICS</text>
</svg>'''

def scene_4_svg():
    return f'''<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="s4_overlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(15,23,42,0.75)" />
      <stop offset="100%" stop-color="rgba(2,6,23,0.92)" />
    </linearGradient>
    <linearGradient id="timer_ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#818cf8" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#4f46e5" />
    </linearGradient>
  </defs>

  <!-- Wave Wallpaper -->
  <image href="{b64_wp_wave}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice" />
  <rect width="1920" height="1080" fill="url(#s4_overlay)" />

  <!-- Section Title -->
  <text x="960" y="130" font-family="{FONT_FAMILY}" font-size="44" font-weight="800" fill="#ffffff" text-anchor="middle">FOCUS SPRINTS &amp; FOCUS GUARD</text>
  <text x="960" y="175" font-family="{FONT_FAMILY}" font-size="20" font-weight="500" fill="#94a3b8" text-anchor="middle">Enter unbreakable flow states with intelligent website blocking &amp; Pomodoro timers</text>

  <!-- Left: Pomodoro Sprint Dial -->
  <g transform="translate(240, 230)">
    <rect x="0" y="0" width="680" height="690" rx="28" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.16)" />
    
    <!-- Outer Timer Ring -->
    <circle cx="340" cy="300" r="180" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="18" />
    <circle cx="340" cy="300" r="180" fill="none" stroke="url(#timer_ring)" stroke-width="18" stroke-dasharray="1130" stroke-dashoffset="250" stroke-linecap="round" transform="rotate(-90 340 300)" />

    <!-- Timer Countdown Text -->
    <text x="340" y="290" font-family="{FONT_FAMILY}" font-size="76" font-weight="800" fill="#ffffff" text-anchor="middle">21:45</text>
    <text x="340" y="340" font-family="{FONT_FAMILY}" font-size="20" font-weight="600" fill="#a5b4fc" text-anchor="middle">SPRINT #3 (25:00 TARGET)</text>

    <!-- Sprint Badge -->
    <rect x="220" y="420" width="240" height="42" rx="21" fill="rgba(99,102,241,0.2)" stroke="rgba(99,102,241,0.5)" />
    <text x="340" y="447" font-family="{FONT_FAMILY}" font-size="16" font-weight="600" fill="#c7d2fe" text-anchor="middle">⚡ DEEP FLOW ACTIVE</text>

    <!-- Action Buttons -->
    <rect x="180" y="520" width="150" height="52" rx="26" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" />
    <text x="255" y="552" font-family="{FONT_FAMILY}" font-size="18" font-weight="600" fill="#ffffff" text-anchor="middle">⏸ Pause</text>

    <rect x="350" y="520" width="150" height="52" rx="26" fill="rgba(239,68,68,0.2)" stroke="rgba(239,68,68,0.5)" />
    <text x="425" y="552" font-family="{FONT_FAMILY}" font-size="18" font-weight="600" fill="#fca5a5" text-anchor="middle">⏹ End Early</text>

    <text x="340" y="630" font-family="{FONT_FAMILY}" font-size="16" fill="#94a3b8" text-anchor="middle">Daily Goal: 3 of 4 Sprints Completed (75m Total)</text>
  </g>

  <!-- Right: Focus Guard Website Blocker -->
  <g transform="translate(980, 230)">
    <rect x="0" y="0" width="700" height="690" rx="28" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.16)" />
    
    <!-- Shield Banner -->
    <rect x="50" y="50" width="600" height="90" rx="20" fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.4)" stroke-width="1.5" />
    <text x="100" y="105" font-size="36">🛡️</text>
    <text x="160" y="90" font-family="{FONT_FAMILY}" font-size="24" font-weight="800" fill="#ffffff">Focus Guard Active</text>
    <text x="160" y="118" font-family="{FONT_FAMILY}" font-size="15" fill="#fca5a5">Tab redirects to calm zen screen during sprints</text>

    <!-- Blocked Sites List -->
    <text x="50" y="195" font-family="{FONT_FAMILY}" font-size="20" font-weight="700" fill="#e2e8f0">Blocked Domains in Sprint Mode:</text>

    <g transform="translate(50, 220)">
      <rect x="0" y="0" width="600" height="60" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" />
      <text x="25" y="37" font-size="20">⛔</text>
      <text x="65" y="36" font-family="{FONT_FAMILY}" font-size="18" font-weight="600" fill="#ffffff">youtube.com</text>
      <text x="540" y="36" font-family="{FONT_FAMILY}" font-size="14" font-weight="600" fill="#ef4444" text-anchor="end">REDIRECTED</text>
    </g>

    <g transform="translate(50, 295)">
      <rect x="0" y="0" width="600" height="60" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" />
      <text x="25" y="37" font-size="20">⛔</text>
      <text x="65" y="36" font-family="{FONT_FAMILY}" font-size="18" font-weight="600" fill="#ffffff">x.com / twitter.com</text>
      <text x="540" y="36" font-family="{FONT_FAMILY}" font-size="14" font-weight="600" fill="#ef4444" text-anchor="end">REDIRECTED</text>
    </g>

    <g transform="translate(50, 370)">
      <rect x="0" y="0" width="600" height="60" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" />
      <text x="25" y="37" font-size="20">⛔</text>
      <text x="65" y="36" font-family="{FONT_FAMILY}" font-size="18" font-weight="600" fill="#ffffff">reddit.com</text>
      <text x="540" y="36" font-family="{FONT_FAMILY}" font-size="14" font-weight="600" fill="#ef4444" text-anchor="end">REDIRECTED</text>
    </g>

    <g transform="translate(50, 445)">
      <rect x="0" y="0" width="600" height="60" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" />
      <text x="25" y="37" font-size="20">⛔</text>
      <text x="65" y="36" font-family="{FONT_FAMILY}" font-size="18" font-weight="600" fill="#ffffff">instagram.com</text>
      <text x="540" y="36" font-family="{FONT_FAMILY}" font-size="14" font-weight="600" fill="#ef4444" text-anchor="end">REDIRECTED</text>
    </g>

    <!-- Zen screen preview -->
    <rect x="50" y="535" width="600" height="105" rx="18" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.3)" />
    <text x="80" y="575" font-family="{FONT_FAMILY}" font-size="18" font-weight="700" fill="#ffffff">🧘 Zen Redirection Screen Active</text>
    <text x="80" y="605" font-family="{FONT_FAMILY}" font-size="15" fill="#a5b4fc">“Take a deep breath. Your sprint finishes in 21 minutes.”</text>
  </g>

  <!-- Bottom Showcase Label -->
  <rect x="360" y="970" width="1200" height="56" rx="28" fill="rgba(2,6,23,0.85)" stroke="rgba(99,102,241,0.5)" />
  <text x="960" y="1005" font-family="{FONT_FAMILY}" font-size="20" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="1">SCENE 3: POMODORO FOCUS SPRINTS &amp; FOCUS GUARD DISTRACTION SHIELD</text>
</svg>'''

def scene_5_svg():
    return f'''<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="s5_overlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(15,23,42,0.75)" />
      <stop offset="100%" stop-color="rgba(2,6,23,0.9)" />
    </linearGradient>
  </defs>

  <!-- Sunset Wallpaper -->
  <image href="{b64_wp_sunset}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice" />
  <rect width="1920" height="1080" fill="url(#s5_overlay)" />

  <!-- Title -->
  <text x="960" y="130" font-family="{FONT_FAMILY}" font-size="44" font-weight="800" fill="#ffffff" text-anchor="middle">SOUNDSCAPES &amp; COMPANION MASCOT</text>
  <text x="960" y="175" font-family="{FONT_FAMILY}" font-size="20" font-weight="500" fill="#94a3b8" text-anchor="middle">Immerse yourself in acoustic calm while your digital companion gains XP</text>

  <!-- Left: Ambient Soundscapes Player -->
  <g transform="translate(240, 230)">
    <rect x="0" y="0" width="690" height="690" rx="28" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.16)" />
    
    <text x="50" y="65" font-family="{FONT_FAMILY}" font-size="26" font-weight="800" fill="#ffffff">🎧 Ambient Soundscapes</text>
    <text x="50" y="98" font-family="{FONT_FAMILY}" font-size="16" fill="#94a3b8">Multi-track layerable nature audio</text>

    <!-- Track 1: Rain -->
    <g transform="translate(50, 130)">
      <rect x="0" y="0" width="590" height="85" rx="16" fill="rgba(99,102,241,0.18)" stroke="rgba(99,102,241,0.5)" stroke-width="1.5" />
      <text x="25" y="52" font-size="28">🌧️</text>
      <text x="75" y="42" font-family="{FONT_FAMILY}" font-size="20" font-weight="700" fill="#ffffff">Summer Rain on Leaves</text>
      <text x="75" y="65" font-family="{FONT_FAMILY}" font-size="14" fill="#a5b4fc">Active • Volume: 70%</text>
      <!-- Volume Slider -->
      <rect x="360" y="38" width="180" height="10" rx="5" fill="rgba(255,255,255,0.15)" />
      <rect x="360" y="38" width="126" height="10" rx="5" fill="#6366f1" />
      <circle cx="486" cy="43" r="8" fill="#ffffff" />
    </g>

    <!-- Track 2: Zen Singing Bowl -->
    <g transform="translate(50, 235)">
      <rect x="0" y="0" width="590" height="85" rx="16" fill="rgba(16,185,129,0.18)" stroke="rgba(16,185,129,0.5)" stroke-width="1.5" />
      <text x="25" y="52" font-size="28">🥣</text>
      <text x="75" y="42" font-family="{FONT_FAMILY}" font-size="20" font-weight="700" fill="#ffffff">Tibetan Singing Bowl (432 Hz)</text>
      <text x="75" y="65" font-family="{FONT_FAMILY}" font-size="14" fill="#6ee7b7">Active • Volume: 45%</text>
      <!-- Volume Slider -->
      <rect x="360" y="38" width="180" height="10" rx="5" fill="rgba(255,255,255,0.15)" />
      <rect x="360" y="38" width="81" height="10" rx="5" fill="#10b981" />
      <circle cx="441" cy="43" r="8" fill="#ffffff" />
    </g>

    <!-- Track 3: Deep Forest -->
    <g transform="translate(50, 340)">
      <rect x="0" y="0" width="590" height="85" rx="16" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" />
      <text x="25" y="52" font-size="28">🌲</text>
      <text x="75" y="42" font-family="{FONT_FAMILY}" font-size="20" font-weight="700" fill="#cbd5e1">Evergreen Forest Ambience</text>
      <text x="75" y="65" font-family="{FONT_FAMILY}" font-size="14" fill="#64748b">Paused • Click to mix</text>
      <text x="500" y="52" font-family="{FONT_FAMILY}" font-size="16" font-weight="600" fill="#94a3b8">PLAY ▶</text>
    </g>

    <!-- Track 4: Cafe -->
    <g transform="translate(50, 445)">
      <rect x="0" y="0" width="590" height="85" rx="16" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" />
      <text x="25" y="52" font-size="28">☕</text>
      <text x="75" y="42" font-family="{FONT_FAMILY}" font-size="20" font-weight="700" fill="#cbd5e1">Midnight Coffee Shop</text>
      <text x="75" y="65" font-family="{FONT_FAMILY}" font-size="14" fill="#64748b">Paused • Click to mix</text>
      <text x="500" y="52" font-family="{FONT_FAMILY}" font-size="16" font-weight="600" fill="#94a3b8">PLAY ▶</text>
    </g>

    <!-- Sound Note -->
    <rect x="50" y="560" width="590" height="80" rx="16" fill="rgba(0,0,0,0.3)" />
    <text x="80" y="605" font-family="{FONT_FAMILY}" font-size="16" fill="#cbd5e1">💡 Fully offline audio. Zero streaming buffering. Runs in background.</text>
  </g>

  <!-- Right: Companion Mascot Evolution -->
  <g transform="translate(990, 230)">
    <rect x="0" y="0" width="690" height="690" rx="28" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.16)" />
    
    <text x="50" y="65" font-family="{FONT_FAMILY}" font-size="26" font-weight="800" fill="#ffffff">⚔️ Evolving Companion Mascot</text>
    <text x="50" y="98" font-family="{FONT_FAMILY}" font-size="16" fill="#94a3b8">Gains XP with every completed habit &amp; sprint</text>

    <!-- Mascot Spotlight Card -->
    <rect x="50" y="130" width="590" height="340" rx="24" fill="rgba(99,102,241,0.12)" stroke="rgba(129,140,248,0.3)" />
    
    <!-- Mascot Image Large -->
    <image href="{b64_knight_cheer}" x="220" y="150" width="250" height="250" />

    <!-- Mascot Name & Title -->
    <text x="345" y="430" font-family="{FONT_FAMILY}" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle">VALORIAN — LEVEL 14 PALADIN</text>

    <!-- XP Bar -->
    <g transform="translate(50, 495)">
      <rect x="0" y="0" width="590" height="18" rx="9" fill="rgba(255,255,255,0.1)" />
      <rect x="0" y="0" width="530" height="18" rx="9" fill="#f59e0b" />
      <text x="0" y="45" font-family="{FONT_FAMILY}" font-size="18" font-weight="700" fill="#ffffff">XP Progress: 4,850 / 5,000</text>
      <text x="590" y="45" font-family="{FONT_FAMILY}" font-size="18" font-weight="700" fill="#f59e0b" text-anchor="end">150 XP TO LEVEL 15</text>
    </g>

    <!-- Speech bubble -->
    <rect x="50" y="570" width="590" height="85" rx="18" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.4)" />
    <text x="80" y="608" font-family="{FONT_FAMILY}" font-size="18" font-weight="700" fill="#fef3c7">“Splendid focus, Warrior! Another habit checked off!”</text>
    <text x="80" y="635" font-family="{FONT_FAMILY}" font-size="14" fill="#fde68a">New armor unlocked upon reaching Level 15</text>
  </g>

  <!-- Bottom Showcase Label -->
  <rect x="360" y="970" width="1200" height="56" rx="28" fill="rgba(2,6,23,0.85)" stroke="rgba(245,158,11,0.5)" />
  <text x="960" y="1005" font-family="{FONT_FAMILY}" font-size="20" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="1">SCENE 4: AMBIENT SOUNDSCAPES &amp; GAMIFIED MASCOT COMPANION</text>
</svg>'''

def scene_6_svg():
    return f'''<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="s6_overlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(15,23,42,0.8)" />
      <stop offset="100%" stop-color="rgba(2,6,23,0.94)" />
    </linearGradient>
  </defs>

  <!-- Stars Wallpaper -->
  <image href="{b64_wp_stars}" x="0" y="0" width="1920" height="1080" preserveAspectRatio="xMidYMid slice" />
  <rect width="1920" height="1080" fill="url(#s6_overlay)" />

  <!-- Section Title -->
  <text x="960" y="130" font-family="{FONT_FAMILY}" font-size="44" font-weight="800" fill="#ffffff" text-anchor="middle">ANALYTICS, HEATMAPS &amp; WEEKLY REPORTS</text>
  <text x="960" y="175" font-family="{FONT_FAMILY}" font-size="20" font-weight="500" fill="#94a3b8" text-anchor="middle">Deep visibility into your consistency, deep work volume, and habit mastery</text>

  <!-- Main Analytics Board -->
  <g transform="translate(260, 230)">
    <rect x="0" y="0" width="1400" height="690" rx="28" fill="rgba(15,23,42,0.88)" stroke="rgba(255,255,255,0.16)" />
    
    <!-- 3 High Level KPI Cards -->
    <g transform="translate(50, 45)">
      <!-- KPI 1 -->
      <rect x="0" y="0" width="400" height="150" rx="20" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.35)" />
      <text x="35" y="50" font-family="{FONT_FAMILY}" font-size="16" font-weight="600" fill="#a5b4fc">HABIT COMPLETION RATE</text>
      <text x="35" y="105" font-family="{FONT_FAMILY}" font-size="52" font-weight="900" fill="#ffffff">94.2%</text>
      <text x="35" y="132" font-family="{FONT_FAMILY}" font-size="14" font-weight="600" fill="#10b981">▲ +8.4% vs previous 30 days</text>

      <!-- KPI 2 -->
      <rect x="450" y="0" width="400" height="150" rx="20" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.35)" />
      <text x="485" y="50" font-family="{FONT_FAMILY}" font-size="16" font-weight="600" fill="#a7f3d0">TOTAL FOCUS HOURS</text>
      <text x="485" y="105" font-family="{FONT_FAMILY}" font-size="52" font-weight="900" fill="#ffffff">34.5 hrs</text>
      <text x="485" y="132" font-family="{FONT_FAMILY}" font-size="14" font-weight="600" fill="#10b981">▲ 4.9 hrs daily average</text>

      <!-- KPI 3 -->
      <rect x="900" y="0" width="400" height="150" rx="20" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.35)" />
      <text x="935" y="50" font-family="{FONT_FAMILY}" font-size="16" font-weight="600" fill="#fde68a">BEST CURRENT STREAK</text>
      <text x="935" y="105" font-family="{FONT_FAMILY}" font-size="52" font-weight="900" fill="#ffffff">28 Days</text>
      <text x="935" y="132" font-family="{FONT_FAMILY}" font-size="14" font-weight="600" fill="#f59e0b">★ Iron Discipline Badge</text>
    </g>

    <!-- Consistency Heatmap Grid (30 Days GitHub style) -->
    <g transform="translate(50, 235)">
      <text x="0" y="30" font-family="{FONT_FAMILY}" font-size="22" font-weight="800" fill="#ffffff">Daily Habit Consistency Heatmap (Last 30 Days)</text>
      
      <!-- Heatmap rows -->
      <g transform="translate(0, 55)">
        ''' + "".join([
            f'<rect x="{i*42}" y="0" width="34" height="34" rx="8" fill="{("#10b981" if (i%7!=0 and i%5!=0) else ("#059669" if i%5==0 else "#047857" if i%3==0 else "#064e3b"))}" />'
            for i in range(30)
        ]) + '''
      </g>
      <text x="0" y="120" font-family="{FONT_FAMILY}" font-size="14" fill="#94a3b8">Less</text>
      <rect x="40" y="108" width="16" height="16" rx="4" fill="#064e3b" />
      <rect x="62" y="108" width="16" height="16" rx="4" fill="#047857" />
      <rect x="84" y="108" width="16" height="16" rx="4" fill="#059669" />
      <rect x="106" y="108" width="16" height="16" rx="4" fill="#10b981" />
      <text x="135" y="120" font-family="{FONT_FAMILY}" font-size="14" fill="#94a3b8">More (100% Habit Completion)</text>
    </g>

    <!-- Bottom Actions: Export Weekly PDF & AI Coach Recap -->
    <g transform="translate(50, 435)">
      <rect x="0" y="0" width="1300" height="180" rx="20" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" />
      
      <text x="40" y="55" font-family="{FONT_FAMILY}" font-size="22" font-weight="700" fill="#ffffff">🤖 Cadence AI Coach Performance Summary</text>
      <text x="40" y="90" font-family="{FONT_FAMILY}" font-size="16" fill="#cbd5e1">“Your highest focus window occurs between 8:30 AM and 11:30 AM with 98% sprint adherence.</text>
      <text x="40" y="115" font-family="{FONT_FAMILY}" font-size="16" fill="#cbd5e1">Maintaining your current rhythm will hit your 30-Day streak milestone this Friday.”</text>

      <!-- Export Button -->
      <rect x="940" y="55" width="320" height="60" rx="30" fill="#6366f1" />
      <text x="1100" y="92" font-family="{FONT_FAMILY}" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">📄 Export Weekly PDF Report</text>
    </g>
  </g>

  <!-- Bottom Showcase Label -->
  <rect x="360" y="970" width="1200" height="56" rx="28" fill="rgba(2,6,23,0.85)" stroke="rgba(16,185,129,0.5)" />
  <text x="960" y="1005" font-family="{FONT_FAMILY}" font-size="20" font-weight="700" fill="#ffffff" text-anchor="middle" letter-spacing="1">SCENE 5: RICH PERFORMANCE ANALYTICS, HEATMAPS &amp; 1-CLICK EXPORTS</text>
</svg>'''

def scene_7_svg():
    return f'''<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="s7_bg" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
    <linearGradient id="s7_gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>

  <rect width="1920" height="1080" fill="url(#s7_bg)" />

  <!-- Ambient light blobs -->
  <circle cx="960" cy="200" r="300" fill="#4f46e5" opacity="0.25" filter="blur(60px)" />
  <circle cx="500" cy="600" r="250" fill="#10b981" opacity="0.12" filter="blur(70px)" />
  <circle cx="1420" cy="600" r="250" fill="#f59e0b" opacity="0.15" filter="blur(70px)" />

  <!-- Logo & Title -->
  <image href="{b64_icon}" x="910" y="80" width="100" height="100" />
  <text x="960" y="225" font-family="{FONT_FAMILY}" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">INVEST IN YOUR DAILY CONSISTENCY</text>
  <text x="960" y="265" font-family="{FONT_FAMILY}" font-size="22" font-weight="500" fill="#94a3b8" text-anchor="middle">100% Paid Subscription SaaS • No Ads • No Distractions • Uncapped Productivity</text>

  <!-- Pricing Cards Container -->
  <g transform="translate(410, 315)">
    <!-- Monthly Plan Card -->
    <rect x="0" y="0" width="520" height="520" rx="28" fill="rgba(15,23,42,0.85)" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" />
    
    <text x="60" y="70" font-family="{FONT_FAMILY}" font-size="28" font-weight="800" fill="#ffffff">Monthly Plan</text>
    <text x="60" y="105" font-family="{FONT_FAMILY}" font-size="16" fill="#94a3b8">Billed monthly • Cancel anytime</text>

    <!-- Price -->
    <text x="60" y="190" font-family="{FONT_FAMILY}" font-size="64" font-weight="900" fill="#ffffff">₹69</text>
    <text x="180" y="190" font-family="{FONT_FAMILY}" font-size="24" fill="#94a3b8">/ month</text>

    <!-- Features -->
    <g transform="translate(60, 240)">
      <text x="0" y="0" font-family="{FONT_FAMILY}" font-size="18" fill="#e2e8f0">✓ Full Access to All Habit Trackers</text>
      <text x="0" y="40" font-family="{FONT_FAMILY}" font-size="18" fill="#e2e8f0">✓ Unlimited Focus Sprints &amp; Focus Guard</text>
      <text x="0" y="80" font-family="{FONT_FAMILY}" font-size="18" fill="#e2e8f0">✓ 4K Nature Wallpapers &amp; Soundscapes</text>
      <text x="0" y="120" font-family="{FONT_FAMILY}" font-size="18" fill="#e2e8f0">✓ Interactive Companion Mascot &amp; XP</text>
      <text x="0" y="160" font-family="{FONT_FAMILY}" font-size="18" fill="#e2e8f0">✓ 1-Click Weekly Executive Reports</text>
    </g>

    <!-- CTA Button -->
    <rect x="60" y="440" width="400" height="52" rx="26" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" />
    <text x="260" y="473" font-family="{FONT_FAMILY}" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">Get Monthly Plan</text>

    <!-- Yearly Plan Card (Highlighted) -->
    <g transform="translate(580, 0)">
      <rect x="0" y="0" width="520" height="520" rx="28" fill="rgba(30,27,75,0.85)" stroke="rgba(245,158,11,0.6)" stroke-width="2.5" />
      
      <!-- Best Value Ribbon -->
      <rect x="280" y="25" width="200" height="36" rx="18" fill="url(#s7_gold)" />
      <text x="380" y="49" font-family="{FONT_FAMILY}" font-size="14" font-weight="800" fill="#000000" text-anchor="middle">★ BEST VALUE — SAVE ₹29</text>

      <text x="60" y="70" font-family="{FONT_FAMILY}" font-size="28" font-weight="800" fill="#ffffff">Yearly Plan</text>
      <text x="60" y="105" font-family="{FONT_FAMILY}" font-size="16" fill="#a5b4fc">Billed annually • ₹66/mo equivalent</text>

      <!-- Price -->
      <text x="60" y="190" font-family="{FONT_FAMILY}" font-size="64" font-weight="900" fill="#fbbf24">₹799</text>
      <text x="210" y="190" font-family="{FONT_FAMILY}" font-size="24" fill="#cbd5e1">/ year</text>

      <!-- Features -->
      <g transform="translate(60, 240)">
        <text x="0" y="0" font-family="{FONT_FAMILY}" font-size="18" fill="#e2e8f0">✓ Everything in Monthly Plan</text>
        <text x="0" y="40" font-family="{FONT_FAMILY}" font-size="18" fill="#e2e8f0">✓ 365 Days of Guaranteed Habit Discipline</text>
        <text x="0" y="80" font-family="{FONT_FAMILY}" font-size="18" fill="#e2e8f0">✓ Priority Feature Access &amp; Support</text>
        <text x="0" y="120" font-family="{FONT_FAMILY}" font-size="18" fill="#e2e8f0">✓ Complete Historical Analytics Storage</text>
        <text x="0" y="160" font-family="{FONT_FAMILY}" font-size="18" font-weight="700" fill="#fbbf24">★ Best ROI for High Performers</text>
      </g>

      <!-- CTA Button -->
      <rect x="60" y="440" width="400" height="52" rx="26" fill="url(#s7_gold)" />
      <text x="260" y="473" font-family="{FONT_FAMILY}" font-size="18" font-weight="800" fill="#000000" text-anchor="middle">Start 1-Year Journey</text>
    </g>
  </g>

  <!-- Final Call to Action Footer -->
  <g transform="translate(460, 875)">
    <rect x="0" y="0" width="1000" height="85" rx="42" fill="rgba(15,23,42,0.9)" stroke="rgba(99,102,241,0.5)" stroke-width="2" />
    <text x="500" y="42" font-family="{FONT_FAMILY}" font-size="24" font-weight="800" fill="#ffffff" text-anchor="middle">AVAILABLE ON THE CHROME WEB STORE</text>
    <text x="500" y="68" font-family="{FONT_FAMILY}" font-size="16" font-weight="600" fill="#818cf8" text-anchor="middle">Visit cadencepro.app • Powered by Razorpay &amp; Stripe • Secure PCI-DSS Level 1</text>
  </g>

  <text x="960" y="1010" font-family="{FONT_FAMILY}" font-size="16" fill="#64748b" text-anchor="middle">CADENCE PRO © 2026 • BUILT FOR HIGH-LEVERAGE ACHIEVERS</text>
</svg>'''

def generate_ambient_soundtrack(duration_secs=38.5, output_wav=os.path.join(TEMP_DIR, "soundtrack.wav")):
    print(f"Synthesizing high-fidelity ambient soundtrack ({duration_secs}s)...")
    sample_rate = 44100
    num_samples = int(sample_rate * duration_secs)

    # Chord progression: EbMaj9 -> Cm9 -> AbMaj9 -> Bb9
    # Root frequencies: Eb3(155.56), C3(130.81), Ab2(103.83), Bb2(116.54)
    chords = [
        # EbMaj9: Eb3(155.56), G3(196.00), Bb3(233.08), D4(293.66), F4(349.23)
        [155.56, 196.00, 233.08, 293.66, 349.23],
        # Cm9: C3(130.81), Eb3(155.56), G3(196.00), Bb3(233.08), D4(293.66)
        [130.81, 155.56, 196.00, 233.08, 293.66],
        # AbMaj9: Ab2(103.83), C3(130.81), Eb3(155.56), G3(196.00), Bb3(233.08)
        [103.83, 130.81, 155.56, 196.00, 233.08],
        # Bb9: Bb2(116.54), D3(146.83), F3(174.61), Ab3(207.65), C4(261.63)
        [116.54, 146.83, 174.61, 207.65, 261.63],
    ]
    chord_duration = 5.5  # matches scene duration ~5.5s

    # Scene transition chime timestamps (seconds)
    chime_times = [0.1, 5.5, 11.0, 16.5, 22.0, 27.5, 33.0]

    with wave.open(output_wav, 'w') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)

        # Pre-calculate audio buffer in chunks
        chunk_size = 4096
        samples_written = 0

        while samples_written < num_samples:
            current_chunk = min(chunk_size, num_samples - samples_written)
            raw_bytes = bytearray(current_chunk * 4)

            for c in range(current_chunk):
                idx = samples_written + c
                t = idx / sample_rate

                # Determine active chord
                chord_idx = int((t / chord_duration) % len(chords))
                chord_notes = chords[chord_idx]

                # Soft envelope fade-in (1s) and fade-out (2s)
                fade = 1.0
                if t < 1.0:
                    fade = t
                elif t > (duration_secs - 2.0):
                    fade = max(0.0, (duration_secs - t) / 2.0)

                # Ambient Pad Synthesizer (sum of soft sines with detuning)
                pad_l = 0.0
                pad_r = 0.0
                for n_i, freq in enumerate(chord_notes):
                    amp = (0.05 / (n_i + 1)) * fade
                    # Stereo detuning
                    pad_l += amp * math.sin(2 * math.pi * (freq * 0.998) * t)
                    pad_r += amp * math.sin(2 * math.pi * (freq * 1.002) * t)

                # Warm sub-bass (fundamental)
                bass_freq = chord_notes[0] / 2.0
                bass = 0.08 * math.sin(2 * math.pi * bass_freq * t) * fade
                pad_l += bass
                pad_r += bass

                # Zen Singing Bowl / Crystal Chimes at scene changes
                chime_l = 0.0
                chime_r = 0.0
                for ct in chime_times:
                    dt = t - ct
                    if 0.0 <= dt < 4.0:
                        decay = math.exp(-1.4 * dt)
                        # 432 Hz harmonics + high shimmer
                        chime_l += 0.09 * decay * (
                            math.sin(2 * math.pi * 864 * dt) +
                            0.5 * math.sin(2 * math.pi * 1728 * dt) +
                            0.25 * math.sin(2 * math.pi * 2592 * dt)
                        )
                        chime_r += 0.09 * decay * (
                            math.sin(2 * math.pi * 866 * dt) +
                            0.5 * math.sin(2 * math.pi * 1732 * dt) +
                            0.25 * math.sin(2 * math.pi * 2596 * dt)
                        )

                # Gentle heartbeat pulse (0.8s period)
                heart_t = t % 1.2
                heart = 0.0
                if heart_t < 0.15:
                    heart = 0.04 * math.sin(2 * math.pi * 55 * heart_t) * math.exp(-20 * heart_t) * fade

                total_l = pad_l + chime_l + heart
                total_r = pad_r + chime_r + heart

                # Soft clipping limiter
                total_l = math.tanh(total_l * 1.8) * 0.85
                total_r = math.tanh(total_r * 1.8) * 0.85

                s_l = int(total_l * 32767)
                s_r = int(total_r * 32767)

                struct.pack_into('<hh', raw_bytes, c * 4, s_l, s_r)

            wav.writeframes(raw_bytes)
            samples_written += current_chunk

    print("Soundtrack synthesis complete!")
    return output_wav

def main():
    print("=" * 60)
    print("CADENCE PRO — PRODUCT SHOWCASE VIDEO GENERATOR")
    print("=" * 60)

    scenes = [
        ("scene_01", scene_1_svg, 5.5),
        ("scene_02", scene_2_svg, 5.5),
        ("scene_03", scene_3_svg, 5.5),
        ("scene_04", scene_4_svg, 5.5),
        ("scene_05", scene_5_svg, 5.5),
        ("scene_06", scene_6_svg, 5.5),
        ("scene_07", scene_7_svg, 5.5),
    ]

    scene_clips = []

    for name, svg_fn, dur in scenes:
        print(f"\n[Rendering] {name} ({dur}s)...")
        svg_path = os.path.join(TEMP_DIR, f"{name}.svg")
        png_path = os.path.join(TEMP_DIR, f"{name}.png")
        mp4_path = os.path.join(TEMP_DIR, f"{name}.mp4")

        # 1. Write SVG
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(svg_fn())

        # 2. Convert SVG to PNG via macOS sips
        subprocess.run(["sips", "-s", "format", "png", svg_path, "--out", png_path], check=True, stdout=subprocess.DEVNULL)

        # 3. Create video clip from image
        # Using subtle zoompan for cinematic motion
        cmd = [
            "ffmpeg",
            "-loop", "1",
            "-i", png_path,
            "-t", str(dur),
            "-vf", "scale=1920:1080,fps=30",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            mp4_path,
            "-y"
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        scene_clips.append(mp4_path)
        print(f"  ✓ Rendered {name}.mp4")

    # 4. Generate ambient audio soundtrack
    total_duration = sum(dur for _, _, dur in scenes)
    audio_wav = generate_ambient_soundtrack(total_duration)

    # 5. Concatenate video clips
    concat_txt = os.path.join(TEMP_DIR, "concat.txt")
    with open(concat_txt, "w") as f:
        for clip in scene_clips:
            f.write(f"file '{clip}'\n")

    video_only = os.path.join(TEMP_DIR, "video_only.mp4")
    print("\nConcatenating scene clips...")
    subprocess.run([
        "ffmpeg",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_txt,
        "-c", "copy",
        video_only,
        "-y"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 6. Mux video with high-definition audio
    print("\nMuxing video and ambient soundtrack into final MP4...")
    subprocess.run([
        "ffmpeg",
        "-i", video_only,
        "-i", audio_wav,
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "256k",
        "-shortest",
        OUTPUT_VIDEO,
        "-y"
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 7. Generate poster thumbnail frame
    poster_png = os.path.join(ROOT_DIR, "cadence_product_poster.png")
    shutil.copyfile(os.path.join(TEMP_DIR, "scene_01.png"), poster_png)

    # Also make a copy in dist/
    shutil.copyfile(OUTPUT_VIDEO, os.path.join(ROOT_DIR, "dist", "cadence_product_video.mp4"))

    video_size = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
    print("\n" + "=" * 60)
    print(f"SUCCESS! Cadence Product Video generated:")
    print(f"  • Video file: {OUTPUT_VIDEO} ({video_size:.2f} MB)")
    print(f"  • Poster thumbnail: {poster_png}")
    print(f"  • Resolution: 1920x1080 Full HD @ 30fps")
    print(f"  • Duration: {total_duration:.1f} seconds")
    print(f"  • Codec: H.264 High Profile / AAC 256kbps Stereo")
    print("=" * 60)

if __name__ == "__main__":
    main()
