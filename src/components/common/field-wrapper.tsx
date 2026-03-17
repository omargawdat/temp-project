import { Label } from "@/components/ui/label";

export function FieldWrapper({
  icon: Icon,
  label,
  htmlFor,
  children,
}: {
  icon: React.ElementType;
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={htmlFor}
        className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase"
      >
        <Icon className="h-3 w-3" />
        {label}
      </Label>
      {children}
    </div>
  );
}
