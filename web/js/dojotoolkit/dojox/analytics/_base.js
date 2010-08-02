/*
	Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.analytics._base"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.analytics._base"] = true;
dojo.provide("dojox.analytics._base");

dojox.analytics = function(){
	// summary: TODOC
	//		where we store data until we're ready to send it off.
	//
	//the data queue;
	this._data = [];

	//id of messages for this session/page
	this._id = 1;

	//some default values
	this.sendInterval = dojo.config["sendInterval"] || 5000;
	this.inTransitRetry = dojo.config["inTransitRetry"] || 200;
	this.dataUrl = dojo.config["analyticsUrl"] || dojo.moduleUrl("dojox.analytics.logger", "dojoxAnalytics.php");
	this.sendMethod = dojo.config["sendMethod"] || "xhrPost";
	this.maxRequestSize = dojo.isIE ? 2000 : dojo.config["maxRequestSize"] || 4000;

	//while we can go ahead and being logging as soon as this constructor is completed
	//we're not going to schedule pushing data to the server until after the page
	//has completed loading
	dojo.addOnLoad(this, "schedulePusher");
	dojo.addOnUnload(this, "pushData", true);
};

dojo.extend(dojox.analytics, {
	schedulePusher: function(/* Int */interval){
		// summary: Schedule the data pushing routines to happen in interval ms
		setTimeout(dojo.hitch(this, "checkData"), interval || this.sendInterval); 
	},

	addData: function(dataType, data){
		// summary:
		//	add data to the queue. Will be pusshed to the server on the next
		//	data push

		if(arguments.length > 2){
			// FIXME: var c = dojo._toArray(arguments) ?
			var c = [];
			for(var i = 1; i < arguments.length; i++){
				c.push(arguments[i]);
			}
			data = c;
		}

		this._data.push({ plugin: dataType, data: data });
	},

	checkData: function(){
		// summary: TODOC?
		if(this._inTransit){
			this.schedulePusher(this.inTransitRetry);
			return;
		}
		
		if(this.pushData()){ return; }
		this.schedulePusher();
	},

	pushData: function(){
		// summary:
		//	pushes data to the server if any exists.  If a push is done, return
		//	the deferred after hooking up completion callbacks.  If there is no data
		//	to be pushed, return false;
		if(this._data.length){
			//clear the queue
			this._inTransit = this._data;
			this._data = [];
			var def;
			switch(this.sendMethod){
				case "script":
					def = dojo.io.script.get({
						url: this.getQueryPacket(),
						preventCache: 1,
						callbackParamName: "callback"
					});
					break;
				case "xhrPost":
				default:
					def = dojo.xhrPost({
						url:this.dataUrl,
						content:{
							id: this._id++,
							data: dojo.toJson(this._inTransit)
						}
					});
					break;
			}
			def.addCallback(this, "onPushComplete");
			return def;
		}
		return false;
	},

	getQueryPacket: function(){
		// summary: TODOC
		while(true){
			var content = {
				id: this._id++,
				data: dojo.toJson(this._inTransit)
			};
			
			//FIXME would like a much better way to get the query down to lenght
			var query = this.dataUrl + '?' + dojo.objectToQuery(content);
			if(query.length > this.maxRequestSize){
				this._data.unshift(this._inTransit.pop());
				this._split = 1;
			}else{
				return query;
			}
		}
	},

	onPushComplete: function(results){
		// summary:
		//	If our data push was successfully, remove the _inTransit data and schedule the next
		//	parser run.
		if(this._inTransit){
			delete this._inTransit;
		}

		if(this._data.length > 0){
			this.schedulePusher(this.inTransitRetry);
		}else{
			this.schedulePusher();
		}
	}
});

//create the analytics  singleton
dojox.analytics = new dojox.analytics();

}
