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
	//Clear the table if there is anything in it
	var rd = []; 
	$.tbl.data = rd;
	try {
		//open database
		var db = Ti.Database.open('ltemaDB');
		
		//Query - Retrieve existing plots from database
		var rows = db.execute('SELECT plot_id, plot_name \
							FROM plot \
							WHERE transect_id = ?', $.tbl.transectID);
		
		//Get requested data from each row in table
		while (rows.isValidRow()) {	
			var plotID = rows.fieldByName('plot_id');
			var plotName = rows.fieldByName('plot_name');

			//create a new row
				var newRow = Ti.UI.createTableViewRow({
					title : plotName,
					plotID : plotID
				});
				
				//create and add info icon for the row
				var infoButton = Ti.UI.createButton({
					style : Titanium.UI.iPhone.SystemButton.DISCLOSURE,
					right : 10,
					height : 48, //this is deciding the size of the rows at the moment
					width : 48, 
				});
				newRow.add(infoButton);
				
		   		//Add row to the table view
		  		$.tbl.appendRow(newRow);
		
			rows.next();
		}
	} catch(e){
		Ti.App.fireEvent("app:dataBaseError", e);
	} finally {
		rows.close();
		db.close();
	}
}

populateTable();

Ti.App.addEventListener("app:refreshPlots", function(e) {
	populateTable();
});

//Plot TableView event listener
$.tbl.addEventListener('click', function(e){
	 var observations = Alloy.createController("plotObservations", {plotID:e.rowData.plotID}).getView();
	 var nav = Alloy.Globals.navMenu;
	 nav.openWindow(observations);   
});