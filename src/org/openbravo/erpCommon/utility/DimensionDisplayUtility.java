/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html 
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License. 
 * The Original Code is Openbravo ERP. 
 * The Initial Developer of the Original Code is Openbravo SLU 
 * All portions are Copyright (C) 2012 Openbravo SLU
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.erpCommon.utility;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.hibernate.Query;
import org.hibernate.Session;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.access.ADClientAcctDimension;
import org.openbravo.model.ad.domain.Reference;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.ad.system.DimensionMapping;
import org.openbravo.model.ad.ui.Field;
import org.openbravo.model.ad.ui.Tab;

public class DimensionDisplayUtility {

  public static Logger log4j = Logger.getLogger(DimensionDisplayUtility.class);

  /** Accounting Dimensions **/
  public static final String DIM_Header = "H";
  public static final String DIM_Lines = "L";
  public static final String DIM_BreakDown = "BD";
  public static final String DIM_Project = "PJ";
  public static final String DIM_BPartner = "BP";
  public static final String DIM_Product = "PR";
  public static final String DIM_CostCenter = "CC";
  public static final String DIM_User1 = "U1";
  public static final String DIM_User2 = "U2";
  public static final String DIM_Campaign = "MC";
  public static final String DIM_Activity = "AY";
  public static final String DIM_Asset = "AS";

  /** Document Base Types with accounting dimensions **/
  public static final String ARProFormaInvoice = "ARF";
  public static final String ARReturnMaterialInvoice = "ARI_RM";
  public static final String APPayment = "APP";
  public static final String ARInvoice = "ARI";
  public static final String MaterialDelivery = "MMS";
  public static final String APCreditMemo = "APC";
  public static final String FinancialAccountTransaction = "FAT";
  public static final String MaterialMovement = "MMM";
  public static final String Amortization = "AMZ";
  public static final String SalesOrder = "SOO";
  public static final String APInvoice = "API";
  public static final String GLJournal = "GLJ";
  public static final String MaterialPhysicalInventory = "MMI";
  public static final String MaterialReceipt = "MMR";
  public static final String PurchaseOrder = "POO";
  public static final String ARCreditMemo = "ARC";
  public static final String Reconciliation = "REC";
  public static final String ARReceipt = "ARR";

  /** Session variable **/
  public static final String IsAcctDimCentrally = "$IsAcctDimCentrally";
  /** Display logic for accounting dimensions **/
  public static final String DIM_DISPLAYLOGIC = "@ACCT_DIMENSION_DISPLAY@";
  /** Document Base Type auxiliary input **/
  public static final String DIM_AUXILIAR_INPUT = "DOCBASETYPE";

  public static final String DOCBASETYPES_REFERENCE = "FBC599C796664DD49AD002C61DAFF813";
  public static final String DIMENSIONS_REFERENCE = "181";
  public static final String LEVELS_REFERENCE = "3DDC9BFFE43342C4826EC65E97D40586";
  public static final String ELEMENT = "$Element";

  private static Map<String, String> columnDimensionMap = null;

  private static void initialize() {
    columnDimensionMap = new HashMap<String, String>();
    columnDimensionMap.put("C_PROJECT_ID", DIM_Project);
    columnDimensionMap.put("C_BPARTNER_ID", DIM_BPartner);
    columnDimensionMap.put("M_PRODUCT_ID", DIM_Product);
    columnDimensionMap.put("C_COSTCENTER_ID", DIM_CostCenter);
    columnDimensionMap.put("USER1_ID", DIM_User1);
    columnDimensionMap.put("USER2_ID", DIM_User2);

    // The following dimensions are not configurable from Client window
    columnDimensionMap.put("C_CAMPAIGN_ID", DIM_Campaign);
    columnDimensionMap.put("C_ACTIVITY_ID", DIM_Activity);
    columnDimensionMap.put("A_ASSET_ID", DIM_Asset);
  }

  public static String displayAcctDimensions(String centrally, String dimemsion,
      String docBaseType, String level) {
    String var = "";
    if (centrally.equals("N")) {
      var = "$Element_" + dimemsion;
    } else {
      var = "$Element_" + dimemsion + "_" + docBaseType + "_" + level;
    }
    return var;
  }

  /**
   * Compute the JavaScript code to embed in the tab definition for computing the display logic.
   * 
   * @param tab
   *          Tab.
   * @param field
   *          Field.
   * @return Display logic (JavaScript) for the given field.
   */
  @SuppressWarnings("unchecked")
  public static String computeAccountingDimensionDisplayLogic(Tab tab, Field field) {
    // Example
    // (context.$IsAcctDimCentrally === 'N' && context.$Element_U2 === 'Y') ||
    // (context.$IsAcctDimCentrally === 'Y' && context['$Element_U2_' +
    // OB.Utilities.getValue(currentValues, 'DOCBASETYPE') '+ _H'] === 'Y')
    String displayLogicPart1 = "(context." + IsAcctDimCentrally
        + " === 'N' && context.$Element_%s === 'Y')";
    String displayLogicPart2 = " || (context."
        + IsAcctDimCentrally
        + " === 'Y' && context['$Element_%s_' + OB.Utilities.getValue(currentValues, \"%s\") + '_%s'] === 'Y')";

    try {
      OBContext.setAdminMode(true);
      if (columnDimensionMap == null) {
        initialize();
      }
      final String tableId = tab.getTable().getId();
      String columnName = "";
      if (field.getColumn() != null) {
        columnName = field.getColumn().getDBColumnName();
      } else {
        log4j.error("Field (" + field.getId() + " | " + field.getName()
            + ") not linked to any column.");
        return "";
      }
      String dimension = columnDimensionMap.get(columnName.toUpperCase());
      if (dimension == null) {
        log4j.error("Field (" + field.getId() + " | " + field.getName()
            + ") not mapping any dimension.");
        return "";
      }

      // Create the old accounting dimension visibility if {Campaign, Activity, Asset} fields
      // have @ACCT_DIMENSION_DISPLAY@ display logic.
      if (dimension.equals(DIM_Campaign) || dimension.equals(DIM_Activity)
          || dimension.equals(DIM_Asset)) {
        log4j
            .error(field.getName()
                + " field contains @ACCT_DIMENSION_DISPLAY@ display logic but is not supported. Change it.");
        return String.format(displayLogicPart1, dimension);
      }

      // Get the corresponding level for the table
      StringBuilder hql = new StringBuilder();
      final Session session = OBDal.getInstance().getSession();
      hql.append(" select distinct dm." + DimensionMapping.PROPERTY_LEVEL);
      hql.append(" from " + DimensionMapping.ENTITY_NAME + " as dm ");
      hql.append(" where dm." + DimensionMapping.PROPERTY_TABLE + ".id = ? ");
      hql.append("       and dm." + DimensionMapping.PROPERTY_ACCOUNTINGDIMENSION + " = ? ");
      final Query queryLevel = session.createQuery(hql.toString());
      queryLevel.setParameter(0, tableId);
      queryLevel.setParameter(1, dimension);
      List<String> levelList = queryLevel.list();
      int size = levelList.size();
      if (size == 0) {
        log4j.error("Same table (" + tableId + ") does not map with any levels.");
      }
      if (size > 1) {
        log4j.error("Same table (" + tableId + ") mapping with " + size + " levels.");
      }
      for (String l : levelList) {
        // The same table can only map with one level
        return String.format(displayLogicPart1 + displayLogicPart2, dimension, dimension,
            DIM_AUXILIAR_INPUT, l);
      }

    } catch (Exception e) {
      log4j.error("Not possible to compute display logic for field " + field.getId(), e);
      return "";
    } finally {
      OBContext.restorePreviousMode();
    }

    return "";
  }

  /**
   * Compute the accounting dimensions visibility session variables.
   * 
   * @param client
   *          Client.
   * @return Map containing all the accounting dimension visibility session variables and the
   *         corresponding value ('Y', 'N')
   */
  public static Map<String, String> getAccountingDimensionConfiguration(Client client) {
    Map<String, String> sessionMap = new HashMap<String, String>();
    String aux = "";

    try {
      OBContext.setAdminMode(true);
      Reference dimRef = OBDal.getInstance().get(Reference.class, DIMENSIONS_REFERENCE);
      Reference docBaseTypeRef = OBDal.getInstance().get(Reference.class, DOCBASETYPES_REFERENCE);
      Reference levelsRef = OBDal.getInstance().get(Reference.class, LEVELS_REFERENCE);

      String isDisplayed = null;
      Map<String, String> clientAcctDimensionCache = new HashMap<String, String>();
      for (ADClientAcctDimension cad : client.getADClientAcctDimensionList()) {
        clientAcctDimensionCache.put(cad.getDimension() + "_" + cad.getDocBaseType() + "_"
            + DIM_Header, cad.isShowInHeader() ? "Y" : "N");
        clientAcctDimensionCache.put(cad.getDimension() + "_" + cad.getDocBaseType() + "_"
            + DIM_Lines, cad.isShowInLines() ? "Y" : "N");
        clientAcctDimensionCache.put(cad.getDimension() + "_" + cad.getDocBaseType() + "_"
            + DIM_BreakDown, cad.isShowInBreakdown() ? "Y" : "N");
      }

      for (org.openbravo.model.ad.domain.List dim : dimRef.getADListList()) {
        for (org.openbravo.model.ad.domain.List doc : docBaseTypeRef.getADListList()) {
          for (org.openbravo.model.ad.domain.List level : levelsRef.getADListList()) {
            String docValue = doc.getSearchKey();
            String dimValue = dim.getSearchKey();
            String levelValue = level.getSearchKey();
            aux = ELEMENT + "_" + dimValue + "_" + docValue + "_" + levelValue;

            if (DIM_Project.equals(dimValue)) {
              if (client.isProjectAcctdimIsenable()) {
                isDisplayed = clientAcctDimensionCache.get(dimValue + "_" + docValue + "_"
                    + levelValue);
                if (isDisplayed == null) {
                  if (DIM_Header.equals(levelValue)) {
                    isDisplayed = client.isProjectAcctdimHeader() ? "Y" : "N";
                  } else if (DIM_Lines.equals(levelValue)) {
                    isDisplayed = client.isProjectAcctdimLines() ? "Y" : "N";
                  } else if (DIM_BreakDown.equals(levelValue)) {
                    isDisplayed = client.isProjectAcctdimBreakdown() ? "Y" : "N";
                  }
                }
              } else {
                isDisplayed = "N";
              }
            } else if (DIM_BPartner.equals(dimValue)) {
              if (client.isBpartnerAcctdimIsenable()) {
                isDisplayed = clientAcctDimensionCache.get(dimValue + "_" + docValue + "_"
                    + levelValue);
                if (isDisplayed == null) {
                  if (DIM_Header.equals(levelValue)) {
                    isDisplayed = client.isBpartnerAcctdimHeader() ? "Y" : "N";
                  } else if (DIM_Lines.equals(levelValue)) {
                    isDisplayed = client.isBpartnerAcctdimLines() ? "Y" : "N";
                  } else if (DIM_BreakDown.equals(levelValue)) {
                    isDisplayed = client.isBpartnerAcctdimBreakdown() ? "Y" : "N";
                  }
                }
              } else {
                isDisplayed = "N";
              }
            } else if (DIM_Product.equals(dimValue)) {
              if (client.isProductAcctdimIsenable()) {
                isDisplayed = clientAcctDimensionCache.get(dimValue + "_" + docValue + "_"
                    + levelValue);
                if (isDisplayed == null) {
                  if (DIM_Header.equals(levelValue)) {
                    isDisplayed = client.isProductAcctdimHeader() ? "Y" : "N";
                  } else if (DIM_Lines.equals(levelValue)) {
                    isDisplayed = client.isProductAcctdimLines() ? "Y" : "N";
                  } else if (DIM_BreakDown.equals(levelValue)) {
                    isDisplayed = client.isProductAcctdimBreakdown() ? "Y" : "N";
                  }
                }
              } else {
                isDisplayed = "N";
              }
            } else if (DIM_CostCenter.equals(dimValue)) {
              if (client.isCostcenterAcctdimIsenable()) {
                isDisplayed = clientAcctDimensionCache.get(dimValue + "_" + docValue + "_"
                    + levelValue);
                if (isDisplayed == null) {
                  if (DIM_Header.equals(levelValue)) {
                    isDisplayed = client.isCostcenterAcctdimHeader() ? "Y" : "N";
                  } else if (DIM_Lines.equals(levelValue)) {
                    isDisplayed = client.isCostcenterAcctdimLines() ? "Y" : "N";
                  } else if (DIM_BreakDown.equals(levelValue)) {
                    isDisplayed = client.isCostcenterAcctdimBreakdown() ? "Y" : "N";
                  }
                }
              } else {

              }
            } else if (DIM_User1.equals(dimValue)) {
              if (client.isUser1AcctdimIsenable()) {
                isDisplayed = clientAcctDimensionCache.get(dimValue + "_" + docValue + ""
                    + levelValue);
                if (isDisplayed == null) {
                  if (DIM_Header.equals(levelValue)) {
                    isDisplayed = client.isUser1AcctdimHeader() ? "Y" : "N";
                  } else if (DIM_Lines.equals(levelValue)) {
                    isDisplayed = client.isUser1AcctdimHeader() ? "Y" : "N";
                  } else if (DIM_BreakDown.equals(levelValue)) {
                    isDisplayed = client.isUser1AcctdimHeader() ? "Y" : "N";
                  }
                }
              } else {
                isDisplayed = "N";
              }
            } else if (DIM_User2.equals(dimValue)) {
              if (client.isUser2AcctdimIsenable()) {
                isDisplayed = clientAcctDimensionCache.get(dimValue + "_" + docValue + ""
                    + levelValue);
                if (isDisplayed == null) {
                  if (DIM_Header.equals(levelValue)) {
                    isDisplayed = client.isUser2AcctdimHeader() ? "Y" : "N";
                  } else if (DIM_Lines.equals(levelValue)) {
                    isDisplayed = client.isUser2AcctdimLines() ? "Y" : "N";
                  } else if (DIM_BreakDown.equals(levelValue)) {
                    isDisplayed = client.isUser2AcctdimBreakdown() ? "Y" : "N";
                  }
                }
              } else {
                isDisplayed = "N";
              }
            }

            if (isDisplayed != null) {
              sessionMap.put(aux, isDisplayed);
              isDisplayed = null;
              aux = "";
            }
          }
        }
      }
    } catch (Exception e) {
      log4j.error("Not possible to load accounting dimensions visibility session variables", e);
      return new HashMap<String, String>();
    } finally {
      OBContext.restorePreviousMode();
    }
    return sessionMap;
  }

  /**
   * Calculates the list of session variables that will be used for computing the display logic of
   * the field.
   * 
   * @param tab
   *          Tab.
   * @param field
   *          Field.
   * @return List of session variables required for computing the display logic of the field.
   */
  @SuppressWarnings("unchecked")
  public static List<String> getRequiredSessionVariablesForTab(Tab tab, Field field) {
    List<String> sessionVariables = new ArrayList<String>();
    if (columnDimensionMap == null) {
      initialize();
    }

    try {
      OBContext.setAdminMode(true);
      final String tableId = tab.getTable().getId();
      if (field.getColumn() == null) {
        log4j.error("Field (" + field.getId() + " | " + field.getName()
            + ") not linked to any column.");
        return sessionVariables;
      }
      final String columnName = field.getColumn().getDBColumnName();
      String dimension = columnDimensionMap.get(columnName.toUpperCase());
      if (dimension == null) {
        log4j.error("Field (" + field.getId() + " | " + field.getName()
            + ") not mapping any dimension.");
        return sessionVariables;
      }

      // Load always IsAcctDimCentrally global variable
      sessionVariables.add(IsAcctDimCentrally);

      // Load old accounting dimension visibility session variable
      // It is required for all the accounting dimension fields
      sessionVariables.add(ELEMENT + "_" + dimension);

      // Load new accounting dimension visibility session variable
      StringBuilder hql = new StringBuilder();
      final Session session = OBDal.getInstance().getSession();
      hql.append(" select distinct dm.%s ");
      hql.append(" from " + DimensionMapping.ENTITY_NAME + " as dm ");
      hql.append(" where dm." + DimensionMapping.PROPERTY_TABLE + ".id = ? ");
      hql.append("       and dm." + DimensionMapping.PROPERTY_ACCOUNTINGDIMENSION + " = ? ");

      final Query queryDoc = session.createQuery(String.format(hql.toString(),
          DimensionMapping.PROPERTY_DOCUMENTCATEGORY));
      queryDoc.setParameter(0, tableId);
      queryDoc.setParameter(1, dimension);
      List<String> docBaseTypeList = queryDoc.list();

      final Query queryLevel = session.createQuery(String.format(hql.toString(),
          DimensionMapping.PROPERTY_LEVEL));
      queryLevel.setParameter(0, tableId);
      queryLevel.setParameter(1, dimension);
      List<String> levelList = queryLevel.list();

      for (String doc : docBaseTypeList) {
        for (String level : levelList) {
          sessionVariables.add(ELEMENT + "_" + dimension + "_" + doc + "_" + level);
        }
      }

    } finally {
      OBContext.restorePreviousMode();
    }
    return sessionVariables;
  }

}
