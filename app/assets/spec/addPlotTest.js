//Setup module to run Behave tests
require('behave').andSetup(this);
var Alloy = require("alloy");

describe('\n\nThe addPlot screen of transectID 1', function() {
	var $ = Alloy.createController('addPlot', {transectID:1});
	it('should exist when created ', function() {
		expect($).notToBe(undefined);
	});
	
	it('should have all empty input field', function() {
		expect($.pickStake.index).toBe(undefined);
		expect($.stakeDeviation.value).toBe("");
		expect($.pickDistance.index).toBe(undefined);
		expect($.distanceDeviation.value).toBe("");
		expect($.comments.value).toBe("");
	});
	
	describe('\naddPlot form input', function() {
		it('should set stake orientation', function() {
			$.pickStake.setIndex(1);
			expect($.pickStake.index).toBe(1);
			$.pickStake.setIndex(0);
			expect($.pickStake.index).toBe(0);
		});
		it('should set stake deviation', function() {
			$.stakeDeviation.setValue("Top and Bottom");
			expect($.stakeDeviation.value).toBe("Top and Bottom");
			$.stakeDeviation.setValue("Right and Left");
			expect($.stakeDeviation.value).toBe("Right and Left");
		});
		it('should set plot distance', function() {
			$.pickDistance.setIndex(0);
			expect($.pickDistance.index).toBe(0);
			$.pickDistance.setIndex(1);
			expect($.pickDistance.index).toBe(1);
		});
		it('should set plot deviation', function() {
			$.distanceDeviation.setValue("15");
			expect($.distanceDeviation.value).toBe("15");
			$.distanceDeviation.setValue("4");
			expect($.distanceDeviation.value).toBe("4");
		});
		
		it('should show/hide stake deviation field based on selected tab', function() {
			// Should show deviation filed if Other is selected
			$.pickStake.setIndex(1);
			$.pickStake.fireEvent('click', {source:$.pickStake, index: 1});
			// Wait for event to fire
			setTimeout(function(){ 
				expect($.stakeDeviation.visible).toBe(true);
				$.stakeDeviation.value = "Testing";
				expect($.stakeDeviation.value).toBe("Testing");
				
				// Should hide and clear deviation field if default is selected
				$.pickStake.setIndex(0);
				$.pickStake.fireEvent('click', {source:$.pickStake, index: 0});
				// Wait for event to fire
				setTimeout(function(){ 
					expect($.stakeDeviation.visible).toBe(false);
					expect($.stakeDeviation.value).toBe("");
				}, 50);
			}, 50);
		});
		
		it('should show/hide distance deviation field based on selected tab', function() {
			// Should show deviation filed if Other is selected
			$.pickDistance.setIndex(1);
			$.pickDistance.fireEvent('click', {source:$.pickDistance, index: 1});
			// Wait for event to fire
			setTimeout(function(){ 
				expect($.distanceDeviation.visible).toBe(true);
				$.distanceDeviation.value = "5";
				expect($.distanceDeviation.value).toBe("5");
				
				// Should hide and clear deviation field if default is selected
				$.pickDistance.setIndex(0);
				$.pickDistance.fireEvent('click', {source:$.pickDistance, index: 0});
				// Wait for event to fire
				setTimeout(function(){ 
					expect($.distanceDeviation.visible).toBe(false);
					expect($.distanceDeviation.value).toBe("");
				}, 50);
			}, 50);
		});
		
		// Check the business rules on the plot deviation field
		it('should only allow Plot distances to be between 2 and 30', function() {
			$.distanceDeviation.value = "1";
			Ti.App.fireEvent("distanceDeviationChange", {source:$.distanceDeviation});
			// Wait for event to fire
			setTimeout(function() {
				expect($.distanceOtherError.visible).toBe(true);
				$.distanceDeviation.value = "31";
				Ti.App.fireEvent("distanceDeviationChange", {source:$.distanceDeviation});
				// Wait for event to fire
				setTimeout(function() {
					expect($.distanceOtherError.visible).toBe(true);
					$.distanceDeviation.value = "25";
					Ti.App.fireEvent("distanceDeviationChange", {source:$.distanceDeviation});
					// Wait for event to fire
					setTimeout(function() {
						expect($.distanceOtherError.visible).toBe(false);
					}, 50);
				}, 50);
			}, 50);
		});		
	});
});

