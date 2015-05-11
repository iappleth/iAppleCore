/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html 
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2014-2015 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.application.report;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.sql.Connection;
import java.sql.SQLException;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;

import javax.servlet.http.HttpSession;

import net.sf.jasperreports.engine.JRDataSource;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JRExporterParameter;
import net.sf.jasperreports.engine.JRParameter;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.design.JRDesignParameter;
import net.sf.jasperreports.engine.design.JasperDesign;
import net.sf.jasperreports.engine.export.HtmlExporter;
import net.sf.jasperreports.engine.export.JRCsvExporter;
import net.sf.jasperreports.engine.export.JRXlsExporter;
import net.sf.jasperreports.engine.fill.JRSwapFileVirtualizer;
import net.sf.jasperreports.engine.util.JRSwapFile;
import net.sf.jasperreports.engine.xml.JRXmlLoader;
import net.sf.jasperreports.export.SimpleCsvReportConfiguration;
import net.sf.jasperreports.export.SimpleExporterInput;
import net.sf.jasperreports.export.SimpleHtmlExporterOutput;
import net.sf.jasperreports.export.SimpleHtmlReportConfiguration;
import net.sf.jasperreports.export.SimpleOutputStreamExporterOutput;
import net.sf.jasperreports.export.SimpleWriterExporterOutput;
import net.sf.jasperreports.export.SimpleXlsReportConfiguration;
import net.sf.jasperreports.export.type.HtmlSizeUnitEnum;
import net.sf.jasperreports.j2ee.servlets.ImageServlet;
import net.sf.jasperreports.web.util.WebHtmlResourceHandler;

import org.openbravo.base.exception.OBException;
import org.openbravo.base.session.OBPropertiesProvider;
import org.openbravo.client.kernel.reference.UIDefinitionController;
import org.openbravo.client.kernel.reference.UIDefinitionController.FormatDefinition;
import org.openbravo.dal.core.DalContextListener;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.erpCommon.utility.GridReportVO;
import org.openbravo.erpCommon.utility.JRFieldProviderDataSource;
import org.openbravo.erpCommon.utility.JRFormatFactory;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.erpCommon.utility.ReportDesignBO;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.utility.FileType;
import org.openbravo.service.db.DalConnectionProvider;
import org.openbravo.utils.Replace;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Utilities to generate jasper reports */
public class ReportingUtils {
  public static final String JASPER_PARAM_OBCONTEXT = "jasper_obContext";
  public static final String JASPER_PARAM_HBSESSION = "jasper_hbSession";
  private static final Logger log = LoggerFactory.getLogger(ReportingUtils.class);

  /**
   * Exports the report to a file in a temporary folder. This method adds automatically the
   * parameters needed to print a report from a Process Definition.
   * 
   * @param jasperFilePath
   *          The path to the JR template of the report.
   * @param expType
   *          The desired output type of the report.
   * @param parameters
   *          The parameters to be sent to Jasper Report.
   * @param strFileName
   *          The name to be used on the generated file.
   * @throws OBException
   *           In case there is any error generating the file an exception is thrown with the error
   *           message.
   */
  public static void exportJR(String jasperFilePath, ExportType expType,
      Map<String, Object> parameters, String strFileName) throws OBException {
    File target = new File(getTempFolder(), strFileName);
    exportJR(jasperFilePath, expType, parameters, target, true, null, null, null);
  }

  /**
   * Exports the report to a file in a temporary folder.
   * 
   * @param jasperFilePath
   *          The path to the JR template of the report.
   * @param expType
   *          The desired output type of the report.
   * @param parameters
   *          The parameters to be sent to Jasper Report.
   * @param strFileName
   *          The name to be used on the generated file.
   * @param addProcessDefinitionParameters
   *          A flag to indicate if the parameters needed to print a report from a Process
   *          Definition should be added.
   * @throws OBException
   *           In case there is any error generating the file an exception is thrown with the error
   *           message.
   */
  public static void exportJR(String jasperFilePath, ExportType expType,
      Map<String, Object> parameters, String strFileName, boolean addProcessDefinitionParameters)
      throws OBException {
    File target = new File(getTempFolder(), strFileName);
    exportJR(jasperFilePath, expType, parameters, target, addProcessDefinitionParameters, null,
        null, null);
  }

  /**
   * Exports the report to a file in a temporary folder.
   * 
   * @param jasperFilePath
   *          The path to the JR template of the report.
   * @param expType
   *          The desired output type of the report.
   * @param parameters
   *          The parameters to be sent to Jasper Report.
   * @param strFileName
   *          The name to be used on the generated file.
   * @param addProcessDefinitionParameters
   *          A flag to indicate if the parameters needed to print a report from a Process
   *          Definition should be added.
   * @param connectionProvider
   *          A connection provider in case the report needs it.
   * @param data
   *          The data to be used in the report, if required.
   * @param additionalExportParameters
   *          Additional export parameters than can be added to configure the resulting report.
   * @throws OBException
   *           In case there is any error generating the report an exception is thrown with the
   *           error message.
   */
  public static void exportJR(String jasperFilePath, ExportType expType,
      Map<String, Object> parameters, String strFileName, boolean addProcessDefinitionParameters,
      ConnectionProvider connectionProvider, JRDataSource data,
      Map<Object, Object> additionalExportParameters) throws OBException {
    File target = new File(getTempFolder(), strFileName);
    exportJR(jasperFilePath, expType, parameters, target, addProcessDefinitionParameters,
        connectionProvider, data, additionalExportParameters);
  }

  /**
   * Exports the report to a file, without compiling any sub-report.
   * 
   * @param jasperFilePath
   *          The path to the JR template of the report.
   * @param expType
   *          The desired output type of the report.
   * @param parameters
   *          The parameters to be sent to Jasper Report.
   * @param target
   *          The file used to return the report.
   * @param addProcessDefinitionParameters
   *          A flag to indicate if the parameters needed to print a report from a Process
   *          Definition should be added.
   * @param connectionProvider
   *          A connection provider in case the report needs it.
   * @param data
   *          The data to be used in the report, if required.
   * @param additionalExportParameters
   *          Additional export parameters than can be added to configure the resulting report.
   * @throws OBException
   *           In case there is any error generating the file an exception is thrown with the error
   *           message.
   */
  public static void exportJR(String jasperFilePath, ExportType expType,
      Map<String, Object> parameters, File target, boolean addProcessDefinitionParameters,
      ConnectionProvider connectionProvider, JRDataSource data,
      Map<Object, Object> additionalExportParameters) throws OBException {
    exportJR(jasperFilePath, expType, parameters, target, addProcessDefinitionParameters,
        connectionProvider, data, additionalExportParameters, false);
  }

  /**
   * Exports the report to an output stream, without compiling any sub-report.
   * 
   * @param jasperFilePath
   *          The path to the JR template of the report.
   * @param expType
   *          The desired output type of the report.
   * @param parameters
   *          The parameters to be sent to Jasper Report.
   * @param outputStream
   *          An output stream used to return the report.
   * @param addProcessDefinitionParameters
   *          A flag to indicate if the parameters needed to print a report from a Process
   *          Definition should be added.
   * @param connectionProvider
   *          A connection provider in case the report needs it.
   * @param data
   *          The data to be used in the report, if required.
   * @param additionalExportParameters
   *          Additional export parameters than can be added to configure the resulting report.
   * @throws OBException
   *           In case there is any error generating the report an exception is thrown with the
   *           error message.
   */
  public static void exportJR(String jasperFilePath, ExportType expType,
      Map<String, Object> parameters, OutputStream outputStream,
      boolean addProcessDefinitionParameters, ConnectionProvider connectionProvider,
      JRDataSource data, Map<Object, Object> additionalExportParameters) throws OBException {
    exportJR(jasperFilePath, expType, parameters, outputStream, addProcessDefinitionParameters,
        connectionProvider, data, additionalExportParameters, false);
  }

  /**
   * Exports the report to a file.
   * 
   * @param jasperFilePath
   *          The path to the JR template of the report.
   * @param expType
   *          The desired output type of the report.
   * @param parameters
   *          The parameters to be sent to Jasper Report.
   * @param target
   *          The file used to return the report.
   * @param addProcessDefinitionParameters
   *          A flag to indicate if the parameters needed to print a report from a Process
   *          Definition should be added.
   * @param connectionProvider
   *          A connection provider in case the report needs it.
   * @param data
   *          The data to be used in the report, if required.
   * @param additionalExportParameters
   *          Additional export parameters than can be added to configure the resulting report.
   * @param compileSubreports
   *          A flag to indicate if the sub-reports should be compiled too. If true, the sub-report
   *          jrxml files should be placed in the same folder as the main report and their name
   *          should start with SUBREP_
   * @throws OBException
   *           In case there is any error generating the report an exception is thrown with the
   *           error message.
   */
  public static void exportJR(String jasperFilePath, ExportType expType,
      Map<String, Object> parameters, File target, boolean addProcessDefinitionParameters,
      ConnectionProvider connectionProvider, JRDataSource data,
      Map<Object, Object> additionalExportParameters, boolean compileSubreports) throws OBException {

    JRSwapFileVirtualizer virtualizer = null;
    Map<Object, Object> exportParameters = new HashMap<Object, Object>();
    parameters.putAll(expType.getExportParameters());
    if (additionalExportParameters != null && additionalExportParameters.size() > 0) {
      exportParameters.putAll(additionalExportParameters);
    }
    // if no custom virtualizer is requested use a default one
    if (!parameters.containsKey(JRParameter.REPORT_VIRTUALIZER)) {
      // virtualizer is essentially using a tmp-file to avoid huge memory consumption by jasper
      // when processing big reports
      JRSwapFile swap = new JRSwapFile(getTempFolder(), 4096, 1);
      // start using the virtualizer when having more than 100 pages of data
      virtualizer = new JRSwapFileVirtualizer(100, swap);
      parameters.put(JRParameter.REPORT_VIRTUALIZER, virtualizer);
    }
    if (addProcessDefinitionParameters) {
      addProcessDefinitionParameters(parameters);
    }
    JasperPrint jasperPrint = generateJasperPrint(jasperFilePath, parameters, compileSubreports,
        connectionProvider, data);
    if (expType == ExportType.HTML) {
      HttpSession session = (HttpSession) parameters.get("HTTP_SESSION");
      if (session != null) {
        session.setAttribute(ImageServlet.DEFAULT_JASPER_PRINT_SESSION_ATTRIBUTE, jasperPrint);
      }
    }
    try {
      saveReport(jasperPrint, expType, exportParameters, target);
    } catch (JRException e) {
      log.error("Error generating Jasper Report: " + jasperFilePath, e);
      throw new OBException(e.getMessage(), e);
    } finally {
      // remove virtualizer tmp files if we created them
      if (virtualizer != null) {
        virtualizer.cleanup();
      }
    }
  }

  /**
   * Exports the report to an output stream.
   * 
   * @param jasperFilePath
   *          The path to the JR template of the report.
   * @param expType
   *          The desired output type of the report.
   * @param parameters
   *          The parameters to be sent to Jasper Report.
   * @param outputStream
   *          An output stream used to return the report.
   * @param addProcessDefinitionParameters
   *          A flag to indicate if the parameters needed to print a report from a Process
   *          Definition should be added.
   * @param connectionProvider
   *          A connection provider in case the report needs it.
   * @param data
   *          The data to be used in the report, if required.
   * @param additionalExportParameters
   *          Additional export parameters than can be added to configure the resulting report.
   * @param compileSubreports
   *          A flag to indicate if the sub-reports should be compiled too. If true, the sub-report
   *          jrxml files should be placed in the same folder as the main report and their name
   *          should start with SUBREP_
   * @throws OBException
   *           In case there is any error generating the report an exception is thrown with the
   *           error message.
   */
  public static void exportJR(String jasperFilePath, ExportType expType,
      Map<String, Object> parameters, OutputStream outputStream,
      boolean addProcessDefinitionParameters, ConnectionProvider connectionProvider,
      JRDataSource data, Map<Object, Object> additionalExportParameters, boolean compileSubreports)
      throws OBException {

    JRSwapFileVirtualizer virtualizer = null;
    Map<Object, Object> exportParameters = new HashMap<Object, Object>();
    parameters.putAll(expType.getExportParameters());
    if (additionalExportParameters != null && additionalExportParameters.size() > 0) {
      exportParameters.putAll(additionalExportParameters);
    }
    // if no custom virtualizer is requested use a default one
    if (!parameters.containsKey(JRParameter.REPORT_VIRTUALIZER)) {
      // virtualizer is essentially using a tmp-file to avoid huge memory consumption by jasper
      // when processing big reports
      JRSwapFile swap = new JRSwapFile(getTempFolder(), 4096, 1);
      // start using the virtualizer when having more than 100 pages of data
      virtualizer = new JRSwapFileVirtualizer(100, swap);
      parameters.put(JRParameter.REPORT_VIRTUALIZER, virtualizer);
    }
    if (addProcessDefinitionParameters) {
      addProcessDefinitionParameters(parameters);
    }
    JasperPrint jasperPrint = generateJasperPrint(jasperFilePath, parameters, compileSubreports,
        connectionProvider, data);
    if (expType == ExportType.HTML) {
      HttpSession session = (HttpSession) parameters.get("HTTP_SESSION");
      if (session != null) {
        session.setAttribute(ImageServlet.DEFAULT_JASPER_PRINT_SESSION_ATTRIBUTE, jasperPrint);
      }
    }
    try {
      saveReport(jasperPrint, expType, exportParameters, outputStream);
    } catch (JRException e) {
      log.error("Error generating Jasper Report: " + jasperFilePath, e);
      throw new OBException(e.getMessage(), e);
    } finally {
      // remove virtualizer tmp files if we created them
      if (virtualizer != null) {
        virtualizer.cleanup();
      }
    }
  }

  /**
   * Saves a pre-compiled report into a file.
   * 
   * @param jasperPrint
   *          JasperPrint object which contains a compiled report.
   * @param expType
   *          The desired output type of the report.
   * @param exportParameters
   *          Export parameters than can be added to configure the resulting report.
   * @param target
   *          The file used to return the report.
   * @throws JRException
   *           In case there is any error saving the report an exception is thrown with the error
   *           message.
   */
  public static void saveReport(JasperPrint jasperPrint, ExportType expType,
      Map<Object, Object> exportParameters, File target) throws JRException {
    switch (expType) {
    case CSV:
      saveCsvReportToFile(jasperPrint, target);
      break;
    case HTML:
      if (log.isDebugEnabled())
        log.debug("JR: Print HTML");
      saveHTMLReportToFile(jasperPrint, exportParameters, target);
      break;
    case PDF:
      JasperExportManager.exportReportToPdfFile(jasperPrint, target.getAbsolutePath());
      break;
    case XLS:
      saveExcelReportToFile(jasperPrint, exportParameters, target);
      break;
    case XML:
      JasperExportManager.exportReportToXmlFile(jasperPrint, target.getAbsolutePath(), true);
      break;
    }
  }

  /**
   * Returns a pre-compiled report into an Output Stream.
   * 
   * @param jasperPrint
   *          JasperPrint object which contains a compiled report.
   * @param expType
   *          The desired output type of the report.
   * @param exportParameters
   *          Export parameters than can be added to configure the resulting report.
   * @param outputStream
   *          The output stream used to return the report.
   * @throws JRException
   *           In case there is any error generating the report an exception is thrown with the
   *           error message.
   */
  public static void saveReport(JasperPrint jasperPrint, ExportType expType,
      Map<Object, Object> exportParameters, OutputStream outputStream) throws JRException {
    switch (expType) {
    case CSV:
      saveCsvReportToOutputStream(jasperPrint, outputStream);
      break;
    case HTML:
      if (log.isDebugEnabled())
        log.debug("JR: Print HTML");
      saveHTMLReportToOutputStream(jasperPrint, exportParameters, outputStream);
      break;
    case PDF:
      JasperExportManager.exportReportToPdfStream(jasperPrint, outputStream);
      break;
    case XLS:
      saveExcelReportToOutputStream(jasperPrint, exportParameters, outputStream);
      break;
    case XML:
      JasperExportManager.exportReportToXmlStream(jasperPrint, outputStream);
      break;
    }
  }

  /**
   * Generates an HTML report from a pre-compiled report and returns it into a file.
   * 
   * @param jasperPrint
   *          JasperPrint object which contains a compiled report.
   * @param exportParameters
   *          Export parameters than can be added to configure the resulting report.
   * @param file
   *          The file used to return the report.
   * @throws JRException
   *           In case there is any error generating the report an exception is thrown with the
   *           error message.
   */
  private static void saveHTMLReportToFile(JasperPrint jasperPrint,
      Map<Object, Object> exportParameters, File file) throws JRException {
    final HtmlExporter htmlExporter = new HtmlExporter();
    SimpleExporterInput exporterInput = new SimpleExporterInput(jasperPrint);
    SimpleHtmlExporterOutput exporterOutput = new SimpleHtmlExporterOutput(file);

    if (exportParameters != null && exportParameters.size() > 0) {
      SimpleHtmlReportConfiguration exportConfiguration = new SimpleHtmlReportConfiguration();
      setHtmlConfigurationFromExportParameters(exportParameters, exportConfiguration,
          exporterOutput);
      htmlExporter.setConfiguration(exportConfiguration);
    } else {
      SimpleHtmlReportConfiguration reportExportConfiguration = new SimpleHtmlReportConfiguration();
      reportExportConfiguration.setSizeUnit(HtmlSizeUnitEnum.POINT);
      htmlExporter.setConfiguration(reportExportConfiguration);
    }
    htmlExporter.setExporterInput(exporterInput);
    htmlExporter.setExporterOutput(exporterOutput);
    htmlExporter.exportReport();
  }

  /**
   * Generates an HTML report from a pre-compiled report and returns it into an output stream.
   * 
   * @param jasperPrint
   *          JasperPrint object which contains a compiled report.
   * @param exportParameters
   *          Export parameters than can be added to configure the resulting report.
   * @param outputStream
   *          The output stream used to return the report.
   * @throws JRException
   *           In case there is any error generating the report an exception is thrown with the
   *           error message.
   */
  private static void saveHTMLReportToOutputStream(JasperPrint jasperPrint,
      Map<Object, Object> exportParameters, OutputStream outputStream) throws JRException {
    final HtmlExporter htmlExporter = new HtmlExporter();
    SimpleExporterInput exporterInput = new SimpleExporterInput(jasperPrint);
    SimpleHtmlExporterOutput exporterOutput = new SimpleHtmlExporterOutput(outputStream);

    if (exportParameters != null && exportParameters.size() > 0) {
      SimpleHtmlReportConfiguration exportConfiguration = new SimpleHtmlReportConfiguration();
      setHtmlConfigurationFromExportParameters(exportParameters, exportConfiguration,
          exporterOutput);
      htmlExporter.setConfiguration(exportConfiguration);
    } else {
      SimpleHtmlReportConfiguration reportExportConfiguration = new SimpleHtmlReportConfiguration();
      reportExportConfiguration.setSizeUnit(HtmlSizeUnitEnum.POINT);
      htmlExporter.setConfiguration(reportExportConfiguration);
    }
    htmlExporter.setExporterInput(exporterInput);
    htmlExporter.setExporterOutput(exporterOutput);
    try {
      htmlExporter.exportReport();
    } catch (Exception e) {
      // Handle the exception to ignore the error thrown when the user closes the browser before
      // getting the whole HTML report
      Throwable t = e.getCause();
      if (t != null && !(t.toString().contains("ClientAbortException"))) {
        throw new JRException(e.getMessage(), e);
      }
    }
  }

  /**
   * Generates an HTML report using the SimpleExporterInput, SimpleHtmlExporterOutput and
   * SimpleHtmlReportConfiguration received as parameters.
   * 
   * @param exporterInput
   *          SimpleExporterInput object with the input data.
   * @param exporterOutput
   *          SimpleHtmlExporterOutput object with the output data.
   * @param exportConfiguration
   *          SimpleHtmlReportConfiguration with the configuration data.
   * @throws JRException
   *           In case there is any error generating the report an exception is thrown with the
   *           error message.
   */
  public static void saveHTMLReport(SimpleExporterInput exporterInput,
      SimpleHtmlExporterOutput exporterOutput, SimpleHtmlReportConfiguration exportConfiguration)
      throws JRException {
    final HtmlExporter htmlExporter = new HtmlExporter();
    htmlExporter.setExporterInput(exporterInput);
    htmlExporter.setExporterOutput(exporterOutput);
    htmlExporter.setConfiguration(exportConfiguration);
    htmlExporter.exportReport();
  }

  /**
   * Generates an XLS report from a pre-compiled report and returns it into a file.
   * 
   * @param jasperPrint
   *          JasperPrint object which contains a compiled report.
   * @param exportParameters
   *          Export parameters than can be added to configure the resulting report.
   * @param file
   *          The file used to return the report.
   * @throws JRException
   *           In case there is any error generating the report an exception is thrown with the
   *           error message.
   */
  private static void saveExcelReportToFile(JasperPrint jasperPrint,
      Map<Object, Object> exportParameters, File file) throws JRException {
    final JRXlsExporter excelExporter = new JRXlsExporter();
    SimpleExporterInput exporterInput = new SimpleExporterInput(jasperPrint);
    SimpleOutputStreamExporterOutput exporterOutput = new SimpleOutputStreamExporterOutput(file);

    if (exportParameters != null && exportParameters.size() > 0) {
      SimpleXlsReportConfiguration exportConfiguration = getXlsConfigurationFromExportParameters(exportParameters);
      excelExporter.setConfiguration(exportConfiguration);
    } else {
      SimpleXlsReportConfiguration reportExportConfiguration = new SimpleXlsReportConfiguration();
      reportExportConfiguration.setOnePagePerSheet(false);
      reportExportConfiguration.setRemoveEmptySpaceBetweenRows(true);
      reportExportConfiguration.setDetectCellType(true);
      excelExporter.setConfiguration(reportExportConfiguration);
    }
    excelExporter.setExporterInput(exporterInput);
    excelExporter.setExporterOutput(exporterOutput);
    excelExporter.exportReport();
  }

  /**
   * Generates an XLS report from a pre-compiled report and returns it into an output stream.
   * 
   * @param jasperPrint
   *          JasperPrint object which contains a compiled report.
   * @param exportParameters
   *          Export parameters than can be added to configure the resulting report.
   * @param outputStream
   *          The output stream used to return the report.
   * @throws JRException
   *           In case there is any error generating the report an exception is thrown with the
   *           error message.
   */
  private static void saveExcelReportToOutputStream(JasperPrint jasperPrint,
      Map<Object, Object> exportParameters, OutputStream outputStream) throws JRException {
    final JRXlsExporter excelExporter = new JRXlsExporter();
    SimpleExporterInput exporterInput = new SimpleExporterInput(jasperPrint);
    SimpleOutputStreamExporterOutput exporterOutput = new SimpleOutputStreamExporterOutput(
        outputStream);

    if (exportParameters != null && exportParameters.size() > 0) {
      SimpleXlsReportConfiguration exportConfiguration = getXlsConfigurationFromExportParameters(exportParameters);
      excelExporter.setConfiguration(exportConfiguration);
    } else {
      SimpleXlsReportConfiguration reportExportConfiguration = new SimpleXlsReportConfiguration();
      reportExportConfiguration.setOnePagePerSheet(false);
      reportExportConfiguration.setRemoveEmptySpaceBetweenRows(true);
      reportExportConfiguration.setDetectCellType(true);
      excelExporter.setConfiguration(reportExportConfiguration);
    }
    excelExporter.setExporterInput(exporterInput);
    excelExporter.setExporterOutput(exporterOutput);
    excelExporter.exportReport();
  }

  /**
   * Generates an XLS report using the SimpleExporterInput, SimpleOutputStreamExporterOutput and
   * SimpleXlsReportConfiguration received as parameters.
   * 
   * @param exporterInput
   *          SimpleExporterInput object with the input data.
   * @param exporterOutput
   *          SimpleOutputStreamExporterOutput object with the output data.
   * @param exportConfiguration
   *          SimpleXlsReportConfiguration with the configuration data.
   * @throws JRException
   *           In case there is any error generating the report an exception is thrown with the
   *           error message.
   */
  public static void saveExcelReport(SimpleExporterInput exporterInput,
      SimpleOutputStreamExporterOutput exporterOutput,
      SimpleXlsReportConfiguration exportConfiguration) throws JRException {
    final JRXlsExporter excelExporter = new JRXlsExporter();
    excelExporter.setExporterInput(exporterInput);
    excelExporter.setExporterOutput(exporterOutput);
    excelExporter.setConfiguration(exportConfiguration);
    excelExporter.exportReport();
  }

  /**
   * Generates a CSV report from a pre-compiled report and returns it into a file.
   * 
   * @param jasperPrint
   *          JasperPrint object which contains a compiled report.
   * @param file
   *          The file used to return the report.
   * @throws JRException
   *           In case there is any error generating the report an exception is thrown with the
   *           error message.
   */
  private static void saveCsvReportToFile(JasperPrint jasperPrint, File file) throws JRException {
    final JRCsvExporter csvExporter = new JRCsvExporter();
    SimpleExporterInput exporterInput = new SimpleExporterInput(jasperPrint);
    SimpleWriterExporterOutput exporterOutput = new SimpleWriterExporterOutput(file);

    csvExporter.setConfiguration(new SimpleCsvReportConfiguration());
    csvExporter.setExporterInput(exporterInput);
    csvExporter.setExporterOutput(exporterOutput);
    csvExporter.exportReport();
  }

  /**
   * Generates a CSV report from a pre-compiled report and returns it into an output stream.
   * 
   * @param jasperPrint
   *          JasperPrint object which contains a compiled report.
   * @param outputStream
   *          The output stream used to return the report.
   * @throws JRException
   *           In case there is any error generating the report an exception is thrown with the
   *           error message.
   */
  private static void saveCsvReportToOutputStream(JasperPrint jasperPrint, OutputStream outputStream)
      throws JRException {
    final JRCsvExporter csvExporter = new JRCsvExporter();
    SimpleExporterInput exporterInput = new SimpleExporterInput(jasperPrint);
    SimpleWriterExporterOutput exporterOutput = new SimpleWriterExporterOutput(outputStream);

    csvExporter.setConfiguration(new SimpleCsvReportConfiguration());
    csvExporter.setExporterInput(exporterInput);
    csvExporter.setExporterOutput(exporterOutput);
    csvExporter.exportReport();
  }

  /**
   * Generates a CSV report using the SimpleExporterInput, SimpleWriterExporterOutput and
   * SimpleCsvReportConfiguration received as parameters.
   * 
   * @param exporterInput
   *          SimpleExporterInput object with the input data.
   * @param exporterOutput
   *          SimpleWriterExporterOutput object with the output data.
   * @param exportConfiguration
   *          SimpleCsvReportConfiguration with the configuration data.
   * @throws JRException
   *           In case there is any error generating the report an exception is thrown with the
   *           error message.
   */
  public static void saveCsvReport(SimpleExporterInput exporterInput,
      SimpleWriterExporterOutput exporterOutput, SimpleCsvReportConfiguration exportConfiguration)
      throws JRException {
    final JRCsvExporter csvExporter = new JRCsvExporter();
    csvExporter.setExporterInput(exporterInput);
    csvExporter.setExporterOutput(exporterOutput);
    csvExporter.setConfiguration(exportConfiguration);
    csvExporter.exportReport();
  }

  /**
   * Generates a SimpleXlsReportConfiguration from a parameter map.
   * 
   * @param params
   *          A parameter map with the export parameters.
   * @return A SimpleXlsReportConfiguration object with the resulting configuration.
   * 
   */
  @SuppressWarnings("deprecation")
  private static SimpleXlsReportConfiguration getXlsConfigurationFromExportParameters(
      Map<Object, Object> params) {
    SimpleXlsReportConfiguration configuration = new SimpleXlsReportConfiguration();
    Iterator<Entry<Object, Object>> it = params.entrySet().iterator();
    while (it.hasNext()) {
      @SuppressWarnings("rawtypes")
      Map.Entry pair = (Map.Entry) it.next();
      String parameter = ((JRExporterParameter) pair.getKey()).toString();
      if (parameter.equals("Is One Page per Sheet")) {
        configuration.setOnePagePerSheet((Boolean) pair.getValue());
      } else if (parameter.equals("Is Remove Empty Space Between Rows")) {
        configuration.setRemoveEmptySpaceBetweenRows((Boolean) pair.getValue());
      } else if (parameter.equals("Is Remove Empty Space Between Columns")) {
        configuration.setRemoveEmptySpaceBetweenColumns((Boolean) pair.getValue());
      } else if (parameter.equals("Is White Page Background")) {
        configuration.setWhitePageBackground((Boolean) pair.getValue());
      } else if (parameter.equals("Is Detect Cell Type")) {
        configuration.setDetectCellType((Boolean) pair.getValue());
      } else if (parameter.equals("Is Font Size Fix Enabled")) {
        configuration.setFontSizeFixEnabled((Boolean) pair.getValue());
      } else if (parameter.equals("Is Image Border Fix Enabled")) {
        configuration.setImageBorderFixEnabled((Boolean) pair.getValue());
      } else if (parameter.equals("Is Ignore Graphics")) {
        configuration.setIgnoreGraphics((Boolean) pair.getValue());
      } else if (parameter.equals("Is Collapse Row Span")) {
        configuration.setCollapseRowSpan((Boolean) pair.getValue());
      } else if (parameter.equals("Is Ignore Cell Border")) {
        configuration.setIgnoreCellBorder((Boolean) pair.getValue());
      } else if (parameter.equals("Is Ignore Cell Background")) {
        configuration.setIgnoreCellBackground((Boolean) pair.getValue());
      } else if (parameter.equals("Maximum Rows Per Sheet")) {
        configuration.setMaxRowsPerSheet((Integer) pair.getValue());
      } else if (parameter.equals("Ignore page margins")) {
        configuration.setIgnorePageMargins((Boolean) pair.getValue());
      }
    }
    return configuration;
  }

  /**
   * Configures a SimpleHtmlReportConfiguration and a SimpleHtmlExporterOutput from a parameter map.
   * 
   * @param params
   *          A parameter map with the export parameters.
   * 
   */
  @SuppressWarnings("deprecation")
  private static void setHtmlConfigurationFromExportParameters(Map<Object, Object> params,
      SimpleHtmlReportConfiguration configuration, SimpleHtmlExporterOutput exporterOutput) {
    // Add configuration defaults
    // This is needed just in case the params map only contains the Images URI parameter
    configuration.setSizeUnit(HtmlSizeUnitEnum.POINT);
    Iterator<Entry<Object, Object>> it = params.entrySet().iterator();
    while (it.hasNext()) {
      @SuppressWarnings("rawtypes")
      Map.Entry pair = (Map.Entry) it.next();
      String parameter = ((JRExporterParameter) pair.getKey()).toString();
      if (parameter.equals("Images URI")) {
        exporterOutput.setImageHandler(new WebHtmlResourceHandler((String) pair.getValue()));
      } else if (parameter.equals("Is Remove Empty Space Between Rows")) {
        configuration.setRemoveEmptySpaceBetweenRows((Boolean) pair.getValue());
      } else if (parameter.equals("Size Unit")) {
        String sizeUnit = (String) pair.getValue();
        if (HtmlSizeUnitEnum.POINT.getName().equals(sizeUnit)) {
          configuration.setSizeUnit(HtmlSizeUnitEnum.POINT);
        } else if (HtmlSizeUnitEnum.PIXEL.getName().equals(sizeUnit)) {
          configuration.setSizeUnit(HtmlSizeUnitEnum.PIXEL);
        }
      } else if (parameter.equals("Ignore page margins")) {
        configuration.setIgnorePageMargins((Boolean) pair.getValue());
      } else if (parameter.equals("Is White Page Background")) {
        configuration.setWhitePageBackground((Boolean) pair.getValue());
      } else if (parameter.equals("Is Wrap Break Word")) {
        configuration.setWrapBreakWord((Boolean) pair.getValue());
      } else if (parameter.equals("Zoom Ratio")) {
        configuration.setZoomRatio((Float) pair.getValue());
      }
    }
  }

  /**
   * Generates a compiled, translated and filled report into a JasperPrint object.
   * 
   * @param jasperFilePath
   *          The path to the JR template of the report.
   * @param parameters
   *          The parameters to be sent to Jasper Report.
   * @param compileSubreports
   *          A flag to indicate if the sub-reports of the report should be compiled too. If true,
   *          the sub-report jrxml files should be placed in the same folder as the main report and
   *          their name should start with SUBREP_
   * @param connectionProvider
   *          A connection provider in case the report needs it.
   * @param data
   *          The data to be used in the report, if required.
   * @return A JasperPrint object with the compiled, translated and filled report.
   * @throws OBException
   *           In case there is any error processing the report an exception is thrown with the
   *           error message.
   */
  public static JasperPrint generateJasperPrint(String jasperFilePath,
      Map<String, Object> parameters, boolean compileSubreports,
      ConnectionProvider connectionProvider, JRDataSource data) throws OBException {

    JasperPrint jasperPrint = null;
    String language = OBContext.getOBContext().getLanguage().getLanguage();
    try {
      setReportFormatFactory(parameters);
      if (log.isDebugEnabled()) {
        log.debug("list of parameters available in the jasper report");
        for (Iterator<String> keys = parameters.keySet().iterator(); keys.hasNext();) {
          String key = keys.next();
          String value = "null";
          if (parameters.get(key) != null) {
            value = parameters.get(key).toString();
          }
          log.debug("parameter name: " + key + " value: " + value);
        }
      }

      if (jasperFilePath.endsWith("jrxml")) {
        String strBaseDesign = DalContextListener.getServletContext().getRealPath("");
        JasperReport jReport = Utility.getTranslatedJasperReport(new DalConnectionProvider(false),
            jasperFilePath, language, strBaseDesign);
        if (connectionProvider != null) {
          if (compileSubreports) {
            processSubReports(jasperFilePath, parameters, strBaseDesign, connectionProvider,
                language);
          }
          Connection con = null;
          try {
            con = connectionProvider.getTransactionConnection();
            if (data != null) {
              parameters.put("REPORT_CONNECTION", con);
              jasperPrint = JasperFillManager.fillReport(jReport, parameters, data);
            } else {
              jasperPrint = JasperFillManager.fillReport(jReport, parameters, con);
            }
          } catch (final Exception e) {
            Throwable t = (e.getCause() != null) ? e.getCause().getCause() : null;
            if (t != null) {
              throw new OBException((t instanceof SQLException && t.getMessage().contains(
                  "@NoConversionRate@")) ? t.getMessage() : e.getMessage(), e);
            } else {
              throw new OBException(e.getCause() instanceof SQLException ? e.getCause()
                  .getMessage() : e.getMessage(), e);
            }
          } finally {
            try {
              connectionProvider.releaseRollbackConnection(con);
            } catch (SQLException e) {
            }
          }
        } else {
          jasperPrint = JasperFillManager.fillReport(jReport, parameters, OBDal.getInstance()
              .getConnection());
        }
      } else {
        jasperPrint = JasperFillManager.fillReport(jasperFilePath, parameters);
      }
      return jasperPrint;
    } catch (JRException e) {
      log.error("Error generating Jasper Report: " + jasperFilePath, e);
      throw new OBException(e.getMessage(), e);
    }
  }

  /**
   * Generates sub-reports and adds them into the parameter map.
   * 
   * @param templateFile
   *          The path to the JR template of the report.
   * @param parameters
   *          The parameters to be sent to Jasper Report.
   * @param baseDesignPath
   *          Base design path.
   * @param connectionProvider
   *          A connection provider in case the report needs it.
   * @param language
   *          Language to be used when generating the sub-report.
   * @throws OBException
   *           In case there is any error generating the sub-reports an exception is thrown with the
   *           error message.
   */
  private static void processSubReports(String templateFile, Map<String, Object> parameters,
      String baseDesignPath, ConnectionProvider connectionProvider, String language)
      throws OBException {
    try {
      JasperDesign jasperDesign = JRXmlLoader.load(templateFile);

      Object[] parameterList = jasperDesign.getParametersList().toArray();
      String parameterName = "";
      String subReportName = "";
      Collection<String> subreportList = new ArrayList<String>();
      File template = new File(templateFile);
      String templateLocation = template.getParent() + "/";

      /*
       * TODO: At present this process assumes the subreport is a .jrxml file. Need to handle the
       * possibility that this subreport file could be a .jasper file.
       */
      for (int i = 0; i < parameterList.length; i++) {
        final JRDesignParameter parameter = (JRDesignParameter) parameterList[i];
        if (parameter.getName().startsWith("SUBREP_")) {
          parameterName = parameter.getName();
          subreportList.add(parameterName);
          subReportName = Replace.replace(parameterName, "SUBREP_", "") + ".jrxml";
          JasperReport jasperReportLines = createSubReport(templateLocation, subReportName,
              baseDesignPath, connectionProvider, language);
          parameters.put(parameterName, jasperReportLines);
        }
      }

    } catch (final JRException exception) {
      log.error(exception.getMessage());
      exception.printStackTrace();
      throw new OBException(exception);
    }
  }

  /**
   * Create a translated and compiled sub-report into a JasperReport object.
   * 
   * @param templateLocation
   *          The location of the JR template of the sub-report.
   * @param subReportFileName
   *          The name of the sub-report jrxml file.
   * @param baseDesignPath
   *          Base design path.
   * @param connectionProvider
   *          A connection provider in case the report needs it.
   * @param language
   *          Language to be used when generating the sub-report.
   * @return A JasperReport object with the compiled and translated sub-report.
   */
  private static JasperReport createSubReport(String templateLocation, String subReportFileName,
      String baseDesignPath, ConnectionProvider connectionProvider, String language) {
    JasperReport jasperReportLines = null;
    try {
      jasperReportLines = Utility.getTranslatedJasperReport(connectionProvider, templateLocation
          + subReportFileName, language, baseDesignPath);
    } catch (final JRException e1) {
      log.error(e1.getMessage());
      e1.printStackTrace();
    }
    return jasperReportLines;
  }

  /**
   * Compiles a jrxml file generating a JasperReport object.
   * 
   * @param jasperFilePath
   *          The path to the JR template of the report.
   * @return A JasperReport object with the compiled report.
   * @throws JRException
   *           In case there is any error compiling the report an exception is thrown with the error
   *           message.
   */
  public static JasperReport compileReport(String jasperFilePath) throws JRException {
    JasperDesign jasperDesign = JRXmlLoader.load(jasperFilePath);
    JasperReport jasperReport = JasperCompileManager.compileReport(jasperDesign);
    return jasperReport;
  }

  /**
   * Adds the parameters needed to print a report from a standard process definition into the
   * parameter map.
   * 
   * @param parameters
   *          Map of parameters where the standard process definition parameters are added.
   */
  private static void addProcessDefinitionParameters(Map<String, Object> parameters) {
    parameters.put(JASPER_PARAM_HBSESSION, OBDal.getInstance().getSession());
    parameters.put(JASPER_PARAM_OBCONTEXT, OBContext.getOBContext());

    {
      final FormatDefinition reportFormat = UIDefinitionController.getInstance()
          .getFormatDefinition("amount", UIDefinitionController.NORMALFORMAT_QUALIFIER);

      final DecimalFormatSymbols dfs = new DecimalFormatSymbols();
      dfs.setDecimalSeparator(reportFormat.getDecimalSymbol().charAt(0));
      dfs.setGroupingSeparator(reportFormat.getGroupingSymbol().charAt(0));

      final DecimalFormat numberFormat = new DecimalFormat(correctMaskForGrouping(
          reportFormat.getFormat(), reportFormat.getDecimalSymbol(),
          reportFormat.getGroupingSymbol()), dfs);
      parameters.put("AMOUNTFORMAT", numberFormat);
    }

    {
      final FormatDefinition reportFormat = UIDefinitionController.getInstance()
          .getFormatDefinition("generalQty", UIDefinitionController.SHORTFORMAT_QUALIFIER);

      final DecimalFormatSymbols dfs = new DecimalFormatSymbols();
      dfs.setDecimalSeparator(reportFormat.getDecimalSymbol().charAt(0));
      dfs.setGroupingSeparator(reportFormat.getGroupingSymbol().charAt(0));

      final DecimalFormat numberFormat = new DecimalFormat(correctMaskForGrouping(
          reportFormat.getFormat(), reportFormat.getDecimalSymbol(),
          reportFormat.getGroupingSymbol()), dfs);
      parameters.put("QUANTITYFORMAT", numberFormat);
    }

    String strClientId = OBContext.getOBContext().getCurrentClient().getId();
    parameters.put("Current_Client_ID", strClientId);
    String strOrgs = "";
    boolean isNotFirst = false;
    for (String strOrgId : OBContext.getOBContext().getReadableOrganizations()) {
      if (isNotFirst) {
        strOrgs += ",";
      }
      strOrgs += "'" + strOrgId + "'";
      isNotFirst = true;
    }
    parameters.put("Readable_Organizations", strOrgs);
  }

  /**
   * Adds the date format configuration into the parameter map.
   * 
   * @param parameters
   *          Map of parameters where the date format configuration is put.
   */
  private static void setReportFormatFactory(Map<String, Object> parameters) {
    String javaDateFormat = OBPropertiesProvider.getInstance().getOpenbravoProperties()
        .getProperty("dateFormat.java");
    if (log.isDebugEnabled())
      log.debug("creating the format factory: " + javaDateFormat);
    final JRFormatFactory jrFormatFactory = new JRFormatFactory();
    jrFormatFactory.setDatePattern(javaDateFormat);
    parameters.put(JRParameter.REPORT_FORMAT_FACTORY, jrFormatFactory);
  }

  /**
   * Creates a JasperPrint from a grid report.
   * 
   * @param reportFile
   *          An input stream containing the report file.
   * @param gridReportVO
   *          A grid report.
   * @return A JasperPrint object with the compiled report.
   * @throws JRException
   *           In case there is any error generating the file an exception is thrown with the error
   *           message.
   * @throws IOException
   *           In case there is any error generating the JasperPrint an exception is thrown with the
   *           error message.
   */
  public static JasperPrint createJasperPrint(InputStream reportFile, GridReportVO gridReportVO)
      throws JRException, IOException {
    JasperDesign jasperDesign = JRXmlLoader.load(reportFile);
    if (log.isDebugEnabled())
      log.debug("Create JasperDesign");
    ReportDesignBO designBO = new ReportDesignBO(jasperDesign, gridReportVO);
    designBO.define();
    if (log.isDebugEnabled())
      log.debug("JasperDesign created, pageWidth: " + jasperDesign.getPageWidth()
          + " left margin: " + jasperDesign.getLeftMargin() + " right margin: "
          + jasperDesign.getRightMargin());
    JasperReport jasperReport = JasperCompileManager.compileReport(jasperDesign);
    Map<String, Object> parameters = new HashMap<String, Object>();
    parameters.put("BaseDir", gridReportVO.getContext());
    parameters.put("IS_IGNORE_PAGINATION", gridReportVO.getPagination());

    JasperPrint jasperPrint = JasperFillManager
        .fillReport(
            jasperReport,
            parameters,
            new JRFieldProviderDataSource(gridReportVO.getFieldProvider(), gridReportVO
                .getDateFormat()));
    return jasperPrint;
  }

  /**
   * Changes the mask to use "." as Decimal Symbol and "," as grouping symbol.
   * 
   * @param mask
   *          the current mask
   * @param decimalSymbol
   *          the current decimal symbol
   * @param groupingSymbol
   *          the current grouping symbol
   * @return the mask with the updated decimal and grouping symbols.
   */
  private static String correctMaskForGrouping(String mask, String decimalSymbol,
      String groupingSymbol) {
    final String strTmpDecSymbol = "xxTmpDecSymbolxx";
    String localMask = mask.replace(decimalSymbol, strTmpDecSymbol);
    localMask = localMask.replace(groupingSymbol, ",");
    return localMask.replace(strTmpDecSymbol, ".");
  }

  /**
   * enum with the supported Export Outputs. Includes custom properties to be used when the report
   * is generated.
   */
  public enum ExportType {
    @SuppressWarnings("serial")
    CSV("csv", "", new HashMap<String, Object>() {
      {
        put("IS_IGNORE_PAGINATION", true);
      }
    }), //
    @SuppressWarnings("serial")
    HTML("html", "", new HashMap<String, Object>() {
      {
        put("IS_IGNORE_PAGINATION", true);
      }
    }), //
    @SuppressWarnings("serial")
    PDF("pdf", "103", new HashMap<String, Object>() {
      {
        put("IS_IGNORE_PAGINATION", false);
      }
    }), //
    @SuppressWarnings("serial")
    XLS("xls", "101", new HashMap<String, Object>() {
      {
        put("IS_IGNORE_PAGINATION", true);
      }
    }), //
    @SuppressWarnings("serial")
    XML("xml", "800004", new HashMap<String, Object>() {
      {
        put("IS_IGNORE_PAGINATION", true);
      }
    });
    private final String extension;
    private final String fileType;
    private final Map<String, Object> params;

    ExportType(String extension, String strFileTypeId, Map<String, Object> params) {
      this.extension = extension;
      OBContext.setAdminMode(true);
      try {
        FileType type = OBDal.getInstance().get(FileType.class, strFileTypeId);
        if (type != null) {
          fileType = type.getFormat();
        } else {
          if ("html".equals(extension) || "csv".equals(extension)) {
            fileType = "text/" + extension;
          } else {
            fileType = "application/" + extension;
          }
        }
      } finally {
        OBContext.restorePreviousMode();
      }
      this.params = params;
    }

    public String getExtension() {
      return this.extension;
    }

    public String getContentType() {
      return fileType;
    }

    public Map<String, Object> getExportParameters() {
      // An instance of the Map is done for making sure
      // that if this method is called, it is only accessing
      // to the parameters of the current Map instance.
      return new HashMap<String, Object>(params);
    }

    /**
     * Returns the corresponding ExportType item based on the action.
     */
    public static ExportType getExportType(String action) throws OBException {
      if ("CSV".equals(action)) {
        return ExportType.CSV;
      } else if ("HTML".equals(action)) {
        return ExportType.HTML;
      } else if ("PDF".equals(action)) {
        return ExportType.PDF;
      } else if ("XLS".equals(action)) {
        return ExportType.XLS;
      } else if ("XML".equals(action)) {
        return ExportType.XML;
      } else {
        throw new OBException(OBMessageUtils.messageBD("OBUIAPP_UnsupportedAction"));
      }
    }

    /** Checks if temporary file name is a valid one: has extension and the name is a uuid */
    public boolean isValidTemporaryFileName(String tmpFileName) {
      if (!tmpFileName.endsWith("." + getExtension())) {
        // file name should end with the extension
        return false;
      }
      final String tmpFileNameWithoutExtension = tmpFileName.substring(0, tmpFileName.length()
          - getExtension().length() - 1);

      // temp file must be a valid uuid
      return tmpFileNameWithoutExtension.matches("[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}");
    }
  }

  /** Returns temporary directory to save generated reports */
  public static String getTempFolder() {
    final String tmpFolder = System.getProperty("java.io.tmpdir");

    return tmpFolder;
  }
}