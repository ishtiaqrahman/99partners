/** The account evidence panel connects original source text to tier, revenue conversion and valuation. Local analyst tags do not alter those decisions. */
import { useEffect, useRef, useState } from "react";
import { FileText, Plus, Target, X } from "lucide-react";
import { Account, api, money, customerIndustry, type Parameters } from "./types";
import { scenarioPrice } from "./scenario-pricing";
import { Badge, ErrorBox, Explanation, productLabels } from "./common";

export function AccountDrawer({
  id,
  close,
  tags,
  setTags,
  scenarioSettings,
  ask,
}: {
  id: string;
  scenarioSettings?: Parameters;
  ask: () => void;
  close: () => void;
  tags: string[];
  setTags: (next: string[]) => void;
}) {
  const [a, setAccount] = useState<Account | null>(null),
    [error, setError] = useState(""),
    [tag, setTag] = useState("");
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    let active = true;
    setAccount(null);
    setError("");
    api<Account>("accounts/" + encodeURIComponent(id))
      .then((v) => {
        if (active) setAccount(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panel.current) {
        const elements = Array.from(
          panel.current.querySelectorAll<HTMLElement>(
            'button, a, input, [tabindex="0"]',
          ),
        ).filter((el) => !el.hasAttribute("disabled"));
        const first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.body.style.overflow = "hidden";
    addEventListener("keydown", listener);
    return () => {
      document.body.style.overflow = "";
      removeEventListener("keydown", listener);
      previous?.focus();
    };
  }, []);
  return (
    <div className="drawer-backdrop" onClick={close}>
      <aside
        className="drawer"
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={"Account " + id + " evidence"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-top">
          <span>
            <FileText size={17} /> COMPANY DETAILS
          </span>
          <button
            className="icon-button"
            aria-label="Close account details"
            onClick={close}
          >
            <X size={21} />
          </button>
        </div>
        {error && <ErrorBox error={error} />}
        {!a && !error && <div className="loading">Loading evidence…</div>}
        {a && (
          <>
            <div className="drawer-heading">
              <Badge tone={a.tier === "A" ? "green" : "neutral"}>
                Tier {a.tier}
              </Badge>
              <h2>Company {a.ref_id}</h2>
              <p>{customerIndustry(a)}</p>
              <div className="chips">
                <Badge>{productLabels[a.product_role] ?? a.product_role}</Badge>
                <Badge>{a.country}</Badge>
              </div>
            </div>
            <div className="decision-summary">
              <p>
                <b>Call priority</b> ·{" "}
                {a.tier === "A" ? "First call (Tier A)" : "Later call (Tier B)"}
              </p>
              <p>
                <b>Group search</b> ·{" "}
                {a.grouping_status === "Eligible"
                  ? "Can enter before the budget check."
                  : a.grouping_status.startsWith("Missing")
                    ? "Cannot enter because annual sales are missing."
                    : "Cannot enter because the file does not identify qualifying industry-specific software."}
              </p>
            </div>
            <p className="company-description">{a.description}</p>
            <div className="decision-note">
              <h3>
                {a.tier === "A"
                  ? "Why this company is Tier A"
                  : "Why this company is Tier B"}
              </h3>
              <ul className="criteria-list">
                {[
                  {
                    label: "Core software for a known industry",
                    met: !!a.vertical && a.product_role === "Core workflow",
                    evidence: productLabels[a.product_role] ?? a.product_role,
                  },
                  {
                    label: "Independent ownership",
                    met: a.ownership_status.startsWith("Independent"),
                    evidence: a.ownership_funding || "Unknown from the file",
                  },
                  {
                    label: "Evidence of positive earnings",
                    met: a.earnings_status.startsWith("Positive"),
                    evidence:
                      (a.profitability || "Unknown from the file") +
                      " · " +
                      a.earnings_status,
                  },
                ].map(({ label, met, evidence }) => (
                  <li key={label}>
                    <strong>
                      {met ? "Met" : "Not met"} · {label}
                    </strong>
                    <span>{evidence}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button className="text-button" onClick={ask}>
              Ask about company {a.ref_id}
            </button>
            <div className="diligence">
              <Target size={18} />
              <div>
                <h3>What to verify next</h3>
                <p>{a.diligence_question}</p>
              </div>
            </div>
            <Explanation label="View classification evidence">
              <div className="evidence-line">
                <span>Customer industry clues</span>
                <strong>
                  {a.buyer_evidence ||
                    "No specific customer industry identified"}
                </strong>
              </div>
              <div className="evidence-line">
                <span>Product clues</span>
                <strong>{a.product_evidence}</strong>
              </div>
              <small>
                Company {a.ref_id} is on line {a.source_row} of the source
                spreadsheet, including the header · Original industry label “
                {a.industry}”
              </small>
            </Explanation>
            <section className="drawer-section">
              <h3>How the business value was estimated</h3>
              <div className="calculation">
                <div>
                  <span>Annual sales as entered</span>
                  <strong>{a.revenue || "Blank"}</strong>
                </div>
                {a.revenue_cents === null && (
                  <div>
                    <span>Reported annual sales</span>
                    <strong>Unknown</strong>
                  </div>
                )}
                {a.revenue_cents !== null && (
                  <div>
                    <span>
                      {a.currency_basis !== "Explicit"
                        ? "Revenue in USD (currency assumed)"
                        : a.currency !== "USD" && a.fx_rate
                          ? "Revenue in USD ($" +
                            a.fx_rate +
                            " per " +
                            a.currency +
                            ")"
                          : "Revenue in USD"}
                    </span>
                    <strong>{money(a.revenue_cents, true)}</strong>
                  </div>
                )}
                {a.scale_basis && (
                  <small>
                    {a.scale_basis === "Explicit M"
                      ? "Source amount stated in millions"
                      : a.scale_basis}
                    {a.revenue_low_cents !== a.revenue_high_cents
                      ? " · range midpoint"
                      : ""}
                  </small>
                )}
                {a.revenue_cents === null && (
                  <div>
                    <span>
                      Typical revenue among {a.peer_count} comparable companies
                      (median)
                    </span>
                    <strong>{money(a.valuation_revenue_cents, true)}</strong>
                  </div>
                )}
                {a.peer_count > 0 && (
                  <small>
                    Peer group ·{" "}
                    {a.valuation_basis === "Buyer + role median"
                      ? "Same customer industry and product type"
                      : a.valuation_basis === "Product role median"
                        ? "Same product type"
                        : "All companies with reported revenue"}
                  </small>
                )}
                <div className="calculation-total">
                  <span>
                    Original estimated price at {a.multiple}×{" "}
                    {a.peer_count > 0 ? "peer revenue" : "annual revenue"}
                  </span>
                  <strong>{money(a.valuation_cents, true)}</strong>
                </div>
              </div>
              {scenarioSettings &&
                (scenarioSettings.uniform || Object.keys(scenarioSettings.multiples_hundredths ?? {}).length > 0) && (
                <ScenarioPrice account={a} settings={scenarioSettings} />
              )}
              {a.revenue_low_cents !== null &&
                a.revenue_low_cents !== a.revenue_high_cents && (
                  <p className="muted">
                    Source range in USD {money(a.revenue_low_cents, true)}–
                    {money(a.revenue_high_cents, true)}. High-end valuation{" "}
                    {money((a.revenue_high_cents || 0) * a.multiple, true)}.
                  </p>
                )}
              <div className="chips">
                {a.evidence_tags.map((t) => (
                  <Badge key={t} tone="amber">
                    {t}
                  </Badge>
                ))}
              </div>
              <Explanation label={`Why multiply by ${a.multiple}?`}>
                The analysis uses {a.multiple}× revenue for{" "}
                {(
                  productLabels[a.product_role] ?? a.product_role
                ).toLowerCase()}
                . This gives a rough business value for screening. Comparable
                sales and company financials would help test the estimate.
              </Explanation>
              <p className="grouping-note">
                <strong>Combination eligibility</strong>
                <br />
                {{
                  Eligible:
                    "Eligible. The source gives revenue and identifies industry-specific software.",
                  "Missing / invalid observed revenue":
                    "Excluded. The search requires reported revenue. The peer estimate is used only for valuation.",
                  "Unresolved / horizontal customer":
                    "Excluded. The software serves several industries or the customer industry is unclear.",
                  "Services / unresolved product":
                    "Excluded. The source does not establish that the company sells eligible software.",
                }[a.grouping_status] ?? a.grouping_status}
              </p>
            </section>
            <section className="drawer-section">
              <h3>Ownership & earnings</h3>
              <div className="evidence-line">
                <span>{a.ownership_status}</span>
                <strong>{a.ownership_funding || "Undisclosed"}</strong>
              </div>
              <div className="evidence-line">
                <span>{a.earnings_status}</span>
                <strong>{a.profitability || "Unreported"}</strong>
              </div>
              <div className="source-grid">
                <div>
                  Founded<strong>{a.founding_year ?? "Unknown"}</strong>
                  {a.year_founded &&
                    String(a.founding_year) !== a.year_founded && (
                      <small>As entered · {a.year_founded}</small>
                    )}
                </div>
                <div>
                  Employees
                  <strong>
                    {a.employees.startsWith("~") && "About "}
                    {a.employees_low ?? "Unknown"}
                    {a.employees_high !== a.employees_low
                      ? "–" + a.employees_high
                      : ""}
                  </strong>
                  {a.employees && String(a.employees_low) !== a.employees && (
                    <small>As entered · {a.employees}</small>
                  )}
                </div>
                <div>
                  Headquarters<strong>{a.hq_location || "Unknown"}</strong>
                </div>
              </div>
            </section>
            <section className="drawer-section">
              <h3>Analyst tags</h3>
              <p className="muted">
                A tag is your own note on this company, saved in this browser.
              </p>
              <div className="chips">
                {tags.map((t) => (
                  <button
                    className="badge green tag-button"
                    key={t}
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                  >
                    {t}
                    <X size={12} />
                  </button>
                ))}
              </div>
              <form
                className="tag-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (tag.trim()) setTags([...new Set([...tags, tag.trim()])]);
                  setTag("");
                }}
              >
                <input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  maxLength={40}
                  aria-label="New analyst tag"
                  placeholder="e.g. Discuss with partner"
                />
                <button
                  className="button small secondary"
                  disabled={!tag.trim()}
                >
                  <Plus size={14} />
                  Add
                </button>
              </form>
            </section>
          </>
        )}
      </aside>
    </div>
  );
}


function ScenarioPrice({ account, settings }: { account: Account; settings: Parameters }) {
  const price = scenarioPrice(account, settings);
  return (
    <p className="decision-note">
      Scenario price at {price.multiple}× {account.peer_count > 0 ? "estimated sales" : "annual sales"} ·{" "}
      <b>{money(price.valuation_cents, true)}</b>
    </p>
  );
}
