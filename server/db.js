// ============================================================================
// Cadence SaaS Database Layer (Supabase PostgREST + Local Fallback Store)
// ============================================================================
const crypto = require("crypto");
const config = require("./config");

// In-memory persistent cache for mock / test / local mode
const mockStore = {
  profiles: new Map(),
  subscription_plans: new Map([
    ["monthly", {
      id: "plan-monthly-uuid",
      plan_code: "monthly",
      plan_name: config.plans.monthly.name,
      price_inr: 69,
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
      console.error(`[DB] Supabase fetch error (${endpoint}):`, err.message);
      throw err;
    }
  }

  // --- Profiles ---
  async getProfile(userId) {
    if (this.isSupabaseConfigured) {
      const data = await this.#supabaseFetch(`profiles?id=eq.${userId}&select=*`);
      return (data && data[0]) || null;
    }
    return mockStore.profiles.get(userId) || null;
  }

  async upsertProfile(userId, profileData) {
    const payload = {
      id: userId,
      full_name: profileData.full_name || profileData.name || "",
      email: profileData.email || "",
      role: profileData.role || "user",
      updated_at: new Date().toISOString()
    };
    if (this.isSupabaseConfigured) {
      const data = await this.#supabaseFetch("profiles", {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=representation",
        body: payload
      });
      return (data && data[0]) || payload;
    }
    const existing = mockStore.profiles.get(userId) || { created_at: new Date().toISOString() };
    const merged = { ...existing, ...payload };
    mockStore.profiles.set(userId, merged);
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
    if (this.isSupabaseConfigured) {
      // Order by created_at desc to get most recent
      const data = await this.#supabaseFetch(
        `subscriptions?user_id=eq.${userId}&order=created_at.desc&limit=1&select=*,subscription_plans(*)`
      );
      return (data && data[0]) || null;
    }
    // Search in mock store
    const subs = Array.from(mockStore.subscriptions.values()).filter(s => s.user_id === userId);
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
      return (data && data[0]) || null;
    }
    for (const sub of mockStore.subscriptions.values()) {
      if (sub.provider_subscription_id === providerSubId) return sub;
    }
    return null;
  }

  async saveSubscription(subData) {
    const id = subData.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const existing = subData.id ? mockStore.subscriptions.get(subData.id) : null;
    const createdAt = (existing && existing.created_at) || subData.created_at || now;

    const record = {
      id,
      user_id: subData.user_id,
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
      const data = await this.#supabaseFetch("subscriptions", {
        method: "POST",
        prefer: "resolution=merge-duplicates,return=representation",
        body: record
      });
      return (data && data[0]) || record;
    }

    mockStore.subscriptions.set(id, record);
    return record;
  }

  // --- Payment Events (Audit Log & Idempotency) ---
  async hasProcessedEvent(provider, providerEventId) {
    if (this.isSupabaseConfigured) {
      const data = await this.#supabaseFetch(
        `payment_events?provider=eq.${provider}&provider_event_id=eq.${providerEventId}&select=id,processing_status`
      );
      return Boolean(data && data.length > 0 && data[0].processing_status === "processed");
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
      return record;
    }

    mockStore.payment_events.set(`${provider}:${providerEventId}`, record);
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
