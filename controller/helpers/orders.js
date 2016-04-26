sap.ui.define(["sap/m/MessageBox"], function (MessageBox) {
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
                var oOrder = aItems[i].getBindingContext(this.vModel).getObject();
                if(oOrder.Order){
                    oOrder=oOrder.Order;
                }
                //If not selected but set to Edit then we release lock
                if(!aItems[i].isSelected() && oOrder.Locked){
                    this.getOwnerComponent().oData.unlockOrder(oOrder.OrderNum);
                }
                //Is selected but not editable - need to get lock
                var that=this;
                var oUser = this.getOwnerComponent().oUser.getData();
                if(aItems[i].isSelected() && !oOrder.Locked){
                    this.getOwnerComponent().oData.getOrderLockDetails(oOrder.OrderNum,function(response){
                        var oOrder = this.getBindingContext(that.vModel).getObject();
                        if(oOrder.Order){
                            oOrder=oOrder.Order;
                        }
                        if(response.Locked && response.Session != oUser.session){
                            this.setSelected(false);
                            MessageBox.error("Order " + oOrder.OrderNum + " is locked by user " + response.LockedBy);
                        }else{
                            that.getOwnerComponent().oData.lockOrder(oOrder.OrderNum,oUser.session);
                            that.getOwnerComponent().oHelper.setObjectToEditable(this,oModel,that.vModel);
                        }
                    }.bind(aItems[i]));
                }else{
                    this.getOwnerComponent().oHelper.setObjectToEditable(aItems[i],oModel,this.vModel);
                }
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
        changeTipTime:function(oEvent){
            var oInput=oEvent.getSource();
            this.getOwnerComponent().oHelper.updateEditField(oInput,"TipTime",this.vModel,oInput.getValue());
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
        },
        beforeDrop:function(oEvent){
            var oFrom = oEvent.getParameter("from");
            var oItem = oEvent.getParameter("item");
            var oOrder = oItem.getBindingContext(this.vModel).getObject();
            var oUser = this.getOwnerComponent().oUser.getData();
            /*this.getOwnerComponent().oData.getOrderLockDetails(oOrder.OrderNum,function(response){
                if(response.Locked && response.Session != oUser.session){
                    oFrom.sortable("cancel");
                    MessageBox.error("Order " + oOrder.OrderNum + " is locked by user " + response.LockedBy);
                }else{
                    that.getOwnerComponent().oData.lockOrder(oOrder.OrderNum,oUser.session);
                }
            },true);*/
        }
    }
});