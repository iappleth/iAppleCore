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
package org.openbravo.scheduling;

import org.openbravo.base.ConfigParameters;
import org.openbravo.database.ConnectionProvider;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;

public class DefaultJob implements Job {

    /**
     * {@inheritDoc}
     */
    public void execute(JobExecutionContext jec) throws JobExecutionException {
        final ProcessBundle bundle = (ProcessBundle) jec.getMergedJobDataMap()
                .get(ProcessBundle.KEY);
        try {
            final Process process = bundle.getProcessClass().newInstance();
            bundle.setConnection((ConnectionProvider) jec
                    .get(ProcessBundle.CONNECTION));
            bundle.setConfig((ConfigParameters) jec
                    .get(ProcessBundle.CONFIG_PARAMS));
            bundle.setLog(new ProcessLogger(bundle.getConnection()));
            process.execute(bundle);

        } catch (final Exception e) {
            e.printStackTrace();
            throw new JobExecutionException(e);
        }
    }
}
