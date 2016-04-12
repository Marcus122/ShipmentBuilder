sap.ui.define([
 "sap/ui/base/ManagedObject",
 "sap/ui/model/json/JSONModel",
 "sap/ui/model/odata/v2/ODataModel",
 "sap/ui/model/Filter"
 ], function (Object,JSONModel,ODataModel,Filter) {
	"use strict";
    var instance;
	var Object = Object.extend("sb.data.data", {
		metadata : {
		},
        init:function(){
            this.oData = new ODataModel("http://devsap.wardle.boughey.co.uk:8000/sap/opu/odata/sap/zbou_shipment_builder_srv/");
        },
        searchFixedOrders:function(searchObj,fCallback){
            var aFilters=[];
            if(searchObj.From){
                var sDateTime = searchObj.From.toISOString().replace("Z","");
                aFilters.push(new Filter("DateCreated",sap.ui.model.FilterOperator.GE,sDateTime));
            }
            if(searchObj.Days){
                var oDate = new Date("3/17/2016");
                var startDate = oDate.toISOString().replace("Z","");
                
                oDate.setDate(oDate.getDate() + searchObj.Days);
                var endDate = oDate.toISOString().replace("Z","");
                aFilters.push(new Filter("FixedDateTime",sap.ui.model.FilterOperator.BT,startDate,endDate));
            }
            this._getOrders("/FixedOrders",aFilters,fCallback);
        },
        searchOpenOrders:function(searchObj,fCallback){
            var aFilters=[];
            if(searchObj.From){
                var sDateTime = searchObj.From.toISOString().replace("Z","");
                aFilters.push(new Filter("DateCreated",sap.ui.model.FilterOperator.GE,sDateTime));
            }
            this._getOrders("/OpenOrders",aFilters,fCallback);
        },
        _getOrders:function(url,aFilters,fCallback){
            var that=this;
            this.oData.read(url,{
                filters:aFilters,
                success:function(response){
					fCallback( that._handleOrderResponse( response.results ) );
				}
            });
        },
       _handleOrderResponse:function(aOrders){
             return aOrders.map(function(oOrder){
                 oOrder.DateCreated = new Date(oOrder.DateCreated);
                 oOrder.Postcode = oOrder.ShipToAddr.Postcode;
                 if(oOrder.FixedDateTime){
                    oOrder.FixedDateTime= new Date(oOrder.FixedDateTime);
                    oOrder.FixedTime = oOrder.FixedDateTime.getHours() + ":" + oOrder.FixedDateTime.getMinutes();
                 }
                 oOrder.Distance=0;
                 oOrder.Time=0;
                 return oOrder;
             });
        },
        getDistanceFromPostode:function(aPostcodes,vPostcode,fCallback){
            var that=this;
            if(!aPostcodes.length) fCallback([],vPostcode);
            /*if(!this.aPostcodes){
                return this.getData(function(){
                    that.getDistanceFromPostode(aPostcodes,vPostcode,fCallback);
                });
            }
            var aFilter = aPostcodes.filter(function(oPostcode){
                return oPostcode.Source === vPostcode;
            });*/
            
            this.oData.setUseBatch(true);
            
            this.oData.attachBatchRequestCompleted({postcode:vPostcode,callback:fCallback},this._handleDistanceResponse,this);
            
            this.aResults=[];
            
            for( var i in aPostcodes){
                this.oData.read("/TravelDistances(From='" + vPostcode + "',To='" + aPostcodes[i] + "')",{
                    success:function(response){
                        that.aResults.push(response);
                    },
                    error:function(){
                       
                    }
                });
            }
        },
        _handleDistanceResponse:function(oEvent,obj){
            var aResults=[];
            for(var i in this.aResults){
                aResults[this.aResults[i].To]=this.aResults[i];
            }
            this.oData.detachBatchRequestCompleted(this._handleDistanceResponse,this);
            this.oData.setUseBatch(false);
            this.aResults=[];
            obj.callback(aResults,obj.postcode);
        },
        getData:function(fCallback){
            var that=this;
            this.oData.read("/TravelDistances",{
                filters:aFilters,
                success:function(response){
					fCallback( that._handleDistanceResponse( response.results ) );
				}
            });
            
            
            /*var that=this;
            $.ajax({
                url:"/data/Postcodes.json",
                method:"get",
                dataType:"json"
            }).success(function(response){
                that.aPostcodes=response;
                fCallback();
            });*/
        },
        getShippingPoints:function(){
            return [{id:"1000",text:"Wardle",postcode:"CW56"},{id:"2000",text:"Deeside",postcode:"CW56"},{id:"3000",text:"Central",postcode:"CW56"}];
        }
	});
    if(!instance){
        instance=new Object();
    }
    return instance;
});