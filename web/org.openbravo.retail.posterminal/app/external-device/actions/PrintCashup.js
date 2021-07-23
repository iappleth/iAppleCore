/*
 ************************************************************************************
 * Copyright (C) 2021 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

OB.App.StateAPI.Global.registerAction('printCashup', (state, payload) => {
  const newState = { ...state };
  const data = payload;

  const printCashup = OB.App.State.Messages.Utils.createNewMessage(
    '',
    '',
    data,
    { type: 'printCashup', consumeOffline: true }
  );

  newState.Messages = [...newState.Messages, printCashup];

  return newState;
});
