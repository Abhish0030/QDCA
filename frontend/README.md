# QDCA Frontend

This frontend is a React + Vite single-page app deployed on Vercel.

## Auth And API Routing

Production is intended to call the backend directly:

- app routes like `/login` and `/dashboard` are served by the SPA fallback
- frontend API requests go to the configured backend origin
- Better Auth client calls use the configured backend origin
- cookies require `credentials: "include"` and backend CORS with credentials enabled

Because the frontend and backend are on different origins, Better Auth cookies must use environment-aware attributes:

- local development on `http://localhost`: `SameSite=Lax`, `Secure=false`
- production on HTTPS cross-origin domains: `SameSite=None`, `Secure=true`

## Environment Variables

Use `frontend/.env.example` as the template for local development and Vercel configuration.

Recommended values:

- Local development:
  - `VITE_BACKEND_URL=http://localhost:3000`
  - `VITE_APP_URL=http://localhost:5173`
- Vercel production:
  - `VITE_BACKEND_URL=https://your-railway-backend.up.railway.app`
  - `VITE_APP_URL=https://qdca.vercel.app`
  - optionally set `VITE_AUTH_BASE_URL` to the same backend origin
  - optionally set `VITE_API_BASE_URL` to `${VITE_BACKEND_URL}/api`

Optional overrides:

- `VITE_AUTH_BASE_URL`
  - defaults to `VITE_BACKEND_URL`
  - set only if Better Auth must target a different public origin than the main backend
- `VITE_API_BASE_URL`
  - defaults to `${VITE_BACKEND_URL}/api`
  - set only if application API requests must target a different public origin

## Local Development

```bash
pnpm install
pnpm dev
```

The Vite dev server can still proxy local `/api` requests, but the app now defaults to calling the configured backend origin directly for both Better Auth and application API requests.
