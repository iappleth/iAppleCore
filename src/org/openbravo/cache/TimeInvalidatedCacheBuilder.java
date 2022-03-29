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
 * All portions are Copyright (C) 2022 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.cache;

import java.time.Duration;
import java.util.function.Function;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openbravo.base.exception.OBException;

import com.github.benmanes.caffeine.cache.CacheLoader;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Ticker;

/**
 * Allows building a TimeInvalidatedCache and initializing it. Do not instantiate directly, instead
 * use {@link TimeInvalidatedCache#newBuilder()} method to create a new instance of this class.
 *
 * Expects to be called as follows:
 *
 * <pre>
 * TimeInvalidatedCache.newBuilder()
 *     .name("CacheName") // Required name of the cache
 *     .expireAfterDuration(Duration.ofMinutes(5)) // Could be any Duration, not necessarily in
 *                                                 // minutes. If not executed, 1 minute default
 *                                                 // is assumed
 *     .build(key -> generateKeyValue(key))     // This is a lambda that initializes the key if it
 *  *                                           // expired or is the first time reading it. It is
 *  *                                           // required.
 * </pre>
 * 
 * @param <T>
 *          Key type used in cache
 * @param <V>
 *          Value type used in cache
 */
public class TimeInvalidatedCacheBuilder<T, V> {
  private static Logger logger = LogManager.getLogger();

  private Duration expireDuration;
  private Ticker ticker;
  private String name;

  /**
   * Instantiate through {@link TimeInvalidatedCache#newBuilder()} method
   */
  TimeInvalidatedCacheBuilder() {
  }

  /**
   * Builds the TimeInvalidatedCache and initializes it. Expects to be called as follows:
   *
   * @param loader
   *          - lambda that initializes the key if it expired or is the first time it is read. It
   *          should receive a key and return the value corresponding to it
   *
   * @return {@link TimeInvalidatedCache} fully built object
   * @throws OBException
   *           If name or loader have not been set previous to executing the build function
   * @throws IllegalArgumentException
   *           if duration is negative (previously executing expireDuration())
   * @throws IllegalStateException
   *           if the time to live or variable expiration was already set (previously executing
   *           expireDuration())
   * @throws ArithmeticException
   *           for durations greater than +/- approximately 292 year (previously executing
   *           expireDuration())
   */
  public <T1 extends T, V1 extends V> TimeInvalidatedCache<T1, V1> build(
      Function<? super T1, V1> loader) {
    if (name == null) {
      throw new OBException(
          "Name must be set prior to executing TimeInvalidatedCacheBuilder build function.");
    }
    if (expireDuration == null) {
      this.expireDuration = Duration.ofMinutes(1);
    }

    Caffeine<Object, Object> cacheBuilder = Caffeine.newBuilder();
    cacheBuilder.expireAfterWrite(expireDuration);
    if (this.ticker != null) {
      cacheBuilder.ticker(ticker);
    }

    CacheLoader<T1, V1> cacheLoader = new CacheLoader<>() {
      @Override
      public V1 load(T1 key) {
        return loader.apply(key);
      }
    };

    TimeInvalidatedCache<T1, V1> cache = new TimeInvalidatedCache<>(name,
        cacheBuilder.build(cacheLoader));
    logger.trace("Cache {} has been built with expireDuration {} ms.", name,
        expireDuration.toMillis());
    return cache;
  }

  /**
   * Sets the name of the cache, used for logging purposes, it is always required
   * 
   * @param nameToSet
   *          Cache name
   * @return this object
   */
  public TimeInvalidatedCacheBuilder<T, V> name(String nameToSet) {
    this.name = nameToSet;
    return this;
  }

  /**
   * Sets the expiration duration, after this period the key is considered expired and reloaded on
   * the next access. If not invoked, defaults to 1 minute.
   *
   * @param duration
   *          Duration of time after which is considered expired
   * @return this object
   */
  public TimeInvalidatedCacheBuilder<T, V> expireAfterDuration(Duration duration) {
    this.expireDuration = duration;
    return this;
  }

  /**
   * Internal API, used only for testing
   *
   * @param tickerToSet
   *          Ticker to be used instead of the default system one
   * @return this object
   */
  TimeInvalidatedCacheBuilder<T, V> ticker(Ticker tickerToSet) {
    this.ticker = tickerToSet;
    return this;
  }
}
