/*
	Copyright (c) 2004-2008, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.grid.compat._grid.publicEvents"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.grid.compat._grid.publicEvents"] = true;
dojo.provide("dojox.grid.compat._grid.publicEvents");

dojox.grid.publicEvents = {
	// summary:
	//		VirtualGrid mixin that provides default implementations for grid events.
	// description: 
	//		Default ynthetic events dispatched for VirtualGrid. dojo.connect to events to
	//		retain default implementation or override them for custom handling.
	
	// cellOverClass: String
	// 		css class to apply to grid cells over which the cursor is placed.
	cellOverClass: "dojoxGrid-cell-over",
	
	onKeyEvent: function(e){
		// summary: top level handler for Key Events
		this.dispatchKeyEvent(e);
	},

	onContentEvent: function(e){
		// summary: Top level handler for Content events
		this.dispatchContentEvent(e);
	},

	onHeaderEvent: function(e){
		// summary: Top level handler for header events
		this.dispatchHeaderEvent(e);
	},

	onStyleRow: function(inRow){
		// summary:
		//		Perform row styling on a given row. Called whenever row styling is updated.
		//
		// inRow: Object
		// 		Object containing row state information: selected, true if the row is selcted; over:
		// 		true of the mouse is over the row; odd: true if the row is odd. Use customClasses and
		// 		customStyles to control row css classes and styles; both properties are strings.
		//
		// example: onStyleRow({ selected: true, over:true, odd:false })
		with(inRow){
			customClasses += (odd?" dojoxGrid-row-odd":"") + (selected?" dojoxGrid-row-selected":"") + (over?" dojoxGrid-row-over":"");
		}
		this.focus.styleRow(inRow);
		this.edit.styleRow(inRow);
	},
	
	onKeyDown: function(e){
		// summary:
		// 		Grid key event handler. By default enter begins editing and applies edits, escape cancels and edit,
		// 		tab, shift-tab, and arrow keys move grid cell focus.
		if(e.altKey || e.ctrlKey || e.metaKey){
			return;
		}
		var dk = dojo.keys;
		switch(e.keyCode){
			case dk.ESCAPE:
				this.edit.cancel();
				break;
			case dk.ENTER:
				if(!e.shiftKey){
					var isEditing = this.edit.isEditing();
					this.edit.apply();
					if(!isEditing){
						this.edit.setEditCell(this.focus.cell, this.focus.rowIndex);
					}
				}
				break;
			case dk.TAB:
				this.focus[e.shiftKey ? 'previousKey' : 'nextKey'](e);
				break;
			case dk.LEFT_ARROW:
			case dk.RIGHT_ARROW:
				if(!this.edit.isEditing()){
					dojo.stopEvent(e);
					var offset = (e.keyCode == dk.LEFT_ARROW) ? 1 : -1;
					if(dojo._isBodyLtr()){ offset *= -1; }
					this.focus.move(0, offset);
				}
				break;
			case dk.UP_ARROW:
				if(!this.edit.isEditing() && this.focus.rowIndex != 0){
					dojo.stopEvent(e);
					this.focus.move(-1, 0);
				}
				break;
			case dk.DOWN_ARROW:
				if(!this.edit.isEditing() && this.focus.rowIndex+1 != this.model.count){
					dojo.stopEvent(e);
					this.focus.move(1, 0);
				}
				break;
			case dk.PAGE_UP:
				if(!this.edit.isEditing() && this.focus.rowIndex != 0){
					dojo.stopEvent(e);
					if(this.focus.rowIndex != this.scroller.firstVisibleRow+1){
						this.focus.move(this.scroller.firstVisibleRow-this.focus.rowIndex, 0);
					}else{
						this.setScrollTop(this.scroller.findScrollTop(this.focus.rowIndex-1));
						this.focus.move(this.scroller.firstVisibleRow-this.scroller.lastVisibleRow+1, 0);
					}
				}
				break;
			case dk.PAGE_DOWN:
				if(!this.edit.isEditing() && this.focus.rowIndex+1 != this.model.count){
					dojo.stopEvent(e);
					if(this.focus.rowIndex != this.scroller.lastVisibleRow-1){
						this.focus.move(this.scroller.lastVisibleRow-this.focus.rowIndex-1, 0);
					}else{
						this.setScrollTop(this.scroller.findScrollTop(this.focus.rowIndex+1));
						this.focus.move(this.scroller.lastVisibleRow-this.scroller.firstVisibleRow-1, 0);
					}
				}
				break;
		}
	},
	
	onMouseOver: function(e){
		// summary:
		//		Event fired when mouse is over the grid.
		// e: Event
		//		Decorated event object contains reference to grid, cell, and rowIndex
		e.rowIndex == -1 ? this.onHeaderCellMouseOver(e) : this.onCellMouseOver(e);
	},
	
	onMouseOut: function(e){
		// summary:
		//		Event fired when mouse moves out of the grid.
		// e: Event
		//		Decorated event object that contains reference to grid, cell, and rowIndex
		e.rowIndex == -1 ? this.onHeaderCellMouseOut(e) : this.onCellMouseOut(e);
	},
	
	onMouseDown: function(e){
		// summary:
		//		Event fired when mouse is down inside grid.
		// e: Event
		//		Decorated event object that contains reference to grid, cell, and rowIndex
		e.rowIndex == -1 ? this.onHeaderCellMouseDown(e) : this.onCellMouseDown(e);
	},
	
	onMouseOverRow: function(e){
		// summary:
		//		Event fired when mouse is over any row (data or header).
		// e: Event
		//		Decorated event object contains reference to grid, cell, and rowIndex
		if(!this.rows.isOver(e.rowIndex)){
			this.rows.setOverRow(e.rowIndex);
			e.rowIndex == -1 ? this.onHeaderMouseOver(e) : this.onRowMouseOver(e);
		}
	},
	onMouseOutRow: function(e){
		// summary:
		//		Event fired when mouse moves out of any row (data or header).
		// e: Event
		//		Decorated event object contains reference to grid, cell, and rowIndex
		if(this.rows.isOver(-1)){
			this.onHeaderMouseOut(e);
		}else if(!this.rows.isOver(-2)){
			this.rows.setOverRow(-2);
			this.onRowMouseOut(e);
		}
	},
	
	onMouseDownRow: function(e){
		// summary:
		//		Event fired when mouse is down inside grid row
		// e: Event
		//		Decorated event object that contains reference to grid, cell, and rowIndex
		if(e.rowIndex != -1)
			this.onRowMouseDown(e);
	},

	// cell events
	onCellMouseOver: function(e){
		// summary:
		//		Event fired when mouse is over a cell.
		// e: Event
		//		Decorated event object contains reference to grid, cell, and rowIndex
		dojo.addClass(e.cellNode, this.cellOverClass);
	},
	
	onCellMouseOut: function(e){
		// summary:
		//		Event fired when mouse moves out of a cell.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		dojo.removeClass(e.cellNode, this.cellOverClass);
	},
	
	onCellMouseDown: function(e){
		// summary:
		//		Event fired when mouse is down in a header cell.
		// e: Event
		// 		Decorated event object which contains reference to grid, cell, and rowIndex
	},

	onCellClick: function(e){
		// summary:
		//		Event fired when a cell is clicked.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		this._click[0] = this._click[1];
		this._click[1] = e;
		if(!this.edit.isEditCell(e.rowIndex, e.cellIndex)){
			this.focus.setFocusCell(e.cell, e.rowIndex);
		}
		this.onRowClick(e);
	},

	onCellDblClick: function(e){
		// summary:
		//		Event fired when a cell is double-clicked.
		// e: Event
		//		Decorated event object contains reference to grid, cell, and rowIndex
		if(dojo.isIE){
			this.edit.setEditCell(this._click[1].cell, this._click[1].rowIndex);
		}else if(this._click[0].rowIndex != this._click[1].rowIndex){
			this.edit.setEditCell(this._click[0].cell, this._click[0].rowIndex);
		}else{
			this.edit.setEditCell(e.cell, e.rowIndex);
		}
		this.onRowDblClick(e);
	},

	onCellContextMenu: function(e){
		// summary:
		//		Event fired when a cell context menu is accessed via mouse right click.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		this.onRowContextMenu(e);
	},

	onCellFocus: function(inCell, inRowIndex){
		// summary:
		//		Event fired when a cell receives focus.
		// inCell: Object
		//		Cell object containing properties of the grid column.
		// inRowIndex: Integer
		//		Index of the grid row
		this.edit.cellFocus(inCell, inRowIndex);
	},

	// row events
	onRowClick: function(e){
		// summary:
		//		Event fired when a row is clicked.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		this.edit.rowClick(e);
		this.selection.clickSelectEvent(e);
	},

	onRowDblClick: function(e){
		// summary:
		//		Event fired when a row is double clicked.
		// e: Event
		//		decorated event object which contains reference to grid, cell, and rowIndex
	},

	onRowMouseOver: function(e){
		// summary:
		//		Event fired when mouse moves over a data row.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
	},

	onRowMouseOut: function(e){
		// summary:
		//		Event fired when mouse moves out of a data row.
		// e: Event
		// 		Decorated event object contains reference to grid, cell, and rowIndex
	},
	
	onRowMouseDown: function(e){
		// summary:
		//		Event fired when mouse is down in a row.
		// e: Event
		// 		Decorated event object which contains reference to grid, cell, and rowIndex
	},

	onRowContextMenu: function(e){
		// summary:
		//		Event fired when a row context menu is accessed via mouse right click.
		// e: Event
		// 		Decorated event object which contains reference to grid, cell, and rowIndex
		dojo.stopEvent(e);
	},

	// header events
	onHeaderMouseOver: function(e){
		// summary:
		//		Event fired when mouse moves over the grid header.
		// e: Event
		// 		Decorated event object contains reference to grid, cell, and rowIndex
	},

	onHeaderMouseOut: function(e){
		// summary:
		//		Event fired when mouse moves out of the grid header.
		// e: Event
		// 		Decorated event object which contains reference to grid, cell, and rowIndex
	},

	onHeaderCellMouseOver: function(e){
		// summary:
		//		Event fired when mouse moves over a header cell.
		// e: Event
		// 		Decorated event object which contains reference to grid, cell, and rowIndex
		dojo.addClass(e.cellNode, this.cellOverClass);
	},

	onHeaderCellMouseOut: function(e){
		// summary:
		//		Event fired when mouse moves out of a header cell.
		// e: Event
		// 		Decorated event object which contains reference to grid, cell, and rowIndex
		dojo.removeClass(e.cellNode, this.cellOverClass);
	},
	
	onHeaderCellMouseDown: function(e) {
		// summary:
		//		Event fired when mouse is down in a header cell.
		// e: Event
		// 		Decorated event object which contains reference to grid, cell, and rowIndex
	},

	onHeaderClick: function(e){
		// summary:
		//		Event fired when the grid header is clicked.
		// e: Event
		// Decorated event object which contains reference to grid, cell, and rowIndex
	},

	onHeaderCellClick: function(e){
		// summary:
		//		Event fired when a header cell is clicked.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		this.setSortIndex(e.cell.index);
		this.onHeaderClick(e);
	},

	onHeaderDblClick: function(e){
		// summary:
		//		Event fired when the grid header is double clicked.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
	},

	onHeaderCellDblClick: function(e){
		// summary:
		//		Event fired when a header cell is double clicked.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		this.onHeaderDblClick(e);
	},

	onHeaderCellContextMenu: function(e){
		// summary:
		//		Event fired when a header cell context menu is accessed via mouse right click.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		this.onHeaderContextMenu(e);
	},

	onHeaderContextMenu: function(e){
		// summary:
		//		Event fired when the grid header context menu is accessed via mouse right click.
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		dojo.stopEvent(e);
	},

	// editing
	onStartEdit: function(inCell, inRowIndex){
		// summary:
		//		Event fired when editing is started for a given grid cell
		// inCell: Object
		//		Cell object containing properties of the grid column.
		// inRowIndex: Integer
		//		Index of the grid row
	},

	onApplyCellEdit: function(inValue, inRowIndex, inFieldIndex){
		// summary:
		//		Event fired when editing is applied for a given grid cell
		// inValue: String
		//		Value from cell editor
		// inRowIndex: Integer
		//		Index of the grid row
		// inFieldIndex: Integer
		//		Index in the grid's data model
	},

	onCancelEdit: function(inRowIndex){
		// summary:
		//		Event fired when editing is cancelled for a given grid cell
		// inRowIndex: Integer
		//		Index of the grid row
	},

	onApplyEdit: function(inRowIndex){
		// summary:
		//		Event fired when editing is applied for a given grid row
		// inRowIndex: Integer
		//		Index of the grid row
	},

	onCanSelect: function(inRowIndex){
		// summary:
		//		Event to determine if a grid row may be selected
		// inRowIndex: Integer
		//		Index of the grid row
		// returns: Boolean
		//		true if the row can be selected
		return true;
	},

	onCanDeselect: function(inRowIndex){
		// summary:
		//		Event to determine if a grid row may be deselected
		// inRowIndex: Integer
		//		Index of the grid row
		// returns: Boolean
		//		true if the row can be deselected
		return true;
	},

	onSelected: function(inRowIndex){
		// summary:
		//		Event fired when a grid row is selected
		// inRowIndex: Integer
		//		Index of the grid row
		this.updateRowStyles(inRowIndex);
	},

	onDeselected: function(inRowIndex){
		// summary:
		//		Event fired when a grid row is deselected
		// inRowIndex: Integer
		//		Index of the grid row
		this.updateRowStyles(inRowIndex);
	},

	onSelectionChanged: function(){
	}

}

}
