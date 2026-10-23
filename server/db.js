// ============================================================================
// Cadence SaaS Database Layer (Supabase PostgREST + Local Fallback Store)
// ============================================================================
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const config = require("./config");

// Store file for durable persistence across restarts
const STORE_FILE = path.join(__dirname, "data", "cadence_store.json");

// In-memory persistent cache for mock / test / local mode
const mockStore = {
  profiles: new Map(),
  subscription_plans: new Map([
    ["monthly", {
      id: "plan-monthly-uuid",
      plan_code: "monthly",
      plan_name: config.plans.monthly.name,
      price_inr: 88,
      billing_interval: "month",
      provider_plan_id: config.plans.monthly.razorpayPlanId,
      is_active: true,
      created_at: new Date().toISOString()
    }],
    ["yearly", {
      id: "plan-yearly-uuid",
      plan_code: "yearly",
      plan_name: config.plans.yearly.name,
      price_inr: 799,
      billing_interval: "year",
      provider_plan_id: config.plans.yearly.razorpayPlanId,
      is_active: true,
      created_at: new Date().toISOString()
    }]
  ]),
  subscriptions: new Map(), // keyed by id or user_id
  payment_events: new Map() // keyed by provider_event_id
};

function loadStoreFromFile() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORE_FILE, "utf-8"));
      if (data.profiles) {
        for (const [k, v] of Object.entries(data.profiles)) mockStore.profiles.set(k, v);
      }
      if (data.subscriptions) {
        for (const [k, v] of Object.entries(data.subscriptions)) mockStore.subscriptions.set(k, v);
      }
      if (data.payment_events) {
        for (const [k, v] of Object.entries(data.payment_events)) mockStore.payment_events.set(k, v);
      }
    }
  } catch (err) {
    console.warn("[DB] Could not load persisted store:", err.message);
  }
}

function persistStoreToFile() {
  try {
    const dataDir = path.dirname(STORE_FILE);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const payload = {
      profiles: Object.fromEntries(mockStore.profiles),
      subscriptions: Object.fromEntries(mockStore.subscriptions),
      payment_events: Object.fromEntries(mockStore.payment_events),
      savedAt: new Date().toISOString()
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(payload, null, 2), "utf-8");
  } catch (err) {
    // Non-fatal if filesystem is read-only
  }
}

// Initial load on module require
loadStoreFromFile();

function toUUID(str) {
  if (!str) return crypto.randomUUID();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  const hash = crypto.createHash("md5").update(String(str)).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

class DatabaseService {
  constructor() {
    this.isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
  }

  // Generic Supabase REST Fetcher
  async #supabaseFetch(endpoint, options = {}) {
    if (!this.isSupabaseConfigured) return null;
    const url = `${config.supabaseUrl.replace(/\/+$/, "")}/rest/v1/${endpoint}`;
    const headers = {
      "apikey": config.supabaseServiceRoleKey,
      "Authorization": `Bearer ${config.supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...(options.headers || {})
    };
    try {
      const res = await fetch(url, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Supabase HTTP ${res.status}: ${errorText}`);
      }
      return await res.json();
    } catch (err) {
      if (err.message.includes("fetch failed") || (err.cause && (err.cause.code === "ENOTFOUND" || err.cause.code === "EPERM"))) {
        return null;
      }
      console.error(`[DB] Supabase fetch error (${endpoint}):`, err.message);
      throw err;
    }
  }

  // --- Profiles ---
  async getProfile(userId) {
    const safeId = toUUID(userId);
    if (this.isSupabaseConfigured) {
      const data = await this.#supabaseFetch(`profiles?id=eq.${safeId}&select=*`);
      return (data && data[0]) || null;
    }
    return mockStore.profiles.get(safeId) || null;
  }

  async getUserByEmail(email) {
    const clean = (email || "").trim().toLowerCase();
    if (this.isSupabaseConfigured) {
      const data = await this.#supabaseFetch(`profiles?email=eq.${encodeURIComponent(clean)}&select=*`);
      if (data && data[0]) return data[0];
    }
    for (const profile of mockStore.profiles.values()) {
      if (profile.email && profile.email.toLowerCase() === clean) {
        return profile;
      }
    }
    return null;
  }

  async upsertProfile(userId, profileData) {
    const safeId = toUUID(userId);
    const payload = {
      id: safeId,
      full_name: profileData.full_name || profileData.name || "",
      email: profileData.email || "",
      role: profileData.role || "user",
      password_hash: profileData.password_hash || undefined,
      updated_at: new Date().toISOString()
    };
    if (this.isSupabaseConfigured) {
      try {
        const data = await this.#supabaseFetch("profiles", {
          method: "POST",
          prefer: "resolution=merge-duplicates,return=representation",
          body: payload
        });
        if (data && data[0]) {
          const merged = { ...data[0], ...payload };
          mockStore.profiles.set(safeId, merged);
          persistStoreToFile();
          return merged;
        }
      } catch (err) {
        if (!err.message || !err.message.includes("violates foreign key constraint")) {
          throw err;
        }
      }
    }
    const existing = mockStore.profiles.get(safeId) || { created_at: new Date().toISOString() };
    const merged = { ...existing, ...payload };
    mockStore.profiles.set(safeId, merged);
    persistStoreToFile();
    return merged;
  }

  // --- Subscription Plans ---
  async getActivePlans() {
    if (this.isSupabaseConfigured) {
      const data = await this.#supabaseFetch("subscription_plans?is_active=eq.true&select=*");
      if (data && data.length) return data;
    }
    return Array.from(mockStore.subscription_plans.values()).filter(p => p.is_active);
  }

  async getPlanByCode(planCode) {
    if (this.isSupabaseConfigured) {
      const data = await this.#supabaseFetch(`subscription_plans?plan_code=eq.${planCode}&select=*`);
      if (data && data[0]) return data[0];
    }
    return mockStore.subscription_plans.get(planCode) || null;
  }

  // --- Subscriptions ---
  async getSubscriptionByUserId(userId) {
    const safeId = toUUID(userId);
    if (this.isSupabaseConfigured) {
      // Order by created_at desc to get most recent
      const data = await this.#supabaseFetch(
        `subscriptions?user_id=eq.${safeId}&order=created_at.desc&limit=1&select=*,subscription_plans(*)`
      );
      if (data && data[0]) return data[0];
    }
    // Search in mock store
    const subs = Array.from(mockStore.subscriptions.values()).filter(s => s.user_id === safeId || s.user_id === userId);
    subs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const sub = subs[0] || null;
    if (sub && !sub.subscription_plans) {
      sub.subscription_plans = mockStore.subscription_plans.get(sub.plan_code || "monthly") || null;
    }
    return sub;
  }

  async getSubscriptionByProviderSubId(providerSubId) {
    if (this.isSupabaseConfigured) {
      const data = await this.#supabaseFetch(
        `subscriptions?provider_subscription_id=eq.${providerSubId}&select=*,subscription_plans(*)`
      );
      if (data && data[0]) return data[0];
    }
    for (const sub of mockStore.subscriptions.values()) {
      if (sub.provider_subscription_id === providerSubId) return sub;
    }
    return null;
  }

  async saveSubscription(subData) {
    const id = toUUID(subData.id || crypto.randomUUID());
    const safeUserId = toUUID(subData.user_id);
    const now = new Date().toISOString();
    const existing = subData.id ? mockStore.subscriptions.get(id) : null;
    const createdAt = (existing && existing.created_at) || subData.created_at || now;

    const record = {
      id,
      user_id: safeUserId,
      plan_id: subData.plan_id,
      plan_code: subData.plan_code || "monthly",
      provider: subData.provider || "razorpay",
      provider_customer_id: subData.provider_customer_id || null,
      provider_subscription_id: subData.provider_subscription_id || null,
      status: subData.status || "created",
      current_period_start: subData.current_period_start || now,
      current_period_end: subData.current_period_end || null,
      cancel_at_period_end: Boolean(subData.cancel_at_period_end),
      canceled_at: subData.canceled_at || null,
      created_at: createdAt,
      updated_at: now
    };

    if (this.isSupabaseConfigured) {
      // Exclude virtual/local plan_code column from postgres payload
      const supabasePayload = {
        id: record.id,
        user_id: record.user_id,
        plan_id: record.plan_id,
        provider: record.provider,
        provider_customer_id: record.provider_customer_id,
        provider_subscription_id: record.provider_subscription_id,
        status: record.status,
        current_period_start: record.current_period_start,
        current_period_end: record.current_period_end,
        cancel_at_period_end: record.cancel_at_period_end,
        canceled_at: record.canceled_at,
        created_at: record.created_at,
        updated_at: record.updated_at
      };

      try {
        const data = await this.#supabaseFetch("subscriptions", {
          method: "POST",
          prefer: "resolution=merge-duplicates,return=representation",
          body: supabasePayload
        });
        if (data && data[0]) return { ...data[0], plan_code: record.plan_code };
      } catch (err) {
        if (!err.message || !err.message.includes("violates foreign key constraint")) {
          throw err;
        }
      }
    }

    mockStore.subscriptions.set(id, record);
    persistStoreToFile();
    return record;
  }

  // --- Payment Events (Audit Log & Idempotency) ---
  async hasProcessedEvent(provider, providerEventId) {
    if (this.isSupabaseConfigured) {
      try {
        const data = await this.#supabaseFetch(
          `payment_events?provider=eq.${provider}&provider_event_id=eq.${providerEventId}&select=id,processing_status`
        );
        if (data && data.length > 0) {
          return data[0].processing_status === "processed";
        }
      } catch (_) {
        // Fall back to in-memory store if network/Supabase fails
      }
    }
    const existing = mockStore.payment_events.get(`${provider}:${providerEventId}`);
    return Boolean(existing && existing.processing_status === "processed");
  }

  async recordPaymentEvent(provider, providerEventId, eventType, processingStatus, payload, errorMessage = null) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record = {
      id,
      provider,
      provider_event_id: providerEventId,
      event_type: eventType,
      processing_status: processingStatus,
      payload: typeof payload === "object" ? payload : { raw: payload },
      error_message: errorMessage,
      processed_at: now,
      created_at: now
    };

    // Always maintain in-memory mirror for local fast queries, tests, and network fallbacks
    mockStore.payment_events.set(`${provider}:${providerEventId}`, record);
    persistStoreToFile();

    if (this.isSupabaseConfigured) {
      try {
        await this.#supabaseFetch("payment_events", {
          method: "POST",
          prefer: "resolution=merge-duplicates,return=representation",
          body: record
        });
      } catch (e) {
        console.error("[DB] Failed to record payment event:", e.message);
      }
    }

    return record;
  }

  // --- Admin Queries ---
  async getAllUsersWithSubscriptions() {
    if (this.isSupabaseConfigured) {
      const profiles = await this.#supabaseFetch("profiles?select=*");
      const subscriptions = await this.#supabaseFetch("subscriptions?select=*,subscription_plans(*)");
      return { profiles: profiles || [], subscriptions: subscriptions || [] };
    }
    return {
      profiles: Array.from(mockStore.profiles.values()),
      subscriptions: Array.from(mockStore.subscriptions.values())
    };
  }

  async getRecentPaymentEvents(limit = 20) {
    if (this.isSupabaseConfigured) {
      const events = await this.#supabaseFetch(`payment_events?order=created_at.desc&limit=${limit}&select=*`);
      return events || [];
    }
    const events = Array.from(mockStore.payment_events.values());
    events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return events.slice(0, limit);
  }
}

module.exports = new DatabaseService();
