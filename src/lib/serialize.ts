import type { Decimal } from "@prisma/client/runtime/library";

export type Serialized<T> = T extends Date
  ? string
  : T extends Decimal
    ? number
    : T extends Array<infer U>
      ? Serialized<U>[]
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;

/**
 * Serializes a Prisma object for passing from Server Components to Client Components.
 * Converts Decimal to number and Date to ISO string.
 */
export function serializeForClient<T>(obj: T): Serialized<T> {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => {
      if (value !== null && typeof value === "object" && "toNumber" in value) {
        return Number(value);
      }
      return value;
    }),
  ) as Serialized<T>;
}
