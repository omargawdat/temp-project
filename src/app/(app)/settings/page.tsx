import { getCompanySettings } from "@/actions/settings";
import { SettingsForm } from "@/components/common/settings-form";
import { Building2, CreditCard, FileText } from "lucide-react";

export default async function SettingsPage() {
  const settings = await getCompanySettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Company Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure your company details for invoice generation.</p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
