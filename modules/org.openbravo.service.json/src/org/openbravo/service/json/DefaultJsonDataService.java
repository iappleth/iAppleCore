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
 * All portions are Copyright (C) 2009-2012 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.service.json;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.ScrollableResults;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.base.util.Check;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.service.json.JsonToDataConverter.JsonConversionError;

/**
 * Implements generic data operations which have parameters and json as an input and return results
 * as json strings.
 * 
 * Note the parameters, json input and generated json follow the Smartclient specs. See the
 * Smartclient <a href="http://www.smartclient.com/docs/7.0rc2/a/b/c/go.html#class..RestDataSource">
 * RestDataSource</a> for more information.
 * 
 * This is a singleton class.
 * 
 * @author mtaal
 */
public class DefaultJsonDataService implements JsonDataService {
  private static final Logger log = Logger.getLogger(DefaultJsonDataService.class);

  private static final long serialVersionUID = 1L;

  private static DefaultJsonDataService instance = new DefaultJsonDataService();

  public static DefaultJsonDataService getInstance() {
    return instance;
  }

  public static void setInstance(DefaultJsonDataService instance) {
    DefaultJsonDataService.instance = instance;
  }

  /*
   * (non-Javadoc)
   * 
   * @see org.openbravo.service.json.JsonDataService#fetch(java.util.Map)
   */
  public String fetch(Map<String, String> parameters) {
    try {
      final String entityName = parameters.get(JsonConstants.ENTITYNAME);
      Check.isNotNull(entityName, "The name of the service/entityname should not be null");
      Check.isNotNull(parameters, "The parameters should not be null");

      final JSONObject jsonResult = new JSONObject();
      final JSONObject jsonResponse = new JSONObject();
      List<BaseOBObject> bobs;
      final String id = parameters.get(JsonConstants.ID);
      // if the id is set that's a special case of one object being requested
      if (id != null) {
        bobs = new ArrayList<BaseOBObject>();
        final BaseOBObject bob = OBDal.getInstance().get(entityName, id);
        if (bob != null) {
          bobs.add(bob);
        }
      } else {
        final String startRowStr = parameters.get(JsonConstants.STARTROW_PARAMETER);
        final String endRowStr = parameters.get(JsonConstants.ENDROW_PARAMETER);

        boolean preventCountOperation = !parameters.containsKey(JsonConstants.NOCOUNT_PARAMETER)
            || "true".equals(parameters.get(JsonConstants.NOCOUNT_PARAMETER));

        DataEntityQueryService queryService = createSetQueryService(parameters, true);
        queryService.setEntityName(entityName);

        // only do the count if a paging request is done and it has not been prevented
        // explicitly
        boolean doCount = false;
        int count = -1;
        int startRow = (startRowStr != null ? queryService.getFirstResult() : 0);
        int computedMaxResults = (queryService.getMaxResults() == null ? Integer.MAX_VALUE
            : queryService.getMaxResults());
        if (startRowStr != null) {
          doCount = true;
        }
        if (endRowStr != null) {
          // note computedmaxresults must be set before
          // endRow is increased by 1
          // increase by 1 to see if there are more results.
          if (preventCountOperation) {
            // set count here, is corrected in specific cases later
            count = queryService.getMaxResults();
          }
        } else {
          // can't do count if there is no endrow...
          preventCountOperation = false;
        }

        if (doCount && !preventCountOperation) {
          count = queryService.count();
        }

        if (parameters.containsKey(JsonConstants.ONLYCOUNT_PARAMETER)) {
          // stop here
          jsonResponse.put(JsonConstants.RESPONSE_TOTALROWS, count);
          return jsonResponse.toString();
        }

        queryService = createSetQueryService(parameters, false);
        queryService.setEntityName(entityName);

        if (parameters.containsKey(JsonConstants.SUMMARY_PARAMETER)) {
          final JSONObject singleResult = new JSONObject();
          if (queryService.getSummaryFields().size() == 1) {
            singleResult.put(queryService.getSummaryFields().get(0), queryService.buildOBQuery()
                .createQuery().uniqueResult());
          } else {
            final Object[] os = (Object[]) queryService.buildOBQuery().createQuery().uniqueResult();
            int i = 0;
            if (os != null && os.length > 0) {
              for (String key : queryService.getSummaryFields()) {
                singleResult.put(key, os[i++]);
              }
            }
          }
          singleResult.put("isGridSummary", true);

          jsonResponse.put(JsonConstants.RESPONSE_DATA,
              new JSONArray(Collections.singleton(singleResult)));
          jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
          jsonResult.put(JsonConstants.RESPONSE_RESPONSE, jsonResponse);
          jsonResponse.put(JsonConstants.RESPONSE_STARTROW, 0);
          jsonResponse.put(JsonConstants.RESPONSE_ENDROW, 1);
          jsonResponse.put(JsonConstants.RESPONSE_TOTALROWS, 1);
          return jsonResult.toString();
        } else if (parameters.containsKey(JsonConstants.DISTINCT_PARAMETER)) {
          // when distinct an array of values is returned
          // the first value is the BaseObObject the other values
          // are part of the order by and such and can be ignored
          final String distinct = parameters.get(JsonConstants.DISTINCT_PARAMETER);
          final Property distinctProperty = DalUtil.getPropertyFromPath(ModelProvider.getInstance()
              .getEntity(entityName), distinct);
          final Entity distinctEntity = distinctProperty.getTargetEntity();
          final List<Property> properties = new ArrayList<Property>();
          properties.addAll(distinctEntity.getIdProperties());
          properties.addAll(distinctEntity.getIdentifierProperties());

          bobs = new ArrayList<BaseOBObject>();

          List<List<Property>> cache = new ArrayList<List<Property>>();
          for (Object o : queryService.buildOBQuery().createQuery().list()) {
            final Object[] os = (Object[]) o;
            if (os[0] == null) {
              // the null value is also returned, ignore those
              continue;
            }

            if (cache.size() == 0) {
              for (int i = 0; i < os.length; i++) {
                cache.add(null);
              }
            }

            // create a BaseOBObject and fill the id/identifier properties
            final BaseOBObject bob = (BaseOBObject) OBProvider.getInstance().get(
                distinctEntity.getName());
            int i = 0;
            for (Property property : properties) {
              // the query contains the identifier and other properties for
              // one level deeper!
              if (property.getTargetEntity() != null) {
                final BaseOBObject refBob = (BaseOBObject) OBProvider.getInstance().get(
                    property.getTargetEntity().getName());
                final List<Property> nextIdentifierProps;
                if (cache.get(i) != null) {
                  nextIdentifierProps = cache.get(i);
                } else {
                  nextIdentifierProps = JsonUtils.getIdentifierSet(property);
                  cache.set(i, nextIdentifierProps);
                }
                for (Property nextIdentifierProp : nextIdentifierProps) {
                  refBob.setValue(nextIdentifierProp.getName(), os[i++]);
                }
                bob.setValue(property.getName(), refBob);
              } else {
                bob.setValue(property.getName(), os[i++]);
              }
            }
            bobs.add(bob);
          }
        } else {
          bobs = queryService.list();
        }

        if (preventCountOperation) {
          count = bobs.size() + startRow;
          // computedMaxResults is one too much, if we got one to much then correct
          // the result and up the count so that the grid knows that there are more
          if (bobs.size() == computedMaxResults) {
            bobs = bobs.subList(0, bobs.size() - 1);
            count++;
          }
        }

        jsonResponse.put(JsonConstants.RESPONSE_STARTROW, startRow);
        jsonResponse.put(JsonConstants.RESPONSE_ENDROW, (bobs.size() > 0 ? bobs.size() + startRow
            - 1 : 0));
        // bobs can be empty and count > 0 if the order by forces a join without results
        if (bobs.isEmpty()) {
          if (startRow > 0) {
            // reload the startrow again from 0
            parameters.put(JsonConstants.STARTROW_PARAMETER, "0");
            parameters.put(JsonConstants.ENDROW_PARAMETER, computedMaxResults + "");
            return fetch(parameters);
          }
          jsonResponse.put(JsonConstants.RESPONSE_TOTALROWS, 0);
        } else if (doCount) {
          jsonResponse.put(JsonConstants.RESPONSE_TOTALROWS, count);
        }
      }

      final DataToJsonConverter toJsonConverter = OBProvider.getInstance().get(
          DataToJsonConverter.class);
      toJsonConverter.setAdditionalProperties(JsonUtils.getAdditionalProperties(parameters));
      toJsonConverter.setSelectedProperties(parameters
          .get(JsonConstants.SELECTEDPROPERTIES_PARAMETER));
      final List<JSONObject> jsonObjects = toJsonConverter.toJsonObjects(bobs);

      addWritableAttribute(jsonObjects);

      jsonResponse.put(JsonConstants.RESPONSE_DATA, new JSONArray(jsonObjects));
      jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
      jsonResult.put(JsonConstants.RESPONSE_RESPONSE, jsonResponse);

      return jsonResult.toString();

    } catch (Throwable t) {
      log.error(t.getMessage(), t);
      return JsonUtils.convertExceptionToJson(t);
    }
  }

  public void fetch(Map<String, String> parameters, QueryResultWriter writer) {
    long t = System.currentTimeMillis();
    final String entityName = parameters.get(JsonConstants.ENTITYNAME);
    final DataEntityQueryService queryService = createSetQueryService(parameters, false);
    queryService.setEntityName(entityName);

    final DataToJsonConverter toJsonConverter = OBProvider.getInstance().get(
        DataToJsonConverter.class);
    toJsonConverter.setAdditionalProperties(JsonUtils.getAdditionalProperties(parameters));

    final ScrollableResults scrollableResults = queryService.scroll();
    int i = 0;
    while (scrollableResults.next()) {
      final Object result = scrollableResults.get()[0];
      final JSONObject json = toJsonConverter.toJsonObject((BaseOBObject) result,
          DataResolvingMode.FULL);
      writer.write(json);
      i++;
      // Clear session every 1000 records to prevent huge memory consumption in case of big loops
      if (i % 1000 == 0) {
        OBDal.getInstance().getSession().clear();
        log.debug("clearing in record " + i + " elapsed time " + (System.currentTimeMillis() - t));
      }
    }
    log.debug("Fetch took " + (System.currentTimeMillis() - t) + " ms");
  }

  private DataEntityQueryService createSetQueryService(Map<String, String> parameters,
      boolean forCountOperation) {
    final String entityName = parameters.get(JsonConstants.ENTITYNAME);
    final String startRowStr = parameters.get(JsonConstants.STARTROW_PARAMETER);
    final String endRowStr = parameters.get(JsonConstants.ENDROW_PARAMETER);

    final DataEntityQueryService queryService = OBProvider.getInstance().get(
        DataEntityQueryService.class);
    queryService.setEntityName(entityName);

    if (parameters.containsKey(JsonConstants.USE_ALIAS)) {
      queryService.setUseAlias();
    }
    boolean directNavigation = parameters.containsKey("_directNavigation")
        && "true".equals(parameters.get("_directNavigation"))
        && parameters.containsKey(JsonConstants.TARGETRECORDID_PARAMETER);

    if (!directNavigation) {
      // set the where/org filter parameters and the @ parameters
      for (String key : parameters.keySet()) {
        if (key.equals(JsonConstants.WHERE_PARAMETER)
            || key.equals(JsonConstants.IDENTIFIER)
            || key.equals(JsonConstants.ORG_PARAMETER)
            || key.equals(JsonConstants.TARGETRECORDID_PARAMETER)
            || (key.startsWith(DataEntityQueryService.PARAM_DELIMITER) && key
                .endsWith(DataEntityQueryService.PARAM_DELIMITER))) {
          queryService.addFilterParameter(key, parameters.get(key));
        }

      }
    }
    queryService.setCriteria(JsonUtils.buildCriteria(parameters));

    if (parameters.get(JsonConstants.NO_ACTIVE_FILTER) != null
        && parameters.get(JsonConstants.NO_ACTIVE_FILTER).equals("true")) {
      queryService.setFilterOnActive(false);
    }

    if (parameters.containsKey(JsonConstants.TEXTMATCH_PARAMETER_OVERRIDE)) {
      queryService.setTextMatching(parameters.get(JsonConstants.TEXTMATCH_PARAMETER_OVERRIDE));
    } else {
      queryService.setTextMatching(parameters.get(JsonConstants.TEXTMATCH_PARAMETER));
    }

    // only do the count if a paging request is done
    // note preventCountOperation variable is considered further below
    int startRow = 0;
    int computedMaxResults = Integer.MAX_VALUE;
    if (startRowStr != null) {
      startRow = Integer.parseInt(startRowStr);
      queryService.setFirstResult(startRow);
    }

    if (endRowStr != null) {
      int endRow = Integer.parseInt(endRowStr);
      computedMaxResults = endRow - startRow + 1;
      queryService.setMaxResults(computedMaxResults);
    }

    final String sortBy = parameters.get(JsonConstants.SORTBY_PARAMETER);
    String orderBy = "";
    if (sortBy != null) {
      orderBy = sortBy;
    } else if (parameters.get(JsonConstants.ORDERBY_PARAMETER) != null) {
      orderBy = parameters.get(JsonConstants.ORDERBY_PARAMETER);
    }

    if (parameters.get(JsonConstants.SUMMARY_PARAMETER) != null
        && parameters.get(JsonConstants.SUMMARY_PARAMETER).trim().length() > 0) {
      queryService.setSummarySettings(parameters.get(JsonConstants.SUMMARY_PARAMETER));
    } else if (parameters.get(JsonConstants.DISTINCT_PARAMETER) != null
        && parameters.get(JsonConstants.DISTINCT_PARAMETER).trim().length() > 0) {
      queryService.setDistinct(parameters.get(JsonConstants.DISTINCT_PARAMETER).trim());
      // sortby the distinct's identifier
      orderBy = queryService.getDistinct() + DalUtil.DOT + JsonConstants.IDENTIFIER + ","
          + queryService.getDistinct() + DalUtil.DOT + JsonConstants.ID;
    } else {
      // Always append id to the orderby to make a predictable sorting
      orderBy += (orderBy.isEmpty() ? "" : ",") + "id";
    }

    queryService.setOrderBy(orderBy);

    // compute a new startrow if the targetrecordid was passed in
    int targetRowNumber = -1;
    if (!forCountOperation && !directNavigation
        && parameters.containsKey(JsonConstants.TARGETRECORDID_PARAMETER)) {
      final String targetRecordId = parameters.get(JsonConstants.TARGETRECORDID_PARAMETER);
      targetRowNumber = queryService.getRowNumber(targetRecordId);
      if (targetRowNumber != -1) {
        startRow = targetRowNumber;
        // if the startrow is really low, then just read from 0
        // to make sure that we have a full page of data to display
        if (startRow < (computedMaxResults / 2)) {
          startRow = 0;
        } else {
          startRow -= 20;
        }
        queryService.setFirstResult(startRow);
      }
      queryService.clearCachedValues();
    }
    if (!forCountOperation) {
      queryService.setAdditionalProperties(JsonUtils.getAdditionalProperties(parameters));
      // joining associated entities actually proved to be slower than doing
      // individual queries for them... so disabling this functionality for now
      // queryService.setJoinAssociatedEntities(true);
    }
    return queryService;
  }

  private void addWritableAttribute(List<JSONObject> jsonObjects) throws JSONException {
    for (JSONObject jsonObject : jsonObjects) {
      if (!jsonObject.has("client") || !jsonObject.has("organization")) {
        continue;
      }
      final Object rowClient = jsonObject.get("client");
      final Object rowOrganization = jsonObject.get("organization");
      if (!(rowClient instanceof String) || !(rowOrganization instanceof String)) {
        continue;
      }
      final String currentClientId = OBContext.getOBContext().getCurrentClient().getId();
      if (!rowClient.equals(currentClientId)) {
        jsonObject.put("_readOnly", true);
      } else {
        boolean writable = false;
        for (String orgId : OBContext.getOBContext().getWritableOrganizations()) {
          if (orgId.equals(rowOrganization)) {
            writable = true;
            break;
          }
        }
        if (!writable) {
          jsonObject.put("_readOnly", true);
        }
      }
    }
  }

  /*
   * (non-Javadoc)
   * 
   * @see org.openbravo.service.json.JsonDataService#remove(java.util.Map)
   */
  public String remove(Map<String, String> parameters) {
    final String id = parameters.get(JsonConstants.ID);
    if (id == null) {
      return JsonUtils.convertExceptionToJson(new IllegalStateException("No id parameter"));
    }
    final String entityName = parameters.get(JsonConstants.ENTITYNAME);
    if (entityName == null) {
      return JsonUtils.convertExceptionToJson(new IllegalStateException("No entityName parameter"));
    }
    BaseOBObject bob = OBDal.getInstance().get(entityName, id);
    if (bob != null) {

      try {
        // create the result info before deleting to prevent Hibernate errors
        final DataToJsonConverter toJsonConverter = OBProvider.getInstance().get(
            DataToJsonConverter.class);
        final List<JSONObject> jsonObjects = toJsonConverter.toJsonObjects(Collections
            .singletonList(bob));
        final JSONObject jsonResult = new JSONObject();
        final JSONObject jsonResponse = new JSONObject();
        jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
        jsonResponse.put(JsonConstants.RESPONSE_DATA, new JSONArray(jsonObjects));
        jsonResult.put(JsonConstants.RESPONSE_RESPONSE, jsonResponse);
        OBDal.getInstance().commitAndClose();

        // now do the real delete in a separate transaction
        // to prevent side effects that a child can not be deleted
        // from its parent
        // https://issues.openbravo.com/view.php?id=21229
        bob = OBDal.getInstance().get(entityName, id);
        OBDal.getInstance().remove(bob);
        OBDal.getInstance().commitAndClose();

        return jsonResult.toString();
      } catch (Throwable t) {
        return JsonUtils.convertExceptionToJson(t);
      }
    } else {
      return JsonUtils.convertExceptionToJson(new IllegalStateException("Object not found"));
    }
  }

  /*
   * (non-Javadoc)
   * 
   * @see org.openbravo.service.json.JsonDataService#add(java.util.Map, java.lang.String)
   */
  public String add(Map<String, String> parameters, String content) {
    return update(parameters, content);
  }

  /*
   * (non-Javadoc)
   * 
   * @see org.openbravo.service.json.JsonDataService#update(java.util.Map, java.lang.String)
   */
  public String update(Map<String, String> parameters, String content) {
    try {
      final boolean sendOriginalIdBack = "true".equals(parameters
          .get(JsonConstants.SEND_ORIGINAL_ID_BACK));

      final JsonToDataConverter fromJsonConverter = OBProvider.getInstance().get(
          JsonToDataConverter.class);

      final Object jsonContent = getContentAsJSON(content);
      final List<BaseOBObject> bobs;
      final List<JSONObject> originalData = new ArrayList<JSONObject>();
      if (jsonContent instanceof JSONArray) {
        bobs = fromJsonConverter.toBaseOBObjects((JSONArray) jsonContent);
        final JSONArray jsonArray = (JSONArray) jsonContent;
        for (int i = 0; i < jsonArray.length(); i++) {
          originalData.add(jsonArray.getJSONObject(i));
        }
      } else {
        final JSONObject jsonObject = (JSONObject) jsonContent;
        originalData.add(jsonObject);
        // now set the id and entityname from the parameters if it was set
        if (!jsonObject.has(JsonConstants.ID) && parameters.containsKey(JsonConstants.ID)) {
          jsonObject.put(JsonConstants.ID, parameters.containsKey(JsonConstants.ID));
        }
        if (!jsonObject.has(JsonConstants.ENTITYNAME)
            && parameters.containsKey(JsonConstants.ENTITYNAME)) {
          jsonObject.put(JsonConstants.ENTITYNAME, parameters.get(JsonConstants.ENTITYNAME));
        }

        bobs = Collections
            .singletonList(fromJsonConverter.toBaseOBObject((JSONObject) jsonContent));
      }

      if (fromJsonConverter.hasErrors()) {
        OBDal.getInstance().rollbackAndClose();
        // report the errors
        final JSONObject jsonResult = new JSONObject();
        final JSONObject jsonResponse = new JSONObject();
        jsonResponse.put(JsonConstants.RESPONSE_STATUS,
            JsonConstants.RPCREQUEST_STATUS_VALIDATION_ERROR);
        final JSONObject errorsObject = new JSONObject();
        for (JsonConversionError error : fromJsonConverter.getErrors()) {
          errorsObject.put(error.getProperty().getName(), error.getThrowable().getMessage());
        }
        jsonResponse.put(JsonConstants.RESPONSE_ERRORS, errorsObject);
        jsonResult.put(JsonConstants.RESPONSE_RESPONSE, jsonResponse);
        return jsonResult.toString();
      } else {
        for (BaseOBObject bob : bobs) {
          OBDal.getInstance().save(bob);
        }
        OBDal.getInstance().flush();

        // refresh the objects from the db as they can have changed
        for (BaseOBObject bob : bobs) {
          OBDal.getInstance().getSession().refresh(bob);
        }

        // almost successfull, now create the response
        // needs to be done before the close of the session
        final DataToJsonConverter toJsonConverter = OBProvider.getInstance().get(
            DataToJsonConverter.class);
        toJsonConverter.setAdditionalProperties(JsonUtils.getAdditionalProperties(parameters));
        final List<JSONObject> jsonObjects = toJsonConverter.toJsonObjects(bobs);

        if (sendOriginalIdBack) {
          // now it is assumed that the jsonObjects are the same size and the same location
          // in the array
          if (jsonObjects.size() != originalData.size()) {
            throw new OBException("Unequal sizes in json data processed " + jsonObjects.size()
                + " " + originalData.size());
          }

          // now add the old id back
          for (int i = 0; i < originalData.size(); i++) {
            final JSONObject original = originalData.get(i);
            final JSONObject ret = jsonObjects.get(i);
            if (original.has(JsonConstants.ID) && original.has(JsonConstants.NEW_INDICATOR)) {
              ret.put(JsonConstants.ORIGINAL_ID, original.get(JsonConstants.ID));
            }
          }
        }
        OBDal.getInstance().commitAndClose();

        final JSONObject jsonResult = new JSONObject();
        final JSONObject jsonResponse = new JSONObject();
        jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
        jsonResponse.put(JsonConstants.RESPONSE_DATA, new JSONArray(jsonObjects));
        jsonResult.put(JsonConstants.RESPONSE_RESPONSE, jsonResponse);
        return jsonResult.toString();
      }
    } catch (Exception e) {
      log.error(e.getMessage(), e);
      return JsonUtils.convertExceptionToJson(e);
    }

  }

  private Object getContentAsJSON(String content) throws JSONException {
    Check.isNotNull(content, "Content must be set");
    final Object jsonRepresentation;
    if (content.trim().startsWith("[")) {
      jsonRepresentation = new JSONArray(content);
    } else {
      final JSONObject jsonObject = new JSONObject(content);
      jsonRepresentation = jsonObject.get(JsonConstants.DATA);
    }
    return jsonRepresentation;
  }

  public static abstract class QueryResultWriter {
    public abstract void write(JSONObject json);
  }
}
