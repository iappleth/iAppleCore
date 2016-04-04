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
 * All portions are Copyright (C) 2015 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.test.datasource;

import static org.hamcrest.Matchers.is;
import static org.junit.Assert.assertThat;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized;
import org.junit.runners.Parameterized.Parameters;
import org.openbravo.service.json.JsonConstants;

/**
 * This test evaluates if some expected values are get when a filter is applied and if some
 * unexpected values are not get when the filter is applied, but are get when the filter is removed.
 *
 * 
 * @author Naroa Iriarte
 * 
 */
@RunWith(Parameterized.class)
public class DataSourceWhereParameterTest extends BaseDataSourceTestDal {
  // Expected

  private static final String USER_EXPECTED_VALUE = "A530AAE22C864702B7E1C22D58E7B17B";
  private static final String ALERT_EXPECTED_VALUE = "D0CB68A7ADDD462E8B46438E2B9F58F6";
  private static final String CUSTOM_QUERY_SELECTOR_EXPECTED_VALUE = "C0D9FAD1047343BAA53AF6F60D572DD0";
  private static final String PRODUCT_SELECTOR_DATASOURCE_EXPECTED_VALUE = "B2D40D8A5D644DD89E329DC29730905541732EFCA6374148BFD8B08C8B12DB73";

  // Unexpected

  private static final String USER_UNEXPECTED_VALUE = "6A3D3D6A808C455EAF1DAB48058FDBF4";
  private static final String ALERT_UNEXPECTED_VALUE = "D938304218B6405F8B2665D5E77A3EE4";
  private static final String CUSTOM_QUERY_SELECTOR_UNEXPECTED_VALUE = "369"; // The "<" symbol
  private static final String PRODUCT_SELECTOR_DATASOURCE_UNEXPECTED_VALUE = "3DBB480253094C99A4408923F69806D7"; // Electricity

  private static final String TABLE_ID = "105";
  private static final String RECORD_ID = "283";
  private static final String MANUAL_WHERE = "1=1) or 2=2";

  private DataSource datasource;

  @SuppressWarnings("serial")
  private enum DataSource {
    User("ADUser", USER_EXPECTED_VALUE, USER_UNEXPECTED_VALUE, false,
        new HashMap<String, String>() {
          {
            put("isImplicitFilterApplied", "true");
            put("windowId", "108");
            put("tabId", "118");
            put("_noActiveFilter", "true");
            put("_startRow", "0");
            put("_endRow", "100");
          }
        }), //
    QuickLaunch("99B9CC42FDEA4CA7A4EE35BC49D61E0E", null, null, true,
        new HashMap<String, String>() {
          {
            put("_startRow", "0");
            put("_endRow", "50");
          }
        }), //

    QuickCreate("C17951F970E942FD9F3771B7BE91D049", null, null, true,
        new HashMap<String, String>() {
          {
            put("_startRow", "0");
            put("_endRow", "50");
          }
        }), //

    Alert("DB9F062472294F12A0291A7BD203F922", ALERT_EXPECTED_VALUE, ALERT_UNEXPECTED_VALUE, false,
        new HashMap<String, String>() {
          {
            put("_alertStatus", "New");
            put("_startRow", "0");
            put("_endRow", "50");
          }
        }), //
    ActionRegardingSelector("ADList", CUSTOM_QUERY_SELECTOR_EXPECTED_VALUE,
        CUSTOM_QUERY_SELECTOR_UNEXPECTED_VALUE, false, new HashMap<String, String>() {
          {
            put("fin_paymentmethod_id", "47506D4260BA4996B92768FF609E6665");
            put("fin_financial_account_id", "C2AA9C0AFB434FD4B827BE58DC52C1E2");
            put("issotrx", "true");
            put("_selectorDefinitionId", "41B3A5EA61AB46FBAF4567E3755BA190");
            put("filterClass", "org.openbravo.userinterface.selector.SelectorDataSourceFilter");
            put("_selectorFieldId", "52BD390363394BE980D0A55AFC4CDBB9");
            put("_startRow", "0");
            put("_endRow", "75");
          }
        }), //

    ProductSelectorDataSource("ProductByPriceAndWarehouse",
        PRODUCT_SELECTOR_DATASOURCE_EXPECTED_VALUE, PRODUCT_SELECTOR_DATASOURCE_UNEXPECTED_VALUE,
        false, new HashMap<String, String>() {
          {
            put("_org", "E443A31992CB4635AFCAEABE7183CE85");
            put("_startRow", "0");
            put("_endRow", "75");
          }
        }), //

    Note("090A37D22E61FE94012E621729090048", null, null, true, new HashMap<String, String>() {
      {
        // Note of a record in Windows, Tabs and Fields.
        String criteria = "{\"fieldName\":\"table\",\"operator\":\"equals\",\"value\":\""
            + TABLE_ID + "\"}__;__{\"fieldName\":\"record\",\"operator\":\"equals\",\"value\":\""
            + RECORD_ID + "\"}";
        String entityName = "OBUIAPP_Note";
        put("criteria", criteria);
        put("_entityName", entityName);
        put("_startRow", "0");
        put("_endRow", "50");
      }
    });

    private String ds;
    private String expected;
    private String unexpected;
    private boolean onlySuccessAssert;
    private Map<String, String> params;

    private DataSource(String ds, String expected, String unexpected, boolean onlySuccessAssert) {
      this.ds = ds;
      this.expected = expected;
      this.unexpected = unexpected;
      this.onlySuccessAssert = onlySuccessAssert;
      params = new HashMap<String, String>();
      params.put("_operationType", "fetch");
    }

    private DataSource(String ds, String expected, String unexpected, boolean onlySuccessAssert,
        Map<String, String> extraParams) {
      this(ds, expected, unexpected, onlySuccessAssert);
      params.putAll(extraParams);
    }
  }

  public DataSourceWhereParameterTest(DataSource datasource, String expectedRecords,
      String notExpectedRecords) {
    this.datasource = datasource;
  }

  @Parameters(name = "{0} datasource: {1}")
  public static Collection<Object[]> parameters() {
    List<Object[]> tests = new ArrayList<Object[]>();
    for (DataSource t : DataSource.values()) {
      tests.add(new Object[] { t, t.expected, t.unexpected });
    }

    return tests;
  }

  @Test
  public void datasourceWithNoManualWhereParameter() throws Exception {
    boolean expectedRecordId;
    boolean unexpectedRecordId;
    if (!datasource.onlySuccessAssert) {
      if ("3C1148C0AB604DE1B51B7EA4112C325F".equals(datasource.ds)
          || "ADUser".equals(datasource.ds)) {
        datasource.params.put("isImplicitFilterApplied", "true");
        String datasourceResponseFilterTrue = getDataSourceResponse();
        expectedRecordId = isValueInTheResponseData(datasource.expected,
            datasourceResponseFilterTrue);
        unexpectedRecordId = isValueInTheResponseData(datasource.unexpected,
            datasourceResponseFilterTrue);
        assertThat(expectedRecordId, is(true));
        assertThat(unexpectedRecordId, is(false));
        datasource.params.put("isImplicitFilterApplied", "false");
        String datasourceResponseFilterFalse = getDataSourceResponse();
        expectedRecordId = isValueInTheResponseData(datasource.expected,
            datasourceResponseFilterFalse);
        unexpectedRecordId = isValueInTheResponseData(datasource.unexpected,
            datasourceResponseFilterFalse);
        assertThat(expectedRecordId, is(true));
        assertThat(unexpectedRecordId, is(true));
      } else {
        String datasourceResponseNoFilter = getDataSourceResponse();
        expectedRecordId = isValueInTheResponseData(datasource.expected, datasourceResponseNoFilter);
        unexpectedRecordId = isValueInTheResponseData(datasource.unexpected,
            datasourceResponseNoFilter);
        assertThat(expectedRecordId, is(true));
        assertThat(unexpectedRecordId, is(false));
      }
    }
  }

  @Test
  public void datasourceWithManualWhereParameter() throws Exception {
    if (!datasource.onlySuccessAssert && !"DB9F062472294F12A0291A7BD203F922".equals(datasource.ds)) {
      datasource.params.put("isImplicitFilterApplied", "true");
      datasource.params.put("_where", MANUAL_WHERE);
      String datasourceResponseWhereTrue = getDataSourceResponse();
      JSONObject jsonResponse = new JSONObject(datasourceResponseWhereTrue);
      assertThat(getStatus(jsonResponse),
          is(String.valueOf(JsonConstants.RPCREQUEST_STATUS_VALIDATION_ERROR)));
      datasource.params.remove(JsonConstants.WHERE_PARAMETER);
    }
  }

  @Test
  public void datasourceRequestStatusShouldBeSuccessful() throws Exception {
    if (datasource.params.containsKey(JsonConstants.WHERE_PARAMETER)) {
      datasource.params.remove(JsonConstants.WHERE_PARAMETER);
    }
    String datasourceResponse = getDataSourceResponse();
    JSONObject jsonResponse = new JSONObject(datasourceResponse);
    assertThat(getStatus(jsonResponse), is(String.valueOf(JsonConstants.RPCREQUEST_STATUS_SUCCESS)));
  }

  private boolean isValueInTheResponseData(String valueId, String dataSourceResponse)
      throws Exception {
    JSONObject dataSourceResponseMid = new JSONObject();
    JSONArray dataSourceData = new JSONArray();
    boolean existsValue = false;
    JSONObject jsonResponse = new JSONObject(dataSourceResponse);
    dataSourceResponseMid = jsonResponse.getJSONObject("response");
    dataSourceData = dataSourceResponseMid.getJSONArray("data");
    String dataSourceDataString = dataSourceData.toString();
    if (dataSourceDataString.contains(valueId)) {
      existsValue = true;
    } else {
      existsValue = false;
    }
    return existsValue;
  }

  private String getDataSourceResponse() throws Exception {
    String response = doRequest("/org.openbravo.service.datasource/" + datasource.ds,
        datasource.params, 200, "POST");
    return response;
  }

  private String getStatus(JSONObject jsonResponse) throws JSONException {
    return jsonResponse.getJSONObject("response").get("status").toString();
  }
}
