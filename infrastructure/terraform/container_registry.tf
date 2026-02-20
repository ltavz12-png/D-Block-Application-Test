# =============================================================================
# D Block Workspace - Azure Container Registry
# =============================================================================

# -----------------------------------------------------------------------------
# Container Registry
# -----------------------------------------------------------------------------
resource "azurerm_container_registry" "main" {
  # ACR names: 5-50 chars, alphanumeric only
  name                = replace("${local.name_prefix}acr", "-", "")
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = local.is_production ? "Standard" : "Basic"
  admin_enabled       = true

  # Geo-replication (Standard/Premium SKU only, production only)
  dynamic "georeplications" {
    for_each = local.is_production ? ["northeurope"] : []
    content {
      location                = georeplications.value
      zone_redundancy_enabled = false
      tags                    = local.common_tags
    }
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Webhook - Auto-deploy backend to App Service on image push
# -----------------------------------------------------------------------------
resource "azurerm_container_registry_webhook" "backend_deploy" {
  name                = "${replace(local.name_prefix, "-", "")}backenddeploy"
  resource_group_name = azurerm_resource_group.main.name
  registry_name       = azurerm_container_registry.main.name
  location            = azurerm_resource_group.main.location
  service_uri         = "https://${azurerm_linux_web_app.backend.site_credential[0].name}:${azurerm_linux_web_app.backend.site_credential[0].password}@${azurerm_linux_web_app.backend.name}.scm.azurewebsites.net/api/registry/webhook"
  status              = "enabled"
  scope               = "${var.project_name}-backend:*"
  actions             = ["push"]
  custom_headers = {
    "Content-Type" = "application/json"
  }

  tags = local.common_tags
}
