"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Plus, Trash2, X, Check, Copy, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createContact, updateContact, deleteContact } from "@/actions/contact";
import { toast } from "sonner";

interface ContactItem {
  id: string;
  name: string;
  type: "EMAIL" | "PHONE";
  value: string;
  createdAt: string | Date;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-secondary-foreground"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function ContactCard({
  contact,
  onDelete,
  onUpdate,
  disabled,
}: {
  contact: ContactItem;
  onDelete: () => void;
  onUpdate: (id: string, formData: FormData) => void;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(contact.name);
  const [editValue, setEditValue] = useState(contact.value);

  const href =
    contact.type === "EMAIL"
      ? `mailto:${contact.value}`
      : `tel:${contact.value}`;

  function handleSave() {
    const formData = new FormData();
    formData.set("name", editName);
    formData.set("type", contact.type);
    formData.set("value", editValue);
    onUpdate(contact.id, formData);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/[0.02] p-2">
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Name"
          className="h-8 text-sm flex-1"
        />
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={contact.type === "EMAIL" ? "email@example.com" : "+966 50 000 0000"}
          className="h-8 text-sm flex-1"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={handleSave}
          className="rounded-md p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setEditName(contact.name); setEditValue(contact.value); }}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-4 rounded-md py-1 px-1.5 -mx-1.5 transition-colors hover:bg-accent/50">
      <span className="text-sm font-medium text-foreground shrink-0">{contact.name}</span>
      <a
        href={href}
        className="text-sm text-muted-foreground hover:text-primary transition-colors truncate"
      >
        {contact.value}
      </a>
      <span className="text-xs text-muted-foreground/60 shrink-0">
        {new Date(contact.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </span>
      <div className="ml-auto flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton value={contact.value} />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-secondary-foreground"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function ContactsSection({
  entityType,
  entityId,
  contacts,
  bare = false,
}: {
  entityType: string;
  entityId: string;
  contacts: ContactItem[];
  bare?: boolean;
}) {
  const [addingType, setAddingType] = useState<"EMAIL" | "PHONE" | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const emails = contacts.filter((c) => c.type === "EMAIL");
  const phones = contacts.filter((c) => c.type === "PHONE");

  function handleAdd(formData: FormData) {
    if (!addingType) return;
    formData.set("type", addingType);
    startTransition(async () => {
      const result = await createContact(entityType, entityId, formData);
      if (result.success) {
        setAddingType(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to add contact.");
      }
    });
  }

  function handleUpdate(id: string, formData: FormData) {
    startTransition(async () => {
      const result = await updateContact(id, formData);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update contact.");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteContact(id);
      if (result.success) {
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete contact.");
      }
    });
  }

  function AddForm({ type }: { type: "EMAIL" | "PHONE" }) {
    if (addingType !== type) return null;
    return (
      <form action={handleAdd} className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/[0.02] p-2 mt-1">
        <Input name="name" placeholder="Name" required className="h-8 text-sm flex-1" />
        <Input
          name="value"
          placeholder={type === "EMAIL" ? "email@example.com" : "+966 50 000 0000"}
          required
          className="h-8 text-sm flex-1"
        />
        <Button type="submit" size="sm" disabled={isPending} className="h-8 gap-1 shrink-0 px-3">
          <Check className="h-3.5 w-3.5" />
          Save
        </Button>
        <button
          type="button"
          onClick={() => setAddingType(null)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </form>
    );
  }

  const content = (
    <>
      <h2 className="text-sm font-semibold text-foreground mb-2">Contacts</h2>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-6">
        {/* Email column */}
        <div>
          <div className="flex items-center gap-2 mb-1 pb-1 border-b border-border/50">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
              <Mail className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</span>
            {addingType !== "EMAIL" && (
              <button
                type="button"
                onClick={() => setAddingType("EMAIL")}
                className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {emails.length === 0 && addingType !== "EMAIL" && (
            <p className="text-xs text-muted-foreground py-2">No email contacts</p>
          )}
          <div className="space-y-0.5">
            {emails.map((c) => (
              <ContactCard key={c.id} contact={c} onDelete={() => handleDelete(c.id)} onUpdate={handleUpdate} disabled={isPending} />
            ))}
          </div>
          <AddForm type="EMAIL" />
        </div>

        {/* Separator */}
        <div className="w-px bg-border/50 self-stretch" />

        {/* Phone column */}
        <div>
          <div className="flex items-center gap-2 mb-1 pb-1 border-b border-border/50">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10">
              <Phone className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</span>
            {addingType !== "PHONE" && (
              <button
                type="button"
                onClick={() => setAddingType("PHONE")}
                className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {phones.length === 0 && addingType !== "PHONE" && (
            <p className="text-xs text-muted-foreground py-2">No phone contacts</p>
          )}
          <div className="space-y-0.5">
            {phones.map((c) => (
              <ContactCard key={c.id} contact={c} onDelete={() => handleDelete(c.id)} onUpdate={handleUpdate} disabled={isPending} />
            ))}
          </div>
          <AddForm type="PHONE" />
        </div>
      </div>
    </>
  );

  if (bare) return content;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {content}
    </div>
  );
}
