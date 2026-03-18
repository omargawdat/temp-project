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
  placeholder = "Search...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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
    <InputGroup className="h-10 w-[280px] border-border/20 bg-white/[0.03]">
      <InputGroupAddon>
        <Search className="h-3.5 w-3.5 text-muted-foreground/40" />
      </InputGroupAddon>
      <InputGroupInput
        placeholder={placeholder}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
      />
      {local && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            aria-label="Clear search"
            onClick={() => { setLocal(""); onChange(""); }}
          >
            <X className="h-3 w-3" />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
