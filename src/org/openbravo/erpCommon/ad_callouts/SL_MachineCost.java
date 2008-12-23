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
import java.io.*;
import java.math.BigDecimal;
import javax.servlet.*;
import javax.servlet.http.*;

public class SL_MachineCost extends HttpSecureAppServlet {
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
            String strPurchaseAmt = vars.getStringParameter("inppurchaseamt");
            String strToolsetAmt = vars.getStringParameter("inptoolsetamt");
            String strYearValue = vars.getStringParameter("inpyearvalue");
            String strAmortization = vars.getStringParameter("inpamortization");
            String strDaysYear = vars.getStringParameter("inpdaysyear");
            String strDayHours = vars.getStringParameter("inpdayhours");
            String strImproductiveHoursYear = vars
                    .getStringParameter("inpimproductivehoursyear");
            String strCostUomYear = vars.getStringParameter("inpcostuomyear");
            String strCost = vars.getStringParameter("inpcost");
            String strCostUom = vars.getStringParameter("inpcostuom");
            try {
                printPage(response, vars, strChanged, strPurchaseAmt,
                        strToolsetAmt, strYearValue, strAmortization,
                        strDaysYear, strDayHours, strImproductiveHoursYear,
                        strCostUomYear, strCost, strCostUom);
            } catch (ServletException ex) {
                pageErrorCallOut(response);
            }
        } else
            pageError(response);
    }

    void printPage(HttpServletResponse response, VariablesSecureApp vars,
            String strChanged, String strPurchaseAmt, String strToolsetAmt,
            String strYearValue, String strAmortization, String strDaysYear,
            String strDayHours, String strImproductiveHoursYear,
            String strCostUomYear, String strCost, String strCostUom)
            throws IOException, ServletException {
        if (log4j.isDebugEnabled())
            log4j.debug("Output: dataSheet");
        XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
                "org/openbravo/erpCommon/ad_callouts/CallOut")
                .createXmlDocument();

        if (strChanged.equals("inppurchaseamt")
                || strChanged.equals("inptoolsetamt")
                || strChanged.equals("inpyearvalue")) {
            if (strPurchaseAmt != null && !strPurchaseAmt.equals("")
                    && strToolsetAmt != null && !strToolsetAmt.equals("")
                    && strYearValue != null && !strYearValue.equals("")) {
                Float fPurchaseAmt = Float.valueOf(strPurchaseAmt);
                Float fToolsetAmt = Float.valueOf(strToolsetAmt);
                Float fYearValue = Float.valueOf(strYearValue);
                Float fAmortization = (fPurchaseAmt + fToolsetAmt) / fYearValue;
                strAmortization = fAmortization.toString();

                if (strCostUomYear != null && !strCostUomYear.equals("")) {
                    Float fCostUomYear = Float.valueOf(strCostUomYear);
                    Float fCost = fYearValue / fCostUomYear;
                    strCost = fCost.toString();
                }
            }
        } else if (strChanged.equals("inpamortization")) {
            if (strPurchaseAmt != null && !strPurchaseAmt.equals("")
                    && strToolsetAmt != null && !strToolsetAmt.equals("")
                    && strAmortization != null && !strAmortization.equals("")) {
                Float fPurchaseAmt = Float.valueOf(strPurchaseAmt);
                Float fToolsetAmt = Float.valueOf(strToolsetAmt);
                Float fAmortization = Float.valueOf(strAmortization);
                Float fYearValue = (fPurchaseAmt + fToolsetAmt) / fAmortization;
                strYearValue = fYearValue.toString();

                if (strCostUomYear != null && !strCostUomYear.equals("")) {
                    Float fCostUomYear = Float.valueOf(strCostUomYear);
                    Float fCost = fYearValue / fCostUomYear;
                    strCost = fCost.toString();
                }
            }
        } else if (strChanged.equals("inpdaysyear")
                || strChanged.equals("inpdayhours")
                || strChanged.equals("inpimproductivehoursyear")) {
            if (strDaysYear != null && !strDaysYear.equals("")
                    && strDayHours != null && !strDayHours.equals("")
                    && strImproductiveHoursYear != null
                    && !strImproductiveHoursYear.equals("")) {
                Float fDaysYear = Float.valueOf(strDaysYear);
                Float fDayHours = Float.valueOf(strDayHours);
                Float fImproductiveHoursYear = Float
                        .valueOf(strImproductiveHoursYear);
                Float fCostUomYear = (fDaysYear * fDayHours)
                        - fImproductiveHoursYear;
                strCostUomYear = fCostUomYear.toString();

                if (strYearValue != null && !strYearValue.equals("")) {
                    Float fYearValue = Float.valueOf(strYearValue);
                    Float fCost = fYearValue / fCostUomYear;
                    strCost = fCost.toString();
                }
            }
        } else if (strChanged.equals("inpcostuomyear")) {
            if (strCostUom.equals("H"))
                if (strDaysYear != null && !strDaysYear.equals("")
                        && strDayHours != null && !strDayHours.equals("")
                        && strCostUomYear != null && !strCostUomYear.equals("")) {
                    Float fDaysYear = Float.valueOf(strDaysYear);
                    Float fDayHours = Float.valueOf(strDayHours);
                    Float fCostUomYear = Float.valueOf(strCostUomYear);
                    Float fImproductiveHoursYear = (fDaysYear * fDayHours)
                            - fCostUomYear;
                    strImproductiveHoursYear = fImproductiveHoursYear
                            .toString();
                }
            if (strYearValue != null && !strYearValue.equals("")
                    && strCostUomYear != null && !strCostUomYear.equals("")) {
                Float fYearValue = Float.valueOf(strYearValue);
                Float fCostUomYear = Float.valueOf(strCostUomYear);
                Float fCost = fYearValue / fCostUomYear;
                strCost = fCost.toString();
            }
        } else if (strChanged.equals("inpcost")) {
            if (strCost != null && !strCost.equals("")
                    && strCostUomYear != null && !strCostUomYear.equals("")) {
                Float fCostUomYear = Float.valueOf(strCostUomYear);
                Float fCost = Float.valueOf(strCost);
                Float fYearValue = fCost * fCostUomYear;
                strYearValue = fYearValue.toString();

                if (strPurchaseAmt != null && !strPurchaseAmt.equals("")
                        && strToolsetAmt != null && !strToolsetAmt.equals("")) {
                    Float fPurchaseAmt = Float.valueOf(strPurchaseAmt);
                    Float fToolsetAmt = Float.valueOf(strToolsetAmt);
                    Float fAmortization = (fPurchaseAmt + fToolsetAmt)
                            / fYearValue;
                    strAmortization = fAmortization.toString();
                }
            }
        }

        StringBuffer resultado = new StringBuffer();
        resultado.append("var calloutName='SL_MachineCost';\n\n");
        resultado.append("var respuesta = new Array(");
        resultado.append("new Array(\"inppurchaseamt\", \"" + strPurchaseAmt
                + "\"),\n");
        resultado.append("new Array(\"inptoolsetamt\", \"" + strToolsetAmt
                + "\"),\n");
        resultado.append("new Array(\"inpyearvalue\", \"" + strYearValue
                + "\"),\n");
        resultado.append("new Array(\"inpamortization\", \"" + strAmortization
                + "\"), \n");
        resultado.append("new Array(\"inpdaysyear\", \"" + strDaysYear
                + "\"),\n");
        resultado.append("new Array(\"inpdayhours\", \"" + strDayHours
                + "\"),\n");
        resultado.append("new Array(\"inpimproductivehoursyear\", \""
                + strImproductiveHoursYear + "\"),\n");
        resultado.append("new Array(\"inpcostuomyear\", \"" + strCostUomYear
                + "\"),\n");
        resultado.append("new Array(\"inpcost\", \"" + strCost + "\") \n");
        resultado.append(");\n");
        xmlDocument.setParameter("array", resultado.toString());
        response.setContentType("text/html; charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println(xmlDocument.print());
        out.close();
    }
}
