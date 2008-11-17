/*
	Copyright (c) 2004-2008, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.date.HebrewDate"]){ //_hasResource checks added by build. Do not use _hasResource directly in your code.
dojo._hasResource["dojox.date.HebrewDate"] = true;
dojo.provide("dojox.date.HebrewDate");
dojo.experimental("dojox.date.HebrewDate");

dojo.declare("dojox.date.HebrewDate", null, {
	// summary: The component defines the Hebrew Calendar Object
	//
	// description:
	//	This module is similar to the Date() object provided by JavaScript
	//
	// example:
	// |	dojo.require("dojox.date.HebrewDate");
	// |		
	// |	var date = new dojox.date.HebrewDate();
	// |	document.writeln(date.getFullYear()+'\'+date.getMonth()+'\'+date.getDate());

	TISHRI: 0,   
	HESHVAN: 1,
	KISLEV: 2,
	TEVET: 3,
	SHEVAT: 4,
	ADAR_1: 5,
	ADAR: 6,
	NISAN: 7,
	IYAR: 8,
	SIVAN: 9,
	TAMUZ: 10,
	AV: 11,
	ELUL: 12,
		
	// Hebrew date calculations are performed in terms of days, hours, and
	// "parts" (or halakim), which are 1/1080 of an hour, or 3 1/3 seconds.
	_HOUR_PARTS: 1080,
	_DAY_PARTS: 24*1080,
   
	// An approximate value for the length of a lunar month.
	// It is used to calculate the approximate year and month of a given
	// absolute date.
	_MONTH_DAYS: 29,
	_MONTH_FRACT: 12*1080 + 793,
	_MONTH_PARTS: 29*24*1080 + 12*1080 + 793,
	    
	// The time of the new moon (in parts) on 1 Tishri, year 1 (the epoch)
	// counting from noon on the day before.  BAHARAD is an abbreviation of
	// Bet (Monday), Hey (5 hours from sunset), Resh-Daled (204).
	BAHARAD: 11*1080 + 204,

	// The Julian day of the Gregorian epoch, that is, January 1, 1 on the
	// Gregorian calendar.
	JAN_1_1_JULIAN_DAY: 1721426,

	/**
	* The lengths of the Hebrew months.  This is complicated, because there
	* are three different types of years, or six if you count leap years.
	* Due to the rules for postponing the start of the year to avoid having
	* certain holidays fall on the sabbath, the year can end up being three
	* different lengths, called "deficient", "normal", and "complete".
	*/

	_MONTH_LENGTH:  [
		// Deficient  Normal     Complete
		[   30,	    30,	    30	],		 //Tishri
		[   29,	    29,	    30	],		 //Heshvan
		[   29,	    30,	    30	],		 //Kislev
		[   29,	    29,	    29	],		 //Tevet
		[   30,	    30,	    30	],		 //Shevat
		[   30,	    30,	    30	],		 //Adar I (leap years only)
		[   29,	    29,	    29	],		 //Adar
		[   30,	    30,	    30	],		 //Nisan
		[   29,	    29,	    29	],		 //Iyar
		[   30,	    30,	    30	],		 //Sivan
		[   29,	    29,	    29	],		 //Tammuz
		[   30,	    30,	    30	],		 //Av
		[   29,	    29,	    29	]		 //Elul
	],

	/**
	* The cumulative # of days to the end of each month in a non-leap year
	* Although this can be calculated from the MONTH_LENGTH table,
	* keeping it around separately makes some calculations a lot faster
	*/
	_MONTH_START:  [
		// Deficient  Normal	Complete
		[    0,		0,		0  ],		// (placeholder)
		[   30,	    30,	    30  ],		// Tishri
		[   59,	    59,	    60  ],		// Heshvan
		[   88,	    89,	    90  ],		// Kislev
		[  117,	   118,	   119  ],		// Tevet
		[  147,	   148,	   149  ],		// Shevat
		[  147,	   148,	   149  ],		// (Adar I placeholder)
		[  176,	   177,	   178  ],		// Adar
		[  206,	   207,	   208  ],		// Nisan
		[  235,	   236,	   237  ],		// Iyar
		[  265,	   266,	   267  ],		// Sivan
		[  294,	   295,	   296  ],		// Tammuz
		[  324,	   325,	   326  ],		// Av
		[  353,	   354,	   355  ]		// Elul
	],

	/**
	* The cumulative # of days to the end of each month in a leap year
	*/
	LEAP_MONTH_START:  [
		// Deficient  Normal	Complete
		[    0,		0,		0  ],		// (placeholder)
		[   30,	    30,	    30  ],		// Tishri
		[   59,	    59,	    60  ],		// Heshvan
		[   88,	    89,	    90  ],		// Kislev
		[  117,	   118,	   119  ],		// Tevet
		[  147,	   148,	   149  ],		// Shevat
		[  177,	   178,	   179  ],		// Adar I
		[  206,	   207,	   208  ],		// Adar II
		[  236,	   237,	   238  ],		// Nisan
		[  265,	   266,	   267  ],		// Iyar
		[  295,	   296,	   297  ],		// Sivan
		[  324,	   325,	   326  ],		// Tammuz
		[  354,	   355,	   356  ],		// Av
		[  383,	   384,	   385  ]		// Elul
	],
	
	GREGORIAN_MONTH_COUNT:  [
		//len len2   st  st2
		[  31,  31,   0,   0 ], // Jan
		[  28,  29,  31,  31 ], // Feb
		[  31,  31,  59,  60 ], // Mar
		[  30,  30,  90,  91 ], // Apr
		[  31,  31, 120, 121 ], // May
		[  30,  30, 151, 152 ], // Jun
		[  31,  31, 181, 182 ], // Jul
		[  31,  31, 212, 213 ], // Aug
		[  30,  30, 243, 244 ], // Sep
		[  31,  31, 273, 274 ], // Oct
		[  30,  30, 304, 305 ], // Nov
		[  31,  31, 334, 335 ] // Dec
		// len  length of month
		// len2 length of month in a leap year
		// st   days in year before start of month
		// st2  days in year before month in leap year
	],

    _date: 0,
	_month: 0,
	_year: 0,
	_hours: 0,
	_minutes: 0,
	_seconds: 0,
	_milliseconds: 0,
	_day: 0,
	
	constructor: function(){
		// summary: This is the constructor
		// description:
		//	This fucntion initialize the date object values
		//
		// example:
		// |		var date1 = new dojox.date.HebrewDate();
		// |		
		// |		var date2 = new dojox.date.HebrewDate(date1);
		// |
		// |		var date3 = new dojox.date.HebrewDate(5768,2,12);
		var arg_no = arguments.length;
		if(arg_no==0){// use the current date value
			var date = new Date();
   			var result =  this._computeHebrewFields(date);
			this._date = result[2];
			this._month = result[1];
			this._year = result[0];
			this._hours = date.getHours();
			this._minutes = date.getMinutes();
			this._seconds = date.getSeconds();
			this._milliseconds = date.getMilliseconds();
			this._day = date.getDay();
		}else if(arg_no ==1){
			this._year = arguments[0].getFullYear();
			this._month =  arguments[0].getMonth();  
			this._date = arguments[0].getDate();
			this._hours = arguments[0].getHours();
			this._minutes = arguments[0].getMinutes();
			this._seconds = arguments[0].getSeconds();
			this._milliseconds = arguments[0].getMilliseconds(); 
		
		}else if(arg_no >=3){
			// YYYY MM DD arguments passed, month is from 0-12
			this._year = parseInt(arguments[0]);
			this._month = parseInt(arguments[1]);
			this._date = parseInt(arguments[2]);
			
			if(!this.isLeapYear(this._year)  &&  this._month>=5)
				{this._month++;}
			if(this._month >12 || (!this.isLeapYear(this._year) && this._month > 11)){
				console.warn("the month is incorrect , set 0");
				this._month = 0;			
			}
			this._hours = (arguments[3]!=null )? parseInt(arguments[3]):0;
			this._minutes = (arguments[4]!=null )? parseInt(arguments[4]):0;
			this._seconds = (arguments[5]!=null )? parseInt(arguments[5]):0;
			this._milliseconds = (arguments[6]!=null )? parseInt(arguments[6]):0;
		}
  
		var day = this._startOfYear(this._year);
		if(this._month != 0){
			if(this.isLeapYear(this._year)){
				day += this.LEAP_MONTH_START[this._month][this._yearType(this._year)];
			}else{
				day += this._MONTH_START[this._month][this._yearType(this._year)];
			}
		}
		day += (this._date - 1);
		this._day = ((day+1) % 7);
	},

	getDate: function(){
		// summary: This function returns the date value (1 - 30)
		//
		// example:
		// |		var date1 = new dojox.date.HebrewDate();
		// |
		// |		document.writeln(date1.getDate);
		return parseInt(this._date);
	},
		
	getMonth: function(){
		// summary: This function return the month value ( 0 - 11 )
		//
		// example:
		// |		var date1 = new dojox.date.HebrewDate();
		// |
		// |		document.writeln(date1.getMonth()+1);
		return parseInt(this._month);
	},


	getFullYear: function(){
		// summary: This function return the Year value 
		//
		// example:
		// |		var date1 = new dojox.date.HebrewDate();
		// |
		// |		document.writeln(date1.getFullYear());
		return parseInt(this._year);
	},
			
	getHours: function(){
 		//summary: returns the Hour value
		return this._hours;
	},
		
	getMinutes: function(){
		//summary: returns the Minuites value

		return this._minutes;
	},

	getSeconds: function(){
		//summary: returns the seconde value
		return this._seconds;
	},

	getMilliseconds: function(){
		//summary: returns the Milliseconds value

		return this._milliseconds;
	},

	setDate: function(/*number*/date){	
		// summary: This function sets the Date
		// example:
		// |		var date1 = new dojox.date.HebrewDate();
		// |		date1.setDate(2);
		date = parseInt(date);

		if(date>0){
			for(mdays = this.getDaysInHebrewMonth(this._month, this._year);
					date > mdays;
					date -= mdays,mdays = this.getDaysInHebrewMonth(this._month, this._year)){
				this._month ++;
				if(!this.isLeapYear(this._year)&&(this._month==5)) { this._month ++;}
				if(this._month >= 13){this._year++; this._month -= 13;}
			}
			
			this._date = date;
		}else{
			for(mdays = this.getDaysInHebrewMonth((this._month-1)>=0 ? (this._month-1) : 12 ,((this._month-1)>=0)? this._year : this._year-1);
					date<=0;
						mdays = this.getDaysInHebrewMonth((this._month-1)>=0 ? (this._month-1) : 12,((this._month-1)>=0)? this._year : this._year-1) ){
				this._month --;
				if(!this.isLeapYear(this._year) && this._month == 5){ this._month--; }
				if(this._month < 0){this._year--; this._month += 13;}

				date+=mdays;
			} 
			this._date = date;
		}

		var day = this._startOfYear(this._year);
		if(this._month != 0){
			if(this.isLeapYear(this._year)){
				day += this.LEAP_MONTH_START[this._month][this._yearType(this._year)];
			}else{
				day += this._MONTH_START[this._month][this._yearType(this._year)];
			}
		}
		day += (this._date - 1);
		this._day = ((day+1) % 7);
		return this;
	},

	setYear: function(/*number*/year){
		// summary: This function set Year
		//
		// example:
		// |		var date1 = new dojox.date.HebrewDate();
		// |		date1.setYear(5768);

		this._year = parseInt(year);
		if(!this.isLeapYear(this._year) && this._month==6){ 
			this._month--; 
		} 
		var day = this._startOfYear(this._year);
		if(this._month != 0){
			if(this.isLeapYear(this._year)){
				day += this.LEAP_MONTH_START[this._month][this._yearType(this._year)];
			}else{
				day += this._MONTH_START[this._month][this._yearType(this._year)];
			}
		}
		day += (this._date - 1);
		this._day = ((day+1) % 7);
		return this;
	},
			
	setMonth: function(/*number*/month){
		// summary: This function set Month
		//
		// example:
		// |		var date1 = new dojox.date.HebrewDate();
		// |		date1.setMonth(0); //first month
		var newMonth = parseInt(month);
					
		if(!this.isLeapYear(this._year) && newMonth > 5){newMonth ++;}
			
		if(newMonth>=0){
			while (newMonth >12){
				this._year++;
				newMonth -=13;
				if (!this.isLeapYear(this._year) && newMonth > 5) {newMonth ++;}	
			}
		}else{
			while (newMonth<0){
				this._year--;
				newMonth +=13;
				if (!this.isLeapYear(this._year) && newMonth <= 5) {newMonth --;}	
			}		
		}
		
		this._month = newMonth;

		var dnum = this.getDaysInHebrewMonth(this._month, this._year);
		if(dnum < this._date){
			this._date = dnum;
		} // if the date in this month more than number of the days in this month
		
		var day = this._startOfYear(this._year);
		if(this._month != 0){
			if(this.isLeapYear(this._year)){
				day += this.LEAP_MONTH_START[this._month][this._yearType(this._year)];
			}else{
				day += this._MONTH_START[this._month][this._yearType(this._year)];
			}
		}
	
		day += (this._date - 1);
		this._day = ((day+1) % 7);
		return this;
	},
			
	setHours: function(){
		//summary: set the Hours  0-23
		
		var hours_arg_no = arguments.length;
		var hours = 0;
		if(hours_arg_no >= 1){
			hours = parseInt(arguments[0]);
		}

		if(hours_arg_no >= 2){
			this._minutes = parseInt(arguments[1]);
		}

		if(hours_arg_no >= 3){
			this._seconds = parseInt(arguments[2]);
		}

		if(hours_arg_no == 4){
			this._milliseconds = parseInt(arguments[3]);
		}

		while(hours >= 24){
			this._date++;
			var mdays = this.getDaysInHebrewMonth(this._month, this._year);
			if(this._date > mdays)
			{
				this._month++;
				if(!this.isLeapYear(this._year)&&(this._month==5)){ this._month++; }
				if(this._month >= 13){this._year++; this._month -= 13;}
				this._date -= mdays;
			}
			hours -= 24;
		}
		this._hours = hours;
		var day = this._startOfYear(this._year);
		if(this._month != 0){
			if(this.isLeapYear(this._year)){
				day += this.LEAP_MONTH_START[this._month][this._yearType(this._year)];
			}else{
				day += this._MONTH_START[this._month][this._yearType(this._year)];
			}
		}
		day += (this._date - 1);
		this._day = ((day+1) % 7);
		return this;
	},

	setMinutes: function(/*number*/minutes){
		//summary: set the Minutes  frm 0-59
		while(minutes >= 60){
			this._hours++;
			if(this._hours >= 24){     
				this._date++;
				this._hours -= 24;
				var mdays = this.getDaysInHebrewMonth(this._month, this._year);
				if(this._date > mdays){
					this._month ++;
					if(!this.isLeapYear(this._year)&&(this._month==5)){ this._month++; }
					if(this._month >= 13){this._year++; this._month -= 13;}
					this._date -= mdays;
				}
			}
			minutes -= 60;
		}
		this._minutes = minutes;
		var day = this._startOfYear(this._year);
		if(this._month != 0){
			if(this.isLeapYear(this._year)){
				day += this.LEAP_MONTH_START[this._month][this._yearType(this._year)];
			}else{
				day += this._MONTH_START[this._month][this._yearType(this._year)];
			}
		}
		day += (this._date - 1);
		this._day = ((day+1) % 7);
		return this;
	},

	setSeconds: function(/*number*/seconds){
		//summary: set the Seconds  from 0-59
	
		while(seconds >= 60){
			this._minutes++;
			if(this._minutes >= 60){
				this._hours++;
				this._minutes -= 60;
				if(this._hours >= 24){         
					this._date++;
					this._hours -= 24;
					var mdays = this.getDaysInHebrewMonth(this._month, this._year);
					if(this._date > mdays){
						this._month++;
						if(!this.isLeapYear(this._year)&&(this._month==5)){ this._month++; }
						if(this._month >= 13){this._year++; this._month -= 13;}
							
						this._date -= mdays;
					}
				}
			}
			seconds -= 60;
		}
		this._seconds = seconds;
		var day = this._startOfYear(this._year);
		if(this._month != 0){
			if(this.isLeapYear(this._year)){
				day += this.LEAP_MONTH_START[this._month][this._yearType(this._year)];
			}else{
				day += this._MONTH_START[this._month][this._yearType(this._year)];
			}
		}
		day += (this._date - 1);
		this._day = ((day+1) % 7);
		return this;
	},

	setMilliseconds: function(/*number*/milliseconds){
	//summary: set the setMilliseconds
		while(milliseconds >= 1000){
			this.setSeconds++;
			if(this.setSeconds >= 60){
				this._minutes++;
				this._seconds -= 60;
				if(this._minutes >= 60){
					this._hours++;
					this._minutes -= 60;
					if(this._hours >= 24){         
						this._date++;
						this._hours -= 24;
						var mdays = this.getDaysInHebrewMonth(this._month, this._year);
						if(this._date > mdays)
						{
							this._month ++;
							if(!this.isLeapYear(this._year)&&(this._month==5))  this._month ++;
							if(this._month >= 13){this._year++; this._month -= 13;}
							this._date -= mdays;
						}
					}
				}
			}
			milliseconds -= 1000;
		}
		this._milliseconds = milliseconds;
		var day = this._startOfYear(this._year);
		if(this._month != 0){
			if(this.isLeapYear(this._year)){
				day += this.LEAP_MONTH_START[this._month][this._yearType(this._year)];
			}else{
				day += this._MONTH_START[this._month][this._yearType(this._year)];
			}
		}
		day += (this._date - 1);
		this._day = ((day+1) % 7);
		return this;
	},


	toString: function(){ 
		// summary: This returns a string representation of the date in "dd, MM, YYYY HH:MM:SS" format
		// | 
		// example:
		// |		var date1 = new dojox.date.HebrewDate();
		// |		document.writeln(date1.toString());

		return this._date + ", " + ((!this.isLeapYear(this._year) && this._month>5) ? this._month : (this._month+1)) + ", " + this._year + "  " + this._hours + ":" + this._minutes + ":" + this._seconds; // String
	},

	valueOf: function(){
		return this.toGregorian().valueOf();
	},

	// ported from the Java class com.ibm.icu.util.HebrewCalendar from ICU4J v3.6.1 at http://www.icu-project.org/
	getDaysInHebrewMonth: function(/*number*/month, /*number*/ year){
		// summary: returns the number of days in the month used
		switch(month){
			case this.HESHVAN:
			case this.KISLEV:
				// These two month lengths can vary
				return this._MONTH_LENGTH[month][this._yearType(year)];
			default:
				// The rest are a fixed length
				return this._MONTH_LENGTH[month][0];
		}	
	},

	// ported from the Java class com.ibm.icu.util.HebrewCalendar from ICU4J v3.6.1 at http://www.icu-project.org/
	_yearType: function(/*number*/year){
		var yearLength = this._handleGetYearLength(Number(year));
		if(yearLength > 380){
			yearLength -= 30;        // Subtract length of leap month.
		}

		switch(yearLength){
			case 353:
				return 0;
			case 354:
				return 1;
			case 355:
				return 2;
		}
		throw new Error("Illegal year length " + yearLength + " in year " + year);
	},

	// ported from the Java class com.ibm.icu.util.HebrewCalendar from ICU4J v3.6.1 at http://www.icu-project.org/
	_handleGetYearLength: function(/*number*/eyear){
		return this._startOfYear(eyear+1) - this._startOfYear(eyear);
	},

	// ported from the Java class com.ibm.icu.util.HebrewCalendar from ICU4J v3.6.1 at http://www.icu-project.org/
	_startOfYear: function(/*number*/year){
				            
		var months = Math.floor((235 * year - 234) / 19);           // # of months before year

		var frac = months * this._MONTH_FRACT + this.BAHARAD;     // Fractional part of day #
		var day  = months * 29 + Math.floor(frac / this._DAY_PARTS);        // Whole # part of calculation
		frac = frac % this._DAY_PARTS;                        // Time of day

		var wd = day % 7;                        // Day of week (0 == Monday)

		if(wd == 2 || wd == 4 || wd == 6){
			// If the 1st is on Sun, Wed, or Fri, postpone to the next day
			day += 1;
			wd = day % 7;
		}
		if(wd == 1 && frac > 15*this.HOUR_PARTS+204 && !this.isLeapYear(year) ){
			// If the new moon falls after 3:11:20am (15h204p from the previous noon)
			// on a Tuesday and it is not a leap year, postpone by 2 days.
			// This prevents 356-day years.
			day += 2;
		}
		else if(wd == 0 && frac > 21*this.HOUR_PARTS+589 && this.isLeapYear(year-1) ){
			// If the new moon falls after 9:32:43 1/3am (21h589p from yesterday noon)
			// on a Monday and *last* year was a leap year, postpone by 1 day.
			// Prevents 382-day years.
			day += 1;
		}            
				
		return day;
	},

	// ported from the Java class com.ibm.icu.util.HebrewCalendar from ICU4J v3.6.1 at http://www.icu-project.org/
	isLeapYear: function(/*number*/year){	
	//	summary:
	//		Determines if the year (argument) is a leap year
	//	description: The Leap year contains additional month adar sheni
	//	
		//return (year * 12 + 17) % 19 >= 12;
		var x = (year*12 + 17) % 19;
		return x >= ((x < 0) ? -7 : 12);
	},

	
	fromGregorian: function(/*Date*/gdate){
		// summary: This function returns the equivalent Hebrew Date value for the Gregorian Date
		// example:
		// |		var dateHebrew = new dojox.date.HebrewDate();
		// |		var dateGregorian = new Date(2008,10,12);
		// |		dateHebrew.fromGregorian(dateGregorian);
		var result = this._computeHebrewFields(gdate);
		this._year = result[0];
		this._month = result[1];
		this._date = result[2];
		this._hours = gdate.getHours();
		this._milliseconds = gdate.getMilliseconds();
		this._minutes = gdate.getMinutes();
		this._seconds = gdate.getSeconds();
		return this;
	},

	// ported from the Java class com.ibm.icu.util.HebrewCalendar.handleComputeFields from ICU4J v3.6.1 at http://www.icu-project.org/
	_computeHebrewFields: function(/*Date*/gdate){
		var julianDay = this._getJulianDayFromGregorianDate(gdate);
		var d = julianDay - 347997;
		var m = Math.floor((d * this._DAY_PARTS) / this._MONTH_PARTS);       // Months (approx)
		var year = Math.floor((19 * m + 234) / 235) + 1;  // Years (approx)
		var ys  = this._startOfYear(year);                 // 1st day of year
		var dayOfYear = (d - ys);
		// Because of the postponement rules, it's possible to guess wrong.  Fix it.
		while (dayOfYear < 1){
			year--;
			ys  = this._startOfYear(year);
			dayOfYear = (d - ys);
		}

		// Now figure out which month we're in, and the date within that month

		var typeofYear = this._yearType(year);
		var monthStart = this.isLeapYear(year) ? this.LEAP_MONTH_START : this._MONTH_START;
		var month = 0;
		while(dayOfYear > monthStart[month][typeofYear]){
				month++;
		}
		month--;
		var dayOfMonth = dayOfYear - monthStart[month][typeofYear];
		var result = new Array(3);
		result[0] = year;
		result[1] = month;
		result[2] = dayOfMonth;
		return result;
	},

	// ported from the Java class com.ibm.icu.util.Calendar.computeGregorianFields from ICU4J v3.6.1 at http://www.icu-project.org/
	toGregorian: function(){
		// summary: This returns the equevalent Grogorian date value in Date object
		// example:
		// |		var dateHebrew = new dojox.date.HebrewDate(5768,11,20);
		// |		var dateGregorian = dateHebrew.toGregorian();
		var hYear = this._year;
		var hMonth = this._month;
		var hDate = this._date;
		var day = this._startOfYear(hYear);
		if(hMonth != 0){
			if(this.isLeapYear(hYear)){
				day += this.LEAP_MONTH_START[hMonth][this._yearType(hYear)];
			} else{
				day += this._MONTH_START[hMonth][this._yearType(hYear)];
			}
		}

		var julianDay =  (hDate + day + 347997);
		// The Gregorian epoch day is zero for Monday January 1, year 1.
		var gregorianEpochDay = julianDay - this.JAN_1_1_JULIAN_DAY;
		// Here we convert from the day number to the multiple radix
		// representation.  We use 400-year, 100-year, and 4-year cycles.
		// For example, the 4-year cycle has 4 years + 1 leap day; giving
		// 1461 == 365*4 + 1 days.
		var rem = new Array(1);
		var n400 = this._floorDivide(gregorianEpochDay , 146097, rem); // 400-year cycle length

		var n100 = this._floorDivide(rem[0] , 36524, rem); // 100-year cycle length

		var n4 = this._floorDivide(rem[0] , 1461, rem); // 4-year cycle length

		var n1 = this._floorDivide(rem[0] , 365, rem);
		var year = 400*n400 + 100*n100 + 4*n4 + n1;
		var dayOfYear = rem[0]; // zero-based day of year
		if(n100 == 4 || n1 == 4){
			dayOfYear = 365; // Dec 31 at end of 4- or 400-yr cycle
		}else{
			++year;
		}

		var isLeap = (year%4 == 0) && // equiv. to (year%4 == 0)
				(year%100 != 0 || year%400 == 0);
		var correction = 0;
		var march1 = isLeap ? 60 : 59; // zero-based DOY for March 1
		if(dayOfYear >= march1){ correction = isLeap ? 1 : 2; }
		var month = Math.floor((12 * (dayOfYear + correction) + 6) / 367); // zero-based month
		var dayOfMonth = dayOfYear -
				this.GREGORIAN_MONTH_COUNT[month][isLeap?3:2] + 1; // one-based DOM

		return new Date(year, month, dayOfMonth, this._hours, this._minutes, this._seconds, this._milliseconds);
	},
	_floorDivide: function(numerator, denominator, remainder){
	
		if(numerator >= 0){
			remainder[0] = (numerator % denominator);
			return Math.floor(numerator / denominator);
		}
		var quotient = Math.floor(numerator / denominator);
		remainder[0] = numerator - (quotient * denominator);
		return quotient;
	},

	getDay: function(){
		// summary: This function return Week Day value ( 0 - 6 )
		//
		// example:
		// |		var date1 = new dojox.date.HebrewDate();
		// |
		// |		document.writeln(date1.getDay());

		var hYear = this._year;
		var hMonth = this._month;
		var hDate = this._date;
		var day = this._startOfYear(hYear);
		if(hMonth != 0){
			if(this.isLeapYear(hYear)){
				day += this.LEAP_MONTH_START[hMonth][this._yearType(hYear)];
			} else{
				day += this._MONTH_START[hMonth][this._yearType(hYear)];
			}
		}

		day += (hDate - 1);
		return ((day+1) % 7);
	},

	// ported from the Java class com.ibm.icu.util.Calendar.computeGregorianMonthStart from ICU4J v3.6.1 at http://www.icu-project.org/
	_getJulianDayFromGregorianDate: function(gdate){
		//summary: returns the Julian day of a Gregorian date

		var year = gdate.getFullYear();
		var month = gdate.getMonth();
		var d = gdate.getDate();
		var isLeap = (year%4 == 0) && ((year%100 != 0) || (year%400 == 0));
		var y = year - 1;
		// This computation is actually ... + (JAN_1_1_JULIAN_DAY - 3) + 2.
		// Add 2 because Gregorian calendar starts 2 days after Julian
		// calendar.
		var julianDay = 365*y + Math.floor(y/4) - Math.floor(y/100) +
			Math.floor(y/400) + this.JAN_1_1_JULIAN_DAY - 1;
		// At this point julianDay indicates the day BEFORE the first day
		// of January 1, <eyear> of the Gregorian calendar.
		if(month != 0){
			julianDay += this.GREGORIAN_MONTH_COUNT[month][isLeap?3:2];
		}
		
		julianDay += d;
		return julianDay;
	}     
});

dojox.date.HebrewDate.fromGregorian = function(/*Date*/gdate){
		// summary: This function returns the equivalent Hebrew Date value for the Gregorian Date
		// example:
		// |		var dateGregorian = new Date(2008,10,12);
		// |		var dateHebrew = dojox.date.HebrewDate.fromGregorian(dateGregorian);

		var dateHebrew = new dojox.date.HebrewDate();
		return dateHebrew.fromGregorian(gdate);
};		

	
// Utility methods to do arithmetic calculations with HebrewDates

dojox.date.HebrewDate.add = function(/*HebrewDate*/date, /*String*/interval, /*int*/amount){
	//	based on and similar to dojo.date.add
	//	summary:
	//		Add to a Date in intervals of different size, from milliseconds to years
	//	date: HebrewDate
	//		Date object to start with
	//	interval:
	//		A string representing the interval.  One of the following:
	//			"year", "month", "day", "hour", "minute", "second",
	//			"millisecond", "week", "weekday"
	//	amount:
	//		How much to add to the date.

	var newHebrDate = new dojox.date.HebrewDate(date);

	switch(interval){
		case "day":
			newHebrDate.setDate(date.getDate() + amount);
			break;
		case "weekday":
			var day = date.getDay();
			if (((day + amount) < 5) && ((day + amount) >0)) {
				 newHebrDate.setDate(date.getDate() + amount);
			}else{ 
				var adddays = 0; /*weekend */
				var remdays = 0;
				if (day == 5) {//friday
					day = 4;
					remdays = (amount > 0) ?  -1 : 1;
				}else if (day == 6){ //shabat
					day = 4;
					remdays = (amount > 0) ? -2 : 2;		
				}
				var add =  (amount > 0) ? (5 - day - 1) : ( 0-day);
				var amountdif = amount - add;
				var div=parseInt(amountdif /5);
				if ((amountdif %5) != 0){
					adddays =  (amount > 0)  ? 2 : -2;
				}
				adddays  =  adddays + div*7 + amountdif %5 + add;
				newHebrDate.setDate(date.getDate() + adddays +  remdays);
			}
			break;
		case "year":
			newHebrDate.setYear(date.getFullYear() + amount );
			break;
		case "week":
			amount *= 7;
			newHebrDate.setDate(date.getDate() + amount);
			break;
		case "month":
			var month = date.getMonth(); 
			newHebrDate.setMonth(date.getMonth() + amount );
			break;
		case "hour":
			newHebrDate.setHours(date.getHours() + amount );
			break;	
		case "minute":
			newHebrDate.setMinutes(date.getMinutes() + amount );
			break;	
		case "second":
			newHebrDate.setSeconds(date.getSeconds() + amount );
			break;	
		case "millisecond":
			newHebrDate.setMilliseconds(date.getMilliseconds() + amount );
			break;
	}

	return newHebrDate; // Date
}; 

dojox.date.HebrewDate.difference = function(/*HebrewDate*/date1, /*HebrewDate?*/date2, /*String?*/interval){
	//	based on and similar to dojo.date.difference
	//	summary:
	//        date1 - date2
	//	 date2 is HebrewDate object.  If not specified, the current HebrewDate is used.
	//	interval:
	//		A string representing the interval.  One of the following:
	//			"year", "month", "day", "hour", "minute", "second",
	//			"millisecond",  "week", "weekday"
	//		Defaults to "day".

	date2 = date2 || new dojox.date.HebrewDate();
	interval = interval || "day";
	var yearDiff = date1.getFullYear() - date2.getFullYear();
	var delta = 1; // Integer return value
	switch(interval){
		case "weekday":
			var days = Math.round(dojox.date.HebrewDate.difference(date1, date2, "day"));
			var weeks = parseInt(dojox.date.HebrewDate.difference(date1, date2, "week"));
			var mod = days % 7;

			// Even number of weeks
			if(mod == 0){
				days = weeks*5;
			}else{
				// Weeks plus spare change (< 7 days)
				var adj = 0;
				var aDay = date2.getDay();
				var bDay = date1.getDay();
	
				weeks = parseInt(days/7);
				mod = days % 7;
				// Mark the date advanced by the number of
				// round weeks (may be zero)
				var dtMark = new dojox.date.HebrewDate(date2);
				dtMark.setDate(dtMark.getDate()+(weeks*7));
				var dayMark = dtMark.getDay();
	
				// Spare change days -- 6 or less
				if(days > 0){
					switch(true){
						// Range starts on Fri
						case aDay == 5:
							adj = -1;
							break;
						// Range starts on Sat
						case aDay == 6:
							adj = 0;
							break;
						// Range ends on Fri
						case bDay == 5:
							adj = -1;
							break;
						// Range ends on Sat
						case bDay == 6:
							adj = -2;
							break;
						// Range contains weekend
						case (dayMark + mod) > 5:
							adj = -2;
					}
				}else if(days < 0){
					switch(true){
						// Range starts on Fri
						case aDay == 5:
							adj = 0;
							break;
						// Range starts on Sat
						case aDay == 6:
							adj = 1;
							break;
						// Range ends on Fri
						case bDay == 5:
							adj = 2;
							break;
						// Range ends on Sat
						case bDay == 6:
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
			var startdate =  (date1.toGregorian() > date2.toGregorian()) ? date1 : date2; // more
			var enddate = (date1.toGregorian() > date2.toGregorian()) ? date2 : date1;
			
			var month1 = startdate.getMonth();
			var month2 = enddate.getMonth();
			
			if (yearDiff == 0){
				delta = ( !date1.isLeapYear(date1.getFullYear())  && startdate.getMonth() > 5 && enddate.getMonth() <=5) ? (startdate.getMonth() - enddate.getMonth() - 1) :
						(startdate.getMonth() - enddate.getMonth() );
			}else{
				delta = (!enddate.isLeapYear(enddate.getFullYear()) &&  month2 < 6) ? (13-month2-1) : (13-month2);
				delta +=  (!startdate.isLeapYear(startdate.getFullYear()) &&  month1 > 5) ? (month1 -1): month1;
				var i = enddate.getFullYear()  + 1;
				var e = startdate.getFullYear();
				for (i;   i < e;  i++){
					delta += enddate.isLeapYear(i) ? 13 : 12; 
				}
			}
			if (date1.toGregorian() < date2.toGregorian()){
				delta = -delta;
			}
			break;
		case "week":
			// Truncate instead of rounding
			// Don't use Math.floor -- value may be negative
			delta = parseInt(dojox.date.HebrewDate.difference(date1, date2, "day")/7);
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
			delta *= date1.toGregorian().getTime()- date2.toGregorian().getTime();
	}

	// Round for fractional values and DST leaps
	return Math.round(delta); // Number (integer) 
};




}
