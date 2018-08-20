/*
 ************************************************************************************
 * Copyright (C) 2012-2018 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, _ */

// Toolbar container
// ----------------------------------------------------------------------------
//enyo.kind({
//  name: 'OB.OBPOSPointOfSale.UI.RightToolbar',
//  handlers: {
//    onTabButtonTap: 'tabButtonTapHandler'
//  },
//  components: [{
//    tag: 'ul',
//    classes: 'unstyled nav-pos row-fluid',
//    name: 'toolbar'
//  }],
//  tabButtonTapHandler: function (inSender, inEvent) {
//    if (inEvent.tabPanel) {
//      this.setTabButtonActive(inEvent.tabPanel);
//    }
//  },
//  setTabButtonActive: function (tabName) {
//    var buttonContainerArray = this.$.toolbar.getComponents(),
//        i;
//
//    for (i = 0; i < buttonContainerArray.length; i++) {
//      buttonContainerArray[i].removeClass('active');
//      if (buttonContainerArray[i].getComponents()[0].getComponents()[0].name === tabName) {
//        buttonContainerArray[i].addClass('active');
//      }
//    }
//  },
//  manualTap: function (tabName, options) {
//    var tab;
//
//    function getButtonByName(name, me) {
//      var componentArray = me.$.toolbar.getComponents(),
//          i;
//      for (i = 0; i < componentArray.length; i++) {
//        if (componentArray[i].$.theButton.getComponents()[0].name === name) {
//          return componentArray[i].$.theButton.getComponents()[0];
//        }
//      }
//      return null;
//    }
//
//    tab = getButtonByName(tabName, this);
//    if (tab) {
//      tab.tap(options);
//    }
//  },
//  initComponents: function () {
//    this.inherited(arguments);
//    enyo.forEach(this.buttons, function (btn) {
//      this.$.toolbar.createComponent({
//        kind: 'OB.OBPOSPointOfSale.UI.RightToolbarButton',
//        button: btn
//      });
//    }, this);
//  }
//});
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.RightToolbarImpl',
  published: {
    receipt: null
  },
  events: {
    onShowMultiSelection: ''
  },
  handlers: {
    onTabButtonTap: 'tabButtonTapHandler'
  },
  lastSelectedTabPanel: '',
  tabButtonTapHandler: function (inSender, inEvent) {
    if (inEvent.tabPanel) {
      this.setTabButtonActive(inEvent.tabPanel);
      if (this.lastSelectedTabPanel !== inEvent.tabPanel) {
        this.lastSelectedTabPanel = inEvent.tabPanel;
        if (inEvent.tabPanel === 'edit') {
          this.doShowMultiSelection({
            show: true
          });
        } else {
          this.doShowMultiSelection({
            show: false
          });
        }
      }
    }
  },
  setTabButtonActive: function (tabName) {
    var buttonContainerArray = this.$.toolbar.getComponents(),
        i;

    for (i = 0; i < buttonContainerArray.length; i++) {
      buttonContainerArray[i].removeClass('active');
      if (buttonContainerArray[i].getComponents()[0].getComponents()[0].tabToOpen === tabName) {
        buttonContainerArray[i].addClass('active');
      }
    }
  },
  manualTap: function (tabName, options) {
    var tab, defaultTab;

    function getButtonByName(name, me) {
      var componentArray = me.$.toolbar.getComponents(),
          i;
      for (i = 0; i < componentArray.length; i++) {
        if (componentArray[i].$.theButton.getComponents()[0].tabToOpen === name && componentArray[i].$.theButton.getComponents()[0].showing) {
          return componentArray[i].$.theButton.getComponents()[0];
        }
      }
      return null;
    }

    tab = getButtonByName(tabName, this);
    if (options) {
      options.isManual = true;
    } else {
      options = {
        isManual: true
      };
    }

    if (tab) {
      tab.tap(options);
    } else {
      defaultTab = _.find(this.$.toolbar.getComponents(), function (component) {
        if (component.button.defaultTab) {
          return component;
        }
      }).$.theButton.getComponents()[0];
      defaultTab.tap(options);
    }
  },
  kind: 'OB.UI.MultiColumn.Toolbar',
  buttons: [{
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabScan',
    name: 'toolbarBtnScan',
    tabToOpen: 'scan',
    defaultTab: true
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabBrowse',
    name: 'toolbarBtnCatalog',
    tabToOpen: 'catalog'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabSearchCharacteristic',
    name: 'toolbarBtnSearchCharacteristic',
    tabToOpen: 'searchCharacteristic'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabEditLine',
    name: 'toolbarBtnEdit',
    tabToOpen: 'edit'
  }],

  receiptChanged: function () {
    var totalPrinterComponent;

    this.receipt.on('clear', function () {
      this.waterfall('onChangeTotal', {
        newTotal: this.receipt.getTotal()
      });
      if (this.receipt.get('isEditable') === false) {
        this.manualTap('edit');
      } else {
        this.manualTap(OB.MobileApp.model.get('terminal').defaultwebpostab);
      }
    }, this);

    this.receipt.on('scan', function (params) {
      if (OB.MobileApp.model.get('lastPaneShown') !== 'scan') {
        this.manualTap('scan', params);
      } else {
        this.owner.owner.$.rightPanel.$.keyboard.lastStatus = '';
        this.owner.owner.$.rightPanel.$.keyboard.setStatus('');
      }
    }, this);

    this.receipt.get('lines').on('click', function () {
      this.manualTap('edit');
    }, this);

    //some button will draw the total
    if (this.receipt.get('orderType') !== 3) { //Do not change voiding layaway
      this.bubble('onChangeTotal', {
        newTotal: this.receipt.getTotal()
      });
    }
    this.receipt.on('change:gross', function (model) {
      if (this.receipt.get('orderType') !== 3) { //Do not change voiding layaway
        this.bubble('onChangeTotal', {
          newTotal: this.receipt.getTotal()
        });
      }
    }, this);
  }
});


enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.RightToolbarButton',
  tag: 'li',
  components: [{
    name: 'theButton',
    attributes: {
      style: 'margin: 0px 5px 0px 5px;'
    }
  }],
  initComponents: function () {
    this.inherited(arguments);
    if (this.button.containerCssClass) {
      this.setClassAttribute(this.button.containerCssClass);
    }
    this.$.theButton.createComponent(this.button);
  }
});


// Toolbar buttons
// ----------------------------------------------------------------------------
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ButtonTabScan',
  kind: 'OB.UI.ToolbarButtonTab',
  tabPanel: 'scan',
  i18nLabel: 'OBMOBC_LblScan',
  style: 'position: relative;',
  events: {
    onTabChange: '',
    onRightToolbarDisabled: ''
  },
  handlers: {
    onRightToolbarDisabled: 'disabledButton',
    onPointOfSaleLoad: 'pointOfSaleLoad'
  },
  rfidOnIcon: 'btn-icon-rfidon',
  rfidOffIcon: 'btn-icon-rfidoff',
  rfidOfflineIcon: 'btn-icon-rfidoffline',
  components: [{
    name: 'status',
    classes: 'btn-icon-toolbartab',
    components: [{
      name: 'rfidIcon',
      showing: false,
      classes: 'btn-icon-toolbartabrfid'
    }]
  }],
  init: function (model) {
    this.model = model;
    this.$.lbl.addClass('btn-label');
    if (OB.UTIL.RfidController.isRfidConfigured()) {
      this.$.rfidIcon.show();
    }
    OB.UTIL.RfidController.on('change:connected change:connectionLost', function (model) {
      if (this.$.rfidIcon) {
        if (OB.UTIL.RfidController.get('connectionLost')) {
          this.$.rfidIcon.removeClass(this.rfidOnIcon);
          this.$.rfidIcon.removeClass(this.rfidOffIcon);
          this.$.rfidIcon.addClass(this.rfidOfflineIcon);
        } else {
          this.$.rfidIcon.removeClass(this.rfidOfflineIcon);
          if (OB.UTIL.RfidController.get('isRFIDEnabled') && OB.UTIL.RfidController.get('connected')) {
            this.$.rfidIcon.removeClass(this.rfidOffIcon);
            this.$.rfidIcon.addClass(this.rfidOnIcon);
          } else {
            this.$.rfidIcon.removeClass(this.rfidOnIcon);
            this.$.rfidIcon.addClass(this.rfidOffIcon);
          }
        }
      }
    }, this);
  },
  disabledButton: function (inSender, inEvent) {
    this.isEnabled = !inEvent.status;
    this.setDisabled(inEvent.status);
    if (!this.isEnabled) {
      this.$.lbl.hide();
    } else {
      this.$.lbl.show();
    }
  },
  tap: function (options) {
    if (!this.disabled) {
      this.doTabChange({
        tabPanel: this.tabPanel,
        keyboard: 'toolbarscan',
        edit: false,
        options: options,
        status: ''
      });
    }
    OB.MobileApp.view.scanningFocus(true);

    return true;
  },
  pointOfSaleLoad: function (inSender, inEvent) {
    if (OB.UTIL.RfidController.get('connectionLost')) {
      this.$.rfidIcon.addClass(this.rfidOfflineIcon);
    } else {
      this.$.rfidIcon.removeClass(this.rfidOfflineIcon);
    }
    if (!OB.UTIL.RfidController.get('isRFIDEnabled') || !OB.UTIL.RfidController.get('reconnectOnScanningFocus')) {
      this.$.rfidIcon.addClass(this.rfidOffIcon);
      this.$.rfidIcon.removeClass(this.rfidOnIcon);
    } else {
      this.$.rfidIcon.addClass(this.rfidOnIcon);
      this.$.rfidIcon.removeClass(this.rfidOffIcon);
    }
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ButtonTabBrowse',
  kind: 'OB.UI.ToolbarButtonTab',
  events: {
    onTabChange: '',
    onRightToolbarDisabled: ''
  },
  handlers: {
    onRightToolbarDisabled: 'disabledButton'
  },
  init: function (model) {
    this.model = model;
    //    var me = this;
    //    this.model.get('multiOrders').on('change:isMultiOrders', function (model) {
    //      me.doRightToolbarDisabled({
    //        status: model.get('isMultiOrders')
    //      });
    //    }, this);
  },
  disabledButton: function (inSender, inEvent) {
    var isDisabled = inEvent.status;
    this.isEnabled = !inEvent.status;
    if (OB.MobileApp.model.hasPermission('OBPOS_disableBrowseTab', true)) {
      isDisabled = true;
    }
    this.setDisabled(isDisabled);
    if (!this.isEnabled) {
      this.$.lbl.hide();
    } else {
      this.$.lbl.show();
    }

  },
  tabPanel: 'catalog',
  i18nLabel: 'OBMOBC_LblBrowse',
  tap: function () {
    if (!this.disabled) {
      this.doTabChange({
        tabPanel: this.tabPanel,
        keyboard: false,
        edit: false
      });
    }
    OB.MobileApp.view.scanningFocus(true);
  },
  initComponents: function () {
    this.inherited(arguments);
    if (OB.MobileApp.model.hasPermission('OBPOS_remote.product', true)) {
      this.hide();
    }
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ButtonTabSearchCharacteristic',
  kind: 'OB.UI.ToolbarButtonTab',
  tabPanel: 'searchCharacteristic',
  i18nLabel: 'OBPOS_LblSearch',
  events: {
    onTabChange: '',
    onRightToolbarDisabled: ''
  },
  handlers: {
    onRightToolbarDisabled: 'disabledButton'
  },
  init: function (model) {
    this.model = model;
    //    var me = this;
    //    this.model.get('multiOrders').on('change:isMultiOrders', function (model) {
    //      me.doRightToolbarDisabled({
    //        status: model.get('isMultiOrders')
    //      });
    //    }, this);
  },
  disabledButton: function (inSender, inEvent) {
    var isDisabled = inEvent.status;
    this.isEnabled = !inEvent.status;
    if (OB.MobileApp.model.hasPermission('OBPOS_disableSearchTab', true)) {
      isDisabled = true;
    }
    this.setDisabled(isDisabled);
    if (!this.isEnabled && !OB.MobileApp.model.get('serviceSearchMode')) {
      this.$.lbl.hide();
    } else {
      this.$.lbl.show();
    }
  },
  tap: function () {
    if (this.disabled === false) {
      OB.UI.SearchProductCharacteristic.prototype.filtersCustomClear();
      this.doTabChange({
        tabPanel: this.tabPanel,
        keyboard: false,
        edit: false
      });
      OB.MobileApp.view.scanningFocus(true);
    }
  },
  initComponents: function () {
    this.inherited(arguments);
    if (OB.MobileApp.model.hasPermission('OBPOS_remote.product', true)) {
      this.owner.owner.setStyle('width: 50% !important;');
    }
  }
});


enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ButtonTabEditLine',
  published: {
    ticketLines: null
  },
  kind: 'OB.UI.ToolbarButtonTab',
  tabPanel: 'edit',
  i18nLabel: 'OBPOS_LblEdit',
  events: {
    onTabChange: '',
    onRightToolbarDisabled: '',
    onDisableUserInterface: '',
    onEnableUserInterface: '',
    onFinishServiceProposal: '',
    onToggleLineSelection: '',
    onShowActionIcons: ''
  },
  handlers: {
    onRightToolbarDisabled: 'disabledButton',
    onManageServiceProposal: 'manageServiceProposal'
  },
  init: function (model) {
    this.model = model;
    this.model.get('order').get('lines').on('selected', function (lineSelected) {
      this.currentLine = lineSelected;
    }, this);
    //    var me = this;
    //    this.model.get('multiOrders').on('change:isMultiOrders', function (model) {
    //      me.doRightToolbarDisabled({
    //        status: model.get('isMultiOrders')
    //      });
    //    }, this);
  },
  disabledButton: function (inSender, inEvent) {
    var isDisabled = inEvent.status;
    if (OB.MobileApp.model.hasPermission('OBPOS_disableEditTab', true)) {
      isDisabled = true;
    }
    this.setDisabled(isDisabled);
  },
  manageServiceProposal: function (inSender, inEvent) {
    OB.MobileApp.model.set('serviceSearchMode', inEvent.proposalType);
    this.previousStatus = inEvent.previousStatus;
    this.$.lbl.setContent(OB.I18N.getLabel('OBPOS_LblContinue'));
    this.doDisableUserInterface();
    OB.MobileApp.view.scanningFocus(false);
    this.setDisabled(false);
    this.doShowActionIcons({
      show: false
    });
  },
  tap: function (options) {
    if (OB.MobileApp.model.get('serviceSearchMode')) {
      this.$.lbl.setContent(OB.I18N.getLabel('OBPOS_LblEdit'));
      this.doEnableUserInterface();
      OB.MobileApp.view.scanningFocus(true);
      this.doShowActionIcons({
        show: true
      });
      this.doToggleLineSelection({
        status: false
      });
      if (OB.MobileApp.model.get('serviceSearchMode') === 'mandatory') {
        this.restoreStatus();
      } else if (OB.MobileApp.model.get('serviceSearchMode') === 'final') {
        this.previousStatus.callback();
      }
      OB.MobileApp.model.unset('serviceSearchMode');
    } else {
      var lines = this.model.get('order').get('lines');
      if (!options.isManual) {
        // The tap was not manual. So consider the last line added
        var lastLine;
        if (lines && lines.length > 0) {
          lastLine = lines.models[lines.length - 1];
        }
        if (this.currentLine) {
          this.currentLine.trigger('selected', this.currentLine);
        } else if (lastLine) {
          lastLine.trigger('selected', lastLine);
        }
      }
      if (!this.disabled && lines.length > 0) {
        //If the button is not disabled and we have, at least, one line,
        //the view is changed to edit view
        this.doTabChange({
          tabPanel: this.tabPanel,
          keyboard: 'toolbarscan',
          edit: true
        });
      }
      OB.MobileApp.view.scanningFocus(true);
    }
  },
  restoreStatus: function () {
    if (this.previousStatus.tab === 'scan' || this.previousStatus.tab === 'edit') {
      this.doTabChange({
        tabPanel: this.previousStatus.tab,
        keyboard: 'toolbarscan'
      });
    } else if (this.previousStatus.tab === 'catalog') {
      this.doTabChange({
        tabPanel: this.previousStatus.tab
      });
    } else {
      this.doTabChange({
        tabPanel: this.previousStatus.tab
      });
      this.doFinishServiceProposal({
        status: this.previousStatus
      });
    }
  }
});


// Toolbar panes
//----------------------------------------------------------------------------
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.RightToolbarPane',
  published: {
    model: null
  },
  classes: 'postab-content',

  handlers: {
    onTabButtonTap: 'tabButtonTapHandler'
  },
  components: [{
    kind: 'OB.OBPOSPointOfSale.UI.TabScan',
    name: 'scan'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.TabBrowse',
    name: 'catalog'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.TabSearchCharacteristic',
    name: 'searchCharacteristic',
    style: 'margin: 5px'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.TabPayment',
    name: 'payment'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.TabEditLine',
    name: 'edit'
  }],
  tabButtonTapHandler: function (inSender, inEvent) {
    if (inEvent.tabPanel) {
      this.showPane(inEvent.tabPanel, inEvent.options);
    }
  },
  showPane: function (tabName, options) {
    var me = this;
    OB.UTIL.HookManager.executeHooks('OBPOS_PreShowPane', {
      context: me,
      options: options,
      tabName: tabName
    }, function (args) {
      if (args && args.cancelOperation && args.cancelOperation === true) {
        return;
      }
      OB.MobileApp.model.set('lastPaneShown', 'unknown');
      var paneArray = me.getComponents(),
          i;
      for (i = 0; i < paneArray.length; i++) {
        paneArray[i].removeClass('active');
        if (paneArray[i].name === args.tabName) {
          if (paneArray[i].executeOnShow) {
            paneArray[i].executeOnShow(options);
          }
          paneArray[i].addClass('active');
          OB.MobileApp.model.set('lastPaneShown', args.tabName);
        }
      }
    });
  },
  modelChanged: function () {
    var receipt = this.model.get('order');
    this.$.scan.setReceipt(receipt);
    this.$.searchCharacteristic.setReceipt(receipt);
    this.$.payment.setReceipt(receipt);
    this.$.edit.setReceipt(receipt);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.TabSearchCharacteristic',
  kind: 'OB.UI.TabPane',
  published: {
    receipt: null
  },
  components: [{
    kind: 'OB.UI.SearchProductCharacteristic',
    name: 'searchCharacteristicTabContent'
  }],
  receiptChanged: function () {
    this.$.searchCharacteristicTabContent.setReceipt(this.receipt);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.TabBrowse',
  kind: 'OB.UI.TabPane',
  components: [{
    kind: 'OB.UI.ProductBrowser',
    name: 'catalogTabContent'
  }]
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.TabScan',
  kind: 'OB.UI.TabPane',
  published: {
    receipt: null
  },
  components: [{
    kind: 'OB.OBPOSPointOfSale.UI.Scan',
    name: 'scanTabContent'
  }],
  receiptChanged: function () {
    this.$.scanTabContent.setReceipt(this.receipt);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.TabEditLine',
  kind: 'OB.UI.TabPane',
  published: {
    receipt: null
  },
  components: [{
    kind: 'OB.OBPOSPointOfSale.UI.EditLine',
    name: 'editTabContent'
  }],
  receiptChanged: function () {
    this.$.editTabContent.setReceipt(this.receipt);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.TabPayment',
  kind: 'OB.UI.TabPane',
  published: {
    receipt: null
  },
  components: [{
    kind: 'OB.OBPOSPointOfSale.UI.Payment',
    name: 'paymentTabContent'
  }],
  receiptChanged: function () {
    this.$.paymentTabContent.setReceipt(this.receipt);
  },
  executeOnShow: function (options) {
    var me = this;
  }
});