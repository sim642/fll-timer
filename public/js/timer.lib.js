var endtime = null;
var totaltime = null;
var stepper = null;
var defaulttime = (2 * 60 + 30) * 1000;

function displayTime(d, func) {
	var min = 0, sec = 0, ms = 0;

	if (d > 0) {
		var dd = d;

		ms = Math.floor(d % 1000 / 100);
		d = Math.floor(d / 1000);
		sec = d % 60;
		d = Math.floor(d / 60);
		min = d;

		d = dd;
	}

	$('#timer #min').text(min);
	$('#timer #sec').text((sec < 10 ? '0' : '') + sec);
	$('#timer #ms').text(ms);

	(func || function(){})(d);

	if (d <= 0) {
		endtime = null;
		totaltime = null;
		clearInterval(stepper);
		stepper = null;
	}
}

function startTimer(time, totalTime, func) {
	totaltime = totalTime;
	endtime = Date.now() + time;

	stepper = setInterval(function() {
		displayTime(endtime - Date.now(), func);
	}, 100);
}

function resetTimer(time, totalTime, func) {
	totaltime = totalTime;
	displayTime(time, func);

	endtime = null;
	totaltime = null;
	clearInterval(stepper);
	stepper = null;
}