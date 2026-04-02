"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { createNote, updateNote, deleteNote, deleteNoteAttachment } from "@/actions/note";
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
  CalendarClock,
  Paperclip,
  Link2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NoteAttachmentData {
  id: string;
  type: string;
  url: string;
  filename: string;
  mimeType?: string | null;
}

interface NoteData {
  id: string;
  content: string;
  noteType?: string;
  createdBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  attachments?: NoteAttachmentData[];
}

interface PendingFile {
  file: File;
  preview?: string;
}

const NOTE_TYPES = [
  { value: "GENERAL", label: "General", icon: MessageSquare, color: "bg-slate-100 text-slate-600", accent: "white" },
  { value: "MEETING", label: "Meeting", icon: Users, color: "bg-blue-50 text-blue-600", accent: "blue" },
  { value: "DECISION", label: "Decision", icon: Gavel, color: "bg-purple-50 text-purple-600", accent: "purple" },
  { value: "RISK", label: "Risk", icon: ShieldAlert, color: "bg-red-50 text-red-600", accent: "red" },
  { value: "ACTION", label: "Action Item", icon: ListTodo, color: "bg-amber-50 text-amber-600", accent: "amber" },
  { value: "FINANCE", label: "Finance", icon: Banknote, color: "bg-emerald-50 text-emerald-600", accent: "emerald" },
  { value: "FOLLOW_UP", label: "Follow Up", icon: CalendarClock, color: "bg-cyan-50 text-cyan-600", accent: "cyan" },
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

function isImageMime(mime?: string | null) {
  return mime?.startsWith("image/");
}

function AttachmentChip({ attachment, onRemove }: { attachment: NoteAttachmentData; onRemove?: () => void }) {
  const isImage = attachment.type === "FILE" && isImageMime(attachment.mimeType);
  const Icon = attachment.type === "URL" ? ExternalLink : isImage ? ImageIcon : FileText;

  const isUrl = attachment.type === "URL";
  const chipColor = isUrl
    ? "bg-purple-50 text-purple-700 ring-1 ring-purple-200"
    : "bg-blue-50 text-blue-700 ring-1 ring-blue-200";

  return (
    <div className={`group/chip flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${chipColor}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="truncate max-w-[180px] hover:underline"
      >
        {attachment.filename}
      </a>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onRemove(); }}
          className={`ml-0.5 shrink-0 rounded-full p-0.5 opacity-0 transition-opacity group-hover/chip:opacity-100 ${isUrl ? "hover:bg-purple-200" : "hover:bg-blue-200"}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function AttachmentDisplay({ attachments }: { attachments: NoteAttachmentData[] }) {
  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => a.type === "FILE" && isImageMime(a.mimeType));
  const others = attachments.filter((a) => !(a.type === "FILE" && isImageMime(a.mimeType)));

  return (
    <div className="mt-2 space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <a
              key={img.id}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/img block overflow-hidden rounded-lg border border-border/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.filename}
                className="h-20 w-20 object-cover transition-transform group-hover/img:scale-105"
              />
            </a>
          ))}
        </div>
      )}
      {others.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {others.map((att) => (
            <AttachmentChip key={att.id} attachment={att} />
          ))}
        </div>
      )}
    </div>
  );
}

function PendingAttachments({
  files,
  urls,
  onRemoveFile,
  onRemoveUrl,
}: {
  files: PendingFile[];
  urls: string[];
  onRemoveFile: (index: number) => void;
  onRemoveUrl: (index: number) => void;
}) {
  if (files.length === 0 && urls.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 border-t border-border/15 px-4 py-3">
      {files.map((f, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
          {f.file.type.startsWith("image/") ? (
            <ImageIcon className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <FileText className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate max-w-[180px]">{f.file.name}</span>
          <button type="button" onClick={() => onRemoveFile(i)} className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-blue-200">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {urls.map((url, i) => (
        <div key={`url-${i}`} className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 ring-1 ring-purple-200">
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[180px]">{url}</span>
          <button type="button" onClick={() => onRemoveUrl(i)} className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-purple-200">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [content, setContent] = useState(note.content);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSave() {
    if (!content.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("content", content.trim());
      const result = await updateNote(note.id, formData);
      if (result.success) {
        toast.success("Note updated");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update note.");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteNote(note.id);
      if (result.success) {
        toast.success("Note deleted");
        setDeleteOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete note.");
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
        toast.error(result.error ?? "Failed to remove attachment.");
      }
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
        {note.attachments && note.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {note.attachments.map((att) => (
              <AttachmentChip
                key={att.id}
                attachment={att}
                onRemove={() => handleRemoveAttachment(att.id)}
              />
            ))}
          </div>
        )}
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
        {note.attachments && note.attachments.length > 0 && (
          <AttachmentDisplay attachments={note.attachments} />
        )}
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
          {note.attachments && note.attachments.length > 0 && (
            <>
              <span>&middot;</span>
              <Paperclip className="h-3 w-3" />
              <span>{note.attachments.length}</span>
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
          onClick={() => setDeleteOpen(true)}
          disabled={isPending}
          aria-label="Delete note"
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
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
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [pendingUrls, setPendingUrls] = useState<string[]>([]);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAddFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newPending = files.map((file) => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
    e.target.value = "";
  }

  function handleAddUrl() {
    if (!urlInputValue.trim()) return;
    setPendingUrls((prev) => [...prev, urlInputValue.trim()]);
    setUrlInputValue("");
    setShowUrlInput(false);
  }

  function handleAdd() {
    if (!content.trim()) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("content", content.trim());
      formData.set("createdBy", "System");
      formData.set("noteType", noteType);

      for (const pf of pendingFiles) {
        formData.append("attachmentFiles", pf.file);
      }
      for (const url of pendingUrls) {
        formData.append("attachmentUrls", url);
      }

      const result = await createNote(entityType, entityId, formData);
      if (result.success) {
        toast.success("Note added");
        setContent("");
        setNoteType("GENERAL");
        setPendingFiles([]);
        setPendingUrls([]);
        setAdding(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to add note.");
      }
    });
  }

  function resetForm() {
    setAdding(false);
    setContent("");
    setNoteType("GENERAL");
    setPendingFiles([]);
    setPendingUrls([]);
    setShowUrlInput(false);
    setUrlInputValue("");
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

                {/* Pending attachments */}
                <PendingAttachments
                  files={pendingFiles}
                  urls={pendingUrls}
                  onRemoveFile={(i) => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  onRemoveUrl={(i) => setPendingUrls((prev) => prev.filter((_, idx) => idx !== i))}
                />

                {/* URL input */}
                {showUrlInput && (
                  <div className="flex items-center gap-2 border-t border-border/15 px-4 py-2">
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <input
                      type="url"
                      value={urlInputValue}
                      onChange={(e) => setUrlInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); handleAddUrl(); }
                        if (e.key === "Escape") { setShowUrlInput(false); setUrlInputValue(""); }
                      }}
                      placeholder="https://..."
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 outline-none"
                      autoFocus
                    />
                    <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={handleAddUrl} disabled={!urlInputValue.trim()}>
                      Add
                    </Button>
                    <button type="button" onClick={() => { setShowUrlInput(false); setUrlInputValue(""); }} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Bottom toolbar */}
                <div className="flex items-center justify-between border-t border-border/15 px-2 py-1.5">
                  {/* Left: type chips + attachment buttons */}
                  <div className="flex items-center gap-1">
                    {NOTE_TYPES.map((t) => {
                      const Icon = t.icon;
                      const isActive = noteType === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setNoteType(t.value)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150",
                            isActive
                              ? `${t.color} border-current/20`
                              : "border-border text-muted-foreground hover:bg-accent",
                          )}
                        >
                          <Icon className="h-3 w-3" strokeWidth={2} />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                    <div className="mx-1 h-4 w-px bg-border/30" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleAddFiles}
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      title="Attach file"
                    >
                      <Paperclip className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(true)}
                      className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      title="Attach URL"
                    >
                      <Link2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={resetForm}
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
        <div className="divide-y divide-border/50">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} entityType={entityType} entityId={entityId} />
          ))}
        </div>

        {notes.length === 0 && !adding && (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No notes yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
