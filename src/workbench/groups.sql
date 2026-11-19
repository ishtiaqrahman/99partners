-- Give each possible trio one ordering, then keep only affordable trios.
WITH qualifying AS NOT MATERIALIZED (
    SELECT a.id AS id_1, b.id AS id_2, c.id AS id_3,
           a.revenue + b.revenue + c.revenue AS revenue_cents,
           a.valuation + b.valuation + c.valuation AS valuation_cents
    FROM accounts a
    JOIN accounts b ON a.id < b.id AND a.vertical <> b.vertical
    JOIN accounts c ON b.id < c.id AND a.vertical <> c.vertical AND b.vertical <> c.vertical
    WHERE a.valuation + b.valuation + c.valuation < ?
), displayed AS (
    SELECT * FROM qualifying
    ORDER BY revenue_cents DESC, valuation_cents ASC, id_1, id_2, id_3
    LIMIT 10
), best_totals AS (
    SELECT revenue_cents, valuation_cents FROM displayed
    ORDER BY revenue_cents DESC, valuation_cents ASC LIMIT 1
), counts AS (
    -- Count the whole search before the display limit, including tied alternatives.
    SELECT count(*) AS qualifying_count,
           count(*) FILTER (WHERE q.revenue_cents = best.revenue_cents
                              AND q.valuation_cents = best.valuation_cents) AS best_tie_count
    FROM qualifying q CROSS JOIN best_totals best
)
SELECT displayed.*, counts.* FROM displayed CROSS JOIN counts
ORDER BY revenue_cents DESC, valuation_cents ASC, id_1, id_2, id_3
