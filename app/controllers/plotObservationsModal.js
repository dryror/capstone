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
	var resultRow = db.execute(	'SELECT ground_cover, count \
						FROM plot_observation \
						WHERE observation_id = ?', observationID);
	var groundCover = resultRow.fieldByName('ground_cover');
	var count = resultRow.fieldByName('count');
	//Set the label depending on the oberservation type
	if(count == 0){
		$.groundCoverLbl.text = "	Cover:";
	}
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
$.groundCover.text = groundCover;
$.userInstructions.text = 
	"Allowed percentages:\n" +
	"0.1%, 0.2%, 0.5%,\n" +
	"or any integer between 0 and 100";


/* Listeners */

// User feedback/validation on each key press
$.groundCover.addEventListener('change', function (e) {
	var theField = $.groundCover.value;
	var match = /^((0{0,2}\.[1,2,5]0?)|(0?\d{1,2})|(0?100))$/;
	
	if (!theField.match(match)) {
		$.groundCoverError.text = "Not a valid ground cover percentage";
		$.groundCoverError.visible = true;
		$.doneBtn.enabled = false;
	} else {
		$.groundCoverError.visible = false;
		$.doneBtn.enabled = true;
	}
});

// Make keyboard appear when opening nav window (needs the event listener to work)
$.modalNav.addEventListener("open", function(e) {
	$.groundCover.focus();
	$.groundCover.setSelection(0, $.groundCover.value.length);  //selects all text in field (next key press replaces previous value)
	$.doneBtn.enabled = false;  //initially disable Done button until a change is made
});

// The keyboard's return key acts like the Done button
$.groundCover.addEventListener ("return", function(e) {
	doneBtnClick();
});


/* Functions */

// Valid inputs get saved to the database and this screen closes.
function doneBtnClick(){
	if ($.groundCoverError.visible === true) {
		$.groundCover.focus();  //keep the field's input focus
		return;
	}
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
		$.modalNav.close();
		Ti.App.fireEvent("app:refreshPlotObservations");
	}
}

// Exit this screen without saving
function cancelBtnClick(){
	$.modalNav.close();
}

