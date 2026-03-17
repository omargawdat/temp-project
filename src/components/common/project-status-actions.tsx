"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProjectStatus } from "@/actions/project";
import { Pause, Play, Lock, RotateCcw } from "lucide-react";

interface StatusAction {
  label: string;
  icon: React.ElementType;
  target: string;
  className: string;
}

const ACTIONS: Record<string, StatusAction[]> = {
  ACTIVE: [
    {
      label: "Hold",
      icon: Pause,
      target: "ON_HOLD",
      className: "text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/10",
    },
    {
      label: "Close",
      icon: Lock,
      target: "CLOSED",
      className: "text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/5",
    },
  ],
  ON_HOLD: [
    {
      label: "Resume",
      icon: Play,
      target: "ACTIVE",
      className: "text-emerald-400/80 hover:text-emerald-400 hover:bg-emerald-500/10",
    },
  ],
  FULLY_INVOICED: [
    {
      label: "Close",
      icon: Lock,
      target: "CLOSED",
      className: "text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/5",
    },
  ],
  CLOSED: [
    {
      label: "Reopen",
      icon: RotateCcw,
      target: "ACTIVE",
      className: "text-indigo-400/80 hover:text-indigo-400 hover:bg-indigo-500/10",
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

  function handleAction(target: string) {
    startTransition(async () => {
      const result = await updateProjectStatus(projectId, target);
      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center gap-1">
      {actions.map((action) => (
        <button
          key={action.target}
          disabled={isPending}
          onClick={() => handleAction(action.target)}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50 ${action.className}`}
        >
          <action.icon className="h-3.5 w-3.5" />
          {action.label}
        </button>
      ))}
    </div>
  );
}
