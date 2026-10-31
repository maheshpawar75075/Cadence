# Chrome Web Store Listing — Cadence — Habit & Performance Tracker

> Last Updated: 2026-10-27

## Store Listing Metadata

**Extension Name** [REQUIRED]
Cadence — Habit & Performance Tracker

**Short Description** [REQUIRED]
<!-- 128 / 132 characters -->
A premium habit and focus workspace with rich insights, 4K new-tab backgrounds, soundscapes, focus sprints, and streak tracking.

**Detailed Description** [REQUIRED]
Cadence transforms your browser into a calm, focused workspace designed to help you build consistent daily habits and achieve deep focus every single day.

Every time you open a new tab, Cadence greets you with a minimalist dashboard featuring dynamic 4K nature and zen wallpapers, ambient soundscapes, an interactive companion mascot, and your daily performance scorecard.

KEY FEATURES:
• Habit & Routine Tracker: Track custom habits with streaks, completion rates, and visual analytics.
• Focus Sprints & Focus Guard: Built-in Pomodoro sprint timer with an intelligent site blocker to eliminate distractions during work sessions.
• Ambient Soundscapes: Calming background audio including rain, cafe, forest, white noise, and zen Tibetan singing bowls.
• 4K Dynamic Wallpapers: Curated high-resolution photography, customizable themes, and personal photo uploads.
• Interactive Mascot Companion: An evolving digital companion that gains XP as you complete daily habits and stay productive.
• Cadence AI Coach: Personalized motivational tips, habit suggestions, and performance recaps.
• Weekly Performance Reports: Export streak analytics, focus hours, and milestone history.

HOW IT WORKS:
1. Install Cadence and click the extension icon or open a new tab.
2. Sign in to your Cadence Pro account and select your subscription (Monthly ₹88 or Yearly ₹799).
3. Set your top 3 daily habits and customize your workspace with your favorite soundscape and wallpaper.
4. Open a new tab anytime to log your habits, initiate a focus sprint, and watch your consistency grow.

SUBSCRIPTION & PRICING:
Cadence Pro is a premium, distraction-free productivity workspace with no advertisements and no data selling. Access requires an active Cadence Pro subscription:
• Monthly Plan: ₹88 / month (cancel anytime)
• Yearly Plan: ₹799 / year (save ₹257/year vs monthly)

PRIVACY & SECURITY:
Your privacy is our priority. Your habit records, notes, and local sprint statistics remain privately stored in your browser. We never track your personal browsing history, sell data to advertisers, or display third-party advertisements.

SUPPORT & FEEDBACK:
Have questions or feature requests? Contact our team anytime at support@cadencepro.app or visit our help center.

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Helps users build consistent daily habits, maintain focus sprints, and track personal performance from every new browser tab.

**Primary Language** [REQUIRED]
English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|---|---|---|---|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `STORE_ASSETS/1_Store_Icon_128x128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 PNG | ✅ Ready | `STORE_ASSETS/2_Screenshot_1280x800.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 PNG | ✅ Ready | `STORE_ASSETS/3_Promo_Tile_440x280.png` |
| Marquee Promo Tile [OPTIONAL] | 1400×560 PNG | ✅ Ready | `STORE_ASSETS/4_Marquee_Promo_Tile_1400x560.png` |

---

## Permissions Justification

| Permission | Type | User-Facing Justification |
|---|---|---|
| `storage` | permissions | Saves user habits, completion streaks, sound preferences, and active subscription state locally in the browser. |
| `unlimitedStorage` | permissions | Allows caching high-resolution 4K wallpaper themes and ambient audio assets locally without exceeding default storage quotas. |
| `alarms` | permissions | Schedules daily habit reminders and accurately clocks Pomodoro focus sprint countdown timers. |
| `notifications` | permissions | Delivers desktop notifications when a focus sprint finishes or when daily habit targets are accomplished. |
| `identity` | permissions | Authenticates the user's Cadence Pro account and Google OAuth sign-in to verify paid subscription status. |
| `tabs` | permissions | Redirects distracting web pages to a zen calm screen when the user has active Focus Guard sprint mode enabled. |
| `search` | permissions | Executes search queries entered in the new tab search box using the user's selected default search engine via the official Chrome Search API (`chrome.search.query`). |
| `https://images.unsplash.com/*` | host_permissions | Downloads curated 4K photography backgrounds for the customizable new tab interface. |
| `https://cadence-abl9.onrender.com/*` | host_permissions | Connects to the secure SaaS backend to authenticate users and verify active Cadence Pro subscription status. |
| `https://*.supabase.co/*` | host_permissions | Cloud database connection endpoint for authenticating accounts and syncing user habits across browser sessions. |

---

## Privacy & Data Use Disclosure

### Data Types Collected:
- **Personally Identifiable Information:** User email address and account user ID solely for account login, password reset, and subscription entitlement verification.
- **Financial & Payment Information:** Handled 100% directly by certified PCI-DSS Level 1 payment processors (Razorpay and Stripe). Cadence servers and extension never receive, handle, or store raw credit card numbers or UPI PINs.
- **Website Content / History:** NEVER collected, sold, or shared. Focus Guard operates strictly locally on the user's device.

### Certification Checkboxes (Chrome Web Store Developer Console):
- [x] Does not sell user data to third parties.
- [x] Does not use or transfer user data for purposes unrelated to the item's core functionality.
- [x] Does not use or transfer user data to determine creditworthiness or for lending purposes.
- [x] Complies with Google's Limited Use Policy.

---

## Version History

| Version | Date | Highlights |
|---|---|---|
| 2.4.4 | 2026-10-31 | Prioritized active subscriptions over pending sessions, added automatic email-based payment reconciliation for Razorpay subscribers, and streamlined seamless login entitlement verification. |
| 2.4.3 | 2026-10-31 | Hardened paywall entitlement protection, resolved timezone date indexing in omnibox, synchronized subtask checklist states, harmonized ₹88/mo pricing, and added topbar dark/light theme toggle. |
| 2.4.2 | 2026-10-29 | Enhanced performance reporting with daily notes, tasks export, and optimized local storage cache sync. |
| 2.4.1 | 2026-10-27 | Fixed Chrome Web Store policy compliance (Red Argon / Single Purpose): integrated official Chrome Search API (`chrome.search.query`) to strictly respect user's default search provider settings, removed hardcoded search URL, removed Google Suggest proxy and host permissions. |
| 2.4.0 | 2026-09-29 | Integrated Cadence Pro SaaS subscription engine (₹69/mo & ₹799/yr), Razorpay/Stripe checkout, Supabase cloud sync, and hardened entitlement gatekeeper. |
