import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertSuperAdmin(supabase: {
  rpc: (fn: string) => Promise<{ data: unknown; error: { message: string } | null }>;
}) {
  const { data, error } = await supabase.rpc("is_super_admin");
  if (error) throw new Error(error.message);
  if (data !== true) throw new Error("Only the super administrator can manage schools.");
}

const schoolFields = {
  school_name: z.string().trim().min(2).max(150),
  school_code: z.string().trim().min(2).max(30),
  address: z.string().trim().max(300).optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
  state: z.string().trim().max(100).optional().default(""),
  pincode: z.string().trim().max(12).optional().default(""),
  phone: z.string().trim().max(20).optional().default(""),
  email: z.string().trim().max(255).optional().default(""),
  status: z.enum(["active", "inactive"]).optional().default("active"),
};

const createSchema = z.object({
  ...schoolFields,
  admin_name: z.string().trim().min(2).max(120),
  admin_email: z.string().trim().email().max(255),
  admin_mobile: z.string().trim().max(20).optional().default(""),
  admin_password: z.string().min(6).max(72),
});

export const createSchool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: school, error } = await supabaseAdmin
      .from("schools")
      .insert({
        school_name: data.school_name,
        school_code: data.school_code.toUpperCase(),
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        phone: data.phone,
        email: data.email,
        status: data.status,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { data: created, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: data.admin_email,
      password: data.admin_password,
      email_confirm: true,
      user_metadata: {
        full_name: data.admin_name,
        mobile: data.admin_mobile,
        role: "school_admin",
        school_id: school.id,
      },
    });
    if (userError) {
      await supabaseAdmin.from("schools").delete().eq("id", school.id);
      throw new Error(userError.message);
    }

    const adminId = created.user!.id;
    await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.admin_name, mobile: data.admin_mobile, school_id: school.id })
      .eq("id", adminId);
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: adminId, role: "school_admin" }, { onConflict: "user_id,role" });
    await supabaseAdmin.from("user_roles").delete().eq("user_id", adminId).eq("role", "teacher");

    return { schoolId: school.id, adminId };
  });

export const updateSchool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), ...schoolFields }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    const { error } = await supabaseAdmin
      .from("schools")
      .update({ ...rest, school_code: rest.school_code.toUpperCase() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setSchoolStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["active", "inactive"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("schools")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    // Deactivating a school blocks sign-in for everyone who belongs to it.
    const { data: members } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("school_id", data.id);
    for (const member of members ?? []) {
      await supabaseAdmin.auth.admin.updateUserById(member.id, {
        ban_duration: data.status === "inactive" ? "876000h" : "none",
      });
    }
    return { ok: true };
  });

export const createSchoolAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        school_id: z.string().uuid(),
        full_name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(255),
        mobile: z.string().trim().max(20).optional().default(""),
        password: z.string().min(6).max(72),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name,
        mobile: data.mobile,
        role: "school_admin",
        school_id: data.school_id,
      },
    });
    if (error) throw new Error(error.message);
    const id = created.user!.id;
    await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.full_name, mobile: data.mobile, school_id: data.school_id })
      .eq("id", id);
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: id, role: "school_admin" }, { onConflict: "user_id,role" });
    await supabaseAdmin.from("user_roles").delete().eq("user_id", id).eq("role", "teacher");
    return { id };
  });
