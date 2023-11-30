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
 * All portions are Copyright (C) 2008-2023 Openbravo SLU
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.base.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Transient;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openbravo.base.model.domaintype.DomainType;
import org.openbravo.base.model.domaintype.StringEnumerateDomainType;

/**
 * A limited mapping of the ref_list to support validation of string types.
 * 
 * @author mtaal
 */
@Entity
@Table(name = "ad_ref_list")
public class RefList extends ModelObject {
  @Transient
  private static final Logger log = LogManager.getLogger();

  @Id
  @Column(name = "ad_ref_list_id")
  @GeneratedValue(generator = "DalUUIDGenerator")
  private String id;

  private String value;

  public String getValue() {
    return value;
  }

  public void setValue(String value) {
    this.value = value;
  }

  private Reference reference;

  public Reference getReference() {
    return reference;
  }

  public void setReference(Reference reference) {
    this.reference = reference;
    final DomainType domainType = reference.getDomainType();
    if (!(domainType instanceof StringEnumerateDomainType)) {
      log.error("Domain type of reference " + reference.getId() + " is not a TableDomainType but a "
          + domainType);
    } else {
      ((StringEnumerateDomainType) domainType).addEnumerateValue(value);
    }
  }
}
