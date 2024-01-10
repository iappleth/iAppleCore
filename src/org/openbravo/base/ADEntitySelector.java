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
 * All portions are Copyright (C) 2022 Openbravo SLU
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.base;

import javax.enterprise.util.AnnotationLiteral;

import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.erpCommon.ad_process.ADProcessID;

/**
 * Selector for the {@link ADProcessID} annotation
 */
@SuppressWarnings("all")
public class ADEntitySelector extends AnnotationLiteral<Entity> implements Entity {
  private static final long serialVersionUID = 1L;

  final Class<? extends BaseOBObject> value;

  public ADEntitySelector(Class<? extends BaseOBObject> value) {
    this.value = value;
  }

  @Override
  public Class<? extends BaseOBObject> value() {
    return value;
  }
}
