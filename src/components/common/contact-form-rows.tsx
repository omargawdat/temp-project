"use client";

import { Mail, Phone, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface ContactRow {
  name: string;
  type: "EMAIL" | "PHONE";
  value: string;
}

export function ContactFormRows({
  contacts,
  onChange,
}: {
  contacts: ContactRow[];
  onChange: (contacts: ContactRow[]) => void;
}) {
  function add() {
    onChange([...contacts, { name: "", type: "EMAIL", value: "" }]);
  }

  function remove(index: number) {
    onChange(contacts.filter((_, i) => i !== index));
  }

  function update(index: number, field: keyof ContactRow, val: string) {
    const updated = contacts.map((c, i) =>
      i === index ? { ...c, [field]: val } : c,
    );
    onChange(updated);
  }

  return (
    <div className="space-y-2">
      {contacts.map((contact, i) => (
        <div key={i} className="rounded-lg border bg-accent/30 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={contact.name}
              onChange={(e) => update(i, "name", e.target.value)}
              placeholder="Contact name"
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 shrink-0 rounded-md bg-accent/50 p-1">
              <label className="flex cursor-pointer items-center justify-center gap-1 rounded-sm px-2 text-xs text-muted-foreground transition-all hover:text-muted-foreground has-[:checked]:bg-primary/15 has-[:checked]:text-primary has-[:checked]:ring-1 has-[:checked]:ring-primary/30">
                <input
                  type="radio"
                  checked={contact.type === "EMAIL"}
                  onChange={() => update(i, "type", "EMAIL")}
                  className="sr-only"
                />
                <Mail className="h-3.5 w-3.5" />
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-1 rounded-sm px-2 text-xs text-muted-foreground transition-all hover:text-muted-foreground has-[:checked]:bg-primary/15 has-[:checked]:text-primary has-[:checked]:ring-1 has-[:checked]:ring-primary/30">
                <input
                  type="radio"
                  checked={contact.type === "PHONE"}
                  onChange={() => update(i, "type", "PHONE")}
                  className="sr-only"
                />
                <Phone className="h-3.5 w-3.5" />
              </label>
            </div>
            <Input
              value={contact.value}
              onChange={(e) => update(i, "value", e.target.value)}
              placeholder={contact.type === "EMAIL" ? "email@example.com" : "+966 50 000 0000"}
              className="flex-1"
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={add}
        className="w-full gap-1.5 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Contact
      </Button>
    </div>
  );
}
