import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { STATUS_META, type HwStatus } from "@/lib/hw";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    danger: "bg-destructive/12 text-destructive",
  };
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        {icon ? (
          <span className={cn("flex size-11 items-center justify-center rounded-xl", tones[tone])}>
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ status }: { status: HwStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant="outline" className={cn("font-medium", meta.badge)}>
      {meta.short} {meta.label}
    </Badge>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function ErrorBlock({ error }: { error: Error }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/8 p-4 text-sm text-destructive"
    >
      {error.message || "Something went wrong."}
    </div>
  );
}

export function PercentPill({ percent }: { percent: number }) {
  const tone =
    percent >= 80
      ? "bg-success/12 text-success border-success/30"
      : percent >= 50
        ? "bg-warning/15 text-warning-foreground border-warning/40"
        : "bg-destructive/12 text-destructive border-destructive/30";
  return (
    <Badge variant="outline" className={cn("font-semibold", tone)}>
      {percent}%
    </Badge>
  );
}
