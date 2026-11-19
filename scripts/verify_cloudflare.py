"""Verify the Cloudflare browser engine against the Python reference.

The deployment changes execution location, so these tests compare ranking,
currency filtering, and language interpretation across both implementations.
"""

import json
import random
import subprocess
import tempfile
from pathlib import Path

from workbench.pipeline import load_accounts, DEFAULT_INPUT, ROOT
from workbench.groups import optimize
from workbench.filters import interpret, filter_accounts, Filters
from workbench.policy import BUYERS

accounts = load_accounts(DEFAULT_INPUT)
queries = [
    "Tier A in Canada, valuation under $15M, highest revenue first",
    "Canadian companies under 10M",
    "Core software, highest revenue first",
    "Marinas, valuation under $10M",
    "independent",
    "Show companies with low churn",
    "cash-flow positive in Canada",
    "Tier B in India, revenue below $3M",
]
scenarios = []
for changes in [
    {},
    {"budget_cents": 2500000000},
    {"uniform": True},
    {"multiples_hundredths": {"Vertical add-on": 250, "Core workflow": 275}},
    {"explicit_only": True},
    {"core_only": True},
    {"budget_cents": 1},
    {"budget_cents": 100000000000},
]:
    parameters = (
        dict(
            budget_cents=3000000000, uniform=False, explicit_only=False, core_only=False
        )
        | changes
    )
    scenarios.append(
        dict(parameters=parameters, expected=optimize(accounts, **parameters))
    )
random_cases = []
for seed in range(12):
    rng = random.Random(seed)
    rows = []
    for i in range(22):
        revenue, cost = rng.randrange(1, 50), rng.randrange(1, 50)
        rows.append(
            dict(
                ref_id=f"{i:04}",
                vertical=str(rng.randrange(6)),
                vertical_label="fixture",
                tier="B",
                revenue_cents=revenue,
                valuation_cents=cost,
                multiple=2,
                currency_basis="Explicit",
                product_role="Core workflow",
                grouping_status="Eligible",
                evidence_tags=[],
            )
        )
    random_cases.append(dict(accounts=rows, expected=optimize(rows, 80)))
fixture = dict(
    accounts=accounts,
    scenarios=scenarios,
    random_cases=random_cases,
    buyers=[dict(id=b[0], label=b[1], phrase=b[2]) for b in BUYERS],
    queries=[dict(text=q, expected=interpret(q)) for q in queries],
    manual_ids=[
        a["ref_id"]
        for a in filter_accounts(accounts, Filters(tier="A", country="Canada"))
    ],
)
with tempfile.TemporaryDirectory(prefix="99-cloudflare-check-") as directory:
    directory = Path(directory)
    fixture_path = directory / "fixture.json"
    fixture_path.write_text(json.dumps(fixture))
    bundle = directory / "engine.mjs"
    subprocess.run(
        [
            str(ROOT / "web/node_modules/.bin/esbuild"),
            str(ROOT / "web/src/hosted-engine.ts"),
            "--bundle",
            "--platform=node",
            "--format=esm",
            "--outfile=" + str(bundle),
        ],
        check=True,
        cwd=ROOT,
    )
    verifier = directory / "verify.mjs"
    verifier.write_text("""
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {optimizeHosted,interpretHosted,selectAccounts} from './engine.mjs';
const data=JSON.parse(readFileSync(process.argv[2],'utf8'));
const key=result=>result.groups.map(g=>[g.ids,g.revenue_cents,g.valuation_cents,g.headroom_cents,g.members.map(m=>[m.multiple,m.valuation_cents])]);
for(const s of data.scenarios){
 const actual=optimizeHosted(data.accounts,s.parameters);
 assert.deepEqual(key(actual),key(s.expected));
 assert.equal(actual.qualifying_count,s.expected.qualifying_count);
 assert.equal(actual.best_tie_count,s.expected.best_tie_count);
 assert.equal(actual.pool_size,s.expected.pool_size);
 console.log('Scenario matched',JSON.stringify(s.parameters),actual.elapsed_ms+'ms');
}
for(const s of data.random_cases){
 const actual=optimizeHosted(s.accounts,{budget_cents:80,uniform:false,explicit_only:false,core_only:false});
 assert.deepEqual(key(actual),key(s.expected));
 assert.equal(actual.qualifying_count,s.expected.qualifying_count);
 assert.equal(actual.best_tie_count,s.expected.best_tie_count);
}
for(const q of data.queries)assert.deepEqual(interpretHosted(q.text,data.buyers),q.expected);
assert.deepEqual(selectAccounts(data.accounts,{tier:'A',country:'Canada'}).map(a=>a.ref_id),data.manual_ids);
console.log('Matched 8 full-data scenarios, 12 independent fixtures, 8 query interpretations, and account filters.');
""")
    subprocess.run(["node", str(verifier), str(fixture_path)], check=True)
