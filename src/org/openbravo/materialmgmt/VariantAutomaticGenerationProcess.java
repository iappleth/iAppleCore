package org.openbravo.materialmgmt;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.hibernate.QueryTimeoutException;
import org.hibernate.criterion.Restrictions;
import org.hibernate.exception.GenericJDBCException;
import org.openbravo.advpaymentmngt.utility.FIN_Utility;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.financial.FinancialUtils;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.common.plm.ProductAccounts;
import org.openbravo.model.common.plm.ProductCharacteristic;
import org.openbravo.model.common.plm.ProductCharacteristicConf;
import org.openbravo.model.common.plm.ProductCharacteristicValue;
import org.openbravo.model.pricing.pricelist.ProductPrice;
import org.openbravo.scheduling.Process;
import org.openbravo.scheduling.ProcessBundle;

public class VariantAutomaticGenerationProcess implements Process {
  private static final Logger log4j = Logger.getLogger(VariantAutomaticGenerationProcess.class);
  private static final int searchKeyLength = getSearchKeyColumnLength();

  @Override
  public void execute(ProcessBundle bundle) throws Exception {
    OBError msg = new OBError();
    msg.setType("Success");
    msg.setTitle(OBMessageUtils.messageBD("Success"));

    try {
      // retrieve standard params
      final String recordID = (String) bundle.getParams().get("M_Product_ID");
      final Product product = OBDal.getInstance().get(Product.class, recordID);

      runChecks(product);

      int totalMaxLength = product.getSearchKey().length();
      long variantNumber = 1;
      Map<ProductCharacteristic, ProductCharacteristicAux> prChUseCode = new HashMap<ProductCharacteristic, ProductCharacteristicAux>();

      OBCriteria<ProductCharacteristic> prChCrit = OBDal.getInstance().createCriteria(
          ProductCharacteristic.class);
      prChCrit.add(Restrictions.eq(ProductCharacteristic.PROPERTY_PRODUCT, product));
      prChCrit.add(Restrictions.eq(ProductCharacteristic.PROPERTY_VARIANT, true));
      prChCrit.addOrderBy(ProductCharacteristic.PROPERTY_SEQUENCENUMBER, true);
      List<ProductCharacteristic> prChs = prChCrit.list();
      int chNumber = prChs.size();
      ProductCharacteristicConf[] currentValues = new ProductCharacteristicConf[chNumber];

      int i = 0;
      for (ProductCharacteristic prCh : prChCrit.list()) {
        OBCriteria<ProductCharacteristicConf> prChConfCrit = OBDal.getInstance().createCriteria(
            ProductCharacteristicConf.class);
        prChConfCrit.add(Restrictions.eq(
            ProductCharacteristicConf.PROPERTY_CHARACTERISTICOFPRODUCT, prCh));
        prChConfCrit.add(Restrictions.eq(ProductCharacteristicConf.PROPERTY_ACTIVE, true));
        List<ProductCharacteristicConf> prChConfs = prChConfCrit.list();
        long valuesCount = prChConfs.size();

        boolean useCode = true;
        int maxLength = 0;
        for (ProductCharacteristicConf prChConf : prChConfs) {
          if (StringUtils.isBlank(prChConf.getCode())) {
            useCode = false;
            break;
          }
          if (prChConf.getCode().length() > maxLength) {
            maxLength = prChConf.getCode().length();
          }
        }

        variantNumber = variantNumber * valuesCount;
        if (useCode) {
          totalMaxLength += maxLength;
        }
        ProductCharacteristicAux prChAux = new ProductCharacteristicAux(useCode, prChConfs);
        currentValues[i] = prChAux.getNextValue();
        prChUseCode.put(prCh, prChAux);
        i++;
      }
      totalMaxLength += Long.toString(variantNumber).length();
      boolean useCodes = totalMaxLength <= searchKeyLength;

      boolean hasNext = true;
      int productNo = 0;
      do {
        // Create variant product
        Product variant = (Product) DalUtil.copy(product);

        variant.setGenericProduct(product);
        variant.setProductAccountsList(Collections.<ProductAccounts> emptyList());
        variant.setGeneric(false);
        for (ProductCharacteristic prCh : variant.getProductCharacteristicList()) {
          prCh.setProductCharacteristicConfList(Collections.<ProductCharacteristicConf> emptyList());
        }

        String searchKey = product.getSearchKey();
        for (i = 0; i < chNumber; i++) {
          ProductCharacteristicConf prChConf = currentValues[i];
          ProductCharacteristicAux prChConfAux = prChUseCode.get(prChs.get(i));

          if (useCodes && prChConfAux.isUseCode()) {
            searchKey += prChConf.getCode();
          }
        }
        for (int j = 0; j < (Long.toString(variantNumber).length() - Integer.toString(productNo)
            .length()); j++) {
          searchKey += "0";
        }
        searchKey += productNo;
        variant.setSearchKey(searchKey);
        OBDal.getInstance().save(variant);
        OBDal.getInstance().flush();

        for (i = 0; i < chNumber; i++) {
          ProductCharacteristicConf prChConf = currentValues[i];
          ProductCharacteristicValue newPrChValue = OBProvider.getInstance().get(
              ProductCharacteristicValue.class);
          newPrChValue.setCharacteristic(prChConf.getCharacteristicOfProduct().getCharacteristic());
          newPrChValue.setCharacteristicValue(prChConf.getCharacteristicValue());
          newPrChValue.setProduct(variant);
          OBDal.getInstance().save(newPrChValue);
          if (prChConf.getCharacteristicOfProduct().isDefinesPrice()
              && prChConf.getNetUnitPrice() != null) {
            setPrice(variant, prChConf.getNetUnitPrice());
          }
        }

        for (i = 0; i < chNumber; i++) {
          ProductCharacteristicAux prChConfAux = prChUseCode.get(prChs.get(i));
          currentValues[i] = prChConfAux.getNextValue();
          if (!prChConfAux.isIteratorReset()) {
            break;
          } else if (i + 1 == chNumber) {
            hasNext = false;
          }
        }
        productNo++;
      } while (hasNext);

      bundle.setResult(msg);

      // Postgres wraps the exception into a GenericJDBCException
    } catch (GenericJDBCException ge) {
      log4j.error("Exception processing variant generation", ge);
      msg.setType("Error");
      msg.setTitle(OBMessageUtils.messageBD(bundle.getConnection(), "Error", bundle.getContext()
          .getLanguage()));
      msg.setMessage(((GenericJDBCException) ge).getSQLException().getMessage());
      bundle.setResult(msg);
      OBDal.getInstance().rollbackAndClose();
      // Oracle wraps the exception into a QueryTimeoutException
    } catch (QueryTimeoutException qte) {
      log4j.error("Exception processing variant generation", qte);
      msg.setType("Error");
      msg.setTitle(OBMessageUtils.messageBD(bundle.getConnection(), "Error", bundle.getContext()
          .getLanguage()));
      msg.setMessage(((QueryTimeoutException) qte).getSQLException().getMessage().split("\n")[0]);
      bundle.setResult(msg);
      OBDal.getInstance().rollbackAndClose();
    } catch (final Exception e) {
      log4j.error("Exception processing variant generation", e);
      msg.setType("Error");
      msg.setTitle(OBMessageUtils.messageBD(bundle.getConnection(), "Error", bundle.getContext()
          .getLanguage()));
      msg.setMessage(FIN_Utility.getExceptionMessage(e));
      bundle.setResult(msg);
      OBDal.getInstance().rollbackAndClose();
    }

  }

  private static int getSearchKeyColumnLength() {
    final Entity prodEntity = ModelProvider.getInstance().getEntity(Product.ENTITY_NAME);

    final Property searchKeyProperty = prodEntity.getProperty(Product.PROPERTY_SEARCHKEY);
    return searchKeyProperty.getFieldLength();
  }

  private void runChecks(Product product) throws OBException {
    // Check existence of variants
    if (!product.getProductGenericProductList().isEmpty()) {
      throw new OBException(OBMessageUtils.parseTranslation("@ProductWithVariantsError@"));
    }
    // Check it is a generic product
    if (!product.isGeneric()) {
      throw new OBException(OBMessageUtils.parseTranslation("@ProductIsNotGenericError@"));
    }
    // Check existence of variant characteristic assigned to the product
    boolean errorFlag = true;
    for (ProductCharacteristic prCh : product.getProductCharacteristicList()) {
      if (prCh.isVariant()) {
        errorFlag = false;
        break;
      }
    }
    if (errorFlag) {
      throw new OBException(OBMessageUtils.parseTranslation("@GenericWithNoVariantChError@"));
    }
  }

  private void setPrice(Product variant, BigDecimal price) {
    ProductPrice prodPrice = FinancialUtils.getProductPrice(variant, new Date(), true, null, false);
    if (prodPrice == null) {
      throw new OBException(OBMessageUtils.parseTranslation("@GenericMustHavePriceDefined@"));
    }
    prodPrice.setStandardPrice(price);
    prodPrice.setListPrice(price);
    prodPrice.setPriceLimit(price);
    OBDal.getInstance().save(prodPrice);
  }

  private class ProductCharacteristicAux {
    private boolean useCode;
    private boolean isIteratorReset;
    private List<ProductCharacteristicConf> values;
    private Iterator<ProductCharacteristicConf> iterator;

    ProductCharacteristicAux(boolean _useCode, List<ProductCharacteristicConf> _values) {
      useCode = _useCode;
      values = _values;
    }

    public boolean isUseCode() {
      return useCode;
    }

    public boolean isIteratorReset() {
      return isIteratorReset;
    }

    public ProductCharacteristicConf getNextValue() {
      ProductCharacteristicConf prChConf;
      if (iterator == null || !iterator.hasNext()) {
        iterator = values.iterator();
        isIteratorReset = true;
      } else {
        isIteratorReset = false;
      }
      prChConf = iterator.next();
      return prChConf;
    }
  }
}
