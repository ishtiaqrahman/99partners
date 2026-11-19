import { excerpt } from "./assignment-source";

export const chapters = [
  "Who gets a call first?",
  "Which three companies fit?",
];

/** Each instruction sits beside lines from the runnable submission.
 * Examples use the same IDs, amounts and decisions as the results pages. */
export const lessons = [
  {
    id: "rows",
    chapter: 0,
    short: "Read the rows",
    title: "Give each company one place on the list",
    purpose:
      "A row is one company. Its four-digit ID lets us find that same company after the list is sorted.",
    parts: [
      {
        title: "Stop if two rows use the same ID",
        explanation:
          "Read the ID on each row. Count the rows, then count the different IDs. If the counts differ, an ID was used twice. A blank ID also stops the run.",
        source: excerpt(
          "pipeline.py",
          "ids = [r[",
          'raise ValueError("Every account',
        ),
      },
      {
        title: "Keep what the spreadsheet said",
        explanation:
          "Copy the row. Add easier-to-use fields beside it. For example, keep the full founding-date entry and add a field containing just the founding year. Do the same for location and number ranges.",
        source: excerpt(
          "analysis.py",
          "account = dict(raw)",
          "employees_high=",
        ),
      },
    ],
  },
  {
    id: "revenue",
    chapter: 0,
    short: "Clean sales",
    title: "Give sales figures a common unit",
    purpose:
      "Annual revenue means sales in one year. Before adding sales, we need to know the amount and the currency.",
    parts: [
      {
        title: "Which currency did the company use?",
        explanation:
          "The code recognizes symbols such as € for euros. When it sees only a $ sign, or no currency at all, it uses US dollars and records that guess.",
        source: excerpt("cleaning.py", "currency = {", 'basis = "Explicit"'),
      },
      {
        title: "What number should enter the calculation?",
        explanation:
          "For a range, add the low and high numbers and divide by two. Write the amount in full (3 million becomes 3,000,000), then convert it to US dollars. Save the two ends as well. Money is stored in cents so the budget check is exact.",
        source: excerpt(
          "cleaning.py",
          "rate = Decimal(FX",
          "revenue_high_cents=cents",
        ),
      },
    ],
  },
  {
    id: "buyer",
    chapter: 0,
    short: "Find the customer",
    title: "Who uses the software, and for what job?",
    purpose:
      "A customer industry, or vertical, is the kind of business that uses the product. A dental office and a repair station are two different customer industries.",
    parts: [
      {
        title: "Find words that name the customer",
        explanation:
          "Read the description and look for a phrase on our customer list. One clear match gives us an industry. If the words could mean several things, leave the customer unknown.",
        source: excerpt("analysis.py", 'text = " ".join', "evidence = buyer"),
      },
      {
        title: "Look for the main job the product helps with",
        explanation:
          "Each customer entry also lists a job. Here buyer[3] reads that job phrase. If the description contains it, we call the product core software. An optional extra, such as a birthday-card sender, can be an add-on.",
        source: excerpt(
          "analysis.py",
          "elif buyer:",
          'role, role_evidence = "Core workflow"',
        ),
      },
    ],
  },
  {
    id: "tiers",
    chapter: 0,
    short: "Choose who to call",
    title: "Put the first calls in Tier A",
    purpose:
      "We give a company first priority when we can answer yes to three questions.",
    parts: [
      {
        title: "Write down any check the company misses",
        explanation:
          "Does the software run a main job in one industry? Is the company independently owned? Does the file give evidence of positive earnings? A missing answer also goes on the list of reasons.",
        source: excerpt(
          "analysis.py",
          "reasons = []",
          'reasons.append("Earnings',
        ),
      },
      {
        title: "Use that list to give the company a tier",
        explanation:
          "An empty list means all three checks passed. Give that company A. If there is a reason on the list, give it B and keep the reason so someone can check the decision.",
        source: excerpt(
          "analysis.py",
          'account["tier"] =',
          'account["tier_reasons"] =',
        ),
      },
    ],
  },
  {
    id: "value",
    chapter: 1,
    short: "Estimate a price",
    title: "Turn one year of sales into a rough price",
    purpose:
      "The file gives no purchase prices. We chose a simple way to estimate what buying each business might cost.",
    parts: [
      {
        title: "Choose a number to multiply by",
        explanation:
          "Our model gives the highest number to software that runs a customer's main job because it may be harder to replace. We picked these numbers. Real deals would help us check them.",
        source: excerpt("policy.py", "MULTIPLES =", "}"),
      },
      {
        title: "Multiply and keep the numbers behind the answer",
        explanation:
          "Take the sales figure used for the estimate and multiply it by the number for this product. Save the result as the estimated price. Also save where the sales figure came from.",
        source: excerpt(
          "analysis.py",
          "valuation_revenue_cents=amount",
          "valuation_cents=amount *",
        ),
      },
    ],
  },
  {
    id: "missing",
    chapter: 1,
    short: "Fill a price gap",
    title: "Estimate a price when sales are missing",
    purpose:
      "We still owe the buyer a price estimate. Similar companies can help us make one. The missing company's reported sales stay blank.",
    parts: [
      {
        title: "Find companies we can compare",
        explanation:
          "Start with companies that reported sales, serve the same customer industry and sell the same type of product. Try for at least five. If there are too few, widen to the same product type, then to the whole file.",
        source: excerpt(
          "analysis.py",
          'if a["vertical"]:',
          'basis = "Buyer + role median"',
        ),
      },
      {
        title: "Take the middle of the list",
        explanation:
          "Sort the sales from smallest to largest. An odd number gives one middle figure. An even number gives two. Average that middle pair. This middle value is called the median.",
        source: excerpt(
          "analysis.py",
          "ordered = sorted(peers)",
          "else (ordered[middle",
        ),
      },
    ],
  },
  {
    id: "pool",
    chapter: 1,
    short: "Choose candidates",
    title: "Which companies can we try in a group?",
    purpose:
      "Now the question is how much three businesses sell together. Either outreach tier can enter the search.",
    parts: [
      {
        title: "Keep companies with a known industry, software and sales",
        explanation:
          "We need a specific type of customer, software for that industry and a usable sales figure from the file. When a check fails, save the first reason and stop checking that row.",
        source: excerpt(
          "analysis.py",
          'if not account["vertical"]:',
          'return "Eligible"',
        ),
      },
      {
        title: "Set aside companies that already cost too much",
        explanation:
          "Compare the price of one company with the whole budget. If it already costs the budget or more, adding two other companies cannot make the purchase affordable.",
        source: excerpt(
          "groups.py",
          "if value < budget_cents:",
          "selected.append",
        ),
      },
    ],
  },
  {
    id: "trios",
    chapter: 1,
    short: "Try groups of three",
    title: "Try three companies at a time",
    purpose:
      "Keep a group only if it serves three different customer industries and its three prices add up to less than the budget.",
    parts: [
      {
        title: "Fill three seats with three different industries",
        explanation:
          "The letters a, b and c stand for the three companies. JOIN brings their rows together. Each <> asks whether two industries differ. Reading the IDs in increasing order counts the same three companies just once.",
        source: excerpt("groups.sql", "FROM accounts a", "JOIN accounts c"),
      },
      {
        title: "Add the prices and check the limit",
        explanation:
          "The question mark holds the chosen budget. The < sign means “less than.” Even one cent below the limit passes this check. Exactly at the limit fails.",
        source: excerpt("groups.sql", "WHERE a.valuation"),
      },
    ],
  },
  {
    id: "rank",
    chapter: 1,
    short: "Sort the answers",
    title: "Which affordable group sells the most?",
    purpose:
      "Each group is a separate buying option. The same company can appear in several options.",
    parts: [
      {
        title: "Make two totals for each group",
        explanation:
          "Add the three annual sales figures. Separately, add the three estimated prices. The code gives these totals different names so we can compare groups.",
        source: excerpt(
          "groups.sql",
          "SELECT a.id",
          "a.valuation + b.valuation",
        ),
      },
      {
        title: "Sort, break ties, then show up to ten",
        explanation:
          "Highest sales come first. If two groups sell the same amount, put the cheaper one first. If both totals match, use the company IDs in order. LIMIT 10 takes the first ten rows of that sorted list.",
        source: excerpt(
          "groups.sql",
          "ORDER BY revenue_cents DESC,",
          "LIMIT 10",
        ),
      },
    ],
  },
  {
    id: "check",
    chapter: 1,
    short: "Check and save",
    title: "Check a known answer before sharing the files",
    purpose:
      "We can test the budget rule on three tiny numbers we can add by hand. Then we can trust what the same rule does with millions of dollars.",
    parts: [
      {
        title: "Ask the program to prove the example",
        explanation:
          "Each line starting with assert says what must be true. The test checks that the group appears at one limit and disappears at the other. A mismatch makes the test fail.",
        source: excerpt(
          "test_analysis.py",
          "def test_cents_and_empty",
          "assert optimize(rows[:2]",
        ),
      },
      {
        title: "Write the four answers to spreadsheets",
        explanation:
          "The first three files each have one row per company. The last file has one row per group. You can use the company IDs to follow a result back to the original spreadsheet.",
        source: excerpt("pipeline.py", "FILES = [", "]"),
      },
    ],
  },
];
