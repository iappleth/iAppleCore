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
 * All portions are Copyright (C) 2007 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.erpCommon.utility;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JRExporterParameter;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.design.JasperDesign;
import net.sf.jasperreports.engine.export.JExcelApiExporter;
import net.sf.jasperreports.engine.export.JExcelApiExporterParameter;
import net.sf.jasperreports.engine.export.JRCsvExporter;
import net.sf.jasperreports.engine.export.JRHtmlExporter;
import net.sf.jasperreports.engine.export.JRHtmlExporterParameter;
import net.sf.jasperreports.engine.xml.JRXmlLoader;

public class GridBO {

    public void createHTMLReport(InputStream reportFile,
            GridReportVO gridReportVO, OutputStream os) throws JRException,
            IOException {
        gridReportVO.setPagination(false);
        JasperPrint jasperPrint = createJasperPrint(reportFile, gridReportVO);
        JRHtmlExporter exporter = new JRHtmlExporter();
        Map<JRExporterParameter, Object> p = new HashMap<JRExporterParameter, Object>();
        p.put(JRHtmlExporterParameter.JASPER_PRINT, jasperPrint);
        p.put(JRHtmlExporterParameter.IS_USING_IMAGES_TO_ALIGN, Boolean.FALSE);
        p.put(JRHtmlExporterParameter.OUTPUT_STREAM, os);
        exporter.setParameters(p);
        exporter.exportReport();

    }

    private JasperDesign createJasperDesign(InputStream reportFile,
            GridReportVO gridReportVO) throws JRException {
        JasperDesign jasperDesign = JRXmlLoader.load(reportFile);
        ReportDesignBO designBO = new ReportDesignBO(jasperDesign, gridReportVO);
        designBO.define();
        return jasperDesign;
    }

    private JasperPrint createJasperPrint(InputStream reportFile,
            GridReportVO gridReportVO) throws JRException, IOException {
        JasperDesign jasperDesign = createJasperDesign(reportFile, gridReportVO);
        JasperReport jasperReport = JasperCompileManager
                .compileReport(jasperDesign);
        Map<String, Object> parameters = new HashMap<String, Object>();
        parameters.put("BaseDir", gridReportVO.getContext());
        parameters.put("IS_IGNORE_PAGINATION", gridReportVO.getPagination());

        JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport,
                parameters, new JRFieldProviderDataSource(gridReportVO
                        .getFieldProvider(), gridReportVO.getDateFormat()));
        return jasperPrint;
    }

    public void createPDFReport(InputStream reportFile,
            GridReportVO gridReportVO, OutputStream os) throws JRException,
            IOException {
        gridReportVO.setPagination(false);
        JasperPrint jasperPrint = createJasperPrint(reportFile, gridReportVO);
        JasperExportManager.exportReportToPdfStream(jasperPrint, os);

    }

    public void createXLSReport(InputStream reportFile,
            GridReportVO gridReportVO, OutputStream os) throws JRException,
            IOException {
        gridReportVO.setPagination(true);
        JasperPrint jasperPrint = createJasperPrint(reportFile, gridReportVO);
        JExcelApiExporter exporter = new JExcelApiExporter();
        Map<JRExporterParameter, Object> p = new HashMap<JRExporterParameter, Object>();

        p.put(JRExporterParameter.JASPER_PRINT, jasperPrint);
        p.put(JRExporterParameter.OUTPUT_STREAM, os);
        p.put(JExcelApiExporterParameter.IS_DETECT_CELL_TYPE, Boolean.TRUE);
        p.put(JExcelApiExporterParameter.IS_ONE_PAGE_PER_SHEET, Boolean.FALSE);
        p.put(JExcelApiExporterParameter.IS_REMOVE_EMPTY_SPACE_BETWEEN_ROWS,
                Boolean.TRUE);

        exporter.setParameters(p);
        exporter.exportReport();
    }

    public void createCSVReport(InputStream reportFile,
            GridReportVO gridReportVO, OutputStream os) throws JRException,
            IOException {
        gridReportVO.setPagination(true);
        JasperPrint jasperPrint = createJasperPrint(reportFile, gridReportVO);
        JRCsvExporter exporter = new JRCsvExporter();
        Map<JRExporterParameter, Object> p = new HashMap<JRExporterParameter, Object>();

        p.put(JRExporterParameter.JASPER_PRINT, jasperPrint);
        p.put(JRExporterParameter.OUTPUT_STREAM, os);

        exporter.setParameters(p);
        exporter.exportReport();
    }

    public void createXMLReport(InputStream reportFile,
            GridReportVO gridReportVO, OutputStream os) throws JRException,
            IOException {
        gridReportVO.setPagination(true);
        JasperPrint jasperPrint = createJasperPrint(reportFile, gridReportVO);
        JasperExportManager.exportReportToXmlStream(jasperPrint, os);
    }

}
