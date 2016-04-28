sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], function( Controller,MessageBox ) {
	"use strict";
	return Controller.extend("sb.controller.main",{
		onInit: function(){
            this.oLeftPanel=this.byId("lhs");
            this.oPage=this.byId("page");
            this.getOwnerComponent().attachConnectionError(this.connectionError,this);
		},
        connectionError:function(){
            var that=this;
            MessageBox.error("Unable to connect",{
                title:"Connection Error",
                actions:[MessageBox.Action.RETRY],
                onClose:function(oEvent){
                    that.getOwnerComponent().oData.loadOData();
                }
            });
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
        },
        saveFixedDefaults:function(){
            var oOwner = this.getOwnerComponent();
            oOwner.oData.saveDefaults(oOwner.oFixedSearch.getData(),oOwner.oUser.getData().id,"F");
        },
        saveOpenDefaults:function(){
            var oOwner = this.getOwnerComponent();
            oOwner.oData.saveDefaults(oOwneroOpenSearch.getData(),oOwner.oUser.getData().id,"O");
        },
        saveGlobalDefaults:function(){
            var oOwner = this.getOwnerComponent();
            oOwner.oData.saveDefaults(oOwner.oSettings.getData(),oOwner.oUser.getData().id,"G");
        },
        resetRefresh:function(){
            this.getOwnerComponent().startRefresh();
        },
        setTimeMutliplier:function(oEvent){
            var i = oEvent.getSource().getValue();
            this.getOwnerComponent().oHelper.setTravelTimeMultiplier(i);
            this.getOwnerComponent().refreshDistances();
        },
        showColourKey:function(oEvent){
            if(!this.oColourKey){
              this.oColourKey=new sap.ui.xmlfragment("sb.fragment.colourKey",this);
          }
          this.oColourKey.openBy(oEvent.getSource());
        },
        clearLocks:function(oEvent){
            var oUser = this.getOwnerComponent().oUser.getData();
            var oSource=oEvent.getSource();
            this.getOwnerComponent().oData.clearUserLocks(oUser.session,function(){
                var vStyle=this.getOwnerComponent().oHelper.getCenterStyleClass(oSource);
                MessageBox.success("Locks removed",{
                    styleClass:vStyle
                });
            }.bind(this));
        }
	});
})