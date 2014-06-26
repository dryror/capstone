/*
 * List screen to view, add, or delete plot observations
 * 
 * Expected Args: plotID, siteID
 * 
 * Ground coverage must be at least 100% for the plot to be considered complete
 */

var args = arguments[0];
var plotID = args.plotID;
$.tbl.plotID = plotID;
var siteID = args.siteID;

var totalPlotPercentage = 0;
var transectID;

populateTable();

function populateTable() {
	
	$.addObservation.enabled = true;
	
	//Clear the table if there is anything in it
	var rd = []; 
	$.tbl.data = rd;
	totalPlotPercentage = 0;
	
	// Query the plot observation table, build the TableView
	try {
		
		var db = Ti.Database.open('ltemaDB');
		
		//Query - Observations of a plot
		var rows = db.execute('SELECT observation_id, observation, ground_cover, comments, media_id \
						FROM plot_observation \
						WHERE plot_id = ?', $.tbl.plotID); 
		
		while (rows.isValidRow()) {
			var observationID = rows.fieldByName('observation_id');	
			var observation = rows.fieldByName('observation');
			var groundCover = rows.fieldByName('ground_cover');
			var comments = rows.fieldByName('comments');  //comments and mediaID are retrieved to pass to modal
			var mediaID = rows.fieldByName('media_id');
			//Create a new row
			var newRow = Ti.UI.createTableViewRow({
				title : observation,
				observationID : observationID,
				groundCover : groundCover,
				comments: comments,
				mediaID: mediaID,
				height: 60,
				font: {fontSize: 20}
			});
			
			//add the ground cover label
			var groundCoverLabel = Ti.UI.createLabel({
				text: groundCover + '%',
				right: 55,
				font: {fontSize: 20}
			});
			newRow.add(groundCoverLabel);
			
			//add an info icon to the row
			var infoButton = Ti.UI.createButton({
				style: Ti.UI.iPhone.SystemButton.DISCLOSURE,
				right: 15,
				height: 60,
				width: 60
			});
			newRow.add(infoButton);
			
			//update total
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
		toggleDoneBtn();
	}
}


/* Nav Bar Label */

// Build title label
var parkName = "";
var transectName ="";
var plotName ="";

try {
	var db = Ti.Database.open('ltemaDB');
	
	var resultRow = db.execute (	'SELECT pa.park_name, ta.transect_name, pl.plot_name \
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

// Replaces 'onClick' for the add button, addresses issue #35 
$.addObservation.addEventListener('singletap', function (e) { 
	addBtn();
});
$.addObservation.addEventListener('longclick', function (e) {
	addBtn();
});

// Table row click event
$.tbl.addEventListener('click', function(e){
	//ignore row clicks in edit mode
	if ($.tbl.editing == true) {
		return;
	}
	//info button clicked, display modal
	if (e.source.toString() == '[object TiUIButton]') {
		var modal = Alloy.createController("plotObservationsModalDisclosureIcon", {observationID:e.rowData.observationID, title:e.rowData.title, comments:e.rowData.comments, mediaID:e.rowData.mediaID, siteID:siteID}).getView();
		modal.open({
			modal : true,
			modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
			modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_PAGESHEET,
			navBarHidden : false
		});
	} else {
		var modal = Alloy.createController("plotObservationsModal", {observationID:e.rowData.observationID, title:e.rowData.title}).getView();
		modal.open({
			modal : true,
			modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
			modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET,
			navBarHidden : false
		});
	}
});

// Delete event listener
$.tbl.addEventListener('delete', function(e) { 

	var observationID = e.rowData.observationID;  //the ID to delete
	
	try {
		//delete from database
		var db = Ti.Database.open('ltemaDB');
		
		// Get the site id
		var result = db.execute('SELECT site_id FROM transect \
								WHERE transect_id = ?', transectID);
		
		var siteID = result.fieldByName('site_id');
		
		// Get the directory name
		var rows = db.execute('SELECT year, protocol_name, park_name \
							FROM site_survey s, protocol p, park prk \
							WHERE s.protocol_id = p.protocol_id \
							AND s.park_id = prk.park_id \
							AND site_id = ?', siteID);
							
		//Name the directory	
		var year = rows.fieldByName('year');
		var protocolName = rows.fieldByName('protocol_name');
		var parkName = rows.fieldByName('park_name');
		
		var folder = year + ' - ' + protocolName + ' - ' + parkName;
		
		//delete associated media files
		var observationFiles = db.execute('SELECT med.media_name FROM media med, plot_observation pob \
										WHERE med.media_id = pob.media_id \
										AND pob.observation_id = ?', observationID);
		
		while(observationFiles.isValidRow()) {
			var fileName = observationFiles.fieldByName('media_name');
			if (fileName != null) {
				deleteImage(fileName, folder);
			}
			observationFiles.next();
		}
		
		db.execute('DELETE FROM plot_observation WHERE observation_id = ?', observationID);
		
		// Update the coverage total
		totalPlotPercentage -= e.rowData.groundCover;
		$.percent.text = totalPlotPercentage;
		
		//check if Edit button should be enabled/disabled - if no rows exist
		toggleEditBtn();
		toggleDoneBtn();
		
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		result.close();
		rows.close();
		observationFiles.close();
		db.close();
	}
});

$.plotObservationsWin.addEventListener('close', function(e) {
	Ti.App.fireEvent("app:refreshPlots");
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
		if(totalPlotPercentage >= 400){
			$.done.enabled = false;
			$.addObservation.enabled = false;
		}else{
			$.addObservation.enabled = true;
			$.done.enabled = true;
		}
	}
	toggleDoneBtn();
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
		$.done.enabled = false;
		$.addObservation.enabled = true;
		
		$.tbl.editing = false;
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

function toggleDoneBtn(){
	if (totalPlotPercentage < 100) {
		$.done.enabled = false;
		$.doneError.text = "Ground cover must be at least 100%";
		$.doneError.visible = true;
	} else if (totalPlotPercentage >= 400) {
		//disable the add observation button
		$.addObservation.enabled = false;
		
		$.done.enabled = false;
		$.doneError.text = "Ground cover must be no greater than 400%";
		$.doneError.visible = true;
	} else {
		$.done.enabled = true;
		$.doneError.visible = false;
		//disable the add observation button
		$.addObservation.enabled = true;
	}
}

// Navigate back to plots
function doneBtn(){
	$.plotObservationsWin.close();
}

//Navigation to addPlotObservation
function addBtn(){
	//disable add button until screen is returned to focus.  Issue #28
	$.addObservation.enabled = false;
	
	var addObservation = Alloy.createController("addPlotObservation", {plotID: plotID}).getView();
	var nav = Alloy.Globals.navMenu;
	nav.openWindow(addObservation);
}

// Delete a file from the application data directory
function deleteImage(fileName, folderName) {
	var imageDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, folderName);
	
	if (imageDir.exists()) {		
		// .resolve() provides the resolved native path for the directory.
		var imageFile = Ti.Filesystem.getFile(imageDir.resolve(), fileName);
		if (imageFile.exists()) {
			imageFile.deleteFile();
		}
	}
}