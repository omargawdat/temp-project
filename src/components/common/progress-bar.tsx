const heightMap = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
  lg: "h-2.5",
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
  return (
    <div className={`${h} w-full overflow-hidden rounded-full bg-white/[0.06] ${className ?? ""}`}>
      <div
        className={`${h} rounded-full bg-${color}-500/70 transition-all duration-700`}
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
  return (
    <div className={`${h} w-full overflow-hidden rounded-full bg-white/[0.04] ${className ?? ""}`}>
      <div className="relative h-full">
        {layers.map((layer, i) => (
          <div
            key={i}
            className={`absolute inset-y-0 left-0 rounded-full bg-${layer.color}-500/80 transition-all duration-700`}
            style={{ width: `${Math.min(100, Math.max(0, layer.value))}%` }}
          />
        ))}
      </div>
    </div>
  );
}
