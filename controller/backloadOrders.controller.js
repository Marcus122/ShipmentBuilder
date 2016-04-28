sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sb/data/formatter",
    "sb/controller/helpers/toggle",
    "sb/controller/helpers/orders",
    "sb/controller/helpers/paging",
    "sb/controller/helpers/valueHelp"
], function( Controller,formatter, toggle, orders, paging,valueHelp ) {
	"use strict";
	return Controller.extend("sb.controller.backloadOrders",{
        toggle:toggle,
        formatter:formatter,
        orders:orders,
        paging:paging,
        valueHelp:valueHelp,
		onInit: function(){
            this.oTable = this.byId("table-blackload-orders");
            this.oToggleArea=this.byId("backload-orders-content");
            this.oDragDrop=this.byId("backload-orders");
            this.oPageCount=this.byId("backload-pages");
            this.oFilterArea=this.byId("backload-filter");
            this.vModel="Backload";
            this.vSearchModel="BackSearch";
		},
        sort:function(oEvent){
            var oLink = oEvent.getSource();
            var sColumn = oLink.getTarget();
            if(oLink.ascending){
                this.getOwnerComponent().oBackload.sort(sColumn,false);
                oLink.ascending=false;
            }else{
                this.getOwnerComponent().oBackload.sort(sColumn,true);
                oLink.ascending=true;
            }
        },
        search:function(){
            this.getOwnerComponent().searchBackloadOrders();
        }
	});
})