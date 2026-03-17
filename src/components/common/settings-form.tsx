"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCompanySettings } from "@/actions/settings";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { CompanySettings } from "@prisma/client";
import type { ActionResult } from "@/types";
import { Building2, CreditCard, FileText, Loader2, Check } from "lucide-react";

export function SettingsForm({ settings }: { settings: CompanySettings | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result: ActionResult = await updateCompanySettings(formData);
      if (result.success) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 2000);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Company Info */}
      <div className="rounded-xl border border-border/20 bg-card/40 p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="rounded-lg bg-teal-500/12 p-2">
            <Building2 className="h-4 w-4 text-teal-400" />
          </div>
          <h2 className="text-base font-bold text-foreground">Company Information</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company Name" name="companyName" defaultValue={settings?.companyName} placeholder="BlackStone eIT" />
          <Field label="Tax ID" name="taxId" defaultValue={settings?.taxId} placeholder="300000000000003" />
          <Field label="Address" name="address" defaultValue={settings?.address} placeholder="King Fahd Road" />
          <Field label="City" name="city" defaultValue={settings?.city} placeholder="Riyadh" />
          <Field label="Country" name="country" defaultValue={settings?.country} placeholder="Saudi Arabia" />
          <Field label="Email" name="email" defaultValue={settings?.email} placeholder="finance@company.com" type="email" />
          <Field label="Phone" name="phone" defaultValue={settings?.phone} placeholder="+966 11 234 5678" />
          <Field label="Website" name="website" defaultValue={settings?.website} placeholder="https://company.com" />
        </div>
      </div>

      {/* Bank Details */}
      <div className="rounded-xl border border-border/20 bg-card/40 p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="rounded-lg bg-amber-500/12 p-2">
            <CreditCard className="h-4 w-4 text-amber-400" />
          </div>
          <h2 className="text-base font-bold text-foreground">Bank Details</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank Name" name="bankName" defaultValue={settings?.bankName} placeholder="Saudi National Bank" />
          <Field label="Account Number" name="bankAccount" defaultValue={settings?.bankAccount} placeholder="608010167519" />
          <Field label="IBAN" name="bankIban" defaultValue={settings?.bankIban} placeholder="SA0380000000608010167519" />
          <Field label="SWIFT Code" name="bankSwift" defaultValue={settings?.bankSwift} placeholder="NCBKSAJE" />
        </div>
      </div>

      {/* Invoice Footer */}
      <div className="rounded-xl border border-border/20 bg-card/40 p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="rounded-lg bg-emerald-500/12 p-2">
            <FileText className="h-4 w-4 text-emerald-400" />
          </div>
          <h2 className="text-base font-bold text-foreground">Invoice Footer</h2>
        </div>
        <Textarea
          name="invoiceFooter"
          defaultValue={settings?.invoiceFooter ?? ""}
          placeholder="Thank you for your business..."
          rows={3}
          className="border-border/25 bg-white/[0.02]"
        />
      </div>

      {error && <p className="text-sm font-medium text-red-400">{error}</p>}

      <Button
        type="submit"
        disabled={isPending}
        className="btn-gradient border-0 px-6 py-2.5 font-semibold text-white shadow-lg shadow-teal-500/25"
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : success ? (
          <Check className="mr-2 h-4 w-4" />
        ) : null}
        {isPending ? "Saving…" : success ? "Saved" : "Save Settings"}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">{label}</label>
      <Input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        type={type}
        className="h-10 border-border/25 bg-white/[0.02]"
      />
    </div>
  );
}
