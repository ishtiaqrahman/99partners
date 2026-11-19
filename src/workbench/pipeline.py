"""Reproducible baseline generation and the command-line entry point.

A completed run is published through an atomic symlink swap. An interrupted
export leaves the last complete run available to downloads and reviewers.
"""

import argparse
from collections import Counter
import csv
import hashlib
import json
import os
from pathlib import Path
import tempfile
from uuid import uuid4

from .analysis import assess, value_accounts
from .groups import optimize
from .policy import ASSUMPTIONS, BUYERS, FX, MULTIPLES, TIER_GATES

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = ROOT / "data/candidate_companies_v9.csv"
REQUIRED = [
    "ref_id",
    "industry",
    "hq_location",
    "description",
    "year_founded",
    "founder_age",
    "employees",
    "revenue",
    "profitability",
    "ownership_funding",
]
FILES = [
    "cleaned_companies.csv",
    "company_tiers.csv",
    "company_valuations.csv",
    "top_10_groups.csv",
]


def load_accounts(path):
    """Read all source IDs once; malformed identities block downstream exports."""
    with Path(path).open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if not set(REQUIRED).issubset(reader.fieldnames or []):
            raise ValueError("Input requires columns: " + ", ".join(REQUIRED))
        rows = list(reader)
    if not rows:
        raise ValueError("Input contains no accounts.")
    ids = [r["ref_id"].strip() for r in rows]
    if any(not ref for ref in ids) or len(ids) != len(set(ids)):
        raise ValueError("Every account requires a unique, nonblank ref_id.")
    if any(None in r or any(v is None for v in r.values()) for r in rows):
        raise ValueError(
            "A source row has a different number of fields from the header."
        )
    for row, ref in zip(rows, ids):
        row["ref_id"] = ref
    accounts = value_accounts([assess(row, i + 2) for i, row in enumerate(rows)])
    return sorted(accounts, key=lambda a: a["ref_id"])


def identity(path):
    """Hash input and analysis source so cached artifacts cannot hide rule edits."""
    code = b"".join(p.read_bytes() for p in sorted(Path(__file__).parent.glob("*.py")))
    code += Path(__file__).with_name("groups.sql").read_bytes()
    source_hash = hashlib.sha256(Path(path).read_bytes()).hexdigest()
    return source_hash, hashlib.sha256(source_hash.encode() + code).hexdigest()[:16]


def csv_value(value, key):
    if isinstance(value, list):
        return " | ".join(str(x) for x in value)
    if key.endswith("_cents") and value is not None:
        # Export decimal USD, while keeping integer cents inside the engine.
        return f"{value // 100}.{value % 100:02d}"
    return value


def write_csv(path, rows):
    """Write stable columns and rows. Monetary columns are explicitly named USD."""
    keys = list(rows[0]) if rows else []
    with path.open("w", newline="", encoding="utf-8") as stream:
        writer = csv.writer(stream)
        writer.writerow([k.replace("_cents", "_usd") for k in keys])
        for row in rows:
            writer.writerow([csv_value(row[k], k) for k in keys])


def build(path=DEFAULT_INPUT, output=ROOT / "outputs"):
    """Compute the baseline and expose only a fully reconciled set of artifacts."""
    path, output = Path(path), Path(output)
    accounts = load_accounts(path)
    source_hash, run_id = identity(path)
    baseline = optimize(accounts)
    waterfall = dict(Counter(a["grouping_status"] for a in accounts))
    meta = dict(
        run_id=run_id,
        input_name=path.name,
        input_sha256=source_hash,
        total=len(accounts),
        tiers=dict(Counter(a["tier"] for a in accounts)),
        roles=dict(Counter(a["product_role"] for a in accounts)),
        eligibility=waterfall,
        eligible_by_tier=dict(Counter(a["tier"] for a in accounts if a["grouping_status"] == "Eligible")),
        missing_by_exclusion=dict(Counter(a["grouping_status"] for a in accounts if a["revenue_cents"] is None)),
        search_pool=baseline["pool_size"],
        missing_revenue=sum(a["revenue_cents"] is None for a in accounts),
        unparsed_revenue=sum(
            a["revenue_status"] in {"unparsed", "invalid"} for a in accounts
        ),
        assumed_currency=sum(a["currency_basis"] == "Assumed USD" for a in accounts),
        verticals=len({a["vertical"] for a in accounts if a["vertical"]}),
        fx=FX,
        multiples=MULTIPLES,
        tier_gates=TIER_GATES,
        assumptions=ASSUMPTIONS,
        buyers=[dict(id=b[0], label=b[1]) for b in BUYERS],
        files=FILES,
    )
    cleaned = [dict(a) for a in accounts]
    tiers = [
        dict(ref_id=a["ref_id"], tier=a["tier"], reason=a["tier_reason"])
        for a in accounts
    ]
    valuations = [
        {
            k: a[k]
            for k in (
                "ref_id",
                "revenue_cents",
                "valuation_revenue_cents",
                "valuation_basis",
                "peer_count",
                "multiple",
                "valuation_cents",
            )
        }
        for a in accounts
    ]
    groups = []
    for g in baseline["groups"]:
        row = dict(rank=g["rank"])
        for i, member in enumerate(g["members"], 1):
            row[f"account_{i}"] = member["id"]
            row[f"vertical_{i}"] = member["vertical"]
        total_price = g["valuation_cents"]
        shares = [member["valuation_cents"] / total_price for member in g["members"]] if total_price else []
        row.update(
            revenue_cents=g["revenue_cents"],
            valuation_cents=g["valuation_cents"],
            headroom_cents=g["headroom_cents"],
            largest_purchase_share_pct=round(100 * max(shares), 4) if shares else None,
            balance_all_three_score=round(150 * (1 - sum(share ** 2 for share in shares)), 4)
            if shares else None,
        )
        groups.append(row)
    # A real header survives zero feasible groups too.
    if not groups:
        group_keys = (
            ["rank"]
            + [k for i in range(1, 4) for k in (f"account_{i}", f"vertical_{i}")]
            + ["revenue_usd", "valuation_usd", "headroom_usd", "largest_purchase_share_pct", "balance_all_three_score"]
        )
    output.mkdir(parents=True, exist_ok=True)
    destination = output / run_id
    with tempfile.TemporaryDirectory(dir=output, prefix=".building-") as temp:
        temp_path = Path(temp)
        for name, rows in zip(FILES, (cleaned, tiers, valuations, groups)):
            if name == FILES[-1] and not rows:
                (temp_path / name).write_text(",".join(group_keys) + "\n")
            else:
                write_csv(temp_path / name, rows)
        snapshot = dict(accounts=accounts, meta=meta, baseline=baseline)
        (temp_path / "snapshot.json").write_text(json.dumps(snapshot, indent=2))
        if not destination.exists():
            try:
                os.rename(temp_path, destination)
            except FileExistsError:
                # A concurrent run published this same immutable identity first.
                # Its complete CSVs are equivalent, so it is safe to use that run.
                pass
    link = output / (".current-" + uuid4().hex)
    link.symlink_to(run_id, target_is_directory=True)
    os.replace(link, output / "current")
    return dict(accounts=accounts, meta=meta, baseline=baseline)


def main():
    parser = argparse.ArgumentParser(
        description="Generate the official acquisition screening outputs."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=ROOT / "outputs")
    args = parser.parse_args()
    try:
        result = build(args.input, args.output)
    except (ValueError, OSError) as exc:
        parser.exit(1, str(exc) + "\n")
    print(
        json.dumps(
            dict(
                run=result["meta"]["run_id"],
                accounts=result["meta"]["total"],
                tiers=result["meta"]["tiers"],
                eligible=result["meta"]["eligibility"],
                grouping_ms=result["baseline"]["elapsed_ms"],
                output=str(args.output / "current"),
            ),
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
