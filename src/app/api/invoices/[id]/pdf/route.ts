import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { InvoicePdf } from "@/lib/pdf/invoice-template";
import type { InvoicePdfData } from "@/lib/pdf/invoice-template";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      milestones: {
        include: {
          project: { include: { client: true } },
        },
      },
    },
  });

  if (!invoice || invoice.milestones.length === 0) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const project = invoice.milestones[0].project;
  const company = await prisma.companySettings.findUnique({ where: { id: "default" } });

  const pdfData: InvoicePdfData = {
    invoiceNumber: invoice.invoiceNumber,
    createdAt: invoice.createdAt.toISOString(),
    paymentDueDate: invoice.paymentDueDate?.toISOString() ?? null,
    amount: Number(invoice.amount),
    vatAmount: Number(invoice.vatAmount),
    totalPayable: Number(invoice.totalPayable),
    currency: project.currency,
    projectName: project.name,
    contractNumber: project.contractNumber,
    clientName: project.client.name,
    paymentTerms: project.paymentTerms,
    milestones: invoice.milestones.map((m) => ({
      name: m.name,
      plannedDate: m.plannedDate.toISOString(),
      value: Number(m.value),
    })),
    company: {
      companyName: company?.companyName ?? "",
      address: company?.address ?? "",
      city: company?.city ?? "",
      country: company?.country ?? "",
      taxId: company?.taxId ?? "",
      email: company?.email ?? "",
      phone: company?.phone ?? "",
      website: company?.website ?? "",
      bankName: company?.bankName ?? "",
      bankAccount: company?.bankAccount ?? "",
      bankIban: company?.bankIban ?? "",
      bankSwift: company?.bankSwift ?? "",
      invoiceFooter: company?.invoiceFooter ?? "",
    },
  };

  const buffer = await renderToBuffer(
    React.createElement(InvoicePdf, { data: pdfData }) as any,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
