sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function( Controller ) {
	"use strict";
	return Controller.extend("sb.controller.backloadOrders",{
		onInit: function(){
            this.getOwnerComponent().attachNewShipmentUpdated(this._shipmentUpdated,this);
            this.getOwnerComponent().attachExistingShipmentUpdated(this._shipmentUpdated,this);
            this.oTable = this.byId("table-blackload-orders");
            this.bOpen = true;
            this.oToggleArea=this.byId("backload-orders-content");
		},
        itemAdded:function(oEvent){
            var iIndex = oEvent.getParameter("oldIndex");
            var iDrop = oEvent.getParameter("newIndex");
            var $table = oEvent.getParameter("table");
            var aOrders = this.getView().getModel("Backload").getProperty("/");
            
            var oOrder = aOrders.splice(iIndex,1);
            
            this.getView().getModel("Backload").setProperty("/",aOrders);
            if($table.closest(".new-panel").length){
                this.getOwnerComponent().addToNewShipment(oOrder[0],iDrop+1);
            }else if($table.closest(".existing-panel").length){
                this.getOwnerComponent().addToExistingShipment(oOrder[0],iDrop+1);
            }
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
        _shipmentUpdated:function(){
            this.byId("backload-orders").enable();
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
        },
        getSelectedOrders:function(){
            var aItems = this.oTable.getSelectedItems();
            var aOrders=[];
            for(var i in aItems){
                aOrders.push(aItems[i].getBindingContext("Backload").getObject());
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
            var oModel = this.getView().getModel("Backload");
            var aOrders = oModel.getData();
            for(var i in aOrders){
                if(aOrders[i].Order === oOrder.Order){
                    aOrders.splice(i,1);
                    break;
                }
            }
            oModel.setData(aOrders);
        },
        hideFilterBar:function(oEvent){
            var oLink = oEvent.getSource();
            var oFilterArea = this.byId("backorder-filter");
            if(oLink.hidden){
                oLink.hidden=false;
                oLink.setText("Hide Filter Bar");
            }else{
                oLink.hidden=true;
                oLink.setText("Show Filter Bar");
            }
            oFilterArea.setVisible(!oLink.hidden);
        },
        sort:function(oEvent){
            var oLink = oEvent.getSource();
            var sColumn = oLink.getTarget();
            var aOrders =  this.getView().getModel("Backload").getData();
            if(oLink.ascending){
                aOrders = this.getOwnerComponent().sortArray(aOrders,sColumn,false);
                oLink.ascending=false;
            }else{
                aOrders = this.getOwnerComponent().sortArray(aOrders,sColumn,true);
                oLink.ascending=true;
            }
            this.getView().getModel("Backload").setData(aOrders);
        },
	});
})