/* Cadence billing — Stripe Checkout only. Pro never unlocks from a simulated card form. */
(function (global) {
  "use strict";
  const FL = global.FL = global.FL || {};

  function detectUserRegion() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const lang = (navigator.language || navigator.userLanguage || "").toLowerCase();
      if (tz.includes("Kolkata") || tz.includes("Calcutta") || tz.includes("India") || lang.endsWith("-in") || lang === "hi") {
        return "IN";
      }
    } catch (e) {}
    return "GLOBAL";
  }

  /**
   * Fill these from your Stripe Dashboard after creating live Payment Links
   * and a Customer Portal. Leave empty until they are real production URLs.
   * Test links (buy.stripe.com/test_…) are rejected.
   *
   * verifyUrl must point at the webhook server (see server/stripe-webhook.mjs).
   * Pro activates only after that endpoint confirms checkout.session.completed.
   */
  const STRIPE_CONFIG = {
    verifyUrl: "",
    customerPortalUrl: "",
    supportEmail: "billing@cadence.app",
    merchantName: "Cadence",
    successPath: "dashboard.html?checkout=return",
  };

  const STRIPE_PLANS = {
    IN: {
      currency: "INR",
      symbol: "₹",
      regionName: "India (INR)",
      monthly: {
        id: "cadence_pro_in_monthly",
        name: "Pro monthly",
        price: 99,
        displayPrice: "₹99",
        billingPeriod: "/ month",
        subtitle: "Billed monthly · cancel in the Stripe customer portal",
        stripePriceId: "",
        stripePaymentLink: "",
        autoPay: true,
        tag: "MONTHLY",
        features: [
          "Focus sprints and soundscapes",
          "Weekly reports and CSV export",
          "Habit reminders",
        ],
      },
      annual: {
        id: "cadence_pro_in_annual",
        name: "Pro annual",
        price: 799,
        displayPrice: "₹799",
        equivalentMonthly: "₹66/mo",
        billingPeriod: "/ year",
        subtitle: "Billed once a year",
        stripePriceId: "",
        stripePaymentLink: "",
        autoPay: true,
        tag: "ANNUAL",
        badge: "BEST VALUE",
        features: [
          "Everything in monthly",
          "Lower yearly rate",
        ],
      },
    },
    GLOBAL: {
      currency: "USD",
      symbol: "$",
      regionName: "Global (USD)",
      monthly: {
        id: "cadence_pro_usd_monthly",
        name: "Pro monthly",
        price: 4.99,
        displayPrice: "$4.99",
        billingPeriod: "/ month",
        subtitle: "Billed monthly · cancel in the Stripe customer portal",
        stripePriceId: "",
        stripePaymentLink: "",
        autoPay: true,
        tag: "MONTHLY",
        features: [
          "Focus sprints and soundscapes",
          "Weekly reports and CSV export",
          "Habit reminders",
        ],
      },
      annual: {
        id: "cadence_pro_usd_annual",
        name: "Pro annual",
        price: 39,
        displayPrice: "$39",
        equivalentMonthly: "$3.25/mo",
        billingPeriod: "/ year",
        subtitle: "Billed once a year",
        stripePriceId: "",
        stripePaymentLink: "",
        autoPay: true,
        tag: "ANNUAL",
        badge: "BEST VALUE",
        features: [
          "Everything in monthly",
          "Lower yearly rate",
        ],
      },
    },
  };

  function isLiveStripeCheckoutUrl(url) {
    if (!url || typeof url !== "string") return false;
    if (!/^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+/.test(url.trim())) return false;
    if (/\/test_/i.test(url) || /test_/i.test(url)) return false;
    return true;
  }

  function isPortalConfigured(url) {
    return typeof url === "string" && /^https:\/\/billing\.stripe\.com\//.test(url.trim()) && !/\/test_/i.test(url);
  }

  function planCheckoutReady(plan) {
    return !!(plan && isLiveStripeCheckoutUrl(plan.stripePaymentLink));
  }

  function billingConfigured() {
    const regions = [STRIPE_PLANS.IN, STRIPE_PLANS.GLOBAL];
    return regions.some((r) => planCheckoutReady(r.monthly) || planCheckoutReady(r.annual));
  }

  async function verifyEntitlement(payload) {
    const verifyUrl = (STRIPE_CONFIG.verifyUrl || "").trim();
    if (!verifyUrl) {
      return { ok: false, reason: "verify_unconfigured" };
    }
    try {
      const res = await fetch(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return { ok: false, reason: "verify_http_" + res.status };
      const data = await res.json();
      if (!data || data.entitled !== true) return { ok: false, reason: "not_entitled", data };
      return { ok: true, data };
    } catch (err) {
      return { ok: false, reason: "verify_network", error: String(err && err.message ? err.message : err) };
    }
  }

  async function verifyLicenseKey(key) {
    const clean = (key || "").trim();
    if (!clean) return false;
    const result = await verifyEntitlement({ licenseKey: clean });
    return result.ok;
  }

  async function activateProSubscription(details) {
    details = details || {};
    const licenseKey = details.licenseKey || details.sessionId || "";
    const check = await verifyEntitlement(
      details.sessionId ? { sessionId: details.sessionId, licenseKey } : { licenseKey }
    );
    if (!check.ok) {
      throw new Error(check.reason || "Entitlement could not be verified.");
    }
    const pro = await FL.loadProSettings();
    pro.isPro = true;
    pro.planType = (check.data && check.data.planId) || details.planId || pro.planType;
    pro.activatedAt = Date.now();
    pro.customerEmail = (check.data && check.data.email) || details.customerEmail || pro.customerEmail || "";
    pro.stripeSubscriptionId = (check.data && check.data.subscriptionId) || details.stripeSubscriptionId || "";
    pro.stripeCustomerId = (check.data && check.data.customerId) || details.stripeCustomerId || "";
    pro.licenseKey = (check.data && check.data.licenseKey) || licenseKey;
    await FL.saveProSettings(pro);
    return pro;
  }

  async function cancelProSubscription() {
    const pro = await FL.loadProSettings();
    pro.isPro = false;
    pro.canceledAt = Date.now();
    await FL.saveProSettings(pro);
    return pro;
  }

  async function syncCheckoutReturn(search) {
    const params = new URLSearchParams(search || (global.location && global.location.search) || "");
    const sessionId = params.get("session_id") || params.get("checkout_session_id");
    if (!sessionId) return { synced: false };
    try {
      const pro = await activateProSubscription({ sessionId });
      return { synced: true, pro };
    } catch (err) {
      return { synced: false, error: err.message };
    }
  }

  Object.assign(FL, {
    detectUserRegion,
    STRIPE_CONFIG,
    STRIPE_PLANS,
    isLiveStripeCheckoutUrl,
    isPortalConfigured,
    planCheckoutReady,
    billingConfigured,
    verifyEntitlement,
    verifyLicenseKey,
    activateProSubscription,
    cancelProSubscription,
    syncCheckoutReturn,
  });
})(typeof window !== "undefined" ? window : globalThis);
