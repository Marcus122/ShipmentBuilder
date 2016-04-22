sap.ui.define([
	//"sb/controller/container",
    "sap/ui/core/mvc/Controller",
    "sb/data/formatter",
    "sap/m/MessageBox",
    "sb/controller/helpers/toggle",
    "sb/controller/helpers/orders"
], function( Controller, formatter, MessageBox,toggle,orders ) {
	"use strict";
	return Controller.extend("sb.controller.newOrders",{
        toggle:toggle,
        formatter:formatter,
        orders:orders,
		onInit: function(){
            this.oToggleArea=this.byId("new-orders-content");
            this.oTable = this.byId("table-new-orders");
            //this.oDragDrop=this.byId("ex-orders");
            //this.oPageCount=this.byId("ex-pages");
            this.vModel="NewOrders";
		},
        sort:function(oEvent){
            var oLink = oEvent.getSource();
            var sColumn = oLink.getTarget();
            if(oLink.ascending){
                this.getOwnerComponent().oNewOrders.sort(sColumn,false);
                oLink.ascending=false;
            }else{
                this.getOwnerComponent().oNewOrders.sort(sColumn,true);
                oLink.ascending=true;
            }
        },
        sync:function(){
            this.getOwnerComponent().syncNewOrders();
        }
	});
})