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
            events:{
                connectionError:{}
            }
		},
        init:function(){
            this.loadOData();
            this.oHelper = Helper;
        },
        loadOData:function(){
            this.oData = new ODataModel("http://devsap.wardle.boughey.co.uk:8000/sap/opu/odata/sap/zbou_shipment_builder_srv/",{defaultUpdateMethod:"PUT"});
            this.oData.attachMetadataFailed(this.fireConnectionError,this);
        },
        getUser:function(fCallback){
           var oModel = new sap.ui.model.json.JSONModel();
           oModel.loadData("http://devsap.wardle.boughey.co.uk:8000/sap/bc/ui2/start_up");
           oModel.attachRequestCompleted(function(){
               return fCallback(oModel.getData());
           });
        },
        getUserDefaults:function(vUser,fCallback){
            var that=this;
            this.oData.read("/Users('" + vUser + "')/Defaults",{
                success:function(response){
					fCallback( that._handleDefaultsResponse( response.results ));
				}
            });
        },
        getAppSettings:function(){
            
        },
        searchFixedOrders:function(searchObj,fCallback){
            var aFilters=this.oHelper.getFiltersFromObject(searchObj);
            this._getOrders("/FixedOrders",aFilters,fCallback);
        },
        searchOpenOrders:function(searchObj,fCallback){
            var aFilters=this.oHelper.getFiltersFromObject(searchObj);
            this._getOrders("/OpenOrders",aFilters,fCallback);
        },
        searchOrders:function(searchObj,fCallback){
            var aFilters=this.oHelper.getFiltersFromObject(searchObj);
            this._getOrders("/OpenOrders",aFilters,fCallback);
        },
        searchProposedShipments:function(searchObj,fCallback){
            var that=this;
            var aFilters=this.oHelper.getFiltersFromObject(searchObj);
            this.oData.read("/PropShipments",{
                filters:aFilters,
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
                EarliestTime:oOrder.EarliestTime,
                OnwardDelPoint:oOrder.OnwardDelPoint
            }
            this.oData.update("/Orders('" + oUpdate.OrderNum + "')",oUpdate,{
                success:function(response){
					fCallbackS( oOrder );
				},
                error:function(response){
                    fCallbackE( that._parseError(response) );
                }
            });
        },
        createShipment:function(_oShipment,fCallbackS,fCallbackF){
            var oShipment = {
                ShipmentNum:_oShipment.ShipmentNum,
                StartDateTime:_oShipment.StartDateTime,
                PlanningPoint:_oShipment.PlanningPoint,
                ShipmentType:"Z001",
                EndDateTime:_oShipment.EndDateTime,
                Status:_oShipment.Status,
                Drops:[]
            }
            this.oHelper.setTimeOnDate(oShipment.StartDateTime,_oShipment.StartTime);
            this.oHelper.setTimeOnDate(oShipment.EndDateTime,_oShipment.EndTime);
            for(var i in _oShipment.Orders){
                oShipment.Drops.push({
                    ShipmentNum:_oShipment.ShipmentNum,
                    DropNumber:_oShipment.Orders[i].DropNumber,
                    OrderNum:_oShipment.Orders[i].Order.OrderNum,
                    TipTime:Number(_oShipment.Orders[i].TipTime)
                });
            }
            this.oData.create("/PropShipments",oShipment,{
                success: fCallbackS,
                error:function(response){
                    fCallbackF(that._parseError(aResults[0].response));
                }
            });
        },
        updateShipment:function(_oShipment,fCallbackS,fCallbackF){
            //Update header
            var oShipment = {
                ShipmentNum:_oShipment.ShipmentNum,
                StartDateTime:_oShipment.StartDateTime,
                PlanningPoint:_oShipment.PlanningPoint,
                ShipmentType:"Z001",
                EndDateTime:_oShipment.EndDateTime,
                Status:_oShipment.Status
            }
            if(_oShipment.StartTime){
                this.oHelper.setTimeOnDate(oShipment.StartDateTime,_oShipment.StartTime);
            }
            if(_oShipment.EndTime){
                this.oHelper.setTimeOnDate(oShipment.EndDateTime,_oShipment.EndTime);
            }
            var that=this;
            //Beacuse of the bad database layout we need to update the header first and then the lines in a different batch
            this.oData.setUseBatch(false);
            this.oData.update("/PropShipments('" + oShipment.ShipmentNum +"')",oShipment,{
                success:function(){
                    that.oData.setUseBatch(true);
                    that.updateShipmentLines(_oShipment,fCallbackS,fCallbackF);
                },
                error:function(response){
                    that.oData.setUseBatch(true);
                    fCallbackF(that._parseError(aResults[0].response));
                }
            });
         },
         updateShipmentLines:function(_oShipment,fCallbackS,fCallbackF){
            //Update all drops with drop numbers
            for(var i in _oShipment.Orders){
                var oDrop={
                    ShipmentNum:_oShipment.ShipmentNum,
                    OrderNum:_oShipment.Orders[i].Order.OrderNum,
                    DropNumber:_oShipment.Orders[i].DropNumber,
                    TipTime:Number(_oShipment.Orders[i].TipTime),
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
            var aResults = oEvent.getParameter("requests").filter(function(oResult){
               return oResult.success != true; 
            });
            if(oEvent.getParameter("success") && !aResults.length){
                obj.callbackS();
            }else{
                obj.callbackF(this._parseError(aResults[0].response));
            }
        },
        _parseError:function(response){
            var obj
            if(response && response.responseText){
                obj = JSON.parse(response.responseText);
            }
            if(!obj){
                obj={
                    error:{error:true,message:"There was an error whilst saving"}
                }
            }else{
                obj.error.error=true;
                obj.error.message=obj.error.message.value;
            }
            return obj.error;
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
                //aShipments[i].StartDateTime = this._convertUTCDate(aShipments[i].StartDateTime);
                //aShipments[i].EndDateTime = this._convertUTCDate(aShipments[i].EndDateTime);
                aShipments[i].StartTime = aShipments[i].StartDateTime;
                aShipments[i].EndTime = aShipments[i].EndDateTime;
            } 
            return aShipments;
        },
        _convertUTCDate:function(oDate){
            return new Date(oDate.getUTCFullYear(),oDate.getUTCMonth(),oDate.getUTCDate(),oDate.getUTCHours(),oDate.getUTCMinutes(),oDate.getUTCSeconds())
        },
        _converTotUTCDate:function(oDate){
            return new Date(oDate.valueOf() + oDate.getTimezoneOffset() * 60000 * -1);
        },
        _handleShipmentOrdersResponse:function(oShipment){
            var aResults=[];
            for(var i in oShipment.Drops.results){
                var oDrop = oShipment.Drops.results[i];
                for(var j in oShipment.Orders.results){
                    var oOrder = oShipment.Orders.results[j];
                    if(oOrder.OrderNum === oDrop.OrderNum){
                        oOrder.Postcode = oOrder.OnwardDelPoint ? oOrder.OnwardAddr.Postcode : oOrder.ShipToAddr.Postcode;
                        aResults.push({
                            Drop:Number(oDrop.DropNumber),
                            Order:oOrder,
                            TipTime:isNaN(oDrop.TipTime) ? 60 : Number(oDrop.TipTime)
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
                 oOrder.Postcode = oOrder.OnwardDelPoint ? oOrder.OnwardAddr.Postcode : oOrder.ShipToAddr.Postcode;
                 oOrder.Volume=Number(oOrder.Volume);
                 oOrder.Weight=Number(oOrder.Weight);
                 //if(oOrder.FixedDateTime){
                    //oOrder.FixedDateTime= new Date(oOrder.FixedDateTime);
                    //oOrder.FixedTime = oOrder.FixedDateTime.getHours() + ":" + oOrder.FixedDateTime.getMinutes();
                 //}
                 //if(oOrder.ReqDelDate){
                     //oOrder.ReqDelDate= new Date(oOrder.ReqDelDate);
                 //}
                 oOrder.Distance=0;
                 oOrder.Time=0;
                 return oOrder;
             });
        },
        _handleDefaultsResponse:function(_aDefaults){
            var oDefaults={};
            for(var i in _aDefaults){
                var oDefault=_aDefaults[i];
                if(!oDefaults[oDefault.Category]) oDefaults[oDefault.Category]={};
                if(!oDefaults[oDefault.Category][oDefault.Field]) oDefaults[oDefault.Category][oDefault.Field]=[];
                oDefaults[oDefault.Category][oDefault.Field].push({
                    Operation:oDefault.Operation,
                    Value1:oDefault.Value1,
                    Value2:oDefault.Value2,
                    Type:oDefault.Type
                })
            }
            return oDefaults;
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
        getDistanceFromPostode_:function(vTo,vFrom,fCallback){
            this.oData.read("/TravelDistances(From='" + vFrom + "',To='" + vTo + "')",{
                success:fCallback
            });
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
        saveDefaults:function(oDefaults,vUser,vCategory){
            var that=this;
            this.oData.callFunction("/ClearUserDefaults",{
                method:"POST",
                urlParameters:{
                    id:vUser,
                    Category:vCategory
                },
                success:function(){
                    for(var i in oDefaults){
                        for(var j in oDefaults[i]){
                            //Dates not saved
                            if(oDefaults[i][j].Value1 instanceof Date || oDefaults[i][j].Value2 instanceof Date){
                                continue;
                            }
                            //Convert to strings
                            var Value1 = oDefaults[i][j].Value1 ? String(oDefaults[i][j].Value1) : "";
                            var Value2 = oDefaults[i][j].Value2 ? String(oDefaults[i][j].Value2) : "";
                            var Type = oDefaults[i][j].Type ? String(oDefaults[i][j].Type) : "";
                            that.oData.create("/UserDefaults",{
                               id:vUser,
                               Category:vCategory,
                               Field:i,
                               Counter:Number(j)+1,
                               Operation:oDefaults[i][j].Operation,
                               Value1:Value1,
                               Value2:Value2,
                               Type:Type
                            });
                        }
                    }
                }
            })
        },
        getOrderLockDetails:function(vOrderNum,fCallback,_bAsync){
            var bAsync = _bAsync || false;
            this.oData.callFunction("/OrderLockDetails",{
                    method:"GET",
                    urlParameters:{
                        OrderNum:vOrderNum
                    },
                    success:function(response){
                        return fCallback(response.OrderLockDetails);
                    },
                    error:function(){
                        return fCallback({});
                    },
                    async:bAsync
            });
        },
        lockOrder:function(vOrderNum,vSession,fCallback){
            this.oData.callFunction("/LockOrder",{
                method:"POST",
                urlParameters:{
                    OrderNum:vOrderNum,
                    Session:vSession
                },
                success:function(response){
                    return fCallback ? fCallback(response.OrderLockDetails) : "";
                },
                error:function(){
                    return fCallback ? fCallback({}) : "";
                }
            });
        },
        unlockOrder:function(vOrderNum){
            this.oData.callFunction("/UnlockOrder",{
                method:"POST",
                urlParameters:{
                    OrderNum:vOrderNum
                }
            });
        },
        clearUserLocks:function(ExcludeSession,fCallback){
            this.oData.callFunction("/ClearUserLocks",{
                method:"POST",
                urlParameters:{
                    ExcludeSession:ExcludeSession
                },
                success:fCallback
            });
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
        getShippingPoint:function(id,fCallback){
           this.getShippingPoints(function(aPoints){
               for(var i in aPoints){
                   if(aPoints[i].PlanningPointKey === id){
                       return fCallback(aPoints[i]);
                   }
               }
           });
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
        getSubRegions:function(fCallback){
            var that=this;
            if(this.aSubRegions) return fCallback(this.aSubRegions);
            this.oData.read("/SubRegions",{
                success:function(response){
                    that.aSubRegions=response.results;
                    fCallback(that.aSubRegions);
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
        },
        getOnwardDelPoints:function(fCallback){
            var that=this;
            if(this.aOnward) return fCallback(this.aOnward);
            this.oData.read("/OnwardDelPoints",{
                success:function(response){
                    that.aOnward=response.results;
                    fCallback(that.aOnward);
                }
            })
        }
	});
    if(!instance){
        instance=new Object();
    }
    return instance;
});