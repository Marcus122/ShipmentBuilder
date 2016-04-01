sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
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
            
            this.oExistingShipment = new JSONModel({});
            this.setModel(this.oExistingShipment,"ExistingShipment");
            
            this.oExistingShipments = new JSONModel("./data/ExistingShipments.json");
            this.setModel(this.oExistingShipments,"ExistingShipments");
            
            this.oOrders = new JSONModel("./data/Orders.json");
            this.setModel(this.oOrders,"Orders");
            
            this.oOpenOrders = new JSONModel("./data/OpenOrders.json");
            this.setModel(this.oOpenOrders,"OpenOrders");
            
            this.oBackloadOrders = new JSONModel("./data/Backload.json");
            this.setModel(this.oBackloadOrders,"Backload");
            
            this.createNewShipment();
		},
        createNewShipment:function(){
            this.oNewShipment = new JSONModel({Lines:[]});
            this.setModel(this.oNewShipment,"NewShipment");
        },
        addToNewShipment:function(oOrder,iDrop){
            var aLines = this.oNewShipment.getProperty("/Lines");
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
            this.oNewShipment.setProperty("/Lines",aLines);
            this.fireNewShipmentUpdated();
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
            this.refreshNewShipment();
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
            if(!aChanged.length){
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
            var aOrders = this.oOrders.getData() || [];
            aOrders.push(oOrder);
            this.oOrders.setData(aOrders);
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
