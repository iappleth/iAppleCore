/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global window, B, Backbone */

(function() {

  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  enyo.kind({
    name: 'OB.UI.ButtonTabScan',
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
    name: 'OB.UI.TabScan',
    classes: 'tab-pane',
    components: [{
      kind: 'OB.UI.Scan'
    }],
    makeId: function() {
      return 'scan';
    }
  });

  //Refacorized using enyo -> OB.UI.ButtonTabScan
  OB.COMP.ButtonTabScan = OB.COMP.ToolbarButtonTab.extend({
    tabpanel: '#scan',
    label: OB.I18N.getLabel('OBPOS_LblScan'),
    initialize: function() {
      OB.COMP.ToolbarButtonTab.prototype.initialize.call(this); // super.initialize();
      this.options.root.modelorder.on('clear scan', function() {
        this.$el.tab('show');
        this.$el.parent().parent().addClass('active'); // Due to the complex construction of the toolbar buttons, forced active tab icon is needed
        OB.UTIL.setOrderLineInEditMode(false);
      }, this);
      this.options.root.SearchBPs.bps.on('click', function(model, index) {
        this.$el.tab('show');
        this.$el.parent().parent().addClass('active'); // Due to the complex construction of the toolbar buttons, forced active tab icon is needed
        OB.UTIL.setOrderLineInEditMode(false);
      }, this);
    },
    shownEvent: function(e) {
      this.options.root.keyboard.show('toolbarscan');
    }
  });

  //  OB.COMP.TabScan = Backbone.View.extend({
  //    tagName: 'div',
  //    attributes: {'id': 'scan', 'class': 'tab-pane'},
  //    contentView: [
  //      {view: OB.COMP.Scan}
  //    ],
  //    initialize: function () {
  //      OB.UTIL.initContentView(this);
  //    }
  //  });
}());