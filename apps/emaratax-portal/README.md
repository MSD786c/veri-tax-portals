# EmaraTax Supplier Portal (hackathon prototype)

EmaraTax-style portal where a supplier confirms (or disputes) tax invoices cited in a VAT refund application. Talks to the veri-tax FastAPI backend (`/supplier/*`). Not an official FTA service.

## Run
```bash
# backend (from ../veri-tax)
uv run uvicorn app.main:app --port 8000      # CORS_ORIGINS must include http://localhost:3000
# portal (from repo root)
cp apps/emaratax-portal/.env.example apps/emaratax-portal/.env.local   # NEXT_PUBLIC_API_URL
pnpm --filter emaratax-portal dev            # http://localhost:3000
pnpm --filter emaratax-portal build && pnpm --filter emaratax-portal lint
```
`NEXT_PUBLIC_API_URL` is inlined at build time; rebuild after changing it.

## Pages
- `/login` mock "Sign in with UAE PASS": pick a seeded TRN (100111111100003, 100222222200003, 100333333300003, 100444444400003). No password.
- `/` dashboard: counts, Pending/Responded tabs, request table.
- `/requests/[id]` invoice particulars next to the 4-question form + declaration; read-only once responded; shows resulting invoice status (VERIFIED / FLAGGED / DISPUTED).

## Code map
- `src/lib/api.ts` API client, payload types, mock session (TRN in localStorage, sent as `X-Supplier-TRN`).
- `src/components/Shell.tsx` header, sidebar, footer, auth guard, status pill.
- Theme tokens in `src/app/globals.css`.

## TODO
- Real UAE PASS / EmaraTax auth (replace the TRN header)
- CSV bulk upload / bulk confirm
- Arabic i18n and RTL verification (layout uses logical properties; no translations yet)
- Sidebar "Profile" is a placeholder; inline field-level validation of 422 errors
