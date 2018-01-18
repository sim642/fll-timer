var socket = io({
	'sync disconnect on unload': true
});

var audio/* = null*/;
var songs = [];
var songi = 0;

var cntAudio = new Audio('/audio/countdown.mp3');
var cntOffset = -10.0 * 1000;
var cntTimeout = null;
var cntVolume = 0.5;

function tween(d) {
	var t = 1 - d / totaltime;

	var r, g;
	if (t < 0.5) {
		g = 1.0;
		r = 2 * t;
	}
	else {
		r = 1.0;
		g = 1 - 2 * (t - 0.5);
	}

	$('#timer').css('color', 'rgb(' + Math.floor(256 * r) + ', ' + Math.floor(256 * g) + ', 0)');
}

function startAudio() {
	stopAudio();
	if (songi >= 0 && songi < songs.length) { // don't play if no songs listed
		audio = new Audio('/audio/music/' + songs[songi]);
		audio.volume = 1.0;
		audio.play();

		cntTimeout = setTimeout(function() {
			audio.volume = cntVolume;
			cntAudio.play();
		}, defaulttime + cntOffset);
	}
}

function stopAudio() {
	//if (audio !== null && !audio.paused) {
	if (audio) {
		audio.pause();
		audio.currentTime = 0;
		//audio = null;
	}

	clearTimeout(cntTimeout);
	cntTimeout = null;

	if (!cntAudio.paused) {
		cntAudio.pause();
		cntAudio.currentTime = 0;
	}
}

socket.on('resettimer', function(time, totalTime) {
	resetTimer(time, totalTime, tween);
    stopAudio();
});

socket.on('starttimer', function(time, totalTime, audio) {
	resetTimer(time, totalTime, tween);
    stopAudio();

	startTimer(time, totalTime, tween);
	if (audio)
	    startAudio();
});

socket.on('songs', function(data) {
	songs = data;
});

socket.on('songi', function(data) {
	songi = data;
});

$(function() {
	$('#timer').fitText(0.35);
	resetTimer(defaulttime, defaulttime, tween);
});
