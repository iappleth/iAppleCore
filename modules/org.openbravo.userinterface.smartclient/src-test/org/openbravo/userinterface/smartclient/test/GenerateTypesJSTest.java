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
 * The Initial Developer of the Original Code is Openbravo SLU 
 * All portions are Copyright (C) 2009 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.userinterface.smartclient.test;

import java.util.HashMap;

import org.openbravo.client.freemarker.FreemarkerTemplateProcessor;
import org.openbravo.client.kernel.Component;
import org.openbravo.client.kernel.ComponentGenerator;
import org.openbravo.client.kernel.TemplateProcessorRegistry;
import org.openbravo.test.base.BaseTest;
import org.openbravo.userinterface.smartclient.SmartClientComponentProvider;
import org.openbravo.userinterface.smartclient.SmartClientConstants;
import org.openbravo.userinterface.smartclient.TypesComponent;

/**
 * Test the {@link TypesComponent} and its template.
 * 
 * @author mtaal
 */

public class GenerateTypesJSTest extends BaseTest {

  /**
   * Tests retrieving and generating the application JS.
   */
  public void testComponentGeneration() throws Exception {
    setSystemAdministratorContext();

    // this registers the smart client provider with the component
    // provider registry
    new SmartClientComponentProvider().initialize();

    TemplateProcessorRegistry.getInstance().registerTemplateProcessor(
        new FreemarkerTemplateProcessor());

    final Component component = new SmartClientComponentProvider().getComponent(
        SmartClientConstants.SC_TYPES_COMPONENT_ID, new HashMap<String, Object>());

    final String output = ComponentGenerator.getInstance().generate(component);
    System.err.println(output);
  }

}