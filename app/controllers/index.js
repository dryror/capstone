//Run these two commands to reset db if testing delete functions
var yourDb = Titanium.Database.open('ltemaDB');
yourDb.remove();

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
				siteID : siteID
			});
			
			//create and add info icon for the row
			var infoButton = Ti.UI.createButton({
				style : Titanium.UI.iPhone.SystemButton.INFO_DARK,
				right : 10,
				height : 48, //this is deciding the size of the rows at the moment
				width : 48, 
			});
			newRow.add(infoButton);
			
	   		//Add row to the table view
	  		$.tbl.appendRow(newRow);
	
		rows.next();
	}
} catch(e){
	Ti.App.fireEvent("app:dataBaseError");
} finally {
	rows.close();
	db.close();
}

//Will check if Edit button should be enabled/disabled - if no rows exist
toggleEditBtn();


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
	}else{
		//enable Edit Button
		$.editSite.enabled = true;
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

//Delete event listener
$.tbl.addEventListener('delete', function(e) { 
	//get the site_id of the current row being deleted
	var currentSiteID = e.rowData.siteID;
    try{
	    //open database
		var db = Ti.Database.open('ltemaDB');
		
		//delete current row from the database
	    var row = db.execute('DELETE FROM site_survey WHERE site_id = ?', currentSiteID);
	} catch(e) {
		Ti.App.fireEvent("app:dataBaseError");
	} finally {
		db.close();
	}
	
	//check if Edit button should be enabled/disabled - if no rows exist
	toggleEditBtn();
});

//Main TableView event listener
$.tbl.addEventListener('click', function(e) {
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
		var transects = Alloy.createController("transects", {siteID:e.rowData.siteID}).getView();
	    $.navGroupWin.openWindow(transects);
	}
});

Ti.App.addEventListener("app:dataBaseError", function(e) {
	//TODO: handle a database error for the app
	alert("database error");
});

Ti.App.addEventListener("app:fileSystemError", function(e) {
	//TODO: handle a file system error for the app
	alert("file system error");
});



//This should always happen last
Alloy.Globals.navMenu = $.navGroupWin;
$.navGroupWin.open();