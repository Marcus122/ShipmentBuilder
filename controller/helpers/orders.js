sap.ui.define([], function () {
	"use strict";
    return{
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
        viewOrderDetails:function(oEvent){
            var oLink = oEvent.getSource();
            var oOrder = oLink.getBindingContext(this.vModel).getObject();
            if(oOrder.Order){
                oOrder=oOrder.Order;
            }
            this.getOwnerComponent().showOrder(oLink,oOrder);
        },
        isSelected:function(SelectedPostcode,DropPostcode){
            return this.getOwnerComponent().oHelper.getShortPostcode(DropPostcode) === SelectedPostcode ? "true" : "false";
        }
    }
});