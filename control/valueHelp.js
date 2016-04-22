sap.ui.define([
    "sap/m/Dialog",
    "sap/ui/model/json/JSONModel",
    "sap/m/Table",
    "sap/m/Button"
], function (Dialog,JSONModel,Table,Button) {
	"use strict";
	return Dialog.extend("sb.control.valueHelp", {
		metadata : {
            properties:{
                type:{type:"string",defaultValue:"Text"}
            },
			events : {
                confirm:{
                    ranges:{type:"array"}
                }
			}
		},
		init : function () {
            Dialog.prototype.init.apply(this, arguments);
            var oButton=new Button({
                text:"OK"
            });
            oButton.attachPress(this.confirm,this);
            this.setBeginButton(oButton);
            var oCloseButton=new Button({
                text:"Cancel"
            });
            oCloseButton.attachPress(this.close,this);
            this.setEndButton(oCloseButton);
            this.addStyleClass("sb-input-help");
		},
        onBeforeRendering:function(){
            Dialog.prototype.onBeforeRendering.apply(this, arguments);
            this.setModel(new JSONModel({
                type:this.getType()
            }),"Settings");
        },
        setRanges:function(_aRange){
            var aRange = _aRange || [];
            this.setModel(new JSONModel(aRange),"Ranges");
        },
        addRange:function(){
            var aRanges = this.getModel("Ranges").getData() || [];
            aRanges.push({
                Operation:"EQ",
                Value1:null,
                Value2:null
            });
            this.getModel("Ranges").setData(aRanges);
        },
        confirm:function(){
            var aRanges = this.getModel("Ranges").getData();
            for(var i in aRanges){
                if(aRanges[i].Operation!="BT"){
                    aRanges[i].Value2=null;
                }
            }
            this.fireConfirm({
                ranges: aRanges
            });
            this.close();
        },
        open:function(oBy){
            if(this.getType()==="Date"){
                this.oTable = new sap.ui.xmlfragment("sb.fragment.valueHelpDate",this);
            }else{
                this.oTable = new sap.ui.xmlfragment("sb.fragment.valueHelp",this);
            }
            this.removeAllContent();
            this.addContent(this.oTable);
            this.removeStyleClass("sb-dialog-right");
            this.removeStyleClass("sb-dialog");
            if(oBy){
                var $el = jQuery(oBy.getDomRef());
                var offset = $el.offset().left;
                var width = jQuery(window).width();
                if(offset > width/2){
                    this.addStyleClass("sb-dialog-right");
                }else{
                    this.addStyleClass("sb-dialog");
                }
            }
            Dialog.prototype.open.apply(this, arguments);
        },
        setHelperValues:function(aValues){
            this.setModel(new JSONModel(aValues),"Values");
        },
        removeRange:function(oEvent){
            var oRange = oEvent.getSource().getBindingContext("Ranges").getObject();
            var aRanges = this.getModel("Ranges").getData();
            for(var i in aRanges){
                if(oRange === aRanges[i]){
                    aRanges.splice(i,1);
                    break;
                }
            }
            this.getModel("Ranges").setData(aRanges);
        },
		renderer : {}
	});
});