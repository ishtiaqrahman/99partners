"""Convert source text into usable fields without discarding evidence.

Money enters the rest of the application as integer USD cents. Every inferred
unit or currency is exposed in account details and the cleaned export.
"""

import re
from decimal import Decimal, ROUND_HALF_UP
from .policy import FX

MISSING = {"", "n/a", "unknown", "undisclosed", "confidential"}


def cents(value):
    """Round a Decimal dollar value once at the currency conversion boundary."""
    return int((Decimal(value) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def parse_revenue(raw):
    """Return USD low/base/high cents and the basis of the conversion.

    Missing or unsupported text retains a null observed amount. The caller may
    estimate revenue for valuation, but cannot use that estimate as reported data.
    """
    result = dict(
        revenue_cents=None,
        revenue_low_cents=None,
        revenue_high_cents=None,
        currency=None,
        currency_basis="Missing",
        scale_basis=None,
        fx_rate=None,
        revenue_status="missing",
        revenue_flags=[],
    )
    text = raw.strip()
    if text.casefold() in MISSING:
        return result
    text = text.replace("–", "-")
    match = re.match(r"^(US\$|C\$|USD|CAD|EUR|GBP|AUD|MXN|€|£|\$)\s*", text, re.I)
    marker = match.group(1).upper() if match else ""
    currency = {"US$": "USD", "C$": "CAD", "€": "EUR", "£": "GBP", "$": "USD"}.get(
        marker, marker or "USD"
    )
    basis = "Explicit" if marker and marker != "$" else "Assumed USD"
    text = text[match.end() :] if match else text
    approximate = text.startswith("~")
    text = text.lstrip("~").strip()
    parsed = re.fullmatch(
        r"(\d[\d,]*(?:\.\d+)?)(?:\s*-\s*(\d[\d,]*(?:\.\d+)?))?\s*(mm|m|k)?", text, re.I
    )
    if not parsed:
        result.update(revenue_status="unparsed", revenue_flags=["Unparsed revenue"])
        return result
    low = Decimal(parsed[1].replace(",", ""))
    high = Decimal((parsed[2] or parsed[1]).replace(",", ""))
    suffix = (parsed[3] or "").lower()
    if high < low or low <= 0:
        result.update(revenue_status="invalid", revenue_flags=["Invalid revenue range"])
        return result
    if suffix:
        scale = Decimal(1000 if suffix == "k" else 1_000_000)
        scale_basis = "Explicit " + suffix.upper()
    elif "." in parsed[1] and high < 100:
        scale, scale_basis = Decimal(1_000_000), "Assumed millions"
    elif low >= 1000 and "." not in parsed[1]:
        scale, scale_basis = Decimal(1), "Units"
    else:
        result.update(
            revenue_status="unparsed", revenue_flags=["Ambiguous revenue scale"]
        )
        return result
    flags = []
    if basis == "Assumed USD":
        flags.append("Currency assumed")
    if scale_basis == "Assumed millions":
        flags.append("Scale assumed")
    if parsed[2]:
        flags.append("Range midpoint")
    if approximate:
        flags.append("Approximate")
    rate = Decimal(FX[currency])
    result.update(
        revenue_cents=cents((low + high) / 2 * scale * rate),
        revenue_low_cents=cents(low * scale * rate),
        revenue_high_cents=cents(high * scale * rate),
        currency=currency,
        currency_basis=basis,
        scale_basis=scale_basis,
        fx_rate=FX[currency],
        revenue_status="parsed",
        revenue_flags=flags,
    )
    return result


def country(raw):
    """Resolve country from explicit geography, retaining ambiguous standalone codes."""
    text = raw.strip().casefold()
    if re.search(r"london,? (on|ontario)\b", text):
        return "Canada"
    if re.search(
        r"canada|\b(can|toronto|calgary|waterloo|winnipeg|halifax|laval|saskatoon|victoria)\b",
        text,
    ):
        return "Canada"
    if re.search(
        r"united kingdom|\bu\.?k\.?\b|england|manchester|leeds", text
    ) or text in {"london, uk", "london, england"}:
        return "United Kingdom"
    if re.search(r"germany|\bde\b|berlin|munich", text):
        return "Germany"
    if re.search(r"ireland|\bie\b|cork", text):
        return "Ireland"
    if re.search(r"australia|\bau\b|sydney|melbourne", text):
        return "Australia"
    if re.search(r"mexico|\bmx\b|monterrey|guadalajara", text):
        return "Mexico"
    if re.search(r"india|bengaluru|pune", text):
        return "India"
    if re.search(
        r"united states|\busa\b|\bus\b|u\.s\.|austin|boise|charlotte|columbus|denver|des moines|madison|nashville|omaha|phoenix|portland|raleigh|tampa|dublin.*\b(oh|ohio)\b",
        text,
    ):
        return "United States"
    return "Unknown"


def number_range(raw, kind="employees"):
    """Retain ranges for headcount and age; no inferred value drives the thesis."""
    text = raw.strip().lower()
    if text in MISSING:
        return None, None
    if kind == "age" and re.match(r"(early|mid|late) \d0s", text):
        decade = int(re.search(r"\d+", text)[0])
        offset = {"early": (0, 3), "mid": (4, 6), "late": (7, 9)}[text.split()[0]]
        return decade + offset[0], decade + offset[1]
    nums = re.findall(r"\d+", text)
    if not nums:
        return None, None
    return int(nums[0]), int(nums[1]) if len(nums) > 1 else int(nums[0])


def founding_year(raw):
    """Prefer the original year to a later rebrand; use a documented two-digit pivot."""
    match = re.search(r"\b(19\d{2}|20\d{2})\b", raw)
    if match:
        return int(match[0])
    match = re.search(r"'(\d{2})", raw)
    if match:
        value = int(match[1])
        return 2000 + value if value <= 26 else 1900 + value
    return None
