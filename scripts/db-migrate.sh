#!/usr/bin/env bash
# ============================================================================
# D Block Workspace - Database Migration Runner
# ============================================================================
# Manages TypeORM database migrations with backup support.
#
# Usage:
#   ./scripts/db-migrate.sh --env staging --action run
#   ./scripts/db-migrate.sh --env production --action revert
#   ./scripts/db-migrate.sh --env staging --action show
#   ./scripts/db-migrate.sh --env staging --action generate --name AddUserFields
# ============================================================================

set -euo pipefail

# ─── Color Codes ─────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ─── Script Directory ───────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/apps/backend"

# ─── Default Values ─────────────────────────────────────────────────────────
ENVIRONMENT=""
ACTION=""
MIGRATION_NAME=""
SKIP_BACKUP=false

# ─── Logging Functions ──────────────────────────────────────────────────────
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%H:%M:%S') $*"
}

log_success() {
    echo -e "${GREEN}[OK]${NC}   $(date '+%H:%M:%S') $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%H:%M:%S') $*"
}

log_error() {
    echo -e "${RED}[ERR]${NC}  $(date '+%H:%M:%S') $*"
}

log_step() {
    echo -e "\n${CYAN}${BOLD}── $* ──${NC}"
}

# ─── Usage ───────────────────────────────────────────────────────────────────
usage() {
    cat <<EOF
${BOLD}D Block Workspace - Database Migration Runner${NC}

${BOLD}USAGE:${NC}
    $(basename "$0") --env <environment> --action <action> [OPTIONS]

${BOLD}REQUIRED:${NC}
    --env <staging|production|development>   Target environment
    --action <run|revert|generate|show>      Migration action

${BOLD}OPTIONS:${NC}
    --name <migration-name>       Name for new migration (required for 'generate')
    --skip-backup                 Skip pre-migration database backup
    -h, --help                    Show this help message

${BOLD}ACTIONS:${NC}
    run        Run all pending migrations
    revert     Revert the last executed migration
    generate   Generate a new migration from entity changes
    show       Show pending and executed migrations

${BOLD}EXAMPLES:${NC}
    $(basename "$0") --env staging --action show
    $(basename "$0") --env staging --action run
    $(basename "$0") --env production --action run
    $(basename "$0") --env staging --action revert
    $(basename "$0") --env development --action generate --name AddUserFields
EOF
    exit 0
}

# ─── Parse Arguments ────────────────────────────────────────────────────────
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --action)
                ACTION="$2"
                shift 2
                ;;
            --name)
                MIGRATION_NAME="$2"
                shift 2
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            -h|--help)
                usage
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                ;;
        esac
    done
}

# ─── Validation ──────────────────────────────────────────────────────────────
validate_args() {
    if [[ -z "${ENVIRONMENT}" ]]; then
        log_error "Environment is required."
        exit 1
    fi

    if [[ "${ENVIRONMENT}" != "staging" && "${ENVIRONMENT}" != "production" && "${ENVIRONMENT}" != "development" ]]; then
        log_error "Invalid environment: ${ENVIRONMENT}. Must be 'staging', 'production', or 'development'"
        exit 1
    fi

    if [[ -z "${ACTION}" ]]; then
        log_error "Action is required."
        exit 1
    fi

    if [[ "${ACTION}" != "run" && "${ACTION}" != "revert" && "${ACTION}" != "generate" && "${ACTION}" != "show" ]]; then
        log_error "Invalid action: ${ACTION}. Must be 'run', 'revert', 'generate', or 'show'"
        exit 1
    fi

    if [[ "${ACTION}" == "generate" && -z "${MIGRATION_NAME}" ]]; then
        log_error "Migration name is required for 'generate' action. Use --name <name>"
        exit 1
    fi

    # Production safety check for destructive actions
    if [[ "${ENVIRONMENT}" == "production" && "${ACTION}" == "revert" ]]; then
        echo -e "\n${RED}${BOLD}WARNING: You are about to REVERT a migration in PRODUCTION${NC}"
        echo -e "This action will undo the last applied migration.\n"
        read -r -p "Are you sure you want to continue? [y/N] " confirm
        if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
            log_info "Migration revert cancelled."
            exit 0
        fi
    fi
}

# ─── Load Database Configuration ────────────────────────────────────────────
load_db_config() {
    log_step "Loading Database Configuration"

    # Load from env-specific file if it exists
    local env_file="${BACKEND_DIR}/.env.${ENVIRONMENT}"
    if [[ -f "${env_file}" ]]; then
        log_info "Loading env from: ${env_file}"
        set -a
        # shellcheck disable=SC1090
        source "${env_file}"
        set +a
    fi

    # Also try the default .env file
    if [[ -f "${BACKEND_DIR}/.env" ]]; then
        set -a
        # shellcheck disable=SC1090
        source "${BACKEND_DIR}/.env"
        set +a
    fi

    # Resolve DATABASE_URL or individual DB_ vars
    if [[ -n "${DATABASE_URL:-}" ]]; then
        log_info "Using DATABASE_URL"
        export DB_HOST DB_PORT DB_USERNAME DB_PASSWORD DB_NAME
        # Parse DATABASE_URL: postgres://user:pass@host:port/dbname
        local url="${DATABASE_URL}"
        url="${url#postgres://}"
        url="${url#postgresql://}"
        DB_USERNAME="${url%%:*}"
        url="${url#*:}"
        DB_PASSWORD="${url%%@*}"
        url="${url#*@}"
        DB_HOST="${url%%:*}"
        url="${url#*:}"
        DB_PORT="${url%%/*}"
        DB_NAME="${url#*/}"
        DB_NAME="${DB_NAME%%\?*}" # Strip query params
    fi

    # Verify we have database connection info
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_USERNAME="${DB_USERNAME:-dblock}"
    DB_PASSWORD="${DB_PASSWORD:-dblock_dev}"
    DB_NAME="${DB_NAME:-dblock_workspace}"

    export DB_HOST DB_PORT DB_USERNAME DB_PASSWORD DB_NAME

    log_info "Database: ${DB_USERNAME}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
}

# ─── Backup Database ────────────────────────────────────────────────────────
backup_database() {
    if [[ "${SKIP_BACKUP}" == "true" ]]; then
        log_info "Skipping database backup (--skip-backup)"
        return 0
    fi

    if [[ "${ACTION}" != "run" && "${ACTION}" != "revert" ]]; then
        return 0
    fi

    log_step "Creating Database Backup"

    if ! command -v pg_dump &>/dev/null; then
        log_warn "pg_dump not found. Skipping backup."
        log_warn "Install PostgreSQL client tools to enable backups."
        return 0
    fi

    local backup_dir="${PROJECT_ROOT}/backups"
    mkdir -p "${backup_dir}"

    local timestamp
    timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_file="${backup_dir}/dblock_${ENVIRONMENT}_${timestamp}_pre_${ACTION}.sql.gz"

    log_info "Backing up to: ${backup_file}"

    PGPASSWORD="${DB_PASSWORD}" pg_dump \
        --host="${DB_HOST}" \
        --port="${DB_PORT}" \
        --username="${DB_USERNAME}" \
        --dbname="${DB_NAME}" \
        --format=custom \
        --no-owner \
        --no-acl \
        --verbose 2>/dev/null | gzip > "${backup_file}"

    local backup_size
    backup_size=$(du -sh "${backup_file}" 2>/dev/null | cut -f1)
    log_success "Backup created: ${backup_file} (${backup_size})"

    # Clean up old backups (keep last 10)
    local count
    count=$(find "${backup_dir}" -name "dblock_${ENVIRONMENT}_*.sql.gz" -type f | wc -l | tr -d ' ')
    if [[ "${count}" -gt 10 ]]; then
        log_info "Cleaning up old backups (keeping last 10)..."
        find "${backup_dir}" -name "dblock_${ENVIRONMENT}_*.sql.gz" -type f | \
            sort | head -n -10 | xargs rm -f
    fi
}

# ─── Run Migrations ─────────────────────────────────────────────────────────
run_migrations() {
    log_step "Running Pending Migrations"

    cd "${BACKEND_DIR}"

    log_info "Checking for pending migrations..."
    npx ts-node -r tsconfig-paths/register \
        ./node_modules/typeorm/cli.js \
        migration:show \
        -d src/common/database/data-source.ts 2>&1 | while IFS= read -r line; do
        echo -e "  ${line}"
    done

    echo ""
    log_info "Applying migrations..."

    npx ts-node -r tsconfig-paths/register \
        ./node_modules/typeorm/cli.js \
        migration:run \
        -d src/common/database/data-source.ts

    log_success "All migrations applied successfully"
}

# ─── Revert Last Migration ──────────────────────────────────────────────────
revert_migration() {
    log_step "Reverting Last Migration"

    cd "${BACKEND_DIR}"

    log_info "Current migration status:"
    npx ts-node -r tsconfig-paths/register \
        ./node_modules/typeorm/cli.js \
        migration:show \
        -d src/common/database/data-source.ts 2>&1 | while IFS= read -r line; do
        echo -e "  ${line}"
    done

    echo ""
    log_info "Reverting last migration..."

    npx ts-node -r tsconfig-paths/register \
        ./node_modules/typeorm/cli.js \
        migration:revert \
        -d src/common/database/data-source.ts

    log_success "Last migration reverted"
}

# ─── Generate New Migration ─────────────────────────────────────────────────
generate_migration() {
    log_step "Generating New Migration: ${MIGRATION_NAME}"

    cd "${BACKEND_DIR}"

    local migration_path="src/common/database/migrations/${MIGRATION_NAME}"

    log_info "Generating migration from entity diff..."

    npx ts-node -r tsconfig-paths/register \
        ./node_modules/typeorm/cli.js \
        migration:generate \
        -d src/common/database/data-source.ts \
        "${migration_path}"

    log_success "Migration generated at: ${migration_path}"
    log_info "Review the generated migration before applying."
}

# ─── Show Migration Status ──────────────────────────────────────────────────
show_migrations() {
    log_step "Migration Status"

    cd "${BACKEND_DIR}"

    log_info "Environment: ${ENVIRONMENT}"
    log_info "Database: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo ""

    npx ts-node -r tsconfig-paths/register \
        ./node_modules/typeorm/cli.js \
        migration:show \
        -d src/common/database/data-source.ts 2>&1 | while IFS= read -r line; do
        if echo "${line}" | grep -q "\[X\]"; then
            echo -e "  ${GREEN}${line}${NC}"
        elif echo "${line}" | grep -q "\[ \]"; then
            echo -e "  ${YELLOW}${line}${NC}"
        else
            echo -e "  ${line}"
        fi
    done
}

# ─── Test Database Connection ────────────────────────────────────────────────
test_db_connection() {
    log_info "Testing database connection..."

    if command -v psql &>/dev/null; then
        if PGPASSWORD="${DB_PASSWORD}" psql \
            --host="${DB_HOST}" \
            --port="${DB_PORT}" \
            --username="${DB_USERNAME}" \
            --dbname="${DB_NAME}" \
            --command="SELECT 1;" \
            --quiet --no-align --tuples-only &>/dev/null; then
            log_success "Database connection successful"
            return 0
        fi
    fi

    # Fallback: try using TypeORM directly
    cd "${BACKEND_DIR}"
    if npx ts-node -r tsconfig-paths/register -e "
        const { AppDataSource } = require('./src/common/database/data-source');
        AppDataSource.initialize()
            .then(ds => { console.log('Connected'); ds.destroy(); })
            .catch(e => { console.error(e.message); process.exit(1); });
    " 2>/dev/null; then
        log_success "Database connection successful (via TypeORM)"
        return 0
    fi

    log_error "Could not connect to database at ${DB_HOST}:${DB_PORT}/${DB_NAME}"
    return 1
}

# ─── Main ────────────────────────────────────────────────────────────────────
main() {
    echo -e "\n${BOLD}D Block Workspace - Database Migration Runner${NC}\n"

    parse_args "$@"
    validate_args
    load_db_config
    test_db_connection

    # Create backup before run/revert
    backup_database

    # Execute action
    case "${ACTION}" in
        run)
            run_migrations
            ;;
        revert)
            revert_migration
            ;;
        generate)
            generate_migration
            ;;
        show)
            show_migrations
            ;;
    esac

    echo ""
    log_success "Migration action '${ACTION}' completed for ${ENVIRONMENT}"
}

main "$@"
