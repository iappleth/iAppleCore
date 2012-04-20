/*global define, $ */


define(['builder', 'i18n',
        'data/datamaster', 'data/dataorder',
        'model/terminal', 'model/order', 'model/productprice',
        'components/hwmanager', 
        'components/searchproducts', 'components/searchbps', 'components/listreceipts', 'components/scan', 'components/editline', 'components/order', 
        'components/total', 'components/businesspartner', 'components/listreceiptscounter', 'components/payment', 'components/keyboard',
        'components/listcategories', 'components/listproducts'
        ], function (B) {
  

  return function () {
  
    return ( 
        
      {kind: B.KindJQuery('section'), content: [  
             

        {kind: B.KindJQuery('div'), attr: {'class': 'row'}, content: [
          {kind: B.KindJQuery('div'), attr: {'class': 'span6'}, content: [
            {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
              {kind: B.KindJQuery('div'), attr: {'class': 'span6'}, content: [   
                {kind: B.KindJQuery('strong'), attr: {'style': 'color: white;'}, content: [   
                   "User Name"                                                                
                ]}                                                             
              ]},
              {kind: B.KindJQuery('div'), attr: {'class': 'span6'}, content: [   
                {kind: B.KindJQuery('input'), id: 'username', attr: {'id': 'username', 'type': 'text'}}                                                                              
              ]}
            ]},                                                                          
            {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
              {kind: B.KindJQuery('div'), attr: {'class': 'span6'}, content: [   
                {kind: B.KindJQuery('strong'), attr: {'style': 'color: white;'}, content: [   
                   "Password"                                                                
                ]}                                                                  
              ]},
              {kind: B.KindJQuery('div'), attr: {'class': 'span6'}, content: [   
                {kind: B.KindJQuery('input'), id: 'password', attr: {'id': 'password', 'type': 'password'}, init: function () {
                  this.$.keyup(function (e) {
                      if(event.keyCode === 13){
                          $("#loginaction").click();
                      }
                  });                  
                }}                                                                              
              ]}
            ]},
            {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
              {kind: B.KindJQuery('a'), attr: {'id': 'loginaction', 'class': 'btnlink', 'href': '#'}, content: [
                {kind: B.KindJQuery('i'), attr: {'class': 'icon-ok  icon-white'}}, ' Log in'
              ], init: function () {
                  this.$.click(function (e) {
                    e.preventDefault();
                    var u = $('#username').val();
                    var p = $('#password').val();
                    if (!u || !p) {
                      alert('Please enter your username and password');
                    } else {
                      OB.POS.modelterminal.load(u, p);
                    }
                  });
              }}
            ]}
          ]}
        ]}
      ], init: function () {
        OB.POS.modelterminal.on('domready', function () {
          this.context.username.$.focus();
        }, this);
      }}
      
    );           
  };
});