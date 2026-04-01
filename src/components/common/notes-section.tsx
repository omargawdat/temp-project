"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { createNote, updateNote, deleteNote } from "@/actions/note";
import {
  StickyNote,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  MessageSquare,
  Users,
  Gavel,
  ShieldAlert,
  ListTodo,
  Banknote,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NoteData {
  id: string;
  content: string;
  noteType?: string;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

const NOTE_TYPES = [
  { value: "GENERAL", label: "General", icon: MessageSquare, color: "bg-muted text-muted-foreground", accent: "white" },
  { value: "MEETING", label: "Meeting", icon: Users, color: "bg-blue-500/10 text-blue-400", accent: "blue" },
  { value: "DECISION", label: "Decision", icon: Gavel, color: "bg-purple-500/10 text-purple-400", accent: "purple" },
  { value: "RISK", label: "Risk", icon: ShieldAlert, color: "bg-red-50 text-red-400", accent: "red" },
  { value: "ACTION", label: "Action Item", icon: ListTodo, color: "bg-amber-50 text-amber-400", accent: "amber" },
  { value: "FINANCE", label: "Finance", icon: Banknote, color: "bg-emerald-500/10 text-emerald-400", accent: "emerald" },
] as const;

function noteTypeStyle(type?: string) {
  return NOTE_TYPES.find((t) => t.value === type) ?? NOTE_TYPES[0];
}

function timeAgo(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function NoteItem({
  note,
  entityType,
  entityId,
}: {
  note: NoteData;
  entityType: string;
  entityId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSave() {
    if (!content.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("content", content.trim());
      await updateNote(note.id, formData);
      toast.success("Note updated");
      setEditing(false);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteNote(note.id);
      toast.success("Note deleted");
      router.refresh();
    });
  }

  function handleCancel() {
    setContent(note.content);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full resize-none rounded-md border border-border/50 bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40 min-h-[60px]"
          autoFocus
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleCancel} disabled={isPending}>
            <X className="mr-1 h-3 w-3" />
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={isPending || !content.trim()} className="gap-1">
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent">
      <div className="flex-1 min-w-0">
        {note.noteType && note.noteType !== "GENERAL" && (() => {
          const style = noteTypeStyle(note.noteType);
          const TypeIcon = style.icon;
          return (
            <div className="flex items-center gap-1.5 mb-1">
              <TypeIcon className={`h-3 w-3 ${style.color.split(" ")[1]}`} strokeWidth={2} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${style.color.split(" ")[1]}`}>
                {style.label}
              </span>
            </div>
          );
        })()}
        <p className="text-base text-foreground whitespace-pre-wrap">{note.content}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-muted-foreground">{note.createdBy}</span>
          <span>&middot;</span>
          <span>{timeAgo(note.createdAt)}</span>
          {new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() > 1000 && (
            <>
              <span>&middot;</span>
              <span className="italic">edited {timeAgo(note.updatedAt)}</span>
            </>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={isPending}
          aria-label="Edit note"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-secondary-foreground"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-label="Delete note"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-400"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}

export function NotesSection({
  entityType,
  entityId,
  notes,
}: {
  entityType: string;
  entityId: string;
  notes: NoteData[];
}) {
  const [adding, setAdding] = useState(false);
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState("GENERAL");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdd() {
    if (!content.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("content", content.trim());
      formData.set("createdBy", "System"); // TODO: replace with authenticated user
      formData.set("noteType", noteType);
      await createNote(entityType, entityId, formData);
      toast.success("Note added");
      setContent("");
      setNoteType("GENERAL");
      setAdding(false);
      router.refresh();
    });
  }

  return (
    <div id="notes" className="scroll-mt-8 overflow-hidden rounded-xl border border-border/25 bg-card/50">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-muted p-2">
            <StickyNote className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <span className="text-lg font-bold text-foreground">Notes</span>
          <span className="rounded-md bg-muted px-2.5 py-0.5 text-sm font-semibold tabular-nums text-muted-foreground/60">
            {notes.length}
          </span>
        </div>
        {!adding && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Note
          </Button>
        )}
      </div>

      <div className="divide-y divide-border/10">
        {/* Add note form */}
        {adding && (() => {
          const selected = NOTE_TYPES.find((t) => t.value === noteType) ?? NOTE_TYPES[0];
          const SelectedIcon = selected.icon;

          return (
            <div className="p-5">
              <div className="overflow-hidden rounded-xl border border-border/30 bg-accent">
                {/* Textarea */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && content.trim()) {
                      handleAdd();
                    }
                  }}
                  placeholder="Write a note..."
                  className="w-full resize-none bg-transparent px-4 pt-4 pb-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70 outline-none min-h-[110px]"
                  autoFocus
                />

                {/* Bottom toolbar */}
                <div className="flex items-center justify-between border-t border-border/15 px-2 py-1.5">
                  {/* Type chips — inline in toolbar */}
                  <div className="flex items-center gap-0.5">
                    {NOTE_TYPES.map((t) => {
                      const Icon = t.icon;
                      const isActive = noteType === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setNoteType(t.value)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                            isActive
                              ? `${t.color}`
                              : "text-muted-foreground hover:text-muted-foreground hover:bg-accent",
                          )}
                        >
                          <Icon className="h-3 w-3" strokeWidth={2} />
                          <span className={cn(isActive ? "inline" : "hidden sm:inline")}>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setAdding(false); setContent(""); setNoteType("GENERAL"); }}
                      disabled={isPending}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-secondary-foreground"
                    >
                      Cancel
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAdd}
                      disabled={isPending || !content.trim()}
                      className="h-7 gap-1.5 rounded-lg text-xs"
                    >
                      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Notes list */}
        {notes.map((note) => (
          <NoteItem key={note.id} note={note} entityType={entityType} entityId={entityId} />
        ))}

        {notes.length === 0 && !adding && (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No notes yet</p>
          </div>
        )}
      </div>
    </div>
  );
}