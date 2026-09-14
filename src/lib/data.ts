import { supabase } from "@/integrations/supabase/client";
import type { HwStatus } from "./hw";

export type SubjectRow = { id: string; subject_name: string };
export type ClassRow = {
  id: string;
  class_name: string;
  teacher_id: string;
  created_at: string;
  subjects: SubjectRow[];
  students: { count: number }[];
  profiles?: { full_name: string } | null;
};
export type StudentRow = {
  id: string;
  class_id: string;
  roll_number: number;
  student_name: string;
};

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export async function getClasses(): Promise<ClassRow[]> {
  const res = await supabase
    .from("classes")
    .select(
      "id, class_name, teacher_id, created_at, subjects(id, subject_name), students(count), profiles(full_name)",
    )
    .order("class_name");
  return unwrap<ClassRow[]>(res as never);
}

export async function getClass(id: string): Promise<ClassRow | null> {
  const { data, error } = await supabase
    .from("classes")
    .select(
      "id, class_name, teacher_id, created_at, subjects(id, subject_name), students(count), profiles(full_name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as ClassRow) ?? null;
}

export async function getStudents(classId: string): Promise<StudentRow[]> {
  const res = await supabase
    .from("students")
    .select("id, class_id, roll_number, student_name")
    .eq("class_id", classId)
    .order("roll_number");
  return unwrap<StudentRow[]>(res as never);
}

export type EntryRow = {
  id: string;
  status: HwStatus;
  remarks: string | null;
  student_id: string;
  homework_session_id: string;
  students: { roll_number: number; student_name: string; class_id: string } | null;
  homework_sessions: {
    homework_date: string;
    class_id: string;
    subject_id: string;
    subjects: { subject_name: string } | null;
    classes: { class_name: string } | null;
    profiles: { full_name: string } | null;
  } | null;
};

const ENTRY_SELECT =
  "id, status, remarks, student_id, homework_session_id, students!inner(roll_number, student_name, class_id), homework_sessions!inner(homework_date, class_id, subject_id, subjects(subject_name), classes(class_name), profiles(full_name))";

export type EntryFilters = {
  classId?: string | undefined;
  subjectId?: string | undefined;
  studentId?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  status?: HwStatus | undefined;
};

export async function getEntries(f: EntryFilters): Promise<EntryRow[]> {
  let q = supabase.from("homework_entries").select(ENTRY_SELECT);
  if (f.classId) q = q.eq("homework_sessions.class_id", f.classId);
  if (f.subjectId) q = q.eq("homework_sessions.subject_id", f.subjectId);
  if (f.studentId) q = q.eq("student_id", f.studentId);
  if (f.from) q = q.gte("homework_sessions.homework_date", f.from);
  if (f.to) q = q.lte("homework_sessions.homework_date", f.to);
  if (f.status) q = q.eq("status", f.status);
  const res = await q
    .order("homework_date", { referencedTable: "homework_sessions", ascending: false })
    .limit(5000);
  return unwrap<EntryRow[]>(res as never);
}

export type SessionRow = {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  homework_date: string;
  created_at: string;
  classes?: { class_name: string } | null;
  subjects?: { subject_name: string } | null;
  profiles?: { full_name: string } | null;
};

export async function getSessions(opts: { date?: string | undefined; classId?: string | undefined } = {}) {
  let q = supabase
    .from("homework_sessions")
    .select(
      "id, class_id, subject_id, teacher_id, homework_date, created_at, classes(class_name), subjects(subject_name), profiles(full_name)",
    );
  if (opts.date) q = q.eq("homework_date", opts.date);
  if (opts.classId) q = q.eq("class_id", opts.classId);
  const res = await q.order("homework_date", { ascending: false }).limit(500);
  return unwrap<SessionRow[]>(res as never);
}

export async function findSession(classId: string, subjectId: string, date: string) {
  const { data, error } = await supabase
    .from("homework_sessions")
    .select("id, class_id, subject_id, teacher_id, homework_date")
    .eq("class_id", classId)
    .eq("subject_id", subjectId)
    .eq("homework_date", date)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as SessionRow | null) ?? null;
}

export async function getSessionEntries(sessionId: string) {
  const res = await supabase
    .from("homework_entries")
    .select("id, student_id, status, remarks")
    .eq("homework_session_id", sessionId);
  return unwrap<{ id: string; student_id: string; status: HwStatus; remarks: string | null }[]>(
    res as never,
  );
}

export async function saveHomework(input: {
  sessionId?: string | null | undefined;
  classId: string;
  subjectId: string;
  teacherId: string;
  date: string;
  marks: { student_id: string; status: HwStatus; remarks: string }[];
}) {
  let sessionId = input.sessionId ?? null;
  if (!sessionId) {
    const { data, error } = await supabase
      .from("homework_sessions")
      .insert({
        class_id: input.classId,
        subject_id: input.subjectId,
        teacher_id: input.teacherId,
        homework_date: input.date,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    sessionId = data.id;
  }
  const payload = input.marks.map((m) => ({
    homework_session_id: sessionId!,
    student_id: m.student_id,
    status: m.status,
    remarks: m.remarks.trim() || null,
  }));
  const { error: upErr } = await supabase
    .from("homework_entries")
    .upsert(payload, { onConflict: "homework_session_id,student_id" });
  if (upErr) throw new Error(upErr.message);
  return sessionId!;
}

export async function getTeachers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, mobile, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const { data: roles } = await supabase.from("user_roles").select("user_id, role");
  const adminIds = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
  return (data ?? []).filter((p) => !adminIds.has(p.id));
}

export async function getAllStudents() {
  const res = await supabase
    .from("students")
    .select("id, class_id, roll_number, student_name, classes!inner(class_name)")
    .order("roll_number")
    .limit(5000);
  return unwrap<(StudentRow & { classes: { class_name: string } })[]>(res as never);
}

export async function countAll(table: string) {
  const { count, error } = await supabase
    .from(table as never)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/* ---------------- mutations ---------------- */

export async function createClass(input: { class_name: string; teacher_id: string }) {
  const { data, error } = await supabase
    .from("classes")
    .insert({ class_name: input.class_name.trim(), teacher_id: input.teacher_id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function updateClass(id: string, input: { class_name?: string; teacher_id?: string }) {
  const { error } = await supabase.from("classes").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteClass(id: string) {
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addSubject(classId: string, name: string) {
  const { error } = await supabase
    .from("subjects")
    .insert({ class_id: classId, subject_name: name.trim() });
  if (error) throw new Error(error.message);
}

export async function deleteSubject(id: string) {
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addStudent(input: {
  class_id: string;
  roll_number: number;
  student_name: string;
}) {
  const { error } = await supabase.from("students").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateStudent(
  id: string,
  input: { roll_number?: number; student_name?: string; class_id?: string },
) {
  const { error } = await supabase.from("students").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteStudent(id: string) {
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function bulkAddStudents(
  classId: string,
  rows: { roll_number: number; student_name: string }[],
) {
  const { error } = await supabase
    .from("students")
    .upsert(
      rows.map((r) => ({ class_id: classId, ...r })),
      { onConflict: "class_id,roll_number" },
    );
  if (error) throw new Error(error.message);
  return rows.length;
}

export async function deleteSession(id: string) {
  const { error } = await supabase.from("homework_sessions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getStudent(id: string) {
  const { data, error } = await supabase
    .from("students")
    .select("id, class_id, roll_number, student_name, classes(class_name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as (StudentRow & { classes: { class_name: string } | null }) | null) ?? null;
}
