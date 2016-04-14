sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function( Controller ) {
	"use strict";
	return Controller.extend("sb.controller.main",{
		onInit: function(){
            this.oLeftPanel=this.byId("lhs");
            this.oPage=this.byId("page");
		},
        showSettings:function(oEvent){
          if(!this.oSettingsPanel){
              this.oSettingsPanel=new sap.ui.xmlfragment("sb.fragment.settings",this);
              this.getView().addDependent(this.oSettingsPanel);
          }
          this.oSettingsPanel.openBy(oEvent.getSource());
        },
        toggleLeftPanel:function(oEvent){
            var bSelect=oEvent.getParameter("selected");
            if(bSelect){
                this.resize();
                var $page = $(this.oPage.getDomRef());
                var $el = $(this.oLeftPanel.getDomRef())
                $el.scrollTop($page.children("section").scrollTop());
                $(window).on("resize.lhs",this.resize.bind(this));
            }else{
                this.remove();
                $(window).off("resize.lhs");
            }
        },
        resize:function(){
            this.remove();
            var $el = $( this.oLeftPanel.getDomRef() );
            var width=$el.width();
            this.oLeftPanel.addStyleClass("fix-panel");
            $el.width(width);
        },
        remove:function(){
            this.oLeftPanel.removeStyleClass("fix-panel");
            var $el = $( this.oLeftPanel.getDomRef() );
            $el.css("width", "auto");
        }
	});
})