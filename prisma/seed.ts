import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.deliveryNote.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();
  await prisma.projectManager.deleteMany();

  // Project Managers
  const pm1 = await prisma.projectManager.create({
    data: {
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      phone: "+966 50 123 4567",
      title: "Senior Project Manager",
      photoUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    },
  });

  const pm2 = await prisma.projectManager.create({
    data: {
      name: "Omar Gawdat",
      email: "omar.gawdat@company.com",
      phone: "+966 55 987 6543",
      title: "Project Director",
      photoUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
  });

  const pm3 = await prisma.projectManager.create({
    data: {
      name: "Ahmed Al-Rashid",
      email: "ahmed.rashid@company.com",
      phone: "+971 50 555 1234",
      title: "Technical Project Manager",
      photoUrl: null,
    },
  });

  // Project 1
  const project1 = await prisma.project.create({
    data: {
      name: "E-Commerce Platform Redesign",
      clientName: "TechCorp Ltd",
      contractNumber: "TC-2026-001",
      contractValue: 150000,
      currency: "USD",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-06-30"),
      projectManagerId: pm1.id,
      paymentTerms: "Net 30",
      clientInvoicingMethod: "PORTAL",
      status: "ACTIVE",
    },
  });

  const milestone1a = await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: "Requirements & Design",
      value: 30000,
      plannedDate: new Date("2026-02-15"),
      status: "COMPLETED",
      requiresDeliveryNote: true,
    },
  });

  await prisma.deliveryNote.create({
    data: {
      milestoneId: milestone1a.id,
      description: "Requirements document and UI/UX designs",
      workDelivered:
        "Complete requirements specification, wireframes, and high-fidelity mockups for all pages",
      status: "SIGNED",
      sentDate: new Date("2026-02-14"),
      signedDate: new Date("2026-02-16"),
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: "Frontend Development",
      value: 52500,
      plannedDate: new Date("2026-04-01"),
      status: "IN_PROGRESS",
      requiresDeliveryNote: true,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: "Backend API & Integration",
      value: 45000,
      plannedDate: new Date("2026-05-15"),
      status: "NOT_STARTED",
      requiresDeliveryNote: true,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: project1.id,
      name: "Testing & Launch",
      value: 22500,
      plannedDate: new Date("2026-06-30"),
      status: "NOT_STARTED",
      requiresDeliveryNote: false,
    },
  });

  // Project 2
  await prisma.project.create({
    data: {
      name: "Mobile Banking App",
      clientName: "FinanceHub Inc",
      contractNumber: "FH-2026-042",
      contractValue: 280000,
      currency: "USD",
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-09-30"),
      projectManagerId: pm2.id,
      paymentTerms: "Net 45",
      clientInvoicingMethod: "EMAIL",
      status: "ACTIVE",
      milestones: {
        create: [
          {
            name: "Discovery & Architecture",
            value: 56000,
            plannedDate: new Date("2026-03-15"),
            status: "READY_FOR_INVOICING",
            requiresDeliveryNote: false,
          },
          {
            name: "Core Features Development",
            value: 112000,
            plannedDate: new Date("2026-06-15"),
            status: "NOT_STARTED",
            requiresDeliveryNote: true,
          },
        ],
      },
    },
  });

  // Project 3
  const project3 = await prisma.project.create({
    data: {
      name: "CRM Data Migration",
      clientName: "GlobalRetail Corp",
      contractNumber: "GR-2025-089",
      contractValue: 75000,
      currency: "EUR",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2025-12-31"),
      projectManagerId: pm1.id,
      paymentTerms: "Net 30",
      clientInvoicingMethod: "PORTAL",
      status: "FULLY_INVOICED",
    },
  });

  const milestone3a = await prisma.milestone.create({
    data: {
      projectId: project3.id,
      name: "Data Mapping & Migration Scripts",
      value: 37500,
      plannedDate: new Date("2025-10-31"),
      status: "INVOICED",
      requiresDeliveryNote: true,
    },
  });

  await prisma.deliveryNote.create({
    data: {
      milestoneId: milestone3a.id,
      description: "Data migration scripts and mapping documentation",
      workDelivered:
        "ETL pipelines, data mapping sheets, migration scripts for all 12 data entities",
      status: "SIGNED",
      sentDate: new Date("2025-10-30"),
      signedDate: new Date("2025-11-01"),
    },
  });

  const invoice3a = await prisma.invoice.create({
    data: {
      milestoneId: milestone3a.id,
      invoiceNumber: "INV-2025-001",
      amount: 37500,
      vatAmount: 5625,
      totalPayable: 43125,
      status: "PAID",
      submittedDate: new Date("2025-11-02"),
      paymentDueDate: new Date("2025-12-02"),
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice3a.id,
      amount: 43125,
      receivedDate: new Date("2025-11-28"),
      reference: "WIRE-TRF-20251128-001",
    },
  });

  const milestone3b = await prisma.milestone.create({
    data: {
      projectId: project3.id,
      name: "Validation & Go-Live Support",
      value: 37500,
      plannedDate: new Date("2025-12-31"),
      status: "INVOICED",
      requiresDeliveryNote: false,
    },
  });

  await prisma.invoice.create({
    data: {
      milestoneId: milestone3b.id,
      invoiceNumber: "INV-2025-002",
      amount: 37500,
      vatAmount: 5625,
      totalPayable: 43125,
      status: "APPROVED",
      submittedDate: new Date("2026-01-05"),
      paymentDueDate: new Date("2026-02-04"),
    },
  });

  await prisma.invoice.create({
    data: {
      milestoneId: milestone1a.id,
      invoiceNumber: "INV-2026-003",
      amount: 30000,
      vatAmount: 4500,
      totalPayable: 34500,
      status: "SUBMITTED",
      submittedDate: new Date("2026-02-20"),
      paymentDueDate: new Date("2026-03-22"),
    },
  });

  console.log("Seed data created successfully!");
  console.log("  - 3 project managers");
  console.log("  - 3 projects");
  console.log("  - 7 milestones");
  console.log("  - 2 delivery notes");
  console.log("  - 3 invoices");
  console.log("  - 1 payment");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
