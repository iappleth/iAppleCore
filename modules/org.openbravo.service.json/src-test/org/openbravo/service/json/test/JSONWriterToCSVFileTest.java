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
 * All portions are Copyright (C) 2022 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.service.json.test;

import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.MatcherAssert.assertThat;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.service.json.DataResolvingMode;
import org.openbravo.service.json.DataToJsonConverter;
import org.openbravo.service.json.JSONWriterToCSVFile;
import org.openbravo.service.json.JsonConstants;
import org.openbravo.service.json.JsonUtils;
import org.openbravo.test.base.OBBaseTest;
import org.openbravo.test.base.mock.HttpServletRequestMock;

/**
 * Tests the {@link JSONWriterToCSVFile} class
 */

public class JSONWriterToCSVFileTest extends OBBaseTest {

  private Path tmpFileAbsolutePath;

  @Before
  public void initialize() {
    setTestUserContext();
    RequestContext.get().setRequest(new HttpServletRequestMock());
    RequestContext.get().setSessionAttribute("#DecimalSeparator|generalQtyEdition", ".");
  }

  @After
  public void cleanUp() throws IOException {
    if (tmpFileAbsolutePath != null && Files.exists(tmpFileAbsolutePath)) {
      Files.delete(tmpFileAbsolutePath);
    }
  }

  @Test
  public void writeJsonObjectWithCustomFields() throws JSONException, IOException {
    final HttpServletRequest request = RequestContext.get().getRequest();
    final Map<String, String> params = getRequestParameters();

    final DataToJsonConverter toJsonConverter = OBProvider.getInstance()
        .get(DataToJsonConverter.class);
    toJsonConverter.setAdditionalProperties(JsonUtils.getAdditionalProperties(params));
    toJsonConverter.setSelectedProperties(params.get(JsonConstants.SELECTEDPROPERTIES_PARAMETER));
    Entity entity = ModelProvider.getInstance()
        .getEntity(params.get(JsonConstants.DATASOURCE_NAME), false);
    JSONWriterToCSVFile writer = new JSONWriterToCSVFile(request, params, entity);

    Organization org = OBDal.getInstance().get(Organization.class, TEST_ORG_ID);
    final JSONObject json = toJsonConverter.toJsonObject(org, DataResolvingMode.FULL);
    json.put("Custom Field 1", "Test 1");
    json.put("Custom Field 2", "Test 2");

    writer.write(json);
    File file = writer.finishAndCreateCSVFile(params);

    tmpFileAbsolutePath = Paths.get(file.getAbsolutePath());

    final String fileContent = Files.readString(tmpFileAbsolutePath);

    assertThat("Expected content of the CSV file", fileContent, equalTo(getExpectedResult(org)));
  }

  private Map<String, String> getRequestParameters() {
    Map<String, String> params = new HashMap<>();
    params.put(JsonConstants.UTCOFFSETMILISECONDS_PARAMETER, "7200000");
    params.put(JsonConstants.DATASOURCE_NAME, "Organization");
    params.put(JsonConstants.SELECTEDPROPERTIES_PARAMETER, "searchKey,name");
    params.put(JsonConstants.FIELDNAMES_PARAMETER,
        new JSONArray().put("searchKey")
            .put("name")
            .put("Custom Field 1")
            .put("Custom Field 2")
            .toString());
    return params;
  }

  private String getExpectedResult(Organization org) {
    return "\"Search Key\",\"Name\",\"Custom Field 1\",\"Custom Field 2\"\n" + "\""
        + org.getSearchKey() + "\",\"" + org.getName() + "\",\"Test 1\",\"Test 2\"";
  }

}
