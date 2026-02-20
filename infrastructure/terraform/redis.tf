# =============================================================================
# D Block Workspace - Azure Cache for Redis
# =============================================================================

# -----------------------------------------------------------------------------
# Redis Cache
# -----------------------------------------------------------------------------
resource "azurerm_redis_cache" "main" {
  name                          = "${local.name_prefix}-redis"
  resource_group_name           = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
  capacity                      = var.redis_capacity
  family                        = var.redis_sku_name == "Premium" ? "P" : "C"
  sku_name                      = var.redis_sku_name
  minimum_tls_version           = "1.2"
  public_network_access_enabled = local.is_production ? false : true
  enable_non_ssl_port           = false
  redis_version                 = "6"

  redis_configuration {
    maxmemory_reserved              = var.redis_sku_name == "Basic" ? 2 : 10
    maxmemory_delta                 = var.redis_sku_name == "Basic" ? 2 : 10
    maxmemory_policy                = "allkeys-lru"
    maxfragmentationmemory_reserved = var.redis_sku_name == "Basic" ? 2 : 10
  }

  # Patch schedule - apply updates during low-traffic hours (Georgia time: UTC+4)
  dynamic "patch_schedule" {
    for_each = var.redis_sku_name != "Basic" ? [1] : []
    content {
      day_of_week    = "Sunday"
      start_hour_utc = 0 # 04:00 Georgia time
    }
  }

  tags = local.common_tags

  lifecycle {
    ignore_changes = [
      # Redis may update these settings during scaling
      redis_configuration[0].maxmemory_reserved,
      redis_configuration[0].maxmemory_delta,
      redis_configuration[0].maxfragmentationmemory_reserved,
    ]
  }
}

# -----------------------------------------------------------------------------
# Private Endpoint for Redis (production only)
# -----------------------------------------------------------------------------
resource "azurerm_private_endpoint" "redis" {
  count               = local.is_production ? 1 : 0
  name                = "${local.name_prefix}-redis-pe"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  subnet_id           = azurerm_subnet.redis.id

  private_service_connection {
    name                           = "${local.name_prefix}-redis-psc"
    private_connection_resource_id = azurerm_redis_cache.main.id
    subresource_names              = ["redisCache"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "redis-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.redis[0].id]
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Private DNS Zone for Redis (production only)
# -----------------------------------------------------------------------------
resource "azurerm_private_dns_zone" "redis" {
  count               = local.is_production ? 1 : 0
  name                = "privatelink.redis.cache.windows.net"
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "redis" {
  count                 = local.is_production ? 1 : 0
  name                  = "${local.name_prefix}-redis-dns-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.redis[0].name
  virtual_network_id    = azurerm_virtual_network.main.id
  registration_enabled  = false
  tags                  = local.common_tags
}
