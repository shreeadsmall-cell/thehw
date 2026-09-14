import { useRef, useState } from "react";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Download, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { bulkAddStudents, getClasses, getStudents } from "@/lib/data";
import { PageHeader, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/students/import")({
  validateSearch: z.object({ classId: z.string().optional() }),
  head: () => ({ meta: [{ title: "Import Students — School Homework Tracker" }] }),
  component: ImportStudentsPage,
});

type ImportRow = {
  rowNumber: number;
  roll_number: number | null;
  student_name: string;
  error?: string | undefined;
};

const REPORT_MESSAGE =
  "This file appears to be a student report/export file. Student import requires only Roll Number and Name columns.";

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function displayHeader(value: unknown) {
  return String(value ?? "").replace(/^\uFEFF/, "").trim();
}

function ImportStudentsPage() {
  const { classId: initialClass } = useSearch({ from: "/_authenticated/students/import" });
  const [classId, setClassId] = useState(initialClass ?? "");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [validationMessage, setValidationMessage] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [reading, setReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const classes = useQuery({ queryKey: ["classes"], queryFn: getClasses });
  const students = useQuery({
    queryKey: ["students", classId],
    queryFn: () => getStudents(classId),
    enabled: Boolean(classId),
  });
  const queryClient = useQueryClient();
  const validRows = rows.filter((row) => !row.error && row.roll_number !== null);

  const importRows = useMutation({
    mutationFn: () =>
      bulkAddStudents(
        classId,
        validRows.map(({ roll_number, student_name }) => ({
          roll_number: roll_number!,
          student_name,
        })),
      ),
    onSuccess: (count) => {
      toast.success(`${count} Students Imported Successfully`);
      queryClient.invalidateQueries({ queryKey: ["students", classId] });
      setRows([]);
      setDetectedColumns([]);
      setValidationMessage("");
      setSelectedFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function parseFile(file: File) {
    setSelectedFileName(file.name);
    setReading(true);
    setRows([]);
    setDetectedColumns([]);
    setValidationMessage("");
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error("The selected file does not contain a worksheet.");
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName]!, {
        header: 1,
        defval: "",
        blankrows: false,
      });
      const headers = (matrix[0] ?? []).map(displayHeader).filter(Boolean);
      const normalized = headers.map(normalizeHeader);
      const rollIndex = normalized.indexOf("roll number");
      const nameIndex = normalized.indexOf("name");
      const unsupportedColumns = normalized.filter(
        (header) => header !== "roll number" && header !== "name",
      );
      setDetectedColumns(headers);

      if (unsupportedColumns.length > 0) {
        setValidationMessage(
          unsupportedColumns.some((header) =>
            [
              "total homework",
              "completed",
              "incomplete",
              "not submitted",
              "absent",
              "completion %",
              "completion",
            ].includes(header),
          )
            ? REPORT_MESSAGE
            : "Student import accepts only Roll Number and Name columns.",
        );
        return;
      }
      if (rollIndex === -1 || nameIndex === -1 || headers.length !== 2) {
        setValidationMessage("Required columns: Roll Number and Name.");
        return;
      }

      const existingRolls = new Set((students.data ?? []).map((student) => student.roll_number));
      const seenRolls = new Set<number>();
      const parsedRows: ImportRow[] = [];
      matrix.slice(1).forEach((values, index) => {
        const rollValue = String(values[rollIndex] ?? "").trim();
        const name = String(values[nameIndex] ?? "").trim();
        if (!rollValue && !name) return;
        const roll = /^\d+$/.test(rollValue) ? Number(rollValue) : null;
        let error: string | undefined;
        if (!rollValue) error = "Roll Number is missing";
        else if (roll === null || roll < 1) error = "Roll Number is invalid";
        else if (!name) error = "Student Name is missing";
        else if (existingRolls.has(roll) || seenRolls.has(roll)) error = "Duplicate Roll Number";
        if (roll !== null) seenRolls.add(roll);
        parsedRows.push({ rowNumber: index + 2, roll_number: roll, student_name: name, error });
      });
      setRows(parsedRows);
    } catch (error) {
      setValidationMessage(error instanceof Error ? error.message : "Unable to read this file.");
    } finally {
      setReading(false);
    }
  }

  async function downloadSample() {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([["Roll Number", "Name"], [1, "Example Student"]]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Students");
    const output = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const url = URL.createObjectURL(new Blob([output], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "student-import-template.xlsx";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const selectedClass = classes.data?.find((item) => item.id === classId);

  return (
    <div>
      <PageHeader
        title="Import students"
        description="Upload a file containing only Roll Number and Name."
        actions={<Button variant="outline" onClick={downloadSample}><Download className="size-4" /> Download Sample Excel Template</Button>}
      />
      <div className="mb-5 max-w-md">
        <label className="text-sm font-medium" htmlFor="import-class">Select class</label>
        <select id="import-class" className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm" value={classId} onChange={(event) => { setClassId(event.target.value); setRows([]); setValidationMessage(""); setSelectedFileName(""); }}>
          <option value="">Select class</option>
          {(classes.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.class_name}</option>)}
        </select>
      </div>
      <Card>
        <CardContent className="space-y-5 p-6">
          <input ref={fileInputRef} className="hidden" type="file" accept=".xlsx,.xls,.csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void parseFile(file); }} />
          <div className="rounded-xl border border-dashed p-8 text-center">
            <FileUp className="mx-auto size-8 text-primary" />
            <p className="mt-2 font-medium">Choose a student file</p>
            <p className="mt-1 text-sm text-muted-foreground">XLSX, XLS or CSV</p>
            <Button
              type="button"
              className="mt-4"
              disabled={reading || !classId || students.isLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              {reading ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
              {reading ? "Reading file…" : "Choose File"}
            </Button>
            {selectedFileName ? <p className="mt-3 text-sm text-muted-foreground">Selected file: {selectedFileName}</p> : null}
          </div>

          {validationMessage ? <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">{validationMessage}</p>
            <div><p className="font-medium">Required columns:</p><ul className="list-inside list-disc text-muted-foreground"><li>Roll Number</li><li>Name</li></ul></div>
            {detectedColumns.length ? <div><p className="font-medium">Detected columns:</p><ul className="list-inside list-disc text-muted-foreground">{detectedColumns.map((column, index) => <li key={`${column}-${index}`}>{column}</li>)}</ul></div> : null}
          </div> : null}

          {rows.length ? <>
            <div className="grid gap-3 sm:grid-cols-3"><Metric label="Total Rows" value={rows.length} /><Metric label="Valid Rows" value={validRows.length} tone="success" /><Metric label="Invalid Rows" value={rows.length - validRows.length} tone="danger" /></div>
            <div className="max-h-80 overflow-auto rounded-lg border"><div className="grid grid-cols-[70px_1fr_1fr] border-b p-3 text-sm font-medium"><span>Row</span><span>Roll Number</span><span>Name / Error</span></div>{rows.map((row) => <div className="grid grid-cols-[70px_1fr_1fr] border-b p-3 text-sm" key={row.rowNumber}><span>{row.rowNumber}</span><span>{row.roll_number ?? "-"}</span><span className={row.error ? "text-destructive" : ""}>{row.error ?? row.student_name}</span></div>)}</div>
            <Button onClick={() => importRows.mutate()} disabled={!classId || !validRows.length || importRows.isPending || students.isLoading}>{importRows.isPending ? "Importing…" : `Import ${validRows.length} Students`}</Button>
          </> : <EmptyState title="No file selected" description={selectedClass ? `Students will be added to ${selectedClass.class_name}.` : "Select a class, then choose a file to preview it."} />}
        </CardContent>
      </Card>
      <Button variant="link" asChild><Link to="/students">Back to students</Link></Button>
    </div>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "danger" }) {
  const colors = { default: "bg-muted", success: "bg-success/10", danger: "bg-destructive/10" };
  return <div className={`rounded-lg p-3 ${colors[tone]}`}><span className="text-sm">{label}</span><strong className="block text-xl">{value}</strong></div>;
}
