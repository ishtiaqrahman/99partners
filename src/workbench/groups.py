"""Exact grouping shared by official outputs and isolated scenario calculations."""

from pathlib import Path
import time
import duckdb
from .policy import BUDGET_CENTS


def optimize(
    accounts,
    budget_cents=BUDGET_CENTS,
    uniform=False,
    explicit_only=False,
    core_only=False,
):
    """Search the entire eligible pool and return at most ten deterministic trios.

    Each call owns its DuckDB connection. Positive individual valuations at or
    above the cap can be safely removed before the three-way join.
    """
    started = time.perf_counter()
    selected = []
    for a in accounts:
        if a["grouping_status"] != "Eligible":
            continue
        if explicit_only and a["currency_basis"] != "Explicit":
            continue
        if core_only and a["product_role"] != "Core workflow":
            continue
        value = a["revenue_cents"] * 2 if uniform else a["valuation_cents"]
        if value < budget_cents:
            selected.append((a["ref_id"], a["vertical"], a["revenue_cents"], value))
    with duckdb.connect() as db:
        db.execute("SET threads=2")
        db.execute("SET memory_limit='512MB'")
        db.execute(
            "CREATE TABLE accounts (id VARCHAR, vertical VARCHAR, revenue BIGINT, valuation BIGINT)"
        )
        if selected:
            db.executemany("INSERT INTO accounts VALUES (?, ?, ?, ?)", selected)
        rows = db.execute(
            Path(__file__).with_name("groups.sql").read_text(), [budget_cents]
        ).fetchall()
    by_id = {a["ref_id"]: a for a in accounts}
    groups = []
    for rank, row in enumerate(rows, 1):
        members = []
        for ref in row[:3]:
            a = by_id[ref]
            members.append(
                dict(
                    id=ref,
                    vertical=a["vertical_label"],
                    tier=a["tier"],
                    revenue_cents=a["revenue_cents"],
                    revenue_high_cents=a.get("revenue_high_cents", a["revenue_cents"]),
                    multiple=2 if uniform else a["multiple"],
                    valuation_cents=a["revenue_cents"] * 2
                    if uniform
                    else a["valuation_cents"],
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
        qualifying_count=rows[0][5] if rows else 0,
        best_tie_count=rows[0][6] if rows else 0,
        pool_size=len(selected),
        elapsed_ms=round((time.perf_counter() - started) * 1000),
        parameters=dict(
            budget_cents=budget_cents,
            uniform=uniform,
            explicit_only=explicit_only,
            core_only=core_only,
        ),
    )
