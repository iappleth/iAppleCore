/*
	Copyright (c) 2004-2008, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/

/*
	This is a compiled version of Dojo, built for deployment and not for
	development. To get an editable version, please visit:

		http://dojotoolkit.org

	for documentation and information on getting the source.
*/

;(function(){

	/*
	dojo, dijit, and dojox must always be the first three, and in that order.
	djConfig.scopeMap = [
		["dojo", "fojo"],
		["dijit", "fijit"],
		["dojox", "fojox"]
	
	]
	*/

	/**Build will replace this comment with a scoped djConfig **/

	//The null below can be relaced by a build-time value used instead of djConfig.scopeMap.
	var sMap = null;

	//See if new scopes need to be defined.
	if((sMap || (typeof djConfig != "undefined" && djConfig.scopeMap)) && (typeof window != "undefined")){
		var scopeDef = "", scopePrefix = "", scopeSuffix = "", scopeMap = {}, scopeMapRev = {};
		sMap = sMap || djConfig.scopeMap;
		for(var i = 0; i < sMap.length; i++){
			//Make local variables, then global variables that use the locals.
			var newScope = sMap[i];
			scopeDef += "var " + newScope[0] + " = {}; " + newScope[1] + " = " + newScope[0] + ";" + newScope[1] + "._scopeName = '" + newScope[1] + "';";
			scopePrefix += (i == 0 ? "" : ",") + newScope[0];
			scopeSuffix += (i == 0 ? "" : ",") + newScope[1];
			scopeMap[newScope[0]] = newScope[1];
			scopeMapRev[newScope[1]] = newScope[0];
		}

		eval(scopeDef + "dojo._scopeArgs = [" + scopeSuffix + "];");

		dojo._scopePrefixArgs = scopePrefix;
		dojo._scopePrefix = "(function(" + scopePrefix + "){";
		dojo._scopeSuffix = "})(" + scopeSuffix + ")";
		dojo._scopeMap = scopeMap;
		dojo._scopeMapRev = scopeMapRev;
	}

/*=====
// note:
//		'djConfig' does not exist under 'dojo.*' so that it can be set before the
//		'dojo' variable exists.
// note:
//		Setting any of these variables *after* the library has loaded does
//		nothing at all.

djConfig = {
	// summary:
	//		Application code can set the global 'djConfig' prior to loading
	//		the library to override certain global settings for how dojo works.
	//
	// isDebug: Boolean
	//		Defaults to `false`. If set to `true`, ensures that Dojo provides
	//		extended debugging feedback via Firebug. If Firebug is not available
	//		on your platform, setting `isDebug` to `true` will force Dojo to
	//		pull in (and display) the version of Firebug Lite which is
	//		integrated into the Dojo distribution, thereby always providing a
	//		debugging/logging console when `isDebug` is enabled. Note that
	//		Firebug's `console.*` methods are ALWAYS defined by Dojo. If
	//		`isDebug` is false and you are on a platform without Firebug, these
	//		methods will be defined as no-ops.
	isDebug: false,
	// debugAtAllCosts: Boolean
	//		Defaults to `false`. If set to `true`, this triggers an alternate
	//		mode of the package system in which dependencies are detected and
	//		only then are resources evaluated in dependency order via
	//		`<script>` tag inclusion. This may double-request resources and
	//		cause problems with scripts which expect `dojo.require()` to
	//		preform synchronously. `debugAtAllCosts` can be an invaluable
	//		debugging aid, but when using it, ensure that all code which
	//		depends on Dojo modules is wrapped in `dojo.addOnLoad()` handlers.
	//		Due to the somewhat unpredictable side-effects of using
	//		`debugAtAllCosts`, it is strongly recommended that you enable this
	//		flag as a last resort. `debugAtAllCosts` has no effect when loading
	//		resources across domains. For usage information, see the
	//		[Dojo Book](http://dojotoolkit.org/book/book-dojo/part-4-meta-dojo-making-your-dojo-code-run-faster-and-better/debugging-facilities/deb)
	debugAtAllCosts: false,
	// locale: String
	//		The locale to assume for loading localized resources in this page,
	//		specified according to [RFC 3066](http://www.ietf.org/rfc/rfc3066.txt).
	//		Must be specified entirely in lowercase, e.g. `en-us` and `zh-cn`.
	//		See the documentation for `dojo.i18n` and `dojo.requireLocalization`
	//		for details on loading localized resources. If no locale is specified,
	//		Dojo assumes the locale of the user agent, according to `navigator.userLanguage`
	//		or `navigator.language` properties.
	locale: undefined,
	// extraLocale: Array
	//		No default value. Specifies additional locales whose
	//		resources should also be loaded alongside the default locale when
	//		calls to `dojo.requireLocalization()` are processed.
	extraLocale: undefined,
	// baseUrl: String
	//		The directory in which `dojo.js` is located. Under normal
	//		conditions, Dojo auto-detects the correct location from which it
	//		was loaded. You may need to manually configure `baseUrl` in cases
	//		where you have renamed `dojo.js` or in which `<base>` tags confuse
	//		some browsers (e.g. IE 6). The variable `dojo.baseUrl` is assigned
	//		either the value of `djConfig.baseUrl` if one is provided or the
	//		auto-detected root if not. Other modules are located relative to
	//		this path. The path should end in a slash.
	baseUrl: undefined,
	// modulePaths: Object
	//		A map of module names to paths relative to `dojo.baseUrl`. The
	//		key/value pairs correspond directly to the arguments which
	//		`dojo.registerModulePath` accepts. Specifiying
	//		`djConfig.modulePaths = { "foo": "../../bar" }` is the equivalent
	//		of calling `dojo.registerModulePath("foo", "../../bar");`. Multiple
	//		modules may be configured via `djConfig.modulePaths`.
	modulePaths: {},
	// afterOnLoad: Boolean 
	//		Indicates Dojo was added to the page after the page load. In this case
	//		Dojo will not wait for the page DOMContentLoad/load events and fire
	//		its dojo.addOnLoad callbacks after making sure all outstanding
	//		dojo.required modules have loaded.
	afterOnLoad: false,
	// addOnLoad: Function or Array
	//		Adds a callback via dojo.addOnLoad. Useful when Dojo is added after
	//		the page loads and djConfig.afterOnLoad is true. Supports the same
	//		arguments as dojo.addOnLoad. When using a function reference, use
	//		`djConfig.addOnLoad = function(){};`. For object with function name use
	//		`djConfig.addOnLoad = [myObject, "functionName"];` and for object with
	//		function reference use
	//		`djConfig.addOnLoad = [myObject, function(){}];`
	addOnLoad: null,
	// require: Array
	//		An array of module names to be loaded immediately after dojo.js has been included
	//		in a page. 
	require: [],
	// defaultDuration: Array
	//		Default duration, in milliseconds, for wipe and fade animations within dijits.
	//		Assigned to dijit.defaultDuration.
	defaultDuration: 200,
	// dojoBlankHtmlUrl: String
	//		Used by some modules to configure an empty iframe. Used by dojo.io.iframe and
	//		dojo.back, and dijit popup support in IE where an iframe is needed to make sure native
	//		controls do not bleed through the popups. Normally this configuration variable 
	//		does not need to be set, except when using cross-domain/CDN Dojo builds.
	//		Save dojo/resources/blank.html to your domain and set `djConfig.dojoBlankHtmlUrl` 
	//		to the path on your domain your copy of blank.html.
	dojoBlankHtmlUrl: undefined
	
}
=====*/

(function(){
	// firebug stubs

	if(typeof this["loadFirebugConsole"] == "function"){
		// for Firebug 1.2
		this["loadFirebugConsole"]();
	}else{
		this.console = this.console || {};

		//	Be careful to leave 'log' always at the end
		var cn = [
			"assert", "count", "debug", "dir", "dirxml", "error", "group",
			"groupEnd", "info", "profile", "profileEnd", "time", "timeEnd",
			"trace", "warn", "log" 
		];
		var i=0, tn;
		while((tn=cn[i++])){
			if(!console[tn]){
				(function(){
					var tcn = tn+"";
					console[tcn] = ('log' in console) ? function(){ 
						var a = Array.apply({}, arguments);
						a.unshift(tcn+":");
						console["log"](a.join(" "));
					} : function(){}
				})();
			}
		}
	}

	//TODOC:  HOW TO DOC THIS?
	// dojo is the root variable of (almost all) our public symbols -- make sure it is defined.
	if(typeof dojo == "undefined"){
		this.dojo = {
			_scopeName: "dojo",
			_scopePrefix: "",
			_scopePrefixArgs: "",
			_scopeSuffix: "",
			_scopeMap: {},
			_scopeMapRev: {}
		};
	}

	var d = dojo;

	//Need placeholders for dijit and dojox for scoping code.
	if(typeof dijit == "undefined"){
		this.dijit = {_scopeName: "dijit"};
	}
	if(typeof dojox == "undefined"){
		this.dojox = {_scopeName: "dojox"};
	}
	
	if(!d._scopeArgs){
		d._scopeArgs = [dojo, dijit, dojox];
	}

/*=====
dojo.global = {
	//	summary:
	//		Alias for the global scope
	//		(e.g. the window object in a browser).
	//	description:
	//		Refer to 'dojo.global' rather than referring to window to ensure your
	//		code runs correctly in contexts other than web browsers (e.g. Rhino on a server).
}
=====*/
	d.global = this;

	d.config =/*===== djConfig = =====*/{
		isDebug: false,
		debugAtAllCosts: false
	};

	if(typeof djConfig != "undefined"){
		for(var opt in djConfig){
			d.config[opt] = djConfig[opt];
		}
	}

/*=====
	// Override locale setting, if specified
	dojo.locale = {
		// summary: the locale as defined by Dojo (read-only)
	};
=====*/
	dojo.locale = d.config.locale;
	
	var rev = "$Rev: 15812 $".match(/\d+/);

	dojo.version = {
		// summary: 
		//		version number of dojo
		//	major: Integer
		//		Major version. If total version is "1.2.0beta1", will be 1
		//	minor: Integer
		//		Minor version. If total version is "1.2.0beta1", will be 2
		//	patch: Integer
		//		Patch version. If total version is "1.2.0beta1", will be 0
		//	flag: String
		//		Descriptor flag. If total version is "1.2.0beta1", will be "beta1"
		//	revision: Number
		//		The SVN rev from which dojo was pulled
		major: 0, minor: 0, patch: 0, flag: "dev",
		revision: rev ? +rev[0] : 999999, //FIXME: use NaN?
		toString: function(){
			with(d.version){
				return major + "." + minor + "." + patch + flag + " (" + revision + ")";	// String
			}
		}
	}

	// Register with the OpenAjax hub
	if(typeof OpenAjax != "undefined"){
		OpenAjax.hub.registerLibrary(dojo._scopeName, "http://dojotoolkit.org", d.version.toString());
	}

	dojo._mixin = function(/*Object*/ obj, /*Object*/ props){
		// summary:
		//		Adds all properties and methods of props to obj. This addition
		//		is "prototype extension safe", so that instances of objects
		//		will not pass along prototype defaults.
		var tobj = {};
		for(var x in props){
			// the "tobj" condition avoid copying properties in "props"
			// inherited from Object.prototype.  For example, if obj has a custom
			// toString() method, don't overwrite it with the toString() method
			// that props inherited from Object.prototype
			if(tobj[x] === undefined || tobj[x] != props[x]){
				obj[x] = props[x];
			}
		}
		// IE doesn't recognize custom toStrings in for..in
		if(d.isIE && props){
			var p = props.toString;
			if(typeof p == "function" && p != obj.toString && p != tobj.toString &&
				p != "\nfunction toString() {\n    [native code]\n}\n"){
					obj.toString = props.toString;
			}
		}
		return obj; // Object
	}

	dojo.mixin = function(/*Object*/obj, /*Object...*/props){
		// summary:	
		//		Adds all properties and methods of props to obj and returns the
		//		(now modified) obj.
		//	description:
		//		`dojo.mixin` can mix multiple source objects into a
		//		destionation object which is then returned. Unlike regular
		//		`for...in` iteration, `dojo.mixin` is also smart about avoiding
		//		extensions which other toolkits may unwisely add to the root
		//		object prototype
		//	obj:
		//		The object to mix properties into. Also the return value.
		//	props:
		//		One or more objects whose values are successively copied into
		//		obj. If more than one of these objects contain the same value,
		//		the one specified last in the function call will "win".
		//	example:
		//		make a shallow copy of an object
		//	|	var copy = dojo.mixin({}, source);
		//	example:
		//		many class constructors often take an object which specifies
		//		values to be configured on the object. In this case, it is
		//		often simplest to call `dojo.mixin` on the `this` object:
		//	|	dojo.declare("acme.Base", null, {
		//	|		constructor: function(properties){
		//	|			// property configuration:
		//	|			dojo.mixin(this, properties);
		//	|	
		//	|			console.debug(this.quip);
		//	|			//  ...
		//	|		},
		//	|		quip: "I wasn't born yesterday, you know - I've seen movies.",
		//	|		// ...
		//	|	});
		//	|
		//	|	// create an instance of the class and configure it
		//	|	var b = new acme.Base({quip: "That's what it does!" });
		//	example:
		//		copy in properties from multiple objects
		//	|	var flattened = dojo.mixin(
		//	|		{
		//	|			name: "Frylock",
		//	|			braces: true
		//	|		},
		//	|		{
		//	|			name: "Carl Brutanananadilewski"
		//	|		}
		//	|	);
		//	|	
		//	|	// will print "Carl Brutanananadilewski"
		//	|	console.debug(flattened.name);
		//	|	// will print "true"
		//	|	console.debug(flattened.braces);
		for(var i=1, l=arguments.length; i<l; i++){
			d._mixin(obj, arguments[i]);
		}
		return obj; // Object
	}

	dojo._getProp = function(/*Array*/parts, /*Boolean*/create, /*Object*/context){
		var obj=context || d.global;
		for(var i=0, p; obj && (p=parts[i]); i++){
			if(i == 0 && this._scopeMap[p]){
				p = this._scopeMap[p];
			}
			obj = (p in obj ? obj[p] : (create ? obj[p]={} : undefined));
		}
		return obj; // mixed
	}

	dojo.setObject = function(/*String*/name, /*Object*/value, /*Object?*/context){
		// summary: 
		//		Set a property from a dot-separated string, such as "A.B.C"
		//	description: 
		//		Useful for longer api chains where you have to test each object in
		//		the chain, or when you have an object reference in string format.
		//		Objects are created as needed along `path`. Returns the passed
		//		value if setting is successful or `undefined` if not.
		//	name: 	
		//		Path to a property, in the form "A.B.C".
		//	context:
		//		Optional. Object to use as root of path. Defaults to
		//		`dojo.global`.
		//	example:
		//		set the value of `foo.bar.baz`, regardless of whether
		//		intermediate objects already exist:
		//	|	dojo.setObject("foo.bar.baz", value);
		//	example:
		//		without `dojo.setObject`, we often see code like this:
		//	|	// ensure that intermediate objects are available
		//	|	if(!obj["parent"]){ obj.parent = {}; }
		//	|	if(!obj.parent["child"]){ obj.parent.child= {}; }
		//	|	// now we can safely set the property
		//	|	obj.parent.child.prop = "some value";
		//		wheras with `dojo.setObject`, we can shorten that to:
		//	|	dojo.setObject("parent.child.prop", "some value", obj);
		var parts=name.split("."), p=parts.pop(), obj=d._getProp(parts, true, context);
		return obj && p ? (obj[p]=value) : undefined; // Object
	}

	dojo.getObject = function(/*String*/name, /*Boolean?*/create, /*Object?*/context){
		// summary: 
		//		Get a property from a dot-separated string, such as "A.B.C"
		//	description: 
		//		Useful for longer api chains where you have to test each object in
		//		the chain, or when you have an object reference in string format.
		//	name: 	
		//		Path to an property, in the form "A.B.C".
		//	create: 
		//		Optional. Defaults to `false`. If `true`, Objects will be
		//		created at any point along the 'path' that is undefined.
		//	context:
		//		Optional. Object to use as root of path. Defaults to
		//		'dojo.global'. Null may be passed.
		return d._getProp(name.split("."), create, context); // Object
	}

	dojo.exists = function(/*String*/name, /*Object?*/obj){
		//	summary: 
		//		determine if an object supports a given method
		//	description: 
		//		useful for longer api chains where you have to test each object in
		//		the chain
		//	name: 	
		//		Path to an object, in the form "A.B.C".
		//	obj:
		//		Object to use as root of path. Defaults to
		//		'dojo.global'. Null may be passed.
		//	example:
		//	|	// define an object
		//	|	var foo = {
		//	|		bar: { }
		//	|	};
		//	|
		//	|	// search the global scope
		//	|	dojo.exists("foo.bar"); // true
		//	|	dojo.exists("foo.bar.baz"); // false
		//	|
		//	|	// search from a particular scope
		//	|	dojo.exists("bar", foo); // true
		//	|	dojo.exists("bar.baz", foo); // false
		return !!d.getObject(name, false, obj); // Boolean
	}


	dojo["eval"] = function(/*String*/ scriptFragment){
		//	summary: 
		//		Perform an evaluation in the global scope. Use this rather than
		//		calling 'eval()' directly.
		//	description: 
		//		Placed in a separate function to minimize size of trapped
		//		exceptions. Calling eval() directly from some other scope may
		//		complicate tracebacks on some platforms.
		//	returns:
		//		The result of the evaluation. Often `undefined`


		// note:
		//	 - JSC eval() takes an optional second argument which can be 'unsafe'.
		//	 - Mozilla/SpiderMonkey eval() takes an optional second argument which is the
		//  	 scope object for new symbols.

		// FIXME: investigate Joseph Smarr's technique for IE:
		//		http://josephsmarr.com/2007/01/31/fixing-eval-to-use-global-scope-in-ie/
		//	see also:
		// 		http://trac.dojotoolkit.org/ticket/744
		return d.global.eval ? d.global.eval(scriptFragment) : eval(scriptFragment); 	// Object
	}

	/*=====
		dojo.deprecated = function(behaviour, extra, removal){
			//	summary: 
			//		Log a debug message to indicate that a behavior has been
			//		deprecated.
			//	behaviour: String
			//		The API or behavior being deprecated. Usually in the form
			//		of "myApp.someFunction()".
			//	extra: String?
			//		Text to append to the message. Often provides advice on a
			//		new function or facility to achieve the same goal during
			//		the deprecation period.
			//	removal: String?
			//		Text to indicate when in the future the behavior will be
			//		removed. Usually a version number.
			//	example:
			//	|	dojo.deprecated("myApp.getTemp()", "use myApp.getLocaleTemp() instead", "1.0");
		}

		dojo.experimental = function(moduleName, extra){
			//	summary: Marks code as experimental.
			//	description: 
			//	 	This can be used to mark a function, file, or module as
			//	 	experimental.  Experimental code is not ready to be used, and the
			//	 	APIs are subject to change without notice.  Experimental code may be
			//	 	completed deleted without going through the normal deprecation
			//	 	process.
			//	moduleName: String
			//	 	The name of a module, or the name of a module file or a specific
			//	 	function
			//	extra: String?
			//	 	some additional message for the user
			//	example:
			//	|	dojo.experimental("dojo.data.Result");
			//	example:
			//	|	dojo.experimental("dojo.weather.toKelvin()", "PENDING approval from NOAA");
		}
	=====*/

	//Real functions declared in dojo._firebug.firebug.
	d.deprecated = d.experimental = function(){};

})();
// vim:ai:ts=4:noet

/*
 * loader.js - A bootstrap module.  Runs before the hostenv_*.js file. Contains
 * all of the package loading methods.
 */

(function(){
	var d = dojo;

	d.mixin(d, {
		_loadedModules: {},
		_inFlightCount: 0,
		_hasResource: {},

		_modulePrefixes: {
			dojo: 	{	name: "dojo", value: "." },
			// dojox: 	{	name: "dojox", value: "../dojox" },
			// dijit: 	{	name: "dijit", value: "../dijit" },
			doh: 	{	name: "doh", value: "../util/doh" },
			tests: 	{	name: "tests", value: "tests" }
		},

		_moduleHasPrefix: function(/*String*/module){
			// summary: checks to see if module has been established
			var mp = this._modulePrefixes;
			return !!(mp[module] && mp[module].value); // Boolean
		},

		_getModulePrefix: function(/*String*/module){
			// summary: gets the prefix associated with module
			var mp = this._modulePrefixes;
			if(this._moduleHasPrefix(module)){
				return mp[module].value; // String
			}
			return module; // String
		},

		_loadedUrls: [],

		//WARNING: 
		//		This variable is referenced by packages outside of bootstrap:
		//		FloatingPane.js and undo/browser.js
		_postLoad: false,
		
		//Egad! Lots of test files push on this directly instead of using dojo.addOnLoad.
		_loaders: [],
		_unloaders: [],
		_loadNotifying: false
	});


		dojo._loadPath = function(/*String*/relpath, /*String?*/module, /*Function?*/cb){
		// 	summary:
		//		Load a Javascript module given a relative path
		//
		//	description:
		//		Loads and interprets the script located at relpath, which is
		//		relative to the script root directory.  If the script is found but
		//		its interpretation causes a runtime exception, that exception is
		//		not caught by us, so the caller will see it.  We return a true
		//		value if and only if the script is found.
		//
		// relpath: 
		//		A relative path to a script (no leading '/', and typically ending
		//		in '.js').
		// module: 
		//		A module whose existance to check for after loading a path.  Can be
		//		used to determine success or failure of the load.
		// cb: 
		//		a callback function to pass the result of evaluating the script

		var uri = ((relpath.charAt(0) == '/' || relpath.match(/^\w+:/)) ? "" : this.baseUrl) + relpath;
		try{
			return !module ? this._loadUri(uri, cb) : this._loadUriAndCheck(uri, module, cb); // Boolean
		}catch(e){
			console.error(e);
			return false; // Boolean
		}
	}

	dojo._loadUri = function(/*String*/uri, /*Function?*/cb){
		//	summary:
		//		Loads JavaScript from a URI
		//	description:
		//		Reads the contents of the URI, and evaluates the contents.  This is
		//		used to load modules as well as resource bundles. Returns true if
		//		it succeeded. Returns false if the URI reading failed.  Throws if
		//		the evaluation throws.
		//	uri: a uri which points at the script to be loaded
		//	cb: 
		//		a callback function to process the result of evaluating the script
		//		as an expression, typically used by the resource bundle loader to
		//		load JSON-style resources

		if(this._loadedUrls[uri]){
			return true; // Boolean
		}
		var contents = this._getText(uri, true);
		if(!contents){ return false; } // Boolean
		this._loadedUrls[uri] = true;
		this._loadedUrls.push(uri);
		if(cb){
			contents = '('+contents+')';
		}else{
			//Only do the scoping if no callback. If a callback is specified,
			//it is most likely the i18n bundle stuff.
			contents = this._scopePrefix + contents + this._scopeSuffix;
		}
		if(d.isMoz){ contents += "\r\n//@ sourceURL=" + uri; } // debugging assist for Firebug
		var value = d["eval"](contents);
		if(cb){ cb(value); }
		return true; // Boolean
	}
	
	// FIXME: probably need to add logging to this method
	dojo._loadUriAndCheck = function(/*String*/uri, /*String*/moduleName, /*Function?*/cb){
		// summary: calls loadUri then findModule and returns true if both succeed
		var ok = false;
		try{
			ok = this._loadUri(uri, cb);
		}catch(e){
			console.error("failed loading " + uri + " with error: " + e);
		}
		return !!(ok && this._loadedModules[moduleName]); // Boolean
	}

	dojo.loaded = function(){
		// summary:
		//		signal fired when initial environment and package loading is
		//		complete. You may use dojo.addOnLoad() or dojo.connect() to
		//		this method in order to handle initialization tasks that
		//		require the environment to be initialized. In a browser host,
		//		declarative widgets will be constructed when this function
		//		finishes runing.
		this._loadNotifying = true;
		this._postLoad = true;
		var mll = d._loaders;

		//Clear listeners so new ones can be added
		//For other xdomain package loads after the initial load.
		this._loaders = [];

		for(var x = 0; x < mll.length; x++){
			mll[x]();
		}

		this._loadNotifying = false;
		
		//Make sure nothing else got added to the onload queue
		//after this first run. If something did, and we are not waiting for any
		//more inflight resources, run again.
		if(d._postLoad && d._inFlightCount == 0 && mll.length){
			d._callLoaded();
		}
	}

	dojo.unloaded = function(){
		// summary:
		//		signal fired by impending environment destruction. You may use
		//		dojo.addOnUnload() or dojo.connect() to this method to perform
		//		page/application cleanup methods. See dojo.addOnUnload for more info.
		var mll = this._unloaders;
		while(mll.length){
			(mll.pop())();
		}
	}

	d._onto = function(arr, obj, fn){
		if(!fn){
			arr.push(obj);
		}else if(fn){
			var func = (typeof fn == "string") ? obj[fn] : fn;
			arr.push(function(){ func.call(obj); });
		}
	}

	dojo.addOnLoad = function(/*Object?*/obj, /*String|Function*/functionName){
		// summary:
		//		Registers a function to be triggered after the DOM has finished
		//		loading and widgets declared in markup have been instantiated.
		//		Images and CSS files may or may not have finished downloading when
		//		the specified function is called.  (Note that widgets' CSS and HTML
		//		code is guaranteed to be downloaded before said widgets are
		//		instantiated.)
		// example:
		//	|	dojo.addOnLoad(functionPointer);
		//	|	dojo.addOnLoad(object, "functionName");
		//	|	dojo.addOnLoad(object, function(){ /* ... */});

		d._onto(d._loaders, obj, functionName);

		//Added for xdomain loading. dojo.addOnLoad is used to
		//indicate callbacks after doing some dojo.require() statements.
		//In the xdomain case, if all the requires are loaded (after initial
		//page load), then immediately call any listeners.
		if(d._postLoad && d._inFlightCount == 0 && !d._loadNotifying){
			d._callLoaded();
		}
	}

	//Support calling dojo.addOnLoad via djConfig.addOnLoad. Support all the
	//call permutations of dojo.addOnLoad. Mainly useful when dojo is added
	//to the page after the page has loaded.
	var dca = d.config.addOnLoad;
	if(dca){
		d.addOnLoad[(dca instanceof Array ? "apply" : "call")](d, dca);
	}

	dojo.addOnUnload = function(/*Object?*/obj, /*String|Function?*/functionName){
		// summary:
		//		registers a function to be triggered when the page unloads. In a browser
		//		enviroment, the functions will be triggered during the window.onbeforeunload
		//		event. Be careful doing work during window.onbeforeunload. onbeforeunload
		//		can be triggered if a link to download a file is clicked, or if the link is a
		//		javascript: link. In these cases, the onbeforeunload event fires, but the
		//		document is not actually destroyed. So be careful about doing destructive
		//		operations in a dojo.addOnUnload callback.
		// example:
		//	|	dojo.addOnUnload(functionPointer)
		//	|	dojo.addOnUnload(object, "functionName")
		//	|	dojo.addOnUnload(object, function(){ /* ... */});

		d._onto(d._unloaders, obj, functionName);
	}

	dojo._modulesLoaded = function(){
		if(d._postLoad){ return; }
		if(d._inFlightCount > 0){ 
			console.warn("files still in flight!");
			return;
		}
		d._callLoaded();
	}

	dojo._callLoaded = function(){

		// The "object" check is for IE, and the other opera check fixes an
		// issue in Opera where it could not find the body element in some
		// widget test cases.  For 0.9, maybe route all browsers through the
		// setTimeout (need protection still for non-browser environments
		// though). This might also help the issue with FF 2.0 and freezing
		// issues where we try to do sync xhr while background css images are
		// being loaded (trac #2572)? Consider for 0.9.
		if(typeof setTimeout == "object" || (dojo.config.useXDomain && d.isOpera)){
			if(dojo.isAIR){
				setTimeout(function(){dojo.loaded();}, 0);
			}else{
				setTimeout(dojo._scopeName + ".loaded();", 0);
			}
		}else{
			d.loaded();
		}
	}

	dojo._getModuleSymbols = function(/*String*/modulename){
		// summary:
		//		Converts a module name in dotted JS notation to an array
		//		representing the path in the source tree
		var syms = modulename.split(".");
		for(var i = syms.length; i>0; i--){
			var parentModule = syms.slice(0, i).join(".");
			if((i==1) && !this._moduleHasPrefix(parentModule)){		
				// Support default module directory (sibling of dojo) for top-level modules 
				syms[0] = "../" + syms[0];
			}else{
				var parentModulePath = this._getModulePrefix(parentModule);
				if(parentModulePath != parentModule){
					syms.splice(0, i, parentModulePath);
					break;
				}
			}
		}
		// console.debug(syms);
		return syms; // Array
	}

	dojo._global_omit_module_check = false;

	dojo.loadInit = function(/*Function*/init){
		//	summary:
		//		Executes a function that needs to be executed for the loader's dojo.requireIf
		//		resolutions to work. This is needed mostly for the xdomain loader case where
		//		a function needs to be executed to set up the possible values for a dojo.requireIf
		//		call.
		//	init:
		//		a function reference. Executed immediately.
		//	description: This function is mainly a marker for the xdomain loader to know parts of
		//		code that needs be executed outside the function wrappper that is placed around modules.
		//		The init function could be executed more than once, and it should make no assumptions
		//		on what is loaded, or what modules are available. Only the functionality in Dojo Base
		//		is allowed to be used. Avoid using this method. For a valid use case,
		//		see the source for dojox.gfx.
		init();
	}

	dojo._loadModule = dojo.require = function(/*String*/moduleName, /*Boolean?*/omitModuleCheck){
		//	summary:
		//		loads a Javascript module from the appropriate URI
		//	moduleName:
		//		module name to load, using periods for separators,
		//		 e.g. "dojo.date.locale".  Module paths are de-referenced by dojo's
		//		internal mapping of locations to names and are disambiguated by
		//		longest prefix. See `dojo.registerModulePath()` for details on
		//		registering new modules.
		//	omitModuleCheck:
		//		if `true`, omitModuleCheck skips the step of ensuring that the
		//		loaded file actually defines the symbol it is referenced by.
		//		For example if it called as `dojo.require("a.b.c")` and the
		//		file located at `a/b/c.js` does not define an object `a.b.c`,
		//		and exception will be throws whereas no exception is raised
		//		when called as `dojo.require("a.b.c", true)`
		//	description:
		//		`dojo.require("A.B")` first checks to see if symbol A.B is
		//		defined. If it is, it is simply returned (nothing to do).
		//	
		//		If it is not defined, it will look for `A/B.js` in the script root
		//		directory.
		//	
		//		`dojo.require` throws an excpetion if it cannot find a file
		//		to load, or if the symbol `A.B` is not defined after loading.
		//	
		//		It returns the object `A.B`.
		//	
		//		`dojo.require()` does nothing about importing symbols into
		//		the current namespace.  It is presumed that the caller will
		//		take care of that. For example, to import all symbols into a
		//		local block, you might write:
		//	
		//		|	with (dojo.require("A.B")) {
		//		|		...
		//		|	}
		//	
		//		And to import just the leaf symbol to a local variable:
		//	
		//		|	var B = dojo.require("A.B");
		//	   	|	...
		//	returns: the required namespace object
		omitModuleCheck = this._global_omit_module_check || omitModuleCheck;

		//Check if it is already loaded.
		var module = this._loadedModules[moduleName];
		if(module){
			return module;
		}

		// convert periods to slashes
		var relpath = this._getModuleSymbols(moduleName).join("/") + '.js';

		var modArg = (!omitModuleCheck) ? moduleName : null;
		var ok = this._loadPath(relpath, modArg);

		if(!ok && !omitModuleCheck){
			throw new Error("Could not load '" + moduleName + "'; last tried '" + relpath + "'");
		}

		// check that the symbol was defined
		// Don't bother if we're doing xdomain (asynchronous) loading.
		if(!omitModuleCheck && !this._isXDomain){
			// pass in false so we can give better error
			module = this._loadedModules[moduleName];
			if(!module){
				throw new Error("symbol '" + moduleName + "' is not defined after loading '" + relpath + "'"); 
			}
		}

		return module;
	}

	dojo.provide = function(/*String*/ resourceName){
		//	summary:
		//		Each javascript source file must have at least one
		//		`dojo.provide()` call at the top of the file, corresponding to
		//		the file name.  For example, `js/dojo/foo.js` must have
		//		`dojo.provide("dojo.foo");` before any calls to
		//		`dojo.require()` are made.
		//	description:
		//		Each javascript source file is called a resource.  When a
		//		resource is loaded by the browser, `dojo.provide()` registers
		//		that it has been loaded.
		//	
		//		For backwards compatibility reasons, in addition to registering
		//		the resource, `dojo.provide()` also ensures that the javascript
		//		object for the module exists.  For example,
		//		`dojo.provide("dojox.data.FlickrStore")`, in addition to
		//		registering that `FlickrStore.js` is a resource for the
		//		`dojox.data` module, will ensure that the `dojox.data`
		//		javascript object exists, so that calls like 
		//		`dojo.data.foo = function(){ ... }` don't fail.
		//
		//		In the case of a build where multiple javascript source files
		//		are combined into one bigger file (similar to a .lib or .jar
		//		file), that file may contain multiple dojo.provide() calls, to
		//		note that it includes multiple resources.

		//Make sure we have a string.
		resourceName = resourceName + "";
		return (d._loadedModules[resourceName] = d.getObject(resourceName, true)); // Object
	}

	//Start of old bootstrap2:

	dojo.platformRequire = function(/*Object*/modMap){
		//	summary:
		//		require one or more modules based on which host environment
		//		Dojo is currently operating in
		//	description:
		//		This method takes a "map" of arrays which one can use to
		//		optionally load dojo modules. The map is indexed by the
		//		possible dojo.name_ values, with two additional values:
		//		"default" and "common". The items in the "default" array will
		//		be loaded if none of the other items have been choosen based on
		//		dojo.name_, set by your host environment. The items in the
		//		"common" array will *always* be loaded, regardless of which
		//		list is chosen.
		//	example:
		//		|	dojo.platformRequire({
		//		|		browser: [
		//		|			"foo.sample", // simple module
		//		|			"foo.test",
		//		|			["foo.bar.baz", true] // skip object check in _loadModule (dojo.require)
		//		|		],
		//		|		default: [ "foo.sample._base" ],
		//		|		common: [ "important.module.common" ]
		//		|	});

		var common = modMap.common || [];
		var result = common.concat(modMap[d._name] || modMap["default"] || []);

		for(var x=0; x<result.length; x++){
			var curr = result[x];
			if(curr.constructor == Array){
				d._loadModule.apply(d, curr);
			}else{
				d._loadModule(curr);
			}
		}
	}

	dojo.requireIf = function(/*Boolean*/ condition, /*String*/ resourceName){
		// summary:
		//		If the condition is true then call dojo.require() for the specified
		//		resource
		if(condition === true){
			// FIXME: why do we support chained require()'s here? does the build system?
			var args = [];
			for(var i = 1; i < arguments.length; i++){ 
				args.push(arguments[i]);
			}
			d.require.apply(d, args);
		}
	}

	dojo.requireAfterIf = d.requireIf;

	dojo.registerModulePath = function(/*String*/module, /*String*/prefix){
		//	summary: 
		//		maps a module name to a path
		//	description: 
		//		An unregistered module is given the default path of ../[module],
		//		relative to Dojo root. For example, module acme is mapped to
		//		../acme.  If you want to use a different module name, use
		//		dojo.registerModulePath. 
		//	example:
		//		If your dojo.js is located at this location in the web root:
		//	|	/myapp/js/dojo/dojo/dojo.js
		//		and your modules are located at:
		//	|	/myapp/js/foo/bar.js
		//	|	/myapp/js/foo/baz.js
		//	|	/myapp/js/foo/thud/xyzzy.js
		//		Your application can tell Dojo to locate the "foo" namespace by calling:
		//	|	dojo.registerModulePath("foo", "../../foo");
		//		At which point you can then use dojo.require() to load the
		//		modules (assuming they provide() the same things which are
		//		required). The full code might be:
		//	|	<script type="text/javascript" 
		//	|		src="/myapp/js/dojo/dojo/dojo.js"></script>
		//	|	<script type="text/javascript">
		//	|		dojo.registerModulePath("foo", "../../foo");
		//	|		dojo.require("foo.bar");
		//	|		dojo.require("foo.baz");
		//	|		dojo.require("foo.thud.xyzzy");
		//	|	</script>
		d._modulePrefixes[module] = { name: module, value: prefix };
	}

	dojo.requireLocalization = function(/*String*/moduleName, /*String*/bundleName, /*String?*/locale, /*String?*/availableFlatLocales){
		// summary:
		//		Declares translated resources and loads them if necessary, in the
		//		same style as dojo.require.  Contents of the resource bundle are
		//		typically strings, but may be any name/value pair, represented in
		//		JSON format.  See also `dojo.i18n.getLocalization`.
		//
		// description:
		//		Load translated resource bundles provided underneath the "nls"
		//		directory within a package.  Translated resources may be located in
		//		different packages throughout the source tree.  
		//
		//		Each directory is named for a locale as specified by RFC 3066,
		//		(http://www.ietf.org/rfc/rfc3066.txt), normalized in lowercase.
		//		Note that the two bundles in the example do not define all the
		//		same variants.  For a given locale, bundles will be loaded for
		//		that locale and all more general locales above it, including a
		//		fallback at the root directory.  For example, a declaration for
		//		the "de-at" locale will first load `nls/de-at/bundleone.js`,
		//		then `nls/de/bundleone.js` and finally `nls/bundleone.js`.  The
		//		data will be flattened into a single Object so that lookups
		//		will follow this cascading pattern.  An optional build step can
		//		preload the bundles to avoid data redundancy and the multiple
		//		network hits normally required to load these resources.
		//
		// moduleName: 
		//		name of the package containing the "nls" directory in which the
		//		bundle is found
		//
		// bundleName: 
		//		bundle name, i.e. the filename without the '.js' suffix
		//
		// locale: 
		//		the locale to load (optional)  By default, the browser's user
		//		locale as defined by dojo.locale
		//
		// availableFlatLocales: 
		//		A comma-separated list of the available, flattened locales for this
		//		bundle. This argument should only be set by the build process.
		//
		//	example:
		//		A particular widget may define one or more resource bundles,
		//		structured in a program as follows, where moduleName is
		//		mycode.mywidget and bundleNames available include bundleone and
		//		bundletwo:
		//	|		...
		//	|	mycode/
		//	|		mywidget/
		//	|			nls/
		//	|				bundleone.js (the fallback translation, English in this example)
		//	|				bundletwo.js (also a fallback translation)
		//	|				de/
		//	|					bundleone.js
		//	|					bundletwo.js
		//	|				de-at/
		//	|					bundleone.js
		//	|				en/
		//	|					(empty; use the fallback translation)
		//	|				en-us/
		//	|					bundleone.js
		//	|				en-gb/
		//	|					bundleone.js
		//	|				es/
		//	|					bundleone.js
		//	|					bundletwo.js
		//	|				  ...etc
		//	|				...
		//

		d.require("dojo.i18n");
		d.i18n._requireLocalization.apply(d.hostenv, arguments);
	};


	var ore = new RegExp("^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?$");
	var ire = new RegExp("^((([^\\[:]+):)?([^@]+)@)?(\\[([^\\]]+)\\]|([^\\[:]*))(:([0-9]+))?$");

	dojo._Url = function(/*dojo._Url||String...*/){
		// summary: 
		//		Constructor to create an object representing a URL.
		//		It is marked as private, since we might consider removing
		//		or simplifying it.
		// description: 
		//		Each argument is evaluated in order relative to the next until
		//		a canonical uri is produced. To get an absolute Uri relative to
		//		the current document use:
		//      	new dojo._Url(document.baseURI, url)

		var n = null;

		var _a = arguments;
		var uri = [_a[0]];
		// resolve uri components relative to each other
		for(var i = 1; i<_a.length; i++){
			if(!_a[i]){ continue; }

			// Safari doesn't support this.constructor so we have to be explicit
			// FIXME: Tracked (and fixed) in Webkit bug 3537.
			//		http://bugs.webkit.org/show_bug.cgi?id=3537
			var relobj = new d._Url(_a[i]+"");
			var uriobj = new d._Url(uri[0]+"");

			if(
				relobj.path == "" &&
				!relobj.scheme &&
				!relobj.authority &&
				!relobj.query
			){
				if(relobj.fragment != n){
					uriobj.fragment = relobj.fragment;
				}
				relobj = uriobj;
			}else if(!relobj.scheme){
				relobj.scheme = uriobj.scheme;

				if(!relobj.authority){
					relobj.authority = uriobj.authority;

					if(relobj.path.charAt(0) != "/"){
						var path = uriobj.path.substring(0,
							uriobj.path.lastIndexOf("/") + 1) + relobj.path;

						var segs = path.split("/");
						for(var j = 0; j < segs.length; j++){
							if(segs[j] == "."){
								// flatten "./" references
								if(j == segs.length - 1){
									segs[j] = "";
								}else{
									segs.splice(j, 1);
									j--;
								}
							}else if(j > 0 && !(j == 1 && segs[0] == "") &&
								segs[j] == ".." && segs[j-1] != ".."){
								// flatten "../" references
								if(j == (segs.length - 1)){
									segs.splice(j, 1);
									segs[j - 1] = "";
								}else{
									segs.splice(j - 1, 2);
									j -= 2;
								}
							}
						}
						relobj.path = segs.join("/");
					}
				}
			}

			uri = [];
			if(relobj.scheme){ 
				uri.push(relobj.scheme, ":");
			}
			if(relobj.authority){
				uri.push("//", relobj.authority);
			}
			uri.push(relobj.path);
			if(relobj.query){
				uri.push("?", relobj.query);
			}
			if(relobj.fragment){
				uri.push("#", relobj.fragment);
			}
		}

		this.uri = uri.join("");

		// break the uri into its main components
		var r = this.uri.match(ore);

		this.scheme = r[2] || (r[1] ? "" : n);
		this.authority = r[4] || (r[3] ? "" : n);
		this.path = r[5]; // can never be undefined
		this.query = r[7] || (r[6] ? "" : n);
		this.fragment  = r[9] || (r[8] ? "" : n);

		if(this.authority != n){
			// server based naming authority
			r = this.authority.match(ire);

			this.user = r[3] || n;
			this.password = r[4] || n;
			this.host = r[6] || r[7]; // ipv6 || ipv4
			this.port = r[9] || n;
		}
	}

	dojo._Url.prototype.toString = function(){ return this.uri; };

	dojo.moduleUrl = function(/*String*/module, /*dojo._Url||String*/url){
		//	summary: 
		//		Returns a `dojo._Url` object relative to a module.
		//	example:
		//	|	var pngPath = dojo.moduleUrl("acme","images/small.png");
		//	|	console.dir(pngPath); // list the object properties
		//	|	// create an image and set it's source to pngPath's value:
		//	|	var img = document.createElement("img");
		// 	|	// NOTE: we assign the string representation of the url object
		//	|	img.src = pngPath.toString(); 
		//	|	// add our image to the document
		//	|	dojo.body().appendChild(img);
		//	example: 
		//		you may de-reference as far as you like down the package
		//		hierarchy.  This is sometimes handy to avoid lenghty relative
		//		urls or for building portable sub-packages. In this example,
		//		the `acme.widget` and `acme.util` directories may be located
		//		under different roots (see `dojo.registerModulePath`) but the
		//		the modules which reference them can be unaware of their
		//		relative locations on the filesystem:
		//	|	// somewhere in a configuration block
		//	|	dojo.registerModulePath("acme.widget", "../../acme/widget");
		//	|	dojo.registerModulePath("acme.util", "../../util");
		//	|	
		//	|	// ...
		//	|	
		//	|	// code in a module using acme resources
		//	|	var tmpltPath = dojo.moduleUrl("acme.widget","templates/template.html");
		//	|	var dataPath = dojo.moduleUrl("acme.util","resources/data.json");

		var loc = d._getModuleSymbols(module).join('/');
		if(!loc){ return null; }
		if(loc.lastIndexOf("/") != loc.length-1){
			loc += "/";
		}
		
		//If the path is an absolute path (starts with a / or is on another
		//domain/xdomain) then don't add the baseUrl.
		var colonIndex = loc.indexOf(":");
		if(loc.charAt(0) != "/" && (colonIndex == -1 || colonIndex > loc.indexOf("/"))){
			loc = d.baseUrl + loc;
		}

		return new d._Url(loc, url); // String
	}
})();

/*=====
dojo.isBrowser = {
	//	example:
	//	|	if(dojo.isBrowser){ ... }
};

dojo.isFF = {
	//	example:
	//	|	if(dojo.isFF > 1){ ... }
};

dojo.isIE = {
	// example:
	//	|	if(dojo.isIE > 6){
	//	|		// we are IE7
	// 	|	}
};

dojo.isSafari = {
	//	example:
	//	|	if(dojo.isSafari){ ... }
	//	example: 
	//		Detect iPhone:
	//	|	if(dojo.isSafari && navigator.userAgent.indexOf("iPhone") != -1){ 
	//	|		// we are iPhone. Note, iPod touch reports "iPod" above and fails this test.
	//	|	}
};

dojo = {
	// isBrowser: Boolean
	//		True if the client is a web-browser
	isBrowser: true,
	//	isFF: Number | undefined
	//		Version as a Number if client is FireFox. undefined otherwise. Corresponds to
	//		major detected FireFox version (1.5, 2, 3, etc.)
	isFF: 2,
	//	isIE: Number | undefined
	//		Version as a Number if client is MSIE(PC). undefined otherwise. Corresponds to
	//		major detected IE version (6, 7, 8, etc.)
	isIE: 6,
	//	isKhtml: Number | undefined
	//		Version as a Number if client is a KHTML browser. undefined otherwise. Corresponds to major
	//		detected version.
	isKhtml: 0,
	//	isWebKit: Number | undefined
	//		Version as a Number if client is a WebKit-derived browser (Konqueror,
	//		Safari, Chrome, etc.). undefined otherwise.
	isWebKit: 0,
	//	isMozilla: Number | undefined
	//		Version as a Number if client is a Mozilla-based browser (Firefox,
	//		SeaMonkey). undefined otherwise. Corresponds to major detected version.
	isMozilla: 0,
	//	isOpera: Number | undefined
	//		Version as a Number if client is Opera. undefined otherwise. Corresponds to
	//		major detected version.
	isOpera: 0,
	//	isSafari: Number | undefined
	//		Version as a Number if client is Safari or iPhone. undefined otherwise.
	isSafari: 0
	//	isChrome: Number | undefined
	//		Version as a Number if client is Chrome browser. undefined otherwise.
	isChrome: 0
}
=====*/

if(typeof window != 'undefined'){
	dojo.isBrowser = true;
	dojo._name = "browser";


	// attempt to figure out the path to dojo if it isn't set in the config
	(function(){
		var d = dojo;
		// this is a scope protection closure. We set browser versions and grab
		// the URL we were loaded from here.

		// grab the node we were loaded from
		if(document && document.getElementsByTagName){
			var scripts = document.getElementsByTagName("script");
			var rePkg = /dojo(\.xd)?\.js(\W|$)/i;
			for(var i = 0; i < scripts.length; i++){
				var src = scripts[i].getAttribute("src");
				if(!src){ continue; }
				var m = src.match(rePkg);
				if(m){
					// find out where we came from
					if(!d.config.baseUrl){
						d.config.baseUrl = src.substring(0, m.index);
					}
					// and find out if we need to modify our behavior
					var cfg = scripts[i].getAttribute("djConfig");
					if(cfg){
						var cfgo = eval("({ "+cfg+" })");
						for(var x in cfgo){
							dojo.config[x] = cfgo[x];
						}
					}
					break; // "first Dojo wins"
				}
			}
		}
		d.baseUrl = d.config.baseUrl;

		// fill in the rendering support information in dojo.render.*
		var n = navigator;
		var dua = n.userAgent,
			dav = n.appVersion,
			tv = parseFloat(dav);

		if(dua.indexOf("Opera") >= 0){ d.isOpera = tv; }
		if(dua.indexOf("AdobeAIR") >= 0){ d.isAIR = 1; }
		d.isKhtml = (dav.indexOf("Konqueror") >= 0) ? tv : 0;
		d.isWebKit = parseFloat(dua.split("WebKit/")[1]) || undefined;
		d.isChrome = parseFloat(dua.split("Chrome/")[1]) || undefined;

		// safari detection derived from:
		//		http://developer.apple.com/internet/safari/faq.html#anchor2
		//		http://developer.apple.com/internet/safari/uamatrix.html
		var index = Math.max(dav.indexOf("WebKit"), dav.indexOf("Safari"), 0);
		if(index && !dojo.isChrome){
			// try to grab the explicit Safari version first. If we don't get
			// one, look for less than 419.3 as the indication that we're on something
			// "Safari 2-ish".
			d.isSafari = parseFloat(dav.split("Version/")[1]);
			if(!d.isSafari || parseFloat(dav.substr(index + 7)) <= 419.3){
				d.isSafari = 2;
			}
		}

		if(dua.indexOf("Gecko") >= 0 && !d.isKhtml && !d.isWebKit){ d.isMozilla = d.isMoz = tv; }
		if(d.isMoz){
			d.isFF = parseFloat(dua.split("Firefox/")[1]) || undefined;
		}
		if(document.all && !d.isOpera){
			d.isIE = parseFloat(dav.split("MSIE ")[1]) || undefined;
		}

		//Workaround to get local file loads of dojo to work on IE 7
		//by forcing to not use native xhr.
		if(dojo.isIE && window.location.protocol === "file:"){
			dojo.config.ieForceActiveXXhr=true;
		}

		var cm = document.compatMode;
		d.isQuirks = cm == "BackCompat" || cm == "QuirksMode" || d.isIE < 6;

		// TODO: is the HTML LANG attribute relevant?
		d.locale = dojo.config.locale || (d.isIE ? n.userLanguage : n.language).toLowerCase();

		// These are in order of decreasing likelihood; this will change in time.
		d._XMLHTTP_PROGIDS = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];

		d._xhrObj = function(){
			// summary: 
			//		does the work of portably generating a new XMLHTTPRequest
			//		object.
			var http = null;
			var last_e = null;
			if(!dojo.isIE || !dojo.config.ieForceActiveXXhr){
				try{ http = new XMLHttpRequest(); }catch(e){}
			}
			if(!http){
				for(var i=0; i<3; ++i){
					var progid = d._XMLHTTP_PROGIDS[i];
					try{
						http = new ActiveXObject(progid);
					}catch(e){
						last_e = e;
					}

					if(http){
						d._XMLHTTP_PROGIDS = [progid];  // so faster next time
						break;
					}
				}
			}

			if(!http){
				throw new Error("XMLHTTP not available: "+last_e);
			}

			return http; // XMLHTTPRequest instance
		}

		d._isDocumentOk = function(http){
			var stat = http.status || 0;
			return (stat >= 200 && stat < 300) || 	// Boolean
				stat == 304 || 						// allow any 2XX response code
				stat == 1223 || 						// get it out of the cache
				(!stat && (location.protocol=="file:" || location.protocol=="chrome:") ); // Internet Explorer mangled the status code
		}

		//See if base tag is in use.
		//This is to fix http://trac.dojotoolkit.org/ticket/3973,
		//but really, we need to find out how to get rid of the dojo._Url reference
		//below and still have DOH work with the dojo.i18n test following some other
		//test that uses the test frame to load a document (trac #2757).
		//Opera still has problems, but perhaps a larger issue of base tag support
		//with XHR requests (hasBase is true, but the request is still made to document
		//path, not base path).
		var owloc = window.location+"";
		var base = document.getElementsByTagName("base");
		var hasBase = (base && base.length > 0);

		d._getText = function(/*URI*/ uri, /*Boolean*/ fail_ok){
			// summary: Read the contents of the specified uri and return those contents.
			// uri:
			//		A relative or absolute uri. If absolute, it still must be in
			//		the same "domain" as we are.
			// fail_ok:
			//		Default false. If fail_ok and loading fails, return null
			//		instead of throwing.
			// returns: The response text. null is returned when there is a
			//		failure and failure is okay (an exception otherwise)

			// NOTE: must be declared before scope switches ie. this._xhrObj()
			var http = this._xhrObj();

			if(!hasBase && dojo._Url){
				uri = (new dojo._Url(owloc, uri)).toString();
			}

			if(d.config.cacheBust){
				//Make sure we have a string before string methods are used on uri
				uri += "";
				uri += (uri.indexOf("?") == -1 ? "?" : "&") + String(d.config.cacheBust).replace(/\W+/g,"");
			}

			http.open('GET', uri, false);
			try{
				http.send(null);
				if(!d._isDocumentOk(http)){
					var err = Error("Unable to load "+uri+" status:"+ http.status);
					err.status = http.status;
					err.responseText = http.responseText;
					throw err;
				}
			}catch(e){
				if(fail_ok){ return null; } // null
				// rethrow the exception
				throw e;
			}
			return http.responseText; // String
		}
		
		d._windowUnloaders = [];
		
		d.windowUnloaded = function(){
			// summary:
			//		signal fired by impending window destruction. You may use
			//		dojo.addOnWIndowUnload() or dojo.connect() to this method to perform
			//		page/application cleanup methods. See dojo.addOnWindowUnload for more info.
			var mll = this._windowUnloaders;
			while(mll.length){
				(mll.pop())();
			}
		}

		d.addOnWindowUnload = function(/*Object?*/obj, /*String|Function?*/functionName){
			// summary:
			//		registers a function to be triggered when window.onunload fires.
			//		Be careful trying to modify the DOM or access JavaScript properties
			//		during this phase of page unloading: they may not always be available.
			//		Consider dojo.addOnUnload() if you need to modify the DOM or do heavy
			//		JavaScript work.
			// example:
			//	|	dojo.addOnWindowUnload(functionPointer)
			//	|	dojo.addOnWindowUnload(object, "functionName")
			//	|	dojo.addOnWindowUnload(object, function(){ /* ... */});
	
			d._onto(d._windowUnloaders, obj, functionName);
		}
	})();

	dojo._initFired = false;
	//	BEGIN DOMContentLoaded, from Dean Edwards (http://dean.edwards.name/weblog/2006/06/again/)
	dojo._loadInit = function(e){
		dojo._initFired = true;
		// allow multiple calls, only first one will take effect
		// A bug in khtml calls events callbacks for document for event which isnt supported
		// for example a created contextmenu event calls DOMContentLoaded, workaround
		var type = (e && e.type) ? e.type.toLowerCase() : "load";
		if(arguments.callee.initialized || (type != "domcontentloaded" && type != "load")){ return; }
		arguments.callee.initialized = true;
		if("_khtmlTimer" in dojo){
			clearInterval(dojo._khtmlTimer);
			delete dojo._khtmlTimer;
		}

		if(dojo._inFlightCount == 0){
			dojo._modulesLoaded();
		}
	}

	dojo._fakeLoadInit = function(){
		dojo._loadInit({type: "load"});
	}

	if(!dojo.config.afterOnLoad){
		//	START DOMContentLoaded
		// Mozilla and Opera 9 expose the event we could use
		if(document.addEventListener){
			// NOTE: 
			//		due to a threading issue in Firefox 2.0, we can't enable
			//		DOMContentLoaded on that platform. For more information, see:
			//		http://trac.dojotoolkit.org/ticket/1704
			if(dojo.isWebKit > 525 || dojo.isOpera || dojo.isFF >= 3 || (dojo.isMoz && dojo.config.enableMozDomContentLoaded === true)){
				document.addEventListener("DOMContentLoaded", dojo._loadInit, null);
			}
	
			//	mainly for Opera 8.5, won't be fired if DOMContentLoaded fired already.
			//  also used for Mozilla because of trac #1640
			window.addEventListener("load", dojo._loadInit, null);
		}
	
		if(dojo.isAIR){
			window.addEventListener("load", dojo._loadInit, null);
		}else if((dojo.isWebKit < 525) || dojo.isKhtml){
			dojo._khtmlTimer = setInterval(function(){
				if(/loaded|complete/.test(document.readyState)){
					dojo._loadInit(); // call the onload handler
				}
			}, 10);
		}
		//	END DOMContentLoaded
	}

	(function(){
		var _w = window;
		var _handleNodeEvent = function(/*String*/evtName, /*Function*/fp){
			// summary:
			//		non-destructively adds the specified function to the node's
			//		evtName handler.
			// evtName: should be in the form "onclick" for "onclick" handlers.
			// Make sure you pass in the "on" part.
			var oldHandler = _w[evtName] || function(){};
			_w[evtName] = function(){
				fp.apply(_w, arguments);
				oldHandler.apply(_w, arguments);
			};
		};

		if(dojo.isIE){
			// 	for Internet Explorer. readyState will not be achieved on init
			// 	call, but dojo doesn't need it however, we'll include it
			// 	because we don't know if there are other functions added that
			// 	might.  Note that this has changed because the build process
			// 	strips all comments -- including conditional ones.
			if(!dojo.config.afterOnLoad){
				document.write('<scr'+'ipt defer src="//:" '
					+ 'onreadystatechange="if(this.readyState==\'complete\'){' + dojo._scopeName + '._loadInit();}">'
					+ '</scr'+'ipt>'
				);
			}

			try{
				document.namespaces.add("v","urn:schemas-microsoft-com:vml");
				document.createStyleSheet().addRule("v\\:*", "behavior:url(#default#VML)");
			}catch(e){}
		}

		// FIXME: dojo.unloaded requires dojo scope, so using anon function wrapper.
		_handleNodeEvent("onbeforeunload", function() { dojo.unloaded(); });
		_handleNodeEvent("onunload", function() { dojo.windowUnloaded(); });
	})();

	/*
	OpenAjax.subscribe("OpenAjax", "onload", function(){
		if(dojo._inFlightCount == 0){
			dojo._modulesLoaded();
		}
	});

	OpenAjax.subscribe("OpenAjax", "onunload", function(){
		dojo.unloaded();
	});
	*/
} //if (typeof window != 'undefined')

//Register any module paths set up in djConfig. Need to do this
//in the hostenvs since hostenv_browser can read djConfig from a
//script tag's attribute.
(function(){
	var mp = dojo.config["modulePaths"];
	if(mp){
		for(var param in mp){
			dojo.registerModulePath(param, mp[param]);
		}
	}
})();

//Load debug code if necessary.
if(dojo.config.isDebug){
	dojo.require("dojo._firebug.firebug");
}

if(dojo.config.debugAtAllCosts){
	dojo.config.useXDomain = true;
	dojo.require("dojo._base._loader.loader_xd");
	dojo.require("dojo._base._loader.loader_debug");
	
}

if(!dojo._hasResource["dojo._base.lang"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.lang"] = true;
dojo.provide("dojo._base.lang");

// Crockford (ish) functions

dojo.isString = function(/*anything*/ it){
	//	summary:
	//		Return true if it is a String
	return !!arguments.length && it != null && (typeof it == "string" || it instanceof String); // Boolean
}

dojo.isArray = function(/*anything*/ it){
	//	summary:
	//		Return true if it is an Array
	return it && (it instanceof Array || typeof it == "array"); // Boolean
}

/*=====
dojo.isFunction = function(it){
	// summary: Return true if it is a Function
	// it: anything
	return; // Boolean
}
=====*/

dojo.isFunction = (function(){
	var _isFunction = function(/*anything*/ it){
		return it && (typeof it == "function" || it instanceof Function); // Boolean
	};

	return dojo.isSafari ?
		// only slow this down w/ gratuitious casting in Safari since it's what's b0rken
		function(/*anything*/ it){
			if(typeof it == "function" && it == "[object NodeList]"){ return false; }
			return _isFunction(it); // Boolean
		} : _isFunction;
})();

dojo.isObject = function(/*anything*/ it){
	// summary: 
	//		Returns true if it is a JavaScript object (or an Array, a Function
	//		or null)
	return it !== undefined &&
		(it === null || typeof it == "object" || dojo.isArray(it) || dojo.isFunction(it)); // Boolean
}

dojo.isArrayLike = function(/*anything*/ it){
	//	summary:
	//		similar to dojo.isArray() but more permissive
	//	description:
	//		Doesn't strongly test for "arrayness".  Instead, settles for "isn't
	//		a string or number and has a length property". Arguments objects
	//		and DOM collections will return true when passed to
	//		dojo.isArrayLike(), but will return false when passed to
	//		dojo.isArray().
	//	returns:
	//		If it walks like a duck and quicks like a duck, return `true`
	var d = dojo;
	return it && it !== undefined && // Boolean
		// keep out built-in constructors (Number, String, ...) which have length
		// properties
		!d.isString(it) && !d.isFunction(it) &&
		!(it.tagName && it.tagName.toLowerCase() == 'form') &&
		(d.isArray(it) || isFinite(it.length));
}

dojo.isAlien = function(/*anything*/ it){
	// summary: 
	//		Returns true if it is a built-in function or some other kind of
	//		oddball that *should* report as a function but doesn't
	return it && !dojo.isFunction(it) && /\{\s*\[native code\]\s*\}/.test(String(it)); // Boolean
}

dojo.extend = function(/*Object*/ constructor, /*Object...*/ props){
	// summary:
	//		Adds all properties and methods of props to constructor's
	//		prototype, making them available to all instances created with
	//		constructor.
	for(var i=1, l=arguments.length; i<l; i++){
		dojo._mixin(constructor.prototype, arguments[i]);
	}
	return constructor; // Object
}

dojo._hitchArgs = function(scope, method /*,...*/){
	var pre = dojo._toArray(arguments, 2);
	var named = dojo.isString(method);
	return function(){
		// arrayify arguments
		var args = dojo._toArray(arguments);
		// locate our method
		var f = named ? (scope||dojo.global)[method] : method;
		// invoke with collected args
		return f && f.apply(scope || this, pre.concat(args)); // mixed
 	} // Function
}

dojo.hitch = function(/*Object*/scope, /*Function|String*/method /*,...*/){
	//	summary: 
	//		Returns a function that will only ever execute in the a given scope. 
	//		This allows for easy use of object member functions
	//		in callbacks and other places in which the "this" keyword may
	//		otherwise not reference the expected scope. 
	//		Any number of default positional arguments may be passed as parameters 
	//		beyond "method".
	//		Each of these values will be used to "placehold" (similar to curry)
	//		for the hitched function. 
	//	scope: 
	//		The scope to use when method executes. If method is a string, 
	//		scope is also the object containing method.
	//	method:
	//		A function to be hitched to scope, or the name of the method in
	//		scope to be hitched.
	//	example:
	//	|	dojo.hitch(foo, "bar")(); 
	//		runs foo.bar() in the scope of foo
	//	example:
	//	|	dojo.hitch(foo, myFunction);
	//		returns a function that runs myFunction in the scope of foo
	if(arguments.length > 2){
		return dojo._hitchArgs.apply(dojo, arguments); // Function
	}
	if(!method){
		method = scope;
		scope = null;
	}
	if(dojo.isString(method)){
		scope = scope || dojo.global;
		if(!scope[method]){ throw(['dojo.hitch: scope["', method, '"] is null (scope="', scope, '")'].join('')); }
		return function(){ return scope[method].apply(scope, arguments || []); }; // Function
	}
	return !scope ? method : function(){ return method.apply(scope, arguments || []); }; // Function
}

/*=====
dojo.delegate = function(obj, props){
	//	summary:
	//		returns a new object which "looks" to obj for properties which it
	//		does not have a value for. Optionally takes a bag of properties to
	//		seed the returned object with initially. 
	//	description:
	//		This is a small implementaton of the Boodman/Crockford delegation
	//		pattern in JavaScript. An intermediate object constructor mediates
	//		the prototype chain for the returned object, using it to delegate
	//		down to obj for property lookup when object-local lookup fails.
	//		This can be thought of similarly to ES4's "wrap", save that it does
	//		not act on types but rather on pure objects.
	//	obj:
	//		The object to delegate to for properties not found directly on the
	//		return object or in props.
	//	props:
	//		an object containing properties to assign to the returned object
	//	returns:
	//		an Object of anonymous type
	//	example:
	//	|	var foo = { bar: "baz" };
	//	|	var thinger = dojo.delegate(foo, { thud: "xyzzy"});
	//	|	thinger.bar == "baz"; // delegated to foo
	//	|	foo.thud == undefined; // by definition
	//	|	thinger.thud == "xyzzy"; // mixed in from props
	//	|	foo.bar = "thonk";
	//	|	thinger.bar == "thonk"; // still delegated to foo's bar
}
=====*/

dojo.delegate = dojo._delegate = (function(){
	// boodman/crockford delegation w/ cornford optimization
	function TMP(){};
	return function(obj, props){
		TMP.prototype = obj;
		var tmp = new TMP();
		if(props){
			dojo._mixin(tmp, props);
		}
		return tmp; // Object
	}
})();

/*=====
dojo._toArray = function(obj, offset, startWith){
	//	summary:
	//		Converts an array-like object (i.e. arguments, DOMCollection) to an
	//		array. Returns a new Array with the elements of obj.
	//	obj: Object
	//		the object to "arrayify". We expect the object to have, at a
	//		minimum, a length property which corresponds to integer-indexed
	//		properties.
	//	offset: Number?
	//		the location in obj to start iterating from. Defaults to 0.
	//		Optional.
	//	startWith: Array?
	//		An array to pack with the properties of obj. If provided,
	//		properties in obj are appended at the end of startWith and
	//		startWith is the returned array.
}
=====*/

(function(){
	var efficient = function(obj, offset, startWith){
		return (startWith||[]).concat(Array.prototype.slice.call(obj, offset||0));
	};

	var slow = function(obj, offset, startWith){
		var arr = startWith||[]; 
		for(var x = offset || 0; x < obj.length; x++){ 
			arr.push(obj[x]); 
		} 
		return arr;
	};

	dojo._toArray = (!dojo.isIE) ? efficient : function(obj){
		return ((obj.item) ? slow : efficient).apply(this, arguments);
	};

})();

dojo.partial = function(/*Function|String*/method /*, ...*/){
	//	summary:
	//		similar to hitch() except that the scope object is left to be
	//		whatever the execution context eventually becomes.
	//	description:
	//		Calling dojo.partial is the functional equivalent of calling:
	//		|	dojo.hitch(null, funcName, ...);
	var arr = [ null ];
	return dojo.hitch.apply(dojo, arr.concat(dojo._toArray(arguments))); // Function
}

dojo.clone = function(/*anything*/ o){
	// summary:
	//		Clones objects (including DOM nodes) and all children.
	//		Warning: do not clone cyclic structures.
	if(!o){ return o; }
	if(dojo.isArray(o)){
		var r = [];
		for(var i = 0; i < o.length; ++i){
			r.push(dojo.clone(o[i]));
		}
		return r; // Array
	}
	if(!dojo.isObject(o)){
		return o;	/*anything*/
	}
	if(o.nodeType && o.cloneNode){ // isNode
		return o.cloneNode(true); // Node
	}
	if(o instanceof Date){
		return new Date(o.getTime());	// Date
	}
	// Generic objects
	var r = new o.constructor(); // specific to dojo.declare()'d classes!
	for(var i in o){
		if(!(i in r) || r[i] != o[i]){
			r[i] = dojo.clone(o[i]);
		}
	}
	return r; // Object
}

dojo.trim = function(/*String*/ str){
	// summary: 
	//		trims whitespaces from both sides of the string
	// description:
	//		This version of trim() was selected for inclusion into the base due
	//		to its compact size and relatively good performance (see Steven
	//		Levithan's blog:
	//		http://blog.stevenlevithan.com/archives/faster-trim-javascript).
	//		The fastest but longest version of this function is located at
	//		dojo.string.trim()
	return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');	// String
}

}

if(!dojo._hasResource["dojo._base.declare"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.declare"] = true;
dojo.provide("dojo._base.declare");


// this file courtesy of the TurboAjax Group, licensed under a Dojo CLA

dojo.declare = function(/*String*/ className, /*Function|Function[]*/ superclass, /*Object*/ props){
	//	summary: 
	//		Create a feature-rich constructor from compact notation
	//	className:
	//		The name of the constructor (loosely, a "class")
	//		stored in the "declaredClass" property in the created prototype
	//	superclass:
	//		May be null, a Function, or an Array of Functions. If an array, 
	//		the first element is used as the prototypical ancestor and
	//		any following Functions become mixin ancestors.
	//	props:
	//		An object whose properties are copied to the
	//		created prototype.
	//		Add an instance-initialization function by making it a property 
	//		named "constructor".
	//	description:
	//		Create a constructor using a compact notation for inheritance and
	//		prototype extension. 
	//
	//		All superclasses (including mixins) must be Functions (not simple Objects).
	//
	//		Mixin ancestors provide a type of multiple inheritance. Prototypes of mixin 
	//		ancestors are copied to the new class: changes to mixin prototypes will
	//		not affect classes to which they have been mixed in.
	//
	//		"className" is cached in "declaredClass" property of the new class.
	//
	//	example:
	//	|	dojo.declare("my.classes.bar", my.classes.foo, {
	//	|		// properties to be added to the class prototype
	//	|		someValue: 2,
	//	|		// initialization function
	//	|		constructor: function(){
	//	|			this.myComplicatedObject = new ReallyComplicatedObject(); 
	//	|		},
	//	|		// other functions
	//	|		someMethod: function(){ 
	//	|			doStuff(); 
	//	|		}
	//	|	);

	// process superclass argument
	var dd = arguments.callee, mixins;
	if(dojo.isArray(superclass)){
		mixins = superclass;
		superclass = mixins.shift();
	}
	// construct intermediate classes for mixins
	if(mixins){
		dojo.forEach(mixins, function(m){
			if(!m){ throw(className + ": mixin #" + i + " is null"); } // It's likely a required module is not loaded
			superclass = dd._delegate(superclass, m);
		});
	}
	// create constructor
	var ctor = dd._delegate(superclass);
	// extend with "props"
	props = props || {};
	ctor.extend(props);
	// more prototype decoration
	dojo.extend(ctor, {declaredClass: className, _constructor: props.constructor/*, preamble: null*/});
	// special help for IE
	ctor.prototype.constructor = ctor;
	// create named reference
	return dojo.setObject(className, ctor); // Function
};

dojo.mixin(dojo.declare, {
	_delegate: function(base, mixin){
		var bp = (base||0).prototype, mp = (mixin||0).prototype, dd=dojo.declare;
		// fresh constructor, fresh prototype
		var ctor = dd._makeCtor();
		// cache ancestry
		dojo.mixin(ctor, {superclass: bp, mixin: mp, extend: dd._extend});
		// chain prototypes
		if(base){ctor.prototype = dojo._delegate(bp);}
		// add mixin and core
		dojo.extend(ctor, dd._core, mp||0, {_constructor: null, preamble: null});
		// special help for IE
		ctor.prototype.constructor = ctor;
		// name this class for debugging
		ctor.prototype.declaredClass = (bp||0).declaredClass + '_' + (mp||0).declaredClass;
		return ctor;
	},
	_extend: function(props){
		var i, fn;
		for(i in props){ if(dojo.isFunction(fn=props[i]) && !0[i]){fn.nom=i;fn.ctor=this;} }
		dojo.extend(this, props);
	},
	_makeCtor: function(){
		// we have to make a function, but don't want to close over anything
		return function(){ this._construct(arguments); };
	},
	_core: { 
		_construct: function(args){
			var c=args.callee, s=c.superclass, ct=s&&s.constructor, m=c.mixin, mct=m&&m.constructor, a=args, ii, fn;
			// side-effect of = used on purpose here, lint may complain, don't try this at home
			if(a[0]){ 
				// FIXME: preambles for each mixin should be allowed
				// FIXME: 
				//		should we allow the preamble here NOT to modify the
				//		default args, but instead to act on each mixin
				//		independently of the class instance being constructed
				//		(for impedence matching)?

				// allow any first argument w/ a "preamble" property to act as a
				// class preamble (not exclusive of the prototype preamble)
				if(/*dojo.isFunction*/((fn = a[0].preamble))){ 
					a = fn.apply(this, a) || a; 
				}
			} 
			// prototype preamble
			if((fn = c.prototype.preamble)){a = fn.apply(this, a) || a;}
			// FIXME: 
			//		need to provide an optional prototype-settable
			//		"_explicitSuper" property which disables this
			// initialize superclass
			if(ct&&ct.apply){ct.apply(this, a);}
			// initialize mixin
			if(mct&&mct.apply){mct.apply(this, a);}
			// initialize self
			if((ii=c.prototype._constructor)){ii.apply(this, args);}
			// post construction
			if(this.constructor.prototype==c.prototype && (ct=this.postscript)){ ct.apply(this, args); }
		},
		_findMixin: function(mixin){
			var c = this.constructor, p, m;
			while(c){
				p = c.superclass;
				m = c.mixin;
				if(m==mixin || (m instanceof mixin.constructor)){return p;}
				if(m && m._findMixin && (m=m._findMixin(mixin))){return m;}
				c = p && p.constructor;
			}
		},
		_findMethod: function(name, method, ptype, has){
			// consciously trading readability for bytes and speed in this low-level method
			var p=ptype, c, m, f;
			do{
				c = p.constructor;
				m = c.mixin;
				// find method by name in our mixin ancestor
				if(m && (m=this._findMethod(name, method, m, has))){return m;}
				// if we found a named method that either exactly-is or exactly-is-not 'method'
				if((f=p[name])&&(has==(f==method))){return p;}
				// ascend chain
				p = c.superclass;
			}while(p);
			// if we couldn't find an ancestor in our primary chain, try a mixin chain
			return !has && (p=this._findMixin(ptype)) && this._findMethod(name, method, p, has);
		},
		inherited: function(name, args, newArgs){
			// optionalize name argument
			var a = arguments;
			if(!dojo.isString(a[0])){newArgs=args; args=name; name=args.callee.nom;}
			a = newArgs||args;
			var c = args.callee, p = this.constructor.prototype, fn, mp;
			// if not an instance override
			if(this[name] != c || p[name] == c){
				// start from memoized prototype, or
				// find a prototype that has property 'name' == 'c'
				mp = (c.ctor||0).superclass || this._findMethod(name, c, p, true);
				if(!mp){throw(this.declaredClass + ': inherited method "' + name + '" mismatch');}
				// find a prototype that has property 'name' != 'c'
				p = this._findMethod(name, c, mp, false);
			}
			// we expect 'name' to be in prototype 'p'
			fn = p && p[name];
			if(!fn){throw(mp.declaredClass + ': inherited method "' + name + '" not found');}
			// if the function exists, invoke it in our scope
			return fn.apply(this, a);
		}
	}
});

}

if(!dojo._hasResource["dojo._base.connect"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.connect"] = true;
dojo.provide("dojo._base.connect");


// this file courtesy of the TurboAjax Group, licensed under a Dojo CLA

// low-level delegation machinery
dojo._listener = {
	// create a dispatcher function
	getDispatcher: function(){
		// following comments pulled out-of-line to prevent cloning them 
		// in the returned function.
		// - indices (i) that are really in the array of listeners (ls) will 
		//   not be in Array.prototype. This is the 'sparse array' trick
		//   that keeps us safe from libs that take liberties with built-in 
		//   objects
		// - listener is invoked with current scope (this)
		return function(){
			var ap=Array.prototype, c=arguments.callee, ls=c._listeners, t=c.target;
			// return value comes from original target function
			var r = t && t.apply(this, arguments);
			// make local copy of listener array so it is immutable during processing
			var lls;
											lls = [].concat(ls);
							
			// invoke listeners after target function
			for(var i in lls){
				if(!(i in ap)){
					lls[i].apply(this, arguments);
				}
			}
			// return value comes from original target function
			return r;
		}
	},
	// add a listener to an object
	add: function(/*Object*/ source, /*String*/ method, /*Function*/ listener){
		// Whenever 'method' is invoked, 'listener' will have the same scope.
		// Trying to supporting a context object for the listener led to 
		// complexity. 
		// Non trivial to provide 'once' functionality here
		// because listener could be the result of a dojo.hitch call,
		// in which case two references to the same hitch target would not
		// be equivalent. 
		source = source || dojo.global;
		// The source method is either null, a dispatcher, or some other function
		var f = source[method];
		// Ensure a dispatcher
		if(!f||!f._listeners){
			var d = dojo._listener.getDispatcher();
			// original target function is special
			d.target = f;
			// dispatcher holds a list of listeners
			d._listeners = []; 
			// redirect source to dispatcher
			f = source[method] = d;
		}
		// The contract is that a handle is returned that can 
		// identify this listener for disconnect. 
		//
		// The type of the handle is private. Here is it implemented as Integer. 
		// DOM event code has this same contract but handle is Function 
		// in non-IE browsers.
		//
		// We could have separate lists of before and after listeners.
		return f._listeners.push(listener) ; /*Handle*/
	},
	// remove a listener from an object
	remove: function(/*Object*/ source, /*String*/ method, /*Handle*/ handle){
		var f = (source||dojo.global)[method];
		// remember that handle is the index+1 (0 is not a valid handle)
		if(f && f._listeners && handle--){
			delete f._listeners[handle];
		}
	}
};

// Multiple delegation for arbitrary methods.

// This unit knows nothing about DOM, 
// but we include DOM aware 
// documentation and dontFix
// argument here to help the autodocs.
// Actual DOM aware code is in event.js.

dojo.connect = function(/*Object|null*/ obj, 
						/*String*/ event, 
						/*Object|null*/ context, 
						/*String|Function*/ method,
						/*Boolean*/ dontFix){
	// summary:
	//		Create a link that calls one function when another executes. 
	//
	// description:
	//		Connects method to event, so that after event fires, method
	//		does too. All connected functions are passed the same arguments as
	//		the event function was initially called with. You may connect as
	//		many methods to event as needed.
	//
	//		event must be a string. If obj is null, dojo.global is used.
	//
	//		null arguments may simply be omitted.
	//
	//		obj[event] can resolve to a function or undefined (null). 
	//		If obj[event] is null, it is assigned a function.
	//
	//		The return value is a handle that is needed to 
	//		remove this connection with dojo.disconnect.
	//
	// obj: 
	//		The source object for the event function. 
	//		Defaults to dojo.global if null.
	//		If obj is a DOM node, the connection is delegated 
	//		to the DOM event manager (unless dontFix is true).
	//
	// event:
	//		String name of the event function in obj. 
	//		I.e. identifies a property obj[event].
	//
	// context: 
	//		The object that method will receive as "this".
	//
	//		If context is null and method is a function, then method
	//		inherits the context of event.
	//	
	//		If method is a string then context must be the source 
	//		object object for method (context[method]). If context is null,
	//		dojo.global is used.
	//
	// method:
	//		A function reference, or name of a function in context. 
	//		The function identified by method fires after event does. 
	//		method receives the same arguments as the event.
	//		See context argument comments for information on method's scope.
	//
	// dontFix:
	//		If obj is a DOM node, set dontFix to true to prevent delegation 
	//		of this connection to the DOM event manager. 
	//
	// example:
	//		When obj.onchange(), do ui.update():
	//	|	dojo.connect(obj, "onchange", ui, "update");
	//	|	dojo.connect(obj, "onchange", ui, ui.update); // same
	//
	// example:
	//		Using return value for disconnect:
	//	|	var link = dojo.connect(obj, "onchange", ui, "update");
	//	|	...
	//	|	dojo.disconnect(link);
	//
	// example:
	//		When onglobalevent executes, watcher.handler is invoked:
	//	|	dojo.connect(null, "onglobalevent", watcher, "handler");
	//
	// example:
	//		When ob.onCustomEvent executes, customEventHandler is invoked:
	//	|	dojo.connect(ob, "onCustomEvent", null, "customEventHandler");
	//	|	dojo.connect(ob, "onCustomEvent", "customEventHandler"); // same
	//
	// example:
	//		When ob.onCustomEvent executes, customEventHandler is invoked
	//		with the same scope (this):
	//	|	dojo.connect(ob, "onCustomEvent", null, customEventHandler);
	//	|	dojo.connect(ob, "onCustomEvent", customEventHandler); // same
	//
	// example:
	//		When globalEvent executes, globalHandler is invoked
	//		with the same scope (this):
	//	|	dojo.connect(null, "globalEvent", null, globalHandler);
	//	|	dojo.connect("globalEvent", globalHandler); // same

	// normalize arguments
	var a=arguments, args=[], i=0;
	// if a[0] is a String, obj was ommited
	args.push(dojo.isString(a[0]) ? null : a[i++], a[i++]);
	// if the arg-after-next is a String or Function, context was NOT omitted
	var a1 = a[i+1];
	args.push(dojo.isString(a1)||dojo.isFunction(a1) ? a[i++] : null, a[i++]);
	// absorb any additional arguments
	for(var l=a.length; i<l; i++){	args.push(a[i]); }
	// do the actual work
	return dojo._connect.apply(this, args); /*Handle*/
}

// used by non-browser hostenvs. always overriden by event.js
dojo._connect = function(obj, event, context, method){
	var l=dojo._listener, h=l.add(obj, event, dojo.hitch(context, method)); 
	return [obj, event, h, l]; // Handle
}

dojo.disconnect = function(/*Handle*/ handle){
	// summary:
	//		Remove a link created by dojo.connect.
	// description:
	//		Removes the connection between event and the method referenced by handle.
	// handle:
	//		the return value of the dojo.connect call that created the connection.
	if(handle && handle[0] !== undefined){
		dojo._disconnect.apply(this, handle);
		// let's not keep this reference
		delete handle[0];
	}
}

dojo._disconnect = function(obj, event, handle, listener){
	listener.remove(obj, event, handle);
}

// topic publish/subscribe

dojo._topics = {};

dojo.subscribe = function(/*String*/ topic, /*Object|null*/ context, /*String|Function*/ method){
	//	summary:
	//		Attach a listener to a named topic. The listener function is invoked whenever the
	//		named topic is published (see: dojo.publish).
	//		Returns a handle which is needed to unsubscribe this listener.
	//	context:
	//		Scope in which method will be invoked, or null for default scope.
	//	method:
	//		The name of a function in context, or a function reference. This is the function that
	//		is invoked when topic is published.
	//	example:
	//	|	dojo.subscribe("alerts", null, function(caption, message){ alert(caption + "\n" + message); };
	//	|	dojo.publish("alerts", [ "read this", "hello world" ]);																	

	// support for 2 argument invocation (omitting context) depends on hitch
	return [topic, dojo._listener.add(dojo._topics, topic, dojo.hitch(context, method))]; /*Handle*/
}

dojo.unsubscribe = function(/*Handle*/ handle){
	//	summary:
	//	 	Remove a topic listener. 
	//	handle:
	//	 	The handle returned from a call to subscribe.
	//	example:
	//	|	var alerter = dojo.subscribe("alerts", null, function(caption, message){ alert(caption + "\n" + message); };
	//	|	...
	//	|	dojo.unsubscribe(alerter);
	if(handle){
		dojo._listener.remove(dojo._topics, handle[0], handle[1]);
	}
}

dojo.publish = function(/*String*/ topic, /*Array*/ args){
	//	summary:
	//	 	Invoke all listener method subscribed to topic.
	//	topic:
	//	 	The name of the topic to publish.
	//	args:
	//	 	An array of arguments. The arguments will be applied 
	//	 	to each topic subscriber (as first class parameters, via apply).
	//	example:
	//	|	dojo.subscribe("alerts", null, function(caption, message){ alert(caption + "\n" + message); };
	//	|	dojo.publish("alerts", [ "read this", "hello world" ]);	

	// Note that args is an array, which is more efficient vs variable length
	// argument list.  Ideally, var args would be implemented via Array
	// throughout the APIs.
	var f = dojo._topics[topic];
	if(f){
		f.apply(this, args||[]);
	}
}

dojo.connectPublisher = function(	/*String*/ topic, 
									/*Object|null*/ obj, 
									/*String*/ event){
	//	summary:
	//	 	Ensure that everytime obj.event() is called, a message is published
	//	 	on the topic. Returns a handle which can be passed to
	//	 	dojo.disconnect() to disable subsequent automatic publication on
	//	 	the topic.
	//	topic:
	//	 	The name of the topic to publish.
	//	obj: 
	//	 	The source object for the event function. Defaults to dojo.global
	//	 	if null.
	//	event:
	//	 	The name of the event function in obj. 
	//	 	I.e. identifies a property obj[event].
	//	example:
	//	|	dojo.connectPublisher("/ajax/start", dojo, "xhrGet");
	var pf = function(){ dojo.publish(topic, arguments); }
	return (event) ? dojo.connect(obj, event, pf) : dojo.connect(obj, pf); //Handle
};

}

if(!dojo._hasResource["dojo._base.Deferred"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.Deferred"] = true;
dojo.provide("dojo._base.Deferred");


dojo.Deferred = function(/*Function?*/ canceller){
	// summary:
	//		Encapsulates a sequence of callbacks in response to a value that
	//		may not yet be available.  This is modeled after the Deferred class
	//		from Twisted <http://twistedmatrix.com>.
	// description:
	//		JavaScript has no threads, and even if it did, threads are hard.
	//		Deferreds are a way of abstracting non-blocking events, such as the
	//		final response to an XMLHttpRequest. Deferreds create a promise to
	//		return a response a some point in the future and an easy way to
	//		register your interest in receiving that response.
	//
	//		The most important methods for Deffered users are:
	//
	//			* addCallback(handler)
	//			* addErrback(handler)
	//			* callback(result)
	//			* errback(result)
	//
	//		In general, when a function returns a Deferred, users then "fill
	//		in" the second half of the contract by registering callbacks and
	//		error handlers. You may register as many callback and errback
	//		handlers as you like and they will be executed in the order
	//		registered when a result is provided. Usually this result is
	//		provided as the result of an asynchronous operation. The code
	//		"managing" the Deferred (the code that made the promise to provide
	//		an answer later) will use the callback() and errback() methods to
	//		communicate with registered listeners about the result of the
	//		operation. At this time, all registered result handlers are called
	//		*with the most recent result value*.
	//
	//		Deferred callback handlers are treated as a chain, and each item in
	//		the chain is required to return a value that will be fed into
	//		successive handlers. The most minimal callback may be registered
	//		like this:
	//
	//		|	var d = new dojo.Deferred();
	//		|	d.addCallback(function(result){ return result; });
	//
	//		Perhaps the most common mistake when first using Deferreds is to
	//		forget to return a value (in most cases, the value you were
	//		passed).
	//
	//		The sequence of callbacks is internally represented as a list of
	//		2-tuples containing the callback/errback pair.  For example, the
	//		following call sequence:
	//		
	//		|	var d = new dojo.Deferred();
	//		|	d.addCallback(myCallback);
	//		|	d.addErrback(myErrback);
	//		|	d.addBoth(myBoth);
	//		|	d.addCallbacks(myCallback, myErrback);
	//
	//		is translated into a Deferred with the following internal
	//		representation:
	//
	//		|	[
	//		|		[myCallback, null],
	//		|		[null, myErrback],
	//		|		[myBoth, myBoth],
	//		|		[myCallback, myErrback]
	//		|	]
	//
	//		The Deferred also keeps track of its current status (fired).  Its
	//		status may be one of three things:
	//
	//			* -1: no value yet (initial condition)
	//			* 0: success
	//			* 1: error
	//	
	//		A Deferred will be in the error state if one of the following three
	//		conditions are met:
	//
	//			1. The result given to callback or errback is "instanceof" Error
	//			2. The previous callback or errback raised an exception while
	//			   executing
	//			3. The previous callback or errback returned a value
	//			   "instanceof" Error
	//
	//		Otherwise, the Deferred will be in the success state. The state of
	//		the Deferred determines the next element in the callback sequence
	//		to run.
	//
	//		When a callback or errback occurs with the example deferred chain,
	//		something equivalent to the following will happen (imagine
	//		that exceptions are caught and returned):
	//
	//		|	// d.callback(result) or d.errback(result)
	//		|	if(!(result instanceof Error)){
	//		|		result = myCallback(result);
	//		|	}
	//		|	if(result instanceof Error){
	//		|		result = myErrback(result);
	//		|	}
	//		|	result = myBoth(result);
	//		|	if(result instanceof Error){
	//		|		result = myErrback(result);
	//		|	}else{
	//		|		result = myCallback(result);
	//		|	}
	//
	//		The result is then stored away in case another step is added to the
	//		callback sequence.	Since the Deferred already has a value
	//		available, any new callbacks added will be called immediately.
	//
	//		There are two other "advanced" details about this implementation
	//		that are useful:
	//
	//		Callbacks are allowed to return Deferred instances themselves, so
	//		you can build complicated sequences of events with ease.
	//
	//		The creator of the Deferred may specify a canceller.  The canceller
	//		is a function that will be called if Deferred.cancel is called
	//		before the Deferred fires. You can use this to implement clean
	//		aborting of an XMLHttpRequest, etc. Note that cancel will fire the
	//		deferred with a CancelledError (unless your canceller returns
	//		another kind of error), so the errbacks should be prepared to
	//		handle that error for cancellable Deferreds.
	// example:
	//	|	var deferred = new dojo.Deferred();
	//	|	setTimeout(function(){ deferred.callback({success: true}); }, 1000);
	//	|	return deferred;
	// example:
	//		Deferred objects are often used when making code asynchronous. It
	//		may be easiest to write functions in a synchronous manner and then
	//		split code using a deferred to trigger a response to a long-lived
	//		operation. For example, instead of register a callback function to
	//		denote when a rendering operation completes, the function can
	//		simply return a deferred:
	//
	//		|	// callback style:
	//		|	function renderLotsOfData(data, callback){
	//		|		var success = false
	//		|		try{
	//		|			for(var x in data){
	//		|				renderDataitem(data[x]);
	//		|			}
	//		|			success = true;
	//		|		}catch(e){ }
	//		|		if(callback){
	//		|			callback(success);
	//		|		}
	//		|	}
	//
	//		|	// using callback style
	//		|	renderLotsOfData(someDataObj, function(success){
	//		|		// handles success or failure
	//		|		if(!success){
	//		|			promptUserToRecover();
	//		|		}
	//		|	});
	//		|	// NOTE: no way to add another callback here!!
	// example:
	//		Using a Deferred doesn't simplify the sending code any, but it
	//		provides a standard interface for callers and senders alike,
	//		providing both with a simple way to service multiple callbacks for
	//		an operation and freeing both sides from worrying about details
	//		such as "did this get called already?". With Deferreds, new
	//		callbacks can be added at any time.
	//
	//		|	// Deferred style:
	//		|	function renderLotsOfData(data){
	//		|		var d = new dojo.Deferred();
	//		|		try{
	//		|			for(var x in data){
	//		|				renderDataitem(data[x]);
	//		|			}
	//		|			d.callback(true);
	//		|		}catch(e){ 
	//		|			d.errback(new Error("rendering failed"));
	//		|		}
	//		|		return d;
	//		|	}
	//
	//		|	// using Deferred style
	//		|	renderLotsOfData(someDataObj).addErrback(function(){
	//		|		promptUserToRecover();
	//		|	});
	//		|	// NOTE: addErrback and addCallback both return the Deferred
	//		|	// again, so we could chain adding callbacks or save the
	//		|	// deferred for later should we need to be notified again.
	// example:
	//		In this example, renderLotsOfData is syncrhonous and so both
	//		versions are pretty artificial. Putting the data display on a
	//		timeout helps show why Deferreds rock:
	//
	//		|	// Deferred style and async func
	//		|	function renderLotsOfData(data){
	//		|		var d = new dojo.Deferred();
	//		|		setTimeout(function(){
	//		|			try{
	//		|				for(var x in data){
	//		|					renderDataitem(data[x]);
	//		|				}
	//		|				d.callback(true);
	//		|			}catch(e){ 
	//		|				d.errback(new Error("rendering failed"));
	//		|			}
	//		|		}, 100);
	//		|		return d;
	//		|	}
	//
	//		|	// using Deferred style
	//		|	renderLotsOfData(someDataObj).addErrback(function(){
	//		|		promptUserToRecover();
	//		|	});
	//
	//		Note that the caller doesn't have to change his code at all to
	//		handle the asynchronous case.

	this.chain = [];
	this.id = this._nextId();
	this.fired = -1;
	this.paused = 0;
	this.results = [null, null];
	this.canceller = canceller;
	this.silentlyCancelled = false;
};

dojo.extend(dojo.Deferred, {
	/*
	makeCalled: function(){
		// summary:
		//		returns a new, empty deferred, which is already in the called
		//		state. Calling callback() or errback() on this deferred will
		//		yeild an error and adding new handlers to it will result in
		//		them being called immediately.
		var deferred = new dojo.Deferred();
		deferred.callback();
		return deferred;
	},

	toString: function(){
		var state;
		if(this.fired == -1){
			state = 'unfired';
		}else{
			state = this.fired ? 'success' : 'error';
		}
		return 'Deferred(' + this.id + ', ' + state + ')';
	},
	*/

	_nextId: (function(){
		var n = 1;
		return function(){ return n++; };
	})(),

	cancel: function(){
		// summary:	
		//		Cancels a Deferred that has not yet received a value, or is
		//		waiting on another Deferred as its value.
		// description:
		//		If a canceller is defined, the canceller is called. If the
		//		canceller did not return an error, or there was no canceller,
		//		then the errback chain is started.
		var err;
		if(this.fired == -1){
			if(this.canceller){
				err = this.canceller(this);
			}else{
				this.silentlyCancelled = true;
			}
			if(this.fired == -1){
				if(!(err instanceof Error)){
					var res = err;
					err = new Error("Deferred Cancelled");
					err.dojoType = "cancel";
					err.cancelResult = res;
				}
				this.errback(err);
			}
		}else if(	(this.fired == 0) &&
					(this.results[0] instanceof dojo.Deferred)
		){
			this.results[0].cancel();
		}
	},
			

	_resback: function(res){
		// summary:
		//		The private primitive that means either callback or errback
		this.fired = ((res instanceof Error) ? 1 : 0);
		this.results[this.fired] = res;
		this._fire();
	},

	_check: function(){
		if(this.fired != -1){
			if(!this.silentlyCancelled){
				throw new Error("already called!");
			}
			this.silentlyCancelled = false;
			return;
		}
	},

	callback: function(res){
		//	summary:	
		//		Begin the callback sequence with a non-error value.
		
		/*
		callback or errback should only be called once on a given
		Deferred.
		*/
		this._check();
		this._resback(res);
	},

	errback: function(/*Error*/res){
		//	summary: 
		//		Begin the callback sequence with an error result.
		this._check();
		if(!(res instanceof Error)){
			res = new Error(res);
		}
		this._resback(res);
	},

	addBoth: function(/*Function|Object*/cb, /*String?*/cbfn){
		//	summary:
		//		Add the same function as both a callback and an errback as the
		//		next element on the callback sequence.This is useful for code
		//		that you want to guarantee to run, e.g. a finalizer.
		var enclosed = dojo.hitch.apply(dojo, arguments);
		return this.addCallbacks(enclosed, enclosed); // dojo.Deferred
	},

	addCallback: function(/*Function|Object*/cb, /*String?*/cbfn /*...*/){
		//	summary: 
		//		Add a single callback to the end of the callback sequence.
		return this.addCallbacks(dojo.hitch.apply(dojo, arguments)); // dojo.Deferred
	},

	addErrback: function(cb, cbfn){
		//	summary: 
		//		Add a single callback to the end of the callback sequence.
		return this.addCallbacks(null, dojo.hitch.apply(dojo, arguments)); // dojo.Deferred
	},

	addCallbacks: function(cb, eb){
		// summary: 
		//		Add separate callback and errback to the end of the callback
		//		sequence.
		this.chain.push([cb, eb])
		if(this.fired >= 0){
			this._fire();
		}
		return this; // dojo.Deferred
	},

	_fire: function(){
		// summary: 
		//		Used internally to exhaust the callback sequence when a result
		//		is available.
		var chain = this.chain;
		var fired = this.fired;
		var res = this.results[fired];
		var self = this;
		var cb = null;
		while(
			(chain.length > 0) &&
			(this.paused == 0)
		){
			// Array
			var f = chain.shift()[fired];
			if(!f){ continue; }
			var func = function(){
				var ret = f(res);
				//If no response, then use previous response.
				if(typeof ret != "undefined"){
					res = ret;
				}
				fired = ((res instanceof Error) ? 1 : 0);
				if(res instanceof dojo.Deferred){
					cb = function(res){
						self._resback(res);
						// inlined from _pause()
						self.paused--;
						if(
							(self.paused == 0) && 
							(self.fired >= 0)
						){
							self._fire();
						}
					}
					// inlined from _unpause
					this.paused++;
				}
			};
			if(dojo.config.isDebug){
				func.call(this);
			}else{
				try{
					func.call(this);
				}catch(err){
					fired = 1;
					res = err;
				}
			}
		}
		this.fired = fired;
		this.results[fired] = res;
		if((cb)&&(this.paused)){
			// this is for "tail recursion" in case the dependent
			// deferred is already fired
			res.addBoth(cb);
		}
	}
});

}

if(!dojo._hasResource["dojo._base.json"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.json"] = true;
dojo.provide("dojo._base.json");

dojo.fromJson = function(/*String*/ json){
	// summary:
	// 		Parses a [JSON](http://json.org) string to return a JavaScript object.  Throws for invalid JSON strings.
	// json: 
	//		a string literal of a JSON item, for instance:
	//			`'{ "foo": [ "bar", 1, { "baz": "thud" } ] }'`

	return eval("(" + json + ")"); // Object
}

dojo._escapeString = function(/*String*/str){
	//summary:
	//		Adds escape sequences for non-visual characters, double quote and
	//		backslash and surrounds with double quotes to form a valid string
	//		literal.
	return ('"' + str.replace(/(["\\])/g, '\\$1') + '"').
		replace(/[\f]/g, "\\f").replace(/[\b]/g, "\\b").replace(/[\n]/g, "\\n").
		replace(/[\t]/g, "\\t").replace(/[\r]/g, "\\r"); // string
}

dojo.toJsonIndentStr = "\t";
dojo.toJson = function(/*Object*/ it, /*Boolean?*/ prettyPrint, /*String?*/ _indentStr){
	// summary:
	//		Returns a [JSON](http://json.org) serialization of an object.
	//
	// description:
	//		Returns a [JSON](http://json.org) serialization of an object.
	//		Note that this doesn't check for infinite recursion, so don't do that!
	//
	// it:
	//		an object to be serialized. Objects may define their own
	//		serialization via a special "__json__" or "json" function
	//		property. If a specialized serializer has been defined, it will
	//		be used as a fallback.
	//
	// prettyPrint:
	//		if true, we indent objects and arrays to make the output prettier.
	//		The variable dojo.toJsonIndentStr is used as the indent string 
	//		-- to use something other than the default (tab), 
	//		change that variable before calling dojo.toJson().
	//
	// _indentStr:
	//		private variable for recursive calls when pretty printing, do not use.

	if(it === undefined){
		return "undefined";
	}
	var objtype = typeof it;
	if(objtype == "number" || objtype == "boolean"){
		return it + "";
	}
	if(it === null){
		return "null";
	}
	if(dojo.isString(it)){ 
		return dojo._escapeString(it); 
	}
	// recurse
	var recurse = arguments.callee;
	// short-circuit for objects that support "json" serialization
	// if they return "self" then just pass-through...
	var newObj;
	_indentStr = _indentStr || "";
	var nextIndent = prettyPrint ? _indentStr + dojo.toJsonIndentStr : "";
	var tf = it.__json__||it.json;
	if(dojo.isFunction(tf)){
		newObj = tf.call(it);
		if(it !== newObj){
			return recurse(newObj, prettyPrint, nextIndent);
		}
	}
	if(it.nodeType && it.cloneNode){ // isNode
		// we can't seriailize DOM nodes as regular objects because they have cycles
		// DOM nodes could be serialized with something like outerHTML, but
		// that can be provided by users in the form of .json or .__json__ function.
		throw new Error("Can't serialize DOM nodes");
	}

	var sep = prettyPrint ? " " : "";
	var newLine = prettyPrint ? "\n" : "";

	// array
	if(dojo.isArray(it)){
		var res = dojo.map(it, function(obj){
			var val = recurse(obj, prettyPrint, nextIndent);
			if(typeof val != "string"){
				val = "undefined";
			}
			return newLine + nextIndent + val;
		});
		return "[" + res.join("," + sep) + newLine + _indentStr + "]";
	}
	/*
	// look in the registry
	try {
		window.o = it;
		newObj = dojo.json.jsonRegistry.match(it);
		return recurse(newObj, prettyPrint, nextIndent);
	}catch(e){
		// console.debug(e);
	}
	// it's a function with no adapter, skip it
	*/
	if(objtype == "function"){
		return null; // null
	}
	// generic object code path
	var output = [], key;
	for(key in it){
		var keyStr, val;
		if(typeof key == "number"){
			keyStr = '"' + key + '"';
		}else if(typeof key == "string"){
			keyStr = dojo._escapeString(key);
		}else{
			// skip non-string or number keys
			continue;
		}
		val = recurse(it[key], prettyPrint, nextIndent);
		if(typeof val != "string"){
			// skip non-serializable values
			continue;
		}
		// FIXME: use += on Moz!!
		//	 MOW NOTE: using += is a pain because you have to account for the dangling comma...
		output.push(newLine + nextIndent + keyStr + ":" + sep + val);
	}
	return "{" + output.join("," + sep) + newLine + _indentStr + "}"; // String
}

}

if(!dojo._hasResource["dojo._base.array"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.array"] = true;

dojo.provide("dojo._base.array");

(function(){
	var _getParts = function(arr, obj, cb){
		return [ 
			dojo.isString(arr) ? arr.split("") : arr, 
			obj || dojo.global,
			// FIXME: cache the anonymous functions we create here?
			dojo.isString(cb) ? new Function("item", "index", "array", cb) : cb
		];
	};

	dojo.mixin(dojo, {
		indexOf: function(	/*Array*/		array, 
							/*Object*/		value,
							/*Integer?*/	fromIndex,
							/*Boolean?*/	findLast){
			// summary:
			//		locates the first index of the provided value in the
			//		passed array. If the value is not found, -1 is returned.
			// description:
			//		For details on this method, see:
			// 			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:indexOf

			var step = 1, end = array.length || 0, i = 0;
			if(findLast){
				i = end - 1;
				step = end = -1;
			}
			if(fromIndex != undefined){ i = fromIndex; }
			if((findLast && i > end) || i < end){
				for(; i != end; i += step){
					if(array[i] == value){ return i; }
				}
			}
			return -1;	// Number
		},

		lastIndexOf: function(/*Array*/array, /*Object*/value, /*Integer?*/fromIndex){
			// summary:
			//		locates the last index of the provided value in the passed
			//		array. If the value is not found, -1 is returned.
			// description:
			//		For details on this method, see:
			// 			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:lastIndexOf
			return dojo.indexOf(array, value, fromIndex, true); // Number
		},

		forEach: function(/*Array|String*/arr, /*Function|String*/callback, /*Object?*/thisObject){
			//	summary:
			//		for every item in arr, callback is invoked. Return values are ignored.
			//	arr:
			//		the array to iterate over. If a string, operates on individual characters.
			//	callback:
			//		a function is invoked with three arguments: item, index, and array
			//	thisObject:
			//		may be used to scope the call to callback
			//	description:
			//		This function corresponds to the JavaScript 1.6
			//		Array.forEach() method. For more details, see:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:forEach
			//	example:
			//	|	// log out all members of the array:
			//	|	dojo.forEach(
			//	|		[ "thinger", "blah", "howdy", 10 ],
			//	|		function(item){
			//	|			console.debug(item);
			//	|		}
			//	|	);
			//	example:
			//	|	// log out the members and their indexes
			//	|	dojo.forEach(
			//	|		[ "thinger", "blah", "howdy", 10 ],
			//	|		function(item, idx, arr){
			//	|			console.debug(item, "at index:", idx);
			//	|		}
			//	|	);
			//	example:
			//	|	// use a scoped object member as the callback
			//	|	
			//	|	var obj = {
			//	|		prefix: "logged via obj.callback:", 
			//	|		callback: function(item){
			//	|			console.debug(this.prefix, item);
			//	|		}
			//	|	};
			//	|	
			//	|	// specifying the scope function executes the callback in that scope
			//	|	dojo.forEach(
			//	|		[ "thinger", "blah", "howdy", 10 ],
			//	|		obj.callback,
			//	|		obj
			//	|	);
			//	|	
			//	|	// alternately, we can accomplish the same thing with dojo.hitch()
			//	|	dojo.forEach(
			//	|		[ "thinger", "blah", "howdy", 10 ],
			//	|		dojo.hitch(obj, "callback")
			//	|	);

			// match the behavior of the built-in forEach WRT empty arrs
			if(!arr || !arr.length){ return; }

			// FIXME: there are several ways of handilng thisObject. Is
			// dojo.global always the default context?
			var _p = _getParts(arr, thisObject, callback); arr = _p[0];
			for(var i=0,l=arr.length; i<l; ++i){ 
				_p[2].call(_p[1], arr[i], i, arr);
			}
		},

		_everyOrSome: function(/*Boolean*/every, /*Array|String*/arr, /*Function|String*/callback, /*Object?*/thisObject){
			var _p = _getParts(arr, thisObject, callback); arr = _p[0];
			for(var i=0,l=arr.length; i<l; ++i){
				var result = !!_p[2].call(_p[1], arr[i], i, arr);
				if(every ^ result){
					return result; // Boolean
				}
			}
			return every; // Boolean
		},

		every: function(/*Array|String*/arr, /*Function|String*/callback, /*Object?*/thisObject){
			// summary:
			//		Determines whether or not every item in arr satisfies the
			//		condition implemented by callback.
			// arr:
			//		the array to iterate on. If a string, operates on individual characters.
			// callback:
			//		a function is invoked with three arguments: item, index,
			//		and array and returns true if the condition is met.
			// thisObject:
			//		may be used to scope the call to callback
			// description:
			//		This function corresponds to the JavaScript 1.6
			//		Array.every() method. For more details, see:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:every
			// example:
			//	|	// returns false
			//	|	dojo.every([1, 2, 3, 4], function(item){ return item>1; });
			// example:
			//	|	// returns true 
			//	|	dojo.every([1, 2, 3, 4], function(item){ return item>0; });
			return this._everyOrSome(true, arr, callback, thisObject); // Boolean
		},

		some: function(/*Array|String*/arr, /*Function|String*/callback, /*Object?*/thisObject){
			// summary:
			//		Determines whether or not any item in arr satisfies the
			//		condition implemented by callback.
			// arr:
			//		the array to iterate over. If a string, operates on individual characters.
			// callback:
			//		a function is invoked with three arguments: item, index,
			//		and array and returns true if the condition is met.
			// thisObject:
			//		may be used to scope the call to callback
			// description:
			//		This function corresponds to the JavaScript 1.6
			//		Array.some() method. For more details, see:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:some
			// example:
			//	|	// is true
			//	|	dojo.some([1, 2, 3, 4], function(item){ return item>1; });
			// example:
			//	|	// is false
			//	|	dojo.some([1, 2, 3, 4], function(item){ return item<1; });
			return this._everyOrSome(false, arr, callback, thisObject); // Boolean
		},

		map: function(/*Array|String*/arr, /*Function|String*/callback, /*Function?*/thisObject){
			// summary:
			//		applies callback to each element of arr and returns
			//		an Array with the results
			// arr:
			//		the array to iterate on. If a string, operates on
			//		individual characters.
			// callback:
			//		a function is invoked with three arguments, (item, index,
			//		array),  and returns a value
			// thisObject:
			//		may be used to scope the call to callback
			// description:
			//		This function corresponds to the JavaScript 1.6 Array.map()
			//		method. For more details, see:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:map
			// example:
			//	|	// returns [2, 3, 4, 5]
			//	|	dojo.map([1, 2, 3, 4], function(item){ return item+1 });

			var _p = _getParts(arr, thisObject, callback); arr = _p[0];
			var outArr = (arguments[3] ? (new arguments[3]()) : []);
			for(var i=0,l=arr.length; i<l; ++i){
				outArr.push(_p[2].call(_p[1], arr[i], i, arr));
			}
			return outArr; // Array
		},

		filter: function(/*Array*/arr, /*Function|String*/callback, /*Object?*/thisObject){
			// summary:
			//		Returns a new Array with those items from arr that match the
			//		condition implemented by callback.
			// arr:
			//		the array to iterate over.
			// callback:
			//		a function that is invoked with three arguments (item,
			//		index, array). The return of this function is expected to
			//		be a boolean which determines whether the passed-in item
			//		will be included in the returned array.
			// thisObject:
			//		may be used to scope the call to callback
			// description:
			//		This function corresponds to the JavaScript 1.6
			//		Array.filter() method. For more details, see:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:filter
			// example:
			//	|	// returns [2, 3, 4]
			//	|	dojo.filter([1, 2, 3, 4], function(item){ return item>1; });

			var _p = _getParts(arr, thisObject, callback); arr = _p[0];
			var outArr = [];
			for(var i=0,l=arr.length; i<l; ++i){
				if(_p[2].call(_p[1], arr[i], i, arr)){
					outArr.push(arr[i]);
				}
			}
			return outArr; // Array
		}
	});
})();

}

if(!dojo._hasResource["dojo._base.Color"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.Color"] = true;
dojo.provide("dojo._base.Color");



dojo.Color = function(/*Array|String|Object*/ color){
	// summary:
	//		takes a named string, hex string, array of rgb or rgba values,
	//		an object with r, g, b, and a properties, or another dojo.Color object
	if(color){ this.setColor(color); }
};

// FIXME: there's got to be a more space-efficient way to encode or discover these!!  Use hex?
dojo.Color.named = {
	black:      [0,0,0],
	silver:     [192,192,192],
	gray:       [128,128,128],
	white:      [255,255,255],
	maroon:		[128,0,0],
	red:        [255,0,0],
	purple:		[128,0,128],
	fuchsia:	[255,0,255],
	green:	    [0,128,0],
	lime:	    [0,255,0],
	olive:		[128,128,0],
	yellow:		[255,255,0],
	navy:       [0,0,128],
	blue:       [0,0,255],
	teal:		[0,128,128],
	aqua:		[0,255,255]
};


dojo.extend(dojo.Color, {
	r: 255, g: 255, b: 255, a: 1,
	_set: function(r, g, b, a){
		var t = this; t.r = r; t.g = g; t.b = b; t.a = a;
	},
	setColor: function(/*Array|String|Object*/ color){
		// summary:
		//		takes a named string, hex string, array of rgb or rgba values,
		//		an object with r, g, b, and a properties, or another dojo.Color object
		var d = dojo;
		if(d.isString(color)){
			d.colorFromString(color, this);
		}else if(d.isArray(color)){
			d.colorFromArray(color, this);
		}else{
			this._set(color.r, color.g, color.b, color.a);
			if(!(color instanceof d.Color)){ this.sanitize(); }
		}
		return this;	// dojo.Color
	},
	sanitize: function(){
		// summary:
		//		makes sure that the object has correct attributes
		// description: 
		//		the default implementation does nothing, include dojo.colors to
		//		augment it to real checks
		return this;	// dojo.Color
	},
	toRgb: function(){
		// summary: returns 3 component array of rgb values
		var t = this;
		return [t.r, t.g, t.b];	// Array
	},
	toRgba: function(){
		// summary: returns a 4 component array of rgba values
		var t = this;
		return [t.r, t.g, t.b, t.a];	// Array
	},
	toHex: function(){
		// summary: returns a css color string in hexadecimal representation
		var arr = dojo.map(["r", "g", "b"], function(x){
			var s = this[x].toString(16);
			return s.length < 2 ? "0" + s : s;
		}, this);
		return "#" + arr.join("");	// String
	},
	toCss: function(/*Boolean?*/ includeAlpha){
		// summary: returns a css color string in rgb(a) representation
		var t = this, rgb = t.r + ", " + t.g + ", " + t.b;
		return (includeAlpha ? "rgba(" + rgb + ", " + t.a : "rgb(" + rgb) + ")";	// String
	},
	toString: function(){
		// summary: returns a visual representation of the color
		return this.toCss(true); // String
	}
});

dojo.blendColors = function(
	/*dojo.Color*/ start, 
	/*dojo.Color*/ end, 
	/*Number*/ weight,
	/*dojo.Color?*/ obj
){
	// summary: 
	//		blend colors end and start with weight from 0 to 1, 0.5 being a 50/50 blend,
	//		can reuse a previously allocated dojo.Color object for the result
	var d = dojo, t = obj || new dojo.Color();
	d.forEach(["r", "g", "b", "a"], function(x){
		t[x] = start[x] + (end[x] - start[x]) * weight;
		if(x != "a"){ t[x] = Math.round(t[x]); }
	});
	return t.sanitize();	// dojo.Color
};

dojo.colorFromRgb = function(/*String*/ color, /*dojo.Color?*/ obj){
	// summary: get rgb(a) array from css-style color declarations
	var m = color.toLowerCase().match(/^rgba?\(([\s\.,0-9]+)\)/);
	return m && dojo.colorFromArray(m[1].split(/\s*,\s*/), obj);	// dojo.Color
};

dojo.colorFromHex = function(/*String*/ color, /*dojo.Color?*/ obj){
	// summary: converts a hex string with a '#' prefix to a color object.
	//	Supports 12-bit #rgb shorthand.
	var d = dojo, t = obj || new d.Color(),
		bits = (color.length == 4) ? 4 : 8,
		mask = (1 << bits) - 1;
	color = Number("0x" + color.substr(1));
	if(isNaN(color)){
		return null; // dojo.Color
	}
	d.forEach(["b", "g", "r"], function(x){
		var c = color & mask;
		color >>= bits;
		t[x] = bits == 4 ? 17 * c : c;
	});
	t.a = 1;
	return t;	// dojo.Color
};

dojo.colorFromArray = function(/*Array*/ a, /*dojo.Color?*/ obj){
	// summary: builds a color from 1, 2, 3, or 4 element array
	var t = obj || new dojo.Color();
	t._set(Number(a[0]), Number(a[1]), Number(a[2]), Number(a[3]));
	if(isNaN(t.a)){ t.a = 1; }
	return t.sanitize();	// dojo.Color
};

dojo.colorFromString = function(/*String*/ str, /*dojo.Color?*/ obj){
	//	summary:
	//		parses str for a color value.
	//	description:
	//		Acceptable input values for str may include arrays of any form
	//		accepted by dojo.colorFromArray, hex strings such as "#aaaaaa", or
	//		rgb or rgba strings such as "rgb(133, 200, 16)" or "rgba(10, 10,
	//		10, 50)"
	//	returns:
	//		a dojo.Color object. If obj is passed, it will be the return value.
	var a = dojo.Color.named[str];
	return a && dojo.colorFromArray(a, obj) || dojo.colorFromRgb(str, obj) || dojo.colorFromHex(str, obj);
};

}

if(!dojo._hasResource["dojo._base"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base"] = true;
dojo.provide("dojo._base");









}

if(!dojo._hasResource["dojo._base.window"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.window"] = true;
dojo.provide("dojo._base.window");

/*=====
dojo.doc = {
	// summary:
	//		Alias for the current document. 'dojo.doc' can be modified
	//		for temporary context shifting. Also see dojo.withDoc().
	// description:
	//    Refer to dojo.doc rather
	//    than referring to 'window.document' to ensure your code runs
	//    correctly in managed contexts.
	// example:
	// 	|	n.appendChild(dojo.doc.createElement('div'));
}
=====*/
dojo.doc = window["document"] || null;

dojo.body = function(){
	// summary:
	//		Return the body element of the document
	//		return the body object associated with dojo.doc
	// example:
	// 	|	dojo.body().appendChild(dojo.doc.createElement('div'));

	// Note: document.body is not defined for a strict xhtml document
	// Would like to memoize this, but dojo.doc can change vi dojo.withDoc().
	return dojo.doc.body || dojo.doc.getElementsByTagName("body")[0]; // Node
}

dojo.setContext = function(/*Object*/globalObject, /*DocumentElement*/globalDocument){
	// summary:
	//		changes the behavior of many core Dojo functions that deal with
	//		namespace and DOM lookup, changing them to work in a new global
	//		context (e.g., an iframe). The varibles dojo.global and dojo.doc
	//		are modified as a result of calling this function and the result of
	//		`dojo.body()` likewise differs.
	dojo.global = globalObject;
	dojo.doc = globalDocument;
};

dojo._fireCallback = function(callback, context, cbArguments){
	if(context && dojo.isString(callback)){
		callback = context[callback];
	}
	return callback.apply(context, cbArguments || [ ]);
}

dojo.withGlobal = function(	/*Object*/globalObject, 
							/*Function*/callback, 
							/*Object?*/thisObject, 
							/*Array?*/cbArguments){
	// summary:
	//		Call callback with globalObject as dojo.global and
	//		globalObject.document as dojo.doc. If provided, globalObject
	//		will be executed in the context of object thisObject
	// description:
	//		When callback() returns or throws an error, the dojo.global
	//		and dojo.doc will be restored to its previous state.
	var rval;
	var oldGlob = dojo.global;
	var oldDoc = dojo.doc;
	try{
		dojo.setContext(globalObject, globalObject.document);
		rval = dojo._fireCallback(callback, thisObject, cbArguments);
	}finally{
		dojo.setContext(oldGlob, oldDoc);
	}
	return rval;
}

dojo.withDoc = function(	/*Object*/documentObject, 
							/*Function*/callback, 
							/*Object?*/thisObject, 
							/*Array?*/cbArguments){
	// summary:
	//		Call callback with documentObject as dojo.doc. If provided,
	//		callback will be executed in the context of object thisObject
	// description:
	//		When callback() returns or throws an error, the dojo.doc will
	//		be restored to its previous state.
	var rval;
	var oldDoc = dojo.doc;
	try{
		dojo.doc = documentObject;
		rval = dojo._fireCallback(callback, thisObject, cbArguments);
	}finally{
		dojo.doc = oldDoc;
	}
	return rval;
};

}

if(!dojo._hasResource["dojo._base.event"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.event"] = true;
dojo.provide("dojo._base.event");


// this file courtesy of the TurboAjax Group, licensed under a Dojo CLA

(function(){
	// DOM event listener machinery
	var del = (dojo._event_listener = {
		add: function(/*DOMNode*/node, /*String*/name, /*Function*/fp){
			if(!node){return;} 
			name = del._normalizeEventName(name);
			fp = del._fixCallback(name, fp);
			var oname = name;
			if(!dojo.isIE && (name == "mouseenter" || name == "mouseleave")){
				var ofp = fp;
				//oname = name;
				name = (name == "mouseenter") ? "mouseover" : "mouseout";
				fp = function(e){
					// check tagName to fix a FF2 bug with invalid nodes (hidden child DIV of INPUT)
					// which causes isDecendant to return false which causes
					// spurious, and more importantly, incorrect mouse events to fire.
					// TODO: remove tagName check when Firefox 2 is no longer supported
					try{ e.relatedTarget.tagName; }catch(e2){ return; }
					if(!dojo.isDescendant(e.relatedTarget, node)){
						// e.type = oname; // FIXME: doesn't take? SJM: event.type is generally immutable.
						return ofp.call(this, e); 
					}
				}
			}
			node.addEventListener(name, fp, false);
			return fp; /*Handle*/
		},
		remove: function(/*DOMNode*/node, /*String*/event, /*Handle*/handle){
			// summary:
			//		clobbers the listener from the node
			// node:
			//		DOM node to attach the event to
			// event:
			//		the name of the handler to remove the function from
			// handle:
			//		the handle returned from add
			if(node){
				event = del._normalizeEventName(event);
				if(!dojo.isIE && (event == "mouseenter" || event == "mouseleave")){
					event = (event == "mouseenter") ? "mouseover" : "mouseout";
				}

				node.removeEventListener(event, handle, false);
			}
		},
		_normalizeEventName: function(/*String*/name){
			// Generally, name should be lower case, unless it is special
			// somehow (e.g. a Mozilla DOM event).
			// Remove 'on'.
			return name.slice(0,2) =="on" ? name.slice(2) : name;
		},
		_fixCallback: function(/*String*/name, fp){
			// By default, we only invoke _fixEvent for 'keypress'
			// If code is added to _fixEvent for other events, we have
			// to revisit this optimization.
			// This also applies to _fixEvent overrides for Safari and Opera
			// below.
			return name != "keypress" ? fp : function(e){ return fp.call(this, del._fixEvent(e, this)); };
		},
		_fixEvent: function(evt, sender){
			// _fixCallback only attaches us to keypress.
			// Switch on evt.type anyway because we might 
			// be called directly from dojo.fixEvent.
			switch(evt.type){
				case "keypress":
					del._setKeyChar(evt);
					break;
			}
			return evt;
		},
		_setKeyChar: function(evt){
			evt.keyChar = evt.charCode ? String.fromCharCode(evt.charCode) : '';
			evt.charOrCode = evt.keyChar || evt.keyCode;
		},
		// For IE and Safari: some ctrl-key combinations (mostly w/punctuation) do not emit a char code in IE
		// we map those virtual key codes to ascii here
		// not valid for all (non-US) keyboards, so maybe we shouldn't bother
		_punctMap: { 
			106:42, 
			111:47, 
			186:59, 
			187:43, 
			188:44, 
			189:45, 
			190:46, 
			191:47, 
			192:96, 
			219:91, 
			220:92, 
			221:93, 
			222:39 
		}
	});

	// DOM events
	
	dojo.fixEvent = function(/*Event*/evt, /*DOMNode*/sender){
		// summary:
		//		normalizes properties on the event object including event
		//		bubbling methods, keystroke normalization, and x/y positions
		// evt: Event
		//		native event object
		// sender: DOMNode
		//		node to treat as "currentTarget"
		return del._fixEvent(evt, sender);
	}

	dojo.stopEvent = function(/*Event*/evt){
		// summary:
		//		prevents propagation and clobbers the default action of the
		//		passed event
		// evt: Event
		//		The event object. If omitted, window.event is used on IE.
		evt.preventDefault();
		evt.stopPropagation();
		// NOTE: below, this method is overridden for IE
	}

	// the default listener to use on dontFix nodes, overriden for IE
	var node_listener = dojo._listener;
	
	// Unify connect and event listeners
	dojo._connect = function(obj, event, context, method, dontFix){
		// FIXME: need a more strict test
		var isNode = obj && (obj.nodeType||obj.attachEvent||obj.addEventListener);
		// choose one of three listener options: raw (connect.js), DOM event on a Node, custom event on a Node
		// we need the third option to provide leak prevention on broken browsers (IE)
		var lid = isNode ? (dontFix ? 2 : 1) : 0, l = [dojo._listener, del, node_listener][lid];
		// create a listener
		var h = l.add(obj, event, dojo.hitch(context, method));
		// formerly, the disconnect package contained "l" directly, but if client code
		// leaks the disconnect package (by connecting it to a node), referencing "l" 
		// compounds the problem.
		// instead we return a listener id, which requires custom _disconnect below.
		// return disconnect package
		return [ obj, event, h, lid ];
	}

	dojo._disconnect = function(obj, event, handle, listener){
		([dojo._listener, del, node_listener][listener]).remove(obj, event, handle);
	}

	// Constants

	// Public: client code should test
	// keyCode against these named constants, as the
	// actual codes can vary by browser.
	dojo.keys = {
		// summary: definitions for common key values
		BACKSPACE: 8,
		TAB: 9,
		CLEAR: 12,
		ENTER: 13,
		SHIFT: 16,
		CTRL: 17,
		ALT: 18,
		PAUSE: 19,
		CAPS_LOCK: 20,
		ESCAPE: 27,
		SPACE: 32,
		PAGE_UP: 33,
		PAGE_DOWN: 34,
		END: 35,
		HOME: 36,
		LEFT_ARROW: 37,
		UP_ARROW: 38,
		RIGHT_ARROW: 39,
		DOWN_ARROW: 40,
		INSERT: 45,
		DELETE: 46,
		HELP: 47,
		LEFT_WINDOW: 91,
		RIGHT_WINDOW: 92,
		SELECT: 93,
		NUMPAD_0: 96,
		NUMPAD_1: 97,
		NUMPAD_2: 98,
		NUMPAD_3: 99,
		NUMPAD_4: 100,
		NUMPAD_5: 101,
		NUMPAD_6: 102,
		NUMPAD_7: 103,
		NUMPAD_8: 104,
		NUMPAD_9: 105,
		NUMPAD_MULTIPLY: 106,
		NUMPAD_PLUS: 107,
		NUMPAD_ENTER: 108,
		NUMPAD_MINUS: 109,
		NUMPAD_PERIOD: 110,
		NUMPAD_DIVIDE: 111,
		F1: 112,
		F2: 113,
		F3: 114,
		F4: 115,
		F5: 116,
		F6: 117,
		F7: 118,
		F8: 119,
		F9: 120,
		F10: 121,
		F11: 122,
		F12: 123,
		F13: 124,
		F14: 125,
		F15: 126,
		NUM_LOCK: 144,
		SCROLL_LOCK: 145
	};
	
	// IE event normalization
	if(dojo.isIE){ 
		var _trySetKeyCode = function(e, code){
			try{
				// squelch errors when keyCode is read-only
				// (e.g. if keyCode is ctrl or shift)
				return (e.keyCode = code);
			}catch(e){
				return 0;
			}
		}

		// by default, use the standard listener
		var iel = dojo._listener;
		var listenersName = (dojo._ieListenersName = "_" + dojo._scopeName + "_listeners");
		// dispatcher tracking property
		if(!dojo.config._allow_leaks){
			// custom listener that handles leak protection for DOM events
			node_listener = iel = dojo._ie_listener = {
				// support handler indirection: event handler functions are 
				// referenced here. Event dispatchers hold only indices.
				handlers: [],
				// add a listener to an object
				add: function(/*Object*/ source, /*String*/ method, /*Function*/ listener){
					source = source || dojo.global;
					var f = source[method];
					if(!f||!f[listenersName]){
						var d = dojo._getIeDispatcher();
						// original target function is special
						d.target = f && (ieh.push(f) - 1);
						// dispatcher holds a list of indices into handlers table
						d[listenersName] = [];
						// redirect source to dispatcher
						f = source[method] = d;
					}
					return f[listenersName].push(ieh.push(listener) - 1) ; /*Handle*/
				},
				// remove a listener from an object
				remove: function(/*Object*/ source, /*String*/ method, /*Handle*/ handle){
					var f = (source||dojo.global)[method], l = f && f[listenersName];
					if(f && l && handle--){
						delete ieh[l[handle]];
						delete l[handle];
					}
				}
			};
			// alias used above
			var ieh = iel.handlers;
		}

		dojo.mixin(del, {
			add: function(/*DOMNode*/node, /*String*/event, /*Function*/fp){
				if(!node){return;} // undefined
				event = del._normalizeEventName(event);
				if(event=="onkeypress"){
					// we need to listen to onkeydown to synthesize
					// keypress events that otherwise won't fire
					// on IE
					var kd = node.onkeydown;
					if(!kd || !kd[listenersName] || !kd._stealthKeydownHandle){
						var h = del.add(node, "onkeydown", del._stealthKeyDown);
						kd = node.onkeydown;
						kd._stealthKeydownHandle = h;
						kd._stealthKeydownRefs = 1;
					}else{
						kd._stealthKeydownRefs++;
					}
				}
				return iel.add(node, event, del._fixCallback(fp));
			},
			remove: function(/*DOMNode*/node, /*String*/event, /*Handle*/handle){
				event = del._normalizeEventName(event);
				iel.remove(node, event, handle); 
				if(event=="onkeypress"){
					var kd = node.onkeydown;
					if(--kd._stealthKeydownRefs <= 0){
						iel.remove(node, "onkeydown", kd._stealthKeydownHandle);
						delete kd._stealthKeydownHandle;
					}
				}
			},
			_normalizeEventName: function(/*String*/eventName){
				// Generally, eventName should be lower case, unless it is
				// special somehow (e.g. a Mozilla event)
				// ensure 'on'
				return eventName.slice(0,2) != "on" ? "on" + eventName : eventName;
			},
			_nop: function(){},
			_fixEvent: function(/*Event*/evt, /*DOMNode*/sender){
				// summary:
				//		normalizes properties on the event object including event
				//		bubbling methods, keystroke normalization, and x/y positions
				// evt: native event object
				// sender: node to treat as "currentTarget"
				if(!evt){
					var w = sender && (sender.ownerDocument || sender.document || sender).parentWindow || window;
					evt = w.event; 
				}
				if(!evt){return(evt);}
				evt.target = evt.srcElement; 
				evt.currentTarget = (sender || evt.srcElement); 
				evt.layerX = evt.offsetX;
				evt.layerY = evt.offsetY;
				// FIXME: scroll position query is duped from dojo.html to
				// avoid dependency on that entire module. Now that HTML is in
				// Base, we should convert back to something similar there.
				var se = evt.srcElement, doc = (se && se.ownerDocument) || document;
				// DO NOT replace the following to use dojo.body(), in IE, document.documentElement should be used
				// here rather than document.body
				var docBody = ((dojo.isIE < 6) || (doc["compatMode"] == "BackCompat")) ? doc.body : doc.documentElement;
				var offset = dojo._getIeDocumentElementOffset();
				evt.pageX = evt.clientX + dojo._fixIeBiDiScrollLeft(docBody.scrollLeft || 0) - offset.x;
				evt.pageY = evt.clientY + (docBody.scrollTop || 0) - offset.y;
				if(evt.type == "mouseover"){ 
					evt.relatedTarget = evt.fromElement;
				}
				if(evt.type == "mouseout"){ 
					evt.relatedTarget = evt.toElement;
				}
				evt.stopPropagation = del._stopPropagation;
				evt.preventDefault = del._preventDefault;
				return del._fixKeys(evt);
			},
			_fixKeys: function(evt){
				switch(evt.type){
					case "keypress":
						var c = ("charCode" in evt ? evt.charCode : evt.keyCode);
						if (c==10){
							// CTRL-ENTER is CTRL-ASCII(10) on IE, but CTRL-ENTER on Mozilla
							c=0;
							evt.keyCode = 13;
						}else if(c==13||c==27){
							c=0; // Mozilla considers ENTER and ESC non-printable
						}else if(c==3){
							c=99; // Mozilla maps CTRL-BREAK to CTRL-c
						}
						// Mozilla sets keyCode to 0 when there is a charCode
						// but that stops the event on IE.
						evt.charCode = c;
						del._setKeyChar(evt);
						break;
				}
				return evt;
			},
			_stealthKeyDown: function(evt){
				// IE doesn't fire keypress for most non-printable characters.
				// other browsers do, we simulate it here.
				var kp = evt.currentTarget.onkeypress;
				// only works if kp exists and is a dispatcher
				if(!kp || !kp[listenersName]){ return; }
				// munge key/charCode
				var k=evt.keyCode;
				// These are Windows Virtual Key Codes
				// http://msdn.microsoft.com/library/default.asp?url=/library/en-us/winui/WinUI/WindowsUserInterface/UserInput/VirtualKeyCodes.asp
				var unprintable = k!=13 && k!=32 && k!=27 && (k<48||k>90) && (k<96||k>111) && (k<186||k>192) && (k<219||k>222);
				// synthesize keypress for most unprintables and CTRL-keys
				if(unprintable||evt.ctrlKey){
					var c = unprintable ? 0 : k;
					if(evt.ctrlKey){
						if(k==3 || k==13){
							return; // IE will post CTRL-BREAK, CTRL-ENTER as keypress natively 
						}else if(c>95 && c<106){ 
							c -= 48; // map CTRL-[numpad 0-9] to ASCII
						}else if((!evt.shiftKey)&&(c>=65&&c<=90)){ 
							c += 32; // map CTRL-[A-Z] to lowercase
						}else{ 
							c = del._punctMap[c] || c; // map other problematic CTRL combinations to ASCII
						}
					}
					// simulate a keypress event
					var faux = del._synthesizeEvent(evt, {type: 'keypress', faux: true, charCode: c});
					kp.call(evt.currentTarget, faux);
					evt.cancelBubble = faux.cancelBubble;
					evt.returnValue = faux.returnValue;
					_trySetKeyCode(evt, faux.keyCode);
				}
			},
			// Called in Event scope
			_stopPropagation: function(){
				this.cancelBubble = true; 
			},
			_preventDefault: function(){
				// Setting keyCode to 0 is the only way to prevent certain keypresses (namely
				// ctrl-combinations that correspond to menu accelerator keys).
				// Otoh, it prevents upstream listeners from getting this information
				// Try to split the difference here by clobbering keyCode only for ctrl 
				// combinations. If you still need to access the key upstream, bubbledKeyCode is
				// provided as a workaround.
				this.bubbledKeyCode = this.keyCode;
				if(this.ctrlKey){_trySetKeyCode(this, 0);}
				this.returnValue = false;
			}
		});
				
		// override stopEvent for IE
		dojo.stopEvent = function(evt){
			evt = evt || window.event;
			del._stopPropagation.call(evt);
			del._preventDefault.call(evt);
		}
	}

	del._synthesizeEvent = function(evt, props){
			var faux = dojo.mixin({}, evt, props);
			del._setKeyChar(faux);
			// FIXME: would prefer to use dojo.hitch: dojo.hitch(evt, evt.preventDefault); 
			// but it throws an error when preventDefault is invoked on Safari
			// does Event.preventDefault not support "apply" on Safari?
			faux.preventDefault = function(){ evt.preventDefault(); }; 
			faux.stopPropagation = function(){ evt.stopPropagation(); }; 
			return faux;
	}
	
	// Opera event normalization
	if(dojo.isOpera){
		dojo.mixin(del, {
			_fixEvent: function(evt, sender){
				switch(evt.type){
					case "keypress":
						var c = evt.which;
						if(c==3){
							c=99; // Mozilla maps CTRL-BREAK to CTRL-c
						}
						// can't trap some keys at all, like INSERT and DELETE
						// there is no differentiating info between DELETE and ".", or INSERT and "-"
						c = c<41 && !evt.shiftKey ? 0 : c;
						if(evt.ctrlKey && !evt.shiftKey && c>=65 && c<=90){
							// lowercase CTRL-[A-Z] keys
							c += 32;
						}
						return del._synthesizeEvent(evt, { charCode: c });
				}
				return evt;
			}
		});
	}

	// Webkit event normalization
	if(dojo.isWebKit){
		del._add = del.add;
		del._remove = del.remove;

		dojo.mixin(del, {
			add: function(/*DOMNode*/node, /*String*/event, /*Function*/fp){
				if(!node){return;} // undefined
				var handle = del._add(node, event, fp);
				if(del._normalizeEventName(event) == "keypress"){
					// we need to listen to onkeydown to synthesize
					// keypress events that otherwise won't fire
					// in Safari 3.1+: https://lists.webkit.org/pipermail/webkit-dev/2007-December/002992.html
					handle._stealthKeyDownHandle = del._add(node, "keydown", function(evt){
						//A variation on the IE _stealthKeydown function
						//Synthesize an onkeypress event, but only for unprintable characters.
						var k=evt.keyCode;
						// These are Windows Virtual Key Codes
						// http://msdn.microsoft.com/library/default.asp?url=/library/en-us/winui/WinUI/WindowsUserInterface/UserInput/VirtualKeyCodes.asp
						var unprintable = k!=13 && k!=32 && k!=27 && (k<48 || k>90) && (k<96 || k>111) && (k<186 || k>192) && (k<219 || k>222);
						// synthesize keypress for most unprintables and CTRL-keys
						if(unprintable || evt.ctrlKey){
							var c = unprintable ? 0 : k;
							if(evt.ctrlKey){
								if(k==3 || k==13){
									return; // IE will post CTRL-BREAK, CTRL-ENTER as keypress natively 
								}else if(c>95 && c<106){ 
									c -= 48; // map CTRL-[numpad 0-9] to ASCII
								}else if(!evt.shiftKey && c>=65 && c<=90){ 
									c += 32; // map CTRL-[A-Z] to lowercase
								}else{ 
									c = del._punctMap[c] || c; // map other problematic CTRL combinations to ASCII
								}
							}
							// simulate a keypress event
							var faux = del._synthesizeEvent(evt, {type: 'keypress', faux: true, charCode: c});
							fp.call(evt.currentTarget, faux);
						}
					});
				}
				return handle; /*Handle*/
			},

			remove: function(/*DOMNode*/node, /*String*/event, /*Handle*/handle){
				if(node){
					if(handle._stealthKeyDownHandle){
						del._remove(node, "keydown", handle._stealthKeyDownHandle);
					}
					del._remove(node, event, handle);
				}
			},
			_fixEvent: function(evt, sender){
				switch(evt.type){
					case "keypress":
						if(evt.faux){ return evt; }
						var c = evt.charCode;
						c = c>=32 ? c : 0;
						return del._synthesizeEvent(evt, {charCode: c, faux: true});
				}
				return evt;
			}
		});
	}
})();

if(dojo.isIE){
	// keep this out of the closure
	// closing over 'iel' or 'ieh' b0rks leak prevention
	// ls[i] is an index into the master handler array
	dojo._ieDispatcher = function(args, sender){
		var ap=Array.prototype, h=dojo._ie_listener.handlers, c=args.callee, ls=c[dojo._ieListenersName], t=h[c.target];
		// return value comes from original target function
		var r = t && t.apply(sender, args);
		// make local copy of listener array so it's immutable during processing
		var lls = [].concat(ls);
		// invoke listeners after target function
		for(var i in lls){
			if(!(i in ap)){
				h[lls[i]].apply(sender, args);
			}
		}
		return r;
	}
	dojo._getIeDispatcher = function(){
		// ensure the returned function closes over nothing ("new Function" apparently doesn't close)
		return new Function(dojo._scopeName + "._ieDispatcher(arguments, this)"); // function
	}
	// keep this out of the closure to reduce RAM allocation
	dojo._event_listener._fixCallback = function(fp){
		var f = dojo._event_listener._fixEvent;
		return function(e){ return fp.call(this, f(e, this)); };
	}
}

}

if(!dojo._hasResource["dojo._base.html"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.html"] = true;

dojo.provide("dojo._base.html");

// FIXME: need to add unit tests for all the semi-public methods

try{
	document.execCommand("BackgroundImageCache", false, true);
}catch(e){
	// sane browsers don't have cache "issues"
}

// =============================
// DOM Functions
// =============================

/*=====
dojo.byId = function(id, doc){
	//	summary:
	//		Returns DOM node with matching `id` attribute or `null` 
	//		if not found, similar to "$" function in another library.
	//		If `id` is a DomNode, this function is a no-op.
	//
	//	id: String|DOMNode
	//	 	A string to match an HTML id attribute or a reference to a DOM Node
	//
	//	doc: Document?
	//		Document to work in. Defaults to the current value of
	//		dojo.doc.  Can be used to retrieve
	//		node references from other documents.
=====*/
if(dojo.isIE || dojo.isOpera){
	dojo.byId = function(id, doc){
		if(dojo.isString(id)){
			var _d = doc || dojo.doc;
			var te = _d.getElementById(id);
			// attributes.id.value is better than just id in case the 
			// user has a name=id inside a form
			if(te && te.attributes.id.value == id){
				return te;
			}else{
				var eles = _d.all[id];
				if(!eles || !eles.length){ return eles; }
				// if more than 1, choose first with the correct id
				var i=0;
				while((te=eles[i++])){
					if(te.attributes.id.value == id){ return te; }
				}
			}
		}else{
			return id; // DomNode
		}
	}
}else{
	dojo.byId = function(id, doc){
		return dojo.isString(id) ? (doc || dojo.doc).getElementById(id) : id; // DomNode
	}
}
/*=====
}
=====*/

(function(){
	var d = dojo;

	var _destroyContainer = null;
	d.addOnWindowUnload(function(){
		_destroyContainer=null; //prevent IE leak
	});

	dojo._destroyElement = function(/*String||DomNode*/node){
		// summary:
		//		removes node from its parent, clobbers it and all of its
		//		children.
		//	node:
		//		the element to be destroyed, either as an ID or a reference

		node = d.byId(node);
		try{
			if(!_destroyContainer || _destroyContainer.ownerDocument != node.ownerDocument){
				_destroyContainer = node.ownerDocument.createElement("div");
			}
			_destroyContainer.appendChild(node.parentNode ? node.parentNode.removeChild(node) : node);
			// NOTE: see http://trac.dojotoolkit.org/ticket/2931. This may be a bug and not a feature
			_destroyContainer.innerHTML = ""; 
		}catch(e){
			/* squelch */
		}
	};

	dojo.isDescendant = function(/*DomNode|String*/node, /*DomNode|String*/ancestor){
		//	summary:
		//		Returns true if node is a descendant of ancestor
		//	node: id or node reference to test
		//	ancestor: id or node reference of potential parent to test against
		try{
			node = d.byId(node);
			ancestor = d.byId(ancestor);
			while(node){
				if(node === ancestor){
					return true; // Boolean
				}
				node = node.parentNode;
			}
		}catch(e){ /* squelch, return false */ }
		return false; // Boolean
	};

	dojo.setSelectable = function(/*DomNode|String*/node, /*Boolean*/selectable){
		//	summary: enable or disable selection on a node
		//	node:
		//		id or reference to node
		//	selectable:
		node = d.byId(node);
		if(d.isMozilla){
			node.style.MozUserSelect = selectable ? "" : "none";
		}else if(d.isKhtml || d.isWebKit){
			node.style.KhtmlUserSelect = selectable ? "auto" : "none";
		}else if(d.isIE){
			var v = (node.unselectable = selectable ? "" : "on");
			d.query("*", node).forEach("item.unselectable = '"+v+"'");
		}
		//FIXME: else?  Opera?
	};

	var _insertBefore = function(/*Node*/node, /*Node*/ref){
		ref.parentNode.insertBefore(node, ref);
		return true;	//	boolean
	}

	var _insertAfter = function(/*Node*/node, /*Node*/ref){
		//	summary:
		//		Try to insert node after ref
		var pn = ref.parentNode;
		if(ref == pn.lastChild){
			pn.appendChild(node);
		}else{
			return _insertBefore(node, ref.nextSibling);	//	boolean
		}
		return true;	//	boolean
	}

	dojo.place = function(/*String|DomNode*/node, /*String|DomNode*/refNode, /*String?|Number?*/position){
		//	summary:
		//		Attempt to insert node into the DOM, choosing from various positioning options.
		//		Returns true if successful, false otherwise.
		//	node: 
		//		id or node reference to place relative to refNode
		//	refNode: 
		//		id or node reference to use as basis for placement
		//	position:
		//		string noting the position of node relative to refNode or a
		//		number indicating the location in the childNodes collection of refNode. 
		//		Accepted string values are:
		//		* before
		//		* after
		//		* first
		//		* last
		//
		//		"first" and "last" indicate positions as children of refNode.  position defaults
		//		to "last" if not specified

		// FIXME: need to write tests for this!!!!
		if(!node || !refNode){
			return false;	//	boolean 
		}
		node = d.byId(node);
		refNode = d.byId(refNode);
		if(typeof position == "number"){
			var cn = refNode.childNodes;
			if(!cn.length || cn.length <= position){
				refNode.appendChild(node);
				return true;
			}
			return _insertBefore(node, position <= 0 ? refNode.firstChild : cn[position]);
		}
		switch(position){
			case "before":
				return _insertBefore(node, refNode);	//	boolean
			case "after":
				return _insertAfter(node, refNode);		//	boolean
			case "first":
				if(refNode.firstChild){
					return _insertBefore(node, refNode.firstChild);	//	boolean
				}
				// else fallthrough...
			default: // aka: last
				refNode.appendChild(node);
				return true;	//	boolean
		}
	}

	// Box functions will assume this model.
	// On IE/Opera, BORDER_BOX will be set if the primary document is in quirks mode.
	// Can be set to change behavior of box setters.
	
	// can be either:
	//	"border-box"
	//	"content-box" (default)
	dojo.boxModel = "content-box";
	
	// We punt per-node box mode testing completely.
	// If anybody cares, we can provide an additional (optional) unit 
	// that overrides existing code to include per-node box sensitivity.

	// Opera documentation claims that Opera 9 uses border-box in BackCompat mode.
	// but experiments (Opera 9.10.8679 on Windows Vista) indicate that it actually continues to use content-box.
	// IIRC, earlier versions of Opera did in fact use border-box.
	// Opera guys, this is really confusing. Opera being broken in quirks mode is not our fault.

	if(d.isIE /*|| dojo.isOpera*/){
		var _dcm = document.compatMode;
		// client code may have to adjust if compatMode varies across iframes
		d.boxModel = _dcm == "BackCompat" || _dcm == "QuirksMode" || d.isIE<6 ? "border-box" : "content-box"; // FIXME: remove IE < 6 support?
	}

	// =============================
	// Style Functions
	// =============================
	
	// getComputedStyle drives most of the style code.
	// Wherever possible, reuse the returned object.
	//
	// API functions below that need to access computed styles accept an 
	// optional computedStyle parameter.
	// If this parameter is omitted, the functions will call getComputedStyle themselves.
	// This way, calling code can access computedStyle once, and then pass the reference to 
	// multiple API functions. 

/*=====
	dojo.getComputedStyle = function(node){
		//	summary:
		//		Returns a "computed style" object.
		//
		//	description:
		//		Gets a "computed style" object which can be used to gather
		//		information about the current state of the rendered node. 
		//
		//		Note that this may behave differently on different browsers.
		//		Values may have different formats and value encodings across
		//		browsers.
		//
		//		Note also that this method is expensive.  Wherever possible,
		//		reuse the returned object.
		//
		//		Use the dojo.style() method for more consistent (pixelized)
		//		return values.
		//
		//	node: DOMNode
		//		A reference to a DOM node. Does NOT support taking an
		//		ID string for speed reasons.
		//	example:
		//	|	dojo.getComputedStyle(dojo.byId('foo')).borderWidth;
		return; // CSS2Properties
	}
=====*/

	// Although we normally eschew argument validation at this
	// level, here we test argument 'node' for (duck)type.
	// Argument node must also implement Element.  (Note: we check
	// against HTMLElement rather than Element for interop with prototype.js)
	// Because 'document' is the 'parentNode' of 'body'
	// it is frequently sent to this function even 
	// though it is not Element.
	var gcs;
	if(d.isSafari){
		gcs = function(/*DomNode*/node){
			var s;
			if(node instanceof HTMLElement){
				var dv = node.ownerDocument.defaultView;
				s = dv.getComputedStyle(node, null);
				if(!s && node.style){ 
					node.style.display = ""; 
					s = dv.getComputedStyle(node, null);
				}
			}
			return s || {};
		}; 
	}else if(d.isIE){
		gcs = function(node){
			// IE (as of 7) doesn't expose Element like sane browsers
			return node.nodeType == 1 /* ELEMENT_NODE*/ ? node.currentStyle : {};
		};
	}else{
		gcs = function(node){
			return node instanceof HTMLElement ? 
				node.ownerDocument.defaultView.getComputedStyle(node, null) : {};
		};
	}
	dojo.getComputedStyle = gcs;

	if(!d.isIE){
		dojo._toPixelValue = function(element, value){
			// style values can be floats, client code may want
			// to round for integer pixels.
			return parseFloat(value) || 0; 
		};
	}else{
		dojo._toPixelValue = function(element, avalue){
			if(!avalue){ return 0; }
			// on IE7, medium is usually 4 pixels
			if(avalue=="medium"){ return 4; }
			// style values can be floats, client code may
			// want to round this value for integer pixels.
			if(avalue.slice && (avalue.slice(-2)=='px')){ return parseFloat(avalue); }
			with(element){
				var sLeft = style.left;
				var rsLeft = runtimeStyle.left;
				runtimeStyle.left = currentStyle.left;
				try{
					// 'avalue' may be incompatible with style.left, which can cause IE to throw
					// this has been observed for border widths using "thin", "medium", "thick" constants
					// those particular constants could be trapped by a lookup
					// but perhaps there are more
					style.left = avalue;
					avalue = style.pixelLeft;
				}catch(e){
					avalue = 0;
				}
				style.left = sLeft;
				runtimeStyle.left = rsLeft;
			}
			return avalue;
		}
	}
	var px = d._toPixelValue;

	// FIXME: there opacity quirks on FF that we haven't ported over. Hrm.
	/*=====
	dojo._getOpacity = function(node){
			//	summary:
			//		Returns the current opacity of the passed node as a
			//		floating-point value between 0 and 1.
			//	node: DomNode
			//		a reference to a DOM node. Does NOT support taking an
			//		ID string for speed reasons.
			//	returns: Number between 0 and 1
			return; // Number
	}
	=====*/

	var astr = "DXImageTransform.Microsoft.Alpha";
	var af = function(n, f){ 
		try{
			return n.filters.item(astr);
		}catch(e){
			return f ? {} : null;
		}
	}

	dojo._getOpacity = d.isIE ? function(node){
		try{
			return af(node).Opacity / 100; // Number
		}catch(e){
			return 1; // Number
		}
	} : function(node){
		return gcs(node).opacity;
	};

	/*=====
	dojo._setOpacity = function(node, opacity){
			//	summary:
			//		set the opacity of the passed node portably. Returns the
			//		new opacity of the node.
			//	node: DOMNode
			//		a reference to a DOM node. Does NOT support taking an
			//		ID string for performance reasons.
			//	opacity: Number
			//		A Number between 0 and 1. 0 specifies transparent.
			//	returns: Number between 0 and 1
			return; // Number
	}
	=====*/

	dojo._setOpacity = d.isIE ? function(/*DomNode*/node, /*Number*/opacity){
		var ov = opacity * 100;
		node.style.zoom = 1.0;

		// on IE7 Alpha(Filter opacity=100) makes text look fuzzy so disable it altogether (bug #2661),
		//but still update the opacity value so we can get a correct reading if it is read later.
		af(node, 1).Enabled = !(opacity == 1);

		if(!af(node)){
			node.style.filter += " progid:"+astr+"(Opacity="+ov+")";
		}else{
			af(node, 1).Opacity = ov;
		}

		if(node.nodeName.toLowerCase() == "tr"){
			d.query("> td", node).forEach(function(i){
				d._setOpacity(i, opacity);
			});
		}
		return opacity;
	} : function(node, opacity){
		return node.style.opacity = opacity;
	};

	var _pixelNamesCache = {
		left: true, top: true
	};
	var _pixelRegExp = /margin|padding|width|height|max|min|offset/;  // |border
	var _toStyleValue = function(node, type, value){
		type = type.toLowerCase(); // FIXME: should we really be doing string case conversion here? Should we cache it? Need to profile!
		if(d.isIE){
			if(value == "auto"){
				if(type == "height"){ return node.offsetHeight; }
				if(type == "width"){ return node.offsetWidth; }
			}
			if(type == "fontweight"){
				switch(value){
					case 700: return "bold";
					case 400:
					default: return "normal";
				}
			}
		}
		if(!(type in _pixelNamesCache)){
			_pixelNamesCache[type] = _pixelRegExp.test(type);
		}
		return _pixelNamesCache[type] ? px(node, value) : value;
	}

	var _floatStyle = d.isIE ? "styleFloat" : "cssFloat";
	var _floatAliases = { "cssFloat": _floatStyle, "styleFloat": _floatStyle, "float": _floatStyle };
	
	// public API
	
	dojo.style = function(	/*DomNode|String*/ node, 
							/*String?|Object?*/ style, 
							/*String?*/ value){
		//	summary:
		//		Accesses styles on a node. If 2 arguments are
		//		passed, acts as a getter. If 3 arguments are passed, acts
		//		as a setter.
		//	description:
		//		Getting the style value uses the computed style for the node, so the value
		//		will be a calculated value, not just the immediate node.style value.
		//		Also when getting values, use specific style names,
		//		like "borderBottomWidth" instead of "border" since compound values like
		//		"border" are not necessarily reflected as expected.
		//		If you want to get node dimensions, use dojo.marginBox() or
		//		dojo.contentBox(). 
		//	node:
		//		id or reference to node to get/set style for
		//	style:
		//		the style property to set in DOM-accessor format
		//		("borderWidth", not "border-width") or an object with key/value
		//		pairs suitable for setting each property.
		//	value:
		//		If passed, sets value on the node for style, handling
		//		cross-browser concerns.
		//	example:
		//		Passing only an ID or node returns the computed style object of
		//		the node:
		//	|	dojo.style("thinger");
		//	example:
		//		Passing a node and a style property returns the current
		//		normalized, computed value for that property:
		//	|	dojo.style("thinger", "opacity"); // 1 by default
		//
		//	example:
		//		Passing a node, a style property, and a value changes the
		//		current display of the node and returns the new computed value
		//	|	dojo.style("thinger", "opacity", 0.5); // == 0.5
		//
		//	example:
		//		Passing a node, an object-style style property sets each of the values in turn and returns the computed style object of the node:
		//	|	dojo.style("thinger", {
		//	|		"opacity": 0.5,
		//	|		"border": "3px solid black",
		//	|		"height": 300
		//	|	});
		//
		// 	example:
		//		When the CSS style property is hyphenated, the JavaScript property is camelCased.
		//		font-size becomes fontSize, and so on.
		//	|	dojo.style("thinger",{
		//	|		fontSize:"14pt",
		//	|		letterSpacing:"1.2em"
		//	|	});
		//
		//	example:
		//		dojo.NodeList implements .style() using the same syntax, omitting the "node" parameter, calling
		//		dojo.style() on every element of the list. See: dojo.query and dojo.NodeList
		//	|	dojo.query(".someClassName").style("visibility","hidden");
		//	|	// or
		//	|	dojo.query("#baz > div").style({
		//	|		opacity:0.75,
		//	|		fontSize:"13pt"
		//	|	});

		var n = d.byId(node), args = arguments.length, op = (style=="opacity");
		style = _floatAliases[style] || style;
		if(args == 3){
			return op ? d._setOpacity(n, value) : n.style[style] = value; /*Number*/
		}
		if(args == 2 && op){
			return d._getOpacity(n);
		}
		var s = gcs(n);
		if(args == 2 && !d.isString(style)){
			for(var x in style){
				d.style(node, x, style[x]);
			}
			return s;
		}
		return (args == 1) ? s : _toStyleValue(n, style, s[style]||n.style[style]); /* CSS2Properties||String||Number */
	}

	// =============================
	// Box Functions
	// =============================

	dojo._getPadExtents = function(/*DomNode*/n, /*Object*/computedStyle){
		//	summary:
		// 		Returns object with special values specifically useful for node
		// 		fitting.
		//
		// 		* l/t = left/top padding (respectively)
		// 		* w = the total of the left and right padding 
		// 		* h = the total of the top and bottom padding
		//
		//		If 'node' has position, l/t forms the origin for child nodes. 
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		var 
			s = computedStyle||gcs(n), 
			l = px(n, s.paddingLeft), 
			t = px(n, s.paddingTop);
		return { 
			l: l,
			t: t,
			w: l+px(n, s.paddingRight),
			h: t+px(n, s.paddingBottom)
		};
	}

	dojo._getBorderExtents = function(/*DomNode*/n, /*Object*/computedStyle){
		//	summary:
		//		returns an object with properties useful for noting the border
		//		dimensions.
		//
		// 		* l/t = the sum of left/top border (respectively)
		//		* w = the sum of the left and right border
		//		* h = the sum of the top and bottom border
		//
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		var 
			ne = "none",
			s = computedStyle||gcs(n), 
			bl = (s.borderLeftStyle != ne ? px(n, s.borderLeftWidth) : 0),
			bt = (s.borderTopStyle != ne ? px(n, s.borderTopWidth) : 0);
		return { 
			l: bl,
			t: bt,
			w: bl + (s.borderRightStyle!=ne ? px(n, s.borderRightWidth) : 0),
			h: bt + (s.borderBottomStyle!=ne ? px(n, s.borderBottomWidth) : 0)
		};
	}

	dojo._getPadBorderExtents = function(/*DomNode*/n, /*Object*/computedStyle){
		//	summary:
		//		returns object with properties useful for box fitting with
		//		regards to padding.
		//
		//		* l/t = the sum of left/top padding and left/top border (respectively)
		//		* w = the sum of the left and right padding and border
		//		* h = the sum of the top and bottom padding and border
		//
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		var 
			s = computedStyle||gcs(n), 
			p = d._getPadExtents(n, s),
			b = d._getBorderExtents(n, s);
		return { 
			l: p.l + b.l,
			t: p.t + b.t,
			w: p.w + b.w,
			h: p.h + b.h
		};
	}

	dojo._getMarginExtents = function(n, computedStyle){
		//	summary:
		//		returns object with properties useful for box fitting with
		//		regards to box margins (i.e., the outer-box).
		//
		//		* l/t = marginLeft, marginTop, respectively
		//		* w = total width, margin inclusive
		//		* h = total height, margin inclusive
		//
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		var 
			s = computedStyle||gcs(n), 
			l = px(n, s.marginLeft),
			t = px(n, s.marginTop),
			r = px(n, s.marginRight),
			b = px(n, s.marginBottom);
		if(d.isSafari && (s.position != "absolute")){
			// FIXME: Safari's version of the computed right margin
			// is the space between our right edge and the right edge 
			// of our offsetParent. 
			// What we are looking for is the actual margin value as 
			// determined by CSS.
			// Hack solution is to assume left/right margins are the same.
			r = l;
		}
		return { 
			l: l,
			t: t,
			w: l+r,
			h: t+b
		};
	}

	// Box getters work in any box context because offsetWidth/clientWidth
	// are invariant wrt box context
	//
	// They do *not* work for display: inline objects that have padding styles
	// because the user agent ignores padding (it's bogus styling in any case)
	//
	// Be careful with IMGs because they are inline or block depending on 
	// browser and browser mode.

	// Although it would be easier to read, there are not separate versions of 
	// _getMarginBox for each browser because:
	// 1. the branching is not expensive
	// 2. factoring the shared code wastes cycles (function call overhead)
	// 3. duplicating the shared code wastes bytes
	
	dojo._getMarginBox = function(/*DomNode*/node, /*Object*/computedStyle){
		// summary:
		//		returns an object that encodes the width, height, left and top
		//		positions of the node's margin box.
		var s = computedStyle||gcs(node), me = d._getMarginExtents(node, s);
		var l = node.offsetLeft - me.l, t = node.offsetTop - me.t, p = node.parentNode;
		if(d.isMoz){
			// Mozilla:
			// If offsetParent has a computed overflow != visible, the offsetLeft is decreased
			// by the parent's border.
			// We don't want to compute the parent's style, so instead we examine node's
			// computed left/top which is more stable.
			var sl = parseFloat(s.left), st = parseFloat(s.top);
			if(!isNaN(sl) && !isNaN(st)){
				l = sl, t = st;
			}else{
				// If child's computed left/top are not parseable as a number (e.g. "auto"), we
				// have no choice but to examine the parent's computed style.
				if(p && p.style){
					var pcs = gcs(p);
					if(pcs.overflow != "visible"){
						var be = d._getBorderExtents(p, pcs);
						l += be.l, t += be.t;
					}
				}
			}
		}else if(d.isOpera){
			// On Opera, offsetLeft includes the parent's border
			if(p){
				var be = d._getBorderExtents(p);
				l -= be.l;
				t -= be.t;
			}
		}
		return { 
			l: l, 
			t: t, 
			w: node.offsetWidth + me.w, 
			h: node.offsetHeight + me.h 
		};
	}
	
	dojo._getContentBox = function(node, computedStyle){
		// summary:
		//		Returns an object that encodes the width, height, left and top
		//		positions of the node's content box, irrespective of the
		//		current box model.

		// clientWidth/Height are important since the automatically account for scrollbars
		// fallback to offsetWidth/Height for special cases (see #3378)
		var s=computedStyle||gcs(node), pe=d._getPadExtents(node, s), be=d._getBorderExtents(node, s), w=node.clientWidth, h;
		if(!w){
			w=node.offsetWidth, h=node.offsetHeight;
		}else{
			h=node.clientHeight, be.w = be.h = 0; 
		}
		// On Opera, offsetLeft includes the parent's border
		if(d.isOpera){ pe.l += be.l; pe.t += be.t; };
		return { 
			l: pe.l, 
			t: pe.t, 
			w: w - pe.w - be.w, 
			h: h - pe.h - be.h
		};
	}

	dojo._getBorderBox = function(node, computedStyle){
		var s=computedStyle||gcs(node), pe=d._getPadExtents(node, s), cb=d._getContentBox(node, s);
		return { 
			l: cb.l - pe.l, 
			t: cb.t - pe.t, 
			w: cb.w + pe.w, 
			h: cb.h + pe.h
		};
	}

	// Box setters depend on box context because interpretation of width/height styles
	// vary wrt box context.
	//
	// The value of dojo.boxModel is used to determine box context.
	// dojo.boxModel can be set directly to change behavior.
	//
	// Beware of display: inline objects that have padding styles
	// because the user agent ignores padding (it's a bogus setup anyway)
	//
	// Be careful with IMGs because they are inline or block depending on 
	// browser and browser mode.
	// 
	// Elements other than DIV may have special quirks, like built-in
	// margins or padding, or values not detectable via computedStyle.
	// In particular, margins on TABLE do not seems to appear 
	// at all in computedStyle on Mozilla.
	
	dojo._setBox = function(/*DomNode*/node, /*Number?*/l, /*Number?*/t, /*Number?*/w, /*Number?*/h, /*String?*/u){
		//	summary:
		//		sets width/height/left/top in the current (native) box-model
		//		dimentions. Uses the unit passed in u.
		//	node: DOM Node reference. Id string not supported for performance reasons.
		//	l: optional. left offset from parent.
		//	t: optional. top offset from parent.
		//	w: optional. width in current box model.
		//	h: optional. width in current box model.
		//	u: optional. unit measure to use for other measures. Defaults to "px".
		u = u || "px";
		var s = node.style;
		if(!isNaN(l)){ s.left = l+u; }
		if(!isNaN(t)){ s.top = t+u; }
		if(w>=0){ s.width = w+u; }
		if(h>=0){ s.height = h+u; }
	}

	dojo._isButtonTag = function(/*DomNode*/node) {
		// summary:
		//		True if the node is BUTTON or INPUT.type="button".
		return node.tagName == "BUTTON" 
			|| node.tagName=="INPUT" && node.getAttribute("type").toUpperCase() == "BUTTON"; // boolean
	}
	
	dojo._usesBorderBox = function(/*DomNode*/node){
		//	summary: 
		//		True if the node uses border-box layout.

		// We could test the computed style of node to see if a particular box
		// has been specified, but there are details and we choose not to bother.
		
		// TABLE and BUTTON (and INPUT type=button) are always border-box by default.
		// If you have assigned a different box to either one via CSS then
		// box functions will break.
		
		var n = node.tagName;
		return d.boxModel=="border-box" || n=="TABLE" || d._isButtonTag(node); // boolean
	}

	dojo._setContentSize = function(/*DomNode*/node, /*Number*/widthPx, /*Number*/heightPx, /*Object*/computedStyle){
		//	summary:
		//		Sets the size of the node's contents, irrespective of margins,
		//		padding, or borders.
		if(d._usesBorderBox(node)){
			var pb = d._getPadBorderExtents(node, computedStyle);
			if(widthPx >= 0){ widthPx += pb.w; }
			if(heightPx >= 0){ heightPx += pb.h; }
		}
		d._setBox(node, NaN, NaN, widthPx, heightPx);
	}

	dojo._setMarginBox = function(/*DomNode*/node, 	/*Number?*/leftPx, /*Number?*/topPx, 
													/*Number?*/widthPx, /*Number?*/heightPx, 
													/*Object*/computedStyle){
		//	summary:
		//		sets the size of the node's margin box and placement
		//		(left/top), irrespective of box model. Think of it as a
		//		passthrough to dojo._setBox that handles box-model vagaries for
		//		you.

		var s = computedStyle||gcs(node);
		// Some elements have special padding, margin, and box-model settings. 
		// To use box functions you may need to set padding, margin explicitly.
		// Controlling box-model is harder, in a pinch you might set dojo.boxModel.
		var bb=d._usesBorderBox(node),
				pb=bb ? _nilExtents : d._getPadBorderExtents(node, s);
		if(d.isSafari){
			// on Safari (3.1.2), button nodes with no explicit size have a default margin
			// setting an explicit size eliminates the margin.
			// We have to swizzle the width to get correct margin reading.
			if(d._isButtonTag(node)){
				var ns = node.style;
				if (widthPx>=0 && !ns.width) { ns.width = "4px"; }
				if (heightPx>=0 && !ns.height) { ns.height = "4px"; }
			}
		}
		var mb=d._getMarginExtents(node, s);
		if(widthPx>=0){ widthPx = Math.max(widthPx - pb.w - mb.w, 0); }
		if(heightPx>=0){ heightPx = Math.max(heightPx - pb.h - mb.h, 0); }
		d._setBox(node, leftPx, topPx, widthPx, heightPx);
	}
	
	var _nilExtents = { l:0, t:0, w:0, h:0 };

	// public API
	
	dojo.marginBox = function(/*DomNode|String*/node, /*Object?*/box){
		//	summary:
		//		Getter/setter for the margin-box of node.
		//	description: 
		//		Returns an object in the expected format of box (regardless
		//		if box is passed). The object might look like:
		//			`{ l: 50, t: 200, w: 300: h: 150 }`
		//		for a node offset from its parent 50px to the left, 200px from
		//		the top with a margin width of 300px and a margin-height of
		//		150px.
		//	node:
		//		id or reference to DOM Node to get/set box for
		//	box:
		//		If passed, denotes that dojo.marginBox() should
		//		update/set the margin box for node. Box is an object in the
		//		above format. All properties are optional if passed.
		var n=d.byId(node), s=gcs(n), b=box;
		return !b ? d._getMarginBox(n, s) : d._setMarginBox(n, b.l, b.t, b.w, b.h, s); // Object
	}

	dojo.contentBox = function(/*DomNode|String*/node, /*Object?*/box){
		//	summary:
		//		Getter/setter for the content-box of node.
		//	description:
		//		Returns an object in the expected format of box (regardless if box is passed).
		//		The object might look like:
		//			`{ l: 50, t: 200, w: 300: h: 150 }`
		//		for a node offset from its parent 50px to the left, 200px from
		//		the top with a content width of 300px and a content-height of
		//		150px. Note that the content box may have a much larger border
		//		or margin box, depending on the box model currently in use and
		//		CSS values set/inherited for node.
		//	node:
		//		id or reference to DOM Node to get/set box for
		//	box:
		//		If passed, denotes that dojo.contentBox() should
		//		update/set the content box for node. Box is an object in the
		//		above format. All properties are optional if passed.
		var n=d.byId(node), s=gcs(n), b=box;
		return !b ? d._getContentBox(n, s) : d._setContentSize(n, b.w, b.h, s); // Object
	}
	
	// =============================
	// Positioning 
	// =============================
	
	var _sumAncestorProperties = function(node, prop){
		if(!(node = (node||0).parentNode)){return 0};
		var val, retVal = 0, _b = d.body();
		while(node && node.style){
			if(gcs(node).position == "fixed"){
				return 0;
			}
			val = node[prop];
			if(val){
				retVal += val - 0;
				// opera and khtml #body & #html has the same values, we only
				// need one value
				if(node == _b){ break; }
			}
			node = node.parentNode;
		}
		return retVal;	//	integer
	}

	dojo._docScroll = function(){
		var 
			_b = d.body(),
			_w = d.global,
			de = d.doc.documentElement;
		return {
			y: (_w.pageYOffset || de.scrollTop || _b.scrollTop || 0),
			x: (_w.pageXOffset || d._fixIeBiDiScrollLeft(de.scrollLeft) || _b.scrollLeft || 0)
		};
	};
	
	dojo._isBodyLtr = function(){
		//FIXME: could check html and body tags directly instead of computed style?  need to ignore case, accept empty values
		return ("_bodyLtr" in d) ? d._bodyLtr :
			d._bodyLtr = gcs(d.body()).direction == "ltr"; // Boolean 
	}
	
	dojo._getIeDocumentElementOffset = function(){
		// summary
		// The following values in IE contain an offset:
		//     event.clientX 
		//     event.clientY 
		//     node.getBoundingClientRect().left
		//     node.getBoundingClientRect().top
		// But other position related values do not contain this offset, such as
		// node.offsetLeft, node.offsetTop, node.style.left and node.style.top.
		// The offset is always (2, 2) in LTR direction. When the body is in RTL
		// direction, the offset counts the width of left scroll bar's width.
		// This function computes the actual offset.

		//NOTE: assumes we're being called in an IE browser

		var de = d.doc.documentElement;
		//FIXME: use this instead?			var de = d.compatMode == "BackCompat" ? d.body : d.documentElement;

		if(d.isIE == 6){
			return {x: d._isBodyLtr() || _getIeDocumentElementOffsetwindow.parent == window ?
				de.clientLeft : de.offsetWidth - de.clientWidth - de.clientLeft, 
				y: de.clientTop}; // Object
		}else if(d.isIE == 7){
			return {x: de.getBoundingClientRect().left, y: de.getBoundingClientRect().top};
		}else{
			return {
				x: de.getBoundingClientRect().left - de.offsetLeft + de.scrollLeft,
				y: de.getBoundingClientRect().top - de.offsetTop + de.scrollTop
			};
		}

	};
	
	dojo._fixIeBiDiScrollLeft = function(/*Integer*/ scrollLeft){
		// In RTL direction, scrollLeft should be a negative value, but IE 
		// returns a positive one. All codes using documentElement.scrollLeft
		// must call this function to fix this error, otherwise the position
		// will offset to right when there is a horizontal scrollbar.
		var dd = d.doc;
		if(d.isIE && !d._isBodyLtr()){
			var de = dd.compatMode == "BackCompat" ? dd.body : dd.documentElement;
			return scrollLeft + de.clientWidth - de.scrollWidth; // Integer
		}
		return scrollLeft; // Integer
	}

	dojo._abs = function(/*DomNode*/node, /*Boolean?*/includeScroll){
		//	summary:
		//		Gets the position of the passed element relative to
		//		the viewport (if includeScroll==false), or relative to the
		//		document root (if includeScroll==true).
		//
		//		Returns an object of the form:
		//			{ x: 100, y: 300 }
		//		if includeScroll is passed, the x and y values will include any
		//		document offsets that may affect the position relative to the
		//		viewport.

		// FIXME: need to decide in the brave-new-world if we're going to be
		// margin-box or border-box.
		var ownerDocument = node.ownerDocument;
		var ret;

		// targetBoxType == "border-box"
		var db = d.body(), dh = d.body().parentNode;
		if(node["getBoundingClientRect"]){
			// IE6+, FF3+, and Opera 9.6+ all take this branch
			var client = node.getBoundingClientRect();
			ret = { x: client.left, y: client.top };
			if(d.isFF >= 3){
				// in FF3 you have to subtract the document element margins
				var cs = gcs(dh);
				ret.x -= px(dh, cs.marginLeft);
				ret.y -= px(dh, cs.marginTop);
			}
			if(d.isIE){
				// On IE there's a 2px offset that we need to adjust for, see _getIeDocumentElementOffset()
				var offset = d._getIeDocumentElementOffset();
				ret.x -= offset.x;
				ret.y -= offset.y;
			}
		}else{
			// FF2 and Safari
			ret = {
				x: 0,
				y: 0
			};
			if(node["offsetParent"]){
				ret.x -= _sumAncestorProperties(node, "scrollLeft");
				ret.y -= _sumAncestorProperties(node, "scrollTop");

				var endNode;
				// in Safari, if the node is an absolutely positioned child of
				// the body and the body has a margin the offset of the child
				// and the body contain the body's margins, so we need to end
				// at the body
				// FIXME: getting contrary results to the above in latest WebKit.
				if(d.isSafari &&
					//(node.style.getPropertyValue("position") == "absolute") &&
					(gcs(node).position == "absolute") &&
					(node.parentNode == db)){
					endNode = db;
				}else{
					endNode = dh;
				}

				var curnode = node;
				do{
					var n = curnode.offsetLeft,
						t = curnode.offsetTop;
					ret.x += isNaN(n) ? 0 : n;
					ret.y += isNaN(t) ? 0 : t;

					var cs = gcs(curnode);
					if(curnode != node){
						if(d.isFF){
							// tried left+right with differently sized left/right borders
							// it really is 2xleft border in FF, not left+right, even in RTL!
							ret.x += 2*px(curnode,cs.borderLeftWidth);
							ret.y += 2*px(curnode,cs.borderTopWidth);
						}else{
							ret.x += px(curnode, cs.borderLeftWidth);
							ret.y += px(curnode, cs.borderTopWidth);
						}
					}
					// static children in a static div in FF2 are affected by the div's border as well
					// but offsetParent will skip this div!
					if(d.isFF && cs.position=="static"){
						var parent=curnode.parentNode;
						while(parent!=curnode.offsetParent){
							var pcs=gcs(parent);
							if(pcs.position=="static"){
								ret.x += px(curnode,pcs.borderLeftWidth);
								ret.y += px(curnode,pcs.borderTopWidth);
							}
							parent=parent.parentNode;
						}
					}
					curnode = curnode.offsetParent;
				}while((curnode != endNode) && curnode);
			}else if(node.x && node.y){
				ret.x += isNaN(node.x) ? 0 : node.x;
				ret.y += isNaN(node.y) ? 0 : node.y;
			}
		}
		// account for document scrolling
		// if offsetParent is used, ret value already includes scroll position
		// so we may have to actually remove that value if !includeScroll
		if(includeScroll){
			var scroll = d._docScroll();
			ret.x += scroll.x;
			ret.y += scroll.y;
		}

		return ret; // object
	}

	// FIXME: need a setter for coords or a moveTo!!
	dojo.coords = function(/*DomNode|String*/node, /*Boolean?*/includeScroll){
		//	summary:
		//		Returns an object that measures margin box width/height and
		//		absolute positioning data from dojo._abs().
		//
		//	description:
		//		Returns an object that measures margin box width/height and
		//		absolute positioning data from dojo._abs().
		//		Return value will be in the form:
		//			`{ l: 50, t: 200, w: 300: h: 150, x: 100, y: 300 }`
		//		Does not act as a setter. If includeScroll is passed, the x and
		//		y params are affected as one would expect in dojo._abs().
		var n=d.byId(node), s=gcs(n), mb=d._getMarginBox(n, s);
		var abs = d._abs(n, includeScroll);
		mb.x = abs.x;
		mb.y = abs.y;
		return mb;
	}

	// =============================
	// Element attribute Functions
	// =============================

	var ieLT8 = d.isIE < 8;

	var _fixAttrName = function(/*String*/name){
		switch(name.toLowerCase()){
			case "tabindex":
				// Internet Explorer will only set or remove tabindex
				// if it is spelled "tabIndex"
				// console.debug((dojo.isIE && dojo.isIE < 8)? "tabIndex" : "tabindex");
				return ieLT8 ? "tabIndex" : "tabindex";
			case "for": case "htmlfor":
				// to pick up for attrib set in markup via getAttribute() IE<8 uses "htmlFor" and others use "for"
				// get/setAttribute works in all as long use same value for both get/set
				return ieLT8 ? "htmlFor" : "for";
			case "class" :
				return ieLT8 ? "className" : "class";
			default:
				return name;
		}
	}

	// non-deprecated HTML4 attributes with default values
	// http://www.w3.org/TR/html401/index/attributes.html
	// FF and Safari will return the default values if you
	// access the attributes via a property but not
	// via getAttribute()
	var _attrProps = {
		colspan: "colSpan",
		enctype: "enctype",
		frameborder: "frameborder",
		method: "method",
		rowspan: "rowSpan",
		scrolling: "scrolling",
		shape: "shape",
		span: "span",
		type: "type",
		valuetype: "valueType"
	}

	dojo.hasAttr = function(/*DomNode|String*/node, /*String*/name){
		//	summary:
		//		Returns true if the requested attribute is specified on the
		//		given element, and false otherwise.
		//	node:
		//		id or reference to the element to check
		//	name:
		//		the name of the attribute
		//	returns:
		//		true if the requested attribute is specified on the
		//		given element, and false otherwise
		node = d.byId(node);
		var fixName = _fixAttrName(name);
		fixName = fixName == "htmlFor" ? "for" : fixName; //IE<8 uses htmlFor except in this case
		var attr = node.getAttributeNode && node.getAttributeNode(fixName);
		return attr ? attr.specified : false; // Boolean
	}

	var _evtHdlrMap = {
		
	}

	var _ctr = 0;
	var _attrId = dojo._scopeName + "attrid";

	dojo.attr = function(/*DomNode|String*/node, /*String|Object*/name, /*String?*/value){
		//	summary:
		//		Gets or sets an attribute on an HTML element.
		//	description:
		//		Handles normalized getting and setting of attributes on DOM
		//		Nodes. If 2 arguments are passed, and a the second argumnt is a
		//		string, acts as a getter.
		//	
		//		If a third argument is passed, or if the second argumnt is a
		//		map of attributes, acts as a setter.
		//
		//		When passing functions as values, note that they will not be
		//		directly assigned to slots on the node, but rather the default
		//		behavior will be removed and the new behavior will be added
		//		using `dojo.connect()`, meaning that event handler properties
		//		will be normalized and that some caveats with regards to
		//		non-standard behaviors for onsubmit apply. Namely that you
		//		should cancel form submission using `dojo.stopEvent()` on the
		//		passed event object instead of returning a boolean value from
		//		the handler itself.
		//	node:
		//		id or reference to the element to get or set the attribute on
		//	name:
		//		the name of the attribute to get or set.
		//	value:
		//		The value to set for the attribute
		//	returns:
		//		when used as a getter, the value of the requested attribute
		//		or null if that attribute does not have a specified or
		//		default value;
		//
		//		when user as a setter, undefined
		//
		//	example:
		//	|	// get the current value of the "foo" attribute on a node
		//	|	dojo.attr(dojo.byId("nodeId"), "foo");
		//	|	// or we can just pass the id:
		//	|	dojo.attr("nodeId", "foo");
		//
		//	example:
		//	|	// use attr() to set the tab index
		//	|	dojo.attr("nodeId", "tabindex", 3);
		//	|
		//
		//	example:
		//	|	// set multiple values at once, including event handlers:
		//	|	dojo.attr("formId", {
		//	|		"foo": "bar",
		//	|		"tabindex": -1,
		//	|		"method": "POST",
		//	|		"onsubmit": function(e){
		//	|			// stop submitting the form. Note that the IE behavior
		//	|			// of returning true or false will have no effect here
		//	|			// since our handler is connect()ed to the built-in
		//	|			// onsubmit behavior and so we need to use
		//	|			// dojo.stopEvent() to ensure that the submission
		//	|			// doesn't proceed.
		//	|			dojo.stopEvent(e);
		//	|
		//	|			// submit the form with Ajax
		//	|			dojo.xhrPost({ form: "formId" });
		//	|		}
		//	|	});

		var args = arguments.length;
		if(args == 2 && !d.isString(name)){
			for(var x in name){ d.attr(node, x, name[x]); }
			return;
		}
		node = d.byId(node);
		name = _fixAttrName(name);
		if(args == 3){
			// FIXME:
			//		what about when the name is "style" and value is an object?
			//		It seems natural to pass it in to dojo.style(node,
			//		value)...should we support this?
			if(d.isFunction(value)){
				// clobber if we can
				var attrId = d.attr(node, _attrId);
				if(!attrId){
					attrId = _ctr++;
					d.attr(node, _attrId, attrId);
				}
				if(!_evtHdlrMap[attrId]){
					_evtHdlrMap[attrId] = {};
				}
				var h = _evtHdlrMap[attrId][name];
				if(h){
					d.disconnect(h);
				}else{
					try{
						delete node[name];
					}catch(e){}
				}

				// ensure that event objects are normalized, etc.
				_evtHdlrMap[attrId][name] = d.connect(node, name, value);

			}else if(
				typeof value == "boolean" || // e.g. onsubmit, disabled
				name == "innerHTML"
			){
				node[name] = value;
			}else if(name == "style" && !d.isString(value)){
				d.style(node, value);
			}else{
				node.setAttribute(name, value);
			}
			return;
		}else{
			// should we access this attribute via a property or
			// via getAttribute()?
			var prop = _attrProps[name.toLowerCase()];
			if(prop){
				return node[prop];
			}else{
				var attrValue = node[name];
				return (typeof attrValue == 'boolean' || typeof attrValue == 'function') ? attrValue
					: (d.hasAttr(node, name) ? node.getAttribute(name) : null);
			}
		}
	}

	dojo.removeAttr = function(/*DomNode|String*/node, /*String*/name){
		//	summary:
		//		Removes an attribute from an HTML element.
		//	node:
		//		id or reference to the element to remove the attribute from
		//	name:
		//		the name of the attribute to remove
		d.byId(node).removeAttribute(_fixAttrName(name));
	}

	// =============================
	// (CSS) Class Functions
	// =============================
	var _className = "className";

	dojo.hasClass = function(/*DomNode|String*/node, /*String*/classStr){
		//	summary:
		//		Returns whether or not the specified classes are a portion of the
		//		class list currently applied to the node. 
		return ((" "+ d.byId(node)[_className] +" ").indexOf(" "+ classStr +" ") >= 0);  // Boolean
	};

	dojo.addClass = function(/*DomNode|String*/node, /*String*/classStr){
		//	summary:
		//		Adds the specified classes to the end of the class list on the
		//		passed node.
		node = d.byId(node);
		var cls = node[_className];
		if((" "+ cls +" ").indexOf(" " + classStr + " ") < 0){
			node[_className] = cls + (cls ? ' ' : '') + classStr;
		}
	};

	dojo.removeClass = function(/*DomNode|String*/node, /*String*/classStr){
		// summary: Removes the specified classes from node.
		node = d.byId(node);
		var t = d.trim((" " + node[_className] + " ").replace(" " + classStr + " ", " "));
		if(node[_className] != t){ node[_className] = t; }
	};

	dojo.toggleClass = function(/*DomNode|String*/node, /*String*/classStr, /*Boolean?*/condition){
		//	summary: 	
		//		Adds a class to node if not present, or removes if present.
		//		Pass a boolean condition if you want to explicitly add or remove.
		//	condition:
		//		If passed, true means to add the class, false means to remove.
		if(condition === undefined){
			condition = !d.hasClass(node, classStr);
		}
		d[condition ? "addClass" : "removeClass"](node, classStr);
	};

})();

}

if(!dojo._hasResource["dojo._base.NodeList"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.NodeList"] = true;
dojo.provide("dojo._base.NodeList");



(function(){

	var d = dojo;

	var tnl = function(arr){
		// decorate an array to make it look like a NodeList
		arr.constructor = dojo.NodeList;
		dojo._mixin(arr, dojo.NodeList.prototype);
		return arr;
	}

	var _mapIntoDojo = function(func, alwaysThis){
		// returns a function which, when executed in the scope of its caller,
		// applies the passed arguments to a particular dojo.* function (named
		// in func) and aggregates the returns. if alwaysThis is true, it
		// always returns the scope object and not the collected returns from
		// the Dojo method
		return function(){
			var _a = arguments;
			var aa = d._toArray(_a, 0, [null]);
			var s = this.map(function(i){
				aa[0] = i;
				return d[func].apply(d, aa);
			});
			return (alwaysThis || ( (_a.length > 1) || !d.isString(_a[0]) )) ? this : s; // String||dojo.NodeList
		}
	};

	dojo.NodeList = function(){
		//	summary:
		//		dojo.NodeList is as subclass of Array which adds syntactic 
		//		sugar for chaining, common iteration operations, animation, 
		//		and node manipulation. NodeLists are most often returned as
		//		the result of dojo.query() calls.
		//	example:
		//		create a node list from a node
		//		|	new dojo.NodeList(dojo.byId("foo"));

		return tnl(Array.apply(null, arguments));
	}

	dojo.NodeList._wrap = tnl;

	dojo.extend(dojo.NodeList, {
		// http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array#Methods

		// FIXME: handle return values for #3244
		//		http://trac.dojotoolkit.org/ticket/3244
		
		// FIXME:
		//		need to wrap or implement:
		//			join (perhaps w/ innerHTML/outerHTML overload for toString() of items?)
		//			reduce
		//			reduceRight

		slice: function(/*===== begin, end =====*/){
			// summary:
			//		Returns a new NodeList, maintaining this one in place
			// description:
			//		This method behaves exactly like the Array.slice method
			//		with the caveat that it returns a dojo.NodeList and not a
			//		raw Array. For more details, see:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:slice
			// begin: Integer
			//		Can be a positive or negative integer, with positive
			//		integers noting the offset to begin at, and negative
			//		integers denoting an offset from the end (i.e., to the left
			//		of the end)
			// end: Integer?
			//		Optional parameter to describe what position relative to
			//		the NodeList's zero index to end the slice at. Like begin,
			//		can be positive or negative.
			var a = d._toArray(arguments);
			return tnl(a.slice.apply(this, a));
		},

		splice: function(/*===== index, howmany, item =====*/){
			// summary:
			//		Returns a new NodeList, manipulating this NodeList based on
			//		the arguments passed, potentially splicing in new elements
			//		at an offset, optionally deleting elements
			// description:
			//		This method behaves exactly like the Array.splice method
			//		with the caveat that it returns a dojo.NodeList and not a
			//		raw Array. For more details, see:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:splice>
			// index: Integer
			//		begin can be a positive or negative integer, with positive
			//		integers noting the offset to begin at, and negative
			//		integers denoting an offset from the end (i.e., to the left
			//		of the end)
			// howmany: Integer?
			//		Optional parameter to describe what position relative to
			//		the NodeList's zero index to end the slice at. Like begin,
			//		can be positive or negative.
			// item: Object...?
			//		Any number of optional parameters may be passed in to be
			//		spliced into the NodeList
			// returns:
			//		dojo.NodeList
			var a = d._toArray(arguments);
			return tnl(a.splice.apply(this, a));
		},

		concat: function(/*===== item =====*/){
			// summary:
			//		Returns a new NodeList comprised of items in this NodeList
			//		as well as items passed in as parameters
			// description:
			//		This method behaves exactly like the Array.concat method
			//		with the caveat that it returns a dojo.NodeList and not a
			//		raw Array. For more details, see:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:concat>
			// item: Object...?
			//		Any number of optional parameters may be passed in to be
			//		spliced into the NodeList
			// returns:
			//		dojo.NodeList
			var a = d._toArray(arguments, 0, [this]);
			return tnl(a.concat.apply([], a));
		},
		
		indexOf: function(/*Object*/ value, /*Integer?*/ fromIndex){
			//	summary:
			//		see dojo.indexOf(). The primary difference is that the acted-on 
			//		array is implicitly this NodeList
			// value:
			//		The value to search for.
			// fromIndex:
			//		The loction to start searching from. Optional. Defaults to 0.
			//	description:
			//		For more details on the behavior of indexOf, see:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:indexOf>
			//	returns:
			//		Positive Integer or 0 for a match, -1 of not found.
			return d.indexOf(this, value, fromIndex); // Integer
		},

		lastIndexOf: function(/*===== value, fromIndex =====*/){
			// summary:
			//		see dojo.lastIndexOf(). The primary difference is that the
			//		acted-on array is implicitly this NodeList
			//	description:
			//		For more details on the behavior of lastIndexOf, see:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:lastIndexOf>
			// value: Object
			//		The value to search for.
			// fromIndex: Integer?
			//		The loction to start searching from. Optional. Defaults to 0.
			// returns:
			//		Positive Integer or 0 for a match, -1 of not found.
			return d.lastIndexOf.apply(d, d._toArray(arguments, 0, [this])); // Integer
		},

		every: function(/*Function*/callback, /*Object?*/thisObject){
			//	summary:
			//		see `dojo.every()` and:
			//			<http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:every>
			//		Takes the same structure of arguments and returns as
			//		dojo.every() with the caveat that the passed array is
			//		implicitly this NodeList
			return d.every(this, callback, thisObject); // Boolean
		},

		some: function(/*Function*/callback, /*Object?*/thisObject){
			//	summary:
			//		see dojo.some() and:
			//			http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array:some
			//		Takes the same structure of arguments and returns as
			//		dojo.some() with the caveat that the passed array is
			//		implicitly this NodeList
			return d.some(this, callback, thisObject); // Boolean
		},

		map: function(/*Function*/ func, /*Function?*/ obj){
			//	summary:
			//		see dojo.map(). The primary difference is that the acted-on
			//		array is implicitly this NodeList and the return is a
			//		dojo.NodeList (a subclass of Array)

			return d.map(this, func, obj, d.NodeList); // dojo.NodeList
		},

		forEach: function(callback, thisObj){
			//	summary:
			//		see dojo.forEach(). The primary difference is that the acted-on 
			//		array is implicitly this NodeList

			d.forEach(this, callback, thisObj);
			// non-standard return to allow easier chaining
			return this; // dojo.NodeList 
		},

		// custom methods
		
		coords: function(){
			//	summary:
			// 		Returns the box objects all elements in a node list as
			// 		an Array (*not* a NodeList)
			
			return d.map(this, d.coords); // Array
		},

		/*=====
		attr: function(property, value){
			//	summary:
			//		gets or sets the DOM attribute for every element in the
			//		NodeList
			//	property: String
			//		the attribute to get/set
			//	value: String?
			//		optional. The value to set the property to
			//	returns:
			//		if no value is passed, the result is an array of attribute values
			//		If a value is passed, the return is this NodeList
			return; // dojo.NodeList
			return; // Array
		},

		style: function(property, value){
			//	summary:
			//		gets or sets the CSS property for every element in the NodeList
			//	property: String
			//		the CSS property to get/set, in JavaScript notation
			//		("lineHieght" instead of "line-height") 
			//	value: String?
			//		optional. The value to set the property to
			//	returns:
			//		if no value is passed, the result is an array of strings.
			//		If a value is passed, the return is this NodeList
			return; // dojo.NodeList
			return; // Array
		},

		addClass: function(className){
			//	summary:
			//		adds the specified class to every node in the list
			//	className: String
			//		the CSS class to add
			return; // dojo.NodeList
		},

		removeClass: function(className){
			//	summary:
			//		removes the specified class from every node in the list
			//	className: String
			//		the CSS class to add
			//	returns:
			//		dojo.NodeList, this list
			return; // dojo.NodeList
		},

		toggleClass: function(className, condition){
			//	summary:
			//		Adds a class to node if not present, or removes if present.
			//		Pass a boolean condition if you want to explicitly add or remove.
			//	condition: Boolean?
			//		If passed, true means to add the class, false means to remove.
			//	className: String
			//		the CSS class to add
			return; // dojo.NodeList
		},

		connect: function(methodName, objOrFunc, funcName){
			//	summary:
			//		attach event handlers to every item of the NodeList. Uses dojo.connect()
			//		so event properties are normalized
			//	methodName: String
			//		the name of the method to attach to. For DOM events, this should be
			//		the lower-case name of the event
			//	objOrFunc: Object|Function|String
			//		if 2 arguments are passed (methodName, objOrFunc), objOrFunc should
			//		reference a function or be the name of the function in the global
			//		namespace to attach. If 3 arguments are provided
			//		(methodName, objOrFunc, funcName), objOrFunc must be the scope to 
			//		locate the bound function in
			//	funcName: String?
			//		optional. A string naming the function in objOrFunc to bind to the
			//		event. May also be a function reference.
			//	example:
			//		add an onclick handler to every button on the page
			//		|	dojo.query("div:nth-child(odd)").connect("onclick", function(e){
			//		|		console.debug("clicked!");
			//		|	});
			// example:
			//		attach foo.bar() to every odd div's onmouseover
			//		|	dojo.query("div:nth-child(odd)").connect("onmouseover", foo, "bar");
		},
		=====*/
		attr: _mapIntoDojo("attr"),
		style: _mapIntoDojo("style"),
		addClass: _mapIntoDojo("addClass", true),
		removeClass: _mapIntoDojo("removeClass", true),
		toggleClass: _mapIntoDojo("toggleClass", true),
		connect: _mapIntoDojo("connect", true),

		// FIXME: connectPublisher()? connectRunOnce()?

		place: function(/*String||Node*/ queryOrNode, /*String*/ position){
			//	summary:
			//		places elements of this node list relative to the first element matched
			//		by queryOrNode. Returns the original NodeList.
			//	queryOrNode:
			//		may be a string representing any valid CSS3 selector or a DOM node.
			//		In the selector case, only the first matching element will be used 
			//		for relative positioning.
			//	position:
			//		can be one of:
			//			* "last"||"end" (default)
			//			* "first||"start"
			//			* "before"
			//			* "after"
			// 		or an offset in the childNodes property
			var item = d.query(queryOrNode)[0];
			return this.forEach(function(i){ d.place(i, item, position); }); // dojo.NodeList
		},

		orphan: function(/*String?*/ simpleFilter){
			//	summary:
			//		removes elements in this list that match the simple
			//		filter from their parents and returns them as a new
			//		NodeList.
			//	simpleFilter:
			//		single-expression CSS filter
			//	returns:
			//		`dojo.NodeList` containing the orpahned elements 
			return (simpleFilter ? d._filterQueryResult(this, simpleFilter) : this). // dojo.NodeList
				forEach("if(item.parentNode){ item.parentNode.removeChild(item); }"); 
		},

		adopt: function(/*String||Array||DomNode*/ queryOrListOrNode, /*String?*/ position){
			//	summary:
			//		places any/all elements in queryOrListOrNode at a
			//		position relative to the first element in this list.
			//		Returns a dojo.NodeList of the adopted elements.
			//	queryOrListOrNode:
			//		a DOM node or a query string or a query result.
			//		Represents the nodes to be adopted relative to the
			//		first element of this NodeList.
			//	position:
			//		can be one of:
			//			* "last"||"end" (default)
			//			* "first||"start"
			//			* "before"
			//			* "after"
			// 		or an offset in the childNodes property
			var item = this[0];
			return d.query(queryOrListOrNode).forEach(function(ai){ // dojo.NodeList
				d.place(ai, item, position || "last"); 
			});
		},

		// FIXME: do we need this?
		query: function(/*String*/ queryStr){
			//	summary:
			//		Returns a new, flattened NodeList. Elements of the new list
			//		satisfy the passed query but use elements of the
			//		current NodeList as query roots.

			if(!queryStr){ return this; }

			// FIXME: probably slow
			// FIXME: use map?
			var ret = d.NodeList();
			this.forEach(function(item){
				// FIXME: why would we ever get undefined here?
				ret = ret.concat(d.query(queryStr, item).filter(function(subItem){ return (subItem !== undefined); }));
			});
			return ret; // dojo.NodeList
		},

		filter: function(/*String*/ simpleQuery){
			//	summary:
			// 		"masks" the built-in javascript filter() method to support
			//		passing a simple string filter in addition to supporting
			//		filtering function objects.
			//	example:
			//		"regular" JS filter syntax as exposed in dojo.filter:
			//		|	dojo.query("*").filter(function(item){
			//		|		// highlight every paragraph
			//		|		return (item.nodeName == "p");
			//		|	}).styles("backgroundColor", "yellow");
			// example:
			//		the same filtering using a CSS selector
			//		|	dojo.query("*").filter("p").styles("backgroundColor", "yellow");

			var items = this;
			var _a = arguments;
			var r = d.NodeList();
			var rp = function(t){ 
				if(t !== undefined){
					r.push(t); 
				}
			}
			if(d.isString(simpleQuery)){
				items = d._filterQueryResult(this, _a[0]);
				if(_a.length == 1){
					// if we only got a string query, pass back the filtered results
					return items; // dojo.NodeList
				}
				// if we got a callback, run it over the filtered items
				_a.shift();
			}
			// handle the (callback, [thisObject]) case
			d.forEach(d.filter(items, _a[0], _a[1]), rp);
			return r; // dojo.NodeList
		},
		
		/*
		// FIXME: should this be "copyTo" and include parenting info?
		clone: function(){
			// summary:
			//		creates node clones of each element of this list
			//		and returns a new list containing the clones
		},
		*/

		addContent: function(/*String*/ content, /*String||Integer?*/ position){
			//	summary:
			//		add a node or some HTML as a string to every item in the list. 
			//		Returns the original list.
			//	description:
			//		a copy of the HTML content is added to each item in the
			//		list, with an optional position argument. If no position
			//		argument is provided, the content is appended to the end of
			//		each item.
			//	content:
			//		the HTML in string format to add at position to every item
			//	position:
			//		can be one of:
			//			* "last"||"end" (default)
			//			* "first||"start"
			//			* "before"
			//			* "after"
			// 		or an offset in the childNodes property
			//	example:
			//		appends content to the end if the position is ommitted
			//	|	dojo.query("h3 > p").addContent("hey there!");
			//	example:
			//		add something to the front of each element that has a "thinger" property:
			//	|	dojo.query("[thinger]").addContent("...", "first");
			//	example:
			//		adds a header before each element of the list
			//	|	dojo.query(".note").addContent("<h4>NOTE:</h4>", "before");
			var ta = d.doc.createElement("span");
			if(d.isString(content)){
				ta.innerHTML = content;
			}else{
				ta.appendChild(content);
			}
			if(position === undefined){
				position = "last";
			}
			var ct = (position == "first" || position == "after") ? "lastChild" : "firstChild";
			this.forEach(function(item){
				var tn = ta.cloneNode(true);
				while(tn[ct]){
					d.place(tn[ct], item, position);
				}
			});
			return this; // dojo.NodeList
		},

		empty: function(){
			//	summary:
			//		clears all content from each node in the list
			return this.forEach("item.innerHTML='';"); // dojo.NodeList

			// FIXME: should we be checking for and/or disposing of widgets below these nodes?
		},
		
		instantiate: function(/*String|Object*/ declaredClass, /*Object?*/ properties){
			//	summary:
			//		Create a new instance of a specified class, using the
			//		specified properties and each node in the nodeList as a
			//		srcNodeRef
			//
			var c = d.isFunction(declaredClass) ? declaredClass : d.getObject(declaredClass);
			return this.forEach(function(i){
				new c(properties||{},i);
			}) // dojo.NodeList
		},

		at: function(/*===== index =====*/){
			//	summary:
			//		Returns a new NodeList comprised of items in this NodeList
			//		at the given index or indices.
			//	index: Integer...
			//		One or more 0-based indices of items in the current NodeList.
			//	returns:
			//		dojo.NodeList
			var nl = new dojo.NodeList();
			dojo.forEach(arguments, function(i) { if(this[i]) { nl.push(this[i]); } }, this);
			return nl; // dojo.NodeList
		}

	});

	// syntactic sugar for DOM events
	d.forEach([
		"blur", "focus", "click", "error", "keydown", "keypress", "keyup", "load", "mousedown",
		"mouseenter", "mouseleave", "mousemove", "mouseout", "mouseover", "mouseup", "submit" 
		], function(evt){
			var _oe = "on"+evt;
			d.NodeList.prototype[_oe] = function(a, b){
				return this.connect(_oe, a, b);
			}
				// FIXME: should these events trigger publishes?
				/*
				return (a ? this.connect(_oe, a, b) : 
							this.forEach(function(n){  
								// FIXME:
								//		listeners get buried by
								//		addEventListener and can't be dug back
								//		out to be triggered externally.
								// see:
								//		http://developer.mozilla.org/en/docs/DOM:element

								console.debug(n, evt, _oe);

								// FIXME: need synthetic event support!
								var _e = { target: n, faux: true, type: evt };
								// dojo._event_listener._synthesizeEvent({}, { target: n, faux: true, type: evt });
								try{ n[evt](_e); }catch(e){ console.debug(e); }
								try{ n[_oe](_e); }catch(e){ console.debug(e); }
							})
				);
			}
			*/
		}
	);

})();

}

if(!dojo._hasResource["dojo._base.query"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.query"] = true;
if(dojo){
	dojo.provide("dojo._base.query");
	
	
}

/*
	dojo.query() architectural overview:

		dojo.query is a relatively full-featured CSS3 query library. It is
		designed to take any valid CSS3 selector and return the nodes matching
		the selector. To do this quickly, it processes queries in several
		steps, applying caching where profitable.
		
		The steps (roughly in reverse order of the way they appear in the code):
			1.) check to see if we already have a "query dispatcher"
				- if so, use that with the given parameterization. Skip to step 4.
			2.) attempt to determine which branch to dispatch the query to:
				- JS (optimized DOM iteration)
				- xpath (for browsers that support it and where it's fast)
				- native (not available in any browser yet)
			3.) tokenize and convert to executable "query dispatcher"
				- this is where the lion's share of the complexity in the
				  system lies. In the DOM version, the query dispatcher is
				  assembled as a chain of "yes/no" test functions pertaining to
				  a section of a simple query statement (".blah:nth-child(odd)"
				  but not "div div", which is 2 simple statements). Individual
				  statement dispatchers are cached (to prevent re-definition)
				  as are entire dispatch chains (to make re-execution of the
				  same query fast)
				- in the xpath path, tokenization yields a concatenation of
				  parameterized xpath selectors. As with the DOM version, both
				  simple selector blocks and overall evaluators are cached to
				  prevent re-defintion
			4.) the resulting query dispatcher is called in the passed scope (by default the top-level document)
				- for DOM queries, this results in a recursive, top-down
				  evaluation of nodes based on each simple query section
				- xpath queries can, thankfully, be executed in one shot
			5.) matched nodes are pruned to ensure they are unique

		NOTE: 
				this design is likely to become simplified with the advent of
				querySelectorAll for supported browsers which today use the
				XPath variant. E.g., once Firefox 3.1 is on the street,
				dropping the xpath engine (and the query optimizer to select
				for it) should remove significant code (assuming that
				querySelectorAll is indeed faster than xpath and DOM on FF 3.1).
*/

;(function(d){
	// define everything in a closure for compressability reasons. "d" is an
	// alias to "dojo" since it's so frequently used. This seems a
	// transformation that the build system could perform on a per-file basis.

	////////////////////////////////////////////////////////////////////////
	// Toolkit aliases
	////////////////////////////////////////////////////////////////////////

	// if you are extracing dojo.query for use in your own system, you will
	// need to provide over-rides for these methods. No other porting should be
	// necessaray, save for configuring the system to use a class other than
	// dojo.NodeList as the return instance instantiator
	var trim = d.trim;
	var each = d.forEach;
	// d.isIE; // float
	// d.isSafari; // float
	// d.doc ; // float
	var listCtor = d.NodeList;
	var isString = d.isString;

	var getDoc = function(){ return d.doc; };
	var attr = d.attr; // FIXME: we probably don't need to use attr() for checked

	////////////////////////////////////////////////////////////////////////
	// Utility code
	////////////////////////////////////////////////////////////////////////


	// on IE, using "children" can be much faster
	var childNodesName = d.isIE ? "children" : "childNodes";

	// global thunk to determine whether we should treat the current query as
	// case sensitive or not. Set by the query evaluator based on the document
	// passed as the current context to search.
	var caseSensitive = false;

	var yesman = function(){ return true; };

	var getQueryParts = function(query){
		// summary: state machine for query tokenization

		// are we implicitly searching all children?
		if(">~+".indexOf(query.charAt(query.length-1)) >= 0){
			query += " *"
		}
		query += " "; // ensure that we terminate the state machine

		var ts = function(/*Integer*/ s, /*Integer*/ e){
			// take an index to start a string slice from and an end position
			// and return a trimmed copy of that sub-string
			return trim(query.slice(s, e));
		}

		// the overall data graph of the full query, as represented by queryPart objects
		var qparts = []; 

		// state keeping vars
		var inBrackets = -1, inParens = -1, inMatchFor = -1, 
			inPseudo = -1, inClass = -1, inId = -1, inTag = -1, 
			lc = "", cc = "", pStart;
		// iteration vars
		var x = 0; // index in the query
		var ql = query.length;
		var currentPart = null; // data structure representing the entire clause
		var _cp = null; // the current pseudo or attr matcher
		// several temporary variables are assigned to this structure durring a
		// potential sub-expression match:
		//		attr: a string representing the current full attribute match in a bracket expression
		//		type: if there's an operator in a bracket expression, this is used to keep track of it
		//		value: the internals of parenthetical expression for a pseudo. for :nth-child(2n+1), value might be "2n+1"

		var endTag = function(){
			// called when the tokenizer hits the end of a particular tag name.
			// Re-sets state variables for tag matching and sets up the matcher
			// to handle the next type of token (tag or operator).
			if(inTag >= 0){
				var tv = (inTag == x) ? null : ts(inTag, x); // .toLowerCase();
				currentPart[ (">~+".indexOf(tv) < 0) ? "tag" : "oper" ] = tv;
				inTag = -1;
			}
		}

		var endId = function(){
			// called when the tokenizer might be at the end of an ID portion of a match
			if(inId >= 0){
				currentPart.id = ts(inId, x).replace(/\\/g, "");
				inId = -1;
			}
		}

		var endClass = function(){
			// called when the tokenizer might be at the end of a class name
			// match. CSS allows for multiple classes, so we augment the
			// current item with another class in its list
			if(inClass >= 0){
				currentPart.classes.push(ts(inClass+1, x).replace(/\\/g, ""));
				inClass = -1;
			}
		}

		var endAll = function(){
			// at the end of a simple fragment, so wall off the matches
			endId(); endTag(); endClass();
		}

		// iterate over the query, charachter by charachter, building up a 
		// list of query part objects
		for(; lc = cc, cc = query.charAt(x), x < ql; x++){
			//		cc: the current character in the match
			//		lc: the last charachter (if any)

			// someone is trying to escape something, so don't try to match any
			// fragments. We assume we're inside a literal.
			if(lc == "\\"){ continue; } 
			if(!currentPart){ // a part was just ended or none has yet been created
				// NOTE: I hate all this alloc, but it's shorter than writing tons of if's
				pStart = x;
				//	rules describe full CSS sub-expressions, like:
				//		#someId
				//		.className:first-child
				//	but not:
				//		thinger > div.howdy[type=thinger]
				//	the indidual components of the previous query would be
				//	split into 3 parts that would be represented a structure
				//	kind if like:
				//		[
				//			{
				//				query: "thinger",
				//				tag: "thinger",
				//			},
				//			{
				//				query: ">",
				//				oper: ">",
				//			},
				//			{
				//				query: "div.howdy[type=thinger]",
				//				classes: ["howdy"],
				//			},
				//		]
				currentPart = {
					query: null, // the full text of the part's rule
					pseudos: [], // CSS supports multiple pseud-class matches in a single rule
					attrs: [], 	// CSS supports multi-attribute match, so we need an array
					classes: [], // class matches may be additive, e.g.: .thinger.blah.howdy
					tag: null, 	// only one tag...
					oper: null, // ...or operator per component. Note that these wind up being exclusive.
					id: null  	// the id component of a rule
				};
				// if we don't have a part, we assume we're going to start at
				// the beginning of a match, which should be a tag name. This
				// might fault a little later on, but we detect that and this
				// iteration will still be fine.
				inTag = x; 
			}

			if(inBrackets >= 0){
				// look for a the close first
				if(cc == "]"){ // if we're in a [...] clause and we end, do assignment
					if(!_cp.attr){
						// no attribute match was previously begun, so we
						// assume this is an attribute existance match in the
						// form of [someAttributeName]
						_cp.attr = ts(inBrackets+1, x);
					}else{
						// we had an attribute already, so we know that we're matching some sort of value, as in [attrName=howdy]
						_cp.matchFor = ts((inMatchFor||inBrackets+1), x);
					}
					var cmf = _cp.matchFor;
					if(cmf){
						// try to strip quotes from the matchFor value. We want
						// [attrName=howdy] to match the same 
						//	as [attrName = 'howdy' ]
						if(	(cmf.charAt(0) == '"') || (cmf.charAt(0)  == "'") ){
							_cp.matchFor = cmf.substring(1, cmf.length-1);
						}
					}
					// end the attribute by adding it to the list of attributes. 
					currentPart.attrs.push(_cp);
					_cp = null; // necessaray?
					inBrackets = inMatchFor = -1;
				}else if(cc == "="){
					// if the last char was an operator prefix, make sure we
					// record it along with the "=" operator. 
					var addToCc = ("|~^$*".indexOf(lc) >=0 ) ? lc : "";
					_cp.type = addToCc+cc;
					_cp.attr = ts(inBrackets+1, x-addToCc.length);
					inMatchFor = x+1;
				}
				// now look for other clause parts
			}else if(inParens >= 0){
				// if we're in a parenthetical expression, we need to figure out if it's attached to a pseduo-selector rule like :nth-child(1)
				if(cc == ")"){
					if(inPseudo >= 0){
						_cp.value = ts(inParens+1, x);
					}
					inPseudo = inParens = -1;
				}
			}else if(cc == "#"){
				// start of an ID match
				endAll();
				inId = x+1;
			}else if(cc == "."){
				// start of a class match
				endAll();
				inClass = x;
			}else if(cc == ":"){
				// start of a pseudo-selector match
				endAll();
				inPseudo = x;
			}else if(cc == "["){
				// start of an attribute match. 
				endAll();
				inBrackets = x;
				// provide a new structure for the attribute match to fill-in
				_cp = {
					/*=====
					attr: null, type: null, matchFor: null
					=====*/
				};
			}else if(cc == "("){
				// we really only care if we've entered a parenthetical
				// expression if we're already inside a pseudo-selector match
				if(inPseudo >= 0){
					// provide a new structure for the pseudo match to fill-in
					_cp = { 
						name: ts(inPseudo+1, x), 
						value: null
					}
					currentPart.pseudos.push(_cp);
				}
				inParens = x;
			}else if(cc == " " && lc != cc){ 
				// if it's a space char and the last char is too, consume the
				// current one without doing more work

				// NOTE: we expect the query to be " " terminated
				endAll();
				if(inPseudo >= 0){
					currentPart.pseudos.push({ name: ts(inPseudo+1, x) });
				}
				// hint to the selector engine to tell it whether or not it
				// needs to do any iteration. Many simple selectors don't, and
				// we can avoid significant construction-time work by advising
				// the system to skip them
				currentPart.hasLoops = (	
						currentPart.pseudos.length || 
						currentPart.attrs.length || 
						currentPart.classes.length	);

				currentPart.query = ts(pStart, x); // save the full expression as a string

				// otag/tag are hints to suggest to the system whether or not
				// it's an operator or a tag. We save a copy of otag since the
				// tag name is cast to upper-case in regular HTML matches. The
				// system has a global switch to figure out if the current
				// expression needs to be case sensitive or not and it will use
				// otag or tag accordingly
				currentPart.otag = currentPart.tag = (currentPart["oper"]) ? null : (currentPart.tag || "*");

				if(currentPart.tag){
					// if we're in a case-insensitive HTML doc, we likely want
					// the toUpperCase when matching on element.tagName. If we
					// do it here, we can skip the string op per node
					// comparison
					currentPart.tag = currentPart.tag.toUpperCase();
				}
				// add the part to the list
				qparts.push(currentPart);
				currentPart = null;
			}
		}
		return qparts;
	};
	

	////////////////////////////////////////////////////////////////////////
	// XPath query code
	////////////////////////////////////////////////////////////////////////

	// this array is a lookup used to generate an attribute matching function.
	// There is a similar lookup/generator list for the DOM branch with similar
	// calling semantics.
	var xPathAttrs = {
		"*=": function(attr, value){
			return "[contains(@"+attr+", '"+ value +"')]";
		},
		"^=": function(attr, value){
			return "[starts-with(@"+attr+", '"+ value +"')]";
		},
		"$=": function(attr, value){
			return "[substring(@"+attr+", string-length(@"+attr+")-"+(value.length-1)+")='"+value+"']";
		},
		"~=": function(attr, value){
			return "[contains(concat(' ',@"+attr+",' '), ' "+ value +" ')]";
		},
		"|=": function(attr, value){
			return "[contains(concat(' ',@"+attr+",' '), ' "+ value +"-')]";
		},
		"=": function(attr, value){
			return "[@"+attr+"='"+ value +"']";
		}
	};

	// takes a list of attribute searches, the overall query, a function to
	// generate a default matcher, and a closure-bound method for providing a
	// matching function that generates whatever type of yes/no distinguisher
	// the query method needs. The method is a bit tortured and hard to read
	// because it needs to be used in both the XPath and DOM branches.
	var handleAttrs = function(	attrList, 
								query, 
								getDefault, 
								handleMatch){
		each(query.attrs, function(attr){
			var matcher;
			// type, attr, matchFor
			if(attr.type && attrList[attr.type]){
				matcher = attrList[attr.type](attr.attr, attr.matchFor);
			}else if(attr.attr.length){
				matcher = getDefault(attr.attr);
			}
			if(matcher){ handleMatch(matcher); }
		});
	}

	var buildPath = function(query){
		// create an xpath expression from a full css query
		var xpath = ".";
		var qparts = getQueryParts(trim(query));
		while(qparts.length){
			var tqp = qparts.shift();
			var prefix;
			var postfix = "";
			if(tqp.oper == ">"){
				prefix = "/";
				// prefix = "/child::*";
				tqp = qparts.shift();
			}else if(tqp.oper == "~"){
				prefix = "/following-sibling::"; // get element following siblings
				tqp = qparts.shift();
			}else if(tqp.oper == "+"){
				// FIXME: 
				//		fails when selecting subsequent siblings by node type
				//		because the position() checks the position in the list
				//		of matching elements and not the localized siblings
				prefix = "/following-sibling::";
				postfix = "[position()=1]";
				tqp = qparts.shift();
			}else{
				prefix = "//";
				// prefix = "/descendant::*"
			}

			// get the tag name (if any)

			xpath += prefix + tqp.tag + postfix;
			
			// check to see if it's got an id. Needs to come first in xpath.
			if(tqp.id){
				xpath += "[@id='"+tqp.id+"'][1]";
			}

			each(tqp.classes, function(cn){
				var cnl = cn.length;
				var padding = " ";
				if(cn.charAt(cnl-1) == "*"){
					padding = ""; cn = cn.substr(0, cnl-1);
				}
				xpath += 
					"[contains(concat(' ',@class,' '), ' "+
					cn + padding + "')]";
			});

			handleAttrs(xPathAttrs, tqp, 
				function(condition){
						return "[@"+condition+"]";
				},
				function(matcher){
					xpath += matcher;
				}
			);

			// FIXME: 
			//		need to implement pseudo-class checks!! Currently pseudos
			//		force the DOM branch to be run instead
		};
		return xpath;
	};

	var _xpathFuncCache = {};
	var getXPathFunc = function(path){
		if(_xpathFuncCache[path]){
			return _xpathFuncCache[path];
		}

		var doc = getDoc();
		// don't need to memoize. The closure scope handles it for us.
		var xpath = buildPath(path);

		var tf = function(parent){
			// XPath query strings are memoized.

			var ret = [];
			var xpathResult;
			var tdoc = doc;
			if(parent){
				tdoc = (parent.nodeType == 9) ? parent : parent.ownerDocument;
			}
			try{
				xpathResult = tdoc.evaluate(xpath, parent, null, 
												// XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
												XPathResult.ANY_TYPE, null);
			}catch(e){
				console.debug("failure in exprssion:", xpath, "under:", parent);
				console.debug(e);
			}
			var result = xpathResult.iterateNext();
			while(result){
				ret.push(result);
				result = xpathResult.iterateNext();
			}
			return ret;
		}
		return (_xpathFuncCache[path] = tf);
	};

	/*
	d.xPathMatch = function(query){
		// XPath based DOM query system. Handles a small subset of CSS
		// selectors, subset is identical to the non-XPath version of this
		// function. 

		return getXPathFunc(query)();
	}
	*/

	////////////////////////////////////////////////////////////////////////
	// DOM query code
	////////////////////////////////////////////////////////////////////////

	var _filtersCache = {};
	var _simpleFiltersCache = {};

	// the basic building block of the yes/no chaining system. agree(f1, f2)
	// generates a new function which returns the boolean results of both of
	// the passed functions to a single logical-anded result.
	var agree = function(first, second){
		if(!first){ return second; }
		if(!second){ return first; }

		return function(){
			return first.apply(window, arguments) && second.apply(window, arguments);
		}
	}

	var _childElements = function(root){
		// get an array of child *elements*, skipping text and comment nodes
		var ret = [];
		var te, x = 0, tret = root[childNodesName];
		while((te = tret[x++])){
			if(te.nodeType == 1){ ret.push(te); }
		}
		return ret;
	}

	var _nextSiblings = function(root, single){
		var ret = [];
		var te = root;
		while((te = te.nextSibling)){
			if(te.nodeType == 1){
				ret.push(te);
				if(single){ break; }
			}
		}
		return ret;
	}

	// FIXME:
	//		we need to re-write the way "~" and "+" selectors are handled since
	//		the left-hand selector simply modifies the right (which is the
	//		actual search selector). We need to locate on search selector
	//		instead of modifier to speed up these searches.

	var _filterDown = function(element, queryParts, matchArr, idx){
		// NOTE:
		//		in the fast path! this function is called recursively and for
		//		every run of a query.
		var nidx = idx+1;
		var isFinal = (queryParts.length == nidx);
		var tqp = queryParts[idx];

		// see if we can constrain our next level to direct children
		if(tqp.oper){
			// find some eligable children to search
			var ecn = (tqp.oper == ">") ? 
				_childElements(element) :
				_nextSiblings(element, (tqp.oper == "+"));

			if(!ecn || !ecn.length){
				return;
			}
			nidx++;
			isFinal = (queryParts.length == nidx);
			// kinda janky, too much array alloc
			var tf = getFilterFunc(queryParts[idx+1]);
			// for(var x=ecn.length-1, te; x>=0, te=ecn[x]; x--){
			for(var x=0, ecnl=ecn.length, te; x<ecnl, te=ecn[x]; x++){
				if(tf(te)){
					if(isFinal){
						matchArr.push(te);
					}else{
						_filterDown(te, queryParts, matchArr, nidx);
					}
				}
				/*
				if(x==0){
					break;
				}
				*/
			}
		}

		// otherwise, keep going down, unless we'er at the end
		var candidates = getElementsFunc(tqp)(element);
		if(isFinal){
			while(candidates.length){
				matchArr.push(candidates.shift());
			}
			/*
			candidates.unshift(0, matchArr.length-1);
			matchArr.splice.apply(matchArr, candidates);
			*/
		}else{
			// if we're not yet at the bottom, keep going!
			while(candidates.length){
				_filterDown(candidates.shift(), queryParts, matchArr, nidx);
			}
		}
	}

	var filterDown = function(elements, queryParts){
		var ret = [];

		// for every root, get the elements that match the descendant selector
		// for(var x=elements.length-1, te; x>=0, te=elements[x]; x--){
		var x = elements.length - 1, te;
		while((te = elements[x--])){
			_filterDown(te, queryParts, ret, 0);
		}
		return ret;
	}

	var getFilterFunc = function(q){
		// note: query can't have spaces!
		if(_filtersCache[q.query]){
			return _filtersCache[q.query];
		}
		var ff = null;

		// does it have a tagName component?
		if(q.tag){
			if(q.tag == "*"){
				ff = agree(ff, 
					function(elem){
						return (elem.nodeType == 1);
					}
				);
			}else{
				// tag name match
				ff = agree(ff, 
					function(elem){
						return (
							(elem.nodeType == 1) &&
							(q[ caseSensitive ? "otag" : "tag" ] == elem.tagName)
							// (q.tag == elem.tagName.toLowerCase())
						);
						// return isTn;
					}
				);
			}
		}

		// does the node have an ID?
		if(q.id){
			ff = agree(ff, 
				function(elem){
					return (
						(elem.nodeType == 1) &&
						(elem.id == q.id)
					);
				}
			);
		}

		if(q.hasLoops){
			// if we have other query param parts, make sure we add them to the
			// filter chain
			ff = agree(ff, getSimpleFilterFunc(q));
		}

		return _filtersCache[q.query] = ff;
	}

	var getNodeIndex = function(node){
		// NOTE: 
		//		we could have a more accurate caching mechanism by invalidating
		//		caches after the query has finished, but I think that'd lead to
		//		significantly more cache churn than the cache would provide
		//		value for in the common case. Generally, we're more
		//		conservative (and therefore, more accurate) than jQuery and
		//		DomQuery WRT node node indexes, but there may be corner cases
		//		in which we fall down.  How much we care about them is TBD.

		var pn = node.parentNode;
		var pnc = pn.childNodes;

		// check to see if we can trust the cache. If not, re-key the whole
		// thing and return our node match from that.

		var nidx = -1;
		var child = pn.firstChild;
		if(!child){
			return nidx;
		}

		var ci = node["__cachedIndex"];
		var cl = pn["__cachedLength"];

		// only handle cache building if we've gone out of sync
		if(((typeof cl == "number")&&(cl != pnc.length))||(typeof ci != "number")){
			// rip though the whole set, building cache indexes as we go
			pn["__cachedLength"] = pnc.length;
			var idx = 1;
			do{
				// we only assign indexes for nodes with nodeType == 1, as per:
				//		http://www.w3.org/TR/css3-selectors/#nth-child-pseudo
				// only elements are counted in the search order, and they
				// begin at 1 for the first child's index

				if(child === node){
					nidx = idx;
				}
				if(child.nodeType == 1){
					child["__cachedIndex"] = idx;
					idx++;
				}
				child = child.nextSibling;
			}while(child);
		}else{
			// NOTE: 
			//		could be incorrect in some cases (node swaps involving the
			//		passed node, etc.), but we ignore those due to the relative
			//		unlikelihood of that occuring
			nidx = ci;
		}
		return nidx;
	}

	var firedCount = 0;

	var blank = "";
	var _getAttr = function(elem, attr){
		if(attr == "class"){
			return elem.className || blank;
		}
		if(attr == "for"){
			return elem.htmlFor || blank;
		}
		if(attr == "style"){
			return elem.style.cssText || blank;
		}
		return (caseSensitive ? elem.getAttribute(attr) : elem.getAttribute(attr, 2)) || blank;
	}

	var attrs = {
		"*=": function(attr, value){
			return function(elem){
				// E[foo*="bar"]
				//		an E element whose "foo" attribute value contains
				//		the substring "bar"
				return (_getAttr(elem, attr).indexOf(value)>=0);
			}
		},
		"^=": function(attr, value){
			// E[foo^="bar"]
			//		an E element whose "foo" attribute value begins exactly
			//		with the string "bar"
			return function(elem){
				return (_getAttr(elem, attr).indexOf(value)==0);
			}
		},
		"$=": function(attr, value){
			// E[foo$="bar"]	
			//		an E element whose "foo" attribute value ends exactly
			//		with the string "bar"
			var tval = " "+value;
			return function(elem){
				var ea = " "+_getAttr(elem, attr);
				return (ea.lastIndexOf(value)==(ea.length-value.length));
			}
		},
		"~=": function(attr, value){
			// E[foo~="bar"]	
			//		an E element whose "foo" attribute value is a list of
			//		space-separated values, one of which is exactly equal
			//		to "bar"

			// return "[contains(concat(' ',@"+attr+",' '), ' "+ value +" ')]";
			var tval = " "+value+" ";
			return function(elem){
				var ea = " "+_getAttr(elem, attr)+" ";
				return (ea.indexOf(tval)>=0);
			}
		},
		"|=": function(attr, value){
			// E[hreflang|="en"]
			//		an E element whose "hreflang" attribute has a
			//		hyphen-separated list of values beginning (from the
			//		left) with "en"
			var valueDash = " "+value+"-";
			return function(elem){
				var ea = " "+(elem.getAttribute(attr, 2) || "");
				return (
					(ea == value) ||
					(ea.indexOf(valueDash)==0)
				);
			}
		},
		"=": function(attr, value){
			return function(elem){
				return (_getAttr(elem, attr) == value);
			}
		}
	};

	var pseudos = {
		"checked": function(name, condition){
			return function(elem){
				// FIXME: need to make this more portable!!
				return !!d.attr(elem, "checked");
			}
		},
		"first-child": function(name, condition){
			return function(elem){
				if(elem.nodeType != 1){ return false; }
				// check to see if any of the previous siblings are elements
				var fc = elem.previousSibling;
				while(fc && (fc.nodeType != 1)){
					fc = fc.previousSibling;
				}
				return (!fc);
			}
		},
		"last-child": function(name, condition){
			return function(elem){
				if(elem.nodeType != 1){ return false; }
				// check to see if any of the next siblings are elements
				var nc = elem.nextSibling;
				while(nc && (nc.nodeType != 1)){
					nc = nc.nextSibling;
				}
				return (!nc);
			}
		},
		"empty": function(name, condition){
			return function(elem){
				// DomQuery and jQuery get this wrong, oddly enough.
				// The CSS 3 selectors spec is pretty explicit about
				// it, too.
				var cn = elem.childNodes;
				var cnl = elem.childNodes.length;
				// if(!cnl){ return true; }
				for(var x=cnl-1; x >= 0; x--){
					var nt = cn[x].nodeType;
					if((nt == 1)||(nt == 3)){ return false; }
				}
				return true;
			}
		},
		"contains": function(name, condition){
			return function(elem){
				// FIXME: I dislike this version of "contains", as
				// whimsical attribute could set it off. An inner-text
				// based version might be more accurate, but since
				// jQuery and DomQuery also potentially get this wrong,
				// I'm leaving it for now.
				if(condition.charAt(0)=='"' || condition.charAt(0)=="'"){//remove quote
					condition=condition.substr(1,condition.length-2);
				}
				return (elem.innerHTML.indexOf(condition) >= 0);
			}
		},
		"not": function(name, condition){
			var ntf = getFilterFunc(getQueryParts(condition)[0]);
			return function(elem){
				return (!ntf(elem));
			}
		},
		"nth-child": function(name, condition){
			var pi = parseInt;
			if(condition == "odd"){
				condition = "2n+1";
			}else if(condition == "even"){
				condition = "2n";
			}
			if(condition.indexOf("n") != -1){
				var tparts = condition.split("n", 2);
				var pred = tparts[0] ? (tparts[0]=='-'?-1:pi(tparts[0])) : 1;
				var idx = tparts[1] ? pi(tparts[1]) : 0;
				var lb = 0, ub = -1;
				if(pred>0){
					if(idx<0){
						idx = (idx % pred) && (pred + (idx % pred));
					}else if(idx>0){
						if(idx >= pred){
							lb = idx - idx % pred;
						}
						idx = idx % pred;
					}
				}else if(pred<0){
					pred *= -1;
					if(idx>0){
						ub = idx;
						idx = idx % pred;
					} //idx has to be greater than 0 when pred is negative; shall we throw an error here?
				}
				if(pred>0){
					return function(elem){
						var i=getNodeIndex(elem);
						return (i>=lb) && (ub<0 || i<=ub) && ((i % pred) == idx);
					}
				}else{
					condition=idx;
				}
			}
			//if(condition.indexOf("n") == -1){
			var ncount = pi(condition);
			return function(elem){
				return (getNodeIndex(elem) == ncount);
			}
		}
	};

	var defaultGetter = (d.isIE) ? function(cond){
		var clc = cond.toLowerCase();
		return function(elem){
			return (caseSensitive ? elem.getAttribute(cond) : elem[cond]||elem[clc]);
		}
	} : function(cond){
		return function(elem){
			return (elem && elem.getAttribute && elem.hasAttribute(cond));
		}
	};

	var getSimpleFilterFunc = function(query){

		var fcHit = (_simpleFiltersCache[query.query]||_filtersCache[query.query]);
		if(fcHit){ return fcHit; }

		var ff = null;

		// the only case where we'll need the tag name is if we came from an ID query
		if(query.id){ // do we have an ID component?
			if(query.tag != "*"){
				ff = agree(ff, function(elem){
					return (elem.tagName == query[ caseSensitive ? "otag" : "tag" ]);
				});
			}
		}

		// if there's a class in our query, generate a match function for it
		each(query.classes, function(cname, idx, arr){
			// get the class name
			var isWildcard = cname.charAt(cname.length-1) == "*";
			if(isWildcard){
				cname = cname.substr(0, cname.length-1);
			}
			// I dislike the regex thing, even if memozied in a cache, but it's VERY short
			var re = new RegExp("(?:^|\\s)" + cname + (isWildcard ? ".*" : "") + "(?:\\s|$)");
			ff = agree(ff, function(elem){
				return re.test(elem.className);
			});
			ff.count = idx;
		});

		each(query.pseudos, function(pseudo){
			if(pseudos[pseudo.name]){
				ff = agree(ff, pseudos[pseudo.name](pseudo.name, pseudo.value));
			}
		});

		handleAttrs(attrs, query, defaultGetter,
			function(tmatcher){ ff = agree(ff, tmatcher); }
		);
		if(!ff){
			ff = yesman; 
		}
		return _simpleFiltersCache[query.query] = ff;
	}

	var _getElementsFuncCache = { };

	var getElementsFunc = function(query, root){
		var fHit = _getElementsFuncCache[query.query];
		if(fHit){ return fHit; }

		// NOTE: this function is in the fast path! not memoized!!!

		// the query doesn't contain any spaces, so there's only so many
		// things it could be

		if(query.id && !query.hasLoops && !query.tag){
			// ID-only query. Easy.
			return _getElementsFuncCache[query.query] = function(root){
				// FIXME: if root != document, check for parenting!
				return [ d.byId(query.id) ];
			}
		}

		var filterFunc = getSimpleFilterFunc(query);

		var retFunc;
		if(query.tag && query.id && !query.hasLoops){
			// we got a filtered ID search (e.g., "h4#thinger")
			retFunc = function(root){
				var te = d.byId(query.id, root.ownerDocument || root); //root itself may be a document
				if(filterFunc(te)){
					return [ te ];
				}
			}
		}else{
			retFunc = query.hasLoops ?
				function(root){
					var ret = [];
					var te, x = 0, tret = root.getElementsByTagName(query[ caseSensitive ? "otag" : "tag"]);
					while((te = tret[x++])){
						if(filterFunc(te)){
							ret.push(te);
						}
					}
					return ret;
				}
			:
				// it's just a plain-ol elements-by-tag-name query from the root
				function(root){
					var ret = [];
					var te, x=0, tret = root.getElementsByTagName(query[ caseSensitive ? "otag" : "tag"]);
					while((te = tret[x++])){
						ret.push(te);
					}
					return ret;
				};
		}
		return _getElementsFuncCache[query.query] = retFunc;
	}

	var _partsCache = {};

	////////////////////////////////////////////////////////////////////////
	// the query runner
	////////////////////////////////////////////////////////////////////////

	// this is the second level of spliting, from full-length queries (e.g.,
	// "div.foo .bar") into simple query expressions (e.g., ["div.foo",
	// ".bar"])
	var _queryFuncCache = {
		"*": d.isIE ? 
			function(root){ 
					return root.all;
			} : 
			function(root){
				 return root.getElementsByTagName("*");
			},
		"~": _nextSiblings,
		"+": function(root){ return _nextSiblings(root, true); },
		">": _childElements
	};

	var getStepQueryFunc = function(query){
		// if it's trivial, get a fast-path dispatcher
		var qparts = getQueryParts(trim(query));
		// if(query[query.length-1] == ">"){ query += " *"; }
		if(qparts.length == 1){
			var tt = getElementsFunc(qparts[0]);
			// tt.nozip = true; // FIXME: is this right? Shouldn't this be wrapped in a closure to mark the return?
			return tt;
		}

		// otherwise, break it up and return a runner that iterates over the parts recursively
		var sqf = function(root){
			var localQueryParts = qparts.slice(0); // clone the src arr
			var candidates;
			if(localQueryParts[0].oper == ">"){ // FIXME: what if it's + or ~?
				candidates = [ root ];
				// root = document;
			}else{
				candidates = getElementsFunc(localQueryParts.shift())(root);
			}
			return filterDown(candidates, localQueryParts);
		}
		return sqf;
	}

	// a specialized method that implements our primoridal "query optimizer".
	// This allows us to dispatch queries to the fastest subsystem we can get.
	var _getQueryFunc = (
		// NOTE: 
		//		XPath on the Webkit is slower than it's DOM iteration for most
		//		test cases
		// FIXME: 
		//		we should try to capture some runtime speed data for each query
		//		function to determine on the fly if we should stick w/ the
		//		potentially optimized variant or if we should try something
		//		new.
		(document["evaluate"] && !d.isWebKit) ? 
		function(query, root){
			// has xpath support that's faster than DOM
			var qparts = query.split(" ");
			// can we handle it?
			if(	(!caseSensitive) && // not strictly necessaray, but simplifies lots of stuff
				(document["evaluate"]) &&
				(query.indexOf(":") == -1) &&
				(query.indexOf("+") == -1) // skip direct sibling matches. See line ~344
			){
				// dojo.debug(query);
				// should we handle it?

				// kind of a lame heuristic, but it works
				if(	
					// a "div div div" style query
					((qparts.length > 2)&&(query.indexOf(">") == -1))||
					// or something else with moderate complexity. kinda janky
					(qparts.length > 3)||
					(query.indexOf("[")>=0)||
					// or if it's a ".thinger" query
					((1 == qparts.length)&&(0 <= query.indexOf(".")))

				){
					// use get and cache a xpath runner for this selector
					return getXPathFunc(query);
				}
			}

			// fallthrough
			return getStepQueryFunc(query);
		} : getStepQueryFunc
	);
	// uncomment to disable XPath for testing and tuning the DOM path
	// _getQueryFunc = getStepQueryFunc;

	// FIXME: we've got problems w/ the NodeList query()/filter() functions if we go XPath for everything

	// uncomment to disable DOM queries for testing and tuning XPath
	// _getQueryFunc = getXPathFunc;

	// this is the primary caching for full-query results. The query dispatcher
	// functions are generated here and then pickled for hash lookup in the
	// future
	var getQueryFunc = function(query){
		// return a cached version if one is available
		if(_queryFuncCache[query]){ return _queryFuncCache[query]; }
		if(0 > query.indexOf(",")){
			// if it's not a compound query (e.g., ".foo, .bar"), cache and return a dispatcher
			return _queryFuncCache[query] = _getQueryFunc(query);
		}else{
			// if it's a complex query, break it up into it's constituent parts
			// and return a dispatcher that will merge the parts when run

			// var parts = query.split(", ");
			var parts = query.split(/\s*,\s*/);
			var tf = function(root){
				var pindex = 0; // avoid array alloc for every invocation
				var ret = [];
				var tp;
				while((tp = parts[pindex++])){
					ret = ret.concat(_getQueryFunc(tp, tp.indexOf(" "))(root));
				}
				return ret;
			}
			// ...cache and return
			return _queryFuncCache[query] = tf;
		}
	}

	// FIXME: 
	//		Dean's Base2 uses a system whereby queries themselves note if
	//		they'll need duplicate filtering. We need to get on that plan!!

	// attempt to efficiently determine if an item in a list is a dupe,
	// returning a list of "uniques", hopefully in doucment order
	var _zipIdx = 0;
	var _zip = function(arr){
		if(arr && arr.nozip){ return listCtor._wrap(arr); }
		var ret = new listCtor();
		if(!arr){ return ret; }
		if(arr[0]){
			ret.push(arr[0]);
		}
		if(arr.length < 2){ return ret; }

		_zipIdx++;
		
		// we have to fork here for IE and XML docs because we can't set
		// expandos on their nodes (apparently). *sigh*
		if(d.isIE && caseSensitive){
			var szidx = _zipIdx+"";
			arr[0].setAttribute("_zipIdx", szidx);
			for(var x = 1, te; te = arr[x]; x++){
				if(arr[x].getAttribute("_zipIdx") != szidx){ 
					ret.push(te);
				}
				te.setAttribute("_zipIdx", szidx);
			}
		}else{
			arr[0]["_zipIdx"] = _zipIdx;
			for(var x = 1, te; te = arr[x]; x++){
				if(arr[x]["_zipIdx"] != _zipIdx){ 
					ret.push(te);
				}
				te["_zipIdx"] = _zipIdx;
			}
		}
		// FIXME: should we consider stripping these properties?
		return ret;
	}

	// the main executor
	d.query = function(/*String*/ query, /*String|DOMNode?*/ root){
		//	summary:
		//		Returns nodes which match the given CSS3 selector, searching the
		//		entire document by default but optionally taking a node to scope
		//		the search by. Returns an instance of dojo.NodeList.
		//	description:
		//		dojo.query() is the swiss army knife of DOM node manipulation in
		//		Dojo. Much like Prototype's "$$" (bling-bling) function or JQuery's
		//		"$" function, dojo.query provides robust, high-performance
		//		CSS-based node selector support with the option of scoping searches
		//		to a particular sub-tree of a document.
		//
		//		Supported Selectors:
		//		--------------------
		//
		//		dojo.query() supports a rich set of CSS3 selectors, including:
		//
		//			* class selectors (e.g., `.foo`)
		//			* node type selectors like `span`
		//			* ` ` descendant selectors
		//			* `>` child element selectors 
		//			* `#foo` style ID selectors
		//			* `*` universal selector
		//			* `~`, the immediately preceeded-by sibling selector
		//			* `+`, the preceeded-by sibling selector
		//			* attribute queries:
		//			|	* `[foo]` attribute presence selector
		//			|	* `[foo='bar']` attribute value exact match
		//			|	* `[foo~='bar']` attribute value list item match
		//			|	* `[foo^='bar']` attribute start match
		//			|	* `[foo$='bar']` attribute end match
		//			|	* `[foo*='bar']` attribute substring match
		//			* `:first-child`, `:last-child` positional selectors
		//			* `:empty` content empty selector
		//			* `:empty` content empty selector
		//			* `:checked` pseudo selector
		//			* `:nth-child(n)`, `:nth-child(2n+1)` style positional calculations
		//			* `:nth-child(even)`, `:nth-child(odd)` positional selectors
		//			* `:not(...)` negation pseudo selectors
		//
		//		Any legal combination of these selectors will work with
		//		`dojo.query()`, including compound selectors ("," delimited).
		//		Very complex and useful searches can be constructed with this
		//		palette of selectors and when combined with functions for
		//		manipulation presented by dojo.NodeList, many types of DOM
		//		manipulation operations become very straightforward.
		//		
		//		Unsupported Selectors:
		//		----------------------
		//
		//		While dojo.query handles many CSS3 selectors, some fall outside of
		//		what's reasonable for a programmatic node querying engine to
		//		handle. Currently unsupported selectors include:
		//		
		//			* namespace-differentiated selectors of any form
		//			* all `::` pseduo-element selectors
		//			* certain pseduo-selectors which don't get a lot of day-to-day use:
		//			|	* `:root`, `:lang()`, `:target`, `:focus`
		//			* all visual and state selectors:
		//			|	* `:root`, `:active`, `:hover`, `:visisted`, `:link`,
		//				  `:enabled`, `:disabled`
		//			* `:*-of-type` pseudo selectors
		//		
		//		dojo.query and XML Documents:
		//		-----------------------------
		//		
		//		`dojo.query` (as of dojo 1.2) supports searching XML documents
		//		in a case-sensitive manner. If an HTML document is served with
		//		a doctype that forces case-sensitivity (e.g., XHTML 1.1
		//		Strict), dojo.query() will detect this and "do the right
		//		thing". Case sensitivity is dependent upon the document being
		//		searched and not the query used. It is therefore possible to
		//		use case-sensitive queries on strict sub-documents (iframes,
		//		etc.) or XML documents while still assuming case-insensitivity
		//		for a host/root document.
		//
		//		Non-selector Queries:
		//		---------------------
		//
		//		If something other than a String is passed for the query,
		//		`dojo.query` will return a new `dojo.NodeList` instance
		//		constructed from that parameter alone and all further
		//		processing will stop. This means that if you have a reference
		//		to a node or NodeList, you can quickly construct a new NodeList
		//		from the original by calling `dojo.query(node)` or
		//		`dojo.query(list)`.
		//
		//	query:
		//		The CSS3 expression to match against. For details on the syntax of
		//		CSS3 selectors, see <http://www.w3.org/TR/css3-selectors/#selectors>
		//	root:
		//		A DOMNode (or node id) to scope the search from. Optional.
		//	returns: dojo.NodeList
		//		An instance of `dojo.NodeList`. Many methods are available on
		//		NodeLists for searching, iterating, manipulating, and handling
		//		events on the matched nodes in the returned list.
		//	example:
		//		search the entire document for elements with the class "foo":
		//	|	dojo.query(".foo");
		//		these elements will match:
		//	|	<span class="foo"></span>
		//	|	<span class="foo bar"></span>
		//	|	<p class="thud foo"></p>
		//	example:
		//		search the entire document for elements with the classes "foo" *and* "bar":
		//	|	dojo.query(".foo.bar");
		//		these elements will match:
		//	|	<span class="foo bar"></span>
		//		while these will not:
		//	|	<span class="foo"></span>
		//	|	<p class="thud foo"></p>
		//	example:
		//		find `<span>` elements which are descendants of paragraphs and
		//		which have a "highlighted" class:
		//	|	dojo.query("p span.highlighted");
		//		the innermost span in this fragment matches:
		//	|	<p class="foo">
		//	|		<span>...
		//	|			<span class="highlighted foo bar">...</span>
		//	|		</span>
		//	|	</p>
		//	example:
		//		set an "odd" class on all odd table rows inside of the table
		//		`#tabular_data`, using the `>` (direct child) selector to avoid
		//		affecting any nested tables:
		//	|	dojo.query("#tabular_data > tbody > tr:nth-child(odd)").addClass("odd");
		//	example:
		//		remove all elements with the class "error" from the document
		//		and store them in a list:
		//	|	var errors = dojo.query(".error").orphan();
		//	example:
		//		add an onclick handler to every submit button in the document
		//		which causes the form to be sent via Ajax instead:
		//	|	dojo.query("input[type='submit']").onclick(function(e){
		//	|		dojo.stopEvent(e); // prevent sending the form
		//	|		var btn = e.target;
		//	|		dojo.xhrPost({
		//	|			form: btn.form,
		//	|			load: function(data){
		//	|				// replace the form with the response
		//	|				var div = dojo.doc.createElement("div");
		//	|				dojo.place(div, btn.form, "after");
		//	|				div.innerHTML = data;
		//	|				dojo.style(btn.form, "display", "none");
		//	|			}
		//	|		});
		//	|	});


		if(query.constructor == listCtor){
			return query;
		}
		if(!isString(query)){
			return new listCtor(query); // dojo.NodeList
		}
		if(isString(root)){
			root = d.byId(root);
		}

		root = root||getDoc();
		var od = root.ownerDocument||root.documentElement;
		// FIXME: Opera in XHTML mode doesn't detect case-sensitivity correctly
		caseSensitive = (root.contentType && root.contentType=="application/xml") || 
						(d.isOpera && root.doctype) ||
						(!!od) && 
						(d.isIE ? od.xml : (root.xmlVersion||od.xmlVersion));
		return _zip(getQueryFunc(query)(root)); // dojo.NodeList
	}

	/*
	// exposing this was a mistake
	d.query.attrs = attrs;
	*/
	// exposing this because new pseudo matches are only executed through the
	// DOM query path (never through the xpath optimizing branch)
	d.query.pseudos = pseudos;

	// one-off function for filtering a NodeList based on a simple selector
	d._filterQueryResult = function(nodeList, simpleFilter){
		var tnl = new listCtor();
		var ff = (simpleFilter) ? getFilterFunc(getQueryParts(simpleFilter)[0]) : yesman;
		for(var x = 0, te; te = nodeList[x]; x++){
			if(ff(te)){ tnl.push(te); }
		}
		return tnl;
	}
})(this["queryPortability"]||dojo);

}

if(!dojo._hasResource["dojo._base.xhr"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.xhr"] = true;
dojo.provide("dojo._base.xhr");





(function(){
	var _d = dojo;
	function setValue(/*Object*/obj, /*String*/name, /*String*/value){
		//summary:
		//		For the named property in object, set the value. If a value
		//		already exists and it is a string, convert the value to be an
		//		array of values.
		var val = obj[name];
		if(_d.isString(val)){
			obj[name] = [val, value];
		}else if(_d.isArray(val)){
			val.push(value);
		}else{
			obj[name] = value;
		}
	}

	dojo.formToObject = function(/*DOMNode||String*/ formNode){
		// summary:
		//		dojo.formToObject returns the values encoded in an HTML form as
		//		string properties in an object which it then returns. Disabled form
		//		elements, buttons, and other non-value form elements are skipped.
		//		Multi-select elements are returned as an array of string values.
		// description:
		//		This form:
		//
		//		|	<form id="test_form">
		//		|		<input type="text" name="blah" value="blah">
		//		|		<input type="text" name="no_value" value="blah" disabled>
		//		|		<input type="button" name="no_value2" value="blah">
		//		|		<select type="select" multiple name="multi" size="5">
		//		|			<option value="blah">blah</option>
		//		|			<option value="thud" selected>thud</option>
		//		|			<option value="thonk" selected>thonk</option>
		//		|		</select>
		//		|	</form>
		//
		//		yields this object structure as the result of a call to
		//		formToObject():
		//
		//		|	{ 
		//		|		blah: "blah",
		//		|		multi: [
		//		|			"thud",
		//		|			"thonk"
		//		|		]
		//		|	};

		var ret = {};
		var exclude = "file|submit|image|reset|button|";
		_d.forEach(dojo.byId(formNode).elements, function(item){
			var _in = item.name;
			var type = (item.type||"").toLowerCase();
			if(_in && type && exclude.indexOf(type) == -1 && !item.disabled){
				if(type == "radio" || type == "checkbox"){
					if(item.checked){ setValue(ret, _in, item.value); }
				}else if(item.multiple){
					ret[_in] = [];
					_d.query("option", item).forEach(function(opt){
						if(opt.selected){
							setValue(ret, _in, opt.value);
						}
					});
				}else{ 
					setValue(ret, _in, item.value);
					if(type == "image"){
						ret[_in+".x"] = ret[_in+".y"] = ret[_in].x = ret[_in].y = 0;
					}
				}
			}
		});
		return ret; // Object
	}

	dojo.objectToQuery = function(/*Object*/ map){
		//	summary:
		//		takes a name/value mapping object and returns a string representing
		//		a URL-encoded version of that object.
		//	example:
		//		this object:
		//
		//		|	{ 
		//		|		blah: "blah",
		//		|		multi: [
		//		|			"thud",
		//		|			"thonk"
		//		|		]
		//		|	};
		//
		//	yields the following query string:
		//	
		//	|	"blah=blah&multi=thud&multi=thonk"

		// FIXME: need to implement encodeAscii!!
		var enc = encodeURIComponent;
		var pairs = [];
		var backstop = {};
		for(var name in map){
			var value = map[name];
			if(value != backstop[name]){
				var assign = enc(name) + "=";
				if(_d.isArray(value)){
					for(var i=0; i < value.length; i++){
						pairs.push(assign + enc(value[i]));
					}
				}else{
					pairs.push(assign + enc(value));
				}
			}
		}
		return pairs.join("&"); // String
	}

	dojo.formToQuery = function(/*DOMNode||String*/ formNode){
		// summary:
		//		Returns a URL-encoded string representing the form passed as either a
		//		node or string ID identifying the form to serialize
		return _d.objectToQuery(_d.formToObject(formNode)); // String
	}

	dojo.formToJson = function(/*DOMNode||String*/ formNode, /*Boolean?*/prettyPrint){
		// summary:
		//		return a serialized JSON string from a form node or string
		//		ID identifying the form to serialize
		return _d.toJson(_d.formToObject(formNode), prettyPrint); // String
	}

	dojo.queryToObject = function(/*String*/ str){
		// summary:
		//		returns an object representing a de-serialized query section of a
		//		URL. Query keys with multiple values are returned in an array.
		// description:
		//		This string:
		//
		//	|		"foo=bar&foo=baz&thinger=%20spaces%20=blah&zonk=blarg&"
		//		
		//		results in this object structure:
		//
		//	|		{
		//	|			foo: [ "bar", "baz" ],
		//	|			thinger: " spaces =blah",
		//	|			zonk: "blarg"
		//	|		}
		//	
		//		Note that spaces and other urlencoded entities are correctly
		//		handled.

		// FIXME: should we grab the URL string if we're not passed one?
		var ret = {};
		var qp = str.split("&");
		var dec = decodeURIComponent;
		_d.forEach(qp, function(item){
			if(item.length){
				var parts = item.split("=");
				var name = dec(parts.shift());
				var val = dec(parts.join("="));
				if(_d.isString(ret[name])){
					ret[name] = [ret[name]];
				}
				if(_d.isArray(ret[name])){
					ret[name].push(val);
				}else{
					ret[name] = val;
				}
			}
		});
		return ret; // Object
	}

	/*
		from refactor.txt:

		all bind() replacement APIs take the following argument structure:

			{
				url: "blah.html",

				// all below are optional, but must be supported in some form by
				// every IO API
				timeout: 1000, // milliseconds
				handleAs: "text", // replaces the always-wrong "mimetype"
				content: { 
					key: "value"
				},

				// browser-specific, MAY be unsupported
				sync: true, // defaults to false
				form: dojo.byId("someForm") 
			}
	*/

	// need to block async callbacks from snatching this thread as the result
	// of an async callback might call another sync XHR, this hangs khtml forever
	// must checked by watchInFlight()

	dojo._blockAsync = false;

	dojo._contentHandlers = {
		text: function(xhr){ return xhr.responseText; },
		json: function(xhr){
			return _d.fromJson(xhr.responseText || null);
		},
		"json-comment-filtered": function(xhr){ 
			// NOTE: the json-comment-filtered option was implemented to prevent
			// "JavaScript Hijacking", but it is less secure than standard JSON. Use
			// standard JSON instead. JSON prefixing can be used to subvert hijacking.
			if(!dojo.config.useCommentedJson){
				console.warn("Consider using the standard mimetype:application/json."
					+ " json-commenting can introduce security issues. To"
					+ " decrease the chances of hijacking, use the standard the 'json' handler and"
					+ " prefix your json with: {}&&\n"
					+ "Use djConfig.useCommentedJson=true to turn off this message.");
			}

			var value = xhr.responseText;
			var cStartIdx = value.indexOf("\/*");
			var cEndIdx = value.lastIndexOf("*\/");
			if(cStartIdx == -1 || cEndIdx == -1){
				throw new Error("JSON was not comment filtered");
			}
			return _d.fromJson(value.substring(cStartIdx+2, cEndIdx));
		},
		javascript: function(xhr){ 
			// FIXME: try Moz and IE specific eval variants?
			return _d.eval(xhr.responseText);
		},
		xml: function(xhr){
			var result = xhr.responseXML;
			if(_d.isIE && (!result || !result.documentElement)){
				var ms = function(n){ return "MSXML" + n + ".DOMDocument"; }
				var dp = ["Microsoft.XMLDOM", ms(6), ms(4), ms(3), ms(2)];
				_d.some(dp, function(p){
					try{
						var dom = new ActiveXObject(p);
						dom.async = false;
						dom.loadXML(xhr.responseText);
						result = dom;
					}catch(e){ return false; }
					return true;
				});
			}
			return result; // DOMDocument
		}
	};

	dojo._contentHandlers["json-comment-optional"] = function(xhr){
		var handlers = _d._contentHandlers;
		if(xhr.responseText && xhr.responseText.indexOf("\/*") != -1){
			return handlers["json-comment-filtered"](xhr);
		}else{
			return handlers["json"](xhr);
		}
	};

	/*=====
	dojo.__IoArgs = function(){
		//	url: String
		//		URL to server endpoint.
		//	content: Object?
		//		Contains properties with string values. These
		//		properties will be serialized as name1=value2 and
		//		passed in the request.
		//	timeout: Integer?
		//		Milliseconds to wait for the response. If this time
		//		passes, the then error callbacks are called.
		//	form: DOMNode?
		//		DOM node for a form. Used to extract the form values
		//		and send to the server.
		//	preventCache: Boolean?
		//		Default is false. If true, then a
		//		"dojo.preventCache" parameter is sent in the request
		//		with a value that changes with each request
		//		(timestamp). Useful only with GET-type requests.
		//	handleAs: String?
		//		Acceptable values depend on the type of IO
		//		transport (see specific IO calls for more information).
		//	load: Function?
		//		function(response, ioArgs){} response is of type Object, ioArgs
		//		is of type dojo.__IoCallbackArgs.  This function will be
		//		called on a successful HTTP response code.
		//	error: Function?
		//		function(response, ioArgs){} response is of type Object, ioArgs
		//		is of type dojo.__IoCallbackArgs. This function will
		//		be called when the request fails due to a network or server error, the url
		//		is invalid, etc. It will also be called if the load or handle callback throws an
		//		exception, unless djConfig.isDebug is true.  This allows deployed applications
		//		to continue to run even when a logic error happens in the callback, while making
		//		it easier to troubleshoot while in debug mode.
		//	handle: Function?
		//		function(response, ioArgs){} response is of type Object, ioArgs
		//		is of type dojo.__IoCallbackArgs.  This function will
		//		be called at the end of every request, whether or not an error occurs.
		this.url = url;
		this.content = content;
		this.timeout = timeout;
		this.form = form;
		this.preventCache = preventCache;
		this.handleAs = handleAs;
		this.load = load;
		this.error = error;
		this.handle = handle;
	}
	=====*/

	/*=====
	dojo.__IoCallbackArgs = function(args, xhr, url, query, handleAs, id, canDelete, json){
		//	args: Object
		//		the original object argument to the IO call.
		//	xhr: XMLHttpRequest
		//		For XMLHttpRequest calls only, the
		//		XMLHttpRequest object that was used for the
		//		request.
		//	url: String
		//		The final URL used for the call. Many times it
		//		will be different than the original args.url
		//		value.
		//	query: String
		//		For non-GET requests, the
		//		name1=value1&name2=value2 parameters sent up in
		//		the request.
		//	handleAs: String
		//		The final indicator on how the response will be
		//		handled.
		//	id: String
		//		For dojo.io.script calls only, the internal
		//		script ID used for the request.
		//	canDelete: Boolean
		//		For dojo.io.script calls only, indicates
		//		whether the script tag that represents the
		//		request can be deleted after callbacks have
		//		been called. Used internally to know when
		//		cleanup can happen on JSONP-type requests.
		//	json: Object
		//		For dojo.io.script calls only: holds the JSON
		//		response for JSONP-type requests. Used
		//		internally to hold on to the JSON responses.
		//		You should not need to access it directly --
		//		the same object should be passed to the success
		//		callbacks directly.
		this.args = args;
		this.xhr = xhr;
		this.url = url;
		this.query = query;
		this.handleAs = handleAs;
		this.id = id;
		this.canDelete = canDelete;
		this.json = json;
	}
	=====*/



	dojo._ioSetArgs = function(/*dojo.__IoArgs*/args,
			/*Function*/canceller,
			/*Function*/okHandler,
			/*Function*/errHandler){
		//	summary: 
		//		sets up the Deferred and ioArgs property on the Deferred so it
		//		can be used in an io call.
		//	args:
		//		The args object passed into the public io call. Recognized properties on
		//		the args object are:
		//	canceller:
		//		The canceller function used for the Deferred object. The function
		//		will receive one argument, the Deferred object that is related to the
		//		canceller.
		//	okHandler:
		//		The first OK callback to be registered with Deferred. It has the opportunity
		//		to transform the OK response. It will receive one argument -- the Deferred
		//		object returned from this function.
		//	errHandler:
		//		The first error callback to be registered with Deferred. It has the opportunity
		//		to do cleanup on an error. It will receive two arguments: error (the 
		//		Error object) and dfd, the Deferred object returned from this function.

		var ioArgs = {args: args, url: args.url};

		//Get values from form if requestd.
		var formObject = null;
		if(args.form){ 
			var form = _d.byId(args.form);
			//IE requires going through getAttributeNode instead of just getAttribute in some form cases, 
			//so use it for all.  See #2844
			var actnNode = form.getAttributeNode("action");
			ioArgs.url = ioArgs.url || (actnNode ? actnNode.value : null); 
			formObject = _d.formToObject(form);
		}

		// set up the query params
		var miArgs = [{}];
	
		if(formObject){
			// potentially over-ride url-provided params w/ form values
			miArgs.push(formObject);
		}
		if(args.content){
			// stuff in content over-rides what's set by form
			miArgs.push(args.content);
		}
		if(args.preventCache){
			miArgs.push({"dojo.preventCache": new Date().valueOf()});
		}
		ioArgs.query = _d.objectToQuery(_d.mixin.apply(null, miArgs));
	
		// .. and the real work of getting the deferred in order, etc.
		ioArgs.handleAs = args.handleAs || "text";
		var d = new _d.Deferred(canceller);
		d.addCallbacks(okHandler, function(error){
			return errHandler(error, d);
		});

		//Support specifying load, error and handle callback functions from the args.
		//For those callbacks, the "this" object will be the args object.
		//The callbacks will get the deferred result value as the
		//first argument and the ioArgs object as the second argument.
		var ld = args.load;
		if(ld && _d.isFunction(ld)){
			d.addCallback(function(value){
				return ld.call(args, value, ioArgs);
			});
		}
		var err = args.error;
		if(err && _d.isFunction(err)){
			d.addErrback(function(value){
				return err.call(args, value, ioArgs);
			});
		}
		var handle = args.handle;
		if(handle && _d.isFunction(handle)){
			d.addBoth(function(value){
				return handle.call(args, value, ioArgs);
			});
		}
		
		d.ioArgs = ioArgs;
	
		// FIXME: need to wire up the xhr object's abort method to something
		// analagous in the Deferred
		return d;
	}

	var _deferredCancel = function(/*Deferred*/dfd){
		//summary: canceller function for dojo._ioSetArgs call.
		
		dfd.canceled = true;
		var xhr = dfd.ioArgs.xhr;
		var _at = typeof xhr.abort;
		if(_at == "function" || _at == "object" || _at == "unknown"){
			xhr.abort();
		}
		var err = dfd.ioArgs.error;
		if(!err){
			err = new Error("xhr cancelled");
			err.dojoType="cancel";
		}
		return err;
	}
	var _deferredOk = function(/*Deferred*/dfd){
		//summary: okHandler function for dojo._ioSetArgs call.

		var ret = _d._contentHandlers[dfd.ioArgs.handleAs](dfd.ioArgs.xhr);
		return (typeof ret == "undefined") ? null : ret;
	}
	var _deferError = function(/*Error*/error, /*Deferred*/dfd){
		//summary: errHandler function for dojo._ioSetArgs call.

		console.debug(error);
		return error;
	}

	// avoid setting a timer per request. It degrades performance on IE
	// something fierece if we don't use unified loops.
	var _inFlightIntvl = null;
	var _inFlight = [];
	var _watchInFlight = function(){
		//summary: 
		//		internal method that checks each inflight XMLHttpRequest to see
		//		if it has completed or if the timeout situation applies.
		
		var now = (new Date()).getTime();
		// make sure sync calls stay thread safe, if this callback is called
		// during a sync call and this results in another sync call before the
		// first sync call ends the browser hangs
		if(!_d._blockAsync){
			// we need manual loop because we often modify _inFlight (and therefore 'i') while iterating
			// note: the second clause is an assigment on purpose, lint may complain
			for(var i = 0, tif; i < _inFlight.length && (tif = _inFlight[i]); i++){
				var dfd = tif.dfd;
				var func = function(){
					if(!dfd || dfd.canceled || !tif.validCheck(dfd)){
						_inFlight.splice(i--, 1); 
					}else if(tif.ioCheck(dfd)){
						_inFlight.splice(i--, 1);
						tif.resHandle(dfd);
					}else if(dfd.startTime){
						//did we timeout?
						if(dfd.startTime + (dfd.ioArgs.args.timeout || 0) < now){
							_inFlight.splice(i--, 1);
							var err = new Error("timeout exceeded");
							err.dojoType = "timeout";
							dfd.errback(err);
							//Cancel the request so the io module can do appropriate cleanup.
							dfd.cancel();
						}
					}
				};
				if(dojo.config.isDebug){
					func.call(this);
				}else{
					try{
						func.call(this);
					}catch(e){
						dfd.errback(e);
					}
				}
			}
		}

		if(!_inFlight.length){
			clearInterval(_inFlightIntvl);
			_inFlightIntvl = null;
			return;
		}

	}

	dojo._ioCancelAll = function(){
		//summary: Cancels all pending IO requests, regardless of IO type
		//(xhr, script, iframe).
		try{
			_d.forEach(_inFlight, function(i){
				try{
					i.dfd.cancel();
				}catch(e){/*squelch*/}
			});
		}catch(e){/*squelch*/}
	}

	//Automatically call cancel all io calls on unload
	//in IE for trac issue #2357.
	if(_d.isIE){
		_d.addOnWindowUnload(_d._ioCancelAll);
	}

	_d._ioWatch = function(/*Deferred*/dfd,
		/*Function*/validCheck,
		/*Function*/ioCheck,
		/*Function*/resHandle){
		//summary: watches the io request represented by dfd to see if it completes.
		//dfd:
		//		The Deferred object to watch.
		//validCheck:
		//		Function used to check if the IO request is still valid. Gets the dfd
		//		object as its only argument.
		//ioCheck:
		//		Function used to check if basic IO call worked. Gets the dfd
		//		object as its only argument.
		//resHandle:
		//		Function used to process response. Gets the dfd
		//		object as its only argument.
		if(dfd.ioArgs.args.timeout){
			dfd.startTime = (new Date()).getTime();
		}
		_inFlight.push({dfd: dfd, validCheck: validCheck, ioCheck: ioCheck, resHandle: resHandle});
		if(!_inFlightIntvl){
			_inFlightIntvl = setInterval(_watchInFlight, 50);
		}
		_watchInFlight(); // handle sync requests
	}

	var _defaultContentType = "application/x-www-form-urlencoded";

	var _validCheck = function(/*Deferred*/dfd){
		return dfd.ioArgs.xhr.readyState; //boolean
	}
	var _ioCheck = function(/*Deferred*/dfd){
		return 4 == dfd.ioArgs.xhr.readyState; //boolean
	}
	var _resHandle = function(/*Deferred*/dfd){
		var xhr = dfd.ioArgs.xhr;
		if(_d._isDocumentOk(xhr)){
			dfd.callback(dfd);
		}else{
			var err = new Error("Unable to load " + dfd.ioArgs.url + " status:" + xhr.status);
			err.status = xhr.status;
			err.responseText = xhr.responseText;
			dfd.errback(err);
		}
	}

	dojo._ioAddQueryToUrl = function(/*dojo.__IoCallbackArgs*/ioArgs){
		//summary: Adds query params discovered by the io deferred construction to the URL.
		//Only use this for operations which are fundamentally GET-type operations.
		if(ioArgs.query.length){
			ioArgs.url += (ioArgs.url.indexOf("?") == -1 ? "?" : "&") + ioArgs.query;
			ioArgs.query = null;
		}		
	}

	/*=====
	dojo.declare("dojo.__XhrArgs", dojo.__IoArgs, {
		constructor: function(){
			//	summary:
			//		In addition to the properties listed for the dojo._IoArgs type,
			//		the following properties are allowed for dojo.xhr* methods.
			//	handleAs: String?
			//		Acceptable values are: text (default), json, json-comment-optional,
			//		json-comment-filtered, javascript, xml
			//	sync: Boolean?
			//		false is default. Indicates whether the request should
			//		be a synchronous (blocking) request.
			//	headers: Object?
			//		Additional HTTP headers to send in the request.
			this.handleAs = handleAs;
			this.sync = sync;
			this.headers = headers;
		}
	});
	=====*/

	dojo.xhr = function(/*String*/ method, /*dojo.__XhrArgs*/ args, /*Boolean?*/ hasBody){
		//	summary:
		//		Sends an HTTP request with the given method.
		//	description:
		//		Sends an HTTP request with the given method.
		//		See also dojo.xhrGet(), xhrPost(), xhrPut() and dojo.xhrDelete() for shortcuts
		//		for those HTTP methods. There are also methods for "raw" PUT and POST methods
		//		via dojo.rawXhrPut() and dojo.rawXhrPost() respectively.
		//	method:
		//		HTTP method to be used, such as GET, POST, PUT, DELETE.  Should be uppercase.
		//	hasBody:
		//		If the request has an HTTP body, then pass true for hasBody.

		//Make the Deferred object for this xhr request.
		var dfd = _d._ioSetArgs(args, _deferredCancel, _deferredOk, _deferError);

		//Pass the args to _xhrObj, to allow xhr iframe proxy interceptions.
		dfd.ioArgs.xhr = _d._xhrObj(dfd.ioArgs.args);

		if(hasBody){
			if("postData" in args){
				dfd.ioArgs.query = args.postData;
			}else if("putData" in args){
				dfd.ioArgs.query = args.putData;
			}
		}else{
			_d._ioAddQueryToUrl(dfd.ioArgs);
		}

		// IE 6 is a steaming pile. It won't let you call apply() on the native function (xhr.open).
		// workaround for IE6's apply() "issues"
		var ioArgs = dfd.ioArgs;
		var xhr = ioArgs.xhr;
		xhr.open(method, ioArgs.url, args.sync !== true, args.user || undefined, args.password || undefined);
		if(args.headers){
			for(var hdr in args.headers){
				if(hdr.toLowerCase() === "content-type" && !args.contentType){
					args.contentType = args.headers[hdr];
				}else{
					xhr.setRequestHeader(hdr, args.headers[hdr]);
				}
			}
		}
		// FIXME: is this appropriate for all content types?
		xhr.setRequestHeader("Content-Type", args.contentType || _defaultContentType);
		if(!args.headers || !args.headers["X-Requested-With"]){
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		}
		// FIXME: set other headers here!
		if(dojo.config.isDebug){
			xhr.send(ioArgs.query);
		}else{
			try{
				xhr.send(ioArgs.query);
			}catch(e){
				dfd.ioArgs.error = e;
				dfd.cancel();
			}
		}
		_d._ioWatch(dfd, _validCheck, _ioCheck, _resHandle);
		xhr = null;
		return dfd; // dojo.Deferred
	}

	dojo.xhrGet = function(/*dojo.__XhrArgs*/ args){
		//	summary: 
		//		Sends an HTTP GET request to the server.
		return _d.xhr("GET", args); // dojo.Deferred
	}

	dojo.rawXhrPost = dojo.xhrPost = function(/*dojo.__XhrArgs*/ args){
		//	summary:
		//		Sends an HTTP POST request to the server. In addtion to the properties
		//		listed for the dojo.__XhrArgs type, the following property is allowed:
		//	postData:
		//		String. Send raw data in the body of the POST request.
		return _d.xhr("POST", args, true); // dojo.Deferred
	}

	dojo.rawXhrPut = dojo.xhrPut = function(/*dojo.__XhrArgs*/ args){
		//	summary:
		//		Sends an HTTP PUT request to the server. In addtion to the properties
		//		listed for the dojo.__XhrArgs type, the following property is allowed:
		//	putData:
		//		String. Send raw data in the body of the PUT request.
		return _d.xhr("PUT", args, true); // dojo.Deferred
	}

	dojo.xhrDelete = function(/*dojo.__XhrArgs*/ args){
		//	summary:
		//		Sends an HTTP DELETE request to the server.
		return _d.xhr("DELETE", args); //dojo.Deferred
	}

	/*
	dojo.wrapForm = function(formNode){
		//summary:
		//		A replacement for FormBind, but not implemented yet.

		// FIXME: need to think harder about what extensions to this we might
		// want. What should we allow folks to do w/ this? What events to
		// set/send?
		throw new Error("dojo.wrapForm not yet implemented");
	}
	*/
})();

}

if(!dojo._hasResource["dojo._base.fx"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.fx"] = true;
dojo.provide("dojo._base.fx");






/*
	Animation losely package based on Dan Pupius' work, contributed under CLA: 
		http://pupius.co.uk/js/Toolkit.Drawing.js
*/
(function(){ 

	var d = dojo, _mixin = d.mixin;
	
	dojo._Line = function(/*int*/ start, /*int*/ end){
		//	summary:
		//		dojo._Line is the object used to generate values from a start value
		//		to an end value
		//	start: int
		//		Beginning value for range
		//	end: int
		//		Ending value for range
		this.start = start;
		this.end = end;
	}
	dojo._Line.prototype.getValue = function(/*float*/ n){
		//	summary: Returns the point on the line
		//	n: a floating point number greater than 0 and less than 1
		return ((this.end - this.start) * n) + this.start; // Decimal
	}
	
	d.declare("dojo._Animation", null, {
		//	summary
		//		A generic animation class that fires callbacks into its handlers
		//		object at various states. Nearly all dojo animation functions
		//		return an instance of this method, usually without calling the
		//		.play() method beforehand. Therefore, you will likely need to
		//		call .play() on instances of dojo._Animation when one is
		//		returned.
		constructor: function(/*Object*/ args){
			_mixin(this, args);
			if(d.isArray(this.curve)){
				/* curve: Array
					pId: a */
				this.curve = new d._Line(this.curve[0], this.curve[1]);
			}
		},
		
		// duration: Integer
		//	The time in milliseonds the animation will take to run
		duration: 350,
	
	/*=====
		// curve: dojo._Line||Array
		//	A two element array of start and end values, or a dojo._Line instance to be
		//	used in the Animation. 
		curve: null,
	
		// easing: Function
		//	A Function to adjust the acceleration (or deceleration) of the progress 
		//	across a dojo._Line
		easing: null,
	=====*/
	
		// repeat: Integer
		//	The number of times to loop the animation
		repeat: 0,
	
		// rate: Integer
		//	the time in milliseconds to wait before advancing to next frame 
		//	(used as a fps timer: rate/1000 = fps)
		rate: 10 /* 100 fps */,
	
	/*===== 
		// delay: Integer
		// 	The time in milliseconds to wait before starting animation after it has been .play()'ed
		delay: null,
	
		// events
		//
		// beforeBegin: Event
		//	Synthetic event fired before a dojo._Animation begins playing (synchronous)
		beforeBegin: null,
	
		// onBegin: Event
		//	Synthetic event fired as a dojo._Animation begins playing (useful?)
		onBegin: null,
	
		// onAnimate: Event
		//	Synthetic event fired at each interval of a dojo._Animation
		onAnimate: null,
	
		// onEnd: Event
		//	Synthetic event fired after the final frame of a dojo._Animation
		onEnd: null,
	
		// onPlay: Event
		//	Synthetic event fired any time a dojo._Animation is play()'ed
		onPlay: null,
	
		// onPause: Event
		//	Synthetic event fired when a dojo._Animation is paused
		onPause: null,
	
		// onStop: Event
		//	Synthetic event fires when a dojo._Animation is stopped
		onStop: null,
	
	=====*/
	
		_percent: 0,
		_startRepeatCount: 0,
	
		_fire: function(/*Event*/ evt, /*Array?*/ args){
			//	summary:
			//		Convenience function.  Fire event "evt" and pass it the
			//		arguments specified in "args".
			//	evt:
			//		The event to fire.
			//	args:
			//		The arguments to pass to the event.
			if(this[evt]){
				if(dojo.config.isDebug){
					this[evt].apply(this, args||[]);
				}else{
					try{
						this[evt].apply(this, args||[]);
					}catch(e){
						// squelch and log because we shouldn't allow exceptions in
						// synthetic event handlers to cause the internal timer to run
						// amuck, potentially pegging the CPU. I'm not a fan of this
						// squelch, but hopefully logging will make it clear what's
						// going on
						console.error("exception in animation handler for:", evt);
						console.error(e);
					}
				}
			}
			return this; // dojo._Animation
		},

		play: function(/*int?*/ delay, /*Boolean?*/ gotoStart){
			// summary:
			//		Start the animation.
			// delay:
			//		How many milliseconds to delay before starting.
			// gotoStart:
			//		If true, starts the animation from the beginning; otherwise,
			//		starts it from its current position.
			var _t = this;
			if(_t._delayTimer){ _t._clearTimer(); }
			if(gotoStart){
				_t._stopTimer();
				_t._active = _t._paused = false;
				_t._percent = 0;
			}else if(_t._active && !_t._paused){
				return _t; // dojo._Animation
			}
	
			_t._fire("beforeBegin");
	
			var de = delay || _t.delay,
				_p = dojo.hitch(_t, "_play", gotoStart);
				
			if(de > 0){
				_t._delayTimer = setTimeout(_p, de);
				return _t; // dojo._Animation
			}
			_p();
			return _t;
		},
	
		_play: function(gotoStart){
			var _t = this;
			if(_t._delayTimer){ _t._clearTimer(); }
			_t._startTime = new Date().valueOf();
			if(_t._paused){
				_t._startTime -= _t.duration * _t._percent;
			}
			_t._endTime = _t._startTime + _t.duration;
	
			_t._active = true;
			_t._paused = false;
	
			var value = _t.curve.getValue(_t._percent);
			if(!_t._percent){
				if(!_t._startRepeatCount){
					_t._startRepeatCount = _t.repeat;
				}
				_t._fire("onBegin", [value]);
			}
	
			_t._fire("onPlay", [value]);
	
			_t._cycle();
			return _t; // dojo._Animation
		},
	
		pause: function(){
			// summary: Pauses a running animation.
			var _t = this;
			if(_t._delayTimer){ _t._clearTimer(); }
			_t._stopTimer();
			if(!_t._active){ return _t; /*dojo._Animation*/ }
			_t._paused = true;
			_t._fire("onPause", [_t.curve.getValue(_t._percent)]);
			return _t; // dojo._Animation
		},
	
		gotoPercent: function(/*Decimal*/ percent, /*Boolean?*/ andPlay){
			//	summary:
			//		Sets the progress of the animation.
			//	percent:
			//		A percentage in decimal notation (between and including 0.0 and 1.0).
			//	andPlay:
			//		If true, play the animation after setting the progress.
			var _t = this;
			_t._stopTimer();
			_t._active = _t._paused = true;
			_t._percent = percent;
			if(andPlay){ _t.play(); }
			return _t; // dojo._Animation
		},
	
		stop: function(/*boolean?*/ gotoEnd){
			// summary: Stops a running animation.
			// gotoEnd: If true, the animation will end.
			var _t = this;
			if(_t._delayTimer){ _t._clearTimer(); }
			if(!_t._timer){ return _t; /* dojo._Animation */ }
			_t._stopTimer();
			if(gotoEnd){
				_t._percent = 1;
			}
			_t._fire("onStop", [_t.curve.getValue(_t._percent)]);
			_t._active = _t._paused = false;
			return _t; // dojo._Animation
		},
	
		status: function(){
			// summary: Returns a string token representation of the status of
			//			the animation, one of: "paused", "playing", "stopped"
			if(this._active){
				return this._paused ? "paused" : "playing"; // String
			}
			return "stopped"; // String
		},
	
		_cycle: function(){
			var _t = this;
			if(_t._active){
				var curr = new Date().valueOf();
				var step = (curr - _t._startTime) / (_t._endTime - _t._startTime);
	
				if(step >= 1){
					step = 1;
				}
				_t._percent = step;
	
				// Perform easing
				if(_t.easing){
					step = _t.easing(step);
				}
	
				_t._fire("onAnimate", [_t.curve.getValue(step)]);
	
				if(_t._percent < 1){
					_t._startTimer();
				}else{
					_t._active = false;
	
					if(_t.repeat > 0){
						_t.repeat--;
						_t.play(null, true);
					}else if(_t.repeat == -1){
						_t.play(null, true);
					}else{
						if(_t._startRepeatCount){
							_t.repeat = _t._startRepeatCount;
							_t._startRepeatCount = 0;
						}
					}
					_t._percent = 0;
					_t._fire("onEnd");
					_t._stopTimer();
				}
			}
			return _t; // dojo._Animation
		},
		
		_clearTimer: function(){
			// summary: Clear the play delay timer
			clearTimeout(this._delayTimer);
			delete this._delayTimer;
		}
		
	});

	var ctr = 0,
		_globalTimerList = [],
		timer = null,
		runner = {
			run: function(){ }
		};

	dojo._Animation.prototype._startTimer = function(){
		// this._timer = setTimeout(dojo.hitch(this, "_cycle"), this.rate);
		if(!this._timer){
			this._timer = d.connect(runner, "run", this, "_cycle");
			ctr++;
		}
		if(!timer){
			timer = setInterval(d.hitch(runner, "run"), this.rate);
		}
	};

	dojo._Animation.prototype._stopTimer = function(){
		if(this._timer){
			d.disconnect(this._timer);
			this._timer = null;
			ctr--;
		}
		if(ctr <= 0){
			clearInterval(timer);
			timer = null;
			ctr = 0;
		}
	};

	var _makeFadeable = (d.isIE) ? function(node){
		// only set the zoom if the "tickle" value would be the same as the
		// default
		var ns = node.style;
		// don't set the width to auto if it didn't already cascade that way.
		// We don't want to f anyones designs
		if(!ns.width.length && d.style(node, "width") == "auto"){
			ns.width = "auto";
		}
	} : function(){};

	dojo._fade = function(/*Object*/ args){
		//	summary: 
		//		Returns an animation that will fade the node defined by
		//		args.node from the start to end values passed (args.start
		//		args.end) (end is mandatory, start is optional)

		args.node = d.byId(args.node);
		var fArgs = _mixin({ properties: {} }, args),
		 	props = (fArgs.properties.opacity = {});
		
		props.start = !("start" in fArgs) ?
			function(){ 
				return Number(d.style(fArgs.node, "opacity")||0); 
			} : fArgs.start;
		props.end = fArgs.end;

		var anim = d.animateProperty(fArgs);
		d.connect(anim, "beforeBegin", d.partial(_makeFadeable, fArgs.node));

		return anim; // dojo._Animation
	}

	/*=====
	dojo.__FadeArgs = function(node, duration, easing){
		// 	node: DOMNode|String
		//		The node referenced in the animation
		//	duration: Integer?
		//		Duration of the animation in milliseconds.
		//	easing: Function?
		//		An easing function.
		this.node = node;
		this.duration = duration;
		this.easing = easing;
	}
	=====*/

	dojo.fadeIn = function(/*dojo.__FadeArgs*/ args){
		// summary: 
		//		Returns an animation that will fade node defined in 'args' from
		//		its current opacity to fully opaque.
		return d._fade(_mixin({ end: 1 }, args)); // dojo._Animation
	}

	dojo.fadeOut = function(/*dojo.__FadeArgs*/  args){
		// summary: 
		//		Returns an animation that will fade node defined in 'args'
		//		from its current opacity to fully transparent.
		return d._fade(_mixin({ end: 0 }, args)); // dojo._Animation
	}

	dojo._defaultEasing = function(/*Decimal?*/ n){
		// summary: The default easing function for dojo._Animation(s)
		return 0.5 + ((Math.sin((n + 1.5) * Math.PI))/2);
	}

	var PropLine = function(properties){
		// PropLine is an internal class which is used to model the values of
		// an a group of CSS properties across an animation lifecycle. In
		// particular, the "getValue" function handles getting interpolated
		// values between start and end for a particular CSS value.
		this._properties = properties;
		for(var p in properties){
			var prop = properties[p];
			if(prop.start instanceof d.Color){
				// create a reusable temp color object to keep intermediate results
				prop.tempColor = new d.Color();
			}
		}
	}

	PropLine.prototype.getValue = function(r){
		var ret = {};
		for(var p in this._properties){
			var prop = this._properties[p],
				start = prop.start;
			if(start instanceof d.Color){
				ret[p] = d.blendColors(start, prop.end, r, prop.tempColor).toCss();
			}else if(!d.isArray(start)){
				ret[p] = ((prop.end - start) * r) + start + (p != "opacity" ? prop.units || "px" : 0);
			}
		}
		return ret;
	}

	/*=====
	dojo.declare("dojo.__AnimArgs", [dojo.__FadeArgs], {
		// Properties: Object?
		//	A hash map of style properties to Objects describing the transition,
		//	such as the properties of dojo._Line with an additional 'unit' property
		properties: {}
		
		//TODOC: add event callbacks
	});
	=====*/

	dojo.animateProperty = function(/*dojo.__AnimArgs*/ args){
		//	summary: 
		//		Returns an animation that will transition the properties of
		//		node defined in 'args' depending how they are defined in
		//		'args.properties'
		//
		// description:
		//		dojo.animateProperty is the foundation of most dojo.fx
		//		animations. It takes an object of "properties" corresponding to
		//		style properties, and animates them in parallel over a set
		//		duration.
		//	
		// 	example:
		//		A simple animation that changes the width of the specified node.
		//	|	dojo.animateProperty({ 
		//	|		node: "nodeId",
		//	|		properties: { width: 400 },
		//	|	}).play();
		//		Dojo figures out the start value for the width and converts the
		//		integer specified for the width to the more expressive but
		//		verbose form `{ width: { end: '400', units: 'px' } }` which you
		//		can also specify directly
		//
		// 	example:
		//		Animate width, height, and padding over 2 seconds... the
		//		pedantic way:
		//	|	dojo.animateProperty({ node: node, duration:2000,
		//	|		properties: {
		//	|			width: { start: '200', end: '400', unit:"px" },
		//	|			height: { start:'200', end: '400', unit:"px" },
		//	|			paddingTop: { start:'5', end:'50', unit:"px" } 
		//	|		}
		//	|	}).play();
		//		Note 'paddingTop' is used over 'padding-top'. Multi-name CSS properties
		//		are written using "mixed case", as the hyphen is illegal as an object key.
		//		
		// 	example:
		//		Plug in a different easing function and register a callback for
		//		when the animation ends. Easing functions accept values between
		//		zero and one and return a value on that basis. In this case, an
		//		exponential-in curve.
		//	|	dojo.animateProperty({ 
		//	|		node: "nodeId",
		//	|		// dojo figures out the start value
		//	|		properties: { width: { end: 400 } },
		//	|		easing: function(n){
		//	|			return (n==0) ? 0 : Math.pow(2, 10 * (n - 1));
		//	|		},
		//	|		onEnd: function(){
		//	|			// called when the animation finishes
		//	|		}
		//	|	}).play(500); // delay playing half a second
		//
		//	example:
		//		Like all `dojo._Animation`s, animateProperty returns a handle to the
		//		Animation instance, which fires the events common to Dojo FX. Use `dojo.connect`
		//		to access these events outside of the Animation definiton:
		//	|	var anim = dojo.animateProperty({
		//	|		node:"someId",
		//	|		properties:{
		//	|			width:400, height:500
		//	|		}
		//	|	});
		//	|	dojo.connect(anim,"onEnd", function(){
		//	|		console.log("animation ended");
		//	|	});
		//	|	// play the animation now:
		//	|	anim.play();
		
		args.node = d.byId(args.node);
		if(!args.easing){ args.easing = d._defaultEasing; }

		var anim = new d._Animation(args);
		d.connect(anim, "beforeBegin", anim, function(){
			var pm = {};
			for(var p in this.properties){
				// Make shallow copy of properties into pm because we overwrite
				// some values below. In particular if start/end are functions
				// we don't want to overwrite them or the functions won't be
				// called if the animation is reused.
				if(p == "width" || p == "height"){
					this.node.display = "block";
				}
				var prop = this.properties[p];
				prop = pm[p] = _mixin({}, (d.isObject(prop) ? prop: { end: prop }));

				if(d.isFunction(prop.start)){
					prop.start = prop.start();
				}
				if(d.isFunction(prop.end)){
					prop.end = prop.end();
				}
				var isColor = (p.toLowerCase().indexOf("color") >= 0);
				function getStyle(node, p){
					// dojo.style(node, "height") can return "auto" or "" on IE; this is more reliable:
					var v = ({height: node.offsetHeight, width: node.offsetWidth})[p];
					if(v !== undefined){ return v; }
					v = d.style(node, p);
					return (p == "opacity") ? Number(v) : (isColor ? v : parseFloat(v));
				}
				if(!("end" in prop)){
					prop.end = getStyle(this.node, p);
				}else if(!("start" in prop)){
					prop.start = getStyle(this.node, p);
				}

				if(isColor){
					prop.start = new d.Color(prop.start);
					prop.end = new d.Color(prop.end);
				}else{
					prop.start = (p == "opacity") ? Number(prop.start) : parseFloat(prop.start);
				}
			}
			this.curve = new PropLine(pm);
		});
		d.connect(anim, "onAnimate", d.hitch(d, "style", anim.node));
		return anim; // dojo._Animation
	}

	dojo.anim = function(	/*DOMNode|String*/ 	node, 
							/*Object*/ 			properties, 
							/*Integer?*/		duration, 
							/*Function?*/		easing, 
							/*Function?*/		onEnd,
							/*Integer?*/		delay){
		//	summary:
		//		A simpler interface to `dojo.animateProperty()`, also returns
		//		an instance of `dojo._Animation` but begins the animation
		//		immediately, unlike nearly every other Dojo animation API.
		//	description:
		//		`dojo.anim` is a simpler (but somewhat less powerful) version
		//		of `dojo.animateProperty`.  It uses defaults for many basic properties
		//		and allows for positional parameters to be used in place of the
		//		packed "property bag" which is used for other Dojo animation
		//		methods.
		//
		//		The `dojo._Animation` object returned from `dojo.anim` will be
		//		already playing when it is returned from this function, so
		//		calling play() on it again is (usually) a no-op.
		//	node:
		//		a DOM node or the id of a node to animate CSS properties on
		//	duration:
		//		The number of milliseconds over which the animation
		//		should run. Defaults to the global animation default duration
		//		(350ms).
		//	easing:
		//		An easing function over which to calculate acceleration
		//		and deceleration of the animation through its duration.
		//		A default easing algorithm is provided, but you may
		//		plug in any you wish. A large selection of easing algorithms
		//		are available in `dojo.fx.easing`.
		//	onEnd:
		//		A function to be called when the animation finishes
		//		running.
		//	delay:
		//		The number of milliseconds to delay beginning the
		//		animation by. The default is 0.
		//	example:
		//		Fade out a node
		//	|	dojo.anim("id", { opacity: 0 });
		//	example:
		//		Fade out a node over a full second
		//	|	dojo.anim("id", { opacity: 0 }, 1000);
		return d.animateProperty({ 
			node: node,
			duration: duration||d._Animation.prototype.duration,
			properties: properties,
			easing: easing,
			onEnd: onEnd 
		}).play(delay||0);
	}
})();

}

if(!dojo._hasResource["dojo._base.browser"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo._base.browser"] = true;
dojo.provide("dojo._base.browser");









//Need this to be the last code segment in base, so do not place any
//dojo.requireIf calls in this file. Otherwise, due to how the build system
//puts all requireIf dependencies after the current file, the require calls
//could be called before all of base is defined.
if(dojo.config.require){
	dojo.forEach(dojo.config.require, "dojo['require'](item);");
}

}

if(!dojo._hasResource["dojo.date.stamp"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.date.stamp"] = true;
dojo.provide("dojo.date.stamp");

// Methods to convert dates to or from a wire (string) format using well-known conventions

dojo.date.stamp.fromISOString = function(/*String*/formattedString, /*Number?*/defaultTime){
	//	summary:
	//		Returns a Date object given a string formatted according to a subset of the ISO-8601 standard.
	//
	//	description:
	//		Accepts a string formatted according to a profile of ISO8601 as defined by
	//		[RFC3339](http://www.ietf.org/rfc/rfc3339.txt), except that partial input is allowed.
	//		Can also process dates as specified [by the W3C](http://www.w3.org/TR/NOTE-datetime)
	//		The following combinations are valid:
	//
	//			* dates only
	//			|	* yyyy
	//			|	* yyyy-MM
	//			|	* yyyy-MM-dd
	// 			* times only, with an optional time zone appended
	//			|	* THH:mm
	//			|	* THH:mm:ss
	//			|	* THH:mm:ss.SSS
	// 			* and "datetimes" which could be any combination of the above
	//
	//		timezones may be specified as Z (for UTC) or +/- followed by a time expression HH:mm
	//		Assumes the local time zone if not specified.  Does not validate.  Improperly formatted
	//		input may return null.  Arguments which are out of bounds will be handled
	// 		by the Date constructor (e.g. January 32nd typically gets resolved to February 1st)
	//		Only years between 100 and 9999 are supported.
	//
  	//	formattedString:
	//		A string such as 2005-06-30T08:05:00-07:00 or 2005-06-30 or T08:05:00
	//
	//	defaultTime:
	//		Used for defaults for fields omitted in the formattedString.
	//		Uses 1970-01-01T00:00:00.0Z by default.

	if(!dojo.date.stamp._isoRegExp){
		dojo.date.stamp._isoRegExp =
//TODO: could be more restrictive and check for 00-59, etc.
			/^(?:(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(.\d+)?)?((?:[+-](\d{2}):(\d{2}))|Z)?)?$/;
	}

	var match = dojo.date.stamp._isoRegExp.exec(formattedString);
	var result = null;

	if(match){
		match.shift();
		if(match[1]){match[1]--;} // Javascript Date months are 0-based
		if(match[6]){match[6] *= 1000;} // Javascript Date expects fractional seconds as milliseconds

		if(defaultTime){
			// mix in defaultTime.  Relatively expensive, so use || operators for the fast path of defaultTime === 0
			defaultTime = new Date(defaultTime);
			dojo.map(["FullYear", "Month", "Date", "Hours", "Minutes", "Seconds", "Milliseconds"], function(prop){
				return defaultTime["get" + prop]();
			}).forEach(function(value, index){
				if(match[index] === undefined){
					match[index] = value;
				}
			});
		}
		result = new Date(match[0]||1970, match[1]||0, match[2]||1, match[3]||0, match[4]||0, match[5]||0, match[6]||0);
//		result.setFullYear(match[0]||1970); // for year < 100

		var offset = 0;
		var zoneSign = match[7] && match[7].charAt(0);
		if(zoneSign != 'Z'){
			offset = ((match[8] || 0) * 60) + (Number(match[9]) || 0);
			if(zoneSign != '-'){ offset *= -1; }
		}
		if(zoneSign){
			offset -= result.getTimezoneOffset();
		}
		if(offset){
			result.setTime(result.getTime() + offset * 60000);
		}
	}

	return result; // Date or null
}

/*=====
	dojo.date.stamp.__Options = function(){
		//	selector: String
		//		"date" or "time" for partial formatting of the Date object.
		//		Both date and time will be formatted by default.
		//	zulu: Boolean
		//		if true, UTC/GMT is used for a timezone
		//	milliseconds: Boolean
		//		if true, output milliseconds
		this.selector = selector;
		this.zulu = zulu;
		this.milliseconds = milliseconds;
	}
=====*/

dojo.date.stamp.toISOString = function(/*Date*/dateObject, /*dojo.date.stamp.__Options?*/options){
	//	summary:
	//		Format a Date object as a string according a subset of the ISO-8601 standard
	//
	//	description:
	//		When options.selector is omitted, output follows [RFC3339](http://www.ietf.org/rfc/rfc3339.txt)
	//		The local time zone is included as an offset from GMT, except when selector=='time' (time without a date)
	//		Does not check bounds.  Only years between 100 and 9999 are supported.
	//
	//	dateObject:
	//		A Date object

	var _ = function(n){ return (n < 10) ? "0" + n : n; };
	options = options || {};
	var formattedDate = [];
	var getter = options.zulu ? "getUTC" : "get";
	var date = "";
	if(options.selector != "time"){
		var year = dateObject[getter+"FullYear"]();
		date = ["0000".substr((year+"").length)+year, _(dateObject[getter+"Month"]()+1), _(dateObject[getter+"Date"]())].join('-');
	}
	formattedDate.push(date);
	if(options.selector != "date"){
		var time = [_(dateObject[getter+"Hours"]()), _(dateObject[getter+"Minutes"]()), _(dateObject[getter+"Seconds"]())].join(':');
		var millis = dateObject[getter+"Milliseconds"]();
		if(options.milliseconds){
			time += "."+ (millis < 100 ? "0" : "") + _(millis);
		}
		if(options.zulu){
			time += "Z";
		}else if(options.selector != "time"){
			var timezoneOffset = dateObject.getTimezoneOffset();
			var absOffset = Math.abs(timezoneOffset);
			time += (timezoneOffset > 0 ? "-" : "+") + 
				_(Math.floor(absOffset/60)) + ":" + _(absOffset%60);
		}
		formattedDate.push(time);
	}
	return formattedDate.join('T'); // String
}

}

if(!dojo._hasResource["dojo.parser"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.parser"] = true;
dojo.provide("dojo.parser");


dojo.parser = new function(){
	// summary: The Dom/Widget parsing package

	var d = dojo;
	var dtName = d._scopeName + "Type";
	var qry = "[" + dtName + "]";

	var _anonCtr = 0, _anon = {};
	var nameAnonFunc = function(/*Function*/anonFuncPtr, /*Object*/thisObj){
		// summary:
		//		Creates a reference to anonFuncPtr in thisObj with a completely
		//		unique name. The new name is returned as a String. 
		var nso = thisObj || _anon;
		if(dojo.isIE){
			var cn = anonFuncPtr["__dojoNameCache"];
			if(cn && nso[cn] === anonFuncPtr){
				return cn;
			}
		}
		var name;
		do{
			name = "__" + _anonCtr++;
		}while(name in nso)
		nso[name] = anonFuncPtr;
		return name; // String
	}

	function val2type(/*Object*/ value){
		// summary:
		//		Returns name of type of given value.

		if(d.isString(value)){ return "string"; }
		if(typeof value == "number"){ return "number"; }
		if(typeof value == "boolean"){ return "boolean"; }
		if(d.isFunction(value)){ return "function"; }
		if(d.isArray(value)){ return "array"; } // typeof [] == "object"
		if(value instanceof Date) { return "date"; } // assume timestamp
		if(value instanceof d._Url){ return "url"; }
		return "object";
	}

	function str2obj(/*String*/ value, /*String*/ type){
		// summary:
		//		Convert given string value to given type
		switch(type){
			case "string":
				return value;
			case "number":
				return value.length ? Number(value) : NaN;
			case "boolean":
				// for checked/disabled value might be "" or "checked".  interpret as true.
				return typeof value == "boolean" ? value : !(value.toLowerCase()=="false");
			case "function":
				if(d.isFunction(value)){
					// IE gives us a function, even when we say something like onClick="foo"
					// (in which case it gives us an invalid function "function(){ foo }"). 
					//  Therefore, convert to string
					value=value.toString();
					value=d.trim(value.substring(value.indexOf('{')+1, value.length-1));
				}
				try{
					if(value.search(/[^\w\.]+/i) != -1){
						// TODO: "this" here won't work
						value = nameAnonFunc(new Function(value), this);
					}
					return d.getObject(value, false);
				}catch(e){ return new Function(); }
			case "array":
				return value ? value.split(/\s*,\s*/) : [];
			case "date":
				switch(value){
					case "": return new Date("");	// the NaN of dates
					case "now": return new Date();	// current date
					default: return d.date.stamp.fromISOString(value);
				}
			case "url":
				return d.baseUrl + value;
			default:
				return d.fromJson(value);
		}
	}

	var instanceClasses = {
		// map from fully qualified name (like "dijit.Button") to structure like
		// { cls: dijit.Button, params: {label: "string", disabled: "boolean"} }
	};
	
	function getClassInfo(/*String*/ className){
		// className:
		//		fully qualified name (like "dijit.form.Button")
		// returns:
		//		structure like
		//			{ 
		//				cls: dijit.Button, 
		//				params: { label: "string", disabled: "boolean"}
		//			}

		if(!instanceClasses[className]){
			// get pointer to widget class
			var cls = d.getObject(className);
			if(!d.isFunction(cls)){
				throw new Error("Could not load class '" + className +
					"'. Did you spell the name correctly and use a full path, like 'dijit.form.Button'?");
			}
			var proto = cls.prototype;
	
			// get table of parameter names & types
			var params={};
			for(var name in proto){
				if(name.charAt(0)=="_"){ continue; } 	// skip internal properties
				var defVal = proto[name];
				params[name]=val2type(defVal);
			}

			instanceClasses[className] = { cls: cls, params: params };
		}
		return instanceClasses[className];
	}

	this._functionFromScript = function(script){
		var preamble = "";
		var suffix = "";
		var argsStr = script.getAttribute("args");
		if(argsStr){
			d.forEach(argsStr.split(/\s*,\s*/), function(part, idx){
				preamble += "var "+part+" = arguments["+idx+"]; ";
			});
		}
		var withStr = script.getAttribute("with");
		if(withStr && withStr.length){
			d.forEach(withStr.split(/\s*,\s*/), function(part){
				preamble += "with("+part+"){";
				suffix += "}";
			});
		}
		return new Function(preamble+script.innerHTML+suffix);
	}

	this.instantiate = function(/* Array */nodes, /* Object? */mixin){
		// summary:
		//		Takes array of nodes, and turns them into class instances and
		//		potentially calls a layout method to allow them to connect with
		//		any children		
		// mixin: Object
		//		An object that will be mixed in with each node in the array.
		//		Values in the mixin will override values in the node, if they
		//		exist.
		var thelist = [];
		mixin = mixin||{};
		d.forEach(nodes, function(node){
			if(!node){ return; }
			var type = dtName in mixin?mixin[dtName]:node.getAttribute(dtName);
			if(!type || !type.length){ return; }
			var clsInfo = getClassInfo(type),
				clazz = clsInfo.cls,
				ps = clazz._noScript || clazz.prototype._noScript;

			// read parameters (ie, attributes).
			// clsInfo.params lists expected params like {"checked": "boolean", "n": "number"}
			var params = {},
				attributes = node.attributes;
			for(var name in clsInfo.params){
				var item = name in mixin?{value:mixin[name],specified:true}:attributes.getNamedItem(name);
				if(!item || (!item.specified && (!dojo.isIE || name.toLowerCase()!="value"))){ continue; }
				var value = item.value;
				// Deal with IE quirks for 'class' and 'style'
				switch(name){
				case "class":
					value = "className" in mixin?mixin.className:node.className;
					break;
				case "style":
					value = "style" in mixin?mixin.style:(node.style && node.style.cssText); // FIXME: Opera?
				}
				var _type = clsInfo.params[name];
				if(typeof value == "string"){
					params[name] = str2obj(value, _type);
				}else{
					params[name] = value;
				}
			}

			// Process <script type="dojo/*"> script tags
			// <script type="dojo/method" event="foo"> tags are added to params, and passed to
			// the widget on instantiation.
			// <script type="dojo/method"> tags (with no event) are executed after instantiation
			// <script type="dojo/connect" event="foo"> tags are dojo.connected after instantiation
			// note: dojo/* script tags cannot exist in self closing widgets, like <input />
			if(!ps){
				var connects = [],	// functions to connect after instantiation
					calls = [];		// functions to call after instantiation

				d.query("> script[type^='dojo/']", node).orphan().forEach(function(script){
					var event = script.getAttribute("event"),
						type = script.getAttribute("type"),
						nf = d.parser._functionFromScript(script);
					if(event){
						if(type == "dojo/connect"){
							connects.push({event: event, func: nf});
						}else{
							params[event] = nf;
						}
					}else{
						calls.push(nf);
					}
				});
			}

			var markupFactory = clazz["markupFactory"];
			if(!markupFactory && clazz["prototype"]){
				markupFactory = clazz.prototype["markupFactory"];
			}
			// create the instance
			var instance = markupFactory ? markupFactory(params, node, clazz) : new clazz(params, node);
			thelist.push(instance);

			// map it to the JS namespace if that makes sense
			var jsname = node.getAttribute("jsId");
			if(jsname){
				d.setObject(jsname, instance);
			}

			// process connections and startup functions
			if(!ps){
				d.forEach(connects, function(connect){
					d.connect(instance, connect.event, null, connect.func);
				});
				d.forEach(calls, function(func){
					func.call(instance);
				});
			}
		});

		// Call startup on each top level instance if it makes sense (as for
		// widgets).  Parent widgets will recursively call startup on their
		// (non-top level) children
		d.forEach(thelist, function(instance){
			if(	instance  && 
				instance.startup &&
				!instance._started && 
				(!instance.getParent || !instance.getParent())
			){
				instance.startup();
			}
		});
		return thelist;
	};

	this.parse = function(/*DomNode?*/ rootNode){
		// summary:
		//		Search specified node (or root node) recursively for class instances,
		//		and instantiate them Searches for
		//		dojoType="qualified.class.name"
		var list = d.query(qry, rootNode);
		// go build the object instances
		var instances = this.instantiate(list);
		return instances;
	};
}();

//Register the parser callback. It should be the first callback
//after the a11y test.

(function(){
	var parseRunner = function(){ 
		if(dojo.config["parseOnLoad"] == true){
			dojo.parser.parse(); 
		}
	};

	// FIXME: need to clobber cross-dependency!!
	if(dojo.exists("dijit.wai.onload") && (dijit.wai.onload === dojo._loaders[0])){
		dojo._loaders.splice(1, 0, parseRunner);
	}else{
		dojo._loaders.unshift(parseRunner);
	}
})();

}

if(!dojo._hasResource["dijit._base.focus"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.focus"] = true;
dojo.provide("dijit._base.focus");

// summary:
//		These functions are used to query or set the focus and selection.
//
//		Also, they trace when widgets become actived/deactivated,
//		so that the widget can fire _onFocus/_onBlur events.
//		"Active" here means something similar to "focused", but
//		"focus" isn't quite the right word because we keep track of
//		a whole stack of "active" widgets.  Example:  Combobutton --> Menu -->
//		MenuItem.   The onBlur event for Combobutton doesn't fire due to focusing
//		on the Menu or a MenuItem, since they are considered part of the
//		Combobutton widget.  It only happens when focus is shifted
//		somewhere completely different.

dojo.mixin(dijit,
{
	// _curFocus: DomNode
	//		Currently focused item on screen
	_curFocus: null,

	// _prevFocus: DomNode
	//		Previously focused item on screen
	_prevFocus: null,

	isCollapsed: function(){
		// summary: tests whether the current selection is empty
		var _document = dojo.doc;
		if(_document.selection){ // IE
			var s=_document.selection;
			if(s.type=='Text'){
				return !s.createRange().htmlText.length; // Boolean
			}else{ //Control range
				return !s.createRange().length; // Boolean
			}
		}else{
			var _window = dojo.global;
			var selection = _window.getSelection();
			if(dojo.isString(selection)){ // Safari
				return !selection; // Boolean
			}else{ // Mozilla/W3
				return selection.isCollapsed || !selection.toString(); // Boolean
			}
		}
	},

	getBookmark: function(){
		// summary: Retrieves a bookmark that can be used with moveToBookmark to return to the same range
		var bookmark, selection = dojo.doc.selection;
		if(selection){ // IE
			var range = selection.createRange();
			if(selection.type.toUpperCase()=='CONTROL'){
				if(range.length){
					bookmark=[];
					var i=0,len=range.length;
					while(i<len){
						bookmark.push(range.item(i++));
					}
				}else{
					bookmark=null;
				}
			}else{
				bookmark = range.getBookmark();
			}
		}else{
			if(window.getSelection){
				selection = dojo.global.getSelection();
				if(selection){
					range = selection.getRangeAt(0);
					bookmark = range.cloneRange();
				}
			}else{
				console.warn("No idea how to store the current selection for this browser!");
			}
		}
		return bookmark; // Array
	},

	moveToBookmark: function(/*Object*/bookmark){
		// summary: Moves current selection to a bookmark
		// bookmark: This should be a returned object from dojo.html.selection.getBookmark()
		var _document = dojo.doc;
		if(_document.selection){ // IE
			var range;
			if(dojo.isArray(bookmark)){
				range = _document.body.createControlRange();
				//range.addElement does not have call/apply method, so can not call it directly
				//range is not available in "range.addElement(item)", so can't use that either
				dojo.forEach(bookmark, function(n){
					range.addElement(n);
				});
			}else{
				range = _document.selection.createRange();
				range.moveToBookmark(bookmark);
			}
			range.select();
		}else{ //Moz/W3C
			var selection = dojo.global.getSelection && dojo.global.getSelection();
			if(selection && selection.removeAllRanges){
				selection.removeAllRanges();
				selection.addRange(bookmark);
			}else{
				console.warn("No idea how to restore selection for this browser!");
			}
		}
	},

	getFocus: function(/*Widget?*/menu, /*Window?*/openedForWindow){
		// summary:
		//	Returns the current focus and selection.
		//	Called when a popup appears (either a top level menu or a dialog),
		//	or when a toolbar/menubar receives focus
		//
		// menu:
		//	The menu that's being opened
		//
		// openedForWindow:
		//	iframe in which menu was opened
		//
		// returns:
		//	A handle to restore focus/selection

		return {
			// Node to return focus to
			node: menu && dojo.isDescendant(dijit._curFocus, menu.domNode) ? dijit._prevFocus : dijit._curFocus,

			// Previously selected text
			bookmark:
				!dojo.withGlobal(openedForWindow||dojo.global, dijit.isCollapsed) ?
				dojo.withGlobal(openedForWindow||dojo.global, dijit.getBookmark) :
				null,

			openedForWindow: openedForWindow
		}; // Object
	},

	focus: function(/*Object || DomNode */ handle){
		// summary:
		//		Sets the focused node and the selection according to argument.
		//		To set focus to an iframe's content, pass in the iframe itself.
		// handle:
		//		object returned by get(), or a DomNode

		if(!handle){ return; }

		var node = "node" in handle ? handle.node : handle,		// because handle is either DomNode or a composite object
			bookmark = handle.bookmark,
			openedForWindow = handle.openedForWindow;

		// Set the focus
		// Note that for iframe's we need to use the <iframe> to follow the parentNode chain,
		// but we need to set focus to iframe.contentWindow
		if(node){
			var focusNode = (node.tagName.toLowerCase()=="iframe") ? node.contentWindow : node;
			if(focusNode && focusNode.focus){
				try{
					// Gecko throws sometimes if setting focus is impossible,
					// node not displayed or something like that
					focusNode.focus();
				}catch(e){/*quiet*/}
			}			
			dijit._onFocusNode(node);
		}

		// set the selection
		// do not need to restore if current selection is not empty
		// (use keyboard to select a menu item)
		if(bookmark && dojo.withGlobal(openedForWindow||dojo.global, dijit.isCollapsed)){
			if(openedForWindow){
				openedForWindow.focus();
			}
			try{
				dojo.withGlobal(openedForWindow||dojo.global, dijit.moveToBookmark, null, [bookmark]);
			}catch(e){
				/*squelch IE internal error, see http://trac.dojotoolkit.org/ticket/1984 */
			}
		}
	},

	// _activeStack: Array
	//		List of currently active widgets (focused widget and it's ancestors)
	_activeStack: [],

	registerWin: function(/*Window?*/targetWindow){
		// summary:
		//		Registers listeners on the specified window (either the main
		//		window or an iframe) to detect when the user has clicked somewhere.
		//		Anyone that creates an iframe should call this function.

		if(!targetWindow){
			targetWindow = window;
		}

		dojo.connect(targetWindow.document, "onmousedown", function(evt){
			dijit._justMouseDowned = true;
			setTimeout(function(){ dijit._justMouseDowned = false; }, 0);
			dijit._onTouchNode(evt.target||evt.srcElement);
		});
		//dojo.connect(targetWindow, "onscroll", ???);

		// Listen for blur and focus events on targetWindow's body
		var doc = targetWindow.document;
		if(doc){
			if(dojo.isIE){
				doc.attachEvent('onactivate', function(evt){
					if(evt.srcElement.tagName.toLowerCase() != "#document"){
						dijit._onFocusNode(evt.srcElement);
					}
				});
				doc.attachEvent('ondeactivate', function(evt){
					dijit._onBlurNode(evt.srcElement);
				});
			}else{
				doc.addEventListener('focus', function(evt){
					dijit._onFocusNode(evt.target);
				}, true);
				doc.addEventListener('blur', function(evt){
					dijit._onBlurNode(evt.target);
				}, true);
			}
		}
		doc = null;	// prevent memory leak (apparent circular reference via closure)
	},

	_onBlurNode: function(/*DomNode*/ node){
		// summary:
		// 		Called when focus leaves a node.
		//		Usually ignored, _unless_ it *isn't* follwed by touching another node,
		//		which indicates that we tabbed off the last field on the page,
		//		in which case every widget is marked inactive
		dijit._prevFocus = dijit._curFocus;
		dijit._curFocus = null;

		if(dijit._justMouseDowned){
			// the mouse down caused a new widget to be marked as active; this blur event
			// is coming late, so ignore it.
			return;
		}

		// if the blur event isn't followed by a focus event then mark all widgets as inactive.
		if(dijit._clearActiveWidgetsTimer){
			clearTimeout(dijit._clearActiveWidgetsTimer);
		}
		dijit._clearActiveWidgetsTimer = setTimeout(function(){
			delete dijit._clearActiveWidgetsTimer;
			dijit._setStack([]);
			dijit._prevFocus = null;
		}, 100);
	},

	_onTouchNode: function(/*DomNode*/ node){
		// summary:
		//		Callback when node is focused or mouse-downed

		// ignore the recent blurNode event
		if(dijit._clearActiveWidgetsTimer){
			clearTimeout(dijit._clearActiveWidgetsTimer);
			delete dijit._clearActiveWidgetsTimer;
		}

		// compute stack of active widgets (ex: ComboButton --> Menu --> MenuItem)
		var newStack=[];
		try{
			while(node){
				if(node.dijitPopupParent){
					node=dijit.byId(node.dijitPopupParent).domNode;
				}else if(node.tagName && node.tagName.toLowerCase()=="body"){
					// is this the root of the document or just the root of an iframe?
					if(node===dojo.body()){
						// node is the root of the main document
						break;
					}
					// otherwise, find the iframe this node refers to (can't access it via parentNode,
					// need to do this trick instead). window.frameElement is supported in IE/FF/Webkit
					node=dijit.getDocumentWindow(node.ownerDocument).frameElement;
				}else{
					var id = node.getAttribute && node.getAttribute("widgetId");
					if(id){
						newStack.unshift(id);
					}
					node=node.parentNode;
				}
			}
		}catch(e){ /* squelch */ }

		dijit._setStack(newStack);
	},

	_onFocusNode: function(/*DomNode*/ node){
		// summary
		//		Callback when node is focused

		if(!node){
			return;
		}

		if(node.nodeType == 9){
			// Ignore focus events on the document itself.  This is here so that
			// (for example) clicking the up/down arrows of a spinner
			//  (which don't get focus) won't cause that widget to blur. (FF issue)
			return;
		}

		if(node.nodeType == 9){
			// We focused on (the body of) the document itself, either the main document
			// or an iframe
			var iframe = dijit.getDocumentWindow(node).frameElement;
			if(!iframe){
				// Ignore focus events on main document.  This is specifically here
				// so that clicking the up/down arrows of a spinner (which don't get focus)
				// won't cause that widget to blur.
				return;
			}

			node = iframe;
		}

		dijit._onTouchNode(node);

		if(node==dijit._curFocus){ return; }
		if(dijit._curFocus){
			dijit._prevFocus = dijit._curFocus;
		}
		dijit._curFocus = node;
		dojo.publish("focusNode", [node]);
	},

	_setStack: function(newStack){
		// summary
		//	The stack of active widgets has changed.  Send out appropriate events and record new stack

		var oldStack = dijit._activeStack;
		dijit._activeStack = newStack;

		// compare old stack to new stack to see how many elements they have in common
		for(var nCommon=0; nCommon<Math.min(oldStack.length, newStack.length); nCommon++){
			if(oldStack[nCommon] != newStack[nCommon]){
				break;
			}
		}

		// for all elements that have gone out of focus, send blur event
		for(var i=oldStack.length-1; i>=nCommon; i--){
			var widget = dijit.byId(oldStack[i]);
			if(widget){
				widget._focused = false;
				widget._hasBeenBlurred = true;
				if(widget._onBlur){
					widget._onBlur();
				}
				if (widget._setStateClass){
					widget._setStateClass();
				}
				dojo.publish("widgetBlur", [widget]);
			}
		}

		// for all element that have come into focus, send focus event
		for(i=nCommon; i<newStack.length; i++){
			widget = dijit.byId(newStack[i]);
			if(widget){
				widget._focused = true;
				if(widget._onFocus){
					widget._onFocus();
				}
				if (widget._setStateClass){
					widget._setStateClass();
				}
				dojo.publish("widgetFocus", [widget]);
			}
		}
	}
});

// register top window and all the iframes it contains
dojo.addOnLoad(dijit.registerWin);

}

if(!dojo._hasResource["dijit._base.manager"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.manager"] = true;
dojo.provide("dijit._base.manager");

dojo.declare("dijit.WidgetSet", null, {
	// summary:
	//	A set of widgets indexed by id

	constructor: function(){
		this._hash={};
	},

	add: function(/*Widget*/ widget){
		if(this._hash[widget.id]){
			throw new Error("Tried to register widget with id==" + widget.id + " but that id is already registered");
		}
		this._hash[widget.id]=widget;
	},

	remove: function(/*String*/ id){
		delete this._hash[id];
	},

	forEach: function(/*Function*/ func){
		for(var id in this._hash){
			func(this._hash[id]);
		}
	},

	filter: function(/*Function*/ filter){
		var res = new dijit.WidgetSet();
		this.forEach(function(widget){
			if(filter(widget)){ res.add(widget); }
		});
		return res;		// dijit.WidgetSet
	},

	byId: function(/*String*/ id){
		return this._hash[id];
	},

	byClass: function(/*String*/ cls){
		return this.filter(function(widget){ return widget.declaredClass==cls; });	// dijit.WidgetSet
	}
	});

/*=====
dijit.registry = {
	// summary: A list of widgets on a page.
	// description: Is an instance of dijit.WidgetSet
};
=====*/
dijit.registry = new dijit.WidgetSet();

dijit._widgetTypeCtr = {};

dijit.getUniqueId = function(/*String*/widgetType){
	// summary
	//	Generates a unique id for a given widgetType

	var id;
	do{
		id = widgetType + "_" +
			(widgetType in dijit._widgetTypeCtr ?
				++dijit._widgetTypeCtr[widgetType] : dijit._widgetTypeCtr[widgetType] = 0);
	}while(dijit.byId(id));
	return id; // String
};


if(dojo.isIE){
	// Only run this for IE because we think it's only necessary in that case,
	// and because it causes problems on FF.  See bug #3531 for details.
	dojo.addOnWindowUnload(function(){
		dijit.registry.forEach(function(widget){ widget.destroy(); });
	});
}

dijit.byId = function(/*String|Widget*/id){
	// summary:
	//		Returns a widget by its id, or if passed a widget, no-op (like dojo.byId())
	return (dojo.isString(id)) ? dijit.registry.byId(id) : id; // Widget
};

dijit.byNode = function(/* DOMNode */ node){
	// summary:
	//		Returns the widget as referenced by node
	return dijit.registry.byId(node.getAttribute("widgetId")); // Widget
};

dijit.getEnclosingWidget = function(/* DOMNode */ node){
	// summary:
	//		Returns the widget whose dom tree contains node or null if
	//		the node is not contained within the dom tree of any widget
	while(node){
		if(node.getAttribute && node.getAttribute("widgetId")){
			return dijit.registry.byId(node.getAttribute("widgetId"));
		}
		node = node.parentNode;
	}
	return null;
};

// elements that are tab-navigable if they have no tabindex value set
// (except for "a", which must have an href attribute)
dijit._tabElements = {
	area: true,
	button: true,
	input: true,
	object: true,
	select: true,
	textarea: true
};

dijit._isElementShown = function(/*Element*/elem){
	var style = dojo.style(elem);
	return (style.visibility != "hidden")
		&& (style.visibility != "collapsed")
		&& (style.display != "none")
		&& (dojo.attr(elem, "type") != "hidden");
}

dijit.isTabNavigable = function(/*Element*/elem){
	// summary:
	//		Tests if an element is tab-navigable
	if(dojo.hasAttr(elem, "disabled")){ return false; }
	var hasTabindex = dojo.hasAttr(elem, "tabindex");
	var tabindex = dojo.attr(elem, "tabindex");
	if(hasTabindex && tabindex >= 0) {
		return true; // boolean
	}
	var name = elem.nodeName.toLowerCase();
	if(((name == "a" && dojo.hasAttr(elem, "href"))
			|| dijit._tabElements[name])
		&& (!hasTabindex || tabindex >= 0)){
		return true; // boolean
	}
	return false; // boolean
};

dijit._getTabNavigable = function(/*DOMNode*/root){
	// summary:
	//		Finds the following descendants of the specified root node:
	//		* the first tab-navigable element in document order
	//		  without a tabindex or with tabindex="0"
	//		* the last tab-navigable element in document order
	//		  without a tabindex or with tabindex="0"
	//		* the first element in document order with the lowest
	//		  positive tabindex value
	//		* the last element in document order with the highest
	//		  positive tabindex value
	var first, last, lowest, lowestTabindex, highest, highestTabindex;
	var walkTree = function(/*DOMNode*/parent){
		dojo.query("> *", parent).forEach(function(child){
			var isShown = dijit._isElementShown(child);
			if(isShown && dijit.isTabNavigable(child)){
				var tabindex = dojo.attr(child, "tabindex");
				if(!dojo.hasAttr(child, "tabindex") || tabindex == 0){
					if(!first){ first = child; }
					last = child;
				}else if(tabindex > 0){
					if(!lowest || tabindex < lowestTabindex){
						lowestTabindex = tabindex;
						lowest = child;
					}
					if(!highest || tabindex >= highestTabindex){
						highestTabindex = tabindex;
						highest = child;
					}
				}
			}
			if(isShown && child.nodeName.toUpperCase() != 'SELECT'){ walkTree(child) }
		});
	};
	if(dijit._isElementShown(root)){ walkTree(root) }
	return { first: first, last: last, lowest: lowest, highest: highest };
}
dijit.getFirstInTabbingOrder = function(/*String|DOMNode*/root){
	// summary:
	//		Finds the descendant of the specified root node
	//		that is first in the tabbing order
	var elems = dijit._getTabNavigable(dojo.byId(root));
	return elems.lowest ? elems.lowest : elems.first; // Element
};

dijit.getLastInTabbingOrder = function(/*String|DOMNode*/root){
	// summary:
	//		Finds the descendant of the specified root node
	//		that is last in the tabbing order
	var elems = dijit._getTabNavigable(dojo.byId(root));
	return elems.last ? elems.last : elems.highest; // Element
};

// dijit.defaultDuration
//	Default duration for wipe and fade animations within dijits
dijit.defaultDuration = dojo.config["defaultDuration"] || 200;

}

if(!dojo._hasResource["dojo.AdapterRegistry"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.AdapterRegistry"] = true;
dojo.provide("dojo.AdapterRegistry");

dojo.AdapterRegistry = function(/*Boolean?*/ returnWrappers){
	//	summary:
	//		A registry to make contextual calling/searching easier.
	//	description:
	//		Objects of this class keep list of arrays in the form [name, check,
	//		wrap, directReturn] that are used to determine what the contextual
	//		result of a set of checked arguments is. All check/wrap functions
	//		in this registry should be of the same arity.
	//	example:
	//	|	// create a new registry
	//	|	var reg = new dojo.AdapterRegistry();
	//	|	reg.register("handleString",
	//	|		dojo.isString,
	//	|		function(str){
	//	|			// do something with the string here
	//	|		}
	//	|	);
	//	|	reg.register("handleArr",
	//	|		dojo.isArray,
	//	|		function(arr){
	//	|			// do something with the array here
	//	|		}
	//	|	);
	//	|
	//	|	// now we can pass reg.match() *either* an array or a string and
	//	|	// the value we pass will get handled by the right function
	//	|	reg.match("someValue"); // will call the first function
	//	|	reg.match(["someValue"]); // will call the second

	this.pairs = [];
	this.returnWrappers = returnWrappers || false; // Boolean
}

dojo.extend(dojo.AdapterRegistry, {
	register: function(/*String*/ name, /*Function*/ check, /*Function*/ wrap, /*Boolean?*/ directReturn, /*Boolean?*/ override){
		//	summary: 
		//		register a check function to determine if the wrap function or
		//		object gets selected
		//	name:
		//		a way to identify this matcher.
		//	check:
		//		a function that arguments are passed to from the adapter's
		//		match() function.  The check function should return true if the
		//		given arguments are appropriate for the wrap function.
		//	directReturn:
		//		If directReturn is true, the value passed in for wrap will be
		//		returned instead of being called. Alternately, the
		//		AdapterRegistry can be set globally to "return not call" using
		//		the returnWrappers property. Either way, this behavior allows
		//		the registry to act as a "search" function instead of a
		//		function interception library.
		//	override:
		//		If override is given and true, the check function will be given
		//		highest priority. Otherwise, it will be the lowest priority
		//		adapter.
		this.pairs[((override) ? "unshift" : "push")]([name, check, wrap, directReturn]);
	},

	match: function(/* ... */){
		// summary:
		//		Find an adapter for the given arguments. If no suitable adapter
		//		is found, throws an exception. match() accepts any number of
		//		arguments, all of which are passed to all matching functions
		//		from the registered pairs.
		for(var i = 0; i < this.pairs.length; i++){
			var pair = this.pairs[i];
			if(pair[1].apply(this, arguments)){
				if((pair[3])||(this.returnWrappers)){
					return pair[2];
				}else{
					return pair[2].apply(this, arguments);
				}
			}
		}
		throw new Error("No match found");
	},

	unregister: function(name){
		// summary: Remove a named adapter from the registry

		// FIXME: this is kind of a dumb way to handle this. On a large
		// registry this will be slow-ish and we can use the name as a lookup
		// should we choose to trade memory for speed.
		for(var i = 0; i < this.pairs.length; i++){
			var pair = this.pairs[i];
			if(pair[0] == name){
				this.pairs.splice(i, 1);
				return true;
			}
		}
		return false;
	}
});

}

if(!dojo._hasResource["dijit._base.place"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.place"] = true;
dojo.provide("dijit._base.place");



// ported from dojo.html.util

dijit.getViewport = function(){
	//	summary
	//	Returns the dimensions and scroll position of the viewable area of a browser window

	var _window = dojo.global;
	var _document = dojo.doc;

	// get viewport size
	var w = 0, h = 0;
	var de = _document.documentElement;
	var dew = de.clientWidth, deh = de.clientHeight;
	if(dojo.isMozilla || dojo.isSafari){
		// mozilla
		// _window.innerHeight includes the height taken by the scroll bar
		// clientHeight is ideal but has DTD issues:
		// #4539: FF reverses the roles of body.clientHeight/Width and documentElement.clientHeight/Width based on the DTD!
		// check DTD to see whether body or documentElement returns the viewport dimensions using this algorithm:
		var minw, minh, maxw, maxh;
		var dbw = _document.body.clientWidth;
		if(dbw > dew){
			minw = dew;
			maxw = dbw;
		}else{
			maxw = dew;
			minw = dbw;
		}
		var dbh = _document.body.clientHeight;
		if(dbh > deh){
			minh = deh;
			maxh = dbh;
		}else{
			maxh = deh;
			minh = dbh;
		}
		w = (maxw > _window.innerWidth) ? minw : maxw;
		h = (maxh > _window.innerHeight) ? minh : maxh;
	}else if(_window.innerWidth){
		w = _window.innerWidth;
		h = _window.innerHeight;
	}else if(dojo.isIE && de && deh){
		w = dew;
		h = deh;
	}else if(dojo.body().clientWidth){
		// IE6?  If this isn't here then viewport.html fails
		w = dojo.body().clientWidth;
		h = dojo.body().clientHeight;
	}

	// get scroll position
	var scroll = dojo._docScroll();
	return { w: w, h: h, l: scroll.x, t: scroll.y };	//	object
};

/*=====
dijit.__Position = function(){
	//	x: Integer
	//		horizontal coordinate in pixels, relative to document body
	//	y: Integer
	//		vertical coordinate in pixels, relative to document body

	thix.x = x;
	this.y = y;
}
=====*/


dijit.placeOnScreen = function(
	/* DomNode */			node,
	/* dijit.__Position */	pos,
	/* String[] */			corners,
	/* boolean? */			tryOnly){
	//	summary:
	//		Positions one of the node's corners at specified position
	//		such that node is fully visible in viewport.
	//	description:
	//		NOTE: node is assumed to be absolutely or relatively positioned.
	//	pos:
	//		Object like {x: 10, y: 20}
	//	corners:
	//		Array of Strings representing order to try corners in, like ["TR", "BL"].
	//		Possible values are:
	//			* "BL" - bottom left
	//			* "BR" - bottom right
	//			* "TL" - top left
	//			* "TR" - top right
	//	example:	
	//		Try to place node's top right corner at (10,20).
	//		If that makes node go (partially) off screen, then try placing
	//		bottom left corner at (10,20).
	//	|	placeOnScreen(node, {x: 10, y: 20}, ["TR", "BL"])

	var choices = dojo.map(corners, function(corner){ return { corner: corner, pos: pos }; });

	return dijit._place(node, choices);
}

dijit._place = function(/*DomNode*/ node, /* Array */ choices, /* Function */ layoutNode){
	// summary:
	//		Given a list of spots to put node, put it at the first spot where it fits,
	//		of if it doesn't fit anywhere then the place with the least overflow
	// choices: Array
	//		Array of elements like: {corner: 'TL', pos: {x: 10, y: 20} }
	//		Above example says to put the top-left corner of the node at (10,20)
	//	layoutNode: Function(node, aroundNodeCorner, nodeCorner)
	//		for things like tooltip, they are displayed differently (and have different dimensions)
	//		based on their orientation relative to the parent.   This adjusts the popup based on orientation.

	// get {x: 10, y: 10, w: 100, h:100} type obj representing position of
	// viewport over document
	var view = dijit.getViewport();

	// This won't work if the node is inside a <div style="position: relative">,
	// so reattach it to dojo.doc.body.   (Otherwise, the positioning will be wrong
	// and also it might get cutoff)
	if(!node.parentNode || String(node.parentNode.tagName).toLowerCase() != "body"){
		dojo.body().appendChild(node);
	}

	var best = null;
	dojo.some(choices, function(choice){
		var corner = choice.corner;
		var pos = choice.pos;

		// configure node to be displayed in given position relative to button
		// (need to do this in order to get an accurate size for the node, because
		// a tooltips size changes based on position, due to triangle)
		if(layoutNode){
			layoutNode(node, choice.aroundCorner, corner);
		}

		// get node's size
		var style = node.style;
		var oldDisplay = style.display;
		var oldVis = style.visibility;
		style.visibility = "hidden";
		style.display = "";
		var mb = dojo.marginBox(node);
		style.display = oldDisplay;
		style.visibility = oldVis;

		// coordinates and size of node with specified corner placed at pos,
		// and clipped by viewport
		var startX = (corner.charAt(1) == 'L' ? pos.x : Math.max(view.l, pos.x - mb.w)),
			startY = (corner.charAt(0) == 'T' ? pos.y : Math.max(view.t, pos.y -  mb.h)),
			endX = (corner.charAt(1) == 'L' ? Math.min(view.l + view.w, startX + mb.w) : pos.x),
			endY = (corner.charAt(0) == 'T' ? Math.min(view.t + view.h, startY + mb.h) : pos.y),
			width = endX - startX,
			height = endY - startY,
			overflow = (mb.w - width) + (mb.h - height);

		if(best == null || overflow < best.overflow){
			best = {
				corner: corner,
				aroundCorner: choice.aroundCorner,
				x: startX,
				y: startY,
				w: width,
				h: height,
				overflow: overflow
			};
		}
		return !overflow;
	});

	node.style.left = best.x + "px";
	node.style.top = best.y + "px";
	if(best.overflow && layoutNode){
		layoutNode(node, best.aroundCorner, best.corner);
	}
	return best;
}

dijit.placeOnScreenAroundNode = function(
	/* DomNode */		node,
	/* DomNode */		aroundNode,
	/* Object */		aroundCorners,
	/* Function? */		layoutNode){

	//	summary:
	//		Position node adjacent or kitty-corner to aroundNode
	//		such that it's fully visible in viewport.
	//
	//	description:
	//		Place node such that corner of node touches a corner of
	//		aroundNode, and that node is fully visible.
	//
	//	aroundCorners:
	//		Ordered list of pairs of corners to try matching up.
	//		Each pair of corners is represented as a key/value in the hash,
	//		where the key corresponds to the aroundNode's corner, and
	//		the value corresponds to the node's corner:
	//
	//	|	{ aroundNodeCorner1: nodeCorner1, aroundNodeCorner2: nodeCorner2,  ...}
	//
	//		The following strings are used to represent the four corners:
	//			* "BL" - bottom left
	//			* "BR" - bottom right
	//			* "TL" - top left
	//			* "TR" - top right
	//
	//	layoutNode: Function(node, aroundNodeCorner, nodeCorner)
	//		For things like tooltip, they are displayed differently (and have different dimensions)
	//		based on their orientation relative to the parent.   This adjusts the popup based on orientation.
	//
	//	example:
	//	|	dijit.placeOnScreenAroundNode(node, aroundNode, {'BL':'TL', 'TR':'BR'}); 
	//		This will try to position node such that node's top-left corner is at the same position
	//		as the bottom left corner of the aroundNode (ie, put node below
	//		aroundNode, with left edges aligned).  If that fails it will try to put
	// 		the bottom-right corner of node where the top right corner of aroundNode is
	//		(ie, put node above aroundNode, with right edges aligned)
	//

	// get coordinates of aroundNode
	aroundNode = dojo.byId(aroundNode);
	var oldDisplay = aroundNode.style.display;
	aroundNode.style.display="";
	// #3172: use the slightly tighter border box instead of marginBox
	var aroundNodeW = (dojo.isIE == 8 && aroundNode.tagName == "TR") ? aroundNode.parentNode.parentNode.offsetWidth : aroundNode.offsetWidth; // IE8 bug see #8095
	var aroundNodeH = aroundNode.offsetHeight; //mb.h;
	var aroundNodePos = dojo.coords(aroundNode, true);
	aroundNode.style.display=oldDisplay;

	// place the node around the calculated rectangle
	return dijit._placeOnScreenAroundRect(node, 
		aroundNodePos.x, aroundNodePos.y, aroundNodeW, aroundNodeH,	// rectangle
		aroundCorners, layoutNode);
};

/*=====
dijit.__Rectangle = function(){
	//	x: Integer
	//		horizontal offset in pixels, relative to document body
	//	y: Integer
	//		vertical offset in pixels, relative to document body
	//	width: Integer
	//		width in pixels
	//	height: Integer
	//		height in pixels

	thix.x = x;
	this.y = y;
	thix.width = width;
	this.height = height;
}
=====*/


dijit.placeOnScreenAroundRectangle = function(
	/* DomNode */			node,
	/* dijit.__Rectangle */	aroundRect,
	/* Object */			aroundCorners,
	/* Function */			layoutNode){

	//	summary:
	//		Like dijit.placeOnScreenAroundNode(), except that the "around"
	//		parameter is an arbitrary rectangle on the screen (x, y, width, height)
	//		instead of a dom node.

	return dijit._placeOnScreenAroundRect(node, 
		aroundRect.x, aroundRect.y, aroundRect.width, aroundRect.height,	// rectangle
		aroundCorners, layoutNode);
};

dijit._placeOnScreenAroundRect = function(
	/* DomNode */		node,
	/* Number */		x,
	/* Number */		y,
	/* Number */		width,
	/* Number */		height,
	/* Object */		aroundCorners,
	/* Function */		layoutNode){

	//	summary:
	//		Like dijit.placeOnScreenAroundNode(), except it accepts coordinates
	//		of a rectangle to place node adjacent to.

	// TODO: combine with placeOnScreenAroundRectangle()

	// Generate list of possible positions for node
	var choices = [];
	for(var nodeCorner in aroundCorners){
		choices.push( {
			aroundCorner: nodeCorner,
			corner: aroundCorners[nodeCorner],
			pos: {
				x: x + (nodeCorner.charAt(1) == 'L' ? 0 : width),
				y: y + (nodeCorner.charAt(0) == 'T' ? 0 : height)
			}
		});
	}

	return dijit._place(node, choices, layoutNode);
};

dijit.placementRegistry = new dojo.AdapterRegistry();
dijit.placementRegistry.register("node",
	function(n, x){
		return typeof x == "object" &&
			typeof x.offsetWidth != "undefined" && typeof x.offsetHeight != "undefined";
	},
	dijit.placeOnScreenAroundNode);
dijit.placementRegistry.register("rect",
	function(n, x){
		return typeof x == "object" &&
			"x" in x && "y" in x && "width" in x && "height" in x;
	},
	dijit.placeOnScreenAroundRectangle);

dijit.placeOnScreenAroundElement = function(
	/* DomNode */		node,
	/* Object */		aroundElement,
	/* Object */		aroundCorners,
	/* Function */		layoutNode){

	//	summary:
	//		Like dijit.placeOnScreenAroundNode(), except it accepts an arbitrary object
	//		for the "around" argument and finds a proper processor to place a node.

	return dijit.placementRegistry.match.apply(dijit.placementRegistry, arguments);
};

}

if(!dojo._hasResource["dijit._base.window"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.window"] = true;
dojo.provide("dijit._base.window");

dijit.getDocumentWindow = function(doc){
	// summary:
	// 		Get window object associated with document doc

	// In some IE versions (at least 6.0), document.parentWindow does not return a
	// reference to the real window object (maybe a copy), so we must fix it as well
	// We use IE specific execScript to attach the real window reference to
	// document._parentWindow for later use
	if(dojo.isIE && window !== document.parentWindow && !doc._parentWindow){
		/*
		In IE 6, only the variable "window" can be used to connect events (others
		may be only copies).
		*/
		doc.parentWindow.execScript("document._parentWindow = window;", "Javascript");
		//to prevent memory leak, unset it after use
		//another possibility is to add an onUnload handler which seems overkill to me (liucougar)
		var win = doc._parentWindow;
		doc._parentWindow = null;
		return win;	//	Window
	}

	return doc._parentWindow || doc.parentWindow || doc.defaultView;	//	Window
}

}

if(!dojo._hasResource["dijit._base.popup"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.popup"] = true;
dojo.provide("dijit._base.popup");





dijit.popup = new function(){
	// summary:
	//		This class is used to show/hide widgets as popups.

	var stack = [],
		beginZIndex=1000,
		idGen = 1;

	this.prepare = function(/*DomNode*/ node){
		// summary:
		//		Prepares a node to be used as a popup
		//
		// description:
		//		Attaches node to dojo.doc.body, and
		//		positions it off screen, but not display:none, so that
		//		the widget doesn't appear in the page flow and/or cause a blank
		//		area at the bottom of the viewport (making scrollbar longer), but
		//		initialization of contained widgets works correctly
	
		dojo.body().appendChild(node);
		var s = node.style;
		if(s.display == "none"){
			s.display="";
		}
		s.visibility = "hidden";	// not needed for hiding, but used as flag that node is off-screen
		s.position = "absolute";
		s.top = "-9999px";
	};

/*=====
dijit.popup.__OpenArgs = function(){
	//		popup: Widget
	//			widget to display
	//		parent: Widget
	//			the button etc. that is displaying this popup
	//		around: DomNode
	//			DOM node (typically a button); place popup relative to this node
	//		orient: Object
	//			structure specifying possible positions of popup relative to "around" node
	//		onCancel: Function
	//			callback when user has canceled the popup by
	//				1. hitting ESC or
	//				2. by using the popup widget's proprietary cancel mechanism (like a cancel button in a dialog);
	//				   ie: whenever popupWidget.onCancel() is called, args.onCancel is called
	//		onClose: Function
	//			callback whenever this popup is closed
	//		onExecute: Function
	//			callback when user "executed" on the popup/sub-popup by selecting a menu choice, etc. (top menu only)
	this.popup = popup;
	this.parent = parent;
	this.around = around;
	this.orient = orient;
	this.onCancel = onCancel;
	this.onClose = onClose;
	this.onExecute = onExecute;
}
=====*/
	this.open = function(/*dijit.popup.__OpenArgs*/ args){
		// summary:
		//		Popup the widget at the specified position
		//
		// example:
		//	opening at the mouse position
		//	|		dijit.popup.open({popup: menuWidget, x: evt.pageX, y: evt.pageY});
		//
		// example:
		//	opening the widget as a dropdown
		//	|		dijit.popup.open({parent: this, popup: menuWidget, around: this.domNode, onClose: function(){...}  });
		//
		//	Note that whatever widget called dijit.popup.open() should also listen to its own _onBlur callback
		//	(fired from _base/focus.js) to know that focus has moved somewhere else and thus the popup should be closed.

		var widget = args.popup,
			orient = args.orient || {'BL':'TL', 'TL':'BL'},
			around = args.around,
			id = (args.around && args.around.id) ? (args.around.id+"_dropdown") : ("popup_"+idGen++);

		// make wrapper div to hold widget and possibly hold iframe behind it.
		// we can't attach the iframe as a child of the widget.domNode because
		// widget.domNode might be a <table>, <ul>, etc.
		var wrapper = dojo.doc.createElement("div");
		dijit.setWaiRole(wrapper, "presentation");
		wrapper.id = id;
		wrapper.className="dijitPopup";
		wrapper.style.zIndex = beginZIndex + stack.length;
		wrapper.style.left = wrapper.style.top = "0px";		// prevent transient scrollbar causing misalign (#5776)
		wrapper.style.visibility = "hidden";
		if(args.parent){
			wrapper.dijitPopupParent=args.parent.id;
		}
		dojo.body().appendChild(wrapper);

		var s = widget.domNode.style;
		s.display = "";
		s.visibility = "";
		s.position = "";
		wrapper.appendChild(widget.domNode);

		var iframe = new dijit.BackgroundIframe(wrapper);

		// position the wrapper node
		var best = around ?
			dijit.placeOnScreenAroundElement(wrapper, around, orient, widget.orient ? dojo.hitch(widget, "orient") : null) :
			dijit.placeOnScreen(wrapper, args, orient == 'R' ? ['TR','BR','TL','BL'] : ['TL','BL','TR','BR']);

		wrapper.style.visibility = "visible";
		// TODO: use effects to fade in wrapper

		var handlers = [];

		// Compute the closest ancestor popup that's *not* a child of another popup.
		// Ex: For a TooltipDialog with a button that spawns a tree of menus, find the popup of the button.
		var getTopPopup = function(){
			for(var pi=stack.length-1; pi > 0 && stack[pi].parent === stack[pi-1].widget; pi--){
				/* do nothing, just trying to get right value for pi */
			}
			return stack[pi];
		}

		// provide default escape and tab key handling
		// (this will work for any widget, not just menu)
		handlers.push(dojo.connect(wrapper, "onkeypress", this, function(evt){
			if(evt.charOrCode == dojo.keys.ESCAPE && args.onCancel){
				dojo.stopEvent(evt);
				args.onCancel();
			}else if(evt.charOrCode === dojo.keys.TAB){
				dojo.stopEvent(evt);
				var topPopup = getTopPopup();
				if(topPopup && topPopup.onCancel){
					topPopup.onCancel();
				}
			}
		}));

		// watch for cancel/execute events on the popup and notify the caller
		// (for a menu, "execute" means clicking an item)
		if(widget.onCancel){
			handlers.push(dojo.connect(widget, "onCancel", null, args.onCancel));
		}

		handlers.push(dojo.connect(widget, widget.onExecute ? "onExecute" : "onChange", null, function(){
			var topPopup = getTopPopup();
			if(topPopup && topPopup.onExecute){
				topPopup.onExecute();
			}
		}));

		stack.push({
			wrapper: wrapper,
			iframe: iframe,
			widget: widget,
			parent: args.parent,
			onExecute: args.onExecute,
			onCancel: args.onCancel,
 			onClose: args.onClose,
			handlers: handlers
		});

		if(widget.onOpen){
			widget.onOpen(best);
		}

		return best;
	};

	this.close = function(/*Widget*/ popup){
		// summary:
		//		Close specified popup and any popups that it parented
		while(dojo.some(stack, function(elem){return elem.widget == popup;})){
			var top = stack.pop(),
				wrapper = top.wrapper,
				iframe = top.iframe,
				widget = top.widget,
				onClose = top.onClose;
	
			if(widget.onClose){
				widget.onClose();
			}
			dojo.forEach(top.handlers, dojo.disconnect);
	
			// #2685: check if the widget still has a domNode so ContentPane can change its URL without getting an error
			if(!widget||!widget.domNode){ return; }
			
			this.prepare(widget.domNode);

			iframe.destroy();
			dojo._destroyElement(wrapper);
	
			if(onClose){
				onClose();
			}
		}
	};
}();

dijit._frames = new function(){
	// summary: cache of iframes
	var queue = [];

	this.pop = function(){
		var iframe;
		if(queue.length){
			iframe = queue.pop();
			iframe.style.display="";
		}else{
			if(dojo.isIE){
				var burl = dojo.config["dojoBlankHtmlUrl"] || (dojo.moduleUrl("dojo", "resources/blank.html")+"") || "javascript:\"\"";
				var html="<iframe src='" + burl + "'"
					+ " style='position: absolute; left: 0px; top: 0px;"
					+ "z-index: -1; filter:Alpha(Opacity=\"0\");'>";
				iframe = dojo.doc.createElement(html);
			}else{
			 	iframe = dojo.doc.createElement("iframe");
				iframe.src = 'javascript:""';
				iframe.className = "dijitBackgroundIframe";
			}
			iframe.tabIndex = -1; // Magic to prevent iframe from getting focus on tab keypress - as style didnt work.
			dojo.body().appendChild(iframe);
		}
		return iframe;
	};

	this.push = function(iframe){
		iframe.style.display="";
		if(dojo.isIE){
			iframe.style.removeExpression("width");
			iframe.style.removeExpression("height");
		}
		queue.push(iframe);
	}
}();

// fill the queue
if(dojo.isIE < 7){
	dojo.addOnLoad(function(){
		var f = dijit._frames;
		dojo.forEach([f.pop()], f.push);
	});
}


dijit.BackgroundIframe = function(/* DomNode */node){
	//	summary:
	//		For IE z-index schenanigans. id attribute is required.
	//
	//	description:
	//		new dijit.BackgroundIframe(node)
	//			Makes a background iframe as a child of node, that fills
	//			area (and position) of node

	if(!node.id){ throw new Error("no id"); }
	if((dojo.isIE && dojo.isIE < 7) || (dojo.isFF && dojo.isFF < 3 && dojo.hasClass(dojo.body(), "dijit_a11y"))){
		var iframe = dijit._frames.pop();
		node.appendChild(iframe);
		if(dojo.isIE){
			iframe.style.setExpression("width", dojo._scopeName + ".doc.getElementById('" + node.id + "').offsetWidth");
			iframe.style.setExpression("height", dojo._scopeName + ".doc.getElementById('" + node.id + "').offsetHeight");
		}
		this.iframe = iframe;
	}
};

dojo.extend(dijit.BackgroundIframe, {
	destroy: function(){
		//	summary: destroy the iframe
		if(this.iframe){
			dijit._frames.push(this.iframe);
			delete this.iframe;
		}
	}
});

}

if(!dojo._hasResource["dijit._base.scroll"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.scroll"] = true;
dojo.provide("dijit._base.scroll");

dijit.scrollIntoView = function(/* DomNode */node){
	//	summary
	//	Scroll the passed node into view, if it is not.

	// don't rely on that node.scrollIntoView works just because the function is there
	// it doesnt work in Konqueror or Opera even though the function is there and probably
	//	not safari either
	// native scrollIntoView() causes FF3's whole window to scroll if there is no scroll bar 
	//	on the immediate parent
	// dont like browser sniffs implementations but sometimes you have to use it
	// It's not enough just to scroll the menu node into view if
	// node.scrollIntoView hides part of the parent's scrollbar,
	// so just manage the parent scrollbar ourselves

	node = dojo.byId(node);
	var body = node.ownerDocument.body;
	var html = body.parentNode;
	if(dojo.isFF == 2 || node == body || node == html){ // FF2 is perfect, too bad FF3 is not
		node.scrollIntoView(false); // short-circuit to native if possible
		return;
	}
	var rtl = !dojo._isBodyLtr();
	var strict = dojo.doc.compatMode != 'BackCompat'; // not the same as !dojo.isQuirks
	var scrollRoot = (strict && !dojo.isSafari)? html : body;

	function addPseudoAttrs(element){
		var parent = element.parentNode;
		var offsetParent = element.offsetParent;
		if(offsetParent == null ||
			(element.style && element.style.position == "fixed")){ // position:fixed has no real offsetParent
			if(element == body || element == html){ // process only 1 of BODY/HTML
				element = scrollRoot;
			}else{ // position:fixed elements can have an offsetparent = null on IE7
				scrollRoot = element; // position:fixed is the last node that needs to be viewed
			}
			offsetParent = html;
			parent = null;
		}
		// all the V/H object members below are to reuse code for both directions
		element._offsetParent = (offsetParent == body)? scrollRoot : offsetParent;
		element._parent = (parent == body)? scrollRoot : parent;
		element._start = { H:element.offsetLeft, V:element.offsetTop };
		element._scroll = { H:element.scrollLeft, V:element.scrollTop };
		element._renderedSize = { H: element.offsetWidth, V: element.offsetHeight };
		var bp = dojo._getBorderExtents(element);
		element._borderStart = { H:bp.l, V:bp.t };
		element._borderSize = { H:bp.w, V:bp.h };
		element._clientSize = (element._offsetParent == html && dojo.isSafari && strict)? { H:html.clientWidth, V:html.clientHeight } : { H:element.clientWidth, V:element.clientHeight };
		element._scrollBarSize = { V: null, H: null };
		for(var dir in element._scrollBarSize){ // for both x and y directions
			var scrollBar = element._renderedSize[dir] - element._clientSize[dir] - element._borderSize[dir];
			element._scrollBarSize[dir] = (element._clientSize[dir] > 0 && scrollBar >= 15 && scrollBar <= 17)? scrollBar : 0; // sanity check
		}
		element._isScrollable = { V: null, H: null };
		for(dir in element._isScrollable){ // for both x and y directions
			var otherDir = dir=="H"? "V" : "H";
			element._isScrollable[dir] = element == scrollRoot || element._scroll[dir] || element._scrollBarSize[otherDir];
		}
	}

	var parent = node;
	while(parent != null){
		addPseudoAttrs(parent);
		var next = parent._parent;
		if(next){
			next._child = parent;
		}
		parent = next;
	}
	for(var dir in scrollRoot._renderedSize){ scrollRoot._renderedSize[dir] = Math.min(scrollRoot._clientSize[dir], scrollRoot._renderedSize[dir]); }
	var element = node;
	while(element != scrollRoot){
		parent = element._parent;
		if(parent.tagName == "TD"){
			var table = parent._parent._parent._parent; // point to TABLE
			if(table._offsetParent == element._offsetParent && parent._offsetParent != element._offsetParent){
				parent = table; // child of TD has the same offsetParent as TABLE, so skip TD, TR, and TBODY (ie. verticalslider)
			}
		}
		// check if this node and its parent share the same offsetParent
		var startIsRelative = element == scrollRoot || (parent._offsetParent != element._offsetParent);

		for(dir in element._start){ // for both x and y directions
			var otherDir = dir=="H"? "V" : "H";
			if(rtl && dir=="H" && (dojo.isSafari || dojo.isIE) && parent._clientSize.H > 0){ // scroll starts on the right
				var delta = parent.scrollWidth - parent._clientSize.H;
				if(delta > 0){ parent._scroll.H -= delta; } // match FF3 which has cool negative scrollLeft values
			}
			if(dojo.isIE && parent._offsetParent.tagName == "TABLE"){ // make it consistent with Safari and FF3 and exclude the starting TABLE border of TABLE children
				parent._start[dir] -= parent._offsetParent._borderStart[dir];
				parent._borderStart[dir] = parent._borderSize[dir] = 0;
			}
			if(parent._clientSize[dir] == 0){ // TABLE on Safari3/FF3, and TBODY on IE6/7
				parent._renderedSize[dir] = parent._clientSize[dir] = parent._child._clientSize[dir];
				if(rtl && dir=="H"){ parent._start[dir] -= parent._renderedSize[dir]; }
			}else{
				parent._renderedSize[dir] -= parent._borderSize[dir] + parent._scrollBarSize[dir];
			}
			parent._start[dir] += parent._borderStart[dir];

			// underflow = visible gap between parent and this node taking scrolling into account
			// if negative, part of the node is obscured by the parent's beginning and should be scrolled to become visible
			var underflow = element._start[dir] - (startIsRelative? 0 : parent._start[dir]) - parent._scroll[dir];
			// if positive, number of pixels obscured by the parent's end
			var overflow = underflow + element._renderedSize[dir] - parent._renderedSize[dir];
			var scrollAmount, scrollAttr = (dir=="H")? "scrollLeft" : "scrollTop";
			// see if we should scroll forward or backward
			var reverse = (dir=="H" && rtl); // flip everything
			var underflowScroll = reverse? -overflow : underflow;
			var overflowScroll = reverse? -underflow : overflow;
			if(underflowScroll <= 0){
				scrollAmount = underflowScroll;
			}else if(overflowScroll <= 0){
				scrollAmount = 0;
			}else if(underflowScroll < overflowScroll){
				scrollAmount = underflowScroll;
			}else{
				scrollAmount = overflowScroll;
			}
			var scrolledAmount = 0;
			if(scrollAmount != 0){
				var oldScroll = parent[scrollAttr];
				parent[scrollAttr] += reverse? -scrollAmount : scrollAmount; // actually perform the scroll
				scrolledAmount = parent[scrollAttr] - oldScroll; // in case the scroll failed
				underflow -= scrolledAmount;
				overflowScroll -= reverse? -scrolledAmount : scrolledAmount;
			}
			parent._renderedSize[dir] = element._renderedSize[dir] + parent._scrollBarSize[dir] - 
				// check for isScrollable since a nonscrolling parent could be smaller than the child but the child is fully visible
				((parent._isScrollable[dir] && overflowScroll > 0)? overflowScroll : 0); // only show portion of the parent
			parent._start[dir] += (underflow >= 0 || !parent._isScrollable[dir])? underflow : 0;
		}
		element = parent; // now see if the parent needs to be scrolled as well
	}
};

}

if(!dojo._hasResource["dijit._base.sniff"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.sniff"] = true;
//	summary:
//		Applies pre-set CSS classes to the top-level HTML node, based on:
// 			- browser (ex: dj_ie)
//			- browser version (ex: dj_ie6)
//			- box model (ex: dj_contentBox)
//			- text direction (ex: dijitRtl)
//
//		In addition, browser, browser version, and box model are
//		combined with an RTL flag when browser text is RTL.  ex: dj_ie-rtl.
//
//		Simply doing a require on this module will
//		establish this CSS.  Modified version of Morris' CSS hack.

dojo.provide("dijit._base.sniff");

(function(){
	var d = dojo;
	var ie = d.isIE;
	var opera = d.isOpera;
	var maj = Math.floor;
	var ff = d.isFF;
	var boxModel = d.boxModel.replace(/-/,'');
	var classes = {
		dj_ie: ie,
//		dj_ie55: ie == 5.5,
		dj_ie6: maj(ie) == 6,
		dj_ie7: maj(ie) == 7,
		dj_iequirks: ie && d.isQuirks,
// NOTE: Opera not supported by dijit
		dj_opera: opera,
		dj_opera8: maj(opera) == 8,
		dj_opera9: maj(opera) == 9,
		dj_khtml: d.isKhtml,
		dj_webkit: d.isWebKit,
		dj_safari: d.isSafari,
		dj_gecko: d.isMozilla,
		dj_ff2: maj(ff) == 2,
		dj_ff3: maj(ff) == 3
	}; // no dojo unsupported browsers
	classes["dj_" + boxModel] = true;

	var html = dojo.doc.documentElement;

	// apply browser, browser version, and box model class names
	for(var p in classes){
		if(classes[p]){
			if(html.className){
				html.className += " " + p;
			}else{
				html.className = p;
			}
		}
	}

	// If RTL mode then add dijitRtl flag plus repeat existing classes
	// with -rtl extension
	// (unshift is to make this code run after <body> node is loaded but before parser runs)
	dojo._loaders.unshift(function(){
		if(!dojo._isBodyLtr()){
			html.className += " dijitRtl";
			for(var p in classes){
				if(classes[p]){
					html.className += " " + p+"-rtl";
				}
			}
		}
	});
})();

}

if(!dojo._hasResource["dijit._base.typematic"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.typematic"] = true;
dojo.provide("dijit._base.typematic");

dijit.typematic = {
	// summary:
	//	These functions are used to repetitively call a user specified callback
	//	method when a specific key or mouse click over a specific DOM node is
	//	held down for a specific amount of time.
	//	Only 1 such event is allowed to occur on the browser page at 1 time.

	_fireEventAndReload: function(){
		this._timer = null;
		this._callback(++this._count, this._node, this._evt);
		this._currentTimeout = (this._currentTimeout < 0) ? this._initialDelay : ((this._subsequentDelay > 1) ? this._subsequentDelay : Math.round(this._currentTimeout * this._subsequentDelay));
		this._timer = setTimeout(dojo.hitch(this, "_fireEventAndReload"), this._currentTimeout);
	},

	trigger: function(/*Event*/ evt, /* Object */ _this, /*DOMNode*/ node, /* Function */ callback, /* Object */ obj, /* Number */ subsequentDelay, /* Number */ initialDelay){
		// summary:
		//      Start a timed, repeating callback sequence.
		//      If already started, the function call is ignored.
		//      This method is not normally called by the user but can be
		//      when the normal listener code is insufficient.
		//	Parameters:
		//	evt: key or mouse event object to pass to the user callback
		//	_this: pointer to the user's widget space.
		//	node: the DOM node object to pass the the callback function
		//	callback: function to call until the sequence is stopped called with 3 parameters:
		//		count: integer representing number of repeated calls (0..n) with -1 indicating the iteration has stopped
		//		node: the DOM node object passed in
		//		evt: key or mouse event object
		//	obj: user space object used to uniquely identify each typematic sequence
		//	subsequentDelay: if > 1, the number of milliseconds until the 3->n events occur
		//		or else the fractional time multiplier for the next event's delay, default=0.9
		//	initialDelay: the number of milliseconds until the 2nd event occurs, default=500ms
		if(obj != this._obj){
			this.stop();
			this._initialDelay = initialDelay || 500;
			this._subsequentDelay = subsequentDelay || 0.90;
			this._obj = obj;
			this._evt = evt;
			this._node = node;
			this._currentTimeout = -1;
			this._count = -1;
			this._callback = dojo.hitch(_this, callback);
			this._fireEventAndReload();
		}
	},

	stop: function(){
		// summary:
		//	  Stop an ongoing timed, repeating callback sequence.
		if(this._timer){
			clearTimeout(this._timer);
			this._timer = null;
		}
		if(this._obj){
			this._callback(-1, this._node, this._evt);
			this._obj = null;
		}
	},

	addKeyListener: function(/*DOMNode*/ node, /*Object*/ keyObject, /*Object*/ _this, /*Function*/ callback, /*Number*/ subsequentDelay, /*Number*/ initialDelay){
		// summary: Start listening for a specific typematic key.
		//	keyObject: an object defining the key to listen for.
		//		charOrCode: the printable character (string) or keyCode (number) to listen for.
		//			keyCode: (deprecated - use charOrCode) the keyCode (number) to listen for (implies charCode = 0).
		//			charCode: (deprecated - use charOrCode) the charCode (number) to listen for.
		//		ctrlKey: desired ctrl key state to initiate the calback sequence:
		//			pressed (true)
		//			released (false)
		//			either (unspecified)
		//		altKey: same as ctrlKey but for the alt key
		//		shiftKey: same as ctrlKey but for the shift key
		//	See the trigger method for other parameters.
		//	Returns an array of dojo.connect handles
		if(keyObject.keyCode){
			keyObject.charOrCode = keyObject.keyCode;
			dojo.deprecated("keyCode attribute parameter for dijit.typematic.addKeyListener is deprecated. Use charOrCode instead.", "", "2.0");
		}else if(keyObject.charCode){
			keyObject.charOrCode = String.fromCharCode(keyObject.charCode);
			dojo.deprecated("charCode attribute parameter for dijit.typematic.addKeyListener is deprecated. Use charOrCode instead.", "", "2.0");
		}
		return [
			dojo.connect(node, "onkeypress", this, function(evt){
				if(evt.charOrCode == keyObject.charOrCode &&
				(keyObject.ctrlKey === undefined || keyObject.ctrlKey == evt.ctrlKey) &&
				(keyObject.altKey === undefined || keyObject.altKey == evt.ctrlKey) &&
				(keyObject.shiftKey === undefined || keyObject.shiftKey == evt.ctrlKey)){
					dojo.stopEvent(evt);
					dijit.typematic.trigger(keyObject, _this, node, callback, keyObject, subsequentDelay, initialDelay);
				}else if(dijit.typematic._obj == keyObject){
					dijit.typematic.stop();
				}
			}),
			dojo.connect(node, "onkeyup", this, function(evt){
				if(dijit.typematic._obj == keyObject){
					dijit.typematic.stop();
				}
			})
		];
	},

	addMouseListener: function(/*DOMNode*/ node, /*Object*/ _this, /*Function*/ callback, /*Number*/ subsequentDelay, /*Number*/ initialDelay){
		// summary: Start listening for a typematic mouse click.
		//	See the trigger method for other parameters.
		//	Returns an array of dojo.connect handles
		var dc = dojo.connect;
		return [
			dc(node, "mousedown", this, function(evt){
				dojo.stopEvent(evt);
				dijit.typematic.trigger(evt, _this, node, callback, node, subsequentDelay, initialDelay);
			}),
			dc(node, "mouseup", this, function(evt){
				dojo.stopEvent(evt);
				dijit.typematic.stop();
			}),
			dc(node, "mouseout", this, function(evt){
				dojo.stopEvent(evt);
				dijit.typematic.stop();
			}),
			dc(node, "mousemove", this, function(evt){
				dojo.stopEvent(evt);
			}),
			dc(node, "dblclick", this, function(evt){
				dojo.stopEvent(evt);
				if(dojo.isIE){
					dijit.typematic.trigger(evt, _this, node, callback, node, subsequentDelay, initialDelay);
					setTimeout(dojo.hitch(this, dijit.typematic.stop), 50);
				}
			})
		];
	},

	addListener: function(/*Node*/ mouseNode, /*Node*/ keyNode, /*Object*/ keyObject, /*Object*/ _this, /*Function*/ callback, /*Number*/ subsequentDelay, /*Number*/ initialDelay){
		// summary: Start listening for a specific typematic key and mouseclick.
		//	This is a thin wrapper to addKeyListener and addMouseListener.
		//	mouseNode: the DOM node object to listen on for mouse events.
		//	keyNode: the DOM node object to listen on for key events.
		//	See the addMouseListener and addKeyListener methods for other parameters.
		//	Returns an array of dojo.connect handles
		return this.addKeyListener(keyNode, keyObject, _this, callback, subsequentDelay, initialDelay).concat(
			this.addMouseListener(mouseNode, _this, callback, subsequentDelay, initialDelay));
	}
};

}

if(!dojo._hasResource["dijit._base.wai"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base.wai"] = true;
dojo.provide("dijit._base.wai");

dijit.wai = {
	onload: function(){
		// summary:
		//		Detects if we are in high-contrast mode or not

		// This must be a named function and not an anonymous
		// function, so that the widget parsing code can make sure it
		// registers its onload function after this function.
		// DO NOT USE "this" within this function.

		// create div for testing if high contrast mode is on or images are turned off
		var div = dojo.doc.createElement("div");
		div.id = "a11yTestNode";
		div.style.cssText = 'border: 1px solid;'
			+ 'border-color:red green;'
			+ 'position: absolute;'
			+ 'height: 5px;'
			+ 'top: -999px;'
			+ 'background-image: url("' + (dojo.config.blankGif || dojo.moduleUrl("dojo", "resources/blank.gif")) + '");';
		dojo.body().appendChild(div);

		// test it
		var cs = dojo.getComputedStyle(div);
		if(cs){
			var bkImg = cs.backgroundImage;
			var needsA11y = (cs.borderTopColor==cs.borderRightColor) || (bkImg != null && (bkImg == "none" || bkImg == "url(invalid-url:)" ));
			dojo[needsA11y ? "addClass" : "removeClass"](dojo.body(), "dijit_a11y");
			if(dojo.isIE){
				div.outerHTML = "";		// prevent mixed-content warning, see http://support.microsoft.com/kb/925014
			}else{
				dojo.body().removeChild(div);
			}
		}
	}
};

// Test if computer is in high contrast mode.
// Make sure the a11y test runs first, before widgets are instantiated.
if(dojo.isIE || dojo.isMoz){	// NOTE: checking in Safari messes things up
	dojo._loaders.unshift(dijit.wai.onload);
}

dojo.mixin(dijit,
{
	_XhtmlRoles: /banner|contentinfo|definition|main|navigation|search|note|secondary|seealso/,

	hasWaiRole: function(/*Element*/ elem, /*String*/ role){
		// summary: Determines if an element has a particular non-XHTML role.
		// returns: true if elem has the specific non-XHTML role attribute and false if not.
		// 		for backwards compatibility if role parameter not provided, 
		// 		returns true if has non XHTML role 
		var waiRole = this.getWaiRole(elem);		
		return role ? (waiRole.indexOf(role) > -1) : (waiRole.length > 0);
	},

	getWaiRole: function(/*Element*/ elem){
		// summary: Gets the non-XHTML role for an element (which should be a wai role).
		// returns:
		//		The non-XHTML role of elem or an empty string if elem
		//		does not have a role.
		 return dojo.trim((dojo.attr(elem, "role") || "").replace(this._XhtmlRoles,"").replace("wairole:",""));
	},

	setWaiRole: function(/*Element*/ elem, /*String*/ role){
		// summary: Sets the role on an element.
		// description:
		//  	in other than FF2 replace existing role attribute with new role
		//		FF3 supports XHTML and ARIA roles so    
		//		If elem already has an XHTML role, append this role to XHTML role 
		//		and remove other ARIA roles
		//		On Firefox 2 and below, "wairole:" is
		//		prepended to the provided role value.

		var curRole = dojo.attr(elem, "role") || "";
		if(dojo.isFF < 3 || !this._XhtmlRoles.test(curRole)){
			dojo.attr(elem, "role", dojo.isFF < 3 ? "wairole:" + role : role);
		}else{
			if((" "+ curRole +" ").indexOf(" " + role + " ") < 0){
				var clearXhtml = dojo.trim(curRole.replace(this._XhtmlRoles, ""));
				var cleanRole = dojo.trim(curRole.replace(clearXhtml, ""));	 
         		dojo.attr(elem, "role", cleanRole + (cleanRole ? ' ' : '') + role);
			}
		}
	},

	removeWaiRole: function(/*Element*/ elem, /*String*/ role){
		// summary: Removes the specified non-XHTML role from an element.
		// 		removes role attribute if no specific role provided (for backwards compat.)

		var roleValue = dojo.attr(elem, "role"); 
		if(!roleValue){ return; }
		if(role){
			var searchRole = dojo.isFF < 3 ? "wairole:" + role : role;
			var t = dojo.trim((" " + roleValue + " ").replace(" " + searchRole + " ", " "));
			dojo.attr(elem, "role", t);
		}else{
			elem.removeAttribute("role");	
		}
	},

	hasWaiState: function(/*Element*/ elem, /*String*/ state){
		// summary: Determines if an element has a given state.
		// description:
		//		On Firefox 2 and below, we check for an attribute in namespace
		//		"http://www.w3.org/2005/07/aaa" with a name of the given state.
		//		On all other browsers, we check for an attribute
		//		called "aria-"+state.
		// returns:
		//		true if elem has a value for the given state and
		//		false if it does not.
		if(dojo.isFF < 3){
			return elem.hasAttributeNS("http://www.w3.org/2005/07/aaa", state);
		}
		return elem.hasAttribute ? elem.hasAttribute("aria-"+state) : !!elem.getAttribute("aria-"+state);
	},

	getWaiState: function(/*Element*/ elem, /*String*/ state){
		// summary: Gets the value of a state on an element.
		// description:
		//		On Firefox 2 and below, we check for an attribute in namespace
		//		"http://www.w3.org/2005/07/aaa" with a name of the given state.
		//		On all other browsers, we check for an attribute called
		//		"aria-"+state.
		// returns:
		//		The value of the requested state on elem
		//		or an empty string if elem has no value for state.
		if(dojo.isFF < 3){
			return elem.getAttributeNS("http://www.w3.org/2005/07/aaa", state);
		}
		return elem.getAttribute("aria-"+state) || "";
	},

	setWaiState: function(/*Element*/ elem, /*String*/ state, /*String*/ value){
		// summary: Sets a state on an element.
		// description:
		//		On Firefox 2 and below, we set an attribute in namespace
		//		"http://www.w3.org/2005/07/aaa" with a name of the given state.
		//		On all other browsers, we set an attribute called
		//		"aria-"+state.
		if(dojo.isFF < 3){
			elem.setAttributeNS("http://www.w3.org/2005/07/aaa",
				"aaa:"+state, value);
		}else{
			elem.setAttribute("aria-"+state, value);
		}
	},

	removeWaiState: function(/*Element*/ elem, /*String*/ state){
		// summary: Removes a state from an element.
		// description:
		//		On Firefox 2 and below, we remove the attribute in namespace
		//		"http://www.w3.org/2005/07/aaa" with a name of the given state.
		//		On all other browsers, we remove the attribute called
		//		"aria-"+state.
		if(dojo.isFF < 3){
			elem.removeAttributeNS("http://www.w3.org/2005/07/aaa", state);
		}else{
			elem.removeAttribute("aria-"+state);
		}
	}
});

}

if(!dojo._hasResource["dijit._base"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._base"] = true;
dojo.provide("dijit._base");











}

if(!dojo._hasResource["dijit._Widget"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._Widget"] = true;
dojo.provide("dijit._Widget");

dojo.require( "dijit._base" );

dojo.connect(dojo, "connect", 
	function(/*Widget*/ widget, /*String*/ event){
		if(widget && dojo.isFunction(widget._onConnect)){
			widget._onConnect(event);
		}
	});

dijit._connectOnUseEventHandler = function(/*Event*/ event){};

(function(){

var _attrReg = {};
var getAttrReg = function(dc){
	if(!_attrReg[dc]){
		var r = [];
		var attrs;
		var proto = dojo.getObject(dc).prototype;
		for(var fxName in proto){
			if(dojo.isFunction(proto[fxName]) && (attrs = fxName.match(/^_set([a-zA-Z]*)Attr$/)) && attrs[1]){
				r.push(attrs[1].charAt(0).toLowerCase() + attrs[1].substr(1));
			}
		}
		_attrReg[dc] = r;
	}
	return _attrReg[dc]||[];
}

dojo.declare("dijit._Widget", null, {
	//	summary:
	//		The foundation of dijit widgets. 	
	//
	//	id: String
	//		a unique, opaque ID string that can be assigned by users or by the
	//		system. If the developer passes an ID which is known not to be
	//		unique, the specified ID is ignored and the system-generated ID is
	//		used instead.
	id: "",

	//	lang: String
	//		Rarely used.  Overrides the default Dojo locale used to render this widget,
	//		as defined by the [HTML LANG](http://www.w3.org/TR/html401/struct/dirlang.html#adef-lang) attribute.
	//		Value must be among the list of locales specified during by the Dojo bootstrap,
	//		formatted according to [RFC 3066](http://www.ietf.org/rfc/rfc3066.txt) (like en-us).
	lang: "",

	//	dir: String
	//		Unsupported by Dijit, but here for completeness.  Dijit only supports setting text direction on the
	//		entire document.
	//		Bi-directional support, as defined by the [HTML DIR](http://www.w3.org/TR/html401/struct/dirlang.html#adef-dir)
	//		attribute. Either left-to-right "ltr" or right-to-left "rtl".
	dir: "",

	// class: String
	//		HTML class attribute
	"class": "",

	// style: String
	//		HTML style attribute
	style: "",

	// title: String
	//		HTML title attribute
	title: "",

	// srcNodeRef: DomNode
	//		pointer to original dom node
	srcNodeRef: null,

	// domNode: DomNode
	//		This is our visible representation of the widget! Other DOM
	//		Nodes may by assigned to other properties, usually through the
	//		template system's dojoAttachPoint syntax, but the domNode
	//		property is the canonical "top level" node in widget UI.
	domNode: null,

	// containerNode: DomNode
	//		Designates where children of the source dom node will be placed.
	//		"Children" in this case refers to both dom nodes and widgets.
	//		For example, for myWidget:
	//
	//		|	<div dojoType=myWidget>
	//		|		<b> here's a plain dom node
	//		|		<span dojoType=subWidget>and a widget</span>
	//		|		<i> and another plain dom node </i>
	//		|	</div>
	//
	//		containerNode would point to:
	//
	//		|		<b> here's a plain dom node
	//		|		<span dojoType=subWidget>and a widget</span>
	//		|		<i> and another plain dom node </i>
	//
	//		In templated widgets, "containerNode" is set via a
	//		dojoAttachPoint assignment.
	//
	//		containerNode must be defined for any widget that accepts innerHTML
	//		(like ContentPane or BorderContainer or even Button), and conversely
	//		is null for widgets that don't, like TextBox.
	containerNode: null,

	// attributeMap: Object
	//		attributeMap sets up a "binding" between attributes (aka properties)
	//		of the widget and the widget's DOM.
	//		Changes to widget attributes listed in attributeMap will be 
	//		reflected into the DOM.
	//
	//		For example, calling attr('title', 'hello')
	//		on a TitlePane will automatically cause the TitlePane's DOM to update
	//		with the new title.
	//
	//		attributeMap is a hash where the key is an attribute of the widget,
	//		and the value reflects a binding to a:
	//
	//		- DOM node attribute
	// |		focus: {node: "focusNode", type: "attribute"}
	// 		Maps this.focus to this.focusNode.focus
	//
	//		- DOM node innerHTML
	//	|		title: { node: "titleNode", type: "innerHTML" }
	//		Maps this.title to this.titleNode.innerHTML
	//
	//		- DOM node CSS class
	// |		myClass: { node: "domNode", type: "class" }
	//		Maps this.myClass to this.domNode.className
	//
	//		If the value is an array, then each element in the array matches one of the
	//		formats of the above list.
	//
	//		There are also some shorthands for backwards compatibility:
	//		- string --> { node: string, type: "attribute" }, for example:
	//	|	"focusNode" ---> { node: "focusNode", type: "attribute" }
	//		- "" --> { node: "domNode", type: "attribute" }
	attributeMap: {id:"", dir:"", lang:"", "class":"", style:"", title:""},

	// _deferredConnects: Object
	//		attributeMap addendum for event handlers that should be connected only on first use
	_deferredConnects: {
		onClick: "",
		onDblClick: "",
		onKeyDown: "",
		onKeyPress: "",
		onKeyUp: "",
		onMouseMove: "",
		onMouseDown: "",
		onMouseOut: "",
		onMouseOver: "",
		onMouseLeave: "",
		onMouseEnter: "",
		onMouseUp: ""},

	onClick: dijit._connectOnUseEventHandler,
	/*=====
	onClick: function(event){
		// summary: 
		//	Connect to this function to receive notifications of mouse click events.
		//	event: mouse Event
	},
	=====*/
	onDblClick: dijit._connectOnUseEventHandler,
	/*=====
	onDblClick: function(event){
		// summary: 
		//	Connect to this function to receive notifications of mouse double click events.
		//	event: mouse Event
	},
	=====*/
	onKeyDown: dijit._connectOnUseEventHandler,
	/*=====
	onKeyDown: function(event){
		// summary: 
		//	Connect to this function to receive notifications of keys being pressed down.
		//	event: key Event
	},
	=====*/
	onKeyPress: dijit._connectOnUseEventHandler,
	/*=====
	onKeyPress: function(event){
		// summary: 
		//	Connect to this function to receive notifications of printable keys being typed.
		//	event: key Event
	},
	=====*/
	onKeyUp: dijit._connectOnUseEventHandler,
	/*=====
	onKeyUp: function(event){
		// summary: 
		//	Connect to this function to receive notifications of keys being released.
		//	event: key Event
	},
	=====*/
	onMouseDown: dijit._connectOnUseEventHandler,
	/*=====
	onMouseDown: function(event){
		// summary: 
		//	Connect to this function to receive notifications of when the mouse button is pressed down.
		//	event: mouse Event
	},
	=====*/
	onMouseMove: dijit._connectOnUseEventHandler,
	/*=====
	onMouseMove: function(event){
		// summary: 
		//	Connect to this function to receive notifications of when the mouse moves over nodes contained within this widget.
		//	event: mouse Event
	},
	=====*/
	onMouseOut: dijit._connectOnUseEventHandler,
	/*=====
	onMouseOut: function(event){
		// summary: 
		//	Connect to this function to receive notifications of when the mouse moves off of nodes contained within this widget.
		//	event: mouse Event
	},
	=====*/
	onMouseOver: dijit._connectOnUseEventHandler,
	/*=====
	onMouseOver: function(event){
		// summary: 
		//	Connect to this function to receive notifications of when the mouse moves onto nodes contained within this widget.
		//	event: mouse Event
	},
	=====*/
	onMouseLeave: dijit._connectOnUseEventHandler,
	/*=====
	onMouseLeave: function(event){
		// summary: 
		//	Connect to this function to receive notifications of when the mouse moves off of this widget.
		//	event: mouse Event
	},
	=====*/
	onMouseEnter: dijit._connectOnUseEventHandler,
	/*=====
	onMouseEnter: function(event){
		// summary: 
		//	Connect to this function to receive notifications of when the mouse moves onto this widget.
		//	event: mouse Event
	},
	=====*/
	onMouseUp: dijit._connectOnUseEventHandler,
	/*=====
	onMouseUp: function(event){
		// summary: 
		//	Connect to this function to receive notifications of when the mouse button is released.
		//	event: mouse Event
	},
	=====*/

	// Constants used in templates
	_blankGif: (dojo.config.blankGif || dojo.moduleUrl("dojo", "resources/blank.gif")),

	//////////// INITIALIZATION METHODS ///////////////////////////////////////

	postscript: function(/*Object?*/params, /*DomNode|String*/srcNodeRef){
		// summary: kicks off widget instantiation, see create() for details.
		this.create(params, srcNodeRef);
	},

	create: function(/*Object?*/params, /*DomNode|String?*/srcNodeRef){
		//	summary:
		//		Kick off the life-cycle of a widget
		//	params:
		//		Hash of initialization parameters for widget, including
		//		scalar values (like title, duration etc.) and functions,
		//		typically callbacks like onClick.
		//	srcNodeRef:
		//		If a srcNodeRef (dom node) is specified:
		//			- use srcNodeRef.innerHTML as my contents
		//			- if this is a behavioral widget then apply behavior
		//			  to that srcNodeRef 
		//			- otherwise, replace srcNodeRef with my generated DOM
		//			  tree
		//	description:
		//		To understand the process by which widgets are instantiated, it
		//		is critical to understand what other methods create calls and
		//		which of them you'll want to override. Of course, adventurous
		//		developers could override create entirely, but this should
		//		only be done as a last resort.
		//
		//		Below is a list of the methods that are called, in the order
		//		they are fired, along with notes about what they do and if/when
		//		you should over-ride them in your widget:
		//
		// * postMixInProperties:
		//	|	* a stub function that you can over-ride to modify
		//		variables that may have been naively assigned by
		//		mixInProperties
		// * widget is added to manager object here
		// * buildRendering:
		//	|	* Subclasses use this method to handle all UI initialization
		//		Sets this.domNode.  Templated widgets do this automatically
		//		and otherwise it just uses the source dom node.
		// * postCreate:
		//	|	* a stub function that you can over-ride to modify take
		//		actions once the widget has been placed in the UI

		// store pointer to original dom tree
		this.srcNodeRef = dojo.byId(srcNodeRef);

		// For garbage collection.  An array of handles returned by Widget.connect()
		// Each handle returned from Widget.connect() is an array of handles from dojo.connect()
		this._connects = [];

		// To avoid double-connects, remove entries from _deferredConnects
		// that have been setup manually by a subclass (ex, by dojoAttachEvent).
		// If a subclass has redefined a callback (ex: onClick) then assume it's being
		// connected to manually.
		this._deferredConnects = dojo.clone(this._deferredConnects);
		for(var attr in this.attributeMap){
			delete this._deferredConnects[attr]; // can't be in both attributeMap and _deferredConnects
		}
		for(attr in this._deferredConnects){
			if(this[attr] !== dijit._connectOnUseEventHandler){
				delete this._deferredConnects[attr];	// redefined, probably dojoAttachEvent exists
			}
		}

		//mixin our passed parameters
		if(this.srcNodeRef && (typeof this.srcNodeRef.id == "string")){ this.id = this.srcNodeRef.id; }
		if(params){
			this.params = params;
			dojo.mixin(this,params);
		}
		this.postMixInProperties();

		// generate an id for the widget if one wasn't specified
		// (be sure to do this before buildRendering() because that function might
		// expect the id to be there.)
		if(!this.id){
			this.id = dijit.getUniqueId(this.declaredClass.replace(/\./g,"_"));
		}
		dijit.registry.add(this);

		this.buildRendering();

		if(this.domNode){
			// Copy attributes listed in attributeMap into the [newly created] DOM for the widget.
			this._applyAttributes();

			// If the developer has specified a handler as a widget parameter
			// (ex: new Button({onClick: ...})
			// then naturally need to connect from dom node to that handler immediately, 
			for(attr in this.params){
				this._onConnect(attr);
			}
		}
		
		if(this.domNode){
			this.domNode.setAttribute("widgetId", this.id);
		}
		this.postCreate();

		// If srcNodeRef has been processed and removed from the DOM (e.g. TemplatedWidget) then delete it to allow GC.
		if(this.srcNodeRef && !this.srcNodeRef.parentNode){
			delete this.srcNodeRef;
		}	

		this._created = true;
	},

	_applyAttributes: function(){
		// summary:
		//		Step during widget creation to copy all widget attributes to the
		//		DOM as per attributeMap and _setXXXAttr functions.
		// description:
		//		Skips over blank/false attribute values, unless they were explicitly specified
		//		as parameters to the widget, since those are the default anyway,
		//		and setting tabIndex="" is different than not setting tabIndex at all.
		//
		//		It processes the attributes in the attribute map first, ant then
		//		it goes through and processes the attributes for the _setXXXAttr
		//		functions that have been specified
		var condAttrApply = function(attr, scope){
			if( (scope.params && attr in scope.params) || scope[attr]){
				scope.attr(attr, scope[attr]);
			}
		};
		for(var attr in this.attributeMap){
			condAttrApply(attr, this);
		}
		dojo.forEach(getAttrReg(this.declaredClass), function(a){
			if(!(a in this.attributeMap)){
				condAttrApply(a, this);
			}
		}, this);
	},

	postMixInProperties: function(){
		// summary:
		//		Called after the parameters to the widget have been read-in,
		//		but before the widget template is instantiated. Especially
		//		useful to set properties that are referenced in the widget
		//		template.
	},

	buildRendering: function(){
		// summary:
		//		Construct the UI for this widget, setting this.domNode.  Most
		//		widgets will mixin dijit._Templated, which implements this
		//		method.
		this.domNode = this.srcNodeRef || dojo.doc.createElement('div');
	},

	postCreate: function(){
		// summary:
		//		Called after a widget's dom has been setup
	},

	startup: function(){
		// summary:
		//		Called after a widget's children, and other widgets on the page, have been created.
		//		Provides an opportunity to manipulate any children before they are displayed.
		//		This is useful for composite widgets that need to control or layout sub-widgets.
		//		Many layout widgets can use this as a wiring phase.
		this._started = true;
	},

	//////////// DESTROY FUNCTIONS ////////////////////////////////

	destroyRecursive: function(/*Boolean?*/ preserveDom){
		// summary:
		// 		Destroy this widget and it's descendants. This is the generic
		// 		"destructor" function that all widget users should call to
		// 		cleanly discard with a widget. Once a widget is destroyed, it's
		// 		removed from the manager object.
		// preserveDom:
		//		If true, this method will leave the original Dom structure
		//		alone of descendant Widgets. Note: This will NOT work with
		//		dijit._Templated widgets.
		//
		this.destroyDescendants(preserveDom);
		this.destroy(preserveDom);
	},

	destroy: function(/*Boolean*/ preserveDom){
		// summary:
		// 		Destroy this widget, but not its descendants.
		//		Will, however, destroy internal widgets such as those used within a template.
		// preserveDom: Boolean
		//		If true, this method will leave the original Dom structure alone.
		//		Note: This will not yet work with _Templated widgets

		this.uninitialize();
		dojo.forEach(this._connects, function(array){
			dojo.forEach(array, dojo.disconnect);
		});

		// destroy widgets created as part of template, etc.
		dojo.forEach(this._supportingWidgets||[], function(w){ 
			if(w.destroy){
				w.destroy();
			}
		});
		
		this.destroyRendering(preserveDom);
		dijit.registry.remove(this.id);
	},

	destroyRendering: function(/*Boolean?*/ preserveDom){
		// summary:
		//		Destroys the DOM nodes associated with this widget
		// preserveDom:
		//		If true, this method will leave the original Dom structure alone
		//		during tear-down. Note: this will not work with _Templated
		//		widgets yet. 
		
		if(this.bgIframe){
			this.bgIframe.destroy(preserveDom);
			delete this.bgIframe;
		}

		if(this.domNode){
			if(!preserveDom){
				dojo._destroyElement(this.domNode);
			}
			delete this.domNode;
		}

		if(this.srcNodeRef){
			if(!preserveDom){
				dojo._destroyElement(this.srcNodeRef);
			}
			delete this.srcNodeRef;
		}
	},

	destroyDescendants: function(/*Boolean?*/ preserveDom){
		// summary:
		//		Recursively destroy the children of this widget and their
		//		descendants.
		// preserveDom:
		//		If true, the preserveDom attribute is passed to all descendant
		//		widget's .destroy() method. Not for use with _Templated
		//		widgets.

		// get all direct descendants and destroy them recursively
		dojo.forEach(this.getDescendants(true), function(widget){ 
			if(widget.destroyRecursive){
				widget.destroyRecursive(preserveDom);
			}
		});
	},


	uninitialize: function(){
		// summary:
		//		stub function. Override to implement custom widget tear-down
		//		behavior.
		return false;
	},

	////////////////// MISCELLANEOUS METHODS ///////////////////

	onFocus: function(){
		// summary:
		//		stub function. Override or connect to this method to receive
		//		notifications for when the widget moves into focus.
	},

	onBlur: function(){
		// summary:
		//		stub function. Override or connect to this method to receive
		//		notifications for when the widget moves out of focus.
	},

	_onFocus: function(e){
		this.onFocus();
	},

	_onBlur: function(){
		this.onBlur();
	},

	_onConnect: function(/*String*/ event){
		// summary:
		//		Called when someone connects to one of my handlers.
		//		"Turn on" that handler if it isn't active yet.
		if(event in this._deferredConnects){
			var mapNode = this[this._deferredConnects[event]||'domNode'];
			this.connect(mapNode, event.toLowerCase(), this[event]);
			delete this._deferredConnects[event];
		}
	},

	_setClassAttr: function(/*String*/ value){
		var mapNode = this[this.attributeMap["class"]||'domNode'];
		dojo.removeClass(mapNode, this["class"])
		this["class"] = value;
		dojo.addClass(mapNode, value);
	},

	_setStyleAttr: function(/*String*/ value){
		var mapNode = this[this.attributeMap["style"]||'domNode'];
		if(mapNode.style.cssText){
			// TODO: remove old value
			mapNode.style.cssText += "; " + value; // FIXME: Opera
		}else{
			mapNode.style.cssText = value;
		}
		this["style"] = value;
	},

	setAttribute: function(/*String*/ attr, /*anything*/ value){
		dojo.deprecated(this.declaredClass+"::setAttribute() is deprecated. Use attr() instead.", "", "2.0");
		this.attr(attr, value);
	},
	
	_attrToDom: function(/*String*/ attr, /*String*/ value){
		//	summary:
		//		Reflect a widget attribute (title, tabIndex, duration etc.) to
		//		the widget DOM, as specified in attributeMap.
		//
		//	description:
		//		Also sets this["attr"] to the new value.
		//		Note some attributes like "type"
		//		cannot be processed this way as they are not mutable.

		var commands = this.attributeMap[attr];
		dojo.forEach( dojo.isArray(commands) ? commands : [commands], function(command){

			// Get target node and what we are doing to that node
			var mapNode = this[command.node || command || "domNode"];	// DOM node
			var type = command.type || "attribute";	// class, innerHTML, or attribute
	
			switch(type){
				case "attribute":
					if(dojo.isFunction(value)){ // functions execute in the context of the widget
						value = dojo.hitch(this, value);
					}
					if(/^on[A-Z][a-zA-Z]*$/.test(attr)){ // eg. onSubmit needs to be onsubmit
						attr = attr.toLowerCase();
					}
					dojo.attr(mapNode, attr, value);
					break;
				case "innerHTML":
					mapNode.innerHTML = value;
					break;
				case "class":
					dojo.removeClass(mapNode, this[attr]);
					dojo.addClass(mapNode, value);
					break;
			}
		}, this);
		this[attr] = value;
	},

	attr: function(/*String|Object*/name, /*Object?*/value){
		//	summary:
		//		Set or get properties on a widget instance.
		//	name:
		//		The property to get or set. If an object is passed here and not
		//		a string, its keys are used as names of attributes to be set
		//		and the value of the object as values to set in the widget.
		//	value:
		//		Optional. If provided, attr() operates as a setter. If omitted,
		//		the current value of the named property is returned.
		//	description:
		//		Get or set named properties on a widget. If no value is
		//		provided, the current value of the attribute is returned,
		//		potentially via a getter method. If a value is provided, then
		//		the method acts as a setter, assigning the value to the name,
		//		potentially calling any explicitly provided setters to handle
		//		the operation. For instance, if the widget has properties "foo"
		//		and "bar" and a method named "_setFooAttr", calling:
		//	|	myWidget.attr("foo", "Howdy!");
		//		would be equivalent to calling:
		//	|	widget._setFooAttr("Howdy!");
		//		while calling:
		//	|	myWidget.attr("bar", "Howdy!");
		//		would be the same as writing:
		//	|	widget.bar = "Howdy!";
		//		It also tries to copy the changes to the widget's DOM according
		//		to settings in attributeMap (see description of attributeMap
		//		for details)
		//		For example, calling:
		//	|	myTitlePane.attr("title", "Howdy!");
		//		will do
		//	|	myTitlePane.title = "Howdy!";
		//	|	myTitlePane.title.innerHTML = "Howdy!";
		//		It works for dom node attributes too.  Calling
		//	|	widget.attr("disabled", true)
		//		will set the disabled attribute on the widget's focusNode,
		//		among other housekeeping for a change in disabled state.

		//	open questions:
		//		- how to handle build shortcut for attributes which want to map
		//		into DOM attributes?
		//		- what relationship should setAttribute()/attr() have to
		//		layout() calls?
		var args = arguments.length;
		if(args == 1 && !dojo.isString(name)){
			for(var x in name){ this.attr(x, name[x]); }
			return this;
		}
		var names = this._getAttrNames(name);
		if(args == 2){ // setter
			if(this[names.s]){
				// use the explicit setter
				return this[names.s](value) || this;
			}else{
				// if param is specified as DOM node attribute, copy it
				if(name in this.attributeMap){
					this._attrToDom(name, value);
				}

				// FIXME: what about function assignments? Any way to connect() here?
				this[name] = value;
			}
			return this;
		}else{ // getter
			if(this[names.g]){
				return this[names.g]();
			}else{
				return this[name];
			}
		}
	},

	_attrPairNames: {},		// shared between all widgets
	_getAttrNames: function(name){
		// summary: helper function for Widget.attr()
		// cache attribute name values so we don't do the string ops every time
		var apn = this._attrPairNames;
		if(apn[name]){ return apn[name]; }
		var uc = name.charAt(0).toUpperCase() + name.substr(1);
		return apn[name] = {
			n: name+"Node",
			s: "_set"+uc+"Attr",
			g: "_get"+uc+"Attr"
		};
	},

	toString: function(){
		// summary:
		//		returns a string that represents the widget. When a widget is
		//		cast to a string, this method will be used to generate the
		//		output. Currently, it does not implement any sort of reversable
		//		serialization.
		return '[Widget ' + this.declaredClass + ', ' + (this.id || 'NO ID') + ']'; // String
	},

	getDescendants: function(/*Boolean*/ directOnly, /*DomNode[]?*/ outAry){
		// summary:
		//		Returns all the widgets contained by this, i.e., all widgets underneath this.containerNode.
		// description:
		//		For example w/this markup:
		//
		//		|	<div dojoType=myWidget>
		//		|		<b> hello world </b>
		//		|		<div>
		//		|			<span dojoType=subwidget>
		//		|				<span dojoType=subwidget2>how's it going?</span>
		//		|			</span>
		//		|		</div>
		//		|	</div>
		//
		//		myWidget.getDescendants() will return subwidget and subwidget2.
		//
		//		This method is designed to *not* return widgets that are
		//		part of a widget's template, but rather to just return widgets that are defined in the
		//		original markup as descendants of this widget.
		// directOnly:
		//		If directOnly is true then won't find nested widgets (subwidget2 in above example)
		// outAry:
		//		If specified, put results in here
		outAry = outAry || [];
		if(this.containerNode){
			this._getDescendantsHelper(directOnly, outAry, this.containerNode);
		}
		return outAry;
	},
	_getDescendantsHelper: function(/*Boolean*/ directOnly, /* DomNode[] */ outAry, /*DomNode*/ root){
		// summary:
		//		Search subtree under root, putting found widgets in outAry
		// directOnly:
		//		If false, return widgets nested inside other widgets
		var list = dojo.isIE ? root.children : root.childNodes, i = 0, node;
		while(node = list[i++]){
			if(node.nodeType != 1){ continue; }
			var widgetId = node.getAttribute("widgetId");
			if(widgetId){
				var widget = dijit.byId(widgetId);
				outAry.push(widget);
				if(!directOnly){
					widget.getDescendants(directOnly, outAry);
				}
			}else{
				this._getDescendantsHelper(directOnly, outAry, node);
			}
		}
	},

	// TODOC
	nodesWithKeyClick: ["input", "button"],

	connect: function(
			/*Object|null*/ obj,
			/*String|Function*/ event,
			/*String|Function*/ method){
		//	summary:
		//		Connects specified obj/event to specified method of this object
		//		and registers for disconnect() on widget destroy.
		//	description:
		//		Provide widget-specific analog to dojo.connect, except with the
		//		implicit use of this widget as the target object.
		//		This version of connect also provides a special "ondijitclick"
		//		event which triggers on a click or space-up, enter-down in IE
		//		or enter press in FF (since often can't cancel enter onkeydown
		//		in FF)
		//	example:
		//	|	var btn = new dijit.form.Button();
		//	|	// when foo.bar() is called, call the listener we're going to
		//	|	// provide in the scope of btn
		//	|	btn.connect(foo, "bar", function(){ 
		//	|		console.debug(this.toString());
		//	|	});

		var d = dojo;
		var dco = d.hitch(d, "connect", obj);
		var handles =[];
		if(event == "ondijitclick"){
			// add key based click activation for unsupported nodes.
			if(!this.nodesWithKeyClick[obj.nodeName]){
				var m = d.hitch(this, method);
				handles.push(
					dco("onkeydown", this, function(e){
						if(!d.isFF && e.keyCode == d.keys.ENTER){
							return m(e);
						}else if(e.keyCode == d.keys.SPACE){
							// stop space down as it causes IE to scroll
							// the browser window
							d.stopEvent(e);
						}
			 		}),
					dco("onkeyup", this, function(e){
						if(e.keyCode == d.keys.SPACE){ return m(e); }
					})
				);
			 	if(d.isFF){
					handles.push(
						dco("onkeypress", this, function(e){
							if(e.keyCode == d.keys.ENTER){ return m(e); }
						})
					);
			 	}
			}
			event = "onclick";
		}
		handles.push(dco(event, this, method));

		// return handles for FormElement and ComboBox
		this._connects.push(handles);
		return handles;
	},

	disconnect: function(/*Object*/ handles){
		// summary:
		//		Disconnects handle created by this.connect.
		//		Also removes handle from this widget's list of connects
		for(var i=0; i<this._connects.length; i++){
			if(this._connects[i]==handles){
				dojo.forEach(handles, dojo.disconnect);
				this._connects.splice(i, 1);
				return;
			}
		}
	},

	isLeftToRight: function(){
		// summary:
		//		Checks the page for text direction
		return dojo._isBodyLtr(); //Boolean
	},

	isFocusable: function(){
		// summary:
		//		Return true if this widget can currently be focused
		//		and false if not
		return this.focus && (dojo.style(this.domNode, "display") != "none");
	},
	
	placeAt: function(/* String|DomNode|_Widget */reference, /* String?|Int? */position){
		// summary: Place this widget's domNode reference somewhere in the DOM based
		//		on standard dojo.place conventions, or passing a Widget reference that
		//		contains and addChild member.
		//
		// description:
		//		A convenience function provided in all _Widgets, providing a simple
		//		shorthand mechanism to put an existing (or newly created) Widget
		//		somewhere in the dom, and allow chaining.
		//
		//	reference: 
		//		The String id of a domNode, a domNode reference, or a reference to a Widget posessing 
		//		an addChild method.
		//
		//	position: 
		//		If passed a string or domNode reference, the position argument
		//		accepts a string just as dojo.place does, one of: "first", "last", 
		//		"before", or "after". 
		//
		//		If passed a _Widget reference, and that widget reference has an ".addChild" method, 
		//		it will be called passing this widget instance into that method, supplying the optional
		//		position index passed.
		//
		// example:
		// | 	// create a Button with no srcNodeRef, and place it in the body:
		// | 	var button = new dijit.form.Button({ label:"click" }).placeAt(dojo.body());
		// | 	// now, 'button' is still the widget reference to the newly created button
		// | 	dojo.connect(button, "onClick", function(e){ console.log('click'); });
		//
		// example:
		// |	// create a button out of a node with id="src" and append it to id="wrapper":
		// | 	var button = new dijit.form.Button({},"src").placeAt("wrapper");
		//
		// example:
		// |	// place a new button as the first element of some div
		// |	var button = new dijit.form.Button({ label:"click" }).placeAt("wrapper","first");
		//
		// example: 
		// |	// create a contentpane and add it to a TabContainer
		// |	var tc = dijit.byId("myTabs");
		// |	new dijit.layout.ContentPane({ href:"foo.html", title:"Wow!" }).placeAt(tc)

		if(reference["declaredClass"] && reference["addChild"]){
			reference.addChild(this, position);
		}else{
			dojo.place(this.domNode, reference, position);
		}
		return this;
	}

});

})();

}

if(!dojo._hasResource["dojox.collections._base"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.collections._base"] = true;
dojo.provide("dojox.collections._base");

dojox.collections.DictionaryEntry=function(/* string */k, /* object */v){
	//	summary
	//	return an object of type dojox.collections.DictionaryEntry
	this.key=k;
	this.value=v;
	this.valueOf=function(){ 
		return this.value; 	//	object
	};
	this.toString=function(){ 
		return String(this.value);	//	string 
	};
}

/*	Iterators
 *	The collections.Iterators (Iterator and DictionaryIterator) are built to
 *	work with the Collections included in this module.  However, they *can*
 *	be used with arrays and objects, respectively, should one choose to do so.
 */
dojox.collections.Iterator=function(/* array */arr){
	//	summary
	//	return an object of type dojox.collections.Iterator
	var a=arr;
	var position=0;
	this.element=a[position]||null;
	this.atEnd=function(){
		//	summary
		//	Test to see if the internal cursor has reached the end of the internal collection.
		return (position>=a.length);	//	bool
	};
	this.get=function(){
		//	summary
		//	Get the next member in the collection.
		if(this.atEnd()){
			return null;		//	object
		}
		this.element=a[position++];
		return this.element;	//	object
	};
	this.map=function(/* function */fn, /* object? */scope){
		//	summary
		//	Functional iteration with optional scope.
		return dojo.map(a, fn, scope);
	};
	this.reset=function(){
		//	summary
		//	reset the internal cursor.
		position=0;
		this.element=a[position];
	};
}

/*	Notes:
 *	The DictionaryIterator no longer supports a key and value property;
 *	the reality is that you can use this to iterate over a JS object
 *	being used as a hashtable.
 */
dojox.collections.DictionaryIterator=function(/* object */obj){
	//	summary
	//	return an object of type dojox.collections.DictionaryIterator
	var a=[];	//	Create an indexing array
	var testObject={};
	for(var p in obj){
		if(!testObject[p]){
			a.push(obj[p]);	//	fill it up
		}
	}
	var position=0;
	this.element=a[position]||null;
	this.atEnd=function(){
		//	summary
		//	Test to see if the internal cursor has reached the end of the internal collection.
		return (position>=a.length);	//	bool
	};
	this.get=function(){
		//	summary
		//	Get the next member in the collection.
		if(this.atEnd()){
			return null;		//	object
		}
		this.element=a[position++];
		return this.element;	//	object
	};
	this.map=function(/* function */fn, /* object? */scope){
		//	summary
		//	Functional iteration with optional scope.
		return dojo.map(a, fn, scope);
	};
	this.reset=function() { 
		//	summary
		//	reset the internal cursor.
		position=0; 
		this.element=a[position];
	};
};

}

if(!dojo._hasResource["dojox.collections.Dictionary"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.collections.Dictionary"] = true;
dojo.provide("dojox.collections.Dictionary");


dojox.collections.Dictionary=function(/* dojox.collections.Dictionary? */dictionary){
	//	summary
	//	Returns an object of type dojox.collections.Dictionary
	var items={};
	this.count=0;

	//	comparator for property addition and access.
	var testObject={};

	this.add=function(/* string */k, /* object */v){
		//	summary
		//	Add a new item to the Dictionary.
		var b=(k in items);
		items[k]=new dojox.collections.DictionaryEntry(k,v);
		if(!b){
			this.count++;
		}
	};
	this.clear=function(){
		//	summary
		//	Clears the internal dictionary.
		items={};
		this.count=0;
	};
	this.clone=function(){
		//	summary
		//	Returns a new instance of dojox.collections.Dictionary; note the the dictionary is a clone but items might not be.
		return new dojox.collections.Dictionary(this);	//	dojox.collections.Dictionary
	};
	this.contains=this.containsKey=function(/* string */k){
		//	summary
		//	Check to see if the dictionary has an entry at key "k".
		if(testObject[k]){
			return false;			// bool
		}
		return (items[k]!=null);	//	bool
	};
	this.containsValue=function(/* object */v){
		//	summary
		//	Check to see if the dictionary has an entry with value "v".
		var e=this.getIterator();
		while(e.get()){
			if(e.element.value==v){
				return true;	//	bool
			}
		}
		return false;	//	bool
	};
	this.entry=function(/* string */k){
		//	summary
		//	Accessor method; similar to dojox.collections.Dictionary.item but returns the actual Entry object.
		return items[k];	//	dojox.collections.DictionaryEntry
	};
	this.forEach=function(/* function */ fn, /* object? */ scope){
		//	summary
		//	functional iterator, following the mozilla spec.
		var a=[];	//	Create an indexing array
		for(var p in items) {
			if(!testObject[p]){
				a.push(items[p]);	//	fill it up
			}
		}
		dojo.forEach(a, fn, scope);
	};
	this.getKeyList=function(){
		//	summary
		//	Returns an array of the keys in the dictionary.
		return (this.getIterator()).map(function(entry){ 
			return entry.key; 
		});	//	array
	};
	this.getValueList=function(){
		//	summary
		//	Returns an array of the values in the dictionary.
		return (this.getIterator()).map(function(entry){ 
			return entry.value; 
		});	//	array
	};
	this.item=function(/* string */k){
		//	summary
		//	Accessor method.
		if(k in items){
			return items[k].valueOf();	//	object
		}
		return undefined;	//	object
	};
	this.getIterator=function(){
		//	summary
		//	Gets a dojox.collections.DictionaryIterator for iteration purposes.
		return new dojox.collections.DictionaryIterator(items);	//	dojox.collections.DictionaryIterator
	};
	this.remove=function(/* string */k){
		//	summary
		//	Removes the item at k from the internal collection.
		if(k in items && !testObject[k]){
			delete items[k];
			this.count--;
			return true;	//	bool
		}
		return false;	//	bool
	};

	if (dictionary){
		var e=dictionary.getIterator();
		while(e.get()) {
			 this.add(e.element.key, e.element.value);
		}
	}
};

}

if(!dojo._hasResource["dojox.data.dom"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.data.dom"] = true;
dojo.provide("dojox.data.dom");

//DOM type to int value for reference.
//Ints make for more compact code than full constant names.
//ELEMENT_NODE                  = 1;
//ATTRIBUTE_NODE                = 2;
//TEXT_NODE                     = 3;
//CDATA_SECTION_NODE            = 4;
//ENTITY_REFERENCE_NODE         = 5;
//ENTITY_NODE                   = 6;
//PROCESSING_INSTRUCTION_NODE   = 7;
//COMMENT_NODE                  = 8;
//DOCUMENT_NODE                 = 9;
//DOCUMENT_TYPE_NODE            = 10;
//DOCUMENT_FRAGMENT_NODE        = 11;
//NOTATION_NODE                 = 12;

//FIXME:  Remove this file when possible.
//This file contains internal/helper APIs as holders until the true DOM apis of Dojo 0.9 are finalized.
//Therefore, these should not be generally used, they are present only for the use by XmlStore and the
//wires project until proper dojo replacements are available.  When such exist, XmlStore and the like
//will be ported off these and this file will be deleted.
dojo.experimental("dojox.data.dom");

dojox.data.dom.createDocument = function(/*string?*/ str, /*string?*/ mimetype){
	//	summary:
	//		cross-browser implementation of creating an XML document object.
	//
	//	str:
	//		Optional text to create the document from.  If not provided, an empty XML document will be created.  
	//		If str is empty string "", then a new empty document will be created.
	//	mimetype:
	//		Optional mimetype of the text.  Typically, this is text/xml.  Will be defaulted to text/xml if not provided.
	var _document = dojo.doc;

	if(!mimetype){ mimetype = "text/xml"; }
	if(str && dojo.trim(str) !== "" && (typeof dojo.global["DOMParser"]) !== "undefined"){
		var parser = new DOMParser();
		return parser.parseFromString(str, mimetype);	//	DOMDocument
	}else if((typeof dojo.global["ActiveXObject"]) !== "undefined"){
		var sf = [".DOMDocument", ".XMLDOM"];
		var dp = ["Microsoft"+sf[1], "MSXML6"+sf[0], "MSXML4"+sf[0], "MSXML3"+sf[0], "MSXML2"+sf[0]];
		var doc;
		dojo.some(dp, function(p){
			try{
				doc = new ActiveXObject(p);
			}catch(e){ return false; }
			return true;
		});
		try{
			if(str){
				if(doc){
					doc.async = false;
					doc.loadXML(str);
					return doc;	//	DOMDocument
				}
			}else{
				if(doc){
					return doc; //DOMDocument
				}
			}
		}catch(e){ /* squelch */};
	}else if((_document.implementation)&&
		(_document.implementation.createDocument)){
		if(str && dojo.trim(str) !== ""){
			if(_document.createElement){
				// FIXME: this may change all tags to uppercase!
				var tmp = _document.createElement("xml");
				tmp.innerHTML = str;
				var xmlDoc = _document.implementation.createDocument("foo", "", null);
				for(var i = 0; i < tmp.childNodes.length; i++) {
					xmlDoc.importNode(tmp.childNodes.item(i), true);
				}
				return xmlDoc;	//	DOMDocument
			}
		}else{
			return _document.implementation.createDocument("", "", null); // DOMDocument
		}
	}
	return null;	//	DOMDocument
}

dojox.data.dom.textContent = function(/*Node*/node, /*string?*/text){
	//	summary:
	//		Implementation of the DOM Level 3 attribute; scan node for text
	//	description:
	//		Implementation of the DOM Level 3 attribute; scan node for text
	//		This function can also update the text of a node by replacing all child 
	//		content of the node.
	//	node:
	//		The node to get the text off of or set the text on.
	//	text:
	//		Optional argument of the text to apply to the node.
	if(arguments.length>1){
		var _document = node.ownerDocument || dojo.doc;  //Preference is to get the node owning doc first or it may fail
		dojox.data.dom.replaceChildren(node, _document.createTextNode(text));
		return text;	//	string
	} else {
		if(node.textContent !== undefined){ //FF 1.5
			return node.textContent;	//	string
		}
		var _result = "";
		if(node == null){
			return _result; //empty string.
		}
		for(var i = 0; i < node.childNodes.length; i++){
			switch(node.childNodes[i].nodeType){
				case 1: // ELEMENT_NODE
				case 5: // ENTITY_REFERENCE_NODE
					_result += dojox.data.dom.textContent(node.childNodes[i]);
					break;
				case 3: // TEXT_NODE
				case 2: // ATTRIBUTE_NODE
				case 4: // CDATA_SECTION_NODE
					_result += node.childNodes[i].nodeValue;
					break;
				default:
					break;
			}
		}
		return _result;	//	string
	}
}

dojox.data.dom.replaceChildren = function(/*Element*/node, /*Node || array*/ newChildren){
	//	summary:
	//		Removes all children of node and appends newChild. All the existing
	//		children will be destroyed.
	//	description:
	//		Removes all children of node and appends newChild. All the existing
	//		children will be destroyed.
	// 	node:
	//		The node to modify the children on
	//	newChildren:
	//		The children to add to the node.  It can either be a single Node or an
	//		array of Nodes.
	var nodes = [];
	var i;
	
	if(dojo.isIE){
		for(i=0;i<node.childNodes.length;i++){
			nodes.push(node.childNodes[i]);
		}
	}

	dojox.data.dom.removeChildren(node);
	for(i=0;i<nodes.length;i++){
		dojo._destroyElement(nodes[i]);
	}

	if(!dojo.isArray(newChildren)){
		node.appendChild(newChildren);
	}else{
		for(i=0;i<newChildren.length;i++){
			node.appendChild(newChildren[i]);
		}
	}
}

dojox.data.dom.removeChildren = function(/*Element*/node){
	//	summary:
	//		removes all children from node and returns the count of children removed.
	//		The children nodes are not destroyed. Be sure to call dojo._destroyElement on them
	//		after they are not used anymore.
	//	node:
	//		The node to remove all the children from.
	var count = node.childNodes.length;
	while(node.hasChildNodes()){
		node.removeChild(node.firstChild);
	}
	return count; // int
}


dojox.data.dom.innerXML = function(/*Node*/node){
	//	summary:
	//		Implementation of MS's innerXML function.
	//	node:
	//		The node from which to generate the XML text representation.
	if(node.innerXML){
		return node.innerXML;	//	string
	}else if (node.xml){
		return node.xml;		//	string
	}else if(typeof XMLSerializer != "undefined"){
		return (new XMLSerializer()).serializeToString(node);	//	string
	}
	return null;
}


}

if(!dojo._hasResource["dojo.regexp"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.regexp"] = true;
dojo.provide("dojo.regexp");

/*=====
dojo.regexp = {
	// summary: Regular expressions and Builder resources
};
=====*/

dojo.regexp.escapeString = function(/*String*/str, /*String?*/except){
	//	summary:
	//		Adds escape sequences for special characters in regular expressions
	// except:
	//		a String with special characters to be left unescaped

//	return str.replace(/([\f\b\n\t\r[\^$|?*+(){}])/gm, "\\$1"); // string
	return str.replace(/([\.$?*|{}\(\)\[\]\\\/^])/g, function(ch){
		if(except && except.indexOf(ch) != -1){
			return ch;
		}
		return "\\" + ch;
	}); // String
}

dojo.regexp.buildGroupRE = function(/*Object|Array*/arr, /*Function*/re, /*Boolean?*/nonCapture){
	//	summary:
	//		Builds a regular expression that groups subexpressions
	//	description:
	//		A utility function used by some of the RE generators. The
	//		subexpressions are constructed by the function, re, in the second
	//		parameter.  re builds one subexpression for each elem in the array
	//		a, in the first parameter. Returns a string for a regular
	//		expression that groups all the subexpressions.
	// arr:
	//		A single value or an array of values.
	// re:
	//		A function. Takes one parameter and converts it to a regular
	//		expression. 
	// nonCapture:
	//		If true, uses non-capturing match, otherwise matches are retained
	//		by regular expression. Defaults to false

	// case 1: a is a single value.
	if(!(arr instanceof Array)){
		return re(arr); // String
	}

	// case 2: a is an array
	var b = [];
	for(var i = 0; i < arr.length; i++){
		// convert each elem to a RE
		b.push(re(arr[i]));
	}

	 // join the REs as alternatives in a RE group.
	return dojo.regexp.group(b.join("|"), nonCapture); // String
}

dojo.regexp.group = function(/*String*/expression, /*Boolean?*/nonCapture){
	// summary:
	//		adds group match to expression
	// nonCapture:
	//		If true, uses non-capturing match, otherwise matches are retained
	//		by regular expression. 
	return "(" + (nonCapture ? "?:":"") + expression + ")"; // String
}

}

if(!dojo._hasResource["dojo.i18n"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.i18n"] = true;
dojo.provide("dojo.i18n");

/*=====
dojo.i18n = {
	// summary: Utility classes to enable loading of resources for internationalization (i18n)
};
=====*/

dojo.i18n.getLocalization = function(/*String*/packageName, /*String*/bundleName, /*String?*/locale){
	//	summary:
	//		Returns an Object containing the localization for a given resource
	//		bundle in a package, matching the specified locale.
	//	description:
	//		Returns a hash containing name/value pairs in its prototypesuch
	//		that values can be easily overridden.  Throws an exception if the
	//		bundle is not found.  Bundle must have already been loaded by
	//		`dojo.requireLocalization()` or by a build optimization step.  NOTE:
	//		try not to call this method as part of an object property
	//		definition (`var foo = { bar: dojo.i18n.getLocalization() }`).  In
	//		some loading situations, the bundle may not be available in time
	//		for the object definition.  Instead, call this method inside a
	//		function that is run after all modules load or the page loads (like
	//		in `dojo.addOnLoad()`), or in a widget lifecycle method.
	//	packageName:
	//		package which is associated with this resource
	//	bundleName:
	//		the base filename of the resource bundle (without the ".js" suffix)
	//	locale:
	//		the variant to load (optional).  By default, the locale defined by
	//		the host environment: dojo.locale

	locale = dojo.i18n.normalizeLocale(locale);

	// look for nearest locale match
	var elements = locale.split('-');
	var module = [packageName,"nls",bundleName].join('.');
	var bundle = dojo._loadedModules[module];
	if(bundle){
		var localization;
		for(var i = elements.length; i > 0; i--){
			var loc = elements.slice(0, i).join('_');
			if(bundle[loc]){
				localization = bundle[loc];
				break;
			}
		}
		if(!localization){
			localization = bundle.ROOT;
		}

		// make a singleton prototype so that the caller won't accidentally change the values globally
		if(localization){
			var clazz = function(){};
			clazz.prototype = localization;
			return new clazz(); // Object
		}
	}

	throw new Error("Bundle not found: " + bundleName + " in " + packageName+" , locale=" + locale);
};

dojo.i18n.normalizeLocale = function(/*String?*/locale){
	//	summary:
	//		Returns canonical form of locale, as used by Dojo.
	//
	//  description:
	//		All variants are case-insensitive and are separated by '-' as specified in [RFC 3066](http://www.ietf.org/rfc/rfc3066.txt).
	//		If no locale is specified, the dojo.locale is returned.  dojo.locale is defined by
	//		the user agent's locale unless overridden by djConfig.

	var result = locale ? locale.toLowerCase() : dojo.locale;
	if(result == "root"){
		result = "ROOT";
	}
	return result; // String
};

dojo.i18n._requireLocalization = function(/*String*/moduleName, /*String*/bundleName, /*String?*/locale, /*String?*/availableFlatLocales){
	//	summary:
	//		See dojo.requireLocalization()
	//	description:
	// 		Called by the bootstrap, but factored out so that it is only
	// 		included in the build when needed.

	var targetLocale = dojo.i18n.normalizeLocale(locale);
 	var bundlePackage = [moduleName, "nls", bundleName].join(".");
	// NOTE: 
	//		When loading these resources, the packaging does not match what is
	//		on disk.  This is an implementation detail, as this is just a
	//		private data structure to hold the loaded resources.  e.g.
	//		`tests/hello/nls/en-us/salutations.js` is loaded as the object
	//		`tests.hello.nls.salutations.en_us={...}` The structure on disk is
	//		intended to be most convenient for developers and translators, but
	//		in memory it is more logical and efficient to store in a different
	//		order.  Locales cannot use dashes, since the resulting path will
	//		not evaluate as valid JS, so we translate them to underscores.
	
	//Find the best-match locale to load if we have available flat locales.
	var bestLocale = "";
	if(availableFlatLocales){
		var flatLocales = availableFlatLocales.split(",");
		for(var i = 0; i < flatLocales.length; i++){
			//Locale must match from start of string.
			//Using ["indexOf"] so customBase builds do not see
			//this as a dojo._base.array dependency.
			if(targetLocale["indexOf"](flatLocales[i]) == 0){
				if(flatLocales[i].length > bestLocale.length){
					bestLocale = flatLocales[i];
				}
			}
		}
		if(!bestLocale){
			bestLocale = "ROOT";
		}		
	}

	//See if the desired locale is already loaded.
	var tempLocale = availableFlatLocales ? bestLocale : targetLocale;
	var bundle = dojo._loadedModules[bundlePackage];
	var localizedBundle = null;
	if(bundle){
		if(dojo.config.localizationComplete && bundle._built){return;}
		var jsLoc = tempLocale.replace(/-/g, '_');
		var translationPackage = bundlePackage+"."+jsLoc;
		localizedBundle = dojo._loadedModules[translationPackage];
	}

	if(!localizedBundle){
		bundle = dojo["provide"](bundlePackage);
		var syms = dojo._getModuleSymbols(moduleName);
		var modpath = syms.concat("nls").join("/");
		var parent;

		dojo.i18n._searchLocalePath(tempLocale, availableFlatLocales, function(loc){
			var jsLoc = loc.replace(/-/g, '_');
			var translationPackage = bundlePackage + "." + jsLoc;
			var loaded = false;
			if(!dojo._loadedModules[translationPackage]){
				// Mark loaded whether it's found or not, so that further load attempts will not be made
				dojo["provide"](translationPackage);
				var module = [modpath];
				if(loc != "ROOT"){module.push(loc);}
				module.push(bundleName);
				var filespec = module.join("/") + '.js';
				loaded = dojo._loadPath(filespec, null, function(hash){
					// Use singleton with prototype to point to parent bundle, then mix-in result from loadPath
					var clazz = function(){};
					clazz.prototype = parent;
					bundle[jsLoc] = new clazz();
					for(var j in hash){ bundle[jsLoc][j] = hash[j]; }
				});
			}else{
				loaded = true;
			}
			if(loaded && bundle[jsLoc]){
				parent = bundle[jsLoc];
			}else{
				bundle[jsLoc] = parent;
			}
			
			if(availableFlatLocales){
				//Stop the locale path searching if we know the availableFlatLocales, since
				//the first call to this function will load the only bundle that is needed.
				return true;
			}
		});
	}

	//Save the best locale bundle as the target locale bundle when we know the
	//the available bundles.
	if(availableFlatLocales && targetLocale != bestLocale){
		bundle[targetLocale.replace(/-/g, '_')] = bundle[bestLocale.replace(/-/g, '_')];
	}
};

(function(){
	// If other locales are used, dojo.requireLocalization should load them as
	// well, by default. 
	// 
	// Override dojo.requireLocalization to do load the default bundle, then
	// iterate through the extraLocale list and load those translations as
	// well, unless a particular locale was requested.

	var extra = dojo.config.extraLocale;
	if(extra){
		if(!extra instanceof Array){
			extra = [extra];
		}

		var req = dojo.i18n._requireLocalization;
		dojo.i18n._requireLocalization = function(m, b, locale, availableFlatLocales){
			req(m,b,locale, availableFlatLocales);
			if(locale){return;}
			for(var i=0; i<extra.length; i++){
				req(m,b,extra[i], availableFlatLocales);
			}
		};
	}
})();

dojo.i18n._searchLocalePath = function(/*String*/locale, /*Boolean*/down, /*Function*/searchFunc){
	//	summary:
	//		A helper method to assist in searching for locale-based resources.
	//		Will iterate through the variants of a particular locale, either up
	//		or down, executing a callback function.  For example, "en-us" and
	//		true will try "en-us" followed by "en" and finally "ROOT".

	locale = dojo.i18n.normalizeLocale(locale);

	var elements = locale.split('-');
	var searchlist = [];
	for(var i = elements.length; i > 0; i--){
		searchlist.push(elements.slice(0, i).join('-'));
	}
	searchlist.push(false);
	if(down){searchlist.reverse();}

	for(var j = searchlist.length - 1; j >= 0; j--){
		var loc = searchlist[j] || "ROOT";
		var stop = searchFunc(loc);
		if(stop){ break; }
	}
};

dojo.i18n._preloadLocalizations = function(/*String*/bundlePrefix, /*Array*/localesGenerated){
	//	summary:
	//		Load built, flattened resource bundles, if available for all
	//		locales used in the page. Only called by built layer files.

	function preload(locale){
		locale = dojo.i18n.normalizeLocale(locale);
		dojo.i18n._searchLocalePath(locale, true, function(loc){
			for(var i=0; i<localesGenerated.length;i++){
				if(localesGenerated[i] == loc){
					dojo["require"](bundlePrefix+"_"+loc);
					return true; // Boolean
				}
			}
			return false; // Boolean
		});
	}
	preload();
	var extra = dojo.config.extraLocale||[];
	for(var i=0; i<extra.length; i++){
		preload(extra[i]);
	}
};

}

if(!dojo._hasResource["dojo.string"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.string"] = true;
dojo.provide("dojo.string");

/*=====
dojo.string = { 
	// summary: String utilities for Dojo
};
=====*/

dojo.string.rep = function(/*String*/str, /*Integer*/num){
	//	summary:
	//		Efficiently replicate a string `n` times.
	//	str:
	//		the string to replicate
	//	num:
	//		number of times to replicate the string
	
	if(num <= 0 || !str){ return ""; }
	
	var buf = [];
	for(;;){
		if(num & 1){
			buf.push(str);
		}
		if(!(num >>= 1)){ break; }
		str += str;
	}
	return buf.join("");	// String
};

dojo.string.pad = function(/*String*/text, /*Integer*/size, /*String?*/ch, /*Boolean?*/end){
	//	summary:
	//		Pad a string to guarantee that it is at least `size` length by
	//		filling with the character `ch` at either the start or end of the
	//		string. Pads at the start, by default.
	//	text:
	//		the string to pad
	//	size:
	//		length to provide padding
	//	ch:
	//		character to pad, defaults to '0'
	//	end:
	//		adds padding at the end if true, otherwise pads at start
	//	example:
	//	|	// Fill the string to length 10 with "+" characters on the right.  Yields "Dojo++++++".
	//	|	dojo.string.pad("Dojo", 10, "+", true);

	if(!ch){
		ch = '0';
	}
	var out = String(text),
		pad = dojo.string.rep(ch, Math.ceil((size - out.length) / ch.length));
	return end ? out + pad : pad + out;	// String
};

dojo.string.substitute = function(	/*String*/		template, 
									/*Object|Array*/map, 
									/*Function?*/	transform, 
									/*Object?*/		thisObject){
	//	summary:
	//		Performs parameterized substitutions on a string. Throws an
	//		exception if any parameter is unmatched.
	//	template: 
	//		a string with expressions in the form `${key}` to be replaced or
	//		`${key:format}` which specifies a format function.
	//	map:
	//		hash to search for substitutions
	//	transform: 
	//		a function to process all parameters before substitution takes
	//		place, e.g. dojo.string.encodeXML
	//	thisObject: 
	//		where to look for optional format function; default to the global
	//		namespace
	//	example:
	//	|	// returns "File 'foo.html' is not found in directory '/temp'."
	//	|	dojo.string.substitute(
	//	|		"File '${0}' is not found in directory '${1}'.",
	//	|		["foo.html","/temp"]
	//	|	);
	//	|
	//	|	// also returns "File 'foo.html' is not found in directory '/temp'."
	//	|	dojo.string.substitute(
	//	|		"File '${name}' is not found in directory '${info.dir}'.",
	//	|		{ name: "foo.html", info: { dir: "/temp" } }
	//	|	);
	//	example:
	//		use a transform function to modify the values:
	//	|	// returns "file 'foo.html' is not found in directory '/temp'."
	//	|	dojo.string.substitute(
	//	|		"${0} is not found in ${1}.",
	//	|		["foo.html","/temp"],
	//	|		function(str){
	//	|			// try to figure out the type
	//	|			var prefix = (str.charAt(0) == "/") ? "directory": "file";
	//	|			return prefix + " '" + str + "'";
	//	|		}
	//	|	);
	//	example:
	//		use a formatter
	//	|	// returns "thinger -- howdy"
	//	|	dojo.string.substitute(
	//	|		"${0:postfix}", ["thinger"], null, {
	//	|			postfix: function(value, key){
	//	|				return value + " -- howdy";
	//	|			}
	//	|		}
	//	|	);

	thisObject = thisObject||dojo.global;
	transform = (!transform) ? 
					function(v){ return v; } : 
					dojo.hitch(thisObject, transform);

	return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function(match, key, format){
		var value = dojo.getObject(key, false, map);
		if(format){
			value = dojo.getObject(format, false, thisObject).call(thisObject, value, key);
		}
		return transform(value, key).toString();
	}); // string
};

dojo.string.trim = function(/*String*/ str){
	// summary:
	//		trims whitespaces from both sides of the string
	// description:
	//		This version of trim() was taken from [Steven Levithan's blog](http://blog.stevenlevithan.com/archives/faster-trim-javascript).
	//		The short yet performant version of this function is dojo.trim(),
	//		which is part of Dojo base.
	str = str.replace(/^\s+/, '');
	for(var i = str.length - 1; i >= 0; i--){
		if(/\S/.test(str.charAt(i))){
			str = str.substring(0, i + 1);
			break;
		}
	}
	return str;	// String
};

}

if(!dojo._hasResource["dojo.number"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.number"] = true;
dojo.provide("dojo.number");







/*=====
dojo.number = {
	// summary: localized formatting and parsing routines for Number
}

dojo.number.__FormatOptions = function(){
	//	pattern: String?
	//		override [formatting pattern](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		with this string
	//	type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific, percent, currency. decimal by default.
	//	places: Number?
	//		fixed number of decimal places to show.  This overrides any
	//		information in the provided pattern.
	//	round: Number?
	//		5 rounds to nearest .5; 0 rounds to nearest whole (default). -1
	//		means don't round.
	//	currency: String?
	//		an [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code, a three letter sequence like "USD"
	//	symbol: String?
	//		localized currency symbol
	//	locale: String?
	//		override the locale used to determine formatting rules
	this.pattern = pattern;
	this.type = type;
	this.places = places;
	this.round = round;
	this.currency = currency;
	this.symbol = symbol;
	this.locale = locale;
}
=====*/

dojo.number.format = function(/*Number*/value, /*dojo.number.__FormatOptions?*/options){
	// summary:
	//		Format a Number as a String, using locale-specific settings
	// description:
	//		Create a string from a Number using a known localized pattern.
	//		Formatting patterns appropriate to the locale are chosen from the
	//		[CLDR](http://unicode.org/cldr) as well as the appropriate symbols and
	//		delimiters.  See <http://www.unicode.org/reports/tr35/#Number_Elements>
	// value:
	//		the number to be formatted.  If not a valid JavaScript number,
	//		return null.

	options = dojo.mixin({}, options || {});
	var locale = dojo.i18n.normalizeLocale(options.locale);
	var bundle = dojo.i18n.getLocalization("dojo.cldr", "number", locale);
	options.customs = bundle;
	var pattern = options.pattern || bundle[(options.type || "decimal") + "Format"];
	if(isNaN(value)){ return null; } // null
	return dojo.number._applyPattern(value, pattern, options); // String
};

//dojo.number._numberPatternRE = /(?:[#0]*,?)*[#0](?:\.0*#*)?/; // not precise, but good enough
dojo.number._numberPatternRE = /[#0,]*[#0](?:\.0*#*)?/; // not precise, but good enough

dojo.number._applyPattern = function(/*Number*/value, /*String*/pattern, /*dojo.number.__FormatOptions?*/options){
	// summary:
	//		Apply pattern to format value as a string using options. Gives no
	//		consideration to local customs.
	// value:
	//		the number to be formatted.
	// pattern:
	//		a pattern string as described by
	//		[unicode.org TR35](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	// options: dojo.number.__FormatOptions?
	//		_applyPattern is usually called via `dojo.number.format()` which
	//		populates an extra property in the options parameter, "customs".
	//		The customs object specifies group and decimal parameters if set.

	//TODO: support escapes
	options = options || {};
	var group = options.customs.group;
	var decimal = options.customs.decimal;

	var patternList = pattern.split(';');
	var positivePattern = patternList[0];
	pattern = patternList[(value < 0) ? 1 : 0] || ("-" + positivePattern);

	//TODO: only test against unescaped
	if(pattern.indexOf('%') != -1){
		value *= 100;
	}else if(pattern.indexOf('\u2030') != -1){
		value *= 1000; // per mille
	}else if(pattern.indexOf('\u00a4') != -1){
		group = options.customs.currencyGroup || group;//mixins instead?
		decimal = options.customs.currencyDecimal || decimal;// Should these be mixins instead?
		pattern = pattern.replace(/\u00a4{1,3}/, function(match){
			var prop = ["symbol", "currency", "displayName"][match.length-1];
			return options[prop] || options.currency || "";
		});
	}else if(pattern.indexOf('E') != -1){
		throw new Error("exponential notation not supported");
	}
	
	//TODO: support @ sig figs?
	var numberPatternRE = dojo.number._numberPatternRE;
	var numberPattern = positivePattern.match(numberPatternRE);
	if(!numberPattern){
		throw new Error("unable to find a number expression in pattern: "+pattern);
	}
	if(options.fractional === false){ options.places = 0; }
	return pattern.replace(numberPatternRE,
		dojo.number._formatAbsolute(value, numberPattern[0], {decimal: decimal, group: group, places: options.places, round: options.round}));
}

dojo.number.round = function(/*Number*/value, /*Number?*/places, /*Number?*/multiple){
	//	summary:
	//		An inexact rounding method for low-precision values to compensate for
	//		binary floating point artifacts.
	//	description:
	//		Rounds the value to the nearest value with the given number of decimal places (.5 up)
	//		Also rounds up values which are very close to, but under the cut off, likely due to the
	//		binary floating point representation.  Therefore, the rounding may not be mathematically correct
	//		for full precision floating point values.
	//	value:
	//		the number to round
	//	places:
	//		the number of decimal places where rounding takes place.  Defaults to 0 for whole rounding.
	//	multiple:
	//		rounds next place to nearest multiple
	//	example:
	//		>>> 4.8-(1.1+2.2)
	//		1.4999999999999996
	//		>>> Math.round(4.8-(1.1+2.2))
	//		1
	//		>>> dojo.number.round(4.8-(1.1+2.2))
	//		2
	//		>>> ((4.8-(1.1+2.2))/100)
	//		0.014999999999999996
	//		>>> ((4.8-(1.1+2.2))/100).toFixed(2)
	//		"0.01"
	//		>>> dojo.number.round((4.8-(1.1+2.2))/100,2)
	//		0.02
	var wholeFigs = Math.log(Math.abs(value))/Math.log(10);
	var factor = 10 / (multiple || 10);
	var delta = Math.pow(10, -14+wholeFigs);
	return (factor * (+value+delta)).toFixed(places) / factor; // Number
}

/*=====
dojo.number.__FormatAbsoluteOptions = function(){
	//	decimal: String?
	//		the decimal separator
	//	group: String?
	//		the group separator
	//	places: Integer?|String?
	//		number of decimal places.  the range "n,m" will format to m places.
	//	round: Number?
	//		5 rounds to nearest .5; 0 rounds to nearest whole (default). -1
	//		means don't round.
	this.decimal = decimal;
	this.group = group;
	this.places = places;
	this.round = round;
}
=====*/

dojo.number._formatAbsolute = function(/*Number*/value, /*String*/pattern, /*dojo.number.__FormatAbsoluteOptions?*/options){
	// summary: 
	//		Apply numeric pattern to absolute value using options. Gives no
	//		consideration to local customs.
	// value:
	//		the number to be formatted, ignores sign
	// pattern:
	//		the number portion of a pattern (e.g. `#,##0.00`)
	options = options || {};
	if(options.places === true){options.places=0;}
	if(options.places === Infinity){options.places=6;} // avoid a loop; pick a limit

	var patternParts = pattern.split(".");
	var maxPlaces = (options.places >= 0) ? options.places : (patternParts[1] && patternParts[1].length) || 0;
	if(!(options.round < 0)){
		value = dojo.number.round(value, maxPlaces, options.round);
	}

	var valueParts = String(Math.abs(value)).split(".");
	var fractional = valueParts[1] || "";
	if(options.places){
		var comma = dojo.isString(options.places) && options.places.indexOf(",");
		if(comma){
			options.places = options.places.substring(comma+1);
		}
		valueParts[1] = dojo.string.pad(fractional.substr(0, options.places), options.places, '0', true);
	}else if(patternParts[1] && options.places !== 0){
		// Pad fractional with trailing zeros
		var pad = patternParts[1].lastIndexOf("0") + 1;
		if(pad > fractional.length){
			valueParts[1] = dojo.string.pad(fractional, pad, '0', true);
		}

		// Truncate fractional
		var places = patternParts[1].length;
		if(places < fractional.length){
			valueParts[1] = fractional.substr(0, places);
		}
	}else{
		if(valueParts[1]){ valueParts.pop(); }
	}

	// Pad whole with leading zeros
	var patternDigits = patternParts[0].replace(',', '');
	pad = patternDigits.indexOf("0");
	if(pad != -1){
		pad = patternDigits.length - pad;
		if(pad > valueParts[0].length){
			valueParts[0] = dojo.string.pad(valueParts[0], pad);
		}

		// Truncate whole
		if(patternDigits.indexOf("#") == -1){
			valueParts[0] = valueParts[0].substr(valueParts[0].length - pad);
		}
	}

	// Add group separators
	var index = patternParts[0].lastIndexOf(',');
	var groupSize, groupSize2;
	if(index != -1){
		groupSize = patternParts[0].length - index - 1;
		var remainder = patternParts[0].substr(0, index);
		index = remainder.lastIndexOf(',');
		if(index != -1){
			groupSize2 = remainder.length - index - 1;
		}
	}
	var pieces = [];
	for(var whole = valueParts[0]; whole;){
		var off = whole.length - groupSize;
		pieces.push((off > 0) ? whole.substr(off) : whole);
		whole = (off > 0) ? whole.slice(0, off) : "";
		if(groupSize2){
			groupSize = groupSize2;
			delete groupSize2;
		}
	}
	valueParts[0] = pieces.reverse().join(options.group || ",");

	return valueParts.join(options.decimal || ".");
};

/*=====
dojo.number.__RegexpOptions = function(){
	//	pattern: String?
	//		override pattern with this string.  Default is provided based on
	//		locale.
	//	type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific, percent, currency. decimal by default.
	//	locale: String?
	//		override the locale used to determine formatting rules
	//	strict: Boolean?
	//		strict parsing, false by default
	//	places: Number|String?
	//		number of decimal places to accept: Infinity, a positive number, or
	//		a range "n,m".  Defined by pattern or Infinity if pattern not provided.
	this.pattern = pattern;
	this.type = type;
	this.locale = locale;
	this.strict = strict;
	this.places = places;
}
=====*/
dojo.number.regexp = function(/*dojo.number.__RegexpOptions?*/options){
	//	summary:
	//		Builds the regular needed to parse a number
	//	description:
	//		Returns regular expression with positive and negative match, group
	//		and decimal separators
	return dojo.number._parseInfo(options).regexp; // String
}

dojo.number._parseInfo = function(/*Object?*/options){
	options = options || {};
	var locale = dojo.i18n.normalizeLocale(options.locale);
	var bundle = dojo.i18n.getLocalization("dojo.cldr", "number", locale);
	var pattern = options.pattern || bundle[(options.type || "decimal") + "Format"];
//TODO: memoize?
	var group = bundle.group;
	var decimal = bundle.decimal;
	var factor = 1;

	if(pattern.indexOf('%') != -1){
		factor /= 100;
	}else if(pattern.indexOf('\u2030') != -1){
		factor /= 1000; // per mille
	}else{
		var isCurrency = pattern.indexOf('\u00a4') != -1;
		if(isCurrency){
			group = bundle.currencyGroup || group;
			decimal = bundle.currencyDecimal || decimal;
		}
	}

	//TODO: handle quoted escapes
	var patternList = pattern.split(';');
	if(patternList.length == 1){
		patternList.push("-" + patternList[0]);
	}

	var re = dojo.regexp.buildGroupRE(patternList, function(pattern){
		pattern = "(?:"+dojo.regexp.escapeString(pattern, '.')+")";
		return pattern.replace(dojo.number._numberPatternRE, function(format){
			var flags = {
				signed: false,
				separator: options.strict ? group : [group,""],
				fractional: options.fractional,
				decimal: decimal,
				exponent: false};
			var parts = format.split('.');
			var places = options.places;
			if(parts.length == 1 || places === 0){flags.fractional = false;}
			else{
				if(places === undefined){ places = options.pattern ? parts[1].lastIndexOf('0')+1 : Infinity; }
				if(places && options.fractional == undefined){flags.fractional = true;} // required fractional, unless otherwise specified
				if(!options.places && (places < parts[1].length)){ places += "," + parts[1].length; }
				flags.places = places;
			}
			var groups = parts[0].split(',');
			if(groups.length>1){
				flags.groupSize = groups.pop().length;
				if(groups.length>1){
					flags.groupSize2 = groups.pop().length;
				}
			}
			return "("+dojo.number._realNumberRegexp(flags)+")";
		});
	}, true);

	if(isCurrency){
		// substitute the currency symbol for the placeholder in the pattern
		re = re.replace(/([\s\xa0]*)(\u00a4{1,3})([\s\xa0]*)/g, function(match, before, target, after){
			var prop = ["symbol", "currency", "displayName"][target.length-1];
			var symbol = dojo.regexp.escapeString(options[prop] || options.currency || "");
			before = before ? "[\\s\\xa0]" : "";
			after = after ? "[\\s\\xa0]" : "";
			if(!options.strict){
				if(before){before += "*";}
				if(after){after += "*";}
				return "(?:"+before+symbol+after+")?";
			}
			return before+symbol+after;
		});
	}

//TODO: substitute localized sign/percent/permille/etc.?

	// normalize whitespace and return
	return {regexp: re.replace(/[\xa0 ]/g, "[\\s\\xa0]"), group: group, decimal: decimal, factor: factor}; // Object
}

/*=====
dojo.number.__ParseOptions = function(){
	//	pattern: String
	//		override pattern with this string.  Default is provided based on
	//		locale.
	//	type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific, percent, currency. decimal by default.
	//	locale: String
	//		override the locale used to determine formatting rules
	//	strict: Boolean?
	//		strict parsing, false by default
	//	currency: Object
	//		object with currency information
	this.pattern = pattern;
	this.type = type;
	this.locale = locale;
	this.strict = strict;
	this.currency = currency;
}
=====*/
dojo.number.parse = function(/*String*/expression, /*dojo.number.__ParseOptions?*/options){
	// summary:
	//		Convert a properly formatted string to a primitive Number, using
	//		locale-specific settings.
	// description:
	//		Create a Number from a string using a known localized pattern.
	//		Formatting patterns are chosen appropriate to the locale
	//		and follow the syntax described by
	//		[unicode.org TR35](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	// expression:
	//		A string representation of a Number
	var info = dojo.number._parseInfo(options);
	var results = (new RegExp("^"+info.regexp+"$")).exec(expression);
	if(!results){
		return NaN; //NaN
	}
	var absoluteMatch = results[1]; // match for the positive expression
	if(!results[1]){
		if(!results[2]){
			return NaN; //NaN
		}
		// matched the negative pattern
		absoluteMatch =results[2];
		info.factor *= -1;
	}

	// Transform it to something Javascript can parse as a number.  Normalize
	// decimal point and strip out group separators or alternate forms of whitespace
	absoluteMatch = absoluteMatch.
		replace(new RegExp("["+info.group + "\\s\\xa0"+"]", "g"), "").
		replace(info.decimal, ".");
	// Adjust for negative sign, percent, etc. as necessary
	return Number(absoluteMatch) * info.factor; //Number
};

/*=====
dojo.number.__RealNumberRegexpFlags = function(){
	//	places: Number?
	//		The integer number of decimal places or a range given as "n,m".  If
	//		not given, the decimal part is optional and the number of places is
	//		unlimited.
	//	decimal: String?
	//		A string for the character used as the decimal point.  Default
	//		is ".".
	//	fractional: Boolean|Array?
	//		Whether decimal places are allowed.  Can be true, false, or [true,
	//		false].  Default is [true, false]
	//	exponent: Boolean|Array?
	//		Express in exponential notation.  Can be true, false, or [true,
	//		false]. Default is [true, false], (i.e. will match if the
	//		exponential part is present are not).
	//	eSigned: Boolean|Array?
	//		The leading plus-or-minus sign on the exponent.  Can be true,
	//		false, or [true, false].  Default is [true, false], (i.e. will
	//		match if it is signed or unsigned).  flags in regexp.integer can be
	//		applied.
	this.places = places;
	this.decimal = decimal;
	this.fractional = fractional;
	this.exponent = exponent;
	this.eSigned = eSigned;
}
=====*/

dojo.number._realNumberRegexp = function(/*dojo.number.__RealNumberRegexpFlags?*/flags){
	// summary:
	//		Builds a regular expression to match a real number in exponential
	//		notation

	// assign default values to missing paramters
	flags = flags || {};
	//TODO: use mixin instead?
	if(!("places" in flags)){ flags.places = Infinity; }
	if(typeof flags.decimal != "string"){ flags.decimal = "."; }
	if(!("fractional" in flags) || /^0/.test(flags.places)){ flags.fractional = [true, false]; }
	if(!("exponent" in flags)){ flags.exponent = [true, false]; }
	if(!("eSigned" in flags)){ flags.eSigned = [true, false]; }

	// integer RE
	var integerRE = dojo.number._integerRegexp(flags);

	// decimal RE
	var decimalRE = dojo.regexp.buildGroupRE(flags.fractional,
		function(q){
			var re = "";
			if(q && (flags.places!==0)){
				re = "\\" + flags.decimal;
				if(flags.places == Infinity){ 
					re = "(?:" + re + "\\d+)?"; 
				}else{
					re += "\\d{" + flags.places + "}"; 
				}
			}
			return re;
		},
		true
	);

	// exponent RE
	var exponentRE = dojo.regexp.buildGroupRE(flags.exponent,
		function(q){ 
			if(q){ return "([eE]" + dojo.number._integerRegexp({ signed: flags.eSigned}) + ")"; }
			return ""; 
		}
	);

	// real number RE
	var realRE = integerRE + decimalRE;
	// allow for decimals without integers, e.g. .25
	if(decimalRE){realRE = "(?:(?:"+ realRE + ")|(?:" + decimalRE + "))";}
	return realRE + exponentRE; // String
};

/*=====
dojo.number.__IntegerRegexpFlags = function(){
	//	signed: Boolean?
	//		The leading plus-or-minus sign. Can be true, false, or `[true,false]`.
	//		Default is `[true, false]`, (i.e. will match if it is signed
	//		or unsigned).
	//	separator: String?
	//		The character used as the thousands separator. Default is no
	//		separator. For more than one symbol use an array, e.g. `[",", ""]`,
	//		makes ',' optional.
	//	groupSize: Number?
	//		group size between separators
	//	groupSize2: Number?
	//		second grouping, where separators 2..n have a different interval than the first separator (for India)
	this.signed = signed;
	this.separator = separator;
	this.groupSize = groupSize;
	this.groupSize2 = groupSize2;
}
=====*/

dojo.number._integerRegexp = function(/*dojo.number.__IntegerRegexpFlags?*/flags){
	// summary: 
	//		Builds a regular expression that matches an integer

	// assign default values to missing paramters
	flags = flags || {};
	if(!("signed" in flags)){ flags.signed = [true, false]; }
	if(!("separator" in flags)){
		flags.separator = "";
	}else if(!("groupSize" in flags)){
		flags.groupSize = 3;
	}
	// build sign RE
	var signRE = dojo.regexp.buildGroupRE(flags.signed,
		function(q){ return q ? "[-+]" : ""; },
		true
	);

	// number RE
	var numberRE = dojo.regexp.buildGroupRE(flags.separator,
		function(sep){
			if(!sep){
				return "(?:0|[1-9]\\d*)";
			}

			sep = dojo.regexp.escapeString(sep);
			if(sep == " "){ sep = "\\s"; }
			else if(sep == "\xa0"){ sep = "\\s\\xa0"; }

			var grp = flags.groupSize, grp2 = flags.groupSize2;
			if(grp2){
				var grp2RE = "(?:0|[1-9]\\d{0," + (grp2-1) + "}(?:[" + sep + "]\\d{" + grp2 + "})*[" + sep + "]\\d{" + grp + "})";
				return ((grp-grp2) > 0) ? "(?:" + grp2RE + "|(?:0|[1-9]\\d{0," + (grp-1) + "}))" : grp2RE;
			}
			return "(?:0|[1-9]\\d{0," + (grp-1) + "}(?:[" + sep + "]\\d{" + grp + "})*)";
		},
		true
	);

	// integer RE
	return signRE + numberRE; // String
}

}

if(!dojo._hasResource["dojox.validate.regexp"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.validate.regexp"] = true;
dojo.provide("dojox.validate.regexp");

 

// *** Regular Expression Generator does not entirely live here ***
// FIXME: is this useful enough to be in /dojox/regexp/_base.js, or
// should it respect namespace and be dojox.validate.regexp?
// some say a generic regexp to match zipcodes and urls would be useful
// others would say it's a spare tire. 
dojox.regexp = { ca: {}, us: {} }; 

dojox.regexp.tld = function(/*Object?*/flags){
	// summary: Builds a RE that matches a top-level domain
	//
	// flags:
	//    flags.allowCC  Include 2 letter country code domains.  Default is true.
	//    flags.allowGeneric  Include the generic domains.  Default is true.
	//    flags.allowInfra  Include infrastructure domains.  Default is true.

	// assign default values to missing paramters
	flags = (typeof flags == "object") ? flags : {};
	if(typeof flags.allowCC != "boolean"){ flags.allowCC = true; }
	if(typeof flags.allowInfra != "boolean"){ flags.allowInfra = true; }
	if(typeof flags.allowGeneric != "boolean"){ flags.allowGeneric = true; }

	// Infrastructure top-level domain - only one at present
	var infraRE = "arpa";

	// Generic top-level domains RE.
	var genericRE = 
		"aero|asia|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|xxx|jobs|mobi|post";
	
	// Country Code top-level domains RE
	// after 2009-Sept-30, .yu will be invalid
	var ccRE = 
		"ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|" +
		"bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|" +
		"ec|ee|eg|er|eu|es|et|fi|fj|fk|fm|fo|fr|ga|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|" +
		"gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kr|kw|ky|kz|" +
		"la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|" +
		"my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|" +
		"re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sk|sl|sm|sn|sr|st|su|sv|sy|sz|tc|td|tf|tg|th|tj|tk|tm|" +
		"tn|to|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|yu|za|zm|zw";

	// Build top-level domain RE
	var a = [];
	if(flags.allowInfra){ a.push(infraRE); }
	if(flags.allowGeneric){ a.push(genericRE); }
	if(flags.allowCC){ a.push(ccRE); }

	var tldRE = "";
	if (a.length > 0) {
		tldRE = "(" + a.join("|") + ")";
	}

	return tldRE; // String
}

dojox.regexp.ipAddress = function(/*Object?*/flags){
	// summary: Builds a RE that matches an IP Address
	//
	// description:
	//  Supports 5 formats for IPv4: dotted decimal, dotted hex, dotted octal, decimal and hexadecimal.
	//  Supports 2 formats for Ipv6.
	//
	// flags  An object.  All flags are boolean with default = true.
	//    flags.allowDottedDecimal  Example, 207.142.131.235.  No zero padding.
	//    flags.allowDottedHex  Example, 0x18.0x11.0x9b.0x28.  Case insensitive.  Zero padding allowed.
	//    flags.allowDottedOctal  Example, 0030.0021.0233.0050.  Zero padding allowed.
	//    flags.allowDecimal  Example, 3482223595.  A decimal number between 0-4294967295.
	//    flags.allowHex  Example, 0xCF8E83EB.  Hexadecimal number between 0x0-0xFFFFFFFF.
	//      Case insensitive.  Zero padding allowed.
	//    flags.allowIPv6   IPv6 address written as eight groups of four hexadecimal digits.
	//	FIXME: ipv6 can be written multiple ways IIRC
	//    flags.allowHybrid   IPv6 address written as six groups of four hexadecimal digits
	//      followed by the usual 4 dotted decimal digit notation of IPv4. x:x:x:x:x:x:d.d.d.d

	// assign default values to missing paramters
	flags = (typeof flags == "object") ? flags : {};
	if(typeof flags.allowDottedDecimal != "boolean"){ flags.allowDottedDecimal = true; }
	if(typeof flags.allowDottedHex != "boolean"){ flags.allowDottedHex = true; }
	if(typeof flags.allowDottedOctal != "boolean"){ flags.allowDottedOctal = true; }
	if(typeof flags.allowDecimal != "boolean"){ flags.allowDecimal = true; }
	if(typeof flags.allowHex != "boolean"){ flags.allowHex = true; }
	if(typeof flags.allowIPv6 != "boolean"){ flags.allowIPv6 = true; }
	if(typeof flags.allowHybrid != "boolean"){ flags.allowHybrid = true; }

	// decimal-dotted IP address RE.
	var dottedDecimalRE = 
		// Each number is between 0-255.  Zero padding is not allowed.
		"((\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])\\.){3}(\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])";

	// dotted hex IP address RE.  Each number is between 0x0-0xff.  Zero padding is allowed, e.g. 0x00.
	var dottedHexRE = "(0[xX]0*[\\da-fA-F]?[\\da-fA-F]\\.){3}0[xX]0*[\\da-fA-F]?[\\da-fA-F]";

	// dotted octal IP address RE.  Each number is between 0000-0377.  
	// Zero padding is allowed, but each number must have at least 4 characters.
	var dottedOctalRE = "(0+[0-3][0-7][0-7]\\.){3}0+[0-3][0-7][0-7]";

	// decimal IP address RE.  A decimal number between 0-4294967295.  
	var decimalRE =  "(0|[1-9]\\d{0,8}|[1-3]\\d{9}|4[01]\\d{8}|42[0-8]\\d{7}|429[0-3]\\d{6}|" +
		"4294[0-8]\\d{5}|42949[0-5]\\d{4}|429496[0-6]\\d{3}|4294967[01]\\d{2}|42949672[0-8]\\d|429496729[0-5])";

	// hexadecimal IP address RE. 
	// A hexadecimal number between 0x0-0xFFFFFFFF. Case insensitive.  Zero padding is allowed.
	var hexRE = "0[xX]0*[\\da-fA-F]{1,8}";

	// IPv6 address RE. 
	// The format is written as eight groups of four hexadecimal digits, x:x:x:x:x:x:x:x,
	// where x is between 0000-ffff. Zero padding is optional. Case insensitive. 
	var ipv6RE = "([\\da-fA-F]{1,4}\\:){7}[\\da-fA-F]{1,4}";

	// IPv6/IPv4 Hybrid address RE. 
	// The format is written as six groups of four hexadecimal digits, 
	// followed by the 4 dotted decimal IPv4 format. x:x:x:x:x:x:d.d.d.d
	var hybridRE = "([\\da-fA-F]{1,4}\\:){6}" + 
		"((\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])\\.){3}(\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])";

	// Build IP Address RE
	var a = [];
	if(flags.allowDottedDecimal){ a.push(dottedDecimalRE); }
	if(flags.allowDottedHex){ a.push(dottedHexRE); }
	if(flags.allowDottedOctal){ a.push(dottedOctalRE); }
	if(flags.allowDecimal){ a.push(decimalRE); }
	if(flags.allowHex){ a.push(hexRE); }
	if(flags.allowIPv6){ a.push(ipv6RE); }
	if(flags.allowHybrid){ a.push(hybridRE); }

	var ipAddressRE = "";
	if(a.length > 0){
		ipAddressRE = "(" + a.join("|") + ")";
	}
	return ipAddressRE; // String
}

dojox.regexp.host = function(/*Object?*/flags){
	// summary: Builds a RE that matches a host
	// description: A host is a named host (A-z0-9_- but not starting with -), a domain name or an IP address, possibly followed by a port number.
	// flags: An object.
	//	  flags.allowNamed Allow a named host for local networks. Default is false.
	//    flags.allowIP  Allow an IP address for hostname.  Default is true.
	//    flags.allowLocal  Allow the host to be "localhost".  Default is false.
	//    flags.allowPort  Allow a port number to be present.  Default is true.
	//    flags in regexp.ipAddress can be applied.
	//    flags in regexp.tld can be applied.

	// assign default values to missing paramters
	flags = (typeof flags == "object") ? flags : {};
	if(typeof flags.allowIP != "boolean"){ flags.allowIP = true; }
	if(typeof flags.allowLocal != "boolean"){ flags.allowLocal = false; }
	if(typeof flags.allowPort != "boolean"){ flags.allowPort = true; }
	if(typeof flags.allowNamed != "boolean"){ flags.allowNamed = false; }

	// Domain names can not end with a dash.
	var domainNameRE = "([0-9a-zA-Z]([-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?\\.)+" + dojox.regexp.tld(flags);

	// port number RE
	var portRE = flags.allowPort ? "(\\:\\d+)?" : "";

	// build host RE
	var hostNameRE = domainNameRE;
	if(flags.allowIP){ hostNameRE += "|" +  dojox.regexp.ipAddress(flags); }
	if(flags.allowLocal){ hostNameRE += "|localhost"; }
	if(flags.allowNamed){ hostNameRE += "|^[^-][a-zA-Z0-9_-]*"; }
	return "(" + hostNameRE + ")" + portRE; // String
}

dojox.regexp.url = function(/*Object?*/flags){
	// summary: Builds a regular expression that matches a URL
	//
	// flags: An object
	//    flags.scheme  Can be true, false, or [true, false]. 
	//      This means: required, not allowed, or match either one.
	//    flags in regexp.host can be applied.
	//    flags in regexp.ipAddress can be applied.
	//    flags in regexp.tld can be applied.

	// assign default values to missing paramters
	flags = (typeof flags == "object") ? flags : {};
	if(!("scheme" in flags)){ flags.scheme = [true, false]; }

	// Scheme RE
	var protocolRE = dojo.regexp.buildGroupRE(flags.scheme,
		function(q){ if(q){ return "(https?|ftps?)\\://"; } return ""; }
	);

	// Path and query and anchor RE
	var pathRE = "(/([^?#\\s/]+/)*)?([^?#\\s/]+(\\?[^?#\\s/]*)?(#[A-Za-z][\\w.:-]*)?)?";

	return protocolRE + dojox.regexp.host(flags) + pathRE;
}

dojox.regexp.emailAddress = function(/*Object?*/flags){

	// summary: Builds a regular expression that matches an email address
	//
	//flags: An object
	//    flags.allowCruft  Allow address like <mailto:foo@yahoo.com>.  Default is false.
	//    flags in regexp.host can be applied.
	//    flags in regexp.ipAddress can be applied.
	//    flags in regexp.tld can be applied.

	// assign default values to missing paramters
	flags = (typeof flags == "object") ? flags : {};
	if (typeof flags.allowCruft != "boolean") { flags.allowCruft = false; }
	flags.allowPort = false; // invalid in email addresses

	// user name RE - apostrophes are valid if there's not 2 in a row
	var usernameRE = "([\\da-zA-Z]+[-._+&'])*[\\da-zA-Z]+";

	// build emailAddress RE
	var emailAddressRE = usernameRE + "@" + dojox.regexp.host(flags);

	// Allow email addresses with cruft
	if ( flags.allowCruft ) {
		emailAddressRE = "<?(mailto\\:)?" + emailAddressRE + ">?";
	}

	return emailAddressRE; // String
}

dojox.regexp.emailAddressList = function(/*Object?*/flags){
	// summary: Builds a regular expression that matches a list of email addresses.
	//
	// flags: An object.
	//    flags.listSeparator  The character used to separate email addresses.  Default is ";", ",", "\n" or " ".
	//    flags in regexp.emailAddress can be applied.
	//    flags in regexp.host can be applied.
	//    flags in regexp.ipAddress can be applied.
	//    flags in regexp.tld can be applied.

	// assign default values to missing paramters
	flags = (typeof flags == "object") ? flags : {};
	if(typeof flags.listSeparator != "string"){ flags.listSeparator = "\\s;,"; }

	// build a RE for an Email Address List
	var emailAddressRE = dojox.regexp.emailAddress(flags);
	var emailAddressListRE = "(" + emailAddressRE + "\\s*[" + flags.listSeparator + "]\\s*)*" + 
		emailAddressRE + "\\s*[" + flags.listSeparator + "]?\\s*";

	return emailAddressListRE; // String
}

dojox.regexp.us.state = function(/*Object?*/flags){
	// summary: A regular expression to match US state and territory abbreviations
	//
	// flags  An object.
	//    flags.allowTerritories  Allow Guam, Puerto Rico, etc.  Default is true.
	//    flags.allowMilitary  Allow military 'states', e.g. Armed Forces Europe (AE).  Default is true.

	// assign default values to missing paramters
	flags = (typeof flags == "object") ? flags : {};
	if(typeof flags.allowTerritories != "boolean"){ flags.allowTerritories = true; }
	if(typeof flags.allowMilitary != "boolean"){ flags.allowMilitary = true; }

	// state RE
	var statesRE = 
		"AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|" + 
		"NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY";

	// territories RE
	var territoriesRE = "AS|FM|GU|MH|MP|PW|PR|VI";

	// military states RE
	var militaryRE = "AA|AE|AP";

	// Build states and territories RE
	if(flags.allowTerritories){ statesRE += "|" + territoriesRE; }
	if(flags.allowMilitary){ statesRE += "|" + militaryRE; }

	return "(" + statesRE + ")"; // String
}

dojox.regexp.ca.postalCode = function(){
	var postalRE =
		"[A-Z][0-9][A-Z] [0-9][A-Z][0-9]";
	return "(" + postalRE + ")";
}

dojox.regexp.ca.province = function(){
	// summary: a regular expression to match Canadian Province Abbreviations
	var stateRE = 
		"AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT";
	return "(" + stateRE + ")";
}

dojox.regexp.numberFormat = function(/*Object?*/flags){
	// summary: Builds a regular expression to match any sort of number based format
	// description:
	//  Use this method for phone numbers, social security numbers, zip-codes, etc.
	//  The RE can match one format or one of multiple formats.
	//
	//  Format
	//    #        Stands for a digit, 0-9.
	//    ?        Stands for an optional digit, 0-9 or nothing.
	//    All other characters must appear literally in the expression.
	//
	//  Example   
	//    "(###) ###-####"       ->   (510) 542-9742
	//    "(###) ###-#### x#???" ->   (510) 542-9742 x153
	//    "###-##-####"          ->   506-82-1089       i.e. social security number
	//    "#####-####"           ->   98225-1649        i.e. zip code
	//
	// flags:  An object
	//    flags.format  A string or an Array of strings for multiple formats.

	// assign default values to missing paramters
	flags = (typeof flags == "object") ? flags : {};
	if(typeof flags.format == "undefined"){ flags.format = "###-###-####"; }

	// Converts a number format to RE.
	var digitRE = function(format){
		// escape all special characters, except '?'
		format = dojo.regexp.escapeString(format, "?");

		// Now replace '?' with Regular Expression
		format = format.replace(/\?/g, "\\d?");

		// replace # with Regular Expression
		format = format.replace(/#/g, "\\d");

		return format; // String
	};

	// build RE for multiple number formats
	return dojo.regexp.buildGroupRE(flags.format, digitRE); //String
}

}

if(!dojo._hasResource["dojox.validate._base"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.validate._base"] = true;
dojo.provide("dojox.validate._base");

		// dojo core expressions
		// dojo number expressions
 	// additional expressions

dojox.validate.isText = function(/*String*/value, /*Object?*/flags){
	// summary:
	//	Checks if a string has non whitespace characters. 
	//	Parameters allow you to constrain the length.
	//
	// value: A string
	// flags: {length: Number, minlength: Number, maxlength: Number}
	//    flags.length  If set, checks if there are exactly flags.length number of characters.
	//    flags.minlength  If set, checks if there are at least flags.minlength number of characters.
	//    flags.maxlength  If set, checks if there are at most flags.maxlength number of characters.
	
	flags = (typeof flags == "object") ? flags : {};
	
	// test for text
	if(/^\s*$/.test(value)){ return false; } // Boolean
	
	// length tests
	if(typeof flags.length == "number" && flags.length != value.length){ return false; } // Boolean
	if(typeof flags.minlength == "number" && flags.minlength > value.length){ return false; } // Boolean
	if(typeof flags.maxlength == "number" && flags.maxlength < value.length){ return false; } // Boolean
	
	return true; // Boolean

}

dojox.validate._isInRangeCache = {};
dojox.validate.isInRange = function(/*String*/value, /*Object?*/flags){
	// summary:
	//	Validates whether a string denoting a number
	//	is between a max and min. 
	//
	// value: A string
	// flags: {max:Number, min:Number, decimal:String}
	//    flags.max  A number, which the value must be less than or equal to for the validation to be true.
	//    flags.min  A number, which the value must be greater than or equal to for the validation to be true.
	//    flags.decimal  The character used for the decimal point.  Default is ".".
	
    // fixes ticket #2908
    value = dojo.number.parse(value, flags);
	if(isNaN(value)){
		return false; // Boolean
	}
    
	// assign default values to missing paramters
	flags = (typeof flags == "object") ? flags : {};
	var max = (typeof flags.max == "number") ? flags.max : Infinity;
	var min = (typeof flags.min == "number") ? flags.min : -Infinity;
	var dec = (typeof flags.decimal == "string") ? flags.decimal : ".";
	
	var cache = dojox.validate._isInRangeCache;
	var cacheIdx = value+"max"+max+"min"+min+"dec"+dec;
	if(typeof cache[cacheIdx] != "undefined"){
		return cache[cacheIdx];
	}

	if ( value < min || value > max ) { cache[cacheIdx] = false; return false; } // Boolean

	cache[cacheIdx] = true; return true; // Boolean
}

dojox.validate.isNumberFormat = function(/*String*/value, /*Object?*/flags){
	// summary:
	//	Validates any sort of number based format
	//
	// description:
	//	Use it for phone numbers, social security numbers, zip-codes, etc.
	//	The value can be validated against one format or one of multiple formats.
	//
	//  Format
	//    #        Stands for a digit, 0-9.
	//    ?        Stands for an optional digit, 0-9 or nothing.
	//    All other characters must appear literally in the expression.
	//
	//  Example   
	//    "(###) ###-####"       ->   (510) 542-9742
	//    "(###) ###-#### x#???" ->   (510) 542-9742 x153
	//    "###-##-####"          ->   506-82-1089       i.e. social security number
	//    "#####-####"           ->   98225-1649        i.e. zip code
	//
	// value: A string
	// flags: {format:String}
	//    flags.format  A string or an Array of strings for multiple formats.

	var re = new RegExp("^" + dojox.regexp.numberFormat(flags) + "$", "i");
	return re.test(value); // Boolean
}

dojox.validate.isValidLuhn = function(/*String*/value){
	//summary: Compares value against the Luhn algorithm to verify its integrity
	var sum, parity, curDigit;
	if(typeof value!='string'){
		value = String(value);
	}
	value = value.replace(/[- ]/g,''); //ignore dashes and whitespaces
	parity = value.length%2;
	sum=0;
	for(var i=0;i<value.length;i++){
		curDigit = parseInt(value.charAt(i));
		if(i%2==parity){
			curDigit*=2;
		}
		if(curDigit>9){
			curDigit-=9;
		}
		sum+=curDigit;
	}
	return !(sum%10); //Boolean
}

/**
	Procedural API Description

		The main aim is to make input validation expressible in a simple format.
		You define profiles which declare the required and optional fields and any constraints they might have.
		The results are provided as an object that makes it easy to handle missing and invalid input.

	Usage

		var results = dojo.validate.check(form, profile);

	Profile Object

		var profile = {
			// filters change the field value and are applied before validation.
			trim: ["tx1", "tx2"],
			uppercase: ["tx9"],
			lowercase: ["tx5", "tx6", "tx7"],
			ucfirst: ["tx10"],
			digit: ["tx11"],

			// required input fields that are blank will be reported missing.
			// required radio button groups and drop-down lists with no selection will be reported missing.
			// checkbox groups and selectboxes can be required to have more than one value selected.
			// List required fields by name and use this notation to require more than one value: {checkboxgroup: 2}, {selectboxname: 3}.
			required: ["tx7", "tx8", "pw1", "ta1", "rb1", "rb2", "cb3", "s1", {"doubledip":2}, {"tripledip":3}],

			// dependant/conditional fields are required if the target field is present and not blank.
			// At present only textbox, password, and textarea fields are supported.
			dependencies:	{
				cc_exp: "cc_no",	
				cc_type: "cc_no"	
			},

			// Fields can be validated using any boolean valued function.  
			// Use arrays to specify parameters in addition to the field value.
			constraints: {
				field_name1: myValidationFunction,
				field_name2: dojo.validate.isInteger,
				field_name3: [myValidationFunction, additional parameters],
				field_name4: [dojo.validate.isValidDate, "YYYY.MM.DD"],
				field_name5: [dojo.validate.isEmailAddress, false, true]
			},

			// Confirm is a sort of conditional validation.
			// It associates each field in its property list with another field whose value should be equal.
			// If the values are not equal, the field in the property list is reported as Invalid. Unless the target field is blank.
			confirm: {
				email_confirm: "email",	
				pw2: "pw1"
			}
		};

	Results Object

		isSuccessful(): Returns true if there were no invalid or missing fields, else it returns false.
		hasMissing():  Returns true if the results contain any missing fields.
		getMissing():  Returns a list of required fields that have values missing.
		isMissing(field):  Returns true if the field is required and the value is missing.
		hasInvalid():  Returns true if the results contain fields with invalid data.
		getInvalid():  Returns a list of fields that have invalid values.
		isInvalid(field):  Returns true if the field has an invalid value.

*/

}

if(!dojo._hasResource["dojox.validate"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.validate"] = true;
dojo.provide("dojox.validate");
 

}

if(!dojo._hasResource["dojo.cldr.supplemental"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.cldr.supplemental"] = true;
dojo.provide("dojo.cldr.supplemental");



dojo.cldr.supplemental.getFirstDayOfWeek = function(/*String?*/locale){
// summary: Returns a zero-based index for first day of the week
// description:
//		Returns a zero-based index for first day of the week, as used by the local (Gregorian) calendar.
//		e.g. Sunday (returns 0), or Monday (returns 1)

	// from http://www.unicode.org/cldr/data/common/supplemental/supplementalData.xml:supplementalData/weekData/firstDay
	var firstDay = {/*default is 1=Monday*/
		mv:5,
		ae:6,af:6,bh:6,dj:6,dz:6,eg:6,er:6,et:6,iq:6,ir:6,jo:6,ke:6,kw:6,lb:6,ly:6,ma:6,om:6,qa:6,sa:6,
		sd:6,so:6,tn:6,ye:6,
		as:0,au:0,az:0,bw:0,ca:0,cn:0,fo:0,ge:0,gl:0,gu:0,hk:0,ie:0,il:0,is:0,jm:0,jp:0,kg:0,kr:0,la:0,
		mh:0,mo:0,mp:0,mt:0,nz:0,ph:0,pk:0,sg:0,th:0,tt:0,tw:0,um:0,us:0,uz:0,vi:0,za:0,zw:0,
		et:0,mw:0,ng:0,tj:0,
// variant. do not use?		gb:0,
		sy:4
	};

	var country = dojo.cldr.supplemental._region(locale);
	var dow = firstDay[country];
	return (dow === undefined) ? 1 : dow; /*Number*/
};

dojo.cldr.supplemental._region = function(/*String?*/locale){
	locale = dojo.i18n.normalizeLocale(locale);
	var tags = locale.split('-');
	var region = tags[1];
	if(!region){
		// IE often gives language only (#2269)
		// Arbitrary mappings of language-only locales to a country:
		region = {de:"de", en:"us", es:"es", fi:"fi", fr:"fr", he:"il", hu:"hu", it:"it",
			ja:"jp", ko:"kr", nl:"nl", pt:"br", sv:"se", zh:"cn"}[tags[0]];
	}else if(region.length == 4){
		// The ISO 3166 country code is usually in the second position, unless a
		// 4-letter script is given. See http://www.ietf.org/rfc/rfc4646.txt
		region = tags[2];
	}
	return region;
}

dojo.cldr.supplemental.getWeekend = function(/*String?*/locale){
// summary: Returns a hash containing the start and end days of the weekend
// description:
//		Returns a hash containing the start and end days of the weekend according to local custom using locale,
//		or by default in the user's locale.
//		e.g. {start:6, end:0}

	// from http://www.unicode.org/cldr/data/common/supplemental/supplementalData.xml:supplementalData/weekData/weekend{Start,End}
	var weekendStart = {/*default is 6=Saturday*/
		eg:5,il:5,sy:5,
		'in':0,
		ae:4,bh:4,dz:4,iq:4,jo:4,kw:4,lb:4,ly:4,ma:4,om:4,qa:4,sa:4,sd:4,tn:4,ye:4		
	};

	var weekendEnd = {/*default is 0=Sunday*/
		ae:5,bh:5,dz:5,iq:5,jo:5,kw:5,lb:5,ly:5,ma:5,om:5,qa:5,sa:5,sd:5,tn:5,ye:5,af:5,ir:5,
		eg:6,il:6,sy:6
	};

	var country = dojo.cldr.supplemental._region(locale);
	var start = weekendStart[country];
	var end = weekendEnd[country];
	if(start === undefined){start=6;}
	if(end === undefined){end=0;}
	return {start:start, end:end}; /*Object {start,end}*/
};

}

if(!dojo._hasResource["dojo.date"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.date"] = true;
dojo.provide("dojo.date");

/*=====
dojo.date = {
	// summary: Date manipulation utilities
}
=====*/

dojo.date.getDaysInMonth = function(/*Date*/dateObject){
	//	summary:
	//		Returns the number of days in the month used by dateObject
	var month = dateObject.getMonth();
	var days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	if(month == 1 && dojo.date.isLeapYear(dateObject)){ return 29; } // Number
	return days[month]; // Number
}

dojo.date.isLeapYear = function(/*Date*/dateObject){
	//	summary:
	//		Determines if the year of the dateObject is a leap year
	//	description:
	//		Leap years are years with an additional day YYYY-02-29, where the
	//		year number is a multiple of four with the following exception: If
	//		a year is a multiple of 100, then it is only a leap year if it is
	//		also a multiple of 400. For example, 1900 was not a leap year, but
	//		2000 is one.

	var year = dateObject.getFullYear();
	return !(year%400) || (!(year%4) && !!(year%100)); // Boolean
}

// FIXME: This is not localized
dojo.date.getTimezoneName = function(/*Date*/dateObject){
	//	summary:
	//		Get the user's time zone as provided by the browser
	// dateObject:
	//		Needed because the timezone may vary with time (daylight savings)
	//	description:
	//		Try to get time zone info from toString or toLocaleString method of
	//		the Date object -- UTC offset is not a time zone.  See
	//		http://www.twinsun.com/tz/tz-link.htm Note: results may be
	//		inconsistent across browsers.

	var str = dateObject.toString(); // Start looking in toString
	var tz = ''; // The result -- return empty string if nothing found
	var match;

	// First look for something in parentheses -- fast lookup, no regex
	var pos = str.indexOf('(');
	if(pos > -1){
		tz = str.substring(++pos, str.indexOf(')'));
	}else{
		// If at first you don't succeed ...
		// If IE knows about the TZ, it appears before the year
		// Capital letters or slash before a 4-digit year 
		// at the end of string
		var pat = /([A-Z\/]+) \d{4}$/;
		if((match = str.match(pat))){
			tz = match[1];
		}else{
		// Some browsers (e.g. Safari) glue the TZ on the end
		// of toLocaleString instead of putting it in toString
			str = dateObject.toLocaleString();
			// Capital letters or slash -- end of string, 
			// after space
			pat = / ([A-Z\/]+)$/;
			if((match = str.match(pat))){
				tz = match[1];
			}
		}
	}

	// Make sure it doesn't somehow end up return AM or PM
	return (tz == 'AM' || tz == 'PM') ? '' : tz; // String
}

// Utility methods to do arithmetic calculations with Dates

dojo.date.compare = function(/*Date*/date1, /*Date?*/date2, /*String?*/portion){
	//	summary:
	//		Compare two date objects by date, time, or both.
	//	description:
	//  	Returns 0 if equal, positive if a > b, else negative.
	//	date1:
	//		Date object
	//	date2:
	//		Date object.  If not specified, the current Date is used.
	//	portion:
	//		A string indicating the "date" or "time" portion of a Date object.
	//		Compares both "date" and "time" by default.  One of the following:
	//		"date", "time", "datetime"

	// Extra step required in copy for IE - see #3112
	date1 = new Date(Number(date1));
	date2 = new Date(Number(date2 || new Date()));

	if(portion !== "undefined"){
		if(portion == "date"){
			// Ignore times and compare dates.
			date1.setHours(0, 0, 0, 0);
			date2.setHours(0, 0, 0, 0);
		}else if(portion == "time"){
			// Ignore dates and compare times.
			date1.setFullYear(0, 0, 0);
			date2.setFullYear(0, 0, 0);
		}
	}
	
	if(date1 > date2){ return 1; } // int
	if(date1 < date2){ return -1; } // int
	return 0; // int
};

dojo.date.add = function(/*Date*/date, /*String*/interval, /*int*/amount){
	//	summary:
	//		Add to a Date in intervals of different size, from milliseconds to years
	//	date: Date
	//		Date object to start with
	//	interval:
	//		A string representing the interval.  One of the following:
	//			"year", "month", "day", "hour", "minute", "second",
	//			"millisecond", "quarter", "week", "weekday"
	//	amount:
	//		How much to add to the date.

	var sum = new Date(Number(date)); // convert to Number before copying to accomodate IE (#3112)
	var fixOvershoot = false;
	var property = "Date";

	switch(interval){
		case "day":
			break;
		case "weekday":
			//i18n FIXME: assumes Saturday/Sunday weekend, but this is not always true.  see dojo.cldr.supplemental

			// Divide the increment time span into weekspans plus leftover days
			// e.g., 8 days is one 5-day weekspan / and two leftover days
			// Can't have zero leftover days, so numbers divisible by 5 get
			// a days value of 5, and the remaining days make up the number of weeks
			var days, weeks;
			var mod = amount % 5;
			if(!mod){
				days = (amount > 0) ? 5 : -5;
				weeks = (amount > 0) ? ((amount-5)/5) : ((amount+5)/5);
			}else{
				days = mod;
				weeks = parseInt(amount/5);
			}
			// Get weekday value for orig date param
			var strt = date.getDay();
			// Orig date is Sat / positive incrementer
			// Jump over Sun
			var adj = 0;
			if(strt == 6 && amount > 0){
				adj = 1;
			}else if(strt == 0 && amount < 0){
			// Orig date is Sun / negative incrementer
			// Jump back over Sat
				adj = -1;
			}
			// Get weekday val for the new date
			var trgt = strt + days;
			// New date is on Sat or Sun
			if(trgt == 0 || trgt == 6){
				adj = (amount > 0) ? 2 : -2;
			}
			// Increment by number of weeks plus leftover days plus
			// weekend adjustments
			amount = (7 * weeks) + days + adj;
			break;
		case "year":
			property = "FullYear";
			// Keep increment/decrement from 2/29 out of March
			fixOvershoot = true;
			break;
		case "week":
			amount *= 7;
			break;
		case "quarter":
			// Naive quarter is just three months
			amount *= 3;
			// fallthrough...
		case "month":
			// Reset to last day of month if you overshoot
			fixOvershoot = true;
			property = "Month";
			break;
		case "hour":
		case "minute":
		case "second":
		case "millisecond":
			property = "UTC"+interval.charAt(0).toUpperCase() + interval.substring(1) + "s";
	}

	if(property){
		sum["set"+property](sum["get"+property]()+amount);
	}

	if(fixOvershoot && (sum.getDate() < date.getDate())){
		sum.setDate(0);
	}

	return sum; // Date
};

dojo.date.difference = function(/*Date*/date1, /*Date?*/date2, /*String?*/interval){
	//	summary:
	//		Get the difference in a specific unit of time (e.g., number of
	//		months, weeks, days, etc.) between two dates, rounded to the
	//		nearest integer.
	//	date1:
	//		Date object
	//	date2:
	//		Date object.  If not specified, the current Date is used.
	//	interval:
	//		A string representing the interval.  One of the following:
	//			"year", "month", "day", "hour", "minute", "second",
	//			"millisecond", "quarter", "week", "weekday"
	//		Defaults to "day".

	date2 = date2 || new Date();
	interval = interval || "day";
	var yearDiff = date2.getFullYear() - date1.getFullYear();
	var delta = 1; // Integer return value

	switch(interval){
		case "quarter":
			var m1 = date1.getMonth();
			var m2 = date2.getMonth();
			// Figure out which quarter the months are in
			var q1 = Math.floor(m1/3) + 1;
			var q2 = Math.floor(m2/3) + 1;
			// Add quarters for any year difference between the dates
			q2 += (yearDiff * 4);
			delta = q2 - q1;
			break;
		case "weekday":
			var days = Math.round(dojo.date.difference(date1, date2, "day"));
			var weeks = parseInt(dojo.date.difference(date1, date2, "week"));
			var mod = days % 7;

			// Even number of weeks
			if(mod == 0){
				days = weeks*5;
			}else{
				// Weeks plus spare change (< 7 days)
				var adj = 0;
				var aDay = date1.getDay();
				var bDay = date2.getDay();

				weeks = parseInt(days/7);
				mod = days % 7;
				// Mark the date advanced by the number of
				// round weeks (may be zero)
				var dtMark = new Date(date1);
				dtMark.setDate(dtMark.getDate()+(weeks*7));
				var dayMark = dtMark.getDay();

				// Spare change days -- 6 or less
				if(days > 0){
					switch(true){
						// Range starts on Sat
						case aDay == 6:
							adj = -1;
							break;
						// Range starts on Sun
						case aDay == 0:
							adj = 0;
							break;
						// Range ends on Sat
						case bDay == 6:
							adj = -1;
							break;
						// Range ends on Sun
						case bDay == 0:
							adj = -2;
							break;
						// Range contains weekend
						case (dayMark + mod) > 5:
							adj = -2;
					}
				}else if(days < 0){
					switch(true){
						// Range starts on Sat
						case aDay == 6:
							adj = 0;
							break;
						// Range starts on Sun
						case aDay == 0:
							adj = 1;
							break;
						// Range ends on Sat
						case bDay == 6:
							adj = 2;
							break;
						// Range ends on Sun
						case bDay == 0:
							adj = 1;
							break;
						// Range contains weekend
						case (dayMark + mod) < 0:
							adj = 2;
					}
				}
				days += adj;
				days -= (weeks*2);
			}
			delta = days;
			break;
		case "year":
			delta = yearDiff;
			break;
		case "month":
			delta = (date2.getMonth() - date1.getMonth()) + (yearDiff * 12);
			break;
		case "week":
			// Truncate instead of rounding
			// Don't use Math.floor -- value may be negative
			delta = parseInt(dojo.date.difference(date1, date2, "day")/7);
			break;
		case "day":
			delta /= 24;
			// fallthrough
		case "hour":
			delta /= 60;
			// fallthrough
		case "minute":
			delta /= 60;
			// fallthrough
		case "second":
			delta /= 1000;
			// fallthrough
		case "millisecond":
			delta *= date2.getTime() - date1.getTime();
	}

	// Round for fractional values and DST leaps
	return Math.round(delta); // Number (integer)
};

}

if(!dojo._hasResource["dojo.date.locale"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.date.locale"] = true;
dojo.provide("dojo.date.locale");

// Localization methods for Date.   Honor local customs using locale-dependent dojo.cldr data.







// Load the bundles containing localization information for
// names and formats


//NOTE: Everything in this module assumes Gregorian calendars.
// Other calendars will be implemented in separate modules.

(function(){
	// Format a pattern without literals
	function formatPattern(dateObject, bundle, fullYear, pattern){
		return pattern.replace(/([a-z])\1*/ig, function(match){
			var s, pad;
			var c = match.charAt(0);
			var l = match.length;
			var widthList = ["abbr", "wide", "narrow"];
			switch(c){
				case 'G':
					s = bundle[(l < 4) ? "eraAbbr" : "eraNames"][dateObject.getFullYear() < 0 ? 0 : 1];
					break;
				case 'y':
					s = dateObject.getFullYear();
					switch(l){
						case 1:
							break;
						case 2:
							if(!fullYear){
								s = String(s); s = s.substr(s.length - 2);
								break;
							}
							// fallthrough
						default:
							pad = true;
					}
					break;
				case 'Q':
				case 'q':
					s = Math.ceil((dateObject.getMonth()+1)/3);
//					switch(l){
//						case 1: case 2:
							pad = true;
//							break;
//						case 3: case 4: // unimplemented
//					}
					break;
				case 'M':
					var m = dateObject.getMonth();
					if(l<3){
						s = m+1; pad = true;
					}else{
						var propM = ["months", "format", widthList[l-3]].join("-");
						s = bundle[propM][m];
					}
					break;
				case 'w':
					var firstDay = 0;
					s = dojo.date.locale._getWeekOfYear(dateObject, firstDay); pad = true;
					break;
				case 'd':
					s = dateObject.getDate(); pad = true;
					break;
				case 'D':
					s = dojo.date.locale._getDayOfYear(dateObject); pad = true;
					break;
				case 'E':
					var d = dateObject.getDay();
					if(l<3){
						s = d+1; pad = true;
					}else{
						var propD = ["days", "format", widthList[l-3]].join("-");
						s = bundle[propD][d];
					}
					break;
				case 'a':
					var timePeriod = (dateObject.getHours() < 12) ? 'am' : 'pm';
					s = bundle[timePeriod];
					break;
				case 'h':
				case 'H':
				case 'K':
				case 'k':
					var h = dateObject.getHours();
					// strange choices in the date format make it impossible to write this succinctly
					switch (c){
						case 'h': // 1-12
							s = (h % 12) || 12;
							break;
						case 'H': // 0-23
							s = h;
							break;
						case 'K': // 0-11
							s = (h % 12);
							break;
						case 'k': // 1-24
							s = h || 24;
							break;
					}
					pad = true;
					break;
				case 'm':
					s = dateObject.getMinutes(); pad = true;
					break;
				case 's':
					s = dateObject.getSeconds(); pad = true;
					break;
				case 'S':
					s = Math.round(dateObject.getMilliseconds() * Math.pow(10, l-3)); pad = true;
					break;
				case 'v': // FIXME: don't know what this is. seems to be same as z?
				case 'z':
					// We only have one timezone to offer; the one from the browser
					s = dojo.date.getTimezoneName(dateObject);
					if(s){break;}
					l=4;
					// fallthrough... use GMT if tz not available
				case 'Z':
					var offset = dateObject.getTimezoneOffset();
					var tz = [
						(offset<=0 ? "+" : "-"),
						dojo.string.pad(Math.floor(Math.abs(offset)/60), 2),
						dojo.string.pad(Math.abs(offset)% 60, 2)
					];
					if(l==4){
						tz.splice(0, 0, "GMT");
						tz.splice(3, 0, ":");
					}
					s = tz.join("");
					break;
//				case 'Y': case 'u': case 'W': case 'F': case 'g': case 'A': case 'e':
//					console.debug(match+" modifier unimplemented");
				default:
					throw new Error("dojo.date.locale.format: invalid pattern char: "+pattern);
			}
			if(pad){ s = dojo.string.pad(s, l); }
			return s;
		});
	}

/*=====
	dojo.date.locale.__FormatOptions = function(){
	//	selector: String
	//		choice of 'time','date' (default: date and time)
	//	formatLength: String
	//		choice of long, short, medium or full (plus any custom additions).  Defaults to 'short'
	//	datePattern:String
	//		override pattern with this string
	//	timePattern:String
	//		override pattern with this string
	//	am: String
	//		override strings for am in times
	//	pm: String
	//		override strings for pm in times
	//	locale: String
	//		override the locale used to determine formatting rules
	//	fullYear: Boolean
	//		(format only) use 4 digit years whenever 2 digit years are called for
	//	strict: Boolean
	//		(parse only) strict parsing, off by default
		this.selector = selector;
		this.formatLength = formatLength;
		this.datePattern = datePattern;
		this.timePattern = timePattern;
		this.am = am;
		this.pm = pm;
		this.locale = locale;
		this.fullYear = fullYear;
		this.strict = strict;
	}
=====*/

dojo.date.locale.format = function(/*Date*/dateObject, /*dojo.date.locale.__FormatOptions?*/options){
	// summary:
	//		Format a Date object as a String, using locale-specific settings.
	//
	// description:
	//		Create a string from a Date object using a known localized pattern.
	//		By default, this method formats both date and time from dateObject.
	//		Formatting patterns are chosen appropriate to the locale.  Different
	//		formatting lengths may be chosen, with "full" used by default.
	//		Custom patterns may be used or registered with translations using
	//		the dojo.date.locale.addCustomFormats method.
	//		Formatting patterns are implemented using [the syntax described at
	//		unicode.org](http://www.unicode.org/reports/tr35/tr35-4.html#Date_Format_Patterns)
	//
	// dateObject:
	//		the date and/or time to be formatted.  If a time only is formatted,
	//		the values in the year, month, and day fields are irrelevant.  The
	//		opposite is true when formatting only dates.

	options = options || {};

	var locale = dojo.i18n.normalizeLocale(options.locale);
	var formatLength = options.formatLength || 'short';
	var bundle = dojo.date.locale._getGregorianBundle(locale);
	var str = [];
	var sauce = dojo.hitch(this, formatPattern, dateObject, bundle, options.fullYear);
	if(options.selector == "year"){
		// Special case as this is not yet driven by CLDR data
		var year = dateObject.getFullYear();
		if(locale.match(/^zh|^ja/)){
			year += "\u5E74";
		}
		return year;
	}
	if(options.selector != "time"){
		var datePattern = options.datePattern || bundle["dateFormat-"+formatLength];
		if(datePattern){str.push(_processPattern(datePattern, sauce));}
	}
	if(options.selector != "date"){
		var timePattern = options.timePattern || bundle["timeFormat-"+formatLength];
		if(timePattern){str.push(_processPattern(timePattern, sauce));}
	}
	var result = str.join(" "); //TODO: use locale-specific pattern to assemble date + time
	return result; // String
};

dojo.date.locale.regexp = function(/*dojo.date.locale.__FormatOptions?*/options){
	// summary:
	//		Builds the regular needed to parse a localized date

	return dojo.date.locale._parseInfo(options).regexp; // String
};

dojo.date.locale._parseInfo = function(/*dojo.date.locale.__FormatOptions?*/options){
	options = options || {};
	var locale = dojo.i18n.normalizeLocale(options.locale);
	var bundle = dojo.date.locale._getGregorianBundle(locale);
	var formatLength = options.formatLength || 'short';
	var datePattern = options.datePattern || bundle["dateFormat-" + formatLength];
	var timePattern = options.timePattern || bundle["timeFormat-" + formatLength];
	var pattern;
	if(options.selector == 'date'){
		pattern = datePattern;
	}else if(options.selector == 'time'){
		pattern = timePattern;
	}else{
		pattern = datePattern + ' ' + timePattern; //TODO: use locale-specific pattern to assemble date + time
	}

	var tokens = [];
	var re = _processPattern(pattern, dojo.hitch(this, _buildDateTimeRE, tokens, bundle, options));
	return {regexp: re, tokens: tokens, bundle: bundle};
};

dojo.date.locale.parse = function(/*String*/value, /*dojo.date.locale.__FormatOptions?*/options){
	// summary:
	//		Convert a properly formatted string to a primitive Date object,
	//		using locale-specific settings.
	//
	// description:
	//		Create a Date object from a string using a known localized pattern.
	//		By default, this method parses looking for both date and time in the string.
	//		Formatting patterns are chosen appropriate to the locale.  Different
	//		formatting lengths may be chosen, with "full" used by default.
	//		Custom patterns may be used or registered with translations using
	//		the dojo.date.locale.addCustomFormats method.
	//	
	//		Formatting patterns are implemented using [the syntax described at
	//		unicode.org](http://www.unicode.org/reports/tr35/tr35-4.html#Date_Format_Patterns)
	//		When two digit years are used, a century is chosen according to a sliding 
	//		window of 80 years before and 20 years after present year, for both `yy` and `yyyy` patterns.
	//		year < 100CE requires strict mode.
	//
	// value:
	//		A string representation of a date

	var info = dojo.date.locale._parseInfo(options);
	var tokens = info.tokens, bundle = info.bundle;
	var re = new RegExp("^" + info.regexp + "$", info.strict ? "" : "i");
	var match = re.exec(value);
	if(!match){ return null; } // null

	var widthList = ['abbr', 'wide', 'narrow'];
	var result = [1970,0,1,0,0,0,0]; // will get converted to a Date at the end
	var amPm = "";
	var valid = dojo.every(match, function(v, i){
		if(!i){return true;}
		var token=tokens[i-1];
		var l=token.length;
		switch(token.charAt(0)){
			case 'y':
				if(l != 2 && options.strict){
					//interpret year literally, so '5' would be 5 A.D.
					result[0] = v;
				}else{
					if(v<100){
						v = Number(v);
						//choose century to apply, according to a sliding window
						//of 80 years before and 20 years after present year
						var year = '' + new Date().getFullYear();
						var century = year.substring(0, 2) * 100;
						var cutoff = Math.min(Number(year.substring(2, 4)) + 20, 99);
						var num = (v < cutoff) ? century + v : century - 100 + v;
						result[0] = num;
					}else{
						//we expected 2 digits and got more...
						if(options.strict){
							return false;
						}
						//interpret literally, so '150' would be 150 A.D.
						//also tolerate '1950', if 'yyyy' input passed to 'yy' format
						result[0] = v;
					}
				}
				break;
			case 'M':
				if(l>2){
					var months = bundle['months-format-' + widthList[l-3]].concat();
					if(!options.strict){
						//Tolerate abbreviating period in month part
						//Case-insensitive comparison
						v = v.replace(".","").toLowerCase();
						months = dojo.map(months, function(s){ return s.replace(".","").toLowerCase(); } );
					}
					v = dojo.indexOf(months, v);
					if(v == -1){
//						console.debug("dojo.date.locale.parse: Could not parse month name: '" + v + "'.");
						return false;
					}
				}else{
					v--;
				}
				result[1] = v;
				break;
			case 'E':
			case 'e':
				var days = bundle['days-format-' + widthList[l-3]].concat();
				if(!options.strict){
					//Case-insensitive comparison
					v = v.toLowerCase();
					days = dojo.map(days, function(d){return d.toLowerCase();});
				}
				v = dojo.indexOf(days, v);
				if(v == -1){
//					console.debug("dojo.date.locale.parse: Could not parse weekday name: '" + v + "'.");
					return false;
				}

				//TODO: not sure what to actually do with this input,
				//in terms of setting something on the Date obj...?
				//without more context, can't affect the actual date
				//TODO: just validate?
				break;
			case 'D':
				result[1] = 0;
				// fallthrough...
			case 'd':
				result[2] = v;
				break;
			case 'a': //am/pm
				var am = options.am || bundle.am;
				var pm = options.pm || bundle.pm;
				if(!options.strict){
					var period = /\./g;
					v = v.replace(period,'').toLowerCase();
					am = am.replace(period,'').toLowerCase();
					pm = pm.replace(period,'').toLowerCase();
				}
				if(options.strict && v != am && v != pm){
//					console.debug("dojo.date.locale.parse: Could not parse am/pm part.");
					return false;
				}

				// we might not have seen the hours field yet, so store the state and apply hour change later
				amPm = (v == pm) ? 'p' : (v == am) ? 'a' : '';
				break;
			case 'K': //hour (1-24)
				if(v == 24){ v = 0; }
				// fallthrough...
			case 'h': //hour (1-12)
			case 'H': //hour (0-23)
			case 'k': //hour (0-11)
				//TODO: strict bounds checking, padding
				if(v > 23){
//					console.debug("dojo.date.locale.parse: Illegal hours value");
					return false;
				}

				//in the 12-hour case, adjusting for am/pm requires the 'a' part
				//which could come before or after the hour, so we will adjust later
				result[3] = v;
				break;
			case 'm': //minutes
				result[4] = v;
				break;
			case 's': //seconds
				result[5] = v;
				break;
			case 'S': //milliseconds
				result[6] = v;
//				break;
//			case 'w':
//TODO				var firstDay = 0;
//			default:
//TODO: throw?
//				console.debug("dojo.date.locale.parse: unsupported pattern char=" + token.charAt(0));
		}
		return true;
	});

	var hours = +result[3];
	if(amPm === 'p' && hours < 12){
		result[3] = hours + 12; //e.g., 3pm -> 15
	}else if(amPm === 'a' && hours == 12){
		result[3] = 0; //12am -> 0
	}

	//TODO: implement a getWeekday() method in order to test 
	//validity of input strings containing 'EEE' or 'EEEE'...

	var dateObject = new Date(result[0], result[1], result[2], result[3], result[4], result[5], result[6]); // Date
	if(options.strict){
		dateObject.setFullYear(result[0]);
	}

	// Check for overflow.  The Date() constructor normalizes things like April 32nd...
	//TODO: why isn't this done for times as well?
	var allTokens = tokens.join("");
	if(!valid ||
		(allTokens.indexOf('M') != -1 && dateObject.getMonth() != result[1]) ||
		(allTokens.indexOf('d') != -1 && dateObject.getDate() != result[2])){
		return null;
	}

	return dateObject; // Date
};

function _processPattern(pattern, applyPattern, applyLiteral, applyAll){
	//summary: Process a pattern with literals in it

	// Break up on single quotes, treat every other one as a literal, except '' which becomes '
	var identity = function(x){return x;};
	applyPattern = applyPattern || identity;
	applyLiteral = applyLiteral || identity;
	applyAll = applyAll || identity;

	//split on single quotes (which escape literals in date format strings) 
	//but preserve escaped single quotes (e.g., o''clock)
	var chunks = pattern.match(/(''|[^'])+/g); 
	var literal = pattern.charAt(0) == "'";

	dojo.forEach(chunks, function(chunk, i){
		if(!chunk){
			chunks[i]='';
		}else{
			chunks[i]=(literal ? applyLiteral : applyPattern)(chunk);
			literal = !literal;
		}
	});
	return applyAll(chunks.join(''));
}

function _buildDateTimeRE(tokens, bundle, options, pattern){
	pattern = dojo.regexp.escapeString(pattern);
	if(!options.strict){ pattern = pattern.replace(" a", " ?a"); } // kludge to tolerate no space before am/pm
	return pattern.replace(/([a-z])\1*/ig, function(match){
		// Build a simple regexp.  Avoid captures, which would ruin the tokens list
		var s;
		var c = match.charAt(0);
		var l = match.length;
		var p2 = '', p3 = '';
		if(options.strict){
			if(l > 1){ p2 = '0' + '{'+(l-1)+'}'; }
			if(l > 2){ p3 = '0' + '{'+(l-2)+'}'; }
		}else{
			p2 = '0?'; p3 = '0{0,2}';
		}
		switch(c){
			case 'y':
				s = '\\d{2,4}';
				break;
			case 'M':
				s = (l>2) ? '\\S+?' : p2+'[1-9]|1[0-2]';
				break;
			case 'D':
				s = p2+'[1-9]|'+p3+'[1-9][0-9]|[12][0-9][0-9]|3[0-5][0-9]|36[0-6]';
				break;
			case 'd':
				s = '[12]\\d|'+p2+'[1-9]|3[01]';
				break;
			case 'w':
				s = p2+'[1-9]|[1-4][0-9]|5[0-3]';
				break;
		    case 'E':
				s = '\\S+';
				break;
			case 'h': //hour (1-12)
				s = p2+'[1-9]|1[0-2]';
				break;
			case 'k': //hour (0-11)
				s = p2+'\\d|1[01]';
				break;
			case 'H': //hour (0-23)
				s = p2+'\\d|1\\d|2[0-3]';
				break;
			case 'K': //hour (1-24)
				s = p2+'[1-9]|1\\d|2[0-4]';
				break;
			case 'm':
			case 's':
				s = '[0-5]\\d';
				break;
			case 'S':
				s = '\\d{'+l+'}';
				break;
			case 'a':
				var am = options.am || bundle.am || 'AM';
				var pm = options.pm || bundle.pm || 'PM';
				if(options.strict){
					s = am + '|' + pm;
				}else{
					s = am + '|' + pm;
					if(am != am.toLowerCase()){ s += '|' + am.toLowerCase(); }
					if(pm != pm.toLowerCase()){ s += '|' + pm.toLowerCase(); }
					if(s.indexOf('.') != -1){ s += '|' + s.replace(/\./g, ""); }
				}
				s = s.replace(/\./g, "\\.");
				break;
			default:
			// case 'v':
			// case 'z':
			// case 'Z':
				s = ".*";
//				console.debug("parse of date format, pattern=" + pattern);
		}

		if(tokens){ tokens.push(match); }

		return "(" + s + ")"; // add capture
	}).replace(/[\xa0 ]/g, "[\\s\\xa0]"); // normalize whitespace.  Need explicit handling of \xa0 for IE.
}
})();

(function(){
var _customFormats = [];
dojo.date.locale.addCustomFormats = function(/*String*/packageName, /*String*/bundleName){
	// summary:
	//		Add a reference to a bundle containing localized custom formats to be
	//		used by date/time formatting and parsing routines.
	//
	// description:
	//		The user may add custom localized formats where the bundle has properties following the
	//		same naming convention used by dojo.cldr: `dateFormat-xxxx` / `timeFormat-xxxx`
	//		The pattern string should match the format used by the CLDR.
	//		See dojo.date.locale.format() for details.
	//		The resources must be loaded by dojo.requireLocalization() prior to use

	_customFormats.push({pkg:packageName,name:bundleName});
};

dojo.date.locale._getGregorianBundle = function(/*String*/locale){
	var gregorian = {};
	dojo.forEach(_customFormats, function(desc){
		var bundle = dojo.i18n.getLocalization(desc.pkg, desc.name, locale);
		gregorian = dojo.mixin(gregorian, bundle);
	}, this);
	return gregorian; /*Object*/
};
})();

dojo.date.locale.addCustomFormats("dojo.cldr","gregorian");

dojo.date.locale.getNames = function(/*String*/item, /*String*/type, /*String?*/context, /*String?*/locale){
	// summary:
	//		Used to get localized strings from dojo.cldr for day or month names.
	//
	// item:
	//	'months' || 'days'
	// type:
	//	'wide' || 'narrow' || 'abbr' (e.g. "Monday", "Mon", or "M" respectively, in English)
	// context:
	//	'standAlone' || 'format' (default)
	// locale:
	//	override locale used to find the names

	var label;
	var lookup = dojo.date.locale._getGregorianBundle(locale);
	var props = [item, context, type];
	if(context == 'standAlone'){
		var key = props.join('-');
		label = lookup[key];
		// Fall back to 'format' flavor of name
		if(label[0] == 1){ label = undefined; } // kludge, in the absense of real aliasing support in dojo.cldr
	}
	props[1] = 'format';

	// return by copy so changes won't be made accidentally to the in-memory model
	return (label || lookup[props.join('-')]).concat(); /*Array*/
};

dojo.date.locale.displayPattern = function(/*String*/fixedPattern, /*String?*/locale){
	// summary:
	//	Provides a localized representation of a date/time pattern string
	//
	// description:
	//	Takes a date/time pattern string like "MM/dd/yyyy" and substitutes
	//	the letters appropriate to show a user in a particular locale, as
	//	defined in [the CLDR specification](http://www.unicode.org/reports/tr35/tr35-4.html#Date_Format_Patterns)
	// fixedPattern:
	//	A date string using symbols from this set: "GyMdkHmsSEDFwWahKzYeugAZvcL"
	// locale:
	//	use a special locale, otherwise takes the default

	var fixed = "GyMdkHmsSEDFwWahKzYeugAZvcL",
		local = dojo.date.locale._getGregorianBundle(locale).patternChars;
	return dojo.map(fixedPattern, function(c){
		 var i = fixed.indexOf(c);
		 return i < 0 ? c : local.charAt(i);
	}).join(""); // String
}

dojo.date.locale.isWeekend = function(/*Date?*/dateObject, /*String?*/locale){
	// summary:
	//	Determines if the date falls on a weekend, according to local custom.

	var weekend = dojo.cldr.supplemental.getWeekend(locale);
	var day = (dateObject || new Date()).getDay();
	if(weekend.end < weekend.start){
		weekend.end += 7;
		if(day < weekend.start){ day += 7; }
	}
	return day >= weekend.start && day <= weekend.end; // Boolean
};

// These are used only by format and strftime.  Do they need to be public?  Which module should they go in?

dojo.date.locale._getDayOfYear = function(/*Date*/dateObject){
	// summary: gets the day of the year as represented by dateObject
	return dojo.date.difference(new Date(dateObject.getFullYear(), 0, 1, dateObject.getHours()), dateObject) + 1; // Number
};

dojo.date.locale._getWeekOfYear = function(/*Date*/dateObject, /*Number*/firstDayOfWeek){
	if(arguments.length == 1){ firstDayOfWeek = 0; } // Sunday

	var firstDayOfYear = new Date(dateObject.getFullYear(), 0, 1).getDay();
	var adj = (firstDayOfYear - firstDayOfWeek + 7) % 7;
	var week = Math.floor((dojo.date.locale._getDayOfYear(dateObject) + adj - 1) / 7);

	// if year starts on the specified day, start counting weeks at 1
	if(firstDayOfYear == firstDayOfWeek){ week++; }

	return week; // Number
};

}

if(!dojo._hasResource["dijit._Templated"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._Templated"] = true;
dojo.provide("dijit._Templated");





dojo.declare("dijit._Templated",
	null,
	{
		//	summary:
		//		Mixin for widgets that are instantiated from a template
		// 

		// templateString: String
		//		a string that represents the widget template. Pre-empts the
		//		templatePath. In builds that have their strings "interned", the
		//		templatePath is converted to an inline templateString, thereby
		//		preventing a synchronous network call.
		templateString: null,

		// templatePath: String
		//	Path to template (HTML file) for this widget relative to dojo.baseUrl
		templatePath: null,

		// widgetsInTemplate: Boolean
		//		should we parse the template to find widgets that might be
		//		declared in markup inside it? false by default.
		widgetsInTemplate: false,

		// skipNodeCache: Boolean
		//		if using a cached widget template node poses issues for a
		//		particular widget class, it can set this property to ensure
		//		that its template is always re-built from a string
		_skipNodeCache: false,

		_stringRepl: function(tmpl){
			var className = this.declaredClass, _this = this;
			// Cache contains a string because we need to do property replacement
			// do the property replacement
			return dojo.string.substitute(tmpl, this, function(value, key){
				if(key.charAt(0) == '!'){ value = dojo.getObject(key.substr(1), _this); }
				if(typeof value == "undefined"){ throw new Error(className+" template:"+key); } // a debugging aide
				if(value == null){ return ""; }

				// Substitution keys beginning with ! will skip the transform step,
				// in case a user wishes to insert unescaped markup, e.g. ${!foo}
				return key.charAt(0) == "!" ? value :
					// Safer substitution, see heading "Attribute values" in
					// http://www.w3.org/TR/REC-html40/appendix/notes.html#h-B.3.2
					value.toString().replace(/"/g,"&quot;"); //TODO: add &amp? use encodeXML method?
			}, this);
		},

		// method over-ride
		buildRendering: function(){
			// summary:
			//		Construct the UI for this widget from a template, setting this.domNode.

			// Lookup cached version of template, and download to cache if it
			// isn't there already.  Returns either a DomNode or a string, depending on
			// whether or not the template contains ${foo} replacement parameters.
			var cached = dijit._Templated.getCachedTemplate(this.templatePath, this.templateString, this._skipNodeCache);

			var node;
			if(dojo.isString(cached)){
				node = dijit._Templated._createNodesFromText(this._stringRepl(cached))[0];
			}else{
				// if it's a node, all we have to do is clone it
				node = cached.cloneNode(true);
			}

			this.domNode = node;

			// recurse through the node, looking for, and attaching to, our
			// attachment points and events, which should be defined on the template node.
			this._attachTemplateNodes(node);

			var source = this.srcNodeRef;
			if(source && source.parentNode){
				source.parentNode.replaceChild(node, source);
			}

			if(this.widgetsInTemplate){
				var cw = (this._supportingWidgets = dojo.parser.parse(node));
				this._attachTemplateNodes(cw, function(n,p){
					return n[p];
				});
			}

			this._fillContent(source);
		},

		_fillContent: function(/*DomNode*/ source){
			// summary:
			//		relocate source contents to templated container node
			//		this.containerNode must be able to receive children, or exceptions will be thrown
			var dest = this.containerNode;
			if(source && dest){
				while(source.hasChildNodes()){
					dest.appendChild(source.firstChild);
				}
			}
		},

		_attachTemplateNodes: function(rootNode, getAttrFunc){
			// summary: Iterate through the template and attach functions and nodes accordingly.	
			// description:		
			//		Map widget properties and functions to the handlers specified in
			//		the dom node and it's descendants. This function iterates over all
			//		nodes and looks for these properties:
			//			* dojoAttachPoint
			//			* dojoAttachEvent	
			//			* waiRole
			//			* waiState
			// rootNode: DomNode|Array[Widgets]
			//		the node to search for properties. All children will be searched.
			// getAttrFunc: function?
			//		a function which will be used to obtain property for a given
			//		DomNode/Widget

			getAttrFunc = getAttrFunc || function(n,p){ return n.getAttribute(p); };

			var nodes = dojo.isArray(rootNode) ? rootNode : (rootNode.all || rootNode.getElementsByTagName("*"));
			var x = dojo.isArray(rootNode) ? 0 : -1;
			var attrs = {};
			for(; x<nodes.length; x++){
				var baseNode = (x == -1) ? rootNode : nodes[x];
				if(this.widgetsInTemplate && getAttrFunc(baseNode, "dojoType")){
					continue;
				}
				// Process dojoAttachPoint
				var attachPoint = getAttrFunc(baseNode, "dojoAttachPoint");
				if(attachPoint){
					var point, points = attachPoint.split(/\s*,\s*/);
					while((point = points.shift())){
						if(dojo.isArray(this[point])){
							this[point].push(baseNode);
						}else{
							this[point]=baseNode;
						}
					}
				}

				// Process dojoAttachEvent
				var attachEvent = getAttrFunc(baseNode, "dojoAttachEvent");
				if(attachEvent){
					// NOTE: we want to support attributes that have the form
					// "domEvent: nativeEvent; ..."
					var event, events = attachEvent.split(/\s*,\s*/);
					var trim = dojo.trim;
					while((event = events.shift())){
						if(event){
							var thisFunc = null;
							if(event.indexOf(":") != -1){
								// oh, if only JS had tuple assignment
								var funcNameArr = event.split(":");
								event = trim(funcNameArr[0]);
								thisFunc = trim(funcNameArr[1]);
							}else{
								event = trim(event);
							}
							if(!thisFunc){
								thisFunc = event;
							}
							this.connect(baseNode, event, thisFunc);
						}
					}
				}

				// waiRole, waiState
				var role = getAttrFunc(baseNode, "waiRole");
				if(role){
					dijit.setWaiRole(baseNode, role);
				}
				var values = getAttrFunc(baseNode, "waiState");
				if(values){
					dojo.forEach(values.split(/\s*,\s*/), function(stateValue){
						if(stateValue.indexOf('-') != -1){
							var pair = stateValue.split('-');
							dijit.setWaiState(baseNode, pair[0], pair[1]);
						}
					});
				}
			}
		}
	}
);

// key is either templatePath or templateString; object is either string or DOM tree
dijit._Templated._templateCache = {};

dijit._Templated.getCachedTemplate = function(templatePath, templateString, alwaysUseString){
	// summary:
	//		Static method to get a template based on the templatePath or
	//		templateString key
	// templatePath: String
	//		The URL to get the template from. dojo.uri.Uri is often passed as well.
	// templateString: String?
	//		a string to use in lieu of fetching the template from a URL. Takes precedence
	//		over templatePath
	// Returns: Mixed
	//	Either string (if there are ${} variables that need to be replaced) or just
	//	a DOM tree (if the node can be cloned directly)

	// is it already cached?
	var tmplts = dijit._Templated._templateCache;
	var key = templateString || templatePath;
	var cached = tmplts[key];
	if(cached){
		if(!cached.ownerDocument || cached.ownerDocument == dojo.doc){
			// string or node of the same document
			return cached;
		}
		// destroy the old cached node of a different document
		dojo._destroyElement(cached);
	}

	// If necessary, load template string from template path
	if(!templateString){
		templateString = dijit._Templated._sanitizeTemplateString(dojo._getText(templatePath));
	}

	templateString = dojo.string.trim(templateString);

	if(alwaysUseString || templateString.match(/\$\{([^\}]+)\}/g)){
		// there are variables in the template so all we can do is cache the string
		return (tmplts[key] = templateString); //String
	}else{
		// there are no variables in the template so we can cache the DOM tree
		return (tmplts[key] = dijit._Templated._createNodesFromText(templateString)[0]); //Node
	}
};

dijit._Templated._sanitizeTemplateString = function(/*String*/tString){
	// summary: 
	//		Strips <?xml ...?> declarations so that external SVG and XML
	// 		documents can be added to a document without worry. Also, if the string
	//		is an HTML document, only the part inside the body tag is returned.
	if(tString){
		tString = tString.replace(/^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im, "");
		var matches = tString.match(/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im);
		if(matches){
			tString = matches[1];
		}
	}else{
		tString = "";
	}
	return tString; //String
};


if(dojo.isIE){
	dojo.addOnWindowUnload(function(){
		var cache = dijit._Templated._templateCache;
		for(var key in cache){
			var value = cache[key];
			if(!isNaN(value.nodeType)){ // isNode equivalent
				dojo._destroyElement(value);
			}
			delete cache[key];
		}
	});
}

(function(){
	var tagMap = {
		cell: {re: /^<t[dh][\s\r\n>]/i, pre: "<table><tbody><tr>", post: "</tr></tbody></table>"},
		row: {re: /^<tr[\s\r\n>]/i, pre: "<table><tbody>", post: "</tbody></table>"},
		section: {re: /^<(thead|tbody|tfoot)[\s\r\n>]/i, pre: "<table>", post: "</table>"}
	};

	// dummy container node used temporarily to hold nodes being created
	var tn;

	dijit._Templated._createNodesFromText = function(/*String*/text){
		// summary:
		//	Attempts to create a set of nodes based on the structure of the passed text.

		if(tn && tn.ownerDocument != dojo.doc){
			// destroy dummy container of a different document
			dojo._destroyElement(tn);
			tn = undefined;
		}
		if(!tn){
			tn = dojo.doc.createElement("div");
			tn.style.display="none";
			dojo.body().appendChild(tn);
		}
		var tableType = "none";
		var rtext = text.replace(/^\s+/, "");
		for(var type in tagMap){
			var map = tagMap[type];
			if(map.re.test(rtext)){
				tableType = type;
				text = map.pre + text + map.post;
				break;
			}
		}

		tn.innerHTML = text;
		if(tn.normalize){
			tn.normalize();
		}

		var tag = { cell: "tr", row: "tbody", section: "table" }[tableType];
		var _parent = (typeof tag != "undefined") ?
						tn.getElementsByTagName(tag)[0] :
						tn;

		var nodes = [];
		while(_parent.firstChild){
			nodes.push(_parent.removeChild(_parent.firstChild));
		}
		tn.innerHTML="";
		return nodes;	//	Array
	}
})();

// These arguments can be specified for widgets which are used in templates.
// Since any widget can be specified as sub widgets in template, mix it
// into the base widget class.  (This is a hack, but it's effective.)
dojo.extend(dijit._Widget,{
	dojoAttachEvent: "",
	dojoAttachPoint: "",
	waiRole: "",
	waiState:""
})

}

if(!dojo._hasResource["dijit._Calendar"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit._Calendar"] = true;
dojo.provide("dijit._Calendar");








dojo.declare(
	"dijit._Calendar",
	[dijit._Widget, dijit._Templated],
	{
	//	
	//	summary:
	//		A simple GUI for choosing a date in the context of a monthly calendar.
	//
	//	description:
	//		A simple GUI for choosing a date in the context of a monthly calendar.
	//		This widget is used internally by other widgets and is not accessible
	//		as a standalone widget.
	//		This widget can't be used in a form because it doesn't serialize the date to an
	//		`<input>` field.  For a form element, use dijit.form.DateTextBox instead.
	//
	//		Note that the parser takes all dates attributes passed in the
	//		[RFC 3339 format](http://www.faqs.org/rfcs/rfc3339.html), e.g. `2005-06-30T08:05:00-07:00`
	//		so that they are serializable and locale-independent.
	//
	//	example:
	//	|	var calendar = new dijit._Calendar({}, dojo.byId("calendarNode"));
	//
	//	example:
	//	|	<div dojoType="dijit._Calendar"></div>
	//	
		templateString:"<table cellspacing=\"0\" cellpadding=\"0\" class=\"dijitCalendarContainer\">\n\t<thead>\n\t\t<tr class=\"dijitReset dijitCalendarMonthContainer\" valign=\"top\">\n\t\t\t<th class='dijitReset' dojoAttachPoint=\"decrementMonth\">\n\t\t\t\t<img src=\"${_blankGif}\" alt=\"\" class=\"dijitCalendarIncrementControl dijitCalendarDecrease\" waiRole=\"presentation\">\n\t\t\t\t<span dojoAttachPoint=\"decreaseArrowNode\" class=\"dijitA11ySideArrow\">-</span>\n\t\t\t</th>\n\t\t\t<th class='dijitReset' colspan=\"5\">\n\t\t\t\t<div dojoAttachPoint=\"monthLabelSpacer\" class=\"dijitCalendarMonthLabelSpacer\"></div>\n\t\t\t\t<div dojoAttachPoint=\"monthLabelNode\" class=\"dijitCalendarMonthLabel\"></div>\n\t\t\t</th>\n\t\t\t<th class='dijitReset' dojoAttachPoint=\"incrementMonth\">\n\t\t\t\t<img src=\"${_blankGif}\" alt=\"\" class=\"dijitCalendarIncrementControl dijitCalendarIncrease\" waiRole=\"presentation\">\n\t\t\t\t<span dojoAttachPoint=\"increaseArrowNode\" class=\"dijitA11ySideArrow\">+</span>\n\t\t\t</th>\n\t\t</tr>\n\t\t<tr>\n\t\t\t<th class=\"dijitReset dijitCalendarDayLabelTemplate\"><span class=\"dijitCalendarDayLabel\"></span></th>\n\t\t</tr>\n\t</thead>\n\t<tbody dojoAttachEvent=\"onclick: _onDayClick, onmouseover: _onDayMouseOver, onmouseout: _onDayMouseOut\" class=\"dijitReset dijitCalendarBodyContainer\">\n\t\t<tr class=\"dijitReset dijitCalendarWeekTemplate\">\n\t\t\t<td class=\"dijitReset dijitCalendarDateTemplate\"><span class=\"dijitCalendarDateLabel\"></span></td>\n\t\t</tr>\n\t</tbody>\n\t<tfoot class=\"dijitReset dijitCalendarYearContainer\">\n\t\t<tr>\n\t\t\t<td class='dijitReset' valign=\"top\" colspan=\"7\">\n\t\t\t\t<h3 class=\"dijitCalendarYearLabel\">\n\t\t\t\t\t<span dojoAttachPoint=\"previousYearLabelNode\" class=\"dijitInline dijitCalendarPreviousYear\"></span>\n\t\t\t\t\t<span dojoAttachPoint=\"currentYearLabelNode\" class=\"dijitInline dijitCalendarSelectedYear\"></span>\n\t\t\t\t\t<span dojoAttachPoint=\"nextYearLabelNode\" class=\"dijitInline dijitCalendarNextYear\"></span>\n\t\t\t\t</h3>\n\t\t\t</td>\n\t\t</tr>\n\t</tfoot>\n</table>\t\n",

		// value: Date
		// 	the currently selected Date
		value: new Date(),

		// dayWidth: String
		// 	How to represent the days of the week in the calendar header. See dojo.date.locale
		dayWidth: "narrow",

		setValue: function(/*Date*/ value){
			dojo.deprecated("dijit.Calendar:setValue() is deprecated.  Use attr('value', ...) instead.", "", "2.0");
			this.attr('value', value);
		},
		_setValueAttr: function(/*Date*/ value){
			// summary:
			//		Hook to make attr("value", ...) work.
			// description:
			// 		Set the current date and update the UI.  If the date is disabled, the selection will
			//		not change, but the display will change to the corresponding month.
			if(!this.value || dojo.date.compare(value, this.value)){
				value = new Date(value);
				this.displayMonth = new Date(value);
				if(!this.isDisabledDate(value, this.lang)){
					this.value = value;
					this.value.setHours(0,0,0,0);
					this.onChange(this.value);
				}
				this._populateGrid();
			}
		},

		_setText: function(node, text){
			while(node.firstChild){
				node.removeChild(node.firstChild);
			}
			node.appendChild(dojo.doc.createTextNode(text));
		},

		_populateGrid: function(){
			var month = this.displayMonth;
			month.setDate(1);
			var firstDay = month.getDay();
			var daysInMonth = dojo.date.getDaysInMonth(month);
			var daysInPreviousMonth = dojo.date.getDaysInMonth(dojo.date.add(month, "month", -1));
			var today = new Date();
			var selected = this.value;

			var dayOffset = dojo.cldr.supplemental.getFirstDayOfWeek(this.lang);
			if(dayOffset > firstDay){ dayOffset -= 7; }

			// Iterate through dates in the calendar and fill in date numbers and style info
			dojo.query(".dijitCalendarDateTemplate", this.domNode).forEach(function(template, i){
				i += dayOffset;
				var date = new Date(month);
				var number, clazz = "dijitCalendar", adj = 0;

				if(i < firstDay){
					number = daysInPreviousMonth - firstDay + i + 1;
					adj = -1;
					clazz += "Previous";
				}else if(i >= (firstDay + daysInMonth)){
					number = i - firstDay - daysInMonth + 1;
					adj = 1;
					clazz += "Next";
				}else{
					number = i - firstDay + 1;
					clazz += "Current";
				}

				if(adj){
					date = dojo.date.add(date, "month", adj);
				}
				date.setDate(number);

				if(!dojo.date.compare(date, today, "date")){
					clazz = "dijitCalendarCurrentDate " + clazz;
				}

				if(!dojo.date.compare(date, selected, "date")){
					clazz = "dijitCalendarSelectedDate " + clazz;
				}

				if(this.isDisabledDate(date, this.lang)){
					clazz = "dijitCalendarDisabledDate " + clazz;
				}

				var clazz2 = this.getClassForDate(date, this.lang);
				if(clazz2){
					clazz = clazz2 + " " + clazz;
				}

				template.className =  clazz + "Month dijitCalendarDateTemplate";
				template.dijitDateValue = date.valueOf();
				var label = dojo.query(".dijitCalendarDateLabel", template)[0];
				this._setText(label, date.getDate());
			}, this);

			// Fill in localized month name
			var monthNames = dojo.date.locale.getNames('months', 'wide', 'standAlone', this.lang);
			this._setText(this.monthLabelNode, monthNames[month.getMonth()]);

			// Fill in localized prev/current/next years
			var y = month.getFullYear() - 1;
			var d = new Date();
			dojo.forEach(["previous", "current", "next"], function(name){
				d.setFullYear(y++);
				this._setText(this[name+"YearLabelNode"],
					dojo.date.locale.format(d, {selector:'year', locale:this.lang}));
			}, this);

			// Set up repeating mouse behavior
			var _this = this;
			var typematic = function(nodeProp, dateProp, adj){
				_this._connects.push(
					dijit.typematic.addMouseListener(_this[nodeProp], _this, function(count){
						if(count >= 0){ _this._adjustDisplay(dateProp, adj); }
					}, 0.8, 500)
				);
			};
			typematic("incrementMonth", "month", 1);
			typematic("decrementMonth", "month", -1);
			typematic("nextYearLabelNode", "year", 1);
			typematic("previousYearLabelNode", "year", -1);
		},

		goToToday: function(){
			this.attr('value', new Date());
		},

		postCreate: function(){
			this.inherited(arguments);
			dojo.setSelectable(this.domNode, false);

			var cloneClass = dojo.hitch(this, function(clazz, n){
				var template = dojo.query(clazz, this.domNode)[0];
	 			for(var i=0; i<n; i++){
					template.parentNode.appendChild(template.cloneNode(true));
				}
			});

			// clone the day label and calendar day templates 6 times to make 7 columns
			cloneClass(".dijitCalendarDayLabelTemplate", 6);
			cloneClass(".dijitCalendarDateTemplate", 6);

			// now make 6 week rows
			cloneClass(".dijitCalendarWeekTemplate", 5);

			// insert localized day names in the header
			var dayNames = dojo.date.locale.getNames('days', this.dayWidth, 'standAlone', this.lang);
			var dayOffset = dojo.cldr.supplemental.getFirstDayOfWeek(this.lang);
			dojo.query(".dijitCalendarDayLabel", this.domNode).forEach(function(label, i){
				this._setText(label, dayNames[(i + dayOffset) % 7]);
			}, this);

			// Fill in spacer element with all the month names (invisible) so that the maximum width will affect layout
			var monthNames = dojo.date.locale.getNames('months', 'wide', 'standAlone', this.lang);
			dojo.forEach(monthNames, function(name){
				var monthSpacer = dojo.doc.createElement("div");
				this._setText(monthSpacer, name);
				this.monthLabelSpacer.appendChild(monthSpacer);
			}, this);

			this.value = null;
			this.attr('value', new Date());
		},

		_adjustDisplay: function(/*String*/part, /*int*/amount){
			this.displayMonth = dojo.date.add(this.displayMonth, part, amount);
			this._populateGrid();
		},

		_onDayClick: function(/*Event*/evt){
			dojo.stopEvent(evt);
			for(var node = evt.target; node && !node.dijitDateValue; node = node.parentNode);
			if(node && !dojo.hasClass(node, "dijitCalendarDisabledDate")){
				this.attr('value', node.dijitDateValue);
				this.onValueSelected(this.value);
			}
		},

		_onDayMouseOver: function(/*Event*/evt){
			var node = evt.target;
			if(node && (node.dijitDateValue || node == this.previousYearLabelNode || node == this.nextYearLabelNode) ){
				dojo.addClass(node, "dijitCalendarHoveredDate");
				this._currentNode = node;
			}
		},

		_onDayMouseOut: function(/*Event*/evt){
			if(!this._currentNode){ return; }
			for(var node = evt.relatedTarget; node;){
				if(node == this._currentNode){ return; }
				try{
					node = node.parentNode;
				}catch(x){
					node = null;
				}
			}
			dojo.removeClass(this._currentNode, "dijitCalendarHoveredDate");
			this._currentNode = null;
		},

		onValueSelected: function(/*Date*/date){
			// summary: a date cell was selected.  It may be the same as the previous value.
		},

		onChange: function(/*Date*/date){
			// summary: called only when the selected date has changed
		},

		isDisabledDate: function(/*Date*/dateObject, /*String?*/locale){
			// summary:
			//	May be overridden to disable certain dates in the calendar e.g. `isDisabledDate=dojo.date.locale.isWeekend`
/*=====
			return false; // Boolean
=====*/
		},

		getClassForDate: function(/*Date*/dateObject, /*String?*/locale){
			// summary:
			//  May be overridden to return CSS classes to associate with the date entry for the given dateObject,
			//  for example to indicate a holiday in specified locale.

/*=====
			return ""; // String
=====*/
		}
	}
);

}

if(!dojo._hasResource["dijit.form._FormWidget"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.form._FormWidget"] = true;
dojo.provide("dijit.form._FormWidget");




dojo.declare("dijit.form._FormWidget", [dijit._Widget, dijit._Templated],
	{
	//
	// summary:
	//	_FormWidget's correspond to native HTML elements such as <checkbox> or <button>.
	//
	// description:
	//		Each _FormWidget represents a single HTML element.
	//		All these widgets should have these attributes just like native HTML input elements.
	//		You can set them during widget construction.
	//
	//	They also share some common methods.
	//
	// baseClass: String
	//		Root CSS class of the widget (ex: dijitTextBox), used to add CSS classes of widget
	//		(ex: "dijitTextBox dijitTextBoxInvalid dijitTextBoxFocused dijitTextBoxInvalidFocused")
	//		See _setStateClass().
	baseClass: "",

	// name: String
	//		Name used when submitting form; same as "name" attribute or plain HTML elements
	name: "",

	// alt: String
	//		Corresponds to the native HTML <input> element's attribute.
	alt: "",

	// value: String
	//		Corresponds to the native HTML <input> element's attribute.
	value: "",

	// type: String
	//		Corresponds to the native HTML <input> element's attribute.
	type: "text",

	// tabIndex: Integer
	//		Order fields are traversed when user hits the tab key
	tabIndex: "0",

	// disabled: Boolean
	//		Should this widget respond to user input?
	//		In markup, this is specified as "disabled='disabled'", or just "disabled".
	disabled: false,

	// readOnly: Boolean
	//		Should this widget respond to user input?
	//		In markup, this is specified as "readOnly".
	//		Similar to disabled except readOnly form values are submitted
	readOnly: false,

	// intermediateChanges: Boolean
	//		Fires onChange for each value change or only on demand
	intermediateChanges: false,

	// scrollOnFocus: Boolean
	//              On focus, should this widget scroll into view?
	scrollOnFocus: true,

	// These mixins assume that the focus node is an INPUT, as many but not all _FormWidgets are.
	// Don't attempt to mixin the 'type', 'name' attributes here programatically -- they must be declared
	// directly in the template as read by the parser in order to function. IE is known to specifically 
	// require the 'name' attribute at element creation time.
	attributeMap: dojo.delegate(dijit._Widget.prototype.attributeMap, {
		value: "focusNode", 
		disabled: "focusNode", 
		readOnly: "focusNode", 
		id: "focusNode", 
		tabIndex: "focusNode", 
		alt: "focusNode"
	}),

	_setDisabledAttr: function(/*Boolean*/ value){
		this.disabled = value;
		dojo.attr(this.focusNode, 'disabled', value);
		dijit.setWaiState(this.focusNode, "disabled", value);

				if(value){
					//reset those, because after the domNode is disabled, we can no longer receive
					//mouse related events, see #4200
					this._hovering = false;
					this._active = false;
					// remove the tabIndex, especially for FF
					this.focusNode.removeAttribute('tabIndex');
				}else{
					this.focusNode.setAttribute('tabIndex', this.tabIndex);
				}
				this._setStateClass();
	},

	setDisabled: function(/*Boolean*/ disabled){
		// summary:
		//		Set disabled state of widget (Deprecated).
		dojo.deprecated("setDisabled("+disabled+") is deprecated. Use attr('disabled',"+disabled+") instead.", "", "2.0");
		this.attr('disabled', disabled);
	},

	_onFocus: function(e){
		if(this.scrollOnFocus){
			dijit.scrollIntoView(this.domNode);
		}
		this.inherited(arguments);
	},

	_onMouse : function(/*Event*/ event){
		// summary:
		//	Sets _hovering, _active, and stateModifier properties depending on mouse state,
		//	then calls setStateClass() to set appropriate CSS classes for this.domNode.
		//
		//	To get a different CSS class for hover, send onmouseover and onmouseout events to this method.
		//	To get a different CSS class while mouse button is depressed, send onmousedown to this method.

		var mouseNode = event.currentTarget;
		if(mouseNode && mouseNode.getAttribute){
			this.stateModifier = mouseNode.getAttribute("stateModifier") || "";
		}

		if(!this.disabled){
			switch(event.type){
				case "mouseenter":	
				case "mouseover":
					this._hovering = true;
					this._active = this._mouseDown;
					break;

				case "mouseout":
				case "mouseleave":
					this._hovering = false;
					this._active = false;
					break;

				case "mousedown" :
					this._active = true;
					this._mouseDown = true;
					// set a global event to handle mouseup, so it fires properly
					//	even if the cursor leaves the button
					var mouseUpConnector = this.connect(dojo.body(), "onmouseup", function(){
						//if user clicks on the button, even if the mouse is released outside of it,
						//this button should get focus (which mimics native browser buttons)
						if(this._mouseDown && this.isFocusable()){
							this.focus();
						}
						this._active = false;
						this._mouseDown = false;
						this._setStateClass();
						this.disconnect(mouseUpConnector);
					});
					break;
			}
			this._setStateClass();
		}
	},

	isFocusable: function(){
		return !this.disabled && !this.readOnly && this.focusNode && (dojo.style(this.domNode, "display") != "none");
	},

	focus: function(){
		dijit.focus(this.focusNode);
	},

	_setStateClass: function(){
		// summary
		//	Update the visual state of the widget by setting the css classes on this.domNode
		//  (or this.stateNode if defined) by combining this.baseClass with
		//	various suffixes that represent the current widget state(s).
		//
		//	In the case where a widget has multiple
		//	states, it sets the class based on all possible
		//  combinations.  For example, an invalid form widget that is being hovered
		//	will be "dijitInput dijitInputInvalid dijitInputHover dijitInputInvalidHover".
		//
		//	For complex widgets with multiple regions, there can be various hover/active states,
		//	such as "Hover" or "CloseButtonHover" (for tab buttons).
		//	This is controlled by a stateModifier="CloseButton" attribute on the close button node.
		//
		//	The widget may have one or more of the following states, determined
		//	by this.state, this.checked, this.valid, and this.selected:
		//		Error - ValidationTextBox sets this.state to "Error" if the current input value is invalid
		//		Checked - ex: a checkmark or a ToggleButton in a checked state, will have this.checked==true
		//		Selected - ex: currently selected tab will have this.selected==true
		//
		//	In addition, it may have one or more of the following states,
		//	based on this.disabled and flags set in _onMouse (this._active, this._hovering, this._focused):
		//		Disabled	- if the widget is disabled
		//		Active		- if the mouse (or space/enter key?) is being pressed down
		//		Focused		- if the widget has focus
		//		Hover		- if the mouse is over the widget

		// Compute new set of classes
		var newStateClasses = this.baseClass.split(" ");

		function multiply(modifier){
			newStateClasses = newStateClasses.concat(dojo.map(newStateClasses, function(c){ return c+modifier; }), "dijit"+modifier);
		}

		if(this.checked){
			multiply("Checked");
		}
		if(this.state){
			multiply(this.state);
		}
		if(this.selected){
			multiply("Selected");
		}

		if(this.disabled){
			multiply("Disabled");
		}else if(this.readOnly){
			multiply("ReadOnly");
		}else if(this._active){
			multiply(this.stateModifier+"Active");
		}else{
			if(this._focused){
				multiply("Focused");
			}
			if(this._hovering){
				multiply(this.stateModifier+"Hover");
			}
		}

		// Remove old state classes and add new ones.
		// For performance concerns we only write into domNode.className once.
		var tn = this.stateNode || this.domNode,
			classHash = {};	// set of all classes (state and otherwise) for node

		dojo.forEach(tn.className.split(" "), function(c){ classHash[c] = true; });

		if("_stateClasses" in this){
			dojo.forEach(this._stateClasses, function(c){ delete classHash[c]; });
		}

		dojo.forEach(newStateClasses, function(c){ classHash[c] = true; });

		var newClasses = [];
		for(var c in classHash){
			newClasses.push(c);
		}
		tn.className = newClasses.join(" ");

		this._stateClasses = newStateClasses;
	},

	compare: function(/*anything*/val1, /*anything*/val2){
		// summary: compare 2 values
		if((typeof val1 == "number") && (typeof val2 == "number")){
			return (isNaN(val1) && isNaN(val2))? 0 : (val1-val2);
		}else if(val1 > val2){ return 1; }
		else if(val1 < val2){ return -1; }
		else { return 0; }
	},

	onChange: function(newValue){
		// summary: callback when value is changed
	},

	_onChangeActive: false,

	_handleOnChange: function(/*anything*/ newValue, /*Boolean, optional*/ priorityChange){
		// summary: set the value of the widget.
		this._lastValue = newValue;
		if(this._lastValueReported == undefined && (priorityChange === null || !this._onChangeActive)){
			// this block executes not for a change, but during initialization,
			// and is used to store away the original value (or for ToggleButton, the original checked state)
			this._resetValue = this._lastValueReported = newValue;
		}
		if((this.intermediateChanges || priorityChange || priorityChange === undefined) && 
			((typeof newValue != typeof this._lastValueReported) ||
				this.compare(newValue, this._lastValueReported) != 0)){
			this._lastValueReported = newValue;
			if(this._onChangeActive){ this.onChange(newValue); }
		}
	},

	create: function(){
		this.inherited(arguments);
		this._onChangeActive = true;
		this._setStateClass();
	},
	
	destroy: function(){
		if(this._layoutHackHandle){
			clearTimeout(this._layoutHackHandle);
		}
		this.inherited(arguments);
	},

	setValue: function(/*String*/ value){
		dojo.deprecated("dijit.form._FormWidget:setValue("+value+") is deprecated.  Use attr('value',"+value+") instead.", "", "2.0");
		this.attr('value', value);
	},

	getValue: function(){
		dojo.deprecated(this.declaredClass+"::getValue() is deprecated. Use attr('value') instead.", "", "2.0");
		return this.attr('value');
	},

	_layoutHack: function(){
		// summary: work around table sizing bugs on FF2 by forcing redraw
		if(dojo.isFF == 2 && !this._layoutHackHandle){
			var node=this.domNode;
			var old = node.style.opacity;
			node.style.opacity = "0.999";
			this._layoutHackHandle = setTimeout(dojo.hitch(this, function(){
				this._layoutHackHandle = null;
				node.style.opacity = old;
			}), 0);
		}
	}
});

dojo.declare("dijit.form._FormValueWidget", dijit.form._FormWidget,
{
	/*
	Summary:
		_FormValueWidget's correspond to native HTML elements such as <input> or <select> that have user changeable values.
		Each _ValueWidget represents a single input value, and has a (possibly hidden) <input> element,
		to which it serializes its input value, so that form submission (either normal submission or via FormBind?)
		works as expected.
	*/

	// TODO: unclear what that {value: ""} is for; FormWidget.attributeMap copies value to focusNode,
	// so maybe {value: ""} is so the value *doesn't* get copied to focusNode?
	// Seems like we really want value removed from attributeMap altogether
	// (although there's no easy way to do that now)
	attributeMap: dojo.delegate(dijit.form._FormWidget.prototype.attributeMap, { value: "" }),

	postCreate: function(){
		if(dojo.isIE || dojo.isWebKit){ // IE won't stop the event with keypress and Safari won't send an ESCAPE to keypress at all
			this.connect(this.focusNode || this.domNode, "onkeydown", this._onKeyDown);
		}
		// Update our reset value if it hasn't yet been set (because this.attr
		// is only called when there *is* a value
		if(this._resetValue === undefined){
			this._resetValue = this.value;
		}
	},

	_setValueAttr: function(/*anything*/ newValue, /*Boolean, optional*/ priorityChange){
		// summary:
		//		Hook so attr('value', value) works.
		// description:
		//		Sets the value of the widget.
		//		If the value has changed, then fire onChange event, unless priorityChange
		//		is specified as null (or false?)
		this.value = newValue;
		this._handleOnChange(newValue, priorityChange);
	},

	_getValueAttr: function(/*String*/ value){
		// summary:
		//		Hook so attr('value') works.
		return this._lastValue;
	},

	undo: function(){
		// summary: restore the value to the last value passed to onChange
		this._setValueAttr(this._lastValueReported, false);
	},

	reset: function(){
		this._hasBeenBlurred = false;
		this._setValueAttr(this._resetValue, true);
	},

	_valueChanged: function(){
		var v = this.attr('value');
		var lv = this._lastValueReported;
		// Equality comparison of objects such as dates are done by reference so
		// two distinct objects are != even if they have the same data. So use
		// toStrings in case the values are objects.
		return ((v !== null && (v !== undefined) && v.toString)?v.toString():'') !== ((lv !== null && (lv !== undefined) && lv.toString)?lv.toString():'');
	},

	_onKeyDown: function(e){
		if(e.keyCode == dojo.keys.ESCAPE && !e.ctrlKey && !e.altKey){
			var te;
			if(dojo.isIE){ 
				e.preventDefault(); // default behavior needs to be stopped here since keypress is too late
				te = document.createEventObject();
				te.keyCode = dojo.keys.ESCAPE;
				te.shiftKey = e.shiftKey;
				e.srcElement.fireEvent('onkeypress', te);
			}else if(dojo.isWebKit){ // ESCAPE needs help making it into keypress
				te = document.createEvent('Events');
				te.initEvent('keypress', true, true);
				te.keyCode = dojo.keys.ESCAPE;
				te.shiftKey = e.shiftKey;
				e.target.dispatchEvent(te);
			}
		}
	},

	_onKeyPress: function(e){
		if(e.charOrCode == dojo.keys.ESCAPE && !e.ctrlKey && !e.altKey && this._valueChanged()){
			this.undo();
			dojo.stopEvent(e);
			return false;
		}else if(this.intermediateChanges){
			var _this = this;
			// the setTimeout allows the key to post to the widget input box
			setTimeout(function(){ _this._handleOnChange(_this.attr('value'), false); }, 0);
		}
		return true;
	}
});

}

if(!dojo._hasResource["dijit.form.TextBox"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.form.TextBox"] = true;
dojo.provide("dijit.form.TextBox");



dojo.declare(
	"dijit.form.TextBox",
	dijit.form._FormValueWidget,
	{
		//	summary:
		//		A base class for textbox form inputs

		//	trim: Boolean
		//		Removes leading and trailing whitespace if true.  Default is false.
		trim: false,

		//	uppercase: Boolean
		//		Converts all characters to uppercase if true.  Default is false.
		uppercase: false,

		//	lowercase: Boolean
		//		Converts all characters to lowercase if true.  Default is false.
		lowercase: false,

		//	propercase: Boolean
		//		Converts the first character of each word to uppercase if true.
		propercase: false,

		//	maxLength: String
		//		HTML INPUT tag maxLength declaration.
		maxLength: "",

		templateString:"<input class=\"dijit dijitReset dijitLeft\" dojoAttachPoint='textbox,focusNode' name=\"${name}\"\n\tdojoAttachEvent='onmouseenter:_onMouse,onmouseleave:_onMouse,onfocus:_onMouse,onblur:_onMouse,onkeypress:_onKeyPress'\n\tautocomplete=\"off\" type=\"${type}\"\n\t/>\n",
		baseClass: "dijitTextBox",

		attributeMap: dojo.delegate(dijit.form._FormValueWidget.prototype.attributeMap, {
			maxLength: "focusNode" 
		}),

		_getValueAttr: function(){
			// summary:
			//		Hook so attr('value') works as we like.
			// description:
			//		For TextBox this simply returns the value of the <input>,
			//		but the parse() call is so subclasses can change this
			//		behavior w/out overriding this method.
			return this.parse(this.attr('displayedValue'), this.constraints);
		},

		_setValueAttr: function(value, /*Boolean?*/ priorityChange, /*String?*/ formattedValue){
			//	summary:
			//		Hook so attr('value', ...) works.
			//
			//	description: 
			//		Sets the value of the widget to "value" which can be of
			//		any type as determined by the widget.
			//
			//	value:
			//		The visual element value is also set to a corresponding,
			//		but not necessarily the same, value.
			//
			//	formattedValue:
			//		If specified, used to set the visual element value,
			//		otherwise a computed visual value is used.
			//
			//	priorityChange:
			//		If true, an onChange event is fired immediately instead of 
			//		waiting for the next blur event.

			var filteredValue;
			if(value !== undefined){
				filteredValue = this.filter(value);
				if(filteredValue !== null && ((typeof filteredValue != "number") || !isNaN(filteredValue))){
					if(typeof formattedValue != "string"){
						formattedValue = this.filter(this.format(filteredValue, this.constraints));
					}
				}else{ formattedValue = ''; }
			}
			if(formattedValue != null && formattedValue != undefined && this.textbox.value != formattedValue){
				this.textbox.value = formattedValue;
			}
			dijit.form.TextBox.superclass._setValueAttr.call(this, filteredValue, priorityChange);
		},

		// displayedValue: String
		//		For subclasses like ComboBox where the displayed value
		//		(ex: Kentucky) and the serialized value (ex: KY) are different,
		//		this represents the displayed value.
		//
		//		Setting 'displayedValue' through attr('displayedValue', ...)
		//		updates 'value', and vice-versa.  Othewise 'value' is updated
		//		from 'displayedValue' periodically, like onBlur etc.
		//
		//		TODO: move declaration to MappedTextBox?
		//		Problem is that ComboBox references displayedValue,
		//		for benefit of FilteringSelect.
		displayedValue: "",

		getDisplayedValue: function(){
			dojo.deprecated(this.declaredClass+"::getDisplayedValue() is deprecated. Use attr('displayedValue') instead.", "", "2.0");
			return this.attr('displayedValue');
		},

		_getDisplayedValueAttr: function(){
			//	summary:
			//		Hook so attr('displayedValue') works.
			//	description:
			//		Returns the displayed value (what the user sees on the screen),
			// 		after filtering (ie, trimming spaces etc.).
			//
			//		For some subclasses of TextBox (like ComboBox), the displayed value
			//		is different from the serialized value that's actually 
			//		sent to the server (see dijit.form.ValidationTextBox.serialize)
			
			return this.filter(this.textbox.value);
		},

		setDisplayedValue: function(/*String*/value){
			dojo.deprecated(this.declaredClass+"::setDisplayedValue() is deprecated. Use attr('displayedValue', ...) instead.", "", "2.0");
			this.attr('displayedValue', value);
		},
			
		_setDisplayedValueAttr: function(/*String*/value){
			// summary:
			//		Hook so attr('displayedValue', ...) works.
			//	description: 
			//		Sets the value of the visual element to the string "value".
			//		The widget value is also set to a corresponding,
			//		but not necessarily the same, value.

			this.textbox.value = value;
			this._setValueAttr(this.attr('value'), undefined, value);
		},

		format: function(/* String */ value, /* Object */ constraints){
			//	summary:
			//		Replacable function to convert a value to a properly formatted string
			return ((value == null || value == undefined) ? "" : (value.toString ? value.toString() : value));
		},

		parse: function(/* String */ value, /* Object */ constraints){
			//	summary:
			//		Replacable function to convert a formatted string to a value
			return value;
		},

		postCreate: function(){
			// setting the value here is needed since value="" in the template causes "undefined"
			// and setting in the DOM (instead of the JS object) helps with form reset actions
			this.textbox.setAttribute("value", this.textbox.value); // DOM and JS values shuld be the same
			this.inherited(arguments);

			/*#5297:if(this.srcNodeRef){
				dojo.style(this.textbox, "cssText", this.style);
				this.textbox.className += " " + this["class"];
			}*/
			this._layoutHack();
		},

		filter: function(val){
			//	summary:
			//		Auto-corrections (such as trimming) that are applied to textbox
			//		value on blur or form submit
			if(typeof val != "string"){ return val; }
			if(this.trim){
				val = dojo.trim(val);
			}
			if(this.uppercase){
				val = val.toUpperCase();
			}
			if(this.lowercase){
				val = val.toLowerCase();
			}
			if(this.propercase){
				val = val.replace(/[^\s]+/g, function(word){
					return word.substring(0,1).toUpperCase() + word.substring(1);
				});
			}
			return val;
		},

		_setBlurValue: function(){
			this._setValueAttr(this.attr('value'), (this.isValid ? this.isValid() : true));
		},

		_onBlur: function(){
			this._setBlurValue();
			this.inherited(arguments);
		}

	}
);

dijit.selectInputText = function(/*DomNode*/element, /*Number?*/ start, /*Number?*/ stop){
	//	summary:
	//		Select text in the input element argument, from start (default 0), to stop (default end).

	// TODO: use functions in _editor/selection.js?
	var _window = dojo.global;
	var _document = dojo.doc;
	element = dojo.byId(element);
	if(isNaN(start)){ start = 0; }
	if(isNaN(stop)){ stop = element.value ? element.value.length : 0; }
	element.focus();
	if(_document["selection"] && dojo.body()["createTextRange"]){ // IE
		if(element.createTextRange){
			var range = element.createTextRange();
			with(range){
				collapse(true);
				moveStart("character", start);
				moveEnd("character", stop);
				select();
			}
		}
	}else if(_window["getSelection"]){
		var selection = _window.getSelection();
		// FIXME: does this work on Safari?
		if(element.setSelectionRange){
			element.setSelectionRange(start, stop);
		}
	}
}

}

if(!dojo._hasResource["dijit.Tooltip"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.Tooltip"] = true;
dojo.provide("dijit.Tooltip");




dojo.declare(
	"dijit._MasterTooltip",
	[dijit._Widget, dijit._Templated],
	{
		// summary
		//		Internal widget that holds the actual tooltip markup,
		//		which occurs once per page.
		//		Called by Tooltip widgets which are just containers to hold
		//		the markup

		// duration: Integer
		//		Milliseconds to fade in/fade out
		duration: dijit.defaultDuration,

		templateString:"<div class=\"dijitTooltip dijitTooltipLeft\" id=\"dojoTooltip\">\n\t<div class=\"dijitTooltipContainer dijitTooltipContents\" dojoAttachPoint=\"containerNode\" waiRole='alert'></div>\n\t<div class=\"dijitTooltipConnector\"></div>\n</div>\n",

		postCreate: function(){
			dojo.body().appendChild(this.domNode);

			this.bgIframe = new dijit.BackgroundIframe(this.domNode);

			// Setup fade-in and fade-out functions.
			this.fadeIn = dojo.fadeIn({ node: this.domNode, duration: this.duration, onEnd: dojo.hitch(this, "_onShow") });
			this.fadeOut = dojo.fadeOut({ node: this.domNode, duration: this.duration, onEnd: dojo.hitch(this, "_onHide") });

		},

		show: function(/*String*/ innerHTML, /*DomNode*/ aroundNode, /*String[]?*/ position){
			// summary:
			//	Display tooltip w/specified contents to right specified node
			//	(To left if there's no space on the right, or if LTR==right)

			if(this.aroundNode && this.aroundNode === aroundNode){
				return;
			}

			if(this.fadeOut.status() == "playing"){
				// previous tooltip is being hidden; wait until the hide completes then show new one
				this._onDeck=arguments;
				return;
			}
			this.containerNode.innerHTML=innerHTML;

			// Firefox bug. when innerHTML changes to be shorter than previous
			// one, the node size will not be updated until it moves.
			this.domNode.style.top = (this.domNode.offsetTop + 1) + "px";

			// position the element and change CSS according to position[] (a list of positions to try)
			var align = {};
			var ltr = this.isLeftToRight();
			dojo.forEach( (position && position.length) ? position : dijit.Tooltip.defaultPosition, function(pos){
				switch(pos){
					case "after":				
						align[ltr ? "BR" : "BL"] = ltr ? "BL" : "BR";
						break;
					case "before":
						align[ltr ? "BL" : "BR"] = ltr ? "BR" : "BL";
						break;
					case "below":
						// first try to align left borders, next try to align right borders (or reverse for RTL mode)
						align[ltr ? "BL" : "BR"] = ltr ? "TL" : "TR";
						align[ltr ? "BR" : "BL"] = ltr ? "TR" : "TL";
						break;
					case "above":
					default:
						// first try to align left borders, next try to align right borders (or reverse for RTL mode)
						align[ltr ? "TL" : "TR"] = ltr ? "BL" : "BR";
						align[ltr ? "TR" : "TL"] = ltr ? "BR" : "BL";
						break;
				}
			});
			var pos = dijit.placeOnScreenAroundElement(this.domNode, aroundNode, align, dojo.hitch(this, "orient"));

			// show it
			dojo.style(this.domNode, "opacity", 0);
			this.fadeIn.play();
			this.isShowingNow = true;
			this.aroundNode = aroundNode;
		},

		orient: function(/* DomNode */ node, /* String */ aroundCorner, /* String */ tooltipCorner){
			// summary: private function to set CSS for tooltip node based on which position it's in
			node.className = "dijitTooltip " +
				{
					"BL-TL": "dijitTooltipBelow dijitTooltipABLeft",
					"TL-BL": "dijitTooltipAbove dijitTooltipABLeft",
					"BR-TR": "dijitTooltipBelow dijitTooltipABRight",
					"TR-BR": "dijitTooltipAbove dijitTooltipABRight",
					"BR-BL": "dijitTooltipRight",
					"BL-BR": "dijitTooltipLeft"
				}[aroundCorner + "-" + tooltipCorner];
		},

		_onShow: function(){
			if(dojo.isIE){
				// the arrow won't show up on a node w/an opacity filter
				this.domNode.style.filter="";
			}
		},

		hide: function(aroundNode){
			// summary: hide the tooltip
			if(this._onDeck && this._onDeck[1] == aroundNode){
				// this hide request is for a show() that hasn't even started yet;
				// just cancel the pending show()
				this._onDeck=null;
			}else if(this.aroundNode === aroundNode){
				// this hide request is for the currently displayed tooltip
				this.fadeIn.stop();
				this.isShowingNow = false;
				this.aroundNode = null;
				this.fadeOut.play();
			}else{
				// just ignore the call, it's for a tooltip that has already been erased
			}
		},

		_onHide: function(){
			this.domNode.style.cssText="";	// to position offscreen again
			if(this._onDeck){
				// a show request has been queued up; do it now
				this.show.apply(this, this._onDeck);
				this._onDeck=null;
			}
		}

	}
);

dijit.showTooltip = function(/*String*/ innerHTML, /*DomNode*/ aroundNode, /*String[]?*/ position){
	// summary:
	//	Display tooltip w/specified contents in specified position.
	//	See description of dijit.Tooltip.defaultPosition for details on position parameter.
	//	If position is not specified then dijit.Tooltip.defaultPosition is used.
	if(!dijit._masterTT){ dijit._masterTT = new dijit._MasterTooltip(); }
	return dijit._masterTT.show(innerHTML, aroundNode, position);
};

dijit.hideTooltip = function(aroundNode){
	// summary: hide the tooltip
	if(!dijit._masterTT){ dijit._masterTT = new dijit._MasterTooltip(); }
	return dijit._masterTT.hide(aroundNode);
};

dojo.declare(
	"dijit.Tooltip",
	dijit._Widget,
	{
		// summary
		//		Pops up a tooltip (a help message) when you hover over a node.

		// label: String
		//		Text to display in the tooltip.
		//		Specified as innerHTML when creating the widget from markup.
		label: "",

		// showDelay: Integer
		//		Number of milliseconds to wait after hovering over/focusing on the object, before
		//		the tooltip is displayed.
		showDelay: 400,

		// connectId: String[]
		//		Id(s) of domNodes to attach the tooltip to.
		//		When user hovers over any of the specified dom nodes, the tooltip will appear.
		connectId: [],

		//	position: String[]
		//		See description of dijit.Tooltip.defaultPosition for details on position parameter.
		position: [],

		postCreate: function(){
			
			dojo.addClass(this.domNode,"dijitTooltipData");

			this._connectNodes = [];
			
			dojo.forEach(this.connectId, function(id) {
				var node = dojo.byId(id);
				if (node) {
					this._connectNodes.push(node);
					dojo.forEach(["onMouseEnter", "onMouseLeave", "onFocus", "onBlur"], function(event){
						this.connect(node, event.toLowerCase(), "_"+event);
					}, this);
					if(dojo.isIE){
						// BiDi workaround
						node.style.zoom = 1;
					}
				}
			}, this);
		},

		_onMouseEnter: function(/*Event*/ e){
			this._onHover(e);
		},

		_onMouseLeave: function(/*Event*/ e){
			this._onUnHover(e);
		},

		_onFocus: function(/*Event*/ e){
			this._focus = true;
			this._onHover(e);
			this.inherited(arguments);
		},
		
		_onBlur: function(/*Event*/ e){
			this._focus = false;
			this._onUnHover(e);
			this.inherited(arguments);
		},

		_onHover: function(/*Event*/ e){
			if(!this._showTimer){
				var target = e.target;
				this._showTimer = setTimeout(dojo.hitch(this, function(){this.open(target)}), this.showDelay);
			}
		},

		_onUnHover: function(/*Event*/ e){
			// keep a tooltip open if the associated element has focus
			if(this._focus){ return; }
			if(this._showTimer){
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}
			this.close();
		},

		open: function(/*DomNode*/ target){
 			// summary: display the tooltip; usually not called directly.
			target = target || this._connectNodes[0];
			if(!target){ return; }

			if(this._showTimer){
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}
			dijit.showTooltip(this.label || this.domNode.innerHTML, target, this.position);
			
			this._connectNode = target;
		},

		close: function(){
			// summary: hide the tooltip or cancel timer for show of tooltip
			if(this._connectNode){
				// if tooltip is currently shown
				dijit.hideTooltip(this._connectNode);
				delete this._connectNode;
			}
			if(this._showTimer){
				// if tooltip is scheduled to be shown (after a brief delay)
				clearTimeout(this._showTimer);
				delete this._showTimer;
			}
		},

		uninitialize: function(){
			this.close();
		}
	}
);

// dijit.Tooltip.defaultPosition: String[]
//		This variable controls the position of tooltips, if the position is not specified to
//		the Tooltip widget or *TextBox widget itself.  It's an array of strings with the following values:
//
//			* before: places tooltip to the left of the target node/widget, or to the right in
//			  the case of RTL scripts like Hebrew and Arabic
//			* after: places tooltip to the right of the target node/widget, or to the left in
//			  the case of RTL scripts like Hebrew and Arabic
//			* above: tooltip goes above target node
//			* below: tooltip goes below target node
//
//		The list is positions is tried, in order, until a position is found where the tooltip fits
//		within the viewport.
//
//		Be careful setting this parameter.  A value of "above" may work fine until the user scrolls
//		the screen so that there's no room above the target node.   Nodes with drop downs, like
//		DropDownButton or FilteringSelect, are especially problematic, in that you need to be sure
//		that the drop down and tooltip don't overlap, even when the viewport is scrolled so that there
//		is only room below (or above) the target node, but not both.
dijit.Tooltip.defaultPosition = ["after", "before"];

}

if(!dojo._hasResource["dijit.form.ValidationTextBox"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.form.ValidationTextBox"] = true;
dojo.provide("dijit.form.ValidationTextBox");








/*=====
	dijit.form.ValidationTextBox.__Constraints = function(){
		// locale: String
		//		locale used for validation, picks up value from this widget's lang attribute
		// _flags_: anything
		//		various flags passed to regExpGen function
		this.locale = "";
		this._flags_ = "";
	}
=====*/

dojo.declare(
	"dijit.form.ValidationTextBox",
	dijit.form.TextBox,
	{
		// summary:
		//		A TextBox subclass with the ability to validate content of various types and provide user feedback.

		templateString:"<div class=\"dijit dijitReset dijitInlineTable dijitLeft\"\n\tid=\"widget_${id}\"\n\tdojoAttachEvent=\"onmouseenter:_onMouse,onmouseleave:_onMouse,onmousedown:_onMouse\" waiRole=\"presentation\"\n\t><div style=\"overflow:hidden;\"\n\t\t><div class=\"dijitReset dijitValidationIcon\"><br></div\n\t\t><div class=\"dijitReset dijitValidationIconText\">&Chi;</div\n\t\t><div class=\"dijitReset dijitInputField\"\n\t\t\t><input class=\"dijitReset\" dojoAttachPoint='textbox,focusNode' dojoAttachEvent='onfocus:_update,onkeyup:_update,onblur:_onMouse,onkeypress:_onKeyPress' autocomplete=\"off\"\n\t\t\ttype='${type}' name='${name}'\n\t\t/></div\n\t></div\n></div>\n",
		baseClass: "dijitTextBox",

		// default values for new subclass properties
		// required: Boolean
		//		Can be true or false, default is false.
		required: false,

		// promptMessage: String
		//		Hint string
		promptMessage: "",

		// invalidMessage: String
		// 		The message to display if value is invalid.
		invalidMessage: "$_unset_$", // read from the message file if not overridden

		// constraints: dijit.form.ValidationTextBox.__Constraints
		//		user-defined object needed to pass parameters to the validator functions
		constraints: {},

		// regExp: String
		//		regular expression string used to validate the input
		//		Do not specify both regExp and regExpGen
		regExp: ".*",

		// regExpGen: Function
		//		user replaceable function used to generate regExp when dependent on constraints
		//		Do not specify both regExp and regExpGen
		regExpGen: function(/*dijit.form.ValidationTextBox.__Constraints*/constraints){ return this.regExp; },

		// state: String
		//		Shows current state (ie, validation result) of input (Normal, Warning, or Error)
		state: "",

		//	tooltipPosition: String[]
		//		See description of dijit.Tooltip.defaultPosition for details on this parameter.
		tooltipPosition: [],

		_setValueAttr: function(){
			// summary:
			//		Hook so attr('value', ...) works.
			this.inherited(arguments);
			this.validate(this._focused);
		},

		validator: function(/*anything*/value, /*dijit.form.ValidationTextBox.__Constraints*/constraints){
			// summary: user replaceable function used to validate the text input against the regular expression.
			return (new RegExp("^(?:" + this.regExpGen(constraints) + ")"+(this.required?"":"?")+"$")).test(value) &&
				(!this.required || !this._isEmpty(value)) &&
				(this._isEmpty(value) || this.parse(value, constraints) !== undefined); // Boolean
		},

		_isValidSubset: function(){
			// summary:
			//	Returns true if the value is either already valid or could be made valid by appending characters.
			return this.textbox.value.search(this._partialre) == 0;
		},

		isValid: function(/*Boolean*/ isFocused){
			// summary: Need to over-ride with your own validation code in subclasses
			return this.validator(this.textbox.value, this.constraints);
		},

		_isEmpty: function(value){
			// summary: Checks for whitespace
			return /^\s*$/.test(value); // Boolean
		},

		getErrorMessage: function(/*Boolean*/ isFocused){
			// summary: return an error message to show if appropriate
			return this.invalidMessage; // String
		},

		getPromptMessage: function(/*Boolean*/ isFocused){
			// summary: return a hint to show if appropriate
			return this.promptMessage; // String
		},

		_maskValidSubsetError: true,
		validate: function(/*Boolean*/ isFocused){
			// summary:
			//		Called by oninit, onblur, and onkeypress.
			// description:
			//		Show missing or invalid messages if appropriate, and highlight textbox field.
			var message = "";
			var isValid = this.disabled || this.isValid(isFocused);
			if(isValid){ this._maskValidSubsetError = true; }
			var isValidSubset = !isValid && isFocused && this._isValidSubset();
			var isEmpty = this._isEmpty(this.textbox.value);
			this.state = (isValid || (!this._hasBeenBlurred && isEmpty) || isValidSubset) ? "" : "Error";
			if(this.state == "Error"){ this._maskValidSubsetError = false; }
			this._setStateClass();
			dijit.setWaiState(this.focusNode, "invalid", isValid ? "false" : "true");
			if(isFocused){
				if(isEmpty){
					message = this.getPromptMessage(true);
				}
				if(!message && (this.state == "Error" || (isValidSubset && !this._maskValidSubsetError))){
					message = this.getErrorMessage(true);
				}
			}
			this.displayMessage(message);
			return isValid;
		},

		// currently displayed message
		_message: "",

		displayMessage: function(/*String*/ message){
			// summary:
			//		User overridable method to display validation errors/hints.
			//		By default uses a tooltip.
			if(this._message == message){ return; }
			this._message = message;
			dijit.hideTooltip(this.domNode);
			if(message){
				dijit.showTooltip(message, this.domNode, this.tooltipPosition);
			}
		},

		_refreshState: function(){
			this.validate(this._focused);
		},

		_update: function(/*Event*/e){
			this._refreshState();
			this._onMouse(e);	// update CSS classes
		},

		//////////// INITIALIZATION METHODS ///////////////////////////////////////

		constructor: function(){
			this.constraints = {};
		},

		postMixInProperties: function(){
			this.inherited(arguments);
			this.constraints.locale = this.lang;
			this.messages = dojo.i18n.getLocalization("dijit.form", "validate", this.lang);
			if(this.invalidMessage == "$_unset_$"){ this.invalidMessage = this.messages.invalidMessage; }
			var p = this.regExpGen(this.constraints);
			this.regExp = p;
			var partialre = "";
			// parse the regexp and produce a new regexp that matches valid subsets
			// if the regexp is .* then there's no use in matching subsets since everything is valid
			if(p != ".*"){ this.regExp.replace(/\\.|\[\]|\[.*?[^\\]{1}\]|\{.*?\}|\(\?[=:!]|./g,
				function (re){
					switch(re.charAt(0)){
						case '{':
						case '+':
						case '?':
						case '*':
						case '^':
						case '$':
						case '|':
						case '(': partialre += re; break;
						case ")": partialre += "|$)"; break;
						 default: partialre += "(?:"+re+"|$)"; break;
					}
				}
			);}
			try{ // this is needed for now since the above regexp parsing needs more test verification
				"".search(partialre);
			}catch(e){ // should never be here unless the original RE is bad or the parsing is bad
				partialre = this.regExp;
				console.debug('RegExp error in ' + this.declaredClass + ': ' + this.regExp);
			} // should never be here unless the original RE is bad or the parsing is bad
			this._partialre = "^(?:" + partialre + ")$";
		},

		_setDisabledAttr: function(/*Boolean*/ value){
			this.inherited(arguments);	// call FormValueWidget._setDisabledAttr()
			if(this.valueNode){
				this.valueNode.disabled = value;
			}
			this._refreshState();
		},
		
		_setRequiredAttr: function(/*Boolean*/ value){
			this.required = value;
			dijit.setWaiState(this.focusNode,"required", value);
			this._refreshState();				
		},

		postCreate: function(){
			if(dojo.isIE){ // IE INPUT tag fontFamily has to be set directly using STYLE
				var s = dojo.getComputedStyle(this.focusNode);
				if(s){
					var ff = s.fontFamily;
					if(ff){
						this.focusNode.style.fontFamily = ff;
					}
				}
			}
			this.inherited(arguments);
		}
	}
);

dojo.declare(
	"dijit.form.MappedTextBox",
	dijit.form.ValidationTextBox,
	{
		// summary:
		//		A dijit.form.ValidationTextBox subclass which provides a visible formatted display and a serializable
		//		value in a hidden input field which is actually sent to the server.  The visible display may
		//		be locale-dependent and interactive.  The value sent to the server is stored in a hidden
		//		input field which uses the `name` attribute declared by the original widget.  That value sent
		//		to the serveris defined by the dijit.form.MappedTextBox.serialize method and is typically
		//		locale-neutral.

		serialize: function(/*anything*/val, /*Object?*/options){
			// summary: user replaceable function used to convert the attr('value') result to a String
			return val.toString ? val.toString() : ""; // String
		},

		toString: function(){
			// summary: display the widget as a printable string using the widget's value
			var val = this.filter(this.attr('value')); // call filter in case value is nonstring and filter has been customized
			return val != null ? (typeof val == "string" ? val : this.serialize(val, this.constraints)) : ""; // String
		},

		validate: function(){
			this.valueNode.value = this.toString();
			return this.inherited(arguments);
		},

		buildRendering: function(){
			this.inherited(arguments);

			// Create a hidden <input> node with the serialized value used for submit
			// (as opposed to the displayed value)
			var textbox = this.textbox;
			var valueNode = (this.valueNode = dojo.doc.createElement("input"));
			valueNode.setAttribute("type", textbox.type);
			dojo.style(valueNode, "display", "none");
			this.valueNode.name = this.textbox.name;
			dojo.place(valueNode, textbox, "after");

			// try to give the displayed node a different name, or ideally
			// remove that attribute altogether
			this.textbox.name = this.textbox.name + "_displayed_";
			this.textbox.removeAttribute("name");
		},

		_setDisabledAttr: function(/*Boolean*/ value){
			this.inherited(arguments);
			dojo.attr(this.valueNode, 'disabled', value);
		}
	}
);

/*=====
	dijit.form.RangeBoundTextBox.__Constraints = function(){
		// min: Number
		//		Minimum signed value.  Default is -Infinity
		// max: Number
		//		Maximum signed value.  Default is +Infinity
		this.min = min;
		this.max = max;
	}
=====*/

dojo.declare(
	"dijit.form.RangeBoundTextBox",
	dijit.form.MappedTextBox,
	{
		// summary:
		//		A dijit.form.MappedTextBox subclass which defines a range of valid values
		//
		// constraints: dijit.form.RangeBoundTextBox.__Constraints
		//
		// rangeMessage: String
		//		The message to display if value is out-of-range

		/*=====
		constraints: {},
		======*/
		rangeMessage: "",

		rangeCheck: function(/*Number*/ primitive, /*dijit.form.RangeBoundTextBox.__Constraints*/ constraints){
			// summary: user replaceable function used to validate the range of the numeric input value
			var isMin = "min" in constraints;
			var isMax = "max" in constraints;
			if(isMin || isMax){
				return (!isMin || this.compare(primitive,constraints.min) >= 0) &&
					(!isMax || this.compare(primitive,constraints.max) <= 0);
			}
			return true; // Boolean
		},

		isInRange: function(/*Boolean*/ isFocused){
			// summary: Need to over-ride with your own validation code in subclasses
			return this.rangeCheck(this.attr('value'), this.constraints);
		},

		_isDefinitelyOutOfRange: function(){
			// summary:
			//	Returns true if the value is out of range and will remain
			//	out of range even if the user types more characters
			var val = this.attr('value');
			var isTooLittle = false;
			var isTooMuch = false;
			if("min" in this.constraints){
				var min = this.constraints.min;
				val = this.compare(val, ((typeof min == "number") && min >= 0 && val !=0)? 0 : min);
				isTooLittle = (typeof val == "number") && val < 0;
			}
			if("max" in this.constraints){
				var max = this.constraints.max;
				val = this.compare(val, ((typeof max != "number") || max > 0)? max : 0);
				isTooMuch = (typeof val == "number") && val > 0;
			}
			return isTooLittle || isTooMuch;
		},

		_isValidSubset: function(){
			return this.inherited(arguments) && !this._isDefinitelyOutOfRange();
		},

		isValid: function(/*Boolean*/ isFocused){
			return this.inherited(arguments) &&
				((this._isEmpty(this.textbox.value) && !this.required) || this.isInRange(isFocused)); // Boolean
		},

		getErrorMessage: function(/*Boolean*/ isFocused){
			if(dijit.form.RangeBoundTextBox.superclass.isValid.call(this, false) && !this.isInRange(isFocused)){ return this.rangeMessage; } // String
			return this.inherited(arguments);
		},

		postMixInProperties: function(){
			this.inherited(arguments);
			if(!this.rangeMessage){
				this.messages = dojo.i18n.getLocalization("dijit.form", "validate", this.lang);
				this.rangeMessage = this.messages.rangeMessage;
			}
		},

		postCreate: function(){
			this.inherited(arguments);
			if(this.constraints.min !== undefined){
				dijit.setWaiState(this.focusNode, "valuemin", this.constraints.min);
			}
			if(this.constraints.max !== undefined){
				dijit.setWaiState(this.focusNode, "valuemax", this.constraints.max);
			}
		},
		
		_setValueAttr: function(/*Number*/ value, /*Boolean?*/ priorityChange){
			// summary:
			//		Hook so attr('value', ...) works.
			dijit.setWaiState(this.focusNode, "valuenow", value);
			this.inherited(arguments);
		}
	}
);

}

if(!dojo._hasResource["dijit.form._DateTimeTextBox"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.form._DateTimeTextBox"] = true;
dojo.provide("dijit.form._DateTimeTextBox");






/*=====
dojo.declare(
	"dijit.form._DateTimeTextBox.__Constraints",
	[dijit.form.RangeBoundTextBox.__Constraints, dojo.date.locale.__FormatOptions]
);
=====*/

dojo.declare(
	"dijit.form._DateTimeTextBox",
	dijit.form.RangeBoundTextBox,
	{
		// summary:
		//		A validating, serializable, range-bound date or time text box.
		//
		// constraints: dijit.form._DateTimeTextBox.__Constraints 

		/*=====
		constraints: {},
		======*/
		regExpGen: dojo.date.locale.regexp,
		compare: dojo.date.compare,
		format: function(/*Date*/ value, /*dojo.date.locale.__FormatOptions*/ constraints){
			//	summary: formats the value as a Date, according to constraints
			if(!value){ return ''; }
			return dojo.date.locale.format(value, constraints);
		},
		parse: function(/*String*/ value, /*dojo.date.locale.__FormatOptions*/ constraints){
			//	summary: parses the value as a Date, according to constraints
			return dojo.date.locale.parse(value, constraints) || (this._isEmpty(value)? null : undefined);
		},

		serialize: dojo.date.stamp.toISOString,

		//	value: Date
		//		The value of this widget as a JavaScript Date object.  Use attr("value") / attr("value", val) to manipulate.
		//		When passed to the parser in markup, must be specified according to `dojo.date.stamp.fromISOString`
		value: new Date(""),	// value.toString()="NaN"

		//	popupClass: String
		//		Name of the popup widget class used to select a date/time
		popupClass: "", // default is no popup = text only
		
		_selector: "",

		postMixInProperties: function(){
			//dijit.form.RangeBoundTextBox.prototype.postMixInProperties.apply(this, arguments);
			this.inherited(arguments);
			if(!this.value || this.value.toString() == dijit.form._DateTimeTextBox.prototype.value.toString()){
				this.value = null;
			}
			var constraints = this.constraints;
			constraints.selector = this._selector;
			constraints.fullYear = true; // see #5465 - always format with 4-digit years
			var fromISO = dojo.date.stamp.fromISOString;
			if(typeof constraints.min == "string"){ constraints.min = fromISO(constraints.min); }
 			if(typeof constraints.max == "string"){ constraints.max = fromISO(constraints.max); }
		},
		
		_onFocus: function(/*Event*/ evt){
			// summary: open the TimePicker popup
			this._open();
		},

		_setValueAttr: function(/*Date*/ value, /*Boolean?*/ priorityChange, /*String?*/ formattedValue){
			// summary:
			//	Sets the date on this textbox.  Note that `value` must be a Javascript Date object.
			this.inherited(arguments);
			if(this._picker){
				// #3948: fix blank date on popup only
				if(!value){value=new Date();}
				this._picker.attr('value', value);
			}
		},

		_open: function(){
			// summary:
			//	opens the TimePicker, and sets the onValueSelected value

			if(this.disabled || this.readOnly || !this.popupClass){return;}

			var textBox = this;

			if(!this._picker){
				var PopupProto=dojo.getObject(this.popupClass, false);
				this._picker = new PopupProto({
					onValueSelected: function(value){
						if(textBox._tabbingAway){
							delete textBox._tabbingAway;
						}else{
							textBox.focus(); // focus the textbox before the popup closes to avoid reopening the popup
						}
						setTimeout(dojo.hitch(textBox, "_close"), 1); // allow focus time to take

						// this will cause InlineEditBox and other handlers to do stuff so make sure it's last
						dijit.form._DateTimeTextBox.superclass._setValueAttr.call(textBox, value, true);
					},
					lang: textBox.lang,
					constraints: textBox.constraints,
					isDisabledDate: function(/*Date*/ date){
						// summary:
						// 	disables dates outside of the min/max of the _DateTimeTextBox
						var compare = dojo.date.compare;
						var constraints = textBox.constraints;
						return constraints && (constraints.min && (compare(constraints.min, date, "date") > 0) || 
							(constraints.max && compare(constraints.max, date, "date") < 0));
					}
				});
				this._picker.attr('value', this.attr('value') || new Date());
			}
			if(!this._opened){
				dijit.popup.open({
					parent: this,
					popup: this._picker,
					around: this.domNode,
					onCancel: dojo.hitch(this, this._close),
					onClose: function(){ textBox._opened=false; }
				});
				this._opened=true;
			}
			
			dojo.marginBox(this._picker.domNode,{ w:this.domNode.offsetWidth });
		},

		_close: function(){
			if(this._opened){
				dijit.popup.close(this._picker);
				this._opened=false;
			}			
		},

		_onBlur: function(){
			// summary: called magically when focus has shifted away from this widget and it's dropdown
			this._close();
			if(this._picker){
				// teardown so that constraints will be rebuilt next time (redundant reference: #6002)
				this._picker.destroy();
				delete this._picker;
			}
			this.inherited(arguments);
			// don't focus on <input>.  the user has explicitly focused on something else.
		},

		_getDisplayedValueAttr: function(){
			return this.textbox.value;
		},

		_setDisplayedValueAttr: function(/*String*/ value, /*Boolean?*/ priorityChange){
			this._setValueAttr(this.parse(value, this.constraints), priorityChange, value);
		},

		destroy: function(){
			if(this._picker){
				this._picker.destroy();
				delete this._picker;
			}
			this.inherited(arguments);
		},

		_onKeyPress: function(/*Event*/e){
			var p = this._picker, dk = dojo.keys;
			// Handle the key in the picker, if it has a handler.  If the handler
			// returns false, then don't handle any other keys.
			if(p && this._opened && p.handleKey){
				if(p.handleKey(e) === false){ return; }
			}
			if(this._opened && e.charOrCode == dk.ESCAPE && !e.shiftKey && !e.ctrlKey && !e.altKey){
				this._close();
				dojo.stopEvent(e);
			}else if(!this._opened && e.charOrCode == dk.DOWN_ARROW){
				this._open();
				dojo.stopEvent(e);
			}else if(dijit.form._DateTimeTextBox.superclass._onKeyPress.apply(this, arguments)){
				if(e.charOrCode === dk.TAB){
					this._tabbingAway = true;
				}else if(this._opened && (e.keyChar || e.charOrCode === dk.BACKSPACE || e.charOrCode == dk.DELETE)){
					// Replace the element - but do it after a delay to allow for 
					// filtering to occur
					setTimeout(dojo.hitch(this, function(){
						dijit.placeOnScreenAroundElement(p.domNode.parentNode, this.domNode, {'BL':'TL', 'TL':'BL'}, p.orient ? dojo.hitch(p, "orient") : null);
					}), 1);
				}
			}
		}
	}
);

}

if(!dojo._hasResource["dijit.form.DateTextBox"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dijit.form.DateTextBox"] = true;
dojo.provide("dijit.form.DateTextBox");




dojo.declare(
	"dijit.form.DateTextBox",
	dijit.form._DateTimeTextBox,
	{
		// summary:
		//		A validating, serializable, range-bound date text box with a popup calendar

		baseClass: "dijitTextBox dijitDateTextBox",
		popupClass: "dijit._Calendar",
		_selector: "date"
	}
);

}

if(!dojo._hasResource["openbravo.widget.DataGrid"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["openbravo.widget.DataGrid"] = true;
/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.0  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html 
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License. 
 * The Original Code is Openbravo ERP. 
 * The Initial Developer of the Original Code is Openbravo SL 
 * All portions are Copyright (C) 2001-2009 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
*/

/**
* @fileoverview This JavaScript library is the DataGrid widget library
*/

dojo.provide("openbravo.widget.DataGrid");





function createTextCellElement(colMetadata) {
  var hoverCell = function(evt) {
    if (dojo && !dojo.hasClass(this, 'DataGrid_Body_Cell_hover')
        && !dojo.hasClass(this, 'DataGrid_Body_Cell_clicked')){
      dojo.addClass(this, 'DataGrid_Body_Cell_hover');
    }
  };

  var plainCell = function(evt) {
    if (dojo && dojo.hasClass(this, 'DataGrid_Body_Cell_hover')){
      dojo.removeClass(this, 'DataGrid_Body_Cell_hover', false);
    }
  };

  var text = document.createElement("nobr");
  text.className = openbravo.widget.DataGrid.Column.prototype.DEFAULT_CLASS;
  dojo.addClass(text, colMetadata.className);
  text.onmouseover = hoverCell;
  text.onmouseout = plainCell;
  openbravo.widget.DataGrid.html.disableSelection(text);
  var emptyText = document.createTextNode("");
  text.appendChild(emptyText);
  if (colMetadata.visible){
    text.style.width = colMetadata.width;
  }else{ 
    text.style.display = "none";
  }
  return text;
};

dojo.declare("openbravo.widget.DataGrid", [dijit._Widget], {
  structureUrl: "",
  dataUrl: "",
  updatesUrl: "",
  calculateNumRows: false,
  numRows: 20,
  offset: 0,
  sortCols: "",
  sortDirs: "",
  editable: true,
  sortable: true,
  onInvalidValue: alert,
  onScroll: function() {},
  onGridLoad: function() {},
  defaultRow: 0,
  showLineNumbers: "true",
  lineNoColumnWidth: "40px",
  lineNoColumnTitle: "#",
  lineNoColumnClass: "DataGrid_Body_LineNoCell",
  lineNoColumnHeaderClass: "DataGrid_Header_LineNoCell",
  bufferSize: 7.0,
  maxWidth: "100%",
  percentageWidthRelativeToId: "body",
  isFirstLoad: true,
  hasBeenResized: false,
  offsetBeforeResize: 0,
  multipleRowSelection: true,
  templateString: "<div></div>",
  templateCssPath: null, // Defined in the skin --- DataGrid.css

/**
* Dojo's function to recreate the control properties in its build process.
* @param {Array} args - array of arguments
* @param {Object} frag - object
* @param {Object} parentComp - component parent
*/
  postMixInProperties: function(args, frag, parentComp) {
    setCalloutProcessing(true);
    if (this.updatesUrl == ""){
      this.updatesUrl = dataUrl;
    }
    this.selectedRows = new openbravo.widget.DataGrid.IndexedRows();
    if (this.calculateNumRows == true) {
      this.numRows = calculateNumRows();
    }
    this.editor = null;
    this.editing = false;
    this.editingCell = null;
    this.tableNode = null;
    this.editingRow = null;
    this.selectedCell = -1;
    this.locked = false;
    this.lastHoveredColumn = null;
    this.lastAddition = "";
    this.validators = [];
    this.requestParams = [];
    this.visibleRows = this.numRows;
    this.visibleRowsMax = this.numRows;
    this.scrollWidth = openbravo.widget.DataGrid.html.getScrollbar().width;
    if (this.onInvalidValue == alert){
      this.onInvalidValue = function(msg) { alert(msg); };
    }
    this.savingInterface = {
      save: dojo.hitch(this, "saveCell"),
      cancel: dojo.hitch(this, "cancelEdit"),
      lockGrid: dojo.hitch(this, function() {
        this.locked = true;
      }),
      unlockGrid: dojo.hitch(this, function() {
        this.locked = false;
        this.setFocus();
      }),
      dataUrl: this.dataUrl,
      updatesUrl: this.updatesUrl
    };
    this.errorHandler = {
      handleError: dojo.hitch(this, "handleUpdateError")
    };
    this.columns = new openbravo.widget.DataGrid.Columns();
    this.numberOfResizes = 0;
    this.requestStructure();
  },

/**
* Dojo's function to operate on the control after its build process
*/
  postCreate: function() {
    var row = document.createElement("tr");
    row.className = 'DataGrid_Body_Row';
    var height = dojo.style(row, "height", "15px");
    // height = openbravo.widget.DataGrid.html.extractPx(height);
    this.domNode.style.height = (28) * (this.numRows + 1) + "px";
    var pos = this.maxWidth.indexOf("%");
    if (pos > 0) {
      this.proportion = this.maxWidth.substr(0, pos) / 100;
      var maxWidthInt = this.setMaxWidth();
      this.domNode.style.width = maxWidthInt + 8 + "px";
    }
  },

/**
* Call to the backend, used by the method postMixInProperties, to load the grid column structure. For the answer, it uses the ajaxUpdate methods of the Parser object.
* @param {String} url - url for the request
* @param {Object} handler - handler
* @param {Array} content - aditional content
*/
  requestStructure: function(url, handler, content) {
    var parser = new openbravo.widget.DataGrid.Parser(this);
    var handlerRef = dojo.hitch(parser, "ajaxUpdate");
    var serviceUrl = {
      url: this.structureUrl,
      handler: handlerRef,
      method: "GET",
      handleAs: "xml"
    };
    openbravo.widget.DataGrid.io.asyncCall(serviceUrl, {});
  },

/**
* Method used for the cell edition. It only will be used in editable grids. It set a cell to editable mode doing the previous necesary save tasks and controlling if the cell can be editable or not.
* @param {Object} cell - Object pointing to the actual cell
*/
  editCell: function(cell) {
    if (this.editing){
      this.saveCell();
    }
    if (!this.editing && this.editable) {
      var rowNode = cell.parentNode;
      var columnNo = dojo.indexOf(cell.parentNode.cells, cell);
      var column = this.columns.get(columnNo);
      if (column.readonly) { return; }
      var rowNo = this.getCurrentOffset() + rowNode.rowIndex;
      var rowChanged = this.editingRow && this.editingRow.offset != rowNo;
      if (!this.editingRow || rowChanged){
        this.editingRow = this.buffer.getRow(rowNo);
      }
      this.editingRow.setStatus(this.editingRow.EDITING);
      this.editor = column.renderEditor(cell, this.editingRow, this.savingInterface);
      openbravo.widget.DataGrid.html.enableSelection(cell);
      this.editingCell = cell;
      this.editing = true;
    }
  },

/**
* Saves the modified content of a cell that is in edition mode, hidding its edition mode. At the same time, it checks data, so if invalid data were found, it will launch the method onInvalidValue. If the column is defined as synchronized column, the launch to the backend for the synchronization will be launched.
* @returns True: everything is ok - False: there are some problems.
* @type Boolean
*/
  saveCell: function() {
    var cell = this.editingCell;
    if (!cell) { return; }
    var columnNo = dojo.indexOf(cell.parentNode.cells, cell);
    var column = this.columns.get(columnNo);
    var storedValue = this.editingRow.getValue(column.index);
    var inputValue = this.editor.getValue();
    if (inputValue == storedValue) {
      this.cancelEdit();
      return true;
    }
    var correct = column.type.validate(inputValue);
    if (correct) {
      this.editingRow.setValue(column.name, inputValue);
      if (column.invalidates.length > 0) {
        for (var i = 0; i < column.invalidates.length; i++) {
          var invalidIndex = this.columns.get(column.invalidates[i]).index;
          this.editingRow.setValue(column.invalidates[i], "");
          openbravo.widget.DataGrid.html.clearElement(cell.parentNode.childNodes[invalidIndex]);
        }
      }
      if (column.sync){
        this.saveRow(true);
      }
      this.hideEditor(inputValue);
      return true;
    } else {
      var msg = "Invalid value";
      this.onInvalidValue(msg);
      this.editor.setFocus();
      return false;
    }
  },

/**
* Send a row to the backend for the backend do the save operations.
* @param {Boolean} skipAlerts - Identifies if the aerts must been shown.
* @return True: if ok - False: if it's wrong.
* @type Boolean
*/
  saveRow: function(skipAlerts) {
    var row = this.editingRow;
    if (!row.modified && !row.error){
      return true;
    }
    skipAlerts = skipAlerts == true;

    var emptyFields = row.checkFields();
    if (emptyFields.length > 0) {
      if(!skipAlerts) {
        this.onInvalidValue("A required field is empty");
        var cellNumber = emptyFields[0];
        var isVisible = this.isVisible(row.offset);
        var edit = dojo.hitch(this, function() {
          this.options.onRefreshComplete.remove(edit);
          this.editCell(row.rowNode.cells[cellNumber]);
        });
        if (!isVisible) {
          this.options.onRefreshComplete.push(edit);
          this.goToRow(row.offset);
        } else {
          edit();
        }
      }
    }else{
      row.validate(this.validators);
    }
    if (!row.error) {
      row.sendRow(this.updatesUrl);
      return true;
    } else {
      return false;
    }
  },

/**
* It makes a new grid row
* @param {Number} offset - identifies the actual offset.
* @return Object pointing to the new row.
* @type openbravo.widget.DataGrid.Row
*/
  createRowObject: function(offset) {
    return new openbravo.widget.DataGrid.Row(offset, this.columns, 
      this.options, this.errorHandler, dojo.hitch(this, "isVisible"));
  },

/**
* It makes the message dialog to show the errors produced by the update.
* @param {String} title - the title of the message.
* @param {String} description - the description of the message.
*/
  handleUpdateError: function(title, description) {
    var mainDiv = document.createElement("div");
    var contentForm = document.createElement("form");
    var table = document.createElement("table");
    var tbody = document.createElement("tbody");
    var titleRow = document.createElement("tr");
    var titleCell = document.createElement("td");
    dojo.addClass(titleCell, "messageDialogTitle");
    titleCell.appendChild(document.createTextNode(title));
    titleRow.appendChild(titleCell);
    var descRow = document.createElement("tr");
    var descCell = document.createElement("td");
    dojo.addClass(descCell, "messageDialogText");
    descCell.appendChild(document.createTextNode(description));
    descCell.innerHTML = descCell.innerHTML + '<br/><br/>';
    descRow.appendChild(descCell);
    var buttonRow = document.createElement("tr");
    var buttonCell = document.createElement("td");
    buttonCell.align = "center";
    var saveButton = document.createElement("input");
    saveButton.type= "button";
    saveButton.value= "OK";
    dojo.addClass(saveButton, 'dialogButton');
    buttonCell.appendChild(saveButton);
    buttonRow.appendChild(buttonCell);
    tbody.appendChild(titleRow);
    tbody.appendChild(descRow);
    tbody.appendChild(buttonRow);
    table.appendChild(tbody);
    contentForm.appendChild(table);
    mainDiv.appendChild(contentForm);
    var options = {
      bgColor: "white",
      bgOpacity: "0.5"
      // toggle: "fade",
      // toggleDuration: 250
    }
    var dialog = dojo.widget.createWidget("dojo:Dialog", options, contentForm);
    dojo.connect(saveButton, "onclick", dialog, "hide");
    dojo.connect(dialog, "hide", dialog, "destroy");
    dialog.show();
  },

/**
* It cancels the edition of a cell. It verifies if some mistake had been produced in the same one, to show the mistake instead of cancelling. It is the method used to go out of a cell in edition.
*/
  cancelEdit: function() {
    if (!this.editing) { return; }
    var rowId = this.editingRow.getValue(this.columns.getIdentifier().index);
    if (this.options.failedRows.contains(rowId)){
      this.editingRow.setStatus(this.editingRow.ERROR);
    }else{
      this.editingRow.setStatus(this.editingRow.CORRECT);
    }
    this.hideEditor(this._getEditingCellContent(this.editingCell));
  },

/**
* It hides the edition mode to leave it in visualization mode.
* @param {String} newContent - New content
*/
  hideEditor: function(newContent) {
    var s = newContent;
    if (s && typeof s == 'string') { newContent = s.split(" ").join("&nbsp;"); }
    var editingElement = this.editingCell;
    if (!editingElement) { return; }
    openbravo.widget.DataGrid.html.disableSelection(editingElement);
    this.editing = false;
    this.editingCell = null;
    var column = null;
    var columnNo = dojo.indexOf(editingElement.parentNode.cells, editingElement);
    column = this.columns.get(columnNo);
    /*try {
      while (column.hasChildNodes()) column.removeChild(column.lastChild);
    } catch (ignored) {column.innerHTML="";}
    var textNode = createTextCellElement(column);*/
    if (column && column.type.name == 'url' && newContent != '') { editingElement.innerHTML = "<a href=\"" + newContent + "\" target=_blank><img src=\"../web/js/openbravo/templates/popup1.gif\" border=\"0\" title=\"Link\" alt=\"Link\"></a>&nbsp;" + newContent; }
    if (column && column.type.name == 'img' && newContent != '') { editingElement.innerHTML = "<img src=\"" + newContent + "\" border=\"0\" height=\"15px\">"; }
    else { editingElement.innerHTML = newContent; }
    //editingElement.appendChild(textNode);
  },

/**
* It returns the value of the cell that is being edited. It is used in the method of cancelEdit to recover the value of the cell.
* @param {Object} cell - Object pointing to the cell.
* @return The value of the editing row.
* @type String
*/
  _getEditingCellContent: function(cell) {
    var columnNo = dojo.indexOf(cell.parentNode.cells, cell);
    var column = this.columns.get(columnNo);
    return this.editingRow.getValue(column.index);
  },

/**
* It changes the class of the selected rows in order that they have the aspect of checked.
*/
  showSelection: function() {
    var selectedCount = this.selectedRows.count();
    var offset = this.getCurrentOffset();
    var lastRowFound = false;
    if (selectedCount > 0){
      var lastSelectedRowId = this.selectedRows.getLastSelected().id;
    }
    for (var i = 0; i < this.numRows; i++) {
      var currentRow = this.buffer.getRow(offset + i);
      if (!currentRow) { continue; }
      if (selectedCount > 0 && this.selectedRows.contains(currentRow.getValue(this.columns.getIdentifier().index)) || currentRow.isNewRow) {
        if(isGridFocused) {
          openbravo.widget.DataGrid.html.prereplaceClass(this.tableNode.rows[i], 
            "DataGrid_Body_Row_focus",
            i % 2 == 0 ? "DataGrid_Body_Row_Even" : "DataGrid_Body_Row_Odd");
        } else {
          openbravo.widget.DataGrid.html.prereplaceClass(this.tableNode.rows[i], 
            "DataGrid_Body_Row_selected",
            i % 2 == 0 ? "DataGrid_Body_Row_Even" : "DataGrid_Body_Row_Odd");
        }
        for (var j = 0; j < this.columns.count(); j++) {
          if (!dojo.hasClass(this.tableNode.rows[i].cells[j], "DataGrid_Body_Cell_selected")) {
            dojo.addClass(this.tableNode.rows[i].cells[j], "DataGrid_Body_Cell_selected");
          }
          if (dojo.hasClass(this.tableNode.rows[i].cells[j], "DataGrid_Body_Cell_clicked")) {
            dojo.removeClass(this.tableNode.rows[i].cells[j], "DataGrid_Body_Cell_clicked");
          }
        }
        selectedCount--;
        if (this.selectedCell >= 0 && !lastRowFound) {
          if (currentRow.getValue(this.columns.getIdentifier().index) == lastSelectedRowId){ 
            if (!dojo.hasClass(this.tableNode.rows[i].cells[this.selectedCell], "DataGrid_Body_Cell_clicked")){
              dojo.addClass(this.tableNode.rows[i].cells[this.selectedCell], " DataGrid_Body_Cell_clicked");
            }
            lastRowFound = true;
          }
        }
      } else {
        if(isGridFocused) {
          openbravo.widget.DataGrid.html.prereplaceClass(this.tableNode.rows[i], 
            i % 2 == 0 ? "DataGrid_Body_Row_Even" : "DataGrid_Body_Row_Odd", 
            "DataGrid_Body_Row_focus");
        } else {
          openbravo.widget.DataGrid.html.prereplaceClass(this.tableNode.rows[i], 
            i % 2 == 0 ? "DataGrid_Body_Row_Even" : "DataGrid_Body_Row_Odd", 
            "DataGrid_Body_Row_selected");
        }
        for (var j = 0; j < this.columns.count(); j++) {
          if (dojo.hasClass(this.tableNode.rows[i].cells[j], "DataGrid_Body_Cell_selected")) {
            dojo.removeClass(this.tableNode.rows[i].cells[j], "DataGrid_Body_Cell_selected");
          }
          if (dojo.hasClass(this.tableNode.rows[i].cells[j], "DataGrid_Body_Cell_clicked")) {
            dojo.removeClass(this.tableNode.rows[i].cells[j], "DataGrid_Body_Cell_clicked");
          }
        }
      }
    }
  },

/**
* This method is used by scroll driver to cancel the edition of the cells when it is scrolling.
* @param {EventHandler} evt - event handler
*/
  handleScroll: function(evt) {
    if (this.editing){
      this.cancelEdit();
    }
  },

/**
*It identifies if a row number is inside the range of visible rows.
* @param {Number} rowNo - Row number.
* @return True: if is in range - False: else.
* @type Boolean
*/
  isVisible: function(rowNo) {
    var contentOffset = this.getCurrentOffset();
    var maxOffset = contentOffset + this.numRows; 
    return contentOffset <= rowNo && rowNo <= maxOffset;
  },

/**
* It returns the object that points at the cell in which there is contained the node that is given to him. It is used on the events onClick, onDblClick and on the selection, to obtain the cell without worrying about if it has been clicked on a son node or on the proper td one.
* @param {Object} node - the node
* @return the correct node.
* @type Object
*/
  _getContainerCell: function(node) {
    var isNobr = false;
    try {
      isNobr = (node.nodeName.toLowerCase() == "nobr");
    } catch (ignored) {isNobr = false;}
    while (node && (!dojo.hasClass(node, 'DataGrid_Body_Cell_hover') || isNobr)) {
      node = openbravo.widget.DataGrid.html.getParentByType(node, "td");
      if (node && !dojo.hasClass(node, 'DataGrid_Body_Cell_hover')){
        node = node.parentNode;
      }
      try {
        isNobr = (node.nodeName.toLowerCase() == "nobr");
      } catch (ignored) {isNobr = false;}
    }
    return node;
  },

/**
* It is the method that manages the double click on a cell. In a editable grid the cell will be opened in edition mode, using the function editCell. If the grid is not editable, it will call to the function onRowDblClick, to which the cell will be given as a parameter. The function onRowDblClick is a user's function so it have to be implementated by the user for the concrete case.
* @param {EventHandler} evt - event handler
*/
  cellDoubleClicked: function(evt) {
    isClickOnGrid=true;
    focusGrid();
    currentWindowElementType = 'grid';
    setWindowElementFocus('grid_table_dummy_input','id');
    var node = evt.target;
    var isCell = node.nodeName.toLowerCase() == "td";
    if (!isCell) {
      node = this._getContainerCell(node);
      isCell = (node.nodeName.toLowerCase() == "nobr");
    }
    if (this.editable && node && node != this.editingCell){
      this.editCell(node);
    }else if (node){
      onRowDblClick(node);
    }
  },

/**
* It manages the event click on a cell. For it, it will control if someone was editing another cell, saving it, also it will control if the row has been changed, to save the row (in case something had been modified in the previous row) and, finally, set as selected the clicked cell.
* @param {EventHandler} evt - event handler
*/
  cellClicked: function(evt) {
    isClickOnGrid=true;
    focusGrid();
    currentWindowElementType = 'grid';
    setWindowElementFocus('grid_table_dummy_input','id');
    if (this.locked) { return; }
    this.lastHoveredColumn = null;
    var isCell = (evt.target.nodeName.toLowerCase() == "td");
    var cell = evt.target;
    if (!isCell) {
      cell = this._getContainerCell(cell);
      isCell = (evt.target.nodeName.toLowerCase() == "nobr");
    }
    if (!cell) { return; }
    var rowNode = cell.parentNode;
    var offset = this.getCurrentOffset() + rowNode.rowIndex;
    var success = true;
    if (this.editing && cell && this.editingCell != cell) {
      success = this.saveCell();
    }
    if (this.editingRow && this.editingRow.offset != offset && isCell && success) {
      success = this.saveRow();
    }
    if (isCell && (!this.editingRow || !this.editingRow.error) && success) {
      this.handleSelection(evt);
    }
    checkAttachmentIconRelation();
  },

/**
* It is the method that controls the selection of rows. It is which is called from the method cellClicked to manage the marked one with the clicked. Between the operations that it realizes, they are controlling the multiple selections one, which can cause a call to the backend to obtain the list of ids selected (when there are ids that are not in the visible range).
* @param {EventHandler} evt - event handler
*/
  handleSelection: function(evt) {
    var isCell = (evt.target.nodeName.toLowerCase() == "td");
    var cell = evt.target;
    if (!isCell) {
      cell = this._getContainerCell(cell);
    }
    var rowNode = cell.parentNode;
    if (!rowNode) { return; }
    if ((!evt.ctrlKey && !evt.shiftKey) || this.multipleRowSelection==false){
      this.selectedRows.clear();
    }
    var rowNo = this.getCurrentOffset() + rowNode.rowIndex;
    var gridRow = this.buffer.getRow(rowNo);
    if (!gridRow) { return; }
    this.tableNode.focus();
    if (evt.shiftKey) {
      if(this.selectedRows.count() > 0) {
        var contentOffset = this.getCurrentOffset();
        var maxOffset = contentOffset + this.numRows;
        var lastSelectedRow = this.selectedRows.getLastSelected();
        var lastAddedRowOffset = lastSelectedRow.offset;
        var selectedRowOffset = gridRow.offset;
        var minValue = (lastAddedRowOffset >=  selectedRowOffset ? selectedRowOffset : lastAddedRowOffset);
        var maxValue = (lastAddedRowOffset >=  selectedRowOffset ? lastAddedRowOffset : selectedRowOffset);
        if (contentOffset <= lastAddedRowOffset && lastAddedRowOffset < maxOffset
          && contentOffset <= selectedRowOffset && selectedRowOffset < maxOffset){
          var numRows = maxValue - contentOffset;
          for (var i = (minValue - contentOffset); i < numRows; i++) {
            var currentRow = this.buffer.getRow(contentOffset + i);
            this.addSelectedRow(currentRow.getValue(this.columns.getIdentifier().name), contentOffset + i);
          }
        } else {
          var serviceUrl = {
            url: this.dataUrl,
            handler: dojo.hitch(this, "idsReceived", minValue),
            method: "POST",
            handleAs: "xml"
          };
          var content = [];
          if (this.requestParams) {
            for (var param in this.requestParams) {
              content[param] = this.requestParams[param];
            }
          }
          content["action"] = "getIdsInRange";
          content["minOffset"] = minValue;
          content["maxOffset"] = maxValue;
          if (this.sortCols) {
            content["sort_cols"] = this.sortCols;
            content["sort_dirs"] = this.sortDirs;
          }
          openbravo.widget.DataGrid.io.asyncCall(serviceUrl, content);
        }
      }
    }
    if (evt.ctrlKey && dojo.hasClass(rowNode, "DataGrid_Body_Row_focus")) {
      this.selectedRows.remove(gridRow.getValue(this.columns.getIdentifier().name));
    } else {
      var row = {id: gridRow.getValue(this.columns.getIdentifier().name), offset: rowNo};
      this.selectedRows.add(row);
      this.selectedCell = dojo.indexOf(cell.parentNode.cells, cell);
    }
    this.showSelection();
    if (evt.shiftKey || evt.ctrlKey){
      dojo.stopEvent(evt);
    }
  },

/**
* It adds  to the array of selected rows, the new selected row. It receives as parameters the value of the index field of the row and the offset. This method is called from the methods handleSelection and idsReceived.
* @param {String} id - Identifier of the selected row.
* @param {Number} offset - Offset of the row.
*/
  addSelectedRow: function(id, offset) {
    var row = {id: id, offset: offset};
    this.selectedRows.add(row);
  },

/**
* It is the method that manages the response of the backend call when the out of range ids are requested. This method is called from other methods.
*/
  idsReceived: function(minOffset, data, evt) {
    var xmlrangeid = data.getElementsByTagName('xml-rangeid');
    var status = xmlrangeid[0].getElementsByTagName('status');
    if (status.length>0){
      var type = status[0].getElementsByTagName('type');
      var title = status[0].getElementsByTagName('title');
      var description = status[0].getElementsByTagName('description');
      if (dojox.data.dom.textContent(type[0]).toUpperCase() != 'HIDDEN') {
        try {
          renderMessageBox(dojox.data.dom.textContent(type[0]),dojox.data.dom.textContent(title[0]),dojox.data.dom.textContent(description[0]));
        } catch (err) {
          alert(dojox.data.dom.textContent(title[0]) + ":\n" + dojox.data.dom.textContent(description[0]));
        }
      }
    }
    var ids = xmlrangeid[0].getElementsByTagName('id');
    for (var i = 0; i < ids.length; i++) {
      this.addSelectedRow(dojox.data.dom.textContent(ids[i]), minOffset + i);
    }
    this.showSelection();
  },

/**
* It will be thrown when the enter key is pressed on a cell. It does the exit of the edition if a cell was being edited, or the entry in current cell edition.
*/
  enterKeyPressed: function() {
    if (this.editing) {
      this.saveCell();
      setTimeout( dojo.hitch(this, function() {
        this.setFocus();
      }), 200);
    } else {
      var lastSelectedRow = this.selectedRows.getLastSelected();
      if (lastSelectedRow != null) {
        var rowOffset = lastSelectedRow.offset;    
        var currentOffset = this.getCurrentOffset();
        if (rowOffset < currentOffset || rowOffset >= (currentOffset + this.numRows)) {
          this.goToRow(rowOffset);
        } else {
          var rowNo = rowOffset - this.getCurrentOffset();
          if (rowNo >= 0){
            this.editCell(this.tableNode.rows[rowNo].cells[this.selectedCell]);
          }
        }
      }
    }
  },

/**
* Handler to the startEditingCell function.
* @param {Number} rowOffset - Row offset.
* @return Handler to the startEditingCell function.
* @type Handler
*/
  getStartEditingFunction: function(rowOffset) {
    var _this = this;
    var hitch =  dojo.hitch(_this, "startEditingCell", rowOffset, hitch);
    return hitch;
  },

/**
* Manage the begining of the edition of a cell
* @param {Number} rowOffset - row offset
* @param {Handler} hitch - handler to itself
*/
  startEditingCell: function(rowOffset, hitch) {
    this.options.onRefreshComplete.remove(hitch);
    var currentOffset = this.getCurrentOffset();
    var rowNo = rowOffset - currentOffset;
    if (rowNo >= 0) {
      this.editCell(this.tableNode.rows[rowNo].cells[this.selectedCell]);
    }
  },

/**
* It associates the keys with the corresponding methods, in order that they are executed to the pulsation of these. For example, to associate the method deleteRow to the key delete.
* @return Key mapping object
* @type keyMapping
*/
  _getKeyMapping: function() {
    if (!this.keyMapping) {
      var k = dojo.keys;
      this.keyMapping = [];
      var m = this.keyMapping;
      /* Remove to let the shortcuts.js to do the job
      m[k.KEY_ESCAPE] = this.cancelEdit;
      m[k.KEY_ENTER] = this.enterKeyPressed;
      m[k.KEY_INSERT] = this.addNewRow;
      m[k.KEY_DELETE] = this.deleteRow;
      m[k.KEY_UP_ARROW] = this.goToPreviousRow;
      m[k.KEY_DOWN_ARROW] = this.goToNextRow;
      m[k.KEY_LEFT_ARROW] = this.goToLeftCell;
      m[k.KEY_RIGHT_ARROW] = this.goToRightCell;
      m[k.KEY_HOME] = this.goToFirstRow;
      m[k.KEY_END] = this.goToLastRow;
      m[k.KEY_PAGE_UP] = this.goToPreviousPage;
      m[k.KEY_PAGE_DOWN] = this.goToNextPage;
      for (var key in m) {
        m[key] = dojo.hitch(this, m[key]);
      }*/
    }
    return this.keyMapping;
  },

/**
* It defines the array of keys which provoke the paralysation of the events in execution. It is a question of the events that will capture the grid and must not allow that they should go off up, continuing with its normal execution in the browser.
* @return Array of keys
* @type Array
*/
  _getKeyEventsToStop: function() {
    if (!this.keyEventsToStop) {
      var k = dojo.keys;
      this.keyEventsToStop = [k.KEY_UP_ARROW, k.KEY_DOWN_ARROW,
        k.KEY_HOME, k.KEY_END];
    }
    return this.keyEventsToStop;
  },

/**
* It defines the array of keys allowed in the edition mode.
* @return Array of allowed keys.
* @type Array.
*/
  _allowedKeys: function() {
    var k = dojo.keys;
    return [k.KEY_ENTER, k.KEY_ESCAPE];
  },

/**
* It manages the pulsation of a key on the grid. It will purify if it is a question of someone of the allowed keys, if a method has associated to shoot and if it is a question of one of the keys that they must be captured in order that it does not continue its execution in the browser.
* @param {EventHandler} evt - event handler
*/
  keyPressed: function(evt) {
    if (this.locked) { return; }
    var k = dojo.keys;
    var keyCode = evt.keyCode;
    var stopEvent = openbravo.widget.DataGrid.html.inArray(this._getKeyEventsToStop(), keyCode);
    if (this.editing && !openbravo.widget.DataGrid.html.inArray(this._allowedKeys(), keyCode)) { return; }
    var handler = this._getKeyMapping()[keyCode];
    if (handler){
      handler();
    }
    if (stopEvent || keyCode == k.KEY_ENTER && dojo.isIE){
      dojo.stopEvent(evt);
    }
  },

/**
* It is a small additional control to save the information in case of leaving of the page having the edition by half.
* @param {EventHandler} evt - event handler
*/
  onPageUnload: function(evt) {
    if (this.editingRow){
      this.saveRow();
    }
  },

/**
* It moves to the previous cell inside the same row. It will be associated with the left cursor key.
*/
  goToLeftCell: function() {
    this.moveSelectedCell(-1);
  },

/**
* It moves to the next cell inside the same row. It will be associated with the right cursor key.
*/
  goToRightCell: function() {
    this.moveSelectedCell(1);
  },

/**
* It is the one that realizes the movement of the area to a new cell, managing the effects of visualization. It is called by the methods goToLeftCell and goToRightCell.
* @param {Number} mov - number of moved cells
*/
  moveSelectedCell: function(mov) {
    if (!this.editing) {
      var validRow = false;
      var cellNo = this.selectedCell + mov;
      while(cellNo >= 0 && cellNo < this.columns.count() && !validRow) {
        validRow = this.checkCell(cellNo);
        if (!validRow){
          cellNo += mov;
        }
      }
      if (validRow) {
        this.selectedCell = cellNo;
        this.showSelection();
        dijit.scrollIntoView(this.tableNode.rows[0].cells[this.selectedCell]);
      }
    }
  },

/**
* It verifies that a number of cell exists (> 0 and < column_number). If it exists it verifies that it is visible, returning true or false. In any another case, it will return false. This method is used by moveSelectedCell.
* @param {Number} cellNo - cell number
* @return True: if is visible - False: if is not visible
* @type Boolean
*/
  checkCell: function (cellNo) {
    if (cellNo >= 0 && cellNo < this.columns.count()) {
      var column = this.columns.get(cellNo);
      return column.visible;
    } else {
      return false;
    }
  },

/**
* It manages the positioning of the cursor on a column header. It will do the highlighted of the cell and, in case of having selected records and be a numerical column (integer or float), it will throw the call to the backend to obtain the column total.
* @param {EventHandler} evt - event handler
*/
  hoverCellHeader: function(evt) {
    if (!dojo.hasClass(evt.target, 'DataGrid_Header_Cell_hover')){
      dojo.addClass(evt.target, 'DataGrid_Header_Cell_hover');
    }
    var header = openbravo.widget.DataGrid.html.getParentByType(evt.target, "th");
    var columnNo = dojo.indexOf(header.parentNode.cells, header);
    var column = this.columns.get(columnNo);
    if (column != null && this.selectedRows.count() > 0) {
      var index = column.index;
      if (!this.lastHoveredColumn || this.lastHoveredColumn.index != index) {
        var type = column.type.name;
        if (type == "integer" || type == "float") {
          this.lastHoveredColumn = column;
          var dataInBuffer = this.selectedRows.count() > 0;
          var total = 0;
          var selectedRows = this.selectedRows.getIterator();
          while (!selectedRows.atEnd() && dataInBuffer){
            var currentRow = selectedRows.get();
            var offset = currentRow.value.offset;
            if (this.buffer.isInRange(offset)) {
              var bufferedRow = this.buffer.getRow(offset);
              total += parseFloat(bufferedRow.getValue(index));
            } else { dataInBuffer = false; }
          }
          if (!dataInBuffer){
            this.requestColumnTotals(column.name);
          } else {
            this.lastAddition = total;
            window.status = parseFloat(this.lastAddition);
          }
        } else {
          window.status = "";
        }
      } else {
        var type = this.lastHoveredColumn.type.name;
        if (type == "integer" || type == "float"){
          window.status = parseFloat(this.lastAddition);
        }
      }
    }
  },

/**
* It is the method that calls to the backend to obtain the column total of numerical column. It is called by the hoverCellHeader method.
* @param {String} rowName - name of the row
*/
  requestColumnTotals: function(rowName){
    setCalloutProcessing(true);
    var handlerRef = dojo.hitch(this, "showColumnTotals");
    var params = [];
    params["action"] = "getColumnTotals";
    params["columnName"] = rowName;
    params["rows"] = this.getSelectedRows();
    var serviceUrl = {
      url: this.dataUrl,
      handler: handlerRef,
      method: "POST",
      handleAs: "xml"
    };
    openbravo.widget.DataGrid.io.asyncCall(serviceUrl, params);
  },

/**
* It manages the header class update to remove the hovered effect.
* @param {EventHandler} evt - event handler
*/
  plainCellHeader: function(evt) {
    if (dojo.hasClass(evt.target, 'DataGrid_Header_Cell_hover')){
      dojo.removeClass(evt.target, 'DataGrid_Header_Cell_hover', false);
    }
    window.status = "";
  },

/**
* It is the method that manages the response of the backend with the column total.
* @param {String} type - 
* @param {XML Structure} data - data structure
* @param {EventHandler} evt - event handler
*/
  showColumnTotals: function(data, evt) {
    this.lastAddition = openbravo.widget.DataGrid.html.getContentAsString(data.getElementsByTagName('total')[0]);
    window.status = parseFloat(this.lastAddition);
  },

/**
* It manages the grid width, taking into account the scrollbars.
*/
  setBounds: function() {
    var maxWidthInt = openbravo.widget.DataGrid.html.extractPx(this.maxWidth);
    if (maxWidthInt > 0 && maxWidthInt <= this.domNode.offsetWidth) {
      this.tableNode.parentNode.style.width = this.maxWidth;
      this.domNode.style.width = maxWidthInt +
        2 * this.scrollWidth + 8 + "px";
    }
  },

/**
* It eliminates the onmouseover and onmouseout events of all grid cells. This method is associated with the onUnload  event of the page, to realize a clean of javascript.
*/
  cleanup: function() {
    var table = this.tableNode;
    for (var i = 0; i < table.rows.length; i++) {
      for (var j = 0; j < table.rows[i].cells.length; j++) {
        var cell = table.rows[i].cells[j];
        cell.onmouseover = null;
        cell.onmouseout = null;
      }
    }
  },

/**
* It does the necessary operations to calculate the maximum grid width.
* @return Max width
* @type Number
*/
  setMaxWidth: function() {
    if(this.percentageWidthRelativeToId != "body") {
      var maxWidthInt = Math.round(this.proportion * document.getElementById(this.percentageWidthRelativeToId).clientWidth);
    } else {
      var maxWidthInt = Math.round(this.proportion * dijit.getViewport().width);
    }
    maxWidthInt -= 2 * this.scrollWidth;
    this.maxWidth = maxWidthInt + "px";
    return maxWidthInt;
  },

/**
* It manages the grid resizing.
*/
  onResize: function() {
    this.setMaxWidth();
    if (this.numRows != calculateNumRows()) {
      this.numberOfResizes += 1;
      this.offsetBeforeResize = this.getCurrentOffset();
      this.hasBeenResized = true;
      this.numRows = calculateNumRows();
      this.visibleRows = this.numRows;
      this.visibleRowsMax = this.numRows;
      document.getElementById(this.widgetId + '_container').innerHTML = ""; 
      document.getElementById(this.widgetId + '_container').style.display='none';
      document.getElementById(this.widgetId + '_container').setAttribute('id',this.widgetId + '_container_old' + this.numberOfResizes);
      this.render();
    }

    if(this.percentageWidthRelativeToId != "body") {
      var desiredWidth = Math.round(this.proportion * document.getElementById(this.percentageWidthRelativeToId).clientWidth);
    } else {
      var desiredWidth = Math.round(this.proportion * dijit.getViewport().width);
    }
    this.tableNode.parentNode.style.width = desiredWidth - 
      2 * this.scrollWidth + "px";
    this.domNode.style.width = desiredWidth - 
      2 * this.scrollWidth + 40 + "px";
  },

/**
* It does the painting the grid in the page. This method is necessary in dojo for the control construction.
*/
  render: function() {
    var hoverCell = function(evt) {
      if (dojo && !dojo.hasClass(this, 'DataGrid_Body_Cell_hover')
        && !dojo.hasClass(this, 'DataGrid_Body_Cell_clicked')){
        dojo.addClass(this, 'DataGrid_Body_Cell_hover');
      }
    };

    var plainCell = function(evt) {
      if (dojo && dojo.hasClass(this, 'DataGrid_Body_Cell_hover')){
        dojo.removeClass(this, 'DataGrid_Body_Cell_hover', false);
      }
    };

    var gridId = this.widgetId;
    var tableHeader = document.createElement("table");
    if(isGridFocused) { tableHeader.className = 'DataGrid_Header_Table_focus'; }
    else { tableHeader.className = 'DataGrid_Header_Table'; }
    if (this.sortable){
      tableHeader.id = gridId + '_table_header';
    }
    tableHeader.cellspacing = 0;
    tableHeader.cellpadding = 0;
    var thead = document.createElement('tbody');
    var numCols = this.columns.count();
    var row = document.createElement("tr");
    var totalWidth = 0;
    for(var j = 0; j < numCols; j++) {
      var cell = document.createElement("th");
      var colMetadata = this.columns.get(j);
      cell.className = openbravo.widget.DataGrid.Column.prototype.DEFAULT_HEADER_CLASS;
      dojo.addClass(cell, colMetadata.headerClassName);
      dojo.connect(cell, "onmouseover", this, "hoverCellHeader");
      dojo.connect(cell, "onmouseout", this, "plainCellHeader");
      dojo.connect(cell, "onmousedown", this, "resizeHeader");

      var s = colMetadata.title;
      cell.innerHTML = (s && typeof s == 'string')? s.split(" ").join("&nbsp;") : s; 
      if (colMetadata.visible) {
        cell.style.width = colMetadata.width;
        var end = colMetadata.width.indexOf("px");
        var rowWidth = colMetadata.width.substring(0, end);
        totalWidth += parseInt(rowWidth);
      }else{
        cell.style.display = "none";
      }
      row.appendChild(cell);
    }
    thead.appendChild(row);
    tableHeader.style.width = totalWidth + 'px';
    tableHeader.appendChild(thead);
    var table = document.createElement("table");
    table.id = gridId + "_table";
    table.cellspacing = "0";
    table.cellpadding = "0";
    if(isGridFocused) { table.className = 'DataGrid_Body_Table_focus'; }
    else { table.className = 'DataGrid_Body_Table'; }
    table.style.width = totalWidth + 'px';
    var tbody = document.createElement("tbody");
    for (var i = 0; i < this.numRows; i++) {
      var row = document.createElement("tr");
      row.className = 'DataGrid_Body_Row';
      dojo.addClass(row,( i % 2 == 0 ? "DataGrid_Body_Row_Even" : "DataGrid_Body_Row_Odd"));
      dojo.connect(row, "onclick", this, "cellClicked");
      dojo.connect(row, "ondblclick", this, "cellDoubleClicked");
      for(var j = 0; j < numCols; j++) {
        var cell = document.createElement("td");
        var colMetadata = this.columns.get(j);
        cell.className = openbravo.widget.DataGrid.Column.prototype.DEFAULT_CLASS;
        dojo.addClass(cell, colMetadata.className);
        cell.onmouseover = hoverCell;
        cell.onmouseout = plainCell;
        openbravo.widget.DataGrid.html.disableSelection(cell);
        var emptyText = document.createTextNode("");
        cell.appendChild(emptyText);
        if (colMetadata.visible){
          cell.style.width = colMetadata.width;
        }else{ 
          cell.style.display = "none";
        }
        row.appendChild(cell);
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    table.focus();
    this.tableNode = table;
    this.tableHeader = tableHeader;
    if (dojo.isIE && !this.hasBeenResized) {
      dojo.connect(this.domNode, "onkey", this, "keyPressed");
    } else if (!this.hasBeenResized) {
      dojo.connect(document, "onkey", this, "keyPressed");
    }
    var container = this.domNode;
    var gridContainer = document.createElement("div");
    gridContainer.id = gridId + "_container";
    gridContainer.innerHTML = "<div style='float:left'></div>";
    var viewPort = gridContainer.firstChild;
    viewPort.id = gridId + "_viewPort";
    viewPort.style.overflow = "hidden";
    viewPort.appendChild(tableHeader);
    viewPort.appendChild(table);
    container.appendChild(gridContainer);
    this.setBounds();
    table.style.height = (row.offsetHeight + 1) * (this.numRows);
    this.domNode.style.height = table.offsetHeight + "px";
    if (!this.hasBeenResized) {
      var sortColsName = new Array();
      if (this.sortCols!=null && this.sortCols!="") {
        var auxSortCols = this.sortCols.split(",");
        var totalSortCols = auxSortCols.length;
        for (var i=0; i<totalSortCols;i++) {
          sortColsName[i] = this.columns.get(auxSortCols[i]).name;
        }
      }
      /*var auxRow = {id: this.defaultRow, offset: this.offset};
        this.selectedRows.add(auxRow);*/
      var opts = {
        prefetchBuffer : true,
        offset: this.offset, 
        columns: this.columns, 
        sortCols: sortColsName,
        sortDirs: ((this.sortDirs!=null && this.sortDirs!="")?this.sortDirs.split(","):[]),
        defaultRow: this.defaultRow,
        onscroll : this.onScroll
      };
    } else {
      var opts = {
        prefetchBuffer : true,
        offset: this.offset, 
        columns: this.columns, 
        defaultRow: this.defaultRow,
        onscroll : this.onScroll
      };
    }

    this.postRendering(opts);
    if (this.proportion){
      dojo.connect(window, "onresize", this, "onResize");
    }
    dojo.connect(this.scroller, "handleScroll", this, "handleScroll");
    dojo.addOnUnload(this, "cleanup");
    setCalloutProcessing(false);
  },

/**
* It is an auxiliary method for do the event capture for the grid. It calls to the dojo function which does this purpose.
* @param {String} eventName - event handler
* @param {Object} handler - handler
*/
  captureEvent: function(eventName, handler) {
    dojo.connect(this.tableNode, eventName, handler);
  },

/**
* It returns an array with the selected rows identifiers. It uses the internal array of selected rows as origin of data (it is the one that is refilled with the addSelectedRow method).
* @return Array with the selected rows ids
* @type Array
*/
  getSelectedRows: function() {
    var selectedRowsIds = [];
    this.selectedRows.forEach(function(row) {
      selectedRowsIds.push(row.value.id);
    });
    return selectedRowsIds;  
  },

/**
* It returns an array with the selected rows offsets. It uses the internal selected rows array as origin of data (it is the one that is refilled with the method addSelectedRow).
* @return Array with the selected positions
* @type Array
*/
  getSelectedRowsPos: function() {
    var selectedRowsPos = [];
    this.selectedRows.forEach(function(row) {
      selectedRowsPos.push(row.value.offset);
    });
    return selectedRowsPos;  
  },

/**
* It verifies if some record is edited, throwing the saveRow in affirmative case.
* @return False: if try to save and fails - True: any other cases
* @type Boolean
*/
  checkEditingRow: function() {
    return this.editingRow ? this.saveRow() : true;
  },

/**
* It moves the focus to the previous row. It will be associated with the key cursor up.
*/
  goToPreviousRow: function() {
    if (this.checkEditingRow()){
      this.moveFromLastSelected(-1);
    }
  },

/**
* It moves the focus to the following row. It will be associated with the key cursor down.
*/
  goToNextRow: function() {
    if (this.checkEditingRow()){
      this.moveFromLastSelected(1);
    }
  },

/**
* It moves the focus to the first row of the grid. It will be associated with the key home.
*/
  goToFirstRow: function() {
    if (this.checkEditingRow()){
      this.goToRow(0);  
    }
  },

/**
* It moves the area to the last row of the grid. It will be associated with the key end.
*/
  goToLastRow: function() {
    if (this.checkEditingRow()){
      this.goToRow(this.metaData.totalRows - 1);
    }
  },

/**
* It moves the area to the previous visible page.
*/
  goToPreviousPage: function() {
    if (!this.editing){
      this.moveCurrentPosition(-this.numRows);
    }
  },

/**
* It moves the area to the next visible page.
*/
  goToNextPage: function() {
    if (!this.editing){
      this.moveCurrentPosition(this.numRows);
    }
  },

/**
* It puts the page focus in the grid, selecting the first record, in case any selected record exists.
*/
  setFocus: function() {
    this.tableNode.focus();
    if (this.selectedRows.count() == 0){
      this.goToFirstRow();
    }
    else { this.goToRow(this.selectedRows.getLastSelected().offset); }
    this.showSelection();
  },

/**
* It establishes the order for a column as determinated, realizing the needed operations for the visualization.
* @param {Number} columnId - column id
* @param {String} sortOrder - it could be "ASC" or "DESC" depending if the order is ascending or descendinf
*/
  setSortedColumns: function(columnId, sortOrder) {
    this.sort.setColumnSort(columnId, ((sortOrder=="DESC")?openbravo.widget.DataGrid.Column.SORT_DESC:openbravo.widget.DataGrid.Column.SORT_ASC));
    this.sortHandler(this.sortColumns);
  },

/**
* It adds a new record to the grid.
*/
  addNewRow: function() {
    if (!this.checkEditingRow()) { return; }
    if (this.editingRow && this.editingRow.isNewRow) { return; }
    var handler = dojo.hitch(this, function() {
      this.options.onRefreshComplete.remove(handler);
      var contentOffset = this.getCurrentOffset();
      var rowNo = this.numRows - 1 + contentOffset;
      var pos = rowNo - this.buffer.startPos;
      this.editingRow = this.createRowObject(this.metaData.totalRows - 1);
      var values = [];
      for ( var i=0; i < this.metaData.columnCount; i++ ){ 
        values[i] = "";
      }
      this.editingRow.setValues(values);
      this.editingRow.isNewRow = true;
      this.editingRow.rowNode = this.tableNode.rows[this.visibleRows - 1];
      this.editingRow.setValue(0, this.metaData.totalRows);
      this.editingRow.getDefaultValues(this.dataUrl);
      this.buffer.rows[pos] = this.editingRow;
      this.selectRow(this.metaData.totalRows - 1);
    });
    this.options.onRefreshComplete.push(handler);
    this.metaData.totalRows++;
    this.setTotalRows(this.metaData.totalRows);
    this.goToRow(this.metaData.totalRows - 1);
  },

/**
* It eliminates records of the grid. This method will be associated with the delete key. It calls the backend in order that it realizes the necessary operations for the elimination of the same one.
*/
  deleteRow: function() {
    if (this.selectedRows.count() > 0 &&
      this.selectedRows.getLastSelected() != null && showJSMessage(2)) {
      if (this.editing){
        this.cancelEdit();
      }
      this.editingRow = null;
      var content = [];
      content["action"] = "deleteRow";
      var rows = [];
      this.selectedRows.forEach(dojo.hitch(this, function(row) {
        if (row.value.id){
          rows.push(row.value.id);
        }
        //this.metaData.totalRows--;
      }));
      if (rows.length > 0) {
        content["rows"] = rows;
        //this.selectedRows.clear();
        var handlerRef = dojo.hitch(this, "refreshGridDataAfterDelete");
        var serviceUrl = {
          url: this.updatesUrl,
          handler: handlerRef,
          method: "POST",
          handleAs: "xml"
        };
        openbravo.widget.DataGrid.io.asyncCall(serviceUrl, content);
      }
      else{
        this.refreshGridData();
      }
    }
  },

/**
* It is the method that manages the response of the backend for the elimination of records. It updates the grid to eliminate its missing record, as well as, to update the whole of existing records in the grid.
* @param {String} type - 
* @param {XML Structure} data - data structure
* @param {EventHandler} evt - event handler
*/
  refreshGridDataAfterDelete: function(data, evt) {
    var xmldelete = data.getElementsByTagName('xml-delete');
    var status = xmldelete[0].getElementsByTagName('status');
    if (status.length>0){
      var type = status[0].getElementsByTagName('type');
      var title = status[0].getElementsByTagName('title');
      var description = status[0].getElementsByTagName('description');
      if (dojox.data.dom.textContent(type[0]).toUpperCase() != 'HIDDEN') {
        try {
          initialize_MessageBox('messageBoxID');
        } catch (ignored) {}
        try {
          setValues_MessageBox('messageBoxID',dojox.data.dom.textContent(type[0]), dojox.data.dom.textContent(title[0]), dojox.data.dom.textContent(description[0]));
        } catch (err) {
          alert(dojox.data.dom.textContent(title[0]) + ":\n" + dojox.data.dom.textContent(description[0]));
        }
      }
    }
    var info = xmldelete[0].getElementsByTagName('info');
    var result = info[0].getElementsByTagName('result');
    var total = info[0].getElementsByTagName('total');
    if (dojox.data.dom.textContent(result[0]) != 0){
      this.metaData.totalRows = this.metaData.totalRows - parseInt(dojox.data.dom.textContent(total[0]));
      this.selectedRows.clear();
      this.refreshGridData();
    }
    this.onResize();
  },

/**
* It manages the response of the backend after the filtrate.
*/
  refreshGridDataAfterFilter: function() {
    this.buffer.isFilter=true;
    this.selectedRows.clear();
    this.isFirstLoad = true;
    selectedRow = 0;
    this.setTotalRows(this.visibleRowsMax);
    this.moveTableContent(0);
    this.isIE = dojo.isIE;
    if(!this.isIE){
      this.goToFirstRow();
    }
    return true;
  },

/**
* It updates the visualization of the grid, rewriting the classes in every row...
*/
  refreshGridData: function() {
    for (var i = 0; i < this.numRows; i++) {
      if(isGridFocused) {
        openbravo.widget.DataGrid.html.prereplaceClass(this.tableNode.rows[i], 
          i % 2 == 0 ? "DataGrid_Body_Row_Even" : "DataGrid_Body_Row_Odd",
          "DataGrid_Body_Row_focus");
      } else {
        openbravo.widget.DataGrid.html.prereplaceClass(this.tableNode.rows[i], 
          i % 2 == 0 ? "DataGrid_Body_Row_Even" : "DataGrid_Body_Row_Odd",
          "DataGrid_Body_Row_selected");
      }
    }
    var contentOffset = this.getCurrentOffset();
    if (contentOffset > this.metaData.totalRows - this.numRows){
      contentOffset = this.metaData.totalRows - this.numRows;
    }
    if (contentOffset < 0){
      contentOffset = 0;
    }
    this.setTotalRows(this.metaData.totalRows);
    this.moveTableContent(contentOffset);
  },

/**
* It display the grid focused.
*/
  focusGrid: function() {
    isGridFocused = true;
    openbravo.widget.DataGrid.html.prereplaceClass(this.table, 'DataGrid_Body_Table_focus', 'DataGrid_Body_Table');
    openbravo.widget.DataGrid.html.prereplaceClass(this.tableHeader, 'DataGrid_Header_Table_focus', 'DataGrid_Header_Table');
    for (var i = 0; i < this.numRows; i++) {
      if (this.tableNode.rows[i].className.indexOf('DataGrid_Body_Row_selected') != -1) {
        openbravo.widget.DataGrid.html.prereplaceClass(this.tableNode.rows[i], 'DataGrid_Body_Row_focus', 'DataGrid_Body_Row_selected');
      }
    }
    return true;
  },

/**
* It display the grid blured.
*/
  blurGrid: function() {
    isGridFocused = false;
    openbravo.widget.DataGrid.html.prereplaceClass(this.table, 'DataGrid_Body_Table', 'DataGrid_Body_Table_focus');
    openbravo.widget.DataGrid.html.prereplaceClass(this.tableHeader, 'DataGrid_Header_Table', 'DataGrid_Header_Table_focus');
    for (var i = 0; i < this.numRows; i++) {
      if (this.tableNode.rows[i].className.indexOf('DataGrid_Body_Row_focus') != -1) {
        openbravo.widget.DataGrid.html.prereplaceClass(this.tableNode.rows[i], 'DataGrid_Body_Row_selected', 'DataGrid_Body_Row_focus');
      }
    }
    return true;
  },

/**
* It is an utility to modify the content of a cell.
* @param {Number} rowNo - number of row
* @param {Number} column - id of the column
* @param {String} value - new vale
*/
  setCellContent: function(rowNo, column, value) {
    var row = null;
    if (this.buffer.isInRange(rowNo)) {
      row = this.buffer.getRow(rowNo);
    }
    if (row != null) {
      var selectedColumn = this.columns.get(column);
      if (!isNaN(value)){
        value = parseFloat(value);
      }
      row.setValue(selectedColumn.index, value);
      row.sendRow();
    }
  },

/**
* It moves the area to a certain row. It is the method that they use goToPreviousRow and goToNextRow.
* @param {Number} mov - number of positions moved
*/
  moveFromLastSelected: function(mov) {
    if (this.selectedRows.count() > 0) {
      var lastRowOffset = this.selectedRows.getLastSelected().offset;
      var newRowNo = lastRowOffset + mov;
      if (newRowNo >= 0 && newRowNo < this.metaData.totalRows){
        this.goToRow(newRowNo);
      }
    }
  },

/**
* It set a row as selected, deleting the rest of selections. It registers the new row in the internal array of selected rows, deleting the rest of selected rows.
* @param {Number} rowNo - number of row
* @param {Handler} hitch - handler to itself
*/
  selectRow: function(rowNo, hitch) {
    var row = this.buffer.getRow(rowNo);
    if (!row){
      row = this.createRowObject(null);
    }
    var id = row.getValue(this.columns.getIdentifier().name);
    if (escape(id) != "%A0") {
      if (hitch){
        this.options.onRefreshComplete.remove(hitch);
      }
      var newRow = {id: id, offset: rowNo};
      this.selectedRows.clear();
      this.selectedRows.add(newRow);
      this.showSelection();
    }
  },

/**
* It is a visualization method that allows to obtain the scroll offset.
* @return Current offset
* @type Number
*/
  getCurrentOffset: function() {
    return parseInt(this.scroller.scrollerDiv.scrollTop /  this.viewPort.rowHeight);
  },

/**
* It adds parameters in order that be sent to the backend with the requests.
* @param {String} params - parameters
*/
  setRequestParams: function(params) {
    this.requestParams = params;
  },

/**
* It moves the grid scroll to a concrete row.
* @param {Number} rowNo - number of row
*/
  moveTableContent: function(rowNo) {
    this.fetchBuffer(rowNo);
    this.scroller.moveScroll(rowNo);
    this.viewPort.scrollTo(this.scroller.rowToPixel(rowNo));
  },

/**
* It moves the focus to a selected record. This method uses the moveTableContent one to do the scrolling inside the grid. This method will be used in the pulsations av. pag. and re. pag. keys
* @param {Number} mov - number of moved cells
*/
  moveCurrentPosition: function(mov) {
    var newPosition = this.getCurrentOffset() + mov;
    if (newPosition < 0){
      newPosition = 0;
    }else if (newPosition >= (this.metaData.totalRows - 1)){
      newPosition = this.metaData.totalRows - this.numRows;
    }
    this.moveTableContent(newPosition);
    this.selectRow(newPosition);
    this.showSelection();
  },

/**
* Return the selected row function.
* @param {Number} rowNo - number of row
* @return Handler to the selectRow function
* @type Object
*/
  getSelectRowFunction: function (rowNo) {
    var _this = this;
    var hitch =  dojo.hitch(this, "selectRow", rowNo, hitch);
    return hitch;
  },

/**
* It moves the focus to a concrete record, using the method moveTableContent to do the positioning.
* @param {Number} rowNo - number of row
*/
  goToRow: function(rowNo) {
    var _this = this;
    var hitch =  dojo.hitch(this, "selectRow", rowNo, hitch);
    if (rowNo >= 0) {
      var minOffset = this.getCurrentOffset();
      var maxOffset = minOffset + this.numRows;
      if (minOffset <= rowNo && rowNo < maxOffset) {
        if (this.metaData.totalRows <= this.numRows) {
          this.moveTableContent(0);
        }
        this.selectRow(rowNo);
      } else {
        if (hitch != null){
          this.options.onRefreshComplete.push(hitch);
        }
        if (rowNo == (minOffset - 1)) {
          this.moveTableContent(minOffset - 1);
        } else if (rowNo == maxOffset) {
          this.moveTableContent(minOffset + 1);
        } else if (rowNo >= (this.metaData.totalRows - 1)) {
          this.moveTableContent(rowNo - this.visibleRows + 1);
        } else if (rowNo >= (this.metaData.totalRows - this.visibleRows)) {
          this.moveTableContent(this.metaData.totalRows - this.visibleRows);
        } else {
          this.moveTableContent(rowNo);
        }
      }
      checkAttachmentIconRelation();
    }
  },

/**
* It manages the column resizing. First it updates the size of the table that contains the grid data, then the size of the table of the section of headers and, finally, it updates the sizes of this column for the header and each of the grid rows.
* @param {Object} headerRow - The header row object.
* @param {Object} column - the selected column to update width.
* @param {Number} newWidth - The new with.
*/
  resizeColumn: function(headerRow, column, newWidth) {
    if (column) {
      var columnNo = column.index;
      newWidth = (newWidth > 9 ? newWidth : 9);
      var currentTableWidth = openbravo.widget.DataGrid.html.extractPx(this.tableNode.style.width);
      var newTableWidth = currentTableWidth + 
      (newWidth - openbravo.widget.DataGrid.html.extractPx(column.width));
      if (currentTableWidth != newTableWidth){
        this.hasResized = true;    
      }
      newWidth += "px";
      this.columns.get(columnNo).width = newWidth;
      headerRow.cells[columnNo].style.width = newWidth;
      this.tableNode.style.width = newTableWidth + "px";
      this.tableHeader.style.width = newTableWidth + "px";
      dojo.forEach(this.tableNode.rows, function(row) {
        row.cells[columnNo].style.width = newWidth;
      });
    }
  },

/**
* It is the method that manages the columns resizing. This method calls to resizeColumn.
* @param {EventHandler} evt - event handler
*/
  doResize: function(evt) {
    var p = this.resizingParams;
    if (parent.isRTL) {
      var newWidth = p.width - evt.clientX + p.start;
    } else {
      var newWidth = p.width + evt.clientX - p.start;
    }
    p.self.resizeColumn(p.target.parentNode, p.column, newWidth);
    this.setBounds();
  },

/**
* End the resizing mode.
* @param {EventHandler} evt - event handler
*/
  endResize: function(evt) {
    var body = dojo.body();
    var p = this.resizingParams;
    if (parent.isRTL) {
      var newWidth = p.width - evt.clientX + p.start;
    } else {
      var newWidth = p.width + evt.clientX - p.start;
    }
    dojo.disconnect(this.startResizeConnection); 
    dojo.disconnect(this.endResizeConnection); 
    p.self.resizeColumn(p.target.parentNode, p.column, newWidth);
  },

/**
* It is the event that manages the resizing, indicating that the doResize must begin and, which event will make throw the endResize for the selected column.
* @param {EventHandler} evt - event handler
*/
  resizeHeader: function(evt) {
    var target = openbravo.widget.DataGrid.html.getParentByType(evt.target, "th");
    var body = dojo.body();
    var columnNo = dojo.indexOf(target.parentNode.cells, target);
    var column = this.columns.get(columnNo);
    //  var column = this.columns.get(--columnNo);
    //  while (column && !column.visible) {
    //    column = this.columns.get(--columnNo);
    //  }
    if (!column) { return; }
    this.resizingParams = {
      start: evt.clientX, 
      self: this,
      target: target,
      width: openbravo.widget.DataGrid.html.extractPx(column.width),
      scroll: target.parentNode.parentNode.scrollLeft,
      column: column
    }
    this.hasResized = false;
    this.startResizeConnection = dojo.connect(body, "onmousemove", this, "doResize");
    this.endResizeConnection = dojo.connect(body, "onmouseup", this, "endResize"); 
    dojo.stopEvent(evt);
  },

/**
* It is an auxiliary method for the render, which does the sizes adjustment operations after having constructed the object.
* @param {Array} options - Actual options.
*/
  postRendering: function(options) {
    this.options = {
      tableClass:           this.tableNode.className,
      loadingClass:         this.tableNode.className,
      scrollerBorderRight:  '1px solid #ababab',
      bufferTimeout:        15000,
      blankImg:             dojo.baseUrl + "../../openbravo/templates/blank.gif",
      sortAscendImg:        dojo.baseUrl + "../../openbravo/templates/sort_asc.gif",
      sortDescendImg:       dojo.baseUrl + "../../openbravo/templates/sort_desc.gif",
      rowEditingImg:        dojo.baseUrl + "../../openbravo/templates/editingRow.png",
      rowErrorImg:          dojo.baseUrl + "../../openbravo/templates/rowError.png",
      rowRefreshingImg:     dojo.baseUrl + "../../openbravo/templates/refreshingRow.png",
      rowSavedImg:          dojo.baseUrl + "../../openbravo/templates/rowSaved.png",
      iconImages:           [],
      largeBufferSize:      this.bufferSize,
      sortImageWidth:       9,
      sortImageHeight:      5,
      ajaxSortURLParms:     [],
      onRefreshComplete:    [],
      requestParameters:    null,
      inlineStyles:         true,
      hasResized:           dojo.hitch(this, function() { return this.hasResized; }),
      failedRows:           new dojox.collections.Dictionary()
    };
    dojo.mixin(this.options, options);
    new Image().src = this.options.rowEditingImg;
    new Image().src = this.options.rowErrorImg;
    new Image().src = this.options.rowRefreshingImg;
    new Image().src = this.options.rowSavedImg;
    this.options.iconImages[openbravo.widget.DataGrid.Row.prototype.ERROR] = this.options.rowErrorImg;
    this.options.iconImages[openbravo.widget.DataGrid.Row.prototype.SAVED] = this.options.rowSavedImg;
    this.options.iconImages[openbravo.widget.DataGrid.Row.prototype.EDITING] = this.options.rowEditingImg;
    this.options.iconImages[openbravo.widget.DataGrid.Row.prototype.REFRESHING] = this.options.rowRefreshingImg;
    var _this = this;

    this.options.onRefreshComplete.remove = function(element) {
      var pos = dojo.indexOf(_this.options.onRefreshComplete, element);
      _this.options.onRefreshComplete.splice(pos, 1);
    };

    this.ajaxOptions = {parameters: null};
    this.tableId     = this.tableNode.id; 
    this.table       = this.tableNode;
    this.hasResized  = false;
    var columnCount  = this.table.rows[0].cells.length;
    this.metaData    = new openbravo.widget.DataGrid.MetaData(this.numRows, 0, columnCount, this.options);
    this.buffer      = new openbravo.widget.DataGrid.Buffer(this.metaData, this);
    var rowCount = this.table.rows.length;
    this.viewPort =  new openbravo.widget.DataGrid.ViewPort(this.tableNode, 
      this.tableNode.offsetHeight/rowCount,
      this.numRows,
      this.buffer, this);
    this.scroller    = new openbravo.widget.DataGrid.Scroller(this, this.viewPort);
    this.options.sortHandler = dojo.hitch(this, "sortHandler");
    if ( dojo.byId(this.tableId + '_header') ){
      this.sort = new openbravo.widget.DataGrid.SortingHandler(this.tableId + '_header', this.options)
    }
    this.processingRequest = null;
    this.unprocessedRequest = null;
    if ( this.options.prefetchBuffer || this.options.prefetchOffset > 0) {
      var offset = 0;
      if (this.options.offset ) {
        offset = this.options.offset;
        this.scroller.moveScroll(offset);
        this.viewPort.scrollTo(this.scroller.rowToPixel(offset));
      }
      if (this.options.sortCols) {
        this.sortCols = options.sortCols;
        this.sortDirs = options.sortDirs;
      }
      //this.goToRow(options.defaultRow);
      this.requestContentRefresh(offset);
    }
  },

/**
* It does the cleanliness operations for the grid repainted. For example, to realize the data arrangement.
*/
  resetContents: function() {
    this.scroller.moveScroll(0);
    this.buffer.clear();
    this.viewPort.clearContents();
  },

/**
* It updates the arrangement columns inside the array of arrangement columns and does the data buffer reload by calling the backend.
* @param {Object} columns - Object with the columns of the grid
*/
  sortHandler: function(columns) {
    if (!columns) { return; }
    this.sortCols = [];
    this.sortDirs = [];
    dojo.forEach(columns, dojo.hitch(this, function(column) {
      this.sortCols.push(column.name);
      this.sortDirs.push(column.currentSort);
    }));
    this.sortCols.reverse();
    this.sortDirs.reverse();
    this.resetContents();
    this.requestContentRefresh(0);
  },

/**
* It updates the total of existing records, verifying if it has to update the number of current rows (for example, because the total is minor than the number of rows to showing, having to eliminate the remaining rows and resizing the scrollbars).
* @param {Number} newTotalRows - number of new total rows
*/
  setTotalRows: function( newTotalRows ) {
    if (newTotalRows <= this.numRows) {
      this.visibleRows = newTotalRows;
      if (dojo.isIE) {
        for (var i = 0; i < newTotalRows; i++){
          this.tableNode.rows[i].style.display = "block";
        }
        for (var i = newTotalRows; i < this.numRows; i++){
          this.tableNode.rows[i].style.display = "none";
        }    
      }else {
        if (newTotalRows > 0){
          var rowHeight = this.tableNode.rows[0].clientHeight;
        }
        for (var i = 0; i < newTotalRows; i++) {
          this.tableNode.rows[i].style.height = rowHeight + "px";
          openbravo.widget.DataGrid.html.setVisibility(this.tableNode.rows[i], true);
        }
        for (var i = newTotalRows; i < this.numRows; i++) {
          //-> to show the empty rows with the same height than the filled cells -> this.tableNode.rows[i].style.height = rowHeight + "px";
          //-> this removes completly the empty cells -> this.tableNode.rows[i].style.display = 'none';
          openbravo.widget.DataGrid.html.setVisibility(this.tableNode.rows[i], false);
        }
      }
      this.tableNode.style.height = this.viewPort.rowHeight * this.visibleRows + "px";  
      this.scroller.updateHeight();
    }
    this.resetContents();
    this.metaData.setTotalRows(newTotalRows);
    this.scroller.updateHeight();
    this.scroller.updateSize();
  },

/**
* Timeout handler
*/
  handleTimedOut: function() {
    this.processingRequest = null;
    this.processQueuedRequest();
    showJSMessage(24);
    setCalloutProcessing(false);
  },

/**
* It does a request to the backend to load the grid information. In this process it recolect the parameters that the backend will need to return the datas (arrangement columns, additional parameters, offsets ...).
* @param {Number} rowOffset - row offset
*/
  fetchBuffer: function(offset) {
    if ( this.buffer.isInRange(offset) && !this.buffer.isNearingLimit(offset)) {
      return;
    }
    if (this.processingRequest) {
      this.unprocessedRequest = new openbravo.widget.DataGrid.ContentRequest(offset);
      return;
    }
    setCalloutProcessing(true);
    var bufferStartPos = this.buffer.getFetchOffset(offset);
    this.processingRequest = new openbravo.widget.DataGrid.ContentRequest(offset);
    this.processingRequest.bufferOffset = bufferStartPos;   
    var fetchSize = this.buffer.getFetchSize(offset);
    var partialLoaded = false;
    var content = [];
    if (this.requestParams) {
      for (var param in this.requestParams) {
        content[param] = this.requestParams[param];
      }
    }
    content["action"] = "getRows";
    content["page_size"] = fetchSize;
    content["offset"] = bufferStartPos;
    if (this.sortCols) {
      content["sort_cols"] = this.sortCols.reverse();
      content["sort_dirs"] = this.sortDirs.reverse();
    }
    var handlerRef = dojo.hitch(this, "ajaxUpdate");
    var serviceUrl = {
      url: this.dataUrl,
      handler: handlerRef,
      method: "POST",
      handleAs: "xml"
    };
    openbravo.widget.DataGrid.io.asyncCall(serviceUrl, content);
    if(this.timeoutHandler == null) {this.timeoutHandler = new Array()};
    this.timeoutHandler[this.timeoutHandler.length] = setTimeout(dojo.hitch(this, "handleTimedOut"), this.options.bufferTimeout);
  },

/**
* It calls to the method fetchBuffer.
* @param {Number} contentOffset - Offset of the content
*/
  requestContentRefresh: function(contentOffset) {
    this.fetchBuffer(contentOffset);
  },

/**
* It is the method that manages the backend response with the grid data.
* @param {String} type - 
* @param {XML Structure} data - data structure
* @param {EventHandler} evt - event handler
*/
  ajaxUpdate: function(data, evt) {
    try {
      if(this.timeoutHandler != null && this.timeoutHandler.length > 0){
        clearTimeout( this.timeoutHandler.shift() ); //shift returns and removes the first element of an array
      }
      this.buffer.update(data,this.processingRequest.bufferOffset);
      this.viewPort.bufferChanged();
    }
    catch(err) {
      //dojo.debug(err);
    }
    finally {
      this.processingRequest = null;
    }
    if (this.isFirstLoad) {
      this.isFirstLoad = false;
      this.onGridLoad();
    }
    if (this.hasBeenResized) {
      this.hasBeenResized = false;
      this.moveTableContent(this.offsetBeforeResize);
    }
    this.processQueuedRequest();
    setCalloutProcessing(false);
  },

/**
* A function to manage the queued requests
*/
  processQueuedRequest: function() {
    if (this.unprocessedRequest != null && this.unprocessedRequest.requestOffset > 0) {
      this.requestContentRefresh(this.unprocessedRequest.requestOffset);
      this.unprocessedRequest = null
    }
  }
});

/**
* It is a small additional control to save the information in case of leaving of the page having the edition by half.
* @param {EventHandler} colMetadata - event handler
* @return new cell text element
* @type Object
*/
function createTextCellElement(colMetadata) {

  var hoverCell = function(evt) {
    if (dojo && !dojo.hasClass(this, 'DataGrid_Body_Cell_hover')
        && !dojo.hasClass(this, 'DataGrid_Body_Cell_clicked')){
      dojo.addClass(this, 'DataGrid_Body_Cell_hover');
    }
  };

  var plainCell = function(evt) {
    if (dojo && dojo.hasClass(this, 'DataGrid_Body_Cell_hover')){
      dojo.removeClass(this, 'DataGrid_Body_Cell_hover', false);
    }
  };

  var text = document.createElement("nobr");
  text.className = openbravo.widget.DataGrid.Column.prototype.DEFAULT_CLASS;
  dojo.addClass(text, colMetadata.className);
  text.onmouseover = hoverCell;
  text.onmouseout = plainCell;
  openbravo.widget.DataGrid.html.disableSelection(text);
  var emptyText = document.createTextNode("");
  text.appendChild(emptyText);
  if (colMetadata.visible){
    text.style.width = colMetadata.width;
  }else{
    text.style.display = "none";
  }
  return text;
};

dojo.declare("openbravo.widget.DataGrid.Parser", null, {
  constructor: function(datagrid) {
    this.datagrid = datagrid;
  },

  ajaxUpdate: function(data, evt) {
    this.parseStructure(data);
  },

/**
* It receives the root element of a dom tree and parse it to build the objects that identify each of its columns.
* @param {Object} rootElem - root element of a xml object
*/
  parseStructure: function(rootElem) {
    try {
      var xmlstructure = rootElem.getElementsByTagName('xml-structure');
      var datagrids = xmlstructure[0].getElementsByTagName('datagrid');
      var status = xmlstructure[0].getElementsByTagName('status');
      if (status.length>0){
        var type = status[0].getElementsByTagName('type');
        var title = status[0].getElementsByTagName('title');
        var description = status[0].getElementsByTagName('description');
        if (dojox.data.dom.textContent(type[0]).toUpperCase() != 'HIDDEN') {
          try {
            renderMessageBox(dojox.data.dom.textContent(type[0]),dojox.data.dom.textContent(title[0]),dojox.data.dom.textContent(description[0]));
          } catch (err) {
            alert(dojox.data.dom.textContent(title[0]) + ":\n" + dojox.data.dom.textContent(description[0]));
          }
        }
      }
      var validators = datagrids[0].getElementsByTagName('validator');
      for (var i = 0; i < validators.length; i++) {
        openbravo.loadScriptFromUrl(validators[i].getAttribute("src"));
        this.datagrid.validators.push(validators[i].getAttribute("className"));
      }
      var typesElem = datagrids[0].getElementsByTagName('types');
      var typeFactory = new openbravo.widget.DataGrid.TypeFactory();
      if (typesElem.length > 0) {
        var types = typesElem[0].getElementsByTagName('type');
        for (var i = 0; i < types.length; i++) {
          var name = types[i].getAttribute('name');
          var kind = types[i].getAttribute('kind');
          if (kind == 'enum') {
            var enumValues = types[i].getElementsByTagName('enumeration');
            var type = new openbravo.widget.DataGrid.EnumType(name);
            for (var j = 0; j < enumValues.length; j++) {
              var value = enumValues[j].getAttribute('value');
              type.addValue(value);  
            }
            typeFactory.addType(type);
          } else if (kind == 'class') {
            var type = new openbravo.widget.DataGrid.CustomType(name);
            type.className = types[i].getAttribute('className');
            openbravo.loadScriptFromUrl(types[i].getAttribute('src'));
            typeFactory.addType(type);
          } else {
            throw Error("Unknown kind for type named " + name);
          }
        }
      }
      var name = this.datagrid.lineNoColumnTitle;
      var typeName = "string";
      var type = typeFactory.getType(typeName);
      var gridWidth;
      if (this.datagrid.maxWidth == "0px"){
        gridWidth = dijit.getViewport().width - 80 -
          openbravo.widget.DataGrid.html.extractPx(this.datagrid.lineNoColumnWidth);
      }else{
        gridWidth = openbravo.widget.DataGrid.html.extractPx(this.datagrid.maxWidth) - 
          3 * this.datagrid.scrollWidth -
          openbravo.widget.DataGrid.html.extractPx(this.datagrid.lineNoColumnWidth);
      }
      var params = {
        width: this.datagrid.lineNoColumnWidth,
        readonly: "true",
        required: "false",
        sortable: "false",
        className: this.datagrid.lineNoColumnClass,
        headerClassName: this.datagrid.lineNoColumnHeaderClass,
        visible: this.datagrid.showLineNumbers
      }
      var column = new openbravo.widget.DataGrid.Column(name, type, params);
      this.datagrid.columns.addColumn(column);
      var columnsElem = datagrids[0].getElementsByTagName('columns');
      var columns = columnsElem[0].getElementsByTagName('column');
      for (var i = 0; i < columns.length; i++) {
        if (columns[i].parentNode == columnsElem[0]) {
          var name = columns[i].getAttribute('name');
          var typeName = columns[i].getAttribute('type');
          var type = typeFactory.getType(typeName);
          var invalidatesElem = columns[i].getElementsByTagName('invalidates');
          var invalidColumns = [];
          if (invalidatesElem.length > 0) {
            var invalidColumnsElem = invalidatesElem[0].getElementsByTagName('column');
            for (var j = 0; j < invalidColumnsElem.length; j++){
              invalidColumns.push(invalidColumnsElem[j].getAttribute('name'));
            }
          }
          var colWidth = columns[i].getAttribute('width');
          if (colWidth) {
            var pos = colWidth.indexOf("%");
            if (pos > 0) {
              colWidth = colWidth.substr(0, pos) * gridWidth / 100 + "px";
            }
          }
          var params = {
            title: columns[i].getAttribute('title'),
            width: colWidth,
            readonly: columns[i].getAttribute('readonly'),
            required: columns[i].getAttribute('required'),
            sync: columns[i].getAttribute('sync'),
            visible: columns[i].getAttribute('visible'),
            sortable: columns[i].getAttribute('sortable'),
            className: columns[i].getAttribute('className'),
            headerClassName: columns[i].getAttribute('headerClassName'),
            identifier: columns[i].getAttribute('identifier'),
            invalidates: invalidColumns,
            subordinated: []
          }
          var column = new openbravo.widget.DataGrid.Column(name, type, params);
          this.datagrid.columns.addColumn(column);
        }
      }
      if (!this.datagrid.columns.getIdentifier()){
        throw Error("No identifier specified");
      }
      var size = this.datagrid.columns.count();
      for (var i = 0; i < size; i++) {
        var currentColumn = this.datagrid.columns.get(i);
        var masterColumns = [];
        for (var j = 0; j < size; j++) {
          var sourceColumn = this.datagrid.columns.get(j);
          var sourceColumnInvalidates = sourceColumn.invalidates;
          var invalidatesSize = sourceColumnInvalidates.length;
          for (var k = 0; k < invalidatesSize; k++)
            if (sourceColumnInvalidates[k] == currentColumn.name) {
              masterColumns[masterColumns.length] = sourceColumn.name;
            }
        }
        currentColumn.subordinated = masterColumns;
      }
      this.datagrid.render();
    } catch (ex) {
      this.xmlError(ex);
    }
  },

  xmlError: function(e) {
    alert("Error while parsing datagrid structure:\n\n" + e.message);
  }
});

dojo.declare("openbravo.widget.DataGrid.Type", null, {
/**
* It is the builder that dojo needs to initialize an object.
* @param {String} name - New name
*/
  constructor: function(name) {
    this.name = name;
  },

/**
* It builds the control in the page.
* @param {Object} params - Params of the editing object.
* @return Object with the editor handler
* @type openbravo.widget.DataGrid.InputEditorHandler
*/
  renderEditor: function(params) {
    var input = document.createElement("input");
    input.setAttribute('autocomplete','off');
    input.value = params.initialValue;
    params.parentNode.appendChild(input);
    input.style.width = params.width - 8 + "px";
    return new openbravo.widget.DataGrid.InputEditorHandler(input);
  },

/**
* It implements the necessary validation on the control data.
* @param {String} value - value to validate
*/
  validate: function(value) {
    return true;
  }
});

dojo.declare("openbravo.widget.DataGrid.StringType", openbravo.widget.DataGrid.Type, {
});

dojo.declare("openbravo.widget.DataGrid.IntegerType", openbravo.widget.DataGrid.Type, {
  constructor: function(name) {
    
  },  

  renderEditor: function(params) {
    var name = "IntegerTextbox";
    var refNode = document.createElement("input");
    params.parentNode.appendChild(refNode);
    var props = {
      name: params.name,
      value: params.initialValue,
      trim: "true",
      required: params.required,
      invalidMessage: " ",
      missingMessage: "*"
    };
    var widget = dojo.widget.createWidget(name, props, refNode);
    widget.textbox.style.width = params.width - 8 + "px";
    widget.textbox.setAttribute('autocomplete','off');
    return new openbravo.widget.DataGrid.InputEditorHandler(widget.textbox);
  },

  validate: function(value) {
    return dojox.validate.isNumberFormat(value);
  }
});

dojo.declare("openbravo.widget.DataGrid.FloatType", openbravo.widget.DataGrid.Type, {
  constructor: function(name) {
    
  },

  renderEditor: function(params) {
    var name = "RealNumberTextbox";
    var refNode = document.createElement("input");
    params.parentNode.appendChild(refNode);
    var props = {
      name: params.name,
      value: params.initialValue,
      trim: "true",
      required: params.required,
      invalidMessage: " ",
      missingMessage: "*"
    };
    var widget = dojo.widget.createWidget(name, props, refNode);
    widget.textbox.style.width = params.width - 8 + "px";
    widget.textbox.setAttribute('autocomplete','off');
    return new openbravo.widget.DataGrid.InputEditorHandler(widget.textbox);
  },

  validate: function(value) {
    return dojox.validate.isNumberFormat(value);
  }
});

dojo.declare("openbravo.widget.DataGrid.DateType", openbravo.widget.DataGrid.Type, {
  constructor: function(name) {
    
  },

  renderEditor: function(params) {
    var name = "DropdownDatePicker";
    var refNode = document.createElement("input");
    params.parentNode.appendChild(refNode);
    var props = {
    };
    var widget = dojo.widget.createWidget(name, props, refNode);
    widget.inputNode.value = params.initialValue;
    widget.inputNode.style.width = params.width - 30 + "px";
    widget.inputNode.setAttribute('autocomplete','off');
    return new openbravo.widget.DataGrid.InputEditorHandler(widget.inputNode);
  },

  validate: function(value) {
    return dojox.validate.isNumberFormat(value);
  }
});

dojo.declare("openbravo.widget.DataGrid.UrlType", openbravo.widget.DataGrid.Type, {
});

dojo.declare("openbravo.widget.DataGrid.ImgType", openbravo.widget.DataGrid.Type, {
});

dojo.declare("openbravo.widget.DataGrid.EnumType", openbravo.widget.DataGrid.Type, {
  constructor: function(name) {
    //dojo.require("dojo.widget.Select");
    this.values = [];
  },

  addValue: function(value) {
    this.values.push(value);
  },

  renderEditor: function(params) {
    var  select = document.createElement("select");
    for (var i = 0; i < this.values.length; i++) {
      var value = this.values[i];
      var option = new Option(value, value, false);
      select.options[select.options.length] = option;
    }
    select.value = params.initialValue;
    params.parentNode.appendChild(select);
    var name = "ComboBox";
    var props = {
      autoComplete: true,
      mode: "local"
    };
    var widget = dojo.widget.createWidget(name, props, select);
    widget.textInputNode.style.width = params.width - 30 + "px";
    widget.textInputNode.setAttribute('autocomplete','off');
    widget.textInputNode.value = params.initialValue;
    return new openbravo.widget.DataGrid.InputEditorHandler(widget.textInputNode);
  },

  validate: function(value) {
    return value == "" || openbravo.widget.DataGrid.html.inArray(this.values, value);
  }
});

dojo.declare("openbravo.widget.DataGrid.DynamicEnumType", openbravo.widget.DataGrid.EnumType, {
  constructor: function(name) {
    this.widget = null;
  },

  populateCombo: function(data, evt) {
    var options = data.getElementsByTagName('option');
    var availableOptions = [];
    for (var i = 0; i < options.length; i++) {
      var option = openbravo.widget.DataGrid.html.getContentAsString(options[i]);
      availableOptions.push([option, option]);
      this.values.push(option);
    }
    this.widget.dataProvider.setData(availableOptions);
  },

  queryContent: function(params) {
    var values = [];
    var columnNames = [];
    var success = true;
    for (var i = 0; i < params.subordinated.length && success; i++) {
      var columnName = params.subordinated[i];
      columnNames.push(columnName);
      var invalidatorValue = params.row.getValue(columnName);
      if (invalidatorValue == ""){
        success = false;
      }else {
        values[columnName] = invalidatorValue;
      }
    }
    if (success) {
      var handlerRef = dojo.hitch(this, "populateCombo");
      var content = [];
      content["action"] = "getComboContent";
      content["subordinatedColumn"] = params.name;
      for (var i = 0; i < params.subordinated.length; i++) {
        content[columnName] = values[columnNames[i]];
      }
      var selectedGenre = "";
      var serviceUrl = {
        url: params.cellSaver.dataUrl,
        handler: handlerRef,
        method: "POST",
        handleAs: "xml"
      };
      openbravo.widget.DataGrid.io.asyncCall(serviceUrl, content);
    }
  },  

  renderEditor: function(params) {
    var  select = document.createElement("select");
    params.parentNode.appendChild(select);
    var name = "combobox";
    var props = {
      autoComplete: true,
      mode: "local"
    };
    var widget = dojo.widget.createWidget(name, props, select);
    widget.textInputNode.style.width = params.width - 30 + "px";
    widget.textInputNode.setAttribute('autocomplete','off');
    widget.textInputNode.value = params.initialValue;
    this.widget = widget;
    this.queryContent(params);
    return new openbravo.widget.DataGrid.InputEditorHandler(widget.textInputNode);
  }
});

dojo.declare("openbravo.widget.DataGrid.CustomType", openbravo.widget.DataGrid.Type, {
  constructor: function(name) {
    this.className = "";
  },

  renderEditor: function(params) {
    params.cell.innerHTML = params.initialValue;
    var customEditor = dojo.getObject(this.className, true);
    var editorHandler = new openbravo.widget.DataGrid.EditorHandler(function() {
      return params.initialValue;
    });
    var handler = {
      save: function(values) {
        for (var columnName in values){
          params.row.setValue(columnName, values[columnName]);
        }
        params.row.updateGrid();

        editorHandler.getValue = function() {
          return values[params.name];
        };

        params.cellSaver.unlockGrid();
        params.cellSaver.save();
      },

      cancel: function() {
        params.cellSaver.unlockGrid();
        params.cellSaver.cancel();
      }
    };
    params.cellSaver.lockGrid();
    new customEditor(params.row, handler).render();
    return editorHandler;
  }
});

dojo.declare("openbravo.widget.DataGrid.TypeFactory", null, {
  constructor: function() {
    var supportedTypes = [];
    supportedTypes["string"] = "openbravo.widget.DataGrid.StringType";
    supportedTypes["integer"] = "openbravo.widget.DataGrid.IntegerType";
    supportedTypes["float"] = "openbravo.widget.DataGrid.FloatType";
    supportedTypes["date"] = "openbravo.widget.DataGrid.DateType";
    supportedTypes["url"] = "openbravo.widget.DataGrid.UrlType";
    supportedTypes["img"] = "openbravo.widget.DataGrid.ImgType";
    supportedTypes["dynamicEnum"] = "openbravo.widget.DataGrid.DynamicEnumType";
    var types = [];

    this.addType = function(type) {
      types[type.name] = type;
    };

    this.getType = function(typeName) {
      if (types[typeName]){
        return types[typeName];
      }else {
        var className = supportedTypes[typeName];
        var type;
        if (className) {
          var typeClass = dojo.getObject(className, true);
          type = new typeClass(typeName);
        }else{
          type = new openbravo.widget.DataGrid.Type(typeName);
        }
        types[typeName] = type;
        return type;
      }
    };

  }
});

dojo.declare("openbravo.widget.DataGrid.EditorHandler", null, {
  constructor: function() {
    this.getValue = function() {};
    this.setFocus = function() {};
  }
});

dojo.declare("openbravo.widget.DataGrid.InputEditorHandler", openbravo.widget.DataGrid.EditorHandler, {
  constructor: function(input) {

    this.getValue = function() {
      return input.value;
    };

    this.setFocus = function() {
      if (input.parentNode){
        input.focus();
      }
    };

  }
});

dojo.declare("openbravo.widget.DataGrid.Columns", null, {
  constructor: function() {
    var columns = [];
    var identifier = null;

    this.count = function() {
      return columns.length;
    };

    this.addColumn = function(column) {
      column.index = columns.length;
      columns[columns.length] = column;
      if (column.identifier) {
        if (identifier){
          throw Error("Column " + column.name + " set as an identifier, but " + 
            identifier.name + " is already the identifier.");
        }
        identifier = column;
      }
    };

    this.removeColumn = function(position) {
      if(columns[position].identifier){
        identifier = null;
      }
      columns[position] = null;
    };

    this.get = function(position) {
      if (!isNaN(position)){
        return columns[position];
      }else{
        for (var i in columns) {
          if (columns[i].name == position){
            return columns[i];
          }
        }
      }
    };

    this.getIdentifier = function() {
      return identifier;
    };
  }
});

dojo.declare("openbravo.widget.DataGrid.Column", null, {
  DEFAULT_WIDTH: '100px',
  DEFAULT_CLASS: 'DataGrid_Body_Cell',
  DEFAULT_CLASS_INVERSE: 'DataGrid_Body_Cell DataGrid_Body_Cell_Inverse',
  DEFAULT_HEADER_CLASS: 'DataGrid_Header_Cell',
  DEFAULT_HEADER_CLASS_INVERSE: 'DataGrid_Header_Cell DataGrid_Header_Cell_Inverse',

  constructor: function(name, type, params) {
    this.index = -1;
    this.name = name;
    this.type = type;
    this.title = params.title ? params.title : name;
    this.width = params.width ? params.width : this.DEFAULT_WIDTH;
    this.readonly = params.readonly == "true";
    this.required = params.required != "false";
    this.sync = params.sync == "true";
    this.visible = params.visible != "false";
    this.sortable = params.sortable != "false";
    if (this.type.name == 'integer' || this.type.name == 'float') {
      this.className = params.className ? params.className : this.DEFAULT_CLASS_INVERSE;
      this.headerClassName = params.headerClassName ? params.headerClassName : this.DEFAULT_HEADER_CLASS_INVERSE;
    } else {
      this.className = params.className ? params.className : this.DEFAULT_CLASS;
      this.headerClassName = params.headerClassName ? params.headerClassName : this.DEFAULT_HEADER_CLASS;
    }
    this.identifier = params.identifier == "true";
    this.invalidates = params.invalidates ? params.invalidates : [];
    this.subordinated = [];
    this.currentSort = openbravo.widget.DataGrid.Column.UNSORTED;
    if (this.identifier || !this.visible || this.readonly){
      this.required = false;
    }
    if (this.identifier){
      this.readonly = true;
    }
  },

  renderEditor: function(cell, row, cellSaver) {
    var container = document.createElement("span");
    container.style.display = "none";
    var columnNo = dojo.indexOf(cell.parentNode.cells, cell);
    var content = row.getValue(columnNo);
    openbravo.widget.DataGrid.html.clearElement(cell);
    var tdWidth = openbravo.widget.DataGrid.html.extractPx(cell.style.width);
    var params = {
      parentNode: container,
      initialValue: content,
      width: tdWidth,
      required: this.required,
      name: this.name,
      cell: cell,
      subordinated: this.subordinated,
      cellSaver: cellSaver,
      row: row
    }
    var editor = this.type.renderEditor(params);
    cell.appendChild(container);
    dojo.lfx.html.fadeShow(container, 300, null, function() {
      editor.setFocus();
    }).play();
    return editor;
  },

  isSortable: function() {
    return this.sortable;
  },

  isSorted: function() {
    return this.currentSort != openbravo.widget.DataGrid.Column.UNSORTED;
  },

  getSortDirection: function() {
    return this.currentSort;
  },

  toggleSort: function() {
    if (this.currentSort == openbravo.widget.DataGrid.Column.UNSORTED ||
        this.currentSort == openbravo.widget.DataGrid.Column.SORT_DESC){
      this.currentSort = openbravo.widget.DataGrid.Column.SORT_ASC;
    }else if ( this.currentSort == openbravo.widget.DataGrid.Column.SORT_ASC ){
      this.currentSort = openbravo.widget.DataGrid.Column.SORT_DESC;
    }
  },

  setUnsorted: function(direction) {
    this.setSorted(openbravo.widget.DataGrid.Column.UNSORTED);
  },

  setSorted: function(direction) {
    this.currentSort = direction;
  }  

});

openbravo.widget.DataGrid.Column.UNSORTED  = 0;
openbravo.widget.DataGrid.Column.SORT_ASC  = "ASC";
openbravo.widget.DataGrid.Column.SORT_DESC = "DESC";

dojo.declare("openbravo.widget.DataGrid.Row", null, {
  CORRECT:    0,
  ERROR:      1,
  SAVED:      2,
  EDITING:    3,
  REFRESHING: 4,

  constructor: function(offset, columns, options, errorHandler, isVisible) {
    this.modified = false;
    this.error = false;
    this.offset = offset;
    this.rowNode = null;
    this.status = 0;
    this.isNewRow = false;
    var values = [];
    var storedValues = openbravo.widget.DataGrid.html.toArray(values);

    var toObject = function() {
      var object = {};
      for (var i = 0; i < values.length; i++){
        object[columns.get(i).name] = values[i];
      }
      return object;
    };

/**
* It repaints the line in the page, taking again the values of the internal array and presenting them in a correct format, according to the information type of every column. Finally, it calls to the setIcon method if the state of the row is not CORRECT.
*/
    this.updateGrid = function() {
      if (this.rowNode && (!this.offset || isVisible(this.offset))) {
        for (var i = 0; i < values.length; i++) {
          var s = values[i];
          var value = s;
          if (s && typeof s == 'string') {
            value = s.split(" ").join("&nbsp;");
          }
          var column = columns.get(i);
          /*try {
          while (column.hasChildNodes()) column.removeChild(column.lastChild);
          } catch (ignored) {
            column.innerHTML="";
          }
          var textNode = createTextCellElement(column);*/
          if (column.type.name == 'url' && value != '') { this.rowNode.cells[i].innerHTML = "<a href=\"" + value + "\" target=_blank><img src=\"../web/js/openbravo/templates/popup1.gif\" border=\"0\ title=\"Link\" alt=\"Link\"></a>&nbsp;" + value; }
          if (column.type.name == 'img' && value != '') { this.rowNode.cells[i].innerHTML = "<img src=\"" + value + "\" border=\"0\" height=\"15px\">"; }
          else { this.rowNode.cells[i].innerHTML = value; }
          //this.rowNode.cells[i].appendChild(textNode);
        }
        if (this.status > 0) { this.setIcon(); }
      }
    };

/**
* It returns the value of a concrete column.
* @param {Number} columnNo - number of column
* @return value for the selected column
* @type String
*/
    this.getValue = function(columnNo) {
      if (isNaN(columnNo)) {
        columnNo = columns.get(columnNo).index;
      }
      return values[columnNo];
    };

/**
* It modifies the value of a column, establishing the modified property to true.
* @param {Number} columnNo - number of column
* @param {String} value - The new value
*/
    this.setValue = function(columnNo, value) {
      if (isNaN(columnNo)){
        columnNo = columns.get(columnNo).index;
      }
      if (values[columnNo] != value){
        values[columnNo] = value;
      }
      this.modified = true;
    };

/**
* It updates the internal array of values with the array of values that is given to it.
* @param {Array} columnValues - Array of values for each column
*/
    this.setValues = function(columnValues) {
      for (var i = 0; i < columnValues.length; i++) {
        values[i] = columnValues[i];
      }
      storedValues = openbravo.widget.DataGrid.html.toArray(values);      
    };

/**
* It verifies if there exist needed columns without value, putting the error property to true. It returns an array with the needed columns without value.
* @return Array of any empty field
* @type Array
*/
    this.checkFields = function() {
      var emptyFields = [];
      for (var i = 0; i < values.length; i++) {
        var column = columns.get(i);
        if (column.required && values[i] == ""){
          emptyFields[emptyFields.length] = i;
        }
      };
      this.error = emptyFields.length > 0;
      return emptyFields;
    };

/**
* It receives an array with the validations on the different columns and it applies them. If it finds some error when it is validating, the property puts error to true and ends.
* @param {Array} validators - Array of validators for each column.
*/
    this.validate = function(validators) {
      var correct = true;
      for (var i = 0; i < validators.length; i++) {
        var validator = dojo.getObject(validators[i], true);
        correct = new validator().validate(toObject());
        if (!correct){
          break;
        }
      }
      this.error = !correct;
    };

/**
* It is the method used to obtain the error message returned by the backend xml, at the same time that modifies the row state to ERROR. When it ends, it calls to the updateGrid method to repaint the row with the data and the right icon.
* @param {Object} errorElement - Xml object with the response.
*/
    this.handleError = function(errorElement) {
      this.setStatus(this.ERROR);
      var id = values[columns.getIdentifier().index];
      options.failedRows.add(id);
      var title = openbravo.widget.DataGrid.html.getContentAsString(errorElement.getElementsByTagName("title")[0]);
      var description = openbravo.widget.DataGrid.html.getContentAsString(errorElement.getElementsByTagName("description")[0]);
      values = openbravo.widget.DataGrid.html.toArray(storedValues);
      this.updateGrid();
      errorHandler.handleError(title, description);
    };

/**
* It refills the columns with the default values and repaints the row with the method updateGrid.
* @param {Object} rowElement - The pointer to the row that we want to populate
*/
    this.populateDefaultValues = function(rowElement) {
      dojo.forEach(rowElement.childNodes, dojo.hitch(this, function(element) {
        if (element.nodeType == dojox.data.dom.ELEMENT_NODE) {
          var column = columns.get(element.tagName);
          if (column) {
            this.setValue(column.index, openbravo.widget.DataGrid.html.getContentAsString(element));
            this.updateGrid();
          }
        }
      }));
    };

/**
* It does the call to the backend to obtain the values by default.
* @param {String} url - url for the request
*/
    this.getDefaultValues = function(url) {
      var content = [];
      content["action"] = "getDefaultValues";
      handlerRef = dojo.hitch(this, parseResponse);
      var serviceUrl = {
        url: url,
        handler: handlerRef,
        method: "POST",
        handleAs: "xml"
      };
      openbravo.widget.DataGrid.io.asyncCall(serviceUrl, content);
    };

/**
* It manages the backend answers to the requests of by default values, and update or row creation.
* @param {String} type - xx
* @param {XML Structure} data - data structure
* @param {EventHandler} evt - event handler
*/
    var parseResponse = function(data, evt) {
      if (!data) { return; }
      var xmldata = data.getElementsByTagName('xml-data');
      var status = xmldata[0].getElementsByTagName('status');
      if (status.length>0){
        var type = status[0].getElementsByTagName('type');
        var title = status[0].getElementsByTagName('title');
        var description = status[0].getElementsByTagName('description');
        if (dojox.data.dom.textContent(type[0]).toUpperCase() != 'HIDDEN') {
          try {
            renderMessageBox(dojox.data.dom.textContent(type[0]),dojox.data.dom.textContent(title[0]),dojox.data.dom.textContent(description[0]));
          } catch (err) {
            alert(dojox.data.dom.textContent(title[0]) + ":\n" + dojox.data.dom.textContent(description[0]));
          }
        }
      }
      var errors = xmldata[0].getElementsByTagName("error");
      if (errors.length > 0) {
        this.handleError(errors[0]);
      } else {
        var rowId = this.getValue(columns.getIdentifier().index);
        if (rowId){
          this.setStatus(this.SAVED);
        }
        storedValues = openbravo.widget.DataGrid.html.toArray(values);
        if (options.failedRows.contains(rowId)) {
          options.failedRows.remove(rowId);
        }
        setTimeout( dojo.hitch(this, function() {
          this.setStatus(this.CORRECT);
        }), 2000);
      }
      var rows = xmldata[0].getElementsByTagName('rows');
      if (rows.length > 0){
        this.populateDefaultValues(rows[0]);
      }
    };

/**
* It modifies the state of the row and it calls to the setIcon method.
* @param {String} statusName - The new status name
*/
    this.setStatus = function(statusName) {
      this.status = statusName;
      //  if (this.offset || isVisible(this.offset))
      if (this.rowNode){
        this.setIcon();
      }
    };

/**
* It shows on screen the icon corresponding to the state of the row.
*/
    this.setIcon = function() {
      this.removeIcon();
      if (this.status > 0) {
        if (options.iconImages[this.status]) {
          var column = columns.get(0);
          var htmlCode = this.rowNode.cells[column.index].innerHTML;
          this.rowNode.cells[column.index].innerHTML = htmlCode + '&nbsp;&nbsp;<img width="16px" height="16px" ' +
            'src="' + options.iconImages[this.status] + '"/>';
        }
      }
    };

/**
* It eliminates of the row the current icon.
*/
    this.removeIcon = function() {
      if (this.rowNode.cells[0].innerHTML != ""){
        this.rowNode.cells[0].innerHTML = this.offset + 1;
      }
    };

/**
* It does the call to the backend in order to it updates or build the new row.
* @param {String} url - url for the request
*/
    this.sendRow = function(url) {
      this.setStatus(this.REFRESHING);
      var content = toObject();
      var  handlerRef = dojo.hitch(this, parseResponse);
      if (this.isNewRow) {
        content["action"] = "addNewRow";
      } else {
        content["action"] = "updateRow";
      }
      var serviceUrl = {
        url: url,
        handler: handlerRef,
        method: "POST",
        handleAs: "xml"
      };
      openbravo.widget.DataGrid.io.asyncCall(serviceUrl, content);
      this.modified = false;
      if (this.isNewRow){
        this.isNewRow = false;
      }
    };

  }
});

dojo.declare("openbravo.widget.DataGrid.IndexedRows", null, {
  constructor: function() {
    var selectedRows = new dojox.collections.Dictionary();
    var lastSelected;
    var selectedIds = [];

/**
* Auxiliar method to get the total of rows selected.
* @return number of selected rows
* @type Number
*/
    this.count = function() {
      return selectedRows.count;
    };

/**
* Auxiliar method to add new selected rows.
* @param {Object} selectedRow - The selected row
*/
    this.add = function(selectedRow) {
      if(!selectedRows.contains(selectedRow.id)) {
        selectedRows.add(selectedRow.id, selectedRow);
        selectedIds.push(selectedRow.id);
      }
      lastSelected = selectedRow; 
    };

/**
* Auxiliar method to clear the selected rows.
*/
    this.clear = function() {
      selectedRows.clear();
      selectedIds = new Array();
      lastSelected = null;
    };

/**
* Auxiliar method to remove one row from the selected rows array.
* @param {String} id - id of the row to remove
*/
    this.remove = function(id) {
      selectedRows.remove(id);
      if (lastSelected.id == id) {
        selectedIds.pop();
        var id = selectedIds[selectedIds.length-1];
        lastSelected = selectedRows.item(id);
      } else {
        var size = selectedIds.length;
        for(var i = 0; i < size; i++){
          if (id == selectedIds[i]) {
            selectedIds.splice(i,1);
            break;
          }
        }
      }
    };

/**
* Returns the last selected row.
* @return Object pointing to the last selected row
* @type Object
*/
    this.getLastSelected = function() {
      return lastSelected;
    };

    this.contains = this.containsKey = selectedRows.contains;
    this.get = selectedRows.item;
    this.getKeyList = selectedRows.getKeyList;
    this.forEach = selectedRows.forEach;
    this.getIterator = selectedRows.getIterator;
  }
});

dojo.declare("openbravo.widget.DataGrid.MetaData", null, {

  /**
* Constructor.
* @param {Number} pageSize - page size
* @param {Number} totalRows - total rows
* @param {Number} columnCount - columns count
* @param {Array} options - Array of options
*/
  constructor: function( pageSize, totalRows, columnCount, options ) {
    this.pageSize  = pageSize;
    this.totalRows = totalRows;
    this.setOptions(options);
    this.ArrowHeight = 16;
    this.columnCount = columnCount;
  },

/**
* Auxiliar method to set some aditional options.
* @param {Array} options - Array of options
*/
  setOptions: function(options) {
    this.options = {
      largeBufferSize    : 7.0,   // 7 pages
      nearLimitFactor    : 0.2    // 20% of buffer
    };
    dojo.mixin(this.options, options || {});
  },

/**
* Returns the page size.
* @return page size
* @type Number
*/
  getPageSize: function() {
    return this.pageSize;
  },

/**
* Returns the total rows.
* @return total rows
* @type Number
*/
  getTotalRows: function() {
    return this.totalRows;
  },

/**
* Sets the new total rows value.
* @param {Number} n - total of rows
*/
  setTotalRows: function(n) {
    this.totalRows = n;
  },

/**
* Returns the large buffer size.
* @return large buffer size
* @type Number
*/
  getLargeBufferSize: function() {
    return parseInt(this.options.largeBufferSize * this.pageSize);
  },

/**
* Returns the limit of tolerance.
* @return limit of tolerance
* @type Number
*/
  getLimitTolerance: function() {
    return parseInt(this.getLargeBufferSize() * this.options.nearLimitFactor);
  }
});

dojo.declare("openbravo.widget.DataGrid.Scroller", null, {
  constructor: function(liveGrid, viewPort) {
    this.isIE = dojo.isIE;
    this.liveGrid = liveGrid;
    this.metaData = liveGrid.metaData;
    this.createScrollBar();
    this.scrollTimeout = null;
    this.lastScrollPos = 0;
    this.viewPort = viewPort;
    this.rows = [];
  },

/**
* Checks if the onscroll method is unplugged.
* @return True: if is unplugged - False: if isn't unplugged
* @type Boolean
*/
  isUnPlugged: function() {
    return this.scrollerDiv.onscroll == null;
  },

/**
* Plug in the onscroll method.
*/
  plugin: function() {
    this.scrollerDiv.onscroll = dojo.hitch(this, "handleScroll");
  },

/**
* Un plug the onscroll method.
*/
  unplug: function() {
    this.scrollerDiv.onscroll = null;
  },

/**
* A header hack function for ie.
*/
  sizeIEHeaderHack: function() {
    if ( !this.isIE ) { return; }
    var headerTable = dojo.byId(this.liveGrid.tableId + "_header");
    if ( headerTable ) {
      headerTable.rows[0].cells[0].style.width =
        (headerTable.rows[0].cells[0].offsetWidth + 1) + "px";
    }
  },

/**
* Update the height for the visualization.
*/
  updateHeight: function() {
    var visibleHeight = this.liveGrid.viewPort.visibleHeight();
    var table = this.liveGrid.table;
    var headerHeight = table.parentNode.firstChild.offsetHeight;
    var scrollerStyle = this.scrollerDiv.style;
    scrollerStyle.top         = headerHeight;
    scrollerStyle.height      = visibleHeight + "px";
    this.heightDiv.style.height = parseInt(visibleHeight *
      this.metaData.getTotalRows()/this.metaData.getPageSize()) + "px" ;
  },

/**
* Creates the scroll bar object.
*/
  createScrollBar: function() {
    var table = this.liveGrid.table;
    this.scrollerDiv  = document.createElement("div");
    var scrollerStyle = this.scrollerDiv.style;
    scrollerStyle.borderRight = this.liveGrid.options.scrollerBorderRight;
    scrollerStyle.position    = "relative";
    scrollerStyle.left        = this.isIE ? "-6px" : "-3px";
    scrollerStyle.width       = "19px";
    scrollerStyle.overflow    = "auto";
    this.heightDiv = document.createElement("div");
    this.heightDiv.style.width  = "1px";
    this.updateHeight();
    this.scrollerDiv.appendChild(this.heightDiv);
    this.scrollerDiv.onscroll = dojo.hitch(this, "handleScroll");
    table.parentNode.parentNode.insertBefore( this.scrollerDiv, table.parentNode.nextSibling );
    //  if (this.isIE)
    table.parentNode.style.overflowX = "auto";
    var eventName = this.isIE ? "onmousewheel" : "DOMMouseScroll";
    //  dojo.connect(window, eventName, dojo.hitch(this, 
    //  function(evt) {
    //  if (evt.wheelDelta>=0 || evt.detail < 0) //wheel-up
    //  this.scrollerDiv.scrollTop -= (2*this.viewPort.rowHeight);
    //  else
    //  this.scrollerDiv.scrollTop += (2*this.viewPort.rowHeight);
    //  this.handleScroll(false);
    //  }));
    var handler = dojo.hitch(this, function(event){
      var delta = 0;
      if (!event){
        event = window.event;
      }
      if (event.wheelDelta) {
        delta = event.wheelDelta/120;
        if (window.opera){
          delta = -delta;
        }
      } else if (event.detail) {
        delta = -event.detail/3;
      }
      if (delta) {
        if (delta >0){
          this.scrollerDiv.scrollTop -= (2*this.viewPort.rowHeight);
        }else{
          this.scrollerDiv.scrollTop += (2*this.viewPort.rowHeight);
        }
        this.handleScroll(false);
      }
      if (event.preventDefault){
        event.preventDefault();
      }
      event.returnValue = false;
    });
    if (window.addEventListener){
      this.liveGrid.domNode.addEventListener('DOMMouseScroll', handler, false);
    }else{
      dojo.connect(this.liveGrid.domNode, eventName, handler);
    }
  },

/**
* Updates the size of the grid.
*/
  updateSize: function() {
    var table = this.liveGrid.table;
    var visibleHeight = this.viewPort.visibleHeight();
    this.heightDiv.style.height = parseInt(visibleHeight *
      this.metaData.getTotalRows()/this.metaData.getPageSize()) + "px";
  },

/**
* Transform the row height to a pixel unit.
* @param {Number} rowOffset - row offset
* @return the pixel value
* @type Number
*/
  rowToPixel: function(rowOffset) {
    return (rowOffset / this.metaData.getTotalRows()) * this.heightDiv.offsetHeight
  },

/**
* Moves the scroll to the offset selected.
* @param {Number} rowOffset - row offset
*/
  moveScroll: function(rowOffset) {
    this.scrollerDiv.scrollTop = this.rowToPixel(rowOffset);
    if ( this.metaData.options.onscroll ){
      this.metaData.options.onscroll( this.liveGrid, rowOffset );
    }
  },

/**
* Handle function to manage the scrolling process.
*/
  handleScroll: function() {
    if (this.metaData.totalRows != '0') {
      if ( this.scrollTimeout ){
        clearTimeout( this.scrollTimeout );
      }
      var scrollDiff = this.lastScrollPos-this.scrollerDiv.scrollTop;
      if (scrollDiff != 0.00) {
        var r = this.scrollerDiv.scrollTop % this.viewPort.rowHeight;
        if (r != 0) {
          this.unplug();
          if ( scrollDiff < 0 ) {
            this.scrollerDiv.scrollTop += (this.viewPort.rowHeight-r);
          } else {
            this.scrollerDiv.scrollTop -= r;
          }
          this.plugin();
        }
      }
      var contentOffset = parseInt(this.scrollerDiv.scrollTop / this.viewPort.rowHeight);
      this.liveGrid.requestContentRefresh(contentOffset);
      this.viewPort.scrollTo(this.scrollerDiv.scrollTop);
      if ( this.metaData.options.onscroll ){
        this.metaData.options.onscroll( this.liveGrid, contentOffset );
      }
      this.scrollTimeout = setTimeout(dojo.hitch(this, "scrollIdle"), 1200 );
      this.lastScrollPos = this.scrollerDiv.scrollTop;
    }
  },

/**
* Method to launch the function that manages the onscrollidle event.
*/
  scrollIdle: function() {
    if ( this.metaData.options.onscrollidle ){
      this.metaData.options.onscrollidle();
    }
  }
});

dojo.declare("openbravo.widget.DataGrid.Buffer", null, {
  
/**
* Constructor.
* @param {Object} metaData - meta data handler
* @param {Object} liveGrid - pointer to the live grid
*/
  constructor: function(metaData, liveGrid) {
    this.startPos = 0;
    this.size     = 0;
    this.metaData = metaData;
    this.rows     = [];
    this.updateInProgress = false;
    this.liveGrid = liveGrid;
    this.maxBufferSize = metaData.getLargeBufferSize() * 2;
    this.maxFetchSize = metaData.getLargeBufferSize();
    this.lastOffset = 0;
    this.isFilter = false;
  },

/**
* Returns a blank row.
* @return the new blank row
* @type Object
*/
  getBlankRow: function() {
    if (!this.blankRow ) {
      this.blankRow = this.liveGrid.createRowObject(null);
      var values = [];
      for ( var i=0; i < this.metaData.columnCount; i++ ) {
        values[i] = "";
      }
      this.blankRow.setValues(values);
    }
    return this.blankRow;
  },

/**
* Loads the rows received by the ajax call.
* @param {Object} ajaxResponse - Xml object with the response
* @return Array with the new rows created
* @type Array
*/
  loadRows: function(ajaxResponse) {
    var xmldata = ajaxResponse.getElementsByTagName('xml-data');
    var status = xmldata[0].getElementsByTagName('status');
    if (status.length>0){
      var type = status[0].getElementsByTagName('type');
      var title = status[0].getElementsByTagName('title');
      var description = status[0].getElementsByTagName('description');
      if (dojox.data.dom.textContent(type[0]).toUpperCase() != 'HIDDEN') {
        try {
          renderMessageBox(dojox.data.dom.textContent(type[0]),dojox.data.dom.textContent(title[0]),dojox.data.dom.textContent(description[0]));
        } catch (err) {
          alert(dojox.data.dom.textContent(title[0]) + ":\n" + dojox.data.dom.textContent(description[0]));
        }
      }
    }
    var rowsElement = xmldata[0].getElementsByTagName('rows')[0];
    this.updateUI = rowsElement.getAttribute("update_ui") == "true"
      var numRows = parseInt(rowsElement.getAttribute("numRows"));
    if(this.isFilter) {
      this.metaData.totalRows = numRows;
      this.liveGrid.setTotalRows(numRows);
      this.isFilter=false;
    }// else if (!this.isFilter && numRows==0) return;
    if (this.metaData.totalRows == 0) {
      this.liveGrid.setTotalRows(numRows);
      this.liveGrid.fetchBuffer(0);
      if (this.metaData.options.onscroll){
        this.metaData.options.onscroll(this.liveGrid, 0);
      }
    }
    var newRows = [];
    var trs = rowsElement.getElementsByTagName("tr");
    if(trs.length>0){
      for ( var i=0 ; i < trs.length; i++ ) {
        var row = newRows[i] = this.liveGrid.createRowObject(this.lastOffset + i); 
        var cells = trs[i].getElementsByTagName("td");
        var values = [this.lastOffset + i + 1];
        for ( var j=0; j < cells.length ; j++ ) {
          var cell = cells[j];
          var cellContent = dojox.data.dom.textContent(cell);
          values.push(cellContent);
        }
        row.setValues(values);
        var rowId = row.getValue(this.liveGrid.columns.getIdentifier().index);
        if (this.liveGrid.options.failedRows.count > 0) {
          if (this.liveGrid.options.failedRows.contains(rowId)) {
            row.setStatus(row.ERROR);
          }
        }
      }
      return newRows;
    }
  },

/**
* Method to update rows after an ajax call.
* @param {Object} ajaxResponse - Object with the xml response
* @param {Number} start - start position column
*/
  update: function(ajaxResponse, start) {
    var newRows = this.loadRows(ajaxResponse);
    if (newRows==null) { newRows=[]; }
    if (this.rows.length == 0) {
      this.rows = newRows;
      this.size = this.rows.length;
      this.startPos = start;
      return;
    }
    if (start > this.startPos) {
      if (this.startPos + this.rows.length < start) {
        this.rows =  newRows;
        this.startPos = start;
      } else {
        this.rows = this.rows.concat( newRows.slice(0, newRows.length));
        if (this.rows.length > this.maxBufferSize) {
          var fullSize = this.rows.length;
          this.rows = this.rows.slice(this.rows.length - this.maxBufferSize, this.rows.length)
          this.startPos = this.startPos +  (fullSize - this.rows.length);
        }
      }
    } else {
      if (start + newRows.length < this.startPos) {
        this.rows =  newRows;
      } else {
        this.rows = newRows.slice(0, this.startPos).concat(this.rows);
        if (this.rows.length > this.maxBufferSize) {
          this.rows = this.rows.slice(0, this.maxBufferSize)
        }
      }
      this.startPos =  start;
    }
    this.size = this.rows.length;
  },

/**
* Method to clear the rows array.
*/
  clear: function() {
    this.rows = [];
    this.startPos = 0;
    this.size = 0;
  },

/**
* Indicates if is overlapped.
* @param {Number} start - start position
* @param {Number} size - size of the elements
* @return True: if is overlapped - False: if isn't
* @type Boolean
*/
  isOverlapping: function(start, size) {
    return ((start < this.endPos()) && (this.startPos < start + size)) || (this.endPos() == 0)
  },

/**
* Returns a boolean to indicate is is in range.
* @param {Number} position - Actual position
* @return True: if is in range - False: if isn't
* @type Boolean
*/
  isInRange: function(position) {
    return (position >= this.startPos) && (position + this.metaData.getPageSize() <= this.endPos()); 
  },

/**
* Indicates if is near top limit.
* @param {Number} position - Position to evaluate
* @return True: if is near top limit - False: if isn't
* @type Boolean
*/
  isNearingTopLimit: function(position) {
    return position - this.startPos < this.metaData.getLimitTolerance();
  },

/**
* Returns the end position.
* @return end position
* @type Number
*/
  endPos: function() {
    return this.startPos + this.rows.length;
  },

/**
* Indicates if is near bottom limit.
* @param {Number} position - Position to evaluate
* @return True: if is near bottom limit - False: if isn't
* @type Boolean
*/
  isNearingBottomLimit: function(position) {
    return this.endPos() - (position + this.metaData.getPageSize()) < this.metaData.getLimitTolerance();
  },

/**
* Indicates if is at top.
* @return True: if is at top - False: if isn't
* @type Boolean
*/
  isAtTop: function() {
    return this.startPos == 0;
  },

/**
* Indicates if is at bottom.
* @return True: if is at bottom - False: if isn't
* @type Boolean
*/
  isAtBottom: function() {
    return this.endPos() == this.metaData.getTotalRows();
  },

/**
* Indicates if is near limit.
* @param {Number} position - Position to evaluate
* @return True: if is near limit - False: if isn't
* @type Boolean
*/
  isNearingLimit: function(position) {
    return ( !this.isAtTop() && this.isNearingTopLimit(position)) ||
      ( !this.isAtBottom() && this.isNearingBottomLimit(position) )
  },

/**
* Returns the fetch size.
* @param {Number} offset - Offset of the row.
* @return fetch size
* @type Number
*/
  getFetchSize: function(offset) {
    var adjustedOffset = this.getFetchOffset(offset);
    var adjustedSize = 0;
    if (adjustedOffset >= this.startPos) {
      var endFetchOffset = this.maxFetchSize  + adjustedOffset;
      if (this.metaData.totalRows > 0 && endFetchOffset > this.metaData.totalRows){
        endFetchOffset = this.metaData.totalRows;
      }
      adjustedSize = endFetchOffset - adjustedOffset;  
      if(adjustedOffset == 0 && adjustedSize < this.maxFetchSize){
        adjustedSize = this.maxFetchSize;
      }
    } else {
      var adjustedSize = this.startPos - adjustedOffset;
      if (adjustedSize > this.maxFetchSize){
        adjustedSize = this.maxFetchSize;
      }
    }
    return adjustedSize;
  }, 

/**
* Returns the fetch offset.
* @param {Number} offset - Offset of the row.
* @return fetch offset
* @type Number
*/
  getFetchOffset: function(offset) {
    var adjustedOffset = offset;
    if (offset > this.startPos) {
      adjustedOffset = (offset > this.endPos()) ? offset :  this.endPos(); 
    } else {
      if (offset + this.maxFetchSize >= this.startPos) {
        var adjustedOffset = this.startPos - this.maxFetchSize;
        if (adjustedOffset < 0){
          adjustedOffset = 0;
        }
      }
    }
    this.lastOffset = adjustedOffset;
    return adjustedOffset;
  },

/**
* Return a specific row.
* @param {Number} offset - Offset of the row.
* @return the specific row
* @type Object
*/
  getRow: function(offset) {
    var rows = this.getRows(offset, 1);
    if (rows.length > 0){
      return rows[0];
    }else{
      return this.liveGrid.editingRow;
    }
  },

/**
* Returns an array of rows.
* @param {Number} start - start number
* @param {Number} count - total of rows
* @return Array of rows
* @type Array
*/
  getRows: function(start, count) {
    var begPos = start - this.startPos;
    var endPos = begPos + count;
    if ( endPos > this.size ){
      endPos = this.size;
    }
    var results = [];
    var index = 0;
    for ( var i=begPos ; i < endPos; i++ ) {
      results[index++] = this.rows[i];
    }
    return results;
  }
});

dojo.declare("openbravo.widget.DataGrid.ViewPort", null, {

/**
* Constructor.
* @param {Object} table - Pointer to the table
* @param {Number} rowHeight - row height
* @param {Number} visibleRows - number of visible rows
* @param {Object} buffer - buffer handler
* @param {Object} liveGrid - pointer to the live grid
*/
  constructor: function(table, rowHeight, visibleRows, buffer, liveGrid) {
    this.lastDisplayedStartPos = 0;
    this.div = table.parentNode;
    this.table = table;
    this.rowHeight = rowHeight;
    this.div.style.height = (this.rowHeight * visibleRows) + this.div.firstChild.offsetHeight + 15 + "px";
    this.buffer = buffer;
    this.liveGrid = liveGrid;
    this.visibleRows = visibleRows;
    this.lastPixelOffset = 0;
    this.startPos = 0;
  },

/**
* Updates the height.
*/
  updateHeight: function() {
    this.div.style.height = (this.rowHeight * this.liveGrid.visibleRows) + this.div.firstChild.offsetHeight + 15 + "px";
  },

/**
* Populates the row.
* @param {Object} htmlRow - Pointer to the html row
* @param {Object} row - Pointer to the row
*/
  populateRow: function(htmlRow, row) {
    if (row) {
      row.rowNode = htmlRow;
      row.updateGrid();
    }
  },

/**
* Manage the buffer changes.
*/
  bufferChanged: function() {
    this.refreshContents( parseInt(this.lastPixelOffset / this.rowHeight));
  },

/**
* Clear all rows.
*/
  clearRows: function() {
    if (!this.isBlank) {
      this.liveGrid.table.className = this.liveGrid.options.loadingClass;
      for (var i=0; i < this.visibleRows; i++){
        this.populateRow(this.table.rows[i], this.buffer.getBlankRow());
      }
      this.isBlank = true;
    }
  },

/**
* Clear the contents.
*/
  clearContents: function() {   
    this.clearRows();
    this.scrollTo(0);
    this.startPos = 0;
    this.lastStartPos = -1;   
  },

/**
* Refresh the content for the specific position.
* @param {Number} startPos - the start position
*/
  refreshContents: function(startPos) {
    if (startPos == this.lastRowPos && !this.isPartialBlank && !this.isBlank) {
      return;
    }
    if ((startPos + this.visibleRows < this.buffer.startPos)  
      || (this.buffer.startPos + this.buffer.size < startPos) 
      || (this.buffer.size == 0)) {
      this.clearRows();
      return;
    }
    try {
      setGridRefreshing(true);
    } catch (e) {}
    this.isBlank = false;
    var viewPrecedesBuffer = this.buffer.startPos > startPos
    var contentStartPos = viewPrecedesBuffer ? this.buffer.startPos: startPos; 
    var contentEndPos = (this.buffer.startPos + this.buffer.size < startPos + this.visibleRows) 
      ? this.buffer.startPos + this.buffer.size : startPos + this.visibleRows;
    var rowSize = contentEndPos - contentStartPos;
    var rows = this.buffer.getRows(contentStartPos, rowSize ); 
    var blankSize = this.visibleRows - rowSize;
    var blankOffset = viewPrecedesBuffer ? 0: rowSize;
    var contentOffset = viewPrecedesBuffer ? blankSize: 0;
    for (var i=0; i < rows.length; i++) {//initialize what we have
      this.populateRow(this.table.rows[i + contentOffset], rows[i]);
    }
    for (var i=0; i < blankSize; i++) {// blank out the rest 
      this.populateRow(this.table.rows[i + blankOffset], this.buffer.getBlankRow());
    }
    this.isPartialBlank = blankSize > 0;
    this.lastRowPos = startPos;
    this.liveGrid.table.className = this.liveGrid.options.tableClass;
    var onRefreshComplete = this.liveGrid.options.onRefreshComplete;
    this.liveGrid.showSelection();
    if (onRefreshComplete != null) {
      for (var i = 0; i < onRefreshComplete.length; i++) {
        onRefreshComplete[i]();
      }
    }
    try {
      setTimeout('setGridRefreshing(false);',50);
    } catch (e) {}
  },

/**
* Scrolls the view to the top.
* @param {Number} pixelOffset - pixel offset
*/
  scrollTo: function(pixelOffset) {
    if (this.lastPixelOffset == pixelOffset){
      return;
    }
    this.refreshContents(parseInt(pixelOffset / this.rowHeight))
    this.div.scrollTop = pixelOffset % this.rowHeight
    this.lastPixelOffset = pixelOffset;
  },

/**
* Returns the visible height.
* @return visible height.
* @type Number.
*/
  visibleHeight: function() {
    return parseInt(dojo.getComputedStyle(this.div).height) - 15 - this.div.firstChild.offsetHeight;
  },

/**
* Manage the spaces of a given string.
* @param {String} s - String with the spaces.
*/
  convertSpaces: function(s) {
  }
});

dojo.declare("openbravo.widget.DataGrid.ContentRequest", null, {
/**
* Constructor.
* @param {Object} requestOffset - requests handler
* @param {Array} options - Array of options
*/
  constructor: function( requestOffset, options ) {
    this.requestOffset = requestOffset;
  }
});

dojo.declare("openbravo.widget.DataGrid.SortingHandler", null, {
/**
* It is the method that dojo needs for the initialization of the object.
* @param {String} headerTableId - id of the header table
* @param {Array} options - Array of options
*/
  constructor: function(headerTableId, options) {
    this.headerTableId = headerTableId;
    this.headerTable   = dojo.byId(headerTableId);
    this.options = options;
    this.setOptions();
    this.applySortBehavior();
    this.sortColumns = [];
    if ( this.options.sortCols ) {
      this.setSortUI( this.options.sortCols, this.options.sortDirs );
    }
  },

/**
* It establishes the arrangements that are indicated for a column array that is given as a parameter. It uses the method setColumnSort for the arrangement of every column of the array.
* @param {Array} columnNames - array of column names
* @param {Array} sortDirections - array of sort directions
*/
  setSortUI: function( columnNames, sortDirections ) {
    for (var i = 0; i < columnNames.length; i++) {
      var column = this.options.columns.get(columnNames[i]) 
      if (column){
        this.setColumnSort(column.index, sortDirections[i]);
      }
    };
  },

/**
* It do the load of the images for indicate the ascending or the descending arrangement, but it doesn’t associate them to any object, so it seems a verification exercise to verify both existence. Then it established the driver for the arrangement in the method sort (this driver is obtained from the property options and it is the sortHandler).
*/
  setOptions: function() {
    new Image().src = this.options.sortAscendImg;
    new Image().src = this.options.sortDescendImg;
    this.sort = this.options.sortHandler;
  },

/**
* It crosses each of the columns of the header to execute the method addSortBehaviorToColumn on them.
*/
  applySortBehavior: function() {
    var headerRow   = this.headerTable.rows[0];
    var headerCells = headerRow.cells;
    for ( var i = 0 ; i < headerCells.length ; i++ ) {
      this.addSortBehaviorToColumn( i, headerCells[i] );
    }
  },

/**
* It assigns correctly, to a given column, go, the driver to manage the event onClick (headerCellClicked), the cursor style and the zone reserved to place the image of arrangement.
* @param {Number} n - column position
* @param {Object} cell - cell object
*/
  addSortBehaviorToColumn: function( n, cell ) {
    if ( this.options.columns.get(n).isSortable() ) {
      cell.id            = this.headerTableId + '_' + n;
      cell.style.cursor  = 'pointer';
      dojo.connect(cell, "onclick", this, "headerCellClicked");
      //var nobr1 = document.createElement("nobr");
      //var nobr1 = document.createElement("span");
      //nobr1.setAttribute("id", 'nobr_' + this.headerTableId + '_img_' + n);
      //nobr1.setAttribute("id", this.headerTableId + '_img_' + n);
      //nobr1.innerHTML     =  '<span id="' + this.headerTableId + '_img_' + n + '"></span>' +
      //cell.innerHTML;
      cell.innerHTML = '<span id="' + this.headerTableId + '_img_' + n + '"></span>' + cell.innerHTML;
      //cell.appendChild(nobr1);
    }
  },

/**
* It is the driver for the event onClick on the header. It will control if the cell is being resized to do nothing, because this is another function job. The process that controls this driver is the arrangement one.
* @param {EventHandler} evt - event handler
*/
  headerCellClicked: function(evt) {
    if (this.options.hasResized()) { return; }
    var eventTarget = openbravo.widget.DataGrid.html.getEventTarget(evt);
    var cellId = eventTarget.id;
    var columnNumber = parseInt(cellId.substring( cellId.lastIndexOf('_') + 1 ));
    var column = this.options.columns.get(columnNumber);
    if (!column) { return; }
    var isSorted = column.isSorted();
    if ( this.sortColumns.length > 0 ) {
      if (!isSorted) {
        if (!evt.ctrlKey){
          this.removeAllColumnsSort();
        }
        this.setColumnSort(columnNumber, openbravo.widget.DataGrid.Column.SORT_ASC);
      } else {
        if (!evt.ctrlKey){
          dojo.forEach(this.sortColumns, dojo.hitch(this, function(sortColumn) {
            if (sortColumn != column){
              this.removeColumnSort(sortColumn.index);
            }
          }));
        }
        this.toggleColumnSort(columnNumber);
      }
    } else {
      this.setColumnSort(columnNumber, openbravo.widget.DataGrid.Column.SORT_ASC);
    }
    if (this.options.sortHandler) {
      this.options.sortHandler(this.sortColumns);
    }
  },

/**
* It eliminates all the arrangements of the visualization and the internal array columns.
*/
  removeAllColumnsSort: function() {
    dojo.forEach(this.sortColumns, dojo.hitch(this, function(column) {
      this.options.columns.get(column.index).setUnsorted();
      this.setSortImage(column.index);
    }));
    this.sortColumns = [];
  },

/**
* Removes the column sort.
* @param {Number} n - Index of the column
*/
  removeColumnSort: function(n) {
    var column = this.options.columns.get(n);
    column.setUnsorted();
    var index = dojo.indexOf(this.sortColumns, column);
    this.sortColumns.splice(index, 1);
    this.setSortImage(n);
  },

/**
* It marks a column as sorted and it adds it to the internal array of columns of arrangement. Also it updates the icon for the visualization of the arrangement.
* @param {Number} n - Index of the column
* @param {String} direction - Direction for the new order
*/
  setColumnSort: function(n, direction) {
    if(isNaN(n)) { return; }
    var column = this.options.columns.get(n);
    column.setSorted(direction);
    this.sortColumns.push(column);
    this.setSortImage(n);
  },

/**
* It changes the orientation of the arrangement
* @param {Number} n - column index
*/
  toggleColumnSort: function(n) {
    this.options.columns.get(n).toggleSort();
    this.setSortImage(n);
  },

/**
* It is the method that constructs the image of the corresponding arrangement on screen.
* @param {Number} n - Column index
*/
  setSortImage: function(n) {
    var sortDirection = this.options.columns.get(n).getSortDirection();
    var sortImageSpan = dojo.byId( this.headerTableId + '_img_' + n );
    if ( sortDirection == openbravo.widget.DataGrid.Column.UNSORTED ){
      sortImageSpan.innerHTML = '';
    }else if ( sortDirection == openbravo.widget.DataGrid.Column.SORT_ASC ){
      sortImageSpan.innerHTML = '<div class="DataGrid_Header_icon_ascArrow"/>&nbsp;&nbsp;';
    }else if ( sortDirection == openbravo.widget.DataGrid.Column.SORT_DESC ){
      sortImageSpan.innerHTML = '<div class="DataGrid_Header_icon_descArrow"/>&nbsp;&nbsp;';
    }
  }
});


openbravo.widget.DataGrid.html = {

  getEventTarget: function(evt){
    if (!evt) { evt = dojo.global.event || {}; }
    var t = (evt.srcElement ? evt.srcElement : (evt.target ? evt.target : null));
    while ((t)&&(t.nodeType!=1)) { t = t.parentNode; }
    return t;
  },

  getParentByType: function(node, type) {
    var _document = dojo.doc;
    var parent = dojo.byId(node);
    type = type.toLowerCase();
    while ((parent)&&(parent.nodeName.toLowerCase()!=type)) {
      if (parent==(_document["body"]||_document["documentElement"])) {
        return null;
      }
      parent = parent.parentNode;
    }
    return parent;
  },

  getScrollbar: function() {
    var scroll = document.createElement("div");
    scroll.style.width="100px";
    scroll.style.height="100px";
    scroll.style.overflow="scroll";
    scroll.style.position="absolute";
    scroll.style.top="-300px";
    scroll.style.left="0px"
    var test = document.createElement("div");
    test.style.width="400px";
    test.style.height="400px";
    scroll.appendChild(test);
    dojo.body().appendChild(scroll);
    var width=scroll.offsetWidth - scroll.clientWidth;
    dojo.body().removeChild(scroll);
    scroll.removeChild(test);
    scroll=test=null;
    return { width: width };
  },

  setVisibility: function(node, visibility) {
    dojo.style(node, 'visibility', ((visibility instanceof String || typeof visibility == "string") ? visibility : (visibility ? 'visible' : 'hidden')));
  },

  disableSelection: function(element) {
    element = dojo.byId(element)||dojo.body();
    if (dojo.isFF) {
      element.style.MozUserSelect = "none";
    } else if (dojo.isSafari) {
      element.style.KhtmlUserSelect = "none"; 
    } else if (dojo.isIE) {
      element.unselectable = "on";
    } else {
      return false;
    }
    return true;
  },

  enableSelection: function(element) {
    element = dojo.byId(element)||dojo.body();
    if (dojo.isFF) { 
      element.style.MozUserSelect = ""; 
    } else if (dojo.isSafari) {
      element.style.KhtmlUserSelect = "";
    } else if (dojo.isIE) {
      element.unselectable = "off";
    } else {
      return false;
    }
    return true;
  },

  inArray: function(array , value) {
    return dojo.indexOf(array, value) > -1;
  },

  toArray:function(array,value) {
    var collection=[];
    for (var i=value||0; i<array.length; i++) {
      collection.push(array[i]);
    }
    return collection;
  },

  setContent: function(element, content) {
    if (element.innerText != undefined){
      element.innerText = content;
    }else{
      element.textContent = content;
    }
  },

  prereplaceClass: function(node, newClass, oldClass) {
    if (dojo.hasClass(node, oldClass)){
      dojo.removeClass(node, oldClass);
    }
    if (!dojo.hasClass(node, newClass)){
      dojo.addClass(node, newClass);
    }
  },

  stripNbsp: function(string) {
    return string;
  },

  extractPx: function(property) {
    return parseInt(property.substring(0, property.indexOf("px")));
  },

  getContent: function(node) {
    return node.innerText != undefined ? node.innerText : node.textContent;
  },

  getContentAsString: function(node){
    if (typeof node.xml != "undefined"){
      return this.getContentAsStringIE(node);
    }else if (typeof XMLSerializer != "undefined" ){
      return this.getContentAsStringMozilla(node);
    }else{
      return this.getContentAsStringGeneric(node);
    }
  },

  getContentAsStringIE: function(node){
    var s="";
      for (var i = 0; i < node.childNodes.length; i++){
        s += node.childNodes[i].xml;
      }
      return s;
  },

  getContentAsStringMozilla: function(node){
    var xmlSerializer = new XMLSerializer();
    var s = "";
    for (var i = 0; i < node.childNodes.length; i++) {
      s += xmlSerializer.serializeToString(node.childNodes[i]);
      if (s == "undefined"){
        return this.getContentAsStringGeneric(node);
      }
    }
    return s;
  },

  getContentAsStringGeneric: function(node){
    var s="";
    if (node == null) { return s; }
    for (var i = 0; i < node.childNodes.length; i++) {
      switch (node.childNodes[i].nodeType) {
        case 1: // ELEMENT_NODE
        case 5: // ENTITY_REFERENCE_NODE
          s += this.getElementAsStringGeneric(node.childNodes[i]);
          break;
        case 3: // TEXT_NODE
        case 2: // ATTRIBUTE_NODE
        case 4: // CDATA_SECTION_NODE
          s += node.childNodes[i].nodeValue;
          break;
        default:
          break;
      }
    }
    return s;
  },

  getElementAsStringGeneric: function(node){
    if (!node) { return ""; }
    
    var s='<' + node.nodeName;
    // add attributes
    if (node.attributes && node.attributes.length > 0) {
      for (var i=0; i < node.attributes.length; i++) {
        s += " " + node.attributes[i].name + "=\"" + node.attributes[i].value + "\"";
      }
    }
    // close start tag
    s += '>';
    // content of tag
    s += this.getContentAsStringGeneric(node);
    // end tag
    s += '</' + node.nodeName + '>';
    return s;
  },

  clearElement: function(element) {
    if (typeof(element) == 'string'){
      element = dojo.byId(element);
    }
    while (element.firstChild){
      element.removeChild(element.firstChild);
    }
  }
};


openbravo.widget.DataGrid.io = {
  asyncCall: function(serviceUrl, content) {
    if (serviceUrl.method == 'GET') {
      dojo.xhrGet({
        url: serviceUrl.url,
        preventCache: true,
        handleAs: serviceUrl.handleAs,
        content: content,
        load: serviceUrl.handler,
        error: openbravo.widget.DataGrid.io.handleError
      });
    } else if (serviceUrl.method == 'POST') {
      dojo.xhrPost({
        url: serviceUrl.url,
        preventCache: true,
        handleAs: serviceUrl.handleAs,
        content: content,
        load: serviceUrl.handler,
        error: openbravo.widget.DataGrid.io.handleError
      });
    }
  },

  handleError: function(exception, http, kwArgs){
    setValues_MessageBox('messageBoxID',"ERROR", "Error received in IO response:", exception.message);
  }
};

}

if(!dojo._hasResource["openbravo.widget.ValidationTextBox"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["openbravo.widget.ValidationTextBox"] = true;
/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.0  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html 
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License. 
 * The Original Code is Openbravo ERP. 
 * The Initial Developer of the Original Code is Openbravo SL 
 * All portions are Copyright (C) 2001-2008 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
*/

dojo.provide("openbravo.widget.ValidationTextBox");



dojo.declare("openbravo.widget.ValidationTextBox", [dijit.form.TextBox], {
  templateString: "",
  templateString:"<span style='float:${htmlfloat};'>\n  <table style=\"border:0px;border-collapse:collapse;\">\n    <tr>\n      <td style=\"padding-top: 0px;\">\n        <input class=\"${class}\" dojoAttachPoint='textbox,focusNode' dojoAttachEvent='onfocus:_onFocus,onkeyup:_onKeyUp,onblur:_onBlur' autocomplete=\"off\" type='${type}' name='${name}' id=\"${id}\" />\n      </td>\n    </tr>\n  </table>\n  <span dojoAttachPoint='invalidSpan'>\n    <span class=\"TextBox_MsgContainer_span\">\n      <table class=\"TextBox_MsgContainer_table\">\n        <tr class=\"TextBox_MsgContainer_tr\">\n          <td class=\"TextBox_MsgContainer_td\"><div class=\"TextBox_MsgContainer_div\" /></td><td></td>\n        </tr>\n        <tr>\n          <td colspan=\"2\" class='${invalidClass}'><div class=\"TextBox_MsgContainer_div2\">${invalidMessage}</div></td>\n        </tr>\n      </table>\n    </span>\n  </span>\n  <span dojoAttachPoint='missingSpan'>\n    <span class=\"TextBox_MsgContainer_span\">\n      <table class=\"TextBox_MsgContainer_table\">\n        <tr class=\"TextBox_MsgContainer_tr\">\n          <td class=\"TextBox_MsgContainer_td\"><div class=\"TextBox_MsgContainer_div\" /></td><td></td>\n        </tr>\n        <tr>\n          <td colspan=\"2\" class='${missingClass}'><div class=\"TextBox_MsgContainer_div2\">${missingMessage}</div></td>\n        </tr>\n      </table>\n    </span>\n  </span>\n  <span dojoAttachPoint='rangeSpan'>\n    <span class=\"TextBox_MsgContainer_span\">\n      <table class=\"TextBox_MsgContainer_table\">\n        <tr class=\"TextBox_MsgContainer_tr\">\n          <td class=\"TextBox_MsgContainer_td\"><div class=\"TextBox_MsgContainer_div\" /></td><td></td>\n        </tr>\n        <tr>\n          <td colspan=\"2\" class='${rangeClass}'><div class=\"TextBox_MsgContainer_div2\">${rangeMessage}</div></td>\n        </tr>\n      </table>\n    </span>\n  </span>\n</span>\n",

  baseClass: "",
  receivedClass: "",
  value: "",

  invalidSpan: null,
  missingSpan: null,
  rangeSpan: null,

  invalidClass: "invalid",
  missingClass: "missing",
  rangeClass: "range",

  listenOnKeyPress: true,
  lastCheckedValue: null,
  htmlfloat: "none",

  classPrefix: "dojoValidate",

  required: false,

  promptMessage: "",

  invalidMessage: "$_unset_$",
  missingMessage: "$_unset_$",
  rangeMessage: "$_unset_$",

  constraints: {},

  regExp: ".*",

  regExpGen: function(constraints){ return this.regExp; },

  validator: function(value, constraints) {
    return (new RegExp("^(" + this.regExpGen(constraints) + ")"+(this.required?"":"?")+"$")).test(value) &&
      (!this.required || !this.isEmpty(value)) &&
      (this.isEmpty(value) || this.parse(value, constraints) !== undefined); // Boolean
  },

  isValid: function() {
    // summary: Need to over-ride with your own validation code in subclasses
    return this.validator(this.textbox.value, this.constraints);
  },

  isInRange: function() {
    // summary: Need to over-ride with your own validation code in subclasses
    return true;
  },

  isEmpty: function() {
    // summary: Checks for whitespace
    return ( /^\s*$/.test(this.textbox.value) ); // Boolean
  },

  isMissing: function() {
    // summary: Checks to see if value is required and is whitespace
    return ( this.required && this.isEmpty() ); // Boolean
  },


  update: function(isFocused) {
    // summary:
    //		Called by oninit, onblur, and onkeypress.
    // description:
    //		Show missing or invalid messages if appropriate, and highlight textbox field.
    this.lastCheckedValue = this.textbox.value;

    this.missingSpan.style.display = "none";
    this.invalidSpan.style.display = "none";
    this.rangeSpan.style.display = "none";

    var empty = this.isEmpty();
    var valid = this.isValid();
    var missing = this.isMissing();

    //alert(empty + " " + valid + " " + missing);

    // Display at most one error message
    if (missing) {
      this.missingSpan.style.display = "";
      this.updateClass("Empty");
    } else if (!empty && !valid) {
      this.invalidSpan.style.display = "";
      this.updateClass("Invalid");
    } else if (!empty && !this.isInRange()) {
      this.rangeSpan.style.display = "";
      this.updateClass("Invalid");
    } else {
      this.updateClass("Valid");
    }
  },
  
  //Needed to overide default dojo focused, hover, ... states css
  _setStateClass: function() {
  },

  updateClass: function(className) {
    // summary: used to ensure that only 1 validation class is set at a time
    var pre = this.classPrefix;
    if (focusedWindowElement == this.textbox) {
      dojo.removeClass(this.textbox,pre+"Empty_focus");
      dojo.removeClass(this.textbox,pre+"Valid_focus");
      dojo.removeClass(this.textbox,pre+"Invalid_focus");
      dojo.addClass(this.textbox,pre+className+"_focus");
    } else {
      dojo.removeClass(this.textbox,pre+"Empty");
      dojo.removeClass(this.textbox,pre+"Valid");
      dojo.removeClass(this.textbox,pre+"Invalid");
      dojo.addClass(this.textbox,pre+className);
    }
  },

  highlight: function() {
    // summary: by Called oninit, and onblur.
    // highlight textbox background 
    if (this.isEmpty()) {
      this.updateClass("Empty");
    } else if (this.isValid() && this.isInRange()) {
      this.updateClass("Valid");
    } else if (this.textbox.value != this.promptMessage) {
      this.updateClass("Invalid");
    } else {
      this.updateClass("Empty");
    }
  },

  _onKeyUp: function(evt){
    if(this.listenOnKeyPress) {
      //this.filter();  trim is problem if you have to type two words
      this.update(); 
    } else if (this.textbox.value != this.lastCheckedValue) {
      this.updateClass("Empty");
    }
  },

  _onFocus: function(evt) {
    if (!this.listenOnKeyPress) {
      this.updateClass("Empty");
//    this.textbox.style.backgroundColor = "";
    }
  },

  _onBlur: function(evt) {
    this.inherited(arguments);
    this.filter();
    this.update(); 
  },

  getMessage: function(index, _language) {
    if (_language==null){
      if (typeof defaultLang != "undefined") {
        _language = defaultLang;
      } else if (typeof LNG_POR_DEFECTO != "undefined") {
        // Deprecated in 2.50, only for compatibility
        _language = LNG_POR_DEFECTO;
      }
    }
    if (typeof arrMessages != "undefined") {
      var total = arrMessages.length;
      for (var i=0;i<total;i++){
        if (arrMessages[i].language == _language){
          if (arrMessages[i].message == index){
            if (index == "Invalid" && this.invalidMessage == "$_unset_$") { return arrMessages[i].text; }
            if (index == "Missing" && this.missingMessage == "$_unset_$") { return arrMessages[i].text; }
            if (index == "Range" && this.rangeMessage == "$_unset_$") { return arrMessages[i].text; }
          }
        }
      }
    } else {
      this.messages = dojo.i18n.getLocalization("dijit.form", "validate", this.lang);
      if(index == "Invalid" && this.invalidMessage == "$_unset_$"){ return this.messages.invalidMessage; }
      if(index == "Missing" && this.missingMessage == "$_unset_$"){ return this.messages.missingMessage; }
      if(index == "Range" && this.rangeMessage == "$_unset_$"){ return this.messages.rangeMessage; }
    }
    return null;
  },

  setMessages: function() {
    this.invalidMessage = this.getMessage("Invalid");
    this.missingMessage = this.getMessage("Missing");
    this.rangeMessage = this.getMessage("Range");
  },


  //////////// INITIALIZATION METHODS ///////////////////////////////////////

  constructor: function() {
    this.constraints = {};
  },

  postMixInProperties: function() {
    this.setMessages();
    this.inherited(arguments);
    var p = this.regExpGen(this.constraints);
    this.regExp = p;
  },

  postCreate: function() {
    if(this.required){ dojo.addClass(this.textbox, "required"); }
    if(this.readonly){ dojo.addClass(this.textbox, "readonly"); }
    if(this.disabled){ dojo.addClass(this.textbox, "disabled"); }
    if (this.disabled){ this.textbox.setAttribute("disabled", "true"); }
    if (this.readonly){ this.textbox.setAttribute("readonly", "true"); }
    this.invalidSpan.style.display="none";
    this.missingSpan.style.display="none";
    this.rangeSpan.style.display="none";
    this.highlight();
    this.inherited(arguments);
  }
});


dojo.declare("openbravo.widget.ValidationTextBox.Date", [openbravo.widget.ValidationTextBox], {
  displayFormat: "",
  saveFormat: "",

  listenOnKeyPress: false,

  greaterThan:"",
  lowerThan:"",

  isWrong:false,

  postMixInProperties: function() {
    this.inherited(arguments);
  },

  postCreate:function() {
    this.inherited(arguments);
    this.textbox.setAttribute("displayFormat", this.displayFormat);
    this.displayFormat=this.displayFormat.replace("mm","MM").replace("dd","DD").replace("yyyy","YYYY");
    this.displayFormat=this.displayFormat.replace("MM","%m").replace("DD","%d").replace("YYYY","%Y");
    this.saveFormat=this.displayFormat;
  },

  isValid: function() {
    if (this.getDate(this.textbox.value,this.displayFormat)){
      return true;
    } else {
      return false;
    }
  },

  isInRange: function() {
    if ((this.greaterThan == "" || this.greaterThan == null) && (this.lowerThan == "" || this.lowerThan == null)) {
      return true;
    }
    if (this.greaterThan != "") {
      if (dojo.byId(this.greaterThan).value == null || dojo.byId(this.greaterThan).value == "") {
        if (this.isWrong == true) {
          this.isWrong = false;
          dijit.byId(this.greaterThan).update();
        }
        return true;
      } else if (this.textbox.value == "" || this.textbox.value == null) {
        if (this.isWrong == true) {
          this.isWrong = false;
          dijit.byId(this.greaterThan).update();
        }
        return true;
      } else if (this.getDate(this.textbox.value,this.displayFormat) < this.getDate(dojo.byId(this.greaterThan).value,this.displayFormat)) {
        if (this.isWrong == false) {
          this.isWrong = true;
          dijit.byId(this.greaterThan).update();
        }
        return false;
      } else {
        if (this.isWrong == true) {
          this.isWrong = false;
          dijit.byId(this.greaterThan).update();
        }
        return true;
      }
    }
    if (this.lowerThan != "") {
      if (dojo.byId(this.lowerThan).value == null || dojo.byId(this.lowerThan).value == "") {
        if (this.isWrong == true) {
          this.isWrong = false;
          dijit.byId(this.lowerThan).update();
        }
        return true;
      } else if (this.textbox.value == "" || this.textbox.value == null) {
        if (this.isWrong == true) {
          this.isWrong = false;
          dijit.byId(this.lowerThan).update();
        }
        return true;
      } else if (this.getDate(this.textbox.value,this.displayFormat) > this.getDate(dojo.byId(this.lowerThan).value,this.displayFormat)) {
        if (this.isWrong == false) {
          this.isWrong = true;
          dijit.byId(this.lowerThan).update();
        }
        return false;
      } else {
        if (this.isWrong == true) {
          this.isWrong = false;
          dijit.byId(this.lowerThan).update();
        }
        return true;
      }
    }
  },

  getDate: function(str_datetime, str_dateFormat) {
    var inputDate=new Date(0,0,0); 
    if (str_datetime.length == 0) { return inputDate; } 
    // datetime parsing and formatting routimes. modify them if you wish other datetime format 
    var re_date = new RegExp("^(\\d+)[\\-|\\/|/|:|.|\\.](\\d+)[\\-|\\/|/|:|.|\\.](\\d+)$"); 
    if (!re_date.test(str_datetime)){
      return false; 
    }
    var m = re_date.exec(str_datetime);
    if (!str_dateFormat){ str_dateFormat = defaultDateFormat; }
    switch (str_dateFormat) {
      case "%m-%d-%Y": 
      case "%m/%d/%Y": 
      case "%m.%d.%Y": 
      case "%m:%d:%Y": 
        if (m[2] < 1 || m[2] > 31){ return false; }
        if (m[1] < 1 || m[1] > 12){ return false; }
        if (m[3] < 1 || m[3] > 9999){ return false; }
        inputDate=new Date(parseFloat(m[3]), parseFloat(m[1])-1, parseFloat(m[2]));
        return inputDate;
      break;
      case "%Y-%m-%d": 
      case "%Y/%m/%d": 
      case "%Y.%m.%d": 
      case "%Y:%m:%d": 
        if (m[3] < 1 || m[3] > 31){ return false; }
        if (m[2] < 1 || m[2] > 12){ return false; }
        if (m[1] < 1 || m[1] > 9999){ return false; }
        inputDate=new Date(parseFloat(m[1]), parseFloat(m[2])-1, parseFloat(m[3]));
        return inputDate;
      break;
      case "%d-%m-%Y": 
      case "%d/%m/%Y": 
      case "%d.%m.%Y": 
      case "%d:%m:%Y": 
        if (m[1] < 1 || m[1] > 31){ return false; }
        if (m[2] < 1 || m[2] > 12){ return false; }
        if (m[3] < 1 || m[3] > 9999){ return false; }
        inputDate=new Date(parseFloat(m[3]), parseFloat(m[2])-1, parseFloat(m[1]));
        return inputDate;
      break;
    }
    return false; 
  },

  _onKeyUp: function(evt) {
    this.inherited(arguments);
    this.autoCompleteDate(this.textbox ,this.displayFormat);
  },

/**
* Text insertion of mask at inserting time
*/
  autoCompleteDate: function(/*String*/field, /*String*/fmt) {
    if (!isTabPressed) {
      try {
      if (this.getCaretPosition(field).start != field.value.length) { return; } //If we are inserting in a position different from the last one, we don't autocomplete
      } catch (ignored) {}
      if (fmt == null || fmt == "") {
        alert('openbravo.widget.DateTextBox ERROR: No displayFormat specified');
        return;
      }
//    fmt = getDateFormat(fmt);
      var strDate = field.value;
      var b = fmt.match(/%./g);
      var i = 0, j = -1;
      var text = "";
      var length = 0;
      var pos = fmt.indexOf(b[0]) + b[0].length;
      var separator = fmt.substring(pos, pos+1);
      var separatorH = "";
      pos = fmt.indexOf("%H");
      if (pos!=-1) { separatorH = fmt.substring(pos + 2, pos + 3); }
      while (strDate.charAt(i)) {
        if (strDate.charAt(i)==separator || strDate.charAt(i)==separatorH) {
          i++;
          continue;
        }
        if (length<=0) {
          j++;
          if (j>0) {
            if (b[j]=="%H") { text += " "; }
            else if (b[j]=="%M" || b[j]=="%S") { text += separatorH; }
            else { text += separator; }
          }
          switch (b[j]) {
              case "%d":
              case "%e":
                  text += strDate.charAt(i);
                  length = 2;
                  break;
              case "%m":
                  text += strDate.charAt(i);
                  length = 2;
                  break;
              case "%Y":
                  text += strDate.charAt(i);
                  length = 4;
                  break;
              case "%y":
                  text += strDate.charAt(i);
                  length = 2;
                  break;
              case "%H":
              case "%I":
              case "%k":
              case "%l":
                  text += strDate.charAt(i);
                  length = 2;
                  break;
              case "%M":
                  text += strDate.charAt(i);
                  length = 2;
                  break;
              case "%S":
                  text += strDate.charAt(i);
                  length = 2;
                  break;
          }
        } else { text += strDate.charAt(i); }
        length--;
        i++;
      }
      field.value = text;
      //IE doesn't detect the onchange event if text value is modified programatically, so it's here called
      if (i > 7 && (typeof (field.onchange)!="undefined")) { field.onchange(); }
    }
  },

  // caretPosition object
  caretPosition: function() {
    var start = null;
    var end = null;
  },

/**
* Function that returns actual position of -1 if we are at last position
*/
  getCaretPosition: function(oField) {
    var oCaretPos = new this.caretPosition();
    // IE support
    if(document.selection) {
      oField.focus();
      var oSel = document.selection.createRange();
      var selectionLength = oSel.text.length;
      oSel.moveStart ('character', -oField.value.length);
      oCaretPos.start = oSel.text.length - selectionLength;
      oCaretPos.end = oSel.text.length;
    } /*Firefox support */ else if (oField.selectionStart || oField.selectionStart == '0') {
      oCaretPos.start = oField.selectionStart;
      oCaretPos.end = oField.selectionEnd;
    }
    // Return results
    return (oCaretPos);
  }

});



dojo.declare("openbravo.widget.ValidationTextBox.Number", [openbravo.widget.ValidationTextBox], {
  listenOnKeyPress: true,

  greaterThan:"",
  lowerThan:"",

  group: "",
  decimal: "",
  pattern: "#,##0.###",

  isWrong:false,

  regExpGen: function(){ return this.generateRegExp().regexp; },

  generateRegExp: function(options) {
    options = options || {};
    var pattern = this.pattern;
    var group = this.group;
    var decimal = this.decimal;
    var factor = 1;
    var _numberPatternRE = /[#0,]*[#0](?:\.0*#*)?/;

    //TODO: handle quoted escapes
    var patternList = pattern.split(';');
    if(patternList.length == 1){
      patternList.push("-" + patternList[0]);
    }

    var re = dojo.regexp.buildGroupRE(patternList, function(pattern){
      pattern = "(?:"+dojo.regexp.escapeString(pattern, '.')+")";
      return pattern.replace(_numberPatternRE, function(format){
        var flags = {
          signed: false,
          separator: options.strict ? group : [group,""],
          fractional: options.fractional,
          decimal: decimal,
          exponent: false};
        var parts = format.split('.');
        var places = options.places;
        if(parts.length == 1 || places === 0){flags.fractional = false;}
        else{
          if(places === undefined){ places = options.pattern ? parts[1].lastIndexOf('0')+1 : Infinity; }
          if(places && options.fractional == undefined){flags.fractional = true;} // required fractional, unless otherwise specified
          if(!options.places && (places < parts[1].length)){ places += "," + parts[1].length; }
          flags.places = places;
        }
        var groups = parts[0].split(',');
        if(groups.length>1){
          flags.groupSize = groups.pop().length;
          if(groups.length>1){
            flags.groupSize2 = groups.pop().length;
          }
        }
        return "("+dojo.number._realNumberRegexp(flags)+")";
      });
    }, true);

  //TODO: substitute localized sign/percent/permille/etc.?

    // normalize whitespace and return
    return {regexp: re.replace(/[\xa0 ]/g, "[\\s\\xa0]"), group: group, decimal: decimal, factor: factor}; // Object
  },

  isInRange: function() {
    if ((this.greaterThan == "" || this.greaterThan == null) && (this.lowerThan == "" || this.lowerThan == null)) {
      return true;
    }
    if (this.greaterThan != "") {
      if (dojo.byId(this.greaterThan).value == null || dojo.byId(this.greaterThan).value == "") {
        if (this.isWrong == true) {
          this.isWrong = false;
          dijit.byId(this.greaterThan).update();
        }
        return true;
      } else if (this.textbox.value == "" || this.textbox.value == null) {
        if (this.isWrong == true) {
          this.isWrong = false;
          dijit.byId(this.greaterThan).update();
        }
        return true;
      } else if (parseFloat(this.textbox.value) < parseFloat(dojo.byId(this.greaterThan).value)) {
        if (this.isWrong == false) {
          this.isWrong = true;
          dijit.byId(this.greaterThan).update();
        }
        return false;
      } else {
        if (this.isWrong == true) {
          this.isWrong = false;
          dijit.byId(this.greaterThan).update();
        }
        return true;
      }
    }
    if (this.lowerThan != "") {
      if (dojo.byId(this.lowerThan).value == null || dojo.byId(this.lowerThan).value == "") {
        if (this.isWrong == true) {
          this.isWrong = false;
          dijit.byId(this.lowerThan).update();
        }
        return true;
      } else if (parseFloat(this.textbox.value) > parseFloat(dojo.byId(this.lowerThan).value)) {
        if (this.isWrong == false) {
          this.isWrong = true;
          dijit.byId(this.lowerThan).update();
        }
        return false;
      } else {
        if (this.isWrong == true) {
          this.isWrong = false;
          dijit.byId(this.lowerThan).update();
        }
        return true;
      }
    }
  }

});

dojo.declare("openbravo.widget.ValidationTextBox.RealNumber", [openbravo.widget.ValidationTextBox.Number], {
  group: ",",
  decimal: "."
});

dojo.declare("openbravo.widget.ValidationTextBox.IntegerNumber", [openbravo.widget.ValidationTextBox.Number], {
  group: ",",
  decimal: ""
});

}

	



	if(dojo.config.afterOnLoad && dojo.isBrowser){
		//Dojo is being added to the page after page load, so just trigger
		//the init sequence after a timeout. Using a timeout so the rest of this
		//script gets evaluated properly. This work needs to happen after the
		//dojo.config.require work done in dojo._base.
		window.setTimeout(dojo._fakeLoadInit, 1000);
	}

})();

