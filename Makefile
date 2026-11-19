PYTHON ?= python3
INPUT ?= data/candidate_companies_v9.csv
HOST ?= 127.0.0.1
PORT ?= 8000
ENV_PYTHON = .venv/bin/python

.PHONY: setup web analyze test demo package

setup:
	$(PYTHON) -m venv .venv
	$(ENV_PYTHON) -m pip install -r requirements.txt
	$(ENV_PYTHON) -m pip install --no-deps -e .

web:
	npm ci --prefix web --cache /tmp/99partners-npm-cache
	npm run build --prefix web

analyze:
	$(ENV_PYTHON) -m workbench.pipeline --input "$(INPUT)"

test:
	$(ENV_PYTHON) -m pytest -q

demo:
	@test -f web/dist/index.html || { echo "Build the interface with make web first."; exit 1; }
	WORKBENCH_INPUT="$(INPUT)" $(ENV_PYTHON) -m uvicorn workbench.api:app_factory --factory --host $(HOST) --port $(PORT)

package: analyze
	$(ENV_PYTHON) scripts/package.py

.PHONY: cloudflare-setup cloudflare-build cloudflare-test cloudflare-deploy

cloudflare-setup:
	npm ci --prefix cloudflare --cache /tmp/99partners-npm-cache

cloudflare-build:
	$(ENV_PYTHON) scripts/cloudflare_build.py

cloudflare-test:
	$(ENV_PYTHON) scripts/verify_cloudflare.py

cloudflare-deploy:
	WRANGLER_SEND_METRICS=false WRANGLER_LOG_PATH=/tmp/99partners-cloudflare.log cloudflare/node_modules/.bin/wrangler deploy --config cloudflare/wrangler.jsonc
