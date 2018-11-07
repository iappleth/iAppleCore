package org.openbravo.event;

import javax.enterprise.event.Observes;

import org.apache.log4j.Logger;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.client.kernel.event.EntityNewEvent;
import org.openbravo.client.kernel.event.EntityPersistenceEventObserver;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.common.plm.ServicePriceRuleVersion;

public class ProductPriceRuleVersionEventHandler extends EntityPersistenceEventObserver {
  private static Entity[] entities = { ModelProvider.getInstance().getEntity(
      ServicePriceRuleVersion.ENTITY_NAME) };
  protected Logger logger = Logger.getLogger(this.getClass());

  @Override
  protected Entity[] getObservedEntities() {
    return entities;
  }

  public void onSave(@Observes EntityNewEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    final ServicePriceRuleVersion pcprv = (ServicePriceRuleVersion) event.getTargetInstance();
    linkProduct(event, pcprv);
  }

  private void linkProduct(EntityNewEvent event, ServicePriceRuleVersion pcprv) {
    final Product product = pcprv.getRelatedProductCategory() != null ? pcprv
        .getRelatedProductCategory().getProduct() : pcprv.getRelatedProduct().getProduct();

    if (product != null) {
      final Entity priceRuleVersionEntity = ModelProvider.getInstance().getEntity(
          ServicePriceRuleVersion.ENTITY_NAME);
      final Property priceRuleVersionProductProperty = priceRuleVersionEntity
          .getProperty(ServicePriceRuleVersion.PROPERTY_PRODUCT);
      event.setCurrentState(priceRuleVersionProductProperty, product);
    }
  }
}
