"""The investment thesis in one place.

The pipeline and Method screen consume this metadata. Change these rules when
the investment thesis changes; the source CSV always remains intact.
"""

FX = {
    "USD": "1.00",
    "CAD": "0.70",
    "EUR": "1.10",
    "GBP": "1.30",
    "AUD": "0.65",
    "MXN": "0.05",
}
MULTIPLES = {
    "Core workflow": 3,
    "Vertical add-on": 2,
    "Horizontal software": 2,
    "Services / hardware": 1,
    "Unresolved": 2,
}
BUDGET_CENTS = 3_000_000_000
# Each tuple couples a stable buyer ID, a display name, and affirmative source
# language. Adjacent customer types remain separate only when their buyers differ.
BUYERS = [
    (
        "dental",
        "Dental practices",
        "independent dental practices",
        "practice management, charting",
    ),
    (
        "veterinary",
        "Veterinary clinics",
        "veterinary clinics",
        "practice management, medical records",
    ),
    (
        "public-works",
        "Municipal fleet & public works",
        "municipal fleet and public works departments",
        "fleet maintenance, work orders",
    ),
    (
        "hvac",
        "HVAC & plumbing contractors",
        "hvac and plumbing contractors",
        "dispatch, job scheduling",
    ),
    (
        "aviation",
        "Aviation operators & repair stations",
        "part 135 operators and part 145 repair stations",
        "maintenance tracking and faa compliance",
    ),
    (
        "courts",
        "Municipal & county courts",
        "municipal and county courts",
        "court case management",
    ),
    (
        "arcades",
        "Arcades & entertainment centres",
        "arcades and family entertainment centres",
        "point-of-sale, game-card",
    ),
    (
        "bingo",
        "Bingo halls & raffle operators",
        "charitable bingo halls and raffle operators",
        "raffle ticketing",
    ),
    (
        "hospice",
        "Home health & hospice agencies",
        "home health and hospice agencies",
        "clinical documentation, visit scheduling",
    ),
    (
        "utilities",
        "Municipal utilities",
        "municipal water and electric utilities",
        "utility billing",
    ),
    (
        "funeral",
        "Funeral homes & cemeteries",
        "funeral homes and cemeteries",
        "case management, plot mapping",
    ),
    (
        "food-processors",
        "Food processors",
        "meat, dairy and bakery processors",
        "production planning, batch costing",
    ),
    (
        "food-distributors",
        "Food distributors & packers",
        "food distributors and packers",
        "lot traceability",
    ),
    (
        "law",
        "Small law firms",
        "small law firms",
        "matter management, trust accounting",
    ),
    (
        "jails",
        "County jails & detention centres",
        "county jails and detention centres",
        "inmate management",
    ),
    ("marinas", "Marinas & boatyards", "marinas and boatyards", "slip reservations"),
    (
        "construction",
        "Specialty subcontractors",
        "specialty subcontractors",
        "job costing, estimating",
    ),
    (
        "hoa",
        "HOA & condo managers",
        "hoa and condo management companies",
        "association accounting",
    ),
    (
        "customs",
        "Customs brokers & freight forwarders",
        "customs brokers and freight forwarders",
        "customs entry filing",
    ),
    (
        "auto",
        "Independent auto repair shops",
        "independent auto repair shops",
        "shop management, estimates",
    ),
    (
        "schools",
        "K–12 school districts",
        "k-12 school districts",
        "student information, attendance",
    ),
    (
        "police",
        "Police & sheriff departments",
        "police and sheriff's departments",
        "records management and computer-aided dispatch",
    ),
    (
        "property",
        "Residential property managers",
        "residential property managers",
        "lease accounting",
    ),
    (
        "banks",
        "Credit unions & community banks",
        "credit unions and community banks",
        "loan origination",
    ),
    (
        "grain",
        "Grain elevators & agronomy retailers",
        "grain elevators and agronomy retailers",
        "grain accounting",
    ),
    (
        "dealers",
        "Equipment & vehicle dealers",
        "equipment and specialty vehicle dealers",
        "dealer management",
    ),
    (
        "behavioral",
        "Behavioral health clinics",
        "behavioral health and addiction clinics",
        "electronic health records",
    ),
    (
        "fuel",
        "Convenience stores & fuel stations",
        "convenience stores and fuel stations",
        "back-office, fuel pricing",
    ),
]
TIER_GATES = [
    "A confirmed customer vertical and core operational software.",
    "Explicit independent ownership; debt-only and grant-only financing qualify.",
    "Positive EBITDA, net income, or a positive profitability self-report.",
]
ASSUMPTIONS = [
    "Unmarked currency and bare $ use USD; headquarters does not determine reporting currency.",
    "Ranges use midpoints. Small bare decimals use millions; large integers use units.",
    "Valuations are illustrative enterprise values from revenue multiples, without market calibration.",
    "Missing revenue uses observed-only peers for valuation and stays outside the official grouping objective.",
    "Both tiers and vertical add-ons can enter grouping. Horizontal, services-only and unresolved products cannot.",
    "Groups contain exactly three distinct buyers and cost strictly below the cap. Accounts can recur across groups.",
    "Ties use lower valuation, then ordered account IDs. Founder age does not affect investment decisions.",
]
