/* Site survey creation screen with validation */

// Tabbed Bar Labels
var pickBiomeLabels = [
	{title:"Grasslands", enabled:true},
	{title:"Alpine", enabled:true},
	{title:"Forest", enabled:true},
	{title:"Wetlands", enabled:true},
	{title:"Intertidal", enabled:true}
	];
var pickProtocolLabels = [
	{title:"Grasslands", enabled:false},
	{title:"Alpine", enabled:false},
	{title:"Squirrels", enabled:false},
	{title:"Berries", enabled:false},
	{title:"Amphibians", enabled:false},	
	];

$.pickBiome.labels = pickBiomeLabels;
$.pickProtocol.labels = pickProtocolLabels;

// remake protocol picker based on biome selected
$.pickBiome.addEventListener('click', function(e) {
	$.pickProtocol.index = -1;
	pickProtocolLabels[0].enabled = false;
	pickProtocolLabels[1].enabled = false;
	pickProtocolLabels[2].enabled = false;
	pickProtocolLabels[3].enabled = false;
	pickProtocolLabels[4].enabled = false;
	
	if (e.index == 0) {
		pickProtocolLabels[0].enabled = true;
		$.pickProtocol.labels = pickProtocolLabels;
	}
	if (e.index == 1) {
		pickProtocolLabels[1].enabled = true;
		$.pickProtocol.labels = pickProtocolLabels;
	}
	if (e.index == 2) {
		pickProtocolLabels[2].enabled = true; //squirrels
		pickProtocolLabels[3].enabled = true; //berries
		$.pickProtocol.labels = pickProtocolLabels;
	}
	if (e.index == 3) {
		pickProtocolLabels[4].enabled = true;
		$.pickProtocol.labels = pickProtocolLabels;
	}
	if (e.index == 4) {
		pickProtocolLabels[4].enabled = true;
		$.pickProtocol.labels = pickProtocolLabels;
	}
});

//Test for form completeness before adding to database
function doneBtn(){	
	if ($.parkSrch.value == null) {
		alert('No park name entered');
		return;
	}else if ($.pickBiome.index == null) {
		alert('No biome picked');
		return;
	}else if ($.pickProtocol.index == null) {
		alert('No protocol picked');
		return;
	} else {
		alert('Biome index ' + $.pickBiome.index + ' picked, and \n' +
			 'protocol index ' + $.pickProtocol.index +' picked.');
	}
}

function biomeBtn(){
	//Code to figure out how pickers are going to work
	$.formView.opacity = .2;
	$.biomePkrView.visible = true;
	$.protocolPkrView.visible = false;
}

function protocolBtn(){
	//Code to figure out how pickers are going to work
	$.formView.opacity = 0.2;
	$.protocolPkrView.visible = true;
	$.biomePkrView.visible = false;
}

function doneBiomePkrBtn(){
	$.pickBiome.text = $.biomePkr.getSelectedRow(0).title;
	$.formView.opacity = 1.0;
	$.biomePkrView.visible = false;
}

function doneProtocolPkrBtn(){
	$.pickProtocol.text = $.protocolPkr.getSelectedRow(0).title;
	$.formView.opacity = 1;
	$.protocolPkrView.visible = false;
}



// SEARCH BAR ACTIONS

//var last_search = null;
var timers = 0;

//create the popup window to show search results
var win = Ti.UI.createWindow({
	borderColor : "#C0C0C0",
	scrollable : true,
	//height: Ti.UI.SIZE,
	height: 250,
	left : 200,
	right : 40,
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
		var db = Ti.Database.open('ltemaDB');
		
		//Query - Retrieve matching park names from database
		rows = db.execute('SELECT park_name ' + 'FROM park ' + 'WHERE park_name LIKE ?', search_term + '%');
		
		Ti.API.info(rows.getRowCount());
		
		//check if any results are returned
		if (rows.getRowCount() <= 0) {
			win.close();
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
	win.close();
});

//Closes the popup result window if user navigates away from this screen
$.addSiteSurvey.addEventListener('close', function(e){
	win.close();
});