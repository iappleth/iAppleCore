/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.0  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html 
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License. 
 * The Original Code is Openbravo ERP. 
 * The Initial Developer of the Original Code is Openbravo SL 
 * All portions are Copyright (C) 2009 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.service.system;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;

/**
 * Contains information of all the warnings and errors detected during the WAD validation
 * 
 */
public class WADValidationResult {
  Logger log = Logger.getLogger(WADValidationResult.class);

  /**
   * Types of possible WAD validations, they have an identifier and a description
   * 
   */
  public enum WADValidationType {
    SQL("SQL"), MISSING_IDENTIFIER("Missing Identifier"), MISSING_KEY("Missing Key Column"), MODEL_OBJECT(
        "Model Object");

    private String description;

    WADValidationType(String description) {
      this.description = description;
    }

    /**
     * Returns the description for the validation type
     * 
     * @return description
     */
    public String getDescription() {
      return description;
    }
  }

  private HashMap<WADValidationType, List<String>> errors = new HashMap<WADValidationType, List<String>>();
  private HashMap<WADValidationType, List<String>> warnings = new HashMap<WADValidationType, List<String>>();

  /**
   * Adds a warning message to a validation type
   * 
   * @param validationType
   *          validation type to add the warning to
   * @param warning
   *          warning message
   */
  public void addWarning(WADValidationType validationType, String warning) {
    addToResult(warnings, validationType, warning);
  }

  /**
   * Adds an error message to a validation type
   * 
   * @param validationType
   *          validation type to add the error to
   * @param error
   *          error message
   */
  public void addError(WADValidationType validationType, String warning) {
    addToResult(errors, validationType, warning);
  }

  private void addToResult(Map<WADValidationType, List<String>> result,
      WADValidationType validationType, String msg) {

    List<String> msgList = result.get(validationType);
    if (msgList == null) {
      msgList = new ArrayList<String>();
      result.put(validationType, msgList);
    }
    msgList.add(msg);
  }

  /**
   * Returns true in case the validation contain errors
   * 
   * @return
   */
  public boolean hasErrors() {
    return errors.size() > 0;
  }

  /**
   * Prints the result in the log
   */
  public void printLog(boolean stopOnError) {
    for (WADValidationType type : warnings.keySet()) {
      log.warn("+++++++++++++++++++++++++++++++++++++++++++++++++++");
      log.warn("Warnings for Validation type: " + type.getDescription());
      log.warn("+++++++++++++++++++++++++++++++++++++++++++++++++++");
      for (String warn : warnings.get(type)) {
        log.warn(warn);
      }
    }

    if (!stopOnError && errors.size() > 0) {
      log.error("The following errors during validation do not stop the");
      log.error("compilation process to allow backwards compatibility for");
      log.error("modules, but they MUST be fixed because in future core ");
      log.error("releases they will not be allowed.");
    }

    for (WADValidationType type : errors.keySet()) {
      log.error("+++++++++++++++++++++++++++++++++++++++++++++++++++");
      log.error("Errors for Validation type: " + type.getDescription());
      log.error("+++++++++++++++++++++++++++++++++++++++++++++++++++");
      for (String error : errors.get(type)) {
        log.error(error);
      }
    }

  }
}
