// ============================================================================
// Stripe Subscriptions & Billing Service (International / Backup Provider)
// ============================================================================
const crypto = require("crypto");
const config = require("./config");

class StripeService {
  constructor() {
    this.secretKey = config.stripe.secretKey;
    this.webhookSecret = config.stripe.webhookSecret;
    this.isLive = Boolean(this.secretKey && !this.secretKey.includes("sk_test_51..."));
  }

  // Create Stripe Checkout Session
  async createCheckoutSession({ planCode, userId, userEmail, successUrl, cancelUrl }) {
    const plan = config.plans[planCode] || config.plans.monthly;
    const priceId = plan.stripePriceId;

    if (!this.isLive) {
      const mockSessionId = "cs_mock_" + crypto.randomBytes(6).toString("hex");
      return {
        provider: "stripe",
        sessionId: mockSessionId,
        checkoutUrl: `${config.appBaseUrl}/checkout-simulation.html?subId=${mockSessionId}&userId=${encodeURIComponent(userId)}&plan=${planCode}&amount=${plan.priceInr}&provider=stripe`,
        planCode: plan.code,
        priceInr: plan.priceInr,
        currency: "INR",
        simulated: true,
        message: "Stripe running in simulation mode. Configure STRIPE_SECRET_KEY to enable live checkout."
      };
    }

    // Call Stripe API
    const params = new URLSearchParams({
      "mode": "subscription",
      "payment_method_types[0]": "card",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "client_reference_id": userId,
      "customer_email": userEmail,
      "metadata[userId]": userId,
      "metadata[planCode]": planCode,
      "success_url": successUrl || `${config.appBaseUrl}/dashboard.html?session_id={CHECKOUT_SESSION_ID}&checkout=success`,
      "cancel_url": cancelUrl || `${config.appBaseUrl}/dashboard.html?checkout=cancelled`
    });

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Stripe API Error (${res.status}): ${err}`);
    }

    const session = await res.json();
    return {
      provider: "stripe",
      sessionId: session.id,
      checkoutUrl: session.url,
      planCode: plan.code,
      priceInr: plan.priceInr,
      currency: "INR",
      simulated: false
    };
  }

  // Verify Stripe Webhook Signature (t=...,v1=...)
  verifyWebhookSignature(rawBody, sigHeader) {
    if (!this.webhookSecret) {
      console.warn("[Stripe] Warning: STRIPE_WEBHOOK_SECRET not set. Skipping in dev.");
      return true;
    }
    if (!sigHeader) return false;

    try {
      const parts = sigHeader.split(",");
      let timestamp = "";
      const signatures = [];

      for (const part of parts) {
        const [key, val] = part.trim().split("=");
        if (key === "t") timestamp = val;
        if (key === "v1") signatures.push(val);
      }

      if (!timestamp || signatures.length === 0) return false;

      // Ensure timestamp is within tolerance (5 minutes)
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
        console.warn("[Stripe] Webhook timestamp outside tolerance window");
        return false;
      }

      const signedPayload = `${timestamp}.${rawBody}`;
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(signedPayload)
        .digest("hex");

      const expBuf = Buffer.from(expectedSignature, "utf-8");
      return signatures.some(sig => {
        const sigBuf = Buffer.from(sig, "utf-8");
        return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
      });
    } catch (err) {
      console.error("[Stripe] Signature verification error:", err.message);
      return false;
    }
  }

  // Cancel Stripe Subscription
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    if (
      !this.isLive ||
      subscriptionId.startsWith("cs_mock_") ||
      subscriptionId.startsWith("sub_mock_") ||
      subscriptionId.startsWith("sub_sim_") ||
      subscriptionId.startsWith("sub_test_")
    ) {
      return { status: "canceled", cancel_at_period_end: cancelAtPeriodEnd };
    }

    const params = new URLSearchParams({
      "cancel_at_period_end": cancelAtPeriodEnd ? "true" : "false"
    });

    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Stripe cancel error: ${err}`);
    }
    return await res.json();
  }
}

module.exports = new StripeService();
