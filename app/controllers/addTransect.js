//get calling params
var args = arguments[0];
var siteID = args.siteID;
var transectCount = args.transectCount;

// Initialize Variables
var photo;
var utmEasting;
var utmNorthing;
var utmZone;

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

		//** will need to clean up and add validation
		//*** Put a if photo exists here****
		var photoName = savePhoto(photo, transectCount);
		
		try{
			//Connect to database
			var db = Ti.Database.open('ltemaDB');
			
			//add photo name to media table
			db.execute( 'INSERT INTO media (media_name) VALUES (?)', photoName);
			
			//get the id of the last row inserted into the database - *not sure if this is acceptable sql code to use?
			var results = db.execute('SELECT last_insert_rowid() as mediaID');
			var mediaID = results.fieldByName('mediaID');
			
			//Insert Query - add row to transect table
			db.execute(	'INSERT INTO transect (transect_name,surveyor,other_surveyors,plot_distance,stake_orientation,utm_zone,utm_easting,utm_northing,comments,site_id,media_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)', 
						$.tsctName.value, $.srvyName.value, $.otherSrvyName.value, $.plotDist.value, stakeText, utmZone, utmEasting, utmNorthing, $.comments.value, siteID, mediaID);
						
		}catch(e){
			
		}finally{	
			//close the result set
			results.close();	
			//Close the database
			db.close();
			//refresh and close
			Ti.App.fireEvent("app:refreshTransects");
			$.addTransect.close();
		}
	}
}

function takePhoto() {		
	
	//call camera module and set thumbnail
	var pic = require('camera');
	pic.getPhoto(function(myPhoto, UTMEasting, UTMNorthing, n_UTMZone) {
		//Set thumbnail
		$.transectThumbnail.image = myPhoto;
		
		//set variables with values
		photo = myPhoto;
		utmEasting = UTMEasting;
		utmNorthing = UTMNorthing;
		utmZone = n_UTMZone;
		
		//alert("UTMEasting: " + UTMEasting + "\nUTMNorthing: " + UTMNorthing + "\nUTMZone: " + n_UTMZone);
	});
}

//Name and save photo to filesystem - do this when done btn is pressed
function savePhoto(photo, transectCount){
	var dir = "site" + siteID;
	var img = photo; 
	var filename = "T"+ (transectCount + 1);
	
	// Create image Directory for site
	var imageDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, dir);
	if (! imageDir.exists()) {
    	imageDir.createDirectory();
	}
	
	// .resolve() provides the resolved native path for the directory.
	var imageFile  = Ti.Filesystem.getFile(imageDir.resolve(), filename + '.jpg');
	imageFile.write(img);
	
	//var path = dir + Ti.Filesystem.separator + filename + '.jpg';
	
	var path = filename + '.jpg';
	return path;
}