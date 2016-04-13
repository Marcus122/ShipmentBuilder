sap.ui.define([
 "sap/ui/base/ManagedObject",
 "sap/ui/model/json/JSONModel",
 "sb/data/data",
 "sb/data/helper"
 ], function (Object,JSONModel,Data,Helper) {
	"use strict";
	return Object.extend("sb.data.shipment", {
		metadata : {
            events:{
                orderRemoved:{
                    order:{type:"object"},
                    drop:{type:"int"}       
                },
                shipmentUpdated:{},
                lastDropUpdated:{}
            },
            properties:{
                recalculateDropDistances:{type:"boolean",defaultValue:false}
            }
		},
        init:function(_oShipment){
            this.oData=Data;
            this.oHelper=Helper;
            this.setShipment();
        },
        setStartTime:function(Time){
            if(!(Time instanceof Date)){
                throw "Not a time";
            }
            this.oShipment.setProperty("/StartTime",Time);
            this.calculateRunningTotals();
        },
        setShipment:function(_oShipment){
            var oShipment=_oShipment || {};
            oShipment=this._mapData(oShipment);
            this.oShipment=new JSONModel(oShipment);
            this.oShipment.setDefaultBindingMode("OneWay");
            if(oShipment.Lines.length){
                this.recalculateDrops();
            }
        },
        calcStartTime:function(){
            var oDrop = this.oShipment.getProperty("/Lines/0");
            if(!oDrop || !oDrop.Order.FixedDateTime) return;
            var hours = oDrop.Order.FixedDateTime.getHours();
            var minutes = oDrop.Order.FixedDateTime.getMinutes();
            if(hours === 0 && minutes === 0) return;
            var start = new Date(oDrop.Order.FixedDateTime.getTime());
            var time = oDrop.Time || 0;
            start.setMinutes(start.getMinutes() - time);
            this.setStartTime(start);
        },
        getModel:function(){
            return this.oShipment;  
        },
        _mapData:function(_oShipment){
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
            for(var i in _oShipment){
                oShipment[i]=_oShipment[i];
            }
            return oShipment;
        },
        calculateTotals:function(){
            this.calculateRouteTotals();
            this.calculateVanTotals();
            this.calculateRunningTotals();
        },
        getLastDropPostcode:function(){
            var aLines = this.oShipment.getProperty("/Lines");
            return aLines.length ? this.oHelper.getShortPostcode(aLines[aLines.length-1].Order.Postcode) : this.getShippingPointPostcode();
        },
        calculateRouteTotals:function(){
             var aLines = this.oShipment.getProperty("/Lines");
             var iTotalDistance = aLines.reduce(function(p,c){
                var distance = isNaN(c.Distance) ? 0 : c.Distance;
                return p + distance;
            },0);
            if(this.numberOfDecimals(iTotalDistance) > 3){
                iTotalDistance=iTotalDistance.toFixed(3);
                iTotalDistance-Number(iTotalDistance.toString());
            }
            var iTotalTime = aLines.reduce(function(p,c){
                var time = isNaN(c.Time) ? 0 : c.Time;
                return p + time;
            },0);
            if(this.numberOfDecimals(iTotalTime) > 3){
                iTotalTime=iTotalTime.toFixed(3);
                iTotalTime-Number(iTotalTime.toString());
            }
            this.oShipment.setProperty("/Distance",iTotalDistance);
            this.oShipment.setProperty("/Time",iTotalTime);
        },
        calculateVanTotals:function(){
            var aLines = this.oShipment.getProperty("/Lines");
            var iTotalVol = aLines.reduce(function(p,c){
                var vol = c.Order.Volume || 0;
                return p + vol;
            },0);
            var iTotalKg = aLines.reduce(function(p,c){
                var kg = c.Order.Kg || 0;
                return p + kg;
            },0);
            this.oShipment.setProperty("/Vol",iTotalVol);
            this.oShipment.setProperty("/Kg",iTotalKg);
        },
        calculateRunningTotals:function(){
            var aLines = this.oShipment.getProperty("/Lines");
            var oCurrentTime = this.oShipment.getProperty("/StartTime");
            if(!oCurrentTime) return;
            var tipTime = 0;
            for(var i in aLines){
                if(isNaN(aLines[i].Time)) break;
                oCurrentTime.setMinutes( oCurrentTime.getMinutes() + aLines[i].Time + tipTime );
                aLines[i].ActualTime = new Date(oCurrentTime.getTime());
                tipTime=aLines[i].TipTime || 0;
            }
            this.oShipment.setProperty("/Lines",aLines);
        },
        addDrop:function(oOrder,iDrop){
            var aLines = this.oShipment.getProperty("/Lines");
            var newLine = {
                Drop:iDrop || aLines.length + 1,
                Order: oOrder,
                Distance:oOrder.Distance,
                Time:oOrder.Time,
                TipTime:oOrder.TipTime || 60
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
            this.oShipment.setProperty("/Lines",aLines);
            if(newLine.Drop === aLines.length){
                //Do we need to calculate a distance and time?
                if(this.getRecalculateDropDistances()){
                    this.calculateDropDistance(newLine);
                }
                this.refreshShipment();
                this.fireLastDropUpdated();
            }else{
                this.recalculateDrops();
            }
        },
        removeDrop:function(oDrop){
            var aLines = this.oShipment.getProperty("/Lines");
            for(var i in aLines){
                if(aLines[i].Drop === oDrop.Drop){
                    aLines.splice(i,1);
                    break;
                }
            }
            this.oShipment.setProperty("/Lines",aLines);
            //this._putOrderBack(oDrop.Order);
            this.fireOrderRemoved({
               order: oDrop.Order,
               drop:oDrop.Drop
            });
            if(Number(oDrop.Drop) === aLines.length+1){//Removed last drop
                //this.updateOrderDistances();
                this.fireLastDropUpdated();
                this.refreshShipment();
            }else{
                this.recalculateDrops();
            }
        },
        refreshShipment:function(){
            var aLines = this.oShipment.getProperty("/Lines");
            //see if any drop numbers have changed
            var aChanged = aLines.filter(function(oLine,i){
                return Number(oLine.Drop) != Number(i+1);
            });
            if(aChanged.length){
                aLines = this._renumberDrops(aLines);
                this.oShipment.setProperty("/Lines",aLines);
            }
            this.calculateTotals();
            this.fireShipmentUpdated();
        },
        _renumberDrops:function(aDrops){
            return aDrops.map(function(oDrop,i){
                oDrop.Drop = i+1;
                return oDrop;
            });
        },
        numberOfDecimals:function(i){
            if(isNaN(i)) return 0;
            var parts = String(i).split(".");
            if(parts.length === 1) return 0;
            return parts[1].split("").length;
        },
        setShippingPoint:function(oShipppingPoint){
            if(this.oShipment.getProperty("/ShippingPoint")===oShipppingPoint.id) return;
            this.oShipment.setProperty("/ShippingPoint",oShipppingPoint.id);
            var aLines = this.oShipment.getProperty("/Lines");
            if(!aLines.length){
                this.fireLastDropUpdated();
            }else{
                this.recalculateDrops();
            }
        },
        recalculateDrops:function(){
            var that=this;
            var aLines = this.oShipment.getProperty("/Lines");
            if(!aLines) return;
            this.refreshShipment();
            var aPostcodes = aLines.map(function(oLine){ 
                return that.oHelper.getShortPostcode(oLine.Order.Postcode);
            });
            var prevPostcode = this.oHelper.getShortPostcode(this.getShippingPointPostcode());
            this.oData.startNewBatch();
            for(var i in aPostcodes){
                var oDrop = aLines[i];
                if(aPostcodes[i] === prevPostcode){//Save making a request if postcodes are equal
                    oDrop.Distance=oDrop.Time=0;
                    this.oShipment.setProperty("/Lines/" + String(Number(oDrop.Drop) - 1),oDrop);
                }else{
                    if(prevPostcode){
                        this.oData.addBatchDistance([aPostcodes[i]],prevPostcode);
                    }
                }
                prevPostcode=this.oHelper.getShortPostcode(oDrop.Order.Postcode);
            }
            this.oData.submitBatchDistance(function(aResults){
                var prevPostcode = this.getShippingPointPostcode();
                for(var i in aLines){
                    var oObj=that.oHelper.getDistance(aLines[i].Order.Postcode,prevPostcode,aResults);
                    aLines[i].Distance=oObj.Distance;
                    aLines[i].Time=oObj.Time;
                    prevPostcode=aLines[i].Order.Postcode;
                }
                that.oShipment.setProperty("/Lines",aLines);
                that.refreshShipment();
                /*var oDrop = this;
                var oObj=that.oHelper.getDistance(oDrop.Order.Postcode,vPostcode,aResults);
                oDrop.Distance=oObj.Distance;
                oDrop.Time=oObj.Time;
                that.oShipment.setProperty("/Lines/" + String(Number(oDrop.Drop) - 1),oDrop);
                iTotal++;
                if(iTotal===aLines.length){
                    that.refreshShipment();
                }*/
            }.bind(this));
        },
        calculateDropDistance:function(oDrop){
             var aLines = this.oShipment.getProperty("/Lines");
             var that=this;
             var vPostcode = this.oHelper.getShortPostcode(oDrop.Order.Postcode);
             var oPrevDrop = aLines[Number(oDrop.Drop)-2];
             var prevPostcode = this.oHelper.getShortPostcode(oPrevDrop.Order.Postcode);
             this.oData.getDistanceFromPostode([vPostcode],prevPostcode,function(aResults,vPostcode){
                var oDrop = this;
                var oObj=that.oHelper.getDistance(oDrop.Order.Postcode,vPostcode,aResults);
                oDrop.Distance=oObj.Distance;
                oDrop.Time=oObj.Time;
                that.oShipment.setProperty("/Lines/" + String(Number(oDrop.Drop) - 1),oDrop);
            }.bind(oDrop));
        },
        getShippingPointPostcode:function(){
            var vShippingPoint = this.oShipment.getProperty("/ShippingPoint");
            var aShippingPoints = this.oData.getShippingPoints();
            for(var i in aShippingPoints){
                if(aShippingPoints[i].id === vShippingPoint){
                    return aShippingPoints[i].postcode;
                }
            }
        },
        settDropDistances:function(aResults,vPostcode){
            var aLines = this.oShipment.getProperty("/Lines");
            for(var i in aLines){
                var oObj=this.getDistance(aLines[i].Postcode,vPostcode,aResults);
                aLines[i].Distance=oObj.Distance;
                aLines[i].Time=oObj.Time;
            }
            this.oShipment.setProperty("/",aLines);
            this.refreshShipment();
        }
	});
});