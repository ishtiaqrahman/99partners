// Work in cents, the same unit as the cleaned dataset. Missing sales never qualify.
const labels = { gt: "over", gte: "at least", eq: "exactly" } as const;
export type RevenueRule = { comparison: keyof typeof labels; amount_usd: number };

export function validRule(value: unknown): value is RevenueRule {
  if (!value || typeof value !== "object") return false;
  const { comparison, amount_usd } = value as RevenueRule;
  return Object.hasOwn(labels, comparison) && typeof amount_usd === "number" &&
    amount_usd >= 0 && Number.isSafeInteger(Math.round(amount_usd * 100)) &&
    Math.abs(amount_usd * 100 - Math.round(amount_usd * 100)) < 0.00001;
}

export function matchesRevenue(cents: number | null, rule: RevenueRule) {
  if (cents === null) return false;
  const threshold = Math.round(rule.amount_usd * 100);
  if (rule.comparison === "gt") return cents > threshold;
  if (rule.comparison === "gte") return cents >= threshold;
  return cents === threshold;
}

// Match only a complete, unqualified dataset question. Countries, tiers, and
// follow-ups go to the planner so their additional conditions stay in the count.
export function simpleRevenueRule(question: string): RevenueRule | null {
  const words = question.trim().toLowerCase().replace(/[?.!]+$/, "").trim();
  const prefix = /^how many companies (?:are there |are |have |had |report |reported |with )?/;
  if (!prefix.test(words)) return null;
  const comparison = "(over|more than|greater than|at least|exactly|equal to)";
  const amount = "(?:us\\$|usd\\s*|\\$)?(\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?|\\d+(?:\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)\\s*(million|thousand|billion|m|k|b)?(?: (?:us )?dollars| usd)?";
  const field = "(?:annual |reported )?(?:revenue|sales)";
  const rest = words.replace(prefix, "").replace(/^with /, "");
  const match = rest.match(new RegExp("^" + comparison + " " + amount + " (?:in |of )?" + field + "$"))
    ?? rest.match(new RegExp("^" + field + " (?:of )?" + comparison + " " + amount + "$"));
  if (!match) return null;
  const [, operator, number, unit] = match;
  const names = ["one","two","three","four","five","six","seven","eight","nine","ten"];
  const scales: Record<string, number> = { million: 1e6, m: 1e6, thousand: 1e3, k: 1e3, billion: 1e9, b: 1e9 };
  const rule: RevenueRule = {
    comparison: operator === "at least" ? "gte" : ["exactly", "equal to"].includes(operator) ? "eq" : "gt",
    amount_usd: (names.includes(number) ? names.indexOf(number) + 1 : Number(number.replaceAll(",", ""))) * (scales[unit] ?? 1),
  };
  return validRule(rule) ? rule : null;
}

export function revenueCountAnswer(accounts: { revenue_cents: number | null }[], rule: RevenueRule) {
  const count = accounts.filter(a => matchesRevenue(a.revenue_cents, rule)).length;
  const amount = "US$" + rule.amount_usd.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const answer = "**" + count + (count === 1 ? " company has" : " companies have") + " reported annual revenue " + labels[rule.comparison] + " " + amount + ".**";
  if (rule.comparison === "eq") return answer;
  const equal = accounts.filter(a => matchesRevenue(a.revenue_cents, { ...rule, comparison: "eq" })).length;
  return answer + " This " + (rule.comparison === "gt" ? "excludes " : "includes ") + equal +
    (equal === 1 ? " company" : " companies") + " at exactly " + amount + ".";
}
