/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.fx.style"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.fx.style"] = true;
dojo.provide("dojox.fx.style");
dojo.experimental("dojox.fx.style"); 
//
// summary: 
//		dojox.fx CSS Class Animations: 
//
// description: 
//		a set of functions to animate properties based on
//		normalized CSS class definitions.
//
//	provides: addClass, removeClass, and toggleClass
//	
dojo.require("dojo.fx"); 

(function(){
		
	var d = dojo;

	var _getStyleSnapshot = function(/* Object */cache){
		// summary: 
		//		uses a dojo.getComputedStyle(node) cache reference and
		// 		iterates through the 'documented/supported animate-able'
		// 		properties. 
		//
		// returns:  Array
		//		an array of raw, calculcated values (no keys), to be normalized/compared
		//		elsewhere	
		return d.map(dojox.fx._allowedProperties, function(style){
			return cache[style]; // String
		}); // Array
	};

	var _getCalculatedStyleChanges = function(node, cssClass, addClass){
		// summary: Calculate the difference in style properties between two states
		// description:
		//	calculate and normalize(?) the differences between two states
		//	of a node (args.node) by quickly adding or removing a class, and
		//	iterateing over the results of dojox.fx._getStyleSnapshot()
		//
		// addClass: 
		// 	true to calculate what adding a class would do, 
		// 	false to calculate what removing the class would do

		node = d.byId(node);
		var	cs = d.getComputedStyle(node);

		// take our snapShots
		var _before = _getStyleSnapshot(cs);
		d[(addClass ? "addClass" : "removeClass")](node, cssClass); 
		var _after = _getStyleSnapshot(cs);
		d[(addClass ? "removeClass" : "addClass")](node, cssClass); 

		var calculated = {}, i = 0;
		d.forEach(dojox.fx._allowedProperties, function(prop){
			if(_before[i] != _after[i]){
				// FIXME: the static units: px is not good, either. need to parse unit from computed style?
				calculated[prop] = parseInt(_after[i]) /* start: parseInt(_before[i]), units: 'px' */ ; 
			} 
			i++;
		});
		return calculated; 
	};

	d.mixin(dojox.fx,{

		addClass: function(node, cssClass, args){
			// summary: 
			//		Animate the effects of adding a class to a node
			//
			// description:
			//		Creates an animation that will animate
			//		the properties of a node to the properties
			//		defined in a standard CSS .class definition.
			//		(calculating the differences itself)
			//
			// node: String|DomNode
			//		A String ID or DomNode referce to animate
			//
			// cssClass: String
			//		The CSS class name to add to the node
			//
			// args: Object?
			//		Additional optional `dojo.animateProperty` arguments, such as 
			//		duration, easing and so on.
			//	
			// example:
			//	| 
			//	|	.bar { line-height: 12px; }
			//	|	.foo { line-height: 40px; }
			//	|	<div class="bar" id="test">
			//	|	Multi<br>line<br>text
			//	|	</div> 
			//	|
			//	|	// animate to line-height:40px
			//	|	dojo.fx.addClass("test", "foo").play();
			// 
			node = d.byId(node); 

			var pushClass = (function(n){
				// summary: onEnd we want to add the class to the node 
				//	(as dojo.addClass naturally would) in case our 
				//	class parsing misses anything the browser would 
				// 	otherwise interpret. this may cause some flicker,
				//	and will only apply the class so children can inherit 
				//	after the animation is done (potentially more flicker)
				return function(){
					d.addClass(n, cssClass); 
					n.style.cssText = _beforeStyle; 
				}
			})(node);

			// _getCalculatedStleChanges is the core of our style/class animations
			var mixedProperties = _getCalculatedStyleChanges(node, cssClass, true);
			var _beforeStyle = node.style.cssText; 
			var _anim = d.animateProperty(d.mixin({
				node: node,
				properties: mixedProperties
			}, args));
			d.connect(_anim, "onEnd", _anim, pushClass); 
			return _anim; // dojo.Animation
		},
	
		removeClass: function(node, cssClass, args){
			// summary: Animate the effects of removing a class from a node
			// description:
			//	Creates an animation that will animate the properties of a 
			// 	node (args.node) to the properties calculated after removing 
			//	a standard CSS className from a that node.
			//	
			//	calls dojo.removeClass(args.cssClass) onEnd of animation		
			//
			//	standard dojo.Animation object rules apply. 
			//
			// example:
			// |	// animate the removal of "foo" from a node with id="bar"
			// |	dojox.fx.removeClass("bar", "foo").play()

			node = d.byId(node); 

			var pullClass = (function(n){
				// summary: onEnd we want to remove the class from the node 
				//	(as dojo.removeClass naturally would) in case our class
				//	parsing misses anything the browser would otherwise 
				//	interpret. this may cause some flicker, and will only 
				//	apply the class so children can inherit after the
				//	animation is done (potentially more flicker)
				//
				return function(){
					d.removeClass(n, cssClass); 
					n.style.cssText = _beforeStyle; 
				}
			})(node);

			var mixedProperties = _getCalculatedStyleChanges(node, cssClass);
			var _beforeStyle = node.style.cssText; 
			var _anim = d.animateProperty(d.mixin({
				node: node,
				properties: mixedProperties
			}, args));
			d.connect(_anim, "onEnd", _anim, pullClass); 
			return _anim; // dojo.Animation
		},

		toggleClass: function(node, cssClass, condition, args){
			// summary:
			//		Animate the effects of Toggling a class on a Node
			//
			// description:
			//		creates an animation that will animate the effect of 
			//		toggling a class on or off of a node.
			//		Adds a class to node if not present, or removes if present.
			//		Pass a boolean condition if you want to explicitly add or remove.
			//
			// node: String|DomNode
			//		The domNode (or string of the id) to toggle
			// cssClass: String
			//		String of the classname to add to the node	
			// condition: Boolean?
			//		If passed, true means to add the class, false means to remove.
			// args: Object?
			//		Additional `dojo.Animation` args to pass along.
			//
			// example:
			// |	// add the class "sampleClass" to a node id="theNode"
			// |	dojox.fx.toggleClass("theNode","sampleClass",true).play();
			// example:
			// |	// toggle the class "sampleClass" on the node id="theNode"
			// |	dojox.fx.toggleClass("theNode","sampleClass").play();

			if(typeof condition == "undefined"){
				condition = !d.hasClass(node, cssClass);
			}
			return dojox.fx[(condition ? "addClass" : "removeClass")](node, cssClass, args); // dojo.Animation
		},
	
		_allowedProperties: [
			// summary: Our pseudo map of properties we will check for.
			// description:
			//	it should be much more intuitive. a way to normalize and
			//	"predict" intent, or even something more clever ... 
			//	open to suggestions.

			// no-brainers:
			"width",
			"height",
			// only if position = absolute || relative?
			"left", "top", // "right", "bottom", 
			// these need to be filtered through dojo.colors?
			// "background", // normalize to:
			/* "backgroundImage", */
			// "backgroundPosition", // FIXME: to be effective, this needs "#px #px"?
			"backgroundColor",

			"color",

			// "border", 
			//"borderBottomColor",
			"borderBottomWidth",
			//"borderTopColor",
			"borderTopWidth",
			//"borderLeftColor",
			"borderLeftWidth",
			//"borderRightColor",
			"borderRightWidth",

			// "padding", // normalize to: 
			"paddingLeft", "paddingRight", "paddingTop", "paddingBottom",
			// "margin", // normalize to:
			"marginLeft", "marginTop", "marginRight", "marginBottom",

			// unit import/delicate?:
			"lineHeight",
			"letterSpacing",
			"fontSize"
		]
	
	});

})();

}
