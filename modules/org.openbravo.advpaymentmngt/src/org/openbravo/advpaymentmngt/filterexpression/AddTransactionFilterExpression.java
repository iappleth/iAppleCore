package org.openbravo.advpaymentmngt.filterexpression;

import java.math.BigDecimal;
import java.util.Date;
import java.util.Map;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.client.application.FilterExpression;
import org.openbravo.client.application.OBBindingsConstants;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBDateUtils;
import org.openbravo.model.financialmgmt.payment.FIN_BankStatementLine;
import org.openbravo.model.financialmgmt.payment.FIN_FinancialAccount;

public class AddTransactionFilterExpression implements FilterExpression {

  private Logger log = Logger.getLogger(AddTransactionFilterExpression.class);
  private Map<String, String> requestMap;
  String result = null;

  @Override
  public String getExpression(Map<String, String> _requestMap) {
    requestMap = _requestMap;
    requestMap.get(OBBindingsConstants.TAB_ID_PARAM);
    String strCurrentParam = requestMap.get("currentParam");
    Parameters param = Parameters.getParameter(strCurrentParam);
    try {
      switch (param) {
      case TransactionType:
        return getDefaultDocument(requestMap);
      case TransactionDate:
        return getDefaultTransactionDate();
      case AccountingDate:
        return getDefaultAccountingDate();
      case Currency:
        return getDefaultCurrency(requestMap);
      case Organization:
        return getOrganization(requestMap);
      case DepositAmount:
        return getDefaultDepositAmout();
      case WithdrawalAmount:
        return getDefaulWithdrawalAmount();
      case BusinessPartner:
        return getDefaulBusinessPartner();
      case GLItem:
        return getDefaulGLItem();
      case Description:
        return getDefaulDescription();
      case DocumentCategory:
        return getDefaulDocumentCategory();
      }
    } catch (Exception e) {
      log.error("Error trying to get default value of " + strCurrentParam + " " + e.getMessage(), e);
      return null;
    }
    return null;

  }

  private enum Parameters {
    TransactionType("trxtype"), Currency("c_currency_id"), Organization("ad_org_id"), TransactionDate(
        "trxdate"), AccountingDate("dateacct"), DepositAmount("depositamt"), WithdrawalAmount(
        "withdrawalamt"), BusinessPartner("c_bpartner_id"), GLItem("c_glitem_id"), Description(
        "description"), DocumentCategory("DOCBASETYPE");

    private String columnname;

    Parameters(String columnname) {
      this.columnname = columnname;
    }

    public String getColumnName() {
      return this.columnname;

    }

    static Parameters getParameter(String strColumnName) {
      for (Parameters parameter : Parameters.values()) {
        if (strColumnName.equals(parameter.getColumnName())) {
          return parameter;
        }
      }
      return null;
    }
  }

  String getDefaultDocument(Map<String, String> _requestMap) throws JSONException {

    String bankStatementLineId = _requestMap.get("bankStatementLineId");
    FIN_BankStatementLine bankstatementline = OBDal.getInstance().get(FIN_BankStatementLine.class,
        bankStatementLineId);
    if (!(bankstatementline.getDramount().equals(BigDecimal.ZERO))) {
      return "BPW";
    } else {
      return "BPD";
    }

  }

  String getDefaultTransactionDate() throws JSONException {
    return getDefaultAccountingDate();
  }

  String getDefaultAccountingDate() throws JSONException {
    String bankStatementLineId = requestMap.get("bankStatementLineId");
    FIN_BankStatementLine bankstatementline = OBDal.getInstance().get(FIN_BankStatementLine.class,
        bankStatementLineId);
    return OBDateUtils.formatDate(bankstatementline.getTransactionDate());
  }

  String getDefaultCurrency() throws JSONException {
    return OBDateUtils.formatDate(new Date());
  }

  String getDefaultCurrency(Map<String, String> _requestMap) throws JSONException {
    return getFinancialAccount(_requestMap).getCurrency().getId().toString();
  }

  private FIN_FinancialAccount getFinancialAccount(Map<String, String> requestMap)
      throws JSONException {
    JSONObject context = new JSONObject(requestMap.get("context"));
    if (context.has("inpfinFinancialAccountId") && !context.isNull("inpfinFinancialAccountId")
        && !"".equals(context.getString("inpfinFinancialAccountId"))) {
      return OBDal.getInstance().get(FIN_FinancialAccount.class,
          context.get("inpfinFinancialAccountId"));
    } else if (context.has("Fin_Financial_Account_ID")
        && !context.isNull("Fin_Financial_Account_ID")
        && !"".equals(context.getString("Fin_Financial_Account_ID"))) {
      return OBDal.getInstance().get(FIN_FinancialAccount.class,
          context.get("Fin_Financial_Account_ID"));

    }
    return null;
  }

  String getDefaultDepositAmout() {
    String bankStatementLineId = requestMap.get("bankStatementLineId");
    FIN_BankStatementLine bankstatementline = OBDal.getInstance().get(FIN_BankStatementLine.class,
        bankStatementLineId);
    if (!(bankstatementline.getDramount().equals(BigDecimal.ZERO))) {
      return "0.00";
    } else {
      return bankstatementline.getCramount().toString();
    }
  }

  String getDefaulWithdrawalAmount() {
    String bankStatementLineId = requestMap.get("bankStatementLineId");
    FIN_BankStatementLine bankstatementline = OBDal.getInstance().get(FIN_BankStatementLine.class,
        bankStatementLineId);
    if (!(bankstatementline.getDramount().equals(BigDecimal.ZERO))) {
      return bankstatementline.getDramount().toString();
    } else {
      return "0.00";
    }
  }

  String getOrganization(Map<String, String> _requestMap) throws JSONException {
    return getFinancialAccount(_requestMap).getOrganization().getId();
  }

  private String getDefaulGLItem() {
    String bankStatementLineId = requestMap.get("bankStatementLineId");
    FIN_BankStatementLine bankstatementline = OBDal.getInstance().get(FIN_BankStatementLine.class,
        bankStatementLineId);
    return bankstatementline.getGLItem() != null ? bankstatementline.getGLItem().getId() : null;
  }

  private String getDefaulBusinessPartner() {
    String bankStatementLineId = requestMap.get("bankStatementLineId");
    FIN_BankStatementLine bankstatementline = OBDal.getInstance().get(FIN_BankStatementLine.class,
        bankStatementLineId);
    return bankstatementline.getBusinessPartner() != null ? bankstatementline.getBusinessPartner()
        .getId() : null;
  }

  private String getDefaulDescription() {
    String bankStatementLineId = requestMap.get("bankStatementLineId");
    FIN_BankStatementLine bankstatementline = OBDal.getInstance().get(FIN_BankStatementLine.class,
        bankStatementLineId);
    return bankstatementline.getDescription();
  }

  String getDefaulDocumentCategory() {
    return "FAT";
  }
}
