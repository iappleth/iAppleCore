/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.charting.plot2d.StackedBars"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.charting.plot2d.StackedBars"] = true;
dojo.provide("dojox.charting.plot2d.StackedBars");

dojo.require("dojox.charting.plot2d.common");
dojo.require("dojox.charting.plot2d.Bars");

dojo.require("dojox.lang.functional");
dojo.require("dojox.lang.functional.reversed");

(function(){
	var df = dojox.lang.functional, dc = dojox.charting.plot2d.common,
		purgeGroup = df.lambda("item.purgeGroup()");

	dojo.declare("dojox.charting.plot2d.StackedBars", dojox.charting.plot2d.Bars, {
		calculateAxes: function(dim){
			var stats = dc.collectStackedStats(this.series), t;
			this._maxRunLength = stats.hmax;
			stats.hmin -= 0.5;
			stats.hmax += 0.5;
			t = stats.hmin, stats.hmin = stats.vmin, stats.vmin = t;
			t = stats.hmax, stats.hmax = stats.vmax, stats.vmax = t;
			this._calc(dim, stats);
			return this;
		},
		render: function(dim, offsets){
			if(this._maxRunLength <= 0){
				return this;
			}

			// stack all values
			var acc = df.repeat(this._maxRunLength, "-> 0", 0);
			for(var i = 0; i < this.series.length; ++i){
				var run = this.series[i];
				for(var j = 0; j < run.data.length; ++j){
					var value = run.data[j], v = typeof value == "number" ? value : value.y;
					if(isNaN(v)){ v = 0; }
					acc[j] += v;
				}
			}
			// draw runs in backwards
			this.dirty = this.isDirty();
			if(this.dirty){
				dojo.forEach(this.series, purgeGroup);
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
			var t = this.chart.theme, color, stroke, fill, f, gap, height,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				events = this.events();
			f = dc.calculateBarSize(this._vScaler.bounds.scale, this.opt);
			gap = f.gap;
			height = f.size;
			this.resetEvents();
			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){ continue; }
				run.cleanGroup();
				var s = run.group;
				if(!run.fill || !run.stroke){
					// need autogenerated color
					color = run.dyn.color = new dojo.Color(t.next("color"));
				}
				stroke = run.stroke ? run.stroke : dc.augmentStroke(t.series.stroke, color);
				fill = run.fill ? run.fill : dc.augmentFill(t.series.fill, color);
				for(var j = 0; j < acc.length; ++j){
					var v = acc[j],
						width = ht(v),
						value = run.data[j],
						specialColor  = color,
						specialFill   = fill,
						specialStroke = stroke;
					if(typeof value != "number"){
						if(value.color){
							specialColor = new dojo.Color(value.color);
						}
						if("fill" in value){
							specialFill = value.fill;
						}else if(value.color){
							specialFill = dc.augmentFill(t.series.fill, specialColor);
						}
						if("stroke" in value){
							specialStroke = value.stroke;
						}else if(value.color){
							specialStroke = dc.augmentStroke(t.series.stroke, specialColor);
						}
					}
					if(width >= 1 && height >= 1){
						var shape = s.createRect({
							x: offsets.l,
							y: dim.height - offsets.b - vt(j + 1.5) + gap,
							width: width, height: height
						}).setFill(specialFill).setStroke(specialStroke);
						run.dyn.fill   = shape.getFill();
						run.dyn.stroke = shape.getStroke();
						if(events){
							var o = {
								element: "bar",
								index:   j,
								run:     run,
								plot:    this,
								hAxis:   this.hAxis || null,
								vAxis:   this.vAxis || null,
								shape:   shape,
								x:       v,
								y:       j + 1.5
							};
							this._connectEvents(shape, o);
						}
						if(this.animate){
							this._animateBar(shape, offsets.l, -width);
						}
					}
				}
				run.dirty = false;
				// update the accumulator
				for(var j = 0; j < run.data.length; ++j){
					var value = run.data[j], v = typeof value == "number" ? value : value.y;
					if(isNaN(v)){ v = 0; }
					acc[j] -= v;
				}
			}
			this.dirty = false;
			return this;
		}
	});
})();

}
