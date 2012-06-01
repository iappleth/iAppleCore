/*global window, define, Backbone */

define(['builder', 'utilities', 'utilitiesui', 'i18n', 'components/commonbuttons', 'components/searchproducts'], function (B) {
   
  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};
  
  
  OB.COMP.ButtonTabSearch = OB.COMP.ButtonTab.extend({
    tabpanel: '#search',
    label: OB.I18N.getLabel('OBPOS_LblSearch'),
    shownEvent: function (e) {      
      this.options.keyboard.hide();
    }       
  }); 
  OB.COMP.TabSearch = OB.COMP.CustomView.extend({
    createView: function () {
      return ( 
        {kind: B.KindJQuery('div'), attr: {'id': 'search', 'class': 'tab-pane'}, content: [
          {kind: B.KindJQuery('div'), attr: {style: 'overflow:auto; height: 500px; margin: 5px;'}, content: [                                                                                      
            {kind: B.KindJQuery('div'), attr: {'style': 'background-color: #ffffff; color: black; padding: 5px'}, content: [                                                                                                       
              {kind: OB.COMP.SearchProduct} 
            ]}        
          ]}                                                                      
        ]}          
      );
    }   
  });            
          
});