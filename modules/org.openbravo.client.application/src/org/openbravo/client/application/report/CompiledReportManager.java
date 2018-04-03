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
 * All portions are Copyright (C) 2018 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.application.report;

import java.util.HashSet;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.hibernate.Query;
import org.openbravo.dal.service.OBDal;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.service.db.DalConnectionProvider;

import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperReport;

/**
 * This class is used to compile reports in different languages. It keeps the compilation results in
 * cache, avoiding unnecessary compilations when the same report is generated multiple times.
 */
class CompiledReportManager {
  private static CompiledReportManager instance = new CompiledReportManager();

  private ConcurrentHashMap<String, CompiledReport> compiledReports;
  private boolean isDisabled;

  private CompiledReportManager() {
    compiledReports = new ConcurrentHashMap<>();
    isDisabled = isInDevelopment();
  }

  private boolean isInDevelopment() {
    final String query = "select 1 from ADModule m where m.inDevelopment=true";
    final Query indevelMods = OBDal.getInstance().getSession().createQuery(query);
    indevelMods.setMaxResults(1);
    return !indevelMods.list().isEmpty();
  }

  static CompiledReportManager getInstance() {
    return instance;
  }

  JasperReport compileReport(String reportPath, String language) throws JRException {
    return compileReport(reportPath, language,
        DalConnectionProvider.getReadOnlyConnectionProvider());
  }

  JasperReport compileReport(String reportPath, String language,
      ConnectionProvider connectionProvider) throws JRException {
    CompiledReport compiledReport = getCompiledReport(reportPath, language);
    if (compiledReport != null) {
      return compiledReport.mainReport;
    }
    ReportCompiler reportCompiler = new ReportCompiler(reportPath, language, connectionProvider);
    JasperReport jReport = reportCompiler.compileReport();
    putCompiledReport(reportPath, language, new CompiledReport(jReport));
    return jReport;
  }

  JasperReport compileReportWithSubreports(String reportPath, String language,
      Map<String, Object> parameters, ConnectionProvider subRepConnProvider) throws JRException {
    JasperReport jReport;
    Map<String, JasperReport> subReports = null;
    CompiledReport compiledReport = getCompiledReport(reportPath, language);
    if (compiledReport != null) {
      jReport = compiledReport.mainReport;
      subReports = compiledReport.subReports;
    } else {
      ReportCompiler reportCompiler = new ReportCompiler(reportPath, language,
          DalConnectionProvider.getReadOnlyConnectionProvider());
      jReport = reportCompiler.compileReport();
      subReports = reportCompiler.compileSubReports(subRepConnProvider);
      putCompiledReport(reportPath, language, new CompiledReport(jReport, subReports));
    }
    if (subReports != null) {
      parameters.putAll(subReports);
    }
    return jReport;
  }

  private CompiledReport getCompiledReport(String reportPath, String language) {
    return compiledReports.get(getKey(reportPath, language));
  }

  private void putCompiledReport(String reportPath, String language, CompiledReport compiledReport) {
    if (isDisabled) {
      return;
    }
    compiledReports.putIfAbsent(getKey(reportPath, language), compiledReport);
  }

  private String getKey(String reportPath, String language) {
    if (language == null) {
      return reportPath;
    }
    return reportPath + "-" + language;
  }

  Set<String> getCachedReports() {
    Set<String> cachedReports = new HashSet<>();
    for (Entry<String, CompiledReport> entry : compiledReports.entrySet()) {
      cachedReports.add(entry.getKey());
    }
    return cachedReports;
  }

  void clearCache() {
    compiledReports.clear();
  }

  private static class CompiledReport {
    JasperReport mainReport;
    Map<String, JasperReport> subReports;

    public CompiledReport(JasperReport mainReport) {
      this.mainReport = mainReport;
    }

    public CompiledReport(JasperReport mainReport, Map<String, JasperReport> subReports) {
      this.mainReport = mainReport;
      this.subReports = subReports;
    }
  }
}
