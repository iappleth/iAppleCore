/*
 * Isomorphic SmartClient
 * Version v10.0d_2014-02-11 (2014-02-11)
 * Copyright(c) 1998 and beyond Isomorphic Software, Inc. All rights reserved.
 * "SmartClient" is a trademark of Isomorphic Software, Inc.
 *
 * licensing@smartclient.com
 *
 * http://smartclient.com/license
 */

var isc=window.isc?window.isc:{};if(window.isc&&!window.isc.module_History){isc.module_History=1;isc._moduleStart=isc._History_start=(isc.timestamp?isc.timestamp():new Date().getTime());if(isc._moduleEnd&&(!isc.Log||(isc.Log&&isc.Log.logIsDebugEnabled('loadTime')))){isc._pTM={message:'History load/parse time: '+(isc._moduleStart-isc._moduleEnd)+'ms',category:'loadTime'};if(isc.Log&&isc.Log.logDebug)isc.Log.logDebug(isc._pTM.message,'loadTime');else if(isc._preLog)isc._preLog[isc._preLog.length]=isc._pTM;else isc._preLog=[isc._pTM]}isc.definingFramework=true;var isc=window.isc?window.isc:{};isc.$d=new Date().getTime();isc.version="v10.0d_2014-02-11/LGPL Deployment";isc.versionNumber="v10.0d_2014-02-11";isc.buildDate="2014-02-11";isc.expirationDate="";isc.licenseType="LGPL";isc.licenseCompany="Isomorphic Software";isc.licenseSerialNumber="ISC_LGPL_NIGHTLY";isc.licensingPage="http://smartclient.com/product/";isc.$1142="debugModules";isc.$1143="nonDebugModules";isc.checkForDebugAndNonDebugModules=function(){if(isc.checkForDebugAndNonDebugModules.$75z)return;var _1=isc['_'+this.$1142],_2=_1!=null&&_1.length>0,_3=isc['_'+this.$1143],_4=_3!=null&&_3.length>0;if(_2&&_4){isc.logWarn("Both Debug and non-Debug modules were loaded; the Debug versions of '"+_1.join("', '")+"' and the non-Debug versions of '"+_3.join("', '")+"' were loaded. Mixing Debug and non-Debug modules is not supported and may lead to JavaScript errors and/or unpredictable behavior. To fix, ensure that only modules in the modules/ folder or the modules-debug/ folder are loaded and clear the browser cache. If using Smart GWT, also clear the GWT unit cache and recompile.");isc.checkForDebugAndNonDebugModules.$75z=true}};isc.$41r={SCServer:{present:"false",name:"SmartClient Server",serverOnly:true,isPro:true},Drawing:{present:"true",name:"Drawing Module"},PluginBridges:{present:"true",name:"PluginBridges Module"},RichTextEditor:{present:"true",name:"RichTextEditor Module"},Calendar:{present:"true",name:"Calendar Module"},Analytics:{present:"false",name:"Analytics Module"},Charts:{present:"false",name:"Charts Module"},Tools:{present:"${includeTools}",name:"Dashboards and Tools Module"},NetworkPerformance:{present:"false",name:"Network Performance Module"},FileLoader:{present:"false",name:"Network Performance Module"},RealtimeMessaging:{present:"false",name:"RealtimeMessaging Module"},serverCriteria:{present:"false",name:"Server Advanced Filtering",serverOnly:true,isFeature:true},customSQL:{present:"false",name:"SQL Templating",serverOnly:true,isFeature:true},chaining:{present:"false",name:"Transaction Chaining",serverOnly:true,isFeature:true},batchDSGenerator:{present:"false",name:"Batch DS-Generator",serverOnly:true,isFeature:true},batchUploader:{present:"false",name:"Batch Uploader",serverOnly:true,isFeature:true},transactions:{present:"false",name:"Automatic Transaction Management",serverOnly:true,isFeature:true}};isc.canonicalizeModules=function(_1){if(!_1)return null;if(isc.isA.String(_1)){if(_1.indexOf(",")!=-1){_1=_1.split(",");var _2=/^\s+/,_3=/\s+$/;for(var i=0;i<_1.length;i++){_1[i]=_1[i].replace(_2,"").replace(_3,"")}}else _1=[_1]}
return _1};isc.hasOptionalModules=function(_1){if(!_1)return true;_1=isc.canonicalizeModules(_1);for(var i=0;i<_1.length;i++)if(!isc.hasOptionalModule(_1[i]))return false;return true};isc.getMissingModules=function(_1){var _2=[];_1=isc.canonicalizeModules(_1);for(var i=0;i<_1.length;i++){var _4=_1[i];if(!isc.hasOptionalModule(_4))_2.add(isc.$41r[_4])}
return _2};isc.hasOptionalModule=function(_1){var v=isc.$41r[_1];if(!v){if(isc.Log)isc.Log.logWarn("isc.hasOptionalModule - unknown module: "+_1);return false}
return v.present=="true"||v.present.charAt(0)=="$"};isc.getOptionalModule=function(_1){return isc.$41r[_1]};isc.$a=window.isc_useSimpleNames;if(isc.$a==null)isc.$a=true;if(window.OpenAjax){isc.$b=isc.versionNumber.replace(/[a-zA-Z_]+/,".0");OpenAjax.registerLibrary("SmartClient","http://smartclient.com/SmartClient",isc.$b,{namespacedMode:!isc.$a,iscVersion:isc.version,buildDate:isc.buildDate,licenseType:isc.licenseType,licenseCompany:isc.licenseCompany,licenseSerialNumber:isc.licenseSerialNumber});OpenAjax.registerGlobals("SmartClient",["isc"])}
isc.$e=window.isc_useLongDOMIDs;isc.$f="isc.";isc.addGlobal=function(_1,_2){if(_1.indexOf(isc.$f)==0)_1=_1.substring(4);isc[_1]=_2;if(isc.$a)window[_1]=_2}
isc.onLine=true;isc.isOffline=function(){return!isc.onLine};isc.goOffline=function(){isc.onLine=false};isc.goOnline=function(){isc.onLine=true};if(window.addEventListener){window.addEventListener("online",isc.goOnline,false);window.addEventListener("offline",isc.goOffline,false)}
isc.addGlobal("Browser",{isSupported:false});isc.Browser.isOpera=(navigator.appName=="Opera"||navigator.userAgent.indexOf("Opera")!=-1);isc.Browser.isNS=(navigator.appName=="Netscape"&&!isc.Browser.isOpera);isc.Browser.isIE=(navigator.appName=="Microsoft Internet Explorer"&&!isc.Browser.isOpera)||navigator.userAgent.indexOf("Trident/")!=-1;isc.Browser.isMSN=(isc.Browser.isIE&&navigator.userAgent.indexOf("MSN")!=-1);isc.Browser.isMoz=(navigator.userAgent.indexOf("Gecko")!=-1)&&(navigator.userAgent.indexOf("Safari")==-1)&&(navigator.userAgent.indexOf("AppleWebKit")==-1)&&!isc.Browser.isIE;isc.Browser.isCamino=(isc.Browser.isMoz&&navigator.userAgent.indexOf("Camino/")!=-1);isc.Browser.isFirefox=(isc.Browser.isMoz&&navigator.userAgent.indexOf("Firefox/")!=-1);isc.Browser.isAIR=(navigator.userAgent.indexOf("AdobeAIR")!=-1);isc.Browser.isWebKit=navigator.userAgent.indexOf("WebKit")!=-1;isc.Browser.isSafari=isc.Browser.isAIR||navigator.userAgent.indexOf("Safari")!=-1||navigator.userAgent.indexOf("AppleWebKit")!=-1;isc.Browser.isChrome=isc.Browser.isSafari&&(navigator.userAgent.indexOf("Chrome/")!=-1);if(!isc.Browser.isIE&&!isc.Browser.isOpera&&!isc.Browser.isMoz&&!isc.Browser.isAIR&&!isc.Browser.isWebkit&&!isc.Browser.isSafari)
{if(navigator.appVersion.indexOf("MSIE")!=-1){isc.Browser.isIE=true}}
if(navigator.userAgent.indexOf("Trident/")>=0&&navigator.userAgent.lastIndexOf("rv:")>=0)
{isc.Browser.minorVersion=parseFloat(navigator.userAgent.substring(navigator.userAgent.lastIndexOf("rv:")+"rv:".length))}else{isc.Browser.minorVersion=parseFloat(isc.Browser.isIE?navigator.appVersion.substring(navigator.appVersion.indexOf("MSIE")+5):navigator.appVersion)}
if(!isc.Browser.isIE)(function(){var _1,_2;if(navigator.appVersion){_1="Version/";_2=navigator.appVersion.indexOf(_1);if(_2>=0){isc.Browser.minorVersion=parseFloat(navigator.appVersion.substring(_2+_1.length));return}}
var _3=navigator.userAgent;_1="Chrome/";_2=_3.indexOf(_1);if(_2>=0){isc.Browser.minorVersion=parseFloat(_3.substring(_2+_1.length));return}
_1="Camino/";_2=_3.indexOf(_1);if(_2>=0){isc.Browser.minorVersion=parseFloat(_3.substring(_2+_1.length));return}
_1="Firefox/";_2=_3.indexOf(_1);if(_2>=0){isc.Browser.minorVersion=parseFloat(_3.substring(_2+_1.length));return}
if(_3.indexOf("Opera/")>=0){_1="Version/";_2=_3.indexOf(_1);if(_2>=0){isc.Browser.minorVersion=parseFloat(_3.substring(_2+_1.length));return}else{_1="Opera/";_2=_3.indexOf(_1);isc.Browser.minorVersion=parseFloat(_3.substring(_2+_1.length));return}}})();isc.Browser.version=parseInt(isc.Browser.minorVersion);isc.Browser.isIE6=isc.Browser.isIE&&isc.Browser.version<=6;if(isc.Browser.isCamino){isc.Browser.caminoVersion=navigator.userAgent.substring(navigator.userAgent.indexOf("Camino/")+7)}
if(isc.Browser.isFirefox){var userAgent=navigator.userAgent,firefoxVersion=userAgent.substring(userAgent.indexOf("Firefox/")+8),majorMinorVersion=firefoxVersion.replace(/([^.]+\.[^.]+)\..*/,"$1");isc.Browser.firefoxVersion=firefoxVersion;isc.Browser.firefoxMajorMinorNumber=parseFloat(majorMinorVersion)}
if(isc.Browser.isMoz){isc.Browser.$g=navigator.userAgent.indexOf("Gecko/")+6;isc.Browser.geckoVersion=parseInt(navigator.userAgent.substring(isc.Browser.$g,isc.Browser.$g+8));if(isc.Browser.isFirefox){if(isc.Browser.firefoxVersion.match(/^1\.0/))isc.Browser.geckoVersion=20050915;else if(isc.Browser.firefoxVersion.match(/^2\.0/))isc.Browser.geckoVersion=20071108}
if(isc.Browser.version>=17)isc.Browser.geckoVersion=20121121}
isc.Browser.isStrict=document.compatMode=="CSS1Compat";if(isc.Browser.isStrict&&isc.Browser.isMoz){isc.Browser.$51p=document.doctype.publicId;isc.Browser.$51q=document.doctype.systemId}
isc.Browser.isTransitional=/.*(Transitional|Frameset)/.test((document.all&&document.all[0]&&document.all[0].nodeValue)||(document.doctype&&document.doctype.publicId));isc.Browser.isIE7=isc.Browser.isIE&&isc.Browser.version==7;isc.Browser.isIE8=isc.Browser.isIE&&isc.Browser.version>=8&&document.documentMode==8;isc.Browser.isIE8Strict=isc.Browser.isIE&&(isc.Browser.isStrict&&document.documentMode==8)||document.documentMode>8;isc.Browser.isIE9=isc.Browser.isIE&&isc.Browser.version>=9&&document.documentMode>=9;isc.Browser.isIE10=isc.Browser.isIE&&isc.Browser.version>=10;isc.Browser.isIE11=isc.Browser.isIE&&isc.Browser.version>=11;isc.Browser.AIRVersion=(isc.Browser.isAIR?navigator.userAgent.substring(navigator.userAgent.indexOf("AdobeAir/")+9):null);if(isc.Browser.isSafari){if(isc.Browser.isAIR){isc.Browser.safariVersion=530}else{if(navigator.userAgent.indexOf("Safari/")!=-1){isc.Browser.rawSafariVersion=navigator.userAgent.substring(navigator.userAgent.indexOf("Safari/")+7)}else if(navigator.userAgent.indexOf("AppleWebKit/")!=-1){isc.Browser.rawSafariVersion=navigator.userAgent.substring(navigator.userAgent.indexOf("AppleWebKit/")+12)}else{isc.Browser.rawSafariVersion="530"}
isc.Browser.safariVersion=(function(){var _1=isc.Browser.rawSafariVersion,_2=_1.indexOf(".");if(_2==-1)return parseInt(_1);var _3=_1.substring(0,_2+1),_4;while(_2!=-1){_2+=1;_4=_1.indexOf(".",_2);_3+=_1.substring(_2,(_4==-1?_1.length:_4));_2=_4}
return parseFloat(_3)})()}}
isc.Browser.isWin=navigator.platform.toLowerCase().indexOf("win")>-1;isc.Browser.isWin2k=navigator.userAgent.match(/NT 5.01?/)!=null;isc.Browser.isMac=navigator.platform.toLowerCase().indexOf("mac")>-1;isc.Browser.isUnix=(!isc.Browser.isMac&&!isc.Browser.isWin);isc.Browser.isAndroid=navigator.userAgent.indexOf("Android")>-1;if(isc.Browser.isAndroid){var pos=navigator.userAgent.indexOf("Android");if(pos>=0){isc.Browser.androidMinorVersion=parseFloat(navigator.userAgent.substring(pos+"Android".length));if(window.isNaN(isc.Browser.androidMinorVersion))delete isc.Browser.androidMinorVersion}
isc.Browser.isAndroidWebView=navigator.userAgent.indexOf("Version/")>=0}
isc.Browser.isRIM=isc.Browser.isBlackBerry=navigator.userAgent.indexOf("BlackBerry")>-1||navigator.userAgent.indexOf("PlayBook")>-1;isc.Browser.isMobileFirefox=isc.Browser.isFirefox&&(navigator.userAgent.indexOf("Mobile")>-1||navigator.userAgent.indexOf("Tablet")>-1);isc.Browser.isMobileWebkit=(isc.Browser.isSafari&&navigator.userAgent.indexOf(" Mobile/")>-1||isc.Browser.isAndroid||isc.Browser.isBlackBerry)&&!isc.Browser.isFirefox;isc.Browser.isMobile=(isc.Browser.isMobileFirefox||isc.Browser.isMobileWebkit);isc.Browser.isTouch=(isc.Browser.isMobileFirefox||isc.Browser.isMobileWebkit);isc.Browser.isIPhone=(isc.Browser.isMobileWebkit&&(navigator.userAgent.indexOf("iPhone")>-1||navigator.userAgent.indexOf("iPad")>-1));if(isc.Browser.isIPhone){var match=navigator.userAgent.match(/CPU\s+(?:iPhone\s+)?OS\s*([0-9_]+)/i);if(match!=null){isc.Browser.iOSMinorVersion=window.parseFloat(match[1].replace('_','.'))}
isc.Browser.isUIWebView=navigator.userAgent.indexOf("Safari")<0;isc.Browser.isMobileSafari=!isc.Browser.isUIWebView&&navigator.userAgent.indexOf("CriOS/")<0}
isc.Browser.isIPad=(isc.Browser.isIPhone&&navigator.userAgent.indexOf("iPad")>-1);if(isc.Browser.isIPad&&isc.Browser.isMobileSafari&&isc.Browser.iOSMinorVersion==7.0){var iOS7IPadStyleSheetID="isc_iOS7IPadStyleSheet";if(document.getElementById(iOS7IPadStyleSheetID)==null){var styleElement=document.createElement("style");styleElement.id=iOS7IPadStyleSheetID;document.head.appendChild(styleElement);var s=styleElement.sheet;s.insertRule("@media (orientation:landscape) {body {position: fixed;top: 0px;margin: 0px;height: 672px;}}",0)}}
if(window.isc_isTablet!=null){isc.Browser.isTablet=!!window.isc_isTablet}else{isc.Browser.isTablet=isc.Browser.isIPad||(isc.Browser.isRIM&&navigator.userAgent.indexOf("Tablet")>-1)||(isc.Browser.isAndroid&&navigator.userAgent.indexOf("Mobile")==-1)}
isc.Browser.isHandset=(isc.Browser.isTouch&&!isc.Browser.isTablet);isc.Browser.isBorderBox=(isc.Browser.isIE&&!isc.Browser.isStrict);isc.Browser.lineFeed=(isc.Browser.isWin?"\r\n":"\r");isc.Browser.$h=false;isc.Browser.isDOM=(isc.Browser.isMoz||isc.Browser.isOpera||isc.Browser.isSafari||(isc.Browser.isIE&&isc.Browser.version>=5));isc.Browser.isSupported=((isc.Browser.isIE&&isc.Browser.minorVersion>=5.5&&isc.Browser.isWin)||isc.Browser.isMoz||isc.Browser.isOpera||isc.Browser.isSafari||isc.Browser.isAIR);isc.Browser.nativeMouseMoveOnCanvasScroll=!isc.Browser.isTouch&&(isc.Browser.isSafari||isc.Browser.isChrome);isc.Browser.seleniumPresent=(function(){var _1=location.href.match(/[?&](?:sc_selenium)=([^&#]*)/);return _1&&_1.length>1&&"true"==_1[1]})();isc.Browser.SHOWCASE="showcase";isc.Browser.RUNNER="runner";isc.Browser.autotest=(function(){var _1=location.href.match(/[?&](?:autotest)=([^&#]*)/);return _1&&_1.length>1?_1[1]:null})();isc.Browser.allowsXSXHR=((isc.Browser.isFirefox&&isc.Browser.firefoxMajorMinorNumber>=3.5)||(isc.Browser.isChrome)||(isc.Browser.isSafari&&isc.Browser.safariVersion>=531));var isc_useGradientsPreIE9=window.isc_useGradientsPreIE9;isc.Browser.useCSSFilters=!isc.Browser.isIE||isc.Browser.isIE9||isc_useGradientsPreIE9!=false;var isc_css3Mode=window.isc_css3Mode;if(isc_css3Mode=="on"){isc.Browser.useCSS3=true}else if(isc_css3Mode=="off"){isc.Browser.useCSS3=false}else if(isc_css3Mode=="supported"||isc_css3Mode=="partialSupport"||isc_css3Mode===undefined)
{isc.Browser.useCSS3=isc.Browser.isWebKit||isc.Browser.isFirefox||(isc.Browser.isIE&&(isc.Browser.isIE9||isc.Browser.version>=10))}else{isc.Browser.useCSS3=false}
var isc_spriting=window.isc_spriting;if(isc_spriting=="off"){isc.Browser.useSpriting=false}else{isc.Browser.useSpriting=(!isc.Browser.isIE||isc.Browser.version>=7)}
isc.Browser.useInsertAdjacentHTML=!!document.documentElement.insertAdjacentHTML;isc.Browser.hasNativeGetRect=(!isc.Browser.isIE&&(!isc.Browser.isSafari||!isc.Browser.isMac||isc.Browser.version>=6)&&!!document.createRange&&!!(document.createRange().getBoundingClientRect));isc.Browser.useClipDiv=(isc.Browser.isMoz||isc.Browser.isSafari||isc.Browser.isOpera);isc.Browser.$113k=!(isc.Browser.isIE&&isc.Browser.version<10&&!isc.Browser.isIE9);isc.Browser.useCreateContextualFragment=!!document.createRange&&!!document.createRange().createContextualFragment;isc.Browser.hasTextOverflowEllipsis=(!isc.Browser.isMoz||isc.Browser.version>=7)&&(!isc.Browser.isOpera||isc.Browser.version>=9);isc.Browser.$114w=(!isc.Browser.isOpera||isc.Browser.version>=11?"text-overflow":"-o-text-overflow");isc.Browser.$117b=!isc.Browser.isSafari||isc.Browser.version>=4;isc.Browser.hasNativeDrag=!isc.Browser.isTouch&&"draggable"in document.documentElement&&!isc.Browser.isIE;isc.Browser.$120h=!!(window.getSelection&&document.createRange&&window.Range);isc.Browser.$124v="backgroundSize"in document.documentElement.style;if(isc.addProperties==null){isc.addGlobal("addProperties",function(_1,_2){for(var _3 in _2)
_1[_3]=_2[_3];return _1})}
isc.addGlobal("evalSA",function(_1){if(isc.eval)isc.eval(_1);else eval(_1)});isc.addGlobal("defineStandaloneClass",function(_1,_2){if(isc[_1])return;isc.addGlobal(_1,_2);isc.addProperties(_2,{$i:_1,fireSimpleCallback:function(_3){_3.method.apply(_3.target?_3.target:window,_3.args?_3.args:[])},logMessage:function(_3,_4,_5){if(isc.Log){isc.Log.logMessage(_3,_4,_5);return}
if(!isc.$j)isc.$j=[];isc.$j[isc.$j.length]={priority:_3,message:_4,category:_5,timestamp:new Date()}},logWarn:function(_3){this.logMessage(3,_3,this.$i)},logInfo:function(_3){this.logMessage(4,_3,this.$i)},logDebug:function(_3){this.logMessage(5,_3,this.$i)},isAString:function(_3){if(_3==null)return false;if(_3.constructor&&_3.constructor.$k!=null){return _3.constructor.$k==4}
return typeof _3=="string"}});_2.isAn=_2.isA;return _2});isc.defineStandaloneClass("SA_Page",{$l:false,$m:[],isLoaded:function(){return this.$l},onLoad:function(_1,_2,_3){this.$m.push({method:_1,target:_2,args:_3});if(!this.$n){this.$n=true;if((isc.Browser.isIE&&isc.Browser.version<11)||isc.Browser.isOpera){window.attachEvent("onload",function(){isc.SA_Page.$o()})}else{window.addEventListener("load",function(){isc.SA_Page.$o()},true)}}},$o:function(){if(!window.isc||this.$l)return;this.$l=true;for(var i=0;i<this.$m.length;i++){var _2=this.$m[i];this.fireSimpleCallback(_2)}
delete this.$m}});isc.SA_Page.onLoad(function(){this.$l=true},isc.SA_Page);isc.defineStandaloneClass("History",{registerCallback:function(_1,_2){this.$p=_1;this.$72o=_2},getCurrentHistoryId:function(){var _1=this.$r(location.href);if(_1=="$69i")return null;return _1},getHistoryData:function(_1){return this.historyState?this.historyState.data[_1]:null},setHistoryTitle:function(_1){this.historyTitle=_1},addHistoryEntry:function(_1,_2,_3){this.logDebug("addHistoryEntry: id="+_1+" data="+isc.echoAll(_3));if(_1==null)_1="";if(isc.Browser.isSafari&&isc.Browser.safariVersion<500){return}
if(!isc.SA_Page.isLoaded()){this.logWarn("You must wait until the page has loaded before calling isc.History.addHistoryEntry()");return}
var _4=this.$r(location.href);var _5;if(_3===_5)_3=null;if(_4==_1){this.historyState.data[_1]=_3;this.$s();return}
while(this.historyState.stack.length){var _6=this.historyState.stack.pop();if(_6==_4){this.historyState.stack.push(_6);break}
delete this.historyState.data[_6]}
this.historyState.stack.add(_1);this.historyState.data[_1]=_3;this.logDebug("historyState[id]: "+isc.echoAll(this.historyState.data[_1]));this.$s();if(isc.Browser.isIE){if(_1!=null&&document.getElementById(_1)!=null){this.logWarn("Warning - attempt to add synthetic history entry with id that conflicts with an existing DOM element node ID - this is known to break in IE")}
if(_4==null){var _7=location.href;var _8=document.getElementsByTagName("title");if(_8.length)_7=_8[0].innerHTML;this.$t("$69i",_7)}
this.$t(_1,_2)}else{location.href=this.$u(location.href,_1);this.$ab=_1}
this.$v=location.href},$t:function(_1,_2){this.$w=true;var _3=!this.isAString(_1)?_1:_1.replace(/\\/g,"\\\\").replace(/\"/g,"\\\"").replace(/\t/g,"\\t").replace(/\r/g,"\\r").replace(/\n/g,"\\n");var _4="<HTML><HEAD><TITLE>"+(_2!=null?_2:this.historyTitle!=null?this.historyTitle:_1)+"</TITLE></HEAD><BODY><SCRIPT>var pwin = window.parent;if (pwin && pwin.isc)pwin.isc.History.historyCallback(window,\""+_3+"\");</SCRIPT></BODY></HTML>";var _5=this.$x.contentWindow;_5.document.open();_5.document.write(_4);_5.document.close()},haveHistoryState:function(_1){if(isc.Browser.isIE&&!isc.SA_Page.isLoaded()){this.logWarn("haveHistoryState() called before pageLoad - this always returns false in IE because state information is not available before pageLoad")}
var _2;return this.historyState&&this.historyState.data[_1]!==_2},$y:function(){return window.isomorphicDir?window.isomorphicDir:"../isomorphic/"},$z:function(){this.logInfo("History initializing");if(this.$0)return;this.$0=true;if(isc.Browser.isSafari&&isc.Browser.safariVersion<500)return;var _1="<form style='position:absolute;top:-1000px' id='isc_historyForm'><textarea id='isc_historyField' style='display:none'></textarea></form>";document.write(_1);if(isc.Browser.isIE){var _2="<iframe id='isc_historyFrame' src='"+this.getBlankFrameURL()+"' style='position:absolute;visibility:hidden;top:-1000px'></iframe>";document.write(_2);this.$x=document.getElementById('isc_historyFrame');document.write("<span id='isc_history_buffer_marker' style='display:none'></span>")}
if(isc.Browser.isIE){isc.SA_Page.onLoad(function(){this.$1()},this)}else if(isc.Browser.isMoz||isc.Browser.isOpera||(isc.Browser.isSafari&&isc.Browser.safariVersion>=500)){this.$1()}},getBlankFrameURL:function(){if(isc.Page)return isc.Page.getBlankFrameURL();if(isc.Browser.isIE&&("https:"==window.location.protocol||document.domain!=location.hostname))
{var _1,_2=window.isomorphicDir;if(_2&&(_2.indexOf("/")==0||_2.indexOf("http")==0))
{_1=_2}else{_1=window.location.href;if(_1.charAt(_1.length-1)!="/"){_1=_1.substring(0,_1.lastIndexOf("/")+1)}
_1+=(_2==null?"../isomorphic/":_2)}
_1+="system/helpers/empty.html";return _1}
return"about:blank"},$2:function(){var _1=document.getElementById("isc_historyField");return _1?_1.value:null},$3:function(_1){var _2=document.getElementById("isc_historyField");if(_2)_2.value=_1},$1:function(){var _1=this.$2();if(_1){_1=new Function("return ("+_1+")")()}
if(!_1)_1={stack:[],data:{}};this.historyState=_1;this.logInfo("History init complete");this.$v=location.href;this.$4=window.setInterval("isc.History.$5()",this.$6);if(isc.Browser.isIE||isc.Browser.isMoz||isc.Browser.isOpera||(isc.Browser.isSafari&&isc.Browser.safariVersion>=500))
{isc.SA_Page.onLoad(this.$q,this)}},$q:function(){if(this.$7)return;if(this.$p&&isc.SA_Page.isLoaded()){this.$7=true;var _1=this.$r(location.href);this.$8(_1)}},$u:function(_1,_2){var _3=_1.match(/([^#]*).*/);return _3[1]+"#"+encodeURI(_2)},$r:function(_1){var _2=location.href.match(/([^#]*)#(.*)/);return _2?decodeURI(_2[2]):null},$6:100,$s:function(){if(isc.Comm){this.$3(isc.Comm.serialize(this.historyState))}},$5:function(){if(location.href!=this.$v){var _1=this.$r(location.href);this.$8(_1)}
this.$v=location.href},historyCallback:function(_1,_2){if(_2=="$69i")_2="";var _3=this.$u(location.href,_2);if(isc.SA_Page.isLoaded()){location.href=_3;this.$v=_3}else{isc.SA_Page.onLoad(function(){location.href=this.$u(location.href,_2);this.$v=_3},this)}
if(this.$w){this.$w=false;return}
if(isc.SA_Page.isLoaded()){this.$8(_2)}else{isc.SA_Page.onLoad(function(){this.$8(_2)},this)}},$8:function(_1){if(this.$ab==_1){if(this.$80a)return}
this.$80a=true;if(!this.$p){this.logWarn("ready to fire history callback, but no callback registered.Please call isc.History.registerCallback() before pageLoad. If you can't register your callback before pageLoad, you can call isc.History.getCurrentHistoryId() to get the ID when you're ready.");return}
if(_1=="$69i")_1=null;var _2=this.$p;var _3;if(!this.haveHistoryState(_1)){if(this.$72o){this.logWarn("User navigated to URL associated with synthetic history ID:"+_1+". This ID is not associated with any synthetic history entry generated via History.addHistoryEntry(). Not firing registered historyCallback as callback was registered with parameter requiring a data object.  This can commonly occur when the user navigates to a stored history entry via a bookmarked URL.");return}}else{_3=this.historyState.data[_1]}
this.$ab=_1;this.logDebug("history callback: "+_1);if(isc.Class&&this.isAString(_2)){isc.Class.fireCallback(_2,["id","data"],[_1,_3])}else{_2=isc.addProperties({},_2);_2.args=[_1,_3];this.fireSimpleCallback(_2)}}});isc.History.$z();isc._nonDebugModules=(isc._nonDebugModules!=null?isc._nonDebugModules:[]);isc._nonDebugModules.push('History');isc.checkForDebugAndNonDebugModules();isc._moduleEnd=isc._History_end=(isc.timestamp?isc.timestamp():new Date().getTime());if(isc.Log&&isc.Log.logIsInfoEnabled('loadTime'))isc.Log.logInfo('History module init time: '+(isc._moduleEnd-isc._moduleStart)+'ms','loadTime');delete isc.definingFramework;if(isc.Page)isc.Page.handleEvent(null,"moduleLoaded",{moduleName:'History',loadTime:(isc._moduleEnd-isc._moduleStart)});}else{if(window.isc&&isc.Log&&isc.Log.logWarn)isc.Log.logWarn("Duplicate load of module 'History'.");}
/*
 * Isomorphic SmartClient
 * Version v10.0d_2014-02-11 (2014-02-11)
 * Copyright(c) 1998 and beyond Isomorphic Software, Inc. All rights reserved.
 * "SmartClient" is a trademark of Isomorphic Software, Inc.
 *
 * licensing@smartclient.com
 *
 * http://smartclient.com/license
 */

