package org.openbravo.cache.corecaches;

import java.util.Map;

import javax.enterprise.context.ApplicationScoped;

import org.openbravo.cache.CacheManager;
import org.openbravo.cache.impl.ConcurrentMapCacheManager;
import org.openbravo.dal.security.OrganizationStructureProvider;

@ApplicationScoped
@CacheManager.Qualifier("OrganizationStructure")
public class OSPCacheManager
    extends ConcurrentMapCacheManager<String, Map<String, OrganizationStructureProvider.OrgNode>> {

}
