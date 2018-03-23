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
package org.openbravo.base.secureApp;

import java.util.ArrayList;
import java.util.List;

public class PasswordStrengthChecker {
  private final int MINIMUM_LENGTH = 8;
  private final int MIN_REQUIRED_CRITERIA = 3;

  private PasswordStrengthCriterion minimumLength;
  private List<PasswordStrengthCriterion> strengthCriteria;

  public PasswordStrengthChecker() {
    minimumLength = getMinimumLengthCriterion();
    strengthCriteria = new ArrayList<>();
    strengthCriteria.add(getUppercaseCriterion());
    strengthCriteria.add(getLowercaseCriterion());
    strengthCriteria.add(getDigitsCriterion());
    strengthCriteria.add(getSpecialCharactersCriterion());
  }

  public boolean check(String password) {
    return minimumLength.match(password) && (getCriteriaScore(password) >= MIN_REQUIRED_CRITERIA);
  }

  private int getCriteriaScore(String password) {
    int score = 0;

    for(PasswordStrengthCriterion criterion : strengthCriteria) {
      if(criterion.match(password)) {
        score += 1;
      }
    }

    return score;
  }

  private PasswordStrengthCriterion getMinimumLengthCriterion() {
    return new PasswordStrengthCriterion() {
      @Override
      public boolean match(String password) {
        return password.length() >= MINIMUM_LENGTH;
      }
    };
  }

  private PasswordStrengthCriterion getUppercaseCriterion() {
    return new PasswordStrengthCriterion() {
      @Override
      public boolean match(String password) {
        return password.matches(".*[A-Z].*");
      }
    };
  }

  private PasswordStrengthCriterion getLowercaseCriterion() {
    return new PasswordStrengthCriterion() {
      @Override
      public boolean match(String password) {
        return password.matches(".*[a-z].*");
      }
    };
  }

  private PasswordStrengthCriterion getDigitsCriterion() {
    return new PasswordStrengthCriterion() {
      @Override
      public boolean match(String password) {
        return password.matches(".*[0-9].*");
      }
    };
  }

  private PasswordStrengthCriterion getSpecialCharactersCriterion() {
    return new PasswordStrengthCriterion() {
      @Override
      public boolean match(String password) {
        return password.matches(".*[`~!@#$%€^&*()_\\-+={}\\[\\]|:;\"' <>,.?/].*");
      }
    };
  }

  private interface PasswordStrengthCriterion {
    boolean match(String password);
  }
}