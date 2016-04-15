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

            this.clearExistingShipment();
            this.searchProposedShipments();
            this.searchFixedOrders();
            this.searchOpenOrders();
            this.setShippingPoints();
            
            this.oBackloadOrders = new JSONModel("./data/Backload.json");
            this.setModel(this.oBackloadOrders,"Backload");
            
            this.createNewShipment();
		},
        setShippingPoints:function(){
            this.oData.getShippingPoints(function(aShippingPoints){
                this.oShippingPoints= new JSONModel(aShippingPoints);
                this.setModel(this.oShippingPoints,"ShippingPoints");  
            }.bind(this));
        },
        searchFixedOrders:function(){
            var that = this;
            if(!this.oFixedSearch) this.setDefaultFixedSearch();
            this.oData.searchFixedOrders(this.oFixedSearch.getData(),function(aOrders){
                that.oFixedOrders=new OrderList();
                that.oFixedOrders.setOrders(aOrders);
                that.setModel(that.oFixedOrders.getModel(),"Orders");
            });
        },
        setDefaultFixedSearch:function(){
            var dFrom = new Date();
            dFrom.setMonth(dFrom.getMonth()-3);

            var oDate = new Date("3/17/2016");
            var startDate = new Date( oDate.getTime() );
            oDate.setDate(oDate.getDate() + 5);

            this.oFixedSearch= new JSONModel({
                DateCreated:[{value1:dFrom,operation:"GT",value2:""}],
                FixedDateTime:[{value1:startDate,value2:oDate,operation:"BT"}],
                OrderType:[{value1:"ZOR",value2:"",operation:"EQ"},{value1:"ZUP",value2:"",operation:"EQ"}]
            });
            this.setModel(this.oFixedSearch,"FixedSearch");
        },
        searchOpenOrders:function(){
            var that = this;
            if(!this.oOpenSearch) this.setDefaultOpenSearch();
            this.oData.searchOpenOrders(this.oOpenSearch.getData(),function(aOrders){
                that.oOpenOrders=new OrderList();
                that.oOpenOrders.setOrders(aOrders);
                that.setModel(that.oOpenOrders.getModel(),"OpenOrders");
            });
        },
        setDefaultOpenSearch:function(){
            var dFrom = new Date();
            dFrom.setMonth(dFrom.getMonth()-3);
            this.oOpenSearch= new JSONModel({
                DateCreated:[{value1:dFrom,operation:"GT",value2:""}],
                OrderType:[{value1:"ZOR",value2:"",operation:"EQ"},{value1:"ZUP",value2:"",operation:"EQ"}]
            });
            this.setModel(this.oOpenSearch,"OpenSearch");
        },
        searchProposedShipments:function(){
            var that = this;
            if(!this.oProposesSearch) this.oProposesSearch={};
            this.oData.searchProposedShipments(this.oProposesSearch,function(aShipments){
                that.oExistingShipments=new JSONModel(aShipments);
                that.oExistingShipments.setDefaultBindingMode("OneWay");
                that.setModel(that.oExistingShipments,"ExistingShipments");
            });
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
        },
        _shipmentCreated:function(){
            
        },
        newShipmentUpdated:function(){
            this.fireNewShipmentUpdated();
        },
        addToNewShipment:function(oOrder,iDrop){
            delete oOrder.Edit;
            this.oNewShipment.addDrop(oOrder,iDrop);
        },
        setShippingPoint:function(oShipppingPoint){
            this.oNewShipment.setShippingPoint(oShipppingPoint);
        },
        removeNewShipmentDrop:function(oDrop){
            this.oNewShipment.removeDrop(oDrop);
        },
        updateOrderDistances:function(){
            var vPostcode = this.oNewShipment.getLastDropPostcode();
            this.updateFromPostcode(vPostcode);
        },
        updateFromPostcode:function(vPostcode){
            vPostcode=this.oHelper.getShortPostcode(vPostcode);
            this.fireDistancesCalculated({postcode:vPostcode});
            this.oDistancesCalculated.setProperty("/Postcode",vPostcode);
            var that=this;
            var aFixedLines = this.oFixedOrders.getData().map(function(oLine){ 
                return that.oHelper.getShortPostcode(oLine.Postcode);
            });
            var aOpenLines = this.oOpenOrders.getData().map(function(oLine){ 
                return that.oHelper.getShortPostcode(oLine.Postcode);
            });
            var aBackloadLines = this.oBackloadOrders.getData().map(function(oLine){ 
                return that.oHelper.getShortPostcode(oLine.Postcode);
            });
            //merge arrays
            var aPostcodes = aFixedLines.concat(aOpenLines,aBackloadLines);
            aPostcodes=this.oHelper.removeDuplicates(aPostcodes);
            this.oData.getDistanceFromPostode(aPostcodes,vPostcode,this.setDistances.bind(this));
        },
        setDistances:function(aResults,vPostcode){
            var aFixedLines = this.oFixedOrders.getData();
            for(var i in aFixedLines){
                var oObj=this.oHelper.getDistance(aFixedLines[i].Postcode,vPostcode,aResults);
                aFixedLines[i].Distance=oObj.Distance;
                aFixedLines[i].Time=oObj.Time;
            }
            aFixedLines = this.oHelper.sortArray(aFixedLines,"Distance",true);
            this.oFixedOrders.setOrders(aFixedLines);
            
            var aOpenLines = this.oOpenOrders.getData();
            for(var i in aOpenLines){
                var oObj=this.oHelper.getDistance(aOpenLines[i].Postcode,vPostcode,aResults);
                aOpenLines[i].Distance=oObj.Distance;
                aOpenLines[i].Time=oObj.Time;
            }
            aOpenLines = this.oHelper.sortArray(aOpenLines,"Distance",true);
            this.oOpenOrders.setOrders(aOpenLines);
            
            var aBackloadLines = this.oBackloadOrders.getData();
            for(var i in aBackloadLines){
                var oObj=this.oHelper.getDistance(aBackloadLines[i].Postcode,vPostcode,aResults);
                aBackloadLines[i].Distance=oObj.Distance;
                aBackloadLines[i].Time=oObj.Time;
            }
            aBackloadLines = this.oHelper.sortArray(aBackloadLines,"Distance",true);
            this.oBackloadOrders.setProperty("/",aBackloadLines);
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
        },
        clearExistingShipment:function(){
            this.oExistingShipment = new JSONModel({});
            this.setModel(this.oExistingShipment,"ExistingShipment");
        },
        existingShipmentUpdated:function(){
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
            if(this.oHelper.applyFilters(oOrder,this.oHelper.getFiltersFromObject(this.oOpenSearch.getData()))){
                this.oOpenOrders.addOrder(oOrder);
            }else{
                
            }
        },
        addFixedOrder:function(oOrder){
            if(this.oHelper.applyFilters(oOrder,this.oHelper.getFiltersFromObject(this.oFixedSearch.getData()))){
                this.oFixedOrders.addOrder(oOrder);
            }else{
                
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
