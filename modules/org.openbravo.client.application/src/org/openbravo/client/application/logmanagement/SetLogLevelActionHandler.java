/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2018 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.application.logmanagement;

import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.core.LoggerContext;
import org.apache.logging.log4j.core.config.Configuration;
import org.apache.logging.log4j.core.config.LoggerConfig;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.client.application.process.BaseProcessActionHandler;
import org.openbravo.client.application.process.ResponseActionsBuilder;
import org.openbravo.erpCommon.utility.OBMessageUtils;

import java.util.List;
import java.util.Map;

/**
 * Action to set the log level to one or more Loggers
 */
public class SetLogLevelActionHandler extends BaseProcessActionHandler {

  private static final Logger log = LogManager.getLogger(SetLogLevelActionHandler.class);

  @Override
  protected JSONObject doExecute(Map<String, Object> parameters, String content) {
    try {
      JSONObject request = new JSONObject(content);
      JSONObject params = request.getJSONObject("_params");
      List<String> loggersToUpdate = JsonArrayUtils.convertJsonArrayToStringList(request
          .getJSONArray("recordIds"));
      Level newLogLevel = Level.getLevel(params.getString("level"));

      updateLoggerConfiguration(loggersToUpdate, newLogLevel);

      return getResponseBuilder().showMsgInView(ResponseActionsBuilder.MessageType.SUCCESS,
          OBMessageUtils.messageBD("Success"), OBMessageUtils.messageBD("OBUIAPP_LogLevelChanged" +
          "")).build();
    } catch (JSONException e) {
      log.error("Error in set log level process", e);
      return getResponseBuilder().showMsgInView(ResponseActionsBuilder.MessageType.ERROR,
          OBMessageUtils.messageBD("Error"), OBMessageUtils.messageBD("Error")).build();
    }
  }

  private void updateLoggerConfiguration(List<String> loggersToUpdate, Level newLogLevel) {
    final LoggerContext context = LoggerContext.getContext(false);
    final Configuration config = context.getConfiguration();

    for (String loggerName : loggersToUpdate) {
      LoggerConfig loggerConfig = config.getLoggerConfig(loggerName);
      loggerConfig.setLevel(newLogLevel);
      log.info("Setting logger {} to level {}", loggerName, newLogLevel.toString());
    }

    context.updateLoggers();
  }
}
