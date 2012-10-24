/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, $ */

// Toolbar container
// ----------------------------------------------------------------------------
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.RightToolbar',
  classes: 'span9',
  handlers: {
    onTabButtonTap: 'tabButtonTapHandler'
  },
  components: [{
    tag: 'ul',
    classes: 'unstyled nav-pos row-fluid',
    name: 'toolbar'
  }],
  tabButtonTapHandler: function(sender, event) {
    if (event.tabPanel) {
      this.setTabButtonActive(event.tabPanel);
    }
  },
  setTabButtonActive: function(tabName) {
    var buttonContainerArray = this.getComponents()[0].getComponents(), i;

    for (i = 0; i < buttonContainerArray.length; i++) {
      buttonContainerArray[i].removeClass('active');
      if (buttonContainerArray[i].getComponents()[0].getComponents()[0].name === tabName) {
        buttonContainerArray[i].addClass('active');
      }
    }
  },
  manualTap: function(tabName) {
    var tab;
    function getButtonByName(name, me) {
      var componentArray = me.$.toolbar.getComponents(), i;
      for (i = 0; i < componentArray.length; i++) {
        if (componentArray[i].$.theButton.getComponents()[0].name === name) {
          return componentArray[i].$.theButton.getComponents()[0];
        }
      }
      return null;
    }

    tab = getButtonByName(tabName, this);
    if (tab) {
      tab.tap();
    }
  },
  initComponents: function() {
    this.inherited(arguments);
    enyo.forEach(this.buttons, function(btn) {
      this.$.toolbar.createComponent({
        kind: 'OB.OBPOSPointOfSale.UI.RightToolbarButton',
        button: btn
      });
    }, this);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.RightToolbarImpl',
  published: {
    receipt: null
  },
  kind: 'OB.OBPOSPointOfSale.UI.RightToolbar',
  buttons: [{
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabPayment',
    name: 'payment',
    containerCssClass: 'span4'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabScan',
    name: 'scan',
    containerCssClass: 'span2'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabBrowse',
    name: 'catalog',
    containerCssClass: 'span2'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabSearch',
    name: 'search',
    containerCssClass: 'span2'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabEditLine',
    name: 'edit',
    containerCssClass: 'span2'
  }],

  receiptChanged: function() {
    var totalPrinterComponent;

    this.receipt.on('clear scan', function() {
      if (this.receipt.get('isEditable') === false) {
        this.manualTap('edit');
      } else {
        this.manualTap('scan');
      }
    }, this);

    this.receipt.get('lines').on('click', function() {
      this.manualTap('edit');
    }, this);

    //some button will draw the total
    this.waterfall('onChangeTotal', {
      newTotal: this.receipt.getTotal()
    });
    this.receipt.on('change:gross', function(model) {
      this.waterfall('onChangeTotal', {
        newTotal: this.receipt.getTotal()
      });
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
  initComponents: function() {
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
  label: OB.I18N.getLabel('OBPOS_LblScan'),
  events: {
    onTabChange: ''
  },
  tap: function() {
    this.doTabChange({
      tabPanel: this.tabPanel,
      keyboard: 'toolbarscan',
      edit: false
    });
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ButtonTabBrowse',
  kind: 'OB.UI.ToolbarButtonTab',
  events: {
    onTabChange: ''
  },
  tabPanel: 'catalog',
  label: OB.I18N.getLabel('OBPOS_LblBrowse'),
  tap: function() {
    this.doTabChange({
      tabPanel: this.tabPanel,
      keyboard: false,
      edit: false
    });
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ButtonTabSearch',
  kind: 'OB.UI.ToolbarButtonTab',
  tabPanel: 'search',
  label: OB.I18N.getLabel('OBPOS_LblSearch'),
  events: {
    onTabChange: ''
  },
  tap: function() {
    this.doTabChange({
      tabPanel: this.tabPanel,
      keyboard: false,
      edit: false
    });
  },
  initComponents: function() {
    this.inherited(arguments);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ButtonTabPayment',
  kind: 'OB.UI.ToolbarButtonTab',
  tabPanel: 'payment',
  handlers: {
    onChangeTotal: 'renderTotal'
  },
  events: {
    onTabChange: ''
  },
  tap: function() {
    if (this.model.get('order').get('isEditable') === false) {
      return true;
    }
    this.doTabChange({
      tabPanel: this.tabPanel,
      keyboard: 'toolbarpayment',
      edit: false
    });
  },
  attributes: {
    style: 'text-align: center; font-size: 30px;'
  },
  components: [{
    tag: 'span',
    attributes: {
      style: 'font-weight: bold; margin: 0px 5px 0px 0px;'
    },
    components: [{
      kind: 'OB.UI.Total',
      name: 'totalPrinter'
    }]
  }],
  initComponents: function() {
    this.inherited(arguments);
    this.removeClass('btnlink-gray');
  },
  renderTotal: function(sender, event) {
    this.$.totalPrinter.renderTotal(event.newTotal);
  },
  init: function(model) {
    this.model = model;
    this.model.get('order').on('change:isEditable', function(newValue) {
      if (newValue) {
        if (newValue.get('isEditable') === false) {
          this.tabPanel = null;
          this.setAttribute('disabled', 'disabled');
          this.disabled = true;
          return;
        }
      }
      this.tabPanel = 'payment';
      this.setAttribute('disabled', null);
      this.disabled = true;
    }, this);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ButtonTabEditLine',
  published: {
    ticketLines: null
  },
  kind: 'OB.UI.ToolbarButtonTab',
  tabPanel: 'edit',
  label: OB.I18N.getLabel('OBPOS_LblEdit'),
  events: {
    onTabChange: ''
  },
  tap: function() {
    this.doTabChange({
      tabPanel: this.tabPanel,
      keyboard: 'toolbarscan',
      edit: true
    });
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
    kind: 'OB.OBPOSPointOfSale.UI.TabSearch',
    name: 'search'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.TabPayment',
    name: 'payment'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.TabEditLine',
    name: 'edit'
  }],
  tabButtonTapHandler: function(sender, event) {
    if (event.tabPanel) {
      this.showPane(event.tabPanel);
    }
  },
  showPane: function(tabName) {
    var paneArray = this.getComponents(), i;

    for (i = 0; i < paneArray.length; i++) {
      paneArray[i].removeClass('active');
      if (paneArray[i].name === tabName) {
        paneArray[i].addClass('active');
      }
    }
  },
  modelChanged: function() {
    var receipt = this.model.get('order');
    this.$.scan.setReceipt(receipt);
    this.$.search.setReceipt(receipt);
    this.$.payment.setReceipt(receipt);
    this.$.edit.setReceipt(receipt);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.TabSearch',
  kind: 'OB.UI.TabPane',
  published: {
    receipt: null
  },
  components: [{
    style: 'overflow: auto; margin: 5px',
    components: [{
      style: 'background-color: #ffffff; color: black; padding: 5px',
      components: [{
        kind: 'OB.UI.SearchProduct',
        name: 'search'
      }]
    }]
  }],
  receiptChanged: function() {
    this.$.search.setReceipt(this.receipt);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.TabBrowse',
  kind: 'OB.UI.TabPane',
  components: [{
    kind: 'OB.UI.ProductBrowser'
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
    name: 'scan'
  }],
  receiptChanged: function() {
    this.$.scan.setReceipt(this.receipt);
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
    name: 'edit'
  }],
  receiptChanged: function() {
    this.$.edit.setReceipt(this.receipt);
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
    name: 'payment'
  }],
  receiptChanged: function() {
    this.$.payment.setReceipt(this.receipt);
  }
});