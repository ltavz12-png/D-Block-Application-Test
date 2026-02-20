# =============================================================================
# D Block Workspace - Azure Monitor + Application Insights
# =============================================================================

# -----------------------------------------------------------------------------
# Log Analytics Workspace
# -----------------------------------------------------------------------------
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${local.name_prefix}-law"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = local.is_production ? 90 : 30

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Application Insights
# -----------------------------------------------------------------------------
resource "azurerm_application_insights" "main" {
  name                = "${local.name_prefix}-appinsights"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "Node.JS"
  retention_in_days   = local.is_production ? 90 : 30
  sampling_percentage = local.is_production ? 50 : 100

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Diagnostic Settings - App Service (Backend)
# -----------------------------------------------------------------------------
resource "azurerm_monitor_diagnostic_setting" "backend" {
  name                       = "${local.name_prefix}-backend-diag"
  target_resource_id         = azurerm_linux_web_app.backend.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "AppServiceHTTPLogs"
  }

  enabled_log {
    category = "AppServiceConsoleLogs"
  }

  enabled_log {
    category = "AppServiceAppLogs"
  }

  enabled_log {
    category = "AppServicePlatformLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# -----------------------------------------------------------------------------
# Diagnostic Settings - App Service (Admin)
# -----------------------------------------------------------------------------
resource "azurerm_monitor_diagnostic_setting" "admin" {
  name                       = "${local.name_prefix}-admin-diag"
  target_resource_id         = azurerm_linux_web_app.admin.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "AppServiceHTTPLogs"
  }

  enabled_log {
    category = "AppServiceConsoleLogs"
  }

  enabled_log {
    category = "AppServiceAppLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# -----------------------------------------------------------------------------
# Diagnostic Settings - PostgreSQL
# -----------------------------------------------------------------------------
resource "azurerm_monitor_diagnostic_setting" "postgresql" {
  name                       = "${local.name_prefix}-pg-diag"
  target_resource_id         = azurerm_postgresql_flexible_server.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "PostgreSQLLogs"
  }

  enabled_log {
    category = "PostgreSQLFlexSessions"
  }

  enabled_log {
    category = "PostgreSQLFlexQueryStoreRuntime"
  }

  enabled_log {
    category = "PostgreSQLFlexQueryStoreWaitStats"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# -----------------------------------------------------------------------------
# Diagnostic Settings - Redis
# -----------------------------------------------------------------------------
resource "azurerm_monitor_diagnostic_setting" "redis" {
  name                       = "${local.name_prefix}-redis-diag"
  target_resource_id         = azurerm_redis_cache.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "ConnectedClientList"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# -----------------------------------------------------------------------------
# Action Group - Alert Notifications
# -----------------------------------------------------------------------------
resource "azurerm_monitor_action_group" "critical" {
  name                = "${local.name_prefix}-critical-ag"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "dblkcrit"
  enabled             = true

  email_receiver {
    name                    = "admin-email"
    email_address           = var.admin_email
    use_common_alert_schema = true
  }

  # Webhook for external integrations (e.g., Slack, PagerDuty)
  dynamic "webhook_receiver" {
    for_each = local.is_production ? [1] : []
    content {
      name                    = "ops-webhook"
      service_uri             = "https://hooks.slack.com/services/PLACEHOLDER"
      use_common_alert_schema = true
    }
  }

  tags = local.common_tags
}

resource "azurerm_monitor_action_group" "warning" {
  name                = "${local.name_prefix}-warning-ag"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "dblkwarn"
  enabled             = true

  email_receiver {
    name                    = "admin-email"
    email_address           = var.admin_email
    use_common_alert_schema = true
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Alert Rule - High CPU Usage
# -----------------------------------------------------------------------------
resource "azurerm_monitor_metric_alert" "high_cpu" {
  name                = "${local.name_prefix}-high-cpu-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_service_plan.main.id]
  description         = "Alert when average CPU exceeds 80% for 5 minutes"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.Web/serverfarms"
    metric_name      = "CpuPercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.critical.id
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Alert Rule - High Memory Usage
# -----------------------------------------------------------------------------
resource "azurerm_monitor_metric_alert" "high_memory" {
  name                = "${local.name_prefix}-high-memory-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_service_plan.main.id]
  description         = "Alert when average memory exceeds 85% for 5 minutes"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.Web/serverfarms"
    metric_name      = "MemoryPercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 85
  }

  action {
    action_group_id = azurerm_monitor_action_group.critical.id
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Alert Rule - HTTP 5xx Errors
# -----------------------------------------------------------------------------
resource "azurerm_monitor_metric_alert" "http_5xx" {
  name                = "${local.name_prefix}-http-5xx-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_web_app.backend.id]
  description         = "Alert when 5xx errors exceed 10 in 5 minutes"
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT5M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "Http5xx"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 10
  }

  action {
    action_group_id = azurerm_monitor_action_group.critical.id
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Alert Rule - Slow Response Time
# -----------------------------------------------------------------------------
resource "azurerm_monitor_metric_alert" "slow_response" {
  name                = "${local.name_prefix}-slow-response-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_web_app.backend.id]
  description         = "Alert when average response time exceeds 5 seconds for 5 minutes"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "HttpResponseTime"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 5
  }

  action {
    action_group_id = azurerm_monitor_action_group.warning.id
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Alert Rule - Database Connection Pool Exhaustion
# -----------------------------------------------------------------------------
resource "azurerm_monitor_metric_alert" "db_connections" {
  name                = "${local.name_prefix}-db-connections-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_postgresql_flexible_server.main.id]
  description         = "Alert when active database connections exceed 80% of max"
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT5M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "active_connections"
    aggregation      = "Average"
    operator         = "GreaterThan"
    # B1ms = 50 max connections, GP_D2s_v3 = 859 max connections
    # Alert at ~80% of staging limit (conservative)
    threshold = local.is_production ? 680 : 40
  }

  action {
    action_group_id = azurerm_monitor_action_group.critical.id
  }

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Alert Rule - Redis Memory Usage
# -----------------------------------------------------------------------------
resource "azurerm_monitor_metric_alert" "redis_memory" {
  name                = "${local.name_prefix}-redis-memory-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_redis_cache.main.id]
  description         = "Alert when Redis server memory usage exceeds 80%"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.Cache/redis"
    metric_name      = "usedmemorypercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.warning.id
  }

  tags = local.common_tags
}
