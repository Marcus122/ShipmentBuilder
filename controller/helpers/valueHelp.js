sap.ui.define([], function () {
	"use strict";
    return{
        setRanges:function(oEvent){
            var aRanges = oEvent.getParameter("ranges");
            this.getView().getModel(this.vSearchModel).setProperty("/" + this.vName ,aRanges);
        },
        hideFilterBar:function(oEvent){
            var oLink = oEvent.getSource();
            if(oLink.hidden){
                oLink.hidden=false;
                oLink.setText("Hide Filter Bar");
            }else{
                oLink.hidden=true;
                oLink.setText("Show Filter Bar");
            }
            this.oFilterArea.setVisible(!oLink.hidden);
        },
        onValueHelpOrderType:function(oEvent){
            var oValueHelp = this._getValueHelp();
            var oInput = oEvent.getSource();
            oValueHelp.setTitle("Order Type");
            this.vName=oInput.getCustomData()[0].getValue();
            oValueHelp.setRanges(this.getView().getModel(this.vSearchModel).getProperty("/" + this.vName));
            this.getOwnerComponent().oData.getOrderTypes(function(aTypes){
                var aValues=[];
                for(var i in aTypes){
                    aValues.push({
                       key: aTypes[i].OrderTypeKey,
                       text:aTypes[i].Description
                    });
                }
                oValueHelp.setHelperValues(aValues);
                oValueHelp.open(oInput);
            });
        },
        onValueHelpRegions:function(oEvent){
            var oValueHelp = this._getValueHelp();
            var oInput = oEvent.getSource();
            oValueHelp.setTitle("Regions");
            this.vName=oInput.getCustomData()[0].getValue();
            oValueHelp.setRanges(this.getView().getModel(this.vSearchModel).getProperty("/" + this.vName));
            this.getOwnerComponent().oData.getRegions(function(aRegions){
                var aValues=[];
                for(var i in aRegions){
                    aValues.push({
                       key: aRegions[i].TranspZone,
                       text:aRegions[i].Description
                    });
                }
                oValueHelp.setHelperValues(aValues);
                oValueHelp.open(oInput);
            });
        },
        onValueHelpSubRegions:function(oEvent){
            var oValueHelp = this._getValueHelp();
            var oInput = oEvent.getSource();
            oValueHelp.setTitle("Sub Regions");
            this.vName=oInput.getCustomData()[0].getValue();
            oValueHelp.setRanges(this.getView().getModel(this.vSearchModel).getProperty("/" + this.vName));
            this.getOwnerComponent().oData.getSubRegions(function(aSubRegions){
                var aValues=[];
                for(var i in aSubRegions){
                    aValues.push({
                       key: aSubRegions[i].Region,
                       text:aSubRegions[i].Description
                    });
                }
                oValueHelp.setHelperValues(aValues);
                oValueHelp.open(oInput);
            });
        },
        removeToken:function(oEvent){
            var vName = oEvent.getSource().getParent().getParent().getCustomData()[0].getValue();
            var oRange = oEvent.getSource().getBindingContext(this.vSearchModel).getObject();
            var oModel = this.getView().getModel(this.vSearchModel);
            var aRanges = oModel.getProperty("/" + vName);
            aRanges=this.getOwnerComponent().oHelper.removeObjectFromArray(oRange,aRanges);
            oModel.setProperty("/" + vName,aRanges);
        },
        onValueHelpDate:function(oEvent){
            var oValueHelp = this._getValueHelp();
            var oInput = oEvent.getSource();
            oValueHelp.setTitle("Date");
            this.vName=oInput.getCustomData()[0].getValue();
            oValueHelp.setRanges(this.getView().getModel(this.vSearchModel).getProperty("/" + this.vName));
            oValueHelp.setType("Date");
            oValueHelp.open(oInput);
        }
    }
});