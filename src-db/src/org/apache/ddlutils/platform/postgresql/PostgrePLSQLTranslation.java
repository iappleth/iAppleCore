/*
************************************************************************************
* Copyright (C) 2001-2006 Openbravo S.L.
* Licensed under the Apache Software License version 2.0
* You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
* Unless required by applicable law or agreed to  in writing,  software  distributed
* under the License is distributed  on  an  "AS IS"  BASIS,  WITHOUT  WARRANTIES  OR
* CONDITIONS OF ANY KIND, either  express  or  implied.  See  the  License  for  the
* specific language governing permissions and limitations under the License.
************************************************************************************
*/

package org.apache.ddlutils.platform.postgresql;

import java.sql.Types;
import org.apache.ddlutils.model.Database;
import org.apache.ddlutils.translation.*;

/**
 *
 * @author adrian
 */
public class PostgrePLSQLTranslation extends CombinedTranslation {
    
    /** Creates a new instance of ProcedureTranslation */
    public PostgrePLSQLTranslation(Database database) {
        
        // Here goes the common translations for triggers and functions
        // append(............
        
        // Numeric Type
        append(new ReplaceStrTranslation(" NUMBER,", " NUMERIC,"));
        append(new ByLineTranslation(new ReplacePatTranslation("(\\s|\\t)+[Nn][Uu][Mm][Bb][Ee][Rr](\\s|\\t)+", "{1}NUMERIC{2}")));
        append(new ReplaceStrTranslation(" NUMBER(", " NUMERIC("));
        append(new ReplaceStrTranslation(" NUMBER)", " NUMERIC)"));
        append(new ByLineTranslation(new ReplacePatTranslation("(\\s|\\t)+[Nn][Uu][Mm][Bb][Ee][Rr](\\s|\\t)*$", "{1}NUMERIC{2}")));
        append(new ReplaceStrTranslation(" NUMBER;", " NUMERIC;"));
        append(new ReplaceStrTranslation(" NUMBER:", " NUMERIC:"));
        append(new ReplaceStrTranslation("'NUMBER'", "'NUMERIC'"));
        
        // Varchar Type
        append(new ReplaceStrTranslation("NVARCHAR", "VARCHAR"));
        append(new ReplaceStrTranslation("VARCHAR2", "VARCHAR"));
        append(new ReplaceStrTranslation(" BYTE)", ")"));
        append(new ReplaceStrTranslation("'VARCHAR2'", "'VARCHAR'")); 
        
        // Now() function
        append(new ReplaceStrTranslation("SYSDATE,", "now(),"));
        append(new ReplaceStrTranslation(" SYSDATE ", " now() "));
        append(new ReplaceStrTranslation("SYSDATE$", "now()"));
        append(new ReplaceStrTranslation("(SYSDATE", "(now()"));
        append(new ReplaceStrTranslation(" SYSDATE;", " now();"));
        append(new ReplaceStrTranslation("=SYSDATE", "=now()"));
        append(new ReplaceStrTranslation("<SYSDATE", "<now()"));
        
        // TimeStamp Type
        append(new ReplaceStrTranslation(" DATE,", " TIMESTAMP,"));
        append(new ByLineTranslation(new ReplacePatTranslation("(\\s|\\t)+[Dd][Aa][Tt][Ee](\\s|\\t)+", "{1}TIMESTAMP{2}")));
        append(new ByLineTranslation(new ReplacePatTranslation("(\\s|\\t)+[Dd][Aa][Tt][Ee](\\s|\\t)*$", "{1}TIMESTAMP{2}")));
        append(new ReplaceStrTranslation("TO_DATE", "TO_DATE"));
        append(new ReplaceStrTranslation(" DATE;", " TIMESTAMP;"));
        append(new ReplaceStrTranslation("'DATE'", "'TIMESTAMP'"));
        
        // Text Type
        append(new ReplaceStrTranslation("LONG,", "TEXT,"));
        append(new ReplaceStrTranslation(" LONG ", " TEXT "));
        append(new ReplaceStrTranslation("LONG$", "TEXT"));
        append(new ReplaceStrTranslation("CLOB,", "TEXT,"));
        append(new ReplaceStrTranslation(" CLOB ", " TEXT "));
        append(new ReplaceStrTranslation("CLOB$", "TEXT"));
        append(new ReplaceStrTranslation("BLOB,", "OID,"));
        append(new ReplaceStrTranslation(" BLOB ", " OID "));
        append(new ReplaceStrTranslation("BLOB$", "OID"));
        
        append(new ReplaceStrTranslation("'", "''"));
        append(new ByLineTranslation(new ReplacePatTranslation("^(AS|IS)([\\s|\\t]*)$", "AS '")));  
        append(new ByLineTranslation(new ReplacePatTranslation("^(\\s|\\t)*(.+?)rowcount(\\s|\\t)*:=(\\s|\\t)*SQL%ROWCOUNT;", "{1}GET DIAGNOSTICS {2}rowcount:=ROW_COUNT;")));       
        append(new RemoveTranslation("COMMIT;"));
        append(new RemoveTranslation("ROLLBACK;"));
        append(new ReplaceStrTranslation("EXECUTE IMMEDIATE", "EXECUTE"));
        
        append(new ReplaceStrTranslation("NO_DATA_FOUND", "DATA_EXCEPTION"));
        append(new ReplaceStrTranslation("Not_Fully_Qualified", "INTERNAL_ERROR"));
        append(new ReplaceStrTranslation("OB_exception", "RAISE_EXCEPTION"));
        
        append(new ReplaceStrTranslation("SQLCODE", "SQLSTATE"));
        //append(new ReplacePatTranslation("TYPE RECORD", "-- TYPE RECORD"));
        //append(new ReplaceStrTranslation("TYPE invalid_tab", "-- TYPE invalid_tab"));
        //append(new ReplaceStrTranslation("TYPE ArrayName", "-- TYPE ArrayName"));
        //append(new ReplaceStrTranslation("TYPE ArrayPesos", "-- TYPE ArrayPesos"));
        
        append(new ByLineTranslation(new ReplacePatTranslation("^(.+?)([\\s|\\t|\\(]+?)([^\\s|\\t|\\(]+?)%[Rr][Oo][Ww][Tt][Yy][Pp][Ee]","{1} RECORD")));        
        
		
        append(new ReplacePatTranslation("<<", "-- <<"));
        append(new ReplaceStrTranslation("REF CURSOR", "REFCURSOR"));
        append(new ReplaceStrTranslation("MINUS", "EXCEPT"));
        append(new ReplacePatTranslation("[Tt][Yy][Pp][Ee]_[Rr][Ee][Ff](\\s|\\t)*;(\\s|\\t)*", "TYPE_REF%TYPE;"));
        append(new ReplaceStrTranslation("NOW()", "TO_DATE(NOW())"));
        append(new ReplacePatTranslation("\\(NEW.Updated-NEW.Created\\)", "substract_days\\(NEW.Updated,NEW.Created\\)")); 
        
        append(new ReplacePatTranslation("OPEN(.+?)FOR(.+?);","OPEN {1} FOR EXECUTE {2};"));
       
        append(new ReplacePatTranslation("TYPE TYPE_Ref IS ", "TYPE_Ref "));
        append(new ReplacePatTranslation("TYPE(\\s|\\t)(.+?)(\\s|\\t)(IS)(\\s|\\t)(.+)","--TYPE{1}{2}{3}{4}{5}{6}"));
        
        append(new ReplacePatTranslation("ArrayPesos;", "INTEGER[10];"));
        append(new ReplacePatTranslation("ArrayPesos\\(", "Array("));
        append(new ReplacePatTranslation("ArrayName;", "VARCHAR[20];"));
        append(new ReplacePatTranslation("ArrayName\\(", "Array("));

        // Perform
        for(int i = 0; i < database.getFunctionCount(); i++) {
            if (database.getFunction(i).getTypeCode() == Types.NULL && 
            	!database.getFunction(i).getName().equalsIgnoreCase("AD_SEQUENCE_NEXT") &&
            	!database.getFunction(i).getName().equalsIgnoreCase("AD_SEQUENCE_DOC") &&	
            	!database.getFunction(i).getName().equalsIgnoreCase("AD_SEQUENCE_DOCTYPE") &&
            	!database.getFunction(i).getName().equalsIgnoreCase("FACT_ACCT_BALANCE_UPDATE") ) {
                append(new ReplaceStrTranslation(database.getFunction(i).getName() + " *(", "PERFORM " + database.getFunction(i).getName() + "("));               
            }
        }
        
        // Procedures with output parameters...
        for (int i = 0; i < database.getFunctionCount(); i++) {
            if (database.getFunction(i).hasOutputParameters()) {
                append(new FunctionWithOutputTranslation(database.getFunction(i)));
            }
        }
        
        append(new ReplaceStrTranslation("DBA_RECOMPILE(", "PERFORM DBA_RECOMPILE("));
        //append(new ReplaceStrTranslation("AD_Tab_Import (", "PERFORM AD_Tab_Import("));  
        //append(new ReplaceStrTranslation("A_Asset_Post (", "PERFORM A_Asset_Post("));        
        //append(new ReplaceStrTranslation("changeprojectstatustoorder (", "PERFORM changeprojectstatustoorder("));        
        //append(new ReplaceStrTranslation("closeproject (", "PERFORM closeproject("));        
        
        // Miscellaneous translations
        append(new ChangeFunction2Translation());
        
        // Remove procedure name after last END
        append(new Translation() {
            public String exec(String s) {
                int i = s.lastIndexOf("END ");
                return i >= 0 ? s.substring(0, i + 4) : s;
            }
        });
    }
    
}
