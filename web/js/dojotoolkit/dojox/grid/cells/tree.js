/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.grid.cells.tree"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.grid.cells.tree"] = true;
dojo.provide("dojox.grid.cells.tree");

dojo.require("dojox.grid.cells");

dojox.grid.cells.TreeCell = {
	formatAggregate: function(inItem, level, inRowIndexes){
		var f, g=this.grid, i=g.edit.info, 
			d=g.aggregator ? g.aggregator.getForCell(this, level, inItem, level === this.level ? "cnt" : this.parentCell.aggregate) : (this.value || this.defaultValue);
		return this._defaultFormat(d, [d, level - this.level, inRowIndexes, this]);
	},
	formatIndexes: function(inRowIndexes, inItem){
		var f, g=this.grid, i=g.edit.info, 
			d=this.get ? this.get(inRowIndexes[0], inItem, inRowIndexes) : (this.value || this.defaultValue);
		if(this.editable && (this.alwaysEditing || (i.rowIndex==inRowIndexes[0] && i.cell==this))){
			return this.formatEditing(d, inRowIndexes[0], inRowIndexes);
		}else{
			return this._defaultFormat(d, [d, inRowIndexes[0], inRowIndexes, this]);
		}
	},
	getOpenState: function(itemId){
		var grid = this.grid, store = grid.store, itm = null;
		if(store.isItem(itemId)){
			itm = itemId;
			itemId = store.getIdentity(itemId);
		}
		if(!this.openStates){ this.openStates = {}; }
		if(typeof itemId != "string" || !(itemId in this.openStates)){
			this.openStates[itemId] = grid.getDefaultOpenState(this, itm);
		}
		return this.openStates[itemId];
	},
	formatAtLevel: function(inRowIndexes, inItem, level, summaryRow, toggleClass, cellClasses){
		if(!dojo.isArray(inRowIndexes)){
			inRowIndexes = [inRowIndexes];
		}
		var result = "";
		if(level > this.level || (level === this.level && summaryRow)){
			cellClasses.push("dojoxGridSpacerCell");
			if(level === this.level){
				cellClasses.push("dojoxGridTotalCell");
			}
			result = '<span></span>';
		}else if(level < this.level){
			cellClasses.push("dojoxGridSummaryCell");
			result = '<span class="dojoxGridSummarySpan">' + this.formatAggregate(inItem, level, inRowIndexes) + '</span>';
		}else{
			var ret = "";
			if(this.isCollapsable){
				var store = this.grid.store, id = "";
				if(store.isItem(inItem)){
					id = store.getIdentity(inItem);
				}
				cellClasses.push("dojoxGridExpandoCell");
				ret = '<span dojoType="dojox.grid._Expando" level="' + level + '" class="dojoxGridExpando"' +
						'" toggleClass="' + toggleClass + '" itemId="' + id + '" cellIdx="' + this.index + '"></span>';
			}
			result = ret + this.formatIndexes(inRowIndexes, inItem);
		}

		if(this.grid.focus.cell && this.index == this.grid.focus.cell.index &&
			inRowIndexes.join('/') == this.grid.focus.rowIndex){
			cellClasses.push(this.grid.focus.focusClass);
		}

		return result;
	}
};

}
