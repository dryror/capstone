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
			$.distanceDeviation.setValue(15);
			expect($.distanceDeviation.value).toBe(15);
			$.distanceDeviation.setValue(4);
			expect($.distanceDeviation.value).toBe(4);
		});
	});
});

