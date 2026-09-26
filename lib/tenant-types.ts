/**
 * Who a listing is suitable for (e.g. a flat for a family, a sublet for a
 * male tenant). Sellers can pick up to MAX_TENANT_TYPES of these.
 */
export const TENANT_TYPES = ["male", "female", "family"] as const;

export type TenantType = (typeof TENANT_TYPES)[number];

export const MAX_TENANT_TYPES = 2;

export function isTenantType(value: unknown): value is TenantType {
  return typeof value === "string" && (TENANT_TYPES as readonly string[]).includes(value);
}

/** Drops unknown values and duplicates, keeps the original order, caps at MAX_TENANT_TYPES. */
export function normalizeTenantTypes(value: unknown): TenantType[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.filter(isTenantType))).slice(0, MAX_TENANT_TYPES);
}
