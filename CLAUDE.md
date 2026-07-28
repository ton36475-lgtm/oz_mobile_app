# CLAUDE.md

Guidance for Claude Code (and other AI coding assistants) working in this repository.

## What this repo actually is

The repo is named `oz_mobile_app` and its `todo.md` / commit history describe an ambitious
"OZ Enterprise AI Agent System" (multi-agent orchestration, SSH/terminal control, a
"War Room" multi-agent debate UI, Cloudflare Workers backend, Flutter app, etc.). **Very
little of that vision is actually wired up.** Concretely, today the repo contains two
mostly-unconnected things:

1. **The repo root is a stock Expo (React Native) app template**
   (a "Manus WebDev" template — see
   `app.config.ts`, bundle id `space.manus.oz_mobile_app.*`). The `app/`, `components/`,
   `hooks/`, `constants/`, `lib/`, `server/`, `drizzle/`, `shared/` directories are the
   *unmodified* scaffold: a single "Home" tab, an OAuth callback screen, a tRPC + Drizzle
   backend, and a `users` table. None of the app's advertised features (auth screen,
   terminal screen, war room screen, settings screen) have been built — `todo.md`'s
   "Phase 3: Mobile App Screens" is entirely unchecked, and `app/(tabs)/index.tsx` still
   says *"Edit app/(tabs)/index.tsx to get started."*
2. **`packages/*` — standalone TypeScript packages with real logic and passing unit
   tests, but NOT connected to the app above.** These implement the "47 Ronin"-style
   agent/terminal/identity/LLM/tool concepts described in commit messages, each with its
   own `package.json`, `tsconfig.json`, and Vitest suite. Nothing under `app/`, `server/`,
   or `lib/` imports from any `@oz/*` package (verified: no `@oz/` import anywhere outside
   `packages/`). There is also no `pnpm-workspace.yaml` and the root `pnpm-lock.yaml` has a
   single importer (`.`), so these packages are not part of the root pnpm install graph —
   they are developed/tested in isolation.

**Read this whole file before trusting any commit message or the `todo.md` phase
checkmarks — they describe intended/aspirational state, not what's actually built.**

---

## Directory structure

```
oz_mobile_app/
├── app/                      Expo Router app (screens/routes) — mostly default template
│   ├── (tabs)/               Tab navigator; only a "Home" tab exists
│   ├── _layout.tsx           Root layout (fonts, providers, theme)
│   ├── dev/theme-lab.tsx     Internal theme-preview screen
│   └── oauth/callback.tsx    Manus OAuth redirect handler
├── components/               Shared RN components (ScreenContainer, ThemedView, ui/...)
├── constants/                const.ts, oauth.ts, theme.ts (colors, API base URL helpers)
├── hooks/                    use-auth.ts, use-color-scheme.ts, use-colors.ts
├── lib/                      Client-side helpers
│   ├── _core/                Framework-level: api.ts, auth.ts, theme.ts — avoid editing
│   ├── trpc.ts                tRPC React client setup (superjson, auth header injection)
│   └── theme-provider.tsx
├── server/                   Express + tRPC backend (runs via `pnpm dev:server`)
│   ├── _core/                Framework-level: trpc.ts, context.ts, env.ts, oauth.ts,
│   │                         llm.ts, imageGeneration.ts, voiceTranscription.ts,
│   │                         storageProxy.ts, systemRouter.ts — avoid editing
│   ├── db.ts                  Query helpers — ADD feature queries here
│   ├── routers.ts              tRPC router — ADD feature routers here
│   ├── storage.ts              S3-backed file storage helpers (Forge-presigned URLs)
│   └── README.md                Full backend guide: auth, DB, tRPC, LLM/voice/image
│                                 helpers, storage, testing patterns — READ THIS for any
│                                 backend work, it's the authoritative doc for this half
│                                 of the app.
├── drizzle/                  Drizzle ORM schema/migrations (MySQL/TiDB dialect)
│   ├── schema.ts               Only table so far: `users`
│   └── relations.ts
├── shared/                   Types/constants shared between client and server
├── tests/                    Root-level Vitest tests (currently `auth.logout.test.ts`,
│                             which is `describe.skip`'d — no auth feature to test yet)
├── scripts/                  load-env.js (env priority loader), reset-project.js
│                             (Expo's stock "reset to blank template" script), generate_qr.mjs
├── packages/                 Standalone, NOT wired into the app above (see note above)
│   ├── core-terminal/         SSH client, Cloudflare Tunnel, TTY server (16 tests)
│   ├── core-agent/            Agent pool, communication bus, debate engine (15 tests)
│   ├── core-identity/         User profile, OAuth/OTP, bot-identity binding (24 tests)
│   ├── core-llm/              Multi-provider LLM router w/ fallback (27 tests)
│   ├── core-tools/            Tool registry + execution engine w/ chaining (24 tests)
│   ├── cli/                   `@oz/cli` — command parser + CLI engine (34+ tests)
│   └── backend-worker/        Cloudflare Workers backend — INCOMPLETE/BROKEN (see
│                               Gotchas below): no package.json, no tsconfig.json, and
│                               `src/index.ts` imports `./routes/*` and
│                               `./middleware/{error-handler,logger,cors}` files that do
│                               not exist in the tree. Only `middleware/auth.ts` exists.
├── assets/images/            App icons/splash images
├── app.config.ts             Expo config (bundle id, scheme, plugins, splash, icons)
├── drizzle.config.ts         drizzle-kit config; throws if DATABASE_URL is unset
├── tailwind.config.js        NativeWind (Tailwind for RN) config, driven by theme.config.js
├── theme.config.js           Single source of truth for light/dark color tokens
├── metro.config.js, babel.config.js, eslint.config.js, tsconfig.json
├── todo.md                   Aspirational multi-phase roadmap (Flutter app, Postman
│                             collection, Cloudflare Workers API, etc.) — mostly unchecked
└── pnpm-lock.yaml            Lockfile for the ROOT app only (single importer `.`)
```

No `README.md`, `AGENTS.md`, or `.github/workflows/` exist at the repo root (no CI is
configured). `server/README.md` is the closest thing to a README and is genuinely useful
and accurate for the backend half of the app.

---

## Tech stack

- **Framework:** Expo SDK 54 + Expo Router 6 (file-based routing), React 19, React Native
  0.81, TypeScript 5.9 (strict mode), new architecture enabled (`newArchEnabled: true`).
- **Styling:** NativeWind 4 (Tailwind CSS for RN) — use `className`, not `style`; color
  tokens come from `theme.config.js` (do not hardcode hex values in components).
- **State/data:** `@tanstack/react-query` + tRPC v11 client (`lib/trpc.ts`).
- **Backend:** Express + tRPC server in `server/_core/index.ts`, run via `tsx watch`
  during dev; built with `esbuild` for production (`dist/index.js`).
- **Database:** Drizzle ORM, MySQL/TiDB dialect, schema in `drizzle/schema.ts`.
- **Auth:** Manus OAuth (bearer token + `expo-secure-store` on native, HTTP-only cookie
  on web) — see `server/README.md` for the full flow.
- **Package manager:** pnpm (`packageManager: pnpm@9.12.0`, `.npmrc` sets
  `node-linker=hoisted`).
- **Testing:** Vitest, both at the root (`tests/`) and independently inside each
  `packages/*` package.
- **Lint/format:** ESLint 9 flat config (`eslint-config-expo`), Prettier 3.

The `packages/*` TS packages (outside the Expo app) have **zero runtime dependencies**
declared in their own `package.json` — they're pure TypeScript logic exercised entirely
through Vitest, dependency-injected/mocked rather than hitting real SSH/Cloudflare/LLM
services.

---

## Setup / dev / build / test / lint commands

Root app (run from repo root):

```bash
pnpm install               # installs deps for the root app only
pnpm dev                   # runs dev:server + dev:metro concurrently
pnpm dev:server            # Express/tRPC API only, via tsx watch (server/_core/index.ts)
pnpm dev:metro             # Expo web dev server via Metro (port 8081, override with EXPO_PORT)
pnpm android               # expo start --android
pnpm ios                   # expo start --ios
pnpm check                 # tsc --noEmit (typecheck)
pnpm lint                  # expo lint
pnpm format                # prettier --write .
pnpm test                  # vitest run (root-level tests/ only)
pnpm build                 # esbuild bundle of the server -> dist/
pnpm start                 # NODE_ENV=production node dist/index.js (serve the built server)
pnpm db:push               # drizzle-kit generate && drizzle-kit migrate (needs DATABASE_URL)
pnpm qr                    # scripts/generate_qr.mjs — QR code for opening the Expo app
```

Each standalone package under `packages/` (`core-agent`, `core-identity`, `core-llm`,
`core-terminal`, `core-tools`, `cli`) has its own scripts and must be run **from inside
that package's directory** (they are not linked as a pnpm workspace):

```bash
cd packages/core-agent   # or core-identity / core-llm / core-terminal / core-tools / cli
pnpm install              # each package needs its own install; there's no shared workspace
pnpm build                 # tsc
pnpm test                  # vitest run
pnpm test:coverage
pnpm lint                  # eslint src
pnpm format                # prettier --write src
```

`packages/backend-worker` has no `package.json`/scripts at all — it cannot currently be
built, tested, or run (see Gotchas).

---

## Conventions / architecture actually observed

- **Path aliases:** `@/*` → repo root, `@shared/*` → `shared/` (see `tsconfig.json`).
  Import app code via `@/...` (e.g. `@/hooks/use-auth`, `@/lib/trpc`), not relative paths
  that climb multiple directories.
- **`_core/` = framework scaffold, don't edit.** Every top-level app dir that has one
  (`server/_core/`, `lib/_core/`) contains template-managed infrastructure code
  (auth/session plumbing, tRPC wiring, storage proxy, OAuth). `server/README.md` states
  this explicitly: "Only touch the files with '←' markers. Anything under `_core/`
  directories is framework-level—avoid editing unless you are extending the
  infrastructure." Feature work goes in `server/db.ts`, `server/routers.ts`,
  `drizzle/schema.ts`, `shared/types.ts`, `shared/const.ts`, and `tests/`.
- **tRPC pattern:** add tables to `drizzle/schema.ts` → query helpers in `server/db.ts` →
  procedures in `server/routers.ts` (`publicProcedure` vs `protectedProcedure`) → call
  from the client via `trpc.<router>.<procedure>.useQuery()/.useMutation()` (see
  `lib/trpc.ts`). The tRPC v11 gotcha called out in-repo: the `superjson` transformer
  must be passed inside `httpBatchLink`, not at the root `createClient` level.
- **Auth:** `useAuth()` hook (`hooks/use-auth.ts`) is the single client-side entry point;
  it branches on `Platform.OS === "web"` (cookie-based, calls the API for the current
  user) vs native (bearer token in `expo-secure-store`, cached user info). Frontend code
  calling a `protectedProcedure` must catch `error.data?.code === 'UNAUTHORIZED'` and
  redirect to login — this is a documented requirement, not optional.
- **Theming:** all colors are defined once in `theme.config.js` (`themeColors`, each with
  `light`/`dark` variants) and consumed both by `tailwind.config.js` (as CSS vars,
  `bg-primary` etc., no `dark:` prefix needed — dark mode is driven by a `data-theme`
  attribute/class, see the custom `light`/`dark` Tailwind variants in
  `tailwind.config.js`) and by `hooks/use-colors.ts` for cases needing raw color values in
  JS/inline styles.
- **Env var loading order:** `scripts/load-env.js` (invoked by `app.config.ts`) loads
  `.env` but *never overrides* variables already present in `process.env`, so
  platform-injected variables always win over `.env` placeholders. It also mirrors
  several `VITE_*`/OAuth vars into `EXPO_PUBLIC_*` equivalents for client-side use.
- **The `@oz/*` packages** each follow the same internal shape: `src/index.ts` barrel
  export, `src/types.ts`, one or more feature classes, `src/__tests__/*.test.ts`. They
  appear designed to eventually back a CLI/terminal/multi-agent product, but as of now
  are dependency-free logic modules exercised only via their own Vitest suites — treat
  work on them as an isolated TypeScript library task, not as "app" work.

---

## Environment variables

No `.env.example` exists in the repo, so this list is reconstructed from
`server/_core/env.ts`, `server/README.md`, and `scripts/load-env.js`. Do not print or
commit real values for any of these.

Server-side (`server/_core/env.ts`):
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL/TiDB connection string (Drizzle). Required for `pnpm db:push`; without it the server logs a warning and DB helpers no-op. |
| `JWT_SECRET` | Session/cookie signing secret. |
| `VITE_APP_ID` | Manus OAuth app ID. |
| `OAUTH_SERVER_URL` | Manus OAuth backend URL. |
| `OWNER_OPEN_ID` | Owner's Manus ID (used to auto-grant `admin` role). |
| `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` | Forge API endpoint/key backing `server/storage.ts` (S3 presigned upload/download) and LLM helpers. |
| `OWNER_NAME` | Owner's display name (mirrored to `EXPO_PUBLIC_OWNER_NAME`). |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL (mirrored to `EXPO_PUBLIC_OAUTH_PORTAL_URL`). |

Client-side / Expo (`EXPO_PUBLIC_*`, consumed in RN code, e.g. `constants/oauth.ts`):
`EXPO_PUBLIC_APP_ID`, `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_OAUTH_PORTAL_URL`, plus the
mirrored `EXPO_PUBLIC_OWNER_OPEN_ID` / `EXPO_PUBLIC_OWNER_NAME` /
`EXPO_PUBLIC_OAUTH_SERVER_URL` set by `scripts/load-env.js`.

`NODE_ENV` and `EXPO_PORT` also affect dev scripts (`dev:server`, `dev:metro`).

---

## Gotchas / repo-specific pitfalls

1. **Commit messages and `todo.md` overstate what exists.** Multiple commits claim a
   fully working Flutter app, auth/terminal/war-room screens, and a 30+ endpoint
   Cloudflare Workers API with "production-ready" status. In the actual tree: the Expo
   app is the default template with one Home tab; there is no Flutter project anywhere;
   and the Cloudflare Workers backend (`packages/backend-worker`) is missing its
   `package.json`, `tsconfig.json`, and most of the files it imports. Verify claims
   against the actual files before relying on them.
2. **`packages/backend-worker` will not build.** `src/index.ts` imports
   `./routes/{auth,users,terminals,agents,debates,identity,llm,tools,audit}` and
   `./middleware/{error-handler,logger,cors}`, none of which exist (only
   `middleware/auth.ts` is present). There's also no `package.json`, so its declared
   dependency `itty-router`/`itty-router-extras`/`@tsndr/cloudflare-worker-jwt` aren't
   installed anywhere. Treat this package as a stub/placeholder, not working code.
3. **`packages/*` are not a pnpm workspace.** There is no `pnpm-workspace.yaml`, and
   `package.json` at the root has no `workspaces`/`pnpm.workspaces` field. The
   `pnpm-lock.yaml` only has one importer (`.`). Running `pnpm install` at the root does
   **not** install dependencies for any `packages/*` folder — `cd` into the package first.
4. **`@oz/*` packages are dead code from the running app's perspective.** No file under
   `app/`, `server/`, `lib/`, `components/`, `hooks/`, `constants/`, or `shared/` imports
   anything from `packages/`. If a task is "wire up the terminal/agent/LLM features into
   the mobile app," that integration has to be built from scratch — it does not exist yet
   despite the sophisticated logic already implemented in `packages/`.
5. **Root `pnpm check` (`tsc --noEmit`) may attempt to include `packages/**/*.ts`** since
   `tsconfig.json`'s `include` is a blanket `**/*.ts`/`**/*.tsx` with only `node_modules`
   and `dist` excluded, while the root `expo/tsconfig.base` config and installed deps know
   nothing about the packages' own dependencies (e.g. `itty-router`,
   `@tsndr/cloudflare-worker-jwt`). If typechecking breaks on files under `packages/`,
   this is why — each package should really be typechecked independently via its own
   `pnpm build`/`tsc` inside that package directory.
6. **`tests/auth.logout.test.ts` is `describe.skip`'d** with a comment "Remove `.skip`
   once you implement user authentication" — the auth feature itself is still template
   boilerplate (`server/routers.ts` only has `auth.me` and `auth.logout`, no
   login/register).
7. **`drizzle.config.ts` throws immediately if `DATABASE_URL` is unset** — so
   `pnpm db:push` (and anything invoking drizzle-kit directly) will hard-fail without a
   real DB connection string, even though `server/db.ts` itself degrades gracefully
   (`getDb()` returns `null` and callers no-op/warn) when there's no `DATABASE_URL`.
8. **No CI.** There is no `.github/workflows/` directory, so `pnpm check` / `pnpm lint` /
   `pnpm test` are not enforced automatically anywhere — run them manually before
   considering a change complete.
9. **Bundle IDs / scheme are derived from a timestamp baked into `app.config.ts`**
   (`space.manus.oz_mobile_app.t20260503053135` → scheme `manus20260503053135`). Don't
   "clean up" this-looking-odd value; it's intentionally generated and matches deep-link
   configuration elsewhere (OAuth callback flow).
10. **`app-example` in `.gitignore`** — `scripts/reset-project.js` (Expo's stock
    "reset to blank" utility) will move `app/`, `components/`, `hooks/`, `constants/`,
    `scripts/` into `app-example/` if run; it hasn't been run and there's no reason to run
    it here, but be aware it exists and is destructive to the current app scaffold.

---

## Summary for future work

This is, in practice, an early-stage Expo/React Native + tRPC/Drizzle mobile app (still
on the stock template) sitting alongside a separate, more mature set of standalone
TypeScript packages (agent orchestration, terminal/SSH, identity, LLM routing, tool
execution, CLI) that were built and unit-tested independently and never integrated. Any
task that asks to "add the terminal/war-room/agent features to the app" is greenfield
integration work, not a bug fix — plan accordingly, and don't assume prior commit messages
describing this integration as "complete" are accurate.
