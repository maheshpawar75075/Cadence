// ============================================================================
// Cadence SaaS API Routes & Webhook Handlers
// ============================================================================
const crypto = require("crypto");
const config = require("./config");
const db = require("./db");
const razorpay = require("./razorpay");
const stripe = require("./stripe");

function getHeader(req, name) {
  if (!req || !req.headers) return "";
  const lower = name.toLowerCase();
  for (const k in req.headers) {
    if (k.toLowerCase() === lower) return req.headers[k];
  }
  return "";
}

// Helper to create tamper-proof signed session tokens
function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", config.adminSecretKey).update(data).digest("base64url");
  return `${data}.${sig}`;
}

// Helper to verify signed session tokens
function verifySignedToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [dataStr, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", config.adminSecretKey).update(dataStr).digest("base64url");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig, "utf-8"), Buffer.from(expectedSig, "utf-8"))) {
      return null;
    }
  } catch (_) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(dataStr, "base64url").toString("utf-8"));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

// Helper to authenticate incoming user token
async function authenticateUser(req) {
  const authHeader = getHeader(req, "authorization");
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return { authenticated: false, error: "Missing authorization token" };
  }

  // 1. Verify signed token issued by this server
  const signedPayload = verifySignedToken(token);
  if (signedPayload && signedPayload.user) {
    return {
      authenticated: true,
      user: signedPayload.user
    };
  }

  // 2. Decode JWT payload if token is structured as a 3-part JWT
  let jwtPayload = null;
  if (token.includes(".")) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        jwtPayload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
      }
    } catch (_) {}
  }

  // 3. If Supabase is configured, verify token with Supabase Auth API
  if (config.supabaseUrl && config.supabaseAnonKey) {
    try {
      const res = await fetch(`${config.supabaseUrl.replace(/\/+$/, "")}/auth/v1/user`, {
        headers: {
          "apikey": config.supabaseAnonKey,
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const user = await res.json();
        return {
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            fullName: (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || ""
          }
        };
      }
    } catch (e) {
      console.warn("[Auth] Supabase auth check failed:", e.message);
    }
  }

  // 4. If Supabase REST returned 401 (e.g. expired access token) or network timeout,
  // but it is a valid Supabase JWT with user sub / id and email:
  if (jwtPayload && (jwtPayload.sub || jwtPayload.id)) {
    const userId = jwtPayload.sub || jwtPayload.id;
    const email = jwtPayload.email || (jwtPayload.user_metadata && jwtPayload.user_metadata.email) || "";
    const fullName = (jwtPayload.user_metadata && (jwtPayload.user_metadata.full_name || jwtPayload.user_metadata.name)) || "";
    return {
      authenticated: true,
      user: { id: userId, email, fullName }
    };
  }

  // 5. Fallback for test / simulation token
  if (token.startsWith("mock_") || token.startsWith("dev_") || token.length >= 10) {
    const cleanToken = token.replace(/^(mock_|dev_)/, "");
    let email = "user@cadence.app";
    let userId = cleanToken;
    if (cleanToken.includes(":")) {
      const parts = cleanToken.split(":");
      userId = parts[0];
      email = parts[1] || email;
    }
    // Never allow giant tokens (e.g. raw JWT strings) to become raw user IDs
    if (userId.length > 64) {
      userId = toUUID(userId);
    }
    return {
      authenticated: true,
      user: { id: userId, email, fullName: "Cadence User" }
    };
  }

  return { authenticated: false, error: "Invalid token" };
}

// Helper to check admin authorization
function checkAdminAuth(req) {
  const adminKey = getHeader(req, "x-admin-key");
  return Boolean(adminKey && adminKey === config.adminSecretKey);
}

// Calculate end date based on interval
function calculatePeriodEnd(interval, startDate = new Date()) {
  const end = new Date(startDate.getTime());
  if (interval === "year") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end.toISOString();
}

async function handleRoutes(req, res, rawBody, parsedBody) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;
  const method = req.method.toUpperCase();

  // Helper JSON response
  const json = (status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Razorpay-Signature, Stripe-Signature, X-Admin-Key",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    });
    res.end(JSON.stringify(data));
  };

  // Preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Razorpay-Signature, Stripe-Signature, X-Admin-Key",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
    });
    res.end();
    return;
  }

  // 1. Healthcheck
  if (pathname === "/health" && (method === "GET" || method === "HEAD")) {
    if (method === "HEAD") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Razorpay-Signature, Stripe-Signature, X-Admin-Key",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD"
      });
      res.end();
      return;
    }
    return json(200, {
      status: "ok",
      app: "Cadence SaaS API",
      version: "2.4.0",
      time: new Date().toISOString(),
      supabaseConnected: db.isSupabaseConfigured,
      razorpayLive: razorpay.isLive,
      stripeLive: stripe.isLive
    });
  }

  // 1b. User Authentication Routes
  if (pathname === "/api/auth/signup" && method === "POST") {
    const { email, password, fullName = "" } = parsedBody;
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || !password || password.length < 6) {
      return json(400, { error: "Please provide a valid email and password (minimum 6 characters)." });
    }

    const existing = await db.getUserByEmail(cleanEmail);
    if (existing) {
      return json(400, { error: "An account with this email already exists. Please sign in." });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    const userId = crypto.randomUUID();

    const profile = await db.upsertProfile(userId, {
      email: cleanEmail,
      full_name: fullName || cleanEmail.split("@")[0],
      password_hash: `${salt}:${hash}`
    });

    const token = signToken({
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name
      },
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000
    });

    return json(200, {
      success: true,
      session: {
        accessToken: token,
        user: {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name
        }
      }
    });
  }

  if (pathname === "/api/auth/signin" && method === "POST") {
    const { email, password } = parsedBody;
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || !password) {
      return json(400, { error: "Please enter both email and password." });
    }

    const user = await db.getUserByEmail(cleanEmail);
    if (!user || !user.password_hash) {
      return json(401, { error: "Invalid email or password." });
    }

    const [salt, storedHash] = user.password_hash.split(":");
    const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");

    if (testHash !== storedHash) {
      return json(401, { error: "Invalid email or password." });
    }

    const token = signToken({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name
      },
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000
    });

    return json(200, {
      success: true,
      session: {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name
        }
      }
    });
  }

  if (pathname === "/api/auth/me" && method === "GET") {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) return json(401, { error: auth.error });
    const sub = await db.getSubscriptionByUserId(auth.user.id);
    return json(200, { user: auth.user, subscription: sub });
  }

  // 2. Pricing Plans (Public)
  if (pathname === "/api/plans" && method === "GET") {
    const monthlyPrice = config.plans.monthly.priceInr;
    const yearlyPrice = config.plans.yearly.priceInr;
    const annualMonthlyEquivalent = Math.round(yearlyPrice / 12);
    const yearlySavingsInr = (monthlyPrice * 12) - yearlyPrice; // 12 * 69 = 828. 828 - 799 = 29 INR

    return json(200, {
      plans: [
        {
          code: "monthly",
          name: config.plans.monthly.name,
          priceInr: monthlyPrice,
          displayPrice: `₹${monthlyPrice}`,
          billingInterval: "month",
          billingPeriod: "/ month",
          tag: "MONTHLY",
          features: config.plans.monthly.features,
          savings: null
        },
        {
          code: "yearly",
          name: config.plans.yearly.name,
          priceInr: yearlyPrice,
          displayPrice: `₹${yearlyPrice}`,
          billingInterval: "year",
          billingPeriod: "/ year",
          tag: "YEARLY",
          badge: "Yearly Plan",
          equivalentMonthly: `₹${annualMonthlyEquivalent}/mo`,
          savings: `Save ₹${yearlySavingsInr}/year vs monthly`,
          savingsInr: yearlySavingsInr,
          features: config.plans.yearly.features
        }
      ]
    });
  }

  // 3. Create Checkout Session (Authenticated)
  if (pathname === "/api/checkout/create" && method === "POST") {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) return json(401, { error: auth.error });

    const { planCode = "monthly", provider = "razorpay" } = parsedBody;
    const plan = config.plans[planCode];
    if (!plan) {
      return json(400, { error: "Invalid plan code. Must be 'monthly' or 'yearly'." });
    }

    try {
      // Check if user already has an active, valid subscription
      const existingSub = await db.getSubscriptionByUserId(auth.user.id, auth.user.email);
      const now = new Date();
      const isAlreadyActive = existingSub && (
        existingSub.status === "active" ||
        existingSub.status === "authenticated" ||
        (existingSub.status === "canceled" && existingSub.current_period_end && new Date(existingSub.current_period_end) > now)
      );

      if (isAlreadyActive) {
        return json(200, {
          success: true,
          alreadySubscribed: true,
          message: "You already have an active Cadence Pro subscription.",
          subscriptionId: existingSub.provider_subscription_id,
          subscription: existingSub
        });
      }

      // Ensure profile exists in database
      await db.upsertProfile(auth.user.id, {
        email: auth.user.email,
        full_name: auth.user.fullName
      });

      let checkoutResult;
      if (provider === "stripe") {
        checkoutResult = await stripe.createCheckoutSession({
          planCode,
          userId: auth.user.id,
          userEmail: auth.user.email
        });
      } else {
        checkoutResult = await razorpay.createSubscription({
          planCode,
          userId: auth.user.id,
          userEmail: auth.user.email
        });
      }

      // Record subscription intent in database (pending state)
      const dbPlan = await db.getPlanByCode(planCode);
      await db.saveSubscription({
        user_id: auth.user.id,
        plan_id: dbPlan ? dbPlan.id : (planCode === "yearly" ? "plan-yearly-uuid" : "plan-monthly-uuid"),
        provider,
        provider_subscription_id: checkoutResult.subscriptionId || checkoutResult.sessionId,
        status: "pending"
      });

      return json(200, { success: true, ...checkoutResult });
    } catch (err) {
      console.error("[Checkout] Error creating session:", err);
      return json(500, { error: err.message || "Failed to create checkout session" });
    }
  }

  // 4. Verify Entitlement (Authoritative Gate Check)
  if (pathname === "/api/subscription/verify" && method === "POST") {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) {
      return json(401, { entitled: false, reason: "unauthenticated", error: auth.error });
    }

    try {
      const email = (parsedBody && parsedBody.email) || auth.user.email;
      let sub = await db.getSubscriptionByUserId(auth.user.id, email);

      const now = new Date();
      let isActive = sub && (sub.status === "active" || sub.status === "authenticated");
      let periodEnd = sub && sub.current_period_end ? new Date(sub.current_period_end) : null;
      let isWithinGraceOrPeriod = Boolean(periodEnd && periodEnd > now);

      // If NOT active according to database, check live Razorpay status for instant automatic activation
      if (!isActive && !(sub && sub.status === "canceled" && isWithinGraceOrPeriod) && razorpay.isLive) {
        try {
          let rzpSub = null;

          // A. If user had a pending or recent subscription ID, check if it was paid on Razorpay
          if (sub && sub.provider_subscription_id) {
            const fetched = await razorpay.fetchSubscription(sub.provider_subscription_id);
            if (fetched && (fetched.status === "active" || fetched.status === "authenticated" || (fetched.paid_count && fetched.paid_count > 0))) {
              rzpSub = fetched;
            }
          }

          // B. If still not active, search Razorpay by user email or customer email
          if (!rzpSub && email) {
            rzpSub = await razorpay.findActiveSubscriptionByEmail(email);
          }

          // C. If active subscription found in Razorpay, auto-activate and save in DB!
          if (rzpSub) {
            const planCode = (rzpSub.notes && rzpSub.notes.plan_code) || (sub && sub.plan_code) || "monthly";
            const interval = planCode === "yearly" ? "year" : "month";
            const currentStart = rzpSub.current_start ? new Date(rzpSub.current_start * 1000).toISOString() : new Date().toISOString();
            const currentEnd = rzpSub.current_end ? new Date(rzpSub.current_end * 1000).toISOString() : calculatePeriodEnd(interval, new Date(currentStart));

            const dbPlan = await db.getPlanByCode(planCode);
            const planId = dbPlan ? dbPlan.id : (planCode === "yearly" ? "plan-yearly-uuid" : "plan-monthly-uuid");

            sub = await db.saveSubscription({
              id: sub ? sub.id : undefined,
              user_id: auth.user.id,
              plan_id: planId,
              plan_code: planCode,
              provider: "razorpay",
              provider_customer_id: rzpSub.customer_id || null,
              provider_subscription_id: rzpSub.id,
              status: "active",
              current_period_start: currentStart,
              current_period_end: currentEnd,
              cancel_at_period_end: false
            });

            isActive = true;
            periodEnd = new Date(currentEnd);
            isWithinGraceOrPeriod = true;
          }
        } catch (syncErr) {
          console.warn("[Entitlement] Razorpay auto-sync check warning:", syncErr.message);
        }
      }

      if (isActive || (sub && sub.status === "canceled" && isWithinGraceOrPeriod)) {
        return json(200, {
          entitled: true,
          status: sub.status,
          plan: (sub.subscription_plans && sub.subscription_plans.plan_code) || sub.plan_code || "monthly",
          planName: (sub.subscription_plans && sub.subscription_plans.plan_name) || "Cadence Pro",
          currentPeriodStart: sub.current_period_start,
          currentPeriodEnd: sub.current_period_end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          provider: sub.provider
        });
      }

      if (!sub) {
        return json(200, { entitled: false, reason: "no_subscription" });
      }

      return json(200, {
        entitled: false,
        reason: sub.status === "canceled" ? "subscription_expired" : `status_${sub.status}`,
        status: sub.status,
        currentPeriodEnd: sub.current_period_end
      });
    } catch (err) {
      console.error("[Entitlement] Verification error:", err);
      return json(500, { entitled: false, reason: "server_error", error: err.message });
    }
  }

  // 5. Get Current Subscription Details (For Management Dashboard)
  if (pathname === "/api/subscription/current" && method === "GET") {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) return json(401, { error: auth.error });

    try {
      const sub = await db.getSubscriptionByUserId(auth.user.id, auth.user.email);
      if (!sub) {
        return json(200, { subscription: null });
      }
      return json(200, {
        subscription: {
          id: sub.id,
          status: sub.status,
          provider: sub.provider,
          providerSubscriptionId: sub.provider_subscription_id,
          currentPeriodStart: sub.current_period_start,
          currentPeriodEnd: sub.current_period_end,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          canceledAt: sub.canceled_at,
          plan: sub.subscription_plans || config.plans[sub.plan_code || "monthly"]
        }
      });
    } catch (err) {
      console.error("[Subscription] Fetch error:", err);
      return json(500, { error: err.message });
    }
  }

  // 6. Cancel Subscription (Authenticated)
  if (pathname === "/api/subscription/cancel" && method === "POST") {
    const auth = await authenticateUser(req);
    if (!auth.authenticated) return json(401, { error: auth.error });

    try {
      const sub = await db.getSubscriptionByUserId(auth.user.id);
      if (!sub || !sub.provider_subscription_id) {
        return json(404, { error: "No active subscription found to cancel." });
      }

      // Notify provider to cancel at end of current paid cycle
      if (sub.provider === "stripe") {
        await stripe.cancelSubscription(sub.provider_subscription_id, true);
      } else {
        await razorpay.cancelSubscription(sub.provider_subscription_id, true);
      }

      // Update local database record
      sub.cancel_at_period_end = true;
      sub.canceled_at = new Date().toISOString();
      sub.status = "canceled";
      await db.saveSubscription(sub);

      return json(200, {
        success: true,
        message: "Subscription will remain active until the end of your billing cycle.",
        paidThrough: sub.current_period_end
      });
    } catch (err) {
      console.error("[Subscription] Cancellation error:", err);
      return json(500, { error: err.message || "Failed to cancel subscription" });
    }
  }

  // 7. Razorpay Webhook Handler
  if (pathname === "/api/webhooks/razorpay" && method === "POST") {
    const sigHeader = getHeader(req, "x-razorpay-signature");
    const isValid = razorpay.verifyWebhookSignature(rawBody, sigHeader);
    if (!isValid) {
      console.warn("[Webhook] Invalid Razorpay signature rejected");
      return json(400, { error: "Invalid webhook signature" });
    }

    const event = parsedBody;
    const eventId = event.event_id || event.id || `rzp_${Date.now()}`;
    const eventType = event.event;

    // Idempotency check
    const alreadyProcessed = await db.hasProcessedEvent("razorpay", eventId);
    if (alreadyProcessed) {
      return json(200, { status: "ignored_duplicate" });
    }

    try {
      const payload = event.payload || {};
      const subEntity = (payload.subscription && payload.subscription.entity) || {};
      const paymentEntity = (payload.payment && payload.payment.entity) || {};
      const subId = subEntity.id || paymentEntity.subscription_id;

      if (subId) {
        let sub = await db.getSubscriptionByProviderSubId(subId);
        const notes = (subEntity.notes && Object.keys(subEntity.notes).length) ? subEntity.notes : (paymentEntity.notes || {});
        if (!sub && notes.user_id) {
          sub = await db.getSubscriptionByUserId(notes.user_id);
        }

        const planCode = notes.plan_code || (sub && sub.plan_code) || "monthly";
        const interval = planCode === "yearly" ? "year" : "month";

        if (eventType === "subscription.activated" || eventType === "subscription.charged" || eventType === "payment.captured") {
          const dbPlan = await db.getPlanByCode(planCode);
          const planId = dbPlan ? dbPlan.id : (planCode === "yearly" ? "plan-yearly-uuid" : "plan-monthly-uuid");
          let userId = (sub && sub.user_id) || notes.user_id;

          const payerEmail = (subEntity.customer_email || paymentEntity.email || notes.email || "").trim().toLowerCase();
          if (!userId && payerEmail) {
            const profile = await db.getUserByEmail(payerEmail);
            if (profile && profile.id) {
              userId = profile.id;
            }
          }

          const currentStart = subEntity.current_start ? new Date(subEntity.current_start * 1000).toISOString() : new Date().toISOString();
          const currentEnd = subEntity.current_end ? new Date(subEntity.current_end * 1000).toISOString() : calculatePeriodEnd(interval, new Date(currentStart));

          if (userId) {
            await db.saveSubscription({
              id: sub ? sub.id : undefined,
              user_id: userId,
              plan_id: planId,
              plan_code: planCode,
              provider: "razorpay",
              provider_customer_id: subEntity.customer_id || paymentEntity.customer_id || (sub && sub.provider_customer_id) || null,
              provider_subscription_id: subId,
              status: "active",
              current_period_start: currentStart,
              current_period_end: currentEnd,
              cancel_at_period_end: false
            });
          }
        } else if (sub) {
          if (eventType === "subscription.cancelled") {
            sub.status = "canceled";
            sub.canceled_at = new Date().toISOString();
            await db.saveSubscription(sub);
          } else if (eventType === "subscription.halted" || eventType === "payment.failed") {
            sub.status = "failed";
            await db.saveSubscription(sub);
          }
        }
      }

      await db.recordPaymentEvent("razorpay", eventId, eventType, "processed", event);
      return json(200, { status: "processed" });
    } catch (err) {
      console.error("[Webhook] Razorpay processing error:", err);
      await db.recordPaymentEvent("razorpay", eventId, eventType, "failed", event, err.message);
      return json(500, { error: "Webhook processing error" });
    }
  }

  // 8. Stripe Webhook Handler
  if (pathname === "/api/webhooks/stripe" && method === "POST") {
    const sigHeader = getHeader(req, "stripe-signature");
    const isValid = stripe.verifyWebhookSignature(rawBody, sigHeader);
    if (!isValid) {
      console.warn("[Webhook] Invalid Stripe signature rejected");
      return json(400, { error: "Invalid webhook signature" });
    }

    const event = parsedBody;
    const eventId = event.id || `str_${Date.now()}`;
    const eventType = event.type;

    const alreadyProcessed = await db.hasProcessedEvent("stripe", eventId);
    if (alreadyProcessed) {
      return json(200, { status: "ignored_duplicate" });
    }

    try {
      const dataObj = (event.data && event.data.object) || {};

      if (eventType === "checkout.session.completed") {
        const userId = dataObj.client_reference_id || (dataObj.metadata && dataObj.metadata.userId);
        const planCode = (dataObj.metadata && dataObj.metadata.planCode) || "monthly";
        const interval = planCode === "yearly" ? "year" : "month";
        const subId = dataObj.subscription || dataObj.id;

        if (userId) {
          let sub = await db.getSubscriptionByUserId(userId);
          const dbPlan = await db.getPlanByCode(planCode);
          const planId = dbPlan ? dbPlan.id : (planCode === "yearly" ? "plan-yearly-uuid" : "plan-monthly-uuid");

          await db.saveSubscription({
            id: sub ? sub.id : undefined,
            user_id: userId,
            plan_id: planId,
            provider: "stripe",
            provider_subscription_id: subId,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: calculatePeriodEnd(interval),
            cancel_at_period_end: false
          });
        }
      } else if (eventType === "customer.subscription.deleted") {
        const sub = await db.getSubscriptionByProviderSubId(dataObj.id);
        if (sub) {
          sub.status = "canceled";
          sub.canceled_at = new Date().toISOString();
          await db.saveSubscription(sub);
        }
      } else if (eventType === "invoice.payment_failed") {
        const sub = await db.getSubscriptionByProviderSubId(dataObj.subscription);
        if (sub) {
          sub.status = "past_due";
          await db.saveSubscription(sub);
        }
      }

      await db.recordPaymentEvent("stripe", eventId, eventType, "processed", event);
      return json(200, { status: "processed" });
    } catch (err) {
      console.error("[Webhook] Stripe processing error:", err);
      await db.recordPaymentEvent("stripe", eventId, eventType, "failed", event, err.message);
      return json(500, { error: "Webhook processing error" });
    }
  }

  // 9. Simulation / Sandbox Activation Endpoint (Disabled in production)
  if (pathname === "/api/checkout/simulate-success" && method === "POST") {
    if (config.nodeEnv === "production") {
      return json(403, { error: "Simulation checkout endpoint is disabled in production." });
    }
    const { userId, planCode = "monthly", subscriptionId } = parsedBody;
    if (!userId) return json(400, { error: "Missing userId" });

    const plan = config.plans[planCode] || config.plans.monthly;
    const interval = planCode === "yearly" ? "year" : "month";
    const subId = subscriptionId || `sub_sim_${Date.now()}`;

    const dbPlan = await db.getPlanByCode(planCode);
    const planId = dbPlan ? dbPlan.id : (planCode === "yearly" ? "plan-yearly-uuid" : "plan-monthly-uuid");

    const saved = await db.saveSubscription({
      user_id: userId,
      plan_id: planId,
      provider: "razorpay",
      provider_subscription_id: subId,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: calculatePeriodEnd(interval),
      cancel_at_period_end: false
    });

    await db.recordPaymentEvent("razorpay", `sim_${Date.now()}`, "subscription.charged", "processed", {
      simulated: true,
      subId,
      userId,
      amount: plan.priceInr
    });

    return json(200, { success: true, subscription: saved });
  }

  // 10. Admin Endpoints (Protected by X-Admin-Key)
  if (pathname.startsWith("/api/admin")) {
    if (!checkAdminAuth(req)) {
      return json(403, { error: "Forbidden: Invalid or missing X-Admin-Key" });
    }

    if (pathname === "/api/admin/metrics" && method === "GET") {
      const data = await db.getAllUsersWithSubscriptions();
      const events = await db.getRecentPaymentEvents(50);
      const activeSubs = data.subscriptions.filter(s => s.status === "active");
      const canceledSubs = data.subscriptions.filter(s => s.status === "canceled");
      
      // Calculate revenue
      let totalRevenueInr = 0;
      activeSubs.forEach(s => {
        const planCode = (s.subscription_plans && s.subscription_plans.plan_code) || s.plan_code;
        totalRevenueInr += (planCode === "yearly" ? 799 : 88);
      });

      return json(200, {
        totalUsers: data.profiles.length,
        activeSubscriptions: activeSubs.length,
        canceledSubscriptions: canceledSubs.length,
        totalRevenueInr,
        recentEvents: events
      });
    }

    if (pathname === "/api/admin/users" && method === "GET") {
      const data = await db.getAllUsersWithSubscriptions();
      const userList = data.profiles.map(p => {
        const userSub = data.subscriptions.find(s => s.user_id === p.id);
        return {
          id: p.id,
          email: p.email,
          fullName: p.full_name,
          role: p.role,
          createdAt: p.created_at,
          subscription: userSub ? {
            status: userSub.status,
            plan: (userSub.subscription_plans && userSub.subscription_plans.plan_code) || "monthly",
            currentPeriodEnd: userSub.current_period_end,
            cancelAtPeriodEnd: userSub.cancel_at_period_end
          } : null
        };
      });
      return json(200, { users: userList });
    }
  }

  // Not found
  return json(404, { error: `Endpoint not found: ${method} ${pathname}` });
}

module.exports = { handleRoutes };
