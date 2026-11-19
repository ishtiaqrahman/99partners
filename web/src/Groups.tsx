/** Portfolio review compares the immutable official result with an explicit scenario. Controls are applied only when the analyst runs the calculation. */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Download,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import {
  api,
  BASE_PARAMETERS,
  Group,
  GroupResult,
  estimatedSales,
  money,
  Parameters,
  GroupScreen,
} from "./types";
import { groupLink, readGroupLocation } from "./group-location";
import { Badge, ErrorBox, Explanation, number, productLabels } from "./common";
import { multipleKey, PRODUCT_ROLES, scaledPrice, validOverrides } from "./scenario-pricing";

/** Scenarios are explicit requests; pending controls never relabel old results. */
export function Groups({
  eligibleCount,
  defaultMultiples,
  showDatasetExample,
  open,
  route,
  onScreen,
}: {
  eligibleCount: number;
  defaultMultiples: Record<string, number>;
  showDatasetExample: boolean;
  open: (id: string) => void;
  route: string;
  onScreen: (screen: GroupScreen | null) => void;
}) {
  const { settings, rank } = useMemo(
    () => readGroupLocation(new URLSearchParams(route)),
    [route],
  );
  const [baseline, setBaseline] = useState<GroupResult | null>(null);
  const [scenario, setScenario] = useState<GroupResult | null>(null);
  const [params, setParams] = useState<Parameters>(BASE_PARAMETERS);
  const [lookup, setLookup] = useState("");
  const [error, setError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(
    () => window.innerWidth > 760,
  );
  // A shareable URL describes the applied search. Editing a control only changes the draft.
  const settingsKey = settings ? JSON.stringify(settings) : "";
  useEffect(() => {
    let current = true;
    api<GroupResult>("groups")
      .then((r) => {
        if (current) setBaseline(r);
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, []);
  useEffect(() => {
    let current = true;
    const applied: Parameters | null = settingsKey
      ? JSON.parse(settingsKey)
      : null;
    setScenario(null);
    setError("");
    setParams(applied || baseline?.parameters || BASE_PARAMETERS);
    if (applied)
      api<GroupResult>("scenarios", applied)
        .then((r) => {
          if (current) setScenario(r);
        })
        .catch((e) => {
          if (current) setError(e.message);
        });
    return () => {
      current = false;
    };
  }, [settingsKey, baseline]);
  const result = settings ? scenario : baseline;
  const selected = result?.groups[rank - 1] || result?.groups[0];
  const selectedRank = selected?.rank ?? 1;
  const busy = !result && !error;
  function run() {
    location.hash = groupLink(params);
  }
  function restore() {
    setParams(baseline?.parameters || BASE_PARAMETERS);
    location.hash = groupLink(null);
  }
  const overlap: Record<string, number> = {};
  result?.groups.forEach((g) =>
    g.ids.forEach((id) => {
      overlap[id] = (overlap[id] || 0) + 1;
    }),
  );
  const [multiplesOpen, setMultiplesOpen] = useState(() => !!settings?.multiples_hundredths);
  const multipliersValid = validOverrides(params.multiples_hundredths ?? {});
  // Compare against the settings that produced the visible results, including on the first edit.
  const dirty =
    !!result &&
    Object.keys(params).some((key) => {
      const field = key as keyof Parameters;
      return field === "multiples_hundredths"
        ? multipleKey(params[field]) !== multipleKey(result.parameters[field])
        : params[field] !== result.parameters[field];
    });
  useEffect(() => {
    onScreen(
      result
        ? {
            applied: result.parameters,
            rank: selectedRank,
            pending: dirty ? params : null,
          }
        : null,
    );
    return () => onScreen(null);
  }, [onScreen, result, selectedRank, dirty, params]);
  const originalBest = baseline?.groups[0];
  const scenarioBest = scenario?.groups[0];
  const topGroup = result?.groups[0];
  const appliedMultiples = result?.parameters.multiples_hundredths ?? {};
  const changedRoles = PRODUCT_ROLES.filter((role) => appliedMultiples[role] !== undefined);
  const tied =
    !!result &&
    !!topGroup &&
    result.groups.length > 1 &&
    result.groups.every(
      (group) =>
        group.revenue_cents === topGroup.revenue_cents &&
        group.valuation_cents === topGroup.valuation_cents,
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Compare three-company combinations</h1>
          <p>
            Find the highest combined annual revenue from three different
            customer industries. The estimated value of all three companies must
            be below the budget.
          </p>
        </div>
        <a className="button secondary" href="/api/downloads/top_10_groups.csv">
          <Download size={16} /> Download original top 10
        </a>
      </div>
      <div className="scenario-layout">
        <div className="scenario-results">
          <button className="phone-edit button secondary" onClick={() => {
            setSettingsOpen(true);
            document.getElementById("scenario-settings")?.scrollIntoView({block:"start"});
          }}><SlidersHorizontal size={15}/> Edit scenario</button>
          {error && <ErrorBox error={error} />}
          {baseline && scenario && (
            <div className="baseline-strip">
              <div>
                <Badge tone="green">Original analysis</Badge>
                <span>
                  Below {money(baseline.parameters.budget_cents)} · original
                  price estimates
                </span>
              </div>
              <div>
                <strong>{money(baseline.groups[0]?.revenue_cents)}</strong>
                <small>annual revenue</small>
              </div>
              <div>
                <strong>{money(baseline.groups[0]?.valuation_cents)}</strong>
                <small>est. valuation</small>
              </div>
            </div>
          )}
          {!result && <div className="loading">Loading combinations…</div>}
          {result && (
            <>
              {selected && (
                <GroupCard
                  group={selected}
                  budget={result.parameters.budget_cents}
                  open={open}
                  result={result}
                />
              )}
              <div className="applied-settings">
                <h2>{scenario ? "Scenario results" : "Original analysis"}</h2>
                <div className="chips applied-rules" aria-label="Applied scenario settings">
                  <Badge>Below {money(result.parameters.budget_cents)}</Badge>
                  {changedRoles.length ? changedRoles.map((role) =>
                    <Badge key={role}>{productLabels[role]} {appliedMultiples[role]! / 100}×</Badge>,
                  ) : <Badge>{result.parameters.uniform ? "Uniform 2× pricing" : "Original multiples"}</Badge>}
                  <Badge>{result.parameters.core_only ? "Core software only" : "All eligible software"}</Badge>
                  <Badge tone={result.parameters.include_estimated ? "amber" : "neutral"}>
                    {result.parameters.include_estimated ? "Estimated sales allowed" : "Reported sales only"}
                  </Badge>
                  <Badge>{result.parameters.explicit_only ? "Stated currency required" : "Assumed currencies allowed"}</Badge>
                </div>
                <p>
                  {number(eligibleCount)} companies meet the original eligibility
                  rules. {number(result.pool_size)} entered this search after
                  applying the budget and settings.
                  {result.parameters.include_estimated && (
                    <> Of those, {number(result.estimated_pool_size ?? 0)} use estimated sales.</>
                  )}
                </p>
                <Explanation label="Why does the search start with fewer companies?">
                  Each company must be valued below the budget on its own to fit
                  in a group of three. Any selected restrictions on currency or
                  software type also reduce the search pool.
                </Explanation>
              </div>
              {scenario?.comparison && (
                <div className="comparison">
                  <h3>What changed from the original analysis?</h3>
                  <p>
                    {scenario.comparison.original_cost_cents >
                    result.parameters.budget_cents ? (
                      <>
                        The original winner costs{" "}
                        {money(scenario.comparison.original_cost_cents)} with
                        these rules, which is{" "}
                        {money(
                          scenario.comparison.original_cost_cents -
                            result.parameters.budget_cents,
                        )}{" "}
                        over this budget.
                      </>
                    ) : (
                      scenario.comparison.reason
                    )}{" "}
                    {scenarioBest &&
                      originalBest &&
                      scenarioBest.revenue_cents !==
                        originalBest.revenue_cents && (
                        <>
                          The new first group has{" "}
                          {money(
                            Math.abs(
                              scenarioBest.revenue_cents -
                                originalBest.revenue_cents,
                            ),
                          )}{" "}
                          {scenarioBest.revenue_cents >
                          originalBest.revenue_cents
                            ? "more"
                            : "less"}{" "}
                          in annual sales for ranking.
                        </>
                      )}
                  </p>
                  {originalBest && scenarioBest && (
                    <div className="comparison-table-wrap">
                      <table className="comparison-table">
                        <thead>
                          <tr>
                            <th scope="col">Top combination</th>
                            <th scope="col">Original</th>
                            <th scope="col">Scenario</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <th scope="row">Annual revenue</th>
                            <td>{money(originalBest.revenue_cents)}</td>
                            <td>
                              {money(scenarioBest.revenue_cents)}
                              {estimatedSales(scenarioBest) > 0 && (
                                <div><small>{money(estimatedSales(scenarioBest))} estimated</small></div>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <th scope="row">Estimated value</th>
                            <td>{money(originalBest.valuation_cents)}</td>
                            <td>{money(scenarioBest.valuation_cents)}</td>
                          </tr>
                          <tr>
                            <th scope="row">Budget remaining</th>
                            <td>{money(originalBest.headroom_cents, true)}</td>
                            <td>{money(scenarioBest.headroom_cents, true)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  {scenarioBest && <div className="chips membership-changes">
                    {scenario.comparison.entered.map((id) => <button key={id} className="badge green" onClick={() => open(id)}>Added · {id}</button>)}
                    {scenario.comparison.left.map((id) => <button key={id} className="badge neutral" onClick={() => open(id)}>Removed · {id}</button>)}
                  </div>}
                </div>
              )}
              {scenario && changedRoles.length > 0 && (
                <form className="scenario-lookup" onSubmit={(event) => {
                  event.preventDefault();
                  open(lookup.trim().padStart(4, "0"));
                }}>
                  <label>Check a company’s scenario price
                    <input value={lookup} onChange={(event) => setLookup(event.target.value)}
                      inputMode="numeric" pattern="[0-9]{1,4}" placeholder="Company ID, e.g. 0012" required />
                  </label>
                  <button className="button secondary" type="submit">Show price</button>
                </form>
              )}
              {result.groups.length === 0 && (
                <div className="empty card">
                  <Layers size={30} />
                  <h3>No group of three meets these rules</h3>
                  <p>
                    Increase the budget or relax an eligibility filter to
                    explore more alternatives.
                  </p>
                  <button className="button secondary" onClick={restore}>
                    Restore original analysis
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <details
          id="scenario-settings" className="scenario-controls"
          open={settingsOpen}
          onToggle={(e) => setSettingsOpen(e.currentTarget.open)}
        >
          <summary className="section-title">
            <SlidersHorizontal size={18} />
            <strong>Scenario settings</strong>
          </summary>

          <label className="budget-label">
            Budget limit <span>USD millions</span>
            <div className="budget-input">
              <span>$</span>
              <input
                aria-label="Scenario budget in USD millions"
                type="number"
                min=".01"
                max="1000"
                step=".5"
                value={params.budget_cents / 100000000}
                onChange={(e) =>
                  setParams({
                    ...params,
                    budget_cents: Math.round(
                      Number(e.target.value) * 100000000,
                    ),
                  })
                }
              />
              <span>M</span>
            </div>
          </label>
          <div className="budget-presets">
            {[20, 25, 30].map((n) => (
              <button
                key={n}
                className={
                  params.budget_cents === n * 100000000 ? "selected" : ""
                }
                onClick={() =>
                  setParams({ ...params, budget_cents: n * 100000000 })
                }
              >
                ${n}M
              </button>
            ))}
          </div>
          <h3 className="settings-heading">Valuation multiples</h3>
          <label className="check-option">
            <input
              type="checkbox"
              checked={params.uniform}
              onChange={(event) =>
                setParams({ ...params, uniform: event.currentTarget.checked })
              }
            />
            <span>
              Value all software at 2× revenue
              <small>Any multiple you enter below takes priority</small>
            </span>
          </label>
          <details className="scenario-multiples" open={multiplesOpen}
            onToggle={(event) => setMultiplesOpen(event.currentTarget.open)}>
            <summary>Change valuation multiples</summary>
            <p>A 2.5× multiple prices a company with $4M in annual sales at $10M.</p>
            {PRODUCT_ROLES.map((role) => {
              const overrides = params.multiples_hundredths ?? {};
              const original = defaultMultiples[role];
              const scale = overrides[role] ?? (params.uniform &&
                (role === "Core workflow" || role === "Vertical add-on") ? 200 : original * 100);
              return (
                <label key={role}>
                  <span>{productLabels[role] || role}<small>Original {original}×</small></span>
                  <input
                    type="number" min="0.01" max="100" step="0.01"
                    aria-label={(productLabels[role] || role) + " sales multiple"}
                    value={Number.isFinite(scale) ? scale / 100 : ""}
                    onChange={(event) => {
                      const value = event.currentTarget.valueAsNumber;
                      const next = { ...overrides };
                      const hundredths = Math.round(value * 100);
                      const valid = Math.abs(value * 100 - hundredths) < 1e-8;
                      const fallback = params.uniform &&
                        (role === "Core workflow" || role === "Vertical add-on") ? 200 : original * 100;
                      if (valid && hundredths === fallback) delete next[role];
                      else next[role] = valid ? hundredths : NaN;
                      setParams({ ...params, multiples_hundredths: next });
                    }}
                  />
                  <span aria-hidden="true">×</span>
                </label>
              );
            })}
            {!multipliersValid && <p role="status">Enter a multiple from 0.01× to 100× with up to two decimal places.</p>}
            <p>Estimated prices and combination rankings update together. Reported sales and outreach tiers stay the same.</p>
          </details>
          <h3 className="settings-heading">Eligibility</h3>
          <label className="check-option">
            <input
              type="checkbox"
              checked={!!params.include_estimated}
              onChange={(event) =>
                setParams({ ...params, include_estimated: event.currentTarget.checked ? true : undefined })
              }
            />
            <span>
              Include companies with estimated sales
              <small>Use estimates from similar companies when reported sales are missing or unusable</small>
            </span>
          </label>
          <label className="check-option">
            <input
              type="checkbox"
              checked={params.explicit_only}
              onChange={(e) =>
                setParams({ ...params, explicit_only: e.target.checked })
              }
            />
            <span>
              Require a stated currency
              <small>Skip companies without an explicit revenue currency</small>
            </span>
          </label>
          <label className="check-option">
            <input
              type="checkbox"
              checked={params.core_only}
              onChange={(e) =>
                setParams({ ...params, core_only: e.target.checked })
              }
            />
            <span>
              Include only core operations software
              <small>Skip industry-specific add-ons</small>
            </span>
          </label>
          {params.include_estimated && params.explicit_only && (
            <p className="muted">Requiring a stated currency may exclude companies with estimated sales. The results show how many entered.</p>
          )}
          {dirty && (
            <div className="pending-note" role="status">
              Unapplied changes
            </div>
          )}
          <button
            className="button primary full"
            disabled={
              busy || !multipliersValid ||
              params.budget_cents <= 0 ||
              params.budget_cents > 100000000000
            }
            onClick={run}
          >
            {busy
              ? "Calculating combinations…"
              : "Calculate with these settings"}
            <ArrowRight size={16} />
          </button>
          <button
            className="text-button full"
            disabled={busy}
            onClick={restore}
          >
            Restore original analysis
          </button>
          <div className="constraint-note">
            <strong>Exactly 3 companies</strong>
            <span>
              Three different customer industries. Total estimated value below
              the budget. A company can appear in several combinations.
            </span>
          </div>
        </details>
      </div>
      <div className="combination-guide">
        <p>Companies from either tier can qualify for a group.</p>
        <Explanation label="Why can Tier B companies be included?">
          <p><strong>Tier B means call later.</strong> The tier helps us decide who to contact first.</p>
          <p>The group search asks which three companies bring in the most annual sales while serving three different types of customers and costing less than the budget.</p>
          {showDatasetExample && (
            <p>
              <strong>Take company 0008.</strong> It sells a giveaway tool to
              bingo halls. We’d call it later because the tool handles a smaller
              task. It serves a specific type of customer and reports $3.914
              million in annual sales. At its original estimated price of $7.828
              million, it can fit alongside two companies that serve other types
              of customers.{" "}
              <button className="text-button" onClick={() => open("0008")}>
                See company 0008
              </button>
            </p>
          )}
        </Explanation>
      </div>
      {result && result.groups.length > 0 && (
        <section className="rankings">
          <div className="section-title">
            <h2>Top {result.groups.length} combinations shown</h2>
          </div>
          <p className="ranking-note">
            {tied
              ? "All combinations shown tie on revenue and estimated value. Company IDs determine their order."
              : "Higher annual revenue ranks first. Ties use lower estimated value, then company IDs."}
          </p>
          <p className="mobile-table-tools">
            Swipe across for the full comparison. Tap a company ID to see its
            evidence.
          </p>
          <div
            className="table-container"
            tabIndex={0}
            role="region"
            aria-label="Ranked groups"
          >
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Companies</th>
                  <th>Customer industries</th>
                  <th className="numeric">Annual revenue</th>
                  <th className="numeric">Estimated value</th>
                  <th className="numeric">Budget remaining</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {result.groups.map((g) => (
                  <tr
                    key={g.rank}
                    className={selectedRank === g.rank ? "rank-selected" : ""}
                  >
                    <td>
                      <span className="rank-number">
                        {String(g.rank).padStart(2, "0")}
                      </span>
                      {result.best_tie_count > 1 && g.revenue_cents === topGroup?.revenue_cents && g.valuation_cents === topGroup.valuation_cents && <small className="rank-tie">Tied</small>}
                    </td>
                    <td>
                      <div className="member-links">
                        {g.ids.map((id) => (
                          <button
                            className="account-link"
                            key={id}
                            onClick={() => open(id)}
                          >
                            {id}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <small className="customer-mix">
                        {g.members.map((m) => m.vertical).join(" · ")}
                      </small>
                    </td>
                    <td
                      className="numeric"
                      title={money(g.revenue_cents, true)}
                    >
                      {money(g.revenue_cents)}
                      {estimatedSales(g) > 0 && (
                        <div><small>{money(estimatedSales(g))} estimated</small></div>
                      )}
                    </td>
                    <td
                      className="numeric"
                      title={money(g.valuation_cents, true)}
                    >
                      {money(g.valuation_cents)}
                    </td>
                    <td className="numeric">{money(g.headroom_cents, true)}</td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={"Inspect trio " + g.rank}
                        onClick={() => {
                          location.hash = groupLink(settings, g.rank);
                          document
                            .getElementById("selected-combination")
                            ?.scrollIntoView({ block: "start" });
                        }}
                      >
                        <ArrowUpRight size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="overlap">
            <strong>Company appearances</strong>
            <span>
              Appearances in the {result.groups.length} combinations shown
            </span>
            <div className="chips">
              {Object.entries(overlap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([id, count]) => (
                  <button
                    key={id}
                    className="badge neutral tag-button"
                    onClick={() => open(id)}
                  >
                    Account {id}
                    <strong>
                      {count}/{result.groups.length}
                    </strong>
                  </button>
                ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
function GroupCard({
  group,
  budget,
  open,
  result,
}: {
  group: Group;
  result: GroupResult;
  budget: number;
  open: (id: string) => void;
}) {
  const estimated = estimatedSales(group);
  const highCost = group.members.reduce(
    (sum, m) => sum + scaledPrice(m.revenue_high_cents ?? m.revenue_cents, Math.round(m.multiple * 100)),
    0,
  );
  return (
    <section className="group-card" id="selected-combination">
      <div className="group-heading">
        <div className="eyebrow">
          {group.rank === 1
            ? "First of " + result.groups.length + " groups shown"
            : "Combination " + group.rank}
        </div>
        <Badge tone="neutral">{group.members.map((member) => member.id).join(" + ")}</Badge>
      </div>
      <div className="group-totals">
        <div>
          <span>{estimated > 0 ? "Annual sales used for ranking" : "Sales in one year"}</span>
          <strong title={money(group.revenue_cents, true)}>
            {money(group.revenue_cents)}
          </strong>

        </div>
        <div>
          <span>Estimated price for all three</span>
          <strong title={money(group.valuation_cents, true)}>
            {money(group.valuation_cents)}
          </strong>
        </div>
      </div>
      {estimated > 0 && (
        <figure className="sales-evidence">
          <figcaption>Annual sales breakdown <strong>{money(group.revenue_cents, true)}</strong></figcaption>
          <div className="sales-track" aria-hidden="true"><i style={{width: (100 * (group.revenue_cents - estimated) / group.revenue_cents) + "%"}} /></div>
          <div className="sales-key"><span>Reported <b>{money(group.revenue_cents - estimated, true)}</b></span><span>Peer estimate <b>{money(estimated, true)}</b></span></div>
        </figure>
      )}
      <div
        className={
          "budget-bar" +
          (group.headroom_cents / budget < 0.01 ? " near-limit" : "")
        }
        role="img"
        aria-label={
          money(group.valuation_cents, true) +
          " valuation against " +
          money(budget, true) +
          " cap"
        }
      >
        <div
          style={{
            width: Math.min(100, (group.valuation_cents / budget) * 100) + "%",
          }}
        />
      </div>
      <div className="budget-caption">
        <span>
          {money(group.valuation_cents, true)} of {money(budget)} budget
        </span>
        <strong>{money(group.headroom_cents, true)} budget remaining</strong>
      </div>
      <p className="group-answer-note">
        {number(result.qualifying_count)} groups fit these settings.{" "}
        {result.best_tie_count > 1 ? (
          <>
            <b>{number(result.best_tie_count)} tie for first</b> on sales and
            estimated price. Company IDs put the tied groups in a repeatable
            order.
          </>
        ) : (
          <>One group has the best sales and price.</>
        )}
      </p>
      {group.members.some(
        (m) => (m.revenue_high_cents ?? m.revenue_cents) > m.revenue_cents,
      ) && (
        <details className="range-sensitivity">
          <summary>What if reported revenue is at the high end?</summary>
          <p>
            Using the high end of each reported revenue range, these three
            companies would have an estimated value of {money(highCost, true)}.{" "}
            {estimated > 0 && "Companies with estimated sales keep the same estimate. "}
            {highCost === budget
              ? "That reaches the limit, so this group no longer fits."
              : highCost > budget
                ? money(highCost - budget) +
                  " over budget. This group would no longer fit."
                : money(budget - highCost) + " remains under the limit."}
          </p>
        </details>
      )}
      <div className="trio-members">
        {group.members.map((m, i) => (
          <div className="trio-member" key={m.id}>
            <span className="member-marker">{i + 1}</span>
            <div>
              <button className="account-link" onClick={() => open(m.id)}>
                Account {m.id}
                <ArrowUpRight size={13} />
              </button>
              <small>{m.vertical}</small>
              <span className="member-evidence">
                Tier {m.tier} · {m.tier === "A" ? "Call first" : "Later"}
                {m.flags.length
                  ? " · " + m.flags.join(" · ")
                  : " · Explicit currency"}
              </span>
            </div>
            <div className="member-values">
              <strong className={m.estimated_revenue ? "estimated-amount" : undefined}>{money(m.revenue_cents)} {m.estimated_revenue ? "estimated sales" : "sales"}</strong>
              <small>
                {m.multiple}× → {money(m.valuation_cents)} price
              </small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
