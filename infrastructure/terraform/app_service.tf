# =============================================================================
# D Block Workspace - Azure App Service
# =============================================================================

# -----------------------------------------------------------------------------
# App Service Plan (Linux)
# -----------------------------------------------------------------------------
resource "azurerm_service_plan" "main" {
  name                = "${local.name_prefix}-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku

  # Zone redundancy for production with Standard or Premium SKUs
  zone_balancing_enabled = local.is_production && can(regex("^[SP]", var.app_service_sku))

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Backend API Web App
# -----------------------------------------------------------------------------
resource "azurerm_linux_web_app" "backend" {
  name                = "${local.name_prefix}-api"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true

  virtual_network_subnet_id = azurerm_subnet.app.id

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on                         = true
    ftps_state                        = "Disabled"
    health_check_path                 = "/api/v1/health"
    health_check_eviction_time_in_min = 5
    http2_enabled                     = true
    minimum_tls_version               = "1.2"
    vnet_route_all_enabled            = true

    application_stack {
      docker_registry_url      = "https://${azurerm_container_registry.main.login_server}"
      docker_registry_username = azurerm_container_registry.main.admin_username
      docker_registry_password = azurerm_container_registry.main.admin_password
      docker_image_name        = "${var.project_name}-backend:latest"
    }

    cors {
      allowed_origins = [
        "https://${local.name_prefix}-admin.azurewebsites.net",
        "https://admin.${var.domain_name}",
        "https://${var.domain_name}",
      ]
      support_credentials = true
    }
  }

  app_settings = {
    # Node.js configuration
    NODE_ENV                    = var.node_env
    PORT                        = "8080"
    WEBSITES_PORT               = "8080"
    API_PREFIX                  = "api/v1"
    WEBSITE_WEBDEPLOY_USE_SCM   = "false"

    # Docker / Container settings
    DOCKER_ENABLE_CI                     = "true"
    WEBSITES_ENABLE_APP_SERVICE_STORAGE  = "false"
    DOCKER_REGISTRY_SERVER_URL           = "https://${azurerm_container_registry.main.login_server}"
    DOCKER_REGISTRY_SERVER_USERNAME      = azurerm_container_registry.main.admin_username
    DOCKER_REGISTRY_SERVER_PASSWORD      = azurerm_container_registry.main.admin_password

    # Database - Key Vault references
    DB_HOST     = azurerm_postgresql_flexible_server.main.fqdn
    DB_PORT     = "5432"
    DB_USERNAME = var.db_admin_username
    DB_PASSWORD = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.db_password.versionless_id})"
    DB_NAME     = azurerm_postgresql_flexible_server_database.main.name
    DB_SSL      = "true"

    # Redis
    REDIS_HOST     = azurerm_redis_cache.main.hostname
    REDIS_PORT     = azurerm_redis_cache.main.ssl_port
    REDIS_PASSWORD = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.redis_password.versionless_id})"
    REDIS_TLS      = "true"

    # JWT - Key Vault references
    JWT_SECRET            = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.jwt_secret.versionless_id})"
    JWT_EXPIRATION        = "15m"
    JWT_REFRESH_SECRET    = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.jwt_refresh_secret.versionless_id})"
    JWT_REFRESH_EXPIRATION = "7d"

    # Application URLs
    APP_URL   = "https://${local.name_prefix}-api.azurewebsites.net"
    ADMIN_URL = "https://${local.name_prefix}-admin.azurewebsites.net"

    # External services - Key Vault references
    SENDGRID_API_KEY  = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.sendgrid_api_key.versionless_id})"
    BOG_IPAY_SECRET   = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.bog_ipay_secret.versionless_id})"
    TBC_TPAY_SECRET   = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.tbc_tpay_secret.versionless_id})"
    SALTOKS_SECRET    = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.saltoks_secret.versionless_id})"
    BC_CLIENT_SECRET  = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.bc_client_secret.versionless_id})"
    DOCUSIGN_SECRET   = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.docusign_secret.versionless_id})"

    # Monitoring
    APPINSIGHTS_INSTRUMENTATIONKEY             = azurerm_application_insights.main.instrumentation_key
    APPLICATIONINSIGHTS_CONNECTION_STRING       = azurerm_application_insights.main.connection_string
    ApplicationInsightsAgent_EXTENSION_VERSION  = "~3"

    # Sentry - Key Vault reference
    SENTRY_DSN = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.sentry_dsn.versionless_id})"

    # Storage
    AZURE_STORAGE_ACCOUNT_NAME = azurerm_storage_account.main.name
    AZURE_STORAGE_CONNECTION   = azurerm_storage_account.main.primary_connection_string
  }

  logs {
    detailed_error_messages = true
    failed_request_tracing  = true

    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }

    application_logs {
      file_system_level = "Information"
    }
  }

  tags = local.common_tags

  lifecycle {
    ignore_changes = [
      # Ignore changes made by CI/CD deployment
      site_config[0].application_stack[0].docker_image_name,
    ]
  }
}

# -----------------------------------------------------------------------------
# Admin Panel Web App
# -----------------------------------------------------------------------------
resource "azurerm_linux_web_app" "admin" {
  name                = "${local.name_prefix}-admin"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on           = true
    ftps_state          = "Disabled"
    http2_enabled       = true
    minimum_tls_version = "1.2"

    application_stack {
      node_version = "20-lts"
    }
  }

  app_settings = {
    NODE_ENV                                    = var.node_env
    NEXT_PUBLIC_API_URL                         = "https://${local.name_prefix}-api.azurewebsites.net/api/v1"
    APPINSIGHTS_INSTRUMENTATIONKEY              = azurerm_application_insights.main.instrumentation_key
    APPLICATIONINSIGHTS_CONNECTION_STRING        = azurerm_application_insights.main.connection_string
    ApplicationInsightsAgent_EXTENSION_VERSION   = "~3"
    WEBSITE_WEBDEPLOY_USE_SCM                   = "false"
  }

  logs {
    detailed_error_messages = true
    failed_request_tracing  = true

    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Deployment Slots (Production only)
# -----------------------------------------------------------------------------
resource "azurerm_linux_web_app_slot" "backend_staging" {
  count          = local.is_production ? 1 : 0
  name           = "staging"
  app_service_id = azurerm_linux_web_app.backend.id
  https_only     = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on                         = true
    ftps_state                        = "Disabled"
    health_check_path                 = "/api/v1/health"
    health_check_eviction_time_in_min = 5
    http2_enabled                     = true
    minimum_tls_version               = "1.2"

    application_stack {
      docker_registry_url      = "https://${azurerm_container_registry.main.login_server}"
      docker_registry_username = azurerm_container_registry.main.admin_username
      docker_registry_password = azurerm_container_registry.main.admin_password
      docker_image_name        = "${var.project_name}-backend:staging"
    }
  }

  app_settings = azurerm_linux_web_app.backend.app_settings

  tags = local.common_tags
}

resource "azurerm_linux_web_app_slot" "admin_staging" {
  count          = local.is_production ? 1 : 0
  name           = "staging"
  app_service_id = azurerm_linux_web_app.admin.id
  https_only     = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on           = true
    ftps_state          = "Disabled"
    http2_enabled       = true
    minimum_tls_version = "1.2"

    application_stack {
      node_version = "20-lts"
    }
  }

  app_settings = azurerm_linux_web_app.admin.app_settings

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Custom Domain + Managed Certificate (Uncomment when DNS is configured)
# -----------------------------------------------------------------------------
# To enable custom domains:
# 1. Add a CNAME record pointing to the App Service default hostname
# 2. Uncomment the blocks below
# 3. Run terraform apply

# resource "azurerm_app_service_custom_hostname_binding" "backend" {
#   hostname            = "api.${var.domain_name}"
#   app_service_name    = azurerm_linux_web_app.backend.name
#   resource_group_name = azurerm_resource_group.main.name
# }
#
# resource "azurerm_app_service_managed_certificate" "backend" {
#   custom_hostname_binding_id = azurerm_app_service_custom_hostname_binding.backend.id
# }
#
# resource "azurerm_app_service_certificate_binding" "backend" {
#   hostname_binding_id = azurerm_app_service_custom_hostname_binding.backend.id
#   certificate_id      = azurerm_app_service_managed_certificate.backend.id
#   ssl_state           = "SniEnabled"
# }
#
# resource "azurerm_app_service_custom_hostname_binding" "admin" {
#   hostname            = "admin.${var.domain_name}"
#   app_service_name    = azurerm_linux_web_app.admin.name
#   resource_group_name = azurerm_resource_group.main.name
# }
#
# resource "azurerm_app_service_managed_certificate" "admin" {
#   custom_hostname_binding_id = azurerm_app_service_custom_hostname_binding.admin.id
# }
#
# resource "azurerm_app_service_certificate_binding" "admin" {
#   hostname_binding_id = azurerm_app_service_custom_hostname_binding.admin.id
#   certificate_id      = azurerm_app_service_managed_certificate.admin.id
#   ssl_state           = "SniEnabled"
# }
