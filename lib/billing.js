/* ============================================================================
   Cadence Billing & SaaS Bridge
   Unified billing for Razorpay (Primary) and Stripe Subscriptions
   Plans: ₹69 INR/month & ₹799 INR/year
   ============================================================================ */
(function (global) {
  "use strict";
  const FL = global.FL = global.FL || {};

  function detectUserRegion() {
    return "IN"; // Cadence Pro is 100% INR-priced (₹69/mo, ₹799/yr)
  }

  const STRIPE_CONFIG = {
    verifyUrl: "http://localhost:3000/api/subscription/verify",
    customerPortalUrl: "",
    supportEmail: "billing@cadence.app",
    merchantName: "Cadence Pro",
    successPath: "dashboard.html?checkout=success",
  };

  const STRIPE_PLANS = {
    IN: {
      currency: "INR",
      symbol: "₹",
      regionName: "India (INR)",
      monthly: {
        id: "cadence_pro_in_monthly",
        name: "Pro Monthly",
        price: 69,
        displayPrice: "₹69",
        billingPeriod: "/ month",
        subtitle: "Billed monthly recurring · Cancel anytime",
        stripePriceId: "price_monthly_69inr",
        stripePaymentLink: "",
        autoPay: true,
        tag: "MONTHLY",
        features: [
          "Full access to all habit tracking features",
          "Focus sprints & Focus Guard website blocker",
          "4K dynamic wallpapers & spatial soundscapes",
          "Weekly reports & CSV analytics export",
          "Cadence AI habit coach"
        ],
      },
      annual: {
        id: "cadence_pro_in_annual",
        name: "Pro Yearly",
        price: 799,
        displayPrice: "₹799",
        equivalentMonthly: "₹66/mo",
        billingPeriod: "/ year",
        subtitle: "Billed annually recurring (Save ₹29/year vs monthly)",
        stripePriceId: "price_yearly_799inr",
        stripePaymentLink: "",
        autoPay: true,
        tag: "ANNUAL",
        badge: "YEARLY PLAN",
        features: [
          "Everything in Pro Monthly",
          "Discounted annual rate (12 months access)",
          "Lowest cost: just ₹66 per month",
          "Priority customer support"
        ],
      },
    },
    GLOBAL: {
      currency: "INR",
      symbol: "₹",
      regionName: "India (INR)",
      monthly: {
        id: "cadence_pro_in_monthly",
        name: "Pro Monthly",
        price: 69,
        displayPrice: "₹69",
        billingPeriod: "/ month",
        subtitle: "Billed monthly recurring · Cancel anytime",
        stripePriceId: "price_monthly_69inr",
        stripePaymentLink: "",
        autoPay: true,
        tag: "MONTHLY",
        features: [
          "Full access to all habit tracking features",
          "Focus sprints & Focus Guard website blocker",
          "4K dynamic wallpapers & spatial soundscapes",
          "Weekly reports & CSV analytics export",
          "Cadence AI habit coach"
        ],
      },
      annual: {
        id: "cadence_pro_in_annual",
        name: "Pro Yearly",
        price: 799,
        displayPrice: "₹799",
        equivalentMonthly: "₹66/mo",
        billingPeriod: "/ year",
        subtitle: "Billed annually recurring (Save ₹29/year vs monthly)",
        stripePriceId: "price_yearly_799inr",
        stripePaymentLink: "",
        autoPay: true,
        tag: "ANNUAL",
        badge: "YEARLY PLAN",
        features: [
          "Everything in Pro Monthly",
          "Discounted annual rate (12 months access)",
          "Lowest cost: just ₹66 per month",
          "Priority customer support"
        ],
      },
    }
  };

  function isLiveStripeCheckoutUrl(url) {
    if (!url || typeof url !== "string") return false;
    return /^https:\/\/(buy\.stripe\.com|checkout\.razorpay\.com)/.test(url.trim());
  }

  function isPortalConfigured(url) {
    return typeof url === "string" && url.trim().length > 0;
  }

  function planCheckoutReady(plan) {
    return true; // Routed dynamically via backend /api/checkout/create
  }

  function billingConfigured() {
    return true;
  }

  async function verifyEntitlement(payload) {
    if (FL.saasClient) {
      const res = await FL.saasClient.verifyEntitlement();
      return { ok: Boolean(res && res.entitled), data: res };
    }
    return { ok: false, reason: "saas_client_unavailable" };
  }

  async function verifyLicenseKey(key) {
    return verifyEntitlement();
  }

  async function activateProSubscription(details) {
    if (FL.saasGate) {
      await FL.saasGate.recheckEntitlement();
    }
    const pro = await FL.loadProSettings();
    return pro;
  }

  async function cancelProSubscription() {
    if (FL.saasClient) {
      await FL.saasClient.cancelSubscription();
    }
    const pro = await FL.loadProSettings();
    return pro;
  }

  async function syncCheckoutReturn(search) {
    const params = new URLSearchParams(search || (global.location && global.location.search) || "");
    const checkoutStatus = params.get("checkout");
    if (checkoutStatus === "success" || params.has("session_id") || params.has("subId")) {
      const check = await verifyEntitlement();
      if (check.ok) {
        if (FL.saasUI) {
          FL.saasUI.showPaymentSuccessModal(check.data);
        }
        return { synced: true, entitled: true };
      }
    }
    return { synced: false };
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
