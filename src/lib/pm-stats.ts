import { sumUniqueInvoices } from "@/lib/financial";

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
    contractValue: unknown;
    milestones: {
      name: string;
      status: string;
      plannedDate: Date;
      invoice?: { id: string; totalPayable: unknown; status?: string } | null;
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
    const completedMilestones = allMilestones.filter(
      (m) => m.status === "COMPLETED" || m.status === "READY_FOR_INVOICING" || m.status === "INVOICED",
    ).length;
    const inProgressMilestones = allMilestones.filter((m) => m.status === "IN_PROGRESS").length;
    const overdueList = pm.projects.flatMap((p) =>
      p.milestones
        .filter(
          (m) =>
            m.status !== "COMPLETED" &&
            m.status !== "READY_FOR_INVOICING" &&
            m.status !== "INVOICED" &&
            new Date(m.plannedDate) < now,
        )
        .map((m) => ({
          milestoneName: m.name,
          projectName: p.name,
          plannedDate: m.plannedDate,
          daysOverdue: Math.floor((now.getTime() - new Date(m.plannedDate).getTime()) / (1000 * 60 * 60 * 24)),
        })),
    );
    const overdueMilestones = overdueList.length;
    const completionPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    // Next deadline
    const upcoming = allMilestones
      .filter(
        (m) =>
          m.status !== "COMPLETED" &&
          m.status !== "READY_FOR_INVOICING" &&
          m.status !== "INVOICED" &&
          new Date(m.plannedDate) >= now,
      )
      .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());
    const nextDeadline = upcoming[0]?.plannedDate ?? null;

    const portfolioValue = pm.projects.reduce((sum, p) => sum + Number(p.contractValue), 0);
    const billed = sumUniqueInvoices(allMilestones);
    const billedPct = portfolioValue > 0 ? Math.round((billed / portfolioValue) * 100) : 0;

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
