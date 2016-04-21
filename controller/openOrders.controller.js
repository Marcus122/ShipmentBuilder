sap.ui.define([
    //"sb/controller/container",
    "sap/ui/core/mvc/Controller",
    "sb/data/formatter",
    "sap/m/MessageBox",
    "sb/controller/helpers/valueHelp",
    "sb/controller/helpers/paging",
    "sb/controller/helpers/toggle",
    "sb/controller/helpers/orders"
], function( Controller, formatter, MessageBox, valueHelp, paging,toggle,orders ) {
	"use strict";
	return Controller.extend("sb.controller.openOrders",{
        formatter:formatter,
        toggle:toggle,
        valueHelp:valueHelp,
        orders:orders,
        paging:paging,
		onInit: function(){
            //Controller.prototype.onInit.apply(this,arguments);
            //this.getOwnerComponent().attachNewShipmentUpdated(this._shipmentUpdated,this);
           // this.getOwnerComponent().attachExistingShipmentUpdated(this._shipmentUpdated,this);
            this.oToggleArea=this.byId("open-orders-content");
            this.oTable = this.byId("table-open-orders");
            this.oFilterArea=this.byId("open-filter");
            this.oDragDrop=this.byId("open-orders");
            this.oPageCount=this.byId("open-pages");
            this.vModel="OpenOrders";
            this.vSearchModel="OpenSearch";
		},
        itemAdded:function(oEvent){
            //var iIndex = oEvent.getParameter("oldIndex");
            var iDrop = oEvent.getParameter("newIndex");
            var $table = oEvent.getParameter("table");
            var aOrders = this.getView().getModel("OpenOrders").getProperty("/");
            
            //var oOrder = aOrders.splice(iIndex,1);
            var oBinding = oEvent.getParameter("item").getBindingContext("OpenOrders");
            var oOrder = oBinding.getObject();
            this.getOwnerComponent().oOpenOrders.removeOrder(oOrder);

            if($table.closest(".new-panel").length){
                this.getOwnerComponent().addToNewShipment(oOrder,iDrop+1);
            }else if($table.closest(".existing-panel").length){
                this.getOwnerComponent().addToExistingShipment(oOrder,iDrop+1);
            }
        },
        sort:function(oEvent){
            var oLink = oEvent.getSource();
            var sColumn = oLink.getTarget();
            if(oLink.ascending){
                this.getOwnerComponent().oOpenOrders.sort(sColumn,false);
                oLink.ascending=false;
            }else{
                this.getOwnerComponent().oOpenOrders.sort(sColumn,true);
                oLink.ascending=true;
            }
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
        removeSelectedOrders:function(){
            var aOrders = this.getSelectedOrders();
            for(var i in aOrders){
                this.getOwnerComponent().oOpenOrders.removeOrder(aOrders[i]);
            }
            this.oTable.removeSelections();
        },
        _shipmentUpdated:function(){
            this.byId("open-orders").enable();
        },
        saveOrder:function(oEvent){
            var oBinding = oEvent.getSource().getBindingContext("OpenOrders");
            var oSavedOrder = jQuery.extend({},oBinding.getObject());
            if(oSavedOrder.EditFields.FixedTime && !oSavedOrder.EditFields.FixedDateTime){
                return MessageBox.error("Need a booking date");
            }
            var aItems = this.oTable.getSelectedItems();
            for(var i in aItems){
                var oOrder = this.getOwnerComponent().oHelper.mapEditFieldsBack(aItems[i],"OpenOrders",oSavedOrder);
                var oItemBinding=aItems[i].getBindingContext("OpenOrders");
                this._saveOrder(oItemBinding,oOrder);
            }
        },
        _saveOrder:function(oItemBinding,oOrder){
            this.getOwnerComponent().oData.saveOrder(oOrder,function(){
                oItemBinding.getModel().setProperty(oItemBinding.getPath(),oOrder);
                if(oOrder.FixedDateTime){
                    this.getOwnerComponent().addFixedOrder(oOrder);
                    this.getOwnerComponent().oOpenOrders.removeOrder(oOrder);
                }
            }.bind(this),function(){
                MessageBox.error("Unable to update order " + oOrder.OrderNum);
            });
        },
        search:function(){
            this.getOwnerComponent().searchOpenOrders();
        }
	});
})