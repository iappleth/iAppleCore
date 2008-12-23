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

package org.openbravo.erpCommon.ad_forms;

import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.xmlEngine.XmlDocument;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class About extends HttpSecureAppServlet {
    private static final long serialVersionUID = 1L;

    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ServletException {
        VariablesSecureApp vars = new VariablesSecureApp(request);

        if (vars.commandIn("DEFAULT")) {
            printPageDataSheet(response, vars);
        } else
            pageError(response);
    }

    void printPageDataSheet(HttpServletResponse response,
            VariablesSecureApp vars) throws IOException, ServletException {
        if (log4j.isDebugEnabled())
            log4j.debug("Output: dataSheet");
        response.setContentType("text/html; charset=UTF-8");
        PrintWriter out = response.getWriter();
        String discard[] = { "discard" };
        AboutData[] data = AboutData.selectTranslators(this);
        AboutData[] ver = AboutData.select(this);
        XmlDocument xmlDocument = null;
        if (data.length == 0) {
            xmlDocument = xmlEngine.readXmlTemplate(
                    "org/openbravo/erpCommon/ad_forms/About", discard)
                    .createXmlDocument();
            data = AboutData.set();
        } else
            xmlDocument = xmlEngine.readXmlTemplate(
                    "org/openbravo/erpCommon/ad_forms/About")
                    .createXmlDocument();

        xmlDocument.setParameter("directory", "var baseDirectory = \""
                + strReplaceWith + "/\";\n");
        xmlDocument.setParameter("language", "defaultLang=\""
                + vars.getLanguage() + "\";");
        xmlDocument.setParameter("theme", vars.getTheme());
        xmlDocument.setData("structure1", data);
        xmlDocument.setParameter("ver", ver[0].ver);

        out.println(xmlDocument.print());
        out.close();
    }

    public String getServletInfo() {
        return "Servlet DebtPaymentUnapply. This Servlet was made by Eduardo Argal";
    } // end of getServletInfo() method
}
