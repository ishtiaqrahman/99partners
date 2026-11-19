"""Exercise the investment walkthrough in Chromium against a running local app.

Install the optional browser dependency and set CHROMIUM_PATH if needed.
This checks real interactions and records screenshots outside the submission.
"""

import os
from pathlib import Path
import re
from textwrap import dedent
from playwright.sync_api import sync_playwright, expect

base_url = os.environ.get("WORKBENCH_URL", "http://127.0.0.1:8000").rstrip("/")

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
        headless=True,
        args=["--no-sandbox"],
    )
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    errors = []
    requests = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("request", lambda req: requests.append(req.url))
    page.goto(base_url)
    expect(page.get_by_role("heading", name="Acquisition workbench")).to_be_visible()
    page.get_by_role("link", name=re.compile("Who to contact")).click()
    expect(page.locator("#company-results-title")).to_contain_text("150 matching companies")
    page.get_by_role("link", name="Overview", exact=True).click()
    page.get_by_role("link", name="Open the company list", exact=True).click()
    page.get_by_role("button", name="Reset", exact=True).click()
    expect(page.get_by_role("button", name="Account 0004", exact=True)).to_be_visible()
    page.screenshot(path="/tmp/99-accounts.png")
    page.get_by_role("button", name="Account 0004", exact=True).click()
    dialog = page.get_by_role("dialog")
    expect(dialog.get_by_text("$6,600,000.00", exact=True)).to_be_visible()
    dialog.get_by_label("New analyst tag").fill("Discuss with partner")
    dialog.get_by_role("button", name="Add", exact=True).click()
    expect(dialog.get_by_role("button", name="Discuss with partner")).to_be_visible()
    page.screenshot(path="/tmp/99-evidence.png")
    page.keyboard.press("Escape")
    expect(dialog).to_have_count(0)
    page.get_by_label("Describe the companies you want").fill(
        "Canadian companies under 10M"
    )
    page.get_by_role("button", name="Preview filters", exact=True).click()
    expect(
        page.get_by_text("Choose Revenue or Valuation for the monetary threshold.")
    ).to_be_visible()
    expect(page.get_by_role("button", name="Account 0001", exact=True)).to_be_visible()
    page.get_by_role("button", name="Valuation", exact=True).click()
    expect(page.get_by_role("button", name="Apply these filters")).to_be_visible()
    page.get_by_role("button", name="Apply these filters").click()
    expect(page.get_by_label("Country", exact=True)).to_have_value("Canada")
    page.get_by_role("button", name="Filters", exact=False).filter(
        has=page.locator("svg")
    ).last.click()
    page.get_by_label("Analyst tag", exact=True).select_option("Discuss with partner")
    expect(page.locator(".compact-companies tbody tr")).to_have_count(0)
    expect(page.get_by_text("No companies match this view")).to_be_visible()
    page.get_by_role("button", name="Reset", exact=True).click()
    page.get_by_label("Analyst tag", exact=True).select_option("Discuss with partner")
    expect(page.locator(".compact-companies tbody tr")).to_have_count(1)
    expect(page.get_by_role("button", name="Account 0004", exact=True)).to_be_visible()
    page.get_by_role("button", name="Save view", exact=False).click()
    page.get_by_role("textbox", name="Saved view name").fill("Partner review")
    page.get_by_role("button", name="Save", exact=True).click()
    page.get_by_role("button", name="Reset", exact=True).click()
    expect(page.locator(".compact-companies tbody tr")).to_have_count(20)
    page.get_by_role("button", name="Partner review", exact=True).click()
    expect(page.get_by_label("Analyst tag", exact=True)).to_have_value("Discuss with partner")
    expect(page.locator(".compact-companies tbody tr")).to_have_count(1)
    page.get_by_role("button", name="Reset", exact=True).click()
    page.get_by_role("link", name="Combinations", exact=True).click()
    expect(page.get_by_text("First of 10 groups shown", exact=True)).to_be_visible()
    page.screenshot(path="/tmp/99-groups.png")
    expect(page.get_by_text("All combinations shown tie on revenue", exact=False)).to_be_visible()
    expect(page.locator(".group-answer-note")).to_contain_text("32 tie for first")
    page.get_by_role("button", name="$25M", exact=True).click()
    expect(page.get_by_text("Unapplied changes", exact=False)).to_be_visible()
    expect(page.locator(".applied-settings")).to_contain_text("Below $30M")
    page.get_by_role("button", name="Calculate with these settings", exact=True).click()
    expect(page.locator(".comparison")).to_be_visible()
    expect(page.locator(".comparison")).to_contain_text("original winner")
    expect(page.locator(".applied-settings")).to_contain_text("Below $25M")
    expect(page.get_by_text("Unapplied changes", exact=False)).to_have_count(0)
    page.screenshot(path="/tmp/99-scenario.png")
    page.get_by_label("Value all software at 2× revenue").check()
    expect(page.get_by_text("Unapplied changes", exact=False)).to_be_visible()
    page.get_by_role("button", name="Calculate with these settings", exact=True).click()
    expect(page.get_by_role("button", name="Calculate with these settings", exact=True)).to_be_enabled()
    page.get_by_role("button", name="Restore original analysis").click()
    page.get_by_text("Change valuation multiples", exact=True).click()
    multiple = page.get_by_label("Industry-specific add-on sales multiple")
    multiple.fill("2.5")
    expect(page.get_by_text("Unapplied changes", exact=False)).to_be_visible()
    expect(page.locator(".group-card")).to_contain_text("0008")
    page.get_by_role("button", name="Calculate with these settings", exact=True).click()
    expect(page.locator(".group-card")).to_contain_text("0209")
    expect(page.locator(".applied-settings")).to_contain_text("Industry-specific add-on 2.5×")
    page.reload()
    expect(page.locator(".group-card")).to_contain_text("0209")
    page.get_by_label("Check a company’s scenario price").fill("0012")
    page.get_by_role("button", name="Show price", exact=True).click()
    expect(page.get_by_text("Scenario price at 2.5× estimated sales", exact=False)).to_contain_text("$7,892,500")
    page.keyboard.press("Escape")
    multiple.fill("2.9")
    page.get_by_role("link", name="Methodology", exact=True).click()
    category = page.get_by_role("row", name=re.compile("Industry-specific add-on"))
    expect(category.get_by_role("cell", name="2.5×", exact=True)).to_be_visible()
    page.get_by_role("link", name="Change multiples in Combinations").click()
    multiple.fill("2.9")
    page.get_by_role("button", name="Calculate with these settings", exact=True).click()
    expect(page.locator(".applied-settings")).to_contain_text("Industry-specific add-on 2.9×")
    page.get_by_role("link", name="Methodology", exact=True).click()
    expect(category.get_by_role("cell", name="2×", exact=True)).to_be_visible()
    expect(category.get_by_role("cell", name="2.9×", exact=True)).to_be_visible()
    page.reload()
    expect(category.get_by_role("cell", name="2.9×", exact=True)).to_be_visible()
    page.get_by_role("link", name="Change multiples in Combinations").click()
    page.get_by_role("button", name="Restore original analysis").click()
    expect(page.locator(".group-card")).to_contain_text("0008")
    estimates = page.get_by_role("checkbox", name=re.compile("Include companies with estimated sales"))
    expect(estimates).not_to_be_checked()
    estimates.check()
    expect(page.locator(".group-card")).to_contain_text("0008")
    page.get_by_role("button", name="Calculate with these settings", exact=True).click()
    expect(page.locator(".group-card")).to_contain_text("0247")
    expect(page.locator(".group-card")).to_contain_text("$7.131M estimated sales")
    expect(page.locator(".sales-evidence")).to_contain_text("$7,130,500.00")
    expect(page.locator(".sales-evidence")).to_contain_text("$14,999,500.00")
    expect(page.locator(".applied-settings")).to_contain_text("74 use estimated sales")
    page.reload()
    expect(estimates).to_be_checked()
    expect(page.locator(".group-card")).to_contain_text("0247")
    page.get_by_role("button", name="Restore original analysis").click()
    expect(page.locator(".group-card")).to_contain_text("0008")
    page.get_by_role("link", name="Methodology", exact=True).click()
    page.get_by_role("button", name="Compare combinations Find the highest revenue", exact=True).click()
    page.get_by_text("Technical architecture", exact=True).click()
    expect(page.locator(".architecture code").first).to_have_text(
        __import__("re").compile("groups.sql|hosted-engine.ts")
    )
    page.screenshot(path="/tmp/99-method.png")
    with page.expect_download() as info:
        page.get_by_role("link", name="Top 10 combinations", exact=False).click()
    assert info.value.suggested_filename == "top_10_groups.csv"
    # Each lesson cites the runnable source. Check the displayed lines against
    # the actual files so a later rule edit cannot silently mislabel a snippet.
    page.get_by_role("link", name="Code walkthrough", exact=True).click()
    root = Path(__file__).resolve().parents[1]
    for step in range(1, 11):
        expect(page.locator(".walk-progress")).to_contain_text(f"Step {step} of 10")
        expect(page.locator(".walk-example h3")).to_be_visible()
        for block in page.locator(".walk-code").all():
            caption = block.locator("figcaption").inner_text()
            filename = re.search(r"(?:src/workbench|tests)/\w+\.(?:py|sql)", caption)[0]
            lines = [int(n) for n in re.findall(r"\d+", block.locator("figcaption span").inner_text())]
            assert lines, filename
            source = (root / filename).read_text().splitlines()[lines[0] - 1:lines[-1]]
            assert block.locator("code").text_content() == dedent("\n".join(source))
        if step == 6:
            expect(page.locator(".median-strip li")).to_have_count(6)
            expect(page.locator(".median-strip .middle")).to_contain_text(["$2.7M", "$3.614M"])
        if step == 8:
            for option, verdict in [("B + C + D", "reaches the limit"), ("A + C + D", "Keep this group")]:
                page.get_by_role("button", name=option).click()
                expect(page.locator(".teaching-outcome")).to_contain_text(verdict)
        if step == 2:
            page.get_by_role("link", name="Inspect company 0004").click()
            expect(page.get_by_role("dialog")).to_be_visible()
            page.keyboard.press("Escape")
            expect(page.get_by_role("dialog")).to_have_count(0)
            expect(page.locator(".walk-progress")).to_contain_text("Step 2 of 10")
        if step < 10:
            page.get_by_role("link", name=re.compile("^Next ·")).click()
    page.set_viewport_size({"width": 320, "height": 568})
    page.goto(base_url + "/#view=code&step=rank")
    expect(page.locator(".walk-example")).to_contain_text("$14.999M")
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    # Fresh navigation proves the compiled app remains usable without external hosts.
    assert all(url.startswith(base_url) for url in requests), requests
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(base_url + "/#view=accounts")
    expect(page.get_by_role("button", name="Account 0001", exact=True)).to_be_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (
        "Mobile page overflow"
    )
    page.screenshot(path="/tmp/99-mobile.png")
    assert not errors, errors
    print(
        "Browser walkthrough passed, including ambiguity, tags, scenario, Method, download and mobile layout."
    )
    browser.close()
