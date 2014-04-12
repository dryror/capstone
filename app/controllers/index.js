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
		
		//create and add info icon for the row
		var infoImage = Ti.UI.createImageView({
			image : 'images/info.png',
			width : 36,
			height : 36,
			right : 5,
			id : id_counter
		});
		newRow.add(infoImage);
		
   		//Add row to the table view
  		$.tbl.appendRow(newRow);
  		
  		//info icon generates modal on click
  		infoImage.addEventListener('click', function(e) {
			var style = Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL;
			var presentation = Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET;
			
			var modalWindow = Ti.UI.createWindow({
				backgroundColor:'white'
			});
			
			//modal has a simple close button for now
			var closeBtn = Ti.UI.createButton({
				title:'Close',
				width:100,
				height:30
			});
			
			closeBtn.addEventListener('click',function() {
				modalWindow.close();
			});
			modalWindow.add(closeBtn);
			
			modalWindow.open({
				modal : true,
				modalTransitionStyle : style,
				modalStyle : presentation,
				navBarHidden : true
			});
		});
	
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
