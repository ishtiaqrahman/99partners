"""Apply the screening thesis and valuation model to normalized accounts.

Classification uses affirmative customer and workflow phrases. Peer estimation
uses a frozen observed pool, so no imputed company influences another estimate.
"""

from .policy import BUYERS, MULTIPLES
from .cleaning import parse_revenue, country, founding_year, number_range


def classify(description):
    """Return customer and product evidence used in both tiering and grouping."""
    text = " ".join(description.casefold().split())
    matches = [b for b in BUYERS if b[2] in text]
    buyer = matches[0] if len(matches) == 1 else None
    evidence = buyer[2] if buyer else ""
    role, role_evidence = "Unresolved", "No clear product workflow"
    if any(
        s in text
        for s in (
            "consulting and implementation",
            "hardware and network",
            "it managed services",
        )
    ):
        role, role_evidence = (
            "Services / hardware",
            next(
                s
                for s in (
                    "consulting and implementation",
                    "hardware and network",
                    "it managed services",
                )
                if s in text
            ),
        )
    elif any(
        s in text
        for s in (
            "any industry",
            "across industries",
            "any company",
            "businesses of all sizes",
            "small and mid-sized companies",
            "email newsletter",
        )
    ):
        role, role_evidence = "Horizontal software", description
        buyer = None
    elif buyer:
        if buyer[3] in text:
            role, role_evidence = "Core workflow", buyer[3]
        elif any(
            s in text
            for s in (
                "app",
                "widget",
                "add-on",
                "optional",
                "sender",
                "theme pack",
                "sms service",
                "tool",
                "player",
                "email",
                "generator",
                "portal",
                "builder",
                "library",
            )
        ):
            role, role_evidence = "Vertical add-on", description
    return dict(
        vertical=buyer[0] if buyer else None,
        vertical_label=buyer[1] if buyer else "Unresolved",
        buyer_evidence=evidence,
        product_role=role,
        product_evidence=role_evidence,
    )


def ownership(raw):
    """Distinguish investor control from debt, grants, and independent ownership."""
    t = raw.casefold()
    if "subsidiary" in t or "acquired" in t:
        return "Acquired / subsidiary"
    if "minority" in t:
        return "Minority-backed"
    if any(
        s in t
        for s in (
            "pe-backed",
            "vc-backed",
            "series a",
            "seed round",
            "angel",
            "friends & family",
        )
    ):
        return "Equity-backed"
    if "bank term loan only" in t:
        return "Independent · debt only"
    if "grants" in t and "founder-owned" in t:
        return "Independent · grants only"
    if any(
        s in t
        for s in (
            "founder",
            "family-owned",
            "bootstrapped",
            "self-funded",
            "no outside investors",
        )
    ):
        return "Independent"
    return "Unconfirmed"


def earnings(raw):
    """Keep cash generation distinct from the field's earnings assertions."""
    t = raw.strip().casefold()
    if t == "cash-flow positive":
        return "Cash-flow positive"
    if "breakeven" in t:
        return "Breakeven"
    if "burning cash" in t:
        return "Using cash · earnings unknown"
    if any(s in t for s in ("loss", "ebitda -")) or t == "no":
        return "Negative"
    if "ebitda" in t:
        return "Positive EBITDA"
    if "net income" in t:
        return "Positive net income"
    if t in {"yes", "profitable"}:
        return "Positive self-report"
    return "Unknown"


def assess(raw, row_number):
    """Create a complete account record. Raw source values remain available."""
    account = dict(raw)
    account.update(parse_revenue(raw["revenue"]))
    account.update(classify(raw["description"]))
    account.update(
        country=country(raw["hq_location"]),
        founding_year=founding_year(raw["year_founded"]),
        employees_low=number_range(raw["employees"])[0],
        employees_high=number_range(raw["employees"])[1],
        founder_age_low=number_range(raw["founder_age"], "age")[0],
        founder_age_high=number_range(raw["founder_age"], "age")[1],
        ownership_status=ownership(raw["ownership_funding"]),
        earnings_status=earnings(raw["profitability"]),
        source_row=row_number,
    )
    reasons = []
    if account["product_role"] != "Core workflow" or not account["vertical"]:
        reasons.append("Product fit · " + account["product_role"].lower())
    if not account["ownership_status"].startswith("Independent"):
        reasons.append("Ownership · " + account["ownership_status"].lower())
    if not account["earnings_status"].startswith("Positive"):
        reasons.append("Earnings · " + account["earnings_status"].lower())
    account["tier"] = "B" if reasons else "A"
    account["tier_reasons"] = reasons
    account["tier_reason"] = (
        reasons[0] + "."
        if reasons
        else "Core vertical workflow; independent ownership; positive earnings evidence."
    )
    account["multiple"] = MULTIPLES[account["product_role"]]
    return account


def exclusion(account):
    """Assign one first-failing reason so the eligibility waterfall reconciles."""
    if not account["vertical"]:
        return "Unresolved / horizontal customer"
    if account["product_role"] not in {"Core workflow", "Vertical add-on"}:
        return "Services / unresolved product"
    if not account["revenue_cents"]:
        return "Missing / invalid observed revenue"
    return "Eligible"


def value_accounts(accounts):
    """Estimate every valuation from observed revenue or a transparent peer median.

    All monetary medians are rounded to the nearest cent. Original observed
    revenue stays null on estimated rows, keeping grouping eligibility honest.
    """
    observed = [a for a in accounts if a["revenue_cents"] is not None]
    if not observed:
        raise ValueError(
            "At least one valid observed revenue is required to estimate valuations."
        )
    for a in accounts:
        peers = []
        basis = "Observed revenue"
        amount = a["revenue_cents"]
        if amount is None:
            if a["vertical"]:
                peers = [
                    p["revenue_cents"]
                    for p in observed
                    if (p["vertical"], p["product_role"])
                    == (a["vertical"], a["product_role"])
                ]
            basis = "Buyer + role median"
            if len(peers) < 5:
                peers = [
                    p["revenue_cents"]
                    for p in observed
                    if p["product_role"] == a["product_role"]
                ]
                basis = "Product role median"
            if len(peers) < 5:
                peers = [p["revenue_cents"] for p in observed]
                basis = "Dataset median"
            # Integer arithmetic avoids Python's binary float at half-cent medians.
            ordered = sorted(peers)
            middle = len(ordered) // 2
            amount = (
                ordered[middle]
                if len(ordered) % 2
                else (ordered[middle - 1] + ordered[middle] + 1) // 2
            )
        a.update(
            valuation_revenue_cents=amount,
            valuation_basis=basis,
            peer_count=len(peers),
            valuation_cents=amount * a["multiple"],
            grouping_status=exclusion(a),
        )
        tags = list(a["revenue_flags"])
        if a["revenue_cents"] is None:
            tags.append("Peer estimate")
        if a["product_role"] == "Unresolved":
            tags.append("Product unresolved")
        a["evidence_tags"] = tags
        if a["revenue_cents"] is None:
            question = "How much did the company sell last year, and in which currency?"
        elif a["currency_basis"] != "Explicit":
            question = "Which currency is the stated revenue reported in?"
        elif a["revenue_low_cents"] != a["revenue_high_cents"]:
            question = (
                "Where within the reported revenue range is the latest annual result?"
            )
        elif not a["ownership_status"].startswith("Independent"):
            question = "Who owns the business and can agree to sell it?"
        else:
            question = "How much of last year’s sales came from returning customers? How many renewed this year?"
        a["diligence_question"] = question
    return accounts
