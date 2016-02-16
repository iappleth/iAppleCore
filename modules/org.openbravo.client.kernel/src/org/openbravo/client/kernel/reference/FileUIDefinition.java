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
 * All portions are Copyright (C) 2015 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.kernel.reference;

import java.math.BigDecimal;
import java.text.NumberFormat;

import org.codehaus.jettison.json.JSONObject;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.ui.Field;

/**
 * Implementation of the image ui definition.
 * 
 * @author aro
 */
public class FileUIDefinition extends UIDefinition {

  @Override
  public String getParentType() {
    return "image";
  }

  @Override
  public String getFormEditorType() {
    return "OBFileItem";
  }

  @Override
  public String getTypeProperties() {
    return "shortDisplayFormatter: function(value, field, component, record) {" + "return \"\";"
        + "},";
  }

  @Override
  public String getGridFieldProperties(Field field) {
    return super.getGridFieldProperties(field) + ", canGroupBy: false";
  }

  @Override
  public String getFieldProperties(Field field) {
    String fieldProperties = super.getFieldProperties(field);
    try {

      NumberFormat f = Utility.getFormat(RequestContext.get().getVariablesSecureApp(),
          "amountInform");
      BigDecimal maxsize = field.getColumn().getFilemaxsize();
      String maxsizeformat = maxsize == null ? null : f.format(maxsize);

      JSONObject obj;
      if (fieldProperties.equals("")) {
        obj = new JSONObject();
      } else {
        obj = new JSONObject(fieldProperties);
      }

      obj.put("fileExtensions", field.getColumn().getFileextensions());
      obj.put("fileMaxSize", maxsize);
      obj.put("fileMaxSizeFormat", maxsizeformat);
      obj.put("fileMaxSizeUnit", field.getColumn().getFilemaxsizeunit());
      return obj.toString();
    } catch (Exception e) { // ignore
      log.error("There was an error when calculating the properties of an File BLOB field", e);
      return fieldProperties;
    }
  }
}
