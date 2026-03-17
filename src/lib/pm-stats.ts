import { sumUniqueInvoices } from "@/lib/financial";
import { countCompleted, completionPercent, filterOverdue, filterUpcoming, daysDifference } from "@/lib/milestones";
import { safePercent } from "@/lib/format";

type DecimalLike = number | string | { toString(): string };

type PMWithProjects = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  title: string | null;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  projects: {
    id: string;
    name: string;
    status: string;
    contractValue: DecimalLike;
    milestones: {
      name: string;
      status: string;
      plannedDate: Date;
      invoice?: { id: string; totalPayable: DecimalLike; status?: string } | null;
    }[];
  }[];
};

export type OverdueMilestoneDetail = {
  milestoneName: string;
  projectName: string;
  plannedDate: Date;
  daysOverdue: number;
};

export type PMStats = PMWithProjects & {
  totalProjects: number;
  activeProjects: number;
  totalMilestones: number;
  completedMilestones: number;
  inProgressMilestones: number;
  overdueMilestones: number;
  overdueMilestoneDetails: OverdueMilestoneDetail[];
  completionPct: number;
  nextDeadline: Date | null;
  portfolioValue: number;
  billed: number;
  billedPct: number;
};

export function computePMStats(managers: PMWithProjects[]): PMStats[] {
  const now = new Date();

  return managers.map((pm) => {
    const totalProjects = pm.projects.length;
    const activeProjects = pm.projects.filter((p) => p.status === "ACTIVE").length;
    const allMilestones = pm.projects.flatMap((p) => p.milestones);
    const totalMilestones = allMilestones.length;
    const completedMilestones = countCompleted(allMilestones);
    const inProgressMilestones = allMilestones.filter((m) => m.status === "IN_PROGRESS").length;
    const overdueList = pm.projects.flatMap((p) =>
      filterOverdue(p.milestones, now).map((m) => ({
        milestoneName: m.name,
        projectName: p.name,
        plannedDate: m.plannedDate,
        daysOverdue: daysDifference(m.plannedDate, now),
      })),
    );
    const overdueMilestones = overdueList.length;
    const completionPct = completionPercent(allMilestones);

    // Next deadline
    const upcoming = filterUpcoming(allMilestones, 365, now)
      .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());
    const nextDeadline = upcoming[0]?.plannedDate ?? null;

    const portfolioValue = pm.projects.reduce((sum, p) => sum + Number(p.contractValue), 0);
    const billed = sumUniqueInvoices(allMilestones);
    const billedPct = safePercent(billed, portfolioValue);

    return {
      ...pm,
      totalProjects,
      activeProjects,
      totalMilestones,
      completedMilestones,
      inProgressMilestones,
      overdueMilestones,
      overdueMilestoneDetails: overdueList,
      completionPct,
      nextDeadline,
      portfolioValue,
      billed,
      billedPct,
    };
  });
}
