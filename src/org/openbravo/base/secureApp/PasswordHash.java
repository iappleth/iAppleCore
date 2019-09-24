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
 * All portions are Copyright (C) 2019 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.base.secureApp;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.hibernate.criterion.Restrictions;
import org.jboss.weld.exceptions.IllegalStateException;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.access.User;

/**
 * Handles hashing passwords to be stored in database supporting different
 * {@link HashingAlgorithm}s.
 */
public abstract class PasswordHash {
  public static final Logger log = LogManager.getLogger();
  private static final int DEFAULT_CURRENT_ALGORITHM_VERSION = 1;

  private static final Map<Integer, HashingAlgorithm> ALGORITHMS = Map.of(0, new SHA1(), 1,
      new SHA512Salt());

  private PasswordHash() {
  }

  /** Determines the algorithm used to hash a given password. */
  public static HashingAlgorithm getAlgorithm(String hash) {
    HashingAlgorithm algorithm = ALGORITHMS.get(getVersion(hash));

    if (algorithm == null) {
      throw new IllegalStateException(
          "Hashing alorightm version " + getVersion(hash) + " is not implemented");
    }

    return algorithm;
  }

  /**
   * Checks if userName matches password, returning an {@link Optional} {@link User} in case it
   * matches.
   * 
   * <p>
   * <b>Important Note</b>: In case password matches with the current one for the user, but it was
   * hashed with a {@link HashingAlgorithm} with a version lower than current default, hash will be
   * updated with the default algorithm. In this case, DAL current transaction will be flushed to
   * DB.
   * 
   * @param userName
   *          user name to check
   * @param password
   *          user's password in plain text as provided by the user
   * @return an {@code Optional} describing the {@code User} matching the provided {@code userName}
   *         and {@code password} pair; or an empty {@code Optional} if there is no {@code User}
   *         matching them
   */
  public static Optional<User> getUserWithPassword(String userName, String password) {
    OBContext.setAdminMode(false);
    try {
      User user = (User) OBDal.getInstance()
          .createCriteria(User.class)
          .add(Restrictions.eq(User.PROPERTY_USERNAME, userName))
          .setFilterOnActive(true)
          .setFilterOnReadableClients(false)
          .setFilterOnReadableOrganization(false)
          .uniqueResult();

      if (user == null) {
        // no user for given userName
        return Optional.empty();
      }

      HashingAlgorithm algorithm = getAlgorithm(user.getPassword());

      if (!algorithm.check(password, user.getPassword())) {
        // invalid password
        return Optional.empty();
      }

      if (algorithm.getAlgorithmVersion() < DEFAULT_CURRENT_ALGORITHM_VERSION) {
        log.debug("Upgrading password hash for user {}, from algorithm version {} to {}.",
            user.getUsername(), algorithm.getAlgorithmVersion(), DEFAULT_CURRENT_ALGORITHM_VERSION);
        String newPassword = ALGORITHMS.get(DEFAULT_CURRENT_ALGORITHM_VERSION)
            .generateHash(password);
        user.setPassword(newPassword);
        OBDal.getInstance().flush();
      }
      return Optional.of(user);
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  public static HashingAlgorithm getDefaultAlgorithm() {
    return ALGORITHMS.get(DEFAULT_CURRENT_ALGORITHM_VERSION);
  }

  public static boolean matches(String plainTextPassword, String hashedPassword) {
    HashingAlgorithm algorithm = getAlgorithm(hashedPassword);
    log.trace("Checking password with algorithm {}", () -> algorithm.getClass().getSimpleName());
    return algorithm.check(plainTextPassword, hashedPassword);
  }

  private static int getVersion(String hash) {
    int idx = hash.indexOf('$');
    if (idx == -1) {
      return 0;
    }
    return Integer.parseInt(hash.substring(0, idx));
  }

  public abstract static class HashingAlgorithm {
    public abstract String generateHash(String password);

    protected abstract int getAlgorithmVersion();

    protected abstract boolean check(String plainTextPassowed, String hashedPassword);

    protected abstract String getHashingBaseAlgorithm();

    protected String hash(String plainText, String salt) {
      try {
        MessageDigest md = MessageDigest.getInstance(getHashingBaseAlgorithm());
        if (salt != null) {
          md.update(salt.getBytes(StandardCharsets.UTF_8));
        }

        byte[] bytes = md.digest(plainText.getBytes(StandardCharsets.UTF_8));

        return Base64.getEncoder().encodeToString(bytes);
      } catch (NoSuchAlgorithmException e) {
        log.error("Error getting hashing algorithm", e);
        return "";
      }
    }
  }

  private static class SHA1 extends HashingAlgorithm {
    @Override
    protected String getHashingBaseAlgorithm() {
      return "SHA-1";
    }

    @Override
    protected boolean check(String plainTextPassword, String hashedPassword) {
      return hash(plainTextPassword, null).equals(hashedPassword);
    }

    @Override
    protected int getAlgorithmVersion() {
      return 0;
    }

    @Override
    public String generateHash(String password) {
      return hash(password, null);
    }

  }

  private static class SHA512Salt extends HashingAlgorithm {
    private static final Random RANDOM = new SecureRandom();

    @Override
    protected String getHashingBaseAlgorithm() {
      return "SHA-512";
    }

    @Override
    protected boolean check(String plainTextPassword, String hashedPassword) {
      String[] hashParts = hashedPassword.split("\\$");
      String salt = hashParts[1];
      String orginalHash = hashParts[2];

      return hash(plainTextPassword, salt).equals(orginalHash);
    }

    @Override
    protected int getAlgorithmVersion() {
      return 1;
    }

    @Override
    public String generateHash(String password) {
      byte[] rawSalt = new byte[16];
      RANDOM.nextBytes(rawSalt);
      String salt = Base64.getEncoder().withoutPadding().encodeToString(rawSalt);
      String hash = hash(password, salt);
      return getAlgorithmVersion() + "$" + salt + "$" + hash;
    }
  }
}
