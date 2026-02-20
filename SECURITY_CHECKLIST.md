# D Block Workspace — Security Checklist (OWASP Top 10 + Custom)

> Last updated: Phase 7
> Status: In Progress
> Review frequency: Before each release

---

## OWASP Top 10 (2021)

### A01:2021 — Broken Access Control ✅
- [x] RBAC implemented with `@Roles()` decorators on all endpoints
- [x] JWT-based authentication with access + refresh tokens
- [x] Guards enforce role checks before controller execution
- [x] Resource ownership verified (e.g., only host can cancel visitor)
- [x] Admin endpoints restricted to `SUPER_ADMIN`, `FINANCE_ADMIN`, etc.
- [ ] Rate limiting on sensitive endpoints (login, register, password reset)
- [ ] CORS configured for allowed origins only
- [ ] Test: verify 403 when wrong role accesses endpoint
- [ ] Test: verify 401 when no token provided

### A02:2021 — Cryptographic Failures ✅
- [x] Passwords hashed with bcrypt (salt rounds ≥ 10)
- [x] JWT secrets in environment variables, not hardcoded
- [x] Separate secrets for access and refresh tokens
- [ ] HTTPS enforced in production (Azure Application Gateway / nginx)
- [ ] Sensitive data (payment info) never stored in plaintext
- [ ] Database connection uses SSL in production
- [ ] Audit: no secrets committed to git (check .env in .gitignore)

### A03:2021 — Injection ✅
- [x] TypeORM parameterized queries (no raw SQL with string interpolation)
- [x] class-validator DTOs validate all input
- [x] Query builder uses parameter binding (`:paramName`)
- [ ] Test: SQL injection attempts on search/filter endpoints
- [ ] Test: XSS payloads in visitor name, company, purpose fields
- [ ] Content-Security-Policy header configured

### A04:2021 — Insecure Design ✅
- [x] Accounting module uses forward-only corrections (no historical modification)
- [x] Closed accounting periods block modifications
- [x] Visitor status transitions enforce valid state machine
- [x] Booking conflict detection prevents double-booking
- [x] Promo code validation is comprehensive (10-step check)
- [ ] Threat model documented for payment and access control flows
- [ ] Business logic abuse scenarios tested

### A05:2021 — Security Misconfiguration ⚠️
- [ ] Remove Swagger UI in production (or protect with auth)
- [ ] Disable TypeORM `synchronize: true` in production
- [ ] Set `NODE_ENV=production` in deployment
- [ ] Remove debug/verbose logging in production
- [ ] Configure security headers (Helmet middleware)
- [ ] Remove default NestJS error details in production responses
- [ ] Docker container runs as non-root user

### A06:2021 — Vulnerable and Outdated Components ✅
- [x] npm audit in CI/CD pipeline (weekly security audit workflow)
- [ ] Dependabot or Renovate configured for automatic dependency updates
- [ ] Pin major versions in package.json
- [ ] Audit all transitive dependencies quarterly

### A07:2021 — Identification and Authentication Failures ✅
- [x] JWT token expiry configured (access: short-lived, refresh: longer)
- [x] Password strength validation on registration
- [x] Account linking handles same email across OAuth providers
- [ ] Brute force protection (rate limit login attempts per IP/account)
- [ ] 2FA (TOTP) implemented for admin accounts
- [ ] Session invalidation on password change
- [ ] Token blacklisting on logout

### A08:2021 — Software and Data Integrity Failures ⚠️
- [ ] CI/CD pipeline integrity (signed commits, protected branches)
- [ ] npm audit in pre-deploy step
- [ ] Package lock file committed and verified
- [ ] Docker image integrity verification
- [ ] Webhook payload validation (HMAC signatures for payment webhooks)

### A09:2021 — Security Logging and Monitoring Failures ⚠️
- [x] Structured logging with NestJS Logger
- [x] Audit logging interceptor captures mutations
- [ ] Centralized log aggregation (Azure Application Insights / ELK)
- [ ] Alert on: failed login spikes, role escalation attempts, payment failures
- [ ] Log retention policy (90 days min for financial operations)
- [ ] Sentry error tracking configured

### A10:2021 — Server-Side Request Forgery (SSRF) ✅
- [x] External API calls use fixed base URLs (SaltoKS, Business Central, SendGrid)
- [x] No user-controlled URL parameters for server-side requests
- [ ] Validate and sanitize any webhook callback URLs
- [ ] Network segmentation in Azure (restrict outbound from backend)

---

## D Block Custom Security Checks

### Payment Security 🔒
- [ ] BOG iPay signatures verified on callbacks
- [ ] TBC TPay signatures verified on callbacks
- [ ] Payment amounts validated server-side (don't trust client)
- [ ] Refund amounts cannot exceed original payment
- [ ] Payment idempotency keys prevent duplicate charges
- [ ] PCI DSS Level 4 SAQ-A compliance (no card data stored)

### Physical Access (SaltoKS) 🔑
- [ ] Access keys expire with booking/pass expiry
- [ ] Access revoked immediately on cancellation
- [ ] BLE communication encrypted (SaltoKS SDK handles this)
- [ ] Key generation requires valid booking/pass verification
- [ ] Access logs retained for security audit

### Data Protection (Georgian Law + GDPR) 🛡️
- [x] GDPR consent management (analytics/marketing/personalization)
- [x] Data export endpoint (analytics module)
- [x] Data deletion endpoint (analytics module)
- [ ] Privacy policy covers all data collection
- [ ] Cookie consent on admin panel
- [ ] Right to be forgotten implemented across ALL modules
- [ ] Data retention policy enforced (auto-delete after N years)
- [ ] Cross-border data transfer compliance

### Financial Data 💰
- [x] IFRS 15 revenue recognition with audit trail
- [x] Forward-only corrections (no historical modification)
- [x] Closed period protection
- [ ] Financial report access restricted to FINANCE_ADMIN + SUPER_ADMIN
- [ ] Invoice PDFs stored in encrypted blob storage
- [ ] Tax calculation audit trail

---

## Pre-Release Security Gate

Before any production deployment:

1. [ ] `npm audit --production` shows no critical/high vulnerabilities
2. [ ] All OWASP ✅ items are confirmed
3. [ ] All ⚠️ items are addressed or risk-accepted with documented justification
4. [ ] Load test passes (500 concurrent users, p95 < 500ms)
5. [ ] No secrets in codebase (scan with `trufflehog` or `gitleaks`)
6. [ ] API rate limiting enabled
7. [ ] HTTPS enforced, HSTS header set
8. [ ] Database backups configured and tested
9. [ ] Incident response plan documented
10. [ ] Professional penetration test scheduled (recommend external firm)
