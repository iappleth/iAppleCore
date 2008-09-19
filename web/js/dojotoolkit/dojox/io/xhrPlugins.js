if(!dojo._hasResource["dojox.io.xhrPlugins"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.io.xhrPlugins"] = true;
dojo.provide("dojox.io.xhrPlugins");
dojo.require("dojo.AdapterRegistry");
dojo.require("dojo._base.xhr");

(function() {
	var registry;
	var plainXhr;
	dojox.io.xhrPlugins.register = function(){
		//	summary:
		// 		overrides the default xhr handler to implement a registry of
		// 		xhr handlers
		if(!registry){
			registry = new dojo.AdapterRegistry();
			plainXhr = dojox.io.xhrPlugins.plainXhr = dojo._defaultXhr || dojo.xhr;
			// replaces the default xhr() method. Can we just use connect() instead?
			dojo[dojo._defaultXhr ? "_defaultXhr" : "xhr"] = function(/*String*/ method, /*dojo.__XhrArgs*/ args, /*Boolean?*/ hasBody){
				return registry.match.apply(registry,arguments);						
			};
			registry.register(
				"xhr",
				function(method,args){ 
					if(!args.url.match(/^\w*:\/\//)){
						// if it is not an absolute url (or relative to the
						// protocol) we can use this plain XHR
						return true;
					}
					var root = window.location.href.match(/^.*?\/\/.*?\//)[0];
					return args.url.substring(0, root.length) == root; // or check to see if we have the same path
				},
				plainXhr
			);
		}
		return registry.register.apply(registry, arguments);
	};
	dojox.io.xhrPlugins.addProxy = function(proxyUrl){
		//	summary:
		//		adds a server side proxy xhr handler for cross-site URLs
		//	proxyUrl:
		//		This is URL to send the requests to.
		//	example:
		//		Define a proxy:
		//	|	dojox.io.xhrPlugins.addProxy("/proxy?url=");
		// 		And then when you call:
		//	|	dojo.xhr("GET",{url:"http://othersite.com/file"});
		// 		It would result in the request (to your origin server):
		//	|	GET /proxy?url=http%3A%2F%2Fothersite.com%2Ffile HTTP/1.1
		
		dojox.io.xhrPlugins.register(
			"proxy",
			function(method,args){
				// this will match on URL

				// really can be used for anything, but plain XHR will take
				// precedent by order of loading 
				return true; 
			},
			function(method,args,hasBody){
				args.url = proxyUrl + encodeURIComponent(args.url);
				return plainXhr.call(dojo, method, args, hasBody);
			});
	};
	var csXhrSupport;
	dojox.io.xhrPlugins.addCrossSiteXhr = function(url, httpAdapter){
		//	summary:
		// 		Adds W3C Cross site XHR or XDomainRequest handling for the given URL prefix
		//
		// 	url: 
		//		Requests that start with this URL will be considered for using 
		// 		cross-site XHR.
		//
		// 	httpAdapter: This allows for adapting HTTP requests that could not otherwise be 
		// 		sent with XDR, so you can use a convention for headers and PUT/DELETE methods.
		//
		//	description:
		// 		This can be used for servers that support W3C cross-site XHR. In order for 
		// 		a server to allow a client to make cross-site XHR requests, 
		// 		it should respond with the header like:
		//	|	Access-Control: allow <*>
		//		see: http://www.w3.org/TR/access-control/
		if(csXhrSupport === undefined && window.XMLHttpRequest){
			// just run this once to see if we have cross-site support
			try{
				var xhr = new XMLHttpRequest();
				xhr.open("GET","http://fnadkfna.com",true);
				csXhrSupport = true;
			}catch(e){
				csXhrSupport = false;
			}
		}
		dojox.io.xhrPlugins.register(
			"cs-xhr",
			function(method,args){ 
				return (csXhrSupport || 
						(window.XDomainRequest && args.sync !== true && 
							(method == "GET" || method == "POST" || httpAdapter))) &&
					(args.url.substring(0,url.length) == url); 
			},
			csXhrSupport ? plainXhr : function(){
				var normalXhrObj = dojo._xhrObj;
				// we will just substitute this in temporarily so we can use XDomainRequest instead of XMLHttpRequest
				dojo._xhrObj = function(){
					
					var xdr = new XDomainRequest();
					xdr.readyState = 1;
					xdr.setRequestHeader = function(){}; // just absorb them, we can't set headers :/
					xdr.getResponseHeader = function(header){ // this is the only header we can access 
						return header == "Content-Type" ? xdr.contentType : null;
					}
					// adapt the xdr handlers to xhr
					function handler(status, readyState){
						return function(){							
							xdr.readyState = readyState;
							xdr.status = status;
						}
					}
					xdr.onload = handler(200, 4);
					xdr.onprogress = handler(200, 3);
					xdr.onerror = handler(404, 4); // an error, who knows what the real status is
					return xdr;
				};
				var dfd = (httpAdapter ? httpAdapter(plainXhr) : plainXhr).apply(dojo,arguments);
				dojo._xhrObj = normalXhrObj;
				return dfd; 
			}
		);
	};
	dojox.io.xhrPlugins.fullHttpAdapter = function(plainXhr,noRawBody){
		// summary:
		// 		Provides a HTTP adaption.
		// description:
		// 		The following convention is used:
		// 		method name -> ?http-method=PUT
		// 		Header -> http-Header-Name=header-value
		//		X-Header -> header_name=header-value
		//	example:
		//		dojox.io.xhrPlugins.addXdr("http://somesite.com", dojox.io.xhrPlugins.fullHttpAdapter);
		return function(method,args,hasBody){
			var content = {};
			var parameters = {};
			if(!(method == "GET" || method == "POST")){
				parameters["http-method"] = method;
				method = "POST";
				if(args.putData && noRawBody){
					content["http-content"] = args.putData;
					delete args.putData;
					hasBody = false;
				}
			}else if(method=="POST" && args.postData && noRawBody){
				content["http-content"] = args.postData;
				delete args.postData;
				hasBody = false;
			}
			for(var i in args.headers){
				var parameterName = i.match(/^X-/) ? i.substring(2).replace(/-/g,'_').toLowerCase() : ("http-" + i);
				parameters[parameterName] = args.headers[i];
			}
			args.query = dojo.objectToQuery(parameters);
			dojo._ioAddQueryToUrl(args);
			args.content = dojo.mixin(args.content || {},content);
			return plainXhr.call(dojo,method,args,hasBody);
		};
	};
})();




}
