//retieve siteID
var args = arguments[0];
$.tbl.siteID = args.siteID;

//Open Database
var db = Ti.Database.open('ltemaDB');

//Query - Retrieve existing sites from database
rows = db.execute('SELECT transect_name, surveyor ' + 
				'FROM transect ' + 
				'WHERE site_id = '+ $.tbl.siteID); 

//get requested data from each row in table
var id_counter = 0;
while (rows.isValidRow()) {
	id_counter++;	
	var transectName = rows.fieldByName('transect_name');
	var surveyor = rows.fieldByName('surveyor');

	//create a string to display from each entry
	var transectDesc =  transectName + ' - ' + surveyor; 
	
	//Create a new row
		var newRow = Ti.UI.createTableViewRow({
			title : transectDesc,
			id : 'row ' + id_counter,
			transectName : transectName,
			surveyor : surveyor
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

//Place holder for edit button
function editBtn(){
	alert('You Clicked the Edit Button');
}

//Place holder for add button
function addBtn(){
	//Navigation to addTransect
	var addTransect = Alloy.createController("addTransect").getView();
	$.navGroupWin.openWindow(addTransect);
}


$.tbl.addEventListener('click', function(e){
	
	if(e.source.toString() == '[object TiUIButton]') {
		var modal = Alloy.createController("transectsModal", {transectName:e.rowData.transectName, surveyor:e.rowData.surveyor}).getView();
		modal.open({
			modal : true,
			modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
			modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET,
			navBarHidden : false
		});
	//row clicked, get transect view
	} else {
		var plots = Alloy.createController("plots").getView();
    	$.navGroupWin.openWindow(plots);
	} 
}); 
