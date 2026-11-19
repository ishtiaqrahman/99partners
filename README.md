# NinetyNine acquisition workbench

**Two buying decisions.** The supplied file contains 1,000 fictional companies. The brief describes an earlier 960-row file. We identified 150 companies to contact first. The first three-company option sells $14.999M a year and costs an estimated $29.998M. Of 7,736,267 affordable groups serving three different industries, 32 share the best sales and price. Companies 0196, 0453 and 0737 rank first after comparing the largest company’s share of the total price. [Explore the assignment](https://ninetynine-acquisition-workbench.imrahman.workers.dev/#view=assignment)

**How it works.** Keep the original fields and add cleaned ones. Use the brief’s exchange rates, the midpoint of sales ranges, and a flagged USD assumption for 501 of 886 usable sales figures. Tier A requires software that runs a main job for a known customer industry, independent ownership, and evidence of positive earnings. A company’s own statement of profit counts. Cash movement alone leaves earnings uncertain.

**Estimated prices.** Multiply annual sales by 3 for core software, 2 for add-ons, general-purpose or unclear products, and 1 for services or hardware. These are screening assumptions. For 114 missing amounts, use the middle sales figure among at least five similar companies, widening from the same customer and product to the same product, then the whole file. Those estimates are for pricing only. Either tier can enter the group search with industry-specific software and usable reported sales. Maximize sales under a strict $30M price limit. Break ties by lower total price, then purchase balance, then IDs. By default, a smaller largest purchase share comes first. The Combinations selector can instead favor the most even split across all three purchases.

**Run the ZIP.** Unzip it and open a terminal in the folder containing Makefile. With Python 3.11+ and Make installed, run each line in order. A successful test run ends with “passed.”

```sh
make setup
make analyze
make test
make demo
```

Open http://127.0.0.1:8000. The ZIP includes the built interface. For a GitHub checkout, place the supplied `candidate_companies_v9.csv` in a `data/` folder before running the commands above. Install Node 20.19+ and run `make web` before `make demo`. The four submitted CSVs are in `submission/`. Local reruns write to `outputs/current/`. Website budget changes explore separate scenarios. Import IDs as text to preserve leading zeros.

**Live edit.** Change the budget in `src/workbench/policy.py`, run `make analyze`, and open `outputs/current/top_10_groups.csv`. Cleaning is in `cleaning.py`, tier decisions in `analysis.py`, and group rules in `groups.sql`.

**AI use and next steps.** Codex helped plan, write, document and test the implementation. Automated checks compare the search with independently listed groups and exercise the browser. The optional hosted chat explains results. The analysis itself uses explicit rules. For a purchase decision, confirm reporting currencies and compare estimated prices with actual sales of similar businesses.
