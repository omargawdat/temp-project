/**
 * Serializes a Prisma object for passing from Server Components to Client Components.
 * Converts Decimal to number and Date to ISO string.
 */
export function serializeForClient<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (value !== null && typeof value === "object" && "toNumber" in value) {
        return Number(value);
      }
      return value;
    }),
  );
}
