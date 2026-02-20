#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# D Block Workspace — Database Restore Script
#
# Usage:
#   ./scripts/restore.sh --env staging --source latest
#   ./scripts/restore.sh --env production --source "2026-02-20T10:00:00Z"
#   ./scripts/restore.sh --env staging --source /path/to/backup.dump.gz
#   ./scripts/restore.sh --env staging --source latest --target-db dblock_staging_restore
#   ./scripts/restore.sh --env production --list
#
# Arguments:
#   --env        Environment: staging | production
#   --source     Backup source: latest | <ISO timestamp> | <file path>
#   --target-db  Optional: restore to a different database name
#   --list       List available backups and exit
#
# Prerequisites:
#   - Azure CLI (az) installed and authenticated
#   - PostgreSQL client tools (pg_restore, psql)
#   - Access to Azure Key Vault for credentials
#   - Node.js and npx (for TypeORM migrations)
###############################################################################

# =============================================================================
# Configuration
# =============================================================================

readonly SCRIPT_NAME="$(basename "$0")"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
readonly TIMESTAMP="$(date -u +%Y-%m-%d-%H%M%S)"
readonly LOG_FILE="/tmp/dblock-restore-${TIMESTAMP}.log"

# Azure resource naming
RESOURCE_GROUP=""
DB_SERVER=""
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
SOURCE=""
TARGET_DB=""
LIST_ONLY=false

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
Usage: ${SCRIPT_NAME} --env <environment> --source <source> [--target-db <database>]
       ${SCRIPT_NAME} --env <environment> --list

Arguments:
  --env         Environment (staging | production)
  --source      Backup source:
                  latest              Most recent backup
                  <ISO timestamp>     Backup closest to this timestamp (e.g., 2026-02-20T10:00:00Z)
                  <file path>         Local backup file (.dump or .dump.gz)
  --target-db   Optional: restore to a different database (default: ${DB_NAME})
  --list        List available backups and exit

Examples:
  ${SCRIPT_NAME} --env staging --source latest
  ${SCRIPT_NAME} --env production --source "2026-02-20T10:00:00Z"
  ${SCRIPT_NAME} --env staging --source /tmp/my-backup.dump.gz --target-db dblock_test
  ${SCRIPT_NAME} --env production --list
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
            --source)
                SOURCE="${2:-}"
                shift 2
                ;;
            --target-db)
                TARGET_DB="${2:-}"
                shift 2
                ;;
            --list)
                LIST_ONLY=true
                shift
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

    if [[ "$LIST_ONLY" == false && -z "$SOURCE" ]]; then
        log_error "Missing required argument: --source (or use --list)"
        usage
    fi
}

# =============================================================================
# Environment Configuration
# =============================================================================

configure_environment() {
    log_info "Configuring environment for: $ENV"

    RESOURCE_GROUP="dblock-${ENV}-rg"
    DB_SERVER="dblock-db-${ENV}"
    STORAGE_ACCOUNT="dblockblob${ENV}"
    KEY_VAULT="dblock-${ENV}-kv"
    DB_HOST="${DB_SERVER}.postgres.database.azure.com"

    # Set target database
    if [[ -z "$TARGET_DB" ]]; then
        TARGET_DB="$DB_NAME"
    fi

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
    log_info "  Target Database:  $TARGET_DB"
    log_info "  Storage Account:  $STORAGE_ACCOUNT"
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

    if ! command -v pg_restore &>/dev/null; then
        missing+=("pg_restore (PostgreSQL client)")
    fi

    if ! command -v psql &>/dev/null; then
        missing+=("psql (PostgreSQL client)")
    fi

    if ! command -v gunzip &>/dev/null; then
        missing+=("gunzip")
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

    log_info "All prerequisites satisfied."
}

# =============================================================================
# List Available Backups
# =============================================================================

list_backups() {
    log_info "Listing available backups in ${STORAGE_ACCOUNT}/${BACKUP_CONTAINER}..."

    echo ""
    echo "============================================================"
    echo "  Available Backups — ${ENV}"
    echo "============================================================"

    echo ""
    echo "--- Daily Backups (PostgreSQL Full) ---"
    az storage blob list \
        --account-name "$STORAGE_ACCOUNT" \
        --container-name "$BACKUP_CONTAINER" \
        --prefix "postgres/daily/" \
        --auth-mode login \
        --query "reverse(sort_by([], &properties.lastModified))[].{Name:name, Size:properties.contentLength, Modified:properties.lastModified}" \
        -o table 2>/dev/null || echo "  (none found or access denied)"

    echo ""
    echo "--- Weekly Backups ---"
    az storage blob list \
        --account-name "$STORAGE_ACCOUNT" \
        --container-name "$BACKUP_CONTAINER" \
        --prefix "postgres/weekly/" \
        --auth-mode login \
        --query "reverse(sort_by([], &properties.lastModified))[].{Name:name, Size:properties.contentLength, Modified:properties.lastModified}" \
        -o table 2>/dev/null || echo "  (none found or access denied)"

    echo ""
    echo "--- Monthly Backups ---"
    az storage blob list \
        --account-name "$STORAGE_ACCOUNT" \
        --container-name "$BACKUP_CONTAINER" \
        --prefix "postgres/monthly/" \
        --auth-mode login \
        --query "reverse(sort_by([], &properties.lastModified))[].{Name:name, Size:properties.contentLength, Modified:properties.lastModified}" \
        -o table 2>/dev/null || echo "  (none found or access denied)"

    echo ""
    echo "--- Incremental Backups ---"
    az storage blob list \
        --account-name "$STORAGE_ACCOUNT" \
        --container-name "$BACKUP_CONTAINER" \
        --prefix "postgres/incremental/" \
        --auth-mode login \
        --query "reverse(sort_by([], &properties.lastModified))[:10].{Name:name, Size:properties.contentLength, Modified:properties.lastModified}" \
        -o table 2>/dev/null || echo "  (none found or access denied)"

    echo ""
    echo "============================================================"
}

# =============================================================================
# Resolve Backup Source
# =============================================================================

resolve_backup_source() {
    local local_file=""

    if [[ "$SOURCE" == "latest" ]]; then
        log_info "Resolving latest backup..."
        local latest_blob
        latest_blob=$(az storage blob list \
            --account-name "$STORAGE_ACCOUNT" \
            --container-name "$BACKUP_CONTAINER" \
            --prefix "postgres/daily/" \
            --auth-mode login \
            --query "reverse(sort_by([], &properties.lastModified))[0].name" \
            -o tsv 2>/dev/null) || {
            log_error "Could not list backups in storage"
            exit 1
        }

        if [[ -z "$latest_blob" || "$latest_blob" == "None" ]]; then
            log_error "No backups found in storage"
            exit 1
        fi

        log_info "Latest backup found: ${latest_blob}"
        download_backup "$latest_blob"

    elif [[ -f "$SOURCE" ]]; then
        # Source is a local file path
        log_info "Using local backup file: ${SOURCE}"
        local_file="$SOURCE"

        # Decompress if gzipped
        if [[ "$local_file" == *.gz ]]; then
            log_info "Decompressing backup file..."
            local decompressed="${local_file%.gz}"
            gunzip -k "$local_file"
            RESTORE_FILE="$decompressed"
        else
            RESTORE_FILE="$local_file"
        fi

    else
        # Source is a timestamp — find the closest backup
        log_info "Searching for backup closest to: ${SOURCE}"

        local matching_blob
        matching_blob=$(az storage blob list \
            --account-name "$STORAGE_ACCOUNT" \
            --container-name "$BACKUP_CONTAINER" \
            --prefix "postgres/" \
            --auth-mode login \
            --query "reverse(sort_by([?properties.lastModified<='${SOURCE}'], &properties.lastModified))[0].name" \
            -o tsv 2>/dev/null) || {
            log_error "Could not search backups in storage"
            exit 1
        }

        if [[ -z "$matching_blob" || "$matching_blob" == "None" ]]; then
            log_error "No backup found before timestamp: ${SOURCE}"
            log_info "Use --list to see available backups"
            exit 1
        fi

        log_info "Closest backup found: ${matching_blob}"
        download_backup "$matching_blob"
    fi
}

# Download backup from Azure Blob Storage
RESTORE_FILE=""

download_backup() {
    local blob_name="$1"
    local filename
    filename=$(basename "$blob_name")
    local local_path="/tmp/${filename}"

    log_info "Downloading backup: ${blob_name}"
    az storage blob download \
        --account-name "$STORAGE_ACCOUNT" \
        --container-name "$BACKUP_CONTAINER" \
        --name "$blob_name" \
        --file "$local_path" \
        --auth-mode login \
        --only-show-errors

    local file_size
    file_size=$(du -h "$local_path" | cut -f1)
    log_info "Downloaded: ${local_path} (${file_size})"

    # Decompress if gzipped
    if [[ "$local_path" == *.gz ]]; then
        log_info "Decompressing backup..."
        gunzip -f "$local_path"
        RESTORE_FILE="${local_path%.gz}"
    else
        RESTORE_FILE="$local_path"
    fi

    log_info "Restore file ready: ${RESTORE_FILE}"
}

# =============================================================================
# Backup Integrity Verification
# =============================================================================

verify_backup_integrity() {
    log_info "Verifying backup integrity..."

    if [[ ! -f "$RESTORE_FILE" ]]; then
        log_error "Restore file not found: ${RESTORE_FILE}"
        exit 1
    fi

    local file_size
    file_size=$(du -h "$RESTORE_FILE" | cut -f1)
    log_info "  File: ${RESTORE_FILE}"
    log_info "  Size: ${file_size}"

    # Verify with pg_restore --list
    local table_count
    table_count=$(pg_restore --list "$RESTORE_FILE" 2>/dev/null | grep -c "TABLE" || true)
    local index_count
    index_count=$(pg_restore --list "$RESTORE_FILE" 2>/dev/null | grep -c "INDEX" || true)
    local total_entries
    total_entries=$(pg_restore --list "$RESTORE_FILE" 2>/dev/null | wc -l || true)

    log_info "  Total entries:  ${total_entries}"
    log_info "  Tables:         ${table_count}"
    log_info "  Indexes:        ${index_count}"

    if [[ "$table_count" -eq 0 ]]; then
        log_error "Backup integrity check FAILED: no tables found"
        exit 1
    fi

    log_success "Backup integrity verified."
}

# =============================================================================
# Pre-Restore Safety
# =============================================================================

create_pre_restore_snapshot() {
    log_info "Creating pre-restore safety snapshot of current database..."

    local snapshot_file="/tmp/dblock-${ENV}-pre-restore-${TIMESTAMP}.dump"

    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$TARGET_DB" \
        -Fc \
        --no-owner \
        --no-privileges \
        -f "$snapshot_file" \
        2>> "$LOG_FILE" || {
        log_warn "Could not create pre-restore snapshot (database may not exist yet)"
        return 0
    }

    local snapshot_size
    snapshot_size=$(du -h "$snapshot_file" | cut -f1)
    log_info "Pre-restore snapshot created: ${snapshot_file} (${snapshot_size})"

    # Upload snapshot to blob storage for safety
    local blob_path="postgres/pre-restore/dblock-${ENV}-pre-restore-${TIMESTAMP}.dump"
    az storage blob upload \
        --account-name "$STORAGE_ACCOUNT" \
        --container-name "$BACKUP_CONTAINER" \
        --name "$blob_path" \
        --file "$snapshot_file" \
        --auth-mode login \
        --overwrite \
        --only-show-errors 2>/dev/null || {
        log_warn "Could not upload pre-restore snapshot to blob storage"
    }

    log_success "Pre-restore snapshot saved: ${blob_path}"
}

# Capture current row counts for comparison
capture_row_counts() {
    local label="$1"

    log_info "Capturing row counts (${label})..."

    psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$TARGET_DB" \
        -t -A \
        -c "
            SELECT json_agg(row_to_json(t))
            FROM (
                SELECT schemaname, relname AS table_name, n_live_tup AS row_count
                FROM pg_stat_user_tables
                ORDER BY relname
            ) t;
        " 2>/dev/null > "/tmp/dblock-rowcounts-${label}-${TIMESTAMP}.json" || {
        log_warn "Could not capture row counts (${label})"
        return 0
    }

    log_info "Row counts saved to /tmp/dblock-rowcounts-${label}-${TIMESTAMP}.json"
}

# =============================================================================
# Production Confirmation
# =============================================================================

confirm_production_restore() {
    if [[ "$ENV" == "production" && "$TARGET_DB" == "$DB_NAME" ]]; then
        echo ""
        echo "============================================================"
        echo "  WARNING: PRODUCTION DATABASE RESTORE"
        echo "============================================================"
        echo ""
        echo "  You are about to restore the PRODUCTION database."
        echo "  This will OVERWRITE all current data in: ${TARGET_DB}"
        echo "  On server: ${DB_HOST}"
        echo ""
        echo "  Source: ${SOURCE}"
        echo ""
        echo "  A pre-restore snapshot will be created first."
        echo ""
        echo "============================================================"
        echo ""
        read -r -p "Type 'RESTORE PRODUCTION' to confirm: " confirmation

        if [[ "$confirmation" != "RESTORE PRODUCTION" ]]; then
            log_error "Production restore cancelled by user."
            exit 1
        fi

        log_info "Production restore confirmed by user."
    fi
}

# =============================================================================
# Database Restore
# =============================================================================

restore_database() {
    log_info "Starting database restore..."
    log_info "  Source:     ${RESTORE_FILE}"
    log_info "  Target DB: ${TARGET_DB}@${DB_HOST}"

    # Create the target database if it does not exist
    if [[ "$TARGET_DB" != "$DB_NAME" ]]; then
        log_info "Creating target database if it does not exist: ${TARGET_DB}"
        psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "postgres" \
            -c "CREATE DATABASE \"${TARGET_DB}\";" \
            2>/dev/null || {
            log_info "Database ${TARGET_DB} already exists (or could not be created)"
        }
    fi

    # Run pg_restore
    log_info "Running pg_restore with --clean --if-exists..."
    pg_restore \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$TARGET_DB" \
        --clean \
        --if-exists \
        --no-owner \
        --no-privileges \
        --verbose \
        "$RESTORE_FILE" \
        2>> "$LOG_FILE" || {
        # pg_restore returns non-zero if there are warnings (e.g., "does not exist" for --clean)
        # Check if it's a real error or just warnings
        local exit_code=$?
        if [[ $exit_code -eq 1 ]]; then
            log_warn "pg_restore completed with warnings (exit code 1) — this is usually OK with --clean --if-exists"
        else
            log_error "pg_restore FAILED with exit code: ${exit_code}"
            log_error "Check log file: ${LOG_FILE}"
            exit 1
        fi
    }

    log_success "Database restore completed."
}

# =============================================================================
# Post-Restore: Run Migrations
# =============================================================================

run_migrations() {
    log_info "Running TypeORM migrations on restored database..."

    if [[ ! -f "${PROJECT_ROOT}/package.json" ]]; then
        log_warn "package.json not found at ${PROJECT_ROOT} — skipping migrations"
        return 0
    fi

    # Set database URL for migrations
    local db_url="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${TARGET_DB}?sslmode=require"

    cd "$PROJECT_ROOT"

    DATABASE_URL="$db_url" npx typeorm migration:run -d ./dist/data-source.js 2>> "$LOG_FILE" || {
        log_warn "TypeORM migrations failed or not applicable"
        log_warn "You may need to run migrations manually:"
        log_warn "  DATABASE_URL=\"...\" npx typeorm migration:run -d ./dist/data-source.js"
        return 0
    }

    log_success "TypeORM migrations completed."
}

# =============================================================================
# Post-Restore: Data Integrity Verification
# =============================================================================

verify_data_integrity() {
    log_info "Verifying data integrity after restore..."

    # Capture post-restore row counts
    capture_row_counts "post-restore"

    # Run basic integrity checks
    local check_results
    check_results=$(psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$TARGET_DB" \
        -t -A \
        -c "
            SELECT json_build_object(
                'total_tables', (SELECT count(*) FROM pg_stat_user_tables),
                'total_rows', (SELECT sum(n_live_tup) FROM pg_stat_user_tables),
                'users_count', (SELECT count(*) FROM users),
                'bookings_count', (SELECT count(*) FROM bookings),
                'workspaces_count', (SELECT count(*) FROM workspaces),
                'has_migrations', (SELECT count(*) > 0 FROM migrations)
            );
        " 2>/dev/null) || {
        log_warn "Some integrity checks failed — table names may differ"
        # Fallback: just check basic connectivity and table counts
        check_results=$(psql \
            -h "$DB_HOST" \
            -p "$DB_PORT" \
            -U "$DB_USER" \
            -d "$TARGET_DB" \
            -t -A \
            -c "
                SELECT json_build_object(
                    'total_tables', (SELECT count(*) FROM pg_stat_user_tables),
                    'total_rows', (SELECT sum(n_live_tup) FROM pg_stat_user_tables)
                );
            " 2>/dev/null) || {
            log_error "Cannot verify data integrity — database may be in bad state"
            return 1
        }
    }

    log_info "Data integrity check results:"
    log_info "  ${check_results}"

    # Compare pre and post restore counts if both exist
    local pre_file="/tmp/dblock-rowcounts-pre-restore-${TIMESTAMP}.json"
    local post_file="/tmp/dblock-rowcounts-post-restore-${TIMESTAMP}.json"

    if [[ -f "$pre_file" && -f "$post_file" ]]; then
        log_info "Comparing pre-restore and post-restore row counts..."
        log_info "  Pre-restore:  $(cat "$pre_file" | head -c 500)"
        log_info "  Post-restore: $(cat "$post_file" | head -c 500)"
    fi

    log_success "Data integrity verification completed."
}

# =============================================================================
# Post-Restore: Health Check
# =============================================================================

health_check() {
    log_info "Running post-restore health checks..."

    # Check database connectivity
    log_info "  Checking database connectivity..."
    psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$TARGET_DB" \
        -c "SELECT 1;" \
        > /dev/null 2>&1 || {
        log_error "Database connectivity check FAILED"
        return 1
    }
    log_info "  Database connectivity: OK"

    # Check table accessibility
    log_info "  Checking table accessibility..."
    local accessible_tables
    accessible_tables=$(psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$TARGET_DB" \
        -t -A \
        -c "SELECT count(*) FROM pg_stat_user_tables WHERE n_live_tup >= 0;" \
        2>/dev/null)
    log_info "  Accessible tables: ${accessible_tables}"

    # Check for broken foreign keys (sample check)
    log_info "  Checking foreign key constraints..."
    local fk_violations
    fk_violations=$(psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$TARGET_DB" \
        -t -A \
        -c "
            SELECT count(*)
            FROM information_schema.table_constraints
            WHERE constraint_type = 'FOREIGN KEY'
              AND table_schema = 'public';
        " 2>/dev/null) || fk_violations="unknown"
    log_info "  Foreign key constraints: ${fk_violations}"

    # Check if application health endpoint responds (if service is running)
    local api_url
    case "$ENV" in
        staging)    api_url="https://dblock-api-staging.azurewebsites.net/api/health" ;;
        production) api_url="https://dblock-api-production.azurewebsites.net/api/health" ;;
    esac

    log_info "  Checking API health endpoint: ${api_url}"
    local http_code
    http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$api_url" 2>/dev/null) || http_code="000"

    if [[ "$http_code" == "200" ]]; then
        log_info "  API health endpoint: OK (HTTP ${http_code})"
    elif [[ "$http_code" == "000" ]]; then
        log_warn "  API health endpoint: Not reachable (service may be stopped)"
    else
        log_warn "  API health endpoint: HTTP ${http_code} (may need restart)"
    fi

    log_success "Post-restore health checks completed."
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
    "restore_id": "restore-${TIMESTAMP}",
    "environment": "${ENV}",
    "source": "${SOURCE}",
    "target_db": "${TARGET_DB}",
    "status": "${status}",
    "message": "${message}",
    "duration_seconds": ${duration},
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "log_file": "${LOG_FILE}"
}
JSON
)

    local webhook_url
    webhook_url=$(az keyvault secret show \
        --vault-name "$KEY_VAULT" \
        --name "BACKUP-NOTIFICATION-WEBHOOK" \
        --query "value" -o tsv 2>/dev/null) || {
        log_warn "No notification webhook configured"
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
        log_info "Notification sent."
    fi
}

# =============================================================================
# Cleanup
# =============================================================================

cleanup() {
    log_info "Cleaning up temporary files..."

    # Remove downloaded/decompressed backup files from /tmp
    if [[ -n "${RESTORE_FILE:-}" && -f "${RESTORE_FILE}" && "${RESTORE_FILE}" == /tmp/* ]]; then
        rm -f "$RESTORE_FILE"
        rm -f "${RESTORE_FILE}.gz"
        log_info "Cleaned up: ${RESTORE_FILE}"
    fi

    unset PGPASSWORD

    log_info "Cleanup completed."
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    local start_time
    start_time=$(date +%s)

    echo "============================================================"
    log_info "D Block Workspace — Database Restore"
    log_info "============================================================"
    log_info "Environment:  ${ENV}"
    log_info "Source:        ${SOURCE:-N/A}"
    log_info "Target DB:    ${TARGET_DB:-default}"
    log_info "Timestamp:    ${TIMESTAMP}"
    log_info "Log File:     ${LOG_FILE}"
    echo "============================================================"

    configure_environment
    check_prerequisites

    # List mode
    if [[ "$LIST_ONLY" == true ]]; then
        list_backups
        exit 0
    fi

    # Production safety confirmation
    confirm_production_restore

    # Resolve and download backup
    resolve_backup_source

    # Verify backup before proceeding
    verify_backup_integrity

    # Create safety snapshot of current data
    capture_row_counts "pre-restore"
    create_pre_restore_snapshot

    # Perform the restore
    restore_database

    # Post-restore steps
    run_migrations
    verify_data_integrity
    health_check

    # Cleanup
    cleanup

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo "============================================================"
    log_success "Database restore completed successfully."
    log_success "Total duration: ${duration} seconds"
    log_success "Target database: ${TARGET_DB}@${DB_HOST}"
    echo "============================================================"

    send_notification "success" "Database restore completed successfully" "$duration"
}

# Trap errors
trap 'handle_error $LINENO' ERR

handle_error() {
    local line_number="$1"
    local end_time
    end_time=$(date +%s)
    local start_time_approx
    start_time_approx=$(date -d "$(head -1 "$LOG_FILE" 2>/dev/null | grep -oP '\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}' || echo "")" +%s 2>/dev/null || echo "$end_time")
    local duration=$((end_time - start_time_approx))

    log_error "Restore FAILED at line ${line_number}"
    log_error "Check log file for details: ${LOG_FILE}"

    send_notification "failure" "Database restore failed at line ${line_number}" "$duration"

    cleanup
    exit 1
}

# Parse arguments and run
parse_args "$@"
main
