# Uber — Ride-Hailing Frontend

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/pnpm-Workspaces-F69220?style=flat&logo=pnpm&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat" />
</p>

A production-style ride-hailing frontend built as a **pnpm monorepo** with two React SPAs (rider + driver) sharing a typed API client, Zustand stores, WebSocket hook, and a component library — all backed by the [Uber Go microservices backend](https://github.com/SaiKrishnaMulukutla/uber).

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Apps](#apps)
- [Shared Packages](#shared-packages)
- [Key Flows](#key-flows)
- [Branch Strategy](#branch-strategy)

---

## Features

- **2-step OTP login** — email/password → OTP verify for both riders and drivers
- **Live trip tracking** — WebSocket connection streams driver GPS to rider map in real time
- **Driver location publishing** — driver app pushes `geolocation.watchPosition` every 3 s during active trips
- **Razorpay payment flow** — create order → Razorpay modal → signature verify, all wired end-to-end
- **Role-based routing** — `RequireAuth` guard enforces `rider` / `driver` JWT role on every protected route
- **Silent token refresh** — access token refreshed automatically on 401; session cleared on second failure
- **Shared monorepo packages** — types, API client, auth, stores, realtime hooks shared across both apps with zero duplication
- **OpenStreetMap** — free tile-based maps via React Leaflet; no API key required
- **Notifications** — in-app notification list with unread badge, auto mark-as-read on open

---

## Architecture

```
Browser (Rider App)                    Browser (Driver App)
        │                                      │
        ▼                                      ▼
  apps/rider  (:5173)             apps/driver  (:5174)
        │                                      │
        └──────────┬───────────────────────────┘
                   │  imports from
                   ▼
        packages/shared          packages/ui
        ├── types/                ├── Button, Input
        ├── api/                  ├── OTPInput
        ├── auth/                 ├── Map (Leaflet)
        ├── stores/ (Zustand)     ├── StarRating
        └── realtime/ (WS)        └── TripStatusBadge
                   │
                   ▼
        API Gateway  (:8000)  ←── nginx
        ├── /users     → user-service
        ├── /drivers   → driver-service
        ├── /trips     → trip-service
        ├── /ws/trips  → trip-service (WebSocket)
        ├── /payments  → payment-service
        └── /notifications → notification-service
```

### Data Flow

```
Component
  └─► api-client (fetch + auth header)
        └─► API Gateway (:8000)
              └─► Backend microservice
                    └─► response → useState / Zustand store → re-render
```

### Realtime Flow

```
Rider tracking page mounts
  └─► useLocationStream(tripId, token)
        └─► WebSocket  ws://localhost:8000/ws/trips/{id}?token=<jwt>
              └─► onmessage { lat, lng, ts }
                    └─► tripStore.updateDriverLocation()
                          └─► Map marker moves
```

---

## Monorepo Structure

```
uber_fe/
├── apps/
│   ├── rider/                          # Rider SPA — port 5173
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── auth/               # register, login, verify-otp
│   │       │   ├── home.tsx            # map picker + fare estimate + trip request
│   │       │   ├── trip/               # tracking (WS), summary (rate+pay), history
│   │       │   ├── payment/            # Razorpay checkout
│   │       │   ├── notifications.tsx
│   │       │   └── profile.tsx
│   │       └── router.tsx
│   │
│   └── driver/                         # Driver SPA — port 5174
│       └── src/
│           ├── routes/
│           │   ├── auth/               # register (+ vehicle), login, verify-otp
│           │   ├── home.tsx            # online/offline status toggle
│           │   ├── trip/               # active (start → push location → end), history
│           │   ├── notifications.tsx
│           │   └── profile.tsx
│           └── router.tsx
│
├── packages/
│   ├── shared/                         # Internal package — @uber_fe/shared
│   │   └── src/
│   │       ├── types/                  # All DTO interfaces (user, driver, trip, payment, notification)
│   │       ├── api/                    # fetch wrapper + per-service modules
│   │       │   ├── client.ts           # base fetch, auth header injection, 401 → refresh → retry
│   │       │   ├── users.ts
│   │       │   ├── drivers.ts
│   │       │   ├── trips.ts
│   │       │   ├── payments.ts
│   │       │   └── notifications.ts
│   │       ├── auth/
│   │       │   ├── session.ts          # parseJWT, isExpired, getRole, getUserId
│   │       │   ├── storage.ts          # localStorage token get/set/clear
│   │       │   └── guards.tsx          # <RequireAuth role="rider|driver">
│   │       ├── stores/
│   │       │   ├── sessionStore.ts     # Zustand: userId, role, tokens, setSession, clear
│   │       │   └── tripStore.ts        # Zustand: tripId, status, driverLocation
│   │       └── realtime/
│   │           └── useLocationStream.ts # WS hook + exponential backoff reconnect
│   │
│   └── ui/                             # Internal package — @uber_fe/ui
│       └── src/
│           ├── Button.tsx
│           ├── Input.tsx
│           ├── OTPInput.tsx            # 6-digit, auto-advance between cells
│           ├── Map.tsx                 # React Leaflet wrapper (pickup/drop/driver markers)
│           ├── StarRating.tsx
│           ├── TripStatusBadge.tsx
│           ├── NotificationBell.tsx
│           ├── AppShell.tsx            # Header + nav + <Outlet>
│           └── AuthLayout.tsx
│
├── pnpm-workspace.yaml
├── package.json                        # Root scripts: dev:rider, dev:driver, build, lint
└── tsconfig.base.json                  # Shared TS config extended by all packages and apps
```

---

## Tech Stack

| Concern | Choice |
|---|---|
| Monorepo | pnpm workspaces |
| Framework | React 18 + TypeScript 5 |
| Build | Vite 6 |
| State (server) | `useState` + `useEffect` (direct fetch) |
| State (client) | Zustand 5 (session + trip FSM) |
| Routing | React Router v6 |
| Styling | Tailwind CSS v4 |
| Maps | React Leaflet + OpenStreetMap |
| Forms | React Hook Form |
| HTTP | Native `fetch` |
| Realtime | Native `WebSocket` (custom hook) |
| Payments | Razorpay JS SDK (dynamic script load) |
| Testing | Vitest + React Testing Library |
| Deploy | Vercel (per app) |

---

## Quick Start

**Prerequisites:** Node.js 18+, pnpm

```bash
git clone https://github.com/SaiKrishnaMulukutla/uber_fe
cd uber_fe
pnpm install
```

Start both apps in development mode:

```bash
pnpm dev:rider    # http://localhost:5173
pnpm dev:driver   # http://localhost:5174
```

Or start individually:

```bash
pnpm --filter rider dev
pnpm --filter driver dev
```

Build for production:

```bash
pnpm build        # builds both apps
```

> **Note:** The backend must be running on `http://localhost:8000`. See the [Uber backend repo](https://github.com/SaiKrishnaMulukutla/uber) for setup instructions (`make up`).

---

## Environment Variables

Each app reads its own `.env.development` / `.env.production`. Create these before running:

**`apps/rider/.env.development`**

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

**`apps/driver/.env.development`**

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

For production, set these in your Vercel project dashboard per app.

---

## Apps

### Rider App (`apps/rider`)

| Route | Description |
|---|---|
| `/auth/register` | Sign up with name, email, phone, password |
| `/auth/login` | Step 1 — password auth, triggers OTP send |
| `/auth/verify-otp` | Step 2 — 6-digit OTP, issues JWT |
| `/` | Home — click map to set pickup/drop, get fare estimate, request ride |
| `/trip/tracking/:id` | Live tracking — WebSocket driver marker + trip status poll |
| `/trip/summary/:id` | Post-trip — fare, star rating, pay button |
| `/trip/history` | Paginated trip list |
| `/payment/checkout/:id` | Razorpay payment flow |
| `/notifications` | In-app notification list |
| `/profile` | Rider profile + rating |

### Driver App (`apps/driver`)

| Route | Description |
|---|---|
| `/auth/register` | Sign up with vehicle type + license plate |
| `/auth/login` | Step 1 — password auth, OTP send |
| `/auth/verify-otp` | Step 2 — OTP verify, JWT issued |
| `/` | Home — go online / offline toggle |
| `/trip/active/:id` | Active trip — start → push GPS every 3 s → end |
| `/trip/history` | Paginated trip list |
| `/notifications` | In-app notification list |
| `/profile` | Driver profile + rating + vehicle info |

---

## Shared Packages

### `@uber_fe/shared`

The single source of truth for all cross-app logic.

**`api/client.ts`** — base fetch wrapper that:
- Injects `Authorization: Bearer <token>` on every request
- On `401`: refreshes token via `/users/refresh` or `/drivers/refresh` (role-aware), retries once
- On second `401`: clears session and redirects to login

**`auth/session.ts`** — pure JWT utilities (no side effects):
```ts
parseJWT(token)   // → { user_id, email, role, exp }
isExpired(token)  // → true if exp < now + 30s buffer
getRole(token)    // → 'rider' | 'driver' | null
getUserId(token)  // → uuid string | null
```

**`stores/sessionStore.ts`** — Zustand store persisted to `localStorage`:
```ts
{ accessToken, refreshToken, userId, email, role }
setSession(...)   // called after login/register
updateTokens(...) // called after silent refresh
clearSession()    // called on logout or 401
```

**`realtime/useLocationStream.ts`** — WebSocket hook:
```ts
useLocationStream({
  tripId,
  token,
  enabled: trip.status === 'STARTED',
  onLocation: ({ lat, lng }) => tripStore.updateDriverLocation({ lat, lng }),
})
```
Reconnects with exponential backoff: 1 s → 2 s → 4 s → 8 s → 30 s (max 5 retries).

### `@uber_fe/ui`

Stateless/lightly-stateful components shared across both apps. All components are unstyled beyond Tailwind utility classes — no third-party component library dependency.

| Component | Description |
|---|---|
| `Button` | 4 variants (primary, secondary, danger, ghost) + loading spinner |
| `Input` | Label + error message wrapper |
| `OTPInput` | 6 cells, auto-focus next on input, backspace goes to previous |
| `Map` | Leaflet wrapper with pickup, drop, and driver markers |
| `StarRating` | Interactive or readonly 1–5 star selector |
| `TripStatusBadge` | Colour-coded pill for all 5 trip states |
| `NotificationBell` | Bell icon with unread count badge |
| `AppShell` | Authenticated layout with header + nav + `<Outlet>` |

---

## Key Flows

### OTP Login (both apps)

```
POST /users/login (or /drivers/login)
  ← 202 "OTP sent to email"
navigate → /auth/verify-otp  (email passed via route state)
POST /users/verify-login { email, otp }
  ← 200 { access_token, refresh_token, user }
sessionStore.setSession(...)
navigate → /
```

### Trip Request (rider)

```
Click map → set pickup → set drop
POST /trips/estimate → show fare card
POST /trips/request → { trip_id }
navigate → /trip/tracking/:trip_id
  ├── poll GET /trips/:id every 5s (status updates)
  └── WS /ws/trips/:id?token=... (driver location)
status = COMPLETED → navigate → /trip/summary/:id
```

### Active Trip (driver)

```
PATCH /drivers/:id/status { status: "available" }
poll GET /trips/:id → status = DRIVER_ASSIGNED
PATCH /trips/:id/start
  └── geolocation.watchPosition → POST /trips/:id/location every 3s
PATCH /trips/:id/end
navigate → /
```

### Payment (rider, card)

```
GET /payments/:tripId        → { id, amount, status: "PENDING" }
POST /payments/orders        → { provider_order_id, key_id, amount }
Razorpay.open()              → user pays in modal
handler(response)
  └── POST /payments/verify  → { status: "COMPLETED" }
navigate → /
```

---

## Branch Strategy

```
main          ← production; stable
uat           ← integration; all features merged here before main
  feat/shared-package    types → api → auth → stores → realtime
  feat/ui-components     all shared UI components
  feat/rider-app         scaffold → auth → trips → payment/notifications/profile
  feat/driver-app        scaffold → auth → trips → notifications/profile
```

Merge order: `feat/*` → `uat` → `main`

---

<p align="center">Created with ❤️ by Mulukutla Sai Krishna</p>
