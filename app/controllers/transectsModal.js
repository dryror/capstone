var args = arguments[0];

$.transectName.text = args.transectName;
$.surveyor.text = args.surveyor;

function editBtnClick(){
	alert("You clicked the edit button");
}
function backBtnClick(){
	$.modalWin.close();
}