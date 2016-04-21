sap.ui.define([
	//"sb/controller/container",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sb/data/formatter",
    "sap/m/MessageBox",
    "sb/controller/helpers/valueHelp",
    "sb/controller/helpers/toggle",
    "sb/controller/helpers/orders",
    "sb/controller/helpers/map"
], function( Controller,JSONModel, formatter, MessageBox, valueHelp, toggle, orders, map ) {
	"use strict";
	return Controller.extend("sb.controller.existingShipment",{
        formatter:formatter,
        toggle:toggle,
        orders:orders,
        map:map,
        valueHelp:valueHelp,
		onInit: function(){
            //Controller.prototype.onInit.apply(this,arguments);
            this.getOwnerComponent().attachExistingShipmentUpdated(this._existingShipmentUpdated,this);
            this.oTable=this.byId("existing-shipment");
            this.oToggleArea=this.byId("existing-shipment-area");
            this.oFilterArea = this.byId("existing-filter");
            this.vModel="ExistingShipment";
            this.vSearchModel="ProposedSearch";
            this.oMapContainer = this.byId("existing-map");
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
            var aShipments =  this.getView().getModel("ProposedShipments").getData();
            if(oLink.ascending){
                aShipments = this.getOwnerComponent().sortArray(aShipments,sColumn,false);
                oLink.ascending=false;
            }else{
                aShipments = this.getOwnerComponent().sortArray(aShipments,sColumn,true);
                oLink.ascending=true;
            }
            this.getView().getModel("ProposedShipments").setData(aShipments);
        },
        selectExisting:function(oEvent){
            var oShipment = oEvent.getParameter("listItem").getBindingContext("ProposedShipments").getObject();
            this.getOwnerComponent().setExistingShipment(oShipment);
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
        },
        calcStartTime:function(){
            this.getOwnerComponent().oExistingShipment.calcStartTime();
        },
        calcEndTime:function(){
            this.getOwnerComponent().oExistingShipment.calcEndTime();
        },
        setStartTime:function(oEvent){
            var oInput = oEvent.getSource();
            this.getOwnerComponent().oExistingShipment.setStartTime(oInput.getDateValue());
        },
        setShipmentRef:function(oEvent){
            var sValue = oEvent.getSource().getValue();
            var oExistingSearch = this.getView().getModel(this.vSearchModel).getData();
            if(!sValue && oExistingSearch.ShipmentNum){
                delete oExistingSearch.ShipmentNum;
            }else if(sValue){
                oExistingSearch.ShipmentNum=[{
                    operation:"Contains",
                    value1:sValue,
                    value2:null
                }];
            }
            this.getView().getModel(this.vSearchModel).setData(oExistingSearch);
        },
        search:function(){
            this.getOwnerComponent().searchProposedShipments();
        }
	});
})