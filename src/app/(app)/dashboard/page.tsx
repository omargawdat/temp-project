import { prisma } from "@/lib/prisma";
import { sumUniqueInvoices } from "@/lib/financial";
import {
  filterOverdue,
  filterUpcoming,
  daysDifference,
  countCompleted,
  completionPercent,
  isCompleted,
  isOverdue,
} from "@/lib/milestones";
import { safePercent } from "@/lib/format";
import { CurrencyTabs } from "@/components/dashboard/currency-tabs";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { TabAttention } from "@/components/dashboard/tab-attention";
import { TabPipeline } from "@/components/dashboard/tab-pipeline";
import { TabTimeline } from "@/components/dashboard/tab-timeline";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const now = new Date();

  const [allProjects, recentInvoices, overdueInvoices, onHoldCount, auditLogs] =
    await Promise.all([
      prisma.project.findMany({
        include: {
          client: { select: { id: true, name: true, sector: true } },
          projectManager: { select: { id: true, name: true, photoUrl: true, title: true } },
          milestones: {
            select: {
              id: true, name: true, value: true, plannedDate: true, status: true, projectId: true,
              invoice: { select: { id: true, invoiceNumber: true, totalPayable: true, status: true, paymentDueDate: true } },
              deliveryNote: { select: { id: true, status: true } },
            },
          },
        },
      }),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { milestones: { select: { project: { select: { name: true } } } } },
      }),
      prisma.invoice.findMany({
        where: { status: { notIn: ["PAID", "REJECTED"] }, paymentDueDate: { lt: now } },
        include: { milestones: { select: { project: { select: { name: true } } } } },
      }),
      prisma.project.count({ where: { status: "ON_HOLD" } }),
      // Activity data from audit logs (last 12 months)
      prisma.auditLog.findMany({
        where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) } },
        select: { createdAt: true },
      }),
    ]);

  // Core computed values
  const totalProjects = allProjects.length;
  const activeProjects = allProjects.filter((p) => p.status === "ACTIVE").length;
  const allMilestones = allProjects.flatMap((p) => p.milestones);

  // Currency handling
  const currencyValueMap = new Map<string, number>();
  for (const p of allProjects) {
    currencyValueMap.set(p.currency, (currencyValueMap.get(p.currency) ?? 0) + Number(p.contractValue));
  }
  const availableCurrencies = Array.from(currencyValueMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);
  const selectedCurrency = typeof params.currency === "string" && availableCurrencies.includes(params.currency)
    ? params.currency
    : availableCurrencies[0] ?? "USD";
  const currencyProjects = allProjects.filter((p) => p.currency === selectedCurrency);

  // Financial aggregates
  let portfolioValue = 0;
  let totalBilled = 0;
  let totalCollected = 0;
  for (const p of currencyProjects) {
    portfolioValue += Number(p.contractValue);
    totalBilled += sumUniqueInvoices(p.milestones);
    totalCollected += sumUniqueInvoices(p.milestones, "PAID");
  }
  const billedPct = safePercent(totalBilled, portfolioValue);
  const collectedPct = safePercent(totalCollected, portfolioValue);

  // Sparkline: milestone completions per month (last 6 months)
  const sparklineData: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const count = allMilestones.filter((m) => {
      const completed = isCompleted(m.status);
      const date = new Date(m.plannedDate);
      return completed && date >= monthStart && date <= monthEnd;
    }).length;
    sparklineData.push(count);
  }

  // Overdue milestones
  const overdueMilestones = allProjects.flatMap((p) =>
    filterOverdue(p.milestones, now).map((m) => ({
      id: m.id, name: m.name, projectName: p.name, projectId: p.id,
      daysOverdue: daysDifference(m.plannedDate, now),
    })),
  ).sort((a, b) => b.daysOverdue - a.daysOverdue);

  // Upcoming milestones
  const upcomingMilestones = allProjects.flatMap((p) =>
    filterUpcoming(p.milestones, 30, now).map((m) => ({
      id: m.id, name: m.name, projectName: p.name, projectId: p.id,
      plannedDate: m.plannedDate, daysUntil: -daysDifference(m.plannedDate, now),
    })),
  ).sort((a, b) => a.daysUntil - b.daysUntil);

  // Pending delivery notes
  const pendingDeliveryNotes = allProjects.flatMap((p) =>
    p.milestones
      .filter((m) => m.deliveryNote && m.deliveryNote.status !== "SIGNED")
      .map((m) => ({ name: m.name, projectName: p.name, projectId: p.id, status: m.deliveryNote!.status })),
  );

  const totalOverdueItems = overdueMilestones.length + overdueInvoices.length;

  // ── Pipeline Data ──
  const milestoneStatuses = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "INVOICED"] as const;
  const milestonesByStatus: Record<string, { id: string; name: string; projectName: string; value: number; currency: string; projectId: string }[]> = {};
  for (const status of milestoneStatuses) milestonesByStatus[status] = [];
  allProjects.forEach((p) => {
    p.milestones.forEach((m) => {
      milestonesByStatus[m.status]?.push({
        id: m.id, name: m.name, projectName: p.name,
        value: Number(m.value), currency: p.currency, projectId: p.id,
      });
    });
  });

  // Deduplicate invoices for pipeline
  const invoiceSet = new Map<string, { id: string; invoiceNumber: string; totalPayable: number; currency: string; projectName: string; status: string }>();
  allProjects.forEach((p) => {
    p.milestones.forEach((m) => {
      if (m.invoice && !invoiceSet.has(m.invoice.id)) {
        invoiceSet.set(m.invoice.id, {
          id: m.invoice.id, invoiceNumber: m.invoice.invoiceNumber,
          totalPayable: Number(m.invoice.totalPayable), currency: p.currency, projectName: p.name, status: m.invoice.status,
        });
      }
    });
  });
  const invoicesByStatus: Record<string, { id: string; invoiceNumber: string; totalPayable: number; currency: string; projectName: string }[]> = {};
  for (const s of ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "PAID"]) invoicesByStatus[s] = [];
  invoiceSet.forEach((inv) => { invoicesByStatus[inv.status]?.push(inv); });

  // ── Timeline Data ──
  const timelineProjects = allProjects.map((p) => ({
    id: p.id, name: p.name, startDate: p.startDate, endDate: p.endDate, status: p.status,
    completionPct: completionPercent(p.milestones),
    milestones: p.milestones.map((m) => ({ id: m.id, name: m.name, plannedDate: m.plannedDate, status: m.status })),
  }));

  // ── Activity Heatmap Data ──
  const activityMap = new Map<string, number>();
  auditLogs.forEach((log) => {
    const key = log.createdAt.toISOString().slice(0, 10);
    activityMap.set(key, (activityMap.get(key) ?? 0) + 1);
  });
  const activityData = Array.from(activityMap.entries()).map(([date, count]) => ({ date, count }));

  return (
    <div className="space-y-5">
      {availableCurrencies.length > 1 && (
        <div className="flex items-center justify-between">
          <CurrencyTabs currencies={availableCurrencies} />
          <span className="text-xs text-muted-foreground">{currencyProjects.length} of {totalProjects} projects</span>
        </div>
      )}

      <KpiStrip
        portfolioValue={portfolioValue}
        totalBilled={totalBilled}
        totalCollected={totalCollected}
        billedPct={billedPct}
        collectedPct={collectedPct}
        activeProjects={activeProjects}
        onHoldCount={onHoldCount}
        totalOverdueItems={totalOverdueItems}
        overdueMilestones={overdueMilestones.length}
        overdueInvoices={overdueInvoices.length}
        currency={selectedCurrency}
        sparklineData={sparklineData}
      />

      <DashboardTabs
        attentionCount={overdueMilestones.length + overdueInvoices.length + pendingDeliveryNotes.length}
        attentionContent={
          <TabAttention
            overdueMilestones={overdueMilestones}
            overdueInvoices={overdueInvoices}
            pendingDeliveryNotes={pendingDeliveryNotes}
            upcomingMilestones={upcomingMilestones}
          />
        }
        pipelineContent={
          <TabPipeline
            milestonesByStatus={milestonesByStatus}
            invoicesByStatus={invoicesByStatus}
          />
        }
        timelineContent={
          <TabTimeline
            projects={timelineProjects}
            activityData={activityData}
          />
        }
      />
    </div>
  );
}
