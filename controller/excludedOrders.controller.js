sap.ui.define([
	//"sb/controller/container",
    "sap/ui/core/mvc/Controller",
    "sb/data/formatter",
    "sap/m/MessageBox",
    "sb/controller/helpers/toggle",
    "sb/controller/helpers/orders",
    "sb/controller/helpers/paging"
], function( Controller, formatter, MessageBox,toggle,orders,paging ) {
	"use strict";
	return Controller.extend("sb.controller.excludedOrders",{
        toggle:toggle,
        formatter:formatter,
        orders:orders,
        paging:paging,
		onInit: function(){
            this.oToggleArea=this.byId("ex-orders-content");
            this.oTable = this.byId("table-ex-orders");
            this.oDragDrop=this.byId("ex-orders");
            this.oPageCount=this.byId("ex-pages");
            this.vModel="ExOrders";
		},
        itemAdded:function(oEvent){
            //var iIndex = oEvent.getParameter("oldIndex");
            var iDrop = oEvent.getParameter("newIndex");
            var $table = oEvent.getParameter("table");
            var aOrders = this.getView().getModel("ExOrders").getProperty("/");
            
            //var oOrder = aOrders.splice(iIndex,1);
            var oBinding = oEvent.getParameter("item").getBindingContext("ExOrders");
            var oOrder = oBinding.getObject();
            this.getOwnerComponent().oExOrders.removeOrder(oOrder);

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
                this.getOwnerComponent().oExOrders.sort(sColumn,false);
                oLink.ascending=false;
            }else{
                this.getOwnerComponent().oExOrders.sort(sColumn,true);
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
                this.getOwnerComponent().oExOrders.removeOrder(aOrders[i]);
            }
            this.oTable.removeSelections();
        },
        _shipmentUpdated:function(){
            this.byId("ex-orders").enable();
        },
        saveOrder:function(oEvent){
            var oBinding = oEvent.getSource().getBindingContext("ExOrders");
            var oSavedOrder = jQuery.extend({},oBinding.getObject());
            if(oSavedOrder.EditFields.FixedTime && !oSavedOrder.EditFields.FixedDateTime){
                return MessageBox.error("Need a booking date");
            }
            var aItems = this.oTable.getSelectedItems();
            for(var i in aItems){
                var oOrder = this.getOwnerComponent().oHelper.mapEditFieldsBack(aItems[i],"ExOrders",oSavedOrder);
                var oItemBinding=aItems[i].getBindingContext("ExOrders");
                this._saveOrder(oItemBinding,oOrder);
            }
        },
        _saveOrder:function(oItemBinding,oOrder){
            this.getOwnerComponent().oData.saveOrder(oOrder,function(){
                oItemBinding.getModel().setProperty(oItemBinding.getPath(),oOrder);
            }.bind(this),function(){
                MessageBox.error("Unable to update order " + oOrder.OrderNum);
            });
        },
        clear:function(){
            this.getOwnerComponent().oExOrders.setOrders([]);
        }
	});
})