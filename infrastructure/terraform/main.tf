# =============================================================================
# D Block Workspace - Main Terraform Configuration
# =============================================================================
# This configuration provisions all Azure infrastructure for the D Block
# coworking management platform.
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Remote backend using Azure Storage
  # Configure via backend-config flags or backend config file:
  #   terraform init \
  #     -backend-config="resource_group_name=dblock-tfstate-rg" \
  #     -backend-config="storage_account_name=dblocktfstate" \
  #     -backend-config="container_name=tfstate" \
  #     -backend-config="key=dblock-${environment}.tfstate"
  backend "azurerm" {}
}

# -----------------------------------------------------------------------------
# Azure Provider
# -----------------------------------------------------------------------------
provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }

    resource_group {
      prevent_deletion_if_contains_resources = true
    }
  }
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------
data "azurerm_client_config" "current" {}

data "azurerm_subscription" "current" {}

# -----------------------------------------------------------------------------
# Resource Group
# -----------------------------------------------------------------------------
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location
  tags     = local.common_tags
}

# -----------------------------------------------------------------------------
# Random Password Generation
# -----------------------------------------------------------------------------
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
  min_lower        = 4
  min_upper        = 4
  min_numeric      = 4
  min_special      = 2
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

resource "random_password" "jwt_refresh_secret" {
  length  = 64
  special = false
}

# -----------------------------------------------------------------------------
# Local Values
# -----------------------------------------------------------------------------
locals {
  common_tags = merge(var.tags, {
    environment = var.environment
    project     = var.project_name
    managed_by  = "terraform"
  })

  is_production = var.environment == "production"

  # Naming convention helpers
  name_prefix = "${var.project_name}-${var.environment}"

  # Backend app URL
  backend_url = "https://${azurerm_linux_web_app.backend.default_hostname}"
  admin_url   = "https://${azurerm_linux_web_app.admin.default_hostname}"
}
