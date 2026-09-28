// ============================================================================
// Cadence SaaS Server & Entitlement Lifecycle Test Suite
// (In-memory direct router testing: sandbox safe, zero-network, ultra fast)
// Run with: node --test tests/server.test.js
// ============================================================================
const { test, describe } = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");
const config = require("../server/config");
const { handleRoutes } = require("../server/routes");

// Dispatch helper simulating HTTP request directly to handleRoutes
async function request(method, path, options = {}) {
  const { headers = {}, body = null } = options;
  const rawBody = body ? (typeof body === "string" ? body : JSON.stringify(body)) : "";
  let parsedBody = {};
  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (_) {
      parsedBody = {};
    }
  }

  const req = {
    method,
    url: path,
    headers: {
      host: "localhost:3000",
      ...headers
    }
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
      get headersSent() {
        return Boolean(resBody);
      }
    };

    handleRoutes(req, res, rawBody, parsedBody).catch(reject);
  });
}

describe("Cadence SaaS Server & Monetization Engine", () => {
  test("1. Healthcheck returns ok and system status", async () => {
    const res = await request("GET", "/health");
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "ok");
    assert.strictEqual(data.app, "Cadence SaaS API");
  });

  test("2. Business Model & Pricing: ₹69/mo & ₹799/yr, NO free tier, accurate savings", async () => {
    const res = await request("GET", "/api/plans");
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data.plans));
    assert.strictEqual(data.plans.length, 2, "Must contain exactly 2 plans: Monthly and Yearly. No free plan.");

    const monthly = data.plans.find(p => p.code === "monthly");
    const yearly = data.plans.find(p => p.code === "yearly");

    assert.ok(monthly, "Monthly plan must exist");
    assert.strictEqual(monthly.priceInr, 69, "Monthly plan must be exactly ₹69 INR");
    assert.strictEqual(monthly.displayPrice, "₹69");
    assert.strictEqual(monthly.billingInterval, "month");

    assert.ok(yearly, "Yearly plan must exist");
    assert.strictEqual(yearly.priceInr, 799, "Yearly plan must be exactly ₹799 INR");
    assert.strictEqual(yearly.displayPrice, "₹799");
    assert.strictEqual(yearly.billingInterval, "year");

    // Yearly savings check: 12 * 69 = 828. 828 - 799 = 29 INR savings
    const expectedSavings = (monthly.priceInr * 12) - yearly.priceInr;
    assert.strictEqual(expectedSavings, 29, "Yearly savings calculation must be accurate (₹29/year)");
    assert.strictEqual(yearly.savingsInr, 29);
  });

  test("3. Checkout: Rejects unauthenticated requests", async () => {
    const res = await request("POST", "/api/checkout/create", {
      headers: { "Content-Type": "application/json" },
      body: { planCode: "monthly" }
    });
    assert.strictEqual(res.status, 401);
  });

  test("4. Entitlement: Unauthenticated request rejected with HTTP 401", async () => {
    const res = await request("POST", "/api/subscription/verify", {
      headers: { "Content-Type": "application/json" }
    });
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.entitled, false);
  });

  test("5. Entitlement: Authenticated user without subscription is NOT entitled", async () => {
    const testUserId = "test_user_no_sub_" + Date.now();
    const res = await request("POST", "/api/subscription/verify", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer mock_${testUserId}:nosub@test.com`
      }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.entitled, false);
    assert.strictEqual(data.reason, "no_subscription");
  });

  test("6. Checkout Creation: Authenticated user can create checkout session", async () => {
    const testUserId = "test_user_checkout_" + Date.now();
    const token = `mock_${testUserId}:buyer@test.com`;

    const res = await request("POST", "/api/checkout/create", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: { planCode: "monthly", provider: "razorpay" }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.subscriptionId, "Should return subscriptionId");
    assert.ok(data.checkoutUrl, "Should return checkoutUrl");
  });

  test("7. Payment Verification: Webhook activation activates subscription and grants entitlement", async () => {
    const testUserId = "test_user_webhook_" + Date.now();
    const token = `mock_${testUserId}:webhookuser@test.com`;

    // 1. Initial checkout intent
    const checkoutRes = await request("POST", "/api/checkout/create", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: { planCode: "yearly", provider: "razorpay" }
    });
    const checkoutData = await checkoutRes.json();
    const subId = checkoutData.subscriptionId;

    // 2. Trigger webhook event (subscription.charged)
    const webhookEvent = {
      event: "subscription.charged",
      event_id: "evt_" + Date.now(),
      payload: {
        subscription: {
          entity: {
            id: subId,
            notes: { user_id: testUserId, plan_code: "yearly" }
          }
        },
        payment: {
          entity: {
            id: "pay_" + Date.now(),
            subscription_id: subId,
            amount: 79900
          }
        }
      }
    };

    const rawPayload = JSON.stringify(webhookEvent);
    const signature = config.razorpay.webhookSecret
      ? crypto.createHmac("sha256", config.razorpay.webhookSecret).update(rawPayload).digest("hex")
      : "dummy_sig";

    const webhookRes = await request("POST", "/api/webhooks/razorpay", {
      headers: {
        "Content-Type": "application/json",
        "X-Razorpay-Signature": signature
      },
      body: rawPayload
    });

    assert.strictEqual(webhookRes.status, 200);

    // 3. Verify entitlement check is now TRUE
    const verifyRes = await request("POST", "/api/subscription/verify", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    assert.strictEqual(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyData.entitled, true, "User must now have verified paid entitlement");
    assert.strictEqual(verifyData.status, "active");
  });

  test("8. Webhook Idempotency: Duplicate event returns ignored_duplicate", async () => {
    const eventId = "dup_evt_" + Date.now();
    const webhookEvent = {
      event: "payment.captured",
      event_id: eventId,
      payload: {}
    };
    const rawPayload = JSON.stringify(webhookEvent);
    const signature = config.razorpay.webhookSecret
      ? crypto.createHmac("sha256", config.razorpay.webhookSecret).update(rawPayload).digest("hex")
      : "sig";

    const res1 = await request("POST", "/api/webhooks/razorpay", {
      headers: { "Content-Type": "application/json", "X-Razorpay-Signature": signature },
      body: rawPayload
    });
    assert.strictEqual(res1.status, 200);

    // Duplicate call with same event_id
    const res2 = await request("POST", "/api/webhooks/razorpay", {
      headers: { "Content-Type": "application/json", "X-Razorpay-Signature": signature },
      body: rawPayload
    });
    assert.strictEqual(res2.status, 200);
    const data2 = await res2.json();
    assert.strictEqual(data2.status, "ignored_duplicate", "Duplicate webhook events must be ignored idempotently");
  });

  test("9. Subscription Cancellation: Retains access through paid period", async () => {
    const testUserId = "test_user_cancel_" + Date.now();
    const token = `mock_${testUserId}:cancel@test.com`;

    // Activate subscription via simulation
    await request("POST", "/api/checkout/simulate-success", {
      headers: { "Content-Type": "application/json" },
      body: { userId: testUserId, planCode: "monthly" }
    });

    // Cancel subscription
    const cancelRes = await request("POST", "/api/subscription/cancel", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    assert.strictEqual(cancelRes.status, 200);
    const cancelData = await cancelRes.json();
    assert.strictEqual(cancelData.success, true);
    assert.ok(cancelData.paidThrough, "Must return paidThrough date");

    // Recheck entitlement: must still be entitled through the paid period
    const verifyRes = await request("POST", "/api/subscription/verify", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyData.entitled, true, "Canceled subscriber retains access through prepaid period");
    assert.strictEqual(verifyData.status, "canceled");
  });

  test("10. Admin Console: Protected by X-Admin-Key", async () => {
    // 1. Without admin key -> 403 Forbidden
    const unauthRes = await request("GET", "/api/admin/metrics");
    assert.strictEqual(unauthRes.status, 403);

    // 2. With valid admin key -> 200 OK
    const authRes = await request("GET", "/api/admin/metrics", {
      headers: { "X-Admin-Key": config.adminSecretKey }
    });
    assert.strictEqual(authRes.status, 200);
    const metrics = await authRes.json();
    assert.ok(typeof metrics.activeSubscriptions === "number");
    assert.ok(typeof metrics.totalRevenueInr === "number");
  });
});
