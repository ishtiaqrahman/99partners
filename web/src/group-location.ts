import type { Parameters } from "./types";
import { multipleKey, PRODUCT_ROLES, validOverrides } from "./scenario-pricing";

export function groupLink(settings: Parameters | null, rank = 1) {
  const query = new URLSearchParams({ view: "groups" });
  if (settings) {
    query.set("budget", String(settings.budget_cents));
    if (Object.keys(settings.multiples_hundredths ?? {}).length)
      query.set("multiples", multipleKey(settings.multiples_hundredths));
    if (settings.include_estimated) query.set("estimates", "1");
    if (settings.balance_method === "all_shares") query.set("balance", "all_shares");
    if (settings.uniform) query.set("uniform", "1");
    if (settings.core_only) query.set("core", "1");
    if (settings.explicit_only) query.set("currency", "1");
  }
  if (rank > 1) query.set("rank", String(rank));
  return "#" + query.toString();
}

export function readGroupLocation(query: URLSearchParams) {
  const cap = Number(query.get("budget"));
  const encoded = query.get("multiples");
  const parts = encoded?.split(",") ?? [];
  const overrides = Object.fromEntries(PRODUCT_ROLES.flatMap((role, index) =>
    parts[index] ? [[role, Number(parts[index])]] : [],
  ));
  const valid = !encoded || (parts.length === PRODUCT_ROLES.length && validOverrides(overrides));
  const settings =
    valid && Number.isSafeInteger(cap) && cap > 0 && cap <= 100000000000
      ? {
          budget_cents: cap,
          ...(encoded ? { multiples_hundredths: overrides } : {}),
          ...(query.get("estimates") === "1" ? { include_estimated: true } : {}),
          ...(query.get("balance") === "all_shares" ? { balance_method: "all_shares" as const } : {}),
          uniform: query.get("uniform") === "1",
          core_only: query.get("core") === "1",
          explicit_only: query.get("currency") === "1",
        }
      : null;
  const rank = Number(query.get("rank"));
  return {
    settings,
    rank: Number.isInteger(rank) && rank >= 1 && rank <= 10 ? rank : 1,
  };
}
