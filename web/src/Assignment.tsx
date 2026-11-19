import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Building2,
  FileSpreadsheet,
  FileText,
  Landmark,
  Sailboat,
  Terminal,
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

/** The two decisions both start with the full cleaned spreadsheet. */
function AssignmentIllustration({
  total,
  priority,
}: {
  total: number;
  priority: number;
}) {
  return (
    <svg
      className="assignment-illustration"
      viewBox="0 0 420 188"
      role="img"
      aria-label={
        total +
        " cleaned companies feed two separate decisions, who to call and which groups fit."
      }
    >
      <g fill="none" stroke="#b0cbb8" strokeWidth="2">
        <path d="M126 94h30V48h40m-40 46v48h40" />
        <path d="m188 42 8 6-8 6m0 82 8 6-8 6" />
      </g>
      <g fill="#335d49" stroke="#8fb49a">
        <rect x="5" y="60" width="120" height="68" rx="9" />
        <rect x="198" y="17" width="214" height="64" rx="9" />
        <rect x="198" y="111" width="214" height="64" rx="9" />
      </g>
      <g fill="#fff" fontFamily="DM Sans, sans-serif" textAnchor="middle">
        <text x="65" y="90" fontSize="20">
          {number(total)}
        </text>
        <text x="65" y="111" fontSize="13">
          companies
        </text>
        <text x="305" y="45" fontSize="18">
          Who gets a call?
        </text>
        <text x="305" y="65" fontSize="13">
          {number(priority)} first-priority companies
        </text>
        <text x="305" y="140" fontSize="18">
          Which three fit?
        </text>
        <text x="305" y="161" fontSize="13">
          Up to 10 buying options
        </text>
      </g>
    </svg>
  );
}

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
        "Used comparable companies to estimate value. Excluded from combinations.",
      count: meta.missing_revenue,
      tone: "missing",
    },
  ];
  const suppliedFile = meta.input_name === "candidate_companies_v9.csv";

  return (
    <div className="assignment">
      <header className="assignment-hero">
        <div>
          <p className="assignment-kicker">Director of AI take-home</p>
          <h1>One company list. Two buying decisions.</h1>
          <p>
            A firm wants to buy software businesses. Who should it call first?
            If it buys three, which groups bring in the most annual sales for a
            combined price under $30 million?
          </p>
        </div>
        <AssignmentIllustration
          total={meta.total}
          priority={meta.tiers.A || 0}
        />
      </header>

      {suppliedFile && (
        <section className="opening-example">
          <h2>One company answers both questions</h2>
          <p>
            <a href="#view=assignment&account=0008">Company 0008</a> sells a
            giveaway tool to bingo halls. We would call it later because the
            tool is an optional extra. It can still help form the first buying
            group because we know its customers and its annual sales.{" "}
            <a href="#view=assignment&account=0053">Company 0053</a> earns a
            first call, but its sales are missing, so it cannot enter a group.
          </p>
        </section>
      )}
      <section className="assignment-section" aria-labelledby="exercises-title">
        <div className="assignment-section-heading">
          <h2 id="exercises-title">The two exercises</h2>
          <a className="assignment-link" href="#view=code">
            Follow the code step by step <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="assignment-exercises">
          <article className="assignment-panel exercise-card">
            <h3>
              <span>1</span> Clean and prioritize
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
              Choose what earns a company Tier A and give a short reason for
              every tier assignment.
            </p>
            <a className="assignment-link" href="#view=accounts">
              Open the company list <ArrowUpRight size={15} />
            </a>
          </article>
          <article className="assignment-panel exercise-card">
            <h3>
              <span>2</span> Estimate value and find groups
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
            <code>{meta.input_name}</code>
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
                <span key={tone} className={tone} style={{ flexGrow: count }} />
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
          <h2 id="submission-title">What’s in the submission</h2>
        </div>
        <div className="assignment-outputs">
          {outputs.map(({ file, title, detail }) => (
            <a
              className="assignment-panel"
              key={file}
              href={"/api/downloads/" + file}
            >
              <span className="output-icons">
                <FileSpreadsheet size={21} aria-hidden="true" />
                <ArrowDownToLine size={17} aria-hidden="true" />
              </span>
              <strong>{title}</strong>
              <small>{detail}</small>
            </a>
          ))}
        </div>
        <ul className="assignment-other-deliverables">
          <li>
            <Terminal size={19} aria-hidden="true" />
            <div>
              <strong>Runnable code</strong>
              <p>
                In the reviewer ZIP, open README.md for instructions. Source
                files are in src/workbench/.
              </p>
            </div>
          </li>
          <li>
            <FileText size={19} aria-hidden="true" />
            <div>
              <strong>One-page README</strong>
              <p>
                The ZIP includes the four submitted spreadsheets in submission/.
                Chat and the what-if budget controls are additional ways to
                explore the answers.
              </p>
            </div>
          </li>
        </ul>
      </section>
    </div>
  );
}
