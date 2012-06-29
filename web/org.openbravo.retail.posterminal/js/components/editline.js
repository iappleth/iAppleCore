/*global B */

(function () {

  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  OB.COMP.EditLine = function (context) {
    var me = this;

    this.component = B(
      {kind: B.KindJQuery('div'), content: [
        {kind: B.KindJQuery('div'), attr: {'style': 'background-color: #ffffff; color: black; height: 200px; margin: 5px; padding: 5px'}, content: [
          {kind: B.KindJQuery('div'), id: 'msgedit', attr: {'class': 'row-fluid', 'style': 'display: none;'}, content: [
            {kind: B.KindJQuery('div'), attr: {'class': 'span7'}, content: [
              {kind: B.KindJQuery('div'), attr: {style: 'padding: 5px; width:100%'}, content: [
                {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                  {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [
                    {kind: OB.COMP.SmallButton, attr: { 'label': OB.I18N.getLabel('OBPOS_ButtonDelete'), 'className': 'btnlink-orange',
                      'clickEvent': function() {
                        if (me.line) {
                          me.receipt.deleteLine(me.line);
                          me.receipt.trigger('scan');
                        }
                      }
                    }}
                  ]}
                ]}
              ]},
              {kind: B.KindJQuery('div'), attr: {style: 'padding: 0px 0px 0px 25px; width:100%; line-height: 140%;'}, content: [
                {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                  {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                    OB.I18N.getLabel('OBPOS_LineDescription')
                  ]},
                  {kind: B.KindJQuery('div'), attr: {'class': 'span8'}, content: [
                    {kind: B.KindJQuery('span'), id: 'editlinename'}
                  ]}
                ]},
                {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                  {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                    OB.I18N.getLabel('OBPOS_LineQuantity')
                  ]},
                  {kind: B.KindJQuery('div'), attr: {'class': 'span8'}, content: [
                    {kind: B.KindJQuery('span'), id: 'editlineqty'}
                  ]}
                ]},
                {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                  {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                    OB.I18N.getLabel('OBPOS_LinePrice')
                  ]},
                  {kind: B.KindJQuery('div'), attr: {'class': 'span8'}, content: [
                    {kind: B.KindJQuery('span'), id: 'editlineprice'}
                  ]}
                ]},
                {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                  {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                    OB.I18N.getLabel('OBPOS_LineValue')
                  ]},
                  {kind: B.KindJQuery('div'), attr: {'class': 'span8'}, content: [
                    {kind: B.KindJQuery('span'), content: [
                    ]}
                  ]}
                ]},
                {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                  {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                    OB.I18N.getLabel('OBPOS_LineDiscount')
                  ]},
                  {kind: B.KindJQuery('div'), attr: {'class': 'span8'}, content: [
                    {kind: B.KindJQuery('span'), content: [
                    ]}
                  ]}
                ]},
                {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
                  {kind: B.KindJQuery('div'), attr: {'class': 'span4'}, content: [
                    OB.I18N.getLabel('OBPOS_LineTotal')
                  ]},
                  {kind: B.KindJQuery('div'), attr: {'class': 'span8'}, content: [
                    {kind: B.KindJQuery('span'), id: 'editlinegross'}
                  ]}
                ]}
              ]}
            ]},
            {kind: B.KindJQuery('div'), attr: {'class': 'span5', 'style': 'text-align: right'}, content: [
              {kind: B.KindJQuery('div'), attr: {'style': 'padding: 60px 10px 20px 10px;'}, id: 'editlineimage'}
            ]}
          ]},
          {kind: B.KindJQuery('div'), id: 'msgaction', attr: {'style': 'padding: 10px; display: none;'}, content: [
            {kind: B.KindJQuery('div'), id: 'txtaction', attr: {'style': 'float:left;'}}
          ]}
        ]}
      ]}
    );

    this.$el = this.component.$el;
    this.msgedit = this.component.context.msgedit.$el;
    this.msgaction = this.component.context.msgaction.$el;
    this.txtaction = this.component.context.txtaction.$el;
    this.editlineimage = this.component.context.editlineimage.$el;
    this.editlinename = this.component.context.editlinename.$el;
    this.editlineqty = this.component.context.editlineqty.$el;
    this.editlineprice = this.component.context.editlineprice.$el;
    this.editlinegross = this.component.context.editlinegross.$el;

    // Set Model

    this.products = context.DataProductPrice;
    this.receipt = context.modelorder;
    this.line = null;

    this.receipt.get('lines').on('selected', function (line) {
      if (this.line) {
        this.line.off('change', this.renderLine);
      }
      this.line = line;
      if (this.line) {
        this.line.on('change', this.renderLine, this);
      }
      this.renderLine();
    }, this);

    this.renderLine();
  };

  OB.COMP.EditLine.prototype.renderLine = function () {

    if (this.line) {
      this.msgaction.hide();
      this.msgedit.show();
      this.editlineimage.empty().append(B(
          {kind: OB.UTIL.Thumbnail, attr: {img: this.line.get('img'), width: 128, height: 128}}
      ).$el);
      this.editlinename.text(this.line.get('product').get('_identifier'));
      this.editlineqty.text(this.line.printQty());
      this.editlineprice.text(this.line.printPrice());
      this.editlinegross.text(this.line.printGross());
    } else {
      this.txtaction.text(OB.I18N.getLabel('OBPOS_NoLineSelected'));
      this.msgedit.hide();
      this.msgaction.show();
      this.editlineimage.empty();
      this.editlinename.empty();
      this.editlineqty.empty();
      this.editlineprice.empty();
      this.editlinegross.empty();
    }
  };
}());