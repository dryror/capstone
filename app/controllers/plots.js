//get transectID from calling window
var args = arguments[0];
$.tbl.transectID = args.transectID; //Not sure this needs to be $.tbl.transectId. Copied from transects.js.

//Place holder for edit button
function editBtn(){
	alert('You Clicked the Edit Button');
}

//Place holder for add button
function addBtn(){
	//Navigation to addPlot
	var addPlot = Alloy.createController("addPlot", {transectID: $.tbl.transectID}).getView();
	var nav = Alloy.Globals.navMenu;
	nav.openWindow(addPlot);
}

function populateTable() {
	//Will be replaced once controller implemented
	$.row1.addEventListener('click', function(e){
	    var observations = Alloy.createController("plotObservations", {plotID:9}).getView(); //hardcoded for testing, replace with {plotID:e.rowData.plotID} when wired
	    var nav = Alloy.Globals.navMenu;
	    nav.openWindow(observations);
	}); 
}

populateTable();

Ti.App.addEventListener("app:refreshPlots", function(e) {
	populateTable();
});