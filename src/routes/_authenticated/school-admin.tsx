import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, GraduationCap, BookOpenCheck, School } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getTeachers, getAllStudents, getClasses, getSessions } from "@/lib/data";
import { PageHeader, StatCard, EmptyState, LoadingBlock, ErrorBlock } from "@/components/common";
import { Button } from "@/components/ui/button";
import { formatDate, todayISO } from "@/lib/hw";

export const Route = createFileRoute("/_authenticated/school-admin")({
  head: () => ({
    meta: [
      { title: "School Admin — School Homework Tracker" },
      { name: "description", content: "Overview of your school's teachers, classes, students and homework." },
      { property: "og:title", content: "School Admin — School Homework Tracker" },
      { property: "og:description", content: "Overview of your school's homework activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SchoolAdminPage,
});

function SchoolAdminPage() {
  const { user, isSchoolAdmin, isLoading } = useAuth();
  const today = todayISO();
  const teachers = useQuery({ queryKey: ["teachers"], queryFn: getTeachers, enabled: isSchoolAdmin });
  const students = useQuery({ queryKey: ["all-students"], queryFn: getAllStudents, enabled: isSchoolAdmin });
  const classes = useQuery({ queryKey: ["classes"], queryFn: getClasses, enabled: isSchoolAdmin });
  const sessions = useQuery({
    queryKey: ["sessions", { date: today }],
    queryFn: () => getSessions({ date: today }),
    enabled: isSchoolAdmin,
  });

  if (isLoading) return <LoadingBlock rows={3} />;
  if (!isSchoolAdmin) {
    return <EmptyState title="School administrator only" description="This overview is for school administrators." />;
  }
  const error = teachers.error || students.error || classes.error || sessions.error;

  return (
    <div>
      <PageHeader
        title={user?.schoolName ?? "My school"}
        description={`Welcome, ${user?.fullName ?? ""} · ${formatDate(today)}`}
        actions={
          <Button asChild>
            <Link to="/teachers">
              <Users className="size-4" /> Manage teachers
            </Link>
          </Button>
        }
      />
      {error ? <ErrorBlock error={error as Error} /> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Teachers" value={teachers.data?.length ?? 0} icon={<Users className="size-5" />} />
        <StatCard label="Classes" value={classes.data?.length ?? 0} icon={<School className="size-5" />} />
        <StatCard label="Students" value={students.data?.length ?? 0} icon={<GraduationCap className="size-5" />} tone="success" />
        <StatCard label="Homework today" value={sessions.data?.length ?? 0} icon={<BookOpenCheck className="size-5" />} tone="warning" />
      </div>
    </div>
  );
}
