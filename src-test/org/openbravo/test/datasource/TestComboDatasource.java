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
 * All portions are Copyright (C) 2014 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.test.datasource;

/**
 * Test cases for ComboTableDatasourceService
 * 
 * @author Shankar Balachandran 
 */

import java.util.HashMap;
import java.util.Map;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.service.json.JsonConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TestComboDatasource extends BaseDataSourceTestNoDal {

  private static final Logger log = LoggerFactory.getLogger(TestComboDatasource.class);

  /**
   * Test to fetch values from ComboTableDatasoureService using set parameters. Based on field
   * information and current context, the field values are returned as jsonObject. The test case
   * asserts whether there is a valid response.
   * 
   * @throws Exception
   */
  public void testFetchComboTableDatasourceValues() throws Exception {
    // Using values of window dropdown in preference window
    Map<String, String> params = new HashMap<String, String>();
    params.put("fieldId", "876");
    params.put("columnValue", "1757");
    params.put("_operationType", "fetch");

    JSONObject jsonResponse = requestCombo(params);
    JSONArray data = getData(jsonResponse);
    assertTrue(getStatus(jsonResponse).equals(
        String.valueOf(JsonConstants.RPCREQUEST_STATUS_SUCCESS)));
    assertTrue("non paginated combo for window table dir should have more than 100 records",
        data.length() > 100);
  }

  /**
   * Test to fetch paginated values from ComboTableDatasoureService
   * 
   * @throws Exception
   */
  public void testPaginatedFetch() throws Exception {
    // Using values of window dropdown in preference window
    Map<String, String> params = new HashMap<String, String>();
    params.put("fieldId", "876");
    params.put("columnValue", "1757");
    params.put("_operationType", "fetch");
    params.put("_startRow", "20");
    params.put("_endRow", "40");

    JSONObject jsonResponse = requestCombo(params);
    JSONArray data = getData(jsonResponse);
    assertTrue(getStatus(jsonResponse).equals(
        String.valueOf(JsonConstants.RPCREQUEST_STATUS_SUCCESS)));
    assertEquals("paginated combo number of records", 22, data.length());
  }

  /**
   * Test to fetch a single combo value from ComboTableDatasoureService using set parameters. Based
   * on field information, recordId and current context, the field values are returned as
   * jsonObject. The test case asserts whether there is a valid response.
   * 
   * @throws Exception
   */
  public void testSingleRecordFetch() throws Exception {
    // Using values of visible at user in preference
    Map<String, String> params = new HashMap<String, String>();
    params.put("fieldId", "927D156048246E92E040A8C0CF071D3D");
    params.put("columnValue", "927D156047B06E92E040A8C0CF071D3D");
    params.put("_operationType", "fetch");
    // try to fetch F&B Admin user
    params.put("@ONLY_ONE_RECORD@", "A530AAE22C864702B7E1C22D58E7B17B");
    params.put("@ACTUAL_VALUE@", "A530AAE22C864702B7E1C22D58E7B17B");

    JSONObject jsonResponse = requestCombo(params);
    JSONArray data = getData(jsonResponse);

    // 2 records: real + empty
    assertEquals("number of records", 2, data.length());

    JSONObject record = data.getJSONObject(1);
    assertTrue(getStatus(jsonResponse).equals(
        String.valueOf(JsonConstants.RPCREQUEST_STATUS_SUCCESS)));
    assertEquals("record id", "A530AAE22C864702B7E1C22D58E7B17B", record.getString("id"));
    assertEquals("record identifier", "F&BAdmin", record.get("_identifier"));
  }

  /**
   * Test to check limits are not applied when single record is fetched.
   * 
   * @throws Exception
   */
  public void testSingleRecordFetchWithLimits() throws Exception {
    // Using values of visible at user in preference
    Map<String, String> params = new HashMap<String, String>();
    params.put("fieldId", "927D156048246E92E040A8C0CF071D3D");
    params.put("columnValue", "927D156047B06E92E040A8C0CF071D3D");
    params.put("_operationType", "fetch");
    // try to fetch F&B Admin user
    params.put("@ONLY_ONE_RECORD@", "A530AAE22C864702B7E1C22D58E7B17B");
    params.put("@ACTUAL_VALUE@", "A530AAE22C864702B7E1C22D58E7B17B");
    params.put("_startRow", "1");
    params.put("_endRow", "2");

    JSONObject jsonResponse = requestCombo(params);
    JSONArray data = getData(jsonResponse);

    // 2 records: real + empty
    assertEquals("number of records", 2, data.length());

    JSONObject record = data.getJSONObject(1);
    assertTrue(getStatus(jsonResponse).equals(
        String.valueOf(JsonConstants.RPCREQUEST_STATUS_SUCCESS)));
    assertEquals("record id", "A530AAE22C864702B7E1C22D58E7B17B", record.getString("id"));
    assertEquals("record identifier", "F&BAdmin", record.get("_identifier"));
  }

  /**
   * Test to check filtering of the record using passed parameter
   * 
   * @throws Exception
   */
  public void testFilter() throws Exception {
    // Using values of visible at user in preference
    Map<String, String> params = new HashMap<String, String>();
    params.put("fieldId", "927D156048246E92E040A8C0CF071D3D");
    params.put("columnValue", "927D156047B06E92E040A8C0CF071D3D");
    params.put("_operationType", "fetch");
    // try to filter by string 'Jo'
    params.put("_identifier", "Jo");

    JSONObject jsonResponse = requestCombo(params);
    JSONArray data = getData(jsonResponse);
    assertTrue(getStatus(jsonResponse).equals(
        String.valueOf(JsonConstants.RPCREQUEST_STATUS_SUCCESS)));
    assertEquals("number of filtered records", 4, data.length());
  }

  /**
   * Test to check filtering of the record using passed parameter and return paginated results
   * 
   * @throws Exception
   */
  public void testFilterWithPagination() throws Exception {
    // Using values of visible at user in preference
    Map<String, String> params = new HashMap<String, String>();
    params.put("fieldId", "927D156048246E92E040A8C0CF071D3D");
    params.put("columnValue", "927D156047B06E92E040A8C0CF071D3D");
    params.put("_operationType", "fetch");
    // try to filter by string 'Jo'
    params.put("_identifier", "Jo");
    params.put("_startRow", "0");
    params.put("_endRow", "1");

    JSONObject jsonResponse = requestCombo(params);
    JSONArray data = getData(jsonResponse);
    assertTrue(getStatus(jsonResponse).equals(
        String.valueOf(JsonConstants.RPCREQUEST_STATUS_SUCCESS)));
    assertEquals("number of filtered records", 3, data.length());
  }

  /**
   * Test to check whether data is accessible to unauthorized user.
   * 
   * @throws Exception
   */
  public void testAccess() throws Exception {
    // Using values of window dropdown in menu
    Map<String, String> params = new HashMap<String, String>();
    params.put("fieldId", "206");
    params.put("columnValue", "233");
    params.put("_operationType", "fetch");
    String response = doRequest("/org.openbravo.service.datasource/ComboTableDatasourceService",
        params, 200, "POST");
    JSONObject jsonResponse = new JSONObject(response);
    // error should be raised
    assertTrue(getStatus(jsonResponse).equals(
        String.valueOf(JsonConstants.RPCREQUEST_STATUS_VALIDATION_ERROR)));
  }

  /**
   * Test to check whether filter data is accessible to unauthorized user.
   * 
   * @throws Exception
   */
  public void testAccessForFilter() throws Exception {
    // Using values of window dropdown in menu
    Map<String, String> params = new HashMap<String, String>();
    params.put("fieldId", "206");
    params.put("columnValue", "233");
    params.put("_operationType", "fetch");
    // try to filter by string 'Me'
    params.put("_identifier", "Me");
    String response = doRequest("/org.openbravo.service.datasource/ComboTableDatasourceService",
        params, 200, "POST");
    JSONObject jsonResponse = new JSONObject(response);
    // error should be raised
    assertTrue(getStatus(jsonResponse).equals(
        String.valueOf(JsonConstants.RPCREQUEST_STATUS_VALIDATION_ERROR)));
  }

  private JSONObject requestCombo(Map<String, String> params) throws Exception {
    String response = doRequest("/org.openbravo.service.datasource/ComboTableDatasourceService",
        params, 200, "POST");
    JSONObject jsonResponse = new JSONObject(response);
    assertTrue(jsonResponse.toString() != null);

    if (log.isDebugEnabled() || true) {
      String paramStr = "";
      for (String paramKey : params.keySet()) {
        paramStr += paramStr.isEmpty() ? "" : ", ";
        paramStr += "{" + paramKey + ":" + params.get(paramKey) + "}";
      }
      paramStr = "[" + paramStr + "]";
      log.info("Combo request:\n  *params:{}\n  *response:{}", paramStr, jsonResponse);
    }
    assertTrue(getStatus(jsonResponse).equals(
        String.valueOf(JsonConstants.RPCREQUEST_STATUS_SUCCESS)));
    assertNotNull("Combo response shoulnd't be null", jsonResponse.toString());
    return jsonResponse;
  }

  /**
   * 
   * @param jsonResponse
   * @return data of the json response
   * @throws JSONException
   */
  private JSONArray getData(JSONObject jsonResponse) throws JSONException {
    JSONArray data = jsonResponse.getJSONObject("response").getJSONArray("data");
    return data;
  }

  /**
   * 
   * @param jsonResponse
   * @return status of the json response
   * @throws JSONException
   */
  private String getStatus(JSONObject jsonResponse) throws JSONException {
    return jsonResponse.getJSONObject("response").get("status").toString();
  }

}