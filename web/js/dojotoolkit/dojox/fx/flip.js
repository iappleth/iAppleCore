/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.fx.flip"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.fx.flip"] = true;
dojo.provide("dojox.fx.flip");
dojo.experimental("dojox.fx.flip");
dojo.require("dojo.fx");
(function(){
	
	// because ShrinkSafe will eat this up: 
	var borderConst = "border",
		widthConst = "Width",
		heightConst = "Height",
		topConst = "Top",
		rightConst = "Right",
		leftConst = "Left",
		bottomConst = "Bottom"
	;

	dojox.fx.flip = function(/*Object*/ args){
		// summary: Animate a node flipping following a specific direction
		//	
		// description:
		//		Returns an animation that will flip the
		//		node around a central axis:
		//		if args.dir is "left" or "right" --> y axis
		//		if args.dir is "top" or "bottom" --> x axis
		//
		//		This effect is obtained using a border distorsion applied to a helper node.
		//
		//		The user can specify three background colors for the helper node:
		//		darkColor: the darkest color reached during the animation 
		//		lightColor: the brightest color
		//		endColor: the final backgroundColor for the node
        //
        //		depth: Float
		//			 0 <= depth <= 1 overrides the computed "depth"
        //          (0: min distorsion, 1: max distorsion)
        //
        //      whichAnim: String
        //          "first"          : the first half animation
        //          "last"           : the second one
        //          "both" (default) : both
        //
        //      axis: String
        //          "center" (default)    : the node is flipped around his center
        //          "shortside"           : the node is flipped around his "short" (in perspective) side
        //          "longside"            : the node is flipped around his "long" (in perspective) side
        //          "cube"                : the node flips around the central axis of the cube
        //
        //      shift: Integer
        //          node translation, perpendicular to the rotation axis
		//
		//	example:
		//	|	var anim = dojox.fx.flip({ 
		//	|		node: dojo.byId("nodeId"),
		//	|		dir: "top",
		//	|		darkColor: "#555555",
		//	|		lightColor: "#dddddd",
		//	|		endColor: "#666666",
		//	|		depth: .5,
		//	|		shift: 50,
		//	|		duration:300
		//	|	  });

		var helperNode = dojo.create("div"),
			node = args.node = dojo.byId(args.node), 
			s = node.style,
			dims = null, 
			hs = null, 
			pn = null,
			lightColor = args.lightColor || "#dddddd", 
			darkColor = args.darkColor || "#555555",
			bgColor = dojo.style(node, "backgroundColor"), 
			endColor = args.endColor || bgColor,
			staticProps = {}, 
			anims = [],
			duration = args.duration ? args.duration / 2 : 250,
			dir = args.dir || "left", 
			pConst = .9,
			transparentColor = "transparent",
			whichAnim = args.whichAnim,
			axis = args.axis || "center",
			depth = args.depth
		;
		// IE6 workaround: IE6 doesn't support transparent borders
		var convertColor = function(color){
			return ((new dojo.Color(color)).toHex() === "#000000") ? "#000001" : color;
		};

		if(dojo.isIE < 7){
			endColor = convertColor(endColor);
			lightColor = convertColor(lightColor);
			darkColor = convertColor(darkColor);
			bgColor = convertColor(bgColor);
			transparentColor = "black";
			helperNode.style.filter = "chroma(color='#000000')";
		}

		var init = (function(n){
			return function(){
				var ret = dojo.coords(n, true);
				dims = {
					top: ret.y,
					left: ret.x,
					width: ret.w,
					height: ret.h
				};
			}
		})(node);
		init();
		// helperNode initialization
		hs = {
			position: "absolute",
			top: dims["top"] + "px",
			left: dims["left"] + "px",
			height: "0",
			width: "0",
			zIndex: args.zIndex || (s.zIndex || 0),
			border: "0 solid " + transparentColor,
			fontSize: "0",
			visibility: "hidden"
		};
		var props = [ {}, 
			{
				top: dims["top"],
				left: dims["left"]
			}
		];
		var dynProperties = {
			left: [leftConst, rightConst, topConst, bottomConst, widthConst, heightConst, "end" + heightConst + "Min", leftConst, "end" + heightConst + "Max"],
			right: [rightConst, leftConst, topConst, bottomConst, widthConst, heightConst, "end" + heightConst + "Min", leftConst, "end" + heightConst + "Max"],
			top: [topConst, bottomConst, leftConst, rightConst, heightConst, widthConst, "end" + widthConst + "Min", topConst, "end" + widthConst + "Max"],
			bottom: [bottomConst, topConst, leftConst, rightConst, heightConst, widthConst, "end" + widthConst + "Min", topConst, "end" + widthConst + "Max"] 
		};
		// property names
		pn = dynProperties[dir];

		// .4 <= pConst <= .9
		if(typeof depth != "undefined"){
			depth = Math.max(0, Math.min(1, depth)) / 2;
			pConst = .4 + (.5 - depth);
		}else{
			pConst = Math.min(.9, Math.max(.4, dims[pn[5].toLowerCase()] / dims[pn[4].toLowerCase()]));
		}
		var p0 = props[0];
		for(var i = 4; i < 6; i++){
			if(axis == "center" || axis == "cube"){ // find a better name for "cube" 
				dims["end" + pn[i] + "Min"] = dims[pn[i].toLowerCase()] * pConst; 
				dims["end" + pn[i] + "Max"] = dims[pn[i].toLowerCase()] / pConst; 
			}else if(axis == "shortside"){
				dims["end" + pn[i] + "Min"] = dims[pn[i].toLowerCase()];
				dims["end" + pn[i] + "Max"] = dims[pn[i].toLowerCase()] / pConst; 
			}else if(axis == "longside"){
				dims["end" + pn[i] + "Min"] = dims[pn[i].toLowerCase()] * pConst;
				dims["end" + pn[i] + "Max"] = dims[pn[i].toLowerCase()];  
			}
		}
		if(axis == "center"){
			p0[pn[2].toLowerCase()] = dims[pn[2].toLowerCase()] - (dims[pn[8]] - dims[pn[6]]) / 4;
		}else if(axis == "shortside"){
			p0[pn[2].toLowerCase()] = dims[pn[2].toLowerCase()] - (dims[pn[8]] - dims[pn[6]]) / 2;
		}

		staticProps[pn[5].toLowerCase()] = dims[pn[5].toLowerCase()] + "px";
		staticProps[pn[4].toLowerCase()] = "0";
		staticProps[borderConst + pn[1] + widthConst] = dims[pn[4].toLowerCase()] + "px";
		staticProps[borderConst + pn[1] + "Color"] = bgColor;

		p0[borderConst + pn[1] + widthConst] = 0; 
		p0[borderConst + pn[1] + "Color"] = darkColor; 
		p0[borderConst + pn[2] + widthConst] = p0[borderConst + pn[3] + widthConst] = axis != "cube" 
			? (dims["end" + pn[5] +  "Max"] - dims["end" + pn[5] + "Min"]) / 2
			: dims[pn[6]] / 2
		;
		p0[pn[7].toLowerCase()] = dims[pn[7].toLowerCase()] + dims[pn[4].toLowerCase()] / 2 + (args.shift || 0);
		p0[pn[5].toLowerCase()] = dims[pn[6]];

		var p1 = props[1];
		p1[borderConst + pn[0] + "Color"] = { start: lightColor, end: endColor };
		p1[borderConst + pn[0] + widthConst] = dims[pn[4].toLowerCase()];
		p1[borderConst + pn[2] + widthConst] = 0;
		p1[borderConst + pn[3] + widthConst] = 0;
		p1[pn[5].toLowerCase()] = { start: dims[pn[6]], end: dims[pn[5].toLowerCase()] };

		dojo.mixin(hs, staticProps);
		dojo.style(helperNode, hs);
		dojo.body().appendChild(helperNode);

		var finalize = function(){
//			helperNode.parentNode.removeChild(helperNode);
			dojo.destroy(helperNode);
			// fixes a flicker when the animation ends
			s.backgroundColor = endColor;
			s.visibility = "visible";
		};
		if(whichAnim == "last"){
			for(i in p0){
				p0[i] = { start: p0[i] };
			}
			p0[borderConst + pn[1] + "Color"] = { start: darkColor, end: endColor }; 
			p1 = p0;
		}
		if(!whichAnim || whichAnim == "first"){
			anims.push(dojo.animateProperty({
				node: helperNode, 
				duration: duration,
				properties: p0
			}));
		}
		if(!whichAnim || whichAnim == "last"){
			anims.push(dojo.animateProperty({
				node: helperNode, 
				duration: duration,
				properties: p1,
				onEnd: finalize
			}));
		}

		// hide the original node
		dojo.connect(anims[0], "play", function(){
			helperNode.style.visibility = "visible";
			s.visibility = "hidden"; 
		});

		return dojo.fx.chain(anims); // dojo._Animation

	}

	dojox.fx.flipCube = function(/*Object*/ args){
		// summary: An extension to `dojox.fx.flip` providing a more 3d-like rotation
		//
		// description:
		//		An extension to `dojox.fx.flip` providing a more 3d-like rotation. 
		//		Behaves the same as `dojox.fx.flip`, using the same attributes and 
		//		other standard `dojo._Animation` properties.
		//
		//	example:
		//		See `dojox.fx.flip`
		var anims = [],
			mb = dojo.marginBox(args.node),
			shiftX = mb.w / 2,
			shiftY = mb.h / 2,
			dims = {
				top: {
					pName: "height",
					args:[
						{
							whichAnim: "first",
							dir: "top",
							shift: -shiftY
						},
						{
							whichAnim: "last",
							dir: "bottom",
							shift: shiftY
						}
					]
				},
				right: {
					pName: "width",
					args:[
						{
							whichAnim: "first",
							dir: "right",
							shift: shiftX
						},
						{
							whichAnim: "last",
							dir: "left",
							shift: -shiftX
						}
					]
				},
				bottom: {
					pName: "height",
					args:[
						{
							whichAnim: "first",
							dir: "bottom",
							shift: shiftY
						},
						{
							whichAnim: "last",
							dir: "top",
							shift: -shiftY
						}
					]
				},
				left: {
					pName: "width",
					args:[
						{
							whichAnim: "first",
							dir: "left",
							shift: -shiftX
						},
						{
							whichAnim: "last",
							dir: "right",
							shift: shiftX
						}
					]
				}
			}
		;
		var d = dims[args.dir || "left"],
			p = d.args
		;
		args.duration = args.duration ? args.duration * 2 : 500; 
		args.depth = .8;
		args.axis = "cube";
		for(var i = p.length - 1; i >= 0; i--){
			dojo.mixin(args, p[i]);
			anims.push(dojox.fx.flip(args));
		}
		return dojo.fx.combine(anims);
	};
	
	dojox.fx.flipPage = function(/*Object*/ args){
		// summary: An extension to `dojox.fx.flip` providing a page flip like animation.
		//
		// description:
		//		An extension to `dojox.fx.flip` providing a page flip effect.
		//		Behaves the same as `dojox.fx.flip`, using the same attributes and
		//		other standard `dojo._Animation` properties.
		//
		//	example:
		//		See `dojox.fx.flip`
		var n = args.node,
			coords = dojo.coords(n, true),
			x = coords.x,
			y = coords.y,
			w = coords.w,
			h = coords.h,
			bgColor = dojo.style(n, "backgroundColor"), 
			lightColor = args.lightColor || "#dddddd",
			darkColor = args.darkColor, 
			helperNode = dojo.create("div"),
			anims = [],
			hn = [],
			dir = args.dir || "right",
			pn = {
				left: ["left", "right", "x", "w"],
				top: ["top", "bottom", "y", "h"],
				right: ["left", "left", "x", "w"],
				bottom: ["top", "top", "y", "h"]
			},
			shiftMultiplier = {
				right: [1, -1],
				left: [-1, 1],
				top: [-1, 1],
				bottom: [1, -1]
			}
		;
		dojo.style(helperNode, {
			position: "absolute",
			width  : w + "px",
			height : h + "px",
			top    : y + "px",
			left   : x + "px",
			visibility: "hidden"
		});
		var hs = [];
		for(var i = 0; i < 2; i++){
			var r = i % 2,
				d = r ? pn[dir][1] : dir,
				wa = r ? "last" : "first",
				endColor = r ? bgColor : lightColor,
				startColor = r ? endColor : args.startColor || n.style.backgroundColor
			;
			hn[i] = dojo.clone(helperNode);
			var	finalize = function(x){
					return function(){
						dojo.destroy(hn[x]);
					}
				}(i)
			;
			dojo.body().appendChild(hn[i]);
			hs[i] = {
				backgroundColor: r ? startColor : bgColor
			};
			
			hs[i][pn[dir][0]] = coords[pn[dir][2]] + shiftMultiplier[dir][0] * i * coords[pn[dir][3]] + "px";
			dojo.style(hn[i], hs[i]);
			anims.push(dojox.fx.flip({
			    node: hn[i],
			    dir: d,
			    axis: "shortside",
			    depth: args.depth,
			    duration: args.duration / 2,
			    shift: shiftMultiplier[dir][i] * coords[pn[dir][3]] / 2,
				darkColor: darkColor,
				lightColor: lightColor,
			    whichAnim: wa,
			    endColor: endColor
			}));
			dojo.connect(anims[i], "onEnd", finalize);
		}
		return dojo.fx.chain(anims);
	};
	
	
	dojox.fx.flipGrid = function(/*Object*/ args){
		// summary: An extension to `dojox.fx.flip` providing a decomposition in rows * cols flipping elements
		//
		// description:
		//		An extension to `dojox.fx.flip` providing a page flip effect.
		//		Behaves the same as `dojox.fx.flip`, using the same attributes and
		//		other standard `dojo._Animation` properties and
		//
        //      cols: Integer columns
        //      rows: Integer rows
		//
		//      duration: the single flip duration
		//
		//	example:
		//		See `dojox.fx.flip`
		var rows = args.rows || 4,
			cols = args.cols || 4,
			anims = [],
			helperNode = dojo.create("div"),
			n = args.node,
			coords = dojo.coords(n, true),
			x = coords.x,
			y = coords.y,
			nw = coords.w,
			nh = coords.h,
			w = coords.w / cols,
			h = coords.h / rows,
			cAnims = []
		;
		dojo.style(helperNode, {
			position: "absolute",
			width: w + "px",
			height: h + "px",
			backgroundColor: dojo.style(n, "backgroundColor")
		});
		for(var i = 0; i < rows; i++){
			var r = i % 2,
				d = r ? "right" : "left",
				signum = r ? 1 : -1
			;
			// cloning
			var cn = dojo.clone(n);
			dojo.style(cn, {
				position: "absolute",
				width: nw + "px",
				height: nh + "px",
				top: y + "px",
				left: x + "px",
				clip: "rect(" + i * h + "px," + nw + "px," + nh + "px,0)"	
			});
	     	dojo.body().appendChild(cn);
			anims[i] = [];
			for(var j = 0; j < cols; j++){
				var hn = dojo.clone(helperNode),
					l = r ? j : cols - (j + 1)
				; 
				var adjustClip = function(xn, yCounter, xCounter){
					return function(){
						if(!(yCounter % 2)){
							dojo.style(xn, {
								clip: "rect(" + yCounter * h + "px," + (nw - (xCounter + 1) * w ) + "px," + ((yCounter + 1) * h) + "px,0px)"
							});
						}else{
							dojo.style(xn, {
								clip: "rect(" + yCounter * h + "px," + nw + "px," + ((yCounter + 1) * h) + "px," + ((xCounter + 1) * w) + "px)"
							});
						}
					}
				}(cn, i, j);
	     		dojo.body().appendChild(hn);
	     		dojo.style(hn, {
	     		    left: x + l * w + "px",
	     		    top: y + i * h + "px",
					visibility: "hidden"
	     		});
				var a = dojox.fx.flipPage({
				   node: hn,
				   dir: d,
				   duration: args.duration || 900,
				   shift: signum * w/2,
				   depth: .2,
				   darkColor: args.darkColor,
				   lightColor: args.lightColor,
				   startColor: args.startColor || args.node.style.backgroundColor
				}),
				removeHelper = function(xn){
					return function(){
						dojo.destroy(xn);
					}
				}(hn)
				;
				dojo.connect(a, "play", this, adjustClip);
				dojo.connect(a, "play", this, removeHelper);
				anims[i].push(a);
			}
			cAnims.push(dojo.fx.chain(anims[i]));
			
		}
		dojo.connect(cAnims[0], "play", function(){
			dojo.style(n, {visibility: "hidden"});
		});
		return dojo.fx.combine(cAnims);
	};
})();

}
