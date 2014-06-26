/*
 * Plot observations creation screen with validation
 * 
 * expected args: plotID
 */

var args = arguments[0];
var plotID = args.plotID;

// Get the siteID
var siteID;
try{
	var db = Ti.Database.open('ltemaDB');
	
	var rows = db.execute('SELECT tct.site_id FROM transect tct, plot plt \
							WHERE tct.transect_id = plt.transect_id \
							AND plt.plot_id = ?', plotID);
	
	siteID = rows.fieldByName('site_id');
} catch(e) {
	var errorMessage = e.message;
	Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
} finally {
	rows.close();
	db.close();
}

// Set Common Other label and flag
$.observationOtherQuickPick.labels = [{title:"Bare Soil"}, {title:"Rock"}, {title:"Litter"}, {title:"Biocrust"}, {title:"Scat"}, {title:"(other)"}];
var observationOtherFlag = false;

// Nav Bar Title
var labelText = 'New Plot Observation';
var titleLabel = Titanium.UI.createLabel({
	text: labelText,
	font:{fontSize:20,fontWeight:'bold'},
});
$.addPlotObservationWin.setTitleControl(titleLabel);

// User instructions
var instructions = 
	"Please select the observation type. If this is a plant observation, you can search for the Phylum, Class, Order, Family, English Name, or Scientific Name.\n\n" + 
	"Allowed Coverage percentages: 0.1%, 0.2%, 0.5%, or any integer between 0 and 100.\n\n" +
	"A reference photo may be taken, but is not required. If an observation requires further identification, and has not been previously photographed in this transect, this photo will help to later identify an unknown species. Please add any info to the comments section that may be useful in later identification.\n\n\n";
$.info.text = instructions;

// Initialize Variables
var photo = null;

function doneBtn(e){
	//disable button to prevent double entry
	e.source.enabled = false;
	
	// Close the search window
	win.close();
	
	// Check for errors on page
	var errorOnPage = false;
	
	// Check for errors
	if ($.pickType.index == null) {
		$.pickTypeError.visible = true;
		errorOnPage = true;
		if (($.observationSearch.value == "") || ($.observationSearch.value == null) && ($.observation.value == "") || ($.observation.value == null)){
			$.observationError.visible = true;
			errorOnPage = true;
		}
	}
	
	if ($.pickType.index == 0) {
		if (($.observationSearch.value == "") || ($.observationSearch.value == null) || ($.observationSearch.getValue().trim().length <= 0)){
			$.observationError.visible = true;
			errorOnPage = true;
		}
	}
	
	if ($.pickType.index == 1) {
		if (($.observation.value == "") || ($.observation.value == null) || ($.observation.getValue().trim().length <= 0)){
			$.observationError.visible = true;
			errorOnPage = true;
		}
	}
	
	if ($.percent.value == "") {
		$.percentError.visible = true;
		errorOnPage = true;
	}
	
	if ($.percentError.visible) {
		errorOnPage = true;
	}
	
	if (errorOnPage) {
		e.source.enabled = true;
		$.observationSearch.blur();
		$.observation.blur();
		$.percent.blur();
		$.comments.blur();
		return;
	}
	
	// Check observation type and set count and observation
	var count;
	var observation;
	var percentCoverage = $.percent.value;
	var comments;
	var speciesCode;
	
	if ($.pickType.index == 0) {
		// Plant is selected
		count = 1;
		comments = $.comments.value;
		observation = $.observationSearch.value;
		// Check if observation is a scientific name or english
		try {
			var db = Ti.Database.open('taxonomy');
			var rsScientific = db.execute('SELECT s.species_code, g.genus_name || " " || s.species_name AS scientific_name \
								FROM species s, genus g \
								WHERE s.genus_id = g.genus_id \
								AND UPPER(scientific_name) = UPPER(?) \
								LIMIT 1', observation);
			
			var rsEnglish = db.execute('SELECT species_code, english_name \
										FROM species \
										WHERE UPPER(english_name) = UPPER(?) \
										LIMIT 1', observation);
						
			if (rsScientific.isValidRow()) {
				scientificName = rsScientific.fieldByName('scientific_name');
				
				if (scientificName != null) {
					speciesCode = rsScientific.fieldByName('species_code');
				}
				rsScientific.close();
			} else if (rsEnglish.isValidRow()) {
				englishName = rsEnglish.fieldByName('english_name');
				if (englishName != null) {
					speciesCode = rsEnglish.fieldByName('species_code');
				}
				rsEnglish.close();
			} else {
				speciesCode = $.observationSearch.value;
			}
			
		} catch(e) {
			var errorMessage = e.message;
			Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
		} finally {
			db.close();
		}
	} else {
		// Other is selected
		observation = $.observation.value;
		count = 0;
		speciesCode = null;
		comments = $.observation.value;
		if ($.comments.value != "") {
			comments += " - Comment: " + $.comments.value;
		}
	}
	
	// Name and save photo if taken
	var mediaID = null;
	if (photo != null) {
		
		var photoName = savePhoto(photo);
	
		try{
			//Connect to database
			var db = Ti.Database.open('ltemaDB');
			
			//add photo name to media table
			db.execute( 'INSERT INTO media (media_name) VALUES (?)', photoName);
			
			//get the id of the last row inserted into the database - *not sure if this is acceptable sql code to use?
			var results = db.execute('SELECT last_insert_rowid() as mediaID');
			mediaID = results.fieldByName('mediaID');			
		}catch(e){
			var errorMessage = e.message;
			Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
		}finally{	
			//close the result set
			results.close();	
			//Close the database
			db.close();
		}
	}
	
	// Insert Query - add row to plot observation table
	try{
		//Connect to database
		var db = Ti.Database.open('ltemaDB');
		
		db.execute('INSERT INTO plot_observation (observation, ground_cover, count, comments, plot_id, media_id, species_code) \
				VALUES (?,?,?,?,?,?,?)', observation, percentCoverage, count, comments, plotID, mediaID, speciesCode);
					
	}catch(e){
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	}finally{	
		//Close the database
		db.close();
		//refresh and close
		Ti.App.fireEvent("app:refreshPlotObservations");
		$.addPlotObservationWin.close();
	}
}

function takePhoto(){
	//call camera module and set thumbnail
	var pic = require('camera');
	pic.getPhoto(function(myPhoto, UTMEasting, UTMNorthing, n_UTMZone) {
		//Set thumbnail
		$.photoHint.visible = false;
		$.plotThumbnail.visible = true;
		$.plotThumbnail.image = myPhoto;
		$.thumbnailHintText.visible = true;
		
		//Save Photo for preview (temporary photo)
		var temp = Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
		temp.write(myPhoto);
		
		//set variables with values
		photo = myPhoto;
		utmEasting = UTMEasting;
		utmNorthing = UTMNorthing;
		utmZone = n_UTMZone;
	});
}

//Name and save photo to filesystem - do this when done btn is pressed
function savePhoto(photo){
	try {
		//Connect to database
		var db = Ti.Database.open('ltemaDB');
			
		//Query - Retrieve site survery, year, park
		var rows = db.execute('SELECT year, protocol_name, park_name \
							FROM site_survey s, protocol p, park prk \
							WHERE s.protocol_id = p.protocol_id \
							AND s.park_id = prk.park_id \
							AND site_id = ?', siteID);
							
		//Name the directory	
		var year = rows.fieldByName('year');
		var protocolName = rows.fieldByName('protocol_name');
		var parkName = rows.fieldByName('park_name');
		var dir = year + ' - ' + protocolName + ' - ' + parkName;
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
	} finally {
		rows.close();
		db.close();
	}
	
	//get the photo
	var img = photo; 
	
	//name the photo  (timestamp - utc in ms)
	var timestamp = new Date().getTime();
	var filename = "O" + timestamp;
	
	try {
		// Create image Directory for site
		var imageDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, dir);
		if (! imageDir.exists()) {
	    	imageDir.createDirectory();
		}
		
		// .resolve() provides the resolved native path for the directory.
		var imageFile  = Ti.Filesystem.getFile(imageDir.resolve(), filename + '.png');
		imageFile.write(img);
		
		var path = filename + '.png';
	} catch(e) {
		var errorMessage = e.message;
		Ti.App.fireEvent("app:fileSystemError", {error: errorMessage});
	} finally {
		imageDir = null;
		imageFile = null;
		return path;
	}	
}

//THUMBNAIL BUTTON - preview photo
function previewPhoto(){
	var modal = Alloy.createController("photoPreviewModal", {}).getView();
		modal.open({
			modal : true,
			modalTransitionStyle : Ti.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
			modalStyle : Ti.UI.iPhone.MODAL_PRESENTATION_PAGESHEET,
			navBarHidden : false
	});
}

// Event listeners

$.pickType.addEventListener('click', function(e) {
	$.pickTypeError.visible = false;
	if ( (observationOtherFlag === false) && ($.pickType.index === 0) ) {  //plant
		$.observation.visible = false;
		$.observation.value = "";
		$.observationOtherQuickPickLbl.visible = false;
		$.observationOtherQuickPick.index = -1;
		$.observationLbl.visible = true;
		$.observationSearch.visible = true;
		$.percentLbl.text = "Foliar Coverage:";
	}
	if ( (observationOtherFlag === true) && ($.pickType.index === 0) ) {  //plant
		$.observationLbl.visible = false;
		$.observation.visible = false;
		$.observation.value = "";
		$.observationOtherQuickPickLbl.visible = false;
		$.observationOtherQuickPick.visible = false;
		$.observationOtherQuickPick.index = -1;
		$.observationLbl.top -= 60;
		$.observation.top -= 60;
		$.observationError.top -= 60;
		$.percentLbl.top -= 60;
		$.percent.top -= 60;
		$.percentError.top -= 60;
		$.commentLbl.top -= 60;
		$.comments.top -= 60;
		$.photoBtn.top -= 60;
		$.photoHint.top -= 60;
		$.plotThumbnail.top -= 60;
		$.thumbnailHintText.top -= 60;
		$.footerLine.top -= 60;
		$.info.top -= 60;
		$.observationLbl.visible = true;
		$.observationSearch.visible = true;
		observationOtherFlag = false;
	}
	if ($.pickType.index === 1) {  //other
		$.observationLbl.visible = false;
		$.observationSearch.visible = false;
		$.observationSearch.value = "";
		$.observationOtherQuickPickLbl.visible = true;
		$.observationOtherQuickPick.visible = true;
		//$.observation.visible = true;
		$.percentLbl.text = "Coverage:";
	}
});

$.observationOtherQuickPick.addEventListener('click', function(e) {
	$.observationError.visible = false;
	if (e.index === 5) {  //other other selected
		$.observation.value = "";
		$.observationLbl.top += 60;
		$.observation.top += 60;
		$.observationError.top += 60;
		$.percentLbl.top += 60;
		$.percent.top += 60;
		$.percentError.top += 60;
		$.commentLbl.top += 60;
		$.comments.top += 60;
		$.photoBtn.top += 60;
		$.photoHint.top += 60;
		$.plotThumbnail.top += 60;
		$.thumbnailHintText.top += 60;
		$.footerLine.top += 60;
		$.info.top += 60;
		$.observationLbl.visible = true;
		$.observation.visible = true;
		observationOtherFlag = true;
	} else {  //common other selected
		var quickPick = e.source.labels[e.index].title;
		$.observation.value = quickPick;
		
		if (observationOtherFlag === true) {
			$.observationLbl.visible = false;
			$.observation.visible = false;
			$.observationLbl.top -= 60;
			$.observation.top -= 60;
			$.observationError.top -= 60;
			$.percentLbl.top -= 60;
			$.percent.top -= 60;
			$.percentError.top -= 60;
			$.commentLbl.top -= 60;
			$.comments.top -= 60;
			$.photoBtn.top -= 60;
			$.photoHint.top -= 60;
			$.plotThumbnail.top -= 60;
			$.thumbnailHintText.top -= 60;
			$.footerLine.top -= 60;
			$.info.top -= 60;
			observationOtherFlag = false;
		}
	}
});

$.observationSearch.addEventListener('change', function(e) {
	if ($.observationSearch.value == ""){
		$.observationError.visible = true;
	} else {
		$.observationError.visible = false;
	}
});

$.observation.addEventListener('change', function(e) {
	if ($.observation.value == "") {
		$.observationError.visible = true;
	} else {
		$.observationError.visible = false;
	}
});

$.percent.addEventListener('change', function(e) {
	var theField = $.percent.value;
	var match = /^((0{0,2}\.[1,2,5]0?)|(0?\d{1,2})|(0?100))$/;
	
	if ($.percent.value == "") {
		$.percentError.visible = true;
		$.percentError.text = "* Please enter percent coverage";
		return;
	} else if (!theField.match(match)) {
		$.percentError.text = "* Not a valid ground cover percentage";
		$.percentError.visible = true;
	} else {
		$.percentError.visible = false;
	}
});

// related to issue #28
$.addPlotObservationWin.addEventListener('close', function(e) {
	Ti.App.fireEvent("app:refreshPlotObservations");
});

// Closes the popup result window if user click outside of the table
$.formView.addEventListener('click', function(e) {
	if (e.source != win) {
		win.close();
	}			
});
// Closes the popup result window if user navigates away from this screen 
$.observationSearch.addEventListener('blur', function(e) {
	win.close();
});

// SEARCH BAR ACTIONS

//var last_search = null;
var timers = [];

//create the popup window to show search results
var win = Ti.UI.createWindow({
	borderColor : "#C0C0C0",
	scrollable : true,
	height: 318,
	left : 220,
	right : 40,
	top : 198,
	borderRadius : 0,
	borderWidth: 3,
	title : 'park names',
	//orientationModes : [Ti.UI.PORTRAIT, Ti.UI.UPSIDE_PORTRAIT]
});


//AUTOCOMPLETE TABLE - list of results from search
var table_data = [];
var autocomplete_table = Titanium.UI.createTableView({
	search : $.observationSearch.value,
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
			var totalRowCount = 0;
			var db = Ti.Database.open('taxonomy');
			
			//Retrieve matching taxonomy information from database the database
			var rsPhylum = db.execute('SELECT phylum_name FROM phylum WHERE UPPER(phylum_name) LIKE UPPER(?)', search_term + '%');
			totalRowCount += rsPhylum.getRowCount();
			
			var rsOrder = db.execute('SELECT order_name FROM "order" WHERE UPPER(order_name) LIKE UPPER(?)', search_term + '%');
			totalRowCount += rsOrder.getRowCount();
			
			var rsFamily = db.execute('SELECT family_name FROM family WHERE UPPER(family_name) LIKE UPPER(?)', search_term + '%');
			totalRowCount += rsFamily.getRowCount();
			
			var rsGenus = db.execute('SELECT genus_name FROM genus WHERE UPPER(genus_name) LIKE UPPER(?)', search_term + '%');
			totalRowCount += rsGenus.getRowCount();
			
			var rsEnglish = db.execute('SELECT DISTINCT english_name ' + 'FROM species ' + 'WHERE UPPER(english_name) LIKE UPPER(?)', search_term + '%');
			totalRowCount += rsEnglish.getRowCount();
			
			var rsScientific = db.execute('SELECT s.species_code, g.genus_name || " " || s.species_name AS scientific_name \
								FROM species s, genus g \
								WHERE s.genus_id = g.genus_id \
								AND UPPER(scientific_name) LIKE UPPER(?)', search_term + '%');
			totalRowCount += rsScientific.getRowCount();
			
			//check if any results are returned
			if (totalRowCount <= 0) {
				win.close();
			} else {
				win.open();
				
				// Add phylum name to results
				if (rsPhylum.getRowCount() > 0) {
					var pnSection = Ti.UI.createTableViewSection({
						headerTitle: "Phylum Name"
					});
					
					autocomplete_table.appendSection(pnSection);
					
					while (rsPhylum.isValidRow()) {
						var phylumName = rsPhylum.fieldByName('phylum_name');
		
						//create a new row
						var pnRow = Ti.UI.createTableViewRow({
							title : phylumName,
							indentionLevel: 1
						});
		
						//Add row to the table view
						autocomplete_table.appendRow(pnRow);
						rsPhylum.next();
					}
					rsPhylum.close();
				}
				
				// Add order name to results
				if (rsOrder.getRowCount() > 0) {
					var onSection = Ti.UI.createTableViewSection({
						headerTitle: "Order Name"
					});
					
					autocomplete_table.appendSection(onSection);
					
					while (rsOrder.isValidRow()) {
						var orderName = rsOrder.fieldByName('order_name');
		
						//create a new row
						var onRow = Ti.UI.createTableViewRow({
							title : orderName, 
							indentionLevel: 1
						});
		
						//Add row to the table view
						autocomplete_table.appendRow(onRow);
						rsOrder.next();
					}
					rsOrder.close();
				}
				
				// Add family name to results
				if (rsFamily.getRowCount() > 0) {
					var fnSection = Ti.UI.createTableViewSection({
						headerTitle: "Family Name"
					});
					
					autocomplete_table.appendSection(fnSection);
					
					while (rsFamily.isValidRow()) {
						var familyName = rsFamily.fieldByName('family_name');
		
						//create a new row
						var fnRow = Ti.UI.createTableViewRow({
							title : familyName,
							indentionLevel: 1
						});
		
						//Add row to the table view
						autocomplete_table.appendRow(fnRow);
						rsFamily.next();
					}
					rsFamily.close();
				}
				
				// Add genus name to results
				if (rsGenus.getRowCount() > 0) {
					var gnSection = Ti.UI.createTableViewSection({
						headerTitle: "Genus Name"
					});
					
					autocomplete_table.appendSection(gnSection);
					
					while (rsGenus.isValidRow()) {
						var genusName = rsGenus.fieldByName('genus_name');
		
						//create a new row
						var gnRow = Ti.UI.createTableViewRow({
							title : genusName,
							indentionLevel: 1
						});
		
						//Add row to the table view
						autocomplete_table.appendRow(gnRow);
						rsGenus.next();
					}
					rsGenus.close();
				}
				
				// Add english name to results
				if (rsEnglish.getRowCount() > 0) {
					var enSection = Ti.UI.createTableViewSection({
						headerTitle: "English Name"
					});
					
					autocomplete_table.appendSection(enSection);
					
					while (rsEnglish.isValidRow()) {
						var englishName = rsEnglish.fieldByName('english_name');
		
						//create a new row
						var enRow = Ti.UI.createTableViewRow({
							title : englishName,
							indentionLevel: 1
						});
		
						//Add row to the table view
						autocomplete_table.appendRow(enRow);
						rsEnglish.next();
					}
					rsEnglish.close();
				}
				
				// Add scientific name to results
				if (rsScientific.getRowCount() > 0) {
					var snSection = Ti.UI.createTableViewSection({
						headerTitle: "Scientific Name"
					});
					
					autocomplete_table.appendSection(snSection);
					
					while (rsScientific.isValidRow()) {
						var scientificName = rsScientific.fieldByName('scientific_name');
		
						//create a new row
						var snRow = Ti.UI.createTableViewRow({
							title : scientificName,
							indentionLevel: 1
						});
		
						//Add row to the table view
						autocomplete_table.appendRow(snRow);
						rsScientific.next();
					}
					rsScientific.close();
				}
			}
		} catch (e) {
			var errorMessage = e.message;
			Ti.App.fireEvent("app:dataBaseError", {error: errorMessage});
		} finally {	
			db.close();
		}
	}
}

//Event Listener - when user types in the search bar
$.observationSearch.addEventListener('change', function(e) {
	var match = /^[A-Za-z]/;  //santatize search input by reqauiring a letter
	if ((e.source.value.length < 2) || (!e.source.value.match(match))) {
		//clear the table view results
		autocomplete_table.setData([]);
		autocomplete_table.setData(table_data);
		win.close();
	} else {
		clearTimeout(timers['autocomplete']);
		timers['autocomplete'] = setTimeout(function() {
			auto_complete(e.source.value);
		}, 500);
		
	}
});

//Event Listener - search results selected by user
autocomplete_table.addEventListener('click', function(e) {
	//add selected park name to the search bar value
	$.observationSearch.value = e.source.title;
	$.observationError.visible = false;
	win.close();
	$.observationSearch.blur();
});

// Fire when addTransect Window is closed
$.addPlotObservationWin.addEventListener('close', function(e) {
	//remove the temp photo - used for photo preview
	var tempPhoto = Ti.Filesystem.getFile(Titanium.Filesystem.tempDirectory,'temp.png');
	if(tempPhoto.exists){
		tempPhoto.deleteFile();
	}
});

// scroll view to fit search window on screen
win.addEventListener('open', function(e) {
	if ( (win.orientation === 4) || (win.orientation === 3) ) {  //LANDSCAPE_LEFT and LANDSCAPE_RIGHT
		$.formView.scrollTo(0,95);
		win.top = 98;
	} else {
		$.formView.scrollTo(0,0);
		win.top = 198;  //reset in case user rotates the device between result window opens
	}
});
// reset view on close
win.addEventListener('close', function(e) {
	$.formView.scrollTo(0,0);
});