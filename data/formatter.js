sap.ui.define([], function () {
	"use strict";
	return {
		writeDate:function(oDate){
           if(!oDate) return "";
           return oDate.getDate() + "/" + Number(oDate.getMonth() + 1 ) + "/" + oDate.getFullYear();
        },
        writeTime:function(oDate){
           if(!oDate) return "";
           var mins = oDate.getMinutes();
           if(mins < 10){
               mins = "0" + String(mins);
           }
           return oDate.getHours() + ":" + mins;
        },
        writeNumber:function(int){
            return Number(int);
        }
	};
});