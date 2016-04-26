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
                },
                connectionError:{}
            }
		},
        formatter:formatter,
		init: function () {

			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);
            
            this.oData = Data;
            this.oData.attachConnectionError(this.fireConnectionError,this);
            this.oHelper = Helper;
            
            this.oDistancesCalculated = new JSONModel({Postcode:""});
            this.setModel(this.oDistancesCalculated,"DistanceCalculated");
            this.oFixedSort=[{name:"FixedDateTime",ascending:true},{name:"ShipTo",ascending:true},{name:"ShipToPO",ascending:true},{name:"Distance",ascending:true}];
            this.oOpenSort=[{name:"Distance",ascending:true},{name:"ShipTo",ascending:true},{name:"ShipToPO",ascending:true}];
            this.oExSort=[{name:"Distance",ascending:true}];
            this.clearExistingShipment();
            this.createExcludedOrders();
            this.createNewOrders();
            
            //this.oBackloadOrders = new JSONModel("./data/Backload.json");
            //this.setModel(this.oBackloadOrders,"Backload");
            
            this.oData.getUser(function(oUser){
                oUser.session = this.oHelper.generateSession();
                this.oUser = new JSONModel(oUser);
                this.setModel(this.oUser,"User");
                this.populate();
            }.bind(this));
		},
        populate:function(){
            this.setShippingPoints();
            this.createNewShipment();
            this.oData.getUserDefaults(this.oUser.getData().id,function(oDefaults){
                 var oUser = this.oUser.getData();
                 oUser.Defaults=oDefaults;
                 this.oUser.setData(oUser);
                 this.setDefaultGlobalSettings();
                 this.populateOrders();
                 this.searchProposedShipments();
            }.bind(this));
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
            }
        },
        refreshOrders:function(){
            if(this.oFixedOrders){
                this.oData.searchFixedOrders(this.oFixedSearch.getData(),function(aOrders){
                    var aNewOrders = this.oFixedOrders.update(aOrders,"OrderNum");
                    this.mergeOrders(aNewOrders);
                }.bind(this));
            }
            if(this.oOpenOrders){
                this.oData.searchOpenOrders(this.oOpenSearch.getData(),function(aOrders){
                    var aNewOrders = this.oOpenOrders.update(aOrders,"OrderNum");
                    this.mergeOrders(aNewOrders);
                }.bind(this));
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
                        that.oFixedOrders.setOrders( aOrders,that.oFixedSort,true );
                        that.setModel(that.oFixedOrders.getModel(),"Orders");
                    });
                }else{
                    that.oFixedOrders.setOrders( aOrders,that.oFixedSort,true );
                    that.setModel(that.oFixedOrders.getModel(),"Orders");
                }
            });
        },
        mergeOrders:function(aNewOrders){
            aNewOrders = this.oNewShipment.updateOrders(aNewOrders);
            if(this.oExistingShipment){
                aNewOrders = this.oExistingShipment.updateOrders(aNewOrders);
            }
            if(this.oExOrders){
                aNewOrders = this.oExOrders.updateOrders(aNewOrders,"OrderNum");
            }
            aNewOrders = this.oNewOrders.update(aNewOrders,"OrderNum");
            this.oNewOrders.addOrders(aNewOrders);  
        },
        setDefaultFixedSearch:function(){
            var oSearch=this.oUser.getData().Defaults["F"] || {};
            if(!oSearch.FixedDateTime){
                oSearch.FixedDateTime=[{Value1:-100,Value2:5,Operation:"BT",Type:"D"}];
            }
            if(!oSearch.DateCreated){
                oSearch.DateCreated=[{Value1:-93,Operation:"GT",Value2:"",Type:"D"}];
            }
            this.oFixedSearch= new JSONModel(oSearch);
            this.setModel(this.oFixedSearch,"FixedSearch");
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
                        that.oOpenOrders.setOrders( aOrders,that.oOpenSort,true);
                        that.setModel(that.oOpenOrders.getModel(),"OpenOrders");
                    });
                }else{
                    that.oOpenOrders.setOrders(aOrders,that.oOpenSort,true);
                    that.setModel(that.oOpenOrders.getModel(),"OpenOrders");
                }
            });
        },
        setDefaultOpenSearch:function(){
            var oSearch=this.oUser.getData().Defaults["O"] || {};
            if(!oSearch.ReqDelDate){
                oSearch.ReqDelDate=[{Value1:-100,Value2:5,Operation:"BT",Type:"D"}];
            }
            if(!oSearch.DateCreated){
                oSearch.DateCreated=[{Value1:-93,Operation:"GT",Value2:"",Type:"D"}];
            }
            this.oOpenSearch= new JSONModel(oSearch);
            this.setModel(this.oOpenSearch,"OpenSearch");
        },
        setDefaultGlobalSettings:function(){
            var oSettings=this.oUser.getData().Defaults["G"] || {};
            if(!oSettings.Refresh){
                oSettings.Refresh=[{Value1:5,Operation:"EQ",Value2:"",Type:"N"}];
            }
            if(!oSettings.TravelTime){
                oSettings.TravelTime=[{Value1:0,Operation:"EQ",Value2:"",Type:"N"}];
            }
            this.oHelper.setTravelTimeMultiplier(oSettings.TravelTime[0].Value1);
            this.oSettings= new JSONModel(oSettings);
            this.setModel(this.oSettings,"Settings");
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
        createNewOrders:function(){
            this.oNewOrders=new OrderList();
            this.oNewOrders.setOrders([]);
            this.setModel(this.oNewOrders.getModel(),"NewOrders");
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
                this.oProposedShipments.addOrder(oShipment);
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
        refreshDistances:function(){
            this.oNewShipment.recalculateDrops();
            if(this.oExistingShipment) this.oExistingShipment.recalculateDrops();
            this.updateFromPostcode( this.oDistancesCalculated.getProperty("/Postcode"));
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
            var aExLines = this.oExOrders ? this.oExOrders.getData().map(function(oLine){ 
                return that.oHelper.getShortPostcode(oLine.Postcode);
            }) : [];
            //merge arrays
            var aPostcodes = aFixedLines.concat(aOpenLines,aExLines);
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
                this.oFixedOrders.setOrders(aFixedLines,this.oFixedSort,true);
            }
            if(this.oOpenOrders){
                var aOpenLines = this.oOpenOrders.getData();
                for(var i in aOpenLines){
                    var oObj=this.oHelper.getDistance(aOpenLines[i].Postcode,vPostcode,aResults);
                    aOpenLines[i].Distance=oObj.Distance;
                    aOpenLines[i].Time=oObj.Time;
                }
                this.oOpenOrders.setOrders(aOpenLines,this.oOpenSort,true);
            }
            if(this.oExOrders){
                var aExLines = this.oExOrders.getData();
                for(var i in aExLines){
                    var oObj=this.oHelper.getDistance(aExLines[i].Postcode,vPostcode,aResults);
                    aExLines[i].Distance=oObj.Distance;
                    aExLines[i].Time=oObj.Time;
                }
                this.oExOrders.setOrders(aExLines,this.oExSort,true);
            }
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
            var oExistingShipment = new JSONModel({});
            this.setModel(oExistingShipment,"ExistingShipment");
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
        syncNewOrders:function(){
           var aNewOrders = this.oNewOrders.getData();
           for(var i in aNewOrders){
                this.putOrderBack(aNewOrders[i]);
            }
            this.oNewOrders.setOrders([]);
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
        },
        startRefresh:function(){
            if(this.Interval) clearInterval(this.Interval);
            var oRefresh = this.oSettings.getData().Refresh;
            if(!oRefresh || isNaN(oRefresh[0].Value1) || !Number(oRefresh[0].Value1) ) return;
            this.Interval=setInterval(this.refreshOrders.bind(this),oRefresh[0].Value1*1000*60);
        },
	});

});
