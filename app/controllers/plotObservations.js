/*
 * Lists all observed speices in a single plot
 * 
 * Expected Args: plotID
 * 
 * Ground coverage must be at least 100% for the plot to be considered complete
 * 
 */

// plotID
var args = arguments[0];
$.tbl.plotID = args.plotID;

function populateTable() {
	//Clear the table if there is anything in it
	var rd = []; 
	$.tbl.data = rd;
	// Query the plot observation table for the values of a plotID and build the TableView
	try {
		
		var db = Ti.Database.open('ltemaDB');
		
		//TODO: Remove unused fields from query
		//Query - Observations of a plot
		rows = db.execute('SELECT observation_id, observation, ground_cover, count, comments, plot_id, media_id \
						FROM plot_observation \
						WHERE plot_id = ?', $.tbl.plotID); 
		
		while (rows.isValidRow()) {
			var observationID = rows.fieldByName('observation_id');	
			var observation = rows.fieldByName('observation');
			var groundCover = rows.fieldByName('ground_cover');
			var count = rows.fieldByName('count');
			var comments = rows.fieldByName('comments');
			var plotID = rows.fieldByName('plot_id');
			var mediaID = rows.fieldByName('media_id');
		
			//Create a new row
				var newRow = Ti.UI.createTableViewRow({
					title : observation,
					observationID : observationID
				});
				
				//add the ground cover label
				var groundCoverLabel = Ti.UI.createLabel({
					text: groundCover + '%',
					right: 50
				});
				newRow.add(groundCoverLabel);
				//create and attach an info icon to the row
				var infoButton = Ti.UI.createButton({
					style : Titanium.UI.iPhone.SystemButton.INFO_DARK,
					right : 10,
					height : 48,
					width : 48,
				});
				newRow.add(infoButton);
				
		   		//Add row to the table view
		  		$.tbl.appendRow(newRow);
		
			rows.next();
		}
	} catch(e) {
		Ti.App.fireEvent("app:dataBaseError", e);
	} finally {
		rows.close();
		db.close();
	}
}

populateTable();

$.tbl.addEventListener('click', function(e){
	
	//info icon clicked, get modal
	if(e.source.toString() == '[object TiUIButton]') {
		
		//alert until modal built
		alert ('call plot observation modal');
	
	//row clicked, get transect view
	} else {
		//TODO: row click handler
		alert('todo: row click handler');
	} 
});

Ti.App.addEventListener("app:refreshPlotObservations", function(e) {
	populateTable();
});

//Edit button toggle
function editBtn(e){
		//enable or disable edit mode
    if (e.source.title == "Edit") {
    	$.tbl.editing = true;
        e.source.title = "Done";
        //disable the add button during edit mode
        $.addObservation.enabled = false;
        
    } else { 
        $.tbl.editing = false;
        e.source.title = "Edit";
        //enable the add button
        $.addObservation.enabled = true;
    }
}

//Enable or Disable the Edit button
function toggleEditBtn(){
	//get the number of total rows
	var numRows = showTotalRowNumber();
	//if no rows exist
	if(numRows <= 0){
		//disable Edit Button
		$.editObservation.enabled = false;
		$.editObservation.title = "Edit";
        $.addObservation.enabled = true;
	}else{
		//enable Edit Button
		$.editTransects.enabled = true;
	}
}

//Function to get total number of rows (transects)
function showTotalRowNumber(){
	// Variable to get all section
	var allSection = $.tbl.data;
 
	var sectionNumber = 0;
	var totalRows = 0;
 
	for(sectionNumber = 0; sectionNumber < allSection.length; sectionNumber++){
		// Get rows for each section
		totalRows += allSection[sectionNumber].rowCount;
	}
	return totalRows;
}

//Place holder for done button
function doneBtn(){
	alert('You Clicked the Done Button');
}

//Place holder for add button
function addBtn(){
	//Navigation to addPlotObservatino
	var addObservation = Alloy.createController("addPlotObservation").getView();
	var nav = Alloy.Globals.navMenu;
	nav.openWindow(addObservation);
}

