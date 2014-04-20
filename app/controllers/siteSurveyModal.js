var args = arguments[0];
var siteID = args.siteID;
//Open database
var db = Ti.Database.install('/ltema.sqlite', 'ltemaDB');

//Query - retrieve site values
row = db.execute(	'SELECT site_id, year, protocol_name, park_name ' +
					'FROM site_survey s, protocol p, park prk ' + 
					'WHERE s.protocol_id = p.protocol_id ' + 
					'AND s.park_id = prk.park_id ' +
					'AND site_id = ' + siteID);
					
var siteYear = row.fieldByName('year');
var protocolName = row.fieldByName('protocol_name');
var parkName = row.fieldByName('park_name');

row.close();
db.close();

$.modalWin.title = siteYear + " - " + protocolName + " - " + parkName;
$.parkName.text = parkName;
$.siteID.text = siteID;
$.siteYear.text = siteYear;
$.protocolName.text = protocolName;

function editBtnClick(){
	alert("You clicked the edit button");
}
function backBtnClick(){
	$.modalNav.close();
}