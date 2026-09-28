// ============================================================================
// Cadence SaaS Security & Tamper-Proofing Test Suite
// Run with: node --test tests/security.test.js
// ============================================================================
const { test, describe } = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");
const razorpay = require("../server/razorpay");
const stripe = require("../server/stripe");
const config = require("../server/config");
const { handleRoutes } = require("../server/routes");

async function request(method, path, options = {}) {
  const { headers = {}, body = null } = options;
  const rawBody = body ? (typeof body === "string" ? body : JSON.stringify(body)) : "";
  let parsedBody = {};
  if (rawBody) {
    try { parsedBody = JSON.parse(rawBody); } catch (_) { parsedBody = {}; }
  }

  const req = {
    method,
    url: path,
    headers: { host: "localhost:3000", ...headers }
  };

  let statusCode = 200;
  let resHeaders = {};
  let resBody = "";

  return new Promise((resolve, reject) => {
    const res = {
      writeHead(status, h) {
        statusCode = status;
        resHeaders = h || {};
      },
      end(chunk) {
        if (chunk) resBody += chunk;
        resolve({
          status: statusCode,
          headers: resHeaders,
          json: async () => JSON.parse(resBody),
          text: async () => resBody
        });
      },
      get headersSent() { return Boolean(resBody); }
    };
    handleRoutes(req, res, rawBody, parsedBody).catch(reject);
  });
}

describe("Cadence Security & Integrity Audits", () => {
  test("1. Razorpay HMAC SHA256 Signature Verification Rejects Forged Signatures", () => {
    const secret = "test_webhook_secret_key_123";
    const service = Object.create(razorpay);
    service.webhookSecret = secret;

    const body = JSON.stringify({ event: "payment.captured", id: "evt_101" });
    const validSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const forgedSignature = crypto.createHmac("sha256", "wrong_secret").update(body).digest("hex");

    assert.strictEqual(service.verifyWebhookSignature(body, validSignature), true, "Valid signature must pass");
    assert.strictEqual(service.verifyWebhookSignature(body, forgedSignature), false, "Forged signature must fail");
    assert.strictEqual(service.verifyWebhookSignature(body, ""), false, "Empty signature must fail");
    assert.strictEqual(service.verifyWebhookSignature(body, "invalid_hex"), false, "Malformed signature must fail");
  });

  test("2. Stripe Webhook Signature Verification Rejects Stale Timestamps & Tampered Data", () => {
    const secret = "whsec_test_stripe_secret_456";
    const service = Object.create(stripe);
    service.webhookSecret = secret;

    const body = JSON.stringify({ type: "checkout.session.completed", id: "evt_stripe_1" });
    const now = Math.floor(Date.now() / 1000);
    const validSig = crypto.createHmac("sha256", secret).update(`${now}.${body}`).digest("hex");
    const validHeader = `t=${now},v1=${validSig}`;

    assert.strictEqual(service.verifyWebhookSignature(body, validHeader), true, "Fresh valid signature passes");

    // Stale timestamp (10 minutes old > 300s tolerance)
    const staleTime = now - 600;
    const staleSig = crypto.createHmac("sha256", secret).update(`${staleTime}.${body}`).digest("hex");
    const staleHeader = `t=${staleTime},v1=${staleSig}`;
    assert.strictEqual(service.verifyWebhookSignature(body, staleHeader), false, "Stale signature must be rejected");

    // Tampered body with original signature
    const tamperedBody = JSON.stringify({ type: "checkout.session.completed", id: "evt_stripe_1", hack: true });
    assert.strictEqual(service.verifyWebhookSignature(tamperedBody, validHeader), false, "Tampered body must fail");
  });

  test("3. Arbitrary Plan Code Rejection: Prevents assigning free tier or nonexistent plans", async () => {
    const res = await request("POST", "/api/checkout/create", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer mock_user_hack:hacker@cadence.app"
      },
      body: { planCode: "free_trial", provider: "razorpay" }
    });

    assert.strictEqual(res.status, 400, "Must return HTTP 400 Bad Request");
    const data = await res.json();
    assert.strictEqual(data.error, "Invalid plan code. Must be 'monthly' or 'yearly'.");
  });

  test("4. Admin Secrets Are Not Leaked in Public API Responses", async () => {
    const healthRes = await request("GET", "/health");
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.adminSecretKey, undefined);
    assert.strictEqual(healthData.supabaseServiceRoleKey, undefined);
    assert.strictEqual(healthData.razorpayKeySecret, undefined);
    assert.strictEqual(healthData.stripeSecretKey, undefined);

    const plansRes = await request("GET", "/api/plans");
    const plansData = await plansRes.json();
    const plansStr = JSON.stringify(plansData);
    assert.ok(!plansStr.includes(config.adminSecretKey), "Admin secret key must never appear in plans");
  });
});
