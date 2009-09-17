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
 * All portions are Copyright (C) 2008-2009 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.erpCommon.ad_process;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Timestamp;
import java.util.Calendar;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.hibernate.criterion.Expression;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.system.SystemInformation;
import org.openbravo.model.ad.ui.Process;
import org.openbravo.model.ad.ui.ProcessRequest;
import org.openbravo.model.ad.ui.ProcessRun;
import org.openbravo.scheduling.OBScheduler;
import org.openbravo.scheduling.ProcessBundle;
import org.openbravo.scheduling.ProcessContext;
import org.openbravo.scheduling.ProcessRunner;
import org.openbravo.scheduling.ProcessBundle.Channel;
import org.openbravo.xmlEngine.XmlDocument;

public class TestHeartbeat extends HttpSecureAppServlet {

  private static final long serialVersionUID = 1L;
  private static final String HB_Process_ID = "1005800000";
  private static final String HB_tabId = "1005400005";
  private static final String SystemInfomation_ID = "0";
  private static final String EVERY_N_DAYS = "N";
  private static final String SCHEDULE = "S";

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {

    VariablesSecureApp vars = new VariablesSecureApp(request);

    final Process HBProcess = OBDal.getInstance().get(Process.class, HB_Process_ID);
    final SystemInformation sysInfo = OBDal.getInstance().get(SystemInformation.class,
        SystemInfomation_ID);
    final boolean isHearbeatEnabled = sysInfo.isEnableHeartbeat() == null ? false : sysInfo
        .isEnableHeartbeat();

    final String clickedButton = vars.getStringParameter("inpLastFieldChanged");

    if (isHearbeatEnabled || clickedButton.equalsIgnoreCase("inpisheartbeatactive")) {
      // Disable Heartbeat
      try {
        // Deactivating the process at SystemInfo
        sysInfo.setEnableHeartbeat(false);
        sysInfo.setTestHeartbeat("N");
        OBDal.getInstance().save(sysInfo);

        // Un-scheduling the process
        final OBCriteria<ProcessRequest> prCriteria = OBDal.getInstance().createCriteria(
            ProcessRequest.class);
        prCriteria.add(Expression.eq(ProcessRequest.PROPERTY_PROCESS, HBProcess));
        prCriteria
            .add(Expression.eq(ProcessRequest.PROPERTY_CHANNEL, Channel.SCHEDULED.toString()));
        final List<ProcessRequest> requestList = prCriteria.list();

        if (requestList.size() != 0) {

          final ProcessRequest pr = requestList.get(0);

          OBDal.getInstance().save(pr);
          OBDal.getInstance().commitAndClose();

          final ProcessBundle bundle = ProcessBundle.request(pr.getId(), vars, this);

          OBScheduler.getInstance().unschedule(pr.getId(), bundle.getContext());
        }

        String msg = Utility.messageBD(this, "HB_SUCCESS", vars.getLanguage());
        advisePopUpRefresh(request, response, "SUCCESS", "Heartbeat Configuration", msg);

      } catch (Exception e) {
        log4j.error(e.getMessage(), e);
        advisePopUpRefresh(request, response, "ERROR", "Heartbeat Configuration", e.getMessage());
      }

    } else { // Enable Heartbeat

      try {

        HBProcess.setActive(true);
        OBDal.getInstance().save(HBProcess);

        // Activating the process at SystemInfo
        sysInfo.setEnableHeartbeat(true);
        sysInfo.setTestHeartbeat("Y");
        OBDal.getInstance().save(sysInfo);

        // Committing because SQLC uses a different connection
        OBDal.getInstance().commitAndClose();

        // Making the first beat
        ProcessBundle bundle = new ProcessBundle(HB_Process_ID, vars).init(this);
        final String beatExecutionId = new ProcessRunner(bundle).execute(this);

        // Getting beat result
        final OBCriteria<ProcessRun> runCriteria = OBDal.getInstance().createCriteria(
            ProcessRun.class);
        runCriteria.add(Expression.eq(ProcessRun.PROPERTY_ID, beatExecutionId));
        final List<ProcessRun> prl = runCriteria.list();
        final ProcessRun processRunResult = prl.get(0);

        if (processRunResult.getStatus().equals("ERR")) {
          // Restoring not active state
          sysInfo.setEnableHeartbeat(false);
          sysInfo.setTestHeartbeat("N");
          OBDal.getInstance().save(sysInfo);
          OBDal.getInstance().commitAndClose();

          String msg = Utility.messageBD(this, "HB_INTERNAL_ERROR", vars.getLanguage());
          msg += "\n" + processRunResult.getLog();
          msg = Utility.formatMessageBDToHtml(msg);

          if (vars.commandIn("CONFIGURE")) {
            OBError err = new OBError();
            err.setType("Error");
            err.setMessage(msg);
            vars.setMessage(HB_tabId, err);
            printPageRedirect(response, vars);
          } else {
            advisePopUpRefresh(request, response, "ERROR", "Heartbeat Configuration", msg);
          }
          return;
        }

        // Scheduling the process
        final OBCriteria<ProcessRequest> prCriteria = OBDal.getInstance().createCriteria(
            ProcessRequest.class);
        prCriteria.add(Expression.eq(ProcessRequest.PROPERTY_PROCESS, HBProcess));
        prCriteria
            .add(Expression.eq(ProcessRequest.PROPERTY_CHANNEL, Channel.SCHEDULED.toString()));
        final List<ProcessRequest> requestList = prCriteria.list();

        ProcessRequest pr = null;

        if (requestList.size() == 0) {
          pr = OBProvider.getInstance().get(ProcessRequest.class);
          pr.setProcess(HBProcess);
          pr.setActive(true);

          // Schedule the next beat in 7 days
          Calendar c1 = Calendar.getInstance();
          c1.add(Calendar.DATE, 7);
          pr.setStartDate(c1.getTime());

          // At today's same time
          pr.setStartTime(new Timestamp(Calendar.getInstance().getTimeInMillis()));

          pr.setSecurityBasedOnRole(true);
          pr.setDailyOption(EVERY_N_DAYS);
          pr.setDailyInterval(Long.parseLong("7"));
          pr.setTiming(SCHEDULE);
          final ProcessContext context = new ProcessContext(vars);
          pr.setOpenbravoContext(context.toString());

        } else {
          pr = requestList.get(0);
        }

        OBDal.getInstance().save(pr);

        // SQLC uses a different connection
        OBDal.getInstance().commitAndClose();

        final ProcessBundle bundle2 = ProcessBundle.request(pr.getId(), vars, this);
        if (requestList.size() == 0) {
          OBScheduler.getInstance().schedule(pr.getId(), bundle2);
        } else {
          OBScheduler.getInstance().reschedule(pr.getId(), bundle2);
        }

        String msg = Utility.messageBD(this, "HB_SUCCESS", vars.getLanguage());
        advisePopUpRefresh(request, response, "SUCCESS", "Heartbeat Configuration", msg);

      } catch (Exception e) {
        log4j.error(e.getMessage(), e);
        advisePopUpRefresh(request, response, "ERROR", "Heartbeat Configuration", e.getMessage());
      }
    }
  }

  private void printPageRedirect(HttpServletResponse response, VariablesSecureApp vars)
      throws IOException, ServletException {
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();

    XmlDocument xmlDocument = null;
    xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_process/HeartbeatRedirect")
        .createXmlDocument();

    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());
    out.println(xmlDocument.print());
    out.close();
  }
}
