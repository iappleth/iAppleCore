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
 * All portions are Copyright (C) 2009-2023 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.userinterface.selector.model.domaintype;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

import org.openbravo.base.model.ModelObject;
import org.openbravo.base.model.Table;

/**
 * The datasource read from the database. Note the Column/Table and other types from the
 * org.openbravo.base.model package should be used, not the generated ones!
 * 
 * @author mtaal
 */
@Entity
@javax.persistence.Table(name = "obserds_datasource")
public class DatasourceDefinition extends ModelObject {

  private Table table;

  @Override
  @Id
  @Column(name = "obserds_datasource_id")
  @GeneratedValue(generator = "DalUUIDGenerator")
  public String getId() {
    return super.getId();
  }

  @Override
  public void setId(String id) {
    super.setId(id);
  }

  @ManyToOne
  @JoinColumn(name = "ad_table_id", nullable = false)
  public Table getTable() {
    return table;
  }

  public void setTable(Table table) {
    this.table = table;
  }
}
