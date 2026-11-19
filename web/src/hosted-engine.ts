/**
 * Cloudflare's static build uses the Python-generated account snapshot.
 * Filtering and scenarios run in a browser worker, keeping the interface
 * responsive and independent of a live development machine.
 * This exact search is checked against the Python/DuckDB reference before deploy.
 */
import {
  Account,
  BASE_PARAMETERS,
  DEFAULT_FILTERS,
  Filters,
  GroupResult,
  Meta,
  Parameters,
  Preview,
} from "./types";

import { canUseEstimatedSales, scenarioPrice, validOverrides } from "./scenario-pricing";

export type Snapshot = {
  accounts: Account[];
  meta: Meta;
  baseline: GroupResult;
  query_buyers: { id: string; label: string; phrase: string }[];
};
export function selectAccounts(accounts: Account[], partial: Partial<Filters>) {
  const f = { ...DEFAULT_FILTERS, ...partial };
  const rows = accounts.filter((a) => {
    const text = [a.ref_id, a.description, a.industry, a.vertical_label]
      .join(" ")
      .toLowerCase();
    if (f.search && !text.includes(f.search.toLowerCase())) return false;
    if (f.tier && a.tier !== f.tier) return false;
    if (f.country && a.country !== f.country) return false;
    if (f.vertical && a.vertical !== f.vertical) return false;
    if (f.role && a.product_role !== f.role) return false;
    if (f.earnings && a.earnings_status !== f.earnings) return false;
    if (
      f.ownership === "Independent" &&
      !a.ownership_status.startsWith("Independent")
    )
      return false;
    if (
      f.ownership &&
      f.ownership !== "Independent" &&
      a.ownership_status !== f.ownership
    )
      return false;
    if (f.evidence && !a.evidence_tags.includes(f.evidence)) return false;
    if (f.under !== null && (a[f.metric] === null || a[f.metric]! >= f.under))
      return false;
    return true;
  });
  return rows.sort((a, b) => {
    const x = a[f.sort],
      y = b[f.sort];
    if (x === null || y === null)
      return x === y ? a.ref_id.localeCompare(b.ref_id) : x === null ? 1 : -1;
    const order = x < y ? -1 : x > y ? 1 : 0;
    return (f.descending ? -order : order) || a.ref_id.localeCompare(b.ref_id);
  });
}
type Candidate = { account: Account; cost: number; revenue: number; costSquared: bigint };
type Trio = { ids: string[]; revenue: number; cost: number; balanceRank: number | bigint };

function compareTotals(a: Omit<Trio, "ids">, b: Omit<Trio, "ids">) {
  // The group prices are equal when the largest share breaks the tie.
  return b.revenue - a.revenue || a.cost - b.cost ||
    (a.balanceRank < b.balanceRank ? -1 : a.balanceRank > b.balanceRank ? 1 : 0);
}
function rank(a: Trio, b: Trio) {
  return (
    compareTotals(a, b) ||
    a.ids.join("|").localeCompare(b.ids.join("|"))
  );
}
export function optimizeHosted(
  accounts: Account[],
  parameters: Parameters,
): GroupResult {
  const start = performance.now();
  const { budget_cents: cap, explicit_only, core_only } = parameters;
  if (!Number.isSafeInteger(cap) || cap <= 0 || cap > 100000000000)
    throw new Error("Budget must be between $0.01 and $1 billion.");
  if (parameters.multiples_hundredths !== undefined && !validOverrides(parameters.multiples_hundredths))
    throw new Error("Enter multiples from 0.01× to 100× with up to two decimal places.");
  const allShares = parameters.balance_method === "all_shares";
  const pool: Candidate[] = accounts
    .filter(
      (a) =>
        (a.grouping_status === "Eligible" || canUseEstimatedSales(a, parameters)) &&
        (!explicit_only || a.currency_basis === "Explicit") &&
        (!core_only || a.product_role === "Core workflow"),
    )
    .flatMap((account) => {
      const cost = scenarioPrice(account, parameters).valuation_cents;
      if (cost >= cap) return [];
      return [{
        account,
        revenue: account.revenue_cents ?? account.valuation_revenue_cents,
        cost,
        costSquared: allShares ? BigInt(cost) ** 2n : 0n,
      }];
    })
    .sort(
      (a, b) =>
        a.cost - b.cost || a.account.ref_id.localeCompare(b.account.ref_id),
    );
  const best: Trio[] = [];
  let qualifyingCount = 0,
    bestTieCount = 0;
  // Cost ordering permits exact pruning. Every later member costs at least as
  // much as the current member, so these breaks cannot discard a feasible trio.
  for (let i = 0; i < pool.length - 2; i++) {
    const a = pool[i];
    if (a.cost * 3 >= cap) break;
    for (let j = i + 1; j < pool.length - 1; j++) {
      const b = pool[j],
        pairCost = a.cost + b.cost;
      if (pairCost + b.cost >= cap) break;
      if (a.account.vertical === b.account.vertical) continue;
      for (let k = j + 1; k < pool.length; k++) {
        const c = pool[k],
          cost = pairCost + c.cost;
        if (cost >= cap) break;
        if (
          a.account.vertical === c.account.vertical ||
          b.account.vertical === c.account.vertical
        )
          continue;
        const revenue = a.revenue + b.revenue + c.revenue;
        // Count even the ties that will fall outside the ten displayed rows.
        qualifyingCount++;
        const worst = best[9];
        if (worst && (revenue < worst.revenue || (revenue === worst.revenue && cost > worst.cost)))
          continue;
        const balanceRank = allShares ? a.costSquared + b.costSquared + c.costSquared : c.cost;
        const totals = { revenue, cost, balanceRank };
        const first = best[0];
        const comparison = first ? compareTotals(totals, first) : -1;
        if (comparison < 0) bestTieCount = 1;
        else if (comparison === 0) bestTieCount++;
        if (worst && compareTotals(totals, worst) > 0) continue;
        const candidate = {
          ...totals,
          ids: [a.account.ref_id, b.account.ref_id, c.account.ref_id].sort(),
        };
        if (!worst || rank(candidate, worst) < 0) {
          best.push(candidate);
          best.sort(rank);
          if (best.length > 10) best.pop();
        }
      }
    }
  }
  const byId = new Map(accounts.map((a) => [a.ref_id, a]));
  return {
    groups: best.map((g, i) => ({
      rank: i + 1,
      ids: g.ids,
      revenue_cents: g.revenue,
      valuation_cents: g.cost,
      headroom_cents: cap - g.cost,
      members: g.ids.map((id) => {
        const a = byId.get(id)!;
        return {
          id,
          vertical: a.vertical_label,
          tier: a.tier,
          revenue_cents: a.revenue_cents ?? a.valuation_revenue_cents,
          ...(canUseEstimatedSales(a, parameters) ? { estimated_revenue: true } : {}),
          revenue_high_cents: a.revenue_high_cents!,
          ...scenarioPrice(a, parameters),
          flags: a.evidence_tags,
        };
      }),
    })),
    qualifying_count: qualifyingCount,
    best_tie_count: bestTieCount,
    pool_size: pool.length,
    ...(parameters.include_estimated ? {
      estimated_pool_size: pool.filter(({ account }) => canUseEstimatedSales(account, parameters)).length,
    } : {}),
    elapsed_ms: Math.round(performance.now() - start),
    parameters,
  };
}
export function compareScenario(snapshot: Snapshot, parameters: Parameters) {
  const result = optimizeHosted(snapshot.accounts, parameters);
  const original = snapshot.baseline.groups[0];
  if (!original) return result;
  const members = original.ids.map(
    (id) => snapshot.accounts.find((a) => a.ref_id === id)!,
  );
  const cost = members.reduce(
    (sum, a) =>
      sum + scenarioPrice(a, parameters).valuation_cents,
    0,
  );
  const excluded = members.some(
    (a) =>
      (parameters.explicit_only && a.currency_basis !== "Explicit") ||
      (parameters.core_only && a.product_role !== "Core workflow"),
  );
  const winner = result.groups[0];
  const reason = excluded
    ? "The original winner fails the scenario's eligibility filters."
    : cost >= parameters.budget_cents
      ? "The original winner reaches or exceeds the revised budget."
      : winner?.ids.join() === original.ids.join()
        ? "The original winner remains optimal under these assumptions."
        : winner && winner.revenue_cents > original.revenue_cents
          ? "Another trio ranks higher on annual sales under these assumptions."
          : "Ties use lower total price, then the selected purchase-balance rule, then company IDs.";
  return {
    ...result,
    comparison: {
      reason,
      original_cost_cents: cost,
      original_eligible: !excluded && cost < parameters.budget_cents,
      entered: (winner?.ids || []).filter((id) => !original.ids.includes(id)),
      left: original.ids.filter((id) => !winner?.ids.includes(id)),
      revenue_delta_cents: winner
        ? winner.revenue_cents - original.revenue_cents
        : null,
    },
  };
}
export function interpretHosted(
  query: string,
  buyers: Snapshot["query_buyers"],
): Preview {
  let text = query.toLowerCase().trim().replaceAll("–", "-");
  const filters: Partial<Filters> = {},
    chips: string[] = [],
    issues: string[] = [];
  function consume(pattern: RegExp) {
    const match = text.match(pattern);
    if (match)
      text =
        text.slice(0, match.index) +
        " ".repeat(match[0].length) +
        text.slice(match.index! + match[0].length);
    return match;
  }
  const tier = consume(/\btier\s+([ab])\b/);
  if (tier) {
    filters.tier = tier[1].toUpperCase() as "A" | "B";
    chips.push("Tier " + filters.tier);
  }
  const countries: Record<string, string> = {
    Canada: "canada|canadian",
    "United States": "united states|american|usa",
    "United Kingdom": "united kingdom|british|uk",
    Germany: "germany|german",
    Ireland: "ireland|irish",
    Australia: "australia|australian",
    Mexico: "mexico|mexican",
    India: "india|indian",
  };
  for (const [label, pattern] of Object.entries(countries))
    if (consume(new RegExp("\\b(?:" + pattern + ")\\b"))) {
      if (filters.country) issues.push("Choose one country.");
      filters.country = label;
      chips.push(label);
    }
  const aliases: Record<string, string> = {
    dental: "dental",
    veterinary: "veterinary",
    marina: "marinas",
    aviation: "aviation",
    jail: "jails",
    court: "courts",
    hvac: "hvac",
    school: "schools",
    funeral: "funeral",
  };
  const escape = (s: string) => s.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
  for (const buyer of buyers) {
    const patterns = [escape(buyer.label.toLowerCase()), escape(buyer.phrase)];
    for (const [alias, id] of Object.entries(aliases))
      if (id === buyer.id) patterns.push("\\b" + alias + "s?\\b");
    if (consume(new RegExp(patterns.join("|")))) {
      if (filters.vertical) issues.push("Choose one customer vertical.");
      filters.vertical = buyer.id;
      chips.push(buyer.label);
    }
  }
  for (const [role, pattern] of [
    ["Core workflow", /\bcore(?: workflow| software| products)?\b/],
    ["Vertical add-on", /\b(?:vertical )?add-ons?\b/],
    ["Services / hardware", /\bservices\b/],
    ["Horizontal software", /\bhorizontal(?: software)?\b/],
  ] as const) {
    if (consume(pattern)) {
      if (filters.role) issues.push("Choose one product role.");
      filters.role = role;
      chips.push(role);
    }
  }
  if (consume(/\bcurrency assumed\b/)) {
    filters.evidence = "Currency assumed";
    chips.push("Currency assumed");
  }
  if (consume(/\bpeer estimates?\b/)) {
    filters.evidence = "Peer estimate";
    chips.push("Peer estimate");
  }
  if (consume(/\bindependent\b/)) {
    filters.ownership = "Independent";
    chips.push("Independent ownership");
  }
  if (consume(/\bcash.flow positive\b/)) {
    filters.earnings = "Cash-flow positive";
    chips.push("Cash-flow positive");
  }
  const order = consume(
    /\b(highest|lowest)\s+(revenue|valuation)(?:\s+first)?\b/,
  );
  if (order) {
    filters.sort = (order[2] + "_cents") as Filters["sort"];
    filters.descending = order[1] === "highest";
    chips.push(
      order[1][0].toUpperCase() + order[1].slice(1) + " " + order[2] + " first",
    );
  }
  const amount = consume(
    /(?:(revenue|valuation)\s+)?(?:under|below|less than)\s*\$?\s*(\d+(?:\.\d+)?)\s*(million|m|k)?\b/,
  );
  if (amount) {
    if (!amount[1])
      issues.push("Choose Revenue or Valuation for the monetary threshold.");
    else {
      filters.metric = (amount[1] + "_cents") as Filters["metric"];
      filters.under = Math.round(
        Number(amount[2]) *
          100 *
          (["m", "million"].includes(amount[3])
            ? 1000000
            : amount[3] === "k"
              ? 1000
              : 1),
      );
      chips.push(
        amount[1][0].toUpperCase() +
          amount[1].slice(1) +
          " < USD " +
          amount[2] +
          (amount[3] || ""),
      );
    }
  }
  text = text.replace(
    /\b(show|me|all|accounts?|companies|in|with|and|the|please|software|by|sorted|sort|usd|ownership)\b/g,
    " ",
  );
  const remainder = text.replace(/[\s,.]+/g, " ").trim();
  if (remainder) issues.push("Unsupported text: " + remainder);
  if (!Object.keys(filters).length)
    issues.push("Try a tier, country, customer vertical, or monetary filter.");
  return {
    filters: { ...DEFAULT_FILTERS, ...filters },
    chips,
    issues,
    applicable: !!Object.keys(filters).length && !issues.length,
  };
}
export function hostedRoute(snapshot: Snapshot, path: string, body: unknown) {
  if (path === "summary") return snapshot.meta;
  if (path === "groups") return snapshot.baseline;
  if (path.startsWith("accounts/")) {
    const account = snapshot.accounts.find(
      (a) => a.ref_id === decodeURIComponent(path.slice(9)),
    );
    if (!account) throw new Error("Account does not exist.");
    return account;
  }
  if (path === "accounts") {
    const query = body as {
      filters: Partial<Filters>;
      page: number;
      page_size: number;
      ids?: string[] | null;
    };
    let rows = selectAccounts(snapshot.accounts, query.filters || {});
    if (query.ids) rows = rows.filter((a) => query.ids!.includes(a.ref_id));
    const offset = ((query.page || 1) - 1) * (query.page_size || 25);
    return {
      total: rows.length,
      matching_ids: rows.map((a) => a.ref_id),
      accounts: rows.slice(offset, offset + (query.page_size || 25)),
    };
  }
  if (path === "query")
    return interpretHosted(
      (body as { text: string }).text,
      snapshot.query_buyers,
    );
  if (path === "scenarios")
    return compareScenario(snapshot, {
      ...BASE_PARAMETERS,
      ...(body as Partial<Parameters>),
    });
  throw new Error("Unknown analysis operation.");
}
