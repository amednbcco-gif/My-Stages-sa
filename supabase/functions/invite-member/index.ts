import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, full_name } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const cleanEmail = email.toLowerCase().trim();

    // Admin client for checking/creating users
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Anon client for triggering OTP email (same flow as signUp)
    const anon = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if user already exists
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existing = (existingUsers?.users ?? []).find(
      (u) => u.email?.toLowerCase() === cleanEmail,
    );

    if (!existing) {
      // Create the auth account (no email sent by createUser)
      const { error: createError } = await admin.auth.admin.createUser({
        email: cleanEmail,
        password: crypto.randomUUID(),
        email_confirm: false,
        user_metadata: { full_name: full_name ?? "" },
      });

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Send OTP code (same 6-digit code email the app already uses)
      const { error: resendError } = await anon.auth.resend({
        type: "signup",
        email: cleanEmail,
      });

      if (resendError) {
        console.error("[invite-member] OTP send error:", resendError.message);
      }
    } else if (!existing.email_confirmed_at) {
      // User exists but not confirmed — resend the OTP code
      const { error: resendError } = await anon.auth.resend({
        type: "signup",
        email: cleanEmail,
      });

      if (resendError) {
        return new Response(
          JSON.stringify({ error: resendError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent to " + cleanEmail }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
