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
 * Contributor(s): Openbravo SLU
 * Contributions are Copyright (C) 2001-2009 Openbravo S.L.U.
 ******************************************************************************
 */
package org.openbravo.erpCommon.ad_forms;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Connection;

import javax.servlet.ServletException;

import org.apache.log4j.Logger;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.data.FieldProvider;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.erpCommon.utility.SequenceIdData;

public class DocMatchInv extends AcctServer {

  private static final long serialVersionUID = 1L;
  static Logger log4jDocMatchInv = Logger.getLogger(DocMatchInv.class);

  /** AD_Table_ID */
  private String SeqNo = "0";

  /**
   * Constructor
   * 
   * @param AD_Client_ID
   *          AD_Client_ID
   */
  public DocMatchInv(String AD_Client_ID, String AD_Org_ID, ConnectionProvider connectionProvider) {
    super(AD_Client_ID, AD_Org_ID, connectionProvider);
  }

  public void loadObjectFieldProvider(ConnectionProvider conn,
      @SuppressWarnings("hiding") String AD_Client_ID, String Id) throws ServletException {
    setObjectFieldProvider(DocMatchInvData.selectRegistro(conn, AD_Client_ID, Id));
  }

  /**
   * Load Document Details
   * 
   * @return true if loadDocumentType was set
   */
  public boolean loadDocumentDetails(FieldProvider[] data, ConnectionProvider conn) {
    C_Currency_ID = NO_CURRENCY;
    DocumentType = AcctServer.DOCTYPE_MatMatchInv;
    log4jDocMatchInv.debug("loadDocumentDetails - C_Currency_ID : " + C_Currency_ID);
    DateDoc = data[0].getField("DateTrx");
    C_BPartner_ID = data[0].getField("C_Bpartner_Id");

    loadDocumentType(); // lines require doc type
    // Contained Objects
    p_lines = null;
    return true;
  } // loadDocumentDetails

  /**
   * Load Invoice Line
   * 
   * @return DocLine Array
   */
  public DocLine[] loadLines(ConnectionProvider conn) {
    return null;
  } // loadLines

  /**
   * Get Balance
   * 
   * @return Zero (always balanced)
   */
  public BigDecimal getBalance() {
    BigDecimal retValue = ZERO;
    return retValue;
  } // getBalance

  /**
   * Create Facts (the accounting logic) for MMS, MMR.
   * 
   * <pre>
   *  Shipment
   *      CoGS            DR
   *      Inventory               CR
   *  Shipment of Project Issue
   *      CoGS            DR
   *      Project                 CR
   *  Receipt
   *      Inventory       DR
   *      NotInvoicedReceipt      CR
   * </pre>
   * 
   * @param as
   *          accounting schema
   * @return Fact
   */
  public Fact createFact(AcctSchema as, ConnectionProvider conn, Connection con,
      VariablesSecureApp vars) throws ServletException {
    // Select specific definition
    String strClassname = AcctServerData
        .selectTemplateDoc(conn, as.m_C_AcctSchema_ID, DocumentType);
    if (strClassname.equals(""))
      strClassname = AcctServerData.selectTemplate(conn, as.m_C_AcctSchema_ID, AD_Table_ID);
    if (!strClassname.equals("")) {
      try {
        DocMatchInvTemplate newTemplate = (DocMatchInvTemplate) Class.forName(strClassname)
            .newInstance();
        return newTemplate.createFact(this, as, conn, con, vars);
      } catch (Exception e) {
        log4j.error("Error while creating new instance for DocMatchInvTemplate - " + e);
      }
    }
    C_Currency_ID = as.getC_Currency_ID();
    // create Fact Header
    Fact fact = new Fact(this, as, Fact.POST_Actual);
    String Fact_Acct_Group_ID = SequenceIdData.getUUID();
    // Line pointers
    FactLine dr = null, cr = null, diff = null;

    // Entry to build has the form:
    // Account......................................Debit.......................... Credit
    // Not Invoiced Receipts........... Cost in the goods receipt
    // Expenses......................................................... Expenses in the Invoice
    // Invoice Price Variance........ Difference of cost and expenses

    FieldProvider[] data = getObjectFieldProvider();
    BigDecimal bdCost = new BigDecimal(DocMatchInvData.selectProductAverageCost(conn, data[0]
        .getField("M_Product_Id"), data[0].getField("orderAcctDate")));
    String strScale = DocMatchInvData.selectClientCurrencyPrecission(conn, vars.getClient());
    BigDecimal bdQty = new BigDecimal(data[0].getField("Qty"));
    bdCost = bdCost.multiply(bdQty).setScale(new Integer(strScale), RoundingMode.HALF_UP);

    DocMatchInvData[] invoiceData = DocMatchInvData.selectInvoiceData(conn, vars.getClient(),
        data[0].getField("C_InvoiceLine_Id"));

    String strExpenses = invoiceData[0].linenetamt;
    String strInvoiceCurrency = invoiceData[0].cCurrencyId;
    String strDate = invoiceData[0].dateacct;
    strExpenses = getConvertedAmt(strExpenses, strInvoiceCurrency, as.getC_Currency_ID(), strDate,
        "", vars.getClient(), vars.getOrg(), conn);
    BigDecimal bdExpenses = new BigDecimal(strExpenses);
    if ((new BigDecimal(data[0].getField("QTYINVOICED")).signum() != (new BigDecimal(data[0]
        .getField("MOVEMENTQTY"))).signum())
        && data[0].getField("InOutStatus").equals("VO")) {
      bdExpenses = bdExpenses.multiply(new BigDecimal(-1));
    }

    BigDecimal bdDifference = bdExpenses.subtract(bdCost);

    DocLine docLine = new DocLine(DocumentType, Record_ID, "");
    docLine.m_C_Project_ID = data[0].getField("INOUTPROJECT");

    dr = fact.createLine(docLine, getAccount(AcctServer.ACCTTYPE_NotInvoicedReceipts, as, conn), as
        .getC_Currency_ID(), bdCost.toString(), Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType,
        conn);

    if (dr == null) {
      log4j.warn("createFact - unable to calculate line with "
          + " cost of the product to not invoiced receipt account.");
      return null;
    }

    docLine.m_C_Project_ID = data[0].getField("INVOICEPROJECT");

    ProductInfo p = new ProductInfo(data[0].getField("M_Product_Id"), conn);
    cr = fact.createLine(docLine, p.getAccount(ProductInfo.ACCTTYPE_P_Expense, as, conn), as
        .getC_Currency_ID(), "0", bdExpenses.toString(), Fact_Acct_Group_ID, nextSeqNo(SeqNo),
        DocumentType, conn);

    if (cr == null) {
      log4j.warn("createFact - unable to calculate line with "
          + " expenses to product expenses account.");
      return null;
    }
    if (!bdCost.equals(bdExpenses)) {
      diff = fact.createLine(docLine, p.getAccount(ProductInfo.ACCTTYPE_P_IPV, as, conn), as
          .getC_Currency_ID(), (bdDifference.compareTo(BigDecimal.ZERO) == 1) ? bdDifference.abs()
          .toString() : "0", (bdDifference.compareTo(BigDecimal.ZERO) < 1) ? bdDifference.abs()
          .toString() : "0", Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, conn);
      if (diff == null) {
        log4j.warn("createFact - unable to calculate line with "
            + " difference to InvoicePriceVariant account.");
        return null;
      }
    }
    SeqNo = "0";
    return fact;
  } // createFact

  /**
   * @return the log4jDocMatchInv
   */
  public static Logger getLog4jDocMatchInv() {
    return log4jDocMatchInv;
  }

  /**
   * @param log4jDocMatchInv
   *          the log4jDocMatchInv to set
   */
  public static void setLog4jDocMatchInv(Logger log4jDocMatchInv) {
    DocMatchInv.log4jDocMatchInv = log4jDocMatchInv;
  }

  /**
   * @return the seqNo
   */
  public String getSeqNo() {
    return SeqNo;
  }

  /**
   * @param seqNo
   *          the seqNo to set
   */
  public void setSeqNo(String seqNo) {
    SeqNo = seqNo;
  }

  /**
   * @return the serialVersionUID
   */
  public static long getSerialVersionUID() {
    return serialVersionUID;
  }

  public String nextSeqNo(String oldSeqNo) {
    log4jDocMatchInv.debug("DocMatchInv - oldSeqNo = " + oldSeqNo);
    BigDecimal seqNo = new BigDecimal(oldSeqNo);
    SeqNo = (seqNo.add(new BigDecimal("10"))).toString();
    log4jDocMatchInv.debug("DocMatchInv - nextSeqNo = " + SeqNo);
    return SeqNo;
  }

  /**
   * Get Document Confirmation
   * 
   * not used
   */
  public boolean getDocumentConfirmation(ConnectionProvider conn, String strRecordId) {
    return true;
  }

  public String getServletInfo() {
    return "Servlet for the accounting";
  } // end of getServletInfo() method
}