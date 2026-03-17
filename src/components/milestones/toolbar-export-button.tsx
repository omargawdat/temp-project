"use client";

import { useState } from "react";
import { Download, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ToolbarExportButton({ searchParams }: { searchParams: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function handleExport() {
    setState("loading");
    try {
      const url = `/api/milestones/export${searchParams ? `?${searchParams}` : ""}`;
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `milestones-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
      setState("done");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("idle");
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleExport}
      disabled={state === "loading"}
      className="h-8 w-8"
      title="Export CSV"
    >
      {state === "loading" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : state === "done" ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
