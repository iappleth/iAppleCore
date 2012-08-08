/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global window, B, $, Backbone, _, MBP */

(function() {

  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  enyo.kind({
    name: 'OB.UI.Button',
    kind: 'enyo.Button',
    handlers: {
      onmouseover: 'mouseOverOut',
      onmouseout: 'mouseOverOut'
    },
    //TODO: implement fast buttons
    //TODO: support windows 7  setTimeout(function() { me.$el.removeClass('btn-down'); }, 125);
    mouseOverOut: function(sender, event) {

      this.addRemoveClass('btn-over', event.type === 'mouseover');
    }
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
    classes: 'btnlink-gray modal-dialog-content-button'
  });

  enyo.kind({
    name: 'OB.UI.Modal',
    tag: 'div',
    classes: 'modal hide fade',
    style: 'display: none;',
    components: [{
      tag: 'div',
      classes: 'modal-header',
      components: [{
        tag: 'a',
        classes: 'close',
        attributes: {
          'data-dismiss': 'modal'
        },
        components: [{
          tag: 'span',
          style: 'font-size: 150%',
          content: 'x' //TODO: '&times;'
        }]
      }, {
        tag: 'h3',
        name: 'divheader'
      }],
    }, {
      tag: 'div',
      name: 'body',
      classes: 'modal-header'
    }],
    //TODO: maxheight: null,
    initComponents: function() {
      this.inherited(arguments);
      if (this.modalClass) {
        this.addClass(this.modalClass);
      }

      this.$.divheader.setContent(this.header);

      if (this.bodyClass) {
        this.$.body.addClass(this.bodyClass);
      }
      this.$.body.createComponent(this.body);

      //TODO: OB.UTIL.adjustModalPosition(this.$el);
      //TODO: OB.UTIL.focusInModal(this.$el);
    },

    makeId: function() {
      return this.myId || this.inherited(arguments);
    }
  });

  enyo.kind({
    name: 'OB.UI.RenderEmpty',
    style: 'border-bottom: 1px solid #cccccc; padding: 20px; text-align: center; font-weight: bold; font-size: 30px; color: #cccccc',
    initComponents: function() {
      this.inherited(arguments);
      this.setContent(this.label || OB.I18N.getLabel('OBPOS_SearchNoResults'));
    }
  });


  enyo.kind({
    name: 'OB.UI.SelectButton',
    kind: 'OB.UI.Button',
    classes: 'btnselect',

    tap: function() {
      this.model.trigger('selected', this.model);
      this.model.trigger('click', this.model);
      $('#' + this.id).parents('.modal').filter(':first').modal('hide')
    }
  });

  enyo.kind({
    name: 'OB.UI.CancelButton',
    kind: 'OB.UI.SmallButton',
    classes: 'btnlink-white btnlink-fontgray',
    attributes: {
      href: '#modalCancel',
      'data-toggle': 'modal'
    },
    initComponents: function() {
      this.inherited(arguments);
      this.setContent(this.label || OB.I18N.getLabel('OBPOS_LblCancel'));
    }
  });

  // Base button: Implemented as enyo: OB.UI.Button
  OB.COMP.Button = Backbone.View.extend({
    tagName: 'button',
    attr: function(attributes) {
      if (attributes.label) {
        this.label = attributes.label;
      }
      if (attributes.style) {
        this.$el.attr('style', attributes.style);
      }
      if (attributes.clickEvent) {
        this.clickEvent = attributes.clickEvent;
      }
      if (attributes.icon) {
        this.icon = attributes.icon;
      }
      if (attributes.iconright) {
        this.iconright = attributes.iconright;
      }
      if (attributes.href) {
        this.href = attributes.href;
      }
      if (attributes.dataToggle) {
        this.dataToggle = attributes.dataToggle;
      }
      if (attributes.className) {
        this.$el.addClass(attributes.className);
      }
    },
    initialize: function() {
      var fb;

      this.$el.mouseover(_.bind(this._mouseOverEvent, this));
      this.$el.mouseout(_.bind(this._mouseOutEvent, this));
      this.$el.mousedown(_.bind(this._mouseDownEvent, this));

      // data-toggle is used by Bootstrap plugins, like: dropdown, tab, etc
      // we fall back to default 'slow' click event
      if ((navigator.userAgent.toLowerCase().indexOf('windows nt') !== -1) || (this.attributes && (this.attributes['data-toggle'] || this.attributes['data-dismiss']))) {
        this.$el.click(_.bind(this._clickEvent, this));
      } else {
        fb = new MBP.fastButton(this.el, _.bind(this._clickEvent, this));
      }
    },
    _clickEvent: function(e) {
      this.$el.removeClass('btn-over');
      this.clickEvent(e);
    },
    _mouseOverEvent: function(e) {
      this.$el.addClass('btn-over');
      this.mouseOverEvent(e);
    },
    _mouseOutEvent: function(e) {
      this.$el.removeClass('btn-over');
      this.mouseOutEvent(e);
    },
    _mouseDownEvent: function(e) {
      var me = this;
      if (navigator.userAgent.toLowerCase().indexOf('windows nt') !== -1) {
        this.$el.addClass('btn-down');
        setTimeout(function() {
          me.$el.removeClass('btn-down');
        }, 125);
      }
      this.mouseOutEvent(e);
    },
    clickEvent: function(e) {},
    mouseOverEvent: function(e) {},
    mouseOutEvent: function(e) {},
    mouseDownEvent: function(e) {}
  });

  // Regular Button
  OB.COMP.RegularButton = OB.COMP.Button.extend({
    render: function() {
      this.$el.addClass('btnlink');
      if (this.href) {
        this.$el.attr('href', this.href);
      }
      if (this.dataToggle) {
        this.$el.attr('data-toggle', this.dataToggle);
      }
      if (this.icon) {
        this.$el.append($('<div class=\"' + this.icon + '\"></div>'));
      }
      this.$el.append($('<span>' + this.label + '</span>'));
      if (this.iconright) {
        this.$el.append($('<div class=\"' + this.iconright + '\"></div>'));
      }
      return this;
    },
    icon: '',
    iconright: '',
    label: ''
  });

  // Regular Button
  OB.COMP.SmallButton = OB.COMP.RegularButton.extend({
    render: function() {
      OB.COMP.RegularButton.prototype.render.call(this); // super.initialize();
      this.$el.addClass('btnlink-small');
      return this;
    },
    icon: '',
    iconright: '',
    label: ''
  });

  // Modal Dialog Button
  OB.COMP.ModalDialogButton = OB.COMP.RegularButton.extend({
    render: function() {
      OB.COMP.RegularButton.prototype.render.call(this); // super.initialize();
      this.$el.addClass('btnlink-gray modal-dialog-content-button');
      return this;
    }
  });

  // Toolbar Button
  enyo.kind({
    name: 'OB.UI.ToolbarButton',
    kind: 'OB.UI.RegularButton',
    classes: 'btnlink-toolbar',
    initComponents: function() {
      this.inherited(arguments);
      if (this.icon) {
        this.addClass(this.icon);
      }
    }
  });

  //  // Toolbar Button
  OB.COMP.ToolbarButton = OB.COMP.RegularButton.extend({
    render: function() {
      OB.COMP.RegularButton.prototype.render.call(this); // super.initialize();
      this.$el.addClass('btnlink-toolbar');
      return this;
    }
  });

  enyo.kind({
    name: 'OB.UI.CheckboxButton',
    tag: 'button',
    classes: 'btn-check',
    checked: false,
    tap: function() {
      this.checked = !this.checked;
      this.addRemoveClass('active', this.checked);
    }

  });

  // Checkbox Button: OB.UI.CheckboxButton
  OB.COMP.CheckboxButton = Backbone.View.extend({
    tagName: 'button',
    attributes: {
      'class': 'btn-check'
    },
    initialize: function() {
      this.$el.click(_.bind(this._clickEvent, this));
    },
    attr: function(attributes) {
      if (attributes.className) {
        this.$el.addClass(attributes.className);
      }
      if (attributes.id) {
        this.$el.attr('id', attributes.id);
      }
    },
    _clickEvent: function(e) {
      this.$el.toggleClass('active');
      this.clickEvent(e);
    },
    clickEvent: function(e) {}
  });

  // Radio Button
  OB.COMP.RadioButton = Backbone.View.extend({
    tagName: 'button',
    className: 'btn',
    initialize: function() {
      this.$el.click(_.bind(this._clickEvent, this));
    },
    append: function(child) {
      if (child.render) {
        this.$el.append(child.render().$el); // it is a backbone view.
      } else if (child.$el) {
        this.$el.append(child.$el);
      }
    },
    attr: function(attributes) {
      if (attributes.className) {
        this.$el.addClass(attributes.className);
      }
      if (attributes.id) {
        this.$el.attr('id', attributes.id);
      }
    },
    render: function() {
      this.$el.addClass('btn-radio');
      this.$el.attr('style', 'padding: 0px 0px 0px 40px; margin: 10px;');
      return this;
    },
    _clickEvent: function(e) {
      this.clickEvent(e);
    },
    clickEvent: function(e) {}
  });

  // Order list
  enyo.kind({
    kind: 'OB.UI.Button',
    name: 'OB.UI.ButtonTab',
    attributes: {
      'data-toggle': 'tab'
    },
    classes: 'btnlink btnlink-gray',
    tabPanel: '#',
    initComponents: function() {
      this.inherited(arguments);
      this.setAttribute('href', this.tabPanel);
      if (this.label) {
        this.createComponent({
          name: 'lbl',
          tag: 'span',
          content: this.label
        })
      }
      //TODO
      //this.receipt.on('change:gross', function() {
      //  this.render();
      //}, this)
    }
  });

  // refactored using enyo -> OB.UI.ButtonTab
  // Generic Tab Button
  OB.COMP.ButtonTab = OB.COMP.Button.extend({
    className: 'btnlink btnlink-gray',
    attributes: {
      'data-toggle': 'tab'
    },
    initialize: function() {
      OB.COMP.Button.prototype.initialize.call(this); // super.initialize();
      this.$el.attr('href', this.tabpanel);
      this.$el.append($('<span>' + this.label + '</span>'));
    },
    tabpanel: '#',
    label: '',
    events: {
      'shown': 'shownEvent' // attach the click event as part of the element
    },
    shownEvent: function(e) {
      // custom bootstrap event, no need to prevent default
    }
  });

  // Order list
  enyo.kind({
    name: 'OB.UI.ToolbarButtonTab',
    kind: 'OB.UI.ButtonTab',
    attributes: {
      'data-toggle': 'tab'
    },
    tap: function() {
      //TODO
      //OB.COMP.ButtonTab.prototype.clickEvent.call(this); // super.initialize();
      OB.UTIL.setOrderLineInEditMode(false);
    },
    initComponents: function() {
      this.inherited(arguments);
      this.addClass('btnlink-toolbar');
    },
  });


  // refactored using enyo -> OB.UI.ToolbarButtonTab
  // Toolbar Tab Button
  OB.COMP.ToolbarButtonTab = OB.COMP.ButtonTab.extend({
    render: function() {
      OB.COMP.ButtonTab.prototype.render.call(this); // super.initialize();
      this.$el.addClass('btnlink-toolbar');
      return this;
    },
    clickEvent: function() {
      OB.COMP.ButtonTab.prototype.clickEvent.call(this); // super.initialize();
      OB.UTIL.setOrderLineInEditMode(false);
    }
  });

  // Menu Button
  // Toolbar Button
  enyo.kind({
    name: 'OB.UI.ToolbarMenuButton',
    kind: 'OB.UI.ToolbarButton',
    attributes: {
      'data-toggle': 'dropdown'
    }
  });

  OB.COMP.ToolbarMenuButton = OB.COMP.ToolbarButton.extend({
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
      }],
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
      }, this)
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

  OB.COMP.ToolbarMenu = Backbone.View.extend({
    tagName: 'div',
    className: 'dropdown',
    attributes: {
      'style': 'display: inline-block; width: 100%;'
    },
    initialize: function() {
      this.button = new OB.COMP.ToolbarMenuButton().render().$el;

      // The button
      this.$el.append(this.button);
      if (this.icon) {
        this.button.append($('<div class=\"' + this.icon + '\"></i>'));
      }
      this.button.append($('<span>' + this.label + ' </span>'));
      if (this.iconright) {
        this.button.append($('<div class=\"' + this.iconright + '\"></i>'));
      }

      this.menu = $('<ul class=\"dropdown-menu\"></ul>');
      this.$el.append(this.menu);
    },
    append: function(child) {
      if (child.$el) {
        this.menu.append(child.$el);
      }
    },
    icon: '',
    iconright: '',
    label: ''
  });

  // Select Div
  OB.COMP.SelectPanel = Backbone.View.extend({
    tagName: 'div',
    className: 'btnselect',
    initialize: function() {
      this.model = this.options.model;
      OB.UTIL.initContentView(this);
    }
  });

  // Select Button
  // refactored with enyo: OB.UI.SelectButton
  OB.COMP.SelectButton = OB.COMP.Button.extend({
    className: 'btnselect',
    initialize: function() {
      OB.COMP.Button.prototype.initialize.call(this); // super.initialize();
      this.model = this.options.model;
      OB.UTIL.initContentView(this);
    },
    clickEvent: function(e) {
      this.model.trigger('selected', this.model);
      this.model.trigger('click', this.model);
      this.$el.parents('.modal').filter(':first').modal('hide'); // If in a modal dialog, close it
    }
  });


  // refactored using enyo: OB.UI.RenderEmpty
  OB.COMP.RenderEmpty = Backbone.View.extend({
    tagName: 'div',
    attributes: {
      'style': 'border-bottom: 1px solid #cccccc; padding: 20px; text-align: center; font-weight: bold; font-size: 30px; color: #cccccc'
    },
    render: function() {
      this.$el.text(this.label || OB.I18N.getLabel('OBPOS_SearchNoResults'));
      return this;
    }
  });

  enyo.kind({
    name: 'OB.UI.MenuSeparator',
    tag: 'li',
    classes: 'divider'
  });

  OB.COMP.MenuSeparator = Backbone.View.extend({
    tagName: 'li',
    className: 'divider'
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
      if (!OB.POS.modelterminal.hasPermission(this.permission)) {
        this.$.item.setStyle('color: #cccccc; padding-bottom: 10px;padding-left: 15px; padding-right: 15px;padding-top: 10px;');
      }
    },
    tap: function() {
      // TODO: check online for required windows
      if (!OB.POS.modelterminal.hasPermission(this.permission)) {
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

  OB.COMP.MenuItem = Backbone.View.extend({
    tagName: 'li',
    initialize: function() {
      var opts = this.options,
          me = this;

      if (this.permission && !OB.POS.modelterminal.hasPermission(this.permission)) {
        // disabled entry
        this.$el.append($('<div/>').attr('style', 'color: #cccccc; padding-bottom: 10px;padding-left: 15px; padding-right: 15px;padding-top: 10px;').append($('<span/>').text(this.label)));
      } else {
        //    	  var a = this.$el.append($('<a/>')).attr('style', 'padding-bottom: 10px;padding-left: 15px; padding-right: 15px;padding-top: 10px;').attr('href', '#');
        //    	  //debugger;
        //    	  a.append($('<span/>').text(this.label));
        //    	  a.click(function (e) {
        //            var $el = $(this);
        //  console.log('click');
        //              e.preventDefault();
        //              if (OB.POS.modelterminal.get('connectedToERP')) {
        //                OB.UTIL.showLoading(true);
        //                OB.POS.navigate(me.href);
        //              } else {
        //                alert(OB.I18N.getLabel('OBPOS_OnlineRequiredFunctionality'));
        //              }
        //          });
        var id;
        if (me.href === '../..') id = 'aa';
        else id = me.href.replace('.', '');
        this.$el.append($('<a/>').attr('id', id).attr('style', 'padding-bottom: 10px;padding-left: 15px; padding-right: 15px;padding-top: 10px;').attr('href', '#').append($('<span/>').text(this.label)));
        console.log(me.target, me.href, this.$el.find('#' + id));
        // debugger;
        this.$el.find('#' + id).click(function(e) {
          console.log('click');
          var $el = $(this);

          e.preventDefault();
          if (OB.POS.modelterminal.get('connectedToERP')) {
            OB.UTIL.showLoading(true);
            OB.POS.navigate(me.href);
          } else {
            alert(OB.I18N.getLabel('OBPOS_OnlineRequiredFunctionality'));
          }
        });




      }
    },
    href: '',
    target: '_self',
    label: ''
  });

  //refactored with enyo: OB.UI.MenuAction
  OB.COMP.MenuAction = Backbone.View.extend({
    tagName: 'li',
    initialize: function() {
      this.$anchor = $('<a/>').attr('style', 'padding: 12px 15px 12px 15px;').attr('href', '#').append($('<span/>').text(this.label));
      this.$el.click(_.bind(this._clickEvent, this));
      this.$el.append(this.$anchor);
    },
    _clickEvent: function(e) {
      e.preventDefault();
      this.clickEvent(e);
    },
    label: '',
    clickEvent: function(e) {}
  });

  enyo.kind({
    tag: 'li',
    name: 'OB.UI.MenuAction',
    components: [{
      name: 'lbl',
      tag: 'a',
      style: 'padding: 12px 15px 12px 15px;',
      attributes: {
        href: '#'
      },
    }],
    initComponents: function() {
      this.inherited(arguments);
      this.$.lbl.setContent(this.label);
    }
  });


  // refactored with enyo: OB.UI.Modal
  OB.COMP.Modal = Backbone.View.extend({
    tagName: 'div',
    className: 'modal hide fade',
    attributes: {
      'style': 'display: none;'
    },
    contentView: [{
      tag: 'div',
      attributes: {
        'class': 'modal-header'
      },
      content: [{
        tag: 'a',
        attributes: {
          'class': 'close',
          'data-dismiss': 'modal'
        },
        content: [{
          tag: 'span',
          attributes: {
            style: 'font-size: 150%;'
          },
          content: '&times;'
        }]
      }, {
        id: 'divheader',
        tag: 'h3'
      }]
    }, {
      id: 'body',
      tag: 'div',
      attributes: {
        'class': 'modal-header'
      }
    }],
    maxheight: null,
    initialize: function() {
      OB.UTIL.initContentView(this);

      this.divheader.text(this.header);
      if (this.maxheight) {
        this.body.css('max-height', this.maxheight);
      }

      var getcv = this.getContentView();
      if (getcv.kind) {
        // it is a builder structure
        this.contentview = B(getcv, this.options);
      } else {
        // it is a backbone view
        this.contentview = new getcv(this.options).render();
      }
      this.body.append(this.contentview.$el);

      OB.UTIL.adjustModalPosition(this.$el);
      OB.UTIL.focusInModal(this.$el);
    },
    events: {
      'show': 'showEvent',
      // attach the click event as part of the element
      'hide': 'hideEvent'
    },
    showEvent: function(e) {
      // custom bootstrap event, no need to prevent default
    },
    hideEvent: function(e) {
      // custom bootstrap event, no need to prevent default
    }
  });

  // reimplemented with enyo: OB.UI.ModalAction
  OB.COMP.ModalAction = Backbone.View.extend({
    tagName: 'div',
    className: 'modal hide fade modal-dialog',
    attributes: {
      'style': 'display: none;'
    },
    width: null,
    maxheight: null,
    bodyContentClass: 'modal-dialog-content-text',
    bodyButtonsClass: 'modal-dialog-content-buttons-container',
    initialize: function() {
      if (this.width) {
        this.$el.css('width', this.width);
      }

      this.$el.append(B({
        kind: B.KindJQuery('div'),
        attr: {
          'class': 'modal-header modal-dialog-header'
        },
        content: [{
          kind: B.KindJQuery('a'),
          attr: {
            'class': 'close',
            'data-dismiss': 'modal'
          },
          content: [{
            kind: B.KindHTML('<span style=\"font-size: 150%;\">&times;</span>')
          }]
        }, {
          kind: B.KindJQuery('h3'),
          attr: {
            'class': 'modal-dialog-header-text'
          },
          content: [this.header]
        }]
      }, this.options).$el);
      var body = $('<div/>').addClass('modal-body').addClass('modal-dialog-body');
      if (this.maxheight) {
        body.css('max-height', this.maxheight);
      }

      var bodyContentContainer = $('<div/>').addClass(this.bodyContentClass);
      if (this.setBodyContent) {
        var bodyContent = this.setBodyContent();
        var theBodyContent;
        if (bodyContent.kind) {
          // it is a builder structure
          theBodyContent = B(bodyContent, this.options);
        } else {
          // it is a backbone view
          theBodyContent = new bodyContent(this.options).render();
        }
        bodyContentContainer.append(theBodyContent.$el);
      }

      var bodyButtonsContainer = $('<div/>').addClass(this.bodyButtonsClass);
      if (this.setBodyButtons) {
        var bodyButtons = this.setBodyButtons();
        var theBodyButtons;
        if (bodyButtons.kind) {
          // it is a builder structure
          theBodyButtons = B(bodyButtons, this.options);
        } else {
          // it is a backbone view
          theBodyButtons = new bodyButtons(this.options).render();
        }
        bodyButtonsContainer.append(theBodyButtons.$el);
      }
      body.append(bodyContentContainer);
      body.append(bodyButtonsContainer);

      this.$el.append(body);

      OB.UTIL.adjustModalPosition(this.$el);
      OB.UTIL.focusInModal(this.$el);
    },
    events: {
      'show': 'showEvent' // attach the click event as part of the element
    },
    showEvent: function(e) {
      // custom bootstrap event, no need to prevent default
    }
  });

  enyo.kind({
    //TODO: maxheight, 
    //OB.UTIL.adjustModalPosition(this.$el); 
    //OB.UTIL.focusInModal(this.$el);
    // x -> &times;
    name: 'OB.UI.ModalAction',
    tag: 'div',
    classes: 'modal hide fade modal-dialog',
    style: 'display:none',
    bodyContentClass: 'modal-dialog-content-text',
    bodyButtonsClass: 'modal-dialog-content-buttons-container',
    components: [{
      tag: 'div',
      classes: 'modal-header modal-dialog-header',
      components: [{
        tag: 'a',
        classes: 'close',
        attributes: {
          'data-dismiss': 'modal'
        },
        components: [{
          tag: 'span',
          style: 'font-size: 150%',
          content: 'x'
        }]
      }, {
        name: 'header',
        tag: 'h3',
        classes: 'modal-dialog-header-text',
      }, {
        tag: 'div',
        classes: 'modal-body modal-dialog-body',
        components: [{
          tag: 'div',
          name: 'bodyContent'
        }, {
          tag: 'div',
          name: 'bodyButtons'
        }]
      }]
    }],

    initComponents: function() {
      console.log('initComponents modalAction')
      this.inherited(arguments);
      this.$.header.setContent(this.header);

      this.$.bodyContent.setClasses(this.bodyContentClass);
      this.$.bodyContent.createComponent(this.bodyContent);

      this.$.bodyButtons.setClasses(this.bodyButtonsClass);
      this.$.bodyButtons.createComponent(this.bodyButtons);
    },
    makeId: function() {
      return this.myId || this.inherited(arguments);
    }
  });

  OB.COMP.CustomView = Backbone.View.extend({
    initialize: function() {
      this.component = B(this.createView(), this.options);
      this.setElement(this.component.$el);
      OB.POS.modelterminal.trigger('window:ready', this);
    },
    createView: function() {
      return ({
        kind: B.KindJQuery('div')
      });
    }
  });

  enyo.kind({
	 name: 'OB.UI.SearchInput',
	 kind: 'enyo.Input',
  });
  
  OB.COMP.SearchInput = Backbone.View.extend({
    tagName: 'input',
    attr: function(attributes) {
      if (attributes.clickEvent) {
        this.clickEvent = attributes.clickEvent;
      }
      if (attributes.xWebkitSpeech) {
        this.$el.attr('x-webkit-speech', attributes.xWebkitSpeech);
      }
      if (attributes.type) {
        this.$el.attr('type', attributes.type);
      }
      if (attributes.style) {
        this.$el.attr('style', attributes.style);
      }
      if (attributes.className) {
        this.$el.addClass(attributes.className);
      }
    },
    initialize: function() {
      this.$el.keypress(_.bind(this._clickEvent, this));
      // new googleuiFastButton(this.el, this._clickEvent);
    },
    _clickEvent: function(e) {
      this.clickEvent(e);
    },
    clickEvent: function(e) {}
  });

}());