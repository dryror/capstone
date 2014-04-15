//Run these two commands to reset db if testing delete functions
var yourDb = Titanium.Database.open('ltemaDB');
yourDb.remove();

//Install and open database
var db = Ti.Database.install('/ltema.sqlite', 'ltemaDB');

//Query - Retrieve existing sites from database
rows = db.execute('SELECT site_id, year, protocol_name, park_name ' + 
				'FROM site_survey s, protocol p, park prk ' + 
				'WHERE s.protocol_id = p.protocol_id ' + 
				'AND s.park_id = prk.park_id ');

//Get requested data from each row in table
var id_counter = 0;
while (rows.isValidRow()) {
	id_counter++;	
	var siteID = rows.fieldByName('site_id');
	var year = rows.fieldByName('year');
	var protocolName = rows.fieldByName('protocol_name');
	var parkName = rows.fieldByName('park_name');
	
	//create a string from each entry
	var siteSurvey = year + ' - ' + protocolName + ' - ' + parkName; 
	
	//create a new row
		var newRow = Ti.UI.createTableViewRow({
			title : siteSurvey,
			id : 'row ' + id_counter,
			siteID : siteID
		});
		
		//create and add info icon for the row
		var infoButton = Ti.UI.createButton({
			style : Titanium.UI.iPhone.SystemButton.INFO_DARK,
			right : 10,
			height : 48, //this is deciding the size of the rows at the moment
			width : 48, 
			id : id_counter
		});
		newRow.add(infoButton);
		
   		//Add row to the table view
  		$.tbl.appendRow(newRow);

	rows.next();
}
rows.close();
db.close();

//Will check if Edit button should be enabled/disabled - if no rows exist
enableDisableEditBtn();


//Enable or Disable the Edit button
function enableDisableEditBtn(){
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
        //disable the add button during edit mode
        $.addSite.enabled = false;
        
    } else { 
        $.tbl.editing = false;
        e.source.title = "Edit";
        //enable the add button
        $.addSite.enabled = true;
    }
}

//Navigate to site survey creation screen
function addBtn(){
	var addSite = Alloy.createController("addSiteSurvey").getView();
	$.navGroupWin.openWindow(addSite);
}

//Export data
function exportBtn(){
	alert('You Clicked the Export Button');
}

//Modal generation and behaviour
function modalClickHandler(e){			
	var modalWindow = Ti.UI.createWindow({
		backgroundColor:'white'
	});
	
	//modal has a label and close button
	var modalLabel1 = Ti.UI.createLabel({
		text : e.rowData.title,
		top : 50
	});
	var closeBtn = Ti.UI.createButton({
		title:'Close',
		width:100,
		height:30
	});
	closeBtn.addEventListener('click',function() {
		modalWindow.close();
	});
	modalWindow.add(modalLabel1);
	modalWindow.add(closeBtn);

	modalWindow.open({
		modal : true,
		modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET,
		navBarHidden : true
	});
}

//Delete event listener
$.tbl.addEventListener('delete', function(e) { 
	//get the site_id of the current row being deleted
	var currentSiteID = e.rowData.siteID;
    
    //open database
	var db = Ti.Database.open('ltemaDB');
	
	//delete current row from the database
    var row = db.execute('DELETE FROM site_survey WHERE site_id = ?', currentSiteID);
	db.close();
	
	//check if Edit button should be enabled/disabled - if no rows exist
	enableDisableEditBtn();
});

//Main TableView event listener
$.tbl.addEventListener('click', function(e) {
	//info button clicked, display modal
	if(e.source.toString() == '[object TiUIButton]') {
		 modalClickHandler(e);
	//row clicked, get transect view
	} else {
		var transects = Alloy.createController("transects", {siteID:e.rowData.siteID}).getView();
	    $.navGroupWin.openWindow(transects);
	}
});

//This should always happen last
$.navGroupWin.open();