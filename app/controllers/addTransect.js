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
	//skipping photo
	} else {
		alert('Ready to add transect to database');
	}
}

function takePhoto(){
	//call camera module and set thumbnail
	var pic = require('camera');
	pic.getPhoto(function(myPhoto) {
		$.transectThumbnail.image = myPhoto;
	});
}
