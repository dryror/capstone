/* A screen to view and edit plot details */

// Get plotID from calling window
var args = arguments[0];
var plotID = args.plotID;
var plotName = args.title;

//Set the title of the modal to the plot name
var titleLabel = Titanium.UI.createLabel({
    height:34,
    //width:350,  //long park names may need this set
    top:10,
    text:plotName,
    textAlign:'center',
    font:{fontSize:20,fontWeight:'bold'},
});
// associate label to title
$.modalWin.setTitleControl(titleLabel);

// Query database plot table for all required data
try{
	var db = Ti.Database.open('ltemaDB');
	
	var results = db.execute('SELECT plot_name, utm_zone, utm_northing, utm_easting, utc, stake_deviation, distance_deviation, transect_id, media_id, comments \
	 						 FROM plot \
	 						 WHERE plot_id = ?', plotID);
	
	
	//var plotName = results.fieldByName('plot_name');
	//var utmZone = results.fieldByName('utm_zone');
	//var utmNorthing = results.fieldByName('utm_northing');
	//var utmEasting = results.fieldByName('utm_easting');
	var utc = results.fieldByName('utc');
	var stakeOrientation = results.fieldByName('stake_deviation');
	var plotDistance = results.fieldByName('distance_deviation');
	//var transectID = results.fieldByName('transect_id');			
	//var mediaID = results.fieldByName('media_id');		
	var comments = results.fieldByName('comments');			
		
}catch(e){
	var errorMessage = e.message;
	Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
}finally{
	results.close();
	db.close();
}

//ORIGINAL stakeOrientation & plotDistance Values****
var orginal_stakeOrientation = stakeOrientation;
var original_plotDistance = plotDistance;

//Set Plot Name
$.nameLbl.text = plotName;

//get the date the plot was initially recored
var UTC = Number(utc);
var d = new Date(UTC);
var nd = d.toUTCString();

$.dateRecorded.text = nd;

//Set Tabbed Bar Labels & disable selection
var stakeOrientationTabbedBar = [{title:stakeOrientation, enabled:false}, {title:"Other", enabled:false}];
var plotDistanceTabbedBar = [{title:plotDistance, enabled:false}, {title:"Other", enabled:false}];

$.pickStake.labels = stakeOrientationTabbedBar;
$.pickDistance.labels = plotDistanceTabbedBar;

// Set stake deviation and plot distance labels to default selection and disable
$.pickStake.index = 0;
$.pickDistance.index = 0;

//Assign Values to editable fields
$.comments.value = comments;

//Disable editing text fields
$.comments.editable = false;

var stakeOther = false;
var distanceOther = false;

// BACK BUTTON - navigate back to plot list screen
function backBtn(){
	Ti.App.fireEvent("app:refreshPlots");
	$.modalNav.close();
}

// EDIT BUTTON
function editBtn(e){
	
	//enable or disable edit mode
	if (e.source.title == "Edit") {
		errorOnPage = false;
		$.modalWin.editing = true;
		e.source.title = "Done";
		
		//Enable editing
		stakeOrientationTabbedBar[0].enabled = true;
		stakeOrientationTabbedBar[1].enabled = true;
		plotDistanceTabbedBar[0].enabled = true;
		plotDistanceTabbedBar[1].enabled = true;
		$.pickStake.labels = stakeOrientationTabbedBar;
		$.pickDistance.labels = plotDistanceTabbedBar;
		$.comments.editable = true;
		$.stakeDeviation.editable = true;
		$.distanceDeviation.editable = true;
		
		//disable the button button during edit mode
		$.backBtn.enabled = false;
	} else { //if the title says "Done"
		var errorOnPage = false;
		if(stakeOther == true){
			if($.stakeError.visible == true || $.stakeOtherError.visible == true){
				errorOnPage = true;
			}
		}
	
		if(distanceOther == true){
			if($.distanceError.visible == true || $.distanceOtherError.visible == true){
				errorOnPage = true;
			}
		}

		if ($.pickStake.index == 1) {
			if ($.stakeDeviation.value === "") {
				$.stakeOtherError.visible = true;
				errorOnPage = true;
			}
			stakeOrientation = $.stakeDeviation.value;
		}else{
			stakeOrientation = orginal_stakeOrientation;
		}	
		
		if ($.pickDistance.index == 1) {
			if ($.distanceDeviation.value === "") {
				$.distanceOtherError.visible = true;
				errorOnPage = true;
			}
			plotDistance = $.distanceDeviation.value;
		}else{
			plotDistance = original_plotDistance;
		}
	
		if(errorOnPage){
			return;
		}else{
			$.modalWin.editing = false;
			e.source.title = "Edit";
			$.backBtn.enabled = true;
		
			//Disable editing
			stakeOrientationTabbedBar[0].enabled = false;
			stakeOrientationTabbedBar[1].enabled = false;
			plotDistanceTabbedBar[0].enabled = false;
			plotDistanceTabbedBar[1].enabled = false;
			$.pickStake.labels = stakeOrientationTabbedBar;
			$.pickDistance.labels = plotDistanceTabbedBar;
			$.comments.editable = false;
			$.stakeDeviation.editable = false;
			$.distanceDeviation.editable = false;
		
			saveEdit(e);
		}
	}
}

// SAVE EDIT - check for errors & save when done btn selected
function saveEdit(e){
	//disable button for 1 second to prevent double entry
	e.source.enabled = false;
	setTimeout(function(){ e.source.enabled = true; },1000);
	
	//Get the value of the comments field
	comments = $.comments.value;
		
	try{
		//Connect to database
		var db = Ti.Database.open('ltemaDB');
		
		//Insert Query - update row in plot table
		db.execute(	'UPDATE OR FAIL plot SET stake_deviation = ?, distance_deviation = ?, comments = ? WHERE plot_id = ?', 
					stakeOrientation, plotDistance, comments, plotID);
			
	}catch(e){
		Ti.API.error(e.toString());	
		//Close the database
		db.close();
	}
}

/* Event Listeners */

// Show and hide the deviation text field depending on what is selected
$.pickStake.addEventListener('click', function(e) {
	//remove any text from this field
	$.stakeDeviation.value = "";
	//$.stakeDeviation.value = null;
	
	$.stakeError.visible = false;
	$.stakeOtherError.visible = false;
	if (stakeOther === false && e.source.labels[e.index].title === "Other") {
		$.distanceLbl.top += 60;
		$.pickDistance.top += 60;
		$.distanceError.top += 60;
		$.distanceDeviation.top += 60;
		$.distanceOtherError.top +=60;
		$.commentLbl.top += 60;
		$.comments.top += 60;
		$.dateRecordedLbl.top += 60;
		$.dateRecorded.top += 60;
		//$.info.top += 60;
		$.stakeDeviation.visible = true;
		$.stakeDeviation.focus();
		stakeOther = true;
	}
	if (stakeOther === true && e.source.labels[e.index].title !== "Other") {
		$.distanceLbl.top -= 60;
		$.pickDistance.top -= 60;
		$.distanceError.top -= 60;
		$.distanceDeviation.top -= 60;
		$.distanceOtherError.top -=60;
		$.commentLbl.top -= 60;
		$.comments.top -= 60;
		$.dateRecordedLbl.top -= 60;
		$.dateRecorded.top -= 60;
		//$.info.top -= 60;
		$.stakeDeviation.visible = false;
		$.stakeDeviation.blur();
		stakeOther = false;
	}	
});

// Show and hide the deviation text field depending on what is selected
$.pickDistance.addEventListener('click', function(e) {
	//remove any text from this field
	$.distanceDeviation.value = "";
	//$.distanceDeviation.value = null;
	
	$.distanceError.visible = false;
	$.distanceOtherError.visible = false;
	if (distanceOther === false && e.source.labels[e.index].title === "Other") {
		$.commentLbl.top += 60;
		$.comments.top += 60;
		$.dateRecordedLbl.top += 60;
		$.dateRecorded.top += 60;
		//$.info.top += 60;
		$.distanceDeviation.visible = true;
		$.distanceDeviation.focus();
		distanceOther = true;
	}
	if (distanceOther === true && e.source.labels[e.index].title !== "Other") {
		$.commentLbl.top -= 60;
		$.comments.top -= 60;
		$.dateRecordedLbl.top -= 60;
		$.dateRecorded.top -= 60;
		//$.info.top -= 60;
		$.distanceDeviation.visible = false;
		$.distanceDeviation.blur();
		distanceOther = false;
	}
});

// Stake Orientation
$.stakeDeviation.addEventListener('change', function(e) {
	if (e.value.length < 4) {
		$.stakeOtherError.visible = true;
		$.stakeOtherError.text = "* Stake orientation must be a minimum of 4 characters";
	} else {
		$.stakeOtherError.visible = false;
	}
});

//Plot Distance
$.distanceDeviation.addEventListener('change', function(e) {
	// Replace bad input (non-numbers) on plotDistance TextField
	e.source.value = e.source.value.replace(/[^0-9]+/,"");
	Ti.App.fireEvent('distanceDeviationChange');
});
Ti.App.addEventListener('distanceDeviationChange', function(e) {
	if (e.value === "") {
		$.distanceOtherError.visible = true;
	} else if ($.distanceDeviation.value < 2) {
		$.distanceOtherError.visible = true;
		$.distanceOtherError.text = "* Plot distance should be at least 2 meters";
	} else if ($.distanceDeviation.value > 30) {
		$.distanceOtherError.visible = true;
		$.distanceOtherError.text = "* Plot distance should be at most 30 meters";
	} else {
		$.distanceOtherError.visible = false;
	}
});