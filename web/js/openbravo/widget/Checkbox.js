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
 * All portions are Copyright (C) 2001-2007 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
*/

dojo.provide("openbravo.widget.Checkbox");
dojo.require("dojo.widget.Checkbox");

// <namespace>, <namespace>.widget is now considered 'conventional'
// therefore the registerNamespace call below is no longer necessary here

// Tell dojo that widgets prefixed with "openbravo:" namespace are found in the "acme.widget" module
//dojo.registerNamespace("acme", "acme.widget");

// define UserButton's constructor
dojo.widget.defineWidget(
	// class
	"openbravo.widget.Checkbox",

	// superclass	
	dojo.widget.Checkbox,
	
	// member variables/functions
	{
		// override background images
		templatePath: dojo.uri.dojoUri('../openbravo/widget/templates/Checkbox.html'),
		templateCssPath: null  /* Defined in the skin --- Checkbox.css ,

		fillInTemplate: function(args, frag){
			openbravo.widget.Checkbox.superclass.fillInTemplate.apply(this, arguments);
			dojo.event.connect(this.domNode, "onchange", this, "onInputChange");
			dojo.event.connect(this.domNode, "onkeyup", this, "onInputKeyUp");
		},

		onChange: function() {},

		onInputChange: function(){
		},

		onKeyUp: function() {},

		onInputKeyUp: function(){
		}*/
	}
);