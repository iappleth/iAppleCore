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
 * All portions are Copyright (C) 2009 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.service.json;

/**
 * Defines the different ways data should be resolved and converted to json to be usable by the
 * client.
 * 
 * Is used for example to convert a business object to a json data. Short means that only the id,
 * identifier and active are converted, full means that the full business object is converted.
 * 
 * @author mtaal
 */
public enum DataResolvingMode {

  /**
   * Defines that only specific parts of a business object/data is returned.
   */
  SHORT,

  /**
   * Defines that all information of a business object/data is returned.
   */
  FULL
}
