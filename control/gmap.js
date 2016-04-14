sap.ui.define([
	"sap/ui/core/Control"
], function (Control) {
	"use strict";
	return Control.extend("sb.control.gmap", {
		metadata : {
			aggregations : {
				directions: {type:"sb.control.direction", multiple: true}
			},
            properties:{
                zoom:{type:"float",defaultValue:8} ,
                lat:{type:"float",defaultValue:1} ,
                lng:{type:"float",defaultValue:-50},
                height:{type:"sap.ui.core.CSSSize",defaultValue:"20em"},
                width:{type:"sap.ui.core.CSSSize",defaultValue:"100%"},
                apiKey:{type:"string"}
            },
			defaultAggregation: "directions"
		},
		init : function () {
			this.mapId = this.getId() + "-map";
			this._html = new sap.ui.core.HTML({
				content: "<div style='height: " + this.getHeight() + ";width: " + this.getWidth() + ";' id='" + this.mapId + "'></div>"
			});
		},
		exit:function(){
			
		},
        setDirections:function(aDirections){
            this.removeAllAggregation("directions");
            for(var i in aDirections){
                this.addAggregation("directions",aDirections[i]);
            }
            //this._drawDirections();
        },
        _drawDirections:function(){
            var directionsService = new google.maps.DirectionsService;
            var directionsDisplay = new google.maps.DirectionsRenderer;
            var aDirections = this.getDirections();
            if(!aDirections.length) return;
            var oFirst = aDirections[0];
            var oLast = aDirections[aDirections.length-1];
            var waypts=[];
            var max = this.getApiKey() ? aDirections.length-1 : Math.min(aDirections.length-1,8);
            for(var i=1;i<max;i++){
                waypts.push({
                    location: aDirections[i].getLocation(),
                    stopover: true
                });
            }
           // directionsDisplay.set('directions', null);
            directionsDisplay.setMap(this.map);
            directionsService.route({
                origin: oFirst.getLocation(),
                destination: oLast.getLocation(),
                waypoints: waypts,
                optimizeWaypoints: false,
                travelMode: google.maps.TravelMode.DRIVING
            }, function(response, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    directionsDisplay.setDirections(response);
                }
            });
            
        },
		onAfterRendering:function(){
	    	this.map = new google.maps.Map( document.getElementById( this.mapId ), {
                zoom :this.getZoom(),
			    center :new google.maps.LatLng(this.getLat(), this.getLng())
            });
            this._drawDirections();
	    },
		renderer : function (oRm, oControl) {
			oRm.write('<div ');
            oRm.writeControlData(oControl);
            oRm.addStyle("width", 'auto');
            oRm.addStyle("height", 'auto');
            oRm.writeClasses();
            oRm.writeStyles();
            oRm.write('>');
            oRm.renderControl(oControl._html);
            oRm.write('</div>');
		}
	});
});