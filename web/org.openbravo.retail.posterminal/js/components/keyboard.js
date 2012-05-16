/*global define,$,_,Backbone */

define(['builder', 'utilities', 'arithmetic', 'i18n', 'model/order', 'model/terminal', 'components/table'], function (B) {
  
  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};
  
  var parseNumber = function (s) {
    return OB.DEC.number(parseFloat(s, 10));
  };  
  
  var BtnAction = function (kb) {    
    var Btn = function (context) {
      this.context = context;
      this.component = B(
        {kind: B.KindJQuery('div'), attr: {'style': 'margin: 5px;'}, content: [
        ]}
      );
      this.$el = this.component.$el;
    };
    
    Btn.prototype.attr = function (attr) {
      var me = this;
      var cmd = attr.command;      
      if (attr.command === '---') {
        this.command = false;
      } else if (attr.permission && !OB.POS.modelterminal.hasPermission(attr.permission)) {
        this.command = false;
      } else { 
        this.command = attr.command;
      }
      
      if (this.command) {
        this.button = B({kind: B.KindJQuery('a'), id: 'button', attr: {'href': '#', 'class': 'btnkeyboard'}, init: function () {           
            this.$el.click(function(e) {          
              e.preventDefault();
              kb.keyPressed(me.command);  
            });                
          }}).$el;   
        kb.addButton(this.command, this.button);
      } else {
        this.button = B({kind: B.KindJQuery('div'), id: 'button', attr: {'class': 'btnkeyboard'}}).$el;        
      }
      this.$el.append(this.button);   
    };
    
    Btn.prototype.append = function (child) {
      if (child.$el) {
        this.button.append(child.$el);
      }
    };
    
    Btn.prototype.inithandler = function (init) {
      if (init) {
        init.call(this);
      }
    };     
    return Btn;
  };

  OB.COMP.Keyboard = function (context) {    
    var me = this;
    this._id = 'keyboard';  
    
    this.status = '';
    this.commands = {}; 
    this.buttons = {};
    
    this.addCommand('line:qty', {              
      'action': function (txt) {
        if (this.line) {
          this.receipt.setUnit(this.line, parseNumber(txt)); 
          this.receipt.trigger('scan');
        }                
      }
    });
    this.addCommand('line:price', {              
      'permission': 'order.changePrice',
      'action': function (txt) {
        if (this.line) {
          this.receipt.setPrice(this.line, parseNumber(txt)); 
          this.receipt.trigger('scan');
        }               
      }
    });    
    this.addCommand('line:dto', {              
      'permission': 'order.discount',
      'action': function (txt) {
        if (this.line) {
           this.receipt.trigger('discount', this.line,parseNumber(txt));
        }               
      }
    });    
    this.addCommand('code', {
      'action': function (txt) {
        var me = this;
        this.products.ds.find({
          priceListVersion: OB.POS.modelterminal.get('pricelistversion').id,
          product: { product: {uPCEAN: txt}}
        }, function (data) {
          if (data) {      
            me.receipt.addProduct(me.line, new Backbone.Model(data));
            me.receipt.trigger('scan');
          } else {
            alert(OB.I18N.getLabel('OBPOS_KbUPCEANCodeNotFound', [txt])); // 'UPC/EAN code not found'
          }
        });        
      }
    });
    
    this.component = B(
      {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
        {kind: B.KindJQuery('div'), id: 'toolbarcontainer', attr: {'class': 'span5'}, content: [          
          {kind: B.KindJQuery('div'), id: 'toolbarempty', attr: {'style': 'display:block;'}, content: [                                                                            
            {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
              {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [                                                                                                 
                {kind: BtnAction(this), attr: {'command': 'code'}, content: [OB.I18N.getLabel('OBPOS_KbCode')]}
              ]}          
            ]},
            {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
              {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [                                                                                                 
                {kind: BtnAction(this), attr: {'command': '---'}, content: [{kind: B.KindHTML('<span>&nbsp;</span>')}]}
              ]}          
            ]},
            {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
              {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [                                                                                                 
                {kind: BtnAction(this), attr: {'command': '---'}, content: [{kind: B.KindHTML('<span>&nbsp;</span>')}]}
              ]}          
            ]},
            {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
              {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [                                                                                                 
                {kind: BtnAction(this), attr: {'command': '---'}, content: [{kind: B.KindHTML('<span>&nbsp;</span>')}]}
              ]}          
            ]},
            {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
              {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [                                                                                                 
                {kind: BtnAction(this), attr: {'command': '---'}, content: [{kind: B.KindHTML('<span>&nbsp;</span>')}]}
              ]}          
            ]},
            {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
              {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [                                                                                                 
                {kind: BtnAction(this), attr: {'command': '---'}, content: [{kind: B.KindHTML('<span>&nbsp;</span>')}]}
              ]}          
            ]}               
          ]}          
        ]},   
        
        {kind: B.KindJQuery('div'), attr: {'class': 'span7'}, content: [ 
          {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
            {kind: B.KindJQuery('div'), attr: {'class': 'span8'}, content: [ 
              {kind: B.KindJQuery('div'), attr: {'style': 'margin:5px'}, content: [ 
                {kind: B.KindJQuery('div'), attr: {'style': 'text-align: right; width: 100%; height: 40px;'}, content: [ 
                  {kind: B.KindJQuery('pre'), attr: {'style': 'font-size:150%;'}, content: [ 
                    ' ', {kind: B.KindJQuery('span'), id: 'editbox'}
                  ]}
                ]}
              ]}
            ]},
            {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [ 
              {kind: BtnAction(this), attr: {'command': 'del'}, content: [
                {kind: B.KindJQuery('i'), attr:{'class': 'icon-chevron-left'}}
              ]}
            ]}              
          ]},
          {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
            {kind: B.KindJQuery('div'), attr: {'class': 'span8'}, content: [     
              {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                  {kind: BtnAction(this), attr: {'command': '/'}, content: ['/']}                                                                            
                ]},
                {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                  {kind: BtnAction(this), attr: {'command': '*'}, content: ['*']}                                                                            
                ]},     
                {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                  {kind: BtnAction(this), attr: {'command': '%'}, content: ['%']}                                                                            
                ]}           
              ]},
              {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                  {kind: BtnAction(this), attr: {'command': '7'}, content: ['7']}                                                                            
                ]},
                {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                  {kind: BtnAction(this), attr: {'command': '8'}, content: ['8']}                                                                            
                ]},
                {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                  {kind: BtnAction(this), attr: {'command': '9'}, content: ['9']}                                                                            
                ]}     
              ]},
              {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                  {kind: BtnAction(this), attr: {'command': '4'}, content: ['4']}                                                                            
                ]},
                {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                  {kind: BtnAction(this), attr: {'command': '5'}, content: ['5']}                                                                            
                ]},
                {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                  {kind: BtnAction(this), attr: {'command': '6'}, content: ['6']}                                                                            
                ]}    
              ]},
              {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                  {kind: BtnAction(this), attr: {'command': '1'}, content: ['1']}                                                                            
                ]},
                {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                  {kind: BtnAction(this), attr: {'command': '2'}, content: ['2']}                                                                            
                ]},
                {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                  {kind: BtnAction(this), attr: {'command': '3'}, content: ['3']}                                                                            
                ]}    
              ]},           
              {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                {kind: B.KindJQuery('div'), attr: {'class': 'span8'}, content: [
                  {kind: BtnAction(this), attr: {'command': '0'}, content: ['0']}                                                                            
                ]},
                {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                  {kind: BtnAction(this), attr: {'command': '.'}, content: ['.']}                                                                            
                ]}   
              ]}
            ]},
            {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [    
              {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                {kind: B.KindJQuery('div'), attr: {'class': 'span6'}, content: [
                  {kind: BtnAction(this), attr: {'command': '-'}, content: ['-']}                                                                            
                ]},     
                {kind: B.KindJQuery('div'), attr: {'class': 'span6'}, content: [
                  {kind: BtnAction(this), attr: {'command': '+'}, content: ['+']}                                                                            
                ]}     
              ]},                                                                              
              {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [
                  {kind: BtnAction(this), attr: {'command': 'line:qty'}, content: [OB.I18N.getLabel('OBPOS_KbQuantity')]}                                                                            
                ]}     
              ]},
              {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [
                  {kind: BtnAction(this), attr: {'command': 'line:price', 'permission': 'order.changePrice'}, content: [OB.I18N.getLabel('OBPOS_KbPrice')]}                                                                            
                ]}     
              ]},
              {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [
                  {kind: BtnAction(this), attr: {'command': 'line:dto', 'permission': 'order.discount'}, content: [OB.I18N.getLabel('OBPOS_KbDiscount')]}                                                                            
                ]}     
              ]},
              {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [
                  {kind: BtnAction(this), attr: {'command': 'OK'}, content: [
                    {kind: B.KindJQuery('i'), attr:{'class': 'icon-ok'}}                                                                                      
                  ]}                                                                            
                ]}     
              ]}                    
            ]}                
          ]}             
        ]}       
      ]}                                                                                                                               
    );
    
    this.$el = this.component.$el;
    this.editbox =  this.component.context.editbox.$el; 
    this.toolbarcontainer = this.component.context.toolbarcontainer.$el;
    this.toolbars = {
        toolbarempty : this.component.context.toolbarempty.$el
    };
    
    this.products = context.DataProductPrice;
    this.receipt = context.modelorder;
    this.line = null;
    
    this.receipt.get('lines').on('selected', function (line) {
      this.line = line;
      this.clear();
    }, this);  
    
    this.on('command', function(cmd) {
      var txt;
      var me = this;      
      if (cmd === '-') {
        if (this.line) {
          this.receipt.removeUnit(this.line, this.getNumber());     
          this.receipt.trigger('scan');
        }
      } else if (cmd === '+') {
        if (this.line) {
          this.receipt.addUnit(this.line, this.getNumber());    
          this.receipt.trigger('scan');
        }
      } else if (this.editbox.text() && cmd === String.fromCharCode(13) ) {
        // Barcode read using an scanner or typed in the keyboard...
        this.execCommand(this.commands.code, this.getString());
      } else if (cmd === 'OK') {
        
        // Accepting a command
        txt = this.getString();
        
        if (txt && this.status === '') {
          // It is a barcode
          this.execCommand(this.commands.code, txt);
        } else if (txt && this.status !=='') {
          this.execCommand(this.commands[this.status], txt);         
          this.setStatus('');
        }
        
      } else {
        
        // do nothing if it is a line command and no line is selected, or if does not exists the command.
        if ((cmd.substring(0, 5) !== 'line:' || this.line) && this.commands[cmd]) {
          txt = this.getString();
          
          if (txt && this.status === '') { // Short cut: type + action
            this.execCommand(this.commands[cmd], txt);
          } else if (this.status === cmd) { // Reset status 
            this.setStatus('');     
          } else {
            this.setStatus(cmd);   
          }       
        }        
      }
    }, this);       

    $(window).keypress(function(e) {
      me.keyPressed(String.fromCharCode(e.which));
    });     
  }; 
  _.extend(OB.COMP.Keyboard.prototype, Backbone.Events);
  
  OB.COMP.Keyboard.prototype.setStatus = function (newstatus) {
    if (this.buttons[this.status]) {
      this.buttons[this.status].removeClass('btnactive');
    }
    this.status = newstatus;
    if (this.buttons[this.status]) {
      this.buttons[this.status].addClass('btnactive');
    }         
  };
  
  OB.COMP.Keyboard.prototype.execCommand = function (cmddefinition, txt) {
      if (!cmddefinition.permissions || OB.POS.modelterminal.hasPermission(cmddefinition.permissions)) {
        cmddefinition.action.call(this, txt);
      }    
  };
  
  OB.COMP.Keyboard.prototype.attr = function (attrs) { 
    var attr,i, max, value, content;
    
    for (attr in attrs) {
      if (attrs.hasOwnProperty(attr)) {
        value = attrs[attr];
        content = [];
        for (i = 0, max = value.length; i < max; i++) {
          // add the command
          if (value[i].definition) {
            this.addCommand(value[i].command, value[i].definition);
          }
          // add the button
          content.push({kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
            {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [                                                                                                 
              {kind: BtnAction(this), attr: {'command': value[i].command, 'permission': (value[i].definition ? value[i].definition.permission : null)}, content: [value[i].label]}
            ]}          
          ]});
        }

        this.toolbars[attr] = B({kind: B.KindJQuery('div'), attr:{'style': 'display:none;'},content: content}).$el;        
        this.toolbarcontainer.append(this.toolbars[attr]);
      }
    }          
  };
  
  OB.COMP.Keyboard.prototype.addCommand = function(cmd, definition) {
    this.commands[cmd] = definition;
  };
  
  OB.COMP.Keyboard.prototype.addButton = function(cmd, btn) {
    if (this.buttons[cmd]) {
      this.buttons[cmd] = this.buttons[cmd].add(btn);
    } else {
      this.buttons[cmd] = btn;
    }    
  };  
  
  OB.COMP.Keyboard.prototype.clear = function () {
      this.editbox.empty();  
      this.setStatus(''); 
  };
  
  OB.COMP.Keyboard.prototype.show = function (toolbar) {
    var t;
    this.clear();
    if (toolbar) {
      for (t in this.toolbars) {
        if (this.toolbars.hasOwnProperty(t)) {
          this.toolbars[t].hide();  
        }
      }
      this.toolbars[toolbar].show();
    }
    this.$el.show();      
  };
  
  OB.COMP.Keyboard.prototype.hide = function () {
      this.$el.hide();    
  };
  
  OB.COMP.Keyboard.prototype.getNumber = function () {
    var i = parseNumber(this.editbox.text());
    this.editbox.empty();
    return i;
  };
  
  OB.COMP.Keyboard.prototype.getString = function () {
    var s = this.editbox.text();
    this.editbox.empty();
    return s;
  };  
  
  OB.COMP.Keyboard.prototype.keyPressed = function (key) {

    var t;
    if (key.match(/^([0-9]|\.|[a-z])$/)) {
      t = this.editbox.text();
      this.editbox.text(t + key);
    } else if (key === 'del') {
      t = this.editbox.text();
      if (t.length > 0) {
        this.editbox.text(t.substring(0, t.length - 1));
      }
    } else {
      this.trigger('command', key);
    }
  }; 
  
  // Method of the function...
  OB.COMP.Keyboard.getPayment = function (payment) {
    return ({
      'permission': payment,
      'action': function (txt) {
        this.receipt.addPayment(new OB.MODEL.PaymentLine(
          {
            'kind': payment, 
            'amount': parseNumber(txt)
          }));
      }
    });
  };     
});