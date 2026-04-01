"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Project } from "@prisma/client";
import type { Serialized } from "@/lib/serialize";
import { createProject, updateProject } from "@/actions/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProjectDatePicker } from "@/components/ui/date-picker";
import { FieldWrapper } from "@/components/common/field-wrapper";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/constants";
import { toDateInputValue, getInitials } from "@/lib/format";
import type { ActionResult } from "@/types";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  Building2,
  Hash,
  User,
  DollarSign,
  Coins,
  CreditCard,
  Mail,
  Monitor,
  FileText,
  Handshake,
  BadgeCheck,
  Settings,
  ImagePlus,
  X,
  ChevronDown,
  Search,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function SubmitButton({ isEdit, isDirty }: { isEdit: boolean; isDirty: boolean }) {
  const { pending } = useFormStatus();
  const enabled = isDirty || !isEdit;
  return (
    <div className="sticky bottom-0 -mx-4 -mb-6 border-t border-border/20 bg-card/95 px-4 py-4 backdrop-blur-sm">
      <Button
        type="submit"
        disabled={pending || !enabled}
        className={`w-full rounded-md py-4.5 text-sm font-semibold tracking-wide transition-all active:scale-[0.99] ${
          enabled
            ? "bg-gradient-to-r from-teal-600 to-teal-500 text-foreground shadow-lg shadow-teal-600/25 hover:from-teal-500 hover:to-teal-400 hover:shadow-teal-500/30"
            : "bg-muted text-muted-foreground/40 shadow-none"
        }`}
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {pending ? "Saving…" : isEdit ? "Update Project" : "Register Project"}
      </Button>
    </div>
  );
}


function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  accentColor,
  step,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  accentColor: string;
  step: number;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentColor}`}
      >
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>
      <div className="flex-1">
        <h3 className="text-foreground text-sm font-semibold">{title}</h3>
        <p className="text-muted-foreground text-[11px]">{subtitle}</p>
      </div>
      <span className="bg-accent text-muted-foreground flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold">
        {step}
      </span>
    </div>
  );
}

export function ProjectForm({
  project,
  projectManagers,
  clients,
  onSuccess,
}: {
  project?: Project | Serialized<Project>;
  projectManagers: { id: string; name: string; title?: string | null; photoUrl?: string | null }[];
  clients: { id: string; name: string; imageUrl?: string | null }[];
  onSuccess?: (id: string) => void;
}) {
  const isEdit = !!project;
  const [isDirty, setIsDirty] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(
    project?.imageUrl ?? null,
  );
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  // Client selector state
  const [clientOpen, setClientOpen] = React.useState(false);
  const [clientSearch, setClientSearch] = React.useState("");
  const [selectedClientId, setSelectedClientId] = React.useState(project?.clientId ?? "");
  const clientRef = React.useRef<HTMLDivElement>(null);
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const filteredClients = clientSearch
    ? clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
    : clients;

  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setClientOpen(false);
        setClientSearch("");
      }
    }
    if (clientOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [clientOpen]);

  async function handleAction(
    _prevState: ActionResult<{ id: string }> | null,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> {
    if (isEdit) {
      return updateProject(project!.id, formData);
    }
    return createProject(formData);
  }

  const [state, formAction] = useActionState(handleAction, null);
  const toastedState = React.useRef<typeof state>(null);

  const fieldError = (field: string) =>
    state && !state.success ? state.fieldErrors?.[field]?.[0] : undefined;

  React.useEffect(() => {
    if (state?.success && state.data?.id && toastedState.current !== state) {
      toastedState.current = state;
      toast.success(isEdit ? "Project updated" : "Project created");
      onSuccess?.(state.data.id);
    }
  }, [state, onSuccess, isEdit]);

  const selectClass =
    "flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <form action={formAction} className="space-y-6" onChange={() => setIsDirty(true)}>
      {/* Error */}
      {state && !state.success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
          <span className="text-red-300">{state.error}</span>
        </motion.div>
      )}

      {/* Section 1: Contract & Client */}
      <div className="border-border/50 bg-card rounded-lg border p-6 shadow-lg shadow-black/10">
        <SectionHeader
          icon={Handshake}
          title={isEdit ? "Project & Client Details" : "Contract & Client Details"}
          subtitle={isEdit ? "Update project and client information" : "Enter details from the signed contract"}
          accentColor="bg-accent text-primary"
          step={1}
        />
        <div className="space-y-4">
          {/* Project Image */}
          <div>
            <label className="text-foreground mb-2 flex items-center gap-2 text-sm font-medium">
              <ImagePlus className="h-4 w-4 text-muted-foreground" />
              Project Image
              <span className="text-muted-foreground/40 text-xs font-normal">(optional)</span>
            </label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Project"
                    className="h-20 w-20 rounded-xl object-cover ring-1 ring-ring/20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      if (imageInputRef.current) imageInputRef.current.value = "";
                      setIsDirty(true);
                    }}
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/80 text-foreground transition-colors hover:bg-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-border/50 bg-white/[0.02] text-muted-foreground/30 transition-colors hover:border-teal-500/30 hover:bg-teal-500/[0.03] hover:text-primary/50"
                >
                  <ImagePlus className="h-6 w-6" />
                </button>
              )}
              <input
                ref={imageInputRef}
                type="file"
                name="image"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImagePreview(URL.createObjectURL(file));
                    setIsDirty(true);
                  }
                }}
              />
              <div className="text-[11px] text-muted-foreground/40 leading-relaxed">
                <p>Upload a cover image for this project.</p>
                <p>JPG, PNG or WebP. Max 5MB.</p>
              </div>
            </div>
          </div>

          <FieldWrapper icon={Building2} label="Client" htmlFor="clientId" error={fieldError("clientId")}>
            <input type="hidden" name="clientId" value={selectedClientId} required />
            <div className="relative" ref={clientRef}>
              <button
                type="button"
                onClick={() => { setClientOpen(!clientOpen); setClientSearch(""); }}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm transition-colors",
                  clientOpen
                    ? "border-teal-500/40 ring-2 ring-teal-500/20"
                    : "border-border hover:border-border/80",
                  selectedClient ? "text-foreground" : "text-muted-foreground/50",
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  {selectedClient?.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedClient.imageUrl} alt={selectedClient.name} className="h-5 w-5 rounded-full object-cover ring-1 ring-ring/20" />
                  )}
                  {selectedClient?.name ?? "Select a client"}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground/40 transition-transform", clientOpen && "rotate-180")} />
              </button>

              {clientOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl shadow-black/40">
                  {/* Search */}
                  <div className="border-b border-border/20 p-2">
                    <div className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2">
                      <Search className="h-3.5 w-3.5 text-muted-foreground/40" />
                      <input
                        type="text"
                        placeholder="Search clients..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 outline-none"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Options */}
                  <div className="max-h-[200px] overflow-y-auto p-1.5">
                    {filteredClients.map((c) => {
                      const isActive = c.id === selectedClientId;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedClientId(c.id);
                            setClientOpen(false);
                            setClientSearch("");
                            setIsDirty(true);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                            isActive
                              ? "bg-accent text-primary"
                              : "text-foreground/80 hover:bg-accent",
                          )}
                        >
                          {c.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.imageUrl} alt={c.name} className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-ring/20" />
                          ) : (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground/50">
                              {c.name.charAt(0)}
                            </div>
                          )}
                          <span className="flex-1 truncate font-medium">{c.name}</span>
                          {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                        </button>
                      );
                    })}
                    {filteredClients.length === 0 && (
                      <p className="py-4 text-center text-xs text-muted-foreground/40">No clients found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FieldWrapper>
          <FieldWrapper icon={FileText} label="Project Name" htmlFor="name" error={fieldError("name")}>
            <Input id="name" name="name" placeholder="E-Commerce Platform Redesign" defaultValue={project?.name ?? ""} className="h-10" required />
          </FieldWrapper>
          <FieldWrapper icon={Hash} label="Contract Number" htmlFor="contractNumber" error={fieldError("contractNumber")}>
            <Input id="contractNumber" name="contractNumber" placeholder="TC-2026-001" defaultValue={project?.contractNumber ?? ""} className="h-10" required />
          </FieldWrapper>
        </div>
      </div>

      {/* Section 2: Finance */}
      <div className="border-border/50 bg-card rounded-lg border p-6 shadow-lg shadow-black/10">
        <SectionHeader
          icon={BadgeCheck}
          title="Finance Confirmation"
          subtitle="Contract value, currency and payment terms"
          accentColor="bg-emerald-500/10 text-emerald-400"
          step={2}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldWrapper
            icon={DollarSign}
            label="Contract Value"
            htmlFor="contractValue"
            error={fieldError("contractValue")}
          >
            <Input
              id="contractValue"
              name="contractValue"
              type="number"
              step="0.01"
              placeholder="1000000"
              defaultValue={project?.contractValue?.toString() ?? ""}
              className="h-10"
              required
            />
          </FieldWrapper>
          <FieldWrapper
            icon={CreditCard}
            label="Payment Terms"
            htmlFor="paymentTerms"
            error={fieldError("paymentTerms")}
          >
            <Input
              id="paymentTerms"
              name="paymentTerms"
              placeholder="Net 30"
              defaultValue={project?.paymentTerms ?? ""}
              className="h-10"
              required
            />
          </FieldWrapper>
        </div>
        <div className="mt-4">
          <FieldWrapper icon={Coins} label="Currency" htmlFor="currency" error={fieldError("currency")}>
            <div className="grid grid-cols-3 gap-2">
              {CURRENCIES.map((c) => (
                <label
                  key={c.code}
                  className="border-border/50 hover:bg-accent/50 flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-all has-[:checked]:border-teal-500/50 has-[:checked]:bg-accent has-[:checked]:text-primary"
                >
                  <input
                    type="radio"
                    name="currency"
                    value={c.code}
                    defaultChecked={
                      project?.currency
                        ? project.currency === c.code
                        : c.code === DEFAULT_CURRENCY
                    }
                    className="sr-only"
                    required
                  />
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="font-semibold">{c.code}</span>
                </label>
              ))}
            </div>
          </FieldWrapper>
        </div>
      </div>

      {/* Section 3: Project Manager */}
      <div className="border-border/50 bg-card rounded-lg border p-6 shadow-lg shadow-black/10">
        <SectionHeader
          icon={User}
          title="Project Manager"
          subtitle="Assign a project manager"
          accentColor="bg-blue-500/10 text-blue-400"
          step={3}
        />
        <div className="grid gap-2">
          {projectManagers.map((pm) => {
            const initials = getInitials(pm.name);
            return (
              <label
                key={pm.id}
                className="group flex cursor-pointer items-center gap-2 rounded-md border border-border/50 px-2.5 py-2 transition-all has-[:checked]:border-teal-500/40 has-[:checked]:bg-teal-500/5 hover:bg-accent/40"
              >
                <input
                  type="radio"
                  name="projectManagerId"
                  value={pm.id}
                  defaultChecked={project?.projectManagerId === pm.id}
                  className="sr-only"
                  required
                />
                {pm.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pm.photoUrl}
                    alt={pm.name}
                    className="h-7 w-7 flex-shrink-0 rounded-full object-cover ring-2 ring-transparent transition-all group-has-[:checked]:ring-teal-500"
                  />
                ) : (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-muted-foreground transition-all group-has-[:checked]:bg-teal-500 group-has-[:checked]:text-foreground">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="block truncate text-xs font-medium text-foreground">{pm.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground/50">{pm.title || "Project Manager"}</span>
                </div>
                <div className="ml-auto h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-border/50 transition-all group-has-[:checked]:border-teal-500 group-has-[:checked]:bg-teal-500 group-has-[:checked]:shadow-[inset_0_0_0_2px_white]" />
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 4: Timeline */}
      <div className="border-border/50 bg-card rounded-lg border p-6 shadow-lg shadow-black/10">
        <SectionHeader
          icon={Settings}
          title="Timeline & Invoicing"
          subtitle="Project dates and client invoicing method"
          accentColor="bg-amber-50 text-amber-400"
          step={4}
        />
        <div className="grid gap-4">
          <FieldWrapper icon={Monitor} label="Invoicing Method" htmlFor="clientInvoicingMethod">
            <div className="flex h-10 rounded-md bg-accent/50 p-1">
              {[
                { value: "PORTAL", label: "Portal", icon: Monitor },
                { value: "EMAIL", label: "Email", icon: Mail },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm text-xs text-muted-foreground/50 transition-all hover:text-muted-foreground has-[:checked]:bg-teal-500/15 has-[:checked]:text-primary has-[:checked]:ring-1 has-[:checked]:ring-teal-500/30"
                >
                  <input
                    type="radio"
                    name="clientInvoicingMethod"
                    value={opt.value}
                    defaultChecked={(project?.clientInvoicingMethod ?? "PORTAL") === opt.value}
                    className="sr-only"
                    required
                  />
                  <opt.icon className="h-3.5 w-3.5" />
                  <span className="font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </FieldWrapper>
          <ProjectDatePicker
            name="startDate"
            label="Start Date"
            defaultValue={project?.startDate ? toDateInputValue(project.startDate) : undefined}
            onValueChange={() => setIsDirty(true)}
          />
          <ProjectDatePicker
            name="endDate"
            label="End Date"
            defaultValue={project?.endDate ? toDateInputValue(project.endDate) : undefined}
            onValueChange={() => setIsDirty(true)}
          />
        </div>
          {isEdit && (
            <input type="hidden" name="status" value={project?.status ?? "ACTIVE"} />
          )}
      </div>

      <SubmitButton isEdit={isEdit} isDirty={isDirty} />
    </form>
  );
}
