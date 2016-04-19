sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sb/data/formatter",
    "sap/m/MessageBox",
    "sb/control/valueHelp"
], function( Controller, formatter, MessageBox, ValueHelp ) {
	"use strict";
	return Controller.extend("sb.controller.openOrders",{
        formatter:formatter,
		onInit: function(){
            this.getOwnerComponent().attachNewShipmentUpdated(this._shipmentUpdated,this);
            this.getOwnerComponent().attachExistingShipmentUpdated(this._shipmentUpdated,this);
            this.bOpen = true;
            this.oToggleArea=this.byId("open-orders-content");
            this.oTable = this.byId("table-open-orders");
		},
        itemAdded:function(oEvent){
            //var iIndex = oEvent.getParameter("oldIndex");
            var iDrop = oEvent.getParameter("newIndex");
            var $table = oEvent.getParameter("table");
            var aOrders = this.getView().getModel("OpenOrders").getProperty("/");
            
            //var oOrder = aOrders.splice(iIndex,1);
            var oBinding = oEvent.getParameter("item").getBindingContext("OpenOrders");
            var oOrder = oBinding.getObject();
            this.getOwnerComponent().oOpenOrders.removeOrder(oOrder);
            //var iIndex = Number(oBinding.getPath().split("/")[1]);
            //aOrders.splice(iIndex,1);
            //this.getView().getModel("Orders").setProperty("/",aOrders);
            
            //this.getView().getModel("OpenOrders").setProperty("/",aOrders);
            //this.getOwnerComponent().addToNewShipment(oOrder[0],iDrop+1);
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
                this.getOwnerComponent().oOpenOrders.sort(sColumn,false);
                oLink.ascending=false;
            }else{
                this.getOwnerComponent().oOpenOrders.sort(sColumn,true);
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
                aOrders.push(aItems[i].getBindingContext("OpenOrders").getObject());
            }
            return aOrders;
        },
        removeSelectedOrders:function(){
            var aOrders = this.getSelectedOrders();
            for(var i in aOrders){
                this.getOwnerComponent().oOpenOrders.removeOrder(aOrders[i]);
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
            var oFilterArea = this.byId("open-filter");
            if(oLink.hidden){
                oLink.hidden=false;
                oLink.setText("Hide Filter Bar");
            }else{
                oLink.hidden=true;
                oLink.setText("Show Filter Bar");
            }
            oFilterArea.setVisible(!oLink.hidden);
        },
        _shipmentUpdated:function(){
            this.byId("open-orders").enable();
        },
        selectionChange:function(){
            var aItems = this.oTable.getItems();
            var oModel = this.getView().getModel("OpenOrders");
            for(var i in aItems){
                this.getOwnerComponent().oHelper.setObjectToEditable(aItems[i],oModel,"OpenOrders");
            }
        },
        saveOrder:function(oEvent){
            var oBinding = oEvent.getSource().getBindingContext("OpenOrders");
            var oSavedOrder = jQuery.extend({},oBinding.getObject());
            if(oSavedOrder.EditFields.FixedTime && !oSavedOrder.EditFields.FixedDateTime){
                return MessageBox.error("Need a booking date");
            }
            var aItems = this.oTable.getSelectedItems();
            for(var i in aItems){
                var oOrder = this.getOwnerComponent().oHelper.mapEditFieldsBack(aItems[i],"OpenOrders",oSavedOrder);
                var oItemBinding=aItems[i].getBindingContext("OpenOrders");
                this._saveOrder(oItemBinding,oOrder);
            }
        },
        _saveOrder:function(oItemBinding,oOrder){
            this.getOwnerComponent().oData.saveOrder(oOrder,function(){
                oItemBinding.getModel().setProperty(oItemBinding.getPath(),oOrder);
                if(oOrder.FixedDateTime){
                    this.getOwnerComponent().addFixedOrder(oOrder);
                    this.getOwnerComponent().oOpenOrders.removeOrder(oOrder);
                }
            }.bind(this),function(){
                MessageBox.error("Unable to update order " + oOrder.OrderNum);
            });
        },
        changeFixedDate:function(oEvent){
            var oInput=oEvent.getSource();
            this.getOwnerComponent().oHelper.updateEditField(oInput,"FixedDateTime","OpenOrders",oInput.getDateValue());
        },
        changeFixedTime:function(oEvent){
            var oInput=oEvent.getSource();
            this.getOwnerComponent().oHelper.updateEditField(oInput,"FixedTime","OpenOrders",oInput.getValue());
        },
        changeCustRef:function(oEvent){
            var oInput=oEvent.getSource();
            this.getOwnerComponent().oHelper.updateEditField(oInput,"CustRef","OpenOrders",oInput.getValue());
        },
        viewOrderDetails:function(oEvent){
            var oLink = oEvent.getSource();
            var oOrder = oLink.getBindingContext("OpenOrders").getObject();
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
            oValueHelp.setRanges(this.getView().getModel("OpenSearch").getProperty("/" + this.vName));
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
            oValueHelp.setRanges(this.getView().getModel("OpenSearch").getProperty("/" + this.vName));
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
            this.getView().getModel("OpenSearch").setProperty("/" + this.vName ,aRanges);
        },
        removeToken:function(oEvent){
            var vName = oEvent.getSource().getParent().getParent().getCustomData()[0].getValue();
            var oRange = oEvent.getSource().getBindingContext("OpenSearch").getObject();
            var oModel = this.getView().getModel("OpenSearch");
            var aRanges = oModel.getProperty("/" + vName);
            aRanges=this.getOwnerComponent().oHelper.removeObjectFromArray(oRange,aRanges);
            oModel.setProperty("/" + vName,aRanges);
        },
        search:function(){
            this.getOwnerComponent().searchOpenOrders();
        },
        pageBack:function(){
            this.byId("open-orders").prevPage();
        },
        pageForward:function(){
            this.byId("open-orders").nextPage();
        },
        pagingUpdated:function(oEvent){
            var iPage = oEvent.getParameter("page");
            var iPages = oEvent.getParameter("pages");
            this.byId("open-pages").setText("Page " + iPage + " of " + iPages);
        },
        setPages:function(oEvent){
            var iNum = oEvent.getParameter("selectedItem").getKey();
            var oEl = this.byId("open-orders");
            if(isNaN(iNum)){
                oEl.setItemsPerPage(9999);
            }else{
                oEl.setItemsPerPage(Number(iNum));
            }
        }
	});
})