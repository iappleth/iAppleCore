/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.charting.plot2d.OHLC"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.charting.plot2d.OHLC"] = true;
dojo.provide("dojox.charting.plot2d.OHLC");

dojo.require("dojox.charting.plot2d.common");
dojo.require("dojox.charting.plot2d.Base");

dojo.require("dojox.lang.utils");
dojo.require("dojox.lang.functional");
dojo.require("dojox.lang.functional.reversed");

(function(){
	var df = dojox.lang.functional, du = dojox.lang.utils,
		dc = dojox.charting.plot2d.common,
		purgeGroup = df.lambda("item.purgeGroup()");

	//	Candlesticks are based on the Bars plot type; we expect the following passed
	//	as values in a series: 
	//	{ x?, open, close, high, low }
	//	if x is not provided, the array index is used.
	//	failing to provide the OHLC values will throw an error.
	dojo.declare("dojox.charting.plot2d.OHLC", dojox.charting.plot2d.Base, {
		defaultParams: {
			hAxis: "x",		// use a horizontal axis named "x"
			vAxis: "y",		// use a vertical axis named "y"
			gap:	2,		// gap between columns in pixels
			shadows: null	// draw shadows
		},
		optionalParams: {
			minBarSize: 1,	// minimal bar size in pixels
			maxBarSize: 1	// maximal bar size in pixels
		},

		constructor: function(chart, kwArgs){
			this.opt = dojo.clone(this.defaultParams);
			du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			this.series = [];
			this.hAxis = this.opt.hAxis;
			this.vAxis = this.opt.vAxis;
		},

		collectStats: function(series){
			//	we have to roll our own, since we need to use all four passed
			//	values to figure out our stats, and common only assumes x and y.
			var stats = dojo.clone(dc.defaultStats);
			for(var i=0; i<series.length; i++){
				var run = series[i];
				if(!run.data.length){ continue; }
				var old_vmin = stats.vmin, old_vmax = stats.vmax;
				if(!("ymin" in run) || !("ymax" in run)){
					dojo.forEach(run.data, function(val, idx){
						var x = val.x || idx + 1;
						stats.hmin = Math.min(stats.hmin, x);
						stats.hmax = Math.max(stats.hmax, x);
						stats.vmin = Math.min(stats.vmin, val.open, val.close, val.high, val.low);
						stats.vmax = Math.max(stats.vmax, val.open, val.close, val.high, val.low);
					});
				}
				if("ymin" in run){ stats.vmin = Math.min(old_vmin, run.ymin); }
				if("ymax" in run){ stats.vmax = Math.max(old_vmax, run.ymax); }
			}
			return stats;
		},

		calculateAxes: function(dim){
			var stats = this.collectStats(this.series), t;
			stats.hmin -= 0.5;
			stats.hmax += 0.5;
			this._calc(dim, stats);
			return this;
		},

		render: function(dim, offsets){
			this.dirty = this.isDirty();
			if(this.dirty){
				dojo.forEach(this.series, purgeGroup);
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
			var t = this.chart.theme, color, stroke, fill, f, gap, width,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				baseline = Math.max(0, this._vScaler.bounds.lower),
				baselineHeight = vt(baseline),
				events = this.events();
			f = dc.calculateBarSize(this._hScaler.bounds.scale, this.opt);
			gap = f.gap;
			width = f.size;
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
				//	note that fill does not get used with this
				stroke = run.stroke ? run.stroke : dc.augmentStroke(t.series.stroke, color);
				fill = run.fill ? run.fill : dc.augmentFill(t.series.fill, color);

				for(var j = 0; j < run.data.length; ++j){
					var v = run.data[j];

					//	calculate the points we need for OHLC
					var x = ht(v.x || (j+0.5)) + offsets.l + gap,
						y = dim.height - offsets.b,
						open = vt(v.open),
						close = vt(v.close),
						high = vt(v.high),
						low = vt(v.low);
					if(low > high){
						var tmp = high;
						high = low;
						low = tmp;
					}

					if(width >= 1){
						//	draw the line and rect, set up as a group and pass that to the events.
						var hl = { x1: width/2, x2: width/2, y1: y - high, y2: y - low },
							op = { x1: 0, x2: width/2, y1: y-open, y2: y-open},
							cl = { x1: width/2, x2: width, y1: y-close, y2: y-close };
						shape = s.createGroup();
						shape.setTransform({dx: x, dy: 0 });
						shape.createLine(hl).setStroke(stroke);
						shape.createLine(op).setStroke(stroke);
						shape.createLine(cl).setStroke(stroke);

						//	TODO: double check this.
						run.dyn.fill   = fill;
						run.dyn.stroke = stroke;
						if(events){
							var o = {
								element: "ohlc",
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
					}
				}
				run.dirty = false;
			}
			this.dirty = false;
			return this;
		}
	});
})();

}
