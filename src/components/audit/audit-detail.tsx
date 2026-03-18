"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { JsonValue } from "@prisma/client/runtime/library";

interface AuditDetailProps {
  changes: JsonValue;
  metadata: JsonValue;
}

export function AuditDetail({ changes, metadata }: AuditDetailProps) {
  const [open, setOpen] = useState(false);

  const hasChanges = changes && typeof changes === "object";
  const hasMetadata = metadata && typeof metadata === "object";

  if (!hasChanges && !hasMetadata) {
    return <span className="text-muted-foreground/30 text-xs">—</span>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        Details
      </button>

      {open && (
        <div className="mt-2 space-y-3 rounded-lg border border-border/20 bg-black/20 p-3 text-xs">
          {hasChanges && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/60">
                Changes
              </p>
              <ChangesView changes={changes as Record<string, unknown>} />
            </div>
          )}
          {hasMetadata && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/60">
                Metadata
              </p>
              <div className="space-y-1">
                {Object.entries(metadata as Record<string, unknown>).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-muted-foreground/50 shrink-0">{key}:</span>
                    <span className="text-foreground/70 break-all">{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function ChangesView({ changes }: { changes: Record<string, unknown> }) {
  const before = (changes.before ?? {}) as Record<string, unknown>;
  const after = (changes.after ?? {}) as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];

  if (keys.length === 0) {
    return <span className="text-muted-foreground/30">No changes recorded</span>;
  }

  return (
    <div className="space-y-1.5">
      {keys.map((key) => (
        <div key={key} className="flex items-baseline gap-2">
          <span className="text-muted-foreground/50 shrink-0 w-24 text-right">{key}</span>
          <span className="text-red-400/70 line-through">{formatValue(before[key])}</span>
          <span className="text-muted-foreground/30">&rarr;</span>
          <span className="text-emerald-400/70">{formatValue(after[key])}</span>
        </div>
      ))}
    </div>
  );
}
