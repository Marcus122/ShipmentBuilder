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
                lastDropUpdated:{},
                shipmentCreated:{}
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
            //this.oShipment.setDefaultBindingMode("OneWay");
            if(oShipment.PlanningPointPostcode){
                this.recalculateDrops();
            }
            else{
                this._setShippingPointPostcode();
            }
        },
        calcStartTime:function(){
            var oDrop = this.oShipment.getProperty("/Orders/0");
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
        getOrders:function(){
           return this.oShipment.getProperty("/Orders");
        },
        _mapData:function(_oShipment){
            var oShipment={
                ShipmentNum:"",
                StartDate:null,
                StartTime:null,
                EndDate:null,
                EndTime:null,
                PlanningPoint:"",
                PlanningPointPostcode:"",
                ShipmentType:"",
                Distance:0,
                Time:0,
                Kg:0,
                Vol:0,
                Orders:[]
            } 
            for(var i in _oShipment){
                oShipment[i]=_oShipment[i];
            }
            return oShipment;
        },
        create:function(fCallbackS,fCallbackF){
            if(this.isValid()){
                 this.oData.createShipment(this.oShipment.getData(),function(){
                     this.fireShipmentCreated();
                     fCallbackS();
                }.bind(this),fCallbackF);
            }else{
                fCallbackF({error:true,message:"Please fill in all required fields"});
            }
        },
        isValid:function(){
           var oShipment = this.oShipment.getData();
           if(!oShipment.StartDate || !oShipment.StartTime || !oShipment.EndDate || !oShipment.EndTime || !oShipment.PlanningPoint || !oShipment.ShipmentNum){
               return false;
           }
           return true;
        },
        calculateTotals:function(){
            this.calculateRouteTotals();
            this.calculateVanTotals();
            this.calculateRunningTotals();
        },
        getLastDropPostcode:function(){
            var aOrders = this.oShipment.getProperty("/Orders");
            return aOrders.length ? this.oHelper.getShortPostcode(aOrders[aOrders.length-1].Order.Postcode) : this.getShippingPointPostcode();
        },
        calculateRouteTotals:function(){
             var aOrders = this.oShipment.getProperty("/Orders");
             var iTotalDistance = aOrders.reduce(function(p,c){
                var distance = isNaN(c.Distance) ? 0 : c.Distance;
                return p + distance;
            },0);
            if(this.numberOfDecimals(iTotalDistance) > 3){
                iTotalDistance=iTotalDistance.toFixed(3);
                iTotalDistance-Number(iTotalDistance.toString());
            }
            var iTotalTime = aOrders.reduce(function(p,c){
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
            var aOrders = this.oShipment.getProperty("/Orders");
            var iTotalVol = aOrders.reduce(function(p,c){
                var vol = c.Order.Volume || 0;
                return p + vol;
            },0);
            var iTotalKg = aOrders.reduce(function(p,c){
                var kg = c.Order.Kg || 0;
                return p + kg;
            },0);
            this.oShipment.setProperty("/Vol",iTotalVol);
            this.oShipment.setProperty("/Kg",iTotalKg);
        },
        calculateRunningTotals:function(){
            var aOrders = this.oShipment.getProperty("/Orders");
            var oStartTime = this.oShipment.getProperty("/StartTime");
            if(!oStartTime) return;
            var oCurrentTime = new Date(oStartTime.getTime());
            var tipTime = 0;
            for(var i in aOrders){
                if(isNaN(aOrders[i].Time)) break;
                oCurrentTime.setMinutes( oCurrentTime.getMinutes() + aOrders[i].Time + tipTime );
                aOrders[i].ActualTime = new Date(oCurrentTime.getTime());
                tipTime=aOrders[i].TipTime || 0;
            }
            this.oShipment.setProperty("/Orders",aOrders);
        },
        addDrop:function(oOrder,iDrop){
            var aOrders = this.oShipment.getProperty("/Orders");
            var newLine = {
                Drop:iDrop || aOrders.length + 1,
                Order: oOrder,
                Distance:oOrder.Distance,
                Time:oOrder.Time,
                TipTime:oOrder.TipTime || 60
            }
            //Renumber drops
            aOrders.map(function(oLine){
                if(oLine.Drop >= newLine.Drop) oLine.Drop++;
                return oLine;
            })
            aOrders.push(newLine);
            aOrders.sort(function(a,b){
                return a.Drop - b.Drop;
            });
            this.oShipment.setProperty("/Orders",aOrders);
            if(newLine.Drop === aOrders.length){
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
            var aOrders = this.oShipment.getProperty("/Orders");
            for(var i in aOrders){
                if(aOrders[i].Drop === oDrop.Drop){
                    aOrders.splice(i,1);
                    break;
                }
            }
            this.oShipment.setProperty("/Orders",aOrders);
            //this._putOrderBack(oDrop.Order);
            this.fireOrderRemoved({
               order: oDrop.Order,
               drop:oDrop.Drop
            });
            if(Number(oDrop.Drop) === aOrders.length+1){//Removed last drop
                //this.updateOrderDistances();
                this.fireLastDropUpdated();
                this.refreshShipment();
            }else{
                this.recalculateDrops();
            }
        },
        refreshShipment:function(){
            var aOrders = this.oShipment.getProperty("/Orders");
            //see if any drop numbers have changed
            var aChanged = aOrders.filter(function(oLine,i){
                return Number(oLine.Drop) != Number(i+1);
            });
            if(aChanged.length){
                aOrders = this._renumberDrops(aOrders);
                this.oShipment.setProperty("/Orders",aOrders);
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
            if(this.oShipment.getProperty("/PlanningPoint")===oShipppingPoint.PlanningPointKey) return;
            this.oShipment.setProperty("/PlanningPoint",oShipppingPoint.PlanningPointKey);
            this.oShipment.setProperty("/PlanningPointPostcode",oShipppingPoint.Address.Postcode);
            var aOrders = this.oShipment.getProperty("/Orders");
            if(!aOrders.length){
                this.fireLastDropUpdated();
            }else{
                this.recalculateDrops();
            }
        },
        recalculateDrops:function(){
            var that=this;
            var aOrders = this.oShipment.getProperty("/Orders");
            if(!aOrders) return;
            this.refreshShipment();
            var aPostcodes = aOrders.map(function(oLine){ 
                return that.oHelper.getShortPostcode(oLine.Order.Postcode);
            });
            var prevPostcode = this.oHelper.getShortPostcode(this.getShippingPointPostcode());
            this.oData.startNewBatch();
            for(var i in aPostcodes){
                var oDrop = aOrders[i];
                if(aPostcodes[i] === prevPostcode){//Save making a request if postcodes are equal
                    oDrop.Distance=oDrop.Time=0;
                    this.oShipment.setProperty("/Orders/" + String(Number(oDrop.Drop) - 1),oDrop);
                }else{
                    if(prevPostcode){
                        this.oData.addBatchDistance([aPostcodes[i]],prevPostcode);
                    }
                }
                prevPostcode=this.oHelper.getShortPostcode(oDrop.Order.Postcode);
            }
            this.oData.submitBatchDistance(function(aResults){
                var prevPostcode = this.getShippingPointPostcode();
                for(var i in aOrders){
                    var oObj=that.oHelper.getDistance(aOrders[i].Order.Postcode,prevPostcode,aResults);
                    aOrders[i].Distance=oObj.Distance;
                    aOrders[i].Time=oObj.Time;
                    prevPostcode=aOrders[i].Order.Postcode;
                }
                that.oShipment.setProperty("/Orders",aOrders);
                that.refreshShipment();
            }.bind(this));
        },
        calculateDropDistance:function(oDrop){
             var aOrders = this.oShipment.getProperty("/Orders");
             var that=this;
             var vPostcode = this.oHelper.getShortPostcode(oDrop.Order.Postcode);
             var oPrevDrop = aOrders[Number(oDrop.Drop)-2];
             var prevPostcode = this.oHelper.getShortPostcode(oPrevDrop.Order.Postcode);
             this.oData.getDistanceFromPostode([vPostcode],prevPostcode,function(aResults,vPostcode){
                var oDrop = this;
                var oObj=that.oHelper.getDistance(oDrop.Order.Postcode,vPostcode,aResults);
                oDrop.Distance=oObj.Distance;
                oDrop.Time=oObj.Time;
                that.oShipment.setProperty("/Orders/" + String(Number(oDrop.Drop) - 1),oDrop);
            });
        },
        getShippingPointPostcode:function(){
            return this.oShipment.getProperty("/PlanningPointPostcode");
        },
        _setShippingPointPostcode:function(){
            var vShippingPoint = this.oShipment.getProperty("/PlanningPoint");
            this.oData.getShippingPoints(function(aShippingPoints){
                for(var i in aShippingPoints){
                    if(aShippingPoints[i].PlanningPointKey === vShippingPoint){
                        this.oShipment.setProperty("/PlanningPointPostcode",aShippingPoints[i].Address.Postcode);
                        this.recalculateDrops();
                        return;
                    }
                }
            }.bind(this));
        },
        settDropDistances:function(aResults,vPostcode){
            var aOrders = this.oShipment.getProperty("/Orders");
            for(var i in aOrders){
                var oObj=this.getDistance(aOrders[i].Postcode,vPostcode,aResults);
                aOrders[i].Distance=oObj.Distance;
                aOrders[i].Time=oObj.Time;
            }
            this.oShipment.setProperty("/Orders",aOrders);
            this.refreshShipment();
        }
	});
});