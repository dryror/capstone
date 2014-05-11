/*
 * View and edit details of a plot observation
 * 
 * Expected args: observationID, title
 */

var args = arguments[0];
var observationID = args.observationID;
var title = args.title;

//Query the database for values associated with the siteID
try {
	var db = Ti.Database.open('ltemaDB');
	
	resultRow = db.execute(	'SELECT ground_cover \
						FROM plot_observation \
						WHERE observation_id = ?', observationID);
						
	var groundCover = resultRow.fieldByName('ground_cover');
	$.groundCover.value = groundCover;
} catch (e) {
	Ti.App.fireEvent("app:dataBaseError", e);
} finally {
	resultRow.close();
	db.close();
}


//Assign view labels
$.modalWin.title = title;
$.groundCover.text = groundCover;

// Initially disable editable fields
$.groundCover.editable = false;


/* Listeners */

//TODO: implement 'change' event listeners to validate input


/* Functions */

// Toggle button title (Edit/Done) when pressed.  'Done' validates, saves, and reverts to 'Edit' on click
function editBtnClick(e){
	
	if (e.source.title == "Edit") {
		
    	$.modalWin.editing = true;
        e.source.title = "Done";
        $.groundCover.editable = true;
        $.backBtn.enabled = false;
        
    } else { //title is "Done"
    	
    	//TODO: fire error-checking listeners and return if any fail
    	
        $.modalWin.editing = false;
        e.source.title = "Edit";
        $.backBtn.enabled = true;
        $.groundCover.editable = false;
		
		saveEdit();
    }
}

function saveEdit(){
	try {
		var db = Ti.Database.open('ltemaDB');
		db.execute( 'UPDATE plot_observation \
					SET ground_cover = ? \
					WHERE observation_id = ?', $.groundCover.value,observationID);		
	} catch (e){
		Ti.App.fireEvent("app:dataBaseError", e);
	} finally {
		db.close();
	}
}

function backBtnClick(){
	Ti.App.fireEvent("app:refreshPlotObservations");
	$.modalNav.close();
}