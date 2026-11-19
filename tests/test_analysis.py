"""Decision-focused tests, including an independent exact-ranking oracle."""

import csv
import hashlib
import itertools
import random
import pytest
from fastapi.testclient import TestClient

from workbench.cleaning import parse_revenue
from workbench.groups import optimize
from workbench.filters import Filters, filter_accounts, interpret
from workbench.pipeline import build, load_accounts, DEFAULT_INPUT, FILES
from workbench.api import create_app


@pytest.mark.parametrize(
    "source,expected",
    [
        ("CAD 6.2M", 434000000),
        ("€2.0M", 220000000),
        ("£1.8M", 234000000),
        ("AUD 4.0M", 260000000),
        ("MXN 312.2M", 1561000000),
        ("3,914K", 391400000),
        ("US$3,446,000", 344600000),
        ("USD 2.2 mm", 220000000),
        ("8.8", 880000000),
        ("7866000", 786600000),
        ("2-4M", 300000000),
    ],
)
def test_money(source, expected):
    assert parse_revenue(source)["revenue_cents"] == expected


@pytest.mark.parametrize(
    "source",
    [
        "unknown",
        "",
        "n/a",
        "undisclosed",
        "CAD -2M",
        "0M",
        "4-2M",
        "JPY 10M",
        "2M USD CAD",
        "43",
    ],
)
def test_unusable_revenue(source):
    assert parse_revenue(source)["revenue_cents"] is None


@pytest.fixture(scope="module")
def accounts():
    return load_accounts(DEFAULT_INPUT)


def test_real_decisions(accounts):
    by_id = {a["ref_id"]: a for a in accounts}
    assert all(a["earnings_status"] == "Using cash · earnings unknown" for a in accounts if a["profitability"] == "Burning cash")
    assert len(by_id) == 1000
    assert sum(a["revenue_cents"] is None for a in accounts) == 114
    assert sum(a["currency_basis"] == "Assumed USD" for a in accounts) == 501
    assert by_id["0004"]["tier"] == by_id["0019"]["tier"] == "A"
    assert by_id["0001"]["product_role"] == "Horizontal software"
    assert by_id["0002"]["founding_year"] == 1979
    assert by_id["0002"]["revenue_low_cents"] == 200000000
    assert by_id["0012"]["revenue_cents"] is None
    assert by_id["0012"]["peer_count"] >= 5
    assert by_id["0012"]["grouping_status"] != "Eligible"
    assert by_id["0034"]["product_role"] == "Services / hardware"
    assert by_id["0034"]["vertical"] == "dealers"
    assert by_id["0060"]["vertical"] is None
    assert all(a["valuation_cents"] > 0 for a in accounts)


def fixture(records):
    return [
        dict(
            ref_id=i,
            vertical=v,
            vertical_label=v,
            tier="B",
            revenue_cents=r,
            valuation_cents=c,
            grouping_status="Eligible",
            currency_basis="Explicit",
            product_role="Core workflow",
            multiple=3,
            evidence_tags=[],
        )
        for i, v, r, c in records
    ]


def oracle(accounts, cap):
    # Independent Python enumeration intentionally shares no optimizer predicates.
    scored = []
    for trio in itertools.combinations(sorted(accounts, key=lambda a: a["ref_id"]), 3):
        if len({a["vertical"] for a in trio}) < 3:
            continue
        total_cost = sum(a["valuation_cents"] for a in trio)
        if total_cost >= cap:
            continue
        revenue = sum(a["revenue_cents"] for a in trio)
        scored.append((-revenue, total_cost, tuple(a["ref_id"] for a in trio)))
    return sorted(scored)[:10]


def test_known_winner():
    rows = fixture(
        [
            ("A", "dental", 5, 13),
            ("B", "dental", 6, 14),
            ("C", "marinas", 4, 9),
            ("D", "jails", 4, 8),
            ("E", "courts", 3, 7),
            ("F", "courts", 3, 7),
        ]
    )
    groups = optimize(rows, 30)["groups"]
    assert groups[0]["ids"] == ["B", "D", "E"]
    assert groups[1]["ids"] == ["B", "D", "F"]
    assert ["A", "C", "D"] not in [g["ids"] for g in groups]
    assert ["A", "B", "E"] not in [g["ids"] for g in groups]


@pytest.mark.parametrize("seed", range(8))
def test_matches_exhaustive_oracle(seed):
    rng = random.Random(seed)
    rows = fixture(
        [
            (
                f"{i:04}",
                str(rng.randrange(5)),
                rng.randrange(1, 40),
                rng.randrange(1, 50),
            )
            for i in range(18)
        ]
    )
    rng.shuffle(rows)
    groups = optimize(rows, 80)["groups"]
    actual = [
        (-g["revenue_cents"], g["valuation_cents"], tuple(g["ids"])) for g in groups
    ]
    assert actual == oracle(rows, 80)


def test_all_tied_groups_are_counted_before_display_limit():
    # Six distinct industries give 20 possible trios. Equal sales and prices
    # make all 20 joint winners even though the spreadsheet has just ten rows.
    rows = fixture([(str(i), str(i), 10, 20) for i in range(6)])
    result = optimize(rows, 61)
    assert result["qualifying_count"] == result["best_tie_count"] == 20
    assert len(result["groups"]) == 10
    empty = optimize(rows, 60)
    assert empty["qualifying_count"] == empty["best_tie_count"] == 0


def test_cents_and_empty():
    rows = fixture([("a", "a", 10, 100), ("b", "b", 10, 100), ("c", "c", 10, 99)])
    assert len(optimize(rows, 300)["groups"]) == 1
    assert optimize(rows, 299)["groups"] == []
    assert optimize(rows[:2], 300)["groups"] == []


def test_queries(accounts):
    preview = interpret("Tier A in Canada, valuation under $15M, highest revenue first")
    assert preview["applicable"], preview
    manual = Filters(
        tier="A",
        country="Canada",
        under=1500000000,
        sort="revenue_cents",
        descending=True,
    )
    assert [
        a["ref_id"] for a in filter_accounts(accounts, Filters(**preview["filters"]))
    ] == [a["ref_id"] for a in filter_accounts(accounts, manual)]
    assert not interpret("Canadian companies under 10M")["applicable"]
    assert not interpret("Show companies with low churn")["applicable"]


def test_exports_and_scenarios(tmp_path):
    result = build(DEFAULT_INPUT, tmp_path)
    current = tmp_path / "current"
    before = {
        name: hashlib.sha256((current / name).read_bytes()).hexdigest()
        for name in FILES
    }
    for name in FILES[:3]:
        with (current / name).open() as f:
            assert len(list(csv.DictReader(f))) == 1000
    by_id = {a["ref_id"]: a for a in result["accounts"]}
    for g in result["baseline"]["groups"]:
        members = [by_id[i] for i in g["ids"]]
        assert len({a["vertical"] for a in members}) == 3
        assert (
            sum(a["valuation_cents"] for a in members)
            == g["valuation_cents"]
            < 3000000000
        )
        assert sum(a["revenue_cents"] for a in members) == g["revenue_cents"]
    build(DEFAULT_INPUT, tmp_path)
    assert before == {
        name: hashlib.sha256((current / name).read_bytes()).hexdigest()
        for name in FILES
    }
    with TestClient(create_app(DEFAULT_INPUT, tmp_path)) as client:
        assert client.get("/api/summary").json()["tiers"]["A"] == 150
        assert (
            client.post("/api/accounts", json={"filters": {"tier": "A"}}).json()[
                "total"
            ]
            == 150
        )
        assert (
            client.post(
                "/api/accounts", json={"filters": {"sort": "invalid"}}
            ).status_code
            == 422
        )
        assert (
            client.post("/api/scenarios", json={"budget_cents": 0}).status_code == 422
        )
        changed = client.post(
            "/api/scenarios", json={"budget_cents": 2500000000}
        ).json()
        assert changed["groups"][0]["valuation_cents"] < 2500000000
        with_estimates = client.post(
            "/api/scenarios", json={"include_estimated": True}
        ).json()
        assert with_estimates["estimated_pool_size"] == 74
        best = with_estimates["groups"][0]
        assert best["ids"] == ["0210", "0247", "0641"]
        assert best["valuation_cents"] == 2_999_900_000
        assert [
            (member["id"], member["revenue_cents"])
            for member in best["members"] if member.get("estimated_revenue")
        ] == [("0247", 713_050_000)]
        assert client.get("/api/accounts/0247").json()["revenue_cents"] is None
        assert client.get("/api/groups").json()["groups"][0]["ids"] == ["0008", "0300", "0533"]
        repriced = client.post(
            "/api/scenarios", json={"multiples_hundredths": {"Vertical add-on": 250}}
        ).json()
        assert repriced["comparison"]["original_cost_cents"] == 3749750000
        assert repriced["groups"][0]["ids"] != client.get("/api/groups").json()["groups"][0]["ids"]
        assert client.post("/api/scenarios", json={"multiples_hundredths": {"unknown": 250}}).status_code == 422
        assert client.post("/api/scenarios", json={"multiples_hundredths": {"Vertical add-on": 0}}).status_code == 422
        assert (
            client.post("/api/scenarios", json={"budget_cents": 1}).json()["groups"]
            == []
        )
        assert (
            len(
                list(
                    csv.DictReader(
                        client.get("/api/downloads/company_tiers.csv").text.splitlines()
                    )
                )
            )
            == 1000
        )
    assert before == {
        name: hashlib.sha256((current / name).read_bytes()).hexdigest()
        for name in FILES
    }


def test_failed_run_preserves_previous(tmp_path):
    build(DEFAULT_INPUT, tmp_path)
    before = (tmp_path / "current").resolve()
    bad = tmp_path / "bad.csv"
    bad.write_text("ref_id\n0001\n")
    with pytest.raises(ValueError):
        build(bad, tmp_path)
    assert (tmp_path / "current").resolve() == before


def test_addon_and_location_regression(accounts):
    by_id = {a["ref_id"]: a for a in accounts}
    assert by_id["0015"]["product_role"] == "Vertical add-on"
    for a in accounts:
        if a["hq_location"] in {"London ON", "London, ON"}:
            assert a["country"] == "Canada"
    independent = filter_accounts(accounts, Filters(ownership="Independent"))
    assert any(a["ownership_status"] == "Independent · debt only" for a in independent)
    assert all(a["ownership_status"].startswith("Independent") for a in independent)


def test_concurrent_publication(tmp_path):
    from concurrent.futures import ThreadPoolExecutor

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda _: build(DEFAULT_INPUT, tmp_path), range(2)))
    assert results[0]["meta"]["run_id"] == results[1]["meta"]["run_id"]
    assert (tmp_path / "current" / "snapshot.json").is_file()
    assert not list(tmp_path.glob(".current-*"))
