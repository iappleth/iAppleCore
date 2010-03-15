/*
 ******************************************************************************
 * The contents of this file are subject to the   Compiere License  Version 1.1
 * ("License"); You may not use this file except in compliance with the License
 * You may obtain a copy of the License at http://www.compiere.org/license.html
 * Software distributed under the License is distributed on an  "AS IS"  basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for
 * the specific language governing rights and limitations under the License.
 * The Original Code is                  Compiere  ERP & CRM  Business Solution
 * The Initial Developer of the Original Code is Jorg Janke  and ComPiere, Inc.
 * Portions created by Jorg Janke are Copyright (C) 1999-2001 Jorg Janke, parts
 * created by ComPiere are Copyright (C) ComPiere, Inc.;   All Rights Reserved.
 * Contributor(s): Openbravo SLU
 * Contributions are Copyright (C) 2001-2009 Openbravo S.L.U.
 ******************************************************************************
 */
package org.openbravo.erpCommon.ad_forms;

import java.sql.Connection;

import javax.servlet.ServletException;

import org.apache.log4j.Logger;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.database.ConnectionProvider;

public abstract class DocGLJournalTemplate {
  private static final long serialVersionUID = 1L;
  static Logger log4jDocGLJournal = Logger.getLogger(DocInvoice.class);

  /**
   * Constructor
   */
  public DocGLJournalTemplate() {
  }

  /**
   * Create Facts (the accounting logic) for GLJ. (only for the accounting scheme, it was created)
   * 
   * <pre>
   *      account     DR          CR
   * </pre>
   * 
   * @param as
   *          acct schema
   * @return Fact
   */
  public abstract Fact createFact(DocGLJournal docGLJournal, AcctSchema as,
      ConnectionProvider conn, Connection con, VariablesSecureApp vars) throws ServletException;

  public String getServletInfo() {
    return "Servlet for the accounting";
  } // end of getServletInfo() method
}
