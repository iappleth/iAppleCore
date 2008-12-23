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
 * All portions are Copyright (C) 2001-2008 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.erpCommon.ad_callouts;

import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.xmlEngine.XmlDocument;
import org.openbravo.utils.FormatUtilities;
import org.openbravo.erpCommon.utility.*;
import org.openbravo.data.FieldProvider;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class SL_InOutLine_Product extends HttpSecureAppServlet {
    private static final long serialVersionUID = 1L;

    public void init(ServletConfig config) {
        super.init(config);
        boolHist = false;
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ServletException {
        VariablesSecureApp vars = new VariablesSecureApp(request);
        if (vars.commandIn("DEFAULT")) {
            String strChanged = vars.getStringParameter("inpLastFieldChanged");
            if (log4j.isDebugEnabled())
                log4j.debug("CHANGED: " + strChanged);
            String strLocator = vars.getStringParameter("inpmProductId_LOC");
            String strQty = vars.getStringParameter("inpmProductId_QTY");
            String strUOM = vars.getStringParameter("inpmProductId_UOM");
            String strAttribute = vars.getStringParameter("inpmProductId_ATR");
            String strQtyOrder = vars.getStringParameter("inpmProductId_PQTY");
            String strPUOM = vars.getStringParameter("inpmProductId_PUOM");
            String strMProductID = vars.getStringParameter("inpmProductId");
            String strWindowId = vars.getStringParameter("inpwindowId");
            String strIsSOTrx = Utility.getContext(this, vars, "isSOTrx",
                    strWindowId);
            String strWharehouse = Utility.getContext(this, vars,
                    "#M_Warehouse_ID", strWindowId);
            String strTabId = vars.getStringParameter("inpTabId");
            String strmInoutlineId = vars.getStringParameter("inpmInoutlineId");

            try {
                printPage(response, vars, strLocator, strQty, strUOM,
                        strAttribute, strQtyOrder, strPUOM, strMProductID,
                        strIsSOTrx, strWharehouse, strTabId, strmInoutlineId);
            } catch (ServletException ex) {
                pageErrorCallOut(response);
            }
        } else
            pageError(response);
    }

    void printPage(HttpServletResponse response, VariablesSecureApp vars,
            String strLocator, String strQty, String strUOM,
            String strAttribute, String strQtyOrder, String strPUOM,
            String strMProductID, String strIsSOTrx, String strWharehouse,
            String strTabId, String strmInoutlineId) throws IOException,
            ServletException {
        if (log4j.isDebugEnabled())
            log4j.debug("Output: dataSheet");
        XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
                "org/openbravo/erpCommon/ad_callouts/CallOut")
                .createXmlDocument();

        StringBuffer resultado = new StringBuffer();
        // if (strIsSOTrx.equals("Y")) strLocator = "";

        resultado.append("var calloutName='SL_InOutLine_Product';\n\n");
        resultado.append("var respuesta = new Array(");
        // if (strIsSOTrx.equals("Y")) {
        if (strLocator.startsWith("\""))
            strLocator = strLocator.substring(1, strLocator.length() - 1);
        if (strLocator == null || strLocator.equals("")) {
            if (strIsSOTrx.equals("Y")) {
                resultado.append("new Array(\"inpmLocatorId\", \"\"),");
                resultado.append("new Array(\"inpmLocatorId_R\", \"\"),");
            }
        } else {
            resultado.append("new Array(\"inpmLocatorId\", \"" + strLocator
                    + "\"),");
            resultado.append("new Array(\"inpmLocatorId_R\", \""
                    + FormatUtilities.replaceJS(SLInOutLineProductData.locator(
                            this, strLocator, vars.getLanguage())) + "\"),");
        }

        if (!strAttribute.equals("")) {
            if (strAttribute.startsWith("\""))
                strAttribute = strAttribute.substring(1,
                        strAttribute.length() - 1);
            resultado.append("new Array(\"inpmAttributesetinstanceId\", \""
                    + strAttribute + "\"),");
            resultado.append("new Array(\"inpmAttributesetinstanceId_R\", \""
                    + FormatUtilities.replaceJS(SLInOutLineProductData
                            .attribute(this, strAttribute)) + "\"),");
        }
        // This 'if' is used when the delivery note is created based in a
        // sale-order, to make it not ask for the quantity of the delivery-note
        // and to modify it with the quantity of product in the warehouse.
        // However, if the delivery-note doesn't come from an order, it modifies
        // the quantity field with the quantity in the warehouse.
        String fromOrder = SLInOutLineProductData.fromOrder(this,
                strmInoutlineId);
        if (fromOrder.equals("0")) {
            resultado.append("new Array(\"inpquantityorder\", "
                    + (strQtyOrder.equals("") ? "\"\"" : strQtyOrder) + "),");
            // Here begins the code for the new callout to sl_inoutline_product
            resultado.append("new Array(\"inpmovementqty\", "
                    + (strQty.equals("") ? "\"\"" : strQty) + "),");
        }
        // }
        String strHasSecondaryUOM = SLOrderProductData.hasSecondaryUOM(this,
                strMProductID);
        resultado.append("new Array(\"inphasseconduom\", " + strHasSecondaryUOM
                + "),\n");
        resultado.append("new Array(\"inpmProductUomId\", ");
        if (strPUOM.startsWith("\""))
            strPUOM = strPUOM.substring(1, strPUOM.length() - 1);
        if (vars.getLanguage().equals("en_US")) {
            FieldProvider[] tld = null;
            try {
                ComboTableData comboTableData = new ComboTableData(vars, this,
                        "TABLE", "", "M_Product_UOM", "", Utility.getContext(
                                this, vars, "#User_Org", "SLOrderProduct"),
                        Utility.getContext(this, vars, "#User_Client",
                                "SLOrderProduct"), 0);
                Utility.fillSQLParameters(this, vars, null, comboTableData,
                        "SLOrderProduct", "");
                tld = comboTableData.select(false);
                comboTableData = null;
            } catch (Exception ex) {
                throw new ServletException(ex);
            }

            if (tld != null && tld.length > 0) {
                resultado.append("new Array(");
                for (int i = 0; i < tld.length; i++) {
                    resultado
                            .append("new Array(\""
                                    + tld[i].getField("id")
                                    + "\", \""
                                    + FormatUtilities.replaceJS(tld[i]
                                            .getField("name"))
                                    + "\", \""
                                    + (tld[i].getField("id").equalsIgnoreCase(
                                            strPUOM) ? "true" : "false")
                                    + "\")");
                    if (i < tld.length - 1)
                        resultado.append(",\n");
                }
                resultado.append("\n)");
            } else
                resultado.append("null");
            resultado.append("\n),");
        } else {
            FieldProvider[] tld = null;
            try {
                ComboTableData comboTableData = new ComboTableData(vars, this,
                        "TABLE", "", "M_Product_UOM", "", Utility.getContext(
                                this, vars, "#User_Org", "SLOrderProduct"),
                        Utility.getContext(this, vars, "#User_Client",
                                "SLOrderProduct"), 0);
                Utility.fillSQLParameters(this, vars, null, comboTableData,
                        "SLOrderProduct", "");
                tld = comboTableData.select(false);
                comboTableData = null;
            } catch (Exception ex) {
                throw new ServletException(ex);
            }

            if (tld != null && tld.length > 0) {
                resultado.append("new Array(");
                for (int i = 0; i < tld.length; i++) {
                    resultado
                            .append("new Array(\""
                                    + tld[i].getField("id")
                                    + "\", \""
                                    + FormatUtilities.replaceJS(tld[i]
                                            .getField("name"))
                                    + "\", \""
                                    + (tld[i].getField("id").equalsIgnoreCase(
                                            strPUOM) ? "true" : "false")
                                    + "\")");
                    if (i < tld.length - 1)
                        resultado.append(",\n");
                }
                resultado.append("\n)");
            } else
                resultado.append("null");
            resultado.append("\n),");
        }
        resultado.append("new Array(\"inpcUomId\", "
                + (strUOM.equals("") ? "\"\"" : strUOM) + "),\n");
        resultado.append("new Array(\"EXECUTE\", \"displayLogic();\")\n");

        resultado.append(");");

        if (log4j.isDebugEnabled())
            log4j.debug("Array: " + resultado.toString());
        xmlDocument.setParameter("frameName", "appFrame");
        xmlDocument.setParameter("array", resultado.toString());
        response.setContentType("text/html; charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println(xmlDocument.print());
        out.close();
    }
}
