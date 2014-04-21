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
