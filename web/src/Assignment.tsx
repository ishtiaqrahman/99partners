import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Building2,
  FileSpreadsheet,
  Target,
  Layers,
  Landmark,
  Sailboat,

} from "lucide-react";
import { number } from "./common";
import { Meta } from "./types";
import "./assignment.css";

const outputs = [
  {
    file: "cleaned_companies.csv",
    title: "Cleaned dataset",
    detail: "One usable row per company",
  },
  {
    file: "company_tiers.csv",
    title: "A/B priority list",
    detail: "A tier and a reason for each company",
  },
  {
    file: "company_valuations.csv",
    title: "Valuation estimates",
    detail: "Estimated value for each company",
  },
  {
    file: "top_10_groups.csv",
    title: "Top 10 combinations",
    detail: "Ranked by total annual revenue",
  },
];

const industries = [
  { label: "Dental practices", icon: Building2 },
  { label: "County jails", icon: Landmark },
  { label: "Marinas", icon: Sailboat },
];

export function Assignment({ meta }: { meta: Meta }) {
  // The brief describes v8. The summary describes the file that actually ran.
  const revenueCoverage = [
    {
      label: "Currency stated",
      detail: "Used the stated currency and the brief’s exchange rates.",
      count: meta.total - meta.assumed_currency - meta.missing_revenue,
      tone: "stated",
    },
    {
      label: "Currency assumed",
      detail: "Treated unmarked amounts and bare $ as USD.",
      count: meta.assumed_currency,
      tone: "assumed",
    },
    {
      label: "No usable revenue",
      detail:
        "Used comparable companies to estimate value. The original group search uses reported sales.",
      count: meta.missing_revenue,
      tone: "missing",
    },
  ];
  const suppliedFile = meta.input_name === "candidate_companies_v9.csv";

  return (
    <div className="assignment">
      <header className="assignment-hero">
        <div>
          <h1>Acquisition workbench</h1>
          <p>Screen {number(meta.total)} software businesses for outreach and compare three-company purchases within your budget.</p>
        </div>
        <div className="overview-actions">
          <a href="#view=accounts&tier=A"><Target/><span><strong>Who to contact</strong><small>{number(meta.tiers.A || 0)} priority companies</small></span><ArrowRight/></a>
          <a href="#view=groups"><Layers/><span><strong>Which three to buy</strong><small>Compare groups under $30M</small></span><ArrowRight/></a>
        </div>
      </header>

      <section className="assignment-section" aria-labelledby="exercises-title">
        <div className="assignment-section-heading">
          <h2 id="exercises-title">Decision rules</h2>
          <a className="assignment-link" href="#view=code">
            Follow the code step by step <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="assignment-exercises">
          <article className="assignment-panel exercise-card">
            <h3>
              <Target size={20}/> Outreach priority
            </h3>
            <p>
              Make the data usable and document ambiguous choices. Use the
              exchange rates in the brief to convert revenue to USD.
            </p>
            <div
              className="assignment-conversion"
              aria-label="Example. Two million euros times 1.10 equals 2.2 million US dollars."
            >
              <div>
                <b>€2.0M</b>
                <small>Original revenue</small>
              </div>
              <div className="conversion-arrow">
                <small>× 1.10</small>
                <ArrowRight size={23} aria-hidden="true" />
              </div>
              <div>
                <b>$2.2M</b>
                <small>Revenue in USD</small>
              </div>
            </div>
            <div className="assignment-tier-grid">
              <div>
                <strong>A</strong>
                <span>Top outreach priority</span>
              </div>
              <div>
                <strong>B</strong>
                <span>All other companies</span>
              </div>
            </div>
            <p>
              Tier A requires core software for a specific industry, independent ownership and evidence of profit.
            </p>
            <a className="assignment-link" href="#view=accounts">
              Open the company list <ArrowUpRight size={15} />
            </a>
          </article>
          <article className="assignment-panel exercise-card">
            <h3>
              <Layers size={20}/> Purchase combinations
            </h3>
            <p>
              The file has no valuations. Estimate each company’s value and
              explain your assumptions. Find the 10 groups with the most
              combined annual revenue.
            </p>
            <p>Example of three different customer industries</p>
            <ul
              className="assignment-industries"
              aria-label="Example of three distinct customer industries"
            >
              {industries.map(({ label, icon: Icon }) => (
                <li key={label}>
                  <Icon size={22} aria-hidden="true" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <div className="assignment-cap">
              <strong>&lt; $30M</strong>
              <span>Combined estimated value in USD</span>
            </div>
            <p>
              Use exactly three companies per group, each serving a different
              customer vertical. A vertical is a specific type of customer, such
              as a dental practice.
            </p>
            <a className="assignment-link" href="#view=groups">
              Compare the results <ArrowUpRight size={15} />
            </a>
          </article>
        </div>
      </section>

      {suppliedFile && (
        <section className="opening-example">
          <h2>One company answers both questions</h2>
          <p>
            <a href="#view=assignment&account=0008">Company 0008</a> sells a
            giveaway tool to bingo halls. We would call it later because the
            tool is an optional extra. It can still enter the group search because we know its customers and annual sales.{" "}
            <a href="#view=assignment&account=0053">Company 0053</a> earns a
            first call, but its sales are missing, so it is excluded from the original search.
          </p>
        </section>
      )}
      <section className="assignment-section" aria-labelledby="dataset-title">
        <div className="assignment-section-heading">
          <h2 id="dataset-title">What we found in the dataset</h2>
          <a className="assignment-link" href="#view=accounts">
            Explore companies <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="assignment-data-grid">
          <article className="assignment-panel source-card">
            <FileSpreadsheet size={23} aria-hidden="true" />
            <strong>{number(meta.total)}</strong>
            <h3>Fictional companies</h3>
            <p>
              The instructions describe an earlier file with 960 companies. All{" "}
              {number(meta.total)} companies in{" "}
              {suppliedFile ? "the supplied v9 file" : "the loaded file"} passed
              the ID checks.
            </p>
            <code>{meta.input_name} · Run {meta.run_id.slice(0, 7)}</code>
            {suppliedFile && (
              <dl className="source-row-example">
                <div>
                  <dt>Company ID</dt>
                  <dd>0004</dd>
                </div>
                <div>
                  <dt>What it sells</dt>
                  <dd>Aviation maintenance software</dd>
                </div>
                <div>
                  <dt>Sales as entered</dt>
                  <dd>€2.0M</dd>
                </div>
              </dl>
            )}
            <p>
              Each row identifies a fictional business by a four-digit ID. It
              includes a product description, location, revenue, headcount,
              ownership, and profitability fields. Some fields are blank or
              ambiguous.
            </p>
          </article>
          <article className="assignment-panel">
            <h3>How were annual sales reported?</h3>
            <p>These three counts cover all {number(meta.total)} companies.</p>
            <div className="revenue-coverage" aria-hidden="true">
              {revenueCoverage.map(({ count, tone }) => (
                <span key={tone} className={tone} style={{ flexGrow: count }}>{Math.round(100 * count / meta.total)}%</span>
              ))}
            </div>
            <dl className="revenue-coverage-key">
              {revenueCoverage.map(({ label, detail, count, tone }) => (
                <div key={tone}>
                  <dt>
                    <i className={tone} />
                    <strong>{number(count)}</strong> {label}
                  </dt>
                  <dd>{detail}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
        <div className="assignment-observations">
          <article>
            <h3>Amounts came in different formats</h3>
            <p>
              A reported range of <b>2–4M</b> becomes <b>$3M</b> for analysis.
              We retain both ends of the range and flag the USD assumption.
            </p>
            {suppliedFile && (
              <a
                className="assignment-link"
                href="#view=assignment&account=0002"
              >
                See the source row <ArrowUpRight size={15} />
              </a>
            )}
          </article>
          <article>
            <h3>Customer industries needed interpretation</h3>
            <p>
              The analysis identified{" "}
              <b>{number(meta.verticals)} customer industries</b>. We used
              product descriptions to determine who buys the software, since the
              source industry label can be broader.
            </p>
            {suppliedFile && (
              <a
                className="assignment-link"
                href="#view=assignment&account=0004"
              >
                See the aviation example <ArrowUpRight size={15} />
              </a>
            )}
          </article>
          <article>
            <h3>Profitability labels varied</h3>
            <p>
              Some rows say <b>cash-flow positive</b>. We track that separately
              from positive earnings when assigning an outreach tier.
            </p>
            {suppliedFile && (
              <a
                className="assignment-link"
                href="#view=assignment&account=0008"
              >
                See the earnings evidence <ArrowUpRight size={15} />
              </a>
            )}
          </article>
        </div>
      </section>

      <section
        className="assignment-section"
        aria-labelledby="submission-title"
      >
        <div className="assignment-section-heading">
          <h2 id="submission-title">Original analysis exports</h2>
        </div>
        <div className="assignment-outputs">
          {outputs.map(({ file, title }) => (
            <a
              className="assignment-panel"
              key={file}
              href={"/api/downloads/" + file}
            >
              <FileSpreadsheet size={20}/><span><strong>{title}</strong><small>{file} · CSV</small></span><ArrowDownToLine size={17}/>
            </a>
          ))}
        </div>

      </section>
    </div>
  );
}
