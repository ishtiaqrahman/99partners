"""Assemble the reviewer ZIP from an explicit allowlist.

Dependency caches, repository history, and the candidate's planning document
stay outside the submission. The built UI allows a Python-only reviewer launch.
"""

from pathlib import Path
import zipfile

root = Path(__file__).resolve().parents[1]
if not (root / "web/dist/index.html").exists():
    raise SystemExit("Build the interface with make web before packaging.")
destination = root / "ninety-nine-submission.zip"
files = [
    root / name
    for name in (
        "README.md",
        "Makefile",
        "pyproject.toml",
        "requirements.txt",
        "scripts/package.py",
        "scripts/browser_smoke.py",
        "scripts/cloudflare_build.py",
        "scripts/verify_cloudflare.py",
        "cloudflare/package.json",
        "cloudflare/package-lock.json",
        "cloudflare/wrangler.jsonc",
        "cloudflare/src/chat.ts",
        "cloudflare/README.md",
    )
]
for folder in ("src/workbench", "tests", "web/src", "web/dist"):
    files += [
        p
        for p in (root / folder).rglob("*")
        if p.is_file() and "__pycache__" not in p.parts
    ]
files += [
    root / "web" / name
    for name in (
        "package.json",
        "package-lock.json",
        "tsconfig.json",
        "vite.config.ts",
        "index.html",
    )
]
files += [root / "data/candidate_companies_v9.csv"]
files += [
    root / "outputs/current" / name
    for name in (
        "cleaned_companies.csv",
        "company_tiers.csv",
        "company_valuations.csv",
        "top_10_groups.csv",
    )
]
with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
    for path in files:
        # Submitted copies are separate from the runtime's atomic current pointer.
        # This lets an extracted ZIP regenerate results without replacing a directory.
        relative = path.relative_to(root)
        if relative.parts[:2] == ("outputs", "current"):
            relative = Path("submission") / path.name
        archive.write(path, Path("ninety-nine-workbench") / relative)
print(destination)
