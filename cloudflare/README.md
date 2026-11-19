# Cloudflare deployment

The hosted edition serves the React app, a Python-generated analysis snapshot, and four original CSVs from Cloudflare Workers static assets. Filtering, query interpretation, and exact scenario search run in a browser Web Worker. This removes the running Python server as a hosting prerequisite. Python remains the source of normalized data, tiers, valuation, and official baseline outputs.

Run from the repository root.

```sh
make cloudflare-setup
make cloudflare-build
make cloudflare-test
make cloudflare-deploy
```

Wrangler reads its existing login profile or the securely configured CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID variables. Use Cloudflare's Edit Cloudflare Workers token template. Credential values stay outside repository files and static assets. The CLI prints the actual workers.dev address after deployment. Verify that address with scripts/browser_smoke.py using WORKBENCH_URL.

Research filters and scenarios run without a model or an external API. Refresh the hosted snapshot by rebuilding and deploying after input or policy edits. Browser-generated scenarios are checked against the Python/DuckDB reference for seven full-dataset cases, twelve randomized fixtures, eight query interpretations, and account filters.

The local Python edition remains available through make demo. Method displays the execution architecture selected by the build.

## Dataset chat

The floating chat panel posts to the Cloudflare Worker. The Worker reads matching records,
aggregates and original results from the analysis snapshot, and bundles the
submission README and selected analysis code at build time. The model plans
which data to read and explains the results. The Worker computes the numbers.

Set a private access code once using Wrangler. Set the Gemini key as a separate
Worker secret when available. Enter secret values at Wrangler’s secure prompt.

```sh
cd cloudflare
./node_modules/.bin/wrangler secret put CHAT_ACCESS_CODE
./node_modules/.bin/wrangler secret put GEMINI_API_KEY
```

Gemini 3.1 Flash-Lite is used when configured. Otherwise the Worker uses
GPT-OSS 20B through the Cloudflare Workers AI binding. Inference consumes the
configured provider’s quota. The chat requires the access code and limits
requests. The access code and API key stay outside the source and build files.
The local Python edition links to the hosted chat.
