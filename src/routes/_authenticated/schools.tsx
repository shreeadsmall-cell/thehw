import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Power, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getSchools, type SchoolRow } from "@/lib/data";
import { createSchool, updateSchool, setSchoolStatus } from "@/lib/schools.functions";
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

export const Route = createFileRoute("/_authenticated/schools")({
  head: () => ({
    meta: [
      { title: "Schools — School Homework Tracker" },
      {
        name: "description",
        content: "Create, edit, activate and deactivate the schools using the homework tracker.",
      },
      { property: "og:title", content: "Schools — School Homework Tracker" },
      { property: "og:description", content: "Manage every school in the network." },
    ],
  }),
  component: SchoolsPage,
});

function SchoolsPage() {
  const { isSuperAdmin, isLoading } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolRow | null>(null);

  const create = useServerFn(createSchool);
  const update = useServerFn(updateSchool);
  const toggle = useServerFn(setSchoolStatus);

  const schools = useQuery({ queryKey: ["schools"], queryFn: getSchools, enabled: isSuperAdmin });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["schools"] });

  const createMut = useMutation({
    mutationFn: (d: Record<string, string>) => create({ data: d }),
    onSuccess: () => {
      toast.success("School and its administrator created");
      setAddOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (d: Record<string, string>) => update({ data: d }),
    onSuccess: () => {
      toast.success("School updated");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (d: { id: string; status: "active" | "inactive" }) => toggle({ data: d }),
    onSuccess: () => {
      toast.success("School status updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <LoadingBlock rows={3} />;
  if (!isSuperAdmin) {
    return (
      <EmptyState
        title="Super administrator only"
        description="Only the super administrator can manage schools."
      />
    );
  }

  const q = search.trim().toLowerCase();
  const list = (schools.data ?? []).filter(
    (s) =>
      !q ||
      s.school_name.toLowerCase().includes(q) ||
      s.school_code.toLowerCase().includes(q) ||
      (s.city ?? "").toLowerCase().includes(q),
  );

  return (
    <div>
      <PageHeader
        title="Schools"
        description="Each school has its own teachers, classes, students and homework records."
        actions={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Add school
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>New school</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const get = (k: string) => String(f.get(k) ?? "");
                  createMut.mutate({
                    school_name: get("school_name"),
                    school_code: get("school_code"),
                    address: get("address"),
                    city: get("city"),
                    state: get("state"),
                    pincode: get("pincode"),
                    phone: get("phone"),
                    email: get("email"),
                    status: "active",
                    admin_name: get("admin_name"),
                    admin_email: get("admin_email"),
                    admin_mobile: get("admin_mobile"),
                    admin_password: get("admin_password"),
                  });
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="school_name" label="School name" required />
                  <Field name="school_code" label="School code" required />
                  <Field name="city" label="City" />
                  <Field name="state" label="State" />
                  <Field name="pincode" label="Pincode" />
                  <Field name="phone" label="Phone" />
                  <div className="sm:col-span-2">
                    <Field name="address" label="Address" />
                  </div>
                  <div className="sm:col-span-2">
                    <Field name="email" label="School email" type="email" />
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="mb-3 text-sm font-medium">First school administrator</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field name="admin_name" label="Admin name" required />
                    <Field name="admin_email" label="Admin email" type="email" required />
                    <Field name="admin_mobile" label="Mobile" />
                    <Field
                      name="admin_password"
                      label="Temporary password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMut.isPending}>
                    {createMut.isPending ? "Creating…" : "Create school"}
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
          placeholder="Search schools"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {schools.error ? <ErrorBlock error={schools.error as Error} /> : null}
      {schools.isLoading ? (
        <LoadingBlock />
      ) : list.length === 0 ? (
        <EmptyState title="No schools yet" description="Add your first school to get started." />
      ) : (
        <div className="space-y-3">
          {list.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-foreground">{s.school_name}</p>
                    <Badge variant={s.status === "active" ? "secondary" : "outline"}>
                      {s.status}
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {s.school_code}
                    {s.city ? ` · ${s.city}` : ""}
                    {s.phone ? ` · ${s.phone}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(s)}>
                    <Pencil className="size-4" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={statusMut.isPending}
                    onClick={() =>
                      statusMut.mutate({
                        id: s.id,
                        status: s.status === "active" ? "inactive" : "active",
                      })
                    }
                  >
                    <Power className="size-4" />
                    {s.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit school</DialogTitle>
          </DialogHeader>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const get = (k: string) => String(f.get(k) ?? "");
                updateMut.mutate({
                  id: editing.id,
                  school_name: get("school_name"),
                  school_code: get("school_code"),
                  address: get("address"),
                  city: get("city"),
                  state: get("state"),
                  pincode: get("pincode"),
                  phone: get("phone"),
                  email: get("email"),
                  status: editing.status === "inactive" ? "inactive" : "active",
                });
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field name="school_name" label="School name" required defaultValue={editing.school_name} />
                <Field name="school_code" label="School code" required defaultValue={editing.school_code} />
                <Field name="city" label="City" defaultValue={editing.city ?? ""} />
                <Field name="state" label="State" defaultValue={editing.state ?? ""} />
                <Field name="pincode" label="Pincode" defaultValue={editing.pincode ?? ""} />
                <Field name="phone" label="Phone" defaultValue={editing.phone ?? ""} />
                <div className="sm:col-span-2">
                  <Field name="address" label="Address" defaultValue={editing.address ?? ""} />
                </div>
                <div className="sm:col-span-2">
                  <Field name="email" label="School email" type="email" defaultValue={editing.email ?? ""} />
                </div>
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
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  minLength,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  minLength?: number | undefined;
  defaultValue?: string | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        {...(minLength ? { minLength } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
      />
    </div>
  );
}
