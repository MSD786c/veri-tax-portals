# FTA · veri-tax Officer Console

Internal officer dashboard for the veri-tax backend (FastAPI). Next.js 16 App Router, React 19, Tailwind v4. Hackathon prototype, not an official FTA service.

## Run

```bash
# from veri-tax-portals/
cp apps/fta-dashboard/.env.example apps/fta-dashboard/.env.local   # NEXT_PUBLIC_API_URL (default http://localhost:8000)
pnpm --filter fta-dashboard dev          # http://localhost:3001
pnpm --filter fta-dashboard build && pnpm --filter fta-dashboard lint
```

Backend must allow origin `http://localhost:3001` (`CORS_ORIGINS`). Sign in at `/login` with any officer id (sent as `X-Officer-Id`).

## Pages

`/login`, `/` (overview), `/applications`, `/applications/[id]` (invoices, rules, supplier response, decision form, audit), `/suppliers`, `/suppliers/[trn]`, `/rejections`.

## Code map

- `src/lib/api.ts`: fetch wrapper (adds the header), `useApi` hook, TS types, AED formatting.
- `src/components/Shell.tsx`: sidebar + client-side login guard. `src/components/ui.tsx`: pills, cards, tables.
- All pages are client components that call the API from the browser.

## TODO

- Real FTA SSO instead of the mock officer id (and server-side auth)
- Charts on the overview
- Date-range and amount filters
- Arabic i18n / RTL
- OCR column in the three-way comparison (API does not expose OCR data yet)
