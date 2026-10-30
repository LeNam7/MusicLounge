# Project: MusicLounge (Lùng Vài Tea)

## Architecture
- **Framework**: Next.js 16.4.2 (App Router, Turbopack, React 19).
- **Styling**: Tailwind CSS v4 (`@theme`, custom color tokens, font variables).
- **Database**: Node.js native SQLite (`node:sqlite`, `DatabaseSync`, WAL mode, `BEGIN IMMEDIATE` transactions, busy timeout 5000ms).
- **Security**: Signed HMAC-SHA256 session tokens in HttpOnly cookies, exact phone verification, parameterized SQL statements.
- **Notification**: Transactional Outbox pattern (`notification_logs`) with background worker & retry logic.
- **Process & Deploy**: PM2 process management (`ecosystem.config.js`), non-destructive zero-downtime deployment script.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Build & Typecheck Validation | `tsc --noEmit` and Turbopack clean build | M1 | survey_1 |
| F02 | SQLite Lifecycle & WAL Safety | `globalThis` db singleton, suppress dynamic tracing, WAL mode | M1 | survey_1 |
| F03 | Repository & Deploy Hardening | Untrack `data/oriental_serenity.db` from Git, PM2 config, deploy script | M1 | survey_1 |
| F04 | Environment Config Consistency | Complete `.env.example` with SMTP & Admin email keys, add `typecheck` script | M1 | survey_1 |
| F05 | Admin Config API Support | Add `PATCH` handler to `/api/admin/config` to resolve HTTP 405 | M2 | survey_3 |
| F06 | PII Data Leak Protection | Replace suffix matching with exact phone verification in `/api/bookings/...` | M2 | survey_3 |
| F07 | API Error & Validation Defense | Return HTTP 404 for missing rooms, HTTP 400 for invalid JSON payloads | M2 | survey_3 |
| F08 | Security Cookie Hardening | Set `secure: true` in production on `lvt_admin_session` cookie | M2 | survey_3 |
| F09 | API Code Quality & Clean Imports | Remove unused imports and dead code in `src/app/api/...` | M2 | survey_3 |
| F10 | ESLint JSX Unescaped Quotes Fix | Escape raw quotes at `src/app/admin/page.tsx:1571` to achieve 0 lint errors | M3 | survey_2 |
| F11 | Tailwind CSS v4 Theme Tokens | Register missing tokens (`sand`, `sand-light`, `tea-green`, etc.) in `@theme` | M3 | survey_2 |
| F12 | Selection Contrast & Zoom A11y | Fix dark-on-dark selection contrast, enable mobile pinch-zoom | M3 | survey_2 |
| F13 | Branded Error & 404 Boundaries | Implement `src/app/not-found.tsx` and `src/app/error.tsx` | M3 | survey_2 |
| F14 | BookingWizard Defensive Guard | Guard against empty `initialRooms` array to prevent runtime crash | M3 | survey_2 |
| F15 | Frontend Contract Alignment | Align field names (`zaloStatus`, `expiredCount`) between UI and backend | M3 | survey_2 |
| F16 | Mobile Layout & Overflow Defense | Fix narrow screen cramping in `/lookup` and truncate booking codes in `/admin` | M3 | survey_2 |
| F17 | Opaque-Box E2E Testing Suite | Requirements-driven 4-tier test suite with runner and pass/fail semantics | M4-E2E | user_spec |
| F18 | Adversarial Coverage Hardening | Tier 5 adversarial stress testing and verification | M4-E2E | user_spec |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Infrastructure & Deploy Hardening | SQLite singleton, git untrack db, PM2 config, deploy script, typecheck script | none | DONE |
| M2 | Backend API Security & Error Handling | Fix HTTP 405 config, exact phone verification, 404 room handling, 400 JSON errors, secure cookie | none | DONE |
| M3 | Frontend UI, Themes & Defensive Layout | ESLint quote fix, Tailwind `@theme` tokens, contrast/zoom, not-found/error boundaries, empty room guard, mobile layout | M2 | DONE |
| M4 | Final Milestone: 100% E2E Pass & Hardening | Run 100% E2E test suite (Tiers 1-4), adversarial test hardening & browser UI backtest (Tier 5) | M1, M2, M3 | DONE |

## Interface Contracts
### Client UI ↔ Backend Config API (`/api/admin/config`)
- `GET /api/admin/config`: Returns `{ success: true, data: { openTime, closeTime, slotIntervalMinutes, defaultDurationHours, holdDurationHours, closedDates, zaloStatus } }`.
- `PATCH /api/admin/config` / `PUT /api/admin/config`: Accepts partial/full config object, returns `{ success: true, message: string }`.
- Authentication: Requires `x-admin-passcode` header or valid `lvt_admin_session` cookie.

### Client UI ↔ Lookup & Booking Status API (`/api/bookings/lookup`, `/api/bookings/[code]/status`)
- `GET /api/bookings/lookup?reference=CODE&phone=PHONE`: Exact phone match (`normDb === normInput`). If matched, returns `{ success: true, data: booking }`. If phone does not match, returns HTTP 403 `{ success: false, code: 'FORBIDDEN' }`.
- `GET /api/bookings/[code]/status?phone=PHONE`: Returns `{ success: true, data: { status, roomName, bookingDate, startTime, endTime, phoneVerified } }`. Full PII is only returned if `phoneVerified === true`.

### Client UI ↔ Room Management API (`/api/admin/rooms/[id]`)
- `PATCH /api/admin/rooms/[id]`: If room ID does not exist in SQLite, returns HTTP 404 `{ success: false, code: 'NOT_FOUND', error: 'Không tìm thấy phòng trà' }`.

## Code Layout
- `src/app/`: Next.js App Router pages and layouts (`/`, `/booking`, `/lookup`, `/admin`, `/install`, `layout.tsx`, `globals.css`, `not-found.tsx`, `error.tsx`).
- `src/app/api/`: RESTful API route handlers (`bookings`, `rooms`, `availability`, `admin/...`).
- `src/components/`: Reusable React components (`BookingWizard.tsx`, `Navbar.tsx`, `TheArtOfTea.tsx`, etc.).
- `src/lib/`: Backend domain logic and infrastructure (`db.ts`, `booking-service.ts`, `auth.ts`, `config.ts`, `notifications.ts`).
- `data/`: SQLite database storage (`oriental_serenity.db`).
- `scripts/`: Operational scripts, deployment script, test suites.
- `ecosystem.config.js`: Production process configuration for PM2.
