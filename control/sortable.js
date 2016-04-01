sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";
	return Control.extend("sb.control.sortable", {
		metadata : {
			aggregations : {
				content: {type:"sap.ui.core.Control", multiple: true}
			},
			defaultAggregation: "content",
			properties:{
				connectWith: {type:"string", defaultValue: ""},
                name: {type:"string", defaultValue: ""},
                handle: {type:"string", defaultValue: ""},
                placeholder: {type:"string", defaultValue: ""}
			},
			events : {
				change: {
					parameters : {
						newIndex: {type:"int"}
					}
				}
			}
		},
		_start:function(event,ui){
            var $container = $(this.getName()).first();
            ui.item.width($container.width());            
        },
		onAfterRendering: function(){
			$(this.getName()).sortable({
                connectWith: this.getConnectWith(),
                handle: this.getHandle(),
                placeholder:this.getPlaceholder(),
                start:this._start.bind(this)
            });
		},
		renderer : function (oRm, oControl) {
			
			oRm.write("<div class='sortable'"); 
	        oRm.writeControlData(oControl);
			oRm.writeClasses();
			oRm.write(">");
			var aContent = oControl.getContent();
			for(var i=0;i<aContent.length;i++){
				oRm.renderControl(aContent[i]);
			}
			oRm.write("</div>");
		}
	});
});