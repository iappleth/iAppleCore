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
package org.openbravo.erpReports;

import org.openbravo.base.secureApp.*;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import java.util.HashMap;

public class RptMA_ProcessPlan extends HttpSecureAppServlet {
    private static final long serialVersionUID = 1L;

    public void init(ServletConfig config) {
        super.init(config);
        boolHist = false;
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ServletException {
        VariablesSecureApp vars = new VariablesSecureApp(request);

        if (vars.commandIn("DEFAULT")) {
            String strmaProcessPlan = vars
                    .getSessionValue("RptMA_ProcessPlan.inpmaProcessplan_R");
            if (strmaProcessPlan.equals(""))
                strmaProcessPlan = vars
                        .getSessionValue("RptMA_ProcessPlan.inpmaProcessplanId");
            printPagePartePDF(response, vars, strmaProcessPlan);
        } else
            pageError(response);
    }

    void printPagePartePDF(HttpServletResponse response,
            VariablesSecureApp vars, String strmaProcessPlan)
            throws IOException, ServletException {
        if (log4j.isDebugEnabled())
            log4j.debug("Output: pdf");
        // here we pass the familiy-ID with report.setData
        RptMAProcessPlanData[] data = RptMAProcessPlanData.select(this, vars
                .getLanguage(), strmaProcessPlan);
        if (data == null || data.length == 0)
            data = RptMAProcessPlanData.set();

        String strReportName = "@basedesign@/org/openbravo/erpReports/RptMA_ProcessPlan.jrxml";
        String strOutput = "pdf";
        String strTitle = classInfo.name;

        HashMap<String, Object> parameters = new HashMap<String, Object>();
        parameters.put("REPORT_TITLE", strTitle);
        renderJR(vars, response, strReportName, strOutput, parameters, data,
                null);
    }

    public String getServletInfo() {
        return "Servlet that presents the RptMAProcessPlan seeker";
    } // End of getServletInfo() method
}
