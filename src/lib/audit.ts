import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { AuditAction, Prisma } from "@prisma/client";

interface AuditLogParams {
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName: string;
  performedBy?: string;
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> } | null;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName,
        performedBy: params.performedBy ?? "System",
        changes: (params.changes as Prisma.InputJsonValue) ?? undefined,
        metadata: (params.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
  } catch (error) {
    logger.error("Failed to write audit log", {
      error: error instanceof Error ? error.message : String(error),
      params: { action: params.action, entityType: params.entityType, entityId: params.entityId },
    });
  }
}

/**
 * Compares two records and returns only the fields that differ.
 * Returns null if nothing changed.
 */
export function diffFields(
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

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
