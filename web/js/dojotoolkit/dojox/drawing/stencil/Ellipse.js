/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.drawing.stencil.Ellipse"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.drawing.stencil.Ellipse"] = true;
dojo.provide("dojox.drawing.stencil.Ellipse");

/*=====
__StencilData = {
	// summary:
	//		the data used to create the dojox.gfx Shape
	//

	// 	cx: Number
	//		Center point x
	cx:0,
	// 	cy: Number
	//		Center point y
	cy:0,
	// 	rx: Number
	//		Horizontal radius
	rx:0,
	// 	ry: Number
	//		Vertical radius
	ry:0
}
=====*/

dojox.drawing.stencil.Ellipse = dojox.drawing.util.oo.declare(
	// summary:
	//		Creates a dojox.gfx Ellipse based on data or points provided.
	//
	dojox.drawing.stencil._Base,
	function(options){
		// summary:
		//		constructor
	},
	{
		
		type:"dojox.drawing.stencil.Ellipse",
		anchorType: "group",
		baseRender:true,
		dataToPoints: function(/*Object*/o){
			//summary:
			//		Converts data to points.
			o = o || this.data;
			var x = o.cx - o.rx,
				y = o.cy - o.ry,
				w = o.rx*2,
				h = o.ry*2
			this.points = [
				{x:x, y:y}, 	// TL
				{x:x+w, y:y},	// TR
				{x:x+w, y:y+h},	// BR
				{x:x, y:y+h}	// BL
			];
			return this.points; //Array
		},
		
		pointsToData: function(/*Array*/p){
			// summary:
			//		Converts points to data
			p = p || this.points;
			var s = p[0];
			var e = p[2];
			this.data = {
				cx: s.x + (e.x - s.x)/2,
				cy: s.y + (e.y - s.y)/2,
				rx: (e.x - s.x)*.5,
				ry: (e.y - s.y)*.5
			};
			return this.data; //Object
		
		},
		
		_create: function(/*String*/shp, /*__StencilData*/d, /*Object*/sty){
			// summary:
			//		Creates a dojox.gfx.shape based on passed arguments.
			//		Can be called many times by implementation to create
			//		multiple shapes in one stencil.
			//
			this.remove(this[shp]);
			this[shp] = this.container.createEllipse(d)
				.setStroke(sty)
				.setFill(sty.fill);
			this.util.attr(this[shp], "drawingType", "stencil");
		},
		
		render: function(){
			// summary:
			//		Renders the 'hit' object (the shape used for an expanded
			//		hit area and for highlighting) and the'shape' (the actual
			//		display object).
			//
			this.onBeforeRender(this);
			this.renderHit && this._create("hit", this.data, this.style.currentHit);
			this._create("shape", this.data, this.style.current);
		}
		
	}
);

dojox.drawing.register({
	name:"dojox.drawing.stencil.Ellipse"	
}, "stencil");

}
