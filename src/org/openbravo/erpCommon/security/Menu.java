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
 * All portions are Copyright (C) 2001-2009 Openbravo SL
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.erpCommon.security;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.openbravo.base.filter.IsIDFilter;
import org.openbravo.base.filter.ValueListFilter;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.datamodel.Table;
import org.openbravo.model.ad.ui.Tab;
import org.openbravo.model.ad.ui.Window;
import org.openbravo.xmlEngine.XmlDocument;

public class Menu extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  /** Creates a new instance of Menu */
  public Menu() {
  }

  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException,
      ServletException {
    final String queryString = request.getQueryString();
    VariablesSecureApp vars = new VariablesSecureApp(request);
    String targetmenu = getTargetMenu(vars, queryString);

    String textDirection = vars.getSessionValue("#TextDirection", "LTR");
    printPageFrameIdentificacion(response, "../utility/VerticalMenu.html",
        (targetmenu.equals("") ? "../utility/Home.html" : targetmenu),
        "../utility/VerticalMenu.html?Command=LOADING", textDirection);
  }

  private void printPageFrameIdentificacion(HttpServletResponse response, String strMenu,
      String strDetalle, String strMenuLoading, String textDirection) throws IOException,
      ServletException {
    XmlDocument xmlDocument;
    if (textDirection.equals("RTL")) {
      xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/security/Login_FS_RTL")
          .createXmlDocument();
    } else {
      xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/security/Login_FS")
          .createXmlDocument();
    }
    xmlDocument.setParameter("frameMenuLoading", strMenuLoading);
    xmlDocument.setParameter("frameMenu", strMenu);
    xmlDocument.setParameter("frame1", strDetalle);
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private String getTargetMenu(VariablesSecureApp vars, String queryString) throws ServletException {

    OBContext userContext = OBContext.getOBContext();

    final String[] allowedCommands = { "", "DEFAULT", "NEW", "EDIT", "GRID" };
    final ValueListFilter listFilter = new ValueListFilter(allowedCommands);
    final String command = vars.getStringParameter("Command", listFilter);
    String targetmenu = vars.getSessionValue("targetmenu");

    if (command != null && !command.equals("")) { // Trying to deep-link
      try {

        OBContext.setAdminContext();

        final String tabId = vars.getStringParameter("tabId", IsIDFilter.instance);
        final String windowId = vars.getStringParameter("windowId", IsIDFilter.instance);
        final String recordId = vars.getStringParameter("recordId", IsIDFilter.instance);
        String viewType = "RELATION";

        if (tabId.equals("") || windowId.equals("")) {
          return "";
        }

        final Tab tab = OBDal.getInstance().get(Tab.class, tabId);
        final Window window = OBDal.getInstance().get(Window.class, windowId);

        if (!tab.getWindow().equals(window)) {
          log4j.error("Invalid deep-link URL: tab doesn't belong to window");
          return "";
        }

        if (tab.getTabLevel() > 0 && recordId.equals("")) {
          log4j.error("Invalid deep-link URL: Trying to access child tab without an record id");
          return "";
        }

        if (vars.commandIn("EDIT")) {

          if (recordId.equals("")) {
            log4j.error("Invalid deep-link URL: Trying to use EDIT command without a record id");
            return "";
          }

          Table table = tab.getTable();
          Entity e = ModelProvider.getInstance().getEntityByTableName(table.getDBTableName());

          // Validating the record id on table
          BaseOBObject ob = OBDal.getInstance().get(e.getName(), recordId);

          if (ob == null) {
            log4j.error("Invalid deep-link URL: Record id: " + recordId
                + " doesn't exist in table: " + table.getDBTableName());
            return "";
          }

          // Getting Id column from table
          Property p = e.getIdProperties().get(0);

          // Setting the value of the record
          vars.setSessionValue(windowId + "|" + p.getColumnName(), recordId);
          viewType = "EDIT";

        }

        if (vars.commandIn("GRID")) {
          queryString = queryString.replace("GRID", "RELATION");
        }

        // Setting type of view
        vars.setSessionValue(tabId + "|" + tab.getName().replaceAll(" ", "") + ".view", viewType);

        final String type = command.equals("GRID") ? "R" : "E";

        // Getting the tab URL
        final String tabURL = Utility.getTabURL(this, tabId, type);
        targetmenu = tabURL + "?dl=1&" + queryString;

      } catch (Exception e) {
        log4j.error("Error in deep-linking: " + e.getMessage(), e);
        throw new ServletException(e.getMessage());
      } finally {
        OBContext.setOBContext(userContext);
      }
    }
    return targetmenu;
  }
}
