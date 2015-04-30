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

package org.openbravo.client.application.window;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.codehaus.jettison.json.JSONArray;
import org.hibernate.criterion.Restrictions;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.structure.OrganizationEnabled;
import org.openbravo.client.kernel.ComponentProvider;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.security.SecurityChecker;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBDao;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.model.ad.datamodel.Table;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.ad.ui.Tab;
import org.openbravo.model.ad.utility.Attachment;
import org.openbravo.model.ad.utility.AttachmentConfig;
import org.openbravo.model.ad.utility.AttachmentMetadata;
import org.openbravo.model.ad.utility.AttachmentMethod;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.utils.FileUtility;

public class AttachImplementationManager {

  @Inject
  @Any
  private Instance<AttachImplementation> attachImplementationHandlers;

  /**
   * Method to upload files. This method calls needed handler class
   * 
   * @param strTab
   *          the tab Id where the attachment is done
   * @param strKey
   *          the recordId where the attachment is done
   * @param strDataType
   *          the datatype of the document that is attached
   * @param strDocumentOrganization
   *          the organization ID of the record where the attachment is done
   * @param strText
   *          the description of the attachment
   * @param parameters
   *          more metadata that will be saved in the attachment
   * @param file
   *          The file to be uploaded
   */
  public void upload(String strTab, String strKey, String strDataType,
      String strDocumentOrganization, Map<String, String> parameters, File file) throws OBException {
    Organization org = OBDal.getInstance().get(Organization.class, strDocumentOrganization);

    Tab tab = OBDal.getInstance().get(Tab.class, strTab);
    if (file == null) {
      throw new OBException(OBMessageUtils.messageBD("OBUIAPP_NoFileToAttach"));
    }

    AttachmentConfig attachConf = getAttachmenConfig(OBContext.getOBContext().getCurrentClient());
    AttachmentMethod attachMethod = attachConf.getAttachmentMethod();
    
    String strName = file.getName();

    Attachment attachment = null;
    try {
      OBContext.setAdminMode();
      attachment = getAttachment(tab.getTable(), strKey, strName);
      if (attachment == null) {
        attachment = OBProvider.getInstance().get(Attachment.class);
        attachment.setClient(OBContext.getOBContext().getCurrentClient());
        attachment.setSequenceNumber(getSequenceNumber(tab.getTable(), strKey));
        attachment.setName(strName);
        attachment.setTable(tab.getTable());
        attachment.setRecord(strKey);
      }
      attachment.setAttachmentConf(attachConf);
      attachment.setOrganization(org);
      attachment.setActive(true);

      OBDal.getInstance().save(attachment);

      AttachImplementation handler = getHandler(attachMethod== null ? "Default" : attachMethod.getValue());

      if (handler == null) {
        throw new OBException(OBMessageUtils.messageBD("OBUIAPP_NoMethod"));
      }
      handler.uploadFile(attachment, strDataType, parameters, file, strTab);
      OBDal.getInstance().flush();
    } finally {
      OBContext.restorePreviousMode();
    }

  }

  /**
   * Method to delete files. This method calls needed handler class
   * 
   * @param attachment
   *          the attachment that will be removed
   */
  public void delete(Attachment attachment) throws OBException {
    checkReadableAccess(attachment);
    AttachImplementation handler = getHandler(attachment.getAttachmentConf().getAttachmentMethod() == null ? "Default" : attachment.getAttachmentConf().getAttachmentMethod().getValue());
    if (handler == null) {
      throw new OBException(OBMessageUtils.messageBD("OBUIAPP_NoMethod"));
    }
    handler.deleteFile(attachment);
    OBDal.getInstance().remove(attachment);
    OBDal.getInstance().flush();
  }

  /**
   * Method to update file's metadata. This method calls needed handler class
   * 
   * @param attachID
   *          the attachmentID that will be updated
   * @param tabId
   *          the TabId where the attachment is being modified
   * @param description
   *          the new description to be updated
   * @param parameters
   *          more metadata to be updated
   */
  public void update(String attachID, String tabId, Map<String, String> parameters)
      throws OBException {
    try {
      OBContext.setAdminMode(true);

      Attachment attachment = OBDal.getInstance().get(Attachment.class, attachID);
      if (attachment == null) {
        throw new OBException(OBMessageUtils.messageBD("OBUIAPP_NoAttachmentFound"));
      }

      checkReadableAccess(attachment);

      AttachImplementation handler = getHandler(attachment.getAttachmentConf().getAttachmentMethod() == null ? "Default" : attachment.getAttachmentConf().getAttachmentMethod().getValue());

      if (handler == null) {
        throw new OBException(OBMessageUtils.messageBD("OBUIAPP_NoMethod"));
      }
      handler.updateFile(attachment, tabId, parameters);
      OBDal.getInstance().save(attachment);
      OBDal.getInstance().flush();
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  /**
   * Method to download a file. This method calls needed handler class
   * 
   * @param attachmentId
   *          the attachment Id that will be downloaded
   * @param os
   *          The output stream to dump the file
   */
  public void download(String attachmentId, OutputStream os) throws OBException {
    OBContext.setAdminMode();
    try {
      Attachment attachment = OBDal.getInstance().get(Attachment.class, attachmentId);

      if (attachment == null) {
        throw new OBException(OBMessageUtils.messageBD("OBUIAPP_NoAttachmentFound"));
      }

      checkReadableAccess(attachment);

      AttachImplementation handler = getHandler(attachment.getAttachmentConf().getAttachmentMethod() == null ? "Default"  : attachment.getAttachmentConf().getAttachmentMethod().getValue());
      if (handler == null) {
        throw new OBException(OBMessageUtils.messageBD("OBUIAPP_NoMethod"));
      }
      File file = handler.downloadFile(attachment);
      FileUtility fileUt = null;
      if (file.exists()) {
        fileUt = new FileUtility(file.getParent(), attachment.getName(), false, true);
      } else {
        throw new OBException(OBMessageUtils.messageBD("OBUIAPP_NoAttachmentFound"));
      }

      fileUt.dumpFile(os);
      boolean isTempFile = handler.isTempFile();
      if (isTempFile) {
        fileUt.deleteFile();
      }

    } catch (IOException e) {

      throw new OBException(OBMessageUtils.messageBD("Error downloading file"));
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  /**
   * Method to download all the files related to the record, in a single .zip dile. This method
   * calls needed handler class
   * 
   * @param tabId
   *          The tab Id where the download process is being executed
   * @param recordId
   *          All the attachment related to this recordID will be downloaded in a single .zip file
   */

  public void dowloadAll(String tabId, String recordIds, OutputStream os) throws OBException {

    Tab tab = OBDal.getInstance().get(Tab.class, tabId);
    String tableId = (String) DalUtil.getId(tab.getTable());
    try {
      OBContext.setAdminMode(true);
      final ZipOutputStream dest = new ZipOutputStream(os);
      HashMap<String, Integer> writtenFiles = new HashMap<String, Integer>();
      OBCriteria<Attachment> attachmentFiles = OBDao.getFilteredCriteria(Attachment.class,
          Restrictions.eq("table.id", tableId), Restrictions.in("record", recordIds.split(",")));
      attachmentFiles.setFilterOnReadableOrganization(false);
      for (Attachment attachmentFile : attachmentFiles.list()) {
        checkReadableAccess(attachmentFile);
        AttachImplementation handler = getHandler(attachmentFile.getAttachmentConf().getAttachmentMethod() == null ? "Default"
            : attachmentFile.getAttachmentConf().getAttachmentMethod().getValue());
        if (handler == null) {
          throw new OBException(OBMessageUtils.messageBD("OBUIAPP_NoMethod"));
        }
        File file = handler.downloadFile(attachmentFile);
        if (!file.exists()) {
          throw new OBException(OBMessageUtils.messageBD("OBUIAPP_NoAttachmentFound") + " :"
              + file.getName());
        }
        String zipName = "";
        if (!writtenFiles.containsKey(file.getName())) {
          zipName = file.getName();
          writtenFiles.put(file.getName(), 0);
        } else {
          int num = writtenFiles.get(file.getName()) + 1;
          int indDot = file.getName().lastIndexOf(".");
          if (indDot == -1) {
            // file has no extension
            indDot = attachmentFile.getName().length();
          }
          zipName = attachmentFile.getName().substring(0, indDot) + " (" + num + ")"
              + attachmentFile.getName().substring(indDot);
          writtenFiles.put(attachmentFile.getName(), num);
        }
        byte[] buf = new byte[1024];
        dest.putNextEntry(new ZipEntry(zipName));

        FileInputStream in = new FileInputStream(file.toString());
        int len;
        while ((len = in.read(buf)) > 0) {
          dest.write(buf, 0, len);
        }
        dest.closeEntry();
        in.close();
        boolean isTempFile = handler.isTempFile();
        if (isTempFile) {
          file.delete();
        }
      }
      dest.close();

    } catch (IOException e) {
      throw new OBException(OBMessageUtils.messageBD("OBUIAPP_ErrorWiththeFile"));
    }

    finally {
      OBContext.restorePreviousMode();
    }

  }

  /**
   * Method to obtain the metadata related to an attachmentMethod. The Values will be null
   * 
   * @param attachmentMethodId
   *          The attachment Method ID to take metadata
   * @return Returns a map with the metadata that belongs to attachmentMethodId
   */

  public Map<String, Object> getMetadataList(String attachmentMethodId) {
    AttachmentMethod attachMethod = OBDal.getInstance().get(AttachmentMethod.class, attachmentMethodId);
    Map<String, Object> metadataList = new HashMap<String, Object>();
    for (AttachmentMetadata metadata : attachMethod.getCAttachmentMetadataList()) {
      metadataList.put(metadata.getValue(), null);
    }
    return metadataList;
  }

  public AttachmentConfig getAttachmenConfig(Client client) {
	    OBCriteria<AttachmentConfig> obc = OBDal.getInstance().createCriteria(AttachmentConfig.class);
	    obc.add(Restrictions.eq(AttachmentConfig.PROPERTY_CLIENT, client));
	    obc.setMaxResults(1);
	    if (obc.uniqueResult() != null) {
	      return ((AttachmentConfig) obc.uniqueResult());
	    }
	    OBCriteria<AttachmentMethod> am = OBDal.getInstance().createCriteria(AttachmentMethod.class);
	    obc.add(Restrictions.eq(AttachmentMethod.PROPERTY_VALUE, "Default"));
	    obc.setMaxResults(1);
	    if (am.uniqueResult() != null) {
	      return (AttachmentConfig) am.uniqueResult();
	    } else {
	      throw new OBException(OBMessageUtils.messageBD("OBUIAPP_NoMethod"));
	    }
	  }
  
  public void getMetadataValues(Attachment attachment, JSONArray metadataArray) {
    checkReadableAccess(attachment);

    AttachImplementation handler = getHandler(attachment.getAttachmentConf().getAttachmentMethod() == null ? "Default"
    	        : attachment.getAttachmentConf().getAttachmentMethod().getValue());
    if (handler == null) {
      throw new OBException(OBMessageUtils.messageBD("OBUIAPP_NoMethod"));
    }
    handler.getMetadataValues(attachment, metadataArray);

  }

  /**
   * It gets the sequence number for the attachment
   * 
   * @param table
   *          the table of the attachment
   * @param recordId
   *          the recordId of the attachment
   * @return
   */
  private Long getSequenceNumber(Table table, String recordId) {
    OBCriteria<Attachment> obc = OBDal.getInstance().createCriteria(Attachment.class);
    obc.add(Restrictions.eq(Attachment.PROPERTY_RECORD, recordId));
    obc.add(Restrictions.eq(Attachment.PROPERTY_TABLE, table));
    obc.addOrderBy(Attachment.PROPERTY_SEQUENCENUMBER, false);
    obc.setFilterOnReadableOrganization(false);
    obc.setMaxResults(1);
    if (obc.uniqueResult() != null) {
      Attachment attach = (Attachment) obc.uniqueResult();
      return attach.getSequenceNumber() + 10L;
    } else {
      return 10L;
    }
  }

  /**
   * checks if the attachment already exists for given parameters.
   * 
   * @param table
   *          the table where the attachment is done
   * @param recordId
   *          The record ID where the attachment is done
   * @param fileName
   *          The name of the attachment
   * @return If exists, the attachment is returned. Else, null is returned
   */
  private Attachment getAttachment(Table table, String recordId, String fileName) {
    OBCriteria<Attachment> obc = OBDal.getInstance().createCriteria(Attachment.class);
    obc.add(Restrictions.eq(Attachment.PROPERTY_RECORD, recordId));
    obc.add(Restrictions.eq(Attachment.PROPERTY_NAME, fileName));
    obc.add(Restrictions.eq(Attachment.PROPERTY_TABLE, table));
    obc.setFilterOnReadableOrganization(false);
    obc.setMaxResults(1);
    return (Attachment) obc.uniqueResult();
  }

  /**
   * It gets the class that must be used, depending on the given attachMethod.
   * 
   * @param strAttachMethod
   *          attachmentMethod, that is the qualifier of the class.
   * @return
   */

  private AttachImplementation getHandler(String strAttachMethod) {
    AttachImplementation handler = null;
    for (AttachImplementation nextHandler : attachImplementationHandlers
        .select(new ComponentProvider.Selector(strAttachMethod))) {
      if (handler == null) {
        handler = nextHandler;
      } else {
        throw new OBException(OBMessageUtils.parseTranslation("@MoreThanOneImplementation@"));
      }
    }
    return handler;
  }

  private void checkReadableAccess(Attachment attachment) {
    // Checks if the user has readable access to the record where the file is attached
    Entity entity = ModelProvider.getInstance().getEntityByTableId(attachment.getTable().getId());
    if (entity != null) {
      Object object = OBDal.getInstance().get(entity.getMappingClass(), attachment.getRecord());
      if (object instanceof OrganizationEnabled) {
        SecurityChecker.getInstance().checkReadableAccess((OrganizationEnabled) object);
      }
    }
  }

}
