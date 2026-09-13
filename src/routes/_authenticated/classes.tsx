import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Eye, Pencil, Plus, School, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  addSubject,
  createClass,
  deleteClass,
  deleteSubject,
  getClasses,
  updateClass,
} from "@/lib/data";
import { PageHeader, EmptyState, ErrorBlock, LoadingBlock } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export const Route = createFileRoute("/_authenticated/classes")({
  head: () => ({ meta: [{ title: "Classes — School Homework Tracker" }] }),
  component: ClassesPage,
});

function ClassesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const classes = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["classes"] });
  const create = useMutation({
    mutationFn: (input: { name: string; subjects: string[] }) =>
      createClass({ class_name: input.name, teacher_id: user!.id }).then(async (id) => {
        for (const subject of input.subjects) await addSubject(id, subject);
      }),
    onSuccess: () => {
      toast.success("Class created");
      setOpen(false);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const edit = useMutation({
    mutationFn: (input: { id: string; name: string }) => updateClass(input.id, { class_name: input.name }),
    onSuccess: () => {
      toast.success("Class updated");
      setEditing(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      toast.success("Class deleted");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (authLoading || classes.isLoading) return <LoadingBlock rows={4} />;
  if (classes.error) return <ErrorBlock error={classes.error as Error} />;

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Organize classes, subjects, students and daily homework."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" /> Create class</Button>
            </DialogTrigger>
            <ClassForm
              pending={create.isPending}
              onSubmit={(value) => create.mutate(value)}
            />
          </Dialog>
        }
      />
      {(classes.data ?? []).length === 0 ? (
        <EmptyState title="No classes yet" description="Create a class and add its subjects to begin." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(classes.data ?? []).map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg"><School className="size-5 text-primary" />{item.class_name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{item.profiles?.full_name ?? "My class"}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" aria-label={`Delete ${item.class_name}`}><Trash2 className="size-4 text-destructive" /></Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete {item.class_name}?</AlertDialogTitle><AlertDialogDescription>This removes the class and its related records.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove.mutate(item.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-muted p-3"><div className="flex items-center gap-2 text-muted-foreground"><BookOpen className="size-4" />Subjects</div><strong className="mt-1 block text-lg">{item.subjects.length}</strong></div>
                  <div className="rounded-lg bg-muted p-3"><div className="flex items-center gap-2 text-muted-foreground"><Users className="size-4" />Students</div><strong className="mt-1 block text-lg">{item.students[0]?.count ?? 0}</strong></div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.subjects.map((subject) => <span key={subject.id} className="rounded-full border px-2 py-1 text-xs">{subject.subject_name}</span>)}
                </div>
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <Button asChild size="sm"><Link to="/classes/$classId" params={{ classId: item.id }}><Eye className="size-4" /> View class</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link to="/homework" search={{ classId: item.id }}><BookOpen className="size-4" /> Homework</Link></Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing({ id: item.id, name: item.class_name })}><Pencil className="size-4" /> Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Dialog open={Boolean(editing)} onOpenChange={(value) => !value && setEditing(null)}>
        {editing ? <ClassEditForm value={editing.name} pending={edit.isPending} onSubmit={(name) => edit.mutate({ id: editing.id, name })} /> : null}
      </Dialog>
    </div>
  );
}

function ClassForm({ pending, onSubmit }: { pending: boolean; onSubmit: (value: { name: string; subjects: string[] }) => void }) {
  const [subjects, setSubjects] = useState([""]);
  return <DialogContent><DialogHeader><DialogTitle>Create class</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const name = String(form.get("class_name") ?? "").trim(); const values = subjects.map((s) => s.trim()).filter(Boolean); if (name && values.length) onSubmit({ name, subjects: values }); }}>
    <div className="space-y-2"><Label htmlFor="class_name">Class name</Label><Input id="class_name" name="class_name" placeholder="Standard 8-A" required /></div>
    <div className="space-y-2"><Label>Subjects</Label>{subjects.map((subject, index) => <div key={index} className="flex gap-2"><Input value={subject} required={index === 0} placeholder="Mathematics" onChange={(event) => setSubjects((current) => current.map((value, i) => i === index ? event.target.value : value))} />{subjects.length > 1 ? <Button type="button" variant="ghost" size="icon" onClick={() => setSubjects((current) => current.filter((_, i) => i !== index))}><Trash2 className="size-4" /></Button> : null}</div>)}<Button type="button" variant="outline" size="sm" onClick={() => setSubjects((current) => [...current, ""])}><Plus className="size-4" /> Add subject</Button></div>
    <DialogFooter><Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create class"}</Button></DialogFooter>
  </form></DialogContent>;
}

function ClassEditForm({ value, pending, onSubmit }: { value: string; pending: boolean; onSubmit: (value: string) => void }) {
  const [name, setName] = useState(value);
  return <DialogContent><DialogHeader><DialogTitle>Edit class</DialogTitle></DialogHeader><form onSubmit={(event) => { event.preventDefault(); onSubmit(name.trim()); }} className="space-y-4"><div className="space-y-2"><Label htmlFor="edit-class-name">Class name</Label><Input id="edit-class-name" value={name} onChange={(event) => setName(event.target.value)} required /></div><DialogFooter><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button></DialogFooter></form></DialogContent>;
}