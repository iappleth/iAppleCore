/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, $, Backbone, _ */

enyo.kind({
  name: 'OB.UI.Keyboard',

  commands: {},
  buttons: {},
  status: '',
  sideBarEnabled: false,
  destroy: function () {
    this.buttons = null;
    this.commands = null;
    this.inherited(arguments);
  },
  tag: 'div',
  classes: 'row-fluid',
  components: [{
    name: 'toolbarcontainer',
    tag: 'div',
    classes: 'span3'
  }, {
    tag: 'div',
    classes: 'span9',
    components: [{
      tag: 'div',
      classes: 'row-fluid',
      components: [{
        tag: 'div',
        classes: 'span8',
        components: [{
          tag: 'div',
          style: 'margin:5px',
          components: [{
            tag: 'div',
            style: 'text-align: right; width: 100%; height: 40px;',
            components: [{
              tag: 'pre',
              style: 'margin: 0px 0px 9px 0px; background-color: whiteSmoke; border: 1px solid #CCC; word-wrap: break-word; font-size: 35px; height: 33px; padding: 22px 5px 0px 0px;',
              components: [
              // ' ', XXX:???
              {
                name: 'editbox',
                tag: 'span',
                style: 'margin-left: -10px;'
              }]
            }]
          }]
        }]
      }, {
        tag: 'div',
        classes: 'span4',
        components: [{
          kind: 'OB.UI.ButtonKey',
          classButton: 'btn-icon btn-icon-backspace',
          command: 'del'
        }]
      }, {
        tag: 'div',
        classes: 'row-fluid',
        components: [{ // keypadcontainer
          tag: 'div',
          classes: 'span8',
          name: 'keypadcontainer'
        }, {
          tag: 'div',
          classes: 'span4',
          components: [{
            // rigth toolbar with qty, discount... buttons
            tag: 'div',
            name: 'sideenabled',
            components: [{
              tag: 'div',
              classes: 'row-fluid',
              components: [{
                tag: 'div',
                classes: 'span6',
                components: [{
                  kind: 'OB.UI.ButtonKey',
                  label: '-',
                  classButton: 'btnkeyboard-num btnkeyboard-minus',
                  command: '-'
                }]
              }, {
                tag: 'div',
                classes: 'span6',
                components: [{
                  kind: 'OB.UI.ButtonKey',
                  label: '+',
                  classButton: 'btnkeyboard-num btnkeyboard-plus',
                  command: '+'
                }]
              }]
            }, {
              tag: 'div',
              classes: 'row-fluid',
              components: [{
                tag: 'div',
                classes: 'span12',
                components: [{
                  kind: 'OB.UI.ButtonKey',
                  label: OB.I18N.getLabel('OBPOS_KbQuantity'),
                  command: 'line:qty'
                }]
              }]
            }, {
              tag: 'div',
              classes: 'row-fluid',
              components: [{
                tag: 'div',
                classes: 'span12',
                components: [{
                  kind: 'OB.UI.ButtonKey',
                  label: OB.I18N.getLabel('OBPOS_KbPrice'),
                  permission: 'OBPOS_order.changePrice',
                  command: 'line:price'
                }]
              }]
            }, {
              tag: 'div',
              classes: 'row-fluid',
              components: [{
                tag: 'div',
                classes: 'span12',
                components: [{
                  kind: 'OB.UI.ButtonKey',
                  label: OB.I18N.getLabel('OBPOS_KbDiscount'),
                  permission: 'OBPOS_order.discount',
                  command: 'line:dto'
                }]
              }]
            }]
          }, {
            // empty right toolbar used in case the keyboard
            // shouldn't support these buttons
            tag: 'div',
            name: 'sidedisabled',
            components: [{
              tag: 'div',
              classes: 'row-fluid',
              components: [{
                tag: 'div',
                classes: 'span6',
                components: [{
                  kind: 'OB.UI.ButtonKey'
                }]
              }, {
                tag: 'div',
                classes: 'span6',
                components: [{
                  kind: 'OB.UI.ButtonKey'
                }]
              }]
            }, {
              tag: 'div',
              classes: 'row-fluid',
              components: [{
                tag: 'div',
                classes: 'span12',
                components: [{
                  kind: 'OB.UI.ButtonKey'
                }]
              }]
            }, {
              tag: 'div',
              classes: 'row-fluid',
              components: [{
                tag: 'div',
                classes: 'span12',
                components: [{
                  kind: 'OB.UI.ButtonKey'
                }]
              }]
            }, {
              tag: 'div',
              classes: 'row-fluid',
              components: [{
                tag: 'div',
                classes: 'span12',
                components: [{
                  kind: 'OB.UI.ButtonKey'
                }]
              }]
            }]
          }, {
            // right toolbar for ticket discounts
            tag: 'div',
            name: 'ticketDiscountsToolbar',
            components: [{
              tag: 'div',
              classes: 'row-fluid',
              components: [{
                tag: 'div',
                classes: 'span6',
                components: [{
                  kind: 'OB.UI.ButtonKey'
                }]
              }, {
                tag: 'div',
                classes: 'span6',
                components: [{
                  kind: 'OB.UI.ButtonKey'
                }]
              }]
            }, {
              tag: 'div',
              classes: 'row-fluid',
              components: [{
                tag: 'div',
                classes: 'span12',
                components: [{
                  kind: 'OB.UI.ButtonKey'
                }]
              }]
            }, {
              tag: 'div',
              classes: 'row-fluid',
              components: [{
                tag: 'div',
                classes: 'span12',
                components: [{
                  kind: 'OB.UI.ButtonKey'
                }]
              }]
            }, {
              tag: 'div',
              classes: 'row-fluid',
              components: [{
                tag: 'div',
                classes: 'span12',
                components: [{
                  kind: 'OB.UI.ButtonKey',
                  label: OB.I18N.getLabel('OBPOS_KbDiscount'),
                  permission: 'OBPOS_retail.advDiscounts',
                  command: 'ticket:discount'
                }]
              }]
            }]
          }, {
            tag: 'div',
            classes: 'row-fluid',
            components: [{
              tag: 'div',
              classes: 'span12',
              components: [{
                kind: 'OB.UI.ButtonKey',
                classButton: 'btn-icon btn-icon-enter',
                command: 'OK'
              }]
            }]
          }]
        }]
      }]
    }]
  }],

  events: {
    onCommandFired: '',
    onStatusChanged: '',
    onHoldActiveCmd: ''
  },

  handlers: {
    onGlobalKeydown: 'globalKeydownHandler',
    onGlobalKeypress: 'globalKeypressHandler',
    onCommandFired: 'commandHandler',
    onRegisterButton: 'registerButton',
    onKeyboardDisabled: 'keyboardDisabled'
  },
  isEnabled: true,

  isPhysicalKeyboardAllowed: function (inEvent) {
    var tagName, targetId = 'x',
        focusKeeperId = 'y';
    if (inEvent && inEvent.target && inEvent.target.tagName) {
      tagName = inEvent.target.tagName;
    }
    if (inEvent.target && inEvent.target.id) {
      targetId = inEvent.target.id;
    }
    if (OB.POS.terminal.$.focusKeeper && OB.POS.terminal.$.focusKeeper.id) {
      focusKeeperId = OB.POS.terminal.$.focusKeeper.id;
    }

    if (inEvent.altGraphKey || inEvent.altKey || inEvent.ctrlKey) {
      return false;
    } else if (OB.POS.terminal && (OB.POS.terminal.openedPopup || OB.POS.terminal.openedSubwindow)) {
      return false;
    } else if ((tagName === 'INPUT' && targetId !== focusKeeperId) || tagName === 'SELECT' || tagName === 'TEXTAREA') {
      return false;
    } else {
      return true;
    }
  },
  keyboardDisabled: function (inSender, inEvent) {
    if (inEvent.status) {
      _.each(this.buttons, function (btn) {
        if (!btn.hasClass('btnkeyboard-inactive')) {
          btn.setDisabled(true);
          btn.addClass('btnkeyboard-inactive');
        }
      });
      this.isEnabled = false;
    } else {
      _.each(this.buttons, function (btn) {
        if (btn.disabled) {
          btn.setDisabled(false);
          btn.removeClass('btnkeyboard-inactive');
        }
      });
      this.isEnabled = true;
    }
  },

  globalKeydownHandler: function (inSender, inEvent) {
    var keyCode = inEvent.keyboardEvent.keyCode;
    if (!this.isPhysicalKeyboardAllowed(inEvent.keyboardEvent)) {
      return;
    }
    if (keyCode === 8) { //Handle BACKSPACE key
      OB.POS.terminal.$.focusKeeper.focus(); //Hack to avoid event propagation and result in a browser "go back" shortcut
      this.writeCharacter('del');
    } else if (OB.Format.defaultDecimalSymbol !== '.') {
      if (keyCode === 110) { //Handle numeric keypad dot (.)
        this.writeCharacter(OB.Format.defaultDecimalSymbol);
      } else if (keyCode === 190) { //Handle keyboard dot (.) character
        this.writeCharacter('.');
      }
    }
  },

  globalKeypressHandler: function (inSender, inEvent) {
    var which = inEvent.keyboardEvent.which,
        actualStatus = null;
    if (!this.isPhysicalKeyboardAllowed(inEvent.keyboardEvent)) {
      return;
    }
    if (which === 13 && this.$.editbox.getContent()) { //Handle ENTER key if there is something in the display
      actualStatus = this.getStatus();
      if (this.$.editbox.getContent() === '0') {
        this.doCommandFired({
          key: "OK"
        });
      } else if (actualStatus) {
        this.execCommand(actualStatus, this.getString());
      } else {
        OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_NoDefaultActionDefined'));
      }
    } else if (which === 43 || which === 45) { //Handle + and - keys
      this.doCommandFired({
        key: String.fromCharCode(which)
      });
    } else if (which !== 46 || OB.Format.defaultDecimalSymbol === '.') { //Handle any keypress except any kind of dot (.)
      this.writeCharacter(String.fromCharCode(which));
    }
  },

  virtualKeypressHandler: function (key, options) {
    var t;
    if (options && options.fromPopup) {
      this.waterfall('onCloseAllPopups');
    }
    if (key.match(/^([0-9]|\.|,| |[a-z]|[A-Z])$/) || (key === 'del')) {
      this.writeCharacter(key);
    } else {
      this.doCommandFired({
        key: key
      });
    }
  },

  writeCharacter: function (character) {
    var t;
    if (character.match(/^([0-9]|\.|,| |[a-z]|[A-Z])$/) && this.isEnabled) {
      t = this.$.editbox.getContent();
      this.$.editbox.setContent(t + character);
    } else if (character === 'del') {
      t = this.$.editbox.getContent();
      if (t.length > 0) {
        this.$.editbox.setContent(t.substring(0, t.length - 1));
      }
    }
  },

  setStatus: function (newstatus) {
    var btn = this.buttons[this.status];

    if (btn && (btn.classButtonActive || (btn.owner && btn.owner.classButtonActive))) {
      btn.removeClass(btn.classButtonActive || btn.owner.classButtonActive);
    }
    this.status = newstatus;

    // sending the event to the components bellow this one
    this.waterfall('onStatusChanged', {
      status: newstatus
    });
    // sending the event to the components above this one
    this.doStatusChanged({
      payment: OB.POS.terminal.terminal.paymentnames[this.status],
      status: this.status
    });

    // set the right keypad by default
    if (this.namedkeypads[this.status]) {
      this.showKeypad(this.namedkeypads[this.status]);
    } else {
      this.showKeypad('basic');
    }

    btn = this.buttons[this.status];
    if (btn && (btn.classButtonActive || (btn.owner && btn.owner.classButtonActive))) {
      btn.addClass(btn.classButtonActive || btn.owner.classButtonActive);
    }
  },

  getStatus: function () {
    //returns the current status of the keyboard. If the keyboard doesn't have any status then
    //the function returns the default action for the keyboard.
    if (this.status) {
      if (this.status === "") {
        return this.defaultcommand;
      } else {
        return this.status;
      }
    }
    return this.defaultcommand;
  },

  execCommand: function (cmd, txt) {
    var cmddefinition = this.commands[cmd];
    if (!cmddefinition.permission || OB.POS.modelterminal.hasPermission(cmddefinition.permission)) {
      cmddefinition.action(this, txt);
    }
  },

  execStatelessCommand: function (cmd, txt) {
    this.commands[cmd].action(this, txt);
  },

  getNumber: function () {
    return OB.I18N.parseNumber(this.getString());
  },

  getString: function () {
    var s = this.$.editbox.getContent();
    this.$.editbox.setContent('');
    return s;
  },

  clear: function () {
    this.$.editbox.setContent('');
    this.setStatus('');
  },

  commandHandler: function (inSender, inEvent) {
    var txt, me = this,
        cmd = inEvent.key;

    if (cmd === 'OK') {
      txt = this.getString();

      if (txt === '0' && this.status === '') {
        OB.POS.lock();
      }

      if (txt && this.status === '') {
        if (this.defaultcommand) {
          this.execCommand(this.defaultcommand, txt);
        } else {
          OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_NoDefaultActionDefined'));
        }
      } else if (txt && this.status !== '') {
        this.execCommand(this.status, txt);
        if (this.buttons[this.status] && !this.buttons[this.status].owner.holdActive) {
          this.setStatus('');
        }
      }
    } else if (this.commands[cmd]) {
      txt = this.getString();
      if (this.commands[cmd].stateless) {
        // Stateless commands: add, subs, ...
        this.execStatelessCommand(cmd, txt);
      } else {
        // Statefull commands: quantity, price, discounts, payments ...
        if (txt && this.status === '') { // Short cut: type + action
          this.execCommand(cmd, txt);
        } else if (this.status === cmd && txt) {
          this.execCommand(cmd, txt);
        } else if (this.status === cmd) { // Reset status
          this.setStatus('');
        } else {
          this.setStatus(cmd);
        }
      }
      if (this.buttons[cmd] && this.buttons[cmd].owner.holdActive) {
        this.doHoldActiveCmd({
          cmd: cmd
        });
      }
    } else {
      OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_NoActionDefined'));
    }
  },

  registerButton: function (inSender, inEvent) {
    var me = this,
        button = inEvent.originator;
    if (button.command) {
      if (button.definition) {
        this.addCommand(button.command, button.definition);
      }
      if (button.command === '---') {
        // It is the null command
        button.command = false;
      } else if (!button.command.match(/^([0-9]|\.|,|[a-z])$/) && button.command !== 'OK' && button.command !== 'del' && button.command !== String.fromCharCode(13) && !this.commands[button.command]) {
        // is not a key and does not exists the command
        button.command = false;
      } else if (button.permission && !OB.POS.modelterminal.hasPermission(button.permission)) {
        // does not have permissions.
        button.command = false;
      }
    }

    if (button.command) {
      button.$.button.tap = function () {
        if (button && button.definition && button.definition.includedInPopUp) {
          me.virtualKeypressHandler(button.command, {
            fromPopup: button.definition.includedInPopUp
          });
        } else {
          me.virtualKeypressHandler(button.command);
        }

      };

      this.addButton(button.command, button.$.button);
    } else {
      button.$.button.addClass('btnkeyboard-inactive');
    }
  },

  initComponents: function () {
    var me = this;
    this.buttons = {}; // must be intialized before calling super, not after.
    this.activekeypads = [];
    this.namedkeypads = {};

    this.inherited(arguments);
    this.state = new Backbone.Model();


    this.$.toolbarcontainer.destroyComponents();
    this.$.keypadcontainer.destroyComponents();

    this.showSidepad('sidedisabled');

    if (this.sideBarEnabled) {
      this.$.sideenabled.show();
      this.$.sidedisabled.hide();
      this.$.ticketDiscountsToolbar.hide();
    } else {
      this.$.ticketDiscountsToolbar.hide();
      this.$.sideenabled.hide();
      this.$.sidedisabled.show();
    }

    this.addKeypad('OB.UI.KeypadBasic');
    this.showKeypad('basic');
  },

  addToolbar: function (newToolbar) {
    var toolbar = this.$.toolbarcontainer.createComponent({
      toolbarName: newToolbar.name,
      shown: newToolbar.shown,
      keboard: this
    });

    var emptyBtn = {
      kind: 'OB.UI.BtnSide',
      btn: {}
    },
        i = 0;

    enyo.forEach(newToolbar.buttons, function (btnDef) {
      if (btnDef.command) {
        toolbar.createComponent({
          kind: 'OB.UI.BtnSide',
          btn: btnDef
        });
      } else {
        toolbar.createComponent(emptyBtn);
      }
      i++;
    }, this);


    // populate toolbar up to 6 empty buttons
    for (; i < 6; i++) {
      toolbar.createComponent(emptyBtn);
    }
  },

  addToolbarComponent: function (newToolbar) {
    this.$.toolbarcontainer.createComponent({
      kind: newToolbar,
      keyboard: this
    });
  },

  showToolbar: function (toolbarName) {
    this.show();
    enyo.forEach(this.$.toolbarcontainer.getComponents(), function (toolbar) {
      if (toolbar.toolbarName === toolbarName) {
        toolbar.show();
        if (toolbar.shown) {
          toolbar.shown();
        }
      } else {
        toolbar.hide();
      }
    }, this);
  },

  addCommand: function (cmd, definition) {
    this.commands[cmd] = definition;
  },

  addButton: function (cmd, btn) {
    if (this.buttons[cmd]) {
      if (this.buttons[cmd].add) {
        this.buttons[cmd] = this.buttons[cmd].add(btn);
      }
    } else {
      this.buttons[cmd] = btn;
    }
  },

  addKeypad: function (keypad) {

    var keypadconstructor = enyo.constructorForKind(keypad);
    this.activekeypads.push(keypadconstructor.prototype.padName);
    if (keypadconstructor.prototype.padPayment) {
      this.namedkeypads[keypadconstructor.prototype.padPayment] = keypadconstructor.prototype.padName;
    }

    this.$.keypadcontainer.createComponent({
      kind: keypad,
      keyboard: this
    }).render().hide();
  },

  showKeypad: function (keypadName) {
    var firstLabel = null,
        foundLabel = false,
        existsLabel = false;

    enyo.forEach(this.$.keypadcontainer.getComponents(), function (pad) {
      if (!firstLabel) {
        firstLabel = pad.label;
      } else if (foundLabel) {
        this.state.set('keypadNextLabel', pad.label);
        foundLabel = false;
      }
      if (pad.padName === keypadName) {
        this.state.set('keypadName', keypadName);
        foundLabel = true;
        existsLabel = true;
        pad.show();
        // Set the right payment status. If needed.
        if (pad.padPayment && this.status !== pad.padPayment) {
          this.setStatus(pad.padPayment);
        }
      } else {
        pad.hide();
      }
    }, this);
    if (foundLabel) {
      this.state.set('keypadNextLabel', firstLabel);
    }

    // if keypadName does not exists show the 'basic' panel that always exists
    if (!existsLabel) {
      this.showKeypad('basic');
    }
  },

  showNextKeypad: function () {
    var i, max, current = this.state.get('keypadName'),
        pad;

    for (i = 0, max = this.activekeypads.length; i < max; i++) {
      if (this.activekeypads[i] === current) {
        this.showKeypad(i < this.activekeypads.length - 1 ? this.activekeypads[i + 1] : this.activekeypads[0]);
        break;
      }
    }
  },

  showSidepad: function (sidepadname) {
    this.$.sideenabled.hide();
    this.$.sidedisabled.hide();
    this.$.ticketDiscountsToolbar.hide();
    this.$[sidepadname].show();
  }
});

enyo.kind({
  name: 'OB.UI.BtnSide',
  style: 'display:table; width:100%',
  initComponents: function () {
    this.createComponent({
      kind: 'OB.UI.ButtonKey',
      label: this.btn.label,
      command: this.btn.command,
      permission: this.btn.permission,
      definition: this.btn.definition,
      classButtonActive: this.btn.classButtonActive || 'btnactive-green',
      holdActive: this.btn.holdActive
    });
  }
});
