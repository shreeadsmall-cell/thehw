export type HwStatus = "completed" | "incomplete" | "not_submitted" | "absent";

export const HW_STATUSES: HwStatus[] = ["completed", "incomplete", "not_submitted", "absent"];

export const STATUS_META: Record<
  HwStatus,
  { label: string; short: string; badge: string; button: string }
> = {
  completed: {
    label: "Completed",
    short: "✓",
    badge: "bg-success/12 text-success border-success/30",
    button: "bg-success text-success-foreground border-success hover:bg-success/90",
  },
  incomplete: {
    label: "Incomplete",
    short: "⚠",
    badge: "bg-warning/15 text-warning-foreground border-warning/40",
    button: "bg-warning text-warning-foreground border-warning hover:bg-warning/90",
  },
  not_submitted: {
    label: "Not Submitted",
    short: "✕",
    badge: "bg-destructive/12 text-destructive border-destructive/30",
    button: "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90",
  },
  absent: {
    label: "Absent",
    short: "A",
    badge: "bg-muted text-muted-foreground border-border",
    button: "bg-foreground text-background border-foreground hover:bg-foreground/90",
  },
};

export type Tally = {
  total: number;
  completed: number;
  incomplete: number;
  not_submitted: number;
  absent: number;
  percent: number;
};

export function emptyTally(): Tally {
  return { total: 0, completed: 0, incomplete: 0, not_submitted: 0, absent: 0, percent: 0 };
}

export function tally(statuses: HwStatus[]): Tally {
  const t = emptyTally();
  for (const s of statuses) {
    t.total += 1;
    t[s] += 1;
  }
  t.percent = t.total ? Math.round((t.completed / t.total) * 1000) / 10 : 0;
  return t;
}

export function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

export function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function slug(text: string) {
  return text.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function fileDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
