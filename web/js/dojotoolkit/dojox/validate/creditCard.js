/*
	Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.validate.creditCard"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.validate.creditCard"] = true;
dojo.provide("dojox.validate.creditCard");
/*=====

	dojox.validate.creditCard = {
		// summary: 
		//		Module provides validation functions for Credit Cards, using account number 
		//		rules in conjunction with the Luhn algorigthm, with a plugable card info database.
	};
	
=====*/
dojo.require("dojox.validate._base");

dojox.validate._cardInfo = {
	// summary: A dictionary list of credit card abbreviations 
	//
	// description: 
	//	
	//		A hash of valid CC abbreviations and regular expressions 
	//	
	//		mc: Mastercard
	//		ec: Eurocard
	//		vi: Visa
	//		ax: American Express
	//		dc: Diners Club
	//		bl: Carte Blanch
	//		di: Discover
	//		jcb: JCB
	//		er: Enroute
	//
	//	example:
	//		Define your own card, gift-card, whatever. Starts with 7,
	//		is 15 total length.
	//	| dojo.mixin(dojox.validate._cardInfo, {
	//	| 	"my":"7[0-9]{14}"
	//	| });	
	
	'mc':'5[1-5][0-9]{14}',
	'ec':'5[1-5][0-9]{14}',
	'vi':'4(?:[0-9]{12}|[0-9]{15})',
	'ax':'3[47][0-9]{13}', 
	'dc':'3(?:0[0-5][0-9]{11}|[68][0-9]{12})',
	'bl':'3(?:0[0-5][0-9]{11}|[68][0-9]{12})',
	'di':'6011[0-9]{12}',
	'jcb':'(?:3[0-9]{15}|(2131|1800)[0-9]{11})',
	'er':'2(?:014|149)[0-9]{11}'
}

dojox.validate.isValidCreditCard = function(value, ccType){
	// summary: Validate a credit card number by type with Luhn checking.
	//
	// description:
	//		Checks if a credit card type matches the # scheme in a passed value, and if 
	//		the Luhn checksum is accurate (unless its an Enroute card, in which case 
	//		the checkSum is skipped), returning a Boolean to check against. 
	//
	// value: String|Int
	//		A Value (credit card number) to validate
	//
	// ccType: String
	//		A credit-card abbreviation. 
	//
	// example:
	// |	if(dojox.validate.isValidCreditCard("12345", "mc")){ 
	// |		console.log('inconceivable'); 
	// |	}
	
	return ((ccType.toLowerCase() == 'er' || dojox.validate.isValidLuhn(value)) &&
			dojox.validate.isValidCreditCardNumber(value, ccType.toLowerCase())); // Boolean
}

dojox.validate.isValidCreditCardNumber = function(value, ccType){
	// summary: 
	//		Checks if value matches the pattern for that card or any card types if none is specified
	//
	// value: String|Int
	//		CC #, white spaces and dashes are ignored
	//
	// ccType: String?
	//		One of the abbreviation values in `dojox.validate._cardInfo` -- 
	//		if Omitted, function returns a `|` delimited string of matching card types, 
	//		or false if no matches found.

	value = String(value).replace(/[- ]/g,''); //ignore dashes and whitespaces

	var cardinfo = dojox.validate._cardInfo, results = [];
	if(ccType){
		var expr = '^' + cardinfo[ccType.toLowerCase()] + '$';
		return expr ? !!value.match(expr) : false; // boolean
	}

	for(var p in cardinfo){
		if(value.match('^' + cardinfo[p] + '$')){
			results.push(p);
		}
	}
	return results.length ? results.join('|') : false; // String | boolean
}

dojox.validate.isValidCvv = function(/* String|Int */value, /* String */ccType) {
	// summary:
	//  	Validate the security code (CCV) for a passed credit-card type.
	//
	// description:
	// 
	// value: 
	
	if(!dojo.isString(value)){
		value = String(value);
	}
	var format;
	switch (ccType.toLowerCase()){
		case 'mc':
		case 'ec':
		case 'vi':
		case 'di':
			format = '###';
			break;
		case 'ax':
			format = '####';
			break;
	}
	
	return !!format && value.length && dojox.validate.isNumberFormat(value, { format: format }); // Boolean
}

}
