//Install Database
Ti.Database.install('/ltema.sqlite', 'ltemaDB');

//Open Database
var db = Ti.Database.open('ltemaDB');

//Query - Retrieve existing sites from database
rows = db.execute('SELECT year, protocol_name, park_name ' + 
				'FROM site_survey s, protocol p, park prk ' + 
				'WHERE s.protocol_id = p.protocol_id ' + 
				'AND s.park_id = prk.park_id ');
				
//get requested data from each row in table
var id_counter = 0;
while (rows.isValidRow()) {
	id_counter++;	
	var year = rows.fieldByName('year');
	var protocolName = rows.fieldByName('protocol_name');
	var parkName = rows.fieldByName('park_name');
	
	//create a string from each entry
	var siteSurvey = year + ' - ' + protocolName + ' - ' + parkName; 
	
	//Create a new row
		var newRow = Ti.UI.createTableViewRow({
			title : siteSurvey,
			id : 'row ' + id_counter
		});
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
	//Navigation to addSiteSurvey
	var addSite = Alloy.createController("addSiteSurvey").getView();
	$.navGroupWin.openWindow(addSite);
}

//Needed to add this to get to the next screen for testing
//Will be replaced once controller implemented
$.tbl.addEventListener('click', function(event){
    var transects = Alloy.createController("transects").getView();
    $.navGroupWin.openWindow(transects);
}); 



//This should always happen last
$.navGroupWin.open();
