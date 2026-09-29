// ============================================================================
// Razorpay Subscriptions Service (India Recurring Billing)
// ============================================================================
const crypto = require("crypto");
const config = require("./config");

class RazorpayService {
  constructor() {
    this.keyId = config.razorpay.keyId;
    this.keySecret = config.razorpay.keySecret;
    this.webhookSecret = config.razorpay.webhookSecret;
    this.isLive = Boolean(this.keyId && this.keySecret && !this.keyId.includes("YourKeyId"));
  }

  getAuthHeader() {
    return "Basic " + Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
  }

  // Create a recurring subscription session
  async createSubscription({ planCode, userId, userEmail }) {
    const plan = config.plans[planCode] || config.plans.monthly;
    const planId = plan.razorpayPlanId;

    if (!this.isLive) {
      // Mock / Sandbox simulation mode when live credentials are not yet configured
      const mockSubId = "sub_mock_" + crypto.randomBytes(6).toString("hex");
      return {
        provider: "razorpay",
        subscriptionId: mockSubId,
        checkoutUrl: `${config.appBaseUrl}/checkout-simulation.html?subId=${mockSubId}&userId=${encodeURIComponent(userId)}&plan=${planCode}&amount=${plan.priceInr}`,
        planCode: plan.code,
        priceInr: plan.priceInr,
        currency: "INR",
        simulated: true,
        message: "Razorpay running in test/simulation mode. Set real RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET to go live."
      };
    }

    // Call live Razorpay API
    const totalCount = planCode === "yearly" ? 5 : 60; // 5 years or 5 years monthly
    const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Authorization": this.getAuthHeader(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan_id: planId,
        total_count: totalCount,
        quantity: 1,
        customer_notify: 1,
        notes: {
          user_id: userId,
          plan_code: planCode,
          email: userEmail
        }
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Razorpay API Error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    return {
      provider: "razorpay",
      subscriptionId: data.id,
      checkoutUrl: data.short_url,
      planCode: plan.code,
      priceInr: plan.priceInr,
      currency: "INR",
      simulated: false
    };
  }

  // Verify Webhook Signature with timing safe equal
  verifyWebhookSignature(rawBody, signature) {
    if (!this.webhookSecret) {
      console.warn("[Razorpay] Warning: RAZORPAY_WEBHOOK_SECRET not set. Skipping live verification in dev.");
      return true;
    }
    if (!signature) return false;
    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(rawBody)
        .digest("hex");
      
      const sigBuffer = Buffer.from(signature, "utf-8");
      const expBuffer = Buffer.from(expectedSignature, "utf-8");
      if (sigBuffer.length !== expBuffer.length) return false;
      return crypto.timingSafeEqual(sigBuffer, expBuffer);
    } catch (err) {
      console.error("[Razorpay] Signature verification error:", err.message);
      return false;
    }
  }

  // Cancel subscription
  async cancelSubscription(providerSubId, cancelAtCycleEnd = true) {
    if (
      !this.isLive ||
      providerSubId.startsWith("sub_mock_") ||
      providerSubId.startsWith("sub_sim_") ||
      providerSubId.startsWith("sub_test_")
    ) {
      return { status: "cancelled", cancel_at_cycle_end: cancelAtCycleEnd };
    }
    const res = await fetch(`https://api.razorpay.com/v1/subscriptions/${providerSubId}/cancel`, {
      method: "POST",
      headers: {
        "Authorization": this.getAuthHeader(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0
      })
    });
    if (!res.ok) {
      const err = await res.text();
      if (res.status === 404 || err.includes("no Route matched")) {
        console.warn(`[Razorpay] Subscription ${providerSubId} not found on Razorpay; proceeding with local cancellation.`);
        return { status: "cancelled", cancel_at_cycle_end: cancelAtCycleEnd };
      }
      throw new Error(`Failed to cancel Razorpay subscription: ${err}`);
    }
    return await res.json();
  }
}

module.exports = new RazorpayService();
