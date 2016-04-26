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
            this.aSorts=[];
        },
        setOrders:function(aList,aSorts,bAscending){
            if(aSorts){
                aList = this._doMultiSort(aList,aSorts,bAscending);
            }
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
            this._doMultiSort(aOrders,this.aSorts);
            this.oModel.setData(aOrders);
            this.fireUpdated();
        },
        addOrders:function(aNewOrders){
            var aOrders = this.oModel.getData();
            for(var i in aNewOrders){
                aOrders.push(aNewOrders[i]);
            }
            this._doMultiSort(aOrders,this.aSorts);
            this.oModel.setData(aOrders);
            this.fireUpdated();
        },
        sort:function(Column,bAscending){
            for(var i in this.aSorts){
                if(this.aSorts[i].name===Column){
                    this.aSorts.splice(Number(i),1);
                    break;
                }
            }
            this.aSorts.unshift({
                name:Column,
                ascending:bAscending
            });
            this.multiSort(this.aSorts)
        },
        multiSort:function(aSorts){
            var aOrders = this.oModel.getData();
            aOrders = this._doMultiSort(aOrders,aSorts);
            this.oModel.setData(aOrders);
        },
        _doMultiSort:function(aOrders,aSorts){
            this.aSorts = aSorts;
            if(!this.aSorts || !this.aSorts.length){
                return aOrders;
            }
            return this.oHelper.doMultiSort(aOrders,this.aSorts);
        },
        update:function(aUpdatedOrders,vKey){
            var aOrders = this.oModel.getData();
            var aExclusions=[];
            for(var i in aUpdatedOrders){
                var bFound=false;
                for(var j in aOrders){
                    if(aOrders[j][vKey] === aUpdatedOrders[i][vKey]){
                        var EditFields=null;
                        var Edit=null;
                        var Distance = aOrders[j].Distance;
                        var Time = aOrders[j].Time;
                        if(aOrders[j].Edit){
                            EditFields=aOrders[j].EditFields;
                            Edit=aOrders[j].Edit;
                        }
                        aOrders[j]=aUpdatedOrders[i];
                        aOrders[j].Distance = Distance;
                        aOrders[j].Time = Time;
                        if(EditFields){
                           aOrders[j].EditFields=EditFields;
                           aOrders[j].Edit=Edit;
                        }
                        bFound=true;
                        break;
                    }
                }
                if(!bFound){
                    aExclusions.push(aUpdatedOrders[i]);
                }
            }
            this.setOrders(aOrders);
            return aExclusions;
        }
	});
});