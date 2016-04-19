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
            var that=this;
            this.oData.read("/PropShipments",{
                success:function(response){
					fCallback( that._handleShipmentsResponse( response.results ) );
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
                error:function(){
                    fCallbackF({error:true,message:"There was an error whilst saving"});
                }
            });
        },
        updateShipment:function(_oShipment,fCallbackS,fCallbackF){
            //Update all drops with drop numbers
            for(var i in _oShipment.Orders){
                var oDrop={
                    ShipmentNum:_oShipment.ShipmentNum,
                    OrderNum:_oShipment.Orders[i].Order.OrderNum,
                    DropNumber:_oShipment.Orders[i].Drop
                }
                if(_oShipment.Orders[i].New){
                    this.oData.create("/ShipmentDrops",oDrop);
                }else{
                    this.oData.update("/ShipmentDrops(ShipmentNum='" + _oShipment.ShipmentNum + "',OrderNum='" + oDrop.OrderNum + "')",oDrop);
                }
            }
            //Remove any deleted orders
            for(var i in _oShipment.DeletedOrders){
                this.oData.remove("/ShipmentDrops(ShipmentNum='" + _oShipment.ShipmentNum + "',OrderNum='" + _oShipment.DeletedOrders[i].OrderNum + "')");
            }
            
            this.oData.attachBatchRequestCompleted({callbackF:fCallbackF,callbackS:fCallbackS},this._handleShipmentUpdateResponse,this);
        },
        _handleShipmentUpdateResponse:function(oEvent,obj){
            this.oData.detachBatchRequestCompleted(this._handleShipmentUpdateResponse,this);
            if(oEvent.getParameter("success")){
                obj.callbackS();
            }else{
                obj.callbackF({error:true,message:"There was an error whilst saving"});
            }
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
            this.oData.read("/PropShipments('"+ oShipment.ShipmentNum + "')",{
                urlParameters:{
					"$expand":"Drops,Orders"
				},
                success:function(response){
                    that.oData.setUseBatch(true);
					fCallback( that._handleShipmentOrdersResponse( response ) );
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
        _handleShipmentsResponse:function(aShipments){
            for(var i in aShipments){
                aShipments[i].StartTime = aShipments[i].StartDateTime;
                aShipments[i].EndTime = aShipments[i].EndDateTime;
            } 
            return aShipments;
        },
        _handleShipmentOrdersResponse:function(oShipment){
            var aResults=[];
            for(var i in oShipment.Drops.results){
                var oDrop = oShipment.Drops.results[i];
                for(var j in oShipment.Orders.results){
                    var oOrder = oShipment.Orders.results[j];
                    if(oOrder.OrderNum === oDrop.OrderNum){
                        oOrder.Postcode = oOrder.ShipToAddr.Postcode;
                        aResults.push({
                            Drop:Number(oDrop.DropNumber),
                            Order:oOrder
                        });
                        break;
                    }
                }
            }
            return this.oHelper.sortArray(aResults,"Drop",true);
        },
       _handleOrderResponse:function(aOrders){
             return aOrders.map(function(oOrder){
                 oOrder.DateCreated = new Date(oOrder.DateCreated);
                 oOrder.Postcode = oOrder.ShipToAddr.Postcode;
                 if(oOrder.FixedDateTime){
                    oOrder.FixedDateTime= new Date(oOrder.FixedDateTime);
                    //oOrder.FixedTime = oOrder.FixedDateTime.getHours() + ":" + oOrder.FixedDateTime.getMinutes();
                 }
                 if(oOrder.ReqDelDate){
                     oOrder.ReqDelDate= new Date(oOrder.ReqDelDate);
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
            if(this.aResults.length){
                this.oData.detachBatchRequestCompleted(this._handleDistanceResponse,this);
                //this.oData.setUseBatch(false);
                //this.aResults=[];
                obj.callback(this.aResults,obj.postcode);
            }
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