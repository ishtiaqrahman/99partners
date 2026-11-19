import { customerIndustry } from "./types";
/** Account research owns query previews, sortable filters and local saved views. All financial and tier decisions arrive from Python. */
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
  LayoutGrid,
  ListFilter,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import {
  Account,
  api,
  DEFAULT_FILTERS,
  Filters,
  Meta,
  money,
  Preview,
} from "./types";
import {
  number,
  readLocal,
  saveLocal,
  Badge,
  Explanation,
  productLabels,
  ErrorBox,
  Metric,
  Select,
  SortIcon,
} from "./common";

type SavedView = { name: string; filters: Filters; tagFilter?: string };
export function Accounts({
  meta,
  tags,
  open,
}: {
  meta: Meta;
  tags: Record<string, string[]>;
  open: (id: string) => void;
}) {
  const [fullTable, setFullTable] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS),
    [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    total: number;
    accounts: Account[];
    matching_ids: string[];
  } | null>(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [advanced, setAdvanced] = useState(false);
  const [query, setQuery] = useState(""),
    [preview, setPreview] = useState<Preview | null>(null),
    [queryBusy, setQueryBusy] = useState(false);
  const [saved, setSaved] = useState<SavedView[]>(() =>
    readLocal("99-views-" + meta.input_sha256, []),
  );
  const [saveName, setSaveName] = useState(""),
    [saving, setSaving] = useState(false),
    [tagFilter, setTagFilter] = useState("");
  const allTags = [...new Set(Object.values(tags).flat())].sort();
  const taggedIds = tagFilter
    ? Object.entries(tags)
        .filter(([, v]) => v.includes(tagFilter))
        .map(([id]) => id)
    : null;
  const tagIdentity = JSON.stringify(taggedIds);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    const timer = setTimeout(
      () =>
        api<{ total: number; accounts: Account[]; matching_ids: string[] }>(
          "accounts",
          { filters, page, page_size: 20, ids: taggedIds },
        )
          .then((data) => {
            if (active) setResult(data);
          })
          .catch((e) => {
            if (active) setError(e.message);
          })
          .finally(() => {
            if (active) setBusy(false);
          }),
      150,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters, page, tagIdentity]);
  function change(patch: Partial<Filters>) {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  }
  function reset() {
    setFilters({ ...DEFAULT_FILTERS });
    setPage(1);
    setPreview(null);
    setQuery("");
    setTagFilter("");
  }
  async function parse(text = query) {
    setQuery(text);
    setQueryBusy(true);
    setError("");
    try {
      setPreview(await api<Preview>("query", { text }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setQueryBusy(false);
    }
  }
  function sortOrder(key: Filters["sort"]) {
    return filters.sort === key
      ? filters.descending
        ? "descending"
        : "ascending"
      : undefined;
  }
  function sort(key: Filters["sort"]) {
    change({
      sort: key,
      descending:
        filters.sort === key ? !filters.descending : key.endsWith("_cents"),
    });
  }
  function storeView() {
    const name = saveName.trim();
    if (!name) return;
    const next = [
      ...saved.filter((v) => v.name !== name),
      { name, filters, tagFilter },
    ];
    setSaved(next);
    saveLocal("99-views-" + meta.input_sha256, next);
    setSaving(false);
    setSaveName("");
  }
  function showPriority() {
    change({ tier: "A" });
  }
  const filterSummary = [
    filters.search && "Text “" + filters.search + "”",
    filters.country,
    filters.vertical &&
      (meta.buyers.find((b) => b.id === filters.vertical)?.label ||
        filters.vertical),
    filters.tier && "Tier " + filters.tier,
    filters.role && (productLabels[filters.role] || filters.role),
    filters.ownership,
    filters.earnings,
    filters.evidence,
    tagFilter,
    filters.under != null &&
      (filters.metric === "valuation_cents"
        ? "Estimated price"
        : "Annual sales") +
        " below " +
        money(filters.under),
  ]
    .filter(Boolean)
    .join(" · ");
  const sortLabel = {
    ref_id: "company ID",
    vertical_label: "customer industry",
    tier: "call priority",
    revenue_cents: "annual sales",
    valuation_cents: "estimated price",
  }[filters.sort];
  const activeCount =
    Object.entries(filters).filter(
      ([k, v]) =>
        !["search", "metric", "sort", "descending"].includes(k) &&
        v !== "" &&
        v !== null,
    ).length + (tagFilter ? 1 : 0);
  return (
    <>
      <div className="page-heading company-heading">
        <div>
          <h1>Find companies to investigate</h1>
          <p>
            Review {number(meta.total)} companies for acquisition, check how
            their values were estimated, and compare groups of three within a
            budget.
          </p>
          <div className="heading-actions">
            <button
              className="button primary"
              onClick={() => {
                showPriority();
                document
                  .getElementById("company-results")
                  ?.scrollIntoView({ block: "start" });
              }}
            >
              Show priority companies
            </button>
            <a className="button secondary" href="#view=groups">
              Compare combinations <ArrowRight size={15} />
            </a>
            {meta.input_name === "candidate_companies_v9.csv" && (
              <button className="text-button" onClick={() => open("0004")}>
                See a worked example
              </button>
            )}
          </div>
        </div>
      </div>
      <section aria-label="Full dataset summary">
        <div className="dataset-heading">
          <h2 className="dataset-label">Full dataset</h2>
          <span>A company can count in more than one category.</span>
        </div>
        <div className="metrics">
          <Metric
            label="Companies"
            value={number(meta.total)}
            note={meta.verticals + " customer industries"}
            icon={<LayoutGrid size={18} />}
          />
          <Metric
            label="Outreach priority (Tier A)"
            value={number(meta.tiers.A || 0)}
            note="Core software, independent ownership, and positive earnings evidence"
            icon={<Target size={18} />}
            accent
          />
          <Metric
            label="Eligible for combinations"
            value={number(meta.eligibility.Eligible || 0)}
            note="Industry-specific software with reported revenue"
            icon={<Layers size={18} />}
          />
          <Metric
            label="Reporting currency to confirm"
            value={number(meta.assumed_currency)}
            note="Revenue treated as USD when currency is unclear"
            icon={<SlidersHorizontal size={18} />}
          />
        </div>
        <Explanation label="How do the two lists overlap?">
          <table className="overlap-counts">
            <caption>Companies before the budget check</caption>
            <thead>
              <tr>
                <th>Call priority</th>
                <th>Can enter a group</th>
                <th>Cannot enter</th>
              </tr>
            </thead>
            <tbody>
              {["A", "B"].map((t) => (
                <tr key={t}>
                  <th>Tier {t}</th>
                  <td>{number(meta.eligible_by_tier[t] || 0)}</td>
                  <td>
                    {number(
                      (meta.tiers[t] || 0) - (meta.eligible_by_tier[t] || 0),
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Explanation>
      </section>
      <section className="search-panel" aria-label="Natural language filtering">
        <div className="query-intro">
          <Sparkles size={17} />
          <strong>Filter the company list</strong>
          <span>Describe a country, industry, tier or amount</span>
        </div>
        <form
          className="query-form"
          onSubmit={(e) => {
            e.preventDefault();
            parse();
          }}
        >
          <Search size={19} />
          <input
            aria-label="Describe the companies you want"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPreview(null);
            }}
            placeholder="Companies in Canada, valuation under $15M"
          />
          <button
            className="button primary"
            disabled={queryBusy || !query.trim()}
          >
            {queryBusy ? "Interpreting…" : "Preview filters"}
            <ArrowRight size={15} />
          </button>
        </form>
        <div className="query-examples">
          <span>Try</span>
          {[
            "Companies in Canada",
            "Core software, highest revenue first",
            "Marinas, valuation under $10M",
          ].map((q) => (
            <button key={q} onClick={() => parse(q)}>
              {q}
              <ArrowUpRight size={12} />
            </button>
          ))}
        </div>
        {preview && (
          <div className="query-preview">
            <div className="chips">
              {preview.chips.map((c, i) => (
                <Badge key={i} tone="green">
                  {c}
                </Badge>
              ))}
            </div>
            {preview.applicable && (
              <p className="query-issue">Filters this request will apply</p>
            )}
            {preview.issues.map((issue, i) => (
              <p className="query-issue" key={i}>
                {issue.startsWith("Unsupported text:")
                  ? "This request includes a term the search cannot turn into a filter: " +
                    issue.slice("Unsupported text: ".length) +
                    ". Try a country, industry, tier, or amount."
                  : issue}
              </p>
            ))}
            {preview.issues.some((i) => i.startsWith("Choose Revenue")) && (
              <div className="inline-actions">
                <button
                  className="button small secondary"
                  onClick={() =>
                    parse(
                      query.replace(/(under|below|less than)/i, "revenue $1"),
                    )
                  }
                >
                  Revenue
                </button>
                <button
                  className="button small secondary"
                  onClick={() =>
                    parse(
                      query.replace(/(under|below|less than)/i, "valuation $1"),
                    )
                  }
                >
                  Valuation
                </button>
              </div>
            )}
            {preview.applicable && (
              <div className="preview-apply">
                <span>
                  Applies these filters in place of your current filters.
                  Amounts are in USD.
                </span>
                <button
                  className="button small primary"
                  onClick={() => {
                    setFilters(preview.filters);
                    setPage(1);
                    setTagFilter("");
                    setPreview(null);
                  }}
                >
                  Apply these filters
                  <Check size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </section>
      <section
        className="account-section"
        id="company-results"
        aria-labelledby="company-results-title"
      >
        <div className="results-heading">
          <div>
            <h2 id="company-results-title" aria-live="polite">
              {busy || !result
                ? "Company results"
                : number(result.total) +
                  (result.total === 1
                    ? " matching company"
                    : " matching companies")}
            </h2>
            <p>
              Sorted by {sortLabel},{" "}
              {filters.descending ? "highest first" : "lowest first"}.{" "}
              {filterSummary
                ? "Applied filters · " + filterSummary + "."
                : "Showing the full list."}{" "}
              Open a company to check the evidence.
            </p>
          </div>
          <a
            className="button secondary"
            href="/api/downloads/cleaned_companies.csv"
          >
            <Download size={16} /> Download all {number(meta.total)} companies
          </a>
        </div>
        <Explanation label="How are companies prioritized?">
          Tier A companies meet all three outreach criteria: core software for a
          specific industry, independent ownership, and positive earnings
          evidence. Tier B companies fall short on at least one criterion or
          need more evidence. Both tiers can enter combinations.
        </Explanation>
        <small className="list-note">
          Shortcut counts cover the full dataset. Adding a tier or missing-sales
          filter keeps your other filters.
        </small>
        <div className="section-bar">
          <div className="view-tabs">
            <button
              className={!filters.tier && !filters.evidence ? "selected" : ""}
              onClick={reset}
            >
              All companies <span>{number(meta.total)}</span>
            </button>
            <button
              className={filters.tier === "A" ? "selected" : ""}
              onClick={showPriority}
            >
              Priority (Tier A) <span>{meta.tiers.A}</span>
            </button>
            <button
              className={filters.evidence === "Peer estimate" ? "selected" : ""}
              onClick={() => {
                change({ evidence: "Peer estimate" });
              }}
            >
              Missing revenue <span>{meta.missing_revenue}</span>
            </button>
          </div>
          <button className="text-button" onClick={() => setSaving(!saving)}>
            <Plus size={15} /> Save view
          </button>
        </div>
        {(saved.length > 0 || saving) && (
          <div className="saved-views">
            <small className="muted">
              A saved view remembers these filters and their sort order in this
              browser.
            </small>
            {saved.map((v, i) => (
              <span className="saved-pill" key={i}>
                <button
                  onClick={() => {
                    setFilters({
                      ...v.filters,
                      metric: v.filters.metric || DEFAULT_FILTERS.metric,
                    });
                    setPage(1);
                    setTagFilter(v.tagFilter ?? "");
                  }}
                >
                  {v.name}
                </button>
                <button
                  aria-label={"Delete view " + v.name}
                  onClick={() => {
                    const next = saved.filter((_, j) => j !== i);
                    setSaved(next);
                    saveLocal("99-views-" + meta.input_sha256, next);
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {saving && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  storeView();
                }}
              >
                <input
                  autoFocus
                  aria-label="Saved view name"
                  placeholder="Name this view"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                />
                <button className="button small primary">Save</button>
              </form>
            )}
          </div>
        )}
        <div className="filter-bar">
          <div className="table-search">
            <Search size={16} />
            <input
              aria-label="Search companies"
              placeholder="Find a row, e.g. 0004"
              value={filters.search}
              onChange={(e) => change({ search: e.target.value })}
            />
          </div>
          <Select
            label="Country"
            value={filters.country}
            onChange={(v) => change({ country: v })}
            options={meta.countries}
          />
          <Select
            label="Customer industry"
            value={filters.vertical}
            onChange={(v) => change({ vertical: v })}
            options={meta.buyers.map((b) => ({ value: b.id, label: b.label }))}
          />
          <button
            className={
              "button small " + (advanced ? "filter-active" : "secondary")
            }
            onClick={() => setAdvanced(!advanced)}
            aria-expanded={advanced}
          >
            <ListFilter size={15} />
            Filters
            {activeCount > 0 && (
              <span className="filter-count">{activeCount}</span>
            )}
          </button>
          {(activeCount > 0 || filters.search) && (
            <button className="text-button" onClick={reset}>
              Reset
            </button>
          )}
        </div>
        {advanced && (
          <div className="advanced-filters">
            <Select
              label="Tier"
              value={filters.tier}
              options={[
                { value: "A", label: "A · Priority" },
                { value: "B", label: "B · Other companies" },
              ]}
              onChange={(v) => change({ tier: v as Filters["tier"] })}
            />
            <Select
              label="Product type"
              value={filters.role}
              options={Object.keys(meta.roles).map((role) => ({
                value: role,
                label: productLabels[role] ?? role,
              }))}
              onChange={(v) => change({ role: v })}
            />
            <Select
              label="Ownership"
              value={filters.ownership}
              options={meta.ownership}
              onChange={(v) => change({ ownership: v })}
            />
            <Select
              label="Earnings evidence"
              value={filters.earnings}
              options={meta.earnings}
              onChange={(v) => change({ earnings: v })}
            />
            <Select
              label="Data quality"
              value={filters.evidence}
              options={meta.evidence}
              onChange={(v) => change({ evidence: v })}
            />
            <Select
              label="Analyst tag"
              value={tagFilter}
              options={allTags}
              onChange={(v) => {
                setTagFilter(v);
                setPage(1);
              }}
            />
            <div className="threshold">
              <Select
                label="Compare amount"
                allowAll={false}
                value={filters.metric}
                options={[
                  { value: "revenue_cents", label: "Revenue" },
                  { value: "valuation_cents", label: "Estimated value" },
                ]}
                onChange={(v) => change({ metric: v as Filters["metric"] })}
              />
              <label>
                Below (USD millions)
                <input
                  type="number"
                  min=".01"
                  step=".1"
                  aria-label="Maximum amount in USD millions"
                  value={filters.under ? filters.under / 100000000 : ""}
                  onChange={(e) =>
                    change({
                      under: e.target.value
                        ? Math.round(Number(e.target.value) * 100000000)
                        : null,
                    })
                  }
                />
              </label>
            </div>
          </div>
        )}
        {error && <ErrorBox error={error} />}
        <div className="mobile-table-tools">
          <button
            className="button secondary"
            onClick={() => setFullTable((v) => !v)}
          >
            {fullTable ? "Show compact rows" : "Show full comparison table"}
          </button>
          <small>
            {fullTable
              ? "Swipe sideways to see all columns and sorting controls."
              : "Open a company to see its source figures."}
          </small>
        </div>
        <div
          className={
            "table-container " + (fullTable ? "" : "compact-companies")
          }
          role="region"
          aria-label="Company results table"
          tabIndex={0}
          aria-busy={busy}
        >
          <table>
            <thead>
              <tr>
                <th aria-sort={sortOrder("ref_id")}>
                  <button onClick={() => sort("ref_id")}>
                    Account
                    <SortIcon
                      active={filters.sort === "ref_id"}
                      desc={filters.descending}
                    />
                  </button>
                </th>
                <th aria-sort={sortOrder("vertical_label")}>
                  <button onClick={() => sort("vertical_label")}>
                    Customer industry
                    <SortIcon
                      active={filters.sort === "vertical_label"}
                      desc={filters.descending}
                    />
                  </button>
                </th>
                <th>Product type</th>
                <th aria-sort={sortOrder("tier")}>
                  <button onClick={() => sort("tier")}>
                    Outreach tier
                    <SortIcon
                      active={filters.sort === "tier"}
                      desc={filters.descending}
                    />
                  </button>
                </th>
                <th className="numeric" aria-sort={sortOrder("revenue_cents")}>
                  <button onClick={() => sort("revenue_cents")}>
                    Annual revenue
                    <SortIcon
                      active={filters.sort === "revenue_cents"}
                      desc={filters.descending}
                    />
                  </button>
                </th>
                <th
                  className="numeric"
                  aria-sort={sortOrder("valuation_cents")}
                >
                  <button onClick={() => sort("valuation_cents")}>
                    Estimated business value
                    <SortIcon
                      active={filters.sort === "valuation_cents"}
                      desc={filters.descending}
                    />
                  </button>
                </th>
                <th>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {result?.accounts.map((a) => (
                <tr key={a.ref_id}>
                  <td>
                    <button
                      className="account-link"
                      onClick={() => open(a.ref_id)}
                    >
                      Account {a.ref_id}
                    </button>
                    <small>
                      {a.country}
                      {tags[a.ref_id]?.length
                        ? " · " + tags[a.ref_id].join(", ")
                        : ""}
                    </small>
                  </td>
                  <td>
                    <span className="vertical-cell">{customerIndustry(a)}</span>
                  </td>
                  <td>
                    <span
                      className={
                        "role-dot " +
                        (a.product_role === "Core workflow" ? "core" : "")
                      }
                    />
                    {productLabels[a.product_role] ?? a.product_role}
                  </td>
                  <td>
                    <Badge tone={a.tier === "A" ? "green" : "neutral"}>
                      {a.tier === "A" ? "A · Priority" : "B"}
                    </Badge>
                  </td>
                  <td className="numeric">
                    <span title={money(a.revenue_cents, true)}>
                      {money(a.revenue_cents)}
                    </span>
                    <small>
                      {a.revenue_cents === null
                        ? "Unreported"
                        : a.currency_basis === "Explicit"
                          ? "Explicit currency"
                          : "USD assumed"}
                    </small>
                  </td>
                  <td className="numeric">
                    <span title={money(a.valuation_cents, true)}>
                      {money(a.valuation_cents)}
                    </span>
                    <small>
                      {a.multiple}×{" "}
                      {a.peer_count ? "typical peer revenue" : "revenue"}
                    </small>
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={"Open account " + a.ref_id}
                      onClick={() => open(a.ref_id)}
                    >
                      <ArrowUpRight size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {result?.total === 0 && (
            <div className="empty">
              <Search size={28} />
              <h3>No companies match this view</h3>
              <p>
                {filterSummary
                  ? "Active filters · " + filterSummary + ". "
                  : ""}
                Remove one filter or reset the list.
              </p>
              <button className="button secondary" onClick={reset}>
                Reset filters
              </button>
            </div>
          )}
        </div>
        <div className="pagination">
          <span>{busy ? "Updating…" : "Amounts in USD"}</span>
          <div>
            <span>
              {result && result.total > 0
                ? (page - 1) * 20 +
                  1 +
                  "–" +
                  Math.min(page * 20, result.total) +
                  " of " +
                  number(result.total)
                : "0 results"}
            </span>
            <button
              aria-label="Previous page"
              className="icon-button"
              disabled={page === 1 || busy}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              aria-label="Next page"
              className="icon-button"
              disabled={!result || page * 20 >= result.total || busy}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
