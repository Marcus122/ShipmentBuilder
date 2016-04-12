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
            var Postcode = this.getShortPostcode(Target);
            if(Postcode === Source){
                return {
                    Distance:0,
                    Time:0
                }
            }
            var oResult = aResults[Postcode];
            if(oResult){
                return {
                    Distance:oResult.Distance,
                    Time:oResult.Time
                }
            }else{
                return {
                    Distance:"N/A",
                    Time:"N/A"
                }
            }
        },
        getShortPostcode:function(Postcode){
            var aParts = Postcode.split(" ");
            if(aParts.length > 1){
                 return aParts[0] + aParts[1].substring(0,1);
            }else{
                 return aParts[0].substring(0,4);
            }
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