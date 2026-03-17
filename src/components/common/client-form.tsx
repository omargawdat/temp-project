"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Client } from "@prisma/client";
import { createClient, updateClient } from "@/actions/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldWrapper } from "@/components/common/field-wrapper";
import type { ActionResult } from "@/types";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  Building2,
  Hash,
  Globe,
  MapPin,
  User,
  Mail,
  Phone,
  Monitor,
  Link2,
  FileText,
  ImagePlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CountryOption = { id: string; name: string; code: string; flag: string };

const SHORT_NAMES: Record<string, string> = {
  "Saudi Arabia": "KSA",
  "United Kingdom": "UK",
  "United States": "US",
};

function countryDisplayName(name: string) {
  return SHORT_NAMES[name] ?? name;
}

function CountrySelect({
  countries,
  defaultValue,
}: {
  countries: CountryOption[];
  defaultValue?: string;
}) {
  const [selected, setSelected] = React.useState(defaultValue ?? "");

  return (
    <div>
      <input type="hidden" name="countryId" value={selected} />
      <div className="grid grid-cols-3 gap-1.5">
        {countries.map((c) => (
          <label
            key={c.id}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border/50 px-2 py-2 text-xs transition-all hover:bg-accent/50 has-[:checked]:border-teal-500/50 has-[:checked]:bg-teal-500/10 has-[:checked]:text-teal-400"
          >
            <input
              type="radio"
              name="_country_radio"
              value={c.id}
              checked={selected === c.id}
              onChange={() => setSelected(c.id)}
              className="sr-only"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.flag} alt={c.name} className="h-4 w-5 rounded-[2px] object-cover" />
            <span className="font-medium whitespace-nowrap">{countryDisplayName(c.name)}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SubmitButton({ isEdit, isDirty }: { isEdit: boolean; isDirty: boolean }) {
  const { pending } = useFormStatus();
  const enabled = isDirty || !isEdit;
  return (
    <div className="sticky bottom-0 -mx-4 -mb-5 border-t border-border/20 bg-card/95 px-4 py-4 backdrop-blur-sm">
      <Button
        type="submit"
        disabled={pending || !enabled}
        className={`w-full border-0 py-3 font-semibold transition-all ${
          enabled
            ? "btn-gradient text-white shadow-lg shadow-teal-500/25"
            : "bg-white/[0.06] text-muted-foreground/40 shadow-none"
        }`}
      >
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {pending ? "Saving…" : isEdit ? "Update" : "Add Client"}
      </Button>
    </div>
  );
}

const SECTORS = [
  { value: "GOVERNMENT", label: "Government", icon: "🏛️" },
  { value: "PRIVATE", label: "Private", icon: "🏢" },
  { value: "SEMI_GOVERNMENT", label: "Semi-Gov", icon: "🏗️" },
] as const;

function SectorSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {SECTORS.map((s) => (
        <label
          key={s.value}
          className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border/50 px-2 py-2 text-xs transition-all hover:bg-accent/50 has-[:checked]:border-teal-500/50 has-[:checked]:bg-teal-500/10 has-[:checked]:text-teal-400"
        >
          <input
            type="radio"
            name="sector"
            value={s.value}
            defaultChecked={defaultValue === s.value}
            className="sr-only"
            required
          />
          <span className="text-sm leading-none">{s.icon}</span>
          <span className="font-medium whitespace-nowrap">{s.label}</span>
        </label>
      ))}
    </div>
  );
}

export function ClientForm({
  client,
  countries,
  onSuccess,
}: {
  client?: Client & { countryId?: string };
  countries: CountryOption[];
  onSuccess?: (id: string) => void;
}) {
  const isEdit = !!client;
  const [isDirty, setIsDirty] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(client?.imageUrl ?? null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  async function handleAction(
    _prevState: ActionResult<{ id: string }> | null,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> {
    if (isEdit) {
      return updateClient(client!.id, formData);
    }
    return createClient(formData);
  }

  const [state, formAction] = useActionState(handleAction, null);

  React.useEffect(() => {
    if (state?.success && state.data?.id) {
      onSuccess?.(state.data.id);
    }
  }, [state, onSuccess]);

  return (
    <form key={client?.id ?? "new"} action={formAction} className="space-y-5" onChange={() => setIsDirty(true)}>
      {state && !state.success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm"
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
          <span className="text-red-300">{state.error}</span>
        </motion.div>
      )}

      {/* Fields */}
      <div className="grid gap-4">
        {/* Client Image */}
        <div>
          <label className="text-foreground mb-2 flex items-center gap-2 text-sm font-medium">
            <ImagePlus className="h-4 w-4 text-muted-foreground" />
            Client Logo
            <span className="text-muted-foreground/40 text-xs font-normal">(optional)</span>
          </label>
          <div className="flex items-center gap-4">
            {imagePreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Client"
                  className="h-16 w-16 rounded-xl object-cover ring-1 ring-white/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    if (imageInputRef.current) imageInputRef.current.value = "";
                    setIsDirty(true);
                  }}
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/80 text-white transition-colors hover:bg-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-border/50 bg-white/[0.02] text-muted-foreground/30 transition-colors hover:border-teal-500/30 hover:bg-teal-500/[0.03] hover:text-teal-400/50"
              >
                <ImagePlus className="h-5 w-5" />
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
              <p>Upload a logo for this client.</p>
              <p>JPG, PNG or WebP. Max 5MB.</p>
            </div>
          </div>
        </div>

        <FieldWrapper icon={Building2} label="Name" htmlFor="name">
          <Input
            id="name"
            name="name"
            placeholder="e.g. Saudi Telecom"
            defaultValue={client?.name ?? ""}
            className="h-10 placeholder:text-muted-foreground/25 placeholder:not-italic"
            required
          />
        </FieldWrapper>
        <FieldWrapper icon={Hash} label="Code" htmlFor="code">
          <Input
            id="code"
            name="code"
            placeholder="e.g. STC-001"
            defaultValue={client?.code ?? ""}
            className="h-10 placeholder:text-muted-foreground/25 placeholder:not-italic"
            required
          />
        </FieldWrapper>
        <FieldWrapper icon={Globe} label="Sector" htmlFor="sector">
          <SectorSelect defaultValue={client?.sector} />
        </FieldWrapper>
        <FieldWrapper icon={MapPin} label="Country" htmlFor="country">
          <CountrySelect countries={countries} defaultValue={client?.countryId} />
        </FieldWrapper>
        <FieldWrapper icon={User} label="Primary Contact" htmlFor="primaryContact">
          <Input
            id="primaryContact"
            name="primaryContact"
            placeholder="e.g. Khalid Al-Otaibi"
            defaultValue={client?.primaryContact ?? ""}
            className="h-10 placeholder:text-muted-foreground/25 placeholder:not-italic"
            required
          />
        </FieldWrapper>
        <FieldWrapper icon={User} label="Finance Contact" htmlFor="financeContact">
          <Input
            id="financeContact"
            name="financeContact"
            placeholder="e.g. Noura Al-Harbi"
            defaultValue={client?.financeContact ?? ""}
            className="h-10 placeholder:text-muted-foreground/25 placeholder:not-italic"
            required
          />
        </FieldWrapper>
        <FieldWrapper icon={Mail} label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="e.g. contact@company.com"
            defaultValue={client?.email ?? ""}
            className="h-10 placeholder:text-muted-foreground/25 placeholder:not-italic"
            required
          />
        </FieldWrapper>
        <FieldWrapper icon={Phone} label="Phone" htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="e.g. +966 50 123 4567"
            defaultValue={client?.phone ?? ""}
            className="h-10 placeholder:text-muted-foreground/25 placeholder:not-italic"
            required
          />
        </FieldWrapper>
        <FieldWrapper icon={MapPin} label="Billing Address" htmlFor="billingAddress">
          <textarea
            id="billingAddress"
            name="billingAddress"
            placeholder="e.g. King Fahd Road, Riyadh 12283"
            defaultValue={client?.billingAddress ?? ""}
            required
            className="flex w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/25 placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-none"
          />
        </FieldWrapper>
        <FieldWrapper icon={Monitor} label="Portal Name (Optional)" htmlFor="portalName">
          <Input
            id="portalName"
            name="portalName"
            placeholder="e.g. Ariba, Etimad"
            defaultValue={client?.portalName ?? ""}
            className="h-10 placeholder:text-muted-foreground/25 placeholder:not-italic"
          />
        </FieldWrapper>
        <FieldWrapper icon={Link2} label="Portal Link (Optional)" htmlFor="portalLink">
          <Input
            id="portalLink"
            name="portalLink"
            type="url"
            placeholder="e.g. https://portal.example.com"
            defaultValue={client?.portalLink ?? ""}
            className="h-10 placeholder:text-muted-foreground/25 placeholder:not-italic"
          />
        </FieldWrapper>
        <FieldWrapper icon={FileText} label="Notes (Optional)" htmlFor="notes">
          <textarea
            id="notes"
            name="notes"
            placeholder="e.g. Preferred payment method, special requirements..."
            defaultValue={client?.notes ?? ""}
            className="flex w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/25 placeholder:not-italic focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-none"
          />
        </FieldWrapper>
      </div>

      <SubmitButton isEdit={isEdit} isDirty={isDirty} />
    </form>
  );
}
