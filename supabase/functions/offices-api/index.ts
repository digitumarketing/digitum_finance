import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const method = req.method;

    if (method === "GET") {
      const { data, error } = await supabase
        .from("offices")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    if (method === "POST" && action === "ensure-default") {
      const { data: existing } = await supabase
        .from("offices")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        const { data, error } = await supabase
          .from("offices")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });
        if (error) return json({ error: error.message }, 500);
        return json(data);
      }

      const { data, error } = await supabase
        .from("offices")
        .insert({ name: "Main Office", description: "Default office", color: "#10b981", user_id: user.id, is_default: true })
        .select("*");
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    if (method === "POST" && action === "set-default") {
      const body = await req.json();
      const { id } = body;

      await supabase.from("offices").update({ is_default: false }).eq("user_id", user.id);
      const { error } = await supabase.from("offices").update({ is_default: true }).eq("id", id).eq("user_id", user.id);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (method === "POST") {
      const body = await req.json();
      const { name, description = "", color = "#10b981" } = body;
      const { data, error } = await supabase
        .from("offices")
        .insert({ name, description, color, user_id: user.id, is_default: false })
        .select("*");
      if (error) return json({ error: error.message }, 500);
      return json(data?.[0]);
    }

    if (method === "PATCH") {
      const body = await req.json();
      const { id, ...updates } = body;
      const allowed: Record<string, unknown> = {};
      if (updates.name !== undefined) allowed.name = updates.name;
      if (updates.description !== undefined) allowed.description = updates.description;
      if (updates.color !== undefined) allowed.color = updates.color;
      allowed.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("offices")
        .update(allowed)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (method === "DELETE") {
      const body = await req.json();
      const { id } = body;
      const { error } = await supabase
        .from("offices")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return json({ error: message }, 500);
  }
});
