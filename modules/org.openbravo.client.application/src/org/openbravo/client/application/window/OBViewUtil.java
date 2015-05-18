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
 * All portions are Copyright (C) 2010-2015 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.application.window;

import java.util.ArrayList;
import java.util.List;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.client.application.GCField;
import org.openbravo.client.application.GCSystem;
import org.openbravo.client.application.GCTab;
import org.openbravo.client.application.Parameter;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.ui.Element;
import org.openbravo.model.ad.ui.Field;
import org.openbravo.model.ad.ui.FieldTrl;
import org.openbravo.model.ad.ui.Tab;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utility methods used in generating Openbravo view representations.
 * 
 * @author mtaal
 */
public class OBViewUtil {

  public static final Element createdElement = OBDal.getInstance().get(Element.class, "245");
  public static final Element createdByElement = OBDal.getInstance().get(Element.class, "246");
  public static final Element updatedElement = OBDal.getInstance().get(Element.class, "607");
  public static final Element updatedByElement = OBDal.getInstance().get(Element.class, "608");
  private static Logger log = LoggerFactory.getLogger(OBViewUtil.class);

  /**
   * Method for retrieving the label of a field on the basis of the current language of the user.
   * 
   * @see #getLabel(BaseOBObject, List)
   */
  public static String getLabel(Field fld) {
    return getLabel(fld, fld.getADFieldTrlList());
  }

  /**
   * Returns parameter's title. Because the same Parameter Definition can be used in different
   * windows (some being purchases, some other ones sales), sync terminology is not enough to
   * determine its title. If this process is invoked from a window, it is required to check the
   * window itself to decide if it is sales or purchases. Note this only takes effect in case the
   * parameter is associated with an element and the parameter is centrally maintained.
   * 
   * @param parameter
   *          Parameter to get the title for
   * @param purchaseTrx
   *          Is the window for purchases or sales
   * @return Parameter's title
   */
  public static String getParameterTitle(Parameter parameter, boolean purchaseTrx) {
    if (purchaseTrx && parameter.getApplicationElement() != null
        && parameter.isCentralMaintenance()) {
      return getLabel(parameter.getApplicationElement(), parameter.getApplicationElement()
          .getADElementTrlList(), Element.PROPERTY_PURCHASEORDERNAME, Element.PROPERTY_NAME);
    }
    return getLabel(parameter, parameter.getOBUIAPPParameterTrlList());
  }

  /**
   * Generic method for computing the translated label/title. It assumes that the trlObjects have a
   * property called language and name and the owner object a property called name.
   * 
   * @param owner
   *          the owner of the trlObjects (for example Field)
   * @param trlObjects
   *          the trl objects (for example FieldTrl)
   * @return a translated name if found or otherwise the name of the owner
   */
  public static String getLabel(BaseOBObject owner, List<?> trlObjects) {
    return getLabel(owner, trlObjects, Field.PROPERTY_NAME);
  }

  public static String getLabel(BaseOBObject owner, List<?> trlObjects, String propertyName) {
    return getLabel(owner, trlObjects, propertyName, null);
  }

  /**
   * Generic method for computing the translated label/title. It assumes that the trlObjects have a
   * property called language and name and the owner object a property called name.
   * 
   * @param owner
   *          the owner of the trlObjects (for example Field)
   * @param trlObjects
   *          the trl objects (for example FieldTrl)
   * @param primaryPropertyName
   *          first property to look for, if secondaryProperty is null or value of this property is
   *          not null this one will be used
   * @param secondaryPropertyName
   *          second property to look for, if this is sent to null, primaryProperty will be always
   *          used. If this property is not null and value of primaryProperty is null, this one will
   *          be used
   * @return a translated name if found or otherwise the name of the owner
   */
  private static String getLabel(BaseOBObject owner, List<?> trlObjects,
      String primaryPropertyName, String secondaryPropertyName) {
    final String userLanguageId = OBContext.getOBContext().getLanguage().getId();
    for (Object o : trlObjects) {
      final BaseOBObject trlObject = (BaseOBObject) o;
      final String trlLanguageId = (String) DalUtil
          .getId(trlObject.get(FieldTrl.PROPERTY_LANGUAGE));
      if (trlLanguageId.equals(userLanguageId)) {
        if (secondaryPropertyName == null || trlObject.get(primaryPropertyName) != null) {
          return (String) trlObject.get(primaryPropertyName);
        }
        return (String) trlObject.get(secondaryPropertyName);
      }
    }

    // trl not found, return owner
    if (secondaryPropertyName == null || owner.get(primaryPropertyName) != null) {
      return (String) owner.get(primaryPropertyName);
    }
    return (String) owner.get(secondaryPropertyName);
  }

  /**
   * Returns the grid configuration based on the field and tab information
   * 
   * @param tab
   *          tab whose grid configuration is to be obtained.
   * @return the grid configuration
   */
  public static JSONObject getGridConfigurationSettings(Tab tab) {
    return getGridConfigurationSettings(null, tab);
  }

  /**
   * Returns the grid configuration of a field
   * 
   * @param field
   *          field whose grid configuration is to be obtained
   * @return the grid configuration
   */
  public static JSONObject getGridConfigurationSettings(Field field) {
    return getGridConfigurationSettings(field, field.getTab());
  }

  /**
   * Returns the grid configuration based on the field and tab information
   * 
   * @param field
   *          field whose grid configuration is to be obtained it can be null
   * @param tab
   *          tab whose grid configuration is to be obtained. If the field is not null, this
   *          parameter will be the tab of the field
   * @return the grid configuration
   */
  private static JSONObject getGridConfigurationSettings(Field field, Tab tab) {
    Boolean canSort = null;
    Boolean canFilter = null;
    Boolean filterOnChange = null;
    Boolean lazyFiltering = null;
    Boolean allowFkFilterByIdentifier = null;
    Boolean showFkDropdownUnfiltered = null;
    Boolean disableFkDropdown = null;
    String operator = null;
    Long thresholdToFilter = null;
    JSONObject result = new JSONObject();

    if (field != null && field.getId() != null) {
      if (canSort == null || canFilter == null || operator == null || filterOnChange == null
          || thresholdToFilter == null || allowFkFilterByIdentifier == null
          || showFkDropdownUnfiltered == null || disableFkDropdown == null) {
        List<Object> fieldParams = new ArrayList<Object>();
        String fieldConfsHql = " as p where p.field.id = ? ";
        fieldParams.add(field.getId());
        // Trying to get parameters from "Grid Configuration (Tab/Field)" -> "Field" window
        List<GCField> fieldConfs = OBDal.getInstance()
            .createQuery(GCField.class, fieldConfsHql, fieldParams).list();
        if (!fieldConfs.isEmpty()) {
          if (canSort == null) {
            if ("Y".equals(fieldConfs.get(0).getSortable())) {
              canSort = true;
            } else if ("N".equals(fieldConfs.get(0).getSortable())) {
              canSort = false;
            }
          }
          if (canFilter == null) {
            if ("Y".equals(fieldConfs.get(0).getFilterable())) {
              canFilter = true;
            } else if ("N".equals(fieldConfs.get(0).getFilterable())) {
              canFilter = false;
            }
          }
          if (operator == null) {
            if (fieldConfs.get(0).getTextFilterBehavior() != null
                && !"D".equals(fieldConfs.get(0).getTextFilterBehavior())) {
              operator = fieldConfs.get(0).getTextFilterBehavior();
            }
          }
          if (filterOnChange == null) {
            if ("Y".equals(fieldConfs.get(0).getFilterOnChange())) {
              filterOnChange = true;
            } else if ("N".equals(fieldConfs.get(0).getFilterOnChange())) {
              filterOnChange = false;
            }
          }
          if (allowFkFilterByIdentifier == null) {
            if ("Y".equals(fieldConfs.get(0).getAllowFilterByIdentifier())) {
              allowFkFilterByIdentifier = true;
            } else if ("N".equals(fieldConfs.get(0).getAllowFilterByIdentifier())) {
              allowFkFilterByIdentifier = false;
            }
          }
          if (showFkDropdownUnfiltered == null) {
            if ("Y".equals(fieldConfs.get(0).getIsFkDropdownUnfiltered())) {
              showFkDropdownUnfiltered = true;
            } else if ("N".equals(fieldConfs.get(0).getIsFkDropdownUnfiltered())) {
              showFkDropdownUnfiltered = false;
            }
          }
          if (disableFkDropdown == null) {
            if ("Y".equals(fieldConfs.get(0).getDisableFkCombo())) {
              disableFkDropdown = true;
            } else if ("N".equals(fieldConfs.get(0).getDisableFkCombo())) {
              disableFkDropdown = false;
            }
          }
          if (thresholdToFilter == null) {
            thresholdToFilter = fieldConfs.get(0).getThresholdToFilter();
          }
        }
      }
    }

    if (canSort == null || canFilter == null || operator == null || filterOnChange == null
        || thresholdToFilter == null || allowFkFilterByIdentifier == null
        || showFkDropdownUnfiltered == null) {
      List<Object> tabParams = new ArrayList<Object>();
      String tabConfsHql = " as p where p.tab.id = ? ";
      tabParams.add(tab.getId());
      // Trying to get parameters from "Grid Configuration (Tab/Field)" -> "Tab" window
      List<GCTab> tabConfs = OBDal.getInstance().createQuery(GCTab.class, tabConfsHql, tabParams)
          .list();
      if (!tabConfs.isEmpty()) {
        if (canSort == null) {
          if ("Y".equals(tabConfs.get(0).getSortable())) {
            canSort = true;
          } else if ("N".equals(tabConfs.get(0).getSortable())) {
            canSort = false;
          }
        }
        if (canFilter == null) {
          if ("Y".equals(tabConfs.get(0).getFilterable())) {
            canFilter = true;
          } else if ("N".equals(tabConfs.get(0).getFilterable())) {
            canFilter = false;
          }
        }
        if (operator == null) {
          if (tabConfs.get(0).getTextFilterBehavior() != null
              && !"D".equals(tabConfs.get(0).getTextFilterBehavior())) {
            operator = tabConfs.get(0).getTextFilterBehavior();
          }
        }
        if (filterOnChange == null) {
          if ("Y".equals(tabConfs.get(0).getFilterOnChange())) {
            filterOnChange = true;
          } else if ("N".equals(tabConfs.get(0).getFilterOnChange())) {
            filterOnChange = false;
          }
        }
        if (lazyFiltering == null) {
          if ("Y".equals(tabConfs.get(0).getIsLazyFiltering())) {
            lazyFiltering = true;
          } else if ("N".equals(tabConfs.get(0).getIsLazyFiltering())) {
            lazyFiltering = false;
          }
        }
        if (allowFkFilterByIdentifier == null) {
          if ("Y".equals(tabConfs.get(0).getAllowFilterByIdentifier())) {
            allowFkFilterByIdentifier = true;
          } else if ("N".equals(tabConfs.get(0).getAllowFilterByIdentifier())) {
            allowFkFilterByIdentifier = false;
          }
        }
        if (showFkDropdownUnfiltered == null) {
          if ("Y".equals(tabConfs.get(0).getIsFkDropDownUnfiltered())) {
            showFkDropdownUnfiltered = true;
          } else if ("N".equals(tabConfs.get(0).getIsFkDropDownUnfiltered())) {
            showFkDropdownUnfiltered = false;
          }
        }
        if (disableFkDropdown == null) {
          if ("Y".equals(tabConfs.get(0).getDisableFkCombo())) {
            disableFkDropdown = true;
          } else if ("N".equals(tabConfs.get(0).getDisableFkCombo())) {
            disableFkDropdown = false;
          }
        }
        if (thresholdToFilter == null) {
          thresholdToFilter = tabConfs.get(0).getThresholdToFilter();
        }
      }
    }

    if (canSort == null || canFilter == null || operator == null || filterOnChange == null
        || thresholdToFilter == null || showFkDropdownUnfiltered == null) {
      // Trying to get parameters from "Grid Configuration (System)" window
      List<GCSystem> sysConfs = OBDal.getInstance().createQuery(GCSystem.class, "").list();
      if (!sysConfs.isEmpty()) {
        if (canSort == null) {
          canSort = sysConfs.get(0).isSortable();
        }
        if (canFilter == null) {
          canFilter = sysConfs.get(0).isFilterable();
        }
        if (operator == null) {
          operator = sysConfs.get(0).getTextFilterBehavior();
        }
        if (filterOnChange == null) {
          filterOnChange = sysConfs.get(0).isFilterOnChange();
        }
        if (lazyFiltering == null) {
          lazyFiltering = sysConfs.get(0).isLazyFiltering();
        }
        if (thresholdToFilter == null) {
          thresholdToFilter = sysConfs.get(0).getThresholdToFilter();
        }
        if (allowFkFilterByIdentifier == null) {
          allowFkFilterByIdentifier = sysConfs.get(0).isAllowFilterByIdentifier();
        }
        if (showFkDropdownUnfiltered == null) {
          showFkDropdownUnfiltered = sysConfs.get(0).isFkDropDownUnfiltered();
        }
        if (disableFkDropdown == null) {
          disableFkDropdown = sysConfs.get(0).isDisableFkCombo();
        }
      }
    }

    if (operator != null) {
      if ("IC".equals(operator)) {
        operator = "iContains";
      } else if ("IS".equals(operator)) {
        operator = "iStartsWith";
      } else if ("IE".equals(operator)) {
        operator = "iEquals";
      } else if ("C".equals(operator)) {
        operator = "contains";
      } else if ("S".equals(operator)) {
        operator = "startsWith";
      } else if ("E".equals(operator)) {
        operator = "equals";
      }
    }

    try {
      if (canSort != null) {
        result.put("canSort", canSort);
      }
      if (canFilter != null) {
        result.put("canFilter", canFilter);
      }
      if (operator != null) {
        result.put("operator", operator);
      }
      // If the tab uses lazy filtering, the fields should not filter on change
      if (Boolean.TRUE.equals(lazyFiltering)) {
        filterOnChange = false;
      }
      if (filterOnChange != null) {
        result.put("filterOnChange", filterOnChange);
      }
      if (thresholdToFilter != null) {
        result.put("thresholdToFilter", thresholdToFilter);
      }
      if (allowFkFilterByIdentifier != null) {
        result.put("allowFkFilterByIdentifier", allowFkFilterByIdentifier);
      }
      if (showFkDropdownUnfiltered != null) {
        result.put("showFkDropdownUnfiltered", showFkDropdownUnfiltered);
      }
      if (disableFkDropdown != null) {
        result.put("disableFkDropdown", disableFkDropdown);
      }
    } catch (JSONException e) {
      log.error("Couldn't get field property value");
    }
    return result;
  }
}
