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
 * All portions are Copyright (C) 2024 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.application.messageclient;

import javax.websocket.Session;
import java.util.Date;

import org.openbravo.base.exception.OBException;

/**
 * WebSocket specific message client, keeps track of the websocket session for sending messages
 * through websocket
 */
public class WebSocketClient extends MessageClient {

  Session websocketSession;

  public WebSocketClient(String searchKey, String organizationId, String userId) {
    super(searchKey, organizationId, userId);
  }

  public WebSocketClient(String searchKey, String organizationId, String userId,
      Session websocketSession) {
    super(searchKey, organizationId, userId);
    this.websocketSession = websocketSession;
  }

  @Override
  public void sendMessage(String message) {
    if (this.websocketSession == null) {
      throw new OBException("WebSocket session has not been set, messages can't be sent.");
    }
    this.websocketSession.getAsyncRemote().sendText(message);
    timestampLastMsgSent = new Date();
  }
}
