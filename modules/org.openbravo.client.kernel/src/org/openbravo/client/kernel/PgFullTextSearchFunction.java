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
 * All portions are Copyright (C) 2020 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.client.kernel;

import java.util.List;
import java.util.Optional;

import org.hibernate.dialect.function.SQLFunction;
import org.hibernate.engine.spi.Mapping;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.type.BooleanType;
import org.hibernate.type.Type;

/**
 * HQL functions to support Full Text Search in PostgreSQL. See each class for more specific
 * documentation
 */
public abstract class PgFullTextSearchFunction implements SQLFunction {
  protected abstract String getFragment(String table, String field, String value,
      Optional<String> ftsConfiguration);

  @Override
  public Type getReturnType(Type arg0, Mapping arg1) {
    return new BooleanType();
  }

  @Override
  public boolean hasArguments() {
    return true;
  }

  @Override
  public boolean hasParenthesesIfNoArguments() {
    return false;
  }

  /**
   * Function that parses the HQL function to SQL language:
   * 
   * @param args
   *          list of arguments passed to fullTextSearchFilter hbm function
   *          <ul>
   *          <li>table
   *          <li>field: tsvector column of table
   *          <li>ftsconfiguration [optional]: language to pass to to_tsquery function
   *          <li>value: string to be searched/compared
   *          </ul>
   * @return hql string to append to an hql query in order to filter/obtain the rank. See examples
   *         for each class in each class' doc
   */
  @Override
  public String render(Type type, @SuppressWarnings("rawtypes") List args,
      SessionFactoryImplementor factory) {
    if (args == null || args.size() < 3) {
      throw new IllegalArgumentException("The function must be passed at least 3 arguments");
    }

    int pointPosition = args.get(0).toString().indexOf(".");
    String table = args.get(0).toString().substring(0, pointPosition);
    String field = (String) args.get(1);
    Optional<String> ftsConfiguration = Optional
        .ofNullable(args.size() == 4 ? (String) args.get(2) : null);
    String value = (String) args.get(args.size() == 4 ? 3 : 2);

    return getFragment(table, field, value, ftsConfiguration);
  }

  protected String getFtsConfig(Optional<String> ftsConfiguration) {
    return ftsConfiguration.map(config -> config + "::regconfig, ").orElseGet(() -> "");
  }

  /**
   * It allows to add a where clause to filter by those values that fit the search. In order for
   * this to work there needs to be a column stored in the database that contains a tsvector built
   * with the columns for which the search is required.
   * <p>
   * Examples of usage having p as alias of a product table and searchable_field as the tsvector
   * field:
   * <p>
   * - 'and fullTextSearchFilter(p, p.searchable_field, 'english', 'cat')' this will search for any
   * field that has any word having to do with cat
   * <p>
   * - 'and fullTextSearchFilter(p, p.searchable_field, 'english', 'cat:* | black:*')' this will
   * search for any field that has any word having to do with cat or black and that starts at least
   * by cat or black
   *
   */
  public static class Filter extends PgFullTextSearchFunction {
    @Override
    protected String getFragment(String table, String field, String value,
        Optional<String> ftsConfiguration) {
      return table + "." + field + " @@ to_tsquery(" + getFtsConfig(ftsConfiguration) + value + ")";
    }
  }

  /**
   * It allows to add an order by clause regarding how fitting a text is according to the values in
   * the tsvector column. This function returns an integer that can be returned in the select clause
   * and order by it. It is strictly not necessary to put it in the select clause, but it helps to
   * know how it orders.
   * <p>
   * Examples of usage having p as alias of a product table and searchable_field as the tsvector
   * field:
   * <p>
   * - 'fullTextSearchRank(p, p.searchable_field, 'english', 'cat')' this will return an integer
   * that will be higher the more fitting to it the chain with which the tsvector field was and the
   * more times the cat chain appeared on it
   * <p>
   * - 'fullTextSearchRank(p, p.searchable_field, 'english', 'cat:* | black:*')' same as before but
   * with substrings and with cat or black
   *
   */
  public static class Rank extends PgFullTextSearchFunction {
    @Override
    protected String getFragment(String table, String field, String value,
        Optional<String> ftsConfiguration) {

      return "ts_rank_cd(" + table + "." + field + ", to_tsquery(" + getFtsConfig(ftsConfiguration)
          + value + "), 4)";
    }
  }
}
