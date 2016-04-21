sap.ui.define([], function () {
	"use strict";
    return{
        pageBack:function(){
            this.oDragDrop.prevPage();
        },
        pageForward:function(){
            this.oDragDrop.nextPage();
        },
        pagingUpdated:function(oEvent){
            var iPage = oEvent.getParameter("page");
            var iPages = oEvent.getParameter("pages");
            this.oPageCount.setText("Page " + iPage + " of " + iPages);
        },
        setPages:function(oEvent){
            var iNum = oEvent.getParameter("selectedItem").getKey();
            if(isNaN(iNum)){
                this.oDragDrop.setItemsPerPage(9999);
            }else{
                this.oDragDrop.setItemsPerPage(Number(iNum));
            }
        }
    }
});