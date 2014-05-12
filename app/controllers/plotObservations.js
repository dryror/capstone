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

function populateTable() {
	
	//Clear the table if there is anything in it
	var rd = []; 
	$.tbl.data = rd;
	
	// Query the plot observation table, build the TableView
	try {
		
		var db = Ti.Database.open('ltemaDB');
		
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
			
			//add an info icon to the row
			var infoButton = Ti.UI.createButton({
				style : Titanium.UI.iPhone.SystemButton.DISCLOSURE,
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


/* Event Listeners */

//TODO: discuss row click behaviour, info icon relevance
$.tbl.addEventListener('click', function(e){
	
	//info icon clicked, get modal
	if (e.source.toString() == '[object TiUIButton]') {
		
		//alert until modal built
		alert ('call plot observation modal');
	
	//row clicked, get modal?
	} else {
		
		Ti.API.info('e', JSON.stringify(e));
		var modal = Alloy.createController("plotObservationsModal", {observationID:e.rowData.observationID, title:e.rowData.title}).getView();
		modal.open({
			modal : true,
			modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
			modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET,
			navBarHidden : false
		});
		
	}
});

Ti.App.addEventListener("app:refreshPlotObservations", function(e) {
	populateTable();
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

//Place holder for done button
function doneBtn(){
	alert('You Clicked the Done Button');
}

//Navigation to addPlotObservation
function addBtn(){
	var addObservation = Alloy.createController("addPlotObservation").getView();
	var nav = Alloy.Globals.navMenu;
	nav.openWindow(addObservation);
}

