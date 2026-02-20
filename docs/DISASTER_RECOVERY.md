# D Block Workspace — Disaster Recovery Plan

> **Version:** 1.0
> **Last Updated:** 2026-02-20
> **Owner:** IT Product Team — Adjara Group
> **Review Cycle:** Quarterly
> **Classification:** Internal — Confidential

---

## Table of Contents

1. [Recovery Objectives](#1-recovery-objectives)
2. [Infrastructure Overview](#2-infrastructure-overview)
3. [Disaster Scenarios and Response Procedures](#3-disaster-scenarios-and-response-procedures)
4. [Backup Strategy](#4-backup-strategy)
5. [DR Testing Schedule](#5-dr-testing-schedule)
6. [Communication Plan](#6-communication-plan)
7. [Post-Incident Review Template](#7-post-incident-review-template)
8. [Appendix](#8-appendix)

---

## 1. Recovery Objectives

### Recovery Point Objective (RPO)

| Component              | RPO          | Mechanism                                      |
|------------------------|--------------|-------------------------------------------------|
| PostgreSQL Database    | **1 hour**   | WAL archiving + automated daily backups         |
| Azure Blob Storage     | **24 hours** | GRS (Geo-Redundant Storage) replication          |
| Redis Cache            | **N/A**      | Ephemeral cache — rebuilt from database          |
| Application Config     | **0**        | Stored in Git (version controlled)               |
| Azure Key Vault        | **0**        | Soft-delete + purge protection enabled           |

### Recovery Time Objective (RTO)

| Scope                    | RTO            | Strategy                                       |
|--------------------------|----------------|------------------------------------------------|
| Single service failure   | **30 minutes** | Auto-restart, health checks, slot swap          |
| Database recovery        | **2 hours**    | PITR or replica failover                        |
| Full system recovery     | **4 hours**    | Cross-region restore from geo-redundant backups |
| Complete region failure   | **4 hours**    | Geo-restore + redeployment pipeline             |

---

## 2. Infrastructure Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Azure Region (Primary)                │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  App Service  │  │  App Service  │  │  App Service  │  │
│  │   (Backend)   │  │  (Frontend)   │  │   (Admin)     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│  ┌──────┴─────────────────┴──────────────────┴───────┐  │
│  │              Azure Virtual Network                 │  │
│  └──────┬─────────────────┬──────────────────┬───────┘  │
│         │                 │                  │          │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐  │
│  │  PostgreSQL   │  │    Redis     │  │    Blob      │  │
│  │  Flexible     │  │    Cache     │  │   Storage    │  │
│  │   Server      │  │              │  │   (GRS)      │  │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘  │
│         │                                    │          │
│  ┌──────┴───────┐                    ┌──────┴───────┐  │
│  │  Key Vault   │                    │  Container   │  │
│  │              │                    │  Registry    │  │
│  └──────────────┘                    └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Critical Services Priority

| Priority | Service                  | Impact if Down                            |
|----------|--------------------------|-------------------------------------------|
| P0       | PostgreSQL Database      | Complete system outage                     |
| P0       | Backend API (App Service)| All operations blocked                     |
| P1       | Redis Cache              | Performance degradation, sessions lost      |
| P1       | Azure Blob Storage       | File uploads/downloads unavailable          |
| P2       | Frontend App             | Users cannot access UI                      |
| P2       | Admin Dashboard          | Management operations blocked               |
| P3       | SaltoKS Integration      | Physical access control degraded            |
| P3       | Payment Gateway (BOG/TBC)| Booking payments unavailable                |

---

## 3. Disaster Scenarios and Response Procedures

### Scenario A: Single Service Failure (App Service Crash)

**Symptoms:**
- Health check endpoints returning non-200 status
- Application Insights alerts firing
- Users reporting 502/503 errors

**Automated Response:**
1. Azure App Service health checks detect failure (configured at 30-second intervals)
2. Auto-restart triggered by App Service platform
3. If restart fails 3 times, deployment slot swap is initiated

**Manual Response Procedure:**
```bash
# 1. Check current status
az webapp show --name dblock-api-{env} --resource-group dblock-{env}-rg --query state

# 2. Check recent logs
az webapp log tail --name dblock-api-{env} --resource-group dblock-{env}-rg

# 3. Restart the service
az webapp restart --name dblock-api-{env} --resource-group dblock-{env}-rg

# 4. If restart fails, swap to last known good slot
az webapp deployment slot swap \
  --name dblock-api-{env} \
  --resource-group dblock-{env}-rg \
  --slot staging \
  --target-slot production

# 5. Scale up if resource exhaustion is the cause
az webapp scale --name dblock-api-{env} \
  --resource-group dblock-{env}-rg \
  --number-of-workers 3
```

**Verification:**
- Confirm health endpoint returns 200
- Check Application Insights for error rate normalization
- Verify end-to-end booking flow in production

**Estimated Recovery Time:** 5-30 minutes

---

### Scenario B: Database Failure

**Symptoms:**
- Application returning 500 errors on data operations
- Connection timeout errors in logs
- PostgreSQL server unreachable

**Response Procedure:**

#### Option 1: Point-in-Time Recovery (PITR)
```bash
# 1. Identify the last known good timestamp
az postgres flexible-server show \
  --name dblock-db-{env} \
  --resource-group dblock-{env}-rg

# 2. Initiate point-in-time restore
az postgres flexible-server restore \
  --name dblock-db-{env}-restored \
  --resource-group dblock-{env}-rg \
  --source-server dblock-db-{env} \
  --restore-time "2026-02-20T10:00:00Z"

# 3. Verify restored database
psql -h dblock-db-{env}-restored.postgres.database.azure.com \
  -U dbadmin -d dblock \
  -c "SELECT count(*) FROM bookings WHERE created_at > NOW() - INTERVAL '24 hours';"

# 4. Update application connection string in Key Vault
az keyvault secret set \
  --vault-name dblock-{env}-kv \
  --name "DATABASE-URL" \
  --value "postgresql://dbadmin:****@dblock-db-{env}-restored.postgres.database.azure.com:5432/dblock?sslmode=require"

# 5. Restart application to pick up new connection
az webapp restart --name dblock-api-{env} --resource-group dblock-{env}-rg
```

#### Option 2: Read Replica Failover
```bash
# 1. Promote read replica to primary
az postgres flexible-server replica stop-replication \
  --name dblock-db-{env}-replica \
  --resource-group dblock-{env}-rg

# 2. Update connection strings
# (same as PITR step 4 above, pointing to replica)

# 3. Restart application services
az webapp restart --name dblock-api-{env} --resource-group dblock-{env}-rg
```

**Post-Recovery:**
- Run TypeORM migrations: `npx typeorm migration:run`
- Verify data integrity with row count checks
- Monitor for replication lag if replica was promoted
- Create a new read replica once primary is stable

**Estimated Recovery Time:** 30 minutes - 2 hours

---

### Scenario C: Redis Failure

**Symptoms:**
- Session management errors
- Increased response times
- Cache miss rates at 100%
- Redis connection refused errors in logs

**Response Procedure:**
```bash
# 1. Check Redis status
az redis show --name dblock-redis-{env} --resource-group dblock-{env}-rg --query provisioningState

# 2. Force reboot if unresponsive
az redis force-reboot --name dblock-redis-{env} --resource-group dblock-{env}-rg --reboot-type PrimaryNode

# 3. If reboot fails, create new Redis instance
az redis create \
  --name dblock-redis-{env}-new \
  --resource-group dblock-{env}-rg \
  --location westeurope \
  --sku Basic \
  --vm-size c0

# 4. Update connection string in Key Vault
az keyvault secret set \
  --vault-name dblock-{env}-kv \
  --name "REDIS-URL" \
  --value "rediss://:****@dblock-redis-{env}-new.redis.cache.windows.net:6380"

# 5. Restart application (will cold-start cache from DB)
az webapp restart --name dblock-api-{env} --resource-group dblock-{env}-rg
```

**Application Behavior During Redis Outage:**
- The application is designed to fall back to direct database queries when Redis is unavailable
- Sessions may be lost; users will need to re-authenticate
- Performance will be degraded until cache is warm
- Automatic reconnection is handled by the Redis client with exponential backoff

**Cache Warm-Up After Recovery:**
- Critical data (workspace availability, active bookings) is repopulated on first access
- Full cache warm-up takes approximately 15-30 minutes under normal traffic

**Estimated Recovery Time:** 10-30 minutes

---

### Scenario D: Complete Region Failure

**Symptoms:**
- All Azure services in primary region unavailable
- Azure status page confirms regional outage
- No connectivity to any D Block infrastructure component

**Response Procedure:**

```bash
# 1. Confirm regional outage via Azure Status
# https://status.azure.com/

# 2. Restore PostgreSQL from geo-redundant backup
az postgres flexible-server geo-restore \
  --name dblock-db-dr \
  --resource-group dblock-dr-rg \
  --source-server /subscriptions/{sub-id}/resourceGroups/dblock-{env}-rg/providers/Microsoft.DBforPostgreSQL/flexibleServers/dblock-db-{env} \
  --location northeurope

# 3. Create new Redis instance in DR region
az redis create \
  --name dblock-redis-dr \
  --resource-group dblock-dr-rg \
  --location northeurope \
  --sku Basic \
  --vm-size c0

# 4. Deploy application to DR region App Service
az webapp create \
  --name dblock-api-dr \
  --resource-group dblock-dr-rg \
  --plan dblock-dr-plan \
  --deployment-container-image-name dblockacr.azurecr.io/dblock-api:latest

# 5. Restore Blob Storage from GRS
az storage account failover \
  --name dblockblob{env} \
  --resource-group dblock-dr-rg

# 6. Update DNS to point to DR region
az network dns record-set a update \
  --name api \
  --zone-name dblock.ge \
  --resource-group dblock-dns-rg \
  --set "aRecords[0].ipv4Address={DR_IP}"

# 7. Notify all stakeholders of failover
```

**Pre-Requirements for Region Failover:**
- DR resource group `dblock-dr-rg` must exist in secondary region
- App Service plan must be pre-provisioned in secondary region
- Container Registry has geo-replication enabled
- DNS TTL must be set low enough (300 seconds recommended) for fast propagation

**Estimated Recovery Time:** 2-4 hours

---

### Scenario E: Data Corruption

**Symptoms:**
- Application returning incorrect data
- Data integrity check failures
- User reports of missing or wrong bookings/payments
- Audit log discrepancies

**Response Procedure:**

```bash
# 1. IMMEDIATELY: Stop write operations to prevent further corruption
az webapp stop --name dblock-api-{env} --resource-group dblock-{env}-rg

# 2. Identify the scope of corruption
psql -h dblock-db-{env}.postgres.database.azure.com -U dbadmin -d dblock <<'SQL'
  -- Check row counts against expected values
  SELECT schemaname, relname, n_live_tup
  FROM pg_stat_user_tables
  ORDER BY n_live_tup DESC;

  -- Check for recent suspicious changes
  SELECT * FROM audit_log
  WHERE created_at > NOW() - INTERVAL '24 hours'
  ORDER BY created_at DESC
  LIMIT 100;
SQL

# 3. Identify the last known good point in time
# Review audit logs and application logs to determine when corruption started

# 4. Restore from backup (see restore.sh)
./scripts/restore.sh --env {env} --source "2026-02-20T08:00:00Z" --target-db dblock_restored

# 5. Compare restored data with current data
psql -h dblock-db-{env}.postgres.database.azure.com -U dbadmin -d dblock <<'SQL'
  -- Compare key tables
  SELECT 'bookings' as tbl, count(*) FROM bookings
  UNION ALL
  SELECT 'bookings_restored', count(*) FROM dblink(
    'dbname=dblock_restored', 'SELECT count(*) FROM bookings'
  ) AS t(count bigint);
SQL

# 6. Once validated, swap the restored database to primary
# (Follow Scenario B: Database Failure procedure)

# 7. Restart application
az webapp start --name dblock-api-{env} --resource-group dblock-{env}-rg

# 8. Monitor closely for recurrence
```

**Estimated Recovery Time:** 1-3 hours depending on corruption scope

---

### Scenario F: Security Breach

**Symptoms:**
- Unauthorized access detected in audit logs
- Anomalous API call patterns
- Azure Security Center alerts
- Reports of unauthorized data access

**Incident Response Procedure:**

#### Phase 1: Contain (Immediate — within 15 minutes)
```bash
# 1. Isolate affected services
az webapp update --name dblock-api-{env} \
  --resource-group dblock-{env}-rg \
  --set siteConfig.ipSecurityRestrictions="[{\"ipAddress\":\"ADMIN_IP/32\",\"action\":\"Allow\"}]"

# 2. Revoke all active sessions
az redis flush --name dblock-redis-{env} --resource-group dblock-{env}-rg

# 3. Disable compromised accounts (if identified)
psql -h dblock-db-{env}.postgres.database.azure.com -U dbadmin -d dblock \
  -c "UPDATE users SET is_active = false WHERE id IN (SELECT user_id FROM suspicious_activity);"
```

#### Phase 2: Assess (Within 1 hour)
```bash
# 1. Review audit logs
psql -h dblock-db-{env}.postgres.database.azure.com -U dbadmin -d dblock \
  -c "SELECT * FROM audit_log WHERE created_at > NOW() - INTERVAL '48 hours' ORDER BY created_at DESC;"

# 2. Check Azure Activity Log
az monitor activity-log list \
  --resource-group dblock-{env}-rg \
  --start-time $(date -u -d '-48 hours' +%Y-%m-%dT%H:%M:%SZ) \
  --query "[?authorization.action != null]"

# 3. Review Key Vault access logs
az monitor activity-log list \
  --resource-id /subscriptions/{sub-id}/resourceGroups/dblock-{env}-rg/providers/Microsoft.KeyVault/vaults/dblock-{env}-kv \
  --start-time $(date -u -d '-48 hours' +%Y-%m-%dT%H:%M:%SZ)
```

#### Phase 3: Rotate Credentials (Within 2 hours)
```bash
# 1. Rotate database password
NEW_DB_PASS=$(openssl rand -base64 32)
az postgres flexible-server update \
  --name dblock-db-{env} \
  --resource-group dblock-{env}-rg \
  --admin-password "$NEW_DB_PASS"

# 2. Update Key Vault secrets
az keyvault secret set --vault-name dblock-{env}-kv --name "DATABASE-PASSWORD" --value "$NEW_DB_PASS"

# 3. Regenerate Redis access keys
az redis regenerate-keys --name dblock-redis-{env} --resource-group dblock-{env}-rg --key-type Primary

# 4. Rotate Blob Storage keys
az storage account keys renew --account-name dblockblob{env} --resource-group dblock-{env}-rg --key primary

# 5. Rotate application JWT secrets
NEW_JWT_SECRET=$(openssl rand -base64 64)
az keyvault secret set --vault-name dblock-{env}-kv --name "JWT-SECRET" --value "$NEW_JWT_SECRET"

# 6. Rotate BOG/TBC payment gateway API keys
# (Follow provider-specific key rotation procedures)

# 7. Rotate SaltoKS integration credentials
# (Follow SaltoKS key management procedures)

# 8. Restart all services to pick up new credentials
az webapp restart --name dblock-api-{env} --resource-group dblock-{env}-rg
az webapp restart --name dblock-frontend-{env} --resource-group dblock-{env}-rg
az webapp restart --name dblock-admin-{env} --resource-group dblock-{env}-rg
```

#### Phase 4: Restore (If data was compromised)
- Follow Scenario E (Data Corruption) procedure
- Restore from last known good backup before breach

#### Phase 5: Review
- Conduct full post-incident review (see Section 7)
- Report to data protection authorities if personal data was compromised (within 72 hours per GDPR)
- Notify affected users

**Estimated Recovery Time:** 2-4 hours for containment + credential rotation

---

### Scenario G: Payment System Failure

**Symptoms:**
- Payment processing errors (BOG or TBC gateway)
- Users unable to complete bookings
- Payment webhook failures
- Transaction timeout errors

**Response Procedure:**

```bash
# 1. Identify which payment gateway is failing
# Check application logs for payment-related errors
az webapp log tail --name dblock-api-{env} --resource-group dblock-{env}-rg \
  --filter "payment"

# 2. Check payment gateway status pages
# BOG: https://status.bog.ge (or equivalent)
# TBC: https://status.tbcbank.ge (or equivalent)

# 3. Enable failover to backup gateway
# Update feature flag in database or Key Vault
az keyvault secret set \
  --vault-name dblock-{env}-kv \
  --name "PAYMENT-PRIMARY-GATEWAY" \
  --value "TBC"  # Switch from BOG to TBC or vice versa

# 4. Restart API to apply gateway switch
az webapp restart --name dblock-api-{env} --resource-group dblock-{env}-rg
```

**Manual Fallback Procedures:**
- If both gateways are down, enable "Pay at Location" mode
- Queue pending payments for retry when gateway recovers
- Notify operations team to handle manual payment collection

**Payment Reconciliation After Recovery:**
1. Identify all transactions that failed during the outage
2. Cross-reference with gateway transaction logs
3. Retry failed transactions or issue manual corrections
4. Verify no double-charges occurred
5. Update booking statuses accordingly

**Estimated Recovery Time:** 15-30 minutes for gateway switch

---

### Scenario H: SaltoKS System Failure

**Symptoms:**
- Door access control not functioning
- SaltoKS API returning errors
- Users unable to access booked workspaces
- Lock status updates not syncing

**Response Procedure:**

```bash
# 1. Check SaltoKS integration health
az webapp log tail --name dblock-api-{env} --resource-group dblock-{env}-rg \
  --filter "salto"

# 2. Verify SaltoKS API connectivity
curl -s -o /dev/null -w "%{http_code}" \
  https://api.saltoks.com/health

# 3. If SaltoKS is fully down, activate fallback mode
az keyvault secret set \
  --vault-name dblock-{env}-kv \
  --name "SALTO-FALLBACK-MODE" \
  --value "true"

az webapp restart --name dblock-api-{env} --resource-group dblock-{env}-rg
```

**Manual Access Fallback Procedures:**
1. Notify on-site facility management team immediately
2. Deploy staff to D Block locations to provide manual access
3. Use physical master keys stored in secure on-site lockbox
4. Maintain a manual access log (visitor name, workspace, time in/out)
5. Issue temporary PIN codes via SaltoKS admin panel (if admin API is available)

**Post-Recovery Sync:**
1. Once SaltoKS is back online, sync all access records
2. Revoke any temporary access credentials
3. Verify all door statuses are correct
4. Re-enable automated access control
5. Disable fallback mode in Key Vault

**Estimated Recovery Time:** Immediate for manual fallback; SaltoKS-dependent for full recovery

---

## 4. Backup Strategy

### PostgreSQL Database

| Type        | Frequency       | Retention    | Method                              |
|-------------|-----------------|--------------|-------------------------------------|
| Full Backup | Daily at 02:00  | 30 days      | `pg_dump -Fc` + gzip + Blob upload  |
| WAL Archive | Continuous      | 7 days       | Azure managed WAL archiving          |
| Weekly      | Sunday 03:00    | 12 weeks     | Full dump + Blob upload              |
| Monthly     | 1st of month    | 12 months    | Full dump + Blob upload              |
| PITR        | Continuous      | 35 days      | Azure Flexible Server managed        |

**Backup Storage:**
- Primary: `dblockblob{env}` container `backups/postgres/`
- Naming convention: `dblock-{env}-{type}-{YYYY-MM-DD-HHmmss}.dump.gz`
- Storage tier: Hot for 7 days, then Cool for remainder of retention

### Azure Blob Storage

| Strategy            | Details                                        |
|---------------------|------------------------------------------------|
| Redundancy          | GRS (Geo-Redundant Storage)                    |
| Soft Delete         | Enabled — 30 day retention                      |
| Versioning          | Enabled for critical containers                 |
| Lifecycle Policy    | Move to Cool after 30 days, Archive after 90   |

### Redis Cache

| Strategy            | Details                                        |
|---------------------|------------------------------------------------|
| Persistence         | RDB snapshots every 15 minutes                 |
| Export              | Daily RDB export to Blob Storage               |
| Recovery            | Cold start from database (cache is ephemeral)  |

### Configuration and Infrastructure

| Item                | Backup Method                                  |
|---------------------|------------------------------------------------|
| Application Code    | Git repository (GitHub/Azure DevOps)           |
| Infrastructure      | Terraform state in Azure Storage (versioned)   |
| Key Vault Secrets   | Soft-delete + purge protection (90 days)        |
| Docker Images       | Azure Container Registry with geo-replication  |
| CI/CD Pipelines     | Stored in repository as code                   |

### Backup Verification

All backups are verified automatically:
1. `pg_restore --list` is run against every database backup to verify integrity
2. Weekly automated restore test to a temporary database
3. Monthly manual verification of restore procedure
4. Backup success/failure notifications sent to operations channel

---

## 5. DR Testing Schedule

### Quarterly DR Drill Calendar

| Quarter | Month     | Drill Type                        | Scope                          |
|---------|-----------|-----------------------------------|--------------------------------|
| Q1      | January   | Database Recovery                 | PITR restore + migration run   |
| Q2      | April     | Service Failover                  | App Service slot swap drill    |
| Q3      | July      | Full Region Failover              | Complete DR region activation  |
| Q4      | October   | Security Incident Simulation      | Breach response + credential rotation |

### Drill Procedure

1. **Preparation (1 week before)**
   - Notify all stakeholders of upcoming drill
   - Ensure DR runbooks are up to date
   - Verify backup availability
   - Prepare monitoring dashboards

2. **Execution**
   - Follow the relevant scenario procedure from Section 3
   - Record actual times vs. RTO targets
   - Document any deviations or issues
   - Capture screenshots/logs for review

3. **Post-Drill Review (within 3 days)**
   - Compare actual recovery times to objectives
   - Identify gaps or failures in the procedure
   - Update runbooks based on findings
   - File action items for improvements

### Success Criteria

| Metric                       | Target                     |
|------------------------------|----------------------------|
| Database RPO achieved        | Data loss < 1 hour         |
| Single service RTO achieved  | Recovery < 30 minutes      |
| Full system RTO achieved     | Recovery < 4 hours         |
| Runbook accuracy             | No undocumented steps      |
| Team response time           | First responder < 15 min   |

---

## 6. Communication Plan

### Escalation Matrix

| Severity | Response Time | Escalation Path                         |
|----------|---------------|-----------------------------------------|
| P0       | 15 minutes    | On-call Engineer -> Tech Lead -> CTO    |
| P1       | 30 minutes    | On-call Engineer -> Tech Lead           |
| P2       | 2 hours       | On-call Engineer                        |
| P3       | Next business  | Assigned Engineer                       |

### Internal Communication

| Audience           | Channel              | When                            |
|--------------------|----------------------|---------------------------------|
| Engineering Team   | Slack #dblock-incidents | Immediately on detection      |
| Tech Lead / CTO    | Phone + Slack        | P0/P1 within 15 min            |
| Product Team       | Slack #dblock-status | Within 30 min of P0/P1         |
| All Staff          | Email                | For extended outages (> 1 hour) |

### External Communication

| Audience            | Channel              | When                              |
|---------------------|----------------------|-----------------------------------|
| Affected Customers  | Email + In-app       | Within 1 hour of confirmed impact |
| All Customers       | Status page          | For major incidents               |
| Partners (BOG/TBC)  | Direct contact       | When payment systems affected     |
| SaltoKS             | Support ticket       | When access systems affected      |

### Communication Templates

#### Initial Notification
```
Subject: [D Block] Service Disruption — {Service Name}

We are currently experiencing an issue with {service description}.
Our team is actively investigating and working to resolve this.

Impact: {brief description of user impact}
Start Time: {UTC timestamp}
Current Status: Investigating

We will provide updates every 30 minutes until resolution.
```

#### Resolution Notification
```
Subject: [D Block] Service Restored — {Service Name}

The issue affecting {service description} has been resolved.

Start Time: {UTC timestamp}
Resolution Time: {UTC timestamp}
Duration: {total duration}
Root Cause: {brief description}

We apologize for any inconvenience. A full post-incident report
will be available within 48 hours.
```

---

## 7. Post-Incident Review Template

### Incident Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INCIDENT REPORT — D Block Workspace
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Incident ID:        INC-YYYY-NNN
Date:               YYYY-MM-DD
Severity:           P0 / P1 / P2 / P3
Duration:           HH:MM
Incident Commander: [Name]
Author:             [Name]
Review Date:        YYYY-MM-DD

━━━━ SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[2-3 sentence summary of what happened]

━━━━ TIMELINE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HH:MM UTC — [Event description]
HH:MM UTC — [Event description]
HH:MM UTC — [Event description]
HH:MM UTC — [Event description]

━━━━ IMPACT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Users Affected:     [Number/Percentage]
Revenue Impact:     [Estimated]
Bookings Affected:  [Number]
Data Loss:          [Yes/No — Details]
SLA Breach:         [Yes/No]

━━━━ ROOT CAUSE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Detailed technical root cause analysis]

━━━━ WHAT WENT WELL ━━━━━━━━━━━━━━━━━━━━━━━━━

- [Item]
- [Item]

━━━━ WHAT WENT WRONG ━━━━━━━━━━━━━━━━━━━━━━━━

- [Item]
- [Item]

━━━━ ACTION ITEMS ━━━━━━━━━━━━━━━━━━━━━━━━━━━

| # | Action                    | Owner    | Due Date   | Status  |
|---|---------------------------|----------|------------|---------|
| 1 | [Action description]      | [Name]   | YYYY-MM-DD | Open    |
| 2 | [Action description]      | [Name]   | YYYY-MM-DD | Open    |

━━━━ LESSONS LEARNED ━━━━━━━━━━━━━━━━━━━━━━━━

[Key takeaways to prevent recurrence]

━━━━ METRICS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Time to Detect:     [Duration]
Time to Respond:    [Duration]
Time to Resolve:    [Duration]
RPO Achieved:       [Yes/No — Actual data loss]
RTO Achieved:       [Yes/No — Actual recovery time]
```

---

## 8. Appendix

### Key Azure Resource Names

| Resource                | Naming Convention                |
|-------------------------|----------------------------------|
| Resource Group          | `dblock-{env}-rg`               |
| App Service (API)       | `dblock-api-{env}`              |
| App Service (Frontend)  | `dblock-frontend-{env}`         |
| App Service (Admin)     | `dblock-admin-{env}`            |
| PostgreSQL Server       | `dblock-db-{env}`               |
| Redis Cache             | `dblock-redis-{env}`            |
| Storage Account         | `dblockblob{env}`               |
| Key Vault               | `dblock-{env}-kv`               |
| Container Registry      | `dblockacr`                     |
| DR Resource Group       | `dblock-dr-rg`                  |

### Important Contacts

| Role                    | Contact                          |
|-------------------------|----------------------------------|
| On-Call Engineer        | [To be filled]                   |
| Tech Lead               | [To be filled]                   |
| CTO                     | [To be filled]                   |
| Azure Support           | [Support plan details]           |
| BOG Contact             | [To be filled]                   |
| TBC Contact             | [To be filled]                   |
| SaltoKS Support         | [To be filled]                   |

### Related Documents

- `docs/RUNBOOK_QUICK_REFERENCE.md` — Quick command reference
- `scripts/backup.sh` — Automated backup script
- `scripts/restore.sh` — Database restore script
- `SECURITY_CHECKLIST.md` — Security hardening checklist
- `infrastructure/` — Terraform/IaC definitions
