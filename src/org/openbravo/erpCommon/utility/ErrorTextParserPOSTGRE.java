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
package org.openbravo.erpCommon.utility;

import org.openbravo.data.FieldProvider;
import org.apache.log4j.Logger;

public class ErrorTextParserPOSTGRE extends ErrorTextParser {
  static Logger log4j = Logger.getLogger(ErrorTextParserPOSTGRE.class);

  public OBError parse() throws Exception {
    if (getMessage().equals("")) return null;
    else if (getConnection()==null) return null;
    OBError myError = null;
    OBError myCodeError = null;
    String myMessage = getMessage();
    if (log4j.isDebugEnabled()) log4j.debug("Message: " + myMessage);
    //BEGIN Getting DB object name
    int pos = myMessage.indexOf("\"");
    if (pos != -1) {
      myMessage = myMessage.substring(pos+1);
      pos = myMessage.indexOf("\"");
      if (pos != -1) {
        myMessage = myMessage.substring(pos+1);
        pos = myMessage.indexOf("\"");
        if (pos != -1) {
          myMessage = myMessage.substring(pos+1);
          int finalPos = myMessage.indexOf("\"");
          if (finalPos==-1) finalPos = myMessage.length();
          String objectName = myMessage.substring(0, finalPos);
          if (log4j.isDebugEnabled()) log4j.debug("Object name: " + objectName);
          pos = objectName.indexOf(".");
          if (pos!=-1) objectName = objectName.substring(pos+1);
          if (log4j.isDebugEnabled()) log4j.debug("Object real name: " + objectName);
          ErrorTextParserPOSTGREData[] constraintData = ErrorTextParserPOSTGREData.select(getConnection(), objectName);
          //BEGIN Specific parse for CONSTRAINT DB objects
          if (constraintData!=null && constraintData.length>0) {
            //BEGIN Search message by constraint name
            FieldProvider fldMessage = Utility.locateMessage(getConnection(), constraintData[0].constraintName, getLanguage());
            if (fldMessage!=null) {
              myError = new OBError();
              myError.setType((fldMessage.getField("msgtype").equals("E")?"Error":"Warning"));
              myError.setMessage(fldMessage.getField("msgtext"));
              return myError;
            }
            //END Search message by constraint name
            if (constraintData[0].constraintType.equalsIgnoreCase("C") && !constraintData[0].searchCondition.equals("")) {
              //BEGIN Search message by constraint search condition
              fldMessage = Utility.locateMessage(getConnection(), constraintData[0].searchCondition, getLanguage());
              if (fldMessage!=null) {
                myError = new OBError();
                myError.setType((fldMessage.getField("msgtype").equals("E")?"Error":"Warning"));
                myError.setMessage(fldMessage.getField("msgtext"));
                return myError;
              } else if (!constraintData[0].searchCondition.trim().equals("")) {
                String searchCond = constraintData[0].searchCondition.trim().toUpperCase();
                if (searchCond.endsWith(" IS NOT NULL")) {
                  String columnName = searchCond.substring(0, searchCond.lastIndexOf(" IS NOT NULL")).trim();
                  columnName = Utility.messageBD(getConnection(), columnName, getLanguage());
                  String tableName = Utility.messageBD(getConnection(), constraintData[0].tableName, getLanguage());
                  myError = new OBError();
                  myError.setType("Error");
                  myError.setMessage(Utility.messageBD(getConnection(), "NotNullError", getLanguage()) + ": " + tableName + " - " + columnName);
                  return myError;
                } else if (searchCond.endsWith(" IN ('Y','N')") || searchCond.endsWith(" IN ('Y', 'N')") || searchCond.endsWith(" IN ('N','Y')") || searchCond.endsWith(" IN ('N', 'Y')")) {
                  String columnName = searchCond.substring(0, searchCond.lastIndexOf(" IN (")).trim();
                  columnName = Utility.messageBD(getConnection(), columnName, getLanguage());
                  String tableName = Utility.messageBD(getConnection(), constraintData[0].tableName, getLanguage());
                  myError = new OBError();
                  myError.setType("Error");
                  myError.setMessage(Utility.messageBD(getConnection(), "NotYNError", getLanguage()) + ": " + tableName + " - " + columnName);
                  return myError;
                }
              }
              //END Search message by constraint search condition
            }
          }
      //END Specific parse for CONSTRAINT DB objects
        }
        else{
          myError = new OBError();
          myError.setType("Error");
          myError.setMessage(getMessage());
          return myError;
        }
      }
    }
    else{
      System.out.println("Error:"+getMessage());
      myError = new OBError();
      myError.setType("Error");
      myError.setMessage(getMessage());
      return myError;
    }
    //END Getting DB object name
    if (myCodeError!=null) return myCodeError;
    else return myError;
  }
}
