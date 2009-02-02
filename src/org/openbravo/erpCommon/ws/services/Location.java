/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.0  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html 
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License. 
 * The Original Code is Openbravo ERP. 
 * The Initial Developer of the Original Code is Openbravo SL 
 * All portions are Copyright (C) 2008 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.erpCommon.ws.services;

public class Location {
  private String id;
  private String clientId;
  private String businessPartnerId;
  private String address1;
  private String address2;
  private String city;
  private String postal;
  private String region;
  private String country;

  public Location() {
  }

  public String getId() {
    return id;
  }

  public void setId(String value) {
    id = value;
  }

  public String getClientId() {
    return clientId;
  }

  public void setClientId(String value) {
    clientId = value;
  }

  public String getBusinessPartnerId() {
    return businessPartnerId;
  }

  public void setBusinessPartnerId(String value) {
    businessPartnerId = value;
  }

  public String getAddress1() {
    return address1;
  }

  public void setAddress1(String value) {
    address1 = value;
  }

  public String getAddress2() {
    return address2;
  }

  public void setAddress2(String value) {
    address2 = value;
  }

  public String getCity() {
    return city;
  }

  public void setCity(String value) {
    city = value;
  }

  public String getPostal() {
    return postal;
  }

  public void setPostal(String value) {
    postal = value;
  }

  public String getRegion() {
    return region;
  }

  public void setRegion(String value) {
    region = value;
  }

  public String getCountry() {
    return country;
  }

  public void setCountry(String value) {
    country = value;
  }
}
