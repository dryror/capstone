/* List screen to view, add, or delete plots */

//get transectID from calling window
var args = arguments[0];
var transectID = args.transectID;
$.tbl.transectID = transectID;
var siteID = args.siteID;

populateTable();
toggleAddBtn();

/* Nav Bar Label */

// Build title label
var parkName = "";
var transectName ="";

try {
	var db = Ti.Database.open('ltemaDB');
	
	resultRow = db.execute (	'SELECT p.park_name, t.transect_name \
								FROM park p, transect t, site_survey s \
								WHERE s.site_id = t.site_id \
								AND p.park_id = s.park_id \
								AND t.transect_id = ?' , transectID);
	parkName = resultRow.fieldByName('park_name');
	transectName = resultRow.fieldByName('transect_name');
} catch (e) {
	var errorMessage = e.message;
	Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
} finally {
	resultRow.close();
	db.close();
}

var labelText = parkName + ' - ' + transectName;

var titleLabel = Titanium.UI.createLabel({
	top:10,
	text: labelText,
	textAlign:'center',
	font:{fontSize:20,fontWeight:'bold'},
});

// Associate label to title
$.plotsWin.setTitleControl(titleLabel);


/* Event Listeners */

Ti.App.addEventListener("app:refreshPlots", function(e) {
	populateTable();
	toggleAddBtn();
});

//Plot TableView - event listener
$.tbl.addEventListener('click', function(e){
	//info button clicked, display modal
	if(e.source.toString() == '[object TiUIButton]') {
		var modal = Alloy.createController("plotsModal", {plotID:e.rowData.plotID, title:e.rowData.title}).getView();
		modal.open({
			modal : true,
			modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
			modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_PAGESHEET,
			navBarHidden : false
		});
	//row clicked, get transect view
	}else{  
		//open plot observations
		var observations = Alloy.createController("plotObservations", {plotID:e.rowData.plotID}).getView();
		var nav = Alloy.Globals.navMenu;
		nav.openWindow(observations);   
	}
});

//Delete - event listener
$.tbl.addEventListener('delete', function(e) { 
	//get the plot_id of the current row to be deleted
	var currentPlotID = e.rowData.plotID;
	try{
		//open database
		var db = Ti.Database.open('ltemaDB');

		//GET FOLDER NAME - Retrieve site survery, year, park
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
		var plotFiles = db.execute('SELECT media_name \
												FROM media m, plot p \
												WHERE m.media_id = p.media_id \
												AND p.plot_id = ? ', currentPlotID);
		
		var fileName = plotFiles.fieldByName('media_name');
		deleteImage(fileName, folder);
		
		var plotObservationFiles = db.execute('SELECT media_name \
												FROM media m, plot_observation po \
												WHERE m.media_id = po.media_id \
												AND po.plot_id = ? ', currentPlotID);
		
		while (plotObservationFiles.isValidRow()) {
			var fileName = plotObservationFiles.fieldByName('media_name');
			deleteImage(fileName, folder);
			plotObservationFiles.next();
		}
		
		//delete current row from the database
		db.execute('DELETE FROM plot WHERE plot_id = ?', currentPlotID);
		
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		//rows.close();
		//plotFiles.close();
		//plotObservationFiles.close();
		db.close();
		toggleEditBtn();
	}
});


/* Functions */

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
			
			var groundCoverRows = db.execute('SELECT sum(ground_cover) \
											FROM plot_observation \
											WHERE plot_id = ?', plotID);
							
			var totalGroundCover = groundCoverRows.fieldByName('sum(ground_cover)');
			
			//create a new row
				var newRow = Ti.UI.createTableViewRow({
					title : plotName,
					plotID : plotID,
					height: 60,
					font: {fontSize: 20}
				});
				
			//add the total ground cover label
				var groundCoverLabel = Ti.UI.createLabel({
					text: totalGroundCover + '%',
					right: 55,
					font: {fontSize: 20}
				});
				newRow.add(groundCoverLabel);
				
				//create and add info icon for the row
				var infoButton = Ti.UI.createButton({
					style : Titanium.UI.iPhone.SystemButton.DISCLOSURE,
					right : 15,
					height: 60,
					width: 60
				});
				newRow.add(infoButton);
				
				//Add row to the table view
				$.tbl.appendRow(newRow);
		
			rows.next();
		}
	} catch(e){
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		rows.close();
		db.close();
		toggleEditBtn();
	}
}

//EDIT BUTTON - toggle edit mode
function editBtn(e){
	
	//enable or disable edit mode
	if (e.source.title == "Edit") {
		$.tbl.editing = true;
		e.source.title = "Done";
		//disable the add button during edit mode
		$.addPlot.enabled = false;
		
	} else { 
		$.tbl.editing = false;
		e.source.title = "Edit";
		toggleAddBtn();
	}
}

//ADD BUTTON - add a new plot
function addBtn(){	
	//Navigation to addPlot
	var addPlot = Alloy.createController("addPlot", {transectID: $.tbl.transectID}).getView();
	var nav = Alloy.Globals.navMenu;
	nav.openWindow(addPlot);
}		

function toggleAddBtn(){
	//check if any rows exists
	if(showTotalRowNumber() > 0){
		
		//get the total ground cover of the last plot entry and name
		var totalGroundCover = getTotalGroundCover().totalGroundCover;
		var lastPlotEntryName = getTotalGroundCover().lastPlotEntryName;
		
			//check the total ground cover of last plot entry
			if(totalGroundCover < 100){
				//show error message
				var addErrorMessage = "* " + lastPlotEntryName + "'s " + "Total Ground Coverage is less than 100%";
				$.addPlotError.text = addErrorMessage;
				$.addPlotError.visible = true;
				
				//disable add plot button
				$.addPlot.enabled = false;
				
				//set the last plot entry to red text
				var lastRow = showTotalRowNumber() - 1;
				$.tbl.data[0].rows[lastRow].color = "red";
			
			}else{
				//if the total ground cover is 100% or greater
				$.addPlot.enabled = true;
				$.addPlotError.visible = false;
			}
	}
}

// get the total ground cover of the last plot entry
function getTotalGroundCover(){
	try{
		//open database
		var db = Ti.Database.open('ltemaDB');
		
		// get the name & plot_id of the last plot entry added
		var lastRowAdded = db.execute('SELECT MAX(utc), plot_id, plot_name \
									FROM plot \
									WHERE transect_id = ?', $.tbl.transectID);
									
		var lastEntryPlotID = lastRowAdded.fieldByName('plot_id');
		var lastEntryPlotName = lastRowAdded.fieldByName('plot_name');
		
		//delete current row from the database
		var rows = db.execute('SELECT sum(ground_cover) \
							FROM plot_observation \
							WHERE plot_id = ?',  lastEntryPlotID);
							
		var totalGroundCover = rows.fieldByName('sum(ground_cover)');
		
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		db.close();
		var lastPlotEntryName = lastEntryPlotName;
		return {totalGroundCover:totalGroundCover, lastPlotEntryName:lastPlotEntryName};
	}
}

//Enable or Disable the Edit button
function toggleEditBtn(){
	//get the number of total rows
	var numRows = showTotalRowNumber();
	//if no rows exist
	if(numRows <= 0){
		//disable Edit Button
		$.editPlot.enabled = false;
		$.editPlot.title = "Edit";
		$.addPlot.enabled = true;
		$.tbl.editing = false;
		$.addPlotError.visible = false;
	}else{
		//enable Edit Button
		$.editPlot.enabled = true;
	}
}

//Function to get total number of rows (plots)
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