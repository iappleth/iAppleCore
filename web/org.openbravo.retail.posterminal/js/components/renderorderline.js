/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global B, $ */

(function () {

  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  OB.COMP.RenderOrderLine = OB.COMP.SelectButton.extend({
    contentView: [{
      id: 'divproduct',
      tag: 'div',
      attributes: {
        style: 'float: left; width: 40%'
      }
    }, {
      id: 'divquantity',
      tag: 'div',
      attributes: {
        style: 'float: left; width: 20%; text-align: right'
      }
    }, {
      id: 'divprice',
      tag: 'div',
      attributes: {
        style: 'float: left; width: 20%; text-align: right'
      }
    }, {
      id: 'divgross',
      tag: 'div',
      attributes: {
        style: 'float: left; width: 20%; text-align: right'
      }
    }, {
      tag: 'div',
      attributes: {
        style: 'clear: both;'
      }
    }],
    render: function () {
      this.$el.addClass('btnselect-orderline');
      this.divproduct.text(this.model.get('product').get('_identifier'));
      this.divquantity.text(this.model.printQty());
      this.divprice.text(this.model.printPrice());
      this.divgross.text(this.model.printGross());
      return this;
    }
  });
}());