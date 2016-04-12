sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";
	return Control.extend("sb.control.dragDropTable", {
		metadata : {
			aggregations : {
				table: {type:"sap.m.Table", multiple: false}
			},
			defaultAggregation: "table",
			properties:{
				connectWith: {type:"string", defaultValue: ""},
                name: {type:"string", defaultValue: ""},
			},
			events : {
				change: {
					parameters : {
                        oldIndex:{type:"int"},
						newIndex: {type:"int"}
					}
				},
                received:{
                    paramters:{
                        oldIndex:{type:"int"},
                        newIndex:{type:"int"},
                        table:{type:"object"},
                        item:{type:"object"}
                    }
                }
			}
		},
		init : function () {
			
		},
		exit:function(){
			
		},
		enable:function(){
			var instance = this.getTableElement().sortable( "instance" );
			if(instance){
				//this.getTableElement().find("tbody").sortable("enable");
			}else{
				this.initialiseSortable();
			}
		},
		_orderChanged:function(event,ui){
            if(ui.item.startTable.attr("id") != this.oTable.attr("id")) return;
            if(ui.item.closest("table").attr("id") != this.oTable.attr("id")){
                var nexIndex = ui.item.parent().prop("tagName") != "TBODY" ? 0 : ui.item.index();
                /*this.fireReceived({
                    oldIndex:ui.item.startPos,
                    newIndex:nexIndex 
                });*/ 
            }else{
			    this.move(ui.item.startPos,ui.item.index());
            }
		},
        initialiseSortable:function(){
            var that=this;
            var connectWith = this.getConnectWith() ? this.getConnectWith() + " table" : false;
            var $table = this.getTableElement();
            $table.sortable({
            //jQuery(sTable).sortable({
                update: this.updated.bind(this),
                start: function(event, ui) {
                    $table.each(function(){
                        var $el = $(this);
                        if($el.sortable( "instance" )){
                            $el.sortable("refreshPositions");
                        }
                    });
                    ui.item.startPos = ui.item.index();
                    ui.item.startTable = ui.item.closest("table");
                },
                connectWith:connectWith,
                placeholder: "ui-state-highlight",
                dropOnEmpty: true,
                items:"tbody > tr",
                receive: this.updated.bind(this),
                beforeStop: function(ev, ui) {
                    //if (ui.item.closest("table").attr("id") === oT.attr("id")) {
                        //$(this).sortable('cancel');
                   // }
                }
            });
        },
        updated:function(e,ui){
            var $table = this.getTableElement();
            if(e.timeStamp === this.timeStamp) return;  //one event each time
            if(ui.item.startTable.attr("id") != $table.attr("id")) return;
            if(ui.item.closest("table").attr("id") != $table.attr("id")){
                var nexIndex = ui.item.parent().prop("tagName").toUpperCase() != "TBODY" ? 0 : ui.item.index();
                this.fireReceived({
                    oldIndex:ui.item.startPos,
                    newIndex:nexIndex,
                    table:ui.item.closest("table"),
                    item:sap.ui.getCore().byId(ui.item.attr("id"))
                });
            }else{
                this.move(ui.item.startPos,ui.item.index());
            }
            this.timeStamp = e.timeStamp;
        },
		initialiseSorting:function(){
			var oTable = this.getAggregation("table").getDomRef();
			var instance = jQuery(oTable).find("tbody").sortable( "instance" );
			if(!instance){
				this.initTable(oTable);
			}
		},
		move:function(from,to){
			if(from===to) return;
			if(from<0 || to <0) return;
            var oTable = this.getAggregation("table");
			var oItems = oTable.getBinding("items");
            var aItems = oTable.getItems();
            
            /*var oTemp1 = aItems[to];
            var oTemp2 = aItems[from];
            
            aItems[to]=oTemp2;
            aItems[from]=oTemp1;
            
            this.fireChange({
				newIndex:to,
                oldIndex:from
			});
            
            return;*/
			var data = oItems.getModel().getProperty(oItems.getPath());
			if(from>data.length-1 || to>data.length-1) return;
            var o = data.splice(from, 1)[0];
            data.splice(to, 0, o);
            oItems.getModel().setProperty(oItems.getPath(),data);
			oTable.rerender();
            //this.enable();
			this.fireChange({
				newIndex:to,
                oldIndex:from
			});
		},
        getTableElement:function(){
            var oTable = this.getAggregation("table");
            return jQuery(oTable.getDomRef()).find("table");
        },
		onBeforeRendering: function(){
		},
		onAfterRendering: function(){
            this.oTable = this.getAggregation("table");
			var that=this;
            if(this.oTable.getDomRef()){
                that.enable();
            }
            this.oTable.addEventDelegate({
                onAfterRendering: function(){
                    that.enable();
                }
            });
		},
		renderer : function (oRm, oControl) {
			
			oRm.write("<div class='drag-drop'"); 
	        oRm.writeControlData(oControl);  // writes the Control ID and enables event handling - important!
	        oRm.writeClasses();              // there is no class to write, but this enables 
	        oRm.write(">");                  // support for ColorBoxContainer.addStyleClass(...)
	      
	        oRm.renderControl(oControl.getAggregation("table"));
	        
	        oRm.write("</div>"); 
		}
	});
});