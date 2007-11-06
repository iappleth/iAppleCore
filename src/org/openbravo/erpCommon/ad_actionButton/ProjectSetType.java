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
package org.openbravo.erpCommon.ad_actionButton;

//import com.sun.mail.smtp.SMTPMessage;
import org.openbravo.erpCommon.utility.SequenceIdData;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.erpCommon.utility.ComboTableData;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.utils.FormatUtilities;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.xmlEngine.XmlDocument;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

// imports for transactions
import java.sql.Connection;

public class ProjectSetType extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;
  

  public void init (ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);

    if (vars.commandIn("DEFAULT")) {
      String strProcessId = vars.getStringParameter("inpProcessId");
      String strWindow = vars.getStringParameter("inpwindowId");
      String strTab = vars.getStringParameter("inpTabId");
      String strProjectType = vars.getStringParameter("inpcProjecttypeId", "");
      String strKey = vars.getRequiredGlobalVariable("inpcProjectId", strWindow + "|C_Project_ID");
      if (!ProjectSetTypeData.hasProjectType(this, strKey)) printPage(response, vars, strKey, strProjectType, strWindow, strTab, strProcessId);
      else bdError(response, "ProjectSetTypeError", vars.getLanguage());
    } else if (vars.commandIn("SAVE")) {
      String strWindow = vars.getStringParameter("inpwindowId");
      String strProjectType = vars.getStringParameter("inpcProjecttypeId");
      String strKey = vars.getRequestGlobalVariable("inpcProjectId", strWindow + "|C_Project_ID");
      String strTab = vars.getStringParameter("inpTabId");
      ActionButtonDefaultData[] tab = ActionButtonDefaultData.windowName(this, strTab);
      String strWindowPath="", strTabName="";
      if (tab!=null && tab.length!=0) {
        strTabName = FormatUtilities.replace(tab[0].name);
        strWindowPath = "../" + FormatUtilities.replace(tab[0].description) + "/" + strTabName + "_Relation.html";
      } else strWindowPath = strDefaultServlet;
      OBError myMessage = processButton(vars, strKey, strProjectType, strWindow);
      vars.setMessage(strTab, myMessage);
      printPageClosePopUp(response, vars, strWindowPath);
    } else pageErrorPopUp(response);
  }


  OBError processButton(VariablesSecureApp vars, String strKey, String strProjectType, String windowId) {
    Connection conn = null;
    OBError myMessage = new OBError();
    try {
      conn = this.getTransactionConnection();
      ProjectSetTypeData[] data = ProjectSetTypeData.select(this, strProjectType);
      ProjectSetTypeData[] dataProject = ProjectSetTypeData.selectProject(this, strKey);
      String strProjectPhase = "";
      String strProjectTask = "";
      for (int i=0;data!=null && i<data.length;i++){
        strProjectPhase = SequenceIdData.getSequence(this, "C_ProjectPhase", dataProject[0].adClientId);
        if (ProjectSetTypeData.insertProjectPhase(conn, this, strKey, dataProject[0].adClientId, dataProject[0].adOrgId, vars.getUser(), data[i].description, data[i].mProductId, data[i].cPhaseId, strProjectPhase, data[i].help, data[i].name, data[i].standardqty, data[i].seqno)==1){
            ProjectSetTypeData[] data1 = ProjectSetTypeData.selectTask(this, data[i].cPhaseId);
            for (int j=0;data1!=null && j<data1.length;j++){
                strProjectTask = SequenceIdData.getSequence(this, "C_ProjectTask", dataProject[0].adClientId);
                ProjectSetTypeData.insertProjectTask(conn, this,strProjectTask,data1[j].cTaskId, dataProject[0].adClientId, dataProject[0].adOrgId, vars.getUser(), data1[j].seqno, data1[j].name,data1[j].description, data1[j].help, data1[j].mProductId, strProjectPhase, data1[j].standardqty);
            }
        }
      }
      String strProjectCategory = ProjectSetTypeData.selectProjectCategory(this, strProjectType);
      ProjectSetTypeData.update(conn, this, vars.getUser(), strProjectType, strProjectCategory, strKey);
      releaseCommitConnection(conn);
      myMessage.setType("Success");
      myMessage.setTitle(Utility.messageBD(this, "Success", vars.getLanguage()));
      myMessage.setMessage(Utility.messageBD(this, "ProcessOK", vars.getLanguage()));
      return myMessage;
    } catch (Exception e) {
      try {
        releaseRollbackConnection(conn);
      } catch (Exception ignored) {}
      e.printStackTrace();
      log4j.warn("Rollback in transaction");
      myMessage.setType("Error");
      myMessage.setTitle(Utility.messageBD(this, "Error", vars.getLanguage()));
      myMessage.setMessage(Utility.messageBD(this, "ProcessRunError", vars.getLanguage()));
      return myMessage;
    }
  }


  void printPage(HttpServletResponse response, VariablesSecureApp vars, String strKey, String strProjectType, String windowId, String strTab, String strProcessId)
    throws IOException, ServletException {
      if (log4j.isDebugEnabled()) log4j.debug("Output: Button process Project set Type");

      ActionButtonDefaultData[] data = null;
      String strHelp="", strDescription="";
      if (vars.getLanguage().equals("en_US")) data = ActionButtonDefaultData.select(this, strProcessId);
      else data = ActionButtonDefaultData.selectLanguage(this, vars.getLanguage(), strProcessId);

      if (data!=null && data.length!=0) {
        strDescription = data[0].description;
        strHelp = data[0].help;
      }
      String[] discard = {""};
      if (strHelp.equals("")) discard[0] = new String("helpDiscard");
      XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_actionButton/ProjectSetType", discard).createXmlDocument();
      xmlDocument.setParameter("key", strKey);
      xmlDocument.setParameter("window", windowId);
      xmlDocument.setParameter("tab", strTab);
      xmlDocument.setParameter("language", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
      xmlDocument.setParameter("question", Utility.messageBD(this, "StartProcess?", vars.getLanguage()));
      xmlDocument.setParameter("direction", "var baseDirection = \"" + strReplaceWith + "/\";\n");
      xmlDocument.setParameter("theme", vars.getTheme());
      xmlDocument.setParameter("description", strDescription);
      xmlDocument.setParameter("help", strHelp);

    try {
      ComboTableData comboTableData = new ComboTableData(vars, this, "TABLEDIR", "C_ProjectType_ID", "", "Project type service", Utility.getContext(this, vars, "#User_Org", ""), Utility.getContext(this, vars, "#User_Client", ""), 0);
      Utility.fillSQLParameters(this, vars, null, comboTableData, "", strProjectType);
      xmlDocument.setData("reportcProjecttypeId", "liststructure", comboTableData.select(false));
      comboTableData = null;
    } catch (Exception ex) {
      throw new ServletException(ex);
    }

    xmlDocument.setParameter("cProjecttypeId", strProjectType);

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  public String getServletInfo() {
    return "Servlet Project set Type";
  } // end of getServletInfo() method
}

