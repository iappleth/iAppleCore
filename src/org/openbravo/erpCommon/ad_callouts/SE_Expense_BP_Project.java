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
 * All portions are Copyright (C) 2008 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
*/
package org.openbravo.erpCommon.ad_callouts;

import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.xmlEngine.XmlDocument;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class SE_Expense_BP_Project extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;
  

  public void init (ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);
    if (vars.commandIn("DEFAULT")) {
      String strBPartnerId = vars.getStringParameter("inpcBpartnerId");
      String strProjectId = vars.getStringParameter("inpcProjectId");
      String strChanged = vars.getStringParameter("inpLastFieldChanged");
      String strWindowId = vars.getStringParameter("inpwindowId");
      String strTabId = vars.getStringParameter("inpTabId");
      
      try {
        printPage(response, vars, strBPartnerId, strProjectId, strChanged, strTabId, strWindowId);
      } catch (ServletException ex) {
        pageErrorCallOut(response);
      }
    } else pageError(response);
  }

  void printPage(HttpServletResponse response, VariablesSecureApp vars, String strBPartnerId, String strProjectId, String strChanged, String strTabId, String strWindowId) throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: dataSheet");
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_callouts/CallOut").createXmlDocument();
    StringBuffer resultado = new StringBuffer();
    resultado.append("var calloutName='SE_Expense_BP_Project';\n\n");
    resultado.append("var respuesta = new Array(");
    
    if (strChanged.equals("inpcProjectId") && strProjectId != null && strProjectId != "") {
    	String strBPartnerName = "";
    	String strBPartner = SEExpenseBPProjectData.selectBPId(this, strProjectId) ;
		if (strBPartner != null && strBPartner != "") {
			strBPartnerId = strBPartner;
			strBPartnerName = SEExpenseBPProjectData.selectBPName(this, strProjectId) ;
		}
		resultado.append("new Array(\"inpcBpartnerId\", \"" + strBPartnerId + "\")\n");
	    resultado.append(", new Array(\"inpcBpartnerId_R\", \"" + strBPartnerName + "\")\n");
    } else if (strChanged.equals("inpcBpartnerId") && strBPartnerId != null && strBPartnerId != "") {
    	String strProject = "";
    	if (strProjectId == null || strProjectId == "") {
    		strProject = SEExpenseBPProjectData.selectProjectId(this, strBPartnerId) ;
    		if (strProject != null && strProject != "") {
    			strProjectId = strProject;
    		}
    	} else {
    		String strBPartnerProject = SEExpenseBPProjectData.selectBPProject(this, strBPartnerId, strProjectId);
    		if (strBPartnerProject == null || strBPartnerProject == "") {
    			strProject = SEExpenseBPProjectData.selectProjectId(this, strBPartnerId) ;
        		if (strProject != null && strProject != "") {
        			strProjectId = strProject;
        		} else {
        			strProjectId = "";
        		}
    		}
    	}
    	resultado.append("new Array(\"inpcProjectId\", \"" + strProjectId + "\")\n");
    }
    
    resultado.append(");");
    xmlDocument.setParameter("array", resultado.toString());
    xmlDocument.setParameter("frameName", "frameAplicacion");
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }
}
