import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getSchoolAdmins, getSchools } from "@/lib/data";
import { createSchoolAdmin } from "@/lib/schools.functions";
import { PageHeader, EmptyState, LoadingBlock, ErrorBlock } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/school-admins")({
  head: () => ({
    meta: [
      { title: "School Admins — School Homework Tracker" },
      {
        name: "description",
        content: "Create and review the administrator accounts of every school.",
      },
      { property: "og:title", content: "School Admins — School Homework Tracker" },
      { property: "og:description", content: "Manage administrator accounts per school." },
    ],
  }),
  component: SchoolAdminsPage,
});

function SchoolAdminsPage() {
  const { isSuperAdmin, isLoading } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [schoolId, setSchoolId] = useState("");

  const createAdmin = useServerFn(createSchoolAdmin);
  const admins = useQuery({
    queryKey: ["school-admins"],
    queryFn: getSchoolAdmins,
    enabled: isSuperAdmin,
  });
  const schools = useQuery({ queryKey: ["schools"], queryFn: getSchools, enabled: isSuperAdmin });

  const createMut = useMutation({
    mutationFn: (d: {
      school_id: string;
      full_name: string;
      email: string;
      mobile: string;
      password: string;
    }) => createAdmin({ data: d }),
    onSuccess: () => {
      toast.success("School administrator created");
      setAddOpen(false);
      setSchoolId("");
      qc.invalidateQueries({ queryKey: ["school-admins"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <LoadingBlock rows={3} />;
  if (!isSuperAdmin) {
    return (
      <EmptyState
        title="Super administrator only"
        description="Only the super administrator can manage school administrators."
      />
    );
  }

  const q = search.trim().toLowerCase();
  const list = (admins.data ?? []).filter(
    (a) =>
      !q ||
      a.full_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.school_name ?? "").toLowerCase().includes(q),
  );

  return (
    <div>
      <PageHeader
        title="School Admins"
        description="Each administrator manages the teachers and records of a single school."
        actions={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Add school admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New school administrator</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!schoolId) {
                    toast.error("Please choose a school");
                    return;
                  }
                  const f = new FormData(e.currentTarget);
                  createMut.mutate({
                    school_id: schoolId,
                    full_name: String(f.get("full_name") ?? ""),
                    email: String(f.get("email") ?? ""),
                    mobile: String(f.get("mobile") ?? ""),
                    password: String(f.get("password") ?? ""),
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>School</Label>
                  <Select value={schoolId} onValueChange={setSchoolId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a school" />
                    </SelectTrigger>
                    <SelectContent>
                      {(schools.data ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.school_name} ({s.school_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" name="full_name" required minLength={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile (optional)</Label>
                  <Input id="mobile" name="mobile" inputMode="tel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Temporary password</Label>
                  <Input id="password" name="password" minLength={6} required />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMut.isPending}>
                    {createMut.isPending ? "Creating…" : "Create administrator"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search administrators"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {admins.error ? <ErrorBlock error={admins.error as Error} /> : null}
      {admins.isLoading ? (
        <LoadingBlock />
      ) : list.length === 0 ? (
        <EmptyState
          title="No school administrators yet"
          description="Create a school first, then add its administrator."
        />
      ) : (
        <div className="space-y-3">
          {list.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-foreground">{a.full_name}</p>
                    <Badge variant={a.status === "active" ? "secondary" : "outline"}>
                      {a.status}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {a.email}
                    {a.mobile ? ` · ${a.mobile}` : ""}
                  </p>
                </div>
                <Badge variant="outline">{a.school_name ?? "No school"}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
