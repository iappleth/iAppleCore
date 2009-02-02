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
 * All portions are Copyright (C) 2008 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.test.ant;

import org.apache.log4j.PropertyConfigurator;
import org.openbravo.base.exception.OBException;
import org.openbravo.wad.Wad;

/**
 * Tests an ant task.
 * 
 * @author mtaal
 */

public class CompileTest extends BaseAntTest {

  public void testCompileComplete() {
    PropertyConfigurator.configure(this.getClass().getResource("/log4j.properties"));

    final String[] args = new String[5];
    args[0] = "config"; // ${base.config}'
    args[1] = "%";// '${tab}'
    args[2] = "srcAD/org/openbravo/erpWindows"; // '${build.AD}/org/openbravo/erpWindows'
    args[3] = "srcAD/org/openbravo/erpCommon"; //
    args[4] = "build/javasqlc/src"; // '${build.sqlc}/src'
    // args[5] = '${webTab}'
    // '${build.AD}/org/openbravo/erpCommon/ad_actionButton'
    // '${base.design}' '${base.translate.structure}' '${client.web.xml}'
    // '..' '${attach.path}' '${web.url}' '${base.src}' '${complete}'
    // '${module}'
    try {
      Wad.main(args);
    } catch (final Exception e) {
      throw new OBException(e);
    }

    // doTest("compile");
  }
}