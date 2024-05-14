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
 * All portions are Copyright (C) 2024 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.test.referencedinventory;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

import java.math.BigDecimal;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;
import org.junit.After;
import org.junit.Test;
import org.openbravo.dal.service.OBDal;
import org.openbravo.materialmgmt.refinventory.ContentRestriction;
import org.openbravo.materialmgmt.refinventory.UnboxProcessor;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.materialmgmt.onhandquantity.ReferencedInventory;
import org.openbravo.model.materialmgmt.transaction.InternalMovement;

/**
 * This is class to test Nested Referenced Inventory Box, UnBox Functionalities.
 *
 */

public class NestedReferencedInventoryUnBoxTest extends ReferencedInventoryTest {

  @Test
  public void testUnBoxNestedRI() throws Exception {

    final String toBinId = BINS[0];

    JSONArray storageDetailsForSmallBox = new JSONArray();

    // Small Box

    ReferencedInventory smallBoxRefInv = NestedReferencedInventoryTestUtils
        .createReferencedInventory(ReferencedInventoryTestUtils.QA_SPAIN_ORG_ID,
            ContentRestriction.BOTH_ITEMS_OR_REFINVENTORIES);

    // Store first Product Storage Detail without Attribute set instance to be added later on
    final Product firstProduct = ReferencedInventoryTestUtils.cloneProduct(PRODUCTS[0][0]);
    JSONArray firstProductSD = new JSONArray();
    firstProductSD.put(NestedReferencedInventoryTestUtils
        .addProductInBox(firstProduct, BigDecimal.TEN, PRODUCTS[0][1])
        .get(0));
    storageDetailsForSmallBox.put(firstProductSD.get(0));

    final Product secondProduct = ReferencedInventoryTestUtils.cloneProduct(PRODUCTS[1][0]);
    JSONArray secondProductSD = new JSONArray();
    secondProductSD.put(NestedReferencedInventoryTestUtils
        .addProductInBox(secondProduct, BigDecimal.TEN, PRODUCTS[1][1])
        .get(0));
    storageDetailsForSmallBox.put(secondProductSD.get(0));

    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(smallBoxRefInv,
        storageDetailsForSmallBox, toBinId, 2, 2L, 0L);

    // Medium Box

    ReferencedInventory mediumBoxRefInv = NestedReferencedInventoryTestUtils
        .createReferencedInventory(ReferencedInventoryTestUtils.QA_SPAIN_ORG_ID,
            ContentRestriction.BOTH_ITEMS_OR_REFINVENTORIES);

    final JSONArray storageDetailsForMediumBox = NestedReferencedInventoryTestUtils
        .getStorageDetailsforNestedRI(smallBoxRefInv, toBinId);

    final Product thirdProduct = ReferencedInventoryTestUtils.cloneProduct(PRODUCTS[2][0]);
    JSONArray thirdProductSD = new JSONArray();
    thirdProductSD.put(NestedReferencedInventoryTestUtils
        .addProductInBox(thirdProduct, BigDecimal.TEN, PRODUCTS[2][1])
        .get(0));
    storageDetailsForMediumBox.put(thirdProductSD.get(0));

    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(mediumBoxRefInv,
        storageDetailsForMediumBox, toBinId, 3, 3L, 1L);

    // Pallet

    ReferencedInventory palletRefInv = NestedReferencedInventoryTestUtils.createReferencedInventory(
        ReferencedInventoryTestUtils.QA_SPAIN_ORG_ID,
        ContentRestriction.BOTH_ITEMS_OR_REFINVENTORIES);

    // Add products with and without attribute set instance which is already present in Box, added
    // during previous Box transaction in nested referenced inventory

    JSONArray storageDetailsForPallet = NestedReferencedInventoryTestUtils
        .getStorageDetailsforNestedRI(mediumBoxRefInv, toBinId);
    storageDetailsForPallet.put(firstProductSD.get(0));
    storageDetailsForPallet.put(secondProductSD.get(0));
    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(palletRefInv,
        storageDetailsForPallet, toBinId, 5, 3L, 2L);

    // It is important to re-initialize referenced inventory objects when unboxing so that parent
    // referenced inventory is properly set
    mediumBoxRefInv = NestedReferencedInventoryTestUtils
        .getRefreshedReferencedInventory(mediumBoxRefInv.getId());
    smallBoxRefInv = NestedReferencedInventoryTestUtils
        .getRefreshedReferencedInventory(smallBoxRefInv.getId());

    // Unbox medium box inside pallet, unbox to individual items as No
    unBoxNestedRI(palletRefInv, mediumBoxRefInv, null, toBinId, false);

    palletRefInv = NestedReferencedInventoryTestUtils
        .getRefreshedReferencedInventory(palletRefInv.getId());

    assertThat("Nested Referenced Inventory Count is not equal to 0L",
        palletRefInv.getNestedReferencedInventoriesCount(), equalTo(0L));

    // Check attribute set instance after unbox
    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(smallBoxRefInv,
        firstProduct, BigDecimal.ONE,
        "[" + smallBoxRefInv.getSearchKey() + "][" + mediumBoxRefInv.getSearchKey() + "]");

    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(smallBoxRefInv,
        secondProduct, BigDecimal.ONE,
        "Yellow[" + smallBoxRefInv.getSearchKey() + "][" + mediumBoxRefInv.getSearchKey() + "]");

    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(mediumBoxRefInv,
        thirdProduct, BigDecimal.ONE, "#015[" + mediumBoxRefInv.getSearchKey() + "]");

    // Re-Box medium Box in to Pallet
    storageDetailsForPallet = NestedReferencedInventoryTestUtils
        .getStorageDetailsforNestedRI(mediumBoxRefInv, toBinId);

    mediumBoxRefInv = NestedReferencedInventoryTestUtils
        .getRefreshedReferencedInventory(mediumBoxRefInv.getId());

    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(palletRefInv,
        storageDetailsForPallet, toBinId, 3, 3L, 2L);

    // Check attribute set instance after re-box
    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(smallBoxRefInv,
        firstProduct, BigDecimal.ONE, "[" + smallBoxRefInv.getSearchKey() + "]["
            + mediumBoxRefInv.getSearchKey() + "][" + palletRefInv.getSearchKey() + "]");

    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(smallBoxRefInv,
        secondProduct, BigDecimal.ONE, "Yellow[" + smallBoxRefInv.getSearchKey() + "]["
            + mediumBoxRefInv.getSearchKey() + "][" + palletRefInv.getSearchKey() + "]");

    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(mediumBoxRefInv,
        thirdProduct, BigDecimal.ONE,
        "#015[" + mediumBoxRefInv.getSearchKey() + "][" + palletRefInv.getSearchKey() + "]");

    // Unbox medium box inside pallet, unbox to individual items as Yes
    unBoxNestedRI(palletRefInv, mediumBoxRefInv, null, toBinId, true);

    palletRefInv = NestedReferencedInventoryTestUtils
        .getRefreshedReferencedInventory(palletRefInv.getId());

    assertThat("Nested Referenced Inventory Count is not equal to 0L",
        palletRefInv.getNestedReferencedInventoriesCount(), equalTo(0L));

    assertThat("Medium Box is not empty",
        NestedReferencedInventoryTestUtils.storageDetailExists(mediumBoxRefInv, null, null, null),
        equalTo(false));

    // Check attribute set instance after unbox
    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(palletRefInv, firstProduct,
        BigDecimal.ONE, "[" + palletRefInv.getSearchKey() + "]");
    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(palletRefInv,
        secondProduct, BigDecimal.ONE, "Yellow[" + palletRefInv.getSearchKey() + "]");

    // Re-Box - Small Box
    // It is important to re-initialize referenced inventory objects when unboxing so that parent
    // referenced inventory is properly set
    smallBoxRefInv = NestedReferencedInventoryTestUtils
        .getRefreshedReferencedInventory(smallBoxRefInv.getId());

    storageDetailsForSmallBox = new JSONArray();
    storageDetailsForSmallBox.put(firstProductSD.get(0));
    storageDetailsForSmallBox.put(secondProductSD.get(0));
    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(smallBoxRefInv,
        storageDetailsForSmallBox, toBinId, 2, 2L, 0L);

    // Re-Box - Small Box into Pallet
    storageDetailsForPallet = NestedReferencedInventoryTestUtils
        .getStorageDetailsforNestedRI(smallBoxRefInv, toBinId);
    storageDetailsForPallet.put(thirdProductSD.get(0));

    palletRefInv = NestedReferencedInventoryTestUtils
        .getRefreshedReferencedInventory(palletRefInv.getId());

    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(palletRefInv,
        storageDetailsForPallet, toBinId, 3, 3L, 1L);

    // Check attribute set instance after re-box
    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(smallBoxRefInv,
        firstProduct, BigDecimal.ONE,
        "[" + smallBoxRefInv.getSearchKey() + "][" + palletRefInv.getSearchKey() + "]");

    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(smallBoxRefInv,
        secondProduct, BigDecimal.ONE,
        "Yellow[" + smallBoxRefInv.getSearchKey() + "][" + palletRefInv.getSearchKey() + "]");

    // Box Transaction - Pallet into Big Pallet
    ReferencedInventory bigPalletRefInv = NestedReferencedInventoryTestUtils
        .createReferencedInventory(ReferencedInventoryTestUtils.QA_SPAIN_ORG_ID,
            ContentRestriction.BOTH_ITEMS_OR_REFINVENTORIES);
    JSONArray storageDetailsForBigPallet = NestedReferencedInventoryTestUtils
        .getStorageDetailsforNestedRI(palletRefInv, toBinId);
    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(bigPalletRefInv,
        storageDetailsForBigPallet, toBinId, 5, 3L, 2L);

    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(smallBoxRefInv,
        firstProduct, BigDecimal.ONE, "[" + smallBoxRefInv.getSearchKey() + "]["
            + palletRefInv.getSearchKey() + "][" + bigPalletRefInv.getSearchKey() + "]");

    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(smallBoxRefInv,
        secondProduct, BigDecimal.ONE, "Yellow[" + smallBoxRefInv.getSearchKey() + "]["
            + palletRefInv.getSearchKey() + "][" + bigPalletRefInv.getSearchKey() + "]");

    // Select any one item from small box, unbox to individual items as Yes
    storageDetailsForSmallBox = NestedReferencedInventoryTestUtils
        .getStorageDetailsforNestedRI(smallBoxRefInv, toBinId);
    JSONArray storageDetailsFromSmallBoxToUnBox = new JSONArray();
    if (storageDetailsForSmallBox.length() > 0) {
      storageDetailsFromSmallBoxToUnBox.put(storageDetailsForSmallBox.get(0));
    }
    // Partial Unbox from Big Pallet
    unBoxNestedRI(bigPalletRefInv, null, storageDetailsFromSmallBoxToUnBox, toBinId, true);

    // Total Unbox - Select all one item from Big Pallet, unbox to individual items
    // as Yes
    unBoxNestedRI(bigPalletRefInv, null,
        NestedReferencedInventoryTestUtils.getStorageDetailsforNestedRI(bigPalletRefInv, toBinId),
        toBinId, true);

    assertThat("Big Pallet is not empty",
        NestedReferencedInventoryTestUtils.storageDetailExists(bigPalletRefInv, null, null, null),
        equalTo(false));

    assertThat("Pallet is not empty",
        NestedReferencedInventoryTestUtils.storageDetailExists(palletRefInv, null, null, null),
        equalTo(false));

    assertThat("Small Box is not empty",
        NestedReferencedInventoryTestUtils.storageDetailExists(smallBoxRefInv, null, null, null),
        equalTo(false));

  }

  @Test
  public void testUnBoxOuterMostParentHU() throws Exception {

    final String toBinId = BINS[0];

    JSONArray storageDetailsForSmallBox = new JSONArray();

    // Small Box

    ReferencedInventory smallBoxRefInv = NestedReferencedInventoryTestUtils
        .createReferencedInventory(ReferencedInventoryTestUtils.QA_SPAIN_ORG_ID,
            ContentRestriction.BOTH_ITEMS_OR_REFINVENTORIES);

    final Product smallBoxProduct = ReferencedInventoryTestUtils.cloneProduct(PRODUCTS[0][0]);
    JSONArray smallBoxProductSD = new JSONArray();
    smallBoxProductSD.put(NestedReferencedInventoryTestUtils
        .addProductInBox(smallBoxProduct, BigDecimal.TEN, PRODUCTS[0][1])
        .get(0));
    storageDetailsForSmallBox.put(smallBoxProductSD.get(0));

    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(smallBoxRefInv,
        storageDetailsForSmallBox, toBinId, 1, 1L, 0L);

    // Medium Box 1
    ReferencedInventory mediumBox1RefInv = NestedReferencedInventoryTestUtils
        .createReferencedInventory(ReferencedInventoryTestUtils.QA_SPAIN_ORG_ID,
            ContentRestriction.BOTH_ITEMS_OR_REFINVENTORIES);

    final JSONArray storageDetailsForMediumBox1 = NestedReferencedInventoryTestUtils
        .getStorageDetailsforNestedRI(smallBoxRefInv, toBinId);

    final Product mediumBox1Product = ReferencedInventoryTestUtils.cloneProduct(PRODUCTS[1][0]);
    JSONArray mediumBox1ProductSD = new JSONArray();
    mediumBox1ProductSD.put(NestedReferencedInventoryTestUtils
        .addProductInBox(mediumBox1Product, BigDecimal.TEN, PRODUCTS[1][1])
        .get(0));
    storageDetailsForMediumBox1.put(mediumBox1ProductSD.get(0));

    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(mediumBox1RefInv,
        storageDetailsForMediumBox1, toBinId, 2, 2L, 1L);

    // Medium Box 2
    ReferencedInventory mediumBox2RefInv = NestedReferencedInventoryTestUtils
        .createReferencedInventory(ReferencedInventoryTestUtils.QA_SPAIN_ORG_ID,
            ContentRestriction.BOTH_ITEMS_OR_REFINVENTORIES);

    final Product mediumBox2Product = ReferencedInventoryTestUtils.cloneProduct(PRODUCTS[2][0]);
    JSONArray mediumBox2ProductSD = new JSONArray();
    mediumBox2ProductSD.put(NestedReferencedInventoryTestUtils
        .addProductInBox(mediumBox2Product, BigDecimal.TEN, PRODUCTS[2][1])
        .get(0));

    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(mediumBox2RefInv,
        mediumBox2ProductSD, toBinId, 1, 1L, 0L);

    // Pallet - Medium Box 1 and Medium Box 2

    ReferencedInventory palletRefInv = NestedReferencedInventoryTestUtils.createReferencedInventory(
        ReferencedInventoryTestUtils.QA_SPAIN_ORG_ID,
        ContentRestriction.BOTH_ITEMS_OR_REFINVENTORIES);

    JSONArray storageDetailsForPallet = NestedReferencedInventoryTestUtils
        .getStorageDetailsforNestedRI(mediumBox1RefInv, toBinId);

    JSONArray storageDetailsForPalletFromMediumBox2 = NestedReferencedInventoryTestUtils
        .getStorageDetailsforNestedRI(mediumBox2RefInv, toBinId);

    for (int i = 0; i < storageDetailsForPalletFromMediumBox2.length(); i++) {
      storageDetailsForPallet.put(storageDetailsForPalletFromMediumBox2.get(i));
    }

    storageDetailsForPallet.put(smallBoxProductSD.get(0));

    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(palletRefInv,
        storageDetailsForPallet, toBinId, 4, 3L, 3L);

    mediumBox1RefInv = NestedReferencedInventoryTestUtils
        .getRefreshedReferencedInventory(mediumBox1RefInv.getId());
    mediumBox2RefInv = NestedReferencedInventoryTestUtils
        .getRefreshedReferencedInventory(mediumBox2RefInv.getId());
    smallBoxRefInv = NestedReferencedInventoryTestUtils
        .getRefreshedReferencedInventory(smallBoxRefInv.getId());

    // Unbox pallet, unbox to individual items as No
    unBoxNestedRI(palletRefInv, palletRefInv, null, toBinId, false);

    // Check attribute set instance after boxing Medium Box 1 and Medium Box 2 into Pallet
    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(smallBoxRefInv,
        smallBoxProduct, BigDecimal.ONE,
        "[" + smallBoxRefInv.getSearchKey() + "][" + mediumBox1RefInv.getSearchKey() + "]");

    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(mediumBox1RefInv,
        mediumBox1Product, BigDecimal.ONE, "Yellow[" + mediumBox1RefInv.getSearchKey() + "]");

    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(mediumBox2RefInv,
        mediumBox2Product, BigDecimal.ONE, "#015[" + mediumBox2RefInv.getSearchKey() + "]");

    palletRefInv = NestedReferencedInventoryTestUtils
        .getRefreshedReferencedInventory(palletRefInv.getId());
    assertThat("Pallet is not empty",
        NestedReferencedInventoryTestUtils.storageDetailExists(palletRefInv, null, null, null),
        equalTo(false));
    assertThat("Pallet is not empty", palletRefInv.getNestedReferencedInventoriesCount(),
        equalTo(0L));
    assertThat("Pallet is not empty", palletRefInv.getUniqueItemsCount(), equalTo(0L));
  }

  @Test
  public void testUnBoxInnermostHU() throws Exception {

    final String toBinId = BINS[0];

    JSONArray storageDetailsForSmallBox = new JSONArray();

    // Small Box

    ReferencedInventory smallBoxRefInv = NestedReferencedInventoryTestUtils
        .createReferencedInventory(ReferencedInventoryTestUtils.QA_SPAIN_ORG_ID,
            ContentRestriction.BOTH_ITEMS_OR_REFINVENTORIES);

    final Product smallBoxProduct = ReferencedInventoryTestUtils.cloneProduct(PRODUCTS[0][0]);
    JSONArray smallBoxProductSD = new JSONArray();
    smallBoxProductSD.put(NestedReferencedInventoryTestUtils
        .addProductInBox(smallBoxProduct, BigDecimal.TEN, PRODUCTS[0][1])
        .get(0));
    storageDetailsForSmallBox.put(smallBoxProductSD.get(0));

    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(smallBoxRefInv,
        storageDetailsForSmallBox, toBinId, 1, 1L, 0L);

    // Medium Box 1
    ReferencedInventory mediumBox1RefInv = NestedReferencedInventoryTestUtils
        .createReferencedInventory(ReferencedInventoryTestUtils.QA_SPAIN_ORG_ID,
            ContentRestriction.BOTH_ITEMS_OR_REFINVENTORIES);

    final JSONArray storageDetailsForMediumBox1 = NestedReferencedInventoryTestUtils
        .getStorageDetailsforNestedRI(smallBoxRefInv, toBinId);

    final Product mediumBox1Product = ReferencedInventoryTestUtils.cloneProduct(PRODUCTS[1][0]);
    JSONArray mediumBox1ProductSD = new JSONArray();
    mediumBox1ProductSD.put(NestedReferencedInventoryTestUtils
        .addProductInBox(mediumBox1Product, BigDecimal.TEN, PRODUCTS[1][1])
        .get(0));
    storageDetailsForMediumBox1.put(mediumBox1ProductSD.get(0));

    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(mediumBox1RefInv,
        storageDetailsForMediumBox1, toBinId, 2, 2L, 1L);

    // Medium Box 2
    ReferencedInventory mediumBox2RefInv = NestedReferencedInventoryTestUtils
        .createReferencedInventory(ReferencedInventoryTestUtils.QA_SPAIN_ORG_ID,
            ContentRestriction.BOTH_ITEMS_OR_REFINVENTORIES);

    final Product mediumBox2Product = ReferencedInventoryTestUtils.cloneProduct(PRODUCTS[2][0]);
    JSONArray mediumBox2ProductSD = new JSONArray();
    mediumBox2ProductSD.put(NestedReferencedInventoryTestUtils
        .addProductInBox(mediumBox2Product, BigDecimal.TEN, PRODUCTS[2][1])
        .get(0));

    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(mediumBox2RefInv,
        mediumBox2ProductSD, toBinId, 1, 1L, 0L);

    // Pallet - Medium Box 1 and Medium Box 2

    ReferencedInventory palletRefInv = NestedReferencedInventoryTestUtils.createReferencedInventory(
        ReferencedInventoryTestUtils.QA_SPAIN_ORG_ID,
        ContentRestriction.BOTH_ITEMS_OR_REFINVENTORIES);

    JSONArray storageDetailsForPallet = NestedReferencedInventoryTestUtils
        .getStorageDetailsforNestedRI(mediumBox1RefInv, toBinId);

    JSONArray storageDetailsForPalletFromMediumBox2 = NestedReferencedInventoryTestUtils
        .getStorageDetailsforNestedRI(mediumBox2RefInv, toBinId);

    for (int i = 0; i < storageDetailsForPalletFromMediumBox2.length(); i++) {
      storageDetailsForPallet.put(storageDetailsForPalletFromMediumBox2.get(i));
    }

    storageDetailsForPallet.put(smallBoxProductSD.get(0));

    NestedReferencedInventoryTestUtils.boxAndValidateRefInventory(palletRefInv,
        storageDetailsForPallet, toBinId, 4, 3L, 3L);

    // Unbox small box, unbox to individual items as Yes
    unBoxNestedRI(smallBoxRefInv, smallBoxRefInv, null, toBinId, true);

    // Check attribute set instance after boxing Medium Box 1 and Medium Box 2 into Pallet
    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(mediumBox1RefInv,
        mediumBox1Product, BigDecimal.ONE,
        "Yellow[" + mediumBox1RefInv.getSearchKey() + "][" + palletRefInv.getSearchKey() + "]");

    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(mediumBox2RefInv,
        mediumBox2Product, BigDecimal.ONE,
        "#015[" + mediumBox2RefInv.getSearchKey() + "][" + palletRefInv.getSearchKey() + "]");

    NestedReferencedInventoryTestUtils.validateAttributeSetInstanceValue(palletRefInv,
        smallBoxProduct, BigDecimal.ONE, "[" + palletRefInv.getSearchKey() + "]");

    smallBoxRefInv = NestedReferencedInventoryTestUtils
        .getRefreshedReferencedInventory(smallBoxRefInv.getId());
    assertThat("Small Box is not empty",
        NestedReferencedInventoryTestUtils.storageDetailExists(smallBoxRefInv, null, null, null),
        equalTo(false));
    assertThat("Small Box is not empty", smallBoxRefInv.getUniqueItemsCount(), equalTo(0L));
    assertThat("Small Box has no HU", smallBoxRefInv.getNestedReferencedInventoriesCount(),
        equalTo(0L));
  }

  /**
   * UnBox nested referenced inventory
   */
  private void unBoxNestedRI(final ReferencedInventory refInvToUnBox,
      final ReferencedInventory selectedRefInvToUnbox, final JSONArray storageDetailsForUnBox,
      String toBinId, boolean unBoxToIndividualItems) throws Exception {
    final JSONArray selectedRefInventoriesToUnbox = new JSONArray();
    final JSONObject refInventoryJSToUnbox = new JSONObject();
    if (selectedRefInvToUnbox != null) {
      refInventoryJSToUnbox.put("id", selectedRefInvToUnbox.getId());
      selectedRefInventoriesToUnbox.put(refInventoryJSToUnbox);
    }

    final JSONArray storageDetailsForUnBoxNestedRI = selectedRefInvToUnbox != null
        ? NestedReferencedInventoryTestUtils.getStorageDetailsforNestedRI(selectedRefInvToUnbox,
            toBinId)
        : new JSONArray();
    if (storageDetailsForUnBox != null && storageDetailsForUnBox.length() > 0) {
      for (int i = 0; i < storageDetailsForUnBox.length(); i++) {
        storageDetailsForUnBoxNestedRI.put(storageDetailsForUnBox.get(i));
      }
    }

    final InternalMovement unBoxMovement = new UnboxProcessor(refInvToUnBox,
        storageDetailsForUnBoxNestedRI, selectedRefInventoriesToUnbox, unBoxToIndividualItems)
            .createAndProcessGoodsMovement();
    OBDal.getInstance().refresh(unBoxMovement);
  }

  @Override
  @After
  public void clearSession() {
    OBDal.getInstance().rollbackAndClose();
  }
}
