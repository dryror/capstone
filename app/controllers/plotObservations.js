/*
 * Lists all observed speices in a single plot
 * 
 * Expected Args: plotID
 * 
 * Ground coverage must be at least 100% for the plot to be considered complete
 * 
 */

var args = arguments[0];
$.tbl.plotID = args.plotID;

var totalPlotPercentage = 0;

function populateTable() {
	
	//Clear the table if there is anything in it
	var rd = []; 
	$.tbl.data = rd;
	totalPlotPercentage = 0;
	
	// Query the plot observation table, build the TableView
	try {
		
		var db = Ti.Database.open('ltemaDB');
		
		//Query - Observations of a plot
		rows = db.execute('SELECT observation_id, observation, ground_cover \
						FROM plot_observation \
						WHERE plot_id = ?', $.tbl.plotID); 
		
		while (rows.isValidRow()) {
			var observationID = rows.fieldByName('observation_id');	
			var observation = rows.fieldByName('observation');
			var groundCover = rows.fieldByName('ground_cover');
		
			//Create a new row
			var newRow = Ti.UI.createTableViewRow({
				title : observation,
				observationID : observationID,
				height: 60,
				right: 32,
				font: {fontSize: 24}
			});
			
			//add the ground cover label
			var groundCoverLabel = Ti.UI.createLabel({
				text: groundCover + '%',
				right: 10,
				font: {fontSize: 24}
			});
			newRow.add(groundCoverLabel);

			totalPlotPercentage += groundCover;
			
	   		//Add row to the table view
	  		$.tbl.appendRow(newRow);
		
			rows.next();
		}
		
	} catch(e) {
		
		Ti.App.fireEvent("app:dataBaseError", e);
		
	} finally {
		
		rows.close();
		db.close();
		$.percent.text = totalPlotPercentage;
	
	}
	
}

populateTable();


/* Event Listeners */

Ti.App.addEventListener("app:refreshPlotObservations", function(e) {
	populateTable();
});

// Row clicked, grab the modal
$.tbl.addEventListener('click', function(e){
	var modal = Alloy.createController("plotObservationsModal", {observationID:e.rowData.observationID, title:e.rowData.title}).getView();
	modal.open({
		modal : true,
		modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET,
		navBarHidden : false
	});
});

// Remove a row from the database (called when edit button is enabled and 'delete' is clicked)
$.tbl.addEventListener('delete', function(e) { 

	var observationID = e.rowData.observationID;
    
    try {
   		var db = Ti.Database.open('ltemaDB');
	    var row = db.execute('DELETE FROM plot_observation WHERE observation_id = ?', observationID);
	} catch(e) {
		Ti.App.fireEvent("app:dataBaseError", e);
	} finally { 
		db.close();
	}
	
	//check if Edit button should be enabled/disabled - if no rows exist
	toggleEditBtn();
});


/* Functions */

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

//Function to get total number of rows
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

// TODO: handle done
function doneBtn(){
	if ( totalPlotPercentage >= 100 ) {
		alert('You Clicked the Done Button w/ % >= 100');
	} else {
		alert('You Clicked the Done Button w/ % < 100');
	}	
}

//Navigation to addPlotObservation
function addBtn(){
	var addObservation = Alloy.createController("addPlotObservation").getView();
	var nav = Alloy.Globals.navMenu;
	nav.openWindow(addObservation);
}

