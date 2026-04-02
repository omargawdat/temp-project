"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateNote, deleteNote, deleteNoteAttachment } from "@/actions/note";
import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
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
  Paperclip,
  Link2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
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

interface NoteAttachmentData {
  id: string;
  type: string;
  url: string;
  filename: string;
  mimeType?: string | null;
}

interface NoteRowActionsProps {
  note: {
    id: string;
    content: string;
    noteType: string;
    createdBy: string;
    entityType: string;
    entityId: string;
    attachments?: NoteAttachmentData[];
  };
}

export function NoteRowActions({ note }: NoteRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [content, setContent] = useState(note.content);
  const [noteType, setNoteType] = useState(note.noteType);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newUrls, setNewUrls] = useState<string[]>([]);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    if (!content.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("content", content.trim());
      formData.set("noteType", noteType);
      for (const f of newFiles) formData.append("attachmentFiles", f);
      for (const u of newUrls) formData.append("attachmentUrls", u);
      const result = await updateNote(note.id, formData);
      if (result.success) {
        toast.success("Note updated");
        setEditOpen(false);
        setNewFiles([]);
        setNewUrls([]);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update note");
      }
    });
  }

  function handleRemoveAttachment(attachmentId: string) {
    startTransition(async () => {
      const result = await deleteNoteAttachment(attachmentId);
      if (result.success) {
        toast.success("Attachment removed");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to remove attachment");
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
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-secondary-foreground"
          title="Edit note"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setDeleteOpen(true); }}
          disabled={isPending}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
          title="Delete note"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogPortal>
            <AlertDialogOverlay />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete note?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => { setDeleteOpen(false); handleDelete(); }} disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialog>
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
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                          : "text-muted-foreground hover:text-muted-foreground hover:bg-accent",
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
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                className="w-full resize-none rounded-xl border border-border/30 bg-accent px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary/40 min-h-[160px]"
                autoFocus
              />
            </div>

            {/* Existing Attachments */}
            {note.attachments && note.attachments.length > 0 && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Attachments
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {note.attachments.map((att) => {
                    const isImage = att.type === "FILE" && att.mimeType?.startsWith("image/");
                    const Icon = att.type === "URL" ? ExternalLink : isImage ? ImageIcon : FileText;
                    return (
                      <div key={att.id} className="group/chip flex items-center gap-1.5 rounded-md border border-border/50 bg-accent px-2 py-1 text-xs">
                        <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="truncate max-w-[180px] text-primary hover:underline">
                          {att.filename}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          disabled={isPending}
                          className="ml-0.5 shrink-0 rounded p-0.5 text-muted-foreground hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add new attachments */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Add Attachments
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    setNewFiles((prev) => [...prev, ...files]);
                    e.target.value = "";
                  }}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  File
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  URL
                </button>
              </div>
              {showUrlInput && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="url"
                    value={urlInputValue}
                    onChange={(e) => setUrlInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && urlInputValue.trim()) {
                        e.preventDefault();
                        setNewUrls((prev) => [...prev, urlInputValue.trim()]);
                        setUrlInputValue("");
                        setShowUrlInput(false);
                      }
                      if (e.key === "Escape") { setShowUrlInput(false); setUrlInputValue(""); }
                    }}
                    placeholder="https://..."
                    className="flex-1 rounded-lg border border-border bg-accent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary/40"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (urlInputValue.trim()) {
                        setNewUrls((prev) => [...prev, urlInputValue.trim()]);
                        setUrlInputValue("");
                        setShowUrlInput(false);
                      }
                    }}
                    className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                  >
                    Add
                  </button>
                </div>
              )}
              {(newFiles.length > 0 || newUrls.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {newFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 rounded-md border border-border/50 bg-background px-2 py-1 text-xs">
                      <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate max-w-[150px] text-foreground">{f.name}</span>
                      <button type="button" onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))} className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-red-400">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {newUrls.map((url, i) => (
                    <div key={`url-${i}`} className="flex items-center gap-1.5 rounded-md border border-border/50 bg-background px-2 py-1 text-xs">
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate max-w-[150px] text-primary">{url}</span>
                      <button type="button" onClick={() => setNewUrls((prev) => prev.filter((_, idx) => idx !== i))} className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-red-400">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
