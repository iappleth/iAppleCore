/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, _, $ */
enyo.kind({
  name: 'OB.UI.Button',
  kind: 'enyo.Button',
  handlers: {
    onkeydown: 'keydownHandler'
  },
  keydownHandler: function (inSender, inEvent) {
    var keyCode = inEvent.keyCode;
    if (keyCode === 13 || keyCode === 32) { //Handle ENTER and SPACE keys in buttons
      this.executeTapAction();
      return true;
    }
    return false;
  },
  executeTapAction: function () {
    if (this && this.ontap && this.owner && this.owner[this.ontap]) {
      this.owner[this.ontap]();
    } else {
      this.tap();
    }
  },
  focus: function () { // Enyo doesn't have "focus" function in buttons, so it has to be implemented
    if (this.hasNode()) {
      this.hasNode().focus();
    }
  }
/*, Removed to investigate if btn-over/btn-down are still needed due to enyo/onyx adoption
  handlers: {
    onmouseover: 'mouseOverOut',
    onmouseout: 'mouseOverOut'
  },
  //TODO: support windows 7  setTimeout(function() { me.$el.removeClass('btn-down'); }, 125);
  mouseOverOut: function (inSender, inEvent) {
    this.addRemoveClass('btn-over', inEvent.type === 'mouseover');
  }*/
});

enyo.kind({
  name: 'OB.UI.RegularButton',
  kind: 'OB.UI.Button',
  icon: '',
  iconright: '',
  label: '',
  classes: 'btnlink'
});

enyo.kind({
  name: 'OB.UI.SmallButton',
  kind: 'OB.UI.RegularButton',
  classes: 'btnlink-small'
});

enyo.kind({
  name: 'OB.UI.ModalDialogButton',
  kind: 'OB.UI.RegularButton',
  events: {
    onHideThisPopup: ''
  },
  classes: 'btnlink-gray modal-dialog-button'
});

enyo.kind({
  name: 'OB.UI.Popup',
  kind: "onyx.Popup",
  centered: true,
  floating: true,
  closeOnEscKey: true,
  scrim: true,
  handlers: {
    onkeydown: 'keydownHandler',
    onHideThisPopup: 'hideFromInside'
  },
  keydownHandler: function (inSender, inEvent) {
    var keyCode = inEvent.keyCode;
    if (keyCode === 27 && this.showing && this.closeOnEscKey) { //Handle ESC key to hide the popup
      this.hide();
      return true;
    } else if (keyCode === 13 && this.defaultActionButton) { //Handle ENTER key to execute the default action (if exists)
      this.defaultActionButton.executeTapAction();
      return true;
    } else {
      return false;
    }
  },
  _addArgsToComponent: function (args) {
    if (args) {
      this.args = this.args || {};
      _.each(args, function (arg, key) {
        this.args[key] = arg;
      }, this);
    }
  },
  showingChanged: function () {
    this.inherited(arguments);
    if (this.showing) {
      OB.POS.terminal.openedPopup = this;
    } else {
      OB.POS.terminal.openedPopup = null;
    }
  },
  show: function (args) {
    var resp = true;
    this.args = {}; //reset;
    this._addArgsToComponent(args);
    if (this.executeOnShow) {
      resp = this.executeOnShow();
      if (_.isUndefined(resp) || _.isNull(resp)) {
        resp = true;
      }
    }
    if (resp) {
      this.inherited(arguments);
      this.setDefaultActionButton();
      this.focusInPopup();
      if (this.executeOnShown) {
        this.executeOnShown();
      }
    }
  },
  hideFromInside: function (inSender, inEvent) {
    this.hide(inEvent.args);
  },
  hide: function (args) {
    var resp = true;
    this._addArgsToComponent(args);
    if (this.executeBeforeHide) {
      resp = this.executeBeforeHide();
      if (_.isUndefined(resp) || _.isNull(resp)) {
        resp = true;
      }
    }
    if (resp) {
      this.inherited(arguments);
      OB.POS.terminal.$.focusKeeper.focus();
      if (this.executeOnHide) {
        this.executeOnHide();
      }
    }
  },
  focusInPopup: function () {
    var allChildsArray = OB.UTIL.getAllChildsSorted(this),
        isFirstFocusableElementObtained = false,
        tagName, element, i;
    for (i = 0; i < allChildsArray.length; i++) {
      if (allChildsArray[i].hasNode() && allChildsArray[i].hasNode().tagName) {
        tagName = allChildsArray[i].hasNode().tagName.toUpperCase();
      } else {
        tagName = '';
      }
      if ((tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA' || tagName === 'BUTTON') && allChildsArray[i].showing && !isFirstFocusableElementObtained) {
        element = allChildsArray[i];
        isFirstFocusableElementObtained = true;
      } else if (allChildsArray[i].isFirstFocus) {
        element = allChildsArray[i];
        break;
      }
    }
    if (element) {
      element.focus();
    }
    return true;
  },
  setDefaultActionButton: function (element) {
    var allChildsArray, tagName, i;
    if (element) {
      allChildsArray = [element];
    } else {
      allChildsArray = OB.UTIL.getAllChildsSorted(this);
    }

    for (i = 0; i < allChildsArray.length; i++) {
      if (allChildsArray[i].hasNode() && allChildsArray[i].hasNode().tagName) {
        tagName = allChildsArray[i].hasNode().tagName.toUpperCase();
      } else {
        tagName = '';
      }
      if (tagName === 'BUTTON' && allChildsArray[i].isDefaultAction) {
        element = allChildsArray[i];
        break;
      }
    }
    if (element) {
      this.defaultActionButton = element;
    }
    return true;
  },
  updatePosition: function () {
    if (!this.centered || !this.floating) {
      this.inherited(arguments);
      return true;
    }
    // Improve of enyo "updatePosition" function to proper manage of % and absolute top and left positions
    var top, left, t = this.getBounds();
    if (this.topPosition) {
      top = this.topPosition.toString();
    } else if (this.centered) {
      top = '50%';
    } else {
      top = '0';
    }
    if (top.indexOf('px') !== -1) {
      top = top.replace('px', '');
    }

    if (this.leftPosition) {
      left = this.leftPosition.toString();
    } else if (this.centered) {
      left = '50%';
    } else {
      left = '0';
    }
    if (left.indexOf('px') !== -1) {
      left = left.replace('px', '');
    }

    if (top.indexOf('%') !== -1) {
      this.addStyles('top: ' + top);
      this.addStyles('margin-top: -' + Math.max(t.height / 2, 0).toString() + 'px;');
    } else {
      this.addStyles('top: ' + top + 'px');
    }

    if (left.indexOf('%') !== -1) {
      this.addStyles('left: ' + left);
      this.addStyles('margin-left: -' + Math.max(t.width / 2, 0).toString() + 'px;');
    } else {
      this.addStyles('left: ' + left + 'px');
    }

    return true;
  }
});

enyo.kind({
  //TODO: maxheight
  name: 'OB.UI.Modal',
  kind: "OB.UI.Popup",
  classes: 'modal',
  components: [{
    tag: 'div',
    classes: 'modal-header',
    components: [{
      tag: 'div',
      classes: 'modal-header-closebutton',
      components: [{
        tag: 'span',
        ontap: 'hide',
        allowHtml: true,
        content: '&times;'
      }]
    }, {
      name: 'header',
      classes: 'modal-header-text'
    }]
  }, {
    tag: 'div',
    name: 'body',
    classes: 'modal-body'
  }],
  initComponents: function () {
    this.inherited(arguments);
    if (this.modalClass) {
      this.addClass(this.modalClass);
    }

    this.$.header.setContent(this.header);

    if (this.bodyClass) {
      this.$.body.addClass(this.bodyClass);
    }
    this.$.body.createComponent(this.body);
  }
});

enyo.kind({
  name: 'OB.UI.RenderEmpty',
  style: 'border-bottom: 1px solid #cccccc; padding: 20px; text-align: center; font-weight: bold; font-size: 30px; color: #cccccc',
  initComponents: function () {
    this.inherited(arguments);
    this.setContent(this.label || OB.I18N.getLabel('OBPOS_SearchNoResults'));
  }
});


enyo.kind({
  name: 'OB.UI.SelectButton',
  kind: 'OB.UI.Button',
  classes: 'btnselect',
  tap: function () {
    this.model.trigger('selected', this.model);
    this.model.trigger('click', this.model);
  }
});

enyo.kind({
  name: 'OB.UI.CancelButton',
  kind: 'OB.UI.SmallButton',
  classes: 'btnlink-white btnlink-fontgray',
  events: {
    onShowPopup: ''
  },
  tap: function () {
    this.doShowPopup({
      popup: 'modalCancel'
    });
  },
  initComponents: function () {
    this.inherited(arguments);
    this.setContent(this.label || OB.I18N.getLabel('OBPOS_LblCancel'));
  }
});

enyo.kind({
  name: 'OB.UI.RadioButton',
  kind: "onyx.Checkbox",
  classes: 'btn btn-radio',
  style: 'padding: 0px 0px 0px 40px; margin: 10px;',
  activeRadio: function () {
    this.addClass('active');
    this.setChecked(true);
  },
  disableRadio: function () {
    this.setNodeProperty('checked', false);
    this.setAttribute('checked', '');
    this.removeClass('active');
    this.active = false;
    this.checked = false;
  },
  tap: function () {
    this.inherited(arguments);
    this.activeRadio();
  },
  initComponents: function () {
    this.inherited(arguments);
  }
});



// Toolbar Button
enyo.kind({
  name: 'OB.UI.ToolbarButton',
  kind: 'OB.UI.RegularButton',
  classes: 'btnlink-toolbar',
  initComponents: function () {
    this.inherited(arguments);
    if (this.icon) {
      this.addClass(this.icon);
    }
  }
});

enyo.kind({
  name: 'OB.UI.CheckboxButton',
  kind: 'OB.UI.Button',
  classes: 'btn-check',
  checked: false,
  tap: function () {
    this.checked = !this.checked;
    this.addRemoveClass('active', this.checked);
  },
  toggle: function () {
    this.checked = !this.checked;
    this.addRemoveClass('active', this.checked);
  },
  check: function () {
    this.addClass('active');
    this.checked = true;
  },
  unCheck: function () {
    this.removeClass('active');
    this.checked = false;
  }
});

// Order list
enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.UI.ButtonTab',
  initComponents: function () {
    this.inherited(arguments);
    this.addClass('btnlink btnlink-gray');
    if (this.label) {
      this.createComponent({
        name: 'lbl',
        tag: 'span',
        content: this.label
      });
    }
    //TODO
    //this.receipt.on('change:gross', function() {
    //  this.render();
    //}, this)
  }
});



// Order list
enyo.kind({
  name: 'OB.UI.ToolbarButtonTab',
  kind: 'OB.UI.ButtonTab',
  events: {
    onTabChange: ''
  },
  initComponents: function () {
    this.inherited(arguments);
    this.addClass('btnlink-toolbar');
  }
});


enyo.kind({
  name: 'OB.UI.TabPane',
  classes: 'postab-pane',
  executeOnShow: function (params) {
    var components = this.getComponents();
    if (components.length > 0) {
      if (this.$[components[0].getName()].executeOnShow) {
        this.$[components[0].getName()].executeOnShow(params);
      }
    }
  }
});


enyo.kind({
  //TODO: maxheight
  name: 'OB.UI.ModalAction',
  kind: "OB.UI.Popup",
  classes: 'modal-dialog',
  bodyContentClass: 'modal-dialog-body-content',
  bodyButtonsClass: 'modal-dialog-body-buttons',
  components: [{
    tag: 'div',
    classes: 'modal-dialog-header',
    components: [{
      name: 'headerCloseButton',
      tag: 'div',
      classes: 'modal-dialog-header-closebutton',
      components: [{
        tag: 'span',
        ontap: 'hide',
        allowHtml: true,
        content: '&times'
      }]
    }, {
      name: 'header',
      classes: 'modal-dialog-header-text'
    }]
  }, {
    tag: 'div',
    classes: 'modal-dialog-body',
    name: 'bodyParent',
    components: [{
      tag: 'div',
      name: 'bodyContent'
    }, {
      tag: 'div',
      name: 'bodyButtons'
    }]
  }],
  initComponents: function () {
    this.inherited(arguments);

    this.$.header.setContent(this.header);

    if (this.maxheight) {
      this.$.bodyParent.setStyle('max-height: ' + this.maxheight + ';');
    }

    this.$.bodyContent.setClasses(this.bodyContentClass);
    this.$.bodyContent.createComponent(this.bodyContent);

    this.$.bodyButtons.setClasses(this.bodyButtonsClass);
    this.$.bodyButtons.createComponent(this.bodyButtons);
  }
});

enyo.kind({
  name: 'OB.UI.SearchInput',
  kind: 'enyo.Input',
  type: 'text',
  classes: 'input',
  attributes: {
    'x-webkit-speech': 'x-webkit-speech'
  }
});

enyo.kind({
  name: 'OB.UI.SearchInputAutoFilter',
  kind: 'enyo.Input',
  type: 'text',
  classes: 'input',
  attributes: {
    'x-webkit-speech': 'x-webkit-speech'
  },
  events: {
    onFiltered: ''
  },
  input: function () {
    var temp = this.getValue(),
        me = this;
    setTimeout(function () {
      if (temp === me.getValue()) {
        me.doFiltered();
      }
    }, 750);
  }
});

enyo.kind({
  name: 'OB.UI.MenuAction',
  permission: null,
  components: [{
    name: 'lbl',
    allowHtml: true,
    style: 'padding: 12px 5px 12px 15px;',
    classes: 'dropdown-menuitem'
  }],
  setDisabled: function (value) {
    this.disabled = value;
    if (value) {
      this.addClass('disabled');
    } else {
      this.removeClass('disabled');
    }
  },
  initComponents: function () {
    this.inherited(arguments);
    this.$.lbl.setContent(this.label);
    if (this.permission && !OB.POS.modelterminal.hasPermission(this.permission)) {
      this.setDisabled(true);
    }
  }
});


enyo.kind({
  name: 'OB.UI.ModalInfo',
  kind: 'OB.UI.ModalAction',
  bodyButtons: {
    components: [{
      kind: 'OB.UI.AcceptDialogButton'
    }]
  },
  events: {
    onShowPopup: ''
  },
  closeOnAcceptButton: true,
  initComponents: function () {
    this.inherited(arguments);
    this.$.bodyButtons.$.acceptDialogButton.dialogContainer = this;

  }
});

enyo.kind({
  name: 'OB.UI.AcceptDialogButton',
  kind: 'OB.UI.ModalDialogButton',
  classes: 'btnlink btnlink-gray modal-dialog-button',
  events: {
    onHideThisPopup: ''
  },
  tap: function () {
    if (this.dialogContainer.acceptCallback) {
      this.dialogContainer.acceptCallback();
    }
    if (this.dialogContainer.closeOnAcceptButton) {
      this.doHideThisPopup();
    }
  },
  initComponents: function () {
    if (this.label) {
      this.setContent(this.label);
    } else {
      this.setContent(OB.I18N.getLabel('OBPOS_LblOk'));
    }
    this.inherited(arguments);
  }
});

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.CancelDialogButton',
  tap: function () {
    this.doHideThisPopup();
  },
  initComponents: function () {
    this.setContent(OB.I18N.getLabel('OBPOS_LblCancel'));
    this.inherited(arguments);

  }
});