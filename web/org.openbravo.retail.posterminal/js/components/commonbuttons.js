/*global window, define, $, Backbone, _ */

define(['builder', 'utilities', 'i18n', 'model/order', 'model/terminal'], function (B) {
  
  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};
  
  // Base button
  OB.COMP.Button = Backbone.View.extend({
    tagName: 'button',
    initialize: function () { 
      this.$el.click(_.bind(this._clickEvent, this));
      // new googleuiFastButton(this.el, this._clickEvent);     
    },
    _clickEvent: function (e) {
      this.clickEvent(e);
    },
    clickEvent: function (e) {
    }      
  });
  
  // Clears the text of the previous field
  OB.COMP.ClearButton = OB.COMP.Button.extend({
    render: function () {
      this.$el.addClass('btnclear');
      this.$el.html('&times;');
      return this;
    },
    clickEvent: function (e) {
      // clears the text of the previous field.
      this.$el.prev().val('');
    }       
  });    
  
  // Toolbar Button
  OB.COMP.ToolbarButton = OB.COMP.Button.extend({
    render: function () {
      this.$el.addClass('btnlink');
      if (this.icon) {
        this.$el.append($('<i class=\"' + this.icon + '\"></i>'));
      }
      this.$el.append($('<span>' + this.label + '</span>'));     
      if (this.iconright) {
        this.$el.append($('<i class=\"' + this.iconright + '\"></i>'));
      }
      return this;
    },
    icon: '',
    iconright: '',
    label: ''      
  });
  
  // Select Div
  OB.COMP.SelectPanel = Backbone.View.extend({
    tagName: 'div',
    className: 'btnselect',
    initialize: function () {
      this.model = this.options.model;  
    }
  });    
  
  // Select Button
  OB.COMP.SelectButton = OB.COMP.Button.extend({
    className: 'btnselect',
    initialize: function () { 
      OB.COMP.Button.prototype.initialize.call(this); // super.initialize();
      this.model = this.options.model;  
    },    
    clickEvent: function (e) {
      this.model.trigger('selected', this.model);
      this.model.trigger('click', this.model);
      this.$el.parents('.modal').filter(':first').modal('hide'); // If in a modal dialog, close it          
    }
  });  
 
  // Menu Button
  OB.COMP.MenuButton = Backbone.View.extend({
    tagName: 'div',
    className: 'dropdown',
    attributes: {'style': 'display:inline-block;'},
    initialize: function () {
      this.button = $('<a href=\"#\" class=\"btnlink\" data-toggle=\"dropdown\"></a>'); 
      
      // The button
      this.$el.append(this.button);      
      if (this.icon) {
        this.button.append($('<i class=\"' + this.icon + '\"></i>'));
      }
      this.button.append($('<span>' + this.label + ' </span>'));     
      if (this.iconright) {
        this.button.append($('<i class=\"' + this.iconright + '\"></i>'));
      }  
      this.button.append($('<span class=\"caret\"></span>'));
      
      this.menu = $('<ul class=\"dropdown-menu\"></ul>');     
      this.$el.append(this.menu);
    },    
    append: function (child) {
      if (child.render) {
        this.menu.append(child.render().$el); // it is a backbone view.
      } else if (child.$el) {
        this.menu.append(child.$el);
      }      
    },
    icon: '',
    iconright: '',
    label: ''    
  });  
    
  OB.COMP.MenuSeparator = Backbone.View.extend({
    tagName: 'li',
    className: 'divider'
  });
  
  OB.COMP.MenuItem = Backbone.View.extend({
    tagName: 'li',
    initialize: function () {
      this.$el.append($('<a/>').attr('style', 'padding-bottom: 10px;padding-left: 15px; padding-right: 15px;padding-top: 10px;').attr('href', this.href).append($('<span/>').text(this.label)));
    },
    href: '',
    label: ''
  });     

  // Generic Tab Button
  OB.COMP.ButtonTab = Backbone.View.extend({
    tagName: 'a',
    className: 'btnlink btnlink-gray',
    attributes: {'data-toggle': 'tab'},
    initialize: function () {
      this.$el.attr('href', this.tabpanel);
      this.$el.append($('<span>' + this.label + '</span>'));      
    },
    tabpanel: '#',
    label: '',
    events: {
      'shown': 'shownEvent' // attach the click event as part of the element
    },
    shownEvent: function (e) {
      // custom bootstrap event, no need to prevent default
    }       
  });
     
  OB.COMP.Modal = Backbone.View.extend({
    tagName: 'div',
    className: 'modal hide fade',
    attributes: {'style': 'display: none;'},    
    initialize: function () {
      this.$el.append(B(
          {kind: B.KindJQuery('div'), attr: {'class': 'modal-header'}, content: [
            {kind: B.KindJQuery('a'), attr: {'class': 'close', 'style':'padding:5px;', 'data-dismiss': 'modal'}, content: [ 
              {kind: B.KindHTML('<span style=\"font-size: 150%;\">&times;</span>')}
            ]},
            {kind: B.KindJQuery('h3'), content: [this.header]}
          ]}      
      , this.options).$el);
      this.$el.append(B(
          {kind: B.KindJQuery('div'), attr: {'class': 'modal-body'}, content: [
            this.getContentView()
          ]}   
      , this.options).$el);                  
    },
    events: {
      'show': 'showEvent' // attach the click event as part of the element
    },
    showEvent: function (e) {
      // custom bootstrap event, no need to prevent default
    }    
  });  
  
  OB.COMP.CustomView = Backbone.View.extend({
    initialize: function () {
      this.component = B(this.createView(), this.options);      
      this.setElement(this.component.$el);
    },
    createView: function () {
      return ({kind: B.KindJQuery('div')});
    }
  });  

});    