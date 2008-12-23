/*
 ******************************************************************************
 * The contents of this file are subject to the   Compiere License  Version 1.1
 * ("License"); You may not use this file except in compliance with the License
 * You may obtain a copy of the License at http://www.compiere.org/license.html
 * Software distributed under the License is distributed on an  "AS IS"  basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for
 * the specific language governing rights and limitations under the License.
 * The Original Code is                  Compiere  ERP & CRM  Business Solution
 * The Initial Developer of the Original Code is Jorg Janke  and ComPiere, Inc.
 * Portions created by Jorg Janke are Copyright (C) 1999-2001 Jorg Janke, parts
 * created by ComPiere are Copyright (C) ComPiere, Inc.;   All Rights Reserved.
 * Contributor(s): Openbravo SL
 * Contributions are Copyright (C) 2001-2006 Openbravo S.L.
 ******************************************************************************
 */
package org.openbravo.erpCommon.ad_forms;

import java.math.*;
import javax.servlet.*;
import org.apache.log4j.Logger; // imports for transactions
import org.openbravo.database.ConnectionProvider;
import java.sql.Connection;

public class ProductInfo {
    static Logger log4jProductInfo = Logger.getLogger(ProductInfo.class);

    /**
     * Constructor
     */
    public ProductInfo(String M_Product_ID, ConnectionProvider conn) {
        init(M_Product_ID, conn);
    } // ProductInfo

    public static final BigDecimal ZERO = new BigDecimal("0");
    /** The Product Key */
    public String m_M_Product_ID = "";
    // Product Info
    public String m_AD_Client_ID = "";
    public String m_AD_Org_ID = "";

    public String m_productType = "";
    public String m_ProductCategory = "";

    public String m_C_UOM_ID = "";
    public String m_qty = "0";

    /**
     * Get Product Info (Service, Revenue Recognition). automatically called by
     * constructor
     * 
     * @param M_Product_ID
     *            Product
     */
    private void init(String M_Product_ID, ConnectionProvider conn) {
        m_M_Product_ID = M_Product_ID;
        if (m_M_Product_ID != null && m_M_Product_ID.equals(""))
            return;

        ProductInfoData[] data = null;
        try {
            data = ProductInfoData.select(conn, m_M_Product_ID);
        } catch (ServletException e) {
            log4jProductInfo.warn(e);
        }
        if (data.length == 1) {
            m_productType = data[0].producttype;
            m_ProductCategory = data[0].value;
            m_C_UOM_ID = data[0].cUomId;
            // reference
            m_AD_Client_ID = data[0].adClientId;
            m_AD_Org_ID = data[0].adOrgId;
        }
    } // init

    /**
     * Line Account from Product
     * 
     * @param AcctType
     *            see ACCTTYPE_* (1..8)
     * @param as
     *            Accounting Schema
     * @return Requested Product Account
     */
    public Account getAccount(String AcctType, AcctSchema as,
            ConnectionProvider conn) {
        if (Integer.parseInt(AcctType) < 1 || Integer.parseInt(AcctType) > 8)
            return null;
        // No Product - get Default from Product Category
        if (m_M_Product_ID.equals(""))
            return getAccountDefault(AcctType, as, conn);
        ProductInfoData[] data = null;
        Account acc = null;
        try {
            data = ProductInfoData.selectProductAcct(conn, m_M_Product_ID, as
                    .getC_AcctSchema_ID());
            if (data == null || data.length == 0)
                return null;
            String validCombination_ID = "";
            switch (Integer.parseInt(AcctType)) {
            case 1:
                validCombination_ID = data[0].revenue;
                break;
            case 2:
                validCombination_ID = data[0].expense;
                break;
            case 3:
                validCombination_ID = data[0].asset;
                break;
            case 4:
                validCombination_ID = data[0].cogs;
                break;
            case 5:
                validCombination_ID = data[0].purchasepricevariance;
                break;
            case 6:
                validCombination_ID = data[0].invoicepricevariance;
                break;
            case 7:
                validCombination_ID = data[0].discountrec;
                break;
            case 8:
                validCombination_ID = data[0].discountgrant;
                break;
            }
            if (validCombination_ID.equals(""))
                return null;
            acc = Account.getAccount(conn, validCombination_ID);
        } catch (ServletException e) {
            log4jProductInfo.warn(e);
        }
        return acc;
    } // getAccount

    /**
     * Account from Default Product Category
     * 
     * @param AcctType
     *            see ACCTTYPE_* (1..8)
     * @param as
     *            accounting schema
     * @return Requested Product Account
     */
    public Account getAccountDefault(String AcctType, AcctSchema as,
            ConnectionProvider conn) {
        if (Integer.parseInt(AcctType) < 1 || Integer.parseInt(AcctType) > 8)
            return null;
        ProductInfoData[] data = null;
        Account acct = null;
        try {
            data = ProductInfoData.selectDefaultAcct(conn, as
                    .getC_AcctSchema_ID());
            String validCombination_ID = "";
            switch (Integer.parseInt(AcctType)) {
            case 1:
                validCombination_ID = data[0].revenue;
                break;
            case 2:
                validCombination_ID = data[0].expense;
                break;
            case 3:
                validCombination_ID = data[0].asset;
                break;
            case 4:
                validCombination_ID = data[0].cogs;
                break;
            case 5:
                validCombination_ID = data[0].purchasepricevariance;
                break;
            case 6:
                validCombination_ID = data[0].invoicepricevariance;
                break;
            case 7:
                validCombination_ID = data[0].discountrec;
                break;
            case 8:
                validCombination_ID = data[0].discountgrant;
                break;
            }
            if (validCombination_ID.equals(""))
                return null;
            acct = Account.getAccount(conn, validCombination_ID);
        } catch (ServletException e) {
            log4jProductInfo.warn(e);
        }
        return acct;
    } // getAccountDefault

    /**
     * Set Quantity in UOM
     * 
     * @param qty
     *            quantity
     * @param C_UOM_ID
     *            UOM
     */
    public void setQty(String qty, String C_UOM_ID, ConnectionProvider conn) {
        m_qty = getConvertedQty(qty, C_UOM_ID, m_C_UOM_ID, "Y", conn); // StdPrecision
        if (qty != null && m_qty == null) { // conversion error
            log4jProductInfo.warn("setQty - conversion error - set to " + qty);
            m_qty = qty;
        }
    } // setQty

    /**
     * Get Converted Qty
     * 
     * @param qty
     *            The quantity to be converted
     * @param C_UOM_From_ID
     *            The C_UOM_ID of the qty
     * @param C_UOM_To_ID
     *            The targeted UOM
     * @param StdPrecision
     *            if true, standard precision, if false costing precision
     * @return amount
     * @depreciated should not be used
     */
    public static String getConvertedQty(String qty, String C_UOM_From_ID,
            String C_UOM_To_ID, String StdPrecision, ConnectionProvider conn) {
        // Nothing to do
        if (qty.equals("") || qty.equals(ZERO)
                || C_UOM_From_ID.equals(C_UOM_To_ID))
            return qty;
        //
        String retValue = "";
        ProductInfoData[] data = null;
        try {
            data = ProductInfoData.UOMConvert(conn, qty, C_UOM_From_ID,
                    C_UOM_To_ID, StdPrecision);
        } catch (ServletException e) {
            log4jProductInfo.warn(e);
            return null;
        }
        retValue = data[0].converted;
        return retValue;
    } // getConvertedQty

    /**
     * Get Total Costs in Accounting Schema Currency
     * 
     * @param as
     *            accounting schema
     * @return cost or null, if qty or costs cannot be determined
     */
    public String getProductCosts(String date, String strQty, AcctSchema as,
            ConnectionProvider conn, Connection con) {
        if (m_qty == null || m_qty.equals("")) {
            log4jProductInfo.debug("getProductCosts - No Qty");
            return null;
        }
        BigDecimal cost = new BigDecimal(getProductItemCost(date, as, "", conn,
                con));
        if (cost == null) {
            log4jProductInfo.debug("getProductCosts - No Costs");
            return null;
        }
        log4jProductInfo.debug("getProductCosts - qty = " + m_qty);
        if (strQty == null || strQty.equals("")) {
            BigDecimal qty = new BigDecimal(m_qty);
            log4jProductInfo.debug("getProductCosts - Qty(" + m_qty
                    + ") * Cost(" + cost + ") = " + qty.multiply(cost));
            return qty.multiply(cost).toString();
        } else
            return cost.multiply(new BigDecimal(strQty)).toString();

    } // getProductCosts

    public String getProductItemCost(String date, AcctSchema as,
            String costType, ConnectionProvider conn, Connection con) {
        String cost = "";
        log4jProductInfo.debug("getProductItemCost - m_M_Product_ID("
                + m_M_Product_ID + ") - date(" + date + ")");
        try {
            cost = ProductInfoData.selectProductAverageCost(conn,
                    m_M_Product_ID, date);
        } catch (ServletException e) {
            log4jProductInfo.warn(e);
        }
        return cost;
    }

    /**
     * Get PO Cost from Purchase Info - and convert it to AcctSchema Currency
     * 
     * @param as
     *            accounting schema
     * @return po cost
     */
    private String getPOCost(AcctSchema as, ConnectionProvider conn) {
        ProductInfoData[] data = null;
        try {
            data = ProductInfoData.selectPOCost(conn, m_M_Product_ID);
        } catch (ServletException e) {
            log4jProductInfo.warn(e);
        }
        String C_Currency_ID = "";
        String PriceList = "";
        String PricePO = "";
        String PriceLastPO = "";
        if (data.length != 0) {
            C_Currency_ID = data[0].cCurrencyId;
            PriceList = data[0].pricelist;
            PricePO = data[0].pricepo;
            PriceLastPO = data[0].pricelastpo;
        } else
            return null;
        log4jProductInfo.debug("getPOCost - data[0].cCurrencyId: - "
                + data[0].cCurrencyId);
        // nothing found
        if (C_Currency_ID.equals(""))
            return null;

        String cost = PriceLastPO; // best bet
        if (cost.equals("") || cost.equals(ZERO.toString()))
            cost = PricePO;
        if (cost.equals("") || cost.equals(ZERO.toString()))
            cost = PriceList;
        // Convert - standard precision!! - should be costing precision
        if (!cost.equals("") && !cost.equals(ZERO.toString()))
            cost = AcctServer.getConvertedAmt(cost, C_Currency_ID, as
                    .getC_Currency_ID(), m_AD_Client_ID, m_AD_Org_ID, conn);
        return cost;
    } // getPOCost

    /**
     * Get PO Price from PriceList - and convert it to AcctSchema Currency
     * 
     * @param as
     *            accounting schema
     * @param onlyPOPriceList
     *            use only PO price list
     * @return po price
     */
    private String getPriceList(AcctSchema as, boolean onlyPOPriceList,
            ConnectionProvider conn) {
        String C_Currency_ID = "";
        String PriceList = "";
        String PriceStd = "";
        String PriceLimit = "";
        ProductInfoData[] data = null;
        try {
            data = ProductInfoData.selectPriceList(conn, m_M_Product_ID,
                    onlyPOPriceList ? "onlyPOPriceList" : "");
        } catch (ServletException e) {
            log4jProductInfo.warn(e);
        }
        if (data.length == 1) {
            C_Currency_ID = data[0].getField("cCurrencyId");
            PriceList = data[0].getField("pricelist");
            PriceStd = data[0].getField("pricestd");
            PriceLimit = data[0].getField("pricelimit");
        }
        // nothing found
        if (C_Currency_ID.equals(""))
            return "";

        String price = PriceLimit; // best bet
        if (price.equals("") || price.equals(ZERO.toString()))
            price = PriceStd;
        if (price.equals("") || price.equals(ZERO.toString()))
            price = PriceList;
        // Convert
        if (!price.equals("") && !price.equals(ZERO.toString()))
            price = AcctServer.getConvertedAmt(price, C_Currency_ID,
                    as.m_C_Currency_ID, as.m_AD_Client_ID, "", conn);
        return price;
    } // getPOPrice

    /** Product Revenue Acct */
    public static final String ACCTTYPE_P_Revenue = "1";
    /** Product Expense Acct */
    public static final String ACCTTYPE_P_Expense = "2";
    /** Product Asset Acct */
    public static final String ACCTTYPE_P_Asset = "3";
    /** Product COGS Acct */
    public static final String ACCTTYPE_P_Cogs = "4";
    /** Purchase Price Variance */
    public static final String ACCTTYPE_P_PPV = "5";
    /** Invoice Price Variance */
    public static final String ACCTTYPE_P_IPV = "6";
    /** Trade Discount Revenue */
    public static final String ACCTTYPE_P_TDiscountRec = "7";
    /** Trade Discount Costs */
    public static final String ACCTTYPE_P_TDiscountGrant = "8";

} // ProductInfo
