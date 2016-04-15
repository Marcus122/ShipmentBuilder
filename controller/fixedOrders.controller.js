sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/Sorter",
    "sb/data/formatter",
    "sb/control/valueHelp"
], function( Controller, Sorter,formatter, ValueHelp ) {
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
            this.removeOrder(oOrder);
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
            var aOrders =  this.getView().getModel("Orders").getData();
            if(oLink.ascending){
                aOrders = this.getOwnerComponent().sortArray(aOrders,sColumn,false);
                oLink.ascending=false;
            }else{
                aOrders = this.getOwnerComponent().sortArray(aOrders,sColumn,true);
                oLink.ascending=true;
            }
            this.getView().getModel("Orders").setData(aOrders);
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
                this.removeOrder(aOrders[i]);
            }
            this.oTable.removeSelections();
        },
        removeOrder:function(oOrder){
            var oModel = this.getView().getModel("Orders");
            var aOrders = oModel.getData();
            for(var i in aOrders){
                if(aOrders[i] === oOrder){
                    aOrders.splice(i,1);
                    break;
                }
            }
            oModel.setData(aOrders);
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
        onValueHelp:function(){
            var oValueHelp = new ValueHelp({
                title:"Order Type"
            });
            oValueHelp.setRanges(this.getView().getModel("FixedSearch").getProperty("/OrderType"));
            oValueHelp.attachConfirm(this.setOrderTypes,this);
            oValueHelp.open();
        },
        setOrderTypes:function(oEvent){
            var aRanges = oEvent.getParameter("ranges");
            this.getView().getModel("FixedSearch").setProperty("/OrderType",aRanges);
        },
        removeOrderTypeToken:function(oEvent){
            var oRange = oEvent.getSource().getBindingContext("FixedSearch").getObject();
            var oModel = this.getView().getModel("FixedSearch");
            var aRanges = oModel.getProperty("/OrderType");
            for(var i in aRanges){
                if(oRange === aRanges[i]){
                    aRanges.splice(i,1);
                    break;
                }
            }
            oModel.setProperty("/OrderType",aRanges);
        }
	});
})