package org.openbravo.erpCommon.ad_process;

import java.sql.CallableStatement;
import java.sql.SQLException;
import java.util.Vector;

import javax.servlet.ServletException;

import org.apache.log4j.Logger;
import org.openbravo.data.UtilSql;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.database.RDBMSIndependent;
import org.openbravo.erpCommon.reference.PInstanceProcessData;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.exception.NoConnectionAvailableException;
import org.openbravo.exception.PoolNotFoundException;
import org.openbravo.scheduling.Process;
import org.openbravo.scheduling.ProcessBundle;
import org.openbravo.scheduling.ProcessContext;
import org.openbravo.scheduling.ProcessLogger;

public class PinstanceProcedure implements Process {

  static Logger log = Logger.getLogger(PinstanceProcedure.class);

  private ConnectionProvider connection;
  private ProcessLogger logger;

  public void execute(ProcessBundle bundle) throws Exception {

    logger = bundle.getLogger();
    connection = bundle.getConnection();

    final String pinstanceId = bundle.getPinstanceId();
    final String sql = "CALL " + bundle.getImpl() + "(?)";

    CallableStatement st = null;
    if (connection.getRDBMS().equalsIgnoreCase("ORACLE")) {
      int iParameter = 0;
      try {
        st = connection.getCallableStatement(sql);
        iParameter++;
        UtilSql.setValue(st, iParameter, 12, null, pinstanceId);
        st.execute();

      } catch (final SQLException e) {
        log("SQL error in query: " + sql + "Exception: ", e);
        throw new Exception("@CODE=" + Integer.toString(e.getErrorCode()) + "@" + e.getMessage());

      } catch (final Exception e) {
        log("Exception in query: " + sql + "Exception: ", e);
        throw new Exception("@CODE=@" + e.getMessage());

      } finally {
        log(pinstanceId, connection, bundle.getContext());
        try {
          connection.releasePreparedStatement(st);

        } catch (final Exception ignore) {
          ignore.printStackTrace();
        }
      }

    } else {
      final Vector<String> parametersData = new Vector<String>();
      final Vector<String> parametersTypes = new Vector<String>();
      parametersData.addElement(pinstanceId);
      parametersTypes.addElement("in");

      try {
        RDBMSIndependent.getCallableResult(null, connection, sql, parametersData, parametersTypes,
            0);

      } catch (final SQLException e) {
        log("SQL error in query: " + sql + "Exception: ", e);
        throw new Exception("@CODE=" + Integer.toString(e.getErrorCode()) + "@" + e.getMessage());

      } catch (final NoConnectionAvailableException e) {
        log("Connection error in query: " + sql + "Exception: ", e);
        throw new Exception("@CODE=NoConnectionAvailable");

      } catch (final PoolNotFoundException e) {
        log("Pool error in query: " + sql + "Exception: ", e);
        throw new Exception("@CODE=NoConnectionAvailable");

      } catch (final Exception e) {
        log("Exception in query: " + sql + "Exception: ", e);
        throw new Exception("@CODE=@" + e.getMessage());
      }
      log(pinstanceId, connection, bundle.getContext());
    }

  }

  /**
   * @param msg
   * @param e
   */
  private void log(String msg, Exception e) {
    log.error(msg, e);
    logger.log(msg + e.getMessage());
  }

  /**
   * @param conn
   * @param pinstanceId
   * @throws ServletException
   */
  private void log(String pinstanceId, ConnectionProvider conn, ProcessContext obContext) {
    OBError msg;
    try {
      final PInstanceProcessData[] data = PInstanceProcessData.select(conn, pinstanceId);
      msg = Utility.getProcessInstanceMessage(conn, obContext.toVars(), data);
      logger.log(msg.getType() + " " + msg.getTitle() + " " + msg.getMessage());

    } catch (final Exception e) {
      e.printStackTrace();
      msg = Utility.translateError(conn, obContext.toVars(), obContext.getLanguage(), e
          .getMessage());
      logger.log(msg.getType() + " " + msg.getTitle() + " " + msg.getMessage());
    }
  }

}
