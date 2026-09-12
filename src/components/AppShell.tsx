import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpenCheck,
  ClipboardList,
  FileBarChart,
  Settings,
  LogOut,
  Menu,
  School,
  History,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard };

const ADMIN_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teachers", label: "Teachers", icon: Users },
  { to: "/classes", label: "Classes", icon: School },
  { to: "/students", label: "Students", icon: GraduationCap },
  { to: "/history", label: "Homework Records", icon: History },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/settings", label: "Settings", icon: Settings },
];

const TEACHER_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/classes", label: "My Classes", icon: School },
  { to: "/students", label: "Students", icon: GraduationCap },
  { to: "/homework", label: "Take Homework", icon: BookOpenCheck },
  { to: "/history", label: "Homework History", icon: History },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <ClipboardList className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Homework Tracker</p>
          <p className="truncate text-xs text-sidebar-foreground/60">
            {isAdmin ? "Administrator" : "Teacher"}
          </p>
        </div>
      </div>
      <NavLinks items={isAdmin ? ADMIN_NAV : TEACHER_NAV} onNavigate={onNavigate} />
      <div className="mt-auto border-t border-sidebar-border p-3">
        <div className="px-2 pb-3">
          <p className="truncate text-sm font-medium">{user?.fullName ?? <Skeleton className="h-4 w-24" />}</p>
          <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          onClick={signOut}
          className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-[18px]" /> Logout
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <SidebarBody />
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Homework Tracker</span>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
