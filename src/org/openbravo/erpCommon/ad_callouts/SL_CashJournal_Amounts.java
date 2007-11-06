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
 * All portions are Copyright (C) 2001-2006 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
*/
package org.openbravo.erpCommon.ad_callouts;

import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.xmlEngine.XmlDocument;
import org.openbravo.utils.FormatUtilities;
import java.io.*;
import java.math.BigDecimal;
import javax.servlet.*;
import javax.servlet.http.*;


public class SL_CashJournal_Amounts extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;
  static final BigDecimal ZERO = new BigDecimal(0.0);

  public void init (ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);
    if (vars.commandIn("DEFAULT")) {
      String strChanged = vars.getStringParameter("inpLastFieldChanged");
      if (log4j.isDebugEnabled()) log4j.debug("CHANGED: " + strChanged);
      String strOrder = vars.getStringParameter("inpcOrderId");
      String strDebtPayment = vars.getStringParameter("inpcDebtPaymentId");
      String strAmount = vars.getStringParameter("inpamount");
      String strDiscount = vars.getStringParameter("inpdiscountamt");
      String strwriteoff = vars.getStringParameter("inpwriteoffamt");
      String strTabId = vars.getStringParameter("inpTabId");
      String strCashId = vars.getStringParameter("inpcCashId");
      
      try {
        printPage(response, vars, strChanged, strOrder, strDebtPayment, strAmount, strDiscount, strwriteoff, strTabId, strCashId);
      } catch (ServletException ex) {
        pageErrorCallOut(response);
      }
    } else pageError(response);
  }

  void printPage(HttpServletResponse response, VariablesSecureApp vars, String strChanged, String strOrder, String strDebtPayment, String strAmount, String strDiscount, String strwriteoff, String strTabId, String strCashId) throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: dataSheet");
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_callouts/CallOut").createXmlDocument();
    String Amount = null;
    String strDescription = null;

    if (strChanged.equals("inpcOrderId")) Amount = SLCashJournalAmountsData.amountOrder(this, strOrder);
    else if (strChanged.equals("inpcDebtPaymentId")) Amount = SLCashJournalAmountsData.amountDebtPayment(this, strCashId, strDebtPayment);
    else Amount = strAmount;

    if (!strDebtPayment.equals("")) strDescription = SLCashJournalAmountsData.debtPaymentDescription(this, strDebtPayment);
    else strDescription="";

    StringBuffer resultado = new StringBuffer();
    resultado.append("var calloutName='SL_CashJournal_Amounts';\n\n");
    resultado.append("var respuesta = new Array(");
    resultado.append("new Array(\"inpdescription\", \"" + FormatUtilities.replaceJS(strDescription) + "\"),");
    resultado.append("new Array(\"inpamount\", \"" + Amount + "\")");

    resultado.append(");");
    xmlDocument.setParameter("array", resultado.toString());
    xmlDocument.setParameter("frameName", "frameAplicacion");
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }
}
