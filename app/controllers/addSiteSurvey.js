/* Site survey creation screen with validation */

// Tabbed Bar Labels
var pickBiomeLabels = [];
var pickProtocolLabels = [];

// Populate the biome TabbedBar with database-derived labels
try {
	var db = Ti.Database.open('ltemaDB');
	var biomeResultRows = db.execute('SELECT biome_name FROM biome ');
	while (biomeResultRows.isValidRow()) {
		var biomeName = biomeResultRows.fieldByName('biome_name');
		pickBiomeLabels.push({title:biomeName, enabled:true});
		biomeResultRows.next();
	}
} catch(e) {
	var errorMessage = e.message;
	Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
} finally {
	biomeResultRows.close();
	db.close();
	$.pickBiome.labels = pickBiomeLabels;
}

/* Nav Bar Label */

// Build title label

var labelText = 'New Site Survey';

var titleLabel = Titanium.UI.createLabel({
	top:10,
	text: labelText,
	textAlign:'center',
	font:{fontSize:20,fontWeight:'bold'},
});

// Associate label to title
$.addSiteSurveyWin.setTitleControl(titleLabel);

// Instruciton text
var instructions = "Start typing in the search bar to find a park.\n\n" +
					"Picking a Biome will show its Protocols to choose from.\n\n" +
					"Pick a Protocol and click the Done button to create the new site survey.";
$.info.text = instructions;

/* Event Listeners */

// Regenerate protocol TabbedBar based on biome selected
$.pickBiome.addEventListener('click', function(e) {
	//remove old list
	$.pickProtocol.index = -1;
	$.pickBiomeError.visible = false;
	$.pickProtocolError.visible = false;
	while (pickProtocolLabels.length > 0) {
		pickProtocolLabels.pop();
	}
	//populate new list based on new biome selected
	try {
		var db = Ti.Database.open('ltemaDB');
		var protocolResultRows = db.execute('SELECT protocol_name \
											FROM protocol p, biome b \
											WHERE p.biome_id = b.biome_id \
											AND  b.biome_name =?', pickBiomeLabels[e.index].title);
		while (protocolResultRows.isValidRow()) {
			var protocolName = protocolResultRows.fieldByName('protocol_name');
			pickProtocolLabels.push({title:protocolName, enabled:true});
			protocolResultRows.next();
		}
	} catch (e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		protocolResultRows.close();
		db.close();
	}
	
	//refresh TabbedBar
	$.pickProtocol.labels = pickProtocolLabels;
	
	//TODO: obtain user feedback, disabled for testing
	//auto-select protocol if there's only one
	//if ($.pickProtocol.labels.length == 1) {
	//	$.pickProtocol.index = 0;
	//}
});

// Check for unsupported protocols
$.pickProtocol.addEventListener('click', function(e) {
	if ((pickProtocolLabels[e.index].title !== "Alpine") && (pickProtocolLabels[e.index].title !== "Grassland")) {
		$.pickProtocolError.text = "Unsupported protocol by LTEMA at this time";
		$.pickProtocolError.visible = true;
	} else {
		$.pickProtocolError.visible = false;
	}
});

// Closes the popup result window if user navigates away from this screen 
// (improves performance related to issue #14)
$.parkSrch.addEventListener('blur', function(e) {
	win.close();
});


/* Functions */

//Test for form completeness before adding to database
function doneBtn(){	
	if (($.parkSrch.value == null) || ($.parkSrch.value == "")) {
		$.parkSrchError.text = "Please select a park";
		$.parkSrchError.visible = true;
		return;
	}else if ($.pickBiome.index == null) {
		$.pickBiomeError.text = "Please select a biome";
		$.pickBiomeError.visible = true;
		return;
	}else if (($.pickProtocol.index == null) || ($.pickProtocol.index == -1)) {
		$.pickProtocolError.text = "Please select a protocol";
		$.pickProtocolError.visible = true;
		return;
	} else if (($.pickProtocol.labels[$.pickProtocol.index].title !== "Alpine") && ($.pickProtocol.labels[$.pickProtocol.index].title !== "Grassland")) {
		$.pickProtocolError.text = "Unsupported protocol by LTEMA at this time";
		$.pickProtocolError.visible = true;
		return;
	} else {
		$.parkSrchError.visible = false;
		$.pickBiomeError.visible = false;
		$.pickProtocolError.visible = false;
		try {
			var db = Ti.Database.open('ltemaDB');
			var currentYear = new Date().getFullYear().toString();
			var protocolResult = db.execute('SELECT protocol_id FROM protocol WHERE protocol_name =?', $.pickProtocol.labels[$.pickProtocol.index].title);
			var protocolID = protocolResult.fieldByName('protocol_id');
			var parkResult = db.execute('SELECT park_id FROM park WHERE park_name =?', $.parkSrch.value);
			var parkID = parkResult.fieldByName('park_id');
			
			// Check if this site has been previously surveyed
			var previousSurveys = db.execute('SELECT site_id FROM site_survey \
											WHERE protocol_id = ? \
											AND park_id = ?', protocolID, parkID);
			
			// Get the most recently entered survey
			var id;								
			while (previousSurveys.isValidRow()) {
				id = previousSurveys.fieldByName('site_id');
				previousSurveys.next();
			}
			
			
			// Insert the new survey
			db.execute( 'INSERT INTO site_survey (year, protocol_id, park_id) VALUES (?,?,?)', currentYear, protocolID, parkID);
			
			//get the id of the last row inserted into the database - *not sure if this is acceptable sql code to use?
			var results = db.execute('SELECT last_insert_rowid() as siteID');
			var siteID = results.fieldByName('siteID');
			
			// Get the transects associated with the survey
			if (id != null) {
				var transects = db.execute('SELECT * FROM transect WHERE site_id = ?', id);
			
				// Copy and associate any exiting transects
				while (transects.isValidRow()) {
					var transectName = transects.fieldByName('transect_name');
					var surveyor = transects.fieldByName('surveyor');
					var otherSurveyors = transects.fieldByName('other_surveyors');
					var plotDistance = transects.fieldByName('plot_distance');
					var stakeOrientation = transects.fieldByName('stake_orientation');
					var utmZone = transects.fieldByName('utm_zone');
					var utmEasting = transects.fieldByName('utm_easting');
					var utmNorthing = transects.fieldByName('utm_northing');
					var tComments = transects.fieldByName('comments');
					var mediaID = transects.fieldByName('media_id');
					
					db.execute('INSERT INTO transect (transect_name, surveyor, other_surveyors, plot_distance, stake_orientation, \
						utm_zone, utm_easting, utm_northing, comments, site_id, media_id) \
						VALUES (?,?,?,?,?,?,?,?,?,?,?)', transectName, surveyor, otherSurveyors, plotDistance, stakeOrientation, utmZone, 
						utmEasting, utmNorthing, tComments, siteID, mediaID);
					transects.next();
				}
				transects.close();
			}
				
			Ti.App.fireEvent("app:refreshSiteSurveys");		
		} catch (e){
			var errorMessage = e.message;
			Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
		} finally {
			protocolResult.close();
			parkResult.close();
			previousSurveys.close();
			results.close();
			db.close();
			$.addSiteSurveyWin.close();
		}
	}
}


/* Everything that follows is search bar related */

// SEARCH BAR ACTIONS

//var last_search = null;
var timers = 0;

//create the popup window to show search results
var win = Ti.UI.createWindow({
	borderColor : "#C0C0C0",
	scrollable : true,
	height: 330,
	left : 200,
	right : 20,
	top : 135,
	borderRadius : 0,
	borderWidth: 3,
	title : 'park names',
	orientationModes : [Ti.UI.PORTRAIT, Ti.UI.UPSIDE_PORTRAIT]
});


//AUTOCOMPLETE TABLE - list of results from search
var table_data = [];
var autocomplete_table = Titanium.UI.createTableView({
	search : $.parkSrch.value,
	top : 0,
	height: Ti.UI.FILL
});
win.add(autocomplete_table);

//Auto-complete search
function auto_complete(search_term) {
	if (search_term.length >= 1) {
		//clear the table view results
		autocomplete_table.setData([]);
		autocomplete_table.setData(table_data);

		//open database
		try {
			var db = Ti.Database.open('ltemaDB');
			
			//Query - Retrieve matching park names from database
			rows = db.execute('SELECT park_name ' + 'FROM park ' + 'WHERE park_name LIKE ?', search_term + '%');
			
			//Ti.API.info(rows.getRowCount());
			
			//check if any results are returned
			if (rows.getRowCount() <= 0) {
				//TODO: determine if the user can create a new park name, and how to implement
				//for now, the next line is commented out, close() allows the user to enter an invalid park name
				//win.close();
			} else {
				win.open();
	
				while (rows.isValidRow()) {
					var parkName = rows.fieldByName('park_name');
	
					//create a new row
					var newRow = Ti.UI.createTableViewRow({
						title : parkName
					});
	
					//Add row to the table view
					autocomplete_table.appendRow(newRow);
					rows.next();
				}
			}
		} catch (e) {
			var errorMessage = e.message;
			Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
		} finally {
			rows.close();
			db.close();
		}
	}
}

//Event Listener - when user types in the search bar
$.parkSrch.addEventListener('change', function(e) {
	if (e.source.value.length >= 1 ) { //&& e.source.value != last_search
		win.open();
		clearTimeout(timers['autocomplete']);
		timers['autocomplete'] = setTimeout(function() {
			//last_search = e.source.value;
			auto_complete(e.source.value);
		}, 300);
	} else {
		//if user deletes input
		//clear the table view results
		autocomplete_table.setData([]);
		autocomplete_table.setData(table_data);
		win.close();
	}
	return false;
});

//Event Listener - search results selected by user
autocomplete_table.addEventListener('click', function(e) {
	//add selected park name to the search bar value
	$.parkSrch.value = e.source.title;
	$.parkSrchError.visible = false;
	win.close();
	$.parkSrch.blur();
});
