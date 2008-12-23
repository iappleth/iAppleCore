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
package org.openbravo.erpCommon.utility;

import org.openbravo.base.secureApp.*;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import org.openbravo.utils.FormatUtilities;

public class ReferencedLink extends HttpSecureAppServlet {
    private static final long serialVersionUID = 1L;

    public void init(ServletConfig config) {
        super.init(config);
        boolHist = false;
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ServletException {
        VariablesSecureApp vars = new VariablesSecureApp(request);

        if (vars.commandIn("DEFAULT")) {

            String strKeyReferenceColumnName = vars
                    .getRequiredStringParameter("inpKeyReferenceColumnName");
            // String strKeyReferenceName =
            // vars.getRequiredStringParameter("inpKeyReferenceName");
            // String strTableId =
            // vars.getRequiredStringParameter("inpTableId");
            String strTableReferenceId = vars
                    .getRequiredStringParameter("inpTableReferenceId");
            String strKeyReferenceId = vars
                    .getStringParameter("inpKeyReferenceId");
            // String strTabId = vars.getStringParameter("inpTabId");
            String strWindowId = vars.getStringParameter("inpwindowId");
            String strTableName = ReferencedLinkData.selectTableName(this,
                    strTableReferenceId);
            boolean isSOTrx = true;

            if (log4j.isDebugEnabled())
                log4j.debug("strKeyReferenceColumnName:"
                        + strKeyReferenceColumnName + " strTableReferenceId:"
                        + strTableReferenceId + " strKeyReferenceId:"
                        + strKeyReferenceId + " strWindowId:" + strWindowId
                        + " strTableName:" + strTableName);
            {
                ReferencedTables ref = new ReferencedTables(this,
                        strTableReferenceId, strKeyReferenceColumnName,
                        strKeyReferenceId);
                if (!ref.hasSOTrx())
                    isSOTrx = (Utility.getContext(this, vars, "IsSOTrx",
                            strWindowId).equals("N") ? false : true);
                else
                    isSOTrx = ref.isSOTrx();
                ref = null;
            }
            {
                String strTableRealReference = strTableReferenceId;
                if (strTableReferenceId.equals("800018")) { // DP
                    if (ReferencedTablesData.selectKeyId(this, "C_INVOICE_ID",
                            strTableName, strKeyReferenceColumnName,
                            strKeyReferenceId).equals("")) {
                        if (!ReferencedTablesData.selectKeyId(this,
                                "C_ORDER_ID", strTableName,
                                strKeyReferenceColumnName, strKeyReferenceId)
                                .equals("")) {
                            strTableRealReference = ReferencedTablesData
                                    .selectTableId(this, "C_Order");
                        } else {
                            strTableRealReference = ReferencedTablesData
                                    .selectTableId(this, "C_Settlement");
                            strTableReferenceId = "800021";
                        }
                    }
                }
                ReferencedLinkData[] data = ReferencedLinkData.selectWindows(
                        this, strTableRealReference);
                if (data == null || data.length == 0)
                    throw new ServletException("Window not found");

                strWindowId = data[0].adWindowId;
                if (!isSOTrx && !data[0].poWindowId.equals(""))
                    strWindowId = data[0].poWindowId;
            }
            ReferencedLinkData[] data = ReferencedLinkData.select(this,
                    strWindowId, strTableReferenceId);
            if (data == null || data.length == 0)
                throw new ServletException("Window not found: " + strWindowId);
            String windowName = data[0].windowname;
            String tabName = data[0].tabname;
            if (strKeyReferenceId.equals("")) {
                data = ReferencedLinkData.selectParent(this, strWindowId);
                if (data == null || data.length == 0)
                    throw new ServletException("Window parent not found: "
                            + strWindowId);
                windowName = data[0].windowname;
                tabName = data[0].tabname;
            }
            StringBuffer cadena = new StringBuffer();
            cadena.append(strDireccion).append("/").append(
                    FormatUtilities.replace(windowName)).append("/").append(
                    FormatUtilities.replace(tabName));
            cadena.append("_Edition.html?Command=").append(
                    (strKeyReferenceId.equals("") ? "DEFAULT" : "DIRECT"))
                    .append("&");
            cadena.append("inpDirectKey").append("=").append(strKeyReferenceId);
            if (log4j.isDebugEnabled())
                log4j.debug(cadena.toString());
            response.sendRedirect(cadena.toString());
        } else
            throw new ServletException();
    }

    public String getServletInfo() {
        return "Servlet that presents the referenced links";
    } // end of getServletInfo() method
}
