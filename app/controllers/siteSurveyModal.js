/* A screen to dislay or possibly edit site survey details */

//get siteID from calling window
var args = arguments[0];
var siteID = args.siteID;

//Query the database for values associated with the siteID
var db = Ti.Database.open('ltemaDB');

row = db.execute(	'SELECT site_id, year, protocol_name, park_name, biome_name, exported \
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

row.close();
db.close();

//Assign view labels
$.modalWin.title = siteYear + " - " + protocolName + " - " + parkName;
$.parkName.text = parkName;
$.siteID.text = siteID;
$.siteYear.text = siteYear;
$.protocolName.text = protocolName;
$.biome.text = biome;

if (exported != null) {
	var utc = parseInt(exported);
	var d = new Date(utc);
	$.exportDate.text = d.toDateString();
}


/* Functions */
/*
function editBtnClick(){
	alert("You clicked the edit button");
}
*/
function backBtnClick(){
	$.modalNav.close();
}