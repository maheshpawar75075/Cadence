// ============================================================================
// Cadence SaaS UI: Modals, Paywalls, Auth Screens & Subscription Manager
// ============================================================================
(function (global) {
  "use strict";
  const FL = global.FL = global.FL || {};

  class SaasUI {
    constructor() {
      this.activeModal = null;
      this.ensureStyles();
    }

    ensureStyles() {
      if (document.getElementById("cadence-saas-styles")) return;
      const style = document.createElement("style");
      style.id = "cadence-saas-styles";
      style.textContent = `
        .saas-overlay {
          position: fixed;
          inset: 0;
          background: rgba(7, 10, 19, 0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: saasFadeIn 0.25s ease-out;
        }
        @keyframes saasFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .saas-modal-card {
          background: #121829;
          border: 1px solid #232d48;
          border-radius: 20px;
          width: 100%;
          max-width: 580px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 40px rgba(108, 92, 231, 0.15);
          color: #f8fafc;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .saas-modal-header {
          padding: 24px 28px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .saas-brand-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .saas-brand-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #6C5CE7;
          box-shadow: 0 0 12px #6C5CE7;
        }
        .saas-brand-title {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }
        .saas-close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 22px;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .saas-close-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .saas-modal-body {
          padding: 24px 28px;
          max-height: 80vh;
          overflow-y: auto;
        }
        /* Auth Styles */
        .saas-auth-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid #232d48;
          padding-bottom: 12px;
        }
        .saas-auth-tab {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .saas-auth-tab.active {
          background: rgba(108, 92, 231, 0.2);
          color: #a29bfe;
        }
        .saas-form-group {
          margin-bottom: 16px;
        }
        .saas-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #cbd5e1;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .saas-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 10px;
          background: #0a0d17;
          border: 1px solid #232d48;
          color: #fff;
          font-size: 14px;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
        }
        .saas-input:focus {
          border-color: #6C5CE7;
          box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.25);
        }
        .saas-btn {
          width: 100%;
          padding: 13px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .saas-btn-primary {
          background: #6C5CE7;
          color: #fff;
        }
        .saas-btn-primary:hover {
          background: #5b4bd9;
          transform: translateY(-1px);
        }
        .saas-btn-google {
          background: #ffffff;
          color: #1e293b;
          margin-top: 10px;
        }
        .saas-btn-google:hover {
          background: #f1f5f9;
        }
        .saas-btn-outline {
          background: transparent;
          border: 1px solid #232d48;
          color: #cbd5e1;
        }
        .saas-btn-outline:hover {
          border-color: #475569;
          color: #fff;
        }
        .saas-btn-danger {
          background: #ef4444;
          color: #fff;
        }
        .saas-btn-danger:hover {
          background: #dc2626;
        }
        .saas-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 18px 0;
          color: #64748b;
          font-size: 12px;
        }
        .saas-divider::before, .saas-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #232d48;
        }
        .saas-divider span {
          padding: 0 10px;
        }
        .saas-alert {
          padding: 12px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 16px;
          display: none;
        }
        .saas-alert.error {
          display: block;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }
        .saas-alert.success {
          display: block;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #86efac;
        }
        /* Pricing Cards */
        .saas-pricing-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 16px 0 24px;
        }
        @media (max-width: 520px) {
          .saas-pricing-grid { grid-template-columns: 1fr; }
        }
        .saas-plan-card {
          background: #0d1222;
          border: 1px solid #232d48;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.25s ease;
        }
        .saas-plan-card.featured {
          border-color: #6C5CE7;
          background: linear-gradient(180deg, rgba(108, 92, 231, 0.08) 0%, #0d1222 100%);
          box-shadow: 0 0 24px rgba(108, 92, 231, 0.2);
        }
        .saas-plan-badge {
          position: absolute;
          top: -11px;
          right: 16px;
          background: #6C5CE7;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .saas-plan-tag {
          font-size: 11px;
          font-weight: 700;
          color: #a29bfe;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 4px;
        }
        .saas-plan-name {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .saas-plan-price-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 4px;
        }
        .saas-plan-price {
          font-size: 32px;
          font-weight: 800;
          color: #fff;
        }
        .saas-plan-period {
          font-size: 13px;
          color: #94a3b8;
        }
        .saas-plan-savings {
          font-size: 11px;
          color: #10b981;
          font-weight: 600;
          margin-bottom: 16px;
          min-height: 16px;
        }
        .saas-plan-features {
          list-style: none;
          padding: 0;
          margin: 0 0 20px;
          flex-grow: 1;
        }
        .saas-plan-features li {
          font-size: 12px;
          color: #cbd5e1;
          margin-bottom: 8px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.4;
        }
        .saas-plan-features li span.check {
          color: #10b981;
          font-weight: bold;
        }
        .saas-footer-links {
          display: flex;
          justify-content: center;
          gap: 16px;
          font-size: 12px;
          color: #64748b;
          margin-top: 16px;
        }
        .saas-footer-links a {
          color: #94a3b8;
          text-decoration: none;
          cursor: pointer;
        }
        .saas-footer-links a:hover {
          color: #fff;
          text-decoration: underline;
        }
        /* Spinner */
        .saas-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: saasSpin 0.7s linear infinite;
        }
        @keyframes saasSpin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    closeModal() {
      if (this.activeModal) {
        this.activeModal.remove();
        this.activeModal = null;
      }
    }

    // --- 1. Authentication Modal ---
    showAuthModal(onSuccess = null) {
      this.closeModal();
      const overlay = document.createElement("div");
      overlay.className = "saas-overlay";

      overlay.innerHTML = `
        <div class="saas-modal-card" style="max-width: 440px;">
          <div class="saas-modal-header">
            <div class="saas-brand-wrap">
              <div class="saas-brand-dot"></div>
              <div class="saas-brand-title">Cadence SaaS Account</div>
            </div>
            <button class="saas-close-btn" id="saasCloseAuth">×</button>
          </div>
          <div class="saas-modal-body">
            <div class="saas-auth-tabs">
              <button class="saas-auth-tab active" id="tabLogin">Sign In</button>
              <button class="saas-auth-tab" id="tabRegister">Create Account</button>
            </div>

            <div id="saasAuthAlert" class="saas-alert"></div>

            <form id="saasAuthForm">
              <div class="saas-form-group" id="groupFullName" style="display:none;">
                <label class="saas-label">Full Name</label>
                <input type="text" class="saas-input" id="authFullName" placeholder="Your name">
              </div>
              <div class="saas-form-group">
                <label class="saas-label">Email Address</label>
                <input type="email" class="saas-input" id="authEmail" placeholder="you@domain.com" required>
              </div>
              <div class="saas-form-group">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                  <label class="saas-label" style="margin-bottom:0;">Password</label>
                  <a href="#" id="linkForgotPassword" style="font-size:11px; color:#a29bfe; text-decoration:none;">Forgot?</a>
                </div>
                <input type="password" class="saas-input" id="authPassword" placeholder="••••••••" required minlength="6">
              </div>

              <button type="submit" class="saas-btn saas-btn-primary" id="btnSubmitAuth">
                <span>Sign In</span>
              </button>
            </form>

            <div class="saas-divider"><span>OR CONTINUE WITH</span></div>

            <button type="button" class="saas-btn saas-btn-google" id="btnGoogleAuth">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
              <span>Continue with Google</span>
            </button>

            <div class="saas-footer-links">
              <a id="linkTermsAuth">Terms</a>
              <span>•</span>
              <a id="linkPrivacyAuth">Privacy Policy</a>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      this.activeModal = overlay;

      let mode = "login"; // 'login' or 'register'
      const alertBox = overlay.querySelector("#saasAuthAlert");
      const tabLogin = overlay.querySelector("#tabLogin");
      const tabRegister = overlay.querySelector("#tabRegister");
      const groupFullName = overlay.querySelector("#groupFullName");
      const btnSubmit = overlay.querySelector("#btnSubmitAuth");
      const authForm = overlay.querySelector("#saasAuthForm");
      const btnGoogle = overlay.querySelector("#btnGoogleAuth");

      overlay.querySelector("#saasCloseAuth").onclick = () => this.closeModal();

      tabLogin.onclick = () => {
        mode = "login";
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
        groupFullName.style.display = "none";
        btnSubmit.querySelector("span").textContent = "Sign In";
        alertBox.style.display = "none";
      };

      tabRegister.onclick = () => {
        mode = "register";
        tabRegister.classList.add("active");
        tabLogin.classList.remove("active");
        groupFullName.style.display = "block";
        btnSubmit.querySelector("span").textContent = "Create Account";
        alertBox.style.display = "none";
      };

      authForm.onsubmit = async (e) => {
        e.preventDefault();
        alertBox.style.display = "none";
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<div class="saas-spinner"></div><span>Processing...</span>`;

        const email = overlay.querySelector("#authEmail").value;
        const password = overlay.querySelector("#authPassword").value;
        const fullName = overlay.querySelector("#authFullName").value;

        try {
          if (mode === "register") {
            await FL.saasClient.signUp(email, password, fullName);
          } else {
            await FL.saasClient.signIn(email, password);
          }
          this.closeModal();
          if (onSuccess) onSuccess();
        } catch (err) {
          alertBox.className = "saas-alert error";
          alertBox.textContent = err.message;
          alertBox.style.display = "block";
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = `<span>${mode === "register" ? "Create Account" : "Sign In"}</span>`;
        }
      };

      btnGoogle.onclick = async () => {
        btnGoogle.disabled = true;
        btnGoogle.innerHTML = `<div class="saas-spinner"></div><span>Connecting to Google...</span>`;
        try {
          await FL.saasClient.signInWithGoogle();
          this.closeModal();
          if (onSuccess) onSuccess();
        } catch (err) {
          alertBox.className = "saas-alert error";
          alertBox.textContent = err.message;
          alertBox.style.display = "block";
          btnGoogle.disabled = false;
          btnGoogle.innerHTML = `<span>Continue with Google</span>`;
        }
      };

      overlay.querySelector("#linkForgotPassword").onclick = async (e) => {
        e.preventDefault();
        const email = prompt("Enter your registered email address for password recovery:");
        if (!email) return;
        try {
          await FL.saasClient.resetPassword(email);
          alert("A password recovery link has been sent to your email.");
        } catch (err) {
          alert("Error: " + err.message);
        }
      };

      overlay.querySelector("#linkTermsAuth").onclick = () => this.showTermsModal();
      overlay.querySelector("#linkPrivacyAuth").onclick = () => this.showPrivacyModal();
    }

    // --- 2. Pricing & Subscription Paywall Modal ---
    async showPricingModal(options = {}) {
      this.closeModal();
      const overlay = document.createElement("div");
      overlay.className = "saas-overlay";

      const plans = await FL.saasClient.getPlans();
      const monthly = plans.find(p => p.code === "monthly") || plans[0];
      const yearly = plans.find(p => p.code === "yearly") || plans[1];
      const user = await FL.saasClient.getUser();

      overlay.innerHTML = `
        <div class="saas-modal-card" style="max-width: 620px;">
          <div class="saas-modal-header">
            <div class="saas-brand-wrap">
              <div class="saas-brand-dot"></div>
              <div class="saas-brand-title">Upgrade to Cadence Pro</div>
            </div>
            ${user ? `<button class="saas-close-btn" id="saasClosePricing">×</button>` : ""}
          </div>
          <div class="saas-modal-body">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 6px;">Choose Your Cadence Pro Plan</h2>
              <p style="font-size: 13px; color: #94a3b8;">
                Cadence is a 100% paid SaaS workspace. Uncompromising focus, 4K dashboards, and habit mastery.
              </p>
            </div>

            <div id="pricingAlert" class="saas-alert"></div>

            <div class="saas-pricing-grid">
              <!-- Monthly Card -->
              <div class="saas-plan-card">
                <div class="saas-plan-tag">MONTHLY</div>
                <div class="saas-plan-name">Pro Monthly</div>
                <div class="saas-plan-price-row">
                  <div class="saas-plan-price">₹88</div>
                  <div class="saas-plan-period">/ month</div>
                </div>
                <div class="saas-plan-savings">Billed monthly recurring</div>
                <ul class="saas-plan-features">
                  <li><span class="check">✓</span><span>Full access to all extension features</span></li>
                  <li><span class="check">✓</span><span>4K wallpapers & focus soundscapes</span></li>
                  <li><span class="check">✓</span><span>Cadence AI habit coach</span></li>
                  <li><span class="check">✓</span><span>Monthly recurring billing · Cancel anytime</span></li>
                </ul>
                <button class="saas-btn saas-btn-outline" id="btnSubscribeMonthly">Subscribe Monthly</button>
              </div>

              <!-- Yearly Card -->
              <div class="saas-plan-card featured">
                <div class="saas-plan-badge">Yearly Plan</div>
                <div class="saas-plan-tag">ANNUAL</div>
                <div class="saas-plan-name">Pro Yearly</div>
                <div class="saas-plan-price-row">
                  <div class="saas-plan-price">₹799</div>
                  <div class="saas-plan-period">/ year</div>
                </div>
                <div class="saas-plan-savings">Save ₹257 per year vs monthly (₹66/mo)</div>
                <ul class="saas-plan-features">
                  <li><span class="check">✓</span><span>Everything included in Monthly</span></li>
                  <li><span class="check">✓</span><span>Lowest annual recurring rate</span></li>
                  <li><span class="check">✓</span><span>Uninterrupted 12-month focus access</span></li>
                  <li><span class="check">✓</span><span>Automatic renewal · Cancel anytime</span></li>
                </ul>
                <button class="saas-btn saas-btn-primary" id="btnSubscribeYearly">Subscribe Yearly</button>
              </div>
            </div>

            <div style="background: rgba(255,255,255,0.02); border: 1px solid #232d48; border-radius: 12px; padding: 14px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
              🔒 <b>Billing & Cancellation Policy:</b> All charges are in INR. Subscriptions renew automatically until cancelled. You can cancel at any time from your settings; access remains active until the end of your prepaid period. No hidden fees or lock-ins.
            </div>

            <div style="text-align: center; margin: 12px 0 4px;">
              <button id="btnRestorePurchase" style="background: rgba(108, 92, 231, 0.12); border: 1px solid rgba(108, 92, 231, 0.4); color: #c7d2fe; font-size: 12px; font-weight: 600; padding: 8px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                🔄 Already paid? Restore / Verify Subscription
              </button>
            </div>

            <div class="saas-footer-links">
              <a id="linkTermsPricing">Terms of Service</a>
              <span>•</span>
              <a id="linkPrivacyPricing">Privacy Policy</a>
              <span>•</span>
              <a id="linkSupportPricing">Support & Help</a>
              ${user ? `<span>•</span><a id="linkSignOutPricing">Sign Out (${user.email})</a>` : ""}
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      this.activeModal = overlay;

      const alertBox = overlay.querySelector("#pricingAlert");
      const btnMonthly = overlay.querySelector("#btnSubscribeMonthly");
      const btnYearly = overlay.querySelector("#btnSubscribeYearly");

      const closeBtn = overlay.querySelector("#saasClosePricing");
      if (closeBtn) closeBtn.onclick = () => this.closeModal();

      const btnRestore = overlay.querySelector("#btnRestorePurchase");
      if (btnRestore) {
        btnRestore.onclick = async () => {
          btnRestore.disabled = true;
          btnRestore.textContent = "Checking subscription status...";
          try {
            await FL.saasClient.refreshSession();
            const ent = await FL.saasClient.verifyEntitlement();
            if (ent && ent.entitled) {
              if (window.FL && FL.saasGate) {
                FL.saasGate.isEntitled = true;
                FL.saasGate.unblockContent();
              }
              this.showPaymentSuccessModal(ent);
              return;
            }
            alertBox.className = "saas-alert";
            alertBox.style.display = "block";
            alertBox.style.background = "rgba(234, 179, 8, 0.12)";
            alertBox.style.color = "#fef08a";
            alertBox.style.border = "1px solid rgba(234, 179, 8, 0.3)";
            alertBox.textContent = "No active subscription found yet for this account. If you just paid, please allow a few seconds for payment confirmation, or verify your signed-in account.";
            btnRestore.disabled = false;
            btnRestore.textContent = "🔄 Re-check Subscription Status";
          } catch (e) {
            btnRestore.disabled = false;
            btnRestore.textContent = "🔄 Already paid? Restore / Verify Subscription";
            alertBox.className = "saas-alert error";
            alertBox.textContent = "Check error: " + e.message;
            alertBox.style.display = "block";
          }
        };
      }

      const handleSubscribe = async (planCode) => {
        const currentUser = await FL.saasClient.getUser();
        if (!currentUser) {
          this.showAuthModal(() => this.showPricingModal());
          return;
        }

        const targetBtn = planCode === "yearly" ? btnYearly : btnMonthly;
        targetBtn.disabled = true;
        targetBtn.innerHTML = `<div class="saas-spinner"></div><span>Checking Status...</span>`;

        try {
          // Check if already entitled before creating another subscription session
          await FL.saasClient.refreshSession();
          const existingEnt = await FL.saasClient.verifyEntitlement();
          if (existingEnt && existingEnt.entitled) {
            if (window.FL && FL.saasGate) {
              FL.saasGate.isEntitled = true;
              FL.saasGate.unblockContent();
            }
            this.showPaymentSuccessModal(existingEnt);
            return;
          }

          targetBtn.innerHTML = `<div class="saas-spinner"></div><span>Securing Checkout...</span>`;
          const checkout = await FL.saasClient.createCheckout(planCode, "razorpay");
          if (checkout.checkoutUrl) {
            // Open provider's secure checkout in a new browser tab
            if (global.chrome && chrome.tabs && chrome.tabs.create) {
              chrome.tabs.create({ url: checkout.checkoutUrl });
            } else {
              window.open(checkout.checkoutUrl, "_blank");
            }
            this.showVerificationPendingModal(checkout.subscriptionId || checkout.sessionId, planCode);
          }
        } catch (err) {
          alertBox.className = "saas-alert error";
          alertBox.textContent = "Checkout Error: " + err.message;
          alertBox.style.display = "block";
          targetBtn.disabled = false;
          targetBtn.textContent = planCode === "yearly" ? "Subscribe Yearly" : "Subscribe Monthly";
        }
      };

      btnMonthly.onclick = () => handleSubscribe("monthly");
      btnYearly.onclick = () => handleSubscribe("yearly");

      overlay.querySelector("#linkTermsPricing").onclick = () => this.showTermsModal();
      overlay.querySelector("#linkPrivacyPricing").onclick = () => this.showPrivacyModal();
      overlay.querySelector("#linkSupportPricing").onclick = () => this.showSupportModal();

      const signOutLink = overlay.querySelector("#linkSignOutPricing");
      if (signOutLink) {
        signOutLink.onclick = async () => {
          await FL.saasClient.signOut();
          this.showAuthModal(() => this.showPricingModal());
        };
      }

      // Automatic background verification if user is already signed in
      if (user) {
        FL.saasClient.verifyEntitlement().then((ent) => {
          if (ent && ent.entitled) {
            if (this.activeModal === overlay) {
              this.closeModal();
            }
            if (window.FL && FL.saasGate) {
              FL.saasGate.isEntitled = true;
              FL.saasGate.unblockContent();
            }
          }
        }).catch(() => {});
      }
    }

    // --- 3. Checkout Verification / Pending Modal ---
    showVerificationPendingModal(subscriptionId, planCode) {
      this.closeModal();
      const overlay = document.createElement("div");
      overlay.className = "saas-overlay";

      overlay.innerHTML = `
        <div class="saas-modal-card" style="max-width: 460px; text-align: center;">
          <div class="saas-modal-header" style="justify-content: center;">
            <div class="saas-brand-title">Awaiting Payment Confirmation</div>
          </div>
          <div class="saas-modal-body" style="padding: 32px 28px;">
            <div class="saas-spinner" style="width: 40px; height: 40px; border-width: 3px; margin: 0 auto 20px; border-top-color: #6C5CE7;"></div>
            <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Verifying Your Subscription</h3>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px;">
              Please complete the authorization in your payment checkout tab. Cadence will automatically activate once your payment is verified.
            </p>

            <button class="saas-btn saas-btn-primary" id="btnCheckEntitlementNow">
              <span>Check Verification Status</span>
            </button>

            <button class="saas-btn saas-btn-outline" id="btnCancelPending" style="margin-top: 10px; border-color: transparent; color: #64748b;">
              Close & Return Later
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      this.activeModal = overlay;

      const btnCheck = overlay.querySelector("#btnCheckEntitlementNow");
      const btnCancel = overlay.querySelector("#btnCancelPending");

      // Polling for entitlement verification every 3 seconds
      let pollCount = 0;
      const pollTimer = setInterval(async () => {
        pollCount++;
        const ent = await FL.saasClient.verifyEntitlement();
        if (ent && ent.entitled) {
          clearInterval(pollTimer);
          this.showPaymentSuccessModal(ent);
        }
        if (pollCount > 60) clearInterval(pollTimer); // Stop after 3 mins
      }, 3000);

      btnCheck.onclick = async () => {
        btnCheck.disabled = true;
        btnCheck.innerHTML = `<div class="saas-spinner"></div><span>Checking...</span>`;
        const ent = await FL.saasClient.verifyEntitlement();
        if (ent && ent.entitled) {
          clearInterval(pollTimer);
          this.showPaymentSuccessModal(ent);
        } else {
          alert("Payment has not been confirmed yet. Please complete checkout or try again in a moment.");
          btnCheck.disabled = false;
          btnCheck.innerHTML = `<span>Check Verification Status</span>`;
        }
      };

      btnCancel.onclick = () => {
        clearInterval(pollTimer);
        this.closeModal();
      };
    }

    // --- 4. Payment Success Modal ---
    showPaymentSuccessModal(entitlement) {
      this.closeModal();
      const overlay = document.createElement("div");
      overlay.className = "saas-overlay";

      overlay.innerHTML = `
        <div class="saas-modal-card" style="max-width: 440px; text-align: center;">
          <div class="saas-modal-body" style="padding: 36px 28px;">
            <div style="font-size: 48px; margin-bottom: 16px;">⚡</div>
            <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px; color: #fff;">Welcome to Cadence Pro!</h2>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px;">
              Your subscription is active and verified. Every habit sprint, 4K workspace, soundscape, and AI feature is unlocked.
            </p>
            <button class="saas-btn saas-btn-primary" id="btnEnterWorkspace">
              Enter Cadence Workspace
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      this.activeModal = overlay;

      overlay.querySelector("#btnEnterWorkspace").onclick = () => {
        this.closeModal();
        window.location.reload();
      };
    }

    // --- 5. Subscription Management Modal ---
    async showManagementModal() {
      this.closeModal();
      const overlay = document.createElement("div");
      overlay.className = "saas-overlay";

      const user = await FL.saasClient.getUser();
      const sub = await FL.saasClient.getCurrentSubscription();

      const planName = (sub && sub.plan && sub.plan.name) || "Cadence Pro";
      const status = (sub && sub.status) || "active";
      const renewalDate = (sub && sub.currentPeriodEnd) ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "Active";
      const isCanceled = sub && sub.cancelAtPeriodEnd;

      overlay.innerHTML = `
        <div class="saas-modal-card" style="max-width: 500px;">
          <div class="saas-modal-header">
            <div class="saas-brand-wrap">
              <div class="saas-brand-dot"></div>
              <div class="saas-brand-title">Manage Subscription</div>
            </div>
            <button class="saas-close-btn" id="saasCloseManage">×</button>
          </div>
          <div class="saas-modal-body">
            <div style="background: rgba(255,255,255,0.03); border: 1px solid #232d48; border-radius: 14px; padding: 18px; margin-bottom: 20px;">
              <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
                <span style="color:#94a3b8; font-size:13px;">Subscriber</span>
                <strong style="font-size:13px;">${user ? user.email : "Authenticated User"}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
                <span style="color:#94a3b8; font-size:13px;">Current Plan</span>
                <strong style="color:#a29bfe; font-size:13px;">${planName}</strong>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
                <span style="color:#94a3b8; font-size:13px;">Status</span>
                <span style="color:${isCanceled ? '#f59e0b' : '#10b981'}; font-weight:600; font-size:13px;">
                  ${isCanceled ? "Cancels at period end" : (status.toUpperCase())}
                </span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:#94a3b8; font-size:13px;">${isCanceled ? "Access Valid Until" : "Next Renewal Date"}</span>
                <strong style="font-size:13px;">${renewalDate}</strong>
              </div>
            </div>

            ${!isCanceled ? `
              <button class="saas-btn saas-btn-danger" id="btnCancelSub">
                Cancel Subscription
              </button>
            ` : `
              <div style="padding:12px; border-radius:8px; background:rgba(245, 158, 11, 0.15); border:1px solid rgba(245, 158, 11, 0.3); color:#fde68a; font-size:12px; margin-bottom:16px;">
                Your subscription has been canceled and will not renew. You retain complete access to all features until <b>${renewalDate}</b>.
              </div>
              <button class="saas-btn saas-btn-primary" id="btnRenewSub">
                Re-activate Subscription
              </button>
            `}

            <div class="saas-divider"><span>ACCOUNT ACTIONS</span></div>

            <button class="saas-btn saas-btn-outline" id="btnSignOutManage">
              Sign Out of Cadence
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      this.activeModal = overlay;

      overlay.querySelector("#saasCloseManage").onclick = () => this.closeModal();

      const btnCancel = overlay.querySelector("#btnCancelSub");
      if (btnCancel) {
        btnCancel.onclick = async () => {
          const confirmed = confirm(
            `Are you sure you want to cancel your Cadence Pro subscription?\n\nYou will continue to have full access until ${renewalDate}. You will not be billed again.`
          );
          if (!confirmed) return;

          btnCancel.disabled = true;
          btnCancel.innerHTML = `<div class="saas-spinner"></div><span>Cancelling...</span>`;

          try {
            await FL.saasClient.cancelSubscription();
            alert("Subscription successfully updated. Access remains active through " + renewalDate);
            this.showManagementModal();
          } catch (err) {
            alert("Cancellation failed: " + err.message);
            btnCancel.disabled = false;
            btnCancel.textContent = "Cancel Subscription";
          }
        };
      }

      const btnRenew = overlay.querySelector("#btnRenewSub");
      if (btnRenew) {
        btnRenew.onclick = () => this.showPricingModal();
      }

      overlay.querySelector("#btnSignOutManage").onclick = async () => {
        await FL.saasClient.signOut();
        this.closeModal();
        window.location.reload();
      };
    }

    // --- 6. Terms, Privacy & Help Modals ---
    showTermsModal() {
      this.showTextModal("Terms of Service", `
        <h3>1. Subscription Model</h3>
        <p>Cadence is a 100% paid SaaS product offering monthly (₹69/month) and yearly (₹799/year) recurring plans. There is no free tier and no free trial.</p>
        <h3>2. Billing & Payments</h3>
        <p>Payments are processed securely via verified payment gateways (Razorpay / Stripe). Recurring charges are billed automatically at the beginning of each billing cycle.</p>
        <h3>3. Cancellation Policy</h3>
        <p>You can cancel your subscription at any time via the subscription management dashboard. Upon cancellation, your access remains valid through the end of your prepaid period.</p>
        <h3>4. Use of Service</h3>
        <p>Cadence provides personal habit and productivity workspace tools. You agree not to distribute or reverse engineer the software.</p>
      `);
    }

    showPrivacyModal() {
      this.showTextModal("Privacy Policy", `
        <h3>Data Collection & Privacy</h3>
        <p>Cadence takes your privacy seriously:</p>
        <ul>
          <li>We do NOT sell personal data or habit completions to third parties.</li>
          <li>Payment credentials (credit cards, UPI PINs, banking info) are processed directly by our RBI-compliant payment gateway and never touch our servers.</li>
          <li>Your habit data and personal notes are stored locally in your browser storage.</li>
          <li>Authentication tokens are securely stored and encrypted in session storage.</li>
        </ul>
      `);
    }

    showSupportModal() {
      this.showTextModal("Cadence Support & Help", `
        <h3>Need assistance with your subscription?</h3>
        <p>Our dedicated support team is available to assist you with billing, mandate management, or product questions.</p>
        <p><b>Email:</b> support@cadence.app</p>
        <p><b>Billing Queries:</b> billing@cadence.app</p>
        <p><b>Response Time:</b> Within 24 business hours.</p>
      `);
    }

    showTextModal(title, htmlContent) {
      const overlay = document.createElement("div");
      overlay.className = "saas-overlay";
      overlay.innerHTML = `
        <div class="saas-modal-card" style="max-width: 500px;">
          <div class="saas-modal-header">
            <div class="saas-brand-title">${title}</div>
            <button class="saas-close-btn" id="btnCloseText">×</button>
          </div>
          <div class="saas-modal-body" style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">
            ${htmlContent}
            <button class="saas-btn saas-btn-primary" id="btnDismissText" style="margin-top: 20px;">
              Close
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const close = () => overlay.remove();
      overlay.querySelector("#btnCloseText").onclick = close;
      overlay.querySelector("#btnDismissText").onclick = close;
    }
  }

  FL.saasUI = new SaasUI();
})(typeof window !== "undefined" ? window : globalThis);
