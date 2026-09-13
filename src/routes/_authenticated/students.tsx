import { useState } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileUp, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getClasses, getEntries, getStudents, addStudent, updateStudent, deleteStudent, type StudentRow } from "@/lib/data";
import { exportCSV } from "@/lib/exporters";
import { PageHeader, EmptyState, ErrorBlock, LoadingBlock, PercentPill } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/students")({ head: () => ({ meta: [{ title: "Students — School Homework Tracker" }] }), component: StudentsPage });

function StudentsPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const classes = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const students = useQuery({ queryKey: ["students", classId], queryFn: () => getStudents(classId), enabled: Boolean(classId) });
  const entries = useQuery({ queryKey: ["entries", classId], queryFn: () => getEntries({ classId }), enabled: Boolean(classId) });
  const remove = useMutation({ mutationFn: deleteStudent, onSuccess: () => { toast.success("Student deleted"); queryClient.invalidateQueries({ queryKey: ["students", classId] }); }, onError: (e: Error) => toast.error(e.message) });
  const save = useMutation({ mutationFn: (value: { id?: string; roll_number: number; student_name: string }) => value.id ? updateStudent(value.id, { roll_number: value.roll_number, student_name: value.student_name }) : addStudent({ class_id: classId, roll_number: value.roll_number, student_name: value.student_name }), onSuccess: () => { toast.success(editing ? "Student updated" : "Student added"); setEditing(null); queryClient.invalidateQueries({ queryKey: ["students", classId] }); }, onError: (e: Error) => toast.error(e.message) });
  if (pathname === "/students/import") return <Outlet />;

  const selected = classes.data?.find((item) => item.id === classId);
  const filtered = (students.data ?? []).filter((student) => student.student_name.toLowerCase().includes(search.toLowerCase()) || String(student.roll_number).includes(search));
  const rows = filtered.map((student) => { const own = (entries.data ?? []).filter((entry) => entry.student_id === student.id); const counts = { completed: own.filter((e) => e.status === "completed").length, incomplete: own.filter((e) => e.status === "incomplete").length, not_submitted: own.filter((e) => e.status === "not_submitted").length, absent: own.filter((e) => e.status === "absent").length }; const total = own.length; return { student, ...counts, total, percent: total ? Math.round((counts.completed / total) * 100) : 0 }; });
  return <div><PageHeader title="Students" description="Manage students and review their homework completion." actions={classId ? <><Button variant="outline" onClick={() => exportCSV(`${selected?.class_name ?? "Students"}-Students.csv`, rows.map((row) => ({ "Roll Number": row.student.roll_number, Name: row.student.student_name, "Total Homework": row.total, Completed: row.completed, Incomplete: row.incomplete, "Not Submitted": row.not_submitted, Absent: row.absent, "Completion %": row.percent })))}><Download className="size-4" /> Export</Button><Button variant="outline" asChild><Link to="/students/import" search={{ classId }}><FileUp className="size-4" /> Import</Link></Button><Button onClick={() => setEditing({ id: "", class_id: classId, roll_number: 0, student_name: "" })}><Plus className="size-4" /> Add student</Button></> : null} />
    <div className="mb-5 max-w-md"><Label htmlFor="class-select">Select class</Label><select id="class-select" className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={classId} onChange={(event) => setClassId(event.target.value)}><option value="">Choose a class</option>{(classes.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.class_name}</option>)}</select></div>
    {!classId ? <EmptyState title="Select a class" description="Choose a class to view its students." /> : students.error || entries.error ? <ErrorBlock error={(students.error ?? entries.error) as Error} /> : students.isLoading || entries.isLoading ? <LoadingBlock /> : rows.length === 0 ? <EmptyState title="No students found in this class." description="Add a student or import a spreadsheet." /> : <Card><CardContent className="p-0"><div className="flex items-center gap-3 border-b p-4"><Search className="size-4 text-muted-foreground" /><Input className="border-0 p-0 shadow-none focus-visible:ring-0" placeholder="Search by name or roll number" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="divide-y">{rows.map((row) => <div key={row.student.id} className="grid gap-3 p-4 md:grid-cols-[2fr_repeat(6,1fr)_auto] md:items-center"><div><div className="font-medium">{row.student.student_name}</div><div className="text-sm text-muted-foreground">Roll {row.student.roll_number}</div></div><span className="text-sm">Total {row.total}</span><span className="text-sm text-success">Done {row.completed}</span><span className="text-sm text-warning-foreground">Incomplete {row.incomplete}</span><span className="text-sm text-destructive">Missing {row.not_submitted}</span><span className="text-sm text-muted-foreground">Absent {row.absent}</span><PercentPill percent={row.percent} /><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => setEditing(row.student)}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" onClick={() => remove.mutate(row.student.id)}><Trash2 className="size-4 text-destructive" /></Button></div></div>)}</div></CardContent></Card>}
    <Dialog open={Boolean(editing)} onOpenChange={(value) => !value && setEditing(null)}>{editing ? <StudentForm value={editing} pending={save.isPending} onSubmit={(value) => save.mutate({ ...value, id: editing.id || undefined })} /> : null}</Dialog>
  </div>;
}

function StudentForm({ value, pending, onSubmit }: { value: StudentRow; pending: boolean; onSubmit: (value: { roll_number: number; student_name: string }) => void }) { const [name, setName] = useState(value.student_name); const [roll, setRoll] = useState(String(value.roll_number || "")); return <DialogContent><DialogHeader><DialogTitle>{value.id ? "Edit student" : "Add student"}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit({ roll_number: Number(roll), student_name: name.trim() }); }}><div className="space-y-2"><Label htmlFor="student-name">Name</Label><Input id="student-name" value={name} onChange={(event) => setName(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="student-roll">Roll number</Label><Input id="student-roll" type="number" min="1" value={roll} onChange={(event) => setRoll(event.target.value)} required /></div><DialogFooter><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button></DialogFooter></form></DialogContent>; }