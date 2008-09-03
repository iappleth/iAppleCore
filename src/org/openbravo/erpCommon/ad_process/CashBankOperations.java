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
package org.openbravo.erpCommon.ad_process;


import org.openbravo.erpCommon.ad_actionButton.*;
import org.openbravo.erpCommon.businessUtility.WindowTabs;
import org.openbravo.erpCommon.utility.*;

import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.xmlEngine.XmlDocument;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

import java.math.BigDecimal;

// imports for transactions
import java.sql.Connection;

public class CashBankOperations extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void init (ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);



    if (vars.commandIn("DEFAULT")) {
      printPage(response, vars);
    } else if (vars.commandIn("SAVE")) {
      String strCashFrom = vars.getStringParameter("inpCCashFromID");
      String strCashTo = vars.getStringParameter("inpCCashToID");
      String strBankFrom = vars.getStringParameter("inpCBankAccountFromID");
      String strBankTo = vars.getStringParameter("inpCBankAccountToID");
      String strPaymentRuleFrom = vars.getStringParameter("inppaymentruleFrom");
      String strPaymentRuleTo = vars.getStringParameter("inppaymentruleTo");
      String strAmount = vars.getStringParameter("inpAmount");
      String strMovementDate = vars.getStringParameter("inpmovementdate");
      String strDescription = vars.getStringParameter("inpdescription");
      process(vars, strCashFrom, strCashTo, strBankFrom, strBankTo, strPaymentRuleFrom, strPaymentRuleTo, strAmount,strMovementDate, strDescription);
      printPage(response, vars);
    } else pageErrorPopUp(response);
  }

  void process(VariablesSecureApp vars, String strCashFrom, String strCashTo, String strBankFrom, String strBankTo, String strPaymentRuleFrom, String strPaymentRuleTo, String strAmount, String strMovementDate, String strDescription)throws ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Save: CashBankOperations");
    Connection con = null;
     OBError myMessage = null;
     String strSettlementDocumentNo="";
    try {
      con = getTransactionConnection();
      String strBPartner = CashBankOperationsData.select(this, vars.getOrg());
      String strCashCurrency = CashBankOperationsData.selectCashCurrency(this, strCashFrom.equals("")?strCashTo:strCashFrom);
      String strBankCurrency = CashBankOperationsData.selectBankCurrency(this, strBankFrom.equals("")?strBankTo:strBankFrom);
      String strSettlement = SequenceIdData.getSequence(this, "C_Settlement", vars.getClient());
      String strDoctypeId = CashBankOperationsData.selectSettlementDoctypeId(this);
      strSettlementDocumentNo = Utility.getDocumentNo(this, vars, "CashBankOperations", "C_Settlement", "", strDoctypeId, false, true);
      if (strCashFrom.equals("") && strBankTo.equals("")){ //bank -> cash
        CashBankOperationsData.insertSettlement(con,this, strSettlement, vars.getClient(), vars.getOrg(), vars.getUser(), strSettlementDocumentNo, strMovementDate, strDoctypeId, strCashCurrency);
        String strDebtPaymentId = SequenceIdData.getSequence(this, "C_Debt_Payment", vars.getClient());
        
        CashBankOperationsData.insertDebtpayment(con,this, strDebtPaymentId, vars.getClient(), vars.getOrg(), vars.getUser(),
                                                 "Y",strSettlement, strDescription + " - " + Utility.messageBD(this, "DebtPaymentFor", vars.getLanguage()) + Utility.messageBD(this, "Cash", vars.getLanguage()) + CashBankOperationsData.selectCashBook(this,strCashTo), strBPartner, strCashCurrency, "","", strCashTo, strPaymentRuleTo, strAmount, strMovementDate, "");
        insertCash(vars, strCashTo, strAmount, strMovementDate, strCashCurrency,strDescription, strDebtPaymentId, con);
        
     //   CashBankOperationsData.updateCashLine(con,this, strDebtPaymentId, strCashline);
        strDebtPaymentId = SequenceIdData.getSequence(this, "C_Debt_Payment", vars.getClient());
        CashBankOperationsData.insertDebtpayment(con,this, strDebtPaymentId, vars.getClient(), vars.getOrg(), vars.getUser(), 
        "N",strSettlement, strDescription + " - " + Utility.messageBD(this, "DebtPaymentFor", vars.getLanguage()) + CashBankOperationsData.selectBankAccount(this,strBankFrom), strBPartner, strBankCurrency, "",strBankFrom, "", strPaymentRuleTo, strAmount, strMovementDate, "");
        CashBankOperationsData.updateSettlement(con,this, strSettlement);
      }else if (strCashTo.equals("") && strBankFrom.equals("")){ //cash -> bank
        CashBankOperationsData.insertSettlement(con,this, strSettlement, vars.getClient(), vars.getOrg(), vars.getUser(), strSettlementDocumentNo, strMovementDate, strDoctypeId, strBankCurrency);
        String strDebtPaymentId = SequenceIdData.getSequence(this, "C_Debt_Payment", vars.getClient());
        
        CashBankOperationsData.insertDebtpayment(con,this, strDebtPaymentId, vars.getClient(), vars.getOrg(), vars.getUser(),"N",strSettlement, strDescription + " - " + Utility.messageBD(this, "DebtPaymentFor", vars.getLanguage()) + Utility.messageBD(this, "Cash", vars.getLanguage()) + CashBankOperationsData.selectCashBook(this,strCashFrom), strBPartner, strCashCurrency, "","", strCashFrom, strPaymentRuleFrom, strAmount, strMovementDate, "");
        
        insertCash(vars, strCashFrom, negate(strAmount), strMovementDate, strCashCurrency,strDescription,strDebtPaymentId, con);
        //CashBankOperationsData.updateCashLine(con,this, strDebtPaymentId, strCashline);
        strDebtPaymentId = SequenceIdData.getSequence(this, "C_Debt_Payment", vars.getClient());
        CashBankOperationsData.insertDebtpayment(con,this, strDebtPaymentId, vars.getClient(), vars.getOrg(), vars.getUser(), 
        "Y",strSettlement, strDescription + " - " + Utility.messageBD(this, "DebtPaymentFor", vars.getLanguage()) + CashBankOperationsData.selectBankAccount(this,strBankTo), strBPartner, strBankCurrency, "",strBankTo, "", strPaymentRuleTo, strAmount, strMovementDate, "");
        CashBankOperationsData.updateSettlement(con,this, strSettlement);
      }else if (strBankTo.equals("") && strBankFrom.equals("")){ // cash -> cash
        CashBankOperationsData.insertSettlement(con,this, strSettlement, vars.getClient(), vars.getOrg(), vars.getUser(), strSettlementDocumentNo, strMovementDate, strDoctypeId, strCashCurrency);
        String strDebtPaymentId = SequenceIdData.getSequence(this, "C_Debt_Payment", vars.getClient());
        
        
        CashBankOperationsData.insertDebtpayment(con,this, strDebtPaymentId, vars.getClient(), vars.getOrg(), vars.getUser(),"N",strSettlement, strDescription + " - " + Utility.messageBD(this, "DebtPaymentFor", vars.getLanguage()) + Utility.messageBD(this, "Cash", vars.getLanguage()) + CashBankOperationsData.selectCashBook(this,strCashFrom), strBPartner, strCashCurrency, "","", strCashFrom, strPaymentRuleFrom, strAmount, strMovementDate, "");
        insertCash(vars, strCashFrom, negate(strAmount), strMovementDate, strCashCurrency,strDescription, strDebtPaymentId, con);
        //CashBankOperationsData.updateCashLine(con,this, strDebtPaymentId, strCashline);
        
        strDebtPaymentId = SequenceIdData.getSequence(this, "C_Debt_Payment", vars.getClient());
        
        CashBankOperationsData.insertDebtpayment(con,this, strDebtPaymentId, vars.getClient(), vars.getOrg(), vars.getUser(),"Y",strSettlement, strDescription + " - " + Utility.messageBD(this, "DebtPaymentFor", vars.getLanguage()) + Utility.messageBD(this, "Cash", vars.getLanguage()) + CashBankOperationsData.selectCashBook(this,strCashTo), strBPartner, strCashCurrency, "", "",strCashTo, strPaymentRuleTo, strAmount, strMovementDate, "");
        insertCash(vars, strCashTo, strAmount, strMovementDate, strCashCurrency,strDescription, strDebtPaymentId, con);
        //CashBankOperationsData.updateCashLine(con,this, strDebtPaymentId, strCashline);
        CashBankOperationsData.updateSettlement(con,this, strSettlement);
      }else if (strCashTo.equals("") && strCashFrom.equals("")){ //bank -> bank
        CashBankOperationsData.insertSettlement(con,this, strSettlement, vars.getClient(), vars.getOrg(), vars.getUser(), strSettlementDocumentNo, strMovementDate, strDoctypeId, strBankCurrency);
        String strDebtPaymentId = SequenceIdData.getSequence(this, "C_Debt_Payment", vars.getClient());
        CashBankOperationsData.insertDebtpayment(con,this, strDebtPaymentId, vars.getClient(), vars.getOrg(), vars.getUser(), 
        "N",strSettlement, strDescription + " - " + Utility.messageBD(this, "DebtPaymentFor", vars.getLanguage()) + CashBankOperationsData.selectBankAccount(this,strBankFrom), strBPartner, strBankCurrency, "", strBankFrom,"", strPaymentRuleFrom, strAmount, strMovementDate, "");
        strDebtPaymentId = SequenceIdData.getSequence(this, "C_Debt_Payment", vars.getClient());
        CashBankOperationsData.insertDebtpayment(con,this, strDebtPaymentId, vars.getClient(), vars.getOrg(), vars.getUser(), 
        "Y",strSettlement, strDescription + " - " + Utility.messageBD(this, "DebtPaymentFor", vars.getLanguage()) + CashBankOperationsData.selectBankAccount(this,strBankTo), strBPartner, strBankCurrency, "", strBankTo,"", strPaymentRuleTo, strAmount, strMovementDate, "");
        CashBankOperationsData.updateSettlement(con,this, strSettlement);
      }
      releaseCommitConnection(con);
    }catch (Exception e){
      myMessage = Utility.translateError(this, vars, vars.getLanguage(), e.getMessage());
      try {
        releaseRollbackConnection(con);
      } catch (Exception ignored) {}
      log4j.warn(e);
    }
    
    
    if (myMessage==null) {
      myMessage = new OBError();
      myMessage.setType("Success");
      myMessage.setTitle("");
      myMessage.setMessage(Utility.messageBD(this, "PaymentsSettlementDocNo", vars.getLanguage()) + "*FT*" + strSettlementDocumentNo);
    }
    vars.setMessage("CashBankOperations", myMessage);
    
  }

  String negate(String amount){
    BigDecimal amt = new BigDecimal(amount);
    amt = amt.multiply(new BigDecimal("-1.0"));
    return amt.toString();
  }

  String insertCash (VariablesSecureApp vars, String strCashBook, String strAmount, String strDate, String strCurrency, String strDescription, String strDPId, Connection con) throws ServletException{
    String strCash = CashBankOperationsData.selectOpenCash(this, strCashBook, strDate);
    if (strCash.equals("")){
      strCash =SequenceIdData.getSequence(this, "C_Cash", vars.getClient());
      CashBankOperationsData.insertCash(con,this, strCash, vars.getClient(), vars.getOrg(), vars.getUser(), strCashBook, strDate + " - " + CashBankOperationsData.selectCurrency(this, strCurrency), strDate);
    }
    String strCashLine = SequenceIdData.getSequence(this, "C_CashLine", vars.getClient());
    CashBankOperationsData.insertCashLine(con,this, strCashLine, vars.getClient(), vars.getOrg(),vars.getUser(),strCash, strDPId, CashBankOperationsData.selectNextCashLine(this,strCash),strDescription,
    strAmount,strCurrency);
    return strCashLine;
  }


  void printPage(HttpServletResponse response, VariablesSecureApp vars) throws IOException, ServletException {
      if (log4j.isDebugEnabled()) log4j.debug("Output: process CashBankOperations");
      ActionButtonDefaultData[] data = null;
      String strHelp="", strDescription="", strProcessId="800082";
      if (vars.getLanguage().equals("en_US")) data = ActionButtonDefaultData.select(this, strProcessId);
      else data = ActionButtonDefaultData.selectLanguage(this, vars.getLanguage(), strProcessId);
      if (data!=null && data.length!=0) {
        strDescription = data[0].description;
        strHelp = data[0].help;
      }
      String[] discard = {""};
      if (strHelp.equals("")) discard[0] = new String("helpDiscard");
      XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_process/CashBankOperations").createXmlDocument();
      
      ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "CashBankOperations", false, "", "", "",false, "ad_process",  strReplaceWith, false,  true);
      toolbar.prepareSimpleToolBarTemplate();
      xmlDocument.setParameter("toolbar", toolbar.toString());
      xmlDocument.setParameter("calendar", vars.getLanguage().substring(0,2));
      xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
      xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
      xmlDocument.setParameter("question", Utility.messageBD(this, "StartProcess?", vars.getLanguage()));
      xmlDocument.setParameter("description", strDescription);
      xmlDocument.setParameter("help", strHelp);
      xmlDocument.setParameter("datedisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("datesaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
      try {
        ComboTableData comboTableData = new ComboTableData(vars, this, "TABLEDIR", "C_BankAccount_ID", "", "", Utility.getContext(this, vars, "#User_Org", "CashBankOperations"), Utility.getContext(this, vars, "#User_Client", "CashBankOperations"), 0);
        Utility.fillSQLParameters(this, vars, null, comboTableData, "CashBankOperations", "");
        xmlDocument.setData("reportC_BankAccountFrom_ID","liststructure", comboTableData.select(false));
        comboTableData = null;
      } catch (Exception ex) {
        throw new ServletException(ex);
      }


      try {
        ComboTableData comboTableData = new ComboTableData(vars, this, "TABLEDIR", "C_BankAccount_ID", "", "", Utility.getContext(this, vars, "#User_Org", "CashBankOperations"), Utility.getContext(this, vars, "#User_Client", "CashBankOperations"), 0);
        Utility.fillSQLParameters(this, vars, null, comboTableData, "CashBankOperations", "");
        xmlDocument.setData("reportC_BankAccountTo_ID","liststructure", comboTableData.select(false));
        comboTableData = null;
      } catch (Exception ex) {
        throw new ServletException(ex);
      }


      try {
        ComboTableData comboTableData = new ComboTableData(vars, this, "TABLEDIR", "C_CashBook_ID", "", "", Utility.getContext(this, vars, "#User_Org", "CashBankOperations"), Utility.getContext(this, vars, "#User_Client", "CashBankOperations"), 0);
        Utility.fillSQLParameters(this, vars, null, comboTableData, "CashBankOperations", "");
        xmlDocument.setData("reportC_CashFrom_ID","liststructure", comboTableData.select(false));
        comboTableData = null;
      } catch (Exception ex) {
        throw new ServletException(ex);
      }


      try {
        ComboTableData comboTableData = new ComboTableData(vars, this, "TABLEDIR", "C_CashBook_ID", "", "", Utility.getContext(this, vars, "#User_Org", "CashBankOperations"), Utility.getContext(this, vars, "#User_Client", "CashBankOperations"), 0);
        Utility.fillSQLParameters(this, vars, null, comboTableData, "CashBankOperations", "");
        xmlDocument.setData("reportC_CashTo_ID","liststructure", comboTableData.select(false));
        comboTableData = null;
      } catch (Exception ex) {
        throw new ServletException(ex);
      }


      try {
        ComboTableData comboTableData = new ComboTableData(vars, this, "LIST", "", "All_Payment Rule", "", Utility.getContext(this, vars, "#User_Org", "CashBankOperations"), Utility.getContext(this, vars, "#User_Client", "CashBankOperations"), 0);
        Utility.fillSQLParameters(this, vars, null, comboTableData, "CashBankOperations", "");
        xmlDocument.setData("reportPaymentRuleFrom","liststructure", comboTableData.select(false));
        comboTableData = null;
      } catch (Exception ex) {
        throw new ServletException(ex);
      }

      try {
        ComboTableData comboTableData = new ComboTableData(vars, this, "LIST", "", "All_Payment Rule", "", Utility.getContext(this, vars, "#User_Org", "CashBankOperations"), Utility.getContext(this, vars, "#User_Client", "CashBankOperations"), 0);
        Utility.fillSQLParameters(this, vars, null, comboTableData, "CashBankOperations", "");
        xmlDocument.setData("reportPaymentRuleTo","liststructure", comboTableData.select(false));
        comboTableData = null;
      } catch (Exception ex) {
        throw new ServletException(ex);
      }

/*
      String strMessage = vars.getSessionValue("CashBankOperations.message");
      if (!strMessage.equals("")) {
        vars.removeSessionValue("CashBankOperations.message");
        strMessage = "alert('" + Replace.replace(strMessage, "'", "\'") + "');";
      }
      xmlDocument.setParameter("body", strMessage);
*/      
      
      
      
      try {
      WindowTabs tabs = new WindowTabs(this, vars, "org.openbravo.erpCommon.ad_process.CashBankOperations");
      xmlDocument.setParameter("parentTabContainer", tabs.parentTabs());
      xmlDocument.setParameter("mainTabContainer", tabs.mainTabs());
      xmlDocument.setParameter("childTabContainer", tabs.childTabs());
      xmlDocument.setParameter("theme", vars.getTheme());
      NavigationBar nav = new NavigationBar(this, vars.getLanguage(), "CashBankOperations.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
      xmlDocument.setParameter("navigationBar", nav.toString());
      LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "CashBankOperations.html", strReplaceWith);
      xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    {
      OBError myMessage = vars.getMessage("CashBankOperations");
      vars.removeMessage("CashBankOperations");
      if (myMessage!=null) {
        xmlDocument.setParameter("messageType", myMessage.getType());
        xmlDocument.setParameter("messageTitle", myMessage.getTitle());
        xmlDocument.setParameter("messageMessage", myMessage.getMessage());
      }
    }
      
      
      response.setContentType("text/html; charset=UTF-8");
      PrintWriter out = response.getWriter();
      out.println(xmlDocument.print());
      out.close();
    }

  public String getServletInfo() {
    return "Servlet CashBankOperations";
  } // end of getServletInfo() method
}

