sap.ui.define([
 "sap/ui/base/ManagedObject",
 "sap/ui/model/json/JSONModel"
 ], function (Object,JSONModel) {
	"use strict";
	return Object.extend("sb.data.data", {
		metadata : {
		},
        init:function(){},
        getDistanceFromPostode:function(aPostcodes,vPostcode,fCallback){
            var that=this;
            if(!aPostcodes.length) fCallback([],vPostcode);
            if(!this.aPostcodes){
                return this.getData(function(){
                    that.getDistanceFromPostode(aPostcodes,vPostcode,fCallback);
                });
            }
            var aFilter = this.aPostcodes.filter(function(oPostcode){
                return oPostcode.Source === vPostcode;
            });
            var aResults=[];
            for(var i in aFilter){
                aResults[aFilter[i].Target]=aFilter[i];
            }
            fCallback(aResults,vPostcode);
        },
        getData:function(fCallback){
            var that=this;
            $.ajax({
                url:"/data/Postcodes.json",
                method:"get",
                dataType:"json"
            }).success(function(response){
                that.aPostcodes=response;
                fCallback();
            });
        }
	});
});