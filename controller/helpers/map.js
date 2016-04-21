sap.ui.define(["sb/control/gmap","sb/control/direction",], function (Gmap,Direction) {
	"use strict";
    return{
        viewMap:function(oEvent){
            var oButton = oEvent.getSource();
            if(this.oMapContainer.getVisible()){
                oButton.setText("Show map");
                return this.oMapContainer.setVisible(false);
            }
            oButton.setText("Hide map");
            var oShipment = this.getView().getModel(this.vModel).getData();
            if(!oShipment.Orders.length) return;
            var aDirections = [];
            if(oShipment.PlanningPointPostcode){
                aDirections.push(new Direction({
                    location:oShipment.PlanningPointPostcode
                }))
            }
            for(var i in oShipment.Orders){
                aDirections.push(new Direction({
                    location:oShipment.Orders[i].Order.Postcode
                }))
            }
            this.oMapContainer.setVisible(true);
            if(!this.oMap){
                this.oMap = new Gmap({
                    directions:aDirections
                });
                this.oMapContainer.addContent(this.oMap);
            }else{
                this.oMap.setDirections(aDirections);
            }
        }
    }
});