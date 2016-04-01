sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";
	return Control.extend("sb.control.dropTable", {
		metadata : {
			aggregations : {
				table: {type:"sap.m.Table", multiple: false}
			},
			defaultAggregation: "table",
			properties:{
				connectWith: {type:"string", defaultValue: ""}
			},
			events : {
				change: {
					parameters : {
						newIndex: {type:"int"}
					}
				}
			}
		},
		init : function () {
			
		},
		exit:function(){
			
		},
		_orderChanged:function(event,ui){
			this.move(ui.item.startPos,ui.item.index());
		},
		move:function(from,to){
			if(from===to) return;
			if(from<0 || to <0) return;
			var oTable = this.getAggregation("table");
			var oItems = oTable.getBinding("items");
			var data = oItems.getModel().getProperty(oItems.getPath());
			if(from>data.length-1 || to>data.length-1) return;
			//var data = oModel.getProperty('/Products');
            var o = data.splice(from, 1)[0];
            data.splice(to, 0, o);
            oItems.getModel().setProperty(oItems.getPath(),data);
			//oTable.rerender();
            //this.enable();
			this.fireChange({
				newIndex:to
			});
		},
		onBeforeRendering: function(){
		},
		onAfterRendering: function(){
			//if(!this.getEnable()) return;
			var that=this;
			var oTable = this.getAggregation("table");
			oTable.addEventDelegate({
		        onAfterRendering: function(){
		        	that.setUp(oTable.getDomRef());
		        } 
		    });
		},
        setUp:function(oTable){
			var instance = jQuery(oTable).find("table").sortable( "instance" );
            var that = this;
			//if(instance){
                //jQuery(".can-sort table")
                jQuery(oTable).find("table").on("sortupdate",function(ev,ui){
                   // if(ui.item.closest("table")===jQuery(oTable).find("table")){
                        var a = that._orderChanged.bind(that);
                        a(ev,ui);
                   // }
                });
            //}
        },
		renderer : function (oRm, oControl) {
			
			oRm.write("<div class='drop-table'"); 
	        oRm.writeControlData(oControl);  // writes the Control ID and enables event handling - important!
	        oRm.writeClasses();              // there is no class to write, but this enables 
	        oRm.write(">");                  // support for ColorBoxContainer.addStyleClass(...)
	      
	        oRm.renderControl(oControl.getAggregation("table"));
	        
	        oRm.write("</div>"); 
		}
	});
});