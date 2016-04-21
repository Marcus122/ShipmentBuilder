sap.ui.define([
	//"sb/controller/container",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Sorter",
    "sb/data/formatter",
    "sap/m/MessageBox",
    "sb/controller/helpers/valueHelp",
    "sb/controller/helpers/paging",
    "sb/controller/helpers/toggle",
    "sb/controller/helpers/orders",
], function( Controller, Sorter,formatter,MessageBox, valueHelp, paging, toggle, orders, filterBar ) {
	"use strict";
	return Controller.extend("sb.controller.fixedOrders",{
        formatter:formatter,
        toggle:toggle,
        valueHelp:valueHelp,
        orders:orders,
        paging:paging,
		onInit: function(){
            //Controller.prototype.onInit.apply(this,arguments);
            //this.getOwnerComponent().attachNewShipmentUpdated(this._shipmentUpdated,this);
            //this.getOwnerComponent().attachExistingShipmentUpdated(this._shipmentUpdated,this);
            //Variables for container.js
            this.oToggleArea=this.byId("fixed-orders-content");
            this.oTable = this.byId("table-fixed-orders");
            this.oOrderTypes=this.byId("order-types");
            this.oFilterArea=this.byId("fixed-filter");
            this.oDragDrop=this.byId("fixed-orders");
            this.oPageCount=this.byId("fixed-pages");
            this.vModel="Orders";
            this.vSearchModel="FixedSearch";
		},
        itemAdded:function(oEvent){
            //var iIndex = oEvent.getParameter("oldIndex");
            var iDrop = oEvent.getParameter("newIndex");
            var $table = oEvent.getParameter("table");
            var aOrders = this.getView().getModel("Orders").getProperty("/");
            
            //var oOrder = aOrders.splice(iIndex,1);
            var oItem = oEvent.getParameter("item");
            var oBinding = oEvent.getParameter("item").getBindingContext("Orders");
            if(oItem.getSelected()){
                this.saveSelectedOrders(oBinding.getObject());
            }
            var oOrder = oBinding.getObject();
            this.getOwnerComponent().oFixedOrders.removeOrder(oOrder);
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
                this.getOwnerComponent().oFixedOders.sort(sColumn,false);
                oLink.ascending=false;
            }else{
                this.getOwnerComponent().oFixedOders.sort(sColumn,false);
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
                this.getOwnerComponent().oFixedOrders.removeOrder(aOrders[i]);
            }
            this.oTable.removeSelections();
        },
        saveOrder:function(oEvent){
            var oBinding = oEvent.getSource().getBindingContext("Orders");
            var oSavedOrder = oBinding.getObject();
            if(!oSavedOrder.EditFields.FixedDateTime){
                return MessageBox.error("Booking Date cannot be empty");
            }
            this.saveSelectedOrders(oSavedOrder);
        },
        saveSelectedOrders:function(_oOrder){
            var oSavedOrder = jQuery.extend({},_oOrder);
            var aItems = this.oTable.getSelectedItems();
            for(var i in aItems){
                var oOrder = this.getOwnerComponent().oHelper.mapEditFieldsBack(aItems[i],"Orders",oSavedOrder);
                var oItemBinding=aItems[i].getBindingContext("Orders");
                this._saveOrder(oItemBinding,oOrder);
            }
        },
         _saveOrder:function(oItemBinding,oOrder){
            this.getOwnerComponent().oData.saveOrder(oOrder,function(){
                 oItemBinding.getModel().setProperty(oItemBinding.getPath(),oOrder);
                 oItemBinding.getModel().updateBindings(true);
            },function(){
                MessageBox.error("Unable to update order " + oOrder.OrderNum);
            });
        },
        _shipmentUpdated:function(){
            this.oDragDrop.enable();
        },
        search:function(){
            this.getOwnerComponent().searchFixedOrders();
        }
	});
})