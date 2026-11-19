"""Local application boundary shared by the compiled UI and reviewer requests.

The official snapshot is rebuilt at startup from the configured input. Scenario
requests compute in memory and never write the official export directory.
"""

from functools import lru_cache
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field
from .pipeline import build, DEFAULT_INPUT, FILES, ROOT
from .filters import Filters, filter_accounts, interpret
from .groups import optimize


class AccountQuery(BaseModel):
    model_config = ConfigDict(extra="forbid")
    filters: Filters = Field(default_factory=Filters)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=25, ge=1, le=100)
    ids: list[str] | None = Field(default=None, max_length=10000)


class QueryText(BaseModel):
    model_config = ConfigDict(extra="forbid")
    text: str = Field(max_length=500)


class Scenario(BaseModel):
    model_config = ConfigDict(extra="forbid")
    budget_cents: int = Field(default=3_000_000_000, gt=0, le=100_000_000_000)
    uniform: bool = False
    explicit_only: bool = False
    core_only: bool = False


def create_app(input_path=DEFAULT_INPUT, output_path=ROOT / "outputs"):
    """Create one read-only baseline and bounded scenario cache per app instance."""
    snapshot = build(input_path, output_path)
    accounts, meta, baseline = (snapshot[k] for k in ("accounts", "meta", "baseline"))
    by_id = {a["ref_id"]: a for a in accounts}
    app = FastAPI(title="NinetyNine Acquisition Workbench")

    @app.get("/api/summary")
    def summary():
        return meta | dict(
            countries=sorted({a["country"] for a in accounts}),
            ownership=sorted({a["ownership_status"] for a in accounts}),
            earnings=sorted({a["earnings_status"] for a in accounts}),
            evidence=sorted({t for a in accounts for t in a["evidence_tags"]}),
        )

    @app.post("/api/accounts")
    def account_list(query: AccountQuery):
        matches = filter_accounts(accounts, query.filters)
        if query.ids is not None:
            allowed_ids = set(query.ids)
            matches = [a for a in matches if a["ref_id"] in allowed_ids]
        offset = (query.page - 1) * query.page_size
        return dict(
            total=len(matches),
            accounts=matches[offset : offset + query.page_size],
            matching_ids=[a["ref_id"] for a in matches],
        )

    @app.get("/api/accounts/{ref_id}")
    def detail(ref_id: str):
        if ref_id not in by_id:
            raise HTTPException(404, "Account does not exist.")
        return by_id[ref_id]

    @app.post("/api/query")
    def query_text(query: QueryText):
        return interpret(query.text)

    @app.get("/api/groups")
    def groups():
        return baseline

    @lru_cache(maxsize=32)
    def run_scenario(budget_cents, uniform, explicit_only, core_only):
        return optimize(accounts, budget_cents, uniform, explicit_only, core_only)

    @app.post("/api/scenarios")
    def scenario(body: Scenario):
        result = run_scenario(**body.model_dump())
        comparison = None
        if baseline["groups"]:
            first = baseline["groups"][0]
            original = [by_id[i] for i in first["ids"]]
            cost = sum(
                a["revenue_cents"] * 2 if body.uniform else a["valuation_cents"]
                for a in original
            )
            excluded = any(
                (body.explicit_only and a["currency_basis"] != "Explicit")
                or (body.core_only and a["product_role"] != "Core workflow")
                for a in original
            )
            winner = result["groups"][0] if result["groups"] else None
            if excluded:
                reason = "The original winner fails the scenario's eligibility filters."
            elif cost >= body.budget_cents:
                reason = "The original winner reaches or exceeds the revised budget."
            elif winner and winner["ids"] == first["ids"]:
                reason = "The original winner remains optimal under these assumptions."
            elif winner and winner["revenue_cents"] > first["revenue_cents"]:
                reason = "Another trio delivers higher revenue under these assumptions."
            else:
                reason = "Revenue ties are resolved by lower valuation, then ordered account IDs."
            comparison = dict(
                reason=reason,
                original_cost_cents=cost,
                original_eligible=not excluded and cost < body.budget_cents,
                entered=sorted(
                    set(winner["ids"] if winner else []) - set(first["ids"])
                ),
                left=sorted(set(first["ids"]) - set(winner["ids"] if winner else [])),
                revenue_delta_cents=winner["revenue_cents"] - first["revenue_cents"]
                if winner
                else None,
            )
        return result | dict(comparison=comparison)

    @app.get("/api/downloads/{name}")
    def download(name: str):
        if name not in FILES:
            raise HTTPException(404, "Unknown official artifact.")
        return FileResponse(
            Path(output_path) / meta["run_id"] / name,
            media_type="text/csv",
            filename=name,
        )

    dist = ROOT / "web/dist"
    if dist.exists():
        app.mount("/", StaticFiles(directory=dist, html=True), name="dashboard")
    return app


def app_factory():
    return create_app(
        Path(os.environ.get("WORKBENCH_INPUT", DEFAULT_INPUT)),
        Path(os.environ.get("WORKBENCH_OUTPUT", ROOT / "outputs")),
    )
