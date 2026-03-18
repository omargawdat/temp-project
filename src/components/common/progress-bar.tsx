const heightMap = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
  lg: "h-2.5",
};

const barColorMap: Record<string, string> = {
  teal:    "bg-teal-500/70",
  amber:   "bg-amber-500/70",
  emerald: "bg-emerald-500/70",
  blue:    "bg-blue-500/70",
  red:     "bg-red-500/70",
  purple:  "bg-purple-500/70",
  orange:  "bg-orange-500/70",
};

const stackedColorMap: Record<string, string> = {
  teal:    "bg-teal-500/80",
  amber:   "bg-amber-500/80",
  emerald: "bg-emerald-500/80",
  blue:    "bg-blue-500/80",
  red:     "bg-red-500/80",
  purple:  "bg-purple-500/80",
  orange:  "bg-orange-500/80",
};

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: keyof typeof heightMap;
  className?: string;
}

export function ProgressBar({
  value,
  color = "teal",
  height = "sm",
  className,
}: ProgressBarProps) {
  const h = heightMap[height];
  const bg = barColorMap[color] ?? barColorMap.teal;
  return (
    <div
      className={`${h} w-full overflow-hidden rounded-full bg-white/[0.06] ${className ?? ""}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`${h} rounded-full ${bg} transition-all duration-700`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

interface StackedLayer {
  value: number;
  color: string;
}

interface StackedProgressBarProps {
  layers: StackedLayer[];
  height?: keyof typeof heightMap;
  className?: string;
}

export function StackedProgressBar({
  layers,
  height = "sm",
  className,
}: StackedProgressBarProps) {
  const h = heightMap[height];
  const total = layers.reduce((sum, l) => sum + l.value, 0);
  return (
    <div
      className={`${h} w-full overflow-hidden rounded-full bg-white/[0.04] ${className ?? ""}`}
      role="progressbar"
      aria-valuenow={total}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="relative h-full">
        {layers.map((layer, i) => {
          const bg = stackedColorMap[layer.color] ?? stackedColorMap.teal;
          return (
            <div
              key={i}
              className={`absolute inset-y-0 left-0 rounded-full ${bg} transition-all duration-700`}
              style={{ width: `${Math.min(100, Math.max(0, layer.value))}%` }}
            />
          );
        })}
      </div>
    </div>
  );
}
