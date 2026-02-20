# D Block Workspace -- On-Call Procedures

## 1. Escalation Paths

| Level | Role | Contact | Response SLA |
|-------|------|---------|--------------|
| L1 | On-call engineer | `<ON_CALL_PHONE>` / `<ON_CALL_SLACK_CHANNEL>` | 15 min |
| L2 | Backend tech lead | `<TECH_LEAD_PHONE>` / `<TECH_LEAD_EMAIL>` | 30 min |
| L3 | Engineering manager | `<ENG_MANAGER_PHONE>` / `<ENG_MANAGER_EMAIL>` | 1 hour |
| L4 | CTO / VP Engineering | `<CTO_PHONE>` / `<CTO_EMAIL>` | 2 hours |

**External vendor contacts:**

| Vendor | Purpose | Contact |
|--------|---------|---------|
| Azure Support | Infrastructure issues | `<AZURE_SUPPORT_PLAN_ID>` |
| BOG iPay | Payment gateway issues (Bank of Georgia) | `<BOG_SUPPORT_EMAIL>` |
| TBC tPay | Payment gateway issues (TBC Bank) | `<TBC_SUPPORT_EMAIL>` |
| SaltoKS | Access control issues | `<SALTO_SUPPORT_EMAIL>` |
| SendGrid | Email delivery issues | `<SENDGRID_SUPPORT_URL>` |

---

## 2. Common Alert Response Procedures

### 2.1 High Error Rate (>5% 5xx in 5 min)

**Severity:** 1 (Critical)

1. Open Application Insights and run:
   ```kusto
   requests
   | where timestamp > ago(15m)
   | where toint(resultCode) >= 500
   | summarize count() by name, resultCode
   | order by count_ desc
   ```
2. Identify whether errors are concentrated on one endpoint or spread across the service.
3. Check the exception telemetry:
   ```kusto
   exceptions
   | where timestamp > ago(15m)
   | summarize count() by type, outerMessage
   | order by count_ desc
   ```
4. If errors are database-related, proceed to **Section 6 -- Database Connection Troubleshooting**.
5. If errors are isolated to a single deployment slot, swap to the healthy slot (see **Section 5**).
6. If the root cause is a bad deployment, roll back:
   ```bash
   az webapp deployment slot swap \
     --resource-group dblock-prod-rg \
     --name dblock-workspace-api \
     --slot staging \
     --target-slot production
   ```

### 2.2 Slow Response Time (P95 > 2s)

**Severity:** 2 (Warning)

1. Identify the slowest endpoints:
   ```kusto
   requests
   | where timestamp > ago(15m)
   | summarize p95 = percentile(duration, 95), count() by name
   | where p95 > 2000
   | order by p95 desc
   ```
2. Check for N+1 queries or slow database calls:
   ```kusto
   dependencies
   | where timestamp > ago(15m) and type == "SQL"
   | summarize p95 = percentile(duration, 95), count() by data
   | where p95 > 500
   | order by p95 desc
   ```
3. Check Redis latency and hit rates.
4. If the issue is load-related, scale up (see **Section 5**).

### 2.3 High CPU / High Memory (>85%)

**Severity:** 2 (Warning)

1. Confirm in Azure Portal under App Service > Metrics.
2. Check for memory leaks or runaway processes:
   ```kusto
   performanceCounters
   | where timestamp > ago(1h)
   | where name == "Private Bytes" or name == "% Processor Time"
   | summarize avg(value) by bin(timestamp, 5m), name
   | render timechart
   ```
3. Scale up immediately if sustained (see **Section 5**).
4. If memory is climbing without recovery, restart the App Service (see **Section 4**).

### 2.4 Payment Failure Spike (>10%)

**Severity:** 1 (Critical)

1. Determine which payment provider is failing:
   ```kusto
   customEvents
   | where timestamp > ago(15m) and name startswith "payment_"
   | summarize count() by name, customDimensions.provider
   | order by count_ desc
   ```
2. Check provider status pages:
   - BOG iPay: `https://status.bog.ge` (or contact support)
   - TBC tPay: `https://status.tbcbank.ge` (or contact support)
3. If one provider is down, initiate failover (see **Section 7**).
4. Notify finance team via `<FINANCE_SLACK_CHANNEL>`.

### 2.5 Auth Brute Force (>20 failed logins from same IP)

**Severity:** 1 (Critical)

1. Identify the attacking IPs:
   ```kusto
   requests
   | where timestamp > ago(15m)
   | where url contains "/auth/login" and toint(resultCode) == 401
   | summarize attempts = count() by client_IP
   | where attempts > 20
   | order by attempts desc
   ```
2. Block the IP at the Azure Front Door / WAF level:
   ```bash
   az network front-door waf-policy custom-rule create \
     --resource-group dblock-prod-rg \
     --policy-name dblockWafPolicy \
     --name BlockBruteForceIP \
     --priority 100 \
     --action Block \
     --rule-type MatchRule \
     --match-condition "RemoteAddr" "IPMatch" "<OFFENDING_IP>"
   ```
3. Check if any accounts were compromised and force password resets if necessary.
4. Notify the security team.

### 2.6 Failed Health Checks (3 consecutive)

**Severity:** 1 (Critical)

1. Verify the health endpoint manually:
   ```bash
   curl -s https://api.dblock.ge/health | jq .
   ```
2. If the endpoint is unreachable, check App Service status in Azure Portal.
3. Restart the service (see **Section 4**).
4. If restart does not resolve, check database and Redis connectivity:
   ```bash
   curl -s https://api.dblock.ge/health/ready | jq .
   ```
5. If database is the issue, proceed to **Section 6**.

---

## 3. How to Check Logs (Application Insights Queries)

### Access Application Insights

1. Go to Azure Portal > Application Insights > `dblock-workspace-ai`.
2. Open **Logs** from the left menu.

### Useful queries

**Recent exceptions:**
```kusto
exceptions
| where timestamp > ago(1h)
| project timestamp, type, outerMessage, innermostMessage
| order by timestamp desc
| take 50
```

**Requests by status code:**
```kusto
requests
| where timestamp > ago(1h)
| summarize count() by resultCode
| order by count_ desc
```

**Slow dependencies (DB, Redis, HTTP):**
```kusto
dependencies
| where timestamp > ago(1h) and duration > 1000
| project timestamp, type, name, duration, resultCode
| order by duration desc
| take 50
```

**Custom events (business operations):**
```kusto
customEvents
| where timestamp > ago(1h)
| summarize count() by name
| order by count_ desc
```

**Trace logs for a specific correlation ID:**
```kusto
union requests, traces, exceptions
| where operation_Id == "<CORRELATION_ID>"
| order by timestamp asc
```

---

## 4. How to Restart Services

### Restart the App Service

```bash
az webapp restart \
  --resource-group dblock-prod-rg \
  --name dblock-workspace-api
```

### Restart a specific deployment slot

```bash
az webapp restart \
  --resource-group dblock-prod-rg \
  --name dblock-workspace-api \
  --slot staging
```

### Force-kill all instances and cold-start

```bash
az webapp stop \
  --resource-group dblock-prod-rg \
  --name dblock-workspace-api

# Wait 10 seconds
sleep 10

az webapp start \
  --resource-group dblock-prod-rg \
  --name dblock-workspace-api
```

### Restart Redis Cache

```bash
az redis force-reboot \
  --resource-group dblock-prod-rg \
  --name dblock-workspace-redis \
  --reboot-type AllNodes
```

> **Warning:** Rebooting Redis clears all cached data. Sessions and rate-limit counters will be reset.

---

## 5. How to Scale Up / Down

### Scale App Service vertically (change plan tier)

```bash
# Scale up to P2v3 (more CPU/RAM)
az appservice plan update \
  --resource-group dblock-prod-rg \
  --name dblock-workspace-plan \
  --sku P2v3

# Scale back down to P1v3 after incident
az appservice plan update \
  --resource-group dblock-prod-rg \
  --name dblock-workspace-plan \
  --sku P1v3
```

### Scale App Service horizontally (add/remove instances)

```bash
# Scale out to 4 instances
az appservice plan update \
  --resource-group dblock-prod-rg \
  --name dblock-workspace-plan \
  --number-of-workers 4

# Scale back to 2 instances
az appservice plan update \
  --resource-group dblock-prod-rg \
  --name dblock-workspace-plan \
  --number-of-workers 2
```

### Scale PostgreSQL

```bash
# Scale up compute tier
az postgres flexible-server update \
  --resource-group dblock-prod-rg \
  --name dblock-workspace-db \
  --sku-name Standard_D4ds_v4

# Increase storage
az postgres flexible-server update \
  --resource-group dblock-prod-rg \
  --name dblock-workspace-db \
  --storage-size 256
```

### Scale Redis Cache

```bash
az redis update \
  --resource-group dblock-prod-rg \
  --name dblock-workspace-redis \
  --sku Premium \
  --vm-size P2
```

---

## 6. Database Connection Troubleshooting

### Symptoms
- `CannotCreateDriverError` or `ConnectionTimeoutError` in logs.
- Health endpoint shows `database: disconnected`.
- High active connection count in Azure metrics.

### Diagnosis

1. Check current connection count:
   ```kusto
   dependencies
   | where timestamp > ago(15m) and type == "SQL"
   | summarize count() by bin(timestamp, 1m)
   | render timechart
   ```
2. Verify connection limits:
   ```bash
   az postgres flexible-server show \
     --resource-group dblock-prod-rg \
     --name dblock-workspace-db \
     --query "{tier: sku.tier, name: sku.name, maxConnections: ''}"
   ```
3. Check for long-running queries (connect via `psql` or Azure Portal Query Editor):
   ```sql
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
   FROM pg_stat_activity
   WHERE state != 'idle'
   ORDER BY duration DESC
   LIMIT 20;
   ```

### Resolution

1. **Kill long-running queries** (if safe to do so):
   ```sql
   SELECT pg_terminate_backend(<PID>);
   ```
2. **Restart the application** to reset the connection pool (see **Section 4**).
3. **Increase the connection pool size** in the environment variable `TYPEORM_POOL_SIZE` (default is usually 10). Deploy the change.
4. **Scale up PostgreSQL** if the server is at its connection limit (see **Section 5**).
5. **Check firewall rules** if a new IP needs access:
   ```bash
   az postgres flexible-server firewall-rule list \
     --resource-group dblock-prod-rg \
     --name dblock-workspace-db
   ```

---

## 7. Payment Gateway Failover Procedure

D Block Workspace supports two payment gateways: **BOG iPay** (Bank of Georgia) and **TBC tPay** (TBC Bank). When one provider experiences an outage, traffic can be routed to the other.

### Determine which provider is down

```kusto
customEvents
| where timestamp > ago(30m) and name == "payment_failed"
| summarize failures = count() by tostring(customDimensions.provider)
```

### Enable failover mode

Set the environment variable to switch the primary payment provider:

```bash
# Failover to TBC tPay
az webapp config appsettings set \
  --resource-group dblock-prod-rg \
  --name dblock-workspace-api \
  --settings PAYMENT_PRIMARY_PROVIDER=tbc

# Or failover to BOG iPay
az webapp config appsettings set \
  --resource-group dblock-prod-rg \
  --name dblock-workspace-api \
  --settings PAYMENT_PRIMARY_PROVIDER=bog
```

### Post-failover

1. Monitor the error rate for 10 minutes after switching.
2. Notify the finance team that transactions are routing through the backup provider.
3. Open a support ticket with the failing provider.
4. Once the provider is back, test manually, then switch back:
   ```bash
   az webapp config appsettings set \
     --resource-group dblock-prod-rg \
     --name dblock-workspace-api \
     --settings PAYMENT_PRIMARY_PROVIDER=bog
   ```

---

## 8. SaltoKS Fallback Procedures

SaltoKS provides smart lock access control via the Clay platform. When the SaltoKS API is unavailable, members cannot obtain digital keys or use BLE to unlock doors.

### Verify SaltoKS connectivity

```bash
curl -s https://api.dblock.ge/health | jq '.checks'
```

Check the Application Insights custom events:
```kusto
customEvents
| where timestamp > ago(30m) and name startswith "salto_"
| summarize count() by name
```

### If SaltoKS API is unreachable

1. **Confirm the outage** by contacting SaltoKS support or checking their status page.
2. **Enable physical key fallback** -- notify on-site staff to distribute physical backup keys from the secure key cabinet at each location.
3. **Set the application to fallback mode:**
   ```bash
   az webapp config appsettings set \
     --resource-group dblock-prod-rg \
     --name dblock-workspace-api \
     --settings SALTOKS_MODE=fallback
   ```
   In fallback mode, the API returns a clear message to mobile app users explaining that physical access is temporarily required and on-site staff will assist.
4. **Notify members** via push notification or email:
   - Use the Admin Panel > Notifications > Broadcast to send a message to affected locations.

### When SaltoKS recovers

1. Set the mode back to live:
   ```bash
   az webapp config appsettings set \
     --resource-group dblock-prod-rg \
     --name dblock-workspace-api \
     --settings SALTOKS_MODE=live
   ```
2. Verify key grants are working:
   ```kusto
   customEvents
   | where timestamp > ago(10m) and name == "salto_key_grant"
   | summarize count()
   ```
3. Collect physical backup keys from members and return them to the secure key cabinet.
4. Send a recovery notification to members.

---

## 9. Incident Post-Mortem Template

After every Severity 1 incident, fill out the following within 48 hours:

| Field | Value |
|-------|-------|
| **Incident ID** | `INC-YYYY-NNN` |
| **Date** | |
| **Duration** | |
| **Severity** | |
| **Affected services** | |
| **Impact** | (users affected, revenue impact, bookings missed) |
| **Root cause** | |
| **Timeline** | (detection, response, mitigation, resolution) |
| **Action items** | |
| **Responders** | |

Post the completed post-mortem to `<POSTMORTEM_CONFLUENCE_SPACE>` and review in the next engineering retrospective.
