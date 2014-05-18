/*
 * Lists all observed speices in a single plot
 * 
 * Expected Args: plotID
 * 
 * Ground coverage must be at least 100% for the plot to be considered complete
 * 
 */

var args = arguments[0];
var plotID = args.plotID;
$.tbl.plotID = plotID;

var totalPlotPercentage = 0;


populateTable();

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
		
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
		
	} finally {
		
		rows.close();
		db.close();
		$.percent.text = totalPlotPercentage;
		toggleEditBtn();
	
	}
}


/* Nav Bar Label */

// Build title label
var parkName = "";
var transectName ="";
var plotName ="";

try {
	var db = Ti.Database.open('ltemaDB');
	
	resultRow = db.execute (	'SELECT pa.park_name, ta.transect_name, pl.plot_name \
								FROM park pa, transect ta, site_survey ss, plot pl \
								WHERE ss.site_id = ta.site_id \
								AND pa.park_id = ss.park_id \
								AND pl.transect_id = ta.transect_id \
								AND pl.plot_id = ?', plotID);
	parkName = resultRow.fieldByName('park_name');
	transectName = resultRow.fieldByName('transect_name');
	plotName = resultRow.fieldByName('plot_name');
} catch (e) {
	var errorMessage = e.message;
	Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
} finally {
	resultRow.close();
	db.close();
}

var labelText = parkName + ' - ' + transectName + ' - ' + plotName;

var titleLabel = Titanium.UI.createLabel({
	top:10,
	text: labelText,
	textAlign:'center',
	font:{fontSize:20,fontWeight:'bold'},
});

// Associate label to title
$.plotObservationsWin.setTitleControl(titleLabel);


/* Event Listeners */

Ti.App.addEventListener("app:refreshPlotObservations", function(e) {
	populateTable();
});

// Row click event listener
$.tbl.addEventListener('click', function(e){
	var modal = Alloy.createController("plotObservationsModal", {observationID:e.rowData.observationID, title:e.rowData.title}).getView();
	modal.open({
		modal : true,
		modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET,
		navBarHidden : false
	});
});

// Delete event listener
$.tbl.addEventListener('delete', function(e) { 

	var observationID = e.rowData.observationID;  //the ID to delete
	
	try {
		//delete from database
		var db = Ti.Database.open('ltemaDB');
		var row = db.execute('DELETE FROM plot_observation WHERE observation_id = ?', observationID);
		
		//delete associated media files
		var observationFiles = db.execute('SELECT med.media_name FROM media med, plot_observation pob \
										WHERE med.media_id = pob.media_id \
										AND pob.observation_id = ?', observationID);
		
		while (observationFiles.isValidRow()) {
			var fileName = observationFiles.fieldByName('media_name');
			deleteImage(fileName, folder);
			observationFiles.next();
		}
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		observationFiles.close();
		db.close();
		populateTable();
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
		//disable the Add and Done buttons during edit mode
		$.addObservation.enabled = false;
		$.done.enabled = false;

	} else { 
		$.tbl.editing = false;
		e.source.title = "Edit";
		$.addObservation.enabled = true;
		$.done.enabled = true;
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
		//reset screen behaviour for zero rows
		$.editObservation.title = "Edit";
		$.addObservation.enabled = true;
		$.tbl.editing = false;
		$.done.enabled = false;
	}else{
		//enable Edit Button
		$.editObservation.enabled = true;
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

