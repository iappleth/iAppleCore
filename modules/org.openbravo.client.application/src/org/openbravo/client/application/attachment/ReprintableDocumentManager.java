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
 * All portions are Copyright (C) 2023 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.application.attachment;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;

import javax.annotation.PostConstruct;
import javax.enterprise.context.ApplicationScoped;

import org.hibernate.criterion.Restrictions;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.exception.OBSecurityException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.base.structure.OrganizationEnabled;
import org.openbravo.base.weld.WeldUtils;
import org.openbravo.cache.TimeInvalidatedCache;
import org.openbravo.client.application.attachment.AttachmentUtils.AttachmentType;
import org.openbravo.client.kernel.ComponentProvider;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.security.SecurityChecker;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.ad.utility.AttachmentConfig;
import org.openbravo.model.ad.utility.ReprintableDocument;
import org.openbravo.model.common.enterprise.Organization;

/**
 * Centralizes the {@link ReprintableDocument} Management. Any action to manage reprintable
 * documents in Openbravo should be done through this class.
 */
@ApplicationScoped
public class ReprintableDocumentManager {

  private TimeInvalidatedCache<String, String> methodsOfAttachmentConfigs;

  /**
   * Supported formats for a {@link ReprintableDocument}
   */
  public enum Format {
    XML, PDF;
  }

  @PostConstruct
  private void init() {
    methodsOfAttachmentConfigs = TimeInvalidatedCache.newBuilder()
        .name("Methods of Attachment Configs")
        .expireAfterDuration(Duration.ofMinutes(10))
        .build(this::getAttachmentMethod);
  }

  private String getAttachmentMethod(String attachmentConfigurationId) {
    //@formatter:off
    String hql = "select c.attachmentMethod.value" +
                 "  from AttachmentConfig c" +
                 " where c.id = :id";
    //@formatter:on
    return OBDal.getInstance()
        .getSession()
        .createQuery(hql, String.class)
        .setParameter("id", attachmentConfigurationId)
        .uniqueResult();
  }

  /**
   * Creates a new ReprintableDocument and uploads its data as an attachment
   * 
   * @param documentData
   *          An InputStream with the document data. This method is in charge of closing it when
   *          finish its execution.
   * @param format
   *          The format of document
   * @param sourceDocument
   *          The document used as source data for the ReprintableDocument
   *
   * @throws OBSecurityException
   *           if the write access to the source document is not granted in the current context
   *           because in such case is not allowed to create a ReprintableDocument linked to the
   *           source document.
   */
  public ReprintableDocument upload(InputStream documentData, Format format,
      SourceDocument sourceDocument) {
    ReprintableDocument document = createReprintableDocument(format, sourceDocument);
    ReprintableDocumentAttachHandler handler = getHandler(document);

    try (documentData) {
      handler.upload(document, documentData);
    } catch (Exception ex) {
      throw new OBException("Error uploading reprintable document", ex);
    }
    return document;
  }

  /**
   * Retrieves the data of a ReprintableDocument linked to the provided document
   *
   * @param sourceDocument
   *          The document used as source data for the ReprintableDocument
   *
   * @return an InputStream with the document data. Code invoking this method is also responsible of
   *         closing this InputStream.
   *
   * @throws OBSecurityException
   *           if the read access to the source document is not granted in the current context
   *           because in such case is not allowed to access to the ReprintableDocument linked to
   *           the source document.
   */
  public InputStream download(SourceDocument sourceDocument) throws IOException {
    ReprintableDocument reprintableDocument = findReprintableDocument(sourceDocument);
    ReprintableDocumentAttachHandler handler = getHandler(reprintableDocument);

    return handler.download(reprintableDocument);
  }

  private ReprintableDocument createReprintableDocument(Format format,
      SourceDocument sourceDocument) {
    AttachmentConfig config = AttachmentUtils.getAttachmentConfig(AttachmentType.RD);
    BaseOBObject sourceDocumentBOB = sourceDocument.getBOB();

    SecurityChecker.getInstance().checkWriteAccess(sourceDocumentBOB);

    // If we have write access to the source document, the ReprintableDocument can be saved but we
    // need to do it in admin mode because the ReprintableDocument entity is not writable by default
    try {
      OBContext.setAdminMode(true);
      ReprintableDocument reprintableDocument = OBProvider.getInstance()
          .get(ReprintableDocument.class);
      reprintableDocument.setClient((Client) sourceDocumentBOB.get("client"));
      reprintableDocument.setOrganization((Organization) sourceDocumentBOB.get("organization"));
      reprintableDocument.setName("reprintableDocument." + format.name().toLowerCase());
      reprintableDocument.setFormat(format.name());
      reprintableDocument.setAttachmentConfiguration(config);
      reprintableDocument.set(sourceDocument.getProperty(), sourceDocument.getBOB());
      OBDal.getInstance().save(reprintableDocument);
      return reprintableDocument;
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  private ReprintableDocument findReprintableDocument(SourceDocument sourceDocument) {
    BaseOBObject bob = sourceDocument.getBOB();

    SecurityChecker.getInstance().checkReadableAccess((OrganizationEnabled) bob);

    // If we have read access to the source document, its ReprintableDocument can be accessed but we
    // need to do it in admin mode because the ReprintableDocument entity is not readable by default
    try {
      OBContext.setAdminMode(true);
      return (ReprintableDocument) OBDal.getInstance()
          .createCriteria(ReprintableDocument.class)
          .add(Restrictions.eq(sourceDocument.getProperty(), bob))
          .setMaxResults(1)
          .uniqueResult();
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  private ReprintableDocumentAttachHandler getHandler(ReprintableDocument reprintableDocument) {
    String attachMethod = methodsOfAttachmentConfigs
        .get(reprintableDocument.getAttachmentConfiguration().getId());
    return WeldUtils
        .getInstances(ReprintableDocumentAttachHandler.class,
            new ComponentProvider.Selector(attachMethod))
        .stream()
        .findFirst()
        .orElseThrow(() -> new OBException(OBMessageUtils.messageBD("MoreThanOneImplementation")));
  }

  /**
   * Clears the cache information of the attachment configuration passed as parameter. For internal
   * use only.
   *
   * @param attachmentConfigurationId
   *          The attachment configuration ID
   */
  public void invalidateAttachmentConfigurationCache(String attachmentConfigurationId) {
    methodsOfAttachmentConfigs.invalidate(attachmentConfigurationId);
  }
}
