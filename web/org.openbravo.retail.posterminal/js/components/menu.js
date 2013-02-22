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
  name: 'OB.UI.ToolbarMenu',
  components: [{
    kind: 'onyx.MenuDecorator',
    name: 'btnContextMenu',
    components: [{
      kind: 'OB.UI.ButtonContextMenu',
      name: 'toolbarButton'
    }, {
      kind: 'onyx.Menu',
      classes: 'dropdown',
      name: 'menu',
      maxHeight: 600,
      scrolling: false,
      floating: true
    }]
  }],
  onButtonTap: function () {
    if (this.$.toolbarButton.hasClass('btn-over')) {
      this.$.toolbarButton.removeClass('btn-over');
    }
  },
  initComponents: function () {
    this.inherited(arguments);

    enyo.forEach(this.menuEntries, function (entry) {
      this.$.menu.createComponent(entry);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuReturn',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.return',
  events: {
    onShowDivText: ''
  },
  label: OB.I18N.getLabel('OBPOS_LblReturn'),
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    this.doShowDivText({
      permission: this.permission,
      orderType: 1
    });
  },
  init: function (model) {
    this.model = model;
    var receipt = model.get('order'),
        me = this;
    receipt.on('change:isQuotation', function (model) {
      if (!model.get('isQuotation')) {
        me.show();
      } else {
        me.hide();
      }
    }, this);
    receipt.on('change:isEditable', function (newValue) {
      if (newValue) {
        if (newValue.get('isEditable') === false) {
          this.setShowing(false);
          return;
        }
      }
      this.setShowing(true);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuVoidLayaway',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.voidLayaway',
  events: {
    onShowDivText: '',
    onTabChange: ''
  },
  label: OB.I18N.getLabel('OBPOS_VoidLayaway'),
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    this.doShowDivText({
      permission: this.permission,
      orderType: 3
    });
    this.doTabChange({
      tabPanel: 'payment',
      keyboard: 'toolbarpayment',
      edit: false
    });
  },
  init: function (model) {
    this.model = model;
    var receipt = model.get('order'),
        me = this;
    this.setShowing(false);
    receipt.on('change:isLayaway', function (model) {
      if (model.get('isLayaway')) {
        me.show();
      } else {
        me.hide();
      }
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuLayaway',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.layawayReceipt',
  events: {
    onShowDivText: ''
  },
  label: OB.I18N.getLabel('OBPOS_LblLayawayReceipt'),
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    this.doShowDivText({
      permission: this.permission,
      orderType: 2
    });
  },
  init: function (model) {
    this.model = model;
    var receipt = model.get('order'),
        me = this;
    receipt.on('change:isQuotation', function (model) {
      if (!model.get('isQuotation')) {
        me.show();
      } else {
        me.hide();
      }
    }, this);
    receipt.on('change:isEditable', function (newValue) {
      if (newValue) {
        if (newValue.get('isEditable') === false) {
          this.setShowing(false);
          return;
        }
      }
      this.setShowing(true);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuProperties',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.properties',
  events: {
    onShowReceiptProperties: ''
  },
  label: OB.I18N.getLabel('OBPOS_LblProperties'),
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    this.doShowReceiptProperties();
  },
  init: function (model) {
    this.model = model;
    this.model.get('order').on('change:isEditable', function (newValue) {
      if (newValue) {
        if (newValue.get('isEditable') === false) {
          this.setShowing(false);
          return;
        }
      }
      this.setShowing(true);
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
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    this.doReceiptToInvoice();
  },
  init: function (model) {
    this.model = model;
    var receipt = model.get('order'),
        me = this;
    receipt.on('change:isQuotation change:isLayaway', function (model) {
      if (!model.get('isQuotation') || model.get('isLayaway')) {
        me.show();
      } else {
        me.hide();
      }
    }, this);
    receipt.on('change:isEditable', function (newValue) {
      if (newValue) {
        if (newValue.get('isEditable') === false && !newValue.get('isLayaway')) {
          this.setShowing(false);
          return;
        }
      }
      this.setShowing(true);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuCustomers',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.customers',
  events: {
    onChangeSubWindow: ''
  },
  label: OB.I18N.getLabel('OBPOS_LblCustomers'),
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    this.doChangeSubWindow({
      newWindow: {
        name: 'customerAdvancedSearch',
        params: {
          navigateOnClose: 'mainSubWindow'
        }
      }
    });
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
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    if (OB.POS.modelterminal.hasPermission(this.permission)) {
      this.doPrintReceipt();
    }
  },
  init: function (model) {
    var receipt = model.get('order'),
        me = this;
    receipt.on('change:isQuotation', function (model) {
      if (!model.get('isQuotation')) {
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
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    if (OB.POS.modelterminal.get('terminal').terminalType.documentTypeForQuotations) {
      if (OB.POS.modelterminal.hasPermission(this.permission)) {
        this.doCreateQuotation();
      }
    } else {
      OB.UTIL.showError(OB.I18N.getLabel('OBPOS_QuotationNoDocType'));
    }
  },
  updateVisibility: function (model) {
    if (!model.get('isQuotation')) {
      this.show();
    } else {
      this.hide();
    }
  },
  init: function (model) {
    var receipt = model.get('order'),
        me = this;
    receipt.on('change:isQuotation', function (model) {
      this.updateVisibility(model);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuDiscounts',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_retail.advDiscounts',
  events: {
    onDiscountsMode: ''
  },
  //TODO
  label: OB.I18N.getLabel('OBPOS_LblReceiptDiscounts'),
  tap: function () {
    if (!this.disabled) {
      this.parent.hide(); // Manual dropdown menu closure
      this.doDiscountsMode({
        tabPanel: 'edit',
        keyboard: 'toolbardiscounts',
        edit: false,
        options: {
          discounts: true
        }
      });
    }
  },
  init: function (model) {
    var me = this;
    this.receipt = model.get('order');
    //set disabled until ticket has lines
    me.setDisabled(true);
    if (!OB.POS.modelterminal.hasPermission(this.permission)) {
      //no permissions, never will be enabled
      return;
    }
    this.receipt.get('lines').on('all', function () {
      if (this.receipt.get('lines').length > 0) {
        OB.Dal.find(OB.Model.Discount, {
          _whereClause: "where m_offer_type_id in ('D1D193305A6443B09B299259493B272A', '20E4EC27397344309A2185097392D964', '7B49D8CC4E084A75B7CB4D85A6A3A578', '8338556C0FBF45249512DB343FEFD280')"
        }, function (promos) {
          me.setDisabled(promos.length === 0);
        }, function () {
          me.setDisabled(true);
        });
        me.setDisabled(false);
      } else {
        me.setDisabled(true);
      }
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuCreateOrderFromQuotation',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.createorderfromquotation',
  events: {
    onShowPopup: ''
  },
  label: OB.I18N.getLabel('OBPOS_CreateOrderFromQuotation'),
  tap: function () {
    if (this.disabled) {
      return true;
    }
    if (OB.POS.modelterminal.hasPermission(this.permission)) {
      this.parent.hide(); // Manual dropdown menu closure
      this.doShowPopup({
        popup: 'modalCreateOrderFromQuotation'
      });
    }
  },
  updateVisibility: function (model) {
    if (model.get('isQuotation') && model.get('hasbeenpaid') === 'Y') {
      this.show();
    } else {
      this.hide();
    }
  },
  init: function (model) {
    var receipt = model.get('order'),
        me = this;
    me.hide();
    receipt.on('change:isQuotation', function (model) {
      this.updateVisibility(model);
    }, this);
    receipt.on('change:hasbeenpaid', function (model) {
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
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    if (OB.POS.modelterminal.hasPermission(this.permission)) {
      this.doRejectQuotation();
    }
  },
  updateVisibility: function (model) {
    if (model.get('isQuotation') && model.get('hasbeenpaid') === 'Y') {
      this.hide();
    } else {
      this.hide();
    }
  },
  init: function (model) {
    var receipt = model.get('order'),
        me = this;
    me.hide();
    receipt.on('change:isQuotation', function (model) {
      this.updateVisibility(model);
    }, this);
    receipt.on('change:hasbeenpaid', function (model) {
      this.updateVisibility(model);
    }, this);
  }
});
enyo.kind({
  name: 'OB.UI.MenuReactivateQuotation',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.reactivatequotation',
  events: {
    onShowReactivateQuotation: ''
  },
  label: OB.I18N.getLabel('OBPOS_ReactivateQuotation'),
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    if (OB.POS.modelterminal.hasPermission(this.permission)) {
      this.doShowReactivateQuotation();
    }
  },
  updateVisibility: function (model) {
    if (model.get('isQuotation') && model.get('hasbeenpaid') === 'Y') {
      this.show();
    } else {
      this.hide();
    }
  },
  init: function (model) {
    var receipt = model.get('order'),
        me = this;
    me.hide();
    receipt.on('change:isQuotation', function (model) {
      this.updateVisibility(model);
    }, this);
    receipt.on('change:hasbeenpaid', function (model) {
      this.updateVisibility(model);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuSeparator',
  classes: 'dropdown-menudivider'
});

enyo.kind({
  name: 'OB.UI.MenuPaidReceipts',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_retail.paidReceipts',
  events: {
    onPaidReceipts: ''
  },
  label: OB.I18N.getLabel('OBPOS_LblPaidReceipts'),
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    if (!OB.POS.modelterminal.get('connectedToERP')) {
      OB.UTIL.showError(OB.I18N.getLabel('OBPOS_OfflineWindowRequiresOnline'));
      return;
    }
    if (OB.POS.modelterminal.hasPermission(this.permission)) {
      this.doPaidReceipts();
    }
  }
});

enyo.kind({
  name: 'OB.UI.MenuQuotations',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_retail.quotations',
  events: {
    onQuotations: ''
  },
  label: OB.I18N.getLabel('OBPOS_Quotations'),
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    if (!OB.POS.modelterminal.get('connectedToERP')) {
      OB.UTIL.showError(OB.I18N.getLabel('OBPOS_OfflineWindowRequiresOnline'));
      return;
    }
    if (OB.POS.modelterminal.hasPermission(this.permission)) {
      this.doQuotations();
    }
  }
});

enyo.kind({
  name: 'OB.UI.MenuLayaways',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_retail.layaways',
  events: {
    onLayaways: ''
  },
  label: OB.I18N.getLabel('OBPOS_LblLayaways'),
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    if (!OB.POS.modelterminal.get('connectedToERP')) {
      OB.UTIL.showError(OB.I18N.getLabel('OBPOS_OfflineWindowRequiresOnline'));
      return;
    }
    if (OB.POS.modelterminal.hasPermission(this.permission)) {
      this.doLayaways();
    }
  }
});

enyo.kind({
  name: 'OB.UI.MenuBackOffice',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_retail.backoffice',
  url: '../..',
  events: {
    onBackOffice: ''
  },
  label: OB.I18N.getLabel('OBPOS_LblOpenbravoWorkspace'),
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    if (OB.POS.modelterminal.hasPermission(this.permission)) {
      this.doBackOffice({
        url: this.url
      });
    }
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.StandardMenu',
  kind: 'OB.UI.ToolbarMenu',
  icon: 'btn-icon btn-icon-menu',
  externalEntries: [],
  initComponents: function () {
    // dynamically generating the menu
    this.menuEntries = [];
    this.menuEntries.push({
      kind: 'OB.UI.MenuReturn'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuVoidLayaway'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuProperties'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuInvoice'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuPrint'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuLayaway'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuCustomers'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuPaidReceipts'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuQuotations'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuLayaways'
    });

    this.menuEntries = this.menuEntries.concat(this.externalEntries);

    this.menuEntries.push({
      kind: 'OB.UI.MenuSeparator'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuDiscounts'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuSeparator'
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
      kind: 'OB.UI.MenuQuotation'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuSeparator'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuBackOffice'
    });

    enyo.forEach(OB.POS.windows.filter(function (window) {
      // show in menu only the ones with menuPosition
      return window.get('menuPosition');
    }), function (window) {
      this.menuEntries.push({
        kind: 'OB.UI.MenuItem',
        label: window.get('menuLabel'),
        route: window.get('route'),
        permission: window.get('permission')
      });
    }, this);
    this.inherited(arguments);
  }
});

enyo.kind({
  kind: 'OB.UI.MenuAction',
  name: 'OB.UI.MenuItem',
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.parent.hide(); // Manual dropdown menu closure
    if (OB.POS.modelterminal.isWindowOnline(this.route) === true) {
      if (!OB.POS.modelterminal.get('connectedToERP')) {
        OB.UTIL.showError(OB.I18N.getLabel('OBPOS_OfflineWindowRequiresOnline'));
        return;
      }
      if (OB.POS.modelterminal.get('loggedOffline') === true) {
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