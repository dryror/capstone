/*
 *  List screen to view, add, or delete plots
 * 
 * expected args: siteID, parkName
 */

var args = arguments[0];
$.tbl.siteID = args.siteID;
var parkName = args.parkName;

populateTable();

function populateTable() {
	
	$.addTransect.enabled = true;
	
	//Clear the table if there is anything in it
	var rd = []; 
	$.tbl.data = rd;
	try {
		//Open Database
		var db = Ti.Database.open('ltemaDB');
		
		//Query - Retrieve existing sites from database
		var rows = db.execute('SELECT transect_id, transect_name, surveyor, \
						utm_zone, utm_easting, utm_northing, media_id \
						FROM transect \
						WHERE site_id = ?', $.tbl.siteID); 
		
		//get requested data from each row in table
		var id_counter = 0;
		while (rows.isValidRow()) {
			id_counter++;
			var transectID = rows.fieldByName('transect_id');	
			var transectName = rows.fieldByName('transect_name');
			var surveyor = rows.fieldByName('surveyor');
			var utmZone = rows.fieldByName('utm_zone');
			var utmEasting = rows.fieldByName('utm_easting');
			var utmNorthing = rows.fieldByName('utm_northing');
			var mediaID = rows.fieldByName('media_id');
			
			//create a string to display from each entry
			var transectDesc =  transectName + ' - UTM Z:' + 
					utmZone + ' E:' + utmEasting + ' N:' + utmNorthing; 
			
			//Create a new row
				var newRow = Ti.UI.createTableViewRow({
					title : transectDesc,
					transectID : transectID,
					mediaID : mediaID,
					height: 60,
					font: {fontSize: 20}
				});
				
				//Select icon to be displayed (info or edit)
				if(mediaID != null){
					
					//create and add info icon for the row
					var infoButton = Ti.UI.createButton({
						style : Titanium.UI.iPhone.SystemButton.DISCLOSURE,
						right : 15,
						height: 60,
						width: 60
					});
				}else{
					//create and add info icon for the row
					var infoButton = Ti.UI.createButton({
						image : "icons/edit_file.png",
						right : 15,
						height: 30,
						width: 30
					});
				}
				newRow.add(infoButton);
				
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
		toggleEditBtn();
	}
}

// create the title label
var titleLabel = Titanium.UI.createLabel({
	height:34,
	//width:350,  //long park names may need this set
	top:10,
	text:parkName,
	textAlign:'center',
	font:{fontSize:20,fontWeight:'bold'},
});

// associate label to title
$.transectsWin.setTitleControl(titleLabel);


/* Event Listeners */

// Table row click event
$.tbl.addEventListener('click', function(e){
	//ignore row clicks in edit mode
	if ($.tbl.editing == true) {
		return;
	}
	
	//check if media exists -if no photo has been taken (re-visited transect)
	if(e.rowData.mediaID == null){
		//alert("No Photo Found!");
		var modal = Alloy.createController("transectsModal", {transectID:e.rowData.transectID, title:e.rowData.title}).getView();
		modal.open({
			modal : true,
			modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
			modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_PAGESHEET,
			navBarHidden : false
		});
	}else{
		//info icon clicked, get modal
		if(e.source.toString() == '[object TiUIButton]') {
			var modal = Alloy.createController("transectsModal", {transectID:e.rowData.transectID, title:e.rowData.title}).getView();
			modal.open({
				modal : true,
				modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
				modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_PAGESHEET,
				navBarHidden : false
			});
		//row clicked, get transect view
		} else {
			var plots = Alloy.createController("plots", {transectID:e.rowData.transectID, siteID:$.tbl.siteID}).getView();
			var nav = Alloy.Globals.navMenu;
			nav.openWindow(plots);
		}
	}
});

//Delete event listener
$.tbl.addEventListener('delete', function(e) { 
	//get the site_id of the current row being deleted
	var currentTransectID = e.rowData.transectID;
	var siteID = $.tbl.siteID;
	try {
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
		
		// find any associated transect pictures and delete them
		var transectFiles = db.execute('SELECT med.media_name FROM media med, transect tct \
								WHERE med.media_id = tct.media_id \
								AND tct.transect_id = ?', currentTransectID);
		
		while (transectFiles.isValidRow()) {
			var fileName = transectFiles.fieldByName('media_name');
			deleteImage(fileName, folder);
			transectFiles.next();
		}
		
		var plotFiles = db.execute('SELECT plt.plot_id, med.media_name FROM media med, plot plt \
									WHERE med.media_id = plt.media_id \
									AND plt.transect_id = ?', currentTransectID);
		
		var plotIDs = [];
		while (plotFiles.isValidRow()) {
			plotIDs.push(plotFiles.fieldByName('plot_id'));
			var fileName = plotFiles.fieldByName('media_name');
			deleteImage(fileName, folder);
			plotFiles.next();
		}
		
		var pids = '(' + plotIDs + ')';
		var observationFiles = db.execute('SELECT med.media_name FROM media med, plot_observation pob \
										WHERE med.media_id = pob.media_id \
										AND pob.plot_id IN' + pids);
		
		while (observationFiles.isValidRow()) {
			var fileName = observationFiles.fieldByName('media_name');
			deleteImage(fileName, folder);
			observationFiles.next();
		}
		
		//delete current row from the database
	    var row = db.execute('DELETE FROM transect WHERE transect_id = ?', currentTransectID);
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally { 
		transectFiles.close();
		plotFiles.close();
		observationFiles.close();
		db.close();
	}
	
	//check if Edit button should be enabled/disabled - if no rows exist
	toggleEditBtn();
});

Ti.App.addEventListener("app:refreshTransects", function(e) {
	populateTable();
});


/* Functions */

// Toggle edit mode label title, screen functionality
function editBtn(e){
	
	if (e.source.title == "Edit") {
		
		$.tbl.editing = true;
		e.source.title = "Done";
		$.addTransect.enabled = false;   
		
	} else {  //text is 'Done', switch to 'Edit'
		
		$.tbl.editing = false;
		e.source.title = "Edit";
		$.addTransect.enabled = true;
		
	}
}

//Enable or Disable the Edit button
function toggleEditBtn(){
	//get the number of total rows
	var numRows = showTotalRowNumber();
	//if no rows exist
	if(numRows <= 0){
		//disable Edit Button
		$.editTransects.enabled = false;
		$.editTransects.title = "Edit";
		$.addTransect.enabled = true;
		$.tbl.editing = false;
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



//Navigate to addTransect - transect creation screen
function addBtn(){
	//disable add button until screen is returned to focus.  Issue #28
	$.addTransect.enabled = false;
	
	
	var addTransect = Alloy.createController("addTransect", {siteID: $.tbl.siteID}).getView();
	var nav = Alloy.Globals.navMenu;
	nav.openWindow(addTransect);
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