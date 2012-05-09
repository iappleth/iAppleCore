/*global define */


define(['builder', 'i18n',
        'data/datamaster', 'data/dataordersave', 'data/dataordertaxes',
        'model/terminal', 'model/order',
        'components/hwmanager', 
        'components/searchproducts', 'components/searchbps', 'components/listreceipts', 'components/scan', 'components/editline', 'components/order', 
        'components/total', 'components/orderdetails', 'components/businesspartner', 'components/listreceiptscounter', 'components/payment', 'components/keyboard',
        'components/listcategories', 'components/listproducts'
        ], function (B) {
  

  return function () {

    return (
      {kind: B.KindJQuery('section'), content: [
        
        {kind: OB.MODEL.Order},
        {kind: OB.MODEL.OrderList}, 
        
        {kind: OB.DATA.Container, content: [
          {kind: OB.DATA.BPs},
          {kind: OB.DATA.ProductPrice},
          {kind: OB.DATA.Category},      
          {kind: OB.DATA.TaxRate},               
          {kind: OB.COMP.HWManager, attr: { 'templateline': 'res/printline.xml', 'templatereceipt': 'res/printreceipt.xml'}}
        ]},    
               
        {kind: OB.DATA.OrderTaxes},
        {kind: OB.DATA.OrderSave},
        
        {kind: B.KindJQuery('div'), attr: {'id': 'modalcustomer', 'class': 'modal hide fade', 'style': 'display: none;'}, content: [
          {kind: B.KindJQuery('div'), attr: {'class': 'modal-header'}, content: [
            {kind: B.KindJQuery('a'), attr: {'class': 'close', 'data-dismiss': 'modal'}, content: [ 
              {kind: B.KindHTML('<span>&times;</span>')}
            ]},
            {kind: B.KindJQuery('h3'), content: [OB.I18N.getLabel('OBPOS_LblAssignCustomer')]}
          ]},
          {kind: B.KindJQuery('div'), attr: {'class': 'modal-body'}, content: [
            {kind: OB.COMP.SearchBP, attr: {
              renderLine: function (model) {
                return (
                  {kind: B.KindJQuery('div'), attr: {'href': '#', 'class': 'btnselect'}, content: [                                                                                   
                    {kind: B.KindJQuery('div'), content: [ 
                      model.get('BusinessPartner')._identifier
                    ]},                                                                                                                                                                     
                    {kind: B.KindJQuery('div'), attr:{'style': 'color: #888888'}, content: [ 
                      model.get('BusinessPartnerLocation')._identifier
                    ]},                                                                                                                                                                     
                    {kind: B.KindJQuery('div'), attr: {style: 'clear: both;'}}                                                                                     
                  ]}
                );                    
              }
            }} 
          ]}      
        ], init: function () {
          
          this.context.SearchBPs.bps.on('click', function (model, index) {
            this.$.modal('hide');
          }, this);
        }},
        {kind: B.KindJQuery('div'), attr: {'id': 'modalreceipts', 'class': 'modal hide fade', 'style': 'display: none;'}, content: [
          {kind: B.KindJQuery('div'), attr: {'class': 'modal-header'}, content: [
            {kind: B.KindJQuery('a'), attr: {'class': 'close', 'data-dismiss': 'modal'}, content: [ 
              {kind: B.KindHTML('<span>&times;</span>')}
            ]},
            {kind: B.KindJQuery('h3'), content: [OB.I18N.getLabel('OBPOS_LblAssignReceipt')]}
          ]},
          {kind: B.KindJQuery('div'), attr: {'class': 'modal-body'}, content: [
            {kind: OB.COMP.ListReceipts, attr: {
              renderLine: function (model) {
                return (
                  {kind: B.KindJQuery('a'), attr: {'href': '#', 'class': 'btnselect'}, content: [                                                                                                                                                                        
                    {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 15%;'}, content: [ 
                       OB.I18N.formatHour(model.get('orderDate'))
                    ]},                                                                                      
                    {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 15%;'}, content: [ 
                      model.get('documentNo')
                    ]}, 
                    {kind: B.KindJQuery('div'), attr: {style: 'float: left;width: 50%;'}, content: [ 
                      model.get('bp').get('_identifier')
                    ]}, 
                    {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 20%; text-align:right;'}, content: [ 
                      {kind: B.KindJQuery('strong'), content: [ 
                         model.printNet()                                                                                                                             
                      ]}                                                                                                                                                                                                                                 
                    ]},              
                    {kind: B.KindJQuery('div'), attr: {style: 'clear: both;'}}                                                                                     
                  ]}
                );
              }
            }} 
          ]}      
        ], init: function () {
          var context = this.context;
            this.$.on('show', function () {
              context.modelorderlist.saveCurrent();
            });  
            this.context.ListReceipts.receiptlist.on('click', function (model, index) {
              this.$.modal('hide');
            }, this);            
        }},        

        {kind: B.KindJQuery('div'), attr: {'class': 'row'}, content: [
          {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [ 
            {kind: B.KindJQuery('a'), attr: {'class': 'btnlink', 'href': '#'}, content: [
              {kind: B.KindJQuery('i'), attr: {'class': 'icon-asterisk  icon-white'}}, OB.I18N.getLabel('OBPOS_LblNew')
            ], init: function () {
                var me = this;
                me.$.click(function (e) {
                  e.preventDefault();
                  me.context.modelorderlist.addNewOrder();
                });
            }},
            {kind: B.KindJQuery('a'), attr: {'class': 'btnlink', 'href': '#'}, content: [
              {kind: B.KindJQuery('i'), attr: {'class': 'icon-trash  icon-white'}}, OB.I18N.getLabel('OBPOS_LblDelete')
            ], init: function () {
                var me = this;
                me.$.click(function (e) {
                  e.preventDefault();
                  if (window.confirm(OB.I18N.getLabel('OBPOS_MsgConfirmDelete'))) {
                    me.context.modelorderlist.deleteCurrent();
                  }
                });
            }},            
            {kind: B.KindJQuery('a'), attr: {'class': 'btnlink', 'href': '#'}, content: [
              {kind: B.KindJQuery('i'), attr: {'class': 'icon-print  icon-white'}}, OB.I18N.getLabel('OBPOS_LblPrint')
            ], init: function () {
                var me = this;
                me.$.click(function (e) {
                  e.preventDefault();
                  me.context.modelorder.trigger('print');
                });  
            }},                                                                                         
                            
            {kind: B.KindJQuery('ul'), attr: {'class': 'unstyled nav-pos'}, content: [     
              {kind: B.KindJQuery('li'), content: [
                {kind: B.KindJQuery('a'), attr: {'id': 'paylink', 'class': 'btnlink btnlink-gray', 'data-toggle': 'tab', 'href': '#payment'}, content: [
                  {kind: B.KindJQuery('div'), attr: {'style': 'text-align: right; width:100px;'}, content: [
                    {kind: B.KindJQuery('span'), attr: {'style': 'font-weight: bold'}, content: [
                      {kind: OB.COMP.Total}
                    ]},                    
                    {kind: B.KindJQuery('span'), content: [
                      OB.I18N.getLabel('OBPOS_LblPay')
                    ]}
                  ]}
                ], init: function () {
                  var context = this.context;
                  this.$.on('shown', function () {
                    context.keyboard.show('toolbarpayment');
                  });
                }}        
              ]},
              {kind: B.KindJQuery('li'), content: [
                {kind: B.KindJQuery('a'), attr: {'id': 'cataloglink', 'class': 'btnlink btnlink-gray', 'data-toggle': 'tab', 'href': '#catalog'}, content: [
                  OB.I18N.getLabel('OBPOS_LblBrowse')
                ], init: function () { 
                  var context = this.context;
                  this.$.on('shown', function () {
                    context.keyboard.hide();
                  });                            
                }} 
              ]},
              {kind: B.KindJQuery('li'), content: [
                {kind: B.KindJQuery('a'), attr: {'id': 'searchlink', 'class': 'btnlink btnlink-gray', 'data-toggle': 'tab', 'href': '#search'}, content: [
                  OB.I18N.getLabel('OBPOS_LblSearch')
                ], init: function () {  
                  var context = this.context;
                  this.$.on('shown', function () {
                    context.keyboard.hide();
                  });
                }}        
              ]},
              {kind: B.KindJQuery('li'), content: [
                {kind: B.KindJQuery('a'), attr: {'id': 'scanlink', 'class': 'btnlink btnlink-gray', 'data-toggle': 'tab', 'href': '#scan'}, content: [
                  OB.I18N.getLabel('OBPOS_LblScan')
                ], init: function () {
                  var context = this.context;
                  this.$.on('shown', function () {
                    context.keyboard.show('toolbarempty');
                  });
                  this.context.modelorder.on('clear scan', function() {
                    this.$.tab('show');                         
                  }, this);   
                  this.context.SearchBPs.bps.on('click', function (model, index) {
                    this.$.tab('show');
                  }, this);                  
                }}        
              ]},
              {kind: B.KindJQuery('li'), content: [
                {kind: B.KindJQuery('a'), attr: {'id': 'editionlink', 'class': 'btnlink btnlink-gray', 'data-toggle': 'tab', 'href': '#edition', 'style': 'text-shadow:none;'}, content: [
                  OB.I18N.getLabel('OBPOS_LblEdit')
                ], init: function () {
                  var context = this.context;
                  this.$.on('shown', function () {
                    context.keyboard.show('toolbarempty');
                  });
                  
                  this.context.modelorder.get('lines').on('click', function () {
                    this.$.tab('show');
                  }, this);                        
                }}
              ]}            
            ]}                                                                                  
          ]}
        ]},

        {kind: B.KindJQuery('div'), attr: {'class': 'row'}, content: [
                                                                                                                                  
          {kind: B.KindJQuery('div'), attr: {'class': 'span5'}, content: [
            {kind: B.KindJQuery('div'), attr: {'style': 'overflow:auto; height: 500px; margin: 5px'}, content: [                                                                           
              {kind: B.KindJQuery('div'), attr: {'style': 'background-color: #ffffff; color: black; padding: 5px;'}, content: [
                {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                  {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [                                                                                                                                             
                    {kind: B.KindJQuery('div'), attr: {'style': 'padding: 10px; border-bottom: 1px solid #cccccc;'}, content: [   
                        {kind: B.KindJQuery('a'), attr: {'class': 'btnlink btnlink-small btnlink-gray', 'href': '#'}, content: [                                                                                                                                
                          {kind: OB.COMP.OrderDetails}
                        ]},                                                                                                                          
                        {kind: B.KindJQuery('a'), attr: {'class': 'btnlink btnlink-small btnlink-gray', 'href': '#modalcustomer', 'data-toggle': 'modal'}, content: [                                                                                                                                
                          {kind: OB.COMP.BusinessPartner}
                        ]},
                        {kind: B.KindJQuery('div'), attr: {'style': 'float:right'}, content: [                                                                                                                                
                          {kind: B.KindJQuery('a'), attr: {'class': 'btnlink btnlink-small btnlink-gray', 'href': '#modalreceipts', 'data-toggle': 'modal'}, content: [                                                                                                                                
                            {kind: OB.COMP.ReceiptsCounter}
                          ]}
                        ]},                        
                        {kind: B.KindJQuery('div'), attr: {'style': 'clear:both;'}} 
                    ]}
                  ]}                                                              
                ]},
                {kind: OB.COMP.OrderView, attr: {
                  renderLine: function (model) {
                    return (
                      {kind: B.KindJQuery('a'), attr: {'href': '#', 'class': 'btnselect'}, content: [
                        {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 40%'}, content: [ 
                          model.get('product').get('product')._identifier                                                                
                        ]},                                                                                      
                        {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 20%; text-align:right;'}, content: [ 
                          model.printQty()                                                                                                                                                          
                        ]},                                                                                      
                        {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 20%; text-align:right;'}, content: [                                                                                        
                          model.printPrice()                                                             
                        ]},                                                                                      
                        {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 20%; text-align:right;'}, content: [                                                                                        
                          model.printNet()
                        ]},
                        {kind: B.KindJQuery('div'), attr: {style: 'clear: both;'}}                                                                                     
                      ]}
                    );         
                  }                 
                }}                    
              ]}                                                              
            ]}  
          ]},          

          {kind: B.KindJQuery('div'), attr: {'class': 'span7'}, content: [
            {kind: B.KindJQuery('div'), attr: {'class': 'tab-content'}, content: [
              {kind: B.KindJQuery('div'), attr: {'id': 'scan', 'class': 'tab-pane'}, content: [
                {kind: OB.COMP.Scan }                                                                      
              ]}, 
              {kind: B.KindJQuery('div'), attr: {'id': 'catalog', 'class': 'tab-pane'}, content: [
                {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                  {kind: B.KindJQuery('div'), attr: {'class': 'span6'}, content: [ 
                    {kind: B.KindJQuery('div'), attr: {style: 'overflow:auto; height: 500px; margin: 5px;'}, content: [                                                                                      
                      {kind: B.KindJQuery('div'), attr: {'style': 'background-color: #ffffff; color: black; padding: 5px'}, content: [                                                                        
                        {kind: OB.COMP.ListProducts, attr: {
                          renderLine: function (model) {
                            return (
                              {kind: B.KindJQuery('a'), attr: {'href': '#', 'class': 'btnselect'}, content: [
                                {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 20%'}, content: [ 
                                  {kind: OB.UTIL.Thumbnail, attr: {img: model.get('img')}}
                                ]},                                                                                      
                                {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 60%;'}, content: [ 
                                  model.get('product')._identifier
                                ]},                                                                                      
                                {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 20%; text-align:right;'}, content: [ 
                                  {kind: B.KindJQuery('strong'), content: [ 
                                    OB.I18N.formatCurrency(model.get('price').listPrice)                                                                                                                                         
                                  ]}                                                                                                                                                                                                                                 
                                ]},                                                                                      
                                {kind: B.KindJQuery('div'), attr: {style: 'clear: both;'}}                                                                                     
                              ]}
                            );                    
                          }                          
                        }}
                      ]}        
                    ]}        
                  ]},                                                                                    
                  {kind: B.KindJQuery('div'), attr: {'class': 'span6'}, content: [ 
                    {kind: B.KindJQuery('div'), attr: {style: 'overflow:auto; height: 500px; margin: 5px;'}, content: [                                                                                      
                      {kind: B.KindJQuery('div'), attr: {'style': 'background-color: #ffffff; color: black; padding: 5px'}, content: [                                                                             
                        {kind: OB.COMP.ListCategories, attr:{
                          renderLine:function (model) {
                            return (
                              {kind: B.KindJQuery('a'), attr: {'href': '#', 'class': 'btnselect'}, content: [
                                {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 20%'}, content: [ 
                                  {kind: OB.UTIL.Thumbnail, attr: {img: model.get('img')}}
                                ]},                                                                                      
                                {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 80%;'}, content: [ 
                                  model.get('category')._identifier                                                                                                                                               
                                ]},                                                                                      
                                {kind: B.KindJQuery('div'), attr: {style: 'clear: both;'}}                                                                                     
                              ]}
                            );               
                          }
                        }}
                      ]}        
                    ]}        
                  ]}
                ]}                                                                   
              ], init: function () {
                this.context.ListCategories.categories.on('selected', function (category) {
                  this.context.ListProducts.loadCategory(category);
                }, this);                   
              }},  
              {kind: B.KindJQuery('div'), attr: {'id': 'search', 'class': 'tab-pane'}, content: [
                {kind: B.KindJQuery('div'), attr: {style: 'overflow:auto; height: 500px; margin: 5px;'}, content: [                                                                                      
                  {kind: B.KindJQuery('div'), attr: {'style': 'background-color: #ffffff; color: black; padding: 5px'}, content: [                                                                                                       
                    {kind: OB.COMP.SearchProduct, attr: {
                      renderLine: function (model) {
                        return (
                          {kind: B.KindJQuery('a'), attr: {'href': '#', 'class': 'btnselect'}, content: [
                            {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 20%'}, content: [ 
                              {kind: OB.UTIL.Thumbnail, attr: {img: model.get('img')}}
                            ]},                                                                                      
                            {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 60%;'}, content: [ 
                              model.get('product')._identifier
                            ]},                                                                                      
                            {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 20%; text-align:right;'}, content: [ 
                              {kind: B.KindJQuery('strong'), content: [ 
                                 model.get('price') ?                       
                                OB.I18N.formatCurrency(model.get('price').listPrice)                : ''                                                                                                                             
                              ]}                                                                                                                                                                                                                                 
                            ]},                                                                                      
                            {kind: B.KindJQuery('div'), attr: {style: 'clear: both;'}}                                                                                     
                          ]}
                        );                    
                      }                                                  
                    }} 
                  ]}        
                ]}                                                                      
              ]},  
              {kind: B.KindJQuery('div'), attr: {'id': 'edition', 'class': 'tab-pane'}, content: [
                {kind: OB.COMP.EditLine }                                                                      
              ]},       
              {kind: B.KindJQuery('div'), attr: {'id': 'payment', 'class': 'tab-pane'}, content: [
                {kind: OB.COMP.Payment, attr: {'cashcoins': [
                  {amount:50, classcolor: 'btnlink-lightblue'},
                  {amount:20, classcolor: 'btnlink-lightpink'},
                  {amount:10, classcolor: 'btnlink-lightgreen'},
                  {amount:5, classcolor: 'btnlink-wheat'},
                  {amount:1, classcolor: 'btnlink-lightgreen'},
                  {amount:0.50, classcolor: 'btnlink-orange'},
                  {amount:0.20, classcolor: 'btnlink-gray'},
                  {amount:0.10, classcolor: 'btnlink-lightblue'},
                  {amount:0.05, classcolor: 'btnlink-lightpink'}
                ]}}                                                                      
              ]}             
            ]},
            {kind: OB.COMP.Keyboard, attr: {toolbarpayment: [ 
              {command:'paym:payment.cash', label: OB.I18N.getLabel('OBPOS_KbCash')},
              {command:'paym:payment.card', label: OB.I18N.getLabel('OBPOS_KbCard')},
              {command:'paym:payment.voucher', label: OB.I18N.getLabel('OBPOS_KbVoucher')},
              {command:'---', label: {kind: B.KindHTML('<span>&nbsp;</span>')}},
              {command:'---', label: {kind: B.KindHTML('<span>&nbsp;</span>')}},
              {command:'---', label: {kind: B.KindHTML('<span>&nbsp;</span>')}}
            ]}}
          ]}        
        ]}

        
      ], init: function () {
        this.context.on('domready', function () {
          this.context.modelorderlist.addNewOrder();
        }, this);
      }}
    );           
  };
});