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
 * All portions are Copyright (C) 2018 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.test.referencedinventory;

import static org.hamcrest.Matchers.equalTo;
import static org.junit.Assert.assertThat;

import java.math.BigDecimal;
import java.util.List;

import javax.servlet.ServletException;

import org.apache.commons.lang.StringUtils;
import org.openbravo.dal.service.OBDal;
import org.openbravo.exception.NoConnectionAvailableException;
import org.openbravo.materialmgmt.refinventory.ReferencedInventoryUtil;
import org.openbravo.materialmgmt.refinventory.UnboxProcessor;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.materialmgmt.onhandquantity.ReferencedInventory;
import org.openbravo.model.materialmgmt.onhandquantity.StorageDetail;
import org.openbravo.model.materialmgmt.transaction.InternalMovement;

public abstract class ReferencedInventoryUnboxTest extends ReferencedInventoryBoxTest {

  protected TestUnboxOutputParams testUnbox(final String _toBinId, final String productId,
      final String attributeSetInstanceId, final BigDecimal qtyToUnbox) throws Exception {
    ReferencedInventory refInv = testBox(null, productId, attributeSetInstanceId,
        new BigDecimal("10"), null, false);
    final List<StorageDetail> storageDetails = refInv.getMaterialMgmtStorageDetailList();
    final Product originalProduct = storageDetails.get(0).getProduct();
    final String originalAttributeSet = ReferencedInventoryUtil.getParentAttributeSetInstance(
        storageDetails.get(0)).getId();

    final String toBinId = StringUtils.isBlank(_toBinId) ? storageDetails.get(0).getStorageBin()
        .getId() : _toBinId;
    final InternalMovement unBoxMovement = new UnboxProcessor(refInv,
        ReferencedInventoryTestUtils.getUnboxStorageDetailsJSArray(storageDetails.get(0),
            qtyToUnbox == null ? storageDetails.get(0).getQuantityOnHand() : qtyToUnbox, toBinId))
        .createAndProcessGoodsMovement();

    OBDal.getInstance().refresh(unBoxMovement);
    OBDal.getInstance().getSession().evict(refInv); // Hack to avoid problems in Hibernate when the
                                                    // unbox process is executed
    refInv = OBDal.getInstance().get(ReferencedInventory.class, refInv.getId());

    assertsGoodsMovementIsProcessed(unBoxMovement);
    assertsGoodsMovementNumberOfLines(unBoxMovement, 1);

    return new TestUnboxOutputParams(refInv, originalProduct, originalAttributeSet, toBinId);
  }

  protected class TestUnboxOutputParams {
    protected ReferencedInventory refInv;
    protected Product originalProduct;
    protected String originalAttributeSetId;
    protected String toBinId;

    TestUnboxOutputParams(ReferencedInventory refInv, Product originalProduct,
        String originalAttributeSetId, String toBinId) {
      this.refInv = refInv;
      this.originalProduct = originalProduct;
      this.originalAttributeSetId = originalAttributeSetId;
      this.toBinId = toBinId;
    }
  }

  protected void assertsUnboxedStorageDetailIsInRightBin(final StorageDetail unboxedStorageDetail,
      final String toBinId) throws ServletException, NoConnectionAvailableException {
    assertThat("Unboxed storage detail is in the expected bin", unboxedStorageDetail
        .getStorageBin().getId(), equalTo(toBinId));
  }

  protected class ParamsUnboxTest extends ParamsBoxTest {
    BigDecimal qtyToUnbox;

    ParamsUnboxTest(String testDesc, String qtyToBox, String qtyToUnbox) {
      super(testDesc, qtyToBox);
      this.qtyToUnbox = new BigDecimal(qtyToUnbox);
    }

    @Override
    public String toString() {
      return "ParamsUnboxTest [testDesc=" + testDesc + ", qtyToBox=" + qtyToBox + ", qtyToUnbox="
          + qtyToUnbox + "]";
    }
  }

}
