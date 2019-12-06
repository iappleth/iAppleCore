package org.openbravo.cache.corecaches;

import java.util.Map;

import org.openbravo.cache.CacheManager;
import org.openbravo.dal.security.OrganizationStructureProvider;

public class OSPCacheManager
    extends CacheManager<String, Map<String, OrganizationStructureProvider.OrgNode>> {

  private static final String CACHE_IDENTIFIER = "OrganizationStructure";

  @Override
  public String getCacheIdentifier() {
    return CACHE_IDENTIFIER;
  }

}
