# =============================================================================
# D Block Workspace - Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# Resource Group
# -----------------------------------------------------------------------------
output "resource_group_name" {
  description = "Name of the Azure resource group"
  value       = azurerm_resource_group.main.name
}

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------
output "postgresql_fqdn" {
  description = "Fully qualified domain name of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "postgresql_database_name" {
  description = "Name of the PostgreSQL database"
  value       = azurerm_postgresql_flexible_server_database.main.name
}

# -----------------------------------------------------------------------------
# Redis
# -----------------------------------------------------------------------------
output "redis_hostname" {
  description = "Hostname of the Azure Cache for Redis instance"
  value       = azurerm_redis_cache.main.hostname
}

output "redis_primary_key" {
  description = "Primary access key for Redis"
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
}

# -----------------------------------------------------------------------------
# App Service
# -----------------------------------------------------------------------------
output "app_service_default_hostname" {
  description = "Default hostname of the backend API App Service"
  value       = azurerm_linux_web_app.backend.default_hostname
}

output "admin_app_default_hostname" {
  description = "Default hostname of the admin panel App Service"
  value       = azurerm_linux_web_app.admin.default_hostname
}

# -----------------------------------------------------------------------------
# Container Registry
# -----------------------------------------------------------------------------
output "container_registry_login_server" {
  description = "Login server URL of the Azure Container Registry"
  value       = azurerm_container_registry.main.login_server
}

# -----------------------------------------------------------------------------
# Key Vault
# -----------------------------------------------------------------------------
output "key_vault_uri" {
  description = "URI of the Azure Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

# -----------------------------------------------------------------------------
# Monitoring
# -----------------------------------------------------------------------------
output "application_insights_instrumentation_key" {
  description = "Instrumentation key for Application Insights"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

output "application_insights_connection_string" {
  description = "Connection string for Application Insights"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Storage
# -----------------------------------------------------------------------------
output "storage_account_name" {
  description = "Name of the Azure Storage Account"
  value       = azurerm_storage_account.main.name
}
