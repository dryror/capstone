//Run these two commands to reset db if testing delete functions
//var yourDb = Titanium.Database.open('ltemaDB');
//yourDb.remove();﻿

//Install Database
Ti.Database.install('/ltema.sqlite', 'ltemaDB');

//Open Database
var db = Ti.Database.open('ltemaDB');

//Query - Retrieve existing sites from database
rows = db.execute('SELECT site_id, year, protocol_name, park_name ' + 
				'FROM site_survey s, protocol p, park prk ' + 
				'WHERE s.protocol_id = p.protocol_id ' + 
				'AND s.park_id = prk.park_id ');


// create table view data object
var data = [];				

//get requested data from each row in table
var id_counter = 0;
while (rows.isValidRow()) {
	id_counter++;	
	var siteID = rows.fieldByName('site_id');
	var year = rows.fieldByName('year');
	var protocolName = rows.fieldByName('protocol_name');
	var parkName = rows.fieldByName('park_name');
	
	//create a string from each entry
	var siteSurvey = year + ' - ' + protocolName + ' - ' + parkName; 
	
	//Create a new row
		data[id_counter] = Ti.UI.createTableViewRow({
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
		data[id_counter].add(infoButton);
		
   		//Add row to the table view
  		$.tbl.appendRow(data[id_counter]);
  		
  		//info icon generates modal on click
  		//infoButton.addEventListener('click', modalClickHandler);
	
	rows.next();
}
rows.close();
db.close();

//Place holder for edit button
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

//Place holder for add button
function addBtn(){
	//Navigation to addSiteSurvey
	var addSite = Alloy.createController("addSiteSurvey").getView();
	$.navGroupWin.openWindow(addSite);
}

//Export data
function exportBtn(){
	alert('You Clicked the Export Button');
}

//Modal Click Behaviour
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

//delete event listener
$.tbl.addEventListener('delete', function(e) { 
	//get the site_id of the current row being deleted
	var currentSiteID = e.rowData.siteID;
    
    //Open Database
	var db = Ti.Database.open('ltemaDB');
	
	//delete current row from the database
    var row = db.execute('DELETE FROM site_survey WHERE site_id = ?', currentSiteID);

	db.close();
});

$.tbl.addEventListener('click', function(e) {
	if(e.source.toString() == '[object TiUIButton]') {
		 modalClickHandler(e);
	} else {
		// code for navigating to transects would go here.
		var transects = Alloy.createController("transects").getView();
	    $.navGroupWin.openWindow(transects);
	}
});

//Needed to add this to get to the next screen for testing
//Will be replaced once controller implemented
//$.tbl.addEventListener('click', function(event){
//    var transects = Alloy.createController("transects").getView();
//    $.navGroupWin.openWindow(transects);
//}); 



//This should always happen last
$.navGroupWin.open();
