package org.openbravo.service.importqueue;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.enterprise.util.AnnotationLiteral;
import javax.inject.Inject;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.core.TriggerHandler;
import org.openbravo.dal.service.OBDal;
import org.openbravo.database.SessionInfo;
import org.openbravo.model.ad.access.Role;
import org.openbravo.model.ad.access.User;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.service.importprocess.ImportEntry;
import org.openbravo.service.importprocess.ImportEntryPreProcessor;
import org.openbravo.service.importqueue.impl.RabbitQueue;

@ApplicationScoped
public class QueueManager implements ImportEntryProcessor {

  @Inject
  @Any
  private Instance<RecordProcessor> queueProcessorsList;

  private QueueImplementation queue;

  @PostConstruct
  private void init() {
    // queue = new NoQueue();
    queue = new RabbitQueue();
    queue.start(this);
  }

  @PreDestroy
  private void close() {
    queue.close();
  }

  /**
   * Creates and saves the import entry, calls the
   * {@link ImportEntryPreProcessor#beforeCreate(ImportEntry)} on the
   * {@link ImportEntryPreProcessor} instances.
   * 
   * Note will commit the session/connection using {@link OBDal#commitAndClose()}
   */
  public void publishImportEntry(JSONObject importentry) {
    queue.publish(importentry);
  }

  @Override
  public void processImportEntry(JSONObject message) throws QueueException, JSONException {

    OBContext.setAdminMode(false);

    // {
    // "messageId":"D06E6D14FE94540620C1155521EB3E9B",
    // "entrykey":"Order"
    // "csrfToken":"F84D68997AD7450F83B52ED7EB366028",
    // "appName":"WebPOS",
    // "client":"39363B0921BB4293B48383844325E84C",
    // "organization":"D270A5AC50874F8BA67A88EE977F8E3B",
    // "pos":"9104513C2D0741D4850AE8493998A7C8",
    // "terminalName":"VBS-1",
    // "timeout":10000,
    // "parameters":{
    // "terminalTime":"2022-02-21T23:07:10.489Z",
    // "terminalTimeOffset":{
    // "value":-60
    // }
    // },
    // "data":[

    try {
      RecordProcessor processor = queueProcessorsList
          .select(new QueueManager.Selector(message.getString("entrykey")))
          .get();

      JSONArray datalist = message.getJSONArray("data");
      for (int i = 0; i < datalist.length(); i++) {
        JSONObject record = datalist.getJSONObject(i);
        String orgId = getOrganizationId(record);
        Organization org = OBDal.getInstance().get(Organization.class, orgId);
        Client client = org.getClient();
        String clientId = client.getId();
        String userId = getUserId(record);
        User user = OBDal.getInstance().get(User.class, userId);
        Role role = user.getDefaultRole();
        String roleId = role.getId();
        initOBContext(userId, roleId, clientId, orgId);

        processor.processRecord(record);
      }
      OBDal.getInstance().commitAndClose();

    } finally {
      OBContext.setOBContext((OBContext) null);
      OBContext.restorePreviousMode();
      ensureConnectionRelease();
    }
  }

  private void ensureConnectionRelease() {
    // bit rough but ensures that the connection is released/closed
    try {
      OBDal.getInstance().rollbackAndClose();
    } catch (Exception ignored) {
    }

    try {
      if (TriggerHandler.getInstance().isDisabled()) {
        TriggerHandler.getInstance().enable();
      }
      OBDal.getInstance().commitAndClose();
    } catch (Exception ignored) {
    }
  }

  private void initOBContext(String userId, String roleId, String clientId, String orgId) {

    OBContext.setOBContext(userId, roleId, clientId, orgId);
    OBContext context = OBContext.getOBContext();
    context.getEntityAccessChecker(); // forcing access checker initialization
    context.getOrganizationStructureProvider().reInitialize();

    setVariablesSecureApp(context);

    OBDal.getInstance().getSession().clear();

    SessionInfo.setUserId(userId);
    SessionInfo.setProcessType(SessionInfo.IMPORT_ENTRY_PROCESS);
    SessionInfo.setProcessId(SessionInfo.IMPORT_ENTRY_PROCESS);
  }

  private void setVariablesSecureApp(OBContext obContext) {
    OBContext.setAdminMode(true);
    try {
      final VariablesSecureApp variablesSecureApp = new VariablesSecureApp(
          obContext.getUser().getId(), obContext.getCurrentClient().getId(),
          obContext.getCurrentOrganization().getId(), obContext.getRole().getId(),
          obContext.getLanguage().getLanguage());
      RequestContext.get().setVariableSecureApp(variablesSecureApp);
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  private String getOrganizationId(final JSONObject jsonRecord)
      throws QueueException, JSONException {
    if (jsonRecord.has("trxOrganization")) {
      return jsonRecord.getString("trxOrganization");
    }
    if (jsonRecord.has("organization")) {
      return jsonRecord.getString("organization");
    }
    throw new QueueException("Cannot find Organization");
  }

  private String getUserId(final JSONObject jsonRecord) throws QueueException, JSONException {
    if (jsonRecord.has("updatedBy") && !"null".equals(jsonRecord.getString("updatedBy"))) {
      return jsonRecord.getString("updatedBy");
    }
    if (jsonRecord.has("createdBy") && !"null".equals(jsonRecord.getString("createdBy"))) {
      return jsonRecord.getString("createdBy");
    }
    if (jsonRecord.has("userId") && !"null".equals(jsonRecord.getString("userId"))) {
      return jsonRecord.getString("userId");
    }
    throw new QueueException("Cannot find User");
  }

  /**
   * Defines the qualifier used to register a component provider.
   */
  @javax.inject.Qualifier
  @Retention(RetentionPolicy.RUNTIME)
  @Target({ ElementType.FIELD, ElementType.METHOD, ElementType.TYPE })
  public @interface Qualifier {
    String value();
  }

  /**
   * A class used to select the correct component provider.
   * 
   */
  @SuppressWarnings("all")
  public static class Selector extends AnnotationLiteral<QueueManager.Qualifier>
      implements QueueManager.Qualifier {
    private static final long serialVersionUID = 1L;

    private final String value;

    public Selector(String value) {
      this.value = value;
    }

    @Override
    public String value() {
      return value;
    }
  }
}
