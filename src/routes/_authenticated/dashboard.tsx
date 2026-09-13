import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, School, Users, BookOpenCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getClasses, getSessions, getTeachers, getAllStudents } from "@/lib/data";
import { PageHeader, StatCard, EmptyState, LoadingBlock, ErrorBlock } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, todayISO } from "@/lib/hw";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — School Homework Tracker" },
      {
        name: "description",
        content: "Overview of classes, students and today's homework activity.",
      },
      { property: "og:title", content: "Dashboard — School Homework Tracker" },
      { property: "og:description", content: "Overview of classes, students and homework activity." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const today = todayISO();

  const classes = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const students = useQuery({ queryKey: ["all-students"], queryFn: getAllStudents });
  const sessions = useQuery({
    queryKey: ["sessions", { date: today }],
    queryFn: () => getSessions({ date: today }),
  });
  const teachers = useQuery({ queryKey: ["teachers"], queryFn: getTeachers, enabled: isAdmin });

  const loading = classes.isLoading || students.isLoading || sessions.isLoading;
  const error = classes.error || students.error || sessions.error;

  return (
    <div>
      <PageHeader
        title={`Welcome${user?.fullName ? `, ${user.fullName}` : ""}`}
        description={`${isAdmin ? "School overview" : "Your teaching overview"} · ${formatDate(today)}`}
        actions={
          !isAdmin ? (
            <Button asChild>
              <Link to="/homework">
                <BookOpenCheck className="size-4" /> Take homework
              </Link>
            </Button>
          ) : null
        }
      />

      {error ? <ErrorBlock error={error as Error} /> : null}
      {loading ? (
        <LoadingBlock rows={3} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isAdmin ? (
              <StatCard
                label="Teachers"
                value={teachers.data?.length ?? 0}
                icon={<Users className="size-5" />}
              />
            ) : null}
            <StatCard
              label={isAdmin ? "Classes" : "My classes"}
              value={classes.data?.length ?? 0}
              icon={<School className="size-5" />}
              tone="default"
            />
            <StatCard
              label="Students"
              value={students.data?.length ?? 0}
              icon={<GraduationCap className="size-5" />}
              tone="success"
            />
            <StatCard
              label="Homework taken today"
              value={sessions.data?.length ?? 0}
              icon={<BookOpenCheck className="size-5" />}
              tone="warning"
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Today's homework</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/history">
                    View all <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {(sessions.data ?? []).length === 0 ? (
                  <EmptyState
                    title="No homework recorded today"
                    description="Pick a class and subject to start marking."
                    action={
                      !isAdmin ? (
                        <Button asChild size="sm">
                          <Link to="/homework">Take homework</Link>
                        </Button>
                      ) : null
                    }
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {(sessions.data ?? []).map((s) => (
                      <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                        <span className="font-medium text-foreground">
                          {s.classes?.class_name} · {s.subjects?.subject_name}
                        </span>
                        <span className="text-muted-foreground">{s.profiles?.full_name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">{isAdmin ? "Classes" : "My classes"}</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/classes">
                    Manage <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {(classes.data ?? []).length === 0 ? (
                  <EmptyState
                    title="No classes yet"
                    description="Create a class and add its subjects to get started."
                    action={
                      <Button asChild size="sm">
                        <Link to="/classes">Create class</Link>
                      </Button>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {(classes.data ?? []).map((c) => (
                      <li key={c.id} className="flex items-center justify-between py-3 text-sm">
                        <span className="font-medium text-foreground">{c.class_name}</span>
                        <span className="text-muted-foreground">
                          {c.students?.[0]?.count ?? 0} students · {c.subjects.length} subjects
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
