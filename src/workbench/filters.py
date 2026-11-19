"""A small query language that translates analyst requests into visible filters.

This parser never executes code or SQL from user text. Unsupported words and
ambiguous monetary thresholds stay in the preview until the analyst resolves them.
"""

import re
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field
from .policy import BUYERS


class Filters(BaseModel):
    model_config = ConfigDict(extra="forbid")
    search: str = ""
    tier: Literal["", "A", "B"] = ""
    country: str = ""
    vertical: str = ""
    role: str = ""
    ownership: str = ""
    earnings: str = ""
    evidence: str = ""
    metric: Literal["revenue_cents", "valuation_cents"] = "valuation_cents"
    under: int | None = Field(default=None, gt=0, le=10**15)
    sort: Literal[
        "ref_id", "revenue_cents", "valuation_cents", "vertical_label", "tier"
    ] = "ref_id"
    descending: bool = False


def filter_accounts(accounts, filters):
    """Apply the same normalized filter object from manual controls or query text."""
    f = filters
    matches = []
    for a in accounts:
        text = " ".join(
            str(a[k]) for k in ("ref_id", "description", "industry", "vertical_label")
        ).casefold()
        if f.search and f.search.casefold() not in text:
            continue
        if any(
            getattr(f, field) and a[key] != getattr(f, field)
            for field, key in (
                ("tier", "tier"),
                ("country", "country"),
                ("vertical", "vertical"),
                ("role", "product_role"),
                ("earnings", "earnings_status"),
            )
        ):
            continue
        if f.ownership:
            status = a["ownership_status"]
            if f.ownership == "Independent" and not status.startswith("Independent"):
                continue
            if f.ownership != "Independent" and status != f.ownership:
                continue
        if f.evidence and f.evidence not in a["evidence_tags"]:
            continue
        if f.under is not None and (a[f.metric] is None or a[f.metric] >= f.under):
            continue
        matches.append(a)
    present = sorted(
        (a for a in matches if a[f.sort] is not None), key=lambda a: a["ref_id"]
    )
    present.sort(key=lambda a: a[f.sort], reverse=f.descending)
    return present + [a for a in matches if a[f.sort] is None]


def interpret(query):
    """Preview supported phrases, reporting every substantive unconsumed token."""
    text = query.casefold().strip().replace("–", "-")
    f, chips, issues = {}, [], []

    def consume(pattern):
        nonlocal text
        found = re.search(pattern, text)
        if found:
            text = text[: found.start()] + " " * len(found[0]) + text[found.end() :]
        return found

    tier = consume(r"\btier\s+([ab])\b")
    if tier:
        f["tier"] = tier[1].upper()
        chips.append("Tier " + tier[1].upper())
    countries = {
        "canada": r"canada|canadian",
        "united states": r"united states|american|usa",
        "united kingdom": r"united kingdom|british|uk",
        "germany": r"germany|german",
        "ireland": r"ireland|irish",
        "australia": r"australia|australian",
        "mexico": r"mexico|mexican",
        "india": r"india|indian",
    }
    for label, pattern in countries.items():
        if consume(r"\b(?:" + pattern + r")\b"):
            if "country" in f:
                issues.append("Choose one country.")
            f["country"] = label.title()
            chips.append(f["country"])
    aliases = {
        "dental": "dental",
        "veterinary": "veterinary",
        "marina": "marinas",
        "aviation": "aviation",
        "jail": "jails",
        "court": "courts",
        "hvac": "hvac",
        "school": "schools",
        "funeral": "funeral",
    }
    for buyer in BUYERS:
        patterns = [re.escape(buyer[1].casefold()), re.escape(buyer[2])]
        patterns += [r"\b" + k + r"s?\b" for k, v in aliases.items() if v == buyer[0]]
        if consume("|".join(patterns)):
            if "vertical" in f:
                issues.append("Choose one customer vertical.")
            f["vertical"] = buyer[0]
            chips.append(buyer[1])
    for role, pattern in [
        ("Core workflow", r"\bcore(?: workflow| software| products)?\b"),
        ("Vertical add-on", r"\b(?:vertical )?add-ons?\b"),
        ("Services / hardware", r"\bservices\b"),
        ("Horizontal software", r"\bhorizontal(?: software)?\b"),
    ]:
        if consume(pattern):
            if "role" in f:
                issues.append("Choose one product role.")
            f["role"] = role
            chips.append(role)
    if consume(r"\bcurrency assumed\b"):
        f["evidence"] = "Currency assumed"
        chips.append("Currency assumed")
    if consume(r"\bpeer estimates?\b"):
        f["evidence"] = "Peer estimate"
        chips.append("Peer estimate")
    if consume(r"\bindependent\b"):
        f["ownership"] = "Independent"
        chips.append("Independent ownership")
    if consume(r"\bcash.flow positive\b"):
        f["earnings"] = "Cash-flow positive"
        chips.append("Cash-flow positive")
    # Consume sorting before threshold words so 'highest revenue first' does not
    # accidentally disambiguate an unrelated 'valuation under' clause.
    order = consume(r"\b(highest|lowest)\s+(revenue|valuation)(?:\s+first)?\b")
    if order:
        f.update(sort=order[2] + "_cents", descending=order[1] == "highest")
        chips.append(order[1].title() + " " + order[2] + " first")
    amount = consume(
        r"(?:(revenue|valuation)\s+)?(?:under|below|less than)\s*\$?\s*(\d+(?:\.\d+)?)\s*(million|m|k)?\b"
    )
    if amount:
        metric = amount[1]
        if not metric:
            issues.append("Choose Revenue or Valuation for the monetary threshold.")
        else:
            scale = (
                1_000_000
                if amount[3] in {"m", "million"}
                else 1000
                if amount[3] == "k"
                else 1
            )
            from decimal import Decimal

            f.update(
                metric=metric + "_cents", under=int(Decimal(amount[2]) * scale * 100)
            )
            chips.append(metric.title() + " < USD " + amount[2] + (amount[3] or ""))
    text = re.sub(
        r"\b(show|me|all|accounts?|companies|in|with|and|the|please|software|by|sorted|sort|usd|ownership)\b",
        " ",
        text,
    )
    remainder = re.sub(r"[\s,.]+", " ", text).strip()
    if remainder:
        issues.append("Unsupported text: " + remainder)
    if not f:
        issues.append("Try a tier, country, customer vertical, or monetary filter.")
    return dict(
        filters=Filters(**f).model_dump(),
        chips=chips,
        issues=issues,
        applicable=bool(f) and not issues,
    )
