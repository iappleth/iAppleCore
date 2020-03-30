/*
 ************************************************************************************
 * Copyright (C) 2012-2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import java.util.Iterator;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.mobile.core.process.DataSynchronizationImportProcess;
import org.openbravo.mobile.core.process.DataSynchronizationProcess.DataSynchronization;
import org.openbravo.mobile.core.process.JSONPropertyToEntity;
import org.openbravo.mobile.core.utils.OBMOBCUtils;
import org.openbravo.model.common.businesspartner.BusinessPartner;
import org.openbravo.model.common.businesspartner.Location;
import org.openbravo.model.common.geography.Country;
import org.openbravo.service.db.DalConnectionProvider;
import org.openbravo.service.json.JsonConstants;

@DataSynchronization(entity = "BusinessPartnerLocation")
public class CustomerAddrLoader extends POSDataSynchronizationProcess
    implements DataSynchronizationImportProcess {

  private static final Logger log = LogManager.getLogger();

  @Inject
  @Any
  private Instance<CustomerAddrCreationHook> customerAddrCreations;

  @Inject
  @Any
  private Instance<CustomerAddrAfterCreationHook> customerAddAfterrCreations;

  @Override
  protected String getImportQualifier() {
    return "BusinessPartnerLocation";
  }

  @Override
  public JSONObject saveRecord(JSONObject jsonCustomerAddr) throws Exception {
    OBContext.setAdminMode(false);
    try {
      Location location = null;
      BusinessPartner customer = OBDal.getInstance()
          .get(BusinessPartner.class, jsonCustomerAddr.getString("bpartner"));
      location = getCustomerAddress(jsonCustomerAddr.getString("id"));

      if (location.getId() == null) {
        location = createBPartnerAddr(customer, jsonCustomerAddr);
      } else {
        final String loaded = jsonCustomerAddr.has("loaded") ? jsonCustomerAddr.getString("loaded")
            : null;
        final String updated = OBMOBCUtils.convertToUTCDateComingFromServer(location.getUpdated());

        if (loaded != null && loaded.compareTo(updated) < 0) {
          log.warn(Utility.messageBD(new DalConnectionProvider(false), "OBPOS_outdatedbpl",
              OBContext.getOBContext().getLanguage().getLanguage()));
        }
        location = editBPartnerAddr(customer, location, jsonCustomerAddr);
      }

      executeAddrHooks(customerAddrCreations, jsonCustomerAddr, customer, location);

      OBDal.getInstance().flush();

      executeAddrAfterCreationHooks(customerAddAfterrCreations, jsonCustomerAddr, customer,
          location);

    } finally {
      OBContext.restorePreviousMode();
    }
    final JSONObject jsonResponse = new JSONObject();
    jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
    jsonResponse.put("result", "0");

    return jsonResponse;
  }

  private Location getCustomerAddress(String id) {
    Location location = OBDal.getInstance().get(Location.class, id);
    if (location != null) {
      return location;
    }
    return new Location();
  }

  private Location createBPartnerAddr(BusinessPartner customer, JSONObject jsonCustomerAddr)
      throws JSONException {
    Location newLocation = OBProvider.getInstance().get(Location.class);
    try {
      Entity locationEntity = ModelProvider.getInstance().getEntity(Location.class);
      Entity baseLocationEntity = ModelProvider.getInstance()
          .getEntity(org.openbravo.model.common.geography.Location.class);
      final org.openbravo.model.common.geography.Location rootLocation = OBProvider.getInstance()
          .get(org.openbravo.model.common.geography.Location.class);

      JSONPropertyToEntity.fillBobFromJSON(baseLocationEntity, rootLocation, jsonCustomerAddr);

      if (jsonCustomerAddr.has("name") && jsonCustomerAddr.getString("name") != null) {
        if (jsonCustomerAddr.getString("name").equals("")) {
          rootLocation.setAddressLine1(null);
        } else {
          rootLocation.setAddressLine1(jsonCustomerAddr.getString("name"));
        }
      }

      if (jsonCustomerAddr.has("countryId")) {
        rootLocation.setCountry(
            OBDal.getInstance().get(Country.class, jsonCustomerAddr.getString("countryId")));
      } else {
        String errorMessage = "Country ID is a mandatory field to create a new customer address from Web Pos";
        log.error(errorMessage);
        throw new OBException(errorMessage, null);
      }

      rootLocation.setPostalCode(jsonCustomerAddr.getString("postalCode"));
      rootLocation.setCityName(jsonCustomerAddr.getString("cityName"));
      OBDal.getInstance().save(rootLocation);

      JSONPropertyToEntity.fillBobFromJSON(locationEntity, newLocation, jsonCustomerAddr);

      if (jsonCustomerAddr.has("id")) {
        newLocation.setId(jsonCustomerAddr.getString("id"));
      } else {
        String errorMessage = "Business partner Location ID is a mandatory field to create a new customer address from Web Pos";
        log.error(errorMessage);
        throw new OBException(errorMessage, null);
      }
      if (jsonCustomerAddr.has("name") && jsonCustomerAddr.getString("name") != null) {
        if (!jsonCustomerAddr.getString("name").equals("")) {
          newLocation.setName(jsonCustomerAddr.getString("name"));
        } else {
          String posibleName = jsonCustomerAddr.getString("customerName")
              + jsonCustomerAddr.getString("id").trim();
          if (posibleName.length() > 59) {
            posibleName = posibleName.substring(0, 59);
          }
          newLocation.setName(posibleName);
        }
      } else {
        String errorMessage = "Business partner Location Name is a mandatory field to create a new customer address from Web Pos";
        log.error(errorMessage);
        throw new OBException(errorMessage, null);
      }
      newLocation.setInvoiceToAddress(jsonCustomerAddr.getBoolean("isBillTo"));
      newLocation.setShipToAddress(jsonCustomerAddr.getBoolean("isShipTo"));
      newLocation.setBusinessPartner(customer);
      newLocation.setLocationAddress(rootLocation);
      newLocation.setNewOBObject(true);
      OBDal.getInstance().save(newLocation);

    } catch (final Exception e) {
      log.error("Exception while creating BPartner Address", e);
    }

    return newLocation;
  }

  private Location editBPartnerAddr(BusinessPartner customer, Location location,
      JSONObject jsonCustomerAddr) throws JSONException {
    try {
      if (location != null) {
        final org.openbravo.model.common.geography.Location rootLocation = location
            .getLocationAddress();

        if (jsonCustomerAddr.has("name") && jsonCustomerAddr.getString("name") != null) {
          if (jsonCustomerAddr.getString("name").equals("")) {
            rootLocation.setAddressLine1(null);
          } else {
            rootLocation.setAddressLine1(jsonCustomerAddr.getString("name"));
          }
        }
        rootLocation.setPostalCode(jsonCustomerAddr.getString("postalCode"));
        rootLocation.setCityName(jsonCustomerAddr.getString("cityName"));
        rootLocation.setCountry(
            OBDal.getInstance().get(Country.class, jsonCustomerAddr.getString("countryId")));
        location.setInvoiceToAddress(jsonCustomerAddr.getBoolean("isBillTo"));
        location.setShipToAddress(jsonCustomerAddr.getBoolean("isShipTo"));
        Entity baseLocationEntity = ModelProvider.getInstance()
            .getEntity(org.openbravo.model.common.geography.Location.class);
        JSONPropertyToEntity.fillBobFromJSON(baseLocationEntity, rootLocation, jsonCustomerAddr);

        Entity bpLocationEntity = ModelProvider.getInstance().getEntity(Location.class);
        JSONPropertyToEntity.fillBobFromJSON(bpLocationEntity, location, jsonCustomerAddr);

        OBDal.getInstance().save(rootLocation);
        OBDal.getInstance().save(location);
      }
    } catch (final Exception e) {
      log.error("Exception while updating BPartner Address", e);
    }
    return location;
  }

  @Override
  protected String getProperty() {
    return "OBPOS_receipt.customers";
  }

  private void executeAddrHooks(Instance<CustomerAddrCreationHook> hooks,
      JSONObject jsonCustomerAddr, BusinessPartner customer, Location location) throws Exception {
    for (Iterator<CustomerAddrCreationHook> procIter = hooks.iterator(); procIter.hasNext();) {
      CustomerAddrCreationHook proc = procIter.next();
      proc.exec(jsonCustomerAddr, customer, location);
    }
  }

  private void executeAddrAfterCreationHooks(Instance<CustomerAddrAfterCreationHook> hooks,
      JSONObject jsonCustomerAddr, BusinessPartner customer, Location location) throws Exception {
    for (Iterator<CustomerAddrAfterCreationHook> procIter = hooks.iterator(); procIter.hasNext();) {
      CustomerAddrAfterCreationHook proc = procIter.next();
      proc.exec(jsonCustomerAddr, customer, location);
    }
  }
}
