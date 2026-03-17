export function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

export function buildXlsxXml(
  headers: string[],
  rows: (string | number | boolean)[][],
): string {
  const escapeXml = (val: unknown) =>
    String(val)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const headerCells = headers
    .map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join("");

  const dataRows = rows
    .map((row) => {
      const cells = row
        .map((val) => {
          const type = typeof val === "number" ? "Number" : "String";
          return `<Cell><Data ss:Type="${type}">${escapeXml(val)}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Sheet1">
    <Table>
      <Row>${headerCells}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
}

export function buildExportResponse(
  records: Record<string, unknown>[],
  format: string,
  filenamePrefix: string,
): Response {
  const date = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return new Response(JSON.stringify(records, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenamePrefix}-${date}.json"`,
      },
    });
  }

  if (format === "xlsx") {
    const headers = Object.keys(records[0] ?? {});
    const rows = records.map((r) => Object.values(r) as (string | number | boolean)[]);
    const xml = buildXlsxXml(headers, rows);
    return new Response(xml, {
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition": `attachment; filename="${filenamePrefix}-${date}.xls"`,
      },
    });
  }

  // Default: CSV
  const headers = Object.keys(records[0] ?? {});
  const csvRows = records.map((r) =>
    Object.values(r)
      .map((v) => escapeCSV(String(v ?? "")))
      .join(","),
  );
  const csv = [headers.join(","), ...csvRows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenamePrefix}-${date}.csv"`,
    },
  });
}
