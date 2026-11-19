import type { Parameters } from "./types";

export function groupLink(settings: Parameters | null, rank = 1) {
  const query = new URLSearchParams({ view: "groups" });
  if (settings) {
    query.set("budget", String(settings.budget_cents));
    if (settings.uniform) query.set("uniform", "1");
    if (settings.core_only) query.set("core", "1");
    if (settings.explicit_only) query.set("currency", "1");
  }
  if (rank > 1) query.set("rank", String(rank));
  return "#" + query.toString();
}

export function readGroupLocation(query: URLSearchParams) {
  const cap = Number(query.get("budget"));
  const settings =
    Number.isSafeInteger(cap) && cap > 0 && cap <= 100000000000
      ? {
          budget_cents: cap,
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
