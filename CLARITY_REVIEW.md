# Can a first-time reader explain the project?

Clarity review of the NinetyNine take-home · November 19, 2026

**An opening you can use**

 “We helped a buyer answer two questions about 1,000 fictional software companies. Who should get a call first? And if the buyer could buy three businesses for under $30 million altogether, which groups would bring in the most annual sales?”

**The biggest obstacle is the order of the explanation.** A visitor sees tiers, eligibility counts, filters and codes before seeing a single company go through those two decisions. Much of the explanation already exists. Move a real example forward, then let people inspect the rules, code and supporting files.

### Fix these first

1. **Chat gave a wrong answer about the result on screen.** On the $25M scenario, it treated $12.499M as a lower-ranked or possibly ineligible result. That figure is the annual sales of the first-ranked group for those settings. Give chat the applied settings and selected result, or have it ask which result the reader means.
2. **“Who to call” and “who can be in a group” look like one ranking.** Show company 0008 on the opening screen. It sells a giveaway tool to bingo halls. It gets Tier B for outreach and appears in the first group because it sells industry-specific software and reports sales. Company 0053 shows the reverse case. It earns Tier A and lacks the sales figure needed for grouping.
3. **Three numbers need three names.** For the original first group, put “Sales in one year · $14,999,000,” “Estimated price for all three · $29,998,000,” and “Room under $30 million · $2,000” together. This also explains why no part of the $30M is a sales target.
4. **The first-ranked group looks uniquely best.** I counted all qualifying groups using the submitted rules. **32** share the best displayed sales and price. The query sorts the IDs and returns ten. Put that explanation beside the first result. Generate the count for the applied settings before showing it for another scenario.
5. **Correct three misleading labels.** The method page calls 0004’s source label “aerospace,” although the file says “MRO.” The overlap list includes companies appearing only once. The README’s 26 minutes covers an earlier implementation session. The later work and the candidate’s own time need an honest accounting.

**Review coverage.** I opened all five live pages on desktop and phone, read all ten code lessons, inspected five company panels, tried filters and budget changes, and asked the live chat about the result on screen. I compared the supplied brief and dataset with the analysis code, four exported spreadsheets, README, and submission ZIP. The observations below come from that inspection. The teaching suggestions still need a first-time reader to try them.

## First visit and assignment

| Where a reader gets stuck | Specific change |
|---|---|
| The home screen opens on “Find companies to investigate.” It assumes the visitor knows who is investigating whom. | Open a first visit with the two buying questions, or give “Start with the assignment” first position on the existing screen. Keep direct links to Companies and Combinations for returning visitors. |
| The hero says “shortlist for outreach, then find groups.” The word “then” and the current illustration suggest the second exercise runs on the Tier A shortlist. | Draw one spreadsheet branching into two labeled paths. Left ends in “150 companies to contact first.” Right ends in “10 possible groups to buy.” Start both paths at the cleaned file. |
| The dataset section precedes the two exercises. A reader encounters currency counts before learning why sales matter. | Put the two questions and one worked answer above the dataset. Keep the three-way revenue bar. Caption it “Of all 1,000 companies, 385 state a currency, 501 need a currency assumption, and 114 have no usable sales figure.” |
| “Vertical,” “buyer” and “industry” can refer to different people in this story. | Use “the buyer” for the firm considering an acquisition. Use “the software’s customers” for the dental offices or bingo halls that use the product. Introduce “vertical” once as the industry those customers work in. |
| The user sees four-digit IDs and technical descriptions, with no reason for the missing company names. | Show one small row with three headings for the company ID, what it sells, and annual sales as entered. Explain that the spreadsheet identifies fictional businesses by ID. Use the same ID on the row, the company panel and the export. |
| The brief names 960 rows and the app uses 1,000. The current note records this well, but leaves room for the impression that cleaning created 40 companies. | Say “The instructions describe an earlier file. The supplied file contains 1,000 companies, and all 1,000 passed the ID checks.” Keep file names and the version detail alongside that statement. |
| The illustrated dental, jail and marina group looks like an actual result. “See the outreach list” also opens the company page without applying Tier A. | Label the icons “Example of three different customer industries.” For outreach, make the link open the 150 Tier A rows or call it “Open all companies.” |
| “What to submit” includes real CSV download buttons beside text instructing the reader to include a README and code. | Call this section “What’s in the submission.” Identify the four downloads and point to the README and source inside the reviewer ZIP. Separately label scenario tools and chat as additions to the assignment. |

**Keep** the two-exercise structure, the original v9 filename, the euro conversion, and the links to real source rows. Those details let someone check what the screen says.

[Open the Assignment page](https://ninetynine-acquisition-workbench.imrahman.workers.dev/#view=assignment)

## Companies, search and sorting

| Where a reader gets stuck | Specific change |
|---|---|
| The opening cards give 150 priority companies and 632 eligible companies. “A company can count in more than one category” leaves the size of the overlap unclear. | Use a two-by-two table under “How do these lists overlap?” Tier A has **141 eligible and 9 ineligible**. Tier B has **491 eligible and 359 ineligible**. Label eligibility “before applying the budget.” |
| The sentence box, the table search field and the chat bubble all accept typing. | Put a distinct purpose beside each. “Filter the list · companies in Canada,” “Find a row · enter 0004,” and “Ask why · why is 0004 Tier A?” Keep the filter preview and its choice between sales and estimated price. |
| A shortcut silently changes the population. With Canada selected I saw 269 companies. Clicking “Priority (Tier A)” cleared Canada and showed all 150 priority companies worldwide. | Keep the country when adding a tier, or label the shortcut “Show all Tier A companies.” Put active filters next to “Showing X of 1,000.” Say explicitly that the download contains the full dataset. |
| Under advanced filters, “Compare amount” offers “All” even with a dollar limit entered. In the hosted app a $1M limit showed 3 matches, then selecting “All” showed 1,000 while the limit still read 1. | Require one choice between “Annual sales” and “Estimated price” while a limit is present, or clear the limit when selecting “All.” Show the applied sentence beside the results, such as “Estimated price below $1 million.” |
| Little arrows carry the sort order, and the initial list is ordered by company ID. A first-time reader may treat row one as the highest priority. | Keep a short sort label beside the count, such as “Sorted by company ID” or “Highest annual sales first.” In no-match states, name the active filters and offer to remove one. |
**Sorting is a separate choice.** The A/B rule puts a company into a bucket. It gives no ordering within the 150 priority companies. Sorting those 150 by sales or estimated price answers a new question and can change which row is first.

[Open the company list](https://ninetynine-acquisition-workbench.imrahman.workers.dev/#view=accounts)

## Opening a company and checking the evidence

| Where a reader gets stuck | Specific change |
|---|---|
| “Account 0004,” “Unresolved,” “Positive self-report” and “Not met” give conclusions before the evidence. | Title the panel “Company 0004 · aviation maintenance software.” Put the source phrase beside each decision. “Family-owned” supports independence. “Profitable” is the company’s own statement. Use “Unknown from the file” where evidence is missing. |
| Company 0001 sells general-purpose software and 0060 gives a vague description. Both can display “Unresolved” as the customer industry. | Distinguish “Serves several industries” from “The description doesn’t say who buys it.” Show how both affect the group search. For 0008 explain that cash coming in can be positive while profit is still unknown. |
| A drawer for a group member shows the standard company estimate even after a different pricing rule is chosen. Tier, eligibility and the next question also appear far apart. | Mark the drawer price “Original estimate.” When opened from a scenario, show the scenario price alongside it if different. Put a two-line summary at the top giving outreach priority and group eligibility with one reason each. |
| Repeated figures under “Founded” and “Employees” look like duplicate records. Company 0001 has “~21” employees, and the normalized bounds are both 21. | Show one figure when the source and display agree. When they differ, label “As written” and “Used for comparison.” Preserve “about 21” in the visible wording. A saved view stores filters and sorting. A tag is a private note on one company. |
| A missing sales entry is summarized as “Unreported or unusable.” The raw source can say “n/a,” “unknown,” or be blank. | For 0012 show “As entered · n/a”, “Reported annual sales · unknown” and “Sales used for price estimate · $3.157M.” Let the reader see exactly which number came from similar companies. |
| “What to verify next” uses investor shorthand. Company 0004 asks the reader to validate recurring revenue, retention, and dependence on the core workflow. | Ask real questions a person could put to the owner. “How much of your sales comes from customers who pay again each year? How many customers renewed last year?” For 0002, ask which currency the 2–4M figure uses. |
| The evidence refers to a company ID and a source row as two different numbers. | Label them by purpose. “Company 0004 is on line 5 of the input spreadsheet, including the header.” Its ID follows it into every output even if the list is sorted differently. |

[Open company 0008](https://ninetynine-acquisition-workbench.imrahman.workers.dev/#view=accounts&account=0008)

## Read and compare the three-company results

**Show the actual answer before the settings.** At a 390 × 844 phone viewport, the original group card started about 1,242 pixels down the page. Someone can see a download and a budget editor before seeing the answer they came to understand. Put the three companies, sales, price and remaining budget first. Open “Try a different budget” on demand.

| Currently | What would teach the result |
|---|---|
| “Top combination by revenue” leads, and the tie explanation lives above the table further down. | Put “First of ten shown” beside the first group. The original search has **7,736,267 qualifying groups**, including **32 tied on the winning sales and price**. Company IDs determine which tied groups appear. A company can appear in several separate buying options. |
| Each member has two amounts and a small “2× →” annotation. | Give the three rows column headers and a total. Annual sales of $3.914M, $4.097M and $6.988M add to $14.999M. At 2× sales, their combined estimated price is $29.998M. Label the first two amounts in a format that can be read aloud. |
| Three Tier B add-ons at the top can look like a contradiction or a general endorsement of add-ons. | Explain the effect of our pricing assumption. Under this model, $1 of annual add-on sales costs $2, while $1 of core software sales costs $3. A sales-maximizing search on a fixed budget can therefore favor add-ons. Outreach also considers ownership and earnings. |
| The budget bar looks full. A $2,000 gap on a $30M scale is too small to see. | Keep the bar proportional and print “$2,000 below the limit” beside its end. At exactly $30M the group fails. Say that the purchase prices are estimates, so a small change in an input can change eligibility. |
| After a $25M run, “The original winner reaches or exceeds the revised budget” makes the reader do the subtraction. | Lead with “The original trio costs $29.998M, which is $4.998M over the new limit. The new first trio brings in $12.499M in annual sales, $2.5M less than before.” Keep the existing before-and-after table and mark downloads as original. |
| The range check gives two dollar figures without the outcome. | For the $25M group, 0066 reports 6–8M. At the midpoint the trio costs $24.998M. At the high end it costs $26.998M, **$1.998M over budget**. Label that an estimate for the three displayed companies. Re-ranking all groups would be a separate calculation. |
| The overlap list headed “Companies appearing repeatedly” contains counts of 1/10. In a zero-result scenario the app says the old companies were “Replaced,” even though there is no replacement group. | Show only counts above one or rename the list “Appearances in the ten groups.” For an empty result, say “No group of three fits these settings.” Show the number of candidates remaining and one setting to relax. |

[Open Combinations](https://ninetynine-acquisition-workbench.imrahman.workers.dev/#view=groups)

## How it works and the analytical assumptions

1. **Separate the three reading choices.** “Assignment,” “How it works” and “Code walkthrough” all describe the project. Give each one a distinct job. Try “What was asked,” “How we made decisions,” and “See the actual code.” Link a selected method step to the matching code lesson.
2. **Correct the source trail for company 0004.** The method example calls its industry label “aerospace.” The spreadsheet says **MRO**. Show that original text, then quote “maintenance tracking” and “repair stations” to explain why we classified it as aviation software.
3. **Explain why we chose each outreach rule.** Core software runs a customer’s main job. Independent ownership fits the kind of business we want to approach. Positive earnings give a first sign that the business can support itself. Label all three as our screening choices. The brief asks us to choose a rule.
4. **Separate uncertain ownership and earnings from a known negative fact.** A bank loan is borrowed money. A seed investor owns a share. A company saying “profitable” is evidence with a weaker basis than financial statements. Also, 61 rows say “Burning cash,” and the code labels them “Negative” earnings. Cash use alone cannot establish an accounting loss. Review that mapping and the wording together.
5. **Label the denominator and the stopping rule.** The Method page shows 74 exclusions for missing sales. Elsewhere the app correctly reports 114 companies with missing sales. Each company receives its first exclusion reason. Of those 114, 33 already failed the customer check and 7 the product check. The remaining 74 reached the sales check. A caption and a short count diagram would resolve this.
6. **Connect 632 to 544.** Of 1,000 companies, 368 fail the basic group rules and 632 pass. At the original budget, another 88 have an individual estimated value of at least $30M. That leaves 544 companies to try in groups. Keep counts of *companies* and counts of *groups* visibly separate.
7. **Explain units at the moment they matter.** “USD per unit of source currency” can become “1 euro counted as $1.10 in this exercise.” State that the brief supplies the exchange rates. Our choices cover unlabeled currencies, midpoints, the pricing multipliers and missing-sales estimates.
8. **Make the architecture agree with the code lesson.** On Cloudflare the method step points to the browser search, while the code guide shows SQL. Both exist. Draw “Python + DuckDB calculate the submitted files” on one line and “the dashboard reads those results and recalculates what-if settings in your browser” on the other. The optional chat reads the submission and company data on the server. Explain a snapshot as a saved copy of the results.
9. **Give the reader a way to check an assumption.** Replace a list of technical statements with a few expandable examples. “We assumed US dollars for 0002. Ask which currency it reported.” “We used a typical sales figure for 0012. Ask for its actual annual sales.” Keep source fingerprints and run IDs under “Identify this analysis run.”

[Open How it works](https://ninetynine-acquisition-workbench.imrahman.workers.dev/#view=method)

## Code walkthrough, exercise 1

The guide already pairs genuine source lines with explanations and opens real company records. Keep both. On a first reading, give the reader a fact to follow through those lines.

| Step | Gap | Suggested example or edit |
|---|---|---|
| 1 · Read the rows | The example shows a founding year, while the first code block checks IDs. “set(ids) counts each ID once” skips the part that does the counting. | Show two cards with ID 0004. “The file has two rows but only one distinct ID, so the run stops.” Then use 0002 to show “1979 (rebranded 1990)” becoming founding year 1979. Say that the unique-ID check passed for all 1,000 actual companies. |
| 2 · Clean revenue | The USD guess, the unit and the midpoint are three different decisions. A reader can see $3M without knowing which parts came from the file. | Write “2–4M → two to four million → midpoint three million → assume US dollars.” Beside it, show the different case “€2.0M × $1.10 per euro = $2.2M.” Explain that 501 of the 886 usable amounts needed a currency assumption. |
| 3 · Identify the customer | The code uses positions such as buyer[3]. The aviation description includes specialist abbreviations. The reader must infer what the rule actually recognized. | Highlight the exact words for **who uses it** and **what job it does** in the source sentence. Show a second description, 0060’s “Software solutions that help businesses run better.” Ask “Who uses it?” The text gives no clear answer. |
| 4 · Assign A or B | The example puts two statuses side by side without saying what changed the outcome. The source uses “positive” for several types of evidence. | Give 0004 and 0002 the same three questions with answers under each. Both run a main job and say they are profitable. 0004 is family-owned. 0002 took seed investment, which misses our independent-ownership rule. Highlight that one difference. |

**Plain wording to use elsewhere.** “Reported sales” means there was a usable amount in the source. That amount may still be a range or require a currency assumption. “Unknown” means the file did not establish the answer. Zero is a measured amount. Keep those meanings consistent in the spreadsheet, table and chat.

**Make the code easier to read.** Put the worked example immediately after the step title and beside the relevant snippet on wide screens. On phones, use the order example, rule, code. Start each explanation with what the line decides. Introduce a symbol or a programming term only when it helps trace that decision. Keep original file names and line numbers available for the interview.

[Open the cleaning lesson](https://ninetynine-acquisition-workbench.imrahman.workers.dev/#view=code&step=revenue)

## Code walkthrough, exercise 2

| Step | Gap | Suggested example or edit |
|---|---|---|
| 5 · Estimate a price | “3×” is easy to read as a growth forecast. | Put two labels on the equation “$2.2M in sales per year × 3 = $6.6M estimated price today.” We picked the multiplier as a rough model. The file contains no deal price. |
| 6 · Handle missing sales | We say 0012 had six peers but jump straight to $3.157M. The code excerpt shows how peers are selected, ending before the actual median calculation. | Show the six dental add-on sales in millions — 1.127, 2.000, **2.700**, **3.614**, 4.421, 13.554. Average the two middle values to get 3.157. Multiply by 2 for **$6.314M estimated value**. Leave reported sales blank. Pair the middle pair with its actual calculation lines. |
| 7 · Choose candidates | “Eligible” can sound like a purchase recommendation, a group member already selected, or a high-priority outreach target. | Use “can enter this search.” Put Tier B company 0008 beside Tier A company 0053. Ask which one has the reported sales the group search needs. Include the 1,000 → 632 → 544 company counts. |
| 8 · Build groups | “Three different customers” could mean three dental offices. “Same customer twice” has the same ambiguity. JOIN and <> ask the learner to translate syntax and learn the business rule at once. | Say “three different customer industries.” Use the four-company example below to explain a repeated industry, an exact-budget failure and a passing trio. Then point to the SQL lines that make those decisions. |
| 9 · Rank groups | The real winning table is valuable. The example never shows how a cheaper trio would break a sales tie because the displayed groups tie on both totals. | Use a teaching example with two groups that each sell $10M per year. One costs $21M and one $22M. The $21M group ranks first. Then show that the real first ten also tie on price, so IDs decide their order. |
| 10 · Check and export | A noncoder sees commands and assert statements without knowing what a successful run looks like. The four links give file names alone. | Read one test aloud. “299 cents fits under 300 cents. It fails a 299-cent limit.” Show the expected test outcome, the first row of the group spreadsheet, and a plain question beside each download. |

**A small diagram for Step 8.** Use four fictional teaching cards with estimated prices. A and B sell software to dentists and would cost $8M and $10M to buy. C sells to marinas and would cost $12M. D sells to jails and would cost $8M. Label those amounts “estimated price to buy each company.” A+B+D costs $26M and repeats dentistry. B+C+D costs exactly $30M and fails the budget rule. A+C+D costs $28M and passes both checks. Rearranging A+C+D still describes the same purchase option.

**Live edit.** Show the path from changing the budget in policy.py to rerunning make analyze and opening the new top_10_groups.csv. At $25M the new first group is 0007, 0066 and 0155. Distinguish this local rerun from changing a what-if setting in the browser. Point to analysis.py for the actual Tier A decision. Editing the descriptive list of criteria in policy.py alone will not change who gets Tier A.

[Open the grouping lesson](https://ninetynine-acquisition-workbench.imrahman.workers.dev/#view=code&step=trios)

## Chat, questions and answers

**What happened in the live review.** I applied the $25M budget, saw $12.499M in annual sales, and asked chat what the number meant and which companies it belonged to. The reply suggested it could be an ineligible or lower-ranked group and said only ten groups met the original rules. The scenario page identified the three companies. **0007, 0066 and 0155 rank first for the $25M scenario**. Independently counting the qualifying original groups confirms that ten is the display limit.

| Moment | What to change |
|---|---|
| Asking “why this?” from a page | Send the visible page, selected company or group, applied scenario and any pending edits as distinct fields. A response should say which settings it used. Until that context is available, ask for the budget or company ID before interpreting “this.” |
| Asking for a count or a winner | Give the assistant a computed result for the requested settings. Distinguish “all qualifying groups,” “top ten displayed,” and “current group.” For information it cannot retrieve, state what it needs. A free-text explanation should never infer a total from a ten-row sample. |
| Reading a source chip | Many answers link to the Assignment, the method page or a full CSV. Where possible, take the reader to the exact company, code step or applied scenario that supports the answer. A generic source link attached to an incorrect answer can increase misplaced confidence. |
| Opening chat for the first time | “Ask the workbench” and a locked input leave some visitors wondering whether they can use the dashboard at all. Try “Ask about the companies and results.” Explain who supplies the chat code and that exploring the pages needs no code. On the local edition, explain why the link opens hosted chat. |
| Choosing the first question | Keep “Why do the top 10 combinations tie?” The tested original-answer flow gave the right numbers and explained the shared 2× rule. Add one beginner prompt such as “Explain company 0004 in three sentences.” If the company or scenario is known, offer a question about that selection. |
| Leaving and returning | The conversation survives moving between pages and minimizing the bubble. Refreshing clears the conversation, while a successful access code can stay in that tab. Explain the distinction where “New chat” or refresh matters, without putting a long instruction on every page. |

**Acceptance check.** Leave the original result visible and ask “Why is this first?” Repeat after applying $25M, after selecting a different ranked group, and after only typing a new budget without calculating. In each case the response should name the same active settings and companies as the screen or explicitly request the missing context.

[Open the chat panel](https://ninetynine-acquisition-workbench.imrahman.workers.dev/#view=groups&chat=1)

## Readability, layout and useful visuals

| Observed issue | Proposed treatment |
|---|---|
| On the 390-pixel phone, the company table had 358 pixels of visible width for 1,000 pixels of columns. The group table had 358 for 734. Important price and sales columns require sideways scrolling. | Show the company ID, what it sells, tier, annual sales and estimated price in a compact mobile row or card. Keep the full comparison table available. Any retained sideways table needs a visible scroll cue. |
| The Step 8 worked example began roughly 1,305 pixels down the same phone. The first code-and-explanation pair began around 629. | Surface one short example immediately after the title. Collapse the full step menu on small screens while keeping previous, next and the active step easy to find. |
| The navigation wraps into two rows on phones. “How it works” and “Code walkthrough” compete for attention. The page title in the browser tab stays generic. | Give each page a distinct reader task and browser title. Test links and headings at narrow widths and at 200% zoom. Check that keyboard focus stays visible above the sticky navigation and clear of the chat bubble. |
| Some supporting text is both small and faint. On desktop the pagination caption measured **9 px** at roughly **3.0:1** contrast and the filename/status text **10 px** at roughly **3.2:1**. | Raise useful labels to a readable size and target at least 4.5:1 for ordinary text. Put secondary identifiers behind a details control. Keep direct text labels on bars, badges and controls. |
| Tooltips contain exact dollar amounts on several tables. People on touchscreens and people zooming the page may never see a hover title. | Put the exact figure in the opened detail, with the same sales/price label. For a budget decision show the exact remaining dollars without requiring hover. Keep both the amount and its meaning in plain text. |

**Three visuals earn their space.** First, draw the spreadsheet splitting into an outreach list and a group search. Second, put the two middle peer sales in outlined boxes so someone can calculate the median. Third, draw three seats with a customer-industry label and an estimated price on each card so the reader can try one passing and two failing groups. Use SVG if helpful. Give each visual a one-sentence text equivalent and keep every quantity readable without color.

**What can be shorter.** Keep the existing budget bar and before-and-after scenario table. A second budget chart adds little. Move source hashes, architecture labels and programming vocabulary behind details when the reader is trying to answer a business question. Keep them visible and copyable in the code guide.

## README, spreadsheets and interview handoff

1. **Open the README with the problem, two answers and one assumption.** At present it starts with Python, Make, file paths and hosting details. Give a reviewer who wants to read the answers a direct route to the live app or the submitted spreadsheets. Give a reviewer who wants to run the code a separate, short sequence. Keep the brief’s one-page limit in view.
2. **Correct the effort statement before submission.** The README describes a 26-minute implementation session, excludes planning and human review, and predates later dashboard, deployment, chat and guide work. Only the candidate can supply the missing time. If a precise total is unavailable, describe what was recorded and give an honest estimate if supportable. The brief’s two-hour expectation and the work actually done are separate facts.
3. **Explain how AI participated.** Name the coding and testing help received. Separately explain the optional hosted question-answering feature. The official tier, price and group calculations use explicit rules. Keep the candidate’s personally verified work distinct from checks that the automated process ran.
4. **Give the four files a reading order.** The cleaned file has 44 columns. Add a short column key outside the data rows. ref_id = company ID, revenue_usd = annual sales from the source after conversion, valuation_revenue_usd = sales used to estimate price, valuation_usd = estimated business price, headroom_usd = money left under budget. Mark original fields and calculated fields. Preserve the machine-readable headers.
5. **Show one row per file in plain words.** Use 0004 for the cleaned, tier and valuation files, then use 0008 + 0300 + 0533 for the group file. Explain that peer_count of 0 means the calculation used the company’s reported sales. An empty reported-sales cell means there was no usable figure. In the tier CSV, B shows the first reason the rule failed. The cleaned record retains all reasons.
6. **Distinguish three places a reviewer may open.** The reviewer package is ninety-nine-submission.zip. Its submission/ folder holds the four submitted CSVs. outputs/current/ holds regenerated files. The browser’s what-if settings do not rewrite either set. A single annotated example of importing company IDs as text will keep “0004” recognizable across files.
7. **Use real page names and point to the right code.** The README refers to “Method,” while the navigation says “How it works.” The general advice to edit policy.py is incomplete. Budget, rates and multipliers live there. Cleaning lives in cleaning.py, tier decisions in analysis.py, group constraints and ordering in groups.sql, and exports in pipeline.py. Label the deployment README and the internal implementation plan for their respective audiences.
8. **Give a noncoder one reproducible check.** Explain how to open a terminal in the extracted project folder, list prerequisites once, show one command per line, and state what success looks like. Emphasize separate paths for viewing the hosted app, running the compiled ZIP locally, and rebuilding a source checkout. Keep deployment credentials out of the reviewer’s normal path.

**Short language changes.** “Outreach priority” → “who to call first.” “Core workflow” → “software a customer uses to run its main job.” “Horizontal” → “sold across many industries.” “Peer median” → “middle sales figure among similar companies.” “Headroom” → “money left under the budget.” “Diligence” → “what to check before a purchase.” Keep the technical term beside the plain wording on first use so the candidate can recognize it in the interview.

## Suggested order and a reader check

**First, correct answers a reader could repeat incorrectly.** Fix chat’s scenario scope and top-ten claim. Correct 0004’s source label, the repeated-company list, the empty-result wording, and the ambiguous amount filter. Review the earnings label for “Burning cash” and the README effort statement.

**Next, change the first minute.** Put the two questions and one real company first. Label source facts, our assumptions and calculated answers at the point they meet. Move the first group ahead of its settings on phones. Reuse that story in the assignment overview, method page and opening of the code guide.

**Then, make each answer checkable.** Add the four-company group diagram and the six-company median. Link the current group to its evidence. Add the spreadsheet field key. Make abbreviations, sort order, filters and the scope of downloads clear where someone uses them.

### A 45-second interview explanation

“We got a spreadsheet of 1,000 fictional software companies. First I kept the original entries and made figures like annual sales comparable. One company reported €2 million. The assignment’s exchange rate made that $2.2 million. Then I answered two questions. For outreach I chose companies with software that runs a customer’s main job, independent ownership and evidence of earnings. That gave 150 companies to contact first. For the buying exercise I considered both tiers. I estimated prices and tried groups of three serving different customer industries. The first group shown sells $14.999 million a year and costs an estimated $29.998 million. Several groups tie, so I used the company IDs to choose a repeatable order.”

### How to tell whether the revision worked

Give the app to someone unfamiliar with investing and coding. Let them use the pages for five minutes, then ask these questions without coaching. A first-time reader has yet to try these tasks.

| Ask in ordinary language | What they should be able to explain or show |
|---|---|
| What two decisions does this project help someone make? | Who to call first, and which three-company purchase options have the most annual sales under the budget. |
| Can a company we would call later still be in the first buying option? | Yes. Show 0008, explain what it sells, and point to the separate group checks. |
| Which number is annual sales and which is the estimated price? | Point to $14.999M and $29.998M respectively, then explain the $2,000 gap. |
| If the sales figure is missing, what happens? | Point to 0012. Similar companies help estimate its purchase price. Its reported sales stay empty, so it cannot enter a group. |
| Why does this group come first, and what changes at $25M? | Explain the tie and ID rule. Show the new first trio and its $12.499M in annual sales. Identify which result a downloaded CSV contains. |
| Where would you check one claim or change one rule? | Open a company’s original evidence or the matching code step. Find the budget setting and the group spreadsheet it changes after a local rerun. |
