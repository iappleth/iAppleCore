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

import java.math.*;
import org.apache.log4j.Logger ;
// imports for transactions
import org.openbravo.database.ConnectionProvider;



public class DocLine_Invoice extends DocLine {
  static Logger log4jDocLine_Invoice = Logger.getLogger(DocLine_Invoice.class);

  public DocLine_Invoice (String DocumentType, String TrxHeader_ID, String TrxLine_ID){
    super(DocumentType, TrxHeader_ID, TrxLine_ID);
  }


  /** Net Line Amt            */
  private String    m_LineNetAmt = "0";
  /** List Amount             */
  private String    m_ListAmt = "0";
  /** Discount Amount         */
  private String    m_DiscountAmt = "0";



  public void setAmount (String LineNetAmt, String PriceList, String Qty){
    BigDecimal ZERO = new BigDecimal("0");
    m_LineNetAmt = (LineNetAmt == "0")? ZERO.toString() : LineNetAmt;
    BigDecimal b_Qty = new BigDecimal(Qty);
    BigDecimal b_PriceList = new BigDecimal(PriceList);
    if (PriceList != "" && Qty != "")
      m_ListAmt = b_PriceList.multiply(b_Qty).toString();
    if (m_ListAmt.equals(ZERO.toString()))
      m_ListAmt = m_LineNetAmt;
    BigDecimal b_LineNetAmt = new BigDecimal(LineNetAmt);
    BigDecimal b_ListAmt = new BigDecimal(m_ListAmt);
    m_DiscountAmt = b_ListAmt.subtract(b_LineNetAmt).toString();
    //
    setAmount (m_ListAmt, m_DiscountAmt);
  }   //  setAmounts

  /**
   *  Line Account from Product (or Charge).
   *
   *  @param  AcctType see ProoductInfo.ACCTTYPE_* (0..3)
   *  @param as Accounting schema
   *  @return Requested Product Account
   */
  public Account getAccount (String AcctType, AcctSchema as,ConnectionProvider conn){
    //  Charge Account
    if (m_M_Product_ID.equals("") && !m_C_Charge_ID.equals("")){
      BigDecimal amt = new BigDecimal (-1);   //  Revenue (-)
      if (p_DocumentType.indexOf("AP") != -1)
        amt = new BigDecimal (+1);        //  Expense (+)
      Account acct = getChargeAccount(as, amt,conn);
      if (acct != null)
        return acct;
    }
    //  Product Account
    return p_productInfo.getAccount (AcctType, as,conn);
  }   //  getAccount

  public String getServletInfo() {
    return "Servlet for the accounting";
  } // end of getServletInfo() method
}
