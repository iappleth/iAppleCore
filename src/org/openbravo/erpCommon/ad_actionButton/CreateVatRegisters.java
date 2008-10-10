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
 * All portions are Copyright (C) 2008 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
*/
package org.openbravo.erpCommon.ad_actionButton;

import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.erpCommon.ad_forms.DocInvoice;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.SequenceIdData;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.utils.FormatUtilities;
import org.openbravo.xmlEngine.XmlDocument;

public class CreateVatRegisters extends HttpSecureAppServlet {
	private static final long serialVersionUID = 1L;

	static final BigDecimal ZERO = new BigDecimal(0.0);

	public void init(ServletConfig config) {
		super.init(config);
		boolHist = false; 
	}

	public void doPost(HttpServletRequest request, HttpServletResponse response)
			throws IOException, ServletException {
		VariablesSecureApp vars = new VariablesSecureApp(request);
		
		if (vars.commandIn("DEFAULT")) {
			String strTaxpaymentID = vars.getStringParameter("inpcTaxpaymentId");
			TaxPayment[] taxpayment = TaxPayment.select(this, strTaxpaymentID);
			String strDatefrom = taxpayment[0].datefrom; 
			String strDateto = taxpayment[0].dateto;
			String strProcessed = taxpayment[0].getField("PROCESSED");
			String strGeneratePayment = taxpayment[0].getField("GENERATEPAYMENT");
			String strProcessing = taxpayment[0].getField("PROCESSING");
			String strWindowId = vars.getStringParameter("inpWindowId");
		    String strTabId = vars.getStringParameter("inpTabId");
			printPage(response, vars, strWindowId, strTabId, strDatefrom, strDateto, strGeneratePayment, strProcessed, strProcessing, strTaxpaymentID);
			// bdErrorGeneralPopUp(response, "DEFAULT",
			// vars.getStringParameter("inpcTaxpaymentId"));
			
			// To do Print Report of Registers created
		} else if (vars.commandIn("SAVE")) {
			String strTaxpaymentID = vars.getStringParameter("inpTaxpaymentID");
			String strDatefrom = vars.getStringParameter("inpDatefrom");
			String strDateto = vars.getStringParameter("inpDateto");
			String strProcessed = vars.getStringParameter("inpProcessed");
			String strGeneratePayment = vars.getStringParameter("inpGeneratePayment");
			String strProcessing = vars.getStringParameter("inpProcessing");
			OBError myMessage=CreateRegisters(vars, strTaxpaymentID, strDatefrom, strDateto, strProcessed, strGeneratePayment, strProcessing);
			//try this
			
	//		  String strWindowId = vars.getStringParameter("inpWindowId");
		      String strTabId = vars.getStringParameter("inpTabId");
			ActionButtonDefaultData[] tab = ActionButtonDefaultData.windowName(this, strTabId);
		      String strWindowPath="", strTabName="";
		      if (tab!=null && tab.length!=0) {
		        strTabName = FormatUtilities.replace(tab[0].name);
		        strWindowPath = "../" + FormatUtilities.replace(tab[0].description) + "/" + strTabName + "_Relation.html";
		      } else strWindowPath = strDefaultServlet;
		      //if (!message.equals("")) vars.setSessionValue(strWindowId + "|" + strTabName + ".message", message);
		 
		     
		      vars.setMessage(strTabId, myMessage);
		     
		      
		      printPageClosePopUp(response, vars, strWindowPath);
		    } else pageErrorPopUp(response);
			//advisePopUp(response,"INFO","Create VAT Register",message);
			//bdErrorGeneralPopUp(response, "SAVE", vars
				//	.getStringParameter("inpcTaxpaymentId"));
		}
		/*
		 * if (vars.commandIn("DEFAULT")) { printPage(response, vars, "", "",
		 * "", "", "", ""); } else if (vars.commandIn("SAVE")) {
		 * 
		 * String strGeneratepayment =
		 * vars.getStringParameter("inpgeneratepayment"); String strProcessed =
		 * vars.getStringParameter("inpprocessed"); String strProcessing =
		 * vars.getStringParameter("inpprocessing");
		 * 
		 * //alp OBError myMessage = processButton(vars, strTaxpaymentID,
		 * strDatefrom, strDateto, strGeneratepayment, strProcessed,
		 * strProcessing); //alp vars.setMessage("CreateVatRegisters",
		 * myMessage); //vars.setSessionValue("ExpenseSOrder|message",
		 * messageResult);
		 * 
		 * printPage(response, vars, strTaxpaymentID, strDatefrom, strDateto,
		 * strGeneratepayment, strProcessed, strProcessing); t } else
		 * pageErrorPopUp(response);
		 */
	

	public OBError CreateRegisters(VariablesSecureApp vars, String  strTaxpaymentID, String strDatefrom, String strDateto, String strProcessed, String strGeneratePayment, String strProcessing) throws IOException,
			ServletException {
		// Connection conn = getTransactionConnection();	
		OBError myMessage = null;
		TaxPayment[] taxpayment = TaxPayment.select(this, strTaxpaymentID);
		String strUser = vars.getUser();
				log4j.info("strTaxpaymentID: " + strTaxpaymentID + "strDatefrom: " + strDatefrom + "strDateto: " + strDateto  + "strProcessed: " + strProcessed + "strGeneratePayment: " + strGeneratePayment);
		// If processing=n then i deleted all old record of tax register and
		// register lines
		if (strProcessed.equalsIgnoreCase("N")) {
			//check for already used periods)
			Double CrossPeriodCount = new Double(TaxPayment.selectCrossPeriodCount(this, vars.getClient(), strDatefrom, strDateto));
			if (CrossPeriodCount.intValue() > 0){
				myMessage = Utility.translateError(this, vars, vars.getLanguage(), Utility.messageBD(this, "PeriodsDontMatch", vars.getLanguage()));
            return myMessage;
            }
			
			TaxPayment.deleteRegisterLinesChild(this, strTaxpaymentID);
			TaxPayment.deleteRegisterChild(this, strTaxpaymentID);

			// Select all active Register Type for create the Tax Registers
			TaxRegisterType[] taxregistertypes = TaxRegisterType.select(this, vars.getClient());
				log4j.info("2strTaxpaymentID: " + strTaxpaymentID + "strDatefrom: " + strDatefrom + "strDateto: " + strDateto  + "strProcessed: " + strProcessed + "strGeneratePayment: " + strGeneratePayment);
			 
			 
			 
			// For all active Register Type i create a Tax Register
			for (TaxRegisterType taxRegisterType : taxregistertypes) {
				String strSequence = SequenceIdData.getSequence(this,
						"C_TaxRegister", vars.getClient());
				log4j.info("Sequence: " + strSequence);

				TaxRegister.insert(this, taxpayment[0].adClientId,
						taxpayment[0].adOrgId, strSequence, strTaxpaymentID,
						taxRegisterType.cTaxregisterTypeId, "0", taxRegisterType.registername ,
						strUser, strUser);
			}
			// For every TaxRegister i select the invoices with a specific
			// doctype
			// in that specific period and inser them in the respective
			// TaxRegisterLine
				log4j.info("3strTaxpaymentID: " + strTaxpaymentID + "strDatefrom: " + strDatefrom + "strDateto: " + strDateto  + "strProcessed: " + strProcessed + "strGeneratePayment: " + strGeneratePayment);
      TaxRegister[] taxregisters = TaxRegister.selectChild(this,
					strTaxpaymentID);
			for (TaxRegister taxRegister : taxregisters) {
				CreateVatRegistersData[] invoices = CreateVatRegistersData.select(this, strTaxpaymentID,
						taxRegister.cTaxregisterTypeId, strDatefrom, strDateto);
				for (CreateVatRegistersData myinvoice : invoices) {
					String strTaxBaseAmt = "0";
					String strTaxAmt = "0";
					String strTaxUndeducAmt = "0";
					String strExemptAmt = "0";
					String strTotalAmt = "0";
					String strNoVatAmt = "0";
					
					log4j.info("cTaxregisterTypeId: " + taxRegister.cTaxregisterTypeId + "strTaxpaymentID: " + strTaxpaymentID + "strDatefrom: " + strDatefrom  + "strDateto: " + strDateto + "strGeneratePayment: " + strGeneratePayment);
					if ((myinvoice.istaxexempt.equals("N"))
							&& (myinvoice.istaxundeductable.equals("N"))
							&& (myinvoice.isnovat.equals("N"))) {
						strTaxBaseAmt = myinvoice.taxbaseamt;
						strTaxAmt = myinvoice.taxamt;
					} else if ((myinvoice.istaxexempt.equals("Y"))
							&& (myinvoice.istaxundeductable.equals("N"))
							&& (myinvoice.isnovat.equals("N"))) {
						strTaxAmt = myinvoice.taxamt;
						strExemptAmt = myinvoice.taxbaseamt;
					} else if ((myinvoice.istaxexempt.equals("N") )
							&& (myinvoice.istaxundeductable.equals("Y") )
							&& (myinvoice.isnovat.equals("N"))) {
						strTaxBaseAmt = myinvoice.taxbaseamt;
						strTaxUndeducAmt = myinvoice.taxamt;
					} else if ((myinvoice.istaxexempt.equals("N"))
							&& (myinvoice.istaxundeductable.equals("N"))
							&& (myinvoice.isnovat.equals("Y"))) {
						strNoVatAmt = myinvoice.taxbaseamt;
						strTaxAmt = myinvoice.taxamt;
					} else {
						//if (!(((myinvoice.istaxexempt.equals("Y") )
						//	^ (myinvoice.istaxundeductable.equals("Y"))
						//	^ (myinvoice.isnovat.equals("Y"))))) {
						//return "InvoiceTax Error: istaxexempt, istaxundeduc or isnovat could have wrong values,  C_InvoiceTax_ID="+myinvoice.cInvoicetaxId;
						myMessage = Utility.translateError(this, vars, vars.getLanguage(), Utility.messageBD(this, "TaxCriteriaNotFound", vars.getLanguage()));
				        return myMessage;	
					}
					if (myinvoice.docbasetype.equals(DocInvoice.DOCTYPE_APCredit) || myinvoice.docbasetype.equals(DocInvoice.DOCTYPE_ARCredit)){
						strTaxBaseAmt = new Double(new Double(strTaxBaseAmt) * new Double(-1)).toString();
						strTaxAmt = new Double(new Double(strTaxAmt) * new Double(-1)).toString();
						strTaxUndeducAmt = new Double(new Double(strTaxUndeducAmt) * new Double(-1)).toString();
						strExemptAmt = new Double(new Double(strExemptAmt) * new Double(-1)).toString();
						strNoVatAmt = new Double(new Double(strNoVatAmt) * new Double(-1)).toString();
					}
					
					// Calculate totalamt
				log4j.info("4strTaxpaymentID: " + strTaxpaymentID + "strDatefrom: " + strDatefrom + "strDateto: " + strDateto  + "strProcessed: " + strProcessed + "strGeneratePayment: " + strGeneratePayment);

          Double dbTotalAmt = new Double(strTaxBaseAmt)
							+ new Double(strTaxAmt)
							+ new Double(strTaxUndeducAmt)
							+ new Double(strExemptAmt)
							+ new Double(strNoVatAmt);

					strTotalAmt = dbTotalAmt.toString();

					String strSequence = SequenceIdData.getSequence(this,
							"C_TaxRegisterline", vars.getClient());
					log4j.info("Sequence: " + strSequence);

					TaxRegister
							.insertLines(this, taxRegister.adClientId,
									taxRegister.adOrgId, strSequence,
									taxRegister.cTaxregisterId,
									myinvoice.cInvoicetaxId,
									myinvoice.documentno, myinvoice.cTaxId,
									strTaxBaseAmt, strTaxAmt, strTaxUndeducAmt,
									strExemptAmt, strNoVatAmt, strTotalAmt,
									myinvoice.taxdate, "RegisterLine", strUser,
									strUser);

				}
				TaxRegister.updateTaxTotalAmt(this, taxRegister.cTaxregisterId);
				TaxRegister.updateRegAccumAmt(this, taxRegister.cTaxregisterId, taxRegister.cTaxregisterTypeId, strDatefrom);
			}
			// if GeneratePayment= Y then i set the field processing = N so next
			// time i print only the tax registers
			//if (strProcessing.equalsIgnoreCase("Y")) {
			//	TaxPayment
			//			.updateProcessed(this, "Y", strUser, strTaxpaymentID);
			//}
				log4j.info("5strTaxpaymentID: " + strTaxpaymentID + "strDatefrom: " + strDatefrom + "strDateto: " + strDateto  + "strProcessed: " + strProcessed + "strGeneratePayment: " + strGeneratePayment);

		try{		
      if (new Double(TaxPayment.calculateVatPayment(this, strTaxpaymentID)).compareTo(new Double(0))>0) {
				TaxPayment.updateGeneratePayment(this, "Y", strUser, strTaxpaymentID);
			}else TaxPayment.updateGeneratePayment(this, "N", strUser, strTaxpaymentID);
		}catch (NumberFormatException e){
			myMessage = Utility.translateError(this, vars, vars.getLanguage(), Utility.messageBD(this, "NoDataSelected", vars.getLanguage()));
            return myMessage;
		}
			if (myMessage==null) {
			      myMessage = new OBError();
			      myMessage.setType("Success");
			      myMessage.setTitle("");
			      myMessage.setMessage(Utility.messageBD(this, "Success", vars.getLanguage()));
			    }
			    return myMessage;
			
			
		}
	 
	   else
		   myMessage = Utility.translateError(this, vars, vars.getLanguage(), Utility.messageBD(this, "ProcessRunError", vars.getLanguage()));
        return myMessage;
	
		// Select all active Register Type Lines of Tax Register
		// for (TaxRegisterType taxRegisterType : taxregistertypes) {
		// TaxRegisterTypeLines[] taxregistertypelines =
		// TaxRegisterTypeLines.select(this,taxRegisterType.cTaxregisterTypeId
		// );
		// }

	}

	void printPage(HttpServletResponse response, VariablesSecureApp vars, String strWindowId, String strTabId, String strDatefrom, String strDateto, String strGeneratePayment, String strProcessed, String strProcessing, String strTaxpaymentID)
    throws IOException, ServletException {
      if (log4j.isDebugEnabled()) log4j.debug("Output: Print Vat Registers confirm window");
/*
      ActionButtonDefaultData[] data = null;
      String strHelp="", strDescription="";
      if (vars.getLanguage().equals("en_US")) data = ActionButtonDefaultData.select(this, strProcessId);
      else data = ActionButtonDefaultData.selectLanguage(this, vars.getLanguage(), strProcessId);

      if (data!=null && data.length!=0) {
        strDescription = data[0].description;
        strHelp = data[0].help;
      }
      */
      String[] discard = {""};
     // if (strHelp.equals("")) discard[0] = new String("helpDiscard");
      discard[0] = new String("helpDiscard");
      XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_actionButton/CreateVatRegisters", discard).createXmlDocument();
      xmlDocument.setParameter("windowId", strWindowId);
      xmlDocument.setParameter("tabId", strTabId);
      xmlDocument.setParameter("Datefrom", strDatefrom);
      xmlDocument.setParameter("Dateto", strDateto);
      xmlDocument.setParameter("GeneratePayment", strGeneratePayment);
      xmlDocument.setParameter("Processed", strProcessed);
      xmlDocument.setParameter("TaxpaymentID", strTaxpaymentID);
      xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
      xmlDocument.setParameter("question", Utility.messageBD(this, "StartProcess?", vars.getLanguage()));
      xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
      xmlDocument.setParameter("theme", vars.getTheme());
      xmlDocument.setParameter("Processing", strProcessing);
      xmlDocument.setParameter("help", "");

      
      response.setContentType("text/html; charset=UTF-8");
      PrintWriter out = response.getWriter();
      out.println(xmlDocument.print());
      out.close();
    }

	public String getServletInfo() {
		return "Servlet Project set Type";
	} // end of getServletInfo() method
}
