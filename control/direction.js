sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";
	return Control.extend("sb.control.direction", {
		metadata : {
            properties:{
                location:{type:"string"}
            }
		},
		init : function () {
		},
		renderer : {}
	});
});