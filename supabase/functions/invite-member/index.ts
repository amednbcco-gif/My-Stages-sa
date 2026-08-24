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
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const cleanEmail = email.toLowerCase().trim();
    const origin = req.headers.get("origin") ?? "";
    const redirectTo = origin ? `${origin}/auth` : undefined;

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const exists = (existingUsers?.users ?? []).some(
      (u) => u.email?.toLowerCase() === cleanEmail,
    );

    if (!exists) {
      // inviteUserByEmail creates the auth account AND sends the OTP email
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        cleanEmail,
        redirectTo ? { redirectTo } : undefined,
      );

      if (inviteError) {
        return new Response(
          JSON.stringify({ error: inviteError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // If full_name was provided, update the user metadata
      if (full_name) {
        const { data: updatedUsers } = await supabase.auth.admin.listUsers();
        const createdUser = (updatedUsers?.users ?? []).find(
          (u) => u.email?.toLowerCase() === cleanEmail,
        );
        if (createdUser) {
          await supabase.auth.admin.updateUserById(createdUser.id, {
            user_metadata: { full_name },
          });
        }
      }
    } else {
      // User already exists — resend the OTP
      const { error: resendError } = await supabase.auth.admin.resend({
        type: "signup",
        email: cleanEmail,
        ...(redirectTo ? { options: { emailRedirectTo: redirectTo } } : {}),
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
