// ============================================================================
// Cadence SaaS Admin Console Logic
// ============================================================================
(function () {
  "use strict";

  const API_BASE = "https://cadence-abl9.onrender.com";
  let adminKey = localStorage.getItem("cadence_admin_key") || "cadence_admin_secure_secret_2026";
  let allUsers = [];

  const inputKey = document.getElementById("inputAdminKey");
  const btnConnect = document.getElementById("btnConnectAdmin");
  const connStatus = document.getElementById("connectionStatus");
  const metricsSection = document.getElementById("metricsSection");
  const usersPanel = document.getElementById("usersPanel");
  const eventsPanel = document.getElementById("eventsPanel");
  const searchInput = document.getElementById("searchUsers");

  inputKey.value = adminKey;

  async function loadAdminData() {
    connStatus.textContent = "Connecting...";
    try {
      const metricsRes = await fetch(`${API_BASE}/api/admin/metrics`, {
        headers: { "X-Admin-Key": adminKey }
      });

      if (!metricsRes.ok) {
        throw new Error(`Authentication failed (HTTP ${metricsRes.status})`);
      }

      const metrics = await metricsRes.json();
      document.getElementById("metricTotalUsers").textContent = metrics.totalUsers || 0;
      document.getElementById("metricActiveSubs").textContent = metrics.activeSubscriptions || 0;
      document.getElementById("metricTotalRevenue").textContent = `₹${metrics.totalRevenueInr || 0}`;
      document.getElementById("metricCanceledSubs").textContent = metrics.canceledSubscriptions || 0;

      // Render Events
      const eventsBody = document.getElementById("eventsTableBody");
      eventsBody.innerHTML = "";
      (metrics.recentEvents || []).forEach(ev => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><code>${ev.provider_event_id}</code></td>
          <td><strong>${(ev.provider || "").toUpperCase()}</strong></td>
          <td>${ev.event_type}</td>
          <td><span class="status-tag ${ev.processing_status === 'processed' ? 'status-active' : 'status-expired'}">${ev.processing_status}</span></td>
          <td>${new Date(ev.created_at).toLocaleString()}</td>
        `;
        eventsBody.appendChild(tr);
      });

      // Load Users
      const usersRes = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { "X-Admin-Key": adminKey }
      });
      const usersData = await usersRes.json();
      allUsers = usersData.users || [];
      renderUsers(allUsers);

      connStatus.textContent = "Connected to Server";
      connStatus.style.color = "var(--green)";
      metricsSection.style.display = "grid";
      usersPanel.style.display = "block";
      eventsPanel.style.display = "block";
      localStorage.setItem("cadence_admin_key", adminKey);

    } catch (err) {
      connStatus.textContent = "Connection Error: " + err.message;
      connStatus.style.color = "var(--red)";
      metricsSection.style.display = "none";
      usersPanel.style.display = "none";
      eventsPanel.style.display = "none";
      alert("Admin Access Denied: " + err.message);
    }
  }

  function renderUsers(users) {
    const tbody = document.getElementById("usersTableBody");
    tbody.innerHTML = "";
    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No matching users found.</td></tr>`;
      return;
    }

    users.forEach(u => {
      const sub = u.subscription;
      const statusClass = sub && sub.status === "active" ? "status-active" : (sub && sub.status === "canceled" ? "status-canceled" : "status-expired");
      const statusLabel = sub ? sub.status.toUpperCase() : "NO SUB";
      const paidThrough = sub && sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "—";
      const planName = sub ? (sub.plan === "yearly" ? "Pro Yearly (₹799)" : "Pro Monthly (₹69)") : "None";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <div style="font-weight: 600; color: #fff;">${u.fullName || "Cadence User"}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${u.email}</div>
        </td>
        <td><code>${u.role || "user"}</code></td>
        <td>${planName}</td>
        <td><span class="status-tag ${statusClass}">${statusLabel}</span></td>
        <td>${paidThrough}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  searchInput.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderUsers(allUsers);
      return;
    }
    const filtered = allUsers.filter(u => u.email.toLowerCase().includes(q) || (u.fullName && u.fullName.toLowerCase().includes(q)));
    renderUsers(filtered);
  });

  btnConnect.addEventListener("click", () => {
    adminKey = inputKey.value.trim();
    loadAdminData();
  });

  // Initial load
  if (adminKey) {
    loadAdminData();
  }
})();
