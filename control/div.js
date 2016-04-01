sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";
	return Control.extend("sb.control.div", {
		metadata : {
			aggregations : {
				content: {type:"sap.ui.core.Control", multiple: true}
			},
			defaultAggregation: "content",
			events: {
	              "press" : {}
			}
		},
		init : function () {
			
		},
		exit:function(){
			
		},
		onAfterRendering:function(){
	    	var that = this;
	    	var $input = jQuery(this.getDomRef());
	    	jQuery(this.getDomRef()).off("click").on("click",function(){
	    		that.firePress();
	    	});
	    },
		renderer : function (oRM, oControl) {
			oRM.write("<div");
			oRM.writeControlData(oControl);
			oRM.writeClasses();
			oRM.write(">");
			var aContent = oControl.getContent();
			for(var i=0;i<aContent.length;i++){
				oRM.renderControl(aContent[i]);
			}
			oRM.write("</div>");
		}
	});
});