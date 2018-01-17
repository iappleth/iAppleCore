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
 * All portions are Copyright (C) 2017-2018 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.materialmgmt.refinventory;

import java.util.Date;

import org.apache.commons.lang.StringUtils;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.Query;
import org.hibernate.Session;
import org.openbravo.base.exception.OBException;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBDateUtils;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.model.common.enterprise.Locator;
import org.openbravo.model.common.plm.AttributeSetInstance;
import org.openbravo.model.materialmgmt.onhandquantity.ReferencedInventory;
import org.openbravo.model.materialmgmt.onhandquantity.StorageDetail;
import org.openbravo.model.materialmgmt.transaction.InternalMovement;

/**
 * Process of boxing storage details into a concrete referenced inventory
 */
public class BoxProcessor extends ReferencedInventoryProcessor {
  private String newStorageBinId;

  public BoxProcessor(final ReferencedInventory referencedInventory,
      final JSONArray selectedStorageDetails, final String newStorageBinId) throws JSONException {
    super(referencedInventory);
    super.setSelectedStorageDetailsAndValidateThem(selectedStorageDetails);
    checkStorageDetailsNotAlreadyInReferencedInventory(selectedStorageDetails);
    setAndValidateNewStorageBinId(newStorageBinId);
  }

  private void checkStorageDetailsNotAlreadyInReferencedInventory(
      final JSONArray selectedStorageDetails) throws JSONException {
    for (int i = 0; i < selectedStorageDetails.length(); i++) {
      final JSONObject storageDetailJS = selectedStorageDetails.getJSONObject(i);
      final StorageDetail storageDetail = getStorageDetail(storageDetailJS);
      final ReferencedInventory previousReferencedInventory = storageDetail
          .getReferencedInventory();
      if (previousReferencedInventory != null) {
        throw new OBException(String.format(
            OBMessageUtils.messageBD("StorageDetailAlreadyLinkedToPreviousReferencedInventory"),
            storageDetail.getIdentifier(), previousReferencedInventory.getIdentifier()));
      }
    }
  }

  private void setAndValidateNewStorageBinId(final String newStorageBinId) throws JSONException {
    if (StringUtils.isBlank(newStorageBinId)) {
      throw new OBException(OBMessageUtils.messageBD("NewStorageBinParameterMandatory"));
    } else {
      this.newStorageBinId = newStorageBinId;
    }
  }

  @Override
  protected AttributeSetInstance getAttributeSetInstanceTo(StorageDetail storageDetail) {
    // FIXME if no attribute?
    // FIXME can we reuse the clone?
    return ReferencedInventoryUtil.cloneAttributeSetInstance(storageDetail.getAttributeSetValue(),
        getReferencedInventory());
  }

  @Override
  protected String generateInternalMovementName() {
    return OBDateUtils.formatDateTime(new Date()) + "_" + OBMessageUtils.messageBD("BOX");
  }

  @Override
  protected String getNewStorageBinId(JSONObject storageDetailJS) {
    return newStorageBinId;
  }

  /**
   * It calls {@link ReferencedInventoryProcessor#createAndProcessGoodsMovement()}. It then verifies
   * that the referenced inventory is stored in a unique bin.
   * 
   * @throws Exception
   *           In case of exception, the transaction is rollback and the exception is thrown.
   * 
   */
  @Override
  public InternalMovement createAndProcessGoodsMovement() throws Exception {
    try {
      final InternalMovement goodsMovementHeader = super.createAndProcessGoodsMovement();
      checkReferencedInventoryIsInOneBin();
      return goodsMovementHeader;
    } catch (Exception e) {
      OBDal.getInstance().rollbackAndClose();
      throw e;
    }
  }

  private void checkReferencedInventoryIsInOneBin() {
    final String hql = "select distinct(sd.storageBin) " + //
        "                from  MaterialMgmtStorageDetail sd " + //
        "                where sd.referencedInventory.id = :referencedInventoryId" + //
        "                and sd.storageBin.id <> :newStorageBinId";
    final Session session = OBDal.getInstance().getSession();
    final Query query = session.createQuery(hql.toString());
    query.setParameter("referencedInventoryId", getReferencedInventory().getId());
    query.setParameter("newStorageBinId", newStorageBinId);
    query.setMaxResults(1);
    final Locator otherLocator = (Locator) query.uniqueResult();
    if (otherLocator != null) {
      throw new OBException(String.format(
          OBMessageUtils.messageBD("ReferencedInventoryInOtherBin"), getReferencedInventory()
              .getIdentifier(), otherLocator.getIdentifier()));
    }
  }
}
