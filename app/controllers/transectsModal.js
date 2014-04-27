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
var initialTransectName = transectName;
var surveyor = row.fieldByName('surveyor');
var initialSurveyor = surveyor;
var plotDistance = row.fieldByName('plot_distance');
var initialPlotDistance = plotDistance;
var stakeOrientation = row.fieldByName('stake_orientation');
var comments = row.fieldByName('comments');

row.close();
db.close();

//Assign label text fields
$.transectName.value = transectName;
$.surveyor.value = surveyor;
$.plotDistance.value = plotDistance;
$.comments.value = comments;

if (stakeOrientation === "Top Left / Bottom Right") {
	$.pickStake.index = 0;
} else if (stakeOrientation === "Top Right / Bottom Left") {
	$.pickStake.index = 1;
} else {
	alert('invalid stakeOrientation value');
}

//Listen for keyboard return key, attempt to dismiss keyboard (not working at present - Issue # 11)
$.transectName.addEventListener('return', function(e) {$.transectName.blur();});
$.surveyor.addEventListener('return', function() {$.surveyor.blur();});
$.plotDistance.addEventListener('return', function() {$.plotDistance.blur();});
$.comments.addEventListener('return', function() {$.comments.blur();});

//Listen and replace bad input (non-numbers) on plotDistance
$.plotDistance.addEventListener('change', function(e) {
	e.source.value = e.source.value.replace(/[^0-9]+/,"");
});

//Listen and replace bad input on transectName
//$.transectName.addEventListener('change', function (e) {
//	e.source.value = e.source.value.replace(/[^0-9a-zA-Z ()_,.-]/,"");
//});

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
		$.pickStake.labels[0].enabled = true;
		$.pickStake.labels[1].enabled = true;
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
		$.pickStake.labels[0].enabled = false;
		$.pickStake.labels[1].enabled = false;
		$.comments.editable = false;
		saveEdit();
    }
}

//Save changes to transect
function saveEdit(){
	//validate input
	//TODO: Confirm all conditions with project specs, project sponsor
	var didError = false;
	if ($.transectName.value.length < 2) {
		alert('Transect Name should be at least 2 letters');
		$.transectName.value = initialTransectName;
		didError = true;
	}
	if ($.surveyor.value.length < 2) {
		alert('Head surveyor name should be at least 2 letters');
		$.surveyor.value = initialSurveyor;
		didError = true;
	}
	if ($.plotDistance.value < 1) {
		alert('Minimum plot distance is 1 meter');
		$.plotDistance.value = initialPlotDistance;
		didError = true;
	}
	if ($.plotDistance.value > 99) {
		alert('Maximum plot distance is 99 meters');
		$.plotDistance.value = initialPlotDistance;
		didError = true;
	}
	
	if (didError) {
		return;
	}
	
	//input is valid, store it
	var db = Ti.Database.open('ltemaDB');
	db.execute( 'UPDATE OR FAIL transect SET transect_name= ?, surveyor= ?, plot_distance= ?, comments= ? WHERE transect_id= ?',
				$.transectName.value, $.surveyor.value, $.plotDistance.value, $.comments.value, transectID);
	db.close();
	
	//refresh successfully stored values to cope with multiple edits
	initialTransectName = $.transectName.value;
	initialSurveyor = $.surveyor.value;
	initialPlotDistance = $.plotDistance.value;
}