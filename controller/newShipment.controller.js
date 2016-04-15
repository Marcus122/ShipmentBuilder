sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sb/control/gmap",
    "sb/control/direction",
    "sb/data/formatter",
    "sap/m/MessageBox"
], function( Controller,JSONModel, Gmap, Direction, formatter, MessageBox ) {
	"use strict";
	return Controller.extend("sb.controller.newShipment",{
        formatter:formatter,
		onInit: function(){
            this.oToggleArea = this.byId("new-shipment-data");
            this.bOpen = true;
            this.getOwnerComponent().attachNewShipmentUpdated(this._newShipmentUpdated,this);
            //this.getOwnerComponent().attachDistancesCalculated(this._distancesCalculated,this);
            this.oTable=this.byId("new-shipment");
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
        _newShipmentUpdated:function(){
            this.oTable.rerender();
            this.oTable.removeSelections();
            var bVisible = false;
            var oShipment = this.getView().getModel("NewShipment").getData();
            if(oShipment.Orders && oShipment.Orders.length){
                bVisible=true;   
            }
            this.byId("show-new-map").setVisible(bVisible);
        },
        reorder:function(oEvent){
            this.getOwnerComponent().oNewShipment.recalculateDrops();
            var iOldIndex = Number(oEvent.getParameter("oldIndex"));
            var iNewIndex = Number(oEvent.getParameter("newIndex"));
            var aOrders = this.getView().getModel("NewShipment").getProperty("/Orders");
            //If something has moved to or from the last entry then we need to update distances
            if(iOldIndex === aOrders.length -1 || iNewIndex === aOrders.length -1 ){
                this.getOwnerComponent().updateOrderDistances();
            }
        },
        remove:function(oEvent){
            var oDrop = oEvent.getSource().getBindingContext("NewShipment").getObject();
            this.getOwnerComponent().removeNewShipmentDrop(oDrop);
        },
        hasLines:function(oShipment){
          if(oShipment && oShipment.Orders && oShipment.Orders.length) return true;
          return false;  
        },
        viewMap:function(oEvent){
            var oButton = oEvent.getSource();
            var oMapContainer = this.byId("new-map");
            if(oMapContainer.getVisible()){
                oButton.setText("Show map");
                return oMapContainer.setVisible(false);
            }
            oButton.setText("Hide map");
            var oShipment = this.getView().getModel("NewShipment").getData();
            if(!oShipment.Orders.length) return;
            var aDirections = [];
            if(oShipment.PlanningPointPostcode){
                aDirections.push(new Direction({
                    location:oShipment.PlanningPointPostcode
                }))
            }
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
        shippingPointHelp:function(){
            if(!this.oShippingPointHelp){
                this.oShippingPointHelp=new sap.ui.xmlfragment("sb.fragment.shippingPointHelp",this);
                this.getView().addDependent(this.oShippingPointHelp);
            }
            this.oShippingPointHelp.open();
        },
        _closeShippingPointHelp:function(){
            this.oShippingPointHelp.close();
        },
        _selectShippingPoint:function(oEvent){
            var oItem = oEvent.getParameter("selectedItem");
            var oShippingPoint = oItem.getBindingContext("ShippingPoints").getObject();
            this.getOwnerComponent().setShippingPoint(oShippingPoint);
        },
        calcStartTime:function(){
            this.getOwnerComponent().oNewShipment.calcStartTime();
        },
        setStartTime:function(oEvent){
            var oInput = oEvent.getSource();
            this.getOwnerComponent().oNewShipment.setStartTime(oInput.getDateValue());
        },
        viewOrderDetails:function(oEvent){
            var oLink = oEvent.getSource();
            var oDrop = oLink.getBindingContext("NewShipment").getObject();
            this.getOwnerComponent().showOrder(oLink,oDrop.Order);
        },
        _distancesCalculated:function(oEvent){
            this.oTable.removeSelections();
        },
        calculateDistances:function(oEvent){
            var oDrop = oEvent.getSource().getBindingContext("NewShipment").getObject();
            this.getOwnerComponent().updateFromPostcode(oDrop.Order.Postcode);
        },
        isSelected:function(SelectedPostcode,DropPostcode){
            return this.getOwnerComponent().oHelper.getShortPostcode(DropPostcode) === SelectedPostcode ? "true" : "false";
        },
        save:function(){
            this.getOwnerComponent().oNewShipment.create(this.shipmentCreated.bind(this),this.errorCreating.bind(this));  
        },
        shipmentCreated:function(){
            
        },
        errorCreating:function(oError){
            MessageBox.error(oError.message);
        },
        cancel:function(){
            if(!this.oCancelDialog){
                this.oCancelDialog=new sap.ui.xmlfragment("sb.fragment.cancelDialog",this);
            }
            this.oCancelDialog.open();
        },
        confirmCancelDialog:function(){
            this.getOwnerComponent().createNewShipment();
            this.closeCancelDialog();
        },
        closeCancelDialog:function(){
            this.oCancelDialog.close();
        }
	});
})