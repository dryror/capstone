/* A screen to view and edit transect details */

// Get transectID from calling window
var args = arguments[0];
var transectID = args.transectID;

// Create stake orientation labels (Fixes Issue #13)
var stakeBarLabels = [
	{title:"Top Left / Bottom Right", enabled:false},
	{title:"Top Right / Bottom Left", enabled:false}
];
$.stakeBar.labels = stakeBarLabels;

// Query the database and store values associated with a transectID
try {
	var db = Ti.Database.open('ltemaDB');
	
	resultRow = db.execute(	'SELECT transect_id, transect_name, surveyor, plot_distance, stake_orientation, comments \
							FROM transect t \
							WHERE transect_id = ?', transectID);					
	
	var transectName = resultRow.fieldByName('transect_name');
	var surveyor = resultRow.fieldByName('surveyor');
	var plotDistance = resultRow.fieldByName('plot_distance');
	var stakeOrientation = resultRow.fieldByName('stake_orientation');
	var comments = resultRow.fieldByName('comments'); 
	
	//Assign editable TextField values
	$.transectName.value = transectName;
	$.surveyor.value = surveyor;
	$.plotDistance.value = plotDistance;
	$.comments.value = comments;
	
	//TODO: perhaps an ENUM or CONSTANT would be useful here
	if (stakeOrientation === "Top Left / Bottom Right") {
		$.stakeBar.index = 0;
	} else if (stakeOrientation === "Top Right / Bottom Left") {
		$.stakeBar.index = 1;
	} else {
		alert('invalid stakeOrientation value');
	}
} catch (e) {
	alert ('DEV ALERT - transectsModal try/catch failed');
} finally {
	resultRow.close();
	db.close();
}

// Initially disable input fields
$.transectName.editable = false;
$.surveyor.editable = false;
$.plotDistance.editable = false;
$.comments.editable = false;


/* Listeners */

//TODO: Confirm all conditions with project specs, project sponsor
// When an input field loses focus check for errors
$.transectName.addEventListener('blur', function(e) {
	if ($.transectName.value.length < 2) {
		$.transectError.visible = true;
		$.transectError.text = "Transect name should be at least 2 characters";
	} else {
		$.transectError.visible = false;
	}
});
$.surveyor.addEventListener('blur', function(e) {
	if ($.surveyor.value.length < 2) {
		$.surveyorError.visible = true;
		$.surveyorError.text = "Surveyor should have at least 2 characters";
	} else {
		$.surveyorError.visible = false;
	}
});
$.plotDistance.addEventListener('blur', function(e) {
	if ($.plotDistance.value < 1) {
		$.plotDistanceError.visible = true;
		$.plotDistanceError.text = "Plot distance should be at least 1 meter";
	} else if ($.plotDistance.value > 50) {
		$.plotDistanceError.visible = true;
		$.plotDistanceError.text = "Plot distance should be at most 50 meters";
	} else {
		$.plotDistanceError.visible = false;
	}
});

$.stakeBar.addEventListener('blur', function(e) {
	//TODO
});

$.comments.addEventListener('blur', function(e) {
	//TODO
});

// Replace bad input (non-numbers) on plotDistance TextField
$.plotDistance.addEventListener('change', function(e) {
	e.source.value = e.source.value.replace(/[^0-9]+/,"");
});

// TESTING - an example of restricting the keyboard input
//Listen and replace bad input on transectName
//$.transectName.addEventListener('change', function (e) {
//	e.source.value = e.source.value.replace(/[^0-9a-zA-Z ()_,.-]/,"");
//});


/* Functions */

//swaps editable property of fields
function editBtnClick(e){
	//enable or disable edit mode
    if (e.source.title == "Edit") {
    	$.modalWin.editing = true;
        e.source.title = "Done";
        
        //Enable editing
        $.transectName.editable = true;
		$.surveyor.editable = true;
		$.plotDistance.editable = true;
		stakeBarLabels[0].enabled = true;
		stakeBarLabels[1].enabled = true;
		$.stakeBar.labels = stakeBarLabels;
		$.comments.editable = true;
        
        //disable the button button during edit mode
        $.backBtn.enabled = false;
        
    } else { //title is "Done"
    	//fire error-checking listeners
    	$.transectName.blur();
    	$.surveyor.blur();
    	$.plotDistance.blur();
   		if (($.transectError.visible == true)||($.surveyorError.visible == true)||($.plotDistanceError.visible == true)) {
   			return;
   		}
    	
        $.modalWin.editing = false;
        e.source.title = "Edit";
        //enable the back button
        $.backBtn.enabled = true;
        
        //disable editing
        $.transectName.editable = false;
		$.surveyor.editable = false;
		$.plotDistance.editable = false;
		stakeBarLabels[0].enabled = false;
		stakeBarLabels[1].enabled = false;
		$.stakeBar.labels = stakeBarLabels;
		$.comments.editable = false;
		
		saveEdit();
    }
}

//Save changes to transect
function saveEdit(){
	try {
		var db = Ti.Database.open('ltemaDB');
		db.execute( 'UPDATE OR FAIL transect SET transect_name= ?, surveyor= ?, plot_distance= ?, stake_orientation= ?, comments= ? WHERE transect_id= ?',
					$.transectName.value, $.surveyor.value, $.plotDistance.value, stakeBarLabels[$.stakeBar.index].title, $.comments.value, transectID);		
	} catch (e){
		alert ('DEV ALERT: transectsModal saveEdit() catch');
	} finally {
		db.close();
	}
	
}

//Navigate back
function backBtnClick(){
	Ti.App.fireEvent("app:refreshTransects");
	$.modalNav.close();
}