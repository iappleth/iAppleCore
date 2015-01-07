package org.openbravo.test.costing;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.math.BigDecimal;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.criterion.Restrictions;
import org.junit.Test;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.erpCommon.ad_forms.AcctServer;
import org.openbravo.model.ad.access.User;
import org.openbravo.model.ad.datamodel.Table;
import org.openbravo.model.ad.domain.Preference;
import org.openbravo.model.ad.process.ProcessInstance;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.ad.ui.Process;
import org.openbravo.model.ad.ui.ProcessRequest;
import org.openbravo.model.ad.ui.ProcessRun;
import org.openbravo.model.ad.utility.Sequence;
import org.openbravo.model.common.businesspartner.BusinessPartner;
import org.openbravo.model.common.enterprise.Locator;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.materialmgmt.cost.StockValuation;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOut;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOutLine;
import org.openbravo.model.pricing.pricelist.ProductPrice;
import org.openbravo.service.db.CallStoredProcedure;
import org.openbravo.test.datasource.BaseDataSourceTestDal;

public class TestUnitCost extends BaseDataSourceTestDal {
  // User Openbravo
  private static String USER_ID = "100";
  // Client QA Testing
  private static String CLIENT_ID = "4028E6C72959682B01295A070852010D";
  // Organization Unit Cost Organization
  private static String ORGANIZATION_ID = "467A3C84C1594BDB98A5B0A05E55D0E7";
  // Role QA Testing Admin
  private static String ROLE_ID = "4028E6C72959682B01295A071429011E";
  // Product with name Automatic Test Unit Cost Product
  private static String PRODUCT_ID = "4CE73C45D68F4DD182C48DD921715CC8";
  // Process request with name: Costing Background process and organization Unit Cost Organization
  private static String COSTING_PROCESSREQUEST_ID = "502EF7AF73264B9B8F76A1AAA4BE8887";
  // Warehouse with name Unit Cost Warehouse 1
  private static String WAREHOUSE1_ID = "D453BB97BC8E492D88F08226E3FA5BE7";
  // Warehouse with name Unit Cost Warehouse 2
  private static String WAREHOUSE2_ID = "E4A7094A7FE848A98A836A1F629EC87D";
  // Goods Receipt with documentNo: 10000013
  private static String MOVEMENTIN1_ID = "71B631E99B9441FEA3EF720A6E318C41";
  // Goods Receipt with documentNo: 10000014
  private static String MOVEMENTIN2_ID = "F4C29CE5AADA42C08C7B0A5A45622453";
  // Document Sequence with name: DocumentNo_M_InOut
  private static String SHIPMENTIN_SEQUENCE_ID = "910E14E8BA4A419B92DF9973ACDB8A8F";
  // Unit Cost Warehouse 1 Storage Bin
  private static String LOCATOR1_ID = "A05963E835274A929EF7DFAADED4E5F0";
  // Unit Cost Warehouse 2 Storage Bin
  private static String LOCATOR2_ID = "CE6C68898631430F8A987CD51A67939D";
  // BusinessPartner with name Unit Cost Business Partner EUR
  private static String BPARTNER1_ID = "235242EFA66D498EA1026EB4A002A89F";
  // BusinessPartner with name Unit Cost Business Partner USD
  private static String BPARTNER2_ID = "CC9D7EFA3A1E4BA2AC3F34F9DBDB4868";
  // Language English (USA)
  private static String LANGUAGE_ID = "192";

  // BigDecimals
  private final BigDecimal twoBigDecimal = new BigDecimal("2");
  private final BigDecimal fiveBigDecimal = new BigDecimal("5.00");
  private final BigDecimal tenBigDecimal = new BigDecimal("10.00");
  private final BigDecimal twelvePointFiveBigDecimal = new BigDecimal("12.50");
  private final BigDecimal twentyfiveBigDecimal = new BigDecimal("25.00");

  // Today's date
  static final Date today = new Date();

  @Test
  public void testUnitCost() throws Exception {
    try {
      OBContext.setOBContext(USER_ID, ROLE_ID, CLIENT_ID, ORGANIZATION_ID);
      OBContext.setAdminMode();

      // Change Openbravo profile
      changeProfile(ROLE_ID, LANGUAGE_ID, ORGANIZATION_ID, WAREHOUSE1_ID);

      // Check there is a preference using property "Allow to persist Unit Cost" with value "Y"
      OBCriteria<Preference> preferenceCriteria = OBDal.getInstance().createCriteria(
          Preference.class);
      preferenceCriteria.add(Restrictions.eq(Preference.PROPERTY_PROPERTY, "UnitaryCost"));
      preferenceCriteria.add(Restrictions.eq(Preference.PROPERTY_SEARCHKEY, "Y"));
      assertTrue(preferenceCriteria.list().size() == 1);

      // Create a new product
      Product product = createProduct(this.fiveBigDecimal);

      // Check that there are new lines on the Unit Cost tab with zero values
      OBCriteria<StockValuation> unitCostCriteria = OBDal.getInstance().createCriteria(
          StockValuation.class);
      unitCostCriteria.add(Restrictions.eq(StockValuation.PROPERTY_PRODUCT, product));
      unitCostCriteria.addOrderBy(StockValuation.PROPERTY_WAREHOUSE, true);
      List<StockValuation> unitCostList = unitCostCriteria.list();
      StockValuation unitCostRow1 = unitCostList.get(0);
      assertTrue(unitCostRow1.getStock().equals(BigDecimal.ZERO));
      assertTrue(unitCostRow1.getStockValuation().equals(BigDecimal.ZERO));
      assertTrue(unitCostRow1.getWarehouse().getId().equals(WAREHOUSE1_ID));
      assertTrue(unitCostRow1.getUnitPrice().equals(BigDecimal.ZERO));
      StockValuation unitCostRow2 = unitCostList.get(1);
      assertTrue(unitCostRow2.getStock().equals(BigDecimal.ZERO));
      assertTrue(unitCostRow2.getStockValuation().equals(BigDecimal.ZERO));
      assertTrue(unitCostRow2.getWarehouse().getId().equals(WAREHOUSE2_ID));
      assertTrue(unitCostRow2.getUnitPrice().equals(BigDecimal.ZERO));

      // Create a goods receipt with USD and execute costing background process
      createGoodsReceipt(product.getId(), this.twoBigDecimal, LOCATOR1_ID, BPARTNER1_ID,
          MOVEMENTIN1_ID);

      // Check that the quantities have increased in the Unit Cost tab
      OBCriteria<StockValuation> unitCostCriteria2 = OBDal.getInstance().createCriteria(
          StockValuation.class);
      unitCostCriteria2.add(Restrictions.eq(StockValuation.PROPERTY_PRODUCT, product));
      unitCostCriteria2.addOrderBy(StockValuation.PROPERTY_WAREHOUSE, true);
      List<StockValuation> unitCostList2 = unitCostCriteria2.list();
      StockValuation unitCost2Row1 = unitCostList2.get(0);
      assertTrue(unitCost2Row1.getStock().equals(twoBigDecimal));
      assertTrue(unitCost2Row1.getStockValuation().equals(tenBigDecimal));
      assertTrue(unitCost2Row1.getWarehouse().getId().equals(WAREHOUSE1_ID));
      assertTrue(unitCost2Row1.getUnitPrice().equals(fiveBigDecimal));
      StockValuation unitCost2Row2 = unitCostList2.get(1);
      assertTrue(unitCost2Row2.getStock().equals(BigDecimal.ZERO));
      assertTrue(unitCost2Row2.getStockValuation().equals(BigDecimal.ZERO));
      assertTrue(unitCost2Row2.getWarehouse().getId().equals(WAREHOUSE2_ID));
      assertTrue(unitCost2Row2.getUnitPrice().equals(BigDecimal.ZERO));

      // Create a goods receipt with EUR and execute costing background process
      createGoodsReceipt(product.getId(), this.twoBigDecimal, LOCATOR2_ID, BPARTNER2_ID,
          MOVEMENTIN2_ID);

      // Check that the quantities have increased in the Unit Cost tab
      OBCriteria<StockValuation> unitCostCriteria3 = OBDal.getInstance().createCriteria(
          StockValuation.class);
      unitCostCriteria3.add(Restrictions.eq(StockValuation.PROPERTY_PRODUCT, product));
      unitCostCriteria3.addOrderBy(StockValuation.PROPERTY_WAREHOUSE, true);
      List<StockValuation> unitCostList3 = unitCostCriteria3.list();
      StockValuation unitCost3Row1 = unitCostList3.get(0);
      assertTrue(unitCost3Row1.getStock().equals(twoBigDecimal));
      assertTrue(unitCost3Row1.getStockValuation().equals(tenBigDecimal));
      assertTrue(unitCost3Row1.getWarehouse().getId().equals(WAREHOUSE1_ID));
      assertTrue(unitCost3Row1.getUnitPrice().equals(fiveBigDecimal));
      StockValuation unitCost3Row2 = unitCostList3.get(1);
      assertTrue(unitCost3Row2.getStock().equals(twoBigDecimal));
      assertTrue(unitCost3Row2.getStockValuation().equals(twentyfiveBigDecimal));
      assertTrue(unitCost3Row2.getWarehouse().getId().equals(WAREHOUSE2_ID));
      assertTrue(unitCost3Row2.getUnitPrice().equals(twelvePointFiveBigDecimal));

      // Launch reset unit cost process
      org.openbravo.costing.ResetStockValuation.doResetStockValuation(ORGANIZATION_ID);

      // Check that the quantities are the same
      OBCriteria<StockValuation> unitCostCriteria4 = OBDal.getInstance().createCriteria(
          StockValuation.class);
      unitCostCriteria4.add(Restrictions.eq(StockValuation.PROPERTY_PRODUCT, product));
      unitCostCriteria4.addOrderBy(StockValuation.PROPERTY_WAREHOUSE, true);
      List<StockValuation> unitCostList4 = unitCostCriteria4.list();
      StockValuation unitCost4Row1 = unitCostList4.get(0);
      assertTrue(unitCost4Row1.getStock().equals(twoBigDecimal));
      assertTrue(unitCost4Row1.getStockValuation().equals(tenBigDecimal));
      assertTrue(unitCost4Row1.getWarehouse().getId().equals(WAREHOUSE1_ID));
      assertTrue(unitCost4Row1.getUnitPrice().equals(fiveBigDecimal));
      StockValuation unitCost4Row2 = unitCostList4.get(1);
      assertTrue(unitCost4Row2.getStock().equals(twoBigDecimal));
      assertTrue(unitCost4Row2.getStockValuation().equals(twentyfiveBigDecimal));
      assertTrue(unitCost4Row2.getWarehouse().getId().equals(WAREHOUSE2_ID));
      assertTrue(unitCost4Row2.getUnitPrice().equals(twelvePointFiveBigDecimal));

    } catch (Exception e) {
      System.out.println(e.getMessage());
      throw new OBException(e);
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  // Create a Product cloning a created one
  private Product createProduct(BigDecimal price) {
    return cloneProduct(getNumberOfProductsWithNameStarting() + 1, "I", price);
  }

  // Returns the number of products with name starting with PRODUCT_ID name
  private int getNumberOfProductsWithNameStarting() {
    try {
      Product product = OBDal.getInstance().get(Product.class, PRODUCT_ID);
      final OBCriteria<Product> criteria = OBDal.getInstance().createCriteria(Product.class);
      criteria.add(Restrictions.like(Product.PROPERTY_NAME, product.getName() + "%"));
      return criteria.list().size();
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  // Create a new product cloning another
  private Product cloneProduct(int num, String productType, BigDecimal purchasePrice) {
    try {
      List<String> productIdList = new ArrayList<String>();
      Product product = OBDal.getInstance().get(Product.class, PRODUCT_ID);
      Product productClone = (Product) DalUtil.copy(product, false);
      setGeneralData(productClone);

      productClone.setSearchKey(product.getSearchKey() + num);
      productClone.setName(product.getName() + num);
      productClone.setMaterialMgmtMaterialTransactionList(null);
      productClone.setProductType(productType);
      OBDal.getInstance().save(productClone);

      if (productIdList.isEmpty()) {

        OBCriteria<ProductPrice> criteria = OBDal.getInstance().createCriteria(ProductPrice.class);
        criteria.add(Restrictions.eq(ProductPrice.PROPERTY_PRODUCT, product));
        criteria.addOrderBy(ProductPrice.PROPERTY_CREATIONDATE, true);
        int i = 0;
        for (ProductPrice productPrice : criteria.list()) {
          ProductPrice productPriceClone = (ProductPrice) DalUtil.copy(productPrice, false);
          setGeneralData(productPriceClone);
          productPriceClone.setPriceListVersion(OBDal.getInstance().get(Product.class, PRODUCT_ID)
              .getPricingProductPriceList().get(i).getPriceListVersion());
          productPriceClone.setStandardPrice(purchasePrice);
          productPriceClone.setListPrice(purchasePrice);
          productPriceClone.setProduct(productClone);
          productClone.getPricingProductPriceList().add(productPriceClone);
          i++;
        }
      }

      OBDal.getInstance().save(productClone);
      OBDal.getInstance().flush();
      OBDal.getInstance().refresh(productClone);

      return productClone;
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  // Set common fields in all tables
  private void setGeneralData(BaseOBObject document) {
    try {
      document.set("client", OBDal.getInstance().get(Client.class, CLIENT_ID));
      document.set("organization", OBDal.getInstance().get(Organization.class, ORGANIZATION_ID));
      document.set("active", true);
      document.set("creationDate", new Date());
      document.set("createdBy", OBDal.getInstance().get(User.class, USER_ID));
      document.set("updated", new Date());
      document.set("updatedBy", OBDal.getInstance().get(User.class, USER_ID));
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  // Run Costing Background process
  private void runCostingBackground() {
    try {
      String url = "/ad_process/RescheduleProcess.html?IsPopUpCall=1";
      Map<String, String> params = new HashMap<String, String>();
      params.put("AD_Process_Request_ID", COSTING_PROCESSREQUEST_ID);
      int numCosting = getProcessExecutionsNumber(COSTING_PROCESSREQUEST_ID);
      String response = doRequest(url, params, 200, "POST");
      assertTrue(response.contains("success"));
      assertFalse(response.contains("error"));
      for (int i = 0; i < 20; i++)
        if (getProcessExecutionsNumber(COSTING_PROCESSREQUEST_ID) == numCosting + 1)
          return;
        else
          Thread.sleep(1000);
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  // Get process executions number
  private int getProcessExecutionsNumber(String processRequestId) {
    try {
      OBCriteria<ProcessRun> criteria = OBDal.getInstance().createCriteria(ProcessRun.class);
      criteria.add(Restrictions.eq(ProcessRun.PROPERTY_CLIENT,
          OBDal.getInstance().get(Client.class, CLIENT_ID)));
      criteria.add(Restrictions.eq(ProcessRun.PROPERTY_PROCESSREQUEST,
          OBDal.getInstance().get(ProcessRequest.class, processRequestId)));
      criteria.add(Restrictions.eq(ProcessRun.PROPERTY_STATUS, "SUC"));
      return criteria.list().size();
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  // Create a Goods Receipt from a purchase invoice, complete it and post it
  private ShipmentInOut createGoodsReceipt(String productId, BigDecimal quantity, String locatorId,
      String bpartnerId, String movementId) {
    try {
      ShipmentInOut goodsReceipt = cloneMovement(productId, quantity, locatorId, bpartnerId,
          movementId);
      return postGoodsReceipt(goodsReceipt);
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  // Create a new movement cloning a previous created one
  private ShipmentInOut cloneMovement(String productId, BigDecimal quantity, String locatorId,
      String bpartnerId, String movementId) {
    try {
      ShipmentInOut movement = OBDal.getInstance().get(ShipmentInOut.class, movementId);

      ShipmentInOut movementClone = (ShipmentInOut) DalUtil.copy(movement, false);
      setGeneralData(movement);

      movementClone.setDocumentNo(getDocumentNo(SHIPMENTIN_SEQUENCE_ID));

      movementClone.setMovementDate(today);
      movementClone.setAccountingDate(today);
      movementClone.setWarehouse(OBDal.getInstance().get(Locator.class, locatorId).getWarehouse());
      if (bpartnerId != null) {
        movementClone
            .setBusinessPartner(OBDal.getInstance().get(BusinessPartner.class, bpartnerId));
        movementClone.setPartnerAddress(OBDal.getInstance().get(BusinessPartner.class, bpartnerId)
            .getBusinessPartnerLocationList().get(0));
      }

      // Get the first line associated with the movement and clone it to the new movement
      ShipmentInOutLine movementLine = movement.getMaterialMgmtShipmentInOutLineList().get(0);
      ShipmentInOutLine movementLineClone = (ShipmentInOutLine) DalUtil.copy(movementLine, false);

      setGeneralData(movementLineClone);

      movementLineClone.setProduct(OBDal.getInstance().get(Product.class, productId));
      movementLineClone.setMovementQuantity(quantity);
      movementLineClone.setStorageBin(OBDal.getInstance().get(Locator.class, locatorId));
      if (bpartnerId != null)
        movementLineClone.setBusinessPartner(OBDal.getInstance().get(BusinessPartner.class,
            bpartnerId));

      movementLineClone.setShipmentReceipt(movementClone);
      movementClone.getMaterialMgmtShipmentInOutLineList().add(movementLineClone);

      OBDal.getInstance().save(movementClone);
      OBDal.getInstance().flush();
      OBDal.getInstance().refresh(movementClone);

      return movementClone;
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  // Calculates the next document number for this sequence
  private String getDocumentNo(String sequenceId) {
    try {
      Sequence sequence = OBDal.getInstance().get(Sequence.class, sequenceId);
      String prefix = sequence.getPrefix() == null ? "" : sequence.getPrefix();
      String suffix = sequence.getSuffix() == null ? "" : sequence.getSuffix();
      String documentNo = prefix + sequence.getNextAssignedNumber().toString() + suffix;
      sequence.setNextAssignedNumber(sequence.getNextAssignedNumber() + sequence.getIncrementBy());
      return documentNo;
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  // Complete a Goods Receipt and post it
  private ShipmentInOut postGoodsReceipt(ShipmentInOut goodsReceipt) {
    try {
      completeDocument(goodsReceipt);
      OBDal.getInstance().commitAndClose();
      runCostingBackground();
      ShipmentInOut receipt = OBDal.getInstance().get(ShipmentInOut.class, goodsReceipt.getId());
      postDocument(receipt);
      return receipt;
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  // Complete a document
  private BaseOBObject completeDocument(BaseOBObject document) {
    try {
      return completeDocument(document, null);
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  // Complete a document
  private BaseOBObject completeDocument(BaseOBObject document, String processId) {
    try {
      final OBCriteria<Table> criteria = OBDal.getInstance().createCriteria(Table.class);
      criteria.add(Restrictions.eq(Table.PROPERTY_NAME, document.getEntityName()));
      String procedureName = criteria.list().get(0).getDBTableName() + "_post";

      final List<Object> parameters = new ArrayList<Object>();
      if (processId == null) {
        parameters.add(null);
        parameters.add(document.getId());
      }

      else {
        ProcessInstance processInstance = OBProvider.getInstance().get(ProcessInstance.class);
        setGeneralData(processInstance);
        processInstance.setProcess(OBDal.getInstance().get(Process.class, processId));
        processInstance.setRecordID(document.getId().toString());
        processInstance.setUserContact(OBDal.getInstance().get(User.class, USER_ID));
        OBDal.getInstance().save(processInstance);
        OBDal.getInstance().flush();
        OBDal.getInstance().refresh(processInstance);
        OBDal.getInstance().commitAndClose();
        parameters.add(processInstance.getId());
      }

      CallStoredProcedure.getInstance().call(procedureName, parameters, null, true, false);

      OBDal.getInstance().save(document);
      OBDal.getInstance().flush();
      OBDal.getInstance().refresh(document);
      return document;
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  // Post a document
  private void postDocument(BaseOBObject document) {
    ConnectionProvider conn = getConnectionProvider();
    Connection con = null;

    try {
      final OBCriteria<Table> criteria = OBDal.getInstance().createCriteria(Table.class);
      criteria.add(Restrictions.eq(Table.PROPERTY_NAME, document.getEntityName()));
      String tableId = criteria.list().get(0).getId();
      con = conn.getTransactionConnection();
      AcctServer acct = AcctServer.get(tableId, ((Client) document.get("client")).getId(),
          ((Organization) document.get("organization")).getId(), conn);

      if (acct == null) {
        conn.releaseRollbackConnection(con);
        return;
      } else if (!acct.post((String) document.getId(), false,
          new VariablesSecureApp("100", ((Client) document.get("client")).getId(),
              ((Organization) document.get("organization")).getId()), conn, con)
          || acct.errors != 0) {
        conn.releaseRollbackConnection(con);
        return;
      }

      document.set("posted", "Y");

      conn.releaseCommitConnection(con);
      OBDal.getInstance().commitAndClose();
    } catch (Exception e) {
      try {
        conn.releaseRollbackConnection(con);
      } catch (Exception e2) {
        throw new OBException(e2);
      }
    }
    return;
  }
}
