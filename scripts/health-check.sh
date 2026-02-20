#!/usr/bin/env bash
# ============================================================================
# D Block Workspace - Health Check Utility
# ============================================================================
# Checks the health of deployed services including API endpoint,
# database connectivity, and Redis connectivity.
#
# Usage:
#   ./scripts/health-check.sh --url https://dblock-api.azurewebsites.net
#   ./scripts/health-check.sh --url http://localhost:3000 --retries 5 --timeout 5
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

# ─── Default Values ─────────────────────────────────────────────────────────
HEALTH_URL=""
MAX_RETRIES=10
TIMEOUT=10
RETRY_INTERVAL=5
VERBOSE=false
CHECK_COMPONENTS=false

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

# ─── Usage ───────────────────────────────────────────────────────────────────
usage() {
    cat <<EOF
${BOLD}D Block Workspace - Health Check Utility${NC}

${BOLD}USAGE:${NC}
    $(basename "$0") --url <base-url> [OPTIONS]

${BOLD}REQUIRED:${NC}
    --url <url>         Base URL of the service (e.g., https://dblock-api.azurewebsites.net)

${BOLD}OPTIONS:${NC}
    --retries <n>       Maximum number of retries (default: 10)
    --timeout <s>       Connection timeout in seconds (default: 10)
    --interval <s>      Retry interval in seconds (default: 5)
    --verbose           Show detailed response bodies
    --check-components  Also check database and Redis via health endpoint
    -h, --help          Show this help message

${BOLD}EXIT CODES:${NC}
    0    All health checks passed
    1    Health check failed after all retries
    2    Invalid arguments

${BOLD}EXAMPLES:${NC}
    $(basename "$0") --url https://dblock-api.azurewebsites.net
    $(basename "$0") --url http://localhost:3000 --retries 5 --timeout 5
    $(basename "$0") --url https://dblock-api.azurewebsites.net --check-components --verbose
EOF
    exit 0
}

# ─── Parse Arguments ────────────────────────────────────────────────────────
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --url)
                HEALTH_URL="$2"
                shift 2
                ;;
            --retries)
                MAX_RETRIES="$2"
                shift 2
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --interval)
                RETRY_INTERVAL="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --check-components)
                CHECK_COMPONENTS=true
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
    if [[ -z "${HEALTH_URL}" ]]; then
        log_error "URL is required. Use --url <base-url>"
        exit 2
    fi

    # Strip trailing slash
    HEALTH_URL="${HEALTH_URL%/}"

    if ! [[ "${MAX_RETRIES}" =~ ^[0-9]+$ ]]; then
        log_error "Retries must be a positive integer"
        exit 2
    fi

    if ! [[ "${TIMEOUT}" =~ ^[0-9]+$ ]]; then
        log_error "Timeout must be a positive integer"
        exit 2
    fi
}

# ─── Check Health Endpoint ──────────────────────────────────────────────────
check_health_endpoint() {
    local endpoint="${HEALTH_URL}/api/v1/health"

    log_info "Checking: ${endpoint}"
    log_info "Retries: ${MAX_RETRIES}, Timeout: ${TIMEOUT}s, Interval: ${RETRY_INTERVAL}s"
    echo ""

    for i in $(seq 1 "${MAX_RETRIES}"); do
        local http_status
        local response_body
        local start_time
        local end_time
        local latency

        start_time=$(date +%s%N 2>/dev/null || date +%s)

        # Perform the request
        response_body=$(curl -s \
            --connect-timeout "${TIMEOUT}" \
            --max-time "$((TIMEOUT + 5))" \
            -w "\n%{http_code}" \
            "${endpoint}" 2>/dev/null) || response_body=$'\n000'

        end_time=$(date +%s%N 2>/dev/null || date +%s)

        # Extract HTTP status (last line)
        http_status=$(echo "${response_body}" | tail -1)
        response_body=$(echo "${response_body}" | sed '$d')

        # Calculate latency
        if [[ "${start_time}" =~ [0-9]{10,} ]]; then
            latency=$(( (end_time - start_time) / 1000000 ))
            latency="${latency}ms"
        else
            latency="--"
        fi

        # Parse response for status field
        local health_status=""
        if command -v jq &>/dev/null && [[ -n "${response_body}" ]]; then
            health_status=$(echo "${response_body}" | jq -r '.status // empty' 2>/dev/null || true)
        fi

        # Output attempt result
        if [[ "${http_status}" == "200" ]]; then
            if [[ "${health_status}" == "healthy" ]]; then
                echo -e "  ${GREEN}[${i}/${MAX_RETRIES}]${NC} HTTP ${http_status} - Status: ${GREEN}${health_status}${NC} - Latency: ${latency}"
            elif [[ "${health_status}" == "degraded" ]]; then
                echo -e "  ${YELLOW}[${i}/${MAX_RETRIES}]${NC} HTTP ${http_status} - Status: ${YELLOW}${health_status}${NC} - Latency: ${latency}"
            else
                echo -e "  ${GREEN}[${i}/${MAX_RETRIES}]${NC} HTTP ${http_status} - Latency: ${latency}"
            fi

            if [[ "${VERBOSE}" == "true" && -n "${response_body}" ]]; then
                if command -v jq &>/dev/null; then
                    echo "${response_body}" | jq '.' 2>/dev/null || echo "${response_body}"
                else
                    echo "${response_body}"
                fi
            fi

            echo ""
            log_success "Health check passed"

            # Optionally check individual components
            if [[ "${CHECK_COMPONENTS}" == "true" ]]; then
                check_components "${response_body}"
            fi

            return 0
        else
            echo -e "  ${RED}[${i}/${MAX_RETRIES}]${NC} HTTP ${http_status} - Latency: ${latency}"

            if [[ "${VERBOSE}" == "true" && -n "${response_body}" ]]; then
                echo "  Response: ${response_body}"
            fi
        fi

        # Wait before retrying (unless this is the last attempt)
        if [[ "${i}" -lt "${MAX_RETRIES}" ]]; then
            sleep "${RETRY_INTERVAL}"
        fi
    done

    echo ""
    log_error "Health check failed after ${MAX_RETRIES} attempts"
    return 1
}

# ─── Check Individual Components ────────────────────────────────────────────
check_components() {
    local response_body="$1"

    if ! command -v jq &>/dev/null; then
        log_warn "jq not installed, skipping component checks"
        return 0
    fi

    echo ""
    log_info "Component status:"

    # Database check
    local db_status
    db_status=$(echo "${response_body}" | jq -r '.checks.database.status // "unknown"' 2>/dev/null || echo "unknown")
    local db_latency
    db_latency=$(echo "${response_body}" | jq -r '.checks.database.latency_ms // "N/A"' 2>/dev/null || echo "N/A")

    if [[ "${db_status}" == "connected" ]]; then
        echo -e "  ${GREEN}[PASS]${NC} Database:  ${db_status} (${db_latency}ms)"
    else
        echo -e "  ${RED}[FAIL]${NC} Database:  ${db_status}"
    fi

    # Redis check
    local redis_status
    redis_status=$(echo "${response_body}" | jq -r '.checks.redis.status // "unknown"' 2>/dev/null || echo "unknown")
    local redis_latency
    redis_latency=$(echo "${response_body}" | jq -r '.checks.redis.latency_ms // "N/A"' 2>/dev/null || echo "N/A")

    if [[ "${redis_status}" == "connected" ]]; then
        echo -e "  ${GREEN}[PASS]${NC} Redis:     ${redis_status} (${redis_latency}ms)"
    else
        echo -e "  ${YELLOW}[WARN]${NC} Redis:     ${redis_status}"
    fi

    # Memory check
    local rss_mb
    rss_mb=$(echo "${response_body}" | jq -r '.checks.memory.rss_mb // "N/A"' 2>/dev/null || echo "N/A")
    local heap_used
    heap_used=$(echo "${response_body}" | jq -r '.checks.memory.heap_used_mb // "N/A"' 2>/dev/null || echo "N/A")
    local heap_total
    heap_total=$(echo "${response_body}" | jq -r '.checks.memory.heap_total_mb // "N/A"' 2>/dev/null || echo "N/A")

    echo -e "  ${BLUE}[INFO]${NC} Memory:    RSS=${rss_mb}MB, Heap=${heap_used}/${heap_total}MB"

    # Uptime and version
    local uptime
    uptime=$(echo "${response_body}" | jq -r '.uptime // "N/A"' 2>/dev/null || echo "N/A")
    local version
    version=$(echo "${response_body}" | jq -r '.version // "N/A"' 2>/dev/null || echo "N/A")
    local environment
    environment=$(echo "${response_body}" | jq -r '.environment // "N/A"' 2>/dev/null || echo "N/A")

    echo -e "  ${BLUE}[INFO]${NC} Version:   ${version}"
    echo -e "  ${BLUE}[INFO]${NC} Env:       ${environment}"
    echo -e "  ${BLUE}[INFO]${NC} Uptime:    ${uptime}s"

    # Check readiness endpoint
    echo ""
    local ready_url="${HEALTH_URL}/api/v1/health/ready"
    local ready_response
    ready_response=$(curl -s --connect-timeout "${TIMEOUT}" --max-time "$((TIMEOUT + 5))" "${ready_url}" 2>/dev/null || echo "{}")
    local ready_status
    ready_status=$(echo "${ready_response}" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")

    if [[ "${ready_status}" == "ready" ]]; then
        echo -e "  ${GREEN}[PASS]${NC} Readiness: ${ready_status}"
    else
        echo -e "  ${YELLOW}[WARN]${NC} Readiness: ${ready_status}"
    fi

    # Check liveness endpoint
    local live_url="${HEALTH_URL}/api/v1/health/live"
    local live_response
    live_response=$(curl -s --connect-timeout "${TIMEOUT}" --max-time "$((TIMEOUT + 5))" "${live_url}" 2>/dev/null || echo "{}")
    local live_status
    live_status=$(echo "${live_response}" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")

    if [[ "${live_status}" == "alive" ]]; then
        echo -e "  ${GREEN}[PASS]${NC} Liveness:  ${live_status}"
    else
        echo -e "  ${RED}[FAIL]${NC} Liveness:  ${live_status}"
    fi

    echo ""
}

# ─── Main ────────────────────────────────────────────────────────────────────
main() {
    parse_args "$@"
    validate_args

    echo -e "\n${BOLD}D Block Workspace - Health Check${NC}\n"

    check_health_endpoint
    local exit_code=$?

    exit "${exit_code}"
}

main "$@"
