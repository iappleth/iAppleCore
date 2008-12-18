/*
 ******************************************************************************
 * The contents of this file are subject to the   Compiere License  Version 1.1
 * ("License"); You may not use this file except in compliance with the License
 * You may obtain a copy of the License at http://www.compiere.org/license.html
 * Software distributed under the License is distributed on an  "AS IS"  basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for
 * the specific language governing rights and limitations under the License.
 * The Original Code is                  Compiere  ERP & CRM  Business Solution
 * The Initial Developer of the Original Code is Jorg Janke  and ComPiere, Inc.
 * Portions created by Jorg Janke are Copyright (C) 1999-2001 Jorg Janke, parts
 * created by ComPiere are Copyright (C) ComPiere, Inc.;   All Rights Reserved.
 * Contributor(s): Openbravo SL
 * Contributions are Copyright (C) 2001-2008 Openbravo S.L.
 ******************************************************************************
*/
package org.openbravo.erpCommon.ad_process;

import org.openbravo.erpCommon.businessUtility.*;
import org.openbravo.erpCommon.reference.*;
import org.openbravo.erpCommon.ad_actionButton.*;
import org.openbravo.erpCommon.ad_callouts.SEOrderBPartnerData;
import org.openbravo.erpCommon.utility.*;
import org.openbravo.exception.*;
import org.openbravo.base.secureApp.VariablesSecureApp;
import java.sql.*;
import java.math.BigDecimal;
import javax.servlet.*;
import java.io.IOException;
import org.apache.log4j.Logger ;

// imports for transactions
import org.openbravo.database.ConnectionProvider;
import java.sql.Connection;


public class ImportOrder extends ImportProcess {
  static Logger log4j = Logger.getLogger(ImportOrder.class);

  //static int total = 0;
  private int totalProcessed = 0;

  private String m_AD_Process_ID = "";
  private String m_Record_ID = "";
  private boolean m_deleteOldImported;
  private boolean m_processOrders; 

  public ImportOrder(ConnectionProvider conn, String AD_Process_ID, String recordId, boolean deleteOld, boolean processOrders) {
    super(conn);
    m_AD_Process_ID = AD_Process_ID;
    m_Record_ID = recordId;
    m_deleteOldImported = deleteOld;
    m_processOrders = processOrders; 
  }

  protected String getAD_Process_ID() {
    return m_AD_Process_ID;
  }

  protected String getRecord_ID() {
    return m_Record_ID;
  }

  protected void createInstanceParams(VariablesSecureApp vars) throws ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Creating parameters");
  }

  protected OBError doIt(VariablesSecureApp vars) throws ServletException {
	OBError myError = new OBError();
	
    ConnectionProvider conn = null;
    Connection con = null;
    try {
      int no = 0;
      conn = getConnection();
      con = conn.getTransactionConnection();
      if(m_deleteOldImported) {
        no = ImportOrderData.deleteOld(con, conn, getAD_Client_ID());
        if (log4j.isDebugEnabled()) log4j.debug("Delete Old Imported = " + no);
      }
      // Set Client, Org, IsActive, Created/Updated
      no = ImportOrderData.updateRecords(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("ImportOrder updated = " + no);
      no = ImportOrderData.updateInvalidVendor(con, conn, getAD_Org_ID(), getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Invalid vendor errors = " + no);
      // Invalid organization
      no = ImportOrderData.updateRecordsError(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Invalid organization errors = " + no);
      // Document Type - PO - SO
      no = ImportOrderData.updateDocTypePO(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated DocTypePO = " + no);
      no = ImportOrderData.updateDocTypeSO(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated DocTypeSO = " + no);
      no = ImportOrderData.updateDocType(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated DocType = " + no);
      no = ImportOrderData.updateDocTypeError(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Invalid DocType errors = " + no);
      // DocType Default
      no = ImportOrderData.updateDocTypePODefault(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated DocTypePO default = " + no);
      no = ImportOrderData.updateDocTypeSODefault(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated DocTypeSO default = " + no);
      no = ImportOrderData.updateDocTypeDefault(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated DocType default = " + no);
      no = ImportOrderData.updateDocTypeDefaultError(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Invalid DocType default errors = " + no);
      // Set IsSOTrx
      no = ImportOrderData.updateIsSOTrxY(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated IsSOTrx=Y = " + no);
      no = ImportOrderData.updateIsSOTrxN(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated IsSOTrx=N = " + no);
      // Price List
      no = ImportOrderData.updatePriceListCurrencyDefault(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated PriceList by currency (default) = " + no);
      no = ImportOrderData.updatePriceListNullCurrencyDefault(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated PriceList with null currency (default) = " + no);
      no = ImportOrderData.updatePriceListCurrency(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated PriceList by currency = " + no);
      no = ImportOrderData.updatePriceListNullCurrency(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated PriceList with null currency = " + no);
      no = ImportOrderData.updatePriceListError(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Invalid PriceList errors = " + no);
      //  Set Currency
      no = ImportOrderData.updateCurrencyDefaultFromPriceList(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("ImportOrder Set Currency Default =" + no);
      no = ImportOrderData.updateInvalidCurrency(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("ImportOrder Invalid Currency =" + no);      
      // Payment Term
      no = ImportOrderData.updatePaymentTerm(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated PaymentTerm = " + no);
      no = ImportOrderData.updatePaymentTermDefault(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated PaymentTerm default = " + no);
      no = ImportOrderData.updatePaymentTermError(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Invalid PaymentTerm errors = " + no);
      // Warehouse
      no = ImportOrderData.updateWarehouse(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated Warehouse = " + no);
      no = ImportOrderData.updateWarehouseOther(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated Warehouse (other) = " + no);
      no = ImportOrderData.updateWarehouseError(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Invalid Warehouse errors = " + no);
      // BusinessPartner
      // import depending on the external value
      no = ImportOrderData.updateBPartnerFromValue(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated BPartner from value = " + no);
      no = ImportOrderData.updateBPartnerFromEmail(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated BPartner from email = " + no);
      no = ImportOrderData.updateBPartnerFromContact(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated BPartner from contact = " + no);
      no = ImportOrderData.updateBPartnerFromName(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated BPartner from name = " + no);
      no = ImportOrderData.updateBPartnerFromUPC(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated BPartner from upc = " + no);
      no = ImportOrderData.updateBPartnerDefault(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated BPartner (default) = " + no);
      // update PriceList and PaymentTerm according to BPartner
      no = ImportOrderData.updatePriceListFromBPartner(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated PriceList from BPartner = " + no);
      no = ImportOrderData.updatePOPriceListFromBPartner(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated POPriceList from BPartner = " + no);
      no = ImportOrderData.updatePaymentTermFromBPartner(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated PaymentTerm from BPartner = " + no);
      no = ImportOrderData.updatePOPaymentTermFromBPartner(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated POPaymentTerm from BPartner = " + no);
      // Location
      no = ImportOrderData.updateLocationByUPC(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated Location by UPC = " + no);
      no = ImportOrderData.updateBilltoByUPC(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated bill location by UPC = " + no);
      no = ImportOrderData.updateLocationExisting(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated Location (existing) = " + no);
      no = ImportOrderData.updateBillLocation(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated BillLocation = " + no);
      no = ImportOrderData.updateLocation(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated Location = " + no);
      no = ImportOrderData.updateLocationError(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Invalid Location errors = " + no);
      // Country
      no = ImportOrderData.updateCountryDefault(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated Country (default) = " + no);
      no = ImportOrderData.updateCountry(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated Country = " + no);
      no = ImportOrderData.updateCountryError(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Invalid Country errors = " + no);
      // Set Region
      no = ImportOrderData.updateRegionDefault(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated Region (default) = " + no);
      no = ImportOrderData.updateRegion(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated Region = " + no);
      no = ImportOrderData.updateRegionError(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Invalid Region errors = " + no);
      // Product
      no = ImportOrderData.updateProductFromValue(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated Product from value = " + no);
      no = ImportOrderData.updateProductFromUpc(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated Product from UPC = " + no);
      no = ImportOrderData.updateProductFromSku(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated Product from SKU = " + no);
      no = ImportOrderData.updateProductError(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Invalid Product errors = " + no);
      // Tax
      no = ImportOrderData.updateTax(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Updated Tax = " + no);
      no = ImportOrderData.updateTaxError(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Invalid Tax errors = " + no);
      conn.releaseCommitConnection(con);
  
      // till here, the edition of the I_Order table
      // now, the insertion from I_Order table in C_Order
      // New BPartner
      ImportOrderData[] data = ImportOrderData.selectWithoutBP(conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Going through " + data.length + " records");
      for (int i=0; i<data.length; i++) {
        con = conn.getTransactionConnection();
        String I_Order_ID = data[i].iOrderId;
        
        if (data[i].bpartnervalue==null || data[i].bpartnervalue.equals("")) {
          if (data[i].email != null && !data[i].email.equals(""))
            data[i].bpartnervalue = data[i].email;
          else if (data[i].name != null && !data[i].name.equals(""))
            data[i].bpartnervalue = data[i].name;
          else
            continue;
        }
        if (data[i].name == null || data[i].name.equals("")) {
          if (data[i].contactname != null && !data[i].contactname.equals(""))
            data[i].name = data[i].contactname;
          else
            data[i].name = data[i].bpartnervalue;
        }
        BPartnerData bp = new BPartnerData();
        bp.cBpartnerId = SequenceIdData.getUUID();
        bp.adClientId = data[i].adClientId;
        bp.adOrgId = data[i].adOrgId;
        bp.value = data[i].bpartnervalue;
        bp.name = data[i].name;
        try {
        	bp.insert(con, conn);
        } catch(ServletException ex) {
            if (log4j.isDebugEnabled()) log4j.debug("Insert Order - " + ex.toString());
            conn.releaseRollbackConnection(con);
            ImportOrderData.importOrderError(conn, ex.toString(), I_Order_ID);
            continue;
        }
        data[i].cBpartnerId = bp.cBpartnerId;
        LocationData loc = new LocationData();
        loc.cLocationId = SequenceIdData.getUUID();
        loc.adClientId = data[i].adClientId;
        loc.adOrgId = data[i].adOrgId;
        loc.address1 = data[i].address1;
        loc.address2 = data[i].address2;
        loc.city = data[i].city;
        loc.postal = data[i].postal;
        if (data[i].cRegionId != null)
          loc.cRegionId = data[i].cRegionId;
        loc.cCountryId = data[i].cCountryId;
        try {
        	loc.insert(con, conn);
        } catch(ServletException ex) {            	  
          if (log4j.isDebugEnabled()) log4j.debug("Insert Order - " + ex.toString());
          conn.releaseRollbackConnection(con);
          ImportOrderData.importOrderError(conn, ex.toString(), I_Order_ID);
          continue;
        }
        data[i].cLocationId = loc.cLocationId;
        BPartnerLocationData bpl = new BPartnerLocationData();
        bpl.cBpartnerLocationId = SequenceIdData.getUUID();
        bpl.adClientId = data[i].adClientId;
        bpl.adOrgId = data[i].adOrgId;
        bpl.cBpartnerId = data[i].cBpartnerId;
        bpl.cLocationId = data[i].cLocationId;
        try {
        	bpl.insert(con, conn);
        } catch(ServletException ex) {            	  
          if (log4j.isDebugEnabled()) log4j.debug("Insert Order - " + ex.toString());
          conn.releaseRollbackConnection(con);
          ImportOrderData.importOrderError(conn, ex.toString(), I_Order_ID);
          continue;
        }
        data[i].cBpartnerLocationId = bpl.cBpartnerLocationId;
        data[i].billtoId = bpl.cBpartnerLocationId;
        if (data[i].contactname != null || data[i].email != null || data[i].phone != null) {
          UserData user = new UserData();
          user.adUserId = SequenceIdData.getUUID();
          user.adClientId = data[i].adClientId;
          user.adOrgId = data[i].adOrgId;
          user.cBpartnerId = data[i].cBpartnerId;
          if (data[i].contactname != null && !data[i].contactname.equals(""))
            user.name = data[i].contactname;
          else
            user.name = data[i].name;
          user.email = data[i].email;
          user.phone = data[i].phone;
          try {
          	user.insert(con, conn);
          } catch(ServletException ex) {            	  
            if (log4j.isDebugEnabled()) log4j.debug("Insert Order - " + ex.toString());
            conn.releaseRollbackConnection(con);
            ImportOrderData.importOrderError(conn, ex.toString(), I_Order_ID);
            continue;
          }
          data[i].adUserId = user.adUserId;
          data[i].updatedby = user.adUserId;
        }
        data[i].update(con, conn);
        conn.releaseCommitConnection(con);
      }
      con = conn.getTransactionConnection();
      no = ImportOrderData.updateBPartnerError(con, conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Invalid BPartner errors = " + no);
      conn.releaseCommitConnection(con);
      // New Order
      int noInsert = 0;
      int noInsertLine = 0;
      int noOrderError = 0;
      
      data = ImportOrderData.selectNotImported(conn, getAD_Client_ID());
      if (log4j.isDebugEnabled()) log4j.debug("Going through " + data.length + " records");
      COrderData corder = null;
      String order_documentno="";
      String corder_corderid="";
      String corder_mpricelistid="";
      String corder_ccurrencyid="";
      String corder_cbpartnerid="";
      String corder_cbpartnerlocationid="";
      String strPostMessage = "";
      int lineNo = 0;
      for (int i=0; i<data.length; i++) {
        con = conn.getTransactionConnection();
        String I_Order_ID = data[i].iOrderId;
        
        if (!order_documentno.equals(data[i].documentno)) {
  //      if (!C_BPartner_ID.equals(data[i].cBpartnerId) || !BillTo_ID.equals(data[i].billtoId) || !C_BPartner_Location_ID.equals(data[i].cBpartnerLocationId)) {
          order_documentno = data[i].documentno;
          //Looking for same order yet inserted
          ImportOrderData[] orderInserted = ImportOrderData.selectOrderInserted(conn, getAD_Client_ID(), data[i].adOrgId, data[i].cDoctypeId, data[i].documentno, data[i].dateordered.equals("")?DateTimeData.today(conn):data[i].dateordered);
          if (orderInserted!=null && orderInserted.length==0) {
            corder = new COrderData();
            corder.cOrderId = SequenceIdData.getUUID();
            if (log4j.isDebugEnabled()) log4j.debug("Creating new order with id = " + corder.cOrderId);
            corder.adClientId = data[i].adClientId;
            corder.adOrgId = data[i].adOrgId;
            corder.cDoctypetargetId = data[i].cDoctypeId;
            corder.cDoctypeId = "0";
            if (log4j.isDebugEnabled()) log4j.debug("data[i].cBpartnerLocationId: " + data[i].cBpartnerLocationId);
            corder.cBpartnerLocationId = data[i].cBpartnerLocationId;
            if (log4j.isDebugEnabled()) log4j.debug("data[i].description: " + data[i].description);
            corder.description = data[i].description;
            if (data[i].description != null && !data[i].description.equals("")) {
              String location_name = ImportOrderData.selectLocationName(con, conn, data[i].description);
              if (log4j.isDebugEnabled()) log4j.debug("location_name: " + location_name);
              if (location_name != null && !location_name.equals("")) {
                corder.description += " " + location_name;
                if (log4j.isDebugEnabled()) log4j.debug("corder.description: " + corder.description);
              }
            }
            corder.issotrx = data[i].issotrx;
            if (data[i].documentno != null && !data[i].documentno.equals("")) {
              corder.documentno = data[i].documentno;
            } else {
              String docTargetType = ImportOrderData.cDoctypeTarget(con, conn, vars.getUser(), vars.getOrg());
              corder.documentno = Utility.getDocumentNo(conn, vars, "", "C_Order", docTargetType, docTargetType, false, true);
            }
            corder.docstatus = "DR";
            corder.docaction = "CO";
            corder.processing = "N";
            corder.cBpartnerId= data[i].cBpartnerId;
            corder.billtoId = data[i].billtoId;
            corder.cBpartnerLocationId = data[i].cBpartnerLocationId;
            if (!data[i].adUserId.equals("") && Integer.parseInt(data[i].adUserId) != 0)
              corder.adUserId = data[i].adUserId;
            else
              corder.adUserId = vars.getUser();
            corder.cPaymenttermId = data[i].cPaymenttermId;
            corder.mPricelistId = data[i].mPricelistId;
            corder.mWarehouseId = data[i].mWarehouseId;
            if (!data[i].mShipperId.equals("") && Integer.parseInt(data[i].mShipperId) != 0)
              corder.mShipperId = data[i].mShipperId;
            if (!data[i].salesrepId.equals("") && Integer.parseInt(data[i].salesrepId) != 0)
              corder.salesrepId = data[i].salesrepId;
            if (!data[i].adOrgtrxId.equals("") && Integer.parseInt(data[i].adOrgtrxId) != 0)
              corder.adOrgtrxId = data[i].adOrgtrxId;
            if (!data[i].cActivityId.equals("") && Integer.parseInt(data[i].cActivityId) != 0)
              corder.cActivityId = data[i].cActivityId;
            if (!data[i].cCampaignId.equals("") && Integer.parseInt(data[i].cCampaignId) != 0)
              corder.cCampaignId = data[i].cCampaignId;
            if (!data[i].cProjectId.equals("") && Integer.parseInt(data[i].cProjectId) != 0)
              corder.cProjectId = data[i].cProjectId;
            if (data[i].dateordered != null && !data[i].dateordered.equals(""))
              corder.dateordered = data[i].dateordered;
            if (data[i].datepromised != null && !data[i].datepromised.equals(""))
              corder.datepromised = data[i].datepromised;
            if (log4j.isDebugEnabled()) log4j.debug("getting bp values as default");
            SEOrderBPartnerData[] data1 = SEOrderBPartnerData.select(conn, data[i].cBpartnerId);
            String tmpCurrency = COrderData.selectCurrency(conn, vars.getUser(), data[i].cBpartnerId);
            corder.isdiscountprinted = "N";
            if (log4j.isDebugEnabled()) log4j.debug("stablishing default values");
            //corder.cCurrencyId = (tmpCurrency == null || tmpCurrency.equals(""))?"102":tmpCurrency; // euro as default
            if (tmpCurrency != null && !tmpCurrency.equals("")){
              corder.cCurrencyId = tmpCurrency;
            }else{
              corder.cCurrencyId = data[i].cCurrencyId;
            }
            corder.paymentrule = data1[0].paymentrule.equals("")?"":data1[0].paymentrule;
            if (data1[0].paymentrule != null && !data1[0].paymentrule.equals("")) {
              corder.paymentrule = data1[0].paymentrule;
            } else {
              String defaultPaymentRule = ImportOrderData.defaultValue(con, conn, "C_Order", "PaymentRule");
              corder.paymentrule = (defaultPaymentRule == null || defaultPaymentRule.equals(""))?"P":defaultPaymentRule; // P = on credit
            }
            if (log4j.isDebugEnabled()) log4j.debug("corder.paymentrule = " + corder.paymentrule);
            if (data1[0].invoicerule != null && !data1[0].invoicerule.equals("")) {
              corder.invoicerule = data1[0].invoicerule;
            } else {
              String defaultInvoiceRule = ImportOrderData.defaultValue(con, conn, "C_Order", "InvoiceRule");
              corder.invoicerule = (defaultInvoiceRule == null || defaultInvoiceRule.equals(""))?"I":defaultInvoiceRule; // I = immediate
            }
            if (log4j.isDebugEnabled()) log4j.debug("corder.invoicerule = " + corder.invoicerule);
            if (data1[0].deliveryrule != null && !data1[0].deliveryrule.equals("")) {
              corder.deliveryrule = data1[0].deliveryrule;
            } else {
              String defaultDeliveryRule = ImportOrderData.defaultValue(con, conn, "C_Order", "DeliveryRule");
              corder.deliveryrule = (defaultDeliveryRule == null || defaultDeliveryRule.equals(""))?"A":defaultDeliveryRule; // A = availability
            }
            if (log4j.isDebugEnabled()) log4j.debug("corder.deliveryrule = " + corder.deliveryrule);
            if (data1[0].deliveryviarule != null && !data1[0].deliveryviarule.equals("")) {
              corder.deliveryviarule = data1[0].deliveryviarule;
            } else {
              String defaultDeliveryViaRule = ImportOrderData.defaultValue(con, conn, "C_Order", "DeliveryViaRule");
              corder.deliveryviarule = (defaultDeliveryViaRule == null || defaultDeliveryViaRule.equals(""))?"S":defaultDeliveryViaRule; // S = shipper
            }
            if (log4j.isDebugEnabled()) log4j.debug("corder.deliveryviarule = " + corder.deliveryviarule);
            corder.freightcostrule = "I"; // I = included
            if (log4j.isDebugEnabled()) log4j.debug("corder.freightcostrule = " + corder.freightcostrule);
            if (data1[0].cPaymenttermId != null && !data1[0].cPaymenttermId.equals("")) {
              corder.cPaymenttermId = data1[0].cPaymenttermId;
            }
            if (log4j.isDebugEnabled()) log4j.debug("corder.cPaymenttermId = " + corder.cPaymenttermId);
            if (data1[0].paymentrule != null && !data1[0].paymentrule.equals("")) {
              corder.paymentrule = data1[0].paymentrule;
            } else {
              String defaultPaymentRule = ImportOrderData.defaultValue(con, conn, "C_Order", "PaymentRule");
              corder.paymentrule = (defaultPaymentRule == null || defaultPaymentRule.equals(""))?"P":defaultPaymentRule; // P = on credit
            }
            if (log4j.isDebugEnabled()) log4j.debug("corder.paymentrule = " + corder.paymentrule);
            if (data1[0].salesrepId != null && !data1[0].salesrepId.equals("")) {
              String salesrep = ImportOrderData.selectSalesRep(con, conn, data[i].cBpartnerId);
              corder.salesrepId = salesrep;
            }
            if (log4j.isDebugEnabled()) log4j.debug("corder.salesrepId = " + corder.salesrepId);
            String user = ImportOrderData.defaultUser(con, conn, data[i].cBpartnerId);
            if (user != null && !user.equals("")) {
              corder.adUserId = user;
            }
            if (log4j.isDebugEnabled()) log4j.debug("other default values");
            corder.priorityrule = "5"; // medium
            corder_corderid = corder.cOrderId;
            corder_mpricelistid = corder.mPricelistId;
            corder_ccurrencyid = corder.cCurrencyId;
            corder_cbpartnerid = corder.cBpartnerId;
            corder_cbpartnerlocationid = corder.cBpartnerLocationId;
            try {
            	corder.insert(con, conn);
            } catch(ServletException ex) {            	  
              if (log4j.isDebugEnabled()) log4j.debug("Insert Order - " + ex.toString());
              conn.releaseRollbackConnection(con);
              ImportOrderData.importOrderError(conn, ex.toString(), I_Order_ID);
              continue;
            }
            noInsert++;
            lineNo = 10;
          }
          else{
            // Order with same Org, Doctype, DocumentNo, DateOrdered already exists.
            
            corder_corderid = orderInserted[0].cOrderId;
            order_documentno=orderInserted[0].documentno;
            corder_corderid=orderInserted[0].cOrderId;
            corder_mpricelistid=orderInserted[0].mPricelistId;
            corder_ccurrencyid=orderInserted[0].cCurrencyId;
            corder_cbpartnerid=orderInserted[0].cBpartnerId;
            corder_cbpartnerlocationid=orderInserted[0].cBpartnerLocationId;
            lineNo = Integer.parseInt(orderInserted[0].linedescription); 
          }
        }
        
        data[i].cOrderId = corder_corderid;
        //  New OrderLine
        COrderLineData line = new COrderLineData();
        line.cOrderlineId = SequenceIdData.getUUID();
        line.adClientId = data[i].adClientId;
        line.adOrgId = data[i].adOrgId;
        line.adUserId = vars.getUser();
        line.cOrderId = corder_corderid;
        line.line = Integer.toString(lineNo);
        if (log4j.isDebugEnabled()) log4j.debug("reading order line number: " + line.line);
        line.description = data[i].linedescription;
        line.cBpartnerId = corder_cbpartnerid;
        line.cBpartnerLocationId = corder_cbpartnerlocationid;
        lineNo += 10;
        if (data[i].mProductId != null && !data[i].mProductId.equals("") && Integer.parseInt(data[i].mProductId) != 0)
          line.mProductId = data[i].mProductId;
        line.qtyordered = data[i].qtyordered;
        // set price
        if (line.mProductId != null && !line.mProductId.equals("")) {
          ProductPriceData[] pprice =  ProductPriceData.selectPL(conn, line.mProductId, corder_mpricelistid);
          if (pprice.length > 0) {
            line.pricestd = pprice[0].pricestd;
            line.priceactual = pprice[0].pricestd;
            line.pricelist = (pprice[0].pricelist == null && pprice[0].pricelist.equals("")) ? "0" : pprice[0].pricelist;
            line.pricelimit = (pprice[0].pricelimit == null && pprice[0].pricelimit.equals("")) ? "0" : pprice[0].pricelimit;
            line.discount = ((Double.parseDouble(pprice[0].pricelist)==Double.parseDouble("0"))?"0":(new BigDecimal((Double.parseDouble(pprice[0].pricelist) - Double.parseDouble(line.priceactual)) / Double.parseDouble(pprice[0].pricelist) * 100.0)).toString());
            line.cUomId = pprice[0].cUomId;
          } else {
            if (log4j.isDebugEnabled()) log4j.debug("Could not establish prices");
          }
        } // set price
          if (data[i].priceactual != null && !data[i].priceactual.equals("") && Double.parseDouble(data[i].priceactual) != Double.parseDouble("0"))
            line.priceactual = data[i].priceactual;
          if (data[i].cTaxId != null && !data[i].cTaxId.equals("") && Integer.parseInt(data[i].cTaxId) != 0)
            line.cTaxId = data[i].cTaxId;
          else {
            try {
              line.cTaxId = Tax.get(conn, data[i].mProductId, DateTimeData.today(conn), data[i].adOrgId, data[i].mWarehouseId.equals("")?vars.getWarehouse():data[i].mWarehouseId, ExpenseSOrderData.cBPartnerLocationId(conn, data[i].cBpartnerId), ExpenseSOrderData.cBPartnerLocationId(conn, data[i].cBpartnerId), data[i].cProjectId, true);
            } catch (IOException ioe) {
              if (log4j.isDebugEnabled()) log4j.debug("IOException");
            }
          }
          if (line.cTaxId == null || line.cTaxId.equals(""))
            line.cTaxId = ProductPriceData.selectCTaxId(conn, vars.getClient());
          data[i].cTaxId = line.cTaxId;
          
          line.dateordered = data[i].dateordered;
          line.mWarehouseId = (data[i].mWarehouseId == null || data[i].mWarehouseId.equals("")) ? vars.getWarehouse() : data[i].mWarehouseId;
          if (line.cUomId == null || line.cUomId.equals(""))  line.cUomId = ProductPriceData.selectCUomIdByProduct(conn, line.mProductId);
          if (line.cUomId == null || line.cUomId.equals(""))  line.cUomId = ProductPriceData.selectCUomIdDefault(conn);
          line.cCurrencyId = (data[i].cCurrencyId == null || data[i].cCurrencyId.equals("")) ? corder_ccurrencyid : data[i].cCurrencyId;
          try {
          	line.insert(con, conn);
          } catch(ServletException ex) {            	  
            if (log4j.isDebugEnabled()) log4j.debug("Insert Order - " + ex.toString());
            conn.releaseRollbackConnection(con);
            ImportOrderData.importOrderError(conn, ex.toString(), I_Order_ID);
            noInsert--;
            continue;
          }
          data[i].cOrderlineId = line.cOrderlineId;
          data[i].iIsimported = "Y";
          data[i].processed = "Y";
          data[i].update(con, conn);
          String [] arrayPayment = {data[i].paymentrule1, data[i].paymentrule2};
          String [] arrayAmount = {data[i].paymentamount1, data[i].paymentamount2};
          for (int k = 0; k<arrayPayment.length; k++) {
            if (!arrayPayment[k].equals("")) {
              CDebtpaymentData cdebtpayment = new CDebtpaymentData();
              cdebtpayment.cDebtPaymentId = SequenceIdData.getUUID();
              cdebtpayment.adClientId = data[i].adClientId;
              cdebtpayment.adOrgId = data[i].adOrgId;
              cdebtpayment.createdby = getAD_User_ID();
              cdebtpayment.updatedby = getAD_User_ID();
              cdebtpayment.cBpartnerId = corder_cbpartnerid;
              cdebtpayment.cCurrencyId = corder_ccurrencyid;
              /*cdebtpayment.cBankaccountId = ;
              cdebtpayment.cCashbookId = ;*/
              cdebtpayment.paymentrule = arrayPayment[k];
              cdebtpayment.amount = arrayAmount[k];
              cdebtpayment.ispaid = "N";
              cdebtpayment.dateplanned = data[i].dateordered;
              cdebtpayment.ismanual = "N";
              cdebtpayment.isvalid = "Y";
              cdebtpayment.changesettlementcancel = "N";
              cdebtpayment.cancelProcessed = "N";
              cdebtpayment.generateProcessed = "N";
              cdebtpayment.glitemamt = "0";
              cdebtpayment.isdirectposting = "N";
              cdebtpayment.status = "DE";
              cdebtpayment.statusInitial = "DE";
              cdebtpayment.cOrderId = data[i].cOrderId;
              try {
              	cdebtpayment.insert(con, conn);
              } catch(ServletException ex) {            	  
                if (log4j.isDebugEnabled()) log4j.debug("Insert Order - " + ex.toString());
                conn.releaseRollbackConnection(con);
                ImportOrderData.importOrderError(conn, ex.toString(), I_Order_ID);
                noInsert--;
                continue;
              }
            }
          }
        
          try {
            if (data[i].performPost.equals("Y") || m_processOrders) {
              if (i != data.length - 1) {
                if (!order_documentno.equals(data[i+1].documentno)) strPostMessage += cOrderPost(con, conn, vars, data[i].cOrderId, order_documentno) + ", ";
              } else {
                strPostMessage += cOrderPost(con, conn, vars, data[i].cOrderId, order_documentno) + ", ";
              }
            }
          } catch (IOException e) {
            e.printStackTrace();
            log4j.debug("Post error");
            ImportOrderData.updatePostError(con, conn, strPostMessage, data[i].orderReferenceno, getAD_Client_ID());
          }
          noInsertLine++;
          conn.releaseCommitConnection(con);
      }
      con = conn.getTransactionConnection();
      noOrderError = ImportOrderData.updateNotImported(con, conn, getAD_Client_ID());
            
      addLog(Utility.messageBD(conn, "Orders not imported", vars.getLanguage()) + ": " + noOrderError + "; ");
      addLog("Orders inserted: " + noInsert + "; ");
      addLog("Orders line inserted: " + noInsertLine + "; " + "<br>");
      addLog("Orders processed: " + Integer.toString(totalProcessed) + "; " + "<br>");
      addLog("Process result: " + strPostMessage);
      if (noOrderError == 0){
      	myError.setType("Success");
      	myError.setTitle(Utility.messageBD(conn, "Success", vars.getLanguage()));
      }else if (noInsert > 0 || noInsertLine > 0){    	
      		myError.setType("Warning");
      		myError.setTitle(Utility.messageBD(conn, "Some orders could not be imported", vars.getLanguage()));
      	}else {
      		myError.setType("Error");
      		myError.setTitle(Utility.messageBD(conn, " No orders could be imported", vars.getLanguage()));
      }
      myError.setMessage(Utility.messageBD(conn, getLog(), vars.getLanguage()));
      
      conn.releaseCommitConnection(con);
    } catch (NoConnectionAvailableException ex) {
      throw new ServletException("@CODE=NoConnectionAvailable");
    } catch (SQLException ex2) {
      try {
        conn.releaseRollbackConnection(con);
      } catch (Exception ignored) {}
      throw new ServletException("@CODE=" + Integer.toString(ex2.getErrorCode()) + "@" + ex2.getMessage());
    } catch (Exception ex3) {
      try {
        conn.releaseRollbackConnection(con);
      } catch (Exception ignored) {}
      throw new ServletException("@CODE=@" + ex3.getMessage());
    }
    return myError;
  }

  String cOrderPost(Connection con, ConnectionProvider conn, VariablesSecureApp vars, String strcOrderId, String order_documentno)
      throws IOException, ServletException {
    String pinstance = SequenceIdData.getUUID();
    PInstanceProcessData.insertPInstance(conn, pinstance, "104", strcOrderId, "N", vars.getUser(), vars.getClient(), vars.getOrg());
    //PInstanceProcessData.insertPInstanceParam(this, pinstance, "1", "Selection", "Y", vars.getClient(), vars.getOrg(), vars.getUser());
    ImportOrderData.cOrderPost0(con, conn, pinstance);
    
    PInstanceProcessData[] pinstanceData = PInstanceProcessData.select(conn, pinstance);
    OBError myMessage = Utility.getProcessInstanceMessage(conn, vars, pinstanceData);
    
    String messageResult = myMessage.getMessage();
    if (myMessage.getMessage().equals("")){
      messageResult = order_documentno + " - " + myMessage.getType();
    }else{
      messageResult = order_documentno + " - " + myMessage.getMessage();  
    }
    
    if (myMessage.getType().equals("Success") || myMessage.getType().equals("Warning")) {
      totalProcessed = totalProcessed + 1;
    }
    /* if (pinstanceData!=null && pinstanceData.length>0) {
      if (!pinstanceData[0].errormsg.equals("")) {
        String message = pinstanceData[0].errormsg;
        if (message.startsWith("@") && message.endsWith("@")) {
          message = message.substring(1, message.length()-1);
          if (message.indexOf("@")==-1) messageResult = Utility.messageBD(conn, message, vars.getLanguage());
          else messageResult = Utility.parseTranslation(conn, vars, vars.getLanguage(), "@" + message + "@");
        } else {
          messageResult = Utility.parseTranslation(conn, vars, vars.getLanguage(), message);
        }
      } else if (!pinstanceData[0].pMsg.equals("")) {
        String message = pinstanceData[0].pMsg;
        messageResult = Utility.parseTranslation(conn, vars, vars.getLanguage(), message);
        total += 1;
      } else if (pinstanceData[0].result.equals("1")) {
        messageResult = Utility.messageBD(conn, "Success", vars.getLanguage());
        total += 1;
      } else {
        messageResult = Utility.messageBD(conn, "PostOrderError", vars.getLanguage());
        ImportOrderData.updatePostError(con, conn, messageResult, order_documentno, getAD_Client_ID());
      }
    } */
    return messageResult;
  }
}
