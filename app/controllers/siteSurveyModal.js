/* A screen to dislay or possibly edit site survey details */

//get siteID from calling window
var args = arguments[0];
var siteID = args.siteID;

//Query the database for values associated with the siteID
try {
	var db = Ti.Database.open('ltemaDB');
	
	row = db.execute(
		'SELECT site_id, year, protocol_name, park_name, biome_name, exported \
		FROM site_survey s, protocol p, park prk, biome bio \
		WHERE p.biome_id = bio.biome_id \
		AND s.protocol_id = p.protocol_id \
		AND s.park_id = prk.park_id \
		AND site_id = ?', siteID);
						
	var siteYear = row.fieldByName('year');
	var protocolName = row.fieldByName('protocol_name');
	var biome = row.fieldByName('biome_name');
	var parkName = row.fieldByName('park_name');
	var exported = row.fieldByName('exported');
	
	transectsResult = db.execute (
		'SELECT transect_name, utm_easting, utm_northing, media_id \
		FROM transect \
		WHERE site_id = ?', siteID);
	
	var surveyTransects = [];
	var index = 0;
	while (transectsResult.isValidRow()) {
		var transectName = transectsResult.fieldByName('transect_name');
		var utmEasting = transectsResult.fieldByName('utm_easting');
		var utmNorthing = transectsResult.fieldByName('utm_northing');
		var mediaID = transectsResult.fieldByName('media_id');
		
		surveyTransects[index] = {
			transectName:transectName,
			utmEasting:utmEasting,
			utmNorthing:utmNorthing,
			mediaID:mediaID
		};
		index ++;
		transectsResult.next();
	}
} catch(e) {
	var errorMessage = e.message;
	Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
} finally {
	transectsResult.close();
	row.close();
	db.close();
}

//Custom font modal title
var title = parkName;

var titleLabel = Titanium.UI.createLabel({
	text:title,
	font:{fontSize:20,fontWeight:'bold'}
});

//Assign view labels
$.modalWin.setTitleControl(titleLabel);
$.siteYear.text = siteYear;
$.protocolName.text = protocolName;
$.biome.text = biome;

if (exported != null) {
	var utc = parseInt(exported);
	var d = new Date(utc);
	$.exportDate.text = d.toDateString();
}

var nextTopDistance = 340;
for (var i in surveyTransects) {
	var loopLabel = Ti.UI.createLabel({
		top: nextTopDistance,
		left: 40,
		font: {fontSize: 20}
	});
	var utmLabel = Ti.UI.createLabel({
		top: nextTopDistance,
		left: 200,
		font: {fontSize: 20}
	});
	loopLabel.text = surveyTransects[i].transectName;
	var utmText = "Easting: " + surveyTransects[i].utmEasting + " - Northing: " + surveyTransects[i].utmNorthing;
	utmLabel.text = utmText;
	$.modalNav.add(loopLabel);
	$.modalNav.add(utmLabel);
	nextTopDistance += 60;
}

/* Functions */

function backBtnClick(){
	$.modalNav.close();
}