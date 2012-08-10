// Toolbar container
// ----------------------------------------------------------------------------
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.RightToolbar',
  classes: 'span8',
  components: [{
    tag: 'ul',
    classes: 'unstyled nav-pos row-fluid',
    name: 'toolbar'
  }],
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
  kind: 'OB.OBPOSPointOfSale.UI.RightToolbar',
  buttons: [{
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabPayment',
    containerCssClass: 'span3'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabScan',
    containerCssClass: 'span3'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabBrowse',
    containerCssClass: 'span2'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabSearch',
    containerCssClass: 'span2'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabEditLine',
    containerCssClass: 'span2'
  }]
});


enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.RightToolbarButton',
  tag: 'li',
  components: [{
    name: 'theButton',
    attributes: {
      'data-toggle': 'tab',
      style: 'margin: 0px 5px 0px 5px;'
    }
  }],
  initComponents: function() {
    this.inherited(arguments);
    if (this.button.containerCssClass) {
      this.setClassAttribute(this.button.containerCssClass);
      delete this.button.containerCssClass;
    }
    this.$.theButton.createComponent(this.button);
  }
});


// Toolbar buttons
// ----------------------------------------------------------------------------
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ButtonTabScan',
  kind: 'OB.UI.ToolbarButtonTab',
  tabPanel: '#scan',
  label: OB.I18N.getLabel('OBPOS_LblScan'),
  events: {
    onTabChange: ''
  },
  tap: function() {
    this.doTabChange({
      keyboard: 'toolbarscan',
      edit: false
    });
  },
  manualTap: function() {
    // Hack to manually tap on bootstrap tab
    var domButton = $('#scan_button');
    domButton.tab('show');
    domButton.parent().parent().addClass('active');
    this.tap();
  },
  init: function() {
    var receipt;
    this.inherited(arguments);

    receipt = this.owner.owner.owner.owner.owner.model.get('order');

    receipt.on('clear scan', function() {
      this.manualTap();
    }, this);

    //TODO: do this     
    //        this.options.root.SearchBPs.bps.on('click', function (model, index) {
    //          this.$el.tab('show');
    //          this.$el.parent().parent().addClass('active'); // Due to the complex construction of the toolbar buttons, forced active tab icon is needed
    //          OB.UTIL.setOrderLineInEditMode(false);
    //        }, this);
    console.log('tabscan init');
  },
  makeId: function() {
    return 'scan_button';
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ButtonTabBrowse',
  kind: 'OB.UI.ToolbarButtonTab',
  tabPanel: '#catalog',
  label: OB.I18N.getLabel('OBPOS_LblBrowse'),
  tap: function() {
    this.inherited(arguments);
    this.owner.owner.owner.owner.owner.$.keyboard.hide();
  },
  initComponents: function() {
    this.inherited(arguments);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ButtonTabSearch',
  kind: 'OB.UI.ToolbarButtonTab',
  tabPanel: '#search',
  label: OB.I18N.getLabel('OBPOS_LblSearch'),
  events: {
    onTabChange: ''
  },
  tap: function() {
    this.doTabChange({
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
  tabPanel: '#payment',
  events: {
    onTabChange: ''
  },
  tap: function() {
    this.doTabChange({
      keyboard: 'toolbarpayment',
      edit: false
    });
  },
  attributes: {
    style: 'text-align: center; font-size: 30px;',
  },
  components: [{
    tag: 'span',
    attributes: {
      style: 'font-weight: bold; margin: 0px 5px 0px 0px;'
    },
    components: [{
      kind: 'OB.UI.Total'
    }]
  }],
  initComponents: function() {
    this.inherited(arguments);
    this.addRemoveClass('btnlink-gray', true);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ButtonTabEditLine',
  kind: 'OB.UI.ToolbarButtonTab',
  tabPanel: '#edition',
  label: OB.I18N.getLabel('OBPOS_LblEdit'),
  events: {
    onTabChange: ''
  },
  tap: function() {
    console.log('tap')
    this.doTabChange({
      keyboard: 'toolbarscan',
      edit: true
    });
  },
  initComponents: function() {
    this.inherited(arguments);
  }
});


// Toolbar panes
//----------------------------------------------------------------------------
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.RightToolbarPane',
  published: {
    model: null
  },
  classes: 'tab-content',
  components: [{
    kind: 'OB.OBPOSPointOfSale.UI.TabScan',
    name: 'scan'
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.TabBrowse'
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
  published: {
    receipt: null
  },
  classes: 'tab-pane',
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
  makeId: function() {
    return 'search';
  },
  receiptChanged: function() {
    this.$.search.setReceipt(this.receipt);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.TabBrowse',
  classes: 'tab-pane',
  components: [{
    kind: 'OB.UI.ProductBrowser'
  }],

  makeId: function() {
    return 'catalog';
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.TabScan',
  published: {
    receipt: null
  },
  classes: 'tab-pane',
  components: [{
    kind: 'OB.OBPOSPointOfSale.UI.Scan',
    name: 'scan'
  }],
  makeId: function() {
    return 'scan';
  },
  receiptChanged: function() {
    this.$.scan.setReceipt(this.receipt);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.TabEditLine',
  published: {
    receipt: null
  },
  classes: 'tab-pane',
  components: [{
    kind: 'OB.OBPOSPointOfSale.UI.EditLine',
    name: 'edit'
  }],
  makeId: function() {
    return 'edition'
  },
  receiptChanged: function() {
    this.$.edit.setReceipt(this.receipt);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.TabPayment',
  published: {
    receipt: null
  },
  classes: 'tab-pane',
  components: [{
    kind: 'OB.OBPOSPointOfSale.UI.Payment',
    name: 'payment'
  }],
  makeId: function() {
    return 'payment';
  },
  receiptChanged: function() {
    this.$.payment.setReceipt(this.receipt);
  }
});