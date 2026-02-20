# D Block Workspace — Technical Decisions Log

## D001: Cross-Platform Framework — React Native
**Date:** 2026-02-20
**Decision:** Use React Native with Expo for the mobile app
**Alternatives considered:** Flutter, Native (Swift + Kotlin)
**Rationale:** Single codebase, mature BLE libraries for SaltoKS integration, larger developer pool in Georgian market, better native module bridging for SaltoKS SDK than Flutter

## D002: Backend Framework — NestJS
**Date:** 2026-02-20
**Decision:** Node.js / TypeScript with NestJS framework
**Alternatives considered:** Python/Django, Go
**Rationale:** Enterprise-grade module system maps perfectly to D Block's 20+ feature domains; TypeScript end-to-end with React Native; native WebSocket support; excellent ORM ecosystem

## D003: Database — PostgreSQL
**Date:** 2026-02-20
**Decision:** PostgreSQL 16+ as primary database
**Alternatives considered:** MySQL, MongoDB
**Rationale:** ACID compliance mandatory for IFRS 15 financial engine; JSONB for flexible resource metadata; RLS for multi-tenant B2B isolation; table partitioning for growing financial ledger

## D004: Cloud — Azure
**Date:** 2026-02-20
**Decision:** Microsoft Azure
**Alternatives considered:** AWS, GCP
**Rationale:** Seamless MS Business Central integration via same Azure AD/Entra ID; avoids cross-cloud auth complexity

## D005: Payment Gateways — BOG iPay + TBC TPay
**Date:** 2026-02-20
**Decision:** Bank of Georgia iPay (primary) + TBC TPay (secondary)
**Alternatives considered:** Stripe
**Rationale:** Stripe does NOT support GEL currency natively; Georgian banks required for local card acquiring and regulatory compliance; dual gateway maximizes payment success rates

## D006: Door Access — BLE Only
**Date:** 2026-02-20
**Decision:** BLE-only digital keys via SaltoKS SDK
**Alternatives considered:** Apple/Google Wallet keys
**Rationale:** SaltoKS does not support wallet keys in KS platform (only in SALTO Space/Homelok); stakeholder confirmed BLE-only is acceptable

## D007: Architecture — Modular Monolith
**Date:** 2026-02-20
**Decision:** Modular monolith, structured for future microservice extraction
**Rationale:** Single deployable unit simplifies development and debugging; NestJS modules provide clear boundaries; accounting module is first candidate for future extraction if needed

## D008: E-Signature — DocuSign
**Date:** 2026-02-20
**Decision:** DocuSign for B2B contract digital signing
**Rationale:** Industry standard, best API, most legally recognized

## D009: In-App Support — Custom Built
**Date:** 2026-02-20
**Decision:** Build custom ticket system instead of integrating Intercom/Zendesk
**Rationale:** No monthly per-seat cost; fully integrated with admin panel; photo upload and issue routing built to D Block's exact needs

## D010: iBank Reconciliation — Both Banks
**Date:** 2026-02-20
**Decision:** Support reconciliation with both BOG and TBC bank statements
**Rationale:** Dual payment gateway means statements from both banks need reconciliation

## D011: Multi-Brand — Single Brand Only
**Date:** 2026-02-20
**Decision:** Build for D Block only; no multi-brand architecture
**Rationale:** No other workspace brands planned by Adjara Group; architecture kept flexible for future extension but not over-engineered for hypothetical multi-brand
