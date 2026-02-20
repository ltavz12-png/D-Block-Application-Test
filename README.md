# D Block Workspace

Coworking space management platform for **D Block by Adjara Group** — locations in Tbilisi (Stamba, Radio City) and Batumi (Rooms Batumi).

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend** | NestJS + TypeScript, PostgreSQL 16, Redis 7 |
| **Mobile** | React Native + Expo (SDK 52), Expo Router |
| **Admin** | Next.js 14, Ant Design 5, Recharts |
| **Infra** | Azure (Terraform), Docker, GitHub Actions |
| **Payments** | BOG iPay + TBC TPay (Georgian banks) |
| **Access** | SaltoKS BLE door locks |

## Quick Start

### Prerequisites

- Node.js 22+ (LTS)
- PostgreSQL 16+
- Redis 7+
- Expo Go app (iOS/Android) for mobile development

### 1. Clone & Install

```bash
git clone git@github.com:adjaragroup/dblock-workspace.git
cd dblock-workspace

# Install all dependencies (root + all apps)
npm install
cd apps/mobile && npm install && cd ../..
cd apps/admin && npm install && cd ../..
```

### 2. Set Up Environment

```bash
# Copy the example env file
cp apps/backend/.env.example apps/backend/.env

# Edit with your local database credentials
# Required: DATABASE_HOST, DATABASE_PORT, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_NAME
```

### 3. Run Backend

```bash
cd apps/backend
npm run start:dev
# API available at http://localhost:3000
# Swagger docs at http://localhost:3000/api/docs
```

### 4. Run Mobile App

```bash
cd apps/mobile
npx expo start
# Scan QR code with Expo Go (iOS/Android)
# Press 'i' for iOS simulator, 'a' for Android emulator
```

### 5. Run Admin Panel

```bash
cd apps/admin
npm run dev
# Available at http://localhost:3001
```

## Project Structure

```
dblock-workspace/
├── apps/
│   ├── backend/          # NestJS API (22 modules, 772 tests)
│   │   └── src/
│   │       ├── common/   # Database entities, guards, interceptors, monitoring
│   │       └── modules/  # Feature modules (auth, bookings, payments, etc.)
│   ├── mobile/           # React Native + Expo mobile app
│   │   └── src/
│   │       ├── app/      # Expo Router screens (auth + tabs)
│   │       ├── components/
│   │       ├── contexts/
│   │       └── services/
│   └── admin/            # Next.js admin dashboard
│       └── src/
│           ├── app/      # Pages (dashboard, finance, operations, b2b)
│           └── lib/      # API hooks, types, i18n
├── packages/
│   └── shared-types/     # Shared TypeScript types
├── infrastructure/
│   └── terraform/        # Azure IaC (12 files)
├── scripts/              # Deployment, backup, restore scripts
├── monitoring/           # Azure dashboards, alerts, runbooks
├── legal/                # Privacy Policy, ToS, Cookie Policy (EN/KA)
├── docs/                 # Disaster recovery, runbook quick reference
├── k6/                   # Load, stress, spike test scripts
└── .github/workflows/    # CI/CD pipelines
```

## Key Features

- **Booking Engine** — Hot desks, offices, meeting rooms, parking, lockers with conflict detection
- **Payment Processing** — BOG iPay + TBC TPay with automatic failover
- **Pass System** — Monthly/quarterly/annual passes with prorated refunds
- **Credits** — FIFO deduction, 12-month expiry, company allocation
- **B2B Management** — Company accounts, contracts, bulk billing
- **IFRS 15 Revenue Recognition** — Daily automated recognition
- **Digital Access** — SaltoKS BLE door lock integration
- **Visitor Management** — Pre-registration, check-in/out, host notifications
- **Bilingual** — English + Georgian (ქართული)

## Running Tests

```bash
# Backend (772 tests, 28 suites)
cd apps/backend && npx jest

# Admin panel
cd apps/admin && npx jest

# Load testing (requires k6)
k6 run k6/load-test.js
```

## Building for TestFlight

```bash
cd apps/mobile

# First time: link to Expo project
npx eas init
npx eas build:configure

# Build for TestFlight (internal testing)
npx eas build --platform ios --profile preview

# Build for production
npx eas build --platform ios --profile production

# Submit to App Store / TestFlight
npx eas submit --platform ios --profile production
```

## Docker

```bash
# Start PostgreSQL + Redis + Backend
docker compose up -d

# With pgAdmin (dev tools)
docker compose --profile dev-tools up -d
```

## Environment Variables

See `apps/backend/.env.example` for all available configuration options including:
- Database connection
- Redis connection
- JWT secrets
- Payment gateway credentials (BOG iPay, TBC TPay)
- SaltoKS API keys
- SendGrid email
- Sentry DSN
- Business Central credentials

## License

Proprietary - Adjara Group LLC. All rights reserved.
