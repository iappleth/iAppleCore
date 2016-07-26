/*
 ************************************************************************************
 * Copyright (C) 2012-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
/*
 ************************************************************************************
 * Copyright (C) 2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

package org.openbravo.retail.posterminal;

import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.Query;
import org.hibernate.SQLQuery;
import org.hibernate.criterion.Restrictions;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.session.OBPropertiesProvider;
import org.openbravo.client.kernel.KernelUtils;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.module.Module;
import org.openbravo.model.ad.module.ModuleDependency;
import org.openbravo.model.common.enterprise.Locator;
import org.openbravo.model.common.enterprise.OrgWarehouse;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.enterprise.Warehouse;
import org.openbravo.model.common.order.Order;
import org.openbravo.model.pricing.pricelist.PriceList;
import org.openbravo.model.pricing.pricelist.PriceListVersion;
import org.openbravo.retail.config.OBRETCOProductList;
import org.openbravo.service.db.DalConnectionProvider;

/**
 * @author iperdomo
 * 
 */
public class POSUtils {

  public static final Logger log = Logger.getLogger(POSUtils.class);
  public static final String MODULE_JAVA_PACKAGE = "org.openbravo.retail.posterminal";
  public static final String APP_NAME = "WebPOS";
  public static final String WEB_POS_FORM_ID = "B7B7675269CD4D44B628A2C6CF01244F";

  public static boolean isModuleInDevelopment() {
    OBContext.setAdminMode(false);
    try {
      return KernelUtils.getInstance().getModule(MODULE_JAVA_PACKAGE).isInDevelopment();
    } catch (Exception e) {
      log.error("Error trying to get Module info: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }
    return false;
  }

  public static OBPOSApplications getTerminal(String searchKey) {

    try {
      OBContext.setAdminMode(false);

      OBQuery<OBPOSApplications> obq = OBDal.getInstance().createQuery(OBPOSApplications.class,
          "searchKey = :value");
      obq.setNamedParameter("value", searchKey);

      List<OBPOSApplications> posApps = obq.list();

      if (posApps.isEmpty()) {
        return null;
      }

      return posApps.get(0);

    } catch (Exception e) {
      log.error("Error getting terminal id: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }
    return null;
  }

  public static OBPOSApplications getTerminalById(String posTerminalId) {
    try {
      OBContext.setAdminMode(false);

      OBPOSApplications posTerminal = OBDal.getInstance().get(OBPOSApplications.class,
          posTerminalId);

      return posTerminal;

    } catch (Exception e) {
      log.error("Error getting terminal by id: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }
    return null;
  }

  public static Organization getOrganization(String orgId) {
    try {
      OBContext.setAdminMode(false);

      Organization org = OBDal.getInstance().get(Organization.class, orgId);

      return org;

    } catch (Exception e) {
      log.error("Error getting Organization by org id: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }
    return null;
  }

  public static List<String> getOrgList(String searchKey) {
    try {
      OBContext.setAdminMode(false);

      OBPOSApplications terminal = getTerminal(searchKey);

      if (terminal == null) {
        throw new OBException("No terminal with searchKey: " + searchKey);
      }

      return OBContext.getOBContext().getOrganizationStructureProvider()
          .getParentList(terminal.getOrganization().getId(), true);

    } catch (Exception e) {
      log.error("Error getting store list: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }
    return null;
  }

  public static List<String> getOrgListByTerminalId(String terminalId) {
    try {
      OBContext.setAdminMode(false);

      OBPOSApplications terminal = getTerminalById(terminalId);

      if (terminal == null) {
        throw new OBException("No terminal with id: " + terminalId);
      }

      return OBContext.getOBContext().getOrganizationStructureProvider()
          .getParentList(terminal.getOrganization().getId(), true);

    } catch (Exception e) {
      log.error("Error getting store list: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }
    return null;
  }

  public static List<String> getStoreList(String orgId) {
    return OBContext.getOBContext().getOrganizationStructureProvider().getParentList(orgId, true);
  }

  public static PriceList getPriceListByOrgId(String orgId) {
    try {
      OBContext.setAdminMode(false);

      final List<String> orgList = getStoreList(orgId);

      for (String currentOrgId : orgList) {
        final Organization org = OBDal.getInstance().get(Organization.class, currentOrgId);
        if (org.getObretcoPricelist() != null) {
          return org.getObretcoPricelist();
        }
      }
    } catch (Exception e) {
      log.error("Error getting PriceList by Org ID: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }

    return null;
  }

  public static PriceList getPriceListByTerminal(String searchKey) {
    try {
      OBContext.setAdminMode(false);

      final List<String> orgList = getOrgList(searchKey);

      for (String orgId : orgList) {
        final Organization org = OBDal.getInstance().get(Organization.class, orgId);
        if (org.getObretcoPricelist() != null) {
          return org.getObretcoPricelist();
        }
      }
    } catch (Exception e) {
      log.error("Error getting PriceList by Terminal value: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }

    return null;
  }

  public static PriceList getPriceListByTerminalId(String terminalId) {
    try {
      OBContext.setAdminMode(false);

      final List<String> orgList = getOrgListByTerminalId(terminalId);

      for (String orgId : orgList) {
        final Organization org = OBDal.getInstance().get(Organization.class, orgId);
        if (org.getObretcoPricelist() != null) {
          return org.getObretcoPricelist();
        }
      }
    } catch (Exception e) {
      log.error("Error getting PriceList by Terminal id: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }

    return null;
  }

  public static PriceListVersion getPriceListVersionForPriceList(String priceListId,
      Date terminalDate) {

    try {
      OBContext.setAdminMode(true);
      SimpleDateFormat format = new SimpleDateFormat("yyyy/MM/dd");
      Query priceListVersionQuery = OBDal
          .getInstance()
          .getSession()
          .createQuery(
              "from PricingPriceListVersion AS plv "
                  + "where plv.priceList.id ='"
                  + priceListId
                  + "' and plv.active=true and plv.validFromDate = (select max(pplv.validFromDate) "
                  + "from PricingPriceListVersion as pplv where pplv.active=true and pplv.priceList.id = '"
                  + priceListId + "' and to_char(pplv.validFromDate,'yyyy-mm-dd') <= '"
                  + format.format(terminalDate) + "' )");
      for (Object plv : priceListVersionQuery.list()) {
        return (PriceListVersion) plv;
      }

    } catch (Exception e) {
      log.error("Error getting PriceList by Terminal id: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }

    return null;
  }

  public static PriceListVersion getPriceListVersionByTerminalId(String terminalId,
      Date terminalDate) {

    PriceList priceList = POSUtils.getPriceListByTerminalId(terminalId);

    if (priceList == null) {
      throw new OBException(
          Utility.messageBD(new DalConnectionProvider(false), "OBPOS_errorLoadingPriceList",
              RequestContext.get().getVariablesSecureApp().getLanguage()));
    }

    String priceListId = (String) DalUtil.getId(priceList);
    return POSUtils.getPriceListVersionForPriceList(priceListId, terminalDate);
  }

  public static PriceListVersion getPriceListVersionByOrgId(String orgId, Date terminalDate) {

    PriceList priceList = POSUtils.getPriceListByOrgId(orgId);
    String priceListId = (String) DalUtil.getId(priceList);
    return POSUtils.getPriceListVersionForPriceList(priceListId, terminalDate);
  }

  public static OBRETCOProductList getProductListByOrgId(String orgId) {
    try {
      OBContext.setAdminMode(false);

      final List<String> orgList = getStoreList(orgId);

      for (String currentOrgId : orgList) {
        final Organization org = OBDal.getInstance().get(Organization.class, currentOrgId);
        if (org.getObretcoProductlist() != null) {
          return org.getObretcoProductlist();
        }
      }
    } catch (Exception e) {
      log.error("Error getting ProductList by Org ID: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }
    return null;
  }

  public static int getLastDocumentNumberForPOS(String searchKey, List<String> documentTypeIds) {
    OBCriteria<OBPOSApplications> termCrit = OBDal.getInstance().createCriteria(
        OBPOSApplications.class);
    termCrit.add(Restrictions.eq(OBPOSApplications.PROPERTY_SEARCHKEY, searchKey));
    if (termCrit.count() != 1) {
      throw new OBException("Error while loading the terminal " + searchKey);
    }
    OBPOSApplications terminal = (OBPOSApplications) termCrit.uniqueResult();

    String curDbms = OBPropertiesProvider.getInstance().getOpenbravoProperties()
        .getProperty("bbdd.rdbms");
    String sqlToExecute;
    String doctypeIds = "";
    for (String doctypeId : documentTypeIds) {
      if (!doctypeIds.equals("")) {
        doctypeIds += ",";
      }
      doctypeIds += "'" + doctypeId + "'";
    }

    int maxDocNo;

    Long lastDocNum = terminal.getLastassignednum();
    if (lastDocNum == null) {
      if (curDbms.equals("POSTGRE")) {
        sqlToExecute = "select max(a.docno) from (select to_number(substring(documentno, '/([0-9]+)$')) docno from c_order where em_obpos_applications_id= (select obpos_applications_id from obpos_applications where value = ?) and c_doctype_id in ("
            + doctypeIds
            + ") and documentno like (select orderdocno_prefix from obpos_applications where value = ?)||'%') a";
      } else if (curDbms.equals("ORACLE")) {
        sqlToExecute = "select max(a.docno) from (select to_number(substr(REGEXP_SUBSTR(documentno, '/([0-9]+)$'), 2)) docno from c_order where em_obpos_applications_id= (select obpos_applications_id from obpos_applications where value = ?) and c_doctype_id in ("
            + doctypeIds
            + ") and documentno like (select orderdocno_prefix from obpos_applications where value = ?)||'%' ) a";
      } else {
        // unknow DBMS
        // shouldn't happen
        log.error("Error getting max documentNo because the DBMS is unknown.");
        return 0;
      }
      SQLQuery query = OBDal.getInstance().getSession().createSQLQuery(sqlToExecute);
      query.setString(0, searchKey);
      query.setString(1, searchKey);

      Object result = query.uniqueResult();
      if (result == null) {
        maxDocNo = 0;
      } else if (curDbms.equals("POSTGRE")) {
        maxDocNo = ((BigDecimal) result).intValue();
      } else if (curDbms.equals("ORACLE")) {
        maxDocNo = ((Long) result).intValue();
      } else {
        maxDocNo = 0;
      }
    } else {
      maxDocNo = lastDocNum.intValue();
    }

    // This number will be compared against the maximum number of the failed orders
    OBCriteria<OBPOSErrors> errorCrit = OBDal.getInstance().createCriteria(OBPOSErrors.class);
    errorCrit.add(Restrictions.eq(OBPOSErrors.PROPERTY_OBPOSAPPLICATIONS, terminal));
    errorCrit.add(Restrictions.eq(OBPOSErrors.PROPERTY_TYPEOFDATA, "Order"));
    List<OBPOSErrors> errors = errorCrit.list();
    for (OBPOSErrors error : errors) {
      try {
        JSONObject jsonError = new JSONObject(error.getJsoninfo());
        if (jsonError.has("documentNo") && jsonError.has("isQuotation")
            && !jsonError.getBoolean("isQuotation")) {
          String documentNo = jsonError.getString("documentNo");
          if (documentNo.indexOf("/") > -1) {
            String number = documentNo.substring(documentNo.indexOf("/") + 1);
            int errorNumber = new Long(number).intValue();
            if (errorNumber > maxDocNo) {
              maxDocNo = errorNumber;
            }
          } else if (jsonError.has("documentnoPrefix")) {
            String number = documentNo.replace(jsonError.getString("documentnoPrefix"), "");
            int errorNumber = new Long(number).intValue();
            if (errorNumber > maxDocNo) {
              maxDocNo = errorNumber;
            }
          }
        }
      } catch (Exception e) {
        e.printStackTrace();
        // If not parseable, we continue
      }
    }
    return maxDocNo;
  }

  public static int getLastDocumentNumberQuotationForPOS(String searchKey,
      List<String> documentTypeIds) {
    OBCriteria<OBPOSApplications> termCrit = OBDal.getInstance().createCriteria(
        OBPOSApplications.class);
    termCrit.add(Restrictions.eq(OBPOSApplications.PROPERTY_SEARCHKEY, searchKey));
    if (termCrit.count() != 1) {
      throw new OBException("Error while loading the terminal " + searchKey);
    }
    OBPOSApplications terminal = (OBPOSApplications) termCrit.uniqueResult();

    String curDbms = OBPropertiesProvider.getInstance().getOpenbravoProperties()
        .getProperty("bbdd.rdbms");
    String sqlToExecute;
    String doctypeIds = "";
    for (String doctypeId : documentTypeIds) {
      if (!doctypeIds.equals("")) {
        doctypeIds += ",";
      }
      doctypeIds += "'" + doctypeId + "'";
    }
    int maxDocNo;
    Long quotationlastDocNum = terminal.getQuotationslastassignednum();
    if (quotationlastDocNum == null) {
      if (curDbms.equals("POSTGRE")) {
        sqlToExecute = "select max(a.docno) from (select to_number(substring(documentno, '/([0-9]+)$')) docno from c_order where em_obpos_applications_id= (select obpos_applications_id from obpos_applications where value = ?) and c_doctype_id in ("
            + doctypeIds
            + ") and documentno like (select quotationdocno_prefix from obpos_applications where value = ?)||'%') a";
      } else if (curDbms.equals("ORACLE")) {
        sqlToExecute = "select max(a.docno) from (select to_number(substr(REGEXP_SUBSTR(documentno, '/([0-9]+)$'), 2)) docno from c_order where em_obpos_applications_id= (select obpos_applications_id from obpos_applications where value = ?) and c_doctype_id in ("
            + doctypeIds
            + ") and documentno like (select quotationdocno_prefix from obpos_applications where value = ?)||'%' ) a";
      } else {
        // unknow DBMS
        // shouldn't happen
        log.error("Error getting max documentNo because the DBMS is unknown.");
        return 0;
      }
      SQLQuery query = OBDal.getInstance().getSession().createSQLQuery(sqlToExecute);
      query.setString(0, searchKey);
      query.setString(1, searchKey);

      Object result = query.uniqueResult();
      if (result == null) {
        maxDocNo = 0;
      } else if (curDbms.equals("POSTGRE")) {
        maxDocNo = ((BigDecimal) result).intValue();
      } else if (curDbms.equals("ORACLE")) {
        maxDocNo = ((Long) result).intValue();
      } else {
        maxDocNo = 0;
      }
    } else {
      maxDocNo = quotationlastDocNum.intValue();
    }

    // This number will be compared against the maximum number of the failed orders
    OBCriteria<OBPOSErrors> errorCrit = OBDal.getInstance().createCriteria(OBPOSErrors.class);
    errorCrit.add(Restrictions.eq(OBPOSErrors.PROPERTY_OBPOSAPPLICATIONS, terminal));
    errorCrit.add(Restrictions.eq(OBPOSErrors.PROPERTY_TYPEOFDATA, "Order"));
    List<OBPOSErrors> errors = errorCrit.list();
    for (OBPOSErrors error : errors) {
      try {
        JSONObject jsonError = new JSONObject(error.getJsoninfo());
        if (jsonError.has("documentNo") && jsonError.has("isQuotation")
            && jsonError.getBoolean("isQuotation")) {
          String documentNo = jsonError.getString("documentNo");
          if (documentNo.indexOf("/") > -1) {
            String number = documentNo.substring(documentNo.indexOf("/") + 1);
            int errorNumber = new Long(number).intValue();
            if (errorNumber > maxDocNo) {
              maxDocNo = errorNumber;
            }
          } else if (jsonError.has("quotationnoPrefix")) {
            String number = documentNo.replace(jsonError.getString("quotationnoPrefix"), "");
            int errorNumber = new Long(number).intValue();
            if (errorNumber > maxDocNo) {
              maxDocNo = errorNumber;
            }
          }
        }
      } catch (Exception e) {
        e.printStackTrace();
        // If not parseable, we continue
      }
    }
    return maxDocNo;
  }

  public static int getLastDocumentNumberReturnForPOS(String searchKey, List<String> documentTypeIds) {
    OBCriteria<OBPOSApplications> termCrit = OBDal.getInstance().createCriteria(
        OBPOSApplications.class);
    termCrit.add(Restrictions.eq(OBPOSApplications.PROPERTY_SEARCHKEY, searchKey));
    if (termCrit.count() != 1) {
      throw new OBException("Error while loading the terminal " + searchKey);
    }
    OBPOSApplications terminal = (OBPOSApplications) termCrit.uniqueResult();

    String curDbms = OBPropertiesProvider.getInstance().getOpenbravoProperties()
        .getProperty("bbdd.rdbms");
    String sqlToExecute;
    String doctypeIds = "";
    for (String doctypeId : documentTypeIds) {
      if (!doctypeIds.equals("")) {
        doctypeIds += ",";
      }
      doctypeIds += "'" + doctypeId + "'";
    }
    int maxDocNo;
    Long returnlastDocNum = terminal.getReturnslastassignednum();
    if (returnlastDocNum == null) {
      if (curDbms.equals("POSTGRE")) {
        sqlToExecute = "select max(a.docno) from (select to_number(substring(documentno, '/([0-9]+)$')) docno from c_order where em_obpos_applications_id= (select obpos_applications_id from obpos_applications where value = ?) and c_doctype_id in ("
            + doctypeIds
            + ") and documentno like (select returndocno_prefix from obpos_applications where value = ?)||'%') a";
      } else if (curDbms.equals("ORACLE")) {
        sqlToExecute = "select max(a.docno) from (select to_number(substr(REGEXP_SUBSTR(documentno, '/([0-9]+)$'), 2)) docno from c_order where em_obpos_applications_id= (select obpos_applications_id from obpos_applications where value = ?) and c_doctype_id in ("
            + doctypeIds
            + ") and documentno like (select returndocno_prefix from obpos_applications where value = ?)||'%' ) a";
      } else {
        // unknow DBMS
        // shouldn't happen
        log.error("Error getting max documentNo because the DBMS is unknown.");
        return 0;
      }
      SQLQuery query = OBDal.getInstance().getSession().createSQLQuery(sqlToExecute);
      query.setString(0, searchKey);
      query.setString(1, searchKey);
      Object result = query.uniqueResult();
      if (result == null) {
        maxDocNo = 0;
      } else if (curDbms.equals("POSTGRE")) {
        maxDocNo = ((BigDecimal) result).intValue();
      } else if (curDbms.equals("ORACLE")) {
        maxDocNo = ((Long) result).intValue();
      } else {
        maxDocNo = 0;
      }
    } else {
      maxDocNo = returnlastDocNum.intValue();
    }

    // This number will be compared against the maximum number of the failed orders
    OBCriteria<OBPOSErrors> errorCrit = OBDal.getInstance().createCriteria(OBPOSErrors.class);
    errorCrit.add(Restrictions.eq(OBPOSErrors.PROPERTY_OBPOSAPPLICATIONS, terminal));
    errorCrit.add(Restrictions.eq(OBPOSErrors.PROPERTY_TYPEOFDATA, "Order"));
    List<OBPOSErrors> errors = errorCrit.list();
    for (OBPOSErrors error : errors) {
      try {
        JSONObject jsonError = new JSONObject(error.getJsoninfo());
        if (jsonError.has("documentNo") && (jsonError.optLong("returnnoSuffix", -1L) > -1L)) {
          String documentNo = jsonError.getString("documentNo");
          if (documentNo.indexOf("/") > -1) {
            String number = documentNo.substring(documentNo.indexOf("/") + 1);
            int errorNumber = new Long(number).intValue();
            if (errorNumber > maxDocNo) {
              maxDocNo = errorNumber;
            }
          } else if (jsonError.has("returnnoPrefix")) {
            String number = documentNo.replace(jsonError.getString("returnnoPrefix"), "");
            int errorNumber = new Long(number).intValue();
            if (errorNumber > maxDocNo) {
              maxDocNo = errorNumber;
            }
          }
        }
      } catch (Exception e) {
        e.printStackTrace();
        // If not parseable, we continue
      }
    }
    return maxDocNo;
  }

  public static int getLastDocumentNumberForPOS(String searchKey, String documentTypeId) {
    ArrayList<String> doctypeId = new ArrayList<String>();
    doctypeId.add(documentTypeId);
    return getLastDocumentNumberForPOS(searchKey, doctypeId);

  }

  public static int getLastDocumentNumberQuotationForPOS(String searchKey, String documentTypeId) {
    ArrayList<String> doctypeId = new ArrayList<String>();
    doctypeId.add(documentTypeId);
    return getLastDocumentNumberQuotationForPOS(searchKey, doctypeId);

  }

  public static int getLastDocumentNumberReturnForPOS(String searchKey, String documentTypeId) {
    ArrayList<String> doctypeId = new ArrayList<String>();
    doctypeId.add(documentTypeId);
    return getLastDocumentNumberReturnForPOS(searchKey, doctypeId);

  }

  public static void getRetailDependantModules(Module module, List<Module> moduleList,
      List<ModuleDependency> list) {
    for (ModuleDependency depModule : list) {
      if (depModule.getDependentModule().equals(module)
          && !moduleList.contains(depModule.getModule())) {
        moduleList.add(depModule.getModule());
        getRetailDependantModules(depModule.getModule(), moduleList, list);
      }
    }
  }

  public static Warehouse getWarehouseForTerminal(OBPOSApplications pOSTerminal) {
    OBContext.setAdminMode(false);
    try {
      Organization org = pOSTerminal.getOrganization();
      OBCriteria<OrgWarehouse> warehouses = OBDal.getInstance().createCriteria(OrgWarehouse.class);
      warehouses.setFilterOnReadableClients(false);
      warehouses.setFilterOnReadableOrganization(false);
      warehouses.add(Restrictions.eq(OrgWarehouse.PROPERTY_ORGANIZATION, org));
      warehouses.addOrderBy(OrgWarehouse.PROPERTY_PRIORITY, true);
      warehouses.addOrderBy(OrgWarehouse.PROPERTY_ID, true);
      List<OrgWarehouse> warehouseList = warehouses.list();
      if (warehouseList.size() == 0) {
        return null;
      }
      return warehouseList.get(0).getWarehouse();
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  public static List<Warehouse> getWarehousesForTerminal(OBPOSApplications pOSTerminal) {
    ArrayList<Warehouse> lstWarehouses = new ArrayList<Warehouse>();
    OBContext.setAdminMode(false);
    try {
      Organization org = pOSTerminal.getOrganization();
      OBCriteria<OrgWarehouse> warehouses = OBDal.getInstance().createCriteria(OrgWarehouse.class);
      warehouses.setFilterOnReadableClients(false);
      warehouses.setFilterOnReadableOrganization(false);
      warehouses.add(Restrictions.eq(OrgWarehouse.PROPERTY_ORGANIZATION, org));
      warehouses.addOrderBy(OrgWarehouse.PROPERTY_PRIORITY, true);
      warehouses.addOrderBy(OrgWarehouse.PROPERTY_ID, true);
      List<OrgWarehouse> warehouseList = warehouses.list();
      if (warehouseList.size() == 0) {
        return null;
      }
      for (OrgWarehouse orgWarehouse : warehouseList) {
        lstWarehouses.add(orgWarehouse.getWarehouse());
      }
    } finally {
      OBContext.restorePreviousMode();
    }
    return lstWarehouses;
  }

  public static Locator getBinForReturns(OBPOSApplications pOSTerminal) {
    List<Warehouse> lstWarehouses = getWarehousesForTerminal(pOSTerminal);
    if (lstWarehouses.size() > 0) {
      for (Warehouse warehouse : lstWarehouses) {
        if (warehouse.getReturnlocator() != null) {
          return warehouse.getReturnlocator();
        }
      }
      // We haven't found a warehouse with a return bin
      // We are going to select the bin with greater priority
      // of the warehouse of greater priority

      List<Locator> lstLocators = lstWarehouses.get(0).getLocatorList();
      if (lstLocators.size() > 0) {
        return lstLocators.get(0);
      } else {
        throw new OBException("Warehouse" + lstWarehouses.get(0) + " doesn't have bins");
      }
    } else {
      throw new OBException("Warehouse are not correctly configured for "
          + pOSTerminal.getIdentifier() + " terminal");
    }
  }

  /**
   * This method returns a Date which corresponds to the current date, without hours, minutes, or
   * seconds
   */
  public static Date getCurrentDate() {
    Calendar cal = Calendar.getInstance();
    cal.set(Calendar.HOUR_OF_DAY, 0);
    cal.set(Calendar.MINUTE, 0);
    cal.set(Calendar.SECOND, 0);
    cal.set(Calendar.MILLISECOND, 0);
    Date currentDate = cal.getTime();
    return currentDate;
  }

  /**
   * Gets the value of a given property in Organization entity looking the the org tree and getting
   * the first not null value
   */
  public static Object getPropertyInOrgTree(Organization org, String propertyName) {
    for (String orgId : OBContext.getOBContext().getOrganizationStructureProvider()
        .getParentList(org.getId(), true)) {
      Organization orgInTree = OBDal.getInstance().get(Organization.class, orgId);
      if (orgInTree.get(propertyName) != null) {
        return orgInTree.get(propertyName);
      }
    }
    return null;
  }

  public static Boolean hasCurrencyRate(String posTerminalId) {
    try {
      OBContext.setAdminMode(true);
      Query currencyRateQuery = OBDal
          .getInstance()
          .getSession()
          .createQuery(
              "select c_currency_rate(coalesce(c, p.paymentMethod.currency), "
                  + "p.obposApplications.organization.currency,"
                  + " null, null, p.obposApplications.client.id, "
                  + "p.obposApplications.organization.id) as rate, c_currency_rate(p.obposApplications.organization.currency, p.financialAccount.currency, null, null, p.obposApplications.client.id, p.obposApplications.organization.id) as mulrate"
                  + " from OBPOS_App_Payment as p left join p.financialAccount as f "
                  + "left join f.currency as c where p.obposApplications.id ='" + posTerminalId
                  + "'");

      currencyRateQuery.list(); // No need to get the result, just execute the query

      // The query succeeded, then the check is valid.
      return true;
    } catch (Exception e) {
      log.error("Error getting Currency Rate: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }
    // The query failed, then the check is not valid.
    return false;
  }

  /**
   * Method to calculate the default payment method and financial account of an order
   * 
   * @param jsonorder
   *          JSONObject with the information sent from the Web POS
   * @param order
   *          The order to obtain data
   * @return The JSONObject with the payment method and financial account
   */
  public static JSONObject setDefaultPaymentType(JSONObject jsonorder, Order order)
      throws JSONException {
    TerminalTypePaymentMethod defaultPaymentMethod = order.getObposApplications()
        .getObposTerminaltype().getPaymentMethod();
    OBCriteria<OBPOSAppPayment> paymentTypes = OBDal.getInstance().createCriteria(
        OBPOSAppPayment.class);
    paymentTypes.add(Restrictions.eq(OBPOSAppPayment.PROPERTY_OBPOSAPPLICATIONS,
        order.getObposApplications()));
    if (defaultPaymentMethod != null) {
      paymentTypes.add(Restrictions
          .eq(OBPOSAppPayment.PROPERTY_PAYMENTMETHOD, defaultPaymentMethod));
    }
    paymentTypes.addOrderBy(OBPOSAppPayment.PROPERTY_ID, false);
    paymentTypes.setMaxResults(1);
    OBPOSAppPayment defaultPaymentType = (OBPOSAppPayment) paymentTypes.uniqueResult();

    JSONObject paymentTypeValues = null;
    if (defaultPaymentType != null) {
      paymentTypeValues = new JSONObject();
      paymentTypeValues.put("paymentMethod", defaultPaymentType.getPaymentMethod()
          .getPaymentMethod());
      paymentTypeValues.put("financialAccount", defaultPaymentType.getFinancialAccount());
    }
    return paymentTypeValues;
  }

}
