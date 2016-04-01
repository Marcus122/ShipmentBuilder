sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sb/control/gmap",
    "sb/control/direction"
], function( Controller,JSONModel, Gmap, Direction ) {
	"use strict";
	return Controller.extend("sb.controller.existingShipment",{
		onInit: function(){
            this.oToggleArea = this.byId("existing-shipment-area");
            this.bOpen = true;
            this.getOwnerComponent().attachExistingShipmentUpdated(this._existingShipmentUpdated,this);
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
        onAfterRendering:function(){
            //this.byId("existing-shipment").enable();
        },
        _existingShipmentUpdated:function(){
            this.byId("existing-shipment").rerender();
        },
        reorder:function(){
            this.getOwnerComponent().refreshExistingShipment();
        },
        remove:function(oEvent){
            var oDrop = oEvent.getSource().getBindingContext("ExistingShipment").getObject();
            this.getOwnerComponent().removeExistingShipmentDrop(oDrop);
        },
        isShipmentSelected:function(oShipment){
            if(!oShipment || !oShipment.Ref) return false;
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
        hideFilterBar:function(oEvent){
            var oLink = oEvent.getSource();
            var oFilterArea = this.byId("existing-filter");
            if(oLink.hidden){
                oLink.hidden=false;
                oLink.setText("Hide Filter Bar");
            }else{
                oLink.hidden=true;
                oLink.setText("Show Filter Bar");
            }
            oFilterArea.setVisible(!oLink.hidden);
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
            if(!oShipment.Lines.length) return;
            var aDirections = [];
            for(var i in oShipment.Lines){
                aDirections.push(new Direction({
                    location:oShipment.Lines[i].Order.Postcode
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
        }
	});
})