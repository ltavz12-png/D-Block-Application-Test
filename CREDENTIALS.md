# D Block Workspace - Credentials & Setup

> Last verified: 2026-02-22 — All tests passing, CI green, TypeScript zero errors, Expo SDK 54 + Xcode 26

---

## Database (PostgreSQL 16)
- **Host**: localhost
- **Port**: 5432
- **Database**: dblock_workspace
- **Username**: dblock
- **Password**: *(empty — trust auth for local development)*
- **Tables**: 26 (users, bookings, resources, locations, payments, invoices, contracts, companies, credit_packages, credit_transactions, products, rate_codes, user_passes, promotions, promo_codes, notifications, visitors, access_keys, access_logs, support_tickets, audit_logs, accounting_periods, revenue_recognition_entries, user_auth_providers, user_sessions, analytics_events)

### Local PostgreSQL (No Docker)
```bash
# Start PostgreSQL
/tmp/pg_install/pgsql/bin/pg_ctl -D ~/pg_data start

# Stop PostgreSQL
/tmp/pg_install/pgsql/bin/pg_ctl -D ~/pg_data stop

# Connect via psql
/tmp/pg_install/pgsql/bin/psql -U dblock -d dblock_workspace
```

## Redis
- **Host**: localhost
- **Port**: 6379
- **Status**: Optional — backend runs without Redis (try/catch in health check)

---

## Backend API (NestJS)
- **URL**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/health
- **OpenAPI JSON**: http://localhost:3000/api/docs-json
- **API Endpoints**: 175 paths (98 GET, 83 POST, 16 PATCH, 8 DELETE)
- **Modules**: 22 feature modules

## Admin Panel (Next.js 14)
- **URL**: http://localhost:3001
- **Email**: admin@dblock.ge
- **Password**: Admin123!
- **Role**: super_admin
- **Pages**: Dashboard, Finance (Revenue, Invoices, Payments, Accounting Periods, Tax Reports), B2B, Operations (Visitors, Occupancy, Resources, Support), Settings (General, Notifications, Promotions, Analytics), Reports

## Mobile App (React Native + Expo)
- **URL (Web Preview)**: http://localhost:8081
- **Framework**: Expo SDK 54 + Expo Router v6 + React Native 0.81.5 + React 19.1
- **Build System**: EAS Build with Xcode 26 (iOS 26 SDK) — `macos-sequoia-15.6-xcode-26.0`
- **Bundle ID**: `com.adjaragroup.dblock`
- **Screens**: Splash, Welcome, Login, Register, OTP, Home, Bookings, Access, Community, Profile
- **New Architecture**: Enabled (`newArchEnabled: true`)

---

## User Accounts

### Super Admin
- **Email**: admin@dblock.ge
- **Password**: Admin123!
- **Role**: super_admin
- **Name**: Admin DBlock
- **Works on**: Admin Panel + Mobile App + API

### Test Member
- **Email**: user@dblock.ge
- **Password**: Test1234!
- **Role**: member
- **Name**: Test User
- **Phone**: +995555123456
- **Works on**: Mobile App + API

### Admin Panel Roles
| Role | Access |
|------|--------|
| super_admin | Full access to all features |
| finance_admin | Finance, reports, B2B |
| location_manager | Users, B2B, bookings |
| reception_staff | Bookings, operations, visitors |
| marketing_admin | Reports, settings (notifications, promotions, analytics) |
| support_agent | Operations, visitors, bookings |

---

## JWT Authentication
- **Access Token**: 15 minutes (900s) expiry
- **Refresh Token**: 7 days expiry, random hex, stored hashed in DB
- **Secret**: Configured in `apps/backend/.env` (JWT_SECRET)
- **Algorithm**: HS256

---

## Seeded Data

### Locations (3)
| Name | City | Address |
|------|------|---------|
| Stamba Workspace | Tbilisi | 14 Merab Kostava St, Tbilisi 0108, Georgia |
| Radio City | Tbilisi | Tbilisi, Georgia |
| Batumi Workspace | Batumi | Rooms Batumi, Batumi, Georgia |

### Resources (36)
| Type | Count |
|------|-------|
| Office | 9 |
| Hot Desk | 6 |
| Fixed Desk | 6 |
| Meeting Room | 6 |
| Event Space | 3 |
| Parking | 3 |
| Phone Booth | 3 |

### Products & Pricing (5 products, 7 rate codes)
| Product | Type | Rate Code | Price (GEL) |
|---------|------|-----------|-------------|
| Free Community | coworking_pass | FREE-MONTHLY | 0.00 |
| Day Pass | coworking_pass | DAY-PASS | 25.00 |
| Starter Plan | coworking_pass | STARTER-MONTHLY | 350.00 |
| Starter Plan | coworking_pass | STARTER-ANNUAL | 3,500.00 |
| Premium Plan | coworking_pass | PREMIUM-MONTHLY | 850.00 |
| Premium Plan | coworking_pass | PREMIUM-ANNUAL | 8,500.00 |
| Credit Package 100 | credit_package | CREDITS-100 | 200.00 |

### Users (2)
- Admin (super_admin) + Test User (member)

---

## Environment Configuration

### Backend .env (apps/backend/.env)
| Variable | Value | Notes |
|----------|-------|-------|
| NODE_ENV | development | |
| PORT | 3000 | |
| DB_HOST | localhost | |
| DB_PORT | 5432 | |
| DB_USERNAME | dblock | |
| DB_PASSWORD | *(empty)* | Trust auth for local dev |
| DB_NAME | dblock_workspace | |
| JWT_SECRET | your-jwt-secret-change-in-production | Change for production |
| JWT_EXPIRATION | 15m | |
| REDIS_HOST | localhost | Optional |
| All integrations | mock | BOG, TBC, SaltoKS, DocuSign, SendGrid, etc. |

---

## Test Results (Verified 2026-02-22)

### Backend
- **Test Suites**: 28 passed, 28 total
- **Tests**: 779 passed, 779 total
- **TypeScript**: Zero compilation errors
- **Run**: `cd apps/backend && npx jest`

### Admin Panel
- **Test Suites**: 4 passed, 4 total
- **Tests**: 33 passed, 33 total
- **TypeScript**: Zero compilation errors
- **Run**: `cd apps/admin && npx jest`

### Mobile App
- **TypeScript**: Zero compilation errors
- **Run**: `cd apps/mobile && npx tsc --noEmit`

---

## How to Start

### Option A: Local PostgreSQL (No Docker)
```bash
# 1. Start PostgreSQL
/tmp/pg_install/pgsql/bin/pg_ctl -D ~/pg_data start

# 2. Start Backend (port 3000)
cd apps/backend && npm run start:dev

# 3. Start Admin Panel (port 3001)
cd apps/admin && npm run dev

# 4. Start Mobile Web (port 8081)
cd apps/mobile && npx expo start --web
```

### Option B: Docker
```bash
# 1. Start PostgreSQL + Redis
docker compose up -d postgres redis

# 2. Start Backend (port 3000)
cd apps/backend && npm run start:dev

# 3. Start Admin Panel (port 3001)
cd apps/admin && npm run dev

# 4. Start Mobile Web (port 8081)
cd apps/mobile && npx expo start --web
```

---

## Key API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login with email/password |
| POST | /api/v1/auth/login/phone | Login with phone + OTP |
| POST | /api/v1/auth/verify-otp | Verify OTP code |
| POST | /api/v1/auth/refresh | Refresh access token |
| POST | /api/v1/auth/logout | Logout + invalidate session |
| POST | /api/v1/auth/forgot-password | Request password reset |
| POST | /api/v1/auth/2fa/setup | Setup TOTP 2FA |
| POST | /api/v1/auth/social/google | Google OAuth login |
| POST | /api/v1/auth/social/apple | Apple Sign-In |
| POST | /api/v1/auth/social/facebook | Facebook login |

### Core Resources
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/health | Health check (DB + Redis) |
| GET | /api/v1/locations | List all locations |
| GET | /api/v1/resources | List all resources |
| GET | /api/v1/bookings/my | My bookings |
| GET | /api/v1/products | List products & pricing |
| GET | /api/v1/users | List users (admin) |

### Finance & B2B
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/invoices | List invoices |
| GET | /api/v1/accounting/periods | Accounting periods |
| GET | /api/v1/b2b/companies | List B2B companies |
| GET | /api/v1/contracts | List contracts |

### Operations
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/visitors | List visitors |
| GET | /api/v1/notifications | List notifications |
| GET | /api/v1/promotions | List promotions |

---

## Integrations (Mock Mode)

All external integrations run in mock mode for local development:

| Integration | Purpose | Status |
|-------------|---------|--------|
| BOG iPay | Georgian payment gateway | Mock |
| TBC TPay | Georgian payment gateway | Mock |
| SaltoKS | BLE door lock access | Mock |
| DocuSign | B2B contract e-signatures | Mock |
| Google Calendar | Calendar sync | Mock |
| Microsoft Outlook | Calendar sync | Mock |
| SendGrid | Transactional email | Mock |
| Firebase (FCM) | Push notifications | Mock |
| PostHog | Analytics tracking | Mock |
| Firebase Analytics | Analytics tracking | Mock |
| MS Business Central | Accounting integration | Mock |
| Google OAuth | Social login | Mock |
| Apple Sign-In | Social login | Mock |
| Facebook Login | Social login | Mock |

---

## Architecture Summary

| Layer | Technology | Port |
|-------|-----------|------|
| Backend API | NestJS + TypeORM + PostgreSQL | 3000 |
| Admin Panel | Next.js 14 + Ant Design 5 + Zustand | 3001 |
| Mobile App | React Native 0.81.5 + Expo SDK 54 + Expo Router v6 | 8081 |
| Database | PostgreSQL 16 | 5432 |
| Cache | Redis 7 (optional) | 6379 |
| Shared Types | @dblock/shared-types | — |

### Backend Module Count: 22
Auth, Users, Locations, Resources, Bookings, Products, Payments, Passes, Credits, B2B, Contracts, Accounting, Invoices, Access, Calendars, Emails, Visitors, Notifications, Promotions, Analytics, Support, Reports

### i18n
- Languages: English (en) + Georgian (ka)
- Admin: 415+ translation keys per language
- Mobile: Full bilingual support

---

## External Links & Services

### GitHub
- **Repository**: https://github.com/ltavz12-png/D-Block-Application-Test
- **CI Status**: https://github.com/ltavz12-png/D-Block-Application-Test/actions
- **CI Pipeline**: 4 jobs — lint-and-typecheck → backend-tests + admin-tests → build

### Expo / EAS
- **Expo Project**: https://expo.dev/accounts/ltavz12/projects/d-block-application-testing
- **Expo Project ID**: `80175473-057d-44d6-82fc-5aabde941585`
- **Expo Owner**: `ltavz12`
- **EAS Build Profile (preview)**: iOS App Store distribution, Xcode 26 image, auto-increment build number
- **EAS Submit**: Auto-submit to TestFlight via ASC App ID `6759481833`

### Apple Developer
- **Team ID**: `GC28LY5WZK`
- **Team Name**: Luka Tavzarashvili (Individual)
- **Bundle Identifier**: `com.adjaragroup.dblock`
- **App Store Connect App ID**: `6759481833`
- **Distribution Certificate**: Serial `4F5F900D16991A84451762EAFDA7AC65` (Valid, expires Feb 2027)
- **ASC API Key ID**: `3FGD3A72P8`

### TestFlight
- **App Name**: D Block Workspace
- **Latest Build**: #8 (SDK 54, iOS 26 SDK, Xcode 26) — submitted 2026-02-22
- **Build Logs**: https://expo.dev/accounts/ltavz12/projects/d-block-application-testing/builds/1fa53a99-5b0a-4065-b510-7c4f8244a1d6
- **TestFlight Link**: *(check App Store Connect → TestFlight → D Block Workspace for invite link)*

### Local Development URLs
| Service | URL |
|---------|-----|
| Backend API | http://localhost:3000/api/v1 |
| Swagger Docs | http://localhost:3000/api/docs |
| Health Check | http://localhost:3000/api/v1/health |
| Admin Panel | http://localhost:3001 |
| Mobile (Web) | http://localhost:8081 |

---

## Build Commands

### EAS Build (TestFlight)
```bash
cd apps/mobile
npx eas-cli build --platform ios --profile preview --auto-submit
```

### Run Tests
```bash
# Backend (779 tests)
cd apps/backend && npx jest

# Admin (33 tests)
cd apps/admin && npx jest

# Mobile typecheck
cd apps/mobile && npx tsc --noEmit
```
