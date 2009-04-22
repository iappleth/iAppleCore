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

package org.openbravo.test.system;

import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.openbravo.service.system.ApplicationDictionaryValidator;
import org.openbravo.service.system.DatabaseValidator;
import org.openbravo.service.system.ModuleValidator;
import org.openbravo.service.system.SystemValidationResult;
import org.openbravo.service.system.SystemValidationResult.SystemValidationType;
import org.openbravo.test.base.BaseTest;

/**
 * Tests System Validation.
 * 
 * @see DatabaseValidator
 * @see ModuleValidator
 * 
 * @author mtaal
 */

public class SystemValidatorTest extends BaseTest {

  private static final Logger log = Logger.getLogger(SystemValidatorTest.class);

  public void _testSystemValidation() {
    setUserContext("0");
    final ApplicationDictionaryValidator adValidator = new ApplicationDictionaryValidator();
    final Map<String, SystemValidationResult> results = adValidator.validate();

    for (String key : results.keySet()) {
      log.debug("++++++++++++++++++++++++++++++++++++++++++++++++++");
      log.debug(key);
      log.debug("++++++++++++++++++++++++++++++++++++++++++++++++++");
      final SystemValidationResult result = results.get(key);
      printResult(result);
    }
  }

  public void testModulesValidation() {
    setUserContext("0");
    final ModuleValidator moduleValidator = new ModuleValidator();
    final SystemValidationResult result = moduleValidator.validate();
    printResult(result);
  }

  private void printResult(SystemValidationResult result) {
    for (SystemValidationType validationType : result.getWarnings().keySet()) {
      log.debug("\n+++++++++++++++++++++++++++++++++++++++++++++++++++");
      log.debug("Warnings for Validation type: " + validationType);
      log.debug("\n+++++++++++++++++++++++++++++++++++++++++++++++++++");
      final List<String> warnings = result.getWarnings().get(validationType);
      for (String warning : warnings) {
        log.debug(warning);
      }
    }

    final StringBuilder sb = new StringBuilder();
    for (SystemValidationType validationType : result.getErrors().keySet()) {
      sb.append("\n+++++++++++++++++++++++++++++++++++++++++++++++++++");
      sb.append("Errors for Validation type: " + validationType);
      sb.append("\n+++++++++++++++++++++++++++++++++++++++++++++++++++");
      final List<String> errors = result.getErrors().get(validationType);
      for (String err : errors) {
        sb.append(err);
        if (sb.length() > 0) {
          sb.append("\n");
        }
      }
      if (errors.size() > 0) {
        fail(sb.toString());
      }
    }
    log.debug(sb.toString());
  }

}