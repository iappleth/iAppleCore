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
package org.openbravo.test.documentsequence;

import static org.junit.Assert.assertTrue;

import org.junit.Test;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.SequenceUtil.CalculationMethod;
import org.openbravo.erpCommon.utility.SequenceUtil.ControlDigit;
import org.openbravo.model.ad.utility.Sequence;

public class SequenceControlDigitPrefixSuffixTest extends SequenceTest {
  /**
   * Empty prefix and suffix, None control digit
   */
  @Test
  public void testSequenceControlDigit_None() {
    final Sequence sequence = SequenceTestUtils.createSequence(CalculationMethod.AUTONUMERING, null,
        null, null, ControlDigit.NONE);
    OBDal.getInstance().save(sequence);
    assertTrue("Sequence with control digit None and empty prefix/suffix is not created.",
        sequence != null);
  }

  /** Numeric prefix */
  @Test
  public void testSequenceControlDigit_Module10_NumericPrefix() {
    final Sequence sequence = SequenceTestUtils.createSequence(CalculationMethod.AUTONUMERING, null,
        "102", null, ControlDigit.MODULE10);
    OBDal.getInstance().save(sequence);
    assertTrue("Sequence with control digit Module 10 and numeric prefix is not created.",
        sequence != null);
  }

  /** Numeric suffix */
  @Test
  public void testSequenceControlDigit_Module10_NumericSuffix() {
    final Sequence sequence = SequenceTestUtils.createSequence(CalculationMethod.AUTONUMERING, null,
        null, "101", ControlDigit.MODULE10);
    OBDal.getInstance().save(sequence);
    assertTrue("Sequence with control digit Module 10 and numeric suffix is not created.",
        sequence != null);
  }

  /** Update Base sequence with numeric prefix */
  @Test
  public void testSequenceControlDigit_Module10_UpdateBaseSequenceWithNumericPrefixSuffix() {
    final Sequence baseSequence = SequenceTestUtils.createSequence(CalculationMethod.AUTONUMERING,
        null, null, "100", ControlDigit.NONE);
    OBDal.getInstance().save(baseSequence);
    final Sequence parentSequence = SequenceTestUtils.createSequence(CalculationMethod.SEQUENCE,
        baseSequence, "06", null, ControlDigit.MODULE10);
    OBDal.getInstance().save(parentSequence);
    assertTrue(
        "Sequence with control digit Module 10 and base sequence with numeric prefix is not created.",
        parentSequence != null);
    baseSequence.setPrefix("102");
    OBDal.getInstance().save(baseSequence);
    assertTrue(
        "Sequence with control digit Module 10 and base sequence with numeric prefix is not updated.",
        baseSequence.getPrefix() == "102");
  }

  /** Update Base sequence with numeric suffix */
  @Test
  public void testSequenceControlDigit_Module10_UpdateBaseSequenceWithNumericSuffix() {
    final Sequence baseSequence = SequenceTestUtils.createSequence(CalculationMethod.AUTONUMERING,
        null, null, "100", ControlDigit.NONE);
    OBDal.getInstance().save(baseSequence);
    final Sequence parentSequence = SequenceTestUtils.createSequence(CalculationMethod.SEQUENCE,
        baseSequence, "06", null, ControlDigit.MODULE10);
    OBDal.getInstance().save(parentSequence);
    assertTrue(
        "Sequence with control digit Module 10 and base sequence with numeric suffix is not created.",
        parentSequence != null);

    baseSequence.setSuffix("102");
    OBDal.getInstance().save(baseSequence);
    assertTrue(
        "Sequence with control digit Module 10 and base sequence with numeric prefix is not updated.",
        baseSequence.getSuffix() == "102");
  }
}
