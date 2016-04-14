sap.ui.define([
 "sap/ui/base/ManagedObject",
 "sap/ui/model/json/JSONModel"
 ], function (Object,JSONModel) {
	"use strict";
    var instance;
	var Object = Object.extend("sb.data.helper", {
		metadata : {
		},
        init:function(){},
        getDistance:function(Target,Source,aResults){
            var Source = this.getShortPostcode(Source);
            var Target = this.getShortPostcode(Target);
            if(Target === Source){
                return {
                    Distance:0,
                    Time:0
                }
            }
           //var oResult = aResults[Postcode];
            for(var i in aResults){
                var oResult = aResults[i]
                if(oResult.From === Source && oResult.To === Target){
                    return {
                        Distance:Number(oResult.Distance),
                        Time:Number(oResult.TravelTime)
                    }
                }
            }
            return {
                Distance:"N/A",
                Time:"N/A"
            }
        },
        getShortPostcode:function(Postcode){
            if(!Postcode) return "";
            var aParts = Postcode.split(" ");
            if(aParts.length > 1){
                 return aParts[0] + aParts[1].substring(0,1);
            }else{
                 return aParts[0];
            }
        },
        removeDuplicates:function(aArray){
            var seen = {};
            return aArray.filter(function(item) {
                return seen.hasOwnProperty(item) ? false : (seen[item] = true);
            });
        },
        sortArray:function(Array,sColumn,bAscending){
            var that=this;
            if(bAscending){
                return Array.sort(function(a,b){
                    var ValueA = that._getValue(a,sColumn);
                    var ValueB = that._getValue(b,sColumn);
                    if( ValueA < ValueB ) return -1;
                    if( ValueA > ValueB ) return 1;
                    return 0;
                });
            }else{
                return Array.sort(function(a,b){
                    var ValueA = that._getValue(a,sColumn);
                    var ValueB = that._getValue(b,sColumn);
                    if( ValueA < ValueB ) return 1;
                    if( ValueA > ValueB ) return -1;
                    return 0;
               });
           }
        },
        _getValue:function(obj,path){
            var parts = path.split(".");
            var value;
            for(var i in parts){
                value=obj[parts[i]];
                obj=value;
            }
            return value;
        }
	});
    if(!instance){
        instance=new Object();
    }
    return instance;
});