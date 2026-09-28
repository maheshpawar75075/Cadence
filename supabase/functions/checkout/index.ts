// ============================================================================
// Supabase Edge Function: Checkout Session Creator
// ============================================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { planCode = "monthly", provider = "razorpay" } = await req.json();
    const plans: Record<string, { priceInr: number; razorpayPlanId: string; stripePriceId: string }> = {
      monthly: {
        priceInr: 69,
        razorpayPlanId: Deno.env.get("RAZORPAY_PLAN_MONTHLY_ID") || "plan_monthly_69inr",
        stripePriceId: Deno.env.get("STRIPE_PRICE_MONTHLY_ID") || "price_monthly_69inr"
      },
      yearly: {
        priceInr: 799,
        razorpayPlanId: Deno.env.get("RAZORPAY_PLAN_YEARLY_ID") || "plan_yearly_799inr",
        stripePriceId: Deno.env.get("STRIPE_PRICE_YEARLY_ID") || "price_yearly_799inr"
      }
    };

    const selectedPlan = plans[planCode];
    if (!selectedPlan) {
      return new Response(JSON.stringify({ error: "Invalid plan code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Call Razorpay API to generate subscription
    const razorpayKey = Deno.env.get("RAZORPAY_KEY_ID") || "";
    const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "";

    if (!razorpayKey || !razorpaySecret) {
      return new Response(JSON.stringify({
        simulated: true,
        checkoutUrl: `https://cadence.app/checkout?plan=${planCode}&userId=${user.id}`,
        message: "Razorpay credentials not set in Supabase secrets."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const basicAuth = btoa(`${razorpayKey}:${razorpaySecret}`);
    const rzpRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan_id: selectedPlan.razorpayPlanId,
        total_count: planCode === "yearly" ? 5 : 60,
        quantity: 1,
        customer_notify: 1,
        notes: {
          user_id: user.id,
          email: user.email,
          plan_code: planCode
        }
      })
    });

    const rzpData = await rzpRes.json();
    return new Response(JSON.stringify({
      provider: "razorpay",
      subscriptionId: rzpData.id,
      checkoutUrl: rzpData.short_url,
      planCode,
      priceInr: selectedPlan.priceInr
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
