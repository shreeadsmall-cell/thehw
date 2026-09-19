import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, GraduationCap, BookOpenCheck, ArrowRight, School } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getSchools, getTeachers, getAllStudents, getClasses, getSessions } from "@/lib/data";
import { PageHeader, StatCard, EmptyState, LoadingBlock, ErrorBlock } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, todayISO } from "@/lib/hw";

export const Route = createFileRoute("/_authenticated/super-admin")({
  head: () => ({
    meta: [
      { title: "Super Admin — School Homework Tracker" },
      {
        name: "description",
        content: "Network-wide overview of every school, teacher, student and homework record.",
      },
      { property: "og:title", content: "Super Admin — School Homework Tracker" },
      { property: "og:description", content: "Network-wide overview of every school." },
    ],
  }),
  component: SuperAdminPage,
});

function SuperAdminPage() {
  const { user, isSuperAdmin, isLoading } = useAuth();
  const today = todayISO();

  const schools = useQuery({ queryKey: ["schools"], queryFn: getSchools, enabled: isSuperAdmin });
  const teachers = useQuery({ queryKey: ["teachers"], queryFn: getTeachers, enabled: isSuperAdmin });
  const students = useQuery({
    queryKey: ["all-students"],
    queryFn: getAllStudents,
    enabled: isSuperAdmin,
  });
  const classes = useQuery({ queryKey: ["classes"], queryFn: getClasses, enabled: isSuperAdmin });
  const sessions = useQuery({
    queryKey: ["sessions", { date: today }],
    queryFn: () => getSessions({ date: today }),
    enabled: isSuperAdmin,
  });

  if (isLoading) return <LoadingBlock rows={3} />;
  if (!isSuperAdmin) {
    return (
      <EmptyState
        title="Super administrator only"
        description="This overview is available to the super administrator."
      />
    );
  }

  const error = schools.error || teachers.error || students.error || classes.error;
  const loading = schools.isLoading || teachers.isLoading || students.isLoading;

  return (
    <div>
      <PageHeader
        title={`Welcome${user?.fullName ? `, ${user.fullName}` : ""}`}
        description={`Network overview · ${formatDate(today)}`}
        actions={
          <Button asChild>
            <Link to="/schools">
              <Building2 className="size-4" /> Manage schools
            </Link>
          </Button>
        }
      />

      {error ? <ErrorBlock error={error as Error} /> : null}
      {loading ? (
        <LoadingBlock rows={3} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Schools"
              value={schools.data?.length ?? 0}
              icon={<Building2 className="size-5" />}
            />
            <StatCard
              label="Teachers"
              value={teachers.data?.length ?? 0}
              icon={<Users className="size-5" />}
            />
            <StatCard
              label="Classes"
              value={classes.data?.length ?? 0}
              icon={<School className="size-5" />}
            />
            <StatCard
              label="Students"
              value={students.data?.length ?? 0}
              icon={<GraduationCap className="size-5" />}
              tone="success"
            />
            <StatCard
              label="Homework today"
              value={sessions.data?.length ?? 0}
              icon={<BookOpenCheck className="size-5" />}
              tone="warning"
            />
          </div>

          <Card className="mt-6">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Schools</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link to="/schools">
                  Manage <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {(schools.data ?? []).length === 0 ? (
                <EmptyState
                  title="No schools yet"
                  description="Create your first school and its administrator."
                  action={
                    <Button asChild size="sm">
                      <Link to="/schools">Add school</Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {(schools.data ?? []).map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{s.school_name}</p>
                        <p className="truncate text-muted-foreground">
                          {s.school_code}
                          {s.city ? ` · ${s.city}` : ""}
                        </p>
                      </div>
                      <Badge variant={s.status === "active" ? "secondary" : "outline"}>
                        {s.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
