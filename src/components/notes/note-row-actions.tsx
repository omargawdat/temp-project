"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateNote, deleteNote } from "@/actions/note";
import {
  Pencil,
  Trash2,
  Loader2,
  X,
  Check,
  MessageSquare,
  Users,
  Gavel,
  ShieldAlert,
  ListTodo,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NOTE_TYPES = [
  { value: "GENERAL", label: "General", icon: MessageSquare, color: "bg-muted text-muted-foreground" },
  { value: "MEETING", label: "Meeting", icon: Users, color: "bg-blue-500/10 text-blue-400" },
  { value: "DECISION", label: "Decision", icon: Gavel, color: "bg-purple-500/10 text-purple-400" },
  { value: "RISK", label: "Risk", icon: ShieldAlert, color: "bg-red-500/10 text-red-400" },
  { value: "ACTION", label: "Action Item", icon: ListTodo, color: "bg-amber-500/10 text-amber-400" },
  { value: "FINANCE", label: "Finance", icon: Banknote, color: "bg-emerald-500/10 text-emerald-400" },
] as const;

interface NoteRowActionsProps {
  note: {
    id: string;
    content: string;
    noteType: string;
    createdBy: string;
    entityType: string;
    entityId: string;
  };
}

export function NoteRowActions({ note }: NoteRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [content, setContent] = useState(note.content);
  const [noteType, setNoteType] = useState(note.noteType);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    if (!content.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("content", content.trim());
      formData.set("noteType", noteType);
      const result = await updateNote(note.id, formData);
      if (result.success) {
        toast.success("Note updated");
        setEditOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update note");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteNote(note.id);
      if (result.success) {
        toast.success("Note deleted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete note");
      }
    });
  }

  function handleOpenEdit() {
    setContent(note.content);
    setNoteType(note.noteType);
    setEditOpen(true);
  }

  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="flex items-center justify-center gap-0.5" onClick={(e) => e.preventDefault()}>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); handleOpenEdit(); }}
          disabled={isPending}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground/70"
          title="Edit note"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); handleDelete(); }}
          disabled={isPending}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
          title="Delete note"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Edit Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Edit Note</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            {/* Note type selector */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
                Note Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {NOTE_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isActive = noteType === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setNoteType(t.value)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
                        isActive
                          ? t.color
                          : "text-muted-foreground/50 hover:text-muted-foreground/80 hover:bg-accent",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && content.trim()) {
                    handleSave();
                  }
                }}
                className="w-full resize-none rounded-xl border border-border/30 bg-accent px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/40 min-h-[160px]"
                autoFocus
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditOpen(false)}
                disabled={isPending}
              >
                <X className="mr-1 h-3 w-3" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isPending || !content.trim()}
                className="gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
