#!/usr/bin/env bash
# ============================================================================
# D Block Workspace - Seed Data Script
# ============================================================================
# Seeds the database with initial data from the NestJS seed commands and
# the Areas Available.xlsx file. All operations are idempotent.
#
# Usage:
#   ./scripts/seed-data.sh --env staging --type all
#   ./scripts/seed-data.sh --env staging --type locations
#   ./scripts/seed-data.sh --env production --type resources
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
SEED_TYPE="all"

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
${BOLD}D Block Workspace - Seed Data Script${NC}

${BOLD}USAGE:${NC}
    $(basename "$0") --env <environment> [OPTIONS]

${BOLD}REQUIRED:${NC}
    --env <staging|production|development>   Target environment

${BOLD}OPTIONS:${NC}
    --type <locations|resources|products|admin|all>
                                  Type of seed data to load (default: all)
    -h, --help                    Show this help message

${BOLD}SEED TYPES:${NC}
    locations   Seed D Block workspace locations (Stamba, Radio City, Batumi)
    resources   Import resources from Areas Available.xlsx
    products    Seed default product catalog and rate codes
    admin       Create default admin user
    all         Run all seed types in order

${BOLD}NOTE:${NC}
    All seed operations are idempotent. Running them multiple times
    will not create duplicate data — existing records are skipped.

${BOLD}EXAMPLES:${NC}
    $(basename "$0") --env development --type all
    $(basename "$0") --env staging --type locations
    $(basename "$0") --env staging --type resources
    $(basename "$0") --env production --type admin
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
            --type)
                SEED_TYPE="$2"
                shift 2
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
        log_error "Invalid environment: ${ENVIRONMENT}"
        exit 1
    fi

    local valid_types="locations resources products admin all"
    if ! echo "${valid_types}" | grep -qw "${SEED_TYPE}"; then
        log_error "Invalid seed type: ${SEED_TYPE}. Must be one of: ${valid_types}"
        exit 1
    fi

    # Production safety
    if [[ "${ENVIRONMENT}" == "production" ]]; then
        echo -e "\n${YELLOW}${BOLD}WARNING: You are about to seed data in PRODUCTION${NC}"
        echo -e "Seed type: ${BOLD}${SEED_TYPE}${NC}"
        echo -e "All seed operations are idempotent (existing data will not be duplicated).\n"
        read -r -p "Continue? [y/N] " confirm
        if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
            log_info "Seeding cancelled."
            exit 0
        fi
    fi
}

# ─── Load Environment ───────────────────────────────────────────────────────
load_env() {
    log_step "Loading Environment"

    # Load env-specific file
    local env_file="${BACKEND_DIR}/.env.${ENVIRONMENT}"
    if [[ -f "${env_file}" ]]; then
        log_info "Loading: ${env_file}"
        set -a
        # shellcheck disable=SC1090
        source "${env_file}"
        set +a
    fi

    # Load default .env
    if [[ -f "${BACKEND_DIR}/.env" ]]; then
        set -a
        # shellcheck disable=SC1090
        source "${BACKEND_DIR}/.env"
        set +a
    fi

    # Resolve DATABASE_URL if present
    if [[ -n "${DATABASE_URL:-}" ]]; then
        local url="${DATABASE_URL}"
        url="${url#postgres://}"
        url="${url#postgresql://}"
        export DB_USERNAME="${url%%:*}"
        url="${url#*:}"
        export DB_PASSWORD="${url%%@*}"
        url="${url#*@}"
        export DB_HOST="${url%%:*}"
        url="${url#*:}"
        export DB_PORT="${url%%/*}"
        export DB_NAME="${url#*/}"
        DB_NAME="${DB_NAME%%\?*}"
    fi

    export DB_HOST="${DB_HOST:-localhost}"
    export DB_PORT="${DB_PORT:-5432}"
    export DB_USERNAME="${DB_USERNAME:-dblock}"
    export DB_PASSWORD="${DB_PASSWORD:-dblock_dev}"
    export DB_NAME="${DB_NAME:-dblock_workspace}"
    export NODE_ENV="${ENVIRONMENT}"

    log_info "Database: ${DB_USERNAME}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
}

# ─── Seed Locations ─────────────────────────────────────────────────────────
seed_locations() {
    log_step "Seeding Locations"

    cd "${BACKEND_DIR}"

    log_info "Seeding D Block workspace locations..."
    log_info "Locations: Stamba Workspace, Radio City, Batumi Workspace"

    npx ts-node -r tsconfig-paths/register -e "
        const { AppDataSource } = require('./src/common/database/data-source');
        const { seedLocations } = require('./src/common/database/seeds/location.seed');

        async function run() {
            const ds = await AppDataSource.initialize();
            try {
                await seedLocations(ds);
                console.log('Location seeding complete.');
            } finally {
                await ds.destroy();
            }
        }
        run().catch(e => { console.error(e); process.exit(1); });
    "

    log_success "Locations seeded"
}

# ─── Seed Resources ─────────────────────────────────────────────────────────
seed_resources() {
    log_step "Seeding Resources from Areas Available.xlsx"

    cd "${BACKEND_DIR}"

    # Check for the xlsx file
    local xlsx_path="${PROJECT_ROOT}/Areas Available.xlsx"
    if [[ ! -f "${xlsx_path}" ]]; then
        log_warn "XLSX file not found at: ${xlsx_path}"
        log_warn "Resources will not be imported from spreadsheet."
        log_info "Place 'Areas Available.xlsx' in the project root to import resources."
        return 0
    fi

    log_info "Found spreadsheet: ${xlsx_path}"
    log_info "Importing resources (idempotent - existing records will be skipped)..."

    npx ts-node -r tsconfig-paths/register -e "
        const { AppDataSource } = require('./src/common/database/data-source');
        const { seedResources } = require('./src/common/database/seeds/resource.seed');

        async function run() {
            const ds = await AppDataSource.initialize();
            try {
                await seedResources(ds);
                console.log('Resource seeding complete.');
            } finally {
                await ds.destroy();
            }
        }
        run().catch(e => { console.error(e); process.exit(1); });
    "

    log_success "Resources seeded"
}

# ─── Seed Products ──────────────────────────────────────────────────────────
seed_products() {
    log_step "Seeding Products and Rate Codes"

    cd "${BACKEND_DIR}"

    log_info "Creating default product catalog..."

    npx ts-node -r tsconfig-paths/register -e "
        const { AppDataSource } = require('./src/common/database/data-source');
        const { Product } = require('./src/common/database/entities/product.entity');
        const { RateCode } = require('./src/common/database/entities/rate-code.entity');
        const { CreditPackage } = require('./src/common/database/entities/credit-package.entity');

        async function run() {
            const ds = await AppDataSource.initialize();
            try {
                const productRepo = ds.getRepository(Product);
                const rateCodeRepo = ds.getRepository(RateCode);
                const creditRepo = ds.getRepository(CreditPackage);

                // Default products
                const products = [
                    {
                        name: 'Hot Desk - Day Pass',
                        description: 'Single day access to any available hot desk',
                        category: 'day_pass',
                        isActive: true,
                    },
                    {
                        name: 'Fixed Desk - Monthly',
                        description: 'Dedicated desk with 24/7 access for one month',
                        category: 'monthly',
                        isActive: true,
                    },
                    {
                        name: 'Private Office - Monthly',
                        description: 'Private office space with monthly lease',
                        category: 'monthly',
                        isActive: true,
                    },
                    {
                        name: 'Meeting Room - Hourly',
                        description: 'Meeting room booking by the hour',
                        category: 'hourly',
                        isActive: true,
                    },
                    {
                        name: 'Event Space - Daily',
                        description: 'Event space rental for full day',
                        category: 'daily',
                        isActive: true,
                    },
                ];

                for (const p of products) {
                    const existing = await productRepo.findOne({ where: { name: p.name } });
                    if (!existing) {
                        await productRepo.save(productRepo.create(p));
                        console.log('  Created product: ' + p.name);
                    } else {
                        console.log('  Skipped (exists): ' + p.name);
                    }
                }

                // Default credit packages
                const creditPackages = [
                    { name: '10 Credits', credits: 10, priceGel: 50, isActive: true },
                    { name: '25 Credits', credits: 25, priceGel: 110, isActive: true },
                    { name: '50 Credits', credits: 50, priceGel: 200, isActive: true },
                    { name: '100 Credits', credits: 100, priceGel: 350, isActive: true },
                ];

                for (const cp of creditPackages) {
                    const existing = await creditRepo.findOne({ where: { name: cp.name } });
                    if (!existing) {
                        await creditRepo.save(creditRepo.create(cp));
                        console.log('  Created credit package: ' + cp.name);
                    } else {
                        console.log('  Skipped (exists): ' + cp.name);
                    }
                }

                console.log('Product seeding complete.');
            } finally {
                await ds.destroy();
            }
        }
        run().catch(e => { console.error(e); process.exit(1); });
    "

    log_success "Products seeded"
}

# ─── Create Default Admin ───────────────────────────────────────────────────
seed_admin_user() {
    log_step "Creating Default Admin User"

    cd "${BACKEND_DIR}"

    local admin_email="${ADMIN_EMAIL:-admin@dblock.ge}"
    local admin_password="${ADMIN_PASSWORD:-}"

    if [[ -z "${admin_password}" ]]; then
        if [[ "${ENVIRONMENT}" == "development" ]]; then
            admin_password="Admin123!@#"
            log_warn "Using default development admin password"
        else
            log_error "ADMIN_PASSWORD environment variable is required for ${ENVIRONMENT}"
            log_info "Set it with: export ADMIN_PASSWORD='your-secure-password'"
            exit 1
        fi
    fi

    log_info "Admin email: ${admin_email}"

    npx ts-node -r tsconfig-paths/register -e "
        const { AppDataSource } = require('./src/common/database/data-source');
        const { User } = require('./src/common/database/entities/user.entity');
        const bcrypt = require('bcrypt');

        async function run() {
            const ds = await AppDataSource.initialize();
            try {
                const userRepo = ds.getRepository(User);

                const existing = await userRepo.findOne({
                    where: { email: '${admin_email}' }
                });

                if (existing) {
                    console.log('Admin user already exists: ${admin_email}');
                    console.log('Skipping admin creation.');
                    return;
                }

                const hashedPassword = await bcrypt.hash('${admin_password}', 12);

                const admin = userRepo.create({
                    email: '${admin_email}',
                    passwordHash: hashedPassword,
                    firstName: 'D Block',
                    lastName: 'Admin',
                    role: 'admin',
                    isActive: true,
                    isEmailVerified: true,
                });

                await userRepo.save(admin);
                console.log('Admin user created: ${admin_email}');
            } finally {
                await ds.destroy();
            }
        }
        run().catch(e => { console.error(e); process.exit(1); });
    "

    log_success "Admin user seeded"
}

# ─── Run All Seeds ──────────────────────────────────────────────────────────
seed_all() {
    log_info "Running all seed types in order..."

    seed_locations
    seed_resources
    seed_products
    seed_admin_user
}

# ─── Main ────────────────────────────────────────────────────────────────────
main() {
    local start_time
    start_time=$(date +%s)

    echo -e "\n${BOLD}D Block Workspace - Seed Data${NC}\n"

    parse_args "$@"
    validate_args
    load_env

    # Ensure dependencies are installed
    if [[ ! -d "${BACKEND_DIR}/node_modules" ]]; then
        log_info "Installing backend dependencies..."
        cd "${PROJECT_ROOT}"
        npm ci --workspace=apps/backend --include-workspace-root 2>/dev/null
    fi

    # Execute seed type
    case "${SEED_TYPE}" in
        locations)
            seed_locations
            ;;
        resources)
            seed_resources
            ;;
        products)
            seed_products
            ;;
        admin)
            seed_admin_user
            ;;
        all)
            seed_all
            ;;
    esac

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    echo -e "${BOLD}════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}${BOLD}  SEED DATA COMPLETED${NC}"
    echo -e "${BOLD}════════════════════════════════════════════════════${NC}"
    echo -e "  Environment: ${BOLD}${ENVIRONMENT}${NC}"
    echo -e "  Seed type:   ${BOLD}${SEED_TYPE}${NC}"
    echo -e "  Duration:    ${BOLD}${duration}s${NC}"
    echo -e "${BOLD}════════════════════════════════════════════════════${NC}"
    echo ""
}

main "$@"
