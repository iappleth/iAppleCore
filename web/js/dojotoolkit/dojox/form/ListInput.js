/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.form.ListInput"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.form.ListInput"] = true;
dojo.experimental("dojox.form.ListInput");

dojo.provide("dojox.form.ListInput");

dojo.require("dijit.form._FormWidget");
dojo.require("dijit.form.ValidationTextBox");
dojo.require("dijit.InlineEditBox");
dojo.requireLocalization("dijit", "common", null, "ROOT,ar,ca,cs,da,de,el,es,fi,fr,he,hu,it,ja,ko,nb,nl,pl,pt,pt-pt,ru,sk,sl,sv,th,tr,zh,zh-tw");

dojo.declare("dojox.form.ListInput", 
	[dijit.form._FormValueWidget],
	{
	// summary: 
	//		An automatic list maker
	// description:
	//		you can add value to list with add method.
	//		you can only remove by clicking close button
	
	constructor: function(){
		this._items = [];
		
		
		if(!dojo.isArray(this.delimiter)){
			this.delimiter=[this.delimiter];
		}
		var r="("+this.delimiter.join("|")+")?";
		this.regExp="^"+this.regExp+r+"$";
	},
	
	// inputClass: String
	//		Class which will be used to create the input box. You can implements yours.
	//		It must be a widget, focusNode or domNode must have "onkeydown" event
	//		It must have .attr("value") to get value
	//		It also must impement an (or more) handler for the "onChange" method
	inputClass: "dojox.form._ListInputInputBox",
	
	// inputHandler: String || Array
	//		The widget will connect on all handler to check input value
	//		You can use comma separated list
	inputHandler: "onChange",
	
	// inputProperties: String || Object
	//		Properties used to create input box
	//		If String, it must be a valid JSON
	inputProperties: {
		minWidth:50
	},
	
	// submitOnlyValidValue: Boolean
	//		If true, only valid value will be submited with form
	submitOnlyValidValue:true,
	
	// useOnBlur: Boolean
	//		If true, onBlur event do a validate (like pressing ENTER)
	useOnBlur:true,
	
	// readOnlyInput: Boolean
	//		if false, the list will be editable
	//		Can only be set when instanciate
	readOnlyInput: false,
	
	// maxItems: Int
	//		Specify max item the list can have
	//		null = infiny
	maxItems: null,
	
	// showCloseButtonWhenValid: Boolean
	//		if true, a close button will be added on valid item
	showCloseButtonWhenValid: true,
	
	// showCloseButtonWhenInvalid: Boolean
	//		if true, a close button will be added on invalid item
	showCloseButtonWhenInvalid: true,
	
	// regExp: [extension protected] String
	//		regular expression string used to validate the input
	//		Do not specify both regExp and regExpGen
	regExp: ".*", //"[a-zA-Z.-_]+@[a-zA-Z.-_]+.[a-zA-Z]+",
	
	// delimiter: String || Array
	//		delimiter for the string. Every match will be splitted
	//		The string can contain only one delimiter
	delimiter: ",",
	
	// constraints: dijit.form.ValidationTextBox.__Constraints
	//		user-defined object needed to pass parameters to the validator functions
	constraints: {},

	baseClass:"dojoxListInput",
	
	type: "select",
	
	value: "",
	
	templateString: "<div dojoAttachPoint=\"focusNode\" class=\"dijit dijitReset dijitLeft dojoxListInput\"><select dojoAttachpoint=\"_selectNode\" multiple=\"multiple\" class=\"dijitHidden\" ${nameAttrSetting}></select><ul dojoAttachPoint=\"_listInput\"><li dojoAttachEvent=\"onclick: _onClick\" class=\"dijitInputField dojoxListInputNode dijitHidden\" dojoAttachPoint=\"_inputNode\"></li></ul></div>",
	
	// useAnim: Boolean
	//		If true, then item will use an anime to show hide itself 
	useAnim: true,
	
	// duration: Integer
	//		Animation duration
	duration: 500,
	
	// easingIn: function
	//		function used to easing on fadeIn end
	easingIn: null,
	
	// easingOut: function
	//		function used to easing on fadeOut end
	easingOut: null,

	// readOnlyItem: Boolean
	//		If true, items can be edited
	//		Can only be set when instanciate
	readOnlyItem: false,
	
	// useArrowForEdit: Boolean
	//		If true, arraow left and right can be used for editing
	//		Can only be set when instanciate
	useArrowForEdit: true,
	
	// _items: Array
	//		Array of widget.
	//		Contain all reference to _ListInputInputItem
	_items: null,
	
	// _lastAddedItem: Widget
	//		Contain a reference to the last created item
	_lastAddedItem: null,
	
	// _currentItem: Widget
	//		Widget currently in edition
	_currentItem: null,
	
	// _input: Widget
	//		Widget use for input box
	_input: null,
	
	// _count: Int
	//		Count items
	_count: 0,
	
	postCreate: function(){
		// summary:
		//		If closeButton is used, add a class
		this.inherited(arguments);
		this._createInputBox();
	},
	
	_setReadOnlyInputAttr: function(/*Boolean*/value){
		// summary:
		//		Change status and if needed, create the inputbox
		// tags:
		//		private
		console.warn("_setReadOnlyInputAttr",this.id,value);
		if(!this._started){ return this._createInputBox(); }
		this.readOnlyInput=value;
		this._createInputBox();
	},
	
	_setReadOnlyItemAttr: function(/*Boolean*/value){
		// summary: 
		//		set read only items
		// tags:
		//		private
		if(!this._started){ return; }
		for(var i in this._items){
			this._items[i].attr("readOnlyItem",value);
		}
	},
	
	_createInputBox: function(){
		// summary:
		//		Create the input box
		// tags:
		//		private
		console.warn("_createInputBox",this.id,this.readOnlyInput);
		dojo[(this.readOnlyInput?"add":"remove")+"Class"](this._inputNode,"dijitHidden");
		if(this.readOnlyInput){ return; }
		if(this._input){ return; }
				
		if(this.inputHandler === null){
			return !console.warn("you must add some handler to connect to input field");
		}
		if(dojo.isString(this.inputHandler)){
			this.inputHandler = this.inputHandler.split(",");
		}
		if(dojo.isString(this.inputProperties)){
			this.inputProperties = dojo.fromJson(this.inputProperties);
		}
		

		var input = dojo.getObject(this.inputClass, false);
		
		this.inputProperties.regExp = this.regExpGen(this.constraints);
		
		this._input = new input(this.inputProperties);
		this._input.startup();
		this._inputNode.appendChild(this._input.domNode);
		dojo.forEach(this.inputHandler, function(handler){
			this.connect(this._input,dojo.string.trim(handler),"_onHandler");
		},this);
	
		this.connect(this._input, "onKeyDown", "_inputOnKeyDown");
		this.connect(this._input, "onBlur", "_inputOnBlur");
	},
	
	compare: function(/*Array*/val1,/*Array*/val2){
		// summary:
		//		Compare 2 values (as returned by attr('value') for this widget).
		// tags:
		//		protected
		val1=val1.join(",");
		val2=val2.join(",");
		if(val1 > val2){
			return 1;
		}else if(val1 < val2){
			return -1;
		}else{
			return 0;
		}
	},
	
	add: function(/*String || Array*/values){
		// summary: 
		//		Create new list element
		if(this._count>=this.maxItems && this.maxItems !== null){return;}
		this._lastValueReported = this._getValues();
		
		if(!dojo.isArray(values)){
			values = [values];
		}
		
		for(var i in values){
			var value=values[i];
			if(value === "" || typeof value != "string"){
				continue;
			}
			this._count++;
			var re = new RegExp(this.regExpGen(this.constraints));

			this._lastAddedItem = new dojox.form._ListInputInputItem({
				"index" : this._items.length,
				readOnlyItem : this.readOnlyItem,
				value : value,
				regExp: this.regExpGen(this.constraints)
			});
			this._lastAddedItem.startup();
			
			this._testItem(this._lastAddedItem,value);
			
			this._lastAddedItem.onClose = dojo.hitch(this,"_onItemClose",this._lastAddedItem);
			this._lastAddedItem.onChange = dojo.hitch(this,"_onItemChange",this._lastAddedItem);
			this._lastAddedItem.onEdit = dojo.hitch(this,"_onItemEdit",this._lastAddedItem);
			this._lastAddedItem.onKeyDown = dojo.hitch(this,"_onItemKeyDown",this._lastAddedItem);

			if(this.useAnim){
				dojo.style(this._lastAddedItem.domNode, {opacity:0, display:""});
			}

			this._placeItem(this._lastAddedItem.domNode);
			
			if(this.useAnim){
				var anim = dojo.fadeIn({
					node : this._lastAddedItem.domNode,
					duration : this.duration,
					easing : this.easingIn
				}).play();
			}
			
			this._items[this._lastAddedItem.index] = this._lastAddedItem;
			
			if(this._onChangeActive && this.intermediateChanges){ this.onChange(value); }
			
			if(this._count>=this.maxItems && this.maxItems !== null){
				break;
			}
		}
		
		this._updateValues();
		if(this._lastValueReported.length==0){
			this._lastValueReported = this.value;
		}
		
		if(!this.readOnlyInput){
			this._input.attr("value","");
		}
		
		if(this._onChangeActive){ this.onChange(this.value); }
		
		this._setReadOnlyWhenMaxItemsReached();
	},
	
	_setReadOnlyWhenMaxItemsReached: function(){
		// summary: 
		//		set input to readonly when max is reached
		// tags:
		//		private
		this.attr("readOnlyInput",(this._count>=this.maxItems && this.maxItems !== null));
	},
	
	_setSelectNode: function(){
		// summary: 
		//		put all item in the select (for a submit)
		// tags:
		//		private
		this._selectNode.options.length = 0;
		
		var values=this.submitOnlyValidValue?this.attr("MatchedValue"):this.value;
		
		if(!dojo.isArray(values)){
			return;
		}
		dojo.forEach(values,function(item){
			this._selectNode.options[this._selectNode.options.length]=new Option(item,item,true,true);
		},this);
	},
	
	_placeItem: function(/*domNode*/node){
		// summary: 
		//		Place item in the list
		// tags:
		//		private
		dojo.place(node,this._inputNode,"before");
	},
	
	_getCursorPos: function(/*domNode*/node){
		// summary: 
		//		get current cursor pos
		// tags:
		//		private
		if(typeof node.selectionStart != 'undefined'){
			return node.selectionStart;
		}
		
		// IE Support
		try{ node.focus(); }catch(e){}
		var range = node.createTextRange();
		range.moveToBookmark(dojo.doc.selection.createRange().getBookmark());
		range.moveEnd('character', node.value.length);
		try{
			return node.value.length - range.text.length;
		}finally{ range=null; }
	},
	
	_onItemClose: function(/*dijit._Widget*/ item){
		// summary: 
		//		Destroy a list element when close button is clicked
		// tags:
		//		private
		if(this.disabled){ return; }
		
		if(this.useAnim){
			var anim = dojo.fadeOut({
				node : item.domNode,
				duration : this.duration,
				easing : this.easingOut,
				onEnd : dojo.hitch(this, "_destroyItem", item)
			}).play();
		}else{
			this._destroyItem(item);
		}
	},
	
	_onItemKeyDown:  function(/*dijit._Widget*/ item, /*Event*/ e){
		// summary: 
		//		Call when item get a keypress
		// tags:
		//		private
		if(this.readOnlyItem || !this.useArrowForEdit){ return; }
		
		if(e.keyCode == dojo.keys.LEFT_ARROW && this._getCursorPos(e.target)==0){
			this._editBefore(item);
		}else if(e.keyCode == dojo.keys.RIGHT_ARROW && this._getCursorPos(e.target)==e.target.value.length){
			this._editAfter(item);
		}
	},
	
	_editBefore: function(/*widget*/item) {
		// summary: 
		//		move trough items
		// tags:
		//		private
		this._currentItem = this._getPreviousItem(item);
		if(this._currentItem !== null){
			this._currentItem.edit();
		}
	},
	_editAfter: function(/*widget*/item) {
		// summary: 
		//		move trough items
		// tags:
		//		private
		this._currentItem = this._getNextItem(item);
		if(this._currentItem !== null){
			this._currentItem.edit();
		}
		
		if(!this.readOnlyInput){
			if(this._currentItem === null){
				//no more item ?
				//so edit input (if available)
				this._focusInput();
			}
		}
	},
	
	_onItemChange: function(/*dijit._Widget*/ item, /*String*/ value){
		// summary: 
		//		Call when item value change
		// tags:
		//		private
		if(!value){
			value=item.attr("value");
		}
		
		//revalidate content
		this._testItem(item,value);
		
		//update value
		this._updateValues();
	},
	
	_onItemEdit: function(/*dijit._Widget*/ item){
		// summary: 
		//		Call when item is edited
		// tags:
		//		private
		dojo.removeClass(item.domNode,"dijitError");
		dojo.removeClass(item.domNode,this.baseClass+"Match");
		dojo.removeClass(item.domNode,this.baseClass+"Mismatch");
	},
	
	_testItem: function(/*Object*/item,/*String*/value){
		// summary: 
		//		Change class of item (match, mismatch)
		// tags:
		//		private
		var re = new RegExp(this.regExpGen(this.constraints));
		var match = value.match(re);
		
		dojo.removeClass(item.domNode, this.baseClass+(!match ? "Match":"Mismatch"));
		dojo.addClass(item.domNode, this.baseClass+(match ? "Match":"Mismatch"));
		dojo[(!match?"add":"remove")+"Class"](item.domNode, "dijitError");
		
		if((this.showCloseButtonWhenValid && match) ||
			(this.showCloseButtonWhenInvalid && !match)){
			dojo.addClass(item.domNode,this.baseClass+"Closable");
		}else {
			dojo.removeClass(item.domNode,this.baseClass+"Closable");
		}
	},
	
	_getValueAttr: function(){
		// summary: 
		//		get all value in then list and return an array
		// tags:
		//		private
		return this.value;
	},
	
	_setValueAttr: function(/*Array || String*/ newValue){
		// summary:
		//		Hook so attr('value', value) works.
		// description:
		//		Sets the value of the widget.
		//		If the value has changed, then fire onChange event, unless priorityChange
		//		is specified as null (or false?)
		this._destroyAllItems();
		
		this.add(this._parseValue(newValue));
	},
	
	_parseValue: function(/*String*/newValue){
		// summary: 
		//		search for delemiters and split if needed
		// tags:
		//		private
		if(typeof newValue == "string"){
			if(dojo.isString(this.delimiter)){
				this.delimiter = [this.delimiter];
			}
			var re = new RegExp("^.*("+this.delimiter.join("|")+").*");
			if(newValue.match(re)){
				re = new RegExp(this.delimiter.join("|"));
				return newValue.split(re);
			}
		}
		return newValue;
	},
	
	regExpGen: function(/*dijit.form.ValidationTextBox.__Constraints*/constraints){
		// summary:
		//		Overridable function used to generate regExp when dependent on constraints.
		//		Do not specify both regExp and regExpGen.
		// tags:
		//		extension protected
		return this.regExp;     // String
	},
	
	_setDisabledAttr: function(/*Boolean*/ value){
		// summary: 
		//		also enable/disable editable items
		// tags:
		//		private
		if(!this.readOnlyItem){
			for(var i in this._items){
				this._items[i].attr("disabled",value);
			}
		}
		
		if(!this.readOnlyInput){
			this._input.attr("disabled",value);
		}
		this.inherited(arguments);
	},
	
	_onHandler: function(/*String*/value){
		// summary: 
		//		When handlers of input are fired, this method check input value and (if needed) modify it
		// tags:
		//		private
		var parsedValue = this._parseValue(value);
		if(dojo.isArray(parsedValue)){
			this.add(parsedValue);
		}
	},
	
	_onClick:  function(/*event*/e){
		// summary: 
		//		give focus to inputbox
		// tags:
		//		private
		this._focusInput();
	},
	
	_focusInput: function(){
		// summary: 
		//		give focus to input
		// tags:
		//		private
		if(!this.readOnlyInput && this._input.focus){
			this._input.focus();
		}
	},

	_inputOnKeyDown: function(/*event*/e){
		// summary: 
		//		Used to add keybord interactivity
		// tags:
		//		private
		this._currentItem=null;
		
		if(e.keyCode == dojo.keys.BACKSPACE && this._input.attr("value") == "" && this.attr("lastItem")){
			this._destroyItem(this.attr("lastItem"));
		}else if(e.keyCode == dojo.keys.ENTER && this._input.attr("value") != ""){
			this.add(this._input.attr("value"));
		}else if(e.keyCode == dojo.keys.LEFT_ARROW && this._getCursorPos(this._input.focusNode)==0 &&
			!this.readOnlyItem && this.useArrowForEdit){
				this._editBefore();
		}
	},
	
	_inputOnBlur: function(){
		// summary: 
		//		Remove focus class and act like pressing ENTER key
		// tags:
		//		private
		if(this.useOnBlur && this._input.attr("value") != ""){
			this.add(this._input.attr("value"));
		}
	},
	
	_getMatchedValueAttr: function(){
		// summary: 
		//		get value that match regexp in then list and return an array
		// tags:
		//		private
		return this._getValues(dojo.hitch(this,this._matchValidator));
	},
	
	_getMismatchedValueAttr: function(){
		// summary: 
		//		get value that mismatch regexp in then list and return an array
		// tags:
		//		private
		return this._getValues(dojo.hitch(this,this._mismatchValidator));
	},
	
	_getValues: function(/*function*/validator){
		// summary: 
		//		return values with comparator constraint
		// tags:
		//		private
		var value = [];
		validator = validator||this._nullValidator;
		for(var i in this._items){
			var item = this._items[i];
			if(item === null){
				continue;
			}
			var itemValue=item.attr("value");
			if (validator(itemValue)){
				value.push(itemValue);
			}
		}
		return value;
	},
	
	_nullValidator: function(/*String*/itemValue){
		// summary: 
		//		return true or false
		// tags:
		//		private
		return true;
	},
	_matchValidator: function(/*String*/itemValue){
		// summary: 
		//		return true or false
		// tags:
		//		private
		var re = new RegExp(this.regExpGen(this.constraints));
		return itemValue.match(re);
	},
	_mismatchValidator: function(/*String*/itemValue){
		// summary: 
		//		return true or false
		// tags:
		//		private
		var re = new RegExp(this.regExpGen(this.constraints));
		return !(itemValue.match(re));
	},
	
	_getLastItemAttr: function(){
		// summary: 
		//		return the last item in list
		// tags:
		//		private
		return this._getSomeItem();
	},
	_getSomeItem: function(/*dijit._Widget*/ item,/*String*/ position){
		// summary: 
		//		return the item before the one in params
		// tags:
		//		private
		item=item||false;
		position=position||"last";
		
		var lastItem = null;
		var stop=-1;
		for(var i in this._items){
			if(this._items[i] === null){ continue; }
			
			if(position=="before" && this._items[i] === item){
				break;
			}
			
			lastItem = this._items[i];
			
			if(position=="first" ||stop==0){
				stop=1;
				break;
			}
			if(position=="after" && this._items[i] === item){
				stop=0;
			}
		}
		if(position=="after" && stop==0){
			lastItem = null;
		}
		return lastItem;
	},
	_getPreviousItem: function(/*dijit._Widget*/ item){
		// summary: 
		//		return the item before the one in params
		// tags:
		//		private
		return this._getSomeItem(item,"before");
	},
	_getNextItem: function(/*dijit._Widget*/ item){
		// summary: 
		//		return the item before the one in params
		// tags:
		//		private
		return this._getSomeItem(item,"after");
	},
	
	_destroyItem: function(/*dijit._Widget*/ item, /*Boolean?*/ updateValue){
		// summary: 
		//		destroy an item
		// tags:
		//		private
		this._items[item.index] = null;
		item.destroy();
		this._count--;
		if(updateValue!==false){
			this._updateValues();
			this._setReadOnlyWhenMaxItemsReached();
		}
	},
	
	_updateValues: function(){
		// summary: 
		//		update this.value and the select node
		// tags:
		//		private
		this.value = this._getValues();
		this._setSelectNode();
	},
	
	_destroyAllItems: function(){
		// summary: 
		//		destroy all items
		// tags:
		//		private
		for(var i in this._items){
			if(this._items[i]==null){ continue; }
			this._destroyItem(this._items[i],false);
		}
		this._items = [];
		this._count = 0;
		this.value = null;
		this._setSelectNode();
		this._setReadOnlyWhenMaxItemsReached();
	},
	
	destroy: function(){
		// summary:
		//		Destroy all widget
		this._destroyAllItems();
		this._lastAddedItem = null;
		
		if(!this._input){
			this._input.destroy();
		}
		
		this.inherited(arguments);
	}
});

dojo.declare("dojox.form._ListInputInputItem", 
	[dijit._Widget, dijit._Templated],
	{
	// summary: 
	//	Item created by ListInputInput when delimiter is found
	// description:
	//		Simple <li> with close button added to ListInputInput when delimiter is found
	
	templateString: "<li class=\"dijit dijitReset dijitLeft dojoxListInputItem\" dojoAttachEvent=\"onclick: onClick\" ><span dojoAttachPoint=\"labelNode\"></span></li>",
	
	// closeButtonNode: domNode
	//		ref to the close button node
	closeButtonNode: null,
	
	// readOnlyItem: Boolean
	//		if true, item is editable
	readOnlyItem: true,
	
	baseClass:"dojoxListInputItem",
	
	// value: String
	//		value of item
	value: "",
	
	// regExp: [extension protected] String
	//		regular expression string used to validate the input
	//		Do not specify both regExp and regExpGen
	regExp: ".*",
	
	// _editBox: Widget
	//		inline edit box
	_editBox: null,
	
	// _handleKeyDown: handle
	//		handle for the keyDown connect
	_handleKeyDown: null,
	
	attributeMap: {
		value: { node: "labelNode", type: "innerHTML" }
	},
	
	postMixInProperties: function(){
		var _nlsResources = dojo.i18n.getLocalization("dijit", "common");
		dojo.mixin(this, _nlsResources);
		this.inherited(arguments);
	},
	
	postCreate: function(){
		// summary:
		//		Create the close button if needed
		this.inherited(arguments);
		
		this.closeButtonNode = dojo.create("span",{
			"class" : "dijitButtonNode dijitDialogCloseIcon",
			title : this.itemClose,
			onclick: dojo.hitch(this, "onClose"),
			onmouseenter: dojo.hitch(this, "_onCloseEnter"),
			onmouseleave: dojo.hitch(this, "_onCloseLeave")
		}, this.domNode);
		
		dojo.create("span",{
			"class" : "closeText",
			title : this.itemClose,
			innerHTML : "x"
		}, this.closeButtonNode);
	},
	
	startup: function(){
		// summary:
		//		add the edit box
		this.inherited(arguments);
		this._createInlineEditBox();
	},
	
	_setReadOnlyItemAttr: function(/*Boolean*/value){
		// summary:
		//		change the readonly state
		// tags:
		//		private
		this.readOnlyItem = value;
		if(!value){
			this._createInlineEditBox();
		}else if(this._editBox){
			this._editBox.attr("disabled",true);
		}
	},
	
	_createInlineEditBox: function(){
		// summary:
		//		create the inline editbox if needed
		// tags:
		//		private
		if(this.readOnlyItem){ return; }
		if(!this._started){ return; }
		if(this._editBox){ 
			this._editBox.attr("disabled",false);
			return; 
		}
		this._editBox=new dijit.InlineEditBox({
			value:this.value,
			editor: "dijit.form.ValidationTextBox",
			editorParams:{
				regExp:this.regExp
			}
		},this.labelNode);
		this.connect(this._editBox,"edit","_onEdit");
		this.connect(this._editBox,"onChange","_onCloseEdit");
		this.connect(this._editBox,"onCancel","_onCloseEdit");
	},
	
	edit: function(){
		// summary:
		//		enter inline editbox in edit mode
		if(!this.readOnlyItem){
			this._editBox.edit();
		}
	},
	
	_onCloseEdit: function(/*String*/value){
		// summary:
		//		call when inline editor close himself
		// tags:
		//		private
		dojo.removeClass(this.closeButtonNode,this.baseClass + "Edited");
		dojo.disconnect(this._handleKeyDown);
		this.onChange(value);
	},
	
	_onEdit: function(){
		// summary:
		//		call when inline editor start editing
		// tags:
		//		private
		dojo.addClass(this.closeButtonNode,this.baseClass + "Edited");
		this._handleKeyDown = dojo.connect(this._editBox.editWidget,"_onKeyPress",this,"onKeyDown");
		this.onEdit();
	},
	
	_setDisabledAttr: function(/*Boolean*/value){
		// summary:
		//		disable inline edit box
		// tags:
		//		private
		if(!this.readOnlyItem){
			this._editBox.attr("disabled",value);
		}
	},
	
	_getValueAttr: function(){
		// summary:
		//		return value
		// tags:
		//		private
		return (!this.readOnlyItem && this._started ? this._editBox.attr("value") : this.value);
	},
	
	destroy: function(){
		// summary:
		//		Destroy the inline editbox
		if(this._editBox){
			this._editBox.destroy();
		}
		this.inherited(arguments);
	},
	
	_onCloseEnter: function(){
		// summary:
		//		Called when user hovers over close icon
		// tags:
		//		private
		dojo.addClass(this.closeButtonNode, "dijitDialogCloseIcon-hover");
	},

	_onCloseLeave: function(){
		// summary:
		//		Called when user stops hovering over close icon
		// tags:
		//		private
		dojo.removeClass(this.closeButtonNode, "dijitDialogCloseIcon-hover");
	},
	
	onClose: function(){
		// summary: 
		//		callback when close button is clicked
	},
	
	onEdit: function(){
		// summary: 
		//		callback when widget come in edition
	},
	
	onClick: function(){
		// summary: 
		//		callback when widget is click
	},
	
	onChange: function(/*String*/value){
		// summary: 
		//		callback when widget change its content
	},
	
	
	onKeyDown: function(/*String*/value){
		// summary:
		//		callback when widget get a KeyDown
	}
});
dojo.declare("dojox.form._ListInputInputBox", 
	[dijit.form.ValidationTextBox],
	{
	// summary: 
	//	auto-sized text box
	// description:
	//		Auto sized textbox based on dijit.form.TextBox
	
	// minWidth: Integer
	//		Min width of the input box
	minWidth:50,
	
	// intermediateChanges: Boolean
	//		Fires onChange for each value change or only on demand
	//		Force to true in order to get onChanged called
	intermediateChanges:true,
	
	// regExp: [extension protected] String
	//		regular expression string used to validate the input
	//		Do not specify both regExp and regExpGen
	regExp: ".*",
	
	// _sizer: DomNode
	//		Used to get size of textbox content
	_sizer:null,
	
	onChange: function(/*string*/value){
		// summary: 
		//		compute content width
		this.inherited(arguments);
		if(this._sizer === null){
			this._sizer = dojo.create("div",{
				style : {
					position : "absolute",
					left : "-10000px",
					top : "-10000px"
				}
			},dojo.body());
		}
		this._sizer.innerHTML = value;
		var w = dojo.contentBox(this._sizer).w + this.minWidth;
		dojo.contentBox(this.domNode,{ w : w });
	}, 
	
	destroy: function(){
		// summary:
		//		destroy the widget
		dojo.destroy(this._sizer);
		this.inherited(arguments);
	}
});

}
