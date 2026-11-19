"""Exact grouping shared by official outputs and isolated scenario calculations."""

from pathlib import Path
import time
import duckdb
from .policy import BUDGET_CENTS


def scenario_price(account, uniform=False, multiples_hundredths=None):
    """Return the applied multiple and the valuation rounded to cents."""
    scale = (multiples_hundredths or {}).get(account["product_role"])
    if scale is None:
        scale = 200 if uniform else account["multiple"] * 100
    if scale == account["multiple"] * 100 and not uniform:
        return scale / 100, account["valuation_cents"]
    revenue = account["revenue_cents"] or account["valuation_revenue_cents"]
    return scale / 100, (revenue * scale + 50) // 100


def optimize(
    accounts,
    budget_cents=BUDGET_CENTS,
    uniform=False,
    explicit_only=False,
    core_only=False,
    multiples_hundredths=None,
    include_estimated=False,
    balance_method="largest_share",
):
    """Search the entire eligible pool and return at most ten deterministic trios.

    Each call owns its DuckDB connection. Positive individual valuations at or
    above the cap can be safely removed before the three-way join.
    """
    started = time.perf_counter()
    selected = []
    prices = {}
    estimated_pool_size = 0
    for a in accounts:
        estimated = a["grouping_status"] == "Missing / invalid observed revenue"
        if a["grouping_status"] != "Eligible" and not (include_estimated and estimated):
            continue
        if explicit_only and a["currency_basis"] != "Explicit":
            continue
        if core_only and a["product_role"] != "Core workflow":
            continue
        multiple, value = scenario_price(a, uniform, multiples_hundredths)
        if value < budget_cents:
            prices[a["ref_id"]] = (multiple, value)
            revenue = a["valuation_revenue_cents"] if estimated else a["revenue_cents"]
            selected.append((a["ref_id"], a["vertical"], revenue, value))
            estimated_pool_size += int(estimated)
    with duckdb.connect() as db:
        db.execute("SET threads=2")
        db.execute("SET memory_limit='512MB'")
        db.execute(
            "CREATE TABLE accounts (id VARCHAR, vertical VARCHAR, revenue BIGINT, valuation BIGINT)"
        )
        if selected:
            db.executemany("INSERT INTO accounts VALUES (?, ?, ?, ?)", selected)
        rows = db.execute(
            Path(__file__).with_name("groups.sql").read_text(), [balance_method, budget_cents]
        ).fetchall()
    by_id = {a["ref_id"]: a for a in accounts}
    groups = []
    for rank, row in enumerate(rows, 1):
        members = []
        for ref in row[:3]:
            a = by_id[ref]
            estimated = a["grouping_status"] == "Missing / invalid observed revenue"
            revenue = a["valuation_revenue_cents"] if estimated else a["revenue_cents"]
            members.append(
                dict(
                    id=ref,
                    vertical=a["vertical_label"],
                    tier=a["tier"],
                    revenue_cents=revenue,
                    revenue_high_cents=None if estimated else a.get("revenue_high_cents", revenue),
                    **({"estimated_revenue": True} if estimated else {}),
                    multiple=prices[ref][0],
                    valuation_cents=prices[ref][1],
                    flags=a["evidence_tags"],
                )
            )
        groups.append(
            dict(
                rank=rank,
                ids=list(row[:3]),
                members=members,
                revenue_cents=row[3],
                valuation_cents=row[4],
                headroom_cents=budget_cents - row[4],
            )
        )
    return dict(
        groups=groups,
        qualifying_count=rows[0][6] if rows else 0,
        best_tie_count=rows[0][7] if rows else 0,
        pool_size=len(selected),
        **({"estimated_pool_size": estimated_pool_size} if include_estimated else {}),
        elapsed_ms=round((time.perf_counter() - started) * 1000),
        parameters=dict(
            budget_cents=budget_cents,
            uniform=uniform,
            explicit_only=explicit_only,
            core_only=core_only,
            **({"balance_method": balance_method} if balance_method != "largest_share" else {}),
            **({"include_estimated": True} if include_estimated else {}),
            **({"multiples_hundredths": multiples_hundredths} if multiples_hundredths else {}),
        ),
    )
