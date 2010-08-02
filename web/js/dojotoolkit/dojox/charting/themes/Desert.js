/*
	Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.charting.themes.Desert"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.charting.themes.Desert"] = true;
dojo.provide("dojox.charting.themes.Desert");
dojo.require("dojox.charting.Theme");

(function(){
	//	notes: colors generated by moving in 30 degree increments around the hue circle,
	//		at 90% saturation, using a B value of 75 (HSB model).
	var dxc=dojox.charting;
	dxc.themes.Desert=new dxc.Theme({
		colors: [
			"#ffebd5",
			"#806544",
			"#fdc888",
			"#80766b",
			"#cda26e"
		]
	});
})();

}
