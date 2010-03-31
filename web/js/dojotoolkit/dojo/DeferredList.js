/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojo.DeferredList"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojo.DeferredList"] = true;
dojo.provide("dojo.DeferredList");
dojo.DeferredList = function(/*Array*/ list, /*Boolean?*/ fireOnOneCallback, /*Boolean?*/ fireOnOneErrback, /*Boolean?*/ consumeErrors, /*Function?*/ canceller){
	// summary:
	//		Provides event handling for a group of Deferred objects.
	// description:
	//		DeferredList takes an array of existing deferreds and returns a new deferred of its own
	//		this new deferred will typically have its callback fired when all of the deferreds in
	//		the given list have fired their own deferreds.  The parameters `fireOnOneCallback` and
	//		fireOnOneErrback, will fire before all the deferreds as appropriate
	//
	//	list:
	//		The list of deferreds to be synchronizied with this DeferredList
	//	fireOnOneCallback:
	//		Will cause the DeferredLists callback to be fired as soon as any
	//		of the deferreds in its list have been fired instead of waiting until
	//		the entire list has finished
	//	fireonOneErrback:
	//		Will cause the errback to fire upon any of the deferreds errback
	//	canceller:
	//		A deferred canceller function, see dojo.Deferred
	var resultList = [];
	var resultDeferred = dojo.Deferred();
	if(list.length === 0 && !fireOnOneCallback){
		resultDeferred.resolve([0, []]);
	}
	var finished = 0;
	dojo.forEach(list, function(item, i){
		item.then(function(result){
			if(fireOnOneCallback){
				resultDeferred.resolve([i, result]);
			}else{
				addResult(true, result);
			}
		},function(error){
			if(fireOnOneErrback){
				resultDeferred.reject(error);
			}else{
				addResult(false, error);
			}
			if(consumeErrors){
				return null;
			}
			throw error;
		});
		function addResult(succeeded, result){
			resultList[i] = [succeeded, result];
			finished++;
			if(finished === list.length){
				resultDeferred.resolve(resultList);
			}
			
		}
	});
	return resultDeferred;
};

}
