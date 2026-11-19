import assert from "node:assert/strict";
import test from "node:test";
import { matchesRevenue, simpleRevenueRule, revenueCountAnswer } from "../src/revenue.ts";

for (const [phrase, comparison, expected] of [
  ["over two million dollars", "gt", 1],
  ["at least $2M", "gte", 2],
  ["exactly US$2,000,000", "eq", 1],
]) {
  test(phrase, () => {
    const rule = simpleRevenueRule("How many companies with " + phrase + " in revenue?");
    assert.deepEqual(rule, { comparison, amount_usd: 2e6 });
    const rows = [null, 199999999, 200000000, 200000001];
    assert.equal(rows.filter(cents => matchesRevenue(cents, rule)).length, expected);
    assert.match(revenueCountAnswer(rows.map(revenue_cents => ({ revenue_cents })), rule), new RegExp("^\\*\\*" + expected + " compan"));
  });
}
test("preserve extra conditions for the full planner", () => {
  assert.equal(simpleRevenueRule("How many companies with over $2M in revenue in Canada?"), null);
});
