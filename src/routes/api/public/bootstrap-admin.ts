import { createFileRoute } from "@tanstack/react-router";

const ADMIN_EMAIL = "mahipaljinjala@gmail.com";
const ADMIN_PASSWORD = "123456789";

// Idempotent one-time setup: guarantees the single school administrator account
// exists. It never creates a second admin and accepts no caller input.
async function ensureAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existing } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1);
  if (existing && existing.length > 0) {
    return { created: false, message: "Administrator account already exists." };
  }

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "School Administrator", role: "admin" },
  });
  if (error) return { created: false, message: error.message };

  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: created.user!.id, role: "admin" }, { onConflict: "user_id,role" });
  await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", created.user!.id)
    .eq("role", "teacher");
  return { created: true, message: "Administrator account created." };
}

export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify(await ensureAdmin()), {
          headers: { "content-type": "application/json" },
        }),
      POST: async () =>
        new Response(JSON.stringify(await ensureAdmin()), {
          headers: { "content-type": "application/json" },
        }),
    },
  },
});
