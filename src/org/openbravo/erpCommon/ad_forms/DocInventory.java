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


public class DocInventory extends AcctServer {
  private static final long serialVersionUID = 1L;
  static Logger log4jDocInventory = Logger.getLogger(DocInventory.class);

  private String        SeqNo = "0";

/**
 *  Constructor
 *  @param AD_Client_ID client
 */
public DocInventory(String AD_Client_ID, ConnectionProvider connectionProvider){
  super(AD_Client_ID, connectionProvider);
}

public void loadObjectFieldProvider(ConnectionProvider conn, String AD_Client_ID, String Id) throws ServletException{
    setObjectFieldProvider(DocInventoryData.select(conn, AD_Client_ID, Id));
}

/**
 *  Load Document Details
 *  @param rs result
 *  @return true if loadDocumentType was set
 */
public boolean loadDocumentDetails(FieldProvider [] data,ConnectionProvider conn){
  DocumentType = AcctServer.DOCTYPE_MatInventory;
  C_Currency_ID = NO_CURRENCY;
  DateDoc = data[0].getField("MovementDate");
  loadDocumentType();     //  lines require doc type
  //  Contained Objects
  p_lines = loadLines(conn);
  log4jDocInventory.debug("Lines=" + p_lines.length);
  return true;
}   //  loadDocumentDetails

/**
 *  Load Invoice Line
 *  @return DocLine Array
 */
private DocLine[] loadLines(ConnectionProvider conn){
  ArrayList<Object> list = new ArrayList<Object>();
  DocLineInventoryData [] data = null;
  try{
    data = DocLineInventoryData.select(conn,Record_ID);
  }
  catch (ServletException e){
    log4jDocInventory.warn(e);
  }
  for(int i =0; i<data.length;i++){
    String Line_ID = data[i].getField("mInventorylineId");
    DocLine_Material docLine = new DocLine_Material (DocumentType, Record_ID, Line_ID);
    docLine.loadAttributes(data[i], this);
    log4jDocInventory.debug("QtyBook = " + data[i].getField("qtybook") + " - QtyCount = " + data[i].getField("qtycount"));
    BigDecimal QtyBook = new BigDecimal(data[i].getField("qtybook"));
    BigDecimal QtyCount = new BigDecimal(data[i].getField("qtycount"));
    docLine.setQty ((QtyCount.subtract(QtyBook)).toString(),conn);
    docLine.m_M_Locator_ID = data[i].getField("mLocatorId");
      DocInventoryData [] data1 = null;
    try{
        data1= DocInventoryData.selectWarehouse(conn, docLine.m_M_Locator_ID);
    }catch(ServletException e){
      log4jDocInventory.warn(e);
    }
    if(data1!=null && data1.length>0) this.M_Warehouse_ID = data1[0].mWarehouseId;
    //  Set Charge ID only when Inventory Type = Charge
    if (!"C".equals(data[i].getField("inventorytype")))
      docLine.m_C_Charge_ID = "";
    //
    list.add (docLine);
  }
  //  Return Array
  DocLine[] dl = new DocLine[list.size()];
  list.toArray(dl);
  return dl;
} //  loadLines


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
 *  MMI.
 *  <pre>
 *  Inventory
 *      Inventory       DR      CR
 *      InventoryDiff   DR      CR   (or Charge)
 *  </pre>
 *  @param as account schema
 *  @return Fact
 */
public Fact createFact(AcctSchema as,ConnectionProvider conn,Connection con,VariablesSecureApp vars) throws ServletException{
//  Log.trace(Log.l4_Data, "Doc.Inventory.createFact");
  C_Currency_ID = as.getC_Currency_ID();
  //  create Fact Header
  Fact fact = new Fact(this, as, Fact.POST_Actual);
  String Fact_Acct_Group_ID = SequenceIdData.getSequence(conn, "Fact_Acct_Group", vars.getClient());
  //  Line pointers
  FactLine dr = null;
  FactLine cr = null;
  log4jDocInventory.debug("CreateFact - before loop");
  for (int i = 0; i < p_lines.length; i++){
    DocLine_Material line = (DocLine_Material)p_lines[i];
    String costs = line.getProductCosts(DateAcct, as, conn, con);
    log4jDocInventory.debug("CreateFact - before DR - Costs: " + costs);
    //  Inventory       DR      CR
    dr = fact.createLine(line,line.getAccount(ProductInfo.ACCTTYPE_P_Asset, as, conn),as.getC_Currency_ID(), costs, Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, conn);
    //  may be zero difference - no line created.
    if (dr == null)
      continue;
    dr.setM_Locator_ID(line.m_M_Locator_ID);
    log4jDocInventory.debug("CreateFact - before CR");
    //  InventoryDiff   DR      CR
    BigDecimal b_Costs = new BigDecimal(costs);
    //  or Charge
    Account invDiff = line.getChargeAccount(as, b_Costs.negate(), conn);
    log4jDocInventory.debug("CreateFact - after getChargeAccount");
    if (invDiff == null)
      invDiff = getAccount(AcctServer.ACCTTYPE_InvDifferences, as, conn);
    log4jDocInventory.debug("CreateFact - after getAccount - invDiff; " + invDiff);
    cr = fact.createLine(line, invDiff,as.getC_Currency_ID(), (b_Costs.negate()).toString(), Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, conn);
    cr.setM_Locator_ID(line.m_M_Locator_ID);
  }
  log4jDocInventory.debug("CreateFact - after loop");
  SeqNo = "0";
  return fact;
}   //  createFact

    public String nextSeqNo(String oldSeqNo){
      log4jDocInventory.debug("DocInventory - oldSeqNo = " + oldSeqNo);
      BigDecimal seqNo = new BigDecimal(oldSeqNo);
      SeqNo = (seqNo.add(new BigDecimal("10"))).toString();
      log4jDocInventory.debug("DocInventory - nextSeqNo = " + SeqNo);
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
