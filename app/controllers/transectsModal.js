//get transectID from calling window
var args = arguments[0];
var transectID = args.transectID;

//Open database
var db = Ti.Database.open('ltemaDB');

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

//initially disable fields
$.transectName.editable = false;
$.surveyor.editable = false;
$.comments.editable = false;

//hide save button
//$.toggleSaveBtn.visible = false;    // in titanium getters and setters have not been implemented on very UI object.
									// this is one such case

function backBtnClick(){
	Ti.App.fireEvent("app:refreshTransects");
	$.modalNav.close();
}

//swaps editable property of fields
/*
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
*/

function editBtnClick(e){
	//enable or disable edit mode
    if (e.source.title == "Edit") {
    	$.modalWin.editing = true;
        e.source.title = "Done";
        
        //Enable editing
        $.transectName.editable = true;
		$.surveyor.editable = true;
		$.comments.editable = true;
        
        //disable the button button during edit mode
        $.backBtn.enabled = false;
        
    } else { 
        $.modalWin.editing = false;
        e.source.title = "Edit";
        //enable the back button
        $.backBtn.enabled = true;
        
        //disable editing
        $.transectName.editable = false;
		$.surveyor.editable = false;
		$.comments.editable = false;
		saveEdit();
    }
}

function saveEdit(){
	//Connect to database
	var db = Ti.Database.open('ltemaDB');

	//Query - update transect
	row = db.execute(	'UPDATE OR FAIL transect ' + 
						'SET transect_name = \'' + $.transectName.value + '\' ' +
						', surveyor = \'' + $.surveyor.value + '\' ' +
						', comments = \'' + $.comments.value + '\' ' +
						'WHERE transect_id = ' + transectID);
	db.close();
	//Ti.App.fireEvent('updateTransects');
	//$.modalWin.close();
}
