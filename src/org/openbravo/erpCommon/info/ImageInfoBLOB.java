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
 * All portions are Copyright (C) 2009-2021 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.erpCommon.info;

import java.io.IOException;
import java.io.PrintWriter;

import javax.inject.Inject;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang.StringEscapeUtils;
import org.apache.commons.lang.StringUtils;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.client.application.window.ApplicationDictionaryCachedStructures;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.ImageResizeResult;
import org.openbravo.erpCommon.utility.UnsupportedFileFormatException;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.utility.Image;
import org.openbravo.model.common.enterprise.Organization;

/**
 * Image upload process. This class is in charge of storing image files in AD_IMAGE table for
 * columns with reference ImageBLOB. This class also checks the mime type of the file uploaded to
 * verify only supported images are uploaded and also resizes the image following the column
 * configuration options.
 * 
 * @author Openbravo
 */

public class ImageInfoBLOB extends HttpSecureAppServlet {

  private static final long serialVersionUID = 1L;

  @Inject
  private ApplicationDictionaryCachedStructures adcs;

  @Override
  public void init(ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response)
      throws IOException, ServletException {

    VariablesSecureApp vars = new VariablesSecureApp(request);

    if (vars.getCommand().startsWith("SAVE_OB3")) {
      String selectorId = vars.getStringParameter("inpSelectorId");
      OBContext.setAdminMode(true);
      try {
        checkRecordAccess(vars.getStringParameter("inpTabId"));

        byte[] bytea = vars.getMultiFile("inpFile").get();
        String imageSizeAction = vars.getStringParameter("imageSizeAction");
        String paramWidth = vars.getStringParameter("imageWidthValue");
        String paramHeight = vars.getStringParameter("imageHeightValue");

        ImageResizeResult result = Utility.applyImageSizeAction(imageSizeAction, bytea,
            toInt(paramWidth), toInt(paramHeight));

        Image image = saveImage(result.getImageData(), vars.getStringParameter("inpadOrgId"),
            result.getMimeType(), result.getNewSize());

        writeRedirectOB3(response, selectorId, image.getId(),
            result.isSizeActionApplied() ? "N" : imageSizeAction, result.getOldSize(),
            result.getNewSize(), null);
      } catch (UnsupportedFileFormatException ex) {
        log4j.error("Error resizing image", ex);
        writeRedirectOB3(response, selectorId, "", "WRONGFORMAT", new Long[] { 0L, 0L },
            new Long[] { 0L, 0L }, null);
      } catch (Exception ex) {
        log4j.error("Error uploading image", ex);
        writeRedirectOB3(response, selectorId, "", "ERROR_UPLOADING", new Long[] { 0L, 0L },
            new Long[] { 0L, 0L }, ex.getMessage());
      } finally {
        OBContext.restorePreviousMode();
      }
    } else {
      pageError(response);
    }
  }

  private void checkRecordAccess(String tabId) {
    String tableId = adcs.getTab(tabId).getTable().getId();
    Entity entity = ModelProvider.getInstance().getEntityByTableId(tableId);
    OBContext.getOBContext().getEntityAccessChecker().checkWritableAccess(entity);
  }

  private int toInt(String strParam) {
    return strParam == null || strParam.isEmpty() ? 0 : Integer.parseInt(strParam);
  }

  private Image saveImage(byte[] bytea, String orgId, String mimeType, Long[] sizeNew) {
    // Using DAL to write the image data to the database
    Image image = OBProvider.getInstance().get(Image.class);
    Organization org = OBDal.getInstance().getProxy(Organization.class, orgId);
    image.setOrganization(org);
    image.setBindaryData(bytea);
    image.setActive(true);
    image.setName("Image");
    image.setWidth(sizeNew[0]);
    image.setHeight(sizeNew[1]);
    image.setMimetype(mimeType);
    OBDal.getInstance().save(image);
    OBDal.getInstance().flush();
    return image;
  }

  private void writeRedirectOB3(HttpServletResponse response, String selectorId, String imageId,
      String imageSizeAction, Long[] sizeOld, Long[] sizeNew, String msg) throws IOException {
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter writer = response.getWriter();

    writer.write("<HTML><BODY><script type=\"text/javascript\">");
    writer.write("var selector = top." + selectorId + " || parent." + selectorId + ";\n");
    writer.write("selector.callback('" + imageId + "', '" + imageSizeAction + "', '" + sizeOld[0]
        + "' ,'" + sizeOld[1] + "' ,'" + sizeNew[0] + "' ,'" + sizeNew[1] + "'");

    if (StringUtils.isNotEmpty(msg)) {
      writer.write(", '" + StringEscapeUtils.escapeJavaScript(msg) + "'");
    }

    writer.write(");");
    writer.write("</SCRIPT></BODY></HTML>");
  }
}
