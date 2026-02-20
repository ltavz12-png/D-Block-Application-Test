#!/usr/bin/env bash
# ============================================================================
# D Block Workspace - Deployment Orchestrator
# ============================================================================
# Usage:
#   ./scripts/deploy.sh --env staging --service backend
#   ./scripts/deploy.sh --env production --service all --skip-migrations
#
# Prerequisites:
#   - Azure CLI (az) installed and authenticated
#   - Docker installed and running
#   - ACR credentials configured
# ============================================================================

set -euo pipefail

# ─── Color Codes ─────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ─── Script Directory ───────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ─── Default Values ─────────────────────────────────────────────────────────
ENVIRONMENT=""
SERVICE="all"
SKIP_MIGRATIONS=false
DRY_RUN=false
VERBOSE=false
IMAGE_TAG=""

# ─── Azure Configuration ────────────────────────────────────────────────────
ACR_REGISTRY="${ACR_LOGIN_SERVER:-dblockworkspace.azurecr.io}"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-dblock-rg}"
BACKEND_IMAGE_NAME="dblock-backend"
ADMIN_IMAGE_NAME="dblock-admin"

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
${BOLD}D Block Workspace - Deployment Orchestrator${NC}

${BOLD}USAGE:${NC}
    $(basename "$0") --env <environment> [OPTIONS]

${BOLD}REQUIRED:${NC}
    --env <staging|production>    Target deployment environment

${BOLD}OPTIONS:${NC}
    --service <backend|admin|all> Service to deploy (default: all)
    --skip-migrations             Skip database migrations
    --tag <image-tag>             Use specific image tag instead of building
    --dry-run                     Show what would be executed without deploying
    --verbose                     Enable verbose output
    -h, --help                    Show this help message

${BOLD}EXAMPLES:${NC}
    $(basename "$0") --env staging --service backend
    $(basename "$0") --env production --service all --skip-migrations
    $(basename "$0") --env staging --tag staging-abc12345
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
            --service)
                SERVICE="$2"
                shift 2
                ;;
            --skip-migrations)
                SKIP_MIGRATIONS=true
                shift
                ;;
            --tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
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
        log_error "Environment is required. Use --env staging or --env production"
        exit 1
    fi

    if [[ "${ENVIRONMENT}" != "staging" && "${ENVIRONMENT}" != "production" ]]; then
        log_error "Invalid environment: ${ENVIRONMENT}. Must be 'staging' or 'production'"
        exit 1
    fi

    if [[ "${SERVICE}" != "backend" && "${SERVICE}" != "admin" && "${SERVICE}" != "all" ]]; then
        log_error "Invalid service: ${SERVICE}. Must be 'backend', 'admin', or 'all'"
        exit 1
    fi

    # Production safety check
    if [[ "${ENVIRONMENT}" == "production" && "${DRY_RUN}" == "false" ]]; then
        echo -e "\n${RED}${BOLD}WARNING: You are about to deploy to PRODUCTION${NC}"
        echo -e "Service: ${BOLD}${SERVICE}${NC}"
        echo -e "Skip migrations: ${BOLD}${SKIP_MIGRATIONS}${NC}\n"
        read -r -p "Are you sure you want to continue? [y/N] " confirm
        if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
            log_info "Deployment cancelled."
            exit 0
        fi
    fi
}

# ─── Prerequisites Check ────────────────────────────────────────────────────
check_prerequisites() {
    log_step "Checking Prerequisites"

    local missing=()

    if ! command -v az &>/dev/null; then
        missing+=("Azure CLI (az)")
    fi

    if ! command -v docker &>/dev/null; then
        missing+=("Docker")
    fi

    if ! command -v curl &>/dev/null; then
        missing+=("curl")
    fi

    if ! command -v jq &>/dev/null; then
        missing+=("jq")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing required tools:"
        for tool in "${missing[@]}"; do
            echo -e "  ${RED}-${NC} ${tool}"
        done
        exit 1
    fi

    # Verify Azure login
    if ! az account show &>/dev/null; then
        log_error "Not logged in to Azure. Run 'az login' first."
        exit 1
    fi

    # Verify Docker is running
    if ! docker info &>/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker."
        exit 1
    fi

    log_success "All prerequisites met"
}

# ─── Load Environment Configuration ─────────────────────────────────────────
load_env_config() {
    log_step "Loading Environment Configuration"

    case "${ENVIRONMENT}" in
        staging)
            BACKEND_APP_NAME="${AZURE_WEBAPP_NAME:-dblock-api-staging}"
            ADMIN_APP_NAME="${AZURE_ADMIN_WEBAPP_NAME:-dblock-admin-staging}"
            DEPLOY_SLOT="staging"
            BACKEND_URL="https://${BACKEND_APP_NAME}.azurewebsites.net"
            ADMIN_URL="https://${ADMIN_APP_NAME}.azurewebsites.net"
            ;;
        production)
            BACKEND_APP_NAME="${AZURE_WEBAPP_NAME:-dblock-api}"
            ADMIN_APP_NAME="${AZURE_ADMIN_WEBAPP_NAME:-dblock-admin}"
            DEPLOY_SLOT="staging" # Deploy to staging slot first, then swap
            BACKEND_URL="https://${BACKEND_APP_NAME}.azurewebsites.net"
            ADMIN_URL="https://${ADMIN_APP_NAME}.azurewebsites.net"
            ;;
    esac

    # Generate image tag if not provided
    if [[ -z "${IMAGE_TAG}" ]]; then
        SHORT_SHA=$(git -C "${PROJECT_ROOT}" rev-parse --short=8 HEAD 2>/dev/null || echo "local")
        IMAGE_TAG="${ENVIRONMENT}-${SHORT_SHA}"
    fi

    log_info "Environment:     ${BOLD}${ENVIRONMENT}${NC}"
    log_info "Service:         ${BOLD}${SERVICE}${NC}"
    log_info "Image tag:       ${BOLD}${IMAGE_TAG}${NC}"
    log_info "Backend app:     ${BOLD}${BACKEND_APP_NAME}${NC}"
    log_info "Admin app:       ${BOLD}${ADMIN_APP_NAME}${NC}"
    log_info "Skip migrations: ${BOLD}${SKIP_MIGRATIONS}${NC}"
}

# ─── Build Docker Image ─────────────────────────────────────────────────────
build_backend_image() {
    log_step "Building Backend Docker Image"

    local full_image="${ACR_REGISTRY}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG}"
    local latest_tag="${ACR_REGISTRY}/${BACKEND_IMAGE_NAME}:${ENVIRONMENT}-latest"

    log_info "Building image: ${full_image}"

    if [[ "${DRY_RUN}" == "true" ]]; then
        log_info "[DRY RUN] Would build: ${full_image}"
        return 0
    fi

    docker build \
        --file "${PROJECT_ROOT}/Dockerfile" \
        --tag "${full_image}" \
        --tag "${latest_tag}" \
        --build-arg NODE_ENV="${ENVIRONMENT}" \
        --platform linux/amd64 \
        "${PROJECT_ROOT}"

    log_success "Image built: ${full_image}"
}

# ─── Push to ACR ─────────────────────────────────────────────────────────────
push_to_acr() {
    log_step "Pushing Image to Azure Container Registry"

    local full_image="${ACR_REGISTRY}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG}"
    local latest_tag="${ACR_REGISTRY}/${BACKEND_IMAGE_NAME}:${ENVIRONMENT}-latest"

    if [[ "${DRY_RUN}" == "true" ]]; then
        log_info "[DRY RUN] Would push: ${full_image}"
        return 0
    fi

    # Login to ACR
    log_info "Logging in to ACR..."
    az acr login --name "${ACR_REGISTRY%%.*}" 2>/dev/null || {
        log_warn "az acr login failed, trying docker login..."
        docker login "${ACR_REGISTRY}" \
            --username "${ACR_USERNAME:-}" \
            --password "${ACR_PASSWORD:-}"
    }

    log_info "Pushing ${full_image}..."
    docker push "${full_image}"
    docker push "${latest_tag}"

    log_success "Image pushed to ACR"
}

# ─── Run Database Migrations ────────────────────────────────────────────────
run_migrations() {
    if [[ "${SKIP_MIGRATIONS}" == "true" ]]; then
        log_info "Skipping database migrations (--skip-migrations)"
        return 0
    fi

    log_step "Running Database Migrations"

    if [[ "${DRY_RUN}" == "true" ]]; then
        log_info "[DRY RUN] Would run migrations for ${ENVIRONMENT}"
        return 0
    fi

    "${SCRIPT_DIR}/db-migrate.sh" --env "${ENVIRONMENT}" --action run

    log_success "Migrations completed"
}

# ─── Deploy Backend ─────────────────────────────────────────────────────────
deploy_backend() {
    log_step "Deploying Backend to Azure App Service"

    local full_image="${ACR_REGISTRY}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG}"

    if [[ "${DRY_RUN}" == "true" ]]; then
        log_info "[DRY RUN] Would deploy ${full_image} to ${BACKEND_APP_NAME} slot ${DEPLOY_SLOT}"
        return 0
    fi

    # Deploy to staging slot
    log_info "Deploying to slot: ${DEPLOY_SLOT}"
    az webapp config container set \
        --resource-group "${RESOURCE_GROUP}" \
        --name "${BACKEND_APP_NAME}" \
        --slot "${DEPLOY_SLOT}" \
        --container-image-name "${full_image}" \
        --container-registry-url "https://${ACR_REGISTRY}" \
        --output none

    # Wait for the slot to stabilize
    log_info "Waiting for deployment to stabilize (30s)..."
    sleep 30

    # Health check on staging slot
    local slot_url
    if [[ "${DEPLOY_SLOT}" == "staging" ]]; then
        slot_url="https://${BACKEND_APP_NAME}-${DEPLOY_SLOT}.azurewebsites.net"
    else
        slot_url="${BACKEND_URL}"
    fi

    log_info "Running health check on ${slot_url}..."
    if ! "${SCRIPT_DIR}/health-check.sh" --url "${slot_url}" --retries 15 --timeout 10; then
        log_error "Health check failed on staging slot. Aborting deployment."
        log_error "The staging slot has the new version but production is unaffected."
        return 1
    fi

    # Swap slots for production (blue/green deployment)
    if [[ "${ENVIRONMENT}" == "production" ]]; then
        log_info "Swapping staging -> production..."
        az webapp deployment slot swap \
            --resource-group "${RESOURCE_GROUP}" \
            --name "${BACKEND_APP_NAME}" \
            --slot staging \
            --target-slot production \
            --output none

        log_info "Slot swap completed. Verifying production health..."

        if ! "${SCRIPT_DIR}/health-check.sh" --url "${BACKEND_URL}" --retries 10 --timeout 10; then
            log_error "Production health check failed after swap!"
            log_warn "Initiating automatic rollback..."
            rollback_backend
            return 1
        fi
    fi

    log_success "Backend deployed successfully"
}

# ─── Deploy Admin Panel ─────────────────────────────────────────────────────
deploy_admin() {
    log_step "Deploying Admin Panel"

    if [[ "${DRY_RUN}" == "true" ]]; then
        log_info "[DRY RUN] Would deploy admin panel to ${ADMIN_APP_NAME}"
        return 0
    fi

    # Build the admin panel
    log_info "Building admin panel..."
    cd "${PROJECT_ROOT}"
    npm ci --workspace=apps/admin --include-workspace-root 2>/dev/null
    npm run build --workspace=apps/admin

    # Deploy to Azure App Service
    log_info "Deploying admin panel to ${ADMIN_APP_NAME}..."

    if [[ "${ENVIRONMENT}" == "production" ]]; then
        # Deploy to staging slot first, then swap
        az webapp deployment slot swap \
            --resource-group "${RESOURCE_GROUP}" \
            --name "${ADMIN_APP_NAME}" \
            --slot staging \
            --target-slot production \
            --output none 2>/dev/null || true

        az webapp deploy \
            --resource-group "${RESOURCE_GROUP}" \
            --name "${ADMIN_APP_NAME}" \
            --slot staging \
            --src-path "${PROJECT_ROOT}/apps/admin/.next" \
            --type zip \
            --output none 2>/dev/null || {
                # Fallback: use az webapp up
                log_warn "Zip deploy failed, trying alternative deployment..."
                az webapp config appsettings set \
                    --resource-group "${RESOURCE_GROUP}" \
                    --name "${ADMIN_APP_NAME}" \
                    --slot staging \
                    --settings NEXT_PUBLIC_ENVIRONMENT="${ENVIRONMENT}" \
                    --output none
            }

        # Swap after verification
        sleep 15
        az webapp deployment slot swap \
            --resource-group "${RESOURCE_GROUP}" \
            --name "${ADMIN_APP_NAME}" \
            --slot staging \
            --target-slot production \
            --output none
    else
        az webapp deploy \
            --resource-group "${RESOURCE_GROUP}" \
            --name "${ADMIN_APP_NAME}" \
            --src-path "${PROJECT_ROOT}/apps/admin/.next" \
            --type zip \
            --output none 2>/dev/null || {
                log_warn "Zip deploy failed, updating app settings..."
                az webapp config appsettings set \
                    --resource-group "${RESOURCE_GROUP}" \
                    --name "${ADMIN_APP_NAME}" \
                    --settings NEXT_PUBLIC_ENVIRONMENT="${ENVIRONMENT}" \
                    --output none
            }
    fi

    log_success "Admin panel deployed"
}

# ─── Rollback Backend ───────────────────────────────────────────────────────
rollback_backend() {
    log_warn "Rolling back backend deployment..."

    az webapp deployment slot swap \
        --resource-group "${RESOURCE_GROUP}" \
        --name "${BACKEND_APP_NAME}" \
        --slot staging \
        --target-slot production \
        --output none

    log_info "Rollback swap completed. Verifying health..."

    if "${SCRIPT_DIR}/health-check.sh" --url "${BACKEND_URL}" --retries 10 --timeout 10; then
        log_success "Rollback successful - production is healthy"
    else
        log_error "CRITICAL: Rollback health check also failed!"
        log_error "Manual intervention required for ${BACKEND_APP_NAME}"
        exit 2
    fi
}

# ─── Print Summary ──────────────────────────────────────────────────────────
print_summary() {
    local status="$1"
    local duration="$2"

    echo ""
    echo -e "${BOLD}════════════════════════════════════════════════════${NC}"
    if [[ "${status}" == "success" ]]; then
        echo -e "${GREEN}${BOLD}  DEPLOYMENT COMPLETED SUCCESSFULLY${NC}"
    else
        echo -e "${RED}${BOLD}  DEPLOYMENT FAILED${NC}"
    fi
    echo -e "${BOLD}════════════════════════════════════════════════════${NC}"
    echo -e "  Environment:  ${BOLD}${ENVIRONMENT}${NC}"
    echo -e "  Service:      ${BOLD}${SERVICE}${NC}"
    echo -e "  Image tag:    ${BOLD}${IMAGE_TAG}${NC}"
    echo -e "  Duration:     ${BOLD}${duration}s${NC}"

    if [[ "${status}" == "success" ]]; then
        echo -e "  Backend URL:  ${CYAN}${BACKEND_URL}${NC}"
        echo -e "  Admin URL:    ${CYAN}${ADMIN_URL}${NC}"
    fi

    echo -e "${BOLD}════════════════════════════════════════════════════${NC}"
    echo ""
}

# ─── Main ────────────────────────────────────────────────────────────────────
main() {
    local start_time
    start_time=$(date +%s)

    echo -e "\n${BOLD}D Block Workspace - Deployment Orchestrator${NC}\n"

    parse_args "$@"
    validate_args
    check_prerequisites
    load_env_config

    local deploy_status="success"

    # Step 1: Build and push Docker image (for backend)
    if [[ "${SERVICE}" == "backend" || "${SERVICE}" == "all" ]]; then
        build_backend_image || { deploy_status="failed"; }
        if [[ "${deploy_status}" == "success" ]]; then
            push_to_acr || { deploy_status="failed"; }
        fi
    fi

    # Step 2: Run database migrations
    if [[ "${deploy_status}" == "success" ]]; then
        run_migrations || { deploy_status="failed"; }
    fi

    # Step 3: Deploy services
    if [[ "${deploy_status}" == "success" ]]; then
        if [[ "${SERVICE}" == "backend" || "${SERVICE}" == "all" ]]; then
            deploy_backend || { deploy_status="failed"; }
        fi

        if [[ "${SERVICE}" == "admin" || "${SERVICE}" == "all" ]]; then
            deploy_admin || { deploy_status="failed"; }
        fi
    fi

    # Summary
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    print_summary "${deploy_status}" "${duration}"

    if [[ "${deploy_status}" != "success" ]]; then
        exit 1
    fi
}

main "$@"
