"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";

export function ToolbarSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (local === value) return;
    const timer = setTimeout(() => onChange(local), 300);
    return () => clearTimeout(timer);
  }, [local, value, onChange]);

  return (
    <InputGroup className="h-10 w-[280px] border-border bg-card">
      <InputGroupAddon>
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput
        placeholder="Search milestones..."
        value={local}
        onChange={(e) => setLocal(e.target.value)}
      />
      {local && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            onClick={() => { setLocal(""); onChange(""); }}
          >
            <X className="h-3 w-3" />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
