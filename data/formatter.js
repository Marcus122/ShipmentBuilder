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
        },
        writeTokenText:function(operation,value1,value2){
            if(!operation) return "";
            switch( operation ){
               case "EQ":
                    return "=" + value1;
               case "NE":
                    return "!=" + value1;
               case "BT":
                    return value1 + "..." + value2;
               case "GT":
                    return ">" + value1;
               case "LT":
                    return "<" + value1;
               case "GE":
                    return ">=" + value1;
               case "LE":
                    return "=<" + value1;
            }
            return "";
        }
	};
});