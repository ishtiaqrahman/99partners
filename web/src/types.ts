import type { MultipleOverrides } from "./scenario-pricing";
/** Money is integer USD cents across the API; formatting happens at the edge. */
export type Account = {
  ref_id: string;
  description: string;
  industry: string;
  hq_location: string;
  revenue: string;
  profitability: string;
  ownership_funding: string;
  year_founded: string;
  employees: string;
  founder_age: string;
  source_row: number;
  tier: "A" | "B";
  tier_reason: string;
  tier_reasons: string[];
  vertical: string | null;
  vertical_label: string;
  buyer_evidence: string;
  product_role: string;
  product_evidence: string;
  country: string;
  founding_year: number | null;
  employees_low: number | null;
  employees_high: number | null;
  revenue_cents: number | null;
  revenue_low_cents: number | null;
  revenue_high_cents: number | null;
  currency: string | null;
  currency_basis: string;
  scale_basis: string | null;
  fx_rate: string | null;
  valuation_cents: number;
  valuation_revenue_cents: number;
  multiple: number;
  valuation_basis: string;
  peer_count: number;
  ownership_status: string;
  earnings_status: string;
  grouping_status: string;
  evidence_tags: string[];
  diligence_question: string;
};
export type Filters = {
  search: string;
  tier: "" | "A" | "B";
  country: string;
  vertical: string;
  role: string;
  ownership: string;
  earnings: string;
  evidence: string;
  metric: "revenue_cents" | "valuation_cents";
  under: number | null;
  sort:
    | "ref_id"
    | "revenue_cents"
    | "valuation_cents"
    | "vertical_label"
    | "tier";
  descending: boolean;
};
export const DEFAULT_FILTERS: Filters = {
  search: "",
  tier: "",
  country: "",
  vertical: "",
  role: "",
  ownership: "",
  earnings: "",
  evidence: "",
  metric: "valuation_cents",
  under: null,
  sort: "ref_id",
  descending: false,
};
export type Meta = {
  runtime?: string;
  run_id: string;
  input_name: string;
  input_sha256: string;
  total: number;
  tiers: Record<string, number>;
  roles: Record<string, number>;
  eligibility: Record<string, number>;
  eligible_by_tier: Record<string, number>;
  missing_by_exclusion: Record<string, number>;
  search_pool: number;
  missing_revenue: number;
  unparsed_revenue: number;
  assumed_currency: number;
  verticals: number;
  fx: Record<string, string>;
  multiples: Record<string, number>;
  tier_gates: string[];
  assumptions: string[];
  files: string[];
  countries: string[];
  ownership: string[];
  earnings: string[];
  evidence: string[];
  buyers: { id: string; label: string }[];
};
export type Group = {
  rank: number;
  ids: string[];
  revenue_cents: number;
  valuation_cents: number;
  headroom_cents: number;
  members: {
    id: string;
    vertical: string;
    tier: string;
    revenue_cents: number;
    valuation_cents: number;
    multiple: number;
    revenue_high_cents?: number;
    flags: string[];
  }[];
};
export type Parameters = {
  multiples_hundredths?: MultipleOverrides;
  budget_cents: number;
  uniform: boolean;
  explicit_only: boolean;
  core_only: boolean;
};
export type GroupResult = {
  groups: Group[];
  qualifying_count: number;
  best_tie_count: number;
  pool_size: number;
  elapsed_ms: number;
  parameters: Parameters;
  comparison?: {
    reason: string;
    original_cost_cents: number;
    original_eligible: boolean;
    entered: string[];
    left: string[];
    revenue_delta_cents: number | null;
  } | null;
};
export const BASE_PARAMETERS: Parameters = {
  budget_cents: 3000000000,
  uniform: false,
  explicit_only: false,
  core_only: false,
};
export type Preview = {
  filters: Filters;
  chips: string[];
  issues: string[];
  applicable: boolean;
};

export async function api<T>(path: string, body?: unknown): Promise<T> {
  if (import.meta.env.VITE_CLOUDFLARE_STATIC === "1") {
    const { hostedRequest } = await import("./hosted-api");
    return hostedRequest<T>(path, body);
  }
  const response = await fetch(
    "/api/" + path,
    body === undefined
      ? undefined
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  if (!response.ok) {
    const details = await response.json().catch(() => null);
    throw new Error(
      typeof details?.detail === "string"
        ? details.detail
        : "The request could not be completed. Check the inputs and try again.",
    );
  }
  return response.json();
}
export const money = (value: number | null | undefined, exact = false) => {
  if (value == null) return "—";
  if (exact)
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value / 100);
  const dollars = value / 100;
  if (Math.abs(dollars) >= 1000000)
    return (
      "$" +
      (dollars / 1000000).toLocaleString("en-US", {
        maximumFractionDigits: 3,
      }) +
      "M"
    );
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars);
};

/** Only identifiers and settings cross into chat. The server computes the answer from the submission. */
export type GroupScreen = {
  applied: Parameters;
  rank: number;
  pending: Parameters | null;
};
export type ChatScreen = {
  page: string;
  account: string | null;
  step?: string;
  group?: GroupScreen | null;
};
export function customerIndustry(a: Account) {
  if (a.vertical) return a.vertical_label;
  return a.product_role === "Horizontal software"
    ? "Serves several industries"
    : "Customer industry unknown";
}
