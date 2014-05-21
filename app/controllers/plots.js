//get transectID from calling window
var args = arguments[0];
var transectID = args.transectID;
$.tbl.transectID = transectID;


populateTable();

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
					plotID : plotID,
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
		
		//delete current row from the database
		db.execute('DELETE FROM plot WHERE plot_id = ?', currentPlotID);
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		db.close();
	}
	
	//check if Edit button should be enabled/disabled - if no rows exist
	toggleEditBtn();
});


/* Functions */

//Place holder for edit button
function editBtn(){
	alert('You Clicked the Edit Button');
}

//ADD BUTTON - add a new plot
function addBtn(){	
	//check if any rows exists
	if(showTotalRowNumber() > 0){
		
		//get the total ground cover of the last plot entry and name
		var totalGroundCover = getTotalGroundCover().totalGroundCover;
		var lastPlotEntryName = getTotalGroundCover().lastPlotEntryName;
		
			//check the total ground cover of last plot entry
			if(totalGroundCover < 100){
				alert("Total Ground Cover is less than 100% \n" + lastPlotEntryName);
				return;
			}
		}
			//Navigation to addPlot
			var addPlot = Alloy.createController("addPlot", {transectID: $.tbl.transectID}).getView();
			var nav = Alloy.Globals.navMenu;
			nav.openWindow(addPlot);
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
		$.editSite.enabled = false;
		$.editSite.title = "Edit";
		$.addSite.enabled = true;
		$.tbl.editing = false;
	}else{
		//enable Edit Button
		$.editSite.enabled = true;
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

//Edit button toggle
function editBtn(e){
	
	//enable or disable edit mode
	if (e.source.title == "Edit") {
		$.tbl.editing = true;
		e.source.title = "Done";
		//disable the add and export buttons during edit mode
		$.addSite.enabled = false;
		
	} else { 
		$.tbl.editing = false;
		e.source.title = "Edit";
		//enable the add and export button
		$.addSite.enabled = true;
	}
}