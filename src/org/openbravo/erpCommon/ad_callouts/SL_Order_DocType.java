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
import javax.servlet.*;
import javax.servlet.http.*;


public class SL_Order_DocType extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void init (ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);
    if (vars.commandIn("DEFAULT")) {
      String strChanged = vars.getStringParameter("inpLastFieldChanged");
      if (log4j.isDebugEnabled()) log4j.debug("CHANGED: " + strChanged);
      String strBPartner = vars.getStringParameter("inpcBpartnerId");
      String strDocTypeTarget = vars.getStringParameter("inpcDoctypetargetId");
      String strDocType = vars.getStringParameter("inpcDoctypeId");
      String docNo = vars.getStringParameter("inpdocumentno");
      String strOrder = vars.getStringParameter("inpcOrderId");
      String strDescription = vars.getStringParameter("inpdescription");
      String strTabId = vars.getStringParameter("inpTabId");
      
      try {
        printPage(response, vars, strBPartner, strDocTypeTarget, strDocType, docNo, strOrder, strDescription, strTabId);
      } catch (ServletException ex) {
        pageErrorCallOut(response);
      }
    } else pageError(response);
  }

  void printPage(HttpServletResponse response, VariablesSecureApp vars, String strBPartner, String strDocTypeTarget, String strDocType, String docNo, String strOrder, String strDescription, String strTabId) throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: dataSheet");
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_callouts/CallOut").createXmlDocument();

    StringBuffer resultado = new StringBuffer();
    if (strDocTypeTarget.equals("")) resultado.append("var respuesta = null;");
    else {
      resultado.append("var calloutName='SL_Order_DocType';\n\n");
      resultado.append("var respuesta = new Array(");
      String PaymentRule = "P";
      String InvoiceRule = "D";
      String DeliveryRule = "A";
      boolean newDocNo = docNo.equals("");
      if (!newDocNo && docNo.startsWith("<") && docNo.endsWith(">")) newDocNo = true;
      String AD_Sequence_ID = "0";
      SLOrderDocTypeData[] data=null;

      if (!newDocNo && Integer.valueOf(strDocType).intValue() != 0) {
        data = SLOrderDocTypeData.select(this, strDocType);
        if (data!=null && data.length>0) {
          AD_Sequence_ID = data[0].adSequenceId;
        }
      }
      String DocSubTypeSO = "";
      boolean IsSOTrx = true;
      SLOrderDocTypeData[] dataNew = SLOrderDocTypeData.select(this, strDocTypeTarget);
      if (dataNew!=null && dataNew.length>0) {
        DocSubTypeSO = dataNew[0].docsubtypeso;
        if (DocSubTypeSO == null) DocSubTypeSO = "--";
        String strOldDocTypeTarget = SLOrderDocTypeData.selectOldDocSubType(this, strOrder);
        if (!DocSubTypeSO.equals("OB")&& strOldDocTypeTarget.equals("OB")){
          String strOldDocNo = SLOrderDocTypeData.selectOldDocNo(this, strOrder);
          resultado.append("new Array(\"inpdescription\", \"" + FormatUtilities.replaceJS("Presupuesto Nº: " + strOldDocNo + ". " + strDescription) + "\"),\n");
        }
        resultado.append("new Array(\"inpordertype\", \"" + DocSubTypeSO + "\")\n");
        PaymentRule="P";
        InvoiceRule=(DocSubTypeSO.equals("PR")?"I":"D");
        DeliveryRule="A";
        if (dataNew[0].isdocnocontrolled.equals("Y")) {
          if (!newDocNo && !AD_Sequence_ID.equals(dataNew[0].adSequenceId)) newDocNo = true;
          if (newDocNo) {
            if (vars.getRole().equalsIgnoreCase("System") && Double.valueOf(vars.getClient()).doubleValue() < 1000000.0)
              resultado.append(", new Array(\"inpdocumentno\", \"<" + dataNew[0].currentnextsys + ">\")\n");
            else
              resultado.append(", new Array(\"inpdocumentno\", \"<" + dataNew[0].currentnext + ">\")\n");
          }
        }
        if (dataNew[0].issotrx.equals("N")) IsSOTrx = false;
      }

      if (!DocSubTypeSO.equalsIgnoreCase("WR")) {
        SLOrderDocTypeData[] dataBP = SLOrderDocTypeData.BPartner(this, strBPartner);
        if (dataBP!=null && dataBP.length>0) {
          String s = (IsSOTrx ? dataBP[0].paymentrule : dataBP[0].paymentrulepo);
          if (s != null && s.length() != 0) {
            if (s.equals("B")) s = "P";
            if (IsSOTrx && (s.equals("S") || s.equals("U"))) s = "P";
            if (!s.equals("")) PaymentRule=s;
          }
          InvoiceRule = (DocSubTypeSO.equals("PR")?"I":dataBP[0].invoicerule);
          DeliveryRule= dataBP[0].deliveryrule;
          if (!dataBP[0].deliveryviarule.equals("")) resultado.append(", new Array(\"inpdeliveryviarule\", \"" + dataBP[0].deliveryviarule + "\")\n");
        }
      }
      if (!PaymentRule.equals("")) resultado.append(", new Array(\"inppaymentrule\", \"" + PaymentRule + "\")\n");
      if (!InvoiceRule.equals("")) resultado.append(", new Array(\"inpinvoicerule\", \"" + InvoiceRule + "\")\n");
      if (!DeliveryRule.equals("")) resultado.append(", new Array(\"inpdeliveryrule\", \"" + DeliveryRule + "\")\n");
      resultado.append(", new Array(\"EXECUTE\", \"displayLogic();\")\n");
      resultado.append(");\n");
    }

    xmlDocument.setParameter("array", resultado.toString());
    xmlDocument.setParameter("frameName", "frameAplicacion");
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }
}
