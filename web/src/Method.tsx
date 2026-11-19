/** The audit view shows policy metadata, eligibility coverage and official downloads, with an architecture guide for the interview walkthrough. */
import React, { useState } from "react";
import {
  ArrowRight,
  Check,
  Download,
  FileText,
  GitBranch,
  Layers,
} from "lucide-react";
import { Meta, money, type Parameters } from "./types";
import { scaledPrice, type ProductRole } from "./scenario-pricing";
import { Badge, Explanation, productLabels } from "./common";

const STAGES = [
  {
    title: "Read the data",
    caption: "Keep the original fields",
    module: "pipeline.py · load_accounts",
    input: "Supplied CSV with unique reference IDs",
    output: "Validated, unchanged source fields",
    example:
      "Account 0004 · €2.0M revenue, original industry label “MRO.” The description mentions maintenance tracking for repair stations.",
  },
  {
    title: "Standardize amounts",
    caption: "Convert revenue to USD",
    module: "cleaning.py · parse_revenue",
    input: "Raw currency, units, ranges, locations",
    output: "USD amounts and a record of each assumption",
    example:
      "Convert euro revenue to US dollars using the exchange rate listed below.",
  },
  {
    title: "Assess company fit",
    caption: "Set outreach priority",
    module: "analysis.py · classify / assess",
    input: "Description, ownership, profitability",
    output:
      "Customer industry, product type, and reasons for the outreach tier",
    example:
      "Account 0004 serves aviation operators and repair stations with core maintenance and FAA records software. Independent ownership and positive earnings satisfy Tier A.",
  },
  {
    title: "Estimate values",
    caption: "Apply a revenue multiple",
    module: "policy.py · MULTIPLES",
    input: "Reported revenue or typical revenue from comparable companies",
    output: "Estimated business value and how it was calculated",
    example:
      "Account 0004 · $2.2M × 3 = $6.6M enterprise value. Missing revenue uses ≥5 peers by buyer and role, then role, then dataset.",
  },
  {
    title: "Compare combinations",
    caption: "Find the highest revenue",
    module: "groups.sql · ordered three-way join",
    input: "Industry-specific software companies with reported revenue",
    output: "Up to ten groups of three ranked by combined annual revenue",
    example:
      "Account 0004 can enter the search because it serves a known industry and reports revenue. Each group needs three different customer industries and a total estimated value below the budget.",
  },
  {
    title: "Download results",
    caption: "Save the original results",
    module: "pipeline.py · build",
    input: "Verified account records and ranked trios",
    output: "Four downloadable CSV files and the original analysis",
    example:
      "The company valuations CSV includes Account 0004’s estimated value. The four downloads contain the original analysis.",
  },
];
export function Method({
  meta,
  scenario,
  combinationsHref,
}: {
  meta: Meta;
  scenario: Parameters | null;
  combinationsHref: string;
}) {
  const [stage, setStage] = useState(0);
  const hosted = meta.runtime === "Cloudflare";
  const stages = STAGES;
  const stepLinks = ["rows", "revenue", "tiers", "value", "trios", "check"];
  // The worked v9 example uses the live policy values so an interview edit is visible.
  const exampleRevenue = 200000000 * Number(meta.fx.EUR);
  const examples = stages.map((s) => s.example);
  examples[1] =
    "€2.0M × " +
    meta.fx.EUR +
    " = " +
    money(exampleRevenue, true) +
    " in USD. The original euro amount remains in the company record.";
  examples[3] =
    "Account 0004 · " +
    money(exampleRevenue) +
    " × " +
    meta.multiples["Core workflow"] +
    " = " +
    money(exampleRevenue * meta.multiples["Core workflow"]) +
    " estimated business value. Where revenue is missing, the estimate uses the median from comparable companies.";

  const overrides = scenario?.multiples_hundredths ?? {};
  const showScenario = scenario?.uniform || Object.keys(overrides).length > 0;
  const appliedMultiple = (role: string) => {
    const override = overrides[role as ProductRole];
    if (override !== undefined) return override / 100;
    if (scenario?.uniform && (role === "Core workflow" || role === "Vertical add-on"))
      return 2;
    return meta.multiples[role];
  };
  if (showScenario) {
    const rate = appliedMultiple("Core workflow");
    examples[3] +=
      " At the scenario’s " + rate + "× rate, Account 0004 is valued at " +
      money(scaledPrice(exampleRevenue, Math.round(rate * 100))) + ".";
  }

  const totalExcluded = meta.total - (meta.eligibility.Eligible || 0);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Methodology</h1>
          <p>
            Explore the rules behind outreach priority, estimated prices and three-company combinations.
          </p>
        </div>
      </div>
      <nav className="method-jumps" aria-label="Methodology sections">
        {[["outreach","Outreach criteria"],["multiples","Valuation multiples"],["eligibility","Group rules"]].map(([id,label]) => (
          <button key={id} className="button secondary" onClick={() => {
            const heading = document.getElementById("method-" + id);
            heading?.focus({preventScroll:true});
            heading?.scrollIntoView({block:"center"});
          }}>{label}</button>
        ))}
      </nav>
      <div className="method-grid">
        <section className="card">
          <div className="section-title">
            <h2 tabIndex={-1} id="method-outreach">Who qualifies for priority outreach?</h2>
            <Badge tone="green">Tier A</Badge>
          </div>
          <p>
            We use all three checks to decide who
            gets the first call.
          </p>
          <ol className="gates">
            {[
              "Does the software run a main job for one industry? That makes it a closer product fit.",
              "Is the business independently owned? Borrowing money from a bank can leave that ownership intact.",
              "Is there evidence it earns money? We accept a positive earnings measure or the company’s statement that it is profitable.",
            ].map((g) => (
              <li key={g}>
                <Check size={16} />
                {g}
              </li>
            ))}
          </ol>
          <p className="muted">
            Each Tier B company lists which checks it missed. Positive cash flow
            alone leaves the earnings check unresolved. Founder age has no role
            in the decision.
          </p>
        </section>
        <section className="card">
          <div className="section-title">
            <h2 tabIndex={-1} id="method-multiples">How estimated values are calculated</h2>
          </div>
          {showScenario ? (
            <table className="comparison-table method-multiples">
              <thead>
                <tr>
                  <th scope="col">Product category</th>
                  <th scope="col">Original</th>
                  <th scope="col">Scenario</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(meta.multiples).map(([role, original]) => (
                  <tr key={role}>
                    <th scope="row">{productLabels[role] ?? role}</th>
                    <td>{original}×</td>
                    <td className={appliedMultiple(role) !== original ? "changed-multiple" : undefined}><strong>{appliedMultiple(role)}×</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="multiple-list">
              {Object.entries(meta.multiples).map(([role, original]) => (
                <div key={role}>
                  <span>{productLabels[role] ?? role}</span>
                  <strong>{original}× revenue</strong>
                </div>
              ))}
            </div>
          )}
          {showScenario && (
            <p className="muted">
              {scenario?.uniform
                ? "The 2× setting covers eligible software. Your category overrides apply to every company in that category."
                : "The Scenario column shows the rates you applied in Combinations."}
            </p>
          )}
          <p className="muted">
            These multiples give rough estimates for screening. The original
            analysis gives core operations software a higher multiple.
          </p>
          <a href={combinationsHref}>Change multiples in Combinations</a>
        </section>
        <section className="card">
          <div className="section-title">
            <h2 tabIndex={-1} id="method-eligibility">Which companies can enter combinations?</h2>
            <span>{totalExcluded} excluded</span>
          </div>
          <p>Share of all {meta.total.toLocaleString()} companies. Each company counts once.</p>
          <div className="waterfall">
            {Object.entries(meta.eligibility).map(([reason, n]) => (
              <div key={reason}>
                <div>
                  <span>
                    {{
                      Eligible: "Meets the combination rules",
                      "Unresolved / horizontal customer":
                        "No specific customer industry",
                      "Missing / invalid observed revenue":
                        "Missing or unusable reported revenue",
                      "Services / unresolved product":
                        "Services or unclear product",
                    }[reason] ?? reason}
                  </span>
                  <strong>{n}</strong>
                </div>
                <div className="waterfall-track">
                  <span
                    style={{
                      width: (n / meta.total) * 100 + "%",
                      background: reason === "Eligible" ? "#326a55" : "#b8c3b8",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p>
            <b>{meta.search_pool} companies enter the original search.</b> Of
            the {meta.eligibility.Eligible || 0} that pass the basic checks,{" "}
            {(meta.eligibility.Eligible || 0) - meta.search_pool} already cost
            the whole budget or more on their own.
          </p>
          <p>
            {scenario?.include_estimated ? "Your current scenario" : "The estimated-sales option in Combinations"} can
            include otherwise eligible companies with no usable sales figure.
            The ranking uses their peer estimates and shows the estimated share of each total.
          </p>
          <Explanation label="Why are there two missing-sales counts?">
            {meta.missing_revenue} companies lack usable sales. Each row is
            counted at its first failed check.{" "}
            {meta.missing_by_exclusion["Unresolved / horizontal customer"] || 0}{" "}
            failed the customer check and{" "}
            {meta.missing_by_exclusion["Services / unresolved product"] || 0}{" "}
            failed the product check first. The remaining{" "}
            {meta.missing_by_exclusion["Missing / invalid observed revenue"] ||
              0}{" "}
            reached the sales check.
          </Explanation>
          <p className="muted">
            Each company appears once. Companies from either tier can qualify
            when they sell industry-specific software and report revenue.
          </p>
        </section>
        <section className="card">
          <div className="section-title">
            <h2>Exchange rates used in the analysis</h2>
            <span>From the brief · one euro counts as ${meta.fx.EUR} US</span>
          </div>
          <div className="fx-grid">
            {Object.entries(meta.fx).map(([currency, rate]) => (
              <div key={currency}>
                <span>{currency}</span>
                <strong>{rate}</strong>
              </div>
            ))}
          </div>
          <p className="muted">
            {meta.assumed_currency} companies use an assumed USD currency.{" "}
            {meta.missing_revenue} have missing revenue and use peer estimates
            for valuation. {meta.unparsed_revenue} unparsed or invalid revenue
            fields.
          </p>
        </section>
      </div>
      <section className="architecture card">
        <div className="section-title">
          <h2>Follow an example through the analysis</h2>
          <span>Choose a step to see what happens</span>
        </div>
        <div className="stage-flow">
          {stages.map((s, i) => (
            <React.Fragment key={s.title}>
              <button
                className={"stage " + (stage === i ? "selected" : "")}
                onClick={() => setStage(i)}
                aria-pressed={stage === i}
              >
                <span className="stage-icon">
                  {i === 0 ? (
                    <FileText size={18} />
                  ) : i === 4 ? (
                    <Layers size={18} />
                  ) : i === 5 ? (
                    <Download size={18} />
                  ) : (
                    <GitBranch size={18} />
                  )}
                </span>
                <strong>{s.title}</strong>
                <small>{s.caption}</small>
              </button>
              {i < stages.length - 1 && (
                <ArrowRight size={15} className="stage-arrow" />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="stage-detail">
          <div>
            <Badge tone="green">{stages[stage].title}</Badge>
            <h3>{stages[stage].caption}</h3>
            <p>{examples[stage]}</p>
          </div>
          <div>
            <span>STARTS WITH</span>
            <p>{stages[stage].input}</p>
            <span>RESULT</span>
            <p>{stages[stage].output}</p>
          </div>
        </div>
        {meta.input_name === "candidate_companies_v9.csv" && (
          <a
            className="text-button worked-example-link"
            href="#view=method&account=0004"
          >
            Open the company example <ArrowRight size={14} />
          </a>
        )}
        <a
          className="text-button worked-example-link"
          href={"#view=code&step=" + stepLinks[stage]}
        >
          Read the code for this step <ArrowRight size={14} />
        </a>
        <Explanation label="Technical architecture">
          <div className="technical-flow">
            <span>Source CSV</span>
            <ArrowRight size={14} aria-hidden="true" />
            <span>Python + DuckDB</span>
            <ArrowRight size={14} aria-hidden="true" />
            <span>
              {hosted ? "Snapshot on Cloudflare" : "Results through FastAPI"}
            </span>
            <ArrowRight size={14} aria-hidden="true" />
            <span>{hosted ? "React + browser worker" : "React dashboard"}</span>
          </div>
          <p>
            <strong>Official analysis.</strong> Python cleans the source data
            and applies the tier and valuation rules. DuckDB searches eligible
            groups of three. The pipeline writes four CSV files and a snapshot
            of the results. A snapshot is a saved copy of one completed run.
          </p>
          <p>
            <strong>Dashboard.</strong>{" "}
            {hosted
              ? "Cloudflare serves the React interface, snapshot, and downloads. A browser worker runs filters and recalculates combinations with the same rules."
              : "FastAPI serves the React interface and calls Python and DuckDB when you filter or recalculate combinations."}
          </p>
          <p>
            <strong>Code for this step.</strong>{" "}
            <code>{stages[stage].module}</code>
          </p>
          <p>
            <strong>Optional chat.</strong> The server reads the saved results
            and company records. For a group question it uses the applied
            settings and the selected rank.
          </p>
        </Explanation>
      </section>

      <section className="card assumptions">
        <div className="section-title">
          <h2>Assumptions to verify</h2>
          <span>Visible in the account evidence</span>
        </div>
        <p>
          We chose the price multipliers and how to handle missing or unclear
          sales. For company 0002, ask which currency its 2–4M sales range uses.
          For company 0012, ask how much it actually sold last year.
        </p>
        <Explanation label="See all assumptions">
          {meta.assumptions.map((a, i) => (
            <p key={i}>
              <span className="status-dot" />
              {a}
            </p>
          ))}
        </Explanation>
        <p>
          <span className="status-dot" />
          The brief references 960 rows in v8. This analysis uses the supplied
          v9 with {meta.total} rows.
        </p>
      </section>
      <section className="downloads">
        <div className="section-title">
          <h2>Download original results</h2>
          <span>
            Amounts in USD · import company IDs as text to keep leading zeros
          </span>
        </div>
        <div className="download-grid">
          {meta.files.map((file, i) => (
            <a key={file} href={"/api/downloads/" + file}>
              <FileText size={23} />
              <div>
                <strong>
                  {
                    [
                      "Cleaned dataset",
                      "A/B outreach list",
                      "Valuation estimates",
                      "Top 10 combinations",
                    ][i]
                  }
                </strong>
                <small>{file}</small>
              </div>
              <Download size={18} />
            </a>
          ))}
        </div>
        <Explanation label="How to read the spreadsheets">
          <p>
            In the supplied file, 0004 reports €2M. In the cleaned file its
            sales are $2.2M, in the tier file it is A, and in the valuation file
            its estimated price is $6.6M. The first group row contains 0008,
            0300 and 0533. Keep its ID as text when importing so 0004 stays
            0004.
          </p>
          <dl className="field-key">
            {[
              ["ref_id", "The ID shared by all the files."],
              [
                "revenue_usd",
                "Annual sales from the file, converted to US dollars. A blank means unknown.",
              ],
              [
                "valuation_revenue_usd",
                "Sales used for the price estimate. This can come from similar companies.",
              ],
              [
                "peer_count",
                "How many similar companies supplied sales for the estimate. Zero means we used the company’s own sales.",
              ],
              [
                "valuation_usd",
                "Estimated price to buy the business or group.",
              ],
              ["headroom_usd", "Money left under the budget."],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>
                  <code>{k}</code>
                </dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p>
            The cleaned sheet keeps all reasons for a tier. The short A/B sheet
            shows the first failed check. The group sheet lists three IDs per
            row. The downloaded files always contain the original analysis.
          </p>
        </Explanation>
        <Explanation label="Identify this analysis run">
          <p>Run {meta.run_id}</p>
          <p className="source-hash">Source SHA-256 {meta.input_sha256}</p>
        </Explanation>
      </section>
    </>
  );
}
