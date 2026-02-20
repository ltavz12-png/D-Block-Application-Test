#!/usr/bin/env bash
# ============================================================================
# D Block Workspace - Rollback Script
# ============================================================================
# Quick rollback for failed deployments. Supports two strategies:
#   1. Slot swap (default) - swaps staging/production slots back
#   2. Image tag rollback  - pulls a specific image version and redeploys
#
# Usage:
#   ./scripts/rollback.sh --env production --service backend
#   ./scripts/rollback.sh --env staging --service backend --version staging-abc12345
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

# ─── Default Values ─────────────────────────────────────────────────────────
ENVIRONMENT=""
SERVICE="backend"
ROLLBACK_VERSION=""

# ─── Azure Configuration ────────────────────────────────────────────────────
ACR_REGISTRY="${ACR_LOGIN_SERVER:-dblockworkspace.azurecr.io}"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-dblock-rg}"
BACKEND_IMAGE_NAME="dblock-backend"

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
${BOLD}D Block Workspace - Rollback${NC}

${BOLD}USAGE:${NC}
    $(basename "$0") --env <environment> [OPTIONS]

${BOLD}REQUIRED:${NC}
    --env <staging|production>      Target environment

${BOLD}OPTIONS:${NC}
    --service <backend|admin>       Service to rollback (default: backend)
    --version <image-tag>           Specific image tag to rollback to
                                    (if omitted, performs slot swap)
    -h, --help                      Show this help message

${BOLD}STRATEGIES:${NC}
    Slot Swap (default):
        Swaps the staging and production deployment slots. This is the
        fastest rollback method as the previous version is still running
        in the staging slot after a deployment.

    Image Tag Rollback (--version):
        Pulls a specific Docker image tag from ACR and redeploys it.
        Use this when the staging slot no longer has the desired version.

${BOLD}EXAMPLES:${NC}
    $(basename "$0") --env production --service backend
    $(basename "$0") --env production --service backend --version production-abc12345
    $(basename "$0") --env staging --service admin

${BOLD}LISTING AVAILABLE TAGS:${NC}
    az acr repository show-tags --name dblockworkspace --repository dblock-backend --orderby time_desc --top 10
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
            --version)
                ROLLBACK_VERSION="$2"
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
        log_error "Environment is required. Use --env staging or --env production"
        exit 1
    fi

    if [[ "${ENVIRONMENT}" != "staging" && "${ENVIRONMENT}" != "production" ]]; then
        log_error "Invalid environment: ${ENVIRONMENT}. Must be 'staging' or 'production'"
        exit 1
    fi

    if [[ "${SERVICE}" != "backend" && "${SERVICE}" != "admin" ]]; then
        log_error "Invalid service: ${SERVICE}. Must be 'backend' or 'admin'"
        exit 1
    fi

    # Safety confirmation
    echo -e "\n${RED}${BOLD}WARNING: You are about to rollback ${SERVICE} in ${ENVIRONMENT}${NC}"
    if [[ -n "${ROLLBACK_VERSION}" ]]; then
        echo -e "Strategy: ${BOLD}Image tag rollback${NC} to version: ${BOLD}${ROLLBACK_VERSION}${NC}"
    else
        echo -e "Strategy: ${BOLD}Slot swap${NC} (swap staging <-> production)"
    fi
    echo ""
    read -r -p "Are you sure you want to continue? [y/N] " confirm
    if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
        log_info "Rollback cancelled."
        exit 0
    fi
}

# ─── Load Environment Configuration ─────────────────────────────────────────
load_env_config() {
    case "${ENVIRONMENT}" in
        staging)
            BACKEND_APP_NAME="${AZURE_WEBAPP_NAME:-dblock-api-staging}"
            ADMIN_APP_NAME="${AZURE_ADMIN_WEBAPP_NAME:-dblock-admin-staging}"
            APP_URL="https://${BACKEND_APP_NAME}.azurewebsites.net"
            ;;
        production)
            BACKEND_APP_NAME="${AZURE_WEBAPP_NAME:-dblock-api}"
            ADMIN_APP_NAME="${AZURE_ADMIN_WEBAPP_NAME:-dblock-admin}"
            APP_URL="https://${BACKEND_APP_NAME}.azurewebsites.net"
            ;;
    esac
}

# ─── Slot Swap Rollback ─────────────────────────────────────────────────────
rollback_slot_swap() {
    local app_name="$1"

    log_step "Performing Slot Swap Rollback"
    log_info "App: ${app_name}"
    log_info "Swapping staging <-> production slots..."

    az webapp deployment slot swap \
        --resource-group "${RESOURCE_GROUP}" \
        --name "${app_name}" \
        --slot staging \
        --target-slot production \
        --output none

    log_success "Slot swap completed"
}

# ─── Image Tag Rollback ─────────────────────────────────────────────────────
rollback_to_version() {
    local app_name="$1"
    local image_tag="$2"

    log_step "Rolling Back to Image Version: ${image_tag}"

    local full_image="${ACR_REGISTRY}/${BACKEND_IMAGE_NAME}:${image_tag}"

    # Verify the image exists in ACR
    log_info "Verifying image exists in ACR..."
    local acr_name="${ACR_REGISTRY%%.*}"
    if ! az acr repository show-tags \
            --name "${acr_name}" \
            --repository "${BACKEND_IMAGE_NAME}" \
            --query "[?@=='${image_tag}']" \
            --output tsv 2>/dev/null | grep -q "${image_tag}"; then
        log_error "Image tag '${image_tag}' not found in ACR repository '${BACKEND_IMAGE_NAME}'"
        log_info "Available recent tags:"
        az acr repository show-tags \
            --name "${acr_name}" \
            --repository "${BACKEND_IMAGE_NAME}" \
            --orderby time_desc \
            --top 10 \
            --output table
        exit 1
    fi
    log_success "Image verified: ${full_image}"

    # Deploy to staging slot first
    log_info "Deploying ${full_image} to staging slot..."
    az webapp config container set \
        --resource-group "${RESOURCE_GROUP}" \
        --name "${app_name}" \
        --slot staging \
        --container-image-name "${full_image}" \
        --container-registry-url "https://${ACR_REGISTRY}" \
        --output none

    log_info "Waiting for staging slot to stabilize (30s)..."
    sleep 30

    # Health check on staging slot
    local slot_url="https://${app_name}-staging.azurewebsites.net"
    log_info "Health checking staging slot: ${slot_url}"

    if ! "${SCRIPT_DIR}/health-check.sh" --url "${slot_url}" --retries 12 --timeout 10; then
        log_error "Health check failed on staging slot with version ${image_tag}"
        log_error "Staging slot has the attempted rollback version, but production is unaffected."
        exit 1
    fi

    # Swap to production
    if [[ "${ENVIRONMENT}" == "production" ]]; then
        log_info "Swapping staging -> production..."
        az webapp deployment slot swap \
            --resource-group "${RESOURCE_GROUP}" \
            --name "${app_name}" \
            --slot staging \
            --target-slot production \
            --output none
    fi

    log_success "Rollback to version ${image_tag} completed"
}

# ─── Verify Rollback ────────────────────────────────────────────────────────
verify_rollback() {
    log_step "Verifying Rollback"

    local health_url="${APP_URL}"
    if [[ "${SERVICE}" == "admin" ]]; then
        health_url="https://${ADMIN_APP_NAME}.azurewebsites.net"
    fi

    log_info "Running health check: ${health_url}"

    if "${SCRIPT_DIR}/health-check.sh" --url "${health_url}" --retries 10 --timeout 10; then
        log_success "Service is healthy after rollback"
        return 0
    else
        log_error "Service health check failed after rollback!"
        log_error "Manual intervention may be required."
        return 1
    fi
}

# ─── Main ────────────────────────────────────────────────────────────────────
main() {
    local start_time
    start_time=$(date +%s)

    echo -e "\n${BOLD}D Block Workspace - Rollback${NC}\n"

    parse_args "$@"
    validate_args
    load_env_config

    # Check Azure login
    if ! az account show &>/dev/null; then
        log_error "Not logged in to Azure. Run 'az login' first."
        exit 1
    fi

    # Determine the app name
    local target_app
    if [[ "${SERVICE}" == "backend" ]]; then
        target_app="${BACKEND_APP_NAME}"
    else
        target_app="${ADMIN_APP_NAME}"
    fi

    # Execute rollback strategy
    if [[ -n "${ROLLBACK_VERSION}" ]]; then
        rollback_to_version "${target_app}" "${ROLLBACK_VERSION}"
    else
        rollback_slot_swap "${target_app}"
    fi

    # Verify
    verify_rollback

    # Summary
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo ""
    echo -e "${BOLD}════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}${BOLD}  ROLLBACK COMPLETED${NC}"
    echo -e "${BOLD}════════════════════════════════════════════════════${NC}"
    echo -e "  Environment: ${BOLD}${ENVIRONMENT}${NC}"
    echo -e "  Service:     ${BOLD}${SERVICE}${NC}"
    if [[ -n "${ROLLBACK_VERSION}" ]]; then
        echo -e "  Version:     ${BOLD}${ROLLBACK_VERSION}${NC}"
    else
        echo -e "  Strategy:    ${BOLD}Slot swap${NC}"
    fi
    echo -e "  Duration:    ${BOLD}${duration}s${NC}"
    echo -e "${BOLD}════════════════════════════════════════════════════${NC}"
    echo ""
}

main "$@"
