/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.0  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html 
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License. 
 * The Original Code is Openbravo ERP. 
 * The Initial Developer of the Original Code is Openbravo SL 
 * All portions are Copyright (C) 2001-2006 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
*/

package org.openbravo.erpCommon.ws.externalSales;

import java.text.SimpleDateFormat;
import java.util.Vector;

import org.openbravo.database.ConnectionProviderImpl;
import org.openbravo.base.HttpBaseServlet;
import org.openbravo.erpCommon.utility.SequenceIdData;

import org.apache.log4j.Logger ;


public class ExternalSalesImpl implements ExternalSales{
    protected static ConnectionProviderImpl pool;
    protected static String javaDateFormat;
    static Logger log4j = Logger.getLogger(ExternalSales.class);

    /** Creates a new instance of ExternalSalesImpl */
    public ExternalSalesImpl() {
      if (log4j.isDebugEnabled()) log4j.debug("ExternalSales");
      initPool();
    }
    
    private boolean access(String username, String password) {
     try {
      	return !ExternalSalesOrderData.access(pool, username,password).equals("0");
      } catch (Exception e) {
        return false;
      }
      
    }

		// FIXME: This should be removed
   public String test2(String p){
    return p;
    }
   public String test(){
     return "testing...";
   }

    public Product[] getProductsCatalog( int ClientID, int organizationId, int salesChannel, String username, String password)
    {
    if (!access(username, password)) {
      if (log4j.isDebugEnabled()) log4j.debug("Access denied for user: " + username + " - password: " + password); 
       return null;
    }
    if (log4j.isDebugEnabled()) log4j.debug("getProductsCatalog"+" ClientID "+ClientID+" organizationId "+organizationId+" salesChannel "+ salesChannel);
      try {

        //Select
        ExternalSalesProductData[] data = ExternalSalesProductData.select(pool,  Integer.toString(ClientID), Integer.toString(salesChannel));


        if (data != null && data.length > 0){
          int i = 0;
          if (log4j.isDebugEnabled()) log4j.debug("data.length "+data.length);
          Product [] products = new org.openbravo.erpCommon.ws.externalSales.Product[data.length];

          while (i<data.length) {
            if (log4j.isDebugEnabled()) log4j.debug("getProductsCatalog data[i].id "+data[i].id+" data[i].name "+data[i].name);
            products[i] = new org.openbravo.erpCommon.ws.externalSales.Product();
            products[i].setId((Integer.valueOf(data[i].id)).intValue());
            products[i].setName(data[i].name);
            products[i].setNumber(data[i].number1);
            products[i].setDescription(data[i].description);
            products[i].setListPrice((Double.valueOf(data[i].listPrice)).doubleValue());
            products[i].setPurchasePrice((Double.valueOf(data[i].purchasePrice)).doubleValue());
            Tax tax = new org.openbravo.erpCommon.ws.externalSales.Tax();
            tax.setId((Integer.valueOf(data[i].taxId)).intValue());
            tax.setName(data[i].taxName);
            tax.setPercentage((Double.valueOf(data[i].percentage)).doubleValue());
            products[i].setTax(tax);
            products[i].setImageUrl(data[i].imageUrl);
            products[i].setEan(data[i].ean);
            Category category = new org.openbravo.erpCommon.ws.externalSales.Category();
            category.setId((Integer.valueOf(data[i].mProductCategoryId)).intValue());
            category.setName(data[i].mProductCategoryName);
            category.setDescription(data[i].mProductCategoryDescription);
            products[i].setCategory(category);
            i++;
          }
          return products;
        }
        else if (data != null && data.length == 0){ //In case that don't return data, return an empty array
          if (log4j.isDebugEnabled()) log4j.debug("data.length "+data.length);
          Product [] products = new org.openbravo.erpCommon.ws.externalSales.Product[0];
          return products;
        }
      } catch (Exception e) {
          log4j.error("Error : getProductsCatalog");
          e.printStackTrace();
      } 

      destroyPool();
      return null;
    }

    public void uploadOrders(int ClientID, int organizationId, int salesChannel, Order[] newOrders, String username, String password)
    {
    if (!access(username, password)) {
       if (log4j.isDebugEnabled()) log4j.debug("Access denied"); 
       return;
    }

    try {

    if (log4j.isDebugEnabled()) log4j.debug("uploadOrders"+" ClientID "+ClientID+"organizationId "+organizationId+" sales channel"+salesChannel+" order 1 "+newOrders[0].getOrderId());
      initPool();
      int i = 0;
      while (newOrders != null && i < newOrders.length) {

          ExternalSalesIOrderData[] data = ExternalSalesIOrderData.set();

          //Reading default parameters
          ExternalSalesData[] externalPOS = ExternalSalesData.select(pool, Integer.toString(ClientID), Integer.toString(organizationId), Integer.toString(salesChannel));

          if (externalPOS != null && externalPOS.length >0) {
            data[0].adClientId = externalPOS[0].adClientId;
            data[0].adOrgId = externalPOS[0].adOrgId;
            data[0].salesrepId = externalPOS[0].salesrepId;
            data[0].mShipperId = externalPOS[0].mShipperId;
            data[0].mPricelistId = externalPOS[0].mPricelistId;
            data[0].cBpartnerId = externalPOS[0].cBpartnerId;
            data[0].cDoctypeId = externalPOS[0].cDoctypeId;
            data[0].mWarehouseId = externalPOS[0].mWarehouseId;
            data[0].cBpartnerLocationId = externalPOS[0].cBpartnerLocationId;
            data[0].billtoId = externalPOS[0].billtoId;
            data[0].performPost = externalPOS[0].performPost;
          }

          if (newOrders[i].getOrderId() != null)
          {
            data[0].orderReferenceno = newOrders[i].getOrderId().getDocumentNo();
            SimpleDateFormat dateFormat = new SimpleDateFormat(javaDateFormat); 
            data[0].dateordered = ""+dateFormat.format(newOrders[i].getOrderId().getDateNew());
            data[0].dateTimeFormat = javaDateFormat;
          }
          if (newOrders[i].getBusinessPartner() != null)
          {
            data[0].bpartnervalue = newOrders[i].getBusinessPartner().getId();
            data[0].name = newOrders[i].getBusinessPartner().getName();
            data[0].countrycode = newOrders[i].getBusinessPartner().getCountry();
            data[0].regionname = newOrders[i].getBusinessPartner().getRegion();
            data[0].city = newOrders[i].getBusinessPartner().getCity();
            data[0].postal = newOrders[i].getBusinessPartner().getPostal();
            data[0].address1 = newOrders[i].getBusinessPartner().getAddress1();
            data[0].address2 = newOrders[i].getBusinessPartner().getAddress2();
          }
          int k = 1;
          if (newOrders[i].getPayment() != null)
          {
            //At this time we only permit two different paymentrule. 
            //Second payment will sumaryze the rest of payments
            //This could change in the future 
            if (newOrders[i].getPayment() != null && newOrders[i].getPayment().length>= 1) {
              data[0].paymentamount1 = Double.toString(newOrders[i].getPayment()[0].getAmount());
              data[0].paymentrule1 = newOrders[i].getPayment()[0].getPaymentType();
            }
            int amount = 0;
            while (newOrders[i].getPayment() != null && k < newOrders[i].getPayment().length) {
              amount += newOrders[i].getPayment()[1].getAmount();
              data[0].paymentrule2 = newOrders[i].getPayment()[1].getPaymentType();
              k++;
            }
            data[0].paymentamount2 = Integer.toString(amount);
          }
          int j = 0;
          if (newOrders[i].getLines() != null)
          {
            //Insert lines
            while (newOrders[i].getLines() != null && j < newOrders[i].getLines().length) {
              data[0].mProductId = Integer.toString(newOrders[i].getLines()[j].getProductId());
              data[0].qtyordered = Double.toString(newOrders[i].getLines()[j].getUnits());
              data[0].priceactual = ""+newOrders[i].getLines()[j].getPrice();
              data[0].cTaxId = Integer.toString(newOrders[i].getLines()[j].getTaxId());
              String sequence = SequenceIdData.getSequence(pool, "I_Order", Integer.toString(ClientID));
              data[0].iOrderId = sequence;
              if (log4j.isDebugEnabled()) log4j.debug("sequence"+data[0].iOrderId+" data[0].paymentamount1"+data[0].paymentamount1+" data[0].paymentrule1"+data[0].paymentrule1+
                                               " data[0].paymentamount2"+data[0].paymentamount2+" data[0].paymentrule2"+data[0].paymentrule2);
              data[0].insert(pool);
              j++;
            }
          }
          else{
            String sequence = SequenceIdData.getSequence(pool, "I_ORDER", Integer.toString(ClientID));
            data[0].iOrderId = sequence;
            if (log4j.isDebugEnabled()) log4j.debug("sequence"+data[0].iOrderId+" data[0].paymentamount1"+data[0].paymentamount1+" data[0].paymentrule1"+data[0].paymentrule1+
                                               " data[0].paymentamount2"+data[0].paymentamount2+" data[0].paymentrule2"+data[0].paymentrule2);
            data[0].insert(pool);
          }
        i++;
        }
        } catch (Exception e) {
            log4j.error("Error : uploadOrders");
            e.printStackTrace();
      }
      destroyPool();
    }

    public Order[] getOrders(int ClientID, int organizationId, OrderIdentifier[] orderIds, String username, String password)
    {
    if (!access(username, password)) {
       if (log4j.isDebugEnabled()) log4j.debug("Access denied"); 
       return null;
    }

    if (log4j.isDebugEnabled()) log4j.debug("getOrders");
      SimpleDateFormat dateFormat = new SimpleDateFormat(javaDateFormat); 

      initPool();
      Vector<Order> vOrders = new Vector<Order>();
      Order[] orders = null;

      int cont = 0;
      while (orderIds != null && cont < orderIds.length)
      {
        if (log4j.isDebugEnabled()) log4j.debug("ClientID "+ClientID+" organizationId "+organizationId+" orderIds "+ orderIds[cont].getDocumentNo()+" - "+dateFormat.format(orderIds[cont].getDateNew()).toString());

        try {
          //Select

          ExternalSalesOrderData[] data = ExternalSalesOrderData.select(pool, Integer.toString(ClientID), dateFormat.format(orderIds[cont].getDateNew()).toString(), orderIds[cont].getDocumentNo());
          if ((data == null) || (data.length == 0)) 
            data = ExternalSalesOrderData.selectIOrder(pool, Integer.toString(ClientID), dateFormat.format(orderIds[cont].getDateNew()).toString(), orderIds[cont].getDocumentNo());
          
          if (data != null && data.length > 0){
            if (log4j.isDebugEnabled()) log4j.debug("data.length "+data.length);
            Order order = new org.openbravo.erpCommon.ws.externalSales.Order();

            int i = 0;
            while (i<data.length) {
              if (log4j.isDebugEnabled()) log4j.debug("getOrders data[i].id "+data[i].id);
              OrderIdentifier orderIdentifier = new org.openbravo.erpCommon.ws.externalSales.OrderIdentifier();
              orderIdentifier.setDocumentNo(orderIds[cont].getDocumentNo());
              orderIdentifier.setDateNew(orderIds[cont].getDateNew());
              order.setOrderId(orderIdentifier);
              
              ExternalSalesOrderData[] dataLines = null;
              if ((data[i].id != null) && (!data[i].id.equals(""))){
                dataLines = ExternalSalesOrderData.selectLines(pool, Integer.toString(ClientID), data[i].id);
              } else {
                if (log4j.isDebugEnabled()) log4j.debug("ClientID "+Integer.toString(ClientID)+" orderIds "+ orderIds[cont].getDocumentNo()+" - "+dateFormat.format(orderIds[cont].getDateNew()).toString());
                dataLines = ExternalSalesOrderData.selectLinesIOrder(pool, Integer.toString(ClientID), dateFormat.format(orderIds[cont].getDateNew()).toString(), orderIds[cont].getDocumentNo());
              }
              
              OrderLine [] orderLines = null;
              if (dataLines != null && dataLines.length > 0){
                if (log4j.isDebugEnabled()) log4j.debug("getOrders dataLines.length "+dataLines.length);
                orderLines = new org.openbravo.erpCommon.ws.externalSales.OrderLine[dataLines.length];
                int j = 0;
                while (j<dataLines.length) {
                  OrderLine orderLine = new org.openbravo.erpCommon.ws.externalSales.OrderLine();
                  orderLine.setOrderLineId((!dataLines[j].orderLineId.equals(""))?(Integer.valueOf(dataLines[j].orderLineId)).intValue():0);
                  orderLine.setProductId((Integer.valueOf(dataLines[j].productId)).intValue());
                  orderLine.setUnits((Double.valueOf(dataLines[j].units)).doubleValue());
                  orderLine.setPrice((Double.valueOf(dataLines[j].price)).doubleValue());
                  orderLine.setTaxId((Integer.valueOf(dataLines[j].taxId)).intValue());
                  orderLines[j] = orderLine;
                  j++;
                }
              }
              order.setLines(orderLines);
              order.setState((Integer.valueOf(data[i].status)).intValue());
              BPartner bpartner = new org.openbravo.erpCommon.ws.externalSales.BPartner();
              if (log4j.isDebugEnabled()) log4j.debug("data[i].bpartnervalue "+data[i].bpartnervalue+" data[i].cBpartnerName "+data[i].cBpartnerName);
              bpartner.setId(data[i].bpartnervalue);
              bpartner.setName(data[i].cBpartnerName);
              order.setBusinessPartner(bpartner);
              
              ExternalSalesOrderData[] dataPayments = null;
              if ((data[i].id != null) && (!data[i].id.equals("")))
                dataPayments = ExternalSalesOrderData.selectPayment(pool, Integer.toString(ClientID), data[i].id);
              else {
                if (log4j.isDebugEnabled()) log4j.debug("ClientID "+Integer.toString(ClientID)+" orderIds "+ orderIds[cont].getDocumentNo()+" - "+dateFormat.format(orderIds[cont].getDateNew()).toString());
                dataPayments = ExternalSalesOrderData.selectPaymentIOrder(pool, Integer.toString(ClientID), dateFormat.format(orderIds[cont].getDateNew()).toString(), orderIds[cont].getDocumentNo());
              }
              
              Payment [] payments = null;
              if (dataPayments != null && dataPayments.length > 0){
                if (log4j.isDebugEnabled()) log4j.debug("getOrders dataPayments.length "+dataPayments.length);
                payments = new org.openbravo.erpCommon.ws.externalSales.Payment[dataPayments.length];
                int k = 0;
                while (k<dataPayments.length) {
                  Payment payment = new org.openbravo.erpCommon.ws.externalSales.Payment();
                  payment.setAmount((Double.valueOf(dataPayments[k].amount)).doubleValue());
                  payment.setPaymentType(dataPayments[k].paymentrule);
                  payments[k] = payment;
                  k++;
                }
              }
              order.setPayment(payments);
              i++;
            }
            vOrders.addElement(order);
          }
        } catch (Exception e) {
            log4j.error("Error : getOrders");
            e.printStackTrace();
        }
        cont++;
      }
      orders = new Order[vOrders.size()];
      vOrders.copyInto(orders);
      destroyPool();
      return orders;
    }

    private void initPool () {
      if (log4j.isDebugEnabled()) log4j.debug("init");
       try{
         pool = HttpBaseServlet.getPoolWS();
         javaDateFormat = HttpBaseServlet.getJavaDateTimeFormat();
         log4j.info("Java Date Format : "+javaDateFormat);
       } catch (Exception e) {
          log4j.error("Error : initPool");
          e.printStackTrace();
       }
    }

    private void destroyPool() {
      if (log4j.isDebugEnabled()) log4j.debug("destroy");
    }

}
