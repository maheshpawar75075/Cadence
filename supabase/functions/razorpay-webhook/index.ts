// ============================================================================
// Supabase Edge Function: Razorpay Webhook Handler
// ============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");

  // Verify HMAC SHA256 signature
  if (webhookSecret && signature) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
    const calculatedHex = Array.from(new Uint8Array(sigBuf))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (calculatedHex !== signature) {
      return new Response("Invalid signature", { status: 400 });
    }
  }

  const event = JSON.parse(rawBody);
  const eventId = event.event_id || event.id || `rzp_${Date.now()}`;
  const eventType = event.event;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Idempotency check
  const { data: existingEvent } = await supabaseAdmin
    .from("payment_events")
    .select("id")
    .eq("provider", "razorpay")
    .eq("provider_event_id", eventId)
    .maybeSingle();

  if (existingEvent) {
    return new Response(JSON.stringify({ status: "ignored_duplicate" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const payload = event.payload || {};
  const subEntity = payload.subscription?.entity || {};
  const subId = subEntity.id;

  if (subId) {
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("provider_subscription_id", subId)
      .maybeSingle();

    if (sub) {
      if (eventType === "subscription.activated" || eventType === "subscription.charged") {
        const interval = subEntity.notes?.plan_code === "yearly" ? "year" : "month";
        const end = new Date();
        if (interval === "year") end.setFullYear(end.getFullYear() + 1);
        else end.setMonth(end.getMonth() + 1);

        await supabaseAdmin.from("subscriptions").update({
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: end.toISOString(),
          cancel_at_period_end: false,
          updated_at: new Date().toISOString()
        }).eq("id", sub.id);
      } else if (eventType === "subscription.cancelled") {
        await supabaseAdmin.from("subscriptions").update({
          status: "canceled",
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq("id", sub.id);
      }
    }
  }

  // Record audit log
  await supabaseAdmin.from("payment_events").insert({
    provider: "razorpay",
    provider_event_id: eventId,
    event_type: eventType,
    processing_status: "processed",
    payload: event
  });

  return new Response(JSON.stringify({ status: "processed" }), {
    headers: { "Content-Type": "application/json" }
  });
});
