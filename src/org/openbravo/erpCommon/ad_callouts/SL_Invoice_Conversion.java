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
import org.openbravo.erpCommon.utility.*;
import java.io.*;
import java.math.BigDecimal;
import javax.servlet.*;
import javax.servlet.http.*;

public class SL_Invoice_Conversion extends HttpSecureAppServlet {
    private static final long serialVersionUID = 1L;

    static final BigDecimal ZERO = new BigDecimal(0.0);

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
            String strUOM = vars.getStringParameter("inpcUomId");
            String strMProductUOMID = vars
                    .getStringParameter("inpmProductUomId");
            String strQuantityOrder = vars
                    .getStringParameter("inpquantityorder");
            String strTabId = vars.getStringParameter("inpTabId");

            try {
                printPage(response, vars, strUOM, strMProductUOMID,
                        strQuantityOrder, strTabId);
            } catch (ServletException ex) {
                pageErrorCallOut(response);
            }
        } else
            pageError(response);
    }

    void printPage(HttpServletResponse response, VariablesSecureApp vars,
            String strUOM, String strMProductUOMID, String strQuantityOrder,
            String strTabId) throws IOException, ServletException {
        if (log4j.isDebugEnabled())
            log4j.debug("Output: dataSheet");
        XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
                "org/openbravo/erpCommon/ad_callouts/CallOut")
                .createXmlDocument();
        if (strUOM.startsWith("\""))
            strUOM = strUOM.substring(1, strUOM.length() - 1);
        int stdPrecision = Integer.valueOf(
                SLInvoiceConversionData.stdPrecision(this, strUOM)).intValue();
        String strInitUOM = SLInvoiceConversionData.initUOMId(this,
                strMProductUOMID);
        String strMultiplyRate;
        boolean check = false;

        strMultiplyRate = SLInvoiceConversionData.multiplyRate(this,
                strInitUOM, strUOM);
        if (strInitUOM.equals(strUOM))
            strMultiplyRate = "1";
        if (strMultiplyRate.equals(""))
            strMultiplyRate = SLInvoiceConversionData.divideRate(this, strUOM,
                    strInitUOM);
        if (strMultiplyRate.equals("")) {
            strMultiplyRate = "1";
            if (!strMProductUOMID.equals(""))
                check = true;
        }

        BigDecimal quantityOrder, qtyInvoiced, multiplyRate;

        multiplyRate = new BigDecimal(strMultiplyRate);

        StringBuffer resultado = new StringBuffer();
        resultado.append("var calloutName='SL_Invoice_Conversion';\n\n");
        resultado.append("var respuesta = new Array(");
        if (!strQuantityOrder.equals("")) {
            quantityOrder = new BigDecimal(strQuantityOrder);
            qtyInvoiced = new BigDecimal(quantityOrder.doubleValue()
                    * multiplyRate.doubleValue());
            if (qtyInvoiced.scale() > stdPrecision)
                qtyInvoiced = qtyInvoiced.setScale(stdPrecision,
                        BigDecimal.ROUND_HALF_UP);
            resultado.append("new Array(\"inpqtyinvoiced\", "
                    + qtyInvoiced.toString() + ")");
        }
        if (check) {
            if (!strQuantityOrder.equals(""))
                resultado.append(",");
            resultado.append("new Array('MESSAGE', \""
                    + FormatUtilities.replaceJS(Utility.messageBD(this,
                            "NoUOMConversion", vars.getLanguage())) + "\")");
        }
        resultado.append(");");
        xmlDocument.setParameter("array", resultado.toString());
        xmlDocument.setParameter("frameName", "appFrame");
        response.setContentType("text/html; charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println(xmlDocument.print());
        out.close();
    }
}
