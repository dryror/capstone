/*
 * View details of a plot observation
 * 
 * Expected args: observationID, title, comments, mediaID
 */

var args = arguments[0];
var observationID = args.observationID;
var title = args.title;
var comments = args.comments;
var mediaID = args.mediaID;

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

//Custom screen title
var titleLabel = Titanium.UI.createLabel({
	text:title,
	font:{fontSize:20,fontWeight:'bold'}
});

//Assign view labels
$.modalWin.setTitleControl(titleLabel);
$.groundCover.text = groundCover + " %";
$.comments.text = comments;


/* Listeners */



/* Functions */

// Valid inputs get saved to the database and this screen closes.
function doneBtnClick(){
	$.modalNav.close();
	Ti.App.fireEvent("app:refreshPlotObservations");
}

// Exit this screen without saving
function cancelBtnClick(){
	$.modalNav.close();
}

