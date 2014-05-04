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
});

describe('\n \nThe modal with siteID 1', function () {
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
		it('should bet selectable', function() {
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