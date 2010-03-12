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
import org.openbravo.utils.FormatUtilities;
import org.openbravo.xmlEngine.XmlDocument;

public abstract class SimpleCallout extends HttpSecureAppServlet {

    private static final long serialVersionUID = 1L;

    protected abstract void execute(CalloutInfo info) throws ServletException;

    @Override
    public void init(ServletConfig config) {
        super.init(config);
        boolHist = false;
    }

    @Override
    public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {

        VariablesSecureApp vars = new VariablesSecureApp(request);

        if (vars.commandIn("DEFAULT")) {
            try {
                printPage(response, vars);
            } catch (ServletException ex) {
                pageErrorCallOut(response);
            }
        } else {
            pageError(response);
        }
    }

    private void printPage(HttpServletResponse response, VariablesSecureApp vars) throws IOException, ServletException {

        if (log4j.isDebugEnabled()) {
            log4j.debug("Output: dataSheet");
        }

        XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
                "org/openbravo/erpCommon/ad_callouts/CallOut").createXmlDocument();

        CalloutInfo info = new CalloutInfo(vars, getSimpleClassName());

        execute(info);

        xmlDocument.setParameter("array", info.finishResult());
        xmlDocument.setParameter("frameName", "appFrame");
        response.setContentType("text/html; charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println(xmlDocument.print());
        out.close();
    }

    private String getSimpleClassName() {
        String classname = getClass().getName();
        int i = classname.lastIndexOf(".");
        if (i < 0) {
            return classname;
        } else {
            return classname.substring(i + 1);
        }
    }

    protected static class CalloutInfo {

        private StringBuffer result;
        private int rescounter;
        private int selectcounter;

        public VariablesSecureApp vars;

        private CalloutInfo(VariablesSecureApp vars, String classname) {
            this.vars = vars;

            result = new StringBuffer();
            result.append("var calloutName='");
            result.append(classname);
            result.append("';\nvar respuesta = new Array(");

            rescounter = 0;
            selectcounter = 0;
        }

        private String finishResult() {
            result.append(");");
            return result.toString();
        }

        public String getLastFieldChanged() {
          return vars.getStringParameter("inpLastFieldChanged");
        }

        public String getTabId() {
            return vars.getStringParameter("inpTabId");
        }

        public String getWindowId() {
            return vars.getStringParameter("inpwindowId");
        }

        public String getStringParameter(String param) {
            return vars.getStringParameter(param);
        }

        public BigDecimal getBigDecimalParameter(String param) throws ServletException {
            return new BigDecimal(vars.getNumericParameter(param, "0"));
        }

        public void addSelect(String param) {

            if (rescounter > 0) {
                result.append(',');
            }
            rescounter++;
            result.append("\nnew Array(\"");
            result.append(param);
            result.append("\", ");

            selectcounter = 0;
        }

        public void addSelectResult(String name, String value) {
            addSelectResult(name, value, false);
        }

        public void addSelectResult(String name, String value, boolean selected) {

            if (selectcounter > 0) {
                result.append(',');
            }
            selectcounter++;
            result.append("new Array(\"");
            result.append(name);
            result.append("\", \"");
            result.append(FormatUtilities.replaceJS(value));
            result.append("\",");
            result.append(selected ? "true" : "false");
            result.append(")");
        }

        public void endSelect() {
            if (selectcounter == 0) {
                result.append("null");
            }
            result.append(")");
        }

        public void addResult(String param, Object value) {

            if (rescounter > 0) {
                result.append(',');
            }
            rescounter++;

            result.append("\nnew Array(\"");
            result.append(param);
            result.append("\", ");
            result.append(value == null ? "null" : value.toString());
            result.append(")");
        }

        public void addResult(String param, String value) {
            addResult(param, (Object) value == null ? null : "\"" + FormatUtilities.replaceJS(value) + "\"");
        }
    }
}
