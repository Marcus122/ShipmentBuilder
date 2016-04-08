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
            if(bAscending){
                return Array.sort(function(a,b){
                    if( a[sColumn] < b[sColumn] ) return -1;
                    if( a[sColumn] > b[sColumn] ) return 1;
                    return 0;
                });
            }else{
                return Array.sort(function(a,b){
                    if( a[sColumn] < b[sColumn] ) return 1;
                    if( a[sColumn] > b[sColumn] ) return -1;
                    return 0;
               });
           }
        }
	});
    if(!instance){
        instance=new Object();
    }
    return instance;
});