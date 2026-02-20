# =============================================================================
# D Block Workspace - Variable Definitions
# =============================================================================

# -----------------------------------------------------------------------------
# General
# -----------------------------------------------------------------------------
variable "environment" {
  description = "Deployment environment (staging, production)"
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
  default     = "dblock"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,12}$", var.project_name))
    error_message = "Project name must be lowercase alphanumeric with hyphens, 2-13 characters."
  }
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "westeurope"
}

# -----------------------------------------------------------------------------
# Database - PostgreSQL Flexible Server
# -----------------------------------------------------------------------------
variable "db_sku_name" {
  description = "PostgreSQL Flexible Server SKU (B_Standard_B1ms for staging, GP_Standard_D2s_v3 for production)"
  type        = string
  default     = "B_Standard_B1ms"
}

variable "db_storage_mb" {
  description = "PostgreSQL storage size in megabytes"
  type        = number
  default     = 32768

  validation {
    condition     = var.db_storage_mb >= 32768
    error_message = "Database storage must be at least 32768 MB (32 GB)."
  }
}

variable "db_admin_username" {
  description = "PostgreSQL administrator username"
  type        = string
  default     = "dblockadmin"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{2,63}$", var.db_admin_username))
    error_message = "Database admin username must start with a letter and contain only alphanumeric characters or underscores."
  }
}

# -----------------------------------------------------------------------------
# Redis
# -----------------------------------------------------------------------------
variable "redis_sku_name" {
  description = "Azure Cache for Redis SKU (Basic for staging, Standard for production)"
  type        = string
  default     = "Basic"

  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.redis_sku_name)
    error_message = "Redis SKU must be Basic, Standard, or Premium."
  }
}

variable "redis_capacity" {
  description = "Azure Cache for Redis capacity (cache size). 0 = 250MB, 1 = 1GB, etc."
  type        = number
  default     = 0

  validation {
    condition     = var.redis_capacity >= 0 && var.redis_capacity <= 6
    error_message = "Redis capacity must be between 0 and 6."
  }
}

# -----------------------------------------------------------------------------
# App Service
# -----------------------------------------------------------------------------
variable "app_service_sku" {
  description = "App Service Plan SKU (B1 for staging, S1 or P1v3 for production)"
  type        = string
  default     = "B1"
}

variable "node_env" {
  description = "Node.js environment setting"
  type        = string
  default     = "production"
}

# -----------------------------------------------------------------------------
# Notifications & Domain
# -----------------------------------------------------------------------------
variable "admin_email" {
  description = "Administrator email address for alert notifications"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.admin_email))
    error_message = "Must be a valid email address."
  }
}

variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = "dblock.ge"
}

# -----------------------------------------------------------------------------
# Tags
# -----------------------------------------------------------------------------
variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default = {
    project = "dblock"
  }
}
