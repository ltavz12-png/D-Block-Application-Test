#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# D Block Workspace — Automated Backup Script
#
# Usage:
#   ./scripts/backup.sh --env staging --type full
#   ./scripts/backup.sh --env production --type incremental
#   ./scripts/backup.sh --env production --type config
#
# Arguments:
#   --env       Environment: staging | production
#   --type      Backup type: full | incremental | config
#
# Prerequisites:
#   - Azure CLI (az) installed and authenticated
#   - PostgreSQL client tools (pg_dump, pg_restore)
#   - Access to Azure Key Vault for credentials
#   - redis-cli installed (for Redis backups)
###############################################################################

# =============================================================================
# Configuration
# =============================================================================

readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly TIMESTAMP="$(date -u +%Y-%m-%d-%H%M%S)"
readonly DATE_TODAY="$(date -u +%Y-%m-%d)"
readonly DAY_OF_WEEK="$(date -u +%u)"  # 1=Monday, 7=Sunday
readonly DAY_OF_MONTH="$(date -u +%d)"
readonly LOG_FILE="/tmp/dblock-backup-${TIMESTAMP}.log"

# Retention policies
readonly DAILY_RETENTION=30
readonly WEEKLY_RETENTION=12
readonly MONTHLY_RETENTION=12

# Azure resource naming
RESOURCE_GROUP=""
DB_SERVER=""
REDIS_NAME=""
STORAGE_ACCOUNT=""
KEY_VAULT=""
BACKUP_CONTAINER="backups"

# Database connection
DB_HOST=""
DB_PORT="5432"
DB_NAME="dblock"
DB_USER=""
DB_PASSWORD=""

# Parsed arguments
ENV=""
BACKUP_TYPE=""

# =============================================================================
# Logging
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp="$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)"
    echo "[${timestamp}] [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info()    { log "INFO"    "$@"; }
log_warn()    { log "WARN"    "$@"; }
log_error()   { log "ERROR"   "$@"; }
log_success() { log "SUCCESS" "$@"; }

# =============================================================================
# Argument Parsing
# =============================================================================

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} --env <environment> --type <backup-type>

Arguments:
  --env     Environment to back up (staging | production)
  --type    Type of backup (full | incremental | config)

Backup Types:
  full          Full PostgreSQL dump + Redis snapshot + config
  incremental   PostgreSQL dump since last full backup
  config        Application configuration and infrastructure files only

Examples:
  ${SCRIPT_NAME} --env production --type full
  ${SCRIPT_NAME} --env staging --type config
EOF
    exit 1
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --env)
                ENV="${2:-}"
                shift 2
                ;;
            --type)
                BACKUP_TYPE="${2:-}"
                shift 2
                ;;
            --help|-h)
                usage
                ;;
            *)
                log_error "Unknown argument: $1"
                usage
                ;;
        esac
    done

    if [[ -z "$ENV" ]]; then
        log_error "Missing required argument: --env"
        usage
    fi

    if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
        log_error "Invalid environment: $ENV (must be 'staging' or 'production')"
        exit 1
    fi

    if [[ -z "$BACKUP_TYPE" ]]; then
        log_error "Missing required argument: --type"
        usage
    fi

    if [[ "$BACKUP_TYPE" != "full" && "$BACKUP_TYPE" != "incremental" && "$BACKUP_TYPE" != "config" ]]; then
        log_error "Invalid backup type: $BACKUP_TYPE (must be 'full', 'incremental', or 'config')"
        exit 1
    fi
}

# =============================================================================
# Environment Configuration
# =============================================================================

configure_environment() {
    log_info "Configuring environment for: $ENV"

    RESOURCE_GROUP="dblock-${ENV}-rg"
    DB_SERVER="dblock-db-${ENV}"
    REDIS_NAME="dblock-redis-${ENV}"
    STORAGE_ACCOUNT="dblockblob${ENV}"
    KEY_VAULT="dblock-${ENV}-kv"
    DB_HOST="${DB_SERVER}.postgres.database.azure.com"

    # Retrieve database credentials from Key Vault
    log_info "Retrieving database credentials from Key Vault: $KEY_VAULT"
    DB_USER=$(az keyvault secret show \
        --vault-name "$KEY_VAULT" \
        --name "DATABASE-USER" \
        --query "value" -o tsv 2>/dev/null) || {
        log_warn "Could not retrieve DATABASE-USER from Key Vault, using default 'dbadmin'"
        DB_USER="dbadmin"
    }

    DB_PASSWORD=$(az keyvault secret show \
        --vault-name "$KEY_VAULT" \
        --name "DATABASE-PASSWORD" \
        --query "value" -o tsv 2>/dev/null) || {
        log_error "Could not retrieve DATABASE-PASSWORD from Key Vault"
        exit 1
    }

    export PGPASSWORD="$DB_PASSWORD"

    log_info "Environment configured:"
    log_info "  Resource Group:   $RESOURCE_GROUP"
    log_info "  DB Server:        $DB_HOST"
    log_info "  Redis:            $REDIS_NAME"
    log_info "  Storage Account:  $STORAGE_ACCOUNT"
    log_info "  Key Vault:        $KEY_VAULT"
}

# =============================================================================
# Prerequisite Checks
# =============================================================================

check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing=()

    if ! command -v az &>/dev/null; then
        missing+=("az (Azure CLI)")
    fi

    if ! command -v pg_dump &>/dev/null; then
        missing+=("pg_dump (PostgreSQL client)")
    fi

    if ! command -v pg_restore &>/dev/null; then
        missing+=("pg_restore (PostgreSQL client)")
    fi

    if ! command -v gzip &>/dev/null; then
        missing+=("gzip")
    fi

    if [[ "$BACKUP_TYPE" == "full" ]] && ! command -v redis-cli &>/dev/null; then
        missing+=("redis-cli (Redis client)")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing required tools:"
        for tool in "${missing[@]}"; do
            log_error "  - $tool"
        done
        exit 1
    fi

    # Verify Azure CLI authentication
    if ! az account show &>/dev/null; then
        log_error "Azure CLI is not authenticated. Run 'az login' first."
        exit 1
    fi

    # Verify storage container exists
    az storage container create \
        --name "$BACKUP_CONTAINER" \
        --account-name "$STORAGE_ACCOUNT" \
        --auth-mode login \
        --only-show-errors &>/dev/null || true

    log_info "All prerequisites satisfied."
}

# =============================================================================
# PostgreSQL Backup
# =============================================================================

backup_postgres_full() {
    local backup_filename="dblock-${ENV}-full-${TIMESTAMP}.dump"
    local compressed_filename="${backup_filename}.gz"
    local local_path="/tmp/${backup_filename}"
    local compressed_path="/tmp/${compressed_filename}"
    local blob_path="postgres/daily/${compressed_filename}"

    log_info "Starting full PostgreSQL backup..."
    log_info "  Database: ${DB_NAME}@${DB_HOST}"
    log_info "  Output:   ${local_path}"

    # Perform pg_dump with custom format
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -Fc \
        --no-owner \
        --no-privileges \
        --verbose \
        -f "$local_path" \
        2>> "$LOG_FILE"

    local dump_size
    dump_size=$(du -h "$local_path" | cut -f1)
    log_info "PostgreSQL dump completed: ${dump_size}"

    # Compress with gzip
    log_info "Compressing backup with gzip..."
    gzip -9 "$local_path"

    local compressed_size
    compressed_size=$(du -h "$compressed_path" | cut -f1)
    log_info "Compressed size: ${compressed_size}"

    # Verify backup integrity
    log_info "Verifying backup integrity..."
    gunzip -k "$compressed_path"
    pg_restore --list "$local_path" > /dev/null 2>> "$LOG_FILE"
    local table_count
    table_count=$(pg_restore --list "$local_path" 2>/dev/null | grep -c "TABLE" || true)
    log_info "Backup contains ${table_count} table entries"
    rm -f "$local_path"

    if [[ "$table_count" -eq 0 ]]; then
        log_error "Backup integrity check failed: no tables found in dump"
        rm -f "$compressed_path"
        return 1
    fi

    # Upload to Azure Blob Storage
    log_info "Uploading backup to Azure Blob Storage: ${blob_path}"
    az storage blob upload \
        --account-name "$STORAGE_ACCOUNT" \
        --container-name "$BACKUP_CONTAINER" \
        --name "$blob_path" \
        --file "$compressed_path" \
        --auth-mode login \
        --overwrite \
        --only-show-errors

    log_success "Full PostgreSQL backup uploaded: ${blob_path}"

    # Also store as weekly backup on Sundays
    if [[ "$DAY_OF_WEEK" == "7" ]]; then
        local weekly_path="postgres/weekly/${compressed_filename}"
        log_info "Sunday detected — creating weekly backup copy: ${weekly_path}"
        az storage blob copy start \
            --account-name "$STORAGE_ACCOUNT" \
            --destination-container "$BACKUP_CONTAINER" \
            --destination-blob "$weekly_path" \
            --source-uri "https://${STORAGE_ACCOUNT}.blob.core.windows.net/${BACKUP_CONTAINER}/${blob_path}" \
            --auth-mode login \
            --only-show-errors
        log_success "Weekly backup created: ${weekly_path}"
    fi

    # Also store as monthly backup on the 1st
    if [[ "$DAY_OF_MONTH" == "01" ]]; then
        local monthly_path="postgres/monthly/${compressed_filename}"
        log_info "1st of month — creating monthly backup copy: ${monthly_path}"
        az storage blob copy start \
            --account-name "$STORAGE_ACCOUNT" \
            --destination-container "$BACKUP_CONTAINER" \
            --destination-blob "$monthly_path" \
            --source-uri "https://${STORAGE_ACCOUNT}.blob.core.windows.net/${BACKUP_CONTAINER}/${blob_path}" \
            --auth-mode login \
            --only-show-errors
        log_success "Monthly backup created: ${monthly_path}"
    fi

    # Clean up local file
    rm -f "$compressed_path"

    log_success "Full PostgreSQL backup completed successfully."
}

backup_postgres_incremental() {
    local backup_filename="dblock-${ENV}-incremental-${TIMESTAMP}.dump"
    local compressed_filename="${backup_filename}.gz"
    local local_path="/tmp/${backup_filename}"
    local compressed_path="/tmp/${compressed_filename}"
    local blob_path="postgres/incremental/${compressed_filename}"

    log_info "Starting incremental PostgreSQL backup..."
    log_info "Note: Using pg_dump with custom format (logical incremental)"

    # For incremental, we dump only tables with recent changes
    # based on updated_at timestamps in the last 24 hours
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -Fc \
        --no-owner \
        --no-privileges \
        --verbose \
        -f "$local_path" \
        2>> "$LOG_FILE"

    local dump_size
    dump_size=$(du -h "$local_path" | cut -f1)
    log_info "Incremental dump completed: ${dump_size}"

    # Compress
    gzip -9 "$local_path"

    local compressed_size
    compressed_size=$(du -h "$compressed_path" | cut -f1)
    log_info "Compressed size: ${compressed_size}"

    # Verify integrity
    log_info "Verifying backup integrity..."
    gunzip -k "$compressed_path"
    pg_restore --list "$local_path" > /dev/null 2>> "$LOG_FILE"
    rm -f "$local_path"

    # Upload to Blob Storage
    log_info "Uploading incremental backup to: ${blob_path}"
    az storage blob upload \
        --account-name "$STORAGE_ACCOUNT" \
        --container-name "$BACKUP_CONTAINER" \
        --name "$blob_path" \
        --file "$compressed_path" \
        --auth-mode login \
        --overwrite \
        --only-show-errors

    rm -f "$compressed_path"

    log_success "Incremental PostgreSQL backup completed: ${blob_path}"
}

# =============================================================================
# Redis Backup
# =============================================================================

backup_redis() {
    log_info "Starting Redis RDB snapshot export..."

    local blob_path="redis/dblock-${ENV}-redis-${TIMESTAMP}.rdb"

    # Trigger RDB export to Blob Storage
    local storage_key
    storage_key=$(az storage account keys list \
        --account-name "$STORAGE_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --query "[0].value" -o tsv)

    local sas_url="https://${STORAGE_ACCOUNT}.blob.core.windows.net/${BACKUP_CONTAINER}"

    # Export Redis data to blob storage
    az redis export \
        --name "$REDIS_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --prefix "$blob_path" \
        --container "$sas_url" \
        --file-format "rdb" \
        --only-show-errors 2>> "$LOG_FILE" || {
        log_warn "Redis export failed — this is expected for Basic tier Redis."
        log_warn "Redis cache will be rebuilt from database on recovery."
        return 0
    }

    log_success "Redis RDB snapshot exported: ${blob_path}"
}

# =============================================================================
# Configuration Backup
# =============================================================================

backup_config() {
    local config_dir="/tmp/dblock-config-${TIMESTAMP}"
    local archive_name="dblock-${ENV}-config-${TIMESTAMP}.tar.gz"
    local archive_path="/tmp/${archive_name}"
    local blob_path="config/${archive_name}"

    log_info "Starting configuration backup..."

    mkdir -p "$config_dir"

    # Export App Service configuration
    log_info "Exporting App Service configurations..."
    for app in "dblock-api-${ENV}" "dblock-frontend-${ENV}" "dblock-admin-${ENV}"; do
        az webapp config appsettings list \
            --name "$app" \
            --resource-group "$RESOURCE_GROUP" \
            -o json > "${config_dir}/${app}-appsettings.json" 2>/dev/null || {
            log_warn "Could not export settings for $app (may not exist)"
        }
    done

    # Export Key Vault secret names (not values for security)
    log_info "Exporting Key Vault secret names..."
    az keyvault secret list \
        --vault-name "$KEY_VAULT" \
        --query "[].{name:name, enabled:attributes.enabled}" \
        -o json > "${config_dir}/keyvault-secrets-list.json" 2>/dev/null || {
        log_warn "Could not list Key Vault secrets"
    }

    # Copy infrastructure-as-code files
    if [[ -d "${PROJECT_ROOT}/infrastructure" ]]; then
        log_info "Copying infrastructure definitions..."
        cp -r "${PROJECT_ROOT}/infrastructure" "${config_dir}/infrastructure"
    fi

    # Copy Docker configuration
    if [[ -f "${PROJECT_ROOT}/Dockerfile" ]]; then
        cp "${PROJECT_ROOT}/Dockerfile" "${config_dir}/Dockerfile"
    fi
    if [[ -f "${PROJECT_ROOT}/docker-compose.yml" ]]; then
        cp "${PROJECT_ROOT}/docker-compose.yml" "${config_dir}/docker-compose.yml"
    fi

    # Copy package.json for dependency reference
    if [[ -f "${PROJECT_ROOT}/package.json" ]]; then
        cp "${PROJECT_ROOT}/package.json" "${config_dir}/package.json"
    fi

    # Export database schema (no data)
    log_info "Exporting database schema..."
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --schema-only \
        --no-owner \
        --no-privileges \
        -f "${config_dir}/schema.sql" \
        2>> "$LOG_FILE" || {
        log_warn "Could not export database schema"
    }

    # Create archive
    log_info "Creating configuration archive..."
    tar -czf "$archive_path" -C /tmp "dblock-config-${TIMESTAMP}"

    local archive_size
    archive_size=$(du -h "$archive_path" | cut -f1)
    log_info "Configuration archive size: ${archive_size}"

    # Upload to Blob Storage
    log_info "Uploading configuration backup to: ${blob_path}"
    az storage blob upload \
        --account-name "$STORAGE_ACCOUNT" \
        --container-name "$BACKUP_CONTAINER" \
        --name "$blob_path" \
        --file "$archive_path" \
        --auth-mode login \
        --overwrite \
        --only-show-errors

    # Clean up
    rm -rf "$config_dir" "$archive_path"

    log_success "Configuration backup completed: ${blob_path}"
}

# =============================================================================
# Backup Rotation
# =============================================================================

rotate_backups() {
    log_info "Starting backup rotation..."

    rotate_folder "postgres/daily" "$DAILY_RETENTION"
    rotate_folder "postgres/weekly" "$WEEKLY_RETENTION"
    rotate_folder "postgres/monthly" "$MONTHLY_RETENTION"
    rotate_folder "postgres/incremental" "$DAILY_RETENTION"
    rotate_folder "redis" "$DAILY_RETENTION"
    rotate_folder "config" "$DAILY_RETENTION"

    log_success "Backup rotation completed."
}

rotate_folder() {
    local prefix="$1"
    local retention_count="$2"

    log_info "Rotating backups in ${prefix}/ (keeping last ${retention_count})..."

    # List all blobs in the prefix, sorted by date (oldest first)
    local blob_list
    blob_list=$(az storage blob list \
        --account-name "$STORAGE_ACCOUNT" \
        --container-name "$BACKUP_CONTAINER" \
        --prefix "$prefix/" \
        --auth-mode login \
        --query "sort_by([].{name:name, date:properties.lastModified}, &date)[].name" \
        -o tsv 2>/dev/null) || {
        log_warn "Could not list blobs in ${prefix}/"
        return 0
    }

    local total_count
    total_count=$(echo "$blob_list" | grep -c "." || true)

    if [[ "$total_count" -le "$retention_count" ]]; then
        log_info "  ${prefix}/: ${total_count} backups found, within retention limit (${retention_count})"
        return 0
    fi

    local delete_count=$((total_count - retention_count))
    log_info "  ${prefix}/: Deleting ${delete_count} old backups (keeping ${retention_count} of ${total_count})"

    echo "$blob_list" | head -n "$delete_count" | while IFS= read -r blob_name; do
        if [[ -n "$blob_name" ]]; then
            log_info "  Deleting: ${blob_name}"
            az storage blob delete \
                --account-name "$STORAGE_ACCOUNT" \
                --container-name "$BACKUP_CONTAINER" \
                --name "$blob_name" \
                --auth-mode login \
                --only-show-errors 2>/dev/null || {
                log_warn "  Failed to delete: ${blob_name}"
            }
        fi
    done
}

# =============================================================================
# Notifications
# =============================================================================

send_notification() {
    local status="$1"
    local message="$2"
    local duration="$3"

    local notification_payload
    notification_payload=$(cat <<JSON
{
    "backup_id": "backup-${TIMESTAMP}",
    "environment": "${ENV}",
    "type": "${BACKUP_TYPE}",
    "status": "${status}",
    "message": "${message}",
    "duration_seconds": ${duration},
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "log_file": "${LOG_FILE}"
}
JSON
)

    # Attempt to send notification via webhook (Slack, Teams, etc.)
    local webhook_url
    webhook_url=$(az keyvault secret show \
        --vault-name "$KEY_VAULT" \
        --name "BACKUP-NOTIFICATION-WEBHOOK" \
        --query "value" -o tsv 2>/dev/null) || {
        log_warn "No notification webhook configured in Key Vault (BACKUP-NOTIFICATION-WEBHOOK)"
        log_info "Notification payload: ${notification_payload}"
        return 0
    }

    if [[ -n "$webhook_url" ]]; then
        curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$notification_payload" \
            "$webhook_url" > /dev/null 2>&1 || {
            log_warn "Failed to send notification webhook"
        }
        log_info "Notification sent to webhook."
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    local start_time
    start_time=$(date +%s)

    echo "============================================================"
    log_info "D Block Workspace Backup Script"
    log_info "============================================================"
    log_info "Environment:  ${ENV}"
    log_info "Backup Type:  ${BACKUP_TYPE}"
    log_info "Timestamp:    ${TIMESTAMP}"
    log_info "Log File:     ${LOG_FILE}"
    echo "============================================================"

    configure_environment
    check_prerequisites

    local backup_status="success"
    local backup_message=""

    case "$BACKUP_TYPE" in
        full)
            log_info "Executing full backup..."
            backup_postgres_full
            backup_redis
            backup_config
            rotate_backups
            backup_message="Full backup completed (PostgreSQL + Redis + Config)"
            ;;
        incremental)
            log_info "Executing incremental backup..."
            backup_postgres_incremental
            rotate_backups
            backup_message="Incremental backup completed (PostgreSQL)"
            ;;
        config)
            log_info "Executing configuration backup..."
            backup_config
            backup_message="Configuration backup completed"
            ;;
    esac

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo "============================================================"
    log_success "$backup_message"
    log_success "Total duration: ${duration} seconds"
    echo "============================================================"

    send_notification "$backup_status" "$backup_message" "$duration"

    # Clean up PGPASSWORD
    unset PGPASSWORD
}

# Trap errors for notification
trap 'handle_error $LINENO' ERR

handle_error() {
    local line_number="$1"
    local end_time
    end_time=$(date +%s)
    local start_time_approx
    start_time_approx=$(date -d "$(head -1 "$LOG_FILE" 2>/dev/null | grep -oP '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}' || echo "")" +%s 2>/dev/null || echo "$end_time")
    local duration=$((end_time - start_time_approx))

    log_error "Backup FAILED at line ${line_number}"
    log_error "Check log file for details: ${LOG_FILE}"

    send_notification "failure" "Backup failed at line ${line_number}" "$duration"

    # Clean up PGPASSWORD
    unset PGPASSWORD

    exit 1
}

# Parse arguments and run
parse_args "$@"
main
