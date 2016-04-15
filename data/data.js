sap.ui.define([
 "sap/ui/base/ManagedObject",
 "sap/ui/model/json/JSONModel",
 "sap/ui/model/odata/v2/ODataModel",
 "sb/data/helper"
 ], function (Object,JSONModel,ODataModel,Helper) {
	"use strict";
    var instance;
	var Object = Object.extend("sb.data.data", {
		metadata : {
		},
        init:function(){
            this.oData = new ODataModel("http://devsap.wardle.boughey.co.uk:8000/sap/opu/odata/sap/zbou_shipment_builder_srv/",{defaultUpdateMethod:"PUT"});
            this.oHelper = Helper;
        },
        searchFixedOrders:function(searchObj,fCallback){
            var aFilters=this.oHelper.getFiltersFromObject(searchObj);
            this._getOrders("/FixedOrders",aFilters,fCallback);
        },
        searchOpenOrders:function(searchObj,fCallback){
            var aFilters=this.oHelper.getFiltersFromObject(searchObj);
            this._getOrders("/OpenOrders",aFilters,fCallback);
        },
        searchProposedShipments:function(searchObj,fCallback){
            this.oData.read("/PropShipments",{
                success:function(response){
					fCallback( response.results );
				}
            });
        },
        saveOrder:function(oOrder,fCallbackS,fCallbackE){
            var that=this;
            var oUpdate={
                OrderNum:oOrder.OrderNum,
                FixedDateTime:oOrder.FixedDateTime ? oOrder.FixedDateTime.toISOString().replace("Z","") : null,
                CustRef:oOrder.CustRef,
                EarliestTime:oOrder.EarliestTime
            }
            this.oData.update("/Orders('" + oUpdate.OrderNum + "')",oUpdate,{
                success:function(response){
					fCallbackS( oOrder );
				},
                error:function(response){
                    fCallbackE( oOrder );
                }
            });
        },
        createShipment:function(_oShipment,fCallbackS,fCallbackF){
            var oShipment = {
                ShipmentNum:_oShipment.ShipmentNum,
                StartDateTime:_oShipment.StartDate,
                PlanningPoint:_oShipment.PlanningPoint,
                ShipmentType:"Z001",
                EndDateTime:_oShipment.EndDate,
                Drops:[]
            }
            this.oHelper.setTimeOnDate(oShipment.StartDateTime,_oShipment.StartTime);
            this.oHelper.setTimeOnDate(oShipment.EndDateTime,_oShipment.EndTime);
            for(var i in _oShipment.Orders){
                oShipment.Drops.push({
                    ShipmentNum:_oShipment.ShipmentNum,
                    DropNumber:_oShipment.Orders[i].Drop,
                    OrderNum:_oShipment.Orders[i].Order.OrderNum
                });
            }
            this.oData.create("/PropShipments",oShipment,{
                success: fCallbackS,
                error:fCallbackF
            });
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
        getShipmentOrders:function(oShipment,fCallback){
            var that=this;
            this.oData.setUseBatch(false);
            this.oData.read("/PropShipments('"+ oShipment.ShipmentNum + "')/Orders",{
                success:function(response){
                    that.oData.setUseBatch(true);
					fCallback( that._handleShipmentOrdersResponse( response.results ) );
				}
            });
        },
        getOrderItems:function(vOrderNum,fCallback){
            var that=this;
            this.oData.read("/Orders('"+ vOrderNum + "')/Items",{
                success:function(response){
					fCallback( response.results );
				}
            });
        },
        _handleShipmentOrdersResponse:function(aOrders){
            var aResults=[];
            for(var i in aOrders){
                aOrders[i].Postcode = aOrders[i].ShipToAddr.Postcode;
                aResults.push({
                    Drop:Number(i)+1,
                    Order:aOrders[i]
                });
            }
            return aResults;
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
            if(!aPostcodes.length || !vPostcode) return fCallback([],vPostcode);
            
            this.oData.attachBatchRequestCompleted({postcode:vPostcode,callback:fCallback},this._handleDistanceResponse,this);
            
            this.startNewBatch();
            
            for( var i in aPostcodes){
                this.oData.read("/TravelDistances(From='" + vPostcode + "',To='" + aPostcodes[i] + "')",{
                    success:function(response){
                        that.aResults.push(response);
                    },
                    error:function(response){
                     
                    }
                });
            }
        },
        startNewBatch:function(){
            this.aResults=[];
        },
        addBatchDistance:function(aPostcodes,vPostcode){
            var that=this;
            if(!this.aResults) this.aResults=[];
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
        submitBatchDistance:function(fCallback){
            this.oData.attachBatchRequestCompleted({callback:fCallback},this._handleDistanceResponse,this);
        },
        _handleDistanceResponse:function(oEvent,obj){
            //var aResults=this.aResults;
            //for(var i in this.aResults){
               // aResults[this.aResults[i].To]=this.aResults[i];
            //}
            this.oData.detachBatchRequestCompleted(this._handleDistanceResponse,this);
            //this.oData.setUseBatch(false);
            //this.aResults=[];
            obj.callback(this.aResults,obj.postcode);
        },
        getShippingPoints:function(fCallback){
            var that=this;
            if(this.aShippingPoints) return fCallback(this.aShippingPoints);
            this.oData.read("/PlanningPoints",{
                success:function(response){
                    that.aShippingPoints=response.results;
                    fCallback(that.aShippingPoints);
                }
            })
        },
        getRegions:function(fCallback){
            var that=this;
            if(this.aRegions) return fCallback(this.aRegions);
            this.oData.read("/Regions",{
                success:function(response){
                    that.aRegions=response.results;
                    fCallback(that.aRegions);
                }
            })
        },
        getOrderTypes:function(fCallback){
            var that=this;
            if(this.aTypes) return fCallback(this.aTypes);
            this.oData.read("/OrderTypes",{
                success:function(response){
                    that.aTypes=response.results;
                    fCallback(that.aTypes);
                }
            })
        }
	});
    if(!instance){
        instance=new Object();
    }
    return instance;
});