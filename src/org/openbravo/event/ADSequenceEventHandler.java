/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.0  (the  "License"),  being   the  Mozilla   Public  License
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
 *************************************************************************
 */
package org.openbravo.event;

import java.util.List;

import javax.enterprise.event.Observes;

import org.apache.commons.lang.StringUtils;
import org.hibernate.criterion.Restrictions;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.client.kernel.event.EntityNewEvent;
import org.openbravo.client.kernel.event.EntityPersistenceEvent;
import org.openbravo.client.kernel.event.EntityPersistenceEventObserver;
import org.openbravo.client.kernel.event.EntityUpdateEvent;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.erpCommon.utility.SequenceUtil.CalculationMethod;
import org.openbravo.erpCommon.utility.SequenceUtil.ControlDigit;
import org.openbravo.erpCommon.utility.SequenceUtil.SequenceNumberLength;
import org.openbravo.model.ad.utility.Sequence;

/**
 * This class validates that sequence being set as base sequence should not have alphanumeric
 * prefix/suffix values if it is configured in parent sequence having control digit as Module 10.
 * 
 * Alternatively sequence that is already used as base sequence should not have alphanumeric prefix
 * and suffix values when the control digit is calculated using Module 10 algorithm in its parent
 * sequence.
 * 
 * Validates that sequences with control digit Module 10 should not have alphanumeric prefix/suffix.
 * 
 */

class ADSequenceEventHandler extends EntityPersistenceEventObserver {
  private static Entity[] entities = {
      ModelProvider.getInstance().getEntity(Sequence.ENTITY_NAME) };

  @Override
  protected Entity[] getObservedEntities() {
    return entities;
  }

  public void onSave(@Observes EntityNewEvent event) {
    if (!isValidEvent(event)) {
      return;
    }

    Sequence sequence = (Sequence) event.getTargetInstance();

    // validate sequence and its base sequence when it has Module 10 Control Digit
    if (hasModule10Controldigit(sequence)) {
      validateSequencePrefixSuffix(sequence);
    }

    // validate base sequence
    Sequence baseSequence = sequence.getBaseSequence();
    if (baseSequence != null) {
      validateBaseSequence(baseSequence);
    }

    // Clears Sequence Length if Sequence Number Length is not Fix Length
    clearSequenceLength(event);

    // clears Base Sequence if Calculation Method is not Based on Sequence
    clearBaseSequence(event);
  }

  public void onUpdate(@Observes EntityUpdateEvent event) {
    if (!isValidEvent(event)) {
      return;
    }

    Sequence sequence = (Sequence) event.getTargetInstance();
    final Entity sequenceEntity = ModelProvider.getInstance().getEntity(Sequence.ENTITY_NAME);
    final Property prefixProperty = sequenceEntity.getProperty(Sequence.PROPERTY_PREFIX);
    final Property suffixProperty = sequenceEntity.getProperty(Sequence.PROPERTY_SUFFIX);
    final Property baseSequenceProperty = sequenceEntity
        .getProperty(Sequence.PROPERTY_BASESEQUENCE);
    final Property controlDigitProperty = sequenceEntity
        .getProperty(Sequence.PROPERTY_CONTROLDIGIT);

    // validate sequence

    String currentControlDigit = (String) event.getCurrentState(controlDigitProperty);
    String previousControlDigit = (String) event.getPreviousState(controlDigitProperty);
    String currentPrefix = (String) event.getCurrentState(prefixProperty);
    String previousPrefix = (String) event.getPreviousState(prefixProperty);
    String currentSuffix = (String) event.getCurrentState(suffixProperty);
    String previousSuffix = (String) event.getPreviousState(suffixProperty);
    boolean isCurrentPrefixChanged = currentPrefix != null
        && (previousPrefix == null || !previousPrefix.equals(currentPrefix));
    boolean isCurrentSuffixChanged = currentSuffix != null
        && (previousSuffix == null || !previousSuffix.equals(currentSuffix));
    boolean isControlDigitChanged = !(StringUtils.equals(previousControlDigit,
        currentControlDigit));

    // Check when prefix or suffix is being changed
    if ((isCurrentPrefixChanged || isCurrentSuffixChanged)) {
      validateSequenceControlDigit(sequence);
    }
    // check when control digit is being changed
    if (isControlDigitChanged) {
      validateSequencePrefixSuffix(sequence);
    }

    // validate base sequence
    Sequence currentBaseSequence = (Sequence) event.getCurrentState(baseSequenceProperty);
    Sequence previousBaseSequence = (Sequence) event.getPreviousState(baseSequenceProperty);
    boolean isCurrentBaseSequenceChanged = currentBaseSequence != null
        && (previousBaseSequence == null || !previousBaseSequence.equals(currentBaseSequence));

    // Check whether sequence being used as current base sequence does not have sequence
    // as its base sequence to avoid infinite loop in the recursive check
    if (currentBaseSequence != null) {
      checkForValidBaseSequence(currentBaseSequence.getId(), sequence.getId());
    }

    // When base sequence is being changed
    if (currentBaseSequence != null && isCurrentBaseSequenceChanged) {
      if (hasModule10Controldigit(sequence)) {
        validateSequencePrefixSuffix(currentBaseSequence);
      }
      // validateBaseSequence(currentBaseSequence);
    }

    // When control digit is being changed
    if (isControlDigitChanged) {
      validateSequencePrefixSuffix(sequence);
    }

    // Clears Sequence Length if Sequence Number Length is not Fix Length
    clearSequenceLength(event);

    // clears Base Sequence if Calculation Method is not Based on Sequence
    clearBaseSequence(event);
  }

  /**
   * Checks whether sequence is configured with Module 10 control digit.
   * 
   * @param sequence
   *          Input Sequence
   * @return whether sequence has Module 10 control digit
   */
  private boolean hasModule10Controldigit(Sequence sequence) {
    return ControlDigit.MODULE10.value.equals(sequence.getControlDigit());
  }

  /**
   * This method validates whether base sequence does not have alphanumeric prefix/suffix and
   * recursively checks it base sequence does not have alphanumeric prefix/suffix.
   * 
   * @param baseSequence
   *          Input sequence that is set as Base Sequence in parent Sequence
   * @param parentWithControlDigit
   *          is parent Sequence of base Sequence set with Module 10 control digit
   */

  private void validateBaseSequence(Sequence baseSequence) {
    if (isPrefixOrSuffixAlphanumericForSequence(baseSequence)
        && hasModule10Controldigit(baseSequence)) {
      throw new OBException(OBMessageUtils.messageBD("ValidateBaseSequence"));
    }
    // check recursively
    if (baseSequence.getBaseSequence() != null) {
      validateBaseSequence(baseSequence.getBaseSequence());
    }
  }

  /**
   * This method validates if sequence has control digit as Module 10 and alphanumeric suffix /
   * prefix and recursively checks whether parent sequence does has control digit as Module 10
   *
   * @param sequence
   *          Input Sequence to validate
   */

  private void validateSequenceControlDigit(Sequence sequence) {
    // Check whether sequence itself has Control Digit as Module 10
    if (isPrefixOrSuffixAlphanumericForSequence(sequence) && hasModule10Controldigit(sequence)) {
      throw new OBException(OBMessageUtils.messageBD("ValidateSequence"));
    }
    // Check recursively whether parent sequence has Module 10. Control Digit.
    if (checkAllParentSequencesthatHasInputSequenceAsItsBaseSequence(sequence.getId())) {
      throw new OBException(OBMessageUtils.messageBD("ValidateBaseSequence"));
    }

  }

  /**
   * This method validates sequence should not have alphanumeric prefix/suffix or recursively check
   * its base sequences does not have alphanumeric prefix/suffix
   * 
   * @param sequence
   *          Input Sequence to validate
   */

  private void validateSequencePrefixSuffix(Sequence sequence) {
    if (isPrefixOrSuffixAlphanumericForSequence(sequence)) {
      throw new OBException(OBMessageUtils.messageBD("ValidateSequence"));
    }
    // check recursively
    if (sequence.getBaseSequence() != null) {
      validateSequencePrefixSuffix(sequence.getBaseSequence());
    }
  }

  /**
   * This method detects whether sequence has alphanumeric prefix or suffix
   * 
   * @param sequence
   *          Input sequence
   * @return whether prefix/suffix of sequence is alphanumeric
   */

  private boolean isPrefixOrSuffixAlphanumericForSequence(Sequence sequence) {
    String prefix = sequence.getPrefix();
    String suffix = sequence.getSuffix();
    return ((prefix != null && !StringUtils.isNumeric(prefix))
        || (suffix != null && !StringUtils.isNumeric(suffix)));
  }

  /**
   * check recursively all parent sequences does not have Module 10 control digit
   */
  private boolean checkAllParentSequencesthatHasInputSequenceAsItsBaseSequence(String sequenceId) {
    for (Sequence parentSequence : getAllParentSequence(sequenceId)) {
      if (hasModule10Controldigit(parentSequence)) {
        // Return only when any one of the parent sequence found with Module 10 control digit
        return true;
      } else {
        return checkAllParentSequencesthatHasInputSequenceAsItsBaseSequence(parentSequence.getId());
      }
    }
    return false;
  }

  /**
   * This method gives the list of sequence that has input parameter sequence as base sequence
   *
   * @param sequenceId
   *          Input Sequence ID
   * @return list of sequences that have sequence as its base sequence
   */
  private List<Sequence> getAllParentSequence(String sequenceId) {
    OBCriteria<Sequence> seqCriteria = OBDal.getInstance().createCriteria(Sequence.class);
    seqCriteria.add(Restrictions.eq(Sequence.PROPERTY_BASESEQUENCE + ".id", sequenceId));
    seqCriteria.add(Restrictions.ne(Sequence.PROPERTY_ID, sequenceId));
    return seqCriteria.list();

  }

  /**
   * Check whether sequence being used as base sequence or its subsequent base sequences does not
   * have sequence with id sequenceId as its base sequence to avoid infinite loop in recursive check
   */
  private void checkForValidBaseSequence(String currentBaseSequenceId, String sequenceId) {
    if (StringUtils.equals(currentBaseSequenceId, sequenceId)) {
      throw new OBException(OBMessageUtils.messageBD("NotValidBaseSequence"));
    }
    Sequence sequence = OBDal.getInstance().get(Sequence.class, currentBaseSequenceId);
    // Base case: sequence is null or it doesn't have a base sequence
    if (sequence == null || sequence.getBaseSequence() == null) {
      return;
    }

    // Recursive case: sequence has a base sequence
    checkForValidBaseSequence(sequence.getBaseSequence().getId(), sequenceId);
  }

  /**
   * This method clears the Sequence Length in Sequence if Sequence Type is not Fix Length
   */
  private void clearSequenceLength(EntityPersistenceEvent event) {
    final Entity sequenceEntity = ModelProvider.getInstance().getEntity(Sequence.ENTITY_NAME);
    final Property sequenceNumberLengthProperty = sequenceEntity
        .getProperty(Sequence.PROPERTY_SEQUENCENUMBERLENGTH);
    final Property sequenceLengthProperty = sequenceEntity
        .getProperty(Sequence.PROPERTY_SEQUENCELENGTH);
    String currentSequenceNumberLength = (String) event
        .getCurrentState(sequenceNumberLengthProperty);
    Long currentSequenceLength = (Long) event.getCurrentState(sequenceLengthProperty);

    if (!StringUtils.equals(currentSequenceNumberLength, SequenceNumberLength.FIXED.value)
        && currentSequenceLength != null) {
      event.setCurrentState(sequenceLengthProperty, null);
    }
  }

  /**
   * This method clears the Base Sequence in Sequence if Calculation Method is not Based on
   * Sequence.
   */
  private void clearBaseSequence(EntityPersistenceEvent event) {
    final Entity sequenceEntity = ModelProvider.getInstance().getEntity(Sequence.ENTITY_NAME);
    final Property baseSequenceProperty = sequenceEntity
        .getProperty(Sequence.PROPERTY_BASESEQUENCE);
    final Property calculationMethodProperty = sequenceEntity
        .getProperty(Sequence.PROPERTY_CALCULATIONMETHOD);
    Sequence currentBaseSequence = (Sequence) event.getCurrentState(baseSequenceProperty);
    String currentSequenceType = (String) event.getCurrentState(calculationMethodProperty);

    if (!StringUtils.equals(currentSequenceType, CalculationMethod.SEQUENCE.value)
        && currentBaseSequence != null) {
      event.setCurrentState(baseSequenceProperty, null);
    }
  }

}
