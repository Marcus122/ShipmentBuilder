sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/Sorter",
    "sb/data/formatter",
    "sap/m/MessageBox",
    "sb/control/valueHelp"
], function( Controller, Sorter,formatter,MessageBox, ValueHelp ) {
	"use strict";
	return Controller.extend("sb.controller.fixedOrders",{
        formatter:formatter,
		onInit: function(){
            this.getOwnerComponent().attachNewShipmentUpdated(this._shipmentUpdated,this);
            this.getOwnerComponent().attachExistingShipmentUpdated(this._shipmentUpdated,this);
            this.bOpen = true;
            this.oToggleArea=this.byId("fixed-orders-content");
            this.oTable = this.byId("table-fixed-orders");
            this.oOrderTypes=this.byId("order-types");
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
            //var iIndex = Number(oBinding.getPath().split("/")[1]);
            //aOrders.splice(iIndex,1);
            //this.getView().getModel("Orders").setProperty("/",aOrders);
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
        getSelectedOrders:function(){
            var aItems = this.oTable.getSelectedItems();
            var aOrders=[];
            for(var i in aItems){
                aOrders.push(aItems[i].getBindingContext("Orders").getObject());
            }
            return aOrders;
        },
        removeSelectedOrders:function(){
            var aOrders = this.getSelectedOrders();
            for(var i in aOrders){
                this.getOwnerComponent().oFixedOrders.removeOrder(aOrders[i]);
            }
            this.oTable.removeSelections();
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
        hideFilterBar:function(oEvent){
            var oLink = oEvent.getSource();
            var oFilterArea = this.byId("fixed-filter");
            if(oLink.hidden){
                oLink.hidden=false;
                oLink.setText("Hide Filter Bar");
            }else{
                oLink.hidden=true;
                oLink.setText("Show Filter Bar");
            }
            oFilterArea.setVisible(!oLink.hidden);
        },
        selectionChange:function(){
            var aItems = this.oTable.getItems();
            var oModel = this.getView().getModel("Orders");
            for(var i in aItems){
                var oBinding = aItems[i].getBindingContext("Orders");
                var oOrder = oBinding.getObject();
                if(aItems[i].getSelected()){
                    oOrder.Edit = true;
                    oOrder.EditFields = jQuery.extend({}, oOrder);
                }else{
                   oOrder.Edit = false;
                    if(oOrder.EditFields){
                        delete oOrder.EditFields;
                    }
                }
                oModel.setProperty(oBinding.getPath(),oOrder);
            }
        },
        saveOrder:function(oEvent){
            var oBinding = oEvent.getSource().getBindingContext("Orders");
            var oSavedOrder = oBinding.getObject();
            this.saveSelectedOrders(oSavedOrder);
        },
        saveSelectedOrders:function(_oOrder){
            var oSavedOrder = jQuery.extend({},_oOrder);
            var aItems = this.oTable.getSelectedItems();
            for(var i in aItems){
                var oItemBinding = aItems[i].getBindingContext("Orders");
                var oOrder = oItemBinding.getObject();
                oOrder.CustRef = oSavedOrder.EditFields.CustRef;
                oOrder.FixedDateTime = oSavedOrder.EditFields.FixedDateTime;
                var FixedTime = oSavedOrder.EditFields.FixedTime;
                if(FixedTime){
                    var aValue = FixedTime.split(":");
                    oOrder.FixedDateTime.setHours(aValue[0]);
                    oOrder.FixedDateTime.setMinutes(aValue[1]);
                }
                this._saveOrder(oItemBinding,oOrder);
            }
        },
         _saveOrder:function(oItemBinding,oOrder){
            this.getOwnerComponent().oData.saveOrder(oOrder,function(){
                delete oOrder.EditFields;
                oOrder.Edit=false;
                oItemBinding.getModel().setProperty(oItemBinding.getPath(),oOrder);
            },function(){
                MessageBox.error("Unable to update order " + oOrder.OrderNum);
            });
        },
        _shipmentUpdated:function(){
            this.byId("fixed-orders").enable();
        },
        changeFixedTime1:function(oEvent){
            var oInput = oEvent.getSource();
            var aValue = oInput.getValue().split(":");
            var oOrder = oInput.getBindingContext("Orders").getObject();
            var oDate = new Date(oOrder.FixedDateTime.toISOString());
            oDate.setHours(aValue[0]);
            oDate.setMinutes(aValue[1]);
            this.getView().getModel("Orders").setProperty(oInput.getBindingContext("Orders").getPath() + "/FixedDateTime" ,oDate);
        },
        changeFixedDate:function(oEvent){
            var oBinding = oEvent.getSource().getBindingContext("Orders");
            var oOrder = oBinding.getObject();
            oOrder.EditFields.FixedDateTime = oEvent.getSource().getDateValue();
            oBinding.getModel().setProperty(oBinding.getPath(),oOrder);
        },
        changeFixedTime:function(oEvent){
            var oBinding = oEvent.getSource().getBindingContext("Orders");
            var oOrder = oBinding.getObject();
            oOrder.EditFields.FixedTime = oEvent.getSource().getValue();
            oBinding.getModel().setProperty(oBinding.getPath(),oOrder);
        },
        changeCustRef:function(oEvent){
            var oBinding = oEvent.getSource().getBindingContext("Orders");
            var oOrder = oBinding.getObject();
            oOrder.EditFields.CustRef = oEvent.getSource().getValue();
            oBinding.getModel().setProperty(oBinding.getPath(),oOrder);
        },
        viewOrderDetails:function(oEvent){
            var oLink = oEvent.getSource();
            var oOrder = oLink.getBindingContext("Orders").getObject();
            this.getOwnerComponent().showOrder(oLink,oOrder);
        },
        _getValueHelp:function(){
            if(!this.oValueHelp){
                this.oValueHelp = new ValueHelp();
                this.oValueHelp.attachConfirm(this.setRanges,this);
            }
            return this.oValueHelp;
        },
        onValueHelpOrderType:function(oEvent){
            var oValueHelp = this._getValueHelp();
            var oInput = oEvent.getSource();
            oValueHelp.setTitle("Order Type");
            this.vName=oInput.getCustomData()[0].getValue();
            oValueHelp.setRanges(this.getView().getModel("FixedSearch").getProperty("/" + this.vName));
            this.getOwnerComponent().oData.getOrderTypes(function(aTypes){
                var aValues=[];
                for(var i in aTypes){
                    aValues.push({
                       key: aTypes[i].OrderTypeKey,
                       text:aTypes[i].Description
                    });
                }
                oValueHelp.setHelperValues(aValues);
                oValueHelp.open(oInput);
            });
        },
        onValueHelpRegions:function(oEvent){
            var oValueHelp = this._getValueHelp();
            var oInput = oEvent.getSource();
            oValueHelp.setTitle("Regions");
            this.vName=oInput.getCustomData()[0].getValue();
            oValueHelp.setRanges(this.getView().getModel("FixedSearch").getProperty("/" + this.vName));
            this.getOwnerComponent().oData.getRegions(function(aRegions){
                var aValues=[];
                for(var i in aRegions){
                    aValues.push({
                       key: aRegions[i].TranspZone,
                       text:aRegions[i].Description
                    });
                }
                oValueHelp.setHelperValues(aValues);
                oValueHelp.open(oInput);
            });
        },
        setRanges:function(oEvent){
            var aRanges = oEvent.getParameter("ranges");
            this.getView().getModel("FixedSearch").setProperty("/" + this.vName ,aRanges);
        },
        removeToken:function(oEvent){
            var vName = oEvent.getSource().getParent().getParent().getCustomData()[0].getValue();
            var oRange = oEvent.getSource().getBindingContext("FixedSearch").getObject();
            var oModel = this.getView().getModel("FixedSearch");
            var aRanges = oModel.getProperty("/" + vName);
            aRanges=this.getOwnerComponent().oHelper.removeObjectFromArray(oRange,aRanges);
            oModel.setProperty("/" + vName,aRanges);
        },
        search:function(){
            this.getOwnerComponent().searchFixedOrders();
        }
	});
})