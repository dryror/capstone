//Place holder for edit button
function editBtn(){
	alert('You Clicked the Edit Button');
}

//Place holder for add button
function addBtn(){
	//Navigation to addPlotObservatino
	var addObservation = Alloy.createController("addPlotObservation").getView();
	$.navGroupWin.openWindow(addObservation);
}

