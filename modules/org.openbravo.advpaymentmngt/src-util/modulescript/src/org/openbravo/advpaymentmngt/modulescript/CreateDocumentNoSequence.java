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
 * All portions are Copyright (C) 2010 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 *************************************************************************
 */
package org.openbravo.modulescript;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.UUID;
import org.apache.log4j.Logger;

import javax.servlet.ServletException;

import org.openbravo.database.ConnectionProvider;

public class CreateDocumentNoSequence extends ModuleScript{

  @Override
  //Inserting DocumentNo sequence for existing tables that miss them
  public void execute() {
    try {
      ConnectionProvider cp = getConnectionProvider();
      CreateDocumentNoSequenceData[] data = CreateDocumentNoSequenceData.select(cp);
      for (int i = 0; i < data.length; i++) {
        CreateDocumentNoSequenceData.insertDocumentNoSequence(cp.getConnection(), cp, data[i].client, data[i].tablename);
      }
    } catch (Exception e) {
      handleError(e);
    }
  }
}
