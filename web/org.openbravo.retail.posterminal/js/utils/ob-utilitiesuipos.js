/*
 ************************************************************************************
 * Copyright (C) 2012-2018 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, _, enyo */

OB.UTIL = window.OB.UTIL || {};


OB.UTIL.sendLastTerminalStatusValues = function (callback) {
  var process = new OB.DS.Process('org.openbravo.retail.posterminal.process.LastTerminalStatusTimestamps');
  process.exec({
    posterminalId: OB.MobileApp.model.get('terminal').id,
    lastFullRefresh: OB.UTIL.localStorage.getItem('POSLastTotalRefresh'),
    lastIncRefresh: OB.UTIL.localStorage.getItem('POSLastIncRefresh'),
    lastCacheGeneration: OB.UTIL.localStorage.getItem("LastCacheGeneration"),
    lastJSGeneration: OB.UTIL.localStorage.getItem("LastJSGeneration_" + OB.MobileApp.model.get('appName'))
  }, function (data, message) {
    if (callback instanceof Function) {
      callback();
    }
  }, function (error) {
    if (callback instanceof Function) {
      callback();
    }
  });
};

OB.UTIL.getImageURL = function (id) {
  var imageUrl = 'productImages/';
  var i;
  for (i = 0; i < id.length; i += 3) {
    if (i !== 0) {
      imageUrl += "/";
    }
    imageUrl += id.substring(i, ((i + 3) < id.length) ? (i + 3) : id.length);
  }
  imageUrl += "/" + id;
  return imageUrl;
};

OB.UTIL.getMinimizedImageURL = function (id) {
  return this.getImageURL(id) + '_min';
};

OB.UTIL.getNumberOfSequence = function (documentNo, isQuotation) {
  if (!OB.UTIL.isNullOrUndefined(OB.MobileApp.model.get('terminal')) && !OB.UTIL.isNullOrUndefined(OB.MobileApp.model.get('terminal')).docNoPrefix) {
    var posDocumentNoPrefix = OB.MobileApp.model.get('terminal').docNoPrefix;
    if (isQuotation) {
      posDocumentNoPrefix = OB.MobileApp.model.get('terminal').quotationDocNoPrefix;
    }
    return parseInt(documentNo.substr(posDocumentNoPrefix.length + 1), 10);
  } else {
    return null;
  }
};

OB.UTIL.getPaymentByKey = function (key) {
  var i;
  var terminalPayments = OB.MobileApp.model.get('payments');
  for (i = 0; i < terminalPayments.length; i++) {
    if (terminalPayments[i].payment.searchKey === key) {
      return terminalPayments[i];
    }
  }
  return null;
};

/**
 * Facilitates to work reliably with currency conversions
 *   in the easiest way, you will just need to do like this:
 *     add the conversor:
 *       OB.UTIL.currency.addConversion(fromCurrencyId, toCurrencyId)
 *
 *     get the conversor, depending on what you want:
 *       var cD = OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, amount)
 *       var cF = OB.UTIL.currency.toForeignCurrency(toCurrencyId, amount)
 *
 *
 *   expert use:
 *   case 1: retail
 *     when selling, to get the converted amount of a good, you should use getTangibleOf(amount)
 *     e.g: the Avalanche Transceiver in sampledata cost 150.5€ or getTangibleOf(150.5) = 197.81$
 *
 *   case 2: doble conversion
 *     when you have already converted one currency to another and want to convert the resulted amount again you will want to convert it back with full precision. use getFinancialAmountOf(amount)
 *     e.g: when showing a foreign value to the user
 *
 *   case 3: financial accounts (a doble conversion with sensitive data)
 *     when you deposit foreign money in a local financial account you should use getFinancialAmountOf(amount)
 *     e.g: when you deposit a 100$ bill in a bank account that is in euros -> getFinancialAmountOf(100) = 74.082324€
 *
 */
OB.UTIL.currency = {
  conversions: [],
  webPOSDefaultCurrencyId: function () {
    return OB.MobileApp.model.get('currency').id.toString();
  },
  isDefaultCurrencyId: function (currencyId) {
    // argument checks
    OB.UTIL.Debug.isDefined(currencyId, "Missing required argument 'currencyId' in OB.UTIL.currency.isDefaultCurrencyId");

    currencyId = currencyId.toString();

    return currencyId === OB.UTIL.currency.webPOSDefaultCurrencyId();
  },
  /**
   * add a conversion rate from the fromCurrencyId currency to the toCurrencyId currency into the conversions array
   * @param {currencyId}    fromCurrencyId    currencyId of the original amount
   * @param {currencyId}    toCurrencyId      currencyId of the resulting amount
   * @param {float}         rate              exchange rate to calculate the resulting amount
   */
  addConversion: function (fromCurrencyId, toCurrencyId, rate) {
    // argument checks
    OB.UTIL.Debug.isDefined(fromCurrencyId, "Missing required argument 'fromCurrencyId' in OB.UTIL.currency.addConversion");
    OB.UTIL.Debug.isDefined(toCurrencyId, "Missing required argument 'toCurrencyId' in OB.UTIL.currency.addConversion");
    OB.UTIL.Debug.isDefined(rate, "Missing required argument 'rate' in OB.UTIL.currency.addConversion");

    fromCurrencyId = fromCurrencyId.toString();
    toCurrencyId = toCurrencyId.toString();
    rate = parseFloat(rate, 10);

    if (fromCurrencyId === toCurrencyId) {
      OB.error('There is no point in converting a currencyId to itself');
      return;
    }

    var conversionAlreadyExists = this.findConverter(fromCurrencyId, toCurrencyId);
    if (conversionAlreadyExists) {
      if (conversionAlreadyExists.rate !== rate) {
        OB.error('The rate for a currency is trying to be changed. If you are not trying to change the rate, something needs critical and inmediate fixing. If you really want to change the rate and know what you are doing, clean the OB.UTIL.currency.conversions array and fill it again.');
      }
      return; // the conversor is already present. this is fine, unless a lot of calls are finishing here
    }
    this.conversions.push({
      fromCurrencyId: fromCurrencyId,
      toCurrencyId: toCurrencyId,
      rate: rate,
      toCurrencyIdPrecision: OB.DEC.getScale(),
      // TODO: get, from the backend, the precisions for the currency with the id = toCurrencyId
      isToCurrencyIdForeign: toCurrencyId !== OB.UTIL.currency.webPOSDefaultCurrencyId(),
      /**
       * Get a rounded exchanged amount that indicates the amount in the real world, say money, card tickets, etc
       *   e.g: the Avalanche Transceiver in sampledata cost 150.5€ or getTangibleOf(150.5) = 197.81$
       * @param  {float}     amountToRound  the amount to be converted to toCurrencyId
       * @return {float}     the converted amount using the exchange rate rounded to the precision set in preferences for toCurrencyId
       */
      getTangibleOf: function (amountToRound) {
        if (this.toCurrencyId === OB.UTIL.currency.webPOSDefaultCurrencyId()) {
          OB.error('You cannot get a tangible of a foreign currency because it has already a value in local currency. If you are trying to get the amount for a financial account, use the getFinancialAmountOf function');
          return;
        }
        return OB.DEC.mul(amountToRound, rate, OB.UTIL.currency.toCurrencyIdPrecision);
      },
      /**
       * Get a full precision converted amount which origin is real money and will and will be added to a local currency financial account
       *   e.g: when you deposit a 100$ bill in a bank account that is in euros -> getExchangeOfTangible(100) = 74.082€
       * @param  {float}     amountToRound  the amount to be converted to toCurrencyId
       * @return {float}     the converted amount using the exchange rate rounded to the precision set in preferences for toCurrencyId
       */
      getFinancialAmountOf: function (amount) {
        if (this.fromCurrencyId === OB.UTIL.currency.webPOSDefaultCurrencyId()) {
          OB.error('You are trying to get a financial amount value that is not from a foreign currency');
          return;
        }
        return OB.DEC.mul(amount, rate);
      },
      toString: function () {
        return this.fromCurrencyId + ' -> ' + this.toCurrencyId + '; rate:' + this.rate.toFixed(5);
      }
    });
  },
  /**
   * get all the converters available in the internal converters array
   * @return {array of converters}  the converters available in the internal converters array
   */
  getConversions: function () {
    return this.conversions;
  },
  /**
   * Find the converter with the indicated fromCurrencyId and toCurrencyId in the internal converters array
   * Developer: you, most likely, won't need this function. If so, change this comment
   */
  findConverter: function (fromCurrencyId, toCurrencyId) {
    // argument checks
    OB.UTIL.Debug.isDefined(fromCurrencyId, "Missing required argument 'fromCurrencyId' in OB.UTIL.currency.findConverter");
    OB.UTIL.Debug.isDefined(toCurrencyId, "Missing required argument 'toCurrencyId' in OB.UTIL.currency.findConverter");

    fromCurrencyId = fromCurrencyId.toString();
    toCurrencyId = toCurrencyId.toString();

    return _.find(this.conversions, function (c) {
      return (c.fromCurrencyId === fromCurrencyId) && (c.toCurrencyId === toCurrencyId);
    });
  },
  /**
   * Returns a converter to operate with amounts that will be converted from fromCurrencyId to toCurrencyId
   * @param  {currencyId} fromCurrencyId the original currencyId
   * @param  {currencyId} toCurrencyId   the destination currencyId
   * @return {converter}                 the converter to convert amounts from the fromCurrencyId currency to the toCurrencyId currency
   */
  getConverter: function (fromCurrencyId, toCurrencyId) {
    // argument checks
    OB.UTIL.Debug.isDefined(fromCurrencyId, "Missing required argument 'fromCurrencyId' in OB.UTIL.currency.getConverter");
    OB.UTIL.Debug.isDefined(toCurrencyId, "Missing required argument 'toCurrencyId' in OB.UTIL.currency.getConverter");

    fromCurrencyId = fromCurrencyId.toString();
    toCurrencyId = toCurrencyId.toString();

    var found = this.findConverter(fromCurrencyId, toCurrencyId);
    if (!found) {
      OB.error('Currency converter not added: ' + fromCurrencyId + ' -> ' + toCurrencyId);
    }
    return found;
  },
/**
   * Returns a converter whose original currency is not the WebPOS currency. e.g: USD in sampledata
   * and whose destiny curency is the WebPOS default currency. i.e: OB.MobileApp.model.get('currency').id
    return this.getConverter(webPOSDefaultCurrencyId(), toCurrencyId);
   * @param  {currencyId} fromCurrencyId  the currencyId of the original currency
   * @return {converter}                  the converter to convert amounts from fromCurrencyId to the WebPOS default currency
   */
  getToLocalConverter: function (fromCurrencyId) {
    // argument checks
    OB.UTIL.Debug.isDefined(fromCurrencyId, "Missing required argument 'fromCurrencyId' in OB.UTIL.currency.getToLocalConverter");

    fromCurrencyId = fromCurrencyId.toString();

    return this.getConverter(fromCurrencyId, this.webPOSDefaultCurrencyId());
  },
  /**
   * Returns a converter whose destiny currency is not the WebPOS currency. e.g: USD in sampledata
   * and whose original curency is the WebPOS default currency. i.e: OB.MobileApp.model.get('currency').id
   * @param  {currencyId} toCurrencyId  the currencyId of the destiny currency
   * @return {converter}                the converter to convert amounts from WebPOS default currency to toCurrencyId
   */
  getFromLocalConverter: function (toCurrencyId) {
    // argument checks
    OB.UTIL.Debug.isDefined(toCurrencyId, "Missing required argument 'toCurrencyId' in OB.UTIL.currency.getFromLocalConverter");

    toCurrencyId = toCurrencyId.toString();

    return this.getConverter(this.webPOSDefaultCurrencyId(), toCurrencyId);
  },
  /**
   * converts an amount to the WebPOS amount currency
   * @param  {currencyId} fromCurrencyId    the currencyId of the amount to be converted
   * @param  {float}      amount            the amount to be converted
   * @return {float}                        the converted amount
   */
  toDefaultCurrency: function (fromCurrencyId, amount) {
    // argument checks
    OB.UTIL.Debug.isDefined(fromCurrencyId, "Missing required argument 'fromCurrencyId' in OB.UTIL.currency.toDefaultCurrency");
    OB.UTIL.Debug.isDefined(amount, "Missing required argument 'amount' in OB.UTIL.currency.toDefaultCurrency");

    fromCurrencyId = fromCurrencyId.toString();

    if (fromCurrencyId === this.webPOSDefaultCurrencyId()) {
      return amount;
    }
    var converter = this.getToLocalConverter(fromCurrencyId);
    var foreignAmount = converter.getFinancialAmountOf(amount);
    return foreignAmount;
  },
  /**
   * converts an amount from the WebPOS currency to the toCurrencyId currency
   * @param  {currencyId} toCurrencyId      the currencyId of the final amount
   * @param  {float}      amount            the amount to be converted
   * @return {float}                        the converted amount
   */
  toForeignCurrency: function (toCurrencyId, amount) {
    // argument checks
    OB.UTIL.Debug.isDefined(toCurrencyId, "Missing required argument 'toCurrencyId' in OB.UTIL.currency.toForeignCurrency");
    OB.UTIL.Debug.isDefined(amount, "Missing required argument 'amount' in OB.UTIL.currency.toForeignCurrency");

    toCurrencyId = toCurrencyId.toString();

    if (toCurrencyId === this.webPOSDefaultCurrencyId()) {
      return amount;
    }
    var converter = this.getFromLocalConverter(toCurrencyId);
    var foreignAmount = converter.getTangibleOf(amount);
    return foreignAmount;
  }

};

// Experimental method that could be introduced in ECMAScript 6. If this happens, this method should be removed and the calling methods should replace it with 'Math.sign'
// As of now, Nov 2014, Math.sign is supported by chrome v38 but not by Safari
OB.UTIL.Math = window.OB.UTIL.Math || {};
OB.UTIL.Math.sign = function (x) {
  x = +x; // convert to a number
  if (x === 0 || isNaN(x)) {
    return x;
  }
  return x > 0 ? 1 : -1;
};

OB.UTIL.getPriceListName = function (priceListId, callback) {
  if (priceListId) {
    if (OB.MobileApp.model.get('pricelist').id === priceListId) {
      callback(OB.MobileApp.model.get('pricelist').name);
    } else {
      OB.Dal.get(OB.Model.PriceList, priceListId, function (pList) {
        callback(pList.get('name'));
      });
    }
  } else {
    callback('');
  }

};

/**
 * Generic approval checker. It validates user/password can approve the approvalType.
 * It can work online in case that user has done at least once the same approvalType
 * in this same browser. Data regarding privileged users is stored in supervisor table
 */
OB.UTIL.checkApproval = function (approvalType, username, password, callback, windowModel) {
  enyo.$.scrim.show();
  OB.Dal.initCache(OB.Model.Supervisor, [], null, null);
  var approvalList = [];
  approvalType.forEach(function (approvalType) {
    approvalList.push(typeof (approvalType) === 'object' ? approvalType.approval : approvalType);
  });

  new OB.DS.Process('org.openbravo.retail.posterminal.utility.CheckApproval').exec({
    u: username,
    p: password,
    approvalType: JSON.stringify(approvalList)
  }, enyo.bind(this, function (response, message) {
    var approved = false;
    if (response.exception) {
      callback(false, null, null, true, response.exception.message);
    } else {
      approved = response.canApprove;

      if (!approved) {
        callback(false, null, null, false, OB.I18N.getLabel('OBPOS_UserCannotApprove', [username]));
      }

      // saving supervisor in local so next time it is possible to approve offline
      OB.Dal.find(OB.Model.Supervisor, {
        'id': response.userId
      }, enyo.bind(this, function (users) {
        var supervisor, date, permissions = [];
        if (users.models.length === 0) {
          // new user
          if (response.canApprove) {
            // insert in local db only in case it is supervisor for current type
            date = new Date().toString();
            supervisor = new OB.Model.Supervisor();

            supervisor.set('id', response.userId);
            supervisor.set('name', username);
            supervisor.set('password', OB.MobileApp.model.generate_sha1(password + date));
            supervisor.set('created', date);
            // Set all permissions
            if (response.preference) {
              _.each(response.preference, function (perm) {
                permissions.push(perm);
              }, this);
              supervisor.set('permissions', JSON.stringify(permissions));
            } else {
              supervisor.set('permissions', JSON.stringify(approvalType));
            }
            OB.Dal.save(supervisor, null, null, true);
          }
        } else {
          // update existent user granting or revoking permission
          supervisor = users.models[0];

          supervisor.set('password', OB.MobileApp.model.generate_sha1(password + supervisor.get('created')));
          if (supervisor.get('permissions')) {
            permissions = JSON.parse(supervisor.get('permissions'));
          }

          if (response.canApprove) {
            // grant permission if it does not exist
            _.each(approvalType, function (perm) {
              if (!_.contains(permissions, perm)) {
                permissions.push(perm);
              }
            }, this);

          } else {
            // revoke permission if it exists
            _.each(approvalType, function (perm) {
              if (_.contains(permissions, perm)) {
                permissions = _.without(permissions, perm);
              }
            }, this);
          }
          supervisor.set('permissions', JSON.stringify(permissions));

          OB.Dal.save(supervisor);
        }

        callback(approved, supervisor, approvalType, true, null);
      }));
    }
  }), enyo.bind(this, function () {
    // offline
    OB.Dal.find(OB.Model.Supervisor, {
      'name': username
    }, enyo.bind(this, function (users) {
      var supervisor, countApprovals = 0,
          approved = false;
      if (users.models.length === 0) {
        countApprovals = 0;
        OB.Dal.find(OB.Model.User, null, enyo.bind(this, function (users) {
          _.each(users.models, function (user) {
            if (username === user.get('name') && user.get('password') === OB.MobileApp.model.generate_sha1(password + user.get('created'))) {
              _.each(approvalType, function (perm) {
                if (JSON.parse(user.get('terminalinfo')).permissions[perm]) {
                  countApprovals += 1;
                  supervisor = user;
                }
              }, this);
            }
          });
          if (countApprovals === approvalType.length) {
            approved = true;
            callback(approved, supervisor, approvalType, true, null);
          } else {
            callback(false, null, null, false, OB.I18N.getLabel('OBPOS_UserCannotApprove', [username]));
          }
        }), function () {});
      } else {
        supervisor = users.models[0];
        if (supervisor.get('password') === OB.MobileApp.model.generate_sha1(password + supervisor.get('created'))) {
          _.each(approvalType, function (perm) {
            if (_.contains(JSON.parse(supervisor.get('permissions')), perm)) {
              countApprovals += 1;
            }
          }, this);
          if (countApprovals === approvalType.length) {
            approved = true;
            callback(approved, supervisor, approvalType, true, null);
          } else {
            countApprovals = 0;
            OB.Dal.find(OB.Model.User, null, enyo.bind(this, function (users) {
              _.each(users.models, function (user) {
                if (username === user.get('name') && user.get('password') === OB.MobileApp.model.generate_sha1(password + user.get('created'))) {
                  _.each(approvalType, function (perm) {
                    if (JSON.parse(user.get('terminalinfo')).permissions[perm]) {
                      countApprovals += 1;
                      supervisor = user;
                    }
                  }, this);
                }
              });
              if (countApprovals === approvalType.length) {
                approved = true;
                callback(approved, supervisor, approvalType, true, null);
              } else {
                callback(false, null, null, false, OB.I18N.getLabel('OBPOS_UserCannotApprove', [username]));
              }
            }), function () {});
          }
        } else {
          callback(false, null, null, false, OB.I18N.getLabel('OBPOS_InvalidUserPassword'));
        }
      }
    }), function () {});
  }));

};

OB.UTIL.setScanningFocus = function (focus) {
  OB.MobileApp.view.scanningFocus(focus);
};

OB.UTIL.clearFlagAndTimersRefreshMasterData = function () {
  OB.MobileApp.model.set('refreshMasterdataShowPopup', true);
  OB.MobileApp.model.set('refreshMasterdata', false);
};

OB.UTIL.checkRefreshMasterData = function () {
  if (OB.MobileApp.model.get('refreshMasterdata') === true && OB.UTIL.refreshMasterDataGetProperty('allowedIncrementalRefresh')) {
    OB.UTIL.clearFlagAndTimersRefreshMasterData();
    OB.UTIL.refreshMasterData();
  }
};

OB.UTIL.checkRefreshMasterDataOnNavigate = function () {
  if (OB.MobileApp.model.get('refreshMasterdata') === true && OB.UTIL.refreshMasterDataGetProperty('incrementalRefreshOnNavigate')) {
    OB.UTIL.checkRefreshMasterData();
  }
};

OB.UTIL.refreshMasterData = function () {
  OB.MobileApp.model.set('secondsToRefreshMasterdata', 3);
  var counterIntervalId = null;
  counterIntervalId = setInterval(function () {
    OB.MobileApp.model.set('secondsToRefreshMasterdata', OB.MobileApp.model.get('secondsToRefreshMasterdata') - 1);
    if (OB.MobileApp.model.get('secondsToRefreshMasterdata') === 0) {
      OB.MobileApp.model.set('refreshMasterdataShowPopup', false);
      clearInterval(counterIntervalId);
      if (OB.UTIL.RfidController.isRfidConfigured()) {
        OB.UTIL.RfidController.disconnectRFIDDevice();
      }
      OB.UTIL.startLoadingSteps();
      OB.MobileApp.model.set('isLoggingIn', true);
      OB.UTIL.showLoading(true);
      OB.MobileApp.model.loadModels(null, true, function () {
        OB.UTIL.showLoading(false);
        if (OB.UTIL.RfidController.isRfidConfigured()) {
          OB.UTIL.RfidController.connectRFIDDevice();
        }
        OB.MobileApp.model.set('isLoggingIn', false);
      });
    }
  }, 1000);

  OB.MobileApp.view.$.dialogsContainer.createComponent({
    kind: 'OB.UI.ModalAction',
    header: OB.I18N.getLabel('OBMOBC_MasterdataNeedsToBeRefreshed'),
    bodyContent: {
      content: OB.I18N.getLabel('OBMOBC_MasterdataNeedsToBeRefreshedMessage', [OB.MobileApp.model.get('secondsToRefreshMasterdata')])
    },
    bodyButtons: {
      kind: 'OB.UI.ModalDialogButton',
      content: OB.I18N.getLabel('OBMOBC_LblCancel'),
      tap: function () {
        OB.MobileApp.model.set('refreshMasterdataShowPopup', false);
        OB.MobileApp.model.off('change:secondsToRefreshMasterdata');
        clearInterval(counterIntervalId);
        this.doHideThisPopup();
      }
    },
    autoDismiss: false,
    hideCloseButton: true,
    executeOnShow: function () {
      var reloadPopup = this;
      OB.MobileApp.model.on('change:secondsToRefreshMasterdata', function () {
        reloadPopup.$.bodyContent.$.control.setContent(OB.I18N.getLabel('OBMOBC_MasterdataNeedsToBeRefreshedMessage', [OB.MobileApp.model.get('secondsToRefreshMasterdata')]));
        if (OB.MobileApp.model.get('secondsToRefreshMasterdata') === 0) {
          reloadPopup.hide();
          OB.MobileApp.model.off('change:secondsToRefreshMasterdata');
        }
      });
    }
  }).show();

  OB.info(OB.I18N.getLabel('OBMOBC_MasterdataNeedsToBeRefreshed'));
  clearInterval(OB.MobileApp.model.get('refreshMasterdataIntervalHandler'));
  OB.MobileApp.model.set('refreshMasterdataIntervalHandler', setInterval(OB.UTIL.loadModelsIncFunc, OB.MobileApp.model.get('refreshMasterdataInterval')));
};

OB.UTIL.refreshMasterDataGetProperty = function (prop) {
  var currentWindow = _.find(OB.MobileApp.model.windows.models, function (win) {
    return win.get('route') === OB.MobileApp.view.currentWindow;
  });
  if (currentWindow) {
    var windowClass = currentWindow.get('windowClass');
    if (windowClass && typeof windowClass === 'function') {
      return windowClass.prototype[prop];
    }
  }
  return false;
};

OB.UTIL.loadModelsIncFunc = function () {
  var msg = OB.I18N.getLabel(OB.MobileApp.view.currentWindow === 'retail.pointofsale' ? 'OBPOS_MasterdataWillHappenOnCloseTicket' : 'OBPOS_MasterdataWillHappenOnReturnToWebPOS'),
      minutesToShowRefreshDataInc = OB.MobileApp.model.get('terminal').terminalType.minutesToShowRefreshDataInc,
      minShowIncRefresh = OB.UTIL.isNullOrUndefined(minutesToShowRefreshDataInc) ? undefined : minutesToShowRefreshDataInc * 60 * 1000;
  if (OB.UTIL.isNullOrUndefined(minShowIncRefresh) || minShowIncRefresh > 0) {
    OB.info(msg);
    OB.UTIL.showWarning(msg);
  }
  OB.MobileApp.model.set('refreshMasterdata', true);
  if (!OB.UTIL.isNullOrUndefined(minShowIncRefresh) && minShowIncRefresh >= 0) {
    var noActivityTimeout = OB.MobileApp.model.get('refreshMasterdataNoActivityTimeout');
    if (OB.UTIL.isNullOrUndefined(noActivityTimeout)) {
      OB.MobileApp.model.set('refreshMasterdataNoActivityTimeout', true);
      setTimeout(function () {
        // Refresh Master Data
        OB.MobileApp.model.unset('refreshMasterdataNoActivityTimeout');
        OB.UTIL.checkRefreshMasterData();
      }, minShowIncRefresh);
    }
  }
};