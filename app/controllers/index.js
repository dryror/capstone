//Run these two commands to reset db if testing delete functions
var yourDb = Titanium.Database.open('ltemaDB');
yourDb.remove();

populateTable();

function populateTable() {
	//Clear the table if there is anything in it
	var rd = []; 
	$.tbl.data = rd;
	try {
		//Install and open database
		var db = Ti.Database.install('/ltema.sqlite', 'ltemaDB');
		
		//Query - Retrieve existing sites from database
		rows = db.execute('SELECT site_id, year, protocol_name, park_name \
						FROM site_survey s, protocol p, park prk \
						WHERE s.protocol_id = p.protocol_id \
						AND s.park_id = prk.park_id ');
		
		//Get requested data from each row in table
		while (rows.isValidRow()) {	
			var siteID = rows.fieldByName('site_id');
			var year = rows.fieldByName('year');
			var protocolName = rows.fieldByName('protocol_name');
			var parkName = rows.fieldByName('park_name');
			
			//create a string from each entry
			var siteSurvey = year + ' - ' + protocolName + ' - ' + parkName; 
			
			//create a new row
				var newRow = Ti.UI.createTableViewRow({
					title : siteSurvey,
					siteID : siteID,
					parkName: parkName, //not visible, but passed to transects screen
					height: 60,
					font: {fontSize: 20}
				});
				
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

/* Nav Bar Label */

// Build title label

var labelText = 'Site Surveys';

var titleLabel = Titanium.UI.createLabel({
	top:10,
	text: labelText,
	textAlign:'center',
	font:{fontSize:20,fontWeight:'bold'},
});

// Associate label to title
$.siteSurveysWin.setTitleControl(titleLabel);


/* Event Listeners */

//Delete event listener
$.tbl.addEventListener('delete', function(e) { 
	//get the site_id of the current row being deleted
	var currentSiteID = e.rowData.siteID;
	try{
		//open database
		var db = Ti.Database.open('ltemaDB');
		
		// Delete any saved files associated with this site survey
		var folder = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, e.rowData.title);
		if (folder.exists()) {		
			// delete the folder and it's contents
			folder.deleteDirectory(true);		
		}
		
		//delete current row from the database
		db.execute('DELETE FROM site_survey WHERE site_id = ?', currentSiteID);
		
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		// Dispose of file handles and db connections
		folder = null;
		db.close();
	}
	
	//check if Edit button should be enabled/disabled - if no rows exist
	toggleEditBtn();
});

//Main TableView event listener
$.tbl.addEventListener('click', function(e) {
	if ($.tbl.editing == true) {
		return;
	}
	//info button clicked, display modal
	if(e.source.toString() == '[object TiUIButton]') {
		var modal = Alloy.createController("siteSurveyModal", {siteID:e.rowData.siteID}).getView();
		modal.open({
			modal : true,
			modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
			modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_PAGESHEET,
			navBarHidden : false
		});
	//row clicked, get transect view
	} else {
		var transects = Alloy.createController("transects", {siteID:e.rowData.siteID, parkName:e.rowData.parkName}).getView();
		$.navGroupWin.openWindow(transects);
	}
});

Ti.App.addEventListener("app:dataBaseError", function(e) {
	//TODO: handle a database error for the app
	Titanium.API.error("Database error: " + e.error);
});

Ti.App.addEventListener("app:fileSystemError", function(e) {
	//TODO: handle a file system error for the app
	Titanium.API.error("File system error: " + e.error);
});

Ti.App.addEventListener("app:refreshSiteSurveys", function(e) {
	populateTable();
});


/* Functions */

//Enable or Disable the Edit and Add buttons based on row count
function toggleEditBtn(){
	//get the number of total rows
	var numRows = showTotalRowNumber();
	//if no rows exist
	if(numRows <= 0){
		//disable Edit  and Add buttons
		$.editSite.enabled = false;
		$.editSite.title = "Edit";
		$.addSite.enabled = true;
		$.tbl.editing = false;
		$.exportData.enabled = false;
	}else{
		//enable Edit and Add buttons
		$.editSite.enabled = true;
		if ($.tbl.editing == false) {
			$.exportData.enabled = true;
		}
	}
}

//Function to get total number of rows (site surveys)
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

//Edit button toggle
function editBtn(e){
	
	//enable or disable edit mode
	if (e.source.title == "Edit") {
		$.tbl.editing = true;
		e.source.title = "Done";
		//disable the add and export buttons during edit mode
		$.addSite.enabled = false;
		$.exportData.enabled = false;
		
	} else { 
		$.tbl.editing = false;
		e.source.title = "Edit";
		//enable the add and export button
		$.addSite.enabled = true;
		$.exportData.enabled = true;
	}
}

//Navigate to site survey creation screen
function addBtn(){
	//disable button for 1 second to prevent double entry
	$.addSite.enabled = false;
	setTimeout(function(){ $.addSite.enabled = true; },1000);
	
	var addSite = Alloy.createController("addSiteSurvey").getView();
	$.navGroupWin.openWindow(addSite);
}

//Export data
function exportBtn(){
	var modal = Alloy.createController("exportModal").getView();
	modal.open({
		modal : true,
		modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_PAGESHEET,
		navBarHidden : false
	});
}

//This should always happen last
Alloy.Globals.navMenu = $.navGroupWin;
$.navGroupWin.open();