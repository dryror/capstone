/*
 * View and edit the ground cover percentage of a plot observation
 * 
 * Expected args: observationID, title
 */

var args = arguments[0];
var observationID = args.observationID;
var title = args.title;

//Query the database, assign returned ground cover to TextField
try {
	var db = Ti.Database.open('ltemaDB');
	
	resultRow = db.execute(	'SELECT ground_cover \
						FROM plot_observation \
						WHERE observation_id = ?', observationID);
						
	var groundCover = resultRow.fieldByName('ground_cover');
	$.groundCover.value = groundCover;
} catch (e) {
	var errorMessage = e.message;
	Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
} finally {
	resultRow.close();
	db.close();
}

//Custom font modal title
var titleLabel = Titanium.UI.createLabel({
	text:title,
	font:{fontSize:20,fontWeight:'bold'}
});

//Assign view labels
$.modalWin.setTitleControl(titleLabel);
$.groundCover.text = groundCover;


// Initially disable Done button until a change is made
$.doneBtn.enabled = false;



/* Listeners */

//TODO: implement 'change' event listeners to validate input


// Make keyboard appear when opening nav window (needs the event listener to work)
$.modalNav.addEventListener("open", function(e) {
	
	$.groundCover.focus();
	
	//outside of 'open', change is fired, enabling 'Done' on load
	$.groundCover.addEventListener ("change", function(e) {
		$.doneBtn.enabled = true;
	});
	
});

// Keyboard 'return' key press
$.groundCover.addEventListener ("return", function(e) {
	doneBtnClick();
});


/* Functions */

function doneBtnClick(){
	
	//TODO: check for error labels before updating db
	
	try {
		var db = Ti.Database.open('ltemaDB');
		db.execute( 'UPDATE plot_observation \
					SET ground_cover = ? \
					WHERE observation_id = ?', $.groundCover.value,observationID);		
	} catch (e){
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		db.close();
		Ti.App.fireEvent("app:refreshPlotObservations");
		$.modalNav.close();
	}
}

function cancelBtnClick(){
	//Ti.App.fireEvent("app:refreshPlotObservations");
	$.modalNav.close();
}
