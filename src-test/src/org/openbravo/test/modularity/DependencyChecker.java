package org.openbravo.test.modularity;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.is;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.hibernate.criterion.Restrictions;
import org.junit.Test;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.client.kernel.KernelUtils;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.module.Module;
import org.openbravo.model.ad.utility.DataSet;
import org.openbravo.model.ad.utility.DataSetTable;
import org.openbravo.test.base.OBBaseTest;

public class DependencyChecker extends OBBaseTest {
  private static final Logger log = LogManager.getLogger();
  private static final Entity MODULE_ENTITY = ModelProvider.getInstance().getEntity(Module.class);

  private static final Set<String> OB3 = Set.of( //
      "0", // org.openbravo
      "0138E7A89B5E4DC3932462252801FFBC", // org.openbravo.v3
      "0A060B2AF1974E8EAA8DB61388E9AECC", // org.openbravo.client.querylist
      "2758CD25B2704AF6BBAD10365FC82C06", // org.openbravo.client.myob
      "2A5EE903D7974AC298C0504FBC4501A7", // org.openbravo.financial.paymentreport
      "3A3A943684D64DEF9EC39F588A656848", // org.openbravo.reports.ordersawaitingdelive
      "4B828F4D03264080AA1D2057B13F613C", // org.openbravo.client.kernel
      "5EB4F15C80684ACA904756BDC12ADBE5", // org.openbravo.userinterface.selector
      "7E48CDD73B7E493A8BED4F7253E7C989", // org.openbravo.v3.framework
      "883B5872CA0548F9AF2BBBE7D2DDFA61", // org.openbravo.v3.datasets
      "8A098711BB324335A19833286BDB093D", // org.openbravo.apachejdbcconnectionpool
      "8A34B301DC524EA3A07513DF9F42CC90", // org.openbravo.utility.cleanup.log
      "96998CBC42744B3DBEE28AC8095C9335", // org.openbravo.userinterface.skin.250to300C
      "9BA0836A3CD74EE4AB48753A47211BCC", // org.openbravo.client.application
      "A44B9BA75C354D8FB2E3F7D6EB6BFDC4", // org.openbravo.service.datasource
      "A918E3331C404B889D69AA9BFAFB23AC", // org.openbravo.advpaymentmngt
      "C70732EA90A14EC0916078B85CC33D2D", // org.openbravo.base.weld
      "D393BE6F22BB44B7B728259B34FC795A", // org.openbravo.client.htmlwidget
      "EC356CEE3D46416CA1EBEEB9AB82EDB9", // org.openbravo.userinterface.smartclient
      "F8D1B3ECB3474E8DA5C216473C840DF1", // org.openbravo.service.json
      "FF8080812D842086012D844F3CC0003E", // org.openbravo.client.widgets
      "FF8080813129ADA401312CA1222A0005", // org.openbravo.service.integration.google
      "FF8080813141B198013141B86DD70003" // org.openbravo.service.integration.openid
  );

  @Test
  public void checkDependencies() {
    setSystemAdministratorContext();

    Map<String, Set<String>> allDeps = getAllModuleDependencies();

    OBCriteria<DataSet> q = OBDal.getInstance()
        .createCriteria(DataSet.class)
        .add(Restrictions.eq(DataSet.PROPERTY_SEARCHKEY, "AD"));
    List<DataSetTable> dsTables = ((DataSet) q.uniqueResult()).getDataSetTableList();
    @SuppressWarnings("serial")
    List<String> errors = new ArrayList<>() {
      @Override
      public String toString() {
        return this.stream().collect(Collectors.joining("\n"));
      }
    };
    for (DataSetTable dsTable : dsTables) {

      Entity m = ModelProvider.getInstance().getEntityByTableId(dsTable.getTable().getId());

      ReferencedEntitiesWithModules r = new ReferencedEntitiesWithModules(m);
      if (!r.hasModule() || !r.hasReferencesToModuleEntities()) {
        continue;
      }

      List<BaseOBObject> bobs = OBDal.getInstance()
          .createCriteria(r.entity.getName())
          .add(Restrictions.isNotNull(r.moduleProperty.getName()))
          .list();

      for (BaseOBObject bob : bobs) {
        Module bobModule = (Module) bob.get(r.moduleProperty.getName());

        for (Property p : r.fksToEntitiesWithModule) {
          BaseOBObject referencedBob = (BaseOBObject) bob.get(p.getName());
          if (referencedBob == null) {
            continue;
          }

          Module referencedBobModule = (Module) referencedBob.get(
              ReferencedEntitiesWithModules.getModuleProperty(referencedBob.getEntity()).getName());

          if (!isDependency(bobModule.getId(), referencedBobModule.getId(), allDeps)) {
            errors.add(bob + " - module [" + bobModule.getId() + "] " + bobModule.getJavaPackage()
                + "\n" + "  " + p.getName() + " ->" + referencedBob + " - module ["
                + referencedBobModule.getId() + "] " + referencedBobModule.getJavaPackage());
          }
        }
      }

    }
    if (!errors.isEmpty()) {
      log.error("Incorrect dependencies:\n{}", errors.toString());
    }
    assertThat(errors, is(empty()));
  }

  private boolean isDependency(String referencedModuleId, String baseModuleId,
      Map<String, Set<String>> allDeps) {
    // OB3 pack is already messed up! It's not worth to try to fix it.
    // note we also allow here incorrect dependencies to any ob3 module (ie. defining dep on core
    // but making using of client.kernell stuff)
    if (OB3.contains(baseModuleId)) {
      return true;
    }

    return allDeps.get(baseModuleId).contains(referencedModuleId);
  }

  private static Map<String, Set<String>> getAllModuleDependencies() {
    log.info("Calculating all dependencies...");
    Map<String, Set<String>> deps = new HashMap<>();
    for (Module mod : OBDal.getInstance()
        .createCriteria(Module.class)
        .add(Restrictions.not(Restrictions.in(Module.PROPERTY_ID, OB3)))
        .list()) {
      deps.put(mod.getId(), KernelUtils.getInstance().getAncestorsDependencyTree(mod));
    }
    log.info("Dependencies calculated");
    return deps;

  }

  private static class ReferencedEntitiesWithModules {
    private Entity entity;
    private Property moduleProperty;
    private Set<Property> fksToEntitiesWithModule;

    ReferencedEntitiesWithModules(Entity e) {
      entity = e;
      moduleProperty = e.getProperties()
          .stream()
          .filter(p -> MODULE_ENTITY.equals(p.getTargetEntity()))
          .findFirst()
          .orElse(null);

      if (moduleProperty == null) {
        return;
      }

      fksToEntitiesWithModule = e.getProperties()
          .stream()
          .filter(p -> p.getTargetEntity() != null && !p.isOneToMany()
              && getModuleProperty(p.getTargetEntity()) != null)
          .collect(Collectors.toSet());

    }

    boolean hasModule() {
      return moduleProperty != null;
    }

    boolean hasReferencesToModuleEntities() {
      return !fksToEntitiesWithModule.isEmpty();
    }

    private static Property getModuleProperty(Entity m) {
      return m.getProperties()
          .stream()
          .filter(p -> MODULE_ENTITY.equals(p.getTargetEntity()))
          .findFirst()
          .orElse(null);
    }

    @Override
    public String toString() {
      return entity + "  " + moduleProperty + " " + fksToEntitiesWithModule;
    }
  }
}
