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
  name: 'OB.UI.subwindow',
  events: {
    onChangeSubWindow: ''
  },
  classes: 'subwindow',
  mainBeforeSetShowing: function(args) {
    this.caller = args.caller;
    if (this.beforeSetShowing){
      return this.beforeSetShowing(args);
    }
    return true;
  },
  header: {},
  body: {},
  goBack: function() {
    //navigate to this.caller
  },
  components: [{
    name: 'subWindowHeader'
  }, {
    name: 'subWindowBody'
  }],
  relComponentsWithSubWindow: function(comp, subWin) {
    if (!comp || !comp.getComponents) {
      return;
    }
    enyo.forEach(comp.getComponents(), function(child) {
      subWin.relComponentsWithSubWindow(child, subWin);
      child.subWindow = subWin;
    });
  },
  initComponents: function() {
    this.inherited(arguments);
    //set header
    this.$.subWindowHeader.createComponent(this.header);
    //set body
    this.$.subWindowBody.createComponent(this.body);

    this.relComponentsWithSubWindow(this, this);
  }
});

enyo.kind({
  name: 'OB.UI.subwindowheader',
  classes: 'subwindowheader',
  components: [{
    name: "closebutton",
    tag: 'a',
    classes: 'close',
    components: [{
      tag: 'span',
      allowHtml: true,
      content: '&times;'
    }]
  }, {
    tag: 'h3',
    classes: 'subwindowheadertext',
    name: 'headermessage',
    content: OB.I18N.getLabel('OBPOS_TitleCustomerAdvancedSearch')
  }],
  initComponents: function(){
    this.inherited(arguments);
    this.$.headermessage.setContent(this.headermessage);
    this.$.closebutton.tap = this.onTapCloseButton;
  }
});