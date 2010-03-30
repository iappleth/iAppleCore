package org.openbravo.buildvalidation;

import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.List;

import org.apache.log4j.Logger;
import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.Task;

public class BuildValidationHandler extends Task {
  private static final Logger log4j = Logger.getLogger(BuildValidationHandler.class);

  private File basedir;
  private String module;

  @Override
  public void execute() {
    String errorMessage = "";
    List<String> classes = new ArrayList<String>();
    File modFolders[];
    if (module != null && !module.equals("%")) {
      File moduleFolder = new File(basedir, "modules/" + module);
      modFolders = new File[1];
      modFolders[0] = moduleFolder;
    } else {
      File coreBuildFolder = new File(basedir, "src-util/buildvalidation/build/classes");
      readClassFiles(classes, coreBuildFolder);
      File moduleFolder = new File(basedir, "modules");
      modFolders = moduleFolder.listFiles();
    }
    for (File modFolder : modFolders) {
      if (modFolder.isDirectory()) {
        File validationFolder = new File(modFolder, "build/classes");
        if (validationFolder.exists()) {
          readClassFiles(classes, validationFolder);
        }
      }
    }

    for (String s : classes) {
      ArrayList<String> errors = new ArrayList<String>();
      try {
        Class<?> myClass = Class.forName(s);
        if (myClass.getGenericSuperclass().equals(
            Class.forName("org.openbravo.buildvalidation.BuildValidation"))) {
          Object instance = myClass.newInstance();
          log4j.info("Executing build validation: " + s);
          errors = callExecute(myClass, instance);
          for (String error : errors) {
            errorMessage += error + "\n";
          }
        }
      } catch (Exception e) {
        log4j.info("Error executing build-validation: " + s, e);
        throw new BuildException("The build validation " + s + " couldn't be properly executed");
      }
      if (errors.size() > 0) {
        throw new BuildException(
            errorMessage
                + "\nThe build validation failed. The system hasn't been modified. Fix the problems described in the validation messages, and then start the build again.");
      }
    }
  }

  @SuppressWarnings("unchecked")
  private ArrayList<String> callExecute(Class<?> myClass, Object instance)
      throws IllegalAccessException, InvocationTargetException, NoSuchMethodException {
    return (ArrayList<String>) myClass.getMethod("execute", new Class[0]).invoke(instance,
        new Object[0]);
  }

  private void readClassFiles(List<String> coreClasses, File file) {
    if (!file.exists()) {
      return;
    }
    if (file.isDirectory()) {
      File[] files = file.listFiles();
      for (File f : files) {
        readClassFiles(coreClasses, f);
      }
    } else {
      String fileName = file.getAbsolutePath();
      fileName = fileName.split("build" + File.separatorChar + "classes" + File.separatorChar)[1];
      coreClasses.add(fileName.replace(".class", "").replace(File.separatorChar, '.'));
    }
  }

  public File getBasedir() {
    return basedir;
  }

  public void setBasedir(File basedir) {
    this.basedir = basedir;
  }

  public String getModule() {
    return module;
  }

  public void setModule(String module) {
    this.module = module;
  }

}
