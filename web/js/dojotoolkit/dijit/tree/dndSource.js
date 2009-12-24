/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dijit.tree.dndSource"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.tree.dndSource"] = true;
dojo.provide("dijit.tree.dndSource");

dojo.require("dijit.tree._dndSelector");
dojo.require("dojo.dnd.Manager");

/*=====
dijit.tree.__SourceArgs = function(){
	// summary:
	//		A dict of parameters for Tree source configuration.
	// isSource: Boolean?
	//		Can be used as a DnD source. Defaults to true.
	// accept: String[]
	//		List of accepted types (text strings) for a target; defaults to
	//		["text", "treeNode"]
	// copyOnly: Boolean?
	//		Copy items, if true, use a state of Ctrl key otherwise,
	// dragThreshold: Number
	//		The move delay in pixels before detecting a drag; 0 by default
	// betweenThreshold: Integer
	//		Distance from upper/lower edge of node to allow drop to reorder nodes
	this.isSource = isSource;
	this.accept = accept;
	this.autoSync = autoSync;
	this.copyOnly = copyOnly;
	this.dragThreshold = dragThreshold;
	this.betweenThreshold = betweenThreshold;
}
=====*/

dojo.declare("dijit.tree.dndSource", dijit.tree._dndSelector, {
	// summary:
	//		Handles drag and drop operations (as a source or a target) for `dijit.Tree`

	// isSource: [private] Boolean
	//		Can be used as a DnD source.
	isSource: true,

	// accept: String[]
	//		List of accepted types (text strings) for the Tree; defaults to
	//		["text"]
	accept: ["text", "treeNode"],

	// copyOnly: [private] Boolean
	//		Copy items, if true, use a state of Ctrl key otherwise
	copyOnly: false,

	// dragThreshold: Number
	//		The move delay in pixels before detecting a drag; 5 by default
	dragThreshold: 5,

	// betweenThreshold: Integer
	//		Distance from upper/lower edge of node to allow drop to reorder nodes
	betweenThreshold: 0,

	constructor: function(/*dijit.Tree*/ tree, /*dijit.tree.__SourceArgs*/ params){
		// summary:
		//		a constructor of the Tree DnD Source
		// tags:
		//		private
		if(!params){ params = {}; }
		dojo.mixin(this, params);
		this.isSource = typeof params.isSource == "undefined" ? true : params.isSource;
		var type = params.accept instanceof Array ? params.accept : ["text", "treeNode"];
		this.accept = null;
		if(type.length){
			this.accept = {};
			for(var i = 0; i < type.length; ++i){
				this.accept[type[i]] = 1;
			}
		}

		// class-specific variables
		this.isDragging = false;
		this.mouseDown = false;
		this.targetAnchor = null;	// DOMNode corresponding to the currently moused over TreeNode
		this.targetBox = null;	// coordinates of this.targetAnchor
		this.dropPosition = "";	// whether mouse is over/after/before this.targetAnchor
		this._lastX = 0;
		this._lastY = 0;

		// states
		this.sourceState = "";
		if(this.isSource){
			dojo.addClass(this.node, "dojoDndSource");
		}
		this.targetState = "";
		if(this.accept){
			dojo.addClass(this.node, "dojoDndTarget");
		}

		// set up events
		this.topics = [
			dojo.subscribe("/dnd/source/over", this, "onDndSourceOver"),
			dojo.subscribe("/dnd/start", this, "onDndStart"),
			dojo.subscribe("/dnd/drop", this, "onDndDrop"),
			dojo.subscribe("/dnd/cancel", this, "onDndCancel")
		];
	},

	// methods
	checkAcceptance: function(source, nodes){
		// summary:
		//		Checks if the target can accept nodes from this source
		// source: dijit.tree.dndSource
		//		The source which provides items
		// nodes: DOMNode[]
		//		Array of DOM nodes corresponding to nodes being dropped, dijitTreeRow nodes if
		//		source is a dijit.Tree.
		// tags:
		//		extension
		return true;	// Boolean
	},

	copyState: function(keyPressed){
		// summary:
		//		Returns true, if we need to copy items, false to move.
		//		It is separated to be overwritten dynamically, if needed.
		// keyPressed: Boolean
		//		The "copy" control key was pressed
		// tags:
		//		protected
		return this.copyOnly || keyPressed;	// Boolean
	},
	destroy: function(){
		// summary:
		//		Prepares the object to be garbage-collected.
		this.inherited("destroy",arguments);
		dojo.forEach(this.topics, dojo.unsubscribe);
		this.targetAnchor = null;
	},

	_onDragMouse: function(e){
		// summary:
		//		Helper method for processing onmousemove/onmouseover events while drag is in progress.
		//		Keeps track of current drop target.

		var m = dojo.dnd.manager(),
			oldTarget = this.targetAnchor,			// the DOMNode corresponding to TreeNode mouse was previously over
			newTarget = this.current,				// DOMNode corresponding to TreeNode mouse is currently over
			newTargetWidget = this.currentWidget,	// the TreeNode itself
			oldDropPosition = this.dropPosition;	// the previous drop position (over/before/after)

		// calculate if user is indicating to drop the dragged node before, after, or over
		// (i.e., to become a child of) the target node
		var newDropPosition = "Over";
		if(newTarget && this.betweenThreshold > 0){
			// If mouse is over a new TreeNode, then get new TreeNode's position and size
			if(!this.targetBox || oldTarget != newTarget){
				this.targetBox = dojo.position(newTarget, true);
			}
			if((e.pageY - this.targetBox.y) <= this.betweenThreshold){
				newDropPosition = "Before";
			}else if((e.pageY - this.targetBox.y) >= (this.targetBox.h - this.betweenThreshold)){
				newDropPosition = "After";
			}
		}

		if(newTarget != oldTarget || newDropPosition != oldDropPosition){
			if(oldTarget){
				this._removeItemClass(oldTarget, oldDropPosition);
			}
			if(newTarget){
				this._addItemClass(newTarget, newDropPosition);
			}

			// Check if it's ok to drop the dragged node on/before/after the target node.
			if(!newTarget){
				m.canDrop(false);
			}else if(newTargetWidget == this.tree.rootNode && newDropPosition != "Over"){
				// Can't drop before or after tree's root node; the dropped node would just disappear (at least visually)
				m.canDrop(false);
			}else if(m.source == this && (newTarget.id in this.selection)){
				// Guard against dropping onto yourself (TODO: guard against dropping onto your descendant, #7140)
				m.canDrop(false);
			}else if(this.checkItemAcceptance(newTarget, m.source, newDropPosition.toLowerCase())
					&& !this._isParentChildDrop(m.source, newTarget)){
				m.canDrop(true);
			}else{
				m.canDrop(false);
			}

			this.targetAnchor = newTarget;
			this.dropPosition = newDropPosition;
		}
	},

	onMouseMove: function(e){
		// summary:
		//		Called for any onmousemove events over the Tree
		// e: Event
		//		onmousemouse event
		// tags:
		//		private
		if(this.isDragging && this.targetState == "Disabled"){ return; }
		this.inherited(arguments);
		var m = dojo.dnd.manager();
		if(this.isDragging){
			this._onDragMouse(e);
		}else{
			if(this.mouseDown && this.isSource &&
				 (Math.abs(e.pageX-this._lastX)>=this.dragThreshold || Math.abs(e.pageY-this._lastY)>=this.dragThreshold)){
				var n = this.getSelectedNodes();
				var nodes=[];
				for(var i in n){
					nodes.push(n[i]);
				}
				if(nodes.length){
					m.startDrag(this, nodes, this.copyState(dojo.isCopyKey(e)));
				}
			}
		}
	},

	onMouseDown: function(e){
		// summary:
		//		Event processor for onmousedown
		// e: Event
		//		onmousedown event
		// tags:
		//		private
		this.mouseDown = true;
		this.mouseButton = e.button;
		this._lastX = e.pageX;
		this._lastY = e.pageY;
		this.inherited("onMouseDown",arguments);
	},

	onMouseUp: function(e){
		// summary:
		//		Event processor for onmouseup
		// e: Event
		//		onmouseup event
		// tags:
		//		private
		if(this.mouseDown){
			this.mouseDown = false;
			this.inherited("onMouseUp",arguments);
		}
	},

	onMouseOut: function(){
		// summary:
		//		Event processor for when mouse is moved away from a TreeNode
		// tags:
		//		private
		this.inherited(arguments);
		this._unmarkTargetAnchor();
	},

	checkItemAcceptance: function(target, source, position){
		// summary:
		//		Stub function to be overridden if one wants to check for the ability to drop at the node/item level
		// description:
		//		In the base case, this is called to check if target can become a child of source.
		//		When betweenThreshold is set, position="before" or "after" means that we
		//		are asking if the source node can be dropped before/after the target node.
		// target: DOMNode
		//		The dijitTreeRoot DOM node inside of the TreeNode that we are dropping on to
		//		Use dijit.getEnclosingWidget(target) to get the TreeNode.
		// source: dijit.tree.dndSource
		//		The (set of) nodes we are dropping
		// position: String
		//		"over", "before", or "after"
		// tags:
		//		extension
		return true;
	},

	// topic event processors
	onDndSourceOver: function(source){
		// summary:
		//		Topic event processor for /dnd/source/over, called when detected a current source.
		// source: Object
		//		The dijit.tree.dndSource / dojo.dnd.Source which has the mouse over it
		// tags:
		//		private
		if(this != source){
			this.mouseDown = false;
			this._unmarkTargetAnchor();
		}else if(this.isDragging){
			var m = dojo.dnd.manager();
			m.canDrop(false);
		}
	},
	onDndStart: function(source, nodes, copy){
		// summary:
		//		Topic event processor for /dnd/start, called to initiate the DnD operation
		// source: Object
		//		The dijit.tree.dndSource / dojo.dnd.Source which is providing the items
		// nodes: DomNode[]
		//		The list of transferred items, dndTreeNode nodes if dragging from a Tree
		// copy: Boolean
		//		Copy items, if true, move items otherwise
		// tags:
		//		private

		if(this.isSource){
			this._changeState("Source", this == source ? (copy ? "Copied" : "Moved") : "");
		}
		var accepted = this.checkAcceptance(source, nodes);

		this._changeState("Target", accepted ? "" : "Disabled");

		if(this == source){
			dojo.dnd.manager().overSource(this);
		}

		this.isDragging = true;
	},

	itemCreator: function(/*DomNode[]*/ nodes, target, /*dojo.dnd.Source*/ source){
		// summary:
		//		Returns objects passed to `Tree.model.newItem()` based on DnD nodes
		//		dropped onto the tree.   Developer must override this method to enable
		// 		dropping from external sources onto this Tree, unless the Tree.model's items
		//		happen to look like {id: 123, name: "Apple" } with no other attributes.
		// description:
		//		For each node in nodes[], which came from source, create a hash of name/value
		//		pairs to be passed to Tree.model.newItem().  Returns array of those hashes.
		// returns: Object[]
		//		Array of name/value hashes for each new item to be added to the Tree, like:
		// |	[
		// |		{ id: 123, label: "apple", foo: "bar" },
		// |		{ id: 456, label: "pear", zaz: "bam" }
		// |	]
		// tags:
		//		extension

		// TODO: for 2.0 refactor so itemCreator() is called once per drag node, and
		// make signature itemCreator(sourceItem, node, target) (or similar).

		return dojo.map(nodes, function(node){
			return {
				"id": node.id,
				"name": node.textContent || node.innerText || ""
			};
		}); // Object[]
	},

	onDndDrop: function(source, nodes, copy){
		// summary:
		//		Topic event processor for /dnd/drop, called to finish the DnD operation.
		// description:
		//		Updates data store items according to where node was dragged from and dropped
		//		to.   The tree will then respond to those data store updates and redraw itself.
		// source: Object
		//		The dijit.tree.dndSource / dojo.dnd.Source which is providing the items
		// nodes: DomNode[]
		//		The list of transferred items, dndTreeNode nodes if dragging from a Tree
		// copy: Boolean
		//		Copy items, if true, move items otherwise
		// tags:
		//		protected
		if(this.containerState == "Over"){
			var tree = this.tree,
				model = tree.model,
				target = this.targetAnchor,
				requeryRoot = false;	// set to true iff top level items change

			this.isDragging = false;

			// Compute the new parent item
			var targetWidget = dijit.getEnclosingWidget(target);
			var newParentItem;
			var insertIndex;
			newParentItem = (targetWidget && targetWidget.item) || tree.item;
			if(this.dropPosition == "Before" || this.dropPosition == "After"){
				// TODO: if there is no parent item then disallow the drop.
				// Actually this should be checked during onMouseMove too, to make the drag icon red.
				newParentItem = (targetWidget.getParent() && targetWidget.getParent().item) || tree.item;
				// Compute the insert index for reordering
				insertIndex = targetWidget.getIndexInParent();
				if(this.dropPosition == "After"){
					insertIndex = targetWidget.getIndexInParent() + 1;
				}
			}else{
				newParentItem = (targetWidget && targetWidget.item) || tree.item;
			}

			// If necessary, use this variable to hold array of hashes to pass to model.newItem()
			// (one entry in the array for each dragged node).
			var newItemsParams;

			dojo.forEach(nodes, function(node, idx){
				// dojo.dnd.Item representing the thing being dropped.
				// Don't confuse the use of item here (meaning a DnD item) with the
				// uses below where item means dojo.data item.
				var sourceItem = source.getItem(node.id);

				// Information that's available if the source is another Tree
				// (possibly but not necessarily this tree, possibly but not
				// necessarily the same model as this Tree)
				if(dojo.indexOf(sourceItem.type, "treeNode") != -1){
					var childTreeNode = sourceItem.data,
						childItem = childTreeNode.item,
						oldParentItem = childTreeNode.getParent().item;
				}

				if(source == this){
					// This is a node from my own tree, and we are moving it, not copying.
					// Remove item from old parent's children attribute.
					// TODO: dijit.tree.dndSelector should implement deleteSelectedNodes()
					// and this code should go there.

					if(typeof insertIndex == "number"){
						if(newParentItem == oldParentItem && childTreeNode.getIndexInParent() < insertIndex){
							insertIndex -= 1;
						}
					}
					model.pasteItem(childItem, oldParentItem, newParentItem, copy, insertIndex);
				}else if(model.isItem(childItem)){
					// Item from same model
					// (maybe we should only do this branch if the source is a tree?)
					model.pasteItem(childItem, oldParentItem, newParentItem, copy, insertIndex);
				}else{
					// Get the hash to pass to model.newItem().  A single call to
					// itemCreator() returns an array of hashes, one for each drag source node.
					if(!newItemsParams){
						newItemsParams = this.itemCreator(nodes, target, source);
					}

					// Create new item in the tree, based on the drag source.
					model.newItem(newItemsParams[idx], newParentItem, insertIndex);
				}
			}, this);

			// Expand the target node (if it's currently collapsed) so the user can see
			// where their node was dropped.   In particular since that node is still selected.
			this.tree._expandNode(targetWidget);
		}
		this.onDndCancel();
	},

	onDndCancel: function(){
		// summary:
		//		Topic event processor for /dnd/cancel, called to cancel the DnD operation
		// tags:
		//		private
		this._unmarkTargetAnchor();
		this.isDragging = false;
		this.mouseDown = false;
		delete this.mouseButton;
		this._changeState("Source", "");
		this._changeState("Target", "");
	},

	// When focus moves in/out of the entire Tree
	onOverEvent: function(){
		// summary:
		//		This method is called when mouse is moved over our container (like onmouseenter)
		// tags:
		//		private
		this.inherited(arguments);
		dojo.dnd.manager().overSource(this);
	},
	onOutEvent: function(){
		// summary:
		//		This method is called when mouse is moved out of our container (like onmouseleave)
		// tags:
		//		private
		this._unmarkTargetAnchor();
		var m = dojo.dnd.manager();
		if(this.isDragging){
			m.canDrop(false);
		}
		m.outSource(this);

		this.inherited(arguments);
	},

	_isParentChildDrop: function(source, targetRow){
		// summary:
		//		Checks whether the dragged items are parent rows in the tree which are being
		//		dragged into their own children.
		//
		// source:
		//		The DragSource object.
		//
		// targetRow:
		//		The tree row onto which the dragged nodes are being dropped.
		//
		// tags:
		//		private

		// If the dragged object is not coming from the tree this widget belongs to,
		// it cannot be invalid.
		if(!source.tree || source.tree != this.tree){
			return false;
		}


		var root = source.tree.domNode;
		var ids = {};
		for(var x in source.selection){
			ids[source.selection[x].parentNode.id] = true;
		}

		var node = targetRow.parentNode;

		// Iterate up the DOM hierarchy from the target drop row,
		// checking of any of the dragged nodes have the same ID.
		while(node != root && (!node.id || !ids[node.id])){
			node = node.parentNode;
		}

		return node.id && ids[node.id];
	},

	_unmarkTargetAnchor: function(){
		// summary:
		//		Removes hover class of the current target anchor
		// tags:
		//		private
		if(!this.targetAnchor){ return; }
		this._removeItemClass(this.targetAnchor, this.dropPosition);
		this.targetAnchor = null;
		this.targetBox = null;
		this.dropPosition = null;
	},

	_markDndStatus: function(copy){
		// summary:
		//		Changes source's state based on "copy" status
		this._changeState("Source", copy ? "Copied" : "Moved");
	}
});

}
