//get siteID from calling window
var args = arguments[0];
$.tbl.siteID = args.siteID;

function populateTable() {
	
	//Clear the table if there is anything in it
	var rd = []; 
	$.tbl.data = rd;
	try {
		//Open Database
		var db = Ti.Database.open('ltemaDB');
		
		//Query - Retrieve existing sites from database
		rows = db.execute('SELECT transect_id, transect_name, surveyor, \
						utm_zone, utm_easting, utm_northing \
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
		
			//create a string to display from each entry
			var transectDesc =  transectName + ' - UTM Z:' + 
					utmZone + ' E:' + utmEasting + ' N:' + utmNorthing; 
			
			//Create a new row
				var newRow = Ti.UI.createTableViewRow({
					title : transectDesc,
					transectID : transectID
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
	} catch(e) {
		
	} finally {
		rows.close();
		db.close();
	}
}

populateTable();

$.tbl.addEventListener('click', function(e){
	//info icon clicked, get modal
	if(e.source.toString() == '[object TiUIButton]') {
		var modal = Alloy.createController("transectsModal", {transectID:e.rowData.transectID}).getView();
		modal.open({
			modal : true,
			modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
			modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_PAGESHEET,
			navBarHidden : false
		});
	//row clicked, get transect view
	} else {
		var plots = Alloy.createController("plots", {transectID:e.rowData.transectID}).getView();
    	var nav = Alloy.Globals.navMenu;
    	nav.openWindow(plots);
	} 
});

Ti.App.addEventListener("app:refreshTransects", function(e) {
	populateTable();
});

//Edit button toggle
function editBtn(e){
		//enable or disable edit mode
    if (e.source.title == "Edit") {
    	$.tbl.editing = true;
        e.source.title = "Done";
        //disable the add and export buttons during edit mode
        $.addTransect.enabled = false;
        
        
    } else { 
        $.tbl.editing = false;
        e.source.title = "Edit";
        //enable the add and export button
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

//Delete event listener
$.tbl.addEventListener('delete', function(e) { 
	//get the site_id of the current row being deleted
	var currentTransectID = e.rowData.transectID;
    
    try {
	    //open database
		var db = Ti.Database.open('ltemaDB');
		
		//delete current row from the database
	    var row = db.execute('DELETE FROM transect WHERE transect_id = ?', currentTransectID);
	} catch(e) {
		
	} finally { 
		db.close();
	}
	
	//check if Edit button should be enabled/disabled - if no rows exist
	toggleEditBtn();
});

//Navigate to addTransect - transect creation screen
function addBtn(){
	var addTransect = Alloy.createController("addTransect", {siteID: $.tbl.siteID}).getView();
	var nav = Alloy.Globals.navMenu;
	nav.openWindow(addTransect);
}


