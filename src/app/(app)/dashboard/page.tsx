import {
  Briefcase,
  FileCheck,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileSignature,
  CalendarClock,
  Users2,
  FolderKanban,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/common/status-badge";
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
import { getInitials, safePercent, addToCurrency, sumCurrencyTotals, type CurrencyTotals } from "@/lib/format";
import { MultiCurrencyDisplay } from "@/components/common/multi-currency-display";
import {
  CashFlowFunnelChart,
  DashboardBillingRing,
  MilestoneStatusDonut,
  RevenueByClientChart,
  InvoicePipelineBar,
} from "@/components/common/dashboard-charts";

export default async function DashboardPage() {
  const now = new Date();

  const [allProjects, recentProjects, recentInvoices, overdueInvoices, onHoldCount] =
    await Promise.all([
      // 1. All projects with full relations
      prisma.project.findMany({
        include: {
          client: { select: { id: true, name: true, sector: true } },
          projectManager: { select: { id: true, name: true, photoUrl: true, title: true } },
          milestones: {
            select: {
              id: true,
              name: true,
              value: true,
              plannedDate: true,
              status: true,
              projectId: true,
              invoice: { select: { id: true, totalPayable: true, status: true, paymentDueDate: true } },
              deliveryNote: { select: { id: true, status: true } },
            },
          },
        },
      }),
      // 2. Recent projects
      prisma.project.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: {
          client: { select: { name: true } },
          _count: { select: { milestones: true } },
          milestones: { select: { status: true } },
        },
      }),
      // 3. Recent invoices
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          milestones: { select: { project: { select: { name: true } } } },
        },
      }),
      // 4. Overdue invoices
      prisma.invoice.findMany({
        where: {
          status: { notIn: ["PAID", "REJECTED"] },
          paymentDueDate: { lt: now },
        },
        include: {
          milestones: { select: { project: { select: { name: true } } } },
        },
      }),
      // 5. On-hold count
      prisma.project.count({ where: { status: "ON_HOLD" } }),
    ]);

  // ── Computed Values ──
  const totalProjects = allProjects.length;
  const activeProjects = allProjects.filter((p) => p.status === "ACTIVE").length;
  const allMilestones = allProjects.flatMap((p) => p.milestones);
  const totalMilestones = allMilestones.length;

  // Group financials by currency
  const portfolioByCurrency: CurrencyTotals = {};
  const billedByCurrency: CurrencyTotals = {};
  const collectedByCurrency: CurrencyTotals = {};
  for (const p of allProjects) {
    addToCurrency(portfolioByCurrency, p.currency, Number(p.contractValue));
    const projMsWithCurrency = p.milestones.map((m) => ({ ...m, _currency: p.currency }));
    const projBilled = sumUniqueInvoices(projMsWithCurrency);
    const projCollected = sumUniqueInvoices(projMsWithCurrency, "PAID");
    addToCurrency(billedByCurrency, p.currency, projBilled);
    addToCurrency(collectedByCurrency, p.currency, projCollected);
  }
  const portfolioValue = sumCurrencyTotals(portfolioByCurrency);
  const totalBilled = sumCurrencyTotals(billedByCurrency);
  const totalCollected = sumCurrencyTotals(collectedByCurrency);
  const outstandingAmount = totalBilled - totalCollected;
  const unbilledAmount = portfolioValue - totalBilled;
  const billedPct = safePercent(totalBilled, portfolioValue);
  const collectedPct = safePercent(totalCollected, portfolioValue);

  // Overdue milestones
  const overdueMilestones = allProjects.flatMap((p) =>
    filterOverdue(p.milestones, now).map((m) => ({
      id: m.id,
      name: m.name,
      projectName: p.name,
      projectId: p.id,
      daysOverdue: daysDifference(m.plannedDate, now),
    })),
  ).sort((a, b) => b.daysOverdue - a.daysOverdue);

  // Upcoming milestones (30 days)
  const upcomingMilestones = allProjects.flatMap((p) =>
    filterUpcoming(p.milestones, 30, now).map((m) => ({
      id: m.id,
      name: m.name,
      projectName: p.name,
      projectId: p.id,
      plannedDate: m.plannedDate,
      daysUntil: -daysDifference(m.plannedDate, now),
    })),
  ).sort((a, b) => a.daysUntil - b.daysUntil);

  // Pending delivery notes
  const pendingDeliveryNotes = allProjects.flatMap((p) =>
    p.milestones
      .filter((m) => m.deliveryNote && m.deliveryNote.status !== "SIGNED")
      .map((m) => ({
        name: m.name,
        projectName: p.name,
        projectId: p.id,
        status: m.deliveryNote!.status,
      })),
  );

  // Milestone status counts
  const milestoneStatusCounts = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "READY_FOR_INVOICING", "INVOICED"].map(
    (status) => ({
      name: status,
      value: allMilestones.filter((m) => m.status === status).length,
    }),
  );

  // Invoice status counts (deduplicated)
  const invoiceMap = new Map<string, string>();
  allMilestones.forEach((m) => {
    if (m.invoice && !invoiceMap.has(m.invoice.id)) {
      invoiceMap.set(m.invoice.id, m.invoice.status);
    }
  });
  const invoiceStatusCounts = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "PAID", "REJECTED"].map(
    (status) => ({
      status,
      count: Array.from(invoiceMap.values()).filter((s) => s === status).length,
    }),
  );

  // Revenue by client
  const clientMap = new Map<string, { id: string; name: string; collected: number; outstanding: number; unbilled: number }>();
  allProjects.forEach((p) => {
    const existing = clientMap.get(p.client.id) ?? {
      id: p.client.id,
      name: p.client.name,
      collected: 0,
      outstanding: 0,
      unbilled: 0,
    };
    const projBilled = sumUniqueInvoices(p.milestones);
    const projCollected = sumUniqueInvoices(p.milestones, "PAID");
    const projValue = Number(p.contractValue);
    existing.collected += projCollected;
    existing.outstanding += projBilled - projCollected;
    existing.unbilled += projValue - projBilled;
    clientMap.set(p.client.id, existing);
  });
  const revenueByClient = Array.from(clientMap.values())
    .sort((a, b) => (b.collected + b.outstanding + b.unbilled) - (a.collected + a.outstanding + a.unbilled))
    .slice(0, 6)
    .map((c) => ({
      ...c,
      name: c.name.length > 18 ? c.name.slice(0, 16) + "…" : c.name,
    }));

  // PM workload
  const pmMap = new Map<string, {
    id: string;
    name: string;
    photoUrl: string | null;
    activeProjects: number;
    totalMilestones: number;
    completedMilestones: number;
    overdue: number;
  }>();
  allProjects.forEach((p) => {
    const pm = p.projectManager;
    const existing = pmMap.get(pm.id) ?? {
      id: pm.id,
      name: pm.name,
      photoUrl: pm.photoUrl,
      activeProjects: 0,
      totalMilestones: 0,
      completedMilestones: 0,
      overdue: 0,
    };
    if (p.status === "ACTIVE") existing.activeProjects++;
    p.milestones.forEach((m) => {
      existing.totalMilestones++;
      if (isCompleted(m.status)) {
        existing.completedMilestones++;
      }
      if (isOverdue(m, now)) {
        existing.overdue++;
      }
    });
    pmMap.set(pm.id, existing);
  });
  const pmWorkload = Array.from(pmMap.values()).sort((a, b) => b.activeProjects - a.activeProjects).slice(0, 5);

  // Cash flow chart data
  const cashFlowData = [
    { name: "Portfolio", value: portfolioValue, fill: "#6366f1" },
    { name: "Billed", value: totalBilled, fill: "#fbbf24" },
    { name: "Collected", value: totalCollected, fill: "#34d399" },
  ];

  // All alerts combined
  const totalOverdueItems = overdueMilestones.length + overdueInvoices.length;

  // Recent projects: compute progress
  const recentProjectsWithProgress = recentProjects.map((p) => {
    const done = countCompleted(p.milestones);
    return { ...p, done, total: p.milestones.length, pct: completionPercent(p.milestones) };
  });

  return (
    <div className="space-y-6">

      {/* ── Row 1: Key Metrics ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Portfolio Value */}
        <div className="relative overflow-hidden rounded-xl border border-transparent bg-card card-elevated px-4 py-3.5">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-primary/[0.06] blur-2xl" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Briefcase className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Portfolio</span>
            </div>
          </div>
          <div className="tracking-tight text-foreground"><MultiCurrencyDisplay totals={portfolioByCurrency} size="md" /></div>
          <p className="mt-1 text-xs text-muted-foreground">{totalProjects} projects</p>
        </div>

        {/* Total Billed */}
        <div className="relative overflow-hidden rounded-xl border border-transparent bg-card card-elevated px-4 py-3.5">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-amber-500/[0.06] blur-2xl" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                <FileCheck className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billed</span>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold tabular-nums text-amber-600">{billedPct}%</span>
          </div>
          <div className="tracking-tight text-foreground"><MultiCurrencyDisplay totals={billedByCurrency} size="md" /></div>
          <p className="mt-1 text-xs text-muted-foreground">of portfolio</p>
        </div>

        {/* Total Collected */}
        <div className="relative overflow-hidden rounded-xl border border-transparent bg-card card-elevated px-4 py-3.5">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-emerald-500/[0.06] blur-2xl" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Collected</span>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold tabular-nums text-emerald-600">{collectedPct}%</span>
          </div>
          <div className="tracking-tight text-foreground"><MultiCurrencyDisplay totals={collectedByCurrency} size="md" /></div>
          <p className="mt-1 text-xs text-muted-foreground">of portfolio</p>
        </div>

        {/* Active Projects */}
        <div className="relative overflow-hidden rounded-xl border border-transparent bg-card card-elevated px-4 py-3.5">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-blue-500/[0.06] blur-2xl" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active</span>
            </div>
          </div>
          <p className="text-xl font-bold tracking-tight text-foreground tabular-nums">{activeProjects}</p>
          <p className="mt-1 text-xs text-muted-foreground">{onHoldCount} on hold</p>
        </div>

        {/* Overdue Items */}
        <div className={`relative overflow-hidden rounded-xl border px-4 py-3.5 ${totalOverdueItems > 0 ? "border-red-200 bg-red-50" : "border-transparent bg-card card-elevated"}`}>
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-red-500/[0.08] blur-2xl" />
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${totalOverdueItems > 0 ? "bg-red-100" : "bg-red-50"}`}>
                <AlertTriangle className={`h-3.5 w-3.5 ${totalOverdueItems > 0 ? "text-red-400" : "text-red-400"}`} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overdue</span>
            </div>
            {totalOverdueItems > 0 && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
              </span>
            )}
          </div>
          <p className={`text-xl font-bold tracking-tight tabular-nums ${totalOverdueItems > 0 ? "text-red-400" : "text-foreground"}`}>{totalOverdueItems}</p>
          <p className="mt-1 text-xs text-muted-foreground">{overdueMilestones.length} milestones, {overdueInvoices.length} invoices</p>
        </div>
      </div>

      {/* ── Row 2: Primary Charts ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Cash Flow */}
        <div className="rounded-xl border border-transparent bg-card card-elevated p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cash Flow Overview</span>
          </div>
          <CashFlowFunnelChart data={cashFlowData} />
          <div className="mt-3 flex items-start justify-center gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Portfolio</p>
              <MultiCurrencyDisplay totals={portfolioByCurrency} size="sm" colorClass="text-primary" />
            </div>
            <div className="h-4 w-px bg-muted" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Billed</p>
              <MultiCurrencyDisplay totals={billedByCurrency} size="sm" colorClass="text-amber-600" />
            </div>
            <div className="h-4 w-px bg-muted" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Collected</p>
              <MultiCurrencyDisplay totals={collectedByCurrency} size="sm" colorClass="text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Billing & Progress */}
        <div className="rounded-xl border border-transparent bg-card card-elevated p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billing & Progress</span>
          </div>
          <div className="flex flex-col gap-5">
            {/* Top: Billing Ring + Milestone Donut side by side */}
            <div className="grid grid-cols-2 items-center gap-4">
              <DashboardBillingRing
                collected={totalCollected}
                outstanding={outstandingAmount}
                unbilled={unbilledAmount}
                collectedPct={collectedPct}
              />
              <MilestoneStatusDonut data={milestoneStatusCounts} total={totalMilestones} />
            </div>
            {/* Bottom: Invoice Pipeline */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Invoice Pipeline</p>
              <InvoicePipelineBar data={invoiceStatusCounts} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Alerts & Timeline ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Action Items */}
        <div className="rounded-xl border border-transparent bg-card card-elevated p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Action Items</span>
              {(overdueMilestones.length + overdueInvoices.length + pendingDeliveryNotes.length) > 0 && (
                <span className="rounded-full bg-amber-100 px-1.5 py-px text-xs font-bold tabular-nums text-amber-700">
                  {overdueMilestones.length + overdueInvoices.length + pendingDeliveryNotes.length}
                </span>
              )}
            </div>
          </div>
          <div className="max-h-[280px] overflow-y-auto space-y-1 pr-1">
            {overdueMilestones.map((m) => (
              <Link
                key={`ms-${m.id}`}
                href={`/projects/${m.projectId}`}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
              >
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.projectName}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-red-500">{m.daysOverdue}d overdue</span>
              </Link>
            ))}
            {overdueInvoices.map((inv) => (
              <div
                key={`inv-${inv.id}`}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
              >
                <Receipt className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{inv.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{inv.milestones[0]?.project.name ?? "—"}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-red-500">
                  {inv.paymentDueDate ? `${daysDifference(inv.paymentDueDate)}d past due` : "—"}
                </span>
              </div>
            ))}
            {pendingDeliveryNotes.map((dn, i) => (
              <Link
                key={`dn-${i}`}
                href={`/projects/${dn.projectId}`}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
              >
                <FileSignature className="h-3 w-3 shrink-0 text-purple-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{dn.name}</p>
                  <p className="text-xs text-muted-foreground">{dn.projectName}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-purple-500">Pending {dn.status.toLowerCase()}</span>
              </Link>
            ))}
            {overdueMilestones.length === 0 && overdueInvoices.length === 0 && pendingDeliveryNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 mb-2" />
                <p className="text-xs font-medium text-emerald-500">All clear</p>
                <p className="text-xs text-muted-foreground">No action items</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="rounded-xl border border-transparent bg-card card-elevated p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Upcoming Deadlines</span>
              {upcomingMilestones.length > 0 && (
                <span className="rounded-full bg-amber-100 px-1.5 py-px text-xs font-bold tabular-nums text-amber-600">
                  {upcomingMilestones.length}
                </span>
              )}
            </div>
            <Link href="/milestones" className="text-xs font-semibold text-primary transition-colors hover:text-primary/70">
              View all →
            </Link>
          </div>
          <div className="max-h-[280px] overflow-y-auto space-y-0.5 pr-1">
            {upcomingMilestones.slice(0, 8).map((m) => (
              <Link
                key={m.id}
                href={`/projects/${m.projectId}`}
                className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
              >
                {/* Date pill */}
                <div className={`flex h-9 w-14 shrink-0 flex-col items-center justify-center rounded-lg text-center ${
                  m.daysUntil <= 3 ? "bg-red-50" : m.daysUntil <= 7 ? "bg-amber-50" : "bg-accent"
                }`}>
                  <span className={`text-xs font-bold tabular-nums ${
                    m.daysUntil <= 3 ? "text-red-400" : m.daysUntil <= 7 ? "text-amber-400" : "text-muted-foreground"
                  }`}>
                    {m.daysUntil === 0 ? "Today" : `${m.daysUntil}d`}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.plannedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                {/* Milestone info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.projectName}</p>
                </div>
              </Link>
            ))}
            {upcomingMilestones.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarClock className="h-6 w-6 text-muted-foreground/60 mb-2" />
                <p className="text-xs text-muted-foreground">No upcoming deadlines in the next 30 days</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 4: Breakdowns ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue by Client */}
        <div className="rounded-xl border border-transparent bg-card card-elevated p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue by Client</span>
          </div>
          {revenueByClient.length > 0 ? (
            <RevenueByClientChart data={revenueByClient} />
          ) : (
            <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">No client data yet</div>
          )}
        </div>

        {/* Team Workload */}
        <div className="rounded-xl border border-transparent bg-card card-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users2 className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Team Workload</span>
            </div>
            <Link href="/project-managers" className="text-xs font-semibold text-primary transition-colors hover:text-primary/70">
              View all →
            </Link>
          </div>
          <div className="space-y-2.5">
            {pmWorkload.map((pm) => {
              const pct = safePercent(pm.completedMilestones, pm.totalMilestones);
              const initials = getInitials(pm.name);
              return (
                <Link
                  key={pm.id}
                  href={`/project-managers/${pm.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
                >
                  {pm.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pm.photoUrl} alt={pm.name} className="h-7 w-7 rounded-full object-cover ring-1 ring-ring/20" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground ring-1 ring-ring/20">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{pm.name}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">{pm.activeProjects} active</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
                      {pm.overdue > 0 && (
                        <span className="rounded-full bg-red-100 px-1.5 py-px text-xs font-bold tabular-nums text-red-600">{pm.overdue}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
            {pmWorkload.length === 0 && (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">No team data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 5: Recent Activity ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Projects */}
        <div className="overflow-hidden rounded-xl border border-transparent bg-card card-elevated">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-3.5 w-3.5 text-primary/70" />
              <span className="text-sm font-semibold text-foreground">Recent Projects</span>
            </div>
            <Link href="/projects" className="text-xs font-semibold text-primary transition-colors hover:text-primary/70">
              View all →
            </Link>
          </div>
          <table className="w-full text-sm" aria-label="Recent projects">
            <thead>
              <tr className="border-b border-border/50">
                <th scope="col" className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Client</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentProjectsWithProgress.map((p, idx) => (
                <tr key={p.id} className={`transition-colors hover:bg-accent ${idx < recentProjectsWithProgress.length - 1 ? "border-b border-border/50" : ""}`}>
                  <td className="px-5 py-2.5">
                    <Link href={`/projects/${p.id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{p.client.name}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${p.pct}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">{p.done}/{p.total}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentProjectsWithProgress.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">No projects yet</p>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="overflow-hidden rounded-xl border border-transparent bg-card card-elevated">
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-3.5 w-3.5 text-pink-500" />
              <span className="text-sm font-semibold text-foreground">Recent Invoices</span>
            </div>
            <Link href="/invoices" className="text-xs font-semibold text-primary transition-colors hover:text-primary/70">
              View all →
            </Link>
          </div>
          <table className="w-full text-sm" aria-label="Recent invoices">
            <thead>
              <tr className="border-b border-border/50">
                <th scope="col" className="px-5 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
                <th scope="col" className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv, idx) => {
                const isOverdue = inv.paymentDueDate && new Date(inv.paymentDueDate) < now && inv.status !== "PAID";
                return (
                  <tr key={inv.id} className={`transition-colors hover:bg-accent ${idx < recentInvoices.length - 1 ? "border-b border-border/50" : ""}`}>
                    <td className="px-5 py-2.5">
                      <span className="font-mono text-xs font-medium text-muted-foreground">{inv.invoiceNumber}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{inv.milestones[0]?.project.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs font-medium tabular-nums text-muted-foreground">
                      {Number(inv.totalPayable).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-2.5">
                      {inv.paymentDueDate ? (
                        <span className={`text-xs ${isOverdue ? "font-medium text-red-400" : "text-muted-foreground"}`}>
                          {new Date(inv.paymentDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {recentInvoices.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">No invoices yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
