// ============================================================================
// Cadence SaaS Client: Authentication, Session Management & API Connector
// ============================================================================
(function (global) {
  "use strict";
  const FL = global.FL = global.FL || {};

  // Config defaults (can be overridden by chrome.storage or environment)
  const SAAS_CONFIG = {
    apiBaseUrl: "http://localhost:3000",
    supabaseUrl: "", // e.g. "https://your-project.supabase.co"
    supabaseAnonKey: "",
    defaultProvider: "razorpay", // 'razorpay' or 'stripe'
    storageKeys: {
      session: "cadence_saas_session",
      entitlement: "cadence_saas_entitlement",
      user: "cadence_saas_user"
    }
  };

  class SaasClient {
    constructor() {
      this.config = { ...SAAS_CONFIG };
      this.listeners = new Set();
      this.init();
    }

    async init() {
      // Load any stored settings/config overrides
      try {
        if (global.chrome && chrome.storage && chrome.storage.local) {
          const stored = await chrome.storage.local.get(["cadence_saas_config"]);
          if (stored.cadence_saas_config) {
            Object.assign(this.config, stored.cadence_saas_config);
          }
        }
      } catch (e) {
        console.warn("[SaaS Client] Failed to read config override:", e);
      }
    }

    // Storage helpers (uses chrome.storage.local or fallback to localStorage)
    async storageGet(key) {
      if (global.chrome && chrome.storage && chrome.storage.local) {
        const res = await chrome.storage.local.get([key]);
        return res[key] || null;
      }
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    }

    async storageSet(key, value) {
      if (global.chrome && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [key]: value });
        return;
      }
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (_) {}
    }

    async storageRemove(key) {
      if (global.chrome && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove([key]);
        return;
      }
      try {
        localStorage.removeItem(key);
      } catch (_) {}
    }

    // --- Authentication ---

    async getSession() {
      return await this.storageGet(this.config.storageKeys.session);
    }

    async getUser() {
      const session = await this.getSession();
      return session ? session.user : null;
    }

    async saveSession(session) {
      await this.storageSet(this.config.storageKeys.session, session);
      if (session && session.user) {
        await this.storageSet(this.config.storageKeys.user, session.user);
      }
      this.notifyListeners("auth_change", { session });
    }

    async clearSession() {
      await this.storageRemove(this.config.storageKeys.session);
      await this.storageRemove(this.config.storageKeys.user);
      await this.storageRemove(this.config.storageKeys.entitlement);
      this.notifyListeners("auth_change", { session: null });
    }

    // Sign Up with Email and Password
    async signUp(email, password, fullName = "") {
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!cleanEmail || !password || password.length < 6) {
        throw new Error("Please provide a valid email and password (minimum 6 characters).");
      }

      // 1. If Supabase is configured, use Supabase Auth API
      if (this.config.supabaseUrl && this.config.supabaseAnonKey) {
        const url = `${this.config.supabaseUrl.replace(/\/+$/, "")}/auth/v1/signup`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "apikey": this.config.supabaseAnonKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            data: { full_name: fullName }
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || data.error_description || data.message || "Sign up failed");

        if (data.access_token) {
          const session = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: {
              id: data.user.id,
              email: data.user.email,
              fullName: (data.user.user_metadata && data.user.user_metadata.full_name) || fullName
            }
          };
          await this.saveSession(session);
          return session;
        }
        return { unconfirmed: true, user: data.user };
      }

      // 2. Local standalone / demo mode
      const mockUser = {
        id: "usr_" + Math.random().toString(36).slice(2, 10),
        email: cleanEmail,
        fullName: fullName || cleanEmail.split("@")[0]
      };
      const session = {
        accessToken: `mock_${mockUser.id}:${cleanEmail}`,
        refreshToken: `ref_${mockUser.id}`,
        user: mockUser
      };
      await this.saveSession(session);
      return session;
    }

    // Sign In with Email and Password
    async signIn(email, password) {
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!cleanEmail || !password) {
        throw new Error("Please enter both email and password.");
      }

      // Supabase Auth
      if (this.config.supabaseUrl && this.config.supabaseAnonKey) {
        const url = `${this.config.supabaseUrl.replace(/\/+$/, "")}/auth/v1/token?grant_type=password`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "apikey": this.config.supabaseAnonKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email: cleanEmail, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error_description || data.msg || data.message || "Invalid credentials");

        const session = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          user: {
            id: data.user.id,
            email: data.user.email,
            fullName: (data.user.user_metadata && data.user.user_metadata.full_name) || cleanEmail.split("@")[0]
          }
        };
        await this.saveSession(session);
        return session;
      }

      // Standalone simulation mode
      const userId = "usr_" + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
      const session = {
        accessToken: `mock_${userId}:${cleanEmail}`,
        user: {
          id: userId,
          email: cleanEmail,
          fullName: cleanEmail.split("@")[0]
        }
      };
      await this.saveSession(session);
      return session;
    }

    // Google Sign-In via chrome.identity
    async signInWithGoogle() {
      if (this.config.supabaseUrl && this.config.supabaseAnonKey && global.chrome && chrome.identity && chrome.identity.launchWebAuthFlow) {
        const redirectUrl = chrome.identity.getRedirectURL();
        const authUrl = `${this.config.supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;

        const responseUrl = await new Promise((resolve, reject) => {
          chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (url) => {
            if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
            resolve(url);
          });
        });

        // Extract tokens from URL hash
        const hash = responseUrl.split("#")[1];
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (!accessToken) throw new Error("Google authentication did not return a valid session.");

        // Fetch user info with access token
        const userRes = await fetch(`${this.config.supabaseUrl}/auth/v1/user`, {
          headers: {
            "apikey": this.config.supabaseAnonKey,
            "Authorization": `Bearer ${accessToken}`
          }
        });
        const userData = await userRes.json();
        const session = {
          accessToken,
          refreshToken,
          user: {
            id: userData.id,
            email: userData.email,
            fullName: (userData.user_metadata && (userData.user_metadata.full_name || userData.user_metadata.name)) || ""
          }
        };
        await this.saveSession(session);
        return session;
      }

      // Fallback Google Sign-In simulation for development
      const mockGoogleUser = {
        id: "google_usr_" + Math.random().toString(36).slice(2, 9),
        email: "google.subscriber@gmail.com",
        fullName: "Google Verified User"
      };
      const session = {
        accessToken: `mock_${mockGoogleUser.id}:${mockGoogleUser.email}`,
        user: mockGoogleUser
      };
      await this.saveSession(session);
      return session;
    }

    // Password Reset
    async resetPassword(email) {
      const cleanEmail = (email || "").trim().toLowerCase();
      if (!cleanEmail) throw new Error("Please enter your registered email address.");

      if (this.config.supabaseUrl && this.config.supabaseAnonKey) {
        const res = await fetch(`${this.config.supabaseUrl}/auth/v1/recover`, {
          method: "POST",
          headers: {
            "apikey": this.config.supabaseAnonKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email: cleanEmail })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to send password recovery email");
        }
        return { success: true };
      }

      return { success: true, message: "If an account exists, a reset link has been dispatched." };
    }

    // Sign Out
    async signOut() {
      await this.clearSession();
    }

    // --- SaaS Billing & Checkout API ---

    async getPlans() {
      try {
        const res = await fetch(`${this.config.apiBaseUrl}/api/plans`);
        if (res.ok) {
          const data = await res.json();
          return data.plans;
        }
      } catch (err) {
        console.warn("[SaaS Client] Failed to fetch remote plans, using defaults:", err.message);
      }

      // Hardcoded fallback according to Section 1 & 5
      return [
        {
          code: "monthly",
          name: "Cadence Pro Monthly",
          priceInr: 69,
          displayPrice: "₹69",
          billingInterval: "month",
          billingPeriod: "/ month",
          tag: "MONTHLY",
          features: [
            "Full access to all extension features",
            "Monthly recurring billing",
            "Automatic renewal",
            "Secure payment via Razorpay / Stripe",
            "Cancel subscription anytime"
          ]
        },
        {
          code: "yearly",
          name: "Cadence Pro Yearly",
          priceInr: 799,
          displayPrice: "₹799",
          billingInterval: "year",
          billingPeriod: "/ year",
          tag: "YEARLY",
          badge: "Yearly Plan",
          equivalentMonthly: "₹66/mo",
          savings: "Save ₹29 per year vs monthly",
          savingsInr: 29,
          features: [
            "Everything in Monthly Plan",
            "Annual recurring billing (₹799/year)",
            "Automatic renewal",
            "Discounted yearly rate",
            "Cancel subscription anytime"
          ]
        }
      ];
    }

    // Create Checkout Session
    async createCheckout(planCode = "monthly", provider = "razorpay") {
      const session = await this.getSession();
      if (!session || !session.accessToken) {
        throw new Error("You must be logged in to subscribe.");
      }

      const res = await fetch(`${this.config.apiBaseUrl}/api/checkout/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ planCode, provider })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to initiate checkout" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      return await res.json();
    }

    // Authoritative Entitlement Check
    async verifyEntitlement() {
      const session = await this.getSession();
      if (!session || !session.accessToken) {
        return { entitled: false, reason: "unauthenticated" };
      }

      try {
        const res = await fetch(`${this.config.apiBaseUrl}/api/subscription/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`
          }
        });

        if (!res.ok) {
          return { entitled: false, reason: `http_${res.status}` };
        }

        const data = await res.json();
        // Cache entitlement for fast UI startup
        await this.storageSet(this.config.storageKeys.entitlement, {
          ...data,
          verifiedAt: Date.now()
        });
        return data;
      } catch (err) {
        console.warn("[SaaS Client] Network failure verifying entitlement:", err);
        // Check cached entitlement with grace period
        const cached = await this.storageGet(this.config.storageKeys.entitlement);
        if (cached && cached.entitled && cached.currentPeriodEnd) {
          const isNotExpired = new Date(cached.currentPeriodEnd) > new Date();
          if (isNotExpired) return { ...cached, fromCache: true };
        }
        return { entitled: false, reason: "network_error", error: err.message };
      }
    }

    // Get current subscription details
    async getCurrentSubscription() {
      const session = await this.getSession();
      if (!session || !session.accessToken) return null;

      try {
        const res = await fetch(`${this.config.apiBaseUrl}/api/subscription/current`, {
          headers: { "Authorization": `Bearer ${session.accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          return data.subscription;
        }
      } catch (e) {
        console.warn("[SaaS Client] Error fetching subscription:", e);
      }
      return null;
    }

    // Cancel subscription
    async cancelSubscription() {
      const session = await this.getSession();
      if (!session || !session.accessToken) throw new Error("Unauthenticated");

      const res = await fetch(`${this.config.apiBaseUrl}/api/subscription/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to cancel" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result = await res.json();
      await this.verifyEntitlement(); // Refresh state
      return result;
    }

    // Simulation Trigger (Used for sandbox tests and simulation checkout)
    async simulateSuccess(planCode = "monthly", subscriptionId = null) {
      const session = await this.getSession();
      if (!session || !session.user) throw new Error("Must be logged in to test simulation.");

      const res = await fetch(`${this.config.apiBaseUrl}/api/checkout/simulate-success`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          planCode,
          subscriptionId
        })
      });

      if (!res.ok) throw new Error("Simulation endpoint failed");
      const data = await res.json();
      await this.verifyEntitlement();
      return data;
    }

    // Event listener helper
    on(event, callback) {
      this.listeners.add({ event, callback });
      return () => this.listeners.delete({ event, callback });
    }

    notifyListeners(event, data) {
      for (const listener of this.listeners) {
        if (listener.event === event || listener.event === "*") {
          try {
            listener.callback(data);
          } catch (e) {
            console.error("[SaaS Client] Listener error:", e);
          }
        }
      }
    }
  }

  FL.saasClient = new SaasClient();
})(typeof window !== "undefined" ? window : globalThis);
