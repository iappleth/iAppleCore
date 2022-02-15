/*
 ************************************************************************************
 * Copyright (C) 2012-2022 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/* global enyo */

(function() {
  // initialize the WebPOS terminal model that extends the core terminal model. after this, OB.MobileApp.model will be available
  OB.Model.POSTerminal = OB.Model.Terminal.extend({
    setTerminalName: function(terminalName) {
      this.set('terminalName', terminalName);
      this.set('loginUtilsParams', {
        terminalName: terminalName
      });
      // set the terminal only if it was empty. this variable is used to detect if the terminal changed
      if (terminalName && !OB.UTIL.localStorage.getItem('terminalName')) {
        OB.UTIL.localStorage.setItem('terminalName', terminalName);
      }
    },

    initialize: function() {
      var me = this;

      me.set({
        appName: 'WebPOS',
        appModuleId: 'FF808181326CC34901326D53DBCF0018',
        appModulePrefix: 'OBPOS',
        supportsOffline: true,
        supportsExternalBusinessPartnerIntegration: true,
        profileHandlerUrl:
          'org.openbravo.retail.posterminal.ProfileUtilsServlet',
        loginUtilsUrl:
          '../../org.openbravo.retail.posterminal.service.loginutils',
        loginHandlerUrl:
          '../../org.openbravo.retail.posterminal/POSLoginHandler',
        applicationFormatUrl:
          '../../org.openbravo.mobile.core/OBPOS_Main/ApplicationFormats',
        logoutUrlParams:
          OB.UTIL.localStorage.getItem('terminalAuthentication') === 'Y'
            ? {}
            : {
                terminal: OB.UTIL.getParameterByName('terminal')
              },
        logConfiguration: {
          deviceIdentifier:
            OB.UTIL.localStorage.getItem('terminalAuthentication') === 'Y'
              ? OB.UTIL.localStorage.getItem('terminalName')
              : OB.UTIL.getParameterByName('terminal'),
          logPropertiesExtension: [
            function() {
              return {
                isOnline: OB.MobileApp.model.get('connectedToERP')
              };
            }
          ]
        },
        profileOptions: {
          showOrganization: false,
          showWarehouse: false,
          defaultProperties: {
            role: 'oBPOSDefaultPOSRole'
          }
        },
        // setting here the localDB, overrides the OB.MobileApp.model localDB default
        localDB: {
          size:
            OB.UTIL.VersionManagement.current.posterminal.WebSQLDatabase.size,
          name:
            OB.UTIL.VersionManagement.current.posterminal.WebSQLDatabase.name,
          displayName:
            OB.UTIL.VersionManagement.current.posterminal.WebSQLDatabase
              .displayName
        },
        logDBTrxThreshold: 300,
        logDBStmtThreshold: 1000,
        shouldExecuteBenchmark: true
      });

      me.setTerminalName(
        OB.UTIL.localStorage.getItem(
          'terminalAuthentication',
          me.get('appName')
        ) === 'Y'
          ? OB.UTIL.localStorage.getItem('terminalName', me.get('appName'))
          : OB.UTIL.getParameterByName('terminal')
      );

      OB.UTIL.HookManager.registerHook('OBMOBC_InitActions', function(args, c) {
        me.initActions(function() {
          me.setTerminalName(
            OB.UTIL.localStorage.getItem('terminalAuthentication') === 'Y'
              ? OB.UTIL.localStorage.getItem('terminalName')
              : OB.UTIL.getParameterByName('terminal')
          );
          me.set('logConfiguration', {
            deviceIdentifier:
              OB.UTIL.localStorage.getItem('terminalAuthentication') === 'Y'
                ? OB.UTIL.localStorage.getItem('terminalName')
                : OB.UTIL.getParameterByName('terminal'),
            logPropertiesExtension: [
              function() {
                return {
                  isOnline: OB.MobileApp.model.get('connectedToERP')
                };
              }
            ]
          });
          args.cancelOperation = true;
          OB.UTIL.HookManager.callbackExecutor(args, c);
        });
      });

      this.addPropertiesLoader({
        properties: ['terminal'],
        loadFunction: function(terminalModel) {
          OB.info('[terminal] Loading... ' + this.properties);
          var max, i, handleError, loadTerminalModel;
          var params = {};
          var currentDate = new Date();
          params.terminalTime = currentDate;
          params.terminalTimeOffset = currentDate.getTimezoneOffset();

          OB.DS.commonParams = OB.DS.commonParams || {};
          OB.DS.commonParams.terminalName = terminalModel.get('terminalName');

          handleError = function(data) {
            if (data && data.exception && data.exception.message) {
              var message;
              if (OB.I18N.hasLabel(data.exception.message)) {
                message = OB.I18N.getLabel(data.exception.message);
              } else {
                message = data.exception.message;
              }
              //Common error (not a random caught exception).
              // We might need to logout and login again to fix this.
              OB.UTIL.showConfirmation.display(
                OB.I18N.getLabel('OBMOBC_Error'),
                OB.I18N.getLabel('OBPOS_errorLoadingTerminal') + ' ' + message,
                [
                  {
                    label: OB.I18N.getLabel('OBMOBC_LblOk'),
                    isConfirmButton: true,
                    action: function() {
                      OB.UTIL.showLoggingOut(true);
                      terminalModel.logout();
                    }
                  }
                ],
                {
                  onShowFunction: function(popup) {
                    popup.$.headerCloseButton.hide();
                  },
                  autoDismiss: false
                }
              );
            } else if (OB.MobileApp.model.get('isLoggingIn') === true) {
              me.attemptToLoginOffline();
            }
          };

          loadTerminalModel = function() {
            new OB.DS.Request(
              'org.openbravo.retail.posterminal.term.Terminal'
            ).exec(
              params,
              async function(data) {
                if (data.exception) {
                  handleError(data);
                } else if (data[0]) {
                  var showTerminalModalError = function(errorMessage) {
                    OB.UTIL.showConfirmation.display(
                      OB.I18N.getLabel('OBMOBC_Error'),
                      OB.I18N.getLabel('OBPOS_errorLoadingTerminal') +
                        ' ' +
                        errorMessage,
                      [
                        {
                          label: OB.I18N.getLabel('OBMOBC_LblOk'),
                          isConfirmButton: true,
                          action: function() {
                            OB.UTIL.showLoggingOut(true);
                            terminalModel.logout();
                          }
                        }
                      ],
                      {
                        onShowFunction: function(popup) {
                          popup.$.headerCloseButton.hide();
                        },
                        autoDismiss: false
                      }
                    );
                  };

                  // load the OB.MobileApp.model
                  for (i = 0, max = data.length; i < max; i++) {
                    if (Object.keys(data[i])[0] === 'businesspartner') {
                      terminalModel.set(
                        Object.keys(data[i])[0],
                        data[i][Object.keys(data[i])[0]].id
                      );
                    } else if (
                      Object.keys(data[i])[0] === 'pricelist' &&
                      _.isNull(data[i][Object.keys(data[i])[0]])
                    ) {
                      showTerminalModalError(
                        OB.I18N.getLabel('OBPOS_NoPriceList')
                      );
                      return;
                    } else {
                      terminalModel.set(
                        Object.keys(data[i])[0],
                        data[i][Object.keys(data[i])[0]]
                      );
                    }
                  }

                  if (terminalModel.get('store').length !== 0) {
                    var organization = terminalModel.get('terminal')
                      .organization;
                    terminalModel.get('store').splice(0, 0, {
                      id: organization,
                      name: OB.I18N.getLabel('OBPOS_LblThisStore', [
                        terminalModel.get('terminal').organization$_identifier
                      ]),
                      country: OB.MobileApp.model.get('terminal')
                        .organizationCountryId,
                      region: OB.MobileApp.model.get('terminal')
                        .organizationRegionId
                    });
                    terminalModel.get('store').splice(1, 0, {
                      id: 'all_' + organization,
                      name: '(' + OB.I18N.getLabel('OBPOS_LblAllStores') + ')'
                    });
                  }

                  OB.DS.commonParams = {
                    client: terminalModel.get('terminal').client,
                    organization: terminalModel.get('terminal').organization,
                    pos: terminalModel.get('terminal').id,
                    terminalName: terminalModel.get('terminalName')
                  };

                  // Save in state Document Sequence values read from backend
                  await OB.App.State.DocumentSequence.initializeSequence({
                    sequences: [
                      {
                        sequenceName: 'lastassignednum',
                        sequencePrefix: OB.MobileApp.model.get('terminal')
                          .docNoPrefix,
                        sequenceNumber: OB.MobileApp.model.get('terminal')
                          .lastDocumentNumber
                      },
                      {
                        sequenceName: 'returnslastassignednum',
                        sequencePrefix: OB.MobileApp.model.get('terminal')
                          .returnDocNoPrefix,
                        sequenceNumber: OB.MobileApp.model.get('terminal')
                          .lastReturnDocumentNumber
                      },
                      {
                        sequenceName: 'quotationslastassignednum',
                        sequencePrefix: OB.MobileApp.model.get('terminal')
                          .quotationDocNoPrefix,
                        sequenceNumber: OB.MobileApp.model.get('terminal')
                          .lastQuotationDocumentNumber
                      },
                      {
                        sequenceName: 'fullinvoiceslastassignednum',
                        sequencePrefix: OB.MobileApp.model.get('terminal')
                          .fullInvoiceDocNoPrefix,
                        sequenceNumber: OB.MobileApp.model.get('terminal')
                          .lastFullInvoiceDocumentNumber
                      },
                      {
                        sequenceName: 'fullreturninvoiceslastassignednum',
                        sequencePrefix: OB.MobileApp.model.get('terminal')
                          .fullReturnInvoiceDocNoPrefix,
                        sequenceNumber: OB.MobileApp.model.get('terminal')
                          .lastFullReturnInvoiceDocumentNumber
                      },
                      {
                        sequenceName: 'simplifiedinvoiceslastassignednum',
                        sequencePrefix: OB.MobileApp.model.get('terminal')
                          .simplifiedInvoiceDocNoPrefix,
                        sequenceNumber: OB.MobileApp.model.get('terminal')
                          .lastSimplifiedInvoiceDocumentNumber
                      },
                      {
                        sequenceName: 'simplifiedreturninvoiceslastassignednum',
                        sequencePrefix: OB.MobileApp.model.get('terminal')
                          .simplifiedReturnInvoiceDocNoPrefix,
                        sequenceNumber: OB.MobileApp.model.get('terminal')
                          .lastSimplifiedReturnInvoiceDocumentNumber
                      },
                      {
                        sequenceName: 'aggregatedinvoiceslastassignednum',
                        sequencePrefix: OB.MobileApp.model.get('terminal')
                          .aggregatedInvoiceDocNoPrefix,
                        sequenceNumber: OB.MobileApp.model.get('terminal')
                          .lastAggregatedInvoiceDocumentNumber
                      },
                      {
                        sequenceName: 'aggregatedreturninvoiceslastassignednum',
                        sequencePrefix: OB.MobileApp.model.get('terminal')
                          .aggregatedReturnInvoiceDocNoPrefix,
                        sequenceNumber: OB.MobileApp.model.get('terminal')
                          .lastAggregatedReturnInvoiceDocumentNumber
                      }
                    ]
                  });

                  OB.UTIL.HookManager.executeHooks(
                    'OBPOS_PostDocumentSequenceUpdated',
                    {},
                    function(args) {
                      if (args && args.cancelOperation) {
                        return;
                      }
                      OB.UTIL.localStorage.setItem(
                        'terminalId',
                        data[0].terminal.id
                      );
                      terminalModel.set(
                        'useBarcode',
                        terminalModel.get('terminal').terminalType
                          .usebarcodescanner
                      );
                      terminalModel.set(
                        'useBarcodeLayout',
                        terminalModel.get('terminal').terminalType
                          .usebarcodelayout
                      );
                      terminalModel.set(
                        'useEmbededBarcode',
                        terminalModel.get('terminal').terminalType
                          .useembededbarcodescanner
                      );
                      //Set document types from organization to terminaltype object
                      terminalModel.get(
                        'terminal'
                      ).terminalType.documentType = OB.MobileApp.model.get(
                        'context'
                      ).organization.obposCDoctype;
                      terminalModel.get(
                        'terminal'
                      ).terminalType.documentTypeForReturns = OB.MobileApp.model.get(
                        'context'
                      ).organization.obposCDoctyperet;
                      terminalModel.get(
                        'terminal'
                      ).terminalType.documentTypeForReconciliations = OB.MobileApp.model.get(
                        'context'
                      ).organization.obposCDoctyperecon;
                      terminalModel.get(
                        'terminal'
                      ).terminalType.documentTypeForQuotations = OB.MobileApp.model.get(
                        'context'
                      ).organization.obposCDoctypequot;

                      if (!terminalModel.usermodel) {
                        OB.MobileApp.model.loadingErrorsActions(
                          'The terminal.usermodel should be loaded at this point'
                        );
                      } else if (
                        OB.MobileApp.model.attributes.loadManifeststatus &&
                        OB.MobileApp.model.attributes.loadManifeststatus
                          .type === 'error'
                      ) {
                        var error =
                          OB.MobileApp.model.attributes.loadManifeststatus;
                        OB.debug(
                          error.reason + ' failed to load: ' + error.url
                        );
                        OB.UTIL.showConfirmation.display(
                          OB.I18N.getLabel('OBPOS_TitleFailedAppCache'),
                          enyo.format(
                            '%s %s: %s',
                            OB.I18N.getLabel('OBPOS_FailedAppCache'),
                            error.type,
                            error.message
                          ),
                          [
                            {
                              label: OB.I18N.getLabel('OBMOBC_LblOk'),
                              isConfirmButton: true
                            }
                          ],
                          {
                            autoDismiss: false,
                            showLoading: true,
                            onHideFunction: function(popup) {
                              OB.UTIL.showLoading(true);
                              terminalModel.set(
                                'terminalCorrectlyLoadedFromBackend',
                                true
                              );
                              terminalModel.propertiesReady(me.properties);
                            }
                          }
                        );
                      } else {
                        terminalModel.set(
                          'terminalCorrectlyLoadedFromBackend',
                          true
                        );
                        terminalModel.propertiesReady(me.properties);
                      }
                      OB.UTIL.HookManager.executeHooks(
                        'OBPOS_TerminalLoadedFromBackend',
                        {
                          data: data[0].terminal.id
                        }
                      );
                    }
                  );
                } else {
                  OB.UTIL.showError(
                    'Terminal does not exists: ' + 'params.terminal'
                  );
                }
              },
              function(data) {
                // connection error.
                OB.UTIL.Debug.execute(function() {
                  OB.error('Error while retrieving the terminal info ', data);
                });
                me.attemptToLoginOffline();
              },
              true,
              5000
            );
          };

          // If a safe box is defined in this terminal and that safe box is assign to
          // a user, check the current logged user before continue login process
          // except if the user is a Safe Box Manager
          if (
            !OB.UTIL.isNullOrUndefined(
              OB.UTIL.localStorage.getItem('currentSafeBox')
            )
          ) {
            const currentSafeBox = JSON.parse(
              OB.UTIL.localStorage.getItem('currentSafeBox')
            );
            if (
              !OB.UTIL.isNullOrUndefined(currentSafeBox.userId) &&
              currentSafeBox.userId !==
                OB.MobileApp.model.usermodel.get('id') &&
              !OB.MobileApp.model.hasPermission(
                'OBPOS_approval.manager.safebox',
                true
              )
            ) {
              handleError({
                exception: {
                  message: 'OBPOS_DifferCurrentAssignedSafeBox',
                  params: [currentSafeBox.userName]
                }
              });
              return;
            }
          }

          const currentCashUpId = OB.App.State.getState().Cashup.id;
          if (currentCashUpId !== null) {
            params.cashUpId = currentCashUpId;
          }
          loadTerminalModel();
        }
      });

      this.on('ready', function() {
        OB.debug("next process: 'retail.pointofsale' window");
        if (this.get('terminal').currencyFormat) {
          OB.Format.formats.priceInform = this.get('terminal').currencyFormat;
        }
        var terminal = this.get('terminal');

        const onInitCashupSucess = function() {
          function finishAndNavigate() {
            OB.UTIL.HookManager.executeHooks(
              'OBPOS_LoadPOSWindow',
              {},
              function(args) {
                if (args && args.cancellation && args.cancellation === true) {
                  return;
                }
                var nextWindow = OB.UTIL.localStorage.getItem('nextWindow');
                if (nextWindow) {
                  if (OB.POS.navigate(nextWindow)) {
                    OB.UTIL.localStorage.removeItem('nextWindow');
                  }
                } else {
                  OB.POS.navigate(OB.MobileApp.model.get('defaultWindow'));
                }
              }
            );
          }

          finishAndNavigate();
        };

        const onInitCashupError = function() {
          //There was an error when retrieving the cashup from the backend.
          // This means that there is a cashup saved as an error, and we don't have
          //the necessary information to have a working cashup in the client side.
          //We therefore need to logout
          OB.UTIL.showConfirmation.display(
            OB.I18N.getLabel('OBPOS_CashupErrors'),
            OB.I18N.getLabel('OBPOS_CashupErrorsMsg'),
            [
              {
                label: OB.I18N.getLabel('OBMOBC_LblOk'),
                isConfirmButton: true,
                action: function() {
                  OB.UTIL.showLoading(true);
                  me.logout();
                }
              }
            ],
            {
              onHideFunction: function() {
                OB.UTIL.showLoading(true);
                me.logout();
              }
            }
          );
        };

        OB.App.State.Global.initCashup({
          currentDate: new Date(),
          userId: OB.MobileApp.model.get('context').user.id,
          organization: OB.MobileApp.model.get('terminal').organization,
          terminalId: OB.MobileApp.model.get('terminal').id,
          terminalIsSlave: OB.MobileApp.model.get('terminal').isslave,
          terminalIsMaster: OB.MobileApp.model.get('terminal').ismaster,
          terminalPayments: OB.MobileApp.model.get('payments'),
          terminalName: OB.MobileApp.model.get('terminal').searchKey,
          cacheSessionId: OB.UTIL.localStorage.getItem('cacheSessionId')
        })
          .then(() => {
            OB.App.State.Cashup.Utils.createMissingStatisticsIncludedInCashup();
            onInitCashupSucess();
          })
          .catch(e => {
            onInitCashupError();
            OB.error(e.stack);
          });

        // Set Hardware..
        OB.POS.hwserver = new OB.DS.HWServer(
          this.get('hardwareURL'),
          terminal.hardwareurl,
          terminal.scaleurl
        );

        OB.MobileApp.model.on('change:currentWindowState', function(model) {
          // If the hardware URL is set and the terminal uses RFID
          if (
            model.get('currentWindowState') === 'renderUI' &&
            OB.UTIL.isNullOrUndefined(
              OB.UTIL.RfidController.get('rfidWebsocket')
            ) &&
            OB.UTIL.RfidController.isRfidConfigured()
          ) {
            var protocol = OB.POS.hwserver.url.split('/')[0];
            var websocketServerLocation;
            if (protocol === 'http:') {
              websocketServerLocation =
                'ws:' +
                OB.POS.hwserver.url
                  .substring(protocol.length, OB.POS.hwserver.url.length)
                  .split('/printer')[0] +
                '/rfid';
              OB.UTIL.RfidController.set('isRFIDEnabled', true);
              OB.UTIL.RfidController.startRfidWebsocket(
                websocketServerLocation,
                2000,
                0,
                5
              );
            } else if (protocol === 'https:') {
              websocketServerLocation =
                'wss:' +
                OB.POS.hwserver.url
                  .substring(protocol.length, OB.POS.hwserver.url.length)
                  .split('/printer')[0] +
                '/rfid';
              OB.UTIL.RfidController.set('isRFIDEnabled', true);
              OB.UTIL.RfidController.startRfidWebsocket(
                websocketServerLocation,
                2000,
                0,
                5
              );
            } else {
              OB.UTIL.showError(
                OB.I18N.getLabel('OBPOS_WrongHardwareManagerProtocol')
              );
            }
          }
        });

        OB.MobileApp.view.scanningFocus(false);

        // Set Arithmetic properties:
        OB.DEC.setContext(
          OB.UTIL.getFirstValidValue([
            me.get('currency').obposPosprecision,
            me.get('currency').pricePrecision
          ]),
          BigDecimal.prototype.ROUND_HALF_UP
        );

        if (me.get('loggedOffline') === true) {
          OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_OfflineLogin'));
        }
      });

      OB.Model.Terminal.prototype.initialize.call(me);
    },

    addToListOfCallbacks: function(successCallback, errorCallback) {
      if (OB.UTIL.isNullOrUndefined(this.get('syncProcessCallbacks'))) {
        this.set('syncProcessCallbacks', []);
      }
      if (!OB.UTIL.isNullOrUndefined(successCallback)) {
        var list = this.get('syncProcessCallbacks');
        list.push({
          success: successCallback,
          error: errorCallback
        });
      }
    },

    runSyncProcess: function(successCallback, errorCallback) {
      var executeCallbacks,
        me = this;
      if (this.pendingSyncProcess) {
        this.addToListOfCallbacks(successCallback, errorCallback);
        return;
      }
      this.pendingSyncProcess = true;
      this.addToListOfCallbacks(successCallback, errorCallback);
      executeCallbacks = function(success, listOfCallbacks, callback) {
        if (listOfCallbacks.length === 0) {
          callback();
          listOfCallbacks = null;
          return;
        }
        var callbackToExe = listOfCallbacks.shift();
        if (success && callbackToExe.success) {
          callbackToExe.success();
        } else if (!success && callbackToExe.error) {
          callbackToExe.error();
        }
        executeCallbacks(success, listOfCallbacks, callback);
      };

      function run() {
        OB.debug('runSyncProcess: executing pre synchronization hook');
        OB.UTIL.HookManager.executeHooks('OBPOS_PreSynchData', {}, function() {
          OB.debug('runSyncProcess: synchronize all models');
          OB.MobileApp.model.syncAllModels(
            function() {
              executeCallbacks(
                true,
                me.get('syncProcessCallbacks'),
                function() {
                  me.pendingSyncProcess = false;
                }
              );
            },
            function() {
              OB.warn(
                'runSyncProcess failed: the WebPOS is most likely to be offline, but a real error could be present.'
              );
              executeCallbacks(
                false,
                me.get('syncProcessCallbacks'),
                function() {
                  me.pendingSyncProcess = false;
                }
              );
            }
          );
        });
      }

      if (OB.UTIL.localStorage.getItem('terminalAuthentication') === 'Y') {
        var process = new OB.DS.Process(
          'org.openbravo.retail.posterminal.CheckTerminalAuth'
        );

        OB.trace('Checking authentication');

        process.exec(
          {
            terminalName: OB.UTIL.localStorage.getItem('terminalName'),
            terminalKeyIdentifier: OB.UTIL.localStorage.getItem(
              'terminalKeyIdentifier'
            ),
            terminalAuthentication: OB.UTIL.localStorage.getItem(
              'terminalAuthentication'
            ),
            cacheSessionId: OB.UTIL.localStorage.getItem('cacheSessionId')
          },
          function(data) {
            if (data && data.exception) {
              //ERROR or no connection
              if (
                !OB.UTIL.isNullOrUndefined(
                  OB.UTIL.localStorage.getItem('cacheSessionId')
                )
              ) {
                OB.error(
                  'runSyncProcess',
                  OB.I18N.getLabel('OBPOS_TerminalAuthError')
                );
                run();
              } else {
                OB.UTIL.showConfirmation.display(
                  OB.I18N.getLabel('OBPOS_TerminalAuthChange'),
                  OB.I18N.getLabel('OBPOS_TerminalAuthChangeMsg'),
                  [
                    {
                      label: OB.I18N.getLabel('OBMOBC_LblOk'),
                      isConfirmButton: true
                    }
                  ],
                  {
                    autoDismiss: false,
                    showLoading: true,
                    closeOnEscKey: false,
                    execHideFunction: true,
                    onHideFunction: function() {
                      OB.UTIL.localStorage.clearNoConfirmation();
                      OB.UTIL.showLoading(true);
                      OB.MobileApp.model.logout();
                    }
                  }
                );
              }
            } else if (
              data &&
              (data.isLinked === false || data.terminalAuthentication)
            ) {
              if (data.isLinked === false) {
                OB.info(
                  'POS Terminal configuration is not linked to a device anymore. Remove terminalKeyIdentifier from localStorage'
                );
                OB.UTIL.localStorage.removeItem('terminalName');
                OB.UTIL.localStorage.removeItem('terminalKeyIdentifier');
              }
              if (data.terminalAuthentication) {
                OB.UTIL.localStorage.setItem(
                  'terminalAuthentication',
                  data.terminalAuthentication
                );
              }
              if (data && data.errorReadingTerminalAuthentication) {
                OB.UTIL.showWarning(data.errorReadingTerminalAuthentication);
              }
              OB.UTIL.showConfirmation.display(
                OB.I18N.getLabel('OBPOS_TerminalAuthChange'),
                OB.I18N.getLabel('OBPOS_TerminalAuthChangeMsg'),
                [
                  {
                    label: OB.I18N.getLabel('OBMOBC_LblOk'),
                    isConfirmButton: true
                  }
                ],
                {
                  autoDismiss: false,
                  showLoading: true,
                  closeOnEscKey: false,
                  execHideFunction: true,
                  onHideFunction: function() {
                    OB.UTIL.localStorage.clearNoConfirmation();
                    OB.UTIL.showLoading(true);
                    OB.MobileApp.model.logout();
                  }
                }
              );
            } else {
              run();
            }
          }
        );
      } else {
        run();
      }
      this.postSyncProcessActions();
    },

    postSyncProcessActions: async function() {
      if (
        OB.MobileApp.model.get('context') &&
        OB.MobileApp.model.get('context').user &&
        _.isUndefined(
          OB.MobileApp.model.get('context').user.isSalesRepresentative
        )
      ) {
        try {
          const salesrepresentative = await OB.App.MasterdataModels.SalesRepresentative.withId(
            OB.MobileApp.model.get('context').user.id
          );
          if (!salesrepresentative) {
            OB.MobileApp.model.get(
              'context'
            ).user.isSalesRepresentative = false;
          } else {
            OB.MobileApp.model.get('context').user.isSalesRepresentative = true;
          }
        } catch (err) {
          OB.error(err.message);
        }
      }
    },

    returnToOnline: function() {
      const me = this;
      let syncProcess = function() {
        me.runSyncProcess(function() {
          OB.UTIL.sendLastTerminalStatusValues();
          OB.App.RemoteServerController.getRemoteServer(
            'BackendServer'
          ).connectSynchronizationEndpoints();
        });
      };
      if (OB.MobileApp.model.get('isLoggingIn')) {
        OB.MobileApp.model.on(
          'change:isLoggingIn',
          function() {
            if (!OB.MobileApp.model.get('isLoggingIn')) {
              OB.MobileApp.model.off('change:isLoggingIn', null, this);
              if (OB.MobileApp.model.get('terminal')) {
                syncProcess();
              } else {
                let syncIntervalCount = 0;
                let syncIntervalId = setInterval(function() {
                  syncIntervalCount++;
                  if (OB.MobileApp.model.get('terminal')) {
                    syncProcess();
                    clearInterval(syncIntervalId);
                  } else if (syncIntervalCount === 30) {
                    clearInterval(syncIntervalId);
                  }
                }, 500);
              }
            }
          },
          this
        );
      } else {
        //The session is fine, we don't need to warn the user
        //but we will attempt to send all pending orders automatically
        syncProcess();
      }
    },

    renderMain: function() {
      OB.debug("next process: trigger 'ready'");
      if (!this.get('terminal')) {
        OB.UTIL.Debug.execute(function() {
          // show an error while in debug mode to help debugging and testing
          throw "OB.MobileApp.model.get('terminal') properties have not been loaded";
        });
        OB.MobileApp.model.navigate('login');
        return;
      }

      var i,
        paymentcashcurrency,
        paymentcash,
        paymentlegacy,
        max,
        defaultpaymentcash,
        defaultpaymentcashcurrency;

      if (!OB.UTIL.isSupportedBrowser()) {
        OB.MobileApp.model.renderLogin();
        return false;
      }

      OB.DS.commonParams = OB.DS.commonParams || {};
      OB.DS.commonParams = {
        client: this.get('terminal').client,
        organization: this.get('terminal').organization,
        pos: this.get('terminal').id,
        terminalName: this.get('terminalName')
      };

      //LEGACY
      this.paymentnames = {};
      for (i = 0, max = this.get('payments').length; i < max; i++) {
        this.paymentnames[this.get('payments')[i].payment.searchKey] = this.get(
          'payments'
        )[i];
        if (
          !paymentlegacy &&
          this.get('payments')[i].payment.searchKey === 'OBPOS_payment.cash'
        ) {
          paymentlegacy = this.get('payments')[i].payment.searchKey;
        }
        if (this.get('payments')[i].paymentMethod.iscash) {
          if (!paymentcash) {
            paymentcash = this.get('payments')[i].payment.searchKey;
          }
          if (
            this.get('payments')[i].paymentMethod.currency ===
            this.get('terminal').currency
          ) {
            if (!paymentcashcurrency) {
              paymentcashcurrency = this.get('payments')[i].payment.searchKey;
            }
            if (
              !defaultpaymentcashcurrency &&
              this.get('payments')[i].paymentMethod.defaultCashPaymentMethod
            ) {
              defaultpaymentcashcurrency = this.get('payments')[i].payment
                .searchKey;
            }
          }
          if (
            !defaultpaymentcash &&
            this.get('payments')[i].paymentMethod.defaultCashPaymentMethod
          ) {
            defaultpaymentcash = this.get('payments')[i].payment.searchKey;
          }
        }
      }
      // sets the default payment method
      this.set(
        'paymentcash',
        defaultpaymentcashcurrency ||
          defaultpaymentcash ||
          paymentcashcurrency ||
          paymentcash ||
          paymentlegacy
      );

      // set if there's or not any payment method that is counted in cashup
      if (
        _.find(this.get('payments'), function(payment) {
          return payment.paymentMethod.countpaymentincashup;
        })
      ) {
        this.set('hasPaymentsForCashup', true);
      } else {
        this.set('hasPaymentsForCashup', false);
      }

      // add the currency converters
      _.each(
        OB.MobileApp.model.get('payments'),
        function(paymentMethod) {
          var fromCurrencyId = parseInt(
            OB.MobileApp.model.get('currency').id,
            10
          );
          OB.UTIL.currency.setDefaultCurrencyId(
            OB.MobileApp.model.get('currency').id
          );
          var toCurrencyId = parseInt(paymentMethod.paymentMethod.currency, 10);
          if (fromCurrencyId !== toCurrencyId) {
            OB.UTIL.currency.addConversion(
              toCurrencyId,
              fromCurrencyId,
              paymentMethod.rate
            );
            OB.UTIL.currency.addConversion(
              fromCurrencyId,
              toCurrencyId,
              paymentMethod.mulrate
            );
          }
        },
        this
      );

      OB.MobileApp.model.on('window:ready', function() {
        // Send the last update of full and masterdata refresh
        OB.UTIL.sendLastTerminalStatusValues();
        // Check terminal authentication
        if (OB.UTIL.localStorage.getItem('terminalAuthentication') === 'Y') {
          var process = new OB.DS.Process(
            'org.openbravo.retail.posterminal.CheckTerminalAuth'
          );
          process.exec(
            {
              terminalName: OB.UTIL.localStorage.getItem('terminalName'),
              terminalKeyIdentifier: OB.UTIL.localStorage.getItem(
                'terminalKeyIdentifier'
              ),
              terminalAuthentication: OB.UTIL.localStorage.getItem(
                'terminalAuthentication'
              ),
              cacheSessionId: OB.UTIL.localStorage.getItem('cacheSessionId')
            },
            function(data) {
              if (data && data.exception) {
                //ERROR or no connection
                OB.error(
                  'renderMain',
                  OB.I18N.getLabel('OBPOS_TerminalAuthError')
                );
              } else if (
                data &&
                (data.isLinked === false || data.terminalAuthentication)
              ) {
                if (data.isLinked === false) {
                  OB.info(
                    'POS Terminal configuration is not linked to a device anymore. Remove terminalKeyIdentifier from localStorage'
                  );
                  OB.UTIL.localStorage.removeItem('terminalName');
                  OB.UTIL.localStorage.removeItem('terminalKeyIdentifier');
                }
                if (data.terminalAuthentication) {
                  OB.UTIL.localStorage.setItem(
                    'terminalAuthentication',
                    data.terminalAuthentication
                  );
                }
                if (data && data.errorReadingTerminalAuthentication) {
                  OB.UTIL.showWarning(data.errorReadingTerminalAuthentication);
                }
                OB.UTIL.showConfirmation.display(
                  OB.I18N.getLabel('OBPOS_TerminalAuthChange'),
                  OB.I18N.getLabel('OBPOS_TerminalAuthChangeMsg'),
                  [
                    {
                      label: OB.I18N.getLabel('OBMOBC_LblOk'),
                      isConfirmButton: true
                    }
                  ],
                  {
                    autoDismiss: false,
                    showLoading: true,
                    closeOnEscKey: false,
                    execHideFunction: true,
                    onHideFunction: function() {
                      OB.UTIL.localStorage.clearNoConfirmation();
                      OB.UTIL.showLoading(true);
                      OB.MobileApp.model.logout();
                    }
                  }
                );
              }
            }
          );
        }
      });
      this.trigger('ready');
    },

    postLoginActions: function() {
      if (OB.UTIL.localStorage.getItem('benchmarkScore')) {
        OB.info(
          'Performance test result: ' +
            OB.UTIL.localStorage.getItem('benchmarkScore')
        );
      }
      OB.debug('next process: renderTerminalMain');
      //MASTER DATA REFRESH
      var minIncRefresh = this.get('terminal').terminalType
          .minutestorefreshdatainc,
        lastTotalRefresh = OB.UTIL.localStorage.getItem('POSLastTotalRefresh'),
        lastIncRefresh = OB.UTIL.localStorage.getItem('POSLastIncRefresh'),
        now = new Date().getTime(),
        intervalInc;

      // lastTotalRefresh should be used to set lastIncRefresh when it is null or minor.
      if (lastIncRefresh === null) {
        lastIncRefresh = lastTotalRefresh;
      } else {
        if (lastTotalRefresh > lastIncRefresh) {
          lastIncRefresh = lastTotalRefresh;
        }
      }
      // Transform minIncRefresh and minTotalRefresh to miliseconds
      minIncRefresh =
        (minIncRefresh > 99999 ? 99999 : minIncRefresh) * 60 * 1000;

      // Calculate the incremental interval in miliseconds
      intervalInc = lastIncRefresh ? now - lastIncRefresh - minIncRefresh : 0;

      function setTerminalLockTimeout(
        sessionTimeoutMinutes,
        sessionTimeoutMilliseconds
      ) {
        OB.debug(
          'Terminal lock timer reset (' + sessionTimeoutMinutes + ' minutes)'
        );
        clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(function() {
          OB.warn(
            'The terminal was not used for ' +
              sessionTimeoutMinutes +
              ' minutes. Locking the terminal'
          );
          OB.MobileApp.model.lock();
        }, sessionTimeoutMilliseconds);
      }

      OB.POS.hwserver.showSelected(); // Show the selected printers
      if (minIncRefresh) {
        // in case there was no incremental load at login then schedule an incremental
        // load at the next expected time, which can be earlier than the standard interval
        OB.MobileApp.model.set('refreshMasterdataInterval', minIncRefresh);
        if (
          intervalInc < 0 &&
          OB.MobileApp.model.hasPermission(
            'OBMOBC_NotAutoLoadIncrementalAtLogin',
            true
          )
        ) {
          setTimeout(function() {
            OB.UTIL.loadModelsIncFunc();
            OB.MobileApp.model.set(
              'refreshMasterdataIntervalHandler',
              setInterval(OB.UTIL.loadModelsIncFunc, minIncRefresh)
            );
          }, intervalInc * -1);
        } else {
          OB.MobileApp.model.set(
            'refreshMasterdataIntervalHandler',
            setInterval(OB.UTIL.loadModelsIncFunc, minIncRefresh)
          );
        }
      }

      var sessionTimeoutMinutes = this.get('terminal').sessionTimeout;
      var serverPingMinutes = this.get('serverTimeout');
      if (!this.sessionPing && sessionTimeoutMinutes) {
        var sessionTimeoutMilliseconds = sessionTimeoutMinutes * 60 * 1000;
        this.sessionPing = setInterval(function() {
          new OB.DS.Process(
            'org.openbravo.mobile.core.login.ContextInformation'
          ).exec(null, function() {});
        }, sessionTimeoutMilliseconds);

        // set the terminal lock timeout
        setTerminalLockTimeout(
          sessionTimeoutMinutes,
          sessionTimeoutMilliseconds
        );
        // FIXME: hack: inject javascript in the enyo.gesture.down so we can create a terminal timeout
        enyo.gesture.down = function(inEvent) {
          // start of Openbravo injected code
          setTerminalLockTimeout(
            sessionTimeoutMinutes,
            sessionTimeoutMilliseconds
          );
          // end of Openbravo injected code
          // cancel any hold since it's possible in corner cases to get a down without an up
          var e = this.makeEvent('down', inEvent);
          enyo.dispatch(e);
          this.downEvent = e;
        };
        // hack: to check editbox change on any window
        const windowView = OB.UI.WindowView.prototype;
        const origWriteState = windowView.writeState;
        windowView.writeState = _.wrap(windowView.writeState, function(
          wrapped,
          inSender,
          inEvent
        ) {
          if (inEvent.name === 'editbox') {
            setTerminalLockTimeout(
              sessionTimeoutMinutes,
              sessionTimeoutMilliseconds
            );
          }
          _.bind(origWriteState, this, inSender, inEvent)();
        });
      } else if (
        !this.sessionPing &&
        !OB.MobileApp.model.get('permissions').OBPOS_SessionExpiration
      ) {
        var serverPingMilliseconds = serverPingMinutes * 60 * 1000;
        if (serverPingMinutes === 0) {
          return;
        } else if (serverPingMinutes === 1) {
          serverPingMilliseconds -= 30 * 1000;
        } else {
          serverPingMilliseconds -= 60 * 1000;
        }
        this.sessionPing = setInterval(function() {
          var rr,
            ajaxRequest2 = new enyo.Ajax({
              url: '../../org.openbravo.mobile.core.context',
              cacheBust: false,
              method: 'GET',
              handleAs: 'json',
              timeout: 20000,
              data: {
                ignoreForConnectionStatus: true
              },
              contentType: 'application/json;charset=utf-8',
              success: function(inSender, inResponse) {},
              fail: function(inSender, inResponse) {}
            });
          rr = new OB.RR.Request({
            ajaxRequest: ajaxRequest2
          });
          rr.exec(ajaxRequest2.url);
        }, serverPingMilliseconds);
      }
    },

    cleanSessionInfo: function() {
      return new Promise(resolve => {
        OB.UTIL.HookManager.executeHooks('OBPOS_PreLogoutAction', {}, () => {
          this.cleanTerminalData();
          resolve();
        });
      });
    },

    preLoginActions: function() {
      this.cleanTerminalData();
    },

    preLogoutActions: function(finalCallback) {
      var me = this;

      function callback() {
        if (finalCallback && finalCallback instanceof Function) {
          me.cleanSessionInfo().then(() => finalCallback());
        }
      }

      async function success(collection) {
        if (collection.length > 0) {
          await OB.App.State.Global.markIgnoreCheckIfIsActiveOrderToPendingTickets(
            {
              session: OB.MobileApp.model.get('session')
            }
          );
          for (let i = 0; i < collection.length; i++) {
            const model = OB.App.StateBackwardCompatibility.getInstance(
              'Ticket'
            ).toBackboneObject(collection[i]);
            await model.deleteOrder();
          }
          callback();
        } else {
          callback();
        }
      }

      if (OB.MobileApp.model.get('isMultiOrderState')) {
        if (OB.MobileApp.model.multiOrders.checkMultiOrderPayment()) {
          return;
        }
      }

      if (OB.UTIL.TicketListUtils.checkOrderListPayment()) {
        OB.UTIL.showConfirmation.display(
          '',
          OB.I18N.getLabel('OBPOS_RemoveReceiptWithPayment')
        );
        return;
      }

      OB.UTIL.Approval.requestApproval(
        this,
        'OBPOS_approval.removereceipts',
        function(approved, supervisor, approvalType) {
          if (approved) {
            // On logout remove pending orders and close opened paid orders
            const session = OB.MobileApp.model.get('session');
            success(OB.App.State.TicketList.Utils.getSessionTickets(session));
          }
        }
      );
    },

    postCloseSession: function(session) {
      var callback = function() {
        OB.MobileApp.model.triggerLogout();
      };
      OB.UTIL.localStorage.removeItem('leftColumnCurrentView');
      if (OB.POS.hwserver !== undefined) {
        OB.OBPOSPointOfSale.Print.printGoodBye(callback);
      } else {
        callback();
      }
    },

    getPaymentName: function(key) {
      if (
        this.paymentnames[key] &&
        this.paymentnames[key].payment &&
        this.paymentnames[key].payment._identifier
      ) {
        return this.paymentnames[key].payment._identifier;
      }
      return null;
    },

    hasPayment: function(key) {
      return this.paymentnames[key];
    },

    databaseCannotBeResetAction: function() {
      OB.UTIL.showConfirmation.display(
        OB.I18N.getLabel('OBPOS_ResetNeededNotSafeTitle'),
        OB.I18N.getLabel('OBPOS_ResetNeededNotSafeMessage'),
        [
          {
            label: OB.I18N.getLabel('OBMOBC_LblOk'),
            isConfirmButton: true,
            action: function() {
              OB.MobileApp.model.lock();
            }
          }
        ],
        {
          showLoading: true,
          onHideFunction: function() {
            OB.MobileApp.model.lock();
          }
        }
      );
    },

    isUserCacheAvailable: function() {
      return true;
    },

    dialog: null,
    preLoadContext: function(callback) {
      if (
        !OB.UTIL.localStorage.getItem('terminalKeyIdentifier') &&
        OB.UTIL.localStorage.getItem('terminalAuthentication') === 'Y'
      ) {
        OB.UTIL.showLoading(false);
        if (OB.UI.ModalSelectTerminal) {
          this.dialog = OB.MobileApp.view.$.confirmationContainer.createComponent(
            {
              kind: 'OB.UI.ModalSelectTerminal',
              name: 'modalSelectTerminal',
              classes: 'modalSelectTerminal',
              callback: callback,
              context: this
            }
          );
          this.dialog.show();
        }
      } else {
        if (OB.MobileApp.model.hasPermission('OBPOS_MaxTimeInOffline', true)) {
          OB.UTIL.localStorage.setItem(
            'maxTimeInOffline',
            OB.MobileApp.model.hasPermission('OBPOS_MaxTimeInOffline', true)
          );
        }
        if (
          OB.MobileApp.model.hasPermission(
            'OBPOS_offlineSessionTimeExpiration',
            true
          )
        ) {
          OB.UTIL.localStorage.setItem(
            'offlineSessionTimeExpiration',
            OB.MobileApp.model.hasPermission(
              'OBPOS_offlineSessionTimeExpiration',
              true
            )
          );
        }
        callback();
      }
    },
    manageTerminalSafeBoxes: function(safeBoxInfo) {
      if (safeBoxInfo && safeBoxInfo.isSafeBox) {
        OB.UTIL.localStorage.setItem('isSafeBox', safeBoxInfo.isSafeBox);
        if (safeBoxInfo.safeBoxes && safeBoxInfo.safeBoxes.length > 0) {
          // Replace safe boxes list only if we have some safebox comming from the server
          OB.UTIL.localStorage.setItem(
            'safeBoxes',
            JSON.stringify(safeBoxInfo.safeBoxes)
          );
        }
      } else {
        // The terminal is no longer a safe box, delete the previous safeBoxe information
        OB.UTIL.localStorage.removeItem('isSafeBox');
        OB.UTIL.localStorage.removeItem('safeBoxes');
        OB.UTIL.localStorage.removeItem('currentSafeBox');
      }
    },
    linkTerminal: function(terminalData, callback) {
      var params = this.get('loginUtilsParams') || {},
        me = this,
        key,
        parsedTerminalData = JSON.parse(terminalData);
      params.command = 'preLoginActions';
      params.params = terminalData;
      var terminalDataObject = JSON.parse(terminalData);
      for (key in terminalDataObject) {
        if (Object.prototype.hasOwnProperty.call(terminalDataObject, key)) {
          params[key] = terminalDataObject[key];
        }
      }
      OB.warn(
        '[TermAuth] Request to link terminal "' +
          parsedTerminalData.terminalKeyIdentifier +
          '" using user "' +
          parsedTerminalData.username +
          '" with cache session id "' +
          parsedTerminalData.cacheSessionId +
          '"'
      );
      new OB.OBPOSLogin.UI.LoginRequest({
        url: OB.MobileApp.model.get('loginUtilsUrl'),
        method: 'POST',
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8'
      })
        .response(this, function(inSender, inResponse) {
          if (
            inResponse.exception ||
            (inResponse.response && inResponse.response.error)
          ) {
            var msg, jsonMsg;
            try {
              jsonMsg = JSON.parse(inResponse.response.error.message);
              if (
                !OB.UTIL.isNullOrUndefined(jsonMsg) &&
                jsonMsg.key === 'CPExpirationPassword'
              ) {
                msg = jsonMsg.msg;
              }
            } catch (e) {
              msg = inResponse.exception
                ? OB.I18N.getLabel(inResponse.exception)
                : inResponse.response.error.message;
            }

            var showTerminalAuthPopup = () => {
              me = this;
              me.dialog = OB.MobileApp.view.$.confirmationContainer.createComponent(
                {
                  kind: 'OB.UI.ModalSelectTerminal',
                  name: 'modalSelectTerminal',
                  classes: 'modalSelectTerminal',
                  callback: callback,
                  context: me
                }
              );
              me.dialog.show();
            };

            var showChangePasswordPopup = () => {
              me = this;
              me.dialog = OB.MobileApp.view.$.confirmationContainer.createComponent(
                {
                  kind: 'OB.UI.ExpirationPassword',
                  classes:
                    'obUiTerminal-confirmationContainer-obUiExpirationPassword',
                  context: me,
                  callback: showTerminalAuthPopup
                }
              );
              me.dialog.show();
            };

            OB.UTIL.showConfirmation.display(
              OB.I18N.getLabel('OBMOBC_Error'),
              msg,
              [
                {
                  label: OB.I18N.getLabel('OBMOBC_LblOk'),
                  isConfirmButton: true,
                  action: function() {
                    if (
                      !OB.UTIL.isNullOrUndefined(jsonMsg) &&
                      jsonMsg.key === 'CPExpirationPassword'
                    ) {
                      showChangePasswordPopup();
                      return;
                    } else if (OB.UI.ModalSelectTerminal) {
                      showTerminalAuthPopup();
                    }
                  }
                }
              ],
              {
                showLoading: true,
                onHideFunction: function() {
                  if (jsonMsg.key === 'CPExpirationPassword') {
                    showChangePasswordPopup();
                    return;
                  } else if (OB.UI.ModalSelectTerminal) {
                    showTerminalAuthPopup();
                  }
                }
              }
            );
          } else {
            OB.appCaption = inResponse.appCaption;
            me.setTerminalName(inResponse.terminalName);
            if (
              me.get('logConfiguration') &&
              me.get('logConfiguration').deviceIdentifier === null
            ) {
              me.get('logConfiguration').deviceIdentifier =
                inResponse.terminalName;
            }
            OB.UTIL.localStorage.setItem(
              'terminalName',
              inResponse.terminalName
            );
            OB.UTIL.localStorage.setItem(
              'terminalKeyIdentifier',
              inResponse.terminalKeyIdentifier
            );
            OB.warn(
              '[TermAuth] Terminal "' +
                parsedTerminalData.terminalKeyIdentifier +
                '" was successfully linked using user "' +
                parsedTerminalData.username +
                '" with cache session id "' +
                parsedTerminalData.cacheSessionId +
                '"'
            );
            me.manageTerminalSafeBoxes(inResponse.safeBoxInfo);
            if (OB.MobileApp.model.get('passResetInTermAuth')) {
              window.location.reload();
            } else {
              callback();
            }
          }
        })
        .error(function() {
          callback();
        })
        .go(params);
    },

    initActions: function(callback) {
      var params = this.get('loginUtilsParams') || {},
        me = this;
      var cacheSessionId = null;
      if (
        OB.UTIL.localStorage.getItem('cacheSessionId') &&
        OB.UTIL.localStorage.getItem('cacheSessionId').length === 32
      ) {
        cacheSessionId = OB.UTIL.localStorage.getItem('cacheSessionId');
      }
      me.setTerminalName(
        OB.UTIL.localStorage.getItem('terminalAuthentication') === 'Y'
          ? OB.UTIL.localStorage.getItem('terminalName')
          : OB.UTIL.getParameterByName('terminal')
      );

      params.cacheSessionId = cacheSessionId;
      params.command = 'initActions';
      new OB.OBPOSLogin.UI.LoginRequest({
        url: '../../org.openbravo.retail.posterminal.service.loginutils'
      })
        .response(this, function(inSender, inResponse) {
          if (
            inResponse &&
            inResponse.response &&
            inResponse.response.status &&
            inResponse.response.status === -1
          ) {
            //There was an unexpected error when receiving loginutils information. Most probably the server is having problems, but we will continue
            //with the standard flow, and if other requests fail then most probably offline mode will trigger
            callback();
            return;
          }
          if (inResponse && inResponse.errorReadingTerminalAuthentication) {
            OB.UTIL.showWarning(inResponse.errorReadingTerminalAuthentication);
          }
          if (
            OB.UTIL.localStorage.getItem('terminalAuthentication') === 'Y' &&
            inResponse.terminalAuthentication === 'N'
          ) {
            if (OB.UTIL.localStorage.getItem('terminalKeyIdentifier')) {
              OB.info(
                'Terminal Authentication has been disabled. Remove terminalKeyIdentifier from localStorage'
              );
              OB.UTIL.localStorage.removeItem('terminalKeyIdentifier');
            }
          }
          OB.UTIL.localStorage.setItem(
            'terminalAuthentication',
            inResponse.terminalAuthentication
          );
          OB.UTIL.localStorage.setItem(
            'maxTimeInOffline',
            inResponse.maxTimeInOffline
          );
          OB.UTIL.localStorage.setItem(
            'offlineSessionTimeExpiration',
            inResponse.offlineSessionTimeExpiration
          );

          me.manageTerminalSafeBoxes(inResponse.safeBoxInfo);

          if (
            !(
              OB.UTIL.localStorage.getItem('cacheSessionId') &&
              OB.UTIL.localStorage.getItem('cacheSessionId').length === 32
            )
          ) {
            OB.info(
              'cacheSessionId is not defined and we will set the id generated in the backend: ' +
                inResponse.cacheSessionId
            );
            OB.UTIL.localStorage.setItem(
              'cacheSessionId',
              inResponse.cacheSessionId
            );
            OB.UTIL.localStorage.setItem(
              'LastCacheGeneration',
              new Date().getTime()
            );
          }
          //Save services and initialize Request Router layer and Proccess Controller
          _.each(_.keys(inResponse.properties), function(key) {
            if (inResponse.properties[key]) {
              OB.UTIL.localStorage.setItem(
                key,
                typeof inResponse.properties[key] === 'string'
                  ? inResponse.properties[key]
                  : JSON.stringify(inResponse.properties[key])
              );
            }
          });
          OB.RR.RequestRouter.initialize();
          OB.UTIL.ProcessController.initialize();

          me.setTerminalName(
            OB.UTIL.localStorage.getItem('terminalAuthentication') === 'Y'
              ? OB.UTIL.localStorage.getItem('terminalName')
              : OB.UTIL.getParameterByName('terminal')
          );
          callback();
        })
        .error(function() {
          callback();
        })
        .go(params);
    }
  });

  // from this point, OB.MobileApp.model will be available
  // the initialization is done to a dummy variable to allow the model to be extendable
  var initializeOBModelTerminal = new OB.Model.POSTerminal(); // eslint-disable-line no-unused-vars
  OB.POS = {
    modelterminal: OB.MobileApp.model,
    // kept fot backward compatibility. Deprecation id: 27646
    paramWindow: OB.UTIL.getParameterByName('window') || 'retail.pointofsale',
    paramTerminal:
      OB.UTIL.localStorage.getItem('terminalAuthentication') === 'Y'
        ? OB.UTIL.localStorage.getItem('terminalName')
        : OB.UTIL.getParameterByName('terminal'),
    hrefWindow: function(windowname) {
      return (
        '?terminal=' +
        window.encodeURIComponent(OB.MobileApp.model.get('terminalName')) +
        '&window=' +
        window.encodeURIComponent(windowname)
      );
    },
    logout: function() {
      OB.MobileApp.model.logout();
    },
    lock: function() {
      OB.MobileApp.model.lock();
    },
    windows: null,
    navigate: function(route) {
      return OB.MobileApp.model.navigate(route);
    },
    registerWindow: function(window) {
      OB.MobileApp.windowRegistry.registerWindow(window);
    },
    cleanWindows: function() {
      OB.MobileApp.model.cleanWindows();
    }
  };

  OB.Constants = {
    FIELDSEPARATOR: '$',
    IDENTIFIER: '_identifier'
  };
})();
OB.UTIL.HookManager.registerHook('OBMOBC_ProfileDialogApply', function(
  args,
  callbacks
) {
  var widgetForm = args.profileDialogProp.owner.owner.$.body.$,
    newRoleId = widgetForm.formElementRoleList.coreElement.getValue(),
    isDefault = widgetForm.formElementDefaultCheckbox.coreElement.checked,
    process = new OB.DS.Process('org.openbravo.retail.posterminal.Profile');
  if (isDefault) {
    args.profileDialogProp.isActive = true;
    process.exec(
      {
        role: newRoleId
      },
      function(data) {
        if (data.success) {
          OB.UTIL.HookManager.callbackExecutor(args, callbacks);
        } else {
          OB.UTIL.showError(OB.I18N.getLabel('OBPOS_ErrorWhileSavingUser'));
        }
      },
      function() {
        OB.UTIL.showError(
          OB.I18N.getLabel('OBPOS_OfflineWindowRequiresOnline')
        );
      }
    );
  } else {
    OB.UTIL.HookManager.callbackExecutor(args, callbacks);
  }
});
