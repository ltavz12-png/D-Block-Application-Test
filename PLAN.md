# D Block Workspace — Project Plan

> See the detailed plan at: .claude/plans/dazzling-scribbling-acorn.md

## Quick Reference

### Tech Stack
- **Mobile**: React Native + Expo (iOS + Android)
- **Backend**: Node.js / TypeScript / NestJS
- **Database**: PostgreSQL 16+ / Redis
- **Admin Panel**: Next.js 14+ / Ant Design
- **Cloud**: Microsoft Azure
- **Payments**: BOG iPay (primary) / TBC TPay (secondary)
- **Door Access**: SaltoKS (BLE)
- **Accounting**: MS Business Central
- **Email**: SendGrid
- **E-Signature**: DocuSign
- **Analytics**: Firebase + PostHog
- **Errors**: Sentry
- **CI/CD**: GitHub Actions

### Phases
| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Assessment & Planning | Done |
| 1 | Core Infrastructure | In Progress |
| 2 | Booking & Payments | Pending |
| 3 | B2B & Accounting Engine | Pending |
| 4 | Integrations (SaltoKS, BC, Calendar, Email) | Pending |
| 5 | Admin Panel | Pending |
| 6 | Notifications, Promotions, Analytics | Pending |
| 7 | Testing, QA, Performance | Pending |
| 8 | App Store Preparation & Deployment | Pending |
| 9 | Nexudus Migration & Go-Live | Pending |

### Project Structure
```
dblock-workspace/
├── apps/
│   ├── backend/          (NestJS API)
│   │   └── src/
│   │       ├── common/   (database, guards, interceptors, config, i18n)
│   │       └── modules/  (22 feature modules)
│   ├── admin/            (Next.js admin panel)
│   └── mobile/           (React Native app)
├── packages/
│   └── shared-types/     (shared TypeScript interfaces)
├── PROGRESS.md
├── PLAN.md
└── DECISIONS.md
```
