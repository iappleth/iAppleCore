/*
 ************************************************************************************
 * Copyright (C) 2021 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
/**
 * @fileoverview Define utility functions for the Add Product action
 */

OB.App.StateAPI.Ticket.registerUtilityFunctions({
  /**
   * Load ticket information for ticket defined in the payload
   *
   * @param {object} payload - The payload with the ticket id or ticket documentNo which needs to be loaded
   *
   * @returns {object} the payload with the ticket information
   */
  async loadTicket(payload) {
    const data = await OB.App.Request.mobileServiceRequest(
      'org.openbravo.retail.posterminal.PaidReceipts',
      {
        orderid: payload.ticket.id,
        // If action was called without order id, we can specify the docNo to load the ticket
        documentNo: payload.ticket.id ? undefined : payload.ticket.documentNo,
        crossStore: payload.ticket.isCrossStore
      }
    );

    if (data.response.error) {
      throw new OB.App.Class.ActionCanceled({
        errorConfirmation: data.response.error.message
      });
    } else if (data.response.data[0].recordInImportEntry) {
      throw new OB.App.Class.ActionCanceled({
        errorConfirmation: 'OBPOS_ReceiptNotSynced',
        messageParams: [data.response.data[0].documentNo]
      });
    }

    return {
      ...payload,
      ticket: { ...data.response.data[0] }
    };
  },

  /**
   * Load business partner information for ticket defined in the payload
   *
   * @param {object} payload - The payload with the ticket for which business partner needs to be loaded
   *
   * @returns {object} the payload with the ticket including business partner information
   */
  async loadBusinessPartner(payload) {
    const isRemoteCustomer = OB.App.Security.hasPermission(
      'OBPOS_remote.customer'
    );
    const getBusinessPartnerFromBackoffice = async () => {
      try {
        const data = await OB.App.Request.mobileServiceRequest(
          'org.openbravo.retail.posterminal.master.LoadedCustomer',
          {
            parameters: {
              bpartnerId: { value: payload.ticket.bp },
              bpLocationId: { value: payload.ticket.bpLocId },
              bpBillLocationId:
                payload.ticket.bpLocId !== payload.ticket.bpBillLocId
                  ? { value: payload.ticket.bpBillLocId }
                  : undefined
            }
          }
        );
        if (data.response.data.length < 2) {
          throw new OB.App.Class.ActionCanceled({
            errorConfirmation: 'OBPOS_NoCustomerForPaidReceipt'
          });
        }
        const [businessPartner, ...locations] = data.response.data;
        return { ...businessPartner, locations };
      } catch (error) {
        throw new OB.App.Class.ActionCanceled({
          errorConfirmation: 'OBPOS_NoCustomerForPaidReceipt'
        });
      }
    };
    const getBusinessPartner = async () => {
      const getRemoteBusinessPartner = async () => {
        const remoteBusinessPartner = await OB.App.DAL.remoteGet(
          'BusinessPartner',
          payload.ticket.bp
        );
        return remoteBusinessPartner;
      };
      const getLocalBusinessPartner = async () => {
        const localBusinessPartner = await OB.App.MasterdataModels.BusinessPartner.withId(
          payload.ticket.bp
        );
        return localBusinessPartner;
      };
      const businessPartner =
        (isRemoteCustomer
          ? await getRemoteBusinessPartner()
          : await getLocalBusinessPartner()) ||
        (await getBusinessPartnerFromBackoffice());
      return businessPartner;
    };
    const getBusinessPartnerLocation = async () => {
      const getRemoteBusinessPartnerLocation = async () => {
        const remoteBusinessPartnerLocation =
          payload.ticket.bpLocId === payload.ticket.bpBillLocId
            ? await OB.App.DAL.remoteGet('BPLocation', payload.ticket.bpLocId)
            : await OB.App.DAL.remoteSearch('BPLocation', {
                remoteFilters: [
                  {
                    columns: ['id'],
                    operator: 'equals',
                    value: [payload.ticket.bpLocId, payload.ticket.bpBillLocId]
                  }
                ]
              });
        return Array.isArray(remoteBusinessPartnerLocation)
          ? remoteBusinessPartnerLocation
          : [remoteBusinessPartnerLocation];
      };
      const getLocalBusinessPartnerLocation = async () => {
        const localBusinessPartnerLocation =
          payload.ticket.bpLocId === payload.ticket.bpBillLocId
            ? await OB.App.MasterdataModels.BusinessPartnerLocation.withId(
                payload.ticket.bpLocId
              )
            : await OB.App.MasterdataModels.BusinessPartnerLocation.find(
                new OB.App.Class.Criteria()
                  .criterion(
                    'id',
                    [payload.ticket.bpLocId, payload.ticket.bpBillLocId],
                    'in'
                  )
                  .build()
              );
        return Array.isArray(localBusinessPartnerLocation)
          ? localBusinessPartnerLocation
          : [localBusinessPartnerLocation];
      };
      const businessPartnerLocation =
        (isRemoteCustomer
          ? await getRemoteBusinessPartnerLocation()
          : await getLocalBusinessPartnerLocation()) ||
        (await getBusinessPartnerFromBackoffice().locations);
      return businessPartnerLocation;
    };

    const newPayload = { ...payload };
    if (newPayload.ticket.externalBusinessPartnerReference) {
      newPayload.ticket.externalBusinessPartner = await OB.App.ExternalBusinessPartnerAPI.getBusinessPartner(
        newPayload.ticket.externalBusinessPartnerReference
      );
      newPayload.ticket.externalBusinessPartner = newPayload.ticket.externalBusinessPartner.getPlainObject();
    }
    newPayload.ticket.businessPartner = await getBusinessPartner();
    newPayload.ticket.businessPartner.locations =
      newPayload.ticket.businessPartner.locations ||
      (await getBusinessPartnerLocation());

    return newPayload;
  },

  /**
   * Load product information for each ticket line defined in the payload
   *
   * @param {object} payload - The payload with the ticket for which products need to be loaded
   *
   * @returns {object} the payload with the ticket including products information
   */
  async loadProducts(payload) {
    const isRemoteProduct = OB.App.Security.hasPermission(
      'OBPOS_remote.product'
    );
    const getProduct = async line => {
      const getRemoteProduct = async productId => {
        const remoteProduct = await OB.App.DAL.remoteGet('Product', productId);
        return remoteProduct;
      };
      const getLocalProduct = async productId => {
        const localProduct = await OB.App.MasterdataModels.Product.withId(
          productId
        );
        return localProduct;
      };
      const getProductFromBackoffice = async (lineId, productId) => {
        try {
          const data = await OB.App.Request.mobileServiceRequest(
            'org.openbravo.retail.posterminal.master.LoadedProduct',
            {
              salesOrderLineId: lineId,
              productId
            }
          );
          return data.response.data[0];
        } catch (error) {
          throw new OB.App.Class.ActionCanceled({
            errorConfirmation: 'OBPOS_NoReceiptLoadedText'
          });
        }
      };
      const product =
        (isRemoteProduct
          ? await getRemoteProduct(line.id)
          : await getLocalProduct(line.id)) ||
        (await getProductFromBackoffice(line.lineId, line.id));
      return product;
    };
    const getService = async product => {
      const getRemoteService = async () => {
        try {
          const data = await OB.App.Request.mobileServiceRequest(
            'org.openbravo.retail.posterminal.process.HasServices',
            {
              product: product.id,
              productCategory: product.productCategory,
              parameters: {
                terminalTime: new Date(),
                terminalTimeOffset: new Date().getTimezoneOffset()
              },
              remoteFilters: [
                {
                  columns: [],
                  operator: 'filter',
                  value: 'OBRDM_DeliveryServiceFilter',
                  params: [false]
                }
              ]
            }
          );
          return data.response.data.hasservices;
        } catch (error) {
          return false;
        }
      };
      const getLocalService = async () => {
        try {
          const criteria = await OB.App.StandardFilters.Services.apply({
            productId: product.productId,
            productCategory: product.productCategory
          });
          const data = await OB.App.MasterdataModels.Product.find(
            criteria.criterion('obrdmIsdeliveryservice', false).build()
          );
          return data.length > 0;
        } catch (error) {
          return false;
        }
      };

      const service = isRemoteProduct
        ? await getRemoteService()
        : await getLocalService();
      return service;
    };

    const lines = await Promise.all(
      payload.ticket.receiptLines.map(async line => {
        const product = await getProduct(line);
        const hasRelatedServices =
          line.qty <= 0 || product.productType === 'S'
            ? false
            : await getService(product);
        product.img = undefined;
        return { ...line, id: line.lineId, product, hasRelatedServices };
      })
    );
    return { ...payload, ticket: { ...payload.ticket, receiptLines: lines } };
  },

  /**
   * Adds business partner information as needed by ticket model to the ticket defined as parameter
   *
   * @param {object} payload - The ticket for which business partner information needs to be added
   *
   * @returns {object} the ticket with the business partner information
   */
  addBusinessPartner(ticket) {
    const shippingLocation = ticket.businessPartner.locations[0];
    const invoicingLocation = ticket.businessPartner.locations[1];
    return {
      ...ticket,
      businessPartner: {
        ...ticket.businessPartner,
        shipLocId: shippingLocation.id,
        shipLocName: shippingLocation.name,
        shipPostalCode: shippingLocation.postalCode,
        shipCityName: shippingLocation.cityName,
        shipCountryId: shippingLocation.countryId,
        shipCountryName: shippingLocation.countryName,
        shipRegionId: shippingLocation.regionId,
        locId: (invoicingLocation || shippingLocation).id,
        locName: (invoicingLocation || shippingLocation).name,
        postalCode: (invoicingLocation || shippingLocation).postalCode,
        cityName: (invoicingLocation || shippingLocation).cityName,
        countryName: (invoicingLocation || shippingLocation).countryName,
        regionId: (invoicingLocation || shippingLocation).regionId,
        locationModel: shippingLocation,
        locationBillModel: invoicingLocation
      }
    };
  }
});
