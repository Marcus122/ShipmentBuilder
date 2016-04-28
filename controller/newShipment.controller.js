sap.ui.define([
	//"sb/controller/container",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sb/data/formatter",
    "sap/m/MessageBox",
    "sb/controller/helpers/toggle",
    "sb/controller/helpers/orders",
    "sb/controller/helpers/map"
], function( Controller,JSONModel, formatter, MessageBox, toggle, orders, map ) {
	"use strict";
	return Controller.extend("sb.controller.newShipment",{
        formatter:formatter,
        toggle:toggle,
        orders:orders,
        map:map,
		onInit: function(){
            //Controller.prototype.onInit.apply(this,arguments);
            this.getOwnerComponent().attachNewShipmentUpdated(this._newShipmentUpdated,this);
            this.oTable=this.byId("new-shipment");
            this.oToggleArea=this.byId("new-shipment-data");
            this.vModel="NewShipment";
            this.oMapContainer = this.byId("new-map");
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
        shippingPointHelp:function(oEvent){
            if(!this.oShippingPointHelp){
                this.oShippingPointHelp=new sap.ui.xmlfragment("sb.fragment.shippingPointHelp",this);
                this.getView().addDependent(this.oShippingPointHelp);
            }
            this.oShippingPointHelp.open();
            this.getOwnerComponent().oHelper.recenterElement(this.oShippingPointHelp,oEvent.getSource());
            this.oPoint=oEvent.getSource().getBinding("value").getPath();
        },
        _selectShippingPoint:function(oEvent){
            var oItem = oEvent.getParameter("selectedItem");
            var oShippingPoint = oItem.getBindingContext("ShippingPoints").getObject();
            if(this.oPoint==="/EndPoint"){
                this.getOwnerComponent().oNewShipment.setEndPoint(oShippingPoint);
            }else{
                this.getOwnerComponent().oNewShipment.setShippingPoint(oShippingPoint);
            }
        },
        calcStartTime:function(){
            this.getOwnerComponent().oNewShipment.calcStartTime();
        },
        calcEndTime:function(){
            this.getOwnerComponent().oNewShipment.calcEndTime();
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
        save:function(oEvent){
            var that=this;
            if(!this.getOwnerComponent().oNewShipment.isValid()){
                return this.errorCreating({error:true,message:"Please fill in all required fields"});
            }
            var aWarnings = this.getOwnerComponent().oNewShipment.feasabilityChecks();
            if(aWarnings.length){
                var vStyle = this.getOwnerComponent().oHelper.getCenterStyleClass(oEvent.getSource());
                MessageBox.warning(aWarnings.join("\n") + "\n\n Do you want to conintue?",{
                    title:"Warnings",
                    actions:[MessageBox.Action.YES,MessageBox.Action.NO],
                    onClose:function(oEvent){
                        if(oEvent === MessageBox.Action.YES){
                            that.getOwnerComponent().oNewShipment.create(that.shipmentCreated.bind(that),that.errorCreating.bind(that));
                        }
                    },
                    styleClass:vStyle
                });
            }else{
                this.getOwnerComponent().oNewShipment.create(this.shipmentCreated.bind(this),this.errorCreating.bind(this));
            }
        },
        shipmentCreated:function(){
            var vStyle = this.getOwnerComponent().oHelper.getCenterStyleClass(this.oTable);
            MessageBox.success("Shipment Created",{
                styleClass:vStyle
            });
        },
        errorCreating:function(oError){
            var vStyle = this.getOwnerComponent().oHelper.getCenterStyleClass(this.oTable);
            MessageBox.error(oError.message,{
                styleClass:vStyle
            });
        },
        cancel:function(oEvent){
            if(!this.oCancelDialog){
                this.oCancelDialog=new sap.ui.xmlfragment("sb.fragment.cancelDialog",this);
            }
            this.oCancelDialog.open();
            this.getOwnerComponent().oHelper.recenterElement(this.oCancelDialog,oEvent.getSource());
        },
        confirmCancelDialog:function(){
            this.getOwnerComponent().createNewShipment();
            this.closeCancelDialog();
        },
        closeCancelDialog:function(){
            this.oCancelDialog.close();
        },
        saveOrder:function(oEvent){
            var oBinding = oEvent.getSource().getBindingContext("NewShipment");
            var oSavedDrop = oBinding.getObject();
            if(!oSavedDrop.Order.EditFields.FixedDateTime){
                var vStyle = this.getOwnerComponent().oHelper.getCenterStyleClass(oEvent.getSource());
                return MessageBox.error("Booking Date cannot be empty",{
                    style:vStyle
                });
            }
            this.saveSelectedOrders(oSavedDrop,oSavedDrop.Order);
        },
        saveSelectedOrders:function(_Drop,_oOrder){
            var oSavedOrder = jQuery.extend({},_oOrder);
            var oSavedDrop = jQuery.extend({},_Drop);
            var aItems = this.oTable.getSelectedItems();
            for(var i in aItems){
                var oOrder = this.getOwnerComponent().oHelper.mapEditFieldsBack(aItems[i],"NewShipment",oSavedOrder);
                var oItemBinding=aItems[i].getBindingContext("NewShipment");
                var oDrop = oItemBinding.getObject();
                oItemBinding.getModel().setProperty(oItemBinding.getPath() + "/TipTime" ,oSavedDrop.EditFields.TipTime);
                oItemBinding.getModel().setProperty(oItemBinding.getPath() + "/EditFields",undefined);
                this._saveOrder(oItemBinding,oOrder);
            }
            this.getOwnerComponent().oNewShipment.calculateRunningTotals();
        },
         _saveOrder:function(oItemBinding,oOrder){
            var that=this;
            this.getOwnerComponent().oData.saveOrder(oOrder,function(){
                oItemBinding.getModel().setProperty(oItemBinding.getPath() + "/Order" ,oOrder);
                oItemBinding.getModel().updateBindings(true);
                that.getOwnerComponent().oNewShipment.recalculateDrops();
            },function(oError){
                var vStyle = this.getOwnerComponent().oHelper.getCenterStyleClass(this.oTable);
                var msg = oError.message || "Unable to update order " + oOrder.OrderNum;
                MessageBox.error(msg,{
                    styleClass:vStyle
                });
            }.bind(this));
        },
        selectionChange:function(){
            var helper = this.orders.selectionChange.bind(this);
            helper();
            var aItems = this.oTable.getSelectedItems();
            for(var i in aItems){
                var oBinding = aItems[i].getBindingContext(this.vModel);
                var oDrop = oBinding.getObject();
                if(!oDrop.EditFields){
                    oDrop.EditFields={
                        TipTime:oDrop.TipTime
                    };
                    oBinding.getModel().setProperty(oBinding.getPath(),oDrop);
                }
                
            }
        },
        applyRunOut:function(oEvent){
            var iRunOut = oEvent.getParameter("selected") ? 11*60 : 0;
            this.getOwnerComponent().oNewShipment.setRunOut(iRunOut);
        },
        tipTimeChanged:function(){
            this.getOwnerComponent().oNewShipment.calculateRunningTotals();
        }
	});
})