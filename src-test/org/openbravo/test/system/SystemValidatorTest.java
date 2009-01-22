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

import java.util.Map;

import org.openbravo.service.system.ApplicationDictionaryValidator;
import org.openbravo.service.system.ModuleValidator;
import org.openbravo.service.system.SystemValidationResult;
import org.openbravo.test.base.BaseTest;

/**
 * Test the System Validation.
 * 
 * @author mtaal
 */

public class SystemValidatorTest extends BaseTest {

    public void _testSystemValidation() {
	setErrorOccured(true);
	setUserContext("0");
	final ApplicationDictionaryValidator adValidator = new ApplicationDictionaryValidator();
	final Map<String, SystemValidationResult> results = adValidator
		.validate();

	for (String key : results.keySet()) {
	    System.err
		    .println("++++++++++++++++++++++++++++++++++++++++++++++++++");
	    System.err.println(key);
	    System.err
		    .println("++++++++++++++++++++++++++++++++++++++++++++++++++");
	    final SystemValidationResult result = results.get(key);
	    for (String warning : result.getWarnings()) {
		System.err.println("Warning: " + warning);
	    }
	    System.err.println("------------------------------------");
	    for (String error : result.getErrors()) {
		System.err.println("Error: " + error);
	    }
	}
	setErrorOccured(false);
    }

    public void testModulesValidation() {
	setErrorOccured(true);
	setUserContext("0");
	final ModuleValidator moduleValidator = new ModuleValidator();
	final SystemValidationResult result = moduleValidator.validate();

	for (String warning : result.getWarnings()) {
	    System.err.println("Warning: " + warning);
	}
	for (String error : result.getErrors()) {
	    System.err.println("Error: " + error);
	}
	setErrorOccured(false);
    }
}