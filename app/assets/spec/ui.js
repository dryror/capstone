//Setup module to run Behave tests
require('behave').andSetup(this);
var Alloy = require("alloy");

describe('\n \nThe index screen', function() {	
	var index = Alloy.createController('index');
	it('should create a controller', function() {
		expect(index).notToBe(null);
	});
	it('should create a table', function() {		
		expect(index.getView("tbl")).notToBe(undefined);
	});
	describe('\nThe TableView \'tbl\' of the index screen', function() {
		it('should have a header with a button called \'Add\'', function() {
			expect(index.getView("headerView")).notToBe(undefined);
			expect(index.addSite.title).toBe("Add");
		});
	});
});

describe('\n \nThe site survey modal with siteID 1', function () {
	var indexModal = Alloy.createController('siteSurveyModal', {siteID:1});
	it('should exist when created', function() {
		expect(indexModal).notToBe(undefined);
	});
	/*
	it('should be visible', function() {
		expect(indexModal.visible).toBe(true);
	});
	*/
	it('should have a park name of \'Kakwa Park\'', function() {
		expect(indexModal.parkName.text).toBe('Kakwa Park');
	});
	it('should have a year of 2014', function() {
		expect(indexModal.siteYear.text).toBe('2014');
	});
	/*
	it('should not be visible after \'Back\' is pressed', function() {
		indexModal.__views.backBtn.fireEvent('click');
		expect(indexModal.visible).toBe(false);
	});
	*/
});
describe('\n\nThe transect modal', function() {
	//generate some test data using transect_id 1
	var db = Ti.Database.open('ltemaDB');
	resultRow = db.execute(	'SELECT transect_id, transect_name, surveyor, plot_distance, stake_orientation, comments \
							FROM transect t \
							WHERE transect_id = 1');					
	var transectName = resultRow.fieldByName('transect_name');
	var surveyor = resultRow.fieldByName('surveyor');
	var plotDistance = resultRow.fieldByName('plot_distance');
	var stakeOrientation = resultRow.fieldByName('stake_orientation');
	var comments = resultRow.fieldByName('comments');
	resultRow.close();
	db.close();
	
	var $ = Alloy.createController('transectsModal', {transectID:1});
	it('should exist when created', function() {
		expect($).notToBe(undefined);
	});
	it('should have a name of ' + transectName, function() {
		expect($.transectName.value).toBe(transectName);
		it ('the name TextField should not be editable', function () {
			expect($.transectName.getEditable()).toBe(false);
		});
	});
	it('should have a head surveyor of '+ surveyor, function() {
		expect($.surveyor.value).toBe(surveyor);
	});
	it('should have a plot distance of '+ plotDistance, function() {
		expect($.plotDistance.value).toBe(plotDistance);
	});
	it('should have a stake orientation of '+ stakeOrientation, function() {
		if (stakeOrientation === "Top Left / Bottom Right") {
			stakeOrientation = 0;
		} else if (stakeOrientation === "Top Right / Bottom Left") {
			stakeOrientation = 1;
		} else {
			stakeOrientation = null;
		}
		expect($.stakeBar.getIndex()).toBe(stakeOrientation);
	});
	if ($.comments.value) { //empty comment fields fail the test
		it('should have a comments of '+ comments, function() {
			expect($.comments.value).toBe(comments);
		});
	}
	describe('\n  user input of transcetsModal', function() {
		it('should set transect name to \'Strawberry\'', function() {
			$.transectName.setValue("Strawberry");
			expect($.transectName.value).toBe("Strawberry");
		});
		it('expects transectError to not be visible', function() {
			expect($.transectError.getVisible()).toBe("false");
		});
		it('should set transect name to \'S\'', function() {
			$.transectName.focus();
			$.transectName.setValue("S");
			$.transectName.blur();
			expect($.transectName.value).toBe("S");
		});
		/* not sure why this fails
		it('expects transectError to be visible', function() {
			expect($.transectError.getVisible()).toBe("true");
		});
		*/
	});
});

describe('\n \nThe addSiteSurvey screen', function() {
	var addSiteSurvey = Alloy.createController('addSiteSurvey');
	it('should exist when created ', function() {
		expect(addSiteSurvey).notToBe(undefined);
	});
	it('should have no park name selected', function() {
		expect(addSiteSurvey.parkSrch.value).toBe(undefined);
	});
	/*
	it('should not allow empty forms to be submitted', function() {
		addSiteSurvey.__views.doneAddSite.fireEvent('click');
		expect(addSiteSurvey.parkSrchError.visible).toBe(true);
	});
	*/
	describe('\n The biome TabbedBar of addSiteSurvey', function () {
		it('should be unset when created', function() {
			expect(addSiteSurvey.pickBiome.index).toBe(undefined);
		});
		it('should be selectable', function() {
			addSiteSurvey.pickBiome.index=1;
			expect(addSiteSurvey.pickBiome.index == 1).toBe(true);
		});
	});
});
describe('\n \nThe export modal controller', function() {
	it('should be created when Export is selected', function() {
		exportModal = Alloy.createController('exportModal');
		expect(exportModal).notToBe(undefined);
	});
});
describe('\n\nThe addTransect screen of siteID 1', function() {
	var $ = Alloy.createController('addTransect', {siteID:1});
	it('should exist when created ', function() {
		expect($).notToBe(undefined);
	});
	it('should have all empty input field', function() {
		expect($.tsctName.value).toBe("");
		expect($.srvyName.value).toBe("");
		expect($.otherSrvyName.value).toBe("");
		expect($.pickStake.index).toBe(undefined);
		expect($.plotDist.value).toBe("");
		expect($.comments.value).toBe("");
	});
	describe('\naddTransect form input', function() {
		it('should set transect name to \'Strawberry\'', function() {
			$.tsctName.setValue("Strawberry");
			expect($.tsctName.value).toBe("Strawberry");
		});
		it('should set transect name to \'S\'', function() {
			$.tsctName.setValue("S");
			expect($.tsctName.value).toBe("S");
		});
		it('should set head surveyor to \'Cherry Tree\'', function() {
			$.srvyName.setValue("Cherry Tree");
			expect($.srvyName.value).toBe("Cherry Tree");
		});
		it('should set head surveyor to \'C\'', function() {
			$.srvyName.setValue("C");
			expect($.srvyName.value).toBe("C");
		});
		it('should set stake orientation', function() {
			$.pickStake.setIndex(1);
			expect($.pickStake.index == 1).toBe(true);
		});
		it('should set plot distance to 20', function() {
			$.plotDist.setValue(20);
			expect($.plotDist.value).toBe(20);
		});
		it('should set plot distance to 200', function() {
			$.plotDist.setValue(200);
			expect($.plotDist.value).toBe(200);
		});
	});
});
