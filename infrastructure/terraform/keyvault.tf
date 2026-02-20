# =============================================================================
# D Block Workspace - Azure Key Vault
# =============================================================================

# -----------------------------------------------------------------------------
# Key Vault
# -----------------------------------------------------------------------------
resource "azurerm_key_vault" "main" {
  name                        = "${local.name_prefix}-kv"
  resource_group_name         = azurerm_resource_group.main.name
  location                    = azurerm_resource_group.main.location
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "standard"
  soft_delete_retention_days  = 90
  purge_protection_enabled    = true
  enabled_for_disk_encryption = false
  enable_rbac_authorization   = false

  # Network ACL - restrict to VNet
  network_acls {
    bypass                     = "AzureServices"
    default_action             = "Deny"
    virtual_network_subnet_ids = [azurerm_subnet.app.id]
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Access Policies
# -----------------------------------------------------------------------------

# Terraform service principal access (for managing secrets)
resource "azurerm_key_vault_access_policy" "terraform" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  secret_permissions = [
    "Get",
    "List",
    "Set",
    "Delete",
    "Recover",
    "Backup",
    "Restore",
    "Purge",
  ]

  key_permissions = [
    "Get",
    "List",
    "Create",
    "Delete",
    "Recover",
  ]
}

# Backend App Service managed identity access
resource "azurerm_key_vault_access_policy" "backend" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_web_app.backend.identity[0].principal_id

  secret_permissions = [
    "Get",
    "List",
  ]
}

# Admin App Service managed identity access
resource "azurerm_key_vault_access_policy" "admin" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_web_app.admin.identity[0].principal_id

  secret_permissions = [
    "Get",
    "List",
  ]
}

# Backend staging slot managed identity access (production only)
resource "azurerm_key_vault_access_policy" "backend_staging_slot" {
  count        = local.is_production ? 1 : 0
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_web_app_slot.backend_staging[0].identity[0].principal_id

  secret_permissions = [
    "Get",
    "List",
  ]
}

# -----------------------------------------------------------------------------
# Secrets - Database
# -----------------------------------------------------------------------------
resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = random_password.db_password.result
  key_vault_id = azurerm_key_vault.main.id
  content_type = "Database administrator password"
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.terraform]
}

resource "azurerm_key_vault_secret" "db_connection_string" {
  name         = "db-connection-string"
  value        = "postgresql://${var.db_admin_username}:${random_password.db_password.result}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.main.name}?sslmode=require"
  key_vault_id = azurerm_key_vault.main.id
  content_type = "PostgreSQL connection string"
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.terraform]
}

# -----------------------------------------------------------------------------
# Secrets - Redis
# -----------------------------------------------------------------------------
resource "azurerm_key_vault_secret" "redis_password" {
  name         = "redis-password"
  value        = azurerm_redis_cache.main.primary_access_key
  key_vault_id = azurerm_key_vault.main.id
  content_type = "Redis primary access key"
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.terraform]
}

resource "azurerm_key_vault_secret" "redis_connection_string" {
  name         = "redis-connection-string"
  value        = "rediss://:${azurerm_redis_cache.main.primary_access_key}@${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port}"
  key_vault_id = azurerm_key_vault.main.id
  content_type = "Redis connection string (TLS)"
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.terraform]
}

# -----------------------------------------------------------------------------
# Secrets - JWT
# -----------------------------------------------------------------------------
resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = random_password.jwt_secret.result
  key_vault_id = azurerm_key_vault.main.id
  content_type = "JWT signing secret"
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.terraform]
}

resource "azurerm_key_vault_secret" "jwt_refresh_secret" {
  name         = "jwt-refresh-secret"
  value        = random_password.jwt_refresh_secret.result
  key_vault_id = azurerm_key_vault.main.id
  content_type = "JWT refresh token secret"
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.terraform]
}

# -----------------------------------------------------------------------------
# Secrets - Payment Providers
# -----------------------------------------------------------------------------
resource "azurerm_key_vault_secret" "bog_ipay_secret" {
  name         = "bog-ipay-secret"
  value        = "REPLACE_ME"
  key_vault_id = azurerm_key_vault.main.id
  content_type = "BOG iPay payment gateway secret"
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.terraform]

  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "tbc_tpay_secret" {
  name         = "tbc-tpay-secret"
  value        = "REPLACE_ME"
  key_vault_id = azurerm_key_vault.main.id
  content_type = "TBC TPay payment gateway secret"
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.terraform]

  lifecycle {
    ignore_changes = [value]
  }
}

# -----------------------------------------------------------------------------
# Secrets - External Services
# -----------------------------------------------------------------------------
resource "azurerm_key_vault_secret" "sendgrid_api_key" {
  name         = "sendgrid-api-key"
  value        = "REPLACE_ME"
  key_vault_id = azurerm_key_vault.main.id
  content_type = "SendGrid email API key"
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.terraform]

  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "saltoks_secret" {
  name         = "saltoks-secret"
  value        = "REPLACE_ME"
  key_vault_id = azurerm_key_vault.main.id
  content_type = "SaltoKS access control credentials"
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.terraform]

  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "sentry_dsn" {
  name         = "sentry-dsn"
  value        = "REPLACE_ME"
  key_vault_id = azurerm_key_vault.main.id
  content_type = "Sentry error tracking DSN"
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.terraform]

  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "bc_client_secret" {
  name         = "bc-client-secret"
  value        = "REPLACE_ME"
  key_vault_id = azurerm_key_vault.main.id
  content_type = "Business Central API client secret"
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.terraform]

  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "docusign_secret" {
  name         = "docusign-secret"
  value        = "REPLACE_ME"
  key_vault_id = azurerm_key_vault.main.id
  content_type = "DocuSign integration secret"
  tags         = local.common_tags

  depends_on = [azurerm_key_vault_access_policy.terraform]

  lifecycle {
    ignore_changes = [value]
  }
}
