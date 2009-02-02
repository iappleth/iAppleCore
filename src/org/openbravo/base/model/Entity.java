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

package org.openbravo.base.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.exception.OBSecurityException;
import org.openbravo.base.util.Check;
import org.openbravo.base.util.CheckException;
import org.openbravo.base.util.OBClassLoader;
import org.openbravo.base.validation.AccessLevelChecker;
import org.openbravo.base.validation.EntityValidator;
import org.openbravo.base.validation.PropertyValidator;

/**
 * Models the business object type. The Entity is the main concept in the in-memory model. An entity
 * corresponds to a {@link Table} in the database. An Entity has properties which are primitive
 * typed, references or lists of child entities.
 * 
 * @see Property
 * @see ModelProvider
 * 
 * @author iperdomo
 * @author mtaal
 */

public class Entity {
  private static final Logger log = Logger.getLogger(Entity.class);

  private List<UniqueConstraint> uniqueConstraints = new ArrayList<UniqueConstraint>();

  private List<Property> properties;
  private Map<String, Property> propertiesByName;
  private Map<String, Property> propertiesByColumnName;
  private List<Property> idProperties;
  private List<Property> identifierProperties;
  private List<Property> parentProperties;
  private List<Property> orderByProperties;

  private String name = null;
  private String tableName;
  private String tableId;
  private Class<?> mappingClass = null;
  private boolean mappingClassComputed = false;
  private String className;

  private boolean isInActive;

  private boolean isTraceable;
  private boolean isActiveEnabled;
  private boolean isOrganizationEnabled;
  // some views have this:
  private boolean isOrganizationPartOfKey;
  private boolean isClientEnabled;
  private boolean isMutable;
  private boolean isDeletable;

  private EntityValidator entityValidator;
  private AccessLevelChecker accessLevelChecker;
  private AccessLevel accessLevel;

  private Module module;

  /**
   * Initializes the entity from a table, also creates the properties from the list of Columns of
   * the table.
   * 
   * @param table
   *          the table used to initialize the Entity
   */
  public void initialize(Table table) {
    table.setEntity(this);
    setTableName(table.getTableName());
    setTableId(table.getId());
    setClassName(table.getPackageName() + "." + table.getNotNullClassName());
    setName(table.getName());
    setDeletable(table.isDeletable());
    setMutable(!table.isView());
    setInActive(!table.isActive());

    properties = new ArrayList<Property>();
    idProperties = new ArrayList<Property>();
    identifierProperties = new ArrayList<Property>();
    parentProperties = new ArrayList<Property>();
    orderByProperties = new ArrayList<Property>();
    // + 5 to take into account some additional properties for onetomany
    // and such
    propertiesByName = new HashMap<String, Property>(table.getColumns().size() + 5);
    propertiesByColumnName = new HashMap<String, Property>(table.getColumns().size() + 5);

    for (final Column c : table.getColumns()) {

      final Property p = new Property();
      p.setEntity(this);
      p.initializeFromColumn(c);
      properties.add(p);
      propertiesByName.put(p.getName(), p);
      if (p.getColumnName() != null) {
        propertiesByColumnName.put(p.getColumnName().toLowerCase(), p);
      }
      if (p.isId()) {
        idProperties.add(p);
      }
      if (p.isIdentifier()) {
        identifierProperties.add(p);
      }
      if (p.isParent()) {
        parentProperties.add(p);
      }
      if (p.isOrderByProperty())
        orderByProperties.add(p);
    }

    entityValidator = new EntityValidator();
    entityValidator.setEntity(this);
    entityValidator.initialize();

    if (table.getAccessLevel().equals("1")) {
      accessLevelChecker = AccessLevelChecker.ORGANIZATION;
      setAccessLevel(AccessLevel.ORGANIZATION);
    } else if (table.getAccessLevel().equals("3")) {
      accessLevelChecker = AccessLevelChecker.CLIENT_ORGANIZATION;
      setAccessLevel(AccessLevel.CLIENT_ORGANIZATION);
    } else if (table.getAccessLevel().equals("4")) {
      setAccessLevel(AccessLevel.SYSTEM);
      accessLevelChecker = AccessLevelChecker.SYSTEM;
    } else if (table.getAccessLevel().equals("6")) {
      accessLevelChecker = AccessLevelChecker.SYSTEM_CLIENT;
      setAccessLevel(AccessLevel.SYSTEM_CLIENT);
    } else if (table.getAccessLevel().equals("7")) {
      accessLevelChecker = AccessLevelChecker.ALL;
      setAccessLevel(AccessLevel.ALL);
    } else {
      Check.fail("Access level " + table.getAccessLevel() + " for table " + table.getName()
          + " is not supported");
    }

    setModule(table.getThePackage().getModule());
  }

  /**
   * Add a property to the internal arrays of properties (common, identifier, etc.)
   * 
   * @param property
   *          the Property to add
   */
  public void addProperty(Property property) {
    getProperties().add(property);
    if (property.getColumnName() != null) {
      propertiesByColumnName.put(property.getColumnName().toLowerCase(), property);
    }
    if (property.isIdentifier()) {
      getIdentifierProperties().add(property);
    }
    if (property.isId()) {
      getIdProperties().add(property);
    }
  }

  public List<UniqueConstraint> getUniqueConstraints() {
    return uniqueConstraints;
  }

  /**
   * Checks if the {@link #getAccessLevel() accessLevel} of the entity is valid for the clientId and
   * orgId passed as parameters. Throws an OBSecurityException if the clientId and/or orgId are not
   * valid.
   * 
   * @param clientId
   *          the clientId which is checked against the accessLevel
   * @param orgId
   * @throws OBSecurityException
   * @see AccessLevelChecker
   */
  public void checkAccessLevel(String clientId, String orgId) {
    accessLevelChecker.checkAccessLevel(getName(), clientId, orgId);
  }

  /**
   * Validates the passed object using the property validators of this Entity.
   * 
   * @param o
   *          the object to validate
   * @see EntityValidator
   * @see PropertyValidator
   */
  public void validate(Object obj) {
    entityValidator.validate(obj);
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getClassName() {
    return className;
  }

  protected void setClassName(String className) {
    this.className = className;
  }

  /**
   * Loads the class using the {@link #getClassName()} . If this fails then the null is returned and
   * the system will use a DynamicOBObject as the runtime class.
   * 
   * @return the java class implementing this Entity, or null if the class is not available (not
   *         found)
   */
  public Class<?> getMappingClass() {
    if (mappingClass == null && !mappingClassComputed) {
      try {
        // the context class loader is the safest one
        mappingClass = OBClassLoader.getInstance().loadClass(getClassName());
      } catch (final ClassNotFoundException e) {
        mappingClass = null;
      }
      mappingClassComputed = true;
    }
    return mappingClass;
  }

  public void setTraceable(boolean isTraceable) {
    this.isTraceable = isTraceable;
  }

  public void setActiveEnabled(boolean isActiveEnabled) {
    this.isActiveEnabled = isActiveEnabled;
  }

  public void setOrganizationEnabled(boolean isOrganizationEnabled) {
    this.isOrganizationEnabled = isOrganizationEnabled;
  }

  public void setClientEnabled(boolean isClientEnabled) {
    this.isClientEnabled = isClientEnabled;
  }

  /**
   * Returns the list of interfaces implemented by instances of this Entity. It is used by the
   * entity code generation to determine which interfaces to add to the class definition.
   * 
   * @return comma delimited list of interfaces
   */
  public String getImplementsStatement() {

    // NOTE not using the direct reference to the class for the interface
    // names
    // to prevent binary dependency
    final StringBuilder sb = new StringBuilder();
    if (isTraceable()) {
      sb.append("org.openbravo.base.structure.Traceable");
    }
    if (isClientEnabled()) {
      if (sb.length() > 0) {
        sb.append(", ");
      }
      sb.append("org.openbravo.base.structure.ClientEnabled");
    }
    if (isOrganizationEnabled()) {
      if (sb.length() > 0) {
        sb.append(", ");
      }
      sb.append("org.openbravo.base.structure.OrganizationEnabled");
    }
    if (isActiveEnabled()) {
      if (sb.length() > 0) {
        sb.append(", ");
      }
      sb.append("org.openbravo.base.structure.ActiveEnabled");
    }
    if (sb.length() == 0) {
      return "";
    }
    return "implements " + sb.toString();
  }

  /**
   * Checks if the class has a certain property by name.
   * 
   * @param propertyName
   *          the name used to search for the property
   * @return returns true if there is a property with this name, false otherwise
   */
  // TODO: it is saver to also check for the type!
  public boolean hasProperty(String propertyName) {
    return propertiesByName.get(propertyName) != null;
  }

  /**
   * Check if there is a property with the name propertyName. If not then a CheckException is
   * thrown.
   * 
   * @param propertyName
   *          the name used to search for a property
   * @throws CheckException
   */
  public void checkIsValidProperty(String propertyName) {
    Check.isNotNull(propertiesByName.get(propertyName), "Property " + propertyName
        + " not defined for entity " + this);
  }

  /**
   * Checks if there is a property with the name propName and if so checks that the value is of the
   * correct type and is valid.
   * 
   * @param propName
   *          the name used to search for the property
   * @param value
   *          the value is checked against the constraints for the property (for example length,
   *          nullable, etc.)
   * @throws CheckException
   */
  public void checkValidPropertyAndValue(String propName, Object value) {
    Property p;
    if ((p = propertiesByName.get(propName)) == null) {
      throw new OBException("Property " + propName + " not defined for entity " + this);
    }
    p.checkIsValidValue(value);
  }

  public void addPropertyByName(Property p) {
    propertiesByName.put(p.getName(), p);
  }

  /**
   * Retrieves the property using the propertyName. Throws a CheckException if no property exists
   * with that name.
   * 
   * @param propertyName
   *          the name used to search for the property.
   * @return the found property
   * @throws CheckException
   */
  public Property getProperty(String propertyName) {
    final Property prop = propertiesByName.get(propertyName);
    Check.isNotNull(prop, "Property " + propertyName + " does not exist for entity " + this);
    return prop;
  }

  /**
   * Retrieves the property using the columnName. Throws a CheckException if no property exists with
   * that columnName.
   * 
   * @param columnName
   *          the name used to search for the property.
   * @return the found property
   * @throws CheckException
   */
  public Property getPropertyByColumnName(String columnName) {
    final Property prop = propertiesByColumnName.get(columnName.toLowerCase());
    Check.isNotNull(prop, "Property with " + columnName + " does not exist for entity " + this);
    return prop;
  }

  public String getPackageName() {
    final int lastIndexOf = getClassName().lastIndexOf('.');
    return getClassName().substring(0, lastIndexOf);
  }

  /**
   * Returns the last part of the Class name of the class of this Entity. The last part is the part
   * after the last dot.
   * 
   * @return the last segment of the fully qualified Class name
   */
  public String getSimpleClassName() {
    final int lastIndexOf = getClassName().lastIndexOf('.');
    return getClassName().substring(1 + lastIndexOf);
  }

  /**
   * An Entity is traceable if it has auditInfo fields such as created, createdBy etc.
   * 
   * @return true if this Entity has created, createdBy etc. properties.
   */
  public boolean isTraceable() {
    return isTraceable;
  }

  /**
   * @return true if this Entity has an isActive property.
   */
  public boolean isActiveEnabled() {
    return isActiveEnabled;
  }

  /**
   * @return true if this Entity has an organization property.
   */
  public boolean isOrganizationEnabled() {
    return isOrganizationEnabled;
  }

  /**
   * @return true if this Entity has a client property.
   */
  public boolean isClientEnabled() {
    return isClientEnabled;
  }

  public List<Property> getProperties() {
    return properties;
  }

  public void setProperties(List<Property> properties) {
    this.properties = properties;
  }

  /**
   * @return the properties which make up the identifying string of this Entity
   */
  public List<Property> getIdentifierProperties() {
    return identifierProperties;
  }

  public void setIdentifierProperties(List<Property> identifierProperties) {
    this.identifierProperties = identifierProperties;
  }

  /**
   * Only applies if this Entity is a child of another Entity, for example this is the OrderLine of
   * an Order.
   * 
   * @return the list of properties pointing to the parent, an emptylist if there is no such
   *         association to a parent
   */
  public List<Property> getParentProperties() {
    return parentProperties;
  }

  public void setParentProperties(List<Property> parentProperties) {
    this.parentProperties = parentProperties;
  }

  /**
   * The orderBy properties are used when this Entity is a child of another Entity. For example if
   * this Entity is the OrderLine with a lineNo property which determines the order of the lines.
   * Then the lineNo property will be returned as element in the list of this method.
   * 
   * @return the properties which can be used to order instances of this Entity
   */
  public List<Property> getOrderByProperties() {
    return this.orderByProperties;
  }

  public void setOrderByProperties(List<Property> orderByProperties) {
    this.orderByProperties = orderByProperties;
  }

  /**
   * Returns the properties which make up the primary key of this Entity.
   * 
   * @return the list of primary key properties
   */
  public List<Property> getIdProperties() {
    return idProperties;
  }

  public void setIdProperties(List<Property> idProperties) {
    this.idProperties = idProperties;
  }

  public String getTableName() {
    return tableName;
  }

  public void setTableName(String tableName) {
    this.tableName = tableName;
  }

  @Override
  public String toString() {
    return getName();
  }

  public boolean isMutable() {
    return isMutable;
  }

  public void setMutable(boolean isMutable) {
    this.isMutable = isMutable;
  }

  public boolean isDeletable() {
    return isDeletable;
  }

  public void setDeletable(boolean isDeletable) {
    this.isDeletable = isDeletable;
  }

  public boolean hasCompositeId() {
    return getIdProperties().size() == 1 && getIdProperties().get(0).isCompositeId();
  }

  public AccessLevel getAccessLevel() {
    return accessLevel;
  }

  public void setAccessLevel(AccessLevel accessLevel) {
    this.accessLevel = accessLevel;
  }

  public String getTableId() {
    return tableId;
  }

  public void setTableId(String tableId) {
    this.tableId = tableId;
  }

  public boolean isOrganizationPartOfKey() {
    return isOrganizationPartOfKey;
  }

  public void setOrganizationPartOfKey(boolean isOrganizationPartOfKey) {
    this.isOrganizationPartOfKey = isOrganizationPartOfKey;
  }

  public boolean isInActive() {
    return isInActive;
  }

  public void setInActive(boolean isInActive) {
    this.isInActive = isInActive;
  }

  public Module getModule() {
    return module;
  }

  public void setModule(Module module) {
    this.module = module;
  }
}
