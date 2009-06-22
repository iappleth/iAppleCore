/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dijit._editor.plugins.TabIndent"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._editor.plugins.TabIndent"] = true;
dojo.provide("dijit._editor.plugins.TabIndent");
dojo.experimental("dijit._editor.plugins.TabIndent");

dojo.require("dijit._editor._Plugin");
dojo.require("dijit.form.ToggleButton");

dojo.declare("dijit._editor.plugins.TabIndent",
	dijit._editor._Plugin,
	{
		// summary:
		//		This plugin is used to allow the use of the tab and shift-tab keys
		//		to indent/outdent list items.  This overrides the default behavior
		//		of moving focus from/to the toolbar
		
		// Override _Plugin.useDefaultCommand... processing is handled by this plugin, not by dijit.Editor.
		useDefaultCommand: false,

		// Override _Plugin.buttonClass to use a ToggleButton for this plugin rather than a vanilla Button
		buttonClass: dijit.form.ToggleButton,

		command: "tabIndent",

		_initButton: function(){
			// Override _Plugin._initButton() to setup listener on button click
			this.inherited(arguments);

			var e = this.editor;
			this.connect(this.button, "onChange", function(val){
				e.attr("isTabIndent", val);
			});

			// Set initial checked state of button based on Editor.isTabIndent
			this.updateState();
		},

		updateState: function(){
			// Overrides _Plugin.updateState().
			// Since (apparently) Ctrl-m in the editor will switch tabIndent mode on/off, we need to react to that.

			this.button.attr('checked', this.editor.isTabIndent);
		}
	}
);

// Register this plugin.
dojo.subscribe(dijit._scopeName + ".Editor.getPlugin",null,function(o){
	if(o.plugin){ return; }
	switch(o.args.name){
	case "tabIndent":
		o.plugin = new dijit._editor.plugins.TabIndent({command: o.args.name});
	}
});

}
