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
 * Contributions are Copyright (C) 2001-2006 Openbravo S.L.
 ******************************************************************************
*/
package org.openbravo.erpCommon.ad_forms;

import org.openbravo.erpCommon.utility.SequenceIdData;
import org.openbravo.base.secureApp.VariablesSecureApp;
import java.math.*;
import java.util.*;
import javax.servlet.*;
import org.apache.log4j.Logger ;
// imports for transactions
import org.openbravo.database.ConnectionProvider;
import java.sql.Connection;
import org.openbravo.data.FieldProvider;



public class DocInOut extends AcctServer {
    private static final long serialVersionUID = 1L;
    static Logger log4jDocInOut = Logger.getLogger(DocInOut.class);

    /** AD_Table_ID             */
    private String        SeqNo = "0";


/**
 *  Constructor
 *  @param AD_Client_ID AD_Client_ID
 */
public DocInOut(String AD_Client_ID){
    super(AD_Client_ID);
}

public void loadObjectFieldProvider(ConnectionProvider conn, String AD_Client_ID, String Id) throws ServletException{
    setObjectFieldProvider(DocInOutData.selectRegistro(conn, AD_Client_ID, Id));
}

/**
 *  Load Document Details
 *  @param rs result set
 *  @return true if loadDocumentType was set
 */
public boolean loadDocumentDetails(FieldProvider [] data,ConnectionProvider conn){
    C_Currency_ID = NO_CURRENCY;
    log4jDocInOut.debug("loadDocumentDetails - C_Currency_ID : " + C_Currency_ID);
    DateDoc = data[0].getField("MovementDate");
    C_BPartner_Location_ID = data[0].getField("C_BPartner_Location_ID");


    loadDocumentType();     //  lines require doc type
    //  Contained Objects
    p_lines = loadLines(conn);
    log4jDocInOut.debug("Lines=" + p_lines.length);
    return true;
}   //  loadDocumentDetails

/**
 *  Load Invoice Line
 *  @return DocLine Array
 */
public DocLine[] loadLines(ConnectionProvider conn){
    ArrayList<Object> list = new ArrayList<Object>();
    DocLineInOutData [] data = null;
    try{
        data = DocLineInOutData.select(conn, Record_ID);
    }catch(ServletException e){
        log4jDocInOut.warn(e);
    }
    //
    for(int i=0;data!=null && i<data.length;i++){
        String Line_ID = data[i].getField("M_INOUTLINE_ID");
        DocLine_Material docLine = new DocLine_Material (DocumentType, Record_ID, Line_ID);
        docLine.loadAttributes(data[i], this);
        docLine.setQty (data[i].getField("MOVEMENTQTY"), conn);    //  sets Trx and Storage Qty
        docLine.m_M_Locator_ID = data[i].getField("M_LOCATOR_ID");
        //
        if (docLine.m_M_Product_ID.equals(""))  log4jDocInOut.debug(" - No Product - ignored");
        else list.add (docLine);
    }
    //  Return Array
    DocLine[] dl = new DocLine[list.size()];
    list.toArray(dl);
    return dl;
}   //  loadLines

/**
 *  Get Balance
 *  @return Zero (always balanced)
 */
public BigDecimal getBalance(){
    BigDecimal retValue = ZERO;
    return retValue;
}   //  getBalance

/**
 *  Create Facts (the accounting logic) for
 *  MMS, MMR.
 *  <pre>
 *  Shipment
 *      CoGS            DR
 *      Inventory               CR
 *  Shipment of Project Issue
 *      CoGS            DR
 *      Project                 CR
 *  Receipt
 *      Inventory       DR
 *      NotInvoicedReceipt      CR
 *  </pre>
 *  @param as accounting schema
 *  @return Fact
 */
public Fact createFact(AcctSchema as,ConnectionProvider conn,Connection con,VariablesSecureApp vars) throws ServletException{
    C_Currency_ID = as.getC_Currency_ID();
    //  create Fact Header
    Fact fact = new Fact(this, as, Fact.POST_Actual);
    String Fact_Acct_Group_ID = SequenceIdData.getSequence(conn, "Fact_Acct_Group", vars.getClient());
    //  Line pointers
    FactLine dr = null;
    FactLine cr = null;

    //  Sales
    if (DocumentType.equals(AcctServer.DOCTYPE_MatShipment)){
        for (int i = 0;p_lines != null && i < p_lines.length; i++){
            DocLine_Material line = (DocLine_Material)p_lines[i];
            String costs = line.getProductCosts(DateAcct,as, conn, con);
            log4jDocInOut.debug("(MatShipment) - DR account: " + line.getAccount(ProductInfo.ACCTTYPE_P_Cogs, as, conn));
            log4jDocInOut.debug("(MatShipment) - DR costs: " + costs);
            //  CoGS            DR
            dr = fact.createLine(line,line.getAccount(ProductInfo.ACCTTYPE_P_Cogs, as, conn),as.getC_Currency_ID(), costs, "",Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, conn);
            dr.setM_Locator_ID(line.m_M_Locator_ID);
            dr.setLocationFromLocator(line.m_M_Locator_ID, true, conn);    //  from Loc
            dr.setLocationFromBPartner(C_BPartner_Location_ID, false, conn);  //  to Loc
            log4jDocInOut.debug("(MatShipment) - CR account: " + getAccount(ProductInfo.ACCTTYPE_P_Asset, as, conn));
            log4jDocInOut.debug("(MatShipment) - CR costs: " + costs);
            //  Inventory               CR
            cr = fact.createLine(line,line.getAccount(ProductInfo.ACCTTYPE_P_Asset, as, conn),as.getC_Currency_ID(), "", costs,Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, conn);
            cr.setM_Locator_ID(line.m_M_Locator_ID);
            cr.setLocationFromLocator(line.m_M_Locator_ID, true, conn);    // from Loc
            cr.setLocationFromBPartner(C_BPartner_Location_ID, false, conn);  // to Loc
        }
        updateProductInfo(as.getC_AcctSchema_ID(), conn, con);     //  only for SO!
    }
    //  Purchasing
    else if (DocumentType.equals(AcctServer.DOCTYPE_MatReceipt)){
        for (int i = 0;p_lines != null && i < p_lines.length; i++){
            DocLine_Material line = (DocLine_Material)p_lines[i];
            String costs = line.getProductCosts(DateAcct, as, conn, con);
            log4jDocInOut.debug("(matReceipt) - DR account: " + line.getAccount(ProductInfo.ACCTTYPE_P_Asset, as, conn));
            log4jDocInOut.debug("(matReceipt) - DR costs: " + costs);
            //  Inventory       DR
            dr = fact.createLine(line,line.getAccount(ProductInfo.ACCTTYPE_P_Asset, as, conn),as.getC_Currency_ID(), costs, "",Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, conn);
            dr.setM_Locator_ID(line.m_M_Locator_ID);
            dr.setLocationFromBPartner(C_BPartner_Location_ID, true, conn);   // from Loc
            dr.setLocationFromLocator(line.m_M_Locator_ID, false, conn);   // to Loc
            log4jDocInOut.debug("(matReceipt) - CR account: " + getAccount(AcctServer.ACCTTYPE_NotInvoicedReceipts, as, conn));
            log4jDocInOut.debug("(matReceipt) - CR costs: " + costs);
            //  NotInvoicedReceipt      CR
            cr = fact.createLine(line,getAccount(AcctServer.ACCTTYPE_NotInvoicedReceipts, as, conn),as.getC_Currency_ID(), "", costs,Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, conn);
            cr.setM_Locator_ID(line.m_M_Locator_ID);
            cr.setLocationFromBPartner(C_BPartner_Location_ID, true, conn);   //  from Loc
            cr.setLocationFromLocator(line.m_M_Locator_ID, false, conn);   //  to Loc
        }
    }else{
        log4jDocInOut.warn("createFact - " + "DocumentType unknown: " + DocumentType);
        return null;
    }
    //
    SeqNo = "0";
    return fact;
}   //  createFact

/**
 *  Update Sales Order Costing Product Info.
 *  Purchase side handeled in Invoice Matching.
 *  <br>
 *  decrease average cumulatives
 *
 *  @param C_AcctSchema_ID accounting schema
 */
private void updateProductInfo (String C_AcctSchema_ID,ConnectionProvider conn,Connection con){
    log4jDocInOut.debug("updateProductInfo - M_InOut_ID=" + Record_ID);

    int no = 0;
    try{
        no = DocInOutData.updateProductCosting(con, conn, Record_ID);
    }catch(ServletException e){
        log4jDocInOut.warn(e);
    }
    log4jDocInOut.debug("M_Product_Costing - Updated=" + no);
}   //  updateProductInfo

    public String nextSeqNo(String oldSeqNo){
      log4jDocInOut.debug("DocInOut - oldSeqNo = " + oldSeqNo);
      BigDecimal seqNo = new BigDecimal(oldSeqNo);
      SeqNo = (seqNo.add(new BigDecimal("10"))).toString();
      log4jDocInOut.debug("DocInOut - nextSeqNo = " + SeqNo);
      return SeqNo;
    }

  /**
   *  Get Document Confirmation
   *  @not used
   */
  public boolean getDocumentConfirmation(ConnectionProvider conn, String strRecordId) {
    return true;
  }

    public String getServletInfo() {
    return "Servlet for the accounting";
  } // end of getServletInfo() method
}
