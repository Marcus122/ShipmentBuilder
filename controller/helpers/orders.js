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
                var bNew=false;
                if(oOrder.Order){
                    bNew=oOrder.New;
                    oOrder=oOrder.Order;
                }
                //If not selected but set to Edit then we release lock
                //Only release lock if not a new drop on a shipment
                if(!aItems[i].isSelected() && oOrder.Locked && !bNew){
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
                            return MessageBox.error("Order " + oOrder.OrderNum + " is locked by user " + response.LockedBy);
                        }else if(!response.Locked){
                            that.getOwnerComponent().oData.lockOrder(oOrder.OrderNum,oUser.session);
                        }
                        that.getOwnerComponent().oHelper.setObjectToEditable(this,oModel,that.vModel);
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
        /*changeTipTime:function(oEvent){
            var oInput=oEvent.getSource();
            this.getOwnerComponent().oHelper.updateEditField(oInput,"TipTime",this.vModel,oInput.getValue());
        },*/
        selectOnwardDelPoint:function(oEvent){
            if(!this.oOnward){
                this.oOnward=new sap.ui.xmlfragment("sb.fragment.onwardHelp",this);
                this.getView().addDependent(this.oOnward);
            }
            this.oOnward.bindElement({
                model:this.vModel,
                path:oEvent.getSource().getBindingContext(this.vModel).getPath()
            });
            this.oOnward.open();
        },
        closeOnwardHelp:function(){
            this.oOnward.close();
        },
        addOnwardPoint:function(oEvent){
            var oItem=oEvent.getSource();
            var oOnward = oItem.getBindingContext("OnwardPoints").getObject();
            this.getOwnerComponent().oHelper.updateEditField(oItem,"OnwardDelPoint",this.vModel,oOnward.CustomerNumber);
            this.getOwnerComponent().oHelper.updateEditField(oItem,"OnwardAddr",this.vModel,oOnward.Address);
            var close = this.orders.closeOnwardHelp.bind(this);
            close();
        },
        removeOnwardPoint:function(oEvent){
            var oItem=oEvent.getSource();
            this.getOwnerComponent().oHelper.updateEditField(oItem,"OnwardDelPoint",this.vModel,"");
            this.getOwnerComponent().oHelper.updateEditField(oItem,"OnwardAddr",this.vModel,{});
            var close = this.orders.closeOnwardHelp.bind(this);
            close();
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
        startDrag:function(oEvent){
            var $ui = oEvent.getParameter("ui");
            var oItem = oEvent.getParameter("item");
            var oOrder = oItem.getBindingContext(this.vModel).getObject();
            var oUser = this.getOwnerComponent().oUser.getData();
            this.getOwnerComponent().oData.getOrderLockDetails(oOrder.OrderNum,function(response){
                if(response.Locked && response.Session != oUser.session){
                    $ui.item.stop=true;
                    $ui.item.Locked=response;
                }
            });
        },
        dropCancelled:function(oEvent){
            var $ui = oEvent.getParameter("ui");
            var oItem = oEvent.getParameter("item");
            var oOrder = oItem.getBindingContext(this.vModel).getObject();
            MessageBox.error("Order " + oOrder.OrderNum + " is locked by user " + $ui.item.Locked.LockedBy);
        }
    }
});