import type { Account, Parameters } from "./types";

export const PRODUCT_ROLES = [
  "Core workflow",
  "Vertical add-on",
  "Horizontal software",
  "Services / hardware",
  "Unresolved",
] as const;

export type ProductRole = (typeof PRODUCT_ROLES)[number];
// Store hundredths of a multiple as integers: 250 means 2.50×.
export type MultipleOverrides = Partial<Record<ProductRole, number>>;

export function validOverrides(value: unknown): value is MultipleOverrides {
  return !!value && typeof value === "object" && !Array.isArray(value) &&
    Object.entries(value).every(([role, scale]) =>
      PRODUCT_ROLES.some((knownRole) => knownRole === role) &&
      Number.isInteger(scale) && scale >= 1 && scale <= 10000,
    );
}

export function canUseEstimatedSales(account: Account, settings: Parameters) {
  // Eligibility uses the first failed check. This status already passed the
  // customer-industry and product checks, and only needs an estimate for sales.
  return !!settings.include_estimated && account.grouping_status === "Missing / invalid observed revenue";
}

export function scenarioScale(account: Account, settings: Parameters) {
  const override = settings.multiples_hundredths?.[account.product_role as ProductRole];
  return override ?? (settings.uniform && (account.grouping_status === "Eligible" || canUseEstimatedSales(account, settings)) ? 200 : account.multiple * 100);
}

// Round half a cent up, with the same rule as the DuckDB reference.
export function scaledPrice(revenueCents: number, scale: number) {
  return Math.floor((revenueCents * scale + 50) / 100);
}

export function scenarioPrice(account: Account, settings: Parameters) {
  const scale = scenarioScale(account, settings);
  return {
    multiple: scale / 100,
    valuation_cents: scale === account.multiple * 100 && !settings.uniform
      ? account.valuation_cents
      : scaledPrice(account.revenue_cents ?? account.valuation_revenue_cents, scale),
  };
}

export function multipleKey(overrides?: MultipleOverrides) {
  return PRODUCT_ROLES.map((role) => overrides?.[role] ?? "").join(",");
}
