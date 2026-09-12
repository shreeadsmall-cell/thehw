export type Row = Record<string, string | number>;

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportExcel(filename: string, sheetName: string, rows: Row[]) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const widths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(
      key.length + 2,
      ...rows.map((r) => String(r[key] ?? "").length + 2).concat([10]),
    ),
  }));
  (ws as unknown as { "!cols": unknown })["!cols"] = widths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 30) || "Report");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  download(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`,
  );
}

export function exportCSV(filename: string, rows: Row[]) {
  const keys = Object.keys(rows[0] ?? {});
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => escape(r[k])).join(","))].join(
    "\n",
  );
  download(
    new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" }),
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
  );
}

export async function exportPDF(
  filename: string,
  title: string,
  subtitle: string[],
  rows: Row[],
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const keys = Object.keys(rows[0] ?? {});

  doc.setFontSize(16);
  doc.text(title, 40, 42);
  doc.setFontSize(10);
  doc.setTextColor(110);
  subtitle.forEach((line, i) => doc.text(line, 40, 62 + i * 14));

  autoTable(doc, {
    startY: 70 + subtitle.length * 14,
    head: [keys],
    body: rows.map((r) => keys.map((k) => String(r[k] ?? ""))),
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [39, 68, 114], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    theme: "grid",
  });

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
