/*
 ************************************************************************************
 * Copyright (C) 2012-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, Promise, _, BigDecimal */

(function() {
  function getTaxCategory(params) {
    // { receipt, line }
    return new Promise(function(resolve, reject) {
      var i, j, k;

      function findSuccess(data) {
        for (k = 0; k < data.length; k++) {
          var linked = data.at(k);
          if (
            params.line.get('product').get('productCategory') ===
            linked.get('productCategory')
          ) {
            // Found a linked configuration that matches productCategory of the product line
            // resolving the linked configuration tax category
            // this is the use case for the *Services can change product tax* functionality.
            params.taxCategory = linked.get('taxCategory');
            if (!params.line.get('taxChangedPrice')) {
              params.line.changePrice = true;
            }
            resolve(params);
            return;
          }
        }
        // Not found a linked configuration that matches productCategory of the product line
        // resolving product tax category
        params.taxCategory = params.line.get('product').get('taxCategory');
        if (params.line.get('taxChangedPrice')) {
          params.line.changeBackPrice = true;
        }
        resolve(params);
      }

      if (params.line.get('originalTaxCategory')) {
        // The taxes calculation is locked so use the originalTaxCategory
        params.taxCategory = params.line.get('originalTaxCategory');
        if (params.line.get('taxChangedPrice')) {
          params.line.changeBackPrice = true;
        }
        resolve(params);
        return;
      }

      for (i = 0; i < params.receipt.get('lines').length; i++) {
        var l = params.receipt.get('lines').at(i);
        if (l.get('relatedLines') && !l.get('obposIsDeleted')) {
          for (j = 0; j < l.get('relatedLines').length; j++) {
            var rell = l.get('relatedLines')[j];
            if (rell.orderlineId === params.line.get('id')) {
              if (l.get('product').get('modifyTax')) {
                // product has a service with *modifyTax* flag activated
                // Lets look for the service lnked product category configuration
                // This is the async part of this function.
                var product = l.get('product').get('id');
                var criteria = {
                  product: product
                };
                if (
                  OB.MobileApp.model.hasPermission('OBPOS_remote.product', true)
                ) {
                  var remoteCriteria = [
                    {
                      columns: ['product'],
                      operator: 'equals',
                      value: product
                    }
                  ];
                  criteria.remoteFilters = remoteCriteria;
                }
                OB.Dal.findUsingCache(
                  'ProductServiceLinked',
                  OB.Model.ProductServiceLinked,
                  criteria,
                  findSuccess,
                  reject,
                  {
                    modelsAffectedByCache: ['ProductServiceLinked']
                  }
                );
                return;
              }
            }
          }
        }
      }
      // Not found a service linked with *modifyTax* flag activated.
      // resolving product tax Category
      params.taxCategory = params.line.get('product').get('taxCategory');
      if (params.line.get('taxChangedPrice')) {
        params.line.changeBackPrice = true;
      }
      resolve(params);
    });
  }

  function navigateTaxesTree(taxrates, taxid, iteratee) {
    _.each(taxrates, function(tax) {
      if (tax.get('taxBase') === taxid) {
        iteratee(tax);
        navigateTaxesTree(taxrates, tax.get('id'), iteratee);
      }
    });
  }

  var isTaxCategoryBOM = function(taxcategory) {
    return new Promise(function(fulfill, reject) {
      OB.Dal.findUsingCache(
        'taxCategoryBOM',
        OB.Model.TaxCategoryBOM,
        {
          id: taxcategory
        },
        function(data) {
          fulfill(data.length > 0);
        },
        reject,
        {
          modelsAffectedByCache: ['TaxCategoryBOM']
        }
      );
    });
  };

  var getProductBOM = function(product) {
    return new Promise(function(fulfill) {
      OB.Dal.findUsingCache(
        'taxProductBOM',
        OB.Model.ProductBOM,
        {
          product: product
        },
        function(data) {
          // Group data by product category
          // Calculate the ratio by product category
          // Finally sort by ratio
          try {
            var groupeddata = data
              .chain()
              .groupBy(function(productbom) {
                return productbom.get('bomtaxcategory');
              })
              .map(function(productboms, bomtaxcategory) {
                var ratio = _.reduce(
                  productboms,
                  function(memo, productbom) {
                    if (OB.UTIL.isNullOrUndefined(productbom.get('bomprice'))) {
                      throw 'noBOMPrice';
                    }
                    return OB.DEC.add(
                      memo,
                      OB.DEC.mul(
                        productbom.get('bomprice'),
                        productbom.get('bomquantity')
                      )
                    );
                  },
                  0
                );
                return {
                  bomtaxcategory: bomtaxcategory,
                  ratio: ratio
                };
              })
              .sortBy(function(groupedbom) {
                return groupedbom.ratio;
              })
              .value();

            // Assign total ratio
            groupeddata.totalratio = _.reduce(
              groupeddata,
              function(s, productbom) {
                return OB.DEC.add(s, productbom.ratio);
              },
              OB.DEC.Zero
            );

            // Fulfill promise
            fulfill(groupeddata);
          } catch (e) {
            fulfill({
              nobomprice: true
            });
          }
        },
        {
          modelsAffectedByCache: ['ProductBOM']
        }
      );
    });
  };

  var getTaxRateNumber = function(taxRate) {
    var rate = new BigDecimal(String(taxRate)); // 10
    return rate.divide(
      new BigDecimal('100'),
      20,
      BigDecimal.prototype.ROUND_HALF_UP
    ); // 0.10
  };

  var calculateDiscountedGross = function(line) {
    var discountedGross = line.get('gross');
    if (discountedGross !== 0 && line.get('promotions')) {
      discountedGross = line.get('promotions').reduce(function(memo, element) {
        return OB.DEC.sub(memo, element.actualAmt || element.amt || 0);
      }, discountedGross);
    }
    return discountedGross;
  };

  var distributeBOM = function(data, property, amount) {
    var accamount = amount;

    // calculate ratio for each product bom line
    _.forEach(data, function(productbom) {
      var bomamount = OB.DEC.div(
        OB.DEC.mul(productbom.ratio, amount),
        data.totalratio
      );
      accamount = OB.DEC.sub(accamount, bomamount);
      productbom[property] = bomamount;
    });
    // Adjust rounding in the first item of the bom
    if (data && data.length > 0) {
      var lastitem = data[data.length - 1];
      lastitem[property] = OB.DEC.add(lastitem[property], accamount);
    }
  };

  var regenerateTaxesInfo = function(receipt) {
    return Promise.all(
      _.map(receipt.get('lines').models, function(line) {
        var discAmt,
          lineObj = {};
        var linerate = BigDecimal.prototype.ONE;
        _.forEach(line.get('taxes'), function(tax) {
          lineObj[tax.taxId] = {
            amount: tax.taxAmount,
            name: tax.identifier,
            net: tax.taxableAmount,
            rate: tax.taxRate
          };
          line.set(
            {
              taxLines: lineObj,
              taxAmount: OB.DEC.add(line.get('taxAmount') || 0, tax.taxAmount),
              linerate: OB.DEC.toNumber(
                linerate.add(getTaxRateNumber(tax.taxRate))
              )
            },
            {
              silent: true
            }
          );
        });
        discAmt = line.get('promotions').reduce(function(memo, disc) {
          return OB.DEC.add(memo, disc.actualAmt || disc.amt || 0);
        }, 0);
        line.set(
          {
            net: receipt.get('priceIncludesTax')
              ? line.get('linenetamount')
              : line.get('net')
          },
          {
            silent: true
          }
        );
        if (receipt.get('priceIncludesTax')) {
          line.set(
            {
              discountedNet: line.get('net'),
              discountedLinePrice: OB.DEC.add(
                line.get('net'),
                line.get('taxAmount')
              )
            },
            {
              silent: true
            }
          );
        } else {
          line.set(
            {
              gross: OB.DEC.add(line.get('net'), line.get('taxAmount')),
              discountedNet: OB.DEC.sub(line.get('net'), discAmt),
              discountedNetPrice: OB.DEC.sub(line.get('net'), discAmt),
              discountedGross: OB.DEC.add(
                OB.DEC.sub(line.get('net'), discAmt),
                line.get('taxAmount')
              )
            },
            {
              silent: true
            }
          );
        }
      })
    ).then(function(value) {
      if (value.length !== receipt.get('lines').length) {
        OB.debug('The number of original lines of the receipt has change!');
        return;
      }
      receipt.set(
        'net',
        receipt.get('lines').reduce(function(memo, line) {
          return OB.DEC.add(memo, line.get('discountedNet'));
        }, 0),
        {
          silent: true
        }
      );

      var taxesColl = {};
      _.forEach(receipt.get('receiptTaxes'), function(receiptTax) {
        var taxObj = {
          amount: receiptTax.amount,
          cascade: receiptTax.cascade,
          docTaxAmount: receiptTax.docTaxAmount,
          lineNo: receiptTax.lineNo,
          name: receiptTax.name,
          net: receiptTax.net,
          rate: receiptTax.rate,
          taxBase: receiptTax.taxBase
        };
        taxesColl[receiptTax.taxid] = taxObj;
      });
      receipt.set('taxes', taxesColl);
    });
  };

  var findTaxesCollection = function(receipt, line, taxCategory) {
    return new Promise(function(fulfill, reject) {
      // sql parameters
      var fromRegionOrg = OB.MobileApp.model.get('terminal')
          .organizationRegionId,
        fromCountryOrg = OB.MobileApp.model.get('terminal')
          .organizationCountryId,
        bpTaxCategory = receipt.get('bp').get('taxCategory'),
        bpIsExempt = receipt.get('bp').get('taxExempt'),
        bpShipLocId = receipt.get('bp').get('shipLocId'),
        bpName =
          receipt.get('bp').get('name') ||
          OB.I18N.getLabel('OBPOS_LblEmptyAddress'),
        bpShipLocName =
          receipt.get('bp').get('shipLocName') ||
          OB.I18N.getLabel('OBPOS_LblEmptyAddress'),
        bplCountryId = receipt.get('bp').get('shipCountryId')
          ? receipt.get('bp').get('shipCountryId')
          : null,
        bplRegionId = receipt.get('bp').get('shipRegionId')
          ? receipt.get('bp').get('shipRegionId')
          : null,
        isCashVat = OB.MobileApp.model.get('terminal').cashVat;
      // SQL build
      // the query is ordered by countryId desc and regionId desc
      // (so, the first record will be the tax with the same country or
      // region that the customer,
      // or if toCountryId and toRegionId are nulls then will be ordered
      // by validfromdate)
      var sql = '';
      if (!bplCountryId) {
        sql =
          "select c_tax.c_tax_id, c_tax.name,  c_tax.description, c_tax.taxindicator, c_tax.validfrom, c_tax.issummary, c_tax.rate, c_tax.parent_tax_id, (case when c_tax.c_country_id = '" +
          fromCountryOrg +
          "' then c_tax.c_country_id else tz.from_country_id end) as c_country_id, (case when c_tax.c_region_id = '" +
          fromRegionOrg +
          "' then c_tax.c_region_id else tz.from_region_id end) as c_region_id, (case when c_tax.to_country_id = bpl.countryId then c_tax.to_country_id else tz.to_country_id end) as to_country_id, (case when c_tax.to_region_id = bpl.regionId then c_tax.to_region_id else tz.to_region_id end)  as to_region_id, c_tax.c_taxcategory_id, c_tax.isdefault, c_tax.istaxexempt, c_tax.sopotype, c_tax.cascade, c_tax.c_bp_taxcategory_id,  c_tax.line, c_tax.iswithholdingtax, c_tax.isnotaxable, c_tax.deducpercent, c_tax.originalrate, c_tax.istaxundeductable,  c_tax.istaxdeductable, c_tax.isnovat, c_tax.baseamount, c_tax.c_taxbase_id, c_tax.doctaxamount, c_tax.iscashvat,  c_tax._identifier,  c_tax._idx,  (case when (c_tax.to_country_id = bpl.countryId or tz.to_country_id= bpl.countryId) then 0 else 1 end) as orderCountryTo,  (case when (c_tax.to_region_id = bpl.regionId or tz.to_region_id = bpl.regionId) then 0 else 1 end) as orderRegionTo,  (case when coalesce(c_tax.c_country_id, tz.from_country_id) is null then 1 else 0 end) as orderCountryFrom,  (case when coalesce(c_tax.c_region_id, tz.from_region_id) is null then 1 else 0 end) as orderRegionFrom  from c_tax left join c_tax_zone tz on tz.c_tax_id = c_tax.c_tax_id  join c_bpartner_location bpl on bpl.c_bpartner_location_id = '" +
          bpShipLocId +
          "'   where c_tax.sopotype in ('B', 'S') ";
      } else {
        sql =
          "select c_tax.c_tax_id, c_tax.name,  c_tax.description, c_tax.taxindicator, c_tax.validfrom, c_tax.issummary, c_tax.rate, c_tax.parent_tax_id, (case when c_tax.c_country_id = '" +
          fromCountryOrg +
          "' then c_tax.c_country_id else tz.from_country_id end) as c_country_id, (case when c_tax.c_region_id = '" +
          fromRegionOrg +
          "' then c_tax.c_region_id else tz.from_region_id end) as c_region_id, (case when c_tax.to_country_id = '" +
          bplCountryId +
          "' then c_tax.to_country_id else tz.to_country_id end) as to_country_id, (case when c_tax.to_region_id = '" +
          bplRegionId +
          "' then c_tax.to_region_id else tz.to_region_id end)  as to_region_id, c_tax.c_taxcategory_id, c_tax.isdefault, c_tax.istaxexempt, c_tax.sopotype, c_tax.cascade, c_tax.c_bp_taxcategory_id,  c_tax.line, c_tax.iswithholdingtax, c_tax.isnotaxable, c_tax.deducpercent, c_tax.originalrate, c_tax.istaxundeductable,  c_tax.istaxdeductable, c_tax.isnovat, c_tax.baseamount, c_tax.c_taxbase_id, c_tax.doctaxamount, c_tax.iscashvat,  c_tax._identifier,  c_tax._idx,  (case when (c_tax.to_country_id = '" +
          bplCountryId +
          "' or tz.to_country_id= '" +
          bplCountryId +
          "') then 0 else 1 end) as orderCountryTo,  (case when (c_tax.to_region_id = '" +
          bplRegionId +
          "' or tz.to_region_id = '" +
          bplRegionId +
          "') then 0 else 1 end) as orderRegionTo,  (case when coalesce(c_tax.c_country_id, tz.from_country_id) is null then 1 else 0 end) as orderCountryFrom,  (case when coalesce(c_tax.c_region_id, tz.from_region_id) is null then 1 else 0 end) as orderRegionFrom  from c_tax left join c_tax_zone tz on tz.c_tax_id = c_tax.c_tax_id  where c_tax.sopotype in ('B', 'S') ";
      }
      sql = sql + " and c_tax.c_taxCategory_id = '" + taxCategory + "'";
      if (
        line.has('originalTaxExempt')
          ? line.get('originalTaxExempt')
          : bpIsExempt
      ) {
        sql = sql + " and c_tax.istaxexempt = 'true'";
      } else {
        if (bpTaxCategory) {
          sql =
            sql + " and c_tax.c_bp_taxcategory_id = '" + bpTaxCategory + "'";
        } else {
          sql = sql + ' and c_tax.c_bp_taxcategory_id is null';
        }
      }
      if (line.get('originalOrderDate')) {
        // The taxes calculation is locked so use the originalOrderDate
        sql =
          sql +
          " and c_tax.validFrom <= '" +
          line.get('originalOrderDate') +
          "'";
      } else {
        sql = sql + ' and c_tax.validFrom <= date()';
      }
      if (!bplCountryId) {
        sql =
          sql +
          ' and (c_tax.to_country_id = bpl.countryId   or tz.to_country_id = bpl.countryId   or (c_tax.to_country_id is null       and (not exists (select 1 from c_tax_zone z where z.c_tax_id = c_tax.c_tax_id)           or exists (select 1 from c_tax_zone z where z.c_tax_id = c_tax.c_tax_id and z.to_country_id = bpl.countryId)           or exists (select 1 from c_tax_zone z where z.c_tax_id = c_tax.c_tax_id and z.to_country_id is null))))';
        sql =
          sql +
          ' and (c_tax.to_region_id = bpl.regionId   or tz.to_region_id = bpl.regionId  or (c_tax.to_region_id is null       and (not exists (select 1 from c_tax_zone z where z.c_tax_id = c_tax.c_tax_id)           or exists (select 1 from c_tax_zone z where z.c_tax_id = c_tax.c_tax_id and z.to_region_id = bpl.regionId)           or exists (select 1 from c_tax_zone z where z.c_tax_id = c_tax.c_tax_id and z.to_region_id is null))))';
      } else {
        sql =
          sql +
          " and (c_tax.to_country_id = '" +
          bplCountryId +
          "'   or tz.to_country_id = '" +
          bplCountryId +
          "'   or (c_tax.to_country_id is null       and (not exists (select 1 from c_tax_zone z where z.c_tax_id = c_tax.c_tax_id)           or exists (select 1 from c_tax_zone z where z.c_tax_id = c_tax.c_tax_id and z.to_country_id = '" +
          bplCountryId +
          "')           or exists (select 1 from c_tax_zone z where z.c_tax_id = c_tax.c_tax_id and z.to_country_id is null))))";
        sql =
          sql +
          " and (c_tax.to_region_id = '" +
          bplRegionId +
          "'   or tz.to_region_id = '" +
          bplRegionId +
          "'  or (c_tax.to_region_id is null       and (not exists (select 1 from c_tax_zone z where z.c_tax_id = c_tax.c_tax_id)           or exists (select 1 from c_tax_zone z where z.c_tax_id = c_tax.c_tax_id and z.to_region_id = '" +
          bplRegionId +
          "')           or exists (select 1 from c_tax_zone z where z.c_tax_id = c_tax.c_tax_id and z.to_region_id is null))))";
      }
      if (isCashVat) {
        sql =
          sql +
          " and (c_tax.isCashVAT ='" +
          isCashVat +
          "' OR (c_tax.isCashVAT = 'false' and (c_tax.isWithholdingTax = 'true' or c_tax.rate=0))) ";
      } else {
        sql = sql + " and c_tax.isCashVAT ='false' ";
      }
      sql =
        sql +
        ' order by orderRegionTo, orderRegionFrom, orderCountryTo, orderCountryFrom, c_tax.validFrom desc, c_tax.isdefault desc';

      OB.UTIL.HookManager.executeHooks(
        'OBPOS_FindTaxRate',
        {
          context: receipt,
          line: line,
          sql: sql
        },
        function(args) {
          OB.Dal.queryUsingCache(
            OB.Model.TaxRate,
            args.sql,
            [],
            function(coll) {
              // success
              if (coll && coll.length > 0) {
                fulfill(coll);
              } else {
                if (
                  OB.UTIL.isNullOrUndefined(
                    OB.MobileApp.model.get('taxCategoryName')
                  )
                ) {
                  reject(
                    OB.I18N.getLabel('OBPOS_TaxNotFound_Message', [
                      bpName,
                      bpShipLocName
                    ])
                  );
                } else {
                  reject(
                    OB.I18N.getLabel('OBPOS_TaxWithCategoryNotFound_Message', [
                      bpName,
                      bpShipLocName,
                      OB.MobileApp.model.get('taxCategoryName')
                    ])
                  );
                  OB.MobileApp.model.unset('taxCategoryName');
                }
              }
            },
            function() {
              // error
              reject(OB.I18N.getLabel('OBPOS_TaxCalculationError_Message'));
            }
          );
        }
      );
    });
  };

  var getTaxCategoryName = function(params) {
    return new Promise(function(resolve) {
      if (!OB.UTIL.isNullOrUndefined(OB.Model.TaxCategory)) {
        OB.Dal.get(
          OB.Model.TaxCategory,
          params.line.get('product').get('taxCategory'),
          function(taxcategory) {
            OB.MobileApp.model.set('taxCategoryName', taxcategory.get('name'));
          }
        );
      }
      resolve(params);
    });
  };

  var calcProductTaxesIncPrice = function(params) {
    var receipt = params.receipt;
    var line = params.line;
    var taxCategory = params.taxCategory;
    var orggross = params.orggross;
    var discountedGross = params.discountedGross;

    return findTaxesCollection(receipt, line, taxCategory).then(function(coll) {
      // First calculate the line rate.
      var linerate = BigDecimal.prototype.ONE;
      var linetaxid = coll.at(0).get('id');
      var validFromDate = coll.at(0).get('validFromDate');
      var taxamt = new BigDecimal(String(discountedGross));
      var baseTaxAmt; // Defined here?
      var baseTaxdcAmt; // Defined here?
      var taxamtdc;
      if (!(_.isNull(discountedGross) || _.isUndefined(discountedGross))) {
        taxamtdc = new BigDecimal(String(discountedGross));
      }
      var fromCountryId = coll.at(0).get('country');
      var fromRegionId = coll.at(0).get('region');
      var toCountryId = coll.at(0).get('destinationCountry');
      var toRegionId = coll.at(0).get('destinationRegion');
      coll = _.filter(coll.models, function(taxRate) {
        return (
          taxRate.get('destinationCountry') === toCountryId &&
          taxRate.get('destinationRegion') === toRegionId &&
          taxRate.get('country') === fromCountryId &&
          taxRate.get('region') === fromRegionId &&
          taxRate.get('validFromDate') === validFromDate
        );
      });

      var taxeslineAux = {};
      var sortedTaxCollection = [];

      var callbackTaxRate = function(taxRate, taxIndex, taxList) {
        if (!taxRate.get('summaryLevel')) {
          var taxId = taxRate.get('id');
          var rate = getTaxRateNumber(taxRate.get('rate'));
          if (taxRate.get('cascade')) {
            linerate = linerate.multiply(rate.add(BigDecimal.prototype.ONE));
            taxamt = taxamt.multiply(
              new BigDecimal(String(OB.DEC.add(1, rate)))
            );
            if (
              !(_.isNull(discountedGross) || _.isUndefined(discountedGross))
            ) {
              taxamtdc = taxamtdc.multiply(
                new BigDecimal(String(OB.DEC.add(1, rate)))
              );
            }
          } else if (taxRate.get('taxBase')) {
            var baseTax = taxeslineAux[taxRate.get('taxBase')];
            if (!_.isUndefined(baseTax)) {
              //if the baseTax of this tax have been processed, we calculate the taxamt taking into account baseTax amount
              if (taxRate.get('baseAmount') === 'LNATAX') {
                linerate = linerate.multiply(
                  rate.add(BigDecimal.prototype.ONE)
                );
              } else {
                linerate = linerate.add(rate);
              }
              baseTaxAmt = new BigDecimal(String(discountedGross)).add(
                new BigDecimal(String(baseTax.amount))
              );
              taxamt = taxamt.add(baseTaxAmt.multiply(rate));
              if (
                !(_.isNull(discountedGross) || _.isUndefined(discountedGross))
              ) {
                baseTaxdcAmt = new BigDecimal(String(discountedGross)).add(
                  new BigDecimal(String(baseTax.discAmount))
                );
                taxamtdc = taxamtdc.add(baseTaxdcAmt.multiply(rate));
              }
            } else {
              //if the baseTax of this tax have not been processed yet, we skip this tax till baseTax is processed.
              if (taxList.length === 1) {
                throw OB.I18N.getLabel('OBPOS_TaxCalculationError_Message');
              }
              return;
            }
          } else {
            linerate = linerate.add(rate);
            taxamt = taxamt.add(
              new BigDecimal(String(discountedGross)).multiply(rate)
            );
            if (
              !(_.isNull(discountedGross) || _.isUndefined(discountedGross))
            ) {
              taxamtdc = taxamtdc.add(
                new BigDecimal(
                  String(new BigDecimal(String(discountedGross)).multiply(rate))
                )
              );
            }
          }
          //We could have other taxes based on this, we save tha amount in case it is needed.
          taxeslineAux[taxId] = {};
          taxeslineAux[taxId].amount = new BigDecimal(
            String(discountedGross)
          ).multiply(rate);
          if (!(_.isNull(discountedGross) || _.isUndefined(discountedGross))) {
            taxeslineAux[taxId].discAmount = new BigDecimal(
              String(discountedGross)
            ).multiply(rate);
          }
        } else {
          linetaxid = taxRate.get('id');
        }
        //Remove processed tax from the collection
        sortedTaxCollection.push(taxRate);
        taxList.splice(taxList.indexOf(taxRate), 1);
      };
      var collClone = coll.slice(0);
      while (collClone.length > 0) {
        //Iterate taxes until the collection is empty
        _.each(collClone, callbackTaxRate);
      }

      line.get('sortedTaxCollection').push(sortedTaxCollection);
      line.get('linerateWithPrecision').push(linerate);

      // the line net price is calculated by doing price*price/(price*rate), as it is done in
      // the database function c_get_net_price_from_gross
      var linenet,
        roundedLinePriceNet,
        linepricenet,
        pricenet,
        discountedNet,
        discountedLinePriceNet,
        roundedDiscountedLinePriceNet;
      if (discountedGross === 0) {
        linenet = 0;
        linepricenet = new BigDecimal('0');
        roundedLinePriceNet = 0;
      } else {
        linenet = new BigDecimal(String(discountedGross))
          .multiply(new BigDecimal(String(discountedGross)))
          .divide(
            new BigDecimal(String(taxamt)),
            20,
            BigDecimal.prototype.ROUND_HALF_UP
          );
        linepricenet =
          line.get('qty') === 0
            ? new BigDecimal('0')
            : linenet.divide(
                new BigDecimal(String(line.get('qty'))),
                20,
                BigDecimal.prototype.ROUND_HALF_UP
              );
        //round and continue with rounded values
        linenet = OB.DEC.toNumber(linenet);
        roundedLinePriceNet = OB.DEC.toNumber(linepricenet);
      }

      if (!line.get('tax')) {
        line.set('tax', linetaxid, {
          silent: true
        });
      }
      line.set({
        taxAmount: OB.DEC.add(
          line.get('taxAmount'),
          OB.DEC.sub(discountedGross, linenet)
        ),
        net: OB.DEC.add(line.get('net'), linenet),
        pricenet: OB.DEC.add(line.get('pricenet'), roundedLinePriceNet),
        linerate: linerate
      });

      //We follow the same formula of function c_get_net_price_from_gross to compute the discounted net
      if (!(_.isNull(discountedGross) || _.isUndefined(discountedGross))) {
        if (taxamtdc && OB.DEC.toNumber(taxamtdc) !== 0) {
          discountedNet = new BigDecimal(String(discountedGross))
            .multiply(new BigDecimal(String(discountedGross)))
            .divide(
              new BigDecimal(String(taxamtdc)),
              20,
              BigDecimal.prototype.ROUND_HALF_UP
            );
          discountedLinePriceNet =
            line.get('qty') === 0
              ? new BigDecimal('0')
              : discountedNet.divide(
                  new BigDecimal(String(line.get('qty'))),
                  20,
                  BigDecimal.prototype.ROUND_HALF_UP
                );
          roundedDiscountedLinePriceNet = OB.DEC.toNumber(
            discountedLinePriceNet
          );
          //In advance we will work with rounded prices
          discountedNet = OB.DEC.toNumber(discountedNet);
          pricenet = roundedDiscountedLinePriceNet; //discounted rounded NET unit price
          //pricenet = new BigDecimal(String(discountedGross)).multiply(new BigDecimal(String(discountedGross))).divide(taxamtdc, 20, BigDecimal.prototype.ROUND_HALF_UP).divide(new BigDecimal(String(element.get('qty'))), 20, BigDecimal.prototype.ROUND_HALF_UP);
        } else {
          //taxamtdc === 0
          discountedNet = 0;
          pricenet = 0;
        }
      } else {
        //net unit price (rounded)
        pricenet = roundedLinePriceNet; // 2 decimals properly rounded.
        discountedNet = OB.DEC.mul(
          pricenet,
          new BigDecimal(String(line.get('qty')))
        );
      }
      line.set(
        'discountedNet',
        OB.DEC.add(line.get('discountedNet'), discountedNet),
        {
          silent: true
        }
      );
      if (line.get('isBom')) {
        line.get('bomNets').push(discountedNet);
      }

      // second calculate tax lines.
      var taxesline = {};
      var auxNet;
      var callbackTaxLinesCreate = function(taxRate, taxIndex, taxList) {
        auxNet = discountedNet;
        if (!taxRate.get('summaryLevel')) {
          var taxId = taxRate.get('id');
          var rate = new BigDecimal(String(taxRate.get('rate')));
          rate = rate.divide(
            new BigDecimal('100'),
            20,
            BigDecimal.prototype.ROUND_HALF_UP
          );
          if (!taxRate.get('cascade') && taxRate.get('taxBase')) {
            var baseTax = taxesline[taxRate.get('taxBase')];
            if (!_.isUndefined(baseTax)) {
              //if the baseTax of this tax have been processed, we skip this tax till baseTax is processed.
              auxNet = OB.DEC.add(baseTax.net, baseTax.amount);
            } else {
              //if the baseTax of this tax have not been processed yet, we skip this tax till baseTax is processed.
              if (taxList.length === 1) {
                throw OB.I18N.getLabel('OBPOS_TaxCalculationError_Message');
              }
              return;
            }
          }

          var amount = OB.DEC.mul(auxNet, rate);
          var exactAmount = new BigDecimal(String(auxNet)).multiply(rate);

          taxesline[taxId] = {};
          taxesline[taxId].name = taxRate.get('name');
          taxesline[taxId].rate = taxRate.get('rate');
          taxesline[taxId].net = auxNet;
          taxesline[taxId].amount = amount;
          taxesline[taxId].exactAmount = exactAmount;
        }
        //Remove processed tax from the collection
        taxList.splice(taxList.indexOf(taxRate), 1);
      };
      collClone = coll.slice(0);
      while (collClone.length > 0) {
        //Iterate taxes until the collection is empty
        _.each(collClone, callbackTaxLinesCreate);
      }

      // We need to make a final adjustment: we will sum all the tax lines,
      // and if the net amount of the line plus this sum is not equal to the gross,
      // we will adjust the tax line with the greatest variance taking into account
      // if the adjustment is positive or negative
      var summedTaxAmt = 0;
      var expectedGross =
        _.isNull(discountedGross) || _.isUndefined(discountedGross)
          ? orggross
          : discountedGross;
      _.each(coll, function(taxRate) {
        if (!taxRate.get('summaryLevel')) {
          var taxId = taxRate.get('id');
          summedTaxAmt = OB.DEC.add(summedTaxAmt, taxesline[taxId].amount);
        }
      });
      var netandtax, adjustment;
      if (!(_.isNull(discountedGross) || _.isUndefined(discountedGross))) {
        netandtax = OB.DEC.add(discountedNet, summedTaxAmt);
      } else {
        netandtax = OB.DEC.add(
          OB.DEC.mul(pricenet, line.get('qty')),
          summedTaxAmt
        );
      }
      if (expectedGross !== netandtax) {
        //An adjustment is needed
        adjustment = OB.DEC.sub(expectedGross, netandtax);
        var selectedTax;
        _.each(coll, function(taxRate) {
          if (!taxRate.get('summaryLevel')) {
            var taxId = taxRate.get('id');
            //Choose ABS(taxAmt amount - (exactAmount + adjustment)) closest to 0
            if (
              selectedTax === undefined ||
              OB.DEC.abs(
                new BigDecimal(String(taxesline[taxId].amount)).subtract(
                  taxesline[taxId].exactAmount.add(
                    new BigDecimal(String(-adjustment))
                  )
                ),
                20
              ) <
                OB.DEC.abs(
                  new BigDecimal(
                    String(taxesline[selectedTax].amount)
                  ).subtract(
                    taxesline[selectedTax].exactAmount.add(
                      new BigDecimal(String(-adjustment))
                    )
                  ),
                  20
                )
            ) {
              selectedTax = taxId;
            }
          }
        });
        taxesline[selectedTax].amount = OB.DEC.add(
          taxesline[selectedTax].amount,
          adjustment
        ); // adjust the amout of taxline with greater amount
        navigateTaxesTree(coll, selectedTax, function(tax) {
          taxesline[tax.get('id')].net = OB.DEC.add(
            taxesline[tax.get('id')].net,
            adjustment
          ); // adjust the net of taxlines that are son of the taxline with greater amount
        });
      }

      // Accumulate to taxes line
      var accumtaxesline = line.get('taxLines');
      _.each(taxesline, function(taxline, taxid) {
        if (accumtaxesline[taxid]) {
          accumtaxesline[taxid].net = OB.DEC.add(
            accumtaxesline[taxid].net,
            taxline.net
          );
          accumtaxesline[taxid].amount = OB.DEC.add(
            accumtaxesline[taxid].amount,
            taxline.amount
          );
        } else {
          accumtaxesline[taxid] = {};
          accumtaxesline[taxid].name = taxline.name;
          accumtaxesline[taxid].rate = taxline.rate;
          accumtaxesline[taxid].net = taxline.net;
          accumtaxesline[taxid].amount = taxline.amount;
        }
      });

      // Calculate receipt taxes
      var taxes = receipt.get('taxes');
      _.each(coll, function(taxRate) {
        var taxId = taxRate.get('id');

        delete taxes[taxId];
        receipt.get('lines').each(function(line) {
          var taxLines = line.get('taxLines');
          if (!taxLines || !taxLines[taxId]) {
            return;
          }
          if (!taxRate.get('summaryLevel')) {
            if (taxes[taxId]) {
              taxes[taxId].net = OB.DEC.add(
                taxes[taxId].net,
                taxLines[taxId].net
              );
              taxes[taxId].amount = OB.DEC.add(
                taxes[taxId].amount,
                taxLines[taxId].amount
              ); // Calculate taxes At Line Level. If At Doc Level, adjustment is done at the end.
            } else {
              taxes[taxId] = {};
              taxes[taxId].name = taxRate.get('name');
              taxes[taxId].docTaxAmount = taxRate.get('docTaxAmount');
              taxes[taxId].rate = taxRate.get('rate');
              taxes[taxId].taxBase = taxRate.get('taxBase');
              taxes[taxId].cascade = taxRate.get('cascade');
              taxes[taxId].lineNo = taxRate.get('lineNo');
              taxes[taxId].net = taxLines[taxId].net;
              taxes[taxId].amount = taxLines[taxId].amount; // Initialize taxes At Line Level. If At Doc Level, adjustment is done at the end.
            }
          }
        });
      });
      _.each(coll, function(taxRate) {
        var taxId = taxRate.get('id');
        if (taxes[taxId]) {
          taxes[taxId].net = OB.DEC.toNumber(taxes[taxId].net);
          taxes[taxId].amount = OB.DEC.toNumber(taxes[taxId].amount);
        }
      });
    });
  };

  var showLineTaxError = function(receipt, line, reason) {
    var title = OB.I18N.getLabel('OBPOS_TaxNotFound_Header');
    OB.error(title + ':' + reason);
    line.set('hasTaxError', true, {
      silent: true
    });
    receipt.deleteLinesFromOrder([line], function() {
      OB.MobileApp.view.$.containerWindow
        .getRoot()
        .bubble('onErrorCalcLineTax', {
          line: line,
          reason: reason
        });
      OB.MobileApp.view.$.containerWindow.getRoot().doShowPopup({
        popup: 'OB_UI_MessageDialog',
        args: {
          header: title,
          message: reason
        }
      });
    });
  };

  var calcLineTaxesIncPrice = function(receipt, line) {
    // Initialize line properties
    delete line.changePrice;
    delete line.changeBackPrice;
    line.set(
      {
        taxLines: {},
        tax: null,
        taxUndo: line.get('tax') ? line.get('tax') : line.get('taxUndo'),
        taxAmount: OB.DEC.Zero,
        net: OB.DEC.Zero,
        pricenet: OB.DEC.Zero,
        discountedNet: OB.DEC.Zero,
        linerate: OB.DEC.One,
        lineratePrev: line.get('linerate')
      },
      {
        silent: true
      }
    );

    // Calculate product, orggross, and discountedGross.
    var product = line.get('product');
    var orggross = line.get('gross');
    var discountedGross = calculateDiscountedGross(line);

    return isTaxCategoryBOM(product.get('taxCategory'))
      .then(function(isbom) {
        if (isbom) {
          // Find the taxid
          return findTaxesCollection(
            receipt,
            line,
            product.get('taxCategory')
          ).then(function(coll) {
            // complete the taxid
            line.set('tax', coll.at(0).get('id'), {
              silent: true
            });

            // BOM, calculate taxes based on the products list
            return getProductBOM(product.get('id')).then(function(data) {
              if (data.nobomprice) {
                throw OB.I18N.getLabel('OBPOS_BOM_NoPrice');
              }
              distributeBOM(data, 'bomgross', orggross);
              if (!_.isNull(discountedGross)) {
                distributeBOM(data, 'bomdiscountedgross', discountedGross);
              }

              line.set('isBom', isbom);
              line.set('bomGross', []);
              line.set('bomNets', []);
              line.set('sortedTaxCollection', []);
              line.set('linerateWithPrecision', []);
              return Promise.all(
                _.map(data, function(productbom) {
                  line.get('bomGross').push(productbom.bomdiscountedgross);
                  return calcProductTaxesIncPrice({
                    receipt: receipt,
                    line: line,
                    taxCategory: productbom.bomtaxcategory,
                    orggross: productbom.bomgross,
                    discountedGross: productbom.bomdiscountedgross
                  });
                })
              );
            });
          });
        } else {
          // Not BOM, calculate taxes based on the line product
          line.set('sortedTaxCollection', []);
          line.set('linerateWithPrecision', []);

          return getTaxCategory({
            receipt: receipt,
            line: line,
            orggross: orggross,
            discountedGross: discountedGross
          }) //
            .then(getTaxCategoryName)
            .then(calcProductTaxesIncPrice);
        }
      })
      .then(function() {
        // Calculate linerate
        line.set(
          'linerate',
          orggross === 0 || line.get('net') === 0
            ? OB.DEC.One
            : OB.DEC.div(orggross, line.get('net')),
          {
            silent: true
          }
        );
      })
      .catch(function(reason) {
        showLineTaxError(receipt, line, reason);
      });
  };

  var calcTaxesIncPrice = function(receipt) {
    // Initialize receipt properties
    receipt.set(
      {
        taxes: {},
        net: OB.DEC.Zero
      },
      {
        silent: true
      }
    );

    // If the receipt is not editable avoid the calculation of taxes
    if (!receipt.get('isEditable') && !receipt.get('forceCalculateTaxes')) {
      return regenerateTaxesInfo(receipt);
    }

    // Calculate
    return Promise.all(
      _.map(receipt.get('lines').models, function(line) {
        return calcLineTaxesIncPrice(receipt, line);
      })
    ).then(function(value) {
      var generateTaxGroupId = function(line) {
        var id = '';
        _.each(line.sortedTaxCollection, function(taxRate) {
          id += taxRate.get('id');
        });
        return id;
      };

      //In order to compute taxes at header level, lines will be grouped by taxes affecting them
      //Once this is done, they will be summed and then taxes will be computed from the totals
      //To do this, the effective rate calculated when taxes at line level were applied will be used.
      var taxGroups = {};
      var lines = [],
        i;
      // If the number of original lines are not the same as the actual in the receipt, we interrupt the execution of taxes.
      if (value.length !== receipt.get('lines').length) {
        OB.debug('The number of original lines of the receipt has change!');
        return;
      }
      //First, lines inside BOMs will be separated as they can be affected by different taxes
      _.forEach(receipt.get('lines').models, function(line) {
        var lineObj;
        if (line.get('isBom')) {
          for (i = 0; i < line.get('bomNets').length; i++) {
            lineObj = {
              totalGross: line.get('bomGross')[i],
              discountedNet: line.get('bomNets')[i],
              sortedTaxCollection: line.get('sortedTaxCollection')[i],
              linerateWithPrecision: line.get('linerateWithPrecision')[i],
              line: line
            };
            lines.push(lineObj);
          }
        } else {
          lineObj = {
            totalGross: calculateDiscountedGross(line),
            discountedNet: line.get('discountedNet'),
            sortedTaxCollection: line.get('sortedTaxCollection')[0],
            linerateWithPrecision: line.get('linerateWithPrecision')[0],
            line: line
          };
          lines.push(lineObj);
        }
      });

      //Line groups will now be formed, by checking the taxes which were applied to each line.
      _.forEach(lines, function(line) {
        var taxGroupId = generateTaxGroupId(line);
        if (taxGroups[taxGroupId]) {
          taxGroups[taxGroupId].totalGross = OB.DEC.add(
            taxGroups[taxGroupId].totalGross,
            line.totalGross
          );
          taxGroups[taxGroupId].totalNet = OB.DEC.add(
            taxGroups[taxGroupId].totalNet,
            line.discountedNet
          );
          taxGroups[taxGroupId].lines.push(line.line);
        } else {
          var taxIds = [];
          _.each(line.taxlinescol, function(taxline, taxlineid) {
            taxIds.push(taxlineid);
          });
          taxGroups[taxGroupId] = {
            taxIds: taxIds,
            totalGross: line.totalGross,
            totalNet: line.discountedNet,
            sortedTaxCollection: line.sortedTaxCollection,
            linerateWithPrecision: line.linerateWithPrecision,
            lines: [line.line]
          };
        }
      });

      // Finally, taxes will be computed for each group.
      _.forEach(taxGroups, function(taxGroup) {
        var totalGross = taxGroup.totalGross;
        var totalNet = taxGroup.totalNet;
        var linerate = taxGroup.linerateWithPrecision;
        var taxRates = taxGroup.sortedTaxCollection;

        if (taxRates[0].get('docTaxAmount') !== 'D') {
          return;
        }

        var originalNet = OB.DEC.div(totalGross, linerate);
        var auxNet;
        _.forEach(taxRates, function(taxRate) {
          auxNet = originalNet;
          if (!taxRate.get('summaryLevel')) {
            var taxId = taxRate.get('id');
            var rate = new BigDecimal(String(taxRate.get('rate')));
            rate = rate.divide(
              new BigDecimal('100'),
              20,
              BigDecimal.prototype.ROUND_HALF_UP
            );
            if (!taxRate.get('cascade') && taxRate.get('taxBase')) {
              var baseTax = receipt.get('taxes')[taxRate.get('taxBase')];
              if (!_.isUndefined(baseTax)) {
                //if the baseTax of this tax have been processed, we skip this tax till baseTax is processed.
                auxNet = OB.DEC.add(baseTax.net, baseTax.amount);
              } else {
                //if the baseTax of this tax have not been processed yet, we skip this tax till baseTax is processed.
                return;
              }
            }

            var amount = OB.DEC.mul(auxNet, rate);
            var exactAmount = new BigDecimal(String(auxNet)).multiply(rate);

            if (!receipt.get('taxes')[taxId]) {
              receipt.get('taxes')[taxId] = {};
            }
            receipt.get('taxes')[taxId].name = taxRate.get('name');
            receipt.get('taxes')[taxId].rate = taxRate.get('rate');
            receipt.get('taxes')[taxId].net = auxNet;
            receipt.get('taxes')[taxId].amount = amount;
            receipt.get('taxes')[taxId].exactAmount = exactAmount;
          }
        });

        // Final adjustment
        // The base plus all the taxes must sum the gross, but due to rounding sometimes it doesn't
        // The highest tax will be adjusted so that everything matches
        var summedTaxAmt = 0;
        var expectedGross = totalGross;
        _.each(taxRates, function(taxRate) {
          if (!taxRate.get('summaryLevel')) {
            var taxId = taxRate.get('id');
            summedTaxAmt = OB.DEC.add(
              summedTaxAmt,
              receipt.get('taxes')[taxId].amount
            );
          }
        });
        var netandtax, adjustment, selectedTax;
        netandtax = OB.DEC.add(originalNet, summedTaxAmt);
        if (expectedGross !== netandtax) {
          //An adjustment is needed
          adjustment = OB.DEC.sub(expectedGross, netandtax);

          _.each(taxRates, function(taxRate) {
            if (!taxRate.get('summaryLevel')) {
              var taxId = taxRate.get('id');
              //Choose ABS(taxAmt amount - (exactAmount + adjustment)) closest to 0
              if (
                selectedTax === undefined ||
                OB.DEC.abs(
                  new BigDecimal(
                    String(receipt.get('taxes')[taxId].amount)
                  ).subtract(
                    receipt
                      .get('taxes')
                      [taxId].exactAmount.add(
                        new BigDecimal(String(-adjustment))
                      )
                  ),
                  20
                ) <
                  OB.DEC.abs(
                    new BigDecimal(
                      String(receipt.get('taxes')[selectedTax].amount)
                    ).subtract(
                      receipt
                        .get('taxes')
                        [selectedTax].exactAmount.add(
                          new BigDecimal(String(-adjustment))
                        )
                    ),
                    20
                  )
              ) {
                selectedTax = taxId;
              }
            }
          });
          receipt.get('taxes')[selectedTax].amount = OB.DEC.add(
            receipt.get('taxes')[selectedTax].amount,
            adjustment
          ); // adjust the amout of taxline with greater amount
          navigateTaxesTree(taxRates, selectedTax, function(tax) {
            receipt.get('taxes')[tax.get('id')].net = OB.DEC.add(
              receipt.get('taxes')[tax.get('id')].net,
              adjustment
            ); // adjust the net of taxlines that are son of the taxline with greater amount
          });
        }

        //As the base is recalculated from the totals, it may happen that the sum of the nets of each line now is
        //no longer equal to the base, and this is wrong. The highest net is adjusted so that everything matches.
        if (originalNet !== totalNet) {
          //Net of the lines does not sum the net of the final tax, so we need to adjust one of the net amounts of a line.
          var lineToAdjust = _.max(taxGroup.lines, function(line) {
            return Math.abs(line.get('discountedNet'));
          });
          var discountedNet = OB.DEC.add(
            lineToAdjust.get('discountedNet'),
            OB.DEC.sub(originalNet, totalNet)
          );
          lineToAdjust.set('discountedNet', discountedNet);
          // net amount of the line tax should be adjusted based on line net
          _.each(lineToAdjust.get('taxLines'), function(taxLine, taxLineId) {
            _.each(taxRates, function(taxRate, taxId) {
              if (
                taxRate.get('id') === taxLineId &&
                OB.UTIL.isNullOrUndefined(taxRate.get('taxBase'))
              ) {
                taxLine['net'] = discountedNet;
              }
            });
          });
          // line tax amount should be adjusted
          if (selectedTax && adjustment && adjustment !== 0) {
            lineToAdjust.get('taxLines')[selectedTax]['amount'] = OB.DEC.add(
              lineToAdjust.get('taxLines')[selectedTax]['amount'],
              adjustment
            );
          }
        }
      });

      receipt.set(
        'net',
        receipt.get('lines').reduce(function(memo, line) {
          return OB.DEC.add(memo, line.get('discountedNet'));
        }, 0)
      );
    });
  };

  var calcProductTaxesExcPrice = function(params) {
    var receipt = params.receipt;
    var line = params.line;
    var taxCategory = params.taxCategory;
    var linepricenet = params.linepricenet;
    var linenet = params.linenet;
    var discountedprice = params.discountedprice;
    var discountedNet = params.discountedNet;

    return findTaxesCollection(receipt, line, taxCategory).then(function(coll) {
      // First calculate the line rate.
      var linetaxid = coll.at(0).get('id');
      var validFromDate = coll.at(0).get('validFromDate');
      var fromCountryId = coll.at(0).get('country');
      var fromRegionId = coll.at(0).get('region');
      var toCountryId = coll.at(0).get('destinationCountry');
      var toRegionId = coll.at(0).get('destinationRegion');
      coll = _.filter(coll.models, function(taxRate) {
        return (
          taxRate.get('destinationCountry') === toCountryId &&
          taxRate.get('destinationRegion') === toRegionId &&
          taxRate.get('country') === fromCountryId &&
          taxRate.get('region') === fromRegionId &&
          taxRate.get('validFromDate') === validFromDate
        );
      });

      var discountedGross = new BigDecimal(String(discountedNet));
      var linegross = new BigDecimal(String(linenet));
      var pricenet =
        new BigDecimal(String(discountedprice)) ||
        new BigDecimal(String(linepricenet)); // 2 decimals properly rounded.
      var pricenetcascade = pricenet;

      // second calculate tax lines.
      var taxes = receipt.get('taxes');
      var taxesline = {};
      var callbackNotInclTax = function(taxRate, taxIndex, taxList) {
        var pricenetAux = pricenet;
        if (!taxRate.get('summaryLevel')) {
          var taxId = taxRate.get('id');
          var rate = getTaxRateNumber(taxRate.get('rate'));
          var net = OB.DEC.mul(pricenetAux, line.get('qty')); //=== discountedNet
          if (taxRate.get('cascade')) {
            linegross = linegross.multiply(rate.add(BigDecimal.prototype.ONE));
            discountedGross = discountedGross.add(
              new BigDecimal(
                OB.DEC.toNumber(discountedGross.multiply(rate)).toString()
              )
            );
            pricenetAux = pricenetcascade;
          } else if (taxRate.get('taxBase')) {
            var baseTax = taxesline[taxRate.get('taxBase')];
            if (!_.isUndefined(baseTax)) {
              //if the baseTax of this tax have been processed, we skip this tax till baseTax is processed.
              net = OB.DEC.add(
                OB.DEC.mul(pricenetAux, line.get('qty')),
                baseTax.amount
              );
              var baseAmount = new BigDecimal(String(linenet)).add(
                new BigDecimal(String(baseTax.amount))
              );
              linegross = linegross.add(
                baseAmount.multiply(new BigDecimal(String(rate)))
              );
              var discBaseAmount = new BigDecimal(String(discountedNet)).add(
                new BigDecimal(String(baseTax.amount))
              );
              discountedGross = discountedGross.add(
                discBaseAmount.multiply(new BigDecimal(String(rate)))
              );
            } else {
              //if the baseTax of this tax have not been processed yet, we skip this tax till baseTax is processed.
              if (taxList.length === 1) {
                throw OB.I18N.getLabel('OBPOS_TaxCalculationError_Message');
              }
              return;
            }
          } else {
            linegross = linegross.add(
              new BigDecimal(String(linenet)).multiply(
                new BigDecimal(String(rate))
              )
            );
            discountedGross = discountedGross.add(
              new BigDecimal(
                OB.DEC.toNumber(
                  new BigDecimal(String(discountedNet)).multiply(rate)
                ).toString()
              )
            );
          }

          var roundingLoses;
          var amount = OB.DEC.mul(net, rate);
          pricenetcascade = pricenetAux.multiply(
            rate.add(BigDecimal.prototype.ONE)
          );

          taxesline[taxId] = {};
          taxesline[taxId].name = taxRate.get('name');
          taxesline[taxId].rate = taxRate.get('rate');
          taxesline[taxId].net = net;
          taxesline[taxId].amount = amount;
          if (taxes[taxId]) {
            taxes[taxId].net = OB.DEC.add(taxes[taxId].net, net);
            if (discountedNet !== linenet) {
              roundingLoses = discountedprice
                .subtract(discountedprice)
                .multiply(new BigDecimal('2'));
              if (roundingLoses.compareTo(BigDecimal.prototype.ZERO) !== 0) {
                roundingLoses = OB.DEC.toNumber(roundingLoses);
                taxes[taxId].net = OB.DEC.add(taxes[taxId].net, roundingLoses);
              }
            }
            taxes[taxId].amount = OB.DEC.add(taxes[taxId].amount, amount);
          } else {
            taxes[taxId] = {};
            taxes[taxId].name = taxRate.get('name');
            taxes[taxId].rate = taxRate.get('rate');
            taxes[taxId].docTaxAmount = taxRate.get('docTaxAmount');
            taxes[taxId].net = net;
            if (discountedNet !== linenet) {
              //If we lost precision because the price that we are showing is not the real one
              //we correct this small number in tax net.
              roundingLoses = discountedprice
                .subtract(discountedprice)
                .multiply(new BigDecimal('2'));
              if (roundingLoses.compareTo(BigDecimal.prototype.ZERO) !== 0) {
                roundingLoses = OB.DEC.toNumber(roundingLoses);
                taxes[taxId].net = OB.DEC.add(taxes[taxId].net, roundingLoses);
              }
            }
            taxes[taxId].amount = amount;
          }
        } else {
          linetaxid = taxRate.get('id');
        }
        //Remove processed tax from the collection
        taxList.splice(taxList.indexOf(taxRate), 1);
      };
      var collClone = coll.slice(0);
      while (collClone.length > 0) {
        //Iterate taxes until the collection is empty
        _.each(collClone, callbackNotInclTax);
      }

      // Accumulate to taxes line
      var accumtaxesline = line.get('taxLines');
      _.each(taxesline, function(taxline, taxid) {
        if (accumtaxesline[taxid]) {
          accumtaxesline[taxid].net = OB.DEC.add(
            accumtaxesline[taxid].net,
            taxline.net
          );
          accumtaxesline[taxid].amount = OB.DEC.add(
            accumtaxesline[taxid].amount,
            taxline.amount
          );
        } else {
          accumtaxesline[taxid] = {};
          accumtaxesline[taxid].name = taxline.name;
          accumtaxesline[taxid].rate = taxline.rate;
          accumtaxesline[taxid].net = taxline.net;
          accumtaxesline[taxid].amount = taxline.amount;
        }
      });

      // Accumulate gross and discounted gross with the taxes calculated in this invocation.
      if (!line.get('tax')) {
        line.set('tax', linetaxid, {
          silent: true
        });
      }
      line.set(
        {
          gross: OB.DEC.add(
            line.get('gross'),
            OB.DEC.sub(OB.DEC.toNumber(linegross), linenet)
          ),
          discountedGross: OB.DEC.add(
            line.get('discountedGross'),
            OB.DEC.sub(OB.DEC.toNumber(discountedGross), discountedNet)
          )
        },
        {
          silent: true
        }
      );
    });
  };

  var calcLineTaxesExcPrice = function(receipt, line) {
    delete line.changePrice;
    delete line.changeBackPrice;
    line.set(
      {
        pricenet: line.get('price'),
        net: OB.DEC.mul(line.get('price'), line.get('qty')),
        linerate: OB.DEC.One,
        lineratePrev: line.get('linerate'),
        tax: null,
        taxUndo: line.get('tax') ? line.get('tax') : line.get('taxUndo'),
        taxAmount: OB.DEC.Zero,
        taxLines: {}
      },
      {
        silent: true
      }
    );

    var resultpromise;
    var product = line.get('product');
    if (
      line.get('ignoreTaxes') === true ||
      product.get('ignoreTaxes') === true
    ) {
      // No taxes calculation for this line.
      var taxLine = line.get('taxLines');
      taxLine[OB.MobileApp.model.get('terminal').taxexempid] = {
        amount: 0,
        rate: 0,
        net: line.get('net')
      };

      line.set(
        {
          tax: OB.MobileApp.model.get('terminal').taxexempid,
          discountedNet: line.get('net'),
          discountedNetPrice: new BigDecimal(String(line.get('price'))),
          gross: line.get('net'),
          discountedGross: line.get('net')
        },
        {
          silent: true
        }
      );

      resultpromise = Promise.resolve();
    } else {
      var linepricenet = line.get('price');
      var linenet = line.get('net');
      var discAmt = null;
      var discountedprice, discountedNet;
      if (
        line.get('qty') !== 0 &&
        line.get('promotions') &&
        line.get('promotions').length > 0
      ) {
        discAmt = new BigDecimal(String(line.get('net')));
        discAmt = line.get('promotions').reduce(function(memo, element) {
          return memo.subtract(
            new BigDecimal(String(element.actualAmt || element.amt || 0))
          );
        }, discAmt);
        discountedprice =
          line.get('qty') === 0
            ? new BigDecimal('0')
            : discAmt.divide(
                new BigDecimal(String(line.get('qty'))),
                20,
                BigDecimal.prototype.ROUND_HALF_UP
              );
        discountedNet = OB.DEC.toNumber(discAmt);
      } else {
        discountedprice = new BigDecimal(String(line.get('price')));
        discountedNet = linenet;
      }

      // Initialize line calculations
      line.set(
        {
          discountedNet: discountedNet,
          discountedNetPrice: OB.DEC.toNumber(discountedprice),
          gross: linenet,
          discountedGross: discountedNet
        },
        {
          silent: true
        }
      );

      resultpromise = isTaxCategoryBOM(product.get('taxCategory')).then(
        function(isbom) {
          if (isbom) {
            // Find the taxid
            return findTaxesCollection(
              receipt,
              line,
              product.get('taxCategory')
            ).then(function(coll) {
              // complete the taxid
              line.set('tax', coll.at(0).get('id'), {
                silent: true
              });

              // BOM, calculate taxes based on the products list
              return getProductBOM(product.get('id')).then(function(data) {
                distributeBOM(data, 'bomnet', linenet);
                distributeBOM(data, 'bomdiscountednet', discountedNet);
                distributeBOM(data, 'bomlinepricenet', linepricenet);

                return Promise.all(
                  _.map(data, function(productbom) {
                    return calcProductTaxesExcPrice({
                      receipt: receipt,
                      line: line,
                      taxCategory: productbom.bomtaxcategory,
                      linepricenet: productbom.bomlinepricenet,
                      linenet: productbom.bomnet,
                      discountedprice:
                        line.get('qty') === 0
                          ? new BigDecimal('0')
                          : new BigDecimal(
                              String(productbom.bomdiscountednet)
                            ).divide(
                              new BigDecimal(String(line.get('qty'))),
                              20,
                              BigDecimal.prototype.ROUND_HALF_UP
                            ),
                      discountedNet: productbom.bomdiscountednet
                    });
                  })
                );
              });
            });
          } else {
            // Not BOM, calculate taxes based on the line product
            return getTaxCategory({
              receipt: receipt,
              line: line,
              linepricenet: linepricenet,
              linenet: linenet,
              discountedprice: discountedprice,
              discountedNet: discountedNet
            }) //
              .then(calcProductTaxesExcPrice);
          }
        }
      );
    }

    return resultpromise
      .then(function() {
        // Calculate linerate and taxamount
        line.set(
          {
            linerate:
              line.get('gross') === 0 || line.get('net') === 0
                ? OB.DEC.One
                : OB.DEC.div(line.get('gross'), line.get('net')),
            taxAmount: OB.DEC.sub(
              line.get('discountedGross'),
              line.get('discountedNet')
            )
          },
          {
            silent: true
          }
        );
      })
      .catch(function(reason) {
        showLineTaxError(receipt, line, reason);
      });
  };

  var calcTaxesExcPrice = function(receipt) {
    var frozenLines = new OB.Collection.OrderLineList(
      receipt.get('lines').models.slice()
    );

    // Initialize receipt
    receipt.set(
      'taxes',
      {},
      {
        silent: true
      }
    );

    // If the receipt is not editable avoid the calculation of taxes
    if (!receipt.get('isEditable') && !receipt.get('forceCalculateTaxes')) {
      return regenerateTaxesInfo(receipt);
    }

    // Calculate
    return Promise.all(
      _.map(frozenLines.models, function(line) {
        return calcLineTaxesExcPrice(receipt, line);
      })
    ).then(function() {
      // Ajust gross if net + taxes !== gross
      var newAmount;
      var adjustAmount;
      var candidateLine = null;
      var candidateTaxLineAmount = OB.DEC.Zero;
      var totalNet = OB.DEC.Zero;

      // Calculate taxes
      _.forEach(receipt.get('taxes'), function(tax, taxid) {
        if (tax.docTaxAmount === 'D') {
          // Adjust taxes in case of taxes at doc level...
          newAmount = OB.DEC.mul(tax.net, getTaxRateNumber(tax.rate));
          adjustAmount = OB.DEC.sub(tax.amount, newAmount);
          tax.amount = newAmount;

          if (adjustAmount !== 0) {
            // move te adjustment to a net line...
            frozenLines.forEach(function(line) {
              _.each(line.get('taxLines'), function(taxline, taxlineid) {
                if (
                  taxid === taxlineid &&
                  Math.sign(newAmount) === Math.sign(taxline.amount)
                ) {
                  // Candidate for applying the adjustment
                  if (OB.DEC.abs(taxline.amount) > candidateTaxLineAmount) {
                    candidateTaxLineAmount = OB.DEC.abs(candidateTaxLineAmount);
                    candidateLine = line;
                  }
                }
              });
            });
            // if line found to make adjustments, apply.
            if (candidateLine) {
              candidateLine.set(
                {
                  discountedGross: OB.DEC.sub(
                    candidateLine.get('discountedGross'),
                    adjustAmount
                  ),
                  gross: OB.DEC.sub(candidateLine.get('gross'), adjustAmount)
                },
                {
                  silent: true
                }
              );
            }
          }
        }
      });

      frozenLines.forEach(function(line) {
        totalNet = OB.DEC.add(totalNet, line.get('discountedNet'));
      });

      receipt.set('net', totalNet, {
        silent: true
      });
    });
  };

  // Just calc the right function depending on prices including or excluding taxes
  var calcTaxes = function(receipt) {
    if (receipt.get('priceIncludesTax')) {
      return calcTaxesIncPrice(receipt).then(function() {
        // Does any receipt line require a price change?
        var recalculate = false;
        receipt.get('lines').forEach(function(line) {
          if (line.changePrice) {
            line.set(
              {
                price: OB.DEC.mul(
                  OB.DEC.div(line.get('price'), line.get('lineratePrev')),
                  line.get('linerate')
                ),
                taxChangedPrice: line.get('price')
              },
              {
                silent: true
              }
            );
            recalculate = true;
          } else if (line.changeBackPrice) {
            line.set('price', line.get('taxChangedPrice'), {
              silent: true
            });
            line.unset('taxChangedPrice', {
              silent: true
            });
            recalculate = true;
          }
        });

        // Recalculate taxes based on the new price...
        if (recalculate) {
          return calcTaxesIncPrice(receipt);
        }
      });
    } else {
      return calcTaxesExcPrice(receipt);
    }
  };

  OB.DATA.OrderTaxes = function(modelOfAnOrder) {
    modelOfAnOrder.calculateTaxes = function(callback) {
      var me = this;
      calcTaxes(me).then(function() {
        me.trigger('paintTaxes');
        callback();
      });
    };
  };

  OB.DATA.OrderFindTaxes = function(receipt, line, taxCategory) {
    return findTaxesCollection(receipt, line, taxCategory);
  };

  OB.DATA.LineTaxesIncPrice = function(receipt, line) {
    return calcLineTaxesIncPrice(receipt, line);
  };

  OB.DATA.LineTaxesExcPrice = function(receipt, line) {
    return calcLineTaxesExcPrice(receipt, line);
  };
})();
