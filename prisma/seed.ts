import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean in dependency order
  await prisma.note.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.deliveryNote.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();
  await prisma.projectManager.deleteMany();
  await prisma.client.deleteMany();
  await prisma.country.deleteMany();

  // ─── Countries (9) — Gulf focus ────────────────────────────────

  const countriesData = [
    { name: "Saudi Arabia", code: "SA", flag: "/images/flags/sa.png" },
    { name: "UAE", code: "AE", flag: "/images/flags/ae.png" },
    { name: "Qatar", code: "QA", flag: "/images/flags/qa.png" },
    { name: "Kuwait", code: "KW", flag: "/images/flags/kw.png" },
    { name: "Bahrain", code: "BH", flag: "/images/flags/bh.png" },
    { name: "Oman", code: "OM", flag: "/images/flags/om.png" },
    { name: "Egypt", code: "EG", flag: "/images/flags/eg.png" },
    { name: "Jordan", code: "JO", flag: "/images/flags/jo.png" },
    { name: "Iraq", code: "IQ", flag: "/images/flags/iq.png" },
  ];

  const countries: Record<string, { id: string }> = {};
  for (const c of countriesData) {
    const country = await prisma.country.create({ data: c });
    countries[c.code] = country;
  }

  // ─── Clients (5) ──────────────────────────────────────────────

  const stc = await prisma.client.create({
    data: {
      name: "Saudi Telecom (STC)",

      countryId: countries["SA"].id,
      sector: "SEMI_GOVERNMENT",
      primaryContact: "Khalid Al-Otaibi",
      financeContact: "Noura Al-Harbi",
      email: "vendor.relations@stc.com.sa",
      phone: "+966 11 218 0000",
      billingAddress: "King Fahd Road, Al Muruj, Riyadh 12283, Saudi Arabia",
      portalName: "STC Vendor Portal",
      portalLink: "https://vendors.stc.com.sa",
    },
  });

  const enbd = await prisma.client.create({
    data: {
      name: "Emirates NBD",

      countryId: countries["AE"].id,
      sector: "PRIVATE",
      primaryContact: "Rashed Al-Maktoum",
      financeContact: "Aisha Kazim",
      email: "procurement@emiratesnbd.com",
      phone: "+971 4 316 0000",
      billingAddress: "Baniyas Road, Deira, Dubai, UAE",
      portalName: "Ariba",
      portalLink: "https://ariba.emiratesnbd.com",
    },
  });

  const neom = await prisma.client.create({
    data: {
      name: "NEOM",

      countryId: countries["SA"].id,
      sector: "GOVERNMENT",
      primaryContact: "Faisal Al-Ruwaily",
      financeContact: "Maha Al-Zahrani",
      email: "tech.procurement@neom.com",
      phone: "+966 14 800 0000",
      billingAddress: "NEOM, Tabuk Province, Saudi Arabia",
      portalName: "NEOM Procurement",
      portalLink: "https://procurement.neom.com",
      notes: "Requires monthly progress reports attached to each invoice",
    },
  });

  const careem = await prisma.client.create({
    data: {
      name: "Careem Technologies",

      countryId: countries["AE"].id,
      sector: "PRIVATE",
      primaryContact: "Youssef El-Naggar",
      financeContact: "Dina Hossam",
      email: "tech.ops@careem.com",
      phone: "+971 4 456 1200",
      billingAddress: "Building 5, Dubai Internet City, Dubai, UAE",
    },
  });

  const mof = await prisma.client.create({
    data: {
      name: "Ministry of Finance",

      countryId: countries["SA"].id,
      sector: "GOVERNMENT",
      primaryContact: "Abdullah Al-Qahtani",
      financeContact: "Hind Al-Shammari",
      email: "it.projects@mof.gov.sa",
      phone: "+966 11 405 0000",
      billingAddress: "King Abdulaziz Road, Riyadh 11177, Saudi Arabia",
      portalName: "Etimad",
      portalLink: "https://etimad.sa",
      notes: "All invoices must reference Etimad PO number",
    },
  });

  // ─── Project Managers (4) ─────────────────────────────────────

  const sarah = await prisma.projectManager.create({
    data: {
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      phone: "+966 50 123 4567",
      title: "Senior Project Manager",
      photoUrl: "/images/team/sarah.png",
    },
  });

  const omar = await prisma.projectManager.create({
    data: {
      name: "Omar Gawdat",
      email: "omar.gawdat@company.com",
      phone: "+966 55 987 6543",
      title: "Project Director",
      photoUrl: "/images/team/omar.png",
    },
  });

  const ahmed = await prisma.projectManager.create({
    data: {
      name: "Ahmed Al-Rashid",
      email: "ahmed.rashid@company.com",
      phone: "+971 50 555 1234",
      title: "Technical Project Manager",
      photoUrl: "/images/team/ahmed.png",
    },
  });

  const fatima = await prisma.projectManager.create({
    data: {
      name: "Fatima Al-Sayed",
      email: "fatima.alsayed@company.com",
      phone: "+971 55 678 9012",
      title: "Delivery Manager",
      photoUrl: "/images/team/fatima.png",
    },
  });

  // ─── Projects (6) ─────────────────────────────────────────────

  const stcProject = await prisma.project.create({
    data: {
      name: "STC Digital Platform",
      imageUrl: "/images/projects/stc-digital.jpg",
      clientId: stc.id,
      contractNumber: "STC-2025-DIG-001",
      contractValue: 850000,
      currency: "SAR",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2026-06-30"),
      projectManagerId: sarah.id,
      paymentTerms: "Net 30",
      clientInvoicingMethod: "PORTAL",
      status: "ACTIVE",
    },
  });

  const enbdMobile = await prisma.project.create({
    data: {
      name: "ENBD Mobile Banking",
      imageUrl: "/images/projects/enbd-mobile.jpg",
      clientId: enbd.id,
      contractNumber: "ENBD-2025-MOB-042",
      contractValue: 1200000,
      currency: "AED",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-09-30"),
      projectManagerId: omar.id,
      paymentTerms: "Net 45",
      clientInvoicingMethod: "EMAIL",
      status: "ACTIVE",
    },
  });

  const neomProject = await prisma.project.create({
    data: {
      name: "NEOM Smart City Portal",
      imageUrl: "/images/projects/neom-smart.jpg",
      clientId: neom.id,
      contractNumber: "NEOM-2025-SCP-007",
      contractValue: 2500000,
      currency: "SAR",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-12-31"),
      projectManagerId: ahmed.id,
      paymentTerms: "Net 60",
      clientInvoicingMethod: "PORTAL",
      status: "ON_HOLD",
    },
  });

  const careemProject = await prisma.project.create({
    data: {
      name: "Careem Fleet Management",
      imageUrl: "/images/projects/careem-fleet.jpg",
      clientId: careem.id,
      contractNumber: "CRM-2025-FLT-015",
      contractValue: 600000,
      currency: "AED",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-04-30"),
      projectManagerId: fatima.id,
      paymentTerms: "Net 30",
      clientInvoicingMethod: "EMAIL",
      status: "ACTIVE",
    },
  });

  const mofProject = await prisma.project.create({
    data: {
      name: "MOF Budget System",
      imageUrl: "/images/projects/mof-budget.jpg",
      clientId: mof.id,
      contractNumber: "MOF-2025-BDG-003",
      contractValue: 450000,
      currency: "SAR",
      startDate: new Date("2025-01-15"),
      endDate: new Date("2025-10-31"),
      projectManagerId: sarah.id,
      paymentTerms: "Net 30",
      clientInvoicingMethod: "PORTAL",
      status: "CLOSED",
    },
  });

  const enbdRewards = await prisma.project.create({
    data: {
      name: "ENBD Card Rewards",
      imageUrl: "/images/projects/enbd-rewards.jpg",
      clientId: enbd.id,
      contractNumber: "ENBD-2025-RWD-088",
      contractValue: 320000,
      currency: "USD",
      startDate: new Date("2025-10-01"),
      endDate: new Date("2026-05-31"),
      projectManagerId: omar.id,
      paymentTerms: "Net 45",
      clientInvoicingMethod: "EMAIL",
      status: "ACTIVE",
    },
  });

  // ─── Milestones ───────────────────────────────────────────────

  // STC Digital Platform (ACTIVE, 4 milestones)
  const stcRequirements = await prisma.milestone.create({
    data: {
      projectId: stcProject.id,
      name: "Requirements & Analysis",
      value: 170000,
      plannedDate: new Date("2025-08-15"),
      status: "INVOICED",
      requiresDeliveryNote: true,
    },
  });

  const stcDesign = await prisma.milestone.create({
    data: {
      projectId: stcProject.id,
      name: "UI/UX Design",
      value: 127500,
      plannedDate: new Date("2025-11-01"),
      status: "COMPLETED",
      requiresDeliveryNote: true,
    },
  });

  const stcBackend = await prisma.milestone.create({
    data: {
      projectId: stcProject.id,
      name: "Backend Development",
      value: 340000,
      plannedDate: new Date("2026-03-31"),
      status: "IN_PROGRESS",
      requiresDeliveryNote: true,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: stcProject.id,
      name: "Testing & Deployment",
      value: 212500,
      plannedDate: new Date("2026-06-30"),
      status: "NOT_STARTED",
      requiresDeliveryNote: false,
    },
  });

  // ENBD Mobile Banking (ACTIVE, 3 milestones)
  const enbdArchitecture = await prisma.milestone.create({
    data: {
      projectId: enbdMobile.id,
      name: "Architecture & Setup",
      value: 300000,
      plannedDate: new Date("2025-12-15"),
      status: "INVOICED",
      requiresDeliveryNote: false,
    },
  });

  const enbdCoreFeatures = await prisma.milestone.create({
    data: {
      projectId: enbdMobile.id,
      name: "Core Features",
      value: 540000,
      plannedDate: new Date("2026-05-15"),
      status: "READY_FOR_INVOICING",
      requiresDeliveryNote: true,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: enbdMobile.id,
      name: "QA & Launch",
      value: 360000,
      plannedDate: new Date("2026-09-30"),
      status: "NOT_STARTED",
      requiresDeliveryNote: true,
    },
  });

  // NEOM Smart City Portal (ON_HOLD, 3 milestones)
  const neomDiscovery = await prisma.milestone.create({
    data: {
      projectId: neomProject.id,
      name: "Discovery Phase",
      value: 500000,
      plannedDate: new Date("2025-07-31"),
      status: "COMPLETED",
      requiresDeliveryNote: true,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: neomProject.id,
      name: "Platform Core",
      value: 1250000,
      plannedDate: new Date("2026-02-28"), // Past date — overdue
      status: "IN_PROGRESS",
      requiresDeliveryNote: true,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: neomProject.id,
      name: "Integration Layer",
      value: 750000,
      plannedDate: new Date("2026-12-31"),
      status: "NOT_STARTED",
      requiresDeliveryNote: false,
    },
  });

  // Careem Fleet Management (ACTIVE, 3 milestones)
  const careemDashboard = await prisma.milestone.create({
    data: {
      projectId: careemProject.id,
      name: "Fleet Dashboard",
      value: 180000,
      plannedDate: new Date("2025-11-30"),
      status: "COMPLETED",
      requiresDeliveryNote: true,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: careemProject.id,
      name: "API Integrations",
      value: 240000,
      plannedDate: new Date("2026-02-28"),
      status: "IN_PROGRESS",
      requiresDeliveryNote: false,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: careemProject.id,
      name: "Reporting Module",
      value: 180000,
      plannedDate: new Date("2026-04-05"),
      status: "IN_PROGRESS",
      requiresDeliveryNote: false,
    },
  });

  // MOF Budget System (CLOSED, 2 milestones)
  const mofSystemDev = await prisma.milestone.create({
    data: {
      projectId: mofProject.id,
      name: "System Development",
      value: 270000,
      plannedDate: new Date("2025-06-30"),
      status: "INVOICED",
      requiresDeliveryNote: true,
    },
  });

  const mofTraining = await prisma.milestone.create({
    data: {
      projectId: mofProject.id,
      name: "Training & Handover",
      value: 180000,
      plannedDate: new Date("2025-10-31"),
      status: "INVOICED",
      requiresDeliveryNote: false,
    },
  });

  // ENBD Card Rewards (ACTIVE, 2 milestones)
  const enbdRewardsEngine = await prisma.milestone.create({
    data: {
      projectId: enbdRewards.id,
      name: "Rewards Engine",
      value: 192000,
      plannedDate: new Date("2026-01-31"), // Past date — overdue (completed late)
      status: "COMPLETED",
      requiresDeliveryNote: false,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: enbdRewards.id,
      name: "Admin Portal",
      value: 128000,
      plannedDate: new Date("2026-03-28"),
      status: "IN_PROGRESS",
      requiresDeliveryNote: false,
    },
  });

  // Additional milestones with upcoming deadlines (next 30 days from ~2026-03-17)
  await prisma.milestone.create({
    data: {
      projectId: enbdMobile.id,
      name: "Security Audit",
      value: 120000,
      plannedDate: new Date("2026-03-20"),
      status: "IN_PROGRESS",
      requiresDeliveryNote: true,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: stcProject.id,
      name: "API Documentation",
      value: 85000,
      plannedDate: new Date("2026-03-24"),
      status: "IN_PROGRESS",
      requiresDeliveryNote: false,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: careemProject.id,
      name: "Driver App v2",
      value: 95000,
      plannedDate: new Date("2026-03-19"),
      status: "IN_PROGRESS",
      requiresDeliveryNote: false,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: enbdMobile.id,
      name: "Performance Testing",
      value: 80000,
      plannedDate: new Date("2026-04-02"),
      status: "NOT_STARTED",
      requiresDeliveryNote: false,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: stcProject.id,
      name: "Data Migration",
      value: 110000,
      plannedDate: new Date("2026-04-10"),
      status: "NOT_STARTED",
      requiresDeliveryNote: true,
    },
  });

  await prisma.milestone.create({
    data: {
      projectId: enbdRewards.id,
      name: "Partner Integration",
      value: 75000,
      plannedDate: new Date("2026-03-22"),
      status: "IN_PROGRESS",
      requiresDeliveryNote: false,
    },
  });

  // ─── Delivery Notes ───────────────────────────────────────────

  // STC Requirements: SIGNED
  await prisma.deliveryNote.create({
    data: {
      milestoneId: stcRequirements.id,
      description: "Requirements & analysis deliverables for STC Digital Platform",
      workDelivered:
        "Complete business requirements document (BRD), functional specification, system architecture diagrams, and stakeholder sign-off matrix",
      status: "SIGNED",
      sentDate: new Date("2025-08-12"),
      signedDate: new Date("2025-08-15"),
    },
  });

  // STC UI/UX: SIGNED
  await prisma.deliveryNote.create({
    data: {
      milestoneId: stcDesign.id,
      description: "UI/UX design deliverables for STC Digital Platform",
      workDelivered:
        "High-fidelity mockups for 42 screens, design system with component library, interactive prototype, and usability test report",
      status: "SIGNED",
      sentDate: new Date("2025-10-28"),
      signedDate: new Date("2025-11-01"),
    },
  });

  // STC Backend: DRAFT (in progress, DN created but not sent)
  await prisma.deliveryNote.create({
    data: {
      milestoneId: stcBackend.id,
      description: "Backend development deliverables for STC Digital Platform",
      workDelivered:
        "API documentation, microservices deployment, database migration scripts",
      status: "DRAFT",
    },
  });

  // ENBD Core Features: SIGNED
  await prisma.deliveryNote.create({
    data: {
      milestoneId: enbdCoreFeatures.id,
      description: "Core features delivery for ENBD Mobile Banking",
      workDelivered:
        "Account management module, fund transfer engine, bill payment integration, push notification service, and biometric authentication",
      status: "SIGNED",
      sentDate: new Date("2026-03-01"),
      signedDate: new Date("2026-03-05"),
    },
  });

  // NEOM Discovery: SENT (not signed — shows pending state)
  await prisma.deliveryNote.create({
    data: {
      milestoneId: neomDiscovery.id,
      description: "Discovery phase deliverables for NEOM Smart City Portal",
      workDelivered:
        "Market analysis report, technology stack recommendation, infrastructure sizing document, and project roadmap with risk register",
      status: "SENT",
      sentDate: new Date("2025-07-28"),
    },
  });

  // Careem Fleet Dashboard: SIGNED
  await prisma.deliveryNote.create({
    data: {
      milestoneId: careemDashboard.id,
      description: "Fleet dashboard deliverables for Careem",
      workDelivered:
        "Real-time fleet tracking dashboard, driver assignment module, vehicle status monitoring, and geofencing alerts system",
      status: "SIGNED",
      sentDate: new Date("2025-11-25"),
      signedDate: new Date("2025-11-28"),
    },
  });

  // MOF System Dev: SIGNED
  await prisma.deliveryNote.create({
    data: {
      milestoneId: mofSystemDev.id,
      description: "System development deliverables for MOF Budget System",
      workDelivered:
        "Budget planning module, approval workflow engine, departmental allocation system, and audit trail reporting",
      status: "SIGNED",
      sentDate: new Date("2025-06-25"),
      signedDate: new Date("2025-06-29"),
    },
  });

  // ─── Invoices ─────────────────────────────────────────────────

  // INV-2025-001: MOF System Dev + Training → PAID (multi-milestone invoice)
  const inv2025001 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2025-001",
      amount: 450000,
      vatAmount: 67500,
      totalPayable: 517500,
      status: "PAID",
      submittedDate: new Date("2025-07-05"),
      paymentDueDate: new Date("2025-08-04"),
    },
  });
  await prisma.milestone.update({
    where: { id: mofSystemDev.id },
    data: { invoiceId: inv2025001.id },
  });
  await prisma.milestone.update({
    where: { id: mofTraining.id },
    data: { invoiceId: inv2025001.id },
  });

  // INV-2025-002: STC Requirements → PAID
  const inv2025002 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2025-002",
      amount: 170000,
      vatAmount: 25500,
      totalPayable: 195500,
      status: "PAID",
      submittedDate: new Date("2025-08-20"),
      paymentDueDate: new Date("2025-09-19"),
    },
  });
  await prisma.milestone.update({
    where: { id: stcRequirements.id },
    data: { invoiceId: inv2025002.id },
  });

  // INV-2026-001: STC UI/UX → APPROVED
  const inv2026001 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-001",
      amount: 127500,
      vatAmount: 19125,
      totalPayable: 146625,
      status: "APPROVED",
      submittedDate: new Date("2026-01-10"),
      paymentDueDate: new Date("2026-02-09"),
    },
  });
  await prisma.milestone.update({
    where: { id: stcDesign.id },
    data: { invoiceId: inv2026001.id, status: "INVOICED" },
  });

  // INV-2026-002: ENBD Architecture → SUBMITTED
  const inv2026002 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-002",
      amount: 300000,
      vatAmount: 15000,
      totalPayable: 315000,
      status: "SUBMITTED",
      submittedDate: new Date("2026-01-20"),
      paymentDueDate: new Date("2026-03-06"),
    },
  });
  await prisma.milestone.update({
    where: { id: enbdArchitecture.id },
    data: { invoiceId: inv2026002.id },
  });

  // INV-2026-003: Careem Fleet Dashboard → UNDER_REVIEW
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-003",
      amount: 180000,
      vatAmount: 9000,
      totalPayable: 189000,
      status: "UNDER_REVIEW",
      submittedDate: new Date("2026-02-01"),
      paymentDueDate: new Date("2026-03-03"),
      milestones: {
        connect: { id: careemDashboard.id },
      },
    },
  });
  await prisma.milestone.update({
    where: { id: careemDashboard.id },
    data: { status: "INVOICED" },
  });

  // INV-2026-004: ENBD Rewards Engine → DRAFT
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-004",
      amount: 192000,
      vatAmount: 0,
      totalPayable: 192000,
      status: "DRAFT",
      milestones: {
        connect: { id: enbdRewardsEngine.id },
      },
    },
  });
  await prisma.milestone.update({
    where: { id: enbdRewardsEngine.id },
    data: { status: "READY_FOR_INVOICING" },
  });

  // INV-2026-005: Rejected example (NEOM Discovery attempt)
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-005",
      amount: 500000,
      vatAmount: 75000,
      totalPayable: 575000,
      status: "REJECTED",
      submittedDate: new Date("2025-08-10"),
      paymentDueDate: new Date("2025-10-09"),
    },
  });

  // ─── Payments ─────────────────────────────────────────────────

  // INV-2025-001 (PAID): 2 partial payments
  await prisma.payment.create({
    data: {
      invoiceId: inv2025001.id,
      amount: 300000,
      receivedDate: new Date("2025-08-01"),
      reference: "ETIMAD-TRF-20250801-001",
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: inv2025001.id,
      amount: 217500,
      receivedDate: new Date("2025-08-20"),
      reference: "ETIMAD-TRF-20250820-002",
    },
  });

  // INV-2025-002 (PAID): 1 full payment
  await prisma.payment.create({
    data: {
      invoiceId: inv2025002.id,
      amount: 195500,
      receivedDate: new Date("2025-09-15"),
      reference: "STC-VP-PAY-20250915-001",
    },
  });

  // ─── Notes ─────────────────────────────────────────────────────

  await prisma.note.createMany({
    data: [
      // ── Client notes ──
      { entityType: "CLIENT", entityId: stc.id, createdBy: "Omar Gawdat", noteType: "GENERAL", content: "Preferred communication language is Arabic. All official documents must be in both Arabic and English." },
      { entityType: "CLIENT", entityId: stc.id, createdBy: "Sarah Johnson", noteType: "ACTION", content: "Annual contract renewal discussion scheduled for Q4 2026. Prepare updated rate card." },
      { entityType: "CLIENT", entityId: stc.id, createdBy: "Omar Gawdat", noteType: "FINANCE", content: "STC requires a separate PO for each project phase. Invoices without a valid PO will be rejected automatically by their vendor portal." },
      { entityType: "CLIENT", entityId: enbd.id, createdBy: "Omar Gawdat", noteType: "GENERAL", content: "ENBD procurement team rotates quarterly. Always confirm current contact before submitting proposals." },
      { entityType: "CLIENT", entityId: enbd.id, createdBy: "Fatima Al-Sayed", noteType: "FINANCE", content: "ENBD applies 5% VAT on all AED invoices. USD invoices are VAT-exempt per their cross-border policy." },
      { entityType: "CLIENT", entityId: neom.id, createdBy: "Ahmed Al-Rashid", noteType: "MEETING", content: "Met with Faisal Al-Ruwaily on 2026-01-15. NEOM is restructuring their tech department — new CTO expected by Q2 2026." },
      { entityType: "CLIENT", entityId: neom.id, createdBy: "Ahmed Al-Rashid", noteType: "RISK", content: "NEOM payment cycles can extend to 90+ days during organizational restructuring. Plan cash flow accordingly." },
      { entityType: "CLIENT", entityId: careem.id, createdBy: "Fatima Al-Sayed", noteType: "FINANCE", content: "Finance team prefers invoices submitted by the 25th of each month to align with their payment cycle." },
      { entityType: "CLIENT", entityId: careem.id, createdBy: "Fatima Al-Sayed", noteType: "GENERAL", content: "Careem uses Slack for day-to-day communication. Formal approvals still go through email." },
      { entityType: "CLIENT", entityId: mof.id, createdBy: "Sarah Johnson", noteType: "DECISION", content: "MOF requires all deliverables to pass their internal security audit before acceptance. Factor 2 weeks into timelines." },
      { entityType: "CLIENT", entityId: mof.id, createdBy: "Omar Gawdat", noteType: "FINANCE", content: "All MOF invoices must reference the Etimad PO number and include a stamped delivery certificate." },

      // ── Project notes ──
      { entityType: "PROJECT", entityId: stcProject.id, createdBy: "Sarah Johnson", noteType: "MEETING", content: "Client requested biweekly demo sessions starting from the backend development phase." },
      { entityType: "PROJECT", entityId: stcProject.id, createdBy: "Sarah Johnson", noteType: "RISK", content: "Backend team is at 80% capacity. If the ENBD project accelerates, we may need to bring in a contractor for the API layer." },
      { entityType: "PROJECT", entityId: stcProject.id, createdBy: "Omar Gawdat", noteType: "DECISION", content: "Decided to use microservices architecture instead of monolith after load testing showed 3x better throughput." },
      { entityType: "PROJECT", entityId: enbdMobile.id, createdBy: "Omar Gawdat", noteType: "GENERAL", content: "ENBD security team requires all code to pass Veracode static analysis before deployment to staging." },
      { entityType: "PROJECT", entityId: enbdMobile.id, createdBy: "Omar Gawdat", noteType: "ACTION", content: "Schedule penetration testing with ENBD's approved vendor (CyberKnight) before the security audit milestone." },
      { entityType: "PROJECT", entityId: neomProject.id, createdBy: "Ahmed Al-Rashid", noteType: "RISK", content: "Project on hold pending revised scope from client. Expected to resume after board approval in April 2026." },
      { entityType: "PROJECT", entityId: neomProject.id, createdBy: "Ahmed Al-Rashid", noteType: "MEETING", content: "Attended NEOM tech summit on 2025-12-10. Smart city portal must integrate with their IoT middleware layer — adding to scope." },
      { entityType: "PROJECT", entityId: careemProject.id, createdBy: "Fatima Al-Sayed", noteType: "ACTION", content: "Need to finalize API rate limiting strategy with Careem's platform team before the integration milestone." },
      { entityType: "PROJECT", entityId: careemProject.id, createdBy: "Fatima Al-Sayed", noteType: "RISK", content: "Careem is migrating their fleet data to a new provider in Q2 2026. Our integration endpoints may need to be updated." },
      { entityType: "PROJECT", entityId: mofProject.id, createdBy: "Sarah Johnson", noteType: "GENERAL", content: "Project closed successfully. Client expressed interest in a Phase 2 for forecasting module — follow up in Q1 2026." },
      { entityType: "PROJECT", entityId: mofProject.id, createdBy: "Sarah Johnson", noteType: "DECISION", content: "Chose Arabic-first UI with RTL layout as primary. English toggle added as secondary language option per MOF request." },
      { entityType: "PROJECT", entityId: enbdRewards.id, createdBy: "Omar Gawdat", noteType: "FINANCE", content: "Rewards engine milestone completed 2 weeks late. Client agreed to waive penalty clause due to scope additions." },
      { entityType: "PROJECT", entityId: enbdRewards.id, createdBy: "Omar Gawdat", noteType: "ACTION", content: "Admin portal must support bulk CSV upload of partner merchant data. Confirm file size limits with ENBD IT." },
    ],
  });

  // ─── Company Settings ─────────────────────────────────────────

  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "BlackStone eIT",
      address: "King Fahd Road, Al Olaya District",
      city: "Riyadh",
      country: "Saudi Arabia",
      taxId: "300000000000003",
      email: "finance@blackstone-eit.com",
      phone: "+966 11 234 5678",
      website: "https://blackstone-eit.com",
      bankName: "Saudi National Bank (SNB)",
      bankAccount: "SA0380000000608010167519",
      bankIban: "SA0380000000608010167519",
      bankSwift: "NCBKSAJE",
      invoiceFooter:
        "Thank you for your business. Payment is due within the agreed terms.",
    },
  });

  console.log("Seed data created successfully!");
  console.log("  - 9 countries (Gulf focus)");
  console.log("  - 5 clients (GOVERNMENT, PRIVATE, SEMI_GOVERNMENT)");
  console.log("  - 4 project managers");
  console.log("  - 6 projects (ACTIVE, ON_HOLD, CLOSED)");
  console.log("  - 17 milestones (all 5 statuses covered)");
  console.log("  - 7 delivery notes (DRAFT, SENT, SIGNED)");
  console.log("  - 7 invoices (all 6 statuses covered)");
  console.log("  - 3 payments (partial + full)");
  console.log("  - 24 notes (all 6 note types covered)");
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
