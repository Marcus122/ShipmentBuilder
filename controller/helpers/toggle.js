sap.ui.define([], function () {
	"use strict";
    return{
        toggleBox:function(oEvent){
            if(this.bOpen===undefined) this.bOpen=true;
            var oButton = oEvent.getSource();
            this.bOpen = !this.bOpen;
            this.oToggleArea.setVisible(this.bOpen);
            if(this.bOpen){
                oButton.setIcon("sap-icon://navigation-up-arrow");
            }else{
                oButton.setIcon("sap-icon://navigation-down-arrow");
            }
        }
    }
});