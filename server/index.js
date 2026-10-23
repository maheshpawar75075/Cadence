// ============================================================================
// Cadence SaaS Backend Server
// ============================================================================
const http = require("http");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const { handleRoutes } = require("./routes");

function serveStatic(res, filePath, contentType) {
  if (fs.existsSync(filePath)) {
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
    return true;
  }
  return false;
}

const server = http.createServer((req, res) => {
  const chunks = [];

  req.on("data", chunk => chunks.push(chunk));
  req.on("end", async () => {
    const rawBody = Buffer.concat(chunks).toString("utf-8");
    let parsedBody = {};
    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch (e) {
        // May be URL encoded or raw text
        try {
          parsedBody = Object.fromEntries(new URLSearchParams(rawBody));
        } catch (_) {}
      }
    }

    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    
    // Serve Public Product & Compliance Landing Page (for Razorpay compliance review)
    const publicPages = ["/", "/index.html", "/terms", "/privacy", "/refund", "/cancellation", "/contact"];
    if (publicPages.includes(url.pathname)) {
      const landingPath = path.join(__dirname, "landing.html");
      if (serveStatic(res, landingPath, "text/html")) return;
    }

    // Serve Checkout Simulation Page (for local / sandbox testing)
    if (url.pathname === "/checkout-simulation.html") {
      const simPath = path.join(__dirname, "checkout-simulation.html");
      if (serveStatic(res, simPath, "text/html")) return;
    }

    try {
      await handleRoutes(req, res, rawBody, parsedBody);
    } catch (err) {
      console.error("[Server Error]", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error", message: err.message }));
      }
    }
  });
});

if (require.main === module) {
  server.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Cadence SaaS Backend running on http://localhost:${config.port}`);
    console.log(`💰 Pricing: Monthly ₹${config.plans.monthly.priceInr} | Yearly ₹${config.plans.yearly.priceInr}`);
    console.log(`🔐 Supabase: ${config.supabaseUrl ? "CONFIGURED" : "LOCAL IN-MEMORY STORE"}`);
    console.log(`⚡ Razorpay: ${config.razorpay.keyId ? "CONFIGURED" : "SIMULATION MODE"}`);
    console.log(`=======================================================`);
  });
}

module.exports = server;
