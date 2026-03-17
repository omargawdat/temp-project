import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { PMCard } from "@/components/common/pm-card";
import { PMSheet } from "@/components/common/pm-sheet";
import { Users } from "lucide-react";

export default async function ProjectManagersPage() {
  const managers = await prisma.projectManager.findMany({
    orderBy: { name: "asc" },
    include: {
      projects: {
        select: {
          id: true,
          name: true,
          clientName: true,
          status: true,
          contractValue: true,
          currency: true,
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Team"
        description={`${managers.length} project manager${managers.length !== 1 ? "s" : ""}`}
        breadcrumbs={[]}
      >
        <PMSheet />
      </PageHeader>

      {managers.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {managers.map((pm, i) => (
            <PMCard key={pm.id} pm={pm} colorIndex={i} />
          ))}
        </div>
      ) : (
        <div className="card-border inner-glow flex flex-col items-center gap-4 rounded-2xl py-20">
          <div className="rounded-2xl bg-indigo-500/10 p-4">
            <Users className="h-8 w-8 text-indigo-400" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">No project managers yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first PM to start assigning projects.
            </p>
          </div>
          <PMSheet />
        </div>
      )}
    </div>
  );
}
