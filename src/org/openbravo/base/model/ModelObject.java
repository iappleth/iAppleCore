/*
 * 
 * Copyright (C) 2001-2008 Openbravo S.L. Licensed under the Apache Software
 * License version 2.0 You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law
 * or agreed to in writing, software distributed under the License is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
package org.openbravo.base.model;

import java.util.HashMap;
import java.util.Map;

/**
 * The root class for the model types. Used for the bootstrap model.
 * 
 * @author mtaal
 */

public class ModelObject {
  
  private String id = null;
  private boolean active = true;
  private String name;
  
  private Map<String, Object> data = new HashMap<String, Object>();
  
  public void set(String propertyName, Object value) {
    // TODO: externalise the strings
    if (propertyName.compareTo("id") == 0) {
      setId((String) value);
      return;
    } else if (propertyName.compareTo("active") == 0) {
      setActive((Boolean) value);
      return;
    }
    data.put(propertyName, value);
  }
  
  public Object get(String propertyName) {
    // TODO: externalise the strings
    if (propertyName.compareTo("id") == 0)
      return getId();
    else if (propertyName.compareTo("active") == 0)
      return isActive();
    return data.get(propertyName);
  }
  
  public boolean isNew() {
    return id == null;
  }
  
  public boolean isActive() {
    return active;
  }
  
  public void setActive(boolean active) {
    this.active = active;
  }
  
  public String getId() {
    return id;
  }
  
  public void setId(String id) {
    this.id = id;
  }
  
  public Map<String, Object> getData() {
    return data;
  }
  
  public String getIdentifier() {
    return getClass().getName() + "(" + getId() + ")";
  }
  
  public String getName() {
    return name;
  }
  
  public void setName(String name) {
    this.name = name;
  }
}