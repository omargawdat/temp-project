"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Check, Loader2, ChevronDown, FileSpreadsheet, FileJson, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FORMATS = [
  { key: "csv", label: "CSV", description: "Comma-separated values", icon: FileText },
  { key: "xlsx", label: "Excel", description: "Excel spreadsheet (.xls)", icon: FileSpreadsheet },
  { key: "json", label: "JSON", description: "Structured data format", icon: FileJson },
] as const;

export function ToolbarExportButton({
  searchParams,
  exportPath,
  filenamePrefix,
}: {
  searchParams: string;
  exportPath: string;
  filenamePrefix: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleExport(format: string) {
    setOpen(false);
    setState("loading");
    try {
      const sep = searchParams ? "&" : "";
      const url = `${exportPath}?format=${format}${sep}${searchParams}`;
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = format === "xlsx" ? "xls" : format;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
      setState("done");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("idle");
    }
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        disabled={state === "loading"}
        className="h-8 gap-1.5 text-xs font-medium"
      >
        {state === "loading" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : state === "done" ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {state === "done" ? "Exported" : "Export"}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-[220px] rounded-xl border border-border/50 bg-card p-1.5 shadow-2xl shadow-black/40">
          {FORMATS.map((fmt) => (
            <button
              key={fmt.key}
              type="button"
              onClick={() => handleExport(fmt.key)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/50"
            >
              <fmt.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <span className="block text-sm font-medium text-foreground/80">{fmt.label}</span>
                <span className="block text-[11px] text-muted-foreground/50">{fmt.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
