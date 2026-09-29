# Chrome Web Store Listing — Cadence — Habit & Performance Tracker

> Last Updated: 2026-09-29

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
2. Sign in to your Cadence Pro account and select your subscription (Monthly ₹69 or Yearly ₹799).
3. Set your top 3 daily habits and customize your workspace with your favorite soundscape and wallpaper.
4. Open a new tab anytime to log your habits, initiate a focus sprint, and watch your consistency grow.

SUBSCRIPTION & PRICING:
Cadence Pro is a premium, distraction-free productivity workspace with no advertisements and no data selling. Access requires an active Cadence Pro subscription:
• Monthly Plan: ₹69 / month (cancel anytime)
• Yearly Plan: ₹799 / year (save ₹29/year vs monthly)

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
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `icons/icon128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 | ⬜ To Capture | New Tab Dashboard with Habits & 4K Wallpaper |
| Screenshot 2 [RECOMMENDED] | 1280×800 | ⬜ To Capture | Focus Sprint Timer & Focus Guard Site Blocker |
| Screenshot 3 [RECOMMENDED] | 1280×800 | ⬜ To Capture | Ambient Soundscapes & Companion Evolution |
| Screenshot 4 [RECOMMENDED] | 1280×800 | ⬜ To Capture | Habit Analytics, Streaks & Weekly Reports |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ To Create | Cadence Logo with Tagline |
| Marquee Promo Tile | 1400×560 | ⬜ Optional | Full-width Banner |

---

## Permissions Justification

| Permission | Type | User-Facing Justification |
|---|---|---|
| `storage` | permissions | Saves user habits, completion streaks, sound preferences, and active subscription state locally in the browser. |
| `unlimitedStorage` | permissions | Allows caching high-resolution 4K wallpaper themes and ambient audio assets locally without exceeding default storage quotas. |
| `alarms` | permissions | Schedules daily habit reminders and accurately clocks Pomodoro focus sprint countdown timers. |
| `notifications` | permissions | Delivers desktop notifications when a focus sprint finishes or when daily habit targets are accomplished. |
| `topSites` | permissions | Displays the user's most frequently visited websites as quick-launch tiles on the personalized new-tab screen. |
| `bookmarks` | permissions | Allows users to quickly search and launch their browser bookmarks directly from the new-tab search input. |
| `identity` | permissions | Authenticates the user's Cadence Pro account and Google OAuth sign-in to verify paid subscription status. |
| `tabs` | permissions | Redirects distracting web pages to a zen calm screen when the user has active Focus Guard sprint mode enabled. |
| `https://suggestqueries.google.com/*` | host_permissions | Fetches real-time search suggestions inside the new-tab search box as the user types. |
| `https://images.unsplash.com/*` | host_permissions | Downloads curated 4K photography backgrounds for the customizable new tab interface. |
| `https://*.supabase.co/*` | host_permissions | Connects to the secure backend to authenticate users and verify active Cadence Pro subscription status. |
| `https://api.razorpay.com/*` | host_permissions | Connects with Razorpay payment services to initiate subscription checkout and billing management. |
| `https://api.stripe.com/*` | host_permissions | Connects with Stripe payment services for international subscription payments. |

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
| 2.4.0 | 2026-09-29 | Integrated Cadence Pro SaaS subscription engine (₹69/mo & ₹799/yr), Razorpay/Stripe checkout, Supabase cloud sync, and hardened entitlement gatekeeper. |
