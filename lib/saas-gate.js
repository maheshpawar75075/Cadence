// ============================================================================
// Cadence SaaS Gate: Central Entitlement Service & Feature Protector
// ============================================================================
(function (global) {
  "use strict";
  const FL = global.FL = global.FL || {};

  class SaasGate {
    constructor() {
      this.isEntitled = false;
      this.currentEntitlement = null;
      this.initListeners();
    }

    initListeners() {
      // Sync across all Chrome extension contexts (tabs, popups)
      if (global.chrome && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area === "local") {
            if (changes.cadence_saas_session || changes.cadence_saas_entitlement) {
              this.recheckEntitlement();
            }
          }
        });
      }
    }

    async recheckEntitlement() {
      const res = await FL.saasClient.verifyEntitlement();
      this.isEntitled = Boolean(res && res.entitled);
      this.currentEntitlement = res;

      // Update pro settings state if pro-catalog is loaded
      if (typeof FL.loadProSettings === "function" && typeof FL.saveProSettings === "function") {
        try {
          const pro = await FL.loadProSettings();
          pro.isPro = this.isEntitled;
          pro.planType = (res && res.plan) || pro.planType;
          await FL.saveProSettings(pro);
        } catch (_) {}
      }

      return res;
    }

    /**
     * Protect an entire page (e.g. newtab.html or dashboard.html)
     * If user is unauthenticated or not subscribed, hides content and shows the SaaS modal.
     */
    async protectPage(options = {}) {
      const { onEntitled = null } = options;

      // Check user session
      const user = await FL.saasClient.getUser();
      if (!user) {
        this.isEntitled = false;
        this.blockContent();
        FL.saasUI.showAuthModal(async () => {
          await this.protectPage(options);
        });
        return false;
      }

      // Authoritative verification against backend
      const ent = await this.recheckEntitlement();
      if (!ent || !ent.entitled) {
        this.isEntitled = false;
        this.blockContent();
        FL.saasUI.showPricingModal();
        return false;
      }

      // User has verified active subscription!
      this.isEntitled = true;
      this.unblockContent();
      if (typeof onEntitled === "function") {
        onEntitled(ent);
      }
      return true;
    }

    blockContent() {
      const appContainer = document.getElementById("app") || document.querySelector(".app-root") || document.querySelector("main");
      if (appContainer) {
        appContainer.style.filter = "blur(8px)";
        appContainer.style.pointerEvents = "none";
        appContainer.style.userSelect = "none";
      }
    }

    unblockContent() {
      const appContainer = document.getElementById("app") || document.querySelector(".app-root") || document.querySelector("main");
      if (appContainer) {
        appContainer.style.filter = "none";
        appContainer.style.pointerEvents = "auto";
        appContainer.style.userSelect = "auto";
      }
      FL.saasUI.closeModal();
    }
  }

  FL.saasGate = new SaasGate();
})(typeof window !== "undefined" ? window : globalThis);
