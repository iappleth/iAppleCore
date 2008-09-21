/*
	Copyright (c) 2004-2008, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.fx.easing"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.fx.easing"] = true;
dojo.provide("dojox.fx.easing");
dojo.deprecated("dojox.fx.easing","Upgraded to Core, use dojo.fx.easing instead","2.0");
dojo.require("dojo.fx.easing");
/*=====
	dojo.mixin(dojox.fx,{
		// easing: Object
		//		An Alias to `dojo.fx.easing`
		easing: dojo._DefaultEasing
	})
=====*/
dojox.fx.easing = dojo.fx.easing;

}
