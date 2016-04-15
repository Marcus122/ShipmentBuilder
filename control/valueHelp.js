sap.ui.define([
    "sap/m/Dialog",
    "sap/ui/model/json/JSONModel",
    "sap/m/Table",
    "sap/m/Button"
], function (Dialog,JSONModel,Table,Button) {
	"use strict";
	return Dialog.extend("sb.control.valueHelp", {
		metadata : {
			events : {
                confirm:{
                    ranges:{type:"array"}
                }
			}
		},
		init : function () {
            Dialog.prototype.init.apply(this, arguments);
            this.oTable = new sap.ui.xmlfragment("sb.fragment.valueHelp",this);
            this.addContent(this.oTable);
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
		},
        setRanges:function(aRange){
            this.setModel(new JSONModel(aRange),"Ranges");
        },
        addRange:function(){
            var aRanges = this.getModel("Ranges").getData();
            aRanges.push({
                operator:"EQ",
                value1:"",
                value2:""
            });
            this.getModel("Ranges").setData(aRanges);
        },
        confirm:function(){
            this.fireConfirm({
                ranges: this.getModel("Ranges").getData()
            });
            this.close();
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