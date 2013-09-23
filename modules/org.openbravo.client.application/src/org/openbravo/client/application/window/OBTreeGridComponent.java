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
 * All portions are Copyright (C) 2010-2013 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.application.window;

import java.util.HashMap;
import java.util.Map;

import org.openbravo.client.kernel.BaseTemplateComponent;
import org.openbravo.client.kernel.Template;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.ui.Tab;
import org.openbravo.model.ad.utility.ADTreeType;

/**
 * The backing bean for generating the OBTreeGridPopup client-side representation.
 * 
 * @author AugustoMauch
 */
public class OBTreeGridComponent extends BaseTemplateComponent {

  private static final String DEFAULT_TEMPLATE_ID = "74451C30650946FC855FCFDB4577070C";
  protected static final Map<String, String> TEMPLATE_MAP = new HashMap<String, String>();

  private Tab tab;
  private OBViewTab viewTab;
  private String referencedTableId;

  protected Template getComponentTemplate() {
    final String windowType = tab.getWindow().getWindowType();
    if (TEMPLATE_MAP.containsKey(windowType)) {
      return OBDal.getInstance().get(Template.class, TEMPLATE_MAP.get(windowType));
    }
    return OBDal.getInstance().get(Template.class, DEFAULT_TEMPLATE_ID);
  }

  public Tab getTab() {
    return tab;
  }

  public void setTab(Tab tab) {
    this.tab = tab;
  }

  public OBViewTab getViewTab() {
    return viewTab;
  }

  public void setViewTab(OBViewTab viewTab) {
    this.viewTab = viewTab;
  }

  public String getReferencedTableId() {
    return tab.getTable().getId();
  }

  public void setReferencedTableId(String referencedTableId) {
    this.referencedTableId = referencedTableId;
  }

  public boolean isOrderedTree() {
    ADTreeType treeType = tab.getTable().getTreeCategory();
    return treeType.isOrdered();
  }

}
