import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, KeyRound, Trash2, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getTeachers } from "@/lib/data";
import {
  createTeacher,
  updateTeacher,
  resetTeacherPassword,
  deleteTeacher,
} from "@/lib/staff.functions";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/teachers")({
  head: () => ({
    meta: [
      { title: "Teachers — School Homework Tracker" },
      { name: "description", content: "Create and manage teacher accounts for the school." },
      { property: "og:title", content: "Teachers — School Homework Tracker" },
      { property: "og:description", content: "Create and manage teacher accounts." },
    ],
  }),
  component: TeachersPage,
});

type Teacher = {
  id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  status: string;
};

function TeachersPage() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [pwFor, setPwFor] = useState<Teacher | null>(null);

  const create = useServerFn(createTeacher);
  const update = useServerFn(updateTeacher);
  const resetPw = useServerFn(resetTeacherPassword);
  const remove = useServerFn(deleteTeacher);

  const teachers = useQuery({ queryKey: ["teachers"], queryFn: getTeachers, enabled: isAdmin });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["teachers"] });
  };

  const createMut = useMutation({
    mutationFn: (d: { full_name: string; email: string; mobile: string; password: string }) =>
      create({ data: d }),
    onSuccess: () => {
      toast.success("Teacher account created");
      setAddOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (d: { id: string; full_name: string; mobile: string; status: string }) =>
      update({ data: { ...d, status: d.status as "active" | "inactive" } }),
    onSuccess: () => {
      toast.success("Teacher updated");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pwMut = useMutation({
    mutationFn: (d: { id: string; password: string }) => resetPw({ data: d }),
    onSuccess: () => {
      toast.success("Password updated");
      setPwFor(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Teacher removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (authLoading) return <LoadingBlock rows={3} />;
  if (!isAdmin) {
    return (
      <EmptyState
        title="Administrators only"
        description="Only the school administrator can manage teacher accounts."
      />
    );
  }

  const list = (teachers.data ?? []).filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.full_name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      (t.mobile ?? "").includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="Teachers"
        description="Create teacher accounts and manage their access."
        actions={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Add teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New teacher account</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  createMut.mutate({
                    full_name: String(f.get("full_name")),
                    email: String(f.get("email")),
                    mobile: String(f.get("mobile") ?? ""),
                    password: String(f.get("password")),
                  });
                }}
                className="space-y-4"
              >
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
                    {createMut.isPending ? "Creating…" : "Create account"}
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
          placeholder="Search teachers"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {teachers.error ? <ErrorBlock error={teachers.error as Error} /> : null}
      {teachers.isLoading ? (
        <LoadingBlock />
      ) : list.length === 0 ? (
        <EmptyState title="No teachers yet" description="Add your first teacher account." />
      ) : (
        <div className="space-y-3">
          {list.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-foreground">{t.full_name}</p>
                    <Badge variant={t.status === "active" ? "secondary" : "outline"}>
                      {t.status}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {t.email}
                    {t.mobile ? ` · ${t.mobile}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(t as Teacher)}>
                    <Pencil className="size-4" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPwFor(t as Teacher)}>
                    <KeyRound className="size-4" /> Password
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="size-4" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {t.full_name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the account permanently. Classes and homework records
                          belonging to this teacher will also be deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMut.mutate(t.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit teacher</DialogTitle>
          </DialogHeader>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                updateMut.mutate({
                  id: editing.id,
                  full_name: String(f.get("full_name")),
                  mobile: String(f.get("mobile") ?? ""),
                  status: String(f.get("status")),
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="e_name">Full name</Label>
                <Input id="e_name" name="full_name" defaultValue={editing.full_name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e_mobile">Mobile</Label>
                <Input id="e_mobile" name="mobile" defaultValue={editing.mobile ?? ""} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={editing.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive (cannot sign in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMut.isPending}>
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwFor} onOpenChange={(o) => !o && setPwFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set new password</DialogTitle>
          </DialogHeader>
          {pwFor ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                pwMut.mutate({ id: pwFor.id, password: String(f.get("password")) });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="np">New password for {pwFor.full_name}</Label>
                <Input id="np" name="password" minLength={6} required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pwMut.isPending}>
                  Update password
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
