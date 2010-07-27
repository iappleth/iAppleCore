/*
	Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.mobile.app.List"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.mobile.app.List"] = true;
dojo.provide("dojox.mobile.app.List");
dojo.experimental("dojox.mobile.app.List");

dojo.require("dojo.string");
dojo.require("dijit._Widget");

(function(){

	var templateCache = {};

	dojo.declare("dojox.mobile.app.List", dijit._Widget, {
		// summary:
		//		A templated list widget. Given a simple array of data objects
		//		and a HTML template, it renders a list of elements, with
		//		support for a swipe delete action.  An optional template
		//		can be provided for when the list is empty.

		// items: Array
		//    The array of data items that will be rendered.
		items: null,
	
		// itemTemplate: String
		//		The URL to the HTML file containing the markup for each individual
		//		data item.
		itemTemplate: "",

		// emptyTemplate: String
		//		The URL to the HTML file containing the HTML to display if there
		//		are no data items. This is optional.
		emptyTemplate: "",

		// labelDelete: String
		//		The label to display for the Delete button
		labelDelete: "Delete",

		// labelCancel: String
		//		The label to display for the Cancel button
		labelCancel: "Cancel",
	
		// controller: Object
		//		
		controller: null,
	
		// autoDelete: Boolean
		autoDelete: true,

		// enableDelete: Boolean
		enableDelete: true,

		// _templateLoadCount: Number
		//		The number of templates remaining to load before the list renders.
		_templateLoadCount: 0,
	
		// _mouseDownPos: Object
		//    The coordinates of where a mouseDown event was detected
		_mouseDownPos: null,
	
		constructor: function(){
			this._checkLoadComplete = dojo.hitch(this, this._checkLoadComplete);
			this._replaceToken = dojo.hitch(this, this._replaceToken);
			this._postDeleteAnim = dojo.hitch(this, this._postDeleteAnim);
		},
	
		postCreate: function(){
	
			var _this = this;
	
			if(this.emptyTemplate){
				this._templateLoadCount++;
			}
			if(this.itemTemplate){
				this._templateLoadCount++;
			}
	
			dojo.addClass(this.domNode, "list");
			var msg;
	
			this.connect(this.domNode, "onmousedown", function(event){
				var touch = event;
				if(event.targetTouches && event.targetTouches.length > 0){
					touch = event.targetTouches[0];
				}

				// Find the node that was tapped/clicked
				var rowNode = _this._getRowNode(event.target);
		
				if(rowNode){
					// Add the rows data to the event so it can be picked up
					// by any listeners
					_this._setDataInfo(rowNode, event);
					
					// Select and highlight the row
					_this._selectRow(rowNode);
					
					// Record the position that was tapped
					_this._mouseDownPos = {
						x: touch.pageX,
						y: touch.pageY
					};
					_this._dragThreshold = null;
				}else{
					console.log("didnt get a node");
				}
			});
	
			this.connect(this.domNode, "onmouseup", function(event){
				// When the mouse/finger comes off the list, 
				// call the onSelect function and deselect the row.
				if(event.targetTouches && event.targetTouches.length > 0){
					event = event.targetTouches[0];
				}
				var rowNode = _this._getRowNode(event.target);
		
				if(rowNode){
		
					_this._setDataInfo(rowNode, event);
		
					if(_this._selectedRow){
						_this.onSelect(rowNode._data, rowNode._idx, rowNode);
					}
		
					this._deselectRow();
				}
			});
	
			// If swipe-to-delete is enabled, listen for the mouse moving
			if(this.enableDelete){
				this.connect(this.domNode, "mousemove", function(event){
					dojo.stopEvent(event);
					if(!_this._selectedRow){
						return;
					}
					var rowNode = _this._getRowNode(event.target);
					
					// Still check for enableDelete in case it's changed after
					// this listener is added.
					if(_this.enableDelete && rowNode && !_this._deleting){
						_this.handleDrag(event);
					}
				});
			}

			// Put the data and index onto each onclick event.
			this.connect(this.domNode, "onclick", function(event){
				if(event.touches && event.touches.length > 0){
					event = event.touches[0];
				}
				var rowNode = _this._getRowNode(event.target, true);
		
				if(rowNode){
					_this._setDataInfo(rowNode, event);
				}
			});

			// If the mouse or finger moves off the selected row,
			// deselect it.
			this.connect(this.domNode, "mouseout", function(event){
				if(event.touches && event.touches.length > 0){
					event = event.touches[0];
				}
				if(event.target == _this._selectedRow){
					_this._deselectRow();
				}
			});
	
			// If no item template has been provided, it is an error.
			if(!this.itemTemplate){
				throw Error("An item template must be provided to " + this.declaredClass);
			}
			
			// Load the item template
			this._loadTemplate(this.itemTemplate, "itemTemplate", this._checkLoadComplete);
	
			if(this.emptyTemplate){
				// If the optional empty template has been provided, load it.
				this._loadTemplate(this.emptyTemplate, "emptyTemplate", this._checkLoadComplete);
			}
		},
	
		handleDrag: function(event){
			// summary:
			//		Handles rows being swiped for deletion.
			var touch = event;
			if(event.targetTouches && event.targetTouches.length > 0){
				touch = event.targetTouches[0];
			}
			
			// Get the distance that the mouse or finger has moved since
			// beginning the swipe action.
			var diff = touch.pageX - this._mouseDownPos.x;
	
			var absDiff = Math.abs(diff);
			if(absDiff > 10 && !this._dragThreshold){
				// Make the user drag the row 60% of the width to remove it
				this._dragThreshold = dojo.marginBox(this._selectedRow).w * 0.6;
				if(!this.autoDelete){
					this.createDeleteButtons(this._selectedRow);
				}
			}
	
			this._selectedRow.style.left = (absDiff > 10 ? diff : 0) + "px";
	
			// If the user has dragged the row more than the threshold, slide
			// it off the screen in preparation for deletion.
			if(this._dragThreshold && this._dragThreshold < absDiff){
				this.preDelete(diff);
			}
		},
	
		handleDragCancel: function(){
			// summary:
			//		Handle a drag action being cancelled, for whatever reason.
			//		Reset handles, remove CSS classes etc.
			if(this._deleting){
				return;
			}
	
			dojo.removeClass(this._selectedRow, "hold");
			this._selectedRow.style.left = 0;
			this._mouseDownPos = null;
			this._dragThreshold = null;
	
			this._deleteBtns && dojo.style(this._deleteBtns, "display", "none");
		},
	
		preDelete: function(currentLeftPos){
			// summary:
			//    Slides the row offscreen before it is deleted
	
			// TODO: do this with CSS3!
			var self = this;
	
			this._deleting = true;
	
			dojo.animateProperty({
				node: this._selectedRow,
				duration: 400,
				properties: {
					left: {
					end: currentLeftPos +
						((currentLeftPos > 0 ? 1 : -1) * this._dragThreshold * 0.8)
					}
				},
				onEnd: dojo.hitch(this, function(){
					if(this.autoDelete){
						this.deleteRow(this._selectedRow);
					}
				})
			}).play();
		},
	
		deleteRow: function(row){
	
			// First make the row invisible
			// Put it back where it came from
			dojo.style(row, {
				visibility: "hidden",
				minHeight: "0px"
			});
			dojo.removeClass(row, "hold");
	
			this._deleteAnimConn =
				this.connect(row, "webkitAnimationEnd", this._postDeleteAnim);
	
			dojo.addClass(row, "collapsed");
	
		},
	
		_postDeleteAnim: function(event){
			// summary:
			//		Completes the deletion of a row.
	
			if(this._deleteAnimConn){
				this.disconnect(this._deleteAnimConn);
				this._deleteAnimConn = null;
			}
	
			var row = this._selectedRow;
			var sibling = row.nextSibling;
	
			row.parentNode.removeChild(row);
			this.onDelete(row._data, row._idx, this.items);
	
			// Decrement the index of each following row
			while(sibling){
				if(sibling._idx){
					sibling._idx--;
				}
				sibling = sibling.nextSibling;
			}
	
			dojo.destroy(row);

			// Fix up the 'first' and 'last' CSS classes on the rows
			dojo.query("> *:not(.buttons)", this.domNode).forEach(this.applyClass);
	
			this._deleting = false;
			this._deselectRow();
		},
	
		createDeleteButtons: function(aroundNode){
			// summary:
			//		Creates the two buttons displayed when confirmation is
			//		required before deletion of a row.
			// aroundNode:
			//		The DOM node of the row about to be deleted.
			var mb = dojo.marginBox(aroundNode);
			var pos = dojo._abs(aroundNode, true);
	
			if(!this._deleteBtns){
			// Create the delete buttons.
				this._deleteBtns = dojo.create("div",{
					"class": "buttons"
				}, this.domNode);
		
				this.buttons = [];
		
				this.buttons.push(new dojox.mobile.Button({
					btnClass: "mblRedButton",
					label: this.labelDelete
				}));
				this.buttons.push(new dojox.mobile.Button({
					btnClass: "mblBlueButton",
					label: this.labelCancel
				}));
		
				dojo.place(this.buttons[0].domNode, this._deleteBtns);
				dojo.place(this.buttons[1].domNode, this._deleteBtns);
		
				dojo.addClass(this.buttons[0].domNode, "deleteBtn");
				dojo.addClass(this.buttons[1].domNode, "cancelBtn");
		
				this._handleButtonClick = dojo.hitch(this._handleButtonClick);
					this.connect(this._deleteBtns, "onclick", 
									this._handleButtonClick);
			}
			dojo.removeClass(this._deleteBtns, "fade out fast");
			dojo.style(this._deleteBtns, {
				display: "",
				width: mb.w + "px",
				height: mb.h + "px",
				top: (aroundNode.offsetTop) + "px",
				left: "0px"
			});
		},
	
		onDelete: function(data, index, array){
			// summary:
			//    Called when a row is deleted
			// data:
			//		The data related to the row being deleted
			// index:
			//		The index of the data in the total array
			// array:
			//		The array of data used.
	
			array.splice(index, 1);

			// If the data is empty, rerender in case an emptyTemplate has
			// been provided
			if(array.length < 1){
				this.render();
			}
		},
	
		cancelDelete: function(){
			// summary:
			//		Cancels the deletion of a row.
			this._deleting = false;
			this.handleDragCancel();
		},
	
		_handleButtonClick: function(event){
			// summary:
			//		Handles the click of one of the deletion buttons, either to
			//		delete the row or to cancel the deletion.
			if(event.touches && event.touches.length > 0){
			event = event.touches[0];
			}
			var node = event.target;
			if(dojo.hasClass(node, "deleteBtn")){
				this.deleteRow(this._selectedRow);
			}else if(dojo.hasClass(node, "cancelBtn")){
				this.cancelDelete();
			}else{
				return;
			}
			dojo.addClass(this._deleteBtns, "fade out");
		},
	
		applyClass: function(node, idx, array){
			// summary:
			//		Applies the 'first' and 'last' CSS classes to the relevant
			//		rows.
	
			dojo.removeClass(node, "first last");
			if(idx == 0){
				dojo.addClass(node, "first");
			}
			if(idx == array.length - 1){
				dojo.addClass(node, "last");
			}
		},

		_setDataInfo: function(rowNode, event){
			// summary:
			//    Attaches the data item and index for each row to any event
			//    that occurs on that row.
			event.item = rowNode._data;
			event.index = rowNode._idx;
		},
	
		onSelect: function(data, index, rowNode){
			// summary:
			//		Dummy function that is called when a row is tapped
		},
	
		_selectRow: function(row){
			// summary:
			//		Selects a row, applies the relevant CSS classes.
			if(this._deleting && this._selectedRow && row != this._selectedRow){
				this.cancelDelete();
			}
	
			if(!dojo.hasClass(row, "row")){
				return;
			}
	
			dojo.addClass(row, "hold");
			this._selectedRow = row;
		},
	
		_deselectRow: function(){
			// summary:
			//		Deselects a row, and cancels any drag actions that were
			//		occurring.
			if(!this._selectedRow || this._deleting){
				return;
			}
			this.handleDragCancel();
			dojo.removeClass(this._selectedRow, "hold");
			this._selectedRow = null;
		},
	
		_getRowNode: function(fromNode, ignoreNoClick){
			// summary:
			//		Gets the DOM node of the row that is equal to or the parent
			//		of the node passed to this function.
			while(fromNode && !fromNode._data && fromNode != this.domNode){
				if(!ignoreNoClick && dojo.hasClass(fromNode, "noclick")){
					return null;
				}
				fromNode = fromNode.parentNode;
			}
			return fromNode;
		},
	
		render: function(){
			// summary:
			//		Renders the list.

			// Delete all existing nodes, except the deletion buttons.
			dojo.query("> *:not(.buttons)", this.domNode).forEach(dojo.destroy);
	
			var rows = [];
			var row, i;
	
			dojo.addClass(this.domNode, "list");
			
			for(i = 0; i < this.items.length; i++){
				// Create a document fragment containing the templated row
				row = dojo._toDom(dojo.string.substitute(
					this.itemTemplate, this.items[i], this._replaceToken, this));
	
				rows.push(row);
			}
			for(i = 0; i < this.items.length; i++){
				rows[i]._data = this.items[i];
				rows[i]._idx = i;
				this.domNode.appendChild(rows[i]);
			}
	
			// If there is no data, and an empty template has been provided,
			// render it.
			if(this.items.length < 1 && this.emptyTemplate){
				dojo.place(dojo._toDom(this.emptyTemplate), this.domNode, "first");
			}
	
			if(dojo.hasClass(this.domNode.parentNode, "mblRoundRect")){
				dojo.addClass(this.domNode.parentNode, "mblRoundRectList")
			}
	
			var divs = dojo.query("> div:not(.buttons)", this.domNode);
			divs.addClass("row");
			if(divs.length > 0){
				dojo.addClass(divs[0], "first");
				dojo.addClass(divs[divs.length - 1], "last");
			}
		},
	
		_replaceToken: function(value, key){
				if(key.charAt(0) == '!'){ value = dojo.getObject(key.substr(1), false, _this); }
				if(typeof value == "undefined"){ return ""; } // a debugging aide
				if(value == null){ return ""; }
	
				// Substitution keys beginning with ! will skip the transform step,
				// in case a user wishes to insert unescaped markup, e.g. ${!foo}
				return key.charAt(0) == "!" ? value :
					// Safer substitution, see heading "Attribute values" in
					// http://www.w3.org/TR/REC-html40/appendix/notes.html#h-B.3.2
					value.toString().replace(/"/g,"&quot;"); //TODO: add &amp? use encodeXML method?
	
		},
	
		_checkLoadComplete: function(){
			// summary:
			//		Checks if all templates have loaded
			this._templateLoadCount--;
	
			if(this._templateLoadCount < 1 && this.get("items")){
				this.render();
			}
		},
	
		_loadTemplate: function(url, thisAttr, callback){
			// summary:
			//		Loads a template
			if(!url){
				callback();
				return;
			}
	
			if(templateCache[url]){
				this.set(thisAttr, templateCache[url]);
				callback();
			}else{
				var _this = this;
		
				dojo.xhrGet({
					url: url,
					sync: false,
					handleAs: "text",
					load: function(text){
						templateCache[url] = dojo.trim(text);
						_this.set(thisAttr, templateCache[url]);
						callback();
					}
				});
			}
		},
	
	
		_setItemsAttr: function(items){
			// summary:
			//    Sets the data items, and causes a rerender of the list
	
			this.items = items || [];
	
			if(this._templateLoadCount < 1 && items){
				this.render();
			}
		},
	
		destroy: function(){
			if(this.buttons){
				dojo.forEach(this.buttons, function(button){
					button.destroy();
				});
				this.buttons = null;
			}
	
			this.inherited(arguments);
		}

	});

})();

}
