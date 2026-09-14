import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Sb = {
  from: (t: string) => any;
  rpc: (fn: string) => Promise<{ data: unknown; error: { message: string } | null }>;
};

/**
 * Resolves the caller's management scope. Super admins may act on any school,
 * school admins only on their own; teachers are rejected.
 */
async function requireManager(supabase: Sb, userId: string) {
  const { data: roles, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const names = new Set((roles ?? []).map((r: { role: string }) => r.role));
  const isSuper = names.has("super_admin");
  const isSchoolAdmin = names.has("school_admin") || names.has("admin");
  if (!isSuper && !isSchoolAdmin) {
    throw new Error("Only an administrator can manage teacher accounts.");
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", userId)
    .maybeSingle();
  return { isSuper, schoolId: (profile?.school_id as string | null) ?? null };
}

/** Ensures the target user belongs to a school the caller may manage. */
async function assertSameScope(
  admin: { from: (t: string) => any },
  scope: { isSuper: boolean; schoolId: string | null },
  targetId: string,
) {
  if (scope.isSuper) return;
  const { data } = await admin.from("profiles").select("school_id").eq("id", targetId).maybeSingle();
  if (!data || data.school_id !== scope.schoolId) {
    throw new Error("This account belongs to another school.");
  }
}

const createSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  mobile: z.string().trim().max(20).optional().default(""),
  password: z.string().min(6).max(72),
  school_id: z.string().uuid().optional(),
});

export const createTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const scope = await requireManager(context.supabase as never, context.userId);
    const schoolId = scope.isSuper ? (data.school_id ?? null) : scope.schoolId;
    if (!schoolId) throw new Error("Please choose the school this teacher belongs to.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name,
        mobile: data.mobile,
        role: "teacher",
        school_id: schoolId,
      },
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.full_name, mobile: data.mobile, school_id: schoolId })
      .eq("id", created.user!.id);
    return { id: created.user!.id };
  });

export const updateTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        full_name: z.string().trim().min(2).max(120),
        mobile: z.string().trim().max(20).optional().default(""),
        status: z.enum(["active", "inactive"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const scope = await requireManager(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertSameScope(supabaseAdmin as never, scope, data.id);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.full_name, mobile: data.mobile, status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.auth.admin.updateUserById(data.id, {
      ban_duration: data.status === "inactive" ? "876000h" : "none",
    });
    return { ok: true };
  });

export const resetTeacherPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), password: z.string().min(6).max(72) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const scope = await requireManager(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertSameScope(supabaseAdmin as never, scope, data.id);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTeacher = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const scope = await requireManager(context.supabase as never, context.userId);
    if (data.id === context.userId) throw new Error("You cannot delete your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertSameScope(supabaseAdmin as never, scope, data.id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
