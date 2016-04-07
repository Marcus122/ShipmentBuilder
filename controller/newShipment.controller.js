sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sb/control/gmap",
    "sb/control/direction"
], function( Controller,JSONModel, Gmap,Direction ) {
	"use strict";
	return Controller.extend("sb.controller.newShipment",{
		onInit: function(){
            this.oToggleArea = this.byId("new-shipment-data");
            this.bOpen = true;
            this.getOwnerComponent().attachNewShipmentUpdated(this._newShipmentUpdated,this);
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
            this.byId("new-shipment").rerender();
            var bVisible = false;
            var oShipment = this.getView().getModel("NewShipment").getData();
            if(oShipment.Lines && oShipment.Lines.length){
                bVisible=true;   
            }
            this.byId("show-new-map").setVisible(bVisible);
        },
        reorder:function(oEvent){
            this.getOwnerComponent().recalculateNewShipmentDrops();
            var iOldIndex = Number(oEvent.getParameter("oldIndex"));
            var aLines = this.getView().getModel("NewShipment").getProperty("/Lines");
            if(iOldIndex === aLines.length -1){
                this.getOwnerComponent().updateOrderDistances();
            }
        },
        remove:function(oEvent){
            var oDrop = oEvent.getSource().getBindingContext("NewShipment").getObject();
            this.getOwnerComponent().removeNewShipmentDrop(oDrop);
        },
        hasLines:function(oShipment){
          if(oShipment && oShipment.Lines && oShipment.Lines.length) return true;
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
        }
	});
})