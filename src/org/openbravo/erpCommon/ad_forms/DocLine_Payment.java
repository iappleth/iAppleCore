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

import org.apache.log4j.Logger ;



public class DocLine_Payment extends DocLine {
    static Logger log4jDocLine_Payment = Logger.getLogger(DocLine_Payment.class);

    String Line_ID = "";
    String Amount = "";
    String WriteOffAmt = "";
    String isManual = "";
    String isReceipt = "";
    String isPaid = "";
    String C_Settlement_Cancel_ID = "";
    String C_Settlement_Generate_ID = "";
    String C_GLItem_ID = "";
    String IsDirectPosting = "";
    String dpStatus = "";
    String C_Currency_ID_From; 
    String conversionDate; 
    public DocLine_Payment (String DocumentType, String TrxHeader_ID, String TrxLine_ID){
        super(DocumentType, TrxHeader_ID, TrxLine_ID);
        Line_ID = TrxLine_ID;
        m_Record_Id2 = Line_ID;
    }


    public String getServletInfo() {
    return "Servlet for accounting";
  } // end of getServletInfo() method
}
