sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/Sorter",
    "sb/data/formatter"
], function( Controller, Sorter,formatter ) {
	"use strict";
	return Controller.extend("sb.controller.fixedOrders",{
        formatter:formatter,
		onInit: function(){
            this.getOwnerComponent().attachNewShipmentUpdated(this._shipmentUpdated,this);
            this.getOwnerComponent().attachExistingShipmentUpdated(this._shipmentUpdated,this);
            this.bOpen = true;
            this.oToggleArea=this.byId("fixed-orders-content");
            this.oTable = this.byId("table-orders");
		},
        itemAdded:function(oEvent){
            var iIndex = oEvent.getParameter("oldIndex");
            var iDrop = oEvent.getParameter("newIndex");
            var $table = oEvent.getParameter("table");
            var aOrders = this.getView().getModel("Orders").getProperty("/");
            
            var oOrder = aOrders.splice(iIndex,1);
            
            //var oOrder = oEvent.getParameter("item").getBindingContext("Orders").getObject();
            this.getView().getModel("Orders").setProperty("/",aOrders);
            if($table.closest(".new-panel").length){
                this.getOwnerComponent().addToNewShipment(oOrder[0],iDrop+1);
            }else if($table.closest(".existing-panel").length){
                this.getOwnerComponent().addToExistingShipment(oOrder[0],iDrop+1);
            }
        },
        sort:function(oEvent){
            var oLink = oEvent.getSource();
            var sColumn = oLink.getTarget();
            var aOrders =  this.getView().getModel("Orders").getData();
            if(oLink.ascending){
                aOrders = this.getOwnerComponent().sortArray(aOrders,sColumn,false);
                oLink.ascending=false;
            }else{
                aOrders = this.getOwnerComponent().sortArray(aOrders,sColumn,true);
                oLink.ascending=true;
            }
            this.getView().getModel("Orders").setData(aOrders);
        },
        addToExisting:function(){
            var aOrders = this.getSelectedOrders();
            for(var i in aOrders ){
                this.getOwnerComponent().addToExistingShipment(aOrders[i]);
            }
            this.removeSelectedOrders();
        },
        addToNew:function(){
            var aOrders = this.getSelectedOrders();
            for(var i in aOrders ){
                this.getOwnerComponent().addToNewShipment(aOrders[i]);
            }
            this.removeSelectedOrders();
            this.getOwnerComponent().oNewShipment.recalculateDrops();
        },
        getSelectedOrders:function(){
            var aItems = this.oTable.getSelectedItems();
            var aOrders=[];
            for(var i in aItems){
                aOrders.push(aItems[i].getBindingContext("Orders").getObject());
            }
            return aOrders;
        },
        removeSelectedOrders:function(){
            var aOrders = this.getSelectedOrders();
            for(var i in aOrders){
                this.removeOrder(aOrders[i]);
            }
            this.oTable.removeSelections();
        },
        removeOrder:function(oOrder){
            var oModel = this.getView().getModel("Orders");
            var aOrders = oModel.getData();
            for(var i in aOrders){
                if(aOrders[i].Order === oOrder.Order){
                    aOrders.splice(i,1);
                    break;
                }
            }
            oModel.setData(aOrders);
        },
        toggleBox:function(oEvent){
            var oButton = oEvent.getSource();
            this.bOpen = !this.bOpen;
            this.oToggleArea.setVisible(this.bOpen);
            if(this.bOpen){
                oButton.setIcon("sap-icon://navigation-up-arrow");
            }else{
                oButton.setIcon("sap-icon://navigation-down-arrow");
            }
        },
        hideFilterBar:function(oEvent){
            var oLink = oEvent.getSource();
            var oFilterArea = this.byId("fixed-filter");
            if(oLink.hidden){
                oLink.hidden=false;
                oLink.setText("Hide Filter Bar");
            }else{
                oLink.hidden=true;
                oLink.setText("Show Filter Bar");
            }
            oFilterArea.setVisible(!oLink.hidden);
        },
        _shipmentUpdated:function(){
            this.byId("fixed-orders").enable();
        },
        changeFixedTime:function(oEvent){
            var oInput = oEvent.getSource();
            var aValue = oInput.getValue().split(":");
            var oOrder = oInput.getBindingContext("Orders").getObject();
            var oDate = new Date(oOrder.FixedDateTime.toISOString());
            oDate.setHours(aValue[0]);
            oDate.setMinutes(aValue[1]);
            this.getView().getModel("Orders").setProperty(oInput.getBindingContext("Orders").getPath() + "/FixedDateTime" ,oDate);
        }
	});
})