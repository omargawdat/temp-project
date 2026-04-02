import {
  CashFlowFunnelChart,
  DashboardBillingRing,
  MilestoneStatusDonut,
  RevenueByClientChart,
  InvoicePipelineBar,
} from "@/components/common/dashboard-charts";
import { formatCurrency } from "@/lib/format";

interface TabFinancialProps {
  cashFlowData: { name: string; value: number; fill: string }[];
  portfolioValue: number;
  totalBilled: number;
  totalCollected: number;
  outstandingAmount: number;
  unbilledAmount: number;
  collectedPct: number;
  currency: string;
  milestoneStatusCounts: { name: string; value: number }[];
  totalMilestones: number;
  invoiceStatusCounts: { status: string; count: number }[];
  revenueByClient: { name: string; collected: number; outstanding: number; unbilled: number }[];
}

export function TabFinancial({
  cashFlowData,
  portfolioValue,
  totalBilled,
  totalCollected,
  outstandingAmount,
  unbilledAmount,
  collectedPct,
  currency,
  milestoneStatusCounts,
  totalMilestones,
  invoiceStatusCounts,
  revenueByClient,
}: TabFinancialProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Left column: Cash Flow + Revenue */}
      <div className="space-y-4">
        {/* Cash Flow */}
        <div className="rounded-xl bg-card card-elevated p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cash Flow Overview</span>
          <div className="mt-4">
            <CashFlowFunnelChart data={cashFlowData} />
          </div>
          <div className="mt-3 flex items-start justify-center gap-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Portfolio</p>
              <p className="text-sm font-bold tabular-nums text-primary">{formatCurrency(portfolioValue, currency)}</p>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Billed</p>
              <p className="text-sm font-bold tabular-nums text-amber-600">{formatCurrency(totalBilled, currency)}</p>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Collected</p>
              <p className="text-sm font-bold tabular-nums text-emerald-600">{formatCurrency(totalCollected, currency)}</p>
            </div>
          </div>
        </div>

        {/* Revenue by Client */}
        <div className="rounded-xl bg-card card-elevated p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue by Client</span>
          <div className="mt-4">
            {revenueByClient.length > 0 ? (
              <RevenueByClientChart data={revenueByClient} />
            ) : (
              <div className="flex items-center justify-center py-10 text-xs text-muted-foreground">No client data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Right column: Billing Ring + Milestone Donut + Invoice Pipeline */}
      <div className="space-y-4">
        <div className="rounded-xl bg-card card-elevated p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billing & Progress</span>
          <div className="mt-4 flex flex-col gap-5">
            <div className="grid grid-cols-2 items-center gap-4">
              <DashboardBillingRing
                collected={totalCollected}
                outstanding={outstandingAmount}
                unbilled={unbilledAmount}
                collectedPct={collectedPct}
              />
              <MilestoneStatusDonut data={milestoneStatusCounts} total={totalMilestones} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Invoice Pipeline</p>
              <InvoicePipelineBar data={invoiceStatusCounts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
