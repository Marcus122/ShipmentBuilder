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
                doMove: {type:"boolean", defaultValue:true},
                paging:{type:"boolean", defaultValue:false},
                itemsPerPage:{type:"int", defaultValue:5},
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
                },
                pagingUpdated:{
                    page:{type:"int"},
                    pages:{type:"int"}
                }
			}
		},
		init : function () {
			this.iPage=1;
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
            if(this.getDoMove()){
                var oTable = this.getAggregation("table");
                var oItems = oTable.getBinding("items");
                var aItems = oTable.getItems();

                var data = oItems.getModel().getProperty(oItems.getPath());
                if(from>data.length-1 || to>data.length-1) return;
                var o = data.splice(from, 1)[0];
                data.splice(to, 0, o);
                //For large tables let row drop before rerendering
                if(data.length > 20){
                    setTimeout(function(){
                        oItems.getModel().setProperty(oItems.getPath(),data);
                        oTable.rerender();
                    },1);
                }
                else{
                    oItems.getModel().setProperty(oItems.getPath(),data);
                    oTable.rerender();
                }
            }
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
        getPages:function(){
           return Math.ceil(this.getAggregation("table").getItems().length / this.getItemsPerPage()) || 1;
        },
        setPage:function(iPage){
            this.iPage=iPage;
            this._doPaging();
        },
        nextPage:function(){
            if(this.iPage === this.getPages()) return;
            this.iPage++;
            this._doPaging();
        },
        prevPage:function(){
            if(this.iPage === 1) return;
            this.iPage--;
            this._doPaging();
        },
        setItemsPerPage:function(i){
            this.setProperty("itemsPerPage",i);
            if(this.iPage > this.getPages()){
                this.iPage=this.getPages();
            }
            this._doPaging();
        },
        _doPaging:function(){
            if(!this.getPaging()) return;
            if(this.iPage > this.getPages()){
                this.iPage=this.getPages();
            }
            var aItems = this.getAggregation("table").getItems();
            var iNumPerPage = this.getItemsPerPage();
            for(var i=0;i<aItems.length;i++){
                var iIndex = i+1;
                if(iIndex > (this.iPage-1) * iNumPerPage && iIndex <= (this.iPage) * iNumPerPage){
                    aItems[i].setVisible(true);
                }else{
                    aItems[i].setVisible(false);
                }
            }
            this.firePagingUpdated({
               page:this.iPage,
               pages:this.getPages() 
            });
        },
		onAfterRendering: function(){
            this.oTable = this.getAggregation("table");
            this._doPaging();
			var that=this;
            if(this.oTable.getDomRef()){
                that.enable();
            }
            this.oTable.addEventDelegate({
                onAfterRendering: function(){
                    that._doPaging();
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