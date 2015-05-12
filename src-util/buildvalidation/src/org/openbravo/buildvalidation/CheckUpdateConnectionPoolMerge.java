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
 * All portions are Copyright (C) 2015 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.buildvalidation;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.net.URL;
import java.util.ArrayList;
import java.util.Date;
import java.util.Enumeration;
import java.util.List;
import java.util.Properties;

import org.openbravo.database.ConnectionProvider;
import org.apache.log4j.Logger;

/**
 * This build validation prevents a bad behaviour updating to PR15Q3 by taking into 
 * account the following scenarios:
 *         -  Upgrade from (3.0PR15Q1) to current pi (3.0PR15Q3) using defaults connection pools.
 *         -  Upgrade from (3.0PR15Q1) using Apache JDBC Connection Pool module (or another 
 *         external connection pool) to current pi (3.0PR15Q3).
 * 
 * @author inigo.sanchez
 *
 */
public class CheckUpdateConnectionPoolMerge extends BuildValidation {
  
  private final static String PROPERTY_CONNECTION_POOL = "externalPoolClassName";
  private final static String PATH_CONNECTIONPOOL_PROPERTIES = "/WebContent/WEB-INF/connectionPool.properties";
  private final static String PATH_OPENBRAVO_PROPERTIES = "/config/Openbravo.properties";
  
  private static Logger log = Logger.getLogger(CheckUpdateConnectionPoolMerge.class);
  private Properties obProperties = null;
  
  @Override
  public List<String> execute() {
    ConnectionProvider cp = getConnectionProvider();
    try {

      String obDir = getSourcePathFromOBProperties();
      String openbravoPropertiesPath = obDir + PATH_OPENBRAVO_PROPERTIES;
      String connectionPoolPropertiesPath = obDir + PATH_CONNECTIONPOOL_PROPERTIES;
      String versionOfModule = CheckUpdateConnectionPoolMergeData.versionOfConnectionPoolModule(cp);
      
      // checks if Apache JDBC Connection Pool module exists
      if (versionOfModule == null) {
        File fileW = new File(openbravoPropertiesPath);
        // removes value of property that merge in Openbravo.properties
        replaceProperty(fileW, openbravoPropertiesPath + "_aux", PROPERTY_CONNECTION_POOL,"=");
        try {
          fileW.delete();
          File fileAux = new File(openbravoPropertiesPath + "_aux");
          fileAux.renameTo(new File(openbravoPropertiesPath));
        } catch (Exception ex) {
          log.error("Error renaming/deleting Openbravo.properties", ex);
        }        
        
      }else if(versionOfModule.equals("1.0.0") || versionOfModule.equals("1.0.1") ){
        // necessary for merge connectionPool.properties in Inclusion apache jdbc connection pool
        // into distribution project
        mergeOpenbravoPropertiesConnectionPool(openbravoPropertiesPath, connectionPoolPropertiesPath);   
      }     
    } catch (Exception e) {
      handleError(e);
    }
    return new ArrayList<String>();
  }
  
  /**
   * When updating core and it is include Apache JDBC Connection Pool into distribution in some
   * cases is necessary to update Openbravo.properties taking into account
   * connectionPool.properties.
   *
   * This connectionPool.properties file exists in instances with Apache JDBC Connection Pool
   * module.
   *
   * @return false in case no changes were needed, true in case the merge includes some changes
   */
  public static boolean mergeOpenbravoPropertiesConnectionPool(String OpenbravoPropertiesPath,
      String connectionPoolPath) {
    Properties openbravoProperties = new Properties();
    Properties connectionPoolProperties = new Properties();
    try {
      // load both files
      openbravoProperties.load(new FileInputStream(OpenbravoPropertiesPath));
      connectionPoolProperties.load(new FileInputStream(connectionPoolPath));

      Enumeration<?> propertiesConnectionPool = connectionPoolProperties.propertyNames();
      while (propertiesConnectionPool.hasMoreElements()) {
        String propName = (String) propertiesConnectionPool.nextElement();
        String origValue = openbravoProperties.getProperty(propName);
        String connectionPoolValue = connectionPoolProperties.getProperty(propName);

        // try to get original value for new property, if it does not exist add it to original
        // properties with its default value
        if (origValue == null) {
          addNewProperty(OpenbravoPropertiesPath, propName, connectionPoolValue);
          openbravoProperties.setProperty(propName, connectionPoolValue);
        } else {
          // replace value in Openbravo.properties by value in connectionPool.properties
          try {
            File fileW = new File(OpenbravoPropertiesPath);
            if (!searchProperty(fileW, propName).equals(connectionPoolValue)) {
              replaceProperty(fileW, OpenbravoPropertiesPath + "_aux", propName,
                  "=" + connectionPoolValue);
              try {
                fileW.delete();
                File fileAux = new File(OpenbravoPropertiesPath + "_aux");
                fileAux.renameTo(new File(OpenbravoPropertiesPath));
              } catch (Exception ex) {
                log.error("Error renaming/deleting Openbravo.properties", ex);
              }
            }
          } catch (Exception e) {
            log.error("Error read/write Openbravo.properties", e);
          }
        }
      }
    } catch (Exception notFoundConnectionPoolProperties) {
      return false;
    }
    return true;
  }
  
  /**
   * Adds a new property in a merge of properties file.
   * 
   * Extract from original method in org.openbravo.erpCommon.utility.Utility.java. 
   * It is necessary because build validations can not work with external methods.
   *
   * @param pathFile
   *          properties file path
   * @param propertyName
   *          new property to add
   * @param value
   *          new value to add
   */
  private static void addNewProperty(String pathFile, String propertyName, String value) {
    File fileW = new File(pathFile);
    try {
      BufferedWriter bw = new BufferedWriter(new FileWriter(fileW, true));
      bw.write(propertyName + "=" + value + "\n");
      bw.close();
    } catch (Exception e1) {
      log.error("Exception reading/writing file: ", e1);
    }
  }
  
  /**
   * Replaces a value changeOption in addressFilePath. FileR is used to check that exists
   * searchOption with different value.
   * 
   * Extract from original method in org.openbravo.configuration.ConfigurationApp.java. 
   * It is necessary because build validations can not work with external methods.
   *
   * @param fileR
   *          old file to read
   * @param addressFilePath
   *          file to write new property
   * @param searchOption
   *          Prefix to search
   * @param changeOption
   *          Value to write in addressFilePath
   */
  public static void replaceProperty(File fileR, String addressFilePath, String searchOption,
      String changeOption) throws Exception {
    boolean isFound = false;
    FileReader fr = new FileReader(fileR);
    BufferedReader br = new BufferedReader(fr);
    // auxiliary file to rewrite
    File fileW = new File(addressFilePath);
    FileWriter fw = new FileWriter(fileW);
    // data for restore
    String line;
    while ((line = br.readLine()) != null) {
      if (line.indexOf(searchOption) == 0) {
        // Replace new option
        line = line.replace(line, searchOption + changeOption);
        isFound = true;
      }
      fw.write(line + "\n");
    }
    if (!isFound) {
      fw.write(searchOption + changeOption);
    }
    fr.close();
    fw.close();
    br.close();
  }
  
  /**
   * Searches an option in filePath file and returns the value of searchOption.
   * 
   * Extract from original method in org.openbravo.configuration.ConfigurationApp.java. 
   * It is necessary because build validations can not work with external methods.
   *
   * @param filePath
   *          Path of file
   * @param searchOption
   *          Prefix of property to search
   * @return valueFound Value found
   */
  public static String searchProperty(File filePath, String searchOption){
    String valueFound = "";
    try{
    FileReader fr = new FileReader(filePath);
    BufferedReader br = new BufferedReader(fr);
    String line;
    while ((line = br.readLine()) != null) {
      if (line.indexOf(searchOption) == 0) {
        valueFound = line.substring(searchOption.length() + 1);
        break;
      }
    }
    fr.close();
    br.close();
    }catch(Exception e){
      log.error("Exception searching a property: ", e);
    }
    return valueFound;
  }
  
  /**
   * Gets source.path property from Openbravo.properties file
   * 
   */
  public String getSourcePathFromOBProperties(){
    // get the location of the current class file
    final URL url = this.getClass().getResource(getClass().getSimpleName() + ".class");
    File f = new File(url.getPath());
    File propertiesFile = null;
    while (f.getParentFile() != null && f.getParentFile().exists()) {
      f = f.getParentFile();
      final File configDirectory = new File(f, "config");
      if (configDirectory.exists()) {
        propertiesFile = new File(configDirectory, "Openbravo.properties");
        if (propertiesFile.exists()) {
          // found it and break
          break;
        }
      }
    }
    return searchProperty(propertiesFile,"source.path");
  }
}
