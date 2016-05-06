/*
 ************************************************************************************
 * Copyright (C) 2014-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, Backbone, $, _ */

OB.UTIL.HookManager.registerHook('OBMOBC_PreWindowOpen', function (args, callbacks) {
  var context = args.context,
      windows = args.windows,
      window;

  window = _.filter(windows, function (wind) {
    return wind.route === context.route;
  });

  OB.UTIL.Approval.requestApproval(
  context.model, window[0].approvalType, function (approved, supervisor, approvalType) {
    if (approved) {
      args.cancellation = false;
    } else {
      args.cancellation = true;
    }
    OB.UTIL.HookManager.callbackExecutor(args, callbacks);
  });
});