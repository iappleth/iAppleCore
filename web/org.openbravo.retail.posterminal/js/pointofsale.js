(function (OBPOS) {

  var Sales = {};

  Sales.terminal = null;
  Sales.bplocation = null;
  Sales.location = null;
  Sales.pricelist = null;
  Sales.pricelistversion = null;

  function initDataSources() {

    // DataSources...
    Sales.DSProduct = new OBPOS.DataSource(
    new OBPOS.Query(
        'select p as product, pp as price, img.bindaryData as img ' +
        'from PricingProductPrice as pp inner join pp.product p left outer join p.image img ' + 
        'where p.$readableCriteria and p.obposCatalog = true and pp.priceListVersion.id = :priceListVersion ' + 
        'order by p.obposLine, p.name'), {
      'priceListVersion': Sales.pricelistversion.id
    });

    Sales.DSCategories = new OBPOS.DataSource(
    new OBPOS.Query(
        'select c as category, img.bindaryData as img ' + 
        'from ProductCategory as c left outer join c.obposImage img ' +
        'where c.$readableCriteria and c.oBPOSIsCatalog = true ' +
        'order by c.oBPOSPOSLine, c.name'));
  };

  function isScrolledIntoView(container, elem) {

    var docViewTop = container.scrollTop();
    var docViewBottom = docViewTop + container.height();

    var elemTop = elem.offset().top;
    var elemBottom = elemTop + elem.height();

    return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom) && (elemBottom <= docViewBottom) && (elemTop >= docViewTop));
  }

  Sales.makeElemVisible = function (container, elem) {

    var docViewTop = container.offset().top;
    var docViewBottom = docViewTop + container.height();

    var elemTop = elem.offset().top;
    var elemBottom = elemTop + elem.height();

    var currentScroll = container.scrollTop();

    if (elemTop < docViewTop) {
      container.scrollTop(currentScroll - docViewTop + elemTop);
    } else if (elemBottom > docViewBottom) {
      container.scrollTop(currentScroll + elemBottom - docViewBottom);
    }
  }

  // public
  Sales.getThumbnail = function (base64, width, height, contentType) {
    var url = (base64) ? 'data:' + (contentType ? contentType : 'image/png') + ';base64,' + base64 : 'img/box.png';
    return $('<div/>').css('margin', 'auto').css('height', height ? height : '48').css('width', width ? width : '48').css('background', 'url(' + url + ') center center no-repeat').css('background-size', 'contain');
  };

  Sales.Terminal = function (elemt, elems) {
    this.elemt = elemt;
    this.elems = elems;
    this.readyListeners = [];
  }

  Sales.Terminal.prototype.addReadyListener = function (l) {
    this.readyListeners.push(l);
  }

  Sales.Terminal.prototype.fireReadyEvent = function (o) {
    for (var i = 0, max = this.readyListeners.length; i < max; i++) {
      this.readyListeners[i](this);
    }
  }
  Sales.Terminal.prototype.init = function () {

    var me = this;
    var t = OBPOS.getParameterByName("terminal") || "POS-1";

    new OBPOS.Query('from OBPOS_Applications where $readableCriteria and searchKey = :terminal').exec({
      terminal: t
    }, function (data) {
      if (data.exception) {
        location = '../org.openbravo.client.application.mobile/login.jsp';
      } else if (data[0]) {
        Sales.terminal = data[0];
        Sales.hw = new OBPOS.HWServer('http://192.168.0.8:8090/printer');
        me.printStatus();
      } else {
        alert("Terminal does not exists: " + t);
      }
    });
  }

  Sales.Terminal.prototype.printStatus = function () {

    var me = this;

    if (!Sales.bplocation) {
      Sales.bplocation = {};
      new OBPOS.Query('from BusinessPartnerLocation where id = (select min(id) from BusinessPartnerLocation where businessPartner.id = :bp and $readableCriteria)').exec({
        bp: Sales.terminal.businessPartner
      }, function (data) {
        if (data[0]) {
          Sales.bplocation = data[0];
          me.printStatus();
        }
      });
    }

    if (!Sales.location) {
      Sales.location = {};
      new OBPOS.Query('from Location where id = (select min(locationAddress) from OrganizationInformation where organization.id = :org and $readableCriteria)').exec({
        org: Sales.terminal.organization
      }, function (data) {
        if (data[0]) {
          Sales.location = data[0];
          me.printStatus();
        }
      });
    }

    if (!Sales.pricelist) {
      Sales.pricelist = {};
      new OBPOS.Query('from PricingPriceList where id =:pricelist and $readableCriteria').exec({
        pricelist: Sales.terminal.priceList
      }, function (data) {
        if (data[0]) {
          Sales.pricelist = data[0];
          me.printStatus();
        }
      });
    }

    if (!Sales.pricelistversion) {
      Sales.pricelistversion = {};
      new OBPOS.Query('select plv.id AS id from PricingPriceListVersion AS plv where plv.$readableCriteria and plv.priceList.id =:pricelist and plv.validFromDate = (select max(pplv.validFromDate) from PricingPriceListVersion as pplv where pplv.priceList.id = :pricelist)').exec({
        pricelist: Sales.terminal.priceList
      }, function (data) {
        if (data[0]) {
          Sales.pricelistversion = data[0];
          me.printStatus();

          initDataSources();

          me.fireReadyEvent();
        }
      });
    }

    var line1 = OBPOS.Sales.terminal['client._identifier'] + " | " + OBPOS.Sales.terminal['organization._identifier'];
    if (Sales.pricelist) {
      line1 += Sales.pricelist._identifier + " | " + Sales.pricelist['currency._identifier'];
    }

    var line2 = "";
    if (Sales.location) {
      line2 += Sales.location._identifier;
    }

    this.elemt.text(OBPOS.Sales.terminal._identifier);
    this.elems.html(line1 + "<br/>" + line2);
  }


  // Public Sales
  OBPOS.Sales = Sales;

}(window.OBPOS));