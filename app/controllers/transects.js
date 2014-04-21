//get siteID from calling window
var args = arguments[0];
$.tbl.siteID = args.siteID;

function populateTable() {
	
	//Clear the table if there is anything in it
	var rd = []; 
	$.tbl.data = rd;
	
	//Open Database
	var db = Ti.Database.open('ltemaDB');
	
	//Query - Retrieve existing sites from database
	rows = db.execute('SELECT transect_id, transect_name, surveyor ' + 
					'FROM transect ' + 
					'WHERE site_id = '+ $.tbl.siteID); 
	
	//get requested data from each row in table
	var id_counter = 0;
	while (rows.isValidRow()) {
		id_counter++;
		var transectID = rows.fieldByName('transect_id');	
		var transectName = rows.fieldByName('transect_name');
		var surveyor = rows.fieldByName('surveyor');
	
		//create a string to display from each entry
		var transectDesc =  transectName + ' - ' + surveyor; 
		
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
	rows.close();
	db.close();


	$.tbl.addEventListener('click', function(e){
		//info icon clicked, get modal
		if(e.source.toString() == '[object TiUIButton]') {
			var modal = Alloy.createController("transectsModal", {transectID:e.rowData.transectID}).getView();
			modal.open({
				modal : true,
				modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
				modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET,
				navBarHidden : false
			});
		//row clicked, get transect view
		} else {
			var plots = Alloy.createController("plots").getView();
	    	var nav = Alloy.Globals.navMenu;
	    	nav.openWindow(plots);
		} 
	});
}


Ti.App.addEventListener("app:refreshTransects", function(e) {
	populateTable();
});

/*
Ti.App.addEventListener('updateTransects', function() {
	alert('updateTransects called');
});
*/

//Edit button toggle
function editBtn(){
	alert('You Clicked the Edit Button');
}

//Navigate to addTransect - transect creation screen
function addBtn(){
	var addTransect = Alloy.createController("addTransect", {siteID: $.tbl.siteID}).getView();
	var nav = Alloy.Globals.navMenu;
	nav.openWindow(addTransect);
}

populateTable();
