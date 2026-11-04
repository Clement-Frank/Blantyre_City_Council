"use client";

// Download / print controls shared by every report page.
// CSV comes from /api/reports/export (same role scoping as the page), and
// Print opens the browser print dialog where "Save as PDF" produces the
// council-ready document — the print stylesheet strips the app chrome.

import { Download, Printer, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ReportToolbar({
  type,
  date,
  label = "Download CSV",
}: {
  type: "daily" | "monthly" | "compliance" | "collectors" | "revenue";
  date?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type });
      if (date) params.set("date", date);
      const res = await fetch(`/api/reports/export?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not generate the report");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `msika-${type}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1 no-print">
      <div className="flex items-center gap-2">
        <button
          onClick={download}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3d5a45] hover:bg-[#2d4335] disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-[#3d5a45]/20"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {busy ? "Generating…" : label}
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-colors"
          title="Print or save as PDF"
        >
          <Printer size={16} />
          Print / PDF
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
