"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Project } from "@prisma/client";
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
} from "lucide-react";

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-gradient-to-r from-indigo-600 to-indigo-500 py-4.5 text-sm font-semibold tracking-wide text-white shadow-lg shadow-indigo-600/25 transition-all hover:from-indigo-500 hover:to-indigo-400 hover:shadow-indigo-500/30 active:scale-[0.99]"
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? "Saving…" : isEdit ? "Update Project" : "Register Project"}
    </Button>
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
  onSuccess,
}: {
  project?: Project;
  projectManagers: { id: string; name: string; title?: string | null; photoUrl?: string | null }[];
  onSuccess?: (id: string) => void;
}) {
  const isEdit = !!project;

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

  React.useEffect(() => {
    if (state?.success && state.data?.id) {
      onSuccess?.(state.data.id);
    }
  }, [state, onSuccess]);

  const selectClass =
    "flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <form action={formAction} className="space-y-6">
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
          accentColor="bg-indigo-500/10 text-indigo-400"
          step={1}
        />
        <div className="space-y-4">
          <FieldWrapper icon={Building2} label="Client Name" htmlFor="clientName">
            <Input id="clientName" name="clientName" placeholder="TechCorp Ltd" defaultValue={project?.clientName ?? ""} className="h-10" required />
          </FieldWrapper>
          <FieldWrapper icon={FileText} label="Project Name" htmlFor="name">
            <Input id="name" name="name" placeholder="E-Commerce Platform Redesign" defaultValue={project?.name ?? ""} className="h-10" required />
          </FieldWrapper>
          <FieldWrapper icon={Hash} label="Contract Number" htmlFor="contractNumber">
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
          <FieldWrapper icon={Coins} label="Currency" htmlFor="currency">
            <div className="flex flex-wrap gap-2">
              {CURRENCIES.map((c) => (
                <label
                  key={c.code}
                  className="border-border/50 hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2.5 text-sm transition-all has-[:checked]:border-indigo-500/50 has-[:checked]:bg-indigo-500/10 has-[:checked]:text-indigo-400"
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
          accentColor="bg-purple-500/10 text-purple-400"
          step={3}
        />
        <div className="grid gap-2">
          {projectManagers.map((pm) => {
            const initials = getInitials(pm.name);
            return (
              <label
                key={pm.id}
                className="group flex cursor-pointer items-center gap-2 rounded-md border border-border/50 px-2.5 py-2 transition-all has-[:checked]:border-indigo-500/40 has-[:checked]:bg-indigo-500/5 hover:bg-accent/40"
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
                    className="h-7 w-7 flex-shrink-0 rounded-full object-cover ring-2 ring-transparent transition-all group-has-[:checked]:ring-indigo-500"
                  />
                ) : (
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-muted-foreground transition-all group-has-[:checked]:bg-indigo-500 group-has-[:checked]:text-white">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="block truncate text-xs font-medium text-foreground">{pm.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground/50">{pm.title || "Project Manager"}</span>
                </div>
                <div className="ml-auto h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-border/50 transition-all group-has-[:checked]:border-indigo-500 group-has-[:checked]:bg-indigo-500 group-has-[:checked]:shadow-[inset_0_0_0_2px_white]" />
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
          accentColor="bg-amber-500/10 text-amber-400"
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
                  className="group flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm text-xs text-muted-foreground/50 transition-all hover:text-muted-foreground has-[:checked]:bg-indigo-500/15 has-[:checked]:text-indigo-400 has-[:checked]:ring-1 has-[:checked]:ring-indigo-500/30"
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
          />
          <ProjectDatePicker
            name="endDate"
            label="End Date"
            defaultValue={project?.endDate ? toDateInputValue(project.endDate) : undefined}
          />
        </div>
          {isEdit && (
            <input type="hidden" name="status" value={project?.status ?? "ACTIVE"} />
          )}
      </div>

      <SubmitButton isEdit={isEdit} />
    </form>
  );
}
