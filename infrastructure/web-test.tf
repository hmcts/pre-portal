resource "azurerm_application_insights_standard_web_test" "b2c" {
  name                    = "b2c-web-test"
  count                   = var.env == "prod" || var.env == "demo" ? 1 : 0
  resource_group_name     = "${var.product}-${var.env}"
  location                = data.azurerm_application_insights.app_insights.location
  application_insights_id = data.azurerm_application_insights.app_insights.id
  geo_locations           = ["emea-ru-msa-edge", "emea-se-sto-edge"]
  tags                    = var.common_tags
  enabled                 = true
  retry_enabled           = true


  request {
    url                      = var.web_test_url
    follow_redirects_enabled = true
  }

  validation_rules {
    content {
      content_match      = "Sign in"
      pass_if_text_found = true
    }
  }
}

resource "azurerm_monitor_metric_alert" "b2c_web_test_alert" {
  name                = "b2c_web_test_alert"
  count               = var.env == "prod" || var.env == "demo" ? 1 : 0
  resource_group_name = "${var.product}-${var.env}"
  scopes              = [data.azurerm_application_insights.app_insights.id]
  severity            = 4
  enabled             = true
  frequency           = "PT5M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "availabilityResults/availabilityPercentage"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 99
  }

  action {
    action_group_id = data.azurerm_monitor_action_group.action_group[count.index].id
  }
}
