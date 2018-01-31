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
import java.util.Arrays;

import org.junit.Rule;
import org.junit.Test;
import org.openbravo.base.weld.test.ParameterCdiTest;
import org.openbravo.base.weld.test.ParameterCdiTestRule;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.materialmgmt.onhandquantity.StorageDetail;

/**
 * Partial unbox a storage detail that was 100% reserved and boxed
 *
 */
public class ReferencedInventoryPartialUnboxFullReservation extends
    ReferencedInventoryUnboxReservationTest {

  @Rule
  public ParameterCdiTestRule<ParamsUnboxReservationTest> parameterValuesRule = new ParameterCdiTestRule<ParamsUnboxReservationTest>(
      Arrays.asList(new ParamsUnboxReservationTest[] { new ParamsUnboxReservationTest(
          "Partial unbox of a fully reserved storage detail", "10", "7", "10") }));

  private @ParameterCdiTest ParamsUnboxReservationTest params;

  @Test
  public void allTests() throws Exception {
    for (boolean isAllocated : ISALLOCATED) {
      for (String[] product : PRODUCTS) {
        for (String toBinId : BINS) {
          final TestUnboxOutputParams outParams = testUnboxReservation(toBinId, product[0],
              product[1], params.qtyToBox, params.qtyToUnbox, params.reservationQty, isAllocated);
          assertsReferenceInventoryIsNotEmpty(outParams.refInv,
              params.qtyToBox.subtract(params.qtyToUnbox));
          assertsStorageDetails(params.qtyToBox, params.qtyToUnbox, outParams);
        }
      }
    }
  }

  private void assertsStorageDetails(final BigDecimal qtyToBox, final BigDecimal qtyToUnbox,
      final TestUnboxOutputParams outParams) {
    for (StorageDetail sd : ReferencedInventoryTestUtils
        .getAvailableStorageDetailsOrderByQtyOnHand(outParams.originalProduct)) {
      OBDal.getInstance().refresh(sd);
      if (sd.getReferencedInventory() != null) {
        // In box
        assertThat("Qty in box is the expected one", qtyToBox.subtract(qtyToUnbox),
            equalTo(sd.getQuantityOnHand()));
        assertThat("Qty in box reserved is equal to qty in box on hand", sd.getQuantityOnHand(),
            equalTo(sd.getReservedQty()));
      } else {
        // Out box
        assertThat("Qty out box is the expected one", qtyToUnbox, equalTo(sd.getQuantityOnHand()));
        assertThat("Qty out box reserved is equal to qty in box on hand", sd.getQuantityOnHand(),
            equalTo(sd.getReservedQty()));
      }
    }

  }
}
