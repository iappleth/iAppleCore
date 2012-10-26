/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global B,_,Backbone,localStorage */

(function () {
  // Sales.OrderLine Model
  var OrderLine = Backbone.Model.extend({
    defaults: {
      product: null,
      productidentifier: null,
      uOM: null,
      qty: OB.DEC.Zero,
      price: OB.DEC.Zero,
      priceList: OB.DEC.Zero,
      gross: OB.DEC.Zero,
      description: ''
    },

    initialize: function (attributes) {
      if (attributes && attributes.product) {
        this.set('product', new OB.Model.Product(attributes.product));
        this.set('productidentifier', attributes.productidentifier);
        this.set('uOM', attributes.uOM);
        this.set('qty', attributes.qty);
        this.set('price', attributes.price);
        this.set('priceList', attributes.priceList);
        this.set('gross', attributes.gross);
        if (attributes.product && attributes.product.price) {
          this.set('grossListPrice', attributes.product.price.standardPrice);
        }
      }
    },

    printQty: function () {
      return this.get('qty').toString();
    },

    printPrice: function () {
      return OB.I18N.formatCurrency(this.get('price'));
    },

    printDiscount: function () {
      var d = OB.DEC.sub(this.get('priceList'), this.get('price'));
      if (OB.DEC.compare(d) === 0) {
        return '';
      } else {
        return OB.I18N.formatCurrency(d);
      }
    },

    calculateGross: function () {
      this.set('gross', OB.DEC.mul(this.get('qty'), this.get('price')));
      this.trigger('calculategross');
    },

    getGross: function () {
      return this.get('gross');
    },

    printGross: function () {
      return OB.I18N.formatCurrency(this.getGross());
    }
  });

  // Sales.OrderLineCol Model.
  var OrderLineList = Backbone.Collection.extend({
    model: OrderLine
  });

  // Sales.Payment Model
  var PaymentLine = Backbone.Model.extend({
    defaults: {
      'amount': OB.DEC.Zero,
      'origAmount': OB.DEC.Zero,
      'paid': OB.DEC.Zero // amount - change...
    },
    printAmount: function () {
      if (this.get('rate')) {
        return OB.I18N.formatCurrency(OB.DEC.mul(this.get('amount'), this.get('rate')));
      } else {
        return OB.I18N.formatCurrency(this.get('amount'));
      }
    },
    printForeignAmount: function () {
      return '(' + OB.I18N.formatCurrency(this.get('amount')) + ' ' + this.get('isocode') + ')';
    }
  });

  // Sales.OrderLineCol Model.
  var PaymentLineList = Backbone.Collection.extend({
    model: PaymentLine
  });

  // Sales.Order Model.
  var Order = Backbone.Model.extend({
    modelName: 'Order',
    tableName: 'c_order',
    entityName: 'Order',
    source: '',
    properties: ['id', 'json', 'session', 'hasbeenpaid', 'isbeingprocessed'],
    propertyMap: {
      'id': 'c_order_id',
      'json': 'json',
      'session': 'ad_session_id',
      'hasbeenpaid': 'hasbeenpaid',
      'isbeingprocessed': 'isbeingprocessed'
    },

    defaults: {
      hasbeenpaid: 'N',
      isbeingprocessed: 'N'
    },

    createStatement: 'CREATE TABLE IF NOT EXISTS c_order (c_order_id TEXT PRIMARY KEY, json CLOB, ad_session_id TEXT, hasbeenpaid TEXT, isbeingprocessed TEXT)',
    dropStatement: 'DROP TABLE IF EXISTS c_order',
    insertStatement: 'INSERT INTO c_order(c_order_id, json, ad_session_id, hasbeenpaid, isbeingprocessed) VALUES (?,?,?,?,?)',
    local: true,
    _id: 'modelorder',
    initialize: function (attributes) {
      var orderId;
      if (attributes && attributes.id && attributes.json) {
        // The attributes of the order are stored in attributes.json
        // Makes sure that the id is copied
        orderId = attributes.id;
        attributes = JSON.parse(attributes.json);
        attributes.id = orderId;
      }

      if (attributes && attributes.documentNo) {
        this.set('id', attributes.id);
        this.set('client', attributes.client);
        this.set('organization', attributes.organization);
        this.set('documentType', attributes.documentType);
        this.set('createdBy', attributes.createdBy);
        this.set('updatedBy', attributes.updatedBy);
        this.set('orderType', attributes.orderType); // 0: Sales order, 1: Return order
        this.set('generateInvoice', attributes.generateInvoice);
        this.set('priceList', attributes.priceList);
        this.set('currency', attributes.currency);
        this.set('currency' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER, attributes['currency' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER]);
        this.set('session', attributes.session);
        this.set('warehouse', attributes.warehouse);
        this.set('salesRepresentative', attributes.salesRepresentative);
        this.set('salesRepresentative' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER, attributes['salesRepresentative' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER]);
        this.set('posTerminal', attributes.posTerminal);
        this.set('posTerminal' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER, attributes['posTerminal' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER]);
        this.set('orderDate', new Date(attributes.orderDate));
        this.set('documentNo', attributes.documentNo);
        this.set('undo', attributes.undo);
        this.set('bp', new Backbone.Model(attributes.bp));
        this.set('lines', new OrderLineList().reset(attributes.lines));
        this.set('payments', new PaymentLineList().reset(attributes.payments));
        this.set('payment', attributes.payment);
        this.set('change', attributes.change);
        this.set('gross', attributes.gross);
        this.set('net', attributes.net);
        this.set('taxes', attributes.taxes);
        this.set('hasbeenpaid', attributes.hasbeenpaid);
        this.set('isbeingprocessed', attributes.isbeingprocessed);
        this.set('description', attributes.description);
        this.set('print', attributes.print);
        this.set('sendEmail', attributes.sendEmail);
        this.set('isPaid', attributes.isPaid);
        this.set('isEditable', attributes.isEditable);
        _.each(_.keys(attributes), function (key) {
          if (!this.has(key)) {
            this.set(key, attributes[key]);
          }
        }, this);
      } else {
        this.clearOrderAttributes();
      }
    },

    save: function () {
      var undoCopy;
      if (this.attributes.json) {
        delete this.attributes.json; // Needed to avoid recursive inclusions of itself !!!
      }
      undoCopy = this.get('undo');
      this.unset('undo');
      this.set('json', JSON.stringify(this.toJSON()));
      OB.Dal.save(this, function () {}, function () {
        window.console.error(arguments);
      });
      this.set('undo', undoCopy);
    },

    calculateTaxes: function (callback) {
      if (callback) {
        callback();
      }
      this.save();
    },

    getTotal: function () {
      return this.getGross();
    },

    printTotal: function () {
      return OB.I18N.formatCurrency(this.getTotal());
    },

    calculateGross: function () {
      var gross = this.get('lines').reduce(function (memo, e) {
        return OB.DEC.add(memo, e.getGross());
      }, OB.DEC.Zero);
      this.set('gross', gross);
    },

    getGross: function () {
      return this.get('gross');
    },

    printGross: function () {
      return OB.I18N.formatCurrency(this.getGross());
    },

    getPayment: function () {
      return this.get('payment');
    },

    getChange: function () {
      return this.get('change');
    },

    getPending: function () {
      return OB.DEC.sub(this.getTotal(), this.getPayment());
    },

    getPaymentStatus: function () {
      var total = this.getTotal();
      var pay = this.getPayment();
      return {
        'done': (this.get('lines').length > 0 && OB.DEC.compare(total) >= 0 && OB.DEC.compare(OB.DEC.sub(pay, total)) >= 0),
        'total': OB.I18N.formatCurrency(total),
        'pending': OB.DEC.compare(OB.DEC.sub(pay, total)) >= 0 ? OB.I18N.formatCurrency(OB.DEC.Zero) : OB.I18N.formatCurrency(OB.DEC.sub(total, pay)),
        'change': OB.DEC.compare(this.getChange()) > 0 ? OB.I18N.formatCurrency(this.getChange()) : null,
        'overpayment': OB.DEC.compare(OB.DEC.sub(pay, total)) > 0 ? OB.I18N.formatCurrency(OB.DEC.sub(pay, total)) : null
      };
    },

    clear: function () {
      this.clearOrderAttributes();
      this.trigger('change');
      this.trigger('clear');
    },

    clearOrderAttributes: function () {
      this.set('id', null);
      this.set('client', null);
      this.set('organization', null);
      this.set('createdBy', null);
      this.set('updatedBy', null);
      this.set('documentType', null);
      this.set('orderType', 0); // 0: Sales order, 1: Return order
      this.set('generateInvoice', false);
      this.set('priceList', null);
      this.set('currency', null);
      this.set('currency' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER, null);
      this.set('session', null);
      this.set('warehouse', null);
      this.set('salesRepresentative', null);
      this.set('salesRepresentative' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER, null);
      this.set('posTerminal', null);
      this.set('posTerminal' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER, null);
      this.set('orderDate', new Date());
      this.set('documentNo', '');
      this.set('undo', null);
      this.set('bp', null);
      this.set('lines', this.get('lines') ? this.get('lines').reset() : new OrderLineList());
      this.set('payments', this.get('payments') ? this.get('payments').reset() : new PaymentLineList());
      this.set('payment', OB.DEC.Zero);
      this.set('change', OB.DEC.Zero);
      this.set('gross', OB.DEC.Zero);
      this.set('hasbeenpaid', 'N');
      this.set('isbeingprocessed', 'N');
      this.set('description', '');
      this.set('print', true);
      this.set('sendEmail', false);
      this.set('isPaid', false);
      this.set('isEditable', true);
    },

    clearWith: function (_order) {
      var me = this,
          undf;
      _.each(_.keys(_order.attributes), function (key) {
        if (_order.get(key) !== undf) {
          if (_order.get(key) === null) {
            me.set(key, null);
          } else if (_order.get(key).at) {
            //collection
            me.get(key).reset();
            _order.get(key).forEach(function (elem) {
              me.get(key).add(elem);
            });
          } else {
            //property
            me.set(key, _order.get(key));
          }
        }
      });

      this.trigger('change');
      this.trigger('clear');
    },

    removeUnit: function (line, qty) {
      if (!OB.DEC.isNumber(qty)) {
        qty = OB.DEC.One;
      }
      this.setUnit(line, OB.DEC.sub(line.get('qty'), qty), OB.I18N.getLabel('OBPOS_RemoveUnits', [qty, line.get('product').get('_identifier')]));
    },

    addUnit: function (line, qty) {
      if (!OB.DEC.isNumber(qty)) {
        qty = OB.DEC.One;
      }
      this.setUnit(line, OB.DEC.add(line.get('qty'), qty), OB.I18N.getLabel('OBPOS_AddUnits', [qty, line.get('product').get('_identifier')]));
    },

    setUnit: function (line, qty, text) {

      if (OB.DEC.isNumber(qty)) {
        var oldqty = line.get('qty');
        if (OB.DEC.compare(qty) > 0) {
          if (line.get('product').get('groupProduct') === false) {
            this.addProduct(line.get('product'));
            return true;
          } else {
            var me = this;
            // sets the new quantity
            line.set('qty', qty);
            line.calculateGross();
            this.calculateGross();
            // sets the undo action
            this.set('undo', {
              text: text || OB.I18N.getLabel('OBPOS_SetUnits', [line.get('qty'), line.get('product').get('_identifier')]),
              oldqty: oldqty,
              line: line,
              undo: function () {
                line.set('qty', oldqty);
                line.calculateGross();
                me.calculateGross();
                me.set('undo', null);
              }
            });
          }
        } else {
          this.deleteLine(line);
        }
        this.adjustPayment();
        this.save();
      }
    },

    setPrice: function (line, price) {

      if (OB.DEC.isNumber(price)) {
        var oldprice = line.get('price');
        if (OB.DEC.compare(price) >= 0) {
          var me = this;
          // sets the new price
          line.set('price', price);
          line.calculateGross();
          this.calculateGross();
          // sets the undo action
          this.set('undo', {
            text: OB.I18N.getLabel('OBPOS_SetPrice', [line.printPrice(), line.get('product').get('_identifier')]),
            oldprice: oldprice,
            line: line,
            undo: function () {
              line.set('price', oldprice);
              line.calculateGross();
              me.calculateGross();
              me.set('undo', null);
            }
          });
        }
        this.adjustPayment();
      }
      this.save();
    },

    setLineProperty: function (line, property, value) {
      var me = this;
      var index = this.get('lines').indexOf(line);
      this.get('lines').at(index).set(property, value);
    },

    deleteLine: function (line) {
      var me = this;
      var index = this.get('lines').indexOf(line);
      // remove the line
      this.get('lines').remove(line);
      this.calculateGross();
      // set the undo action
      this.set('undo', {
        text: OB.I18N.getLabel('OBPOS_DeleteLine', [line.get('qty'), line.get('product').get('_identifier')]),
        line: line,
        undo: function () {
          me.get('lines').add(line, {
            at: index
          });
          me.calculateGross();
          me.set('undo', null);
        }
      });
      this.adjustPayment();
      this.save();
    },

    addProduct: function (p) {
      var me = this;
      if (p.get('obposScale')) {
        OB.POS.hwserver.getWeight(function (data) {
          if (data.exception) {
            alert(data.exception.message);
          } else if (data.result === 0) {
            alert(OB.I18N.getLabel('OBPOS_WeightZero'));
          } else {
            me.createLine(p, data.result);
          }
        });
      } else {
        if (p.get('groupProduct')) {
          var line = this.get('lines').find(function (l) {
            return l.get('product').id === p.id;
          });
          if (line) {
            this.addUnit(line);
            line.trigger('selected', line);
          } else {
            this.createLine(p, 1);
          }
        } else {
          //TODO avoid set qty for ticket line
          this.createLine(p, 1);
        }
      }
      this.save();
    },

    createLine: function (p, units) {
      var me = this;
      var newline = new OrderLine({
        product: p,
        uOM: p.get('uOM'),
        qty: OB.DEC.number(units),
        price: OB.DEC.number(p.get('price').get('standardPrice')),
        priceList: OB.DEC.number(p.get('price').get('standardPrice'))
      });
      newline.calculateGross();

      // add the created line
      this.get('lines').add(newline);
      this.calculateGross();
      // set the undo action
      this.set('undo', {
        text: OB.I18N.getLabel('OBPOS_AddLine', [newline.get('qty'), newline.get('product').get('_identifier')]),
        line: newline,
        undo: function () {
          me.get('lines').remove(newline);
          me.calculateGross();
          me.set('undo', null);
        }
      });
      this.adjustPayment();
    },

    setBPandBPLoc: function (businessPartner, showNotif, saveChange) {
      var me = this,
          undef;
      var oldbp = this.get('bp');
      this.set('bp', businessPartner);
      // set the undo action
      if (showNotif === undef || showNotif === true) {
        this.set('undo', {
          text: businessPartner ? OB.I18N.getLabel('OBPOS_SetBP', [businessPartner.get('_identifier')]) : OB.I18N.getLabel('OBPOS_ResetBP'),
          bp: businessPartner,
          undo: function () {
            me.set('bp', oldbp);
            me.set('undo', null);
          }
        });
      }
      if (saveChange) {
        this.save();
      }
    },

    setOrderTypeReturn: function () {
      if (OB.POS.modelterminal.hasPermission('OBPOS_receipt.return')) {
        this.set('documentType', OB.POS.modelterminal.get('terminal').documentTypeForReturns);
        this.set('orderType', 1); // 0: Sales order, 1: Return order
        this.save();
      }
    },

    setOrderInvoice: function () {
      if (OB.POS.modelterminal.hasPermission('OBPOS_receipt.invoice')) {
        this.set('generateInvoice', true);
        this.save();
      }
    },

    resetOrderInvoice: function () {
      if (OB.POS.modelterminal.hasPermission('OBPOS_receipt.invoice')) {
        this.set('generateInvoice', false);
        this.save();
      }
    },

    adjustPayment: function () {
      var i, max, p;
      var payments = this.get('payments');
      var total = this.getTotal();

      var nocash = OB.DEC.Zero;
      var cash = OB.DEC.Zero;
      var origCash = OB.DEC.Zero;
      var auxCash = OB.DEC.Zero;
      var prevCash = OB.DEC.Zero;
      var pcash;

      for (i = 0, max = payments.length; i < max; i++) {
        p = payments.at(i);
        if (p.get('rate') && p.get('rate') !== '1') {
          p.set('origAmount', OB.DEC.mul(p.get('amount'), p.get('rate')));
        } else {
          p.set('origAmount', p.get('amount'));
        }
        p.set('paid', p.get('origAmount'));
        if (p.get('kind') === 'OBPOS_payment.cash') {
          cash = OB.DEC.add(cash, p.get('origAmount'));
          pcash = p;
        } else if (p.get('kind').indexOf('.cash', p.get('kind').length - '.cash'.length) !== -1) {
          origCash = OB.DEC.add(origCash, p.get('origAmount'));
          pcash = p;
        } else {
          nocash = OB.DEC.add(nocash, p.get('origAmount'));
        }
      }

      // Calculation of the change....
      //FIXME
      if (pcash) {
        if (pcash.get('kind') !== 'OBPOS_payment.cash') {
          auxCash = origCash;
          prevCash = cash;
        } else {
          auxCash = cash;
          prevCash = origCash;
        }
        if (OB.DEC.compare(nocash - total) > 0) {
          pcash.set('paid', OB.DEC.Zero);
          this.set('payment', nocash);
          this.set('change', auxCash);
        } else if (OB.DEC.compare(OB.DEC.sub(OB.DEC.add(OB.DEC.add(nocash, cash), origCash), total)) > 0) {
          pcash.set('paid', OB.DEC.sub(total, OB.DEC.add(nocash, prevCash)));
          this.set('payment', total);
          this.set('change', OB.DEC.sub(OB.DEC.add(OB.DEC.add(nocash, cash), origCash), total));
        } else {
          pcash.set('paid', auxCash);
          this.set('payment', OB.DEC.add(OB.DEC.add(nocash, cash), origCash));
          this.set('change', OB.DEC.Zero);
        }
      } else {
        this.set('payment', nocash);
        this.set('change', OB.DEC.Zero);
      }
    },

    addPayment: function (payment) {
      var i, max, p;

      if (OB.DEC.compare(this.getTotal()) === 0) {
        alert(OB.I18N.getLabel('OBPOS_MsgPaymentAmountZero'));
        return;
      }

      if (!OB.DEC.isNumber(payment.get('amount'))) {
        alert(OB.I18N.getLabel('OBPOS_MsgPaymentAmountError'));
        return;
      }

      if (!OB.POS.modelterminal.hasPayment(payment.get('kind'))) {
        alert(OB.I18N.getLabel('OBPOS_MsgPaymentTypeError'));
        return;
      }

      var payments = this.get('payments');

      if (!payment.get('paymentData')) {
        // search for an existing payment only if there is not paymentData info.
        // this avoids to merge for example card payments of different cards.
        for (i = 0, max = payments.length; i < max; i++) {
          p = payments.at(i);
          if (p.get('kind') === payment.get('kind')) {
            p.set('amount', OB.DEC.add(payment.get('amount'), p.get('amount')));
            if (p.get('rate') && p.get('rate') !== '1') {
              p.set('origAmount', OB.DEC.add(payment.get('origAmount'), OB.DEC.mul(p.get('origAmount'), p.get('rate'))));
            }
            this.adjustPayment();
            return;
          }
        }
      }
      payments.add(payment);
      this.adjustPayment();
    },

    removePayment: function (payment) {
      var payments = this.get('payments');
      payments.remove(payment);
      this.adjustPayment();
      this.save();
    },

    serializeToJSON: function () {
      // this.toJSON() generates a collection instance for members like "lines"
      // We need a plain array object
      var jsonorder = JSON.parse(JSON.stringify(this.toJSON()));

      // remove not needed members
      delete jsonorder.undo;
      delete jsonorder.json;

      _.forEach(jsonorder.lines, function (item) {
        delete item.product.img;
      });

      // convert returns
      if (jsonorder.orderType === 1) {
        jsonorder.gross = -jsonorder.gross;
        jsonorder.change = -jsonorder.change;
        jsonorder.payment = -jsonorder.payment;
        jsonorder.net = -jsonorder.net;
        _.forEach(jsonorder.lines, function (item) {
          item.gross = -item.gross;
          item.net = -item.net;
          item.qty = -item.qty;
        });
        _.forEach(jsonorder.payments, function (item) {
          item.amount = -item.amount;
          item.paid = -item.paid;
        });
        _.forEach(jsonorder.taxes, function (item) {
          item.amount = -item.amount;
          item.net = -item.net;
        });
      }

      return jsonorder;
    },

    setProperty: function (_property, _value) {
      this.set(_property, _value);
      this.save();
    }
  });

  var OrderList = Backbone.Collection.extend({
    model: Order,

    constructor: function (modelOrder) {
      if (modelOrder) {
        //this._id = 'modelorderlist';
        this.modelorder = modelOrder;
      }
      Backbone.Collection.prototype.constructor.call(this);
    },

    initialize: function () {
      this.current = null;
    },

    newOrder: function () {
      var order = new Order(),
          me = this,
          documentseq, documentseqstr;

      order.set('client', OB.POS.modelterminal.get('terminal').client);
      order.set('organization', OB.POS.modelterminal.get('terminal').organization);
      order.set('createdBy', OB.POS.modelterminal.get('orgUserId'));
      order.set('updatedBy', OB.POS.modelterminal.get('orgUserId'));
      order.set('documentType', OB.POS.modelterminal.get('terminal').documentType);
      order.set('orderType', 0); // 0: Sales order, 1: Return order
      order.set('generateInvoice', false);
      order.set('session', OB.POS.modelterminal.get('session'));
      order.set('priceList', OB.POS.modelterminal.get('terminal').priceList);
      order.set('currency', OB.POS.modelterminal.get('terminal').currency);
      order.set('currency' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER, OB.POS.modelterminal.get('terminal')['currency' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER]);
      order.set('warehouse', OB.POS.modelterminal.get('terminal').warehouse);
      order.set('salesRepresentative', OB.POS.modelterminal.get('context').user.id);
      order.set('salesRepresentative' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER, OB.POS.modelterminal.get('context').user._identifier);
      order.set('posTerminal', OB.POS.modelterminal.get('terminal').id);
      order.set('posTerminal' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER, OB.POS.modelterminal.get('terminal')._identifier);
      order.set('orderDate', new Date());
      order.set('isPaid', false);

      documentseq = OB.POS.modelterminal.get('documentsequence') + 1;
      documentseqstr = OB.UTIL.padNumber(documentseq, 5);
      OB.POS.modelterminal.set('documentsequence', documentseq);
      order.set('documentNo', OB.POS.modelterminal.get('terminal').docNoPrefix + '/' + documentseqstr);

      order.set('bp', OB.POS.modelterminal.get('businessPartner'));
      order.set('print', true);
      order.set('sendEmail', false);
      return order;
    },

    newPaidReceipt: function (model) {
      var order = new Order(),
          me = this,
          documentseq, documentseqstr, bp, newline, lines, prod, payments, curPayment, taxes;
      this.lines = new Backbone.Collection();
      order.set('documentNo', model.documentNo);
      order.set('isPaid', true);
      order.set('isEditable', false);
      order.set('id', model.orderid);
      order.set('client', model.client);
      order.set('documentType', model.documenttype);
      order.set('organization', model.organization);
      order.set('posTerminal', model.posterminal);
      order.set('posTerminal$_identifier', model.posterminalidentifier);
      order.set('warehouse', model.warehouse);
      order.set('currency$_identifier', model.currency);
      order.set('isbeingprocessed', 'N');
      order.set('hasbeenpaid', 'Y');


      bp = {};
      bp._identifier = model.businessPartner;
      order.set('bp', new Backbone.Model(bp));
      order.set('gross', model.totalamount);
      order.set('salesRepresentative$_identifier', model.salesrepresentative);

      _.each(model.receiptLines, function (iter) {
        prod = new OB.Model.Product();
        prod.set('_identifier', iter.name);
        newline = new OrderLine({
          product: prod,
          uOM: iter.uOM,
          qty: OB.DEC.number(iter.quantity),
          price: OB.DEC.number(iter.unitPrice),
          priceList: OB.DEC.number(iter.unitPrice)
        });
        newline.set('gross', iter.linegrossamount);
        // add the created line
        me.lines.add(newline);
      });
      order.set('lines', me.lines);
      order.set('orderDate', model.orderDate.toString().substring(0, 10));
      //order.set('payments', model.receiptPayments);
      payments = new PaymentLineList();
      _.each(model.receiptPayments, function (iter) {
        var paymentProp;
        curPayment = new PaymentLine();
        for (paymentProp in iter) {
          if (iter.hasOwnProperty(paymentProp)) {
            curPayment.set(paymentProp, iter[paymentProp]);
          }
        }
        payments.add(curPayment);
      });
      order.set('payments', payments);


      taxes = {};
      _.each(model.receiptTaxes, function (iter) {
        var taxProp;
        taxes[iter.taxid] = {};
        for (taxProp in iter) {
          if (iter.hasOwnProperty(taxProp)) {
            taxes[iter.taxid][taxProp] = iter[taxProp];
          }
        }
      });
      order.set('taxes', taxes);

      return order;
    },

    addNewOrder: function () {
      this.saveCurrent();
      this.current = this.newOrder();
      this.add(this.current);
      this.loadCurrent(true);
    },
    addPaidReceipt: function (model) {
      this.saveCurrent();
      this.current = model;
      this.add(this.current);
      this.loadCurrent(true);
    },

    deleteCurrent: function () {
      var isNew = false;

      function deleteCurrentFromDatabase(orderToDelete) {
        OB.Dal.remove(orderToDelete, function () {
          return true;
        }, function () {
          OB.UTIL.showError('Error removing');
        });
      }

      if (this.current) {
        this.remove(this.current);
        if (this.length > 0) {
          this.current = this.at(this.length - 1);
        } else {
          this.current = this.newOrder();
          this.add(this.current);
          isNew = true;
        }
        this.loadCurrent(isNew);
      }
    },

    load: function (model) {
      // Workaround to prevent the pending receipts moder window from remaining open
      // when the current receipt is selected from the list
      if (model && this.current && model.get('documentNo') === this.current.get('documentNo')) {
        return;
      }
      this.saveCurrent();
      this.current = model;
      this.loadCurrent();
    },
    saveCurrent: function () {
      if (this.current) {
        this.current.clearWith(this.modelorder);
      }
    },
    loadCurrent: function (isNew) {
      if (this.current) {
        if (isNew) {
          //set values of new attrs in current, 
          //this values will be copied to modelOrder
          //in the next instruction
          this.modelorder.trigger('beforeChangeOrderForNewOne', this.current);
        }
        this.modelorder.clearWith(this.current);
      }
    }

  });

  window.OB = window.OB || {};
  window.OB.Model = window.OB.Model || {};
  window.OB.Collection = window.OB.Collection || {};

  window.OB.Model.OrderLine = OrderLine;
  window.OB.Collection.OrderLineList = OrderLineList;
  window.OB.Model.PaymentLine = PaymentLine;
  window.OB.Collection.PaymentLineList = PaymentLineList;
  window.OB.Model.Order = Order;
  window.OB.Collection.OrderList = OrderList;

}());