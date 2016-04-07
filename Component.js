sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
    "sb/data/Data"
], function (UIComponent, JSONModel, Data) {
	"use strict";

	return UIComponent.extend("sb.Component", {

		metadata: {
			manifest: "json",
            events:{
                newShipmentUpdated:{},
                existingShipmentUpdated:{}
            }
		},

		init: function () {

			// call the init function of the parent
			UIComponent.prototype.init.apply(this, arguments);
            
            this.oData = new Data();
            
            this.oExistingShipment = new JSONModel({});
            this.setModel(this.oExistingShipment,"ExistingShipment");
            
            this.oExistingShipments = new JSONModel("./data/ExistingShipments.json");
            this.setModel(this.oExistingShipments,"ExistingShipments");
            
            this.oFixedOrders = new JSONModel("./data/Orders.json");
            this.setModel(this.oFixedOrders,"Orders");
            
            this.oOpenOrders = new JSONModel("./data/OpenOrders.json");
            this.setModel(this.oOpenOrders,"OpenOrders");
            
            this.oBackloadOrders = new JSONModel("./data/Backload.json");
            this.setModel(this.oBackloadOrders,"Backload");
            
            this.oShippingPoints=new JSONModel([{id:"1000",text:"Wardle",postcode:"CW56"},{id:"2000",text:"Deeside",postcode:"CW56"},{id:"3000",text:"Central",postcode:"CW56"}]);
            this.setModel(this.oShippingPoints,"ShippingPoints");
            
            this.createNewShipment();
		},
        createNewShipment:function(oShipment){
            this.oNewShipment = new JSONModel(this.getBlankShipment());
            this.setModel(this.oNewShipment,"NewShipment");
        },
        numberOfDecimals:function(i){
            if(isNaN(i)) return 0;
            var parts = String(i).split(".");
            if(parts.length === 1) return 0;
            return parts[1].split("").length;
        },
        getBlankShipment:function(){
          var oShipment={
                Ref:"",
                StartDate:null,
                StartTime:null,
                EndDate:null,
                EndTime:null,
                ShippingPoint:"",
                ShipmentType:"",
                Distance:0,
                Time:0,
                Kg:0,
                Vol:0,
                Lines:[]
            } 
            return oShipment;
        },
        getShippingPointPostcode:function(){
            var vShippingPoint = this.oNewShipment.getProperty("/ShippingPoint");
            var aShippingPoints = this.oShippingPoints.getData();
            for(var i in aShippingPoints){
                if(aShippingPoints[i].id === vShippingPoint){
                    return aShippingPoints[i].postcode;
                }
            }
        },
        addToNewShipment:function(oOrder,iDrop){
            var aLines = this.oNewShipment.getProperty("/Lines");
            var newLine = {
                Drop:iDrop || aLines.length + 1,
                Order: oOrder,
                Distance:oOrder.Distance,
                Time:oOrder.Time
            }
            //Renumber drops
            aLines.map(function(oLine){
                if(oLine.Drop >= newLine.Drop) oLine.Drop++;
                return oLine;
            })
            aLines.push(newLine);
            aLines.sort(function(a,b){
                return a.Drop - b.Drop;
            });
            this.oNewShipment.setProperty("/Lines",aLines);
            if(newLine.Drop === aLines.length){
                this.updateOrderDistances();
                this.refreshNewShipment();
            }else{
                this.recalculateNewShipmentDrops();
            }
        },
        setShippingPoint:function(oShipppingPoint){
            if(this.oNewShipment.getProperty("/ShippingPoint")===oShipppingPoint.id) return;
            this.oNewShipment.setProperty("/ShippingPoint",oShipppingPoint.id);
            var aLines = this.oNewShipment.getProperty("/Lines");
            if(!aLines.length){
                this.updateOrderDistances();
            }else{
                this.recalculateNewShipmentDrops();
            }
        },
        recalculateNewShipmentDrops:function(){
            var that=this;
            var aLines = this.oNewShipment.getProperty("/Lines");
            if(!aLines) return;
            this.refreshNewShipment();
            var aPostcodes = aLines.map(function(oLine){ 
                return that.getShortPostcode(oLine.Order.Postcode);
            });
            var prevPostcode = this.getShippingPointPostcode();
            for(var i in aPostcodes){
                var oDrop = aLines[i];
                var aList = [aPostcodes[i]];
                this.oData.getDistanceFromPostode(aList,prevPostcode,function(aResults,vPostcode){
                    var oDrop = this;
                    var oObj=that.getDistance(oDrop.Order.Postcode,vPostcode,aResults);
                    oDrop.Distance=oObj.Distance;
                    oDrop.Time=oObj.Time;
                    that.oNewShipment.setProperty("/Lines/" + String(Number(oDrop.Drop) - 1),oDrop);
                    that.refreshNewShipment();
                }.bind(oDrop));
                prevPostcode=this.getShortPostcode(oDrop.Order.Postcode);
            }
        },
        setNewShipmentDropDistances:function(aResults,vPostcode){
            var aLines = this.oNewShipment.getProperty("/Lines");
            for(var i in aLines){
                var oObj=this.getDistance(aLines[i].Postcode,vPostcode,aResults);
                aLines[i].Distance=oObj.Distance;
                aLines[i].Time=oObj.Time;
            }
            this.oNewShipment.setProperty("/",aLines);
            this.refreshNewShipment();
        },
        refreshNewShipment:function(){
            var aLines = this.oNewShipment.getProperty("/Lines");
            //see if any drop numbers have changed
            var aChanged = aLines.filter(function(oLine,i){
                return Number(oLine.Drop) != Number(i+1);
            });
            if(aChanged.length){
                aLines = this._renumberDrops(aLines);
                this.oNewShipment.setProperty("/Lines",aLines);
            }
            var iTotalDistance = aLines.reduce(function(p,c){
                return p + c.Distance;
            },0);
            if(isNaN(iTotalDistance)) {
                iTotalDistance = "N/A";
            }else if(this.numberOfDecimals(iTotalDistance) > 3){
                iTotalDistance=iTotalDistance.toFixed(3);
            }
            var iTotalTime = aLines.reduce(function(p,c){
                return p + c.Time;
            },0);
            if(isNaN(iTotalTime)){
              iTotalTime = "N/A";  
            }else if(this.numberOfDecimals(iTotalTime) > 3){
                iTotalTime=iTotalTime.toFixed(3);
            }
            var iTotalVol = aLines.reduce(function(p,c){
                var vol = c.Order.Volume || 0;
                return p + vol;
            },0);
            var iTotalKg = aLines.reduce(function(p,c){
                var kg = c.Order.Kg || 0;
                return p + kg;
            },0);
            this.oNewShipment.setProperty("/Distance",iTotalDistance);
            this.oNewShipment.setProperty("/Time",iTotalTime);
            this.oNewShipment.setProperty("/Vol",iTotalVol);
            this.oNewShipment.setProperty("/Kg",iTotalKg);
            this.fireNewShipmentUpdated();
        },
        removeNewShipmentDrop:function(oDrop){
            var aLines = this.oNewShipment.getProperty("/Lines");
            for(var i in aLines){
                if(aLines[i].Drop === oDrop.Drop){
                    aLines.splice(i,1);
                    break;
                }
            }
            this.oNewShipment.setProperty("/Lines",aLines);
            this._putOrderBack(oDrop.Order);
            if(Number(oDrop.Drop) === aLines.length+1){//Removed last drop
                this.updateOrderDistances();
                this.refreshNewShipment();
            }else{
                this.recalculateNewShipmentDrops();
            }
        },
        updateOrderDistances:function(){
            var aLines = this.oNewShipment.getProperty("/Lines");
            var vPostcode = aLines.length ? this.getShortPostcode(aLines[aLines.length-1].Order.Postcode) : this.getShippingPointPostcode();
            var that=this;
            var aFixedLines = this.oFixedOrders.getData().map(function(oLine){ 
                return that.getShortPostcode(oLine.Postcode);
            });
            var aOpenLines = this.oOpenOrders.getData().map(function(oLine){ 
                return that.getShortPostcode(oLine.Postcode);
            });
            var aBackloadLines = this.oBackloadOrders.getData().map(function(oLine){ 
                return that.getShortPostcode(oLine.Postcode);
            });
            //merge arrays
            var aPostcodes = aFixedLines.concat(aOpenLines,aBackloadLines);
            this.oData.getDistanceFromPostode(aPostcodes,vPostcode,this.setDistances.bind(this));
            
        },
        setDistances:function(aResults,vPostcode){
            var aFixedLines = this.oFixedOrders.getData();
            for(var i in aFixedLines){
                var oObj=this.getDistance(aFixedLines[i].Postcode,vPostcode,aResults);
                aFixedLines[i].Distance=oObj.Distance;
                aFixedLines[i].Time=oObj.Time;
            }
            aFixedLines = this.sortArray(aFixedLines,"Distance",true);
            this.oFixedOrders.setProperty("/",aFixedLines);
            
            var aOpenLines = this.oOpenOrders.getData();
            for(var i in aOpenLines){
                var oObj=this.getDistance(aOpenLines[i].Postcode,vPostcode,aResults);
                aOpenLines[i].Distance=oObj.Distance;
                aOpenLines[i].Time=oObj.Time;
            }
            aOpenLines = this.sortArray(aOpenLines,"Distance",true);
            this.oOpenOrders.setProperty("/",aOpenLines);
            
            var aBackloadLines = this.oBackloadOrders.getData();
            for(var i in aBackloadLines){
                var oObj=this.getDistance(aBackloadLines[i].Postcode,vPostcode,aResults);
                aBackloadLines[i].Distance=oObj.Distance;
                aBackloadLines[i].Time=oObj.Time;
            }
            aBackloadLines = this.sortArray(aBackloadLines,"Distance",true);
            this.oBackloadOrders.setProperty("/",aBackloadLines);
           
        },
        getDistance:function(Target,Source,aResults){
            var Postcode = this.getShortPostcode(Target);
            if(Postcode === Source){
                return {
                    Distance:0,
                    Time:0
                }
            }
            var oResult = aResults[Postcode];
            if(oResult){
                return {
                    Distance:oResult.Distance,
                    Time:oResult.Time
                }
            }else{
                return {
                    Distance:"N/A",
                    Time:"N/A"
                }
            }
        },
        getShortPostcode:function(Postcode){
            var aParts = Postcode.split(" ");
            if(aParts.length > 1){
                 return aParts[0] + aParts[1].substring(0,1);
            }else{
                 return aParts[0].substring(0,4);
            }
        },
        setExistingShipment:function(oShipment){
            this.oExistingShipment.setData(oShipment);
            this.setModel(this.oExistingShipment,"ExistingShipment");
        },
        addToExistingShipment:function(oOrder,iDrop){
            var aLines = this.oExistingShipment.getProperty("/Lines");
            var newLine = {
                Drop:iDrop || aLines.length + 1,
                Order: oOrder
            }
            //Renumber drops
            aLines.map(function(oLine){
                if(oLine.Drop >= newLine.Drop) oLine.Drop++;
                return oLine;
            })
            aLines.push(newLine);
            aLines.sort(function(a,b){
                return a.Drop - b.Drop;
            });
            this.oExistingShipment.setProperty("/Lines",aLines);
            this.fireExistingShipmentUpdated();
        },
        refreshExistingShipment:function(){
            var aLines = this.oExistingShipment.getProperty("/Lines");
            //see if any drop numbers have changed
            var aChanged = aLines.filter(function(oLine,i){
                return Number(oLine.Drop) != Number(i+1);
            });
            if(aChanged.length){
                aLines = this._renumberDrops(aLines);
                this.oExistingShipment.setProperty("/Lines",aLines);
            }
            this.fireExistingShipmentUpdated();
        },
        removeExistingShipmentDrop:function(oDrop){
            var aLines = this.oExistingShipment.getProperty("/Lines");
            for(var i in aLines){
                if(aLines[i].Drop === oDrop.Drop){
                    aLines.splice(i,1);
                    break;
                }
            }
            this.oExistingShipment.setProperty("/Lines",aLines);
            this._putOrderBack(oDrop.Order);
            this.refreshExistingShipment();
        },
        _renumberDrops:function(aDrops){
            return aDrops.map(function(oDrop,i){
                oDrop.Drop = i+1;
                return oDrop;
            });
        },
        _putOrderBack:function(oOrder){
            if(oOrder.Open){
                this.addOpenOrder(oOrder);
            }else if(oOrder.Backload){
                this.addBackloadOrder(oOrder);
            }else{
                this.addFixedOrder(oOrder);
            }
        },
        addOpenOrder:function(oOrder){
            var aOrders = this.oOpenOrders.getData() || [];
            aOrders.push(oOrder);
            this.oOpenOrders.setData(aOrders);
        },
        addFixedOrder:function(oOrder){
            var aOrders = this.oFixedOrders.getData() || [];
            aOrders.push(oOrder);
            this.oFixedOrders.setData(aOrders);
        },
        addBackloadOrder:function(oOrder){
            var aOrders = this.oBackloadOrders.getData() || [];
            aOrders.push(oOrder);
            this.oBackloadOrders.setData(aOrders);
        },
        sortArray:function(Array,sColumn,bAscending){
            if(bAscending){
                return Array.sort(function(a,b){
                    if( a[sColumn] < b[sColumn] ) return -1;
                    if( a[sColumn] > b[sColumn] ) return 1;
                    return 0;
                });
            }else{
                return Array.sort(function(a,b){
                    if( a[sColumn] < b[sColumn] ) return 1;
                    if( a[sColumn] > b[sColumn] ) return -1;
                    return 0;
               });
           }
        },
	});

});
