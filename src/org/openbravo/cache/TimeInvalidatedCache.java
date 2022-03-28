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

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import com.github.benmanes.caffeine.cache.LoadingCache;

/**
 * Cache API that allows creating a cache that will be invalidated after a period of time
 * 
 * This Cache will be invalidated after a period x of time after a write action on the cache due to
 * a read key. That means this cache is lazy, it will only compute a value of a given key if this
 * key is accessed.
 * 
 * Use the newBuilder static function to create a new cache and then follow the builder structure.
 * 
 * @param <T>
 *          - Key used by the Cache(for example String for a UUID)
 * @param <V>
 *          - Value used by the Cache
 */
public class TimeInvalidatedCache<T, V> {
  private static Logger logger = LogManager.getLogger();

  private LoadingCache<T, V> cache;
  private String name;

  /**
   * Creates a new instance of {@link TimeInvalidatedCacheBuilder}, class contains instructions on
   * building a TimeInvalidatedCache.
   * 
   * @return a new {@link TimeInvalidatedCacheBuilder} object
   */
  public static TimeInvalidatedCacheBuilder<Object, Object> newBuilder() {
    return new TimeInvalidatedCacheBuilder<>();
  }

  TimeInvalidatedCache(String name, LoadingCache<T, V> cache) {
    this.name = name;
    this.cache = cache;
  }

  /**
   * Returns a value from the cache associated to a given key
   * 
   * @param key
   *          - Key to retrieve corresponding value
   * @return - Value corresponding to given key
   * @throws NullPointerException
   *           – if the specified key is null (not the value associated with the key)
   */
  public V get(T key) {
    logger.trace("Cache {} get key {} has been executed.", name, key);
    return cache.get(key);
  }

  /**
   * Returns a value from the cache associated to a given key. If the key is not in the cache and is
   * not computable, it will return the result of executing the provided mappingFunction.
   *
   * @param key
   *          - Key to retrieve corresponding value
   * @param mappingFunction
   *          - Mapping function that will compute the value of the key if not present in the cache
   * @return - Value corresponding to given key
   * @throws NullPointerException
   *           – if the specified key is null (not the value associated with the key)
   */
  public V get(T key, Function<? super T, ? extends V> mappingFunction) {
    V result = cache.get(key);
    logger.trace("Cache {} getAll with mappingFunction, has been executed with key {}.", name, key);
    if (result != null) {
      return result;
    }
    return cache.get(key, mappingFunction);
  }

  /**
   * Returns a map of Key-Value of all the given keys
   * 
   * @param keys
   *          - Collection of keys to retrieve values from
   * @return - map of Key-Value of all the given keys
   * @throws NullPointerException
   *           – if any of the specified keys is null (not the value associated with the key)
   */
  public Map<T, V> getAll(Collection<T> keys) {
    logger.trace("Cache {} getAll keys {} has been executed.", name, keys);
    return cache.getAll(keys);
  }

  /**
   * Returns a map of Key-Value of all the given keys. If the keys are not in the cache and some are
   * not computable, it will return the result of executing the provided mappingFunction for those
   * keys.
   *
   * @param keys
   *          - Collection of keys to retrieve values from
   * @param mappingFunction
   *          - Mapping function that will compute the values of the keys if not present in the
   *          cache
   * @return - map of Key-Value of all the given keys
   * @throws NullPointerException
   *           – if any of the specified keys is null (not the value associated with the key)
   */
  public Map<T, V> getAll(Collection<T> keys,
      Function<? super Set<? extends T>, ? extends Map<? extends T, ? extends V>> mappingFunction) {
    Map<T, V> cachedKeys = cache.getAll(keys);
    logger.trace("Cache {} getAll with mappingFunction, has been executed with keys {}.", name,
        keys);
    if (cachedKeys.keySet().containsAll(keys)) {
      return cachedKeys;
    }
    return cache.getAll(keys, mappingFunction);
  }

  /**
   * Invalidates given key in the cache
   */
  public void invalidate(T key) {
    cache.invalidate(key);
    logger.trace("{} key in cache {} has been invalidated.", key, name);
  }

  /**
   * Invalidates all the keys in the cache
   */
  public void invalidateAll() {
    cache.invalidateAll();
    logger.trace("Cache {} has been invalidated(all keys).", name);
  }

  /**
   * Name of the cache
   * 
   * @return Name of the cache
   */
  public String getName() {
    return name;
  }

}
