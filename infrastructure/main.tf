provider "azurerm" {
  features {}
}

data "azurerm_key_vault" "key_vault" {
  name                = "${var.product}-hmctskv-${var.env}"
  resource_group_name = "${var.product}-${var.env}"
}

module "pre-portal-redis6" {
  source                        = "git@github.com:hmcts/cnp-module-redis?ref=4.x"
  product                       = var.product
  name                          = "${var.product}-${var.component}-${var.env}"
  location                      = var.location
  env                           = var.env
  private_endpoint_enabled      = true
  redis_version                 = "6"
  business_area                 = "sds"
  public_network_access_enabled = false
  common_tags                   = var.common_tags
  sku_name                      = var.sku_name
  family                        = var.family
  capacity                      = var.capacity
  data_persistence_authentication_method = var.data_persistence_authentication_method
}

resource "azurerm_key_vault_secret" "redis6_access_key" {
  name         = "redis6-access-key"
  value        = module.pre-portal-redis6.access_key
  key_vault_id = data.azurerm_key_vault.key_vault.id
}
