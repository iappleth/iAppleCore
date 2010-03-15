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
 * All portions are Copyright (C) 2010 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.erpCommon.ad_process;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.openbravo.base.HttpBaseServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.Utility;

import com.thoughtworks.xstream.XStream;
import com.thoughtworks.xstream.io.json.JettisonMappedXmlDriver;

public class ApplyModulesCallServlet extends HttpBaseServlet {
  private static final long serialVersionUID = 1L;

  /**
     * 
     */
  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException,
      ServletException {
    final VariablesSecureApp vars = new VariablesSecureApp(request);

    if (vars.commandIn("UPDATESTATUS")) {
      update(response, vars);
    } else if (vars.commandIn("REQUESTERRORSTATE")) {
      requesterrorstate(response, vars, false);
    } else if (vars.commandIn("REQUESTLASTERRORSTATE")) {
      requesterrorstate(response, vars, true);
    } else if (vars.commandIn("GETERR")) {
      getError(response, vars);
    }
  }

  /**
   * This method returns an ApplyModulesResponse object, that later is transformed into a JSON
   * object and resend to the rebuild window.
   */
  private ApplyModulesResponse fillResponse(VariablesSecureApp vars, String state,
      String defaultState, boolean fillWarnsAndErrors) {
    String ln = vars.getSessionValue("ApplyModules|Last_Line_Number_Log");
    if (ln == null || ln.equals("")) {
      return null;
    }
    int lastlinenumber;
    if (ln == null || ln.equals("")) {
      lastlinenumber = 0;
    } else {
      lastlinenumber = Integer.parseInt(ln);
    }
    ApplyModulesResponse resp = new ApplyModulesResponse();
    resp.setState(Integer.parseInt(state.replace("RB", "")));
    PreparedStatement ps = null;
    PreparedStatement ps2 = null;
    PreparedStatement ps3 = null;
    boolean warning = false;
    boolean error = false;
    try {
      if (fillWarnsAndErrors) {
        int newlinenumber = lastlinenumber;
        ps = getPreparedStatement("SELECT MESSAGE, LINE_NUMBER FROM AD_ERROR_LOG WHERE ERROR_LEVEL='WARN' AND SYSTEM_STATUS LIKE ?");
        ps.setString(1, "%" + state);
        ps.executeQuery();
        ResultSet rs = ps.getResultSet();
        ArrayList<String> warnings = new ArrayList<String>();
        while (rs.next()) {
          warning = true; // there is at least an warning in this state
          int linenumber = rs.getInt(2);
          if (linenumber > newlinenumber) {
            newlinenumber = linenumber;
          }
          if (linenumber > lastlinenumber) {
            warnings.add(rs.getString(1));
          }
        }
        resp.setWarnings(warnings.toArray(new String[0]));

        ps2 = getPreparedStatement("SELECT MESSAGE, LINE_NUMBER FROM AD_ERROR_LOG WHERE ERROR_LEVEL='ERROR' AND SYSTEM_STATUS LIKE ?");
        ps2.setString(1, "%" + state);
        ps2.executeQuery();
        ResultSet rs2 = ps2.getResultSet();
        ArrayList<String> errors = new ArrayList<String>();
        while (rs2.next()) {
          error = true; // there is at least an error in this state
          int linenumber = rs2.getInt(2);
          if (linenumber > newlinenumber) {
            newlinenumber = linenumber;
          }
          if (linenumber > lastlinenumber) {
            errors.add(rs2.getString(1));
          }
        }
        resp.setErrors(errors.toArray(new String[0]));
        vars.setSessionValue("ApplyModules|Last_Line_Number_Log", new Integer(newlinenumber)
            .toString());
      }
      ps3 = getPreparedStatement("SELECT MESSAGE FROM AD_ERROR_LOG ORDER BY CREATED DESC");
      ps3.executeQuery();
      ResultSet rs3 = ps3.getResultSet();
      if (rs3.next()) {
        resp.setLastmessage(rs3.getString(1));
      } else {
        resp.setLastmessage("");
      }

      if (error)
        resp.setStatusofstate("Error");
      else if (warning)
        resp.setStatusofstate("Warning");
      else
        resp.setStatusofstate(defaultState);
    } catch (Exception e) {
    } finally {
      try {
        releasePreparedStatement(ps3);
        releasePreparedStatement(ps2);
        releasePreparedStatement(ps);
      } catch (SQLException e2) {
      }
    }
    return resp;
  }

  private ApplyModulesResponse fillErrorResponse(VariablesSecureApp vars, String state,
      String defaultState) {

    ApplyModulesResponse resp = new ApplyModulesResponse();
    resp.setState(Integer.parseInt(state.replace("RB", "")));
    PreparedStatement ps2 = null;
    PreparedStatement ps3 = null;
    boolean warning = false;
    boolean error = false;
    try {
      ps2 = getPreparedStatement("SELECT MESSAGE, SYSTEM_STATUS LINE_NUMBER FROM AD_ERROR_LOG WHERE ERROR_LEVEL='ERROR' ORDER BY CREATED DESC");
      ps2.executeQuery();
      ResultSet rs2 = ps2.getResultSet();
      ArrayList<String> errors = new ArrayList<String>();
      if (rs2.next()) {
        error = true; // there is at least an error in this state
        errors.add(rs2.getString(1));
        resp.setState(Integer.parseInt(rs2.getString(2).replace("RB", "")));
      }
      resp.setErrors(errors.toArray(new String[0]));

      ps3 = getPreparedStatement("SELECT MESSAGE FROM AD_ERROR_LOG ORDER BY CREATED DESC");
      ps3.executeQuery();
      ResultSet rs3 = ps3.getResultSet();
      if (rs3.next()) {
        resp.setLastmessage(rs3.getString(1));
      } else {
        resp.setLastmessage("");
      }

      if (error)
        resp.setStatusofstate("Error");
      else if (warning)
        resp.setStatusofstate("Warning");
      else
        resp.setStatusofstate(defaultState);
    } catch (Exception e) {
    } finally {
      try {
        releasePreparedStatement(ps3);
        releasePreparedStatement(ps2);
      } catch (SQLException e2) {
      }
    }
    return resp;
  }

  /**
   * This method is called via AJAX through a timer in the rebuild window. It returns the current
   * status of the system (and warnings/errors that happened in the current state)
   */
  private void update(HttpServletResponse response, VariablesSecureApp vars) {
    String ln = vars.getSessionValue("ApplyModules|Last_Line_Number_Log");
    if (ln == null || ln.equals("")) {
      return;
    }
    PreparedStatement ps = null;
    try {
      ps = getPreparedStatement("SELECT SYSTEM_STATUS FROM AD_SYSTEM_INFO");
      ps.executeQuery();
      ResultSet rs = ps.getResultSet();
      rs.next();
      String state = rs.getString(1);
      ApplyModulesResponse resp = fillResponse(vars, state, "Processing", false);
      response.setContentType("text/plain; charset=UTF-8");
      final PrintWriter out = response.getWriter();
      String strResult;
      XStream xs = new XStream(new JettisonMappedXmlDriver());
      xs.alias("Response", ApplyModulesResponse.class);
      strResult = xs.toXML(resp);
      out.print(strResult);
      out.close();
    } catch (Exception e) {
    } finally {
      if (ps != null)
        try {
          releasePreparedStatement(ps);
        } catch (SQLException e) {
        }
    }
  }

  /**
   * This method is called via AJAX, and returns the status and warnings/errors for a particular
   * state. This method will be called when the Rebuild Window notices that one or more steps were
   * not updated and the build process already finished them
   */
  private void requesterrorstate(HttpServletResponse response, VariablesSecureApp vars,
      boolean lastError) {
    String ln = vars.getSessionValue("ApplyModules|Last_Line_Number_Log");
    if (ln == null || ln.equals("")) {
      return;
    }
    String state = vars.getStringParameter("reqStatus");
    ApplyModulesResponse resp;
    if (lastError) {
      resp = fillErrorResponse(vars, state, "Success");
    } else {
      resp = fillResponse(vars, state, "Success", true);
    }
    response.setContentType("text/plain; charset=UTF-8");
    try {
      final PrintWriter out = response.getWriter();
      String strResult;
      XStream xs = new XStream(new JettisonMappedXmlDriver());
      xs.alias("Response", ApplyModulesResponse.class);
      strResult = xs.toXML(resp);
      out.print(strResult);
      out.close();
    } catch (IOException e) {
    }
  }

  /**
   * Method to be called via AJAX. It returns a XML structure with the error messages (if any) or a
   * Success one
   */
  private void getError(HttpServletResponse response, VariablesSecureApp vars) throws IOException,
      ServletException {
    String ln = vars.getSessionValue("ApplyModules|Last_Line_Number_Log");
    if (ln == null || ln.equals("")) {
      return;
    }
    OBError error = new OBError();
    PreparedStatement ps;
    PreparedStatement ps2;
    try {
      ps = getPreparedStatement("SELECT MESSAGE FROM AD_ERROR_LOG WHERE ERROR_LEVEL='ERROR' ORDER BY CREATED DESC");
      ps.executeQuery();
      ResultSet rs = ps.getResultSet();
      if (rs.next()) {
        error.setType("Error");
        error.setTitle(Utility.messageBD(myPool, "Error", vars.getLanguage()));
        error
            .setMessage(Utility.messageBD(myPool, "BuildError", vars.getLanguage())
                + "<a href=\"http://wiki.openbravo.com/wiki/ERP/2.50/Update_Tips\" target=\"_blank\" class=\"MessageBox_TextLink\">"
                + Utility.messageBD(myPool, "ThisLink", vars.getLanguage()) + "</a>");

      } else {
        ps2 = getPreparedStatement("SELECT MESSAGE FROM AD_ERROR_LOG WHERE ERROR_LEVEL='WARN'");
        ps2.executeQuery();
        ResultSet rs2 = ps2.getResultSet();
        if (rs2.next()) {
          error.setType("Warning");
          error.setTitle(Utility.messageBD(myPool, "Warning", vars.getLanguage()));
          error
              .setMessage(Utility.messageBD(myPool, "BuildWarning", vars.getLanguage())
                  + "<a href=\"http://wiki.openbravo.com/wiki/ERP/2.50/Update_Tips\" target=\"_blank\" class=\"MessageBox_TextLink\">"
                  + Utility.messageBD(myPool, "ThisLink", vars.getLanguage()) + "</a>"
                  + Utility.messageBD(myPool, "BuildWarning2", vars.getLanguage()));

        } else {
          error.setType("Success");
          error.setTitle(Utility.messageBD(myPool, "Success", vars.getLanguage()));
          error.setMessage(Utility.messageBD(myPool, "BuildSuccessful", vars.getLanguage()));
        }
      }
    } catch (Exception e) {
    }

    XStream xs = new XStream(new JettisonMappedXmlDriver());
    xs.alias("OBError", OBError.class);
    String strResult = xs.toXML(error);
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.print(strResult);
    out.close();
  }
}
