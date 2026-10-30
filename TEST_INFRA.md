# Comprehensive E2E Testing Infrastructure (MusicLounge — Lùng Vài Tea)

## 1. Test Philosophy & Principles

The E2E testing infrastructure for the **MusicLounge (Lùng Vài Tea)** booking platform is engineered based on an **opaque-box, specification-driven, and progressive testability** methodology.

### Core Tenets
1. **Opaque-Box Requirement Verification**: Tests treat the web application as a complete system communicating strictly via HTTP/HTTPS protocols, browser DOM interfaces, and REST API contracts. Tests do not inspect or rely on internal implementation hacks.
2. **Deterministic State Lifecycle & Isolation**: Every test run begins with an automated database state reset (`/api/admin/reset`), generates distinct execution parameters (dates, phones, UUID idempotency keys), and restores clean baseline demo data on completion.
3. **Progressive Testability & Defect Escalation**: The suite exercises all features in the PROJECT.md Feature Inventory. Completed milestone features must pass 100%. Pending milestone features (such as M2 security hardening) are rigorously tested and clearly cataloged as **ESCALATED** defects with exact expected vs. observed contracts, empowering milestone workers to verify fixes.
4. **Idempotency & Concurrency Defense**: The test suite validates real-world operational stressors including double booking, overlapping slot reservation attempts, out-of-operating-hours constraints, and rate limiting isolation.

---

## 2. 4-Tier Test Architecture

The testing suite is structured systematically into 4 tiers in `scripts/e2e-comprehensive/`:

```
scripts/e2e-comprehensive/
├── types.ts                        # Shared TypeScript interfaces for results, tiers, and HTTP client
├── helpers.ts                      # Network client, assertions, dynamic IP rotation, DB reset utilities
├── tier1-feature-coverage.ts       # Tier 1: Core user-facing feature coverage (14 tests)
├── tier2-boundary-corner-cases.ts  # Tier 2: Boundary, error handling & corner cases (24 tests)
├── tier3-cross-feature-combinations.ts # Tier 3: Cross-feature combinations & lifecycle state sync (5 tests)
├── tier4-real-world-scenarios.ts   # Tier 4: Real-world customer & admin journeys (4 tests)
└── runner.ts                       # CLI runner with formatted console reporting & exit code semantics
```

### Tier Breakdown
- **Tier 1: Feature Coverage (14 test cases)**
  Covers representative happy-path inputs for every major user-facing and admin capability:
  - Room listing & inspection (`GET /api/rooms`, `/rooms/truc-anh`, `/rooms/tinh-tam`).
  - Availability 15-minute slot calculations (`GET /api/availability`).
  - Booking creation with standard reference format (`POST /api/bookings`).
  - Masked public lookup (`GET /api/bookings/[code]/status`).
  - Verified PII lookup with phone (`GET /api/bookings/lookup`).
  - Admin authentication (`POST /api/admin/auth`) with signed session cookie.
  - Admin booking review lifecycle: Approve, Reject, Cancel.
  - Operational slot block CRUD (`/api/admin/slot-blocks`).
  - Operating configuration (`/api/admin/config`).
  - Admin dashboard analytics (`/api/admin/stats`).
  - Outbox notification queue processing (`/api/admin/notifications`).

- **Tier 2: Boundary & Corner Cases (24 test cases)**
  Stresses system validation boundaries, malicious payloads, and edge conditions:
  - Missing required fields: `customerName`, `customerPhone`, `date`, `startTime`, `roomId` (all 400).
  - Invalid phone format and non-numeric inputs (400).
  - Room capacity bounds (under-capacity and over-capacity checks for 2-10 guests).
  - Temporal boundaries: past bookings, bookings extending past 22:30 closing time.
  - Concurrency conflicts: exact slot collision (409), partial overlap collision (409).
  - Lookup boundaries: non-existent reference (404), mismatched phone (403).
  - PII Protection (F06): Phone suffix mismatch rejection (403).
  - API Error Defense (F07): Updating non-existent room ID returns 404.
  - Payload integrity: malformed JSON strings on booking and admin endpoints (400).
  - Authentication defense: invalid admin passcode (401), unauthenticated access (401).
  - State machine integrity: double-approve conflict (409), cancelling rejected bookings (409).
  - Slot block boundaries: startTime >= endTime rejection (400).
  - Configuration methods: PATCH support on `/api/admin/config` (F05).

- **Tier 3: Cross-Feature Combinations & State Lifecycle (5 test cases)**
  Validates real-time state synchronization across multiple disparate modules:
  - Full Approval Lifecycle: AVAILABLE -> PENDING -> CONFIRMED -> CANCELLED -> AVAILABLE -> Re-booked.
  - Full Rejection Lifecycle: AVAILABLE -> PENDING -> REJECTED -> AVAILABLE immediately -> Re-booked.
  - Operational Slot Block Impact: admin block -> availability grid BLOCKED -> customer booking rejected (409) -> unaffected room booking succeeds -> unblock -> slot AVAILABLE.
  - Dynamic System Settings: admin updates config -> GET reflects update -> settings revert.
  - Idempotency Key Deduplication: network retry with identical key returns existing booking without duplicate DB records.

- **Tier 4: Real-World Scenarios (4 end-to-end user journeys)**
  Replicates complete real-world customer and administrator journeys:
  - Journey 1: Homepage brand discovery -> Room inspection -> Booking wizard submission -> PENDING status with hold timer -> Admin review & approval -> Customer confirmation voucher.
  - Journey 2: Multi-room concurrency: two groups booking different rooms simultaneously for the same slot confirm without collision.
  - Journey 3: Global VIP lockdown across all rooms: event block rejects all room bookings, lift restores public bookings.
  - Journey 4: PII Data Privacy Traversal: anonymous visitor sees masked details, wrong phone gets 403, verified customer sees complete booking slip.

---

## 3. Feature Inventory Coverage Matrix

| Feature ID | Feature Name | Tier 1 | Tier 2 | Tier 3 | Tier 4 | Implementation Status |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| **F01** | Build & Typecheck Validation | ✓ | ✓ | ✓ | ✓ | M1 Baseline |
| **F02** | SQLite Lifecycle & WAL Safety | ✓ | ✓ | ✓ | ✓ | M1 Baseline |
| **F03** | Deploy Hardening & Clean State | ✓ | — | ✓ | — | M1 Baseline |
| **F04** | Configuration Consistency | ✓ | — | ✓ | — | M1 Baseline |
| **F05** | Admin Config PATCH API Support | — | T2-24 | T3-04 | — | M2 Pending (Escalated) |
| **F06** | PII Exact Phone Verification | T1-06 | T2-15 | — | T4-04 | M2 Pending (Escalated) |
| **F07** | 404 Room Handling & 400 JSON Defense | — | T2-16, T2-18 | — | — | M2 Pending (Escalated) |
| **F08** | Security Cookie Hardening | T1-07 | T2-20 | — | T4-01 | M2 Baseline |
| **F09** | API Code Quality & Clean Imports | ✓ | ✓ | ✓ | ✓ | M2 Baseline |
| **F10** | ESLint Unescaped Quotes | ✓ | — | — | — | M3 Scope |
| **F11** | Tailwind v4 Theme Tokens | T1-02 | — | — | T4-01 | M3 Scope |
| **F12** | Selection Contrast & Zoom | T1-02 | — | — | T4-01 | M3 Scope |
| **F13** | Branded Error & 404 Boundaries | T1-02 | T2-13 | — | T4-01 | M3 Scope |
| **F14** | BookingWizard Defensive Guard | T1-02 | — | — | T4-01 | M3 Scope |
| **F15** | Frontend Contract Alignment | T1-14 | — | — | T4-01 | M3 Scope |
| **F16** | Mobile Layout & Overflow Defense | T1-02 | — | — | T4-01 | M3 Scope |
| **F17** | Opaque-Box E2E Testing Suite | ✓ | ✓ | ✓ | ✓ | M4 Delivered |
| **F18** | Adversarial Coverage Hardening | — | ✓ | ✓ | ✓ | M4 Delivered |

---

## 4. Test Runner & Execution Commands

### Full Comprehensive Run
```bash
npx tsx scripts/e2e-comprehensive/runner.ts
```

### Run Specific Tier
```bash
# Run only Tier 1 (Feature Coverage)
npx tsx scripts/e2e-comprehensive/runner.ts --tier=1

# Run only Tier 2 (Boundary & Corner Cases)
npx tsx scripts/e2e-comprehensive/runner.ts --tier=2

# Run only Tier 3 (Cross-Feature Combinations)
npx tsx scripts/e2e-comprehensive/runner.ts --tier=3

# Run only Tier 4 (Real-World Scenarios)
npx tsx scripts/e2e-comprehensive/runner.ts --tier=4
```

### Strict Mode (Enforces 0 Escalations for Final M4 Release)
```bash
npx tsx scripts/e2e-comprehensive/runner.ts --strict
```

### Custom Host / Port
```bash
npx tsx scripts/e2e-comprehensive/runner.ts --base-url=http://localhost:3000
```
