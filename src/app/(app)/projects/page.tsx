import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/common/page-header";
import { SchemaProjectCard } from "@/components/ui/schema-project-card";
import { ProjectSheet } from "@/components/common/project-sheet";
import { FolderKanban } from "lucide-react";
import { sumUniqueInvoices } from "@/lib/financial";

export default async function ProjectsPage() {
  const [projects, projectManagers, clients] = await Promise.all([
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        client: { select: { name: true } },
        projectManager: { select: { name: true, photoUrl: true } },
        milestones: {
          select: { status: true, value: true, invoice: { select: { id: true, totalPayable: true, status: true } } },
        },
      },
    }),
    prisma.projectManager.findMany({
      select: { id: true, name: true, title: true, photoUrl: true },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Projects"
        description={`${projects.length} project${projects.length !== 1 ? "s" : ""} across all clients`}
        breadcrumbs={[]}
      >
        <ProjectSheet projectManagers={projectManagers} clients={clients} />
      </PageHeader>

      {projects.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, i) => {
            const completed = project.milestones.filter(
              (m) =>
                m.status === "COMPLETED" ||
                m.status === "READY_FOR_INVOICING" ||
                m.status === "INVOICED",
            ).length;
            const billedAmount = sumUniqueInvoices(project.milestones);
            const collectedAmount = sumUniqueInvoices(project.milestones, "PAID");

            return (
              <SchemaProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                clientName={project.client.name}
                contractNumber={project.contractNumber}
                contractValue={Number(project.contractValue)}
                currency={project.currency}
                startDate={project.startDate}
                endDate={project.endDate}
                projectManager={project.projectManager.name}
                projectManagerPhoto={project.projectManager.photoUrl}
                status={project.status}
                milestonesCompleted={completed}
                milestonesTotal={project.milestones.length}
                billedAmount={billedAmount}
                collectedAmount={collectedAmount}
                colorIndex={i}
              />
            );
          })}
        </div>
      ) : (
        <div className="border-border/50 bg-card flex flex-col items-center gap-4 rounded-2xl border py-20 shadow-lg shadow-black/10">
          <div className="rounded-2xl bg-teal-500/10 p-4">
            <FolderKanban className="h-8 w-8 text-teal-400" />
          </div>
          <div className="text-center">
            <p className="text-foreground text-base font-semibold">
              No projects yet
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Create your first project to start tracking deliveries.
            </p>
          </div>
          <ProjectSheet projectManagers={projectManagers} clients={clients} />
        </div>
      )}
    </div>
  );
}
