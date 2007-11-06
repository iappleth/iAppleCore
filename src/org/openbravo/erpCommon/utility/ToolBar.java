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
 * All portions are Copyright (C) 2001-2006 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
*/
package org.openbravo.erpCommon.utility;

import org.openbravo.database.ConnectionProvider;
import java.util.Hashtable;
import java.util.Vector;
import org.apache.log4j.Logger ;

public class ToolBar {
  static Logger log4j = Logger.getLogger(ToolBar.class);
  ConnectionProvider conn;
  String language = "en_US";
  String servlet_action = "";
  boolean isNew = false;
  String keyfield = "";
  String form = "document.forms[0]";
  String grid_id = "";
  String pdf = "";
  boolean isDirectPrint = false;
  String window_name = "";
  String base_direction = "";
  boolean debug = false;
  boolean isSrcWindow = false;
  boolean isFrame = false;
  boolean isRelation = false;
  Hashtable<String, HTMLElement> buttons = new Hashtable<String, HTMLElement>();

  public ToolBar(ConnectionProvider _conn, String _language, String _action, boolean _isNew, String _keyINP, String _gridID, String _PDFName, boolean _isDirectPrinting, String _windowName, String _baseDirection, boolean _debug) {
    this(_conn, _language, _action, _isNew,  _keyINP,  _gridID, _PDFName, _isDirectPrinting, _windowName, _baseDirection, _debug, false);
  }

  public ToolBar(ConnectionProvider _conn, String _language, String _action, boolean _isNew, String _keyINP, String _gridID, String _PDFName, boolean _isDirectPrinting, String _windowName, String _baseDirection, boolean _debug, boolean _isSrcWindow){
    this(_conn, _language, _action, _isNew,  _keyINP,  _gridID, _PDFName, _isDirectPrinting, _windowName, _baseDirection, _debug, _isSrcWindow, false);
  }
  public ToolBar(ConnectionProvider _conn, String _language, String _action, boolean _isNew, String _keyINP, String _gridID, String _PDFName, boolean _isDirectPrinting, String _windowName, String _baseDirection, boolean _debug, boolean _isSrcWindow, boolean _isFrame) {
    this.conn = _conn;
    this.language = _language;
    this.servlet_action = _action;
    this.isNew = _isNew;
    this.keyfield = _keyINP;
    if (_gridID!=null) this.grid_id = _gridID;
    if (_PDFName!=null) this.pdf = _PDFName;
    this.isDirectPrint = _isDirectPrinting;
    this.window_name = _windowName;
    this.base_direction = _baseDirection;
    this.debug = _debug;
    this.isFrame = _isFrame;
    int i=this.keyfield.lastIndexOf(".");
    if (i!=-1) this.form = this.keyfield.substring(0, i);
    this.isSrcWindow = _isSrcWindow;
    createAllButtons();
  }



  public void removeElement(String name) {
    try {
      if (buttons!=null && !buttons.isEmpty()) buttons.remove(name);
    } catch (NullPointerException ignored) {
    }
  }

  private String getButtonScript(String name) {
    if (name.equals("RELATED_INFO")) {
      return "openServletNewWindow('DEFAULT', true, '../utility/UsedByLink.html', 'LINKS', null, true, 500, 600, true);";
    } else if (name.equals("EDIT")) {
      return "submitCommandForm('" + name + "', true, null, '" + servlet_action + (isSrcWindow?"":"_Relation") + ".html', '_self', null, " + (debug?"true":"false") + ");";
    } else if (name.startsWith("SAVE")) {
      return "submitCommandForm('SAVE_" + (isNew?"NEW":"EDIT") + name.substring(4) + "', true, null, '" + servlet_action + (isSrcWindow?"":"_Relation") + ".html', '_self', true, false);";
    } else if (name.equals("TREE")) {
      return "openServletNewWindow('DEFAULT', false, '../utility/WindowTree.html', 'TREE', null, null,625, 750, true, false, false);";
    } else if (name.equals("ATTACHMENT")) {
      return "openServletNewWindow('DEFAULT', false, '../businessUtility/TabAttachments_FS.html?inpKey=' + " + ((grid_id==null || grid_id.equals(""))?keyfield + ".value":"dojo.widget.byId('" + grid_id + "').getSelectedRows()") + ", 'ATTACHMENT', null, true, 600, 700, true);";
    } else if (name.equals("EXCEL")) {
      return "abrirExcel('" + servlet_action + "_Excel.xls?Command=RELATION_XLS', '_blank');";
    } else if (name.equals("GRIDEXCEL")) {
      return "openServletNewWindow('EXCEL', false, '../utility/ExportGrid.xls?inpTabId=' + document.forms[0].inpTabId.value, 'GRIDEXCEL', null, null, 500, 350, true );";
    } else if (name.equals("GRIDCSV")) {
      return "openServletNewWindow('CSV', false, '../utility/ExportGrid.csv?inpTabId=' + document.forms[0].inpTabId.value, 'GRIDCSV', null, null, 500, 350, true );";
    } else if (name.equals("GRIDPDF")) {
      return "openServletNewWindow('PDF', false, '../utility/ExportGrid.pdf?inpTabId=' + document.forms[0].inpTabId.value, 'GRIDPDF', null, null, 500, 350, true );";
    } else if (name.equals("PRINT")) {
      return "abrirPDFSession('" + pdf + "', '" + (isDirectPrint?"Printing":"") + "', " + keyfield + ".name, " + ((grid_id==null || grid_id.equals(""))?"null":"dojo.widget.byId('" + grid_id + "').getSelectedRows()") + ", " + ((grid_id==null || grid_id.equals(""))?"true":"null") + ");";
    } else if (name.equals("UNDO")) {
      return form + ".reset();displayLogic();";
    } else if (name.equals("SEARCH")) {
      return "abrirBusqueda('../businessUtility/Buscador.html', 'BUSCADOR', " + form + ".inpTabId.value, '" + window_name + "/" + servlet_action + (isSrcWindow?"":"_Relation") + ".html', " + form + ".inpwindowId.value, " + (debug?"true":"false") + ");";
    } else if (grid_id!=null && !grid_id.equals("") && name.equals("PREVIOUS")) {
      return "dojo.widget.byId('grid').goToPreviousRow();";
    } else if (grid_id!=null && !grid_id.equals("") && name.equals("NEXT")) {
      return "dojo.widget.byId('grid').goToNextRow();";
    } else if (name.equals("DELETE_RELATION")) {
      return "dojo.widget.byId('grid').deleteRow();";
    } else if (name.equals("FIRST_RELATION")) {
      return "dojo.widget.byId('grid').goToFirstRow();";
      } else if (name.equals("LAST_RELATION")) {
      return "dojo.widget.byId('grid').goToLastRow();";
    } else {
      return "submitCommandForm('" + (name.equals("REFRESH")?"DEFAULT":name) + "', false, null, '" + servlet_action + (isSrcWindow?"":"_Relation") + ".html', '"+(isFrame?"_parent":"_self")+"', null, " + (debug?"true":"false") + ");";
    }
  }


  private void createAllButtons() {
    buttons.put("NEW", new ToolBar_Button(base_direction, "New", Utility.messageBD(conn, "New", language), getButtonScript("NEW")));
    buttons.put("EDIT", new ToolBar_Button(base_direction, "Edit", Utility.messageBD(conn, "Edit", language), getButtonScript("EDIT")));
    buttons.put("RELATION", new ToolBar_Button(base_direction, "Relation", Utility.messageBD(conn, "Relation", language), getButtonScript("RELATION")));
    buttons.put("FIND", new ToolBar_Button(base_direction, "Find", Utility.messageBD(conn, "Find", language), getButtonScript("FIND")));
    buttons.put("SEPARATOR2", new ToolBar_Space(base_direction));
    buttons.put("SAVE_RELATION", new ToolBar_Button(base_direction, "Save_Relation", Utility.messageBD(conn, "SaveRelation", language), getButtonScript("SAVE_RELATION")));
    buttons.put("SAVE_NEW", new ToolBar_Button(base_direction, "Save_New", Utility.messageBD(conn, "SaveNew", language), getButtonScript("SAVE_NEW")));
    buttons.put("SAVE_EDIT", new ToolBar_Button(base_direction, "Save", Utility.messageBD(conn, "SaveEdit", language), getButtonScript("SAVE_EDIT")));
    buttons.put("SAVE_NEXT", new ToolBar_Button(base_direction, "Save_Next", Utility.messageBD(conn, "SaveNext", language), getButtonScript("SAVE_NEXT")));
    buttons.put("SEPARATOR3", new ToolBar_Space(base_direction));
    buttons.put("DELETE", new ToolBar_Button(base_direction, "Delete", Utility.messageBD(conn, "Delete", language), getButtonScript("DELETE")));
    buttons.put("DELETE_RELATION", new ToolBar_Button(base_direction, "Delete", Utility.messageBD(conn, "Delete", language), getButtonScript("DELETE_RELATION")));
    buttons.put("SEPARATOR4", new ToolBar_Space(base_direction));
    //buttons.put("REFRESH", new ToolBar_Button(base_direction, "Refresh", Utility.messageBD(conn, "Refresh", language), getButtonScript("REFRESH")));
    buttons.put("UNDO", new ToolBar_Button(base_direction, "Undo", Utility.messageBD(conn, "Undo", language), getButtonScript("UNDO")));
    buttons.put("TREE", new ToolBar_Button(base_direction, "Tree", Utility.messageBD(conn, "Tree", language), getButtonScript("TREE")));
    buttons.put("ATTACHMENT", new ToolBar_Button(base_direction, "Attachment", Utility.messageBD(conn, "Attachment", language), getButtonScript("ATTACHMENT")));
    buttons.put("EXCEL", new ToolBar_Button(base_direction, "Excel", Utility.messageBD(conn, "ExportExcel", language), getButtonScript("EXCEL")));
    buttons.put("GRIDEXCEL", new ToolBar_Button(base_direction, "ExportExcel", Utility.messageBD(conn, "ExportExcel", language), getButtonScript("GRIDEXCEL")));
    buttons.put("GRIDCSV", new ToolBar_Button(base_direction, "ExportCsv", Utility.messageBD(conn, "ExportCsv", language), getButtonScript("GRIDCSV")));
    buttons.put("GRIDPDF", new ToolBar_Button(base_direction, "ExportPDF", Utility.messageBD(conn, "ExportPDF", language), getButtonScript("GRIDPDF")));
    if (pdf!=null && !pdf.equals("") && !pdf.equals("..")) buttons.put("PRINT", new ToolBar_Button(base_direction, "Print", Utility.messageBD(conn, "Print", language), getButtonScript("PRINT")));
    buttons.put("SEARCH", new ToolBar_Button(base_direction, "Search", Utility.messageBD(conn, "Search", language), getButtonScript("SEARCH")));
    buttons.put("SEARCH_FILTERED", new ToolBar_Button(base_direction, "SearchFiltered", Utility.messageBD(conn, "Search", language), getButtonScript("SEARCH")));
    buttons.put("SEPARATOR5", new ToolBar_Space(base_direction));
    buttons.put("FIRST", new ToolBar_Button(base_direction, "First", Utility.messageBD(conn, "GotoFirst", language), getButtonScript("FIRST")));
    buttons.put("FIRST_RELATION", new ToolBar_Button(base_direction, "First", Utility.messageBD(conn, "GotoFirst", language), getButtonScript("FIRST_RELATION")));
    buttons.put("PREVIOUS", new ToolBar_Button(base_direction, "Previous", Utility.messageBD(conn, "GotoPrevious", language), getButtonScript("PREVIOUS")));
    buttons.put("NEXT", new ToolBar_Button(base_direction, "Next", Utility.messageBD(conn, "GotoNext", language), getButtonScript("NEXT")));
    buttons.put("LAST", new ToolBar_Button(base_direction, "Last", Utility.messageBD(conn, "GotoLast", language), getButtonScript("LAST")));
    buttons.put("LAST_RELATION", new ToolBar_Button(base_direction, "Last", Utility.messageBD(conn, "GotoLast", language), getButtonScript("LAST_RELATION")));
    
    
    buttons.put("SEPARATOR6", new ToolBar_Space(base_direction));
  //  buttons.put("PREVIOUS_RELATION", new ToolBar_Button(base_direction, "PreviousRange", Utility.messageBD(conn, "GotoPreviousRange", language), getButtonScript("PREVIOUS_RELATION")));
    buttons.put("PREVIOUS_RELATION", new ToolBar_Button(base_direction, "Previous", Utility.messageBD(conn, "GotoPreviousRange", language), getButtonScript("PREVIOUS_RELATION")));
    buttons.put("PREVIOUS_RELATION_DISABLED", new ToolBar_Button(base_direction, "PreviousRangeDisabled", Utility.messageBD(conn, "GotoPreviousRange", language), ""));
   // buttons.put("NEXT_RELATION", new ToolBar_Button(base_direction, "NextRange", Utility.messageBD(conn, "GotoNextRange", language), getButtonScript("NEXT_RELATION")));
    buttons.put("NEXT_RELATION", new ToolBar_Button(base_direction, "Next", Utility.messageBD(conn, "GotoNextRange", language), getButtonScript("NEXT_RELATION")));
    buttons.put("NEXT_RELATION_DISABLED", new ToolBar_Button(base_direction, "NextRangeDisabled", Utility.messageBD(conn, "GotoNextRange", language), ""));
    
    
    
    
    buttons.put("SEPARATOR7", new ToolBar_Space(base_direction));
    buttons.put("CAPTURE", new ToolBar_Button(base_direction, "Capture", Utility.messageBD(conn, "Capture", language), ""));
    buttons.put("CHECK_CONTENT", new ToolBar_Button(base_direction, "CheckContent", Utility.messageBD(conn, "CheckContent", language), ""));
    buttons.put("CHECK_ELEMENT", new ToolBar_Button(base_direction, "CheckElement", Utility.messageBD(conn, "CheckElement", language), ""));
    buttons.put("HR1", new ToolBar_HR());
    buttons.put("RELATED_INFO", new ToolBar_Button(base_direction, "RelatedInfo", Utility.messageBD(conn, "Linked Items", language), getButtonScript("RELATED_INFO")));
  }

  public void prepareInfoTemplate(boolean hasPrevious, boolean hasNext, boolean isTest) {
    removeElement("NEW");
    removeElement("EDIT");
    removeElement("RELATION");
    removeElement("FIND");
    removeElement("SEPARATOR2");
    removeElement("SAVE_RELATION");
    removeElement("SAVE_NEW");
    removeElement("SAVE_EDIT");
    removeElement("SAVE_NEXT");
    removeElement("SEPARATOR3");
    removeElement("DELETE");
    removeElement("DELETE_RELATION");
    removeElement("SEPARATOR4");
    //removeElement("REFRESH");
    removeElement("UNDO");
    removeElement("TREE");
    removeElement("ATTACHMENT");
    removeElement("EXCEL");
    removeElement("GRIDEXCEL");
    removeElement("GRIDCSV");
    removeElement("GRIDPDF");
    removeElement("PRINT");
    removeElement("SEARCH");
    removeElement("SEARCH_FILTERED");
    removeElement("SEPARATOR5");
    removeElement("FIRST");
    removeElement("FIRST_RELATION");
    removeElement("PREVIOUS");
    removeElement("NEXT");
    removeElement("LAST");
    removeElement("LAST_RELATION");
    removeElement("SEPARATOR6");

    if (!hasPrevious) removeElement("PREVIOUS_RELATION");
    else removeElement("PREVIOUS_RELATION_DISABLED");
    if (!hasNext) removeElement("NEXT_RELATION");
    else removeElement("NEXT_RELATION_DISABLED");
    if (!isTest) removeAllTests();
  }

  public void prepareEditionTemplate(boolean hasTree, boolean isFiltered, boolean isTest, boolean isReadOnly) {
    removeElement("EDIT");
    removeElement("RELATION");
    removeElement("DELETE_RELATION");
    removeElement("EXCEL");
    removeElement("GRIDEXCEL");
    removeElement("GRIDCSV");
    removeElement("GRIDPDF");
    removeElement("FIRST_RELATION");
    removeElement("LAST_RELATION");
    removeElement("FIND");
    
    
    removeElement("PREVIOUS_RELATION");
    removeElement("PREVIOUS_RELATION_DISABLED");
    removeElement("NEXT_RELATION");
    removeElement("NEXT_RELATION_DISABLED");
    
    if (!hasTree) removeElement("TREE");
    if (isNew) {
      removeElement("SAVE_NEXT");
      removeElement("DELETE");
      removeElement("ATTACHMENT");
    }
    if (isFiltered) removeElement("SEARCH");
    else removeElement("SEARCH_FILTERED");
    if (!isTest) removeAllTests();
    if (isReadOnly) removeReadOnly();
  }

  public void prepareRelationTemplate(boolean hasTree, boolean isFiltered, boolean isTest, boolean isReadOnly) {
    isRelation = true;
    removeElement("EDIT");
    removeElement("RELATION");
    removeElement("DELETE");
    removeElement("SAVE_RELATION");
    removeElement("SAVE_NEW");
    removeElement("SAVE_EDIT");
    removeElement("SAVE_NEXT");
    removeElement("UNDO");
    removeElement("FIRST");
    removeElement("LAST");
    removeElement("FIND");
    removeElement("EXCEL");
    
    removeElement("PREVIOUS_RELATION");
    removeElement("PREVIOUS_RELATION_DISABLED");
    removeElement("NEXT_RELATION");
    removeElement("NEXT_RELATION_DISABLED");
    
    if (!hasTree) removeElement("TREE");
    if (isFiltered) removeElement("SEARCH");
    else removeElement("SEARCH_FILTERED");
    if (!isTest) removeAllTests();
    if (isReadOnly) removeReadOnly();
  }

  //AL New toolbars
  public void prepareSimpleToolBarTemplateFrame() {
  
  }
  public void prepareSimpleToolBarTemplate() {
    removeElement("SEPARATOR1");
    removeElement("NEW");
    removeElement("EDIT");
    removeElement("RELATION");
    removeElement("FIND");
    removeElement("SEPARATOR2");
    removeElement("SAVE_RELATION");
    removeElement("SAVE_NEW");
    removeElement("SAVE_EDIT");
    removeElement("SAVE_NEXT");
    removeElement("DELETE");
    removeElement("DELETE_RELATION");
    removeElement("UNDO");
    removeElement("TREE");
    removeElement("ATTACHMENT");
    removeElement("EXCEL");
    removeElement("GRIDEXCEL");
    removeElement("GRIDCSV");
    removeElement("GRIDPDF");
    removeElement("SEARCH");
    removeElement("SEARCH_FILTERED");
    removeElement("ORDERBY");
    removeElement("ORDERBY_FILTERED");
    removeElement("FIRST");
    removeElement("FIRST_RELATION");
    removeElement("PREVIOUS");
    removeElement("NEXT");
    removeElement("LAST");
    removeElement("LAST_RELATION");
    removeElement("PREVIOUS_RELATION");
    removeElement("PREVIOUS_RELATION_DISABLED");
    removeElement("NEXT_RELATION");
    removeElement("NEXT_RELATION_DISABLED");
    removeElement("CAPTURE");
    removeElement("CHECK_CONTENT");
    removeElement("CHECK_ELEMENT");  
    if (pdf!=null && !pdf.equals("") && !pdf.equals(".."))
       buttons.put("PRINT", new ToolBar_Button(base_direction, "Print", Utility.messageBD(conn, "Print", language), pdf));
    removeElement("RELATED_INFO"); 
  }

  //Simple toolbar with save button
  public void prepareSimpleSaveToolBarTemplate() {
    removeElement("RELATED_INFO"); 
    removeElement("SEPARATOR1");
    removeElement("NEW");
    removeElement("EDIT");
    removeElement("RELATION");
    removeElement("FIND");
    removeElement("SEPARATOR2");
    removeElement("SAVE_RELATION");
    removeElement("SAVE_NEW");
    removeElement("SAVE_NEXT");
    removeElement("DELETE");
    removeElement("DELETE_RELATION");
    removeElement("UNDO");
    removeElement("TREE");
    removeElement("ATTACHMENT");
    removeElement("EXCEL");
    removeElement("GRIDEXCEL");
    removeElement("GRIDCSV");
    removeElement("GRIDPDF");
    removeElement("SEARCH");
    removeElement("SEARCH_FILTERED");
    removeElement("ORDERBY");
    removeElement("ORDERBY_FILTERED");
    removeElement("FIRST");
    removeElement("FIRST_RELATION");
    removeElement("PREVIOUS");
    removeElement("NEXT");
    removeElement("LAST");
    removeElement("LAST_RELATION");
    removeElement("PREVIOUS_RELATION");
    removeElement("PREVIOUS_RELATION_DISABLED");
    removeElement("NEXT_RELATION");
    removeElement("NEXT_RELATION_DISABLED");
    removeElement("CAPTURE");
    removeElement("CHECK_CONTENT");
    removeElement("CHECK_ELEMENT");  
    if (pdf!=null && !pdf.equals("") && !pdf.equals(".."))
       buttons.put("PRINT", new ToolBar_Button(base_direction, "Print", Utility.messageBD(conn, "Print", language), pdf));
  }
  
  public void prepareRelationBarTemplate(boolean hasPrevious, boolean hasNext) {
    prepareRelationBarTemplate(hasPrevious, hasNext,"");
  }
  public void prepareRelationBarTemplate(boolean hasPrevious, boolean hasNext,  String excelScript) {
    removeElement("SEPARATOR1");
    removeElement("NEW");
    removeElement("EDIT");
    removeElement("RELATION");
    removeElement("FIND");
    removeElement("SEPARATOR2");
    removeElement("SAVE_RELATION");
    removeElement("SAVE_NEW");
    removeElement("SAVE_EDIT");
    removeElement("SAVE_NEXT");
    removeElement("DELETE");
    removeElement("DELETE_RELATION");
    removeElement("UNDO");
    removeElement("TREE");
    removeElement("ATTACHMENT");
    removeElement("EXCEL");
    removeElement("GRIDEXCEL");
    removeElement("GRIDCSV");
    removeElement("GRIDPDF");
    removeElement("SEARCH");
    removeElement("SEARCH_FILTERED");
    removeElement("ORDERBY");
    removeElement("ORDERBY_FILTERED");
    removeElement("FIRST");
    removeElement("FIRST_RELATION");
    removeElement("PREVIOUS");
    removeElement("NEXT");
    removeElement("LAST");
    removeElement("LAST_RELATION");
  
    removeElement(hasPrevious?"PREVIOUS_RELATION_DISABLED":"PREVIOUS_RELATION");
    removeElement(hasNext?"NEXT_RELATION_DISABLED":"NEXT_RELATION");
    
    removeElement("CAPTURE");
    removeElement("CHECK_CONTENT");
    removeElement("CHECK_ELEMENT");  
    removeElement("RELATED_INFO"); // Modified
    if (pdf!=null && !pdf.equals("") && !pdf.equals(".."))
       buttons.put("PRINT", new ToolBar_Button(base_direction, "Print", Utility.messageBD(conn, "Print", language), pdf));
    if (!excelScript.equals("") && excelScript != null)
        buttons.put("EXCEL", new ToolBar_Button(base_direction, "Excel", Utility.messageBD(conn, "ExportExcel", language), excelScript));
  }
    public void prepareSimpleExcelToolBarTemplate(String excelScript) {
    removeElement("SEPARATOR1");
    removeElement("NEW");
    removeElement("EDIT");
    removeElement("RELATION");
    removeElement("FIND");
    removeElement("SEPARATOR2");
    removeElement("SAVE_RELATION");
    removeElement("SAVE_NEW");
    removeElement("SAVE_EDIT");
    removeElement("SAVE_NEXT");
    removeElement("DELETE");
    removeElement("DELETE_RELATION");
    removeElement("UNDO");
    removeElement("TREE");
    removeElement("ATTACHMENT");
    removeElement("GRIDEXCEL");
    removeElement("GRIDCSV");
    removeElement("GRIDPDF");
    removeElement("SEARCH");
    removeElement("SEARCH_FILTERED");
    removeElement("ORDERBY");
    removeElement("ORDERBY_FILTERED");
    removeElement("FIRST");
    removeElement("FIRST_RELATION");
    removeElement("PREVIOUS");
    removeElement("NEXT");
    removeElement("LAST");
    removeElement("LAST_RELATION");
    removeElement("PREVIOUS_RELATION");
    removeElement("PREVIOUS_RELATION_DISABLED");
    removeElement("NEXT_RELATION");
    removeElement("NEXT_RELATION_DISABLED");
    removeElement("CAPTURE");
    removeElement("CHECK_CONTENT");
    removeElement("CHECK_ELEMENT");  

    if (!excelScript.equals("") && excelScript != null)
        buttons.put("EXCEL", new ToolBar_Button(base_direction, "Excel", Utility.messageBD(conn, "ExportExcel", language), excelScript));

  }
  //GD Toolbar with Menu, Refresh and Excel buttons
  public void prepareExcelToolBarTemplate() {
    removeElement("NEW");
    removeElement("EDIT");
    removeElement("RELATION");
    removeElement("FIND");
    removeElement("SEPARATOR2");
    removeElement("SAVE_RELATION");
    removeElement("SAVE_NEW");
    removeElement("SAVE_EDIT");
    removeElement("SAVE_NEXT");
    removeElement("DELETE");
    removeElement("DELETE_RELATION");
    removeElement("UNDO");
    removeElement("TREE");
    removeElement("GRIDEXCEL");
    removeElement("GRIDCSV");
    removeElement("GRIDPDF");
    removeElement("ATTACHMENT");
    removeElement("SEARCH");
    removeElement("SEARCH_FILTERED");
    removeElement("ORDERBY");
    removeElement("ORDERBY_FILTERED");
    removeElement("FIRST");
    removeElement("FIRST_RELATION");
    removeElement("PREVIOUS");
    removeElement("NEXT");
    removeElement("LAST");
    removeElement("LAST_RELATION");
    removeElement("PREVIOUS_RELATION");
    removeElement("PREVIOUS_RELATION_DISABLED");
    removeElement("NEXT_RELATION");
    removeElement("NEXT_RELATION_DISABLED");
    removeElement("CAPTURE");
    removeElement("CHECK_CONTENT");
    removeElement("CHECK_ELEMENT");  
  }

//AL
  public void prepareSortableTemplate(boolean isTest) {
    removeElement("NEW");
    removeElement("EDIT");
    removeElement("RELATION");
    removeElement("SAVE_RELATION");
    removeElement("SAVE_NEW");
    removeElement("SAVE_NEXT");
    removeElement("DELETE");
    removeElement("DELETE_RELATION");
    removeElement("UNDO");
    removeElement("TREE");
    removeElement("ATTACHMENT");
    removeElement("EXCEL");
    removeElement("GRIDEXCEL");
    removeElement("GRIDCSV");
    removeElement("GRIDPDF");
    removeElement("SEARCH");
    removeElement("SEARCH_FILTERED");
    removeElement("ORDERBY");
    removeElement("ORDERBY_FILTERED");
    removeElement("FIRST");
    removeElement("FIRST_RELATION");
    removeElement("PREVIOUS");
    removeElement("NEXT");
    removeElement("LAST");
    removeElement("LAST_RELATION");
    removeElement("PREVIOUS_RELATION");
    removeElement("PREVIOUS_RELATION_DISABLED");
    removeElement("NEXT_RELATION");
    removeElement("NEXT_RELATION_DISABLED");
    removeElement("FIND");
    removeElement("RELATED_INFO");
    if (!isTest) removeAllTests();
  }

  public void prepareQueryTemplate(boolean hasPrevious, boolean hasNext, boolean isTest) {
    removeElement("NEW");
    removeElement("EDIT");
    removeElement("RELATION");
    removeElement("SAVE_RELATION");
    removeElement("SAVE_NEW");
    removeElement("SAVE_EDIT");
    removeElement("SAVE_NEXT");
    removeElement("DELETE");
    removeElement("DELETE_RELATION");
    removeElement("UNDO");
    removeElement("TREE");
    removeElement("GRIDEXCEL");
    removeElement("GRIDCSV");
    removeElement("GRIDPDF");
    removeElement("ATTACHMENT");
    removeElement("SEARCH");
    removeElement("SEARCH_FILTERED");
    removeElement("ORDERBY");
    removeElement("ORDERBY_FILTERED");
    removeElement("FIRST");
    removeElement("LAST");
    if (!hasPrevious) removeElement("PREVIOUS_RELATION");
    else removeElement("PREVIOUS_RELATION_DISABLED");
    if (!hasNext) removeElement("NEXT_RELATION");
    else removeElement("NEXT_RELATION_DISABLED");
    if (!isTest) removeAllTests();
  }

  public void removeAllTests() {
    removeElement("CAPTURE");
    removeElement("CHECK_CONTENT");
    removeElement("CHECK_ELEMENT");
  }

  public void removeReadOnly() {
    removeElement("NEW");
    removeElement("SAVE_NEW");
    removeElement("SAVE_RELATION");
    removeElement("SAVE_EDIT");
    removeElement("SAVE_NEXT");
    removeElement("DELETE");
    removeElement("DELETE_RELATION");
  }

  private String transformElementsToString(HTMLElement element, Vector<String> vecLastType, boolean isReference) {
    if (element==null) return "";
    if (vecLastType==null) vecLastType = new Vector<String>(0);
    StringBuffer sbElement = new StringBuffer();
    String lastType = "";
    if (vecLastType.size()>0) lastType = vecLastType.elementAt(0);
    if (lastType.equals("SPACE") && element.elementType().equals("SPACE")) return "";
    if (isReference) {
      sbElement.append("<TD width=\"1\">");
      sbElement.append("<IMG src=\"").append(base_direction).append("/images/blank.gif\" class=\"Main_ToolBar_textlabel_bg_left\" border=\"0\">");
      sbElement.append("</TD>\n");
      sbElement.append("<TD class=\"Main_ToolBar_textlabel_bg_body\">");
      sbElement.append("<a class=\"Main_ToolBar_text_relatedinfo\" href=\"#\" onclick=\"openServletNewWindow('DEFAULT', true, '../utility/UsedByLink.html', 'LINKS', null, true, 500, 600, true);\">").append(Utility.messageBD(conn, "Linked Items", language)).append("</a></TD>\n");
    }
    sbElement.append("<td ");
    if (isReference) sbElement.append("class=\"Main_ToolBar_textlabel_bg_right\" ");
    if (element.elementType().equals("SPACE")) sbElement.append("class=\"Main_ToolBar_Separator_cell\" ");
    else if (!element.elementType().equals("HR")) sbElement.append("width=\"").append(element.getWidth()).append("\" ");
    else sbElement.append("class=\"Main_ToolBar_Space\"");
    sbElement.append(">");
    if (!element.elementType().equals("HR")) sbElement.append(element);
    sbElement.append("</td>\n");
    vecLastType.clear();
    vecLastType.addElement(element.elementType());
    return sbElement.toString();
  }

  public String toString() {
    StringBuffer toolbar = new StringBuffer();
    toolbar.append("<table class=\"Main_ContentPane_ToolBar Main_ToolBar_bg\" id=\"tdToolBar\">\n");
    toolbar.append("<tr>\n");
    if (buttons!=null) {
      Vector<String> lastType = new Vector<String>(0);
      toolbar.append(transformElementsToString(buttons.get("NEW"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("EDIT"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("RELATION"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("FIND"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("SEPARATOR2"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("SAVE_RELATION"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("SAVE_NEW"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("SAVE_EDIT"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("SAVE_NEXT"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("SEPARATOR3"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("DELETE"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("DELETE_RELATION"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("SEPARATOR4"), lastType, false));
      //toolbar.append(transformElementsToString(buttons.get("REFRESH"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("UNDO"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("TREE"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("ATTACHMENT"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("EXCEL"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("GRIDEXCEL"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("GRIDCSV"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("GRIDPDF"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("PRINT"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("SEARCH"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("SEARCH_FILTERED"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("ORDERBY"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("ORDERBY_FILTERED"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("SEPARATOR5"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("FIRST"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("FIRST_RELATION"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("PREVIOUS"), lastType, false));
      //toolbar.append("<td class=\"TB_Bookmark\" width=\"5px\"><nobr id=\"bookmark\"></nobr></td>\n");
      toolbar.append(transformElementsToString(buttons.get("NEXT"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("LAST"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("LAST_RELATION"), lastType, false));
      if (isRelation) {
        toolbar.append("<TD width=\"1\"><IMG src=\"").append(base_direction).append("/images/blank.gif\" class=\"Main_ToolBar_textlabel_bg_left\" border=\"0\">");
        toolbar.append("</TD>\n");
        toolbar.append("<TD class=\"Main_ToolBar_textlabel_bg_body\">\n");
        toolbar.append("<nobr id=\"bookmark\" class=\"Main_ToolBar_text_bookmark\">");
        toolbar.append("</nobr>");
        toolbar.append("</TD>\n");
        toolbar.append("<TD width=\"1\">");
        toolbar.append("<IMG src=\"").append(base_direction).append("/images/blank.gif\" class=\"Main_ToolBar_textlabel_bg_right\" border=\"0\">");
        toolbar.append("</TD>\n");
      }
      toolbar.append(transformElementsToString(buttons.get("SEPARATOR6"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("PREVIOUS_RELATION"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("PREVIOUS_RELATION_DISABLED"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("NEXT_RELATION"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("NEXT_RELATION_DISABLED"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("SEPARATOR7"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("CAPTURE"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("CHECK_CONTENT"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("CHECK_ELEMENT"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("HR1"), lastType, false));
      toolbar.append(transformElementsToString(buttons.get("RELATED_INFO"), lastType, true));
    }
    toolbar.append("</tr>\n");
    toolbar.append("</table>\n");
    return toolbar.toString();
  }
}
