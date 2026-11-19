"""Publish the same official Python results with a Cloudflare static frontend.

The browser worker handles interactive research and scenarios. The official
cleaning, tiers, valuation, and CSVs still come from the tested Python pipeline.
"""

import json
import os
import shutil
import subprocess
from workbench.pipeline import build, ROOT, FILES
from workbench.policy import BUYERS

subprocess.run(
    [
        "npm",
        "run",
        "build",
        "--prefix",
        "web",
        "--",
        "--outDir",
        "../cloudflare/public",
        "--emptyOutDir",
    ],
    cwd=ROOT,
    check=True,
    env=os.environ | {"VITE_CLOUDFLARE_STATIC": "1"},
)
snapshot = build()
meta = snapshot["meta"]
accounts = snapshot["accounts"]
meta.update(
    runtime="Cloudflare",
    countries=sorted({a["country"] for a in accounts}),
    ownership=sorted({a["ownership_status"] for a in accounts}),
    earnings=sorted({a["earnings_status"] for a in accounts}),
    evidence=sorted({t for a in accounts for t in a["evidence_tags"]}),
)
snapshot["query_buyers"] = [dict(id=b[0], label=b[1], phrase=b[2]) for b in BUYERS]
public = ROOT / "cloudflare/public"
(public / "snapshot.json").write_text(json.dumps(snapshot, separators=(",", ":")))
downloads = public / "api/downloads"
downloads.mkdir(parents=True, exist_ok=True)
for name in FILES:
    shutil.copyfile(ROOT / "outputs/current" / name, downloads / name)
(public / "_headers").write_text(
    "/snapshot.json\n  Cache-Control: no-cache\n/api/downloads/*\n  Content-Type: text/csv; charset=utf-8\n  Content-Disposition: attachment\n"
)
print("Cloudflare assets ready", meta["run_id"])

# The Worker bundles the report and selected analysis source without putting them
# in the public assets directory. It reads the current outputs from snapshot.json.
chat_context = ROOT / "cloudflare/bundle/chat-submission.json"
chat_context.parent.mkdir(exist_ok=True)
chat_context.write_text(json.dumps({
    "assignment": (
        "NinetyNine Director of AI take-home. The brief describes 960 fictional "
        "companies in v8. Clean the supplied data, choose and explain an A/B outreach "
        "rule, estimate each company's value with a documented method, then return "
        "the ten highest-revenue groups of exactly three companies serving different "
        "buyer verticals under $30M USD in total estimated valuation. Use supplied FX. "
        "Submit runnable code, four CSVs (cleaned data, tiers with reasons, values, "
        "top groups), and a one-page README with methods, assumptions, AI use, effort "
        "and next steps. Any language or tools may be used, including AI. "
        "Be ready to explain and edit the code during the follow-up."
    ),
    "readme": (ROOT / "README.md").read_text(),
    "code": {
        name: (ROOT / "src/workbench" / name).read_text()
        for name in ("analysis.py", "cleaning.py", "groups.py", "groups.sql", "pipeline.py", "policy.py")
    },
}), encoding="utf-8")
