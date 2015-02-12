var endtime = null;
var stepper = null;
var defaulttime = (2 * 60 + 30) * 1000;

function displayTime(d, func) {
	var min = 0, sec = 0, ms = 0;

	if (d > 0) {
		var dd = d;
		
		ms = Math.floor(d % 1000 / 10);
		d = Math.floor(d / 1000);
		sec = d % 60;
		d = Math.floor(d / 60);
		min = d;

		d = dd;
	}
	else {
		endtime = null;
		clearInterval(stepper);
		stepper = null;
	}

	$('#timer #min').text(min);
	$('#timer #sec').text((sec < 10 ? '0' : '') + sec);
	$('#timer #ms').text((ms < 10 ? '0' : '') + ms);

	(func || function(){})(d);
}

function startTimer(func) {
	endtime = Date.now() + defaulttime;

	stepper = setInterval(function() {
		displayTime(endtime - Date.now(), func);
	}, 10);
}

function resetTimer(func) {
	displayTime(defaulttime, func);

	endtime = null;
	clearInterval(stepper);
	stepper = null;
}