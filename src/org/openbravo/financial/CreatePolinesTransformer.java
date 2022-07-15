package org.openbravo.financial;

import java.util.HashMap;
import java.util.Map;

import org.hibernate.dialect.function.SQLFunction;
import org.hibernate.dialect.function.StandardSQLFunction;
import org.hibernate.type.StandardBasicTypes;
import org.openbravo.client.kernel.ComponentProvider;
import org.openbravo.dal.core.SQLFunctionRegister;
import org.openbravo.dal.security.OrganizationStructureProvider;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.erpCommon.utility.StringCollectionUtils;
import org.openbravo.model.pricing.pricelist.PriceListVersion;
import org.openbravo.service.datasource.hql.HqlQueryTransformer;
import org.openbravo.service.json.JsonUtils;

@ComponentProvider.Qualifier("4CCE605CBB914CFAB01005FBD0A8C259")
public class CreatePolinesTransformer extends HqlQueryTransformer implements SQLFunctionRegister {

  @Override
  public String transformHqlQuery(String hqlQuery, Map<String, String> requestParameters,
      Map<String, Object> queryNamedParameters) {

    String documentDate = getDocumentDate(requestParameters);
    String orgList = getOrganizationsList(requestParameters);

    String priceListId = requestParameters.get("@Order.priceList@");
    String transformedHql = hqlQuery.replace("@Order.priceList@", "'" + priceListId + "'");
    transformedHql = transformedHql.replace("@Max_ValidFromDate@",
        this.getMaxValidDate(priceListId));
    transformedHql = transformedHql.replace("@leftJoinPriceExceptions@",
        getLeftJoinPriceExceptions());
    transformedHql = transformedHql.replace("@documentDate@", documentDate);
    transformedHql = transformedHql.replace("@orgList@", orgList);

    return transformedHql;
  }

  private String getMaxValidDate(String plId) {
   // @formatter:off
    final String whereClause =
            " where priceList.id = :plId" +
            "   and validFromDate <= now()"+
            " order by validFromDate desc";
    // @formatter:on
    final OBQuery<PriceListVersion> criteria = OBDal.getInstance()
        .createQuery(PriceListVersion.class, whereClause);
    criteria.setNamedParameter("plId", plId);
    criteria.setMaxResult(1);
    return "'" + criteria.uniqueResult().getValidFromDate() + "'";
  }

  @Override
  public Map<String, SQLFunction> getSQLFunctions() {
    Map<String, SQLFunction> sqlFunctions = new HashMap<>();
    sqlFunctions.put("m_get_default_aum_for_document",
        new StandardSQLFunction("m_get_default_aum_for_document", StandardBasicTypes.STRING));
    return sqlFunctions;
  }

  private String getDocumentDate(Map<String, String> requestParameters) {
    String documentDate = requestParameters.containsKey("@Order.orderDate@")
        ? "TO_DATE('" + requestParameters.get("@Order.orderDate@") + "','"
            + JsonUtils.createDateFormat().toPattern() + "')"
        : "null";
    return documentDate;
  }

  private String getOrganizationsList(Map<String, String> requestParameters) {
    return StringCollectionUtils.commaSeparated(new OrganizationStructureProvider()
        .getParentList(requestParameters.get("@Order.organization@"), true), true);
  }

  private String getLeftJoinPriceExceptions() {
    return "left join PricingProductPriceException ppe\n" + "    on (\n"
        + "        pp.id = ppe.productPrice.id\n" + "        and @documentDate@ is not null\n"
        + "        and ppe.organization.id in (@orgList@)\n"
        + "        and ppe.validFromDate <= @documentDate@\n"
        + "        and ppe.validToDate >= @documentDate@\n" + "        and ppe.orgdepth = ( \n"
        + "            select max(ppe2.orgdepth)\n"
        + "            from PricingProductPriceException ppe2\n"
        + "            where ppe.productPrice.id = ppe2.productPrice.id\n"
        + "            and ppe2.organization.id in (@orgList@)\n"
        + "            and ppe2.validFromDate <= @documentDate@\n"
        + "            and ppe2.validToDate >= @documentDate@\n" + "        )\n" + "    )";
  }

}
