import { PrismaClient, Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";

// ─── Configuration ──────────────────────────────────────────────

interface AuditModelConfig {
  entityType: string;
  nameField: string;
  statusField?: string;
}

const AUDITED_MODELS: Record<string, AuditModelConfig> = {
  Project:         { entityType: "Project",         nameField: "name",          statusField: "status" },
  Client:          { entityType: "Client",          nameField: "name" },
  Milestone:       { entityType: "Milestone",       nameField: "name",          statusField: "status" },
  Invoice:         { entityType: "Invoice",         nameField: "invoiceNumber", statusField: "status" },
  DeliveryNote:    { entityType: "DeliveryNote",    nameField: "description",   statusField: "status" },
  Payment:         { entityType: "Payment",         nameField: "reference" },
  Country:         { entityType: "Country",         nameField: "name" },
  ProjectManager:  { entityType: "ProjectManager",  nameField: "name" },
  Contact:         { entityType: "Contact",         nameField: "name" },
  Note:            { entityType: "Note",            nameField: "entityType" },
  CompanySettings: { entityType: "CompanySettings", nameField: "companyName" },
};

const EXCLUDED_DIFF_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "photoUrl",
  "logoUrl",
]);

// ─── Helpers ────────────────────────────────────────────────────

function getDelegate(client: PrismaClient, model: string) {
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  return (client as unknown as Record<string, unknown>)[key] as {
    findUnique: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown> | null>;
    findMany: (args: { where: Record<string, unknown> }) => Promise<Record<string, unknown>[]>;
  };
}

function isScalar(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return true;
  if (value instanceof Date) return true;
  if (typeof value === "object" && typeof (value as Record<string, unknown>).toFixed === "function") return true; // Decimal
  return false;
}

function serializeRecord(record: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (EXCLUDED_DIFF_FIELDS.has(key)) continue;
    if (!isScalar(value)) continue;
    result[key] = value;
  }
  return result;
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && typeof (value as Record<string, unknown>).toFixed === "function") return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): { before: Record<string, unknown>; after: Record<string, unknown> } | null {
  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const bVal = stringify(before[key]);
    const aVal = stringify(after[key]);
    if (bVal !== aVal) {
      changedBefore[key] = before[key];
      changedAfter[key] = after[key];
    }
  }

  if (Object.keys(changedBefore).length === 0) return null;
  return { before: changedBefore, after: changedAfter };
}

function writeAudit(
  basePrisma: PrismaClient,
  params: {
    action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE";
    entityType: string;
    entityId: string;
    entityName: string;
    changes?: { before: Record<string, unknown>; after: Record<string, unknown> } | null;
  },
): void {
  basePrisma.auditLog
    .create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: String(params.entityName || params.entityId),
        performedBy: "System",
        changes: (params.changes as Prisma.InputJsonValue) ?? undefined,
      },
    })
    .catch((error) => {
      logger.error("Failed to write audit log", {
        error: error instanceof Error ? error.message : String(error),
        entityType: params.entityType,
        entityId: params.entityId,
      });
    });
}

// ─── Extension Factory ──────────────────────────────────────────

export function createAuditExtension(basePrisma: PrismaClient) {
  return Prisma.defineExtension({
    name: "audit-log",
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const config = AUDITED_MODELS[model];
          if (!config) return query(args);

          const result = await query(args);
          const record = result as Record<string, unknown>;

          writeAudit(basePrisma, {
            action: "CREATE",
            entityType: config.entityType,
            entityId: String(record.id),
            entityName: String(record[config.nameField] ?? record.id),
          });

          return result;
        },

        async update({ model, args, query }) {
          const config = AUDITED_MODELS[model];
          if (!config) return query(args);

          const delegate = getDelegate(basePrisma, model);
          const before = await delegate.findUnique({ where: args.where as Record<string, unknown> });
          if (!before) return query(args);

          const result = await query(args);
          const after = result as Record<string, unknown>;

          const serializedBefore = serializeRecord(before);
          const serializedAfter = serializeRecord(after);
          const changes = diffFields(serializedBefore, serializedAfter);

          if (changes) {
            const isStatusChange =
              config.statusField &&
              changes.before[config.statusField] !== undefined;

            writeAudit(basePrisma, {
              action: isStatusChange ? "STATUS_CHANGE" : "UPDATE",
              entityType: config.entityType,
              entityId: String(after.id),
              entityName: String(after[config.nameField] ?? after.id),
              changes,
            });
          }

          return result;
        },

        async delete({ model, args, query }) {
          const config = AUDITED_MODELS[model];
          if (!config) return query(args);

          const delegate = getDelegate(basePrisma, model);
          const before = await delegate.findUnique({ where: args.where as Record<string, unknown> });

          const result = await query(args);

          if (before) {
            writeAudit(basePrisma, {
              action: "DELETE",
              entityType: config.entityType,
              entityId: String(before.id),
              entityName: String(before[config.nameField] ?? before.id),
            });
          }

          return result;
        },

        async updateMany({ model, args, query }) {
          const config = AUDITED_MODELS[model];
          if (!config) return query(args);

          const delegate = getDelegate(basePrisma, model);
          const beforeRecords = await delegate.findMany({ where: (args.where ?? {}) as Record<string, unknown> });

          const result = await query(args);

          const data = ((args as Record<string, unknown>).data ?? {}) as Record<string, unknown>;

          for (const before of beforeRecords) {
            const afterState = { ...before, ...data };
            const serializedBefore = serializeRecord(before);
            const serializedAfter = serializeRecord(afterState);
            const changes = diffFields(serializedBefore, serializedAfter);

            if (changes) {
              const isStatusChange =
                config.statusField &&
                changes.before[config.statusField] !== undefined;

              writeAudit(basePrisma, {
                action: isStatusChange ? "STATUS_CHANGE" : "UPDATE",
                entityType: config.entityType,
                entityId: String(before.id),
                entityName: String(afterState[config.nameField] ?? before.id),
                changes,
              });
            }
          }

          return result;
        },

        async upsert({ model, args, query }) {
          const config = AUDITED_MODELS[model];
          if (!config) return query(args);

          const delegate = getDelegate(basePrisma, model);
          const before = await delegate.findUnique({ where: args.where as Record<string, unknown> });

          const result = await query(args);
          const record = result as Record<string, unknown>;

          if (before) {
            const serializedBefore = serializeRecord(before);
            const serializedAfter = serializeRecord(record);
            const changes = diffFields(serializedBefore, serializedAfter);

            if (changes) {
              const isStatusChange =
                config.statusField &&
                changes.before[config.statusField] !== undefined;

              writeAudit(basePrisma, {
                action: isStatusChange ? "STATUS_CHANGE" : "UPDATE",
                entityType: config.entityType,
                entityId: String(record.id),
                entityName: String(record[config.nameField] ?? record.id),
                changes,
              });
            }
          } else {
            writeAudit(basePrisma, {
              action: "CREATE",
              entityType: config.entityType,
              entityId: String(record.id),
              entityName: String(record[config.nameField] ?? record.id),
            });
          }

          return result;
        },
      },
    },
  });
}
