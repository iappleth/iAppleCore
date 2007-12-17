/*
************************************************************************************
* Copyright (C) 2001-2006 Openbravo S.L.
* Licensed under the Apache Software License version 2.0
* You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
* Unless required by applicable law or agreed to  in writing,  software  distributed
* under the License is distributed  on  an  "AS IS"  BASIS,  WITHOUT  WARRANTIES  OR
* CONDITIONS OF ANY KIND, either  express  or  implied.  See  the  License  for  the
* specific language governing permissions and limitations under the License.
************************************************************************************
*/

package org.openbravo.ddlutils.task;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.Writer;
import java.util.Properties;
import org.apache.commons.dbcp.BasicDataSource;
import org.apache.ddlutils.Platform;
import org.apache.ddlutils.PlatformFactory;
import org.apache.ddlutils.model.Database;
import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.Task;

import org.apache.log4j.Level;
import org.apache.log4j.LogManager;
import org.apache.log4j.PropertyConfigurator;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.ddlutils.task.VerbosityLevel;

/**
 *
 * @author adrian
 */
public class AlterXML2SQL extends Task {
    
    private String platform = null;    
    private File originalmodel = null;
    
    private String driver;
    private String url;
    private String user;
    private String password;   

    private File model;
    private File output;
    
    private String object = null;

    protected Log _log;
    private VerbosityLevel _verbosity = null;
    
    /** Creates a new instance of ExecuteXML2SQL */
    public AlterXML2SQL() {
    }
    
    /**
     * Initializes the logging.
     */
    private void initLogging() {
        // For Ant, we're forcing DdlUtils to do logging via log4j to the console
        Properties props = new Properties();
        String     level = (_verbosity == null ? Level.INFO.toString() : _verbosity.getValue()).toUpperCase();

        props.setProperty("log4j.rootCategory", level + ",A");
        props.setProperty("log4j.appender.A", "org.apache.log4j.ConsoleAppender");
        props.setProperty("log4j.appender.A.layout", "org.apache.log4j.PatternLayout");
        props.setProperty("log4j.appender.A.layout.ConversionPattern", "%m%n");
        // we don't want debug logging from Digester/Betwixt
        props.setProperty("log4j.logger.org.apache.commons", "WARN");

        LogManager.resetConfiguration();
        PropertyConfigurator.configure(props);

        _log = LogFactory.getLog(getClass());
    }
    
    public void execute() {
       
        initLogging();
                
        Platform pl;
        Database originaldb;
            
        if (platform == null || originalmodel == null) {
            BasicDataSource ds = new BasicDataSource();
            ds.setDriverClassName(getDriver());
            ds.setUrl(getUrl());
            ds.setUsername(getUser());
            ds.setPassword(getPassword());    

            pl = PlatformFactory.createNewPlatformInstance(ds);
            // platform.setDelimitedIdentifierModeOn(true);
            _log.info("Using database platform.");

            try {                        

                if (getOriginalmodel() == null) {
                    originaldb = pl.loadModelFromDatabase(); 
                    if (originaldb == null) {
                        originaldb =  new Database();
                        _log.info("Original model considered empty.");
                    } else {
                        _log.info("Original model loaded from database.");
                    }                   
                } else {
                    // Load the model from the file
                    originaldb = DatabaseUtils.readDatabase(getModel());
                    _log.info("Original model loaded from file.");
                }     
            } catch (Exception e) {
                // log(e.getLocalizedMessage());
                throw new BuildException(e);
            }                  
        } else {
            pl = PlatformFactory.createNewPlatformInstance(platform);
            _log.info("Using platform : " + platform);
            
            originaldb = DatabaseUtils.readDatabase(originalmodel);
            _log.info("Original model loaded from file.");
        }
        
        try {        

            Database db = DatabaseUtils.readDatabase(model);
                        
            // Write update script
            _log.info("Writing update script");
            // crop database if needed
            if (object != null) {
                db = DatabaseUtils.cropDatabase(originaldb, db, object);
                _log.info("for database object " + object);                
            } else {
                _log.info("for the complete database");                
            }            

            Writer w = new FileWriter(output);
            pl.getSqlBuilder().setWriter(w);
            pl.getSqlBuilder().alterDatabase(originaldb, db, null);
            w.close();
            
            _log.info("Database script created in : " + output.getPath());
            
        } catch (IOException e) {
            // log(e.getLocalizedMessage());
            throw new BuildException(e);
        }        
    }
    
    public String getDriver() {
        return driver;
    }

    public void setDriver(String driver) {
        this.driver = driver;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public File getOriginalmodel() {
        return originalmodel;
    }

    public void setOriginalmodel(File originalmodel) {
        this.originalmodel = originalmodel;
    }

    public File getOutput() {
        return output;
    }

    public void setOutput(File output) {
        this.output = output;
    }

    public File getModel() {
        return model;
    }

    public void setModel(File model) {
        this.model = model;
    }
    
    public void setObject(String object) {
        if (object == null || object.trim().startsWith("$") || object.trim().equals("")) {
            this.object = null;
        } else {            
            this.object = object;
        }
    }
    
    public String getObject() {
        return object;
    }
    
    /**
     * Specifies the verbosity of the task's debug output.
     * 
     * @param level The verbosity level
     * @ant.not-required Default is <code>INFO</code>.
     */
    public void setVerbosity(VerbosityLevel level)
    {
        _verbosity = level;
    }
    
}
