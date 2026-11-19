-- Give each possible trio one ordering, then keep only affordable trios.
WITH qualifying AS NOT MATERIALIZED (
    SELECT a.id AS id_1, b.id AS id_2, c.id AS id_3,
           a.revenue + b.revenue + c.revenue AS revenue_cents,
           a.valuation + b.valuation + c.valuation AS valuation_cents,
           CASE WHEN ? = 'all_shares' THEN
               a.valuation::HUGEINT * a.valuation
             + b.valuation::HUGEINT * b.valuation
             + c.valuation::HUGEINT * c.valuation
           ELSE greatest(a.valuation, b.valuation, c.valuation)
           END AS balance_rank
    FROM accounts a
    JOIN accounts b ON a.id < b.id AND a.vertical <> b.vertical
    JOIN accounts c ON b.id < c.id AND a.vertical <> c.vertical AND b.vertical <> c.vertical
    WHERE a.valuation + b.valuation + c.valuation < ?
), displayed AS (
    SELECT * FROM qualifying
    -- Equal group prices share a denominator, so compare exact cents or squared cents.
    ORDER BY revenue_cents DESC, valuation_cents ASC, balance_rank ASC, id_1, id_2, id_3
    LIMIT 10
), best_totals AS (
    SELECT revenue_cents, valuation_cents, balance_rank FROM displayed
    ORDER BY revenue_cents DESC, valuation_cents ASC, balance_rank ASC LIMIT 1
), counts AS (
    -- Count the whole search before the display limit, including tied alternatives.
    SELECT count(*) AS qualifying_count,
           count(*) FILTER (WHERE q.revenue_cents = best.revenue_cents
                              AND q.valuation_cents = best.valuation_cents
                              AND q.balance_rank = best.balance_rank) AS best_tie_count
    FROM qualifying q CROSS JOIN best_totals best
)
SELECT displayed.*, counts.* FROM displayed CROSS JOIN counts
ORDER BY revenue_cents DESC, valuation_cents ASC, balance_rank ASC, id_1, id_2, id_3
