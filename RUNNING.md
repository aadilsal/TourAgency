# How to run JunketTours (local)

Step-by-step commands to run the **Next.js** frontend and **Convex** backend on your machine.

## Prerequisites

- **Node.js** 18+ (LTS recommended)  
- **npm** (comes with Node)  
- A **Convex** account ([convex.dev](https://www.convex.dev/))  
- Optional: **Groq** and **Resend** API keys for AI and email in Convex

---

## 1. Go to the app folder

```bash
cd web
```

(If your repo root is `JunketTours`, the app lives in `JunketTours/web`.)

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Environment file (Next.js)

Copy the example file and edit values:

```bash
copy .env.example .env.local
```

On macOS / Linux:

```bash
cp .env.example .env.local
```

Set at least:

| Variable | Example (local) |
|----------|------------------|
| `NEXT_PUBLIC_CONVEX_URL` | `https://YOUR-DEPLOYMENT.convex.cloud` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `JWT_ISSUER` | `http://localhost:3000` (must match Convex auth settings) |
| `JWT_JWKS_URL` | `http://localhost:3000/api/auth/jwks` (same, in Convex dashboard) |
| `JWT_KID` | e.g. `junket1` |
| `JWT_PRIVATE_KEY` | From step 4 below |

Convex actions (AI / email) **do not** read `.env.local` by default. Put the same secrets on the deployment with step 6.

---

## 4. Generate JWT keys (auth)

Next.js signs Convex JWTs with an **RS256 private key**. Generate key output:

```bash
npm run gen:jwt-keys
```

Copy the printed `JWT_PRIVATE_KEY` (JSON-quoted PEM) and `JWT_KID` into `.env.local`.

In the **Convex Dashboard** → your deployment → **Settings** → **Environment variables**, add:

- `JWT_ISSUER` = same as in `.env.local` (e.g. `http://localhost:3000`)
- `JWT_JWKS_URL` = `http://localhost:3000/api/auth/jwks`

Convex must be able to **fetch** that JWKS URL. For pure localhost, that works if Convex can reach your machine (sometimes flaky); for reliable auth, use a tunnel (e.g. ngrok) or test JWT after deploying Next to a public URL.

---

## 5. Link Convex and push functions (first time)

In **`web`**:

```bash
npx convex dev
```

- Log in if prompted.  
- Create or select a deployment.  
- Leave this running while you develop (it syncs `convex/` and can regenerate `convex/_generated/`).

**Second terminal** will run Next (step 8). You can stop `convex dev` when not coding backend; use `npx convex deploy` for production.

---

## 6. Convex environment variables (AI, email, bootstrap)

With the project linked (after `convex dev` at least once), from **`web`**:

```bash
npx convex env set GROQ_API_KEY "your-groq-api-key"
npx convex env set RESEND_API_KEY "your-resend-api-key"
npx convex env set APP_BASE_URL "http://localhost:3000"
npx convex env set ADMIN_NOTIFICATION_EMAIL "your-email@example.com"
```

Optional one-time bootstrap (then remove the secret from Convex):

```bash
npx convex env set BOOTSTRAP_SECRET "a-long-random-string"
```

List vars (CLI):

```bash
npx convex env list
```

---

## 7. Create the first super admin

With `BOOTSTRAP_SECRET` set in Convex, run the **bootstrap** action from the Convex dashboard (**Functions** → `authActions:bootstrapSuperAdmin`) or CLI, passing:

- `secret` — same as `BOOTSTRAP_SECRET`
- `name`, `email`, `password`

Or use the Convex **dashboard** “Run” UI for that action.

Afterward, **delete** `BOOTSTRAP_SECRET` from Convex env if you no longer need it.

---

## 8. Start Next.js (dev server)

In a **second** terminal, from **`web`**:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Typical setup:

| Terminal | Command | Purpose |
|----------|---------|---------|
| 1 | `npx convex dev` | Sync Convex backend |
| 2 | `npm run dev` | Next.js on port 3000 |

---

## 9. Seed data (optional)

1. Log in as super admin at `/login`.  
2. Go to **Admin → Tours**.  
3. Click **Seed sample tours** (or create tours manually).

---

## Command reference

| Command | What it does |
|---------|----------------|
| `npm install` | Install Node dependencies |
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Run production server (after `build`) |
| `npm run lint` | Run ESLint |
| `npm run convex:dev` | Same idea as `npx convex dev` (Convex sync) |
| `npm run convex:deploy` | Deploy Convex backend to production |
| `npm run gen:jwt-keys` | Print RS256 key material for `.env.local` |
| `npx convex dev` | Link/sync Convex project (keep running while developing backend) |
| `npx convex env set NAME value` | Set a secret on the current Convex deployment |
| `npx convex env list` | List Convex deployment env vars |

---

## Troubleshooting

- **`NEXT_PUBLIC_CONVEX_URL` wrong** — Copy the **Deployment URL** from the Convex dashboard (ends with `.convex.cloud`).  
- **Queries fail / “Not authenticated”** — Check `JWT_PRIVATE_KEY`, `JWT_ISSUER`, and Convex `JWT_JWKS_URL`; JWKS must be reachable by Convex.  
- **AI or email errors in Convex** — Confirm `GROQ_API_KEY` / `RESEND_API_KEY` with `npx convex env list`, not only `.env.local`.  
- **Port 3000 in use** — `npx next dev -p 3001` and set `NEXT_PUBLIC_APP_URL` / `JWT_ISSUER` / `JWT_JWKS_URL` to match (e.g. `http://localhost:3001`).

For a high-level overview of the stack, see [README.md](./README.md).
