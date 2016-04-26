sap.ui.define([
 "sap/ui/base/ManagedObject",
 "sap/ui/model/json/JSONModel",
 "sap/ui/model/Filter",
 "sap/ui/model/FilterProcessor",
 "sap/ui/core/format/DateFormat"
 ], function (Object,JSONModel,Filter,FilterProcessor,DateFormat) {
	"use strict";
    var instance;
	var Object = Object.extend("sb.data.helper", {
		metadata : {
		},
        init:function(){
        },
        setTravelTimeMultiplier:function(i){
            this.iTimeMultiplier = Number(i);
        },
        getDistance:function(Target,Source,aResults){
            var Source = this.getShortPostcode(Source);
            var Target = this.getShortPostcode(Target);
            var iMultiplier = this.iTimeMultiplier ? this.iTimeMultiplier : 1;
            if(Target === Source){
                return {
                    Distance:0,
                    Time:0
                }
            }
           //var oResult = aResults[Postcode];
            for(var i in aResults){
                var oResult = aResults[i]
                if(oResult.From === Source && oResult.To === Target){
                    return {
                        Distance:Number(oResult.Distance),
                        Time:Number(Number(oResult.TravelTime) * iMultiplier)
                    }
                }
            }
            return {
                Distance:"N/A",
                Time:"N/A"
            }
        },
        getShortPostcode:function(Postcode){
            if(!Postcode) return "";
            var aParts = Postcode.split(" ");
            if(aParts.length > 1){
                 return aParts[0] + aParts[1].substring(0,1);
            }else{
                 return aParts[0];
            }
        },
        removeDuplicates:function(aArray){
            var seen = {};
            return aArray.filter(function(item) {
                return seen.hasOwnProperty(item) ? false : (seen[item] = true);
            });
        },
        sortArray:function(Array,sColumn,bAscending){
            var that=this;
            if(bAscending){
                return Array.sort(function(a,b){
                    var ValueA = that._getValue(a,sColumn);
                    var ValueB = that._getValue(b,sColumn);
                    if( ValueA < ValueB ) return -1;
                    if( ValueA > ValueB ) return 1;
                    return 0;
                });
            }else{
                return Array.sort(function(a,b){
                    var ValueA = that._getValue(a,sColumn);
                    var ValueB = that._getValue(b,sColumn);
                    if( ValueA < ValueB ) return 1;
                    if( ValueA > ValueB ) return -1;
                    return 0;
               });
           }
        },
        doMultiSort:function(Array,aSort){
            var that=this;
            return Array.sort(function(a,b){
                for(var i in aSort){
                    var ValueA = that._getValue(a,aSort[i].name);
                    var ValueB = that._getValue(b,aSort[i].name);
                    if(aSort[i].ascending){
                        if( ValueA < ValueB ) return -1;
                        if( ValueA > ValueB ) return 1;
                    }else{
                        if( ValueA < ValueB ) return 1;
                        if( ValueA > ValueB ) return -1;
                    }
                }
                return 0;
            });
        },
        applyFilters(oObject,aFilters){
            var aArray=[oObject];
            var aResults = FilterProcessor.apply(aArray,aFilters,function(oObject,Column){
                return oObject[Column];
            });
            return aResults.length ? true : false;
        },
        getFiltersFromObject:function(searchObj){
            var aFilters=[];
            for(var i in searchObj){
                 for(var j in searchObj[i]){
                        var oFilter = searchObj[i][j];
                        var name = String(i).replace(".","/");
                        var Value1=oFilter.Value1;
                        var Value2=oFilter.Value2;
                        if(oFilter.Type==="D"){
                            var Value1 = this._calcDate(Value1);
                            var Value2 = this._calcDate(Value2);
                        }
                        else if(oFilter.Type==="N"){
                            var Value1=Number(Value1);
                            var Value2=Number(Value2);
                        }
                        aFilters.push(new Filter(name,oFilter.Operation,Value1,Value2));
                 }
            }
            return aFilters;
        },
        _calcDate:function(iDays){
            var oToday=new Date();
            oToday.setDate(oToday.getDate() + Number(iDays));
            return oToday;
        },
        _convertToNewDate:function(oDate){
            return new Date(oDate.valueOf() + oDate.getTimezoneOffset() * 60000 * -1);
        },
        removeObjectFromArray:function(oObj,aArray){
            for(var i in aArray){
                if(oObj === aArray[i]){
                    aArray.splice(i,1);
                    return aArray;
                }
            }
        },
        _getValue:function(obj,path){
            var parts = path.split(".");
            var value;
            for(var i in parts){
                value=obj[parts[i]];
                obj=value;
            }
            return value;
        },
        setTimeOnDate:function(Date,DateTime){
            if(!DateTime) return;
            Date.setHours( DateTime.getHours() );
            Date.setMinutes( DateTime.getMinutes() );
        },
        setStringTimeOnDate:function(Date,sTime){
            if(!sTime) return;
            var parts=sTime.split(":");
            Date.setHours( parts[0] );
            Date.setMinutes( parts[1] );
        },
        setObjectToEditable:function(oItem,oModel,vName){
            var oBinding = oItem.getBindingContext(vName);
            var oOrder = oBinding.getObject();
            var bDropOrder=false;
            if(oOrder.Order){
                oOrder=oOrder.Order;
                bDropOrder=true;
            }
            if(oItem.getSelected()){
                oOrder.Edit = true;
                oOrder.Locked = true;
                if(!oOrder.EditFields){
                    oOrder.EditFields = jQuery.extend(true,{}, oOrder);
                    if(oOrder.EditFields.FixedDateTime){
                        oOrder.EditFields.FixedTime=oOrder.EditFields.FixedDateTime.getHours() + ":" + oOrder.EditFields.FixedDateTime.getMinutes();
                    }
                }
            }else{
                oOrder.Edit = false;
                oOrder.Locked = false;
                if(oOrder.EditFields){
                    delete oOrder.EditFields;
                }
            }
            if(bDropOrder){
                oModel.setProperty(oBinding.getPath() + "/Order" ,oOrder);
            }
            else{
                oModel.setProperty(oBinding.getPath(),oOrder);
            }
        },
        updateEditField:function(oElement,sField,vName,Value){
            var oBinding = oElement.getBindingContext(vName);
            var oOrder = oBinding.getObject();
            var bDropOrder=false;
            if(oOrder.Order){
                oOrder=oOrder.Order;
                bDropOrder=true;
            }
            oOrder.EditFields[sField] = Value;
            if(bDropOrder){
                oBinding.getModel().setProperty(oBinding.getPath() + "/Order" ,oOrder);
            }
            else{
                oBinding.getModel().setProperty(oBinding.getPath(),oOrder);
            }
        },
        mapEditFieldsBack:function(oItem,vName,oSavedOrder){
            var oItemBinding = oItem.getBindingContext(vName);
            var oOrder = oItemBinding.getObject();
            var bDropOrder=false;
            if(oOrder.Order){
                oOrder=oOrder.Order;
                bDropOrder=true;
            }
            oOrder.CustRef = oSavedOrder.EditFields.CustRef;
            oOrder.OnwardDelPoint = oSavedOrder.EditFields.OnwardDelPoint;
            oOrder.OnwardAddr = oSavedOrder.EditFields.OnwardAddr;
            if(oOrder.OnwardDelPoint){
                oOrder.Postcode = oOrder.OnwardAddr.Postcode;
            }else{
                oOrder.Postcode = oOrder.ShipToAddr.Postcode;
            }
            oOrder.FixedDateTime = oSavedOrder.EditFields.FixedDateTime;
            var FixedTime = oSavedOrder.EditFields.FixedTime;
            if(FixedTime){
                var aValue = FixedTime.split(":");
                oOrder.FixedDateTime.setHours(Number(aValue[0]));
                oOrder.FixedDateTime.setMinutes(Number(aValue[1]));
            }
            delete oOrder.EditFields;
            oOrder.Edit=false;
            return oOrder;
        },
        generateSession:function(){
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        }
	});
    if(!instance){
        instance=new Object();
    }
    return instance;
});