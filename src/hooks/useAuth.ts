import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "super_admin" | "school_admin" | "teacher";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  mobile: string | null;
  status: string;
  role: Role;
  schoolId: string | null;
  schoolName: string | null;
};

export function homeForRole(role: Role): "/super-admin" | "/school-admin" | "/dashboard" {
  if (role === "super_admin") return "/super-admin";
  if (role === "school_admin") return "/school-admin";
  return "/dashboard";
}

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const names = new Set((roles ?? []).map((r) => r.role as string));
  const role: Role = names.has("super_admin")
    ? "super_admin"
    : names.has("school_admin") || names.has("admin")
      ? "school_admin"
      : "teacher";

  const schoolId = (profile as { school_id?: string | null } | null)?.school_id ?? null;
  let schoolName: string | null = null;
  if (schoolId) {
    const { data: school } = await supabase
      .from("schools")
      .select("school_name")
      .eq("id", schoolId)
      .maybeSingle();
    schoolName = school?.school_name ?? null;
  }

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name || user.email || "User",
    mobile: profile?.mobile ?? null,
    status: profile?.status ?? "active",
    role,
    schoolId,
    schoolName,
  };
}

export function useAuth() {
  const query = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
  });
  const role = query.data?.role;
  return {
    user: query.data ?? null,
    role: role ?? null,
    isSuperAdmin: role === "super_admin",
    isSchoolAdmin: role === "school_admin",
    isTeacher: role === "teacher",
    /** super admin or school admin */
    isAdmin: role === "super_admin" || role === "school_admin",
    isLoading: query.isLoading,
  };
}
