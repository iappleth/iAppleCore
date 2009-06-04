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
 * All portions are Copyright (C) 2008-2009 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.erpCommon.ad_callouts;

import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.data.FieldProvider;
import org.openbravo.erpCommon.utility.ComboTableData;
import org.openbravo.erpCommon.utility.DateTimeData;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.utils.FormatUtilities;
import org.openbravo.xmlEngine.XmlDocument;

public class SL_RequisitionLine_Product extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void init(ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException,
      ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);
    if (vars.commandIn("DEFAULT")) {
      String strChanged = vars.getStringParameter("inpLastFieldChanged");
      if (log4j.isDebugEnabled())
        log4j.debug("CHANGED: " + strChanged);

      String strMProductID = vars.getStringParameter("inpmProductId");
      String strWindowId = vars.getStringParameter("inpwindowId");
      String strTabId = vars.getStringParameter("inpTabId");
      String strRequisition = vars.getStringParameter("inpmRequisitionId");
      String strPriceListId = vars.getStringParameter("inpmPricelistId");
      String strAttributeSetInstance = vars.getStringParameter("inpmProductId_ATR");
      String strUOM = vars.getStringParameter("inpmProductId_UOM");
      try {
        printPage(response, vars, strMProductID, strWindowId, strTabId, strAttributeSetInstance,
            strUOM, strRequisition, strPriceListId, strChanged);
      } catch (ServletException ex) {
        pageErrorCallOut(response);
      }
    } else
      pageError(response);
  }

  private void printPage(HttpServletResponse response, VariablesSecureApp vars, String strMProductID,
      String strWindowId, String strTabId, String strAttribute, String strUOM,
      String strRequisition, String strPriceListId, String strChanged) throws IOException,
      ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: dataSheet");
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/ad_callouts/CallOut").createXmlDocument();
    String strMessage = "";

    StringBuffer resultado = new StringBuffer();

    resultado.append("var calloutName='SL_Requisition_Product';\n\n");
    resultado.append("var respuesta = new Array(\n");
    if (!strMProductID.equals("")) {
      String strDueDate = vars.getStringParameter("inpneedbydate", DateTimeData.today(this));
      if (strPriceListId.equals(""))
        strPriceListId = SLRequisitionLineProductData.selectPriceList(this, strRequisition);
      if (!strPriceListId.equals("")) {
        String strPriceListVersion = SLRequisitionLineProductData.selectPriceListVersion(this,
            strPriceListId, strDueDate);
        if (!strPriceListVersion.equals("")) {
          SLRequisitionLineProductData[] prices = SLRequisitionLineProductData.getPrices(this,
              strMProductID, strPriceListVersion);
          if (prices != null && prices.length > 0
              && !(prices[0].pricelist.equals("0") && prices[0].pricestd.equals("0"))) {
            String strPriceList = "";
            String strPriceActual = "";
            if (prices[0].pricelist.equals("0") && prices[0].pricestd.equals("0"))
              strMessage = "PriceNotFound";
            else {
              strPriceList = prices[0].pricelist;
              strPriceActual = prices[0].pricestd;
              // Discount...
              if (strPriceList.startsWith("\""))
                strPriceList = strPriceList.substring(1, strPriceList.length() - 1);
              if (strPriceActual.startsWith("\""))
                strPriceActual = strPriceActual.substring(1, strPriceActual.length() - 1);
              BigDecimal priceList = (strPriceList.equals("") ? new BigDecimal(0.0)
                  : new BigDecimal(strPriceList));
              BigDecimal priceActual = (strPriceActual.equals("") ? new BigDecimal(0.0)
                  : new BigDecimal(strPriceActual));
              BigDecimal discount = new BigDecimal(0.0);
              if (priceList.compareTo(discount) != 0) {
                discount = (((priceList.subtract(priceActual)).divide(priceList, 12,
                    BigDecimal.ROUND_HALF_EVEN)).multiply(new BigDecimal("100"))).setScale(2,
                    BigDecimal.ROUND_HALF_UP);
              }
              resultado.append("new Array(\"inppricelist\", "
                  + (strPriceList.equals("") ? "\"\"" : strPriceList) + "),\n");
              resultado.append("new Array(\"inppriceactual\", "
                  + (strPriceActual.equals("") ? "\"\"" : strPriceActual) + "),\n");
              resultado.append("new Array(\"inpdiscount\", \"" + discount.toString() + "\"),\n");
            }
          } else
            strMessage = "PriceNotFound";
        } else
          strMessage = "PriceListVersionNotFound";
      }
    }

    if (strChanged.equals("inpmProductId")) {
      resultado
          .append("new Array(\"inpcUomId\", "
          + (strUOM.equals("") ? "\"\"" : "\"" + strUOM + "\"")
          + "),\n");
      if (strAttribute.startsWith("\""))
        strAttribute = strAttribute.substring(1, strAttribute.length() - 1);
      resultado.append("new Array(\"inpmAttributesetinstanceId\", \"" + strAttribute + "\"),\n");
      resultado.append("new Array(\"inpmAttributesetinstanceId_R\", \""
          + FormatUtilities.replaceJS(SLRequisitionLineProductData.attribute(this, strAttribute))
          + "\"),\n");

      String strHasSecondaryUOM = SLRequisitionLineProductData.hasSecondaryUOM(this, strMProductID);
      resultado.append("new Array(\"inphasseconduom\", " + strHasSecondaryUOM + "),\n");
      resultado.append("new Array(\"inpmProductUomId\", ");
      FieldProvider[] tld = null;
      try {
        ComboTableData comboTableData = new ComboTableData(vars, this, "TABLEDIR",
            "M_Product_UOM_ID", "", "M_Product_UOM_ID", Utility.getContext(this, vars, "#AccessibleOrgTree",
                "SLRequisitionLineProduct"), Utility.getContext(this, vars, "#User_Client",
                "SLRequisitionLineProduct"), 0);
        Utility.fillSQLParameters(this, vars, null, comboTableData, strTabId, "");
        tld = comboTableData.select(false);
        comboTableData = null;
      } catch (Exception ex) {
        throw new ServletException(ex);
      }

      if (tld != null && tld.length > 0) {
        resultado.append("new Array(");
        for (int i = 0; i < tld.length; i++) {
          resultado.append("\n\tnew Array(\"" + tld[i].getField("id") + "\", \""
              + FormatUtilities.replaceJS(tld[i].getField("name")) + "\", \"false\")");
          if (i < tld.length - 1)
            resultado.append(",");
        }
        resultado.append(")");
      } else
        resultado.append("null");
      resultado.append("),\n");
      // To set the cursor focus in the amount field
      resultado.append("new Array(\"CURSOR_FIELD\", \"inpqty\"),\n");
    }

    if (!strMessage.equals(""))
      resultado.append("new Array('MESSAGE', \""
          + FormatUtilities.replaceJS(Utility.messageBD(this, strMessage, vars.getLanguage()))
          + "\"),\n");
    resultado.append("new Array(\"EXECUTE\", \"displayLogic();\")\n");
    resultado.append(");");
    xmlDocument.setParameter("array", resultado.toString());
    xmlDocument.setParameter("frameName", "appFrame");
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }
}
