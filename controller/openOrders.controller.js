sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sb/data/formatter"
], function( Controller, formatter ) {
	"use strict";
	return Controller.extend("sb.controller.openOrders",{
        formatter:formatter,
		onInit: function(){
            this.getOwnerComponent().attachNewShipmentUpdated(this._shipmentUpdated,this);
            this.getOwnerComponent().attachExistingShipmentUpdated(this._shipmentUpdated,this);
            this.bOpen = true;
            this.oToggleArea=this.byId("open-orders-content");
            this.oTable = this.byId("table-open-orders");
		},
        itemAdded:function(oEvent){
            var iIndex = oEvent.getParameter("oldIndex");
            var iDrop = oEvent.getParameter("newIndex");
            var $table = oEvent.getParameter("table");
            var aOrders = this.getView().getModel("OpenOrders").getProperty("/");
            
            var oOrder = aOrders.splice(iIndex,1);
            
            this.getView().getModel("OpenOrders").setProperty("/",aOrders);
            //this.getOwnerComponent().addToNewShipment(oOrder[0],iDrop+1);
            if($table.closest(".new-panel").length){
                this.getOwnerComponent().addToNewShipment(oOrder[0],iDrop+1);
            }else if($table.closest(".existing-panel").length){
                this.getOwnerComponent().addToExistingShipment(oOrder[0],iDrop+1);
            }
        },
        sort:function(oEvent){
            var oLink = oEvent.getSource();
            var sColumn = oLink.getTarget();
            var aOrders =  this.getView().getModel("OpenOrders").getData();
            if(oLink.ascending){
                aOrders = this.getOwnerComponent().sortArray(aOrders,sColumn,false);
                oLink.ascending=false;
            }else{
                aOrders = this.getOwnerComponent().sortArray(aOrders,sColumn,true);
                oLink.ascending=true;
            }
            this.getView().getModel("OpenOrders").setData(aOrders);
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
                aOrders.push(aItems[i].getBindingContext("OpenOrders").getObject());
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
            var oModel = this.getView().getModel("OpenOrders");
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
            var oFilterArea = this.byId("open-filter");
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
            this.byId("open-orders").enable();
        },
        changeFixedDate:function(oEvent){
            var oInput = oEvent.getSource();
            var oOrder = oInput.getBindingContext("OpenOrders").getObject();
            if(oOrder.FixedDateTime){
                var aOrders = this.getView().getModel("OpenOrders").getProperty("/");
                for(var i in aOrders){
                    if(aOrders[i] === oOrder){
                        aOrders.splice(i,1);
                        this.getView().getModel("OpenOrders").setProperty("/",aOrders);
                        this.getOwnerComponent().addFixedOrder(oOrder);
                        return;
                    }
                }
            }
        },
        changeFixedTime:function(oEvent){
            var oInput = oEvent.getSource();
            var aValue = oInput.getValue().split(":");
            var oOrder = oInput.getBindingContext("OpenOrders").getObject();
            var oDate = new Date(oOrder.FixedDateTime.toISOString());
            oDate.setHours(aValue[0]);
            oDate.setMinutes(aValue[1]);
            this.getView().getModel("OpenOrders").setProperty(oInput.getBindingContext("Orders").getPath() + "/FixedDateTime" ,oDate);
        }
	});
})