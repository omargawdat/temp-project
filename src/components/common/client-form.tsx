"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Client } from "@prisma/client";
import type { Serialized } from "@/lib/serialize";
import { createClient, updateClient } from "@/actions/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldWrapper } from "@/components/common/field-wrapper";
import type { ActionResult } from "@/types";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  Building2,
  Globe,
  MapPin,
  Monitor,
  Link2,
  FileText,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { ContactFormRows, type ContactRow } from "@/components/common/contact-form-rows";

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
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-accent px-2 py-2 text-xs transition-all hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
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
    <div className="sticky bottom-0 -mx-4 -mb-5 border-t border-border bg-card/95 px-4 py-4 backdrop-blur-sm">
      <Button
        type="submit"
        disabled={pending || !enabled}
        className={`w-full border-0 py-3 font-semibold transition-all ${
          enabled
            ? "btn-gradient text-primary-foreground shadow-lg shadow-primary/25"
            : "bg-muted text-muted-foreground shadow-none"
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
          className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-accent px-2 py-2 text-xs transition-all hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:text-primary"
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
  client?: (Client | Serialized<Client>) & { countryId?: string; contacts?: ContactRow[] };
  countries: CountryOption[];
  onSuccess?: (id: string) => void;
}) {
  const isEdit = !!client;
  const [isDirty, setIsDirty] = React.useState(false);
  const [contacts, setContacts] = React.useState<ContactRow[]>(client?.contacts ?? []);

  async function handleAction(
    _prevState: ActionResult<{ id: string }> | null,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> {
    formData.set("contacts", JSON.stringify(contacts));
    if (isEdit) {
      return updateClient(client!.id, formData);
    }
    return createClient(formData);
  }

  const [state, formAction] = useActionState(handleAction, null);

  const fieldError = (field: string) =>
    state && !state.success ? state.fieldErrors?.[field]?.[0] : undefined;

  const toastedState = React.useRef<typeof state>(null);

  React.useEffect(() => {
    if (state?.success && state.data?.id && toastedState.current !== state) {
      toastedState.current = state;
      toast.success(isEdit ? "Client updated" : "Client created");
      onSuccess?.(state.data.id);
    }
  }, [state, onSuccess, isEdit]);

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

        <FieldWrapper icon={Globe} label="Sector" htmlFor="sector" error={fieldError("sector")}>
          <SectorSelect defaultValue={client?.sector} />
        </FieldWrapper>

        <FieldWrapper icon={Building2} label="Name" htmlFor="name" error={fieldError("name")}>
          <Input
            id="name"
            name="name"
            defaultValue={client?.name ?? ""}
            required
          />
        </FieldWrapper>
        <FieldWrapper icon={MapPin} label="Country" htmlFor="country" error={fieldError("countryId")}>
          <CountrySelect countries={countries} defaultValue={client?.countryId} />
        </FieldWrapper>
        <FieldWrapper icon={Users} label="Contacts" htmlFor="contacts">
          <ContactFormRows
            contacts={contacts}
            onChange={(c) => { setContacts(c); setIsDirty(true); }}
          />
        </FieldWrapper>
        <FieldWrapper icon={MapPin} label="Billing Address" htmlFor="billingAddress" error={fieldError("billingAddress")}>
          <Textarea
            id="billingAddress"
            name="billingAddress"
            defaultValue={client?.billingAddress ?? ""}
            required
            className="min-h-[80px] resize-none"
          />
        </FieldWrapper>
        <FieldWrapper icon={Monitor} label="Portal Name (Optional)" htmlFor="portalName">
          <Input
            id="portalName"
            name="portalName"
            defaultValue={client?.portalName ?? ""}
          />
        </FieldWrapper>
        <FieldWrapper icon={Link2} label="Portal Link (Optional)" htmlFor="portalLink">
          <Input
            id="portalLink"
            name="portalLink"
            type="url"
            defaultValue={client?.portalLink ?? ""}
          />
        </FieldWrapper>
        <FieldWrapper icon={FileText} label="Notes (Optional)" htmlFor="notes">
          <Textarea
            id="notes"
            name="notes"
            defaultValue={client?.notes ?? ""}
            className="min-h-[80px] resize-none"
          />
        </FieldWrapper>
      </div>

      <SubmitButton isEdit={isEdit} isDirty={isDirty} />
    </form>
  );
}
