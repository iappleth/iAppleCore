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
 * All portions are Copyright (C) 2001-2009 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.erpCommon.utility;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.log4j.Logger;
import org.openbravo.data.FieldProvider;

// examples for the types of postgres messages to be parsed by this class

// example for check constraint
// ERROR:  new row for relation "ad_attachment" violates check constraint "ad_attachment_isactive_check"

// example for foreign key violation
// ERROR:  insert or update on table "ad_attachment" violates foreign key constraint "addatatype_adattachment"
// DETAIL:  Key (ad_datatype_id)=() is not present in table "ad_datatype".

// example for not null
// ERROR:  null value in column "ad_org_id" violates not-null constraint

// example for unique constraint
// ERROR: duplicate key value violates unique constraint "ad_user_un_username"

// example for duplicate primary key
// ERROR:  duplicate key value violates unique constraint "ad_attachment_key"

// example for error from pl-function (manually written message)
// ERROR: Unit of Measure mismatch (product/transaction)

// example for error from trigger (manually written message)
// ERROR:  Unit of Measure mismatch (product/transaction)

// example for delete and record with fk violation
// @CODE=0@ERROR: update or delete on table "ad_module" violates foreign key constraint "admoduleversion_dbprefix" on table "ad_module_dbprefix"
// Detail: Key (ad_module_id)=(D929EC825F3140B7A6F5F955C903B4C2) is still referenced from table "ad_module_dbprefix".

// current heuristic: use second quoted string like "text"

/**
 * @author Fernando Iriazabal
 * 
 *         Instance of the Abstract class, ErrorTextParser, that implements the error parsing for
 *         POSTGRESQL RDBMS.
 */
class ErrorTextParserPOSTGRE extends ErrorTextParser {
  static Logger log4j = Logger.getLogger(ErrorTextParserPOSTGRE.class);

  /**
   * Extracts the name of a constraint out of a postgresql generated error message about a
   * constraint violation. Based on observed messages the following rule is used: The second pattern
   * "text" in the error message is the constraint name. If there is only one instance of this
   * pattern, then this first one is used.
   * 
   * @param input
   *          a postgres error message about a constraint violation
   * @return name of the constraint, or null if no name can be found
   */
  private static String findConstraintName(String input) {
    log4j.debug("find constraint name in : " + input);
    Pattern p = Pattern.compile("\".+?\"");
    Matcher m = p.matcher(input);
    if (!m.find()) {
      log4j.warn("did not find constraint name for error message: " + input);
      return null;
    }
    String constraintName = input.substring(m.start(), m.end());
    if (m.find()) {
      constraintName = input.substring(m.start(), m.end());
    }
    // strip leading and trailing " character
    constraintName = constraintName.substring(1, constraintName.length() - 1);
    log4j.debug("found constraint: " + constraintName);
    return constraintName;
  }

  /*
   * (non-Javadoc)
   * 
   * @see org.openbravo.erpCommon.utility.ErrorTextParser#parse()
   */
  public OBError parse() throws Exception {
    if (getMessage().equals(""))
      return null;
    else if (getConnection() == null)
      return null;
    OBError myError = null;
    OBError myCodeError = null;
    String myMessage = getMessage();
    if (log4j.isDebugEnabled())
      log4j.debug("Message: " + myMessage);

    /*
     * heuristic to decide if an sql error text is generated by postgres of a manual one which needs
     * to be run through parseTranslation. Criteria: if text contains two times an @ as template
     * placeholder => parseTranslation else => old behavior to try to find matching constraint
     */

    if (myMessage.matches(".*@.+@.*")) {
      // if the message is a directly from postgres generated one, it has an 'ERROR :' prefix
      // if it is passed via an AD_PINSTACE result, then the 'ERROR: ' has already been stripped
      if ((myMessage.length() > 7) && (myMessage.startsWith("ERROR: "))) {
        myMessage = myMessage.substring(7);
      }
      String translatedMsg = Utility.parseTranslation(getConnection(), getVars(), getLanguage(),
          myMessage);
      log4j.debug("translated message: " + translatedMsg);

      OBError translatedError = new OBError();
      translatedError.setType("Error");
      translatedError.setMessage(translatedMsg);
      return translatedError;
    }

    // extract constraint name out of error message text
    String objectName = findConstraintName(myMessage);
    // constraint name could not be found => return original error text
    if (objectName == null) {
      OBError originalError = new OBError();
      originalError.setType("Error");
      originalError.setMessage(getMessage());
      return originalError;
    }

    // lookup constraint data
    ErrorTextParserPOSTGREData[] constraintData = ErrorTextParserPOSTGREData.select(
        getConnection(), objectName);

    // BEGIN Specific parse for CONSTRAINT DB objects

    // find constraint name only uses heuristic for constraint name
    // so if no constraint can be found for the name => return original message
    if (constraintData == null || constraintData.length == 0) {
      OBError originalError = new OBError();
      originalError.setType("Error");
      originalError.setMessage(getMessage());
      return originalError;
    }

    // BEGIN Search message by constraint name
    FieldProvider fldMessage = Utility.locateMessage(getConnection(),
        constraintData[0].constraintName, getLanguage());
    if (fldMessage != null) {
      myError = new OBError();
      myError.setType((fldMessage.getField("msgtype").equals("E") ? "Error" : "Warning"));
      myError.setMessage(fldMessage.getField("msgtext"));
      return myError;
    }
    // END Search message by constraint name
    if (constraintData[0].constraintType.equalsIgnoreCase("C")
        && !constraintData[0].searchCondition.equals("")) {
      // BEGIN Search message by constraint search
      // condition
      fldMessage = Utility.locateMessage(getConnection(), constraintData[0].searchCondition,
          getLanguage());
      if (fldMessage != null) {
        myError = new OBError();
        myError.setType((fldMessage.getField("msgtype").equals("E") ? "Error" : "Warning"));
        myError.setMessage(fldMessage.getField("msgtext"));
        return myError;
      } else if (!constraintData[0].searchCondition.trim().equals("")) {
        String searchCond = constraintData[0].searchCondition.trim().toUpperCase();
        if (searchCond.endsWith(" IS NOT NULL")) {
          String columnName = searchCond.substring(0, searchCond.lastIndexOf(" IS NOT NULL"))
              .trim();
          columnName = Utility.messageBD(getConnection(), columnName, getLanguage());
          String tableName = Utility.messageBD(getConnection(), constraintData[0].tableName,
              getLanguage());
          myError = new OBError();
          myError.setType("Error");
          myError.setMessage(Utility.messageBD(getConnection(), "NotNullError", getLanguage())
              + ": " + tableName + " - " + columnName);
          return myError;
        } else if (searchCond.endsWith(" IN ('Y','N')") || searchCond.endsWith(" IN ('Y', 'N')")
            || searchCond.endsWith(" IN ('N','Y')") || searchCond.endsWith(" IN ('N', 'Y')")) {
          String columnName = searchCond.substring(0, searchCond.lastIndexOf(" IN (")).trim();
          columnName = Utility.messageBD(getConnection(), columnName, getLanguage());
          String tableName = Utility.messageBD(getConnection(), constraintData[0].tableName,
              getLanguage());
          myError = new OBError();
          myError.setType("Error");
          myError.setMessage(Utility.messageBD(getConnection(), "NotYNError", getLanguage()) + ": "
              + tableName + " - " + columnName);
          return myError;
        }
      }
      // END Search message by constraint search condition
    } else {
      // it is a constraint but has no entry with the constraint name in AD_MESSAGE.value
      myError = new OBError();
      myError.setType("Error");
      myError.setMessage(getMessage());
      return myError;
    }
    // END Specific parse for CONSTRAINT DB objects

    // END Getting DB object name
    if (myCodeError != null)
      return myCodeError;
    else
      return myError;
  }
}
