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
          "We chose five as the minimum for a comparison group. Count companies with usable reported sales that serve the same industry and sell the same type of product. With five or more matches, use all of them. With zero to four, try the same product type across all industries. If that still gives fewer than five, use every company in the file with usable reported sales.",
        source: excerpt(
          "analysis.py",
          'if a["vertical"]:',
          'basis = "Dataset median"',
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
    short: "Check which companies qualify",
    title: "Which companies can enter the search?",
    purpose:
      "Before we try groups of three, the original analysis checks each company on its own.",
    parts: [
      {
        title: "Check who buys the software and how much it sells",
        explanation:
          "The code checks customer industry first, then software type, then reported sales. A return line records the first reason a company is set aside. A company that passes all three receives the label Eligible.",
        source: excerpt(
          "analysis.py",
          'if not account["vertical"]:',
          'return "Eligible"',
        ),
      },
      {
        title: "Check each company’s price against the budget",
        explanation:
          "Here, value is one company’s estimated purchase price. The < sign means strictly less than. At a $30M budget, a $30M company is already at the limit. The code adds only companies priced below the limit to the list it will try in groups.",
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
        title: "Check who each company sells to",
        explanation:
          "Think of a, b and c as the first, second and third company. JOIN puts the companies together so we can check them. The symbol <> means ‘is different from.’ In this code, vertical means type of customer.",
        examples: [
          "Say company a sells to dental practices and company b sells to bingo halls. If company c sells to food processors, the group passes this check.",
          "If company c also sells to dental practices, the group fails. Companies a and c sell to the same type of customer.",
          "The ID checks put the companies in order, such as 0001, 0002, 0003. That way, rearranging the same three companies cannot count as another group.",
        ],
        source: excerpt("groups.sql", "FROM accounts a", "JOIN accounts c"),
      },
      {
        title: "Add the three prices and compare them with the budget",
        explanation:
          "Valuation means estimated purchase price. The code adds the three prices and compares the total with the budget supplied in place of ?. The < sign means ‘less than.’",
        examples: [
          "$8M + $9M + $12M = $29M. This passes with a $30M budget.",
          "$8M + $9M + $13M = $30M. This fails because exactly $30M reaches the limit.",
        ],
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
    title: "Check that the buying rules work",
    purpose:
      "Before sharing the results, we check two rules with an example we can add up ourselves. A group needs exactly three companies, and their total price must be below the budget.",
    parts: [
      {
        title: "Compare the program’s answer with the expected answer",
        explanation:
          "The test gives the program three pretend companies with prices of 100, 100 and 99 cents. Each line that starts with assert checks what the program returned. If any answer differs from what we expect, the test fails.",
        source: excerpt(
          "test_analysis.py",
          "def test_cents_and_empty",
          "assert optimize(rows[:2]",
        ),
      },
      {
        title: "List the four files we share",
        explanation:
          "This code lists the four CSV files the analysis saves. The first three have one row per company. The last has one row per group. You can use the company IDs to trace a group back to its company records.",
        source: excerpt("pipeline.py", "FILES = [", "]"),
      },
    ],
  },
];
