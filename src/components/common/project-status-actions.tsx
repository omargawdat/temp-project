"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProjectStatus } from "@/actions/project";
import { ProjectStatus } from "@prisma/client";
import { Pause, Play, Lock, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface StatusAction {
  label: string;
  icon: React.ElementType;
  target: ProjectStatus;
  bg: string;
  text: string;
  border: string;
  hoverBg: string;
  shadow: string;
}

const ACTIONS: Record<string, StatusAction[]> = {
  ACTIVE: [
    {
      label: "Put on Hold",
      icon: Pause,
      target: ProjectStatus.ON_HOLD,
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/25",
      hoverBg: "hover:bg-amber-500/20",
      shadow: "hover:shadow-amber-500/10",
    },
    {
      label: "Close Project",
      icon: Lock,
      target: ProjectStatus.CLOSED,
      bg: "bg-white/[0.04]",
      text: "text-white/50",
      border: "border-white/10",
      hoverBg: "hover:bg-white/[0.08]",
      shadow: "hover:shadow-white/5",
    },
  ],
  ON_HOLD: [
    {
      label: "Resume Project",
      icon: Play,
      target: ProjectStatus.ACTIVE,
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/25",
      hoverBg: "hover:bg-emerald-500/20",
      shadow: "hover:shadow-emerald-500/10",
    },
  ],
  CLOSED: [
    {
      label: "Reopen",
      icon: RotateCcw,
      target: ProjectStatus.ACTIVE,
      bg: "bg-teal-500/10",
      text: "text-teal-400",
      border: "border-teal-500/25",
      hoverBg: "hover:bg-teal-500/20",
      shadow: "hover:shadow-teal-500/10",
    },
  ],
};

export function ProjectStatusActions({
  projectId,
  currentStatus,
}: {
  projectId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const actions = ACTIONS[currentStatus] ?? [];

  if (actions.length === 0) return null;

  function handleAction(target: ProjectStatus) {
    startTransition(async () => {
      const result = await updateProjectStatus(projectId, target);
      if (result.success) {
        toast.success("Project status updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <button
          key={action.target}
          disabled={isPending}
          onClick={() => handleAction(action.target)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-[13px] font-semibold transition-all duration-200 shadow-sm disabled:opacity-50 ${action.bg} ${action.text} ${action.border} ${action.hoverBg} ${action.shadow} hover:shadow-md`}
        >
          <action.icon className="h-4 w-4" strokeWidth={2} />
          {action.label}
        </button>
      ))}
    </div>
  );
}
