// ============================================================================
// Supabase Edge Function: Stripe Webhook Handler
// ============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const event = JSON.parse(rawBody);
  const eventId = event.id || `str_${Date.now()}`;
  const eventType = event.type;

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: existingEvent } = await supabaseAdmin
    .from("payment_events")
    .select("id")
    .eq("provider", "stripe")
    .eq("provider_event_id", eventId)
    .maybeSingle();

  if (existingEvent) {
    return new Response(JSON.stringify({ status: "ignored_duplicate" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const dataObj = event.data?.object || {};

  if (eventType === "checkout.session.completed") {
    const userId = dataObj.client_reference_id || dataObj.metadata?.userId;
    const planCode = dataObj.metadata?.planCode || "monthly";
    const subId = dataObj.subscription || dataObj.id;

    if (userId) {
      const interval = planCode === "yearly" ? "year" : "month";
      const end = new Date();
      if (interval === "year") end.setFullYear(end.getFullYear() + 1);
      else end.setMonth(end.getMonth() + 1);

      const { data: plan } = await supabaseAdmin
        .from("subscription_plans")
        .select("id")
        .eq("plan_code", planCode)
        .maybeSingle();

      await supabaseAdmin.from("subscriptions").upsert({
        user_id: userId,
        plan_id: plan?.id,
        provider: "stripe",
        provider_subscription_id: subId,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: end.toISOString(),
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
    }
  }

  await supabaseAdmin.from("payment_events").insert({
    provider: "stripe",
    provider_event_id: eventId,
    event_type: eventType,
    processing_status: "processed",
    payload: event
  });

  return new Response(JSON.stringify({ status: "processed" }), {
    headers: { "Content-Type": "application/json" }
  });
});
