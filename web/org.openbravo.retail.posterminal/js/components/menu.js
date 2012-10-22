/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo */

enyo.kind({
  name: 'OB.UI.ToolbarMenuButton',
  kind: 'OB.UI.ToolbarButton',
  attributes: {
    'data-toggle': 'dropdown'
  }
});

enyo.kind({
  name: 'OB.UI.ToolbarMenu',
  classes: 'dropdown',
  style: 'display: inline-block; width: 100%;',
  components: [{
    kind: 'OB.UI.ToolbarMenuButton',
    components: [{
      name: 'leftIcon'
    }, {
      tag: 'span'
    }, {
      name: 'rightIcon'
    }]
  }, {
    tag: 'ul',
    classes: 'dropdown-menu',
    name: 'menu'
  }],
  initComponents: function() {
    this.inherited(arguments);
    if (this.icon) {
      this.$.leftIcon.addClass(this.icon);
    }
    if (this.iconright) {
      this.$.rightIcon.addClass(this.iconright);
    }

    enyo.forEach(this.menuEntries, function(entry) {
      this.$.menu.createComponent(entry);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuReturn',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.invoice',
  events: {
    onShowReturnText: ''
  },
  label: OB.I18N.getLabel('OBPOS_LblReturn'),
  tap: function() {
    this.doShowReturnText();
  },
  init: function(model){
    var receipt = model.get('order'),
    me = this;
    receipt.on('change:quotation', function(model) {
      if (!model.get('quotation')) {
        me.show();
      } else {
        me.hide();
      }
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuInvoice',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.invoice',
  events: {
    onReceiptToInvoice: ''
  },
  label: OB.I18N.getLabel('OBPOS_LblInvoice'),
  tap: function() {
    this.doReceiptToInvoice();
  },
  init: function(model){
    var receipt = model.get('order'),
    me = this;
    receipt.on('change:quotation', function(model) {
      if (!model.get('quotation')) {
        me.show();
      } else {
        me.hide();
      }
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuPrint',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_print.receipt',
  events: {
    onPrintReceipt: ''
  },
  label: OB.I18N.getLabel('OBPOS_LblPrintReceipt'),
  tap: function() {
    if (OB.POS.modelterminal.hasPermission(this.permission)) {
      this.doPrintReceipt();
    }
  },
  init: function(model){
    var receipt = model.get('order'),
    me = this;
    receipt.on('change:quotation', function(model) {
      if (!model.get('quotation')) {
        me.show();
      } else {
        me.hide();
      }
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuQuotation',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.quotation',
  events: {
    onCreateQuotation: ''
  },
  label: OB.I18N.getLabel('OBPOS_CreateQuotation'),
  tap: function() {
    if(OB.POS.modelterminal.get('terminal').documentTypeForQuotations){
      this.doCreateQuotation();
    }else{
      OB.UTIL.showError(OB.I18N.getLabel('OBPOS_QuotationNoDocType'));
    }
  },
  updateVisibility: function(model){
    if (!model.get('quotation')) {
      this.show();
    } else {
      this.hide();
    }
  },
  init: function(model){
    var receipt = model.get('order'),
    me = this;
    receipt.on('change:quotation', function(model) {
      this.updateVisibility(model);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuCreateOrderFromQuotation',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.createorderfromquotation',
  events: {
    onCreateOrderFromQuotation: ''
  },
  label: OB.I18N.getLabel('OBPOS_CreateOrderFromQuotation'),
  tap: function() {
    this.doCreateOrderFromQuotation();
  },
  updateVisibility: function(model){
    if (model.get('quotation') && model.get('hasbeenpaid')==='Y') {
      this.show();
    } else {
      this.hide();
    }
  },
  init: function(model){
    var receipt = model.get('order'),
    me = this;
    me.hide();
    receipt.on('change:quotation', function(model) {
      this.updateVisibility(model);
    }, this);
    receipt.on('change:hasbeenpaid', function(model) {
      this.updateVisibility(model);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuRejectQuotation',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.rejectquotation',
  events: {
    onRejectQuotation: ''
  },
  label: OB.I18N.getLabel('OBPOS_RejectQuotation'),
  tap: function() {
    this.doRejectQuotation();
  },
  updateVisibility: function(model){
    if (model.get('quotation') && model.get('hasbeenpaid')==='Y') {
      this.show();
    } else {
      this.hide();
    }
  },
  init: function(model){
    var receipt = model.get('order'),
    me = this;
    me.hide();
    receipt.on('change:quotation', function(model) {
      this.updateVisibility(model);
    }, this);
    receipt.on('change:hasbeenpaid', function(model) {
      this.updateVisibility(model);
    }, this);
  }
});
enyo.kind({
  name: 'OB.UI.MenuReactivateQuotation',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.reactivatequotation',
  events: {
    onReactivateQuotation: ''
  },
  label: OB.I18N.getLabel('OBPOS_ReactivateQuotation'),
  tap: function() {
    this.doReactivateQuotation();
  },
  updateVisibility: function(model){
    if (model.get('quotation') && model.get('hasbeenpaid')==='Y') {
      this.show();
    } else {
      this.hide();
    }
  },
  init: function(model){
    var receipt = model.get('order'),
    me = this;
    me.hide();
    receipt.on('change:quotation', function(model) {
      this.updateVisibility(model);
    }, this);
    receipt.on('change:hasbeenpaid', function(model) {
      this.updateVisibility(model);
    }, this);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.StandardMenu',
  kind: 'OB.UI.ToolbarMenu',
  icon: 'btn-icon btn-icon-menu',
  initComponents: function() {
    // dynamically generating the menu
    this.menuEntries = [];
    this.menuEntries.push({
      kind: 'OB.UI.MenuReturn'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuInvoice'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuPrint'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuReactivateQuotation'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuRejectQuotation'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuCreateOrderFromQuotation'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuSeparator'
    });
    
    this.menuEntries.push({
      kind: 'OB.UI.MenuQuotation'
    });
    
    this.menuEntries.push({
      kind: 'OB.UI.MenuSeparator'
    });
    
    this.menuEntries.push({
      kind: 'OB.UI.MenuItem',
      label: OB.I18N.getLabel('OBPOS_LblOpenbravoWorkspace'),
      url: '../..'
    });

    enyo.forEach(OB.POS.windows.filter(function(window) {
      // show in menu only the ones with menuPosition
      return window.get('menuPosition');
    }), function(window) {
      this.menuEntries.push({
        kind: 'OB.UI.MenuItem',
        label: window.get('menuLabel'),
        route: window.get('route')
      });
    }, this);
    this.inherited(arguments);
  }
});


enyo.kind({
  name: 'OB.UI.MenuSeparator',
  tag: 'li',
  classes: 'divider'
});

enyo.kind({
  name: 'OB.UI.MenuItem',
  tag: 'li',
  components: [{
    tag: 'a',
    name: 'item',
    style: 'padding-bottom: 10px;padding-left: 15px; padding-right: 15px;padding-top: 10px;',
    attributes: {
      href: '#'
    }
  }],
  initComponents: function() {
    this.inherited(arguments);
    this.$.item.setContent(this.label);
    if (!OB.POS.modelterminal.hasPermission(this.route)) {
      this.$.item.setStyle('color: #cccccc; padding-bottom: 10px;padding-left: 15px; padding-right: 15px;padding-top: 10px;');
    }
  },
  tap: function() {
    if(OB.POS.modelterminal.isWindowOnline(this.route) === true){
      if(!OB.POS.modelterminal.get('connectedToERP')){
        OB.UTIL.showError(OB.I18N.getLabel('OBPOS_OfflineWindowRequiresOnline'));
        return;
      }
      if(OB.POS.modelterminal.get('loggedOffline')===true){
        OB.UTIL.showError(OB.I18N.getLabel('OBPOS_OfflineWindowOfflineLogin'));
        return;
      }
    }
    if (!OB.POS.modelterminal.hasPermission(this.route)) {
      return;
    }
    if (this.route) {
      OB.POS.navigate(this.route);
    }
    if (this.url) {
      window.open(this.url, '_blank');
    }
  }
});

