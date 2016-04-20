sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sb/control/valueHelp"
], function( Controller, ValueHelp ) {
	"use strict";
	return Controller.extend("sb.controller.container",{
		onInit: function(){
            this.bOpen = true;
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
        isSelected:function(SelectedPostcode,DropPostcode){
            return this.getOwnerComponent().oHelper.getShortPostcode(DropPostcode) === SelectedPostcode ? "true" : "false";
        },
        hideFilterBar:function(oEvent){
            var oLink = oEvent.getSource();
            if(oLink.hidden){
                oLink.hidden=false;
                oLink.setText("Hide Filter Bar");
            }else{
                oLink.hidden=true;
                oLink.setText("Show Filter Bar");
            }
            this.oFilterArea.setVisible(!oLink.hidden);
        },
        getSelectedOrders:function(){
            var aItems = this.oTable.getSelectedItems();
            var aOrders=[];
            for(var i in aItems){
                aOrders.push(aItems[i].getBindingContext(this.vModel).getObject());
            }
            return aOrders;
        },
        selectionChange:function(){
            var aItems = this.oTable.getItems();
            var oModel = this.getView().getModel(this.vModel);
            for(var i in aItems){
                this.getOwnerComponent().oHelper.setObjectToEditable(aItems[i],oModel,this.vModel);
            }
        },
        changeFixedDate:function(oEvent){
            var oInput=oEvent.getSource();
            this.getOwnerComponent().oHelper.updateEditField(oInput,"FixedDateTime",this.vModel,oInput.getDateValue());
        },
        changeFixedTime:function(oEvent){
            var oInput=oEvent.getSource();
            this.getOwnerComponent().oHelper.updateEditField(oInput,"FixedTime",this.vModel,oInput.getValue());
        },
        changeCustRef:function(oEvent){
            var oInput=oEvent.getSource();
            this.getOwnerComponent().oHelper.updateEditField(oInput,"CustRef",this.vModel,oInput.getValue());
        },
        pageBack:function(){
            this.oDragDrop.prevPage();
        },
        pageForward:function(){
            this.oDragDrop.nextPage();
        },
        pagingUpdated:function(oEvent){
            var iPage = oEvent.getParameter("page");
            var iPages = oEvent.getParameter("pages");
            this.oPageCount.setText("Page " + iPage + " of " + iPages);
        },
        setPages:function(oEvent){
            var iNum = oEvent.getParameter("selectedItem").getKey();
            if(isNaN(iNum)){
                this.oDragDrop.setItemsPerPage(9999);
            }else{
                this.oDragDrop.setItemsPerPage(Number(iNum));
            }
        },
        viewOrderDetails:function(oEvent){
            var oLink = oEvent.getSource();
            var oOrder = oLink.getBindingContext(this.vModel).getObject();
            if(oOrder.Order){
                oOrder=oOrder.Order;
            }
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
            oValueHelp.setRanges(this.getView().getModel(this.vSearchModel).getProperty("/" + this.vName));
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
            oValueHelp.setRanges(this.getView().getModel(this.vSearchModel).getProperty("/" + this.vName));
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
            this.getView().getModel(this.vSearchModel).setProperty("/" + this.vName ,aRanges);
        },
        removeToken:function(oEvent){
            var vName = oEvent.getSource().getParent().getParent().getCustomData()[0].getValue();
            var oRange = oEvent.getSource().getBindingContext(this.vSearchModel).getObject();
            var oModel = this.getView().getModel(this.vSearchModel);
            var aRanges = oModel.getProperty("/" + vName);
            aRanges=this.getOwnerComponent().oHelper.removeObjectFromArray(oRange,aRanges);
            oModel.setProperty("/" + vName,aRanges);
        }
	});
})