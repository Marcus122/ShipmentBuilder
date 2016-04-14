sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
    "sb/data/data",
    "sb/data/shipment",
    "sb/data/helper",
    "sb/data/formatter"
], function (UIComponent, JSONModel, Data, Shipment, Helper,formatter) {
	"use strict";

	return UIComponent.extend("sb.Component", {

		metadata: {
			manifest: "json",
            events:{
                newShipmentUpdated:{},
                existingShipmentUpdated:{}
            }
		},
        formatter:formatter,
		init: function () {

			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);
            
            this.oData = Data;
            this.oHelper = Helper;
            
            this.oExistingShipment = new JSONModel({});
            this.setModel(this.oExistingShipment,"ExistingShipment");

            this.searchProposedShipments();
            this.searchFixedOrders();
            this.searchOpenOrders();
            
            this.oBackloadOrders = new JSONModel("./data/Backload.json");
            this.setModel(this.oBackloadOrders,"Backload");
            
            this.oShippingPoints=new JSONModel(this.oData.getShippingPoints());
            this.setModel(this.oShippingPoints,"ShippingPoints");
            
            this.createNewShipment();
		},
        searchFixedOrders:function(searchObj){
            var that = this;
            if(!searchObj){
                this.oFixedSearch = searchObj || this.getDefaultFixedSearch();
            }
            this.oData.searchFixedOrders(this.oFixedSearch,function(aOrders){
                that.oFixedOrders=new JSONModel(aOrders);
                that.oFixedOrders.setDefaultBindingMode("OneWay");
                that.oFixedOrders.setSizeLimit(999);
                that.setModel(that.oFixedOrders,"Orders");
            });
        },
        getDefaultFixedSearch:function(){
            var dFrom = new Date();
            dFrom.setMonth(dFrom.getMonth()-3);
            return {From:dFrom,Days:5,OrderTypes:["ZOR","ZUP"]};
        },
        searchOpenOrders:function(searchObj){
            var that = this;
            if(!searchObj){
                this.oOpenSearch = searchObj || this.getDefaultOpenSearch();
            }
            this.oData.searchOpenOrders(this.oOpenSearch,function(aOrders){
                that.oOpenOrders=new JSONModel(aOrders);
                that.oOpenOrders.setDefaultBindingMode("OneWay");
                that.oOpenOrders.setSizeLimit(999);
                that.setModel(that.oOpenOrders,"OpenOrders");
            });
        },
        getDefaultOpenSearch:function(){
            var dFrom = new Date();
            dFrom.setMonth(dFrom.getMonth()-3);
            return {From:dFrom,OrderTypes:["ZOR","ZUP"]};
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
            this.oNewShipment = new Shipment();
            this.setModel(this.oNewShipment.getModel(),"NewShipment");
            this.oNewShipment.attachShipmentUpdated(this.newShipmentUpdated,this);
            this.oNewShipment.attachOrderRemoved(this._putOrderBack,this);
            this.oNewShipment.attachLastDropUpdated(this.updateOrderDistances,this);
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
            this.oFixedOrders.setProperty("/",aFixedLines);
            
            var aOpenLines = this.oOpenOrders.getData();
            for(var i in aOpenLines){
                var oObj=this.oHelper.getDistance(aOpenLines[i].Postcode,vPostcode,aResults);
                aOpenLines[i].Distance=oObj.Distance;
                aOpenLines[i].Time=oObj.Time;
            }
            aOpenLines = this.oHelper.sortArray(aOpenLines,"Distance",true);
            this.oOpenOrders.setProperty("/",aOpenLines);
            
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
        _setExistingShipment:function(oShipment){
            this.oExistingShipment = new Shipment({recalculateDropDistances:true});
            this.oExistingShipment.setShipment(oShipment);
            this.setModel(this.oExistingShipment.getModel(),"ExistingShipment");
            this.oExistingShipment.attachOrderRemoved(this._putOrderBack,this);
            this.oExistingShipment.attachShipmentUpdated(this.existingShipmentUpdated,this);
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
        _putOrderBack:function(oEvent){
            var oOrder = oEvent.getParameter("order");
            if(oOrder.FixedDateTime){
                this.addFixedOrder(oOrder);
            }else{
                this.addOpenOrder(oOrder);
            }//else{
                //this.addFixedOrder(oOrder);
            //}
        },
        addOpenOrder:function(oOrder){
            var aOrders = this.oOpenOrders.getData() || [];
            aOrders.push(oOrder);
            this.oOpenOrders.setData(aOrders);
        },
        addFixedOrder:function(oOrder){
            var aOrders = this.oFixedOrders.getData() || [];
            aOrders.push(oOrder);
            this.oFixedOrders.setData(aOrders);
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
            if(!this.oOrderDetails){
                this.oOrderDetails=new sap.ui.xmlfragment("sb.fragment.orderDetails",this);
            }
            this.oOrderDetails.setModel(new JSONModel(oOrder),"Order");
            this.oOrderDetails.openBy(oSource);
        }
	});

});
