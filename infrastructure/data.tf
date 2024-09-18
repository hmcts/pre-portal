data "azurerm_monitor_action_group" "action_group" {
  count               = var.env == "prod" || var.env == "stg" ? 1 : 0
  name                = "CriticalAlertsAction"
  resource_group_name = "${var.product}-${var.env}"
}

data "azurerm_application_insights" "app_insights" {
  name                = "pre-${var.env}-appinsights"
  resource_group_name = "${var.product}-${var.env}"
}

