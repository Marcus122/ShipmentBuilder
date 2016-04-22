sap.ui.define([
 "sap/ui/base/ManagedObject",
 "sap/ui/model/json/JSONModel",
 "sb/data/helper"
 ], function (Object,JSONModel,Helper) {
	"use strict";
	return Object.extend("sb.data.orderList", {
		metadata : {
            events:{
                updated:{}
            },
		},
        init:function(){
            this.oHelper=Helper;
            this.oModel = new JSONModel([]);
            this.oModel.setDefaultBindingMode("OneWay");
            this.oModel.setSizeLimit(999);
        },
        setOrders:function(aList){
            this.oModel.setData(aList);
        },
        getModel:function(){
           return this.oModel;  
        },
        getData:function(){
            return this.oModel.getData();  
        },
        setFilter:function(oFilter){
            this.oFilter=oFilter;
        },
        getFilter:function(){
            return this.oFilter || {};
        },
        removeOrder:function(oOrder){
            var aOrders = this.oModel.getData();
            for(var i in aOrders){
                if(aOrders[i]===oOrder){
                    aOrders.splice(i,1);
                    break;
                }
            }
            this.oModel.setData(aOrders);
            this.fireUpdated();
        },
        addOrder:function(oOrder){
            var aOrders = this.oModel.getData();
            aOrders.push(oOrder);
            this.oModel.setData(aOrders);
            if(this.oSorter){
                this.sort(this.oSorter.Column,this.oSorter.Ascending)
            }
            this.fireUpdated();
        },
        sort:function(Column,bAscending){
            var aOrders = this.oModel.getData();
            aOrders = this.oHelper.sortArray(aOrders,Column,bAscending);
            this.oModel.setData(aOrders);
            this.oSorter={
                Column:Column,
                Ascending:bAscending
            }
        }
	});
});