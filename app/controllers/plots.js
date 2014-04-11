//Place holder for edit button
function editBtn(){
	alert('You Clicked the Edit Button');
}

//Place holder for add button
function addBtn(){
	//Navigation to addPlot
	var addPlot = Alloy.createController("addPlot").getView();
	$.navGroupWin.openWindow(addPlot);
}

//Needed to add this to get to the next screen for testing
//Will be replaced once controller implemented
$.row1.addEventListener('click', function(event){
    var observations = Alloy.createController("plotObservations").getView();
    $.navGroupWin.openWindow(observations);
}); 
