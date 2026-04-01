import { getInitials } from "@/lib/format";

const sizeMap = {
  xs: { container: "h-4 w-4", text: "text-[7px]", ring: "ring-1" },
  sm: { container: "h-6 w-6", text: "text-[9px]", ring: "ring-1" },
  md: { container: "h-7 w-7", text: "text-[9px]", ring: "ring-1" },
  lg: { container: "h-10 w-10", text: "text-sm", ring: "ring-1" },
  xl: { container: "h-14 w-14", text: "text-base", ring: "ring-2" },
};

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: keyof typeof sizeMap;
  shape?: "circle" | "rounded";
  className?: string;
}

export function Avatar({
  src,
  name,
  size = "sm",
  shape = "circle",
  className,
}: AvatarProps) {
  const s = sizeMap[size];
  const radius = shape === "circle" ? "rounded-full" : "rounded-lg";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${s.container} ${radius} shrink-0 object-cover ${s.ring} ring-ring/20 ${className ?? ""}`}
      />
    );
  }

  return (
    <div
      className={`flex ${s.container} shrink-0 items-center justify-center ${radius} bg-muted ${s.text} font-bold text-foreground/60 ${s.ring} ring-ring/20 ${className ?? ""}`}
    >
      {getInitials(name)}
    </div>
  );
}
