/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.widget.Standby"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.widget.Standby"] = true;
dojo.provide("dojox.widget.Standby");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dojo.fx");

dojo.experimental("dojox.widget.Standby");

dojo.declare("dojox.widget.Standby",[dijit._Widget, dijit._Templated],{
	//	summary:
	//		A widget designed to act as a Standby/Busy/Disable/Blocking widget to indicate a 
	//		particular DOM node is processing and cannot be clicked on at this time.
	//		This widget uses absolute positioning to apply the overlay and image.
	// 
	//	image:	
	//		A URL to an image to center within the blocking overlay.  
	//		The default is a basic spinner.
	//
	//	imageText:
	//		Text to set on the ALT tag of the image.  
	//		The default is 'Please wait...'
	//
	//	text:
	//		Text to display in the center instead of an image.
	//		Defaults to 'Please Wait...'
	//
	//	centerIndicator:
	//		Which to use as the center info, the text or the image.
	//		Defaults to image.
	//
	//	color:
	//		The color to use for the translucent overlay.  
	//		Text string such as: darkblue, #FE02FD, etc.
	//
	//	duration:
	//		How long the fade in and out effects should run in milliseconds.
	//		Default is 500ms
	//
	//	zIndex:
	//		Control that lets you specify if the zIndex for the overlay
	//		should be auto-computed based off parent zIndex, or should be set
	//		to a particular value.  This is useful when you want to overlay 
	//		things in digit.Dialogs, you can specify a base zIndex to append from.
	//		Default is 'auto'.

	//	templateString: [protected] String
	//		The template string defining out the basics of the widget.  No need for an external
	//		file.
	templateString: 
		"<div>" +
			"<div style=\"display: none; opacity: 0; z-index: 9999; " +
				"position: absolute; cursor:wait;\" dojoAttachPoint=\"_underlayNode\"></div>" +
			"<img src=\"${image}\" style=\"opacity: 0; display: none; z-index: -10000; " +
				"position: absolute; top: 0px; left: 0px; cursor:wait;\" "+
				"dojoAttachPoint=\"_imageNode\">" +
			"<div style=\"opacity: 0; display: none; z-index: -10000; position: absolute; " +
				"top: 0px;\" dojoAttachPoint=\"_textNode\"></div>" +
		"</div>",

	//	_underlayNode: [private] DOMNode
	//		The node that is the translucent underlay for the 
	//		image that blocks access to the target.
	_underlayNode: null,	

	//	_imageNode: [private] DOMNode
	//		The image node where we attach and define the image to display.
	_imageNode: null,

	//	_textNode: [private] DOMNode
	//		The div to attach text/HTML in the overlay center item.
	_textNode: null,

	//	_centerNode: [private] DOMNode
	//		Which node to use as the center node, the image or the text node.
	_centerNode: null,

	//	image: String
	//		The URL to the image to center in the overlay.
	image: dojo.moduleUrl("dojox", "widget/Standby/images/loading.gif").toString(), 

	//	imageText: String
	//		Text for the ALT tag.
	imageText: "Please Wait...", 

	//	text: String
	//		Text/HTML to display in the center of the overlay
	//		This is used if image center is disabled.
	text: "Please wait...",

	//	centerIndicator: String
	//		Property to define if the image and its alt text should be used, or
	//		a simple Text/HTML node should be used.  Allowable values are 'image'
	//		and 'text'.
	//		Default is 'image'.
	centerIndicator: "image",

	//	_displayed: [private] Boolean
	//		Flag to indicate if the overlay is displayed or not.
	_displayed: false, 

	//	_resizeCheck: [private] Object
	//		Handle to interval function that checks the target for changes.
	_resizeCheck: null, 
	
	//	target: DOMNode||DOMID(String)||WidgetID(String)
	//		The target to overlay when active.  Can be a widget id, a 
	//		dom id, or a direct node reference.
	target: "", 

	//	color:	String
	//		The color to set the overlay.  Should be in #XXXXXX form.
	//		Default color for the translucent overlay is light gray.
	color: "#C0C0C0",

	//	duration: integer
	//		Integer defining how long the show and hide effects should take.
	duration: 500,

	//	_started: [private] Boolean 
	//		Trap flag to ensure startup only processes once.
	_started: false,

	//	_parent: [private] DOMNode
	//		Wrapping div for the widget, also used for IE 7 in dealing with the
	//		zoom issue.
	_parent: null,

	//	zIndex: String
	//		Control that lets you specify if the zIndex for the overlay
	//		should be auto-computed based off parent zIndex, or should be set
	//		to a particular value.  This is useful when you want to overlay 
	//		things in digit.Dialogs, you can specify a base zIndex to append from.
	zIndex: "auto",

	startup: function(args){
		//	summary:
		//		Over-ride of the basic widget startup function.  
		//		Configures the target node and sets the image to use.
		if(!this._started){
            if(typeof this.target === "string"){
				var w = dijit.byId(this.target);
				if(w){
					this.target = w.domNode;
				}else{
					this.target = dojo.byId(this.target);
				}
			}

			if(this.text){
				this._textNode.innerHTML = this.text;
			}
			if(this.centerIndicator === "image"){
				this._centerNode = this._imageNode;
				dojo.attr(this._imageNode, "src", this.image);
				dojo.attr(this._imageNode, "alt", this.imageText);
			}else{
				this._centerNode = this._textNode;
			}
			dojo.style(this._underlayNode, {
				display: "none",
				backgroundColor: this.color
			});
			dojo.style(this._centerNode, "display", "none");
			this.connect(this._underlayNode, "onclick", "_ignore");

			//Last thing to do is move the widgets parent, if any, to the current document body.  
			//Avoids having to deal with parent relative/absolute mess.  Otherwise positioning 
			//tends to go goofy.  
			if(this.domNode.parentNode && this.domNode.parentNode != dojo.body()){
				dojo.body().appendChild(this.domNode);
			}

			//IE 7 has a horrible bug with zoom, so we have to create this node
			//to cross-check later.  Sigh.
			if(dojo.isIE == 7){
				this._ieFixNode = dojo.doc.createElement("div");
				dojo.style(this._ieFixNode, {
					opacity: "0",
					zIndex: "-1000",
					position: "absolute",
					top: "-1000px"
				});
				dojo.body().appendChild(this._ieFixNode);
			}
		}
	},

	show: function(){
		//	summary:
		//		Function to display the blocking overlay and busy/status icon or text.
		if(!this._displayed){
			this._displayed = true;
			this._size();
			this._fadeIn();
		}
	},

	hide: function(){
		//	summary:
		//		Function to hide the blocking overlay and status icon or text.
		if(this._displayed){
			this._size();
			this._fadeOut();
			this._displayed = false;
			if(this._resizeCheck !== null){
				clearInterval(this._resizeCheck);
				this._resizeCheck = null;
			}
		}
	},

	isVisible: function(){
		//	summary:
		//		Helper function so you can test if the widget is already visible or not.
		//	returns:
		//		boolean indicating if the widget is in 'show' state or not.
		return this._displayed; // boolean
	},

	onShow: function(){
		//	summary:
		//		Event that fires when the display of the Standby completes.
	},

	onHide: function(){
		//	summary:
		//		Event that fires when the display of the Standby completes.
	},

	uninitialize: function(){
		//	summary:	
		//		Over-ride to hide the widget, which clears intervals, before cleanup.
		this._displayed = false;
		if(this._resizeCheck){
			clearInterval(this._resizeCheck);
		}
		dojo.style(this._centerNode, "display", "none");
		dojo.style(this._underlayNode, "display", "none");
		if(dojo.isIE == 7){
			dojo.body().removeChild(this._ieFixNode);
			delete this._ieFixNode;
		}
		this.target = null;
		this._imageNode = null;
		this._textNode = null;
        this._centerNode = null;
		this.inherited(arguments);
	},

	_size: function(){
		//	summary:
		//		Internal function that handles resizing the overlay and 
		//		centering of the image on window resizing.
		//	tags:
		//		private
		if(this._displayed){
			var dir = dojo.attr(dojo.body(), "dir");
			if(dir){dir = dir.toLowerCase();}
			var _ie7zoom;
			var scrollers = this._scrollerWidths();

			var target = this.target;

			//Show the image and make sure the zIndex is set high.
			var curStyle = dojo.style(this._centerNode, "display"); 
			dojo.style(this._centerNode, "display", "block");
			var box = dojo.coords(target, true);
			var cntrIndicator = dojo.marginBox(this._centerNode);
			dojo.style(this._centerNode, "display", curStyle);

			//IE has a horrible zoom bug.  So, we have to try and account for 
			//it and fix up the scaling.
			if(this._ieFixNode){
                _ie7zoom = -this._ieFixNode.offsetTop / 1000;
				box.x = Math.floor((box.x + 0.9) / _ie7zoom);
				box.y = Math.floor((box.y + 0.9) / _ie7zoom);
			}

			//Figure out how to zIndex this thing over the target.
			var zi = dojo.style(target, "zIndex");
			var ziUl = zi;
			var ziIn = zi;

			if(this.zIndex === "auto"){
				if(zi != "auto"){
					ziUl = parseInt(ziUl, 10) + 1;
					ziIn = parseInt(ziIn, 10) + 2;
				}
			}else{
				ziUl = parseInt(this.zIndex, 10) + 1;
				ziIn = parseInt(this.zIndex, 10) + 2;
			}

			dojo.style(this._centerNode, "zIndex", ziIn);
			dojo.style(this._underlayNode, "zIndex", ziUl);

			//Address margins as they shift the position..
			var marginLeft = dojo.style(target, "marginLeft");
			if(dojo.isWebKit && marginLeft){
				//Webkit works differently here.  Needs to be doubled.
				//Don't ask me why. :)
				marginLeft = marginLeft*2;
			}

			if(marginLeft){
				box.w = box.w - marginLeft;
			}
 		
			if(!dojo.isWebKit){
				//Webkit and others work differently here.  
				var marginRight = dojo.style(target, "marginRight");
				if(marginRight){
					box.w = box.w - marginRight;
				}
    		}

			var marginTop = dojo.style(target, "marginTop");
			if(marginTop){
				box.h = box.h - marginTop;
			}

			var marginBottom = dojo.style(target, "marginBottom");
			if(marginBottom){
				box.h = box.h - marginBottom;
			}

			var pn = target.parentNode;
			if(pn){
				var obh = box.h;
				var obw = box.w;
				var pnBox = dojo.coords(pn, true);

				//More IE zoom corrections.  Grr.
				if(this._ieFixNode){
					_ie7zoom = -this._ieFixNode.offsetTop / 1000;
					pnBox.x = Math.floor((pnBox.x + 0.9) / _ie7zoom);
					pnBox.y = Math.floor((pnBox.y + 0.9) / _ie7zoom);
				}
				
				//Shift the parent width/height a bit if scollers are present.
				pnBox.w -= pn.scrollHeight > pn.clientHeight && 
					pn.clientHeight > 0 ? scrollers.v: 0;
				pnBox.h -= pn.scrollWidth > pn.clientWidth && 
					pn.clientWidth > 0 ? scrollers.h: 0;

				//RTL requires a bit of massaging in some cases 
				//(and differently depending on browser, ugh!)
				//WebKit and others still need work.
				if(dir === "rtl"){
					if(dojo.isFF == 2 || dojo.isOpera){
						box.x += pn.scrollHeight > pn.clientHeight && 
							pn.clientHeight > 0 ? scrollers.v: 0;
						pnBox.x += pn.scrollHeight > pn.clientHeight && 
							pn.clientHeight > 0 ? scrollers.v: 0;
					}else if(dojo.isIE){
						pnBox.x += pn.scrollHeight > pn.clientHeight && 
							pn.clientHeight > 0 ? scrollers.v: 0;
					}else if(dojo.isWebKit){
						//TODO:  FIX THIS!
					}
				}  
						
				//Figure out if we need to adjust the overlay to fit a viewable 
				//area, then resize it, we saved the original height/width above.
				//This is causing issues on IE.  Argh!
				if(pnBox.w < box.w){
					//Scale down the width if necessary.
					box.w = box.w - pnBox.w;
				}
				if(pnBox.h < box.h){
					//Scale down the width if necessary.
					box.h = box.h - pnBox.h;
				}

				//Look at the y positions and see if we intersect with the
				//viewport borders.  Will have to do computations off it.
				var vpTop = pnBox.y;
				var vpBottom = pnBox.y + pnBox.h;
				var bTop = box.y;
				var bBottom = box.y + obh;
				var vpLeft = pnBox.x;
				var vpRight = pnBox.x + pnBox.w;
				var bLeft = box.x;
				var bRight = box.x + obw;
				var delta;
				//Adjust the height now
				if(bBottom > vpTop && 
				   bTop < vpTop){
					box.y = pnBox.y;
					//intersecting top, need to do some shifting.
					delta = vpTop - bTop;
					var visHeight = obh - delta;
					//If the visible height < viewport height, 
					//We need to shift it.
					if(visHeight < pnBox.h){
						box.h = visHeight;
					}else{
						//Deal with horizontal scrollbars if necessary.
						box.h -= 2*(pn.scrollWidth > pn.clientWidth && 
							pn.clientWidth > 0? scrollers.h: 0);
					}
				}else if(bTop < vpBottom && 
						  bBottom > vpBottom){
					//Intersecting bottom, just figure out how much 
					//overlay to show.
					box.h = vpBottom - bTop;
				}else if(bBottom <= vpTop ||
						  bTop >= vpBottom){
					//Outside view, hide it.
					box.h = 0;
				}

				//adjust width
				if(bRight > vpLeft && 
				   bLeft < vpLeft){
					box.x = pnBox.x;
					//intersecting left, need to do some shifting.
					delta = vpLeft - bLeft;
					var visWidth = obw - delta;
					//If the visible width < viewport width, 
					//We need to shift it.
					if(visWidth < pnBox.w){
						box.w = visWidth;
					}else{
						//Deal with horizontal scrollbars if necessary.
						box.w -= 2*(pn.scrollHeight > pn.clientHeight && 
							pn.clientHeight > 0? scrollers.w:0);
					}
				}else if(bLeft < vpRight && 
						  bRight > vpRight){
					//Intersecting right, just figure out how much 
					//overlay to show.
					box.w = vpRight - bLeft;
				}else if(bRight <= vpLeft ||
						  bLeft >= vpRight){
					//Outside view, hide it.
					box.w = 0;
				}
			}

			if(box.h > 0 && box.w > 0){
				//Set position and size of the blocking div overlay.
				dojo.style(this._underlayNode, {
					display: "block",
					width: box.w + "px",
					height: box.h + "px",
					top: box.y + "px",
					left: box.x + "px"
				});

				var styles = ["borderRadius", "borderTopLeftRadius", 
					"borderTopRightRadius","borderBottomLeftRadius", 
					"borderBottomRightRadius"];
				this._cloneStyles(styles);
				if(!dojo.isIE){
					//Browser specific styles to try and clone if non-IE.
					styles = ["MozBorderRadius", "MozBorderRadiusTopleft", 
						"MozBorderRadiusTopright","MozBorderRadiusBottomleft", 
						"MozBorderRadiusBottomright","WebkitBorderRadius", 
						"WebkitBorderTopLeftRadius", "WebkitBorderTopRightRadius", 
						"WebkitBorderBottomLeftRadius","WebkitBorderBottomRightRadius"
					];
					this._cloneStyles(styles, this);
				}
				var cntrIndicatorTop = (box.h/2) - (cntrIndicator.h/2);
				var cntrIndicatorLeft = (box.w/2) - (cntrIndicator.w/2);
				//Only show the image if there is height and width room.
				if(box.h >= cntrIndicator.h && box.w >= cntrIndicator.w){
					dojo.style(this._centerNode, {
						top: (cntrIndicatorTop + box.y) + "px",
						left: (cntrIndicatorLeft + box.x) + "px",
						display: "block"
					});
				}else{
					dojo.style(this._centerNode, "display", "none");
				}
			}else{
				//Target has no size, display nothing on it!
				dojo.style(this._underlayNode, "display", "none");
				dojo.style(this._centerNode, "display", "none");
			}
			if(this._resizeCheck === null){
				//Set an interval timer that checks the target size and scales as needed.
				//Checking every 10th of a second seems to generate a fairly smooth update.
				var self = this;
				this._resizeCheck = setInterval(function(){self._size();}, 100);
			}
		}
	},

	_cloneStyles: function(list){
		//	summary:
		//		Internal function to clone a set of styles from the target to 
		//		the underlay.
		//	list: Array
		//		An array of style names to clone.
		//
		//	tags:
		//		private
		dojo.forEach(list, function(style){
			dojo.style(this._underlayNode,style,dojo.style(this.target,style));
		}, this);
	},

	_fadeIn: function(){
		//	summary:
		//		Internal function that does the opacity style fade in animation.
		//	tags:
		//		private
		var self = this;
		var underlayNodeAnim = dojo.animateProperty({
			duration: self.duration,
			node: self._underlayNode, 
			properties: {opacity: {start: 0, end: 0.75}}
		});
		var imageAnim = dojo.animateProperty({
			duration: self.duration,
			node: self._centerNode, 
			properties: {opacity: {start: 0, end: 1}},
			onEnd: function(){
				self.onShow();
			}
		});
		var anim = dojo.fx.combine([underlayNodeAnim,imageAnim]);
		anim.play();
	},

	_fadeOut: function(){
		//	summary:
		//		Internal function that does the opacity style fade out animation.
		//	tags:
		//		private
		var self = this;
		var underlayNodeAnim = dojo.animateProperty({
			duration: self.duration,
			node: self._underlayNode, 
			properties: {opacity: {start: 0.75, end: 0}},
			onEnd: function(){
				dojo.style(self._underlayNode, "display", "none");
			}
		});
		var imageAnim = dojo.animateProperty({
			duration: self.duration,
			node: self._centerNode, 
			properties: {opacity: {start: 1, end: 0}},
			onEnd: function(){
				dojo.style(self._centerNode, "display", "none");
				self.onHide();
			}
		});
		var anim = dojo.fx.combine([underlayNodeAnim,imageAnim]);
		anim.play();
	},

	_ignore: function(event){
		//	summary:
		//		Function to ignore events that occur on the overlay.
		//	event: Event
		//		The event to halt
		//	tags:
		//		private
		if(event){
			dojo.stopEvent(event);
		}
	},

	_scrollerWidths: function(){
		//	summary:
		//		This function will calculate the size of the vertical and
		//		horizontaol scrollbars.
		//	returns:
		//		Object of form: {v: Number, h: Number} where v is vertical scrollbar width
		//		and h is horizontal scrollbar width.
		//	tags:
		//		private
		var div = dojo.doc.createElement("div");
		dojo.style(div, {
			position: "absolute",
			opacity: 0,
			overflow: "hidden",
			width: "50px",
			height: "50px",
			zIndex: "-100",
			top: "-200px",
			left: "-200px",
			padding: "0px",
			margin: "0px"
		});
		var iDiv = dojo.doc.createElement("div");
		dojo.style(iDiv, {
			width: "200px",
			height: "10px"
		});
		div.appendChild(iDiv);
		dojo.body().appendChild(div);

		//Figure out content size before and after 
		//scrollbars are there, then just subtract to 
		//get width.
		var b = dojo.contentBox(div);
		dojo.style(div, "overflow", "scroll");
		var a = dojo.contentBox(div);
		dojo.body().removeChild(div);
		return { v: b.w - a.w, h: b.h - a.h };
	},

	/* The following are functions that tie into _Widget.attr() */

	_setTextAttr: function(text){
		//	summary:
		//		Function to allow widget.attr to set the text displayed in center 
		//		if using text display.
		//	text: String
		//		The text to set.
		this._textNode.innerHTML = text;
		this.text = text;
	},

	_setColorAttr: function(c){
		//	summary:
		//		Function to allow widget.attr to set the color used for the translucent
		//		div overlay.
		//	c: String
		//		The color to set the background underlay to in #XXXXXX format..
		dojo.style(this._underlayNode, "backgroundColor", c);
		this.color = c;
	},

	_setImageTextAttr: function(text){
		//	summary:
		//		Function to allow widget.attr to set the ALT text text displayed for
		//		the image (if using image center display).
		//	text: String
		//		The text to set.
		dojo.attr(this._imageNode, "alt", text);
		this.imageText = text;
	},

	_setImageAttr: function(url){
		//	summary:
		//		Function to allow widget.attr to set the url source for the center image
		//	text: String
		//		The url to set for the image.
		dojo.attr(this._imageNode, "src", url);
		this.image = url;
	},

	_setCenterIndicatorAttr: function(indicator){
		//	summary:
		//		Function to allow widget.attr to set the node used for the center indicator,
		//		either the image or the text.
		//	indicator: String
		//		The indicator to use, either 'image' or 'text'.
		this.centerIndicator = indicator;
		if(indicator === "image"){
			this._centerNode = this._imageNode;
			dojo.style(this._textNode, "display", "none");
		}else{
			this._centerNode = this._textNode;
			dojo.style(this._imageNode, "display", "none");
		}
	}
});	

}
