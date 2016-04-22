sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
    "sb/data/data",
    "sb/data/shipment",
    "sb/data/helper",
    "sb/data/formatter",
    "sb/data/orderList"
], function (UIComponent, JSONModel, Data, Shipment, Helper,formatter, OrderList ) {
	"use strict";

	return UIComponent.extend("sb.Component", {

		metadata: {
			manifest: "json",
            events:{
                newShipmentUpdated:{},
                existingShipmentUpdated:{},
                distancesCalculated:{
                    postcode:{type:"string"}
                }
            }
		},
        formatter:formatter,
		init: function () {

			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);
            
            this.oData = Data;
            this.oHelper = Helper;
            
            this.oDistancesCalculated = new JSONModel({Postcode:""});
            this.setModel(this.oDistancesCalculated,"DistanceCalculated");
            this.oFixedSort=["FixedDateTime","ShipTo","ShipToPO","Distance"];
            this.oOpenSort=["Distance","ShipTo","ShipToPO"];
            
            //this.oBackloadOrders = new JSONModel("./data/Backload.json");
            //this.setModel(this.oBackloadOrders,"Backload");
            
            this.oData.getUser(function(oUser){
                this.oUser = new JSONModel(oUser);
                this.setModel(this.oUser,"User");
                this.populate();
            }.bind(this));
		},
        populate:function(){
            this.clearExistingShipment();
            this.createExcludedOrders();
            this.setShippingPoints();
            this.createNewShipment();
            this.oData.getUserDefaults(this.oUser.getData().id,function(oDefaults){
                 var oUser = this.oUser.getData();
                 oUser.Defaults=oDefaults;
                 this.oUser.setData(oUser);
                 this.populateOrders();
            }.bind(this));
            //this.oData.getAppSettings(this.oUser.getData().id,this.populateOrders(this));
        },
        setShippingPoints:function(){
            this.oData.getShippingPoints(function(aShippingPoints){
                this.oShippingPoints= new JSONModel(aShippingPoints);
                this.setModel(this.oShippingPoints,"ShippingPoints");  
            }.bind(this));
        },
        populateOrders:function(){
            var oUser = this.oUser.getData();
            if(oUser.Defaults){// && oUser.Settings){
                this.searchFixedOrders();
                this.searchOpenOrders();
                this.searchProposedShipments();
            }
        },
        searchFixedOrders:function(){
            var that = this;
            if(!this.oFixedSearch) this.setDefaultFixedSearch();
            this.oData.searchFixedOrders(this.oFixedSearch.getData(),function(aOrders){
                that.oFixedOrders=new OrderList();
                that.oFixedOrders.setFilter(that.oFixedSearch.getData());
                aOrders=that.removeOrdersOnNewShipment(aOrders);
                var vPostcode = that.oDistancesCalculated.getProperty("/Postcode");
                if(vPostcode){
                    that.updateArrayWithDistances(aOrders,vPostcode,function(aOrders){
                        that.oFixedOrders.setOrders( that.oHelper.doMultiSort(aOrders,that.oFixedSort,true));
                        that.setModel(that.oFixedOrders.getModel(),"Orders");
                    });
                }else{
                    that.oFixedOrders.setOrders(that.oHelper.doMultiSort(aOrders,that.oFixedSort,true));
                    that.setModel(that.oFixedOrders.getModel(),"Orders");
                }
            });
        },
        setDefaultFixedSearch:function(){
            var dFrom = new Date();
            dFrom.setMonth(dFrom.getMonth()-3);

            var oDate = new Date("3/17/2016");
            var startDate = new Date( oDate.getTime() );
            oDate.setDate(oDate.getDate() + 5);
            
            var oSearch=this.oUser.getData().Defaults["F"] || {};
            oSearch.FixedDateTime=[{Value1:startDate,Value2:oDate,Operation:"BT"}];
            oSearch.DateCreated=[{Value1:dFrom,Operation:"GT",Value2:""}];
            this.oFixedSearch= new JSONModel(oSearch);
            this.setModel(this.oFixedSearch,"FixedSearch");
        },
        saveFixedDefaults:function(){
            this.oData.saveDefaults(this.oFixedSearch.getData(),this.oUser.getData().id,"F");
        },
        saveOpenDefaults:function(){
            this.oData.saveDefaults(this.oOpenSearch.getData(),this.oUser.getData().id,"O");
        },
        searchOpenOrders:function(){
            var that = this;
            if(!this.oOpenSearch) this.setDefaultOpenSearch();
            this.oData.searchOpenOrders(this.oOpenSearch.getData(),function(aOrders){
                that.oOpenOrders=new OrderList();
                that.oOpenOrders.setFilter(that.oOpenOrders.getData());
                aOrders=that.removeOrdersOnNewShipment(aOrders);
                var vPostcode = that.oDistancesCalculated.getProperty("/Postcode");
                if(vPostcode){
                    that.updateArrayWithDistances(aOrders,vPostcode,function(aOrders){
                        that.oOpenOrders.setOrders( that.oHelper.doMultiSort(aOrders,that.oOpenSort,true));
                        that.setModel(that.oOpenOrders.getModel(),"OpenOrders");
                    });
                }else{
                    that.oOpenOrders.setOrders(that.oHelper.doMultiSort(aOrders,that.oOpenSort,true));
                    that.setModel(that.oOpenOrders.getModel(),"OpenOrders");
                }
            });
        },
        setDefaultOpenSearch:function(){
            var dFrom = new Date();
            dFrom.setMonth(dFrom.getMonth()-5);
            var oSearch=this.oUser.getData().Defaults["O"] || {};
            oSearch.DateCreated=[{Value1:dFrom,Operation:"GT",Value2:""}];
            this.oOpenSearch= new JSONModel(oSearch);
            this.setModel(this.oOpenSearch,"OpenSearch");
        },
        searchProposedShipments:function(){
            var that = this;
            if(!this.oProposedSearch) this.setDefaultProposedSearch();
            this.oData.searchProposedShipments(this.oProposedSearch.getData(),function(aShipments){
                that.oProposedShipments=new JSONModel(aShipments);
                that.oProposedShipments.setDefaultBindingMode("OneWay");
                that.setModel(that.oProposedShipments,"ProposedShipments");
            });
        },
        setDefaultProposedSearch:function(){
            this.oProposedSearch=new JSONModel({});
            this.setModel(this.oProposedSearch,"ProposedSearch");
        },
        createExcludedOrders:function(){
            this.oExOrders=new OrderList();
            this.oExOrders.setOrders([]);
            this.setModel(this.oExOrders.getModel(),"ExOrders");
        },
        createNewShipment:function(oShipment){
            if(this.oNewShipment){
                this._putNewShipmentOrdersBack();
            }
            this.oNewShipment = new Shipment();
            this.setModel(this.oNewShipment.getModel(),"NewShipment");
            this.oNewShipment.attachShipmentUpdated(this.newShipmentUpdated,this);
            this.oNewShipment.attachOrderRemoved(this._putOrderBack,this);
            this.oNewShipment.attachLastDropUpdated(this.updateOrderDistances,this);
            this.oNewShipment.attachShipmentCreated(this._shipmentCreated,this);
            this.oData.getShippingPoints(function(aPoints){
                for(var i in aPoints){
                    if(aPoints[i].PlanningPointKey === "1000"){
                        this.oNewShipment.setEndPoint(aPoints[i]);
                        return this.oNewShipment.setShippingPoint(aPoints[i]);
                    }
                }
            }.bind(this));
        },
        _shipmentCreated:function(){
            var oShipment = this.oNewShipment.getData();
            this.oNewShipment=null;
            this.createNewShipment();
            if(this.oHelper.applyFilters(oShipment,this.oHelper.getFiltersFromObject(this.oExistingSearch.getData()))){
                this.oProposedShipments.addOrder(oOrder);
            }
        },
        newShipmentUpdated:function(){
            this.fireNewShipmentUpdated();
        },
        addToNewShipment:function(oOrder,iDrop){
            delete oOrder.Edit;
            this.oNewShipment.addDrop(oOrder,iDrop);
        },
        removeNewShipmentDrop:function(oDrop){
            this.oNewShipment.removeDrop(oDrop);
        },
        updateOrderDistances:function(){
            var vPostcode = this.oNewShipment.getLastDropPostcode();
            this.updateFromPostcode(vPostcode);
        },
        removeOrdersOnNewShipment:function(aOrders){
            var aNewShipmentOrders = this.oNewShipment.getOrders();
            var aResults=[];
            for(var i in aOrders){
                var bFound=false;
                for(var j in aNewShipmentOrders){
                    if(aNewShipmentOrders[j].Order.OrderNum===aOrders[i].OrderNum){
                        bFound=true;
                        break;
                    }
                }
                if(!bFound){
                    aResults.push(aOrders[i]);
                }
            }
            return aResults;
        },
        updateFromPostcode:function(vPostcode){
            vPostcode=this.oHelper.getShortPostcode(vPostcode);
            this.fireDistancesCalculated({postcode:vPostcode});
            this.oDistancesCalculated.setProperty("/Postcode",vPostcode);
            var that=this;
            var aFixedLines = this.oFixedOrders ? this.oFixedOrders.getData().map(function(oLine){ 
                return that.oHelper.getShortPostcode(oLine.Postcode);
            }) : [];
            var aOpenLines = this.oOpenOrders ? this.oOpenOrders.getData().map(function(oLine){ 
                return that.oHelper.getShortPostcode(oLine.Postcode);
            }) : [];
            /*var aBackloadLines = this.oBackloadOrders.getData().map(function(oLine){ 
                return that.oHelper.getShortPostcode(oLine.Postcode);
            });*/
            //merge arrays
            var aPostcodes = aFixedLines.concat(aOpenLines);//,aBackloadLines);
            aPostcodes=this.oHelper.removeDuplicates(aPostcodes);
            this.oData.getDistanceFromPostode(aPostcodes,vPostcode,this.setDistances.bind(this));
        },
        setDistances:function(aResults,vPostcode){
            if(this.oFixedOrders){
                var aFixedLines = this.oFixedOrders.getData();
                for(var i in aFixedLines){
                    var oObj=this.oHelper.getDistance(aFixedLines[i].Postcode,vPostcode,aResults);
                    aFixedLines[i].Distance=oObj.Distance;
                    aFixedLines[i].Time=oObj.Time;
                }
                aFixedLines = this.oHelper.doMultiSort(aFixedLines,this.oFixedSort,true);
                this.oFixedOrders.setOrders(aFixedLines);
            }
            if(this.oOpenOrders){
                var aOpenLines = this.oOpenOrders.getData();
                for(var i in aOpenLines){
                    var oObj=this.oHelper.getDistance(aOpenLines[i].Postcode,vPostcode,aResults);
                    aOpenLines[i].Distance=oObj.Distance;
                    aOpenLines[i].Time=oObj.Time;
                }
                aOpenLines = this.oHelper.doMultiSort(aOpenLines,this.oOpenSort,true);
                this.oOpenOrders.setOrders(aOpenLines);
            }
            
            /*var aBackloadLines = this.oBackloadOrders.getData();
            for(var i in aBackloadLines){
                var oObj=this.oHelper.getDistance(aBackloadLines[i].Postcode,vPostcode,aResults);
                aBackloadLines[i].Distance=oObj.Distance;
                aBackloadLines[i].Time=oObj.Time;
            }
            aBackloadLines = this.oHelper.sortArray(aBackloadLines,"Distance",true);
            this.oBackloadOrders.setProperty("/",aBackloadLines);*/
        },
        updateArrayWithDistances:function(aArray,vPostcode,fCallback){
            var that=this;
            var aPostcodes = aArray.map(function(oLine){ 
                return that.oHelper.getShortPostcode(oLine.Postcode);
            });
            aPostcodes=this.oHelper.removeDuplicates(aPostcodes);
            this.oData.getDistanceFromPostode(aPostcodes,vPostcode,function(aResults){
                for(var i in aArray){
                    var oObj=that.oHelper.getDistance(aArray[i].Postcode,vPostcode,aResults);
                    aArray[i].Distance=oObj.Distance;
                    aArray[i].Time=oObj.Time;
                }
                fCallback(aArray);
            });
        },
        setExistingShipment:function(oShipment){
            var that=this;
            if(oShipment.Orders && oShipment.Orders.length){
                this._setExistingShipment(oShipment);
            }else{
                this.oData.getShipmentOrders(oShipment,function(aOrders){
                    oShipment.Orders = aOrders;
                    that._setExistingShipment(oShipment);
                });
            }
        },
        _setExistingShipment:function(_oShipment){
            var oShipment = jQuery.extend(true,{},_oShipment);
            this.oExistingShipment = new Shipment({recalculateDropDistances:true});
            this.oExistingShipment.setShipment(oShipment);
            this.setModel(this.oExistingShipment.getModel(),"ExistingShipment");
            this.oExistingShipment.attachOrderRemoved(this._putOrderBack,this);
            this.oExistingShipment.attachShipmentUpdated(this.existingShipmentUpdated,this);
            this.oExistingShipment.attachShipmentSaved(this.existingShipmentSaved,this);
            this.oData.getShippingPoint(oShipment.PlanningPoint,function(oPoint){
                return this.oExistingShipment.setEndPoint(oPoint); 
            }.bind(this));
        },
        clearExistingShipment:function(){
            this.oExistingShipment = new JSONModel({});
            this.setModel(this.oExistingShipment,"ExistingShipment");
        },
        existingShipmentSaved:function(){
            var oShipment = this.oExistingShipment.getData();
            var aShipments = this.oProposedShipments.getData();
            for(var i in aShipments){
                if(aShipments[i].ShipmentNum === oShipment.ShipmentNum){
                    aShipments[i]=oShipment;
                    break;
                }
            }
            this.oProposedShipments.setData(aShipments);
        },
        existingShipmentUpdated:function(oEvent){
            this.fireExistingShipmentUpdated();
        },
        addToExistingShipment:function(oOrder,iDrop){
            delete oOrder.Edit;
            this.oExistingShipment.addDrop(oOrder,iDrop);
        },
        removeExistingShipmentDrop:function(oDrop){
            this.oExistingShipment.removeDrop(oDrop);
        },
        _putNewShipmentOrdersBack:function(){
           var aOrders = this.oNewShipment.getOrders();
           for(var i in aOrders){
               this.putOrderBack(aOrders[i].Order);
           }
        },
        _putOrderBack:function(oEvent){
            var oOrder = oEvent.getParameter("order");
            this.putOrderBack(oOrder);
        },
        putOrderBack:function(oOrder){
            if(oOrder.FixedDateTime){
                this.addFixedOrder(oOrder);
            }else{
                this.addOpenOrder(oOrder);
            }//else{
                //this.addFixedOrder(oOrder);
            //}
        },
        addOpenOrder:function(oOrder){
            if(this.oHelper.applyFilters(oOrder,this.oHelper.getFiltersFromObject(this.oOpenOrders.getFilter()))){
                this.oOpenOrders.addOrder(oOrder);
            }else{
                this.oExOrders.addOrder(oOrder);
            }
        },
        addFixedOrder:function(oOrder){
            if(this.oHelper.applyFilters(oOrder,this.oHelper.getFiltersFromObject(this.oFixedOrders.getFilter()))){
                this.oFixedOrders.addOrder(oOrder);
            }else{
                this.oExOrders.addOrder(oOrder);
            }
        },
        addBackloadOrder:function(oOrder){
            var aOrders = this.oBackloadOrders.getData() || [];
            aOrders.push(oOrder);
            this.oBackloadOrders.setData(aOrders);
        },
        sortArray:function(Array,sColumn,bAscending){
            return this.oHelper.sortArray(Array,sColumn,bAscending);
        },
        showOrder:function(oSource,oOrder){
            var that = this;
            if(!this.oOrderDetails){
                this.oOrderDetails=new sap.ui.xmlfragment("sb.fragment.orderDetails",this);
            }
            if(oOrder.Items && oOrder.Items.length){
                this.oOrderDetails.setModel(new JSONModel(oOrder),"Order");
                this.oOrderDetails.openBy(oSource);
            }else{
                this.oData.getOrderItems(oOrder.OrderNum,function(Items){
                    oOrder.Items=Items;
                    that.oOrderDetails.setModel(new JSONModel(oOrder),"Order");
                    that.oOrderDetails.openBy(oSource);
                });
           }
        }
	});

});
