# JunketTours

JunketTours is a production-oriented tour booking and operations app for Pakistan adventure travel. Guests can book without an account, customers get a dashboard, and staff use a realtime admin panel for tours, bookings, users, blog content, and analytics.

## Tech stack

| Layer | Technology |
|--------|------------|
| Frontend | [Next.js 14](https://nextjs.org/) (App Router) + React + Tailwind CSS |
| Backend | [Convex](https://www.convex.dev/) (database, queries/mutations, realtime subscriptions, actions) |
| Auth | Custom session auth (HTTP-only cookie + hashed token in Convex `sessions` table) |
| AI | Convex actions + Groq (AI trip planner) |
| Email | Resend via Convex actions |

## Core features

- Guest tour booking (no account required)
- Customer account + booking dashboard
- Admin panel for tours, bookings, destinations, users, and blog
- AI trip planner using your live tours catalog
- Lead capture, custom itineraries, and analytics

## Repository layout

- `src/app/` - App Router pages (`/(site)`, `/dashboard`, `/admin`, `/api/auth/*`)
- `src/components/` - Reusable UI and feature components
- `convex/` - Schema, queries, mutations, actions, and backend modules
- `public/` - Static assets
- `.env.example` - Environment variable template

## Quick start (local)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment file:

   ```bash
   copy .env.example .env.local
   ```

   On macOS/Linux:

   ```bash
   cp .env.example .env.local
   ```

3. Set at least this variable in `.env.local`:

   - `NEXT_PUBLIC_CONVEX_URL` (your Convex deployment URL)

4. Start Convex in terminal 1 (from `web/`):

   ```bash
   npx convex dev
   ```

5. Start Next.js in terminal 2 (from `web/`):

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000`.

## Super admin bootstrap (first run)

1. Set `BOOTSTRAP_SECRET` on your Convex deployment.
2. Run action `authActions:bootstrapSuperAdmin` with `secret`, `name`, `email`, and `password`.
3. Remove `BOOTSTRAP_SECRET` after creating the first admin.

## Environment variables

Common local variables:

- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CONTACT_PHONE`
- `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL`
- `NEXT_PUBLIC_OFFICE_ADDRESS`

Convex deployment variables (set with `npx convex env set`):

- `BOOTSTRAP_SECRET` (one-time for first admin)
- `GROQ_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`
- `ADMIN_NOTIFICATION_EMAIL`
- `APP_BASE_URL`
- `WHATSAPP_BUSINESS_NUMBER`

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Next.js development server |
| `npm run dev:clean` | Remove `.next` and start dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run convex:dev` | Run Convex dev sync |
| `npm run convex:deploy` | Deploy Convex backend |

## Deployment notes

- Deploy web app on Vercel (or equivalent Node hosting).
- Deploy Convex backend with `npm run convex:deploy`.
- Mirror required secrets in Convex environment variables.

## Additional docs

- [RUNNING.md](./RUNNING.md) - Detailed local setup and troubleshooting
- [Next.js docs](https://nextjs.org/docs)
- [Convex docs](https://docs.convex.dev/)
