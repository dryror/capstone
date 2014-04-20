//transectID expected to be passed by parent window
var args = arguments[0];
var transectID = args.transectID;

//Open database
var db = Ti.Database.install('/ltema.sqlite', 'ltemaDB');

//Query - retrieve editable site values
row = db.execute(	'SELECT transect_id, transect_name, surveyor, plot_distance, stake_orientation, comments ' +
					'FROM transect t ' + 
					'WHERE transect_id = ' + transectID);
					
var transectName = row.fieldByName('transect_name');
var surveyor = row.fieldByName('surveyor');
var plotDistance = row.fieldByName('plot_distance');
var stakeOrientation = row.fieldByName('stake_orientation');
var comments = row.fieldByName('comments');

row.close();
db.close();

//Assign label text fields
$.transectName.value = transectName;
$.surveyor.value = surveyor;
$.plotDistance.text = plotDistance;
$.stakeOrientation.text = stakeOrientation;
$.comments.value = comments;

//Save changes button is only visible when edit toggle enabled
$.toggleSaveBtn.visible = false;    // in titanium getters and setters have not been implemented on very UI object.
									// this is one such case
//initially disable fields
$.transectName.editable = false;
$.surveyor.editable = false;
$.comments.editable = false;

function backBtnClick(){
	$.modalWin.close();
}

//swaps editable property of fields
function toggleEdit(){
	if ($.toggleEditSwitch.value == true) {
		$.toggleLbl.visible = false;
		$.toggleSaveBtn.visible = true;
		
		$.transectName.editable = true;
		$.surveyor.editable = true;
		$.comments.editable = true;
		
	} else if ($.toggleEditSwitch.value == false) {
		$.toggleSaveBtn.visible = false;
		$.toggleLbl.visible = true;
		
		$.transectName.editable = false;
		$.surveyor.editable = false;
		$.comments.editable = false;
						
	} else {
		alert("non-boolean toggleEditSwitch value");
	};	
}

function saveEdit(){
	alert("saveEdit clicked");
}
