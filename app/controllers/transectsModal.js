/* A screen to view and edit transect details */

//get transectID from calling window
var args = arguments[0];
var transectID = args.transectID;

//Query the database for values associated with a transectID
var db = Ti.Database.open('ltemaDB');

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
$.plotDistance.value = plotDistance;
$.stakeOrientation.text = stakeOrientation;
$.comments.value = comments;

//Listen for keyboard return key, attempt to dismiss keyboard (not working at present - Issue # 11)
$.transectName.addEventListener('return', function(e) {$.transectName.blur();});
$.surveyor.addEventListener('return', function() {$.surveyor.blur();});
$.plotDistance.addEventListener('return', function() {$.plotDistance.blur();});
$.comments.addEventListener('return', function() {$.comments.blur();});

//Listen and replace bad input (non-numbers) on plotDistance
$.plotDistance.addEventListener('change', function(e) {
	e.source.value = e.source.value.replace(/[^0-9]+/,"");
});

//initially disable fields
$.transectName.editable = false;
$.surveyor.editable = false;
$.plotDistance.editable = false;
$.comments.editable = false;


/* Functions */

//Navigate back
function backBtnClick(){
	Ti.App.fireEvent("app:refreshTransects");
	$.modalNav.close();
}

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
		$.plotDistance.editable = false;
		$.comments.editable = false;
		saveEdit();
    }
}

//Save changes to transect
function saveEdit(){
	var db = Ti.Database.open('ltemaDB');
	db.execute( 'UPDATE OR FAIL transect SET transect_name= ?, surveyor= ?, plot_distance= ?, comments= ? WHERE transect_id= ?',
				$.transectName.value, $.surveyor.value, $.plotDistance.value, $.comments.value, transectID);
	db.close();
}