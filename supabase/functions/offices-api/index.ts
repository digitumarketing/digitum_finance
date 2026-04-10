import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3";

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

async function getUserId(authHeader: string): Promise<string | null> {
  try {
    const token = authHeader.replace("Bearer ", "");
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  let sql: ReturnType<typeof postgres> | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userId = await getUserId(authHeader);
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) return json({ error: "Database not configured" }, 500);

    sql = postgres(dbUrl, { ssl: "require", max: 1, idle_timeout: 5 });

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const method = req.method;

    if (method === "GET") {
      const rows = await sql`
        SELECT id, name, description, color, is_default, user_id, created_at, updated_at
        FROM offices
        WHERE user_id = ${userId}
        ORDER BY created_at ASC
      `;
      return json(rows);
    }

    if (method === "POST" && action === "ensure-default") {
      const existing = await sql`SELECT id FROM offices WHERE user_id = ${userId} LIMIT 1`;
      if (existing.length === 0) {
        await sql`
          INSERT INTO offices (name, description, color, user_id, is_default)
          VALUES ('Main Office', 'Default office', '#10b981', ${userId}, true)
        `;
      }
      const rows = await sql`
        SELECT id, name, description, color, is_default, user_id, created_at, updated_at
        FROM offices WHERE user_id = ${userId} ORDER BY created_at ASC
      `;
      return json(rows);
    }

    if (method === "POST" && action === "set-default") {
      const body = await req.json();
      const { id } = body;
      await sql`UPDATE offices SET is_default = false WHERE user_id = ${userId}`;
      await sql`UPDATE offices SET is_default = true WHERE id = ${id} AND user_id = ${userId}`;
      return json({ success: true });
    }

    if (method === "POST") {
      const body = await req.json();
      const { name, description = "", color = "#10b981" } = body;
      const rows = await sql`
        INSERT INTO offices (name, description, color, user_id, is_default)
        VALUES (${name}, ${description}, ${color}, ${userId}, false)
        RETURNING id, name, description, color, is_default, user_id, created_at, updated_at
      `;
      return json(rows[0]);
    }

    if (method === "PATCH") {
      const body = await req.json();
      const { id, name, description, color } = body;
      await sql`
        UPDATE offices SET
          name = COALESCE(${name ?? null}, name),
          description = COALESCE(${description ?? null}, description),
          color = COALESCE(${color ?? null}, color),
          updated_at = now()
        WHERE id = ${id} AND user_id = ${userId}
      `;
      return json({ success: true });
    }

    if (method === "DELETE") {
      const body = await req.json();
      const { id } = body;
      await sql`DELETE FROM offices WHERE id = ${id} AND user_id = ${userId}`;
      return json({ success: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return json({ error: message }, 500);
  } finally {
    if (sql) await sql.end({ timeout: 2 });
  }
});
