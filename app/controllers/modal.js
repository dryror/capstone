var args = arguments[0];

$.parkName.text = args.parkName;

function editBtnClick(){
	alert("You clicked the edit button");
}
function backBtnClick(){
	$.modalWin.close();
}