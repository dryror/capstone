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
$.transectName.text = transectName;
$.surveyor.text = surveyor;
$.plotDistance.text = plotDistance;
$.stakeOrientation.text = stakeOrientation;
$.comments.text = comments;

function editBtnClick(){
	alert("You clicked the edit button");
}
function backBtnClick(){
	$.modalWin.close();
}