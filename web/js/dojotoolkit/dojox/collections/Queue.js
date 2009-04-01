/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.collections.Queue"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.collections.Queue"] = true;
dojo.provide("dojox.collections.Queue");
dojo.require("dojox.collections._base");

dojox.collections.Queue=function(/* array? */arr){
	//	summary
	//	return an object of type dojox.collections.Queue
	var q=[];
	if (arr){
		q=q.concat(arr);
	}
	this.count=q.length;
	this.clear=function(){
		//	summary
		//	clears the internal collection
		q=[];
		this.count=q.length;
	};
	this.clone=function(){
		//	summary
		//	creates a new Queue based on this one
		return new dojox.collections.Queue(q);	//	dojox.collections.Queue
	};
	this.contains=function(/* object */ o){
		//	summary
		//	Check to see if the passed object is an element in this queue
		for(var i=0; i<q.length; i++){
			if (q[i]==o){
				return true;	//	bool
			}
		}
		return false;	//	bool
	};
	this.copyTo=function(/* array */ arr, /* int */ i){
		//	summary
		//	Copy the contents of this queue into the passed array at index i.
		arr.splice(i,0,q);
	};
	this.dequeue=function(){
		//	summary
		//	shift the first element off the queue and return it
		var r=q.shift();
		this.count=q.length;
		return r;	//	object
	};
	this.enqueue=function(/* object */ o){
		//	summary
		//	put the passed object at the end of the queue
		this.count=q.push(o);
	};
	this.forEach=function(/* function */ fn, /* object? */ scope){
		//	summary
		//	functional iterator, following the mozilla spec.
		dojo.forEach(q, fn, scope);
	};
	this.getIterator=function(){
		//	summary
		//	get an Iterator based on this queue.
		return new dojox.collections.Iterator(q);	//	dojox.collections.Iterator
	};
	this.peek=function(){
		//	summary
		//	get the next element in the queue without altering the queue.
		return q[0];
	};
	this.toArray=function(){
		//	summary
		//	return an array based on the internal array of the queue.
		return [].concat(q);
	};
};

}
