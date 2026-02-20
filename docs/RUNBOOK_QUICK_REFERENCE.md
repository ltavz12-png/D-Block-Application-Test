# D Block Workspace — Runbook Quick Reference

> **Version:** 1.0
> **Last Updated:** 2026-02-20
> **Environment Variable:** Replace `{env}` with `staging` or `production`

---

## Table of Contents

1. [System Health](#1-system-health)
2. [Logs and Monitoring](#2-logs-and-monitoring)
3. [Service Management](#3-service-management)
4. [Database Operations](#4-database-operations)
5. [Redis Operations](#5-redis-operations)
6. [Backup and Restore](#6-backup-and-restore)
7. [Deployment and Rollback](#7-deployment-and-rollback)
8. [SSL and Security](#8-ssl-and-security)
9. [Application Insights KQL Queries](#9-application-insights-kql-queries)
10. [Emergency Contacts](#10-emergency-contacts)

---

## 1. System Health

### Check all services status
```bash
az webapp show --name dblock-api-{env} --resource-group dblock-{env}-rg --query "{State:state, Availability:availabilityState}" -o table
az webapp show --name dblock-frontend-{env} --resource-group dblock-{env}-rg --query "{State:state, Availability:availabilityState}" -o table
az webapp show --name dblock-admin-{env} --resource-group dblock-{env}-rg --query "{State:state, Availability:availabilityState}" -o table
```

### Check API health endpoint
```bash
curl -s https://dblock-api-{env}.azurewebsites.net/api/health | jq .
```

### Check all resource health in resource group
```bash
az resource list --resource-group dblock-{env}-rg --query "[].{Name:name, Type:type, State:provisioningState}" -o table
```

### Quick health summary (all services)
```bash
for svc in dblock-api-{env} dblock-frontend-{env} dblock-admin-{env}; do echo -n "$svc: "; az webapp show --name $svc --resource-group dblock-{env}-rg --query state -o tsv 2>/dev/null || echo "UNREACHABLE"; done
```

---

## 2. Logs and Monitoring

### View recent backend logs (live tail)
```bash
az webapp log tail --name dblock-api-{env} --resource-group dblock-{env}-rg
```

### View recent logs (last 200 lines)
```bash
az webapp log download --name dblock-api-{env} --resource-group dblock-{env}-rg --log-file /tmp/dblock-logs.zip && unzip -p /tmp/dblock-logs.zip
```

### View deployment logs
```bash
az webapp log deployment show --name dblock-api-{env} --resource-group dblock-{env}-rg
```

### Stream container logs
```bash
az webapp log tail --name dblock-api-{env} --resource-group dblock-{env}-rg --provider docker
```

### View Azure Activity Log (last 24h)
```bash
az monitor activity-log list --resource-group dblock-{env}-rg --start-time $(date -u -d '-24 hours' +%Y-%m-%dT%H:%M:%SZ) --query "[].{Time:eventTimestamp, Operation:operationName.localizedValue, Status:status.localizedValue}" -o table
```

### View App Service metrics (CPU/Memory)
```bash
az monitor metrics list --resource /subscriptions/{sub-id}/resourceGroups/dblock-{env}-rg/providers/Microsoft.Web/sites/dblock-api-{env} --metric "CpuPercentage" --interval PT5M --start-time $(date -u -d '-1 hour' +%Y-%m-%dT%H:%M:%SZ) -o table
az monitor metrics list --resource /subscriptions/{sub-id}/resourceGroups/dblock-{env}-rg/providers/Microsoft.Web/sites/dblock-api-{env} --metric "MemoryPercentage" --interval PT5M --start-time $(date -u -d '-1 hour' +%Y-%m-%dT%H:%M:%SZ) -o table
```

---

## 3. Service Management

### Restart backend service
```bash
az webapp restart --name dblock-api-{env} --resource-group dblock-{env}-rg
```

### Restart all services
```bash
az webapp restart --name dblock-api-{env} --resource-group dblock-{env}-rg
az webapp restart --name dblock-frontend-{env} --resource-group dblock-{env}-rg
az webapp restart --name dblock-admin-{env} --resource-group dblock-{env}-rg
```

### Stop a service
```bash
az webapp stop --name dblock-api-{env} --resource-group dblock-{env}-rg
```

### Start a service
```bash
az webapp start --name dblock-api-{env} --resource-group dblock-{env}-rg
```

### Scale App Service (number of instances)
```bash
az appservice plan update --name dblock-{env}-plan --resource-group dblock-{env}-rg --number-of-workers 3
```

### Scale App Service (instance size)
```bash
az appservice plan update --name dblock-{env}-plan --resource-group dblock-{env}-rg --sku P1v3
```

### View current scale settings
```bash
az appservice plan show --name dblock-{env}-plan --resource-group dblock-{env}-rg --query "{SKU:sku.name, Workers:sku.capacity, Tier:sku.tier}" -o table
```

### Swap deployment slots
```bash
az webapp deployment slot swap --name dblock-api-{env} --resource-group dblock-{env}-rg --slot staging --target-slot production
```

---

## 4. Database Operations

### Check database status
```bash
az postgres flexible-server show --name dblock-db-{env} --resource-group dblock-{env}-rg --query "{State:state, Version:version, SKU:sku.name, Storage:storage.storageSizeGb}" -o table
```

### Check database connectivity
```bash
psql "host=dblock-db-{env}.postgres.database.azure.com port=5432 dbname=dblock user=dbadmin sslmode=require" -c "SELECT version();"
```

### View active connections
```bash
psql "host=dblock-db-{env}.postgres.database.azure.com port=5432 dbname=dblock user=dbadmin sslmode=require" -c "SELECT pid, usename, application_name, client_addr, state, query_start, query FROM pg_stat_activity WHERE datname = 'dblock' ORDER BY query_start DESC;"
```

### View connection count
```bash
psql "host=dblock-db-{env}.postgres.database.azure.com port=5432 dbname=dblock user=dbadmin sslmode=require" -c "SELECT count(*), state FROM pg_stat_activity WHERE datname = 'dblock' GROUP BY state;"
```

### Kill a stuck query
```bash
psql "host=dblock-db-{env}.postgres.database.azure.com port=5432 dbname=dblock user=dbadmin sslmode=require" -c "SELECT pg_terminate_backend(<PID>);"
```

### View database size
```bash
psql "host=dblock-db-{env}.postgres.database.azure.com port=5432 dbname=dblock user=dbadmin sslmode=require" -c "SELECT pg_size_pretty(pg_database_size('dblock'));"
```

### View table sizes
```bash
psql "host=dblock-db-{env}.postgres.database.azure.com port=5432 dbname=dblock user=dbadmin sslmode=require" -c "SELECT schemaname, relname, pg_size_pretty(pg_total_relation_size(relid)) AS size, n_live_tup AS rows FROM pg_stat_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 20;"
```

### Run pending TypeORM migrations
```bash
DATABASE_URL="postgresql://dbadmin:PASSWORD@dblock-db-{env}.postgres.database.azure.com:5432/dblock?sslmode=require" npx typeorm migration:run -d ./dist/data-source.js
```

### Show pending migrations
```bash
DATABASE_URL="postgresql://dbadmin:PASSWORD@dblock-db-{env}.postgres.database.azure.com:5432/dblock?sslmode=require" npx typeorm migration:show -d ./dist/data-source.js
```

### View slow queries
```bash
psql "host=dblock-db-{env}.postgres.database.azure.com port=5432 dbname=dblock user=dbadmin sslmode=require" -c "SELECT query, calls, mean_exec_time, total_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

---

## 5. Redis Operations

### Check Redis status
```bash
az redis show --name dblock-redis-{env} --resource-group dblock-{env}-rg --query "{State:provisioningState, Host:hostName, Port:sslPort, SKU:sku.name}" -o table
```

### View Redis metrics (memory usage)
```bash
az monitor metrics list --resource /subscriptions/{sub-id}/resourceGroups/dblock-{env}-rg/providers/Microsoft.Cache/Redis/dblock-redis-{env} --metric "usedmemory" --interval PT5M --start-time $(date -u -d '-1 hour' +%Y-%m-%dT%H:%M:%SZ) -o table
```

### View Redis metrics (connected clients)
```bash
az monitor metrics list --resource /subscriptions/{sub-id}/resourceGroups/dblock-{env}-rg/providers/Microsoft.Cache/Redis/dblock-redis-{env} --metric "connectedclients" --interval PT5M --start-time $(date -u -d '-1 hour' +%Y-%m-%dT%H:%M:%SZ) -o table
```

### View Redis metrics (cache hit ratio)
```bash
az monitor metrics list --resource /subscriptions/{sub-id}/resourceGroups/dblock-{env}-rg/providers/Microsoft.Cache/Redis/dblock-redis-{env} --metric "cachehits,cachemisses" --interval PT5M --start-time $(date -u -d '-1 hour' +%Y-%m-%dT%H:%M:%SZ) -o table
```

### Connect to Redis via CLI
```bash
REDIS_KEY=$(az redis list-keys --name dblock-redis-{env} --resource-group dblock-{env}-rg --query primaryKey -o tsv)
redis-cli -h dblock-redis-{env}.redis.cache.windows.net -p 6380 --tls -a "$REDIS_KEY"
```

### Clear entire Redis cache
```bash
REDIS_KEY=$(az redis list-keys --name dblock-redis-{env} --resource-group dblock-{env}-rg --query primaryKey -o tsv)
redis-cli -h dblock-redis-{env}.redis.cache.windows.net -p 6380 --tls -a "$REDIS_KEY" FLUSHALL
```

### View Redis key count
```bash
REDIS_KEY=$(az redis list-keys --name dblock-redis-{env} --resource-group dblock-{env}-rg --query primaryKey -o tsv)
redis-cli -h dblock-redis-{env}.redis.cache.windows.net -p 6380 --tls -a "$REDIS_KEY" DBSIZE
```

### Force reboot Redis
```bash
az redis force-reboot --name dblock-redis-{env} --resource-group dblock-{env}-rg --reboot-type PrimaryNode
```

---

## 6. Backup and Restore

### Trigger manual full backup
```bash
./scripts/backup.sh --env {env} --type full
```

### Trigger incremental backup
```bash
./scripts/backup.sh --env {env} --type incremental
```

### Trigger config-only backup
```bash
./scripts/backup.sh --env {env} --type config
```

### List available backups
```bash
./scripts/restore.sh --env {env} --list
```

### Restore from latest backup
```bash
./scripts/restore.sh --env {env} --source latest
```

### Restore from specific timestamp
```bash
./scripts/restore.sh --env {env} --source "2026-02-20T10:00:00Z"
```

### Restore to a different database (safe testing)
```bash
./scripts/restore.sh --env {env} --source latest --target-db dblock_restore_test
```

### Azure PITR (Point-in-Time Recovery)
```bash
az postgres flexible-server restore --name dblock-db-{env}-restored --resource-group dblock-{env}-rg --source-server dblock-db-{env} --restore-time "2026-02-20T10:00:00Z"
```

---

## 7. Deployment and Rollback

### Deploy a specific version (Docker image tag)
```bash
az webapp config container set --name dblock-api-{env} --resource-group dblock-{env}-rg --container-image-name dblockacr.azurecr.io/dblock-api:{tag}
az webapp restart --name dblock-api-{env} --resource-group dblock-{env}-rg
```

### View current deployed image
```bash
az webapp config container show --name dblock-api-{env} --resource-group dblock-{env}-rg --query "[?name=='DOCKER_CUSTOM_IMAGE_NAME'].value" -o tsv
```

### List available image tags in ACR
```bash
az acr repository show-tags --name dblockacr --repository dblock-api --orderby time_desc --top 20 -o table
```

### Rollback to previous version (slot swap)
```bash
az webapp deployment slot swap --name dblock-api-{env} --resource-group dblock-{env}-rg --slot staging --target-slot production
```

### Rollback to a specific image tag
```bash
az webapp config container set --name dblock-api-{env} --resource-group dblock-{env}-rg --container-image-name dblockacr.azurecr.io/dblock-api:{previous-tag}
az webapp restart --name dblock-api-{env} --resource-group dblock-{env}-rg
```

### View deployment history
```bash
az webapp deployment list-publishing-profiles --name dblock-api-{env} --resource-group dblock-{env}-rg -o table
```

### View deployment slot status
```bash
az webapp deployment slot list --name dblock-api-{env} --resource-group dblock-{env}-rg --query "[].{Slot:name, State:state}" -o table
```

---

## 8. SSL and Security

### Check SSL certificate expiry
```bash
echo | openssl s_client -servername dblock-api-{env}.azurewebsites.net -connect dblock-api-{env}.azurewebsites.net:443 2>/dev/null | openssl x509 -noout -dates
```

### Check custom domain SSL certificate expiry
```bash
echo | openssl s_client -servername api.dblock.ge -connect api.dblock.ge:443 2>/dev/null | openssl x509 -noout -dates -subject
```

### View Key Vault secrets list (names only)
```bash
az keyvault secret list --vault-name dblock-{env}-kv --query "[].{Name:name, Enabled:attributes.enabled, Expires:attributes.expires}" -o table
```

### Rotate a Key Vault secret
```bash
az keyvault secret set --vault-name dblock-{env}-kv --name "SECRET-NAME" --value "new-value"
```

### Check App Service IP restrictions
```bash
az webapp config access-restriction show --name dblock-api-{env} --resource-group dblock-{env}-rg -o table
```

### View Azure Security Center recommendations
```bash
az security assessment list --query "[?resourceDetails.id contains 'dblock']" -o table
```

---

## 9. Application Insights KQL Queries

> Run these in Azure Portal > Application Insights > Logs, or via `az monitor app-insights query`.

### Recent application errors (last 1 hour)
```kql
exceptions
| where timestamp > ago(1h)
| order by timestamp desc
| project timestamp, problemId, outerMessage, innermostMessage
| take 50
```

### Failed requests by endpoint (last 24h)
```kql
requests
| where timestamp > ago(24h) and success == false
| summarize FailedCount=count() by name, resultCode
| order by FailedCount desc
| take 20
```

### Slow API requests (> 2 seconds, last 1 hour)
```kql
requests
| where timestamp > ago(1h) and duration > 2000
| project timestamp, name, duration, resultCode, url
| order by duration desc
| take 50
```

### Request throughput over time (last 6 hours)
```kql
requests
| where timestamp > ago(6h)
| summarize RequestCount=count() by bin(timestamp, 5m)
| order by timestamp asc
| render timechart
```

### Dependency failures (database, Redis, external APIs)
```kql
dependencies
| where timestamp > ago(1h) and success == false
| summarize FailureCount=count() by type, target, name, resultCode
| order by FailureCount desc
| take 20
```

### User activity (unique users last 24h)
```kql
requests
| where timestamp > ago(24h)
| summarize UniqueUsers=dcount(user_Id), RequestCount=count() by bin(timestamp, 1h)
| order by timestamp asc
| render timechart
```

### Payment transaction failures
```kql
customEvents
| where timestamp > ago(24h) and name contains "payment"
| where customDimensions.status == "failed"
| project timestamp, name, customDimensions.gateway, customDimensions.error, customDimensions.amount
| order by timestamp desc
| take 50
```

### SaltoKS integration errors
```kql
dependencies
| where timestamp > ago(24h) and target contains "salto"
| where success == false
| project timestamp, name, target, resultCode, duration
| order by timestamp desc
| take 50
```

### Database query performance
```kql
dependencies
| where timestamp > ago(1h) and type == "SQL"
| summarize AvgDuration=avg(duration), MaxDuration=max(duration), Count=count() by name
| order by AvgDuration desc
| take 20
```

### Redis cache performance
```kql
dependencies
| where timestamp > ago(1h) and type == "Redis"
| summarize AvgDuration=avg(duration), Count=count(), Failures=countif(success == false) by name
| order by AvgDuration desc
```

### Server CPU and memory anomalies
```kql
performanceCounters
| where timestamp > ago(6h)
| where category == "Process" and (name == "% Processor Time" or name == "Private Bytes")
| summarize AvgValue=avg(value), MaxValue=max(value) by name, bin(timestamp, 10m)
| order by timestamp asc
| render timechart
```

### Booking funnel analysis
```kql
customEvents
| where timestamp > ago(7d)
| where name in ("booking_started", "booking_payment_initiated", "booking_confirmed", "booking_cancelled")
| summarize Count=count() by name, bin(timestamp, 1d)
| order by timestamp asc
| render barchart
```

### Error rate trend (last 7 days)
```kql
requests
| where timestamp > ago(7d)
| summarize
    Total=count(),
    Failed=countif(success == false),
    ErrorRate=round(100.0 * countif(success == false) / count(), 2)
    by bin(timestamp, 1h)
| order by timestamp asc
| render timechart
```

### P95 response time by endpoint
```kql
requests
| where timestamp > ago(1h)
| summarize P95=percentile(duration, 95), P50=percentile(duration, 50), Count=count() by name
| where Count > 10
| order by P95 desc
| take 20
```

---

## 10. Emergency Contacts

| Role                     | Name            | Phone           | Email                    |
|--------------------------|-----------------|-----------------|--------------------------|
| On-Call Engineer         | [TBD]           | [TBD]           | [TBD]                    |
| Tech Lead                | [TBD]           | [TBD]           | [TBD]                    |
| CTO                      | [TBD]           | [TBD]           | [TBD]                    |
| DevOps Lead              | [TBD]           | [TBD]           | [TBD]                    |
| Product Manager          | [TBD]           | [TBD]           | [TBD]                    |

### External Contacts

| Service                  | Contact          | Support Level    | Response SLA             |
|--------------------------|------------------|------------------|--------------------------|
| Azure Support            | [Portal]         | [Plan tier]      | [Per plan]               |
| BOG (Payment Gateway)    | [TBD]            | Technical        | [TBD]                    |
| TBC (Payment Gateway)    | [TBD]            | Technical        | [TBD]                    |
| SaltoKS (Access Control) | [TBD]            | Technical        | [TBD]                    |
| Domain Registrar         | [TBD]            | Standard         | [TBD]                    |

### Incident Communication Channels

| Channel                  | Purpose                                          |
|--------------------------|--------------------------------------------------|
| Slack #dblock-incidents  | Real-time incident coordination                  |
| Slack #dblock-status     | Status updates for broader team                  |
| Email: it-ops@...        | Formal incident notifications                    |
| Phone tree               | P0 escalations when Slack is unavailable         |

---

## Quick Reference Card

| Task                          | Command                                                        |
|-------------------------------|----------------------------------------------------------------|
| Check system health           | `curl -s https://dblock-api-{env}.azurewebsites.net/api/health` |
| View recent logs              | `az webapp log tail --name dblock-api-{env} -g dblock-{env}-rg` |
| Restart backend               | `az webapp restart --name dblock-api-{env} -g dblock-{env}-rg`  |
| Scale app service             | `az appservice plan update --name dblock-{env}-plan -g dblock-{env}-rg --number-of-workers N` |
| Check DB status               | `az postgres flexible-server show --name dblock-db-{env} -g dblock-{env}-rg` |
| View Redis metrics            | `az monitor metrics list --resource .../dblock-redis-{env} --metric usedmemory` |
| Trigger backup                | `./scripts/backup.sh --env {env} --type full`                   |
| Deploy version                | `az webapp config container set --name dblock-api-{env} -g dblock-{env}-rg --container-image-name dblockacr.azurecr.io/dblock-api:{tag}` |
| Rollback                      | `az webapp deployment slot swap --name dblock-api-{env} -g dblock-{env}-rg --slot staging --target-slot production` |
| Check SSL expiry              | `echo \| openssl s_client -servername api.dblock.ge -connect api.dblock.ge:443 2>/dev/null \| openssl x509 -noout -dates` |
| View active connections       | `psql ... -c "SELECT * FROM pg_stat_activity WHERE datname='dblock';"` |
| Clear Redis cache             | `redis-cli -h ... --tls -a $KEY FLUSHALL`                       |
| Run migrations                | `DATABASE_URL=... npx typeorm migration:run -d ./dist/data-source.js` |
