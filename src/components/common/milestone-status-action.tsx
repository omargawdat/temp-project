"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMilestoneStatus } from "@/actions/milestone";
import { MilestoneStatus } from "@prisma/client";
import { MILESTONE_TRANSITIONS } from "@/schemas/transitions";
import { toast } from "sonner";
import { Loader2, Play, CheckCircle2 } from "lucide-react";

const BUTTON_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  IN_PROGRESS: {
    label: "Start",
    icon: Play,
    className: "text-blue-600 bg-blue-50 hover:bg-blue-100 ring-blue-200",
  },
  COMPLETED: {
    label: "Complete",
    icon: CheckCircle2,
    className: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 ring-emerald-200",
  },
};

export function MilestoneStatusAction({
  milestoneId,
  currentStatus,
}: {
  milestoneId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const nextStatuses = MILESTONE_TRANSITIONS[currentStatus as MilestoneStatus] ?? [];
  if (nextStatuses.length === 0) return null;

  const nextStatus = nextStatuses[0];
  const config = BUTTON_CONFIG[nextStatus];
  if (!config) return null;

  const blocked = false;

  function handleClick() {
    if (blocked) return;
    startTransition(async () => {
      const result = await updateMilestoneStatus(milestoneId, nextStatus);
      if (result.success) {
        toast.success(`Milestone marked as ${nextStatus.replace(/_/g, " ").toLowerCase()}`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const Icon = config.icon;

  return (
    <button
      onClick={handleClick}
      disabled={isPending || blocked}
      title={blocked ? "Delivery note must be signed first" : `Move to ${config.label}`}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ring-1 transition-all ${
        blocked
          ? "cursor-not-allowed opacity-40 text-muted-foreground bg-muted ring-border"
          : config.className
      } ${isPending ? "opacity-60" : ""}`}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Icon className="h-3 w-3" />
      )}
      {config.label}
    </button>
  );
}
