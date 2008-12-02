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

package org.openbravo.service.db;

import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.scheduling.ProcessBundle;

/**
 * The import client process is called from the ui. It imports the data of a new
 * client (including the client itself). It again calls the
 * {@link DataImportService} for the actual import.
 * 
 * @author mtaal
 */

public class ImportClientProcess implements org.openbravo.scheduling.Process {

    /**
     * Executes the import process. The expected parameters in the bundle are
     * clientId (denoting the client) and fileLocation giving the full path
     * location of the file with the data to import.
     */
    public void execute(ProcessBundle bundle) throws Exception {
       final OBError e = new OBError();
       e.setType("Success");
       e.setMessage("Name:"+bundle.getParams().get("name"));
       e.setTitle("Done");
       
       bundle.setResult(e);
       
    }
}