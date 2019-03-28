/*
 ************************************************************************************
 * Copyright (C) 2013-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.term;

import java.util.ArrayList;
import java.util.List;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.mobile.core.model.HQLProperty;
import org.openbravo.mobile.core.model.ModelExtension;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.retail.posterminal.POSUtils;
import org.openbravo.retail.posterminal.PrintTemplate;
import org.openbravo.retail.posterminal.PrintTemplateSubrep;
import org.openbravo.service.json.JsonConstants;

@Qualifier(Terminal.terminalPropertyExtension)
public class TerminalProperties extends ModelExtension {

  private static Logger log = LogManager.getLogger();

  @Override
  public List<HQLProperty> getHQLProperties(final Object params) {

    final ArrayList<HQLProperty> list = new ArrayList<HQLProperty>();
    list.add(new HQLProperty("pos.id", "id"));
    list.add(new HQLProperty("(COALESCE(pos.defaultCustomer.id, org.obretcoCBpartner.id))",
        "businessPartner"));
    list.add(new HQLProperty("pos.name", "_identifier"));
    list.add(new HQLProperty("pos.searchKey", "searchKey"));
    list.add(new HQLProperty("(COALESCE(pos.obposCBpartnerLoc.id, org.obretcoCBpLocation.id))",
        "partnerAddress"));
    list.add(new HQLProperty("org.obposLayawayAnonymousbp", "layaway_anonymouscustomer"));
    list.add(new HQLProperty("org.obposQuotationAnonymousbp", "quotation_anonymouscustomer"));
    list.add(new HQLProperty("org.id", "organization"));
    list.add(new HQLProperty("org.name", getIdentifierAlias("organization")));
    list.add(new HQLProperty("pos.client.id", "client"));
    list.add(new HQLProperty("pos.client.name", getIdentifierAlias("client")));
    list.add(new HQLProperty("pos.hardwareurl", "hardwareurl"));
    list.add(new HQLProperty("pos.isbluetoothprinter", "isbluetoothprinter"));
    list.add(new HQLProperty("pos.scaleurl", "scaleurl"));
    list.add(new HQLProperty("org.obretcoDbpIrulesid", "defaultbp_invoiceterm"));
    list.add(new HQLProperty("org.obretcoDbpPtermid.id", "defaultbp_paymentterm"));
    list.add(new HQLProperty("org.obretcoDbpPmethodid.id", "defaultbp_paymentmethod"));
    list.add(new HQLProperty("org.obretcoDbpBpcatid.id", "defaultbp_bpcategory"));
    list.add(new HQLProperty(
        "(select pos2.organization.obretcoDbpBpcatid.name from OBPOS_Applications pos2 where pos2 = pos)",
        "defaultbp_bpcategory_name"));
    list.add(new HQLProperty("org.obretcoDbpCountryid.id", "defaultbp_bpcountry"));
    list.add(new HQLProperty(
        "(select pos2.organization.obretcoDbpCountryid.name from OBPOS_Applications pos2 where pos2 = pos)",
        "defaultbp_bpcountry_name"));
    list.add(new HQLProperty("org.obretcoDbpOrgid.id", "defaultbp_bporg"));
    list.add(new HQLProperty("org.obretcoShowtaxid", "bp_showtaxid"));
    list.add(new HQLProperty("org.obretcoShowbpcategory", "bp_showcategoryselector"));
    list.add(new HQLProperty("pos.orderdocnoPrefix", "docNoPrefix"));
    list.add(new HQLProperty("coalesce(pos.quotationdocnoPrefix, concat(pos.searchKey, 'QT'))",
        "quotationDocNoPrefix"));
    list.add(new HQLProperty("pos.returndocnoPrefix", "returnDocNoPrefix"));
    list.add(new HQLProperty("pos.obposTerminaltype.allowpayoncredit", "allowpayoncredit"));
    list.add(new HQLProperty("pos.obposTerminaltype.multiChange", "multiChange"));
    list.add(new HQLProperty("org.obposCountDiffLimit", "organizationCountDiffLimit"));
    list.add(new HQLProperty("pos.defaultwebpostab", "defaultwebpostab"));
    list.add(new HQLProperty("postype", "terminalType"));
    list.add(new HQLProperty("pos.printoffline", "printoffline"));
    list.add(new HQLProperty("pos.ismaster", "ismaster"));
    list.add(new HQLProperty("pos.documentnoPadding", "documentnoPadding"));
    list.add(new HQLProperty("CASE WHEN pos.masterterminal.id is not null THEN true ELSE false END",
        "isslave"));
    list.add(new HQLProperty("'" + OBContext.getOBContext().getLanguage().getLanguage() + "'",
        "language_string"));
    list.add(new HQLProperty("org.obposReturnAnonymousbp", "returns_anonymouscustomer"));
    list.add(
        new HQLProperty("CASE WHEN org.obretcoCustomerseq.id is not null THEN true ELSE false END",
            "hasCustomerSequence"));
    list.add(new HQLProperty("org.obposPrepaymentAlgorithm", "prepaymentAlgorithm"));
    list.add(new HQLProperty("org.obposPrepaymentPerc", "obposPrepaymentPerc"));
    list.add(new HQLProperty("org.obposPrepaymentPercLimit", "obposPrepaymentPercLimit"));
    list.add(new HQLProperty("org.obposPrepayPercLayLimit", "obposPrepayPercLayLimit"));
    list.add(new HQLProperty("org.obposSeparatorCR", "cancelAndReplaceSeparator"));

    addTemplateProperty(Organization.PROPERTY_OBPOSCASHUPTEMPLATE, "printCashUpTemplate", list);
    addTemplateProperty(Organization.PROPERTY_OBPOSCASHMGMTEMPLATE, "printCashMgmTemplate", list);
    addTemplateProperty(Organization.PROPERTY_OBPOSTICKETTEMPLATE, "printTicketTemplate", list);
    addTemplateProperty(Organization.PROPERTY_OBPOSRETURNTEMPLATE, "printReturnTemplate", list);
    addTemplateProperty(Organization.PROPERTY_OBPOSINVOICETEMPLATE, "printInvoiceTemplate", list);
    addTemplateProperty(Organization.PROPERTY_OBPOSRETINVTEMPLATE, "printReturnInvoiceTemplate",
        list);
    addTemplateProperty(Organization.PROPERTY_OBPOSLAYAWAYTEMPLATE, "printLayawayTemplate", list);
    addTemplateProperty(Organization.PROPERTY_OBPOSCLOSEDRECEIPTTEMPLATE,
        "printClosedReceiptTemplate", list);
    addTemplateProperty(Organization.PROPERTY_OBPOSQUOTTEMPLATE, "printQuotationTemplate", list);
    addTemplateProperty(Organization.PROPERTY_OBPOSCLOINVTEMPLATE, "printClosedInvoiceTemplate",
        list);
    addTemplateProperty(Organization.PROPERTY_OBPOSCANCRPTTEMPLATE, "printCanceledReceiptTemplate",
        list);
    addTemplateProperty(Organization.PROPERTY_OBPOSCANCLAYAWAYTMPLT, "printCanceledLayawayTemplate",
        list);
    addTemplateProperty(Organization.PROPERTY_OBPOSWELCOMETEMPLATE, "printWelcomeTemplate", list);

    // Legal Organization Tax ID
    Organization org = OBDal.getInstance()
        .get(Organization.class, OBContext.getOBContext().getCurrentOrganization().getId());
    while (org != null) {
      if (org.getId().equals("0")) {
        break;
      }
      if (org.getOrganizationType().isLegalEntity()) {
        list.add(new HQLProperty(
            "(select max(taxID) from OrganizationInformation oi where oi.organization.id = '"
                + org.getId() + "')",
            "organizationTaxId"));
        break;
      }
      org = OBContext.getOBContext().getOrganizationStructureProvider().getParentOrg(org);
    }

    return list;
  }

  private String getIdentifierAlias(final String propertyName) {
    return propertyName + DalUtil.FIELDSEPARATOR + JsonConstants.IDENTIFIER;
  }

  protected void addTemplateProperty(final String propertyName, final String alias,
      final List<HQLProperty> list) {
    try {
      OBContext.setAdminMode(false);
      final PrintTemplate value = (PrintTemplate) POSUtils
          .getPropertyInOrgTree(OBContext.getOBContext().getCurrentOrganization(), propertyName);
      if (value != null) {
        list.add(new HQLProperty("'" + value.getTemplatePath() + "'", alias));
        list.add(new HQLProperty("'" + value.isPdf() + "'", alias + "IsPdf"));
        if (value.isPdf()) {
          list.add(new HQLProperty("'" + value.getPrinter() + "'", alias + "Printer"));
        }
        int i = 0;
        for (final PrintTemplateSubrep subrep : value.getOBPOSPrintTemplateSubrepList()) {
          list.add(new HQLProperty("'" + subrep.getTemplatePath() + "'", alias + "Subrep" + i));
          i++;
        }
      }
    } catch (final Exception e) {
      log.error("Error getting property " + propertyName, e);
    } finally {
      OBContext.restorePreviousMode();
    }
  }
}
