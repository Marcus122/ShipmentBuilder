sap.ui.define([
 "sap/ui/base/ManagedObject",
 "sap/ui/model/json/JSONModel",
 "sb/data/data",
 "sb/data/helper",
 "sb/data/formatter"
 ], function (Object,JSONModel,Data,Helper,formatter) {
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
                shipmentCreated:{},
                shipmentSaved:{}
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
            oShipment.New=false;
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
        calcEndTime:function(){
            var aDrops = this.oShipment.getProperty("/Orders");
            var vEndPostcode=this.oShipment.getProperty("/EndPointPostcode");
            if(!aDrops.length || !vEndPostcode) return;
            var oLastDrop = aDrops[aDrops.length-1];
            if(!oLastDrop.ActualTime) return;
            var EndPointPostcode = this.oHelper.getShortPostcode(vEndPostcode);
            var LastDropPostcode = this.oHelper.getShortPostcode(oLastDrop.Order.Postcode);
            this.oData.getDistanceFromPostode([LastDropPostcode],EndPointPostcode,function(aResults){
                if(aResults.length){
                    var end = new Date(oLastDrop.ActualTime.getTime());
                    end.setMinutes(end.getMinutes() + Number(aResults[0].TravelTime) + oLastDrop.TipTime);
                    this.oShipment.setProperty("/EndTime",end);
                }
            }.bind(this));
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
                StartDateTime:null,
                StartTime:null,
                EndDateTime:null,
                EndTime:null,
                PlanningPoint:"",
                PlanningPointPostcode:"",
                EndPoint:"",
                EndPointPostcode:"",
                ShipmentType:"",
                TravelDistance:0,
                TravelTime:0,
                Kg:0,
                Vol:0,
                New:true,
                FirstDropTown:"",
                Orders:[]
            } 
            for(var i in _oShipment){
                oShipment[i]=_oShipment[i];
            }
            return oShipment;
        },
        getData:function(){
          return this.oShipment.getData();
        },
        create:function(fCallbackS,fCallbackF){
            if(this.isValid()){
                 this.oData.createShipment(this.oShipment.getData(),function(){
                     this._shipmentSaved();
                     this.fireShipmentCreated();
                     fCallbackS();
                }.bind(this),fCallbackF);
            }else{
                fCallbackF({error:true,message:"Please fill in all required fields"});
            }
        },
        save:function(fCallbackS,fCallbackF){
            if(this.isValid()){
                this.oData.updateShipment(this.oShipment.getData(),function(){
                     this._shipmentSaved();
                     this.fireShipmentSaved();
                     fCallbackS();
                }.bind(this),fCallbackF);
             }else{
                fCallbackF({error:true,message:"Please fill in all required fields"});
            }
        },
        isValid:function(){
           var oShipment = this.oShipment.getData();
           if(!oShipment.StartDateTime || !oShipment.StartTime){
               return false;
           }
           if(!oShipment.EndDateTime || !oShipment.EndTime){
               return false;
           }
           if(!oShipment.PlanningPoint || !oShipment.ShipmentNum){
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
                iTotalTime=Number(iTotalTime.toString());
            }
            this.oShipment.setProperty("/TravelDistance",iTotalDistance);
            this.oShipment.setProperty("/TravelTime",iTotalTime);
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
                DropNumber:iDrop || aOrders.length + 1,
                Order: oOrder,
                Distance:oOrder.Distance,
                Time:oOrder.Time,
                TipTime:oOrder.TipTime || 60
            }
            //Has it already been removed?
            if(!this._removeFromDeleted(oOrder)){
                newLine.New=true;
            }
            //Renumber drops
            aOrders.map(function(oLine){
                if(oLine.DropNumber >= newLine.DropNumber) oLine.DropNumber++;
                return oLine;
            });
            aOrders.push(newLine);
            aOrders.sort(function(a,b){
                return a.DropNumber - b.DropNumber;
            });
            this.oShipment.setProperty("/Orders",aOrders);
            if(newLine.DropNumber === aOrders.length){
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
            var oDrop;
            for(var i in aOrders){
                if(aOrders[i].DropNumber === oDrop.DropNumber){
                    aOrders.splice(i,1);
                    break;
                }
            }
            this.oShipment.setProperty("/Orders",aOrders);
            if(oDrop && !oDrop.New){
                this._addToDeleted(oDrop.Order);
            }
            this.fireOrderRemoved({
               order: oDrop.Order,
               drop:oDrop.DropNumber
            });
            if(Number(oDrop.DropNumber) === aOrders.length+1){//Removed last drop
                this.fireLastDropUpdated();
                this.refreshShipment();
            }else{
                this.recalculateDrops();
            }
        },
        _addToDeleted:function(oOrder){
           var aDeletedOrders =  this.oShipment.getProperty("/DeletedOrders") || [];
           aDeletedOrders.push(oOrder);
           this.oShipment.setProperty("/DeletedOrders",aDeletedOrders);
        },
        _removeFromDeleted:function(oOrder){
            var aDeletedOrders =  this.oShipment.getProperty("/DeletedOrders");
            var oExists;
            for(var i in aDeletedOrders){
                if(aDeletedOrders[i].OrderNum === oOrder.OrderNum){
                    oExists = aDeletedOrders.splice(i,1);
                    break;
                }
            }
            this.oShipment.setProperty("/DeletedOrders",aDeletedOrders);
            return oExists ? true : false;
        },
        _shipmentSaved:function(){
           this.oShipment.setProperty("/DeletedOrders",[]);
           var aOrders = this.oShipment.getProperty("/Orders");
           for(var i in aOrders){
               aOrders[i].New=false;
           }
           this.oShipment.setProperty("/Orders",aOrders);
           this.oShipment.setProperty("/New",false);
        },
        refreshShipment:function(){
            var aOrders = this.oShipment.getProperty("/Orders");
            //see if any drop numbers have changed
            var aChanged = aOrders.filter(function(oLine,i){
                return Number(oLine.DropNumber) != Number(i+1);
            });
            if(aChanged.length){
                aOrders = this._renumberDrops(aOrders);
                this.oShipment.setProperty("/Orders",aOrders);
            }
            if(aOrders.length){
                this.oShipment.setProperty("/FirstDropTown",aOrders[0].Order.ShipToAddr.City);
            }
            this.calculateTotals();
            this.fireShipmentUpdated();
        },
        _renumberDrops:function(aDrops){
            return aDrops.map(function(oDrop,i){
                oDrop.DropNumber = i+1;
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
        setEndPoint:function(oShipppingPoint){
            this.oShipment.setProperty("/EndPoint",oShipppingPoint.PlanningPointKey);
            this.oShipment.setProperty("/EndPointPostcode",oShipppingPoint.Address.Postcode);
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
                   // oDrop.Distance=oDrop.Time=0;
                    //this.oShipment.setProperty("/Orders/" + String(Number(oDrop.Drop) - 1),oDrop);
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
             var oPrevDrop = aOrders[Number(oDrop.DropNumber)-2];
             var prevPostcode = this.oHelper.getShortPostcode(oPrevDrop.Order.Postcode);
             this.oData.getDistanceFromPostode([vPostcode],prevPostcode,function(aResults,vPostcode){
                //var oDrop = this;
                var oObj=that.oHelper.getDistance(oDrop.Order.Postcode,vPostcode,aResults);
                oDrop.Distance=oObj.Distance;
                oDrop.Time=oObj.Time;
                that.oShipment.setProperty("/Orders/" + String(Number(oDrop.DropNumber) - 1),oDrop);
            });
        },
        getShippingPointPostcode:function(){
            return this.oShipment.getProperty("/PlanningPointPostcode");
        },
        _setShippingPointPostcode:function(){
            var vShippingPoint = this.oShipment.getProperty("/PlanningPoint");
            this.oData.getShippingPoint(vShippingPoint,function(oShippingPoint){
                this.oShipment.setProperty("/PlanningPointPostcode",oShippingPoint.Address.Postcode);
                this.recalculateDrops();
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