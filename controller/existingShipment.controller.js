sap.ui.define([
	//"sb/controller/container",
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sb/data/formatter",
    "sap/m/MessageBox",
    "sb/controller/helpers/valueHelp",
    "sb/controller/helpers/toggle",
    "sb/controller/helpers/orders",
    "sb/controller/helpers/map",
    "sb/control/valueHelp",
    "sb/controller/helpers/paging"
], function( Controller,JSONModel, formatter, MessageBox, valueHelp, toggle, orders, map, ValueHelp, paging ) {
	"use strict";
	return Controller.extend("sb.controller.existingShipment",{
        formatter:formatter,
        toggle:toggle,
        orders:orders,
        map:map,
        valueHelp:valueHelp,
        paging:paging,
		onInit: function(){
            //Controller.prototype.onInit.apply(this,arguments);
            this.getOwnerComponent().attachExistingShipmentUpdated(this._existingShipmentUpdated,this);
            this.oTable=this.byId("existing-shipment");
            this.oToggleArea=this.byId("existing-shipment-area");
            this.oFilterArea = this.byId("existing-filter");
            this.vModel="ExistingShipment";
            this.vSearchModel="ProposedSearch";
            this.oMapContainer = this.byId("existing-map");
            this.oDragDrop = this.byId("existing-shipments");
            this.oPageCount = this.byId("existing-pages");
		},
        _existingShipmentUpdated:function(){
            this.byId("existing-shipment").rerender();
        },
        reorder:function(){
            this.getOwnerComponent().oExistingShipment.recalculateDrops();
        },
        remove:function(oEvent){
            var oDrop = oEvent.getSource().getBindingContext("ExistingShipment").getObject();
            this.getOwnerComponent().removeExistingShipmentDrop(oDrop);
        },
        isShipmentSelected:function(oShipment){
            if(!oShipment || !oShipment.ShipmentNum) return false;
            return true;
        },
        sort:function(oEvent){
            var oLink = oEvent.getSource();
            var sColumn = oLink.getTarget();
            var aShipments =  this.getView().getModel("ProposedShipments").getData();
            if(oLink.ascending){
                aShipments = this.getOwnerComponent().sortArray(aShipments,sColumn,false);
                oLink.ascending=false;
            }else{
                aShipments = this.getOwnerComponent().sortArray(aShipments,sColumn,true);
                oLink.ascending=true;
            }
            this.getView().getModel("ProposedShipments").setData(aShipments);
        },
        selectExisting:function(oEvent){
            var oShipment = oEvent.getParameter("listItem").getBindingContext("ProposedShipments").getObject();
            this.getOwnerComponent().setExistingShipment(oShipment);
        },
        _distancesCalculated:function(oEvent){
            this.oTable.removeSelections();
        },
        calculateDistances:function(oEvent){
            var oDrop = oEvent.getSource().getBindingContext("ExistingShipment").getObject();
            this.getOwnerComponent().updateFromPostcode(oDrop.Order.Postcode);
        },
        cancel:function(oEvent){
            if(!this.oCancelDialog){
                this.oCancelDialog=new sap.ui.xmlfragment("sb.fragment.cancelDialog",this);
            }
            this.oCancelDialog.open();
            this.getOwnerComponent().oHelper.recenterElement(this.oCancelDialog,oEvent.getSource());
        },
        confirmCancelDialog:function(){
            this.getOwnerComponent().clearExistingShipment();
            this.closeCancelDialog();
        },
        closeCancelDialog:function(){
            this.oCancelDialog.close();
        },
        save:function(oEvent){
            var that=this;
            this._doChecks(function(){
                that.getOwnerComponent().oExistingShipment.save(that.shipmentSaved.bind(that),that.errorCreating.bind(that));
           },oEvent.getSource());
        },
        release:function(oEvent){
            var that=this;
            this._doChecks(function(){
                that.getOwnerComponent().oExistingShipment.release(that.shipmentSaved.bind(that),that.errorCreating.bind(that));
           },oEvent.getSource());
        },
        _doChecks:function(fCallback,oSource){
            if(!this.getOwnerComponent().oExistingShipment.isValid()){
                return this.errorCreating({error:true,message:"Please fill in all required fields"});
            }
            var aWarnings = this.getOwnerComponent().oExistingShipment.feasabilityChecks();
            if(aWarnings.length){
                var vStyle = oSource ? this.getOwnerComponent().oHelper.getCenterStyleClass(oSource) : "";
                MessageBox.warning(aWarnings.join("\n") + "\n\n Do you want to conintue?",{
                    title:"Warnings",
                    actions:[MessageBox.Action.YES,MessageBox.Action.NO],
                    onClose:function(oEvent){
                        if(oEvent === MessageBox.Action.YES){
                            fCallback();
                        }
                    },
                    styleClass:vStyle
                });
            }else{
                fCallback();
            }
        },
        shipmentSaved:function(){
            var vStyle=this.getOwnerComponent().oHelper.getCenterStyleClass(this.oTable);
            MessageBox.success("Shipment Saved",{
                styleClass:vStyle
            });
        },
        errorCreating:function(oError){
            MessageBox.error(oError.message);
        },
        saveOrder:function(oEvent){
            var oBinding = oEvent.getSource().getBindingContext("ExistingShipment");
            var oSavedDrop = oBinding.getObject();
            if(!oSavedDrop.Order.EditFields.FixedDateTime){
                var vStyle=this.getOwnerComponent().oHelper.getCenterStyleClass(oEvent.getSource());
                return MessageBox.error("Booking Date cannot be empty",{
                    styleClass:vStyle
                });
            }
            this.saveSelectedOrders(oSavedDrop,oSavedDrop.Order);
        },
        saveSelectedOrders:function(_oDrop,_oOrder){
            var oSavedOrder = jQuery.extend({},_oOrder);
            var oSavedDrop = jQuery.extend({},_oDrop);
            var aItems = this.oTable.getSelectedItems();
            for(var i in aItems){
                var oOrder = this.getOwnerComponent().oHelper.mapEditFieldsBack(aItems[i],"ExistingShipment",oSavedOrder);
                var oItemBinding=aItems[i].getBindingContext("ExistingShipment");
                var oDrop = oItemBinding.getObject();
                oItemBinding.getModel().setProperty(oItemBinding.getPath() + "/TipTime" ,oSavedDrop.EditFields.TipTime);
                oItemBinding.getModel().setProperty(oItemBinding.getPath() + "/EditFields",undefined);
                this._saveOrder(oItemBinding,oOrder);
            }
            this.getOwnerComponent().oExistingShipment.calculateRunningTotals();
        },
         _saveOrder:function(oItemBinding,oOrder){
            var that=this;
            this.getOwnerComponent().oData.saveOrder(oOrder,function(){
                oItemBinding.getModel().setProperty(oItemBinding.getPath() + "/Order" ,oOrder);
                oItemBinding.getModel().updateBindings(true);
                that.getOwnerComponent().oData.unlockOrder(oOrder.OrderNum);
                that.getOwnerComponent().oNewShipment.recalculateDrops();
            },function(oError){
                var vStyle=this.getOwnerComponent().oHelper.getCenterStyleClass(this.oTable);
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
        calcStartTime:function(){
            this.getOwnerComponent().oExistingShipment.calcStartTime();
        },
        calcEndTime:function(){
            this.getOwnerComponent().oExistingShipment.calcEndTime();
        },
        setStartTime:function(oEvent){
            var oInput = oEvent.getSource();
            this.getOwnerComponent().oExistingShipment.setStartTime(oInput.getDateValue());
        },
        setShipmentRef:function(oEvent){
            var sValue = oEvent.getSource().getValue();
            var oExistingSearch = this.getView().getModel(this.vSearchModel).getData();
            if(!sValue && oExistingSearch.ShipmentNum){
                delete oExistingSearch.ShipmentNum;
            }else if(sValue){
                oExistingSearch.ShipmentNum=[{
                    Operation:"Contains",
                    Value1:sValue,
                    Value2:null
                }];
            }
            this.getView().getModel(this.vSearchModel).setData(oExistingSearch);
        },
        setCreatedBy:function(oEvent){
            var sValue = oEvent.getSource().getValue();
            var oExistingSearch = this.getView().getModel(this.vSearchModel).getData();
            if(!sValue && oExistingSearch.CreatedBy){
                delete oExistingSearch.CreatedBy;
            }else if(sValue){
                oExistingSearch.CreatedBy=[{
                    Operation:"EQ",
                    Value1:sValue,
                    Value2:null
                }];
            }
            this.getView().getModel(this.vSearchModel).setData(oExistingSearch);
        },
        search:function(){
            this.getOwnerComponent().searchProposedShipments();
        },
        applyRunOut:function(oEvent){
            var iRunOut = oEvent.getParameter("selected") ? 11*60 : 0;
            this.getOwnerComponent().oExistingShipment.setRunOut(iRunOut);
        }
	});
})