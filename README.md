# veri-tax-portals

User-facing frontends for **[veri-tax](https://github.com/MSD786c/veri-tax)**, the VAT refund verification body.

| App | Who uses it | Port | Talks to |
|-----|-------------|------|----------|
| [`apps/emaratax-portal`](apps/emaratax-portal) | Suppliers confirming the tax invoices they issued (EmaraTax-style UI) | 3000 | `/supplier/*` |
| [`apps/fta-dashboard`](apps/fta-dashboard) | FTA officers reviewing applications and approving or rejecting refunds | 3001 | `/fta/*` |

Both are Next.js (App Router) + Tailwind + TypeScript in a pnpm workspace.

## Run everything locally

```bash
# 1. API (separate repo)
git clone https://github.com/MSD786c/veri-tax && cd veri-tax
uv sync && uv run uvicorn app.main:app --reload --port 8000

# 2. Frontends (this repo)
pnpm install
cp apps/emaratax-portal/.env.example apps/emaratax-portal/.env.local
cp apps/fta-dashboard/.env.example apps/fta-dashboard/.env.local
pnpm dev                 # both apps; or: pnpm dev:emaratax / pnpm dev:fta
```

- Supplier portal: http://localhost:3000, sign in with a test TRN such as `100111111100003`
- FTA dashboard: http://localhost:3001, sign in with any officer ID
- The API seeds synthetic data on first start. Delete `veri-tax/veritax.db` to reset it.

## API contract

- `docs/openapi.json` is a snapshot of the API schema; live docs are at http://localhost:8000/docs
- `docs/api-samples.md` has real responses from the seeded data
- Each app has its own typed client in `src/lib/api.ts`

Auth is mocked for now with the `X-Supplier-TRN` and `X-Officer-Id` headers. Real EmaraTax / UAE PASS and FTA SSO sign-in are TODO.

## Team workflow

See [CONTRIBUTING.md](CONTRIBUTING.md): personal branches `Suhayl`, `Haaziq` and `Aaron`, and a protected `main` that only takes PRs.

> Hackathon prototype. Not an official FTA service. All data is synthetic.
