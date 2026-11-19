import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Code2,
  Download,
  Layers,
} from "lucide-react";
import { api, money, type Account, type GroupResult, type Meta } from "./types";
import { ErrorBox, number, productLabels } from "./common";
import { chapters, lessons } from "./assignment-lessons";
import { TrioExample } from "./TrioExample";
import "./walkthrough.css";

const linkTo = (step: string, account?: string) =>
  "#" +
  new URLSearchParams({
    view: "code",
    step,
    ...(account ? { account } : {}),
  }).toString();

/** A short input → decision → result trace lets an interviewer read the example
 * before looking at syntax. On small screens the same sequence runs vertically. */
function Trace({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="walk-trace">
      {items.map(([label, value], i) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
          {i + 1 < items.length && <ArrowRight size={15} aria-hidden="true" />}
        </div>
      ))}
    </dl>
  );
}

type Examples = {
  accounts: Account[];
  result: GroupResult;
  peerSales: number[];
};

function WorkedExample({
  step,
  meta,
  data,
}: {
  step: string;
  meta: Meta;
  data: Examples;
}) {
  const { accounts, result } = data;
  const record = (id: string) => accounts.find((a) => a.ref_id === id);
  const range = record("0002"),
    aviation = record("0004");
  const missing = record("0012");
  const inspect = (a: Account) => (
    <a className="walk-link" href={linkTo(step, a.ref_id)}>
      Inspect company {a.ref_id} <ArrowUpRight size={14} />
    </a>
  );
  const cap = result.parameters.budget_cents;
  const winner = result.groups[0];
  switch (step) {
    case "rows":
      return (
        <>
          <h3>Imagine the file lists company 0004 twice</h3>
          <p>
            Two rows would point to the same business. The ID check would stop
            us from counting its sales twice. In the supplied file, every
            company has its own ID.
          </p>
          {range && (
            <>
              <Trace
                items={[
                  ["Founding year as entered", range.year_founded],
                  [
                    "Year used for comparison",
                    range.founding_year ?? "Unknown",
                  ],
                  ["Company ID stays attached", range.ref_id],
                ]}
              />
              {inspect(range)}
            </>
          )}
          <p>
            For location, “London, ON” becomes Canada. For staff counts, “~21”
            means about 21 employees. We keep the original wording for both. The
            file passed the ID checks. All {number(meta.total)} companies made
            it into the cleaned dataset.
          </p>
        </>
      );
    case "revenue":
      return (
        <>
          <h3>Two ways a sales figure gets cleaned</h3>
          <p>
            In “2–4M,” M tells us the amount is in millions. We take the middle,
            three million. The entry gives no currency, so we record our choice
            of US dollars.
          </p>
          {range && (
            <>
              <Trace
                items={[
                  ["Original entry", range.revenue || "Blank"],
                  [
                    "Middle of the reported range",
                    range.revenue_low_cents !== range.revenue_high_cents
                      ? "(" +
                        money(range.revenue_low_cents) +
                        " + " +
                        money(range.revenue_high_cents) +
                        ") ÷ 2"
                      : range.currency_basis,
                  ],
                  ["Annual sales used", money(range.revenue_cents)],
                ]}
              />
              {inspect(range)}
            </>
          )}
          {aviation && (
            <>
              <Trace
                items={[
                  ["Original entry", aviation.revenue || "Blank"],
                  ["US dollars for one euro", aviation.fx_rate ?? "Unknown"],
                  ["Annual sales used", money(aviation.revenue_cents)],
                ]}
              />
              {inspect(aviation)}
            </>
          )}
          <p>
            {number(meta.total - meta.missing_revenue)} companies had usable
            sales. We assumed USD for {number(meta.assumed_currency)} of them.
            The other {number(meta.missing_revenue)} companies had no usable
            amount.
          </p>
          <details>
            <summary>How do bare numbers and missing entries work?</summary>
            <p>
              A small decimal such as 8.8 is treated as 8.8 million and flagged.
              A whole number such as 6988000 is read in units. A blank,
              “unknown,” or an unclear amount stays empty. The original text is
              kept for review.
            </p>
          </details>
        </>
      );
    case "buyer":
      return (
        <>
          <h3>Start with the company’s own words</h3>
          {aviation && (
            <>
              <p className="walk-quote">
                “
                {aviation.description
                  .split(
                    new RegExp(
                      "(" +
                        [aviation.buyer_evidence, aviation.product_evidence]
                          .filter(Boolean)
                          .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                          .join("|") +
                        ")",
                      "ig",
                    ),
                  )
                  .map((part, i) =>
                    i % 2 ? <mark key={i}>{part}</mark> : part,
                  )}
                ”
              </p>
              <Trace
                items={[
                  ["Customer industry", aviation.vertical_label],
                  ["What the software does", aviation.product_evidence],
                  [
                    "Product type",
                    productLabels[aviation.product_role] ||
                      aviation.product_role,
                  ],
                ]}
              />
              {inspect(aviation)}
            </>
          )}
          <p>
            Company 0060 says it helps businesses “run better.” That gives us no
            specific customer to record. The code identified{" "}
            {number(meta.verticals)} different customer industries in this file.
          </p>
        </>
      );
    case "tiers":
      return (
        <>
          <h3>Same product fit. Different owners.</h3>
          <div className="walk-verdicts">
            {[aviation, range].map(
              (a) =>
                a && (
                  <div key={a.ref_id}>
                    <strong>
                      Company {a.ref_id} · Tier {a.tier}
                    </strong>
                    <p>
                      It runs a main job. The file says “{a.profitability}.”{" "}
                      {a.ref_id === "0004"
                        ? "The family owns it, so all three checks pass."
                        : "It took money from a seed investor, so it misses our ownership check."}
                    </p>
                    {inspect(a)}
                  </div>
                ),
            )}
          </div>
          <p>
            Across the file, {number(meta.tiers.A || 0)} companies get the first
            call. The other {number(meta.tiers.B || 0)} go into Tier B.
          </p>
        </>
      );
    case "value":
      return (
        <>
          <h3>From annual sales to estimated price</h3>
          {aviation && (
            <>
              <Trace
                items={[
                  ["Revenue used", money(aviation.valuation_revenue_cents)],
                  [
                    productLabels[aviation.product_role] ||
                      aviation.product_role,
                    "× " + aviation.multiple,
                  ],
                  ["Estimated purchase price", money(aviation.valuation_cents)],
                ]}
              />
              {inspect(aviation)}
            </>
          )}
          <p>
            The multiplier is our judgment. To defend a real purchase price, we
            would want evidence such as how many customers pay again each year
            and how much money is left after costs.
          </p>
        </>
      );
    case "missing":
      return (
        <>
          <h3>What goes in the valuation column?</h3>
          {missing && missing.revenue_cents === null ? (
            <>
              <p>
                Company {missing.ref_id} lists its sales as “
                {missing.revenue || "blank"}.” Its reported sales field stays
                empty.
              </p>
              {data.peerSales.length > 0 && (
                <>
                  <p>
                    Annual sales of the comparable companies, from smallest to
                    largest
                  </p>
                  <ol className="median-strip">
                    {data.peerSales.map((v, i, all) => (
                      <li
                        key={i}
                        className={
                          i === Math.floor((all.length - 1) / 2) ||
                          i === Math.floor(all.length / 2)
                            ? "middle"
                            : ""
                        }
                      >
                        {money(v)}
                        {(i === Math.floor((all.length - 1) / 2) ||
                          i === Math.floor(all.length / 2)) && (
                          <small>Middle</small>
                        )}
                      </li>
                    ))}
                  </ol>
                  {data.peerSales.length % 2 === 0 && (
                    <p>
                      ({money(data.peerSales[data.peerSales.length / 2 - 1])} +{" "}
                      {money(data.peerSales[data.peerSales.length / 2])}) ÷ 2 ={" "}
                      <b>{money(missing.valuation_revenue_cents)}</b>.
                    </p>
                  )}
                </>
              )}
              <Trace
                items={[
                  ["Comparable companies", number(missing.peer_count)],
                  [
                    "Middle sales figure",
                    money(missing.valuation_revenue_cents),
                  ],
                  [
                    "Estimated price at " + missing.multiple + "×",
                    money(missing.valuation_cents),
                  ],
                ]}
              />
              {inspect(missing)}
            </>
          ) : (
            <p>
              For example, if five comparable companies report $1M, $2M, $3M,
              $4M and $8M, the middle value is $3M.
            </p>
          )}
          <p>
            A company with only estimated sales cannot contribute revenue to a
            winning group.
          </p>
        </>
      );
    case "pool":
      return (
        <>
          <h3>How many companies reach the search?</h3>
          <Trace
            items={[
              ["Companies in the file", number(meta.total)],
              [
                "Pass the buyer, product and sales checks",
                number(meta.eligibility.Eligible || 0),
              ],
              ["Also cost less than " + money(cap), number(result.pool_size)],
            ]}
          />
          <div className="walk-verdicts">
            {[record("0008"), record("0053")].map(
              (a) =>
                a && (
                  <div key={a.ref_id}>
                    <strong>
                      Company {a.ref_id} · Tier {a.tier}
                    </strong>
                    <p>
                      {a.grouping_status === "Eligible"
                        ? "Can enter. Its customers are known and it reported sales."
                        : "Cannot enter. Its annual sales are missing."}
                    </p>
                    {inspect(a)}
                  </div>
                ),
            )}
          </div>
        </>
      );
    case "trios":
      return (
        <>
          <h3>Which of these groups would you keep?</h3>
          <TrioExample />
          <details>
            <summary>
              Where would I change the budget in a live interview?
            </summary>
            <p>
              Open <code>src/workbench/policy.py</code> and find{" "}
              <code>BUDGET_CENTS</code>. The amount is in cents. For a $25M
              budget, set it to <code>2_500_000_000</code>. Run{" "}
              <code>make analyze</code> and compare the new first row in{" "}
              <code>outputs/current/top_10_groups.csv</code>. In the supplied
              file the new first row lists 0007, 0066 and 0155, with $12.499M in
              annual sales. This command changes the local files. A budget
              change on the website only changes your screen.
            </p>
          </details>
        </>
      );
    case "rank":
      if (!winner)
        return (
          <>
            <h3>No group qualifies in this run</h3>
            <p>
              The query returns zero rows when no three companies meet all the
              rules.
            </p>
          </>
        );
      return (
        <>
          <h3>Add up the first group in the submitted file</h3>
          <div className="walk-table-wrap">
            <table>
              <caption className="sr-only">
                Members of the first ranked group
              </caption>
              <thead>
                <tr>
                  <th scope="col">Company and customer</th>
                  <th scope="col">Annual sales</th>
                  <th scope="col">Estimated price</th>
                </tr>
              </thead>
              <tbody>
                {winner.members.map((m) => (
                  <tr key={m.id}>
                    <th scope="row">
                      <a className="walk-link" href={linkTo(step, m.id)}>
                        Company {m.id} <ArrowUpRight size={13} />
                      </a>
                      <span>{m.vertical}</span>
                    </th>
                    <td>{money(m.revenue_cents)}</td>
                    <td>{money(m.valuation_cents)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Total for three</th>
                  <td>{money(winner.revenue_cents)}</td>
                  <td>{money(winner.valuation_cents)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p>
            That leaves <b>{money(winner.headroom_cents)}</b> under the{" "}
            {money(cap)} budget. {number(result.best_tie_count)}{" "}
            {result.best_tie_count === 1 ? "group has" : "groups have"} the best
            sales and price. The table shows up to ten groups in order.
          </p>
          <p>
            <b>Try a tie.</b> Imagine two groups each sell $10M a year. One
            costs $21M and the other costs $22M. The $21M group comes first
            because it costs less.
          </p>
          <a className="walk-link" href="#view=groups">
            See the ranked groups <ArrowUpRight size={14} />
          </a>
        </>
      );
    default:
      return (
        <>
          <h3>Would $2.99 fit?</h3>
          <Trace
            items={[
              ["Prices for three companies", "$1 + $1 + $0.99"],
              ["With a $3 limit", "Yes · one cent left"],
              ["With a $2.99 limit", "No · exactly the limit"],
            ]}
          />
          <p>
            From the project folder, run <code>make test</code> to check the
            rules. A successful run ends with “passed.” Run{" "}
            <code>make analyze</code> to generate these four files in{" "}
            <code>outputs/current/</code>.
          </p>
          <div className="walk-files">
            {meta.files.map((file, i) => (
              <a key={file} href={"/api/downloads/" + file}>
                <Download size={14} />
                {
                  [
                    "What did we clean?",
                    "Who gets a call first?",
                    "What might each company cost?",
                    "Which three fit together?",
                  ][i]
                }{" "}
                · {file}
              </a>
            ))}
          </div>
        </>
      );
  }
}

/** Read one decision at a time. The URL identifies the current lesson so an
 * account drawer, refresh, or shared interview link returns to the same step. */
export default function CodeWalkthrough({
  requestedStep,
  meta,
}: {
  requestedStep: string;
  meta: Meta;
}) {
  const index = Math.max(
    0,
    lessons.findIndex((l) => l.id === requestedStep),
  );
  const lesson = lessons[index];
  const [data, setData] = useState<Examples | null>(null);
  const [error, setError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(lesson.id);
  useEffect(() => {
    let current = true;
    Promise.all([
      api<{ accounts: Account[] }>("accounts", {
        filters: {},
        ids: ["0002", "0004", "0008", "0012", "0053"],
        page: 1,
        page_size: 5,
      }),
      api<GroupResult>("groups"),
    ])
      .then(async ([rows, result]) => {
        const example = rows.accounts.find((a) => a.ref_id === "0012");
        let peerSales: number[] = [];
        if (
          example?.vertical &&
          example.valuation_basis === "Buyer + role median" &&
          example.peer_count <= 12
        ) {
          const peers = await api<{ accounts: Account[] }>("accounts", {
            filters: {
              vertical: example.vertical,
              role: example.product_role,
              sort: "revenue_cents",
              descending: false,
            },
            page: 1,
            page_size: 100,
          });
          peerSales = peers.accounts.flatMap((a) =>
            a.revenue_cents === null ? [] : [a.revenue_cents],
          );
          if (peerSales.length !== example.peer_count) peerSales = [];
        }
        if (current) setData({ accounts: rows.accounts, result, peerSales });
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [meta.run_id]);
  useEffect(() => {
    if (previousStep.current !== lesson.id) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "start" });
      previousStep.current = lesson.id;
    }
  }, [lesson.id]);
  return (
    <div className="walkthrough">
      <header className="walk-header">
        <h1>Assignment code, step by step</h1>
        <p>
          Follow two decisions from the spreadsheet to the answer. Who gets a
          call first? Which three companies bring in the most sales within the
          budget?
        </p>
      </header>
      <nav className="walk-contents" aria-label="Walkthrough steps">
        <div className="walk-chapters">
          {chapters.map((name, i) => {
            const first = lessons.find((l) => l.chapter === i)!;
            const Icon = i === 0 ? BookOpen : Layers;
            return (
              <a
                key={name}
                href={linkTo(first.id)}
                className={lesson.chapter === i ? "current" : ""}
              >
                <Icon size={22} aria-hidden="true" />
                <span>
                  <small>Exercise {i + 1}</small>
                  <strong>{name}</strong>
                </span>
              </a>
            );
          })}
        </div>
        <label className="mobile-step">
          Choose a step
          <select
            value={lesson.id}
            onChange={(e) => {
              location.hash = linkTo(e.target.value);
            }}
          >
            {lessons.map((l, i) => (
              <option key={l.id} value={l.id}>
                {i + 1}. {l.short}
              </option>
            ))}
          </select>
        </label>
        <ol>
          {lessons.map(
            (item, i) =>
              item.chapter === lesson.chapter && (
                <li key={item.id}>
                  <a
                    href={linkTo(item.id)}
                    aria-current={item.id === lesson.id ? "step" : undefined}
                  >
                    <span>{i + 1}</span>
                    {item.short}
                  </a>
                </li>
              ),
          )}
        </ol>
      </nav>
      <article className="walk-lesson">
        <header>
          <p className="walk-progress">
            Exercise {lesson.chapter + 1} · Step {index + 1} of {lessons.length}
          </p>
          <h2 ref={heading} tabIndex={-1}>
            {lesson.title}
          </h2>
          <p className="walk-purpose">{lesson.purpose}</p>
        </header>
        <section className="walk-example" aria-label="Worked example">
          {error ? (
            <ErrorBox error={error} />
          ) : data ? (
            <WorkedExample step={lesson.id} meta={meta} data={data} />
          ) : (
            <p role="status">Loading the worked example…</p>
          )}
        </section>
        <h3 className="walk-code-title">How the code does it</h3>
        {lesson.parts.map((part) => (
          <section className="walk-pair" key={part.title}>
            <div className="walk-explain">
              <h3>{part.title}</h3>
              <p>{part.explanation}</p>
            </div>
            <figure className="walk-code">
              <figcaption>
                <Code2 size={15} aria-hidden="true" />
                {part.source.path}
                <span>
                  {!part.source.first
                    ? "Updated source"
                    : part.source.first === part.source.last
                      ? "Line " + part.source.first
                      : "Lines " + part.source.first + "–" + part.source.last}
                </span>
              </figcaption>
              {part.source.first ? (
                <pre>
                  <code>{part.source.code}</code>
                </pre>
              ) : (
                <details>
                  <summary>The excerpt moved. Read the current file.</summary>
                  <pre>
                    <code>{part.source.code}</code>
                  </pre>
                </details>
              )}
            </figure>
          </section>
        ))}
      </article>
      <nav className="walk-pager" aria-label="Read the guide in order">
        {index > 0 && (
          <a href={linkTo(lessons[index - 1].id)}>
            <ArrowLeft size={16} />
            {lessons[index - 1].short}
          </a>
        )}
        {index + 1 < lessons.length ? (
          <a className="walk-next" href={linkTo(lessons[index + 1].id)}>
            Next · {lessons[index + 1].short}
            <ArrowRight size={16} />
          </a>
        ) : (
          <a className="walk-next" href="#view=groups">
            Explore combinations
            <ArrowRight size={16} />
          </a>
        )}
      </nav>
    </div>
  );
}
