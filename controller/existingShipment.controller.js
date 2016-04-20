sap.ui.define([
	"sb/controller/container",
    "sap/ui/model/json/JSONModel",
    "sb/control/gmap",
    "sb/control/direction",
    "sb/data/formatter",
    "sap/m/MessageBox"
], function( Controller,JSONModel, Gmap, Direction,formatter, MessageBox ) {
	"use strict";
	return Controller.extend("sb.controller.existingShipment",{
        formatter:formatter,
		onInit: function(){
            Controller.prototype.onInit.apply(this,arguments);
            this.getOwnerComponent().attachExistingShipmentUpdated(this._existingShipmentUpdated,this);
            this.oTable=this.byId("existing-shipment");
            this.oToggleArea=this.byId("existing-shipment-area");
            this.oFilterArea = this.byId("existing-filter");
            this.vModel="ExistingShipment";
		},
        _existingShipmentUpdated:function(){
            this.byId("existing-shipment").rerender();
        },
        reorder:function(){
            this.getOwnerComponent().oExistingShipment.recalculateDrops();
        },
        remove:function(oEvent){
            var oDrop = oEvent.getSource().getBindingContext("ExistingShipment").getObject();
            this.getOwnerComponent().removeExistingShipmentDrop(oDrop);
        },
        isShipmentSelected:function(oShipment){
            if(!oShipment || !oShipment.ShipmentNum) return false;
            return true;
        },
        sort:function(oEvent){
            var oLink = oEvent.getSource();
            var sColumn = oLink.getTarget();
            var aOrders =  this.getView().getModel("ExistingShipments").getData();
            if(oLink.ascending){
                aOrders = this.getOwnerComponent().sortArray(aOrders,sColumn,false);
                oLink.ascending=false;
            }else{
                aOrders = this.getOwnerComponent().sortArray(aOrders,sColumn,true);
                oLink.ascending=true;
            }
            this.getView().getModel("ExistingShipments").setData(aOrders);
        },
        selectExisting:function(oEvent){
            var oShipment = oEvent.getParameter("listItem").getBindingContext("ExistingShipments").getObject();
            this.getOwnerComponent().setExistingShipment(oShipment);
        },
        viewMap:function(oEvent){
            var oButton = oEvent.getSource();
            var oMapContainer = this.byId("existing-map");
            if(oMapContainer.getVisible()){
                oButton.setText("Show map");
                return oMapContainer.setVisible(false);
            }
            oButton.setText("Hide map");
            var oShipment = this.getView().getModel("ExistingShipment").getData();
            if(!oShipment.Orders.length) return;
            if(oShipment.PlanningPointPostcode){
                aDirections.push(new Direction({
                    location:oShipment.PlanningPointPostcode
                }))
            }
            var aDirections = [];
            for(var i in oShipment.Orders){
                aDirections.push(new Direction({
                    location:oShipment.Orders[i].Order.Postcode
                }))
            }
            oMapContainer.setVisible(true);
            if(!this.oMap){
                this.oMap = new Gmap({
                    directions:aDirections
                });
                oMapContainer.addContent(this.oMap);
            }else{
                this.oMap.setDirections(aDirections);
            }
        },
        _distancesCalculated:function(oEvent){
            this.oTable.removeSelections();
        },
        calculateDistances:function(oEvent){
            var oDrop = oEvent.getSource().getBindingContext("ExistingShipment").getObject();
            this.getOwnerComponent().updateFromPostcode(oDrop.Order.Postcode);
        },
        cancel:function(){
            if(!this.oCancelDialog){
                this.oCancelDialog=new sap.ui.xmlfragment("sb.fragment.cancelDialog",this);
            }
            this.oCancelDialog.open();
        },
        confirmCancelDialog:function(){
            this.getOwnerComponent().clearExistingShipment();
            this.closeCancelDialog();
        },
        closeCancelDialog:function(){
            this.oCancelDialog.close();
        },
        save:function(){
            this.getOwnerComponent().oExistingShipment.save(this.shipmentSaved.bind(this),this.errorCreating.bind(this));
        },
        shipmentSaved:function(){
            MessageBox.success("Shipment Saved");
        },
        errorCreating:function(oError){
            MessageBox.error(oError.message);
        },
        saveOrder:function(oEvent){
            var oBinding = oEvent.getSource().getBindingContext("ExistingShipment");
            var oSavedOrder = oBinding.getObject().Order;
            if(!oSavedOrder.EditFields.FixedDateTime){
                return MessageBox.error("Booking Date cannot be empty");
            }
            this.saveSelectedOrders(oSavedOrder);
        },
        saveSelectedOrders:function(_oOrder){
            var oSavedOrder = jQuery.extend({},_oOrder);
            var aItems = this.oTable.getSelectedItems();
            for(var i in aItems){
                var oOrder = this.getOwnerComponent().oHelper.mapEditFieldsBack(aItems[i],"ExistingShipment",oSavedOrder);
                var oItemBinding=aItems[i].getBindingContext("ExistingShipment");
                this._saveOrder(oItemBinding,oOrder);
            }
        },
         _saveOrder:function(oItemBinding,oOrder){
            this.getOwnerComponent().oData.saveOrder(oOrder,function(){
                oItemBinding.getModel().setProperty(oItemBinding.getPath() + "/Order" ,oOrder);
                oItemBinding.getModel().updateBindings(true);
            },function(){
                MessageBox.error("Unable to update order " + oOrder.OrderNum);
            });
        }
	});
})