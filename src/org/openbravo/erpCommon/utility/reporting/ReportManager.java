/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo Public License
 * Version 1.1 (the "License"), being the Mozilla Public License
 * Version 1.1 with a permitted attribution clause; you may not use this
 * file except in compliance with the License. You may obtain a copy of
 * the License at http://www.openbravo.com/legal/license.html
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Business Momentum b.v.
 * All portions are Copyright (C) 2007-2016 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  Business Momentum b.v. (http://www.businessmomentum.eu).
 *************************************************************************
 */
package org.openbravo.erpCommon.utility.reporting;

import java.io.File;
import java.io.IOException;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperPrint;

import org.apache.log4j.Logger;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.base.weld.WeldUtils;
import org.openbravo.client.application.attachment.AttachImplementationManager;
import org.openbravo.client.application.attachment.CoreAttachImplementation;
import org.openbravo.client.application.report.ReportingUtils;
import org.openbravo.client.application.report.ReportingUtils.ExportType;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.utils.Replace;

public class ReportManager {
  private static Logger log4j = Logger.getLogger(ReportManager.class);
  private static final String TEMP_REPORT_DIR = "tmp";
  public static final String GENERATED_BY_PRINTING = "Generated by printing ";
  public static final String GENERATED_BY_EMAILING = "Generated by e-mailing ";

  private ConnectionProvider _connectionProvider;
  private String _strBaseDesignPath;
  private String _strDefaultDesignPath;
  private String language;
  private String _strBaseWeb; // BASE WEB!!!!!!
  private String _prefix;
  private String _strAttachmentPath;
  private boolean multiReports = false;

  public ReportManager(ConnectionProvider connectionProvider, String ftpDirectory,
      String replaceWithFull, String baseDesignPath, String defaultDesignPath, String prefix,
      boolean multiReport) {
    _connectionProvider = connectionProvider;
    _strBaseWeb = replaceWithFull;
    _strBaseDesignPath = baseDesignPath;
    _strDefaultDesignPath = defaultDesignPath;
    _strAttachmentPath = ftpDirectory;
    _prefix = prefix;
    multiReports = multiReport;

    // Strip of ending slash character
    if (_strBaseDesignPath.endsWith("/"))
      _strBaseDesignPath = _strBaseDesignPath.substring(0, _strBaseDesignPath.length() - 1);
    if (_strDefaultDesignPath.endsWith("/"))
      _strDefaultDesignPath = _strDefaultDesignPath
          .substring(0, _strDefaultDesignPath.length() - 1);
  }

  public JasperPrint processReport(Report report, VariablesSecureApp variables)
      throws ReportingException {

    setTargetDirectory(report);
    language = variables.getLanguage();
    final String baseDesignPath = _prefix + "/" + _strBaseDesignPath + "/" + _strDefaultDesignPath;

    String templateLocation = report.getTemplateInfo().getTemplateLocation();
    templateLocation = Replace.replace(
        Replace.replace(templateLocation, "@basedesign@", baseDesignPath), "@baseattach@",
        _strAttachmentPath);
    templateLocation = Replace.replace(templateLocation, "//", "/");
    final String templateFile = templateLocation + report.getTemplateInfo().getTemplateFilename();

    final HashMap<String, Object> designParameters = populateDesignParameters(variables, report);
    designParameters.put("TEMPLATE_LOCATION", templateLocation);
    JasperPrint jasperPrint = null;

    String salesOrder = report.getCheckSalesOrder();
    if (salesOrder != null && salesOrder.equals("Y")) {
      designParameters.put(
          "DOCUMENT_NAME",
          Utility.messageBD(_connectionProvider, "Sales", language) + " "
              + Utility.messageBD(_connectionProvider, "Invoice", language));
    } else {
      designParameters.put(
          "DOCUMENT_NAME",
          Utility.messageBD(_connectionProvider, "Purchase", language) + " "
              + Utility.messageBD(_connectionProvider, "Invoice", language));
    }
    try {
      jasperPrint = ReportingUtils.generateJasperPrint(templateFile, designParameters, true,
          _connectionProvider, null);
    } catch (final Exception exception) {
      log4j.error(exception.getMessage());
      exception.getStackTrace();
      throw new ReportingException(exception);
    }

    return jasperPrint;
  }

  private String getAttachmentPath() {
    return _strAttachmentPath;
  }

  private String getTempReportDir() {
    return TEMP_REPORT_DIR;
  }

  public void setTargetDirectory(Report report) {
    final File targetDirectory = new File(getAttachmentPath() + "/" + getTempReportDir());
    if (!targetDirectory.exists())
      targetDirectory.mkdirs();
    report.setTargetDirectory(targetDirectory);
  }

  public void saveTempReport(Report report, VariablesSecureApp vars) {
    JasperPrint jasperPrint = null;
    try {
      jasperPrint = processReport(report, vars);
      saveReport(report, jasperPrint);
    } catch (final ReportingException e) {
      log4j.error(e.getMessage());
      e.printStackTrace();
    }
  }

  private void saveReport(Report report, JasperPrint jasperPrint) {
    String separator = "";
    if (!report.getTargetDirectory().toString().endsWith("/")) {
      separator = "/";
    }
    final String target = report.getTargetDirectory() + separator + report.getFilename();
    try {
      ReportingUtils.saveReport(jasperPrint, ExportType.PDF, null, new File(target));
    } catch (final JRException e) {
      e.printStackTrace();
    }
  }

  public File createAttachmentForReport(ConnectionProvider connectionProvider, Report report,
      String tableId, VariablesSecureApp vars) throws ReportingException, IOException {
    return createAttachmentForReport(connectionProvider, report, tableId, vars,
        GENERATED_BY_PRINTING);
  }

  public File createAttachmentForReport(ConnectionProvider connectionProvider, Report report,
      String tableId, VariablesSecureApp vars, String textForAttachment) throws ReportingException,
      IOException {
    if (report.isAttached())
      throw new ReportingException(Utility.messageBD(connectionProvider, "AttachmentExists",
          vars.getLanguage()));

    final String destination = CoreAttachImplementation.getAttachmentDirectoryForNewAttachments(
        tableId, report.getDocumentId());

    // First move the file to the correct destination
    final File destinationFolder = new File(_strAttachmentPath + "/" + destination);
    if (!destinationFolder.exists()) {
      destinationFolder.mkdirs();
    }
    report.setTargetDirectory(destinationFolder);

    final JasperPrint jasperPrint = processReport(report, vars);
    saveReport(report, jasperPrint);

    final File sourceFile = new File(report.getTargetLocation());

    AttachImplementationManager aim = WeldUtils
        .getInstanceFromStaticBeanManager(AttachImplementationManager.class);

    // Add Core's default desc parameter id with textForAttachment for backwards compatibility
    Map<String, String> requestParams = new HashMap<String, String>();
    requestParams.put("E22E8E3B737D4A47A691A073951BBF16", textForAttachment);

    aim.upload(requestParams, vars.getSessionValue("inpTabId"), report.getDocumentId(),
        vars.getOrg(), sourceFile);

    report.setAttached(true);

    return sourceFile;
  }

  private HashMap<String, Object> populateDesignParameters(VariablesSecureApp variables,
      Report report) {
    final String baseDesignPath = _prefix + "/" + _strBaseDesignPath + "/" + _strDefaultDesignPath;
    final HashMap<String, Object> designParameters = new HashMap<String, Object>();

    designParameters.put("DOCUMENT_ID", report.getDocumentId());

    designParameters.put("BASE_ATTACH", _strAttachmentPath);
    designParameters.put("BASE_WEB", _strBaseWeb);
    designParameters.put("BASE_DESIGN", baseDesignPath);
    designParameters.put("IS_IGNORE_PAGINATION", false);
    designParameters.put("USER_CLIENT",
        Utility.getContext(_connectionProvider, variables, "#User_Client", ""));
    designParameters.put("USER_ORG",
        Utility.getContext(_connectionProvider, variables, "#User_Org", ""));

    final String language = variables.getLanguage();
    designParameters.put("LANGUAGE", language);

    final Locale locale = new Locale(language.substring(0, 2), language.substring(3, 5));
    designParameters.put("LOCALE", locale);

    final DecimalFormatSymbols dfs = new DecimalFormatSymbols();
    dfs.setDecimalSeparator(variables.getSessionValue("#AD_ReportDecimalSeparator").charAt(0));
    dfs.setGroupingSeparator(variables.getSessionValue("#AD_ReportGroupingSeparator").charAt(0));
    final DecimalFormat NumberFormat = new DecimalFormat(
        variables.getSessionValue("#AD_ReportNumberFormat"), dfs);
    designParameters.put("NUMBERFORMAT", NumberFormat);

    if (report.getTemplateInfo() != null) {
      designParameters.put("SHOW_LOGO", report.getTemplateInfo().getShowLogo());
      designParameters.put("SHOW_COMPANYDATA", report.getTemplateInfo().getShowCompanyData());
      designParameters.put("HEADER_MARGIN", report.getTemplateInfo().getHeaderMargin());
    }

    return designParameters;
  }

}
