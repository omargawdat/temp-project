import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  companyDetails: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 4,
    lineHeight: 1.5,
  },
  invoiceTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "right" as const,
  },
  invoiceMeta: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "right" as const,
    marginTop: 4,
    lineHeight: 1.6,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginVertical: 16,
  },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  clientDetail: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  colName: { flex: 3 },
  colDate: { flex: 1.5 },
  colAmount: { flex: 1.5, textAlign: "right" as const },
  headerText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  cellText: {
    fontSize: 10,
    color: "#334155",
  },
  cellBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 4,
    paddingRight: 12,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#64748b",
    width: 120,
    textAlign: "right" as const,
    marginRight: 16,
  },
  summaryValue: {
    fontSize: 10,
    color: "#0f172a",
    width: 100,
    textAlign: "right" as const,
  },
  summaryTotal: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    width: 100,
    textAlign: "right" as const,
  },
  summaryTotalLabel: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    width: 120,
    textAlign: "right" as const,
    marginRight: 16,
  },
  bankSection: {
    marginTop: 30,
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
  },
  bankTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bankLabel: {
    fontSize: 9,
    color: "#94a3b8",
    width: 80,
  },
  bankValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center" as const,
    fontSize: 8,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
});

export interface InvoicePdfData {
  invoiceNumber: string;
  createdAt: string;
  paymentDueDate: string | null;
  amount: number;
  vatAmount: number;
  totalPayable: number;
  currency: string;
  projectName: string;
  contractNumber: string;
  clientName: string;
  paymentTerms: string;
  milestones: { name: string; plannedDate: string; value: number }[];
  company: {
    companyName: string;
    address: string;
    city: string;
    country: string;
    taxId: string;
    email: string;
    phone: string;
    website: string;
    bankName: string;
    bankAccount: string;
    bankIban: string;
    bankSwift: string;
    invoiceFooter: string;
  };
}

function formatCurrency(amount: number, currency: string) {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InvoicePdf({ data }: { data: InvoicePdfData }) {
  const { company } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{company.companyName}</Text>
            <Text style={styles.companyDetails}>
              {company.address}{company.city ? `, ${company.city}` : ""}{company.country ? `, ${company.country}` : ""}
              {"\n"}{company.email}{company.phone ? `  |  ${company.phone}` : ""}
              {company.taxId ? `\nTax ID: ${company.taxId}` : ""}
            </Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceMeta}>
              #{data.invoiceNumber}
              {"\n"}Date: {formatDate(data.createdAt)}
              {data.paymentDueDate ? `\nDue: ${formatDate(data.paymentDueDate)}` : ""}
              {"\n"}Terms: {data.paymentTerms}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bill To + Project */}
        <View style={styles.twoCol}>
          <View>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.clientName}>{data.clientName}</Text>
          </View>
          <View>
            <Text style={styles.sectionLabel}>Project</Text>
            <Text style={styles.clientName}>{data.projectName}</Text>
            <Text style={styles.clientDetail}>Contract: {data.contractNumber}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colName}><Text style={styles.headerText}>Milestone</Text></View>
            <View style={styles.colDate}><Text style={styles.headerText}>Date</Text></View>
            <View style={styles.colAmount}><Text style={styles.headerText}>Amount</Text></View>
          </View>
          {data.milestones.map((m, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colName}><Text style={styles.cellBold}>{m.name}</Text></View>
              <View style={styles.colDate}><Text style={styles.cellText}>{formatDate(m.plannedDate)}</Text></View>
              <View style={styles.colAmount}><Text style={styles.cellBold}>{formatCurrency(m.value, data.currency)}</Text></View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={{ marginTop: 16 }}>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.amount, data.currency)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>VAT</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.vatAmount, data.currency)}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 2, borderTopColor: "#0f172a" }]}>
            <Text style={styles.summaryTotalLabel}>Total Payable</Text>
            <Text style={styles.summaryTotal}>{formatCurrency(data.totalPayable, data.currency)}</Text>
          </View>
        </View>

        {/* Bank Details */}
        {company.bankName && (
          <View style={styles.bankSection}>
            <Text style={styles.bankTitle}>Payment Details</Text>
            {company.bankName && <View style={styles.bankRow}><Text style={styles.bankLabel}>Bank</Text><Text style={styles.bankValue}>{company.bankName}</Text></View>}
            {company.bankIban && <View style={styles.bankRow}><Text style={styles.bankLabel}>IBAN</Text><Text style={styles.bankValue}>{company.bankIban}</Text></View>}
            {company.bankSwift && <View style={styles.bankRow}><Text style={styles.bankLabel}>SWIFT</Text><Text style={styles.bankValue}>{company.bankSwift}</Text></View>}
            {company.bankAccount && <View style={styles.bankRow}><Text style={styles.bankLabel}>Account</Text><Text style={styles.bankValue}>{company.bankAccount}</Text></View>}
          </View>
        )}

        {/* Footer */}
        {company.invoiceFooter && (
          <Text style={styles.footer}>{company.invoiceFooter}</Text>
        )}
      </Page>
    </Document>
  );
}
