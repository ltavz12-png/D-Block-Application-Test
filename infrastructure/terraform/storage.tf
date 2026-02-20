# =============================================================================
# D Block Workspace - Azure Blob Storage
# =============================================================================

# -----------------------------------------------------------------------------
# Storage Account
# -----------------------------------------------------------------------------
resource "azurerm_storage_account" "main" {
  # Storage account names: 3-24 chars, lowercase alphanumeric only
  name                     = replace("${local.name_prefix}stor", "-", "")
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = local.is_production ? "GRS" : "LRS"
  account_kind             = "StorageV2"
  access_tier              = "Hot"
  min_tls_version          = "TLS1_2"

  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = true
  https_traffic_only_enabled      = true

  blob_properties {
    versioning_enabled = local.is_production

    delete_retention_policy {
      days = local.is_production ? 30 : 7
    }

    container_delete_retention_policy {
      days = local.is_production ? 30 : 7
    }

    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "PUT", "POST", "DELETE", "HEAD"]
      allowed_origins    = [
        "https://${local.name_prefix}-admin.azurewebsites.net",
        "https://admin.${var.domain_name}",
      ]
      exposed_headers    = ["ETag", "Content-Length", "x-ms-request-id"]
      max_age_in_seconds = 3600
    }
  }

  network_rules {
    default_action             = local.is_production ? "Deny" : "Allow"
    bypass                     = ["AzureServices", "Logging", "Metrics"]
    virtual_network_subnet_ids = [azurerm_subnet.app.id]
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Blob Containers
# -----------------------------------------------------------------------------
resource "azurerm_storage_container" "invoices" {
  name                  = "invoices"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "exports" {
  name                  = "exports"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "backups" {
  name                  = "backups"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "user_uploads" {
  name                  = "user-uploads"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "email_templates" {
  name                  = "email-templates"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# -----------------------------------------------------------------------------
# Lifecycle Management Policy
# -----------------------------------------------------------------------------
resource "azurerm_storage_management_policy" "main" {
  storage_account_id = azurerm_storage_account.main.id

  # Invoices: move to cool after 30 days, archive after 90 days
  rule {
    name    = "invoices-lifecycle"
    enabled = true

    filters {
      prefix_match = ["invoices/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
      }
    }
  }

  # Exports: move to cool after 30 days, archive after 90, delete after 365
  rule {
    name    = "exports-lifecycle"
    enabled = true

    filters {
      prefix_match = ["exports/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
        delete_after_days_since_modification_greater_than          = 365
      }
    }
  }

  # Backups: move to cool after 30 days, archive after 90
  rule {
    name    = "backups-lifecycle"
    enabled = true

    filters {
      prefix_match = ["backups/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
      }
    }
  }

  # User uploads: move to cool after 30 days, archive after 90
  rule {
    name    = "user-uploads-lifecycle"
    enabled = true

    filters {
      prefix_match = ["user-uploads/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
      }
    }
  }
}

# -----------------------------------------------------------------------------
# Private Endpoint for Storage (production only)
# -----------------------------------------------------------------------------
resource "azurerm_private_endpoint" "storage" {
  count               = local.is_production ? 1 : 0
  name                = "${local.name_prefix}-storage-pe"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "${local.name_prefix}-storage-psc"
    private_connection_resource_id = azurerm_storage_account.main.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "storage-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.storage[0].id]
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Private DNS Zone for Storage (production only)
# -----------------------------------------------------------------------------
resource "azurerm_private_dns_zone" "storage" {
  count               = local.is_production ? 1 : 0
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "storage" {
  count                 = local.is_production ? 1 : 0
  name                  = "${local.name_prefix}-storage-dns-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.storage[0].name
  virtual_network_id    = azurerm_virtual_network.main.id
  registration_enabled  = false
  tags                  = local.common_tags
}
