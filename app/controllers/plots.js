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
			
			if (totalGroundCover == null) {
				totalGroundCover = 0;
			}
			
			//create a new row
				var newRow = Ti.UI.createTableViewRow({
					title : plotName,
					plotID : plotID,
					height: 60,
					font: {fontSize: 20},
					totalGroundCover: totalGroundCover
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
				
				//change label colour if total ground cover is less than 100%
				if (totalGroundCover < 100) {
					 newRow.color = "red";
				}
				
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
	//disable button for 1 second to prevent double entry
	$.addPlot.enabled = false;
	setTimeout(function(){ $.addPlot.enabled = true; },1000);
		
	//Navigation to addPlot
	var addPlot = Alloy.createController("addPlot", {transectID: $.tbl.transectID}).getView();
	var nav = Alloy.Globals.navMenu;
	nav.openWindow(addPlot);
}		

//ADD BUTTON TOGGLE
function toggleAddBtn(){
	var incompletePlotCount = 0;
	//check if any rows exists
	if(showTotalRowNumber() > 0){
		//loop via plot list and check total ground cover
		for(var i=0; i < $.tbl.data[0].rows.length; i++) {
	        if($.tbl.data[0].rows[i].totalGroundCover < 100){
	        	//disable add plot button
	        	incompletePlotCount += 1;	
				//$.tbl.data[0].rows[i].color = "red";
	        }
	    }
	 }  
	 //Check the number of incomplete Plot Count 
	    if(incompletePlotCount > 0){
	    	//disable add plot button
	    	$.addPlot.enabled = false;
			$.addPlotError.visible = true;
	    }else{
	    	//enable add plot button
	        $.addPlot.enabled = true;
			$.addPlotError.visible = false;
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