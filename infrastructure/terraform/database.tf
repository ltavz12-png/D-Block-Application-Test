# =============================================================================
# D Block Workspace - Azure Database for PostgreSQL Flexible Server
# =============================================================================

# -----------------------------------------------------------------------------
# Private DNS Zone for PostgreSQL
# -----------------------------------------------------------------------------
resource "azurerm_private_dns_zone" "postgresql" {
  name                = "${local.name_prefix}.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgresql" {
  name                  = "${local.name_prefix}-pg-dns-link"
  private_dns_zone_name = azurerm_private_dns_zone.postgresql.name
  resource_group_name   = azurerm_resource_group.main.name
  virtual_network_id    = azurerm_virtual_network.main.id
  registration_enabled  = false
  tags                  = local.common_tags
}

# -----------------------------------------------------------------------------
# PostgreSQL Flexible Server
# -----------------------------------------------------------------------------
resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "${local.name_prefix}-pgserver"
  resource_group_name           = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
  version                       = "16"
  administrator_login           = var.db_admin_username
  administrator_password        = random_password.db_password.result
  sku_name                      = var.db_sku_name
  storage_mb                    = var.db_storage_mb
  backup_retention_days         = local.is_production ? 35 : 7
  geo_redundant_backup_enabled  = local.is_production
  zone                          = "1"
  delegated_subnet_id           = azurerm_subnet.database.id
  private_dns_zone_id           = azurerm_private_dns_zone.postgresql.id
  public_network_access_enabled = false

  dynamic "high_availability" {
    for_each = local.is_production ? [1] : []
    content {
      mode                      = "ZoneRedundant"
      standby_availability_zone = "2"
    }
  }

  authentication {
    active_directory_auth_enabled = false
    password_auth_enabled         = true
  }

  tags = local.common_tags

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      # Ignore zone changes that may occur during maintenance
      zone,
    ]
  }

  depends_on = [
    azurerm_private_dns_zone_virtual_network_link.postgresql
  ]
}

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "dblock_${var.environment}"
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"

  lifecycle {
    prevent_destroy = true
  }
}

# -----------------------------------------------------------------------------
# Server Configuration Parameters
# -----------------------------------------------------------------------------
resource "azurerm_postgresql_flexible_server_configuration" "require_secure_transport" {
  name      = "require_secure_transport"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "ON"
}

resource "azurerm_postgresql_flexible_server_configuration" "log_connections" {
  name      = "log_connections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "ON"
}

resource "azurerm_postgresql_flexible_server_configuration" "log_disconnections" {
  name      = "log_disconnections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "ON"
}

resource "azurerm_postgresql_flexible_server_configuration" "log_checkpoints" {
  name      = "log_checkpoints"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "ON"
}

resource "azurerm_postgresql_flexible_server_configuration" "connection_throttling" {
  name      = "connection_throttle.enable"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "ON"
}

# Enable pgcrypto and uuid-ossp extensions
resource "azurerm_postgresql_flexible_server_configuration" "extensions" {
  name      = "azure.extensions"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "PG_TRGM,UUID-OSSP,PGCRYPTO"
}

# -----------------------------------------------------------------------------
# Firewall Rule - Allow Azure Services
# Note: This is used for non-VNet integrated services that need DB access.
# When using private endpoints, this can be restricted further.
# -----------------------------------------------------------------------------
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
