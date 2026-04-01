import { PrismaClient } from "@prisma/client";
import { createAuditExtension } from "./audit";

function createExtendedClient() {
  const base = new PrismaClient();
  return base.$extends(createAuditExtension(base));
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createExtendedClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createExtendedClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
