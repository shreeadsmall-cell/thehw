import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "teacher";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  mobile: string | null;
  status: string;
  role: Role;
};

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const role: Role = roles?.some((r) => r.role === "admin") ? "admin" : "teacher";
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name || user.email || "User",
    mobile: profile?.mobile ?? null,
    status: profile?.status ?? "active",
    role,
  };
}

export function useAuth() {
  const query = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
  });
  return {
    user: query.data ?? null,
    isAdmin: query.data?.role === "admin",
    isLoading: query.isLoading,
  };
}
