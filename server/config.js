// ============================================================================
// Cadence SaaS Server Configuration
// ============================================================================
const fs = require("fs");
const path = require("path");

// Simple zero-dependency .env loader
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "chrome-extension://*,http://localhost:3000").split(","),
  adminSecretKey: process.env.ADMIN_SECRET_KEY || "cadence_admin_secure_secret_2026",

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",

  // Pricing (₹69 INR monthly, ₹799 INR yearly)
  plans: {
    monthly: {
      code: "monthly",
      name: "Cadence Pro Monthly",
      priceInr: 69,
      billingInterval: "month",
      currency: "INR",
      symbol: "₹",
      razorpayPlanId: process.env.RAZORPAY_PLAN_MONTHLY_ID || "plan_monthly_69inr",
      stripePriceId: process.env.STRIPE_PRICE_MONTHLY_ID || "price_monthly_69inr",
      features: [
        "Full access to every habit & performance feature",
        "4K Dynamic New-Tab Wallpapers & Custom Uploads",
        "Deep Work Focus Sprints & Focus Guard blocker",
        "Spatial Audio Soundscapes & Zen Bowls",
        "Interactive Mascot Companions & XP Evolution",
        "Cadence AI Voice & Habit Coach",
        "Comprehensive Streak Analytics & CSV Export",
        "Cancel subscription anytime"
      ]
    },
    yearly: {
      code: "yearly",
      name: "Cadence Pro Yearly",
      priceInr: 799,
      billingInterval: "year",
      currency: "INR",
      symbol: "₹",
      badge: "Yearly Plan",
      savingsText: "Save ₹29 per year compared to monthly billing",
      razorpayPlanId: process.env.RAZORPAY_PLAN_YEARLY_ID || "plan_yearly_799inr",
      stripePriceId: process.env.STRIPE_PRICE_YEARLY_ID || "price_yearly_799inr",
      features: [
        "Everything included in Monthly Plan",
        "Discounted annual rate (12 months uninterrupted access)",
        "Priority feature updates & customer support",
        "Instant unlock for all current & future companions"
      ]
    }
  },

  // Razorpay
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ""
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    customerPortalUrl: process.env.STRIPE_CUSTOMER_PORTAL_URL || ""
  }
};

module.exports = config;
