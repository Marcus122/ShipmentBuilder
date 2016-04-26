sap.ui.define([], function () {
	"use strict";
    var writeDate=function(oDate){
        if(!oDate) return "";
           return oDate.getDate() + "/" + Number(oDate.getMonth() + 1 ) + "/" + oDate.getFullYear();
    }
	return {
		writeDate:writeDate,
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
        writeNumberDP:function(int){
            return Number(int).toFixed(2);
        },
        writeTokenText:function(operation,value1,value2){
            if(!operation) return "";
            if(value1===null) value1="";
            if(value1 instanceof Date) value1=writeDate(value1);
            if(value2===null) value2="";
            if(value2 instanceof Date) value2=writeDate(value2);
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