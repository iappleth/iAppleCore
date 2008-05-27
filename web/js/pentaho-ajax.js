// see http://developer.mozilla.org/en/docs/AJAX:Getting_Started for other values
var COMPLETE = 4;
// see http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html for other values
var STATUS_OK = 200;
var STATUS_UNAUTHORIZED = 401;
var STATUS_NOT_FOUND = 404;
/**
 * @param solution String name of the solution containing the action sequence definition being called
 * @param path String path to the action sequence definition being called
 * @param action String name of the action sequence definition being called
 * @param params Array containing the parameters for the query string 
 * @param func String, object, or function. It is optional. Refers to the function to call 
 * asynchronously when the client receives the server's response. If the parameter is:
 *   null or undefined:
 *     the request to the server is synchronous, and the response is returned 
 *     by this method.
 *   of type String or string:
 *     the name of the function to call
 *   of type function:
 *     the function object to call
 *   of type object, where the object has the properties obj and method:
 *     func.obj is the object to call the method func.method on,
 *     e.g. obj.method()
 * 
 * @return String containing the server's response if func is not null or undefined,
 * null if the call is asynchronous.
 * 
 * @throws Error when unable to create an XMLHttpRequest object
 */
function pentahoAction( solution, path, action, params, func ) {

	// execute an Action Sequence on the server
	var url = "/pentaho/ViewAction";
	
	// create the URL we need
	var query = "wrapper=false&solution="+solution+"&path="+path+"&action="+action;
	// add any parameters provided
	if( params ) {
		var idx;
		for( idx=0; idx<params.length; idx++ ) {
			query += "&" +escape( params[idx][0] ) + "=" + escape( params[idx][1] );
		}
	}

	//ZYLK HACK
	query += "&z_ajax_request=true"

	// submit this as a post
	return pentahoPost( url, query, func );

}    
/**
 * @param component String
 * @param params Array containing the parameters for the query string 
 * @param func String, object, or function. It is optional. Refers to the function to call when the client 
 * receives the server's response. If the parameter is:
 *   null or undefined:
 *     the request to the server is synchronous, and the response is returned 
 *     by this method.
 *   of type String or string:
 *     the name of the function to call
 *   of type function:
 *     the function object to call
 *   of type object, where the object has the properties obj and method:
 *     func.obj is the object to call the method func.method on,
 *     e.g. obj.method()
 * @param mimeType String optional, specifies the mime type of the response
 * 
 * @return String containing the server's response if func is not null or undefined,
 * null if the call is asynchronous.
 * 
 * @throws Error when unable to create an XMLHttpRequest object
 */
function pentahoService( component, params, func, mimeType ) {

	// execute a web service on the server
	// create the URL we need
	var url = "/pentaho/ServiceAction";
	var query = "ajax=true&";
	if( component ) {
		query += "component="+component+"&";
	}
	// add any parameters provided
	if( params ) {
		var idx;
		for( idx=0; idx<params.length; idx++ ) {
			query += "&" +escape( params[idx][0] ) + "=" + escape( params[idx][1] );
		}
	}
	
	// submit this as a post
	return pentahoPost( url, query, func, mimeType );
}

/**
 * @param url String url of the web service/servlet
 * @param query String containing the message to send to the server
 * @param func String, object, or function. It is optional. Refers to the function to call when the client 
 * receives the server's response. If the parameter is:
 *   null or undefined:
 *     the request to the server is synchronous, and the response is returned 
 *     by this method.
 *   of type String or string:
 *     the name of the function to call
 *   of type function:
 *     the function object to call
 *   of type object, where the object has the properties obj and method:
 *     func.obj is the object to call the method func.method on,
 *     e.g. obj.method()
 * @param mimeType String optional, specifies the mime type of the response
 * 
 * @return String containing the server's response if func is not null or undefined,
 * null if the call is asynchronous.
 * 
 * @throws Error when unable to create an XMLHttpRequest object
 */
function pentahoGet( url, query, func, mimeType ) {
	var async = undefined != func && null != func;

	// submit a 'get' request
    var http_request = null;
	var returnType = "text/xml";
	if( mimeType ) {
		returnType = mimeType;
	}

	// create an HTTP request object
    if (window.XMLHttpRequest) { // Mozilla, Safari, ...
        http_request = new XMLHttpRequest();
        if (http_request.overrideMimeType) {
            http_request.overrideMimeType(returnType);
        }
    } else if (window.ActiveXObject) { // IE
        try {
            http_request = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                http_request = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (e) 
            {
            	http_request = null;
            }
        }
    }

    if (!http_request) {
        throw new Error('Cannot create an XMLHTTP instance');
    }
    
    // set the callback function
	  if ( async )
	  {
	    http_request.onreadystatechange = function() { pentahoResponse(http_request, func); };
	  }
	
	// submit the request
    http_request.open('GET', url+"?"+query, async );
    http_request.send(null);
	if ( !async )
	{
		return getResponse( http_request );
	}
	else
	{
		return null;
	}
}

function getUnauthorizedMsg()
{
	return "<adhoc><unauthorized/></adhoc>";
}

function getNotFoundMsg()
{
	return "<adhoc><not-found/></adhoc>";
}

/**
 * @param url String url of the web service/servlet
 * @param query String containing the message to send to the server
 * @param func String, object, or function. It is optional. Refers to the function to call when the client 
 * receives the server's response. If the parameter is:
 *   null or undefined:
 *     the request to the server is synchronous, and the response is returned 
 *     by this method.
 *   of type String or string:
 *     the name of the function to call
 *   of type function:
 *     the function object to call
 *   of type object, where the object has the properties obj and method:
 *     func.obj is the object to call the method func.method on,
 *     e.g. obj.method()
 * @param mimeType String optional, specifies the mime type of the response
 * 
 * @return String containing the server's response if func is not null or undefined,
 * null if the call is asynchronous.
 * 
 * @throws Error when unable to create an XMLHttpRequest object
 */
function pentahoPost( url, query, func, mimeType ) {
	var async = undefined != func && null != func;
	
	var http_request = null;
	var returnType = "text/xml";
	if( mimeType ) {
		returnType = mimeType;
	}
  
	// create an HTTP request object
	if (window.XMLHttpRequest) { // Mozilla, Safari,...
		http_request = new XMLHttpRequest();
		if (http_request.overrideMimeType) {
			http_request.overrideMimeType(returnType);
		}
	} else if (window.ActiveXObject) { // IE
		try {
			http_request = new ActiveXObject("Msxml2.XMLHTTP");
		} catch (e) {
			try {
				http_request = new ActiveXObject("Microsoft.XMLHTTP");
			} catch (e) 
			{
				http_request = null;
			}
		}
	}
	if (!http_request) {
		throw new Error('Cannot create XMLHTTP instance');
	}
  
  // set the callback function
  if ( async )
  {
  	http_request.onreadystatechange = function() { pentahoResponse(http_request, func); };
  }

  // submit the request
  http_request.open('POST', url, async);
  http_request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http_request.setRequestHeader("Content-length", query.length);
  http_request.setRequestHeader("Connection", "close");
	http_request.send(query);
	if ( !async )
	{
		return getResponse( http_request );
	}
	else
	{
		return null;
	}
}

/**
 * NOTE: http://radio.javaranch.com/pascarello/2006/02/07/1139345471027.html discusses the necessity of the try/catch block
 * 
 * @param http_request instance of XMLHttpRequest object, actually object is platform dependent.
 * @param func String, object, or function. Required. Refers to the function to call when the client 
 * receives the server's response. If the parameter is:
 *   of type String or string:
 *     the name of the function to call
 *   of type function:
 *     the function object to call
 *   of type object, where the object has the properties obj and method:
 *     func.obj is the object to call the method func.method on,
 *     e.g. obj.method()
 */
function pentahoResponse(http_request, func) {
  
	// see if we got a good response back
	if (http_request.readyState == COMPLETE ) {
		try
		{
			var content = getResponse( http_request );
			
			// execute the callback function
			if ( typeof( func ) == "function" )
			{
				func( content );
			}
			else if ( typeof( func ) == "object" && undefined != func.obj )
			{
				func.method.call( func.obj, content );
			}
			else if ( typeof( func ) == "string" )
			{
				// must be a string
				eval( func + "( content );" );
			}
			else
			{
				//func must be null, which means caller wanted to run async, which means we should never get here
				throw new Error( "Invalid state in pentahoResponse, unrecognized callback function." );
			}
		}catch( e )
		{
			var msg = e.message;
			alert( "pentaho-ajax.js.pentahoResponse(): " + e );
			throw e;
		}
	}
}

function getResponse( http_request )
{
	switch ( http_request.status )
	{
		case STATUS_OK:
			return http_request.responseText;
			break;
		case STATUS_UNAUTHORIZED:
			return getUnauthorizedMsg();
			break;
		case STATUS_NOT_FOUND:
			return getNotFoundMsg();
			break;
		default:
			return null;
			break;
	}
}
