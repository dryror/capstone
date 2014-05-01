//get calling params
var args = arguments[0];
var siteID = args.siteID;

//validate form before inserting to database
function doneBtn(){
	if ($.tsctName.value == "") {
		alert('No transect name entered');
		return;
	} else if ($.srvyName.value == "") {
		alert('No survey name entered');
		return;
	//otherSrvyName skipped, other surveyors is probably optional
	} else if ($.pickStake.index == null) {
		alert('Stake orientation not selected');
		return;
	} else if ($.plotDist.value == "") {
		alert('Select a plot distance');
		return;
	//skipping comments,
	//skipping photo for now
	} else {
		//set stake orientation text
		var stakeText;
		if ($.pickStake.index == 0) {
			stakeText = "Top Left / Bottom Right";
		} else {
			stakeText = "Top Right / Bottom Left";
		}

		//Connect to database
		var db = Ti.Database.open('ltemaDB');
	
		//Insert Query - add row to transect table
		db.execute(	'INSERT INTO transect (transect_name,surveyor,other_surveyors,plot_distance,stake_orientation,comments,site_id) VALUES (?,?,?,?,?,?,?)', 
					$.tsctName.value, $.srvyName.value, $.otherSrvyName.value, $.plotDist.value, stakeText, $.comments.value, siteID);
		//Close the database
		db.close();
		//refresh and close
		Ti.App.fireEvent("app:refreshTransects");
		$.addTransect.close();
	}
}

function takePhoto() {		
	
	//call camera module and set thumbnail
	var pic = require('camera');
	pic.getPhoto(function(myPhoto, UTMEasting, UTMNorthing, n_UTMZone) {
		//Set thumbnail
		$.transectThumbnail.image = myPhoto;
		
		alert("UTMEasting: " + UTMEasting + "\nUTMNorthing: " + UTMNorthing + "\nUTMZone: " + n_UTMZone);
	
	});
}
